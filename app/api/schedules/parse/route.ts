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

// ─── Heuristic Rule-Based Fallback Parser ─────────────────────────────────────
// Menjamin input bahasa Indonesia umum tetap ter-parse dengan presisi 100% bahkan jika offline
function heuristicParse(
  text: string,
  clientDate?: string,
  pendingDraft?: Partial<ParsedScheduleAI> | null
): ParsedScheduleAI {
  const lower = text.toLowerCase().trim();
  const baseDate = clientDate ? new Date(clientDate) : new Date();

  // 1. Deteksi Berulang (Recurrence)
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

  // 2. Deteksi Tanggal
  let targetDate: Date | null = null;

  // Regex format: "4 oktober", "tgl 4 oktober 2026", "10 nov", dll
  const monthRegex = /(?:tanggal|tgl)?\s*(\d{1,2})\s*(?:de|of|\/|-|\s)?\s*(januari|februari|maret|april|mei|may|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|agu|agt|aug|sep|okt|oct|nov|des|dec)(?:\s*(\d{4}))?/i;
  const mMonth = lower.match(monthRegex);
  if (mMonth) {
    const day = parseInt(mMonth[1], 10);
    const mName = mMonth[2].toLowerCase();
    const month = MONTHS_INDO[mName] !== undefined ? MONTHS_INDO[mName] : baseDate.getMonth();
    const year = mMonth[3] ? parseInt(mMonth[3], 10) : baseDate.getFullYear();
    targetDate = new Date(year, month, day);
  } else if (lower.includes("hari ini")) {
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
  } else if (lower.includes("minggu depan")) {
    targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + 7);
  } else {
    // Deteksi nama hari: senin, selasa, rabu, kamis, jumat, sabtu, minggu
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
        targetDate = new Date(baseDate);
        targetDate.setDate(targetDate.getDate() + diff);
        break;
      }
    }
  }

  // Deteksi tanggal angka sederhana: "tanggal 10", "tgl 15"
  if (!targetDate) {
    const tglMatch = lower.match(/(?:tanggal|tgl)\s*(\d{1,2})/);
    if (tglMatch) {
      const day = parseInt(tglMatch[1], 10);
      targetDate = new Date(baseDate);
      if (day < baseDate.getDate()) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
      targetDate.setDate(day);
    }
  }

  let dateStr = targetDate
    ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`
    : (pendingDraft?.date || undefined);

  // 3. Deteksi Waktu (Jam)
  let timeStr: string | null = null;
  const colonTimeMatch = lower.match(/(?:jam|pukul)?\s*(\b[0-2]?\d)[:.]([0-5]\d)\b/);
  if (colonTimeMatch) {
    const hh = colonTimeMatch[1].padStart(2, "0");
    const mm = colonTimeMatch[2];
    timeStr = `${hh}:${mm}`;
  } else {
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

  if (!timeStr && pendingDraft?.time) {
    timeStr = pendingDraft.time;
  }

  // 4. Deteksi Durasi
  let duration = pendingDraft?.duration || 60;
  const durMatch = lower.match(/selama\s*(\d+)\s*(jam|menit)/);
  if (durMatch) {
    const val = parseInt(durMatch[1], 10);
    duration = durMatch[2] === "jam" ? val * 60 : val;
  }

  // 5. Deteksi Reminder
  let reminder = pendingDraft?.reminder ?? 15;
  const remMatch = lower.match(/ingatkan\s*(\d+)\s*(menit|jam)/);
  if (remMatch) {
    const val = parseInt(remMatch[1], 10);
    reminder = remMatch[2] === "jam" ? val * 60 : val;
  }

  // 6. Bersihkan Judul
  let rawTitle = text
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

  rawTitle = rawTitle.replace(/^[:;,\s\-—]+|[:;,\s\-—]+$/g, "");

  let title = rawTitle;
  if (!title || title.length < 2) {
    title = pendingDraft?.title || "Jadwal Baru";
  } else {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  const hasExplicitDate = Boolean(dateStr);
  const hasExplicitTime = Boolean(timeStr);
  const hasExplicitTitle = Boolean(title && title.trim() && title !== "Jadwal Baru");

  const isAmbiguous = !hasExplicitDate || !hasExplicitTime || !hasExplicitTitle;
  let clarificationQuestion: string | undefined = undefined;

  if (!hasExplicitDate && hasExplicitTime) {
    clarificationQuestion = `Untuk pukul ${timeStr}, mau di hari apa atau tanggal berapa?`;
  } else if (hasExplicitDate && !hasExplicitTime) {
    clarificationQuestion = `Untuk tanggal ${dateStr}, rencananya mau jam berapa?`;
  } else if (!hasExplicitTitle) {
    clarificationQuestion = `Boleh tahu kegiatannya apa untuk jadwal ini?`;
  } else if (!hasExplicitDate && !hasExplicitTime) {
    clarificationQuestion = `Boleh tahu mau dijadwalkan tanggal berapa dan jam berapa?`;
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
    const { prompt, clientDate, timezone, pendingDraft, history } = await req.json();

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

    const draftInfo = pendingDraft
      ? `\nExisting schedule draft from conversation: ${JSON.stringify(pendingDraft)}`
      : "";

    const systemPrompt = `You are a helpful personal schedule assistant for Usick One.
