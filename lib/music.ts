// ─── Usick One Music — Types, Constants & Local Storage Helpers ────────────────

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MusicItemType = "track" | "artist" | "album" | "playlist";

export interface MusicItem {
  id: string;
  provider: "spotify";
  providerItemId: string;
  itemType: MusicItemType;
  title: string;
  artistNames: string[];
  albumTitle?: string;
  artworkUrl?: string;
  durationMs?: number;
  externalUrl: string;
  previewUrl?: string | null;
  uri?: string; // Spotify URI for embed
  youtubeVideoId?: string; // Optional resolved YouTube video ID for full playback
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
  { id: "pop", label: "Pop", emoji: "🎵" },
  { id: "rock", label: "Rock", emoji: "🎸" },
  { id: "hip-hop", label: "Hip Hop", emoji: "🎤" },
  { id: "r-n-b", label: "R&B", emoji: "🎶" },
  { id: "electronic", label: "Electronic", emoji: "⚡" },
  { id: "jazz", label: "Jazz", emoji: "🎷" },
  { id: "classical", label: "Classical", emoji: "🎻" },
  { id: "indie", label: "Indie", emoji: "🎹" },
  { id: "k-pop", label: "K-Pop", emoji: "🌸" },
  { id: "metal", label: "Metal", emoji: "🤘" },
  { id: "country", label: "Country", emoji: "🤠" },
  { id: "reggae", label: "Reggae", emoji: "🏝️" },
  { id: "latin", label: "Latin", emoji: "💃" },
  { id: "blues", label: "Blues", emoji: "🎺" },
  { id: "soul", label: "Soul", emoji: "❤️" },
  { id: "anime", label: "Anime", emoji: "🌀" },
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

// Map Spotify API response to our MusicItem
export function mapSpotifyTrack(track: any): MusicItem {
  return {
    id: `spotify:track:${track.id}`,
    provider: "spotify",
    providerItemId: track.id,
    itemType: "track",
    title: track.name || "Unknown Track",
    artistNames: track.artists?.map((a: any) => a.name) || ["Unknown Artist"],
    albumTitle: track.album?.name,
    artworkUrl: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url,
    durationMs: track.duration_ms,
    externalUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
    previewUrl: track.preview_url,
    uri: track.uri || `spotify:track:${track.id}`,
  };
}

export function mapSpotifyArtist(artist: any): MusicItem {
  return {
    id: `spotify:artist:${artist.id}`,
    provider: "spotify",
    providerItemId: artist.id,
    itemType: "artist",
    title: artist.name || "Unknown Artist",
    artistNames: [artist.name || "Unknown Artist"],
    artworkUrl: artist.images?.[0]?.url || artist.images?.[1]?.url,
    externalUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
    uri: artist.uri || `spotify:artist:${artist.id}`,
  };
}

export function mapSpotifyAlbum(album: any): MusicItem {
  return {
    id: `spotify:album:${album.id}`,
    provider: "spotify",
    providerItemId: album.id,
    itemType: "album",
    title: album.name || "Unknown Album",
    artistNames: album.artists?.map((a: any) => a.name) || ["Unknown Artist"],
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

