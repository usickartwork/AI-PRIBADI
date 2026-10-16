"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Avatar from "@/components/ui/components-primitives-avatar";
import {
  MusicItem,
  LocalPlaylist,
  SpotifySearchResult,
  ArtistProfileData,
  AlbumDetailData,
  SPOTIFY_GENRES,
  MOOD_SHORTCUTS,
  getLocalPlaylists,
  saveLocalPlaylists,
  getLikedSongs,
  saveLikedSongs,
  getQueueState,
  saveQueueState,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  formatDurationMs,
  generatePlaylistId,
} from "@/lib/music";
import {
  LyricsData,
  findActiveLyricIndex,
  getClientLyricsCache,
  setClientLyricsCache,
} from "@/lib/lyrics";
import { useMusicConnect } from "@/lib/useMusicConnect";
import {
  MusicConnectButton,
  MusicConnectRemoteBar,
  MusicConnectModal,
} from "./MusicConnectPanel";

interface MusicWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  onTogglePanel?: () => void;
  userName?: string;
}

type SubTab = "home" | "search" | "playlists";

// Valid 0.1s 8kHz 8-bit mono PCM silent WAV loop for holding mobile background audio session
const SILENT_AUDIO_URI =
  "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

// Curated starter tracks with 100% verified Spotify artworks
const FEATURED_STARTER_TRACKS: MusicItem[] = [
  {
    id: "spotify:track:4jXpabLpCjQ6Fk9x1hWfS2",
    provider: "spotify",
    providerItemId: "4jXpabLpCjQ6Fk9x1hWfS2",
    itemType: "track",
    title: "Gala bunga matahari",
    artistNames: ["Sal Priadi"],
    albumTitle: "MARKERS AND SUCH PENS FLASHDISKS",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273ce96f88cb86d7fc857790757",
    durationMs: 236873,
    externalUrl: "https://open.spotify.com/track/4jXpabLpCjQ6Fk9x1hWfS2",
    uri: "spotify:track:4jXpabLpCjQ6Fk9x1hWfS2",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:7qiZfU4dY1lWllzX7mPBI3",
    provider: "spotify",
    providerItemId: "7qiZfU4dY1lWllzX7mPBI3",
    itemType: "track",
    title: "Shape of You",
    artistNames: ["Ed Sheeran"],
    albumTitle: "÷ (Deluxe)",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    durationMs: 233712,
    externalUrl: "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3",
    uri: "spotify:track:7qiZfU4dY1lWllzX7mPBI3",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:0VjIjW4GlUZAMYd2vXMi3b",
    provider: "spotify",
    providerItemId: "0VjIjW4GlUZAMYd2vXMi3b",
    itemType: "track",
    title: "Blinding Lights",
    artistNames: ["The Weeknd"],
    albumTitle: "After Hours",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    durationMs: 200040,
    externalUrl: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
    uri: "spotify:track:0VjIjW4GlUZAMYd2vXMi3b",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:5QO79kh1waicV47BqGRL3g",
    provider: "spotify",
    providerItemId: "5QO79kh1waicV47BqGRL3g",
    itemType: "track",
    title: "Save Your Tears",
    artistNames: ["The Weeknd"],
    albumTitle: "After Hours",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    durationMs: 215626,
    externalUrl: "https://open.spotify.com/track/5QO79kh1waicV47BqGRL3g",
    uri: "spotify:track:5QO79kh1waicV47BqGRL3g",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:6dOtVTDdiauQNBQEDOtlAB",
    provider: "spotify",
    providerItemId: "6dOtVTDdiauQNBQEDOtlAB",
    itemType: "track",
    title: "BIRDS OF A FEATHER",
    artistNames: ["Billie Eilish"],
    albumTitle: "HIT ME HARD AND SOFT",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b27371d62ea7ea8a5be92d3c1f62",
    durationMs: 210373,
    externalUrl: "https://open.spotify.com/track/6dOtVTDdiauQNBQEDOtlAB",
    uri: "spotify:track:6dOtVTDdiauQNBQEDOtlAB",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:7so0lgd0zP2Sbgs2d7a1SZ",
    provider: "spotify",
    providerItemId: "7so0lgd0zP2Sbgs2d7a1SZ",
    itemType: "track",
    title: "Die With A Smile",
    artistNames: ["Lady Gaga","Bruno Mars"],
    albumTitle: "MAYHEM",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273b0860cf0a98e09663c82290c",
    durationMs: 251667,
    externalUrl: "https://open.spotify.com/track/7so0lgd0zP2Sbgs2d7a1SZ",
    uri: "spotify:track:7so0lgd0zP2Sbgs2d7a1SZ",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:2qSkIjg1o9h3YT9RAgYN75",
    provider: "spotify",
    providerItemId: "2qSkIjg1o9h3YT9RAgYN75",
    itemType: "track",
    title: "Espresso",
    artistNames: ["Sabrina Carpenter"],
    albumTitle: "Espresso",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273659cd4673230913b3918e0d5",
    durationMs: 175459,
    externalUrl: "https://open.spotify.com/track/2qSkIjg1o9h3YT9RAgYN75",
    uri: "spotify:track:2qSkIjg1o9h3YT9RAgYN75",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:5G2f63n7IPVPPjfNIGih7Q",
    provider: "spotify",
    providerItemId: "5G2f63n7IPVPPjfNIGih7Q",
    itemType: "track",
    title: "Taste",
    artistNames: ["Sabrina Carpenter"],
    albumTitle: "Short n' Sweet",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273fd8d7a8d96871e791cb1f626",
    durationMs: 157279,
    externalUrl: "https://open.spotify.com/track/5G2f63n7IPVPPjfNIGih7Q",
    uri: "spotify:track:5G2f63n7IPVPPjfNIGih7Q",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:1BxfuPKGuaTgP7aM0Bbdwr",
    provider: "spotify",
    providerItemId: "1BxfuPKGuaTgP7aM0Bbdwr",
    itemType: "track",
    title: "Cruel Summer",
    artistNames: ["Taylor Swift"],
    albumTitle: "Lover",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647",
    durationMs: 178426,
    externalUrl: "https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr",
    uri: "spotify:track:1BxfuPKGuaTgP7aM0Bbdwr",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:7zOVh5fGpEwSbZd0g9z80B",
    provider: "spotify",
    providerItemId: "7zOVh5fGpEwSbZd0g9z80B",
    itemType: "track",
    title: "Satu Bulan",
    artistNames: ["Bernadya"],
    albumTitle: "Terlintas",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273cb1e5f7d0942bf9196c1e711",
    durationMs: 200476,
    externalUrl: "https://open.spotify.com/track/7zOVh5fGpEwSbZd0g9z80B",
    uri: "spotify:track:7zOVh5fGpEwSbZd0g9z80B",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:2dIBMHByUGcNPzmYBJ6OAj",
    provider: "spotify",
    providerItemId: "2dIBMHByUGcNPzmYBJ6OAj",
    itemType: "track",
    title: "Evaluasi",
    artistNames: ["Hindia"],
    albumTitle: "Menari Dengan Bayangan",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273d623688488865906052ef96b",
    durationMs: 194469,
    externalUrl: "https://open.spotify.com/track/2dIBMHByUGcNPzmYBJ6OAj",
    uri: "spotify:track:2dIBMHByUGcNPzmYBJ6OAj",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:1nYdkPCbHdYi4w7s2L6SHA",
    provider: "spotify",
    providerItemId: "1nYdkPCbHdYi4w7s2L6SHA",
    itemType: "track",
    title: "Rayuan Perempuan Gila",
    artistNames: ["Nadin Amizah"],
    albumTitle: "Rayuan Perempuan Gila",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2739bbf0358fb086f43ffde5148",
    durationMs: 320000,
    externalUrl: "https://open.spotify.com/track/1nYdkPCbHdYi4w7s2L6SHA",
    uri: "spotify:track:1nYdkPCbHdYi4w7s2L6SHA",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:1mea3bSkSGXuIRvnydlB5b",
    provider: "spotify",
    providerItemId: "1mea3bSkSGXuIRvnydlB5b",
    itemType: "track",
    title: "Viva La Vida",
    artistNames: ["Coldplay"],
    albumTitle: "Viva La Vida or Death and All His Friends",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273e21cc1db05580b6f2d2a3b6e",
    durationMs: 242373,
    externalUrl: "https://open.spotify.com/track/1mea3bSkSGXuIRvnydlB5b",
    uri: "spotify:track:1mea3bSkSGXuIRvnydlB5b",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:39LLxExYz6ewLAcYrzQQyP",
    provider: "spotify",
    providerItemId: "39LLxExYz6ewLAcYrzQQyP",
    itemType: "track",
    title: "Levitating",
    artistNames: ["Dua Lipa"],
    albumTitle: "Future Nostalgia",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273c88bae7846e62a8ba59ee0bd",
    durationMs: 203807,
    externalUrl: "https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP",
    uri: "spotify:track:39LLxExYz6ewLAcYrzQQyP",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:2JiDi0qAXsPwhPqA2qaKGt",
    provider: "spotify",
    providerItemId: "2JiDi0qAXsPwhPqA2qaKGt",
    itemType: "track",
    title: "Bohemian Rhapsody",
    artistNames: ["Queen"],
    albumTitle: "A Night At The Opera",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273fdab4a163ab9f6db72c952ee",
    durationMs: 355154,
    externalUrl: "https://open.spotify.com/track/2JiDi0qAXsPwhPqA2qaKGt",
    uri: "spotify:track:2JiDi0qAXsPwhPqA2qaKGt",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:5vNRhkKd0yEAg8suGBpjeY",
    provider: "spotify",
    providerItemId: "5vNRhkKd0yEAg8suGBpjeY",
    itemType: "track",
    title: "APT.",
    artistNames: ["ROSÉ","Bruno Mars"],
    albumTitle: "APT.",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b27346085aa1855bd888abc51a5a",
    durationMs: 169917,
    externalUrl: "https://open.spotify.com/track/5vNRhkKd0yEAg8suGBpjeY",
    uri: "spotify:track:5vNRhkKd0yEAg8suGBpjeY",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:2gcMYiZzzmzoF8PPAfL3IO",
    provider: "spotify",
    providerItemId: "2gcMYiZzzmzoF8PPAfL3IO",
    itemType: "track",
    title: "Untungnya, Hidup Harus Tetap Berjalan",
    artistNames: ["Bernadya"],
    albumTitle: "Sialnya, Hidup Harus Tetap Berjalan",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b27327693aaf059002bba3a7655a",
    durationMs: 182903,
    externalUrl: "https://open.spotify.com/track/2gcMYiZzzmzoF8PPAfL3IO",
    uri: "spotify:track:2gcMYiZzzmzoF8PPAfL3IO",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:4Dvkj6JhhA12EX05fT7y2e",
    provider: "spotify",
    providerItemId: "4Dvkj6JhhA12EX05fT7y2e",
    itemType: "track",
    title: "As It Was",
    artistNames: ["Harry Styles"],
    albumTitle: "Harry's House",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b27382ce362511fb3d9dda6578ee",
    durationMs: 167303,
    externalUrl: "https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e",
    uri: "spotify:track:4Dvkj6JhhA12EX05fT7y2e",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:3aBGKDiAAvH2H7HLOyQ4US",
    provider: "spotify",
    providerItemId: "3aBGKDiAAvH2H7HLOyQ4US",
    itemType: "track",
    title: "Glimpse of Us",
    artistNames: ["Joji"],
    albumTitle: "Glimpse of Us",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273f3f7d2ea2ad435b57d6697df",
    durationMs: 233453,
    externalUrl: "https://open.spotify.com/track/3aBGKDiAAvH2H7HLOyQ4US",
    uri: "spotify:track:3aBGKDiAAvH2H7HLOyQ4US",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:3e0wYnFxkqinmtXebYPMSt",
    provider: "spotify",
    providerItemId: "3e0wYnFxkqinmtXebYPMSt",
    itemType: "track",
    title: "Yellow",
    artistNames: ["Coldplay"],
    albumTitle: "Yellow",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b27383580914326a689d622ab4f2",
    durationMs: 266773,
    externalUrl: "https://open.spotify.com/track/3e0wYnFxkqinmtXebYPMSt",
    uri: "spotify:track:3e0wYnFxkqinmtXebYPMSt",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:7MXVkk9YMctZqd1Srtv4MB",
    provider: "spotify",
    providerItemId: "7MXVkk9YMctZqd1Srtv4MB",
    itemType: "track",
    title: "Starboy",
    artistNames: ["The Weeknd","Daft Punk"],
    albumTitle: "Starboy",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
    durationMs: 230453,
    externalUrl: "https://open.spotify.com/track/7MXVkk9YMctZqd1Srtv4MB",
    uri: "spotify:track:7MXVkk9YMctZqd1Srtv4MB",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:6O0WEM0QNEhqpU50BKui7o",
    provider: "spotify",
    providerItemId: "6O0WEM0QNEhqpU50BKui7o",
    itemType: "track",
    title: "Sial",
    artistNames: ["Mahalini"],
    albumTitle: "fábula",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2736f713eb92ebf7ca05a562542",
    durationMs: 243724,
    externalUrl: "https://open.spotify.com/track/6O0WEM0QNEhqpU50BKui7o",
    uri: "spotify:track:6O0WEM0QNEhqpU50BKui7o",
    youtubeVideoId: "",
  },
  {
    id: "spotify:track:3blvSatB9XD5i705K4j2yP",
    provider: "spotify",
    providerItemId: "3blvSatB9XD5i705K4j2yP",
    itemType: "track",
    title: "Komang",
    artistNames: ["Raim Laode"],
    albumTitle: "iqro'",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273a9d1f9b5d3275b0625e13e79",
    durationMs: 222706,
    externalUrl: "https://open.spotify.com/track/3blvSatB9XD5i705K4j2yP",
    uri: "spotify:track:3blvSatB9XD5i705K4j2yP",
    youtubeVideoId: "",
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function MusicWorkspace({ isDark, onClose, onTogglePanel, userName }: MusicWorkspaceProps) {
  // Navigation & View State (Clean 2 primary tabs: home & playlists)
  const [subTab, setSubTab] = useState<SubTab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSpotifyConfigured, setIsSpotifyConfigured] = useState<boolean | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Discover Feed State (Randomized/shuffled starter collection like Spotify / Apple Music home)
  const [discoverTracks, setDiscoverTracks] = useState<MusicItem[]>(() =>
    shuffleArray(FEATURED_STARTER_TRACKS)
  );

  const handleShuffleDiscover = () => {
    const pool = tracks.length > 0 ? tracks : FEATURED_STARTER_TRACKS;
    setDiscoverTracks(shuffleArray(pool));
  };

  const handlePlayAllDiscover = () => {
    if (discoverTracks.length === 0) return;
    playAllTracks(discoverTracks);
  };

  // Music Catalog State (Defaults to rich starter selection)
  const [tracks, setTracks] = useState<MusicItem[]>(FEATURED_STARTER_TRACKS);
  const [artists, setArtists] = useState<MusicItem[]>([]);
  const [albums, setAlbums] = useState<MusicItem[]>([]);
  const [playlistsList, setPlaylistsList] = useState<MusicItem[]>([]);

  // Artist Profile & Album Detail State
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfileData | null>(null);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [artistError, setArtistError] = useState<string | null>(null);

  const [selectedAlbum, setSelectedAlbum] = useState<AlbumDetailData | null>(null);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);
  const [discographyFilter, setDiscographyFilter] = useState<"all" | "album" | "single">("all");

  // User Library State
  const [likedSongs, setLikedSongs] = useState<MusicItem[]>([]);
  const [localPlaylists, setLocalPlaylists] = useState<LocalPlaylist[]>([]);
  const [selectedLocalPlaylist, setSelectedLocalPlaylist] = useState<LocalPlaylist | null>(null);
  const [isViewingLiked, setIsViewingLiked] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Playback & Queue State (Queue starts empty on load/refresh as requested)
  const [currentTrack, setCurrentTrack] = useState<MusicItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [queue, setQueue] = useState<MusicItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Modals, Drawers & Sidebars
  const [showDesktopQueue, setShowDesktopQueue] = useState(false);
  const [showMobilePlayer, setShowMobilePlayer] = useState(false);
  const [mobilePlayerMode, setMobilePlayerMode] = useState<"track" | "lyrics" | "queue">("track");
  const mobileQueueContainerRef = useRef<HTMLDivElement>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<MusicItem | null>(null);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Floating Queue Toast State (Snappy 1100ms duration with smooth fade-in/fade-out)
  const [queueToast, setQueueToast] = useState<string | null>(null);
  const [isQueueToastVisible, setIsQueueToastVisible] = useState(false);
  const queueToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queueToastCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const musicConnectRef = useRef<any>(null);

  const showQueueToast = useCallback((msg: string) => {
    if (queueToastTimeoutRef.current) clearTimeout(queueToastTimeoutRef.current);
    if (queueToastCleanupTimeoutRef.current) clearTimeout(queueToastCleanupTimeoutRef.current);
    setQueueToast(msg);
    setIsQueueToastVisible(true);
    queueToastTimeoutRef.current = setTimeout(() => {
      setIsQueueToastVisible(false);
      queueToastCleanupTimeoutRef.current = setTimeout(() => {
        setQueueToast(null);
      }, 250);
    }, 1100);
  }, []);

  // Spotify-style Recommendations (derived from trending discover catalog, excluding currently playing and queued songs)
  const recommendedTracks = useMemo(() => {
    const sourcePool = discoverTracks.length > 0 ? discoverTracks : FEATURED_STARTER_TRACKS;
    return sourcePool.filter(
      (t) => t.id !== currentTrack?.id && !queue.some((q) => q.id === t.id)
    ).slice(0, 8);
  }, [discoverTracks, currentTrack?.id, queue]);

  // Interactive Continuous Scrubber State
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const scrubTimeRef = useRef<number | null>(null);
  const isScrubbingRef = useRef(false);

  // Mobile Full Player Swipe Gestures & Ref
  const mobilePlayerRef = useRef<HTMLDivElement>(null);
  const isClosingMobilePlayerRef = useRef(false);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const isTrackingTouchRef = useRef(false);
  const isDraggingDownRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);

  // YouTube Full Song Streaming Refs
  const ytPlayerRef = useRef<any>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const [isYtReady, setIsYtReady] = useState(false);
  const [isResolvingAudio, setIsResolvingAudio] = useState(false);
  const pendingVideoIdRef = useRef<string | null>(null);
  const pendingVideoOptionsRef = useRef<{ startSeconds: number; autoPlay: boolean }>({
    startSeconds: 0,
    autoPlay: true,
  });
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const loadedTrackIdRef = useRef<string | null>(null);

  // Time formatters for playback scrubber
  const formatPlaybackTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m}:${String(remS).padStart(2, "0")}`;
  };

  const formatRemainingPlaybackTime = (cur: number, total: number) => {
    const rem = Math.max(0, Math.floor(total - cur));
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    return `-${m}:${String(s).padStart(2, "0")}`;
  };

  // User-Initiated Pause Ref (distinguishes intentional pause vs browser/OS background suspension)
  const userRequestedPauseRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Synchronized Lyrics State & High-Performance Playback Clock
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const mobileLyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileActiveLineRef = useRef<HTMLDivElement | null>(null);

  // High-performance active lyric index (updated ONLY when line index changes via rAF)
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);
  const activeLyricIndexRef = useRef<number>(-1);
  useEffect(() => {
    activeLyricIndexRef.current = activeLyricIndex;
  }, [activeLyricIndex]);

  // Monotonic Playback Clock Snapshot (performance.now() based interpolation)
  const playbackClockRef = useRef<{
    positionSeconds: number;
    snapshotPerfTime: number;
    isPlaying: boolean;
    duration: number;
    trackId: string;
  }>({
    positionSeconds: 0,
    snapshotPerfTime: typeof performance !== "undefined" ? performance.now() : 0,
    isPlaying: false,
    duration: 0,
    trackId: "",
  });

  // Race-condition guard refs for lyrics fetch requests
  const fetchLyricsRequestIdRef = useRef<number>(0);
  const fetchLyricsAbortControllerRef = useRef<AbortController | null>(null);

  // Synchronized state refs for callbacks (prevent stale closures)
  const queueRef = useRef<MusicItem[]>(queue);
  const queueIndexRef = useRef<number>(queueIndex);
  const repeatModeRef = useRef<"off" | "all" | "one">(repeatMode);
  const isShuffleRef = useRef<boolean>(isShuffle);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);

  // Audio Ref (fallback)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Cloud Sync Helper (Debounced & Race-Safe Persistence to User Account) ──
  const cloudSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cloudSyncAbortRef = useRef<AbortController | null>(null);

  const syncLibraryToCloud = useCallback((nextLiked: MusicItem[], nextPlaylists: LocalPlaylist[]) => {
    if (cloudSyncTimeoutRef.current) {
      clearTimeout(cloudSyncTimeoutRef.current);
    }
    cloudSyncTimeoutRef.current = setTimeout(async () => {
      if (cloudSyncAbortRef.current) {
        cloudSyncAbortRef.current.abort();
      }
      const controller = new AbortController();
      cloudSyncAbortRef.current = controller;
      try {
        await fetch("/api/music/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            likedSongs: nextLiked,
            playlists: nextPlaylists,
          }),
          signal: controller.signal,
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("[music] Cloud sync error:", err);
        }
      }
    }, 350);
  }, []);

  // ─── Initialize Local & Cloud Account Library Data ──────────────────────────
  useEffect(() => {
    let isMounted = true;
    const initialLocalLiked = getLikedSongs();
    const initialLocalPlaylists = getLocalPlaylists();

    setLikedSongs(initialLocalLiked);
    setLocalPlaylists(initialLocalPlaylists);
    setRecentSearches(getRecentSearches());

    // When refreshing or entering the web, the queue starts empty until user adds tracks
    saveQueueState({ items: [], currentIndex: 0, updatedAt: new Date().toISOString() });
    setQueue([]);
    setCurrentTrack(null);

    // Sync Liked Songs & Playlists with the authenticated user's cloud account
    (async () => {
      try {
        const res = await fetch("/api/music/library", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!isMounted || !json?.success || !json?.userId) return;

        const ownerKey = "usick_music_owner_user_id";
        const lastOwnerId = typeof window !== "undefined" ? localStorage.getItem(ownerKey) : null;
        const currentLocalLiked = getLikedSongs();
        const currentLocalPl = getLocalPlaylists();

        if (json.hasCloudRecord) {
          const cloudLiked: MusicItem[] = Array.isArray(json.likedSongs) ? json.likedSongs : [];
          const cloudPl: LocalPlaylist[] = Array.isArray(json.playlists) ? json.playlists : [];

          if (!lastOwnerId && (currentLocalLiked.length > 0 || currentLocalPl.length > 0)) {
            // First time linking this browser to the account: merge any local items with cloud
            const likedMap = new Map<string, MusicItem>();
            [...cloudLiked, ...currentLocalLiked].forEach((item) => {
              if (item?.id && !likedMap.has(item.id)) likedMap.set(item.id, item);
            });
            const mergedLiked = Array.from(likedMap.values());

            const plMap = new Map<string, LocalPlaylist>();
            [...cloudPl, ...currentLocalPl].forEach((pl) => {
              if (pl?.id && !plMap.has(pl.id)) plMap.set(pl.id, pl);
            });
            const mergedPl = Array.from(plMap.values());

            setLikedSongs(mergedLiked);
            saveLikedSongs(mergedLiked);
            setLocalPlaylists(mergedPl);
            saveLocalPlaylists(mergedPl);
            try { localStorage.setItem(ownerKey, json.userId); } catch {}

            if (mergedLiked.length !== cloudLiked.length || mergedPl.length !== cloudPl.length) {
              syncLibraryToCloud(mergedLiked, mergedPl);
            }
          } else {
            // Use the account's cloud library across devices
            setLikedSongs(cloudLiked);
            saveLikedSongs(cloudLiked);
            setLocalPlaylists(cloudPl);
            saveLocalPlaylists(cloudPl);
            try { localStorage.setItem(ownerKey, json.userId); } catch {}
          }
        } else {
          // Account has no cloud record yet
          if (!lastOwnerId || lastOwnerId === json.userId) {
            try { localStorage.setItem(ownerKey, json.userId); } catch {}
            if (currentLocalLiked.length > 0 || currentLocalPl.length > 0) {
              syncLibraryToCloud(currentLocalLiked, currentLocalPl);
            }
          } else {
            // Different user logged in on the same browser and has an empty cloud library
            setLikedSongs([]);
            saveLikedSongs([]);
            setLocalPlaylists([]);
            saveLocalPlaylists([]);
            try { localStorage.setItem(ownerKey, json.userId); } catch {}
          }
        }
      } catch (err) {
        console.warn("[music] Failed to load cloud music library:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [syncLibraryToCloud]);

  // ─── Initialize YouTube IFrame Player API for 100% Full Playback ───────────
  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted) return;
      if (!(window as any).YT || !(window as any).YT.Player) return;
      if (ytPlayerRef.current) return;

      const el = document.getElementById("youtube-music-player");
      if (!el) return;

      try {
        const player = new (window as any).YT.Player("youtube-music-player", {
          height: "100%",
          width: "100%",
          videoId: currentVideoId || "3BFTio5296w",
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              ytPlayerRef.current = event.target;
              isYtReadyRef.current = true;
              setIsYtReady(true);
              try {
                event.target.setVolume(volume * 100);
              } catch {}
              if (pendingVideoIdRef.current) {
                const vid = pendingVideoIdRef.current;
                const opts = pendingVideoOptionsRef.current;
                pendingVideoIdRef.current = null;
                try {
                  if (opts.autoPlay) {
                    event.target.loadVideoById({
                      videoId: vid,
                      startSeconds: opts.startSeconds || 0,
                    });
                    event.target.playVideo();
                  } else if (typeof event.target.cueVideoById === "function") {
                    event.target.cueVideoById({
                      videoId: vid,
                      startSeconds: opts.startSeconds || 0,
                    });
                  } else {
                    event.target.loadVideoById(vid);
                  }
                } catch (loadErr) {
                  console.warn("ytPlayer onReady initial load error:", loadErr);
                }
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1: PLAYING, 2: PAUSED, 0: ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                userRequestedPauseRef.current = false;
                try {
                  const cur = event.target.getCurrentTime() || 0;
                  const dur = event.target.getDuration() || 0;
                  if (dur > 0) setDuration(dur);
                  playbackClockRef.current = {
                    positionSeconds: cur,
                    snapshotPerfTime: performance.now(),
                    isPlaying: true,
                    duration: dur,
                    trackId: currentTrack?.id || "",
                  };
                } catch {}
              } else if (event.data === 2) {
                // Background playback protection: if browser/OS paused playback due to tab switch or app minimize, keep playing!
                if (typeof document !== "undefined" && document.hidden && !userRequestedPauseRef.current) {
                  try {
                    event.target.playVideo();
                  } catch {}
                  return;
                }
                // Only mark as paused if user intentionally paused or page is visible in foreground
                if (userRequestedPauseRef.current || (typeof document !== "undefined" && !document.hidden)) {
                  playbackClockRef.current.isPlaying = false;
                  try {
                    playbackClockRef.current.positionSeconds = event.target.getCurrentTime() || playbackClockRef.current.positionSeconds;
                  } catch {}
                  setIsPlaying(false);
                }
              } else if (event.data === 0) {
                playbackClockRef.current.isPlaying = false;
                setIsPlaying(false);
                handleTrackEnded();
              }
            },
            onError: (err: any) => {
              console.warn("[YouTube Player Error]:", err);
            },
          },
        });
        ytPlayerRef.current = player;
      } catch (e) {
        console.error("[YouTube Init Error]:", e);
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;

      if (!document.hidden) {
        // User returned to the app! If playback was active and not paused by user, resume immediately!
        if (isPlayingRef.current && !userRequestedPauseRef.current) {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
            try {
              ytPlayerRef.current.playVideo();
            } catch {}
          }
          if (audioRef.current) {
            try {
              audioRef.current.play().catch(() => {});
            } catch {}
          }
          playbackClockRef.current.snapshotPerfTime = performance.now();
          playbackClockRef.current.isPlaying = true;
        }
      } else {
        // App minimized or user switched away to another app (e.g. WhatsApp)
        if (isPlayingRef.current && !userRequestedPauseRef.current) {
          if (audioRef.current) {
            try {
              audioRef.current.play().catch(() => {});
            } catch {}
          }
          if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
            try {
              ytPlayerRef.current.playVideo();
            } catch {}
          }
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
          }
        }
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleVisibilityChange);
    }

    if (typeof window !== "undefined") {
      if (!(window as any).YT) {
        const existingScript = document.getElementById("youtube-iframe-api-script");
        if (!existingScript) {
          const tag = document.createElement("script");
          tag.id = "youtube-iframe-api-script";
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
        }
        const prevReady = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          if (typeof prevReady === "function") {
            try { prevReady(); } catch {}
          }
          initPlayer();
        };
      } else {
        initPlayer();
      }
    }

    return () => {
      isMounted = false;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleVisibilityChange);
      }
    };
  }, []);

  // ─── Periodic Player State & Scrubber Synchronizer (Light 500ms cadence) ──
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          const dur = ytPlayerRef.current.getDuration();
          if (typeof cur === "number" && !isNaN(cur)) {
            setCurrentTime(cur);
            // Re-sync monotonic clock snapshot to correct any hardware/buffer drift
            playbackClockRef.current = {
              positionSeconds: cur,
              snapshotPerfTime: performance.now(),
              isPlaying: true,
              duration: typeof dur === "number" && dur > 0 ? dur : playbackClockRef.current.duration,
              trackId: currentTrack?.id || "",
            };
          }
          if (typeof dur === "number" && dur > 0 && !isNaN(dur)) setDuration(dur);
        } catch {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.id]);

  // ─── Initial & Category-Based Spotify Catalog Fetch (Loads 50 songs) ──────
  const fetchSpotifyMusic = useCallback(async (query: string = "", category: string = "all", limit: number = 50) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const categoryParam = category !== "all" ? `&category=${encodeURIComponent(category)}` : "";
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}${categoryParam}&limit=${limit}`);
      const json = await res.json();

      setIsSpotifyConfigured(json.configured ?? false);

      if (json.success && json.data) {
        const fetchedTracks = json.data.tracks || [];
        if (fetchedTracks.length > 0) {
          setTracks(fetchedTracks);
          if (!query.trim()) {
            setDiscoverTracks(shuffleArray(fetchedTracks));
          }
        }
        if (json.data.artists) setArtists(json.data.artists);
        if (json.data.albums) setAlbums(json.data.albums);
        if (json.data.playlists) setPlaylistsList(json.data.playlists);
      } else if (json.error) {
        setSearchError(json.error);
      }
    } catch (err: any) {
      setSearchError(err?.message || "Gagal menghubungkan ke Spotify API.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Initial load: Fetch 50 tracks from Spotify
  useEffect(() => {
    fetchSpotifyMusic("", "all", 50);
  }, [fetchSpotifyMusic]);

  // Debounced search as user types in chat box (seamless typing without interruption)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setHasSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      setHasSearched(true);
      fetchSpotifyMusic(trimmed, "all", 50);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchSpotifyMusic]);

  // ─── Search Execution Handlers ─────────────────────────────────────────────
  const handleExecuteSearch = (query: string) => {
    if (!query.trim()) return;
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setSearchQuery(query);
    setHasSearched(true);
    if (subTab !== "home") setSubTab("home");
    addRecentSearch(query.trim());
    setRecentSearches(getRecentSearches());
    fetchSpotifyMusic(query.trim(), "all", 50);
  };

  const handleQuickSearch = (term: string) => {
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setSearchQuery(term);
    setHasSearched(true);
    if (subTab !== "home") setSubTab("home");
    addRecentSearch(term);
    setRecentSearches(getRecentSearches());
    fetchSpotifyMusic(term, "all", 50);
  };

  const handleResetToNewSearch = () => {
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setSearchQuery("");
    setHasSearched(false);
    if (chatInputRef.current) {
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  };

  const handleSelectRecentSearch = (term: string) => {
    handleQuickSearch(term);
  };

  // ─── Artist Profile & Album Navigation Handlers ─────────────────────────────
  const openArtistProfile = useCallback(async (artistIdOrName: string) => {
    if (!artistIdOrName) return;
    setShowLyrics(false);
    setSelectedAlbum(null);
    setIsLoadingArtist(true);
    setArtistError(null);
    setDiscographyFilter("all");
    if (subTab !== "home") setSubTab("home");

    try {
      let rawId = artistIdOrName;
      if (rawId.startsWith("spotify:artist:")) {
        rawId = rawId.replace("spotify:artist:", "");
      }
      try {
        rawId = decodeURIComponent(rawId);
      } catch {}

      const isSpotifyId = /^[0-9A-Za-z]{22}$/.test(rawId);
      const queryParam = isSpotifyId
        ? `id=${encodeURIComponent(rawId)}`
        : `name=${encodeURIComponent(rawId)}`;

      const res = await fetch(`/api/music/artist?${queryParam}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedArtist(json.data);
      } else {
        setArtistError(json.error || "Gagal memuat profil artis.");
      }
    } catch (err: any) {
      setArtistError(err?.message || "Gagal memuat profil artis.");
    } finally {
      setIsLoadingArtist(false);
    }
  }, [subTab]);

  const openAlbumDetail = useCallback(async (albumIdOrUri: string) => {
    if (!albumIdOrUri) return;
    setShowLyrics(false);
    setIsLoadingAlbum(true);
    setAlbumError(null);
    if (subTab !== "home") setSubTab("home");

    try {
      let rawId = albumIdOrUri;
      if (rawId.startsWith("spotify:album:")) {
        rawId = rawId.replace("spotify:album:", "");
      }
      try {
        rawId = decodeURIComponent(rawId);
      } catch {}

      const res = await fetch(`/api/music/album?id=${encodeURIComponent(rawId)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedAlbum(json.data);
      } else {
        setAlbumError(json.error || "Gagal memuat album.");
      }
    } catch (err: any) {
      setAlbumError(err?.message || "Gagal memuat album.");
    } finally {
      setIsLoadingAlbum(false);
    }
  }, [subTab]);

  const closeArtistProfile = useCallback(() => {
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setArtistError(null);
    setDiscographyFilter("all");
  }, []);

  const closeAlbumDetail = useCallback(() => {
    setSelectedAlbum(null);
    setAlbumError(null);
  }, []);

  // ─── Audio Playback Logic (100% Full Song Streaming) ───────────────────────
  const playTrack = useCallback(async (track: MusicItem, options?: { startSeconds?: number; autoPlay?: boolean; forceLocal?: boolean }) => {
    const mc = musicConnectRef.current;
    if (!options?.forceLocal && mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(
        mc.remoteActiveSession.session_instance_id,
        "PLAY_TRACK",
        {
          track,
          positionSeconds: options?.startSeconds || 0,
          autoPlay: options?.autoPlay !== false,
        }
      );
      showQueueToast(
        `Memutar "${track.title}" di ${mc.remoteActiveSession.device_name}`
      );
      return;
    }

    const startSec = Math.max(0, options?.startSeconds || 0);
    const shouldAutoPlay = options?.autoPlay !== false;
    setCurrentTrack(track);
    setIsPlaying(shouldAutoPlay);
    userRequestedPauseRef.current = !shouldAutoPlay;
    setCurrentTime(startSec);
    loadedTrackIdRef.current = track.id;

    // Reset clock snapshot and lyric index immediately to prevent stale interpolation
    playbackClockRef.current = {
      positionSeconds: startSec,
      snapshotPerfTime: performance.now(),
      isPlaying: shouldAutoPlay,
      duration: track.durationMs ? track.durationMs / 1000 : 0,
      trackId: track.id,
    };
    activeLyricIndexRef.current = -1;
    setActiveLyricIndex(-1);

    // Keep mobile background audio alive by acquiring HTML5 audio session lock
    if (shouldAutoPlay && audioRef.current) {
      try {
        if (!audioRef.current.src || !audioRef.current.src.startsWith("data:audio")) {
          audioRef.current.src = SILENT_AUDIO_URI;
          audioRef.current.loop = true;
        }
        audioRef.current.play().catch(() => {});
      } catch {}
    }

    // Update queue index if track is already in queue, but never auto-add unqueued tracks to queue
    setQueue((prevQueue) => {
      const existingIdx = prevQueue.findIndex((item) => item.id === track.id);
      const newIdx = existingIdx !== -1 ? existingIdx : -1;
      setQueueIndex(newIdx);
      saveQueueState({ items: prevQueue, currentIndex: newIdx, updatedAt: new Date().toISOString() });
      return prevQueue;
    });

    if (track.durationMs && track.durationMs > 0) {
      setDuration(track.durationMs / 1000);
    }

    let videoId = track.youtubeVideoId;

    if (!videoId) {
      setIsResolvingAudio(true);
      try {
        const artist = track.artistNames.length > 0 ? track.artistNames.join(" ") : "";
        const res = await fetch(
          `/api/music/play?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(artist)}&id=${encodeURIComponent(track.id)}`
        );
        const data = await res.json();
        if (data.success && data.videoId) {
          videoId = data.videoId;
          track.youtubeVideoId = videoId;
          // Persist the resolved videoId to the queue
          setQueue((prevQueue) => {
            const updated = prevQueue.map((item) =>
              item.id === track.id ? { ...item, youtubeVideoId: videoId } : item
            );
            saveQueueState({ items: updated, currentIndex: queueIndexRef.current, updatedAt: new Date().toISOString() });
            return updated;
          });
        }
      } catch (err) {
        console.warn("Failed to resolve audio for track:", err);
      } finally {
        setIsResolvingAudio(false);
      }
    }

    if (!videoId) {
      console.warn("Could not resolve videoId for track:", track.title);
      return;
    }

    const targetVideoId = videoId;
    setCurrentVideoId(targetVideoId);

    if (ytPlayerRef.current && isYtReadyRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
      try {
        if (shouldAutoPlay) {
          ytPlayerRef.current.loadVideoById({
            videoId: targetVideoId,
            startSeconds: startSec,
          });
          ytPlayerRef.current.playVideo();
        } else if (typeof ytPlayerRef.current.cueVideoById === "function") {
          ytPlayerRef.current.cueVideoById({
            videoId: targetVideoId,
            startSeconds: startSec,
          });
        }
      } catch (err) {
        console.warn("ytPlayer loadVideoById error:", err);
      }
    } else {
      pendingVideoIdRef.current = targetVideoId;
      pendingVideoOptionsRef.current = {
        startSeconds: startSec,
        autoPlay: shouldAutoPlay,
      };
    }
  }, []);

  const playAllTracks = (items: MusicItem[]) => {
    if (!items || items.length === 0) return;
    setQueue(items);
    setQueueIndex(0);
    saveQueueState({ items, currentIndex: 0, updatedAt: new Date().toISOString() });
    playTrack(items[0]);
  };

  const addToQueue = (track: MusicItem) => {
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(
        mc.remoteActiveSession.session_instance_id,
        "ADD_TO_QUEUE",
        { track }
      );
      showQueueToast(
        `"${track.title}" ditambahkan ke antrean ${mc.remoteActiveSession.device_name}`
      );
      // Keep local queue state synced so Device B's queue view reflects the addition
      setQueue((prevQueue) => {
        const exists = prevQueue.some((item) => item.id === track.id);
        if (exists) return prevQueue;
        const updated = [...prevQueue, track];
        saveQueueState({ items: updated, currentIndex: queueIndex, updatedAt: new Date().toISOString() });
        return updated;
      });
      return;
    }

    if (!currentTrack) {
      playTrack(track);
      setQueue([track]);
      setQueueIndex(0);
      saveQueueState({ items: [track], currentIndex: 0, updatedAt: new Date().toISOString() });
      showQueueToast(`Memutar "${track.title}" & memulai antrean`);
      return;
    }
    setQueue((prevQueue) => {
      const exists = prevQueue.some((item) => item.id === track.id);
      if (exists) {
        showQueueToast(`"${track.title}" sudah ada di antrean`);
        return prevQueue;
      }
      const updated = [...prevQueue, track];
      saveQueueState({ items: updated, currentIndex: queueIndex, updatedAt: new Date().toISOString() });
      showQueueToast(`"${track.title}" ditambahkan ke antrean`);
      return updated;
    });
  };

  const togglePlayPause = () => {
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(
        mc.remoteActiveSession.session_instance_id,
        mc.remoteActiveSession.is_playing ? "PAUSE" : "PLAY"
      );
      return;
    }

    if (!currentTrack) {
      if (queue.length > 0) {
        playTrack(queue[0]);
      }
      return;
    }

    // If the displayed track hasn't been loaded into the YouTube engine yet
    // (e.g. restored from saved queue when opening the tab), load and play it directly!
    if (loadedTrackIdRef.current !== currentTrack.id) {
      playTrack(currentTrack);
      return;
    }

    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
      try {
        if (isPlaying) {
          userRequestedPauseRef.current = true;
          ytPlayerRef.current.pauseVideo();
          if (audioRef.current) {
            try { audioRef.current.pause(); } catch {}
          }
          setIsPlaying(false);
        } else {
          userRequestedPauseRef.current = false;
          ytPlayerRef.current.playVideo();
          if (audioRef.current) {
            try {
              if (!audioRef.current.src || !audioRef.current.src.startsWith("data:audio")) {
                audioRef.current.src = SILENT_AUDIO_URI;
                audioRef.current.loop = true;
              }
              audioRef.current.play().catch(() => {});
            } catch {}
          }
          setIsPlaying(true);
        }
        return;
      } catch (err) {
        console.warn("togglePlay error:", err);
      }
    }

    playTrack(currentTrack);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    playbackClockRef.current = {
      positionSeconds: newTime,
      snapshotPerfTime: performance.now(),
      isPlaying: isPlayingRef.current,
      duration: playbackClockRef.current.duration,
      trackId: currentTrack?.id || "",
    };
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(
        mc.remoteActiveSession.session_instance_id,
        "SEEK",
        { positionSeconds: newTime, positionMs: Math.round(newTime * 1000) }
      );
      return;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      try {
        ytPlayerRef.current.seekTo(newTime, true);
      } catch {}
    }
  };

  // Continuous Pointer Dragging Logic for Scrubber with Zero Latency & Visible Circle Handle
  const calcScrubTime = useCallback(
    (clientX: number, rect: DOMRect) => {
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetTime = pct * Math.max(duration, 1);
      return { pct, targetTime };
    },
    [duration]
  );

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { targetTime } = calcScrubTime(e.clientX, rect);
    isScrubbingRef.current = true;
    scrubTimeRef.current = targetTime;
    setIsScrubbing(true);
    setScrubTime(targetTime);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleScrubberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { targetTime } = calcScrubTime(e.clientX, rect);
    scrubTimeRef.current = targetTime;
    setScrubTime(targetTime);
  };

  const handleScrubberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const finalTime = scrubTimeRef.current ?? currentTime;
    isScrubbingRef.current = false;
    scrubTimeRef.current = null;
    setIsScrubbing(false);
    setScrubTime(null);
    handleSeek(finalTime);
  };

  const handleScrubberPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isScrubbingRef.current = false;
    scrubTimeRef.current = null;
    setIsScrubbing(false);
    setScrubTime(null);
  };

  // Smooth Mobile Full-Screen Player Dismissal (Animated Slide Down)
  const closeMobilePlayerAnimated = useCallback(() => {
    if (isClosingMobilePlayerRef.current) return;
    const el = mobilePlayerRef.current;
    if (!el) {
      setShowMobilePlayer(false);
      return;
    }
    isClosingMobilePlayerRef.current = true;
    const animDuration = 240;
    el.style.transition = `transform ${animDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${animDuration}ms ease`;
    el.style.transform = "translateY(100%)";
    el.style.opacity = "0";
    setTimeout(() => {
      setShowMobilePlayer(false);
      isClosingMobilePlayerRef.current = false;
      if (el) {
        el.style.transition = "";
        el.style.transform = "";
        el.style.opacity = "";
      }
    }, animDuration);
  }, []);

  // Lock body scroll and overscroll when mobile full player is open to prevent background web scrolling
  useEffect(() => {
    if (!showMobilePlayer) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    const prevOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, [showMobilePlayer]);

  // Native non-passive touch controller: prevents mobile Safari/Chrome rubber-banding & background web scrolling
  useEffect(() => {
    if (!showMobilePlayer) return;
    const el = mobilePlayerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        isTrackingTouchRef.current = false;
        return;
      }

      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-scrubber='true'], input, textarea")) {
        isTrackingTouchRef.current = false;
        return;
      }

      if (mobilePlayerMode === "lyrics" && mobileLyricsContainerRef.current) {
        if (mobileLyricsContainerRef.current.scrollTop > 5) {
          isTrackingTouchRef.current = false;
          return;
        }
      }

      if (mobilePlayerMode === "queue" && mobileQueueContainerRef.current) {
        if (mobileQueueContainerRef.current.scrollTop > 5) {
          isTrackingTouchRef.current = false;
          return;
        }
      }

      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
      touchStartTimeRef.current = Date.now();
      isTrackingTouchRef.current = true;
      isDraggingDownRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTrackingTouchRef.current) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartYRef.current;
      const deltaX = Math.abs(touch.clientX - touchStartXRef.current);

      if (!isDraggingDownRef.current) {
        if (deltaY < 0 || deltaX > deltaY) {
          isTrackingTouchRef.current = false;
          return;
        }
        if (deltaY > 6) {
          isDraggingDownRef.current = true;
        }
      }

      if (isDraggingDownRef.current) {
        // Crucial: non-passive preventDefault stops background browser scrolling & rubber-band bounce
        if (e.cancelable) {
          e.preventDefault();
        }

        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = requestAnimationFrame(() => {
          if (!el) return;
          el.style.transition = "none";
          el.style.transform = `translateY(${Math.max(0, deltaY)}px)`;
          const windowH = typeof window !== "undefined" ? window.innerHeight : 800;
          const opacity = Math.max(0.4, 1 - deltaY / (windowH * 0.85));
          el.style.opacity = String(opacity);
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTrackingTouchRef.current || !isDraggingDownRef.current) {
        isTrackingTouchRef.current = false;
        isDraggingDownRef.current = false;
        return;
      }
      isTrackingTouchRef.current = false;
      isDraggingDownRef.current = false;

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }

      const touch = e.changedTouches[0];
      const deltaY = touch.clientY - touchStartYRef.current;
      const durationMs = Math.max(1, Date.now() - touchStartTimeRef.current);
      const velocityY = deltaY / durationMs;

      if (deltaY > 100 || velocityY > 0.3) {
        closeMobilePlayerAnimated();
      } else {
        const animDuration = 220;
        el.style.transition = `transform ${animDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${animDuration}ms ease`;
        el.style.transform = "translateY(0px)";
        el.style.opacity = "1";
        setTimeout(() => {
          if (el) {
            el.style.transition = "";
            el.style.transform = "";
            el.style.opacity = "";
          }
        }, animDuration + 20);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [showMobilePlayer, mobilePlayerMode, closeMobilePlayerAnimated]);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(
        mc.remoteActiveSession.session_instance_id,
        "SET_VOLUME",
        { volumePercent: Math.round(val * 100) }
      );
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      try {
        ytPlayerRef.current.setVolume(val * 100);
        if (val === 0) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      } catch {}
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(
        mc.remoteActiveSession.session_instance_id,
        "SET_VOLUME",
        { volumePercent: nextMuted ? 0 : Math.round((volume || 0.8) * 100) }
      );
    }
    if (ytPlayerRef.current) {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume((volume || 0.8) * 100);
        }
      } catch {}
    }
  };

  const toggleShuffle = () => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(mc.remoteActiveSession.session_instance_id, "SHUFFLE", {
        shuffle: nextShuffle,
      });
    }
  };

  const toggleRepeat = () => {
    const nextMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    setRepeatMode(nextMode);
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(mc.remoteActiveSession.session_instance_id, "REPEAT", {
        repeatMode: nextMode,
      });
    }
  };

  const playNext = (): MusicItem | null => {
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(mc.remoteActiveSession.session_instance_id, "NEXT");
      return null;
    }
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;
    if (currentQueue.length === 0) return null;

    let nextIdx = 0;
    if (isShuffleRef.current) {
      nextIdx = Math.floor(Math.random() * currentQueue.length);
    } else if (currentIndex < 0) {
      nextIdx = 0;
    } else {
      nextIdx = currentIndex + 1;
      if (nextIdx >= currentQueue.length) {
        if (repeatModeRef.current === "all") {
          nextIdx = 0;
        } else {
          return null;
        }
      }
    }
    setQueueIndex(nextIdx);
    const nextTrack = currentQueue[nextIdx];
    if (nextTrack) playTrack(nextTrack);
    return nextTrack || null;
  };

  const playPrevious = (): MusicItem | null => {
    const mc = musicConnectRef.current;
    if (mc?.enabled && mc?.remoteActiveSession) {
      mc.sendAppCommand(mc.remoteActiveSession.session_instance_id, "PREVIOUS");
      return null;
    }
    if (currentTime > 3) {
      handleSeek(0);
      return currentTrack;
    }
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;
    if (currentQueue.length === 0) return null;

    let prevIdx = 0;
    if (currentIndex <= 0) {
      prevIdx = currentQueue.length - 1;
    } else {
      prevIdx = currentIndex - 1;
    }
    setQueueIndex(prevIdx);
    const prevTrack = currentQueue[prevIdx];
    if (prevTrack) playTrack(prevTrack);
    return prevTrack || null;
  };

  const handleTrackEnded = () => {
    if (repeatModeRef.current === "one") {
      handleSeek(0);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
        ytPlayerRef.current.playVideo();
      }
      return;
    }
    playNext();
  };

  // ─── Music Connect (Multi-Device Playback Awareness & Remote Control) ───────
  const musicConnect = useMusicConnect({
    currentTrack,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    onRemotePlay: async () => {
      userRequestedPauseRef.current = false;
      const trackToPlay = currentTrack || queueRef.current[0] || null;
      if (!trackToPlay) return false;
      if (!currentTrack || loadedTrackIdRef.current !== trackToPlay.id) {
        await playTrack(trackToPlay, { autoPlay: true, forceLocal: true });
      } else if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
        try {
          ytPlayerRef.current.playVideo();
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          setIsPlaying(true);
        } catch {
          await playTrack(trackToPlay, { autoPlay: true, forceLocal: true });
        }
      } else {
        await playTrack(trackToPlay, { autoPlay: true, forceLocal: true });
      }
      return true;
    },
    onRemotePause: () => {
      userRequestedPauseRef.current = true;
      playbackClockRef.current.isPlaying = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
      setIsPlaying(false);
    },
    onRemoteTogglePlay: () => {
      togglePlayPause();
    },
    onRemoteNext: () => playNext(),
    onRemotePrevious: () => playPrevious(),
    onRemoteSeek: (seconds: number) => {
      handleSeek(seconds);
    },
    onRemoteVolume: (vol0to1: number) => {
      handleVolumeChange(vol0to1);
    },
    onRemoteShuffle: (nextShuffle: boolean) => {
      setIsShuffle(nextShuffle);
    },
    onRemoteRepeat: (nextMode: "off" | "all" | "one") => {
      setRepeatMode(nextMode);
    },
    onRemoteTransferHere: async ({ track, queue: incomingQueue, positionSeconds, autoPlay }) => {
      const targetTrack = track || currentTrack || incomingQueue?.[0] || queueRef.current[0] || null;
      if (Array.isArray(incomingQueue) && incomingQueue.length > 0) {
        setQueue(incomingQueue);
        const idx = targetTrack
          ? incomingQueue.findIndex((item) => item.id === targetTrack.id)
          : 0;
        const validIdx = idx >= 0 ? idx : 0;
        setQueueIndex(validIdx);
        saveQueueState({
          items: incomingQueue,
          currentIndex: validIdx,
          updatedAt: new Date().toISOString(),
        });
      }
      if (!targetTrack) return false;
      await playTrack(targetTrack, { startSeconds: positionSeconds, autoPlay, forceLocal: true });
      return true;
    },
    onRemoteAddToQueue: (track: MusicItem) => {
      setQueue((prevQueue) => {
        const exists = prevQueue.some((item) => item.id === track.id);
        if (exists) return prevQueue;
        const updated = [...prevQueue, track];
        saveQueueState({
          items: updated,
          currentIndex: queueIndexRef.current,
          updatedAt: new Date().toISOString(),
        });
        showQueueToast(`"${track.title}" ditambahkan ke antrean`);
        return updated;
      });
    },
    onRemotePlayTrack: async (track: MusicItem, incomingQueue?: MusicItem[]) => {
      if (Array.isArray(incomingQueue) && incomingQueue.length > 0) {
        setQueue(incomingQueue);
        const idx = incomingQueue.findIndex((item) => item.id === track.id);
        const validIdx = idx >= 0 ? idx : 0;
        setQueueIndex(validIdx);
        saveQueueState({
          items: incomingQueue,
          currentIndex: validIdx,
          updatedAt: new Date().toISOString(),
        });
      }
      await playTrack(track, { autoPlay: true, forceLocal: true });
      return true;
    },
  });
  musicConnectRef.current = musicConnect;

  // ─── Mobile Background Playback & MediaSession Integration ────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artistNames.join(", "),
          album: currentTrack.albumTitle || "Music One",
          artwork: currentTrack.artworkUrl
            ? [
                { src: currentTrack.artworkUrl, sizes: "96x96", type: "image/jpeg" },
                { src: currentTrack.artworkUrl, sizes: "128x128", type: "image/jpeg" },
                { src: currentTrack.artworkUrl, sizes: "192x192", type: "image/jpeg" },
                { src: currentTrack.artworkUrl, sizes: "256x256", type: "image/jpeg" },
                { src: currentTrack.artworkUrl, sizes: "512x512", type: "image/jpeg" },
              ]
            : [],
        });
      } catch (err) {
        console.warn("MediaMetadata error:", err);
      }
    }

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    const handlePlay = () => {
      userRequestedPauseRef.current = false;
      if (currentTrack && loadedTrackIdRef.current !== currentTrack.id) {
        playTrack(currentTrack);
        return;
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
        ytPlayerRef.current.playVideo();
      }
      if (audioRef.current) {
        try {
          if (!audioRef.current.src || !audioRef.current.src.startsWith("data:audio")) {
            audioRef.current.src = SILENT_AUDIO_URI;
            audioRef.current.loop = true;
          }
          audioRef.current.play().catch(() => {});
        } catch {}
      }
      setIsPlaying(true);
    };

    const handlePause = () => {
      userRequestedPauseRef.current = true;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
        ytPlayerRef.current.pauseVideo();
      }
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
      }
      setIsPlaying(false);
    };

    const handlePrev = () => {
      playPrevious();
    };

    const handleNext = () => {
      playNext();
    };

    const handleSeekTo = (details: any) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        handleSeek(details.seekTime);
      }
    };

    try {
      navigator.mediaSession.setActionHandler("play", handlePlay);
      navigator.mediaSession.setActionHandler("pause", handlePause);
      navigator.mediaSession.setActionHandler("previoustrack", handlePrev);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);
      navigator.mediaSession.setActionHandler("seekto", handleSeekTo);
    } catch (err) {
      console.warn("MediaSession action handler error:", err);
    }

    return () => {
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", null);
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("previoustrack", null);
          navigator.mediaSession.setActionHandler("nexttrack", null);
          navigator.mediaSession.setActionHandler("seekto", null);
        } catch {}
      }
    };
  }, [currentTrack, isPlaying]);

  // Synchronize playback position with OS lockscreen scrubber
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "mediaSession" in navigator &&
      "setPositionState" in navigator.mediaSession &&
      duration > 0 &&
      currentTime >= 0 &&
      currentTime <= duration
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, 1),
          playbackRate: 1,
          position: Math.min(currentTime, duration),
        });
      } catch {}
    }
  }, [currentTime, duration]);

  // ─── Synchronized Lyrics Fetcher & Manager ────────────────────────────────
  const fetchLyricsForTrack = useCallback(async (track: MusicItem) => {
    if (!track) return;
    const title = track.title || "";
    const artist = track.artistNames && track.artistNames.length > 0 ? track.artistNames[0] : "";
    const album = track.albumTitle || "";
    const durationSec = track.durationMs ? Math.round(track.durationMs / 1000) : undefined;

    // Abort previous in-flight request if track changed rapidly
    if (fetchLyricsAbortControllerRef.current) {
      fetchLyricsAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    fetchLyricsAbortControllerRef.current = controller;
    const requestId = ++fetchLyricsRequestIdRef.current;

    // Check client-side localStorage cache first (< 5ms response)
    const cached = getClientLyricsCache(title, artist);
    if (cached) {
      setLyricsData(cached);
      setIsLoadingLyrics(false);
      setLyricsError(null);
      return;
    }

    setIsLoadingLyrics(true);
    setLyricsError(null);
    try {
      const params = new URLSearchParams({
        title,
        artist,
        ...(album ? { album } : {}),
        ...(durationSec ? { duration: String(durationSec) } : {}),
      });

      const res = await fetch(`/api/music/lyrics?${params.toString()}`, {
        signal: controller.signal,
      });

      // Ignore response if a newer track request was already initiated
      if (requestId !== fetchLyricsRequestIdRef.current) return;

      if (res.status === 429) {
        setLyricsError("Batas permintaan lirik tercapai. Coba lagi dalam beberapa saat.");
        setLyricsData(null);
        return;
      }

      const json = await res.json();
      if (requestId !== fetchLyricsRequestIdRef.current) return;

      if (json.success && json.data) {
        setLyricsData(json.data);
        setClientLyricsCache(title, artist, json.data);
      } else if (json.notFound) {
        setLyricsData(null);
        setLyricsError("Lirik tidak ditemukan di LRCLIB untuk lagu ini.");
      } else {
        setLyricsData(null);
        setLyricsError(json.error || "Gagal memuat lirik.");
      }
    } catch (err: any) {
      if (err.name === "AbortError" || requestId !== fetchLyricsRequestIdRef.current) {
        return;
      }
      setLyricsData(null);
      setLyricsError(err?.message || "Koneksi ke server lirik terputus.");
    } finally {
      if (requestId === fetchLyricsRequestIdRef.current) {
        setIsLoadingLyrics(false);
      }
    }
  }, []);

  // Fetch lyrics whenever currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      fetchLyricsForTrack(currentTrack);
    }
  }, [currentTrack?.id, fetchLyricsForTrack]);

  // Monotonic Clock Interpolation: calculates frame-accurate playback position
  // positionMs + (performance.now() - snapshotPerfTime)
  const getInterpolatedPlaybackTime = useCallback((): number => {
    const clock = playbackClockRef.current;
    if (!clock.isPlaying) {
      return clock.positionSeconds;
    }
    const elapsedSec = (performance.now() - clock.snapshotPerfTime) / 1000;
    // Limit extrapolation to maximum 2 seconds without snapshot refresh
    const clampedElapsed = Math.min(Math.max(0, elapsedSec), 2.0);
    const estimated = clock.positionSeconds + clampedElapsed;
    return clock.duration > 0 ? Math.min(estimated, clock.duration) : estimated;
  }, []);

  // High-performance requestAnimationFrame loop for real-time lyric highlighting
  // Frame-accurate (60/120Hz) without causing full React re-renders on every frame.
  // React state is ONLY dispatched when active line index actually transitions.
  useEffect(() => {
    const isLyricsActive = showLyrics || (showMobilePlayer && mobilePlayerMode === "lyrics");
    if (!isLyricsActive || !isPlaying || !lyricsData || !lyricsData.synced || !lyricsData.lines || lyricsData.lines.length === 0) {
      return;
    }

    let animationFrameId: number;

    const loop = () => {
      const curTime = getInterpolatedPlaybackTime();
      // findActiveLyricIndex uses binary search O(log n), 0 offset by default
      const newIdx = findActiveLyricIndex(lyricsData.lines, curTime, 0);

      // Crucial performance optimization: ONLY dispatch state update when active line index actually changes
      if (newIdx !== activeLyricIndexRef.current) {
        if (process.env.NODE_ENV !== "production") {
          const activeLine = lyricsData.lines[newIdx];
          console.debug(
            `[LyricsSync] Active line changed -> #${newIdx} @ ${curTime.toFixed(3)}s (target: ${activeLine?.time.toFixed(2)}s | "${activeLine?.text}")`
          );
        }
        activeLyricIndexRef.current = newIdx;
        setActiveLyricIndex(newIdx);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showLyrics, showMobilePlayer, mobilePlayerMode, isPlaying, lyricsData, getInterpolatedPlaybackTime]);

  // Container-only auto-scroll to active lyric line (respects prefers-reduced-motion)
  useEffect(() => {
    const isLyricsActive = showLyrics || (showMobilePlayer && mobilePlayerMode === "lyrics");
    if (isLyricsActive && !isUserScrolling && activeLyricIndex >= 0) {
      const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Scroll desktop lyrics container
      if (lyricsContainerRef.current && activeLineRef.current) {
        const container = lyricsContainerRef.current;
        const activeEl = activeLineRef.current;
        const targetScrollTop = activeEl.offsetTop - container.clientHeight * 0.38 + activeEl.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: prefersReduced ? "auto" : "smooth",
        });
      }

      // Scroll mobile lyrics container
      if (mobileLyricsContainerRef.current && mobileActiveLineRef.current) {
        const container = mobileLyricsContainerRef.current;
        const activeEl = mobileActiveLineRef.current;
        const targetScrollTop = activeEl.offsetTop - container.clientHeight * 0.38 + activeEl.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: prefersReduced ? "auto" : "smooth",
        });
      }
    }
  }, [activeLyricIndex, showLyrics, showMobilePlayer, mobilePlayerMode, isUserScrolling]);

  // Handle manual scroll in lyrics container
  const handleLyricsScroll = () => {
    setIsUserScrolling(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    // Auto-resume after 2.5 seconds of idle scrolling (user stopped scrolling)
    userScrollTimeoutRef.current = setTimeout(() => {
      resumeAutoScroll();
    }, 2500);
  };

  const resumeAutoScroll = () => {
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    setIsUserScrolling(false);
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (lyricsContainerRef.current && activeLineRef.current) {
      const container = lyricsContainerRef.current;
      const activeEl = activeLineRef.current;
      const targetScrollTop = activeEl.offsetTop - container.clientHeight * 0.38 + activeEl.clientHeight / 2;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }

    if (mobileLyricsContainerRef.current && mobileActiveLineRef.current) {
      const container = mobileLyricsContainerRef.current;
      const activeEl = mobileActiveLineRef.current;
      const targetScrollTop = activeEl.offsetTop - container.clientHeight * 0.38 + activeEl.clientHeight / 2;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }
  };

  const seekToLyric = (timeSeconds: number) => {
    handleSeek(timeSeconds);
    resumeAutoScroll();
  };

  // ─── Like / Playlist Actions ────────────────────────────────────────────────
  const isTrackLiked = (trackId: string) => likedSongs.some((t) => t.id === trackId);

  const toggleLike = (track: MusicItem) => {
    let updated: MusicItem[];
    if (isTrackLiked(track.id)) {
      updated = likedSongs.filter((t) => t.id !== track.id);
    } else {
      updated = [track, ...likedSongs];
    }
    setLikedSongs(updated);
    saveLikedSongs(updated);
    syncLibraryToCloud(updated, localPlaylists);
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl: LocalPlaylist = {
      id: generatePlaylistId(),
      name: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || undefined,
      items: addToPlaylistTrack ? [addToPlaylistTrack] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newPl, ...localPlaylists];
    setLocalPlaylists(updated);
    saveLocalPlaylists(updated);
    syncLibraryToCloud(likedSongs, updated);

    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setAddToPlaylistTrack(null);
    setShowCreatePlaylistModal(false);
  };

  const addTrackToPlaylist = (playlistId: string, track: MusicItem) => {
    const updated = localPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        const exists = pl.items.some((item) => item.id === track.id);
        if (exists) return pl;
        const updatedPl = {
          ...pl,
          items: [...pl.items, track],
          updatedAt: new Date().toISOString(),
        };
        if (selectedLocalPlaylist?.id === playlistId) {
          setSelectedLocalPlaylist(updatedPl);
        }
        return updatedPl;
      }
      return pl;
    });
    setLocalPlaylists(updated);
    saveLocalPlaylists(updated);
    syncLibraryToCloud(likedSongs, updated);
    setAddToPlaylistTrack(null);
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    const updated = localPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        const nextItems = pl.items.filter((item) => item.id !== trackId);
        const updatedPl = { ...pl, items: nextItems, updatedAt: new Date().toISOString() };
        if (selectedLocalPlaylist?.id === playlistId) {
          setSelectedLocalPlaylist(updatedPl);
        }
        return updatedPl;
      }
      return pl;
    });
    setLocalPlaylists(updated);
    saveLocalPlaylists(updated);
    syncLibraryToCloud(likedSongs, updated);
  };

  const deletePlaylist = (playlistId: string) => {
    if (!confirm("Hapus playlist ini?")) return;
    const updated = localPlaylists.filter((pl) => pl.id !== playlistId);
    setLocalPlaylists(updated);
    saveLocalPlaylists(updated);
    syncLibraryToCloud(likedSongs, updated);
    if (selectedLocalPlaylist?.id === playlistId) {
      setSelectedLocalPlaylist(null);
    }
  };

  // ─── Render Centered or Sticky Search Chat Box (Styled like Tab Chat) ───────
  const renderSearchChatBox = () => (
    <div className="prompt-bar-glow relative w-full rounded-[24px] sm:rounded-[28px] p-[1.5px] shadow-2xl transition-all">
      <div
        className={`w-full rounded-[22px] sm:rounded-[26px] border transition-all relative ${
          isDark
            ? "bg-[#1c1c1f] border-zinc-800/80 shadow-black/80"
            : "bg-white border-zinc-200/80 shadow-zinc-200/80"
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              handleExecuteSearch(searchQuery.trim());
            }
          }}
          className="p-1.5 sm:p-2.5 flex items-center gap-2"
        >
          {/* Music Search Icon */}
          <div className="pl-2.5 sm:pl-3 text-zinc-400 shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Input Field (Persistent DOM node with stable key & ref to prevent focus loss) */}
          <input
            ref={chatInputRef}
            key="music-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val.trim()) {
                setSelectedArtist(null);
                setSelectedAlbum(null);
              } else {
                setHasSearched(false);
              }
            }}
            placeholder="Ketik lagu atau artis yang ingin kamu putar..."
            className={`flex-1 bg-transparent px-2 py-1.5 sm:py-2 text-sm sm:text-base outline-none leading-relaxed ${
              isDark ? "text-white placeholder-zinc-500" : "text-zinc-900 placeholder-zinc-400"
            }`}
            autoFocus
          />

          {/* Clear Input Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setHasSearched(false);
                if (chatInputRef.current) chatInputRef.current.focus();
              }}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white cursor-pointer transition shrink-0"
              title="Bersihkan teks"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Send / Search Button */}
          <button
            type="submit"
            disabled={!searchQuery.trim() || isSearching}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition cursor-pointer shadow-md shrink-0 ${
              searchQuery.trim() && !isSearching
                ? isDark
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "bg-black text-white hover:bg-zinc-800"
                : isDark
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
            title="Cari lagu"
          >
            {isSearching ? (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  // ─── Mobile-Optimized Reusable Track List (Theme Styled, Zero Emojis) ──────
  const renderTrackTable = (
    items: MusicItem[],
    options?: {
      emptyMessage?: string;
      showRemoveFromPlaylist?: boolean;
      onRemoveFromPlaylist?: (trackId: string) => void;
    }
  ) => {
    if (items.length === 0) {
      return (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-zinc-300">
            {options?.emptyMessage || "Belum ada lagu"}
          </h4>
        </div>
      );
    }

    return (
      <div className="space-y-1.5 w-full">
        {items.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isTrackPlaying = isCurrent && isPlaying;
          const isLiked = isTrackLiked(track.id);

          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => playTrack(track)}
              className={`flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl transition cursor-pointer group select-none ${
                activeMenuTrackId === track.id ? "relative z-30" : ""
              } ${
                isCurrent
                  ? isDark
                    ? "bg-zinc-800/90 border border-zinc-700/90 shadow-md"
                    : "bg-zinc-200/90 border border-zinc-300"
                  : isDark
                  ? "hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800"
                  : "hover:bg-zinc-100/80 border border-transparent"
              }`}
            >
              {/* Index / Play animation */}
              <div className="w-5 sm:w-6 shrink-0 flex items-center justify-center text-xs font-mono font-bold text-zinc-500">
                {isTrackPlaying ? (
                  <div className="flex items-end gap-0.5 h-3.5">
                    <span className="w-1 bg-white rounded-full animate-bounce h-3" />
                    <span className="w-1 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1 bg-white rounded-full animate-bounce h-3.5" style={{ animationDelay: "0.4s" }} />
                  </div>
                ) : (
                  <>
                    <span className="group-hover:hidden">{idx + 1}</span>
                    <span className="hidden group-hover:block text-zinc-300">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <polygon points="6 4, 18 12, 6 20" />
                      </svg>
                    </span>
                  </>
                )}
              </div>

              {/* Artwork */}
              <div className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-zinc-800 shadow-xs flex items-center justify-center text-zinc-500">
                <svg className="w-4 h-4 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                </svg>
                {track.artworkUrl && (
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="relative z-1 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0";
                    }}
                  />
                )}
              </div>

              {/* Title & Artist */}
              <div className="flex-1 min-w-0 pr-1">
                <h4
                  className={`text-xs sm:text-sm font-semibold truncate ${
                    isCurrent ? "text-white font-bold" : isDark ? "text-white" : "text-zinc-900"
                  }`}
                >
                  {track.title}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {track.artistNames.map((name, i) => (
                    <span key={`${name}-${i}`}>
                      {i > 0 && ", "}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          openArtistProfile(name);
                        }}
                        className="hover:underline hover:text-white transition cursor-pointer"
                        title={`Lihat profil ${name}`}
                      >
                        {name}
                      </span>
                    </span>
                  ))}
                </p>
              </div>

              {/* Album (hidden on mobile, visible on tablet/desktop) */}
              <div className="hidden md:block w-36 lg:w-56 text-xs text-zinc-400 truncate">
                {track.albumTitle || "—"}
              </div>

              {/* Duration */}
              <div className="text-xs text-zinc-400 font-mono shrink-0 hidden xs:block">
                {track.durationMs ? formatDurationMs(track.durationMs) : "3:30"}
              </div>

              {/* Single 3-Dots Action Button & Dropdown Menu */}
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)}
                  className={`p-2 rounded-xl transition cursor-pointer active:scale-90 ${
                    activeMenuTrackId === track.id
                      ? isDark
                        ? "bg-white/15 text-white"
                        : "bg-black/10 text-black"
                      : isDark
                      ? "text-zinc-500 hover:text-white hover:bg-white/10"
                      : "text-zinc-400 hover:text-black hover:bg-black/5"
                  }`}
                  title="Opsi lagu"
                  aria-label="Opsi lagu"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.75" />
                    <circle cx="12" cy="12" r="1.75" />
                    <circle cx="12" cy="19" r="1.75" />
                  </svg>
                </button>

                {activeMenuTrackId === track.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setActiveMenuTrackId(null)}
                    />
                    <div
                      className={`absolute right-0 top-full mt-1.5 w-48 sm:w-52 rounded-2xl border shadow-xl py-1.5 z-50 text-left animate-in fade-in-0 zoom-in-95 duration-150 backdrop-blur-md ${
                        isDark
                          ? "bg-[#18181b]/95 border-white/15 text-zinc-200 shadow-2xl shadow-black/80"
                          : "bg-white/95 border-black/10 text-zinc-800 shadow-xl shadow-black/10"
                      }`}
                    >
                      {/* 1. Suka / Hapus Disukai */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleLike(track);
                          setActiveMenuTrackId(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                          isDark
                            ? "hover:bg-white/10 text-zinc-300 hover:text-white"
                            : "hover:bg-black/5 text-zinc-700 hover:text-black"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 shrink-0 ${isLiked ? (isDark ? "fill-white text-white" : "fill-black text-black") : ""}`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          fill="none"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{isLiked ? "Hapus dari Disukai" : "Sukai Lagu"}</span>
                      </button>

                      {/* 2. Tambahkan ke Antrean */}
                      <button
                        type="button"
                        onClick={() => {
                          addToQueue(track);
                          setActiveMenuTrackId(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                          isDark
                            ? "hover:bg-white/10 text-zinc-300 hover:text-white"
                            : "hover:bg-black/5 text-zinc-700 hover:text-black"
                        }`}
                      >
                        {queue.some((q) => q.id === track.id) ? (
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h10M18 12v6m3-3h-6" />
                          </svg>
                        )}
                        <span>{queue.some((q) => q.id === track.id) ? "Sudah dalam Antrean" : "Tambahkan ke Antrean"}</span>
                      </button>

                      {/* 3. Playlist Action */}
                      {options?.showRemoveFromPlaylist && options.onRemoveFromPlaylist ? (
                        <button
                          type="button"
                          onClick={() => {
                            options.onRemoveFromPlaylist!(track.id);
                            setActiveMenuTrackId(null);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold transition cursor-pointer border-t ${
                            isDark
                              ? "border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white"
                              : "border-black/5 hover:bg-black/5 text-zinc-600 hover:text-black"
                          }`}
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Hapus dari Playlist</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAddToPlaylistTrack(track);
                            setActiveMenuTrackId(null);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                            isDark
                              ? "hover:bg-white/10 text-zinc-300 hover:text-white"
                              : "hover:bg-black/5 text-zinc-700 hover:text-black"
                          }`}
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Tambahkan ke Playlist</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Artist Profile View Renderer (Strict Monochrome Zinc / Web Theme) ─────
  const renderArtistProfileView = () => {
    if (!selectedArtist) return null;

    return (
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col space-y-6 pt-2 pb-10 animate-in fade-in-0 duration-200">
        {/* Navigation Bar inside Artist Profile */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/40">
          <button
            type="button"
            onClick={closeArtistProfile}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              isDark
                ? "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800"
                : "border-zinc-200 bg-white text-zinc-700 hover:text-black hover:bg-zinc-100"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali</span>
          </button>
        </div>

        {/* Artist Header / Hero Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 pt-1">
          {selectedArtist.imageUrl ? (
            <img
              src={selectedArtist.imageUrl}
              alt={selectedArtist.name}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl border-2 border-white/10 shrink-0"
            />
          ) : (
            <div
              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shrink-0 border-2 border-white/10 ${
                isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-500"
              }`}
            >
              <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}

          <div className="text-center sm:text-left min-w-0 flex-1 space-y-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
              Profil Musisi
            </span>
            <h1 className={`text-2xl sm:text-4xl font-black tracking-tight truncate ${isDark ? "text-white" : "text-zinc-900"}`}>
              {selectedArtist.name}
            </h1>

            {selectedArtist.genres && selectedArtist.genres.length > 0 && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
                {selectedArtist.genres.slice(0, 5).map((genre) => (
                  <span
                    key={genre}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border capitalize ${
                      isDark
                        ? "bg-zinc-800/80 border-zinc-700/60 text-zinc-300"
                        : "bg-zinc-100 border-zinc-300 text-zinc-700"
                    }`}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {selectedArtist.topTracks.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => playAllTracks(selectedArtist.topTracks)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-lg hover:scale-102 active:scale-98"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <polygon points="6 4, 18 12, 6 20" />
                  </svg>
                  <span>Putar Populer ({selectedArtist.topTracks.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section: Popular Tracks */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Lagu Populer
            </h2>
            <span className="text-xs text-zinc-500">
              {selectedArtist.topTracks.length} trek
            </span>
          </div>

          {renderTrackTable(selectedArtist.topTracks, {
            emptyMessage: "Belum ada lagu populer yang dapat ditampilkan.",
          })}
        </div>

        {/* Section: Albums & Singles (Diskografi Spotify-Style) */}
        <div className="space-y-4 pt-5 border-t border-zinc-800/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Diskografi
              </h2>
              <p className="text-xs text-zinc-500">
                {selectedArtist.albums.length} rilis album & single
              </p>
            </div>

            {/* Filter Pills: Semua | Album | Single & EP */}
            {selectedArtist.albums.length > 0 && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                {(
                  [
                    { id: "all", label: "Semua" },
                    { id: "album", label: "Album" },
                    { id: "single", label: "Single & EP" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDiscographyFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      discographyFilter === tab.id
                        ? isDark
                          ? "bg-white text-black shadow-sm"
                          : "bg-black text-white shadow-sm"
                        : isDark
                        ? "text-zinc-400 hover:text-white"
                        : "text-zinc-600 hover:text-black"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(() => {
            const filteredAlbums = selectedArtist.albums.filter((album) => {
              if (discographyFilter === "album") {
                return (album.albumTitle || "").toLowerCase().includes("album");
              }
              if (discographyFilter === "single") {
                return (album.albumTitle || "").toLowerCase().includes("single");
              }
              return true;
            });

            if (filteredAlbums.length === 0) {
              return (
                <div className="py-10 text-center text-xs text-zinc-500">
                  Tidak ada {discographyFilter === "album" ? "album" : "single"} yang ditemukan untuk artis ini.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5 pt-1">
                {filteredAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => openAlbumDetail(album.providerItemId)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer group flex flex-col relative select-none ${
                      isDark
                        ? "bg-zinc-900/50 hover:bg-zinc-800/80 border-zinc-800/60 hover:border-zinc-700"
                        : "bg-white hover:bg-zinc-50 border-zinc-200 shadow-xs"
                    }`}
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 bg-zinc-800 shadow-md">
                      {album.artworkUrl ? (
                        <img
                          src={album.artworkUrl}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                          </svg>
                        </div>
                      )}

                      {/* Spotify-style floating play button overlay */}
                      <div className="absolute right-2 bottom-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 shadow-xl">
                        <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105">
                          <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                            <polygon points="6 4, 18 12, 6 20" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <h4 className={`text-xs sm:text-sm font-semibold truncate group-hover:underline ${
                      isDark ? "text-white" : "text-zinc-900"
                    }`}>
                      {album.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {album.albumTitle || "Rilisan"}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ─── Album Detail View Renderer (Strict Monochrome Zinc / Web Theme) ───────
  const renderAlbumDetailView = () => {
    if (!selectedAlbum) return null;

    return (
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col space-y-6 pt-2 pb-10 animate-in fade-in-0 duration-200">
        {/* Navigation Bar inside Album View */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/40">
          <button
            type="button"
            onClick={closeAlbumDetail}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              isDark
                ? "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800"
                : "border-zinc-200 bg-white text-zinc-700 hover:text-black hover:bg-zinc-100"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{selectedArtist ? `Kembali ke ${selectedArtist.name}` : "Kembali"}</span>
          </button>
        </div>

        {/* Album Header / Hero Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 pt-1">
          {selectedAlbum.artworkUrl ? (
            <img
              src={selectedAlbum.artworkUrl}
              alt={selectedAlbum.title}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-2xl border border-white/10 shrink-0"
            />
          ) : (
            <div
              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 ${
                isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-500"
              }`}
            >
              <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
              </svg>
            </div>
          )}

          <div className="text-center sm:text-left min-w-0 flex-1 space-y-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
              Album
            </span>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight truncate ${isDark ? "text-white" : "text-zinc-900"}`}>
              {selectedAlbum.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400">
              {selectedAlbum.artistNames.map((artName, i) => (
                <span key={`${artName}-${i}`}>
                  {i > 0 && ", "}
                  <span
                    onClick={() => openArtistProfile(selectedAlbum.artistId || artName)}
                    className="hover:underline hover:text-white cursor-pointer font-semibold transition"
                    title={`Lihat profil ${artName}`}
                  >
                    {artName}
                  </span>
                </span>
              ))}
              {selectedAlbum.releaseDate && ` • ${selectedAlbum.releaseDate.slice(0, 4)}`}
              {selectedAlbum.totalTracks > 0 && ` • ${selectedAlbum.totalTracks} trek`}
            </p>

            {selectedAlbum.tracks.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => playAllTracks(selectedAlbum.tracks)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-lg hover:scale-102 active:scale-98"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <polygon points="6 4, 18 12, 6 20" />
                  </svg>
                  <span>Putar Album ({selectedAlbum.tracks.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section: Album Tracklist */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Daftar Lagu
            </h2>
            <span className="text-xs text-zinc-500">
              {selectedAlbum.tracks.length} trek
            </span>
          </div>

          {renderTrackTable(selectedAlbum.tracks, {
            emptyMessage: "Tidak ada trek di album ini.",
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-hidden select-none font-sans bg-transparent overscroll-none touch-pan-y ${
        isDark ? "text-zinc-100" : "text-zinc-900"
      }`}
    >
      {/* Hidden Audio Player for audio previews & mobile background keepalive */}
      <audio
        ref={audioRef}
        playsInline
        onTimeUpdate={() => {
          if (audioRef.current && audioRef.current.src && !audioRef.current.src.startsWith("data:audio")) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 30);
          }
        }}
        onEnded={() => {
          if (audioRef.current && audioRef.current.src && !audioRef.current.src.startsWith("data:audio")) {
            if (repeatMode === "one") {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            } else {
              playNext();
            }
          }
        }}
      />

      {/* Background YouTube Audio Container (Placed offscreen with non-zero dimensions to prevent mobile browser suspension) */}
      <div
        id="youtube-music-player-container"
        className="fixed -left-[9999px] top-0 w-[300px] h-[200px] pointer-events-none opacity-0 z-[-1] overflow-hidden"
        aria-hidden="true"
      >
        <div id="youtube-music-player" />
      </div>

      {/* ─── TOP WORKSPACE CONTAINER: MAIN LEFT COLUMN + DESKTOP QUEUE SIDEBAR ─ */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Column: Header + Main Content View (Width auto-adjusts when queue panel opens) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden min-w-0">
          {/* ─── TOP HEADER BAR (Clean, Transparent, Minimalist) ─── */}
          <header
            className="shrink-0 w-full z-20 flex items-center justify-between px-3.5 sm:px-8 py-2.5 sm:py-3.5 bg-transparent border-none transition"
          >
            {/* Left: Hamburger & Brand Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              {onTogglePanel && (
                <button
                  onClick={onTogglePanel}
                  title="Menu Panel"
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                    isDark
                      ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white"
                      : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black"
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}

              <span className="font-extrabold text-sm sm:text-base tracking-tight truncate">Music One</span>
            </div>

            {/* Right: Bespoke Liquid-Glass Playlist / Musik / Lyrics Toggle Icon Button */}
            <div className="flex items-center gap-2 shrink-0">
              {musicConnect.enabled && (
                <MusicConnectButton
                  isDark={isDark}
                  isOpen={musicConnect.showConnectModal}
                  onClick={() => musicConnect.setShowConnectModal((prev) => !prev)}
                  onlineOtherDevicesCount={musicConnect.onlineOtherDevicesCount}
                  remoteActiveDeviceName={musicConnect.remoteActiveSession?.device_name}
                  variant="header"
                />
              )}
              {showLyrics ? (
                <button
                  type="button"
                  onClick={() => setShowLyrics(false)}
                  title="Tutup Lirik"
                  aria-label="Tutup Lirik"
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                    isDark
                      ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                      : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
                  }`}
                >
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : selectedAlbum ? (
                <button
                  type="button"
                  onClick={closeAlbumDetail}
                  title="Kembali"
                  aria-label="Kembali"
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                    isDark
                      ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                      : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
                  }`}
                >
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : selectedArtist ? (
                <button
                  type="button"
                  onClick={closeArtistProfile}
                  title="Kembali"
                  aria-label="Kembali"
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                    isDark
                      ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                      : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
                  }`}
                >
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : subTab === "home" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSubTab("playlists");
                    setSelectedLocalPlaylist(null);
                    setIsViewingLiked(false);
                  }}
                  title="Playlist & Koleksi"
                  aria-label="Buka Playlist"
                  className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                    isDark
                      ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                      : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
                  }`}
                >
                  {/* Clean Double Musical Notes / Playlist Icon (Replacing old 3-lines icon) */}
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                  </svg>
                  {likedSongs.length > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs ${
                      isDark ? "bg-white text-black" : "bg-black text-white"
                    }`}>
                      {likedSongs.length}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSubTab("home");
                    setSelectedArtist(null);
                    setSelectedAlbum(null);
                  }}
                  title="Kembali ke Musik"
                  aria-label="Kembali ke Musik"
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                    isDark
                      ? "bg-white text-black hover:bg-zinc-200 shadow-white/10"
                      : "bg-black text-white hover:bg-zinc-800 shadow-black/10"
                  }`}
                >
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </button>
              )}
            </div>
          </header>

          {/* ─── MAIN FULL-WIDTH CONTENT AREA ─────────────────────────────────── */}
          <main
            className={`flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-contain bg-transparent ${
              searchQuery.trim() || subTab === "playlists" || selectedArtist || selectedAlbum || showLyrics
                ? "pb-8 sm:pb-10"
                : "pb-0"
            }`}
          >
        {showLyrics ? (
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col px-4 sm:px-8 py-3 sm:py-6 h-full min-h-0 relative animate-in fade-in-0 duration-200">
            {/* Top Bar inside Lyrics: Clean Track Meta */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-white/5 dark:border-white/5 shrink-0">
              {currentTrack?.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shrink-0 shadow-md"
                />
              ) : (
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shrink-0 flex items-center justify-center ${
                    isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm sm:text-base truncate">
                  {currentTrack?.title || "Tidak ada lagu yang dipilih"}
                </h3>
                <p className="text-xs text-zinc-400 truncate">
                  {currentTrack ? (
                    currentTrack.artistNames.map((name, i) => (
                      <span key={`${name}-${i}`}>
                        {i > 0 && ", "}
                        <span
                          onClick={() => {
                            setShowLyrics(false);
                            openArtistProfile(name);
                          }}
                          className="hover:underline hover:text-white transition cursor-pointer"
                          title={`Lihat profil ${name}`}
                        >
                          {name}
                        </span>
                      </span>
                    ))
                  ) : (
                    "Artis"
                  )}
                </p>
              </div>
            </div>

            {/* Lyrics Content Body (Spotify format: left-aligned with focal autoscroll) */}
            <div
              ref={lyricsContainerRef}
              onScroll={handleLyricsScroll}
              className="flex-1 overflow-y-auto min-h-0 py-24 sm:py-36 px-4 sm:px-12 space-y-3 sm:space-y-4 text-left scroll-smooth relative select-none"
            >
              {/* State 1: Loading */}
              {isLoadingLyrics && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
                  <div className="h-5 bg-zinc-700/30 dark:bg-zinc-700/30 rounded-full w-2/5" />
                  <div className="h-6 bg-zinc-700/40 dark:bg-zinc-700/40 rounded-full w-3/5" />
                  <div className="h-5 bg-zinc-700/30 dark:bg-zinc-700/30 rounded-full w-1/2" />
                  <div className="h-7 bg-zinc-700/50 dark:bg-zinc-700/50 rounded-full w-4/5" />
                  <div className="h-5 bg-zinc-700/30 dark:bg-zinc-700/30 rounded-full w-3/5" />
                  <div className="h-6 bg-zinc-700/40 dark:bg-zinc-700/40 rounded-full w-2/3" />
                  <div className="h-5 bg-zinc-700/30 dark:bg-zinc-700/30 rounded-full w-1/3" />
                </div>
              )}

              {/* State 2: Instrumental */}
              {!isLoadingLyrics && lyricsData?.instrumental && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      isDark ? "bg-zinc-800/80 text-zinc-300" : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold">Lagu Instrumental</h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Trek ini dikonfirmasi sebagai instrumental dan tidak mengandung vokal atau lirik.
                  </p>
                </div>
              )}

              {/* State 3: Error or Not Found */}
              {!isLoadingLyrics && !lyricsData?.instrumental && (lyricsError || (!lyricsData?.synced && !lyricsData?.plainText)) && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold">
                    {lyricsError || "Lirik Belum Tersedia"}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Lirik untuk lagu ini belum ditemukan di database LRCLIB.
                  </p>
                  {currentTrack && (
                    <button
                      type="button"
                      onClick={() => fetchLyricsForTrack(currentTrack)}
                      className={`mt-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                      }`}
                    >
                      Coba Cari Ulang
                    </button>
                  )}
                </div>
              )}

              {/* State 4: Synchronized Lyrics (Spotify Format: Left-aligned, bold, punchy, smooth fade) */}
              {!isLoadingLyrics && lyricsData?.synced && lyricsData.lines && lyricsData.lines.length > 0 && (
                lyricsData.lines.map((line, idx) => {
                  const isActive = activeLyricIndex === idx;
                  const isPast = activeLyricIndex > idx;
                  return (
                    <div
                      key={`${line.time}-${idx}`}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => seekToLyric(line.time)}
                      className={`cursor-pointer transition-all duration-300 py-2 sm:py-3 px-2 sm:px-3 rounded-xl select-none text-left max-w-3xl mx-auto origin-left ${
                        isActive
                          ? isDark
                            ? "text-white opacity-100 font-extrabold text-3xl sm:text-4xl lg:text-[40px] leading-snug drop-shadow-[0_2px_14px_rgba(255,255,255,0.25)] scale-[1.01]"
                            : "text-zinc-950 opacity-100 font-extrabold text-3xl sm:text-4xl lg:text-[40px] leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.1)] scale-[1.01]"
                          : isPast
                          ? isDark
                            ? "text-zinc-500 opacity-40 hover:opacity-80 hover:text-zinc-300 font-bold text-2xl sm:text-3xl lg:text-[32px] leading-snug"
                            : "text-zinc-400 opacity-45 hover:opacity-85 hover:text-zinc-700 font-bold text-2xl sm:text-3xl lg:text-[32px] leading-snug"
                          : isDark
                          ? "text-zinc-400 opacity-45 hover:opacity-85 hover:text-zinc-200 font-bold text-2xl sm:text-3xl lg:text-[32px] leading-snug"
                          : "text-zinc-500 opacity-50 hover:opacity-90 hover:text-zinc-800 font-bold text-2xl sm:text-3xl lg:text-[32px] leading-snug"
                      }`}
                      title={`Lompat ke ${Math.floor(line.time / 60)}:${String(Math.floor(line.time % 60)).padStart(2, "0")}`}
                    >
                      {line.text}
                    </div>
                  );
                })
              )}

              {/* State 5: Plain / Unsynced Lyrics */}
              {!isLoadingLyrics && !lyricsData?.synced && lyricsData?.plainText && (
                <div className="py-6 max-w-3xl mx-auto text-left space-y-4">
                  <div
                    className={`p-3 rounded-2xl text-xs inline-block mb-4 ${
                      isDark ? "bg-zinc-800/60 text-zinc-300" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    Lirik ini belum memiliki timestamp sinkronisasi berjalan dari LRCLIB.
                  </div>
                  {lyricsData.plainText.split("\n").map((line: string, i: number) => (
                    <p
                      key={i}
                      className={`text-xl sm:text-3xl font-bold tracking-tight leading-relaxed ${
                        line.trim() === "" ? "h-4" : isDark ? "text-zinc-300" : "text-zinc-700"
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-3.5 sm:px-8 flex-1 flex flex-col py-4 sm:py-6">
          {/* ─── TAB 1: MUSIK / SEARCH / ARTIST / ALBUM ───────── */}
          {subTab === "home" && (
            selectedAlbum ? (
              renderAlbumDetailView()
            ) : selectedArtist ? (
              renderArtistProfileView()
            ) : isLoadingArtist ? (
              <div className="w-full max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="w-28 h-28 rounded-full bg-zinc-800/80" />
                <div className="h-6 w-48 bg-zinc-800/80 rounded-full" />
                <div className="h-4 w-32 bg-zinc-800/50 rounded-full" />
                <p className="text-xs text-zinc-500 pt-2 font-medium">Memuat profil artis dari Spotify...</p>
              </div>
            ) : isLoadingAlbum ? (
              <div className="w-full max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="w-32 h-32 rounded-2xl bg-zinc-800/80" />
                <div className="h-6 w-52 bg-zinc-800/80 rounded-full" />
                <div className="h-4 w-36 bg-zinc-800/50 rounded-full" />
                <p className="text-xs text-zinc-500 pt-2 font-medium">Memuat album dari Spotify...</p>
              </div>
            ) : artistError ? (
              <div className="w-full max-w-md mx-auto py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-300 font-medium">{artistError}</p>
                <button
                  type="button"
                  onClick={() => setArtistError(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-medium transition cursor-pointer"
                >
                  Kembali ke Beranda
                </button>
              </div>
            ) : albumError ? (
              <div className="w-full max-w-md mx-auto py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-300 font-medium">{albumError}</p>
                <button
                  type="button"
                  onClick={() => setAlbumError(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-medium transition cursor-pointer"
                >
                  Kembali ke Beranda
                </button>
              </div>
            ) : (
            <div
              className={`w-full max-w-4xl mx-auto flex-1 flex flex-col transition-all duration-200 ${
                !searchQuery.trim()
                  ? "pt-1 pb-8 sm:pb-12"
                  : "pt-2"
              }`}
            >
              {/* Initial Hero: Avatar & Greeting (Visible ONLY when search box is empty) */}
              {/* Initial Hero: Headset Icon & Greeting (Visible ONLY when search box is empty) */}
              {!searchQuery.trim() && (
                <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5 px-3 sm:px-4 animate-in fade-in-0 duration-200">
                  {/* Clean Living Headset Icon (Pure icon without background box or glow) */}
                  <div className="relative mb-3.5 sm:mb-4 flex items-center justify-center">
                    <svg
                      className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-300 animate-usick-breath hover:scale-105 ${
                        isDark ? "text-white" : "text-zinc-900"
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.85}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Headband arch */}
                      <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
                      {/* Right Earpad */}
                      <path
                        d="M21 16a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z"
                        fill="currentColor"
                        className="opacity-90"
                      />
                      {/* Left Earpad */}
                      <path
                        d="M3 16a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z"
                        fill="currentColor"
                        className="opacity-90"
                      />
                      {/* Subtle living audio wave arc under the headband */}
                      <path d="M9 12.5a3 3 0 0 1 6 0" strokeWidth={1.5} opacity={0.65} />
                    </svg>
                  </div>

                  {/* Headline */}
                  <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                    Mau dengar apa hari ini{userName ? `, ${userName}` : ""}?
                  </h1>
                  <p className={`mt-2 mb-2 text-xs sm:text-sm font-medium max-w-md px-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Ketik judul lagu, musisi, atau genre untuk memutar musik langsung.
                  </p>
                </div>
              )}

              {/* PERSISTENT SINGLE CHAT BOX (Never unmounts, preserves focus seamlessly) */}
              <div className={`w-full max-w-2xl mx-auto ${searchQuery.trim() ? "sticky top-0 z-20 pt-1 pb-3 backdrop-blur-md" : "py-1"}`}>
                {renderSearchChatBox()}
              </div>

              {/* Lower Section: Recommendations & Tracks (When empty) OR Results & Tracks (When typed) */}
              {!searchQuery.trim() ? (
                <div className="space-y-6 sm:space-y-8 w-full mt-1 sm:mt-2 animate-in fade-in-0 duration-200">
                  {/* ─── SPOTIFY / APPLE MUSIC DISCOVER HOME (Clean One Mind Theme) ─── */}
                  <div className="space-y-3.5 pt-1">
                    {/* Clean Headline: Direkomendasikan untuk anda */}
                    <div>
                      <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                        Direkomendasikan untuk anda
                      </h3>
                    </div>

                    {/* Quick Picks Cards Grid (2 cols mobile, 3 cols tablet/desktop) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      {discoverTracks.slice(0, 6).map((track) => {
                        const isCurrent = currentTrack?.id === track.id;
                        const isTrackPlaying = isCurrent && isPlaying;
                        const isQueued = queue.some((q) => q.id === track.id);

                        return (
                          <div
                            key={`quick-pick-${track.id}`}
                            onClick={() => playTrack(track)}
                            className={`group relative flex items-center gap-2 sm:gap-2.5 p-1.5 sm:p-2 pr-2.5 sm:pr-3 rounded-xl sm:rounded-2xl transition cursor-pointer overflow-hidden border ${
                              isCurrent
                                ? isDark
                                  ? "bg-white/15 border-white/25 shadow-md"
                                  : "bg-black/10 border-black/20 shadow-xs"
                                : isDark
                                ? "bg-zinc-900/50 hover:bg-zinc-800/80 border-white/5 hover:border-white/10"
                                : "bg-white/80 hover:bg-white border-black/5 hover:border-black/10 shadow-xs"
                            }`}
                          >
                            {/* Artwork */}
                            <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-zinc-800 shadow-xs flex items-center justify-center text-zinc-500">
                              <svg className="w-5 h-5 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                              </svg>
                              {track.artworkUrl && (
                                <img
                                  src={track.artworkUrl}
                                  alt={track.title}
                                  className="relative z-1 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.opacity = "0";
                                  }}
                                />
                              )}
                              {/* Playing badge on art */}
                              {isTrackPlaying && (
                                <div className="absolute inset-0 z-2 bg-black/40 flex items-center justify-center backdrop-blur-xs">
                                  <span className="flex items-end gap-0.5 h-3">
                                    <span className="w-0.5 bg-white rounded-full animate-bounce h-3" />
                                    <span className="w-0.5 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: "0.2s" }} />
                                    <span className="w-0.5 bg-white rounded-full animate-bounce h-3.5" style={{ animationDelay: "0.4s" }} />
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Meta */}
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs sm:text-sm font-semibold truncate ${
                                isCurrent ? "text-white font-bold" : isDark ? "text-zinc-100" : "text-zinc-900"
                              }`}>
                                {track.title}
                              </p>
                              <p className="text-[10px] sm:text-xs text-zinc-400 truncate mt-0.5">
                                {track.artistNames.join(", ")}
                              </p>
                            </div>

                            {/* Card Actions: Quick Add to Queue */}
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => addToQueue(track)}
                                className={`p-1.5 rounded-lg transition cursor-pointer active:scale-90 ${
                                  isQueued
                                    ? isDark
                                      ? "text-white bg-white/15"
                                      : "text-black bg-black/10"
                                    : isDark
                                    ? "text-zinc-400 hover:text-white hover:bg-white/10"
                                    : "text-zinc-500 hover:text-black hover:bg-black/10"
                                }`}
                                title={isQueued ? "Sudah dalam antrean" : "Tambahkan ke antrean"}
                              >
                                {isQueued ? (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Full Track List directly below */}
                    <div className="pt-2">
                      {renderTrackTable(discoverTracks.slice(6), {
                        emptyMessage: "Tidak ada lagu yang ditemukan.",
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2 pb-8 w-full animate-in fade-in-0 duration-200">
                  {/* Results Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-zinc-800/40 pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">
                        Hasil: &quot;{searchQuery}&quot;
                      </h2>
                      <p className="text-xs text-zinc-500">
                        {isSearching
                          ? "Mencari musik dari katalog Spotify..."
                          : `${tracks.length} lagu siap diputar`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetToNewSearch}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          isDark
                            ? "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            : "border-zinc-200 bg-white text-zinc-600 hover:text-black hover:bg-zinc-100"
                        }`}
                      >
                        Bersihkan
                      </button>

                      {tracks.length > 0 && (
                        <button
                          onClick={() => playAllTracks(tracks)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-md"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <polygon points="6 4, 18 12, 6 20" />
                          </svg>
                          <span>Putar Semua ({tracks.length})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Loading Indicator */}
                  {isSearching && (
                    <div className="flex items-center gap-2 py-8 justify-center text-xs text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
                      <span>Mengambil daftar lagu Spotify...</span>
                    </div>
                  )}

                  {/* Error Notice */}
                  {searchError && (
                    <div
                      className={`py-3 px-4 rounded-2xl border text-xs text-center ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-700"
                      }`}
                    >
                      {searchError}
                    </div>
                  )}

                  {/* Artists Section in Search Results */}
                  {artists.length > 0 && !isSearching && (
                    <div className="space-y-3 pb-2 pt-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Artis
                        </h3>
                        <span className="text-xs text-zinc-500">
                          {artists.length} ditemukan
                        </span>
                      </div>
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                        {artists.map((art) => (
                          <button
                            key={art.id}
                            type="button"
                            onClick={() => openArtistProfile(art.providerItemId || art.title)}
                            className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer group shrink-0 w-28 text-center ${
                              isDark
                                ? "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/90 hover:border-zinc-700"
                                : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                            }`}
                          >
                            {art.artworkUrl ? (
                              <img
                                src={art.artworkUrl}
                                alt={art.title}
                                className="w-16 h-16 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform ${
                                  isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-500"
                                }`}
                              >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <span className={`mt-2 text-xs font-semibold truncate w-full ${isDark ? "text-white" : "text-zinc-900"}`}>
                              {art.title}
                            </span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">Artis</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Song List */}
                  {!isSearching && (
                    <div className="space-y-2 pt-1">
                      {artists.length > 0 && (
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Lagu
                        </h3>
                      )}
                      {renderTrackTable(tracks)}
                    </div>
                  )}
                </div>
              )}
            </div>
            )
          )}

          {/* ─── TAB 3: PLAYLISTS ───────────────────────────────────────────── */}
          {subTab === "playlists" && (
            <div className="space-y-6 animate-in fade-in-0 duration-200">
              {/* Mode A: Viewing Liked Songs */}
              {isViewingLiked && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsViewingLiked(false)}
                        className="p-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
                        title="Kembali ke Daftar Playlist"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                        isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/15 text-zinc-900"
                      }`}>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold tracking-tight">Lagu Disukai</h2>
                        <p className="text-xs text-zinc-500">{likedSongs.length} lagu tersimpan</p>
                      </div>
                    </div>

                    {likedSongs.length > 0 && (
                      <button
                        onClick={() => playAllTracks(likedSongs)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-md"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <polygon points="6 4, 18 12, 6 20" />
                        </svg>
                        <span>Putar Semua</span>
                      </button>
                    )}
                  </div>

                  {renderTrackTable(likedSongs, {
                    emptyMessage: "Belum ada lagu yang kamu sukai. Klik ikon hati pada lagu untuk menyimpannya di sini.",
                  })}
                </div>
              )}

              {/* Mode B: Viewing a Specific Custom Playlist */}
              {!isViewingLiked && selectedLocalPlaylist && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedLocalPlaylist(null)}
                        className="p-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
                        title="Kembali ke Daftar Playlist"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold tracking-tight">{selectedLocalPlaylist.name}</h2>
                        <p className="text-xs text-zinc-500">
                          {selectedLocalPlaylist.items.length} lagu {selectedLocalPlaylist.description ? `• ${selectedLocalPlaylist.description}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedLocalPlaylist.items.length > 0 && (
                        <button
                          onClick={() => playAllTracks(selectedLocalPlaylist.items)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-md"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <polygon points="6 4, 18 12, 6 20" />
                          </svg>
                          <span>Putar Semua</span>
                        </button>
                      )}

                      <button
                        onClick={() => deletePlaylist(selectedLocalPlaylist.id)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isDark
                            ? "border-zinc-800 hover:border-zinc-700 hover:bg-white/10 text-zinc-400 hover:text-white"
                            : "border-zinc-200 hover:border-zinc-300 hover:bg-black/5 text-zinc-600 hover:text-black"
                        }`}
                        title="Hapus Playlist"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {renderTrackTable(selectedLocalPlaylist.items, {
                    emptyMessage: "Playlist ini masih kosong. Cari lagu dan klik ikon '+' untuk menambahkannya ke playlist ini.",
                    showRemoveFromPlaylist: true,
                    onRemoveFromPlaylist: (trackId) => removeTrackFromPlaylist(selectedLocalPlaylist.id, trackId),
                  })}
                </div>
              )}

              {/* Mode C: Main Playlist Cards Overview */}
              {!isViewingLiked && !selectedLocalPlaylist && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">Koleksi & Playlist</h2>
                      <p className="text-xs text-zinc-500">Daftar putar pribadi yang kamu simpan</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSubTab("home")}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          isDark
                            ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                            : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Kembali ke Musik</span>
                      </button>

                      <button
                        onClick={() => setShowCreatePlaylistModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Buat Playlist</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Liked Songs Card */}
                    <div
                      onClick={() => setIsViewingLiked(true)}
                      className={`p-5 rounded-3xl border transition cursor-pointer group flex flex-col justify-between h-44 ${
                        isDark
                          ? "bg-gradient-to-br from-zinc-900/90 via-[#16161c] to-zinc-950 border-zinc-800 hover:border-zinc-700 shadow-lg"
                            : "bg-gradient-to-br from-zinc-100 to-white border-zinc-200 hover:border-zinc-300 shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner ${
                          isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/15 text-zinc-900"
                        }`}>
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 group-hover:text-white transition">
                          Buka →
                        </span>
                      </div>

                      <div>
                        <h3 className={`text-base font-extrabold ${isDark ? "text-white" : "text-zinc-900"}`}>Lagu Disukai</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{likedSongs.length} Lagu Favorit</p>
                      </div>
                    </div>

                    {/* User Custom Playlists */}
                    {localPlaylists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => setSelectedLocalPlaylist(pl)}
                        className={`p-5 rounded-3xl border transition cursor-pointer group flex flex-col justify-between h-44 relative ${
                          isDark
                            ? "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 shadow-lg"
                            : "bg-white border-zinc-200 hover:border-zinc-300 shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                            </svg>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlaylist(pl.id);
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isDark ? "text-zinc-500 hover:text-white hover:bg-white/10" : "text-zinc-400 hover:text-black hover:bg-black/5"
                            }`}
                            title="Hapus Playlist"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div>
                          <h3 className={`text-base font-extrabold truncate ${isDark ? "text-white" : "text-zinc-900"}`}>{pl.name}</h3>
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">
                            {pl.items.length} Lagu {pl.description ? `• ${pl.description}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Quick Create Card if user has zero custom playlists */}
                    {localPlaylists.length === 0 && (
                      <div
                        onClick={() => setShowCreatePlaylistModal(true)}
                        className="p-5 rounded-3xl border border-dashed border-zinc-800 hover:border-zinc-600 transition cursor-pointer flex flex-col items-center justify-center text-center h-44 gap-2 text-zinc-500 hover:text-zinc-300"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold">Buat Playlist Baru</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </main>
        </div>

        {/* ─── DESKTOP SPOTIFY-STYLE QUEUE SIDE PANEL ───────────────────────────── */}
        {showDesktopQueue && (
          <aside
            className={`hidden sm:flex flex-col w-80 lg:w-96 shrink-0 h-full border-l overflow-hidden transition-all duration-300 animate-in slide-in-from-right z-20 select-none ${
              isDark
                ? "bg-[#121215]/95 backdrop-blur-md border-white/10 text-white shadow-[-8px_0_24px_rgba(0,0,0,0.3)]"
                : "bg-[#fafafc]/95 backdrop-blur-md border-black/10 text-zinc-900 shadow-[-8px_0_24px_rgba(0,0,0,0.05)]"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 min-h-[57px] sm:min-h-[61px] border-b shrink-0 ${
              isDark ? "border-white/10" : "border-black/10"
            }`}>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Antrean</h3>
                {queue.length > 0 && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    isDark ? "bg-white/10 text-zinc-300" : "bg-black/10 text-zinc-700"
                  }`}>
                    {queue.length} lagu
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQueue([]);
                      saveQueueState({ items: [], currentIndex: 0, updatedAt: new Date().toISOString() });
                    }}
                    className={`text-xs transition cursor-pointer font-medium ${
                      isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-black"
                    }`}
                  >
                    Hapus Semua
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDesktopQueue(false)}
                  className={`p-1.5 rounded-full transition cursor-pointer ${
                    isDark ? "hover:bg-white/10 text-zinc-400 hover:text-white" : "hover:bg-black/10 text-zinc-600 hover:text-black"
                  }`}
                  title="Tutup antrean"
                  aria-label="Tutup antrean"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Section 1: Sedang Diputar (Now Playing) */}
              {currentTrack && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Sedang Diputar
                  </h4>
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
                      isDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10"
                        : "bg-black/5 border-black/10 hover:bg-black/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {currentTrack.artworkUrl ? (
                        <img
                          src={currentTrack.artworkUrl}
                          alt={currentTrack.title}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${
                          isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-500"
                        }`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{currentTrack.title}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{currentTrack.artistNames.join(", ")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isPlaying && (
                        <span className="flex items-end gap-0.5 h-3 px-1 mr-1">
                          <span className={`w-0.5 h-3 rounded-full animate-pulse ${isDark ? "bg-white" : "bg-black"}`} />
                          <span className={`w-0.5 h-2 rounded-full animate-pulse delay-75 ${isDark ? "bg-white" : "bg-black"}`} />
                          <span className={`w-0.5 h-3.5 rounded-full animate-pulse delay-150 ${isDark ? "bg-white" : "bg-black"}`} />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleLike(currentTrack)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isTrackLiked(currentTrack.id)
                            ? isDark ? "text-white" : "text-black"
                            : isDark ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-black"
                        }`}
                        title={isTrackLiked(currentTrack.id) ? "Hapus dari disukai" : "Sukai"}
                      >
                        <svg className={`w-4 h-4 ${isTrackLiked(currentTrack.id) ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Berikutnya dalam Antrean (Next in Queue) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Berikutnya Dalam Antrean
                  </h4>
                  {queue.length > 0 && (
                    <span className="text-[10px] text-zinc-500">{queue.length} lagu</span>
                  )}
                </div>

                {queue.length === 0 ? (
                  <div className={`p-4 rounded-2xl border border-dashed text-center space-y-1 ${
                    isDark ? "border-zinc-800 bg-zinc-900/20" : "border-zinc-200 bg-zinc-50"
                  }`}>
                    <p className={`text-xs font-semibold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      Antrean kosong
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Klik tombol '+' pada rekomendasi lagu di bawah untuk menambahkan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {queue.map((item, idx) => (
                      <div
                        key={`dt-queue-${item.id}-${idx}`}
                        onClick={() => {
                          setQueueIndex(idx);
                          playTrack(item);
                        }}
                        className={`group flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          queueIndex === idx
                            ? isDark
                              ? "bg-white/15 border border-white/20 font-bold text-white"
                              : "bg-black/10 border border-black/20 font-bold text-black"
                            : isDark
                            ? "hover:bg-white/5 text-zinc-300"
                            : "hover:bg-black/5 text-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-xs font-mono text-zinc-500 w-4 text-center shrink-0">
                            {idx + 1}
                          </span>
                          {item.artworkUrl && (
                            <img
                              src={item.artworkUrl}
                              alt={item.title}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{item.artistNames.join(", ")}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = queue.filter((_, i) => i !== idx);
                            setQueue(updated);
                            saveQueueState({
                              items: updated,
                              currentIndex: Math.min(queueIndex, updated.length - 1),
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0 ${
                            isDark ? "text-zinc-500 hover:text-white hover:bg-white/10" : "text-zinc-400 hover:text-black hover:bg-black/5"
                          }`}
                          title="Hapus dari antrean"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Rekomendasi Lagu (Spotify Style) */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Rekomendasi Lagu
                  </h4>
                  <p className="text-[10px] text-zinc-500">Berdasarkan musik yang sedang diputar</p>
                </div>

                <div className="space-y-1">
                  {recommendedTracks.map((rec) => (
                    <div
                      key={`dt-rec-${rec.id}`}
                      className={`group flex items-center justify-between p-2 rounded-xl transition ${
                        isDark ? "hover:bg-white/5 text-zinc-300" : "hover:bg-black/5 text-zinc-700"
                      }`}
                    >
                      <div
                        onClick={() => playTrack(rec)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        {rec.artworkUrl && (
                          <img
                            src={rec.artworkUrl}
                            alt={rec.title}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate group-hover:underline">{rec.title}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{rec.artistNames.join(", ")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => addToQueue(rec)}
                          className={`p-1.5 rounded-lg transition cursor-pointer active:scale-90 ${
                            queue.some((q) => q.id === rec.id)
                              ? isDark
                                ? "text-white bg-white/15"
                                : "text-black bg-black/10"
                              : isDark
                              ? "text-zinc-400 hover:text-white hover:bg-white/10"
                              : "text-zinc-600 hover:text-black hover:bg-black/10"
                          }`}
                          title={queue.some((q) => q.id === rec.id) ? "Sudah dalam antrean" : "Tambahkan ke antrean"}
                        >
                          {queue.some((q) => q.id === rec.id) ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ─── REMOTE ACTIVE PLAYBACK BAR (When another device owns active playback) ─── */}
      {musicConnect.enabled && musicConnect.remoteActiveSession ? (
        <div className="shrink-0 z-30 relative">
          <MusicConnectRemoteBar
            isDark={isDark}
            remoteSession={musicConnect.remoteActiveSession}
            hasLocalTrack={Boolean(currentTrack)}
            isSendingCommand={musicConnect.isSendingCommand}
            autoplayBlockedPrompt={musicConnect.autoplayBlockedPrompt}
            onUnlockAutoplay={() => {
              void musicConnect.unlockAutoplayAndConfirmTransfer();
            }}
            onSendCommand={musicConnect.sendAppCommand}
            onTransferHere={() =>
              musicConnect.transferAppPlayback(musicConnect.localInstanceId, true)
            }
            onOpenConnectModal={() => musicConnect.setShowConnectModal(true)}
          />
        </div>
      ) : currentTrack ? (
        /* ─── LOCAL PERSISTENT BOTTOM MINI-PLAYER (Only rendered when playing locally) ─── */
        <footer
          className={`shrink-0 z-30 transition-all relative border-t ${
            isDark
              ? "bg-[#121215] border-white/10 text-white"
              : "bg-[#fafafc] border-black/10 text-zinc-900"
          } pb-[max(0.5rem,calc(env(safe-area-inset-bottom)+0.25rem))]`}
        >
          {/* ─── MOBILE VIEW (< sm): Sleek, Larger Bar (Click to expand, Heart + Play on right) ─ */}
          <div className="block sm:hidden">
            {/* Top Progress Bar */}
            <div
              className={`w-full h-1.5 cursor-pointer overflow-hidden relative ${isDark ? "bg-white/10" : "bg-black/10"}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                handleSeek(pct * duration);
              }}
            >
              <div
                className={`h-full transition-all ${isDark ? "bg-white" : "bg-zinc-900"}`}
                style={{ width: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
              />
            </div>

            <div
              onClick={() => setShowMobilePlayer(true)}
              className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none group"
              title="Buka pemutar musik"
            >
              {/* Left: Artwork & Song Meta */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-md group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
                      isDark
                        ? "bg-zinc-800/70 border border-white/5 text-zinc-400"
                        : "bg-zinc-200/80 border border-black/5 text-zinc-500"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold truncate group-hover:underline">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {currentTrack.artistNames.join(", ")}
                  </p>
                </div>
              </div>

              {/* Right: ONLY Heart (Like) button and Play/Pause button */}
              <div
                className="flex items-center gap-2.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => toggleLike(currentTrack)}
                  className={`p-3 rounded-2xl transition cursor-pointer active:scale-90 ${
                    isTrackLiked(currentTrack.id)
                      ? isDark
                        ? "text-white"
                        : "text-black"
                      : isDark
                      ? "text-zinc-400 hover:text-white"
                      : "text-zinc-500 hover:text-black"
                  }`}
                  title={isTrackLiked(currentTrack.id) ? "Hapus dari disukai" : "Sukai lagu"}
                >
                  <svg className={`w-6 h-6 ${isTrackLiked(currentTrack.id) ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={togglePlayPause}
                  disabled={isResolvingAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer active:scale-95 ${
                    isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                  } ${isResolvingAudio ? "opacity-75 cursor-wait" : ""}`}
                  title={isResolvingAudio ? "Memuat audio..." : isPlaying ? "Jeda" : "Putar"}
                >
                  {isResolvingAudio ? (
                    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : isPlaying ? (
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6z M14 4h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                      <polygon points="6 4, 18 12, 6 20" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

        {/* ─── DESKTOP VIEW (>= sm): Full 3-Column Experience ────────────────── */}
        <div className="hidden sm:block px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Metadata */}
            <div
              onClick={() => {
                if (currentTrack) {
                  if (loadedTrackIdRef.current !== currentTrack.id || !isPlaying) {
                    playTrack(currentTrack);
                  } else {
                    togglePlayPause();
                  }
                }
              }}
              className="flex items-center gap-3 w-1/4 min-w-0 cursor-pointer select-none group"
              title={currentTrack ? `Putar ${currentTrack.title}` : undefined}
            >
              {currentTrack?.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${
                    isDark
                      ? "bg-zinc-800/70 border border-white/5 text-zinc-400"
                      : "bg-zinc-200/80 border border-black/5 text-zinc-500"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold truncate group-hover:underline">
                  {currentTrack?.title || "Belum ada trek yang diputar"}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate">
                  {currentTrack ? (
                    currentTrack.artistNames.map((name, i) => (
                      <span key={`${name}-${i}`}>
                        {i > 0 && ", "}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            openArtistProfile(name);
                          }}
                          className="hover:underline hover:text-white transition cursor-pointer"
                          title={`Lihat profil ${name}`}
                        >
                          {name}
                        </span>
                      </span>
                    ))
                  ) : (
                    "Pilih lagu untuk memulai"
                  )}
                </p>
              </div>
              {currentTrack && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(currentTrack);
                  }}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    isTrackLiked(currentTrack.id)
                      ? isDark
                        ? "text-white"
                        : "text-black"
                      : isDark
                      ? "text-zinc-500 hover:text-white"
                      : "text-zinc-500 hover:text-black"
                  }`}
                  title="Sukai lagu"
                >
                  <svg className={`w-5 h-5 ${isTrackLiked(currentTrack.id) ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Center: Controls & Interactive Timeline Slider */}
            <div className="flex flex-col items-center gap-1.5 w-1/2 max-w-xl">
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Shuffle */}
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isShuffle
                      ? isDark
                        ? "text-white bg-white/10"
                        : "text-black bg-black/10 font-bold"
                      : isDark
                      ? "text-zinc-500 hover:text-white"
                      : "text-zinc-500 hover:text-black"
                  }`}
                  title="Shuffle"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>

                {/* Previous */}
                <button
                  type="button"
                  onClick={playPrevious}
                  className={`p-2 transition cursor-pointer ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"}`}
                  title="Sebelumnya"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* Play / Pause button */}
                <button
                  type="button"
                  onClick={togglePlayPause}
                  disabled={isResolvingAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer ${
                    isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                  } ${isResolvingAudio ? "opacity-75 cursor-wait" : ""}`}
                  title={isResolvingAudio ? "Memuat audio..." : isPlaying ? "Jeda" : "Putar"}
                >
                  {isResolvingAudio ? (
                    <svg className="w-5.5 h-5.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : isPlaying ? (
                    <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6z M14 4h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                      <polygon points="6 4, 18 12, 6 20" />
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button
                  type="button"
                  onClick={playNext}
                  className={`p-2 transition cursor-pointer ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"}`}
                  title="Berikutnya"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                {/* Repeat */}
                <button
                  type="button"
                  onClick={toggleRepeat}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    repeatMode !== "off"
                      ? isDark
                        ? "text-white bg-white/10 font-bold"
                        : "text-black bg-black/10 font-bold"
                      : isDark
                      ? "text-zinc-500 hover:text-white"
                      : "text-zinc-500 hover:text-black"
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Progress Bar Slider (Clean White/Black Accent) */}
              <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-zinc-500">
                <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}</span>
                <div
                  className={`flex-1 h-1.5 rounded-full relative overflow-hidden cursor-pointer ${
                    isDark ? "bg-white/10" : "bg-black/10"
                  }`}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const newTime = pct * duration;
                    handleSeek(newTime);
                  }}
                >
                  <div
                    className={`h-full rounded-full transition-all ${isDark ? "bg-white" : "bg-zinc-900"}`}
                    style={{ width: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
                  />
                </div>
                <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</span>
              </div>
            </div>

            {/* Right: Lyrics, Queue & Inset Volume Control (Shifted leftward, longer slider, larger icon) */}
            <div className="flex items-center justify-end gap-3 sm:gap-4 w-1/4 pr-4 sm:pr-8">
              {/* Lyrics Toggle Button */}
              <button
                type="button"
                onClick={() => setShowLyrics((prev) => !prev)}
                className={`p-2 transition cursor-pointer relative ${
                  showLyrics
                    ? isDark
                      ? "text-white bg-white/15 rounded-xl font-bold"
                      : "text-black bg-black/10 rounded-xl font-bold"
                    : isDark
                    ? "text-zinc-400 hover:text-white"
                    : "text-zinc-500 hover:text-black"
                }`}
                title={showLyrics ? "Tutup Lirik" : "Lihat Lirik (Synchronized)"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8 9h8m-8 3.5h5m-2 7.5L6 21v-3.5H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v9.5a2 2 0 01-2 2h-7l-4 3.5z"
                  />
                </svg>
                {lyricsData?.synced && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isDark ? "bg-white" : "bg-zinc-900"}`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDesktopQueue((prev) => !prev)}
                className={`p-2 transition cursor-pointer relative ${
                  showDesktopQueue
                    ? isDark
                      ? "text-white bg-white/15 rounded-xl font-bold"
                      : "text-black bg-black/10 rounded-xl font-bold"
                    : isDark
                    ? "text-zinc-400 hover:text-white"
                    : "text-zinc-600 hover:text-black"
                }`}
                title={showDesktopQueue ? "Tutup Antrean" : "Antrean Putar"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {queue.length > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                    showDesktopQueue ? (isDark ? "bg-black" : "bg-white") : (isDark ? "bg-white" : "bg-black")
                  }`} />
                )}
              </button>

              {musicConnect.enabled && (
                <MusicConnectButton
                  isDark={isDark}
                  isOpen={musicConnect.showConnectModal}
                  onClick={() => musicConnect.setShowConnectModal((prev) => !prev)}
                  onlineOtherDevicesCount={musicConnect.onlineOtherDevicesCount}
                  remoteActiveDeviceName={musicConnect.remoteActiveSession?.device_name}
                  variant="desktop-footer"
                />
              )}

              {/* Volume control */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"}`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleVolumeChange(val);
                  }}
                  className={`w-24 sm:w-32 md:w-40 h-1.5 rounded-full cursor-pointer transition-all ${
                    isDark ? "bg-white/15 accent-white" : "bg-black/15 accent-black"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </footer>
      ) : null}

      {/* ─── SPOTIFY-STYLE MOBILE FULL-SCREEN MUSIC PLAYER ───────────────────── */}
      {showMobilePlayer && currentTrack && (
        <div
          ref={mobilePlayerRef}
          className={`fixed inset-0 z-50 sm:hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom overflow-hidden overscroll-none touch-none select-none ${
            isDark ? "bg-[#121215] text-white" : "bg-[#fafafc] text-zinc-900"
          }`}
        >
          {/* Pull-down indicator bar handle for intuitive swipe dismissal */}
          <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto mt-2 -mb-0.5 shrink-0 select-none" />

          {/* Top Bar: Close Chevron, Title/Context, Options */}
          <div className="flex items-center justify-between px-5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 shrink-0">
            <button
              type="button"
              onClick={closeMobilePlayerAnimated}
              className={`p-3 -ml-2 rounded-full transition cursor-pointer active:scale-90 ${
                isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-black"
              }`}
              title="Tutup pemutar"
              aria-label="Tutup pemutar"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="min-w-0 text-center flex-1 px-3">
              <p className={`text-[10px] font-semibold tracking-wider uppercase truncate ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                {currentTrack.albumTitle || "Sedang Diputar"}
              </p>
              <p className="text-xs font-bold truncate">
                {currentTrack.title}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMobilePlayerMode((prev) => (prev === "queue" ? "track" : "queue"))}
              className={`p-3 -mr-2 rounded-full transition cursor-pointer active:scale-90 relative ${
                mobilePlayerMode === "queue"
                  ? isDark
                    ? "bg-white text-black font-bold shadow-sm"
                    : "bg-black text-white font-bold shadow-sm"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-500 hover:text-black"
              }`}
              title="Antrean Putar"
              aria-label="Antrean Putar"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2.2" />
                <circle cx="12" cy="12" r="2.2" />
                <circle cx="19" cy="12" r="2.2" />
              </svg>
              {queue.length > 0 && (
                <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                  mobilePlayerMode === "queue"
                    ? isDark ? "bg-black" : "bg-white"
                    : isDark ? "bg-white" : "bg-black"
                }`} />
              )}
            </button>
          </div>

          {/* Middle Body: Artwork or Synced Lyrics View or Queue View */}
          <div className="flex-1 min-h-0 flex flex-col px-6 py-2 overflow-hidden justify-center">
            {mobilePlayerMode === "lyrics" ? (
              /* Clean borderless lyrics view directly on mobile player background */
              <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden py-2 px-1">
                {isLoadingLyrics ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <svg className={`w-6 h-6 animate-spin ${isDark ? "text-zinc-400" : "text-zinc-600"}`} viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <p className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Memuat lirik...</p>
                  </div>
                ) : lyricsData?.lines && lyricsData.lines.length > 0 ? (
                  <div
                    ref={mobileLyricsContainerRef}
                    onScroll={handleLyricsScroll}
                    className="flex-1 overflow-y-auto space-y-3.5 sm:space-y-4 py-20 px-2 text-left scroll-smooth select-none touch-pan-y overscroll-contain"
                  >
                    {lyricsData.lines.map((line, idx) => {
                      const isActive = lyricsData.synced && idx === activeLyricIndex;
                      const isPast = lyricsData.synced && idx < activeLyricIndex;
                      return (
                        <p
                          key={`${line.time}-${idx}`}
                          ref={isActive ? (el) => { mobileActiveLineRef.current = el; } : undefined}
                          onClick={() => {
                            if (lyricsData.synced) {
                              seekToLyric(line.time);
                            }
                          }}
                          className={`cursor-pointer transition-all duration-300 py-2 px-2.5 rounded-lg origin-left select-none text-left ${
                            isActive
                              ? isDark
                                ? "text-white opacity-100 font-extrabold text-2xl sm:text-3xl leading-snug drop-shadow-[0_2px_12px_rgba(255,255,255,0.25)] scale-[1.01]"
                                : "text-zinc-950 opacity-100 font-extrabold text-2xl sm:text-3xl leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)] scale-[1.01]"
                              : isPast
                              ? isDark
                                ? "text-zinc-500 opacity-40 font-bold text-xl sm:text-2xl leading-snug"
                                : "text-zinc-400 opacity-45 font-bold text-xl sm:text-2xl leading-snug"
                              : isDark
                              ? "text-zinc-400 opacity-45 font-bold text-xl sm:text-2xl leading-snug"
                              : "text-zinc-500 opacity-50 font-bold text-xl sm:text-2xl leading-snug"
                          }`}
                        >
                          {line.text}
                        </p>
                      );
                    })}
                  </div>
                ) : lyricsData?.plainText ? (
                  <div
                    ref={mobileLyricsContainerRef}
                    className="flex-1 overflow-y-auto space-y-3.5 py-16 px-2.5 text-left scroll-smooth select-none touch-pan-y overscroll-contain"
                  >
                    <div
                      className={`p-2.5 rounded-xl text-[11px] font-medium inline-block mb-2 ${
                        isDark ? "bg-white/5 text-zinc-400" : "bg-black/5 text-zinc-600"
                      }`}
                    >
                      Lirik belum memiliki sinkronisasi waktu.
                    </div>
                    {lyricsData.plainText.split("\n").map((line: string, i: number) => (
                      <p
                        key={i}
                        className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${
                          line.trim() === "" ? "h-3" : isDark ? "text-zinc-300" : "text-zinc-700"
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <p className={`text-sm font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      {lyricsError || "Lirik Belum Tersedia"}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      Lirik belum ditemukan untuk lagu ini.
                    </p>
                  </div>
                )}
              </div>
            ) : mobilePlayerMode === "queue" ? (
              /* Clean Mobile Queue View: Replaces Cover/Lyrics in Middle Area */
              <div
                ref={mobileQueueContainerRef}
                className="flex-1 min-h-0 flex flex-col relative overflow-y-auto py-2 px-1 space-y-4 overscroll-contain select-none touch-pan-y"
              >
                {/* Header inside mobile queue */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">Antrean Pemutaran</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isDark ? "bg-white/10 text-zinc-300" : "bg-black/10 text-zinc-700"
                    }`}>
                      {queue.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {queue.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setQueue([]);
                          saveQueueState({ items: [], currentIndex: 0, updatedAt: new Date().toISOString() });
                        }}
                        className={`text-xs transition font-medium cursor-pointer ${
                          isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-black"
                        }`}
                      >
                        Hapus Semua
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMobilePlayerMode("track")}
                      className={`text-xs px-2.5 py-1 rounded-full transition cursor-pointer font-medium ${
                        isDark ? "bg-white/10 text-zinc-300 hover:text-white" : "bg-black/10 text-zinc-700 hover:text-black"
                      }`}
                    >
                      Tutup
                    </button>
                  </div>
                </div>

                {/* Queue items */}
                {queue.length === 0 ? (
                  <div className={`p-4 rounded-2xl border border-dashed text-center space-y-1 ${
                    isDark ? "border-zinc-800 bg-zinc-900/30" : "border-zinc-200 bg-zinc-50"
                  }`}>
                    <p className={`text-xs font-semibold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      Antrean Kosong
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Pilih lagu di bawah untuk menambahkan ke antrean
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {queue.map((item, idx) => (
                      <div
                        key={`mob-q-${item.id}-${idx}`}
                        onClick={() => {
                          setQueueIndex(idx);
                          playTrack(item);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer active:scale-[0.98] ${
                          queueIndex === idx
                            ? isDark
                              ? "bg-white/15 border border-white/20 font-bold text-white"
                              : "bg-black/10 border border-black/20 font-bold text-black"
                            : isDark
                            ? "bg-white/5 hover:bg-white/10 text-zinc-300"
                            : "bg-black/5 hover:bg-black/10 text-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-xs font-mono text-zinc-500 w-4 text-center shrink-0">
                            {idx + 1}
                          </span>
                          {item.artworkUrl && (
                            <img
                              src={item.artworkUrl}
                              alt={item.title}
                              className="w-9 h-9 rounded-xl object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs truncate">{item.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{item.artistNames.join(", ")}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = queue.filter((_, i) => i !== idx);
                            setQueue(updated);
                            saveQueueState({
                              items: updated,
                              currentIndex: Math.min(queueIndex, updated.length - 1),
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isDark ? "text-zinc-500 hover:text-white hover:bg-white/10" : "text-zinc-400 hover:text-black hover:bg-black/5"
                          }`}
                          title="Hapus dari antrean"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations in mobile queue view (Spotify style) */}
                <div className="pt-2 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Rekomendasi Lagu
                    </h4>
                    <p className="text-[10px] text-zinc-500">Disarankan untuk Anda</p>
                  </div>
                  <div className="space-y-1.5">
                    {recommendedTracks.map((rec) => (
                      <div
                        key={`mob-rec-${rec.id}`}
                        className={`flex items-center justify-between p-2 rounded-2xl transition ${
                          isDark ? "bg-white/5 text-zinc-300" : "bg-black/5 text-zinc-700"
                        }`}
                      >
                        <div
                          onClick={() => playTrack(rec)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        >
                          {rec.artworkUrl && (
                            <img
                              src={rec.artworkUrl}
                              alt={rec.title}
                              className="w-9 h-9 rounded-xl object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{rec.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{rec.artistNames.join(", ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => addToQueue(rec)}
                            className={`p-1.5 rounded-xl transition cursor-pointer active:scale-90 ${
                              queue.some((q) => q.id === rec.id)
                                ? isDark
                                  ? "text-white bg-white/15"
                                  : "text-black bg-black/10"
                                : isDark
                                ? "hover:bg-white/10 text-zinc-400 hover:text-white"
                                : "hover:bg-black/10 text-zinc-600 hover:text-black"
                            }`}
                            title={queue.some((q) => q.id === rec.id) ? "Sudah dalam antrean" : "Tambahkan ke antrean"}
                          >
                            {queue.some((q) => q.id === rec.id) ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Artwork View */
              <div className="w-full flex items-center justify-center py-2">
                <div
                  className={`w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden relative mx-auto border shadow-xl ${
                    isDark
                      ? "bg-zinc-900 border-white/10 shadow-black/40"
                      : "bg-zinc-100 border-black/10 shadow-zinc-900/10"
                  }`}
                >
                  {currentTrack.artworkUrl ? (
                    <img
                      src={currentTrack.artworkUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel: Track Info, Scrubber, Controls, Utilities */}
          <div className="shrink-0 px-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-2 space-y-3">
            {/* Track Info Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold truncate leading-tight">
                  {currentTrack.title}
                </h2>
                <p className={`text-sm font-medium truncate mt-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {currentTrack.artistNames.map((name, i) => (
                    <span key={`${name}-${i}`}>
                      {i > 0 && ", "}
                      <span
                        onClick={() => {
                          setShowMobilePlayer(false);
                          openArtistProfile(name);
                        }}
                        className={`hover:underline cursor-pointer ${isDark ? "hover:text-white" : "hover:text-black"}`}
                      >
                        {name}
                      </span>
                    </span>
                  ))}
                </p>
              </div>

              {/* Like Button */}
              <button
                type="button"
                onClick={() => toggleLike(currentTrack)}
                className={`p-3 rounded-full transition cursor-pointer shrink-0 active:scale-90 ${
                  isTrackLiked(currentTrack.id)
                    ? isDark ? "text-white" : "text-black"
                    : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-black"
                }`}
                title={isTrackLiked(currentTrack.id) ? "Hapus dari disukai" : "Sukai"}
              >
                <svg
                  className={`w-7 h-7 ${isTrackLiked(currentTrack.id) ? "fill-current" : ""}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  fill="none"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Progress Scrubber with Circle Handle and Continuous Touch Drag */}
            {(() => {
              const displayPlaybackTime = isScrubbing && scrubTime !== null ? scrubTime : currentTime;
              const displayProgressPct = Math.max(0, Math.min(1, displayPlaybackTime / Math.max(duration, 1)));
              return (
                <div className="space-y-1.5 pt-1 select-none">
                  <div
                    data-scrubber="true"
                    onPointerDown={handleScrubberPointerDown}
                    onPointerMove={handleScrubberPointerMove}
                    onPointerUp={handleScrubberPointerUp}
                    onPointerCancel={handleScrubberPointerCancel}
                    className="w-full py-2.5 cursor-pointer relative flex items-center select-none touch-none group"
                  >
                    {/* Background Track Bar */}
                    <div
                      className={`w-full h-1.5 sm:h-2 rounded-full relative overflow-visible ${
                        isDark ? "bg-white/20" : "bg-black/15"
                      }`}
                    >
                      {/* Active Progress Fill */}
                      <div
                        className={`h-full rounded-full transition-[width] ${isScrubbing ? "duration-0" : "duration-75"} ${
                          isDark ? "bg-white" : "bg-zinc-950"
                        }`}
                        style={{ width: `${displayProgressPct * 100}%` }}
                      />
                      {/* Draggable Circle (Lingkaran Thumb) */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-md transition-transform pointer-events-none ${
                          isScrubbing ? "scale-125 ring-2 ring-white/50" : "scale-100 group-hover:scale-110"
                        } ${
                          isDark
                            ? "bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                            : "bg-zinc-900 text-white shadow-[0_0_10px_rgba(0,0,0,0.35)]"
                        }`}
                        style={{ left: `${displayProgressPct * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className={`flex items-center justify-between text-[11px] font-mono ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    <span>{formatPlaybackTime(displayPlaybackTime)}</span>
                    <span>{formatRemainingPlaybackTime(displayPlaybackTime, duration)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Main Playback Control Row */}
            <div className="flex items-center justify-between pt-1">
              {/* Shuffle */}
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-3 rounded-full transition cursor-pointer active:scale-90 ${
                  isShuffle
                    ? isDark ? "text-white" : "text-black font-bold"
                    : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700"
                }`}
                title="Acak"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H8m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>

              {/* Previous */}
              <button
                type="button"
                onClick={playPrevious}
                className={`p-3 rounded-full active:scale-90 transition cursor-pointer ${
                  isDark ? "text-white hover:text-zinc-200" : "text-black hover:text-zinc-800"
                }`}
                title="Sebelumnya"
              >
                <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              {/* Big Play / Pause */}
              <button
                type="button"
                onClick={togglePlayPause}
                disabled={isResolvingAudio}
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition cursor-pointer ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-black text-white hover:bg-zinc-800"
                } ${isResolvingAudio ? "opacity-75 cursor-wait" : ""}`}
                title={isResolvingAudio ? "Memuat..." : isPlaying ? "Jeda" : "Putar"}
              >
                {isResolvingAudio ? (
                  <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6z M14 4h4v16h-4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 fill-current ml-0.5" viewBox="0 0 24 24">
                    <polygon points="6 4, 18 12, 6 20" />
                  </svg>
                )}
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={playNext}
                className={`p-3 rounded-full active:scale-90 transition cursor-pointer ${
                  isDark ? "text-white hover:text-zinc-200" : "text-black hover:text-zinc-800"
                }`}
                title="Berikutnya"
              >
                <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              {/* Repeat */}
              <button
                type="button"
                onClick={toggleRepeat}
                className={`p-3 rounded-full transition cursor-pointer relative active:scale-90 ${
                  repeatMode !== "off"
                    ? isDark ? "text-white" : "text-black font-bold"
                    : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700"
                }`}
                title={`Ulang: ${repeatMode}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {repeatMode === "one" && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold bg-zinc-800 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">1</span>
                )}
              </button>
            </div>

            {/* Bottom Utility Row: Icon-Only Lyrics & Queue Buttons (Enlarged) */}
            <div className={`flex items-center justify-between pt-1 px-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {/* Lyrics Toggle Button (Icon Only, Enlarged) */}
              <button
                type="button"
                onClick={() => setMobilePlayerMode((prev) => (prev === "lyrics" ? "track" : "lyrics"))}
                className={`p-3 rounded-2xl transition-all cursor-pointer relative active:scale-90 ${
                  mobilePlayerMode === "lyrics"
                    ? isDark
                      ? "bg-white text-black shadow-md font-bold"
                      : "bg-black text-white shadow-md font-bold"
                    : isDark
                    ? "hover:text-white hover:bg-white/10 text-zinc-300 bg-white/5"
                    : "hover:text-black hover:bg-black/10 text-zinc-700 bg-black/5"
                }`}
                title={mobilePlayerMode === "lyrics" ? "Tutup Lirik" : "Lirik Lagu"}
                aria-label={mobilePlayerMode === "lyrics" ? "Tutup Lirik" : "Lirik Lagu"}
              >
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8 9h8m-8 3.5h5m-2 7.5L6 21v-3.5H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v9.5a2 2 0 01-2 2h-7l-4 3.5z"
                  />
                </svg>
                {lyricsData?.synced && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                      mobilePlayerMode === "lyrics"
                        ? isDark ? "bg-black" : "bg-white"
                        : isDark ? "bg-white" : "bg-black"
                    }`}
                  />
                )}
              </button>

              {musicConnect.enabled && (
                <MusicConnectButton
                  isDark={isDark}
                  isOpen={musicConnect.showConnectModal}
                  onClick={() => musicConnect.setShowConnectModal(true)}
                  onlineOtherDevicesCount={musicConnect.onlineOtherDevicesCount}
                  remoteActiveDeviceName={musicConnect.remoteActiveSession?.device_name}
                  variant="mobile-player"
                />
              )}

              {/* Queue Button (Icon Only, Enlarged, Toggles Queue in Place of Cover/Lyrics) */}
              <button
                type="button"
                onClick={() => setMobilePlayerMode((prev) => (prev === "queue" ? "track" : "queue"))}
                className={`p-3 rounded-2xl transition-all cursor-pointer relative active:scale-90 ${
                  mobilePlayerMode === "queue"
                    ? isDark
                      ? "bg-white text-black shadow-md font-bold"
                      : "bg-black text-white shadow-md font-bold"
                    : isDark
                    ? "hover:text-white hover:bg-white/10 text-zinc-300 bg-white/5"
                    : "hover:text-black hover:bg-black/10 text-zinc-700 bg-black/5"
                }`}
                title="Antrean Putar"
                aria-label="Antrean Putar"
              >
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {queue.length > 0 && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                      mobilePlayerMode === "queue"
                        ? isDark ? "bg-black" : "bg-white"
                        : isDark ? "bg-white" : "bg-black"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: MUSIC CONNECT (MULTI-DEVICE PLAYBACK & SPOTIFY CONNECT) ──── */}
      {musicConnect.enabled && (
        <MusicConnectModal
          isOpen={musicConnect.showConnectModal}
          isDark={isDark}
          onClose={() => musicConnect.setShowConnectModal(false)}
          localInstanceId={musicConnect.localInstanceId}
          localDeviceName={musicConnect.localDeviceName}
          onRenameLocalDevice={musicConnect.handleRenameLocalDevice}
          sessions={musicConnect.sessions}
          activeSession={musicConnect.activeSession}
          spotifyConnect={musicConnect.spotifyConnect}
          isLoadingDevices={musicConnect.isLoadingDevices}
          isSendingCommand={musicConnect.isSendingCommand}
          commandFeedback={musicConnect.commandFeedback}
          onRefreshDevices={musicConnect.refreshDevices}
          onSendAppCommand={musicConnect.sendAppCommand}
          onTransferAppPlayback={musicConnect.transferAppPlayback}
          onExecuteSpotifyAction={musicConnect.executeSpotifyAction}
        />
      )}

      {/* ─── MODAL 1: SPOTIFY SETUP & API CREDENTIALS GUIDE ──────────────────── */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 space-y-5 shadow-2xl ${
              isDark ? "bg-[#18181f] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold">Panduan Konfigurasi Spotify API</h3>
                  <p className="text-xs text-zinc-500">Gratis 100% tanpa biaya langganan</p>
                </div>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
              <p>
                Agar fitur pencarian musik dapat mengakses seluruh 100+ juta lagu di katalog Spotify, masukkan API Credentials di file <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono">.env.local</code>:
              </p>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
                <div>SPOTIFY_CLIENT_ID=your_client_id_here</div>
                <div>SPOTIFY_CLIENT_SECRET=your_client_secret_here</div>
              </div>
              <div className="space-y-1 text-zinc-400">
                <p>1. Buka <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-white underline font-semibold">developer.spotify.com/dashboard</a>.</p>
                <p>2. Login dengan akun Spotify kamu dan klik <strong>Create App</strong>.</p>
                <p>3. Salin <strong>Client ID</strong> dan <strong>Client Secret</strong> ke file <code>.env.local</code>.</p>
                <p>4. Fitur pencarian otomatis aktif tanpa perlu login ulang pengguna!</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── MODAL 3: CREATE / ADD TO PLAYLIST MODAL ─────────────────────────── */}
      {(showCreatePlaylistModal || addToPlaylistTrack) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark ? "bg-[#18181f] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {addToPlaylistTrack ? "Tambahkan ke Playlist" : "Buat Playlist Baru"}
                </h3>
                {addToPlaylistTrack && (
                  <p className="text-xs text-zinc-500 truncate">{addToPlaylistTrack.title}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCreatePlaylistModal(false);
                  setAddToPlaylistTrack(null);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List existing playlists if adding */}
            {addToPlaylistTrack && localPlaylists.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-zinc-400">Pilih Playlist Tersimpan:</p>
                {localPlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => addTrackToPlaylist(pl.id, addToPlaylistTrack)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/70 transition text-left text-xs cursor-pointer"
                  >
                    <span className="font-bold">{pl.name}</span>
                    <span className="text-[10px] text-zinc-500">{pl.items.length} lagu</span>
                  </button>
                ))}
              </div>
            )}

            {/* Create new playlist form */}
            <form onSubmit={handleCreatePlaylist} className="space-y-3 pt-2 border-t border-zinc-800/60">
              <p className="text-xs font-semibold text-zinc-400">Atau Buat Playlist Baru:</p>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Nama playlist (contoh: Lagu Santai)"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs outline-none focus:border-zinc-600 text-white placeholder-zinc-500"
                required
              />
              <input
                type="text"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder="Deskripsi singkat (opsional)"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs outline-none focus:border-zinc-600 text-white placeholder-zinc-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePlaylistModal(false);
                    setAddToPlaylistTrack(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-800 hover:bg-zinc-800 transition cursor-pointer text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
                >
                  Simpan Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── FLOATING QUEUE TOAST NOTIFICATION ───────────────────────────────── */}
      {queueToast && (
        <div
          className={`fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 ease-out transform ${
            isQueueToastVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-2 scale-95"
          }`}
        >
          <div
            className={`px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 border transition-colors duration-150 ${
              isDark
                ? "bg-zinc-900/95 text-white border-white/15 shadow-black/60 backdrop-blur-md"
                : "bg-white/95 text-zinc-900 border-black/10 shadow-black/10 backdrop-blur-md"
            }`}
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-white" : "text-zinc-900"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="truncate max-w-[280px] sm:max-w-md">{queueToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MusicWorkspace;
