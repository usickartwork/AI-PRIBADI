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
  ["Enchanted", "Taylor Swift", "igIfiqqVHtA"],
  ["Enchanted (Taylor's Version)", "Taylor Swift", "igIfiqqVHtA"],
  ["Enchanted Taylors Version", "Taylor Swift", "igIfiqqVHtA"],
  ["Anti-Hero", "Taylor Swift", "b1kbLwvqugk"],
  ["Blank Space", "Taylor Swift", "e-ORhEE9VVg"],
  ["Love Story", "Taylor Swift", "8xg3vE8Ie_E"],
  ["Cardigan", "Taylor Swift", "K-a8s8OLBSE"],
  ["August", "Taylor Swift", "nn_0zPA61d8"],
  ["Lover", "Taylor Swift", "-BjZmE2gtdo"],
  ["Style", "Taylor Swift", "-CmadmM5cOk"],
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

function extractVideoCandidates(data: any): { videoId: string; channel: string; title: string }[] {
  const candidates: { videoId: string; channel: string; title: string }[] = [];
  try {
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    for (const c of contents) {
      const items = c?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item?.videoRenderer;
        if (v?.videoId && typeof v.videoId === "string" && v.videoId.length === 11) {
          const channel = v.ownerText?.runs?.[0]?.text || "";
          const title = v.title?.runs?.[0]?.text || "";
          candidates.push({ videoId: v.videoId, channel, title });
        }
      }
    }
  } catch {}
  return candidates;
}

async function searchInnerTube(title: string, artist: string, excludeId?: string): Promise<string | null> {
  const cleanTitle = title.trim();
  const cleanArtist = artist.trim();

  // Try standard search first (returns embeddable official lyric videos / MVs),
  // then fallback to "official audio"
  const queries = [
    `${cleanTitle} ${cleanArtist}`.trim(),
    `${cleanTitle} ${cleanArtist} official audio`.trim(),
  ];

  for (const q of queries) {
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
          query: q,
        }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidates = extractVideoCandidates(data);

        // Filter out excluded video IDs (e.g. if previous video had embedding blocked)
        const available = excludeId ? candidates.filter((c) => c.videoId !== excludeId) : candidates;

        // 1. Prefer non-Topic videos (channels ending in "- Topic" often have embedding disabled by UMG/labels)
        const nonTopic = available.find(
          (c) => !c.channel.endsWith("- Topic") && !c.channel.includes("Topic")
        );
        if (nonTopic) {
          return nonTopic.videoId;
        }

        // 2. Fallback to first available candidate
        if (available.length > 0) {
          return available[0].videoId;
        }

        // 3. Regex fallback
        const str = JSON.stringify(data);
        const matches = Array.from(str.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)).map((m) => m[1]);
        const validMatch = matches.find((id) => !excludeId || id !== excludeId);
        if (validMatch) {
          return validMatch;
        }
      }
    } catch {}
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() || "";
  const artist = searchParams.get("artist")?.trim() || "";
  const trackId = searchParams.get("id")?.trim() || "";
  const exclude = searchParams.get("exclude")?.trim() || "";

  if (!title && !trackId) {
    return NextResponse.json({ success: false, error: "Missing title or id" }, { status: 400 });
  }

  // 1. Check in-memory preloaded cache (only if not excluding this videoId)
  const keyWithArtist = normalizeKey(title, artist);
  if (videoCache.has(keyWithArtist)) {
    const cached = videoCache.get(keyWithArtist)!;
    if (!exclude || cached.videoId !== exclude) {
      return NextResponse.json({
        success: true,
        videoId: cached.videoId,
        startSeconds: cached.startSeconds || 0,
        cached: true,
      });
    }
  }

  const keyTitleOnly = normalizeKey(title, "");
  if (videoCache.has(keyTitleOnly)) {
    const cached = videoCache.get(keyTitleOnly)!;
    if (!exclude || cached.videoId !== exclude) {
      return NextResponse.json({
        success: true,
        videoId: cached.videoId,
        startSeconds: cached.startSeconds || 0,
        cached: true,
      });
    }
  }

  // 2. Perform live resolution using YouTube InnerTube
  try {
    const videoId = await searchInnerTube(title, artist, exclude);
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

  // 3. Honest unresolved fallback
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
