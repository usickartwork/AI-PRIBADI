export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { searchWeb, SearchResult } from "@/lib/search";
import { isModelAllowedForPlan, calculateCreditUsage } from "@/lib/pricing";
import { getUserSubscription, deductCredits } from "@/lib/subscriptionServer";
import { supabase } from "@/lib/supabase";

// ─── Provider Configuration ───────────────────────────────────────────────────
type ProviderConfig = {
  endpoint: string;
  apiKey: string;
};

function cleanOllamaBaseUrl(rawUrl?: string): string {
  let base = rawUrl?.trim() || "";
  if (!base) return "";
  // Hapus trailing slash
  base = base.replace(/\/+$/, "");
  // Hapus suffix endpoint jika user memasukkan URL lengkap
  base = base.replace(/\/v1\/chat\/completions$/, "");
  base = base.replace(/\/chat\/completions$/, "");
  base = base.replace(/\/api\/chat$/, "");
  // Hapus suffix /api/v1, /v1, atau /api agar tidak menghasilkan path ganda
  base = base.replace(/\/api\/v1$/, "");
  base = base.replace(/\/v1$/, "");
  base = base.replace(/\/api$/, "");
  return base.replace(/\/+$/, "");
}

function getOllamaEndpoint(rawUrl?: string): string {
  const clean = cleanOllamaBaseUrl(rawUrl);
  if (!clean) return "";
  return `${clean}/v1/chat/completions`;
}

function cleanCustomBaseUrl(rawUrl?: string): string {
  let base = rawUrl?.trim() || "";
  if (!base) return "";
  base = base.replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) {
    return base;
  }
  if (base.endsWith("/v1")) {
    return `${base}/chat/completions`;
  }
  return `${base}/v1/chat/completions`;
}

function getCustomEndpoint(rawUrl?: string): string {
  return cleanCustomBaseUrl(rawUrl);
}

