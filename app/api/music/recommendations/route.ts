export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNotesAdmin } from "@/lib/notesServer";
import type { LocalPlaylist, MusicItem } from "@/lib/music";
import {
  buildAutoplayCatalogQueries,
  buildHomeCatalogQueries,
  computeMaturityFactor,
  createEmptyTasteProfile,
  deduplicateMusicItems,
  rankAutoplayCandidates,
  rankHomeRecommendations,
} from "@/lib/musicRecommendation";
import {
  COLD_START_STARTER_QUERIES,
  enrichTracksWithArtistGenres,
  fetchCatalogTracksCached,
  loadUserTasteProfile,
  userHomeRecommendationCache,
} from "@/lib/musicTasteServer";

function parseDelimitedList(raw: string | null, maxItems = 40): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .map((x) => x.trim())
          .slice(0, maxItems);
      }
    } catch {
      // Fall back to delimiter split
    }
  }
  return trimmed
    .split("||")
    .flatMap((part) => part.split(","))
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

async function loadSavedLibraryTracksForCandidates(userId: string): Promise<MusicItem[]> {
  const db = getNotesAdmin();
  if (!db) return [];
  try {
    const { data, error } = await db
      .from("user_notes")
      .select("content")
      .eq("user_id", `${userId}::music_library`)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0 || !data[0].content) return [];
    const parsed =
      typeof data[0].content === "string"
        ? JSON.parse(data[0].content)
        : data[0].content;

    const likedSongs: MusicItem[] = Array.isArray(parsed?.likedSongs)
      ? parsed.likedSongs
      : [];
    const playlists: LocalPlaylist[] = Array.isArray(parsed?.playlists)
      ? parsed.playlists
      : [];

    const playlistItems = playlists.flatMap((pl) =>
      Array.isArray(pl?.items) ? pl.items : []
    );

    return deduplicateMusicItems([...likedSongs, ...playlistItems]).slice(0, 30);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") === "autoplay" ? "autoplay" : "home";
    const forceRefresh = searchParams.get("refresh") === "1";
    const requestedLimit = Math.min(
      Math.max(Number(searchParams.get("limit")) || (mode === "home" ? 36 : 16), 6),
      50
    );

    const { userId } = await auth();

    // ─── MODE 1: PERSONALIZED HOME RECOMMENDATIONS ────────────────────────────
    if (mode === "home") {
      if (userId && !forceRefresh) {
        const cachedHome = userHomeRecommendationCache.get(userId);
        if (cachedHome && cachedHome.tracks.length >= Math.min(requestedLimit, 16)) {
          return NextResponse.json({
            success: true,
            mode: "home",
            authenticated: true,
            cached: true,
            maturityFactor: cachedHome.maturityFactor,
            generatedAt: cachedHome.generatedAt,
            tracks: cachedHome.tracks.slice(0, requestedLimit),
          });
        }
      }

      const profile = userId
        ? await loadUserTasteProfile(userId)
        : createEmptyTasteProfile();
      const maturityFactor = computeMaturityFactor(profile);

      const planned = buildHomeCatalogQueries(profile);
      const starterIndex = Math.floor(Date.now() / (15 * 60 * 1000)) % COLD_START_STARTER_QUERIES.length;
      const starterQuery = COLD_START_STARTER_QUERIES[starterIndex];

      const fetchPromises: Promise<MusicItem[]>[] = [];
      if (planned.coreQuery) {
        fetchPromises.push(fetchCatalogTracksCached(planned.coreQuery, 26));
      }
      if (planned.discoveryQuery) {
        fetchPromises.push(fetchCatalogTracksCached(planned.discoveryQuery, 18));
      }
      // Include starter pool for cold start or fresh discovery padding
      const starterFetchSize = maturityFactor < 0.45 ? 32 : 16;
      fetchPromises.push(fetchCatalogTracksCached(starterQuery, starterFetchSize));
      if (!planned.coreQuery && maturityFactor < 0.25) {
        const secondStarter =
          COLD_START_STARTER_QUERIES[(starterIndex + 1) % COLD_START_STARTER_QUERIES.length];
        fetchPromises.push(fetchCatalogTracksCached(secondStarter, 20));
      }

      const [catalogBatches, savedLibraryTracks] = await Promise.all([
        Promise.all(fetchPromises),
        userId ? loadSavedLibraryTracksForCandidates(userId) : Promise.resolve([]),
      ]);

      const mergedPool = await enrichTracksWithArtistGenres(
        deduplicateMusicItems([...catalogBatches.flat(), ...savedLibraryTracks])
      );

      const ranked = rankHomeRecommendations(mergedPool, profile, {
        limit: requestedLimit,
      });
      const tracks = ranked.map((r) => r.item);
      const generatedAt = new Date().toISOString();

      if (userId && tracks.length >= 12) {
        userHomeRecommendationCache.set(userId, {
          tracks,
          maturityFactor,
          generatedAt,
        });
      }

      return NextResponse.json({
        success: true,
        mode: "home",
        authenticated: Boolean(userId),
        cached: false,
        maturityFactor,
        totalMeaningfulPlays: profile.maturityCount,
        generatedAt,
        tracks,
      });
    }

    // ─── MODE 2: CONTEXT-AWARE + TASTE-AWARE SMART AUTOPLAY ───────────────────
    const seedId = searchParams.get("seedId")?.trim() || "";
    const seedTitle = searchParams.get("seedTitle")?.trim() || "";
    const seedArtists = parseDelimitedList(searchParams.get("seedArtists"), 6);
    const seedGenres = parseDelimitedList(searchParams.get("seedGenres"), 6);
    const seedYearRaw = Number(searchParams.get("seedYear"));
    const seedYear =
      Number.isFinite(seedYearRaw) && seedYearRaw >= 1900 && seedYearRaw <= 2100
        ? seedYearRaw
        : undefined;
    const excludeTrackIds = parseDelimitedList(searchParams.get("excludeIds"), 60);
    const sessionRecentKeys = parseDelimitedList(searchParams.get("recentKeys"), 40);

    const profile = userId
      ? await loadUserTasteProfile(userId)
      : createEmptyTasteProfile();
    const maturityFactor = computeMaturityFactor(profile);

    const seedTrack: MusicItem | null =
      seedTitle || seedArtists.length > 0
        ? {
            id: seedId || "spotify:track:seed",
            provider: "spotify",
            providerItemId: seedId.replace("spotify:track:", "") || "seed",
            itemType: "track",
            title: seedTitle || "Current Track",
            artistNames: seedArtists.length > 0 ? seedArtists : ["Unknown Artist"],
            releaseYear: seedYear,
            genres: seedGenres.length > 0 ? seedGenres : undefined,
            externalUrl: "https://open.spotify.com",
          }
        : null;

    const plannedAuto = buildAutoplayCatalogQueries(seedTrack, profile);
    const autoPromises: Promise<MusicItem[]>[] = [];

    if (plannedAuto.primaryContextQuery) {
      autoPromises.push(fetchCatalogTracksCached(plannedAuto.primaryContextQuery, 20));
    }
    if (
      plannedAuto.bridgeQuery &&
      plannedAuto.bridgeQuery !== plannedAuto.primaryContextQuery
    ) {
      autoPromises.push(fetchCatalogTracksCached(plannedAuto.bridgeQuery, 16));
    }
    if (autoPromises.length === 0) {
      autoPromises.push(
        fetchCatalogTracksCached(COLD_START_STARTER_QUERIES[0], 24)
      );
    }

    let candidateBatches = await Promise.all(autoPromises);
    let candidatePool = deduplicateMusicItems(candidateBatches.flat());

    if (candidatePool.length < 10) {
      const fallbackBatch = await fetchCatalogTracksCached(
        COLD_START_STARTER_QUERIES[
          Math.floor(Date.now() / (30 * 60 * 1000)) % COLD_START_STARTER_QUERIES.length
        ],
        18
      );
      candidatePool = deduplicateMusicItems([...candidatePool, ...fallbackBatch]);
    }

    const enrichedPool = await enrichTracksWithArtistGenres(candidatePool);
    const rankedAuto = rankAutoplayCandidates(seedTrack, enrichedPool, profile, {
      limit: requestedLimit,
      excludeTrackIds,
      sessionRecentKeys,
    });

    return NextResponse.json({
      success: true,
      mode: "autoplay",
      authenticated: Boolean(userId),
      maturityFactor,
      tracks: rankedAuto.map((r) => r.item),
    });
  } catch (err: any) {
    console.error("[music/recommendations] GET error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Gagal menyusun rekomendasi musik.",
        tracks: [],
      },
      { status: 500 }
    );
  }
}
