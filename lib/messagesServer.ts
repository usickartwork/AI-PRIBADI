import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* ─── Konstanta ───────────────────────────────────────────────────────────── */
export const MAX_MESSAGE_LENGTH = 2000;
export const MESSAGES_PER_MINUTE = 30;
export const FRIEND_REQUESTS_PER_DAY = 20;

/* ─── Tipe publik (aman dikirim ke frontend, TANPA email) ─────────────────── */
export type PublicUser = {
  id: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
};

/* ─── Error helper ────────────────────────────────────────────────────────── */
export class MsgError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof MsgError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[messages] unexpected error:", err);
  return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
}

/* ─── Auth: identitas SELALU dari sesi Clerk di server ────────────────────── */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new MsgError("Silakan login terlebih dahulu.", 401);
  return userId;
}

/* ─── Supabase admin client (service role, server only) ───────────────────── */
let adminClient: SupabaseClient | null = null;
export function getAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new MsgError("Layanan Messages belum dikonfigurasi.", 503);
  if (!adminClient) {
    adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminClient;
}

/* ─── Helper umum ─────────────────────────────────────────────────────────── */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export function isValidUserId(v: unknown): v is string {
  return typeof v === "string" && /^user_[A-Za-z0-9]{6,64}$/.test(v);
}

export function isValidUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/* ─── Profil publik via Clerk ─────────────────────────────────────────────── */
type ClerkUserLike = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
};

export function toPublicUser(u: ClerkUserLike): PublicUser {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return {
    id: u.id,
    username: u.username,
    name: name || u.username || "Pengguna One Mind",
    avatarUrl: u.imageUrl || null,
  };
}

export async function getPublicUsers(ids: string[]): Promise<Map<string, PublicUser>> {
  const map = new Map<string, PublicUser>();
  const unique = Array.from(new Set(ids.filter(isValidUserId)));
  if (unique.length === 0) return map;
  const clerk = await clerkClient();
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const res = await clerk.users.getUserList({ userId: chunk, limit: chunk.length });
    for (const u of res.data) map.set(u.id, toPublicUser(u));
  }
  return map;
}

/* ─── Relasi: blokir & pertemanan ─────────────────────────────────────────── */
export async function isBlockedEitherWay(db: SupabaseClient, a: string, b: string): Promise<boolean> {
  const { data, error } = await db
    .from("msg_blocks")
    .select("id")
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function areFriends(db: SupabaseClient, a: string, b: string): Promise<boolean> {
  const { data, error } = await db
    .from("msg_friendships")
    .select("id")
    .eq("pair_key", pairKey(a, b))
    .eq("status", "accepted")
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/** Pastikan user adalah peserta percakapan; kembalikan ID lawan bicara. */
export async function getConversationPeer(
  db: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<string> {
  const { data, error } = await db
    .from("msg_conversations")
    .select("user_a, user_b")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!data || (data.user_a !== userId && data.user_b !== userId)) {
    throw new MsgError("Percakapan tidak ditemukan.", 404);
  }
  return data.user_a === userId ? data.user_b : data.user_a;
}

