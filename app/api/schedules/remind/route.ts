export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendEmail, buildScheduleReminderHtml } from "@/lib/email";
import { formatScheduleDate, formatScheduleTime, formatDuration, ScheduleItem } from "@/lib/schedules";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, scheduleId, testEmail, targetSchedule } = body;

    // ─── Case 1: Tes Kirim Email Langsung untuk Verifikasi ────────────────────
    if (action === "test_email" || testEmail) {
      const schedule = targetSchedule as ScheduleItem | undefined;
      const emailRecipient = testEmail || schedule?.user_email;

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
        subject: `[Pengingat] ${title}`,
        html,
      });

      return NextResponse.json({
        success: true,
        message: `Email pengingat berhasil dikirim ke ${emailRecipient}!`,
      });
    }

    // ─── Case 2: Cron / Worker Pemrosesan Pengingat yang Jatuh Tempo ─────────
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "Supabase belum terkonfigurasi untuk background worker cron.",
      });
    }

    // Ambil semua schedule yang upcoming dan reminder_status pending
    const { data: dueSchedules, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("status", "upcoming")
      .eq("reminder_status", "pending")
      .not("user_email", "is", null);

    if (error || !dueSchedules) {
      return NextResponse.json({
        success: true,
        processed: 0,
        warning: error?.message,
      });
    }

    const now = new Date();
    const sentResults: string[] = [];

    for (const schedule of dueSchedules) {
      if (!schedule.user_email) continue;

      // Hitung waktu jadwal
      const [year, month, day] = schedule.date.split("-").map(Number);
      const [hours, minutes] = schedule.time.split(":").map(Number);
      const scheduleDate = new Date(year, month - 1, day, hours, minutes);

      // Hitung waktu pengingat seharusnya dikirim
      const reminderTime = new Date(scheduleDate.getTime() - (schedule.reminder_minutes || 15) * 60 * 1000);

      // Jika waktu sekarang sudah melewati atau sama dengan waktu reminder
      if (now >= reminderTime) {
        // Cek jika sudah lewat waktu jadwal lebih dari 1 hari, tandai skipped agar tidak spamming jadwal lama
        const oneDayPast = new Date(scheduleDate.getTime() + 24 * 60 * 60 * 1000);
        if (now > oneDayPast) {
          await supabase
            .from("schedules")
            .update({ reminder_status: "skipped" })
            .eq("id", schedule.id);
          continue;
        }

        try {
          const dateText = formatScheduleDate(schedule.date);
          const timeText = formatScheduleTime(schedule.time);
          const scheduledTimeText = `${dateText}, Pukul ${timeText}`;
          const durationText = schedule.duration_minutes ? formatDuration(schedule.duration_minutes) : undefined;

          const html = buildScheduleReminderHtml({
            scheduleTitle: schedule.title,
            scheduledTimeText,
            durationText,
            notes: schedule.description,
            reminderMinutes: schedule.reminder_minutes,
          });

          await sendEmail({
            to: schedule.user_email,
            subject: `⏰ [Pengingat] ${schedule.title}`,
            html,
          });

          // Update status menjadi sent untuk perlindungan anti-duplikasi
          await supabase
            .from("schedules")
            .update({ reminder_status: "sent" })
            .eq("id", schedule.id);

          sentResults.push(schedule.id);
        } catch (sendErr: any) {
          console.error(`Gagal mengirim reminder untuk schedule ${schedule.id}:`, sendErr);
          await supabase
            .from("schedules")
            .update({ reminder_status: "failed" })
            .eq("id", schedule.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: sentResults.length,
      sentScheduleIds: sentResults,
    });
  } catch (err: any) {
    console.error("POST /api/schedules/remind error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses pengiriman pengingat email." },
      { status: 500 }
    );
  }
}
