import { NextResponse } from "next/server";
import { verifyAdminSession, getAdminSupabaseClient } from "@/lib/adminServer";
import { getMaintenanceStatus, invalidateMaintenanceCache } from "@/lib/accessControl";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const config = await getMaintenanceStatus();
    return NextResponse.json(config);
  } catch (err: unknown) {
    console.error("[api/admin/maintenance:GET] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1. Verifikasi hak akses admin server-side
    const authResult = await verifyAdminSession();
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const supabaseAdmin = getAdminSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Koneksi administratif database Supabase tidak tersedia." },
        { status: 503 }
      );
    }

    // 2. Baca payload
    const body = await req.json().catch(() => ({}));
    const { enabled, message } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Nilai enabled bertipe boolean wajib disertakan." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const cleanMsg = typeof message === "string" && message.trim() ? message.trim().slice(0, 500) : null;

    // 3. Update public.system_maintenance
    const { error: dbError } = await supabaseAdmin
      .from("system_maintenance")
      .upsert(
        {
          id: "global_config",
          is_enabled: enabled,
          message: cleanMsg,
          updated_at: nowIso,
          updated_by: authResult.email,
        },
        { onConflict: "id" }
      );

    if (dbError) {
      console.error("[api/admin/maintenance:POST] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Gagal memperbarui status Maintenance Mode di basis data." },
        { status: 500 }
      );
    }

    // 4. Invalidate memory cache agar perubahan langsung berefek instan
    invalidateMaintenanceCache();

    // 5. Catat audit log administratif (non-blocking)
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        action: enabled ? "maintenance_enable" : "maintenance_disable",
        target_id: "global_config",
        performed_by: authResult.email,
        details: { enabled, message: cleanMsg, timestamp: nowIso },
      });
    } catch (auditErr) {
      console.warn("[api/admin/maintenance:POST] Audit log note:", auditErr);
    }

    return NextResponse.json({
      success: true,
      isEnabled: enabled,
      message: enabled
        ? "Maintenance Mode berhasil DIAKTIFKAN. Pengguna biasa dibatasi, admin tetap dapat mengakses."
        : "Maintenance Mode berhasil DINONAKTIFKAN. Seluruh layanan dibuka kembali untuk semua pengguna.",
    });
  } catch (err: unknown) {
    console.error("[api/admin/maintenance:POST] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error saat memperbarui Maintenance Mode." },
      { status: 500 }
    );
  }
}
