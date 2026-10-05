"use client";

import { useState, useEffect, useRef } from "react";

interface FaithWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  onTogglePanel?: () => void;
}

export function FaithWorkspace({
  isDark,
  onClose,
  onTogglePanel,
}: FaithWorkspaceProps) {
  const [faithUrl, setFaithUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("usick-faith-url");
      if (saved) return saved;
      if (process.env.NEXT_PUBLIC_FAITH_URL) return process.env.NEXT_PUBLIC_FAITH_URL;
    }
    return "";
  });

  const [inputUrl, setInputUrl] = useState(faithUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(!faithUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (faithUrl) {
      setIsLoading(true);
    }
  }, [faithUrl, iframeKey]);

  const handleSaveUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let trimmed = inputUrl.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    setFaithUrl(trimmed);
    setInputUrl(trimmed);
    setIsEditingUrl(false);
    try {
      localStorage.setItem("usick-faith-url", trimmed);
    } catch {}
    setIframeKey((prev) => prev + 1);
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    if (faithUrl) {
      window.open(faithUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${
      isDark ? "bg-[#121215] text-zinc-100" : "bg-white text-zinc-900"
    }`}>
      {/* ─── HEADER BAR ─────────────────────────────────────────────────── */}
      <header className={`shrink-0 w-full z-20 flex items-center justify-between border-b px-3.5 sm:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md ${
        isDark ? "border-zinc-800/80 bg-[#121215]/95 text-white" : "border-zinc-100 bg-white/95 text-zinc-900"
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger toggle button */}
          {onTogglePanel && (
            <button
              onClick={onTogglePanel}
              className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border shadow-2xs transition cursor-pointer shrink-0 ${
                isDark
                  ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-black"
              }`}
              title="Menu Panel"
              aria-label="Menu Panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Cross Logo & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl shadow-xs shrink-0 ${
              isDark ? "bg-white text-black" : "bg-black text-white"
            }`}>
              <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 3v18M7 8h10" />
              </svg>
            </div>
            <div className="truncate">
              <span className={`text-sm font-bold tracking-tight block truncate ${isDark ? "text-white" : "text-black"}`}>
                Faith
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {faithUrl && !isEditingUrl && (
            <>
              {/* Change URL */}
              <button
                type="button"
                onClick={() => setIsEditingUrl(true)}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                }`}
                title="Ganti tautan web"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Ubah URL</span>
              </button>

              {/* Refresh Iframe */}
              <button
                type="button"
                onClick={handleReload}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                }`}
                title="Muat ulang halaman"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Open in New Tab */}
              <button
                type="button"
                onClick={handleOpenExternal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
                  isDark ? "bg-white hover:bg-zinc-200 text-black" : "bg-black hover:bg-zinc-800 text-white"
                }`}
                title="Buka di tab browser baru"
              >
                <span>Buka Tab Baru</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </>
          )}

          {/* Close / Return to chats */}
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark
                ? "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
            }`}
            title="Kembali ke Chats"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── BODY / IFRAME WORKSPACE ────────────────────────────────────── */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-transparent flex flex-col">
        {/* Setup / Edit URL Modal or Prompt */}
        {(!faithUrl || isEditingUrl) ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-xl text-center ${
              isDark ? "bg-[#18181c] border-zinc-800" : "bg-white border-zinc-200"
            }`}>
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-inner ${
                isDark ? "bg-zinc-800/80 border-zinc-700/60 text-white" : "bg-zinc-100 border-zinc-200 text-black"
              }`}>
                <svg className="w-7 h-7 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18M7 8h10" />
                </svg>
              </div>

              <h2 className="text-xl font-bold tracking-tight">
                Integrasikan Website Faith Anda
              </h2>
              <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                Masukkan alamat website Faith Anda agar dapat ditampilkan langsung di dalam Usick One.
              </p>

              <form onSubmit={handleSaveUrl} className="mt-5 space-y-3">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://faith-app-anda.vercel.app"
                  className={`w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition ${
                    isDark
                      ? "bg-zinc-900 border-zinc-700 text-white focus:border-white"
                      : "bg-zinc-50 border-zinc-300 text-black focus:border-black"
                  }`}
                  autoFocus
                />

                <div className="flex gap-2 justify-center">
                  {faithUrl && (
                    <button
                      type="button"
                      onClick={() => setIsEditingUrl(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
                      isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                    }`}
                  >
                    Tampilkan Web
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex-1">
            {/* Loading indicator */}
            {isLoading && (
              <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-xs transition-opacity ${
                isDark ? "bg-[#121215]/80 text-zinc-300" : "bg-white/80 text-zinc-700"
              }`}>
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mb-2.5" />
                <span className="text-xs font-medium">Memuat website Faith...</span>
              </div>
            )}

            {/* Embedded Iframe */}
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={faithUrl}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-0"
              allow="camera; microphone; clipboard-write; clipboard-read; geolocation; payment"
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
              title="Faith App"
            />
          </div>
        )}
      </div>
    </div>
  );
}
