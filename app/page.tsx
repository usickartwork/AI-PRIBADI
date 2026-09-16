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
  { id: "groq:openai/gpt-oss-120b", label: "[Groq] GPT OSS 120B", provider: "groq" },
  { id: "ollama:gpt-oss:120b", label: "[Ollama] GPT OSS 120B", provider: "ollama" },
  { id: "gemini:gemini-3.5-flash-lite", label: "[Gemini] 3.5 Flash Lite", provider: "gemini" },
  { id: "gemini:gemini-3.1-flash-lite-preview", label: "[Gemini] 3.1 Flash Lite Preview", provider: "gemini" },
  { id: "openrouter:nvidia/nemotron-3-super-120b-a12b:free", label: "[OpenRouter] Nemotron 3 Super 120B (Free)", provider: "openrouter" },
  { id: "openrouter:nvidia/nemotron-3-ultra-550b-a55b:free", label: "[OpenRouter] Nemotron 3 Ultra 550B (Free)", provider: "openrouter" },
  { id: "openrouter:inclusionai/ling-3.0-flash-vl:free", label: "[OpenRouter] Ling 3.0 Flash VL (Free)", provider: "openrouter" },
  { id: "openrouter:nex-agi/nex-n2.5-pro:free", label: "[OpenRouter] Nex N2.5 Pro (Free)", provider: "openrouter" },
];

const SYSTEM_PROMPT =
  "Kamu adalah Filius AI, asisten kecerdasan buatan tingkat lanjut yang sangat pintar, cerdas, berwawasan luas, profesional, dan ramah.\n\n" +
  "Aturan Jawaban:\n" +
  "1. Berikan jawaban yang mendalam, terstruktur rapi, dan mudah dipahami dalam bahasa Indonesia.\n" +
  "2. Gunakan Markdown yang kaya (**cetak tebal**, *miring*, daftar poin, nomor, dan tabel) untuk menyusun jawaban agar terlihat rapi dan profesional seperti ChatGPT.\n" +
  "3. Untuk potongan kode/program, SELALU gunakan fenced code block dengan menyertakan nama bahasa pemrograman (misalnya ```python atau ```javascript).\n" +
  "4. Jawab pertanyaan pengguna secara akurat, lugas, solutif, dan berikan penjelasan konseptual bila relevan.";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
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

