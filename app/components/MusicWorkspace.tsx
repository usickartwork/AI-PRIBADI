"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Avatar from "@/components/ui/components-primitives-avatar";
import {
  MusicItem,
  LocalPlaylist,
  SpotifySearchResult,
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

interface MusicWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  onTogglePanel?: () => void;
  userName?: string;
}

type SubTab = "home" | "search" | "playlists";

// Curated starter tracks for initial preview (Rich selection of 16 popular global & Indonesian hits)
const FEATURED_STARTER_TRACKS: MusicItem[] = [
  {
    id: "spotify:track:4cOdK2wGLETKBW3PvgPWqT",
    provider: "spotify",
    providerItemId: "4cOdK2wGLETKBW3PvgPWqT",
    itemType: "track",
    title: "Never Gonna Give You Up",
    artistNames: ["Rick Astley"],
    albumTitle: "Whenever You Need Somebody",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2735755e164993798e0c9ef7d7a",
    durationMs: 213573,
    externalUrl: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    uri: "spotify:track:4cOdK2wGLETKBW3PvgPWqT",
    youtubeVideoId: "3BFTio5296w",
  },
  {
    id: "spotify:track:7qiZfU4dY1lWllzX7mPBI3",
    provider: "spotify",
    providerItemId: "7qiZfU4dY1lWllzX7mPBI3",
    itemType: "track",
    title: "Shape of You",
    artistNames: ["Ed Sheeran"],
    albumTitle: "÷ (Divide)",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    durationMs: 233712,
    externalUrl: "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3",
    uri: "spotify:track:7qiZfU4dY1lWllzX7mPBI3",
    youtubeVideoId: "_dK2tDK9grQ",
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
    youtubeVideoId: "fHI8X4OXluQ",
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
    youtubeVideoId: "u6lihZAcy4s",
  },
  {
    id: "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp",
    provider: "spotify",
    providerItemId: "3n3Ppam7vgaVa1iaRUc9Lp",
    itemType: "track",
    title: "Mr. Brightside",
    artistNames: ["The Killers"],
    albumTitle: "Hot Fuss",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2730bf18361b7f041ee235ef980",
    durationMs: 222973,
    externalUrl: "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp",
    uri: "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp",
    youtubeVideoId: "l7MaKmKJqoc",
  },
  {
    id: "spotify:track:6dOtVTDmmpvnLNaRLtuX9Y",
    provider: "spotify",
    providerItemId: "6dOtVTDmmpvnLNaRLtuX9Y",
    itemType: "track",
    title: "BIRDS OF A FEATHER",
    artistNames: ["Billie Eilish"],
    albumTitle: "HIT ME HARD AND SOFT",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b27371d62ea7ea8a5be92d3c1f62",
    durationMs: 196884,
    externalUrl: "https://open.spotify.com/track/6dOtVTDmmpvnLNaRLtuX9Y",
    uri: "spotify:track:6dOtVTDmmpvnLNaRLtuX9Y",
    youtubeVideoId: "d5gf9dXbPi0",
  },
  {
    id: "spotify:track:2plbrEY59IikOBgB57599W",
    provider: "spotify",
    providerItemId: "2plbrEY59IikOBgB57599W",
    itemType: "track",
    title: "Die With A Smile",
    artistNames: ["Lady Gaga", "Bruno Mars"],
    albumTitle: "Die With A Smile",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b27382ea2e9e1f582d6e35cf4ef9",
    durationMs: 251667,
    externalUrl: "https://open.spotify.com/track/2plbrEY59IikOBgB57599W",
    uri: "spotify:track:2plbrEY59IikOBgB57599W",
    youtubeVideoId: "kPa7bsKwL-c",
  },
  {
    id: "spotify:track:2qSkXiYg9xqBtA3auRPCgg",
    provider: "spotify",
    providerItemId: "2qSkXiYg9xqBtA3auRPCgg",
    itemType: "track",
    title: "Espresso",
    artistNames: ["Sabrina Carpenter"],
    albumTitle: "Short n' Sweet",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273fd8d7a8d96871e791cb1f628",
    durationMs: 175459,
    externalUrl: "https://open.spotify.com/track/2qSkXiYg9xqBtA3auRPCgg",
    uri: "spotify:track:2qSkXiYg9xqBtA3auRPCgg",
    youtubeVideoId: "Qdcg7d8i39E",
  },
  {
    id: "spotify:track:5enxwA8aAbwZbf5ncJizRY",
    provider: "spotify",
    providerItemId: "5enxwA8aAbwZbf5ncJizRY",
    itemType: "track",
    title: "Taste",
    artistNames: ["Sabrina Carpenter"],
    albumTitle: "Short n' Sweet",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273fd8d7a8d96871e791cb1f628",
    durationMs: 157279,
    externalUrl: "https://open.spotify.com/track/5enxwA8aAbwZbf5ncJizRY",
    uri: "spotify:track:5enxwA8aAbwZbf5ncJizRY",
    youtubeVideoId: "3f538x0mF0A",
  },
  {
    id: "spotify:track:1BxfuPKGuaTgP7aM0XbdQA",
    provider: "spotify",
    providerItemId: "1BxfuPKGuaTgP7aM0XbdQA",
    itemType: "track",
    title: "Cruel Summer",
    artistNames: ["Taylor Swift"],
    albumTitle: "Lover",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647",
    durationMs: 178426,
    externalUrl: "https://open.spotify.com/track/1BxfuPKGuaTgP7aM0XbdQA",
    uri: "spotify:track:1BxfuPKGuaTgP7aM0XbdQA",
    youtubeVideoId: "ic8j13piAhQ",
  },
  {
    id: "spotify:track:71BbaJkM4bW31HqM1e2q5y",
    provider: "spotify",
    providerItemId: "71BbaJkM4bW31HqM1e2q5y",
    itemType: "track",
    title: "Satu Bulan",
    artistNames: ["Bernadya"],
    albumTitle: "Sialnya, Hidup Harus Tetap Berjalan",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273e04e9c60e34c38d415cb27ea",
    durationMs: 195431,
    externalUrl: "https://open.spotify.com/track/71BbaJkM4bW31HqM1e2q5y",
    uri: "spotify:track:71BbaJkM4bW31HqM1e2q5y",
    youtubeVideoId: "kXF3V8daH_o",
  },
  {
    id: "spotify:track:4jXl6VOGUieZvQI4902931",
    provider: "spotify",
    providerItemId: "4jXl6VOGUieZvQI4902931",
    itemType: "track",
    title: "Evaluasi",
    artistNames: ["Hindia"],
    albumTitle: "Menari Dengan Bayangan",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2732997b69c2794eb827a5ab06b",
    durationMs: 204000,
    externalUrl: "https://open.spotify.com/track/4jXl6VOGUieZvQI4902931",
    uri: "spotify:track:4jXl6VOGUieZvQI4902931",
    youtubeVideoId: "cWn8w4Y2Hek",
  },
  {
    id: "spotify:track:2Fxq9o3nF4aXw1K2v8w1e4",
    provider: "spotify",
    providerItemId: "2Fxq9o3nF4aXw1K2v8w1e4",
    itemType: "track",
    title: "Rayuan Perempuan Gila",
    artistNames: ["Nadin Amizah"],
    albumTitle: "Untuk Dunia, Cinta, dan Kotornya",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b2733c91a329432fefb7bc8b42ce",
    durationMs: 297500,
    externalUrl: "https://open.spotify.com/track/2Fxq9o3nF4aXw1K2v8w1e4",
    uri: "spotify:track:2Fxq9o3nF4aXw1K2v8w1e4",
    youtubeVideoId: "ZgT6xY1V4eA",
  },
  {
    id: "spotify:track:1hxaaA0G618K1oW6w9s1s2",
    provider: "spotify",
    providerItemId: "1hxaaA0G618K1oW6w9s1s2",
    itemType: "track",
    title: "Viva La Vida",
    artistNames: ["Coldplay"],
    albumTitle: "Viva La Vida or Death and All His Friends",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f",
    durationMs: 242000,
    externalUrl: "https://open.spotify.com/track/1hxaaA0G618K1oW6w9s1s2",
    uri: "spotify:track:1hxaaA0G618K1oW6w9s1s2",
    youtubeVideoId: "dvgZkm1xWPE",
  },
  {
    id: "spotify:track:5nujrmhLynf4yMoTvjACaq",
    provider: "spotify",
    providerItemId: "5nujrmhLynf4yMoTvjACaq",
    itemType: "track",
    title: "Levitating",
    artistNames: ["Dua Lipa"],
    albumTitle: "Future Nostalgia",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273bd26ede1ae6932772020a665",
    durationMs: 203807,
    externalUrl: "https://open.spotify.com/track/5nujrmhLynf4yMoTvjACaq",
    uri: "spotify:track:5nujrmhLynf4yMoTvjACaq",
    youtubeVideoId: "TUVcZfQe-Kw",
  },
  {
    id: "spotify:track:4u7EnebtmKWzUH433cf5Qv",
    provider: "spotify",
    providerItemId: "4u7EnebtmKWzUH433cf5Qv",
    itemType: "track",
    title: "Bohemian Rhapsody",
    artistNames: ["Queen"],
    albumTitle: "A Night At The Opera",
    artworkUrl: "https://i.scdn.co/image/ab67616d0000b273ce4f1737bc8a646c8c4bd25a",
    durationMs: 354320,
    externalUrl: "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv",
    uri: "spotify:track:4u7EnebtmKWzUH433cf5Qv",
    youtubeVideoId: "fJ9rUzIMcZQ",
  },
];

