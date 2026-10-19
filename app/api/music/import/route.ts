export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSpotifyTokenWithMetadata, markSpotifyKeyRateLimited } from "@/lib/spotifyServer";
import { mapSpotifyTrack, MusicItem } from "@/lib/music";

/**
 * Validasi dan ekstrak Spotify Playlist ID secara aman (mencegah SSRF & URL manipulasi).
 * Hanya menerima URL open.spotify.com/playlist/... atau spotify:playlist:...
 */
function extractSpotifyPlaylistId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // Format 1: spotify:playlist:ID
  if (trimmed.startsWith("spotify:playlist:")) {
    const rawId = trimmed.replace("spotify:playlist:", "").split("?")[0].trim();
    return /^[0-9A-Za-z]{22}$/.test(rawId) ? rawId : null;
  }

  // Format 2: https://open.spotify.com/playlist/ID?si=...
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // Pastikan hostname resmi open.spotify.com
    if (hostname !== "open.spotify.com" && hostname !== "www.open.spotify.com") {
      return null;
    }

    // Pathname harus persis /playlist/{id}
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2 || segments[0] !== "playlist") {
      return null;
    }

    const playlistId = segments[1].trim();
    // Validasi format base62 Spotify ID (22 karakter alfanumerik)
    if (!/^[0-9A-Za-z]{22}$/.test(playlistId)) {
      return null;
    }

    return playlistId;
  } catch {
    return null;
  }
}

/**
 * Mengambil metadata dan daftar lagu dari Spotify Embed resmi.
 * Digunakan sebagai fallback resmi saat Spotify Web API mengembalikan 403 Forbidden
 * pada token Client Credentials akibat pembatasan endpoint Spotify akhir 2024.
 */
async function fetchPlaylistFromSpotifyEmbed(playlistId: string): Promise<{
  id: string;
  name: string;
  description: string;
  ownerName: string;
  coverUrl: string | null;
  totalTracks: number;
  tracks: MusicItem[];
} | null> {
  try {
    const embedUrl = `https://open.spotify.com/embed/playlist/${encodeURIComponent(playlistId)}`;
    const res = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match || !match[1]) return null;

    const json = JSON.parse(match[1]);
    const entity = json.props?.pageProps?.state?.data?.entity;
    if (!entity) return null;

    const coverUrl =
      entity.coverArt?.sources?.[0]?.url ||
      entity.coverArt?.sources?.[1]?.url ||
      null;

    const rawList = Array.isArray(entity.trackList) ? entity.trackList.slice(0, 100) : [];

    // Ambil cover album spesifik untuk masing-masing lagu secara paralel (chunked)
    const trackArtworks = new Map<string, string>();
    const trackIds = rawList
      .map((t: any) => (t.uri ? t.uri.replace("spotify:track:", "").trim() : t.id))
      .filter(Boolean);

    const chunkSize = 8;
    for (let i = 0; i < trackIds.length; i += chunkSize) {
      const chunk = trackIds.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (id: string) => {
          try {
            const trackOembed = await fetch(
              `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${encodeURIComponent(id)}`,
              {
                signal: AbortSignal.timeout(2500),
                cache: "no-store",
              }
            );
            if (trackOembed.ok) {
              const oembedData = await trackOembed.json();
              if (oembedData.thumbnail_url) {
                trackArtworks.set(id, oembedData.thumbnail_url);
              }
            }
          } catch {}
        })
      );
    }

    const validTracks: MusicItem[] = rawList
      .map((t: any) => {
        const trackId = t.uri ? t.uri.replace("spotify:track:", "").trim() : (t.id || "");
        const artistNames = t.subtitle
          ? t.subtitle.split(",").map((s: string) => s.trim()).filter(Boolean)
          : ["Spotify Artist"];
        const individualArtwork = trackArtworks.get(trackId) || coverUrl || undefined;

        return {
          id: t.uri || `spotify:track:${trackId}`,
          provider: "spotify" as const,
          providerItemId: trackId,
          itemType: "track" as const,
          title: t.title || "Unknown Track",
          artistNames: artistNames.length > 0 ? artistNames : ["Spotify Artist"],
          albumTitle: t.albumTitle || undefined,
          artworkUrl: individualArtwork,
          durationMs: typeof t.duration === "number" ? t.duration : undefined,
          externalUrl: `https://open.spotify.com/track/${trackId}`,
          previewUrl: t.audioPreview?.url || null,
          uri: t.uri || `spotify:track:${trackId}`,
        };
      });

    return {
      id: entity.id || playlistId,
      name: entity.name || "Playlist Spotify",
      description: entity.subtitle || "",
      ownerName: entity.authors?.[0]?.name || "Spotify",
      coverUrl,
      totalTracks: rawList.length,
      tracks: validTracks,
    };
  } catch (err) {
    console.warn("[music/import] Spotify Embed fallback error:", err);
    return null;
  }
}

/**
 * Mencoba mendapatkan token akses Spotify:
 * 1. Coba User Refresh Token terlebih dahulu (jika sudah diotorisasi).
 * 2. Fallback ke Client Credentials token.
 */
