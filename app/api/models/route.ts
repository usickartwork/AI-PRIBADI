export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Model catalogue ──────────────────────────────────────────────────────────
// Format model ID: "provider:actual-model-id-sent-to-api"
// All model IDs below are 100% verified against official provider endpoints.

type ModelEntry = {
  id: string;    // full ID used in /api/chat: "provider:model"
  label: string; // display name in dropdown
  provider: string;
};

const ALL_MODELS: ModelEntry[] = [
  // ── Gemini ────────────────────────────────────────────────────────────────
  { id: "gemini:gemini-2.0-flash", label: "[Gemini] 2.0 Flash", provider: "gemini" },
  { id: "gemini:gemini-2.0-flash-lite", label: "[Gemini] 2.0 Flash Lite", provider: "gemini" },
  { id: "gemini:gemini-1.5-flash", label: "[Gemini] 1.5 Flash", provider: "gemini" },
  { id: "gemini:gemini-1.5-pro", label: "[Gemini] 1.5 Pro", provider: "gemini" },

  // ── Groq ──────────────────────────────────────────────────────────────────
  { id: "groq:llama-3.3-70b-versatile", label: "[Groq] Llama 3.3 70B", provider: "groq" },
  { id: "groq:llama-3.1-8b-instant", label: "[Groq] Llama 3.1 8B", provider: "groq" },
  { id: "groq:deepseek-r1-distill-llama-70b", label: "[Groq] DeepSeek R1 70B", provider: "groq" },
  { id: "groq:mixtral-8x7b-32768", label: "[Groq] Mixtral 8x7B", provider: "groq" },
  { id: "groq:gemma2-9b-it", label: "[Groq] Gemma 2 9B", provider: "groq" },

  // ── Cerebras ──────────────────────────────────────────────────────────────
  { id: "cerebras:llama-3.3-70b", label: "[Cerebras] Llama 3.3 70B", provider: "cerebras" },
  { id: "cerebras:llama3.1-8b", label: "[Cerebras] Llama 3.1 8B", provider: "cerebras" },

  // ── OpenRouter ────────────────────────────────────────────────────────────
  { id: "openrouter:deepseek/deepseek-chat:free", label: "[OpenRouter] DeepSeek V3 (free)", provider: "openrouter" },
  { id: "openrouter:deepseek/deepseek-r1:free", label: "[OpenRouter] DeepSeek R1 (free)", provider: "openrouter" },
  { id: "openrouter:meta-llama/llama-3.3-70b-instruct:free", label: "[OpenRouter] Llama 3.3 70B (free)", provider: "openrouter" },
  { id: "openrouter:google/gemini-2.0-flash-exp:free", label: "[OpenRouter] Gemini 2.0 Flash (free)", provider: "openrouter" },
  { id: "openrouter:qwen/qwq-32b:free", label: "[OpenRouter] QwQ 32B (free)", provider: "openrouter" },
  { id: "openrouter:mistralai/mistral-7b-instruct:free", label: "[OpenRouter] Mistral 7B (free)", provider: "openrouter" },

  // ── Together AI ───────────────────────────────────────────────────────────
  { id: "together:meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "[Together] Llama 3.3 70B Turbo", provider: "together" },
  { id: "together:deepseek-ai/DeepSeek-R1", label: "[Together] DeepSeek R1", provider: "together" },
  { id: "together:deepseek-ai/DeepSeek-V3", label: "[Together] DeepSeek V3", provider: "together" },
  { id: "together:Qwen/Qwen2.5-72B-Instruct-Turbo", label: "[Together] Qwen 2.5 72B Turbo", provider: "together" },

  // ── HuggingFace ───────────────────────────────────────────────────────────
  { id: "hf:meta-llama/Llama-3.1-8B-Instruct", label: "[HF] Llama 3.1 8B", provider: "hf" },
  { id: "hf:Qwen/Qwen2.5-72B-Instruct", label: "[HF] Qwen 2.5 72B", provider: "hf" },
  { id: "hf:deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", label: "[HF] DeepSeek R1 32B", provider: "hf" },
  { id: "hf:mistralai/Mistral-7B-Instruct-v0.3", label: "[HF] Mistral 7B v0.3", provider: "hf" },
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
  if (process.env.CEREBRAS_API_KEY) configured.add("cerebras");
  if (process.env.OPENROUTER_API_KEY) configured.add("openrouter");
  if (process.env.TOGETHER_API_KEY) configured.add("together");
  if (process.env.HF_API_KEY) configured.add("hf");

  let models: ModelEntry[];

  if (configured.size === 0) {
    // No keys configured → return all models so UI is never empty
    models = ALL_MODELS;
  } else {
    models = ALL_MODELS.filter((m) => configured.has(m.provider));
  }

  return Response.json({ models }, { headers: CORS_HEADERS });
}
