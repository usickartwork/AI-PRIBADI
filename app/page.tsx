"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MarkdownMessage } from "./components/MarkdownMessage";
import { AuthModal } from "./components/AuthModal";
import { CodeWorkspace } from "./components/CodeWorkspace";
import { ScheduleWorkspace } from "./components/ScheduleWorkspace";
import { IntroLoader, useAppInitializer } from "./components/IntroLoader";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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
  image?: string;
  fileName?: string;
  sources?: SearchSource[];
  searchError?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
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

function getSessionsStorageKey(userId?: string | null): string {
  return userId ? `usick-sessions-${userId}` : "usick-sessions-guest";
}

function getActiveSessionStorageKey(userId?: string | null): string {
  return userId ? `usick-active-session-${userId}` : "usick-active-session-guest";
}

function createFreshSession(): ChatSession {
  return {
    id: generateUUID(),
    title: "Obrolan Baru",
    messages: [],
    updatedAt: Date.now(),
  };
}

// 8 Verified Models (Clean labels without emojis)
const FALLBACK_MODELS: ModelEntry[] = [
  { id: "novita:qwen/qwen3.8-flash", label: "[Usick] Usick One", provider: "novita" },
  { id: "novita:qwen/qwen3-coder-30b-a3b-instruct", label: "[Qwen] Qwen 3 Coder 30B A3B Instruct", provider: "novita" },
  { id: "novita:moonshotai/kimi-k2-instruct", label: "[Kimi] Kimi K2 Instruct", provider: "novita" },
  { id: "groq:openai/gpt-oss-120b", label: "[Groq] GPT OSS 120B", provider: "groq" },
  { id: "claude:claude-3-7-sonnet-latest", label: "[Claude] 3.7 Sonnet", provider: "claude" },
  { id: "claude:claude-3-5-sonnet-latest", label: "[Claude] 3.5 Sonnet", provider: "claude" },
  { id: "ollama:gpt-oss:120b", label: "[Ollama] GPT OSS 120B", provider: "ollama" },
  { id: "gemini:gemini-3.5-flash-lite", label: "[Gemini] 3.5 Flash Lite", provider: "gemini" },
  { id: "gemini:gemini-3.1-flash-lite-preview", label: "[Gemini] 3.1 Flash Lite Preview", provider: "gemini" },
  { id: "openrouter:nvidia/nemotron-3-super-120b-a12b:free", label: "[OpenRouter] Nemotron 3 Super 120B (Free)", provider: "openrouter" },
  { id: "openrouter:nvidia/nemotron-3.5-lightning:free", label: "[OpenRouter] Nemotron 3.5 Lightning (Free)", provider: "openrouter" },
  { id: "openrouter:nvidia/nemotron-3-ultra-550b-a55b:free", label: "[OpenRouter] Nemotron 3 Ultra 550B (Free)", provider: "openrouter" },
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

function parseRawToSessions(data: unknown): ChatSession[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    // Cek apakah data ini adalah Array of ChatSession
    if (data[0] && typeof data[0] === "object" && "messages" in data[0] && "id" in data[0]) {
      return (data as ChatSession[]).filter(
        (s) => s && Array.isArray(s.messages) && s.messages.length > 0
      );
    }
    // Cek apakah data ini adalah Array of ChatMessage (format lama 1 thread)
    if (data[0] && typeof data[0] === "object" && "role" in data[0]) {
      const messages = data as ChatMessage[];
      if (messages.length === 0) return [];
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = firstUserMsg?.content
        ? firstUserMsg.content.slice(0, 36).trim() + (firstUserMsg.content.length > 36 ? "..." : "")
        : "Percakapan Sebelumnya";
      return [
        {
          id: generateUUID(),
          title,
          messages,
          updatedAt: Date.now(),
        },
      ];
    }
  }
  return [];
}

function loadSessions(userId?: string | null): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const rawSessions = localStorage.getItem(getSessionsStorageKey(userId));
    if (rawSessions) {
      const parsed = JSON.parse(rawSessions);
      const res = parseRawToSessions(parsed);
      if (res.length > 0) return res;
    }
  } catch {}
  return [];
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Good Morning";
  if (hour >= 11 && hour < 15) return "Good Afternoon";
  if (hour >= 15 && hour < 19) return "Good Evening";
  return "Good Night";
}

function cleanModelLabel(label: string): string {
  return label.replace(/^\[[^\]]+\]\s*/, "").replace(/^\([^)]+\)\s*/, "");
}

function isVisionSupported(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return lower.includes("gemini") || lower.includes("qwen");
}

function getVisionUnsupportedNotice(modelLabel: string): string {
  return `Model **${cleanModelLabel(modelLabel)}** saat ini tidak mendukung analisis gambar atau foto.\n\nBerikut adalah model yang **mendukung analisis foto / Vision**:\n• **Gemini**\n• **Qwen**\n\nSilakan pilih model **Gemini** atau **Qwen** pada menu pilihan model untuk menganalisis foto Anda.`;
}

function getModelCategory(m: ModelEntry): string {
  const lbl = m.label.toLowerCase();
  const id = m.id.toLowerCase();
  const prov = (m.provider || "").toLowerCase();

  // Model buatan Usick (Novita AI Qwen Engine)
  if (lbl.includes("usick") || id.includes("usick")) return "Usick";

  // DeepSeek HARUS dicek sebelum Qwen karena model DeepSeek R1 Distill Qwen adalah DeepSeek
  if (lbl.includes("deepseek") || id.includes("deepseek")) return "DeepSeek";

  // Pokoknya yang ada gpt masuk ke model chat gpt
  if (lbl.includes("gpt") || id.includes("gpt")) return "ChatGPT";
  if (lbl.includes("qwen") || id.includes("qwen")) return "Qwen";
  if (lbl.includes("kimi") || id.includes("kimi") || lbl.includes("moonshot") || id.includes("moonshot")) return "Kimi";
  if (lbl.includes("llama") || id.includes("llama")) return "Llama";
  if (prov === "gemini" || lbl.includes("gemini") || id.includes("gemini")) return "Gemini";
  if (prov === "claude" || lbl.includes("claude") || id.includes("claude")) return "Claude";
  if (lbl.includes("glm") || id.includes("glm")) return "GLM";
  if (lbl.includes("minimax") || id.includes("minimax")) return "MiniMax";
  if (prov === "openrouter" || lbl.includes("openrouter")) return "OpenRouter";
  if (prov === "groq" || lbl.includes("groq")) return "Groq";
  if (prov === "ollama" || lbl.includes("ollama")) return "Ollama";
  if (prov === "cloudflare" || lbl.includes("cloudflare")) return "Cloudflare";
  return "Lainnya";
}

function getSystemPrompt(m?: ModelEntry): string {
  const isUsick = m && getModelCategory(m) === "Usick";
  const isR1 = m && (m.id.toLowerCase().includes("deepseek-r1") || m.label.toLowerCase().includes("deepseek r1"));

  // DeepSeek R1 bekerja optimal dengan instruksi bahasa Indonesia yang ringkas dan padat
  if (isR1) {
    return "Kamu adalah asisten AI yang cerdas dan ramah. Selalu berikan jawaban dalam bahasa Indonesia yang baik, rapi, dan terstruktur.";
  }

  if (isUsick) {
    return (
      "Nama kamu adalah Usick One, asisten kecerdasan buatan tingkat lanjut yang sangat pintar, cerdas, berwawasan luas, profesional, dan ramah.\n\n" +
      "Pedoman Jawaban:\n" +
      "1. Identitas: Jika ditanya siapa dirimu, jawablah bahwa kamu adalah Usick One, asisten AI pintar yang siap membantu berbagai keperluan seperti analisis, pemrograman, penulisan, dan pemecahan masalah.\n" +
      "2. Kualitas: Berikan jawaban yang mendalam, terstruktur rapi, logis, dan mengalir secara alami dalam bahasa Indonesia yang baik.\n" +
      "3. Format: Gunakan format Markdown yang bersih dan profesional (**cetak tebal**, *miring*, daftar poin, nomor, dan tabel jika relevan).\n" +
      "4. Kode Program: SELALU gunakan fenced code block dengan menyertakan nama bahasa pemrograman (misalnya ```python, ```javascript, ```html) yang bersih dan siap dijalankan.\n" +
      "5. Responsivitas: Jawab secara langsung, lugas, solutif, tanpa repetisi berlebihan, dan berikan penjelasan konseptual bila diperlukan."
    );
  }

  // Model lainnya tetap sesuai identitas aslinya (Claude, ChatGPT, DeepSeek, Gemini, Qwen, dll.)
  return (
    "Kamu adalah asisten kecerdasan buatan yang profesional, cerdas, dan ramah.\n\n" +
    "Pedoman Jawaban:\n" +
    "1. Identitas: Tetap gunakan identitas dan nama model AI bawaanmu secara konsisten jika ditanya siapa dirimu. Jangan mengubah atau mengganti identitas aslimu.\n" +
    "2. Kualitas: Berikan jawaban yang akurat, berbobot, terstruktur rapi, dan mudah dipahami dalam bahasa Indonesia yang baik.\n" +
    "3. Format: Gunakan format Markdown yang bersih (**cetak tebal**, *miring*, daftar poin, nomor, dan tabel bila relevan).\n" +
    "4. Kode Program: SELALU gunakan fenced code block dengan menyertakan nama bahasa pemrograman (misalnya ```python, ```javascript, ```html) yang siap pakai.\n" +
    "5. Responsivitas: Jawab secara lugas, solutif, dan ramah."
  );
}

