export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase as fallbackClient, isSupabaseConfigured } from "@/lib/supabase";

let adminClient: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
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

async function resolveUserId(req: NextRequest, fallback?: string | null): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch {}
  if (fallback && typeof fallback === "string" && fallback.trim().length > 0) {
    return fallback.trim();
  }
  return null;
}

// GET: Ambil riwayat percakapan pengguna
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = await resolveUserId(req, searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json({ error: "User ID diperlukan." }, { status: 400 });
    }

    const sb = getSupabase();
    if (!sb) {
      return NextResponse.json({ messages: [], updated_at: null });
    }

    const { data, error } = await sb
      .from("chat_history")
      .select("messages, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[api/chat/history] GET error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      messages: data?.messages ?? [],
      updated_at: data?.updated_at ?? null,
    });
  } catch (err: any) {
    console.error("[api/chat/history] unexpected GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Simpan riwayat percakapan pengguna
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = await resolveUserId(req, body.userId);

    if (!userId) {
      return NextResponse.json({ error: "User ID diperlukan." }, { status: 400 });
    }

    const sb = getSupabase();
    if (!sb) {
      return NextResponse.json({ error: "Database tidak terkonfigurasi." }, { status: 503 });
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const updatedAt = new Date().toISOString();

    const { error } = await sb.from("chat_history").upsert(
      {
        user_id: userId,
        messages,
        updated_at: updatedAt,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.warn("[api/chat/history] POST error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated_at: updatedAt });
  } catch (err: any) {
    console.error("[api/chat/history] unexpected POST error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE: Hapus seluruh riwayat percakapan pengguna
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = await resolveUserId(req, searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json({ error: "User ID diperlukan." }, { status: 400 });
    }

    const sb = getSupabase();
    if (!sb) {
      return NextResponse.json({ error: "Database tidak terkonfigurasi." }, { status: 503 });
    }

    const updatedAt = new Date().toISOString();
    const { error } = await sb.from("chat_history").upsert(
      {
        user_id: userId,
        messages: [],
        updated_at: updatedAt,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated_at: updatedAt });
  } catch (err: any) {
    console.error("[api/chat/history] unexpected DELETE error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
