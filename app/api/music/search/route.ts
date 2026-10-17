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

// ─── Curated Rotating Trending Pools (Anti-Saturation & Continuous Randomization) ───
// Menjamin variasi artis yang seimbang, tidak ada dominasi satu artis (anti-saturasi),
// dan terus berganti secara dinamis/acak setiap kali dibuka atau di-refresh.

const INDONESIA_TRENDING_PRESETS = [
  "Sal Priadi OR Hindia OR Juicy Luicy OR Mahalini OR Tulus OR Nadin Amizah OR Tiara Andini OR Rizky Febian",
  "Nadin Amizah OR Tulus OR Tiara Andini OR Rizky Febian OR Lyodra OR Pamungkas OR Yura Yunita OR Sheila on 7",
  "Maliq & D'Essentials OR Sheila on 7 OR Pamungkas OR Yura Yunita OR Sal Priadi OR Feast OR Reality Club OR Mahalini",
  "Feast OR Reality Club OR For Revenge OR Feby Putri OR Hindia OR Juicy Luicy OR Tulus OR Nadin Amizah",
  "Bernadya OR Sal Priadi OR Juicy Luicy OR Guyon Waton OR Mahalini OR Tiara Andini OR Lyodra OR Rizky Febian",
  "Lyodra OR Mahalini OR Hindia OR Denny Caknan OR Sheila on 7 OR Yura Yunita OR Pamungkas OR Sal Priadi",
];

const GLOBAL_TRENDING_PRESETS = [
  "Bruno Mars OR Billie Eilish OR Sabrina Carpenter OR Lady Gaga OR The Weeknd OR Taylor Swift OR Coldplay OR Dua Lipa",
  "The Weeknd OR Taylor Swift OR Coldplay OR Olivia Rodrigo OR Benson Boone OR SZA OR Post Malone OR Ariana Grande",
  "ROSÉ OR Dua Lipa OR Benson Boone OR SZA OR Bruno Mars OR Billie Eilish OR Chappell Roan OR Teddy Swims",
  "Post Malone OR Chappell Roan OR Gracie Abrams OR Teddy Swims OR Sabrina Carpenter OR Lady Gaga OR Harry Styles OR Ed Sheeran",
  "Kendrick Lamar OR Ariana Grande OR Harry Styles OR Ed Sheeran OR The Weeknd OR Billie Eilish OR Dua Lipa OR Coldplay",
];

const VIRAL_HITS_PRESETS = [
  "Die With A Smile OR APT. OR Birds of a feather OR Espresso OR Gala Bunga Matahari OR Taste OR Beautiful Things OR Sialan",
  "Gala Bunga Matahari OR Taste OR Beautiful Things OR Kita Bikin Romantis OR Dari Planet Lain OR Good Luck Babe OR Lose Control OR Espresso",
  "Sialan OR Dari Planet Lain OR Good Luck Babe OR Lose Control OR Die With A Smile OR Birds of a feather OR Nina OR Bermuara",
  "Untungnya Hidup Harus Tetap Berjalan OR Bermuara OR That's So True OR Nina OR Gala Bunga Matahari OR APT. OR Espresso OR Taste",
];

