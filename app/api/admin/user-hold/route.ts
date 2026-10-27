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
    const { userId, userEmail, duration, customExpiresAt, reason } = body;

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json(
        { error: "User ID wajib disertakan." },
        { status: 400 }
      );
    }

    // Cegah admin mengunci akun admin sendiri
    if (authResult.userId === userId) {
      return NextResponse.json(
        { error: "Tindakan ditolak: Anda tidak dapat mengunci akun admin Anda sendiri." },
        { status: 400 }
      );
    }

    // 3. Hitung masa kedaluwarsa penguncian
    let expiresAt: Date | null = null;
    const now = new Date();

    if (duration === "24h") {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (duration === "7d") {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (duration === "30d") {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (duration === "custom" && customExpiresAt) {
      const parsed = new Date(customExpiresAt);
      if (isNaN(parsed.getTime()) || parsed.getTime() <= now.getTime()) {
        return NextResponse.json(
          { error: "Waktu kustom penguncian tidak valid atau harus berada di masa mendatang." },
          { status: 400 }
        );
      }
      expiresAt = parsed;
    } else if (duration === "indefinite") {
      expiresAt = null; // Tanpa batas waktu (sampai di-unhold manual)
    } else {
      // Default: 24 jam jika tidak ditentukan
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // 4. Simpan ke tabel public.user_holds
    const nowIso = now.toISOString();
    const cleanReason = typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 500) : null;

    const { error: dbError } = await supabaseAdmin.from("user_holds").upsert(
      {
        user_id: userId,
        user_email: userEmail || null,
        is_held: true,
        held_at: nowIso,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        reason: cleanReason,
        held_by: authResult.email,
        updated_at: nowIso,
        unheld_at: null,
        unheld_by: null,
      },
      { onConflict: "user_id" }
    );

    if (dbError) {
      console.error("[api/admin/user-hold] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Gagal menyimpan status penguncian akun ke basis data." },
        { status: 500 }
      );
    }

    // 5. Catat audit log administratif (opsional, non-blocking)
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        action: "user_hold",
        target_id: userId,
        performed_by: authResult.email,
        details: {
          duration,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          has_reason: Boolean(cleanReason),
        },
      });
    } catch (auditErr) {
      console.warn("[api/admin/user-hold] Audit log note:", auditErr);
    }

    return NextResponse.json({
      success: true,
      isHeld: true,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      message: "Akun pengguna berhasil dikunci (On Hold).",
    });
  } catch (err: unknown) {
    console.error("[api/admin/user-hold] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error saat mengunci akun pengguna." },
      { status: 500 }
    );
  }
}
