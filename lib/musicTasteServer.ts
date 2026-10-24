import "server-only";
import crypto from "crypto";
import { getNotesAdmin } from "@/lib/notesServer";
import {
  getSpotifyTokenWithMetadata,
  markSpotifyKeyRateLimited,
} from "@/lib/spotifyServer";
import {
  type LocalPlaylist,
  type MusicItem,
  getCanonicalTrackKey,
  mapSpotifyTrack,
  normalizeArtistKey,
  normalizeGenreTag,
  parseReleaseYear,
} from "@/lib/music";
import {
  type MusicListeningEventInput,
  type MusicTasteProfileV1,
  applyListeningEventsToProfile,
  computeMaturityFactor,
  createEmptyTasteProfile,
  deduplicateMusicItems,
  interpretListeningEvent,
  pruneTasteProfile,
  sanitizeTasteProfile,
  syncLibrarySignalsToProfile,
  validateListeningEventInput,
} from "@/lib/musicRecommendation";

// ─── Bounded In-Memory LRU Cache with TTL ──────────────────────────────────────

export class BoundedLRUCache<K, V> {
  private readonly store = new Map<K, { value: V; expiresAt: number }>();
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  constructor(maxEntries: number, defaultTtlMs: number) {
    this.maxEntries = Math.max(8, maxEntries);
    this.defaultTtlMs = Math.max(1000, defaultTtlMs);
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh LRU order
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs = this.defaultTtlMs): void {
    const now = Date.now();
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // First sweep expired entries; if still full, evict oldest entry
      for (const [k, v] of this.store.entries()) {
        if (now >= v.expiresAt) {
          this.store.delete(k);
        }
        if (this.store.size < this.maxEntries) break;
      }
      if (this.store.size >= this.maxEntries) {
        const oldestKey = this.store.keys().next().value;
        if (oldestKey !== undefined) {
          this.store.delete(oldestKey);
        }
      }
    }
    this.store.set(key, { value, expiresAt: now + ttlMs });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): void {
    this.store.delete(key);
  }
}

// ─── Constants & Shared Caches ─────────────────────────────────────────────────

const SYSTEM_TASTE_TITLE = "__USICK_MUSIC_TASTE_V1__";

function getMusicTasteSystemUserId(userId: string): string {
  return `${userId}::music_taste`;
}

function getMusicLibrarySystemUserId(userId: string): string {
  return `${userId}::music_library`;
}

const profileMemoryCache = new BoundedLRUCache<string, MusicTasteProfileV1>(
  500,
  5 * 60 * 1000
);

export const userHomeRecommendationCache = new BoundedLRUCache<
  string,
  { tracks: MusicItem[]; maturityFactor: number; generatedAt: string }
>(500, 10 * 60 * 1000);

const catalogQueryCache = new BoundedLRUCache<string, MusicItem[]>(
  400,
  60 * 60 * 1000
);

const artistGenreCache = new BoundedLRUCache<string, string[]>(
  1600,
  24 * 60 * 60 * 1000
);

// Track whether dedicated Supabase tables exist so we don't repeat failing queries
let dedicatedTablesStatus: "unknown" | "available" | "missing" = "unknown";
let dedicatedTablesCheckedAt = 0;
const TABLE_CHECK_RETRY_MS = 5 * 60 * 1000;

// Track whether Spotify batch `/v1/artists?ids=...` is permitted under current app mode
let spotifyBatchArtistsBlockedUntil = 0;

// Per-user async write mutex to prevent lost updates on concurrent events / library syncs
const userWriteLocks = new Map<string, Promise<unknown>>();

async function withUserTasteLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = userWriteLocks.get(userId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((res) => {
    release = res;
  });
  const chained = prev.then(() => current, () => current);
  userWriteLocks.set(userId, chained);

  try {
    await prev.catch(() => {});
    return await fn();
  } finally {
    release();
    if (userWriteLocks.get(userId) === chained) {
      userWriteLocks.delete(userId);
    }
  }
}

function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("could not find the table") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

function shouldTryDedicatedTables(): boolean {
  if (dedicatedTablesStatus === "available") return true;
  if (dedicatedTablesStatus === "unknown") return true;
  return Date.now() - dedicatedTablesCheckedAt >= TABLE_CHECK_RETRY_MS;
}

