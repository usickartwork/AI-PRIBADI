import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Cache the refreshed access token until near expiration
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const primaryPair = {
    id: process.env.SPOTIFY_CLIENT_ID?.trim(),
    secret: process.env.SPOTIFY_CLIENT_SECRET?.trim(),
    refresh: process.env.SPOTIFY_REFRESH_TOKEN?.trim(),
  };

  const backupPair = {
    id: (process.env.SPOTIFY_CLIENT_ID_BACKUP || process.env.SPOTIFY_CLIENT_ID_2)?.trim(),
    secret: (process.env.SPOTIFY_CLIENT_SECRET_BACKUP || process.env.SPOTIFY_CLIENT_SECRET_2)?.trim(),
    refresh: (process.env.SPOTIFY_REFRESH_TOKEN_BACKUP || process.env.SPOTIFY_REFRESH_TOKEN)?.trim(),
  };

  const pairs = [primaryPair, backupPair].filter(
    (p): p is { id: string; secret: string; refresh: string } => !!p.id && !!p.secret && !!p.refresh
  );

  if (pairs.length === 0) {
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

  let lastError = "Gagal merefresh token Spotify.";

  for (const pair of pairs) {
    try {
      const creds = Buffer.from(`${pair.id}:${pair.secret}`).toString("base64");
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${creds}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: pair.refresh,
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

      lastError = data.error_description || data.error || lastError;
    } catch (err: any) {
      lastError = err?.message || lastError;
    }
  }

  return NextResponse.json(
    {
      configured: false,
      error: lastError,
    },
    { status: 400 }
  );
}
