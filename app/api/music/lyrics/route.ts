import { NextResponse } from "next/server";
import { parseLrc, normalizeLyricQuery, LyricsData } from "@/lib/lyrics";

// Server-side in-memory cache with TTL to minimize outbound requests
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
  if (lyricsCache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(lyricsCache.keys()).slice(0, 200);
    for (const key of keysToDelete) {
      lyricsCache.delete(key);
    }
  }
}

interface LyricsResult {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  instrumental: boolean;
  provider: "lrclib" | "netease" | "kugou" | "lyricsovh";
  id?: number | string;
  duration?: number;
}

function isSubstantialLyrics(item: any): boolean {
  if (!item) return false;
  if (item.instrumental) return true;
  if (item.syncedLyrics && typeof item.syncedLyrics === "string") {
    const lines = item.syncedLyrics.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length >= 4 && item.syncedLyrics.length >= 50) return true;
  }
  if (item.plainLyrics && typeof item.plainLyrics === "string" && item.plainLyrics.trim().length >= 40) {
    return true;
  }
  return false;
}

// ─── PROVIDER 1: LRCLIB (Primary Synced Lyrics) ──────────────────────────────
async function fetchFromLrclib(
  rawTitle: string,
  rawArtist: string,
  rawAlbum: string,
  rawDuration: string
): Promise<LyricsResult | null> {
  const userAgent = "UsickOne/1.0.0 (https://usick.one; contact@usick.one)";
  const headers = { "User-Agent": userAgent, Accept: "application/json" };

  try {
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
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 86400 },
    });

    if (getRes.status === 429) {
      console.warn("[Lyrics] LRCLIB returned 429 (Rate Limit). Shifting immediately to fallback provider...");
      return null;
    }

    if (getRes.ok) {
      const data = await getRes.json();
      if (isSubstantialLyrics(data)) {
        return {
          id: data.id,
          syncedLyrics: data.syncedLyrics || null,
          plainLyrics: data.plainLyrics || null,
          instrumental: Boolean(data.instrumental),
          duration: data.duration,
          provider: "lrclib",
        };
      }
    }

    // Step 1b: Search LRCLIB if direct match was not substantial
    const searchRes = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(`${rawTitle} ${rawArtist}`.trim())}`,
      {
        headers,
        signal: AbortSignal.timeout(3500),
        next: { revalidate: 86400 },
      }
    );

    if (searchRes.status === 429) {
      console.warn("[Lyrics] LRCLIB search returned 429. Shifting to fallback provider...");
      return null;
    }

    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        const targetDuration = rawDuration ? Number(rawDuration) : null;
        const validCandidates = results.filter(isSubstantialLyrics);
        const pool = validCandidates.length > 0 ? validCandidates : results;

        const sorted = [...pool].sort((a, b) => {
          const aHasSynced = a.syncedLyrics ? 1 : 0;
          const bHasSynced = b.syncedLyrics ? 1 : 0;
          if (aHasSynced !== bHasSynced) return bHasSynced - aHasSynced;
          if (targetDuration && a.duration && b.duration) {
            return Math.abs(a.duration - targetDuration) - Math.abs(b.duration - targetDuration);
          }
          return 0;
        });

        const best = sorted[0];
        if (isSubstantialLyrics(best)) {
          return {
            id: best.id,
            syncedLyrics: best.syncedLyrics || null,
            plainLyrics: best.plainLyrics || null,
            instrumental: Boolean(best.instrumental),
            duration: best.duration,
            provider: "lrclib",
          };
        }
      }
    }
  } catch (e: any) {
    console.warn("[Lyrics] LRCLIB fetch failed or timed out:", e?.message || e);
  }

  return null;
}

// ─── PROVIDER 2: NETEASE CLOUD MUSIC (High-Coverage Synced LRC Fallback) ──────
async function fetchFromNetease(rawTitle: string, rawArtist: string): Promise<LyricsResult | null> {
  try {
    const query = `${rawTitle} ${rawArtist}`.trim();
    const searchUrl = `https://music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(query)}&type=1&offset=0&limit=3`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Referer: "https://music.163.com",
      },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 86400 },
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const songs = searchData?.result?.songs;
    if (!Array.isArray(songs) || songs.length === 0) return null;

    const songId = songs[0].id;
    if (!songId) return null;

    const lyricUrl = `https://music.163.com/api/song/lyric?id=${songId}&lv=1&kv=1&tv=-1`;
    const lyricRes = await fetch(lyricUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Referer: "https://music.163.com",
      },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 86400 },
    });

    if (!lyricRes.ok) return null;
    const lyricData = await lyricRes.json();
    const lrcText = lyricData?.lrc?.lyric;
    if (lrcText && typeof lrcText === "string" && lrcText.trim().length > 30) {
      return {
        id: songId,
        syncedLyrics: lrcText,
        plainLyrics: null,
        instrumental: Boolean(lyricData?.nolyric || lyricData?.uncollected),
        provider: "netease",
      };
    }
  } catch (e: any) {
    console.warn("[Lyrics] NetEase fetch failed or timed out:", e?.message || e);
  }

  return null;
}

