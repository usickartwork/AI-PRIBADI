// ─── Usick One Music — Types, Constants & Local Storage Helpers ────────────────

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MusicItemType = "track" | "artist" | "album" | "playlist";

export type MusicCatalogSource = "spotify" | "itunes" | "starter" | "import" | "radio";

export interface MusicItem {
  id: string;
  provider: "spotify" | "radio";
  providerItemId: string;
  itemType: MusicItemType;
  title: string;
  artistNames: string[];
  artistIds?: string[]; // Optional provider artist IDs preserved from catalog
  albumTitle?: string;
  albumId?: string; // Optional provider album ID preserved from catalog
  releaseYear?: number; // Optional 4-digit release year when available
  popularity?: number | null; // Genuine Spotify popularity (0-100); null/undefined when provider omits it
  genres?: string[]; // Optional normalized genre tags when provided by catalog/artist metadata
  catalogSource?: MusicCatalogSource; // Origin catalog adapter
  canonicalKey?: string; // Cross-source normalized track identity
  isFallbackAudio?: boolean; // True if playback audio could not be resolved to an exact match
  artworkUrl?: string;
  durationMs?: number;
  externalUrl: string;
  previewUrl?: string | null;
  uri?: string; // Spotify URI for embed
  youtubeVideoId?: string; // Optional resolved YouTube video ID for full playback
  isLiveRadio?: boolean;
  streamUrl?: string;
  radioFrequency?: string;
}

export interface LocalPlaylist {
  id: string;
  name: string;
  description?: string;
  items: MusicItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MusicPreferences {
  favoriteGenres: string[];
  favoriteArtistIds: string[];
  preferredMoods: string[];
  visualizerEnabled: boolean;
}

export interface QueueState {
  items: MusicItem[];
  currentIndex: number;
  updatedAt: string;
}

export interface SpotifySearchResult {
  tracks: MusicItem[];
  artists: MusicItem[];
  albums: MusicItem[];
  playlists: MusicItem[];
}

export interface ArtistProfileData {
  id: string;
  spotifyId: string;
  name: string;
  imageUrl?: string | null;
  genres: string[];
  externalUrl?: string;
  topTracks: MusicItem[];
  albums: MusicItem[];
}

export interface AlbumDetailData {
  id: string;
  spotifyId: string;
  title: string;
  artistNames: string[];
  artistId?: string | null;
  artworkUrl?: string;
  releaseDate?: string;
  totalTracks: number;
  externalUrl?: string;
  tracks: MusicItem[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const MUSIC_STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  playlists: "usick_music_playlists",
  queue: "usick_music_queue",
  preferences: "usick_music_preferences",
  recentSearches: "usick_music_recent_searches",
  likedSongs: "usick_music_liked_songs",
  version: "usick_music_version",
} as const;

export const SPOTIFY_GENRES = [
  { id: "pop", label: "Pop" },
  { id: "rock", label: "Rock" },
  { id: "hip-hop", label: "Hip Hop" },
  { id: "r-n-b", label: "R&B" },
  { id: "electronic", label: "Electronic" },
  { id: "jazz", label: "Jazz" },
  { id: "classical", label: "Classical" },
  { id: "indie", label: "Indie" },
  { id: "k-pop", label: "K-Pop" },
  { id: "metal", label: "Metal" },
  { id: "country", label: "Country" },
  { id: "reggae", label: "Reggae" },
  { id: "latin", label: "Latin" },
  { id: "blues", label: "Blues" },
  { id: "soul", label: "Soul" },
  { id: "acoustic", label: "Acoustic" },
] as const;

export const MOOD_SHORTCUTS = [
  { id: "chill", label: "Chill", query: "chill vibes" },
  { id: "workout", label: "Workout", query: "workout energy" },
  { id: "study", label: "Study", query: "study focus lofi" },
  { id: "party", label: "Party", query: "party hits" },
  { id: "sleep", label: "Sleep", query: "sleep ambient calm" },
  { id: "romantic", label: "Romantic", query: "romantic love songs" },
  { id: "sad", label: "Sad", query: "sad emotional" },
  { id: "happy", label: "Happy", query: "happy upbeat" },
] as const;

// ─── Storage Helpers ───────────────────────────────────────────────────────────

function checkStorageVersion(): void {
  if (typeof window === "undefined") return;
  try {
    const version = localStorage.getItem(STORAGE_KEYS.version);
    if (version && Number(version) === MUSIC_STORAGE_VERSION) return;
    // First time or version mismatch — set version, keep data
    localStorage.setItem(STORAGE_KEYS.version, String(MUSIC_STORAGE_VERSION));
  } catch {}
}

export function getLocalPlaylists(): LocalPlaylist[] {
  if (typeof window === "undefined") return [];
  checkStorageVersion();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.playlists);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalPlaylists(playlists: LocalPlaylist[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify(playlists));
  } catch (err) {
    console.warn("[music] Failed to save playlists:", err);
  }
}

export function getLikedSongs(): MusicItem[] {
  if (typeof window === "undefined") return [];
  checkStorageVersion();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.likedSongs);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveLikedSongs(items: MusicItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.likedSongs, JSON.stringify(items));
  } catch (err) {
    console.warn("[music] Failed to save liked songs:", err);
  }
}

