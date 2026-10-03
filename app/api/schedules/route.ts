export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ScheduleItem } from "@/lib/schedules";

// ─── GET: Ambil seluruh schedule milik user_id tertentu ───────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan untuk mengambil schedule akun." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "local_storage_fallback",
        message: "Supabase belum terkonfigurasi. Menggunakan penyimpanan lokal.",
      });
    }

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.warn("Supabase query error (mungkin tabel belum dibuat):", error.message);
      return NextResponse.json({
        success: true,
        data: [],
        warning: error.message,
        source: "local_storage_fallback",
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      source: "supabase",
    });
  } catch (err: any) {
    console.error("GET /api/schedules error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengambil data schedule." },
      { status: 500 }
    );
  }
}

// ─── POST: Buat schedule baru untuk user_id ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      title,
      description,
      date,
      time,
      duration_minutes = 60,
      reminder_minutes = 15,
      recurrence = "once",
      timezone = "Asia/Jakarta",
      user_email,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id wajib disertakan untuk kepemilikan schedule." },
        { status: 400 }
      );
    }

    if (!title || !date || !time) {
      return NextResponse.json(
        { error: "Title, date, dan time wajib diisi." },
        { status: 400 }
      );
    }

    const newSchedule: Omit<ScheduleItem, "id" | "created_at" | "updated_at"> = {
      user_id,
      title: title.trim(),
      description: description ? description.trim() : "",
      date,
      time,
      duration_minutes: Number(duration_minutes) || 60,
      reminder_minutes: Number(reminder_minutes) || 15,
      recurrence,
      timezone,
      status: "upcoming",
      reminder_status: "pending",
      user_email: user_email?.trim() || undefined,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("schedules")
        .insert([newSchedule])
        .select()
        .single();

      if (error) {
        console.warn("Gagal simpan ke Supabase, fallback ke respons lokal:", error.message);
        // Fallback kembalikan schedule dengan ID acak
        const fallbackItem: ScheduleItem = {
          ...newSchedule,
          id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return NextResponse.json({
          success: true,
          data: fallbackItem,
          warning: error.message,
          source: "local_storage_fallback",
        });
      }

      return NextResponse.json({
        success: true,
        data,
        source: "supabase",
      });
    }

    const localItem: ScheduleItem = {
      ...newSchedule,
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: localItem,
      source: "local_storage_fallback",
    });
  } catch (err: any) {
    console.error("POST /api/schedules error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal membuat schedule baru." },
      { status: 500 }
    );
  }
}

// ─── PUT: Update schedule (status, title, waktu, dll) ─────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, user_id, ...updates } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        { error: "id dan user_id diperlukan untuk memperbarui schedule." },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("schedules")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user_id) // Strict user isolation check
        .select()
        .single();

      if (error) {
        console.warn("Gagal update di Supabase:", error.message);
        return NextResponse.json({
          success: true,
          data: { id, user_id, ...updates },
          warning: error.message,
          source: "local_storage_fallback",
        });
      }

      return NextResponse.json({
        success: true,
        data,
        source: "supabase",
      });
    }

    return NextResponse.json({
      success: true,
      data: { id, user_id, ...updates },
      source: "local_storage_fallback",
    });
  } catch (err: any) {
    console.error("PUT /api/schedules error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memperbarui schedule." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Hapus schedule berdasarkan ID dan user_id ───────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        { error: "id dan userId diperlukan untuk menghapus schedule." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", id)
        .eq("user_id", userId); // Strict user isolation check

      if (error) {
        console.warn("Gagal hapus dari Supabase:", error.message);
        return NextResponse.json({
          success: true,
          deletedId: id,
          warning: error.message,
          source: "local_storage_fallback",
        });
      }
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (err: any) {
    console.error("DELETE /api/schedules error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal menghapus schedule." },
      { status: 500 }
    );
  }
}
