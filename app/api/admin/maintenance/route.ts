import { NextResponse } from "next/server";
import { verifyAdminSession, getAdminSupabaseClient } from "@/lib/adminServer";
import {
  getAllMaintenanceStatus,
  invalidateMaintenanceCache,
  FEATURE_KEYS,
  FEATURE_METADATA,
  FeatureKey,
} from "@/lib/accessControl";

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

    const dict = await getAllMaintenanceStatus();
    return NextResponse.json(dict);
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
    const { target = "global", enabled, title, message, estimatedEnd } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Nilai enabled bertipe boolean wajib disertakan." },
        { status: 400 }
      );
    }

    const isGlobal = target === "global" || target === "global_config";
    const isFeature = FEATURE_KEYS.includes(target as FeatureKey);

    if (!isGlobal && !isFeature) {
      return NextResponse.json(
        { error: `Target maintenance tidak valid. Pilihan: global atau salah satu dari [${FEATURE_KEYS.join(", ")}].` },
        { status: 400 }
      );
    }

    const rowId = isGlobal ? "global_config" : target;
    const nowIso = new Date().toISOString();
    const cleanTitle = typeof title === "string" && title.trim() ? title.trim().slice(0, 150) : null;
    const cleanMsg = typeof message === "string" && message.trim() ? message.trim().slice(0, 500) : null;

    let cleanEstimatedEnd: string | null = null;
    if (estimatedEnd && typeof estimatedEnd === "string" && estimatedEnd.trim()) {
      const parsedDate = new Date(estimatedEnd.trim());
      if (!isNaN(parsedDate.getTime())) {
        cleanEstimatedEnd = parsedDate.toISOString();
      }
    }

    // 3. Update public.system_maintenance
    const { error: dbError } = await supabaseAdmin
      .from("system_maintenance")
      .upsert(
        {
          id: rowId,
          is_enabled: enabled,
          title: cleanTitle,
          message: cleanMsg,
          estimated_end: cleanEstimatedEnd,
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
      const actionName = isGlobal
        ? enabled
          ? "maintenance_enable"
          : "maintenance_disable"
        : enabled
        ? `feature_maintenance_enable`
        : `feature_maintenance_disable`;

      await supabaseAdmin.from("admin_audit_logs").insert({
        action: actionName,
        target_id: rowId,
        performed_by: authResult.email,
        details: {
          target: rowId,
          enabled,
          title: cleanTitle,
          message: cleanMsg,
          estimatedEnd: cleanEstimatedEnd,
          timestamp: nowIso,
        },
      });
    } catch (auditErr) {
      console.warn("[api/admin/maintenance:POST] Audit log note:", auditErr);
    }

    const targetDisplayName = isGlobal
      ? "Global Maintenance"
      : FEATURE_METADATA[target as FeatureKey]?.name || target;

    return NextResponse.json({
      success: true,
      target: rowId,
      isEnabled: enabled,
      title: cleanTitle,
      message: cleanMsg,
      estimatedEnd: cleanEstimatedEnd,
      notification: enabled
        ? `${targetDisplayName} berhasil DIAKTIFKAN.`
        : `${targetDisplayName} berhasil DINONAKTIFKAN.`,
    });
  } catch (err: unknown) {
    console.error("[api/admin/maintenance:POST] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error saat memperbarui Maintenance Mode." },
      { status: 500 }
    );
  }
}
