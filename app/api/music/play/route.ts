import { NextResponse } from "next/server";

interface PlayCacheEntry {
  audioUrl: string | null;
  audioMimeType: string | null;
  audioSource: "custom_stream" | "youtube_direct_m4a" | "youtube_iframe_fallback" | null;
  isFullTrackAudio: boolean;
  durationSeconds?: number;
  videoId: string | null;
  expiresAt: number;
}

interface DirectStreamEntry {
  upstreamUrl: string;
  mimeType: string;
  userAgent: string;
  durationSeconds?: number;
  expiresAt: number;
}

const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
const playCache = new Map<string, PlayCacheEntry>();
const directStreamCache = new Map<string, DirectStreamEntry>();

function pruneCaches() {
  const now = Date.now();
  if (playCache.size > 500) {
    for (const [k, v] of playCache.entries()) {
      if (v.expiresAt <= now) playCache.delete(k);
    }
  }
  if (directStreamCache.size > 500) {
    for (const [k, v] of directStreamCache.entries()) {
      if (v.expiresAt <= now) directStreamCache.delete(k);
    }
  }
}

// Tier 1: Optional configured custom full-track audio stream provider
async function resolveConfiguredStream(
  title: string,
  artist: string,
  trackId: string
): Promise<{
  audioUrl: string;
  audioMimeType: string;
  isFullTrackAudio: boolean;
  durationSeconds?: number;
} | null> {
  const endpoint = process.env.MUSIC_STREAM_API_URL?.trim();
  if (!endpoint) return null;

  try {
    const url = new URL(endpoint);
    url.searchParams.set("title", title);
    url.searchParams.set("artist", artist);
    if (trackId) url.searchParams.set("id", trackId);

    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.MUSIC_STREAM_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.MUSIC_STREAM_API_KEY.trim()}`;
    }

    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = await res.json();
    const candidateUrl =
      typeof data?.audioUrl === "string"
        ? data.audioUrl.trim()
        : typeof data?.url === "string"
        ? data.url.trim()
        : "";

    if (!candidateUrl || !candidateUrl.startsWith("https://")) return null;
    const durationSec =
      typeof data?.durationSeconds === "number" && data.durationSeconds > 0
        ? data.durationSeconds
        : undefined;

    // Never accept 30-second previews
    if (durationSec !== undefined && durationSec < 60) return null;

    return {
      audioUrl: candidateUrl,
      audioMimeType:
        typeof data?.mimeType === "string" ? data.mimeType : "audio/mp4",
      isFullTrackAudio: true,
      durationSeconds: durationSec,
    };
  } catch {
    return null;
  }
}

// Resolve YouTube videoId (Official YouTube Data API v3 if key is set, otherwise YouTube search)
async function resolveYoutubeVideoId(
  title: string,
  artist: string
): Promise<string | null> {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (youtubeApiKey) {
    try {
      const q = `${title} ${artist} Official Audio`.trim();
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=1&q=${encodeURIComponent(
        q
      )}&key=${encodeURIComponent(youtubeApiKey)}`;
      const apiRes = await fetch(apiUrl, {
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 3600 },
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        const itemVid = apiData?.items?.[0]?.id?.videoId;
        if (typeof itemVid === "string" && itemVid.length === 11) {
          return itemVid;
        }
      }
    } catch {
      // Fall through to search fallback
    }
  }

  const searchQueries = [
    `${title} ${artist} Official Audio`,
    `${title} ${artist} Topic`,
    `${title} ${artist} Lyrics`,
    `${title} ${artist}`,
  ];

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  ];

  for (let i = 0; i < searchQueries.length; i++) {
    const q = searchQueries[i];
    const ua = userAgents[i % userAgents.length];

    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        q
      )}&hl=en&gl=US`;
      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": ua,
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(4500),
      });

      if (!res.ok) continue;
      const html = await res.text();

      const patterns = [
        /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/,
        /"videoId":"([a-zA-Z0-9_-]{11})"/,
        /watch\?v=([a-zA-Z0-9_-]{11})/,
      ];

      for (const regex of patterns) {
        const match = html.match(regex);
        if (match && match[1]) {
          return match[1];
        }
      }
    } catch {
      // Try next query
    }
  }

  return null;
}

// Fetch visitorData from official youtube.com/embed page to authenticate Innertube player requests
async function fetchYoutubeEmbedVisitorData(
  videoId: string
): Promise<string | undefined> {
  try {
    const res = await fetch(`https://www.youtube.com/embed/${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    const match = html.match(/"VISITOR_DATA":"([^"]+)"/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

