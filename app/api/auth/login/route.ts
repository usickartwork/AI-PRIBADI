import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return NextResponse.json(
        { error: "Username atau email wajib diisi." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const clerk = await clerkClient();

    // Cari user berdasarkan email atau username di Clerk
    let targetUser: any = null;

    if (cleanIdentifier.includes("@")) {
      const usersByEmail = await clerk.users.getUserList({
        emailAddress: [cleanIdentifier],
        limit: 1,
      });
      if (usersByEmail.data && usersByEmail.data.length > 0) {
        targetUser = usersByEmail.data[0];
      }
    } else {
      // Cari berdasarkan username field
      const usersByUsername = await clerk.users.getUserList({
        username: [cleanIdentifier],
        limit: 1,
      });
      if (usersByUsername.data && usersByUsername.data.length > 0) {
        targetUser = usersByUsername.data[0];
      } else {
        // Fallback: cari di seluruh user yang memiliki publicMetadata.username
        const allUsers = await clerk.users.getUserList({ limit: 50 });
        targetUser = allUsers.data.find(
          (u: any) =>
            u.username?.toLowerCase() === cleanIdentifier ||
            (u.publicMetadata?.username as string)?.toLowerCase() === cleanIdentifier ||
            (u.unsafeMetadata?.username as string)?.toLowerCase() === cleanIdentifier
        );
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Akun dengan username atau email ini tidak ditemukan." },
        { status: 404 }
      );
    }

    // Verifikasi password pengguna
    try {
      await clerk.users.verifyPassword({
        userId: targetUser.id,
        password,
      });
    } catch (verifyErr: any) {
      const code = verifyErr?.errors?.[0]?.code;
      if (code === "incorrect_password") {
        return NextResponse.json(
          { error: "Password yang Anda masukkan salah. Silakan coba lagi." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: verifyErr?.errors?.[0]?.longMessage || "Verifikasi password gagal." },
        { status: 400 }
      );
    }

    // Buat SignInToken resmi dari Clerk untuk aktivasi sesi instan di client
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: targetUser.id,
      expiresInSeconds: 300, // 5 menit
    });

    return NextResponse.json({
      success: true,
      token: signInToken.token,
    });
  } catch (error: any) {
    console.error("[login] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan saat memproses login." },
      { status: 500 }
    );
  }
}
