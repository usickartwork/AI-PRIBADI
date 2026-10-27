import { NextResponse } from "next/server";
import { verifyAdminSession, getAdminSupabaseClient } from "@/lib/adminServer";

export const dynamic = "force-dynamic";

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

    // 2. Baca dan validasi payload
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json(
        { error: "User ID wajib disertakan." },
        { status: 400 }
      );
    }

    // 3. Update tabel user_holds
    const nowIso = new Date().toISOString();
    const { error: dbError } = await supabaseAdmin
      .from("user_holds")
      .update({
        is_held: false,
        unheld_at: nowIso,
        unheld_by: authResult.email,
        updated_at: nowIso,
      })
      .eq("user_id", userId);

    if (dbError) {
      console.error("[api/admin/user-unhold] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Gagal membuka penguncian akun pengguna." },
        { status: 500 }
      );
    }

    // 4. Catat audit log administratif (non-blocking)
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        action: "user_unhold",
        target_id: userId,
        performed_by: authResult.email,
        details: { timestamp: nowIso },
      });
    } catch (auditErr) {
      console.warn("[api/admin/user-unhold] Audit log note:", auditErr);
    }

    return NextResponse.json({
      success: true,
      isHeld: false,
      message: "Penguncian akun berhasil dibuka. Pengguna dapat mengakses layanan kembali.",
    });
  } catch (err: unknown) {
    console.error("[api/admin/user-unhold] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error saat membuka penguncian akun." },
      { status: 500 }
    );
  }
}
