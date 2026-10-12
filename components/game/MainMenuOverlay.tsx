"use client";

import React, { useState } from "react";
import type { SaveMeta } from "@/lib/game/survival/storage";

interface MainMenuOverlayProps {
  meta: SaveMeta | null;
  onContinue: () => void;
  onNewGame: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  isDark?: boolean;
}

export function MainMenuOverlay({
  meta,
  onContinue,
  onNewGame,
  onOpenHowToPlay,
  onOpenSettings,
  isDark = true,
}: MainMenuOverlayProps) {
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const mins = meta ? Math.floor(meta.survived / 60) : 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] select-none pointer-events-auto">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Logo / Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3 tracking-widest uppercase">
            <span>🌲 3D Survival RPG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            USICK SURVIVAL
          </h1>
          <p className="text-xs text-zinc-300 mt-1 max-w-xs drop-shadow">
            Kumpulkan sumber daya, buat perkakas, bangun shelter, dan bertahan hidup di hutan liar.
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="w-full space-y-3">
          {meta && !confirmOverwrite && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition cursor-pointer shadow-xl shadow-emerald-600/30 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Lanjutkan Game</span>
              </div>
              <span className="text-xs text-emerald-100 font-normal">
                Hari ke-{meta.day} ({mins}m)
              </span>
            </button>
          )}

          {confirmOverwrite ? (
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-rose-500/40 text-left space-y-3 animate-in fade-in-0 duration-150">
              <div className="text-xs font-bold text-rose-400">
                Peringatan: Progres Tersimpan Akan Direset!
              </div>
              <p className="text-[11px] text-zinc-300">
                Memulai game baru akan menimpa progres Hari ke-{meta?.day}. Apakah kamu yakin ingin memulai dari awal?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOverwrite(false);
                    onNewGame();
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer text-center"
                >
                  Ya, Mulai Baru
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOverwrite(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition cursor-pointer text-center"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (meta) setConfirmOverwrite(true);
                else onNewGame();
              }}
              className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                meta
                  ? "bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/80 text-zinc-200"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>{meta ? "Mulai Game Baru" : "Mulai Petualangan"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="w-full py-3 px-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/80 text-zinc-300 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Panduan & Kontrol</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full py-3 px-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/80 text-zinc-300 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Pengaturan</span>
          </button>
        </div>

        {/* Local & Offline info badge */}
        <div className="mt-8 flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Penyimpanan Lokal Aktif</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Mendukung Mode Offline</span>
          </span>
        </div>
      </div>
    </div>
  );
}

