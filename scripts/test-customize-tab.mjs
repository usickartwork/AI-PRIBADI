import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// ─── Shared Test Mocks for Route Handler Verification ──────────────────────────

export const mockHarness = {
  currentAuthUserId: null,
  supabaseAvailable: true,
  supabaseFailWrites: false,
  userNotesRows: [],
  clerkMetadataByUser: new Map(),
  reset() {
    this.currentAuthUserId = null;
    this.supabaseAvailable = true;
    this.supabaseFailWrites = false;
    this.userNotesRows = [];
    this.clerkMetadataByUser.clear();
  },
};

globalThis.__CUSTOMIZE_TAB_TEST_HARNESS__ = mockHarness;

const MOCK_CLERK_SOURCE = `
const harness = globalThis.__CUSTOMIZE_TAB_TEST_HARNESS__;
export async function auth() {
  return { userId: harness.currentAuthUserId };
}
export async function clerkClient() {
  return {
    users: {
      async getUser(userId) {
        return {
          id: userId,
          privateMetadata: harness.clerkMetadataByUser.get(userId) || {},
        };
      },
      async updateUserMetadata(userId, payload) {
        const prev = harness.clerkMetadataByUser.get(userId) || {};
        harness.clerkMetadataByUser.set(userId, {
          ...prev,
          ...(payload?.privateMetadata || {}),
        });
      },
    },
  };
}
`;

