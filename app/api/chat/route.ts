export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { searchWeb, SearchResult } from "@/lib/search";

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

function getProviders(): Record<string, ProviderConfig> {
  return {
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
    if (provider && (provider.apiKey || (prefix === "ollama" && Boolean(provider.endpoint)))) {
      return { provider, modelName, providerName: prefix };
    }
    if (provider) {
      return null;
    }
  }

  for (const [prefix, provider] of Object.entries(providers)) {
    if (modelId.startsWith(prefix + "/") || modelId.startsWith(prefix + ":")) {
      const modelName = modelId.slice(prefix.length + 1);
      if (provider.apiKey || (prefix === "ollama" && Boolean(provider.endpoint))) {
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

    return Response.json(
      {
        error: `API key untuk provider "${missingKey.toUpperCase()}" belum dikonfigurasi di Environment Variables Vercel Dashboard. Silakan tambahkan ${missingKey.toUpperCase()}_API_KEY di Vercel.`,
        model: modelId,
      },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  const { provider, modelName, providerName } = resolved;

  if (providerName === "cloudflare" && !process.env.CLOUDFLARE_ACCOUNT_ID) {
    return Response.json(
      {
        error:
          "CLOUDFLARE_ACCOUNT_ID belum dikonfigurasi di Environment Variables (.env.local atau Vercel). Silakan tambahkan CLOUDFLARE_ACCOUNT_ID Anda (bisa disalin dari Cloudflare Dashboard URL atau sidebar).",
        model: modelId,
      },
      { status: 503, headers: CORS_HEADERS }
    );
  }

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

  let reqBody: string;

  if (isAnthropic) {
    const systemTexts: string[] = [];
    const anthropicMessages: { role: "user" | "assistant"; content: string }[] = [];

    for (const m of messages) {
      if (m.role === "system") {
        systemTexts.push(m.content);
      } else {
        const last = anthropicMessages[anthropicMessages.length - 1];
        if (last && last.role === m.role) {
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
      max_tokens: 4096,
    });
  } else {
    reqBody = JSON.stringify({
      model: modelName,
      messages,
      stream: true,
      max_tokens: 4096,
    });
  }

  try {
    let upstream = await fetch(provider.endpoint, {
      method: "POST",
      headers: reqHeaders,
      body: reqBody,
    });

    // ── Ollama Dual Endpoint Retry (Fall back from /v1 to /api/chat if 405/404) ─
    if (!upstream.ok && providerName === "ollama" && (upstream.status === 405 || upstream.status === 404)) {
      const cleanBase = cleanOllamaBaseUrl(process.env.OLLAMA_BASE_URL);
      if (cleanBase) {
        const nativeEndpoint = `${cleanBase}/api/chat`;
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

        if (isAnthropic) {
          let buffer = "";
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

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (readErr) {
            controller.error(readErr);
          }
        } else {
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
        error: `Tidak bisa terhubung ke provider [${providerName.toUpperCase()}] di URL "${provider.endpoint}". Detail: ${fetchErrMsg}. Periksa apakah server Ollama/Provider sedang berjalan atau periksa OLLAMA_BASE_URL.`,
      },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}