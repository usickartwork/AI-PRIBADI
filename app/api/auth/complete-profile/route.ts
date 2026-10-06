import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, username, password } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID tidak valid." },
        { status: 400 }
      );
    }

    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json(
        { error: "Username wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username harus 3-30 karakter (huruf, angka, strip, atau titik)." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    // 1. Simpan username dan password di Clerk
    const clerk = await clerkClient();
    await clerk.users.updateUser(userId, {
      username: cleanUsername,
      password: password,
      skipPasswordChecks: true, // Izinkan standar umum 6 karakter tanpa batasan 15 karakter
      publicMetadata: {
        username: cleanUsername,
      },
    });

    // 2. Simpan username ke Supabase profiles table (jika service role tersedia)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (serviceRoleKey && isSupabaseConfigured) {
      try {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        await adminClient.from("profiles").upsert({
          id: userId,
          username: cleanUsername,
          updated_at: new Date().toISOString(),
        });
      } catch (sbErr) {
        console.warn("[complete-profile] Supabase sync note:", sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      message: "Profil dan password berhasil disimpan.",
    });
  } catch (error: any) {
    console.error("[complete-profile] Error:", error);

    const clerkErrors = error?.errors;
    if (Array.isArray(clerkErrors) && clerkErrors.length > 0) {
      const first = clerkErrors[0];
      const message = first.longMessage || first.message || "Gagal memperbarui profil di Clerk.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan saat menyimpan profil." },
      { status: 500 }
    );
  }
}
