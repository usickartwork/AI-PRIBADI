export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotifyServer";
import {
  mapSpotifyTrack,
  mapSpotifyArtist,
  mapSpotifyAlbum,
  mapSpotifyPlaylist,
} from "@/lib/music";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const type = searchParams.get("type") || "track,artist,album,playlist";
    const category = searchParams.get("category")?.trim() || "";
    const requestedLimit = Math.min(Math.max(Number(searchParams.get("limit")) || 30, 5), 50);

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

    // Default search query if empty, or map based on category
    let effectiveQuery = query;
    if (!effectiveQuery) {
      if (category === "indonesia") {
        effectiveQuery = "Bernadya OR Hindia OR Nadin Amizah OR Sal Priadi OR Juicy Luicy OR Mahalini OR Tulus";
      } else if (category === "global") {
        effectiveQuery = "Bruno Mars OR Billie Eilish OR Lady Gaga OR Sabrina Carpenter OR Taylor Swift OR Coldplay";
      } else if (category === "viral") {
        effectiveQuery = "Die With A Smile OR APT. OR Birds of a feather OR Espresso OR Satu Bulan";
      } else if (category === "chill") {
        effectiveQuery = "Hindia OR Nadin Amizah OR Billie Eilish OR Coldplay acoustic";
      } else if (category === "workout") {
        effectiveQuery = "workout energy motivation pop dance Dua Lipa The Weeknd";
      } else if (category === "rock") {
        effectiveQuery = "Queen OR Coldplay OR Arctic Monkeys rock alternative";
      } else {
        const TRENDING_POOLS = [
          "Bernadya OR Hindia OR Bruno Mars OR Billie Eilish OR Lady Gaga",
          "Sabrina Carpenter OR Taylor Swift OR Coldplay OR The Weeknd OR Dua Lipa",
          "Nadin Amizah OR Sal Priadi OR Juicy Luicy OR Mahalini OR Tiara Andini",
          "Die With A Smile OR APT. OR Birds of a feather OR Satu Bulan OR Espresso",
        ];
        effectiveQuery = TRENDING_POOLS[Math.floor(Math.random() * TRENDING_POOLS.length)];
      }
    }

    // Spotify developer tier strictly caps single request limit to maximum 10.
    // To satisfy requestedLimit (e.g. 30, 40, or 50), fetch pages of 10 concurrently.
    const PAGE_SIZE = 10;
    const pagesToFetch = Math.min(Math.ceil(requestedLimit / PAGE_SIZE), 5); // Max 50 items

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

    // Deduplicate tracks by id and prioritize top popularity so trending hits come first
    const seenTracks = new Set<string>();
    const tracks = rawTracks
      .filter((t) => {
        if (!t?.id || seenTracks.has(t.id)) return false;
        seenTracks.add(t.id);
        return true;
      })
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
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
