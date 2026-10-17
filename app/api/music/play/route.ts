export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSpotifyTokenWithMetadata } from "@/lib/spotifyServer";

export interface ResolvedPlayPayload {
  audioUrl: string | null;
  audioMimeType: string | null;
  audioSource: "configured_stream" | "spotify_preview" | "itunes_m4a" | null;
  isFullTrackAudio: boolean;
  durationSeconds?: number;
  videoId: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL to avoid stale CDN URLs
const playCache = new Map<string, ResolvedPlayPayload>();

// Pre-cached starter videoIds for fallback player
const starterVideoIds = new Map<string, string>([
  ["never gonna give you up - rick astley", "3BFTio5296w"],
  ["shape of you - ed sheeran", "_dK2tDK9grQ"],
  ["blinding lights - the weeknd", "fHI8X4OXluQ"],
  ["save your tears - the weeknd", "u6lihZAcy4s"],
  ["mr. brightside - the killers", "l7MaKmKJqoc"],
]);

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSpotifyTrackId(rawId: string): string | null {
  if (!rawId) return null;
  const cleaned = rawId.replace(/^spotify:track:/i, "").trim();
  if (/^[0-9A-Za-z]{22}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

function detectIosCompatibleMime(url: string): string | null {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".m4a") || lower.endsWith(".mp4") || lower.endsWith(".aac")) {
    return "audio/mp4";
  }
  if (lower.endsWith(".mp3")) {
    return "audio/mpeg";
  }
  if (lower.endsWith(".m3u8")) {
    return "application/vnd.apple.mpegurl";
  }
  if (lower.endsWith(".wav")) {
    return "audio/wav";
  }
  return "audio/mp4";
}

// Tier 1: Optional configured authorized full-track audio stream endpoint
async function resolveConfiguredStream(params: {
  title: string;
  artist: string;
  trackId: string;
}): Promise<{
  audioUrl: string;
  audioMimeType: string;
  durationSeconds?: number;
} | null> {
  const baseUrl = process.env.MUSIC_STREAM_API_URL?.trim();
  if (!baseUrl) return null;

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("title", params.title);
    url.searchParams.set("artist", params.artist);
    if (params.trackId) url.searchParams.set("id", params.trackId);

    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.MUSIC_STREAM_API_KEY?.trim()) {
      headers["Authorization"] = `Bearer ${process.env.MUSIC_STREAM_API_KEY.trim()}`;
    }

    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(4500),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = await res.json();
    const candidateUrl = typeof data?.audioUrl === "string" ? data.audioUrl.trim() : "";
    if (!candidateUrl || !candidateUrl.startsWith("https://")) return null;

    return {
      audioUrl: candidateUrl,
      audioMimeType: data?.mimeType || detectIosCompatibleMime(candidateUrl) || "audio/mp4",
      durationSeconds: typeof data?.durationSeconds === "number" ? data.durationSeconds : undefined,
    };
  } catch {
    return null;
  }
}

// Tier 2: Official Spotify Track API preview_url (MP3)
async function resolveSpotifyPreviewAudio(rawTrackId: string): Promise<{
  audioUrl: string;
  audioMimeType: string;
  durationSeconds?: number;
} | null> {
  const spotifyId = extractSpotifyTrackId(rawTrackId);
  if (!spotifyId) return null;

  try {
    const tokenMeta = await getSpotifyTokenWithMetadata();
    if (!tokenMeta?.token) return null;

    const res = await fetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(spotifyId)}`, {
      headers: { Authorization: `Bearer ${tokenMeta.token}` },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const track = await res.json();
    if (typeof track?.preview_url === "string" && track.preview_url.startsWith("https://")) {
      return {
        audioUrl: track.preview_url,
        audioMimeType: "audio/mpeg",
        durationSeconds: 30,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Tier 3: Official Apple iTunes Search API (.m4a AAC stream hosted on Apple CDN)
async function resolveITunesM4aAudio(params: {
  title: string;
  artist: string;
  targetDurationMs?: number;
}): Promise<{
  audioUrl: string;
  audioMimeType: string;
  durationSeconds?: number;
} | null> {
  if (!params.title) return null;

  const query = `${params.title} ${params.artist}`.trim();
  const countries = ["ID", "US"];

  const normTargetTitle = normalizeText(params.title);
  const normTargetArtist = normalizeText(params.artist);

  for (const country of countries) {
    try {
      const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
        query
      )}&media=music&entity=song&limit=10&country=${country}`;

      const res = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;
      const json = await res.json();
      const results: Array<{
        previewUrl?: string;
        trackName?: string;
        artistName?: string;
        trackTimeMillis?: number;
      }> = Array.isArray(json?.results) ? json.results : [];
      if (results.length === 0) continue;

      let bestCandidate: {
        previewUrl?: string;
        trackName?: string;
        artistName?: string;
        trackTimeMillis?: number;
      } | null = null;
      let bestScore = -1;

      for (const item of results) {
        if (typeof item?.previewUrl !== "string" || !item.previewUrl.startsWith("https://")) {
          continue;
        }
        const itemTitle = normalizeText(String(item.trackName || ""));
        const itemArtist = normalizeText(String(item.artistName || ""));

        let score = 0;
        if (itemTitle === normTargetTitle) score += 50;
        else if (itemTitle.includes(normTargetTitle) || normTargetTitle.includes(itemTitle)) score += 30;

        if (normTargetArtist) {
          const primaryArtist = normTargetArtist.split(" ")[0];
          if (itemArtist === normTargetArtist) score += 40;
          else if (itemArtist.includes(normTargetArtist) || normTargetArtist.includes(itemArtist)) score += 25;
          else if (primaryArtist && itemArtist.includes(primaryArtist)) score += 12;
        }

        if (params.targetDurationMs && typeof item.trackTimeMillis === "number") {
          const diffMs = Math.abs(item.trackTimeMillis - params.targetDurationMs);
          if (diffMs <= 5000) score += 15;
          else if (diffMs <= 15000) score += 8;
        }

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = item;
        }
      }

      if (bestCandidate && bestCandidate.previewUrl && bestScore >= 25) {
        return {
          audioUrl: bestCandidate.previewUrl,
          audioMimeType: detectIosCompatibleMime(bestCandidate.previewUrl) || "audio/mp4",
          durationSeconds: 30,
        };
      }
    } catch {
      // Try next country fallback
    }
  }

  return null;
}

