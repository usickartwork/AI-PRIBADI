// ─── Usick One: Navigation Preferences Schema, Validation & State Helpers ──────

export const NAV_PREFS_SCHEMA_VERSION = 1 as const;

export const CORE_MAIN_TAB_IDS = [
  "chat",
  "code",
  "schedule",
  "image",
  "messages",
  "music",
  "emergency",
] as const;

export const DEFAULT_OVERFLOW_TAB_IDS = ["game", "faith"] as const;

export const ALL_NAV_TAB_IDS = [
  ...CORE_MAIN_TAB_IDS,
  ...DEFAULT_OVERFLOW_TAB_IDS,
] as const;

/** Semua tab navigasi kini dapat dipindahkan keluar/masuk grup Lainnya */
export const MOVABLE_OVERFLOW_TAB_IDS = ALL_NAV_TAB_IDS;

export const LAINNYA_GROUP_SLOT_ID = "lainnya" as const;

export type CoreMainTabId = (typeof CORE_MAIN_TAB_IDS)[number];
export type NavTabId = (typeof ALL_NAV_TAB_IDS)[number];
export type MovableOverflowTabId = NavTabId;
export type MainNavSlotId = NavTabId | typeof LAINNYA_GROUP_SLOT_ID;

export interface NavigationTabMetadata {
  id: NavTabId;
  /** Label tampilan di panel navigasi utama (mengikuti desain existing) */
  sidebarLabel: string;
  /** Label konseptual pada halaman Pengaturan Customize Tab */
  settingsLabel: string;
  /** Apakah tab dapat dipindahkan keluar/masuk grup Lainnya */
  canMoveToLainnya: boolean;
  /** Apakah tab memiliki badge/fitur khusus paket Pro pada mode Free */
  isProBadgeTab: boolean;
}

export const NAV_TAB_METADATA: Record<NavTabId, NavigationTabMetadata> = {
  chat: {
    id: "chat",
    sidebarLabel: "Chats",
    settingsLabel: "Chat",
    canMoveToLainnya: true,
    isProBadgeTab: false,
  },
  code: {
    id: "code",
    sidebarLabel: "Code",
    settingsLabel: "Code",
    canMoveToLainnya: true,
    isProBadgeTab: false,
  },
  schedule: {
    id: "schedule",
    sidebarLabel: "Schedule",
    settingsLabel: "Schedule",
    canMoveToLainnya: true,
    isProBadgeTab: false,
  },
  image: {
    id: "image",
    sidebarLabel: "Image",
    settingsLabel: "Image",
    canMoveToLainnya: true,
    isProBadgeTab: true,
  },
  messages: {
    id: "messages",
    sidebarLabel: "Messages",
    settingsLabel: "Messages",
    canMoveToLainnya: true,
    isProBadgeTab: true,
  },
  music: {
    id: "music",
    sidebarLabel: "Music",
    settingsLabel: "Music",
    canMoveToLainnya: true,
    isProBadgeTab: true,
  },
  emergency: {
    id: "emergency",
    sidebarLabel: "Emergency",
    settingsLabel: "Emergency",
    canMoveToLainnya: true,
    isProBadgeTab: false,
  },
  game: {
    id: "game",
    sidebarLabel: "Game",
    settingsLabel: "Game",
    canMoveToLainnya: true,
    isProBadgeTab: false,
  },
  faith: {
    id: "faith",
    sidebarLabel: "Faith",
    settingsLabel: "Faith",
    canMoveToLainnya: true,
    isProBadgeTab: true,
  },
};

export interface NavigationPreferencesV1 {
  version: typeof NAV_PREFS_SCHEMA_VERSION;
  /** Urutan slot pada panel utama; wajib memuat tepat 1 marker "lainnya" & minimal 1 tab utama */
  mainOrder: MainNavSlotId[];
  /** Urutan tab di dalam grup Lainnya (bisa diisi tab apa saja selain minimal 1 tab di Panel Utama) */
  lainnyaOrder: NavTabId[];
  /** Nomor revisi monotonik untuk mencegah penimpaan request out-of-order */
  revision: number;
  /** Timestamp ISO 8601 pembaruan terakhir */
  updatedAt: string;
}

export const DEFAULT_MAIN_ORDER: readonly MainNavSlotId[] = [
  "chat",
  "code",
  "schedule",
  "image",
  "messages",
  "music",
  "emergency",
  "lainnya",
] as const;

