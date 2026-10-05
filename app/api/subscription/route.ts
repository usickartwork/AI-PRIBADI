export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserSubscription, upgradeUserToPro, deductCredits } from "@/lib/subscriptionServer";
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
    const sub = await getUserSubscription(userId);
    return NextResponse.json(sub);
  } catch (err: any) {
    console.error("GET /api/subscription error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memuat status langganan." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let userId = body.userId;
    if (!userId) {
      userId = await getUserIdFromRequest(req);
    }

    const { action } = body;

    // 1. Upgrade ke Pro
    if (action === "upgrade") {
      const res = await upgradeUserToPro(userId);
      const updatedSub = await getUserSubscription(userId);
      return NextResponse.json({
        ...res,
        subscription: updatedSub,
      });
    }

    // 2. Pengurangan Kredit Manual (e.g. dari client code planner jika perlu)
    if (action === "deduct") {
      const { creditType = "ai", amount = 1, modelId, taskType, inputTokens, outputTokens } = body;
      const res = await deductCredits({
        userId,
        creditType,
        amount,
        modelId,
        taskType,
        inputTokens,
        outputTokens,
      });
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Action tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/subscription error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses langganan." },
      { status: 500 }
    );
  }
}
