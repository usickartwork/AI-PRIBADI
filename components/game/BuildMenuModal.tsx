"use client";

import React from "react";
import { BUILD_TYPES, ITEMS, recipeFor, type BuildType, type ItemId } from "@/lib/game/survival/data";
import { ItemIcon } from "./GameIcons";

interface BuildMenuModalProps {
  onClose: () => void;
  onSelect: (type: BuildType) => void;
  countItem: (id: ItemId) => number;
  nearWorkbench: boolean;
  isDark?: boolean;
}

export function BuildMenuModal({
  onClose,
  onSelect,
  countItem,
  nearWorkbench,
  isDark = true,
}: BuildMenuModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-150">
      <div
        className={`relative w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isDark
            ? "bg-[#18181b]/95 border-zinc-700/80 text-zinc-100 shadow-black/80"
            : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-500/20">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Menu Bangunan (Building)</h2>
              <span className="text-[11px] text-zinc-400">Pilih struktur untuk dipasang ke dalam dunia</span>
            </div>
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

        {/* Pieces Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BUILD_TYPES.map((type) => {
              const def = ITEMS[type];
              const have = countItem(type);
              const r = recipeFor(type);
              let canAutoCraft = false;

              if (r) {
                let enough = true;
                if (r.needsWorkbench && !nearWorkbench) enough = false;
                for (const [mid, need] of Object.entries(r.cost) as [ItemId, number][]) {
                  if (countItem(mid) < need) enough = false;
                }
                canAutoCraft = enough;
              }

              const isAvailable = have > 0 || canAutoCraft;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onSelect(type);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between text-left transition cursor-pointer group ${
                    isAvailable
                      ? "border-zinc-700 bg-zinc-800/40 hover:bg-blue-500/10 hover:border-blue-500/50"
                      : "border-zinc-800 bg-zinc-900/30 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/60 text-zinc-300 group-hover:text-blue-400 group-hover:border-blue-500/40 transition">
                      <ItemIcon id={type} className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm">{def.name}</div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        {have > 0 ? (
                          <span className="text-emerald-400 font-mono font-bold">Stok: {have}</span>
                        ) : canAutoCraft ? (
                          <span className="text-blue-400 font-mono font-semibold">Siap craft otomatis</span>
                        ) : (
                          <span className="text-zinc-500">
                            Butuh: {r ? Object.entries(r.cost).map(([k, v]) => `${v} ${ITEMS[k as ItemId].name}`).join(", ") : "-"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 font-medium text-zinc-300 group-hover:bg-blue-600 group-hover:text-white transition">
                    Pilih
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-zinc-500/20 bg-zinc-500/5 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Gunakan <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">R</kbd> untuk memutar dan <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Q</kbd> untuk membatalkan</span>
          <span>Klik kiri atau tombol Pasang untuk menempatkan</span>
        </div>
      </div>
    </div>
  );
}

