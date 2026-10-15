"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Check, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Menu, 
  Copy, 
  Cloud, 
  CloudOff,
  RefreshCw,
  FileText
} from "lucide-react";

export interface NoteItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

interface NotebookWorkspaceProps {
  isDark: boolean;
  onClose?: () => void;
  user?: { id?: string; email?: string } | null;
  setShowAuthModal?: (show: boolean) => void;
  onTogglePanel?: () => void;
}

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export function NotebookWorkspace({
  isDark,
  onClose,
  user,
  setShowAuthModal,
  onTogglePanel,
}: NotebookWorkspaceProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Buffer lokal untuk pengetikan instan tanpa lag
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentContent, setCurrentContent] = useState("");

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const activeNoteIdRef = useRef<string | null>(null);
  activeNoteIdRef.current = activeNoteId;

  const storageKey = user?.id ? `usick-notes-cache-${user.id}` : "usick-notes-guest";

  // Muat catatan dari API atau cache lokal
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Muat cache lokal terlebih dahulu
      const cached = localStorage.getItem(storageKey);
      let localNotes: NoteItem[] = [];
      if (cached) {
        try {
          localNotes = JSON.parse(cached);
          setNotes(localNotes);
        } catch {}
      }

      // 2. Jika user login, sinkronisasi dengan server
      if (user?.id) {
        const res = await fetch("/api/notes");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.notes)) {
            setNotes(data.notes);
            localStorage.setItem(storageKey, JSON.stringify(data.notes));
            if (!activeNoteIdRef.current && data.notes.length > 0) {
              setActiveNoteId(data.notes[0].id);
            }
            setIsLoading(false);
            return;
          }
        }
      }

      if (!activeNoteIdRef.current && localNotes.length > 0) {
        setActiveNoteId(localNotes[0].id);
      }
    } catch (err) {
      console.warn("[notebook] fetch notes error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, storageKey]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Sinkronisasi form saat catatan aktif berubah
  useEffect(() => {
    if (!activeNoteId) {
      setCurrentTitle("");
      setCurrentContent("");
      return;
    }
    const found = notes.find((n) => n.id === activeNoteId);
    if (found) {
      setCurrentTitle(found.title);
      setCurrentContent(found.content);
      setSaveStatus("saved");
      setSaveError(null);
    }
  }, [activeNoteId, notes]);

  // Simpan catatan ke server dan lokal
  const persistNote = useCallback(
    async (noteId: string, titleToSave: string, contentToSave: string) => {
      setSaveStatus("saving");
      setSaveError(null);
      isSavingRef.current = true;

      const now = new Date().toISOString();

      // Perbarui state lokal & cache segera
      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === noteId ? { ...n, title: titleToSave, content: contentToSave, updated_at: now } : n
        );
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Jika user login, simpan ke database via API
      if (user?.id) {
        try {
          const res = await fetch(`/api/notes/${noteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: titleToSave,
              content: contentToSave,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Gagal menyimpan ke server");
          }

          setSaveStatus("saved");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Gagal sinkronisasi cloud";
          setSaveStatus("error");
          setSaveError(msg);
        } finally {
          isSavingRef.current = false;
        }
      } else {
        // Mode offline/tamu tersimpan di local storage
        setSaveStatus("saved");
        isSavingRef.current = false;
      }
    },
    [user?.id, storageKey]
  );

  // Penanganan perubahan judul dengan debounced autosave
  const handleTitleChange = (newTitle: string) => {
    setCurrentTitle(newTitle);
    setSaveStatus("unsaved");

    if (!activeNoteId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      persistNote(activeNoteId, newTitle, currentContent);
    }, 600);
  };

  // Penanganan perubahan isi dengan debounced autosave
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    setSaveStatus("unsaved");

    if (!activeNoteId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      persistNote(activeNoteId, currentTitle, newContent);
    }, 600);
  };

  // Buat catatan baru
  const handleCreateNote = async () => {
    const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const now = new Date().toISOString();

    const newNote: NoteItem = {
      id: tempId,
      user_id: user?.id || "guest",
      title: "Catatan Baru",
      content: "",
      is_pinned: false,
      created_at: now,
      updated_at: now,
    };

    // Langsung buka di editor
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(tempId);
    setCurrentTitle(newNote.title);
    setCurrentContent("");
    setIsMobileEditorOpen(true);
    setSaveStatus("saved");

    try {
      localStorage.setItem(storageKey, JSON.stringify([newNote, ...notes]));
    } catch {}

    // Jika user login, simpan ke server
    if (user?.id) {
      try {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newNote.title,
            content: newNote.content,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.note?.id) {
            // Sinkronkan ID resmi dari database
            const realId = data.note.id;
            setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...data.note } : n)));
            setActiveNoteId(realId);
          }
        }
      } catch (err) {
        console.warn("[notebook] create note server error:", err);
      }
    }
  };

  // Toggle Pin/Unpin catatan
  const handleTogglePin = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeNoteId) return;

    const targetNote = notes.find((n) => n.id === activeNoteId);
    if (!targetNote) return;

    const nextPinState = !targetNote.is_pinned;

    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === activeNoteId ? { ...n, is_pinned: nextPinState, updated_at: new Date().toISOString() } : n
      );
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user?.id) {
      try {
        await fetch(`/api/notes/${activeNoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_pinned: nextPinState }),
        });
      } catch (err) {
        console.warn("[notebook] pin error:", err);
      }
    }
  };

  // Hapus catatan
  const handleDeleteNote = async () => {
    if (!activeNoteId) return;

    const idToDelete = activeNoteId;
    const remaining = notes.filter((n) => n.id !== idToDelete);
    setNotes(remaining);
    setShowDeleteConfirm(false);

    try {
      localStorage.setItem(storageKey, JSON.stringify(remaining));
    } catch {}

    if (remaining.length > 0) {
      setActiveNoteId(remaining[0].id);
    } else {
      setActiveNoteId(null);
      setIsMobileEditorOpen(false);
    }

    if (user?.id) {
      try {
        await fetch(`/api/notes/${idToDelete}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("[notebook] delete error:", err);
      }
    }
  };

  // Salin isi catatan ke clipboard
  const handleCopyContent = () => {
    const fullText = `${currentTitle ? currentTitle + "\n\n" : ""}${currentContent}`;
    navigator.clipboard.writeText(fullText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Filter dan sortir catatan
  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    // Pisahkan yang disematkan di atas, kemudian urutkan berdasar updated_at DESC
    return result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [notes, searchQuery]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Format tanggal modifikasi ramah manusia
  const formatNoteTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      if (isToday) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`h-full w-full flex flex-col overflow-hidden ${
        isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#ffffff] text-zinc-900"
      }`}
    >
      {/* ─── DESKTOP & MOBILE WRAPPER ─── */}
      <div className="flex-1 flex overflow-hidden w-full h-full relative">

        {/* ─── PANEL KIRI: DAFTAR CATATAN (NOTES LIST) ─── */}
        <div
          className={`w-full md:w-[320px] lg:w-[360px] flex flex-col border-r shrink-0 transition-all ${
            isDark ? "bg-[#09090b] border-zinc-800/80" : "bg-white border-zinc-200"
          } ${isMobileEditorOpen ? "hidden md:flex" : "flex"}`}
        >
          {/* Header Panel Kiri */}
          <div
            className={`p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 ${
              isDark ? "border-zinc-800/80" : "border-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {onTogglePanel && (
                <button
                  type="button"
                  onClick={onTogglePanel}
                  title="Buka Menu Panel"
                  className={`p-2 rounded-xl transition md:hidden ${
                    isDark
                      ? "hover:bg-zinc-800 text-zinc-300"
                      : "hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${isDark ? "text-zinc-200" : "text-zinc-800"}`} />
                <h1 className="text-base sm:text-lg font-bold tracking-tight">Notebook</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateNote}
              title="Buat Catatan Baru"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "bg-black text-white hover:bg-zinc-800"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Baru</span>
            </button>
          </div>

          {/* Kolom Pencarian */}
          <div className="p-3 shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition ${
                isDark
                  ? "bg-zinc-900/60 border-zinc-800 focus-within:border-zinc-700"
                  : "bg-zinc-50 border-zinc-200 focus-within:border-zinc-300"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan..."
                className="bg-transparent w-full focus:outline-none placeholder:text-zinc-500 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs px-1"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Banner Akun Tamu (Jika belum login) */}
          {!user?.id && (
            <div
              className={`mx-3 mb-2 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                isDark
                  ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-400"
                  : "bg-zinc-50 border-zinc-200 text-zinc-600"
              }`}
            >
              <CloudOff className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="leading-tight">
                  Tersimpan di browser ini.{" "}
                  {setShowAuthModal && (
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className={`font-semibold underline cursor-pointer ${
                        isDark ? "text-white" : "text-black"
                      }`}
                    >
                      Masuk akun
                    </button>
                  )}{" "}
                  untuk sinkronisasi antar perangkat.
                </p>
              </div>
            </div>
          )}

          {/* Daftar Catatan (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 overscroll-contain">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-xs text-zinc-500">
                <RefreshCw className="w-5 h-5 animate-spin mb-2 opacity-50" />
                <p>Memuat catatan...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                    isDark ? "bg-zinc-900 text-zinc-600" : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <FileText className="w-6 h-6" />
                </div>
                {searchQuery ? (
                  <>
                    <p className="font-semibold text-sm mb-1">Tidak ada hasil</p>
                    <p className="text-xs text-zinc-500 max-w-[200px]">
                      Tidak ada catatan yang cocok dengan "{searchQuery}".
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sm mb-1">Gagasanmu dimulai di sini</p>
                    <p className="text-xs text-zinc-500 max-w-[220px] mb-4">
                      Buat catatan untuk menyimpan ide, draf tugas, atau pengingat penting.
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateNote}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isDark
                          ? "bg-white text-black hover:bg-zinc-200"
                          : "bg-black text-white hover:bg-zinc-800"
                      }`}
                    >
                      + Catatan Pertama
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === activeNoteId;
                const snippet = note.content
                  ? note.content.replace(/\n+/g, " ").slice(0, 75)
                  : "Belum ada isi catatan...";

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setIsMobileEditorOpen(true);
                    }}
                    className={`group relative flex flex-col p-3 rounded-xl cursor-pointer transition select-none ${
                      isSelected
                        ? isDark
                          ? "bg-zinc-800/90 text-white font-medium shadow-xs"
                          : "bg-zinc-100 text-black font-medium shadow-xs"
                        : isDark
                        ? "hover:bg-zinc-900/70 text-zinc-400 hover:text-zinc-200"
                        : "hover:bg-zinc-50 text-zinc-600 hover:text-zinc-950"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3
                        className={`text-xs sm:text-[13px] font-semibold truncate flex-1 ${
                          isSelected
                            ? isDark
                              ? "text-white"
                              : "text-black"
                            : isDark
                            ? "text-zinc-200"
                            : "text-zinc-800"
                        }`}
                      >
                        {note.title.trim() || "Catatan Tanpa Judul"}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {note.is_pinned && (
                          <Pin className="w-3.5 h-3.5 fill-current text-zinc-400" />
                        )}
                        <span className="text-[10px] text-zinc-400">
                          {formatNoteTime(note.updated_at)}
                        </span>
                      </div>
                    </div>
                    <p
                      className={`text-[11px] leading-relaxed line-clamp-2 ${
                        isSelected
                          ? isDark
                            ? "text-zinc-300"
                            : "text-zinc-700"
                          : "text-zinc-500"
                      }`}
                    >
                      {snippet}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── PANEL KANAN: EDITOR CATATAN (EDITOR PANEL) ─── */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden ${
            isDark ? "bg-[#09090b]" : "bg-white"
          } ${isMobileEditorOpen ? "flex" : "hidden md:flex"}`}
        >
          {activeNote ? (
            <>
              {/* Header Editor Bar */}
              <div
                className={`p-3.5 sm:px-6 sm:py-3.5 border-b flex items-center justify-between shrink-0 ${
                  isDark ? "border-zinc-800/80 bg-[#09090b]" : "border-zinc-200 bg-white"
                }`}
              >
                {/* Tombol Kembali (Mobile) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileEditorOpen(false)}
                    className={`md:hidden flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg transition ${
                      isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Daftar</span>
                  </button>

                  {/* Status Simpan */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 pl-1">
                    {saveStatus === "saving" && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span className="hidden sm:inline">Menyimpan...</span>
                      </span>
                    )}
                    {saveStatus === "saved" && (
                      <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {user?.id ? "Tersimpan di Cloud" : "Tersimpan Lokal"}
                        </span>
                      </span>
                    )}
                    {saveStatus === "unsaved" && (
                      <span className="text-zinc-400">Belum disimpan</span>
                    )}
                    {saveStatus === "error" && (
                      <button
                        type="button"
                        onClick={() => persistNote(activeNote.id, currentTitle, currentContent)}
                        className="flex items-center gap-1 text-red-500 hover:underline cursor-pointer"
                        title={saveError || "Gagal menyimpan"}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Gagal • Coba lagi</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi (Pin, Copy, Hapus) */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    title={activeNote.is_pinned ? "Lepas Sematan" : "Sematkan Catatan"}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      activeNote.is_pinned
                        ? isDark
                          ? "bg-zinc-800 text-white"
                          : "bg-zinc-100 text-black"
                        : isDark
                        ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${activeNote.is_pinned ? "fill-current" : ""}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyContent}
                    title="Salin Isi Catatan"
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      copiedSuccess
                        ? "text-emerald-500"
                        : isDark
                        ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
                    }`}
                  >
                    {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Hapus Catatan"
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Area Tulis Catatan (Judul & Konten) */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-6 max-w-4xl w-full mx-auto flex flex-col overscroll-contain">
                {/* Input Judul */}
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Judul catatan..."
                  className={`w-full text-xl sm:text-2xl font-bold bg-transparent border-0 focus:outline-none mb-4 tracking-tight ${
                    isDark ? "text-white placeholder:text-zinc-600" : "text-black placeholder:text-zinc-400"
                  }`}
                />

                {/* Textarea Konten Catatan */}
                <textarea
                  value={currentContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Ketik catatanmu di sini..."
                  rows={20}
                  className={`w-full flex-1 resize-none bg-transparent border-0 focus:outline-none text-sm sm:text-base leading-relaxed ${
                    isDark
                      ? "text-zinc-200 placeholder:text-zinc-600"
                      : "text-zinc-800 placeholder:text-zinc-400"
                  }`}
                />
              </div>
            </>
          ) : (
            // Tampilan saat belum ada catatan yang dipilih di desktop
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                  isDark ? "bg-zinc-900 text-zinc-600" : "bg-zinc-100 text-zinc-400"
                }`}
              >
                <FileText className="w-7 h-7" />
              </div>
              <p className="font-semibold text-sm mb-1">Pilih atau Buat Catatan</p>
              <p className="text-xs text-zinc-500 max-w-[240px] mb-4">
                Pilih catatan di panel sebelah kiri atau klik tombol di bawah untuk membuat catatan baru.
              </p>
              <button
                type="button"
                onClick={handleCreateNote}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                + Buat Catatan Baru
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ─── MODAL KONFIRMASI HAPUS ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${
              isDark
                ? "bg-[#18181b] border-zinc-700/80 text-white"
                : "bg-white border-zinc-200 text-black"
            }`}
          >
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Hapus Catatan?</h4>
                <p className="text-xs text-zinc-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Catatan <strong className="text-zinc-800 dark:text-zinc-200">"{currentTitle || "Catatan Ini"}"</strong> akan dihapus permanen.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteNote}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

