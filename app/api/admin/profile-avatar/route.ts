export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminSession,
  getAdminSupabaseClient,
  getAdminAvatarConfigForUser,
} from "@/lib/adminServer";
import {
  AdminAvatarConfig,
  sanitizeAdminAvatarConfig,
} from "@/lib/adminAvatarTypes";

/**
 * GET /api/admin/profile-avatar
 * Mengambil konfigurasi foto profil admin dari database cloud tepercaya.
 * Hanya dapat diakses oleh admin yang terotentikasi.
 */
export async function GET() {
  const adminAuth = await verifyAdminSession();
  if (!adminAuth.authorized) {
    return NextResponse.json(
      { error: "Forbidden: Fitur kustomisasi foto profil hanya dapat diakses oleh Admin One Mind." },
      { status: 403 }
    );
  }

  const config = await getAdminAvatarConfigForUser(adminAuth.userId);
  return NextResponse.json({ success: true, config });
}

/**
 * POST /api/admin/profile-avatar
 * Menyimpan atau menghapus konfigurasi foto profil admin.
 * Hanya dapat dipanggil oleh admin yang sah.
 */
export async function POST(req: NextRequest) {
  const adminAuth = await verifyAdminSession();
  if (!adminAuth.authorized) {
    return NextResponse.json(
      { error: "Forbidden: Fitur kustomisasi foto profil hanya dapat diakses oleh Admin One Mind." },
      { status: 403 }
    );
  }

  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Layanan penyimpanan server belum terhubung." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sanitized = sanitizeAdminAvatarConfig(body?.config);
    const configId = `admin_avatar_${adminAuth.userId}`;

    if (!sanitized) {
      // Admin menghapus foto profil kustom (reset ke default)
      await supabase
        .from("system_maintenance")
        .upsert(
          {
            id: configId,
            is_enabled: false,
            title: "admin_avatar",
            message: null,
            updated_at: new Date().toISOString(),
            updated_by: adminAuth.email,
          },
          { onConflict: "id" }
        );

      return NextResponse.json({ success: true, config: null, message: "Foto profil admin berhasil direset." });
    }

    // Admin menyimpan konfigurasi foto profil baru
    const { error } = await supabase.from("system_maintenance").upsert(
      {
        id: configId,
        is_enabled: true,
        title: "admin_avatar",
        message: JSON.stringify(sanitized),
        updated_at: new Date().toISOString(),
        updated_by: adminAuth.email,
      },
      { onConflict: "id" }
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      config: sanitized,
      message: "Foto profil admin dan kustomisasi tampilan berhasil disimpan.",
    });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Gagal menyimpan foto profil admin", details: errorDetails },
      { status: 500 }
    );
  }
}
