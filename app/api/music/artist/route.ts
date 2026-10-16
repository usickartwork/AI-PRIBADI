export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSpotifyTokenWithMetadata, markSpotifyKeyRateLimited } from "@/lib/spotifyServer";
import { mapSpotifyTrack, mapSpotifyAlbum, ArtistProfileData, MusicItem } from "@/lib/music";

/**
 * Fallback Engine untuk profil musisi:
 * Menggabungkan Deezer (foto artis resolusi tinggi hingga 1000x1000px)
 * dan iTunes Search API (lagu populer dan diskografi album lengkap)
 * tanpa memerlukan API key dan bebas dari rate limit Spotify 429.
 */
async function fetchArtistFallback(name: string): Promise<ArtistProfileData> {
  const cleanName = name.replace(/[^\w\s-]/g, " ").trim();

  // 1. Ambil foto profil artis resolusi tinggi dari Deezer API
  let imageUrl: string | null = null;
  let genres: string[] = [];

  try {
    const deezerRes = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanName)}&limit=1`,
      { next: { revalidate: 86400 } }
    );
    if (deezerRes.ok) {
      const dzJson = await deezerRes.json();
      const dzArtist = dzJson.data?.[0];
      if (dzArtist) {
        imageUrl = dzArtist.picture_xl || dzArtist.picture_big || dzArtist.picture_medium || dzArtist.picture;
      }
    }
  } catch (err) {
    console.warn("[music/artist] Deezer picture fetch error:", err);
  }

  // 2. Ambil top tracks artis dari iTunes Search API
  let topTracks: MusicItem[] = [];
  try {
    const tracksRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&entity=song&limit=25`,
      { next: { revalidate: 3600 } }
    );
    if (tracksRes.ok) {
      const tracksJson = await tracksRes.json();
      const seenTrackIds = new Set<string>();
      topTracks = (tracksJson.results || [])
        .filter((t: any) => t.wrapperType === "track")
        .filter((t: any) => {
          const trackId = String(t.trackId);
          if (seenTrackIds.has(trackId)) return false;
          seenTrackIds.add(trackId);
          return true;
        })
        .map((t: any) => ({
          id: `spotify:track:itunes_${t.trackId}`,
          provider: "spotify" as const,
          providerItemId: `itunes_${t.trackId}`,
          itemType: "track" as const,
          title: t.trackName || "Unknown Track",
          artistNames: [t.artistName || name],
          albumTitle: t.collectionName || "",
          artworkUrl: t.artworkUrl100 ? t.artworkUrl100.replace("100x100bb", "600x600bb") : undefined,
          durationMs: t.trackTimeMillis || 210000,
          externalUrl: t.trackViewUrl || "https://music.apple.com",
          previewUrl: t.previewUrl || null,
          uri: `spotify:track:itunes_${t.trackId}`,
        }));

      if (tracksJson.results?.[0]?.primaryGenreName) {
        genres.push(tracksJson.results[0].primaryGenreName);
      }
    }
  } catch (err) {
    console.warn("[music/artist] iTunes tracks fetch error:", err);
  }

  // 3. Ambil diskografi album & single artis dari iTunes Search API
  let albums: MusicItem[] = [];
  try {
    const albumsRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&entity=album&limit=25`,
      { next: { revalidate: 3600 } }
    );
    if (albumsRes.ok) {
      const albumsJson = await albumsRes.json();
      const seenAlbumNames = new Set<string>();
      albums = (albumsJson.results || [])
        .filter((a: any) => a.wrapperType === "collection")
        .filter((a: any) => {
          const norm = (a.collectionName || "").toLowerCase().trim();
          if (seenAlbumNames.has(norm)) return false;
          seenAlbumNames.add(norm);
          return true;
        })
        .map((a: any) => ({
          id: `spotify:album:itunes_${a.collectionId}`,
          provider: "spotify" as const,
          providerItemId: `itunes_${a.collectionId}`,
          itemType: "album" as const,
          title: a.collectionName || "Unknown Album",
          artistNames: [a.artistName || name],
          albumTitle: a.collectionName,
          artworkUrl: a.artworkUrl100 ? a.artworkUrl100.replace("100x100bb", "600x600bb") : undefined,
          durationMs: (a.trackCount || 10) * 210000,
          externalUrl: a.collectionViewUrl || "https://music.apple.com",
          uri: `spotify:album:itunes_${a.collectionId}`,
        }));
    }
  } catch (err) {
    console.warn("[music/artist] iTunes albums fetch error:", err);
  }

  // Jika Deezer belum dapat gambar tapi ada artwork dari track/album, gunakan sebagai gambar artis
  if (!imageUrl && topTracks.length > 0 && topTracks[0].artworkUrl) {
    imageUrl = topTracks[0].artworkUrl;
  }

  return {
    id: `spotify:artist:${encodeURIComponent(name)}`,
    spotifyId: encodeURIComponent(name),
    name,
    imageUrl,
    genres,
    externalUrl: `https://open.spotify.com/search/${encodeURIComponent(name)}`,
    topTracks,
    albums,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let artistId = searchParams.get("id")?.trim() || "";
    let artistName = searchParams.get("name")?.trim() || "";

    if (artistId.startsWith("spotify:artist:")) {
      artistId = artistId.replace("spotify:artist:", "");
    }
    try {
      artistId = decodeURIComponent(artistId);
      artistName = decodeURIComponent(artistName);
    } catch {}

    // Jika artistId bukan format ID Spotify 22-karakter (misal nama artis dari search fallback iTunes),
    // gunakan sebagai artistName
    const isSpotifyId = /^[0-9A-Za-z]{22}$/.test(artistId);
    if (!isSpotifyId && artistId && !artistName) {
      artistName = artistId;
      artistId = "";
    }

    const targetSearchName = artistName || artistId;
    if (!artistId && !targetSearchName) {
      return NextResponse.json(
        { success: false, error: "ID atau nama artis diperlukan." },
        { status: 400 }
      );
    }

    // Coba Spotify terlebih dahulu jika konfigurasi tersedia
    let meta = await getSpotifyTokenWithMetadata();
    if (meta) {
      try {
        let activeToken = meta.token;
        let activeClientId = meta.clientId;

        // Jika ID belum ada, cari ID artis di Spotify
        if (!artistId && targetSearchName) {
          const searchRes = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(targetSearchName)}&type=artist&limit=1&market=ID`,
            {
              headers: { Authorization: `Bearer ${activeToken}` },
              next: { revalidate: 3600 },
            }
          );

          if (searchRes.status === 429) {
            const retryAfter = Number(searchRes.headers.get("retry-after")) || 3600;
            markSpotifyKeyRateLimited(activeClientId, retryAfter);
            // Coba switch ke key berikutnya
            const backupMeta = await getSpotifyTokenWithMetadata(activeClientId);
            if (backupMeta && backupMeta.clientId !== activeClientId) {
              meta = backupMeta;
              activeToken = backupMeta.token;
              activeClientId = backupMeta.clientId;
            }
          } else if (searchRes.ok) {
            const searchJson = await searchRes.json();
            const found = searchJson.artists?.items?.[0];
            if (found?.id) {
              artistId = found.id;
            }
          }
        }

        // Jika artis berhasil ditemukan di Spotify
        if (artistId && /^[0-9A-Za-z]{22}$/.test(artistId)) {
          const artistRes = await fetch(
            `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}`,
            {
              headers: { Authorization: `Bearer ${activeToken}` },
              next: { revalidate: 3600 },
            }
          );

          if (artistRes.status === 429) {
            const retryAfter = Number(artistRes.headers.get("retry-after")) || 3600;
            markSpotifyKeyRateLimited(activeClientId, retryAfter);
          } else if (artistRes.ok) {
            const artistJson = await artistRes.json();
            const resolvedName = artistJson.name || targetSearchName;

            // Ambil top tracks Spotify
            const trackPagePromises = [0, 10].map(async (offset) => {
              try {
                const res = await fetch(
                  `https://api.spotify.com/v1/search?q=artist:%22${encodeURIComponent(resolvedName)}%22&type=track&limit=10&offset=${offset}&market=ID`,
                  {
                    headers: { Authorization: `Bearer ${activeToken}` },
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

            // Ambil album & single Spotify
            const albumPagePromises = [0, 10, 20].map(async (offset) => {
              try {
                const res = await fetch(
                  `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}/albums?include_groups=album,single&limit=10&offset=${offset}&market=ID`,
                  {
                    headers: { Authorization: `Bearer ${activeToken}` },
                    next: { revalidate: 3600 },
                  }
                );
                if (!res.ok) return [];
                const json = await res.json();
                return json.items || [];
              } catch {
                return [];
              }
            });

            const [trackPages, albumPages] = await Promise.all([
              Promise.all(trackPagePromises),
              Promise.all(albumPagePromises),
            ]);

            const seenTracks = new Set<string>();
            const topTracks = trackPages.flat()
              .filter((t) => {
                if (!t?.id || seenTracks.has(t.id)) return false;
                seenTracks.add(t.id);
                return true;
              })
              .map(mapSpotifyTrack);

            const seenAlbumNames = new Set<string>();
            const albums = albumPages.flat()
              .filter((al: any) => {
                if (!al?.id) return false;
                const norm = (al.name || "").toLowerCase().trim();
                if (seenAlbumNames.has(norm)) return false;
                seenAlbumNames.add(norm);
                return true;
              })
              .map(mapSpotifyAlbum);

            return NextResponse.json({
              success: true,
              data: {
                id: `spotify:artist:${artistJson.id}`,
                spotifyId: artistJson.id,
                name: resolvedName,
                imageUrl: artistJson.images?.[0]?.url || artistJson.images?.[1]?.url || null,
                genres: artistJson.genres || [],
                externalUrl: artistJson.external_urls?.spotify || `https://open.spotify.com/artist/${artistJson.id}`,
                topTracks,
                albums,
              },
            });
          }
        }
      } catch (spotifyErr) {
        console.warn("[music/artist] Spotify error, beralih ke fallback:", spotifyErr);
      }
    }

    // ─── Otomatis Jalankan Fallback Engine (Deezer + iTunes) ───────────────────
    // Berfungsi saat Spotify terkena 429 rate limit atau nama artis dari iTunes search
    console.log(`[music/artist] Menggunakan Fallback Engine untuk artis: "${targetSearchName}"`);
    const fallbackData = await fetchArtistFallback(targetSearchName);

    return NextResponse.json({
      success: true,
      data: fallbackData,
      source: "fallback",
    });
  } catch (err: any) {
    console.error("[music/artist] Fatal exception:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat profil artis." },
      { status: 500 }
    );
  }
}
