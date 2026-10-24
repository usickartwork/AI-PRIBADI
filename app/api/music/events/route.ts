export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { appendListeningEventsForUser } from "@/lib/musicTasteServer";
import type { MusicListeningEventInput } from "@/lib/musicRecommendation";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_BATCH_EVENTS = 25;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rawText = await req.text();
    if (!rawText || rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Payload kosong atau melebihi batas ukuran." },
        { status: 400 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Format JSON event tidak valid." },
        { status: 400 }
      );
    }

    let rawEvents: MusicListeningEventInput[] = [];
    if (Array.isArray(parsed)) {
      rawEvents = parsed as MusicListeningEventInput[];
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.events)) {
        rawEvents = obj.events as MusicListeningEventInput[];
      } else if (typeof obj.playSessionId === "string") {
        rawEvents = [obj as unknown as MusicListeningEventInput];
      }
    }

    if (rawEvents.length === 0) {
      return NextResponse.json({
        success: true,
        acceptedCount: 0,
        skippedDuplicateCount: 0,
      });
    }

    const boundedBatch = rawEvents.slice(0, MAX_BATCH_EVENTS);
    const result = await appendListeningEventsForUser(userId, boundedBatch);

    return NextResponse.json({
      success: true,
      acceptedCount: result.acceptedCount,
      skippedDuplicateCount: result.skippedDuplicateCount,
      maturityFactor: result.maturityFactor,
      totalMeaningfulPlays: result.profile.maturityCount,
    });
  } catch (err: any) {
    console.error("[music/events] POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal mencatat aktivitas pemutaran." },
      { status: 500 }
    );
  }
}
