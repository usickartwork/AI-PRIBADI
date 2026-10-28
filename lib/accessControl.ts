import { getAdminSupabaseClient, verifyAdminSession } from "@/lib/adminServer";
import {
  type FeatureKey,
  FEATURE_KEYS,
  FEATURE_METADATA,
  type MaintenanceItem,
  type MaintenanceDictionary,
} from "@/lib/maintenanceTypes";

export {
  type FeatureKey,
  FEATURE_KEYS,
  FEATURE_METADATA,
  type MaintenanceItem,
  type MaintenanceDictionary,
};

interface UserHoldStatus {
  isHeld: boolean;
  expiresAt?: string | null;
  reason?: string | null;
  heldAt?: string | null;
  heldBy?: string | null;
}

// In-memory cache dengan TTL 10 detik agar tidak membebani database pada setiap request
let cachedMaintenanceDict: { data: MaintenanceDictionary; expiresAt: number } | null = null;

export function invalidateMaintenanceCache() {
  cachedMaintenanceDict = null;
}

function createDefaultMaintenanceDict(): MaintenanceDictionary {
  const features = {} as Record<FeatureKey, MaintenanceItem>;
  for (const k of FEATURE_KEYS) {
    features[k] = {
      isEnabled: false,
      title: `${FEATURE_METADATA[k].name} Sedang Dalam Pemeliharaan`,
      message: FEATURE_METADATA[k].defaultMessage,
      estimatedEnd: null,
    };
  }
  return {
    global: {
      isEnabled: false,
      title: "One Mind sedang dalam pemeliharaan",
      message: "Kami sedang melakukan pemeliharaan sistem untuk meningkatkan layanan. Silakan coba kembali nanti.",
      estimatedEnd: null,
    },
    features,
  };
}

/**
 * Mengambil seluruh konfigurasi Maintenance (Global + 10 Fitur) dari Supabase dalam 1 query ringan
 */
export async function getAllMaintenanceStatus(): Promise<MaintenanceDictionary> {
  const now = Date.now();
  if (cachedMaintenanceDict && cachedMaintenanceDict.expiresAt > now) {
    return cachedMaintenanceDict.data;
  }

  const supabaseAdmin = getAdminSupabaseClient();
  const defaultDict = createDefaultMaintenanceDict();

  if (!supabaseAdmin) {
    return defaultDict;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("system_maintenance")
      .select("id, is_enabled, title, message, estimated_end, updated_at, updated_by");

    if (error || !data) {
      console.warn("[accessControl] Gagal membaca tabel system_maintenance:", error);
      return defaultDict;
    }

    const dict = createDefaultMaintenanceDict();

    for (const row of data) {
      const item: MaintenanceItem = {
        isEnabled: Boolean(row.is_enabled),
        title: row.title || null,
        message: row.message || null,
        estimatedEnd: row.estimated_end || null,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
      };

      if (row.id === "global_config" || row.id === "global") {
        dict.global = {
          ...dict.global,
          ...item,
          title: item.title || dict.global.title,
          message: item.message || dict.global.message,
        };
      } else if (FEATURE_KEYS.includes(row.id as FeatureKey)) {
        const k = row.id as FeatureKey;
        dict.features[k] = {
          ...dict.features[k],
          ...item,
          title: item.title || dict.features[k].title,
          message: item.message || dict.features[k].message,
        };
      }
    }

    cachedMaintenanceDict = {
      data: dict,
      expiresAt: now + 10_000,
    };

    return dict;
  } catch (err) {
    console.warn("[accessControl] Exception membaca status maintenance:", err);
    return defaultDict;
  }
}

/**
 * Mengambil status Maintenance Mode global (helper kompatibilitas lama)
 */
export async function getMaintenanceStatus(): Promise<MaintenanceItem> {
  const dict = await getAllMaintenanceStatus();
  return dict.global;
}

/**
 * Mengambil status penguncian (Hold) pengguna tertentu berdasarkan Clerk User ID
 */