async function getEffectiveSpotifyToken(): Promise<{
  token: string | null;
  clientId?: string;
  source: "user" | "client_credentials" | "none";
}> {
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

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          return {
            token: data.access_token,
            clientId: pair.id,
            source: "user",
          };
        }
      }
    } catch (err) {
      console.warn("[music/import] Error resolving user token:", err);
    }
  }

  // Fallback ke client credentials token
  const meta = await getSpotifyTokenWithMetadata();
  if (meta?.token) {
    return {
      token: meta.token,
      clientId: meta.clientId,
      source: "client_credentials",
    };
  }

  return { token: null, source: "none" };
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          error: "Format request tidak valid.",
        },
        { status: 400 }
      );
    }

    const rawInput = body.playlistUrl || body.url || body.playlistId || "";
    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_INPUT",
          error: "Tautan playlist Spotify tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    const playlistId = extractSpotifyPlaylistId(rawInput);
    if (!playlistId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_URL",
          error: "Tautan tidak valid. Pastikan kamu menyalin tautan playlist dari Spotify.",
        },
        { status: 400 }
      );
    }

    // 1. Ambil token akses Spotify resmi jika tersedia
    const tokenInfo = await getEffectiveSpotifyToken();

    // 2. Coba ambil metadata playlist dari endpoint resmi Web API jika token tersedia
    if (tokenInfo.token) {
      const endpoint = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}?market=ID`;
      const playlistRes = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${tokenInfo.token}`,
        },
        cache: "no-store",
      });

      if (playlistRes.status === 429) {
        const retryAfter = Number(playlistRes.headers.get("retry-after")) || 60;
        if (tokenInfo.clientId) {
          markSpotifyKeyRateLimited(tokenInfo.clientId, retryAfter);
        }
        return NextResponse.json(
          {
            success: false,
            code: "RATE_LIMITED",
            error: "Spotify sedang membatasi permintaan. Silakan tunggu sebentar sebelum mencoba lagi.",
            retryAfter,
          },
          { status: 429 }
        );
      }

      if (playlistRes.status === 404) {
        return NextResponse.json(
          {
            success: false,
            code: "NOT_FOUND",
            error: "Playlist tidak ditemukan. Pastikan tautan playlist dari Spotify sudah benar.",
          },
          { status: 404 }
        );
      }

      if (playlistRes.ok) {
        const playlistJson = await playlistRes.json();

        // Cek apakah item trek sudah ada di payload
        let rawItems: any[] = [];
        if (Array.isArray(playlistJson.tracks?.items) && playlistJson.tracks.items.length > 0) {
          rawItems = playlistJson.tracks.items.slice(0, 100);
        } else {
          // Coba ambil dari /tracks
          const tracksEndpoint = `https://api.spotify.com/v1/playlists/${encodeURIComponent(
            playlistId
          )}/tracks?limit=100&market=ID`;

          const tracksRes = await fetch(tracksEndpoint, {
            headers: {
              Authorization: `Bearer ${tokenInfo.token}`,
            },
            cache: "no-store",
          });

          if (tracksRes.ok) {
            const tracksJson = await tracksRes.json();
            if (Array.isArray(tracksJson.items)) {
              rawItems = tracksJson.items.slice(0, 100);
            }
          }
        }

        // Jika berhasil mendapatkan tracks via Web API
        if (rawItems.length > 0) {
          const validTracks: MusicItem[] = rawItems
            .filter((item: any) => item?.track && item.track.id && !item.track.is_local)
            .slice(0, 100)
            .map((item: any) => mapSpotifyTrack(item.track));

          const totalDetected =
            typeof playlistJson.tracks?.total === "number" ? playlistJson.tracks.total : validTracks.length;
          const coverUrl = playlistJson.images?.[0]?.url || playlistJson.images?.[1]?.url || null;

          return NextResponse.json({
            success: true,
            data: {
              id: playlistJson.id,
              name: playlistJson.name || "Playlist Spotify",
              description: playlistJson.description || "",
              ownerName: playlistJson.owner?.display_name || "Spotify",
              coverUrl,
              totalTracks: totalDetected,
              importCount: validTracks.length,
              tracks: validTracks,
            },
          });
        }
      }
    }

    // 3. Fallback: Gunakan Spotify Embed resmi jika Web API membatasi trek (403 Forbidden pada Client Credentials)
    const embedData = await fetchPlaylistFromSpotifyEmbed(playlistId);
    if (embedData && embedData.tracks.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          id: embedData.id,
          name: embedData.name,
          description: embedData.description,
          ownerName: embedData.ownerName,
          coverUrl: embedData.coverUrl,
          totalTracks: embedData.totalTracks,
          importCount: embedData.tracks.length,
          tracks: embedData.tracks,
        },
      });
    }

    // 4. Jika keduanya tidak berhasil mengambil trek
    return NextResponse.json(
      {
        success: false,
        code: "FORBIDDEN",
        error: "Playlist tidak dapat diakses oleh Music One. Periksa izin akses playlist atau coba playlist lain.",
      },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("[music/import] Error processing playlist import:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error: "Terjadi kesalahan pada server saat memproses import playlist.",
      },
      { status: 500 }
    );
  }
}
