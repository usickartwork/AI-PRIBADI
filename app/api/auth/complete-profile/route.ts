import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

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
        { error: "Username minimal 3 karakter (huruf, angka, strip, atau titik)." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 4) {
      return NextResponse.json(
        { error: "Password minimal 4 karakter." },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();

    // Update user di Clerk: set username dan password (skipPasswordChecks agar bisa password pendek)
    await clerk.users.updateUser(userId, {
      username: cleanUsername,
      password: password,
      skipPasswordChecks: true,
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil disimpan.",
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
