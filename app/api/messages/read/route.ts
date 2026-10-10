export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { MsgError, errorResponse, getAdmin, getConversationPeer, isValidUuid, readJson, requireUserId } from "@/lib/messagesServer";

/** POST /api/messages/read  body: { conversationId } — tandai percakapan sudah dibaca. */
export async function POST(req: Request) {
  try {
    const me = await requireUserId();
    const db = getAdmin();
    const body = await readJson(req);
    const conversationId = body.conversationId;
    if (!isValidUuid(conversationId)) throw new MsgError("Percakapan tidak valid.");
    await getConversationPeer(db, conversationId, me);

    const { error } = await db
      .from("msg_reads")
      .upsert(
        { conversation_id: conversationId, user_id: me, last_read_at: new Date().toISOString() },
        { onConflict: "conversation_id,user_id" }
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

