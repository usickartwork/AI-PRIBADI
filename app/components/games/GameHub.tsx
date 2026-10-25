"use client";

import React, { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import {
  loadChessPreferences,
  loadPlatformerRecords,
} from "./common/gameStorage";

// Lazy loading kedua game secara independen (client-only, ssr: false)
const ChessArena = dynamic(() => import("./chess/ChessArena"), {
  ssr: false,
  loading: () => <GameLoadingPlaceholder gameName="Chess Arena" />,
});

const PixelPlatformer = dynamic(() => import("./platformer/PixelPlatformer"), {
  ssr: false,
  loading: () => <GameLoadingPlaceholder gameName="Pixel Platformer" />,
});

interface GameHubProps {
  isDark?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
  onTogglePanel?: () => void;
  subTabsElement?: React.ReactNode;
}

function GameLoadingPlaceholder({ gameName }: { gameName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 animate-pulse text-center">
      <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3 shadow-lg">
        <svg className="w-6 h-6 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      </div>
      <p className="text-sm font-semibold text-zinc-300">Memuat {gameName}...</p>
      <p className="text-xs text-zinc-500 mt-1">Menyiapkan aset 3D offline terisolasi</p>
    </div>
  );
}

export const GameHub: React.FC<GameHubProps> = ({
  isDark = true,
  onClose,
  onTogglePanel,
  subTabsElement,
}) => {
  const [activeGame, setActiveGame] = useState<"hub" | "chess" | "platformer">("hub");

  // Load quick preview stats
  const chessPrefs = loadChessPreferences();
  const platformerRecords = loadPlatformerRecords();

  if (activeGame === "chess") {
    return (
      <Suspense fallback={<GameLoadingPlaceholder gameName="Chess Arena" />}>
        <ChessArena isDark={isDark} onBackToHub={() => setActiveGame("hub")} />
      </Suspense>
    );
  }

  if (activeGame === "platformer") {
    return (
      <Suspense fallback={<GameLoadingPlaceholder gameName="Pixel Platformer" />}>
        <PixelPlatformer isDark={isDark} onBackToHub={() => setActiveGame("hub")} />
      </Suspense>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full overflow-y-auto ${isDark ? "bg-[#121215] text-zinc-100" : "bg-[#fafafc] text-zinc-900"}`}>
      {/* Top Navigation Bar (Harmonisasi dengan Floating App Bar Usick One) */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-3.5 sm:px-6 py-2.5 border-b backdrop-blur-md ${isDark ? "bg-[#121215]/85 border-white/10" : "bg-white/85 border-black/10"}`}>
        <div className="flex items-center gap-2.5">
          {onTogglePanel && (
            <button
              onClick={onTogglePanel}
              className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 md:hidden ${
                isDark
                  ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                  : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
              }`}
              title="Menu Panel"
              aria-label="Menu Panel"
            >
              <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${isDark ? "bg-zinc-800 text-white border border-white/10" : "bg-zinc-100 text-black border border-black/10"}`}>
              🎮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight">Game Center</h1>
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isDark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                  Offline-First
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Usick One Single-Player Offline Games</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {subTabsElement}
          {onClose && (
            <button
              onClick={onClose}
              className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                  : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
              }`}
              title="Tutup Game Center"
              aria-label="Tutup Game Center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Hub Content Area */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center">
        {/* Hero Section Banner */}
        <div className="text-center max-w-xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border bg-zinc-800/30 dark:border-zinc-800 border-zinc-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-zinc-400">100% Bebas Kuota & Tanpa Akun Tambahan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2.5">
            Pilih Permainan Anda
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Game arcade 3D dan strategi catur offline berkinerja tinggi yang dibangun langsung di dalam Usick One tanpa membebani browser Anda.
          </p>
        </div>

        {/* 2 Featured Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Card 1: Chess Arena */}
          <div
            onClick={() => setActiveGame("chess")}
            className={`group relative rounded-3xl p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:scale-[1.01] ${
              isDark
                ? "bg-zinc-900/60 hover:bg-zinc-900 border-white/10 hover:border-white/20 shadow-xl shadow-black/40"
                : "bg-white hover:bg-zinc-50 border-black/10 hover:border-black/20 shadow-xl shadow-zinc-900/5"
            }`}
          >
            {/* Top Card Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border transition group-hover:scale-105 ${
                    isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-100 border-zinc-300 text-black"
                  }`}>
                    ♟️
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight group-hover:text-amber-400 transition">
                      Chess Arena
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        Offline Ready
                      </span>
                      <span className="text-[10px] text-zinc-500">• AI Engine</span>
                    </div>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition group-hover:translate-x-1 ${
                  isDark ? "border-zinc-700 text-zinc-400 group-hover:text-white" : "border-zinc-300 text-zinc-600 group-hover:text-black"
                }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                &ldquo;Challenge your mind.&rdquo; Uji strategi catur Anda melawan engine kecerdasan buatan Usick AI dengan tingkat kesulitan Easy, Medium, dan Hard.
              </p>

              {/* Light Visual Preview: Mini Stylized Chessboard */}
              <div className="w-full h-32 rounded-2xl overflow-hidden border border-zinc-800/80 relative mb-5 flex items-center justify-center bg-[#1c1c1f]">
                <div className="grid grid-cols-6 grid-rows-4 w-full h-full opacity-40 group-hover:opacity-60 transition duration-300">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className={
                        (Math.floor(i / 6) + (i % 6)) % 2 === 0
                          ? "bg-[#eeeed2]/80"
                          : "bg-[#4a7c59]/80"
                      }
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-4 text-3xl drop-shadow-md select-none">
                  <span className="group-hover:-translate-y-1 transition duration-300">♙</span>
                  <span className="group-hover:scale-110 transition duration-300 text-4xl">♚</span>
                  <span className="group-hover:-translate-y-1 transition duration-300">♟</span>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer with Quick Record & Play Button */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200/40 dark:border-zinc-800/60">
              <div className="text-[11px] text-zinc-500">
                <span>Rekor: </span>
                <span className="font-semibold text-emerald-400">{chessPrefs.stats.wins} Menang</span>
                <span className="mx-1">•</span>
                <span>{chessPrefs.stats.losses} Kalah</span>
              </div>
              <button className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
              }`}>
                <span>Play Now</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 2: Pixel Platformer (2D Arcade) */}
          <div
            onClick={() => setActiveGame("platformer")}
            className={`group relative rounded-3xl p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:scale-[1.01] ${
              isDark
                ? "bg-zinc-900/60 hover:bg-zinc-900 border-white/10 hover:border-white/20 shadow-xl shadow-black/40"
                : "bg-white hover:bg-zinc-50 border-black/10 hover:border-black/20 shadow-xl shadow-zinc-900/5"
            }`}
          >
            {/* Top Card Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border transition group-hover:scale-105 ${
                    isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-100 border-zinc-300 text-black"
                  }`}>
                    🕹️
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight group-hover:text-emerald-400 transition">
                      Pixel Platformer
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        Offline Ready
                      </span>
                      <span className="text-[10px] text-zinc-500">• 2D Arcade</span>
                    </div>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition group-hover:translate-x-1 ${
                  isDark ? "border-zinc-700 text-zinc-400 group-hover:text-white" : "border-zinc-300 text-zinc-600 group-hover:text-black"
                }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Side-scroller retro 2D pixel-art dengan aksi lompat presisi, koin berkilau, musuh cyber, dan 3 level bertingkat penuh rintangan seru.
              </p>

              {/* Light Visual Preview: Stylized 2D Pixel Platformer */}
              <div className="w-full h-32 rounded-2xl overflow-hidden border border-zinc-800/80 relative mb-5 flex items-center justify-center bg-[#070c14]">
                <svg className="w-full h-full p-2 opacity-85 group-hover:opacity-100 transition duration-300" viewBox="0 0 300 120" fill="none">
                  {/* Sky Stars */}
                  <rect x="30" y="20" width="2" height="2" fill="#ffffff" opacity="0.6" />
                  <rect x="90" y="35" width="2" height="2" fill="#ffffff" opacity="0.4" />
                  <rect x="180" y="15" width="2" height="2" fill="#ffffff" opacity="0.8" />
                  <rect x="250" y="40" width="2" height="2" fill="#ffffff" opacity="0.5" />
                  {/* Distant Hills */}
                  <path d="M 0 90 Q 60 65 140 85 Q 220 60 300 80 L 300 120 L 0 120 Z" fill="#0d1b2a" />
                  {/* Ground Platforms */}
                  <rect x="10" y="85" width="90" height="35" rx="3" fill="#0b261b" stroke="#10b981" strokeWidth="2" />
                  <rect x="130" y="65" width="80" height="18" rx="3" fill="#0b261b" stroke="#10b981" strokeWidth="2" />
                  <rect x="235" y="80" width="60" height="40" rx="3" fill="#0b261b" stroke="#10b981" strokeWidth="2" />
                  {/* Spikes in pit */}
                  <polygon points="105,120 112,105 120,120" fill="#f43f5e" />
                  <polygon points="115,120 122,105 130,120" fill="#f43f5e" />
                  {/* Floating Gold Coin */}
                  <circle cx="170" cy="45" r="7" fill="#fbbf24" stroke="#fef3c7" strokeWidth="1.5" className="animate-pulse" />
                  <rect x="168" y="40" width="4" height="10" fill="#fef3c7" />
                  {/* Pixel Runner Character */}
                  <rect x="50" y="62" width="12" height="16" rx="2" fill="#06b6d4" />
                  <rect x="52" y="56" width="10" height="8" rx="1" fill="#1e293b" />
                  <rect x="57" y="58" width="5" height="3" fill="#38bdf8" />
                  <rect x="46" y="61" width="5" height="3" fill="#ec4899" />
                  {/* Goal Flag */}
                  <rect x="270" y="45" width="3" height="35" fill="#64748b" />
                  <polygon points="273,47 290,55 273,63" fill="#10b981" />
                </svg>
              </div>
            </div>

            {/* Bottom Card Footer with Quick Record & Play Button */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200/40 dark:border-zinc-800/60">
              <div className="text-[11px] text-zinc-500">
                <span>Progress: </span>
                <span className="font-semibold text-emerald-400">
                  Level {platformerRecords.highestLevelUnlocked} / 3
                </span>
                <span className="mx-1.5">•</span>
                <span className="text-amber-400">🪙 {platformerRecords.totalCoinsCollected}</span>
              </div>
              <button className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
              }`}>
                <span>Play Now</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>Tersimpan Otomatis di LocalStorage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>Dukungan Desktop & Sentuh Mobile</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>Grafis Pixel Art 60 FPS Canvas 2D</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHub;