interface InnertubeFormat {
  itag?: number;
  url?: string;
  mimeType?: string;
  bitrate?: number;
  contentLength?: string;
  approxDurationMs?: string;
}

// Resolve full-track .m4a (audio/mp4) stream from official youtube.com Innertube Player API
async function resolveYoutubeDirectAudioStream(
  videoId: string,
  skipProbe = false
): Promise<DirectStreamEntry | null> {
  const cached = directStreamCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const visitorData = await fetchYoutubeEmbedVisitorData(videoId);

  const clients = [
    {
      name: "ANDROID_VR",
      userAgent:
        "com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
      context: {
        client: {
          clientName: "ANDROID_VR",
          clientVersion: "1.60.19",
          deviceMake: "Oculus",
          deviceModel: "Quest 3",
          osName: "Android",
          osVersion: "12L",
          androidSdkVersion: 32,
          hl: "en",
          gl: "US",
          ...(visitorData ? { visitorData } : {}),
        },
      },
    },
    {
      name: "IOS",
      userAgent:
        "com.google.ios.youtube/20.03.02 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X;)",
      context: {
        client: {
          clientName: "IOS",
          clientVersion: "20.03.02",
          deviceMake: "Apple",
          deviceModel: "iPhone16,2",
          osName: "iPhone",
          osVersion: "18.2.1.22C161",
          hl: "en",
          gl: "US",
          ...(visitorData ? { visitorData } : {}),
        },
      },
    },
    {
      name: "ANDROID_TESTSUITE",
      userAgent:
        "com.google.android.youtube/1.9 (Linux; U; Android 11) gzip",
      context: {
        client: {
          clientName: "ANDROID_TESTSUITE",
          clientVersion: "1.9",
          androidSdkVersion: 30,
          hl: "en",
          gl: "US",
          ...(visitorData ? { visitorData } : {}),
        },
      },
    },
  ];

  for (const profile of clients) {
    try {
      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": profile.userAgent,
        Origin: "https://www.youtube.com",
      };
      if (visitorData) {
        reqHeaders["X-Goog-Visitor-Id"] = visitorData;
      }

      const res = await fetch(
        "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
        {
          method: "POST",
          headers: reqHeaders,
          body: JSON.stringify({
            videoId,
            context: profile.context,
            contentCheckOk: true,
            racyCheckOk: true,
          }),
          signal: AbortSignal.timeout(4500),
          cache: "no-store",
        }
      );

      if (!res.ok) continue;
      const data = await res.json();

      if (data?.playabilityStatus?.status !== "OK") continue;

      const lengthSeconds = Number(data?.videoDetails?.lengthSeconds || 0);
      // Reject short clips / previews (< 45 seconds)
      if (lengthSeconds > 0 && lengthSeconds < 45) continue;

      const adaptiveFormats: InnertubeFormat[] = Array.isArray(
        data?.streamingData?.adaptiveFormats
      )
        ? data.streamingData.adaptiveFormats
        : [];
      const muxedFormats: InnertubeFormat[] = Array.isArray(
        data?.streamingData?.formats
      )
        ? data.streamingData.formats
        : [];

      // Prioritize itag 140 (audio/mp4 AAC .m4a, native on iOS Safari), then any audio/mp4, then muxed mp4 (itag 18)
      const candidates: InnertubeFormat[] = [
        ...adaptiveFormats.filter(
          (f) => typeof f.url === "string" && f.itag === 140
        ),
        ...adaptiveFormats.filter(
          (f) =>
            typeof f.url === "string" &&
            f.itag !== 140 &&
            typeof f.mimeType === "string" &&
            f.mimeType.startsWith("audio/mp4")
        ),
        ...muxedFormats.filter(
          (f) =>
            typeof f.url === "string" &&
            typeof f.mimeType === "string" &&
            f.mimeType.startsWith("video/mp4")
        ),
      ];

      for (const candidate of candidates) {
        if (!candidate.url) continue;

        const rawMime = candidate.mimeType?.split(";")[0]?.trim() || "audio/mp4";
        const entry: DirectStreamEntry = {
          upstreamUrl: candidate.url,
          mimeType: rawMime.startsWith("video/mp4") ? "audio/mp4" : rawMime,
          userAgent: profile.userAgent,
          durationSeconds:
            lengthSeconds > 0
              ? lengthSeconds
              : candidate.approxDurationMs
              ? Math.round(Number(candidate.approxDurationMs) / 1000)
              : undefined,
          expiresAt: Date.now() + CACHE_TTL_MS,
        };

        if (skipProbe) {
          directStreamCache.set(videoId, entry);
          return entry;
        }

        // Verify with a fast 2-byte Range probe so we never return a 403/broken stream to <audio>
        try {
          const probeRes = await fetch(candidate.url, {
            method: "GET",
            headers: {
              Range: "bytes=0-1",
              "User-Agent": profile.userAgent,
            },
            signal: AbortSignal.timeout(3000),
            cache: "no-store",
          });

          if (probeRes.status === 206 || probeRes.status === 200) {
            directStreamCache.set(videoId, entry);
            return entry;
          }
        } catch {
          // Try next candidate
        }
      }
    } catch {
      // Try next client profile
    }
  }

  return null;
}

