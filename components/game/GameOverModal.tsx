"use client";

import React from "react";

interface GameOverModalProps {
  day: number;
  survivedTime: number;
  deaths: number;
  onRespawn: () => void;
  onRestart: () => void;
  onExitMenu: () => void;
  isDark?: boolean;
}

export function GameOverModal({
  day,
  survivedTime,
  deaths,
  onRespawn,
  onRestart,
  onExitMenu,
  isDark = true,
}: GameOverModalProps) {
  const mins = Math.floor(survivedTime / 60);
  const secs = Math.floor(survivedTime % 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-lg animate-in fade-in-0 duration-300">
      <div
        className={`relative w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col overflow-hidden text-center p-6 sm:p-8 ${
          isDark
            ? "bg-[#18181b]/95 border-rose-900/40 text-zinc-100 shadow-rose-950/40"
            : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
        }`}
      >
        <div className="mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-3 text-rose-500">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-rose-500">KAMU TUMBANG</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Hutan terlalu ganas. Berhati-hatilah dengan rasa lapar dan satwa liar!
          </p>
        </div>

        {/* Stats card */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 mb-5 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Hari Bertahan:</span>
            <span className="font-bold text-zinc-200">Hari ke-{day}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Durasi Sesi:</span>
            <span className="font-bold text-zinc-200">{mins} Menit {secs} Detik</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Total Kematian:</span>
            <span className="font-bold text-rose-400">{deaths + 1}×</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onRespawn}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            Bangkit Kembali (Respawn di Kemah)
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold text-xs transition cursor-pointer"
          >
            Mulai Ulang Dunia Baru (Reset)
          </button>

          <button
            type="button"
            onClick={onExitMenu}
            className="w-full py-2.5 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-medium transition cursor-pointer"
          >
            Kembali ke Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
}

