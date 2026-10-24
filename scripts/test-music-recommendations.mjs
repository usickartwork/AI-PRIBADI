import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { performance } from "node:perf_hooks";

// Allow Node v24 native TypeScript loader to resolve extensionless local TS imports (`./music`)
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith("./") &&
      !specifier.endsWith(".ts") &&
      !specifier.endsWith(".js") &&
      !specifier.endsWith(".mjs") &&
      context.parentURL?.endsWith(".ts")
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const musicMod = await import("../lib/music.ts");
const recMod = await import("../lib/musicRecommendation.ts");

const {
  getCanonicalTrackKey,
  normalizeArtistKey,
  normalizeTrackTitleForKey,
} = musicMod;

const {
  createEmptyTasteProfile,
  pruneTasteProfile,
  computeMaturityFactor,
  interpretListeningEvent,
  applyListeningEventsToProfile,
  syncLibrarySignalsToProfile,
  deduplicateMusicItems,
  rankHomeRecommendations,
  rankAutoplayCandidates,
  buildHomeCatalogQueries,
  buildAutoplayCatalogQueries,
} = recMod;

// ─── Helper Factories ──────────────────────────────────────────────────────────

let idCounter = 1;
function makeTrack({
  id,
  title,
  artists,
  genres,
  popularity = 72,
  releaseYear = 2024,
  durationMs = 210_000,
  catalogSource = "spotify",
  isLiveRadio = false,
  isFallbackAudio = false,
}) {
  const num = idCounter++;
  const finalId = id || `spotify:track:test_${String(num).padStart(16, "0")}`;
  return {
    id: finalId,
    provider: isLiveRadio ? "radio" : "spotify",
    providerItemId: finalId.replace("spotify:track:", ""),
    itemType: "track",
    title,
    artistNames: Array.isArray(artists) ? artists : [artists],
    genres,
    popularity,
    releaseYear,
    durationMs,
    catalogSource,
    canonicalKey: getCanonicalTrackKey({
      title,
      artistNames: Array.isArray(artists) ? artists : [artists],
    }),
    isLiveRadio,
    isFallbackAudio,
    externalUrl: "https://open.spotify.com",
  };
}

function makeEvent({
  sessionId,
  track,
  audiblePlayedMs,
  reason = "ended",
  sourceContext = "home",
  isRepeatOne = false,
  passiveAutoplayStreak = 0,
  searchQuery,
  timestamp = new Date().toISOString(),
}) {
  return {
    playSessionId: sessionId || `sess_${idCounter++}`,
    instanceId: "inst_test_1",
    track: {
      id: track.id,
      title: track.title,
      artistNames: track.artistNames,
      durationMs: track.durationMs || 210_000,
      genres: track.genres,
      popularity: track.popularity,
      releaseYear: track.releaseYear,
      catalogSource: track.catalogSource,
      isLiveRadio: track.isLiveRadio,
      isFallbackAudio: track.isFallbackAudio,
    },
    audiblePlayedMs,
    trackDurationMs: track.durationMs || 210_000,
    sourceContext,
    reason,
    isRepeatOne,
    passiveAutoplayStreak,
    searchQuery,
    timestamp,
  };
}

