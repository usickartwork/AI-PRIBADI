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

  const { provider, modelName, providerName } = resolved;

  if (providerName === "custom" && !provider.endpoint) {
    return Response.json(
      {
        error:
          "CUSTOM_BASE_URL belum dikonfigurasi di Environment Variables (.env.local atau Vercel Dashboard). Silakan isi CUSTOM_BASE_URL dengan URL server API Anda.",
        model: modelId,
      },
      { status: 503, headers: CORS_HEADERS }
    );
  }

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
    const anthropicMessages: { role: "user" | "assistant"; content: any }[] = [];

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
      max_tokens: 4096,
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
      modelId.toLowerCase().includes("deepseek-r1");

    let messagesToSend = formattedMessages;
    if (isDeepSeekR1) {
      messagesToSend = formattedMessages.filter((m) => m.role !== "system");
    }

    if (providerName === "openrouter") {
      const isNemotron = modelName.toLowerCase().includes("nemotron");
      const openRouterModels = isNemotron
        ? [
            modelName,
            "nvidia/nemotron-3.5-lightning:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
          ]
        : [modelName];

      reqBody = JSON.stringify({
        model: modelName,
        models: openRouterModels,
        messages: messagesToSend,
        stream: true,
        max_tokens: 4096,
      });
    } else {
      reqBody = JSON.stringify({
        model: modelName,
        messages: messagesToSend,
        stream: true,
        max_tokens: 4096,
      });
    }
  }

  try {
    const isDeepSeekR1 =
      modelName.toLowerCase().includes("deepseek-r1") ||
      modelId.toLowerCase().includes("deepseek-r1");
    const timeoutMs = isDeepSeekR1 ? 60000 : 35000;

    let upstream = await fetch(provider.endpoint, {
      method: "POST",
      headers: reqHeaders,
      body: reqBody,
      signal: AbortSignal.timeout(timeoutMs),
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

      const hasImage = messages.some((m) => Boolean(m.image));
      const isVisionError =
        hasImage &&
        (upstream.status === 400 || upstream.status === 404 || upstream.status === 422) &&
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
            error: `Model ini saat ini tidak mendukung analisis gambar atau foto.\n\nBerikut adalah model yang **mendukung analisis foto / Vision**:\n• **Gemini**\n• **Qwen**\n\nSilakan pilih model **Gemini** atau **Qwen** pada menu pilihan model untuk menganalisis foto Anda.`,
            isVisionUnsupported: true,
            model: modelId,
            sources,
            searchError,
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const isLimitError =
        upstream.status === 429 ||
        upstream.status === 402 ||
        upstream.status === 400 || // Cloudflare returns 400 for neuron/token limit
        errText.toLowerCase().includes("rate limit") ||
        errText.toLowerCase().includes("quota") ||
        errText.toLowerCase().includes("limit") ||
        errText.toLowerCase().includes("exceeded") ||
        errText.toLowerCase().includes("exhausted") ||
        errText.toLowerCase().includes("capacity") ||
        errText.toLowerCase().includes("overloaded");

      return Response.json(
        {
          error: `Provider [${providerName.toUpperCase()}] merespons error (HTTP ${upstream.status}): ${detailMsg}`,
          detail: errText.slice(0, 300),
          isLimit: isLimitError,
          model: modelId,
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

    const isTimeout =
      (err instanceof DOMException && err.name === "TimeoutError") ||
      (err instanceof Error && err.name === "TimeoutError") ||
      fetchErrMsg.toLowerCase().includes("timeout") ||
      fetchErrMsg.toLowerCase().includes("aborted");

    if (isTimeout) {
      return Response.json(
        {
          error: `Provider [${providerName.toUpperCase()}] tidak merespons dalam 25 detik (upstream timeout / server model sedang offline atau antrean penuh). Silakan coba lagi nanti atau pilih model lain.`,
          model: modelId,
          isLimit: true,
        },
        { status: 504, headers: CORS_HEADERS }
      );
    }

    return Response.json(
      {
        error: `Tidak bisa terhubung ke provider [${providerName.toUpperCase()}] di URL "${provider.endpoint}". Detail: ${fetchErrMsg}. Periksa apakah server/koneksi provider sedang aktif atau periksa API Key / URL konfigurasi.`,
      },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}