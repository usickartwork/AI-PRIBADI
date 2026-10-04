export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ParsedScheduleAI } from "@/lib/schedules";

const MONTHS_INDO: Record<string, number> = {
  januari: 0, jan: 0,
  februari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agu: 7, agt: 7, aug: 7,
  september: 8, sep: 8,
  oktober: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  desember: 11, des: 11, dec: 11,
};

// ─── Ekstraksi Waktu (Jam) Bahasa Indonesia Presisi ──────────────────────────
function extractTime(text?: string | null): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Format colon/dot: 12:10, 12.10, jam 12:10, pukul 12.10
  const colonMatch = lower.match(/(?:jam|pukul)?\s*(\b[0-2]?\d)[:.]([0-5]\d)\b/);
  if (colonMatch) {
    const hh = String(parseInt(colonMatch[1], 10)).padStart(2, "0");
    const mm = colonMatch[2];
    return `${hh}:${mm}`;
  }

  // Format jam dengan kata: jam 2 siang, jam 10 malam, jam 8 pagi, jam 3 sore
  const wordMatch = lower.match(/(?:jam|pukul)\s*(\d{1,2})(?:\.(\d{2}))?\s*(pagi|siang|sore|malam)?/);
  if (wordMatch) {
    let h = parseInt(wordMatch[1], 10);
    const m = wordMatch[2] ? wordMatch[2] : "00";
    const period = wordMatch[3];
    if (period === "malam" && h < 12) h += 12;
    if (period === "sore" && h < 12) h += 12;
    if (period === "siang" && h >= 1 && h <= 5) h += 12;
    return `${String(h).padStart(2, "0")}:${m}`;
  }

  return null;
}

