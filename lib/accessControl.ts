import { getAdminSupabaseClient, verifyAdminSession } from "@/lib/adminServer";

interface MaintenanceConfig {
  isEnabled: boolean;
  message?: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

interface UserHoldStatus {
  isHeld: boolean;
  expiresAt?: string | null;
  reason?: string | null;
  heldAt?: string | null;
  heldBy?: string | null;
}

// In-memory cache dengan TTL 10 detik agar tidak membebani database pada setiap request
let cachedMaintenance: { data: MaintenanceConfig; expiresAt: number } | null = null;

export function invalidateMaintenanceCache() {
  cachedMaintenance = null;
}

/**
 * Mengambil status Maintenance Mode dari basis data Supabase
 */
export async function getMaintenanceStatus(): Promise<MaintenanceConfig> {
  const now = Date.now();
  if (cachedMaintenance && cachedMaintenance.expiresAt > now) {
    return cachedMaintenance.data;
  }

  const supabaseAdmin = getAdminSupabaseClient();
  if (!supabaseAdmin) {
    return { isEnabled: false };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("system_maintenance")
      .select("is_enabled, message, updated_at, updated_by")
      .eq("id", "global_config")
      .maybeSingle();

    if (error || !data) {
      return { isEnabled: false };
    }

    const config: MaintenanceConfig = {
      isEnabled: Boolean(data.is_enabled),
      message: data.message || null,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };

    // Cache selama 10 detik
    cachedMaintenance = {
      data: config,
      expiresAt: now + 10_000,
    };

    return config;
  } catch (err) {
    console.warn("[accessControl] Gagal membaca status maintenance:", err);
    return { isEnabled: false };
  }
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
 * 1. Mengecek Maintenance Mode:
 *    - Jika aktif dan user BUKAN admin terverifikasi: akses DITOLAK (maintenance).
 *    - Admin terverifikasi diizinkan bypass maintenance.
 * 2. Mengecek User Hold:
 *    - Jika user sedang di-hold: akses DITOLAK (account_locked).
 */
export async function validateUserAccess(options?: {
  userId?: string;
  allowAdminBypass?: boolean;
}): Promise<{
  allowed: boolean;
  status: number;
  reason?: "maintenance" | "account_locked";
  error?: string;
  isAdmin?: boolean;
}> {
  const allowAdminBypass = options?.allowAdminBypass ?? true;
  const targetUserId = options?.userId;

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

  // Admin sah selalu dikecualikan dari Maintenance Mode
  if (isAdmin) {
    return { allowed: true, status: 200, isAdmin: true };
  }

  // 2. Periksa status Maintenance Mode global
  const maintenance = await getMaintenanceStatus();
  if (maintenance.isEnabled) {
    return {
      allowed: false,
      status: 503,
      reason: "maintenance",
      error: "One Mind sedang dalam pemeliharaan",
      isAdmin: false,
    };
  }

  // 3. Periksa status User Hold (penguncian akun individu)
  if (targetUserId && targetUserId !== "guest") {
    const holdStatus = await getUserHoldStatus(targetUserId);
    if (holdStatus.isHeld) {
      return {
        allowed: false,
        status: 403,
        reason: "account_locked",
        error: "Akun Dikunci: Akses akun Anda untuk sementara dibatasi oleh developer.",
        isAdmin: false,
      };
    }
  }

  return { allowed: true, status: 200, isAdmin: false };
}
