import { NextResponse } from "next/server";

// Cache in-memory for fast responses (persists across warm serverless invocations)
const MAX_VIDEO_CACHE_ENTRIES = 1000;
interface CachedVideo {
  videoId: string;
  startSeconds: number;
}
const videoCache = new Map<string, CachedVideo>();

function setCachedVideo(key: string, data: CachedVideo): void {
  if (videoCache.has(key)) {
    videoCache.delete(key);
  } else if (videoCache.size >= MAX_VIDEO_CACHE_ENTRIES) {
    const oldest = videoCache.keys().next().value;
    if (oldest !== undefined) videoCache.delete(oldest);
  }
  videoCache.set(key, data);
}

function normalizeKey(title: string, artist: string = ""): string {
  return `${title.toLowerCase().trim()} - ${artist.toLowerCase().trim()}`
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Pre-cached verified YouTube studio audio / lyric video IDs (0:00 instant start, 0 dialogue)
const PRELOADED_TRACKS: [string, string, string][] = [
  ["Gala bunga matahari", "Sal Priadi", "lABZ_-uhC0E"],
  ["Shape of You", "Ed Sheeran", "_dK2tDK9grQ"],
  ["Blinding Lights", "The Weeknd", "fHI8X4OXluQ"],
  ["Save Your Tears", "The Weeknd", "XXYlFuWEuKI"],
  ["BIRDS OF A FEATHER", "Billie Eilish", "V9PVRfjEBTI"],
  ["Die With A Smile", "Lady Gaga Bruno Mars", "kPa7bsKwL-c"],
  ["Espresso", "Sabrina Carpenter", "51zjlMhdSTE"],
  ["Taste", "Sabrina Carpenter", "z9Q9OzL_wI8"],
  ["Cruel Summer", "Taylor Swift", "ic8j13piAhQ"],
  ["Satu Bulan", "Bernadya", "7Jm2Il2U-c0"],
  ["Evaluasi", "Hindia", "saXhrw-7rQI"],
  ["Rayuan Perempuan Gila", "Nadin Amizah", "gIsoLyQX7W8"],
  ["Viva La Vida", "Coldplay", "dvgZkm1xWPE"],
  ["Levitating", "Dua Lipa", "TUVcZfQe-Kw"],
  ["Bohemian Rhapsody", "Queen", "fJ9rUzIMcZQ"],
  ["APT.", "ROSÉ Bruno Mars", "8Ebqe2Dbzls"],
  ["Untungnya, Hidup Harus Tetap Berjalan", "Bernadya", "HB8vftGxsIc"],
  ["As It Was", "Harry Styles", "H5v3kku4y6Q"],
  ["Glimpse of Us", "Joji", "FvOpPeKSf_4"],
  ["Yellow", "Coldplay", "yKNxeF4KMsY"],
  ["Starboy", "The Weeknd Daft Punk", "Rif-RTvmmss"],
  ["Sial", "Mahalini", "QSWYyoF79oE"],
  ["Komang", "Raim Laode", "vl_3mZx88zw"],
  ["Never Gonna Give You Up", "Rick Astley", "3BFTio5296w"],
  ["Mr. Brightside", "The Killers", "l7MaKmKJqoc"],
  ["Someone Like You", "Adele", "hLQl3WQQoQ0"],
  ["Perfect", "Ed Sheeran", "iKzRIweSBLA"],
  ["Flowers", "Miley Cyrus", "SWpAYbgHmTo"],
  ["Attention", "Charlie Puth", "nfs8NYg7yQM"],
  ["Stay", "The Kid LAROI Justin Bieber", "kTJczUoc268"],
];

for (const [title, artist, videoId] of PRELOADED_TRACKS) {
  videoCache.set(normalizeKey(title, artist), { videoId, startSeconds: 0 });
  videoCache.set(normalizeKey(title, ""), { videoId, startSeconds: 0 });
}

// Queries SponsorBlock for intro skit/dialogue segments so MVs can skip straight to the music
async function getIntroSkipSeconds(videoId: string): Promise<number> {
  try {
    const res = await fetch(
      `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=["music_offtopic","intro"]`,
      { signal: AbortSignal.timeout(1200) }
    );
    if (!res.ok) return 0;
    const segments = await res.json();
    if (Array.isArray(segments)) {
      const intro = segments.find(
        (s: any) =>
          Array.isArray(s.segment) &&
          s.segment[0] <= 2.5 &&
          s.segment[1] > 2.5
      );
      if (intro && typeof intro.segment[1] === "number") {
        return Math.round(intro.segment[1] * 10) / 10;
      }
    }
  } catch {}
  return 0;
}

async function searchInnerTube(title: string, artist: string): Promise<string | null> {
  const cleanTitle = title.trim();
  const cleanArtist = artist.trim();

  // Method 1: YouTube Web with "${title} ${artist} official audio" to prioritize pure studio audio over dialogue-heavy MVs
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00",
            hl: "en",
            gl: "US",
          },
        },
        query: `${cleanTitle} ${cleanArtist} official audio`.trim(),
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const str = JSON.stringify(data);
      const match = str.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {}

  // Method 2: YouTube Music WEB_REMIX API
  try {
    const res = await fetch("https://music.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://music.youtube.com/",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB_REMIX",
            clientVersion: "1.20240101.01.00",
            hl: "en",
            gl: "US",
          },
        },
        query: `${cleanTitle} ${cleanArtist}`.trim(),
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const str = JSON.stringify(data);
      const match = str.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {}

  // Method 3: Standard YouTube Web Fallback
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00",
            hl: "en",
            gl: "US",
          },
        },
        query: `${cleanTitle} ${cleanArtist}`.trim(),
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const str = JSON.stringify(data);
      const match = str.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {}

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() || "";
  const artist = searchParams.get("artist")?.trim() || "";
  const trackId = searchParams.get("id")?.trim() || "";

  if (!title && !trackId) {
    return NextResponse.json({ success: false, error: "Missing title or id" }, { status: 400 });
  }

  // 1. Check in-memory preloaded cache
  const keyWithArtist = normalizeKey(title, artist);
  if (videoCache.has(keyWithArtist)) {
    const cached = videoCache.get(keyWithArtist)!;
    return NextResponse.json({
      success: true,
      videoId: cached.videoId,
      startSeconds: cached.startSeconds || 0,
      cached: true,
    });
  }

  const keyTitleOnly = normalizeKey(title, "");
  if (videoCache.has(keyTitleOnly)) {
    const cached = videoCache.get(keyTitleOnly)!;
    return NextResponse.json({
      success: true,
      videoId: cached.videoId,
      startSeconds: cached.startSeconds || 0,
      cached: true,
    });
  }

  // 2. Perform live resolution using YouTube Official Audio / InnerTube
  try {
    const videoId = await searchInnerTube(title, artist);
    if (videoId) {
      const startSeconds = await getIntroSkipSeconds(videoId);
      setCachedVideo(keyWithArtist, { videoId, startSeconds });
      return NextResponse.json({
        success: true,
        videoId,
        startSeconds,
        title,
        artist,
      });
    }
  } catch (err) {
    console.warn("[Music Play Resolution Error]:", err);
  }

  // 3. Honest unresolved fallback: never substitute a random unrelated song (e.g. Shape of You),
  // allowing the client player to fall back to genuine previewUrl or skip cleanly during Autoplay.
  return NextResponse.json({
    success: false,
    videoId: null,
    startSeconds: 0,
    title,
    artist,
    fallback: true,
    error: "Could not resolve audio track",
  });
}
