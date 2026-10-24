export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getNotesAdmin } from "@/lib/notesServer";
import {
  type NavigationPreferencesV1,
  createDefaultNavigationPreferences,
  sanitizeNavigationPreferences,
  shouldAcceptRemotePreferences,
  validateNavigationPreferencesStrict,
} from "@/lib/navigationPrefs";

const SYSTEM_UI_PREFS_TITLE = "__USICK_UI_PREFERENCES_V1__";
const CLERK_PRIVATE_META_KEY = "ui_nav_preferences_v1";

function getUiPrefsSystemUserId(userId: string): string {
  return `${userId}::ui_preferences`;
}

async function readSupabaseNavPrefs(
  userId: string
): Promise<{ rowId: string | null; prefs: NavigationPreferencesV1 | null }> {
  const db = getNotesAdmin();
  if (!db) {
    return { rowId: null, prefs: null };
  }

  const systemUserId = getUiPrefsSystemUserId(userId);
  const { data, error } = await db
    .from("user_notes")
    .select("id, content, updated_at")
    .eq("user_id", systemUserId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return { rowId: null, prefs: null };
  }

  const row = data[0];
  const sanitized = sanitizeNavigationPreferences(row.content);
  if (sanitized.repaired) {
    console.warn("[preferences/navigation] Recovered invalid Supabase record:", {
      reason: sanitized.reason || "schema_repair",
    });
  }

  // Gunakan updated_at baris DB apabila updatedAt pada JSON kosong/epoch
  const prefs = sanitized.preferences;
  if ((Date.parse(prefs.updatedAt) || 0) === 0 && typeof row.updated_at === "string") {
    const rowMs = Date.parse(row.updated_at);
    if (Number.isFinite(rowMs)) {
      prefs.updatedAt = new Date(rowMs).toISOString();
    }
  }

  return { rowId: row.id as string, prefs };
}

async function readClerkBackupNavPrefs(
  userId: string
): Promise<NavigationPreferencesV1 | null> {
  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const rawMeta = clerkUser.privateMetadata?.[CLERK_PRIVATE_META_KEY];
    if (!rawMeta) return null;

    const sanitized = sanitizeNavigationPreferences(rawMeta);
    if (sanitized.repaired) {
      console.warn("[preferences/navigation] Recovered invalid Clerk metadata record:", {
        reason: sanitized.reason || "schema_repair",
      });
    }
    return sanitized.preferences;
  } catch (err) {
    console.warn("[preferences/navigation] Clerk metadata fallback read warning:", (err as Error)?.message);
    return null;
  }
}

// GET /api/preferences/navigation — Muat preferensi navigasi milik pengguna yang sedang login
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Sesi belum terautentikasi atau telah kedaluwarsa.",
        },
        { status: 401 }
      );
    }

    // Tolak eksplisit upaya membaca preferensi milik akun lain melalui query parameter
    const requestedUserId =
      req.nextUrl.searchParams.get("userId") ||
      req.nextUrl.searchParams.get("targetUserId");
    if (requestedUserId && requestedUserId.trim() !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: tidak diizinkan membaca preferensi akun lain.",
        },
        { status: 403 }
      );
    }

    const { prefs: sbPrefs } = await readSupabaseNavPrefs(userId);
    const clerkPrefs = sbPrefs ? null : await readClerkBackupNavPrefs(userId);

    const resolved = sbPrefs || clerkPrefs;
    if (resolved) {
      return NextResponse.json({
        success: true,
        hasCloudRecord: true,
        preferences: resolved,
        source: sbPrefs ? "supabase" : "clerk_metadata",
      });
    }

    return NextResponse.json({
      success: true,
      hasCloudRecord: false,
      preferences: createDefaultNavigationPreferences(),
      source: "default",
    });
  } catch (err) {
    console.error("[preferences/navigation] GET unexpected error:", (err as Error)?.message);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memuat preferensi navigasi dari server.",
      },
      { status: 500 }
    );
  }
}

