import { NextResponse } from "next/server";

// Cache in-memory for fast responses (persists across warm serverless invocations)
const MAX_VIDEO_CACHE_ENTRIES = 1000;
const videoCache = new Map<string, string>();

function setCachedVideoId(key: string, videoId: string): void {
  if (videoCache.has(key)) {
    videoCache.delete(key);
  } else if (videoCache.size >= MAX_VIDEO_CACHE_ENTRIES) {
    const oldest = videoCache.keys().next().value;
    if (oldest !== undefined) videoCache.delete(oldest);
  }
  videoCache.set(key, videoId);
}

function normalizeKey(title: string, artist: string = ""): string {
  return `${title.toLowerCase().trim()} - ${artist.toLowerCase().trim()}`
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Pre-cached verified YouTube audio IDs for instant playback & zero API latency
const PRELOADED_TRACKS: [string, string, string][] = [
  ["Gala bunga matahari", "Sal Priadi", "AQpEIZ8dNcU"],
  ["Shape of You", "Ed Sheeran", "JGwWNGJdvx8"],
  ["Blinding Lights", "The Weeknd", "4NRXx6U8ABQ"],
  ["Save Your Tears", "The Weeknd", "XXYlFuWEuKI"],
  ["BIRDS OF A FEATHER", "Billie Eilish", "V9PVRfjEBTI"],
  ["Die With A Smile", "Lady Gaga Bruno Mars", "kPa7bsKwL-c"],
  ["Espresso", "Sabrina Carpenter", "eVli-tstM5E"],
  ["Taste", "Sabrina Carpenter", "KEG7b851Ric"],
  ["Cruel Summer", "Taylor Swift", "ic8j13piAhQ"],
  ["Satu Bulan", "Bernadya", "yjnSX_iUFVo"],
  ["Evaluasi", "Hindia", "cWrSjCZ5AeE"],
  ["Rayuan Perempuan Gila", "Nadin Amizah", "gIsoLyQX7W8"],
  ["Viva La Vida", "Coldplay", "dvgZkm1xWPE"],
  ["Levitating", "Dua Lipa", "TUVcZfQe-Kw"],
  ["Bohemian Rhapsody", "Queen", "fJ9rUzIMcZQ"],
  ["APT.", "ROSÉ Bruno Mars", "ekr2nIex040"],
  ["Untungnya, Hidup Harus Tetap Berjalan", "Bernadya", "HB8vftGxsIc"],
  ["As It Was", "Harry Styles", "H5v3kku4y6Q"],
  ["Glimpse of Us", "Joji", "FvOpPeKSf_4"],
  ["Yellow", "Coldplay", "yKNxeF4KMsY"],
  ["Starboy", "The Weeknd Daft Punk", "34Na4j8AVgA"],
  ["Sial", "Mahalini", "QSWYyoF79oE"],
  ["Komang", "Raim Laode", "vl_3mZx88zw"],
  ["Never Gonna Give You Up", "Rick Astley", "3BFTio5296w"],
  ["Mr. Brightside", "The Killers", "l7MaKmKJqoc"],
  ["Someone Like You", "Adele", "hLQl3WQQoQ0"],
  ["Perfect", "Ed Sheeran", "2Vv-BfVoq4g"],
  ["Flowers", "Miley Cyrus", "G7KNmW9a75Y"],
  ["Attention", "Charlie Puth", "nfs8NYg7yQM"],
  ["Stay", "The Kid LAROI Justin Bieber", "kTJczUoc268"],
];

for (const [title, artist, videoId] of PRELOADED_TRACKS) {
  videoCache.set(normalizeKey(title, artist), videoId);
  videoCache.set(normalizeKey(title, ""), videoId);
}

async function searchInnerTube(query: string): Promise<string | null> {
  // Method 1: YouTube Music WEB_REMIX API (high precision official audio track)
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
        query,
      }),
      signal: AbortSignal.timeout(4500),
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

  // Method 2: Standard YouTube Web InnerTube API
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
        query: `${query} audio`,
      }),
      signal: AbortSignal.timeout(4500),
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
    return NextResponse.json({
      success: true,
      videoId: videoCache.get(keyWithArtist),
      cached: true,
    });
  }

  const keyTitleOnly = normalizeKey(title, "");
  if (videoCache.has(keyTitleOnly)) {
    return NextResponse.json({
      success: true,
      videoId: videoCache.get(keyTitleOnly),
      cached: true,
    });
  }

  // 2. Perform live resolution using YouTube Music / Web InnerTube
  const query = `${title} ${artist}`.trim();
  try {
    const videoId = await searchInnerTube(query);
    if (videoId) {
      setCachedVideoId(keyWithArtist, videoId);
      return NextResponse.json({
        success: true,
        videoId,
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
    title,
    artist,
    fallback: true,
    error: "Could not resolve audio track",
  });
}