export function getQueueState(): QueueState | null {
  if (typeof window === "undefined") return null;
  checkStorageVersion();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.queue);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveQueueState(queue: QueueState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(queue));
  } catch (err) {
    console.warn("[music] Failed to save queue:", err);
  }
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.recentSearches);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 10);
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentSearches().filter((q) => q !== query);
    recent.unshift(query);
    localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(recent.slice(0, 10)));
  } catch {}
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.recentSearches);
  } catch {}
}

// ─── Utility ───────────────────────────────────────────────────────────────────

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function generatePlaylistId(): string {
  return `pl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getSpotifyEmbedUrl(uri: string, type: MusicItemType = "track"): string {
  // Convert spotify:track:xxx to embed URL, or use providerItemId directly
  const id = uri.startsWith("spotify:") ? uri.split(":").pop() : uri;
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}

// Normalize artist name into a Unicode-safe canonical key (supports Latin, Hangul, CJK, etc.)
export function normalizeArtistKey(name: string | undefined | null): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip non-musical edition/featuring suffixes while keeping remixes, live, acoustic, and sped-up distinct
export function normalizeTrackTitleForKey(title: string | undefined | null): string {
  if (!title) return "";
  let cleaned = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase();

  // Remove parenthetical or bracketed noisy suffixes that cause Spotify/iTunes duplicates
  cleaned = cleaned.replace(
    /\s*[\(\[](?:feat\.?|ft\.?|with\s|official\s*(?:audio|music\s*video|video|lyric\s*video)?|audio|video|lyric\s*video|remaster(?:ed)?(?:\s*\d{2,4})?|from\s+["']?[^)\]]+["']?|original\s+soundtrack|ost|explicit|clean|radio\s+edit|album\s+version|single\s+version)[^)\]]*[\)\]]/gi,
    " "
  );

  // Remove trailing dash suffixes like "- Remastered 2021", "- Official Audio", "- feat. X"
  cleaned = cleaned.replace(
    /\s+-\s+(?:remaster(?:ed)?(?:\s*\d{2,4})?|official\s*(?:audio|video|music\s*video)?|feat\.?\s+.*|ft\.?\s+.*|from\s+.*|single\s+version|album\s+version|radio\s+edit)$/gi,
    " "
  );

  // Remove inline trailing feat./ft. without parentheses
  cleaned = cleaned.replace(/\s+(?:feat\.?|ft\.?)\s+.*$/gi, " ");

  return cleaned
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Compute a stable cross-catalog track identity (bridges Spotify track IDs and iTunes fallback IDs)
export function getCanonicalTrackKey(
  track: Pick<MusicItem, "title" | "artistNames"> & { id?: string; canonicalKey?: string }
): string {
  if (track.canonicalKey && track.canonicalKey.includes("::")) {
    return track.canonicalKey;
  }
  const primaryArtist = normalizeArtistKey(track.artistNames?.[0] || "");
  const normalizedTitle = normalizeTrackTitleForKey(track.title || "");
  if (primaryArtist && normalizedTitle) {
    return `${primaryArtist}::${normalizedTitle}`;
  }
  if (normalizedTitle) {
    return `unknown::${normalizedTitle}`;
  }
  return track.id || "unknown::track";
}

export function isSameMusicTrack(
  a: Pick<MusicItem, "id" | "title" | "artistNames"> & { canonicalKey?: string },
  b: Pick<MusicItem, "id" | "title" | "artistNames"> & { canonicalKey?: string }
): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  if (a.id?.startsWith("radio:") || b.id?.startsWith("radio:")) {
    return a.id === b.id;
  }
  const keyA = getCanonicalTrackKey(a);
  const keyB = getCanonicalTrackKey(b);
  return Boolean(keyA && keyB && !keyA.startsWith("unknown::") && keyA === keyB);
}

export function parseReleaseYear(releaseDate: string | undefined | null): number | undefined {
  if (!releaseDate || typeof releaseDate !== "string") return undefined;
  const match = releaseDate.trim().match(/^(\d{4})/);
  if (!match) return undefined;
  const year = Number(match[1]);
  return year >= 1900 && year <= 2100 ? year : undefined;
}

export function normalizeGenreTag(genre: string | undefined | null): string {
  if (!genre || typeof genre !== "string") return "";
  const g = genre
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[\/_]+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!g || g === "music" || g === "musik" || g === "track") return "";
  if (g === "r and b" || g === "r and b soul" || g === "rnb" || g === "r b") return "r-n-b";
  if (g === "hip hop rap" || g === "hip hop") return "hip-hop";
  if (g === "k pop" || g === "korean pop") return "k-pop";
  if (g === "indo pop" || g === "indonesian pop" || g === "pop indonesia") return "indonesian pop";
  if (g === "indonesian indie" || g === "indie indonesia") return "indonesian indie";
  return g;
}

// Map Spotify API response to our MusicItem
export function mapSpotifyTrack(track: any): MusicItem {
  const title = track.name || "Unknown Track";
  const artistNames: string[] =
    Array.isArray(track.artists) && track.artists.length > 0
      ? track.artists.map((a: any) => a?.name).filter(Boolean)
      : ["Unknown Artist"];
  const artistIds: string[] = Array.isArray(track.artists)
    ? track.artists.map((a: any) => a?.id).filter((id: any): id is string => typeof id === "string" && id.length > 0)
    : [];
  const releaseYear = parseReleaseYear(track.album?.release_date);
  const popularity =
    typeof track.popularity === "number" && Number.isFinite(track.popularity)
      ? Math.max(0, Math.min(100, Math.round(track.popularity)))
      : null;
  const id = `spotify:track:${track.id}`;

  return {
    id,
    provider: "spotify",
    providerItemId: track.id,
    itemType: "track",
    title,
    artistNames: artistNames.length > 0 ? artistNames : ["Unknown Artist"],
    artistIds: artistIds.length > 0 ? artistIds : undefined,
    albumTitle: track.album?.name,
    albumId: typeof track.album?.id === "string" ? track.album.id : undefined,
    releaseYear,
    popularity,
    catalogSource: "spotify",
    canonicalKey: getCanonicalTrackKey({ id, title, artistNames }),
    artworkUrl: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url,
    durationMs: track.duration_ms,
    externalUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
    previewUrl: track.preview_url,
    uri: track.uri || id,
  };
}

export function mapSpotifyArtist(artist: any): MusicItem {
  const rawGenres: string[] = Array.isArray(artist.genres)
    ? Array.from(new Set(artist.genres.map((g: any) => normalizeGenreTag(g)).filter(Boolean)))
    : [];
  const popularity =
    typeof artist.popularity === "number" && Number.isFinite(artist.popularity)
      ? Math.max(0, Math.min(100, Math.round(artist.popularity)))
      : null;
  return {
    id: `spotify:artist:${artist.id}`,
    provider: "spotify",
    providerItemId: artist.id,
    itemType: "artist",
    title: artist.name || "Unknown Artist",
    artistNames: [artist.name || "Unknown Artist"],
    artistIds: artist.id ? [String(artist.id)] : undefined,
    genres: rawGenres.length > 0 ? rawGenres : undefined,
    popularity,
    catalogSource: "spotify",
    artworkUrl: artist.images?.[0]?.url || artist.images?.[1]?.url,
    externalUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
    uri: artist.uri || `spotify:artist:${artist.id}`,
  };
}

export function mapSpotifyAlbum(album: any): MusicItem {
  const year = album.release_date ? album.release_date.slice(0, 4) : "";
  const typeLabel = album.album_type === "single" ? "Single" : "Album";
  return {
    id: `spotify:album:${album.id}`,
    provider: "spotify",
    providerItemId: album.id,
    itemType: "album",
    title: album.name || "Unknown Album",
    artistNames: album.artists?.map((a: any) => a.name) || ["Unknown Artist"],
    albumTitle: year ? `${year} • ${typeLabel}` : typeLabel,
    artworkUrl: album.images?.[0]?.url || album.images?.[1]?.url,
    externalUrl: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
    uri: album.uri || `spotify:album:${album.id}`,
  };
}

export function mapSpotifyPlaylist(playlist: any): MusicItem {
  return {
    id: `spotify:playlist:${playlist.id}`,
    provider: "spotify",
    providerItemId: playlist.id,
    itemType: "playlist",
    title: playlist.name || "Unknown Playlist",
    artistNames: [playlist.owner?.display_name || "Spotify"],
    artworkUrl: playlist.images?.[0]?.url,
    externalUrl: playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`,
    uri: playlist.uri || `spotify:playlist:${playlist.id}`,
  };
}

