// ─── Usick Survival — local persistence (IndexedDB w/ localStorage fallback) ──
import { SAVE_VERSION, TUNING, isBuildType, isItemId, type BuildType, type ItemId } from "./data";

export interface InvSlot {
  id: ItemId;
  qty: number;
}

export interface SavedBuilding {
  id: number;
  type: BuildType;
  x: number;
  y: number;
  z: number;
  rot: number; // 0..3 (×90°)
  open?: boolean;
}

export interface SavedAnimal {
  id: number;
  alive: boolean;
  hp: number;
  x: number;
  z: number;
  respawnAt: number;
}

export interface SavedDrop {
  id: number;
  item: ItemId;
  qty: number;
  x: number;
  z: number;
  expiresAt: number;
}

export interface SaveData {
  version: number;
  savedAt: number;
  seed: number;
  player: { x: number; y: number; z: number; rotY: number; health: number; hunger: number; stamina: number };
  camera: { yaw: number; pitch: number; dist: number };
  inventory: (InvSlot | null)[];
  hotbarIndex: number;
  nodes: Record<string, { uses: number; respawnAt: number }>;
  buildings: SavedBuilding[];
  nextBuildingId: number;
  animals: SavedAnimal[];
  drops: SavedDrop[];
  nextDropId: number;
  time: { dayTime: number; day: number; total: number; survived: number; deaths: number };
}

export interface GameSettings {
  audio: boolean;
  volume: number; // 0..1
  quality: "low" | "high";
  sensitivity: number; // 0.3..2
  invertY: boolean;
  showFps: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  audio: true,
  volume: 0.6,
  quality: "high",
  sensitivity: 1,
  invertY: false,
  showFps: false,
};

const DB_NAME = "usick-survival";
const STORE = "saves";
const SLOT = "slot1";
const LS_SAVE_KEY = "usick-survival-save-fallback";
const LS_SETTINGS_KEY = "usick-survival-settings";
const LS_META_KEY = "usick-survival-meta";

// ─── helpers ────────────────────────────────────────────────────────────────
const num = (v: unknown, def: number, min = -Infinity, max = Infinity) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : def;
  return Math.min(max, Math.max(min, n));
};

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet(key: string): Promise<unknown> {
  const db = await openDb();
  if (!db) throw new Error("no-idb");
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) throw new Error("no-idb");
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  if (!db) throw new Error("no-idb");
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}

// ─── validation ─────────────────────────────────────────────────────────────
export function validateSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.version !== "number" || r.version > SAVE_VERSION || r.version < 1) return null;
  if (r.seed !== TUNING.worldSeed) return null;
  const p = (r.player ?? {}) as Record<string, unknown>;
  const c = (r.camera ?? {}) as Record<string, unknown>;
  const t = (r.time ?? {}) as Record<string, unknown>;
  const H = TUNING.playableHalf;

  const invRaw = Array.isArray(r.inventory) ? r.inventory : null;
  if (!invRaw) return null;
  const inventory: (InvSlot | null)[] = [];
  for (let i = 0; i < TUNING.inventorySize; i++) {
    const s = invRaw[i] as Record<string, unknown> | null | undefined;
    if (s && isItemId(s.id) && typeof s.qty === "number" && s.qty >= 1) {
      inventory.push({ id: s.id, qty: Math.floor(num(s.qty, 1, 1, 999)) });
    } else inventory.push(null);
  }

  const nodes: SaveData["nodes"] = {};
  if (r.nodes && typeof r.nodes === "object") {
    for (const [k, v] of Object.entries(r.nodes as Record<string, unknown>)) {
      if (!/^\d+$/.test(k) || !v || typeof v !== "object") continue;
      const vv = v as Record<string, unknown>;
      nodes[k] = { uses: Math.floor(num(vv.uses, 0, 0, 99)), respawnAt: num(vv.respawnAt, 0, 0) };
    }
  }

  const buildings: SavedBuilding[] = [];
  if (Array.isArray(r.buildings)) {
    for (const b of r.buildings.slice(0, 600)) {
      if (!b || typeof b !== "object") continue;
      const bb = b as Record<string, unknown>;
      if (!isBuildType(bb.type)) continue;
      buildings.push({
        id: Math.floor(num(bb.id, 0, 0)),
        type: bb.type,
        x: num(bb.x, 0, -H - 2, H + 2),
        y: num(bb.y, 0, -20, 60),
        z: num(bb.z, 0, -H - 2, H + 2),
        rot: Math.floor(num(bb.rot, 0, 0, 3)),
        open: bb.open === true,
      });
    }
  }

  const animals: SavedAnimal[] = [];
  if (Array.isArray(r.animals)) {
    for (const a of r.animals.slice(0, 40)) {
      if (!a || typeof a !== "object") continue;
      const aa = a as Record<string, unknown>;
      animals.push({
        id: Math.floor(num(aa.id, 0, 0)),
        alive: aa.alive !== false,
        hp: num(aa.hp, TUNING.boarHp, 0, TUNING.boarHp),
        x: num(aa.x, 0, -H, H),
        z: num(aa.z, 0, -H, H),
        respawnAt: num(aa.respawnAt, 0, 0),
      });
    }
  }

  const drops: SavedDrop[] = [];
  if (Array.isArray(r.drops)) {
    for (const d of r.drops.slice(0, TUNING.maxDrops)) {
      if (!d || typeof d !== "object") continue;
      const dd = d as Record<string, unknown>;
      if (!isItemId(dd.item)) continue;
      drops.push({
        id: Math.floor(num(dd.id, 0, 0)),
        item: dd.item,
        qty: Math.floor(num(dd.qty, 1, 1, 50)),
        x: num(dd.x, 0, -H, H),
        z: num(dd.z, 0, -H, H),
        expiresAt: num(dd.expiresAt, 0, 0),
      });
    }
  }

  return {
    version: SAVE_VERSION,
    savedAt: num(r.savedAt, Date.now(), 0),
    seed: TUNING.worldSeed,
    player: {
      x: num(p.x, 0, -H, H),
      y: num(p.y, 0, -20, 60),
      z: num(p.z, 6, -H, H),
      rotY: num(p.rotY, 0),
      health: num(p.health, 100, 0, 100),
      hunger: num(p.hunger, 100, 0, 100),
      stamina: num(p.stamina, 100, 0, 100),
    },
    camera: {
      yaw: num(c.yaw, 0),
      pitch: num(c.pitch, 0.35, -0.25, 1.15),
      dist: num(c.dist, 5.5, 2.5, 10),
    },
    inventory,
    hotbarIndex: Math.floor(num(r.hotbarIndex, 0, 0, TUNING.hotbarSize - 1)),
    nodes,
    buildings,
    nextBuildingId: Math.floor(num(r.nextBuildingId, buildings.length + 1, 1)),
    animals,
    drops,
    nextDropId: Math.floor(num(r.nextDropId, drops.length + 1, 1)),
    time: {
      dayTime: num(t.dayTime, 0.3, 0, 1),
      day: Math.floor(num(t.day, 1, 1, 99999)),
      total: num(t.total, 0, 0),
      survived: num(t.survived, 0, 0),
      deaths: Math.floor(num(t.deaths, 0, 0)),
    },
  };
}

