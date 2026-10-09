"use client";

import { useState, useRef } from "react";

interface FaithWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  onTogglePanel?: () => void;
}

const FAITH_URL = "https://faith-hub-rho.vercel.app";

export function FaithWorkspace({
  isDark,
  onClose,
  onTogglePanel,
}: FaithWorkspaceProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(FAITH_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden bg-transparent ${
      isDark ? "text-zinc-100" : "text-zinc-900"
    }`}>
      {/* ─── HEADER BAR (Clean, Floating Liquid-Glass Serasi Tab Chat) ─────────── */}
      <header className={`shrink-0 w-full z-20 flex items-center justify-between px-3.5 sm:px-6 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] bg-transparent ${
        isDark ? "text-white" : "text-zinc-900"
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger toggle button (liquid glass circle identik tab chat) */}
          {onTogglePanel && (
            <button
              onClick={onTogglePanel}
              className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
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

          {/* Cross Logo & Title (liquid glass capsule) */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border ${
            isDark
              ? "bg-zinc-900/60 border-white/10 text-zinc-200 shadow-black/30"
              : "bg-white/70 border-black/10 text-zinc-800 shadow-zinc-900/5"
          }`}>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full shadow-xs shrink-0 ${
              isDark ? "bg-white text-black" : "bg-black text-white"
            }`}>
              <svg className="w-3.5 h-3.5 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 3v18M7 8h10" />
              </svg>
            </div>
            <span className={`text-xs sm:text-sm font-semibold tracking-tight block truncate ${isDark ? "text-white" : "text-black"}`}>
              Faith Hub
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Refresh Iframe (liquid glass circle) */}
          <button
            type="button"
            onClick={handleReload}
            className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
            }`}
            title="Muat ulang halaman"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Open in New Tab (liquid glass pill) */}
          <button
            type="button"
            onClick={handleOpenExternal}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-md text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                : "bg-black hover:bg-zinc-800 text-white shadow-black/10"
            }`}
            title="Buka di tab browser baru"
          >
            <span>Buka Tab Baru</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          {/* Close / Return to chats (liquid glass circle) */}
          <button
            type="button"
            onClick={onClose}
            className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
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
        </div>
      </header>

      {/* ─── EMBEDDED IFRAME BODY ───────────────────────────────────────── */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-transparent flex flex-col">
        {/* Loading indicator */}
        {isLoading && (
          <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-xs transition-opacity ${
            isDark ? "bg-[#121215]/80 text-zinc-300" : "bg-white/80 text-zinc-700"
          }`}>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mb-2.5" />
            <span className="text-xs font-medium">Memuat Faith Hub...</span>
          </div>
        )}

        {/* Embedded Iframe pointing directly to Faith Hub (no sandbox restrictions so localStorage and session cookies persist) */}
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={FAITH_URL}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 rounded-t-2xl sm:rounded-t-3xl overflow-hidden"
          allow="camera; microphone; clipboard-write; clipboard-read; geolocation; payment; fullscreen; storage-access; cross-origin-isolated"
          title="Faith Hub"
        />
      </div>
    </div>
  );
}
