"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownMessage } from "./components/MarkdownMessage";

type Role = "user" | "assistant";

type SearchSource = {
  title: string;
  url: string;
  snippet?: string;
};

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  sources?: SearchSource[];
  searchError?: string;
};

type ModelEntry = {
  id: string;
  label: string;
  provider?: string;
};

type StreamChunk = {
  type?: string;
  sources?: SearchSource[];
  error?: string;
  choices?: {
    delta?: { content?: string };
    message?: { content?: string };
  }[];
};

const STORAGE_KEY = "filius-ai-history";

const FALLBACK_MODELS: ModelEntry[] = [
  { id: "groq:openai/gpt-oss-120b", label: "[Groq] GPT OSS 120B" },
  { id: "gemini:gemini-3.5-flash-lite", label: "[Gemini] 3.5 Flash Lite" },
  { id: "gemini:gemini-3.1-flash-lite-preview", label: "[Gemini] 3.1 Flash Lite Preview" },
  { id: "openrouter:nvidia/nemotron-3-super-120b-a12b:free", label: "[OpenRouter] Nemotron 3 Super 120B (Free)" },
  { id: "openrouter:nvidia/nemotron-3-ultra-550b-a55b:free", label: "[OpenRouter] Nemotron 3 Ultra 550B (Free)" },
  { id: "openrouter:inclusionai/ling-3.0-flash-vl:free", label: "[OpenRouter] Ling 3.0 Flash VL (Free)" },
  { id: "openrouter:nex-agi/nex-n2.5-pro:free", label: "[OpenRouter] Nex N2.5 Pro (Free)" },
];

const SYSTEM_PROMPT =
  "Kamu adalah Filius AI, asisten kecerdasan buatan tingkat lanjut yang sangat pintar, cerdas, berwawasan luas, profesional, dan ramah.\n\n" +
  "Aturan Jawaban:\n" +
  "1. Berikan jawaban yang mendalam, terstruktur rapi, dan mudah dipahami dalam bahasa Indonesia.\n" +
  "2. Gunakan Markdown yang kaya (**cetak tebal**, *miring*, daftar poin, nomor, dan tabel) untuk menyusun jawaban agar terlihat rapi dan profesional seperti ChatGPT.\n" +
  "3. Untuk potongan kode/program, SELALU gunakan fenced code block dengan menyertakan nama bahasa pemrograman (misalnya ```python atau ```javascript).\n" +
  "4. Jawab pertanyaan pengguna secara akurat, lugas, solutif, dan berikan penjelasan konseptual bila relevan.";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Halo! Aku adalah **Filius AI**, asisten pribadimu yang siap membantumu setiap hari. " +
    "Tanyakan apa saja — belajar, kerja, ide, atau sekadar ngobrol.",
};