// POST /api/preferences/navigation — Validasi & simpan preferensi navigasi milik pengguna yang sedang login
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Sesi belum terautentikasi atau telah kedaluwarsa. Silakan login kembali.",
        },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Format JSON request tidak valid." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Payload request tidak valid." },
        { status: 400 }
      );
    }

    const bodyObj = body as Record<string, unknown>;

    // Tolak eksplisit upaya memodifikasi preferensi milik akun lain
    const targetUserId =
      typeof bodyObj.targetUserId === "string"
        ? bodyObj.targetUserId.trim()
        : typeof bodyObj.userId === "string"
          ? bodyObj.userId.trim()
          : null;
    const queryUserId =
      req.nextUrl.searchParams.get("userId") ||
      req.nextUrl.searchParams.get("targetUserId");

    if (
      (targetUserId && targetUserId !== userId) ||
      (queryUserId && queryUserId.trim() !== userId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: Anda hanya dapat mengubah preferensi akun Anda sendiri.",
        },
        { status: 403 }
      );
    }

    const rawPrefs = "preferences" in bodyObj ? bodyObj.preferences : bodyObj;
    const validation = validateNavigationPreferencesStrict(rawPrefs);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const incoming = validation.value;
    const forceOverwrite = bodyObj.force === true;

    const { rowId, prefs: existingSbPrefs } = await readSupabaseNavPrefs(userId);
    const existingPrefs = existingSbPrefs || (await readClerkBackupNavPrefs(userId));

    // Cegah request yang selesai tidak berurutan (out-of-order) menimpa versi yang lebih baru
    if (
      !forceOverwrite &&
      existingPrefs &&
      incoming.revision > 0 &&
      existingPrefs.revision > incoming.revision &&
      !shouldAcceptRemotePreferences(existingPrefs, incoming)
    ) {
      return NextResponse.json({
        success: true,
        staleIgnored: true,
        preferences: existingPrefs,
      });
    }

    const nowIso = new Date().toISOString();
    const nextRevision = Math.max(
      incoming.revision,
      (existingPrefs?.revision ?? 0) + 1,
      1
    );

    const canonicalPrefs: NavigationPreferencesV1 = {
      version: incoming.version,
      mainOrder: incoming.mainOrder,
      lainnyaOrder: incoming.lainnyaOrder,
      revision: nextRevision,
      updatedAt: nowIso,
    };

    const serialized = JSON.stringify(canonicalPrefs);
    const db = getNotesAdmin();
    const systemUserId = getUiPrefsSystemUserId(userId);
    let savedToSupabase = false;
    let savedToClerk = false;

    // 1. Primary Cloud Storage: Supabase public.user_notes (RLS service_role only)
    if (db) {
      if (rowId) {
        const { error: updateErr } = await db
          .from("user_notes")
          .update({
            title: SYSTEM_UI_PREFS_TITLE,
            content: serialized,
            updated_at: nowIso,
          })
          .eq("id", rowId)
          .eq("user_id", systemUserId);

        if (!updateErr) {
          savedToSupabase = true;
        } else {
          console.error("[preferences/navigation] Supabase update error:", updateErr.message);
        }
      } else {
        const { error: insertErr } = await db.from("user_notes").insert([
          {
            id: crypto.randomUUID(),
            user_id: systemUserId,
            title: SYSTEM_UI_PREFS_TITLE,
            content: serialized,
            is_pinned: false,
            created_at: nowIso,
            updated_at: nowIso,
            deleted_at: null,
          },
        ]);

        if (!insertErr) {
          savedToSupabase = true;
        } else {
          console.error("[preferences/navigation] Supabase insert error:", insertErr.message);
        }
      }
    }

    // 2. Secondary Cloud Backup: Clerk privateMetadata (atomic JSON string)
    try {
      if (serialized.length < 4096) {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(userId, {
          privateMetadata: {
            [CLERK_PRIVATE_META_KEY]: serialized,
          },
        });
        savedToClerk = true;
      }
    } catch (metaErr) {
      console.warn("[preferences/navigation] Clerk metadata backup warning:", (metaErr as Error)?.message);
    }

    if (!savedToSupabase && !savedToClerk && db) {
      return NextResponse.json(
        {
          success: false,
          error: "Gagal menyimpan preferensi navigasi ke penyimpanan cloud.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: canonicalPrefs,
      savedToSupabase,
      savedToClerk,
    });
  } catch (err) {
    console.error("[preferences/navigation] POST unexpected error:", (err as Error)?.message);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan saat menyimpan preferensi navigasi.",
      },
      { status: 500 }
    );
  }
}
