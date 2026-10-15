export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getSpotifyTokenWithMetadata,
  markSpotifyKeyRateLimited,
} from "@/lib/spotifyServer";
import {
  mapSpotifyTrack,
  mapSpotifyArtist,
  mapSpotifyAlbum,
  mapSpotifyPlaylist,
  MusicItem,
} from "@/lib/music";

// ─── Server-Side Search Cache ────────────────────────────────────────────────
// Mencegah pemborosan kuota API Spotify untuk pencarian berulang dan lagu trending.
interface CacheEntry {
  data: {
    tracks: any[];
    artists: any[];
    albums: any[];
    playlists: any[];
  };
  expiresAt: number;
}

const searchCache = new Map<string, CacheEntry>();

function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (entry.expiresAt <= now) {
      searchCache.delete(key);
    }
  }
}

// ─── Fallback Engine: iTunes Search API ──────────────────────────────────────
// Mengamankan aplikasi agar tidak pernah kosong jika Spotify mengalami 429 Quota Exceeded.
function mapITunesTrack(item: any): MusicItem {
  const artwork = item.artworkUrl100
    ? item.artworkUrl100.replace("100x100bb", "600x600bb")
    : item.artworkUrl60;
  const trackId = String(item.trackId || item.collectionId || Math.random().toString(36).slice(2));
  return {
    id: `spotify:track:itunes_${trackId}`,
    provider: "spotify",
    providerItemId: `itunes_${trackId}`,
    itemType: "track",
    title: item.trackName || item.collectionName || "Unknown Track",
    artistNames: [item.artistName || "Unknown Artist"],
    albumTitle: item.collectionName,
    artworkUrl: artwork,
    durationMs: item.trackTimeMillis || 210000,
    externalUrl: item.trackViewUrl || item.collectionViewUrl || "https://music.apple.com",
    previewUrl: item.previewUrl || null,
    uri: `spotify:track:itunes_${trackId}`,
  };
}

