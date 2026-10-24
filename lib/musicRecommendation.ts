// ─── Usick One Music — Personal Taste Profile, Telemetry & Ranking Engine ─────
// Pure, zero-dependency TypeScript module shared by server routes, client hooks,
// and offline evaluation tests. Uses relative imports for direct Node ESM execution.

import {
  type LocalPlaylist,
  type MusicItem,
  getCanonicalTrackKey,
  normalizeArtistKey,
  normalizeGenreTag,
} from "./music";

// ─── Constants & Caps ──────────────────────────────────────────────────────────

export const TASTE_PROFILE_VERSION = 1 as const;

export const MAX_ARTIST_AFFINITIES = 40;
export const MAX_GENRE_AFFINITIES = 24;
export const MAX_TRACK_SIGNALS = 48;
export const MAX_RECENT_WINDOW = 20;
export const MAX_PROCESSED_SESSIONS = 60;
export const MAX_COOCCURRENCE_NEIGHBORS = 5;
export const MAX_RECENT_SEARCH_SIGNALS = 10;

// Half-life constants (in hours) for dual-horizon exponential decay
export const LONG_TERM_HALF_LIFE_HOURS = 24 * 30; // 30 days (720 hours)
export const SHORT_TERM_HALF_LIFE_HOURS = 48; // 48 hours

// Saturation scales for tanh normalization into [-1, 1]
const ARTIST_LT_SCALE = 3.2;
const ARTIST_ST_SCALE = 1.8;
const GENRE_LT_SCALE = 3.0;
const GENRE_ST_SCALE = 1.8;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ListeningSourceContext =
  | "home"
  | "autoplay"
  | "search"
  | "playlist"
  | "liked"
  | "queue"
  | "artist"
  | "album"
  | "unknown";

export type ListeningEndReason =
  | "ended"
  | "manual_skip"
  | "track_change"
  | "replay"
  | "playback_error"
  | "page_unload";

export type FeedbackClassification =
  | "ignored"
  | "brief_impression"
  | "fast_skip"
  | "early_skip"
  | "partial_listen"
  | "satisfied_late_skip"
  | "engaged_listen"
  | "completed";

export interface ListeningEventTrackMeta {
  id: string;
  title: string;
  artistNames: string[];
  artistIds?: string[];
  albumTitle?: string;
  albumId?: string;
  releaseYear?: number;
  durationMs?: number;
  genres?: string[];
  popularity?: number | null;
  catalogSource?: MusicItem["catalogSource"];
  canonicalKey?: string;
  isLiveRadio?: boolean;
  isFallbackAudio?: boolean;
}

export interface MusicListeningEventInput {
  playSessionId: string;
  instanceId?: string;
  track: ListeningEventTrackMeta;
  audiblePlayedMs: number;
  trackDurationMs?: number;
  sourceContext?: ListeningSourceContext;
  reason: ListeningEndReason;
  isRepeatOne?: boolean;
  passiveAutoplayStreak?: number;
  searchQuery?: string;
  timestamp?: string;
}

export interface InterpretedListeningFeedback {
  valid: boolean;
  classification: FeedbackClassification;
  canonicalKey: string;
  primaryArtistKey: string;
  completionRatio: number;
  audibleSeconds: number;
  durationSeconds: number;
  trackWeight: number;
  artistLongTermDelta: number;
  artistShortTermDelta: number;
  genreDelta: number;
  isMeaningfulPositive: boolean;
  isFastSkip: boolean;
  isReplay: boolean;
}

export interface ArtistAffinityEntry {
  artistKey: string;
  displayName: string;
  spotifyArtistId?: string;
  longTermScore: number;
  shortTermScore: number;
  playCount: number;
  completionCount: number;
  fastSkipCount: number;
  consecutiveFastSkips: number;
  likedCount: number;
  playlistCount: number;
  genres?: string[];
  lastUpdatedAt: string;
  lastPositiveAt?: string | null;
  lastSkippedAt?: string | null;
}

export interface GenreAffinityEntry {
  genreKey: string;
  longTermScore: number;
  shortTermScore: number;
  sampleCount: number;
  lastUpdatedAt: string;
}

export interface TrackSignalEntry {
  canonicalKey: string;
  trackId: string;
  title: string;
  primaryArtistKey: string;
  artistDisplayName: string;
  playCount: number;
  replayCount: number;
  completionCount: number;
  fastSkipCount: number;
  consecutiveFastSkips: number;
  avgCompletionRatio: number;
  lastPlayedAt?: string | null;
  lastSkippedAt?: string | null;
  lastImpressedAt?: string | null;
}

export interface RecentPlayEntry {
  playSessionId: string;
  canonicalKey: string;
  trackId: string;
  artistKey: string;
  genres?: string[];
  sourceContext: ListeningSourceContext;
  reason: ListeningEndReason;
  classification: FeedbackClassification;
  completionRatio: number;
  weight: number;
  timestamp: string;
}

export interface MusicTasteProfileV1 {
  version: typeof TASTE_PROFILE_VERSION;
  updatedAt: string;
  maturityCount: number;
  artists: Record<string, ArtistAffinityEntry>;
  genres: Record<string, GenreAffinityEntry>;
  tracks: Record<string, TrackSignalEntry>;
  likedTrackKeys: string[];
  playlistTrackKeys: string[];
  cooccurrence: Record<string, Record<string, number>>;
  recentWindow: RecentPlayEntry[];
  recentSearchQueries: string[];
  processedSessionIds: string[];
}

export interface ScoredCandidate {
  item: MusicItem;
  canonicalKey: string;
  primaryArtistKey: string;
  score: number;
  personalScore: number;
  contextScore: number;
  catalogScore: number;
  isDiscovery: boolean;
  isFamiliarSaved: boolean;
}

export interface HomeRankingOptions {
  limit?: number;
  quickPicksCount?: number;
  maxPerArtist?: number;
  nowMs?: number;
  explorationJitter?: number;
  seed?: number;
}

export interface AutoplayRankingOptions {
  limit?: number;
  excludeTrackIds?: Iterable<string>;
  sessionRecentKeys?: Iterable<string>;
  nowMs?: number;
}

// ─── Math & Decay Utilities ────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function computeHalfLifeDecay(
  previousScore: number,
  elapsedMs: number,
  halfLifeHours: number
): number {
  if (!Number.isFinite(previousScore) || previousScore === 0) return 0;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return previousScore;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const factor = Math.pow(2, -elapsedHours / Math.max(1, halfLifeHours));
  return previousScore * factor;
}

function softNormalize(rawScore: number, scale: number): number {
  if (!Number.isFinite(rawScore) || rawScore === 0) return 0;
  return Math.tanh(rawScore / Math.max(0.1, scale));
}

