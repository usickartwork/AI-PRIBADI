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
        className={`flex flex-col h-full w-full overflow-hidden transition-colors duration-300 ${
          isDark ? "bg-[#0B0B0D] text-white" : "bg-[#E5E5E5] text-[#111113]"
        }`}
      >
        {/* ─── WORKSPACE TOP BAR (SubTabs Game / Faith + Close) ──────────── */}
        {subTabsElement && (
          <header className="shrink-0 w-full z-20 flex items-center justify-between px-3.5 sm:px-6 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2.5 min-w-0">
              {onTogglePanel && (
                <button
                  type="button"
                  onClick={onTogglePanel}
                  className={`flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                    isDark
                      ? "bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white"
                      : "bg-white/80 hover:bg-white border border-black/10 text-zinc-800 hover:text-black"
                  }`}
                  title="Menu Panel"
                  aria-label="Menu Panel"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              {subTabsElement}
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                  isDark
                    ? "bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white"
                    : "bg-white/80 hover:bg-white border border-black/10 text-zinc-700 hover:text-black"
                }`}
                title="Kembali ke Chats"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </header>
        )}

        {/* ─── NATIVE FAITH HUB BODY ───────────────────────────────────────── */}
        <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col items-center justify-center sm:px-4 sm:pb-3">
          {/* Tanya Rohani */}
          <div className={`h-full w-full ${activeTab === "tanya" ? "flex flex-col flex-1 min-h-0 items-center justify-center" : "hidden"}`}>
            <FaithChatView />
          </div>

          {/* Alkitab */}
          <div className={`h-full w-full ${activeTab === "bible" ? "flex flex-col flex-1 min-h-0 items-center justify-center" : "hidden"}`}>
            <FaithBibleView />
          </div>

          {/* Faith Arcade */}
          <div className={`h-full w-full ${activeTab === "games" ? "flex flex-col flex-1 min-h-0 items-center justify-center" : "hidden"}`}>
            {activeTab === "games" && <FaithGamesView />}
          </div>

          {/* Catatan Khotbah */}
          <div className={`h-full w-full ${activeTab === "notes" ? "flex flex-col flex-1 min-h-0 items-center justify-center" : "hidden"}`}>
            {activeTab === "notes" && <FaithNotesView />}
          </div>

          {/* Pokok Doa */}
          <div className={`h-full w-full ${activeTab === "prayer" ? "flex flex-col flex-1 min-h-0 items-center justify-center" : "hidden"}`}>
            {activeTab === "prayer" && <FaithPrayerView />}
          </div>

          {/* Profil Komunitas CG */}
          <div className={`h-full w-full ${activeTab === "profile" ? "flex flex-col flex-1 min-h-0 items-center justify-center" : "hidden"}`}>
            {activeTab === "profile" && <FaithProfileView />}
          </div>
        </div>
      </div>
    </FaithNavProvider>
  );
}