function getProviders(): Record<string, ProviderConfig> {
  return {
    custom: {
      endpoint: getCustomEndpoint(process.env.CUSTOM_BASE_URL),
      apiKey: process.env.CUSTOM_API_KEY || "",
    },
    claude: {
      endpoint: "https://api.anthropic.com/v1/messages",
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || "",
    },
    cloudflare: {
      endpoint: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID || ""}/ai/v1/chat/completions`,
      apiKey: process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY || "",
    },
    anthropic: {
      endpoint: "https://api.anthropic.com/v1/messages",
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || "",
    },
    gemini: {
      endpoint:
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey:
        process.env.GEMINI_VOICE_API_KEY || process.env.GEMINI_API_KEY || "",
    },
    groq: {
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY || "",
    },
    nvidia: {
      endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
      apiKey: process.env.NVIDIA_API_KEY || "",
    },
    ollama: {
      endpoint: getOllamaEndpoint(process.env.OLLAMA_BASE_URL),
      apiKey: process.env.OLLAMA_API_KEY || "",
    },
    cerebras: {
      endpoint: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: process.env.CEREBRAS_API_KEY || "",
    },
    openrouter: {
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY || "",
    },
    glm: {
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      apiKey: process.env.GLM_API_KEY || process.env.ZHIPUAI_API_KEY || "",
    },
    together: {
      endpoint: "https://api.together.xyz/v1/chat/completions",
      apiKey: process.env.TOGETHER_API_KEY || "",
    },
    hf: {
      endpoint: "https://router.huggingface.co/v1/chat/completions",
      apiKey: process.env.HF_API_KEY || "",
    },
    novita: {
      endpoint: "https://api.novita.ai/v3/openai/chat/completions",
      apiKey: process.env.NOVITA_API_KEY || "",
    },
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  image?: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTemporalPrompt(userTimeZone?: string): string {
  const tz = userTimeZone?.trim() || "Asia/Jakarta";
  let formatted = "";
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    formatted = formatter.format(now);
  } catch {
    const now = new Date();
    formatted = now.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  }

  let tzLabel = tz;
  if (tz === "Asia/Jakarta" || tz === "Asia/Pontianak") tzLabel = "WIB (Waktu Indonesia Barat, UTC+7)";
  else if (tz === "Asia/Makassar" || tz === "Asia/Ujung_Pandang") tzLabel = "WITA (Waktu Indonesia Tengah, UTC+8)";
  else if (tz === "Asia/Jayapura") tzLabel = "WIT (Waktu Indonesia Timur, UTC+9)";

  return (
    `\n\n[Informasi Waktu & Tanggal Real-Time Aktif]:\n` +
    `- Waktu Sekarang: ${formatted}\n` +
    `- Zona Waktu: ${tzLabel}\n` +
    `ATURAN WAJIB WAKTU: Kamu MEMILIKI akses langsung ke jam, hari, dan tanggal real-time di atas. DILARANG KERAS mengatakan "Saya tidak memiliki akses ke waktu real-time" atau menyuruh pengguna melihat jam di perangkatnya. Jika ditanya jam berapa sekarang, hari apa hari ini, atau tanggal berapa, sebutkan langsung jam dan tanggal real-time di atas dengan pasti dan akurat.`
  );
}

const USICK_ONE_TRAINING_RULES =
  "\n\n[Standar Kualitas & Kepribadian Usick One (Setara ChatGPT Flagship)]:\n" +
  "1. Identitas Mutlak: Kamu adalah **Usick One**, asisten kecerdasan buatan flagship generasi terbaru dari Usick. Jangan pernah menyebut dirimu sebagai Qwen, Alibaba, Gemini, Google, Llama, Meta, DeepSeek, Kimi, Moonshot, Apodex, atau OpenAI.\n" +
  "2. Gaya Komunikasi Adaptif & Natural:\n" +
  "   - Untuk sapaan santai atau pertanyaan singkat (mis. 'halo', 'apa kabar', 'jam berapa'), jawab secara hangat, ramah, natural, dan ringkas tanpa bertele-tele.\n" +
  "   - Untuk pertanyaan analitis, edukasi, bisnis, strategi, atau pemecahan masalah, berikan penjelasan yang mendalam, terstruktur rapi (gunakan subjudul, poin-poin, penekanan **tebal**, atau tabel bila relevan), disertai contoh konkret yang mudah dipahami.\n" +
  "3. Standar Kode & Pemrograman: Saat diminta menulis kode, berikan kode yang bersih, lengkap (jangan dipotong setengah), siap dijalankan (production-ready) di dalam fenced code block dengan label bahasa yang tepat, diikuti penjelasan singkat.\n" +
  "4. Disiplin Output: Langsung berikan jawaban akhir yang matang. DILARANG mengeluarkan monolog berpikir internal dalam bahasa Inggris seperti 'Thinking Process:', '1. Analyze the Request:', '<think>', atau '<thought>'.\n" +
  "5. Konteks Multi-Turn: Selalu ingat dan hubungkan konteks dari pesan-pesan sebelumnya dalam percakapan ini secara koheren.";

const MATH_NOTATION_INSTRUCTIONS =
  "\n\n[Standar Notasi Matematika (KaTeX / LaTeX)]:\n" +
  "Ketika menjawab pertanyaan matematika atau sains, gunakan notasi matematika standar yang dapat dirender oleh sistem Markdown dan KaTeX:\n" +
  "1. Gunakan LaTeX inline dengan delimiter $...$ untuk ekspresi pendek di dalam kalimat (contoh: $\\sqrt{25}$, $x^2$, $a_1$).\n" +
  "2. Gunakan delimiter $$...$$ pada baris tersendiri untuk rumus panjang, perhitungan bertahap, dan persamaan yang perlu ditonjolkan.\n" +
  "3. Gunakan \\sqrt{x} untuk akar kuadrat, \\sqrt[n]{x} untuk akar pangkat n, \\frac{a}{b} untuk pecahan, serta x^{2} dan x_{1} untuk pangkat dan indeks.\n" +
  "4. Untuk persamaan panjang atau multibaris, gunakan lingkungan yang didukung seperti `aligned` di dalam blok matematika ($$\\begin{aligned} ... \\end{aligned}$$).\n" +
  "5. Jelaskan proses penyelesaian secara bertahap. Jangan hanya memberikan hasil akhir apabila pengguna meminta cara pengerjaan.\n" +
  "6. Pastikan setiap variabel, tanda operasi, satuan, dan hasil akhir benar secara matematis.\n" +
  "7. Jangan membungkus seluruh jawaban dalam satu blok matematika. Narasi tetap menggunakan teks biasa, sedangkan ekspresi matematika menggunakan notasi matematika.\n" +
  "8. Jangan menghasilkan sintaks LaTeX yang rusak atau menggunakan delimiter pembuka tanpa delimiter penutup.\n" +
  "9. Hindari menulis rumus sebagai teks biasa ketika notasi matematika dapat digunakan.\n" +
  "10. Untuk pertanyaan nonmatematika, pertahankan format jawaban normal. Jangan memaksakan LaTeX ke dalam percakapan biasa.\n" +
  "11. Jika pengguna meminta jawaban sederhana, tetap berikan jawaban ringkas dengan notasi yang benar.\n" +
  "12. Jika model tidak yakin terhadap suatu hasil, jangan mengarang hasil atau mengklaim sudah memverifikasinya.";


function resolveProvider(modelId: string): {
  provider: ProviderConfig;
  modelName: string;
  providerName: string;
} | null {
  const providers = getProviders();

  const colonIdx = modelId.indexOf(":");
  if (colonIdx > 0) {
    const prefix = modelId.slice(0, colonIdx);
    let modelName = modelId.slice(colonIdx + 1);
    if (prefix === "custom" && process.env.CUSTOM_MODEL_NAME) {
      modelName = process.env.CUSTOM_MODEL_NAME;
    }
    const provider = providers[prefix];
    if (
      provider &&
      (provider.apiKey ||
        (prefix === "ollama" && Boolean(provider.endpoint)) ||
        (prefix === "custom" && Boolean(provider.endpoint)))
    ) {
      return { provider, modelName, providerName: prefix };
    }
    if (provider) {
      return null;
    }
  }

  for (const [prefix, provider] of Object.entries(providers)) {
    if (modelId.startsWith(prefix + "/") || modelId.startsWith(prefix + ":")) {
      let modelName = modelId.slice(prefix.length + 1);
      if (prefix === "custom" && process.env.CUSTOM_MODEL_NAME) {
        modelName = process.env.CUSTOM_MODEL_NAME;
      }
      if (
        provider.apiKey ||
        (prefix === "ollama" && Boolean(provider.endpoint)) ||
        (prefix === "custom" && Boolean(provider.endpoint))
      ) {
        return { provider, modelName, providerName: prefix };
      }
      return null;
    }
  }

  return null;
}

// ─── CORS preflight ───────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: {
    messages?: ChatMessage[];
    model?: string;
    webSearch?: boolean;
    taskType?: "chat" | "code";
    userId?: string;
    effortLevel?: "Faster" | "Balanced" | "Max";
    timeZone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const rawMessages = body.messages;
  if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
    return Response.json(
      { error: "Messages required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const messages: ChatMessage[] = [...rawMessages];
  const webSearch = Boolean(body.webSearch);
  const modelId = body.model || "";
  const taskType = body.taskType === "code" ? "code" : "chat";
  const creditType = taskType === "code" ? "code" : "ai";
  const userTimeZone =
    typeof body.timeZone === "string" && body.timeZone.trim()
      ? body.timeZone.trim()
      : "Asia/Jakarta";
  const temporalInstruction = getTemporalPrompt(userTimeZone);

  // ── Authentication & Subscription Check ──────────────────────────────────────
  let userId = body.userId;
  if (!userId) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.id) userId = user.id;
      } catch {}
    }
  }
  if (!userId) userId = "guest";

  const userSub = await getUserSubscription(userId);

  // 1. Model Access Control: Free user can only use Usick One AI
  const modelAllowed = isModelAllowedForPlan(userSub.plan, modelId);
  if (!modelAllowed) {
    return Response.json(
      {
        error: `Model [${modelId}] terkunci untuk akun ${userSub.plan.toUpperCase()}. Model eksternal hanya dapat diakses pada paket Pro.`,
        requiresUpgrade: true,
        plan: userSub.plan,
        model: modelId,
      },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  // 2. Credit Balance Control: AI Credits vs Code Credits
  const currentBalance = creditType === "code" ? userSub.codeCredits : userSub.aiCredits;
  const creditLimit = creditType === "code" ? userSub.codeCreditLimit : userSub.aiCreditLimit;

  if (currentBalance <= 0) {
    return Response.json(
      {
        error: `Saldo ${creditType === "code" ? "Code" : "AI"} Credits Anda telah habis (0/${creditLimit}). Kredit akan direset dalam ${userSub.resetsInDays} hari atau Anda dapat melakukan upgrade ke Pro.`,
        creditsExhausted: true,
        creditType,
        plan: userSub.plan,
        resetsInDays: userSub.resetsInDays,
        resetAt: userSub.resetAt,
      },
      { status: 402, headers: CORS_HEADERS }
    );
  }

  let sources: SearchResult[] = [];
  let searchError: string | null = null;

  // ── Web Search Integration ────────────────────────────────────────────────────
  if (webSearch) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content;

    if (lastUserMsg) {
      try {
        sources = await searchWeb(lastUserMsg);

        if (sources.length > 0) {
          const contextPrompt =
            `\n\n[Hasil Pencarian Web untuk: "${lastUserMsg}"]:\n` +
            sources
              .map(
                (s, i) =>
                  `${i + 1}. Judul: ${s.title}\n   URL: ${s.url}\n   Ringkasan: ${s.snippet}`
              )
              .join("\n\n") +
            `\n\nAturan Penggunaan Web Search:\n` +
            `1. Manfaatkan informasi dari hasil pencarian di atas untuk memberikan jawaban yang paling mutakhir dan akurat.\n` +
            `2. Cantumkan referensi sumber dalam format link Markdown [Judul](URL) jika Anda menggunakan informasinya.`;

          const systemMsgIdx = messages.findIndex((m) => m.role === "system");
          if (systemMsgIdx >= 0) {
            messages[systemMsgIdx] = {
              ...messages[systemMsgIdx],
              content: messages[systemMsgIdx].content + contextPrompt,
            };
          } else {
            messages.unshift({
              role: "system",
              content: contextPrompt,
            });
          }
        }
      } catch (err: unknown) {
        searchError = err instanceof Error ? err.message : "Gagal melakukan web search.";
        console.warn("[api/chat] Web search failed:", searchError);
      }
    }
  }

  const hasImage = messages.some((m) => Boolean(m.image));

  // ─── Effort Level Tuning (Faster -> Balanced -> Max) ─────────────────────────
  const effortLevel: "Faster" | "Balanced" | "Max" =
    body.effortLevel === "Faster" || body.effortLevel === "Balanced"
      ? body.effortLevel
      : "Max";

  let maxTokens = 4096;
  let temperature = 0.7;
  let effortInstruction = "";

  if (effortLevel === "Faster") {
    maxTokens = hasImage ? 8192 : 4096;
    temperature = 0.3;
    effortInstruction =
      "\n\n[Mode Upaya: FASTER]\nBerikan jawaban yang sangat cepat, padat, ringkas, dan langsung ke inti persoalan (to-the-point). Hindari pengantar panjang atau penjelasan tambahan yang tidak esensial. Utamakan kecepatan respons dengan format efisien.";
  } else if (effortLevel === "Balanced") {
    maxTokens = hasImage ? 16384 : 8192;
    temperature = 0.6;
    effortInstruction =
      "\n\n[Mode Upaya: BALANCED]\nBerikan jawaban yang seimbang antara kecepatan dan kelengkapan. Jelaskan inti persoalan secara jelas, rapi, dan efisien.";
  } else {
    // "Max" - kualitas terbaik & mendalam (default saat ini)
    maxTokens = hasImage ? 16384 : 8192;
    temperature = 0.7;
    effortInstruction =
      "\n\n[Mode Upaya: MAX]\nBerikan jawaban dengan kualitas terbaik, analisis komprehensif, mendalam, dan penjelasan yang rinci dengan penalaran yang matang.";
  }

  // Context history compression based on effortLevel (reduces prompt tokens & TTFT)
  if (effortLevel === "Faster" && messages.length > 7) {
    const sysMsgs = messages.filter((m) => m.role === "system");
    const nonSysMsgs = messages.filter((m) => m.role !== "system");
    messages.length = 0;
    messages.push(...sysMsgs, ...nonSysMsgs.slice(-6));
  } else if (effortLevel === "Balanced" && messages.length > 13) {
    const sysMsgs = messages.filter((m) => m.role === "system");
    const nonSysMsgs = messages.filter((m) => m.role !== "system");
    messages.length = 0;
    messages.push(...sysMsgs, ...nonSysMsgs.slice(-12));
  }

  const lowerModelId = modelId.toLowerCase();
  const isUsick =
    !modelId ||
    lowerModelId.includes("apodex") ||
    lowerModelId.includes("usick");

  // Inject effort instruction, real-time temporal context, math rules & Usick One training rules into system message
  const systemMsgIdx = messages.findIndex((m) => m.role === "system");
  if (systemMsgIdx >= 0) {
    messages[systemMsgIdx] = {
      ...messages[systemMsgIdx],
      content:
        messages[systemMsgIdx].content +
        (isUsick ? USICK_ONE_TRAINING_RULES : "") +
        MATH_NOTATION_INSTRUCTIONS +
        temporalInstruction +
        effortInstruction,
    };
  } else {
    const defaultIdentity = isUsick
      ? "Nama kamu adalah Usick One, asisten kecerdasan buatan flagship tingkat lanjut yang sangat pintar, cerdas, berwawasan luas, dan ramah."
      : "Kamu adalah asisten AI yang cerdas dan ramah. Tetap gunakan nama model AI aslimu jika ditanya siapa dirimu, dan jangan pernah menyebut dirimu sebagai Usick One.";

    messages.unshift({
      role: "system",
      content:
        defaultIdentity +
        " Selalu berikan respons dalam bahasa Indonesia yang baik dan terstruktur." +
        (isUsick ? USICK_ONE_TRAINING_RULES : "") +
        MATH_NOTATION_INSTRUCTIONS +
        temporalInstruction +
        effortInstruction,
    });
  }

  const primaryResolved = resolveProvider(modelId);

  if (!primaryResolved && !isUsick) {
    const missingKey = modelId.split(/[:/]/)[0] || "provider";
    console.error(`[api/chat] Provider or key not configured for model: ${modelId}`);

    if (missingKey.toLowerCase() === "ollama") {
      return Response.json(
        {
          error:
            "OLLAMA_BASE_URL belum dikonfigurasi di Environment Variables Vercel Dashboard. Silakan tambahkan OLLAMA_BASE_URL dengan URL server Ollama Anda (contoh: https://my-ollama-host.com).",
          model: modelId,
        },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    if (missingKey.toLowerCase() === "claude" || missingKey.toLowerCase() === "anthropic") {
      return Response.json(
        {
          error:
            "API key untuk Claude belum dikonfigurasi di Environment Variables Vercel Dashboard. Silakan tambahkan ANTHROPIC_API_KEY (atau CLAUDE_API_KEY) di Vercel.",
          model: modelId,
        },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    if (missingKey.toLowerCase() === "cloudflare") {
      return Response.json(
        {
          error:
            "API Token untuk Cloudflare Workers AI belum dikonfigurasi. Silakan tambahkan CLOUDFLARE_API_TOKEN di file .env.local atau Vercel Dashboard.",
          model: modelId,
        },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    if (missingKey.toLowerCase() === "custom") {
      return Response.json(
        {
          error:
            "CUSTOM_BASE_URL (atau CUSTOM_API_KEY) belum dikonfigurasi di Environment Variables (.env.local atau Vercel Dashboard). Silakan tambahkan CUSTOM_BASE_URL dan CUSTOM_API_KEY.",
          model: modelId,
        },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    return Response.json(
      {
        error: `API key untuk provider "${missingKey.toUpperCase()}" belum dikonfigurasi di Environment Variables Vercel Dashboard. Silakan tambahkan ${missingKey.toUpperCase()}_API_KEY di Vercel.`,
        model: modelId,
      },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  // Build ordered candidate failover list
  const rawCandidates: string[] = [];
  if (isUsick) {
    if (hasImage) {
      rawCandidates.push(
        "gemini:gemini-3.5-flash-lite",
        "gemini:gemini-3.1-flash-lite-preview",
        "gemini:gemini-3.1-flash-lite",
        "gemini:gemini-3.6-flash",
        "novita:qwen/qwen3.8-flash",
        "custom:clario/gemini-3.7-flash-auto"
      );
    } else {
      rawCandidates.push(
        "novita:apodex/apodex-1.1-mini",
        "novita:qwen/qwen3.8-flash",
        "gemini:gemini-3.5-flash-lite",
        "novita:moonshotai/kimi-k2-instruct",
        "gemini:gemini-3.1-flash-lite-preview",
        "gemini:gemini-3.1-flash-lite",
        "novita:inclusionai/ling-3.1-flash",
        "cloudflare:@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        "custom:clario/gemini-3.7-flash-auto"
      );
    }
  } else {
    rawCandidates.push(modelId);
    if (
      primaryResolved?.providerName === "custom" &&
      primaryResolved.modelName.startsWith("clario/deepseek-") &&
      primaryResolved.modelName !== "clario/deepseek-v4.1-flash-auto"
    ) {
      rawCandidates.push("custom:clario/deepseek-v4.1-flash-auto");
    }
    if (hasImage) {
      rawCandidates.push(
        "gemini:gemini-3.5-flash-lite",
        "gemini:gemini-3.1-flash-lite-preview",
        "gemini:gemini-3.1-flash-lite",
        "gemini:gemini-3.6-flash",
        "novita:qwen/qwen3.8-flash"
      );
    } else {
      rawCandidates.push(
        "gemini:gemini-3.5-flash-lite",
        "novita:qwen/qwen3.8-flash",
        "gemini:gemini-3.1-flash-lite-preview",
        "gemini:gemini-3.1-flash-lite",
        "novita:moonshotai/kimi-k2-instruct",
        "cloudflare:@cf/meta/llama-3.3-70b-instruct-fp8-fast"
      );
    }
  }

  // Deduplicate candidates while preserving order
  const candidateModels = Array.from(new Set(rawCandidates));

  const buildCandidatePayload = (candidateId: string) => {
    const resolved = resolveProvider(candidateId);
    if (!resolved) return null;
    const { provider, modelName, providerName } = resolved;
    if (providerName === "custom" && !provider.endpoint) return null;
    if (providerName === "cloudflare" && !process.env.CLOUDFLARE_ACCOUNT_ID) return null;

    const isAnthropic = providerName === "claude" || providerName === "anthropic";
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isAnthropic) {
      reqHeaders["x-api-key"] = provider.apiKey;
      reqHeaders["anthropic-version"] = "2023-06-01";
    } else if (provider.apiKey) {
      reqHeaders["Authorization"] = `Bearer ${provider.apiKey}`;
    }
    if (providerName === "openrouter") {
      reqHeaders["HTTP-Referer"] = "https://usick.ai";
      reqHeaders["X-Title"] = "Usick AI";
    }
    if (providerName === "custom") {
      reqHeaders["User-Agent"] =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    }

    let reqBody: string;
    if (isAnthropic) {
      const systemTexts: string[] = [];
      const anthropicMessages: { role: "user" | "assistant"; content: unknown }[] = [];

      for (const m of messages) {
        if (m.role === "system") {
          systemTexts.push(m.content);
        } else if (m.image && m.role === "user") {
          const match = m.image.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mediaType = match[1];
            const base64Data = match[2];
            anthropicMessages.push({
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Data,
                  },
                },
                {
                  type: "text",
                  text: m.content || "Tolong analisis dan jelaskan foto ini secara rinci.",
                },
              ],
            });
          } else {
            anthropicMessages.push({ role: m.role, content: m.content });
          }
        } else {
          const last = anthropicMessages[anthropicMessages.length - 1];
          if (last && last.role === m.role && typeof last.content === "string") {
            last.content += "\n\n" + m.content;
          } else {
            anthropicMessages.push({ role: m.role, content: m.content });
          }
        }
      }

      if (anthropicMessages.length === 0 || anthropicMessages[0].role !== "user") {
        anthropicMessages.unshift({ role: "user", content: "Halo" });
      }

      reqBody = JSON.stringify({
        model: modelName,
        messages: anthropicMessages,
        system: systemTexts.length > 0 ? systemTexts.join("\n\n") : undefined,
        stream: true,
        max_tokens: maxTokens,
        temperature,
      });
    } else {
      const formattedMessages = messages.map((m) => {
        if (m.image && m.role === "user") {
          return {
            role: m.role,
            content: [
              {
                type: "text",
                text: m.content || "Tolong analisis dan jelaskan foto ini secara rinci.",
              },
              {
                type: "image_url",
                image_url: {
                  url: m.image,
                },
              },
            ],
          };
        }
        return {
          role: m.role,
          content: m.content,
        };
      });

      const isDeepSeekR1 =
        modelName.toLowerCase().includes("deepseek-r1") ||
        candidateId.toLowerCase().includes("deepseek-r1");

      let messagesToSend = formattedMessages;
      if (isDeepSeekR1) {
        messagesToSend = formattedMessages.map((m) => {
          if (m.role === "system") {
            return {
              ...m,
              content:
                "Kamu adalah asisten AI yang cerdas dan ramah. Selalu berikan jawaban dalam bahasa Indonesia yang baik, rapi, dan terstruktur." +
                temporalInstruction,
            };
          }
          return m;
        });
      }

      const reasoningEffortMap = {
        Faster: "low",
        Balanced: "medium",
        Max: "high",
      };

      if (providerName === "openrouter") {
        const isNemotron = modelName.toLowerCase().includes("nemotron");
        const openRouterModels = isNemotron
          ? [
              modelName,
              "nvidia/nemotron-3.5-lightning:free",
              "nvidia/nemotron-3-ultra-550b-a55b:free",
            ]
          : [modelName];

        const isExplicitReasoning =
          modelName.includes("r1") ||
          modelName.includes("o1") ||
          modelName.includes("o3") ||
          modelName.includes("reasoning");

        reqBody = JSON.stringify({
          model: modelName,
          models: openRouterModels,
          messages: messagesToSend,
          stream: true,
          max_tokens: maxTokens,
          temperature,
          ...(isExplicitReasoning ? { reasoning_effort: reasoningEffortMap[effortLevel] } : {}),
        });
      } else if (providerName === "novita") {
        // Disable heavy internal English chain-of-thought on Novita chat models so they respond in ~1.2s without 429 overload or empty content
        reqBody = JSON.stringify({
          model: modelName,
          messages: messagesToSend,
          stream: true,
          max_tokens: maxTokens,
          temperature,
          chat_template_kwargs: { enable_thinking: false },
        });
      } else if (providerName === "gemini") {
        // Do NOT send reasoning_effort to Gemini OpenAI endpoint (prevents thought_signature from exhausting max_tokens)
        // Ensure max_tokens is at least 16384 for Gemini to prevent truncation on photo/vision analysis and thinking tokens
        reqBody = JSON.stringify({
          model: modelName,
          messages: messagesToSend,
          stream: true,
          max_tokens: Math.max(maxTokens, 16384),
          temperature,
        });
      } else {
        const isExplicitReasoning =
          modelName.includes("r1") ||
          modelName.includes("o1") ||
          modelName.includes("o3") ||
          modelName.includes("reasoning");

        reqBody = JSON.stringify({
          model: modelName,
          messages: messagesToSend,
          stream: true,
          max_tokens: maxTokens,
          temperature,
          ...(isExplicitReasoning ? { reasoning_effort: reasoningEffortMap[effortLevel] } : {}),
        });
      }
    }

    return {
      candidateId,
      provider,
      modelName,
      providerName,
      isAnthropic,
      reqHeaders,
      reqBody,
    };
  };

  let verifiedReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let verifiedInitialChunks: Uint8Array[] = [];
  let activeCandidate = buildCandidatePayload(candidateModels[0]) || {
    candidateId: modelId,
    provider: primaryResolved?.provider || { endpoint: "", apiKey: "" },
    modelName: primaryResolved?.modelName || modelId,
    providerName: primaryResolved?.providerName || "novita",
    isAnthropic: false,
    reqHeaders: {},
    reqBody: "",
  };
  let lastErrorStatus = 503;
  let lastErrorText = "";
  let lastFetchError: unknown = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const candidateId = candidateModels[i];
    const built = buildCandidatePayload(candidateId);
    if (!built) continue;

    activeCandidate = built;
    const isLastCandidate = i === candidateModels.length - 1;
    const isDeepSeek =
      built.modelName.toLowerCase().includes("deepseek") ||
      candidateId.toLowerCase().includes("deepseek");
    const isVisionCandidate = hasImage || built.providerName === "gemini";
    const candidateTimeoutMs = isDeepSeek
      ? 45000
      : isVisionCandidate
      ? 30000
      : isLastCandidate
      ? 25000
      : 15000;

    const candidateController = new AbortController();
    let connectTimeoutId: NodeJS.Timeout | null = setTimeout(() => {
      candidateController.abort(new DOMException("Candidate connect timeout", "TimeoutError"));
    }, candidateTimeoutMs);

    try {
      let upstream = await fetch(built.provider.endpoint, {
        method: "POST",
        headers: built.reqHeaders,
        body: built.reqBody,
        signal: candidateController.signal,
      });

      // Ollama Dual Endpoint Retry (Fall back from /v1 to /api/chat if 405/404)
      if (
        !upstream.ok &&
        built.providerName === "ollama" &&
        (upstream.status === 405 || upstream.status === 404)
      ) {
        const cleanBase = cleanOllamaBaseUrl(process.env.OLLAMA_BASE_URL);
        if (cleanBase) {
          const nativeEndpoint = `${cleanBase}/api/chat`;
          const nativeUpstream = await fetch(nativeEndpoint, {
            method: "POST",
            headers: built.reqHeaders,
            body: JSON.stringify({
              model: built.modelName,
              messages,
              stream: true,
            }),
            signal: candidateController.signal,
          });
          if (nativeUpstream.ok) {
            upstream = nativeUpstream;
          }
        }
      }

      if (!upstream.ok || !upstream.body) {
        if (connectTimeoutId) {
          clearTimeout(connectTimeoutId);
          connectTimeoutId = null;
        }
        lastErrorStatus = upstream.status || 502;
        lastErrorText = await upstream.text().catch(() => "");
        console.warn(
          `[api/chat] Candidate ${candidateId} returned HTTP ${lastErrorStatus}: ${lastErrorText.slice(0, 180)}. Trying next fallback...`
        );
        continue;
      }

      const reader = upstream.body.getReader();

      if (built.isAnthropic) {
        if (connectTimeoutId) {
          clearTimeout(connectTimeoutId);
          connectTimeoutId = null;
        }
        verifiedReader = reader;
        verifiedInitialChunks = [];
        break;
      }

      // First-Content-Verified Streaming: read initial SSE packets until at least one non-empty delta.content arrives
      const tempChunks: Uint8Array[] = [];
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let gotValidContent = false;
      let streamAbortedOrErrored = false;

      try {
        while (!gotValidContent) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            tempChunks.push(value);
            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr || dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  lastErrorText = JSON.stringify(parsed.error);
                  streamAbortedOrErrored = true;
                  break;
                }
                const deltaContent =
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.choices?.[0]?.message?.content ||
                  "";
                if (typeof deltaContent === "string" && deltaContent.trim().length > 0) {
                  gotValidContent = true;
                }
              } catch {}
            }
          }
          if (streamAbortedOrErrored) break;
        }
      } catch (streamVerifyErr) {
        console.warn(
          `[api/chat] Stream verification read error on ${candidateId}:`,
          streamVerifyErr
        );
        streamAbortedOrErrored = true;
      }

      if (gotValidContent && !streamAbortedOrErrored) {
        if (connectTimeoutId) {
          clearTimeout(connectTimeoutId);
          connectTimeoutId = null;
        }
        verifiedReader = reader;
        verifiedInitialChunks = tempChunks;
        if (i > 0) {
          console.info(
            `[api/chat] Auto-failover succeeded: ${modelId} -> ${candidateId}`
          );
        }
        break;
      } else {
        if (connectTimeoutId) {
          clearTimeout(connectTimeoutId);
          connectTimeoutId = null;
        }
        try {
          await reader.cancel();
        } catch {}
        console.warn(
          `[api/chat] Candidate ${candidateId} yielded 0 content tokens, failing over to next candidate...`
        );
        continue;
      }
    } catch (fetchErr) {
      if (connectTimeoutId) {
        clearTimeout(connectTimeoutId);
        connectTimeoutId = null;
      }
      lastFetchError = fetchErr;
      console.warn(
        `[api/chat] Network/timeout error on candidate ${candidateId}:`,
        fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      );
      continue;
    }
  }

  if (!verifiedReader) {
    if (lastFetchError && !lastErrorText) {
      const fetchErrMsg =
        lastFetchError instanceof Error ? lastFetchError.message : String(lastFetchError);
      const isTimeout =
        (lastFetchError instanceof DOMException && lastFetchError.name === "TimeoutError") ||
        (lastFetchError instanceof Error && lastFetchError.name === "TimeoutError") ||
        fetchErrMsg.toLowerCase().includes("timeout") ||
        fetchErrMsg.toLowerCase().includes("aborted");

      if (isTimeout) {
        return Response.json(
          {
            error: `Provider [${activeCandidate.providerName.toUpperCase()}] tidak merespons dalam batas waktu (upstream timeout / server model sedang sibuk). Silakan coba lagi sesaat lagi.`,
            model: modelId,
            isLimit: true,
          },
          { status: 504, headers: CORS_HEADERS }
        );
      }

      return Response.json(
        {
          error: `Tidak bisa terhubung ke provider [${activeCandidate.providerName.toUpperCase()}]. Detail: ${fetchErrMsg}.`,
        },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const errText = lastErrorText || "Upstream gagal memberikan respons.";
    let detailMsg = errText.slice(0, 200);
    try {
      const parsed = JSON.parse(errText) as {
        error?: { message?: string } | string;
        message?: string;
        detail?: string;
      };
      if (typeof parsed.error === "string") {
        detailMsg = parsed.error;
      } else if (parsed.error?.message) {
        detailMsg = parsed.error.message;
      } else if (parsed.message) {
        detailMsg = parsed.message;
      } else if (parsed.detail) {
        detailMsg = parsed.detail;
      }
    } catch {}

    const isVisionError =
      hasImage &&
      (lastErrorStatus === 400 || lastErrorStatus === 404 || lastErrorStatus === 422) &&
      (errText.toLowerCase().includes("image") ||
        errText.toLowerCase().includes("vision") ||
        errText.toLowerCase().includes("multimodal") ||
        errText.toLowerCase().includes("expected a string") ||
        errText.toLowerCase().includes("expected type") ||
        errText.toLowerCase().includes("unsupported") ||
        errText.toLowerCase().includes("not support") ||
        errText.toLowerCase().includes("media"));

    if (isVisionError) {
      return Response.json(
        {
          error: `Model ini saat ini tidak mendukung analisis gambar atau foto.\n\nBerikut adalah model yang **mendukung analisis foto / Vision**:\n• **Usick One**\n• **Gemini**\n• **Qwen**\n\nSilakan pilih model **Usick One**, **Gemini**, atau **Qwen** pada menu pilihan model untuk menganalisis foto Anda.`,
          isVisionUnsupported: true,
          model: modelId,
          sources,
          searchError,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const isOverloaded =
      lastErrorStatus === 503 ||
      errText.toLowerCase().includes("overload") ||
      errText.toLowerCase().includes("temporary unavailable") ||
      errText.toLowerCase().includes("high demand");

    const isLimitError =
      lastErrorStatus === 429 ||
      lastErrorStatus === 402 ||
      lastErrorStatus === 400 ||
      errText.toLowerCase().includes("rate limit") ||
      errText.toLowerCase().includes("quota") ||
      errText.toLowerCase().includes("limit") ||
      errText.toLowerCase().includes("exceeded") ||
      errText.toLowerCase().includes("exhausted") ||
      errText.toLowerCase().includes("capacity") ||
      errText.toLowerCase().includes("overloaded");

    return Response.json(
      {
        error: isOverloaded
          ? `Model ini sedang mengalami lonjakan antrean / overload sementara dari penyedia layanan. Silakan coba kembali dalam beberapa saat.`
          : `Provider [${activeCandidate.providerName.toUpperCase()}] merespons error (HTTP ${lastErrorStatus}): ${detailMsg}`,
        detail: errText.slice(0, 300),
        isLimit: isLimitError,
        isOverloaded,
        model: modelId,
        sources,
        searchError,
      },
      { status: lastErrorStatus, headers: CORS_HEADERS }
    );
  }

  const encoder = new TextEncoder();
  const upstreamReader = verifiedReader;
  const isAnthropic = activeCandidate.isAnthropic;

  const stream = new ReadableStream({
    async start(controller) {
      if (sources.length > 0) {
        const sourcesEvent = `data: ${JSON.stringify({ type: "sources", sources })}\n\n`;
        controller.enqueue(encoder.encode(sourcesEvent));
      }

      if (searchError) {
        const errorEvent = `data: ${JSON.stringify({ type: "search_error", error: searchError })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
      }

      if (isAnthropic) {
        let buffer = "";
        let anthropicOutputChars = 0;
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await upstreamReader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  anthropicOutputChars += parsed.delta.text.length;
                  const chunk = {
                    choices: [{ delta: { content: parsed.delta.text } }],
                  };
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                  );
                }
              } catch {}
            }
          }

          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr !== "[DONE]") {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    anthropicOutputChars += parsed.delta.text.length;
                    const chunk = {
                      choices: [{ delta: { content: parsed.delta.text } }],
                    };
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                    );
                  }
                } catch {}
              }
            }
          }

          // Deduct credits on stream finish
          try {
            const inTokens = Math.max(10, Math.ceil(JSON.stringify(messages).length / 4));
            const outTokens = Math.max(5, Math.ceil(anthropicOutputChars / 4));
            const { credits, multiplier } = calculateCreditUsage(modelId, inTokens, outTokens, taskType);
            const deductRes = await deductCredits({
              userId,
              creditType,
              amount: credits,
              modelId,
              taskType,
              inputTokens: inTokens,
              outputTokens: outTokens,
            });
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: "credit_usage",
                creditType,
                creditsUsed: credits,
                remainingCredits: deductRes.remainingCredits,
                multiplier,
              })}\n\n`)
            );
          } catch (deductErr) {
            console.warn("[api/chat] Error deducting Anthropic credits:", deductErr);
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (readErr) {
          controller.error(readErr);
        }
      } else {
        let standardOutputBytes = 0;
        try {
          for (const initChunk of verifiedInitialChunks) {
            standardOutputBytes += initChunk.length;
            controller.enqueue(initChunk);
          }

          while (true) {
            const { done, value } = await upstreamReader.read();
            if (done) break;
            if (value) {
              standardOutputBytes += value.length;
              controller.enqueue(value);
            }
          }

          // Deduct credits on stream finish
          try {
            const inTokens = Math.max(10, Math.ceil(JSON.stringify(messages).length / 4));
            const outTokens = Math.max(5, Math.ceil(standardOutputBytes / 10));
            const { credits, multiplier } = calculateCreditUsage(modelId, inTokens, outTokens, taskType);
            const deductRes = await deductCredits({
              userId,
              creditType,
              amount: credits,
              modelId,
              taskType,
              inputTokens: inTokens,
              outputTokens: outTokens,
            });
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: "credit_usage",
                creditType,
                creditsUsed: credits,
                remainingCredits: deductRes.remainingCredits,
                multiplier,
              })}\n\n`)
            );
          } catch (deductErr) {
            console.warn("[api/chat] Error deducting stream credits:", deductErr);
          }

          controller.close();
        } catch (readErr) {
          controller.error(readErr);
        }
      }
    },

    cancel() {
      upstreamReader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...CORS_HEADERS,
    },
  });
}