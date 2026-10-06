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
    // Validasi format username (alphanumeric, underscore, dash)
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username harus 3-20 karakter dan hanya boleh berisi huruf, angka, tanda strip, atau garis bawah." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal harus terdiri dari 8 karakter." },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();

    // Update user di Clerk: set username dan password
    await clerk.users.updateUser(userId, {
      username: cleanUsername,
      password: password,
    });

    return NextResponse.json({
      success: true,
      message: "Profil dan password berhasil disimpan.",
    });
  } catch (error: any) {
    console.error("[complete-profile] Error:", error);

    // Ambil pesan error spesifik dari Clerk (misal: username taken, password pwned, dll)
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