const MOCK_NOTES_SERVER_SOURCE = `
const harness = globalThis.__CUSTOMIZE_TAB_TEST_HARNESS__;
export function getNotesAdmin() {
  if (!harness.supabaseAvailable) return null;
  return {
    from(table) {
      if (table !== "user_notes") throw new Error("Unexpected table: " + table);
      return {
        select() {
          const filters = {};
          const builder = {
            eq(col, val) {
              filters[col] = val;
              return builder;
            },
            is(col, val) {
              filters[col] = val;
              return builder;
            },
            order() {
              return builder;
            },
            async limit(n) {
              const matched = harness.userNotesRows
                .filter((r) => {
                  for (const [k, v] of Object.entries(filters)) {
                    if ((r[k] ?? null) !== v) return false;
                  }
                  return true;
                })
                .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
                .slice(0, n);
              return { data: matched, error: null };
            },
          };
          return builder;
        },
        insert(rows) {
          if (harness.supabaseFailWrites) {
            return Promise.resolve({ error: { message: "Simulated write error" } });
          }
          for (const row of rows) {
            harness.userNotesRows.push({ ...row });
          }
          return Promise.resolve({ error: null });
        },
        update(patch) {
          const filters = {};
          const builder = {
            eq(col, val) {
              filters[col] = val;
              if (Object.keys(filters).length >= 2) {
                if (harness.supabaseFailWrites) {
                  return Promise.resolve({ error: { message: "Simulated update error" } });
                }
                for (const row of harness.userNotesRows) {
                  if (row.id === filters.id && row.user_id === filters.user_id) {
                    Object.assign(row, patch);
                  }
                }
                return Promise.resolve({ error: null });
              }
              return builder;
            },
          };
          return builder;
        },
      };
    },
  };
}
`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@clerk/nextjs/server") {
      return { url: "mock:clerk-server", shortCircuit: true };
    }
    if (specifier === "@/lib/notesServer") {
      return { url: "mock:notes-server", shortCircuit: true };
    }
    if (specifier === "next/server") {
      return nextResolve(
        pathToFileURL(path.join(repoRoot, "node_modules/next/server.js")).href,
        context
      );
    }
    if (specifier.startsWith("@/")) {
      const targetPath = path.join(repoRoot, specifier.slice(2) + ".ts");
      return { url: pathToFileURL(targetPath).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "mock:clerk-server") {
      return { format: "module", source: MOCK_CLERK_SOURCE, shortCircuit: true };
    }
    if (url === "mock:notes-server") {
      return { format: "module", source: MOCK_NOTES_SERVER_SOURCE, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const navMod = await import("../lib/navigationPrefs.ts");
const routeMod = await import("../app/api/preferences/navigation/route.ts");
const { NextRequest } = await import("next/server");

const {
  ALL_NAV_TAB_IDS,
  DEFAULT_LAINNYA_ORDER,
  DEFAULT_MAIN_ORDER,
  LAINNYA_GROUP_SLOT_ID,
  NAV_TAB_METADATA,
  areNavigationOrdersEqual,
  clearLocalNavigationPreferences,
  createDefaultNavigationPreferences,
  demoteTabToLainnya,
  getNavPrefsLocalStorageKey,
  isDefaultNavigationOrder,
  loadLocalNavigationPreferences,
  moveLainnyaTabByOffset,
  moveMainSlotByOffset,
  promoteTabFromLainnya,
  reorderLainnyaTabs,
  reorderMainSlots,
  sanitizeNavigationPreferences,
  saveLocalNavigationPreferences,
  shouldAcceptRemotePreferences,
  validateNavigationPreferencesStrict,
} = navMod;

const { GET, POST } = routeMod;

// ─── Helper: In-Memory Web Storage Mock ────────────────────────────────────────

function createMockStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

function makeNextRequest(url, options = {}) {
  return new NextRequest(url, options);
}

let passed = 0;
async function runTest(name, fn) {
  await fn();
  passed += 1;
  console.log(`  PASS [${String(passed).padStart(2, "0")}] ${name}`);
}

console.log("=== Usick One: Customize Tab Automated Verification Suite ===");

// 1. Default Order for New User
await runTest("1. Pengguna baru mendapat urutan default lengkap dan valid", () => {
  const defaults = createDefaultNavigationPreferences();
  assert.deepEqual(defaults.mainOrder, [
    "chat",
    "code",
    "schedule",
    "image",
    "messages",
    "music",
    "emergency",
    "lainnya",
  ]);
  assert.deepEqual(defaults.lainnyaOrder, ["game", "faith"]);
  assert.equal(isDefaultNavigationOrder(defaults), true);

  const check = validateNavigationPreferencesStrict(defaults);
  assert.equal(check.valid, true);
  assert.equal(ALL_NAV_TAB_IDS.length, 9);
  for (const id of ALL_NAV_TAB_IDS) {
    assert.ok(NAV_TAB_METADATA[id], `Metadata wajib ada untuk tab ${id}`);
  }
});

// 2. Reordering Main Tabs
await runTest("2. Mengubah urutan tab utama (drag reorder & tombol naik/turun)", () => {
  let prefs = createDefaultNavigationPreferences();

  // Geser Music ke paling atas lewat reorderMainSlots
  prefs = reorderMainSlots(prefs, [
    "music",
    "chat",
    "code",
    "schedule",
    "image",
    "messages",
    "emergency",
    "lainnya",
  ]);
  assert.equal(prefs.mainOrder[0], "music");
  assert.equal(validateNavigationPreferencesStrict(prefs).valid, true);
  assert.equal(isDefaultNavigationOrder(prefs), false);

  // Geser Code naik 1 tingkat lewat moveMainSlotByOffset
  prefs = moveMainSlotByOffset(prefs, "code", -1);
  assert.deepEqual(prefs.mainOrder.slice(0, 3), ["music", "code", "chat"]);

  // Batas atas tidak boleh keluar dari indeks 0
  const unchangedTop = moveMainSlotByOffset(prefs, "music", -1);
  assert.deepEqual(unchangedTop.mainOrder, prefs.mainOrder);
});

// 3. Promoting Game & Faith out of Lainnya + Empty Lainnya Behavior
await runTest("3. Memindahkan Game & Faith ke Tab Utama dan menyembunyikan Lainnya saat kosong", () => {
  let prefs = createDefaultNavigationPreferences();

  // Pindahkan Game keluar dari Lainnya ke Panel Utama
  prefs = promoteTabFromLainnya(prefs, "game");
  assert.equal(prefs.mainOrder.includes("game"), true);
  assert.deepEqual(prefs.lainnyaOrder, ["faith"]);
  assert.equal(validateNavigationPreferencesStrict(prefs).valid, true);

  // Pindahkan Faith keluar dari Lainnya ke Panel Utama -> Lainnya kosong
  prefs = promoteTabFromLainnya(prefs, "faith");
  assert.equal(prefs.mainOrder.includes("faith"), true);
  assert.deepEqual(prefs.lainnyaOrder, []);
  // Marker posisi "lainnya" tetap tersimpan dengan aman di mainOrder
  assert.equal(prefs.mainOrder.includes(LAINNYA_GROUP_SLOT_ID), true);
  assert.equal(validateNavigationPreferencesStrict(prefs).valid, true);
});

// 4. Demoting Game & Faith back to Lainnya + Reordering inside Lainnya
await runTest("4. Memindahkan Game & Faith kembali ke Lainnya dan mengubah urutan di dalam Lainnya", () => {
  let prefs = createDefaultNavigationPreferences();
  prefs = promoteTabFromLainnya(prefs, "game");
  prefs = promoteTabFromLainnya(prefs, "faith");

  // Kembalikan Faith terlebih dahulu lalu Game -> urutan Lainnya menjadi ["faith", "game"]
  prefs = demoteTabToLainnya(prefs, "faith");
  prefs = demoteTabToLainnya(prefs, "game");
  assert.deepEqual(prefs.lainnyaOrder, ["faith", "game"]);
  assert.equal(prefs.mainOrder.includes("faith"), false);
  assert.equal(prefs.mainOrder.includes("game"), false);
  assert.equal(validateNavigationPreferencesStrict(prefs).valid, true);

  // Ubah urutan di dalam Lainnya lewat tombol panah menjadi ["game", "faith"]
  prefs = moveLainnyaTabByOffset(prefs, "game", -1);
  assert.deepEqual(prefs.lainnyaOrder, ["game", "faith"]);

  // Ubah urutan lewat drag reorder menjadi ["faith", "game"]
  prefs = reorderLainnyaTabs(prefs, ["faith", "game"]);
  assert.deepEqual(prefs.lainnyaOrder, ["faith", "game"]);
});

// 5. Repositioning Group Lainnya Relative to Main Tabs
await runTest("5. Mengubah posisi grup Lainnya terhadap tab utama", () => {
  let prefs = createDefaultNavigationPreferences();

  // Pindahkan grup Lainnya ke urutan ke-2 (tepat setelah Chat)
  prefs = reorderMainSlots(prefs, [
    "chat",
    "lainnya",
    "code",
    "schedule",
    "image",
    "messages",
    "music",
    "emergency",
  ]);
  assert.equal(prefs.mainOrder.indexOf("lainnya"), 1);
  assert.equal(validateNavigationPreferencesStrict(prefs).valid, true);

  // Geser Lainnya ke posisi paling atas (indeks 0)
  prefs = moveMainSlotByOffset(prefs, "lainnya", -1);
  assert.equal(prefs.mainOrder[0], "lainnya");
  assert.equal(validateNavigationPreferencesStrict(prefs).valid, true);
});

// 6. Draft Cancel & Reset Semantics
await runTest("6. Membatalkan perubahan draf (Batal) & mengembalikan ke default (Reset)", () => {
  const savedSnapshot = reorderMainSlots(createDefaultNavigationPreferences(), [
    "code",
    "chat",
    "schedule",
    "image",
    "messages",
    "music",
    "emergency",
    "lainnya",
  ]);

  // Pengguna mengubah draf namun menekan Batal -> kembali ke savedSnapshot tanpa menyimpan
  let draft = promoteTabFromLainnya(savedSnapshot, "faith");
  assert.equal(areNavigationOrdersEqual(draft, savedSnapshot), false);
  draft = savedSnapshot; // simulasi aksi Batal
  assert.equal(areNavigationOrdersEqual(draft, savedSnapshot), true);

  // Reset mengembalikan tepat ke DEFAULT_MAIN_ORDER & DEFAULT_LAINNYA_ORDER
  const resetState = createDefaultNavigationPreferences(new Date().toISOString(), 2);
  assert.deepEqual(resetState.mainOrder, [...DEFAULT_MAIN_ORDER]);
  assert.deepEqual(resetState.lainnyaOrder, [...DEFAULT_LAINNYA_ORDER]);
  assert.equal(isDefaultNavigationOrder(resetState), true);
});

// 7. Per-User LocalStorage Isolation, Refresh, Logout & Re-login
await runTest("7. Isolasi localStorage per akun (User A vs User B), refresh & logout", () => {
  const storage = createMockStorage();

  const prefsUserA = promoteTabFromLainnya(
    reorderMainSlots(createDefaultNavigationPreferences("2026-10-25T00:00:00.000Z", 3), [
      "music",
      "chat",
      "code",
      "schedule",
      "image",
      "messages",
      "emergency",
      "lainnya",
    ]),
    "game"
  );

  assert.equal(saveLocalNavigationPreferences("user_A", prefsUserA, storage), true);
  assert.notEqual(
    getNavPrefsLocalStorageKey("user_A"),
    getNavPrefsLocalStorageKey("user_B")
  );

  // User B login di browser yang sama -> cache User B kosong (tidak bocor dari User A)
  assert.equal(loadLocalNavigationPreferences("user_B", storage), null);
  assert.equal(loadLocalNavigationPreferences(null, storage), null);

  // Refresh / login kembali sebagai User A -> konfigurasi User A tetap utuh
  const reloadedA = loadLocalNavigationPreferences("user_A", storage);
  assert.ok(reloadedA);
  assert.deepEqual(reloadedA.mainOrder, prefsUserA.mainOrder);
  assert.deepEqual(reloadedA.lainnyaOrder, prefsUserA.lainnyaOrder);

  // Hapus akun User A -> hanya key User A yang dihapus
  saveLocalNavigationPreferences(
    "user_B",
    createDefaultNavigationPreferences("2026-10-25T00:05:00.000Z", 1),
    storage
  );
  clearLocalNavigationPreferences("user_A", storage);
  assert.equal(loadLocalNavigationPreferences("user_A", storage), null);
  assert.ok(loadLocalNavigationPreferences("user_B", storage));
});

// 8. Corrupted, Incomplete, Duplicate, Foreign ID & Legacy Schema Recovery
await runTest("8. Pemulihan aman dari data preferensi rusak, duplikat, ID asing, atau skema lama", () => {
  // a) JSON rusak
  const fromBadJson = sanitizeNavigationPreferences("{corrupted-json!!!");
  assert.equal(fromBadJson.repaired, true);
  assert.equal(isDefaultNavigationOrder(fromBadJson.preferences), true);

  // b) Tab hilang, tab duplikat, dan ID asing berbahaya
  const messyPayload = {
    version: 1,
    mainOrder: ["music", "music", "foreign_hack_tab", "lainnya", "lainnya"],
    lainnyaOrder: ["faith", "chat", "unknown_tab"],
    revision: 4,
    updatedAt: "2026-10-25T00:10:00.000Z",
  };
  assert.equal(validateNavigationPreferencesStrict(messyPayload).valid, false);

  const sanitized = sanitizeNavigationPreferences(messyPayload);
  assert.equal(sanitized.repaired, true);
  // Hasil sanitasi wajib 100% lolos validasi ketat tanpa duplikasi atau tab hilang,
  // dan "chat" yang ditempatkan di lainnyaOrder tetap dipertahankan di lainnyaOrder!
  const postCheck = validateNavigationPreferencesStrict(sanitized.preferences);
  assert.equal(postCheck.valid, true);
  assert.equal(sanitized.preferences.mainOrder[0], "music");
  assert.equal(sanitized.preferences.lainnyaOrder.includes("chat"), true);
  assert.equal(sanitized.preferences.mainOrder.includes("chat"), false);

  // b2) Jika payload rusak menaruh SEMUA 9 tab di lainnyaOrder (0 tab di Panel Utama), sanitizer wajib memulihkan minimal 1 tab ke Panel Utama
  const zeroMainPayload = {
    version: 1,
    mainOrder: ["lainnya"],
    lainnyaOrder: [
      "chat",
      "code",
      "schedule",
      "image",
      "messages",
      "music",
      "emergency",
      "game",
      "faith",
    ],
    revision: 2,
    updatedAt: "2026-10-25T00:12:00.000Z",
  };
  assert.equal(validateNavigationPreferencesStrict(zeroMainPayload).valid, false);
  const repairedZeroMain = sanitizeNavigationPreferences(zeroMainPayload);
  assert.equal(repairedZeroMain.repaired, true);
  assert.equal(validateNavigationPreferencesStrict(repairedZeroMain.preferences).valid, true);
  assert.equal(repairedZeroMain.preferences.mainOrder[0], "chat");

  // c) Skema lama hipotetis v0 ({ tabs: ["chats", "code", "more"], overflow: ["faith"] })
  const legacyV0Bottom = {
    tabs: ["chats", "code", "more"],
    overflow: ["faith"],
  };
  const migratedBottom = sanitizeNavigationPreferences(legacyV0Bottom);
  assert.equal(migratedBottom.repaired, true);
  assert.equal(validateNavigationPreferencesStrict(migratedBottom.preferences).valid, true);
  assert.equal(migratedBottom.preferences.mainOrder[0], "chat");
  assert.equal(migratedBottom.preferences.mainOrder.at(-1), "lainnya");
  assert.deepEqual(migratedBottom.preferences.lainnyaOrder, ["faith", "game"]);

  // d) Skema lama dengan "more" sengaja diletakkan di paling atas
  const legacyV0Top = {
    tabs: ["more", "chats", "code"],
    overflow: ["faith"],
  };
  const migratedTop = sanitizeNavigationPreferences(legacyV0Top);
  assert.equal(validateNavigationPreferencesStrict(migratedTop.preferences).valid, true);
  assert.equal(migratedTop.preferences.mainOrder[0], "lainnya");
  assert.equal(migratedTop.preferences.mainOrder[1], "chat");
});

// 9. Out-of-Order & Cross-Device Conflict Resolution
await runTest("9. Resolusi konflik sinkronisasi lintas perangkat & respons out-of-order", () => {
  const localNewer = {
    ...createDefaultNavigationPreferences("2026-10-25T01:00:00.000Z", 5),
    mainOrder: [
      "code",
      "chat",
      "schedule",
      "image",
      "messages",
      "music",
      "emergency",
      "lainnya",
    ],
  };
  const staleRemote = createDefaultNavigationPreferences("2026-10-25T00:50:00.000Z", 3);
  assert.equal(shouldAcceptRemotePreferences(localNewer, staleRemote, 5), false);

  const crossDeviceNewer = {
    ...createDefaultNavigationPreferences("2026-10-25T01:05:00.000Z", 6),
    lainnyaOrder: ["faith", "game"],
  };
  assert.equal(shouldAcceptRemotePreferences(localNewer, crossDeviceNewer, 5), true);
});

// 10. Server Route Handler Authorization (401 Unauthenticated & 403 Cross-Account)
await runTest("10. Endpoint API menolak sesi tanpa login (401) dan akses lintas akun (403)", async () => {
  mockHarness.reset();

  // Unauthenticated GET -> 401
  const unauthGetRes = await GET(makeNextRequest("http://localhost:3000/api/preferences/navigation"));
  assert.equal(unauthGetRes.status, 401);

  // Unauthenticated POST -> 401
  const unauthPostRes = await POST(
    makeNextRequest("http://localhost:3000/api/preferences/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: createDefaultNavigationPreferences() }),
    })
  );
  assert.equal(unauthPostRes.status, 401);

  // Authenticated sebagai user_A mencoba membaca preferensi user_B -> 403
  mockHarness.currentAuthUserId = "user_A";
  const crossReadRes = await GET(
    makeNextRequest("http://localhost:3000/api/preferences/navigation?userId=user_B")
  );
  assert.equal(crossReadRes.status, 403);

  // Authenticated sebagai user_A mencoba memodifikasi preferensi user_B -> 403
  const crossWriteRes = await POST(
    makeNextRequest("http://localhost:3000/api/preferences/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: "user_B",
        preferences: createDefaultNavigationPreferences(),
      }),
    })
  );
  assert.equal(crossWriteRes.status, 403);
});

