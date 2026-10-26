'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/app/components/faith/Header';
import Navigation from '@/app/components/faith/Navigation';
import { useFaithNav } from '@/lib/faith/navigationContext';
import { getStoredUser, DEFAULT_USER } from '@/lib/faith/session';
import { BIBLE_BOOKS, BibleBook, BibleVerse, ROMA_8_FULL_VERSES } from '@/lib/faith/bible/data';
import { getChapterVerses, getCachedChapterVerses, getRandomVerse, prefetchChapter, preloadBook } from '@/lib/faith/bible/service';
import { User, Note } from '@/types/database';
import { getNotes, saveNote, createBlankNote, formatNoteDate } from '@/lib/faith/notes/storage';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  RotateCw, 
  Loader2, 
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Trash2,
  Bookmark,
  Share2,
  CheckCheck,
  ExternalLink,
  FileText,
  Plus,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  PenLine,
} from 'lucide-react';

interface HighlightData {
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
  text: string;
  reference: string;
  updatedAt: string;
  bookId?: string;
  bookName?: string;
  chapter?: number;
  verse?: number;
}

const HIGHLIGHT_COLORS: { id: HighlightData['color']; label: string; bgClass: string; dotClass: string; borderClass: string }[] = [
  { id: 'yellow', label: 'Kuning', bgClass: 'bg-amber-100/90 text-amber-950 border-l-3 border-amber-400', dotClass: 'bg-amber-300 border-amber-400', borderClass: 'border-amber-400' },
  { id: 'green', label: 'Hijau', bgClass: 'bg-emerald-100/90 text-emerald-950 border-l-3 border-emerald-400', dotClass: 'bg-emerald-300 border-emerald-400', borderClass: 'border-emerald-400' },
  { id: 'blue', label: 'Biru', bgClass: 'bg-sky-100/90 text-sky-950 border-l-3 border-sky-400', dotClass: 'bg-sky-300 border-sky-400', borderClass: 'border-sky-400' },
  { id: 'pink', label: 'Pink', bgClass: 'bg-rose-100/90 text-rose-950 border-l-3 border-rose-400', dotClass: 'bg-rose-300 border-rose-400', borderClass: 'border-rose-400' },
  { id: 'purple', label: 'Ungu', bgClass: 'bg-purple-100/90 text-purple-950 border-l-3 border-purple-400', dotClass: 'bg-purple-300 border-purple-400', borderClass: 'border-purple-400' },
];

const STORAGE_HIGHLIGHTS_KEY = 'faith_hub_bible_highlights_v1';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

