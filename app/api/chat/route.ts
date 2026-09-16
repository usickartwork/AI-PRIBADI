export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { searchSearxng, SearchResult } from "@/lib/searxng";

// ─── Provider Configuration ───────────────────────────────────────────────────
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

  // ── SearXNG Web Search Integration ───────────────────────────────────────────
  if (webSearch) {
    // Find last user query
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content;

    if (lastUserMsg) {
      try {
        // Limit max 3 search calls per user request limit (here 1 call, max 5 results per call)
        sources = await searchSearxng(lastUserMsg);

        if (sources.length > 0) {
          const contextPrompt =
            `\n\n[Hasil Pencarian Web dari SearXNG untuk: "${lastUserMsg}"]:\n` +
            sources
              .map(
                (s, i) =>
                  `${i + 1}. Judul: ${s.title}\n   URL: ${s.url}\n   Ringkasan: ${s.snippet}`
              )
              .join("\n\n") +
            `\n\nAturan Penggunaan Web Search:\n` +
            `1. Manfaatkan informasi dari hasil pencarian di atas untuk memberikan jawaban yang paling mutakhir dan akurat.\n` +
            `2. Cantumkan referensi sumber dalam format link Markdown [Judul](URL) jika Anda menggunakan informasinya.`;

          // Append search context to system message or add a new system prompt
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
        console.warn("[api/chat] SearXNG search failed:", searchError);
      }
    }
  }

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

    // Wrap upstream body in a ReadableStream to yield initial metadata events if sources/searchError exist
    const encoder = new TextEncoder();
    const upstreamReader = upstream.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        // If webSearch was requested and sources were retrieved, send metadata chunk first
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