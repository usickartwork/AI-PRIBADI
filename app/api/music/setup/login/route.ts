import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { origin, searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key") || searchParams.get("app");

  let clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  let state = "primary";

  // Jika diminta key=backup atau SPOTIFY_CLIENT_ID belum ada tapi BACKUP ada
  if (
    keyParam === "backup" ||
    (!clientId && (process.env.SPOTIFY_CLIENT_ID_BACKUP || process.env.SPOTIFY_CLIENT_ID_2))
  ) {
    clientId = (process.env.SPOTIFY_CLIENT_ID_BACKUP || process.env.SPOTIFY_CLIENT_ID_2)?.trim();
    state = "backup";
  }

  if (!clientId) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID atau SPOTIFY_CLIENT_ID_BACKUP belum dikonfigurasi di server." },
      { status: 400 }
    );
  }

  const redirectUri = `${origin}/api/music/setup/callback`;
  const scopes = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "playlist-read-private",
    "playlist-read-collaborative",
  ].join("%20");

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scopes}&state=${state}&show_dialog=true`;

  return NextResponse.redirect(authUrl);
}
