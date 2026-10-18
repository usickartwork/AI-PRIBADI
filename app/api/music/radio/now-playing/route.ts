import { NextRequest, NextResponse } from "next/server";
import { POPULAR_RADIO_STATIONS } from "@/lib/radioStations";
import http from "http";
import https from "https";

export const dynamic = "force-dynamic";

interface NowPlayingResult {
  title: string;
  artist: string;
  rawTitle: string;
  stationId: string;
  stationName: string;
  timestamp: number;
}

// In-memory cache with 15-second TTL to keep stream overhead minimal
interface CacheEntry {
  data: NowPlayingResult;
  expiresAt: number;
}

const metadataCache = new Map<string, CacheEntry>();

/**
 * Parses raw ICY stream title strings like:
 * "Tiara Andini - Komet"
 * "Taylor Swift - Cruel Summer (Official)"
 * "StreamTitle='Dua Lipa - Training Season';StreamUrl='...';"
 */
function cleanAndSplitTitle(
  raw: string,
  stationName: string,
  stationTagline: string
): { title: string; artist: string; rawTitle: string } {
  let cleaned = (raw || "").trim();

  // Strip StreamTitle='...' wrappers if present
  const streamTitleMatch = cleaned.match(/StreamTitle=['"](.*?)['"];?/i);
  if (streamTitleMatch && streamTitleMatch[1]) {
    cleaned = streamTitleMatch[1].trim();
  } else {
    cleaned = cleaned.replace(/^StreamTitle=['"]|['"];?$/gi, "").trim();
  }

  // Strip common promo artifacts & URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, "").trim();
  cleaned = cleaned.replace(/\s*\|\s*$/g, "").trim();

  // If empty or identical to station name, fallback cleanly
  if (!cleaned || cleaned.toLowerCase() === stationName.toLowerCase()) {
    return {
      title: stationName,
      artist: stationTagline || "Siaran Radio 24/7",
      rawTitle: cleaned || stationName,
    };
  }

  // Typical Icecast separator: "Artist - Title"
  if (cleaned.includes(" - ")) {
    const parts = cleaned.split(" - ");
    const artist = parts[0].trim();
    const title = parts.slice(1).join(" - ").trim();
    if (artist && title) {
      return { title, artist, rawTitle: cleaned };
    }
  }

  // Alternate separator: "Artist : Title" or "Artist — Title"
  if (cleaned.includes(" — ")) {
    const parts = cleaned.split(" — ");
    const artist = parts[0].trim();
    const title = parts.slice(1).join(" — ").trim();
    if (artist && title) {
      return { title, artist, rawTitle: cleaned };
    }
  }

  return {
    title: cleaned,
    artist: stationName,
    rawTitle: cleaned,
  };
}

/**
 * Instant status fetcher for Icecast stations supporting /status-json.xsl
 * (e.g. Dengerin Pop Indonesia at https://stream.denger.in/status-json.xsl)
 */
async function fetchIcecastJsonStatus(baseUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2800);
  try {
    const urlObj = new URL(baseUrl);
    const statusUrl = `${urlObj.origin}/status-json.xsl`;
    const res = await fetch(statusUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "UsickOneRadio/1.0" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const source = json?.icestats?.source;
    if (Array.isArray(source)) {
      const activeSource = source.find((s) => s.title || s.yp_currently_playing) || source[0];
      return activeSource?.title || activeSource?.yp_currently_playing || null;
    }
    return source?.title || source?.yp_currently_playing || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Instant status fetcher for I Love Music network channels
 * (Channel 1 = Top 40, Channel 17 = Chillhop Lofi)
 */
async function fetchILoveMusicStatus(channelId: number): Promise<{ title: string; artist: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2800);
  try {
    const res = await fetch("https://www.ilovemusic.de/live/channels.json", {
      signal: controller.signal,
      headers: { "User-Agent": "UsickOneRadio/1.0" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const channel = json?.channels?.[String(channelId)];
    const track = channel?.current;
    if (track && (track.title || track.artist)) {
      return {
        title: track.title || "",
        artist: track.artist || "",
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Universal Icecast & Shoutcast ICY Stream Reader
 * Reads the first ICY metadata chunk without downloading the audio stream.
 */
function readIcyStreamTitle(streamUrl: string, timeoutMs = 3800): Promise<string | null> {
  return new Promise((resolve) => {
    let finished = false;
    const finish = (result: string | null) => {
      if (!finished) {
        finished = true;
        resolve(result);
      }
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    try {
      const parsedUrl = new URL(streamUrl);
      const client = parsedUrl.protocol === "https:" ? https : http;

      const req = client.get(
        streamUrl,
        {
          headers: {
            "Icy-MetaData": "1",
            "User-Agent": "UsickOneRadio/1.0 (Stream Title Resolver)",
            Accept: "*/*",
          },
          timeout: timeoutMs,
        },
        (res) => {
          // Handle 3xx Redirects
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            req.destroy();
            clearTimeout(timer);
            readIcyStreamTitle(res.headers.location, timeoutMs).then(finish);
            return;
          }

          const metaintHeader = res.headers["icy-metaint"];
          if (!metaintHeader) {
            // Check headers for stream info fallback
            const fallbackHeader =
              (res.headers["icy-description"] as string) ||
              (res.headers["icy-name"] as string) ||
              null;
            req.destroy();
            clearTimeout(timer);
            finish(fallbackHeader);
            return;
          }

          const metaint = parseInt(
            Array.isArray(metaintHeader) ? metaintHeader[0] : metaintHeader,
            10
          );

          if (isNaN(metaint) || metaint <= 0) {
            req.destroy();
            clearTimeout(timer);
            finish(null);
            return;
          }

          const chunks: Buffer[] = [];
          let totalBytes = 0;

          res.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
            totalBytes += chunk.length;

            if (totalBytes > metaint) {
              const buffer = Buffer.concat(chunks);
              const lengthByte = buffer[metaint];
              const metaLength = lengthByte * 16;

              if (metaLength > 0 && buffer.length >= metaint + 1 + metaLength) {
                const metaStr = buffer.slice(metaint + 1, metaint + 1 + metaLength).toString("utf8");
                req.destroy();
                clearTimeout(timer);
                finish(metaStr);
              } else if (lengthByte === 0 && buffer.length >= metaint + 1) {
                // Empty metadata block
                req.destroy();
                clearTimeout(timer);
                finish(null);
              }
            }
          });

          res.on("error", () => {
            clearTimeout(timer);
            finish(null);
          });
        }
      );

      req.on("error", () => {
        clearTimeout(timer);
        finish(null);
      });

      req.on("timeout", () => {
        req.destroy();
        clearTimeout(timer);
        finish(null);
      });
    } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stationId = searchParams.get("stationId") || "";

  if (!stationId) {
    return NextResponse.json(
      { error: "stationId is required" },
      { status: 400 }
    );
  }

  // 1. Check in-memory cache (15 seconds TTL)
  const now = Date.now();
  const cached = metadataCache.get(stationId);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data);
  }

  // 2. Identify target station
  const station = POPULAR_RADIO_STATIONS.find((s) => s.id === stationId);
  const stationName = station?.name || "Siaran Radio";
  const stationTagline = station?.tagline || "Hits Populer 24/7";
  const streamUrl = station?.streamUrl || "";

  let rawTitle = "";
  let extractedArtist = "";
  let extractedTitle = "";

  try {
    // 3. Fast-path station specific status endpoints
    if (stationId === "top-hits-lagu-indo" || stationId === "dengerin-pop-indonesia") {
      const status = await fetchIcecastJsonStatus(streamUrl);
      if (status) {
        rawTitle = status;
      }
    } else if (stationId === "lagu-global" || stationId === "iloveradio-top-40") {
      const status = await fetchILoveMusicStatus(1);
      if (status) {
        extractedArtist = status.artist;
        extractedTitle = status.title;
      }
    } else if (stationId === "lagu-chill" || stationId === "iloveradio-chillhop-lofi") {
      const status = await fetchILoveMusicStatus(17);
      if (status) {
        extractedArtist = status.artist;
        extractedTitle = status.title;
      }
    }

    // 4. Universal ICY metadata fallback if not yet resolved
    if (!rawTitle && !extractedTitle && streamUrl) {
      const icyRaw = await readIcyStreamTitle(streamUrl, 3500);
      if (icyRaw) {
        rawTitle = icyRaw;
      }
    }

    // 5. Clean and split title
    let resolvedData: { title: string; artist: string; rawTitle: string };
    if (extractedTitle) {
      resolvedData = {
        title: extractedTitle,
        artist: extractedArtist || stationName,
        rawTitle: `${extractedArtist} - ${extractedTitle}`.trim(),
      };
    } else {
      resolvedData = cleanAndSplitTitle(rawTitle, stationName, stationTagline);
    }

    const result: NowPlayingResult = {
      title: resolvedData.title,
      artist: resolvedData.artist,
      rawTitle: resolvedData.rawTitle,
      stationId,
      stationName,
      timestamp: Date.now(),
    };

    // Cache result for 15 seconds
    metadataCache.set(stationId, {
      data: result,
      expiresAt: now + 15000,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    // Graceful fallback to station metadata
    const fallback: NowPlayingResult = {
      title: stationName,
      artist: stationTagline,
      rawTitle: stationName,
      stationId,
      stationName,
      timestamp: Date.now(),
    };
    return NextResponse.json(fallback);
  }
}

