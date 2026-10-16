export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getNotesAdmin } from "@/lib/notesServer";
import { MusicItem, LocalPlaylist } from "@/lib/music";
import crypto from "crypto";

const SYSTEM_MUSIC_TITLE = "__USICK_MUSIC_LIBRARY__";

function getMusicSystemUserId(userId: string): string {
  return `${userId}::music_library`;
}

interface MusicLibraryPayload {
  likedSongs: MusicItem[];
  playlists: LocalPlaylist[];
  updatedAt: string;
}

function parseLibraryContent(raw: unknown): MusicLibraryPayload | null {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    const likedSongs = Array.isArray(obj.likedSongs) ? (obj.likedSongs as MusicItem[]) : [];
    const playlists = Array.isArray(obj.playlists) ? (obj.playlists as LocalPlaylist[]) : [];
    const updatedAt = typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString();
    return { likedSongs, playlists, updatedAt };
  } catch {
    return null;
  }
}

// GET /api/music/library - Load liked songs & playlists tied to the authenticated account
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getNotesAdmin();
    const systemUserId = getMusicSystemUserId(userId);

    // 1. Primary Cloud Storage: Supabase (isolated system record per userId)
    if (db) {
      const { data, error } = await db
        .from("user_notes")
        .select("id, content, updated_at")
        .eq("user_id", systemUserId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const parsed = parseLibraryContent(data[0].content);
        if (parsed) {
          return NextResponse.json({
            success: true,
            userId,
            hasCloudRecord: true,
            likedSongs: parsed.likedSongs,
            playlists: parsed.playlists,
            updatedAt: parsed.updatedAt || data[0].updated_at,
            source: "supabase",
          });
        }
      }
    }

    // 2. Secondary Cloud Storage Fallback: Clerk privateMetadata
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(userId);
      const metaLib = clerkUser.privateMetadata?.music_library;
      if (metaLib) {
        const parsed = parseLibraryContent(metaLib);
        if (parsed) {
          return NextResponse.json({
            success: true,
            userId,
            hasCloudRecord: true,
            likedSongs: parsed.likedSongs,
            playlists: parsed.playlists,
            updatedAt: parsed.updatedAt,
            source: "clerk_metadata",
          });
        }
      }
    } catch (metaErr) {
      console.warn("[music/library] Clerk metadata fallback read error:", metaErr);
    }

    return NextResponse.json({
      success: true,
      userId,
      hasCloudRecord: false,
      likedSongs: [],
      playlists: [],
      source: "empty",
    });
  } catch (err: any) {
    console.error("[music/library] GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat pustaka musik." },
      { status: 500 }
    );
  }
}

// POST /api/music/library - Save liked songs & playlists tied to the authenticated account
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const likedSongs: MusicItem[] = Array.isArray(body.likedSongs) ? body.likedSongs : [];
    const playlists: LocalPlaylist[] = Array.isArray(body.playlists) ? body.playlists : [];
    const now = new Date().toISOString();

    const payload: MusicLibraryPayload = {
      likedSongs,
      playlists,
      updatedAt: now,
    };
    const payloadStr = JSON.stringify(payload);

    const db = getNotesAdmin();
    const systemUserId = getMusicSystemUserId(userId);
    let savedToSupabase = false;

    // 1. Primary Cloud Storage: Supabase
    if (db) {
      const { data: existingRows } = await db
        .from("user_notes")
        .select("id")
        .eq("user_id", systemUserId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        const primaryId = existingRows[0].id;
        const { error: updateErr } = await db
          .from("user_notes")
          .update({
            title: SYSTEM_MUSIC_TITLE,
            content: payloadStr,
            updated_at: now,
          })
          .eq("id", primaryId);

        if (!updateErr) {
          savedToSupabase = true;
        } else {
          console.error("[music/library] Supabase update error:", updateErr);
        }
      } else {
        const { error: insertErr } = await db.from("user_notes").insert([
          {
            id: crypto.randomUUID(),
            user_id: systemUserId,
            title: SYSTEM_MUSIC_TITLE,
            content: payloadStr,
            is_pinned: false,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
        ]);

        if (!insertErr) {
          savedToSupabase = true;
        } else {
          console.error("[music/library] Supabase insert error:", insertErr);
        }
      }
    }

    // 2. Secondary Cloud Storage Backup: Clerk privateMetadata (compact backup if within size limits)
    try {
      if (payloadStr.length < 24000) {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(userId, {
          privateMetadata: {
            music_library: payload,
          },
        });
      }
    } catch (metaErr) {
      console.warn("[music/library] Clerk metadata backup warning:", metaErr);
    }

    return NextResponse.json({
      success: true,
      userId,
      savedToSupabase,
      updatedAt: now,
    });
  } catch (err: any) {
    console.error("[music/library] POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal menyimpan pustaka musik." },
      { status: 500 }
    );
  }
}