function ModelCategoryIcon({ category }: { category: string }) {
  const cat = category.toLowerCase();

  if (cat === "usick") {
    // Usick Official Geometric Sparkle Star
    return (
      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>
    );
  }

  if (cat === "chatgpt") {
    // Official OpenAI Sparkle / Flower Hexagon
    return (
      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M22.28 10.12a5.55 5.55 0 0 0-.48-4.58 5.6 5.6 0 0 0-3.92-2.77 5.63 5.63 0 0 0-4.68.75 5.54 5.54 0 0 0-3.8-1.52 5.58 5.58 0 0 0-5.26 3.82 5.57 5.57 0 0 0-2.3 4.02 5.61 5.61 0 0 0 .97 4.54 5.55 5.55 0 0 0 .48 4.58 5.6 5.6 0 0 0 3.92 2.77 5.6 5.6 0 0 0 4.68-.75 5.55 5.55 0 0 0 3.8 1.52 5.58 5.58 0 0 0 5.26-3.82 5.57 5.57 0 0 0 2.3-4.02 5.61 5.61 0 0 0-.97-4.54ZM12 14.5a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5Z" />
      </svg>
    );
  }

  if (cat === "deepseek") {
    // DeepSeek Blue Whale / Fin Icon
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13c1.5-3.5 5-6 9-6 4.5 0 8.5 3 9 7-1.5 2.5-4 4-7 4-3 0-5.5-1.5-7-3L3 13Z" />
        <path d="M12 7c-1-2-2.5-3-4-3" />
        <circle cx="8" cy="11.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (cat === "qwen") {
    // Qwen Cube / Neural Diamond Lattice
    return (
      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.8 3.8L12 11.9 5.2 8.1 12 4.3Zm-7 5.2 6 3.4v6.8l-6-3.4V9.5Zm8 10.2v-6.8l6-3.4v6.8l-6 3.4Z" />
      </svg>
    );
  }

  if (cat === "claude") {
    // Claude Anthropic Sunburst Spark
    return (
      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v3.08a1.5 1.5 0 0 1-3 0V3.5A1.5 1.5 0 0 1 12 2Zm7.07 3.93a1.5 1.5 0 0 1 0 2.12l-2.18 2.18a1.5 1.5 0 1 1-2.12-2.12l2.18-2.18a1.5 1.5 0 0 1 2.12 0ZM22 12a1.5 1.5 0 0 1-1.5 1.5h-3.08a1.5 1.5 0 0 1 0-3h3.08A1.5 1.5 0 0 1 22 12Zm-3.93 7.07a1.5 1.5 0 0 1-2.12 0l-2.18-2.18a1.5 1.5 0 1 1 2.12-2.12l2.18 2.18a1.5 1.5 0 0 1 0 2.12ZM12 22a1.5 1.5 0 0 1-1.5-1.5v-3.08a1.5 1.5 0 0 1 3 0v3.08A1.5 1.5 0 0 1 12 22Zm-7.07-3.93a1.5 1.5 0 0 1 0-2.12l2.18-2.18a1.5 1.5 0 1 1 2.12 2.12l-2.18 2.18a1.5 1.5 0 0 1-2.12 0ZM2 12a1.5 1.5 0 0 1 1.5-1.5h3.08a1.5 1.5 0 0 1 0 3H3.5A1.5 1.5 0 0 1 2 12Zm3.93-7.07a1.5 1.5 0 0 1 2.12 0l2.18 2.18a1.5 1.5 0 1 1-2.12 2.12L6.05 7.05a1.5 1.5 0 0 1 0-2.12Z" />
      </svg>
    );
  }

  if (cat === "gemini") {
    // Google Gemini Sparkle Star
    return (
      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10Z" />
      </svg>
    );
  }

  if (cat === "llama") {
    // Meta Llama / Infinity Loop
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.267-8-12.356-8-5.096 0-5.096 8 0 8 5.09 0 7.26-8 12.356-8Z" />
      </svg>
    );
  }

  if (cat === "groq") {
    // Groq Ultra-fast Lightning
    return (
      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
      </svg>
    );
  }

  if (cat === "ollama") {
    // Ollama Llama / Alpaca Silhouette
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <rect x="5" y="7" width="14" height="13" rx="4" />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
        <path d="M10 16h4" />
      </svg>
    );
  }

  if (cat === "openrouter") {
    // OpenRouter Hexagon Network Nodes
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path d="M12 3v7m8 6.5-6-3.5M4 16.5l6-3.5" />
      </svg>
    );
  }

  if (cat === "cloudflare") {
    // Cloudflare Cloud Icon
    return (
      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96Z" />
      </svg>
    );
  }

  if (cat === "glm") {
    // GLM Zhipu AI Orbit / Atoms
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" />
      </svg>
    );
  }

  if (cat === "minimax") {
    // MiniMax Double Wave / Audio Spectrum
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 12v3M8 9v9M12 6v15M16 9v9M20 12v3" />
      </svg>
    );
  }

  if (cat === "kimi" || cat === "moonshot") {
    // Moonshot AI / Kimi Crescent Star
    return (
      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8C12.92 3.04 12.46 3 12 3Z" />
      </svg>
    );
  }

  // Default Fallback: AI Chip Icon
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const sessionsOwnerIdRef = useRef<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>(() => [createFreshSession()]);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => generateUUID());
  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;
  const isInitialBootRef = useRef(true);

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const messages = currentSession?.messages || [];

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setSessions((prevSessions) => {
        const curId = activeSessionIdRef.current;
        const existingIndex = prevSessions.findIndex((s) => s.id === curId);
        const prevMsgs = existingIndex >= 0 ? prevSessions[existingIndex].messages : [];
        const nextMsgs = typeof updater === "function" ? updater(prevMsgs) : updater;

        if (nextMsgs.length === 0) {
          if (existingIndex >= 0) {
            return prevSessions.filter((s) => s.id !== curId);
          }
          return prevSessions;
        }

        let title = existingIndex >= 0 ? prevSessions[existingIndex].title : "";
        if (!title || title === "Percakapan Baru" || title === "Percakapan Sebelumnya") {
          const firstUser = nextMsgs.find((m) => m.role === "user");
          if (firstUser?.content) {
            title = firstUser.content.slice(0, 36).trim() + (firstUser.content.length > 36 ? "..." : "");
          } else {
            title = "Percakapan Baru";
          }
        }

        if (existingIndex >= 0) {
          const updated = [...prevSessions];
          updated[existingIndex] = {
            ...updated[existingIndex],
            title,
            messages: nextMsgs,
            updatedAt: Date.now(),
          };
          return updated;
        } else {
          const newSession: ChatSession = {
            id: curId,
            title,
            messages: nextMsgs,
            updatedAt: Date.now(),
          };
          return [newSession, ...prevSessions];
        }
      });
    },
    []
  );

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [models, setModels] = useState<ModelEntry[]>(FALLBACK_MODELS);
  const [model, setModel] = useState(FALLBACK_MODELS[0].id);
  // Simpan model yang limit beserta timestamp kapan bisa di-reset kembali (default reset: 5 menit)
  const [disabledModels, setDisabledModels] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("usick-disabled-models");
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, number>;
          const now = Date.now();
          const active: Record<string, number> = {};
          for (const [id, expireAt] of Object.entries(parsed)) {
            if (expireAt > now) active[id] = expireAt;
          }
          return active;
        }
      } catch {}
    }
    return {};
  });
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("usick-theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark"; // Default to dark mode as requested
  });

  // Selalu arahkan ke tab "chats" saat buka web / refresh sesuai brief
  const [activeView, setActiveView] = useState<"chats" | "code" | "schedule">("chats");

  // Hapus key usick-active-view lama agar tidak pernah membuka schedule secara otomatis saat reload
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("usick-active-view");
      } catch {}
    }
  }, []);

  // ─── Usick One: Initialization Controller for Intro Loading ───────────────
  const { introState, isInitializing } = useAppInitializer({
    authLoading,
    sessionsReady: sessions.length > 0,
    minDurationMs: 1600, // ±1.6s minimum visual rhythm
    safetyTimeoutMs: 6000, // 6s maximum fallback in case network hangs
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
    content?: string;
    dataUrl?: string;
  } | null>(null);

  // Supabase Auth Session listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (!error && data?.session) {
            setUser(data.session.user);
            setShowAuthModal(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        });
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionsOwnerIdRef.current = null;
    setUser(null);
    const guestSessions = loadSessions(null);
    if (guestSessions.length > 0) {
      setSessions(guestSessions);
      setActiveSessionId(guestSessions[0].id);
    } else {
      const fresh = createFreshSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    }
    setShowAuthModal(true);
  };

  // Sinkronisasi riwayat chat dari Supabase saat user login atau berganti akun
  useEffect(() => {
    if (authLoading) return;

    const currentUserId = user?.id ?? null;
    let isMounted = true;

    // Catat bahwa sesi di memori sekarang menjadi milik currentUserId
    sessionsOwnerIdRef.current = currentUserId;

    // Muat data lokal milik user ini terlebih dahulu
    const cached = loadSessions(currentUserId);
    const activeKey = getActiveSessionStorageKey(currentUserId);
    const savedActiveId = typeof window !== "undefined" ? localStorage.getItem(activeKey) : null;

    if (cached.length > 0) {
      setSessions(cached);
      // Sesuai brief: Setiap refresh / masuk web, selalu mulai dengan obrolan baru
      if (isInitialBootRef.current) {
        isInitialBootRef.current = false;
        // Tetap di sesi obrolan baru yang telah di-generate saat boot
      } else if (savedActiveId && cached.some((s) => s.id === savedActiveId)) {
        setActiveSessionId(savedActiveId);
      } else {
        setActiveSessionId(cached[0].id);
      }
    } else {
      const fresh = createFreshSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      isInitialBootRef.current = false;
    }

    if (!currentUserId) return;

    async function fetchUserChatHistory() {
      try {
        const { data, error } = await supabase
          .from("chat_history")
          .select("messages")
          .eq("user_id", currentUserId)
          .maybeSingle();

        if (error) {
          console.warn("[supabase] fetch history error:", error.message);
          return;
        }

        if (data && data.messages) {
          const parsed = parseRawToSessions(data.messages);
          if (parsed.length > 0 && isMounted && sessionsOwnerIdRef.current === currentUserId) {
            setSessions(parsed);
            // Sesuai brief: Jangan timpa activeSessionId jika pengguna sedang di obrolan baru
            try {
              localStorage.setItem(getSessionsStorageKey(currentUserId), JSON.stringify(parsed));
            } catch {}
          }
        }
      } catch (err) {
        console.warn("[supabase] sync error:", err);
      }
    }

    fetchUserChatHistory();

    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading]);

  useEffect(() => {
    try {
      localStorage.setItem("usick-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, [theme]);

  // Timer pemantau untuk mengaktifkan kembali model ketika cooldown / reset token sudah selesai
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      setDisabledModels((prev) => {
        let changed = false;
        const next: Record<string, number> = {};
        for (const [id, expireAt] of Object.entries(prev)) {
          if (expireAt > now) {
            next[id] = expireAt;
          } else {
            changed = true; // Waktu reset token tiba: model otomatis aktif kembali!
          }
        }
        if (changed) {
          try {
            localStorage.setItem("usick-disabled-models", JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }, 10000); // Cek setiap 10 detik

    return () => clearInterval(checkInterval);
  }, []);

  const isDark = theme === "dark";

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const inputDropdownRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1280;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setSelectedImage(dataUrl);
          setSelectedFile(null);
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 50);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Otomatis langsung pindah ke model Gemini 3.7 Flash saat upload file
    const gemini37 =
      models.find((m) => m.id === "custom:clario/gemini-3.7-flash") ||
      models.find((m) => m.id === "custom:clario/gemini-3.7-flash-auto") ||
      models.find((m) => m.id.toLowerCase().includes("gemini-3.7-flash")) ||
      models.find((m) => m.id.toLowerCase().includes("gemini"));
    if (gemini37) {
      setModel(gemini37.id);
    }

    // Jika user memilih foto/gambar di opsi file, alihkan ke pemrosesan gambar
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            setSelectedImage(dataUrl);
            setSelectedFile(null);
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 50);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
      return;
    }

    const isTextFile =
      file.type.startsWith("text/") ||
      /\.(txt|md|csv|json|js|jsx|ts|tsx|py|html|css|xml|yaml|yml|sql|sh|log|env)$/i.test(
        file.name
      );

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setSelectedFile({
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          content: content.slice(0, 50000),
        });
        setSelectedImage(null);
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
      };
      reader.readAsText(file);
    } else {
      // PDF atau dokumen binary lainnya (PDF, DOCX, dll.)
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSelectedFile({
          name: file.name,
          size: file.size,
          type: file.type || "application/pdf",
          dataUrl,
        });
        setSelectedImage(null);
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  // Close dropdown and attach menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        inputDropdownRef.current &&
        !inputDropdownRef.current.contains(e.target as Node)
      ) {
        setModelDropdownOpen(false);
      }
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(e.target as Node)
      ) {
        setShowAttachMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Touch swipe gesture listener for smooth sidebar opening/closing
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSelectingText = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isSelectingText = false;
    };

    const handleSelectionChange = () => {
      // Tandai jika ada proses seleksi/blok teks selama interaksi touch
      isSelectingText = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
      const duration = Date.now() - touchStartTime;

      // Cek apakah ada teks yang sedang diblok/diseleksi untuk disalin
      const selection = typeof window !== "undefined" ? window.getSelection() : null;
      const hasActiveSelection =
        !!selection &&
        (!selection.isCollapsed || (selection.toString() || "").trim().length > 0);

      // Jangan buka sidebar jika user sedang memblok atau menyalin teks
      if (hasActiveSelection || isSelectingText) {
        return;
      }

      if (deltaY < 80) {
        // Slide ke kanan untuk membuka panel di SEMUA tab (chats, code, schedule)
        // Batasi duration < 600ms agar gerakan blok teks lambat tidak disalahartikan sebagai swipe
        if (deltaX > 50 && !sidebarOpen && duration < 600) {
          setSidebarOpen(true);
        }
        // Slide ke kiri untuk menutup panel ketika sedang terbuka
        if (deltaX < -45 && sidebarOpen) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [sidebarOpen]);

  // Load models from API
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data: { models?: ModelEntry[] }) => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
          setModel((prev) => {
            const exists = data.models?.some((m) => m.id === prev);
            return exists ? prev : (data.models?.[0]?.id || prev);
          });
        }
      })
      .catch(() => {});
  }, []);

  // Smart autoscroll: only scrolls down when there are active chat messages and user hasn't scrolled up
  useEffect(() => {
    if (messages.length > 0) {
      if (!isUserScrolledUp) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [messages, statusMessage, isUserScrolledUp]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setIsUserScrolledUp(!isNearBottom);
  };

  useEffect(() => {
    if (authLoading) return;

    const currentUserId = user?.id ?? null;

    // GUARD KETAT:
    // Pastikan sessions yang ada di memori memang milik user yang sedang aktif!
    // Ini 100% mencegah data akun lama tertulis ke akun baru saat pergantian login.
    if (sessionsOwnerIdRef.current !== currentUserId) {
      return;
    }

    try {
      const sessionsKey = getSessionsStorageKey(currentUserId);
      const activeKey = getActiveSessionStorageKey(currentUserId);

      // Hapus data foto/file agar tidak pernah masuk ke database / localStorage (cuma sekali pakai)
      const sessionsToSave = sessions.map((sess) => ({
        ...sess,
        messages: sess.messages.map(({ image, ...rest }) => rest),
      }));

      localStorage.setItem(sessionsKey, JSON.stringify(sessionsToSave));
      if (activeSessionId) {
        localStorage.setItem(activeKey, activeSessionId);
      }

      // Simpan dan sinkronkan ke database Supabase HANYA jika:
      // 1. Pengguna sedang login (ada currentUserId)
      // 2. Ada pesan riwayat di dalam sessions
      if (currentUserId && sessionsToSave.length > 0 && sessionsToSave.some((s) => s.messages && s.messages.length > 0)) {
        const timer = setTimeout(() => {
          if (sessionsOwnerIdRef.current === currentUserId) {
            supabase
              .from("chat_history")
              .upsert({
                user_id: currentUserId,
                messages: sessionsToSave,
                updated_at: new Date().toISOString(),
              })
              .then(({ error }) => {
                if (error) console.warn("[supabase] save chat_history error:", error.message);
              });
          }
        }, 1000);

        return () => clearTimeout(timer);
      }
    } catch {}
  }, [sessions, activeSessionId]);

  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

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
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const activeImage = selectedImage;
    const activeFile = selectedFile;
    const rawText = (customPrompt || input).trim();
    const text =
      rawText ||
      (activeImage
        ? "Tolong analisis dan jelaskan foto ini secara rinci."
        : activeFile
        ? `Tolong analisis isi file ${activeFile.name} ini.`
        : "");
    if ((!text && !activeImage && !activeFile) || isStreaming) return;

    setSelectedImage(null);
    setSelectedFile(null);
    closeSidebarOnMobile();
    setError(null);
    setIsStreaming(true);
    setIsUserScrolledUp(false);
    if (webSearchEnabled) {
      setStatusMessage("Browsing the web...");
    } else {
      setStatusMessage(null);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // Timeout berbasis aktivitas (heartbeat): hanya abort jika server macet/tidak mengirim data sama sekali
    let timeoutId: NodeJS.Timeout | null = null;
    const resetActivityTimer = (ms = 45000) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        controller.abort("TIMEOUT");
      }, ms);
    };

    resetActivityTimer(45000);

    let assistantId = "";
    let userMsgId = "";

    const currentModelObj = models.find((m) => m.id === model) || FALLBACK_MODELS[0];

    const hasMultimodalAttachment = Boolean(activeImage || (activeFile?.dataUrl && !activeFile?.content));

    // Jika user mengirim foto atau dokumen binary dengan model yang tidak mendukung vision/multimodal
    if (hasMultimodalAttachment && !isVisionSupported(currentModelObj.id)) {
      if (timeoutId) clearTimeout(timeoutId);
      setError(null);
      userMsgId = generateUUID();
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: text,
        image: activeImage || activeFile?.dataUrl || undefined,
        fileName: activeFile?.name,
      };

      assistantId = generateUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: getVisionUnsupportedNotice(currentModelObj.label),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      if (!customPrompt) setInput("");
      setSelectedImage(null);
      setSelectedFile(null);

      // Foto/dokumen dibersihkan setelah respon selesai (sesuai brief foto tidak masuk database)
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, image: undefined } : m))
        );
      }, 1000);

      setIsStreaming(false);
      return;
    }

    try {
      userMsgId = generateUUID();
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: text,
        image: activeImage || activeFile?.dataUrl || undefined,
        fileName: activeFile?.name,
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

      const systemPrompt = getSystemPrompt(currentModelObj);

      const apiMessages = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...updatedMessages
          .filter((m) => m.id !== assistantId)
          .map((m) => {
            let content = m.content;
            let image = m.image;
            if (m.id === userMsgId && activeFile) {
              if (activeFile.content) {
                content = `[File terlampir: ${activeFile.name}]\n\`\`\`\n${activeFile.content}\n\`\`\`\n\n${text || "Tolong analisis isi file ini."}`;
              } else if (activeFile.dataUrl) {
                image = activeFile.dataUrl;
                content = text || `Tolong baca, analisis, dan jelaskan isi file ${activeFile.name} ini secara lengkap.`;
              }
            }
            return {
              role: m.role,
              content,
              image,
            };
          }),
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
        let errJson: { error?: string; detail?: string; isLimit?: boolean; isVisionUnsupported?: boolean; model?: string } = {};
        try {
          errJson = (await res.json()) as { error?: string; detail?: string; isLimit?: boolean; isVisionUnsupported?: boolean; model?: string };
          errDetail = errJson.error || errJson.detail || errDetail;
        } catch {
          const errRaw = await res.text().catch(() => "");
          if (errRaw) errDetail = errRaw.slice(0, 200);
        }

        // Deteksi jika model tidak support analisis gambar / foto
        // PENTING: User meminta "kalo misal ada yang tidak support kasih chat keterangan aja, jangan pop up merah diatas"
        const isVisionUnsupported =
          Boolean(errJson.isVisionUnsupported) ||
          (Boolean(activeImage) && (
            res.status === 400 ||
            res.status === 422 ||
            errDetail.toLowerCase().includes("image") ||
            errDetail.toLowerCase().includes("vision") ||
            errDetail.toLowerCase().includes("multimodal") ||
            errDetail.toLowerCase().includes("tidak mendukung")
          ));

        if (isVisionUnsupported) {
          setError(null);
          const noticeMsg =
            errJson.error || getVisionUnsupportedNotice(activeModelObj.label);
          updateAssistantContent(assistantId, noticeMsg);
          return;
        }

        // Deteksi apakah model terkena rate limit, quota exceeded, server timeout, atau antrean offline
        const isLimit =
          Boolean(errJson.isLimit) ||
          res.status === 429 ||
          res.status === 402 ||
          res.status === 504 ||
          errDetail.toLowerCase().includes("rate limit") ||
          errDetail.toLowerCase().includes("quota") ||
          errDetail.toLowerCase().includes("limit") ||
          errDetail.toLowerCase().includes("exceeded") ||
          errDetail.toLowerCase().includes("exhausted") ||
          errDetail.toLowerCase().includes("capacity") ||
          errDetail.toLowerCase().includes("overloaded") ||
          errDetail.toLowerCase().includes("timeout") ||
          errDetail.toLowerCase().includes("antrean") ||
          errDetail.toLowerCase().includes("insufficient_quota");

        if (isLimit) {
          const expireAt = Date.now() + 5 * 60 * 1000; // Cooldown 5 menit, setelah itu auto-aktif kembali
          setDisabledModels((prev) => {
            const next = { ...prev, [model]: expireAt };
            try {
              localStorage.setItem("usick-disabled-models", JSON.stringify(next));
            } catch {}
            return next;
          });

          // Otomatis pindah ke model alternatif yang masih aktif
          const availableModel = models.find((m) => m.id !== model && (!disabledModels[m.id] || disabledModels[m.id] <= Date.now()));
          if (availableModel) {
            setModel(availableModel.id);
            errDetail += ` (Model "${cleanModelLabel(activeModelObj.label)}" telah dinonaktifkan sementara karena mencapai limit. Dialihkan ke ${cleanModelLabel(availableModel.label)}).`;
          }
        }

        throw new Error(errDetail);
      }

      if (!res.body) {
        throw new Error("Server tidak mengembalikan respons stream.");
      }

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";
      let hasReceivedContent = false;
      let reasoningBuffer = "";
      let rawContentBuffer = "";
      let lastProcessedLength = 0;
      let pendingSources: SearchSource[] | null = null;
      let pendingSearchError: string | null = null;
      const isCoderModel = model.toLowerCase().includes("coder");

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const extractCleanAnswer = (raw: string) => {
        const lower = raw.toLowerCase();
        const lastOpen = lower.lastIndexOf("<think>");
        const lastClose = lower.lastIndexOf("</think>");
        const isThinking = lastOpen !== -1 && (lastClose === -1 || lastOpen > lastClose);

        let clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");
        if (isThinking) {
          clean = clean.replace(/<think>[\s\S]*$/gi, "");
        }
        return { answer: clean.trimStart(), isThinking };
      };

      const appendSmoothly = async (textChunk: string) => {
        if (!textChunk || controller.signal.aborted) return;
        // Jika chunk pendek (1-3 karakter), langsung tampilkan instan
        if (textChunk.length <= 3) {
          fullText += textChunk;
          updateAssistantContent(assistantId, fullText);
          return;
        }

        // Jika chunk berupa blok kata/kalimat sekaligus (burst dari upstream),
        // pecah menjadi sub-chunk halus (3-5 karakter) dengan jeda 12ms agar animasi mengetik halus terlihat
        const step = Math.max(2, Math.floor(textChunk.length / 10));
        for (let i = 0; i < textChunk.length; i += step) {
          if (controller.signal.aborted) return;
          const slice = textChunk.slice(i, i + step);
          fullText += slice;
          updateAssistantContent(assistantId, fullText);
          await sleep(12);
        }
      };

      const processContentChunk = async (contentText: string) => {
        rawContentBuffer += contentText;
        const { answer, isThinking } = extractCleanAnswer(rawContentBuffer);

        if (isThinking && !answer) {
          setStatusMessage("Sedang berpikir...");
        } else {
          setStatusMessage(null);
        }

        if (answer.length > lastProcessedLength) {
          const delta = answer.slice(lastProcessedLength);
          lastProcessedLength = answer.length;
          hasReceivedContent = true;
          await appendSmoothly(delta);
        }
      };

      while (true) {
        if (controller.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;

        // Reset timer heartbeat: selama token/data masih mengalir dari AI, jangan pernah abort!
        resetActivityTimer(35000);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (controller.signal.aborted) break;
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data) as StreamChunk;
            if (chunk.type === "sources" && Array.isArray(chunk.sources)) {
              // Tunda pemunculan sumber referensi browse hingga seluruh jawaban AI selesai
              pendingSources = chunk.sources;
            } else if (chunk.type === "search_error" && chunk.error) {
              pendingSearchError = chunk.error;
            } else {
              const contentText =
                chunk.choices?.[0]?.delta?.content ||
                chunk.choices?.[0]?.message?.content;
              const reasoningText = (chunk.choices?.[0]?.delta as unknown as { reasoning_content?: string })?.reasoning_content;

              if (contentText) {
                await processContentChunk(contentText);
              } else if (reasoningText) {
                // Khusus model coder (qwen3-coder) yang seluruh jawabannya dibungkus oleh provider di reasoning_content
                if (isCoderModel) {
                  setStatusMessage(null);
                  await appendSmoothly(reasoningText);
                } else {
                  reasoningBuffer += reasoningText;
                  if (!statusMessage) {
                    setStatusMessage("Sedang berpikir...");
                  }
                }
              }
            }
          } catch {}
        }
      }

      if (!controller.signal.aborted && buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data:")) {
          const data = trimmed.slice(5).trim();
          if (data !== "[DONE]") {
            try {
              const chunk = JSON.parse(data) as StreamChunk;
              if (chunk.type === "sources" && Array.isArray(chunk.sources)) {
                pendingSources = chunk.sources;
              } else if (chunk.type === "search_error" && chunk.error) {
                pendingSearchError = chunk.error;
              } else {
                const contentText =
                  chunk.choices?.[0]?.delta?.content ||
                  chunk.choices?.[0]?.message?.content;
                const reasoningText = (chunk.choices?.[0]?.delta as unknown as { reasoning_content?: string })?.reasoning_content;

                if (contentText) {
                  await processContentChunk(contentText);
                } else if (reasoningText && isCoderModel) {
                  await appendSmoothly(reasoningText);
                } else if (reasoningText) {
                  reasoningBuffer += reasoningText;
                }
              }
            } catch {}
          }
        }
      }

      // Safety Fallback: Jika setelah stream selesai ternyata tidak ada teks yang ter-render
      // (misal provider mengirim seluruh responnya di reasoning_content atau terjebak dalam tag <think>)
      if (!controller.signal.aborted && !fullText.trim()) {
        if (rawContentBuffer.trim()) {
          const fallbackClean = rawContentBuffer.replace(/<\/?think>/gi, "").trim();
          if (fallbackClean) {
            setStatusMessage(null);
            await appendSmoothly(fallbackClean);
          }
        } else if (reasoningBuffer.trim()) {
          setStatusMessage(null);
          await appendSmoothly(reasoningBuffer.trim());
        }
      }

      setStatusMessage(null);

      // Tampilkan referensi web setelah seluruh respons chat dari AI selesai terkirim
      if (!controller.signal.aborted) {
        if (pendingSources && pendingSources.length > 0) {
          updateAssistantSources(assistantId, pendingSources);
        }
        if (pendingSearchError) {
          updateAssistantSearchError(assistantId, pendingSearchError);
        }
      }
    } catch (err) {
      if (controller.signal.aborted && controller.signal.reason === "TIMEOUT") {
        const timeoutMsg = "Koneksi ke AI melebihi batas waktu (timeout). Server model sedang sibuk, antre, atau offline. Silakan coba model lain.";
        setError(timeoutMsg);
        if (assistantId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: timeoutMsg,
                  }
                : m
            )
          );
        }
      } else if ((err as Error).name === "AbortError" || controller.signal.aborted) {
        return;
      } else {
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
      }
    } finally {
      // Sesuai permintaan user: foto cuma sekali pakai saat analisis, setelah analisis selesai langsung hilang
      if (activeImage && userMsgId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, image: undefined } : m))
        );
      }
      if (timeoutId) clearTimeout(timeoutId);
      setIsStreaming(false);
      setStatusMessage(null);
      abortRef.current = null;
      if (readerRef.current) {
        try {
          readerRef.current.cancel();
        } catch {}
        readerRef.current = null;
      }
      textareaRef.current?.focus();
    }
  };

  const handleStop = () => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch {}
      readerRef.current = null;
    }
    setIsStreaming(false);
    setStatusMessage(null);
  };

  const newChat = () => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch {}
      readerRef.current = null;
    }
    closeSidebarOnMobile();
    setError(null);
    setIsStreaming(false);
    setStatusMessage(null);
    setIsUserScrolledUp(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    const newId = generateUUID();
    setActiveSessionId(newId);
    try {
      localStorage.setItem(getActiveSessionStorageKey(user?.id), newId);
    } catch {}
  };

  const switchSession = (sessionId: string) => {
    if (sessionId === activeSessionId) {
      closeSidebarOnMobile();
      return;
    }
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch {}
      readerRef.current = null;
    }
    closeSidebarOnMobile();
    setError(null);
    setIsStreaming(false);
    setStatusMessage(null);
    setIsUserScrolledUp(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setActiveSessionId(sessionId);
    try {
      localStorage.setItem(getActiveSessionStorageKey(user?.id), sessionId);
    } catch {}
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (next.length > 0) {
          setActiveSessionId(next[0].id);
        } else {
          setActiveSessionId(generateUUID());
        }
      }
      return next;
    });
  };

  const clearAllSessions = () => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch {}
      readerRef.current = null;
    }
    closeSidebarOnMobile();
    setError(null);
    setIsStreaming(false);
    setStatusMessage(null);
    setIsUserScrolledUp(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setSessions([]);
    const newId = generateUUID();
    setActiveSessionId(newId);
    try {
      const currentUserId = user?.id ?? null;
      localStorage.removeItem(getSessionsStorageKey(currentUserId));
      localStorage.removeItem(getActiveSessionStorageKey(currentUserId));
      if (currentUserId) {
        supabase
          .from("chat_history")
          .upsert({
            user_id: currentUserId,
            messages: [],
            updated_at: new Date().toISOString(),
          })
          .then(() => {});
      }
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

  const groupedCategories: { name: string; items: ModelEntry[] }[] = [];
  for (const m of models) {
    const catName = getModelCategory(m);
    let group = groupedCategories.find((g) => g.name === catName);
    if (!group) {
      group = { name: catName, items: [] };
      groupedCategories.push(group);
    }
    group.items.push(m);
  }
  // Kategori Usick selalu di atas, dan Qwen diletakkan tepat di bawah DeepSeek
  const CATEGORY_ORDER = [
    "Usick",
    "ChatGPT",
    "DeepSeek",
    "Qwen",
    "Kimi",
    "Claude",
    "Gemini",
    "Llama",
    "Groq",
    "Ollama",
    "OpenRouter",
    "Cloudflare",
    "GLM",
    "MiniMax",
    "Lainnya",
  ];
  groupedCategories.sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(a.name);
    const idxB = CATEGORY_ORDER.indexOf(b.name);
    const posA = idxA === -1 ? 999 : idxA;
    const posB = idxB === -1 ? 999 : idxB;
    return posA - posB;
  });

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Tamu";

  const chatAccountName =
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "Usick One";

  const userInitial = (
    user?.user_metadata?.full_name ||
    user?.email ||
    "U"
  )[0].toUpperCase();

  return (
    <div className={`flex h-[100dvh] w-full max-w-[100vw] overflow-hidden ${
      isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#fafafc] text-zinc-900"
    } font-sans antialiased p-0 sm:p-3 md:p-4`}>
      {/* ─── MOBILE BACKDROP OVERLAY ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* ─── SIDEBAR (Slide Morphing Smooth Drawer) ─────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r sm:border ${
          isDark
            ? "border-zinc-800/80 bg-[#121215]/95 text-zinc-200"
            : "border-zinc-200/80 bg-white/95 text-zinc-900"
        } backdrop-blur-xl sm:rounded-3xl shadow-2xl md:shadow-sm overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static ${
          sidebarOpen
            ? "translate-x-0 opacity-100 scale-100 md:w-64 md:mr-3"
            : "-translate-x-full opacity-0 scale-[0.98] pointer-events-none md:w-0 md:mr-0 md:opacity-0 md:pointer-events-none"
        }`}
      >
        <div className="w-72 md:w-64 flex flex-col h-full min-w-[16rem]">
          {/* Brand & Logo Header */}
          <div className={`flex items-center justify-between px-4 py-4 border-b ${
            isDark ? "border-zinc-800" : "border-zinc-100"
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-xl ${
                isDark ? "bg-white text-black shadow-md shadow-white/10" : "bg-black text-white shadow-md shadow-black/25"
              }`}>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                </svg>
              </div>
              <div>
                <span className={`font-bold tracking-tight text-[15px] ${isDark ? "text-white" : "text-black"}`}>Usick One</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`rounded-lg p-1.5 transition cursor-pointer ${
                isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-white" : "text-zinc-400 hover:bg-zinc-100 hover:text-black"
              }`}
              title="Tutup menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Thread Button */}
          <div className="p-3">
            <button
              onClick={() => {
                setActiveView("chats");
                newChat();
              }}
              className={`group flex w-full items-center justify-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer ${
                isDark
                  ? "bg-white hover:bg-zinc-200 text-black shadow-white/5"
                  : "bg-black hover:bg-zinc-800 text-white shadow-black/25"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <span>New Thread</span>
            </button>
          </div>

          {/* Quick Navigation Sections */}
          <div className="px-3 py-1 space-y-0.5 text-xs font-medium">
            <div
              onClick={() => {
                setActiveView("chats");
                closeSidebarOnMobile();
              }}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition ${
                activeView === "chats"
                  ? (isDark ? "bg-zinc-800/90 text-white font-semibold" : "bg-zinc-100 text-black font-semibold")
                  : (isDark ? "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-black hover:text-black font-medium")
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Chats</span>
            </div>

            {/* Code Feature Button (Ngoding Pakai AI) */}
            <div
              onClick={() => {
                setActiveView("code");
                closeSidebarOnMobile();
              }}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition ${
                activeView === "code"
                  ? (isDark ? "bg-zinc-800/90 text-white font-semibold" : "bg-zinc-100 text-black font-semibold")
                  : (isDark ? "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-black hover:text-black font-medium")
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Code</span>
            </div>

            {/* Schedule Feature Button */}
            <div
              onClick={() => {
                setActiveView("schedule");
                closeSidebarOnMobile();
              }}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition ${
                activeView === "schedule"
                  ? (isDark ? "bg-zinc-800/90 text-white font-semibold" : "bg-zinc-100 text-black font-semibold")
                  : (isDark ? "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-black hover:text-black font-medium")
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Schedule</span>
            </div>

            <div
              onClick={() => setSettingsOpen(true)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition ${
                isDark ? "hover:bg-zinc-800/60 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-black hover:text-black font-medium"
              }`}
            >
              {/* Custom Designed Control Sliders Icon (No Emojis) */}
              <svg className={`w-4 h-4 shrink-0 ${isDark ? "text-zinc-400" : "text-black"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h7m4 0h7M7 5v4M3 17h11m4 0h3M17 15v4" />
              </svg>
              <span>Pengaturan</span>
            </div>
          </div>

          {/* History / Recent Threads */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className={`flex items-center justify-between px-2 mb-2 text-[11px] font-bold tracking-wider uppercase ${
              isDark ? "text-zinc-500" : "text-black"
            }`}>
              <span>Recent</span>
              {sessions.length > 0 && (
                <button
                  onClick={clearAllSessions}
                  title="Hapus semua riwayat"
                  className={`text-[10px] transition cursor-pointer ${
                    isDark ? "text-zinc-500 hover:text-red-400" : "text-zinc-500 hover:text-red-500"
                  }`}
                >
                  Clear
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className={`px-2 py-6 text-center text-xs ${isDark ? "text-zinc-500" : "text-zinc-600 font-medium"}`}>
                Belum ada percakapan.
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => switchSession(sess.id)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition border ${
                        isActive
                          ? (isDark
                              ? "bg-zinc-800/90 border-zinc-700 text-white font-medium shadow-xs"
                              : "bg-zinc-200/90 border-zinc-300 text-black font-semibold shadow-xs")
                          : (isDark
                              ? "bg-zinc-900/50 hover:bg-zinc-800/60 border-zinc-800/60 text-zinc-300 hover:text-white"
                              : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200/70 text-zinc-800")
                      }`}
                    >
                      <div className="truncate pr-2 flex-1">
                        <p className={`truncate ${
                          isActive
                            ? (isDark ? "text-white font-semibold" : "text-black font-semibold")
                            : (isDark ? "text-zinc-300 group-hover:text-white" : "text-zinc-800")
                        }`}>
                          {sess.title || "Percakapan"}
                        </p>
                        <p className={`text-[10px] mt-0.5 truncate ${
                          isActive
                            ? (isDark ? "text-zinc-400" : "text-zinc-600")
                            : (isDark ? "text-zinc-500" : "text-zinc-500")
                        }`}>
                          {sess.messages.length} pesan {isActive && "· Aktif"}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(sess.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition ${
                          isDark
                            ? "text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50"
                            : "text-zinc-400 hover:text-red-500 hover:bg-zinc-200"
                        }`}
                        title="Hapus obrolan ini"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom User Card / Status */}
          <div className={`p-3 border-t ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-100 bg-zinc-50/50"}`}>
            <div className={`flex items-center justify-between rounded-2xl p-2.5 shadow-xs border ${
              isDark ? "bg-[#18181b] border-zinc-800 text-white" : "bg-white border-zinc-200/80 text-black"
            }`}>
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                  isDark ? "bg-white text-black" : "bg-black text-white"
                }`}>
                  {userInitial}
                  <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${user ? "bg-emerald-500" : "bg-zinc-400"} ring-2 ${
                    isDark ? "ring-[#18181b]" : "ring-white"
                  }`} />
                </div>
                <div className="truncate">
                  <div className={`text-xs font-semibold truncate ${isDark ? "text-zinc-100" : "text-black"}`}>
                    {user ? userDisplayName : "Belum Masuk"}
                  </div>
                  <div className={`text-[10px] font-medium truncate ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    {user ? user.email : "Akun Diperlukan"}
                  </div>
                </div>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Keluar (Logout)"
                  className={`rounded-lg p-1.5 transition cursor-pointer shrink-0 ${
                    isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-red-400" : "text-zinc-600 hover:bg-zinc-100 hover:text-red-600"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  title="Masuk / Daftar"
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer shrink-0 ${
                    isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  Masuk
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE ───────────────────────────────────────────────── */}
      <main className={`flex flex-1 flex-col h-full w-full min-w-0 overflow-hidden sm:rounded-3xl border sm:border transition-colors ${
        isDark
          ? "bg-[#121215] border-zinc-800/90 shadow-2xl shadow-black/80 text-zinc-100"
          : "bg-white border-zinc-200/90 shadow-2xl shadow-black/40 text-zinc-900"
      }`}>
        {activeView === "code" ? (
          <CodeWorkspace
            key={user?.id || "guest"}
            isDark={isDark}
            onClose={() => setActiveView("chats")}
            userId={user?.id}
            onTogglePanel={() => setSidebarOpen((prev) => !prev)}
          />
        ) : activeView === "schedule" ? (
          <ScheduleWorkspace
            key={user?.id || "guest"}
            isDark={isDark}
            onClose={() => setActiveView("chats")}
            user={user}
            setShowAuthModal={setShowAuthModal}
            onTogglePanel={() => setSidebarOpen((prev) => !prev)}
          />
        ) : (
          <>
            {/* Top App Bar */}
        <header className={`shrink-0 w-full z-20 flex items-center justify-between border-b px-3.5 sm:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md ${
          isDark ? "border-zinc-800/80 bg-[#121215]/95 text-white" : "border-zinc-100 bg-white/95 text-zinc-900"
        }`}>
          <div className="flex items-center gap-2.5">
            {/* 3-line hamburger menu button on the LEFT */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border shadow-2xs transition cursor-pointer ${
                isDark
                  ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-black"
              }`}
              title="Menu Panel"
              aria-label="Menu Panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl shadow-xs ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                </svg>
              </div>
              <span className={`text-sm font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>Usick One</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={newChat}
              className={`flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full text-xs font-semibold shadow-xs transition cursor-pointer ${
                isDark ? "bg-white hover:bg-zinc-200 text-black" : "bg-black hover:bg-zinc-800 text-white"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* ─── SCROLLABLE CHAT CONTENT ──────────────────────────────────────── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-h-0 w-full px-3 sm:px-6 py-3 sm:py-5 flex flex-col"
        >
          <div className={`mx-auto max-w-3xl w-full ${messages.length === 0 ? "flex-1 flex flex-col items-center justify-center my-auto" : "space-y-4 sm:space-y-6"}`}>

            {/* Error Notice */}
            {error && (
              <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3.5 sm:p-4 text-xs text-red-700 dark:text-red-400 shadow-sm animate-in fade-in-0 w-full mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-bold text-red-900 dark:text-red-300">Terjadi Kendala</p>
                      <p className="mt-0.5 text-red-700 dark:text-red-400 leading-relaxed">{error}</p>
                    </div>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-500 hover:text-red-900 dark:hover:text-red-200 text-base font-bold px-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ─── HERO / EMPTY STATE (Pure Star Icon without Box, Centered) ─── */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center animate-in fade-in-0 duration-300 py-6">
                
                {/* Pure Star Icon only (No Box/Kotak) */}
                <div className="relative mb-4 sm:mb-6 flex items-center justify-center animate-float">
                  <svg
                    className={`w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md transition-colors ${
                      isDark ? "text-white fill-white" : "text-black fill-black"
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                  </svg>
                </div>

                {/* Headline */}
                <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                  {getTimeGreeting()}, {chatAccountName}
                </h1>
                <p className={`mt-2 text-base sm:text-lg font-medium max-w-md px-2 ${isDark ? "text-zinc-400" : "text-black"}`}>
                  What would you like to build or explore today?
                </p>
              </div>
            )}

            {/* ─── ACTIVE CHAT MESSAGES ─────────────────────────────────────── */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 sm:gap-3.5 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-200`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className={`relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl shadow-md ${
                      isDark ? "bg-white text-black shadow-white/10" : "bg-black text-white shadow-black/30"
                    }`}>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                      </svg>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 text-[13.5px] sm:text-sm ${
                      isUser
                        ? (isDark
                            ? "bg-zinc-800 border border-zinc-750 text-white shadow-md rounded-tr-xs font-normal"
                            : "bg-black text-white shadow-md shadow-black/20 rounded-tr-xs font-normal")
                        : (isDark
                            ? "bg-[#18181c] border border-zinc-800 text-zinc-100 shadow-xs rounded-tl-xs"
                            : "bg-[#f8f8fa] border border-zinc-200/90 text-black shadow-xs rounded-tl-xs")
                    }`}
                  >
                    {isUser ? (
                      <div>
                        {msg.image && (
                          <div className="mb-2.5 overflow-hidden rounded-xl border border-white/20 dark:border-white/10 shadow-sm max-w-xs sm:max-w-sm">
                            <img
                              src={msg.image}
                              alt="Foto terlampir"
                              className="max-h-64 sm:max-h-80 w-auto rounded-xl object-contain cursor-pointer hover:opacity-90 transition bg-black/20"
                              onClick={() => setPreviewImage(msg.image || null)}
                              title="Klik untuk melihat ukuran penuh"
                            />
                          </div>
                        )}
                        {msg.fileName && (
                          <div className="mb-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 border border-white/15 text-white shadow-xs">
                            <svg className="w-4 h-4 shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate max-w-[200px]">{msg.fileName}</span>
                          </div>
                        )}
                        {msg.content && (
                          <p className="whitespace-pre-wrap leading-relaxed font-normal">{msg.content}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        {!msg.content && isStreaming && (
                          <div className={`flex items-center gap-2 py-1 text-xs font-medium ${isDark ? "text-zinc-400" : "text-black"}`}>
                            <div className={`h-2 w-2 rounded-full animate-ping ${isDark ? "bg-white" : "bg-black"}`} />
                            <span>Sedang merumuskan jawaban...</span>
                          </div>
                        )}

                        <div className="relative">
                          <MarkdownMessage content={msg.content} isDark={isDark} />
                          {isStreaming && msg.content && msg.id === messages[messages.length - 1]?.id && (
                            <span className={`inline-block w-1.5 h-4 ml-1 align-middle animate-pulse rounded-xs ${isDark ? "bg-white" : "bg-black"}`} />
                          )}
                        </div>

                        {msg.searchError && (
                          <div className={`mt-3 flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
                            isDark
                              ? "border-amber-900/50 bg-amber-950/30 text-amber-300"
                              : "border-amber-200 bg-amber-50 text-amber-900 font-medium"
                          }`}>
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Catatan pencarian: {msg.searchError}</span>
                          </div>
                        )}

                        {/* Sources Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className={`mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t ${isDark ? "border-zinc-800" : "border-zinc-200/70"}`}>
                            <div className={`flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${
                              isDark ? "text-zinc-200" : "text-black"
                            }`}>
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
                                    className={`flex items-center gap-2 rounded-xl p-2 text-xs transition group shadow-2xs border ${
                                      isDark
                                        ? "bg-[#141417] hover:bg-zinc-800 border-zinc-800 text-zinc-200"
                                        : "bg-white hover:bg-zinc-100 border-zinc-200 text-black font-medium"
                                    }`}
                                  >
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                                      isDark ? "bg-white text-black" : "bg-black text-white"
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <div className="truncate">
                                      <p className={`truncate font-semibold text-[11.5px] sm:text-[12px] transition ${
                                        isDark ? "group-hover:text-white" : "text-black group-hover:text-black"
                                      }`}>
                                        {src.title || domain}
                                      </p>
                                      <p className={`text-[10px] truncate ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>{domain}</p>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Copy Action */}
                        {msg.content && (
                          <div className={`mt-2.5 flex items-center justify-end gap-1.5 pt-2 border-t ${
                            isDark ? "border-zinc-800/80" : "border-zinc-200/60"
                          }`}>
                            <button
                              type="button"
                              onClick={() => copyMessage(msg.id, msg.content)}
                              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] transition cursor-pointer ${
                                isDark
                                  ? "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                  : "text-black hover:bg-zinc-200/80 hover:text-black font-medium"
                              }`}
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="font-semibold">Tersalin</span>
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
                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold border ${
                      isDark
                        ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                        : "bg-zinc-200 text-black border border-zinc-300"
                    }`}>
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Status searching pulse */}
            {statusMessage && (
              <div className={`flex items-center gap-2 text-xs pl-10 sm:pl-11 animate-pulse font-medium ${
                isDark ? "text-zinc-200" : "text-black font-semibold"
              }`}>
                <div className={`h-2 w-2 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
                <span>{statusMessage}</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Floating pop-up saat user scroll ke atas sementara AI masih generate */}
        {isStreaming && isUserScrolledUp && (
          <div className="flex justify-center -mb-2 px-4 relative z-30 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={() => {
                setIsUserScrolledUp(false);
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDark
                  ? "bg-[#18181c]/95 border-zinc-700 text-white shadow-black/80"
                  : "bg-white/95 border-zinc-200 text-black shadow-zinc-900/15"
              }`}
            >
              <div className={`h-2 w-2 rounded-full animate-ping ${isDark ? "bg-white" : "bg-black"}`} />
              <span>Sedang merumuskan jawaban...</span>
              <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}

        {/* ─── FLOATING ELEVATED INPUT BAR (Liquid Glass Styling) ─────────── */}
        <div className={`shrink-0 w-full z-20 px-2.5 sm:px-6 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          isDark
            ? "bg-gradient-to-t from-[#121215]/95 via-[#121215]/60 to-transparent"
            : "bg-gradient-to-t from-white/95 via-white/60 to-transparent"
        }`}>
          <div className="mx-auto max-w-3xl w-full">
            <div className={`relative rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 transition-all liquid-glass ${
              isDark
                ? "shadow-2xl shadow-black/80"
                : "shadow-xl shadow-zinc-900/[0.08]"
            }`}>
              {/* Liquid glass top specular reflection highlight line */}
              <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/25 to-transparent pointer-events-none" />

              {/* Photo Attachment Thumbnail Preview (ChatGPT Style) */}
              {selectedImage && (
                <div className="mb-2 px-1 relative inline-flex items-center">
                  <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 shadow-lg group bg-black/20">
                    <img
                      src={selectedImage}
                      alt="Foto Kamera"
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover cursor-pointer hover:opacity-90 transition"
                      onClick={() => setPreviewImage(selectedImage)}
                      title="Klik untuk melihat pratinjau"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition shadow cursor-pointer"
                      title="Hapus foto"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* File Attachment Chip Preview (ChatGPT Style) */}
              {selectedFile && (
                <div className="mb-2 px-1 relative inline-flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-sm ${
                    isDark
                      ? "bg-zinc-800/90 border-zinc-700/80 text-zinc-100"
                      : "bg-zinc-100 border-zinc-200 text-zinc-900"
                  }`}>
                    <div className={`p-1.5 rounded-lg ${isDark ? "bg-zinc-700 text-white" : "bg-white text-black shadow-xs"}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="text-xs font-medium truncate max-w-[160px] sm:max-w-[220px]">{selectedFile.name}</span>
                      <span className="text-[10px] text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="h-5 w-5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      title="Hapus file"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Textarea Row with Plus Attachment Button on the Left */}
              <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                {/* Tombol Plus Attachment Menu (Kamera & File) */}
                <div className="relative shrink-0" ref={attachMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu((prev) => !prev)}
                    className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ${
                      showAttachMenu || selectedImage || selectedFile
                        ? isDark
                          ? "text-white bg-zinc-800 border border-zinc-700/80 shadow-xs"
                          : "text-black bg-zinc-200 border border-zinc-300 shadow-xs"
                        : isDark
                        ? "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
                        : "text-zinc-500 hover:text-black hover:bg-zinc-100"
                    }`}
                    title="Lampirkan foto atau file"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${showAttachMenu ? "rotate-45" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>

                  {/* Popup Menu: Kamera & File */}
                  {showAttachMenu && (
                    <div
                      className={`absolute bottom-full left-0 mb-2 w-40 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl border z-40 animate-in fade-in-0 zoom-in-95 duration-150 ${
                        isDark
                          ? "bg-[#18181c]/95 border-zinc-700/80 shadow-black/80 text-zinc-100"
                          : "bg-white/95 border-zinc-200 shadow-zinc-900/20 text-zinc-900"
                      }`}
                    >
                      {/* Opsi Kamera */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachMenu(false);
                          cameraInputRef.current?.click();
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isDark
                            ? "hover:bg-zinc-800 text-zinc-200 hover:text-white"
                            : "hover:bg-zinc-100 text-zinc-800 hover:text-black"
                        }`}
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Kamera</span>
                      </button>

                      {/* Opsi File */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachMenu(false);
                          fileInputRef.current?.click();
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isDark
                            ? "hover:bg-zinc-800 text-zinc-200 hover:text-white"
                            : "hover:bg-zinc-100 text-zinc-800 hover:text-black"
                        }`}
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>File</span>
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    autoResize();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedImage
                      ? "Ketik perintah untuk foto ini (misal: analisis, jelaskan, terjemahkan)..."
                      : selectedFile
                      ? `Ketik perintah untuk file ${selectedFile.name}...`
                      : "Ask AI a question or make a request..."
                  }
                  rows={1}
                  className={`flex-1 bg-transparent px-2 sm:px-2.5 pt-1 text-[16px] sm:text-[14.5px] focus:outline-none resize-none leading-relaxed ${
                    isDark ? "text-zinc-100 placeholder-zinc-500" : "text-black placeholder-zinc-500 font-normal"
                  }`}
                  style={{ maxHeight: "140px" }}
                />
              </div>

              {/* Native System Camera & Gallery Picker Input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCameraUpload}
              />

              {/* Native System File Picker Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Bottom Actions Bar inside Liquid Glass Card */}
              <div className={`mt-2 sm:mt-2.5 flex items-center justify-between pt-2 border-t gap-1.5 sm:gap-2 ${
                isDark ? "border-white/[0.08]" : "border-black/[0.06]"
              }`}>
                {/* Left Action: Model Selector Pill + Thinking Toggle */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  
                  {/* LLM Selector Button */}
                  <div className="relative shrink-0" ref={inputDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1 text-xs font-semibold transition shadow-2xs cursor-pointer max-w-[130px] sm:max-w-[220px] ${
                        getModelCategory(activeModelObj) === "Usick"
                          ? (isDark
                              ? "bg-zinc-800 text-white border-zinc-600 ring-1 ring-white/20"
                              : "bg-zinc-100 text-black border-zinc-400 ring-1 ring-black/15")
                          : (isDark
                              ? "bg-zinc-800/90 hover:bg-zinc-700/80 border-zinc-700 text-zinc-100"
                              : "bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200/90 text-black")
                      }`}
                      title="Pilih Model AI"
                    >
                      <ModelCategoryIcon category={getModelCategory(activeModelObj)} />
                      <span className="truncate">
                        {cleanModelLabel(activeModelObj.label)}
                      </span>
                      {getModelCategory(activeModelObj) === "Usick" && (
                        <span className={`hidden sm:inline-block text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                          isDark ? "bg-white text-black" : "bg-black text-white"
                        }`}>
                          Default
                        </span>
                      )}
                      <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isDark ? "text-zinc-500" : "text-black"
                      } ${modelDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Popover backdrop mobile */}
                    {modelDropdownOpen && (
                      <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden"
                        onClick={() => setModelDropdownOpen(false)}
                        aria-hidden="true"
                      />
                    )}

                    {/* Popover list */}
                    {modelDropdownOpen && (
                      <div className={`fixed inset-x-3 bottom-[76px] z-50 max-h-[50vh] rounded-2xl border p-2 overflow-y-auto sm:fixed-none sm:absolute sm:bottom-full sm:left-0 sm:inset-x-auto sm:mb-2 sm:w-80 sm:max-h-80 animate-in fade-in-0 zoom-95 ${
                        isDark
                          ? "bg-[#18181c] border-zinc-800 text-zinc-200 shadow-2xl shadow-black/80"
                          : "bg-white border-zinc-200 text-black shadow-2xl"
                      }`}>
                        <div className={`flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${
                          isDark ? "border-zinc-800 text-zinc-400" : "border-zinc-100 text-black"
                        }`}>
                          <span>Pilih Model LLM ({models.length})</span>
                          <button
                            onClick={() => setModelDropdownOpen(false)}
                            className={`sm:hidden ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-400 hover:text-black"}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className={`py-1 divide-y ${isDark ? "divide-zinc-800" : "divide-zinc-100"}`}>
                          {groupedCategories.map((group) => {
                            const isUsickGroup = group.name === "Usick";
                            return (
                              <div
                                key={group.name}
                                className={`py-1.5 first:pt-0.5 last:pb-0.5 ${
                                  isUsickGroup
                                    ? (isDark ? "bg-white/[0.04] rounded-xl my-1 p-1" : "bg-black/[0.03] rounded-xl my-1 p-1")
                                    : ""
                                }`}
                              >
                                <div className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
                                  isUsickGroup
                                    ? (isDark ? "text-white" : "text-black")
                                    : (isDark ? "text-zinc-300" : "text-black")
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <ModelCategoryIcon category={group.name} />
                                    <span>{group.name}</span>
                                  </div>
                                  {isUsickGroup && (
                                    <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                      isDark
                                        ? "bg-white text-black shadow-xs shadow-white/20"
                                        : "bg-black text-white shadow-xs shadow-black/20"
                                    }`}>
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  {group.items.map((m, idx) => {
                                    const isSelected = m.id === model;
                                    const isDisabled = Boolean(disabledModels[m.id] && disabledModels[m.id] > Date.now());
                                    const cleanName = cleanModelLabel(m.label);
                                    const isUsick = isUsickGroup || m.id === "novita:qwen/qwen3.8-flash";
                                    return (
                                      <button
                                        key={m.id}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => {
                                          if (isDisabled) return;
                                          setModel(m.id);
                                          setModelDropdownOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition relative ${
                                          isDisabled
                                            ? "opacity-40 cursor-not-allowed line-through text-zinc-500"
                                            : isSelected
                                            ? (isDark
                                                ? "bg-white text-black font-semibold shadow-xs cursor-pointer"
                                                : "bg-black text-white font-medium shadow-xs cursor-pointer")
                                            : isUsick
                                            ? (isDark
                                                ? "bg-zinc-800/90 hover:bg-zinc-750 text-white font-semibold border border-zinc-700/80 cursor-pointer shadow-xs"
                                                : "bg-zinc-100 hover:bg-zinc-200/90 text-black font-semibold border border-zinc-300 cursor-pointer shadow-xs")
                                            : (isDark
                                                ? "text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                                                : "text-black hover:bg-zinc-100 hover:text-black font-medium cursor-pointer")
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          <span
                                            className={`text-[11px] font-semibold w-4 shrink-0 ${
                                              isDisabled
                                                ? "text-zinc-600"
                                                : isSelected
                                                ? (isDark ? "text-zinc-600" : "text-zinc-300")
                                                : isUsick
                                                ? (isDark ? "text-zinc-300" : "text-zinc-700")
                                                : (isDark ? "text-zinc-500" : "text-zinc-500")
                                            }`}
                                          >
                                            {idx + 1}.
                                          </span>
                                          <span className="truncate">{cleanName}</span>
                                        </div>
                                        {isDisabled ? (
                                          <span className="text-[10px] font-mono shrink-0 uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                                            Limit
                                          </span>
                                        ) : isSelected ? (
                                          <svg
                                            className={`w-4 h-4 shrink-0 ${isDark ? "text-black" : "text-white"}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2.5}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        ) : null}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Browse Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      webSearchEnabled
                        ? (isDark
                            ? "border-white bg-white text-black shadow-xs"
                            : "border-black bg-black text-white shadow-xs")
                        : (isDark
                            ? "border-zinc-750 bg-zinc-800/90 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-200"
                            : "border-zinc-200/90 bg-zinc-100 text-black hover:bg-zinc-200/70")
                    }`}
                    title="Aktifkan fitur Browse / Web Search"
                  >
                    <div className={`relative h-3.5 w-6 rounded-full transition-colors ${
                      webSearchEnabled
                        ? (isDark ? "bg-black/25" : "bg-white/30")
                        : (isDark ? "bg-zinc-700" : "bg-zinc-300")
                    }`}>
                      <div className={`absolute top-0.5 h-2.5 w-2.5 rounded-full transition-transform ${
                        webSearchEnabled
                          ? `translate-x-3 ${isDark ? "bg-black" : "bg-white"}`
                          : `translate-x-0.5 ${isDark ? "bg-zinc-400" : "bg-white"}`
                      }`} />
                    </div>
                    <span>Browse</span>
                  </button>

                </div>

                {/* Right Action: Send / Stop Circular Button */}
                <div className="flex items-center gap-2 shrink-0">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white transition shadow-sm cursor-pointer"
                      title="Hentikan respons"
                    >
                      <div className="h-2.5 w-2.5 bg-white rounded-sm" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() && !selectedImage}
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all duration-200 ${
                        input.trim() || selectedImage
                          ? (isDark
                              ? "bg-white hover:bg-zinc-200 text-black shadow-md shadow-white/10 hover:scale-105 active:scale-95 cursor-pointer"
                              : "bg-black hover:bg-zinc-800 text-white shadow-md shadow-black/25 hover:scale-105 active:scale-95 cursor-pointer")
                          : (isDark
                              ? "bg-zinc-800/80 text-zinc-600 border border-zinc-700/50 cursor-not-allowed"
                              : "bg-zinc-100 text-zinc-400 border border-zinc-200/60 cursor-not-allowed")
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
          </div>
        </div>
      </>
    )}
  </main>

      {/* ─── SETTINGS MODAL (Dark / Light Theme Switcher) ───────────────────── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div
            onClick={() => setSettingsOpen(false)}
            className="absolute inset-0"
            aria-hidden="true"
          />
          <div
            className={`relative w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl transition-all z-10 ${
              isDark
                ? "bg-[#18181c] border-zinc-800 text-zinc-100 shadow-black/80"
                : "bg-white border-zinc-200 text-zinc-900 shadow-zinc-900/20"
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-4 border-b ${
              isDark ? "border-zinc-800" : "border-zinc-100"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  isDark ? "bg-white text-black" : "bg-black text-white"
                }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">Pengaturan</h2>
                  <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Sesuaikan preferensi tampilan antarmuka</p>
                </div>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className={`rounded-xl p-1.5 transition cursor-pointer ${
                  isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-white" : "text-zinc-400 hover:bg-zinc-100 hover:text-black"
                }`}
                title="Tutup"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Theme Selector */}
            <div className="py-4 space-y-4">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-2.5 ${
                  isDark ? "text-zinc-400" : "text-black"
                }`}>
                  Tema Tampilan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Dark Mode Card */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-start rounded-2xl p-3.5 border transition cursor-pointer text-left ${
                      theme === "dark"
                        ? (isDark
                            ? "border-white bg-zinc-800/90 shadow-md ring-1 ring-white/30 text-white"
                            : "border-black bg-zinc-900 text-white shadow-md")
                        : (isDark
                            ? "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-black")
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black border border-zinc-700 text-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </div>
                      {theme === "dark" && (
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full ${
                          isDark ? "bg-white text-black" : "bg-white text-black"
                        }`}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold block">Dark Mode</span>
                    <span className={`text-[10px] mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-600 font-medium"}`}>Obsidian & gelap (Default)</span>
                  </button>

                  {/* Light Mode Card */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-start rounded-2xl p-3.5 border transition cursor-pointer text-left ${
                      theme === "light"
                        ? (isDark
                            ? "border-white bg-zinc-800/90 shadow-md ring-1 ring-white/30 text-white"
                            : "border-black bg-white text-black shadow-md ring-1 ring-black/15")
                        : (isDark
                            ? "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-black")
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 text-black">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      {theme === "light" && (
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full ${
                          isDark ? "bg-white text-black" : "bg-black text-white"
                        }`}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold block">Light Mode</span>
                    <span className={`text-[10px] mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-600 font-medium"}`}>Monochrome & terang</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`pt-3 border-t flex justify-end ${
              isDark ? "border-zinc-800" : "border-zinc-100"
            }`}>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANDATORY AUTH MODAL (Login & Register via Supabase) ────────── */}
      {(!authLoading && !user) || showAuthModal ? (
        <AuthModal
          isDark={isDark}
          onSuccess={() => setShowAuthModal(false)}
        />
      ) : null}


      {/* ─── FULLSCREEN IMAGE PREVIEW LIGHTBOX ───────────────────────────── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in-0 duration-200 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-11 right-0 p-2 text-white/80 hover:text-white transition cursor-pointer"
              title="Tutup"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Pratinjau Foto"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* ─── USICK ONE: INTRO LOADING ANIMATION (Awakening Screen) ──────── */}
      {isInitializing && (
        <IntroLoader
          state={introState === "exiting" ? "exiting" : "visible"}
          theme={theme}
        />
      )}
    </div>
  );
}