// ─── PROVIDER 3: KUGOU MUSIC (Extensive Asian & Global Synced LRC Fallback) ───
async function fetchFromKugou(rawTitle: string, rawArtist: string): Promise<LyricsResult | null> {
  try {
    const query = `${rawTitle} ${rawArtist}`.trim();
    const searchUrl = `http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=${encodeURIComponent(query)}&page=1&pagesize=3`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 86400 },
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const info = searchData?.data?.info;
    if (!Array.isArray(info) || info.length === 0) return null;

    const hash = info[0].hash;
    if (!hash) return null;

    const candidateUrl = `http://krcs.kugou.com/search?ver=1&man=yes&client=mobi&keyword=&duration=&hash=${hash}`;
    const candRes = await fetch(candidateUrl, { signal: AbortSignal.timeout(3000) });
    if (!candRes.ok) return null;
    const candData = await candRes.json();
    const candidates = candData?.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) return null;

    const cand = candidates[0];
    const downUrl = `http://krcs.kugou.com/download?ver=1&client=mobi&id=${cand.id}&accesskey=${cand.accesskey}&fmt=lrc&charset=utf8`;
    const downRes = await fetch(downUrl, { signal: AbortSignal.timeout(3000) });
    if (!downRes.ok) return null;
    const downData = await downRes.json();
    if (downData?.content) {
      const decodedLrc = Buffer.from(downData.content, "base64").toString("utf-8");
      if (decodedLrc.trim().length > 30) {
        return {
          id: cand.id,
          syncedLyrics: decodedLrc,
          plainLyrics: null,
          instrumental: false,
          provider: "kugou",
        };
      }
    }
  } catch (e: any) {
    console.warn("[Lyrics] Kugou fetch failed or timed out:", e?.message || e);
  }

  return null;
}

// ─── PROVIDER 4: LYRICS.OVH (Public Plain Text Fallback) ──────────────────────
async function fetchFromLyricsOvh(rawTitle: string, rawArtist: string): Promise<LyricsResult | null> {
  try {
    const cleanArtist = rawArtist.split(",")[0].trim();
    const cleanTitle = rawTitle.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.lyrics && typeof data.lyrics === "string" && data.lyrics.trim().length > 30) {
      return {
        syncedLyrics: null,
        plainLyrics: data.lyrics.trim(),
        instrumental: false,
        provider: "lyricsovh",
      };
    }
  } catch (e: any) {
    console.warn("[Lyrics] Lyrics.ovh fetch failed or timed out:", e?.message || e);
  }

  return null;
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

  try {
    let rawResult: LyricsResult | null = null;

    // ─── Tier 1: Primary LRCLIB ──────────────────────────────────────────
    rawResult = await fetchFromLrclib(rawTitle, rawArtist, rawAlbum, rawDuration);

    // ─── Tier 2: NetEase Cloud Music Fallback (Full Synced LRC) ──────────
    if (!rawResult) {
      rawResult = await fetchFromNetease(rawTitle, rawArtist);
    }

    // ─── Tier 3: Kugou Music Fallback (Full Synced LRC) ──────────────────
    if (!rawResult) {
      rawResult = await fetchFromKugou(rawTitle, rawArtist);
    }

    // ─── Tier 4: Lyrics.ovh Fallback (Plain Text) ────────────────────────
    if (!rawResult) {
      rawResult = await fetchFromLyricsOvh(rawTitle, rawArtist);
    }

    // ─── If all providers return null, cache 404 for 2 hours ─────────────
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
      id: typeof rawResult.id === "number" ? rawResult.id : undefined,
      trackName: rawTitle,
      artistName: rawArtist,
      albumName: rawAlbum || undefined,
      duration: rawResult.duration,
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
    console.error("[Lyrics Proxy Error]:", err);
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