function deterministicHashFloat(input: string, seed = 0): number {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function computeMaturityFactor(profile: MusicTasteProfileV1): number {
  const effectiveInteractions =
    Math.max(0, profile.maturityCount || 0) +
    0.85 * Math.min(40, profile.likedTrackKeys?.length || 0) +
    0.35 * Math.min(40, profile.playlistTrackKeys?.length || 0);
  if (effectiveInteractions <= 0) return 0;
  return clamp(1 - Math.exp(-effectiveInteractions / 6), 0, 1);
}

// ─── Profile Lifecycle & Sanitization ──────────────────────────────────────────

export function createEmptyTasteProfile(nowIso = new Date().toISOString()): MusicTasteProfileV1 {
  return {
    version: TASTE_PROFILE_VERSION,
    updatedAt: nowIso,
    maturityCount: 0,
    artists: {},
    genres: {},
    tracks: {},
    likedTrackKeys: [],
    playlistTrackKeys: [],
    cooccurrence: {},
    recentWindow: [],
    recentSearchQueries: [],
    processedSessionIds: [],
  };
}

export function sanitizeTasteProfile(raw: unknown): MusicTasteProfileV1 {
  const fallback = createEmptyTasteProfile();
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Partial<MusicTasteProfileV1>;
  return {
    version: TASTE_PROFILE_VERSION,
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : fallback.updatedAt,
    maturityCount:
      typeof obj.maturityCount === "number" && Number.isFinite(obj.maturityCount)
        ? Math.max(0, Math.floor(obj.maturityCount))
        : 0,
    artists: obj.artists && typeof obj.artists === "object" ? { ...obj.artists } : {},
    genres: obj.genres && typeof obj.genres === "object" ? { ...obj.genres } : {},
    tracks: obj.tracks && typeof obj.tracks === "object" ? { ...obj.tracks } : {},
    likedTrackKeys: Array.isArray(obj.likedTrackKeys)
      ? obj.likedTrackKeys.filter((k): k is string => typeof k === "string").slice(0, 500)
      : [],
    playlistTrackKeys: Array.isArray(obj.playlistTrackKeys)
      ? obj.playlistTrackKeys.filter((k): k is string => typeof k === "string").slice(0, 800)
      : [],
    cooccurrence:
      obj.cooccurrence && typeof obj.cooccurrence === "object" ? { ...obj.cooccurrence } : {},
    recentWindow: Array.isArray(obj.recentWindow)
      ? obj.recentWindow.slice(0, MAX_RECENT_WINDOW)
      : [],
    recentSearchQueries: Array.isArray(obj.recentSearchQueries)
      ? obj.recentSearchQueries
          .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
          .slice(0, MAX_RECENT_SEARCH_SIGNALS)
      : [],
    processedSessionIds: Array.isArray(obj.processedSessionIds)
      ? obj.processedSessionIds
          .filter((id): id is string => typeof id === "string")
          .slice(0, MAX_PROCESSED_SESSIONS)
      : [],
  };
}

export function pruneTasteProfile(
  profile: MusicTasteProfileV1,
  nowMs = Date.now()
): MusicTasteProfileV1 {
  // 1. Prune artists to top MAX_ARTIST_AFFINITIES by combined decayed magnitude + library presence
  const artistEntries = Object.values(profile.artists);
  if (artistEntries.length > MAX_ARTIST_AFFINITIES) {
    artistEntries.sort((a, b) => {
      const aElapsed = Math.max(0, nowMs - (Date.parse(a.lastUpdatedAt) || nowMs));
      const bElapsed = Math.max(0, nowMs - (Date.parse(b.lastUpdatedAt) || nowMs));
      const aMag =
        Math.abs(computeHalfLifeDecay(a.longTermScore, aElapsed, LONG_TERM_HALF_LIFE_HOURS)) +
        Math.abs(computeHalfLifeDecay(a.shortTermScore, aElapsed, SHORT_TERM_HALF_LIFE_HOURS)) +
        (a.likedCount > 0 ? 1.5 : 0) +
        (a.playlistCount > 0 ? 0.8 : 0);
      const bMag =
        Math.abs(computeHalfLifeDecay(b.longTermScore, bElapsed, LONG_TERM_HALF_LIFE_HOURS)) +
        Math.abs(computeHalfLifeDecay(b.shortTermScore, bElapsed, SHORT_TERM_HALF_LIFE_HOURS)) +
        (b.likedCount > 0 ? 1.5 : 0) +
        (b.playlistCount > 0 ? 0.8 : 0);
      return bMag - aMag;
    });
    const nextArtists: Record<string, ArtistAffinityEntry> = {};
    for (const entry of artistEntries.slice(0, MAX_ARTIST_AFFINITIES)) {
      nextArtists[entry.artistKey] = entry;
    }
    profile.artists = nextArtists;
  }

  // 2. Prune genres to MAX_GENRE_AFFINITIES
  const genreEntries = Object.values(profile.genres);
  if (genreEntries.length > MAX_GENRE_AFFINITIES) {
    genreEntries.sort(
      (a, b) =>
        Math.abs(b.longTermScore) +
        Math.abs(b.shortTermScore) -
        (Math.abs(a.longTermScore) + Math.abs(a.shortTermScore))
    );
    const nextGenres: Record<string, GenreAffinityEntry> = {};
    for (const g of genreEntries.slice(0, MAX_GENRE_AFFINITIES)) {
      nextGenres[g.genreKey] = g;
    }
    profile.genres = nextGenres;
  }

  // 3. Prune tracks to MAX_TRACK_SIGNALS by recency & signal importance
  const trackEntries = Object.values(profile.tracks);
  if (trackEntries.length > MAX_TRACK_SIGNALS) {
    const likedSet = new Set(profile.likedTrackKeys);
    trackEntries.sort((a, b) => {
      const aTs = Date.parse(a.lastPlayedAt || a.lastSkippedAt || a.lastImpressedAt || "") || 0;
      const bTs = Date.parse(b.lastPlayedAt || b.lastSkippedAt || b.lastImpressedAt || "") || 0;
      const aBoost = (likedSet.has(a.canonicalKey) ? 7 * 86400000 : 0) + a.playCount * 3600000;
      const bBoost = (likedSet.has(b.canonicalKey) ? 7 * 86400000 : 0) + b.playCount * 3600000;
      return bTs + bBoost - (aTs + aBoost);
    });
    const nextTracks: Record<string, TrackSignalEntry> = {};
    for (const t of trackEntries.slice(0, MAX_TRACK_SIGNALS)) {
      const compact: TrackSignalEntry = {
        canonicalKey: t.canonicalKey,
        trackId: t.trackId,
        title: t.title.slice(0, 80),
        primaryArtistKey: t.primaryArtistKey,
        artistDisplayName: t.artistDisplayName.slice(0, 60),
        playCount: t.playCount,
        replayCount: t.replayCount,
        completionCount: t.completionCount,
        fastSkipCount: t.fastSkipCount,
        consecutiveFastSkips: t.consecutiveFastSkips,
        avgCompletionRatio: t.avgCompletionRatio,
        ...(t.lastPlayedAt ? { lastPlayedAt: t.lastPlayedAt } : {}),
        ...(t.lastSkippedAt ? { lastSkippedAt: t.lastSkippedAt } : {}),
      };
      nextTracks[t.canonicalKey] = compact;
    }
    profile.tracks = nextTracks;
  }

  // 4. Trim co-occurrence graph strictly to retained artists and top neighbors
  const trimmedCo: Record<string, Record<string, number>> = {};
  const retainedArtists = new Set(Object.keys(profile.artists));
  for (const aKey of Object.keys(profile.cooccurrence)) {
    if (!retainedArtists.has(aKey)) continue;
    const neighbors = Object.entries(profile.cooccurrence[aKey] || {})
      .filter(
        ([nKey, w]) =>
          nKey !== aKey &&
          retainedArtists.has(nKey) &&
          Number.isFinite(w) &&
          w > 0.05
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_COOCCURRENCE_NEIGHBORS);
    if (neighbors.length > 0) {
      trimmedCo[aKey] = Object.fromEntries(
        neighbors.map(([k, w]) => [k, Math.round(w * 1000) / 1000])
      );
    }
  }
  profile.cooccurrence = trimmedCo;

  profile.recentWindow = profile.recentWindow.slice(0, MAX_RECENT_WINDOW);
  profile.recentSearchQueries = profile.recentSearchQueries.slice(0, MAX_RECENT_SEARCH_SIGNALS);
  profile.processedSessionIds = profile.processedSessionIds.slice(0, MAX_PROCESSED_SESSIONS);

  return profile;
}

// ─── Event Validation & Feedback Interpretation ────────────────────────────────

const VALID_SOURCES = new Set<ListeningSourceContext>([
  "home",
  "autoplay",
  "search",
  "playlist",
  "liked",
  "queue",
  "artist",
  "album",
  "unknown",
]);

const VALID_REASONS = new Set<ListeningEndReason>([
  "ended",
  "manual_skip",
  "track_change",
  "replay",
  "playback_error",
  "page_unload",
]);

export function validateListeningEventInput(
  raw: unknown
): MusicListeningEventInput | null {
  if (!raw || typeof raw !== "object") return null;
  const ev = raw as Partial<MusicListeningEventInput>;

  if (typeof ev.playSessionId !== "string" || ev.playSessionId.trim().length < 6) {
    return null;
  }
  if (!ev.track || typeof ev.track !== "object") return null;
  if (typeof ev.track.id !== "string" || !ev.track.id.trim()) return null;
  if (typeof ev.track.title !== "string" || !ev.track.title.trim()) return null;
  if (!Array.isArray(ev.track.artistNames) || ev.track.artistNames.length === 0) return null;

  const reason: ListeningEndReason = VALID_REASONS.has(ev.reason as ListeningEndReason)
    ? (ev.reason as ListeningEndReason)
    : "track_change";

  const sourceContext: ListeningSourceContext = VALID_SOURCES.has(
    ev.sourceContext as ListeningSourceContext
  )
    ? (ev.sourceContext as ListeningSourceContext)
    : "unknown";

  const rawDuration =
    typeof ev.trackDurationMs === "number" && ev.trackDurationMs > 0
      ? ev.trackDurationMs
      : typeof ev.track.durationMs === "number" && ev.track.durationMs > 0
      ? ev.track.durationMs
      : 210_000;

  const trackDurationMs = clamp(rawDuration, 15_000, 3_600_000);
  const rawAudible =
    typeof ev.audiblePlayedMs === "number" && Number.isFinite(ev.audiblePlayedMs)
      ? ev.audiblePlayedMs
      : 0;
  const audiblePlayedMs = clamp(rawAudible, 0, trackDurationMs * 1.25);

  return {
    playSessionId: ev.playSessionId.trim().slice(0, 96),
    instanceId: typeof ev.instanceId === "string" ? ev.instanceId.slice(0, 80) : undefined,
    track: {
      id: ev.track.id.trim().slice(0, 128),
      title: ev.track.title.trim().slice(0, 200),
      artistNames: ev.track.artistNames
        .filter((a): a is string => typeof a === "string" && a.trim().length > 0)
        .slice(0, 8)
        .map((a) => a.trim().slice(0, 120)),
      artistIds: Array.isArray(ev.track.artistIds)
        ? ev.track.artistIds
            .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
            .slice(0, 8)
        : undefined,
      albumTitle:
        typeof ev.track.albumTitle === "string" ? ev.track.albumTitle.slice(0, 200) : undefined,
      albumId: typeof ev.track.albumId === "string" ? ev.track.albumId.slice(0, 80) : undefined,
      releaseYear:
        typeof ev.track.releaseYear === "number" ? ev.track.releaseYear : undefined,
      durationMs: trackDurationMs,
      genres: Array.isArray(ev.track.genres)
        ? ev.track.genres
            .map((g) => normalizeGenreTag(g))
            .filter(Boolean)
            .slice(0, 8)
        : undefined,
      popularity:
        typeof ev.track.popularity === "number"
          ? clamp(Math.round(ev.track.popularity), 0, 100)
          : null,
      catalogSource: ev.track.catalogSource,
      canonicalKey:
        typeof ev.track.canonicalKey === "string" ? ev.track.canonicalKey : undefined,
      isLiveRadio: Boolean(ev.track.isLiveRadio),
      isFallbackAudio: Boolean(ev.track.isFallbackAudio),
    },
    audiblePlayedMs,
    trackDurationMs,
    sourceContext,
    reason,
    isRepeatOne: Boolean(ev.isRepeatOne),
    passiveAutoplayStreak:
      typeof ev.passiveAutoplayStreak === "number" && ev.passiveAutoplayStreak > 0
        ? Math.min(50, Math.floor(ev.passiveAutoplayStreak))
        : 0,
    searchQuery:
      typeof ev.searchQuery === "string" && ev.searchQuery.trim()
        ? ev.searchQuery.trim().slice(0, 100)
        : undefined,
    timestamp:
      typeof ev.timestamp === "string" && !Number.isNaN(Date.parse(ev.timestamp))
        ? ev.timestamp
        : new Date().toISOString(),
  };
}

export function interpretListeningEvent(
  event: MusicListeningEventInput,
  profile: MusicTasteProfileV1,
  nowMs = Date.now()
): InterpretedListeningFeedback {
  const canonicalKey = getCanonicalTrackKey(event.track);
  const primaryArtistKey = normalizeArtistKey(event.track.artistNames[0] || "");
  const durationSeconds = Math.max(25, (event.trackDurationMs || 210_000) / 1000);
  const audibleSeconds = Math.max(0, event.audiblePlayedMs / 1000);
  const completionRatio = clamp(audibleSeconds / durationSeconds, 0, 1);

  // Never learn positive or negative taste from live radio streams, fallback audio errors, or playback errors
  if (
    event.track.isLiveRadio ||
    event.track.isFallbackAudio ||
    event.reason === "playback_error" ||
    !primaryArtistKey
  ) {
    return {
      valid: false,
      classification: "ignored",
      canonicalKey,
      primaryArtistKey,
      completionRatio: 0,
      audibleSeconds,
      durationSeconds,
      trackWeight: 0,
      artistLongTermDelta: 0,
      artistShortTermDelta: 0,
      genreDelta: 0,
      isMeaningfulPositive: false,
      isFastSkip: false,
      isReplay: false,
    };
  }

  // Passive autoplay dampening: prevents an unattended background tab from hijacking core taste
  let sourceMultiplier = 1.0;
  if (event.sourceContext === "autoplay") {
    const streak = event.passiveAutoplayStreak || 0;
    sourceMultiplier =
      streak >= 3 ? Math.max(0.25, 0.65 * Math.pow(0.85, streak - 2)) : 0.72;
  }

  const existingTrack = profile.tracks[canonicalKey];
  const existingArtist = profile.artists[primaryArtistKey];

  // Detect genuine replay (either explicit repeat-one loop or re-listening within 24h with solid audible duration)
  const lastPlayedMs = existingTrack?.lastPlayedAt ? Date.parse(existingTrack.lastPlayedAt) : 0;
  const playedRecently24h = lastPlayedMs > 0 && nowMs - lastPlayedMs <= 24 * 3600 * 1000;
  const isGenuineEnd =
    event.reason === "ended" && (completionRatio >= 0.5 || audibleSeconds >= 45 || (durationSeconds <= 35 && audibleSeconds >= 20));
  const isReplay =
    (event.reason === "replay" || Boolean(event.isRepeatOne) || playedRecently24h) &&
    (completionRatio >= 0.55 || audibleSeconds >= 45);

  let classification: FeedbackClassification = "brief_impression";
  let baseWeight = 0;
  let artistLongTermDelta = 0;
  let artistShortTermDelta = 0;
  let genreDelta = 0;
  let isMeaningfulPositive = false;
  let isFastSkip = false;

  if (audibleSeconds < 5 && !isGenuineEnd && !isReplay) {
    // Brief accidental click or ultra-fast browse (< 5s): do NOT punish artist; lightly note on track if manual skip
    classification = "brief_impression";
    baseWeight = event.reason === "manual_skip" ? -0.12 : 0;
    artistLongTermDelta = 0;
    artistShortTermDelta = 0;
    genreDelta = 0;
  } else if (
    (audibleSeconds < 12 || completionRatio < 0.15) &&
    (event.reason === "manual_skip" || event.reason === "track_change")
  ) {
    // Fast skip (5s..12s or <15%): moderate negative on this specific song, very gentle on artist
    // Artist is only dampened noticeably if >= 3 consecutive fast skips happen on this artist!
    classification = "fast_skip";
    isFastSkip = true;
    baseWeight = -0.45;
    const nextConsecutive = (existingArtist?.consecutiveFastSkips || 0) + 1;
    artistLongTermDelta = nextConsecutive >= 3 ? -0.22 : -0.04;
    artistShortTermDelta = nextConsecutive >= 3 ? -0.38 : -0.08;
    genreDelta = nextConsecutive >= 3 ? -0.10 : -0.02;
  } else if (
    (completionRatio >= 0.75 || audibleSeconds >= 150) &&
    event.reason === "manual_skip"
  ) {
    // Satisfied late skip (user listened to >=75% or >=2.5 min then skipped outro): positive engagement!
    classification = "satisfied_late_skip";
    isMeaningfulPositive = true;
    baseWeight = (0.75 + 0.20 * clamp((completionRatio - 0.75) / 0.25, 0, 1)) * sourceMultiplier;
    artistLongTermDelta = baseWeight * 0.85;
    artistShortTermDelta = baseWeight * 0.95;
    genreDelta = baseWeight * 0.65;
  } else if (isGenuineEnd || completionRatio >= 0.85) {
    // Completed listen
    classification = "completed";
    isMeaningfulPositive = true;
    baseWeight = (0.88 + 0.12 * clamp((completionRatio - 0.85) / 0.15, 0, 1)) * sourceMultiplier;
    artistLongTermDelta = baseWeight * 0.95;
    artistShortTermDelta = baseWeight * 1.0;
    genreDelta = baseWeight * 0.75;
  } else if (completionRatio >= 0.60 || audibleSeconds >= 110) {
    // Engaged listen (60%..85%)
    classification = "engaged_listen";
    isMeaningfulPositive = true;
    baseWeight = (0.55 + 0.30 * clamp((completionRatio - 0.60) / 0.25, 0, 1)) * sourceMultiplier;
    artistLongTermDelta = baseWeight * 0.85;
    artistShortTermDelta = baseWeight * 0.95;
    genreDelta = baseWeight * 0.60;
  } else if (completionRatio < 0.35 && event.reason === "manual_skip") {
    // Early skip (15%..35%)
    classification = "early_skip";
    baseWeight = -0.18;
    artistLongTermDelta = -0.02;
    artistShortTermDelta = -0.05;
    genreDelta = 0;
  } else {
    // Neutral / partial listen (35%..60% or page unload mid-song)
    classification = "partial_listen";
    baseWeight = (0.14 + 0.35 * clamp((completionRatio - 0.15) / 0.45, 0, 1)) * sourceMultiplier;
    artistLongTermDelta = baseWeight * 0.65;
    artistShortTermDelta = baseWeight * 0.80;
    genreDelta = baseWeight * 0.45;
    if (completionRatio >= 0.45) {
      isMeaningfulPositive = true;
    }
  }

  // Logarithmic diminishing-returns bonus for replays
  if (isReplay && isMeaningfulPositive) {
    const prevReplays = existingTrack?.replayCount || 0;
    const replayBonus = (0.38 / (1 + prevReplays)) * sourceMultiplier;
    baseWeight += replayBonus;
    artistLongTermDelta += replayBonus * 0.75;
    artistShortTermDelta += replayBonus * 0.90;
  }

  // Session single-artist surge cap: prevent 1 binge session from rewriting long-term identity
  if (isMeaningfulPositive) {
    const recentSameArtistPositives = profile.recentWindow.filter((w) => {
      const wTs = Date.parse(w.timestamp) || 0;
      return (
        w.artistKey === primaryArtistKey &&
        w.weight > 0.2 &&
        nowMs - wTs <= 45 * 60 * 1000
      );
    }).length;

    if (recentSameArtistPositives >= 3) {
      artistLongTermDelta *= 0.35;
      artistShortTermDelta *= 0.75;
    }
  }

  return {
    valid: true,
    classification,
    canonicalKey,
    primaryArtistKey,
    completionRatio: Math.round(completionRatio * 1000) / 1000,
    audibleSeconds: Math.round(audibleSeconds * 10) / 10,
    durationSeconds: Math.round(durationSeconds * 10) / 10,
    trackWeight: Math.round(clamp(baseWeight, -0.8, 1.8) * 1000) / 1000,
    artistLongTermDelta: Math.round(clamp(artistLongTermDelta, -0.5, 1.5) * 1000) / 1000,
    artistShortTermDelta: Math.round(clamp(artistShortTermDelta, -0.6, 1.6) * 1000) / 1000,
    genreDelta: Math.round(clamp(genreDelta, -0.4, 1.2) * 1000) / 1000,
    isMeaningfulPositive,
    isFastSkip,
    isReplay,
  };
}

// ─── Incremental Profile Reducer ───────────────────────────────────────────────

function addCooccurrenceEdge(
  cooccurrence: Record<string, Record<string, number>>,
  artistA: string,
  artistB: string,
  delta: number
): void {
  if (!artistA || !artistB || artistA === artistB || delta <= 0) return;
  if (!cooccurrence[artistA]) cooccurrence[artistA] = {};
  if (!cooccurrence[artistB]) cooccurrence[artistB] = {};
  cooccurrence[artistA][artistB] = clamp((cooccurrence[artistA][artistB] || 0) + delta, 0, 5);
  cooccurrence[artistB][artistA] = clamp((cooccurrence[artistB][artistA] || 0) + delta, 0, 5);
}

export function applyListeningEventsToProfile(
  rawProfile: MusicTasteProfileV1,
  rawEvents: unknown[],
  nowMs = Date.now()
): {
  profile: MusicTasteProfileV1;
  acceptedCount: number;
  meaningfulNewCount: number;
  fastSkipNewCount: number;
} {
  const profile = sanitizeTasteProfile(rawProfile);
  let acceptedCount = 0;
  let meaningfulNewCount = 0;
  let fastSkipNewCount = 0;

  for (const rawEv of rawEvents) {
    const ev = validateListeningEventInput(rawEv);
    if (!ev) continue;

    // Idempotent deduplication by playSessionId (allows page_unload checkpoint upgrade only if new reason != page_unload)
    const alreadyProcessed = profile.processedSessionIds.includes(ev.playSessionId);
    if (alreadyProcessed) {
      continue;
    }

    const eventTsMs = ev.timestamp ? Date.parse(ev.timestamp) || nowMs : nowMs;
    const eventIso = new Date(eventTsMs).toISOString();
    const feedback = interpretListeningEvent(ev, profile, eventTsMs);

    // Record processed session ID even if brief_impression so duplicate beacons are ignored
    profile.processedSessionIds = [
      ev.playSessionId,
      ...profile.processedSessionIds.filter((id) => id !== ev.playSessionId),
    ].slice(0, MAX_PROCESSED_SESSIONS);

    if (!feedback.valid) continue;
    acceptedCount++;

    if (feedback.isMeaningfulPositive) {
      meaningfulNewCount++;
      profile.maturityCount = (profile.maturityCount || 0) + 1;
    }
    if (feedback.isFastSkip) {
      fastSkipNewCount++;
    }

    // 1. Update Track Signal
    const prevTrack = profile.tracks[feedback.canonicalKey];
    const prevPlays = prevTrack?.playCount || 0;
    const countedAsPlay = feedback.classification !== "brief_impression";
    const nextPlays = countedAsPlay ? prevPlays + 1 : prevPlays;
    const nextAvgRatio = countedAsPlay
      ? ((prevTrack?.avgCompletionRatio || 0) * prevPlays + feedback.completionRatio) /
        Math.max(1, nextPlays)
      : prevTrack?.avgCompletionRatio || 0;

    profile.tracks[feedback.canonicalKey] = {
      canonicalKey: feedback.canonicalKey,
      trackId: ev.track.id,
      title: ev.track.title,
      primaryArtistKey: feedback.primaryArtistKey,
      artistDisplayName: ev.track.artistNames[0] || "Unknown Artist",
      playCount: nextPlays,
      replayCount: (prevTrack?.replayCount || 0) + (feedback.isReplay ? 1 : 0),
      completionCount:
        (prevTrack?.completionCount || 0) +
        (feedback.classification === "completed" ||
        feedback.classification === "satisfied_late_skip"
          ? 1
          : 0),
      fastSkipCount: (prevTrack?.fastSkipCount || 0) + (feedback.isFastSkip ? 1 : 0),
      consecutiveFastSkips: feedback.isFastSkip
        ? (prevTrack?.consecutiveFastSkips || 0) + 1
        : feedback.isMeaningfulPositive
        ? 0
        : prevTrack?.consecutiveFastSkips || 0,
      avgCompletionRatio: Math.round(nextAvgRatio * 1000) / 1000,
      lastPlayedAt: countedAsPlay ? eventIso : prevTrack?.lastPlayedAt || null,
      lastSkippedAt: feedback.isFastSkip ? eventIso : prevTrack?.lastSkippedAt || null,
      lastImpressedAt: eventIso,
    };

    // 2. Update Primary & Featured Artist Affinities
    const artistList = ev.track.artistNames.slice(0, 3);
    artistList.forEach((artistName, idx) => {
      const aKey = normalizeArtistKey(artistName);
      if (!aKey) return;
      const roleScale = idx === 0 ? 1.0 : 0.45; // Featured artists receive partial credit
      const prevArt = profile.artists[aKey];
      const prevTs = prevArt?.lastUpdatedAt ? Date.parse(prevArt.lastUpdatedAt) || eventTsMs : eventTsMs;
      const elapsedMs = Math.max(0, eventTsMs - prevTs);

      const decayedLT = computeHalfLifeDecay(
        prevArt?.longTermScore || 0,
        elapsedMs,
        LONG_TERM_HALF_LIFE_HOURS
      );
      const decayedST = computeHalfLifeDecay(
        prevArt?.shortTermScore || 0,
        elapsedMs,
        SHORT_TERM_HALF_LIFE_HOURS
      );

      const mergedGenres = Array.from(
        new Set([...(prevArt?.genres || []), ...(ev.track.genres || [])])
      ).slice(0, 6);

      profile.artists[aKey] = {
        artistKey: aKey,
        displayName: artistName,
        spotifyArtistId: ev.track.artistIds?.[idx] || prevArt?.spotifyArtistId,
        longTermScore:
          Math.round(clamp(decayedLT + feedback.artistLongTermDelta * roleScale, -4, 15) * 1000) /
          1000,
        shortTermScore:
          Math.round(clamp(decayedST + feedback.artistShortTermDelta * roleScale, -3, 10) * 1000) /
          1000,
        playCount: (prevArt?.playCount || 0) + (countedAsPlay && idx === 0 ? 1 : 0),
        completionCount:
          (prevArt?.completionCount || 0) +
          (feedback.isMeaningfulPositive && idx === 0 ? 1 : 0),
        fastSkipCount:
          (prevArt?.fastSkipCount || 0) + (feedback.isFastSkip && idx === 0 ? 1 : 0),
        consecutiveFastSkips:
          idx === 0
            ? feedback.isFastSkip
              ? (prevArt?.consecutiveFastSkips || 0) + 1
              : feedback.isMeaningfulPositive
              ? 0
              : prevArt?.consecutiveFastSkips || 0
            : prevArt?.consecutiveFastSkips || 0,
        likedCount: prevArt?.likedCount || 0,
        playlistCount: prevArt?.playlistCount || 0,
        genres: mergedGenres.length > 0 ? mergedGenres : undefined,
        lastUpdatedAt: eventIso,
        lastPositiveAt: feedback.isMeaningfulPositive
          ? eventIso
          : prevArt?.lastPositiveAt || null,
        lastSkippedAt: feedback.isFastSkip ? eventIso : prevArt?.lastSkippedAt || null,
      };
    });

    // Collaboration edge between primary & featured artists on positive plays
    if (feedback.isMeaningfulPositive && artistList.length > 1) {
      const pKey = normalizeArtistKey(artistList[0]);
      for (let i = 1; i < artistList.length; i++) {
        addCooccurrenceEdge(profile.cooccurrence, pKey, normalizeArtistKey(artistList[i]), 0.35);
      }
    }

    // Sequential session co-occurrence: if previous positive play in last 20m was a different artist
    if (feedback.isMeaningfulPositive && profile.recentWindow.length > 0) {
      const lastRecent = profile.recentWindow[0];
      const lastRecentMs = Date.parse(lastRecent.timestamp) || 0;
      if (
        lastRecent.weight > 0.35 &&
        lastRecent.artistKey !== feedback.primaryArtistKey &&
        eventTsMs - lastRecentMs <= 20 * 60 * 1000
      ) {
        addCooccurrenceEdge(
          profile.cooccurrence,
          lastRecent.artistKey,
          feedback.primaryArtistKey,
          0.22
        );
      }
    }

    // 3. Update Genre Affinities (using track genres or known artist genres)
    const effectiveGenres =
      ev.track.genres && ev.track.genres.length > 0
        ? ev.track.genres
        : profile.artists[feedback.primaryArtistKey]?.genres || [];

    if (effectiveGenres.length > 0 && feedback.genreDelta !== 0) {
      for (const rawG of effectiveGenres.slice(0, 4)) {
        const gKey = normalizeGenreTag(rawG);
        if (!gKey) continue;
        const prevG = profile.genres[gKey];
        const prevGTs = prevG?.lastUpdatedAt ? Date.parse(prevG.lastUpdatedAt) || eventTsMs : eventTsMs;
        const gElapsed = Math.max(0, eventTsMs - prevGTs);
        const decLT = computeHalfLifeDecay(
          prevG?.longTermScore || 0,
          gElapsed,
          LONG_TERM_HALF_LIFE_HOURS
        );
        const decST = computeHalfLifeDecay(
          prevG?.shortTermScore || 0,
          gElapsed,
          SHORT_TERM_HALF_LIFE_HOURS
        );
        profile.genres[gKey] = {
          genreKey: gKey,
          longTermScore: Math.round(clamp(decLT + feedback.genreDelta, -3, 12) * 1000) / 1000,
          shortTermScore: Math.round(clamp(decST + feedback.genreDelta, -2.5, 8) * 1000) / 1000,
          sampleCount: (prevG?.sampleCount || 0) + 1,
          lastUpdatedAt: eventIso,
        };
      }
    }

    // 4. Record validated search query when user searched and actually listened
    if (
      ev.sourceContext === "search" &&
      ev.searchQuery &&
      (feedback.isMeaningfulPositive || feedback.audibleSeconds >= 30)
    ) {
      const normalizedQ = ev.searchQuery.trim().toLowerCase();
      if (normalizedQ.length >= 2) {
        profile.recentSearchQueries = [
          ev.searchQuery.trim(),
          ...profile.recentSearchQueries.filter((q) => q.toLowerCase() !== normalizedQ),
        ].slice(0, MAX_RECENT_SEARCH_SIGNALS);
      }
    }

    // 5. Push to recentWindow (exclude ultra-brief accidental clicks <5s unless fast_skip)
    if (feedback.classification !== "brief_impression") {
      profile.recentWindow = [
        {
          playSessionId: ev.playSessionId,
          canonicalKey: feedback.canonicalKey,
          trackId: ev.track.id,
          artistKey: feedback.primaryArtistKey,
          genres: effectiveGenres.length > 0 ? effectiveGenres : undefined,
          sourceContext: ev.sourceContext || "unknown",
          reason: ev.reason,
          classification: feedback.classification,
          completionRatio: feedback.completionRatio,
          weight: feedback.trackWeight,
          timestamp: eventIso,
        },
        ...profile.recentWindow,
      ].slice(0, MAX_RECENT_WINDOW);
    }
  }

  profile.updatedAt = new Date(nowMs).toISOString();
  return {
    profile: pruneTasteProfile(profile, nowMs),
    acceptedCount,
    meaningfulNewCount,
    fastSkipNewCount,
  };
}

// ─── Explicit Library Synchronization (Likes & Playlists) ──────────────────────

export function syncLibrarySignalsToProfile(
  rawProfile: MusicTasteProfileV1,
  likedSongs: MusicItem[],
  playlists: LocalPlaylist[],
  nowMs = Date.now()
): MusicTasteProfileV1 {
  const profile = sanitizeTasteProfile(rawProfile);
  const nowIso = new Date(nowMs).toISOString();

  const prevLikedSet = new Set(profile.likedTrackKeys);
  const nextLikedKeys: string[] = [];
  const likedCountByArtist: Record<string, { count: number; name: string; id?: string; genres: string[] }> = {};

  for (const song of likedSongs || []) {
    if (!song?.title || song.isLiveRadio) continue;
    const cKey = getCanonicalTrackKey(song);
    if (!nextLikedKeys.includes(cKey)) {
      nextLikedKeys.push(cKey);
    }
    const primaryName = song.artistNames?.[0] || "";
    const aKey = normalizeArtistKey(primaryName);
    if (aKey) {
      if (!likedCountByArtist[aKey]) {
        likedCountByArtist[aKey] = {
          count: 0,
          name: primaryName,
          id: song.artistIds?.[0],
          genres: [],
        };
      }
      likedCountByArtist[aKey].count += 1;
      if (song.genres) {
        likedCountByArtist[aKey].genres.push(...song.genres.map(normalizeGenreTag).filter(Boolean));
      }
      // Newly liked track gives an immediate short-term & long-term boost, and clears skip streak
      if (!prevLikedSet.has(cKey)) {
        const existing = profile.artists[aKey];
        profile.artists[aKey] = {
          artistKey: aKey,
          displayName: existing?.displayName || primaryName,
          spotifyArtistId: song.artistIds?.[0] || existing?.spotifyArtistId,
          longTermScore: clamp((existing?.longTermScore || 0) + 1.25, -4, 15),
          shortTermScore: clamp((existing?.shortTermScore || 0) + 1.4, -3, 10),
          playCount: existing?.playCount || 0,
          completionCount: existing?.completionCount || 0,
          fastSkipCount: existing?.fastSkipCount || 0,
          consecutiveFastSkips: 0,
          likedCount: likedCountByArtist[aKey].count,
          playlistCount: existing?.playlistCount || 0,
          genres: existing?.genres,
          lastUpdatedAt: nowIso,
          lastPositiveAt: nowIso,
          lastSkippedAt: existing?.lastSkippedAt || null,
        };
      }
    }
  }

  // Handle unliked songs: gently reduce short-term boost if user unliked a song
  for (const oldKey of prevLikedSet) {
    if (!nextLikedKeys.includes(oldKey)) {
      const tr = profile.tracks[oldKey];
      if (tr && profile.artists[tr.primaryArtistKey]) {
        const art = profile.artists[tr.primaryArtistKey];
        art.shortTermScore = Math.max(-3, art.shortTermScore - 0.6);
        art.longTermScore = Math.max(-4, art.longTermScore - 0.5);
      }
    }
  }

  const nextPlaylistKeysSet = new Set<string>();
  const plCountByArtist: Record<string, { count: number; name: string; id?: string }> = {};

  for (const pl of playlists || []) {
    const items = Array.isArray(pl?.items) ? pl.items.slice(0, 100) : [];
    const distinctArtistsInPlaylist: string[] = [];
    const perPlaylistArtistCount: Record<string, number> = {};

    for (const item of items) {
      if (!item?.title || item.isLiveRadio) continue;
      const cKey = getCanonicalTrackKey(item);
      nextPlaylistKeysSet.add(cKey);

      const primaryName = item.artistNames?.[0] || "";
      const aKey = normalizeArtistKey(primaryName);
      if (aKey) {
        const seenInThisPl = perPlaylistArtistCount[aKey] || 0;
        if (seenInThisPl < 4) {
          perPlaylistArtistCount[aKey] = seenInThisPl + 1;
          if (!plCountByArtist[aKey]) {
            plCountByArtist[aKey] = { count: 0, name: primaryName, id: item.artistIds?.[0] };
          }
          plCountByArtist[aKey].count += 1;
        }
        if (!distinctArtistsInPlaylist.includes(aKey) && distinctArtistsInPlaylist.length < 25) {
          distinctArtistsInPlaylist.push(aKey);
        }
      }
    }

    // Build co-occurrence edges among artists curated together in the same playlist
    for (let i = 0; i < distinctArtistsInPlaylist.length; i++) {
      for (let j = i + 1; j < Math.min(distinctArtistsInPlaylist.length, i + 6); j++) {
        addCooccurrenceEdge(
          profile.cooccurrence,
          distinctArtistsInPlaylist[i],
          distinctArtistsInPlaylist[j],
          0.25
        );
      }
    }
  }

  // Also link recent liked artists as co-occurring taste neighbors
  const topLikedArtists = Object.keys(likedCountByArtist).slice(0, 12);
  for (let i = 0; i < topLikedArtists.length; i++) {
    for (let j = i + 1; j < Math.min(topLikedArtists.length, i + 4); j++) {
      addCooccurrenceEdge(profile.cooccurrence, topLikedArtists[i], topLikedArtists[j], 0.2);
    }
  }

  // Reconcile likedCount & playlistCount across all artist entries (capped boost for large imports)
  const allRelevantArtists = new Set<string>([
    ...Object.keys(profile.artists),
    ...Object.keys(likedCountByArtist),
    ...Object.keys(plCountByArtist),
  ]);

  for (const aKey of allRelevantArtists) {
    const existing = profile.artists[aKey];
    const likedInfo = likedCountByArtist[aKey];
    const plInfo = plCountByArtist[aKey];
    const nextLikedCount = likedInfo?.count || 0;
    const nextPlCount = plInfo?.count || 0;

    if (!existing && (nextLikedCount > 0 || nextPlCount > 0)) {
      // Seed baseline affinity for artists present in user's library (log-capped against 100-song single-artist imports)
      const baselineLT =
        1.1 * Math.log1p(nextLikedCount) + 0.65 * Math.log1p(Math.min(15, nextPlCount));
      const baselineST =
        0.75 * Math.log1p(nextLikedCount) + 0.45 * Math.log1p(Math.min(10, nextPlCount));
      const gList = Array.from(new Set(likedInfo?.genres || [])).slice(0, 6);
      profile.artists[aKey] = {
        artistKey: aKey,
        displayName: likedInfo?.name || plInfo?.name || aKey,
        spotifyArtistId: likedInfo?.id || plInfo?.id,
        longTermScore: Math.round(clamp(baselineLT, 0, 6) * 1000) / 1000,
        shortTermScore: Math.round(clamp(baselineST, 0, 4) * 1000) / 1000,
        playCount: 0,
        completionCount: 0,
        fastSkipCount: 0,
        consecutiveFastSkips: 0,
        likedCount: nextLikedCount,
        playlistCount: nextPlCount,
        genres: gList.length > 0 ? gList : undefined,
        lastUpdatedAt: nowIso,
        lastPositiveAt: nowIso,
        lastSkippedAt: null,
      };
    } else if (existing) {
      existing.likedCount = nextLikedCount;
      existing.playlistCount = nextPlCount;
      if (!existing.spotifyArtistId && (likedInfo?.id || plInfo?.id)) {
        existing.spotifyArtistId = likedInfo?.id || plInfo?.id;
      }
    }
  }

  profile.likedTrackKeys = nextLikedKeys.slice(0, 500);
  profile.playlistTrackKeys = Array.from(nextPlaylistKeysSet).slice(0, 800);
  profile.updatedAt = nowIso;

  return pruneTasteProfile(profile, nowMs);
}

// ─── Cross-Source Candidate Deduplication & Metadata Enrichment ───────────────

export function deduplicateMusicItems(items: MusicItem[]): MusicItem[] {
  const byCanonical = new Map<string, MusicItem>();

  for (const rawItem of items) {
    if (!rawItem || !rawItem.title || rawItem.isLiveRadio) continue;
    const cKey = getCanonicalTrackKey(rawItem);
    const enriched: MusicItem = {
      ...rawItem,
      canonicalKey: cKey,
    };

    const existing = byCanonical.get(cKey);
    if (!existing) {
      byCanonical.set(cKey, enriched);
      continue;
    }

    // Prefer genuine Spotify ID over iTunes fallback ID, while merging missing metadata fields
    const existingIsITunes =
      existing.catalogSource === "itunes" || existing.providerItemId?.startsWith("itunes_");
    const nextIsSpotify =
      enriched.catalogSource === "spotify" && !enriched.providerItemId?.startsWith("itunes_");

    const primary = existingIsITunes && nextIsSpotify ? enriched : existing;
    const secondary = primary === enriched ? existing : enriched;

    const mergedGenres = Array.from(
      new Set([...(primary.genres || []), ...(secondary.genres || [])])
    );

    byCanonical.set(cKey, {
      ...primary,
      canonicalKey: cKey,
      artistIds: primary.artistIds || secondary.artistIds,
      albumTitle: primary.albumTitle || secondary.albumTitle,
      albumId: primary.albumId || secondary.albumId,
      releaseYear: primary.releaseYear || secondary.releaseYear,
      popularity:
        typeof primary.popularity === "number"
          ? primary.popularity
          : typeof secondary.popularity === "number"
          ? secondary.popularity
          : null,
      genres: mergedGenres.length > 0 ? mergedGenres : undefined,
      artworkUrl: primary.artworkUrl || secondary.artworkUrl,
      durationMs: primary.durationMs || secondary.durationMs,
      previewUrl: primary.previewUrl || secondary.previewUrl,
      youtubeVideoId: primary.youtubeVideoId || secondary.youtubeVideoId,
    });
  }

  return Array.from(byCanonical.values());
}

// ─── Candidate Scoring Components ──────────────────────────────────────────────

function computeMetadataCompleteness(item: MusicItem): number {
  let score = 0.4;
  if (item.artworkUrl) score += 0.25;
  if (item.durationMs && item.durationMs >= 45_000 && item.durationMs <= 900_000) score += 0.2;
  if (item.albumTitle) score += 0.1;
  // Slightly penalize karaoke / tribute / ringtone noise unless explicitly saved by user
  const lowerTitle = item.title.toLowerCase();
  const lowerArtist = (item.artistNames?.[0] || "").toLowerCase();
  if (
    lowerTitle.includes("karaoke") ||
    lowerTitle.includes("ringtone") ||
    lowerArtist.includes("karaoke") ||
    lowerArtist.includes("tribute")
  ) {
    score -= 0.45;
  }
  return clamp(score, 0.05, 1.0);
}

/**
 * Honest Catalog Quality Score Q_catalog(c):
 * - Uses genuine Spotify `popularity` (0..100) ONLY when provided by Spotify.
 * - Never fabricates popularity for iTunes/starter tracks; uses bounded rank-order prior instead.
 */
export function computeCatalogQualityScore(item: MusicItem, rankIndex = 0): number {
  const metaQuality = computeMetadataCompleteness(item);
  if (typeof item.popularity === "number" && Number.isFinite(item.popularity)) {
    const popNorm = clamp(item.popularity / 100, 0, 1);
    return 0.75 * popNorm + 0.25 * metaQuality;
  }
  const rankPrior = 0.48 + 0.24 * Math.exp(-Math.max(0, rankIndex) / 18);
  return 0.72 * rankPrior + 0.28 * metaQuality;
}

function computePersonalMatchComponents(
  item: MusicItem,
  canonicalKey: string,
  primaryArtistKey: string,
  profile: MusicTasteProfileV1,
  likedSet: Set<string>,
  playlistSet: Set<string>,
  topCoreArtists: string[],
  nowMs: number
): {
  personalScore: number;
  skipPenalty: number;
  repeatPenalty: number;
  isDiscovery: boolean;
  isFamiliarSaved: boolean;
} {
  // 1. Artist LT & ST affinities (primary + featured collaborator check)
  let bestArtistLT = 0;
  let bestArtistST = 0;
  let consecutiveFastSkips = 0;

  const candidateArtistKeys = (item.artistNames || [])
    .slice(0, 3)
    .map(normalizeArtistKey)
    .filter(Boolean);

  candidateArtistKeys.forEach((aKey, idx) => {
    const entry = profile.artists[aKey];
    if (!entry) return;
    const roleWeight = idx === 0 ? 1.0 : 0.65;
    const elapsed = Math.max(0, nowMs - (Date.parse(entry.lastUpdatedAt) || nowMs));
    const lt =
      softNormalize(
        computeHalfLifeDecay(entry.longTermScore, elapsed, LONG_TERM_HALF_LIFE_HOURS),
        ARTIST_LT_SCALE
      ) * roleWeight;
    const st =
      softNormalize(
        computeHalfLifeDecay(entry.shortTermScore, elapsed, SHORT_TERM_HALF_LIFE_HOURS),
        ARTIST_ST_SCALE
      ) * roleWeight;
    if (idx === 0 || lt > bestArtistLT) bestArtistLT = lt;
    if (idx === 0 || st > bestArtistST) bestArtistST = st;
    if (idx === 0) consecutiveFastSkips = entry.consecutiveFastSkips || 0;
  });

  // 2. Genre affinity (explicit redistribution fallback if candidate lacks genre tags)
  const candidateGenres = (
    item.genres && item.genres.length > 0
      ? item.genres
      : profile.artists[primaryArtistKey]?.genres || []
  )
    .map(normalizeGenreTag)
    .filter(Boolean);

  let hasGenreSignal = false;
  let genreScore = 0;
  if (candidateGenres.length > 0 && Object.keys(profile.genres).length > 0) {
    let sum = 0;
    let count = 0;
    for (const gKey of candidateGenres) {
      const gEntry = profile.genres[gKey];
      if (!gEntry) continue;
      const gElapsed = Math.max(0, nowMs - (Date.parse(gEntry.lastUpdatedAt) || nowMs));
      const gLT = softNormalize(
        computeHalfLifeDecay(gEntry.longTermScore, gElapsed, LONG_TERM_HALF_LIFE_HOURS),
        GENRE_LT_SCALE
      );
      const gST = softNormalize(
        computeHalfLifeDecay(gEntry.shortTermScore, gElapsed, SHORT_TERM_HALF_LIFE_HOURS),
        GENRE_ST_SCALE
      );
      sum += 0.6 * gLT + 0.4 * gST;
      count++;
    }
    if (count > 0) {
      hasGenreSignal = true;
      genreScore = sum / count;
    }
  }

  // 3. Similarity to Liked / Playlist co-occurrence graph
  const isFamiliarSaved = likedSet.has(canonicalKey) || playlistSet.has(canonicalKey);
  let cooccurScore = 0;
  for (const coreArt of topCoreArtists) {
    if (coreArt === primaryArtistKey) continue;
    const edge = profile.cooccurrence[coreArt]?.[primaryArtistKey] || 0;
    if (edge > cooccurScore) {
      cooccurScore = edge;
    }
  }
  const normalizedCooccur = clamp(cooccurScore / 1.5, 0, 1);

  const trackSignal = profile.tracks[canonicalKey];
  const lastPlayedMs = trackSignal?.lastPlayedAt ? Date.parse(trackSignal.lastPlayedAt) || 0 : 0;
  const hoursSinceLastPlay =
    lastPlayedMs > 0 ? Math.max(0, (nowMs - lastPlayedMs) / 3_600_000) : 999;

  // Familiar saved tracks get a boost only if they haven't been played very recently (> 6h)
  const savedFamiliarityBoost = isFamiliarSaved
    ? hoursSinceLastPlay >= 6
      ? likedSet.has(canonicalKey)
        ? 0.65
        : 0.45
      : 0.1
    : 0;
  const likePlaylistSim = Math.max(normalizedCooccur, savedFamiliarityBoost);

  // 4. Discovery bonus: unplayed track that matches co-occurrence or positive genre/artist neighborhood
  const hasNeverPlayed = !trackSignal || trackSignal.playCount === 0;
  const neighborhoodMatch = Math.max(
    normalizedCooccur,
    genreScore,
    bestArtistLT * 0.75,
    bestArtistST * 0.85
  );
  const isDiscovery =
    hasNeverPlayed &&
    !isFamiliarSaved &&
    (Object.keys(profile.artists).length < 2 || neighborhoodMatch > 0.08);
  const discoveryBonus =
    isDiscovery && neighborhoodMatch > 0.12
      ? 0.32 + 0.68 * neighborhoodMatch
      : 0;

  // Combine with explicit fallback weight redistribution when genre metadata is absent
  let personalScore = 0;
  if (hasGenreSignal) {
    personalScore =
      0.30 * bestArtistLT +
      0.28 * bestArtistST +
      0.16 * genreScore +
      0.16 * likePlaylistSim +
      0.10 * discoveryBonus;
  } else {
    personalScore =
      0.36 * bestArtistLT +
      0.32 * bestArtistST +
      0.20 * likePlaylistSim +
      0.12 * discoveryBonus;
  }

  // 5. Negative feedback penalty (requires repeated fast skips before penalizing artist!)
  let skipPenalty = 0;
  if (trackSignal) {
    if (trackSignal.fastSkipCount >= 2) {
      skipPenalty += 0.65;
    } else if (trackSignal.fastSkipCount === 1) {
      const lastSkipMs = trackSignal.lastSkippedAt ? Date.parse(trackSignal.lastSkippedAt) || 0 : 0;
      const skipHours = lastSkipMs > 0 ? (nowMs - lastSkipMs) / 3_600_000 : 999;
      if (skipHours < 24) skipPenalty += 0.32 * Math.pow(2, -skipHours / 12);
    }
  }
  if (consecutiveFastSkips >= 3) {
    const artistEntry = profile.artists[primaryArtistKey];
    const lastArtSkipMs = artistEntry?.lastSkippedAt
      ? Date.parse(artistEntry.lastSkippedAt) || 0
      : 0;
    const artSkipHours = lastArtSkipMs > 0 ? (nowMs - lastArtSkipMs) / 3_600_000 : 0;
    if (artSkipHours < 72) {
      skipPenalty += 0.45 * Math.pow(2, -artSkipHours / 24);
    }
  }

  // 6. Anti-repetition & impression cooldown penalty
  let repeatPenalty = 0;
  if (hoursSinceLastPlay < 36) {
    repeatPenalty += 0.42 * Math.pow(2, -hoursSinceLastPlay / 3);
  }
  const lastImpMs = trackSignal?.lastImpressedAt ? Date.parse(trackSignal.lastImpressedAt) || 0 : 0;
  if (lastImpMs > 0) {
    const hoursSinceImp = Math.max(0, (nowMs - lastImpMs) / 3_600_000);
    if (hoursSinceImp < 6) {
      repeatPenalty += 0.18 * Math.pow(2, -hoursSinceImp / 1.5);
    }
  }

  return {
    personalScore: clamp(personalScore, -1, 1),
    skipPenalty,
    repeatPenalty,
    isDiscovery,
    isFamiliarSaved,
  };
}

function getTopAffinityArtistKeys(profile: MusicTasteProfileV1, nowMs: number, topN = 10): string[] {
  return Object.values(profile.artists)
    .map((a) => {
      const elapsed = Math.max(0, nowMs - (Date.parse(a.lastUpdatedAt) || nowMs));
      const combined =
        0.55 * computeHalfLifeDecay(a.longTermScore, elapsed, LONG_TERM_HALF_LIFE_HOURS) +
        0.45 * computeHalfLifeDecay(a.shortTermScore, elapsed, SHORT_TERM_HALF_LIFE_HOURS);
      return { key: a.artistKey, score: combined, skipStreak: a.consecutiveFastSkips || 0 };
    })
    .filter((x) => x.score > 0.1 && x.skipStreak < 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((x) => x.key);
}

// ─── Home Recommendations Ranking & Diversification ────────────────────────────

export function rankHomeRecommendations(
  rawCandidates: MusicItem[],
  rawProfile: MusicTasteProfileV1,
  options: HomeRankingOptions = {}
): ScoredCandidate[] {
  const profile = sanitizeTasteProfile(rawProfile);
  const limit = Math.max(1, options.limit ?? 36);
  const quickPicksCount = Math.min(limit, options.quickPicksCount ?? 6);
  const maxPerArtist = Math.max(1, options.maxPerArtist ?? 2);
  const nowMs = options.nowMs ?? Date.now();
  const jitterScale = clamp(options.explorationJitter ?? 0.035, 0, 0.12);
  const seed = options.seed ?? Math.floor(nowMs / (10 * 60 * 1000));

  const candidates = deduplicateMusicItems(rawCandidates);
  if (candidates.length === 0) return [];

  const eta = computeMaturityFactor(profile);
  const likedSet = new Set(profile.likedTrackKeys);
  const playlistSet = new Set(profile.playlistTrackKeys);
  const topCoreArtists = getTopAffinityArtistKeys(profile, nowMs, 12);

  // Recent 30-minute hard cooldown keys so Home Quick Picks don't show the exact song just finished
  const playedLast30m = new Set(
    profile.recentWindow
      .filter((w) => nowMs - (Date.parse(w.timestamp) || 0) <= 30 * 60 * 1000)
      .map((w) => w.canonicalKey)
  );

  const scored: ScoredCandidate[] = candidates.map((item, idx) => {
    const canonicalKey = getCanonicalTrackKey(item);
    const primaryArtistKey = normalizeArtistKey(item.artistNames?.[0] || "") || `unknown_${idx}`;
    const catalogScore = computeCatalogQualityScore(item, idx);
    const {
      personalScore,
      skipPenalty,
      repeatPenalty,
      isDiscovery,
      isFamiliarSaved,
    } = computePersonalMatchComponents(
      item,
      canonicalKey,
      primaryArtistKey,
      profile,
      likedSet,
      playlistSet,
      topCoreArtists,
      nowMs
    );

    const freshJitter =
      jitterScale > 0
        ? (deterministicHashFloat(canonicalKey, seed) - 0.5) * 2 * jitterScale
        : 0;

    // Map personalScore [-1, 1] onto [0, 1] with neutral=0.25 so positive taste has 0.75 dynamic range
    const scaledPersonal =
      personalScore >= 0 ? 0.25 + 0.75 * personalScore : 0.25 * (1 + personalScore);
    const totalScore =
      eta * scaledPersonal +
      (1 - eta) * catalogScore -
      skipPenalty -
      repeatPenalty +
      freshJitter;

    return {
      item,
      canonicalKey,
      primaryArtistKey,
      score: Math.round(totalScore * 10000) / 10000,
      personalScore: Math.round(personalScore * 10000) / 10000,
      contextScore: 0,
      catalogScore: Math.round(catalogScore * 10000) / 10000,
      isDiscovery,
      isFamiliarSaved,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Greedy MMR-style diversified selection:
  // - Top 6 Quick Picks: max 1 per artist, max 2 familiar-saved, >= 1 discovery when mature
  // - Full list: max `maxPerArtist` per artist, back-to-back artist penalty, ~25% discovery balance, <= 30% already-saved cap
  const selected: ScoredCandidate[] = [];
  const usedKeys = new Set<string>();
  const artistCounts = new Map<string, number>();
  let savedCount = 0;
  let discoveryCount = 0;
  const maxSavedTotal = Math.max(2, Math.ceil(limit * 0.30));
  const minDiscoveryTarget = eta >= 0.35 ? Math.floor(limit * 0.25) : Math.floor(limit * 0.5);

  while (selected.length < limit) {
    const pos = selected.length;
    const inQuickPicks = pos < quickPicksCount;
    const prevArtistKey = pos > 0 ? selected[pos - 1].primaryArtistKey : "";

    let bestIdx = -1;
    let bestAdjusted = -Infinity;

    for (let i = 0; i < scored.length; i++) {
      const cand = scored[i];
      if (usedKeys.has(cand.canonicalKey)) continue;

      const currentArtistCount = artistCounts.get(cand.primaryArtistKey) || 0;
      const capHere = inQuickPicks ? 1 : maxPerArtist;
      if (currentArtistCount >= capHere) continue;

      if (inQuickPicks && playedLast30m.has(cand.canonicalKey) && scored.length > limit) {
        continue;
      }

      let adjusted = cand.score;

      // Penalize consecutive tracks by the exact same artist
      if (cand.primaryArtistKey === prevArtistKey) {
        adjusted -= 0.28;
      }
      if (currentArtistCount > 0) {
        adjusted -= 0.12 * currentArtistCount;
      }

      // Cap already-saved tracks so Home doesn't just mirror Liked Songs
      if (cand.isFamiliarSaved) {
        if (inQuickPicks && savedCount >= 2) adjusted -= 0.35;
        if (savedCount >= maxSavedTotal) adjusted -= 0.45;
      }

      // Encourage discovery slots when running behind target quota
      const remainingSlots = limit - pos;
      const discoveryDeficit = minDiscoveryTarget - discoveryCount;
      if (cand.isDiscovery && discoveryDeficit > 0 && discoveryDeficit >= remainingSlots - 2) {
        adjusted += 0.22;
      } else if (inQuickPicks && pos >= quickPicksCount - 2 && discoveryCount === 0 && cand.isDiscovery) {
        adjusted += 0.16;
      }

      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) {
      // Relax artist cap only if candidate pool is smaller than limit
      const fallbackCand = scored.find((c) => !usedKeys.has(c.canonicalKey));
      if (!fallbackCand) break;
      selected.push(fallbackCand);
      usedKeys.add(fallbackCand.canonicalKey);
      artistCounts.set(
        fallbackCand.primaryArtistKey,
        (artistCounts.get(fallbackCand.primaryArtistKey) || 0) + 1
      );
      if (fallbackCand.isFamiliarSaved) savedCount++;
      if (fallbackCand.isDiscovery) discoveryCount++;
    } else {
      const chosen = scored[bestIdx];
      selected.push(chosen);
      usedKeys.add(chosen.canonicalKey);
      artistCounts.set(
        chosen.primaryArtistKey,
        (artistCounts.get(chosen.primaryArtistKey) || 0) + 1
      );
      if (chosen.isFamiliarSaved) savedCount++;
      if (chosen.isDiscovery) discoveryCount++;
    }
  }

  return selected;
}

// ─── Smart Autoplay Candidate Scoring & Selection ──────────────────────────────

export function rankAutoplayCandidates(
  seedTrack: MusicItem | null,
  rawCandidates: MusicItem[],
  rawProfile: MusicTasteProfileV1,
  options: AutoplayRankingOptions = {}
): ScoredCandidate[] {
  const profile = sanitizeTasteProfile(rawProfile);
  const limit = Math.max(1, options.limit ?? 12);
  const nowMs = options.nowMs ?? Date.now();

  const deduplicated = deduplicateMusicItems(rawCandidates);
  if (deduplicated.length === 0) return [];

  const seedCanonicalKey = seedTrack ? getCanonicalTrackKey(seedTrack) : "";
  const seedArtistKeys = (seedTrack?.artistNames || [])
    .map(normalizeArtistKey)
    .filter(Boolean);
  const seedPrimaryArtist = seedArtistKeys[0] || "";
  const seedGenres = new Set(
    (
      (seedTrack?.genres && seedTrack.genres.length > 0
        ? seedTrack.genres
        : seedPrimaryArtist
        ? profile.artists[seedPrimaryArtist]?.genres
        : []) || []
    )
      .map(normalizeGenreTag)
      .filter(Boolean)
  );

  // Exclude manual queue & seed track IDs
  const excludedIds = new Set<string>(options.excludeTrackIds || []);
  if (seedTrack?.id) excludedIds.add(seedTrack.id);

  // Recent session canonical keys (from caller + recentWindow last 20 plays)
  const sessionRecentSet = new Set<string>(options.sessionRecentKeys || []);
  for (const w of profile.recentWindow.slice(0, 20)) {
    const ageMin = (nowMs - (Date.parse(w.timestamp) || 0)) / 60000;
    if (ageMin <= 90) {
      sessionRecentSet.add(w.canonicalKey);
    }
  }

  // Count how many consecutive recent plays were by seedPrimaryArtist (prevent endless 1-artist monotony)
  let consecutiveSeedArtistStreak = seedPrimaryArtist ? 1 : 0;
  if (seedPrimaryArtist) {
    const startIdx =
      profile.recentWindow[0]?.canonicalKey === seedCanonicalKey ? 1 : 0;
    for (let i = startIdx; i < profile.recentWindow.length; i++) {
      if (profile.recentWindow[i].artistKey === seedPrimaryArtist) {
        consecutiveSeedArtistStreak++;
      } else {
        break;
      }
    }
  }

  const likedSet = new Set(profile.likedTrackKeys);
  const playlistSet = new Set(profile.playlistTrackKeys);
  const topCoreArtists = getTopAffinityArtistKeys(profile, nowMs, 12);
  const recentSessionArtists = profile.recentWindow
    .slice(0, 4)
    .filter((w) => w.weight >= 0)
    .map((w) => w.artistKey);

  const filterPass = (allowRecentFallback: boolean) =>
    deduplicated.filter((c) => {
      if (excludedIds.has(c.id)) return false;
      const cKey = getCanonicalTrackKey(c);
      if (seedCanonicalKey && cKey === seedCanonicalKey) return false;
      if (!allowRecentFallback && sessionRecentSet.has(cKey)) return false;
      return true;
    });

  let eligible = filterPass(false);
  if (eligible.length === 0) {
    eligible = filterPass(true);
  }
  if (eligible.length === 0) return [];

  const eta = computeMaturityFactor(profile);

  const scored: ScoredCandidate[] = eligible.map((item, idx) => {
    const canonicalKey = getCanonicalTrackKey(item);
    const candArtistKeys = (item.artistNames || []).map(normalizeArtistKey).filter(Boolean);
    const primaryArtistKey = candArtistKeys[0] || `unknown_${idx}`;

    // A. Local Transition Context Score S_context(c | seedTrack, H_session)
    let artistRelation = 0;
    let streakPenalty = 0;
    if (seedArtistKeys.length > 0) {
      const sharesPrimary = primaryArtistKey === seedPrimaryArtist;
      const sharesCollaborator =
        !sharesPrimary && candArtistKeys.some((ak) => seedArtistKeys.includes(ak));

      if (sharesCollaborator) {
        artistRelation = 0.86;
      } else if (sharesPrimary) {
        if (consecutiveSeedArtistStreak >= 2) {
          artistRelation = 0;
          streakPenalty = Math.min(0.48, 0.24 * (consecutiveSeedArtistStreak - 1));
        } else {
          artistRelation = 0.72;
        }
      } else if (seedPrimaryArtist) {
        const directCo = profile.cooccurrence[seedPrimaryArtist]?.[primaryArtistKey] || 0;
        let sessionCo = 0;
        for (const rArt of recentSessionArtists) {
          const edge = profile.cooccurrence[rArt]?.[primaryArtistKey] || 0;
          if (edge > sessionCo) sessionCo = edge;
        }
        artistRelation = clamp(Math.max(directCo, sessionCo * 0.85) / 1.2, 0, 0.85);
      }
    }

    // Genre overlap with seed track
    const candGenres = (
      item.genres && item.genres.length > 0
        ? item.genres
        : profile.artists[primaryArtistKey]?.genres || []
    )
      .map(normalizeGenreTag)
      .filter(Boolean);

    let genreOverlap = 0;
    let hasGenreBridge = false;
    if (seedGenres.size > 0 && candGenres.length > 0) {
      hasGenreBridge = true;
      let matches = 0;
      for (const g of candGenres) {
        if (seedGenres.has(g)) matches++;
      }
      genreOverlap = matches / Math.max(1, Math.min(seedGenres.size, candGenres.length));
    }

    // Era / Release year continuity tie-breaker
    let eraProximity = 0.5;
    if (seedTrack?.releaseYear && item.releaseYear) {
      eraProximity = Math.exp(-Math.abs(seedTrack.releaseYear - item.releaseYear) / 8);
    }

    const contextScore = seedTrack
      ? hasGenreBridge
        ? 0.55 * artistRelation + 0.35 * genreOverlap + 0.10 * eraProximity
        : 0.82 * artistRelation + 0.18 * eraProximity
      : 0;

    // B. Personal Taste Score S_personal(c | u)
    const {
      personalScore,
      skipPenalty,
      repeatPenalty,
      isDiscovery,
      isFamiliarSaved,
    } = computePersonalMatchComponents(
      item,
      canonicalKey,
      primaryArtistKey,
      profile,
      likedSet,
      playlistSet,
      topCoreArtists,
      nowMs
    );

    const catalogScore = computeCatalogQualityScore(item, idx);
    const normPersonal =
      personalScore >= 0 ? 0.25 + 0.75 * personalScore : 0.25 * (1 + personalScore);
    const scaledPersonal = eta * normPersonal + (1 - eta) * catalogScore;

    const totalScore = seedTrack
      ? 0.52 * contextScore +
        0.36 * scaledPersonal +
        0.12 * catalogScore -
        skipPenalty -
        repeatPenalty -
        streakPenalty
      : 0.78 * scaledPersonal + 0.22 * catalogScore - skipPenalty - repeatPenalty;

    return {
      item,
      canonicalKey,
      primaryArtistKey,
      score: Math.round(totalScore * 10000) / 10000,
      personalScore: Math.round(personalScore * 10000) / 10000,
      contextScore: Math.round(contextScore * 10000) / 10000,
      catalogScore: Math.round(catalogScore * 10000) / 10000,
      isDiscovery,
      isFamiliarSaved,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversify top Autoplay queue suggestions so 8 suggestions aren't 8 songs by 1 artist
  const selected: ScoredCandidate[] = [];
  const usedKeys = new Set<string>();
  const artistCounts = new Map<string, number>();

  for (const cand of scored) {
    if (selected.length >= limit) break;
    if (usedKeys.has(cand.canonicalKey)) continue;
    const count = artistCounts.get(cand.primaryArtistKey) || 0;
    if (count >= 2 && scored.length > limit) continue;
    if (
      selected.length > 0 &&
      selected[selected.length - 1].primaryArtistKey === cand.primaryArtistKey &&
      scored.length > limit + 3
    ) {
      continue;
    }
    selected.push(cand);
    usedKeys.add(cand.canonicalKey);
    artistCounts.set(cand.primaryArtistKey, count + 1);
  }

  // Fill remainder if strict back-to-back check skipped items in a small pool
  if (selected.length < limit) {
    for (const cand of scored) {
      if (selected.length >= limit) break;
      if (usedKeys.has(cand.canonicalKey)) continue;
      selected.push(cand);
      usedKeys.add(cand.canonicalKey);
    }
  }

  return selected;
}

// ─── Quota-Friendly Query Planner for Server Catalog Retrieval ─────────────────

export interface PlannedCatalogQueries {
  coreQuery: string | null;
  discoveryQuery: string | null;
  topArtistIds: string[];
}

export function buildHomeCatalogQueries(
  rawProfile: MusicTasteProfileV1,
  nowMs = Date.now()
): PlannedCatalogQueries {
  const profile = sanitizeTasteProfile(rawProfile);
  const rankedArtists = Object.values(profile.artists)
    .map((a) => {
      const elapsed = Math.max(0, nowMs - (Date.parse(a.lastUpdatedAt) || nowMs));
      const lt = computeHalfLifeDecay(a.longTermScore, elapsed, LONG_TERM_HALF_LIFE_HOURS);
      const st = computeHalfLifeDecay(a.shortTermScore, elapsed, SHORT_TERM_HALF_LIFE_HOURS);
      return {
        entry: a,
        combined: 0.5 * lt + 0.5 * st,
        recentBias: st,
      };
    })
    .filter((x) => x.combined > 0.15 && (x.entry.consecutiveFastSkips || 0) < 3)
    .sort((a, b) => b.combined - a.combined);

  const topCore = rankedArtists.slice(0, 4).map((x) => x.entry.displayName);

  // Also grab most recent distinct positive artist if not already in top 4
  const recentDistinct = rankedArtists
    .slice(4)
    .sort((a, b) => b.recentBias - a.recentBias)[0]?.entry.displayName;
  if (recentDistinct && !topCore.includes(recentDistinct)) {
    topCore.push(recentDistinct);
  }

  const coreQuery = topCore.length > 0 ? topCore.slice(0, 5).join(" OR ") : null;

  // Discovery query: lower-play-count co-occurring neighbor artists + top genres + recent validated search
  const discoveryTerms: string[] = [];
  for (const topItem of rankedArtists.slice(0, 4)) {
    const neighbors = Object.entries(profile.cooccurrence[topItem.entry.artistKey] || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    for (const [nKey] of neighbors) {
      const nArt = profile.artists[nKey];
      if (
        nArt &&
        (nArt.playCount || 0) <= 3 &&
        (nArt.consecutiveFastSkips || 0) < 3 &&
        !topCore.includes(nArt.displayName) &&
        !discoveryTerms.includes(nArt.displayName)
      ) {
        discoveryTerms.push(nArt.displayName);
      }
    }
  }

  // Add recent search query that led to real listening
  for (const sq of profile.recentSearchQueries.slice(0, 2)) {
    if (!topCore.some((c) => c.toLowerCase() === sq.toLowerCase()) && discoveryTerms.length < 4) {
      discoveryTerms.push(sq);
    }
  }

  // Add top genre keyword if discovery terms are still sparse
  const topGenres = Object.values(profile.genres)
    .filter((g) => g.longTermScore + g.shortTermScore > 0.25)
    .sort((a, b) => b.longTermScore + b.shortTermScore - (a.longTermScore + a.shortTermScore))
    .slice(0, 2)
    .map((g) => g.genreKey);

  for (const g of topGenres) {
    if (discoveryTerms.length < 4) {
      discoveryTerms.push(g);
    }
  }

  const discoveryQuery =
    discoveryTerms.length > 0 ? discoveryTerms.slice(0, 4).join(" OR ") : null;

  const topArtistIds = rankedArtists
    .map((x) => x.entry.spotifyArtistId)
    .filter((id): id is string => typeof id === "string" && /^[0-9A-Za-z]{22}$/.test(id))
    .slice(0, 10);

  return {
    coreQuery,
    discoveryQuery,
    topArtistIds,
  };
}

export function buildAutoplayCatalogQueries(
  seedTrack: Pick<MusicItem, "title" | "artistNames" | "genres"> | null,
  rawProfile: MusicTasteProfileV1,
  nowMs = Date.now()
): { primaryContextQuery: string | null; bridgeQuery: string | null } {
  const profile = sanitizeTasteProfile(rawProfile);
  const seedArtists = (seedTrack?.artistNames || []).filter(Boolean);
  const primarySeedName = seedArtists[0] || "";
  const primarySeedKey = normalizeArtistKey(primarySeedName);

  const contextArtists: string[] = [];
  if (primarySeedName) contextArtists.push(primarySeedName);
  if (seedArtists[1]) contextArtists.push(seedArtists[1]);

  if (primarySeedKey && profile.cooccurrence[primarySeedKey]) {
    const neighbors = Object.entries(profile.cooccurrence[primarySeedKey])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    for (const [nKey] of neighbors) {
      const nEntry = profile.artists[nKey];
      if (nEntry && (nEntry.consecutiveFastSkips || 0) < 3) {
        if (!contextArtists.includes(nEntry.displayName)) {
          contextArtists.push(nEntry.displayName);
        }
      }
    }
  }

  const primaryContextQuery =
    contextArtists.length > 0 ? contextArtists.slice(0, 4).join(" OR ") : null;

  // Bridge query: combine seed genres (or artist's known genres) with user's top compatible artists
  const seedGenres = (
    seedTrack?.genres && seedTrack.genres.length > 0
      ? seedTrack.genres
      : primarySeedKey
      ? profile.artists[primarySeedKey]?.genres || []
      : []
  )
    .map(normalizeGenreTag)
    .filter(Boolean);

  const bridgeTerms: string[] = [];
  if (seedGenres.length > 0) {
    // Find user's favorite artists sharing at least one genre with the seed track
    const matchingUserArtists = Object.values(profile.artists)
      .filter((a) => {
        if (a.artistKey === primarySeedKey || (a.consecutiveFastSkips || 0) >= 3) return false;
        const aGenres = (a.genres || []).map(normalizeGenreTag);
        return aGenres.some((g) => seedGenres.includes(g));
      })
      .sort((a, b) => b.longTermScore + b.shortTermScore - (a.longTermScore + a.shortTermScore))
      .slice(0, 2)
      .map((a) => a.displayName);

    bridgeTerms.push(...matchingUserArtists);
    bridgeTerms.push(seedGenres[0]);
  } else {
    // Fallback to user's top 3 affinity artists distinct from seed
    const topKeys = getTopAffinityArtistKeys(profile, nowMs, 5).filter(
      (k) => k !== primarySeedKey
    );
    for (const k of topKeys.slice(0, 3)) {
      const disp = profile.artists[k]?.displayName;
      if (disp) bridgeTerms.push(disp);
    }
  }

  const bridgeQuery = bridgeTerms.length > 0 ? bridgeTerms.slice(0, 4).join(" OR ") : null;

  return {
    primaryContextQuery,
    bridgeQuery,
  };
}