// ─── public API ─────────────────────────────────────────────────────────────
export type LoadResult =
  | { status: "ok"; data: SaveData }
  | { status: "empty" }
  | { status: "corrupt" };

export async function loadGame(): Promise<LoadResult> {
  let raw: unknown = undefined;
  try {
    raw = await idbGet(SLOT);
  } catch {
    raw = undefined;
  }
  if (raw === undefined || raw === null) {
    try {
      const ls = localStorage.getItem(LS_SAVE_KEY);
      if (ls) raw = JSON.parse(ls);
    } catch {
      return { status: "corrupt" };
    }
  }
  if (raw === undefined || raw === null) return { status: "empty" };
  const data = validateSave(raw);
  if (!data) {
    // Keep a copy of the broken save for diagnostics, never silently lose it
    try {
      localStorage.setItem("usick-survival-corrupt-backup", JSON.stringify(raw).slice(0, 500000));
    } catch {
      /* ignore */
    }
    return { status: "corrupt" };
  }
  return { status: "ok", data };
}

export async function saveGame(data: SaveData): Promise<void> {
  const clean = JSON.parse(JSON.stringify(data)) as SaveData;
  try {
    await idbPut(SLOT, clean);
    try {
      localStorage.removeItem(LS_SAVE_KEY);
    } catch {
      /* ignore */
    }
  } catch {
    // Fallback (e.g. private mode without IndexedDB)
    localStorage.setItem(LS_SAVE_KEY, JSON.stringify(clean));
  }
  writeMeta({ savedAt: clean.savedAt, day: clean.time.day, survived: clean.time.survived });
}

export async function deleteSave(): Promise<void> {
  try {
    await idbDelete(SLOT);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(LS_SAVE_KEY);
    localStorage.removeItem(LS_META_KEY);
  } catch {
    /* ignore */
  }
}

export interface SaveMeta {
  savedAt: number;
  day: number;
  survived: number;
}

function writeMeta(meta: SaveMeta) {
  try {
    localStorage.setItem(LS_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

export function readMeta(): SaveMeta | null {
  try {
    const raw = localStorage.getItem(LS_META_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Record<string, unknown>;
    if (typeof m.savedAt !== "number") return null;
    return { savedAt: m.savedAt, day: num(m.day, 1, 1), survived: num(m.survived, 0, 0) };
  } catch {
    return null;
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const s = JSON.parse(raw) as Record<string, unknown>;
    return {
      audio: typeof s.audio === "boolean" ? s.audio : DEFAULT_SETTINGS.audio,
      volume: num(s.volume, DEFAULT_SETTINGS.volume, 0, 1),
      quality: s.quality === "low" ? "low" : "high",
      sensitivity: num(s.sensitivity, 1, 0.3, 2),
      invertY: s.invertY === true,
      showFps: s.showFps === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function storeSettings(s: GameSettings) {
  try {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
