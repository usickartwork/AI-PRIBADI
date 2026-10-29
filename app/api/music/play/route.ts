import { NextResponse } from "next/server";
import {
  getCachedVideo,
  setCachedVideo,
  normalizeKey,
  searchInnerTube,
} from "@/lib/youtubeAudioServer";

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
  const cached = getCachedVideo(title, artist);
  if (cached && (!exclude || cached.videoId !== exclude)) {
    return NextResponse.json({
      success: true,
      videoId: cached.videoId,
      startSeconds: cached.startSeconds || 0,
      cached: true,
    });
  }

  // 2. Perform live resolution using YouTube InnerTube
  try {
    const videoId = await searchInnerTube(title, artist, exclude);
    if (videoId) {
      const startSeconds = await getIntroSkipSeconds(videoId);
      setCachedVideo(normalizeKey(title, artist), { videoId, startSeconds });
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