export const DEFAULT_LAINNYA_ORDER: readonly NavTabId[] = [
  "game",
  "faith",
] as const;

const VALID_NAV_TAB_SET = new Set<string>(ALL_NAV_TAB_IDS);

export function isNavTabId(value: unknown): value is NavTabId {
  return typeof value === "string" && VALID_NAV_TAB_SET.has(value);
}

export function isMovableOverflowTabId(
  value: unknown
): value is MovableOverflowTabId {
  return isNavTabId(value);
}

export function countMainTabs(mainOrder: readonly MainNavSlotId[]): number {
  let count = 0;
  for (const id of mainOrder) {
    if (id !== LAINNYA_GROUP_SLOT_ID) count += 1;
  }
  return count;
}

export function isMainNavSlotId(value: unknown): value is MainNavSlotId {
  return value === LAINNYA_GROUP_SLOT_ID || isNavTabId(value);
}

export function createDefaultNavigationPreferences(
  nowIso: string = new Date(0).toISOString(),
  revision = 0
): NavigationPreferencesV1 {
  return {
    version: NAV_PREFS_SCHEMA_VERSION,
    mainOrder: [...DEFAULT_MAIN_ORDER],
    lainnyaOrder: [...DEFAULT_LAINNYA_ORDER],
    revision: Math.max(0, Math.floor(revision)),
    updatedAt: nowIso,
  };
}

export function isDefaultNavigationOrder(
  prefs: Pick<NavigationPreferencesV1, "mainOrder" | "lainnyaOrder">
): boolean {
  if (prefs.mainOrder.length !== DEFAULT_MAIN_ORDER.length) return false;
  if (prefs.lainnyaOrder.length !== DEFAULT_LAINNYA_ORDER.length) return false;
  for (let i = 0; i < DEFAULT_MAIN_ORDER.length; i++) {
    if (prefs.mainOrder[i] !== DEFAULT_MAIN_ORDER[i]) return false;
  }
  for (let i = 0; i < DEFAULT_LAINNYA_ORDER.length; i++) {
    if (prefs.lainnyaOrder[i] !== DEFAULT_LAINNYA_ORDER[i]) return false;
  }
  return true;
}

export function areNavigationOrdersEqual(
  a: Pick<NavigationPreferencesV1, "mainOrder" | "lainnyaOrder">,
  b: Pick<NavigationPreferencesV1, "mainOrder" | "lainnyaOrder">
): boolean {
  if (a.mainOrder.length !== b.mainOrder.length) return false;
  if (a.lainnyaOrder.length !== b.lainnyaOrder.length) return false;
  for (let i = 0; i < a.mainOrder.length; i++) {
    if (a.mainOrder[i] !== b.mainOrder[i]) return false;
  }
  for (let i = 0; i < a.lainnyaOrder.length; i++) {
    if (a.lainnyaOrder[i] !== b.lainnyaOrder[i]) return false;
  }
  return true;
}

// ─── Strict Validation (Client Save & Server API POST) ─────────────────────────

export type StrictValidationResult =
  | { valid: true; value: NavigationPreferencesV1 }
  | { valid: false; error: string };