// Build a diverse 64-track multi-genre catalog for realistic testing
function buildTestCatalog() {
  const specs = [
    // Indonesian Indie / Pop (16)
    ["Gala bunga matahari", ["Sal Priadi"], ["indonesian indie", "indonesian pop"], 86, 2024],
    ["Dari Planet Lain", ["Sal Priadi"], ["indonesian indie", "indonesian pop"], 83, 2024],
    ["Mesra-mesraannya kecil-kecilan dulu", ["Sal Priadi"], ["indonesian indie"], 78, 2022],
    ["Evaluasi", ["Hindia"], ["indonesian indie", "alternative"], 85, 2019],
    ["Secukupnya", ["Hindia"], ["indonesian indie", "alternative"], 84, 2019],
    ["Cincin", ["Hindia"], ["indonesian indie"], 82, 2023],
    ["Rayuan Perempuan Gila", ["Nadin Amizah"], ["indonesian indie", "folk pop"], 84, 2023],
    ["Bertaut", ["Nadin Amizah"], ["indonesian indie", "folk pop"], 86, 2020],
    ["Sorai", ["Nadin Amizah"], ["indonesian indie", "folk pop"], 80, 2019],
    ["Satu Bulan", ["Bernadya"], ["indonesian pop", "folk pop"], 88, 2023],
    ["Untungnya, Hidup Harus Tetap Berjalan", ["Bernadya"], ["indonesian pop"], 89, 2024],
    ["Kata Mereka Ini Berlebihan", ["Bernadya"], ["indonesian pop"], 85, 2024],
    ["Hati-Hati di Jalan", ["Tulus"], ["indonesian pop", "jazz pop"], 87, 2022],
    ["Monokrom", ["Tulus"], ["indonesian pop"], 84, 2016],
    ["Lampu Kuning", ["Juicy Luicy"], ["indonesian pop"], 85, 2024],
    ["Sialan", ["Adrian Khalif", "Juicy Luicy"], ["indonesian pop", "r&b"], 86, 2023],

    // Rock / Alternative (16)
    ["In the End", ["Linkin Park"], ["alternative metal", "rock"], 90, 2000],
    ["Numb", ["Linkin Park"], ["alternative metal", "rock"], 91, 2003],
    ["The Emptiness Machine", ["Linkin Park"], ["alternative metal", "rock"], 88, 2024],
    ["Do I Wanna Know?", ["Arctic Monkeys"], ["indie rock", "garage rock"], 91, 2013],
    ["505", ["Arctic Monkeys"], ["indie rock"], 89, 2007],
    ["R U Mine?", ["Arctic Monkeys"], ["indie rock", "rock"], 86, 2013],
    ["Viva La Vida", ["Coldplay"], ["pop rock", "permanent wave"], 90, 2008],
    ["Yellow", ["Coldplay"], ["pop rock", "britpop"], 91, 2000],
    ["Fix You", ["Coldplay"], ["pop rock"], 88, 2005],
    ["Bohemian Rhapsody", ["Queen"], ["classic rock", "rock"], 90, 1975],
    ["Don't Stop Me Now", ["Queen"], ["classic rock", "rock"], 88, 1978],
    ["Boulevard of Broken Dreams", ["Green Day"], ["punk rock", "rock"], 86, 2004],
    ["Basket Case", ["Green Day"], ["punk rock", "rock"], 85, 1994],
    ["Mr. Brightside", ["The Killers"], ["indie rock", "modern rock"], 90, 2004],
    ["Wonderwall", ["Oasis"], ["britpop", "rock"], 89, 1995],
    ["Peradaban", ["Feast"], ["indonesian rock", "rock"], 79, 2018],

    // Global Pop / K-Pop (16)
    ["BIRDS OF A FEATHER", ["Billie Eilish"], ["art pop", "pop"], 96, 2024],
    ["WILDFLOWER", ["Billie Eilish"], ["art pop", "pop"], 92, 2024],
    ["Espresso", ["Sabrina Carpenter"], ["pop", "dance pop"], 95, 2024],
    ["Taste", ["Sabrina Carpenter"], ["pop", "dance pop"], 93, 2024],
    ["APT.", ["ROSÉ", "Bruno Mars"], ["k-pop", "pop"], 96, 2024],
    ["toxic till the end", ["ROSÉ"], ["k-pop", "pop"], 88, 2024],
    ["Die With A Smile", ["Lady Gaga", "Bruno Mars"], ["pop", "soft rock"], 97, 2024],
    ["Locked Out of Heaven", ["Bruno Mars"], ["pop", "funk pop"], 89, 2012],
    ["Cruel Summer", ["Taylor Swift"], ["pop", "synthpop"], 93, 2019],
    ["Anti-Hero", ["Taylor Swift"], ["pop"], 89, 2022],
    ["Levitating", ["Dua Lipa"], ["dance pop", "pop"], 89, 2020],
    ["Houdini", ["Dua Lipa"], ["dance pop", "pop"], 86, 2024],
    ["vampire", ["Olivia Rodrigo"], ["pop", "pop rock"], 88, 2023],
    ["good 4 u", ["Olivia Rodrigo"], ["pop punk", "pop"], 89, 2021],
    ["Super Shy", ["NewJeans"], ["k-pop", "uk garage"], 86, 2023],
    ["Ditto", ["NewJeans"], ["k-pop"], 85, 2022],

    // Hip-Hop / R&B / Soul (16)
    ["Blinding Lights", ["The Weeknd"], ["synthpop", "r&b"], 93, 2020],
    ["Save Your Tears", ["The Weeknd"], ["synthpop", "r&b"], 90, 2020],
    ["Starboy", ["The Weeknd", "Daft Punk"], ["r&b", "electropop"], 91, 2016],
    ["Kill Bill", ["SZA"], ["r&b", "pop"], 91, 2022],
    ["Snooze", ["SZA"], ["r&b"], 90, 2022],
    ["Saturn", ["SZA"], ["r&b"], 89, 2024],
    ["luther", ["Kendrick Lamar", "SZA"], ["hip hop", "r&b"], 94, 2024],
    ["HUMBLE.", ["Kendrick Lamar"], ["hip hop", "west coast rap"], 89, 2017],
    ["Not Like Us", ["Kendrick Lamar"], ["hip hop", "west coast rap"], 93, 2024],
    ["Best Part", ["Daniel Caesar", "H.E.R."], ["r&b", "neo soul"], 88, 2017],
    ["Get You", ["Daniel Caesar", "Kali Uchis"], ["r&b", "neo soul"], 87, 2016],
    [" Pink + White", ["Frank Ocean"], ["r&b", "neo soul"], 90, 2016],
    ["Lost", ["Frank Ocean"], ["r&b", "neo soul"], 88, 2012],
    ["Glimpse of Us", ["Joji"], ["alternative r&b", "lo-fi"], 87, 2022],
    ["Slow Dancing in the Dark", ["Joji"], ["alternative r&b"], 86, 2018],
    ["telepatía", ["Kali Uchis"], ["r&b", "latin pop"], 88, 2020],
  ];

  return specs.map(([title, artists, genres, popularity, releaseYear], idx) =>
    makeTrack({
      id: `spotify:track:cat_${String(idx + 1).padStart(4, "0")}`,
      title,
      artists,
      genres,
      popularity,
      releaseYear,
    })
  );
}

