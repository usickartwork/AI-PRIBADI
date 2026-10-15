// ─── Usick One — Synchronized Lyrics Types, Parser & Cache ───────────────────

export interface LyricLine {
  id: string;
  time: number; // in seconds with millisecond precision
  text: string;
}

export interface LyricsData {
  id?: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  lines: LyricLine[];
  synced?: boolean;
  plainText?: string | null;
  cached?: boolean;
}

/**
 * Normalizes a song title or artist name for matching purposes.
 * Removes featuring artists (feat. ...), extra punctuation, and standardizes spacing.
 */
export function normalizeLyricQuery(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\s*\(feat\.[^)]*\)/gi, "")
    .replace(/\s*\(ft\.[^)]*\)/gi, "")
    .replace(/\s*\[feat\.[^\]]*\]/gi, "")
    .replace(/\s*\[ft\.[^\]]*\]/gi, "")
    .replace(/\s*-\s*remaster(?:ed)?(?:\s*\d+)?/gi, "")
    .replace(/\s*\(remaster(?:ed)?(?:\s*\d+)?\)/gi, "")
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses raw LRC format lyrics into a chronologically sorted array of LyricLine objects.
 * Supports:
 * - Standard timestamps: [mm:ss.xx] or [mm:ss.xxx]
 * - Multiple timestamps on a single line: [00:12.50][00:24.00] Repeated chorus
 * - ID tags: [ti:...], [ar:...], [al:...], [by:...], etc. (safely ignored)
 * - Empty lines & malformed timestamp handling
 */
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== "string") return [];

  const lines = lrcText.split(/\r?\n/);
  const parsedLines: LyricLine[] = [];

  // Match one or more [mm:ss.xx] timestamps at the start or throughout the line
  const timeTagRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Reset regex index
    timeTagRegex.lastIndex = 0;

    const timestamps: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = timeTagRegex.exec(rawLine)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const subSecondsStr = match[3] || "0";

      // If 2 digits, it is centiseconds (1/100s). If 3 digits, milliseconds (1/1000s).
      const fraction =
        subSecondsStr.length === 3
          ? parseInt(subSecondsStr, 10) / 1000
          : parseInt(subSecondsStr.padEnd(2, "0").slice(0, 2), 10) / 100;

      const totalSeconds = Math.max(0, minutes * 60 + seconds + fraction);
      timestamps.push(Math.round(totalSeconds * 100) / 100);
    }

    if (timestamps.length === 0) {
      // Line without timestamps (e.g. metadata or unsynced segment)
      continue;
    }

    // Strip all timestamp tags to extract the clean text
    const textContent = rawLine.replace(/\[\d{1,3}:\d{2}(?:\.\d{1,3})?\]/g, "").trim();

    // Create a LyricLine for each timestamp attached to this text
    for (let t = 0; t < timestamps.length; t++) {
      parsedLines.push({
        id: `lyric-${timestamps[t]}-${parsedLines.length}`,
        time: timestamps[t],
        text: textContent,
      });
    }
  }

  // Sort chronologically
  parsedLines.sort((a, b) => a.time - b.time);

  // Filter out excessive consecutive empty lines while preserving intro spacing
  return parsedLines.filter((line, idx) => {
    if (line.text.length > 0) return true;
    // Allow single empty line as pause/instrumental separator, but not consecutive ones
    if (idx > 0 && parsedLines[idx - 1].text.length === 0) return false;
    return true;
  });
}

/**
 * Finds the index of the currently active lyric line using binary search.
 * Returns:
 * - -1 if current time is before the first timestamp
 * - lines.length - 1 if current time is at or after the last timestamp
 * - index of the line where lines[i].time <= currentTime < lines[i+1].time
 */
export function findActiveLyricIndex(lines: LyricLine[], currentTime: number): number {
  if (!lines || lines.length === 0) return -1;
  if (currentTime < lines[0].time) return -1;
  if (currentTime >= lines[lines.length - 1].time) return lines.length - 1;

  let low = 0;
  let high = lines.length - 1;
  let activeIndex = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (lines[mid].time <= currentTime) {
      activeIndex = mid;
      low = mid + 1; // Look for a closer timestamp to the right
    } else {
      high = mid - 1;
    }
  }

  return activeIndex;
}

/**
 * Format timestamp in seconds to mm:ss format for UI display
 */
export function formatLyricTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Local Storage Client Cache Helper ────────────────────────────────────────

const CLIENT_CACHE_KEY_PREFIX = "usick_lyrics_";
const CLIENT_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function getClientLyricsCache(title: string, artist: string): LyricsData | null {
  if (typeof window === "undefined") return null;
  try {
    const key = `${CLIENT_CACHE_KEY_PREFIX}${normalizeLyricQuery(title)}_${normalizeLyricQuery(artist)}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed || !parsed.timestamp) return null;

    if (Date.now() - parsed.timestamp > CLIENT_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function setClientLyricsCache(title: string, artist: string, data: LyricsData): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${CLIENT_CACHE_KEY_PREFIX}${normalizeLyricQuery(title)}_${normalizeLyricQuery(artist)}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (err) {
    console.warn("[lyrics] Failed to write client lyrics cache:", err);
  }
}