// 11. Server Route Handler Validation Rejects Malformed Payloads (400)
await runTest("11. Endpoint API menolak payload tidak valid, tab duplikat, atau tab hilang (400)", async () => {
  mockHarness.reset();
  mockHarness.currentAuthUserId = "user_A";

  // Tab wajib hilang & ID asing disuntikkan
  const badRes = await POST(
    makeNextRequest("http://localhost:3000/api/preferences/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences: {
          version: 1,
          mainOrder: ["chat", "evil_tab", "lainnya"],
          lainnyaOrder: ["game"],
          revision: 1,
          updatedAt: new Date().toISOString(),
        },
      }),
    })
  );
  assert.equal(badRes.status, 400);

  // Semua 9 tab dimasukkan ke lainnyaOrder hingga Panel Utama kosong (0 tab) -> ditolak 400
  const emptyMainRes = await POST(
    makeNextRequest("http://localhost:3000/api/preferences/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences: {
          version: 1,
          mainOrder: ["lainnya"],
          lainnyaOrder: [
            "chat",
            "code",
            "schedule",
            "image",
            "messages",
            "music",
            "emergency",
            "game",
            "faith",
          ],
          revision: 1,
          updatedAt: new Date().toISOString(),
        },
      }),
    })
  );
  assert.equal(emptyMainRes.status, 400);
});

