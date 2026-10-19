import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase as fallbackClient, isSupabaseConfigured } from "@/lib/supabase";
import crypto from "crypto";

export interface SharedLinkRecord {
  id: string;
  owner_id: string;
  content_type: string;
  content_id: string;
  public_token: string;
  title_snapshot: string;
  messages_snapshot: any[];
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
}

export interface SharedLinkSummary {
  id: string;
  owner_id?: string;
  content_type: string;
  content_id: string;
  public_token: string;
  title_snapshot: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export class ShareError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireUserId(): Promise<string> {
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch {}
  throw new ShareError("Silakan masuk (login) terlebih dahulu untuk membagikan project.", 401);
}

let adminClient: SupabaseClient | null = null;
export function getShareAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key && url !== "https://placeholder.supabase.co") {
    if (!adminClient) {
      adminClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return adminClient;
  }
  return isSupabaseConfigured ? fallbackClient : null;
}

// Generate token publik acak yang aman dan sulit ditebak (32 karakter hex)
export function generatePublicToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Bersihkan pesan untuk snapshot publik (hanya simpan data esensial, tanpa metadata sensitif internal)
export function sanitizeMessagesForSnapshot(messages: any[]): any[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    id: String(m.id || crypto.randomUUID()),
    role: m.role === "assistant" ? "assistant" : "user",
    content: typeof m.content === "string" ? m.content : "",
    image: typeof m.image === "string" ? m.image : undefined,
    fileName: typeof m.fileName === "string" ? m.fileName : undefined,
    sources: Array.isArray(m.sources) ? m.sources : undefined,
    model: typeof m.model === "string" ? m.model : undefined,
  }));
}

// Ambil tautan publik aktif berdasarkan public_token (tanpa autentikasi, publik)
export async function getPublicSharedLink(token: string): Promise<SharedLinkRecord | null> {
  const db = getShareAdmin();
  if (!db || !token || typeof token !== "string") return null;

  const cleanToken = token.trim();
  if (cleanToken.length < 8) return null;

  const { data, error } = await db
    .from("shared_links")
    .select("*")
    .eq("public_token", cleanToken)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    console.warn("[shareServer] getPublicSharedLink error:", error.message);
    return null;
  }

  return (data as SharedLinkRecord) || null;
}

// Cari apakah sudah ada tautan aktif untuk konten & pemilik tertentu
export async function getExistingSharedLink(
  ownerId: string,
  contentId: string,
  contentType = "chat"
): Promise<SharedLinkRecord | null> {
  const db = getShareAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from("shared_links")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("content_id", contentId)
    .eq("content_type", contentType)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[shareServer] getExistingSharedLink error:", error.message);
    return null;
  }

  return (data as SharedLinkRecord) || null;
}

// Buat atau perbarui tautan bersama (idempotent: jika sudah ada, perbarui snapshot tanpa buat token duplikat)
export async function createOrUpdateSharedLink({
  ownerId,
  contentId,
  contentType = "chat",
  title,
  messages,
}: {
  ownerId: string;
  contentId: string;
  contentType?: string;
  title: string;
  messages: any[];
}): Promise<SharedLinkRecord> {
  const db = getShareAdmin();
  if (!db) {
    throw new ShareError("Database tidak terhubung.", 503);
  }

  const cleanTitle = (title || "Percakapan Usick One").trim().slice(0, 200);
  const sanitizedMessages = sanitizeMessagesForSnapshot(messages);

  if (sanitizedMessages.length === 0) {
    throw new ShareError("Tidak dapat membagikan percakapan kosong.", 400);
  }

  // Cek apakah tautan aktif sudah ada
  const existing = await getExistingSharedLink(ownerId, contentId, contentType);

  if (existing) {
    // Perbarui snapshot konten & waktu pembaruan
    const now = new Date().toISOString();
    const { data, error } = await db
      .from("shared_links")
      .update({
        title_snapshot: cleanTitle,
        messages_snapshot: sanitizedMessages,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      console.error("[shareServer] update existing shared link error:", error);
      throw new ShareError("Gagal memperbarui tautan bersama: " + error.message, 500);
    }

    return data as SharedLinkRecord;
  }

  // Buat tautan baru dengan token unik
  const publicToken = generatePublicToken();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("shared_links")
    .insert({
      owner_id: ownerId,
      content_type: contentType,
      content_id: contentId,
      public_token: publicToken,
      title_snapshot: cleanTitle,
      messages_snapshot: sanitizedMessages,
      created_at: now,
      updated_at: now,
      revoked_at: null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[shareServer] insert shared link error:", error);
    throw new ShareError("Gagal membuat tautan bersama: " + error.message, 500);
  }

  return data as SharedLinkRecord;
}

// Ambil daftar seluruh tautan aktif milik user untuk halaman Shared Links Management
export async function listUserSharedLinks(ownerId: string): Promise<SharedLinkSummary[]> {
  const db = getShareAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from("shared_links")
    .select("id, content_type, content_id, public_token, title_snapshot, messages_snapshot, created_at, updated_at")
    .eq("owner_id", ownerId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[shareServer] listUserSharedLinks error:", error.message);
    return [];
  }

  return ((data as any[]) || []).map((row) => ({
    id: row.id,
    content_type: row.content_type,
    content_id: row.content_id,
    public_token: row.public_token,
    title_snapshot: row.title_snapshot || "Untitled Project",
    created_at: row.created_at,
    updated_at: row.updated_at,
    message_count: Array.isArray(row.messages_snapshot) ? row.messages_snapshot.length : 0,
  }));
}

// Cabut / hapus tautan bersama (soft delete dengan mencatat revoked_at)
export async function revokeSharedLink(ownerId: string, linkIdOrToken: string): Promise<boolean> {
  const db = getShareAdmin();
  if (!db) {
    throw new ShareError("Database tidak terhubung.", 503);
  }

  const now = new Date().toISOString();

  // Match either by UUID id or public_token, ensuring owner_id strictly matches
  let query = db
    .from("shared_links")
    .update({ revoked_at: now })
    .eq("owner_id", ownerId)
    .is("revoked_at", null);

  if (linkIdOrToken.length === 32 || !linkIdOrToken.includes("-")) {
    // Likely a public_token
    query = query.or(`id.eq.${linkIdOrToken},public_token.eq.${linkIdOrToken}`);
  } else {
    // UUID
    query = query.eq("id", linkIdOrToken);
  }

  const { error, count } = await query;
  if (error) {
    console.error("[shareServer] revokeSharedLink error:", error);
    throw new ShareError("Gagal mencabut tautan: " + error.message, 500);
  }

  return true;
}

