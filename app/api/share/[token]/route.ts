export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getPublicSharedLink } from "@/lib/shareServer";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });
    }

    const link = await getPublicSharedLink(token);

    if (!link) {
      return NextResponse.json(
        { error: "Tautan tidak ditemukan, sudah kedaluwarsa, atau telah dicabut oleh pemiliknya." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      link: {
        title: link.title_snapshot,
        messages: link.messages_snapshot,
        createdAt: link.created_at,
        contentType: link.content_type,
      },
    });
  } catch (err: any) {
    console.error("[api/share/[token]] GET error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

