import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminServer";

export const dynamic = "force-dynamic";

/**
 * Endpoint Visibilitas UI Saja:
 * Memeriksa apakah pengguna saat ini berhak melihat tombol Admin di antarmuka.
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
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        isAdmin: true,
        email: authResult.email,
        username: authResult.username,
        fullName: authResult.fullName,
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
      { isAdmin: false, error: "Internal server error" },
      { status: 200 }
    );
  }
}
