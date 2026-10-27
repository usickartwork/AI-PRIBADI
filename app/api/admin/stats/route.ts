import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { verifyAdminSession, getAdminSupabaseClient } from "@/lib/adminServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ─── 1. SERVER-SIDE STRICT AUTHORIZATION CHECK ──────────────────────────
    // Setiap pemanggilan wajib lolos verifikasi sesi Clerk terpercaya & allowlist Supabase.
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

    const clerk = await clerkClient();

    // ─── 2. UKUR LATENSI KONEKSI SECARA NYATA ────────────────────────────────
    let dbLatencyMs: number | null = null;
    let isDbHealthy = false;
    try {
      const dbStart = performance.now();
      const { error: pingErr } = await supabaseAdmin
        .from("subscriptions")
        .select("id", { count: "exact", head: true });
      dbLatencyMs = Math.round(performance.now() - dbStart);
      isDbHealthy = !pingErr;
    } catch {
      isDbHealthy = false;
    }

    let clerkLatencyMs: number | null = null;
    let isClerkHealthy = false;
    let totalUsersCount = 0;
    let clerkUsersList: Array<{
      id: string;
      primaryEmailAddressId: string | null;
      emailAddresses: Array<{ id: string; emailAddress: string; verification?: { status: string } | null }>;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      publicMetadata?: Record<string, unknown>;
      createdAt: number | string | null;
      lastSignInAt: number | string | null;
    }> = [];
    try {
      const clerkStart = performance.now();
      const [countRes, listRes] = await Promise.all([
        clerk.users.getCount(),
        clerk.users.getUserList({ limit: 100, orderBy: "-created_at" }),
      ]);
      clerkLatencyMs = Math.round(performance.now() - clerkStart);
      totalUsersCount = countRes;
      clerkUsersList = (listRes.data || []) as unknown as typeof clerkUsersList;
      isClerkHealthy = true;
    } catch (clerkErr) {
      console.warn("[admin/stats] Gagal mengambil metrik Clerk:", clerkErr);
      isClerkHealthy = false;
    }

    // ─── 3. AMBIL DATA SUBSCRIPTIONS DARI SUPABASE ──────────────────────────
    let proSubscribersCount = 0;
    const subscriptionMap = new Map<string, { plan: string; status: string; startedAt?: string }>();
    try {
      const { data: subsData } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id, plan, status, started_at");

      if (Array.isArray(subsData)) {
        for (const sub of subsData) {
          subscriptionMap.set(sub.user_id, {
            plan: sub.plan || "free",
            status: sub.status || "active",
            startedAt: sub.started_at,
          });
          if (sub.plan === "pro" && sub.status === "active") {
            proSubscribersCount++;
          }
        }
      }
    } catch (subErr) {
      console.warn("[admin/stats] Gagal membaca tabel subscriptions:", subErr);
    }

    // ─── 4. AMBIL METRIK AI DARI CREDIT_TRANSACTIONS ─────────────────────────
    let totalAiRequests = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokensOverall = 0;
    const modelStatsMap = new Map<
      string,
      { modelId: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number }
    >();
    const taskTypeStatsMap = new Map<string, number>();
    let recentTransactions: Array<{
      id: string;
      userId: string;
      creditType: string;
      amount: number;
      transactionType: string;
      modelId: string;
      taskType: string;
      tokens: number;
      createdAt: string;
    }> = [];

    try {
      // 1. Ambil hitungan total eksak seluruh transaksi AI penggunaan dari basis data tanpa batasan limit
      const { count: exactUsageCount } = await supabaseAdmin
        .from("credit_transactions")
        .select("id", { count: "exact", head: true })
        .eq("transaction_type", "usage");

      if (typeof exactUsageCount === "number") {
        totalAiRequests = exactUsageCount;
      }

      // 2. Ambil data sampel riwayat transaksi kredit (hingga 1.000 data terbaru)
      const { data: txData } = await supabaseAdmin
        .from("credit_transactions")
        .select("id, user_id, credit_type, amount, transaction_type, model_id, task_type, input_tokens, output_tokens, total_tokens, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (Array.isArray(txData)) {
        // Jika exactUsageCount tidak tersedia, fallback ke jumlah transaksi yang terbaca
        if (typeof exactUsageCount !== "number") {
          totalAiRequests = txData.filter((t) => t.transaction_type === "usage").length;
        }

        // Ambil 20 transaksi terbaru untuk audit visual di dashboard
        recentTransactions = txData.slice(0, 20).map((t) => ({
          id: t.id,
          userId: t.user_id,
          creditType: t.credit_type,
          amount: t.amount,
          transactionType: t.transaction_type,
          modelId: t.model_id || "default",
          taskType: t.task_type || "chat",
          tokens: t.total_tokens || 0,
          createdAt: t.created_at,
        }));

        for (const tx of txData) {
          // Hanya hitung konsumsi riil (usage)
          if (tx.transaction_type === "usage") {
            const inTok = tx.input_tokens || 0;
            const outTok = tx.output_tokens || 0;
            const totTok = tx.total_tokens || inTok + outTok;

            totalInputTokens += inTok;
            totalOutputTokens += outTok;
            totalTokensOverall += totTok;

            // Group by model
            const mId = tx.model_id || "Unspecified Model";
            const existingM = modelStatsMap.get(mId) || {
              modelId: mId,
              requests: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            };
            existingM.requests++;
            existingM.inputTokens += inTok;
            existingM.outputTokens += outTok;
            existingM.totalTokens += totTok;
            modelStatsMap.set(mId, existingM);

            // Group by task type
            const tType = tx.task_type || "chat";
            taskTypeStatsMap.set(tType, (taskTypeStatsMap.get(tType) || 0) + 1);
          }
        }
      }
    } catch (txErr) {
      console.warn("[admin/stats] Gagal membaca tabel credit_transactions:", txErr);
    }

    // ─── 5. FORMAT DAFTAR PENGGUNA UNTUK TAB USERS ─────────────────────────
    const formattedUsers = clerkUsersList.map((u) => {
      const primaryEmail =
        u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId) ||
        u.emailAddresses?.[0];
      const isVerified = primaryEmail?.verification?.status === "verified";
      const userSub = subscriptionMap.get(u.id);

      return {
        id: u.id,
        email: primaryEmail?.emailAddress || "Tidak ada email",
        isEmailVerified: isVerified,
        username: u.username || (u.publicMetadata?.username as string) || "—",
        fullName: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
        plan: userSub?.plan || "free",
        status: userSub?.status || "active",
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
      };
    });

    // ─── 6. METRIK RUNTIME PERFORMANCE DARI NODE.JS ─────────────────────────
    const memory = process.memoryUsage();
    const runtimeMemory = {
      heapUsedMB: Number((memory.heapUsed / 1024 / 1024).toFixed(1)),
      heapTotalMB: Number((memory.heapTotal / 1024 / 1024).toFixed(1)),
      rssMB: Number((memory.rss / 1024 / 1024).toFixed(1)),
    };

    // ─── 7. STRUKTUR NOTIFIKASI & ALERTS SISTEM ─────────────────────────────
    const alerts: Array<{
      id: string;
      level: "normal" | "info" | "warning";
      title: string;
      message: string;
      timestamp: string;
    }> = [];

    if (!isDbHealthy) {
      alerts.push({
        id: "alert-db-unhealthy",
        level: "warning",
        title: "Koneksi Supabase Terganggu",
        message: "Ping kueri ke basis data Supabase mengalami keterlambatan atau galat.",
        timestamp: new Date().toISOString(),
      });
    }

    if (!isClerkHealthy) {
      alerts.push({
        id: "alert-clerk-unhealthy",
        level: "warning",
        title: "Layanan Autentikasi Clerk Terkendala",
        message: "Gagal mengambil daftar pengguna dari Clerk API.",
        timestamp: new Date().toISOString(),
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: "alert-all-systems-normal",
        level: "normal",
        title: "Semua Sistem Beroperasi Normal",
        message: "Koneksi Supabase, Clerk Backend SDK, dan Allowlist Admin berjalan optimal.",
        timestamp: new Date().toISOString(),
      });
    }

    // ─── 8. HASIL AKHIR SESUAI 5 BAGIAN BRIEF ──────────────────────────────
    return NextResponse.json(
      {
        admin: {
          email: authResult.email,
          username: authResult.username,
        },
        // 1. Overview
        overview: {
          totalUsers: totalUsersCount || formattedUsers.length,
          proSubscribers: proSubscribersCount,
          freeUsers: Math.max(0, (totalUsersCount || formattedUsers.length) - proSubscribersCount),
          totalAiRequests,
          totalTokensOverall,
          services: {
            database: {
              status: isDbHealthy ? "online" : "offline",
              latencyMs: dbLatencyMs,
            },
            auth: {
              status: isClerkHealthy ? "online" : "degraded",
              latencyMs: clerkLatencyMs,
            },
          },
          alertsCount: alerts.filter((a) => a.level === "warning").length,
        },
        // 2. Users
        users: {
          total: totalUsersCount || formattedUsers.length,
          list: formattedUsers,
        },
        // 3. AI Usage
        aiUsage: {
          totalRequests: totalAiRequests,
          totalTokens: totalTokensOverall,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          models: Array.from(modelStatsMap.values()).sort((a, b) => b.requests - a.requests),
          taskTypes: Array.from(taskTypeStatsMap.entries()).map(([type, count]) => ({ type, count })),
          recentTransactions,
          // Labeling jujur sesuai aturan brief
          avgLatency: null,
          avgLatencyNote: "Data belum tersedia — Waktu respons (latency ms) tidak dicatat di basis data riwayat kredit.",
          estimatedCost: null,
          estimatedCostNote: "Data belum tersedia — Memerlukan integrasi token billing API dari masing-masing AI provider.",
        },
        // 4. Performance
        performance: {
          environment: process.env.NODE_ENV || "development",
          databaseLatencyMs: dbLatencyMs,
          clerkLatencyMs: clerkLatencyMs,
          memory: runtimeMemory,
          // Labeling jujur sesuai aturan brief
          serverCpuUsage: null,
          serverCpuNote: "Data belum tersedia — Memerlukan integrasi APM eksternal (Vercel Metrics / Datadog / Sentry).",
          bandwidthIo: null,
          bandwidthIoNote: "Data belum tersedia — Memerlukan integrasi APM eksternal.",
        },
        // 5. Alerts
        alerts: {
          list: alerts,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[api/admin/stats] Exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error saat memproses data statistik admin." },
      { status: 500 }
    );
  }
}
