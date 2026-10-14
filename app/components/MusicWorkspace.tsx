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
      if (savedQueue.items[savedQueue.currentIndex]) {
        setCurrentTrack(savedQueue.items[savedQueue.currentIndex]);
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
            autoplay: 1,
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
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1: PLAYING, 2: PAUSED, 0: ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                try {
                  const dur = event.target.getDuration();
                  if (dur > 0) setDuration(dur);
                } catch {}
              } else if (event.data === 2) {
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
    setCurrentTime(0);

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
        }
      } catch (err) {
        console.warn("Failed to resolve audio for track:", err);
      } finally {
        setIsResolvingAudio(false);
      }
    }

    const targetVideoId = videoId || "3BFTio5296w";
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

    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
      try {
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
        return;
      } catch (err) {
        console.warn("togglePlay error:", err);
      }
    }

    setIsPlaying(!isPlaying);
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
  const renderSearchChatBox = (isTopBar: boolean = false) => (
    <div
      className={`prompt-bar-glow relative w-full ${
        isTopBar ? "rounded-[22px] sm:rounded-[26px]" : "rounded-[26px] sm:rounded-[28px]"
      } p-[1.5px] shadow-2xl transition-all`}
    >
      <div
        className={`w-full ${
          isTopBar ? "rounded-[20px] sm:rounded-[24px]" : "rounded-[24px] sm:rounded-[26px]"
        } border transition-all relative ${
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

          {/* Input Field */}
          <input
            ref={!isTopBar ? chatInputRef : undefined}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik lagu atau artis yang ingin kamu putar..."
            className={`flex-1 bg-transparent px-2 py-1.5 sm:py-2 text-sm sm:text-base outline-none leading-relaxed ${
              isDark ? "text-white placeholder-zinc-500" : "text-zinc-900 placeholder-zinc-400"
            }`}
            autoFocus={!isTopBar}
          />

          {/* Clear Input Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
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
                        <path d="M8 5v14l11-7z" />
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
      {/* Hidden Audio Player for audio previews */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 30);
          }
        }}
        onEnded={() => {
          if (repeatMode === "one") {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          } else {
            playNext();
          }
        }}
      />

      {/* Background YouTube Audio Container (Invisible offscreen to guarantee uninterrupted audio) */}
      <div
        id="youtube-music-player-container"
        className="fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div id="youtube-music-player" />
      </div>

      {/* ─── TOP HEADER BAR (Theme-Adaptive, Zero Clutter, Clean Mobile-Optimized) ─── */}
      <header
        className={`sticky top-0 z-20 backdrop-blur-xl px-3.5 sm:px-8 py-2.5 sm:py-3.5 border-b flex items-center justify-between gap-3 transition ${
          isDark ? "bg-[#121215]/85 border-zinc-800/80" : "bg-[#fafafc]/85 border-zinc-200/80"
        }`}
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

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md shrink-0 ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight truncate">Music</span>
          </div>
        </div>

        {/* Center: Clean 2-Tab Switcher (Musik & Playlist) */}
        <div
          className={`flex items-center p-1 rounded-2xl border backdrop-blur-md shrink-0 ${
            isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-zinc-200/80 border-zinc-300"
          }`}
        >
          <button
            onClick={() => {
              setSubTab("home");
              setSelectedLocalPlaylist(null);
              setIsViewingLiked(false);
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === "home"
                ? isDark
                  ? "bg-white text-black shadow-sm"
                  : "bg-black text-white shadow-sm"
                : isDark
                ? "text-zinc-400 hover:text-white"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
            </svg>
            <span>Musik</span>
          </button>

          <button
            onClick={() => {
              setSubTab("playlists");
              setSelectedLocalPlaylist(null);
              setIsViewingLiked(false);
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === "playlists"
                ? isDark
                  ? "bg-white text-black shadow-sm"
                  : "bg-black text-white shadow-sm"
                : isDark
                ? "text-zinc-400 hover:text-white"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Playlist</span>
            {likedSongs.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === "playlists"
                  ? isDark ? "bg-black/15 text-black" : "bg-white/20 text-white"
                  : "bg-zinc-700 text-zinc-300"
              }`}>
                {likedSongs.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Setup Modal & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowSetupModal(true)}
            title="Pengaturan Spotify API"
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark
                ? "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Tutup Musik"
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-black"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN FULL-WIDTH CONTENT AREA ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-28 bg-transparent">
        <div className="px-3.5 sm:px-8 py-4 sm:py-6 flex-1 flex flex-col">
          {/* ─── TAB 1: MUSIK / SEARCH (Centered Chat Box or Song List) ───────── */}
          {subTab === "home" && (
            <>
              {/* STATE 1: Empty / Centered Chat Box ("Tampilan Obrolan Baru di Tab Chat") */}
              {!hasSearched && !searchQuery.trim() ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-8 sm:py-16 px-3 sm:px-4 max-w-2xl mx-auto w-full animate-in fade-in-0 duration-300">
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
                  <p className={`mt-2 mb-6 sm:mb-8 text-xs sm:text-sm font-medium max-w-md px-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Ketik judul lagu, musisi, atau genre untuk memutar musik langsung.
                  </p>

                  {/* Centered Chat Box Card */}
                  <div className="w-full">
                    {renderSearchChatBox(false)}
                  </div>

                  {/* Subtle Quick Inspiration Pills */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {["Top Hits 2025", "Bernadya", "Pop Indonesia", "Billie Eilish", "Chill Vibes"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleQuickSearch(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                          isDark
                            ? "bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-black border-zinc-200"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* STATE 2: Song Results List with Pinned Top Chat Box */
                <div className="space-y-5 animate-in fade-in-0 duration-200 w-full max-w-5xl mx-auto">
                  {/* Sticky Top Chat Box */}
                  <div className="max-w-2xl mx-auto w-full sticky top-0 z-20 pt-1 pb-3 backdrop-blur-md">
                    {renderSearchChatBox(true)}
                  </div>

                  {/* Results Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-zinc-800/40 pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">
                        {searchQuery ? `Hasil: "${searchQuery}"` : "Daftar Lagu Spotify"}
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
                        Pencarian Baru
                      </button>

                      {tracks.length > 0 && (
                        <button
                          onClick={() => playAllTracks(tracks)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-md"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
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
            </>
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
                          <path d="M8 5v14l11-7z" />
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
                            <path d="M8 5v14l11-7z" />
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">Koleksi & Playlist</h2>
                      <p className="text-xs text-zinc-500">Daftar putar pribadi yang kamu simpan</p>
                    </div>
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
      </main>

      {/* ─── PERSISTENT BOTTOM MINI-PLAYER (Mobile-Optimized Dual-Mode) ─────── */}
      <footer
        className={`shrink-0 border-t z-30 transition relative ${
          isDark
            ? "bg-[#141419]/95 border-zinc-800/80 shadow-2xl shadow-black"
            : "bg-white/95 border-zinc-200 shadow-lg"
        } pb-[max(0.5rem,calc(env(safe-area-inset-bottom)+0.25rem))]`}
      >
        {/* ─── MOBILE VIEW (< sm): Compact 54px Row with Pinned Top Progress Bar ─ */}
        <div className="block sm:hidden">
          {/* Top Progress Bar */}
          <div
            className="w-full h-1 bg-zinc-800/60 cursor-pointer overflow-hidden relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              handleSeek(pct * duration);
            }}
          >
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
            />
          </div>

          <div className="px-3.5 py-2 flex items-center justify-between gap-2.5">
            {/* Left: Thumbnail & Song Info */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {currentTrack?.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold truncate">
                  {currentTrack?.title || "Belum ada trek diputar"}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  {currentTrack?.artistNames.join(", ") || "Pilih lagu untuk memulai"}
                </p>
              </div>
            </div>

            {/* Right: Like, Previous, Play/Pause, Next, Queue */}
            <div className="flex items-center gap-1 shrink-0">
              {currentTrack && (
                <button
                  type="button"
                  onClick={() => toggleLike(currentTrack)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isTrackLiked(currentTrack.id) ? "text-red-500" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Sukai lagu"
                >
                  <svg className={`w-4 h-4 ${isTrackLiked(currentTrack.id) ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={playPrevious}
                className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Sebelumnya"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={togglePlayPause}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
                  isDark ? "bg-white text-black" : "bg-black text-white"
                }`}
                title={isPlaying ? "Jeda" : "Putar"}
              >
                {isPlaying ? (
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={playNext}
                className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Berikutnya"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setShowQueueModal(true)}
                className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer relative"
                title="Antrean"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {queue.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── DESKTOP VIEW (>= sm): Full 3-Column Experience ────────────────── */}
        <div className="hidden sm:block px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Metadata */}
            <div className="flex items-center gap-3 w-1/4 min-w-0">
              {currentTrack?.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  {currentTrack?.title || "Belum ada trek yang diputar"}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate">
                  {currentTrack?.artistNames.join(", ") || "Pilih lagu untuk memulai"}
                </p>
              </div>
              {currentTrack && (
                <button
                  type="button"
                  onClick={() => toggleLike(currentTrack)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isTrackLiked(currentTrack.id)
                      ? "text-red-500"
                      : "text-zinc-500 hover:text-white"
                  }`}
                  title="Sukai lagu"
                >
                  <svg className={`w-4 h-4 ${isTrackLiked(currentTrack.id) ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Center: Controls & Interactive Timeline Slider */}
            <div className="flex flex-col items-center gap-1.5 w-1/2 max-w-xl">
              <div className="flex items-center gap-4">
                {/* Shuffle */}
                <button
                  type="button"
                  onClick={() => setIsShuffle((prev) => !prev)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isShuffle ? "text-white bg-white/10" : "text-zinc-500 hover:text-white"
                  }`}
                  title="Shuffle"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>

                {/* Previous */}
                <button
                  type="button"
                  onClick={playPrevious}
                  className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Sebelumnya"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* Play / Pause button */}
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className={`p-3 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer ${
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  }`}
                  title={isPlaying ? "Jeda" : "Putar"}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current translate-x-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button
                  type="button"
                  onClick={playNext}
                  className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Berikutnya"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                {/* Repeat */}
                <button
                  type="button"
                  onClick={() =>
                    setRepeatMode((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"))
                  }
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    repeatMode !== "off" ? "text-white bg-white/10 font-bold" : "text-zinc-500 hover:text-white"
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Progress Bar Slider (Clean White Accent) */}
              <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-zinc-500">
                <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}</span>
                <div
                  className="flex-1 h-1.5 rounded-full bg-zinc-700/50 relative overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const newTime = pct * duration;
                    handleSeek(newTime);
                  }}
                >
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
                  />
                </div>
                <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</span>
              </div>
            </div>

            {/* Right: Queue & Volume */}
            <div className="flex items-center justify-end gap-2.5 w-1/4">
              <button
                type="button"
                onClick={() => setShowQueueModal(true)}
                className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer relative"
                title="Antrean Putar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />
                )}
              </button>

              {/* Volume control */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="w-16 h-1 rounded-full bg-zinc-700 accent-white cursor-pointer"
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