// Stream proxy handler for <audio src="/api/music/play?stream=1&videoId=..." /> with full HTTP Range support
async function handleAudioStreamProxy(request: Request, videoId: string) {
  const streamEntry = await resolveYoutubeDirectAudioStream(videoId, true);
  if (!streamEntry) {
    return new NextResponse("Direct audio stream unavailable", { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  const upstreamHeaders: Record<string, string> = {
    "User-Agent": streamEntry.userAgent,
  };
  if (rangeHeader) {
    upstreamHeaders["Range"] = rangeHeader;
  }

  try {
    const upstreamRes = await fetch(streamEntry.upstreamUrl, {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      directStreamCache.delete(videoId);
      return new NextResponse("Upstream stream error", {
        status: upstreamRes.status,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", streamEntry.mimeType || "audio/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "private, max-age=1800");

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch {
    return new NextResponse("Failed to proxy audio stream", { status: 502 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Mode 1: Direct binary audio stream proxy for HTML5 <audio>
    if (searchParams.get("stream") === "1") {
      const streamVideoId = searchParams.get("videoId")?.trim() || "";
      if (!/^[a-zA-Z0-9_-]{11}$/.test(streamVideoId)) {
        return new NextResponse("Invalid videoId", { status: 400 });
      }
      return handleAudioStreamProxy(request, streamVideoId);
    }

    // Mode 2: Metadata & playback resolution JSON
    const title = searchParams.get("title")?.trim() || "";
    const artist = searchParams.get("artist")?.trim() || "";
    const trackId = searchParams.get("id")?.trim() || "";
    const forceRefresh = searchParams.get("refresh") === "1";

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    pruneCaches();

    const cacheKey = `${trackId}::${title.toLowerCase()}::${artist.toLowerCase()}`;
    const now = Date.now();

    if (!forceRefresh) {
      const cached = playCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return NextResponse.json({
          success: true,
          title,
          artist,
          ...cached,
          cached: true,
        });
      }
    }

    // Resolve custom stream (if configured) and YouTube videoId in parallel
    const [customStream, videoId] = await Promise.all([
      resolveConfiguredStream(title, artist, trackId),
      resolveYoutubeVideoId(title, artist),
    ]);

    let audioUrl: string | null = null;
    let audioMimeType: string | null = null;
    let audioSource: PlayCacheEntry["audioSource"] = null;
    let isFullTrackAudio = false;
    let durationSeconds: number | undefined = undefined;

    if (customStream) {
      audioUrl = customStream.audioUrl;
      audioMimeType = customStream.audioMimeType;
      audioSource = "custom_stream";
      isFullTrackAudio = true;
      durationSeconds = customStream.durationSeconds;
    } else if (videoId) {
      const ytDirect = await resolveYoutubeDirectAudioStream(videoId, false);
      if (ytDirect) {
        audioUrl = `/api/music/play?stream=1&videoId=${encodeURIComponent(videoId)}`;
        audioMimeType = ytDirect.mimeType;
        audioSource = "youtube_direct_m4a";
        isFullTrackAudio = true;
        durationSeconds = ytDirect.durationSeconds;
      }
    }

    if (!audioUrl && videoId) {
      audioSource = "youtube_iframe_fallback";
    }

    if (!audioUrl && !videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not find playable audio or video for this track",
        },
        { status: 404 }
      );
    }

    const payload: PlayCacheEntry = {
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
    const errMsg =
      error instanceof Error ? error.message : "Failed to resolve track audio";
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