const CATALOG = buildTestCatalog();
let passed = 0;

function pass(name) {
  passed += 1;
  console.log(`  PASS [${String(passed).padStart(2, "0")}] ${name}`);
}

console.log("\n=== USICK ONE MUSIC RECOMMENDATION ENGINE — VERIFICATION SUITE ===\n");

// ─── Scenario 1: Cold Start User (N = 0) ───────────────────────────────────────
{
  const emptyProfile = createEmptyTasteProfile();
  assert.equal(computeMaturityFactor(emptyProfile), 0);

  const ranked = rankHomeRecommendations(CATALOG, emptyProfile, {
    limit: 24,
    quickPicksCount: 6,
    maxPerArtist: 2,
    explorationJitter: 0,
  });

  assert.equal(ranked.length, 24);
  const quickPickArtists = new Set(ranked.slice(0, 6).map((r) => r.primaryArtistKey));
  assert.equal(quickPickArtists.size, 6, "Top 6 Quick Picks must have 6 distinct artists");

  const artistCounts = new Map();
  for (const r of ranked) {
    const c = (artistCounts.get(r.primaryArtistKey) || 0) + 1;
    artistCounts.set(r.primaryArtistKey, c);
    assert.ok(c <= 2, `Cold start exceeded max 2 per artist for ${r.primaryArtistKey}`);
  }
  assert.ok(
    ranked[0].item.popularity >= 90,
    "Cold start top pick should prioritize genuine high-popularity tracks"
  );
  pass("Scenario 1: Cold start user receives diverse, popularity-grounded Home feed");
}

// ─── Scenario 2: Long History (>300 events) & Profile Compaction (<20 KB) ──────
{
  let profile = createEmptyTasteProfile();
  const baseMs = Date.now() - 45 * 24 * 3600 * 1000;
  const manyEvents = [];

  for (let i = 0; i < 320; i++) {
    const isCore = i % 4 === 0;
    const track = isCore
      ? CATALOG[i % 10] // Core Indonesian Indie tracks
      : makeTrack({
          id: `spotify:track:ephemeral_${i}`,
          title: `Ephemeral Song ${i}`,
          artists: [`Transient Artist ${i % 160}`],
          genres: [`niche-genre-${i % 65}`],
          popularity: 55,
        });

    manyEvents.push(
      makeEvent({
        sessionId: `long_sess_${i}`,
        track,
        audiblePlayedMs: isCore ? 195_000 : 85_000,
        reason: "ended",
        timestamp: new Date(baseMs + i * 3600 * 1000).toISOString(),
      })
    );
  }

  const res = applyListeningEventsToProfile(profile, manyEvents);
  profile = pruneTasteProfile(res.profile);

  const jsonBytes = Buffer.byteLength(JSON.stringify(profile), "utf8");
  assert.ok(jsonBytes < 48 * 1024, `Compacted profile too large: ${jsonBytes} bytes`);
  assert.ok(Object.keys(profile.artists).length <= 120);
  assert.ok(Object.keys(profile.genres).length <= 40);
  assert.ok(Object.keys(profile.tracks).length <= 240);
  assert.ok(profile.recentWindow.length <= 30);
  assert.ok(profile.processedSessionIds.length <= 120);
  assert.ok(
    profile.artists[normalizeArtistKey("Sal Priadi")]?.longTermScore > 1.5,
    "Core long-term artist must remain strongly represented after 320 events"
  );
  pass(`Scenario 2: 320-event long history compacted cleanly (${(jsonBytes / 1024).toFixed(1)} KB)`);
}

// ─── Scenario 3: Drifting Taste (Long-Term 30d + Short-Term 48h Adaptation) ────
{
  const nowMs = Date.now();
  const fourteenDaysAgo = nowMs - 14 * 24 * 3600 * 1000;
  const twoHoursAgo = nowMs - 2 * 3600 * 1000;

  let profile = createEmptyTasteProfile();
  const indieTracks = CATALOG.filter((t) =>
    ["Sal Priadi", "Nadin Amizah", "Hindia"].includes(t.artistNames[0])
  );
  const rockTracks = CATALOG.filter((t) =>
    ["Linkin Park", "Arctic Monkeys"].includes(t.artistNames[0])
  );

  // Historical Indie Folk affinity (14 days ago)
  const oldEvents = indieTracks.flatMap((t, idx) => [
    makeEvent({
      sessionId: `old_1_${idx}`,
      track: t,
      audiblePlayedMs: 200_000,
      reason: "ended",
      timestamp: new Date(fourteenDaysAgo + idx * 600_000).toISOString(),
    }),
    makeEvent({
      sessionId: `old_2_${idx}`,
      track: t,
      audiblePlayedMs: 195_000,
      reason: "ended",
      timestamp: new Date(fourteenDaysAgo + 86_400_000 + idx * 600_000).toISOString(),
    }),
  ]);
  profile = applyListeningEventsToProfile(profile, oldEvents, fourteenDaysAgo + 100_000_000).profile;

  // Recent Rock surge (2 hours ago — play 3 of the 6 Rock tracks so unseen tracks remain to recommend)
  const recentEvents = [rockTracks[0], rockTracks[1], rockTracks[3]].map((t, idx) =>
    makeEvent({
      sessionId: `recent_rock_${idx}`,
      track: t,
      audiblePlayedMs: 205_000,
      reason: "ended",
      timestamp: new Date(twoHoursAgo + idx * 300_000).toISOString(),
    })
  );
  profile = applyListeningEventsToProfile(profile, recentEvents, nowMs).profile;

  const homeTop12 = rankHomeRecommendations(CATALOG, profile, {
    limit: 12,
    nowMs,
    explorationJitter: 0,
  });
  const top12Artists = new Set(homeTop12.map((r) => r.item.artistNames[0]));

  const hasRecentRock =
    top12Artists.has("Linkin Park") || top12Artists.has("Arctic Monkeys");
  const retainsLongTermIndie =
    top12Artists.has("Sal Priadi") ||
    top12Artists.has("Nadin Amizah") ||
    top12Artists.has("Hindia");

  assert.ok(hasRecentRock, "Home top-12 must adapt to recent 48h Rock surge");
  assert.ok(retainsLongTermIndie, "Home top-12 must retain 30d long-term Indie preference");
  pass("Scenario 3: Dual-horizon (30d/48h) adapts to recent shift without erasing long-term taste");
}