export function validateNavigationPreferencesStrict(
  raw: unknown
): StrictValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Payload preferensi navigasi harus berupa objek." };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.version !== NAV_PREFS_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Versi skema preferensi tidak didukung (diterima: ${String(obj.version)}).`,
    };
  }

  if (!Array.isArray(obj.mainOrder) || !Array.isArray(obj.lainnyaOrder)) {
    return {
      valid: false,
      error: "Field mainOrder dan lainnyaOrder wajib berupa array.",
    };
  }

  // Batasi ukuran maksimum array untuk mencegah penyalahgunaan payload besar
  if (
    obj.mainOrder.length > ALL_NAV_TAB_IDS.length + 1 ||
    obj.lainnyaOrder.length > ALL_NAV_TAB_IDS.length
  ) {
    return {
      valid: false,
      error: "Ukuran konfigurasi navigasi melebihi batas yang diizinkan.",
    };
  }

  const seenTabs = new Set<NavTabId>();
  let lainnyaSlotCount = 0;
  const validatedMainOrder: MainNavSlotId[] = [];
  const validatedLainnyaOrder: NavTabId[] = [];

  for (const item of obj.mainOrder) {
    if (typeof item !== "string") {
      return { valid: false, error: "Item pada mainOrder harus berupa string ID." };
    }
    if (item === LAINNYA_GROUP_SLOT_ID) {
      lainnyaSlotCount += 1;
      if (lainnyaSlotCount > 1) {
        return {
          valid: false,
          error: "Slot grup 'lainnya' tidak boleh terduplikasi pada mainOrder.",
        };
      }
      validatedMainOrder.push(LAINNYA_GROUP_SLOT_ID);
      continue;
    }

    if (!isNavTabId(item)) {
      return {
        valid: false,
        error: `ID tab asing atau tidak dikenal pada mainOrder: '${item.slice(0, 32)}'.`,
      };
    }

    if (seenTabs.has(item)) {
      return {
        valid: false,
        error: `Tab '${item}' terduplikasi dalam konfigurasi navigasi.`,
      };
    }

    seenTabs.add(item);
    validatedMainOrder.push(item);
  }

  if (lainnyaSlotCount !== 1) {
    return {
      valid: false,
      error: "Konfigurasi mainOrder wajib memiliki tepat satu posisi grup 'lainnya'.",
    };
  }

  if (countMainTabs(validatedMainOrder) < 1) {
    return {
      valid: false,
      error: "Minimal 1 tab harus tetap berada di Panel Utama.",
    };
  }

  for (const item of obj.lainnyaOrder) {
    if (typeof item !== "string") {
      return { valid: false, error: "Item pada lainnyaOrder harus berupa string ID." };
    }
    if (!isNavTabId(item)) {
      return {
        valid: false,
        error: `ID tab asing atau tidak dikenal pada lainnyaOrder: '${item.slice(0, 32)}'.`,
      };
    }
    if (seenTabs.has(item)) {
      return {
        valid: false,
        error: `Tab '${item}' muncul di lebih dari satu tempat (mainOrder & lainnyaOrder).`,
      };
    }
    seenTabs.add(item);
    validatedLainnyaOrder.push(item);
  }

  // Pastikan setiap tab yang didukung muncul tepat satu kali (tidak ada tab yang hilang)
  for (const requiredId of ALL_NAV_TAB_IDS) {
    if (!seenTabs.has(requiredId)) {
      return {
        valid: false,
        error: `Tab wajib '${requiredId}' hilang dari konfigurasi navigasi.`,
      };
    }
  }

  if (seenTabs.size !== ALL_NAV_TAB_IDS.length) {
    return {
      valid: false,
      error: "Jumlah total tab tidak sesuai dengan daftar tab yang didukung.",
    };
  }

  const rawRevision =
    typeof obj.revision === "number" && Number.isFinite(obj.revision) && obj.revision >= 0
      ? Math.floor(obj.revision)
      : 1;

  let updatedAt = new Date().toISOString();
  if (typeof obj.updatedAt === "string" && obj.updatedAt.trim()) {
    const parsedMs = Date.parse(obj.updatedAt);
    if (Number.isFinite(parsedMs)) {
      updatedAt = new Date(parsedMs).toISOString();
    }
  }

  return {
    valid: true,
    value: {
      version: NAV_PREFS_SCHEMA_VERSION,
      mainOrder: validatedMainOrder,
      lainnyaOrder: validatedLainnyaOrder,
      revision: rawRevision,
      updatedAt,
    },
  };
}

// ─── Safe Recovery / Sanitizer (Load LocalCache, Legacy Schema, Corrupted Data) ─

function normalizeLegacyTabAlias(rawId: unknown): string | null {
  if (typeof rawId !== "string") return null;
  const trimmed = rawId.trim().toLowerCase();
  if (!trimmed) return null;
  // Dukungan aman untuk versi skema lama yang mungkin memakai "chats" atau "more"
  if (trimmed === "chats") return "chat";
  if (trimmed === "more" || trimmed === "halaman") return LAINNYA_GROUP_SLOT_ID;
  return trimmed;
}

export interface SanitizeResult {
  preferences: NavigationPreferencesV1;
  repaired: boolean;
  reason?: string;
}

