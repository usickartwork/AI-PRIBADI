export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  requireUserId,
  createOrUpdateSharedLink,
  getExistingSharedLink,
  listUserSharedLinks,
  revokeSharedLink,
  ShareError,
} from "@/lib/shareServer";

// POST: Buat tautan bersama baru atau dapatkan yang sudah ada
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const { contentId, contentType = "chat", title, messages } = body;

    if (!contentId || typeof contentId !== "string") {
      return NextResponse.json({ error: "contentId diperlukan." }, { status: 400 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Percakapan tidak boleh kosong." }, { status: 400 });
    }

    const link = await createOrUpdateSharedLink({
      ownerId: userId,
      contentId: contentId.trim(),
      contentType: contentType.trim(),
      title: typeof title === "string" ? title : "Percakapan Usick One",
      messages,
    });

    return NextResponse.json({ success: true, link });
  } catch (err: any) {
    if (err instanceof ShareError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[api/share] POST error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// GET: Ambil daftar seluruh tautan bersama milik user (untuk Shared Links Management)
// atau ambil status link tertentu jika disertai query parameter contentId
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("contentId");

    if (contentId) {
      // Ambil link aktif untuk project ini jika ada
      const existing = await getExistingSharedLink(userId, contentId);
      return NextResponse.json({ success: true, link: existing });
    }

    // Ambil semua daftar link
    const links = await listUserSharedLinks(userId);
    return NextResponse.json({ success: true, links });
  } catch (err: any) {
    if (err instanceof ShareError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[api/share] GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE: Cabut tautan bersama
export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id || body.token;
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID atau token tautan diperlukan." }, { status: 400 });
    }

    await revokeSharedLink(userId, id.trim());
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof ShareError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[api/share] DELETE error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