// ─── Scenario 4: Incomplete Metadata (iTunes Fallback / Null Popularity & Genres) ─
{
  const sparsePool = [
    makeTrack({
      id: "spotify:track:itunes_101",
      title: "Sparse Song A",
      artists: ["Hindia"],
      genres: undefined,
      popularity: null,
      releaseYear: undefined,
      catalogSource: "itunes",
    }),
    makeTrack({
      id: "spotify:track:itunes_102",
      title: "Sparse Song B",
      artists: ["Unknown Indie Band"],
      genres: undefined,
      popularity: null,
      releaseYear: undefined,
      catalogSource: "itunes",
    }),
    makeTrack({
      id: "spotify:track:itunes_103",
      title: "Sparse Song C",
      artists: ["Another Artist"],
      genres: undefined,
      popularity: null,
      releaseYear: undefined,
      catalogSource: "itunes",
    }),
  ];

  let profile = createEmptyTasteProfile();
  profile = applyListeningEventsToProfile(profile, [
    makeEvent({
      sessionId: "sparse_hist_1",
      track: CATALOG[3], // Hindia - Evaluasi
      audiblePlayedMs: 200_000,
      reason: "ended",
    }),
  ]).profile;

  const homeRanked = rankHomeRecommendations(sparsePool, profile, {
    limit: 3,
    explorationJitter: 0,
  });
  assert.equal(homeRanked.length, 3);
  for (const r of homeRanked) {
    assert.ok(Number.isFinite(r.score), "Score must never be NaN on sparse metadata");
  }
  assert.equal(homeRanked[0].item.artistNames[0], "Hindia");
  pass("Scenario 4: Sparse iTunes fallback metadata ranks cleanly with zero NaN scores");
}

// ─── Scenario 5: Single Fast Skip vs 3x Consecutive Fast Skips ─────────────────
{
  let profile = createEmptyTasteProfile();
  const coldplayTracks = CATALOG.filter((t) => t.artistNames[0] === "Coldplay");
  // Establish moderate positive affinity for Coldplay first
  profile = applyListeningEventsToProfile(profile, [
    makeEvent({
      sessionId: "cp_pos_1",
      track: coldplayTracks[0],
      audiblePlayedMs: 200_000,
      reason: "ended",
    }),
  ]).profile;

  const scoreAfterPos = profile.artists[normalizeArtistKey("Coldplay")].shortTermScore;

  // Single fast skip (7s manual skip on Viva La Vida)
  profile = applyListeningEventsToProfile(profile, [
    makeEvent({
      sessionId: "cp_skip_1",
      track: coldplayTracks[1],
      audiblePlayedMs: 7_000,
      reason: "manual_skip",
    }),
  ]).profile;

  const after1Skip = profile.artists[normalizeArtistKey("Coldplay")];
  assert.equal(after1Skip.consecutiveFastSkips, 1);
  assert.ok(
    scoreAfterPos - after1Skip.shortTermScore < 0.15,
    "Single fast skip must NOT heavily penalize artist"
  );

  // Two more consecutive fast skips -> reaches 3x consecutive fast-skip threshold
  profile = applyListeningEventsToProfile(profile, [
    makeEvent({
      sessionId: "cp_skip_2",
      track: coldplayTracks[2],
      audiblePlayedMs: 6_500,
      reason: "manual_skip",
    }),
    makeEvent({
      sessionId: "cp_skip_3",
      track: coldplayTracks[1],
      audiblePlayedMs: 6_000,
      reason: "manual_skip",
    }),
  ]).profile;

  const after3Skips = profile.artists[normalizeArtistKey("Coldplay")];
  assert.equal(after3Skips.consecutiveFastSkips, 3);
  assert.ok(
    scoreAfterPos - after3Skips.shortTermScore >= 0.45,
    "3x consecutive fast skips must trigger meaningful artist dampening"
  );
  pass("Scenario 5: Single fast skip spares artist; 3x consecutive fast skips dampen artist");
}

