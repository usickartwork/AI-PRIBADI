import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMaintenanceStatus, getUserHoldStatus } from "@/lib/accessControl";
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

    // 2. Ambil status maintenance mode global
    const maintenance = await getMaintenanceStatus();

    // 3. Jika pengguna adalah admin yang sah, bypass maintenance & hold
    if (isAdmin) {
      return NextResponse.json(
        {
          maintenance: false,
          isHeld: false,
          isAdmin: true,
          maintenanceRaw: maintenance.isEnabled,
        },
        {
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // 4. Jika bukan admin dan maintenance aktif -> kembalikan status maintenance
    if (maintenance.isEnabled) {
      return NextResponse.json(
        {
          maintenance: true,
          isHeld: false,
          isAdmin: false,
        },
        {
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    // 5. Jika maintenance tidak aktif, cek apakah akun pengguna sedang di-hold
    let isHeld = false;
    if (userId) {
      const hold = await getUserHoldStatus(userId);
      isHeld = hold.isHeld;
    }

    return NextResponse.json(
      {
        maintenance: false,
        isHeld,
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