export function MusicWorkspace({ isDark, onClose, onTogglePanel, userName }: MusicWorkspaceProps) {
  // Navigation & View State (Clean 2 primary tabs: home & playlists)
  const [subTab, setSubTab] = useState<SubTab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSpotifyConfigured, setIsSpotifyConfigured] = useState<boolean | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Music Catalog State (Defaults to rich 16-song starter selection)
  const [tracks, setTracks] = useState<MusicItem[]>(FEATURED_STARTER_TRACKS);
  const [artists, setArtists] = useState<MusicItem[]>([]);
  const [albums, setAlbums] = useState<MusicItem[]>([]);
  const [playlistsList, setPlaylistsList] = useState<MusicItem[]>([]);

  // User Library State
  const [likedSongs, setLikedSongs] = useState<MusicItem[]>([]);
  const [localPlaylists, setLocalPlaylists] = useState<LocalPlaylist[]>([]);
  const [selectedLocalPlaylist, setSelectedLocalPlaylist] = useState<LocalPlaylist | null>(null);
  const [isViewingLiked, setIsViewingLiked] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Playback & Queue State
  const [currentTrack, setCurrentTrack] = useState<MusicItem | null>(FEATURED_STARTER_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [queue, setQueue] = useState<MusicItem[]>(FEATURED_STARTER_TRACKS);
  const [queueIndex, setQueueIndex] = useState(0);

  // Modals & Drawers (Lyrics modal removed as requested)
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<MusicItem | null>(null);

  // YouTube Full Song Streaming Refs
  const ytPlayerRef = useRef<any>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const [isYtReady, setIsYtReady] = useState(false);
  const [isResolvingAudio, setIsResolvingAudio] = useState(false);
  const pendingVideoIdRef = useRef<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string>("3BFTio5296w");
  const loadedTrackIdRef = useRef<string | null>(null);

  // User-Initiated Pause Ref (distinguishes intentional pause vs browser/OS background suspension)
  const userRequestedPauseRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Synchronized Lyrics State
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

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

  // ─── Initialize Local Storage Data ──────────────────────────────────────────
  useEffect(() => {
    setLikedSongs(getLikedSongs());
    setLocalPlaylists(getLocalPlaylists());
    setRecentSearches(getRecentSearches());

    const savedQueue = getQueueState();
    if (savedQueue && savedQueue.items.length > 0) {
      setQueue(savedQueue.items);
      setQueueIndex(Math.min(savedQueue.currentIndex, savedQueue.items.length - 1));
      const initial = savedQueue.items[savedQueue.currentIndex];
      if (initial) {
        setCurrentTrack(initial);
        if (initial.youtubeVideoId) {
          setCurrentVideoId(initial.youtubeVideoId);
          pendingVideoIdRef.current = initial.youtubeVideoId;
        }
      }
    }
  }, []);

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
                pendingVideoIdRef.current = null;
                event.target.loadVideoById(vid);
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1: PLAYING, 2: PAUSED, 0: ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                userRequestedPauseRef.current = false;
                try {
                  const dur = event.target.getDuration();
                  if (dur > 0) setDuration(dur);
                } catch {}
              } else if (event.data === 2) {
                // Background playback protection: if browser/OS paused playback due to tab switch or app minimize, keep playing!
                if (typeof document !== "undefined" && document.hidden && !userRequestedPauseRef.current) {
                  try {
                    event.target.playVideo();
                    return;
                  } catch {}
                }
                setIsPlaying(false);
              } else if (event.data === 0) {
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
      if (typeof document !== "undefined" && document.hidden && isPlayingRef.current && !userRequestedPauseRef.current) {
        if (audioRef.current) {
          try {
            audioRef.current.play().catch(() => {});
          } catch {}
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
          setTimeout(() => {
            if (!userRequestedPauseRef.current && ytPlayerRef.current) {
              try {
                ytPlayerRef.current.playVideo();
              } catch {}
            }
          }, 150);
        }
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
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
    };
  }, []);

  // ─── Real-Time Scrubber & Duration Synchronizer ────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          const dur = ytPlayerRef.current.getDuration();
          if (typeof cur === "number" && !isNaN(cur)) setCurrentTime(cur);
          if (typeof dur === "number" && dur > 0 && !isNaN(dur)) setDuration(dur);
        } catch {}
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying]);

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
    setSearchQuery(query);
    setHasSearched(true);
    if (subTab !== "home") setSubTab("home");
    addRecentSearch(query.trim());
    setRecentSearches(getRecentSearches());
    fetchSpotifyMusic(query.trim(), "all", 50);
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    setHasSearched(true);
    if (subTab !== "home") setSubTab("home");
    addRecentSearch(term);
    setRecentSearches(getRecentSearches());
    fetchSpotifyMusic(term, "all", 50);
  };

  const handleResetToNewSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
    if (chatInputRef.current) {
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  };

  const handleSelectRecentSearch = (term: string) => {
    handleQuickSearch(term);
  };

  // ─── Audio Playback Logic (100% Full Song Streaming) ───────────────────────
  const playTrack = useCallback(async (track: MusicItem) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    userRequestedPauseRef.current = false;
    setCurrentTime(0);
    loadedTrackIdRef.current = track.id;

    // Keep mobile background audio alive by acquiring HTML5 audio session lock
    if (audioRef.current) {
      try {
        if (!audioRef.current.src || !audioRef.current.src.startsWith("data:audio")) {
          audioRef.current.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
          audioRef.current.loop = true;
        }
        audioRef.current.play().catch(() => {});
      } catch {}
    }

    // Update queue if track not in queue
    setQueue((prevQueue) => {
      const existingIdx = prevQueue.findIndex((item) => item.id === track.id);
      let newQueue = prevQueue;
      let newIdx = 0;
      if (existingIdx !== -1) {
        newIdx = existingIdx;
      } else {
        newQueue = [track, ...prevQueue];
        newIdx = 0;
      }
      setQueueIndex(newIdx);
      saveQueueState({ items: newQueue, currentIndex: newIdx, updatedAt: new Date().toISOString() });
      return newQueue;
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
        ytPlayerRef.current.loadVideoById({
          videoId: targetVideoId,
          startSeconds: 0,
        });
        ytPlayerRef.current.playVideo();
      } catch (err) {
        console.warn("ytPlayer loadVideoById error:", err);
      }
    } else {
      pendingVideoIdRef.current = targetVideoId;
    }
  }, []);

  const playAllTracks = (items: MusicItem[]) => {
    if (!items || items.length === 0) return;
    setQueue(items);
    setQueueIndex(0);
    saveQueueState({ items, currentIndex: 0, updatedAt: new Date().toISOString() });
    playTrack(items[0]);
  };

  const togglePlayPause = () => {
    if (!currentTrack) {
      if (tracks.length > 0) playTrack(tracks[0]);
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
                audioRef.current.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
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
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      try {
        ytPlayerRef.current.seekTo(newTime, true);
      } catch {}
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
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

  const playNext = () => {
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;
    if (currentQueue.length === 0) return;

    let nextIdx = currentIndex + 1;
    if (isShuffleRef.current) {
      nextIdx = Math.floor(Math.random() * currentQueue.length);
    } else if (nextIdx >= currentQueue.length) {
      nextIdx = repeatModeRef.current === "all" ? 0 : currentQueue.length - 1;
    }
    setQueueIndex(nextIdx);
    const nextTrack = currentQueue[nextIdx];
    if (nextTrack) playTrack(nextTrack);
  };

  const playPrevious = () => {
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;
    if (currentQueue.length === 0) return;

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = currentQueue.length - 1;
    }
    setQueueIndex(prevIdx);
    const prevTrack = currentQueue[prevIdx];
    if (prevTrack) playTrack(prevTrack);
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
            audioRef.current.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
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

      const res = await fetch(`/api/music/lyrics?${params.toString()}`);
      if (res.status === 429) {
        setLyricsError("Batas permintaan lirik tercapai. Coba lagi dalam beberapa saat.");
        setLyricsData(null);
        return;
      }

      const json = await res.json();
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
      setLyricsData(null);
      setLyricsError(err?.message || "Koneksi ke server lirik terputus.");
    } finally {
      setIsLoadingLyrics(false);
    }
  }, []);

  // Fetch lyrics whenever currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      fetchLyricsForTrack(currentTrack);
    }
  }, [currentTrack?.id, fetchLyricsForTrack]);

  // Compute active lyric index based on playback currentTime using O(log n) binary search
  const activeLyricIndex = useMemo(() => {
    if (!lyricsData || !lyricsData.synced || !lyricsData.lines || lyricsData.lines.length === 0) {
      return -1;
    }
    return findActiveLyricIndex(lyricsData.lines, currentTime);
  }, [lyricsData, currentTime]);

  // Auto-scroll to active lyric line (if user is not manually scrolling)
  useEffect(() => {
    if (showLyrics && !isUserScrolling && activeLineRef.current && activeLyricIndex >= 0) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLyricIndex, showLyrics, isUserScrolling]);

  // Handle manual scroll in lyrics container
  const handleLyricsScroll = () => {
    setIsUserScrolling(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    // Auto-resume after 4 seconds of idle scrolling
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
  };

  const resumeAutoScroll = () => {
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    setIsUserScrolling(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
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
        return {
          ...pl,
          items: [...pl.items, track],
          updatedAt: new Date().toISOString(),
        };
      }
      return pl;
    });
    setLocalPlaylists(updated);
    saveLocalPlaylists(updated);
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
  };

  const deletePlaylist = (playlistId: string) => {
    if (!confirm("Hapus playlist ini?")) return;
    const updated = localPlaylists.filter((pl) => pl.id !== playlistId);
    setLocalPlaylists(updated);
    saveLocalPlaylists(updated);
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
              if (!val.trim()) {
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
              <div className="relative shrink-0">
                {track.artworkUrl ? (
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                    </svg>
                  </div>
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
                  {track.artistNames.join(", ")}
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

              {/* Action buttons (Like & Playlist) */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => toggleLike(track)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isLiked ? "text-red-500 hover:scale-110" : "text-zinc-500 hover:text-white hover:bg-white/10"
                  }`}
                  title={isLiked ? "Hapus dari disukai" : "Sukai"}
                >
                  <svg className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {options?.showRemoveFromPlaylist && options.onRemoveFromPlaylist ? (
                  <button
                    type="button"
                    onClick={() => options.onRemoveFromPlaylist!(track.id)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    title="Hapus dari Playlist"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddToPlaylistTrack(track)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Tambahkan ke Playlist"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-hidden select-none font-sans bg-transparent ${
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

      {/* Background YouTube Audio Container (Placed in viewport to prevent mobile browser suspension) */}
      <div
        id="youtube-music-player-container"
        className="fixed bottom-0 right-0 w-1 h-1 pointer-events-none opacity-[0.001] z-[-1] overflow-hidden"
        aria-hidden="true"
      >
        <div id="youtube-music-player" />
      </div>

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
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
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

      {/* ─── MAIN FULL-WIDTH CONTENT AREA ───────────────────────────────────── */}
      <main
        className={`flex-1 flex flex-col min-h-0 overflow-y-auto bg-transparent ${
          searchQuery.trim() || subTab === "playlists" || showLyrics ? "pb-28" : "pb-2"
        }`}
      >
        {showLyrics ? (
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col px-4 sm:px-8 py-3 sm:py-6 h-full min-h-0 relative animate-in fade-in-0 duration-200">
            {/* Top Bar inside Lyrics: Track Meta & Utility */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
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
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base truncate">
                    {currentTrack?.title || "Tidak ada lagu yang dipilih"}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate">
                    {currentTrack?.artistNames.join(", ") || "Artis"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {isLoadingLyrics ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-500 dark:text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Memuat lirik dari LRCLIB...
                      </span>
                    ) : lyricsData?.synced ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-500 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Lirik Tersinkronisasi • LRCLIB
                      </span>
                    ) : lyricsData?.instrumental ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Instrumental
                      </span>
                    ) : lyricsData?.plainText ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Lirik Polos • LRCLIB
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                        Lirik tidak tersedia
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions: Copy lyrics & Close */}
              <div className="flex items-center gap-2 shrink-0">
                {(lyricsData?.plainText || (lyricsData?.lines && lyricsData.lines.length > 0)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const text = lyricsData.plainText || lyricsData.lines.map((l) => l.text).join("\n");
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(text);
                        setCopiedLyrics(true);
                        setTimeout(() => setCopiedLyrics(false), 2000);
                      }
                    }}
                    title="Salin lirik ke clipboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                      isDark
                        ? "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-white/5"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-black/5"
                    }`}
                  >
                    {copiedLyrics ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowLyrics(false)}
                  title="Tutup Lirik"
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition cursor-pointer ${
                    isDark
                      ? "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lyrics Content Body */}
            <div
              ref={lyricsContainerRef}
              onScroll={handleLyricsScroll}
              className="flex-1 overflow-y-auto min-h-0 py-10 sm:py-16 space-y-5 sm:space-y-7 text-center scroll-smooth relative select-none"
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

              {/* State 4: Synchronized Lyrics */}
              {!isLoadingLyrics && lyricsData?.synced && lyricsData.lines && lyricsData.lines.length > 0 && (
                lyricsData.lines.map((line, idx) => {
                  const isActive = activeLyricIndex === idx;
                  const isPast = activeLyricIndex > idx;
                  return (
                    <div
                      key={`${line.time}-${idx}`}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => seekToLyric(line.time)}
                      className={`cursor-pointer transition-all duration-300 px-4 py-2 sm:py-2.5 rounded-2xl mx-auto max-w-2xl ${
                        isActive
                          ? `text-xl sm:text-3xl font-black scale-105 sm:scale-108 tracking-tight ${
                              isDark
                                ? "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.45)]"
                                : "text-black drop-shadow-[0_0_16px_rgba(0,0,0,0.12)]"
                            }`
                          : isPast
                          ? `text-sm sm:text-base font-semibold opacity-35 hover:opacity-75 ${
                              isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"
                            }`
                          : `text-base sm:text-xl font-medium opacity-50 hover:opacity-85 ${
                              isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-black"
                            }`
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
                <div className="py-6 max-w-2xl mx-auto text-center space-y-4">
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
                      className={`text-base sm:text-lg font-medium ${
                        line.trim() === "" ? "h-4" : isDark ? "text-zinc-300" : "text-zinc-700"
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Floating Action Button: "Kembali ke lirik aktif" */}
            {isUserScrolling && activeLyricIndex >= 0 && lyricsData?.synced && (
              <div className="absolute bottom-6 inset-x-0 flex justify-center z-30 pointer-events-none animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                <button
                  type="button"
                  onClick={resumeAutoScroll}
                  className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isDark
                      ? "bg-zinc-800/95 text-white border border-white/10 hover:bg-zinc-700"
                      : "bg-white/95 text-black border border-black/10 hover:bg-zinc-100 shadow-zinc-900/10"
                  }`}
                >
                  <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Kembali ke lirik aktif</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`px-3.5 sm:px-8 flex-1 flex flex-col ${
              !searchQuery.trim() && subTab === "home"
                ? "justify-center items-center my-auto min-h-0"
                : "py-4 sm:py-6"
            }`}
          >
          {/* ─── TAB 1: MUSIK / SEARCH (Persistent Chat Box: Centered or Results List) ───────── */}
          {subTab === "home" && (
            <div
              className={`w-full max-w-4xl mx-auto flex-1 flex flex-col transition-all duration-200 ${
                !searchQuery.trim()
                  ? "justify-center items-center my-auto min-h-0 -translate-y-1 sm:-translate-y-2"
                  : "pt-2"
              }`}
            >
              {/* Initial Hero: Avatar & Greeting (Visible ONLY when search box is empty) */}
              {!searchQuery.trim() && (
                <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5 px-3 sm:px-4 animate-in fade-in-0 duration-200">
                  {/* Avatar Icon (Exact same blinking avatar from tab chat) */}
                  <div className="relative mb-3.5 sm:mb-4 flex items-center justify-center">
                    <Avatar
                      size="md"
                      shape="circle"
                      blinking={true}
                      color="white"
                      className="hover:scale-105 transition-transform"
                    />
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

              {/* Lower Section: Quick Inspiration Pills (When empty) OR Results & Tracks (When typed) */}
              {!searchQuery.trim() ? (
                <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 animate-in fade-in-0 duration-200">
                  {["Top Hits 2025", "Bernadya", "Pop Indonesia", "Billie Eilish", "Chill Vibes"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleQuickSearch(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                        isDark
                          ? "bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-black border-zinc-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
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
                    <div className="py-3 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                      {searchError}
                    </div>
                  )}

                  {/* Song List */}
                  {!isSearching && renderTrackTable(tracks)}
                </div>
              )}
            </div>
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
                      <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
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
                        className="p-2 rounded-xl border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition cursor-pointer"
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
                        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 group-hover:text-white transition">
                          Buka →
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-white">Lagu Disukai</h3>
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
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition"
                            title="Hapus Playlist"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-white truncate">{pl.name}</h3>
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

      {/* ─── PERSISTENT BOTTOM MINI-PLAYER (Premium Translucent Glass Finish) ─────── */}
      <footer
        className={`shrink-0 z-30 transition-all relative backdrop-blur-2xl border-t ${
          isDark
            ? "bg-[#121215]/65 border-white/[0.08] text-white shadow-[0_-12px_36px_rgba(0,0,0,0.45)]"
            : "bg-[#fafafc]/75 border-black/[0.06] text-zinc-900 shadow-[0_-12px_36px_rgba(0,0,0,0.04)]"
        } pb-[max(0.5rem,calc(env(safe-area-inset-bottom)+0.25rem))]`}
      >
        {/* ─── MOBILE VIEW (< sm): Compact 54px Row with Pinned Top Progress Bar ─ */}
        <div className="block sm:hidden">
          {/* Top Progress Bar */}
          <div
            className={`w-full h-1 cursor-pointer overflow-hidden relative ${isDark ? "bg-white/10" : "bg-black/10"}`}
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

          <div className="px-3.5 py-2 flex items-center justify-between gap-2.5">
            {/* Left: Thumbnail & Song Info */}
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
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none group"
              title={currentTrack ? `Putar ${currentTrack.title}` : undefined}
            >
              {currentTrack?.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                    isDark
                      ? "bg-zinc-800/70 border border-white/5 text-zinc-400"
                      : "bg-zinc-200/80 border border-black/5 text-zinc-500"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold truncate group-hover:underline">
                  {currentTrack?.title || "Belum ada trek diputar"}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  {currentTrack?.artistNames.join(", ") || "Pilih lagu untuk memulai"}
                </p>
              </div>
            </div>

            {/* Right: Like, Previous, Play/Pause, Next, Queue */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {currentTrack && (
                <button
                  type="button"
                  onClick={() => toggleLike(currentTrack)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isTrackLiked(currentTrack.id)
                      ? "text-red-500"
                      : isDark
                      ? "text-zinc-400 hover:text-white"
                      : "text-zinc-500 hover:text-black"
                  }`}
                  title="Sukai lagu"
                >
                  <svg className={`w-4.5 h-4.5 ${isTrackLiked(currentTrack.id) ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={playPrevious}
                className={`p-2 transition cursor-pointer ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"}`}
                title="Sebelumnya"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={togglePlayPause}
                disabled={isResolvingAudio}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                } ${isResolvingAudio ? "opacity-75 cursor-wait" : ""}`}
                title={isResolvingAudio ? "Memuat audio..." : isPlaying ? "Jeda" : "Putar"}
              >
                {isResolvingAudio ? (
                  <svg className="w-4.5 h-4.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6z M14 4h4v16h-4z" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <polygon points="6 4, 18 12, 6 20" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={playNext}
                className={`p-2 transition cursor-pointer ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"}`}
                title="Berikutnya"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

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
                title={showLyrics ? "Tutup Lirik" : "Lihat Lirik"}
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                </svg>
                {lyricsData?.synced && (
                  <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${isDark ? "bg-emerald-400" : "bg-emerald-600"}`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowQueueModal(true)}
                className={`p-2 transition cursor-pointer relative ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"}`}
                title="Antrean"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {queue.length > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
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
                  {currentTrack?.artistNames.join(", ") || "Pilih lagu untuk memulai"}
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
                      ? "text-red-500"
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
                  onClick={() => setIsShuffle((prev) => !prev)}
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
                  onClick={() =>
                    setRepeatMode((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"))
                  }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                </svg>
                {lyricsData?.synced && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isDark ? "bg-emerald-400" : "bg-emerald-600"}`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowQueueModal(true)}
                className={`p-2 transition cursor-pointer relative ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"}`}
                title="Antrean Putar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {queue.length > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
                )}
              </button>

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

      {/* ─── MODAL 2: QUEUE MODAL ────────────────────────────────────────────── */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl max-h-[80vh] flex flex-col ${
              isDark ? "bg-[#18181f] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Antrean Pemutaran ({queue.length})</h3>
                <p className="text-xs text-zinc-500">Daftar lagu yang akan diputar berikutnya</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setQueue([]);
                    saveQueueState({ items: [], currentIndex: 0, updatedAt: new Date().toISOString() });
                  }}
                  className="text-xs text-red-400 hover:underline cursor-pointer"
                >
                  Hapus Semua
                </button>
                <button
                  onClick={() => setShowQueueModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {queue.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    setQueueIndex(idx);
                    playTrack(item);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer ${
                    queueIndex === idx
                      ? "bg-white/10 border border-white/20 text-white font-bold"
                      : "hover:bg-zinc-800/60 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-zinc-500 w-4 text-center">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs truncate">{item.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{item.artistNames.join(", ")}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = queue.filter((_, i) => i !== idx);
                      setQueue(updated);
                      saveQueueState({ items: updated, currentIndex: Math.min(queueIndex, updated.length - 1), updatedAt: new Date().toISOString() });
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400"
                    title="Hapus dari antrean"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
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
    </div>
  );
}

export default MusicWorkspace;
