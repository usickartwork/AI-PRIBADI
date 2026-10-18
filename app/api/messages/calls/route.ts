export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  requireUserId,
  getAdmin,
  areFriends,
  isBlockedEitherWay,
  getPublicUsers,
  errorResponse,
  MsgError,
  isValidUserId,
  pairKey,
} from "@/lib/messagesServer";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const { action, peerId, conversationId, callType, roomName: reqRoomName } = body;

    if (!peerId || !isValidUserId(peerId)) {
      throw new MsgError("User ID lawan bicara tidak valid.", 400);
    }

    if (userId === peerId) {
      throw new MsgError("Tidak dapat melakukan panggilan ke diri sendiri.", 400);
    }

    const db = getAdmin();

    // 1. Verifikasi relasi: Pastikan berteman dan tidak saling memblokir
    const [blocked, friends] = await Promise.all([
      isBlockedEitherWay(db, userId, peerId),
      areFriends(db, userId, peerId),
    ]);

    if (blocked) {
      throw new MsgError("Panggilan tidak dapat dilakukan karena pengguna diblokir.", 403);
    }

    if (!friends) {
      throw new MsgError("Panggilan hanya dapat dilakukan kepada teman.", 403);
    }

    // 2. Kredensial LiveKit Cloud
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        {
          error:
            "Layanan LiveKit Cloud belum dikonfigurasi. Silakan isi LIVEKIT_URL, LIVEKIT_API_KEY, dan LIVEKIT_API_SECRET pada berkas .env.local.",
        },
        { status: 503 }
      );
    }

    // 3. Nama Room LiveKit: Unik per sesi percakapan & pasangan pengguna
    const cleanPair = [userId, peerId].sort().join("_");
    let roomName = reqRoomName;
    if (
      !roomName ||
      typeof roomName !== "string" ||
      (!roomName.startsWith(`call_${cleanPair}`) && !roomName.includes(cleanPair))
    ) {
      roomName = `call_${cleanPair}_${Date.now()}`;
    }

    // 4. Ambil profil publik pengguna untuk metadata token
    const userMap = await getPublicUsers([userId]);
    const selfUser = userMap.get(userId);
    const selfName = selfUser?.name || "Pengguna One Mind";
    const selfAvatar = selfUser?.avatarUrl || "";

    // 5. Generate LiveKit Access Token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: selfName,
      metadata: JSON.stringify({
        avatarUrl: selfAvatar,
        callType: callType === "video" ? "video" : "audio",
      }),
      ttl: "2h", // Masa berlaku token 2 jam
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      success: true,
      token,
      livekitUrl,
      roomName,
      callType: callType === "video" ? "video" : "audio",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

