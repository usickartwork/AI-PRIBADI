export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSpotifyTokenWithMetadata, markSpotifyKeyRateLimited } from "@/lib/spotifyServer";
import { mapSpotifyTrack, AlbumDetailData, MusicItem } from "@/lib/music";
import { BoundedLRUCache, mapITunesCatalogTrack } from "@/lib/musicTasteServer";

const albumDetailCache = new BoundedLRUCache<
  string,
  { data: AlbumDetailData; source?: string }
>(250, 60 * 60 * 1000);

/**
 * Fallback Engine untuk Album: Mengambil data lagu dan metadata album dari iTunes
 */
async function fetchAlbumFallback(albumId: string): Promise<AlbumDetailData | null> {
  const cleanId = albumId.replace("itunes_", "").replace("spotify:album:", "").trim();
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(cleanId)}&entity=song`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const collection = json.results?.find((r: any) => r.wrapperType === "collection");
    if (!collection) return null;

    const rawTracks = json.results?.filter((r: any) => r.wrapperType === "track") || [];
    const artworkUrl = collection.artworkUrl100
      ? collection.artworkUrl100.replace("100x100bb", "600x600bb")
      : undefined;

    const tracks: MusicItem[] = rawTracks.map((t: any) => {
      const mapped = mapITunesCatalogTrack(
        {
          ...t,
          collectionName: t.collectionName || collection.collectionName,
          releaseDate: t.releaseDate || collection.releaseDate,
          primaryGenreName: t.primaryGenreName || collection.primaryGenreName,
        },
        collection.artistName || "Unknown Artist"
      );
      return {
        ...mapped,
        artworkUrl: mapped.artworkUrl || artworkUrl,
      };
    });

    return {
      id: `spotify:album:itunes_${collection.collectionId}`,
      spotifyId: `itunes_${collection.collectionId}`,
      title: collection.collectionName || "Unknown Album",
      artistNames: [collection.artistName || "Unknown Artist"],
      artistId: collection.artistId ? String(collection.artistId) : null,
      artworkUrl,
      releaseDate: collection.releaseDate ? collection.releaseDate.split("T")[0] : "",
      totalTracks: collection.trackCount || tracks.length,
      externalUrl: collection.collectionViewUrl || "https://music.apple.com",
      tracks,
    };
  } catch (err) {
    console.warn("[music/album] iTunes fallback error:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let albumId = searchParams.get("id")?.trim() || "";

    if (albumId.startsWith("spotify:album:")) {
      albumId = albumId.replace("spotify:album:", "");
    }
    try {
      albumId = decodeURIComponent(albumId);
    } catch {}

    if (!albumId) {
      return NextResponse.json(
        { success: false, error: "ID album diperlukan." },
        { status: 400 }
      );
    }

    const cacheKey = albumId.toLowerCase();
    const cachedAlbum = albumDetailCache.get(cacheKey);
    if (cachedAlbum) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: cachedAlbum.data,
        ...(cachedAlbum.source ? { source: cachedAlbum.source } : {}),
      });
    }

    // Jika ID berasal dari iTunes fallback, langsung gunakan iTunes Lookup
    if (albumId.startsWith("itunes_") || /^\d+$/.test(albumId)) {
      const fallbackAlbum = await fetchAlbumFallback(albumId);
      if (fallbackAlbum) {
        albumDetailCache.set(cacheKey, { data: fallbackAlbum, source: "fallback" });
        return NextResponse.json({
          success: true,
          data: fallbackAlbum,
          source: "fallback",
        });
      }
    }

    // Coba Spotify
    let meta = await getSpotifyTokenWithMetadata();
    if (meta && /^[0-9A-Za-z]{22}$/.test(albumId)) {
      try {
        const res = await fetch(`https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}?market=ID`, {
          headers: { Authorization: `Bearer ${meta.token}` },
          next: { revalidate: 3600 },
        });

        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after")) || 3600;
          markSpotifyKeyRateLimited(meta.clientId, retryAfter);
        } else if (res.ok) {
          const albumJson = await res.json();
          const artworkUrl = albumJson.images?.[0]?.url || albumJson.images?.[1]?.url;
          const albumTitle = albumJson.name || "Unknown Album";

          const rawItems = albumJson.tracks?.items || [];
          const tracks = rawItems.map((trackItem: any) =>
            mapSpotifyTrack({
              ...trackItem,
              album: {
                id: albumJson.id,
                name: albumTitle,
                images: albumJson.images,
                release_date: albumJson.release_date,
              },
            })
          );

          const albumData: AlbumDetailData = {
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

          albumDetailCache.set(cacheKey, { data: albumData });

          return NextResponse.json({
            success: true,
            data: albumData,
          });
        }
      } catch (spotifyErr) {
        console.warn("[music/album] Spotify error, mencoba fallback:", spotifyErr);
      }
    }

    // Fallback: jika album gagal dari Spotify, coba cari di iTunes
    const fallbackAlbum = await fetchAlbumFallback(albumId);
    if (fallbackAlbum) {
      albumDetailCache.set(cacheKey, { data: fallbackAlbum, source: "fallback" });
      return NextResponse.json({
        success: true,
        data: fallbackAlbum,
        source: "fallback",
      });
    }

    return NextResponse.json(
      { success: false, error: "Album tidak ditemukan." },
      { status: 404 }
    );
  } catch (err: any) {
    console.error("[music/album] Exception:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat detail album." },
      { status: 500 }
    );
  }
}
