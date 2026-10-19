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
 * Mencoba mendapatkan token akses Spotify:
 * 1. Coba User Refresh Token terlebih dahulu (jika sudah diotorisasi, memiliki hak baca playlist penuh).
 * 2. Fallback ke Client Credentials token.
 */
async function getEffectiveSpotifyToken(): Promise<{
  token: string | null;
  clientId?: string;
  source: "user" | "client_credentials" | "none";
}> {
  // Coba refresh token jika dikonfigurasi di server
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

    // Ambil token akses Spotify resmi
    const tokenInfo = await getEffectiveSpotifyToken();
    if (!tokenInfo.token) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_SPOTIFY_CREDENTIALS",
          error: "Kredensial Spotify API belum dikonfigurasi di server.",
        },
        { status: 503 }
      );
    }

    // Ambil metadata playlist dari endpoint resmi Spotify
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

    if (playlistRes.status === 401 || playlistRes.status === 403) {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          error: "Playlist tidak dapat diakses oleh Music One. Periksa izin akses playlist atau coba playlist lain.",
        },
        { status: 403 }
      );
    }

    if (!playlistRes.ok) {
      return NextResponse.json(
        {
          success: false,
          code: "SPOTIFY_ERROR",
          error: "API Spotify sedang mengalami gangguan. Silakan coba beberapa saat lagi.",
        },
        { status: 502 }
      );
    }

    const playlistJson = await playlistRes.json();

    // Ambil daftar item trek (maksimal 100 sesuai aturan produk)
    let rawItems: any[] = [];
    if (Array.isArray(playlistJson.tracks?.items) && playlistJson.tracks.items.length > 0) {
      rawItems = playlistJson.tracks.items.slice(0, 100);
    } else {
      // Jika playlist tracks tidak disertakan inline, lakukan query ke endpoint resmi tracks
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
      } else if (tracksRes.status === 403 || tracksRes.status === 401) {
        return NextResponse.json(
          {
            success: false,
            code: "FORBIDDEN",
            error: "Playlist tidak dapat diakses oleh Music One. Periksa izin akses playlist atau coba playlist lain.",
          },
          { status: 403 }
        );
      }
    }

    // Filter dan map lagu yang valid sesuai format MusicItem
    const validTracks: MusicItem[] = rawItems
      .filter((item: any) => item?.track && item.track.id && !item.track.is_local)
      .slice(0, 100)
      .map((item: any) => mapSpotifyTrack(item.track));

    const totalDetected = typeof playlistJson.tracks?.total === "number" ? playlistJson.tracks.total : validTracks.length;
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
        importCount: validTracks.length, // Tegaskan batas maksimal 100 di sisi server
        tracks: validTracks,
      },
    });
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
