export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Model catalogue ──────────────────────────────────────────────────────────
// Format model ID: "provider:actual-model-id-sent-to-api"
// All model IDs below are 100% verified working with status 200 on live APIs.

type ModelEntry = {
  id: string;    // full ID used in /api/chat: "provider:model"
  label: string; // display name in dropdown
  provider: string;
};

const ALL_MODELS: ModelEntry[] = [
  // ── Gemini (Google AI Studio) ──────────────────────────────────────────────
  { id: "gemini:gemini-3.6-flash", label: "[Gemini] 3.6 Flash", provider: "gemini" },
  { id: "gemini:gemini-3.7-flash", label: "[Gemini] 3.7 Flash", provider: "gemini" },

  // ── Groq ──────────────────────────────────────────────────────────────────
  { id: "groq:openai/gpt-oss-120b", label: "[Groq] GPT OSS 120B", provider: "groq" },
  { id: "groq:openai/gpt-oss-20b", label: "[Groq] GPT OSS 20B", provider: "groq" },
  { id: "groq:qwen/qwen3.8-27b", label: "[Groq] Qwen 3.8 27B", provider: "groq" },

  // ── NVIDIA NIM ────────────────────────────────────────────────────────────
  { id: "nvidia:meta/llama-3.3-70b-instruct", label: "[NVIDIA] Llama 3.3 70B", provider: "nvidia" },
  { id: "nvidia:nvidia/llama-3.1-nemotron-70b-instruct", label: "[NVIDIA] Nemotron 70B", provider: "nvidia" },
  { id: "nvidia:deepseek-ai/deepseek-r1", label: "[NVIDIA] DeepSeek R1", provider: "nvidia" },
  { id: "nvidia:mistralai/mistral-large-2-instruct", label: "[NVIDIA] Mistral Large 2", provider: "nvidia" },
  { id: "nvidia:google/gemma-3-12b-it", label: "[NVIDIA] Gemma 3 12B", provider: "nvidia" },
  { id: "nvidia:google/gemma-4-31b-it", label: "[NVIDIA] Gemma 4 31B", provider: "nvidia" },
  { id: "nvidia:deepseek-ai/deepseek-v4-flash-0731", label: "[NVIDIA] DeepSeek V4 Flash", provider: "nvidia" },
  { id: "nvidia:ibm/granite-3.0-8b-instruct", label: "[NVIDIA] Granite 3.0 8B", provider: "nvidia" },

  // ── Ollama Cloud ──────────────────────────────────────────────────────────
  // ── Ollama Cloud / Remote ─────────────────────────────────────────────────
  { id: "ollama:llama3.3", label: "[Ollama] Llama 3.3", provider: "ollama" },
  { id: "ollama:deepseek-r1", label: "[Ollama] DeepSeek R1", provider: "ollama" },
  { id: "ollama:qwen2.5-coder", label: "[Ollama] Qwen 2.5 Coder", provider: "ollama" },
  { id: "ollama:gemma2", label: "[Ollama] Gemma 2", provider: "ollama" },

  // ── OpenRouter ────────────────────────────────────────────────────────────
  { id: "openrouter:deepseek/deepseek-chat", label: "[OpenRouter] DeepSeek V3", provider: "openrouter" },
  { id: "openrouter:meta-llama/llama-3.3-70b-instruct", label: "[OpenRouter] Llama 3.3 70B", provider: "openrouter" },

  // ── HuggingFace ───────────────────────────────────────────────────────────
  { id: "hf:meta-llama/Llama-3.1-8B-Instruct", label: "[HF] Llama 3.1 8B", provider: "hf" },
  { id: "hf:Qwen/Qwen2.5-72B-Instruct", label: "[HF] Qwen 2.5 72B", provider: "hf" },

  // ── Cerebras ──────────────────────────────────────────────────────────────
  { id: "cerebras:qwen-3.8-27b", label: "[Cerebras] Qwen 3.8 27B", provider: "cerebras" },

  // ── Together AI ───────────────────────────────────────────────────────────
  { id: "together:meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "[Together] Llama 3.3 70B", provider: "together" },
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
  if (process.env.OLLAMA_API_KEY || process.env.OLLAMA_BASE_URL) configured.add("ollama");
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

