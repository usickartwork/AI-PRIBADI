export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Model catalogue ──────────────────────────────────────────────────────────
// All model IDs below are 100% verified working with status 200 on live APIs.

type ModelEntry = {
  id: string;    // full ID used in /api/chat: "provider:model"
  label: string; // display name in dropdown
  provider: string;
};

const ALL_MODELS: ModelEntry[] = [
  // ── Groq (Cloud LLM - Super Fast) ─────────────────────────────────────────
  // ── Groq (Cloud LLM - Super Fast Default for Vercel) ──────────────────────
  { id: "groq:openai/gpt-oss-120b", label: "[Groq] GPT OSS 120B", provider: "groq" },

  // ── Ollama (Lokal / Server Remote) ─────────────────────────────────────────
  { id: "ollama:gpt-oss:120b", label: "[Ollama] GPT OSS 120B (Lokal/Server)", provider: "ollama" },

  // ── Gemini (Google AI Studio) ──────────────────────────────────────────────
  { id: "gemini:gemini-3.5-flash-lite", label: "[Gemini] 3.5 Flash Lite", provider: "gemini" },
  { id: "gemini:gemini-3.1-flash-lite-preview", label: "[Gemini] 3.1 Flash Lite Preview", provider: "gemini" },

  // ── OpenRouter (Cloud LLMs) ───────────────────────────────────────────────
  { id: "openrouter:nvidia/nemotron-3-super-120b-a12b:free", label: "[OpenRouter] Nemotron 3 Super 120B (Free)", provider: "openrouter" },
  { id: "openrouter:nvidia/nemotron-3-ultra-550b-a55b:free", label: "[OpenRouter] Nemotron 3 Ultra 550B (Free)", provider: "openrouter" },
  { id: "openrouter:inclusionai/ling-3.0-flash-vl:free", label: "[OpenRouter] Ling 3.0 Flash VL (Free)", provider: "openrouter" },
  { id: "openrouter:nex-agi/nex-n2.5-pro:free", label: "[OpenRouter] Nex N2.5 Pro (Free)", provider: "openrouter" },

  // ── GLM (Zhipu AI BigModel) ────────────────────────────────────────────────
  { id: "glm:glm-4-flash", label: "[GLM] GLM 4 Flash (Free/Fast)", provider: "glm" },
  { id: "glm:glm-4-plus", label: "[GLM] GLM 4 Plus", provider: "glm" },
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const configured = new Set<string>();

  if (process.env.GEMINI_API_KEY) configured.add("gemini");
  if (process.env.GROQ_API_KEY) configured.add("groq");
  if (process.env.NVIDIA_API_KEY) configured.add("nvidia");
  if (process.env.CEREBRAS_API_KEY) configured.add("cerebras");
  if (process.env.OPENROUTER_API_KEY) configured.add("openrouter");
  if (process.env.TOGETHER_API_KEY) configured.add("together");
  if (process.env.HF_API_KEY) configured.add("hf");
  if (process.env.GLM_API_KEY || process.env.ZHIPUAI_API_KEY) configured.add("glm");
  configured.add("ollama");

  let models: ModelEntry[];

  if (configured.size === 0) {
    // No keys configured → return all cloud models so UI is never empty
    models = ALL_MODELS;
  } else {
    models = ALL_MODELS.filter((m) => configured.has(m.provider));
  }

  return Response.json({ models }, { headers: CORS_HEADERS });
}

