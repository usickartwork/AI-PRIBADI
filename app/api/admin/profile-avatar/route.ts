export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, getAdminSupabaseClient } from "@/lib/adminServer";
import {
  AdminAvatarConfig,
  AdminAvatarShape,
  AdminAvatarBorderStyle,
  AdminAvatarFilter,
} from "@/lib/adminAvatarTypes";

function sanitizeAdminAvatarConfig(input: unknown): AdminAvatarConfig | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const rawUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : "";
  if (!rawUrl) return null;

  // Izinkan data URL base64 atau HTTPS URL
  if (!rawUrl.startsWith("data:image/") && !rawUrl.startsWith("https://") && !rawUrl.startsWith("/")) {
    return null;
  }

  const validShapes: AdminAvatarShape[] = ["circle", "squircle", "rounded"];
  const shape: AdminAvatarShape = typeof record.shape === "string" && validShapes.includes(record.shape as AdminAvatarShape)
    ? (record.shape as AdminAvatarShape)
    : "circle";

  const validBorders: AdminAvatarBorderStyle[] = ["none", "minimal", "glow", "double"];
  const borderStyle: AdminAvatarBorderStyle = typeof record.borderStyle === "string" && validBorders.includes(record.borderStyle as AdminAvatarBorderStyle)
    ? (record.borderStyle as AdminAvatarBorderStyle)
    : "minimal";

  const validFilters: AdminAvatarFilter[] = ["none", "grayscale", "contrast"];
  const filter: AdminAvatarFilter = typeof record.filter === "string" && validFilters.includes(record.filter as AdminAvatarFilter)
    ? (record.filter as AdminAvatarFilter)
    : "none";

  let zoom = typeof record.zoom === "number" && !isNaN(record.zoom) ? record.zoom : 1;
  if (zoom < 1) zoom = 1;
  if (zoom > 1.8) zoom = 1.8;

  return {
    imageUrl: rawUrl,
    shape,
    borderStyle,
    filter,
    zoom: Math.round(zoom * 100) / 100,
    updatedAt: new Date().toISOString(),
  };
}

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

  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ success: true, config: null, source: "offline_ready" });
  }

  try {
    const configId = `admin_avatar_${adminAuth.userId}`;
    const { data, error } = await supabase
      .from("system_maintenance")
      .select("is_enabled, message")
      .eq("id", configId)
      .maybeSingle();

    if (error || !data || !data.is_enabled || !data.message) {
      return NextResponse.json({ success: true, config: null });
    }

    try {
      const parsed = JSON.parse(data.message);
      const sanitized = sanitizeAdminAvatarConfig(parsed);
      return NextResponse.json({ success: true, config: sanitized });
    } catch {
      return NextResponse.json({ success: true, config: null });
    }
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Gagal memuat foto profil admin", details: errorDetails },
      { status: 500 }
    );
  }
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
