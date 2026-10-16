export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  disconnectGoogleCalendar,
  getGoogleConfig,
  getValidGoogleAccessToken,
} from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();
    const { isConfigured } = getGoogleConfig();

    if (!userId || userId === "guest") {
      return NextResponse.json({
        success: true,
        connected: false,
        isConfigured,
      });
    }

    const account = await getValidGoogleAccessToken(userId);

    return NextResponse.json({
      success: true,
      connected: Boolean(account),
      email: account?.googleEmail || "",
      accountEmail: account?.googleEmail || "",
      source: account?.source || (Boolean(account) ? "supabase" : undefined),
      isConfigured: isConfigured || Boolean(account),
    });
  } catch (err: any) {
    console.error("[google/calendar/status] Error:", err);
    return NextResponse.json({
      success: false,
      connected: false,
      isConfigured: false,
      error: err?.message || "Gagal memeriksa status Google Calendar.",
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId || userId === "guest") {
      return NextResponse.json(
        { error: "User ID wajib disertakan untuk memutuskan koneksi." },
        { status: 400 }
      );
    }

    const success = await disconnectGoogleCalendar(userId);

    return NextResponse.json({
      success,
      message: success
        ? "Koneksi Google Calendar berhasil diputuskan."
        : "Gagal memutuskan koneksi Google Calendar.",
    });
  } catch (err: any) {
    console.error("[google/calendar/status] DELETE error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memutuskan koneksi Google Calendar." },
      { status: 500 }
    );
  }
}