// Tier 4: Resolve YouTube videoId for the preserved YT.Player fallback engine
async function resolveFallbackVideoId(title: string, artist: string, cacheKey: string): Promise<string> {
  if (starterVideoIds.has(cacheKey)) {
    return starterVideoIds.get(cacheKey)!;
  }

  const query = `${title} ${artist} audio`.trim();

  // Prefer official YouTube Data API v3 when YOUTUBE_API_KEY is configured
  const ytApiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (ytApiKey) {
    try {
      const ytApiUrl = `https://www.googleapis.com/youtube/v3/search?part=id&type=video&videoCategoryId=10&maxResults=1&q=${encodeURIComponent(
        query
      )}&key=${encodeURIComponent(ytApiKey)}`;
      const apiRes = await fetch(ytApiUrl, {
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 86400 },
      });
      if (apiRes.ok) {
        const apiJson = await apiRes.json();
        const apiVideoId = apiJson?.items?.[0]?.id?.videoId;
        if (typeof apiVideoId === "string" && /^[a-zA-Z0-9_-]{11}$/.test(apiVideoId)) {
          return apiVideoId;
        }
      }
    } catch {}
  }

  // Existing fallback resolution preserved so YT.Player fallback continues to work
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(4500),
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const html = await res.text();
      const match =
        html.match(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/) ||
        html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        return match[1];
      }
    }

    const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(4500),
    });
    if (fallbackRes.ok) {
      const fallbackHtml = await fallbackRes.text();
      const fallbackMatch =
        fallbackHtml.match(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/) ||
        fallbackHtml.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (fallbackMatch && fallbackMatch[1]) {
        return fallbackMatch[1];
      }
    }
  } catch (err) {
    console.warn("[Music Play Fallback videoId Warning]:", err);
  }

  return "3BFTio5296w";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() || "";
  const artist = searchParams.get("artist")?.trim() || "";
  const trackId = searchParams.get("id")?.trim() || "";
  const durationMsParam = Number(searchParams.get("durationMs") || 0);
  const forceRefresh = searchParams.get("refresh") === "1";

  if (!title && !trackId) {
    return NextResponse.json({ success: false, error: "Missing title or id" }, { status: 400 });
  }

  const cacheKey = `${title.toLowerCase()} - ${artist.toLowerCase()}`;
  const now = Date.now();

  if (!forceRefresh && playCache.has(cacheKey)) {
    const cached = playCache.get(cacheKey)!;
    if (cached.expiresAt > now) {
      return NextResponse.json({
        success: true,
        ...cached,
        cached: true,
      });
    }
    playCache.delete(cacheKey);
  }

  try {
    // Run direct audio resolution and fallback videoId resolution in parallel for low latency
    const [configuredStream, spotifyPreview, itunesStream, videoId] = await Promise.all([
      resolveConfiguredStream({ title, artist, trackId }),
      resolveSpotifyPreviewAudio(trackId),
      resolveITunesM4aAudio({
        title,
        artist,
        targetDurationMs: durationMsParam > 0 ? durationMsParam : undefined,
      }),
      resolveFallbackVideoId(title, artist, cacheKey),
    ]);

    let audioUrl: string | null = null;
    let audioMimeType: string | null = null;
    let audioSource: ResolvedPlayPayload["audioSource"] = null;
    let isFullTrackAudio = false;
    let durationSeconds: number | undefined = undefined;

    if (configuredStream) {
      audioUrl = configuredStream.audioUrl;
      audioMimeType = configuredStream.audioMimeType;
      audioSource = "configured_stream";
      isFullTrackAudio = true;
      durationSeconds = configuredStream.durationSeconds;
    } else if (itunesStream) {
      // Prefer Apple iTunes .m4a (AAC) on iOS for hardware decoding & byte-range support
      audioUrl = itunesStream.audioUrl;
      audioMimeType = itunesStream.audioMimeType;
      audioSource = "itunes_m4a";
      isFullTrackAudio = false;
      durationSeconds = itunesStream.durationSeconds;
    } else if (spotifyPreview) {
      audioUrl = spotifyPreview.audioUrl;
      audioMimeType = spotifyPreview.audioMimeType;
      audioSource = "spotify_preview";
      isFullTrackAudio = false;
      durationSeconds = spotifyPreview.durationSeconds;
    }

    const payload: ResolvedPlayPayload = {
      audioUrl,
      audioMimeType,
      audioSource,
      isFullTrackAudio,
      durationSeconds,
      videoId,
      expiresAt: now + CACHE_TTL_MS,
    };

    playCache.set(cacheKey, payload);

    return NextResponse.json({
      success: true,
      title,
      artist,
      ...payload,
    });
  } catch (error: unknown) {
    console.error("[Music Play API Error]:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to resolve track audio";
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}

