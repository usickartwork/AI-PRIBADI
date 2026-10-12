"use client";

import React, { useState } from "react";
import { ITEMS, TUNING, type ItemId } from "@/lib/game/survival/data";
import type { InvSlot } from "@/lib/game/survival/storage";
import { ItemIcon } from "./GameIcons";

interface InventoryModalProps {
  inventory: (InvSlot | null)[];
  hotbarIndex: number;
  onClose: () => void;
  onUse: (slot: number) => void;
  onEquip: (slot: number) => void;
  onDrop: (slot: number) => void;
  isDark?: boolean;
}

export function InventoryModal({
  inventory,
  hotbarIndex,
  onClose,
  onUse,
  onEquip,
  onDrop,
  isDark = true,
}: InventoryModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);

  const selectedItem = selectedSlot !== null ? inventory[selectedSlot] : null;
  const itemDef = selectedItem ? ITEMS[selectedItem.id] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-150">
      <div
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
          isDark
            ? "bg-[#18181b]/95 border-zinc-700/80 text-zinc-100 shadow-black/80"
            : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-500/20">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Inventaris Pemain</h2>
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

        {/* Content: Grid on left/top, Details on right/bottom */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col md:flex-row gap-5">
          {/* Inventory Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Tas ({inventory.filter(Boolean).length}/{TUNING.inventorySize})
              </span>
              <span className="text-[11px] text-zinc-500">Slot 1–5 terhubung ke Hotbar</span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              {inventory.map((slot, idx) => {
                const isSelected = selectedSlot === idx;
                const isHotbar = idx < TUNING.hotbarSize;
                const isCurrentHotbar = idx === hotbarIndex;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSlot(idx)}
                    className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition cursor-pointer select-none group ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10"
                        : isCurrentHotbar
                        ? "border-amber-500/80 bg-amber-500/5 hover:border-amber-400"
                        : "border-zinc-500/20 bg-zinc-500/5 hover:bg-zinc-500/10 hover:border-zinc-500/40"
                    }`}
                  >
                    {isHotbar && (
                      <span className="absolute top-1 left-1.5 text-[10px] font-mono font-bold text-zinc-500">
                        {idx + 1}
                      </span>
                    )}

                    {slot ? (
                      <>
                        <ItemIcon id={slot.id} className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-200 group-hover:scale-105 transition" />
                        <span className="absolute bottom-1 right-1.5 text-[11px] font-bold font-mono px-1 rounded bg-black/60 text-white">
                          {slot.qty}
                        </span>
                      </>
                    ) : (
                      <span className="text-zinc-600/40 text-xs font-mono">•</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Details Panel */}
          <div
            className={`w-full md:w-64 rounded-xl border p-4 flex flex-col justify-between ${
              isDark ? "bg-zinc-900/60 border-zinc-700/60" : "bg-zinc-100/70 border-zinc-200"
            }`}
          >
            {itemDef && selectedItem ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ItemIcon id={itemDef.id} className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base leading-tight">{itemDef.name}</h3>
                    <span className="text-[11px] font-medium text-emerald-400 capitalize">
                      {itemDef.kind} • Max {itemDef.maxStack}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed min-h-[48px]">
                  {itemDef.description}
                </p>

                {itemDef.food && (
                  <div className="flex items-center gap-3 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                    <span className="text-amber-400 flex items-center gap-1">
                      🍗 +{itemDef.food.hunger} Hunger
                    </span>
                    {itemDef.food.health !== 0 && (
                      <span className={itemDef.food.health > 0 ? "text-emerald-400" : "text-rose-400"}>
                        ❤️ {itemDef.food.health > 0 ? `+${itemDef.food.health}` : itemDef.food.health} HP
                      </span>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-zinc-500 font-mono">
                  Jumlah: <span className="text-zinc-200 font-bold">{selectedItem.qty}</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-xs">Pilih slot untuk melihat rincian item.</p>
              </div>
            )}

            {/* Action buttons */}
            {selectedSlot !== null && selectedItem && (
              <div className="mt-4 pt-3 border-t border-zinc-500/20 flex flex-col gap-2">
                {itemDef?.food ? (
                  <button
                    type="button"
                    onClick={() => onUse(selectedSlot)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Makan</span>
                  </button>
                ) : itemDef?.kind === "build" ? (
                  <button
                    type="button"
                    onClick={() => {
                      onUse(selectedSlot);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Mulai Pasang (Build)</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => onEquip(selectedSlot)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-xs font-semibold transition cursor-pointer"
                >
                  Pindahkan ke Hotbar
                </button>

                <button
                  type="button"
                  onClick={() => onDrop(selectedSlot)}
                  className="w-full py-1.5 px-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition cursor-pointer"
                >
                  Jatuhkan ke Tanah
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-zinc-500/20 bg-zinc-500/5 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Tekan <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">1–5</kbd> untuk memilih hotbar</span>
          <span>Tekan <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Esc / I</kbd> untuk menutup</span>
        </div>
      </div>
    </div>
  );
}

