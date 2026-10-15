export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { generateGoogleAuthUrl, getGoogleConfig } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId || userId === "guest") {
      return NextResponse.json(
        { error: "Silakan login ke akun Anda terlebih dahulu sebelum menghubungkan Google Calendar." },
        { status: 401 }
      );
    }

    const { isConfigured } = getGoogleConfig();
    if (!isConfigured) {
      return NextResponse.json(
        {
          error:
            "Google Calendar API belum dikonfigurasi di server. Tambahkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env.local / Vercel.",
          configured: false,
        },
        { status: 503 }
      );
    }

    const authUrl = generateGoogleAuthUrl(userId, origin);
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("[google/calendar/auth] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memulai otorisasi Google Calendar." },
      { status: 500 }
    );
  }
}

