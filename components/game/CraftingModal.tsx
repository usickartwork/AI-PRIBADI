"use client";

import React, { useState } from "react";
import {
  ITEMS,
  RECIPES,
  RECIPE_CATEGORIES,
  type ItemId,
  type Recipe,
  type RecipeCategory,
} from "@/lib/game/survival/data";
import { ItemIcon } from "./GameIcons";

interface CraftingModalProps {
  onClose: () => void;
  onCraft: (recipeId: string) => { ok: boolean; reason?: string };
  countItem: (id: ItemId) => number;
  nearWorkbench: boolean;
  isDark?: boolean;
}

export function CraftingModal({
  onClose,
  onCraft,
  countItem,
  nearWorkbench,
  isDark = true,
}: CraftingModalProps) {
  const [activeCategory, setActiveCategory] = useState<RecipeCategory>("Tools");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("r_axe");
  const [craftMsg, setCraftMsg] = useState<{ text: string; good: boolean } | null>(null);

  const categoryRecipes = RECIPES.filter((r) => r.category === activeCategory);
  const selectedRecipe = RECIPES.find((r) => r.id === selectedRecipeId) || categoryRecipes[0] || RECIPES[0];
  const outputDef = ITEMS[selectedRecipe.output];

  // Check requirements
  const missingMaterials: { id: ItemId; have: number; need: number }[] = [];
  let canCraft = true;

  for (const [id, need] of Object.entries(selectedRecipe.cost) as [ItemId, number][]) {
    const have = countItem(id);
    if (have < need) {
      canCraft = false;
      missingMaterials.push({ id, have, need });
    }
  }

  const workbenchBlocked = selectedRecipe.needsWorkbench && !nearWorkbench;
  if (workbenchBlocked) {
    canCraft = false;
  }

  const handleCraft = () => {
    const res = onCraft(selectedRecipe.id);
    if (res.ok) {
      setCraftMsg({ text: `Berhasil membuat ${outputDef.name}!`, good: true });
    } else {
      setCraftMsg({ text: res.reason || "Crafting gagal", good: false });
    }
    setTimeout(() => setCraftMsg(null), 3000);
  };

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
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Crafting Menu</h2>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className={`inline-block w-2 h-2 rounded-full ${nearWorkbench ? "bg-emerald-400" : "bg-zinc-600"}`} />
                <span>{nearWorkbench ? "Dekat Basic Workbench (Resep lanjutan terbuka)" : "Resep dasar (Bangun Workbench untuk pintu & atap)"}</span>
              </div>
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

        {/* Category Tabs */}
        <div className="flex px-4 sm:px-5 pt-3 gap-1.5 sm:gap-2 border-b border-zinc-500/20 overflow-x-auto pb-2 scrollbar-none">
          {RECIPE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  const firstInCat = RECIPES.find((r) => r.category === cat);
                  if (firstInCat) setSelectedRecipeId(firstInCat.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-500/10"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col md:flex-row gap-5">
          {/* Recipe List */}
          <div className="flex-1 flex flex-col gap-2">
            {categoryRecipes.map((r) => {
              const def = ITEMS[r.output];
              const isSelected = r.id === selectedRecipe.id;

              // quick check if craftable
              let craftable = true;
              if (r.needsWorkbench && !nearWorkbench) craftable = false;
              for (const [mid, need] of Object.entries(r.cost) as [ItemId, number][]) {
                if (countItem(mid) < need) craftable = false;
              }

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRecipeId(r.id)}
                  className={`w-full p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10"
                      : "border-zinc-500/20 bg-zinc-500/5 hover:bg-zinc-500/10 hover:border-zinc-500/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                      <ItemIcon id={r.output} className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                        <span>{def.name}</span>
                        {r.qty > 1 && <span className="text-zinc-500 font-mono">×{r.qty}</span>}
                      </div>
                      <span className="text-[11px] text-zinc-400">{def.kind}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {r.needsWorkbench && !nearWorkbench && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-amber-500/30">
                        Workbench
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        craftable ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {craftable ? "Siap" : "Bahan Kurang"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Recipe Details & Cost */}
          <div
            className={`w-full md:w-72 rounded-xl border p-4 flex flex-col justify-between ${
              isDark ? "bg-zinc-900/60 border-zinc-700/60" : "bg-zinc-100/70 border-zinc-200"
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <ItemIcon id={selectedRecipe.output} className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {outputDef.name} {selectedRecipe.qty > 1 ? `×${selectedRecipe.qty}` : ""}
                  </h3>
                  <span className="text-[11px] font-medium text-amber-400 capitalize">{outputDef.kind}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed min-h-[44px]">
                {outputDef.description}
              </p>

              {workbenchBlocked && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Butuh Basic Workbench di dekat pemain untuk membuat resep ini.</span>
                </div>
              )}

              {/* Material cost list */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Bahan yang Dibutuhkan
                </span>
                <div className="space-y-1.5">
                  {Object.entries(selectedRecipe.cost).map(([rawId, need]) => {
                    const mid = rawId as ItemId;
                    const mDef = ITEMS[mid];
                    const have = countItem(mid);
                    const enough = have >= need;

                    return (
                      <div
                        key={mid}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                          enough
                            ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200"
                            : "bg-rose-500/5 border-rose-500/20 text-rose-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ItemIcon id={mid} className="w-4 h-4 text-zinc-400" />
                          <span>{mDef.name}</span>
                        </div>
                        <span className="font-mono font-bold">
                          {have} / {need}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Notification / Craft button */}
            <div className="mt-4 pt-3 border-t border-zinc-500/20 flex flex-col gap-2">
              {craftMsg && (
                <div
                  className={`text-xs p-2 rounded-lg text-center font-medium ${
                    craftMsg.good ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {craftMsg.text}
                </div>
              )}

              <button
                type="button"
                onClick={handleCraft}
                disabled={!canCraft}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  canCraft
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Buat Sekarang ({selectedRecipe.qty}×)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-zinc-500/20 bg-zinc-500/5 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Kumpulkan Wood, Stone, dan Fiber di hutan untuk memulai</span>
          <span>Tekan <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Esc / C</kbd> untuk menutup</span>
        </div>
      </div>
    </div>
  );
}

