"use client";

import { useState, useEffect, useRef } from "react";

export type WorkspaceConnectItem = {
  id: string;
  name: string;
  url: string;
  createdAt: number;
};

interface WorkspaceConnectProps {
  isDark: boolean;
  onClose: () => void;
  onTogglePanel?: () => void;
}

const STORAGE_KEY = "usick-workspace-connect-items";
const ACTIVE_ID_KEY = "usick-workspace-connect-active-id";

export function WorkspaceConnect({
  isDark,
  onClose,
  onTogglePanel,
}: WorkspaceConnectProps) {
  const [items, setItems] = useState<WorkspaceConnectItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ACTIVE_ID_KEY);
    }
    return null;
  });

  // Tampilkan menu setup jika belum ada item sama sekali
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Iframe states
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // Simpan items ke localStorage
  const saveItems = (newItems: WorkspaceConnectItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {}
  };

  // Simpan activeId
  const handleSelectWorkspace = (id: string) => {
    setActiveId(id);
    try {
      localStorage.setItem(ACTIVE_ID_KEY, id);
    } catch {}
    setIsSetupOpen(false);
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  // Jika item kosong saat buka, otomatis buka menu setup
  useEffect(() => {
    if (items.length === 0) {
      setIsSetupOpen(true);
    } else if (!activeId || !items.some((it) => it.id === activeId)) {
      handleSelectWorkspace(items[0].id);
    }
  }, [items.length]);

  const activeItem = items.find((it) => it.id === activeId) || null;

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmedUrl = formUrl.trim();
    if (!trimmedUrl) return;

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    let trimmedName = formName.trim();
    if (!trimmedName) {
      try {
        const parsed = new URL(trimmedUrl);
        trimmedName = parsed.hostname.replace(/^www\./, "");
      } catch {
        trimmedName = "Workspace Link";
      }
    }

    if (editingId) {
      // Edit existing
      const updated = items.map((it) =>
        it.id === editingId ? { ...it, name: trimmedName, url: trimmedUrl } : it
      );
      saveItems(updated);
      setEditingId(null);
    } else {
      // Create new
      const newItem: WorkspaceConnectItem = {
        id: "ws_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        name: trimmedName,
        url: trimmedUrl,
        createdAt: Date.now(),
      };
      const updated = [...items, newItem];
      saveItems(updated);
      handleSelectWorkspace(newItem.id);
    }

    setFormName("");
    setFormUrl("");
  };

  const handleStartEdit = (item: WorkspaceConnectItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormUrl(item.url);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormName("");
    setFormUrl("");
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter((it) => it.id !== id);
    saveItems(updated);
    if (activeId === id) {
      if (updated.length > 0) {
        handleSelectWorkspace(updated[0].id);
      } else {
        setActiveId(null);
        setIsSetupOpen(true);
      }
    }
    if (editingId === id) {
      handleCancelEdit();
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    if (activeItem?.url) {
      window.open(activeItem.url, "_blank", "noopener,noreferrer");
    }
  };

  const filteredItems = items.filter(
    (it) =>
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${
      isDark ? "bg-[#121215] text-zinc-100" : "bg-white text-zinc-900"
    }`}>
      {/* ─── HEADER BAR ─────────────────────────────────────────────────── */}
      <header className={`shrink-0 w-full z-20 flex items-center justify-between border-b px-3.5 sm:px-6 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md ${
        isDark ? "border-zinc-800/80 bg-[#121215]/95 text-white" : "border-zinc-100 bg-white/95 text-zinc-900"
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
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

          {/* Title & Connector Icon */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl shadow-xs shrink-0 ${
              isDark ? "bg-white text-black" : "bg-black text-white"
            }`}>
              <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className={`text-sm font-bold tracking-tight hidden md:inline truncate ${isDark ? "text-white" : "text-black"}`}>
              Workspace Connect
            </span>
          </div>

          {/* Quick Tabs Switcher (Scrollable horizontally) */}
          {items.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 max-w-full no-scrollbar">
              {items.map((item) => {
                const isActive = item.id === activeId && !isSetupOpen;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectWorkspace(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                      isActive
                        ? isDark
                          ? "bg-white text-black border-white shadow-xs"
                          : "bg-black text-white border-black shadow-xs"
                        : isDark
                        ? "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                    }`}
                    title={item.url}
                  >
                    <span className="truncate max-w-[120px]">{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Setup / Kelola Link Button */}
          <button
            type="button"
            onClick={() => setIsSetupOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isSetupOpen
                ? isDark
                  ? "bg-white text-black border-white shadow-sm"
                  : "bg-black text-white border-black shadow-sm"
                : isDark
                ? "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
            }`}
            title="Buka menu setup & kelola daftar link"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="hidden sm:inline">Menu Setup</span>
          </button>

          {activeItem && !isSetupOpen && (
            <>
              {/* Refresh current iframe */}
              <button
                type="button"
                onClick={handleReload}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                }`}
                title="Muat ulang halaman workspace ini"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Open in New Tab */}
              <button
                type="button"
                onClick={handleOpenExternal}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                }`}
                title="Buka di tab browser baru"
              >
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

      {/* ─── BODY CONTAINER ────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-transparent flex flex-col">
        {/* VIEW 1: MENU SETUP & LINK MANAGER */}
        {isSetupOpen ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
            <div className="w-full max-w-2xl space-y-6 animate-in fade-in-0 duration-200">
              {/* Header Title Setup */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Menu Setup — Workspace Connect</h2>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Tambahkan dan kelola link website apa saja untuk ditampilkan langsung sebagai embedded workspace.
                  </p>
                </div>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsSetupOpen(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold self-start sm:self-auto transition cursor-pointer ${
                      isDark
                        ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                    }`}
                  >
                    Kembali ke Workspace
                  </button>
                )}
              </div>

              {/* Form Tambah / Edit Link */}
              <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm ${
                isDark ? "bg-[#18181c] border-zinc-800" : "bg-white border-zinc-200"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  }`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold">
                    {editingId ? "Ubah Workspace Link" : "Tambah Workspace Baru"}
                  </h3>
                </div>

                <form onSubmit={handleSaveForm} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                        Nama Workspace
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Contoh: Figma, Notion, Dashboard, dll"
                        className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                          isDark
                            ? "bg-zinc-900 border-zinc-700 text-white focus:border-white"
                            : "bg-zinc-50 border-zinc-300 text-black focus:border-black"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                        Link / URL Website
                      </label>
                      <input
                        type="text"
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                        placeholder="Paste link di sini (https://...)"
                        required
                        className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                          isDark
                            ? "bg-zinc-900 border-zinc-700 text-white focus:border-white"
                            : "bg-zinc-50 border-zinc-300 text-black focus:border-black"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isDark ? "border-zinc-800 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                        isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                      }`}
                    >
                      {editingId ? "Simpan Perubahan" : "+ Tambah ke Workspace"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Link Tersusun Rapi */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Daftar Workspace Tersimpan
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-800"
                    }`}>
                      {items.length}
                    </span>
                  </div>

                  {items.length > 3 && (
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari workspace..."
                      className={`px-3 py-1 text-xs rounded-xl border outline-none ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-black"
                      }`}
                    />
                  )}
                </div>

                {items.length === 0 ? (
                  <div className={`p-8 text-center rounded-3xl border border-dashed text-xs ${
                    isDark ? "border-zinc-800 text-zinc-500" : "border-zinc-300 text-zinc-500"
                  }`}>
                    Belum ada link yang ditambahkan. Paste link website apa saja di formulir atas untuk memulai.
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Tidak ditemukan workspace dengan kata kunci &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item, idx) => {
                      const isActive = item.id === activeId;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition group ${
                            isActive
                              ? isDark
                                ? "bg-zinc-900/90 border-white/30 ring-1 ring-white/10"
                                : "bg-zinc-50 border-black/30 ring-1 ring-black/5"
                              : isDark
                              ? "bg-[#18181c] border-zinc-800/80 hover:border-zinc-700"
                              : "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span className={`text-xs font-mono font-semibold w-5 shrink-0 ${
                              isDark ? "text-zinc-500" : "text-zinc-400"
                            }`}>
                              {idx + 1}.
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold truncate">
                                  {item.name}
                                </span>
                                {isActive && (
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                                    isDark ? "bg-white text-black" : "bg-black text-white"
                                  }`}>
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <span className={`text-[11px] truncate block max-w-xs sm:max-w-md ${
                                isDark ? "text-zinc-400" : "text-zinc-500"
                              }`}>
                                {item.url}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Buka Workspace */}
                            <button
                              type="button"
                              onClick={() => handleSelectWorkspace(item.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                isActive
                                  ? isDark
                                    ? "bg-zinc-800 text-white"
                                    : "bg-zinc-200 text-black"
                                  : isDark
                                  ? "bg-white text-black hover:bg-zinc-200"
                                  : "bg-black text-white hover:bg-zinc-800"
                              }`}
                            >
                              {isActive ? "Tampilkan" : "Buka"}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                isDark
                                  ? "border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                  : "border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-black"
                              }`}
                              title="Ubah nama / link"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                isDark
                                  ? "border-zinc-800 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 hover:border-red-900/50"
                                  : "border-zinc-200 hover:bg-red-50 text-zinc-400 hover:text-red-600 hover:border-red-200"
                              }`}
                              title="Hapus workspace ini"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: EMBEDDED IFRAME ACTIVE WORKSPACE */
          <div className="relative w-full h-full flex-1">
            {activeItem ? (
              <>
                {/* Loading indicator */}
                {isLoading && (
                  <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-xs transition-opacity ${
                    isDark ? "bg-[#121215]/80 text-zinc-300" : "bg-white/80 text-zinc-700"
                  }`}>
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mb-2.5" />
                    <span className="text-xs font-medium">Memuat {activeItem.name}...</span>
                  </div>
                )}

                {/* Embedded Iframe */}
                <iframe
                  key={`${activeItem.id}-${iframeKey}`}
                  src={activeItem.url}
                  onLoad={() => setIsLoading(false)}
                  className="w-full h-full border-0"
                  allow="camera; microphone; clipboard-write; clipboard-read; geolocation; payment; fullscreen"
                  sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
                  title={activeItem.name}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs text-zinc-500 mb-3">Belum ada workspace yang dipilih.</p>
                <button
                  type="button"
                  onClick={() => setIsSetupOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200"
                >
                  Buka Menu Setup
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
