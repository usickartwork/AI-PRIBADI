export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotifyServer";
import { mapSpotifyTrack } from "@/lib/music";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let albumId = searchParams.get("id")?.trim() || "";

    if (albumId.startsWith("spotify:album:")) {
      albumId = albumId.replace("spotify:album:", "");
    }

    if (!albumId) {
      return NextResponse.json(
        { success: false, error: "ID album diperlukan." },
        { status: 400 }
      );
    }

    const token = await getSpotifyToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Spotify API belum dikonfigurasi." },
        { status: 400 }
      );
    }

    const res = await fetch(`https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}?market=ID`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Album tidak ditemukan di Spotify." },
        { status: 404 }
      );
    }

    const albumJson = await res.json();
    const artworkUrl = albumJson.images?.[0]?.url || albumJson.images?.[1]?.url;
    const albumTitle = albumJson.name || "Unknown Album";

    // Spotify album tracks response has items without complete album object, so inject it for consistency
    const rawItems = albumJson.tracks?.items || [];
    const tracks = rawItems.map((trackItem: any) =>
      mapSpotifyTrack({
        ...trackItem,
        album: {
          name: albumTitle,
          images: albumJson.images,
        },
      })
    );

    const albumData = {
      id: `spotify:album:${albumJson.id}`,
      spotifyId: albumJson.id,
      title: albumTitle,
      artistNames: albumJson.artists?.map((a: any) => a.name) || ["Unknown Artist"],
      artistId: albumJson.artists?.[0]?.id || null,
      artworkUrl,
      releaseDate: albumJson.release_date || "",
      totalTracks: albumJson.total_tracks || tracks.length,
      externalUrl: albumJson.external_urls?.spotify || `https://open.spotify.com/album/${albumJson.id}`,
      tracks,
    };

    return NextResponse.json({
      success: true,
      data: albumData,
    });
  } catch (err: any) {
    console.error("[music/album] Exception:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat detail album." },
      { status: 500 }
    );
  }
}
