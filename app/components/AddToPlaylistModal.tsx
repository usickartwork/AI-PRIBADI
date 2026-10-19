"use client";

import React, { useState } from "react";
import { MusicItem, LocalPlaylist } from "@/lib/music";

interface AddToPlaylistModalProps {
  track: MusicItem | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  likedSongs: MusicItem[];
  localPlaylists: LocalPlaylist[];
  onToggleLike: (track: MusicItem) => void;
  onTogglePlaylistTrack: (playlistId: string, track: MusicItem) => void;
  onCreatePlaylist: (name: string, trackToAdd?: MusicItem) => void;
  userName?: string;
}

export function AddToPlaylistModal({
  track,
  isOpen,
  onClose,
  isDark,
  likedSongs,
  localPlaylists,
  onToggleLike,
  onTogglePlaylistTrack,
  onCreatePlaylist,
  userName = "Fsic",
}: AddToPlaylistModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [inlineName, setInlineName] = useState("");

  if (!isOpen || !track) return null;

  const isLiked = likedSongs.some((t) => t.id === track.id);

  const filteredPlaylists = localPlaylists.filter((pl) =>
    pl.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineName.trim()) return;
    onCreatePlaylist(inlineName.trim(), track);
    setInlineName("");
    setIsCreatingInline(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 select-none animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-h-[85vh] sm:max-h-[640px] sm:max-w-md rounded-t-[28px] sm:rounded-3xl border-t sm:border p-5 pb-7 sm:p-6 shadow-2xl flex flex-col gap-4 overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95 ${
          isDark
            ? "bg-[#121215] border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Grab Handle */}
        <div className="w-12 h-1 rounded-full bg-zinc-700/60 mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold tracking-tight">Add to playlist</h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {track.title} • {track.artistNames.join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition cursor-pointer shrink-0 ${
              isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-zinc-500 hover:text-black hover:bg-zinc-100"
            }`}
            title="Tutup"
            aria-label="Tutup"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar (Find a playlist) */}
        <div className="shrink-0 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find a playlist"
            className={`w-full rounded-xl pl-9 pr-3.5 py-2.5 text-xs outline-none border transition ${
              isDark
                ? "bg-zinc-900/90 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600"
                : "bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400"
            }`}
          />
        </div>

        {/* Action: + New playlist */}
        <div className="shrink-0">
          {!isCreatingInline ? (
            <button
              type="button"
              onClick={() => setIsCreatingInline(true)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer text-xs font-semibold ${
                isDark ? "hover:bg-zinc-800/60 text-zinc-200 hover:text-white" : "hover:bg-zinc-100 text-zinc-800 hover:text-black"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isDark ? "bg-zinc-800 border-zinc-700/80 text-white" : "bg-zinc-100 border-zinc-300 text-black"
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>New playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreateNew} className="flex items-center gap-2 p-1">
              <input
                type="text"
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
                placeholder="Nama playlist baru..."
                className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none border ${
                  isDark
                    ? "bg-zinc-900 border-zinc-700 text-white"
                    : "bg-zinc-100 border-zinc-300 text-zinc-900"
                }`}
                autoFocus
              />
              <button
                type="submit"
                disabled={!inlineName.trim()}
                className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                Buat
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingInline(false);
                  setInlineName("");
                }}
                className="p-2 rounded-xl text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Batal
              </button>
            </form>
          )}
        </div>

        {/* Scrollable List Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Section: Saved in (Liked Songs) */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
              Saved in
            </h4>
            <div
              onClick={() => onToggleLike(track)}
              className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer group ${
                isDark ? "hover:bg-zinc-800/50" : "hover:bg-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4b2bee] via-[#7343e6] to-[#8d67f5] flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-5 h-5 text-white fill-white" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold truncate">Liked Songs</p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    📌 {likedSongs.length} songs
                  </p>
                </div>
              </div>

              {/* Monochrome Checkmark Circle (NO GREEN) */}
              <div className="shrink-0 pl-2">
                {isLiked ? (
                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full border transition ${
                    isDark ? "border-zinc-600 group-hover:border-zinc-400" : "border-zinc-400 group-hover:border-zinc-600"
                  }`} />
                )}
              </div>
            </div>
          </div>

          {/* Section: Recently updated (User Playlists) */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
              Recently updated
            </h4>
            {filteredPlaylists.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                {searchQuery ? "Tidak ada playlist ditemukan" : "Belum ada playlist dibuat"}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredPlaylists.map((pl) => {
                  const isInPlaylist = pl.items.some((item) => item.id === track.id);
                  const coverImage = pl.items[0]?.artworkUrl;

                  return (
                    <div
                      key={pl.id}
                      onClick={() => onTogglePlaylistTrack(pl.id, track)}
                      className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer group ${
                        isDark ? "hover:bg-zinc-800/50" : "hover:bg-zinc-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center border border-white/5 shadow-xs">
                          {coverImage ? (
                            <img src={coverImage} alt={pl.name} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold truncate group-hover:text-white">
                            {pl.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {pl.items.length} songs
                          </p>
                        </div>
                      </div>

                      {/* Monochrome Checkmark Circle (NO GREEN) */}
                      <div className="shrink-0 pl-2">
                        {isInPlaylist ? (
                          <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-xs">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className={`w-6 h-6 rounded-full border transition ${
                            isDark ? "border-zinc-600 group-hover:border-zinc-400" : "border-zinc-400 group-hover:border-zinc-600"
                          }`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Cancel Button */}
        <div className="pt-2 border-t border-zinc-800/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
              isDark
                ? "border-zinc-800 hover:bg-zinc-800/80 text-zinc-300 hover:text-white"
                : "border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-black"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
