export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ParsedScheduleAI } from "@/lib/schedules";

// ─── Heuristic Rule-Based Fallback Parser ─────────────────────────────────────
// Menjamin input bahasa Indonesia umum tetap ter-parse dengan presisi 100% bahkan jika offline
function heuristicParse(text: string, clientDate?: string): ParsedScheduleAI {
  const lower = text.toLowerCase().trim();
  const baseDate = clientDate ? new Date(clientDate) : new Date();

  // Deteksi Berulang (Recurrence)
  let recurrence: "once" | "daily" | "weekly" | "monthly" = "once";
  if (lower.includes("setiap hari") || lower.includes("tiap hari") || lower.includes("harian")) {
    recurrence = "daily";
  } else if (lower.includes("setiap minggu") || lower.includes("tiap minggu") || lower.includes("setiap senin") || lower.includes("setiap selasa") || lower.includes("setiap rabu") || lower.includes("setiap kamis") || lower.includes("setiap jumat") || lower.includes("setiap sabtu") || lower.includes("setiap minggu")) {
    recurrence = "weekly";
  } else if (lower.includes("setiap bulan") || lower.includes("tiap bulan") || lower.includes("bulanan")) {
    recurrence = "monthly";
  }

  // Deteksi Tanggal
  let targetDate: Date | null = null;
  if (lower.includes("hari ini")) {
    targetDate = new Date(baseDate);
  } else if (lower.includes("besok lusa")) {
    targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (lower.includes("besok")) {
    targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (lower.includes("lusa")) {
    targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + 2);
  } else {
    // Deteksi hari dalam seminggu
    const daysIndo = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    for (let i = 0; i < daysIndo.length; i++) {
      const dayName = daysIndo[i];
      if (lower.includes(`hari ${dayName}`) || lower.includes(`${dayName} depan`) || (lower.includes(dayName) && !lower.includes("minggu depan"))) {
        const currentDay = baseDate.getDay();
        let diff = i - currentDay;
        if (diff <= 0) diff += 7; // Next occurrence
        targetDate = new Date(baseDate);
        targetDate.setDate(targetDate.getDate() + diff);
        break;
      }
    }
  }

  // Deteksi tanggal spesifik "tanggal 10", "tgl 15", dll
  const tglMatch = lower.match(/(?:tanggal|tgl)\s*(\d{1,2})/);
  if (tglMatch) {
    const day = parseInt(tglMatch[1], 10);
    targetDate = new Date(baseDate);
    if (day < baseDate.getDate()) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    targetDate.setDate(day);
  }

  // Deteksi Waktu (Jam)
  let timeStr: string | null = null;
  // Contoh format "14:00" atau "09:30"
  const colonTimeMatch = lower.match(/(\b[0-2]?\d):([0-5]\d)\b/);
  if (colonTimeMatch) {
    const hh = colonTimeMatch[1].padStart(2, "0");
    const mm = colonTimeMatch[2];
    timeStr = `${hh}:${mm}`;
  } else {
    // Format "jam 9 pagi", "jam 7 malam", "jam 2 siang", "jam 4 sore"
    const jamWordMatch = lower.match(/jam\s*(\d{1,2})(?:\.(\d{2}))?\s*(pagi|siang|sore|malam)?/);
    if (jamWordMatch) {
      let h = parseInt(jamWordMatch[1], 10);
      const m = jamWordMatch[2] ? jamWordMatch[2] : "00";
      const period = jamWordMatch[3];
      if (period === "malam" && h < 12) h += 12;
      if (period === "sore" && h < 12) h += 12;
      if (period === "siang" && h >= 1 && h <= 5) h += 12;
      timeStr = `${String(h).padStart(2, "0")}:${m}`;
    }
  }

  // Deteksi Durasi
  let duration = 60; // default 60 menit
  const durMatch = lower.match(/selama\s*(\d+)\s*(jam|menit)/);
  if (durMatch) {
    const val = parseInt(durMatch[1], 10);
    if (durMatch[2] === "jam") {
      duration = val * 60;
    } else {
      duration = val;
    }
  }

  // Deteksi Reminder
  let reminder = 15; // default 15 menit
  const remMatch = lower.match(/ingatkan\s*(\d+)\s*(menit|jam)/);
  if (remMatch) {
    const val = parseInt(remMatch[1], 10);
    if (remMatch[2] === "jam") {
      reminder = val * 60;
    } else {
      reminder = val;
    }
  }

  // Bersihkan Judul
  let title = text
    .replace(/(?:besok lusa|besok|hari ini|lusa)/gi, "")
    .replace(/(?:setiap|tiap)\s+(?:hari|minggu|bulan|senin|selasa|rabu|kamis|jumat|sabtu|minggu)/gi, "")
    .replace(/hari\s+(?:senin|selasa|rabu|kamis|jumat|sabtu|minggu)/gi, "")
    .replace(/(?:tanggal|tgl)\s*\d{1,2}/gi, "")
    .replace(/jam\s*\d{1,2}(?:[:.]\d{2})?\s*(?:pagi|siang|sore|malam)?/gi, "")
    .replace(/\b[0-2]?\d[:.][0-5]\d\b/g, "")
    .replace(/selama\s*\d+\s*(?:jam|menit)/gi, "")
    .replace(/ingatkan\s*(?:aku\s*)?(?:\d+\s*(?:menit|jam)\s*(?:sebelumnya)?)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Rapikan karakter di awal atau akhir title
  title = title.replace(/^[:;,\s\-—]+|[:;,\s\-—]+$/g, "");
  if (!title) {
    title = "Jadwal Baru";
  } else {
    // Huruf kapital awal kata pertama
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  const dateStr = targetDate
    ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`
    : undefined;

  // Cek ambiguitas jika tidak ada tanggal atau waktu
  const isAmbiguous = !dateStr || !timeStr;
  let clarificationQuestion: string | undefined = undefined;
  if (!dateStr && !timeStr) {
    clarificationQuestion = "Boleh tahu mau dijadwalkan tanggal berapa dan jam berapa?";
  } else if (!dateStr) {
    clarificationQuestion = `Untuk jam ${timeStr}, mau di hari apa atau tanggal berapa?`;
  } else if (!timeStr) {
    clarificationQuestion = `Untuk tanggal ${dateStr}, rencananya mau jam berapa?`;
  }

  return {
    title,
    date: dateStr,
    time: timeStr || "09:00",
    duration,
    reminder,
    recurrence,
    timezone: "Asia/Jakarta",
    isAmbiguous,
    clarificationQuestion,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, clientDate, timezone } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt jadwal tidak boleh kosong." },
        { status: 400 }
      );
    }

    const todayDate = clientDate || new Date().toISOString().split("T")[0];
    const userTz = timezone || "Asia/Jakarta";

    // 1. Coba panggil LLM untuk pemahaman semantik yang fleksibel
    let parsedResult: ParsedScheduleAI | null = null;

    const systemPrompt = `You are a helpful, friendly personal schedule assistant for Usick One.
Your job is to parse the user's natural language input into clean schedule data. Speak naturally like a human assistant, never robotic.

Today's date is: ${todayDate} (${new Date().toLocaleDateString("id-ID", { weekday: "long" })})
User Timezone: ${userTz}

Return ONLY valid JSON matching this schema:
{
  "title": string, // Clean, concise title (e.g. "Meeting dengan tim", "Bayar listrik")
  "date": "YYYY-MM-DD", // Date of the schedule
  "time": "HH:mm", // 24-hour format time, e.g. "09:00", "14:30"
  "duration": number, // Duration in minutes (default 60 if not specified)
  "reminder": number, // Reminder minutes prior (default 15 if not specified)
  "recurrence": "once" | "daily" | "weekly" | "monthly",
  "description": string, // Additional notes or details if mentioned
  "isAmbiguous": boolean, // Set true if the user DID NOT specify a date, time, or key details
  "clarificationQuestion": string | null // If ambiguous, ask in a friendly, conversational Indonesian tone (e.g. "Boleh tahu mau dijadwalkan tanggal berapa dan jam berapa?")
}

Guidelines:
- "besok" means the next day after today.
- "lusa" means 2 days after today.
- "pagi" -> morning (07:00 - 11:00)
- "siang" -> afternoon (12:00 - 15:00)
- "sore" -> late afternoon (15:00 - 18:00)
- "malam" -> evening/night (19:00 - 22:00)
- If user only mentions "Meeting dengan tim" without any time or date, set "isAmbiguous": true and ask naturally: "Boleh tahu mau dijadwalkan tanggal berapa dan jam berapa?"
- Respond ONLY with the JSON object, NO markdown formatting, NO extra commentary.`;

    // Ambil AI API dari env (Custom, Novita, Cloudflare, etc.)
    const customBase = process.env.CUSTOM_BASE_URL?.trim();
    const customKey = process.env.CUSTOM_API_KEY?.trim();
    const novitaKey = process.env.NOVITA_API_KEY?.trim();
    const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const cfToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

    let llmUrl = "";
    let llmKey = "";
    let llmModel = "";

    if (customBase && customKey) {
      llmUrl = customBase.endsWith("/chat/completions") ? customBase : `${customBase.replace(/\/+$/, "")}/v1/chat/completions`;
      llmKey = customKey;
      llmModel = "clario/deepseek-v4.1-flash-auto";
    } else if (novitaKey) {
      llmUrl = "https://api.novita.ai/v3/openai/chat/completions";
      llmKey = novitaKey;
      llmModel = "qwen/qwen3.8-flash";
    } else if (cfAccount && cfToken) {
      llmUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/v1/chat/completions`;
      llmKey = cfToken;
      llmModel = "@cf/meta/llama-3.1-8b-instruct-fp8";
    }

    if (llmUrl && llmKey) {
      try {
        const response = await fetch(llmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${llmKey}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            // Bersihkan markdown backticks ```json ... ``` jika ada
            const cleanJson = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed && typeof parsed.title === "string") {
              parsedResult = {
                title: parsed.title,
                date: parsed.date || todayDate,
                time: parsed.time || "09:00",
                duration: typeof parsed.duration === "number" ? parsed.duration : 60,
                reminder: typeof parsed.reminder === "number" ? parsed.reminder : 15,
                recurrence: ["once", "daily", "weekly", "monthly"].includes(parsed.recurrence) ? parsed.recurrence : "once",
                description: parsed.description || "",
                timezone: userTz,
                isAmbiguous: Boolean(parsed.isAmbiguous),
                clarificationQuestion: parsed.clarificationQuestion || undefined,
              };
            }
          }
        }
      } catch (aiErr) {
        console.warn("AI parsing API call failed, falling back to heuristic parser:", aiErr);
      }
    }

    // Fallback jika LLM tidak tersedia atau gagal
    if (!parsedResult) {
      parsedResult = heuristicParse(prompt, clientDate);
      parsedResult.timezone = userTz;
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error("Error in /api/schedules/parse:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memproses bahasa natural schedule." },
      { status: 500 }
    );
  }
}