export function sanitizeNavigationPreferences(raw: unknown): SanitizeResult {
  let candidate: unknown = raw;

  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return {
        preferences: createDefaultNavigationPreferences(),
        repaired: true,
        reason: "invalid_json",
      };
    }
  }

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {
      preferences: createDefaultNavigationPreferences(),
      repaired: true,
      reason: "not_an_object",
    };
  }

  // Fast path jika sudah 100% valid
  const strict = validateNavigationPreferencesStrict(candidate);
  if (strict.valid) {
    return { preferences: strict.value, repaired: false };
  }

  const obj = candidate as Record<string, unknown>;

  // Dukungan skema lama hipotetis (mis. v0: { tabs: [...], overflow: [...] })
  const rawMain = Array.isArray(obj.mainOrder)
    ? obj.mainOrder
    : Array.isArray(obj.tabs)
      ? obj.tabs
      : [];
  const rawLainnya = Array.isArray(obj.lainnyaOrder)
    ? obj.lainnyaOrder
    : Array.isArray(obj.overflow)
      ? obj.overflow
      : [];

  const seenTabs = new Set<NavTabId>();
  const repairedMain: MainNavSlotId[] = [];
  const repairedLainnya: NavTabId[] = [];
  let hasLainnyaSlot = false;

  // 1. Pulihkan mainOrder terlebih dahulu
  for (const entry of rawMain) {
    const norm = normalizeLegacyTabAlias(entry);
    if (!norm) continue;
    if (norm === LAINNYA_GROUP_SLOT_ID) {
      if (!hasLainnyaSlot) {
        hasLainnyaSlot = true;
        repairedMain.push(LAINNYA_GROUP_SLOT_ID);
      }
      continue;
    }
    if (isNavTabId(norm) && !seenTabs.has(norm)) {
      seenTabs.add(norm);
      repairedMain.push(norm);
    }
  }

  // 2. Pulihkan lainnyaOrder untuk semua tab valid yang belum muncul di mainOrder
  for (const entry of rawLainnya) {
    const norm = normalizeLegacyTabAlias(entry);
    if (norm && isNavTabId(norm) && !seenTabs.has(norm)) {
      seenTabs.add(norm);
      repairedLainnya.push(norm);
    }
  }

  const lainnyaWasAtEnd =
    repairedMain.length > 0 &&
    repairedMain[repairedMain.length - 1] === LAINNYA_GROUP_SLOT_ID;

  const appendMissingCoreTab = (tabId: NavTabId) => {
    if (lainnyaWasAtEnd) {
      const lainnyaIdx = repairedMain.indexOf(LAINNYA_GROUP_SLOT_ID);
      if (lainnyaIdx >= 0) {
        repairedMain.splice(lainnyaIdx, 0, tabId);
        return;
      }
    }
    repairedMain.push(tabId);
  };

  // 3. Pastikan setiap tab wajib hadir tepat 1 kali (tambahkan tab yang hilang ke lokasi default aman)
  for (const coreId of CORE_MAIN_TAB_IDS) {
    if (!seenTabs.has(coreId)) {
      seenTabs.add(coreId);
      appendMissingCoreTab(coreId);
    }
  }

  for (const overflowId of DEFAULT_OVERFLOW_TAB_IDS) {
    if (!seenTabs.has(overflowId)) {
      seenTabs.add(overflowId);
      repairedLainnya.push(overflowId);
    }
  }

  // 4. Pastikan marker "lainnya" hadir tepat 1 kali di mainOrder
  if (!hasLainnyaSlot) {
    repairedMain.push(LAINNYA_GROUP_SLOT_ID);
  }

  // 5. Pastikan minimal 1 tab tetap berada di Panel Utama
  if (countMainTabs(repairedMain) < 1 && repairedLainnya.length > 0) {
    const promotedIdx = repairedLainnya.indexOf("chat");
    const tabToRestore =
      promotedIdx >= 0
        ? repairedLainnya.splice(promotedIdx, 1)[0]
        : repairedLainnya.shift()!;
    repairedMain.unshift(tabToRestore);
  }

  // Jika input awal benar-benar kosong (tidak ada 1 pun ID valid), gunakan urutan default murni
  if (rawMain.length === 0 && rawLainnya.length === 0) {
    return {
      preferences: createDefaultNavigationPreferences(),
      repaired: true,
      reason: "empty_arrays",
    };
  }

  const rawRevision =
    typeof obj.revision === "number" && Number.isFinite(obj.revision) && obj.revision >= 0
      ? Math.floor(obj.revision)
      : 0;

  let updatedAt = new Date(0).toISOString();
  if (typeof obj.updatedAt === "string" && obj.updatedAt.trim()) {
    const parsedMs = Date.parse(obj.updatedAt);
    if (Number.isFinite(parsedMs)) {
      updatedAt = new Date(parsedMs).toISOString();
    }
  }

  return {
    preferences: {
      version: NAV_PREFS_SCHEMA_VERSION,
      mainOrder: repairedMain,
      lainnyaOrder: repairedLainnya,
      revision: rawRevision,
      updatedAt,
    },
    repaired: true,
    reason: strict.error,
  };
}

