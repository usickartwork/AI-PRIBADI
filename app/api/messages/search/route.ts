export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { errorResponse, getAdmin, pairKey, requireUserId, toPublicUser } from "@/lib/messagesServer";

/**
 * GET /api/messages/search?q=<username | email>
 * Pencarian EXACT match agar email/username orang lain tidak bisa di-enumerasi.
 * Respons tidak pernah memuat email.
 */
export async function GET(req: Request) {
  try {
    const me = await requireUserId();
    const raw = new URL(req.url).searchParams.get("q") || "";
    const q = raw.trim().replace(/^@/, "").slice(0, 254);
    if (q.length < 3) return NextResponse.json({ results: [] });

    const clerk = await clerkClient();
    const isEmail = q.includes("@");
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q)) return NextResponse.json({ results: [] });
    if (!isEmail && !/^[A-Za-z0-9_.-]{3,64}$/.test(q)) return NextResponse.json({ results: [] });

    const res = await clerk.users.getUserList(
      isEmail ? { emailAddress: [q.toLowerCase()], limit: 1 } : { username: [q.toLowerCase()], limit: 1 }
    );
    const found = res.data.filter((u) => u.id !== me);
    if (found.length === 0) return NextResponse.json({ results: [] });

    const target = found[0];
    const db = getAdmin();

    const [blocksRes, friendRes] = await Promise.all([
      db
        .from("msg_blocks")
        .select("blocker_id, blocked_id")
        .or(`and(blocker_id.eq.${me},blocked_id.eq.${target.id}),and(blocker_id.eq.${target.id},blocked_id.eq.${me})`),
      db.from("msg_friendships").select("id, requester_id, status").eq("pair_key", pairKey(me, target.id)).maybeSingle(),
    ]);
    if (blocksRes.error) throw blocksRes.error;
    if (friendRes.error) throw friendRes.error;

    // Jika target memblokir saya, sembunyikan hasilnya.
    if (blocksRes.data?.some((b) => b.blocker_id === target.id)) return NextResponse.json({ results: [] });

    let relation: "none" | "friends" | "outgoing" | "incoming" | "blocked" = "none";
    if (blocksRes.data?.some((b) => b.blocker_id === me)) relation = "blocked";
    else if (friendRes.data?.status === "accepted") relation = "friends";
    else if (friendRes.data?.status === "pending") relation = friendRes.data.requester_id === me ? "outgoing" : "incoming";

    return NextResponse.json({
      results: [{ user: toPublicUser(target), relation, friendshipId: friendRes.data?.id ?? null }],
    });
  } catch (err) {
    return errorResponse(err);
  }
}

