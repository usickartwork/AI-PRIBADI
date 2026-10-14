"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MusicItem,
  LocalPlaylist,
  QueueState,
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

// Curated fallback starter tracks for initial preview
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
];

export function MusicWorkspace({ isDark, onClose, onTogglePanel, userName }: MusicWorkspaceProps) {
  // Navigation & View State (Strictly 3 tabs: home, search, playlists)
  const [subTab, setSubTab] = useState<SubTab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSpotifyConfigured, setIsSpotifyConfigured] = useState<boolean | null>(null);

  // Music Catalog State
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

  // Modals & Drawers
  const [showLyricsModal, setShowLyricsModal] = useState(false);
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

  // ─── Initial Spotify Search / Catalog Fetch ─────────────────────────────────
  const fetchSpotifyMusic = useCallback(async (query: string = "") => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}&limit=20`);
      const json = await res.json();

      setIsSpotifyConfigured(json.configured ?? false);

      if (json.success && json.data) {
        setTracks(json.data.tracks || []);
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

  useEffect(() => {
    fetchSpotifyMusic();
  }, [fetchSpotifyMusic]);

  // ─── Debounced Search ───────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim()) {
      if (subTab !== "search") setSubTab("search");
      if (selectedLocalPlaylist) setSelectedLocalPlaylist(null);
      if (isViewingLiked) setIsViewingLiked(false);
    }

    if (!val.trim()) {
      fetchSpotifyMusic("");
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      addRecentSearch(val.trim());
      setRecentSearches(getRecentSearches());
      fetchSpotifyMusic(val.trim());
    }, 350);
  };

  const handleSelectRecentSearch = (term: string) => {
    setSearchQuery(term);
    if (subTab !== "search") setSubTab("search");
    if (selectedLocalPlaylist) setSelectedLocalPlaylist(null);
    if (isViewingLiked) setIsViewingLiked(false);
    fetchSpotifyMusic(term);
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

  // Featured Hero Item for Home Tab
  const heroTrack = useMemo(() => {
    return tracks[0] || FEATURED_STARTER_TRACKS[0];
  }, [tracks]);

  // ─── Reusable Track List Table (Theme Styled, Zero Emojis) ──────────────────
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
      <div className="space-y-1">
        {/* Track Table Header */}
        <div
          className={`grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl ${
            isDark ? "text-zinc-500 bg-zinc-900/40" : "text-zinc-400 bg-zinc-100/60"
          }`}
        >
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5 sm:col-span-5">TITLE</div>
          <div className="hidden sm:block sm:col-span-3">ALBUM</div>
          <div className="col-span-4 sm:col-span-2 text-right">TIME</div>
          <div className="col-span-2 sm:col-span-1 text-center">ACTION</div>
        </div>

        {/* Track Rows */}
        {items.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isTrackPlaying = isCurrent && isPlaying;
          const isLiked = isTrackLiked(track.id);

          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => playTrack(track)}
              className={`grid grid-cols-12 gap-3 items-center px-4 py-2.5 rounded-2xl transition cursor-pointer group ${
                isCurrent
                  ? isDark
                    ? "bg-zinc-800/80 border border-zinc-700/80 shadow-md"
                    : "bg-zinc-200/80 border border-zinc-300"
                  : isDark
                  ? "hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800"
                  : "hover:bg-zinc-100/80 border border-transparent"
              }`}
            >
              {/* # Index / Play State */}
              <div className="col-span-1 flex items-center justify-center text-xs font-bold text-zinc-500">
                {isTrackPlaying ? (
                  <div className="flex items-end gap-0.5 h-3.5">
                    <span className="w-1 bg-white rounded-full animate-bounce h-3" />
                    <span className="w-1 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1 bg-white rounded-full animate-bounce h-3.5" style={{ animationDelay: "0.4s" }} />
                  </div>
                ) : (
                  <span className="group-hover:hidden">{idx + 1}</span>
                )}
                {!isTrackPlaying && (
                  <span className="hidden group-hover:block text-zinc-300">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Title + Thumbnail + Artist */}
              <div className="col-span-5 sm:col-span-5 flex items-center gap-3 min-w-0">
                {track.artworkUrl ? (
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <h4
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      isCurrent ? "text-white font-bold" : isDark ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {track.artistNames.join(", ")}
                  </p>
                </div>
              </div>

              {/* Album Title */}
              <div className="hidden sm:block sm:col-span-3 text-xs text-zinc-400 truncate">
                {track.albumTitle || "—"}
              </div>

              {/* Duration */}
              <div className="col-span-4 sm:col-span-2 text-right text-xs font-medium text-zinc-400">
                {track.durationMs ? formatDurationMs(track.durationMs) : "3:30"}
              </div>

              {/* Actions: Heart + Add to Playlist + Optional Remove */}
              <div
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => toggleLike(track)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isLiked
                      ? "text-red-500 hover:scale-110"
                      : "text-zinc-500 hover:text-white"
                  }`}
                  title={isLiked ? "Hapus dari disukai" : "Sukai"}
                >
                  <svg className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {options?.showRemoveFromPlaylist && options.onRemoveFromPlaylist ? (
                  <button
                    onClick={() => options.onRemoveFromPlaylist!(track.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition cursor-pointer"
                    title="Hapus dari Playlist"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setAddToPlaylistTrack(track)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition cursor-pointer"
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
      className={`relative w-full h-full flex flex-col overflow-hidden select-none font-sans ${
        isDark ? "bg-[#0c0c0e] text-zinc-100" : "bg-[#f5f5f7] text-zinc-900"
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

      {/* ─── MAIN WORKSPACE BODY (SIDEBAR + CONTENT) ─────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ─── LEFT SUB-SIDEBAR (Strictly 3 Navigation Panels) ───────────────── */}
        <aside
          className={`w-56 sm:w-64 shrink-0 flex flex-col justify-between p-4 border-r transition-all z-10 ${
            isDark
              ? "bg-[#121216]/95 border-zinc-800/80 shadow-2xl shadow-black/50"
              : "bg-white/95 border-zinc-200/80 shadow-md"
          }`}
        >
          <div className="space-y-6">
            {/* Header / Brand */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-extrabold tracking-tight">Usick Music</h2>
                  <p className="text-[10px] text-zinc-500 font-medium">Spotify Discovery</p>
                </div>
              </div>

              {/* Settings button */}
              <button
                onClick={() => setShowSetupModal(true)}
                title="Pengaturan Spotify"
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-600"
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
            </div>

            {/* Navigation Menu List: Strictly 3 Tabs (Home, Search, Playlist) */}
            <nav className="space-y-1 text-xs font-semibold">
              {/* 1. Home */}
              <button
                onClick={() => {
                  setSubTab("home");
                  setSelectedLocalPlaylist(null);
                  setIsViewingLiked(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  subTab === "home"
                    ? isDark
                      ? "bg-white/10 text-white font-bold"
                      : "bg-black/10 text-black font-bold"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </button>

              {/* 2. Search */}
              <button
                onClick={() => {
                  setSubTab("search");
                  setSelectedLocalPlaylist(null);
                  setIsViewingLiked(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  subTab === "search"
                    ? isDark
                      ? "bg-white/10 text-white font-bold"
                      : "bg-black/10 text-black font-bold"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>

              {/* 3. Playlist */}
              <button
                onClick={() => {
                  setSubTab("playlists");
                  setSelectedLocalPlaylist(null);
                  setIsViewingLiked(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  subTab === "playlists"
                    ? isDark
                      ? "bg-white/10 text-white font-bold"
                      : "bg-black/10 text-black font-bold"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                  </svg>
                  <span>Playlist</span>
                </div>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreatePlaylistModal(true);
                  }}
                  title="Buat Playlist Baru"
                  className="p-1 hover:scale-110 transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
            </nav>
          </div>

          {/* Bottom Settings & Back Buttons */}
          <div className="pt-4 border-t border-zinc-800/60 space-y-1">
            <button
              onClick={() => setShowSetupModal(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800/60" : "text-zinc-600 hover:text-black hover:bg-zinc-100"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Spotify Settings</span>
            </button>

            <button
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Back to Chats</span>
            </button>
          </div>
        </aside>

        {/* ─── RIGHT MAIN VIEW AREA ───────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-28">
          {/* Top Bar: Hamburger, Search, API Configuration status */}
          <div className="sticky top-0 z-20 backdrop-blur-md px-4 sm:px-8 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 transition">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              {onTogglePanel && (
                <button
                  onClick={onTogglePanel}
                  title="Toggle Sidebar"
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}

              {/* Search Bar Input */}
              <div className="relative flex-1 max-w-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (subTab !== "search") setSubTab("search");
                  }}
                  placeholder="Cari lagu, artis, album, atau genre..."
                  className={`w-full rounded-2xl border pl-10 pr-9 py-2 text-xs sm:text-sm outline-none transition ${
                    isDark
                      ? "bg-zinc-900/90 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
                      : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                  }`}
                />
                <svg
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Right Status / Setup Button (Clean Theme Colors, No Emote, No Emerald) */}
            <div className="flex items-center gap-2">
              {isSpotifyConfigured === false && (
                <button
                  onClick={() => setShowSetupModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    isDark
                      ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                      : "bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                  <span>Setup API</span>
                </button>
              )}
            </div>
          </div>

          {/* ─── CONTENT AREA (Organized strictly into 3 Tabs) ────────────────── */}
          <div className="px-4 sm:px-8 py-6 space-y-8">
            {/* Background YouTube Audio Container (Invisible offscreen to guarantee uninterrupted audio) */}
            <div
              id="youtube-music-player-container"
              className="fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <div id="youtube-music-player" />
            </div>

            {/* ─── TAB 1: HOME ────────────────────────────────────────────────── */}
            {subTab === "home" && (
              <div className="space-y-8 animate-in fade-in-0 duration-200">
                {/* Hero Banner */}
                <div
                  className={`relative rounded-3xl overflow-hidden p-6 sm:p-10 border shadow-2xl transition ${
                    isDark ? "bg-[#18181f] border-zinc-800" : "bg-zinc-900 text-white border-zinc-800"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-10" />
                  {heroTrack.artworkUrl && (
                    <img
                      src={heroTrack.artworkUrl}
                      alt={heroTrack.title}
                      className="absolute right-0 top-0 h-full w-2/3 object-cover object-center filter blur-xs opacity-40 scale-105 pointer-events-none"
                    />
                  )}

                  <div className="relative z-20 max-w-lg space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white backdrop-blur-md">
                      Featured Track
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                      {heroTrack.title}
                    </h1>
                    <p className="text-xs sm:text-sm font-medium text-zinc-300">
                      Oleh <span className="text-white font-bold">{heroTrack.artistNames.join(", ")}</span> • Album {heroTrack.albumTitle || "Single"}
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => playTrack(heroTrack)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm hover:scale-105 transition shadow-lg cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>Play Track</span>
                      </button>

                      <button
                        onClick={() => toggleLike(heroTrack)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                          isTrackLiked(heroTrack.id)
                            ? "bg-red-500/20 border-red-500 text-red-400"
                            : "border-white/20 hover:bg-white/10 text-white"
                        }`}
                        title="Suka lagu ini"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>

                      <a
                        href={heroTrack.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-semibold text-white hover:bg-white/10 transition"
                      >
                        <span>Open Spotify</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Track Catalog */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">New Music</h2>
                      <p className="text-xs text-zinc-500">
                        {tracks.length} trek musik pilihan dari katalog Spotify
                      </p>
                    </div>
                  </div>

                  {renderTrackTable(tracks)}
                </div>
              </div>
            )}

            {/* ─── TAB 2: SEARCH ──────────────────────────────────────────────── */}
            {subTab === "search" && (
              <div className="space-y-6 animate-in fade-in-0 duration-200">
                {/* Mood & Genre Shortcuts (Clean Text Pills, Zero Emojis) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Mood & Genre Shortcuts
                  </h3>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {MOOD_SHORTCUTS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => handleSearchChange(mood.query)}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition cursor-pointer ${
                          searchQuery.toLowerCase() === mood.query.toLowerCase()
                            ? "bg-white text-black border-white"
                            : isDark
                            ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                            : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black"
                        }`}
                      >
                        {mood.label}
                      </button>
                    ))}
                    {SPOTIFY_GENRES.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => handleSearchChange(genre.label)}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition cursor-pointer ${
                          searchQuery.toLowerCase() === genre.label.toLowerCase()
                            ? "bg-white text-black border-white"
                            : isDark
                            ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                            : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black"
                        }`}
                      >
                        {genre.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Searches (if available) */}
                {recentSearches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Pencarian Terakhir
                      </span>
                      <button
                        onClick={() => {
                          clearRecentSearches();
                          setRecentSearches([]);
                        }}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                      >
                        Hapus Riwayat
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSelectRecentSearch(term)}
                          className={`px-3 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                            isDark
                              ? "border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-black hover:bg-zinc-100"
                          }`}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results / Header */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">
                        {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : "Katalog Spotify"}
                      </h2>
                      <p className="text-xs text-zinc-500">
                        {isSearching
                          ? "Mencari musik..."
                          : searchQuery
                          ? `${tracks.length} lagu ditemukan`
                          : "Pilih mood di atas atau cari judul lagu di kolom pencarian"}
                      </p>
                    </div>
                  </div>

                  {/* Loading indicator */}
                  {isSearching && (
                    <div className="flex items-center gap-2 py-8 justify-center text-xs text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
                      <span>Mencari di katalog Spotify...</span>
                    </div>
                  )}

                  {/* Error display */}
                  {searchError && (
                    <div className="py-4 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                      {searchError}
                    </div>
                  )}

                  {/* Empty state when no tracks found */}
                  {!isSearching && tracks.length === 0 && (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-300">
                        {searchQuery ? `Tidak ada lagu ditemukan untuk "${searchQuery}"` : "Cari Musik"}
                      </h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        {searchQuery
                          ? "Coba periksa ejaan atau gunakan kata kunci judul lagu dan nama penyanyi lainnya."
                          : "Ketik judul lagu, penyanyi, atau album pada kolom pencarian di atas."}
                      </p>
                    </div>
                  )}

                  {!isSearching && tracks.length > 0 && renderTrackTable(tracks)}
                </div>
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
      </div>

      {/* ─── PERSISTENT BOTTOM MINI-PLAYER (Theme Styled: Zero Emojis, No Emerald) ─ */}
      <footer
        className={`shrink-0 border-t z-30 px-4 sm:px-8 py-3 backdrop-blur-xl transition ${
          isDark
            ? "bg-[#141419]/95 border-zinc-800/80 shadow-2xl shadow-black"
            : "bg-white/95 border-zinc-200 shadow-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Current Track Thumbnail & Metadata */}
          <div className="flex items-center gap-3 w-full sm:w-1/4 min-w-0">
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
                onClick={() => toggleLike(currentTrack)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isTrackLiked(currentTrack.id)
                    ? "text-red-500"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <svg className={`w-4 h-4 ${isTrackLiked(currentTrack.id) ? "fill-current" : ""}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Center: Playback Controls & Interactive Timeline Slider */}
          <div className="flex flex-col items-center gap-1.5 w-full sm:w-1/2">
            <div className="flex items-center gap-4">
              {/* Shuffle */}
              <button
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

          {/* Right: Lyrics, Queue, Volume */}
          <div className="flex items-center justify-end gap-2.5 w-full sm:w-1/4">
            <button
              onClick={() => setShowLyricsModal(true)}
              className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Lirik"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>

            <button
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
                onClick={toggleMute}
                className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
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

      {/* ─── MODAL 2: LYRICS MODAL (Custom Microphone SVG, Zero Emojis) ─────── */}
      {showLyricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark ? "bg-[#18181f] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Lirik Lagu</h3>
                <p className="text-xs text-zinc-500">{currentTrack?.title} — {currentTrack?.artistNames.join(", ")}</p>
              </div>
              <button
                onClick={() => setShowLyricsModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold">Lirik Terlisensi Belum Tersedia</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Sesuai ketentuan hak cipta Spotify Web API dan lisensi resmi, lirik lengkap dilindungi hak cipta penerbit.
              </p>
              <div className="pt-2">
                <a
                  href={currentTrack?.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-700 text-xs font-semibold hover:bg-zinc-800 transition text-zinc-200"
                >
                  <span>Buka Lirik di Spotify App</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: QUEUE MODAL ────────────────────────────────────────────── */}
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

      {/* ─── MODAL 4: CREATE / ADD TO PLAYLIST MODAL ─────────────────────────── */}
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