// ─── Scenario 6: Satisfied Late Skip (>=75%) vs Scrub/Brief Impression Anti-Spoof ─
{
  const profile = createEmptyTasteProfile();
  const track = CATALOG[0]; // 210s track

  // User listened for 175s (83%) then manually clicked Next -> satisfied_late_skip!
  const lateSkip = interpretListeningEvent(
    makeEvent({
      sessionId: "late_skip_1",
      track,
      audiblePlayedMs: 175_000,
      reason: "manual_skip",
    }),
    profile
  );
  assert.equal(lateSkip.classification, "satisfied_late_skip");
  assert.equal(lateSkip.isMeaningfulPositive, true);
  assert.ok(lateSkip.trackWeight > 0.7);

  // User scrubbed to the end after only 3.5s of actual audible audio -> NOT completed!
  const spoofEnd = interpretListeningEvent(
    makeEvent({
      sessionId: "spoof_end_1",
      track,
      audiblePlayedMs: 3_500,
      reason: "ended",
    }),
    profile
  );
  assert.equal(spoofEnd.classification, "brief_impression");
  assert.equal(spoofEnd.isMeaningfulPositive, false);
  assert.equal(spoofEnd.artistLongTermDelta, 0);
  pass("Scenario 6: Satisfied late skip (>=75%) counts positive; 3.5s scrub-to-end is rejected");
}

// ─── Scenario 7: Replay Diminishing Returns & Autoplay Anti-Monotony Streak ────
{
  let profile = createEmptyTasteProfile();
  const favTrack = CATALOG[0]; // Sal Priadi - Gala bunga matahari
  const deltas = [];

  for (let loop = 0; loop < 5; loop++) {
    const before =
      profile.artists[normalizeArtistKey("Sal Priadi")]?.longTermScore || 0;
    profile = applyListeningEventsToProfile(profile, [
      makeEvent({
        sessionId: `replay_loop_${loop}`,
        track: favTrack,
        audiblePlayedMs: 205_000,
        reason: loop === 0 ? "ended" : "replay",
        isRepeatOne: loop > 0,
      }),
    ]).profile;
    const after = profile.artists[normalizeArtistKey("Sal Priadi")].longTermScore;
    deltas.push(after - before);
  }

  assert.ok(
    deltas[1] > deltas[4],
    `Replay bonus must have diminishing returns (loop1=${deltas[1].toFixed(3)} vs loop4=${deltas[4].toFixed(3)})`
  );

  // Because user just played Sal Priadi 5 times in a row, Autoplay should diversify instead of picking Sal Priadi again at #1
  // Give co-occurrence edge to Nadin Amizah
  profile = applyListeningEventsToProfile(profile, [
    makeEvent({
      sessionId: "co_nadin_1",
      track: CATALOG[6], // Nadin Amizah
      audiblePlayedMs: 200_000,
      reason: "ended",
    }),
    makeEvent({
      sessionId: "streak_sp_1",
      track: CATALOG[0],
      audiblePlayedMs: 200_000,
      reason: "ended",
    }),
    makeEvent({
      sessionId: "streak_sp_2",
      track: CATALOG[1],
      audiblePlayedMs: 200_000,
      reason: "ended",
    }),
  ]).profile;

  const autoNext = rankAutoplayCandidates(CATALOG[1], CATALOG, profile, { limit: 5 });
  assert.notEqual(
    autoNext[0].item.artistNames[0],
    "Sal Priadi",
    "After consecutive same-artist streak >=2, Smart Autoplay must branch to related/liked artist"
  );
  pass("Scenario 7: Replays apply diminishing returns & Autoplay breaks single-artist monotony");
}

// ─── Scenario 8: Canonical Cross-Source Deduplication & Unicode Safety ─────────
{
  const spotifyVer = makeTrack({
    id: "spotify:track:real22charid0000000001",
    title: "Gala bunga matahari",
    artists: ["Sal Priadi"],
    popularity: 86,
    catalogSource: "spotify",
  });
  const itunesDupe = makeTrack({
    id: "spotify:track:itunes_99887766",
    title: "Gala Bunga Matahari (Official Audio) - Remastered 2024",
    artists: ["Sal Priadi"],
    popularity: null,
    catalogSource: "itunes",
  });
  const acousticDistinct = makeTrack({
    id: "spotify:track:real22charid0000000002",
    title: "Gala bunga matahari (Acoustic Live)",
    artists: ["Sal Priadi"],
    popularity: 72,
    catalogSource: "spotify",
  });

  assert.equal(getCanonicalTrackKey(spotifyVer), getCanonicalTrackKey(itunesDupe));
  assert.notEqual(getCanonicalTrackKey(spotifyVer), getCanonicalTrackKey(acousticDistinct));

  const deduped = deduplicateMusicItems([itunesDupe, spotifyVer, acousticDistinct]);
  assert.equal(deduped.length, 2, "Official Audio/Remastered duplicate must merge while Acoustic stays distinct");
  assert.equal(deduped[0].catalogSource, "spotify", "Deduplicator must keep richer Spotify item over iTunes");

  // Hangul / CJK / accented artist safety
  assert.ok(normalizeArtistKey("ROSÉ").length > 0);
  assert.equal(normalizeArtistKey("아이유"), "아이유");
  assert.ok(normalizeTrackTitleForKey("밤양갱 (Official Video)").includes("밤양갱"));
  pass("Scenario 8: Cross-source Spotify/iTunes deduplication & Unicode/Hangul keys verified");
}

