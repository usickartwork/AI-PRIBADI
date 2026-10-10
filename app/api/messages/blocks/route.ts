export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { MsgError, errorResponse, getAdmin, isValidUserId, pairKey, readJson, requireUserId } from "@/lib/messagesServer";

/**
 * POST /api/messages/blocks
 * body: { action: "block" | "unblock", userId }
 * Memblokir juga menghapus hubungan pertemanan / permintaan yang ada.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUserId();
    const db = getAdmin();
    const body = await readJson(req);
    const target = body.userId;
    if (!isValidUserId(target) || target === me) throw new MsgError("Pengguna tidak valid.");

    if (body.action === "block") {
      const { error } = await db
        .from("msg_blocks")
        .upsert({ blocker_id: me, blocked_id: target }, { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true });
      if (error) throw error;
      const { error: delErr } = await db.from("msg_friendships").delete().eq("pair_key", pairKey(me, target));
      if (delErr) throw delErr;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "unblock") {
      const { error } = await db.from("msg_blocks").delete().eq("blocker_id", me).eq("blocked_id", target);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    throw new MsgError("Aksi tidak dikenal.");
  } catch (err) {
    return errorResponse(err);
  }
}

