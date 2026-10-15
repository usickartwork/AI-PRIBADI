export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  createGoogleCalendarEvent,
  getValidGoogleAccessToken,
  updateGoogleCalendarEvent,
} from "@/lib/googleCalendar";
import { ScheduleItem } from "@/lib/schedules";

function getSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (serviceRoleKey && supabaseUrl) {
    return createClient(supabaseUrl, serviceRoleKey);
  }
  return supabase;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scheduleId, userId, schedule: localSchedule } = body;

    if (!userId || userId === "guest") {
      return NextResponse.json(
        { error: "Login diperlukan untuk sinkronisasi ke Google Calendar." },
        { status: 401 }
      );
    }

    if (!scheduleId && !localSchedule) {
      return NextResponse.json(
        { error: "scheduleId atau data schedule diperlukan." },
        { status: 400 }
      );
    }

    // Ambil token akses Google pengguna
    const googleAccount = await getValidGoogleAccessToken(userId);
    if (!googleAccount) {
      return NextResponse.json(
        {
          error: "Akun Google Calendar belum terhubung. Silakan hubungkan akun Google Anda terlebih dahulu.",
          connected: false,
        },
        { status: 400 }
      );
    }

    let targetSchedule: ScheduleItem = localSchedule;
    const client = getSupabaseClient();

    // Jika schedule ada di Supabase, ambil data terkininya
    if (isSupabaseConfigured && scheduleId && !scheduleId.startsWith("local_")) {
      const { data, error } = await client
        .from("schedules")
        .select("*")
        .eq("id", scheduleId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        targetSchedule = data;
      }
    }

    if (!targetSchedule) {
      return NextResponse.json(
        { error: "Jadwal tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jika sudah ada google_event_id, lakukan update. Jika belum, lakukan insert.
    let eventId = targetSchedule.google_event_id;
    let htmlLink: string | undefined;

    if (eventId) {
      const updated = await updateGoogleCalendarEvent(eventId, targetSchedule, googleAccount.accessToken);
      if (!updated) {
        // Jika update gagal (misal event sudah terhapus di Google Calendar), coba buat baru
        const created = await createGoogleCalendarEvent(targetSchedule, googleAccount.accessToken);
        eventId = created.eventId;
        htmlLink = created.htmlLink;
      }
    } else {
      const created = await createGoogleCalendarEvent(targetSchedule, googleAccount.accessToken);
      eventId = created.eventId;
      htmlLink = created.htmlLink;
    }

    // Perbarui record di Supabase
    if (isSupabaseConfigured && targetSchedule.id && !targetSchedule.id.startsWith("local_")) {
      await client
        .from("schedules")
        .update({
          google_event_id: eventId,
          google_sync_status: "synced",
          google_synced_at: new Date().toISOString(),
          google_sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetSchedule.id)
        .eq("user_id", userId);
    }

    return NextResponse.json({
      success: true,
      eventId,
      htmlLink,
      google_sync_status: "synced",
    });
  } catch (err: any) {
    console.error("[google/calendar/sync] Error:", err);

    // Jika ID schedule ada di DB, catat status failed
    try {
      const body = await req.clone().json();
      if (isSupabaseConfigured && body.scheduleId && !body.scheduleId.startsWith("local_")) {
        const client = getSupabaseClient();
        await client
          .from("schedules")
          .update({
            google_sync_status: "failed",
            google_sync_error: err?.message || "Gagal sinkronisasi",
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.scheduleId)
          .eq("user_id", body.userId);
      }
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Gagal melakukan sinkronisasi ke Google Calendar.",
      },
      { status: 500 }
    );
  }
}

