import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deleteUserData } from "@/lib/subscriptionServer";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, clerkUserId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID wajib disertakan." },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    // 1. Hapus data dari seluruh tabel publik di Supabase (gunakan service role untuk bypass RLS)
    if (isSupabaseConfigured && serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const results = await Promise.allSettled([
        adminClient.from("chat_history").delete().eq("user_id", userId),
        adminClient.from("schedules").delete().eq("user_id", userId),
        adminClient.from("credit_transactions").delete().eq("user_id", userId),
        adminClient.from("credit_balances").delete().eq("user_id", userId),
        adminClient.from("subscriptions").delete().eq("user_id", userId),
        adminClient.from("profiles").delete().eq("id", userId),
      ]);

      // Log hasil deletion untuk debugging
      const tableNames = ["chat_history", "schedules", "credit_transactions", "credit_balances", "subscriptions", "profiles"];
      results.forEach((result, i) => {
        if (result.status === "rejected") {
          console.warn(`[delete-account] Failed to delete from ${tableNames[i]}:`, result.reason);
        }
      });
    } else if (isSupabaseConfigured) {
      console.warn("[delete-account] SUPABASE_SERVICE_ROLE_KEY not configured — cannot delete Supabase data (RLS will block).");
    }

    // 2. Hapus cache langganan dari memori
    await deleteUserData(userId);

    // 3. Hapus akun dari Clerk secara permanen
    if (clerkUserId && typeof clerkUserId === "string") {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(clerkUserId);
      } catch (clerkErr: any) {
        console.warn("[delete-account] Clerk deleteUser warning:", clerkErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Akun dan seluruh data berhasil dihapus total dari sistem (termasuk Clerk).",
    });
  } catch (error: any) {
    console.error("[delete-account] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan saat menghapus akun." },
      { status: 500 }
    );
  }
}