function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [models, setModels] = useState<ModelEntry[]>(FALLBACK_MODELS);
  const [model, setModel] = useState(FALLBACK_MODELS[0].id);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load model list from server
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data: { models?: ModelEntry[] }) => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
          setModel(data.models[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, statusMessage]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setError(null);
    setIsStreaming(true);
    if (webSearchEnabled) {
      setStatusMessage("🔎 Searching the web...");
    } else {
      setStatusMessage(null);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantId = "";

    try {
      const userMsg: ChatMessage = {
        id: generateUUID(),
        role: "user",
        content: text,
      };
      const history = [...messages, userMsg].filter((m) => m.id !== "welcome");
      setMessages([...messages, userMsg]);
      setInput("");

      assistantId = generateUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      const apiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          webSearch: webSearchEnabled,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error ||
            `Terjadi kesalahan (HTTP ${res.status}). Periksa konfigurasi API key di Vercel.`
        );
      }

      const updateAssistantContent = (text: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
        );
      };

      const updateAssistantSources = (sources: SearchSource[]) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, sources } : m))
        );
      };

      const updateAssistantSearchError = (searchError: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, searchError } : m))
        );
      };

      if (!res.body || !res.body.getReader) {
        const full = await res.text();
        const lines = full.split("\n");
        let fullText = "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const chunk = JSON.parse(data) as StreamChunk;
            if (chunk.type === "sources" && chunk.sources) {
              updateAssistantSources(chunk.sources);
            } else if (chunk.type === "search_error" && chunk.error) {
              updateAssistantSearchError(chunk.error);
            } else {
              const delta =
                chunk.choices?.[0]?.delta?.content ??
                chunk.choices?.[0]?.message?.content;
              if (delta) fullText += delta;
            }
          } catch {}
        }
        updateAssistantContent(fullText);
        setStatusMessage(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data) as StreamChunk;
            if (chunk.type === "sources" && Array.isArray(chunk.sources)) {
              setStatusMessage(null);
              updateAssistantSources(chunk.sources);
            } else if (chunk.type === "search_error" && chunk.error) {
              setStatusMessage(null);
              updateAssistantSearchError(chunk.error);
            } else {
              const delta =
                chunk.choices?.[0]?.delta?.content ??
                chunk.choices?.[0]?.message?.content;
              if (delta) {
                setStatusMessage(null);
                fullText += delta;
                updateAssistantContent(fullText);
              }
            }
          } catch {}
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data:")) {
          const data = trimmed.slice(5).trim();
          if (data !== "[DONE]") {
            try {
              const chunk = JSON.parse(data) as StreamChunk;
              if (chunk.type === "sources" && Array.isArray(chunk.sources)) {
                updateAssistantSources(chunk.sources);
              } else if (chunk.type === "search_error" && chunk.error) {
                updateAssistantSearchError(chunk.error);
              } else {
                const delta =
                  chunk.choices?.[0]?.delta?.content ??
                  chunk.choices?.[0]?.message?.content;
                if (delta) updateAssistantContent(fullText + delta);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Chat error:", err);
      setError((err as Error).message);
      if (assistantId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Maaf, terjadi kesalahan saat menghubungi AI. " +
                    "Periksa koneksi atau konfigurasi API key.",
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setStatusMessage(null);
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  };

  const newChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setIsStreaming(false);
    setStatusMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            F
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold">Filius AI</h1>
            <p className="text-xs text-muted">Asisten AI pribadimu</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* SearXNG Web Search Toggle */}
          <button
            type="button"
            onClick={() => setWebSearchEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              webSearchEnabled
                ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 shadow-sm"
                : "border-zinc-800 bg-surface text-zinc-400 hover:bg-surface-hover hover:text-zinc-200"
            }`}
            title="Toggle Web Search (SearXNG)"
          >
            <span>🌐 Web Search:</span>
            <span className={webSearchEnabled ? "font-bold text-emerald-400" : "text-zinc-500"}>
              {webSearchEnabled ? "ON" : "OFF"}
            </span>
          </button>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="max-w-44 sm:max-w-64 truncate rounded-lg border border-zinc-800 bg-surface px-3 py-1.5 text-xs text-zinc-200 focus:border-accent focus:outline-none"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={newChat}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-surface-hover"
          >
            + Chat Baru
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {!hasMessages && (
            <div className="flex flex-1 items-center justify-center py-10">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">
                  F
                </div>
                <h2 className="mb-1 text-xl font-semibold">Filius AI</h2>
                <p className="text-sm text-muted">
                  Asisten AI pribadi kamu — pilih model dan mulai ngobrol!
                  <br />
                  Coba tanya: &quot;Bantuin aku belajar coding&quot;
                </p>
              </div>
            </div>
          )}

          {hasMessages &&
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-sm text-white shadow-sm"
                      : "max-w-[88%] rounded-2xl rounded-bl-sm border border-zinc-800/80 bg-surface px-4.5 py-3 text-sm leading-relaxed text-zinc-100 shadow-sm"
                  }
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  ) : (
                    <div>
                      <MarkdownMessage content={msg.content} />

                      {/* Display SearXNG Sources List */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3.5 border-t border-zinc-800/80 pt-2.5">
                          <div className="mb-1.5 text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                            <span>🌐</span>
                            <span>Sumber Referensi ({msg.sources.length}):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, i) => (
                              <a
                                key={i}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-emerald-400 transition hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-300"
                                title={src.snippet || src.url}
                              >
                                <span className="truncate max-w-56">{src.title}</span>
                                <span className="text-[10px] text-zinc-500">↗</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display SearXNG Error if present */}
                      {msg.searchError && (
                        <div className="mt-2 text-xs text-amber-400/90 bg-amber-950/20 border border-amber-800/30 rounded px-2.5 py-1.5">
                          ⚠️ {msg.searchError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

          {/* Searching Web Loading State */}
          {isStreaming && statusMessage && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2 w-fit">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-zinc-800 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-800 bg-surface px-3 py-2 transition focus-within:border-accent">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pertanyaanmu..."
              rows={1}
              className="max-h-50 flex-1 bg-transparent py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              aria-label="Kirim pesan"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-zinc-600">
            Filius AI — didukung multi-provider AI cloud & SearXNG Web Search.
          </p>
        </div>
      </footer>
    </div>
  );
}