// ─── Pure Draft Mutation Helpers (Guaranteed Invariant-Preserving) ─────────────

export function reorderMainSlots(
  prefs: NavigationPreferencesV1,
  nextMainOrder: MainNavSlotId[]
): NavigationPreferencesV1 {
  const candidate: NavigationPreferencesV1 = {
    ...prefs,
    mainOrder: [...nextMainOrder],
  };
  const checked = validateNavigationPreferencesStrict(candidate);
  if (checked.valid) {
    return checked.value;
  }
  return sanitizeNavigationPreferences(candidate).preferences;
}

export function reorderLainnyaTabs(
  prefs: NavigationPreferencesV1,
  nextLainnyaOrder: NavTabId[]
): NavigationPreferencesV1 {
  const candidate: NavigationPreferencesV1 = {
    ...prefs,
    lainnyaOrder: [...nextLainnyaOrder],
  };
  const checked = validateNavigationPreferencesStrict(candidate);
  if (checked.valid) {
    return checked.value;
  }
  return sanitizeNavigationPreferences(candidate).preferences;
}

export function moveMainSlotByOffset(
  prefs: NavigationPreferencesV1,
  slotId: MainNavSlotId,
  direction: -1 | 1
): NavigationPreferencesV1 {
  const idx = prefs.mainOrder.indexOf(slotId);
  if (idx === -1) return prefs;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= prefs.mainOrder.length) return prefs;

  const nextMain = [...prefs.mainOrder];
  const [removed] = nextMain.splice(idx, 1);
  nextMain.splice(targetIdx, 0, removed);
  return {
    ...prefs,
    mainOrder: nextMain,
  };
}

export function moveLainnyaTabByOffset(
  prefs: NavigationPreferencesV1,
  tabId: NavTabId,
  direction: -1 | 1
): NavigationPreferencesV1 {
  const idx = prefs.lainnyaOrder.indexOf(tabId);
  if (idx === -1) return prefs;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= prefs.lainnyaOrder.length) return prefs;

  const nextLainnya = [...prefs.lainnyaOrder];
  const [removed] = nextLainnya.splice(idx, 1);
  nextLainnya.splice(targetIdx, 0, removed);
  return {
    ...prefs,
    lainnyaOrder: nextLainnya,
  };
}

/**
 * Memindahkan tab apa pun keluar dari grup Lainnya menjadi tab utama
 * (disisipkan pada targetMainIndex bila diberikan, atau tepat sebelum posisi grup Lainnya).
 */
export function promoteTabFromLainnya(
  prefs: NavigationPreferencesV1,
  tabId: NavTabId,
  targetMainIndex?: number
): NavigationPreferencesV1 {
  if (!prefs.lainnyaOrder.includes(tabId)) {
    return prefs;
  }
  const nextLainnya = prefs.lainnyaOrder.filter((id) => id !== tabId);
  const nextMain = prefs.mainOrder.filter((id) => id !== tabId);

  if (!nextMain.includes(LAINNYA_GROUP_SLOT_ID)) {
    nextMain.push(LAINNYA_GROUP_SLOT_ID);
  }

  if (typeof targetMainIndex === "number" && Number.isFinite(targetMainIndex)) {
    const clamped = Math.max(0, Math.min(nextMain.length, Math.floor(targetMainIndex)));
    nextMain.splice(clamped, 0, tabId);
  } else {
    const lainnyaIdx = nextMain.indexOf(LAINNYA_GROUP_SLOT_ID);
    if (lainnyaIdx >= 0) {
      nextMain.splice(lainnyaIdx, 0, tabId);
    } else {
      nextMain.push(tabId);
    }
  }

  return {
    ...prefs,
    mainOrder: nextMain,
    lainnyaOrder: nextLainnya,
  };
}

/**
 * Memindahkan tab apa pun dari Panel Utama ke dalam grup Lainnya
 * (selama masih tersisa minimal 1 tab di Panel Utama).
 */
