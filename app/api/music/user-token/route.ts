import { NextResponse } from "next/server";

// Cache the refreshed access token until near expiration
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({
      configured: false,
      token: null,
      message: "SPOTIFY_REFRESH_TOKEN belum dikonfigurasi.",
    });
  }

  const now = Date.now();
  // Return cached token if valid for at least 1 more minute
  if (cachedToken && now < tokenExpiresAt - 60000) {
    return NextResponse.json({
      configured: true,
      token: cachedToken,
    });
  }

  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${creds}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });

    const data = await res.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
      return NextResponse.json({
        configured: true,
        token: cachedToken,
      });
    }

    return NextResponse.json(
      {
        configured: false,
        error: data.error_description || "Gagal merefresh token Spotify.",
      },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        configured: false,
        error: err?.message || "Server error saat merefresh Spotify token.",
      },
      { status: 500 }
    );
  }
}

