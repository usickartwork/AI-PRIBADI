"use client";

import React, { useState } from "react";
import { FaithNavProvider, FaithTabType } from "@/lib/faith/navigationContext";
import FaithChatView from "@/app/components/faith/views/FaithChatView";
import FaithBibleView from "@/app/components/faith/views/FaithBibleView";
import FaithGamesView from "@/app/components/faith/views/FaithGamesView";
import FaithNotesView from "@/app/components/faith/views/FaithNotesView";
import FaithPrayerView from "@/app/components/faith/views/FaithPrayerView";
import FaithProfileView from "@/app/components/faith/views/FaithProfileView";

interface FaithWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  onTogglePanel?: () => void;
  subTabsElement?: React.ReactNode;
}

export function FaithWorkspace({
  isDark,
  onClose,
  onTogglePanel,
  subTabsElement,
}: FaithWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<FaithTabType>("tanya");

  return (
    <FaithNavProvider
      value={{
        activeTab,
        setActiveTab,
        onTogglePanel,
        onClose,
        isDark,
      }}
    >
      <div
        className={`flex flex-col h-full w-full overflow-hidden transition-colors duration-200 ${
          isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#fafafc] text-zinc-900"
        }`}
      >
        {/* ─── WORKSPACE TOP BAR (Floating Liquid Glass matching GameWorkspace & ChatWorkspace) ─── */}
        <header
          className={`shrink-0 w-full z-20 flex items-center justify-between px-3.5 sm:px-6 py-2 pt-[max(0.6rem,env(safe-area-inset-top))] bg-transparent ${
            isDark ? "text-white" : "text-zinc-900"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Hamburger toggle button */}
            {onTogglePanel && (
              <button
                type="button"
                onClick={onTogglePanel}
                className={`flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                  isDark
                    ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                    : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
                }`}
                title="Menu Panel"
                aria-label="Menu Panel"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Sub Tabs Switcher: Game & Faith (passed from page.tsx) */}
            {subTabsElement || (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border ${
                  isDark
                    ? "bg-zinc-900/60 border-white/10 text-zinc-200 shadow-black/30"
                    : "bg-white/70 border-black/10 text-zinc-800 shadow-zinc-900/5"
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full shadow-xs shrink-0 ${
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  <svg className="w-3 h-3 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 3v18M7 8h10" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-tight">Faith Hub</span>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Close / Return to chats */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                  isDark
                    ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-300 hover:text-white shadow-black/40"
                    : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-700 hover:text-black shadow-zinc-900/10"
                }`}
                title="Kembali ke Chats"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* ─── NATIVE FAITH HUB BODY ───────────────────────────────────────── */}
        <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col">
          {/* Tanya Rohani (kept mounted to preserve chat streaming & message drafts) */}
          <div className={`h-full w-full ${activeTab === "tanya" ? "flex flex-col flex-1 min-h-0" : "hidden"}`}>
            <FaithChatView />
          </div>

          {/* Alkitab (kept mounted to preserve chapter reading position and verse selection) */}
          <div className={`h-full w-full ${activeTab === "bible" ? "flex flex-col flex-1 min-h-0" : "hidden"}`}>
            <FaithBibleView />
          </div>

          {/* Faith Arcade (FaithQuiz, FaithPet, Church Builder) */}
          <div className={`h-full w-full ${activeTab === "games" ? "flex flex-col flex-1 min-h-0" : "hidden"}`}>
            {activeTab === "games" && <FaithGamesView />}
          </div>

          {/* Catatan Khotbah & Renungan */}
          <div className={`h-full w-full ${activeTab === "notes" ? "flex flex-col flex-1 min-h-0" : "hidden"}`}>
            {activeTab === "notes" && <FaithNotesView />}
          </div>

          {/* Pokok Doa & Syukur */}
          <div className={`h-full w-full ${activeTab === "prayer" ? "flex flex-col flex-1 min-h-0" : "hidden"}`}>
            {activeTab === "prayer" && <FaithPrayerView />}
          </div>

          {/* Profil Komunitas CG */}
          <div className={`h-full w-full ${activeTab === "profile" ? "flex flex-col flex-1 min-h-0" : "hidden"}`}>
            {activeTab === "profile" && <FaithProfileView />}
          </div>
        </div>
      </div>
    </FaithNavProvider>
  );
}
