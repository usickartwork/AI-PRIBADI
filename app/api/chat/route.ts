export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Provider Configuration ───────────────────────────────────────────────────
// Each provider maps a model-prefix to its OpenAI-compatible endpoint.
// Model ID format in the UI: "provider:model-name"
// e.g. "gemini:gemini-3.6-flash", "groq:openai/gpt-oss-120b"

type ProviderConfig = {
  endpoint: string;
  apiKey: string;
};

function getOllamaEndpoint(rawUrl?: string): string {
  const base = rawUrl?.trim() || "https://api.ollama.com";
  const clean = base.replace(/\/+$/, "");
  if (clean.endsWith("/chat/completions")) return clean;
  if (clean.endsWith("/v1")) return clean + "/chat/completions";
  return clean + "/v1/chat/completions";
}

function getProviders(): Record<string, ProviderConfig> {
  return {
    gemini: {
      endpoint:
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: process.env.GEMINI_API_KEY || "",
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
    together: {
      endpoint: "https://api.together.xyz/v1/chat/completions",
      apiKey: process.env.TOGETHER_API_KEY || "",
    },
    hf: {
      endpoint: "https://router.huggingface.co/v1/chat/completions",
      apiKey: process.env.HF_API_KEY || "",
    },
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveProvider(modelId: string): {
  provider: ProviderConfig;
  modelName: string;
  providerName: string;
} | null {
  const providers = getProviders();

  // Model ID format: "prefix:actual-model-name"
  const colonIdx = modelId.indexOf(":");
  if (colonIdx > 0) {
    const prefix = modelId.slice(0, colonIdx);
    const modelName = modelId.slice(colonIdx + 1);
    const provider = providers[prefix];
    if (provider && (provider.apiKey || prefix === "ollama")) {
      return { provider, modelName, providerName: prefix };
    }
    if (provider) {
      return null;
    }
  }

  // Legacy fallback: try to match prefix from model string (e.g. "gemini/gemini-flash")
  for (const [prefix, provider] of Object.entries(providers)) {
    if (modelId.startsWith(prefix + "/") || modelId.startsWith(prefix + ":")) {
      const modelName = modelId.slice(prefix.length + 1);
      if (provider.apiKey || prefix === "ollama") {
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
  let body: { messages?: ChatMessage[]; model?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const messages = body.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "Messages required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const modelId = body.model || "";
  const resolved = resolveProvider(modelId);

  if (!resolved) {
    const missingKey = modelId.split(/[:/]/)[0] || "provider";
    console.error(`[api/chat] No API key configured for model: ${modelId}`);
    return Response.json(
      {
        error: `API key untuk provider "${missingKey.toUpperCase()}" belum dikonfigurasi di Environment Variables Vercel. Silakan tambahkan ${missingKey.toUpperCase()}_API_KEY di Vercel Dashboard.`,
        model: modelId,
      },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  const { provider, modelName, providerName } = resolved;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (provider.apiKey) {
    reqHeaders["Authorization"] = `Bearer ${provider.apiKey}`;
  }

  const reqBody = JSON.stringify({
    model: modelName,
    messages,
    stream: true,
    max_tokens: 4096,
  });

  try {
    let upstream = await fetch(provider.endpoint, {
      method: "POST",
      headers: reqHeaders,
      body: reqBody,
    });

    // Auto-fallback if primary model is experiencing high demand (503/429)
    if (
      !upstream.ok &&
      (upstream.status === 503 || upstream.status === 429) &&
      providerName === "gemini" &&
      modelName !== "gemini-3.6-flash"
    ) {
      console.warn(
        `[api/chat] ${modelName} returned ${upstream.status}, trying fallback gemini-3.6-flash`
      );
      const fallbackBody = JSON.stringify({
        model: "gemini-3.6-flash",
        messages,
        stream: true,
        max_tokens: 4096,
      });
      const fallbackUpstream = await fetch(provider.endpoint, {
        method: "POST",
        headers: reqHeaders,
        body: fallbackBody,
      });
      if (fallbackUpstream.ok) {
        upstream = fallbackUpstream;
      }
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error(
        `[api/chat] upstream error ${upstream.status} for ${modelId}:`,
        errText.slice(0, 300)
      );

      let detailMsg = errText.slice(0, 200);
      try {
        const parsed = JSON.parse(errText) as {
          error?: { message?: string };
          message?: string;
          detail?: string;
        };
        if (parsed.error?.message) {
          detailMsg = parsed.error.message;
        } else if (parsed.message) {
          detailMsg = parsed.message;
        } else if (parsed.detail) {
          detailMsg = parsed.detail;
        }
      } catch {}

      return Response.json(
        {
          error: `Provider [${providerName.toUpperCase()}] merespons error (HTTP ${upstream.status}): ${detailMsg}`,
          detail: errText.slice(0, 300),
        },
        { status: upstream.status, headers: CORS_HEADERS }
      );
    }

    if (!upstream.body) {
      return Response.json(
        { error: `Provider [${providerName.toUpperCase()}] tidak mengembalikan response body.` },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error(`[api/chat] network error for ${modelId}:`, err);
    return Response.json(
      {
        error: `Tidak bisa terhubung ke provider [${providerName.toUpperCase()}]. Periksa koneksi internet Vercel atau API key.`,
      },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}