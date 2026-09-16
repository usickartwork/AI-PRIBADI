export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { searchWeb, SearchResult } from "@/lib/search";

// ─── Provider Configuration ───────────────────────────────────────────────────
type ProviderConfig = {
  endpoint: string;
  apiKey: string;
};

function getOllamaEndpoint(rawUrl?: string): string {
  const base = rawUrl?.trim() || "";
  if (!base) return "";
  const clean = base.replace(/\/+$/, "");
  if (clean.endsWith("/chat/completions") || clean.endsWith("/api/chat")) return clean;
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

  const colonIdx = modelId.indexOf(":");
  if (colonIdx > 0) {
    const prefix = modelId.slice(0, colonIdx);
    const modelName = modelId.slice(colonIdx + 1);
    const provider = providers[prefix];
    if (provider && (provider.apiKey || (prefix === "ollama" && Boolean(process.env.OLLAMA_BASE_URL?.trim())))) {
      return { provider, modelName, providerName: prefix };
    }
    if (provider) {
      return null;
    }
  }

  for (const [prefix, provider] of Object.entries(providers)) {
    if (modelId.startsWith(prefix + "/") || modelId.startsWith(prefix + ":")) {
      const modelName = modelId.slice(prefix.length + 1);
      if (provider.apiKey || (prefix === "ollama" && Boolean(process.env.OLLAMA_BASE_URL?.trim()))) {
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
  let body: { messages?: ChatMessage[]; model?: string; webSearch?: boolean };

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

  const resolved = resolveProvider(modelId);

  if (!resolved) {
    const missingKey = modelId.split(/[:/]/)[0] || "provider";
    console.error(`[api/chat] Provider or key not configured for model: ${modelId}`);

    if (missingKey.toLowerCase() === "ollama") {
      return Response.json(
        {
          error:
            "OLLAMA_BASE_URL belum dikonfigurasi pada Vercel Dashboard (Settings -> Environment Variables). Silakan tambahkan OLLAMA_BASE_URL dengan URL server Ollama publik Anda.",
          model: modelId,
        },
        { status: 400, headers: CORS_HEADERS }
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

    // ── Ollama Dual Endpoint Retry (Fall back from /v1 to /api/chat if 405/404) ─
    if (!upstream.ok && providerName === "ollama" && (upstream.status === 405 || upstream.status === 404)) {
      const baseUrl = (process.env.OLLAMA_BASE_URL || "").replace(/\/+$/, "");
      if (baseUrl) {
        const nativeEndpoint = `${baseUrl}/api/chat`;
        console.warn(`[api/chat] Ollama ${provider.endpoint} returned ${upstream.status}, trying native ${nativeEndpoint}`);

        const nativeUpstream = await fetch(nativeEndpoint, {
          method: "POST",
          headers: reqHeaders,
          body: JSON.stringify({
            model: modelName,
            messages,
            stream: true,
          }),
        });

        if (nativeUpstream.ok) {
          upstream = nativeUpstream;
        }
      }
    }

    // ── Gemini Fallback ────────────────────────────────────────────────────────
    if (
      !upstream.ok &&
      (upstream.status === 503 || upstream.status === 429) &&
      providerName === "gemini" &&
      modelName !== "gemini-3.5-flash-lite"
    ) {
      console.warn(
        `[api/chat] ${modelName} returned ${upstream.status}, trying fallback gemini-3.5-flash-lite`
      );
      const fallbackBody = JSON.stringify({
        model: "gemini-3.5-flash-lite",
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
          sources,
          searchError,
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

    const encoder = new TextEncoder();
    const upstreamReader = upstream.body.getReader();

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

        try {
          while (true) {
            const { done, value } = await upstreamReader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (readErr) {
          controller.error(readErr);
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
  } catch (err: unknown) {
    const fetchErrMsg = err instanceof Error ? err.message : String(err);
    console.error(`[api/chat] network error for ${modelId}:`, fetchErrMsg);
    return Response.json(
      {
        error: `Tidak bisa terhubung ke provider [${providerName.toUpperCase()}] pada URL "${provider.endpoint}". Detail: ${fetchErrMsg}. Periksa OLLAMA_BASE_URL di Vercel Dashboard.`,
      },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}