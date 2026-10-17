import { NextResponse } from "next/server";

// Cache in-memory for fast responses
const videoCache = new Map<string, string>();

// Pre-cached starter hits for instant playback
videoCache.set("never gonna give you up - rick astley", "3BFTio5296w");
videoCache.set("shape of you - ed sheeran", "_dK2tDK9grQ");
videoCache.set("blinding lights - the weeknd", "fHI8X4OXluQ");
videoCache.set("save your tears - the weeknd", "u6lihZAcy4s");
videoCache.set("mr. brightside - the killers", "l7MaKmKJqoc");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() || "";
  const artist = searchParams.get("artist")?.trim() || "";
  const trackId = searchParams.get("id")?.trim() || "";

  if (!title && !trackId) {
    return NextResponse.json({ success: false, error: "Missing title or id" }, { status: 400 });
  }

  const cacheKey = `${title.toLowerCase()} - ${artist.toLowerCase()}`;
  if (videoCache.has(cacheKey)) {
    return NextResponse.json({
      success: true,
      videoId: videoCache.get(cacheKey),
      cached: true,
    });
  }

  const query = `${title} ${artist} audio`.trim();

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 86400 }, // Next.js cache 24h
    });

    if (!res.ok) {
      throw new Error(`YouTube search returned status ${res.status}`);
    }

    const html = await res.text();

    // Prefer videoRenderer videoId (official song/video)
    let match = html.match(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (!match) {
      match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    }

    if (match && match[1]) {
      const videoId = match[1];
      videoCache.set(cacheKey, videoId);
      return NextResponse.json({
        success: true,
        videoId,
        title,
        artist,
      });
    }

    // Secondary attempt without "audio" suffix
    const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const fallbackHtml = await fallbackRes.text();
    const fallbackMatch =
      fallbackHtml.match(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/) ||
      fallbackHtml.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

    if (fallbackMatch && fallbackMatch[1]) {
      const videoId = fallbackMatch[1];
      videoCache.set(cacheKey, videoId);
      return NextResponse.json({
        success: true,
        videoId,
        title,
        artist,
      });
    }

    // Default safe fallback if search yielded no match
    return NextResponse.json({
      success: true,
      videoId: "3BFTio5296w",
      fallback: true,
    });
  } catch (error: any) {
    console.error("[Music Play API Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to resolve track audio" },
      { status: 500 }
    );
  }
}