// 12 Presets seimbang untuk Home Discovery (10 artis berbeda per preset: kombinasi Indonesia + Global)
const DEFAULT_TRENDING_PRESETS = [
  "Sal Priadi OR Bruno Mars OR Billie Eilish OR Juicy Luicy OR Sabrina Carpenter OR Hindia OR The Weeknd OR Mahalini OR Coldplay OR Tulus",
  "Sabrina Carpenter OR Hindia OR The Weeknd OR Mahalini OR Lady Gaga OR Nadin Amizah OR Bruno Mars OR Sheila on 7 OR Dua Lipa OR Pamungkas",
  "Lady Gaga OR Nadin Amizah OR Coldplay OR Tulus OR Billie Eilish OR Maliq & D'Essentials OR Benson Boone OR Yura Yunita OR Taylor Swift OR Rizky Febian",
  "Billie Eilish OR Maliq & D'Essentials OR Bruno Mars OR Sheila on 7 OR Dua Lipa OR Juicy Luicy OR Olivia Rodrigo OR Lyodra OR The Weeknd OR Sal Priadi",
  "Benson Boone OR Yura Yunita OR Taylor Swift OR Rizky Febian OR Sabrina Carpenter OR Pamungkas OR Coldplay OR Mahalini OR Post Malone OR Hindia",
  "ROSÉ OR Juicy Luicy OR Dua Lipa OR Pamungkas OR Bruno Mars OR Nadin Amizah OR Billie Eilish OR Tulus OR Ariana Grande OR Tiara Andini",
  "Chappell Roan OR Bernadya OR The Weeknd OR Feast OR Sabrina Carpenter OR Sal Priadi OR Lady Gaga OR Sheila on 7 OR Coldplay OR Yura Yunita",
  "Gracie Abrams OR Sal Priadi OR Billie Eilish OR Tiara Andini OR Bruno Mars OR Juicy Luicy OR Taylor Swift OR Hindia OR Dua Lipa OR Rizky Febian",
  "Post Malone OR Nadin Amizah OR Bruno Mars OR Reality Club OR Billie Eilish OR Tulus OR Sabrina Carpenter OR Mahalini OR The Weeknd OR Lyodra",
  "Teddy Swims OR Hindia OR Sabrina Carpenter OR Lyodra OR Coldplay OR Juicy Luicy OR Lady Gaga OR Sal Priadi OR Dua Lipa OR Yura Yunita",
  "Olivia Rodrigo OR Tulus OR Lady Gaga OR For Revenge OR Bruno Mars OR Nadin Amizah OR Billie Eilish OR Sheila on 7 OR The Weeknd OR Tiara Andini",
  "Coldplay OR Feby Putri OR Dua Lipa OR Guyon Waton OR Bruno Mars OR Sal Priadi OR Sabrina Carpenter OR Mahalini OR Taylor Swift OR Juicy Luicy",
];

const DISCOVERY_SUPPLEMENT_ARTISTS = [
  "Sal Priadi",
  "Bruno Mars",
  "Billie Eilish",
  "Sabrina Carpenter",
  "Hindia",
  "Juicy Luicy",
  "The Weeknd",
  "Mahalini",
  "Lady Gaga",
  "Nadin Amizah",
  "Coldplay",
  "Tulus",
  "Dua Lipa",
  "Sheila on 7",
  "Taylor Swift",
  "Rizky Febian",
  "Yura Yunita",
  "Pamungkas",
  "Olivia Rodrigo",
  "Tiara Andini",
  "Lyodra",
  "Benson Boone",
  "Ariana Grande",
  "Ed Sheeran",
];

