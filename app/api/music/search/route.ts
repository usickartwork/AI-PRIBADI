export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  mapSpotifyTrack,
  mapSpotifyArtist,
  mapSpotifyAlbum,
  mapSpotifyPlaylist,
} from "@/lib/music";

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
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
      console.error("[music/search] Failed to get Spotify token:", res.status);
      return null;
    }

    const json = await res.json();
    cachedToken = {
      access_token: json.access_token,
      expires_at: Date.now() + (json.expires_in || 3600) * 1000,
    };
    return cachedToken.access_token;
  } catch (err) {
    console.error("[music/search] Error getting token:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const type = searchParams.get("type") || "track,artist,album,playlist";
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    const token = await getSpotifyToken();

    if (!token) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: "Spotify API belum dikonfigurasi. Tambahkan SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET di file .env.local",
        data: {
          tracks: [],
          artists: [],
          albums: [],
          playlists: [],
        },
      });
    }

    // Default search query if empty (popular Indonesian & global hits for discovery)
    const effectiveQuery = query || "year:2024-2026";

    const spotifyUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      effectiveQuery
    )}&type=${encodeURIComponent(type)}&limit=${limit}&market=ID`;

    const spotifyRes = await fetch(spotifyUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!spotifyRes.ok) {
      if (spotifyRes.status === 429) {
        return NextResponse.json(
          {
            success: false,
            configured: true,
            error: "Spotify API rate limit terlampaui. Coba beberapa saat lagi.",
            data: { tracks: [], artists: [], albums: [], playlists: [] },
          },
          { status: 429 }
        );
      }

      const errText = await spotifyRes.text();
      console.warn("[music/search] Spotify API error:", spotifyRes.status, errText);
      return NextResponse.json(
        {
          success: false,
          configured: true,
          error: `Spotify API merespons dengan status ${spotifyRes.status}.`,
          data: { tracks: [], artists: [], albums: [], playlists: [] },
        },
        { status: 502 }
      );
    }

    const json = await spotifyRes.json();

    const tracks = (json.tracks?.items || []).map(mapSpotifyTrack);
    const artists = (json.artists?.items || []).map(mapSpotifyArtist);
    const albums = (json.albums?.items || []).map(mapSpotifyAlbum);
    const playlists = (json.playlists?.items || []).filter(Boolean).map(mapSpotifyPlaylist);

    return NextResponse.json({
      success: true,
      configured: true,
      query: effectiveQuery,
      data: {
        tracks,
        artists,
        albums,
        playlists,
      },
    });
  } catch (err: any) {
    console.error("[music/search] Exception:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Gagal melakukan pencarian musik Spotify.",
        data: { tracks: [], artists: [], albums: [], playlists: [] },
      },
      { status: 500 }
    );
  }
}

