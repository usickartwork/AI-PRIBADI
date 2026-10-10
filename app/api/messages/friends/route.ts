export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  FRIEND_REQUESTS_PER_DAY,
  MsgError,
  errorResponse,
  getAdmin,
  getPublicUsers,
  isBlockedEitherWay,
  isValidUserId,
  isValidUuid,
  pairKey,
  readJson,
  requireUserId,
} from "@/lib/messagesServer";

/**
 * GET /api/messages/friends
 * Mengembalikan daftar teman, permintaan masuk, permintaan keluar, dan user yang diblokir.
 */
export async function GET() {
  try {
    const me = await requireUserId();
    const db = getAdmin();

    const [friendRes, blockRes] = await Promise.all([
      db
        .from("msg_friendships")
        .select("id, requester_id, addressee_id, status, created_at, updated_at")
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
        .order("updated_at", { ascending: false })
        .limit(500),
      db.from("msg_blocks").select("blocked_id, created_at").eq("blocker_id", me).limit(500),
    ]);
    if (friendRes.error) throw friendRes.error;
    if (blockRes.error) throw blockRes.error;

    const rows = friendRes.data ?? [];
    const blocks = blockRes.data ?? [];
    const otherIds = rows.map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id));
    const users = await getPublicUsers([...otherIds, ...blocks.map((b) => b.blocked_id)]);

    const friends = [];
    const incoming = [];
    const outgoing = [];
    for (const r of rows) {
      const otherId = r.requester_id === me ? r.addressee_id : r.requester_id;
      const user = users.get(otherId);
      if (!user) continue;
      const item = { friendshipId: r.id, user, since: r.updated_at };
      if (r.status === "accepted") friends.push(item);
      else if (r.addressee_id === me) incoming.push(item);
      else outgoing.push(item);
    }
    friends.sort((a, b) => a.user.name.localeCompare(b.user.name));
    const blocked = blocks.map((b) => users.get(b.blocked_id)).filter(Boolean);

    return NextResponse.json({ friends, incoming, outgoing, blocked });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/messages/friends
 * body: { action: "request", userId } | { action: "accept"|"decline"|"cancel", friendshipId }
 *     | { action: "remove", userId }
 */
export async function POST(req: Request) {
  try {
    const me = await requireUserId();
    const db = getAdmin();
    const body = await readJson(req);
    const action = body.action;

    if (action === "request") {
      const target = body.userId;
      if (!isValidUserId(target) || target === me) throw new MsgError("Pengguna tidak valid.");
      if (await isBlockedEitherWay(db, me, target)) throw new MsgError("Tidak dapat mengirim permintaan ke pengguna ini.", 403);

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countErr } = await db
        .from("msg_friendships")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", me)
        .gte("created_at", since);
      if (countErr) throw countErr;
      if ((count ?? 0) >= FRIEND_REQUESTS_PER_DAY) {
        throw new MsgError("Batas permintaan pertemanan harian tercapai. Coba lagi besok.", 429);
      }

      const key = pairKey(me, target);
      const { data: existing, error: exErr } = await db
        .from("msg_friendships")
        .select("id, requester_id, status")
        .eq("pair_key", key)
        .maybeSingle();
      if (exErr) throw exErr;
      if (existing) {
        if (existing.status === "accepted") throw new MsgError("Kalian sudah berteman.", 409);
        if (existing.requester_id === me) throw new MsgError("Permintaan sudah dikirim.", 409);
        throw new MsgError("Pengguna ini sudah mengirim permintaan ke Anda. Cek tab Requests.", 409);
      }

      const { error } = await db
        .from("msg_friendships")
        .insert({ requester_id: me, addressee_id: target, pair_key: key, status: "pending" });
      if (error) {
        if (error.code === "23505") throw new MsgError("Permintaan sudah ada.", 409);
        throw error;
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "accept" || action === "decline" || action === "cancel") {
      const id = body.friendshipId;
      if (!isValidUuid(id)) throw new MsgError("Permintaan tidak valid.");
      const { data: row, error } = await db
        .from("msg_friendships")
        .select("id, requester_id, addressee_id, status")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!row || row.status !== "pending") throw new MsgError("Permintaan tidak ditemukan.", 404);

      if (action === "cancel") {
        if (row.requester_id !== me) throw new MsgError("Permintaan tidak ditemukan.", 404);
        const { error: delErr } = await db.from("msg_friendships").delete().eq("id", id);
        if (delErr) throw delErr;
        return NextResponse.json({ ok: true });
      }

      if (row.addressee_id !== me) throw new MsgError("Permintaan tidak ditemukan.", 404);
      if (action === "decline") {
        const { error: delErr } = await db.from("msg_friendships").delete().eq("id", id);
        if (delErr) throw delErr;
        return NextResponse.json({ ok: true });
      }

      if (await isBlockedEitherWay(db, me, row.requester_id)) throw new MsgError("Tidak dapat menerima permintaan ini.", 403);
      const { error: updErr } = await db
        .from("msg_friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "pending");
      if (updErr) throw updErr;
      return NextResponse.json({ ok: true });
    }

    if (action === "remove") {
      const target = body.userId;
      if (!isValidUserId(target)) throw new MsgError("Pengguna tidak valid.");
      const { error } = await db.from("msg_friendships").delete().eq("pair_key", pairKey(me, target));
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    throw new MsgError("Aksi tidak dikenal.");
  } catch (err) {
    return errorResponse(err);
  }
}

