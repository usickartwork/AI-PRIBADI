import { NextResponse } from "next/server";
import { verifyAdminSession, getAdminAvatarConfigForUser } from "@/lib/adminServer";

export const dynamic = "force-dynamic";

/**
 * Endpoint Visibilitas UI Saja:
 * Memeriksa apakah pengguna saat ini berhak melihat tombol Admin di antarmuka,
 * serta menyertakan konfigurasi foto profil admin jika berhak.
 * PERHATIAN: Endpoint ini BUKAN pengganti otorisasi data pada endpoint admin lainnya!
 */
export async function GET() {
  try {
    const authResult = await verifyAdminSession();

    if (!authResult.authorized) {
      return NextResponse.json(
        {
          isAdmin: false,
          error: authResult.error,
          adminAvatarConfig: null,
        },
        { status: 200 }
      );
    }

    const adminAvatarConfig = await getAdminAvatarConfigForUser(authResult.userId);

    return NextResponse.json(
      {
        isAdmin: true,
        email: authResult.email,
        username: authResult.username,
        fullName: authResult.fullName,
        adminAvatarConfig,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[api/admin/check] Error:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Internal server error", adminAvatarConfig: null },
      { status: 200 }
    );
  }
}
