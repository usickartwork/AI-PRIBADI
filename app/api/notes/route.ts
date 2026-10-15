export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireUserId, getNotesAdmin, errorResponse, NoteError, UserNote } from "@/lib/notesServer";
import crypto from "crypto";

// GET /api/notes - Ambil semua catatan milik pengguna yang sedang login
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const db = getNotesAdmin();

    if (!db) {
      return NextResponse.json({
        success: true,
        notes: [],
        isOfflineFallback: true,
        message: "Database cloud belum terkonfigurasi. Menggunakan penyimpanan lokal.",
      });
    }

    const { data, error } = await db
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[notes] GET error:", error);
      throw new NoteError("Gagal memuat catatan dari database.", 500);
    }

    return NextResponse.json({
      success: true,
      notes: (data as UserNote[]) || [],
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/notes - Buat catatan baru untuk pengguna yang sedang login
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "Catatan Baru";
    const content = typeof body.content === "string" ? body.content : "";
    const isPinned = Boolean(body.isPinned);

    const now = new Date().toISOString();
    const noteId = typeof body.id === "string" && body.id.trim() ? body.id.trim() : crypto.randomUUID();

    const newNote: UserNote = {
      id: noteId,
      user_id: userId,
      title: title || "Catatan Baru",
      content,
      is_pinned: isPinned,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    const db = getNotesAdmin();
    if (!db) {
      return NextResponse.json({
        success: true,
        note: newNote,
        isOfflineFallback: true,
      });
    }

    const { data, error } = await db
      .from("user_notes")
      .insert([newNote])
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        const { data: existing } = await db
          .from("user_notes")
          .select("*")
          .eq("id", noteId)
          .single();
        if (existing) {
          return NextResponse.json({
            success: true,
            note: existing as UserNote,
          });
        }
      }
      console.error("[notes] POST error:", error);
      throw new NoteError("Gagal menyimpan catatan baru.", 500);
    }

    return NextResponse.json({
      success: true,
      note: data as UserNote,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

