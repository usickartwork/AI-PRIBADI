"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownMessage } from "./components/MarkdownMessage";
import { AuthModal } from "./components/AuthModal";
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

// 8 Verified Models (Clean labels without emojis)
const FALLBACK_MODELS: ModelEntry[] = [
  { id: "groq:openai/gpt-oss-120b", label: "[Groq] GPT OSS 120B", provider: "groq" },
  { id: "claude:claude-3-7-sonnet-latest", label: "[Claude] 3.7 Sonnet", provider: "claude" },
  { id: "claude:claude-3-5-sonnet-latest", label: "[Claude] 3.5 Sonnet", provider: "claude" },
  { id: "ollama:llama3.1", label: "[Ollama] Llama 3.1", provider: "ollama" },
  { id: "ollama:gpt-oss:120b", label: "[Ollama] GPT OSS 120B", provider: "ollama" },
  { id: "gemini:gemini-3.5-flash-lite", label: "[Gemini] 3.5 Flash Lite", provider: "gemini" },
  { id: "gemini:gemini-3.1-flash-lite-preview", label: "[Gemini] 3.1 Flash Lite Preview", provider: "gemini" },
  { id: "openrouter:nvidia/nemotron-3-super-120b-a12b:free", label: "[OpenRouter] Nemotron 3 Super 120B (Free)", provider: "openrouter" },
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

const SYSTEM_PROMPT =
  "Kamu adalah Usick V1, asisten kecerdasan buatan tingkat lanjut yang sangat pintar, cerdas, berwawasan luas, profesional, dan ramah.\n\n" +
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

function getModelCategory(m: ModelEntry): string {
  const lbl = m.label.toLowerCase();
  const id = m.id.toLowerCase();
  const prov = (m.provider || "").toLowerCase();

  // Pokoknya yang ada gpt masuk ke model chat gpt
  if (lbl.includes("gpt") || id.includes("gpt")) return "ChatGPT";
  if (lbl.includes("llama") || id.includes("llama")) return "Llama";
  if (lbl.includes("deepseek") || id.includes("deepseek")) return "DeepSeek";
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

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
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
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    setUser(null);
    setShowAuthModal(true);
  };

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
  const inputDropdownRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        inputDropdownRef.current &&
        !inputDropdownRef.current.contains(e.target as Node)
      ) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Touch swipe gesture listener for smooth sidebar opening/closing
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);

      if (deltaY < 80) {
        // Swipe to right from anywhere on screen to slide open panel
        if (deltaX > 45 && !sidebarOpen) {
          setSidebarOpen(true);
        }
        // Swipe to left to close panel when open
        if (deltaX < -45 && sidebarOpen) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

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

    const text = (customPrompt || input).trim();
    if (!text || isStreaming) return;

    closeSidebarOnMobile();
    setError(null);
    setIsStreaming(true);
    setIsUserScrolledUp(false);
    if (webSearchEnabled) {
      setStatusMessage("Thinking & Browsing the web...");
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
        let errJson: { error?: string; detail?: string; isLimit?: boolean; model?: string } = {};
        try {
          errJson = (await res.json()) as { error?: string; detail?: string; isLimit?: boolean; model?: string };
          errDetail = errJson.error || errJson.detail || errDetail;
        } catch {
          const errRaw = await res.text().catch(() => "");
          if (errRaw) errDetail = errRaw.slice(0, 200);
        }

        // Deteksi apakah model terkena rate limit, quota exceeded, atau credit exhausted
        const isLimit =
          Boolean(errJson.isLimit) ||
          res.status === 429 ||
          res.status === 402 ||
          errDetail.toLowerCase().includes("rate limit") ||
          errDetail.toLowerCase().includes("quota") ||
          errDetail.toLowerCase().includes("limit") ||
          errDetail.toLowerCase().includes("exceeded") ||
          errDetail.toLowerCase().includes("exhausted") ||
          errDetail.toLowerCase().includes("capacity") ||
          errDetail.toLowerCase().includes("overloaded") ||
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
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const appendSmoothly = async (textChunk: string) => {
        if (!textChunk) return;
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
          const slice = textChunk.slice(i, i + step);
          fullText += slice;
          updateAssistantContent(assistantId, fullText);
          await sleep(12);
        }
      };

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
                setStatusMessage(null);
                await appendSmoothly(delta);
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
                  await appendSmoothly(delta);
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
    closeSidebarOnMobile();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    setStatusMessage(null);
    setIsUserScrolledUp(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
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

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Tamu";

  const userInitial = (
    user?.user_metadata?.full_name ||
    user?.email ||
    "U"
  )[0].toUpperCase();

  return (
    <div className={`flex h-[100dvh] w-full max-w-[100vw] overflow-hidden ${
      isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#0d0d0f] text-zinc-900"
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
                <span className={`font-bold tracking-tight text-[15px] ${isDark ? "text-white" : "text-black"}`}>Usick V1</span>
                <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-semibold border ${
                  isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-200"
                }`}>v2.0</span>
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
              onClick={newChat}
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
            <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition font-semibold ${
              isDark ? "bg-zinc-800/90 text-white" : "bg-zinc-100 text-black"
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Chats</span>
            </div>

            <div
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition ${
                webSearchEnabled
                  ? (isDark ? "bg-white text-black font-semibold shadow-xs" : "bg-black text-white font-semibold shadow-xs")
                  : (isDark ? "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-black hover:text-black font-medium")
              }`}
            >
              <span className="flex items-center gap-2.5">
                <svg className={`w-4 h-4 shrink-0 ${webSearchEnabled ? (isDark ? "text-black" : "text-white") : (isDark ? "text-zinc-400" : "text-black")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Thinking (Browse)</span>
              </span>
              <span className={`h-2 w-2 rounded-full ${
                webSearchEnabled
                  ? (isDark ? "bg-black animate-pulse" : "bg-white animate-pulse")
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              }`} />
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
              {messages.length > 0 && (
                <button
                  onClick={newChat}
                  title="Hapus riwayat"
                  className={`text-[10px] transition cursor-pointer ${
                    isDark ? "text-zinc-500 hover:text-red-400" : "text-zinc-500 hover:text-red-500"
                  }`}
                >
                  Clear
                </button>
              )}
            </div>

            {messages.length === 0 ? (
              <div className={`px-2 py-6 text-center text-xs ${isDark ? "text-zinc-500" : "text-zinc-600 font-medium"}`}>
                Belum ada percakapan aktif.
              </div>
            ) : (
              <div className="space-y-1">
                <div
                  onClick={closeSidebarOnMobile}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition border ${
                    isDark
                      ? "bg-zinc-900/60 hover:bg-zinc-800/70 border-zinc-800 text-zinc-200"
                      : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200/70 text-black"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className={`truncate font-semibold ${isDark ? "text-zinc-200" : "text-black"}`}>
                      {messages.find((m) => m.role === "user")?.content || "Percakapan Baru"}
                    </p>
                    <p className={`text-[10px] mt-0.5 truncate ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                      {messages.length} pesan · Aktif
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      newChat();
                    }}
                    className={`p-1 transition ${isDark ? "text-zinc-500 hover:text-red-400" : "text-zinc-500 hover:text-red-500"}`}
                    title="Hapus chat ini"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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
        {/* Top App Bar */}
        <header className={`shrink-0 w-full z-20 flex items-center justify-between border-b px-3.5 sm:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md ${
          isDark ? "border-zinc-800/80 bg-[#121215]/95 text-white" : "border-zinc-100 bg-white/95 text-zinc-900"
        }`}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-2xs transition cursor-pointer ${
                isDark
                  ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-black"
              }`}
              title="Toggle Sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl shadow-xs ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                </svg>
              </div>
              <span className={`text-sm font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>Usick V1</span>
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
                  {getTimeGreeting()}, Usick V1
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
                      <p className="whitespace-pre-wrap leading-relaxed font-normal">{msg.content}</p>
                    ) : (
                      <>
                        {!msg.content && isStreaming && (
                          <div className={`flex items-center gap-2 py-1 text-xs font-medium ${isDark ? "text-zinc-400" : "text-black"}`}>
                            <div className={`h-2 w-2 rounded-full animate-ping ${isDark ? "bg-white" : "bg-black"}`} />
                            <span>Sedang merumuskan jawaban...</span>
                          </div>
                        )}

                        <div className="relative">
                          <MarkdownMessage content={msg.content} />
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
                className={`w-full bg-transparent px-2 sm:px-2.5 pt-1 text-[16px] sm:text-[14.5px] focus:outline-none resize-none leading-relaxed ${
                  isDark ? "text-zinc-100 placeholder-zinc-500" : "text-black placeholder-zinc-500 font-normal"
                }`}
                style={{ maxHeight: "140px" }}
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
                        isDark
                          ? "bg-zinc-800/90 hover:bg-zinc-700/80 border-zinc-700 text-zinc-100"
                          : "bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200/90 text-black"
                      }`}
                      title="Pilih Model AI"
                    >
                      <svg className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-white" : "text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      <span className="truncate">
                        {cleanModelLabel(activeModelObj.label)}
                      </span>
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
                          {groupedCategories.map((group) => (
                            <div key={group.name} className="py-1.5 first:pt-0.5 last:pb-0.5">
                              <div className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                isDark ? "text-zinc-300" : "text-black"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isDark ? "bg-white" : "bg-black"}`} />
                                <span>{group.name}</span>
                              </div>
                              <div className="space-y-0.5">
                                {group.items.map((m, idx) => {
                                  const isSelected = m.id === model;
                                  const isDisabled = Boolean(disabledModels[m.id] && disabledModels[m.id] > Date.now());
                                  const cleanName = cleanModelLabel(m.label);
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
                                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                                        isDisabled
                                          ? "opacity-40 cursor-not-allowed line-through text-zinc-500"
                                          : isSelected
                                          ? (isDark
                                              ? "bg-white text-black font-semibold shadow-xs cursor-pointer"
                                              : "bg-black text-white font-medium shadow-xs cursor-pointer")
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
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thinking (Browse) Toggle Switch */}
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
                    title="Aktifkan fitur Thinking / Web Browse"
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
                    <span>Thinking</span>
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
                      disabled={!input.trim()}
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all duration-200 ${
                        input.trim()
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
    </div>
  );
}