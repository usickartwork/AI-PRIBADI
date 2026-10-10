export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  MAX_MESSAGE_LENGTH,
  MESSAGES_PER_MINUTE,
  MsgError,
  areFriends,
  errorResponse,
  getAdmin,
  getConversationPeer,
  isBlockedEitherWay,
  isValidUuid,
  readJson,
  requireUserId,
} from "@/lib/messagesServer";

/**
 * GET /api/messages/messages?conversationId=<uuid>&after=<iso>&before=<iso>
 * - tanpa after/before: 50 pesan terbaru
 * - after: pesan baru sejak timestamp (untuk polling/realtime)
 * - before: pesan lebih lama (load more)
 */
export async function GET(req: Request) {
  try {
    const me = await requireUserId();
    const db = getAdmin();
    const params = new URL(req.url).searchParams;
    const conversationId = params.get("conversationId");
    if (!isValidUuid(conversationId)) throw new MsgError("Percakapan tidak valid.");
    const peerId = await getConversationPeer(db, conversationId, me);

    const after = params.get("after");
    const before = params.get("before");
    let q = db
      .from("msg_messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId);

    if (after && !Number.isNaN(Date.parse(after))) {
      q = q.gt("created_at", after).order("created_at", { ascending: true }).limit(200);
    } else {
      if (before && !Number.isNaN(Date.parse(before))) q = q.lt("created_at", before);
      q = q.order("created_at", { ascending: false }).limit(50);
    }

    const { data, error } = await q;
    if (error) throw error;
    const rows = after ? data ?? [] : (data ?? []).reverse();

    const { data: peerRead } = await db
      .from("msg_reads")
      .select("last_read_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", peerId)
      .maybeSingle();

    return NextResponse.json({
      messages: rows.map((m) => ({ id: m.id, body: m.body, createdAt: m.created_at, fromMe: m.sender_id === me })),
      hasMore: !after && (data?.length ?? 0) === 50,
      peerLastReadAt: peerRead?.last_read_at ?? null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/messages/messages  body: { conversationId, body }
 * Pengirim diambil dari sesi Clerk. Hanya untuk teman aktif yang tidak saling blokir.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUserId();
    const db = getAdmin();
    const payload = await readJson(req);
    const conversationId = payload.conversationId;
    if (!isValidUuid(conversationId)) throw new MsgError("Percakapan tidak valid.");

    const text = typeof payload.body === "string" ? payload.body.replace(/\r\n/g, "\n").trim() : "";
    if (!text) throw new MsgError("Pesan tidak boleh kosong.");
    if (text.length > MAX_MESSAGE_LENGTH) throw new MsgError(`Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter.`);

    const peerId = await getConversationPeer(db, conversationId, me);
    if (await isBlockedEitherWay(db, me, peerId)) throw new MsgError("Tidak dapat mengirim pesan ke pengguna ini.", 403);
    if (!(await areFriends(db, me, peerId))) throw new MsgError("Kalian sudah tidak berteman.", 403);

    const since = new Date(Date.now() - 60 * 1000).toISOString();
    const { count, error: rateErr } = await db
      .from("msg_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", me)
      .gte("created_at", since);
    if (rateErr) throw rateErr;
    if ((count ?? 0) >= MESSAGES_PER_MINUTE) throw new MsgError("Terlalu banyak pesan. Tunggu sebentar.", 429);

    const { data: msg, error } = await db
      .from("msg_messages")
      .insert({ conversation_id: conversationId, sender_id: me, body: text })
      .select("id, body, created_at")
      .single();
    if (error) throw error;

    await Promise.all([
      db
        .from("msg_conversations")
        .update({ last_message_preview: text.slice(0, 140), last_message_sender: me, last_message_at: msg.created_at })
        .eq("id", conversationId),
      db
        .from("msg_reads")
        .upsert({ conversation_id: conversationId, user_id: me, last_read_at: msg.created_at }, { onConflict: "conversation_id,user_id" }),
    ]);

    return NextResponse.json({ message: { id: msg.id, body: msg.body, createdAt: msg.created_at, fromMe: true } });
  } catch (err) {
    return errorResponse(err);
  }
}

