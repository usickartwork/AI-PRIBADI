export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  return createClerkClient({ secretKey });
}

// GET: Ambil daftar seluruh sesi / perangkat yang sedang aktif untuk akun pengguna
export async function GET() {
  try {
    const { userId, sessionId: currentSessionId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const clerk = getClerk();
    if (!clerk) {
      return NextResponse.json({ error: "Layanan autentikasi tidak siap." }, { status: 500 });
    }

    const response = await clerk.sessions.getSessionList({ userId, status: "active" });
    const rawSessions = response.data || [];

    const sessions = rawSessions.map((s) => {
      const activity = s.latestActivity;
      const isMobile = Boolean(activity?.isMobile);
      const deviceType = activity?.deviceType || (isMobile ? "Mobile" : "Desktop");
      const isCurrent = s.id === currentSessionId;

      return {
        id: s.id,
        isCurrent,
        isMobile,
        deviceType,
        browserName: activity?.browserName || "Browser Web",
        browserVersion: activity?.browserVersion || "",
        city: activity?.city || "",
        country: activity?.country || "",
        ipAddress: activity?.ipAddress || "",
        lastActiveAt: s.lastActiveAt ? new Date(s.lastActiveAt).toISOString() : null,
        expireAt: s.expireAt ? new Date(s.expireAt).toISOString() : null,
        status: s.status,
      };
    });

    // Urutkan: Sesi saat ini paling atas, sisanya diurutkan berdasarkan aktivitas terbaru
    sessions.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({
      currentSessionId,
      sessions,
    });
  } catch (err: any) {
    console.error("[api/auth/sessions] GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Keluarkan (logout / revoke) sesi perangkat tertentu atau seluruh perangkat lain
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId: currentSessionId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const clerk = getClerk();
    if (!clerk) {
      return NextResponse.json({ error: "Layanan autentikasi tidak siap." }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionIdToRevoke, revokeAllOthers } = body;

    // Aksi 1: Keluarkan semua perangkat lain kecuali perangkat yang sedang dipakai saat ini
    if (revokeAllOthers) {
      const response = await clerk.sessions.getSessionList({ userId, status: "active" });
      const others = (response.data || []).filter((s) => s.id !== currentSessionId);
      await Promise.all(
        others.map((s) => clerk.sessions.revokeSession(s.id).catch(() => {}))
      );
      return NextResponse.json({
        success: true,
        revokedCount: others.length,
      });
    }

    // Aksi 2: Keluarkan satu perangkat spesifik
    if (!sessionIdToRevoke || typeof sessionIdToRevoke !== "string") {
      return NextResponse.json({ error: "Session ID diperlukan." }, { status: 400 });
    }

    // Verifikasi keamanan: Pastikan sesi memang milik user yang sedang aktif
    const target = await clerk.sessions.getSession(sessionIdToRevoke).catch(() => null);
    if (!target || target.userId !== userId) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan atau bukan milik akun Anda." },
        { status: 404 }
      );
    }

    await clerk.sessions.revokeSession(sessionIdToRevoke);

    return NextResponse.json({
      success: true,
      isCurrent: sessionIdToRevoke === currentSessionId,
    });
  } catch (err: any) {
    console.error("[api/auth/sessions] POST error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

