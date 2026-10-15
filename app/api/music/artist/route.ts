export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotifyServer";
import { mapSpotifyTrack, mapSpotifyAlbum } from "@/lib/music";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let artistId = searchParams.get("id")?.trim() || "";
    const artistName = searchParams.get("name")?.trim() || "";

    if (artistId.startsWith("spotify:artist:")) {
      artistId = artistId.replace("spotify:artist:", "");
    }

    const token = await getSpotifyToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Spotify API belum dikonfigurasi." },
        { status: 400 }
      );
    }

    // If ID is not provided, look up artist ID by name
    if (!artistId && artistName) {
      try {
        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1&market=ID`,
          {
            headers: { Authorization: `Bearer ${token}` },
            next: { revalidate: 3600 },
          }
        );
        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          const found = searchJson.artists?.items?.[0];
          if (found?.id) {
            artistId = found.id;
          }
        }
      } catch (e) {
        console.warn("[music/artist] Search fallback error:", e);
      }
    }

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: "ID atau nama artis diperlukan." },
        { status: 400 }
      );
    }

    // 1. Fetch Artist Profile
    const artistRes = await fetch(`https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });

    if (!artistRes.ok) {
      return NextResponse.json(
        { success: false, error: "Profil artis tidak ditemukan." },
        { status: 404 }
      );
    }

    const artistJson = await artistRes.json();
    const resolvedName = artistJson.name || artistName;

    // 2. Fetch Top Tracks (using search by artist name to bypass the 403 restriction on /top-tracks)
    // Fetch 2 pages of 10 to provide up to 20 top tracks
    const trackPagePromises = [0, 10].map(async (offset) => {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=artist:%22${encodeURIComponent(resolvedName)}%22&type=track&limit=10&offset=${offset}&market=ID`,
          {
            headers: { Authorization: `Bearer ${token}` },
            next: { revalidate: 3600 },
          }
        );
        if (!res.ok) return [];
        const json = await res.json();
        return json.tracks?.items || [];
      } catch {
        return [];
      }
    });

    // 3. Fetch Artist Albums & Singles (Spotify returns 400 for limit > 10, so fetch 3 pages of 10)
    const albumPagePromises = [0, 10, 20].map(async (offset) => {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}/albums?include_groups=album,single&limit=10&offset=${offset}&market=ID`,
          {
            headers: { Authorization: `Bearer ${token}` },
            next: { revalidate: 3600 },
          }
        );
        if (!res.ok) {
          console.warn(`[music/artist] Albums offset ${offset} status:`, res.status);
          return [];
        }
        const json = await res.json();
        return json.items || [];
      } catch (err) {
        console.warn(`[music/artist] Albums offset ${offset} error:`, err);
        return [];
      }
    });

    const [trackPages, albumPages] = await Promise.all([
      Promise.all(trackPagePromises),
      Promise.all(albumPagePromises),
    ]);

    const rawTracks = trackPages.flat();
    const rawAlbums = albumPages.flat();

    // Deduplicate tracks by id
    const seenTracks = new Set<string>();
    const topTracks = rawTracks
      .filter((t) => {
        if (!t?.id || seenTracks.has(t.id)) return false;
        seenTracks.add(t.id);
        return true;
      })
      .map(mapSpotifyTrack);

    // Deduplicate albums by name to avoid duplicate deluxe/standard editions cluttering view
    const seenAlbumNames = new Set<string>();
    const albums = rawAlbums
      .filter((al: any) => {
        if (!al?.id) return false;
        const norm = (al.name || "").toLowerCase().trim();
        if (seenAlbumNames.has(norm)) return false;
        seenAlbumNames.add(norm);
        return true;
      })
      .map(mapSpotifyAlbum);

    const artistData = {
      id: `spotify:artist:${artistJson.id}`,
      spotifyId: artistJson.id,
      name: resolvedName,
      imageUrl: artistJson.images?.[0]?.url || artistJson.images?.[1]?.url || null,
      genres: artistJson.genres || [],
      externalUrl: artistJson.external_urls?.spotify || `https://open.spotify.com/artist/${artistJson.id}`,
      topTracks,
      albums,
    };

    return NextResponse.json({
      success: true,
      data: artistData,
    });
  } catch (err: any) {
    console.error("[music/artist] Exception:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat profil artis." },
      { status: 500 }
    );
  }
}

