"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Check, 
  AlertCircle, 
  ArrowLeft, 
  Menu, 
  Copy, 
  CloudOff,
  RefreshCw,
  FileText,
  Home,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Link2,
  Highlighter,
  Palette,
  Undo2,
  Redo2,
  ChevronDown,
  X
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

// Konversi konten lama teks biasa menjadi format HTML terstruktur yang aman
function ensureHtmlContent(raw: string): string {
  if (!raw) return "<p><br></p>";
  // Jika sudah berupa HTML (memiliki tag)
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw;
  }
  // Konversi baris biasa ke paragraf HTML
  return raw
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// Ekstrak teks bersih untuk cuplikan kartu dan pencarian
function extractPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function NotebookWorkspace({
  isDark,
  onClose,
  user,
  setShowAuthModal,
  onTogglePanel,
}: NotebookWorkspaceProps) {
  // ─── ALUR 3 HALAMAN RESMI ───
  // 1. "home"   : Tampilan cover sampul depan dengan One Stop Digital Notebook & 2 tombol
  // 2. "canvas" : Halaman canvas editor penulisan WYSIWYG
  // 3. "files"  : Halaman semua file catatan (Grid Card Notes persis gambar referensi)
  const [pageView, setPageView] = useState<"home" | "files" | "canvas">("home");

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Modal Insert Link
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Dropdown Palet Warna & Highlight
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);

  // Buffer lokal judul dan konten HTML
  const [currentTitle, setCurrentTitle] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedSelectionRangeRef = useRef<Range | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const activeNoteIdRef = useRef<string | null>(null);
  activeNoteIdRef.current = activeNoteId;

  const storageKey = user?.id ? `usick-notes-cache-${user.id}` : "usick-notes-guest";

  // Muat catatan dari server / cache
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const cached = localStorage.getItem(storageKey);
      let localNotes: NoteItem[] = [];
      if (cached) {
        try {
          localNotes = JSON.parse(cached);
          setNotes(localNotes);
        } catch {}
      }

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
      console.warn("[notebook] fetch error:", err);
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
      if (editorRef.current) editorRef.current.innerHTML = "<p><br></p>";
      return;
    }
    const found = notes.find((n) => n.id === activeNoteId);
    if (found) {
      setCurrentTitle(found.title);
      const html = ensureHtmlContent(found.content);
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
      }
      setSaveStatus("saved");
      setSaveError(null);
    }
  }, [activeNoteId, notes]);

  // Eksekusi penyimpanan ke backend dan lokal
  const persistNote = useCallback(
    async (noteId: string, titleToSave: string, htmlToSave: string) => {
      setSaveStatus("saving");
      setSaveError(null);
      isSavingRef.current = true;

      const now = new Date().toISOString();

      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === noteId ? { ...n, title: titleToSave, content: htmlToSave, updated_at: now } : n
        );
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (user?.id) {
        try {
          const res = await fetch(`/api/notes/${noteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: titleToSave,
              content: htmlToSave,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Gagal menyimpan catatan.");
          }

          setSaveStatus("saved");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Gagal menyimpan.";
          setSaveStatus("error");
          setSaveError(msg);
        } finally {
          isSavingRef.current = false;
        }
      } else {
        setSaveStatus("saved");
        isSavingRef.current = false;
      }
    },
    [user?.id, storageKey]
  );

  // Penanganan perubahan judul dengan autosave debounce
  const handleTitleChange = (newTitle: string) => {
    setCurrentTitle(newTitle);
    setSaveStatus("unsaved");

    if (!activeNoteId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : "";
      persistNote(activeNoteId, newTitle, currentHtml);
    }, 600);
  };

  // Penanganan perubahan konten WYSIWYG
  const handleEditorInput = () => {
    setSaveStatus("unsaved");
    if (!activeNoteId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : "";
      persistNote(activeNoteId, currentTitle, currentHtml);
    }, 600);
  };

  // Simpan seleksi kursor saat membuka modal link atau dropdown
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRangeRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRangeRef.current);
    }
  };

  // Eksekusi pemformatan teks WYSIWYG dasar
  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  // Sisipkan checklist interaktif
  const insertChecklist = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const taskWrapper = document.createElement("div");
    taskWrapper.className = "flex items-start gap-2.5 my-1.5 task-item";
    taskWrapper.innerHTML = `
      <input type="checkbox" class="mt-1 w-4 h-4 rounded-xs cursor-pointer accent-zinc-500 shrink-0" />
      <span class="flex-1 focus:outline-none" contenteditable="true">Tugas baru</span>
    `;

    range.deleteContents();
    range.insertNode(taskWrapper);

    const span = taskWrapper.querySelector("span");
    if (span) {
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    handleEditorInput();
  };

  // Penanganan klik checkbox interaktif di dalam editor
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === "INPUT" && (target as HTMLInputElement).type === "checkbox") {
      const checkbox = target as HTMLInputElement;
      const isChecked = checkbox.checked;
      const sibling = checkbox.nextElementSibling;
      if (isChecked) {
        checkbox.setAttribute("checked", "true");
        sibling?.classList.add("line-through", "opacity-50");
      } else {
        checkbox.removeAttribute("checked");
        sibling?.classList.remove("line-through", "opacity-50");
      }
      handleEditorInput();
    }
  };

  // Modal Link
  const openLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const selected = sel ? sel.toString() : "";
    setLinkText(selected);
    setLinkUrl("");
    setShowLinkModal(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection();

    let validUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(validUrl) && !/^mailto:/i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }

    if (linkText.trim()) {
      document.execCommand("insertHTML", false, `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 font-medium text-inherit">${linkText}</a>`);
    } else {
      document.execCommand("createLink", false, validUrl);
    }

    setShowLinkModal(false);
    handleEditorInput();
  };

  // Buat catatan baru dan langsung buka Halaman 2 (Canvas)
  const handleCreateNote = async () => {
    const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const now = new Date().toISOString();

    const newNote: NoteItem = {
      id: tempId,
      user_id: user?.id || "guest",
      title: "Catatan Baru",
      content: "<p><br></p>",
      is_pinned: false,
      created_at: now,
      updated_at: now,
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(tempId);
    setCurrentTitle(newNote.title);
    if (editorRef.current) editorRef.current.innerHTML = "<p><br></p>";

    // Pindah ke Halaman 2 (Canvas Editor)
    setPageView("canvas");
    setSaveStatus("saved");

    try {
      localStorage.setItem(storageKey, JSON.stringify([newNote, ...notes]));
    } catch {}

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
            const realId = data.note.id;
            setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...data.note } : n)));
            setActiveNoteId(realId);
          }
        }
      } catch (err) {
        console.warn("[notebook] create server error:", err);
      }
    }
  };

  // Buka catatan tertentu dari Halaman 3 (Semua File) ke Halaman 2 (Canvas)
  const handleSelectNoteFromGrid = (note: NoteItem) => {
    setActiveNoteId(note.id);
    setCurrentTitle(note.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = ensureHtmlContent(note.content);
    }
    setPageView("canvas");
  };

  // Toggle Pin
  const handleTogglePin = async (e?: React.MouseEvent, noteId?: string) => {
    e?.stopPropagation();
    const targetId = noteId || activeNoteId;
    if (!targetId) return;

    const target = notes.find((n) => n.id === targetId);
    if (!target) return;
    const nextPin = !target.is_pinned;

    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === targetId ? { ...n, is_pinned: nextPin, updated_at: new Date().toISOString() } : n
      );
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user?.id) {
      try {
        await fetch(`/api/notes/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_pinned: nextPin }),
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
      setPageView("files");
    } else {
      setActiveNoteId(null);
      setPageView("home");
    }

    if (user?.id) {
      try {
        await fetch(`/api/notes/${idToDelete}`, { method: "DELETE" });
      } catch (err) {
        console.warn("[notebook] delete error:", err);
      }
    }
  };

  // Salin isi catatan
  const handleCopyContent = () => {
    const rawText = editorRef.current ? editorRef.current.innerText : "";
    const fullText = `${currentTitle ? currentTitle + "\n\n" : ""}${rawText}`;
    navigator.clipboard.writeText(fullText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Filter & sortir catatan
  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          extractPlainText(n.content).toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [notes, searchQuery]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const formatNoteTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 2) return "Baru saja";
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      if (diffMin < 1440) return `${Math.floor(diffMin / 60)} jam lalu`;

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

  // ─────────────────────────────────────────────────────────────────────────────
  // HALAMAN 1: HOME / LANDING COVER VIEW (Persis Desain Cover Referensi Monokrom)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderHomePage = () => (
    <div className="flex-1 flex flex-col justify-between h-full w-full px-4 sm:px-6 pt-5 sm:pt-7 relative overflow-hidden animate-in fade-in-0 duration-200">
      {/* Header Atas */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto shrink-0 z-20">
        <div className="flex items-center gap-2">
          {onTogglePanel && (
            <button
              type="button"
              onClick={onTogglePanel}
              title="Menu Navigasi"
              className={`p-2 rounded-xl transition md:hidden ${
                isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Badge Tengah Atas: Powered by Usick One */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 tracking-wide">
          <div className="w-3.5 h-3.5 rounded-xs bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center">
            <span className="text-[8px] text-white dark:text-black font-bold">U</span>
          </div>
          <span>Powered by Usick One</span>
        </div>

        {/* Tombol Pintas ke Halaman 3 (File Catatan) */}
        <div>
          {notes.length > 0 && (
            <button
              type="button"
              onClick={() => setPageView("files")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Semua Catatan ({notes.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Konten Hero Tengah */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-auto px-2 z-20 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-5xl md:text-[56px] font-extrabold tracking-tight leading-[1.12] mb-3 sm:mb-4">
          One Stop Digital<br />
          Notebook <span className="inline-block hover:scale-110 transition-transform">📓</span> for Creatives.
        </h1>

        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-6 sm:mb-8">
          Digital library of thoughts, notes, and ideas chosen by creatives for everyday clarity.
        </p>

        {/* 2 Tombol Aksi Sesuai Permintaan */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          {/* Tombol 1: Create New -> Langsung membuka Halaman 2 (Canvas Catatan) */}
          <button
            type="button"
            onClick={handleCreateNote}
            className={`px-6 py-3 rounded-full text-xs sm:text-sm font-semibold transition active:scale-95 shadow-lg flex items-center gap-2 cursor-pointer ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200 shadow-white/5"
                : "bg-black text-white hover:bg-zinc-800 shadow-zinc-900/10"
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New</span>
          </button>

          {/* Tombol 2: File Catatan -> Langsung membuka Halaman 3 (Semua File Catatan) */}
          <button
            type="button"
            onClick={() => setPageView("files")}
            className={`px-6 py-3 rounded-full text-xs sm:text-sm font-semibold transition active:scale-95 border flex items-center gap-2 cursor-pointer ${
              isDark
                ? "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700/80 shadow-md"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 hover:text-black border-zinc-300 shadow-sm"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>File Catatan {notes.length > 0 ? `(${notes.length})` : ""}</span>
          </button>
        </div>
      </div>

      {/* Ilustrasi Buku Monokromatik Fan di Bawah */}
      <div className="w-full shrink-0 z-10 pt-2 pointer-events-none select-none">
        <div className="relative w-full max-w-3xl mx-auto h-[180px] sm:h-[240px] md:h-[280px] flex items-end justify-center overflow-hidden">
          {/* Buku 1 */}
          <div
            className={`absolute w-36 sm:w-44 md:w-52 h-52 sm:h-64 md:h-72 rounded-t-2xl p-4 border shadow-2xl transition-transform -rotate-14 -translate-x-32 sm:-translate-x-48 md:-translate-x-60 translate-y-6 sm:translate-y-8 ${
              isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-zinc-900 border-zinc-800 text-white"
            }`}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center mb-3">
                  <span className="text-[10px] font-black">UN</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black tracking-tighter leading-none">USICK</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-400 mt-1">Archive Edition</p>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-zinc-500 font-mono">
                <span>NO. 01</span>
                <span>2026</span>
              </div>
            </div>
          </div>

          {/* Buku 2 */}
          <div
            className={`absolute w-36 sm:w-48 md:w-56 h-56 sm:h-68 md:h-80 rounded-t-2xl p-4 border shadow-2xl transition-transform -rotate-7 -translate-x-16 sm:-translate-x-24 md:-translate-x-32 translate-y-3 sm:translate-y-4 ${
              isDark ? "bg-zinc-900/95 border-zinc-700/80 text-zinc-200" : "bg-zinc-100 border-zinc-300 text-zinc-900"
            }`}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="w-10 h-10 rounded-full border border-current opacity-40 flex items-center justify-center mb-2">
                  <div className="w-4 h-4 rounded-full bg-current opacity-60" />
                </div>
                <p className="text-xs sm:text-sm font-bold leading-tight">The Creative<br />Act</p>
              </div>
              <span className="text-[9px] opacity-50 font-mono">VOL. II</span>
            </div>
          </div>

          {/* Buku 3 */}
          <div
            className={`absolute w-40 sm:w-52 md:w-60 h-60 sm:h-72 md:h-84 rounded-t-2xl p-4 sm:p-5 border shadow-2xl transition-transform rotate-1 translate-y-1 z-10 ${
              isDark ? "bg-zinc-800 border-zinc-600/80 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
            }`}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Personal Notebook</span>
                  <Sparkles className="w-3.5 h-3.5 opacity-60" />
                </div>
                <p className="text-base sm:text-xl font-extrabold tracking-tight">Designing<br />Ideas</p>
              </div>
              <div className="p-2 rounded-lg bg-black/10 dark:bg-white/5 text-[9px] font-mono flex items-center justify-between opacity-70">
                <span>AUTOSYNC</span>
                <span>SECURE</span>
              </div>
            </div>
          </div>

          {/* Buku 4 */}
          <div
            className={`absolute w-36 sm:w-48 md:w-56 h-56 sm:h-68 md:h-80 rounded-t-2xl p-4 border shadow-2xl transition-transform rotate-7 translate-x-16 sm:translate-x-24 md:translate-x-32 translate-y-3 sm:translate-y-4 ${
              isDark ? "bg-zinc-900 border-zinc-700/80 text-white" : "bg-white border-zinc-300 text-black"
            }`}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none mb-1">how</p>
                <p className="text-[10px] sm:text-xs font-semibold leading-tight opacity-75">to capture thoughts & ideas.</p>
              </div>
              <span className="text-[8px] font-mono opacity-50">DRAFT JOURNAL</span>
            </div>
          </div>

          {/* Buku 5 */}
          <div
            className={`absolute w-36 sm:w-44 md:w-52 h-52 sm:h-64 md:h-72 rounded-t-2xl p-4 border shadow-2xl transition-transform rotate-14 translate-x-32 sm:translate-x-48 md:translate-x-60 translate-y-6 sm:translate-y-8 ${
              isDark ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-zinc-800 border-zinc-700 text-zinc-200"
            }`}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Works</p>
                <p className="text-[9px] opacity-60">Creative Notebook</p>
              </div>
              <span className="text-[8px] font-mono opacity-40">INDEX 05</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // HALAMAN 3: SEMUA FILE CATATAN (GRID CARD VIEW PERSIS GAMBAR REFERENSI KEDUA)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderFilesPage = () => (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden animate-in fade-in-0 duration-150">
      {/* Top Bar Halaman Semua File */}
      <div
        className={`px-4 sm:px-8 py-3.5 border-b flex items-center justify-between shrink-0 gap-3 ${
          isDark ? "border-zinc-800 bg-[#09090b]" : "border-zinc-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Tombol Kembali ke Halaman 1 (Home) */}
          <button
            type="button"
            onClick={() => setPageView("home")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 text-zinc-300 hover:text-white" : "hover:bg-zinc-100 text-zinc-700 hover:text-black"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>

          <h2 className="text-base sm:text-lg font-bold tracking-tight">Semua Catatan</h2>
          <span className="text-xs text-zinc-500 font-medium">({notes.length})</span>
        </div>

        {/* Search Bar & Tombol Tambah */}
        <div className="flex items-center gap-2">
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition ${
              isDark ? "bg-zinc-900 border-zinc-800 focus-within:border-zinc-700" : "bg-zinc-50 border-zinc-200 focus-within:border-zinc-300"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari file catatan..."
              className="bg-transparent w-36 lg:w-48 focus:outline-none text-xs"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-white text-xs">
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateNote}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs ${
              isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Catatan Baru</span>
          </button>
        </div>
      </div>

      {/* Konten Grid Kartu Catatan (Persis Screenshot Referensi dengan Palet Web) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 overscroll-contain">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center text-xs text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin mb-3 opacity-50" />
            <p>Memuat seluruh file catatan...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              isDark ? "bg-zinc-900 text-zinc-600" : "bg-zinc-100 text-zinc-400"
            }`}>
              <FileText className="w-7 h-7" />
            </div>
            <p className="font-bold text-base mb-1">Belum ada file catatan</p>
            <p className="text-xs text-zinc-500 mb-5">
              {searchQuery ? `Tidak ada catatan dengan kata kunci "${searchQuery}".` : "Mulai buat catatan pertamamu sekarang."}
            </p>
            <button
              type="button"
              onClick={handleCreateNote}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
              }`}
            >
              + Buat Catatan Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {filteredNotes.map((note) => {
              const snippet = extractPlainText(note.content) || "Belum ada tulisan di dalam catatan ini...";

              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNoteFromGrid(note)}
                  className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isDark
                      ? "bg-[#18181b] hover:bg-zinc-800/80 border-zinc-800 hover:border-zinc-700 shadow-lg shadow-black/40"
                      : "bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 shadow-sm"
                  } ${note.is_pinned ? (isDark ? "ring-1 ring-zinc-600" : "ring-1 ring-zinc-400") : ""}`}
                >
                  <div>
                    {/* Baris Atas Kartu: Timestamp di kiri, Badge Tag di kanan */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        {formatNoteTime(note.updated_at)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {note.is_pinned && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-800"
                          }`}>
                            <Pin className="w-2.5 h-2.5 fill-current" />
                            <span>Pinned</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-100 text-zinc-600"
                        }`}>
                          Note
                        </span>
                      </div>
                    </div>

                    {/* Judul Catatan Tebal */}
                    <h3 className={`text-base font-bold tracking-tight mb-2 truncate ${
                      isDark ? "text-white group-hover:text-zinc-100" : "text-black group-hover:text-zinc-900"
                    }`}>
                      {note.title.trim() || "Catatan Tanpa Judul"}
                    </h3>

                    {/* Cuplikan Teks 3 Baris */}
                    <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                      {snippet}
                    </p>
                  </div>

                  {/* Baris Bawah Kartu: Aksi Cepat */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                    <span className="text-[10px] opacity-70">Klik untuk membuka canvas</span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, note.id)}
                        title={note.is_pinned ? "Lepas Sematan" : "Sematkan"}
                        className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                      >
                        <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? "fill-current text-white" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // HALAMAN 2: CANVAS CATATAN (RICH-TEXT WYSIWYG EDITOR LENGKAP & TOOLBAR RESPONSIVE)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCanvasPage = () => (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden animate-in fade-in-0 duration-150">
      {/* Header Bar Canvas */}
      <div
        className={`px-3.5 sm:px-6 py-2.5 border-b flex items-center justify-between shrink-0 gap-2 ${
          isDark ? "border-zinc-800 bg-[#09090b]" : "border-zinc-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Tombol Kembali ke Halaman 3 (File Catatan) */}
          <button
            type="button"
            onClick={() => setPageView("files")}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>File Catatan</span>
          </button>

          {/* Tombol Home */}
          <button
            type="button"
            onClick={() => setPageView("home")}
            title="Kembali ke Cover Home"
            className={`hidden sm:flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          {/* Status Simpan Monokromatik Sesuai Permintaan */}
          {/* CUKUP TULIS "Tersimpan", BUKAN HIJAU, MELAINKAN WARNA TEMA WEB text-zinc-400 */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-400 pl-2 border-l border-zinc-200 dark:border-zinc-800 ml-1">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-zinc-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Menyimpan...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Tersimpan</span>
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-zinc-400">Belum disimpan</span>
            )}
            {saveStatus === "error" && (
              <button
                type="button"
                onClick={() => persistNote(activeNoteId!, currentTitle, editorRef.current?.innerHTML || "")}
                className="flex items-center gap-1 text-red-400 hover:underline cursor-pointer"
                title={saveError || "Gagal menyimpan"}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Gagal • Coba lagi</span>
              </button>
            )}
          </div>
        </div>

        {/* Tombol Aksi Kanan (Pin, Salin, Hapus) */}
        <div className="flex items-center gap-1">
          {activeNote && (
            <button
              type="button"
              onClick={() => handleTogglePin()}
              title={activeNote.is_pinned ? "Lepas Sematan" : "Sematkan"}
              className={`p-2 rounded-xl transition cursor-pointer ${
                activeNote.is_pinned
                  ? isDark ? "bg-zinc-800 text-white" : "bg-zinc-100 text-black"
                  : isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
              }`}
            >
              <Pin className={`w-4 h-4 ${activeNote.is_pinned ? "fill-current" : ""}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyContent}
            title="Salin Teks Catatan"
            className={`p-2 rounded-xl transition cursor-pointer ${
              copiedSuccess
                ? "text-zinc-200 font-bold"
                : isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
          >
            {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            title="Hapus Catatan"
            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── TOOLBAR WYSIWYG RESPONSIVE LENGKAP ─── */}
      <div
        className={`px-3 sm:px-8 py-2 border-b flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar ${
          isDark ? "bg-[#141416] border-zinc-800/80 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
        }`}
      >
        {/* Format Karakter: Bold, Italic, Underline, Strikethrough */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-zinc-300 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("bold"); }}
            title="Tebal (Bold) - Ctrl+B"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("italic"); }}
            title="Miring (Italic) - Ctrl+I"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("underline"); }}
            title="Garis Bawah (Underline) - Ctrl+U"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("strikeThrough"); }}
            title="Coret (Strikethrough)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Daftar: Bullet, Numbered, Checklist Interaktif */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-300 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("insertUnorderedList"); }}
            title="Daftar Poin (Bulleted List)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("insertOrderedList"); }}
            title="Daftar Nomor (Numbered List)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertChecklist(); }}
            title="Checklist Interaktif"
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[11px] font-semibold hidden sm:inline">Checklist</span>
          </button>
        </div>

        {/* Tautan / Link */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-300 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={openLinkModal}
            title="Sisipkan Tautan (Link)"
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span className="text-[11px] font-semibold hidden sm:inline">Link</span>
          </button>
        </div>

        {/* Warna Teks (Palet Tema Web Monokromatik) */}
        <div className="relative px-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setShowColorDropdown((prev) => !prev);
              setShowHighlightDropdown(false);
            }}
            title="Warna Teks Monokrom"
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Palette className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showColorDropdown && (
            <div
              className={`absolute top-full mt-1.5 left-0 p-2 rounded-xl border shadow-xl z-50 flex items-center gap-1.5 ${
                isDark ? "bg-[#18181b] border-zinc-700 text-white" : "bg-white border-zinc-200 text-black"
              }`}
            >
              {[
                { label: "Default", color: isDark ? "#ffffff" : "#09090b" },
                { label: "Muted", color: "#a1a1aa" },
                { label: "Zinc Dark", color: "#52525b" },
                { label: "Soft White", color: "#e4e4e7" },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    restoreSelection();
                    execFormat("foreColor", c.color);
                    setShowColorDropdown(false);
                  }}
                  className="w-5 h-5 rounded-full border border-black/20 dark:border-white/20 transition hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Teks (Palet Tema Web Monokromatik) */}
        <div className="relative px-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setShowHighlightDropdown((prev) => !prev);
              setShowColorDropdown(false);
            }}
            title="Highlight Teks"
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Highlighter className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showHighlightDropdown && (
            <div
              className={`absolute top-full mt-1.5 left-0 p-2 rounded-xl border shadow-xl z-50 flex items-center gap-1.5 ${
                isDark ? "bg-[#18181b] border-zinc-700 text-white" : "bg-white border-zinc-200 text-black"
              }`}
            >
              {[
                { label: "Hapus", color: "transparent" },
                { label: "Subtle Dark", color: "rgba(255, 255, 255, 0.15)" },
                { label: "Subtle Gray", color: "rgba(161, 161, 170, 0.25)" },
                { label: "Subtle Light", color: "rgba(0, 0, 0, 0.10)" },
              ].map((h) => (
                <button
                  key={h.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    restoreSelection();
                    execFormat("hiliteColor", h.color);
                    setShowHighlightDropdown(false);
                  }}
                  className="w-5 h-5 rounded-md border border-zinc-400 dark:border-zinc-600 transition hover:scale-110 cursor-pointer text-[9px] flex items-center justify-center"
                  style={{ backgroundColor: h.color }}
                  title={h.label}
                >
                  {h.color === "transparent" && "✕"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Undo & Redo */}
        <div className="flex items-center gap-0.5 pl-2 border-l border-zinc-300 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("undo"); }}
            title="Urungkan (Undo) - Ctrl+Z"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("redo"); }}
            title="Ulangi (Redo) - Ctrl+Y"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── AREA KANVAS KONTEN (JUDUL & CONTENTEDITABLE WYSIWYG) ─── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 md:px-20 py-8 max-w-4xl w-full mx-auto flex flex-col overscroll-contain">
        {/* Input Judul Catatan */}
        <input
          type="text"
          value={currentTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Judul catatan..."
          className={`w-full text-2xl sm:text-4xl font-extrabold bg-transparent border-0 focus:outline-none mb-6 tracking-tight ${
            isDark ? "text-white placeholder:text-zinc-600" : "text-black placeholder:text-zinc-400"
          }`}
        />

        {/* Canvas Pengetikan WYSIWYG ContentEditable */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onClick={handleEditorClick}
          className={`flex-1 w-full focus:outline-none text-base sm:text-lg leading-relaxed min-h-[300px] prose dark:prose-invert max-w-none ${
            isDark ? "text-zinc-200" : "text-zinc-800"
          }`}
          style={{ whiteSpace: "pre-wrap" }}
        />
      </div>
    </div>
  );

  return (
    <div
      className={`h-full w-full flex flex-col overflow-hidden ${
        isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#ffffff] text-zinc-900"
      }`}
    >
      {/* ─── ROUTING 3 HALAMAN RESMI ─── */}
      {pageView === "home" && renderHomePage()}
      {pageView === "files" && renderFilesPage()}
      {pageView === "canvas" && renderCanvasPage()}

      {/* ─── MODAL INSERT LINK ─── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${
              isDark ? "bg-[#18181b] border-zinc-700/80 text-white" : "bg-white border-zinc-200 text-black"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                <Link2 className="w-4 h-4" />
                <span>Sisipkan Tautan</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Teks Tautan:</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Misal: Kunjungi Website"
                  className={`w-full text-xs px-3 py-2 rounded-xl border bg-transparent focus:outline-none ${
                    isDark ? "border-zinc-700 focus:border-white" : "border-zinc-300 focus:border-black"
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">URL Tujuan:</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full text-xs px-3 py-2 rounded-xl border bg-transparent focus:outline-none ${
                    isDark ? "border-zinc-700 focus:border-white" : "border-zinc-300 focus:border-black"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL KONFIRMASI HAPUS ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${
              isDark ? "bg-[#18181b] border-zinc-700/80 text-white" : "bg-white border-zinc-200 text-black"
            }`}
          >
            <div className="flex items-center gap-3 mb-3 text-red-400">
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
