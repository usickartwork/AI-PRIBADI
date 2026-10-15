import { NextResponse } from "next/server";
import { parseLrc, normalizeLyricQuery, LyricsData } from "@/lib/lyrics";

// Server-side in-memory cache with TTL to minimize outbound requests to LRCLIB
interface CacheEntry {
  data: LyricsData | null;
  expiresAt: number;
}

const lyricsCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 1000;
const CACHE_TTL_SUCCESS_MS = 1000 * 60 * 60 * 24; // 24 hours
const CACHE_TTL_NOT_FOUND_MS = 1000 * 60 * 60 * 2; // 2 hours for 404s

function pruneCacheIfNeeded() {
  if (lyricsCache.size <= MAX_CACHE_SIZE) return;
  const now = Date.now();
  for (const [key, entry] of lyricsCache.entries()) {
    if (entry.expiresAt < now) {
      lyricsCache.delete(key);
    }
  }
  // If still too large, remove oldest
  if (lyricsCache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(lyricsCache.keys()).slice(0, 200);
    for (const key of keysToDelete) {
      lyricsCache.delete(key);
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawTitle = searchParams.get("title")?.slice(0, 200).trim() || "";
  const rawArtist = searchParams.get("artist")?.slice(0, 200).trim() || "";
  const rawAlbum = searchParams.get("album")?.slice(0, 200).trim() || "";
  const rawDuration = searchParams.get("duration")?.trim() || "";

  if (!rawTitle) {
    return NextResponse.json(
      { success: false, error: "Missing required parameter: title" },
      { status: 400 }
    );
  }

  const cacheKey = `${normalizeLyricQuery(rawTitle)}___${normalizeLyricQuery(rawArtist)}`;

  // Check server cache
  const cached = lyricsCache.get(cacheKey);
  if (cached) {
    if (Date.now() < cached.expiresAt) {
      if (cached.data === null) {
        return NextResponse.json(
          {
            success: false,
            error: "Lirik belum tersedia untuk lagu ini.",
            cached: true,
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { ...cached.data, cached: true },
      });
    } else {
      lyricsCache.delete(cacheKey);
    }
  }

  const userAgent = "UsickOne/1.0.0 (https://usick.one; contact@usick.one)";
  const headers = {
    "User-Agent": userAgent,
    Accept: "application/json",
  };

  try {
    let rawResult: any = null;

    // ─── Step 1: Direct Match via GET /api/get ─────────────────────────────
    const getParams = new URLSearchParams({
      track_name: rawTitle,
      artist_name: rawArtist,
    });
    if (rawAlbum) getParams.set("album_name", rawAlbum);
    if (rawDuration && !isNaN(Number(rawDuration))) {
      getParams.set("duration", String(Math.round(Number(rawDuration))));
    }

    const getRes = await fetch(`https://lrclib.net/api/get?${getParams.toString()}`, {
      headers,
      next: { revalidate: 86400 },
    });

    if (getRes.status === 429) {
      const retryAfter = getRes.headers.get("Retry-After") || "5";
      return NextResponse.json(
        {
          success: false,
          error: "Batas permintaan ke penyedia lirik tercapai. Coba lagi dalam beberapa saat.",
          retryAfter: Number(retryAfter),
        },
        { status: 429 }
      );
    }

    if (getRes.ok) {
      const data = await getRes.json();
      if (data && (data.syncedLyrics || data.plainLyrics || data.instrumental)) {
        rawResult = data;
      }
    }

    // ─── Step 2: Fallback to Search via GET /api/search ────────────────────
    if (!rawResult) {
      const searchParamsObj = new URLSearchParams();
      searchParamsObj.set("track_name", normalizeLyricQuery(rawTitle));
      if (rawArtist) searchParamsObj.set("artist_name", normalizeLyricQuery(rawArtist));

      const searchRes = await fetch(`https://lrclib.net/api/search?${searchParamsObj.toString()}`, {
        headers,
        next: { revalidate: 86400 },
      });

      if (searchRes.status === 429) {
        const retryAfter = searchRes.headers.get("Retry-After") || "5";
        return NextResponse.json(
          {
            success: false,
            error: "Batas permintaan ke penyedia lirik tercapai. Coba lagi dalam beberapa saat.",
            retryAfter: Number(retryAfter),
          },
          { status: 429 }
        );
      }

      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          const targetDuration = rawDuration ? Number(rawDuration) : null;

          // Rank results: prefer syncedLyrics > plainLyrics, and closest duration
          const sorted = [...results].sort((a, b) => {
            // Priority 1: Has synced lyrics
            const aHasSynced = a.syncedLyrics ? 1 : 0;
            const bHasSynced = b.syncedLyrics ? 1 : 0;
            if (aHasSynced !== bHasSynced) return bHasSynced - aHasSynced;

            // Priority 2: Duration delta if available
            if (targetDuration && a.duration && b.duration) {
              const diffA = Math.abs(a.duration - targetDuration);
              const diffB = Math.abs(b.duration - targetDuration);
              return diffA - diffB;
            }

            return 0;
          });

          rawResult = sorted[0];
        }
      }
    }

    // ─── Step 3: Handle Result or 404 ──────────────────────────────────────
    if (!rawResult || (!rawResult.syncedLyrics && !rawResult.plainLyrics && !rawResult.instrumental)) {
      pruneCacheIfNeeded();
      lyricsCache.set(cacheKey, {
        data: null,
        expiresAt: Date.now() + CACHE_TTL_NOT_FOUND_MS,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Lirik belum tersedia untuk lagu ini.",
          cached: false,
        },
        { status: 404 }
      );
    }

    const isInstrumental = Boolean(rawResult.instrumental);
    const syncedLyrics = rawResult.syncedLyrics || null;
    const plainLyrics = rawResult.plainLyrics || null;
    const parsedLines = syncedLyrics ? parseLrc(syncedLyrics) : [];

    const lyricsData: LyricsData = {
      id: rawResult.id,
      trackName: rawResult.trackName || rawTitle,
      artistName: rawResult.artistName || rawArtist,
      albumName: rawResult.albumName || rawAlbum || undefined,
      duration: rawResult.duration || undefined,
      instrumental: isInstrumental,
      plainLyrics,
      syncedLyrics,
      lines: parsedLines,
      synced: parsedLines.length > 0,
      plainText: plainLyrics || (syncedLyrics ? parsedLines.map((l) => l.text).join("\n") : null),
      cached: false,
    };

    // Cache successful result
    pruneCacheIfNeeded();
    lyricsCache.set(cacheKey, {
      data: lyricsData,
      expiresAt: Date.now() + CACHE_TTL_SUCCESS_MS,
    });

    return NextResponse.json({
      success: true,
      data: lyricsData,
    });
  } catch (err: any) {
    console.error("[LRCLIB Proxy Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menghubungkan ke layanan lirik. Silakan coba lagi.",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}
