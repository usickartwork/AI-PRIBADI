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
      .select("id, sender_id, body, message_type, reply_to_id, is_deleted, created_at")
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

    // Ambil data referensi balasan (replies) jika ada
    const replyIds = Array.from(new Set(rows.map((r) => r.reply_to_id).filter(Boolean)));
    const replyMap = new Map<string, { id: string; body: string; fromMe: boolean; isDeleted: boolean }>();
    if (replyIds.length > 0) {
      const { data: repliedMsgs } = await db
        .from("msg_messages")
        .select("id, sender_id, body, is_deleted")
        .in("id", replyIds);
      for (const rm of repliedMsgs || []) {
        replyMap.set(rm.id, {
          id: rm.id,
          body: rm.is_deleted ? "Pesan ini telah dihapus" : rm.body,
          fromMe: rm.sender_id === me,
          isDeleted: Boolean(rm.is_deleted),
        });
      }
    }

    const { data: peerRead } = await db
      .from("msg_reads")
      .select("last_read_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", peerId)
      .maybeSingle();

    return NextResponse.json({
      messages: rows.map((m) => ({
        id: m.id,
        body: m.is_deleted ? "Pesan ini telah dihapus" : m.body,
        createdAt: m.created_at,
        fromMe: m.sender_id === me,
        messageType: m.message_type || "text",
        isDeleted: Boolean(m.is_deleted),
        replyTo: m.reply_to_id ? replyMap.get(m.reply_to_id) || { id: m.reply_to_id, body: "Pesan ini telah dihapus", fromMe: false, isDeleted: true } : null,
      })),
      hasMore: !after && (data?.length ?? 0) === 50,
      peerLastReadAt: peerRead?.last_read_at ?? null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/messages/messages  body: { conversationId, body, messageType?, replyToId? }
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

    const messageType = payload.messageType === "shared_ai" ? "shared_ai" : "text";
    let replyToId: string | null = null;
    if (payload.replyToId && isValidUuid(payload.replyToId)) {
      replyToId = payload.replyToId as string;
    }

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

    // Ambil snippet reply jika ada
    let replySnippet: { id: string; body: string; fromMe: boolean; isDeleted: boolean } | null = null;
    if (replyToId) {
      const { data: replied } = await db
        .from("msg_messages")
        .select("id, sender_id, body, is_deleted")
        .eq("id", replyToId)
        .eq("conversation_id", conversationId)
        .maybeSingle();
      if (replied) {
        replySnippet = {
          id: replied.id,
          body: replied.is_deleted ? "Pesan ini telah dihapus" : replied.body,
          fromMe: replied.sender_id === me,
          isDeleted: Boolean(replied.is_deleted),
        };
      } else {
        replyToId = null;
      }
    }

    const { data: msg, error } = await db
      .from("msg_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: me,
        body: text,
        message_type: messageType,
        reply_to_id: replyToId,
      })
      .select("id, body, created_at, message_type, reply_to_id, is_deleted")
      .single();
    if (error) throw error;

    const preview = messageType === "shared_ai" ? `[AI] ${text.slice(0, 130)}` : text.slice(0, 140);
    await Promise.all([
      db
        .from("msg_conversations")
        .update({ last_message_preview: preview, last_message_sender: me, last_message_at: msg.created_at })
        .eq("id", conversationId),
      db
        .from("msg_reads")
        .upsert({ conversation_id: conversationId, user_id: me, last_read_at: msg.created_at }, { onConflict: "conversation_id,user_id" }),
    ]);

    return NextResponse.json({
      message: {
        id: msg.id,
        body: msg.body,
        createdAt: msg.created_at,
        fromMe: true,
        messageType: msg.message_type || "text",
        isDeleted: false,
        replyTo: replySnippet,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * DELETE /api/messages/messages  body: { conversationId, messageId }
 * Hapus pesan untuk semua orang (Delete for Everyone).
 * Konten pesan asli dihapus secara fisik dari database (body = ''), status is_deleted = true.
 */
export async function DELETE(req: Request) {
  try {
    const me = await requireUserId();
    const db = getAdmin();
    const url = new URL(req.url);
    const payload = await readJson(req);
    const rawMessageId = payload.messageId || url.searchParams.get("messageId");

    const messageId = typeof rawMessageId === "string" ? rawMessageId.trim() : "";
    if (!isValidUuid(messageId)) {
      throw new MsgError("Parameter penghapusan tidak valid.");
    }

    const { data: existing, error: findErr } = await db
      .from("msg_messages")
      .select("id, sender_id, is_deleted, created_at, conversation_id")
      .eq("id", messageId)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) throw new MsgError("Pesan tidak ditemukan.", 404);
    if (existing.sender_id !== me) {
      throw new MsgError("Hanya pengirim yang dapat menghapus pesan untuk semua orang.", 403);
    }

    const conversationId = existing.conversation_id;
    const peerId = await getConversationPeer(db, conversationId, me);

    if (!existing.is_deleted) {
      // Hapus isi teks dari database dan tandai tombstone
      const { error: updateErr } = await db
        .from("msg_messages")
        .update({
          body: "",
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", messageId);
      if (updateErr) throw updateErr;

      // Update preview percakapan jika ini pesan terakhir
      const { data: conv } = await db
        .from("msg_conversations")
        .select("last_message_at")
        .eq("id", conversationId)
        .maybeSingle();

      if (conv?.last_message_at === existing.created_at) {
        await db
          .from("msg_conversations")
          .update({ last_message_preview: "Pesan telah dihapus" })
          .eq("id", conversationId);
      }
    }

    return NextResponse.json({ ok: true, messageId, conversationId, peerId });
  } catch (err) {
    return errorResponse(err);
  }
}