export default function BiblePage() {
  const { setActiveTab } = useFaithNav();
  const [user, setUser] = useState<User>(DEFAULT_USER);
  
  // Active reading state
  const [selectedBook, setSelectedBook] = useState<BibleBook>(
    BIBLE_BOOKS.find((b) => b.id === 'rom') || BIBLE_BOOKS[0]
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(8);
  const [verses, setVerses] = useState<BibleVerse[]>(() => {
    const cached = getCachedChapterVerses('rom', 8);
    return cached?.verses || ROMA_8_FULL_VERSES;
  });
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Book & Chapter Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'PL' | 'PB'>('PB');
  const [pickerSearch, setPickerSearch] = useState('');
  const [tempBookForChapterPick, setTempBookForChapterPick] = useState<BibleBook | null>(null);

  // Verse Highlighting & Selection (Multi-Verse Support)
  const [selectedVerses, setSelectedVerses] = useState<BibleVerse[]>([]);
  const [highlights, setHighlights] = useState<Record<string, HighlightData>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Saved Highlights Special View / Modal
  const [isHighlightsModalOpen, setIsHighlightsModalOpen] = useState(false);
  const [highlightsSearch, setHighlightsSearch] = useState('');
  const [highlightsColorFilter, setHighlightsColorFilter] = useState<'all' | HighlightData['color']>('all');

  // AI Reflection Guided Questionnaire & Target Verse
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiStep, setAiStep] = useState<'questionnaire' | 'result'>('questionnaire');
  const [aiTargetVerseRef, setAiTargetVerseRef] = useState('');
  const [aiTargetVerseText, setAiTargetVerseText] = useState('');
  const [aiStruggle, setAiStruggle] = useState('');
  const [aiDesire, setAiDesire] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    thought?: string;
    prayer?: string;
    reflectionQuestion?: string;
    suggestedVerses?: { reference: string; note: string }[];
    error?: string;
  } | null>(null);

  // Notes Integration
  const [isNotePickerOpen, setIsNotePickerOpen] = useState(false);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSavingToNote, setIsSavingToNote] = useState(false);
  const [noteSaveSuccess, setNoteSaveSuccess] = useState<{
    noteId: string;
    noteTitle: string;
    isNew: boolean;
  } | null>(null);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Load User & Saved Highlights on Mount
  useEffect(() => {
    try {
      sessionStorage.setItem('faith_hub_intro_seen', 'true');
    } catch {}
    const currentUser = getStoredUser() || DEFAULT_USER;
    setUser(currentUser);

    const userKey = currentUser.id || currentUser.token || 'user';
    const accountStorageKey = `faith_hub_bible_highlights_${userKey}`;

    try {
      let saved = localStorage.getItem(accountStorageKey);
      if (!saved) {
        saved = localStorage.getItem(STORAGE_HIGHLIGHTS_KEY);
      }
      if (saved) {
        setHighlights(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load highlights from localStorage', e);
    }
  }, []);

  // Save Highlights to localStorage whenever updated (per-account and global backup)
  const saveHighlights = (newHighlights: Record<string, HighlightData>) => {
    setHighlights(newHighlights);
    try {
      const userKey = user.id || user.token || 'user';
      const accountStorageKey = `faith_hub_bible_highlights_${userKey}`;
      localStorage.setItem(accountStorageKey, JSON.stringify(newHighlights));
      localStorage.setItem(STORAGE_HIGHLIGHTS_KEY, JSON.stringify(newHighlights));
    } catch (e) {
      console.warn('Failed to save highlights to localStorage', e);
    }
  };

  // Fetch chapter verses when book or chapter changes
  useEffect(() => {
    let isCancelled = false;

    async function loadVerses() {
      // 1. Instant check: if verses already in memory/localStorage cache, show immediately (0ms)!
      const instant = getCachedChapterVerses(selectedBook.id, selectedChapter);
      if (instant && instant.verses && instant.verses.length > 0) {
        setVerses(instant.verses);
        setIsLoadingVerses(false);
        setSelectedVerses([]);
        if (mainScrollRef.current) {
          mainScrollRef.current.scrollTop = 0;
        }

        // Quietly prefetch adjacent chapters
        if (selectedChapter > 1) {
          prefetchChapter(selectedBook.id, selectedChapter - 1);
        }
        if (selectedChapter < selectedBook.chapters) {
          prefetchChapter(selectedBook.id, selectedChapter + 1);
        }
        return;
      }

      // 2. Only show loading indicator if not cached yet
      setIsLoadingVerses(true);
      setSelectedVerses([]);
      try {
        const result = await getChapterVerses(selectedBook.id, selectedChapter);
        if (!isCancelled) {
          setVerses(result.verses || []);
          if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = 0;
          }

          // If verses were loaded successfully, quietly prefetch adjacent chapters
          if (result.verses && result.verses.length > 0) {
            if (selectedChapter > 1) {
              prefetchChapter(selectedBook.id, selectedChapter - 1);
            }
            if (selectedChapter < selectedBook.chapters) {
              prefetchChapter(selectedBook.id, selectedChapter + 1);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load verses:', err);
        if (!isCancelled) {
          setVerses([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingVerses(false);
        }
      }
    }

    loadVerses();
    return () => {
      isCancelled = true;
    };
  }, [selectedBook, selectedChapter]);

  // Navigate Previous / Next Chapter
  const currentBookIndex = BIBLE_BOOKS.findIndex((b) => b.id === selectedBook.id);

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      const targetCh = selectedChapter - 1;
      const cached = getCachedChapterVerses(selectedBook.id, targetCh);
      if (cached?.verses && cached.verses.length > 0) {
        setVerses(cached.verses);
      }
      setSelectedChapter(targetCh);
    } else if (currentBookIndex > 0) {
      const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
      preloadBook(prevBook.id);
      const cached = getCachedChapterVerses(prevBook.id, prevBook.chapters);
      if (cached?.verses && cached.verses.length > 0) {
        setVerses(cached.verses);
      }
      setSelectedBook(prevBook);
      setSelectedChapter(prevBook.chapters);
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < selectedBook.chapters) {
      const targetCh = selectedChapter + 1;
      const cached = getCachedChapterVerses(selectedBook.id, targetCh);
      if (cached?.verses && cached.verses.length > 0) {
        setVerses(cached.verses);
      }
      setSelectedChapter(targetCh);
    } else if (currentBookIndex < BIBLE_BOOKS.length - 1) {
      const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
      preloadBook(nextBook.id);
      const cached = getCachedChapterVerses(nextBook.id, 1);
      if (cached?.verses && cached.verses.length > 0) {
        setVerses(cached.verses);
      }
      setSelectedBook(nextBook);
      setSelectedChapter(1);
    }
  };

  // Helper to format combined reference e.g. "Roma 8:1-3" or "Roma 8:1, 3, 5"
  function formatVerseReference(bookName: string, chapter: number, selected: BibleVerse[]): string {
    if (selected.length === 0) return '';
    if (selected.length === 1) return `${bookName} ${chapter}:${selected[0].verse}`;

    const numbers = [...selected].map((v) => v.verse).sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = numbers[0];
    let end = numbers[0];

    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] === end + 1) {
        end = numbers[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = numbers[i];
        end = numbers[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);

    return `${bookName} ${chapter}:${ranges.join(', ')}`;
  }

  // Helper to format combined text with verse numbers
  function formatCombinedVerseText(selected: BibleVerse[]): string {
    if (selected.length === 0) return '';
    const sorted = [...selected].sort((a, b) => a.verse - b.verse);
    if (sorted.length === 1) return sorted[0].text;
    return sorted.map((v) => `(${v.verse}) ${v.text}`).join(' ');
  }

  // Tap Verse Handler: supports multi-verse selection
  const handleVerseTap = (verse: BibleVerse) => {
    setSelectedVerses((prev) => {
      const exists = prev.some((sv) => sv.verse === verse.verse);
      if (exists) {
        return prev.filter((sv) => sv.verse !== verse.verse);
      } else {
        const next = [...prev, verse];
        return next.sort((a, b) => a.verse - b.verse);
      }
    });
  };

  // Apply Highlight Color to all selected verses
  const handleApplyHighlight = (color: HighlightData['color']) => {
    if (selectedVerses.length === 0) return;
    const updated = { ...highlights };
    const now = new Date().toISOString();

    selectedVerses.forEach((v) => {
      const key = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
      updated[key] = {
        color,
        text: v.text,
        reference: key,
        updatedAt: now,
        bookId: selectedBook.id,
        bookName: selectedBook.name,
        chapter: selectedChapter,
        verse: v.verse,
      };
    });

    saveHighlights(updated);
  };

  // Remove Highlight from all selected verses
  const handleRemoveHighlight = () => {
    if (selectedVerses.length === 0) return;
    const updated = { ...highlights };
    selectedVerses.forEach((v) => {
      const key = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
      delete updated[key];
    });
    saveHighlights(updated);
  };

  // Copy Selected Verses Text (single or combined)
  const handleCopySelectedVerses = () => {
    if (selectedVerses.length === 0) return;
    const ref = formatVerseReference(selectedBook.name, selectedChapter, selectedVerses);
    const combinedText = formatCombinedVerseText(selectedVerses);
    const textToCopy = `${ref} (TB)\n"${combinedText}"`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedKey(ref);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Open AI Reflection with questionnaire
  function openAiModalWithVerse(verseRef: string, verseText: string) {
    setAiTargetVerseRef(verseRef);
    setAiTargetVerseText(verseText);
    setAiStruggle('');
    setAiDesire('');
    setAiResponse(null);
    setAiStep('questionnaire');
    setNoteSaveSuccess(null);
    setIsAiModalOpen(true);
  }

  // Submit questionnaire and generate reflection
  async function handleGenerateReflection() {
    setAiLoading(true);
    setAiResponse(null);
    setAiStep('result');
    setNoteSaveSuccess(null);

    const promptContext = `Ayat: ${aiTargetVerseRef} ("${aiTargetVerseText}")`;
    const formattedUserAnswers = [
      aiStruggle.trim() ? `Pergumulan/Situasi: ${aiStruggle.trim()}` : '',
      aiDesire.trim() ? `Harapan/Kebutuhan: ${aiDesire.trim()}` : '',
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/ai/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: promptContext,
          verse: aiTargetVerseRef,
          struggle: aiStruggle.trim() || undefined,
          desire: aiDesire.trim() || undefined,
          userAnswers: formattedUserAnswers || undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta',
        }),
      });
      const data = await res.json();
      setAiResponse(data);
    } catch (err) {
      console.error('Failed to get AI reflection', err);
      setAiResponse({ error: 'Gagal mendapatkan renungan. Silakan coba kembali.' });
    } finally {
      setAiLoading(false);
    }
  }

  // Load existing notes and open note picker
  const handleOpenNotePicker = async () => {
    setIsNotePickerOpen(true);
    setIsLoadingNotes(true);
    try {
      const userId = user.id || user.token;
      if (userId) {
        const loaded = await getNotes(userId);
        setUserNotes(loaded);
      }
    } catch (err) {
      console.warn('Failed to load notes for reflection integration', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Helper to construct HTML content from devotion
  const buildDevotionHtml = () => {
    if (!aiResponse) return '';
    const parts: string[] = [];
    parts.push(`<div><strong>Renungan Alkitab: ${escapeHtml(aiTargetVerseRef)}</strong></div>`);
    if (aiTargetVerseText) {
      parts.push(`<div><em>&ldquo;${escapeHtml(aiTargetVerseText)}&rdquo;</em></div>`);
    }
    parts.push('<br>');
    if (aiStruggle || aiDesire) {
      parts.push('<div><strong>Refleksi Pribadi:</strong></div>');
      if (aiStruggle) parts.push(`<div>• Pergumulan: ${escapeHtml(aiStruggle)}</div>`);
      if (aiDesire) parts.push(`<div>• Harapan: ${escapeHtml(aiDesire)}</div>`);
      parts.push('<br>');
    }
    if (aiResponse.thought) {
      parts.push('<div><strong>Pesan Firman:</strong></div>');
      parts.push(`<div>${escapeHtml(aiResponse.thought)}</div>`);
      parts.push('<br>');
    }
    if (aiResponse.prayer) {
      parts.push('<div><strong>Doa Peneguhan:</strong></div>');
      parts.push(`<div><em>&ldquo;${escapeHtml(aiResponse.prayer)}&rdquo;</em></div>`);
      parts.push('<br>');
    }
    if (aiResponse.reflectionQuestion) {
      parts.push('<div><strong>Pertanyaan Refleksi:</strong></div>');
      parts.push(`<div>${escapeHtml(aiResponse.reflectionQuestion)}</div>`);
      parts.push('<br>');
    }
    if (aiResponse.suggestedVerses && aiResponse.suggestedVerses.length > 0) {
      parts.push('<div><strong>Ayat Terkait:</strong></div>');
      aiResponse.suggestedVerses.forEach((sv) => {
        parts.push(`<div>• ${escapeHtml(sv.reference)}: ${escapeHtml(sv.note)}</div>`);
      });
    }
    return parts.join('');
  };

  // Save devotion into a brand new note
  const handleSaveToNewNote = async () => {
    if (!aiResponse || !user) return;
    setIsSavingToNote(true);
    try {
      const userId = user.id || user.token;
      const blank = createBlankNote(userId);
      const title = `Renungan: ${aiTargetVerseRef}`;
      const devotionHtml = buildDevotionHtml();

      const noteToSave: Note = {
        ...blank,
        title,
        content: devotionHtml,
      };

      await saveNote(noteToSave);
      setNoteSaveSuccess({
        noteId: noteToSave.id,
        noteTitle: title,
        isNew: true,
      });
      setIsNotePickerOpen(false);
    } catch (err) {
      console.error('Failed to create new note from devotion', err);
      alert('Gagal menyimpan renungan ke catatan baru.');
    } finally {
      setIsSavingToNote(false);
    }
  };

  // Append devotion into an existing note
  const handleAppendToExistingNote = async (targetNote: Note) => {
    if (!aiResponse || !user) return;
    setIsSavingToNote(true);
    try {
      const devotionHtml = buildDevotionHtml();
      let updatedContent = '';
      if (targetNote.content && targetNote.content.trim()) {
        updatedContent = `${targetNote.content}<br><hr style="border:none;border-top:1px dashed #dcdce0;margin:16px 0;"><br>${devotionHtml}`;
      } else {
        updatedContent = devotionHtml;
      }

      const updatedNote: Note = {
        ...targetNote,
        content: updatedContent,
      };

      await saveNote(updatedNote);
      setNoteSaveSuccess({
        noteId: targetNote.id,
        noteTitle: targetNote.title || 'Catatan',
        isNew: false,
      });
      setIsNotePickerOpen(false);
    } catch (err) {
      console.error('Failed to append devotion to existing note', err);
      alert('Gagal menambahkan renungan ke catatan.');
    } finally {
      setIsSavingToNote(false);
    }
  };

  // Combined AI Reflection for all selected verses
  const handleReflectSelectedVerses = () => {
    if (selectedVerses.length === 0) return;
    const ref = formatVerseReference(selectedBook.name, selectedChapter, selectedVerses);
    const combinedText = formatCombinedVerseText(selectedVerses);
    openAiModalWithVerse(ref, combinedText);
    setSelectedVerses([]);
  };

  // Jump to specific verse from Highlights List
  const handleJumpToHighlight = (hl: HighlightData) => {
    let targetBook: BibleBook | undefined;
    if (hl.bookId) {
      targetBook = BIBLE_BOOKS.find((b) => b.id === hl.bookId);
    }
    if (!targetBook && hl.bookName) {
      targetBook = BIBLE_BOOKS.find((b) => b.name.toLowerCase() === hl.bookName?.toLowerCase());
    }
    if (!targetBook) {
      const match = hl.reference.match(/^(.+?)\s+(\d+):(\d+)$/);
      if (match) {
        const bName = match[1];
        targetBook = BIBLE_BOOKS.find((b) => b.name.toLowerCase() === bName.toLowerCase());
      }
    }

    let targetChapter = hl.chapter;
    let targetVerseNum = hl.verse;
    if (!targetChapter || !targetVerseNum) {
      const match = hl.reference.match(/^(.+?)\s+(\d+):(\d+)$/);
      if (match) {
        targetChapter = parseInt(match[2], 10);
        targetVerseNum = parseInt(match[3], 10);
      }
    }

    if (targetBook && targetChapter) {
      setSelectedBook(targetBook);
      setSelectedChapter(targetChapter);
      setIsHighlightsModalOpen(false);

      setTimeout(() => {
        const el = document.getElementById(`verse-${targetVerseNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
    } else {
      setIsHighlightsModalOpen(false);
    }
  };

  // Sorted list of all highlights
  const highlightList = Object.values(highlights).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Filtered highlights list for modal
  const filteredHighlightList = highlightList.filter((hl) => {
    const matchesColor = highlightsColorFilter === 'all' || hl.color === highlightsColorFilter;
    const q = highlightsSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      hl.reference.toLowerCase().includes(q) ||
      hl.text.toLowerCase().includes(q);
    return matchesColor && matchesSearch;
  });

  // Filtered books for picker
  const pickerBooks = BIBLE_BOOKS.filter((b) => {
    const matchesTab = b.testament === pickerTab;
    const matchesSearch = b.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                          b.abbreviation.toLowerCase().includes(pickerSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-center overflow-hidden select-none sm:select-auto">
      <div className="w-full max-w-4xl h-full bg-transparent flex flex-col overflow-hidden relative">
        <Header user={user} />

        {/* ========================================================================= */}
        {/* NATIVE APP STYLE TOP BAR: [Roma 8 ▾] [TB] + Tools                        */}
        {/* ========================================================================= */}
        <div className="flex-none bg-transparent border-b border-black/5 dark:border-white/10 px-3.5 sm:px-6 py-2.5 flex items-center justify-between z-20 transition-colors">
          {/* Main Book & Chapter Pill Trigger (Like YouVersion) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempBookForChapterPick(null);
                setPickerTab(selectedBook.testament);
                setPickerSearch('');
                setIsPickerOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F2F4] dark:bg-[#1C1C20] hover:bg-[#EAEAEB] dark:hover:bg-[#25252A] active:scale-95 border border-[#DCDCE0] dark:border-[#2C2C32] rounded-full transition cursor-pointer shadow-2xs"
              title="Pilih Kitab & Pasal"
            >
              <span className="text-[13.5px] font-bold text-[#111113] dark:text-white tracking-tight">
                {selectedBook.name} {selectedChapter}
              </span>
              <ChevronDown size={14} className="text-[#66666E] dark:text-[#A1A1AA]" />
            </button>

            {/* Translation Badge */}
            <span className="text-[10px] font-bold tracking-wider text-[#66666E] dark:text-[#A1A1AA] bg-[#F2F2F4] dark:bg-[#1C1C20] border border-[#E5E5E8] dark:border-[#2C2C32] px-2 py-1 rounded-full uppercase">
              TB
            </span>
          </div>

          {/* Quick Reader Tools */}
          <div className="flex items-center gap-1.5">
            {/* Font Size Selector */}
            <div className="flex items-center bg-[#F2F2F4] dark:bg-[#1C1C20] border border-[#DCDCE0] dark:border-[#2C2C32] rounded-full p-0.5">
              <button
                onClick={() => setFontSize(fontSize === 'lg' ? 'md' : fontSize === 'md' ? 'sm' : 'sm')}
                disabled={fontSize === 'sm'}
                className="px-2 py-1 text-[11px] font-semibold text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                title="Perkecil Teks"
              >
                A-
              </button>
              <span className="text-[10px] font-mono text-[#8E8E93] px-0.5">•</span>
              <button
                onClick={() => setFontSize(fontSize === 'sm' ? 'md' : fontSize === 'md' ? 'lg' : 'lg')}
                disabled={fontSize === 'lg'}
                className="px-2 py-1 text-[12px] font-bold text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                title="Perbesar Teks"
              >
                A+
              </button>
            </div>

            {/* Random Verse */}
            <button
              onClick={() => {
                const random = getRandomVerse();
                const bookMatch = BIBLE_BOOKS.find((b) => b.name === random.book);
                if (bookMatch) {
                  setSelectedBook(bookMatch);
                  setSelectedChapter(random.chapter);
                }
              }}
              className="w-8 h-8 rounded-full bg-[#F2F2F4] dark:bg-[#1C1C20] hover:bg-[#EAEAEB] dark:hover:bg-[#25252A] active:scale-95 border border-[#DCDCE0] dark:border-[#2C2C32] text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Baca Ayat Acak"
              aria-label="Ayat Acak"
            >
              <RotateCw size={13} />
            </button>

            {/* AI Chapter Reflection */}
            <button
              onClick={() => {
                const chapterRef = `${selectedBook.name} ${selectedChapter}`;
                openAiModalWithVerse(chapterRef, `Seluruh perikop ${chapterRef}`);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
              title="Refleksi AI Pasal Ini"
            >
              <Sparkles size={12} />
              <span className="hidden sm:inline">Refleksi</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN SCRIPTURE READER VIEWPORT                                            */}
        {/* ========================================================================= */}
        <main
          ref={mainScrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-5 relative"
        >
          {/* Chapter Heading Banner */}
          <div className="mb-6 pb-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                {selectedBook.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#111113] dark:text-white tracking-tight">
                {selectedBook.name} {selectedChapter}
              </h1>
            </div>

            {/* Button Halaman Khusus Ayat Tersimpan */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setIsHighlightsModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#111113] dark:text-white bg-[#F2F2F4] dark:bg-[#1C1C20] hover:bg-[#EAEAEB] dark:hover:bg-[#25252A] active:scale-95 px-3 py-1.5 rounded-full border border-[#DCDCE0] dark:border-[#2C2C32] transition cursor-pointer shadow-2xs font-semibold"
                title="Buka Daftar Ayat Tersimpan"
              >
                <Bookmark size={13} className="text-[#111113] dark:text-white" />
                <span>Ayat Tersimpan</span>
                {highlightList.length > 0 && (
                  <span className="bg-[#111113] dark:bg-white text-white dark:text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {highlightList.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingVerses ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#111113] dark:text-white" />
              <p className="text-xs text-[#8E8E93] dark:text-[#A1A1AA] font-medium">Memuat naskah Alkitab TB...</p>
            </div>
          ) : verses.length === 0 ? (
            <div className="text-center py-16 px-4 max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F2F2F4] dark:bg-[#1C1C20] text-[#111113] dark:text-white flex items-center justify-center mx-auto border border-[#DCDCE0] dark:border-[#2C2C32]">
                <BookOpen size={20} />
              </div>
              <h4 className="text-sm font-bold text-[#111113] dark:text-white">Belum Dapat Memuat Ayat</h4>
              <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                Koneksi server ke naskah {selectedBook.name} {selectedChapter} sedang sibuk atau offline.
              </p>
              <button
                onClick={() => {
                  setIsLoadingVerses(true);
                  getChapterVerses(selectedBook.id, selectedChapter)
                    .then((res) => setVerses(res.verses || []))
                    .catch((e) => console.error(e))
                    .finally(() => setIsLoadingVerses(false));
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111113] text-white text-xs font-semibold hover:bg-black active:scale-95 transition cursor-pointer shadow-xs"
              >
                <RotateCw size={13} />
                <span>Coba Muat Ulang</span>
              </button>
            </div>
          ) : (
            /* Verses Flow with App-Style Reading Layout */
            <div
              className={`space-y-2 pb-24 ${
                fontSize === 'sm'
                  ? 'text-[13.5px] leading-relaxed'
                  : fontSize === 'lg'
                  ? 'text-[16.5px] leading-loose'
                  : 'text-[15px] leading-[1.8]'
              }`}
            >
              {verses.map((v) => {
                const verseKey = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
                const highlight = highlights[verseKey];
                const isSelected = selectedVerses.some((sv) => sv.verse === v.verse);
                const highlightConfig = highlight
                  ? HIGHLIGHT_COLORS.find((c) => c.id === highlight.color)
                  : null;

                return (
                  <div key={v.verse} className="group transition-all">
                    {/* Pericope Title (Judul Perikop Alkitab TB) */}
                    {v.title && (
                      <div className="pt-4 pb-2">
                        <h2 className="text-[13px] sm:text-[14px] font-bold text-[#111113] dark:text-white tracking-tight border-b border-[#EAEAEB] dark:border-[#26262B] pb-1 inline-block">
                          {v.title}
                        </h2>
                      </div>
                    )}

                    {/* Interactive Verse Box: Tap to Highlight / Multi-select */}
                    <div
                      id={`verse-${v.verse}`}
                      onClick={() => handleVerseTap(v)}
                      className={`relative px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-150 flex items-baseline gap-2.5 ${
                        isSelected
                          ? highlightConfig
                            ? `${highlightConfig.bgClass} ring-2 ring-[#111113] dark:ring-white shadow-xs`
                            : 'bg-[#F2F2F4] dark:bg-[#1C1C22] ring-2 ring-[#111113]/30 dark:ring-white/30 shadow-2xs'
                          : highlightConfig
                          ? `${highlightConfig.bgClass} shadow-2xs`
                          : 'hover:bg-[#F8F8F9] dark:hover:bg-[#18181D]'
                      }`}
                    >
                      {/* Verse Number (Superscript Style) */}
                      <span
                        className={`text-[11px] font-mono font-bold select-none shrink-0 ${
                          highlightConfig
                            ? 'text-black/70 dark:text-black/80'
                            : isSelected
                            ? 'text-[#111113] dark:text-white'
                            : 'text-[#8E8E93] dark:text-[#A1A1AA]'
                        }`}
                      >
                        {v.verse}
                      </span>

                      {/* Verse Text (Clean Bible Typography) */}
                      <p className="flex-1 font-serif text-[#111113] dark:text-[#ECECED]">
                        {v.text}
                      </p>

                      {/* Small Active Indicator Dot if tapped */}
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#111113] dark:bg-white shrink-0 self-center animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BOTTOM FLOATING APP BAR: Previous & Next Chapter Navigation               */}
          {/* ========================================================================= */}
          <div className="sticky bottom-3 left-0 right-0 flex items-center justify-between pointer-events-none z-10 px-1">
            <button
              onClick={handlePrevChapter}
              disabled={currentBookIndex === 0 && selectedChapter === 1}
              className="pointer-events-auto bg-[#111113]/90 hover:bg-[#111113] dark:bg-[#202026]/95 dark:hover:bg-[#2A2A32] dark:border-white/15 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer backdrop-blur-xs border border-white/10"
            >
              <ChevronLeft size={14} />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={handleNextChapter}
              disabled={currentBookIndex === BIBLE_BOOKS.length - 1 && selectedChapter === selectedBook.chapters}
              className="pointer-events-auto bg-[#111113]/90 hover:bg-[#111113] dark:bg-[#202026]/95 dark:hover:bg-[#2A2A32] dark:border-white/15 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer backdrop-blur-xs border border-white/10"
            >
              <span>Selanjutnya</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </main>

        {/* ========================================================================= */}
        {/* FLOATING ACTION DOCK: When Verses are Selected (Multi-Verse Support)      */}
        {/* ========================================================================= */}
        {selectedVerses.length > 0 && (
          <div className="absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 bg-white/98 dark:bg-[#16161A]/98 backdrop-blur-md border border-[#DCDCE0] dark:border-[#2C2C32] rounded-[24px] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)] z-50 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EAEAEB] dark:border-[#26262B]">
              <div className="flex items-center gap-2 min-w-0">
                <Bookmark size={13} className="text-[#111113] dark:text-white shrink-0" />
                <span className="text-xs font-bold text-[#111113] dark:text-white truncate">
                  {formatVerseReference(selectedBook.name, selectedChapter, selectedVerses)}
                </span>
                <span className="text-[10px] font-semibold text-[#8E8E93] dark:text-[#A1A1AA] bg-[#F2F2F4] dark:bg-[#222228] px-1.5 py-0.5 rounded-full shrink-0">
                  {selectedVerses.length} ayat
                </span>
              </div>
              <button
                onClick={() => setSelectedVerses([])}
                className="w-6 h-6 rounded-full bg-[#F2F2F4] dark:bg-[#222228] hover:bg-[#EAEAEB] dark:hover:bg-[#2C2C32] text-[#66666E] dark:text-[#A1A1AA] flex items-center justify-center transition cursor-pointer shrink-0 ml-1"
                title="Batalkan Pilihan"
              >
                <X size={12} />
              </button>
            </div>

            {/* Highlight Color Palette */}
            <div className="flex items-center justify-between gap-1.5 py-1">
              <span className="text-[11px] text-[#8E8E93] dark:text-[#A1A1AA] font-medium mr-1">Warna:</span>
              <div className="flex items-center gap-2">
                {HIGHLIGHT_COLORS.map((c) => {
                  const isCurrentColor = selectedVerses.every((v) => {
                    const key = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
                    return highlights[key]?.color === c.id;
                  });

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleApplyHighlight(c.id)}
                      className={`w-7 h-7 rounded-full ${c.dotClass} border-2 flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                        isCurrentColor ? 'scale-110 ring-2 ring-[#111113] dark:ring-white' : 'hover:scale-105'
                      }`}
                      title={`Sorot ${c.label}`}
                    >
                      {isCurrentColor && <Check size={12} className="text-[#111113]" />}
                    </button>
                  );
                })}

                {/* Clear Highlight Button */}
                <button
                  onClick={handleRemoveHighlight}
                  className="w-7 h-7 rounded-full bg-[#F2F2F4] dark:bg-[#222228] hover:bg-[#EAEAEB] dark:hover:bg-[#2C2C32] border border-[#DCDCE0] dark:border-[#2C2C32] flex items-center justify-center text-[#8E8E93] dark:text-[#A1A1AA] hover:text-red-500 transition cursor-pointer"
                  title="Hapus Sorotan Ayat Terpilih"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons (Copy, AI Reflect) */}
            <div className="pt-2 mt-2 border-t border-[#EAEAEB] dark:border-[#26262B] flex items-center justify-between gap-2 text-xs">
              <button
                onClick={handleCopySelectedVerses}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#F2F2F4] dark:bg-[#222228] hover:bg-[#EAEAEB] dark:hover:bg-[#2C2C32] text-[#111113] dark:text-white font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey === formatVerseReference(selectedBook.name, selectedChapter, selectedVerses) ? (
                  <>
                    <CheckCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Salin ({selectedVerses.length})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReflectSelectedVerses}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Sparkles size={12} />
                <span>Renungkan</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NATIVE APP STYLE MODAL: Book & Chapter Picker (YouVersion Style)          */}
        {/* ========================================================================= */}
        {isPickerOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#141418] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl max-h-[88vh] flex flex-col border border-[#EAEAEB] dark:border-[#26262B] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEB] dark:border-[#26262B]">
                {tempBookForChapterPick ? (
                  <button
                    onClick={() => setTempBookForChapterPick(null)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#111113] dark:text-white hover:underline cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    <span>Kembali ke Daftar Kitab</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-[#111113] dark:text-white" />
                    <h3 className="text-sm font-bold text-[#111113] dark:text-white">Pilih Kitab &amp; Pasal</h3>
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsPickerOpen(false);
                    setTempBookForChapterPick(null);
                  }}
                  className="w-7 h-7 rounded-full bg-[#F2F2F4] dark:bg-[#222228] text-[#66666E] dark:text-[#A1A1AA] flex items-center justify-center hover:bg-[#EAEAEB] dark:hover:bg-[#2C2C32] transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* VIEW 1: Pick Chapter Numbers (Once a book is selected) */}
              {tempBookForChapterPick ? (
                <div className="flex-1 overflow-y-auto py-4">
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-[#8E8E93] dark:text-[#A1A1AA] uppercase tracking-wider block">
                      {tempBookForChapterPick.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'}
                    </span>
                    <h4 className="text-lg font-bold text-[#111113] dark:text-white">
                      {tempBookForChapterPick.name}
                    </h4>
                    <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                      Pilih nomor pasal (1 - {tempBookForChapterPick.chapters}):
                    </p>
                  </div>

                  {/* Grid of Chapter Numbers */}
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 pt-2">
                    {Array.from({ length: tempBookForChapterPick.chapters }, (_, i) => i + 1).map((ch) => {
                      const isCurrent =
                        selectedBook.id === tempBookForChapterPick.id && selectedChapter === ch;

                      return (
                        <button
                          key={ch}
                          onClick={() => {
                            const cached = getCachedChapterVerses(tempBookForChapterPick.id, ch);
                            if (cached?.verses && cached.verses.length > 0) {
                              setVerses(cached.verses);
                              setIsLoadingVerses(false);
                            }
                            setSelectedBook(tempBookForChapterPick);
                            setSelectedChapter(ch);
                            setIsPickerOpen(false);
                            setTempBookForChapterPick(null);
                          }}
                          className={`h-11 rounded-2xl text-sm font-bold flex items-center justify-center transition cursor-pointer active:scale-95 ${
                            isCurrent
                              ? 'bg-[#111113] dark:bg-white text-white dark:text-black shadow-md'
                              : 'bg-[#F2F2F4] dark:bg-[#1E1E24] hover:bg-[#EAEAEB] dark:hover:bg-[#26262E] text-[#111113] dark:text-white border border-[#DCDCE0] dark:border-[#2C2C34]'
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* VIEW 2: Pick Book (Search + Testament Tabs) */
                <div className="flex-1 overflow-hidden flex flex-col pt-3">
                  {/* Search Bar */}
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#A1A1AA] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari kitab (misal: Mazmur, Roma, Yohanes)..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F2F2F4] dark:bg-[#1E1E24] border border-[#DCDCE0] dark:border-[#2C2C34] rounded-xl focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#66666E]"
                    />
                  </div>

                  {/* Testament Tabs: PL vs PB */}
                  <div className="flex rounded-full bg-[#F2F2F4] dark:bg-[#1E1E24] p-1 text-xs font-semibold border border-[#DCDCE0] dark:border-[#2C2C34] mb-3">
                    <button
                      onClick={() => setPickerTab('PL')}
                      className={`flex-1 py-1.5 rounded-full transition text-[11px] cursor-pointer ${
                        pickerTab === 'PL'
                          ? 'bg-[#111113] dark:bg-white text-white dark:text-black shadow-xs font-bold'
                          : 'text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white'
                      }`}
                    >
                      Perjanjian Lama (39)
                    </button>
                    <button
                      onClick={() => setPickerTab('PB')}
                      className={`flex-1 py-1.5 rounded-full transition text-[11px] cursor-pointer ${
                        pickerTab === 'PB'
                          ? 'bg-[#111113] dark:bg-white text-white dark:text-black shadow-xs font-bold'
                          : 'text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white'
                      }`}
                    >
                      Perjanjian Baru (27)
                    </button>
                  </div>

                  {/* Scrollable Books List/Grid */}
                  <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1 pb-2">
                    {pickerBooks.map((b) => {
                      const isSelected = b.id === selectedBook.id;

                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            preloadBook(b.id);
                            setTempBookForChapterPick(b);
                          }}
                          onMouseEnter={() => preloadBook(b.id)}
                          className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between active:scale-95 ${
                            isSelected
                              ? 'bg-[#111113] dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xs'
                              : 'bg-white dark:bg-[#1A1A20] hover:bg-[#F9F9FA] dark:hover:bg-[#222228] text-[#111113] dark:text-white border-[#EAEAEB] dark:border-[#26262B]'
                          }`}
                        >
                          <span className="text-xs font-bold truncate block">{b.name}</span>
                          <span
                            className={`text-[10px] ${
                              isSelected ? 'text-white/70 dark:text-black/70' : 'text-[#8E8E93] dark:text-[#A1A1AA]'
                            }`}
                          >
                            {b.chapters} Pasal
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AI REFLECTION MODAL (Questionnaire -> Targeted Devotion -> Notes Integration) */}
        {/* ========================================================================= */}
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#141418] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-[#EAEAEB] dark:border-[#26262B] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-[#EAEAEB] dark:border-[#26262B] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F2F2F4] dark:bg-[#202026] border border-[#DCDCE0] dark:border-[#2C2C34] text-[#111113] dark:text-white flex items-center justify-center shrink-0">
                    <BookOpen size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13.5px] font-bold text-[#111113] dark:text-white tracking-tight">Refleksi Firman</h4>
                      {aiTargetVerseRef && (
                        <span className="text-[10.5px] font-semibold text-[#111113] dark:text-white bg-[#F2F2F4] dark:bg-[#202026] border border-[#DCDCE0] dark:border-[#2C2C34] px-2 py-0.5 rounded-full">
                          {aiTargetVerseRef}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-[#8E8E93] dark:text-[#A1A1AA]">
                      {aiStep === 'questionnaire' ? 'Panduan Saat Teduh Pribadi' : 'Renungan Firman & Doa'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F2F2F4] dark:bg-[#202026] hover:bg-[#EAEAEB] dark:hover:bg-[#282830] text-[#66666E] dark:text-[#A1A1AA] flex items-center justify-center transition cursor-pointer"
                  title="Tutup"
                >
                  <X size={14} />
                </button>
              </div>

              {/* STEP 1: QUESTIONNAIRE BEFORE GENERATING */}
              {aiStep === 'questionnaire' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Scripture Reading Vignette */}
                  <div className="p-4 bg-[#F9F9FA] dark:bg-[#1A1A20] rounded-2xl border border-[#EAEAEB] dark:border-[#26262B] space-y-1.5">
                    <div className="flex items-center justify-between text-[10.5px] text-[#8E8E93] dark:text-[#A1A1AA]">
                      <span className="font-semibold uppercase tracking-wider">Ayat Firman</span>
                      <span>Terjemahan Baru</span>
                    </div>
                    <p className="text-[13px] font-serif italic text-[#111113] dark:text-[#ECECED] leading-relaxed">
                      &ldquo;{aiTargetVerseText || aiTargetVerseRef}&rdquo;
                    </p>
                  </div>

                  {/* Pertanyaan 1: Pergumulan / Situasi */}
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <label className="text-[12.5px] font-bold text-[#111113] dark:text-white block">
                        Apa yang sedang kamu hadapi atau gumulkan saat ini?
                      </label>
                      <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1AA] leading-relaxed">
                        Ceritakan situasi batinmu agar perenungan ayat ini relevan dan menguatkan.
                      </p>
                    </div>

                    {/* Interactive suggestion pills */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        'Kekhawatiran masa depan',
                        'Lelah fisik & mental',
                        'Mencari petunjuk arah',
                        'Masalah relasi & keluarga',
                        'Mengucap syukur atas berkat',
                      ].map((chip) => {
                        const isSelected = aiStruggle.includes(chip);
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setAiStruggle((prev) =>
                                  prev
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s !== chip && s !== '')
                                    .join(', ')
                                );
                              } else {
                                setAiStruggle((prev) => (prev ? `${prev}, ${chip}` : chip));
                              }
                            }}
                            className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition active:scale-95 cursor-pointer ${
                              isSelected
                                ? 'bg-[#111113] dark:bg-white text-white dark:text-black border-[#111113] dark:border-white font-bold'
                                : 'bg-[#F2F2F4] dark:bg-[#1E1E24] text-[#444448] dark:text-[#D4D4D8] hover:text-[#111113] dark:hover:text-white hover:bg-[#EAEAEB] dark:hover:bg-[#26262E] border-[#DCDCE0] dark:border-[#2C2C34]'
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      value={aiStruggle}
                      onChange={(e) => setAiStruggle(e.target.value)}
                      placeholder="Tuliskan isi hatimu di sini (contoh: sedang merasa cemas menghadapi tantangan baru)..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9FA] dark:bg-[#1A1A20] border border-[#DCDCE0] dark:border-[#2C2C34] rounded-2xl focus:outline-none focus:border-[#111113] dark:focus:border-white text-[#111113] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#66666E] resize-none leading-relaxed transition"
                    />
                  </div>

                  {/* Pertanyaan 2: Harapan / Kebutuhan Batin */}
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <label className="text-[12.5px] font-bold text-[#111113] dark:text-white block">
                        Apa fokus atau harapanmu melalui ayat ini?
                      </label>
                      <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1AA]">
                        Hal yang paling ingin kamu peroleh dari firman ini hari ini.
                      </p>
                    </div>

                    {/* Interactive suggestion pills */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        'Ketenangan & damai batin',
                        'Kekuatan iman',
                        'Petunjuk langkah nyata',
                        'Peneguhan janji Tuhan',
                      ].map((chip) => {
                        const isSelected = aiDesire.includes(chip);
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setAiDesire((prev) =>
                                  prev
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s !== chip && s !== '')
                                    .join(', ')
                                );
                              } else {
                                setAiDesire((prev) => (prev ? `${prev}, ${chip}` : chip));
                              }
                            }}
                            className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition active:scale-95 cursor-pointer ${
                              isSelected
                                ? 'bg-[#111113] dark:bg-white text-white dark:text-black border-[#111113] dark:border-white font-bold'
                                : 'bg-[#F2F2F4] dark:bg-[#1E1E24] text-[#444448] dark:text-[#D4D4D8] hover:text-[#111113] dark:hover:text-white hover:bg-[#EAEAEB] dark:hover:bg-[#26262E] border-[#DCDCE0] dark:border-[#2C2C34]'
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={aiDesire}
                      onChange={(e) => setAiDesire(e.target.value)}
                      placeholder="Contoh: Ketenangan batin dan hikmat dalam melangkah..."
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9FA] dark:bg-[#1A1A20] border border-[#DCDCE0] dark:border-[#2C2C34] rounded-2xl focus:outline-none focus:border-[#111113] dark:focus:border-white text-[#111113] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#66666E] transition"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerateReflection();
                      }}
                    />
                  </div>

                  {/* Action Button: Submit & Analyze */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleGenerateReflection}
                      className="w-full py-3 px-4 bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-2xs"
                    >
                      <Sparkles size={14} />
                      <span>Renungkan Firman</span>
                    </button>
                    <p className="text-[10px] text-[#8E8E93] dark:text-[#A1A1AA] text-center mt-2">
                      AI akan menelaah responmu dan mengaitkannya dengan hikmat firman.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: AI GENERATION RESULT */}
              {aiStep === 'result' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {aiLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#F2F2F4] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#26262B] flex items-center justify-center shadow-2xs">
                        <Loader2 className="w-5 h-5 animate-spin text-[#111113] dark:text-white" />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <h4 className="text-xs font-bold text-[#111113] dark:text-white">Merenungkan Firman...</h4>
                        <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1AA] leading-relaxed">
                          Menghubungkan pesan {aiTargetVerseRef} dengan isi hatimu.
                        </p>
                      </div>
                    </div>
                  ) : aiResponse?.error ? (
                    <div className="p-4 bg-[#F9F9FA] dark:bg-[#1A1A20] border border-[#EAEAEB] dark:border-[#26262B] rounded-2xl space-y-2 text-center">
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{aiResponse.error}</p>
                      <button
                        type="button"
                        onClick={handleGenerateReflection}
                        className="px-3.5 py-1.5 bg-[#111113] dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  ) : aiResponse ? (
                    <>
                      {/* Note Saved Confirmation Banner */}
                      {noteSaveSuccess && (
                        <div className="bg-[#F2F2F4] dark:bg-[#1E1E24] border border-[#DCDCE0] dark:border-[#2C2C34] rounded-2xl p-3 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 text-[#111113] dark:text-white min-w-0">
                            <CheckCircle2 size={16} className="text-[#111113] dark:text-white shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold block truncate">
                                {noteSaveSuccess.isNew ? 'Catatan baru dibuat' : 'Ditambahkan ke catatan'}
                              </span>
                              <p className="text-[10.5px] text-[#66666E] dark:text-[#A1A1AA] truncate">
                                &ldquo;{noteSaveSuccess.noteTitle}&rdquo;
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('notes')}
                            className="px-3 py-1.5 bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-[11px] flex items-center gap-1 transition shrink-0 cursor-pointer shadow-2xs"
                          >
                            <span>Buka Catatan</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      )}

                      {/* User's Context Pill */}
                      {(aiStruggle || aiDesire) && (
                        <div className="px-3.5 py-2 rounded-xl bg-[#F9F9FA] dark:bg-[#1A1A20] border border-[#EAEAEB] dark:border-[#26262B] text-[11px] text-[#66666E] dark:text-[#A1A1AA] flex items-baseline gap-2">
                          <span className="font-semibold text-[#111113] dark:text-white shrink-0">Fokus Refleksi:</span>
                          <span className="italic truncate">
                            {[aiStruggle, aiDesire].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                      )}

                      {/* Devotional Prose: Refleksi & Hikmat */}
                      {aiResponse.thought && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-[#111113] dark:text-white uppercase tracking-wider block">
                            Refleksi &amp; Hikmat Firman
                          </span>
                          <p className="text-[13px] text-[#222225] dark:text-[#D4D4D8] font-sans leading-[1.7] whitespace-pre-wrap">
                            {aiResponse.thought}
                          </p>
                        </div>
                      )}

                      {/* Doa Peneguhan (Liturgical Style Callout) */}
                      {aiResponse.prayer && (
                        <div className="p-4 rounded-2xl bg-[#F9F9FA] dark:bg-[#1A1A20] border-l-2 border-[#111113] dark:border-white border-y border-r border-[#EAEAEB] dark:border-[#26262B] space-y-1">
                          <span className="text-[11px] font-bold text-[#111113] dark:text-white block">
                            Doa Peneguhan
                          </span>
                          <p className="text-[12.5px] font-serif italic text-[#333336] dark:text-[#ECECED] leading-relaxed">
                            &ldquo;{aiResponse.prayer}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Pertanyaan Refleksi Pribadi */}
                      {aiResponse.reflectionQuestion && (
                        <div className="p-3.5 rounded-2xl bg-[#F9F9FA] dark:bg-[#1A1A20] border border-[#EAEAEB] dark:border-[#26262B] space-y-1">
                          <span className="text-[11px] font-bold text-[#111113] dark:text-white block">
                            Refleksi Hari Ini
                          </span>
                          <p className="text-[12.5px] text-[#222225] dark:text-[#D4D4D8] leading-relaxed">
                            {aiResponse.reflectionQuestion}
                          </p>
                        </div>
                      )}

                      {/* Ayat Alkitab Terkait */}
                      {aiResponse.suggestedVerses && aiResponse.suggestedVerses.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-bold text-[#111113] dark:text-white block">
                            Ayat Terkait
                          </span>
                          <div className="space-y-1.5">
                            {aiResponse.suggestedVerses.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-[#F9F9FA] dark:bg-[#1A1A20] border border-[#EAEAEB] dark:border-[#26262B] text-xs flex flex-col gap-0.5"
                              >
                                <span className="font-bold text-[#111113] dark:text-white">{item.reference}</span>
                                <span className="text-[#66666E] dark:text-[#A1A1AA] text-[11px] leading-relaxed">{item.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons: Note Integration & Edit Questions */}
                      <div className="pt-2 flex items-center gap-2 border-t border-[#EAEAEB] dark:border-[#26262B] mt-2">
                        <button
                          type="button"
                          onClick={() => setAiStep('questionnaire')}
                          className="px-3.5 py-2.5 rounded-xl bg-[#F2F2F4] dark:bg-[#1E1E24] hover:bg-[#EAEAEB] dark:hover:bg-[#26262E] text-[#111113] dark:text-white text-xs font-semibold transition active:scale-95 cursor-pointer shrink-0 border border-[#DCDCE0] dark:border-[#2C2C34]"
                          title="Ubah jawaban kuesioner"
                        >
                          Jawab Ulang
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenNotePicker}
                          className="flex-1 py-2.5 px-4 bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-2xs"
                        >
                          <FileText size={14} />
                          <span>Masukkan ke Catatan</span>
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NOTE PICKER MODAL (Integrasi Renungan -> Catatan)                          */}
        {/* ========================================================================= */}
        {isNotePickerOpen && (
          <div className="fixed inset-0 z-60 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#141418] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[85vh] flex flex-col border border-[#EAEAEB] dark:border-[#26262B] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-[#EAEAEB] dark:border-[#26262B] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F2F2F4] dark:bg-[#202026] border border-[#DCDCE0] dark:border-[#2C2C34] text-[#111113] dark:text-white flex items-center justify-center shrink-0">
                    <FileText size={14} />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#111113] dark:text-white tracking-tight">Masukkan ke Catatan</h4>
                    <p className="text-[10.5px] text-[#8E8E93] dark:text-[#A1A1AA]">Pilih catatan tujuan atau buat catatan baru</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotePickerOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F2F2F4] dark:bg-[#202026] hover:bg-[#EAEAEB] dark:hover:bg-[#282830] text-[#66666E] dark:text-[#A1A1AA] flex items-center justify-center transition cursor-pointer"
                  title="Tutup"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                {/* OPTION 1: Buat Catatan Baru */}
                <button
                  type="button"
                  onClick={handleSaveToNewNote}
                  disabled={isSavingToNote}
                  className="w-full p-3.5 rounded-2xl bg-[#F9F9FA] dark:bg-[#1A1A20] hover:bg-[#F2F2F4] dark:hover:bg-[#222228] border border-[#DCDCE0] dark:border-[#2C2C34] text-left transition active:scale-98 cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                      <Plus size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#111113] dark:text-white">Buat Catatan Baru</h5>
                      <p className="text-[11px] text-[#66666E] dark:text-[#A1A1AA] line-clamp-1">
                        Judul: Renungan: {aiTargetVerseRef}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-[#66666E] dark:text-[#A1A1AA] shrink-0" />
                </button>

                {/* Divider */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <div className="flex-1 h-px bg-[#EAEAEB] dark:bg-[#26262B]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#A1A1AA]">
                    Atau Masukkan ke Catatan yang Ada
                  </span>
                  <div className="flex-1 h-px bg-[#EAEAEB] dark:bg-[#26262B]" />
                </div>

                {/* OPTION 2: List of Existing Notes */}
                {isLoadingNotes ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[#8E8E93] dark:text-[#A1A1AA]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#111113] dark:text-white" />
                    <span>Memuat daftar catatan...</span>
                  </div>
                ) : userNotes.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#8E8E93] dark:text-[#A1A1AA] bg-[#F9F9FA] dark:bg-[#1A1A20] rounded-2xl border border-[#EAEAEB] dark:border-[#26262B] p-4">
                    Belum ada catatan yang tersimpan. Silakan pilih opsi <strong>&quot;Buat Catatan Baru&quot;</strong> di atas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userNotes.map((note) => {
                      const snippet = stripHtml(note.content);
                      return (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => handleAppendToExistingNote(note)}
                          disabled={isSavingToNote}
                          className="w-full p-3 rounded-2xl bg-[#F9F9FA] dark:bg-[#1A1A20] hover:bg-[#F2F2F4] dark:hover:bg-[#222228] border border-[#EAEAEB] dark:border-[#26262B] text-left transition active:scale-98 cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h5 className="text-xs font-bold text-[#111113] dark:text-white truncate">
                                {note.title || '(Tanpa Judul)'}
                              </h5>
                              <span className="text-[10px] text-[#8E8E93] dark:text-[#A1A1AA] shrink-0 font-medium">
                                • {formatNoteDate(note.updated_at)}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#66666E] dark:text-[#A1A1AA] truncate">
                              {snippet || 'Catatan kosong'}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#222228] border border-[#DCDCE0] dark:border-[#2C2C34] text-[10px] font-bold text-[#111113] dark:text-white group-hover:bg-[#111113] dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition shrink-0">
                            + Masukkan
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {isSavingToNote && (
                <div className="p-3 border-t border-[#EAEAEB] dark:border-[#26262B] flex items-center justify-center gap-1.5 text-xs text-[#8E8E93] dark:text-[#A1A1AA]">
                  <Loader2 size={13} className="animate-spin text-[#111113] dark:text-white" />
                  <span>Menyimpan renungan ke catatan...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HALAMAN KHUSUS: AYAT SOROTAN TERSIMPAN (SAVED HIGHLIGHTS MODAL)           */}
        {/* ========================================================================= */}
        {isHighlightsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#141418] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl max-h-[90vh] flex flex-col border border-[#EAEAEB] dark:border-[#26262B] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEB] dark:border-[#26262B]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-2xs">
                    <Bookmark size={15} className="fill-amber-600 dark:fill-amber-400 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111113] dark:text-white">Ayat Tersimpan</h3>
                    <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1AA]">
                      {highlightList.length} ayat tersimpan di akunmu
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHighlightsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F2F2F4] dark:bg-[#202026] hover:bg-[#EAEAEB] dark:hover:bg-[#282830] text-[#66666E] dark:text-[#A1A1AA] flex items-center justify-center transition cursor-pointer"
                  title="Tutup"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="py-3 space-y-2.5 border-b border-[#EAEAEB] dark:border-[#26262B]">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-[#8E8E93] dark:text-[#A1A1AA]" />
                  <input
                    type="text"
                    value={highlightsSearch}
                    onChange={(e) => setHighlightsSearch(e.target.value)}
                    placeholder="Cari ayat tersimpan atau kata kunci..."
                    className="w-full bg-[#F2F2F4] dark:bg-[#1E1E24] text-xs pl-8 pr-7 py-2 rounded-xl border border-[#DCDCE0] dark:border-[#2C2C34] focus:outline-none focus:border-[#111113] dark:focus:border-white text-[#111113] dark:text-white placeholder-[#8E8E93] dark:placeholder-[#66666E]"
                  />
                  {highlightsSearch && (
                    <button
                      type="button"
                      onClick={() => setHighlightsSearch('')}
                      className="absolute right-2.5 top-2.5 text-[#8E8E93] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Color Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setHighlightsColorFilter('all')}
                    className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer shrink-0 ${
                      highlightsColorFilter === 'all'
                        ? 'bg-[#111113] dark:bg-white text-white dark:text-black shadow-xs font-bold'
                        : 'bg-[#F2F2F4] dark:bg-[#1E1E24] text-[#66666E] dark:text-[#A1A1AA] hover:bg-[#EAEAEB] dark:hover:bg-[#26262E]'
                    }`}
                  >
                    Semua ({highlightList.length})
                  </button>
                  {HIGHLIGHT_COLORS.map((c) => {
                    const count = highlightList.filter((h) => h.color === c.id).length;
                    if (count === 0 && highlightsColorFilter !== c.id) return null;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setHighlightsColorFilter(c.id)}
                        className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
                          highlightsColorFilter === c.id
                            ? 'bg-[#111113] dark:bg-white text-white dark:text-black shadow-xs font-bold'
                            : 'bg-[#F2F2F4] dark:bg-[#1E1E24] text-[#66666E] dark:text-[#A1A1AA] hover:bg-[#EAEAEB] dark:hover:bg-[#26262E]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${c.dotClass}`} />
                        <span>{c.label} ({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Highlights Scrollable List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-0.5">
                {filteredHighlightList.length === 0 ? (
                  <div className="py-12 text-center max-w-xs mx-auto space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2F2F4] dark:bg-[#1E1E24] text-[#8E8E93] dark:text-[#A1A1AA] flex items-center justify-center mx-auto shadow-2xs">
                      <Bookmark size={22} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#111113] dark:text-white">
                        {highlightsSearch || highlightsColorFilter !== 'all'
                          ? 'Tidak Ada Ayat yang Cocok'
                          : 'Belum Ada Ayat yang Disorot'}
                      </h4>
                      <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1AA] leading-relaxed">
                        {highlightsSearch || highlightsColorFilter !== 'all'
                          ? 'Coba gunakan kata kunci atau filter warna yang berbeda.'
                          : 'Pilih ayat di Alkitab dan beri warna sorotan. Semua ayat pentingmu akan terkumpul di sini.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredHighlightList.map((hl) => {
                    const colorConfig = HIGHLIGHT_COLORS.find((c) => c.id === hl.color);
                    return (
                      <div
                        key={hl.reference}
                        className="bg-[#F9F9FA] dark:bg-[#1A1A20] hover:bg-[#F2F2F4] dark:hover:bg-[#222228] border border-[#EAEAEB] dark:border-[#26262B] rounded-2xl p-3.5 space-y-2 transition shadow-2xs text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${colorConfig?.dotClass || 'bg-amber-300'}`} />
                            <span className="text-xs font-bold text-[#111113] dark:text-white">
                              {hl.reference} (TB)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => {
                                const textToCopy = `${hl.reference} (TB)\n"${hl.text}"`;
                                if (navigator?.clipboard) {
                                  navigator.clipboard.writeText(textToCopy);
                                  setCopiedKey(hl.reference);
                                  setTimeout(() => setCopiedKey(null), 2000);
                                }
                              }}
                              className="p-1 rounded-lg hover:bg-white dark:hover:bg-[#282830] text-[#8E8E93] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white transition cursor-pointer"
                              title="Salin Ayat"
                            >
                              {copiedKey === hl.reference ? (
                                <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                            {/* Delete Highlight */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...highlights };
                                delete updated[hl.reference];
                                saveHighlights(updated);
                              }}
                              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#8E8E93] dark:text-[#A1A1AA] hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                              title="Hapus Sorotan"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Verse Text with subtle color bar */}
                        <div className={`p-2.5 rounded-xl ${colorConfig?.bgClass || 'bg-amber-100/90 text-amber-950'} text-xs font-serif leading-relaxed`}>
                          &quot;{hl.text}&quot;
                        </div>

                        {/* Action buttons footer */}
                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                          <span className="text-[10px] text-[#8E8E93] dark:text-[#A1A1AA]">
                            {new Date(hl.updatedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Buka Ayat */}
                            <button
                              type="button"
                              onClick={() => handleJumpToHighlight(hl)}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#222228] border border-[#DCDCE0] dark:border-[#2C2C34] hover:bg-[#F2F2F4] dark:hover:bg-[#2A2A32] text-[#111113] dark:text-white font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                              <ExternalLink size={11} />
                              <span>Buka Ayat</span>
                            </button>

                            {/* Renungkan */}
                            <button
                              type="button"
                              onClick={() => {
                                openAiModalWithVerse(hl.reference, hl.text);
                                setIsHighlightsModalOpen(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Sparkles size={11} />
                              <span>Renungkan</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <Navigation />
      </div>
    </div>
  );
}
