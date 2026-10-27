"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, RotateCcw, Copy, Check, Sparkles, Globe, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/components-primitives-avatar";
import { BrainLogo } from "@/components/ui/brain-logo";
import { MarkdownMessage } from "@/app/components/MarkdownMessage";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface HomeInteractiveChatProps {
  isDark?: boolean;
  onGetStarted?: (mode?: "signin" | "signup") => void;
}

const STARTER_PROMPTS = [
  "Jelaskan tentang platform One Mind dan apa saja keunggulannya",
  "Rancang arsitektur aplikasi SaaS modern dengan Next.js & AI",
  "Bantu susun jadwal belajar harian yang produktif dan realistis",
  "Tuliskan ide inovatif untuk startup teknologi masa depan",
];

export function HomeInteractiveChat({
  isDark = true,
  onGetStarted,
}: HomeInteractiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, statusMessage]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setStatusMessage(null);
  };

  const handleReset = () => {
    handleStop();
    setMessages([]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend !== undefined ? textToSend : input).trim();
    if (!promptText || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, role: "user", content: promptText },
      { id: assistantMsgId, role: "assistant", content: "" },
    ];

    setMessages(newMessages);
    setIsStreaming(true);

    if (webSearchEnabled) {
      setStatusMessage("Menelusuri informasi web terkini...");
    } else {
      setStatusMessage(null);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages = [
        {
          role: "system",
          content:
            "Anda adalah Usick One, asisten AI flagship cerdas resmi dari One Mind. Jawablah setiap pertanyaan pengguna secara ramah, cerdas, akurat, dan terstruktur rapi menggunakan format Markdown.",
        },
        ...newMessages
          .filter((m) => m.id !== assistantMsgId)
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "novita:apodex/apodex-1.1-mini", // Model Usick One Flagship
          messages: apiMessages,
          webSearch: webSearchEnabled,
          taskType: "chat",
          userId: "guest",
          effortLevel: "Balanced",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta",
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errText = "Gagal memproses pesan.";
        try {
          const errData = await res.json();
          errText = errData.error || errData.detail || errText;
        } catch {
          errText = (await res.text()) || errText;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `⚠️ Terjadi kendala saat menghubungkan ke Usick One: ${errText}`,
                }
              : m
          )
        );
        setIsStreaming(false);
        setStatusMessage(null);
        return;
      }

      setStatusMessage(null);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulated } : m
            )
          );
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId && !m.content
              ? {
                  ...m,
                  content:
                    "⚠️ Koneksi terputus. Silakan coba kirim ulang pertanyaan Anda.",
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setStatusMessage(null);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto z-10 select-none">
      {/* ─── SECTION HEADER ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-2xl mx-auto mb-8 sm:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-mono tracking-widest uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          <span>Interactive AI Experience</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Coba Langsung Usick One.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Uji kecerdasan model flagship One Mind secara langsung dan realtime tanpa harus keluar dari halaman utama.
        </p>
      </motion.div>

      {/* ─── CHAT CONTAINER CARD ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full rounded-3xl border border-white/10 bg-zinc-950/75 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-[560px] sm:h-[620px]"
      >
        {/* ─── TOP STATUS BAR ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <Avatar
                size="sm"
                shape="circle"
                blinking={true}
                isDark={isDark}
                color="theme"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">
                  Usick One
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  <BrainLogo className="w-2.5 h-2.5" /> Flagship
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online & Siap Menjawab</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                title="Mulai Percakapan Baru"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {onGetStarted && (
              <button
                type="button"
                onClick={() => onGetStarted("signup")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition cursor-pointer shadow-xs"
              >
                <span>Buka Penuh</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ─── MESSAGES SCROLL AREA ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 select-text">
          {messages.length === 0 ? (
            /* Empty State / Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-6">
              <div className="relative mb-4 flex items-center justify-center">
                <Avatar
                  size="md"
                  shape="circle"
                  blinking={true}
                  isDark={isDark}
                  color="theme"
                />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Ada yang bisa Usick One bantu?
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                Tanyakan ide aplikasi, penulisan, analisis data, atau pilih pertanyaan pembuka di bawah ini:
              </p>

              {/* Starter Prompt Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full text-left">
                {STARTER_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(promptText)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs text-zinc-300 hover:text-white leading-snug cursor-pointer group flex flex-col justify-between"
                  >
                    <span>{promptText}</span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 mt-2 flex items-center gap-1">
                      Kirim pertanyaan <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message List */
            <>
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                  >
                    {isUser ? (
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 bg-zinc-800 border border-zinc-700/80 text-white text-sm leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 max-w-[95%] sm:max-w-[90%]">
                        <div className="shrink-0 mt-0.5">
                          <Avatar
                            size="sm"
                            shape="circle"
                            blinking={false}
                            isDark={isDark}
                            color="theme"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          {msg.content ? (
                            <div className="text-sm text-zinc-200 leading-relaxed">
                              <MarkdownMessage content={msg.content} isDark={isDark} />
                            </div>
                          ) : isStreaming ? (
                            <div className="flex items-center gap-1.5 py-2 text-xs text-zinc-400">
                              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                              <span className="ml-2 font-mono text-[11px]">{statusMessage || "Usick One sedang merangkai jawaban..."}</span>
                            </div>
                          ) : null}

                          {msg.content && !isStreaming && (
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                title="Salin jawaban"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ─── BOTTOM INPUT BAR ───────────────────────────────────────────────── */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/50 backdrop-blur-md shrink-0">
          <div className="relative rounded-2xl bg-zinc-900/90 border border-white/15 p-2 sm:p-2.5 shadow-xl transition-all focus-within:border-white/30">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan apa saja kepada Usick One... (Enter untuk kirim)"
              className="w-full resize-none bg-transparent px-2 py-1 text-sm text-white placeholder-zinc-500 focus:outline-hidden max-h-32 leading-relaxed"
            />

            {/* Bottom Controls Row: Model Pill (Usick One Fixed) + Browse Toggle + Send Button */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
              <div className="flex items-center gap-2">
                {/* Fixed Model Pill: Usick One (No other models, strictly Usick One) */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-semibold cursor-default"
                  title="Model aktif: Usick One Flagship AI"
                >
                  <BrainLogo className="w-3 h-3 text-white" />
                  <span>Usick One</span>
                </div>

                {/* Web Search (Browse) Toggle */}
                <button
                  type="button"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition cursor-pointer ${
                    webSearchEnabled
                      ? "bg-white text-black border-white shadow-xs"
                      : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
                  }`}
                  title="Aktifkan pencarian web langsung"
                >
                  <Globe className="w-3 h-3" />
                  <span>Browse</span>
                </button>
              </div>

              {/* Action Buttons: Stop while streaming OR Send button (NO Voice Assistant button) */}
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer shadow-xs"
                    title="Hentikan respons"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!input.trim()}
                    onClick={() => handleSendMessage()}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition shadow-xs cursor-pointer ${
                      input.trim()
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-white/10 text-zinc-500 cursor-not-allowed"
                    }`}
                    title="Kirim pesan"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default HomeInteractiveChat;