// ─── Shared Honest iTunes Mapper ───────────────────────────────────────────────

export function mapITunesCatalogTrack(item: any, fallbackArtistName = "Unknown Artist"): MusicItem {
  const artwork = item?.artworkUrl100
    ? String(item.artworkUrl100).replace("100x100bb", "600x600bb")
    : item?.artworkUrl60 || undefined;
  const trackId = String(
    item?.trackId || item?.collectionId || Math.random().toString(36).slice(2)
  );
  const title = String(item?.trackName || item?.collectionName || "Unknown Track");
  const artistName = String(item?.artistName || fallbackArtistName);
  const genreTag = normalizeGenreTag(item?.primaryGenreName);
  const releaseYear = parseReleaseYear(item?.releaseDate);

  return {
    id: `spotify:track:itunes_${trackId}`,
    provider: "spotify",
    providerItemId: `itunes_${trackId}`,
    itemType: "track",
    title,
    artistNames: [artistName],
    artistIds: item?.artistId ? [`itunes_${item.artistId}`] : undefined,
    albumTitle: item?.collectionName || undefined,
    albumId: item?.collectionId ? `itunes_${item.collectionId}` : undefined,
    releaseYear,
    popularity: null, // Never fabricate popularity on iTunes items
    genres: genreTag ? [genreTag] : undefined,
    catalogSource: "itunes",
    canonicalKey: getCanonicalTrackKey({ title, artistNames: [artistName] }),
    artworkUrl: artwork,
    durationMs: Number(item?.trackTimeMillis) || 210000,
    externalUrl:
      item?.trackViewUrl || item?.collectionViewUrl || "https://music.apple.com",
    previewUrl: item?.previewUrl || null,
    uri: `spotify:track:itunes_${trackId}`,
  };
}

// ─── Artist Genre Cache Helpers ────────────────────────────────────────────────

export function recordArtistGenresInCache(
  artistIdOrName: string | undefined | null,
  rawGenres: string[] | undefined | null,
  artistDisplayName?: string
): void {
  if (!Array.isArray(rawGenres) || rawGenres.length === 0) return;
  const cleaned = Array.from(
    new Set(rawGenres.map((g) => normalizeGenreTag(g)).filter(Boolean))
  ).slice(0, 6);
  if (cleaned.length === 0) return;

  if (artistIdOrName) {
    artistGenreCache.set(`id:${artistIdOrName}`, cleaned);
  }
  if (artistDisplayName) {
    const key = normalizeArtistKey(artistDisplayName);
    if (key) artistGenreCache.set(`name:${key}`, cleaned);
  }
}

export async function enrichTracksWithArtistGenres(
  tracks: MusicItem[]
): Promise<MusicItem[]> {
  if (tracks.length === 0) return tracks;

  // Collect uncached 22-char Spotify artist IDs
  const missingSpotifyIds: string[] = [];
  const seenIds = new Set<string>();

  for (const t of tracks) {
    if (t.genres && t.genres.length > 0) continue;
    const primaryId = t.artistIds?.[0];
    const primaryNameKey = normalizeArtistKey(t.artistNames[0]);
    if (primaryNameKey && artistGenreCache.has(`name:${primaryNameKey}`)) continue;
    if (
      primaryId &&
      /^[0-9A-Za-z]{22}$/.test(primaryId) &&
      !artistGenreCache.has(`id:${primaryId}`) &&
      !seenIds.has(primaryId)
    ) {
      seenIds.add(primaryId);
      missingSpotifyIds.push(primaryId);
      if (missingSpotifyIds.length >= 20) break;
    }
  }

  // Opportunistic single batched Spotify /v1/artists lookup when permitted
  if (
    missingSpotifyIds.length > 0 &&
    Date.now() >= spotifyBatchArtistsBlockedUntil
  ) {
    try {
      const meta = await getSpotifyTokenWithMetadata();
      if (meta) {
        const res = await fetch(
          `https://api.spotify.com/v1/artists?ids=${missingSpotifyIds
            .map(encodeURIComponent)
            .join(",")}`,
          {
            headers: { Authorization: `Bearer ${meta.token}` },
            next: { revalidate: 86400 },
          }
        );

        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after")) || 1800;
          markSpotifyKeyRateLimited(meta.clientId, retryAfter);
          spotifyBatchArtistsBlockedUntil = Date.now() + 15 * 60 * 1000;
        } else if (res.status === 403 || res.status === 401) {
          // Dev Mode app restriction on batch endpoint — back off for 30 min without failing
          spotifyBatchArtistsBlockedUntil = Date.now() + 30 * 60 * 1000;
        } else if (res.ok) {
          const json = await res.json();
          const artistsArr = Array.isArray(json?.artists) ? json.artists : [];
          for (const a of artistsArr) {
            if (a?.id) {
              recordArtistGenresInCache(a.id, a.genres, a.name);
            }
          }
        }
      }
    } catch {
      // Ignore enrichment failure gracefully
    }
  }

  return tracks.map((t) => {
    if (t.genres && t.genres.length > 0) return t;
    const primaryId = t.artistIds?.[0];
    const primaryNameKey = normalizeArtistKey(t.artistNames[0]);
    const fromId = primaryId ? artistGenreCache.get(`id:${primaryId}`) : undefined;
    const fromName = primaryNameKey
      ? artistGenreCache.get(`name:${primaryNameKey}`)
      : undefined;
    const resolved = fromId || fromName;
    if (!resolved || resolved.length === 0) return t;
    return { ...t, genres: resolved };
  });
}