export function demoteTabToLainnya(
  prefs: NavigationPreferencesV1,
  tabId: NavTabId,
  targetLainnyaIndex?: number
): NavigationPreferencesV1 {
  if (prefs.lainnyaOrder.includes(tabId)) {
    return prefs;
  }
  if (!prefs.mainOrder.includes(tabId)) {
    return prefs;
  }
  if (countMainTabs(prefs.mainOrder) <= 1) {
    return prefs;
  }

  const nextMain = prefs.mainOrder.filter((id) => id !== tabId);
  if (!nextMain.includes(LAINNYA_GROUP_SLOT_ID)) {
    nextMain.push(LAINNYA_GROUP_SLOT_ID);
  }

  const nextLainnya: NavTabId[] = [...prefs.lainnyaOrder];
  if (typeof targetLainnyaIndex === "number" && Number.isFinite(targetLainnyaIndex)) {
    const clamped = Math.max(0, Math.min(nextLainnya.length, Math.floor(targetLainnyaIndex)));
    nextLainnya.splice(clamped, 0, tabId);
  } else {
    nextLainnya.push(tabId);
  }

  return {
    ...prefs,
    mainOrder: nextMain,
    lainnyaOrder: nextLainnya,
  };
}

// ─── Conflict & Out-of-Order Sync Resolution ───────────────────────────────────

/**
 * Menentukan apakah data dari server lebih baru / patut menggantikan state lokal.
 * Mencegah penimpaan preferensi oleh respons jaringan yang terlambat selesai.
 */
export function shouldAcceptRemotePreferences(
  localPrefs: NavigationPreferencesV1 | null,
  remotePrefs: NavigationPreferencesV1,
  minAcceptedLocalRevision = 0
): boolean {
  if (remotePrefs.revision < minAcceptedLocalRevision) {
    // Jika timestamp server ternyata jauh lebih baru dari perangkat lain (mis. perangkat B menyimpan revisi mandiri),
    // bandingkan juga updatedAt agar sinkronisasi lintas perangkat tetap berjalan akurat.
    if (localPrefs) {
      const localMs = Date.parse(localPrefs.updatedAt) || 0;
      const remoteMs = Date.parse(remotePrefs.updatedAt) || 0;
      return remoteMs > localMs;
    }
    return false;
  }

  if (!localPrefs) return true;
  if (localPrefs.revision === 0 && (Date.parse(localPrefs.updatedAt) || 0) === 0) {
    return true;
  }

  const localMs = Date.parse(localPrefs.updatedAt) || 0;
  const remoteMs = Date.parse(remotePrefs.updatedAt) || 0;

  if (remoteMs !== localMs) {
    return remoteMs > localMs;
  }

  return remotePrefs.revision >= localPrefs.revision;
}

// ─── Per-User LocalStorage Isolation Helpers ───────────────────────────────────

export function getNavPrefsLocalStorageKey(userId: string): string {
  const cleanId = userId.trim();
  if (!cleanId) {
    throw new Error("userId wajib diisi untuk akses penyimpanan preferensi navigasi.");
  }
  return `usick-nav-prefs-v1:${cleanId}`;
}

export function loadLocalNavigationPreferences(
  userId: string | null | undefined,
  storage?: Pick<Storage, "getItem"> | null
): NavigationPreferencesV1 | null {
  if (!userId || !userId.trim()) return null;
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.localStorage
        : null;
  if (!store) return null;

  try {
    const raw = store.getItem(getNavPrefsLocalStorageKey(userId));
    if (!raw) return null;
    return sanitizeNavigationPreferences(raw).preferences;
  } catch {
    return null;
  }
}

export function saveLocalNavigationPreferences(
  userId: string | null | undefined,
  prefs: NavigationPreferencesV1,
  storage?: Pick<Storage, "setItem"> | null
): boolean {
  if (!userId || !userId.trim()) return false;
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.localStorage
        : null;
  if (!store) return false;

  const validated = validateNavigationPreferencesStrict(prefs);
  if (!validated.valid) return false;

  try {
    store.setItem(
      getNavPrefsLocalStorageKey(userId),
      JSON.stringify(validated.value)
    );
    return true;
  } catch {
    return false;
  }
}

export function clearLocalNavigationPreferences(
  userId: string | null | undefined,
  storage?: Pick<Storage, "removeItem"> | null
): void {
  if (!userId || !userId.trim()) return;
  const store =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
        ? window.localStorage
        : null;
  if (!store) return;

  try {
    store.removeItem(getNavPrefsLocalStorageKey(userId));
  } catch {}
}
