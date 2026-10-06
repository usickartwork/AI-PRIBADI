import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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
    const authHeader = req.headers.get("authorization");

    // Tentukan client yang akan digunakan
    let client = supabase;
    if (serviceRoleKey && isSupabaseConfigured) {
      client = createClient(supabaseUrl, serviceRoleKey);
    } else if (authHeader && isSupabaseConfigured) {
      client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
        global: { headers: { Authorization: authHeader } },
      });
    }

    // 1. Hapus data dari seluruh tabel publik di Supabase
    if (isSupabaseConfigured) {
      await Promise.allSettled([
        client.from("chat_history").delete().eq("user_id", userId),
        client.from("schedules").delete().eq("user_id", userId),
        client.from("credit_transactions").delete().eq("user_id", userId),
        client.from("credit_balances").delete().eq("user_id", userId),
        client.from("subscriptions").delete().eq("user_id", userId),
      ]);
    }

    // 2. Hapus cache langganan dari memori
    await deleteUserData(userId);

    // 3. Jika service role key tersedia, hapus akun dari Supabase Auth secara permanen
    if (serviceRoleKey && isSupabaseConfigured) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { error: adminErr } = await adminClient.auth.admin.deleteUser(userId);
      if (adminErr) {
        console.warn("[delete-account] Admin deleteUser warning:", adminErr.message);
      }
    }

    // 4. Hapus akun dari Clerk secara permanen
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