async function fetchITunesFallback(
  query: string,
  limit: number = 30,
  isDiscovery: boolean = false
): Promise<MusicItem[]> {
  try {
    const rawTerms = query
      .split(/\bOR\b/i)
      .map((t) => t.trim())
      .filter(Boolean);

    const termSet = new Set<string>(rawTerms);
    if (isDiscovery || rawTerms.length > 1) {
      const shuffledSupplement = [...DISCOVERY_SUPPLEMENT_ARTISTS].sort(() => 0.5 - Math.random());
      for (const extra of shuffledSupplement) {
        if (termSet.size >= 12) break;
        termSet.add(extra);
      }
    }

    // Acak urutan terms agar adil bagi semua artis/lagu dalam query
    const shuffledTerms = [...termSet].sort(() => 0.5 - Math.random());
    const maxTerms = isDiscovery || shuffledTerms.length > 1 ? 12 : 1;
    const queriesToRun = shuffledTerms.length > 1 ? shuffledTerms.slice(0, maxTerms) : [query];
    const perTermLimit = Math.max(5, Math.ceil(limit / Math.max(queriesToRun.length, 1)) + 2);

    const results = await Promise.all(
      queriesToRun.map(async (t) => {
        try {
          const clean = t.replace(/[()"']/g, " ").replace(/\s+/g, " ").trim();
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
    const artistCount = new Map<string, number>();
    const mapped: MusicItem[] = [];
    const maxPerArtist = isDiscovery || queriesToRun.length > 1 ? 2 : 5;

    // Acak hasil iTunes sebelum deduplikasi dan batasi max 2 lagu per artis untuk discovery
    const allResults = results.flat().sort(() => 0.5 - Math.random());

    for (const item of allResults) {
      if (!item || !item.trackName) continue;
      const key = `${item.trackName.toLowerCase()}_${(item.artistName || "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const artist = (item.artistName || "Unknown").toLowerCase().trim();
      const count = artistCount.get(artist) || 0;
      if (count >= maxPerArtist) continue;
      artistCount.set(artist, count + 1);

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

    // Tentukan query yang efektif secara dinamis & acak jika tanpa query manual
    let effectiveQuery = query;
    let isDefaultPool = false;

    if (!effectiveQuery) {
      const seedParam = searchParams.get("seed");
      const seedNum = seedParam !== null ? Math.abs(parseInt(seedParam, 10)) || 0 : Math.floor(Math.random() * 10000);

      if (category === "indonesia") {
        effectiveQuery = INDONESIA_TRENDING_PRESETS[seedNum % INDONESIA_TRENDING_PRESETS.length];
      } else if (category === "global") {
        effectiveQuery = GLOBAL_TRENDING_PRESETS[seedNum % GLOBAL_TRENDING_PRESETS.length];
      } else if (category === "viral") {
        effectiveQuery = VIRAL_HITS_PRESETS[seedNum % VIRAL_HITS_PRESETS.length];
      } else if (category === "chill") {
        effectiveQuery = "Hindia OR Nadin Amizah OR Billie Eilish OR Coldplay OR Tulus OR Sal Priadi OR Taylor Swift OR Lauv";
      } else if (category === "workout") {
        effectiveQuery = "Dua Lipa OR The Weeknd OR Calvin Harris OR David Guetta OR Bruno Mars OR Lady Gaga OR Sabrina Carpenter OR Rihanna";
      } else if (category === "rock") {
        effectiveQuery = "Queen OR Coldplay OR Arctic Monkeys OR Linkin Park OR Green Day OR Oasis OR Sheila on 7 OR Dewa 19";
      } else {
        effectiveQuery = DEFAULT_TRENDING_PRESETS[seedNum % DEFAULT_TRENDING_PRESETS.length];
        isDefaultPool = true;
      }
    }

    const isDiscovery = isDefaultPool || Boolean(category);
    const minRequiredTracks = isDiscovery ? Math.min(requestedLimit, 20) : 1;
    const cacheKey = `${effectiveQuery.toLowerCase()}_${type}_${requestedLimit}_${category}`;

    // Cek in-memory cache (pastikan jumlah lagu memenuhi batas minimum discovery)
    const cachedResult = searchCache.get(cacheKey);
    if (
      cachedResult &&
      Date.now() < cachedResult.expiresAt &&
      cachedResult.data.tracks.length >= minRequiredTracks
    ) {
      const responseData = isDiscovery
        ? {
            ...cachedResult.data,
            tracks: [...cachedResult.data.tracks].sort(() => 0.5 - Math.random()),
          }
        : cachedResult.data;

      return NextResponse.json({
        success: true,
        configured: true,
        cached: true,
        query: effectiveQuery,
        data: responseData,
      });
    }

    // Ambil token Spotify (otomatis memilih key yang tidak terkena rate-limit)
    let meta = await getSpotifyTokenWithMetadata();

    const rawTracks: any[] = [];
    const rawArtists: any[] = [];
    const rawAlbums: any[] = [];
    const rawPlaylists: any[] = [];

    if (meta) {
      const orTerms = isDiscovery
        ? effectiveQuery
            .split(/\bOR\b/i)
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // Fungsi pembantu untuk melakukan request pencarian dengan token tertentu
      const executeSearch = async (token: string, clientId: string) => {
        const PAGE_SIZE = 10;
        const pagesToFetch = Math.min(Math.ceil(requestedLimit / PAGE_SIZE), 3); // 30 item

        const pagePromises = Array.from({ length: pagesToFetch }, async (_, pageIdx) => {
          // Untuk mode discovery, bagi daftar artis ke masing-masing request paralel agar tidak didominasi 1 artis
          let pageQuery = effectiveQuery;
          let offset = pageIdx * PAGE_SIZE;
          if (isDiscovery && orTerms.length >= 6) {
            const chunkSize = Math.ceil(orTerms.length / pagesToFetch);
            const slice = orTerms.slice(pageIdx * chunkSize, (pageIdx + 1) * chunkSize);
            if (slice.length > 0) {
              pageQuery = slice.join(" OR ");
              offset = 0;
            }
          }

          const spotifyUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            pageQuery
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

    // Deduplicate & limit artist dominance (Anti-saturation: max 2 tracks per artist)
    const seenTracks = new Set<string>();
    const seenTitleArtistKeys = new Set<string>();
    const artistTrackCount = new Map<string, number>();
    const MAX_PER_ARTIST = isDiscovery ? 2 : 5;

    // Urutkan berdasarkan popularitas Spotify
    const sortedRawTracks = rawTracks
      .filter((t) => Boolean(t?.id))
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    const tracks: MusicItem[] = [];

    for (const rawTrack of sortedRawTracks) {
      if (seenTracks.has(rawTrack.id)) continue;
      const mappedTrack = mapSpotifyTrack(rawTrack);
      const titleArtistKey = `${mappedTrack.title.toLowerCase()}_${(mappedTrack.artistNames[0] || "").toLowerCase()}`;
      if (seenTitleArtistKeys.has(titleArtistKey)) continue;

      const primaryArtist = (rawTrack.artists?.[0]?.name || "Unknown").toLowerCase().trim();
      const currentCount = artistTrackCount.get(primaryArtist) || 0;
      if (currentCount >= MAX_PER_ARTIST) continue;

      seenTracks.add(rawTrack.id);
      seenTitleArtistKeys.add(titleArtistKey);
      artistTrackCount.set(primaryArtist, currentCount + 1);
      tracks.push(mappedTrack);
      if (tracks.length >= requestedLimit) break;
    }

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

    // ─── FALLBACK & PELENGKAP OTOMATIS JIKA SPOTIFY LIMIT / HASIL KURANG DARI MINIMUM ───
    // Jika Spotify search terkena limit (429 QUOTA_EXCEEDED) atau jumlah lagu setelah anti-saturasi < minRequiredTracks,
    // lengkapi daftar lagu menggunakan katalog fallback agar daftar rekomendasi beranda tidak pernah kosong.
    if (tracks.length < minRequiredTracks) {
      console.warn(
        `[music/search] Jumlah lagu (${tracks.length}) < ${minRequiredTracks}. Melengkapi via katalog fallback...`
      );
      const fallbackList = await fetchITunesFallback(effectiveQuery, requestedLimit, isDiscovery);
      if (fallbackList.length > 0) {
        for (const fbTrack of fallbackList) {
          if (tracks.length >= requestedLimit) break;
          const fbKey = `${fbTrack.title.toLowerCase()}_${(fbTrack.artistNames[0] || "").toLowerCase()}`;
          if (seenTracks.has(fbTrack.id) || seenTitleArtistKeys.has(fbKey)) continue;

          const primaryArtist = (fbTrack.artistNames[0] || "Unknown").toLowerCase().trim();
          const currentCount = artistTrackCount.get(primaryArtist) || 0;
          if (currentCount >= MAX_PER_ARTIST) continue;

          seenTracks.add(fbTrack.id);
          seenTitleArtistKeys.add(fbKey);
          artistTrackCount.set(primaryArtist, currentCount + 1);
          tracks.push(fbTrack);
        }

        // Ekstrak artis unik untuk melengkapi UI jika belum ada
        const seenArt = new Set<string>(artists.map((a) => a.title.toLowerCase()));
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

    // Untuk discover/rekomendasi home: acak urutan hasil akhir agar bervariasi dan tidak mengelompok per artis
    if (isDiscovery && tracks.length > 0) {
      for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
      }
    }

    const resultData = { tracks, artists, albums, playlists };

    // Simpan ke cache jika menghasilkan lagu yang cukup
    if (tracks.length >= minRequiredTracks) {
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