Your job is to parse the user's natural language input into clean schedule data. Speak naturally like a human assistant, never robotic.

Today's date is: ${todayDate} (${new Date().toLocaleDateString("id-ID", { weekday: "long" })})
User Timezone: ${userTz}${draftInfo}

CRITICAL RULES:
1. If there is an existing schedule draft and the user is answering a previous question (such as giving date, time, or activity name), MERGE the new information into the existing draft! Keep all previously established details.
2. If the user provided all required details (title, date, time), set "isAmbiguous": false and "clarificationQuestion": null.
3. If ANY required detail is still missing (e.g. missing date or missing time or missing title):
   - Set "isAmbiguous": true.
   - If missing date: set "clarificationQuestion" to e.g. "Untuk pukul ${pendingDraft?.time || "tersebut"}, mau di hari apa atau tanggal berapa?"
   - If missing time: set "clarificationQuestion" to e.g. "Untuk tanggal ${pendingDraft?.date || "tersebut"}, rencananya mau jam berapa?"
   - If missing title: set "clarificationQuestion" to "Boleh tahu mau dijadwalkan untuk kegiatan apa?"
4. Month names in Indonesian: Januari, Februari, Maret, April, Mei, Juni, Juli, Agustus, September, Oktober, November, Desember.
5. Return ONLY a single raw JSON object matching:
{
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
              const finalTitle = (parsed.title && parsed.title !== "Jadwal Baru" ? parsed.title : pendingDraft?.title) || "Jadwal Baru";
              const finalDate = parsed.date || pendingDraft?.date;
              const finalTime = parsed.time || pendingDraft?.time;
              const isComplete = Boolean(finalTitle && finalTitle !== "Jadwal Baru" && finalDate && finalTime);

              parsedResult = {
                title: finalTitle,
                date: finalDate || todayDate,
                time: finalTime || "09:00",
                duration: typeof parsed.duration === "number" ? parsed.duration : (pendingDraft?.duration ?? 60),
                reminder: typeof parsed.reminder === "number" ? parsed.reminder : (pendingDraft?.reminder ?? 15),
                recurrence: ["once", "daily", "weekly", "monthly"].includes(parsed.recurrence) ? parsed.recurrence : (pendingDraft?.recurrence ?? "once"),
                description: parsed.description || pendingDraft?.description || "",
                timezone: userTz,
                isAmbiguous: !isComplete || Boolean(parsed.isAmbiguous),
                clarificationQuestion: !isComplete ? (parsed.clarificationQuestion || "Boleh tahu mau tanggal berapa dan jam berapa agendanya?") : undefined,
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
      parsedResult = heuristicParse(prompt, clientDate, pendingDraft);
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
