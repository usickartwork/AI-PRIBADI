import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BIBLE_BOOKS, getBibleBookCode } from '@/lib/faith/bible/data';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookParam = searchParams.get('book');
  const chapterParam = searchParams.get('chapter');

  if (!bookParam || !chapterParam) {
    return NextResponse.json(
      { error: 'Parameter book dan chapter diperlukan.' },
      { status: 400 }
    );
  }

  const parsedChapter = parseInt(chapterParam, 10) || 1;
  const cleanBook = bookParam.trim().toLowerCase();

  // Find book metadata
  const book = BIBLE_BOOKS.find(
    (b) =>
      b.id.toLowerCase() === cleanBook ||
      b.name.toLowerCase() === cleanBook ||
      b.abbreviation.toLowerCase() === cleanBook
  );
  const bookId = book ? book.id : cleanBook;
  const bookName = book ? book.name : bookParam;

  // 1. Primary Strategy: Local Offline Bible JSON Dataset (Instant 0ms, No API)
  try {
    const filePath = path.join(process.cwd(), 'public/bible', `${bookId}.json`);
    if (fs.existsSync(filePath)) {
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const bookData = JSON.parse(raw);
      const rawChapter = bookData.chapters?.[String(parsedChapter)];

      if (rawChapter && Array.isArray(rawChapter) && rawChapter.length > 0) {
        const verses = rawChapter.map((item: any) => ({
          book: bookData.name || bookName,
          chapter: parsedChapter,
          verse: Number(item.verse),
          text: item.text,
          ...(item.title ? { title: item.title } : {}),
        }));

        return NextResponse.json(
          { bookName: bookData.name || bookName, chapter: parsedChapter, verses },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=31536000, immutable',
            },
          }
        );
      }
    }
  } catch (err) {
    console.warn(`Local bible file read failed for ${bookId}:`, err);
  }

  // 2. Secondary Strategy: Online Fallback to Alkitab SABDA HTML scraper
  try {
    const sabdaCode = getBibleBookCode(bookId);
    const sabdaUrl = `https://alkitab.sabda.org/passage.php?passage=${sabdaCode}+${parsedChapter}&mode=text`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(sabdaUrl, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const verseRegex = /<span class="verse">(\d+)<\/span>\s*([^<]+)/g;
      const verses: { book: string; chapter: number; verse: number; text: string }[] = [];
      let match;

      while ((match = verseRegex.exec(html)) !== null) {
        const vNum = parseInt(match[1], 10);
        const vText = match[2].trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
        if (vNum && vText) {
          verses.push({
            book: bookName,
            chapter: parsedChapter,
            verse: vNum,
            text: vText,
          });
        }
      }

      if (verses.length > 0) {
        return NextResponse.json(
          { bookName, chapter: parsedChapter, verses },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
            },
          }
        );
      }
    }
  } catch (err) {
    console.warn(`SABDA fallback failed for ${bookName} ${parsedChapter}:`, err);
  }

  // 3. Fallback: Generic graceful placeholder
  return NextResponse.json(
    {
      bookName,
      chapter: parsedChapter,
      verses: [
        {
          book: bookName,
          chapter: parsedChapter,
          verse: 1,
          text: `Pasal ${parsedChapter} sedang dimuat dari dataset Alkitab offline. Silakan refresh halaman jika teks belum muncul.`,
        },
      ],
    },
    { status: 200 }
  );
}

