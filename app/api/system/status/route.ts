import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAllMaintenanceStatus, getUserHoldStatus } from "@/lib/accessControl";
import { verifyAdminSession } from "@/lib/adminServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.userId;

    // 1. Cek apakah pengguna saat ini adalah admin yang sah
    let isAdmin = false;
    if (userId) {
      try {
        const adminAuth = await verifyAdminSession();
        isAdmin = adminAuth.authorized;
      } catch {
        isAdmin = false;
      }
    }

    // 2. Ambil status maintenance mode global & seluruh fitur dalam 1 query ringan
    const dict = await getAllMaintenanceStatus();

    // 3. Jika pengguna adalah admin yang sah, bypass maintenance & hold
    if (isAdmin) {
      return NextResponse.json(
        {
          maintenance: false,
          isHeld: false,
          isAdmin: true,
          maintenanceRaw: dict.global.isEnabled,
          global: dict.global,
          features: dict.features,
        },
        {
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // 4. Jika bukan admin dan global maintenance aktif -> kembalikan status maintenance global
    if (dict.global.isEnabled) {
      return NextResponse.json(
        {
          maintenance: true,
          isHeld: false,
          isAdmin: false,
          global: dict.global,
          features: dict.features,
        },
        {
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // 5. Jika global maintenance tidak aktif, cek apakah akun pengguna sedang di-hold
    let isHeld = false;
    let holdReason: string | null = null;
    if (userId) {
      const hold = await getUserHoldStatus(userId);
      isHeld = hold.isHeld;
      holdReason = hold.reason || null;
    }

    return NextResponse.json(
      {
        maintenance: false,
        global: dict.global,
        features: dict.features,
        isHeld,
        reason: isHeld ? holdReason : null,
        isAdmin: false,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error: unknown) {
    console.error("[api/system/status] Error:", error);
    return NextResponse.json(
      { maintenance: false, isHeld: false, isAdmin: false },
      { status: 200 }
    );
  }
}