export async function getUserHoldStatus(userId: string): Promise<UserHoldStatus> {
  if (!userId || userId === "guest") {
    return { isHeld: false };
  }

  const supabaseAdmin = getAdminSupabaseClient();
  if (!supabaseAdmin) {
    return { isHeld: false };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user_holds")
      .select("is_held, expires_at, reason, held_at, held_by")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data || !data.is_held) {
      return { isHeld: false };
    }

    // Periksa apakah masa hold sudah kedaluwarsa secara alami
    if (data.expires_at) {
      const expirationDate = new Date(data.expires_at);
      if (expirationDate.getTime() <= Date.now()) {
        // Otomatis tandai tidak aktif secara asinkron (background)
        void supabaseAdmin
          .from("user_holds")
          .update({ is_held: false, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        return { isHeld: false };
      }
    }

    return {
      isHeld: true,
      expiresAt: data.expires_at,
      reason: data.reason,
      heldAt: data.held_at,
      heldBy: data.held_by,
    };
  } catch (err) {
    console.warn("[accessControl] Gagal membaca status hold pengguna:", err);
    return { isHeld: false };
  }
}

/**
 * Validasi hak akses menyeluruh untuk halaman & API:
 * 1. Mengecek Sesi Admin: Admin terverifikasi selalu diizinkan (bypass).
 * 2. Mengecek Maintenance Mode Global: Jika aktif, semua non-admin ditolak (HTTP 503).
 * 3. Mengecek User Hold: Jika akun di-hold, ditolak (HTTP 403).
 * 4. Mengecek Maintenance Per Fitur (jika parameter feature disertakan): Jika aktif, operasi fitur ditolak (HTTP 503).
 */
export async function validateUserAccess(options?: {
  userId?: string;
  feature?: FeatureKey;
  allowAdminBypass?: boolean;
}): Promise<{
  allowed: boolean;
  status: number;
  reason?: "maintenance" | "feature_maintenance" | "account_locked";
  feature?: FeatureKey;
  error?: string;
  message?: string | null;
  estimatedEnd?: string | null;
  isAdmin?: boolean;
}> {
  const allowAdminBypass = options?.allowAdminBypass ?? true;
  const targetUserId = options?.userId;
  const targetFeature = options?.feature;

  // 1. Periksa apakah pemanggil adalah admin sah (jika bypass diizinkan)
  let isAdmin = false;
  if (allowAdminBypass) {
    try {
      const authResult = await verifyAdminSession();
      if (authResult.authorized) {
        isAdmin = true;
      }
    } catch {
      isAdmin = false;
    }
  }

  // Admin sah selalu dikecualikan dari segala batasan maintenance
  if (isAdmin) {
    return { allowed: true, status: 200, isAdmin: true };
  }

  // 2. Periksa status Maintenance
  const dict = await getAllMaintenanceStatus();

  // A. Global Maintenance Aktif
  if (dict.global.isEnabled) {
    return {
      allowed: false,
      status: 503,
      reason: "maintenance",
      error: dict.global.title || "One Mind sedang dalam pemeliharaan",
      message: dict.global.message,
      estimatedEnd: dict.global.estimatedEnd,
      isAdmin: false,
    };
  }

  // B. User Hold (Penguncian Akun Individu)
  if (targetUserId && targetUserId !== "guest") {
    const holdStatus = await getUserHoldStatus(targetUserId);
    if (holdStatus.isHeld) {
      return {
        allowed: false,
        status: 403,
        reason: "account_locked",
        error: "Akun Dikunci: Akses akun Anda untuk sementara dibatasi oleh developer.",
        message: holdStatus.reason || null,
        isAdmin: false,
      };
    }
  }

  // C. Per-Feature Maintenance Aktif
  if (targetFeature && dict.features[targetFeature]?.isEnabled) {
    const feat = dict.features[targetFeature];
    const meta = FEATURE_METADATA[targetFeature];
    return {
      allowed: false,
      status: 503,
      reason: "feature_maintenance",
      feature: targetFeature,
      error: feat.title || `${meta.name} Sedang Dalam Pemeliharaan`,
      message: feat.message || meta.defaultMessage,
      estimatedEnd: feat.estimatedEnd,
      isAdmin: false,
    };
  }

  return { allowed: true, status: 200, isAdmin: false };
}
