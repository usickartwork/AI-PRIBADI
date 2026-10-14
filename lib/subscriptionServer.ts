import { createClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  SubscriptionPlanId,
  UserSubscriptionInfo,
  CreditTransaction,
  getPlanDefinition,
  getDaysUntilReset,
  getHoursUntilReset,
  getNextDailyResetDate,
  getNextMonthlyResetDate,
} from "@/lib/pricing";

function getServiceOrAnonClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (serviceRoleKey && isSupabaseConfigured) {
    return createClient(supabaseUrl, serviceRoleKey);
  }
  return supabase;
}

// In-memory fallback cache untuk guest atau serverless instance
const memoryUserSubscriptions = new Map<string, UserSubscriptionInfo>();
const memoryTransactions: CreditTransaction[] = [];

/**
 * Mendapatkan detail langganan, kuota kredit, dan penggunaan jadwal user.
 */
export async function getUserSubscription(userId: string = "guest"): Promise<UserSubscriptionInfo> {
  const isGuest = !userId || userId === "guest";

  // Jika guest, gunakan in-memory / default Free
  if (isGuest) {
    const existing = memoryUserSubscriptions.get("guest");
    if (existing) {
      existing.resetsInDays = getDaysUntilReset(existing.resetAt);
      return existing;
    }
    const defaultGuest: UserSubscriptionInfo = {
      userId: "guest",
      plan: "free",
      status: "active",
      startedAt: new Date().toISOString(),
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: getNextDailyResetDate(),
      aiCredits: 10000,
      aiCreditLimit: 10000,
      codeCredits: 50,
      codeCreditLimit: 50,
      activeSchedulesCount: 0,
      scheduleLimit: 3,
      resetAt: getNextDailyResetDate(),
      resetsInDays: 1,
      resetsInHours: 24,
    };
    memoryUserSubscriptions.set("guest", defaultGuest);
    return defaultGuest;
  }

  // Coba ambil dari Supabase
  if (isSupabaseConfigured) {
    try {
      const client = getServiceOrAnonClient();

      // 1. Ambil Langganan
      const { data: subData } = await client
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const userPlan = (subData?.plan || "free") as SubscriptionPlanId;
      const planDef = getPlanDefinition(userPlan);

      // 2. Ambil Saldo Kredit
      const { data: creditData } = await client
        .from("credit_balances")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // 3. Hitung Jadwal Aktif
      const { count: scheduleCount } = await client
        .from("schedules")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "upcoming");

      let aiCredits = creditData?.ai_credits ?? planDef.aiCreditLimit;
      let codeCredits = creditData?.code_credits ?? planDef.codeCreditLimit;
      let resetAt = creditData?.reset_at || getNextDailyResetDate();
      let aiCreditLimit = creditData?.ai_credit_limit ?? planDef.aiCreditLimit;
      let codeCreditLimit = creditData?.code_credit_limit ?? planDef.codeCreditLimit;

      // Jika belum ada record saldo, buatkan sekarang
      if (!creditData) {
        try {
          await client.from("credit_balances").upsert(
            {
              user_id: userId,
              ai_credits: planDef.aiCreditLimit,
              ai_credit_limit: planDef.aiCreditLimit,
              code_credits: planDef.codeCreditLimit,
              code_credit_limit: planDef.codeCreditLimit,
              reset_at: resetAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch {}
      }

      // 4. Auto-Sync jika user adalah PRO tetapi saldo/limit di DB masih Free limit
      if (userPlan === "pro" && aiCreditLimit < planDef.aiCreditLimit) {
        aiCreditLimit = planDef.aiCreditLimit;
        codeCreditLimit = planDef.codeCreditLimit;
        aiCredits = planDef.aiCreditLimit;
        codeCredits = planDef.codeCreditLimit;
        resetAt = getNextDailyResetDate();
        try {
          await client
            .from("credit_balances")
            .update({
              ai_credits: aiCredits,
              ai_credit_limit: aiCreditLimit,
              code_credits: codeCredits,
              code_credit_limit: codeCreditLimit,
              reset_at: resetAt,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        } catch {}
      }

      // 5. Cek apakah siklus reset harian sudah jatuh tempo (Daily Reset)
      const now = new Date();
      const resetTime = new Date(resetAt).getTime();
      const isDailyResetDue = now.getTime() >= resetTime || (resetTime - now.getTime() > 24 * 60 * 60 * 1000);

      if (isDailyResetDue) {
        resetAt = getNextDailyResetDate();
        aiCredits = planDef.aiCreditLimit;
        codeCredits = planDef.codeCreditLimit;
        aiCreditLimit = planDef.aiCreditLimit;
        codeCreditLimit = planDef.codeCreditLimit;
        try {
          await client
            .from("credit_balances")
            .update({
              ai_credits: aiCredits,
              ai_credit_limit: aiCreditLimit,
              code_credits: codeCredits,
              code_credit_limit: codeCreditLimit,
              reset_at: resetAt,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        } catch {}
      }

      return {
        userId,
        plan: userPlan,
        status: (subData?.status || "active") as any,
        startedAt: subData?.started_at || new Date().toISOString(),
        currentPeriodStart: subData?.current_period_start || new Date().toISOString(),
        currentPeriodEnd: subData?.current_period_end || resetAt,
        aiCredits,
        aiCreditLimit,
        codeCredits,
        codeCreditLimit,
        activeSchedulesCount: scheduleCount || 0,
        scheduleLimit: planDef.scheduleLimit,
        resetAt,
        resetsInDays: getDaysUntilReset(resetAt),
        resetsInHours: getHoursUntilReset(resetAt),
      };
    } catch (dbErr) {
      console.warn("[subscription] Error reading from Supabase, using fallback:", dbErr);
    }
  }

  // Fallback cache
  const cached = memoryUserSubscriptions.get(userId);
  if (cached) {
    cached.resetsInDays = getDaysUntilReset(cached.resetAt);
    cached.resetsInHours = getHoursUntilReset(cached.resetAt);
    return cached;
  }

  const fallback: UserSubscriptionInfo = {
    userId,
    plan: "free",
    status: "active",
    startedAt: new Date().toISOString(),
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: getNextDailyResetDate(),
    aiCredits: 10000,
    aiCreditLimit: 10000,
    codeCredits: 50,
    codeCreditLimit: 50,
    activeSchedulesCount: 0,
    scheduleLimit: 3,
    resetAt: getNextDailyResetDate(),
    resetsInDays: 1,
    resetsInHours: 24,
  };
  memoryUserSubscriptions.set(userId, fallback);
  return fallback;
}

/**
 * Mengurangi saldo kredit pengguna secara aman (atomic) & mencatat transaksi.
 */
export async function deductCredits(params: {
  userId: string;
  creditType: "ai" | "code";
  amount: number;
  modelId?: string;
  taskType?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
}): Promise<{ success: boolean; error?: string; remainingCredits?: number }> {
  const { userId, creditType, amount, modelId, taskType, inputTokens, outputTokens } = params;

  // Pastikan daily reset dan quota auto-sync sudah berjalan terlebih dahulu
  const sub = await getUserSubscription(userId);

  const isGuest = !userId || userId === "guest";

  // Jika di Supabase
  if (!isGuest && isSupabaseConfigured) {
    try {
      const client = getServiceOrAnonClient();

      // Coba panggil atomic RPC deduct_credits
      const { data, error } = await client.rpc("deduct_credits", {
        p_user_id: userId,
        p_credit_type: creditType,
        p_amount: amount,
        p_model_id: modelId || null,
        p_task_type: taskType || "chat",
        p_input_tokens: inputTokens || null,
        p_output_tokens: outputTokens || null,
      });

      if (!error && data && data.success) {
        return { success: true, remainingCredits: data.balance_after };
      }

      // Jika RPC tidak tersedia atau gagal karena batasan lain, lakukan direct update aman
      const { data: balanceRow } = await client
        .from("credit_balances")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (balanceRow) {
        const field = creditType === "ai" ? "ai_credits" : "code_credits";
        const currentBal = balanceRow[field] ?? 0;

        if (currentBal >= amount) {
          const newBal = currentBal - amount;
          await client
            .from("credit_balances")
            .update({
              [field]: newBal,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          await client.from("credit_transactions").insert({
            user_id: userId,
            credit_type: creditType,
            amount: -amount,
            balance_before: currentBal,
            balance_after: newBal,
            transaction_type: "usage",
            model_id: modelId || null,
            task_type: taskType || (creditType === "ai" ? "chat" : "code"),
            input_tokens: inputTokens || null,
            output_tokens: outputTokens || null,
            total_tokens: (inputTokens || 0) + (outputTokens || 0),
            created_at: new Date().toISOString(),
          });

          return { success: true, remainingCredits: newBal };
        } else {
          return { success: false, error: "Insufficient credits", remainingCredits: currentBal };
        }
      }
    } catch (rpcErr) {
      console.warn("[subscription] deduct_credits direct fallback error:", rpcErr);
    }
  }

  // Fallback memory state
  if (creditType === "ai") {
    if (sub.aiCredits < amount) {
      return { success: false, error: "Insufficient AI credits", remainingCredits: sub.aiCredits };
    }
    const balanceBefore = sub.aiCredits;
    sub.aiCredits = Math.max(0, sub.aiCredits - amount);
    memoryUserSubscriptions.set(userId, sub);

    memoryTransactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      creditType: "ai",
      amount: -amount,
      balanceBefore,
      balanceAfter: sub.aiCredits,
      transactionType: "usage",
      modelId,
      taskType: taskType || "chat",
      inputTokens,
      outputTokens,
      totalTokens: (inputTokens || 0) + (outputTokens || 0),
      createdAt: new Date().toISOString(),
    });

    return { success: true, remainingCredits: sub.aiCredits };
  } else {
    if (sub.codeCredits < amount) {
      return { success: false, error: "Insufficient Code credits", remainingCredits: sub.codeCredits };
    }
    const balanceBefore = sub.codeCredits;
    sub.codeCredits = Math.max(0, sub.codeCredits - amount);
    memoryUserSubscriptions.set(userId, sub);

    memoryTransactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      creditType: "code",
      amount: -amount,
      balanceBefore,
      balanceAfter: sub.codeCredits,
      transactionType: "usage",
      modelId,
      taskType: taskType || "code",
      inputTokens,
      outputTokens,
      totalTokens: (inputTokens || 0) + (outputTokens || 0),
      createdAt: new Date().toISOString(),
    });

    return { success: true, remainingCredits: sub.codeCredits };
  }
}

/**
 * Melakukan upgrade user ke Pro (langsung aktifkan kuota & model) dengan validasi kode Onemind1.
 */
export async function upgradeUserToPro(userId: string, code?: string): Promise<{ success: boolean; plan: string; message: string }> {
  // Verifikasi kode sandi aktivasi sementara
  if (!code || code.trim() !== "Onemind1") {
    return {
      success: false,
      plan: "free",
      message: "Kode aktivasi tidak valid. Silakan masukkan kode akses Pro yang benar (Onemind1).",
    };
  }

  const isGuest = !userId || userId === "guest";
  const now = new Date().toISOString();
  const nextReset = getNextDailyResetDate();

  if (!isGuest && isSupabaseConfigured) {
    try {
      const client = getServiceOrAnonClient();
      const { error: subErr } = await client.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          status: "active",
          started_at: now,
          current_period_start: now,
          current_period_end: nextReset,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      if (subErr) {
        console.warn("[subscription] Error upserting pro subscription, trying update fallback:", subErr);
        await client
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            current_period_start: now,
            current_period_end: nextReset,
            updated_at: now,
          })
          .eq("user_id", userId);
      }

      const { error: balErr } = await client.from("credit_balances").upsert(
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

      if (balErr) {
        console.warn("[subscription] Error upserting pro credit_balances, trying update fallback:", balErr);
        await client
          .from("credit_balances")
          .update({
            ai_credits: 100000,
            ai_credit_limit: 100000,
            code_credits: 200,
            code_credit_limit: 200,
            reset_at: nextReset,
            updated_at: now,
          })
          .eq("user_id", userId);
      }

      await client.from("credit_transactions").insert({
        user_id: userId,
        credit_type: "ai",
        amount: 100000,
        balance_before: 0,
        balance_after: 100000,
        transaction_type: "grant",
        task_type: "upgrade_pro",
        created_at: now,
      });

      return {
        success: true,
        plan: "pro",
        message: "Selamat! Akun Anda berhasil di-upgrade ke Usick One Pro. Semua model AI, Game, Faith, dan Image generator kini terbuka.",
      };
    } catch (err) {
      console.error("[subscription] Error upgrading user in Supabase:", err);
    }
  }

  // Fallback memory state
  const existing = await getUserSubscription(userId);
  existing.plan = "pro";
  existing.aiCredits = 100000;
  existing.aiCreditLimit = 100000;
  existing.codeCredits = 200;
  existing.codeCreditLimit = 200;
  existing.scheduleLimit = 50;
  existing.currentPeriodEnd = nextReset;
  existing.resetAt = nextReset;
  existing.resetsInDays = 1;
  existing.resetsInHours = 24;
  memoryUserSubscriptions.set(userId, existing);

  return {
    success: true,
    plan: "pro",
    message: "Selamat! Akun Anda berhasil di-upgrade ke Usick One Pro. Semua model AI, Game, Faith, dan Image generator kini terbuka.",
  };
}

/**
 * Mengalihkan paket user kembali ke Free.
 */
export async function downgradeUserToFree(userId: string): Promise<{ success: boolean; plan: string; message: string }> {
  const isGuest = !userId || userId === "guest";
  const now = new Date().toISOString();
  const nextReset = getNextDailyResetDate();

  if (!isGuest && isSupabaseConfigured) {
    try {
      const client = getServiceOrAnonClient();
      const { error: subErr } = await client.from("subscriptions").upsert(
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
        console.warn("[subscription] Error upserting free subscription, trying update fallback:", subErr);
        await client
          .from("subscriptions")
          .update({
            plan: "free",
            status: "active",
            current_period_start: now,
            current_period_end: nextReset,
            updated_at: now,
          })
          .eq("user_id", userId);
      }

      // Sesuaikan kredit agar tidak melebihi batas paket Free
      const { data: cred } = await client
        .from("credit_balances")
        .select("ai_credits, code_credits")
        .eq("user_id", userId)
        .maybeSingle();

      const aiCredits = Math.min(cred?.ai_credits ?? 10000, 10000);
      const codeCredits = Math.min(cred?.code_credits ?? 50, 50);

      const { error: balErr } = await client.from("credit_balances").upsert(
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

      if (balErr) {
        console.warn("[subscription] Error upserting free credit_balances, trying update fallback:", balErr);
        await client
          .from("credit_balances")
          .update({
            ai_credits: aiCredits,
            ai_credit_limit: 10000,
            code_credits: codeCredits,
            code_credit_limit: 50,
            reset_at: nextReset,
            updated_at: now,
          })
          .eq("user_id", userId);
      }

      return {
        success: true,
        plan: "free",
        message: "Paket Anda telah berhasil dialihkan kembali ke Paket Free.",
      };
    } catch (err) {
      console.error("[subscription] Error downgrading user in Supabase:", err);
    }
  }

  // Memory fallback
  const existing = await getUserSubscription(userId);
  existing.plan = "free";
  existing.aiCredits = Math.min(existing.aiCredits, 10000);
  existing.aiCreditLimit = 10000;
  existing.codeCredits = Math.min(existing.codeCredits, 50);
  existing.codeCreditLimit = 50;
  existing.scheduleLimit = 3;
  existing.currentPeriodEnd = nextReset;
  existing.resetAt = nextReset;
  existing.resetsInDays = 1;
  existing.resetsInHours = 24;
  memoryUserSubscriptions.set(userId, existing);

  return {
    success: true,
    plan: "free",
    message: "Paket Anda telah berhasil dialihkan kembali ke Paket Free.",
  };
}

/**
 * Mengambil riwayat transaksi kredit pengguna.
 */
export async function getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  const isGuest = !userId || userId === "guest";

  if (!isGuest && isSupabaseConfigured) {
    try {
      const client = getServiceOrAnonClient();
      const { data, error } = await client
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25);

      if (!error && Array.isArray(data)) {
        return data.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          creditType: t.credit_type,
          amount: t.amount,
          balanceBefore: t.balance_before,
          balanceAfter: t.balance_after,
          transactionType: t.transaction_type,
          modelId: t.model_id,
          taskType: t.task_type,
          inputTokens: t.input_tokens,
          outputTokens: t.output_tokens,
          totalTokens: t.total_tokens,
          createdAt: t.created_at,
        }));
      }
    } catch {}
  }

  // Memory fallback
  return memoryTransactions.filter((t) => t.userId === userId || isGuest).slice(0, 25);
}

/**
 * Menghapus data langganan dan kredit dari memori
 */
export async function deleteUserData(userId: string): Promise<boolean> {
  if (!userId || userId === "guest") return false;
  memoryUserSubscriptions.delete(userId);
  return true;
}
