export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Model catalogue ──────────────────────────────────────────────────────────
// Format model ID: "provider:actual-model-id-sent-to-api"
// This keeps the UI decoupled from provider specifics.

type ModelEntry = {
  id: string;    // full ID used in /api/chat: "provider:model"
  label: string; // display name in dropdown
  provider: string;
};

const ALL_MODELS: ModelEntry[] = [
  // ── Gemini ────────────────────────────────────────────────────────────────
  { id: "gemini:gemini-2.0-flash", label: "[Gemini] 2.0 Flash", provider: "gemini" },
  { id: "gemini:gemini-2.0-flash-lite", label: "[Gemini] 2.0 Flash Lite", provider: "gemini" },
  { id: "gemini:gemini-2.5-flash-preview-05-20", label: "[Gemini] 2.5 Flash Preview", provider: "gemini" },
  { id: "gemini:gemini-2.5-pro-preview-06-05", label: "[Gemini] 2.5 Pro Preview", provider: "gemini" },

  // ── Groq ──────────────────────────────────────────────────────────────────
  { id: "groq:llama-3.3-70b-versatile", label: "[Groq] Llama 3.3 70B Versatile", provider: "groq" },
  { id: "groq:llama3-8b-8192", label: "[Groq] Llama 3 8B", provider: "groq" },
  { id: "groq:deepseek-r1-distill-llama-70b", label: "[Groq] DeepSeek R1 70B", provider: "groq" },
  { id: "groq:qwen-qwq-32b", label: "[Groq] QwQ 32B", provider: "groq" },
  { id: "groq:meta-llama/llama-4-maverick-17b-128e-instruct", label: "[Groq] Llama 4 Maverick 17B", provider: "groq" },

  // ── Cerebras ──────────────────────────────────────────────────────────────
  { id: "cerebras:llama-3.3-70b", label: "[Cerebras] Llama 3.3 70B", provider: "cerebras" },
  { id: "cerebras:llama3.1-8b", label: "[Cerebras] Llama 3.1 8B", provider: "cerebras" },
  { id: "cerebras:qwen-3-32b", label: "[Cerebras] Qwen 3 32B", provider: "cerebras" },

  // ── OpenRouter ────────────────────────────────────────────────────────────
  { id: "openrouter:deepseek/deepseek-chat-v3-0324:free", label: "[OpenRouter] DeepSeek V3 (free)", provider: "openrouter" },
  { id: "openrouter:meta-llama/llama-3.3-70b-instruct:free", label: "[OpenRouter] Llama 3.3 70B (free)", provider: "openrouter" },
  { id: "openrouter:google/gemma-3-27b-it:free", label: "[OpenRouter] Gemma 3 27B (free)", provider: "openrouter" },
  { id: "openrouter:qwen/qwq-32b:free", label: "[OpenRouter] QwQ 32B (free)", provider: "openrouter" },
  { id: "openrouter:mistralai/mistral-7b-instruct:free", label: "[OpenRouter] Mistral 7B (free)", provider: "openrouter" },
  { id: "openrouter:google/gemini-2.0-flash-exp:free", label: "[OpenRouter] Gemini 2.0 Flash (free)", provider: "openrouter" },

  // ── Together AI ───────────────────────────────────────────────────────────
  { id: "together:meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "[Together] Llama 3.3 70B Turbo", provider: "together" },
  { id: "together:deepseek-ai/DeepSeek-R1", label: "[Together] DeepSeek R1", provider: "together" },
  { id: "together:Qwen/Qwen3-235B-A22B", label: "[Together] Qwen3 235B", provider: "together" },
  { id: "together:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", label: "[Together] Llama 4 Maverick", provider: "together" },

  // ── HuggingFace ───────────────────────────────────────────────────────────
  { id: "hf:meta-llama/Llama-3.1-8B-Instruct", label: "[HF] Llama 3.1 8B", provider: "hf" },
  { id: "hf:Qwen/Qwen2.5-72B-Instruct", label: "[HF] Qwen 2.5 72B", provider: "hf" },
  { id: "hf:deepseek-ai/DeepSeek-V3", label: "[HF] DeepSeek V3", provider: "hf" },
  { id: "hf:google/gemma-3-27b-it", label: "[HF] Gemma 3 27B", provider: "hf" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─── CORS preflight ───────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ─── GET /api/models ──────────────────────────────────────────────────────────
// Returns only models whose provider has an API key configured.

export async function GET() {
  const configured = new Set<string>();

  if (process.env.GEMINI_API_KEY) configured.add("gemini");
  if (process.env.GROQ_API_KEY) configured.add("groq");
  if (process.env.CEREBRAS_API_KEY) configured.add("cerebras");
  if (process.env.OPENROUTER_API_KEY) configured.add("openrouter");
  if (process.env.TOGETHER_API_KEY) configured.add("together");
  if (process.env.HF_API_KEY) configured.add("hf");

  let models: ModelEntry[];

  if (configured.size === 0) {
    // No keys configured → return all models so UI is never empty
    // (chat will fail with a clear error message about missing key)
    models = ALL_MODELS;
  } else {
    models = ALL_MODELS.filter((m) => configured.has(m.provider));
  }

  return Response.json({ models }, { headers: CORS_HEADERS });
}
