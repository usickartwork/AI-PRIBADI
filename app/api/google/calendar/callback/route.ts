export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleAuthCode, getGoogleConfig, saveGoogleCalendarTokens } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateEncoded = searchParams.get("state");

  // Jika user membatalkan persetujuan
  if (error || !code) {
    const errorMsg = error === "access_denied" ? "Otorisasi dibatalkan oleh pengguna." : error || "Kode otorisasi tidak ditemukan.";
    return NextResponse.redirect(`${origin}/?view=schedule&google_calendar=error&message=${encodeURIComponent(errorMsg)}`);
  }

  // Validasi CSRF State
  let userId = "";
  try {
    if (!stateEncoded) throw new Error("State parameter tidak ditemukan.");
    const stateJson = Buffer.from(stateEncoded, "base64url").toString("utf8");
    const stateObj = JSON.parse(stateJson);
    userId = stateObj.userId;

    // Cek umur token state (maksimal 15 menit)
    if (!stateObj.timestamp || Date.now() - stateObj.timestamp > 15 * 60 * 1000) {
      throw new Error("Sesi otorisasi telah kedaluwarsa. Silakan coba kembali.");
    }

    if (!userId) {
      throw new Error("Identitas pengguna tidak valid.");
    }
  } catch (stateErr: any) {
    console.error("[google/calendar/callback] State validation failed:", stateErr);
    return NextResponse.redirect(
      `${origin}/?view=schedule&google_calendar=error&message=${encodeURIComponent(
        stateErr.message || "Validasi keamanan gagal."
      )}`
    );
  }

  try {
    const { redirectUri } = getGoogleConfig();
    const effectiveRedirectUri = origin ? `${origin}/api/google/calendar/callback` : redirectUri;

    const tokenResult = await exchangeGoogleAuthCode(code, effectiveRedirectUri);

    await saveGoogleCalendarTokens(userId, {
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      expiryDate: tokenResult.expiryDate,
      googleEmail: tokenResult.googleEmail,
    });

    console.log(`[google/calendar/callback] Akun Google Calendar berhasil dihubungkan untuk user: ${userId} (${tokenResult.googleEmail})`);

    return NextResponse.redirect(
      `${origin}/?view=schedule&google_calendar=connected&email=${encodeURIComponent(tokenResult.googleEmail)}`
    );
  } catch (err: any) {
    console.error("[google/calendar/callback] Error:", err);
    return NextResponse.redirect(
      `${origin}/?view=schedule&google_calendar=error&message=${encodeURIComponent(
        err.message || "Gagal menghubungkan ke Google Calendar."
      )}`
    );
  }
}

