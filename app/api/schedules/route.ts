export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ScheduleItem, isSchedulePast } from "@/lib/schedules";
import { getUserSubscription } from "@/lib/subscriptionServer";
import {
  getValidGoogleAccessToken,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "@/lib/googleCalendar";

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

    const client = getSupabaseClient(req) || supabase;
    const { data, error } = await client
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

    const items = data || [];
    const pastIdsToComplete: string[] = [];
    const sanitized = items.map((item: any) => {
      if (item.status === "upcoming") {
        const isPast = isSchedulePast(item.date, item.time, item.duration_minutes, item.timezone);
        if (isPast) {
          pastIdsToComplete.push(item.id);
          return { ...item, status: "completed" };
        }
      }
      return item;
    });

    if (pastIdsToComplete.length > 0) {
      try {
        await client
          .from("schedules")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .in("id", pastIdsToComplete);
      } catch (e: any) {
        console.warn("[schedules] auto sweep error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      data: sanitized,
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

    const newSchedule: any = {
      user_id: user_id,
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
      const client = getSupabaseClient(req) || supabase;

      // Cek Batasan Jumlah Jadwal Berdasarkan Paket Langganan (Free max 3, Pro max 50)
      if (user_id) {
        try {
          const sub = await getUserSubscription(user_id);
          const { count: activeCount } = await client
            .from("schedules")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user_id)
            .eq("status", "upcoming");

          if ((activeCount || 0) >= sub.scheduleLimit) {
            return NextResponse.json(
              {
                error: `Batas jadwal untuk paket ${sub.plan.toUpperCase()} Anda telah mencapai batas maksimal (${sub.scheduleLimit} jadwal aktif). ${
                  sub.plan === "free" ? "Upgrade ke Pro untuk membuat hingga 50 jadwal." : ""
                }`,
                isLimitReached: true,
                limit: sub.scheduleLimit,
                activeCount,
                plan: sub.plan,
              },
              { status: 403 }
            );
          }
        } catch (subErr) {
          console.warn("[schedules] Error checking subscription limit:", subErr);
        }
      }

      const { data, error } = await client
        .from("schedules")
        .insert([newSchedule])
        .select()
        .single();

      let finalItem: ScheduleItem = data;

      if (error) {
        console.warn("Gagal simpan ke Supabase, fallback ke respons lokal:", error.message);
        // Fallback kembalikan schedule dengan ID acak
        finalItem = {
          ...newSchedule,
          id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // ─── Otomatis Buat Event di Google Calendar jika Akun Terhubung ───────────
      if (user_id && user_id !== "guest") {
        try {
          const googleAccount = await getValidGoogleAccessToken(user_id);
          if (googleAccount) {
            try {
              const googleEvent = await createGoogleCalendarEvent(finalItem, googleAccount.accessToken);
              if (googleEvent?.eventId) {
                finalItem.google_event_id = googleEvent.eventId;
                finalItem.google_sync_status = "synced";
                finalItem.google_synced_at = new Date().toISOString();

                // Update record di Supabase jika tersimpan di database
                if (isSupabaseConfigured && finalItem.id && !finalItem.id.startsWith("local_")) {
                  await client
                    .from("schedules")
                    .update({
                      google_event_id: googleEvent.eventId,
                      google_sync_status: "synced",
                      google_synced_at: finalItem.google_synced_at,
                    })
                    .eq("id", finalItem.id);
                }
              }
            } catch (syncErr: any) {
              console.warn("[schedules] Google Calendar sync error on create:", syncErr?.message);
              finalItem.google_sync_status = "failed";
              finalItem.google_sync_error = syncErr?.message || "Gagal sinkronisasi Google Calendar";

              if (isSupabaseConfigured && finalItem.id && !finalItem.id.startsWith("local_")) {
                await client
                  .from("schedules")
                  .update({
                    google_sync_status: "failed",
                    google_sync_error: finalItem.google_sync_error,
                  })
                  .eq("id", finalItem.id);
              }
            }
          }
        } catch (gErr) {
          console.warn("[schedules] Error checking Google Calendar token:", gErr);
        }
      }

      if (error) {
        return NextResponse.json({
          success: true,
          data: finalItem,
          warning: error.message,
          source: "local_storage_fallback",
        });
      }

      return NextResponse.json({
        success: true,
        data: finalItem,
        source: "supabase",
      });
    }

    const localItem: ScheduleItem = {
      ...newSchedule,
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Coba sync untuk local item jika user login
    if (user_id && user_id !== "guest") {
      try {
        const googleAccount = await getValidGoogleAccessToken(user_id);
        if (googleAccount) {
          const googleEvent = await createGoogleCalendarEvent(localItem, googleAccount.accessToken);
          if (googleEvent?.eventId) {
            localItem.google_event_id = googleEvent.eventId;
            localItem.google_sync_status = "synced";
            localItem.google_synced_at = new Date().toISOString();
          }
        }
      } catch (gErr) {
        console.warn("[schedules] Local item Google Calendar sync error:", gErr);
      }
    }

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
      const client = getSupabaseClient(req) || supabase;
      const { data, error } = await client
        .from("schedules")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user_id) // Strict user isolation check
        .select()
        .single();

      // ─── Sinkronisasi Pembaruan ke Google Calendar jika Terhubung ──────────────
      if (user_id && user_id !== "guest") {
        try {
          const googleAccount = await getValidGoogleAccessToken(user_id);
          if (googleAccount) {
            const scheduleToSync: ScheduleItem = { ...(data || {}), ...updates, id, user_id };
            if (scheduleToSync.google_event_id) {
              try {
                await updateGoogleCalendarEvent(scheduleToSync.google_event_id, scheduleToSync, googleAccount.accessToken);
              } catch (syncErr: any) {
                console.warn("[schedules] Google Calendar sync error on update:", syncErr);
              }
            }
          }
        } catch (gErr) {
          console.warn("[schedules] Error syncing update to Google Calendar:", gErr);
        }
      }

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

    // ─── Hapus Event dari Google Calendar jika Ada ─────────────────────────────
    if (userId && userId !== "guest") {
      try {
        const googleAccount = await getValidGoogleAccessToken(userId);
        if (googleAccount && isSupabaseConfigured) {
          const client = getSupabaseClient(req) || supabase;
          const { data: scheduleToDelete } = await client
            .from("schedules")
            .select("google_event_id")
            .eq("id", id)
            .maybeSingle();

          if (scheduleToDelete?.google_event_id) {
            try {
              await deleteGoogleCalendarEvent(scheduleToDelete.google_event_id, googleAccount.accessToken);
            } catch (delErr: any) {
              console.warn("[schedules] Google Calendar delete event warning:", delErr);
            }
          }
        }
      } catch (gErr) {
        console.warn("[schedules] Error deleting from Google Calendar:", gErr);
      }
    }

    if (isSupabaseConfigured) {
      const client = getSupabaseClient(req) || supabase;
      const { error } = await client
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