// 11b. Arbitrary Tabs Inside Lainnya (Faith & Game Out, Music/Schedule/Emergency/Chat In)
await runTest("11b. Mengeluarkan Faith & Game dari Lainnya dan mengisi Lainnya dengan tab lain (Music, Schedule, Emergency, Chat, dll.)", async () => {
  mockHarness.reset();
  mockHarness.currentAuthUserId = "user_custom_lainnya";

  let prefs = createDefaultNavigationPreferences();

  // 1) Keluarkan Game & Faith dari Lainnya ke posisi spesifik di Panel Utama
  prefs = promoteTabFromLainnya(prefs, "faith", 1);
  prefs = promoteTabFromLainnya(prefs, "game", 2);
  assert.deepEqual(prefs.lainnyaOrder, []);
  assert.deepEqual(prefs.mainOrder.slice(0, 3), ["chat", "faith", "game"]);

  // 2) Isi Lainnya dengan tab selain Faith & Game: Emergency, Schedule, Music, dan Image
  prefs = demoteTabToLainnya(prefs, "emergency");
  prefs = demoteTabToLainnya(prefs, "schedule", 0); // sisipkan di paling atas Lainnya
  prefs = demoteTabToLainnya(prefs, "music");
  prefs = demoteTabToLainnya(prefs, "image");
  assert.deepEqual(prefs.lainnyaOrder, ["schedule", "emergency", "music", "image"]);
  assert.equal(validateNavigationPreferencesStrict(prefs).valid, true);

  // 3) Simpan ke API /api/preferences/navigation dan muat ulang -> wajib sukses 200 & persis sama
  const postRes = await POST(
    makeNextRequest("http://localhost:3000/api/preferences/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: prefs }),
    })
  );
  assert.equal(postRes.status, 200);

  const getJson = await (
    await GET(makeNextRequest("http://localhost:3000/api/preferences/navigation"))
  ).json();
  assert.equal(getJson.success, true);
  assert.deepEqual(getJson.preferences.lainnyaOrder, [
    "schedule",
    "emergency",
    "music",
    "image",
  ]);
  assert.equal(getJson.preferences.mainOrder.includes("faith"), true);
  assert.equal(getJson.preferences.mainOrder.includes("game"), true);

  // 4) Uji batas keamanan client: jika tinggal 1 tab di Panel Utama, demoteTabToLainnya menolak mengosongkan Panel Utama
  let extreme = prefs;
  for (const id of [...extreme.mainOrder]) {
    if (id !== LAINNYA_GROUP_SLOT_ID) {
      extreme = demoteTabToLainnya(extreme, id);
    }
  }
  const remainingMainTabs = extreme.mainOrder.filter((id) => id !== LAINNYA_GROUP_SLOT_ID);
  assert.equal(remainingMainTabs.length, 1);
  assert.equal(validateNavigationPreferencesStrict(extreme).valid, true);
});

