export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireUserId, getNotesAdmin, errorResponse, NoteError, UserNote } from "@/lib/notesServer";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/notes/[id] - Ambil satu catatan spesifik
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const db = getNotesAdmin();

    if (!db) {
      return NextResponse.json({
        success: true,
        note: null,
        isOfflineFallback: true,
      });
    }

    const { data, error } = await db
      .from("user_notes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      throw new NoteError("Catatan tidak ditemukan atau Anda tidak memiliki akses.", 404);
    }

    return NextResponse.json({
      success: true,
      note: data as UserNote,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// PATCH /api/notes/[id] - Perbarui judul, konten, atau status pin catatan
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const db = getNotesAdmin();

    const updates: Partial<UserNote> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string") {
      updates.title = body.title.trim();
    }
    if (typeof body.content === "string") {
      updates.content = body.content;
    }
    if (typeof body.is_pinned === "boolean") {
      updates.is_pinned = body.is_pinned;
    }

    if (!db) {
      return NextResponse.json({
        success: true,
        updated: updates,
        isOfflineFallback: true,
      });
    }

    const { data, error } = await db
      .from("user_notes")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error || !data) {
      // Fallback upsert untuk mencegah kegagalan akibat race condition saat pembuatan catatan baru
      const { data: upsertData, error: upsertError } = await db
        .from("user_notes")
        .upsert({
          id,
          user_id: userId,
          title: typeof body.title === "string" ? body.title.trim() : "Catatan Baru",
          content: typeof body.content === "string" ? body.content : "",
          is_pinned: typeof body.is_pinned === "boolean" ? body.is_pinned : false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (upsertError || !upsertData) {
        console.error("[notes] PATCH/upsert error:", upsertError || error);
        throw new NoteError("Gagal memperbarui catatan.", 500);
      }

      return NextResponse.json({
        success: true,
        note: upsertData as UserNote,
      });
    }

    return NextResponse.json({
      success: true,
      note: data as UserNote,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/notes/[id] - Hapus catatan (soft delete dengan deleted_at)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const db = getNotesAdmin();

    if (!db) {
      return NextResponse.json({
        success: true,
        id,
        isOfflineFallback: true,
      });
    }

    // Gunakan soft delete agar aman dan konsisten dengan skema
    const { error } = await db
      .from("user_notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[notes] DELETE error:", error);
      throw new NoteError("Gagal menghapus catatan.", 500);
    }

    return NextResponse.json({
      success: true,
      id,
      message: "Catatan berhasil dihapus.",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

