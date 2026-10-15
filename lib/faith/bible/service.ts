import { 
  BIBLE_BOOKS, 
  FEATURED_VERSES, 
  SAMPLE_CHAPTERS, 
  ROMA_8_FULL_VERSES, 
  TodayVerse, 
  BibleVerse 
} from './data';

interface StoredBookData {
  id: string;
  name: string;
  abbreviation: string;
  totalChapters: number;
  testament: 'PL' | 'PB';
  chapters: Record<string, { verse: number; text: string; title?: string }[]>;
}

// In-memory cache of fully loaded books for instant 0ms access
const loadedBooksCache = new Map<string, StoredBookData>();

// In-memory cache of individual chapter verses pre-seeded with Roma 8 for instant 0ms startup
const memoryCache = new Map<string, { bookName: string; chapter: number; verses: BibleVerse[] }>([
  ['rom_8', { bookName: 'Roma', chapter: 8, verses: ROMA_8_FULL_VERSES }]
]);

export function getTodayVerse(): TodayVerse {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % FEATURED_VERSES.length;
  return FEATURED_VERSES[index];
}

export function getRandomVerse(): TodayVerse {
  const randomIndex = Math.floor(Math.random() * FEATURED_VERSES.length);
  return FEATURED_VERSES[randomIndex];
}

// Synchronously check if verses are available (Instant 0ms, zero network)
export function getCachedChapterVerses(
  bookId: string, 
  chapter: number
): { bookName: string; chapter: number; verses: BibleVerse[] } | null {
  const normId = bookId.toLowerCase();
  const cacheKey = `${normId}_${chapter}`;

  // 1. Direct in-memory chapter check
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 2. Check if the entire book is already in memory cache
  if (loadedBooksCache.has(normId)) {
    const bookData = loadedBooksCache.get(normId)!;
    const rawChapter = bookData.chapters[String(chapter)];
    if (rawChapter && Array.isArray(rawChapter) && rawChapter.length > 0) {
      const verses: BibleVerse[] = rawChapter.map((v) => ({
        book: bookData.name,
        chapter,
        verse: v.verse,
        text: v.text,
        title: v.title,
      }));
      const res = { bookName: bookData.name, chapter, verses };
      memoryCache.set(cacheKey, res);
      return res;
    }
  }

  // 3. LocalStorage check
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`faith_bible_ch_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.verses && Array.isArray(parsed.verses) && parsed.verses.length > 0) {
          memoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 4. Pre-bundled sample check
  const sampleKey = `${normId}-${chapter}`;
  const localSample = SAMPLE_CHAPTERS[sampleKey];
  if (localSample) {
    const res = {
      bookName: localSample.bookName,
      chapter: localSample.chapter,
      verses: localSample.verses.map((v) => ({
        book: localSample.bookName,
        chapter: localSample.chapter,
        verse: v.num,
        text: v.text,
        title: v.title,
      })),
    };
    memoryCache.set(cacheKey, res);
    return res;
  }

  return null;
}

export async function getChapterVerses(
  bookId: string, 
  chapter: number
): Promise<{ bookName: string; chapter: number; verses: BibleVerse[] }> {
  // Find book metadata
  const book = BIBLE_BOOKS.find((b) => b.id.toLowerCase() === bookId.toLowerCase()) || {
    id: bookId,
    name: bookId,
    chapters: 1,
  };

  const normId = book.id.toLowerCase();
  const cacheKey = `${normId}_${chapter}`;

  // 1. Immediate sync check (0ms)
  const instant = getCachedChapterVerses(normId, chapter);
  if (instant) {
    return instant;
  }

  // 2. Fetch the offline local book JSON file directly from public static assets (/bible/{normId}.json)
  try {
    const res = await fetch(`/bible/${normId}.json`);
    if (res.ok) {
      const bookData: StoredBookData = await res.json();
      loadedBooksCache.set(normId, bookData);

      // Populate memory cache for all chapters in this book
      for (const [chNum, chVerses] of Object.entries(bookData.chapters)) {
        const chKey = `${normId}_${chNum}`;
        const parsedVerses: BibleVerse[] = chVerses.map((v) => ({
          book: bookData.name,
          chapter: Number(chNum),
          verse: v.verse,
          text: v.text,
          title: v.title,
        }));
        memoryCache.set(chKey, {
          bookName: bookData.name,
          chapter: Number(chNum),
          verses: parsedVerses,
        });
      }

      const chapterResult = memoryCache.get(cacheKey);
      if (chapterResult && chapterResult.verses.length > 0) {
        // Also persist to localStorage for offline access
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`faith_bible_ch_${cacheKey}`, JSON.stringify(chapterResult));
          } catch {}
        }
        return chapterResult;
      }
    }
  } catch (err) {
    console.warn(`Static book load failed for ${normId}, attempting API fallback:`, err);
  }

  // 3. Fallback: Internal API Route (which also reads from local file system)
  try {
    const res = await fetch(
      `/api/bible/chapter?book=${encodeURIComponent(book.name)}&chapter=${chapter}`
    );

    if (res.ok) {
      const data = await res.json();
      if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
        const result = {
          bookName: book.name,
          chapter,
          verses: data.verses,
        };

        memoryCache.set(cacheKey, result);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`faith_bible_ch_${cacheKey}`, JSON.stringify(result));
          } catch {}
        }

        return result;
      }
    }
  } catch (err) {
    console.warn('API fallback error:', err);
  }

  // 4. Fallback to local sample if available offline
  const sampleKey = `${normId}-${chapter}`;
  const localSample = SAMPLE_CHAPTERS[sampleKey];
  if (localSample) {
    return {
      bookName: localSample.bookName,
      chapter: localSample.chapter,
      verses: localSample.verses.map((v) => ({
        book: localSample.bookName,
        chapter: localSample.chapter,
        verse: v.num,
        text: v.text,
        title: v.title,
      })),
    };
  }

  return {
    bookName: book.name,
    chapter,
    verses: [],
  };
}

// Preload an entire book in the background
export function preloadBook(bookId: string): void {
  if (typeof window === 'undefined') return;
  const normId = bookId.toLowerCase();
  if (loadedBooksCache.has(normId)) return;

  const doLoad = () => {
    fetch(`/bible/${normId}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((bookData: StoredBookData | null) => {
        if (!bookData) return;
        loadedBooksCache.set(normId, bookData);
        for (const [chNum, chVerses] of Object.entries(bookData.chapters)) {
          const chKey = `${normId}_${chNum}`;
          if (!memoryCache.has(chKey)) {
            memoryCache.set(chKey, {
              bookName: bookData.name,
              chapter: Number(chNum),
              verses: chVerses.map((v) => ({
                book: bookData.name,
                chapter: Number(chNum),
                verse: v.verse,
                text: v.text,
                title: v.title,
              })),
            });
          }
        }
      })
      .catch(() => {});
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(doLoad);
  } else {
    setTimeout(doLoad, 100);
  }
}

// Background prefetch helper for chapters (Instant 0ms feel)
export function prefetchChapter(bookId: string, chapter: number): void {
  if (typeof window === 'undefined') return;
  if (getCachedChapterVerses(bookId, chapter)) return;

  const doFetch = () => {
    getChapterVerses(bookId, chapter).catch(() => {});
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(doFetch);
  } else {
    setTimeout(doFetch, 100);
  }
}
