export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  MsgError,
  areFriends,
  errorResponse,
  getAdmin,
  getPublicUsers,
  isBlockedEitherWay,
  isValidUserId,
  pairKey,
  readJson,
  requireUserId,
} from "@/lib/messagesServer";

/**
 * GET /api/messages/conversations
 * Daftar percakapan dengan teman aktif, diurutkan dari aktivitas terbaru, beserta jumlah belum dibaca.
 */
export async function GET() {
  try {
    const me = await requireUserId();
    const db = getAdmin();

    const [convRes, friendRes] = await Promise.all([
      db
        .from("msg_conversations")
        .select("id, user_a, user_b, last_message_preview, last_message_sender, last_message_at, created_at")
        .or(`user_a.eq.${me},user_b.eq.${me}`)
        .not("last_message_at", "is", null)
        .order("last_message_at", { ascending: false })
        .limit(100),
      db
        .from("msg_friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
        .limit(500),
    ]);
    if (convRes.error) throw convRes.error;
    if (friendRes.error) throw friendRes.error;

    const friendIds = new Set((friendRes.data ?? []).map((f) => (f.requester_id === me ? f.addressee_id : f.requester_id)));
    const convs = (convRes.data ?? []).filter((c) => friendIds.has(c.user_a === me ? c.user_b : c.user_a));
    if (convs.length === 0) return NextResponse.json({ conversations: [] });

    const convIds = convs.map((c) => c.id);
    const { data: reads, error: readErr } = await db
      .from("msg_reads")
      .select("conversation_id, last_read_at")
      .eq("user_id", me)
      .in("conversation_id", convIds);
    if (readErr) throw readErr;
    const readMap = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at as string]));

    const unreadCounts = await Promise.all(
      convs.map(async (c) => {
        if (c.last_message_sender === me) return 0;
        const lastRead = readMap.get(c.id);
        if (lastRead && c.last_message_at && lastRead >= c.last_message_at) return 0;
        let q = db
          .from("msg_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", me);
        if (lastRead) q = q.gt("created_at", lastRead);
        const { count, error } = await q;
        if (error) throw error;
        return count ?? 0;
      })
    );

    const users = await getPublicUsers(convs.map((c) => (c.user_a === me ? c.user_b : c.user_a)));
    const conversations = convs
      .map((c, i) => {
        const peer = users.get(c.user_a === me ? c.user_b : c.user_a);
        if (!peer) return null;
        return {
          id: c.id,
          peer,
          lastMessage: c.last_message_preview,
          lastMessageFromMe: c.last_message_sender === me,
          lastMessageAt: c.last_message_at,
          unread: unreadCounts[i],
        };
      })
      .filter(Boolean);

    return NextResponse.json({ conversations });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/messages/conversations  body: { userId }
 * Membuka (atau membuat) percakapan 1-on-1 dengan teman aktif.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUserId();
    const db = getAdmin();
    const body = await readJson(req);
    const target = body.userId;
    if (!isValidUserId(target) || target === me) throw new MsgError("Pengguna tidak valid.");
    if (await isBlockedEitherWay(db, me, target)) throw new MsgError("Tidak dapat membuka percakapan ini.", 403);
    if (!(await areFriends(db, me, target))) throw new MsgError("Kalian harus berteman untuk memulai chat.", 403);

    const key = pairKey(me, target);
    const [a, b] = [me, target].sort();
    const { error: upErr } = await db
      .from("msg_conversations")
      .upsert({ user_a: a, user_b: b, pair_key: key }, { onConflict: "pair_key", ignoreDuplicates: true });
    if (upErr) throw upErr;

    const { data, error } = await db.from("msg_conversations").select("id").eq("pair_key", key).single();
    if (error) throw error;

    const users = await getPublicUsers([target]);
    return NextResponse.json({ id: data.id, peer: users.get(target) ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}

