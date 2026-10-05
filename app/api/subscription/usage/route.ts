export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCreditTransactions } from "@/lib/subscriptionServer";
import { supabase } from "@/lib/supabase";

async function getUserIdFromRequest(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user?.id) return user.id;
    } catch {}
  }
  const url = new URL(req.url);
  const qUserId = url.searchParams.get("userId");
  if (qUserId) return qUserId;

  return "guest";
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const transactions = await getCreditTransactions(userId);
    return NextResponse.json({
      transactions,
    });
  } catch (err: any) {
    console.error("GET /api/subscription/usage error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memuat riwayat penggunaan kredit." },
      { status: 500 }
    );
  }
}
