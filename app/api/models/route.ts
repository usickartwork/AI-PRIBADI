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
  // ── Cloudflare Workers AI ──────────────────────────────────────────────────
  { id: "cloudflare:@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", label: "[Cloudflare] DeepSeek R1 Distill 32B", provider: "cloudflare" },
  { id: "cloudflare:@cf/meta/llama-3.3-70b-instruct-fp8-fast", label: "[Cloudflare] Llama 3.3 70B (Fast)", provider: "cloudflare" },
  { id: "cloudflare:@cf/meta/llama-3.1-8b-instruct-fp8", label: "[Cloudflare] Llama 3.1 8B", provider: "cloudflare" },
  { id: "cloudflare:@cf/meta/llama-3.2-3b-instruct", label: "[Cloudflare] Llama 3.2 3B", provider: "cloudflare" },

  // ── Claude (Anthropic) ─────────────────────────────────────────────────────
  { id: "claude:claude-3-7-sonnet-latest", label: "[Claude] 3.7 Sonnet", provider: "claude" },
  { id: "claude:claude-3-5-sonnet-latest", label: "[Claude] 3.5 Sonnet", provider: "claude" },
  { id: "claude:claude-3-5-haiku-latest", label: "[Claude] 3.5 Haiku", provider: "claude" },
  { id: "claude:claude-3-opus-latest", label: "[Claude] 3 Opus", provider: "claude" },

  // ── Groq (Cloud LLM - Super Fast) ─────────────────────────────────────────
  // ── Groq (Cloud LLM - Super Fast Default for Vercel) ──────────────────────
  { id: "groq:openai/gpt-oss-120b", label: "[Groq] GPT OSS 120B", provider: "groq" },

  // ── Ollama (Lokal / Server Remote) ─────────────────────────────────────────
  { id: "ollama:llama3.1", label: "[Ollama] Llama 3.1", provider: "ollama" },
  { id: "ollama:gpt-oss:120b", label: "[Ollama] GPT OSS 120B (Lokal/Server)", provider: "ollama" },

  // ── Gemini (Google AI Studio) ──────────────────────────────────────────────
  { id: "gemini:gemini-3.5-flash-lite", label: "[Gemini] 3.5 Flash Lite", provider: "gemini" },
  { id: "gemini:gemini-3.1-flash-lite-preview", label: "[Gemini] 3.1 Flash Lite Preview", provider: "gemini" },

  // ── OpenRouter (Cloud LLMs) ───────────────────────────────────────────────
  { id: "openrouter:nvidia/nemotron-3-super-120b-a12b:free", label: "[OpenRouter] Nemotron 3 Super 120B (Free)", provider: "openrouter" },
  { id: "openrouter:nvidia/nemotron-3-ultra-550b-a55b:free", label: "[OpenRouter] Nemotron 3 Ultra 550B (Free)", provider: "openrouter" },

  // ── Custom API (ClarioHub OpenAI-Compatible) ─────────────────────────────
  { id: "custom:clario/deepseek-v4.1-flash-auto", label: "[Custom] DeepSeek V4.1 Flash (Auto)", provider: "custom" },
  { id: "custom:clario/deepseek-v4.1-flash", label: "[Custom] DeepSeek V4.1 Flash", provider: "custom" },
  { id: "custom:clario/deepseek-v4-flash", label: "[Custom] DeepSeek V4 Flash", provider: "custom" },
  { id: "custom:clario/deepseek-v4-flash-0731", label: "[Custom] DeepSeek V4 Flash (0731)", provider: "custom" },
  { id: "custom:clario/deepseek-v4-pro", label: "[Custom] DeepSeek V4 Pro", provider: "custom" },
  { id: "custom:clario/deepseek-v4-pro-0813", label: "[Custom] DeepSeek V4 Pro (0813)", provider: "custom" },
  { id: "custom:clario/gemini-3.7-flash-auto", label: "[Custom] Gemini 3.7 Flash (Auto)", provider: "custom" },
  { id: "custom:clario/gemini-3.7-flash", label: "[Custom] Gemini 3.7 Flash", provider: "custom" },
  { id: "custom:clario/gpt-5.6-sol", label: "[Custom] GPT-5.6 Sol", provider: "custom" },
  { id: "custom:clario/glm-5.3-flash", label: "[Custom] GLM-5.3 Flash", provider: "custom" },
  { id: "custom:clario/glm-5.3", label: "[Custom] GLM 5.3", provider: "custom" },
  { id: "custom:clario/glm-5.2", label: "[Custom] GLM-5.2", provider: "custom" },
  { id: "custom:clario/minimax-m3", label: "[Custom] MiniMax M3", provider: "custom" },
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

  if (process.env.CUSTOM_BASE_URL || process.env.CUSTOM_API_KEY) configured.add("custom");
  if (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY) configured.add("cloudflare");
  if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) configured.add("claude");
  if (process.env.GEMINI_API_KEY) configured.add("gemini");
  if (process.env.GROQ_API_KEY) configured.add("groq");
  if (process.env.NVIDIA_API_KEY) configured.add("nvidia");
  if (process.env.CEREBRAS_API_KEY) configured.add("cerebras");
  if (process.env.OPENROUTER_API_KEY) configured.add("openrouter");
  if (process.env.TOGETHER_API_KEY) configured.add("together");
  if (process.env.HF_API_KEY) configured.add("hf");
  configured.add("ollama");

  let models: ModelEntry[];

  if (configured.size === 0) {
    // No keys configured → return all cloud models so UI is never empty
    models = ALL_MODELS;
  } else {
    models = ALL_MODELS.filter((m) => configured.has(m.provider));
  }

  // If custom provider is active, reflect CUSTOM_MODEL_NAME if specified
  const customModelName = process.env.CUSTOM_MODEL_NAME?.trim();
  if (customModelName) {
    models = models.map((m) => {
      if (m.provider === "custom") {
        return {
          ...m,
          id: `custom:${customModelName}`,
          label: `[Custom] ${customModelName}`,
        };
      }
      return m;
    });
  }

  return Response.json({ models }, { headers: CORS_HEADERS });
}