// 12. Full Cloud Persistence, Multi-Account Isolation, Fallback, Out-of-Order & Safe Reset
await runTest("12. Siklus penuh Cloud Sync (Supabase + Clerk Backup), isolasi akun, konflik & Reset aman", async () => {
  mockHarness.reset();

  // Tambahkan catatan reguler milik user_A di tabel user_notes untuk memastikan tidak pernah tersentuh
  mockHarness.userNotesRows.push({
    id: "regular-note-1",
    user_id: "user_A",
    title: "Catatan Pribadi Penting",
    content: "Isi catatan",
    is_pinned: true,
    created_at: "2026-10-24T10:00:00.000Z",
    updated_at: "2026-10-24T10:00:00.000Z",
    deleted_at: null,
  });

  // 1) User A baru pertama kali memuat -> default & hasCloudRecord: false
  mockHarness.currentAuthUserId = "user_A";
  const initialGet = await (
    await GET(makeNextRequest("http://localhost:3000/api/preferences/navigation"))
  ).json();
  assert.equal(initialGet.success, true);
  assert.equal(initialGet.hasCloudRecord, false);
  assert.equal(isDefaultNavigationOrder(initialGet.preferences), true);

  // 2) User A menyimpan kustomisasi: Faith & Game di Panel Utama, Lainnya di urutan ke-2
  let customA = promoteTabFromLainnya(createDefaultNavigationPreferences(), "game");
  customA = promoteTabFromLainnya(customA, "faith");
  customA = reorderMainSlots(customA, [
    "chat",
    "faith",
    "game",
    "lainnya",
    "code",
    "schedule",
    "image",
    "messages",
    "music",
    "emergency",
  ]);
  customA.revision = 3;

  const saveRes = await POST(
    makeNextRequest("http://localhost:3000/api/preferences/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: customA }),
    })
  );
  assert.equal(saveRes.status, 200);
  const saveJson = await saveRes.json();
  assert.equal(saveJson.success, true);
  assert.equal(saveJson.savedToSupabase, true);
  assert.equal(saveJson.savedToClerk, true);
  assert.deepEqual(saveJson.preferences.mainOrder, customA.mainOrder);
  assert.deepEqual(saveJson.preferences.lainnyaOrder, []);

  // 3) User B login -> tidak terpengaruh kustomisasi User A sama sekali
  mockHarness.currentAuthUserId = "user_B";
  const userBGet = await (
    await GET(makeNextRequest("http://localhost:3000/api/preferences/navigation"))
  ).json();
  assert.equal(userBGet.hasCloudRecord, false);
  assert.equal(isDefaultNavigationOrder(userBGet.preferences), true);

  // 4) User A login di perangkat lain -> memperoleh kustomisasi dari Supabase
  mockHarness.currentAuthUserId = "user_A";
  const device2Get = await (
    await GET(makeNextRequest("http://localhost:3000/api/preferences/navigation"))
  ).json();
  assert.equal(device2Get.hasCloudRecord, true);
  assert.equal(device2Get.source, "supabase");
  assert.deepEqual(device2Get.preferences.mainOrder, customA.mainOrder);

  // 5) Simulasi request out-of-order (revisi lama = 1 datang terlambat) -> diabaikan tanpa merusak revisi 3
  const staleCandidate = {
    ...createDefaultNavigationPreferences("2020-01-01T00:00:00.000Z", 1),
    mainOrder: [
      "emergency",
      "chat",
      "code",
      "schedule",
      "image",
      "messages",
      "music",
      "lainnya",
    ],
  };
  const staleRes = await (
    await POST(
      makeNextRequest("http://localhost:3000/api/preferences/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: staleCandidate }),
      })
    )
  ).json();
  assert.equal(staleRes.success, true);
  assert.equal(staleRes.staleIgnored, true);
  assert.deepEqual(staleRes.preferences.mainOrder, customA.mainOrder);

  // 6) Simulasi Supabase sedang tidak tersedia -> fallback otomatis ke Clerk privateMetadata
  mockHarness.supabaseAvailable = false;
  const clerkFallbackGet = await (
    await GET(makeNextRequest("http://localhost:3000/api/preferences/navigation"))
  ).json();
  assert.equal(clerkFallbackGet.hasCloudRecord, true);
  assert.equal(clerkFallbackGet.source, "clerk_metadata");
  assert.deepEqual(clerkFallbackGet.preferences.mainOrder, customA.mainOrder);
  mockHarness.supabaseAvailable = true;

  // 7) Reset ke Default (force: true) -> kembali ke default tanpa menyentuh catatan reguler User A
  const resetPayload = createDefaultNavigationPreferences(new Date().toISOString(), 4);
  const resetRes = await (
    await POST(
      makeNextRequest("http://localhost:3000/api/preferences/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: resetPayload, force: true }),
      })
    )
  ).json();
  assert.equal(resetRes.success, true);
  assert.equal(isDefaultNavigationOrder(resetRes.preferences), true);

  const regularNoteStillIntact = mockHarness.userNotesRows.find(
    (r) => r.id === "regular-note-1" && r.user_id === "user_A"
  );
  assert.ok(regularNoteStillIntact);
  assert.equal(regularNoteStillIntact.title, "Catatan Pribadi Penting");
});

console.log(`\nALL ${passed} CUSTOMIZE TAB TESTS PASSED SUCCESSFULLY.`);
