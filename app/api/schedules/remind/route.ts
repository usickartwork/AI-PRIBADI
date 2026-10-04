export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendEmail, buildScheduleReminderHtml } from "@/lib/email";
import {
  formatScheduleDate,
  formatScheduleTime,
  formatDuration,
  parseScheduleDateTime,
  ScheduleItem,
} from "@/lib/schedules";

function getCronClient(req?: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (serviceRoleKey && isSupabaseConfigured) {
    return createClient(supabaseUrl, serviceRoleKey);
  }

  const authHeader = req?.headers.get("authorization");
  if (authHeader && isSupabaseConfigured) {
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

interface ProcessRemindersOptions {
  req?: NextRequest;
  userId?: string;
  clientEmail?: string;
  activeSchedules?: ScheduleItem[];
}

// ─── Shared Reminder Processor ────────────────────────────────────────────────
async function processDueReminders(options: ProcessRemindersOptions = {}) {
  const { req, userId, clientEmail, activeSchedules } = options;
  const candidates: ScheduleItem[] = [];
  const candidateIds = new Set<string>();

  // 1. Tambahkan kandidat dari payload client (jika ada)
  if (Array.isArray(activeSchedules)) {
    for (const item of activeSchedules) {
      if (item && item.status === "upcoming" && item.reminder_status !== "sent") {
        candidates.push(item);
        candidateIds.add(item.id);
      }
    }
  }

  // 2. Ambil dari database Supabase
  if (isSupabaseConfigured) {
    try {
      const client = getCronClient(req);

      // Coba panggil RPC get_due_reminders (security definer) terlebih dahulu
      let dbSchedules: any[] | null = null;
      try {
        const { data: rpcData, error: rpcErr } = await client.rpc("get_due_reminders");
        if (!rpcErr && Array.isArray(rpcData)) {
          dbSchedules = rpcData;
        }
      } catch {
        // Abaikan jika RPC belum terpasang di database
      }

      // Fallback query tabel langsung
      if (!dbSchedules) {
        let query = client
          .from("schedules")
          .select("*")
          .eq("status", "upcoming")
          .neq("reminder_status", "sent");

        if (userId) {
          query = query.eq("user_id", userId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          dbSchedules = data;
        } else if (error) {
          console.warn("[remind] Supabase query warning:", error.message);
        }
      }

      if (Array.isArray(dbSchedules)) {
        for (const item of dbSchedules) {
          if (!candidateIds.has(item.id)) {
            candidates.push(item);
            candidateIds.add(item.id);
          }
        }
      }
    } catch (queryErr) {
      console.warn("[remind] Supabase query exception:", queryErr);
    }
  }

  const now = new Date();
  const sentResults: string[] = [];
  const client = getCronClient(req);
  const defaultOwnerEmail = (process.env.GMAIL_USER || process.env.EMAIL_USER || "usick.artwork@gmail.com").trim();

  console.log(`[remind] Memeriksa ${candidates.length} kandidat jadwal pada ${now.toISOString()}...`);

  for (const schedule of candidates) {
    // Alamat penerima: email spesifik jadwal > email user login > email pemilik sistem
    const recipient = schedule.user_email || clientEmail || defaultOwnerEmail;
    if (!recipient) {
      console.warn(`[remind] Melewati jadwal ${schedule.id} (${schedule.title}) karena tidak ada alamat email penerima.`);
      continue;
    }

    // Hitung waktu jadwal dengan timezone yang presisi
    const scheduleDate = parseScheduleDateTime(
      schedule.date,
      schedule.time,
      schedule.timezone || "Asia/Jakarta"
    );

    const reminderMinutes = schedule.reminder_minutes ?? 15;
    const reminderTime = new Date(scheduleDate.getTime() - reminderMinutes * 60 * 1000);
    const oneDayPast = new Date(scheduleDate.getTime() + 24 * 60 * 60 * 1000);

    // Jika waktu jadwal sudah lewat lebih dari 1 hari, tandai skipped agar tidak spamming
    if (now > oneDayPast) {
      if (isSupabaseConfigured && !schedule.id.startsWith("local_")) {
        await client
          .from("schedules")
          .update({ reminder_status: "skipped" })
          .eq("id", schedule.id);
      }
      continue;
    }

    // Cek apakah waktu saat ini sudah mencapai atau melewati waktu pengingat
    const isDue = now >= reminderTime;
    console.log(
      `[remind] Jadwal: "${schedule.title}" (${schedule.date} ${schedule.time}) | Reminder: ${reminderTime.toISOString()} | Now: ${now.toISOString()} | Due: ${isDue}`
    );

    if (isDue) {
      try {
        const dateText = formatScheduleDate(schedule.date);
        const timeText = formatScheduleTime(schedule.time);
        const scheduledTimeText = `${dateText}, Pukul ${timeText} WIB`;
        const durationText = schedule.duration_minutes
          ? formatDuration(schedule.duration_minutes)
          : undefined;

        const html = buildScheduleReminderHtml({
          scheduleTitle: schedule.title,
          scheduledTimeText,
          durationText,
          notes: schedule.description,
          reminderMinutes,
        });

        console.log(`[remind] Mengirim email pengingat "${schedule.title}" ke ${recipient}...`);
        await sendEmail({
          to: recipient,
          subject: `⏰ [Pengingat] ${schedule.title} (${timeText} WIB)`,
          html,
        });
        console.log(`[remind] Berhasil mengirim email pengingat untuk jadwal ${schedule.id}!`);

        // Tandai status pengingat berhasil dikirim (anti-duplikasi)
        if (isSupabaseConfigured && !schedule.id.startsWith("local_")) {
          let updatedViaRpc = false;
          try {
            const { error: rpcErr } = await client.rpc("mark_reminder_sent", {
              schedule_id: schedule.id,
              new_status: "sent",
            });
            if (!rpcErr) updatedViaRpc = true;
          } catch {
            // Abaikan jika RPC belum ada
          }

          if (!updatedViaRpc) {
            await client
              .from("schedules")
              .update({ reminder_status: "sent", updated_at: new Date().toISOString() })
              .eq("id", schedule.id);
          }
        }

        sentResults.push(schedule.id);
      } catch (sendErr: any) {
        console.error(`[remind] Gagal mengirim reminder email untuk schedule ${schedule.id}:`, sendErr?.message || sendErr);
        if (isSupabaseConfigured && !schedule.id.startsWith("local_")) {
          await client
            .from("schedules")
            .update({ reminder_status: "failed" })
            .eq("id", schedule.id);
        }
      }
    }
  }

  return {
    success: true,
    processed: sentResults.length,
    sentScheduleIds: sentResults,
    candidatesCount: candidates.length,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

// ─── GET: Dipanggil oleh Vercel Cron / Scheduled Job ─────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const clientEmail = searchParams.get("email") || undefined;

    const result = await processDueReminders({ req, userId, clientEmail });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("GET /api/schedules/remind error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses pengiriman pengingat email." },
      { status: 500 }
    );
  }
}

// ─── POST: Dipanggil manual atau tes kirim email langsung / background sync ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, testEmail, targetSchedule, userId, userEmail, activeSchedules } = body;

    // Tes Kirim Email Langsung untuk Verifikasi
    if (action === "test_email" || testEmail) {
      const schedule = targetSchedule as ScheduleItem | undefined;
      const defaultOwner = (process.env.GMAIL_USER || process.env.EMAIL_USER || "usick.artwork@gmail.com").trim();
      const emailRecipient = testEmail || schedule?.user_email || userEmail || defaultOwner;

      if (!emailRecipient) {
        return NextResponse.json(
          { error: "Email tujuan diperlukan untuk mengirim tes pengingat." },
          { status: 400 }
        );
      }

      const title = schedule?.title || "Tes Pengingat Jadwal Usick One";
      const dateText = schedule?.date ? formatScheduleDate(schedule.date) : "Hari Ini";
      const timeText = schedule?.time ? formatScheduleTime(schedule.time) : "09:00 WIB";
      const scheduledTimeText = `${dateText}, Pukul ${timeText}`;
      const durationText = schedule?.duration_minutes ? formatDuration(schedule.duration_minutes) : undefined;
      const notes = schedule?.description || "Ini adalah pesan verifikasi bahwa sistem email pengingat Usick AI Schedule Anda sudah terhubung dengan baik.";

      const html = buildScheduleReminderHtml({
        scheduleTitle: title,
        scheduledTimeText,
        durationText,
        notes,
        reminderMinutes: schedule?.reminder_minutes ?? 15,
      });

      await sendEmail({
        to: emailRecipient,
        subject: `⏰ [Tes Pengingat] ${title}`,
        html,
      });

      return NextResponse.json({
        success: true,
        message: `Email pengingat berhasil dikirim ke ${emailRecipient}!`,
      });
    }

    // Cron / Worker Pemrosesan Pengingat yang Jatuh Tempo
    const result = await processDueReminders({
      req,
      userId,
      clientEmail: userEmail,
      activeSchedules,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("POST /api/schedules/remind error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses pengiriman pengingat email." },
      { status: 500 }
    );
  }
}