// Helper sapaan waktu dinamis
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Good Morning";
  if (hour >= 11 && hour < 15) return "Good Afternoon";
  if (hour >= 15 && hour < 19) return "Good Evening";
  return "Good Night";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load models from API
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data: { models?: ModelEntry[] }) => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
          // Only change model if current model is not in new list
          setModel((prev) => {
            const exists = data.models?.some((m) => m.id === prev);
            return exists ? prev : (data.models?.[0]?.id || prev);
          });
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

  const updateAssistantContent = (id: string, text: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: text } : m))
    );
  };

  const updateAssistantSources = (id: string, sources: SearchSource[]) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, sources } : m))
    );
  };

  const updateAssistantSearchError = (id: string, err: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, searchError: err } : m))
    );
  };

  const sendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || isStreaming) return;

    setError(null);
    setIsStreaming(true);
    if (webSearchEnabled) {
      setStatusMessage("🔎 Searching the web with Tavily...");
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

      assistantId = generateUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      const updatedMessages = [...messages, userMsg, assistantMsg];
      setMessages(updatedMessages);
      if (!customPrompt) setInput("");

      const apiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...updatedMessages
          .filter((m) => m.id !== assistantId)
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          webSearch: webSearchEnabled,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`;
        try {
          const errJson = (await res.json()) as { error?: string; detail?: string };
          errDetail = errJson.error || errJson.detail || errDetail;
        } catch {
          const errRaw = await res.text().catch(() => "");
          if (errRaw) errDetail = errRaw.slice(0, 200);
        }
        throw new Error(errDetail);
      }

      if (!res.body) {
        throw new Error("Server tidak mengembalikan respons stream.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data) as StreamChunk;
            if (chunk.type === "sources" && Array.isArray(chunk.sources)) {
              updateAssistantSources(assistantId, chunk.sources);
              setStatusMessage(null);
            } else if (chunk.type === "search_error" && chunk.error) {
              updateAssistantSearchError(assistantId, chunk.error);
              setStatusMessage(null);
            } else {
              const delta =
                chunk.choices?.[0]?.delta?.content ??
                chunk.choices?.[0]?.message?.content;
              if (delta) {
                fullText += delta;
                updateAssistantContent(assistantId, fullText);
                setStatusMessage(null);
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
                updateAssistantSources(assistantId, chunk.sources);
              } else if (chunk.type === "search_error" && chunk.error) {
                updateAssistantSearchError(assistantId, chunk.error);
              } else {
                const delta =
                  chunk.choices?.[0]?.delta?.content ??
                  chunk.choices?.[0]?.message?.content;
                if (delta) {
                  fullText += delta;
                  updateAssistantContent(assistantId, fullText);
                }
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
                    "Periksa koneksi atau periksa pesan error di atas.",
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

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsStreaming(false);
      setStatusMessage(null);
    }
  };

  const newChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    setStatusMessage(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
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
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeModelObj = models.find((m) => m.id === model) || models[0] || FALLBACK_MODELS[0];

  const quickPrompts = [
    {
      title: "Write a to-do list for a personal project",
      desc: "Buat daftar tugas terstruktur untuk proyek baru.",
      prompt: "Buatkan daftar to-do list terstruktur dan prioritas langkah pengerjaan untuk proyek web aplikasi baru dari nol hingga rilis.",
      icon: (
        <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: "Generate an email to reply to a job offer",
      desc: "Buat draf surel profesional merespons tawaran kerja.",
      prompt: "Tuliskan draf email yang sangat profesional, ramah, dan percaya diri untuk merespons tawaran pekerjaan (job offer) dengan apresiasi tinggi.",
      icon: (
        <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Summarize this article in one paragraph",
      desc: "Ringkas materi atau teks panjang menjadi poin padat.",
      prompt: "Jelaskan dan rangkum secara padat dalam 1 paragraf: Mengapa teknologi LLM (Large Language Model) berkembang sangat pesat dan menjadi kunci inovasi modern?",
      icon: (
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      title: "How does AI work in a technical capacity",
      desc: "Penjelasan konseptual dan teknis arsitektur AI.",
      prompt: "Jelaskan bagaimana AI berbasis transformer dan neural network bekerja secara teknis, dari tokenization hingga attention mechanism secara jelas dan mudah dipahami.",
      icon: (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090d] text-zinc-100 font-sans antialiased">
      {/* ─── SIDEBAR (Responsive / Collapsible) ─────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.08] bg-[#0c0c12]/95 backdrop-blur-2xl transition-all duration-300 ease-in-out md:static ${
          sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full md:w-0 md:translate-x-0 md:opacity-0 md:pointer-events-none"
        }`}
      >
        {/* Brand & Logo Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            {/* 3D Prismatic Star Glyph Logo */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 shadow-md shadow-violet-500/20">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
              <div className="absolute -inset-0.5 rounded-xl bg-violet-400/30 blur-[4px] -z-10 animate-pulse-glow" />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-white text-[15px]">Filius AI</span>
              <span className="ml-1.5 rounded-full bg-violet-500/20 px-1.5 py-0.2 text-[10px] font-medium text-violet-300">v2.0</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Thread / New Chat Button */}
        <div className="p-3">
          <button
            onClick={newChat}
            className="group flex w-full items-center justify-between rounded-xl bg-white/[0.06] hover:bg-violet-600/90 px-3.5 py-2.5 text-sm font-medium text-white transition-all duration-200 border border-white/[0.08] hover:border-violet-500/50 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.1] text-xs font-bold transition group-hover:bg-white group-hover:text-violet-600">+</span>
              <span>New Thread</span>
            </span>
            <kbd className="hidden group-hover:inline-flex text-[10px] text-white/70 bg-black/20 px-1.5 py-0.5 rounded">⌘N</kbd>
          </button>
        </div>

        {/* Quick Navigation Sections */}
        <div className="px-3 py-1 space-y-0.5 text-xs text-zinc-400 font-medium">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] text-zinc-100 px-3 py-2 cursor-pointer transition">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>Chats</span>
          </div>

          <div
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition ${
              webSearchEnabled ? "bg-violet-500/15 text-violet-300 border border-violet-500/30" : "hover:bg-white/[0.04] text-zinc-400"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>Web Search</span>
            </span>
            <span className={`h-2 w-2 rounded-full ${webSearchEnabled ? "bg-violet-400 animate-pulse" : "bg-zinc-600"}`} />
          </div>
        </div>

        {/* History / Recent Threads */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            <span>Recent</span>
            {messages.length > 0 && (
              <button
                onClick={newChat}
                title="Hapus riwayat"
                className="text-zinc-400 hover:text-red-400 text-[10px] transition"
              >
                Clear
              </button>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-zinc-400">
              Belum ada percakapan aktif.
            </div>
          ) : (
            <div className="space-y-1">
              {/* Group current session messages as thread preview */}
              <div className="group flex items-center justify-between rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-2 text-xs text-zinc-200 cursor-pointer">
                <div className="truncate pr-2">
                  <p className="truncate font-medium text-zinc-200">
                    {messages.find((m) => m.role === "user")?.content || "Percakapan Baru"}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                    {messages.length} pesan · Aktif
                  </p>
                </div>
                <button
                  onClick={newChat}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition"
                  title="Hapus chat ini"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom User Card / Status (Matching Image 2 & 3) */}
        <div className="p-3 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-xs font-bold text-white shadow-sm">
                F
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0c0c12]" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-zinc-200 truncate">Personal Workspace</div>
                <div className="text-[10px] text-violet-400 font-medium">Pro Plan · Active</div>
              </div>
            </div>
            <button
              onClick={newChat}
              title="Reset Percakapan"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE ────────────────────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col h-full overflow-hidden bg-gradient-to-b from-[#0e0e14] via-[#09090d] to-[#08080a]">
        {/* Top Floating App Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#09090d]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
              title="Toggle Sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            {/* Model Selector Pill Dropdown (Matching Reference 1: "✨ ChatGPT 4o ⌄") */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition shadow-sm"
              >
                <span className="text-violet-400">✨</span>
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {activeModelObj.label}
                </span>
                <svg className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${modelDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Model Dropdown Menu */}
              {modelDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-white/[0.12] bg-[#12121a]/95 p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.06]">
                    Select AI Engine (8 Verified Models)
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                    {models.map((m) => {
                      const isSelected = m.id === model;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setModel(m.id);
                            setModelDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                            isSelected
                              ? "bg-violet-600 text-white font-medium shadow-md shadow-violet-600/20"
                              : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <span className="truncate pr-2">{m.label}</span>
                          {isSelected && (
                            <svg className="w-4 h-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Web Search Quick Pill Indicator */}
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                webSearchEnabled
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                  : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>{webSearchEnabled ? "Search ON" : "Search OFF"}</span>
            </button>

            {/* "+ New Thread" Pill Button (Matching Image 1: "+ New Thread") */}
            <button
              onClick={newChat}
              className="flex items-center gap-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] px-3.5 py-1.5 text-xs font-medium text-white transition shadow-sm"
            >
              <span className="font-bold">+</span>
              <span className="hidden sm:inline">New Thread</span>
            </button>
          </div>
        </header>

        {/* ─── SCROLLABLE CHAT CONTENT ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pb-48 pt-6 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-6">

            {/* Error Banner */}
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200 backdrop-blur-md shadow-lg animate-in fade-in-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold text-sm">⚠</span>
                    <div>
                      <p className="font-semibold text-red-100">Terjadi Kendala</p>
                      <p className="mt-0.5 text-red-300/90 leading-relaxed">{error}</p>
                    </div>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-white text-base">×</button>
                </div>
              </div>
            )}

            {/* ─── HERO / EMPTY STATE (Matching Image 1, 2, 3) ────────────────── */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-8 pb-4 text-center">
                {/* 3D Iridescent Glowing Orb with CSS Floating Animation */}
                <div className="relative mb-6 flex items-center justify-center animate-float">
                  {/* Ambient Glow */}
                  <div className="absolute h-28 w-28 rounded-full bg-violet-600/35 blur-2xl animate-pulse-glow" />
                  <div className="absolute h-20 w-20 rounded-full bg-fuchsia-500/20 blur-xl" />

                  {/* Iridescent Orb Sphere */}
                  <div className="relative h-18 w-18 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-violet-300 p-0.5 shadow-2xl shadow-violet-500/40">
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-violet-300 via-purple-600 to-indigo-950 opacity-90 flex items-center justify-center">
                      <div className="absolute top-2 left-3 h-4 w-7 rounded-full bg-white/40 blur-[2px] transform -rotate-45" />
                      <svg className="w-7 h-7 text-white/90 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hero Greeting Typography (Image 1: "Good Afternoon, Jason / What's on your mind?") */}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {getTimeGreeting()}
                </h1>
                <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-300 via-purple-200 to-fuchsia-400 bg-clip-text text-transparent">
                  What&apos;s on your mind?
                </p>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-md">
                  Pilih salah satu contoh di bawah atau tanyakan apa saja langsung kepada Filius AI.
                </p>

                {/* Quick Start Suggestions Grid (Image 1: "GET STARTED WITH AN EXAMPLE BELOW") */}
                <div className="w-full mt-10 text-left">
                  <div className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase mb-3 px-1">
                    Get started with an example below
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickPrompts.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(item.prompt)}
                        className="glass-card flex flex-col justify-between rounded-2xl p-4 text-left group cursor-pointer"
                      >
                        <div>
                          <h3 className="text-[13px] font-semibold text-zinc-200 group-hover:text-white transition">
                            {item.title}
                          </h3>
                          <p className="text-[11.5px] text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                            {item.desc}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/[0.04]">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] group-hover:bg-violet-600/30 transition">
                            {item.icon}
                          </div>
                          <span className="text-[11px] text-violet-400 opacity-0 group-hover:opacity-100 transition font-medium flex items-center gap-1">
                            Coba sekarang →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── ACTIVE CHAT MESSAGES ─────────────────────────────────────── */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-200`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                      </svg>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-sm ${
                      isUser
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/20 rounded-tr-sm"
                        : "glass-panel text-zinc-100 rounded-tl-sm"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <>
                        {/* Empty response placeholder while waiting */}
                        {!msg.content && isStreaming && (
                          <div className="flex items-center gap-2 py-1 text-zinc-400 text-xs">
                            <div className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
                            <span>Sedang merumuskan jawaban...</span>
                          </div>
                        )}

                        <MarkdownMessage content={msg.content} />

                        {/* Search Error notice if any */}
                        {msg.searchError && (
                          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs text-amber-300">
                            ⚠ Catatan pencarian: {msg.searchError}
                          </div>
                        )}

                        {/* Sources Citations (Matching Reference 1: "Citation" cards) */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/[0.08]">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 uppercase tracking-wider mb-2">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span>Sumber Referensi Web ({msg.sources.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.sources.map((src, idx) => {
                                let domain = "";
                                try {
                                  domain = new URL(src.url).hostname.replace("www.", "");
                                } catch {
                                  domain = src.url;
                                }
                                return (
                                  <a
                                    key={idx}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] p-2 text-xs text-zinc-300 transition hover:text-white group"
                                  >
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-500/20 text-[10px] font-bold text-violet-300">
                                      {idx + 1}
                                    </span>
                                    <div className="truncate">
                                      <p className="truncate font-medium text-[12px] group-hover:text-violet-300 transition">
                                        {src.title || domain}
                                      </p>
                                      <p className="text-[10px] text-zinc-500 truncate">{domain}</p>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Message Actions (Copy response) */}
                        {msg.content && (
                          <div className="mt-3 flex items-center justify-end gap-1.5 pt-2 border-t border-white/[0.04]">
                            <button
                              type="button"
                              onClick={() => copyMessage(msg.id, msg.content)}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <span className="text-emerald-400">✓</span>
                                  <span className="text-emerald-400 font-medium">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.1] text-xs font-bold text-white">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Status searching pulse */}
            {statusMessage && (
              <div className="flex items-center gap-2 text-xs text-violet-400 pl-11 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-violet-400" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ─── FLOATING ELEVATED INPUT BAR (Matching Image 1, 2, 3) ──────────── */}
        <div className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-6 pointer-events-none bg-gradient-to-t from-[#08080a] via-[#08080a]/90 to-transparent pt-10">
          <div className="mx-auto max-w-3xl pointer-events-auto">
            <div className="glass-input relative rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 transition-all">
              {/* Textarea Input */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI a question or make a request..."
                rows={1}
                className="w-full bg-transparent px-2.5 pt-1 text-[14.5px] text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                style={{ maxHeight: "180px" }}
              />

              {/* Bottom Actions Bar inside Floating Card */}
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                {/* Left Action Chips: @ Attach, Writing Styles, Citation/Search Toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* @ Attach Pill (Image 1 & 3: "@ Attach") */}
                  <button
                    type="button"
                    onClick={() => textareaRef.current?.focus()}
                    className="flex items-center gap-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-2.5 py-1 text-xs font-medium text-zinc-300 transition"
                  >
                    <span className="text-zinc-400">@</span>
                    <span>Attach</span>
                  </button>

                  {/* Web Search / Citation Toggle Switch (Image 1: "Citation" switch) */}
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all ${
                      webSearchEnabled
                        ? "border-violet-500/40 bg-violet-600/25 text-violet-300 shadow-sm shadow-violet-600/20"
                        : "border-white/[0.06] bg-white/[0.04] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {/* Switch Pill Graphic */}
                    <div className={`relative h-3.5 w-6 rounded-full transition-colors ${webSearchEnabled ? "bg-violet-500" : "bg-zinc-700"}`}>
                      <div className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform ${webSearchEnabled ? "translate-x-3" : "translate-x-0.5"}`} />
                    </div>
                    <span>Citation</span>
                  </button>
                </div>

                {/* Right Action: Send / Stop Button (Image 1 & 3: Circular Dark Button ↑) */}
                <div className="flex items-center gap-2">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white transition shadow-md shadow-red-600/30"
                      title="Hentikan respons"
                    >
                      <div className="h-2.5 w-2.5 bg-white rounded-sm" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!input.trim()}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                        input.trim()
                          ? "bg-white hover:bg-violet-200 text-zinc-950 shadow-md shadow-white/20 hover:scale-105 active:scale-95"
                          : "bg-white/[0.08] text-zinc-500 cursor-not-allowed"
                      }`}
                      title="Kirim pesan (Enter)"
                    >
                      <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center text-[10px] text-zinc-400">
              Filius AI dapat menghasilkan informasi yang bervariasi. Selalu verifikasi fakta krusial.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}