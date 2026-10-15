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

// Generator UUID v4 yang kompatibel dengan tipe Supabase uuid
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Bersihkan jika ada elemen task-item yang bersarang (nested)
function sanitizeTaskHtml(html: string): string {
  if (!html || !html.includes("task-item")) return html;
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const taskItems = Array.from(doc.querySelectorAll(".task-item"));
      taskItems.forEach((item) => {
        const parentTask = item.parentElement?.closest(".task-item");
        if (parentTask) {
          parentTask.parentNode?.insertBefore(item, parentTask.nextSibling);
        }
      });
      return doc.body.innerHTML;
    } catch {}
  }
  return html.replace(/<span[^>]*class="[^"]*flex-1[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, (match, inner) => {
    if (inner.includes("task-item")) {
      return inner.replace(/<span[^>]*class="[^"]*flex-1[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, "$1");
    }
    return match;
  });
}

// Konversi konten lama teks biasa menjadi format HTML terstruktur yang aman
function ensureHtmlContent(raw: string): string {
  if (!raw) return "<p><br></p>";
  // Jika sudah berupa HTML (memiliki tag)
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return sanitizeTaskHtml(raw);
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

  // Modal Input Judul Catatan Baru Sebelum Masuk Canvas
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [isBodyEmpty, setIsBodyEmpty] = useState(true);

  // Modal Insert Link
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Dropdown Opsi Stabilo (Highlight)
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [activeStabiloColor, setActiveStabiloColor] = useState("#fde047");
  const stabiloContainerRef = useRef<HTMLDivElement | null>(null);

  // Buffer lokal judul dan konten HTML
  const [currentTitle, setCurrentTitle] = useState("");
  const currentTitleRef = useRef("");
  currentTitleRef.current = currentTitle;
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedSelectionRangeRef = useRef<Range | null>(null);
  const loadedNoteIdRef = useRef<string | null>(null);

  // Status tombol pemformatan aktif di toolbar
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });

  const updateActiveFormats = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {}
  }, []);

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
            // Gabungkan dengan cache lokal agar konten tulisan tidak tertimpa jika server sempat kosong
            const merged = data.notes.map((serverNote: NoteItem) => {
              const localMatch = localNotes.find((l) => l.id === serverNote.id);
              if (
                localMatch &&
                (!serverNote.content || serverNote.content === "<p><br></p>") &&
                localMatch.content &&
                localMatch.content !== "<p><br></p>"
              ) {
                return { ...serverNote, content: localMatch.content };
              }
              return serverNote;
            });
            setNotes(merged);
            localStorage.setItem(storageKey, JSON.stringify(merged));
            if (!activeNoteIdRef.current && merged.length > 0) {
              setActiveNoteId(merged[0].id);
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

  // Sinkronisasi form saat catatan aktif berubah (hanya saat berganti ID catatan yang berbeda)
  useEffect(() => {
    if (!activeNoteId) {
      loadedNoteIdRef.current = null;
      activeNoteIdRef.current = null;
      currentTitleRef.current = "";
      setCurrentTitle("");
      setIsBodyEmpty(true);
      if (editorRef.current) editorRef.current.innerHTML = "<p><br></p>";
      return;
    }

    const found = notes.find((n) => n.id === activeNoteId);
    if (!found) return;

    // PENTING: Hanya lewati jika editor sudah berisi HTML dari catatan yang bersangkutan (mencegah kursor melompat saat mengetik)
    if (
      loadedNoteIdRef.current === activeNoteId &&
      editorRef.current &&
      editorRef.current.innerHTML &&
      editorRef.current.innerHTML !== "<p><br></p>"
    ) {
      return;
    }

    loadedNoteIdRef.current = activeNoteId;
    activeNoteIdRef.current = activeNoteId;
    currentTitleRef.current = found.title;
    setCurrentTitle(found.title);
    const html = ensureHtmlContent(found.content);
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      // Sinkronisasi status checkbox DOM dengan attribute HTML
      const boxes = editorRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      boxes.forEach((cb) => {
        cb.checked = cb.hasAttribute("checked");
      });
    }
    setIsBodyEmpty(!extractPlainText(found.content).trim());
    setSaveStatus("saved");
    setSaveError(null);
  }, [activeNoteId, notes]);

  // Jaminan isi editor selalu sesuai dengan catatan aktif saat halaman canvas dibuka
  useEffect(() => {
    if (pageView === "canvas" && activeNoteId) {
      const found = notes.find((n) => n.id === activeNoteId);
      if (found && editorRef.current) {
        if (
          loadedNoteIdRef.current !== activeNoteId ||
          !editorRef.current.innerHTML ||
          editorRef.current.innerHTML === "<p><br></p>"
        ) {
          editorRef.current.innerHTML = ensureHtmlContent(found.content);
          loadedNoteIdRef.current = activeNoteId;
          const boxes = editorRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
          boxes.forEach((cb) => {
            cb.checked = cb.hasAttribute("checked");
          });
          setIsBodyEmpty(!extractPlainText(found.content).trim());
        }
      }
    }
  }, [pageView, activeNoteId, notes]);

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
    currentTitleRef.current = newTitle;
    setCurrentTitle(newTitle);
    setSaveStatus("unsaved");

    const noteId = activeNoteIdRef.current;
    if (!noteId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : "";
      persistNote(noteId, newTitle, currentHtml);
    }, 400);
  };

  // Penanganan perubahan konten WYSIWYG
  const handleEditorInput = () => {
    setSaveStatus("unsaved");
    if (editorRef.current) {
      const plain = extractPlainText(editorRef.current.innerHTML);
      setIsBodyEmpty(!plain.trim());
    }
    const noteId = activeNoteIdRef.current;
    if (!noteId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : "";
      persistNote(noteId, currentTitleRef.current || currentTitle, currentHtml);
    }, 400);
  };

  // Langsung simpan buffer tertunda saat berpindah halaman atau menutup browser
  const flushSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const noteId = activeNoteIdRef.current;
    if (!noteId || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const titleToSave = currentTitleRef.current || currentTitle;
    persistNote(noteId, titleToSave, currentHtml);
  }, [persistNote, currentTitle]);

  // Listener simpan otomatis saat jendela browser ditutup atau direfresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSave();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushSave();
    };
  }, [flushSave]);

  // Simpan snapshot seleksi kursor (menggunakan cloneRange agar tidak terdistorsi perubahan DOM)
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRangeRef.current);
    }
  };

  // Listener global seleksi teks agar kursor atau blok teks selalu tersimpan akurat
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
      const anchor = sel.anchorNode;
      if (anchor && editorRef.current.contains(anchor)) {
        savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
        updateActiveFormats();
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateActiveFormats]);

  // Tutup dropdown stabilo otomatis saat klik di luar
  useEffect(() => {
    if (!showHighlightDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        stabiloContainerRef.current &&
        !stabiloContainerRef.current.contains(e.target as Node)
      ) {
        setShowHighlightDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showHighlightDropdown]);

  // Eksekusi pemformatan teks WYSIWYG dasar dengan pemulihan seleksi otomatis
  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (savedSelectionRangeRef.current) {
      restoreSelection();
    } else if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    saveSelection();
    updateActiveFormats();
    handleEditorInput();
  };

  const activeStabiloColorRef = useRef("#fde047");

  // Terapkan highlight teks / Stabilo (Koleksi Warna Stabilo Asli & Muted)
  const applyHighlight = (color: string) => {
    if (color !== "transparent") {
      setActiveStabiloColor(color);
      activeStabiloColorRef.current = color;
    }

    // 1. Fokuskan editor kanvas terlebih dahulu agar execCommand tidak diabaikan browser
    if (editorRef.current) {
      editorRef.current.focus();
    }
    // 2. Pulihkan rentang seleksi teks yang disimpan
    if (savedSelectionRangeRef.current) {
      restoreSelection();
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setShowHighlightDropdown(false);
      return;
    }

    const range = sel.getRangeAt(0);

    if (color === "transparent") {
      try {
        document.execCommand("removeFormat", false);
      } catch {}
      try {
        document.execCommand("foreColor", false, isDark ? "#e4e4e7" : "#18181b");
      } catch {}

      // Bersihkan juga tag <mark> atau inline backgroundColor pada elemen di dalam editor
      if (editorRef.current) {
        const highlightedElements = editorRef.current.querySelectorAll("mark, [style*='background-color']");
        highlightedElements.forEach((el) => {
          if (sel.containsNode(el, true)) {
            (el as HTMLElement).style.backgroundColor = "";
            (el as HTMLElement).style.color = "";
            if (el.tagName === "MARK") {
              const textContent = el.textContent || "";
              el.replaceWith(document.createTextNode(textContent));
            }
          }
        });
      }

      // Bersihkan juga elemen induk seleksi jika berupa <mark> atau inline backgroundColor
      let node: Node | null = sel.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === "MARK" || el.style.backgroundColor) {
            el.style.backgroundColor = "";
            el.style.color = "";
            if (el.tagName === "MARK") {
              const textContent = el.innerText || el.textContent || "";
              const textNode = document.createTextNode(textContent);
              el.parentNode?.replaceChild(textNode, el);
            }
          }
        }
        node = node.parentNode;
      }
    } else {
      let applied = false;
      const isDarkNeutral = color === "#3f3f46" && isDark;
      const textColor = isDarkNeutral ? "#ffffff" : "#09090b";

      try {
        document.execCommand("styleWithCSS", false, "true");
      } catch {}

      try {
        applied = document.execCommand("hiliteColor", false, color);
        if (!applied) {
          applied = document.execCommand("backColor", false, color);
        }
        if (applied) {
          document.execCommand("foreColor", false, textColor);
        }
      } catch {}

      // Fallback menggunakan elemen <mark> jika browser menolak execCommand
      if (!applied && !range.collapsed) {
        try {
          const mark = document.createElement("mark");
          mark.style.backgroundColor = color;
          mark.style.color = textColor;
          mark.style.borderRadius = "3px";
          mark.style.padding = "1px 4px";
          mark.style.fontWeight = "500";
          mark.appendChild(range.extractContents());
          range.insertNode(mark);

          const newRange = document.createRange();
          newRange.selectNodeContents(mark);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } catch (err) {
          console.warn("Fallback highlight error:", err);
        }
      }
    }

    saveSelection();
    updateActiveFormats();
    setShowHighlightDropdown(false);
    handleEditorInput();
  };

  const handleStabiloClick = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (savedSelectionRangeRef.current) {
      restoreSelection();
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setShowHighlightDropdown((prev) => !prev);
      return;
    }
    // Cek apakah seleksi sedang dalam highlight
    const parent = sel.anchorNode?.parentElement;
    const isHighlighted =
      parent &&
      (parent.tagName === "MARK" ||
        (parent.style.backgroundColor && parent.style.backgroundColor !== "transparent"));
    if (isHighlighted) {
      applyHighlight("transparent");
    } else {
      applyHighlight(activeStabiloColorRef.current || "#fde047");
    }
  };

  // Sisipkan / Toggle checklist interaktif (mencegah bug checklist bertingkat / bersarang)
  const insertChecklist = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (savedSelectionRangeRef.current) {
      restoreSelection();
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const anchor = sel.anchorNode;
    // Cek apakah kursor sudah berada di dalam checklist item
    const existingTask = anchor
      ? ((anchor.nodeType === Node.ELEMENT_NODE
          ? (anchor as HTMLElement)
          : anchor.parentElement
        )?.closest(".task-item") as HTMLElement | null)
      : null;

    // Jika sudah di dalam checklist -> TOGGLE OFF (kembalikan ke paragraf biasa)
    if (existingTask) {
      const span = existingTask.querySelector("span");
      const text = span ? span.innerText.replace(/[\n\r]/g, "").trim() : "";
      const p = document.createElement("p");
      p.innerHTML = text ? text : "<br>";
      existingTask.parentNode?.replaceChild(p, existingTask);

      const newRange = document.createRange();
      newRange.selectNodeContents(p);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
      saveSelection();
      handleEditorInput();
      updateActiveFormats();
      return;
    }

    // Jika belum di checklist -> ubah baris saat ini menjadi checklist baru
    const selectedText = sel.toString().trim();
    const blockEl = anchor
      ? ((anchor.nodeType === Node.ELEMENT_NODE
          ? (anchor as HTMLElement)
          : anchor.parentElement
        )?.closest("p, div, li") as HTMLElement | null)
      : null;

    const lineText =
      selectedText ||
      (blockEl && blockEl !== editorRef.current ? blockEl.innerText.replace(/[\n\r]/g, "").trim() : "");
    const itemText = lineText || "Tugas baru";

    const taskWrapper = document.createElement("div");
    taskWrapper.className = "flex items-start gap-2.5 my-1.5 task-item";
    taskWrapper.innerHTML = `
      <input type="checkbox" contenteditable="false" class="mt-1 w-4 h-4 rounded-xs cursor-pointer accent-zinc-500 shrink-0" />
      <span class="flex-1 focus:outline-none">${itemText}</span>
    `;

    if (blockEl && blockEl !== editorRef.current && blockEl.parentNode && blockEl.parentNode === editorRef.current) {
      blockEl.parentNode.replaceChild(taskWrapper, blockEl);
    } else {
      range.deleteContents();
      range.insertNode(taskWrapper);
    }

    const span = taskWrapper.querySelector("span");
    if (span) {
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      // PENTING: collapse ke ujung akhir teks agar klik tombol berikutnya tidak menimpa teks
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
      saveSelection();
    }

    handleEditorInput();
    updateActiveFormats();
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
    const selected = sel ? sel.toString().trim() : "";
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
    saveSelection();
    handleEditorInput();
  };

  // Fokus kursor ke awal teks editor (jika tidak sedang memblok teks)
  const focusEditorAtStart = () => {
    const activeSel = window.getSelection();
    if (activeSel && !activeSel.isCollapsed && activeSel.toString().length > 0) {
      return;
    }
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  // Fokus kursor ke akhir teks editor (saat klik area kosong canvas, tanpa merusak blok teks aktif)
  const focusEditorAtEnd = () => {
    const activeSel = window.getSelection();
    if (activeSel && !activeSel.isCollapsed && activeSel.toString().length > 0) {
      return;
    }
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  // Keyboard shortcut & penanganan tombol seperti notepad standar
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Tombol Tab untuk indentasi teks tanpa berpindah fokus keluar
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
      handleEditorInput();
      return;
    }

    // Tombol Backspace pada checklist item yang kosong
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const anchorNode = sel.anchorNode;
        const taskItem = anchorNode
          ? ((anchorNode.nodeType === Node.ELEMENT_NODE
              ? (anchorNode as HTMLElement)
              : anchorNode.parentElement
            )?.closest(".task-item") as HTMLElement | null)
          : null;

        if (taskItem) {
          const span = taskItem.querySelector("span");
          const itemText = span ? span.innerText.replace(/[\n\r]/g, "").trim() : "";
          if (!itemText) {
            e.preventDefault();
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            taskItem.parentNode?.insertBefore(p, taskItem);
            taskItem.remove();
            const range = document.createRange();
            range.setStart(p, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            handleEditorInput();
            updateActiveFormats();
            return;
          }
        }
      }
    }

    // Tombol Enter pada checklist interaktif
    if (e.key === "Enter") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const anchorNode = sel.anchorNode;
        const taskItem = anchorNode
          ? ((anchorNode.nodeType === Node.ELEMENT_NODE
              ? (anchorNode as HTMLElement)
              : anchorNode.parentElement
            )?.closest(".task-item") as HTMLElement | null)
          : null;

        if (taskItem) {
          const span = taskItem.querySelector("span");
          const itemText = span ? span.innerText.replace(/[\n\r]/g, "").trim() : "";

          // Jika checklist kosong dan ditekan enter -> keluar dari checklist ke paragraf biasa
          if (!itemText) {
            e.preventDefault();
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            taskItem.parentNode?.insertBefore(p, taskItem.nextSibling);
            taskItem.remove();
            const range = document.createRange();
            range.setStart(p, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            handleEditorInput();
            updateActiveFormats();
            return;
          }

          // Jika checklist ada isinya -> buat baris checklist baru secara otomatis
          e.preventDefault();
          const newTask = document.createElement("div");
          newTask.className = "flex items-start gap-2.5 my-1.5 task-item";
          newTask.innerHTML = `
            <input type="checkbox" contenteditable="false" class="mt-1 w-4 h-4 rounded-xs cursor-pointer accent-zinc-500 shrink-0" />
            <span class="flex-1 focus:outline-none"><br></span>
          `;
          taskItem.parentNode?.insertBefore(newTask, taskItem.nextSibling);

          const newSpan = newTask.querySelector("span");
          if (newSpan) {
            const range = document.createRange();
            range.setStart(newSpan, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          handleEditorInput();
          updateActiveFormats();
          return;
        }
      }
    }

    setTimeout(updateActiveFormats, 10);
  };

  // Buka modal input judul catatan baru sebelum masuk ke halaman canvas
  const openNewNoteModal = () => {
    setNewNoteTitle("");
    setShowNewNoteModal(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 60);
  };

  // Konfirmasi pembuatan catatan baru dengan judul yang dimasukkan pengguna
  const handleConfirmNewNote = async () => {
    const trimmedTitle = newNoteTitle.trim();
    if (!trimmedTitle) return;

    setShowNewNoteModal(false);
    flushSave();

    const newId = generateUUID();
    const now = new Date().toISOString();

    const newNote: NoteItem = {
      id: newId,
      user_id: user?.id || "guest",
      title: trimmedTitle,
      content: "<p><br></p>",
      is_pinned: false,
      created_at: now,
      updated_at: now,
    };

    loadedNoteIdRef.current = newId;
    activeNoteIdRef.current = newId;
    currentTitleRef.current = trimmedTitle;

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
    setCurrentTitle(trimmedTitle);
    setIsBodyEmpty(true);
    if (editorRef.current) {
      editorRef.current.innerHTML = "<p><br></p>";
    }

    // Pindah ke Halaman 2 (Canvas Editor)
    setPageView("canvas");
    setSaveStatus("saved");

    // Langsung arahkan kursor ke canvas penulisan
    setTimeout(() => {
      focusEditorAtStart();
      updateActiveFormats();
    }, 120);

    try {
      localStorage.setItem(storageKey, JSON.stringify([newNote, ...notes]));
    } catch {}

    if (user?.id) {
      try {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newId,
            title: newNote.title,
            content: newNote.content,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.note?.id) {
            const serverNote = data.note;
            setNotes((prev) =>
              prev.map((n) => {
                if (n.id === newId) {
                  const latestContent = editorRef.current ? editorRef.current.innerHTML : n.content;
                  return {
                    ...serverNote,
                    title: currentTitleRef.current || serverNote.title,
                    content: latestContent && latestContent !== "<p><br></p>" ? latestContent : serverNote.content,
                  };
                }
                return n;
              })
            );
          }
        }
      } catch (err) {
        console.warn("[notebook] create server error:", err);
      }
    }
  };

  // Buka catatan tertentu dari Halaman 3 (Semua File) ke Halaman 2 (Canvas)
  const handleSelectNoteFromGrid = (note: NoteItem) => {
    flushSave();
    loadedNoteIdRef.current = note.id;
    activeNoteIdRef.current = note.id;
    currentTitleRef.current = note.title;
    setActiveNoteId(note.id);
    setCurrentTitle(note.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = ensureHtmlContent(note.content);
      const boxes = editorRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      boxes.forEach((cb) => {
        cb.checked = cb.hasAttribute("checked");
      });
    }
    setIsBodyEmpty(!extractPlainText(note.content).trim());
    setPageView("canvas");
    setTimeout(updateActiveFormats, 50);
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
    loadedNoteIdRef.current = null;

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
      {/* Header Atas: Bersih tanpa badge dan tanpa tombol semua catatan */}
      <div className="w-full max-w-4xl mx-auto shrink-0 z-20 flex items-center justify-between min-h-[40px]">
        {onTogglePanel ? (
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
        ) : <div />}
        <div />
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
          {/* Tombol 1: Create New -> Menampilkan modal input judul terlebih dahulu */}
          <button
            type="button"
            onClick={openNewNoteModal}
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
            onClick={openNewNoteModal}
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
              onClick={openNewNoteModal}
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
            onClick={() => {
              flushSave();
              setPageView("files");
            }}
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
            onClick={() => {
              flushSave();
              setPageView("home");
            }}
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
              activeFormats.bold
                ? isDark ? "bg-zinc-700 text-white font-bold" : "bg-zinc-200 text-black font-bold"
                : isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("italic"); }}
            title="Miring (Italic) - Ctrl+I"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeFormats.italic
                ? isDark ? "bg-zinc-700 text-white font-bold" : "bg-zinc-200 text-black font-bold"
                : isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("underline"); }}
            title="Garis Bawah (Underline) - Ctrl+U"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeFormats.underline
                ? isDark ? "bg-zinc-700 text-white font-bold" : "bg-zinc-200 text-black font-bold"
                : isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("strikeThrough"); }}
            title="Coret (Strikethrough)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeFormats.strikeThrough
                ? isDark ? "bg-zinc-700 text-white font-bold" : "bg-zinc-200 text-black font-bold"
                : isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
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
              activeFormats.unorderedList
                ? isDark ? "bg-zinc-700 text-white font-bold" : "bg-zinc-200 text-black font-bold"
                : isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat("insertOrderedList"); }}
            title="Daftar Nomor (Numbered List)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              activeFormats.orderedList
                ? isDark ? "bg-zinc-700 text-white font-bold" : "bg-zinc-200 text-black font-bold"
                : isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
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
        {/* Tautan / Link */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-300 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
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

        {/* Stabilo / Highlight Teks (Koleksi Warna Stabilo Asli & Muted) */}
        <div ref={stabiloContainerRef} className="relative px-1 shrink-0 flex items-center">
          <div className="flex items-center rounded-lg border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-100/60 dark:bg-zinc-800/60">
            {/* Tombol Utama Stabilo: 1-Klik Langsung Highlight Teks yang Diseleksi */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleStabiloClick();
              }}
              title="Stabilo (Highlight) - Terapkan / Hapus Warna Stabilo"
              className={`p-1.5 rounded-l-lg transition cursor-pointer flex items-center gap-1.5 text-xs ${
                isDark ? "hover:bg-zinc-700 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
              }`}
            >
              <div className="relative flex flex-col items-center">
                <Highlighter className="w-4 h-4" />
                <span
                  className="w-3.5 h-1 rounded-full mt-0.5"
                  style={{
                    backgroundColor:
                      activeStabiloColor && activeStabiloColor !== "transparent"
                        ? activeStabiloColor
                        : "#fde047",
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold hidden md:inline">Stabilo</span>
            </button>

            {/* Tombol Dropdown Opsi Pilihan Warna Stabilo */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => setShowHighlightDropdown((prev) => !prev)}
              title="Pilihan Warna Stabilo"
              className={`p-1.5 rounded-r-lg transition cursor-pointer border-l border-zinc-300/80 dark:border-zinc-700/80 ${
                isDark ? "hover:bg-zinc-700 hover:text-white" : "hover:bg-zinc-200 hover:text-black"
              }`}
            >
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </div>

          {showHighlightDropdown && (
            <div
              className={`absolute top-full mt-2 left-0 p-2.5 rounded-2xl border shadow-2xl z-50 flex items-center gap-2 ${
                isDark ? "bg-[#18181b] border-zinc-700 text-white" : "bg-white border-zinc-200 text-black"
              }`}
            >
              {[
                { label: "Hapus Stabilo", color: "transparent", bg: isDark ? "#27272a" : "#f4f4f5", text: isDark ? "#ffffff" : "#09090b" },
                { label: "Kuning Stabilo", color: "#fde047", bg: "#fde047", text: "#09090b" },
                { label: "Hijau Stabilo", color: "#86efac", bg: "#86efac", text: "#09090b" },
                { label: "Biru Stabilo", color: "#7dd3fc", bg: "#7dd3fc", text: "#09090b" },
                { label: "Pink Stabilo", color: "#f472b6", bg: "#f472b6", text: "#09090b" },
                { label: "Oranye Stabilo", color: "#fb923c", bg: "#fb923c", text: "#09090b" },
                { label: "Ungu Stabilo", color: "#c084fc", bg: "#c084fc", text: "#09090b" },
                { label: isDark ? "Netral Gelap" : "Netral Terang", color: isDark ? "#3f3f46" : "#e4e4e7", bg: isDark ? "#3f3f46" : "#e4e4e7", text: isDark ? "#ffffff" : "#09090b" },
              ].map((h) => {
                const isSelected = activeStabiloColor === h.color;
                return (
                  <button
                    key={h.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyHighlight(h.color);
                    }}
                    className={`w-6 h-6 rounded-full border transition transform hover:scale-120 cursor-pointer text-[10px] flex items-center justify-center font-bold ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                        : "opacity-90 hover:opacity-100"
                    } ${isDark ? "border-zinc-600 ring-offset-[#18181b]" : "border-zinc-300 ring-offset-white"}`}
                    style={{
                      backgroundColor: h.bg,
                      color: h.text,
                    }}
                    title={h.label}
                  >
                    {h.color === "transparent" ? "✕" : isSelected ? "✓" : ""}
                  </button>
                );
              })}
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

      {/* ─── AREA KANVAS KONTEN (JUDUL & CONTENTEDITABLE WYSIWYG SEPERTI NOTEPAD) ─── */}
      <div
        onClick={(e) => {
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed && sel.toString().length > 0) return;
          if (e.target === e.currentTarget) {
            focusEditorAtEnd();
          }
        }}
        className="flex-1 overflow-y-auto px-4 sm:px-12 md:px-20 py-8 max-w-4xl w-full mx-auto flex flex-col overscroll-contain cursor-text selection:bg-zinc-600 selection:text-white dark:selection:bg-zinc-600 dark:selection:text-white"
      >
        {/* Input Judul Catatan: Tekan Enter otomatis melompat ke badan tulisan */}
        <input
          type="text"
          value={currentTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusEditorAtStart();
            }
          }}
          placeholder="Judul catatan..."
          className={`notebook-title-input w-full text-2xl sm:text-4xl font-extrabold bg-transparent border-0 focus:outline-none mb-6 tracking-tight ${
            isDark ? "text-white placeholder:text-zinc-600" : "text-black placeholder:text-zinc-400"
          }`}
        />

        {/* Canvas Pengetikan WYSIWYG ContentEditable */}
        <div
          onClick={(e) => {
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed && sel.toString().length > 0) return;
            if (e.target === e.currentTarget) {
              focusEditorAtEnd();
            }
          }}
          className="relative flex-1 flex flex-col min-h-[400px] pb-24 cursor-text"
        >
          {isBodyEmpty && (
            <div
              onClick={focusEditorAtStart}
              className="absolute top-0 left-0 pointer-events-none select-none text-zinc-400 dark:text-zinc-600 text-base sm:text-lg leading-relaxed"
            >
              Mulai ketik catatan di sini...
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onBlur={flushSave}
            onClick={(e) => {
              handleEditorClick(e);
              saveSelection();
              updateActiveFormats();
            }}
            onKeyDown={handleEditorKeyDown}
            onMouseUp={() => {
              saveSelection();
              updateActiveFormats();
            }}
            onKeyUp={() => {
              saveSelection();
              updateActiveFormats();
            }}
            className={`notebook-canvas-editor flex-1 w-full focus:outline-none text-base sm:text-lg leading-relaxed min-h-[400px] select-text ${
              isDark ? "text-zinc-200" : "text-zinc-800"
            }`}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`h-full w-full flex flex-col overflow-hidden ${
        isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#ffffff] text-zinc-900"
      }`}
    >
      {/* ─── ROUTING 3 HALAMAN RESMI (Dipertahankan di DOM agar canvas & editorRef tidak unmount) ─── */}
      <div className={`h-full w-full flex-col flex-1 ${pageView === "home" ? "flex" : "hidden"}`}>
        {renderHomePage()}
      </div>
      <div className={`h-full w-full flex-col flex-1 ${pageView === "files" ? "flex" : "hidden"}`}>
        {renderFilesPage()}
      </div>
      <div className={`h-full w-full flex-col flex-1 ${pageView === "canvas" ? "flex" : "hidden"}`}>
        {renderCanvasPage()}
      </div>

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

      {/* ─── MODAL INPUT JUDUL CATATAN BARU SEBELUM MASUK CANVAS ─── */}
      {showNewNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${
              isDark ? "bg-[#18181b] border-zinc-700/80 text-white" : "bg-white border-zinc-200 text-black"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span>Buat Catatan Baru</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowNewNoteModal(false)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Masukkan judul catatan barumu untuk melanjutkan ke halaman penulisan.
            </p>

            <div className="mb-5">
              <input
                ref={titleInputRef}
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newNoteTitle.trim()) {
                    e.preventDefault();
                    handleConfirmNewNote();
                  } else if (e.key === "Escape") {
                    setShowNewNoteModal(false);
                  }
                }}
                placeholder="Judul catatan..."
                className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-transparent focus:outline-none transition ${
                  isDark
                    ? "border-zinc-700 focus:border-white text-white placeholder:text-zinc-600"
                    : "border-zinc-300 focus:border-black text-black placeholder:text-zinc-400"
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewNoteModal(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmNewNote}
                disabled={!newNoteTitle.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                  newNoteTitle.trim()
                    ? isDark
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "bg-black text-white hover:bg-zinc-800"
                    : isDark
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