async function fetchITunesFallback(query: string, limit: number = 30): Promise<MusicItem[]> {
  try {
    const terms = query
      .split(/\bOR\b/i)
      .map((t) => t.trim())
      .filter(Boolean);

    const queriesToRun = terms.length > 1 ? terms.slice(0, 3) : [query];
    const perTermLimit = Math.max(8, Math.ceil(limit / queriesToRun.length));

    const results = await Promise.all(
      queriesToRun.map(async (t) => {
        try {
          const clean = t.replace(/[^\w\s-]/g, " ").trim();
          const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(clean)}&entity=song&limit=${perTermLimit}`,
            { next: { revalidate: 3600 } }
          );
          if (!res.ok) return [];
          const json = await res.json();
          return json.results || [];
        } catch {
          return [];
        }
      })
    );

    const seen = new Set<string>();
    const mapped: MusicItem[] = [];

    for (const item of results.flat()) {
      if (!item || !item.trackName) continue;
      const key = `${item.trackName.toLowerCase()}_${(item.artistName || "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      mapped.push(mapITunesTrack(item));
      if (mapped.length >= limit) break;
    }

    return mapped;
  } catch (err) {
    console.error("[music/search] iTunes fallback error:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    cleanExpiredCache();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const type = searchParams.get("type") || "track,artist,album,playlist";
    const category = searchParams.get("category")?.trim() || "";
    const requestedLimit = Math.min(Math.max(Number(searchParams.get("limit")) || 30, 5), 50);

    // Tentukan query yang efektif
    let effectiveQuery = query;
    let isDefaultPool = false;

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
        effectiveQuery = "Bernadya OR Bruno Mars OR Billie Eilish OR Lady Gaga OR Sabrina Carpenter OR Coldplay";
        isDefaultPool = true;
      }
    }

    const cacheKey = `${effectiveQuery.toLowerCase()}_${type}_${requestedLimit}_${category}`;

    // Cek in-memory cache
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult && Date.now() < cachedResult.expiresAt && cachedResult.data.tracks.length > 0) {
      return NextResponse.json({
        success: true,
        configured: true,
        cached: true,
        query: effectiveQuery,
        data: cachedResult.data,
      });
    }

    // Ambil token Spotify (otomatis memilih key yang tidak terkena rate-limit)
    let meta = await getSpotifyTokenWithMetadata();

    const rawTracks: any[] = [];
    const rawArtists: any[] = [];
    const rawAlbums: any[] = [];
    const rawPlaylists: any[] = [];

    if (meta) {
      // Fungsi pembantu untuk melakukan request pencarian dengan token tertentu
      const executeSearch = async (token: string, clientId: string) => {
        const PAGE_SIZE = 10;
        const pagesToFetch = Math.min(Math.ceil(requestedLimit / PAGE_SIZE), 3); // 30 item

        const pagePromises = Array.from({ length: pagesToFetch }, async (_, pageIdx) => {
          const offset = pageIdx * PAGE_SIZE;
          const spotifyUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            effectiveQuery
          )}&type=${encodeURIComponent(type)}&limit=${PAGE_SIZE}&offset=${offset}&market=ID`;

          try {
            const res = await fetch(spotifyUrl, {
              headers: { Authorization: `Bearer ${token}` },
              next: { revalidate: 3600 },
            });

            if (!res.ok) {
              const errBody = await res.text();
              const retryAfter = Number(res.headers.get("retry-after")) || 3600;

              if (res.status === 429) {
                console.warn(`[music/search] Spotify 429 (QUOTA_EXCEEDED) pada key ${clientId.slice(0, 6)}...:`, errBody);
                markSpotifyKeyRateLimited(clientId, retryAfter);
                return { status: 429, retryAfter };
              }

              console.warn(`[music/search] Spotify page ${pageIdx} returned ${res.status}:`, errBody);
              return null;
            }

            return await res.json();
          } catch (err) {
            console.error(`[music/search] Page ${pageIdx} fetch failed:`, err);
            return null;
          }
        });

        return await Promise.all(pagePromises);
      };

      // Eksekusi pencarian ke Spotify
      let pageResults = await executeSearch(meta.token, meta.clientId);

      // Jika terjadi 429 (Rate Limit), coba otomatis switch ke Key Cadangan
      const has429 = pageResults.some((r: any) => r && r.status === 429);
      if (has429) {
        console.log(`[music/search] Mencoba auto-fallback ke API Key berikutnya...`);
        const backupMeta = await getSpotifyTokenWithMetadata(meta.clientId);

        if (backupMeta && backupMeta.clientId !== meta.clientId) {
          console.log(`[music/search] Berhasil switch ke ${backupMeta.keyName} (${backupMeta.clientId.slice(0, 6)}...)`);
          meta = backupMeta;
          pageResults = await executeSearch(backupMeta.token, backupMeta.clientId);
        }
      }

      for (const json of pageResults) {
        if (!json || json.status === 429) continue;
        if (json.tracks?.items) rawTracks.push(...json.tracks.items);
        if (json.artists?.items) rawArtists.push(...json.artists.items);
        if (json.albums?.items) rawAlbums.push(...json.albums.items);
        if (json.playlists?.items) rawPlaylists.push(...json.playlists.items.filter(Boolean));
      }
    }

    // Deduplicate tracks
    const seenTracks = new Set<string>();
    const tracks: MusicItem[] = rawTracks
      .filter((t) => {
        if (!t?.id || seenTracks.has(t.id)) return false;
        seenTracks.add(t.id);
        return true;
      })
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, requestedLimit)
      .map(mapSpotifyTrack);

    // Deduplicate artists
    const seenArtists = new Set<string>();
    const artists: MusicItem[] = rawArtists
      .filter((a) => {
        if (!a?.id || seenArtists.has(a.id)) return false;
        seenArtists.add(a.id);
        return true;
      })
      .slice(0, 15)
      .map(mapSpotifyArtist);

    // Deduplicate albums
    const seenAlbums = new Set<string>();
    const albums: MusicItem[] = rawAlbums
      .filter((al) => {
        if (!al?.id || seenAlbums.has(al.id)) return false;
        seenAlbums.add(al.id);
        return true;
      })
      .slice(0, 15)
      .map(mapSpotifyAlbum);

    // Deduplicate playlists
    const seenPlaylists = new Set<string>();
    const playlists: MusicItem[] = rawPlaylists
      .filter((p) => {
        if (!p?.id || seenPlaylists.has(p.id)) return false;
        seenPlaylists.add(p.id);
        return true;
      })
      .slice(0, 15)
      .map(mapSpotifyPlaylist);

    // ─── FALLBACK AKTIF OTOMATIS JIKA SPOTIFY LIMIT / KOSONG ──────────────
    // Jika Spotify search sedang terkena limit (429 QUOTA_EXCEEDED), kita ambil lagu via catalog fallback
    if (tracks.length === 0) {
      console.warn(`[music/search] Spotify rate-limited/kosong. Mengambil katalog fallback...`);
      const fallbackList = await fetchITunesFallback(effectiveQuery, requestedLimit);
      if (fallbackList.length > 0) {
        tracks.push(...fallbackList);

        // Ekstrak artis & album unik untuk melengkapi UI
        const seenArt = new Set<string>();
        for (const t of fallbackList) {
          const art = t.artistNames[0];
          if (art && !seenArt.has(art.toLowerCase())) {
            seenArt.add(art.toLowerCase());
            artists.push({
              id: `spotify:artist:${encodeURIComponent(art)}`,
              provider: "spotify",
              providerItemId: encodeURIComponent(art),
              itemType: "artist",
              title: art,
              artistNames: [art],
              artworkUrl: t.artworkUrl,
              externalUrl: `https://open.spotify.com/search/${encodeURIComponent(art)}`,
            });
          }
          if (artists.length >= 10) break;
        }
      }
    }

    const resultData = { tracks, artists, albums, playlists };

    // Simpan ke cache jika menghasilkan lagu
    if (tracks.length > 0) {
      const ttlMs = isDefaultPool || category ? 60 * 60 * 1000 : 30 * 60 * 1000;
      searchCache.set(cacheKey, {
        data: resultData,
        expiresAt: Date.now() + ttlMs,
      });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      cached: false,
      query: effectiveQuery,
      activeKey: meta?.keyName || "Catalog Fallback",
      data: resultData,
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
