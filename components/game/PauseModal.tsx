"use client";

import React from "react";

interface PauseModalProps {
  onResume: () => void;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onSaveAndExit: () => void;
  isSaving: boolean;
  day: number;
  survivedTime: number;
  isDark?: boolean;
}

export function PauseModal({
  onResume,
  onOpenInventory,
  onOpenCrafting,
  onOpenSettings,
  onOpenHowToPlay,
  onSaveAndExit,
  isSaving,
  day,
  survivedTime,
  isDark = true,
}: PauseModalProps) {
  const mins = Math.floor(survivedTime / 60);
  const secs = Math.floor(survivedTime % 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-150">
      <div
        className={`relative w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col overflow-hidden text-center p-6 ${
          isDark
            ? "bg-[#18181b]/95 border-zinc-700/80 text-zinc-100 shadow-black/80"
            : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
        }`}
      >
        <div className="mb-4">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-800 border border-zinc-700/60 mb-2 text-zinc-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Game Dijeda</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Hari ke-{day} • Bertahan {mins}m {secs}s
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            Lanjutkan Bermain (Resume)
          </button>

          <button
            type="button"
            onClick={onOpenInventory}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-sm transition cursor-pointer"
          >
            Inventaris Tas (I)
          </button>

          <button
            type="button"
            onClick={onOpenCrafting}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-sm transition cursor-pointer"
          >
            Crafting Menu (C)
          </button>

          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-sm transition cursor-pointer"
          >
            Panduan & Kontrol
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-sm transition cursor-pointer"
          >
            Pengaturan Game
          </button>

          <button
            type="button"
            onClick={onSaveAndExit}
            disabled={isSaving}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold text-sm transition cursor-pointer"
          >
            {isSaving ? "Menyimpan progres..." : "Simpan & Keluar ke Menu"}
          </button>
        </div>

        <div className="mt-5 text-[11px] text-zinc-500">
          Tekan <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Esc</kbd> untuk kembali bermain
        </div>
      </div>
    </div>
  );
}

