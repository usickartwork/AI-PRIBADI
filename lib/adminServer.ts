import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AdminAvatarConfig, sanitizeAdminAvatarConfig } from "@/lib/adminAvatarTypes";

export type AdminAuthResult =
  | {
      authorized: true;
      userId: string;
      email: string;
      verified: true;
      username?: string;
      fullName?: string;
    }
  | {
      authorized: false;
      error: string;
      status: number;
    };

/**
 * Mendapatkan Supabase client dengan hak akses service role untuk eksekusi server-side tepercaya.
 * Kunci service role TIDAK PERNAH dikirimkan ke browser atau komponen klien.
 */
export function getAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  if (!serviceRoleKey || !supabaseUrl || !isSupabaseConfigured) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Verifikasi Otorisasi Sesi Admin.
 *
 * Alur pemeriksaan ketat:
 * 1. Validasi sesi aktif dari cookie/token Clerk tepercaya via `auth()`.
 * 2. Ambil profil pengguna tepercaya dari Clerk backend API.
 * 3. Periksa status verifikasi email: HANYA email dengan verification.status === "verified" yang diakui.
 * 4. Normalisasi email (lowercase, trim).
 * 5. Periksa tabel `admin_access` via Supabase Service Role Key:
 *    - Email harus terdaftar di allowlist.
 *    - Nilai `is_active` harus bernilai true.
 *
 * Jangan pernah mempercayai parameter input dari frontend atau query string!
 */
export async function verifyAdminSession(): Promise<AdminAuthResult> {
  try {
    // 1. Verifikasi Sesi Clerk
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      return {
        authorized: false,
        error: "Unauthorized: Sesi login tidak ditemukan.",
        status: 401,
      };
    }

    // 2. Ambil Data Akun Langsung dari Clerk Server SDK
    const clerk = await clerkClient();
    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(userId);
    } catch (clerkErr) {
      console.error("[adminServer] Gagal mengambil data user dari Clerk:", clerkErr);
      return {
        authorized: false,
        error: "Unauthorized: Identitas pengguna tidak dapat diverifikasi.",
        status: 401,
      };
    }

    if (!clerkUser || !clerkUser.emailAddresses || clerkUser.emailAddresses.length === 0) {
      return {
        authorized: false,
        error: "Forbidden: Akun tidak memiliki email terdaftar.",
        status: 403,
      };
    }

    // 3. Ambil email primer akun dan pastikan berstatus terverifikasi
    const primaryEmailObj =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId) ||
      clerkUser.emailAddresses[0];

    if (!primaryEmailObj || primaryEmailObj.verification?.status !== "verified" || !primaryEmailObj.emailAddress) {
      return {
        authorized: false,
        error: "Forbidden: Email primer akun Anda belum berstatus terverifikasi di sistem.",
        status: 403,
      };
    }

    const primaryEmail = primaryEmailObj.emailAddress.trim().toLowerCase();

    // 4. Inisialisasi Supabase Service Client
    const supabaseAdmin = getAdminSupabaseClient();
    if (!supabaseAdmin) {
      console.error("[adminServer] Supabase Service Role Key tidak terkonfigurasi di server.");
      return {
        authorized: false,
        error: "Service Unavailable: Konfigurasi basis data administratif server belum lengkap.",
        status: 503,
      };
    }

    // 5. Periksa Allowlist admin_access dengan email primer terverifikasi dan is_active = true
    const { data: adminRows, error: dbError } = await supabaseAdmin
      .from("admin_access")
      .select("id, email, is_active")
      .eq("email", primaryEmail)
      .eq("is_active", true);

    if (dbError) {
      // Jika tabel belum dibuat (misal kode error 42P01 di PostgreSQL)
      if (dbError.code === "42P01") {
        console.warn("[adminServer] Tabel public.admin_access belum dibuat di Supabase.");
        return {
          authorized: false,
          error: "Service Unavailable: Tabel admin_access belum diinisialisasi di Supabase.",
          status: 503,
        };
      }
      console.error("[adminServer] Error saat memeriksa tabel admin_access:", dbError);
      return {
        authorized: false,
        error: "Internal Server Error: Gagal memeriksa otorisasi basis data.",
        status: 500,
      };
    }

    if (!adminRows || adminRows.length === 0) {
      return {
        authorized: false,
        error: "Forbidden: Akun Anda tidak memiliki izin akses Admin Usick One.",
        status: 403,
      };
    }

    const matchedAdmin = adminRows[0];
    const username =
      clerkUser.username ||
      (clerkUser.publicMetadata?.username as string) ||
      clerkUser.firstName ||
      "Admin";
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");

    return {
      authorized: true,
      userId,
      email: matchedAdmin.email,
      verified: true,
      username,
      fullName: fullName || undefined,
    };
  } catch (err: unknown) {
    console.error("[adminServer] Exception pada otorisasi admin:", err);
    return {
      authorized: false,
      error: "Internal Server Error: Terjadi kendala saat memverifikasi akses.",
      status: 500,
    };
  }
}

/**
 * Mengambil konfigurasi foto profil admin dari Supabase secara aman di server.
 */
export async function getAdminAvatarConfigForUser(userId: string): Promise<AdminAvatarConfig | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase || !userId) return null;
  try {
    const configId = `admin_avatar_${userId}`;
    const { data, error } = await supabase
      .from("system_maintenance")
      .select("is_enabled, message")
      .eq("id", configId)
      .maybeSingle();

    if (error || !data || !data.is_enabled || !data.message) {
      return null;
    }

    try {
      const parsed = JSON.parse(data.message);
      return sanitizeAdminAvatarConfig(parsed);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
