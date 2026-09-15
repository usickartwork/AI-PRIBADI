"use client";

import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

type StreamChunk = {
  choices?: {
    delta?: { content?: string };
    message?: { content?: string };
  }[];
};

const STORAGE_KEY = "filius-ai-history";

const DEFAULT_MODELS = [
  { id: "oc/mimo-v2.5-free", label: "MiMo v2.5 (free)" },
  { id: "gemini/gemini-3.8-flash", label: "[GEMINI] Gemini 3.8 Flash" },
  { id: "gemini/gemini-3.7-flash", label: "[GEMINI] Gemini 3.7 Flash" },
  { id: "groq/llama-3.3-70b-versatile", label: "[GROQ] Llama 3.3 70B Versatile" },
  { id: "hf/deepseek-ai/DeepSeek-V4.1-Flash", label: "[HF] DeepSeek V4.1 Flash" },
  { id: "hf/Qwen/Qwen3.8-27B", label: "[HF] Qwen 3.8 27B" },
  { id: "cerebras/llama-3.3-70b", label: "[CEREBRAS] Llama 3.3 70B" },
  { id: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "[TOGETHER] Llama 3.3 70B Turbo" },
  { id: "ocg/mimo-v2.5", label: "[OCG] MiMo v2.5" },
  { id: "oc/nemotron-3-ultra-free", label: "Nemotron 3 Ultra (free)" },
  { id: "oc/muse-spark-1.3-contributor-free", label: "Muse Spark 1.3 (free)" },
  { id: "oc/ling-3.0-flash-fin-free", label: "Ling 3.0 Flash (free)" },
  { id: "oc/deepseek-v4-flash-free", label: "DeepSeek V4 Flash (free)" },
];

const SYSTEM_PROMPT =
  "Kamu adalah Filius AI, asisten pribadi yang membantu dalam bahasa Indonesia. " +
  "Jawab dengan jelas, ringkas, dan ramah. Gunakan markdown untuk struktur bila perlu.";

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
  const [models, setModels] = useState(DEFAULT_MODELS);
  const [model, setModel] = useState(DEFAULT_MODELS[0].id);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        body: JSON.stringify({ messages: apiMessages, model }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error ||
            `Terjadi kesalahan (HTTP ${res.status}). Pastikan server dan 9Router aktif.`
        );
      }

      const updateAssistant = (text: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
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
            const delta =
              chunk.choices?.[0]?.delta?.content ??
              chunk.choices?.[0]?.message?.content;
            if (delta) fullText += delta;
          } catch {}
        }
        updateAssistant(fullText);
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
            const delta =
              chunk.choices?.[0]?.delta?.content ??
              chunk.choices?.[0]?.message?.content;
            if (delta) {
              fullText += delta;
              updateAssistant(fullText);
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
              const delta =
                chunk.choices?.[0]?.delta?.content ??
                chunk.choices?.[0]?.message?.content;
              if (delta) updateAssistant(fullText + delta);
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
                    "Pastikan server dan 9Router aktif di PC host lalu coba lagi.",
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  };

  const newChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setIsStreaming(false);
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
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            F
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold">Filius AI</h1>
            <p className="text-xs text-muted">Asisten AI pribadimu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                  Asisten AI pribadi kamu — gratis lewat 9Router.
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
                      ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-sm text-white"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-zinc-800 bg-surface px-4 py-2.5 text-sm leading-relaxed text-zinc-100"
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

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
            Filius AI terhubung ke 9Router melalui server — pastikan 9Router aktif di PC host.
          </p>
        </div>
      </footer>
    </div>
  );
}