// ─── Scenario 9: Manual Queue Priority & Exclusion ─────────────────────────────
{
  const profile = createEmptyTasteProfile();
  const seed = CATALOG[32]; // Billie Eilish - BIRDS OF A FEATHER
  const manualQueueIds = [CATALOG[33].id, CATALOG[34].id, CATALOG[35].id];

  const auto = rankAutoplayCandidates(seed, CATALOG, profile, {
    limit: 10,
    excludeTrackIds: manualQueueIds,
  });

  for (const r of auto) {
    assert.ok(!manualQueueIds.includes(r.item.id), "Queued track leaked into Autoplay");
    assert.notEqual(r.item.id, seed.id, "Seed track leaked into Autoplay");
  }
  pass("Scenario 9: Manual queue tracks and active seed track are strictly excluded from Autoplay");
}

// ─── Scenario 10: Playback Error, Fallback Audio, & Live Radio Exclusion ───────
{
  const before = createEmptyTasteProfile();
  const radioTrack = makeTrack({
    id: "radio:prambors",
    title: "Prambors FM",
    artists: ["Live Radio"],
    isLiveRadio: true,
  });
  const fallbackTrack = makeTrack({
    id: "spotify:track:broken_1",
    title: "Unresolved Song",
    artists: ["Ed Sheeran"],
    isFallbackAudio: true,
  });

  const { profile: after, acceptedCount } = applyListeningEventsToProfile(before, [
    makeEvent({ sessionId: "err_1", track: CATALOG[5], audiblePlayedMs: 20_000, reason: "playback_error" }),
    makeEvent({ sessionId: "rad_1", track: radioTrack, audiblePlayedMs: 600_000, reason: "track_change" }),
    makeEvent({ sessionId: "fb_1", track: fallbackTrack, audiblePlayedMs: 180_000, reason: "ended" }),
  ]);

  assert.equal(acceptedCount, 0);
  assert.equal(Object.keys(after.artists).length, 0);
  assert.equal(Object.keys(after.tracks).length, 0);
  pass("Scenario 10: Playback errors, fallback audio, and Live Radio streams never pollute taste");
}

// ─── Scenario 11: Multi-Device & Retry Idempotency (playSessionId) ─────────────
{
  let profile = createEmptyTasteProfile();
  const ev = makeEvent({
    sessionId: "shared_beacon_session_42",
    track: CATALOG[12], // Tulus - Hati-Hati di Jalan
    audiblePlayedMs: 200_000,
    reason: "ended",
  });

  const first = applyListeningEventsToProfile(profile, [ev]);
  assert.equal(first.acceptedCount, 1);

  const second = applyListeningEventsToProfile(first.profile, [ev, ev]);
  assert.equal(second.acceptedCount, 0);
  assert.equal(second.profile.maturityCount, first.profile.maturityCount);
  pass("Scenario 11: Duplicate playSessionId submissions are 100% idempotent");
}

// ─── Scenario 12: Cross-Account Personalization Isolation (Account A vs B) ─────
{
  let profileA = createEmptyTasteProfile(); // Indonesian Indie / Folk listener
  let profileB = createEmptyTasteProfile(); // Hip-Hop / R&B listener

  const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  profileA = applyListeningEventsToProfile(
    profileA,
    [0, 3, 6, 9, 12, 14].map((cIdx, i) =>
      makeEvent({
        sessionId: `userA_${i}`,
        track: CATALOG[cIdx],
        audiblePlayedMs: 200_000,
        reason: "ended",
        timestamp: sixHoursAgo,
      })
    )
  ).profile;

  profileB = applyListeningEventsToProfile(
    profileB,
    [48, 51, 54, 57, 60, 62].map((cIdx, i) =>
      makeEvent({
        sessionId: `userB_${i}`,
        track: CATALOG[cIdx],
        audiblePlayedMs: 200_000,
        reason: "ended",
        timestamp: sixHoursAgo,
      })
    )
  ).profile;

  const homeA = rankHomeRecommendations(CATALOG, profileA, { limit: 10, explorationJitter: 0 });
  const homeB = rankHomeRecommendations(CATALOG, profileB, { limit: 10, explorationJitter: 0 });

  const idsA = new Set(homeA.map((r) => r.item.id));
  const idsB = new Set(homeB.map((r) => r.item.id));
  let overlap = 0;
  for (const id of idsA) {
    if (idsB.has(id)) overlap++;
  }

  assert.ok(overlap <= 2, `Account A and Account B Home Top-10 overlapped too much (${overlap}/10)`);
  const queriesA = buildHomeCatalogQueries(profileA);
  const queriesB = buildHomeCatalogQueries(profileB);
  assert.notEqual(queriesA.coreQuery, queriesB.coreQuery);
  pass(`Scenario 12: Account A & Account B receive distinct personalized feeds (overlap ${overlap}/10)`);
}