// ─── Hybrid Taste Profile Persistence ──────────────────────────────────────────

async function hydrateInitialLibraryIntoEmptyProfile(
  userId: string,
  profile: MusicTasteProfileV1
): Promise<{ profile: MusicTasteProfileV1; hydrated: boolean }> {
  if (
    profile.maturityCount > 0 ||
    profile.likedTrackKeys.length > 0 ||
    profile.playlistTrackKeys.length > 0 ||
    Object.keys(profile.artists).length > 0
  ) {
    return { profile, hydrated: false };
  }

  const db = getNotesAdmin();
  if (!db) return { profile, hydrated: false };

  try {
    const { data, error } = await db
      .from("user_notes")
      .select("content")
      .eq("user_id", getMusicLibrarySystemUserId(userId))
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { profile, hydrated: false };
    }

    const raw =
      typeof data[0].content === "string"
        ? JSON.parse(data[0].content)
        : data[0].content;
    const likedSongs: MusicItem[] = Array.isArray(raw?.likedSongs)
      ? raw.likedSongs
      : [];
    const playlists: LocalPlaylist[] = Array.isArray(raw?.playlists)
      ? raw.playlists
      : [];

    if (likedSongs.length === 0 && playlists.length === 0) {
      return { profile, hydrated: false };
    }

    const synced = syncLibrarySignalsToProfile(profile, likedSongs, playlists);
    return { profile: synced, hydrated: true };
  } catch {
    return { profile, hydrated: false };
  }
}

export async function loadUserTasteProfile(
  userId: string
): Promise<MusicTasteProfileV1> {
  const cached = profileMemoryCache.get(userId);
  if (cached) return sanitizeTasteProfile(cached);

  const db = getNotesAdmin();
  if (!db) {
    return createEmptyTasteProfile();
  }

  // 1. Try dedicated `public.music_taste_profiles` table first
  if (shouldTryDedicatedTables()) {
    try {
      const { data, error } = await db
        .from("music_taste_profiles")
        .select("profile_payload")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) {
          dedicatedTablesStatus = "missing";
          dedicatedTablesCheckedAt = Date.now();
        }
      } else {
        dedicatedTablesStatus = "available";
        dedicatedTablesCheckedAt = Date.now();
        if (data?.profile_payload) {
          const parsed = sanitizeTasteProfile(data.profile_payload);
          profileMemoryCache.set(userId, parsed);
          return parsed;
        }
      }
    } catch {
      // Fall through to user_notes fallback
    }
  }

  // 2. Fallback / secondary check: `public.user_notes` isolated system row
  try {
    const { data, error } = await db
      .from("user_notes")
      .select("content")
      .eq("user_id", getMusicTasteSystemUserId(userId))
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0 && data[0].content) {
      const raw =
        typeof data[0].content === "string"
          ? JSON.parse(data[0].content)
          : data[0].content;
      const parsed = sanitizeTasteProfile(raw);
      profileMemoryCache.set(userId, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn("[musicTasteServer] Fallback user_notes read warning:", err);
  }

  // 3. Brand new taste profile: opportunistically bootstrap from existing saved Music Library
  const empty = createEmptyTasteProfile();
  const { profile: bootstrapped, hydrated } =
    await hydrateInitialLibraryIntoEmptyProfile(userId, empty);

  profileMemoryCache.set(userId, bootstrapped);
  if (hydrated) {
    // Persist asynchronously without blocking caller
    void saveUserTasteProfileInternal(userId, bootstrapped).catch(() => {});
  }

  return bootstrapped;
}

