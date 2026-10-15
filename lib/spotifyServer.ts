// ─── Shared Spotify Server Token Utility ─────────────────────────────────────
let cachedToken: { access_token: string; expires_at: number } | null = null;

export async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      console.error("[spotifyServer] Failed to get Spotify token:", res.status);
      return null;
    }

    const json = await res.json();
    cachedToken = {
      access_token: json.access_token,
      expires_at: Date.now() + (json.expires_in || 3600) * 1000,
    };
    return cachedToken.access_token;
  } catch (err) {
    console.error("[spotifyServer] Error getting token:", err);
    return null;
  }
}