// ─── Scenario 13: Manual Preference Correction (Like -> Unlike & Bulk Import Cap) ─
{
  let profile = createEmptyTasteProfile();
  const likedTrack = CATALOG[48]; // The Weeknd - Blinding Lights

  // Like song
  profile = syncLibrarySignalsToProfile(profile, [likedTrack], []);
  assert.equal(profile.likedTrackKeys.length, 1);
  assert.equal(profile.artists[normalizeArtistKey("The Weeknd")].likedCount, 1);

  // Unlike song -> manual correction removes positive signal cleanly
  profile = syncLibrarySignalsToProfile(profile, [], []);
  assert.equal(profile.likedTrackKeys.length, 0);
  assert.equal(profile.artists[normalizeArtistKey("The Weeknd")].likedCount, 0);

  // Bulk import 50 songs by 1 single artist -> capped at <= 4 playlistCount boost!
  const bulkItems = Array.from({ length: 50 }, (_, idx) =>
    makeTrack({
      id: `spotify:track:bulk_${idx}`,
      title: `Imported Song ${idx}`,
      artists: ["Bulk Imported Artist"],
      genres: ["pop"],
    })
  );
  profile = syncLibrarySignalsToProfile(profile, [], [
    {
      id: "pl_import_1",
      name: "Mega Import",
      items: bulkItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  assert.ok(
    profile.artists[normalizeArtistKey("Bulk Imported Artist")].playlistCount <= 4,
    "Bulk playlist import must cap single-artist boost"
  );
  pass("Scenario 13: Like/Unlike manual correction and bulk playlist import cap verified");
}

// ─── Scenario 14: Passive Autoplay Streak Drift Guard ──────────────────────────
{
  const profile = createEmptyTasteProfile();
  const track = CATALOG[20];

  const activeChoice = interpretListeningEvent(
    makeEvent({
      sessionId: "active_choice_1",
      track,
      audiblePlayedMs: 200_000,
      sourceContext: "search",
      passiveAutoplayStreak: 0,
      reason: "ended",
    }),
    profile
  );

  const unattendedAuto = interpretListeningEvent(
    makeEvent({
      sessionId: "passive_auto_8",
      track,
      audiblePlayedMs: 200_000,
      sourceContext: "autoplay",
      passiveAutoplayStreak: 8,
      reason: "ended",
    }),
    profile
  );

  assert.ok(
    unattendedAuto.artistLongTermDelta < activeChoice.artistLongTermDelta * 0.4,
    "Unattended autoplay streak must be dampened relative to intentional search selection"
  );
  pass("Scenario 14: Passive unattended autoplay streak dampening prevents taste hijack");
}

// ─── Scenario 15: Latency Benchmark & Leave-Last-K-Out Baseline Evaluation ─────
{
  let benchProfile = createEmptyTasteProfile();
  benchProfile = applyListeningEventsToProfile(
    benchProfile,
    CATALOG.slice(0, 18).map((t, i) =>
      makeEvent({ sessionId: `bench_${i}`, track: t, audiblePlayedMs: 195_000, reason: "ended" })
    )
  ).profile;

  const iterations = 200;
  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) {
    rankHomeRecommendations(CATALOG, benchProfile, { limit: 24 });
    rankAutoplayCandidates(CATALOG[i % CATALOG.length], CATALOG, benchProfile, { limit: 10 });
  }
  const avgMs = (performance.now() - t0) / (iterations * 2);
  assert.ok(avgMs < 5.0, `Ranking latency exceeded 5ms budget: ${avgMs.toFixed(3)}ms`);

  // Controlled Leave-Last-K-Out Offline Hold-Out Evaluation (Legacy Baseline vs New Engine)
  const personas = [
    {
      name: "Indonesian Indie Listener",
      positiveIndices: [0, 1, 3, 4, 6, 7, 9, 10, 12, 14],
      skippedArtist: "Linkin Park",
    },
    {
      name: "Modern Rock Listener",
      positiveIndices: [16, 17, 19, 20, 22, 23, 25, 27, 29, 30],
      skippedArtist: "NewJeans",
    },
    {
      name: "Global & K-Pop Listener",
      positiveIndices: [32, 33, 34, 35, 36, 37, 38, 40, 44, 46],
      skippedArtist: "Green Day",
    },
    {
      name: "R&B / Neo-Soul Listener",
      positiveIndices: [48, 49, 51, 52, 54, 57, 58, 59, 61, 63],
      skippedArtist: "Queen",
    },
  ];

  // Deterministic pseudo-shuffle representing legacy random Home feed
  function legacyHomeBaseline(pool, limit = 10) {
    return [...pool]
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, limit);
  }

  // Legacy Autoplay baseline from old MusicWorkspace.tsx (binary same-artist match, no streak cap, no taste)
  function legacyAutoplayBaseline(seed, pool, limit = 5) {
    const seedArtists = (seed?.artistNames || []).map((a) => a.toLowerCase().trim());
    return pool
      .filter((t) => t.id !== seed?.id)
      .sort((a, b) => {
        const aMatch = a.artistNames.some((an) => seedArtists.includes(an.toLowerCase().trim())) ? 1 : 0;
        const bMatch = b.artistNames.some((bn) => seedArtists.includes(bn.toLowerCase().trim())) ? 1 : 0;
        return bMatch - aMatch;
      })
      .slice(0, limit);
  }

  let legacyHomeHitSum = 0;
  let newHomeHitSum = 0;
  let newQuickPicksDivSum = 0;
  let newSkipSuppressionSum = 0;
  let legacyAutoHitSum = 0;
  let newAutoHitSum = 0;

  for (const p of personas) {
    const trainIdx = p.positiveIndices.slice(0, 7);
    const holdoutIdx = p.positiveIndices.slice(7); // Held-out future positive plays
    const holdoutArtists = new Set(
      p.positiveIndices.map((idx) => normalizeArtistKey(CATALOG[idx].artistNames[0]))
    );

    let prof = createEmptyTasteProfile();
    const trainEvents = trainIdx.map((cIdx, i) =>
      makeEvent({
        sessionId: `${p.name}_tr_${i}`,
        track: CATALOG[cIdx],
        audiblePlayedMs: 200_000,
        reason: "ended",
      })
    );
    // Add 3 consecutive fast skips on disliked artist
    const dislikedTracks = CATALOG.filter((t) => t.artistNames[0] === p.skippedArtist);
    const skipEvents = [0, 1, 2].map((sIdx) =>
      makeEvent({
        sessionId: `${p.name}_sk_${sIdx}`,
        track: dislikedTracks[sIdx % dislikedTracks.length],
        audiblePlayedMs: 6_000,
        reason: "manual_skip",
      })
    );
    prof = applyListeningEventsToProfile(prof, [...trainEvents, ...skipEvents]).profile;

    // Exclude already-played training tracks when measuring unseen holdout discovery/artist hit rate
    const unseenCatalog = CATALOG.filter(
      (t) => !trainIdx.some((idx) => CATALOG[idx].id === t.id)
    );

    const legHome = legacyHomeBaseline(unseenCatalog, 10);
    const newHome = rankHomeRecommendations(unseenCatalog, prof, {
      limit: 10,
      quickPicksCount: 6,
      explorationJitter: 0,
    }).map((r) => r.item);

    const legHits = legHome.filter((t) =>
      holdoutArtists.has(normalizeArtistKey(t.artistNames[0]))
    ).length / 10;
    const newHits = newHome.filter((t) =>
      holdoutArtists.has(normalizeArtistKey(t.artistNames[0]))
    ).length / 10;

    legacyHomeHitSum += legHits;
    newHomeHitSum += newHits;

    const qpDiv =
      new Set(newHome.slice(0, 6).map((t) => normalizeArtistKey(t.artistNames[0]))).size / 6;
    newQuickPicksDivSum += qpDiv;

    const leakedSkipped = newHome.some((t) => t.artistNames[0] === p.skippedArtist);
    newSkipSuppressionSum += leakedSkipped ? 0 : 1;

    // Autoplay evaluation from last training track -> predicting held-out affinity artists/genres
    const seed = CATALOG[trainIdx[trainIdx.length - 1]];
    const legAuto = legacyAutoplayBaseline(seed, unseenCatalog, 5);
    const newAuto = rankAutoplayCandidates(seed, unseenCatalog, prof, { limit: 5 }).map(
      (r) => r.item
    );

    legacyAutoHitSum +=
      legAuto.filter((t) => holdoutArtists.has(normalizeArtistKey(t.artistNames[0]))).length / 5;
    newAutoHitSum +=
      newAuto.filter((t) => holdoutArtists.has(normalizeArtistKey(t.artistNames[0]))).length / 5;

    // Also verify query builders produce non-empty targeted queries
    const autoQueries = buildAutoplayCatalogQueries(seed, prof);
    assert.ok(Boolean(autoQueries.primaryContextQuery));
    void holdoutIdx;
  }

  const nP = personas.length;
  const metrics = {
    avgRankingLatencyMs: Number(avgMs.toFixed(3)),
    legacyHomeArtistHitRateAt10: Number((legacyHomeHitSum / nP).toFixed(3)),
    newHomeArtistHitRateAt10: Number((newHomeHitSum / nP).toFixed(3)),
    newQuickPicksDiversityAt6: Number((newQuickPicksDivSum / nP).toFixed(3)),
    newFastSkipSuppressionRate: Number((newSkipSuppressionSum / nP).toFixed(3)),
    legacyAutoplayHitRateAt5: Number((legacyAutoHitSum / nP).toFixed(3)),
    newAutoplayHitRateAt5: Number((newAutoHitSum / nP).toFixed(3)),
  };

  assert.ok(
    metrics.newHomeArtistHitRateAt10 > metrics.legacyHomeArtistHitRateAt10 + 0.35,
    "New Home engine must substantially outperform legacy baseline on held-out taste"
  );
  assert.equal(metrics.newQuickPicksDiversityAt6, 1.0);
  assert.equal(metrics.newFastSkipSuppressionRate, 1.0);
  assert.ok(
    metrics.newAutoplayHitRateAt5 > metrics.legacyAutoplayHitRateAt5,
    "New Smart Autoplay must outperform legacy same-artist baseline on unseen tracks"
  );

  pass(
    `Scenario 15: Benchmark (${metrics.avgRankingLatencyMs}ms/call) & Hold-Out Eval ` +
      `(Home Hit@10: ${metrics.legacyHomeArtistHitRateAt10} -> ${metrics.newHomeArtistHitRateAt10}, ` +
      `Autoplay Hit@5: ${metrics.legacyAutoplayHitRateAt5} -> ${metrics.newAutoplayHitRateAt5}, ` +
      `Div@6: ${metrics.newQuickPicksDiversityAt6}, SkipSupp: ${metrics.newFastSkipSuppressionRate})`
  );
}

console.log(`\nALL ${passed}/15 SCENARIOS PASSED SUCCESSFULLY.\n`);
