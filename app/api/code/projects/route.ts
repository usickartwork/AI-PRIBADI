export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import fs from "fs";
import path from "path";

function getSupabaseClient(req: NextRequest) {
  if (!isSupabaseConfigured) return null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey);
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
  }

  return supabase;
}

// Fallback file storage helper on server
function getStorageFilePath(userId: string): string {
  const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dataDir = path.join(process.cwd(), "data", "user_code_projects");
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, `${sanitized}.json`);
  } catch {
    // Serverless fallback (/tmp)
    const tmpDir = path.join("/tmp", "user_code_projects");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return path.join(tmpDir, `${sanitized}.json`);
  }
}

function cleanProjects(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return list.filter((p) => {
    if (!p) return false;
    const id = String(p.id || "");
    const title = String(p.title || "");
    if (id === "demo-mini-soccer" || id.includes("mini-soccer") || title === "Mini Soccer Booking System") {
      return false;
    }
    return true;
  });
}

// ─── GET: Ambil daftar project user untuk sinkronisasi multi-device ────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan untuk mengambil project." },
        { status: 400 }
      );
    }

    // 1. Coba ambil dari Supabase terlebih dahulu
    if (isSupabaseConfigured) {
      try {
        const client = getSupabaseClient(req) || supabase;
        const { data, error } = await client
          .from("code_projects")
          .select("projects")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data && Array.isArray(data.projects)) {
          const cleaned = cleanProjects(data.projects);
          return NextResponse.json({
            success: true,
            data: cleaned,
            source: "supabase",
          });
        }
      } catch (err) {
        console.warn("[api/code/projects] Supabase fetch error, checking file fallback:", err);
      }
    }

    // 2. Fallback: baca dari server file storage
    try {
      const filePath = getStorageFilePath(userId);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = cleanProjects(parsed);
          return NextResponse.json({
            success: true,
            data: cleaned,
            source: "server_storage",
          });
        }
      }
    } catch (err) {
      console.warn("[api/code/projects] Server file read error:", err);
    }

    // Jika belum ada project tersimpan sama sekali, kembalikan array kosong
    return NextResponse.json({
      success: true,
      data: [],
      source: "empty",
    });
  } catch (err: any) {
    console.error("GET /api/code/projects error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengambil data project." },
      { status: 500 }
    );
  }
}

// ─── POST: Simpan dan perbarui project user untuk sinkronisasi multi-device ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, projects } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId wajib disertakan untuk menyimpan project." },
        { status: 400 }
      );
    }

    if (!Array.isArray(projects)) {
      return NextResponse.json(
        { error: "projects harus berupa array." },
        { status: 400 }
      );
    }

    const cleaned = cleanProjects(projects);

    // 1. Simpan ke server file storage (cepat & aman antar device pada server yang sama)
    try {
      const filePath = getStorageFilePath(userId);
      fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), "utf-8");
    } catch (err) {
      console.warn("[api/code/projects] Server file save error:", err);
    }

    // 2. Simpan / upsert ke database Supabase jika terkonfigurasi
    let supabaseSaved = false;
    if (isSupabaseConfigured) {
      try {
        const client = getSupabaseClient(req) || supabase;
        const { error } = await client.from("code_projects").upsert(
          {
            user_id: userId,
            projects: cleaned,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (!error) {
          supabaseSaved = true;
        } else {
          console.warn("[api/code/projects] Supabase upsert error (table may need creation):", error.message);
        }
      } catch (err) {
        console.warn("[api/code/projects] Supabase upsert exception:", err);
      }
    }

    return NextResponse.json({
      success: true,
      count: cleaned.length,
      supabaseSaved,
    });
  } catch (err: any) {
    console.error("POST /api/code/projects error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal menyimpan data project." },
      { status: 500 }
    );
  }
}