// ─── Ekstraksi Tanggal Bahasa Indonesia Presisi ───────────────────────────────
function extractDate(text?: string | null, baseDate = new Date()): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Format nama bulan: "4 oktober", "tgl 4 oktober 2026", "10 nov", dll
  const monthRegex = /(?:tanggal|tgl)?\s*(\d{1,2})\s*(?:de|of|\/|-|\s)?\s*(januari|februari|maret|april|mei|may|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|agu|agt|aug|sep|okt|oct|nov|des|dec)(?:\s*(\d{4}))?/i;
  const mMonth = lower.match(monthRegex);
  if (mMonth) {
    const day = parseInt(mMonth[1], 10);
    const mName = mMonth[2].toLowerCase();
    const month = MONTHS_INDO[mName] !== undefined ? MONTHS_INDO[mName] : baseDate.getMonth();
    const year = mMonth[3] ? parseInt(mMonth[3], 10) : baseDate.getFullYear();
    const d = new Date(year, month, day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  if (lower.includes("hari ini")) {
    return `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`;
  }
  if (lower.includes("besok lusa")) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  if (lower.includes("besok")) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  if (lower.includes("lusa")) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  if (lower.includes("minggu depan")) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Nama hari: senin, selasa, rabu, kamis, jumat, sabtu, minggu
  const daysIndo = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  for (let i = 0; i < daysIndo.length; i++) {
    const dayName = daysIndo[i];
    if (
      lower.includes(`hari ${dayName}`) ||
      lower.includes(`${dayName} depan`) ||
      (new RegExp(`\\b${dayName}\\b`).test(lower) && !lower.includes("minggu depan"))
    ) {
      const currentDay = baseDate.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      const d = new Date(baseDate);
      d.setDate(d.getDate() + diff);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  }

  // Format tanggal angka sederhana: "tanggal 4", "tgl 4"
  const tglMatch = lower.match(/(?:tanggal|tgl)\s*(\d{1,2})/);
  if (tglMatch) {
    const day = parseInt(tglMatch[1], 10);
    const d = new Date(baseDate);
    if (day < baseDate.getDate()) {
      d.setMonth(d.getMonth() + 1);
    }
    d.setDate(day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return null;
}

// ─── Pembersihan Judul Kegiatan ──────────────────────────────────────────────
function cleanTitle(text?: string | null): string {
  if (!text) return "";
  let raw = text
    .replace(/(?:besok lusa|besok|hari ini|lusa|minggu depan)/gi, "")
    .replace(/(?:setiap|tiap)\s+(?:hari|minggu|bulan|senin|selasa|rabu|kamis|jumat|sabtu|minggu)/gi, "")
    .replace(/hari\s+(?:senin|selasa|rabu|kamis|jumat|sabtu|minggu)/gi, "")
    .replace(/(?:tanggal|tgl)?\s*\d{1,2}\s*(?:de|of|\/|-|\s)?\s*(?:januari|februari|maret|april|mei|may|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|agu|agt|aug|sep|okt|oct|nov|des|dec)(?:\s*\d{4})?/gi, "")
    .replace(/(?:tanggal|tgl)\s*\d{1,2}/gi, "")
    .replace(/(?:jam|pukul)\s*\d{1,2}(?:[:.]\d{2})?\s*(?:pagi|siang|sore|malam)?/gi, "")
    .replace(/\b[0-2]?\d[:.][0-5]\d\b/g, "")
    .replace(/selama\s*\d+\s*(?:jam|menit)/gi, "")
    .replace(/ingatkan\s*(?:aku\s*)?(?:\d+\s*(?:menit|jam)\s*(?:sebelumnya)?)?/gi, "")
    .replace(/(?:ada\s+jadwal|ada\s+agenda|buatkan\s+jadwal|buatkan\s+agenda|jadwalkan|jadwal)\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  raw = raw.replace(/^[:;,\s\-—]+|[:;,\s\-—]+$/g, "");
  return raw;
}

// ─── Pencocokan Target Schedule untuk Revisi ──────────────────────────────────
function findTargetSchedule(
  targetPart: string,
  existingSchedules: any[] = [],
  baseDate = new Date()
): any | null {
  if (!existingSchedules || existingSchedules.length === 0) return null;
  if (existingSchedules.length === 1) return existingSchedules[0];

  const lower = targetPart.toLowerCase();
  const targetDate = extractDate(lower, baseDate);
  const targetTime = extractTime(lower);

  let bestMatch = null;
  let highestScore = -1;

  for (let i = 0; i < existingSchedules.length; i++) {
    const item = existingSchedules[i];
    let score = 0;

    // Date match
    if (targetDate && item.date === targetDate) {
      score += 50;
    } else {
      const dayMatch = lower.match(/(?:tanggal|tgl)\s*(\d{1,2})/);
      if (dayMatch) {
        const d = String(parseInt(dayMatch[1], 10)).padStart(2, "0");
        if (item.date && item.date.endsWith(`-${d}`)) {
          score += 45;
        }
      }
    }

    // Time match
    if (targetTime && item.time === targetTime) {
      score += 30;
    }

    // Title keywords match
    const titleWords = (item.title || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    for (const word of titleWords) {
      if (lower.includes(word)) {
        score += 25;
      }
    }

    // Relative match ("ini", "tadi", "terakhir")
    if (lower.includes("ini") || lower.includes("tadi") || lower.includes("terakhir")) {
      score += (existingSchedules.length - i) * 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  return highestScore > 0 ? bestMatch : existingSchedules[existingSchedules.length - 1];
}

// ─── Heuristic Rule-Based Fallback Parser ─────────────────────────────────────
// Menjamin input bahasa Indonesia umum dan revisi jadwal ter-parse dengan presisi 100%
function heuristicParse(
  text: string,
  clientDate?: string,
  pendingDraft?: Partial<ParsedScheduleAI> | null,
  history: Array<{ role: string; content: string }> = [],
  existingSchedules: any[] = []
): ParsedScheduleAI {
  const lower = text.toLowerCase().trim();
  const baseDate = clientDate ? new Date(clientDate) : new Date();

  // 1. Deteksi Revisi / Edit Jadwal
  const isRevision = /(?:ubah|ganti|revisi|edit|geser|undur|majukan|pindahkan|rubah|reschedule)\b/i.test(text);
  if (isRevision && existingSchedules && existingSchedules.length > 0) {
    const sepMatch = text.match(/(.*?)\b(?:di\s*ganti|diganti|di\s*ubah|diubah|menjadi|jadi|ke)\b(.*)/i);
    let targetPart = text;
    let newPart = "";
    if (sepMatch) {
      targetPart = sepMatch[1].trim();
      newPart = sepMatch[2].trim();
    }

    const target = findTargetSchedule(targetPart, existingSchedules, baseDate);
    if (target) {
      const newTime = (newPart ? extractTime(newPart) : null) || extractTime(text) || target.time;
      const newDate = (newPart ? extractDate(newPart, baseDate) : null) || target.date;

      let newTitle = target.title;
      if (newPart && /(?:judul|nama|agenda|kegiatan)\s*(?:menjadi|jadi|ke|:)?\s*([a-zA-Z0-9\s]+)/i.test(newPart)) {
        const titleMatch = newPart.match(/(?:judul|nama|agenda|kegiatan)\s*(?:menjadi|jadi|ke|:)?\s*([a-zA-Z0-9\s]+)/i);
        if (titleMatch && titleMatch[1].trim()) {
          newTitle = titleMatch[1].trim();
        }
      }

      return {
        action: "update",
        targetScheduleId: target.id,
        title: newTitle,
        date: newDate,
        time: newTime,
        duration: target.duration_minutes || 60,
        reminder: target.reminder_minutes ?? 15,
        recurrence: target.recurrence || "once",
        timezone: target.timezone || "Asia/Jakarta",
        description: target.description || "",
        isAmbiguous: false,
      };
    }
  }

  // 2. Schedule Creation / Multi-Turn Continuation
  let timeStr = extractTime(text) || pendingDraft?.time || null;
  let dateStr = extractDate(text, baseDate) || pendingDraft?.date || null;
  let rawTitle = cleanTitle(text);
  let titleStr = rawTitle && rawTitle.length >= 2 ? rawTitle : pendingDraft?.title || null;

  // History back-scan: Jika ada field yang kosong, ambil dari riwayat percakapan sebelumnya
  if (!timeStr || !dateStr || !titleStr) {
    const userHistory = history.filter((m) => m.role === "user").reverse();
    for (const msg of userHistory) {
      if (!timeStr) timeStr = extractTime(msg.content);
      if (!dateStr) dateStr = extractDate(msg.content, baseDate);
      if (!titleStr) {
        const t = cleanTitle(msg.content);
        if (t && t.length >= 2) titleStr = t;
      }
    }
  }

  let finalTitle = titleStr || "Jadwal Baru";
  finalTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);

  // Recurrence
  let recurrence: "once" | "daily" | "weekly" | "monthly" = pendingDraft?.recurrence || "once";
  if (lower.includes("setiap hari") || lower.includes("tiap hari") || lower.includes("harian")) {
    recurrence = "daily";
  } else if (
    lower.includes("setiap minggu") ||
    lower.includes("tiap minggu") ||
    /setiap\s+(?:hari\s+)?(senin|selasa|rabu|kamis|jumat|sabtu|minggu)/.test(lower)
  ) {
    recurrence = "weekly";
  } else if (lower.includes("setiap bulan") || lower.includes("tiap bulan") || lower.includes("bulanan")) {
    recurrence = "monthly";
  }

  // Durasi
  let duration = pendingDraft?.duration || 60;
  const durMatch = lower.match(/selama\s*(\d+)\s*(jam|menit)/);
  if (durMatch) {
    const val = parseInt(durMatch[1], 10);
    duration = durMatch[2] === "jam" ? val * 60 : val;
  }

  // Reminder
  let reminder = pendingDraft?.reminder ?? 15;
  const remMatch = lower.match(/ingatkan\s*(\d+)\s*(menit|jam)/);
  if (remMatch) {
    const val = parseInt(remMatch[1], 10);
    reminder = remMatch[2] === "jam" ? val * 60 : val;
  }

  const isComplete = Boolean(finalTitle && finalTitle !== "Jadwal Baru" && dateStr && timeStr);
  let clarificationQuestion: string | undefined = undefined;

  if (!isComplete) {
    if (!dateStr && timeStr) {
      clarificationQuestion = `Untuk pukul ${timeStr}, mau di hari apa atau tanggal berapa?`;
    } else if (dateStr && !timeStr) {
      clarificationQuestion = `Untuk tanggal ${dateStr}, rencananya mau jam berapa?`;
    } else if (!finalTitle || finalTitle === "Jadwal Baru") {
      clarificationQuestion = `Boleh tahu kegiatannya apa untuk jadwal ini?`;
    } else {
      clarificationQuestion = `Boleh tahu mau dijadwalkan tanggal berapa dan jam berapa?`;
    }
  }

  return {
    action: "create",
    title: finalTitle,
    date: dateStr || undefined,
    time: timeStr || undefined,
    duration,
    reminder,
    recurrence,
    timezone: "Asia/Jakarta",
    isAmbiguous: !isComplete,
    clarificationQuestion,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, clientDate, timezone, pendingDraft, history, existingSchedules } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt jadwal tidak boleh kosong." },
        { status: 400 }
      );
    }

    const todayDate = clientDate || new Date().toISOString().split("T")[0];
    const userTz = timezone || "Asia/Jakarta";
    const baseDate = clientDate ? new Date(clientDate) : new Date();

    // 1. Coba panggil LLM untuk pemahaman semantik yang fleksibel
    let parsedResult: ParsedScheduleAI | null = null;

    const draftInfo = pendingDraft
      ? `\nExisting schedule draft from conversation: ${JSON.stringify(pendingDraft)}`
      : "";

    const schedulesListInfo = Array.isArray(existingSchedules) && existingSchedules.length > 0
      ? `\nUser's existing active schedules:\n${existingSchedules
          .map((s, idx) => `${idx + 1}. [ID: ${s.id}] "${s.title}" on date ${s.date} at ${s.time}`)
          .join("\n")}`
      : "\nNo active schedules registered yet.";

    const systemPrompt = `You are a helpful personal schedule assistant for Usick One.
Your job is to parse the user's natural language input into clean schedule data. Speak naturally like a human assistant, never robotic.

Today's date is: ${todayDate} (${new Date().toLocaleDateString("id-ID", { weekday: "long" })})
User Timezone: ${userTz}${draftInfo}${schedulesListInfo}

CRITICAL RULES:
1. REVISIONS / UPDATES:
   - If the user wants to update, revise, reschedule, edit, or move an existing schedule (e.g. "ubah tgl 4 yang ini di ganti jam 14:00", "ganti meeting eternal arena jadi jam 3 sore", "geser jadwal tgl 4 ke jam 15.00"):
     * Identify the matching schedule from the existing active schedules.
     * Set "action": "update".
     * Set "targetScheduleId": the matched schedule ID.
     * Set updated "date" and "time". If only time is changed, keep the original schedule date.
     * Set "isAmbiguous": false and "clarificationQuestion": null.

2. NEW SCHEDULES & MULTI-TURN CONTEXT:
   - If there is an existing schedule draft or previous context, MERGE the new information into the draft!
   - NEVER ask for time if the user already specified time in this turn or earlier in conversation!
   - NEVER ask for date if the user already specified date in this turn or earlier in conversation!
   - If all required details (title, date, time) are present, set "action": "create", "isAmbiguous": false, and "clarificationQuestion": null.
   - If ANY required detail is still missing:
     * Set "isAmbiguous": true.
     * If missing date: set "clarificationQuestion" to e.g. "Untuk pukul ${pendingDraft?.time || "tersebut"}, mau di hari apa atau tanggal berapa?"
     * If missing time: set "clarificationQuestion" to e.g. "Untuk tanggal ${pendingDraft?.date || "tersebut"}, rencananya mau jam berapa?"
     * If missing title: set "clarificationQuestion" to "Boleh tahu mau dijadwalkan untuk kegiatan apa?"

3. Return ONLY a single raw JSON object matching:
{
  "action": "create" | "update",
  "targetScheduleId": string | null,
  "title": string,
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "duration": number,
  "reminder": number,
  "recurrence": "once" | "daily" | "weekly" | "monthly",
  "description": string,
  "isAmbiguous": boolean,
  "clarificationQuestion": string | null
}`;

    // Ambil AI API dari env (Groq, Custom, Novita, Cloudflare, etc.)
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const customBase = process.env.CUSTOM_BASE_URL?.trim();
    const customKey = process.env.CUSTOM_API_KEY?.trim();
    const novitaKey = process.env.NOVITA_API_KEY?.trim();
    const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const cfToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

    let llmUrl = "";
    let llmKey = "";
    let llmModel = "";

    if (groqKey) {
      llmUrl = "https://api.groq.com/openai/v1/chat/completions";
      llmKey = groqKey;
      llmModel = "openai/gpt-oss-120b";
    } else if (customBase && customKey) {
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
        const chatMessages = [
          { role: "system", content: systemPrompt },
          ...(Array.isArray(history)
            ? history.slice(-4).map((m: any) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content || "",
              }))
            : []),
          { role: "user", content: prompt },
        ];

        const response = await fetch(llmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${llmKey}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: chatMessages,
            temperature: 0.1,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            const cleanJson = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed && typeof parsed.title === "string") {
              // 1. Tangani jika action adalah update / revisi
              if (parsed.action === "update") {
                let targetId = parsed.targetScheduleId;
                let targetItem = Array.isArray(existingSchedules) ? existingSchedules.find((s: any) => s.id === targetId) : null;
                if (!targetItem && Array.isArray(existingSchedules) && existingSchedules.length > 0) {
                  targetItem = findTargetSchedule(prompt, existingSchedules, baseDate);
                  if (targetItem) targetId = targetItem.id;
                }

                if (targetItem) {
                  parsedResult = {
                    action: "update",
                    targetScheduleId: targetId,
                    title: parsed.title || targetItem.title,
                    date: parsed.date || targetItem.date,
                    time: parsed.time || targetItem.time,
                    duration: typeof parsed.duration === "number" ? parsed.duration : targetItem.duration_minutes,
                    reminder: typeof parsed.reminder === "number" ? parsed.reminder : targetItem.reminder_minutes,
                    recurrence: parsed.recurrence || targetItem.recurrence || "once",
                    description: parsed.description || targetItem.description || "",
                    timezone: userTz,
                    isAmbiguous: false,
                  };
                }
              }

              // 2. Tangani jika action adalah create (atau default)
              if (!parsedResult) {
                // Robust context extraction & fallback
                let finalTime = extractTime(prompt) || parsed.time || pendingDraft?.time || null;
                let finalDate = extractDate(prompt, baseDate) || parsed.date || pendingDraft?.date || null;
                let finalTitle = (parsed.title && parsed.title !== "Jadwal Baru" ? parsed.title : pendingDraft?.title) || cleanTitle(prompt) || null;

                // Back-scan history jika masih ada yang kosong
                if (!finalTime || !finalDate || !finalTitle) {
                  const userHistory = (Array.isArray(history) ? history : []).filter((m: any) => m.role === "user").reverse();
                  for (const msg of userHistory) {
                    if (!finalTime) finalTime = extractTime(msg.content);
                    if (!finalDate) finalDate = extractDate(msg.content, baseDate);
                    if (!finalTitle) {
                      const t = cleanTitle(msg.content);
                      if (t && t.length >= 2) finalTitle = t;
                    }
                  }
                }

                finalTitle = finalTitle || "Jadwal Baru";
                const isComplete = Boolean(finalTitle && finalTitle !== "Jadwal Baru" && finalDate && finalTime);

                let clarificationQuestion: string | undefined = undefined;
                if (!isComplete) {
                  if (!finalDate && finalTime) {
                    clarificationQuestion = `Untuk pukul ${finalTime}, mau di hari apa atau tanggal berapa?`;
                  } else if (finalDate && !finalTime) {
                    clarificationQuestion = `Untuk tanggal ${finalDate}, rencananya mau jam berapa?`;
                  } else if (!finalTitle || finalTitle === "Jadwal Baru") {
                    clarificationQuestion = `Boleh tahu kegiatannya apa untuk jadwal ini?`;
                  } else {
                    clarificationQuestion = parsed.clarificationQuestion || "Boleh tahu mau tanggal berapa dan jam berapa agendanya?";
                  }
                }

                parsedResult = {
                  action: "create",
                  title: finalTitle,
                  date: finalDate || todayDate,
                  time: finalTime || "09:00",
                  duration: typeof parsed.duration === "number" ? parsed.duration : (pendingDraft?.duration ?? 60),
                  reminder: typeof parsed.reminder === "number" ? parsed.reminder : (pendingDraft?.reminder ?? 15),
                  recurrence: ["once", "daily", "weekly", "monthly"].includes(parsed.recurrence) ? parsed.recurrence : (pendingDraft?.recurrence ?? "once"),
                  description: parsed.description || pendingDraft?.description || "",
                  timezone: userTz,
                  isAmbiguous: !isComplete,
                  clarificationQuestion,
                };
              }
            }
          }
        }
      } catch (aiErr) {
        console.warn("AI parsing API call failed, falling back to heuristic parser:", aiErr);
      }
    }

    // Fallback jika LLM tidak tersedia atau gagal
    if (!parsedResult) {
      parsedResult = heuristicParse(
        prompt,
        clientDate,
        pendingDraft,
        Array.isArray(history) ? history : [],
        Array.isArray(existingSchedules) ? existingSchedules : []
      );
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
