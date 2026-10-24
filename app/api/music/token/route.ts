export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ─── Spotify Client Credentials Token Endpoint ────────────────────────────────
// Restricted to authenticated sessions to prevent unauthenticated token scraping.

let cachedToken: { access_token: string; expires_at: number } | null = null;

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: "Spotify API belum dikonfigurasi. Tambahkan SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET di .env.local",
          configured: false,
        },
        { status: 503 }
      );
    }

    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
      return NextResponse.json({
        success: true,
        access_token: cachedToken.access_token,
        configured: true,
      });
    }

    // Request new token from Spotify
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[spotify/token] Token request failed:", response.status, errorText);
      return NextResponse.json(
        {
          error: "Gagal mendapatkan token dari Spotify. Periksa Client ID dan Client Secret.",
          configured: true,
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Cache the token
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return NextResponse.json({
      success: true,
      access_token: data.access_token,
      configured: true,
    });
  } catch (err: any) {
    console.error("[spotify/token] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengambil token Spotify." },
      { status: 500 }
    );
  }
}

