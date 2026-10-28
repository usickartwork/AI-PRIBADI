import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { verifyAdminSession, getAdminSupabaseClient } from "@/lib/adminServer";
import { getNextDailyResetDate } from "@/lib/pricing";

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

    // 2. Baca payload
    const body = await req.json().catch(() => ({}));
    const { userId, plan } = body;

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json(
        { error: "User ID wajib disertakan." },
        { status: 400 }
      );
    }

    if (plan !== "free" && plan !== "pro") {
      return NextResponse.json(
        { error: "Paket harus bernilai 'free' atau 'pro'." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const nextReset = getNextDailyResetDate();

    // 3. Terapkan perubahan paket di Supabase
    if (plan === "pro") {
      // Masa aktif 1 tahun untuk grant pro oleh admin
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const { error: subErr } = await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          status: "active",
          started_at: now,
          current_period_start: now,
          current_period_end: oneYearLater,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      if (subErr) {
        console.error("[admin/user-plan] Error upserting pro subscription:", subErr);
        return NextResponse.json(
          { error: "Gagal memperbarui paket langganan di basis data." },
          { status: 500 }
        );
      }

      // Update kredit pro
      await supabaseAdmin.from("credit_balances").upsert(
        {
          user_id: userId,
          ai_credits: 100000,
          ai_credit_limit: 100000,
          code_credits: 200,
          code_credit_limit: 200,
          reset_at: nextReset,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      // Catat transaksi pemberian kredit
      try {
        await supabaseAdmin.from("credit_transactions").insert({
          user_id: userId,
          credit_type: "ai",
          amount: 100000,
          balance_before: 0,
          balance_after: 100000,
          transaction_type: "grant",
          task_type: "admin_plan_upgrade",
          created_at: now,
        });
      } catch (txErr) {
        console.warn("[admin/user-plan] Transaction log note:", txErr);
      }
    } else {
      // Kembalikan ke Paket Free
      const { error: subErr } = await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "free",
          status: "active",
          started_at: now,
          current_period_start: now,
          current_period_end: nextReset,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      if (subErr) {
        console.error("[admin/user-plan] Error downgrading subscription to free:", subErr);
        return NextResponse.json(
          { error: "Gagal memperbarui paket langganan ke free di basis data." },
          { status: 500 }
        );
      }

      // Sesuaikan kredit ke batas Free
      const { data: cred } = await supabaseAdmin
        .from("credit_balances")
        .select("ai_credits, code_credits")
        .eq("user_id", userId)
        .maybeSingle();

      const aiCredits = Math.min(cred?.ai_credits ?? 10000, 10000);
      const codeCredits = Math.min(cred?.code_credits ?? 50, 50);

      await supabaseAdmin.from("credit_balances").upsert(
        {
          user_id: userId,
          ai_credits: aiCredits,
          ai_credit_limit: 10000,
          code_credits: codeCredits,
          code_credit_limit: 50,
          reset_at: nextReset,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );
    }

    // 4. Catat audit log administratif (non-blocking)
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        action: "user_plan_change",
        target_id: userId,
        performed_by: authResult.email,
        details: { plan, timestamp: now },
      });
    } catch (auditErr) {
      console.warn("[admin/user-plan] Audit log note:", auditErr);
    }

    // 5. Sinkronisasi publicMetadata Clerk secara asinkron (jika memungkinkan)
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { plan },
      });
    } catch (clerkErr) {
      console.warn("[admin/user-plan] Clerk metadata sync note:", clerkErr);
    }

    return NextResponse.json({
      success: true,
      plan,
      message: `Paket akun pengguna berhasil diperbarui menjadi ${plan.toUpperCase()}.`,
    });
  } catch (error: unknown) {
    console.error("[api/admin/user-plan] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error saat memperbarui paket pengguna." },
      { status: 500 }
    );
  }
}
