"use client";

import React, { useState } from "react";
import type { GameSettings } from "@/lib/game/survival/storage";

interface SettingsModalProps {
  settings: GameSettings;
  onSave: (newSettings: GameSettings) => void;
  onClose: () => void;
  isDark?: boolean;
}

export function SettingsModal({
  settings,
  onSave,
  onClose,
  isDark = true,
}: SettingsModalProps) {
  const [local, setLocal] = useState<GameSettings>({ ...settings });

  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-150">
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark
            ? "bg-[#18181b]/95 border-zinc-700/80 text-zinc-100 shadow-black/80"
            : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-500/20">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-zinc-500/10 text-zinc-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Pengaturan Game</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-500/20 text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-4">
          {/* Audio toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Audio & Efek Suara</div>
              <div className="text-xs text-zinc-400">Suara hutan, tebangan, langkah, dan api</div>
            </div>
            <button
              type="button"
              onClick={() => handleChange("audio", !local.audio)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                local.audio ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  local.audio ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Volume slider */}
          {local.audio && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Volume</span>
                <span className="font-mono text-zinc-200">{Math.round(local.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={local.volume}
                onChange={(e) => handleChange("volume", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          )}

          {/* Quality preset */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
            <div>
              <div className="text-sm font-semibold">Kualitas Grafis</div>
              <div className="text-xs text-zinc-400">Bayangan real-time & kerapatan rumput</div>
            </div>
            <div className="flex rounded-lg bg-zinc-800 p-0.5 border border-zinc-700">
              <button
                type="button"
                onClick={() => handleChange("quality", "low")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  local.quality === "low"
                    ? "bg-zinc-700 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Hemat
              </button>
              <button
                type="button"
                onClick={() => handleChange("quality", "high")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  local.quality === "high"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Tinggi
              </button>
            </div>
          </div>

          {/* Sensitivity */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-700/50">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Sensitivitas Kamera</span>
              <span className="font-mono text-zinc-200">{Math.round(local.sensitivity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.0"
              step="0.1"
              value={local.sensitivity}
              onChange={(e) => handleChange("sensitivity", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Invert Y */}
          <div className="flex items-center justify-between">
            <div className="text-sm">Invert Kamera Vertikal (Y-Axis)</div>
            <input
              type="checkbox"
              checked={local.invertY}
              onChange={(e) => handleChange("invertY", e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* FPS Counter */}
          <div className="flex items-center justify-between">
            <div className="text-sm">Tampilkan FPS Counter</div>
            <input
              type="checkbox"
              checked={local.showFps}
              onChange={(e) => handleChange("showFps", e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-500/20 bg-zinc-500/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

