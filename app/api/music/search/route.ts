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
    const requestedLimit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 5), 50);

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

    // Spotify developer tier strictly caps single request limit to maximum 10.
    // To satisfy requestedLimit (e.g. 20 or 30), fetch pages of 10 concurrently.
    const PAGE_SIZE = 10;
    const pagesToFetch = Math.min(Math.ceil(requestedLimit / PAGE_SIZE), 4); // Max 40 items

    const pagePromises = Array.from({ length: pagesToFetch }, async (_, pageIdx) => {
      const offset = pageIdx * PAGE_SIZE;
      const spotifyUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        effectiveQuery
      )}&type=${encodeURIComponent(type)}&limit=${PAGE_SIZE}&offset=${offset}&market=ID`;

      try {
        const res = await fetch(spotifyUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          next: { revalidate: 3600 },
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.warn(`[music/search] Spotify page ${pageIdx} returned ${res.status}:`, errBody);
          return null;
        }

        return await res.json();
      } catch (err) {
        console.error(`[music/search] Page ${pageIdx} fetch failed:`, err);
        return null;
      }
    });

    const pageResults = await Promise.all(pagePromises);

    const rawTracks: any[] = [];
    const rawArtists: any[] = [];
    const rawAlbums: any[] = [];
    const rawPlaylists: any[] = [];

    for (const json of pageResults) {
      if (!json) continue;
      if (json.tracks?.items) rawTracks.push(...json.tracks.items);
      if (json.artists?.items) rawArtists.push(...json.artists.items);
      if (json.albums?.items) rawAlbums.push(...json.albums.items);
      if (json.playlists?.items) rawPlaylists.push(...json.playlists.items.filter(Boolean));
    }

    // Deduplicate tracks by id
    const seenTracks = new Set<string>();
    const tracks = rawTracks
      .filter((t) => {
        if (!t?.id || seenTracks.has(t.id)) return false;
        seenTracks.add(t.id);
        return true;
      })
      .slice(0, requestedLimit)
      .map(mapSpotifyTrack);

    // Deduplicate artists by id
    const seenArtists = new Set<string>();
    const artists = rawArtists
      .filter((a) => {
        if (!a?.id || seenArtists.has(a.id)) return false;
        seenArtists.add(a.id);
        return true;
      })
      .slice(0, 15)
      .map(mapSpotifyArtist);

    // Deduplicate albums by id
    const seenAlbums = new Set<string>();
    const albums = rawAlbums
      .filter((al) => {
        if (!al?.id || seenAlbums.has(al.id)) return false;
        seenAlbums.add(al.id);
        return true;
      })
      .slice(0, 15)
      .map(mapSpotifyAlbum);

    // Deduplicate playlists by id
    const seenPlaylists = new Set<string>();
    const playlists = rawPlaylists
      .filter((p) => {
        if (!p?.id || seenPlaylists.has(p.id)) return false;
        seenPlaylists.add(p.id);
        return true;
      })
      .slice(0, 15)
      .map(mapSpotifyPlaylist);

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