async function saveUserTasteProfileInternal(
  userId: string,
  rawProfile: MusicTasteProfileV1
): Promise<MusicTasteProfileV1> {
  const pruned = pruneTasteProfile(rawProfile);
  profileMemoryCache.set(userId, pruned);

  const db = getNotesAdmin();
  if (!db) return pruned;

  const now = new Date().toISOString();
  let savedDedicated = false;

  // 1. Write to dedicated `public.music_taste_profiles` when available
  if (shouldTryDedicatedTables()) {
    try {
      const { error } = await db.from("music_taste_profiles").upsert(
        {
          user_id: userId,
          version: pruned.version,
          profile_payload: pruned,
          total_meaningful_plays: pruned.maturityCount,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        if (isMissingTableError(error)) {
          dedicatedTablesStatus = "missing";
          dedicatedTablesCheckedAt = Date.now();
        } else {
          console.warn("[musicTasteServer] Dedicated upsert warning:", error.message);
        }
      } else {
        dedicatedTablesStatus = "available";
        dedicatedTablesCheckedAt = Date.now();
        savedDedicated = true;
      }
    } catch {
      // Fall through to user_notes fallback
    }
  }

  // 2. Fallback / durable mirror to `public.user_notes` if dedicated table isn't active
  if (!savedDedicated) {
    try {
      const systemUserId = getMusicTasteSystemUserId(userId);
      const contentStr = JSON.stringify(pruned);

      const { data: existingRows } = await db
        .from("user_notes")
        .select("id")
        .eq("user_id", systemUserId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        await db
          .from("user_notes")
          .update({
            title: SYSTEM_TASTE_TITLE,
            content: contentStr,
            updated_at: now,
          })
          .eq("id", existingRows[0].id);
      } else {
        await db.from("user_notes").insert([
          {
            id: crypto.randomUUID(),
            user_id: systemUserId,
            title: SYSTEM_TASTE_TITLE,
            content: contentStr,
            is_pinned: false,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
        ]);
      }
    } catch (err) {
      console.warn("[musicTasteServer] Fallback user_notes save warning:", err);
    }
  }

  return pruned;
}

export async function saveUserTasteProfile(
  userId: string,
  profile: MusicTasteProfileV1
): Promise<MusicTasteProfileV1> {
  return withUserTasteLock(userId, () => saveUserTasteProfileInternal(userId, profile));
}

export function invalidateUserRecommendationCache(userId: string): void {
  userHomeRecommendationCache.delete(userId);
}

export async function appendListeningEventsForUser(
  userId: string,
  rawEvents: MusicListeningEventInput[]
): Promise<{
  profile: MusicTasteProfileV1;
  acceptedCount: number;
  skippedDuplicateCount: number;
  maturityFactor: number;
}> {
  return withUserTasteLock(userId, async () => {
    const current = await loadUserTasteProfile(userId);

    // Enrich incoming event tracks with cached artist genres before applying
    const enrichedEvents = rawEvents.map((ev) => {
      if (!ev?.track) return ev;
      if (ev.track.genres && ev.track.genres.length > 0) return ev;
      const primaryId = ev.track.artistIds?.[0];
      const primaryKey = normalizeArtistKey(ev.track.artistNames?.[0]);
      const cachedGenres =
        (primaryId ? artistGenreCache.get(`id:${primaryId}`) : undefined) ||
        (primaryKey ? artistGenreCache.get(`name:${primaryKey}`) : undefined);
      if (!cachedGenres || cachedGenres.length === 0) return ev;
      return {
        ...ev,
        track: {
          ...ev.track,
          genres: cachedGenres,
        },
      };
    });

    const alreadySeenIds = new Set(current.processedSessionIds);
    const validEventRows: Record<string, unknown>[] = [];
    let skippedDuplicateCount = 0;

    for (const ev of enrichedEvents) {
      const sanitized = validateListeningEventInput(ev);
      if (!sanitized) continue;
      if (alreadySeenIds.has(sanitized.playSessionId)) {
        skippedDuplicateCount++;
        continue;
      }
      alreadySeenIds.add(sanitized.playSessionId);

      const interp = interpretListeningEvent(sanitized, current);
      if (!interp.valid || interp.classification === "ignored") continue;

      validEventRows.push({
        user_id: userId,
        play_session_id: sanitized.playSessionId,
        instance_id: sanitized.instanceId || null,
        canonical_key: interp.canonicalKey,
        track_id: sanitized.track.id,
        track_title: sanitized.track.title,
        primary_artist_key: interp.primaryArtistKey,
        artist_names: sanitized.track.artistNames,
        audible_played_ms: Math.round(sanitized.audiblePlayedMs),
        track_duration_ms: Math.round(sanitized.trackDurationMs || 0),
        completion_ratio: interp.completionRatio,
        classification: interp.classification,
        source_context: sanitized.sourceContext || "unknown",
        end_reason: sanitized.reason,
        is_repeat_one: Boolean(sanitized.isRepeatOne),
      });
    }

    const {
      profile: updated,
      acceptedCount,
      meaningfulNewCount,
      fastSkipNewCount,
    } = applyListeningEventsToProfile(current, enrichedEvents);

    const shouldInvalidateHome = meaningfulNewCount > 0 || fastSkipNewCount > 0;

    let persisted = updated;
    if (acceptedCount > 0) {
      persisted = await saveUserTasteProfileInternal(userId, updated);

      // Write event audit rows if dedicated table is available
      const db = getNotesAdmin();
      if (db && validEventRows.length > 0 && dedicatedTablesStatus === "available") {
        try {
          await db.from("music_listening_events").upsert(validEventRows, {
            onConflict: "user_id,play_session_id",
            ignoreDuplicates: true,
          });
        } catch {
          // Non-fatal
        }
      }
    }

    if (shouldInvalidateHome) {
      invalidateUserRecommendationCache(userId);
    }

    return {
      profile: persisted,
      acceptedCount,
      skippedDuplicateCount,
      maturityFactor: computeMaturityFactor(persisted),
    };
  });
}

export async function syncUserLibraryToTasteProfile(
  userId: string,
  likedSongs: MusicItem[],
  playlists: LocalPlaylist[]
): Promise<MusicTasteProfileV1> {
  return withUserTasteLock(userId, async () => {
    const current = await loadUserTasteProfile(userId);
    const enrichedLikes = await enrichTracksWithArtistGenres(likedSongs);
    const synced = syncLibrarySignalsToProfile(current, enrichedLikes, playlists);
    const saved = await saveUserTasteProfileInternal(userId, synced);
    invalidateUserRecommendationCache(userId);
    return saved;
  });
}

export async function deleteUserMusicTasteData(userId: string): Promise<void> {
  profileMemoryCache.delete(userId);
  userHomeRecommendationCache.delete(userId);

  const db = getNotesAdmin();
  if (!db) return;

  await Promise.allSettled([
    db.from("user_notes").delete().eq("user_id", getMusicTasteSystemUserId(userId)),
    db.from("user_notes").delete().eq("user_id", getMusicLibrarySystemUserId(userId)),
    db.from("music_taste_profiles").delete().eq("user_id", userId),
    db.from("music_listening_events").delete().eq("user_id", userId),
    db.from("music_device_sessions").delete().eq("user_id", userId),
    db.from("music_connect_commands").delete().eq("user_id", userId),
  ]);
}

// ─── Shared Catalog Query Fetcher (Spotify Primary + iTunes Fallback) ──────────

export const COLD_START_STARTER_QUERIES = [
  "Sal Priadi OR Bruno Mars OR Billie Eilish OR Juicy Luicy OR Sabrina Carpenter OR Hindia OR The Weeknd OR Mahalini",
  "Lady Gaga OR Nadin Amizah OR Coldplay OR Tulus OR Dua Lipa OR Sheila on 7 OR Taylor Swift OR Rizky Febian",
  "Bernadya OR Benson Boone OR Yura Yunita OR Pamungkas OR Olivia Rodrigo OR Lyodra OR Post Malone OR Tiara Andini",
];

async function fetchITunesForRecommendationQuery(
  query: string,
  limit: number
): Promise<MusicItem[]> {
  const terms = query
    .split(/\bOR\b/i)
    .map((t) => t.replace(/[()"']/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 6);

  if (terms.length === 0) return [];
  const perTermLimit = Math.max(5, Math.ceil(limit / terms.length) + 2);

  const pages = await Promise.all(
    terms.map(async (term) => {
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            term
          )}&entity=song&limit=${perTermLimit}`,
          { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json?.results) ? json.results : [];
      } catch {
        return [];
      }
    })
  );

  // Interleave term results so the first term doesn't monopolize rank order
  const interleaved: any[] = [];
  const maxLen = Math.max(0, ...pages.map((p) => p.length));
  for (let i = 0; i < maxLen; i++) {
    for (const p of pages) {
      if (i < p.length && p[i]?.trackName) {
        interleaved.push(p[i]);
      }
    }
  }

  return deduplicateMusicItems(
    interleaved.map((item) => mapITunesCatalogTrack(item))
  ).slice(0, limit);
}

export async function fetchCatalogTracksCached(
  query: string,
  limit = 20
): Promise<MusicItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `q:${trimmed.toLowerCase()}::${limit}`;
  const cached = catalogQueryCache.get(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const orTerms = trimmed
    .split(/\bOR\b/i)
    .map((t) => t.trim())
    .filter(Boolean);

  const rawSpotifyItems: any[] = [];
  let meta = await getSpotifyTokenWithMetadata();

  if (meta) {
    const runSpotifyPages = async (token: string, clientId: string) => {
      const pageCount = Math.min(3, Math.max(1, Math.ceil(limit / 10)));
      const promises = Array.from({ length: pageCount }, async (_, idx) => {
        let pageQuery = trimmed;
        let offset = idx * 10;

        if (orTerms.length >= 2 && pageCount > 1) {
          const chunkSize = Math.ceil(orTerms.length / pageCount);
          const slice = orTerms.slice(idx * chunkSize, (idx + 1) * chunkSize);
          if (slice.length > 0) {
            pageQuery = slice.join(" OR ");
            offset = 0;
          }
        }

        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          pageQuery
        )}&type=track&limit=10&offset=${offset}&market=ID`;

        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            next: { revalidate: 3600 },
          });
          if (res.status === 429) {
            const retryAfter = Number(res.headers.get("retry-after")) || 3600;
            markSpotifyKeyRateLimited(clientId, retryAfter);
            return { rateLimited: true };
          }
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      });

      return Promise.all(promises);
    };

    let results = await runSpotifyPages(meta.token, meta.clientId);
    if (results.some((r: any) => r?.rateLimited)) {
      const backup = await getSpotifyTokenWithMetadata(meta.clientId);
      if (backup && backup.clientId !== meta.clientId) {
        meta = backup;
        results = await runSpotifyPages(backup.token, backup.clientId);
      }
    }

    for (const page of results) {
      if (page && !page.rateLimited && Array.isArray(page.tracks?.items)) {
        rawSpotifyItems.push(...page.tracks.items);
      }
    }
  }

  let mappedTracks = deduplicateMusicItems(
    rawSpotifyItems.filter((t) => Boolean(t?.id)).map(mapSpotifyTrack)
  );

  // Supplement with iTunes fallback if Spotify is rate-limited or sparse
  const minExpected = Math.min(limit, 10);
  if (mappedTracks.length < minExpected) {
    const fallbackTracks = await fetchITunesForRecommendationQuery(trimmed, limit);
    mappedTracks = deduplicateMusicItems([...mappedTracks, ...fallbackTracks]);
  }

  const enriched = await enrichTracksWithArtistGenres(mappedTracks.slice(0, limit));
  if (enriched.length > 0) {
    catalogQueryCache.set(cacheKey, enriched);
  }

  return enriched;
}
