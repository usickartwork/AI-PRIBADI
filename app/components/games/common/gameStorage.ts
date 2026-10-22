// Utility storage lokal yang aman dan terisolasi untuk Usick One Game Hub

export interface ChessPreferences {
  difficulty: "easy" | "medium" | "hard";
  playerColor: "w" | "b" | "random";
  boardTheme: "emerald" | "classic" | "midnight" | "slate";
  timerMinutes: 0 | 3 | 5 | 10;
  soundEnabled: boolean;
  stats: {
    wins: number;
    losses: number;
    draws: number;
  };
}

export interface NeonDriftRecords {
  bestLapMs: number | null;
  totalLapsCompleted: number;
  totalRacesFinished: number;
  soundEnabled: boolean;
}

export interface RacingRecords {
  bestLapMs: number | null;
  totalRacesFinished: number;
  selectedCar: "apex" | "inferno" | "phantom";
  soundEnabled: boolean;
}

export interface PlatformerRecords {
  highestLevelUnlocked: number;
  totalCoinsCollected: number;
  totalDeaths: number;
  bestTimesMs: Record<number, number | null>;
  soundEnabled: boolean;
}

const DEFAULT_CHESS_PREFS: ChessPreferences = {
  difficulty: "medium",
  playerColor: "w",
  boardTheme: "emerald",
  timerMinutes: 0,
  soundEnabled: true,
  stats: { wins: 0, losses: 0, draws: 0 },
};

const DEFAULT_NEON_RECORDS: NeonDriftRecords = {
  bestLapMs: null,
  totalLapsCompleted: 0,
  totalRacesFinished: 0,
  soundEnabled: true,
};

const DEFAULT_RACING_RECORDS: RacingRecords = {
  bestLapMs: null,
  totalRacesFinished: 0,
  selectedCar: "apex",
  soundEnabled: true,
};

const DEFAULT_PLATFORMER_RECORDS: PlatformerRecords = {
  highestLevelUnlocked: 1,
  totalCoinsCollected: 0,
  totalDeaths: 0,
  bestTimesMs: { 1: null, 2: null, 3: null },
  soundEnabled: true,
};

const CHESS_STORAGE_KEY = "usick-chess-prefs-v1";
const NEON_STORAGE_KEY = "usick-neon-records-v1";
const RACING_STORAGE_KEY = "usick-racing-records-v1";
const PLATFORMER_STORAGE_KEY = "usick-platformer-records-v1";

export function loadChessPreferences(): ChessPreferences {
  if (typeof window === "undefined") return DEFAULT_CHESS_PREFS;
  try {
    const raw = localStorage.getItem(CHESS_STORAGE_KEY);
    if (!raw) return DEFAULT_CHESS_PREFS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CHESS_PREFS,
      ...parsed,
      stats: {
        wins: typeof parsed?.stats?.wins === "number" ? parsed.stats.wins : 0,
        losses: typeof parsed?.stats?.losses === "number" ? parsed.stats.losses : 0,
        draws: typeof parsed?.stats?.draws === "number" ? parsed.stats.draws : 0,
      },
    };
  } catch {
    return DEFAULT_CHESS_PREFS;
  }
}

export function saveChessPreferences(prefs: ChessPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHESS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export function loadNeonRecords(): NeonDriftRecords {
  if (typeof window === "undefined") return DEFAULT_NEON_RECORDS;
  try {
    const raw = localStorage.getItem(NEON_STORAGE_KEY);
    if (!raw) return DEFAULT_NEON_RECORDS;
    const parsed = JSON.parse(raw);
    return {
      bestLapMs: typeof parsed?.bestLapMs === "number" ? parsed.bestLapMs : null,
      totalLapsCompleted: typeof parsed?.totalLapsCompleted === "number" ? parsed.totalLapsCompleted : 0,
      totalRacesFinished: typeof parsed?.totalRacesFinished === "number" ? parsed.totalRacesFinished : 0,
      soundEnabled: typeof parsed?.soundEnabled === "boolean" ? parsed.soundEnabled : true,
    };
  } catch {
    return DEFAULT_NEON_RECORDS;
  }
}

export function saveNeonRecords(records: NeonDriftRecords): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NEON_STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export function loadRacingRecords(): RacingRecords {
  if (typeof window === "undefined") return DEFAULT_RACING_RECORDS;
  try {
    const raw = localStorage.getItem(RACING_STORAGE_KEY);
    if (!raw) return DEFAULT_RACING_RECORDS;
    const parsed = JSON.parse(raw);
    const validCar = ["apex", "inferno", "phantom"].includes(parsed?.selectedCar)
      ? parsed.selectedCar
      : "apex";
    return {
      bestLapMs: typeof parsed?.bestLapMs === "number" ? parsed.bestLapMs : null,
      totalRacesFinished: typeof parsed?.totalRacesFinished === "number" ? parsed.totalRacesFinished : 0,
      selectedCar: validCar,
      soundEnabled: typeof parsed?.soundEnabled === "boolean" ? parsed.soundEnabled : true,
    };
  } catch {
    return DEFAULT_RACING_RECORDS;
  }
}

export function saveRacingRecords(records: RacingRecords): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RACING_STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export function loadPlatformerRecords(): PlatformerRecords {
  if (typeof window === "undefined") return DEFAULT_PLATFORMER_RECORDS;
  try {
    const raw = localStorage.getItem(PLATFORMER_STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORMER_RECORDS;
    const parsed = JSON.parse(raw);
    return {
      highestLevelUnlocked:
        typeof parsed?.highestLevelUnlocked === "number"
          ? Math.max(1, Math.min(3, parsed.highestLevelUnlocked))
          : 1,
      totalCoinsCollected:
        typeof parsed?.totalCoinsCollected === "number"
          ? Math.max(0, parsed.totalCoinsCollected)
          : 0,
      totalDeaths:
        typeof parsed?.totalDeaths === "number"
          ? Math.max(0, parsed.totalDeaths)
          : 0,
      bestTimesMs:
        parsed?.bestTimesMs && typeof parsed.bestTimesMs === "object"
          ? {
              1: typeof parsed.bestTimesMs[1] === "number" ? parsed.bestTimesMs[1] : null,
              2: typeof parsed.bestTimesMs[2] === "number" ? parsed.bestTimesMs[2] : null,
              3: typeof parsed.bestTimesMs[3] === "number" ? parsed.bestTimesMs[3] : null,
            }
          : { 1: null, 2: null, 3: null },
      soundEnabled:
        typeof parsed?.soundEnabled === "boolean" ? parsed.soundEnabled : true,
    };
  } catch {
    return DEFAULT_PLATFORMER_RECORDS;
  }
}

export function savePlatformerRecords(records: PlatformerRecords): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLATFORMER_STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export function formatTimeMs(ms: number | null): string {
  if (ms === null || isNaN(ms) || ms <= 0) return "--:--.---";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  const pad = (n: number, z = 2) => String(n).padStart(z, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
}
