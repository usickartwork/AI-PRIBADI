"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Square, RotateCcw, Copy, Check, ArrowRight, Globe } from "lucide-react";
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
  "Bantu susun jadwal harian yang produktif dan terstruktur",
  "Tuliskan ide proyek inovatif untuk startup teknologi AI",
];

export function HomeInteractiveChat({
  isDark = true,
  onGetStarted,
}: HomeInteractiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll smooth ke pesan terbaru saat percakapan bertambah
  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

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
  };

  const handleReset = () => {
    handleStop();
    setMessages([]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Helper untuk membersihkan tag <think> jika ada
  const cleanReasoningTags = (raw: string) => {
    const isThinking =
      (raw.includes("<think>") && !raw.includes("</think>")) ||
      (raw.includes("<thought>") && !raw.includes("</thought>"));

    let clean = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<thought>[\s\S]*?<\/thought>/gi, "");

    if (isThinking) {
      clean = clean
        .replace(/<think>[\s\S]*$/gi, "")
        .replace(/<thought>[\s\S]*$/gi, "");
    }
    return clean.trimStart();
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

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages = [
        {
          role: "system",
          content:
            "Anda adalah Usick One, asisten kecerdasan flagship resmi dari One Mind. Jawablah setiap pertanyaan secara ramah, cerdas, akurat, dan terstruktur rapi menggunakan format Markdown.",
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
                  content: `⚠️ Kendala respon: ${errText}`,
                }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      if (!res.body) {
        throw new Error("Tidak ada stream respons dari server.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      while (true) {
        if (controller.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;

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
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              const cleaned = cleanReasoningTags(fullText);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: cleaned } : m
                )
              );
            }
          } catch {
            // Abaikan parsing error untuk chunk non-JSON
          }
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
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <section className="relative w-full py-10 sm:py-16 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto z-10 select-none">
      {/* ─── RESET / STATUS TOP ACTION (Muncul jika ada riwayat percakapan) ─── */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between pb-6 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Avatar
              size="sm"
              shape="circle"
              blinking={true}
              isDark={isDark}
              color="theme"
            />
            <span className="text-xs font-semibold text-zinc-300">
              Percakapan Aktif bersama Usick One
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              title="Mulai Percakapan Baru"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Percakapan Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── EMPTY STATE (Persis seperti tampilan awal di dalam Web Tab Chat) ─── */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center select-none py-6 sm:py-10 animate-in fade-in-0 duration-300">
          {/* Avatar Icon */}
          <div className="relative mb-3.5 sm:mb-4 flex items-center justify-center select-none">
            <Avatar
              size="md"
              shape="circle"
              blinking={true}
              isDark={isDark}
              color="theme"
              className="hover:scale-105 transition-transform"
            />
          </div>

          {/* Heading Title */}
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white select-none">
            What would you like to build or explore today?
          </h1>
          <p className="mt-2 mb-6 sm:mb-8 text-xs sm:text-sm text-zinc-400 max-w-md select-none leading-relaxed">
            Eksplorasi kecerdasan flagship Usick One secara langsung dan realtime tanpa berpindah tab.
          </p>
        </div>
      )}

      {/* ─── MESSAGES STREAM AREA (Menyatu tanpa kotakan pembatas) ─────────── */}
      {messages.length > 0 && (
        <div className="space-y-5 sm:space-y-6 pb-6 select-text">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"} w-full animate-in fade-in-0 duration-200`}
              >
                {isUser ? (
                  /* User Bubble: Rounded pill bubble di sebelah kanan */
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-[22px] px-4 py-2.5 sm:py-3 bg-zinc-800 border border-zinc-700/80 text-white text-[14px] sm:text-[14.5px] leading-relaxed shadow-sm font-normal">
                    {msg.content}
                  </div>
                ) : (
                  /* Assistant Bubble: Menyatu persis di sebelah kiri dengan Avatar */
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
                        <div className="text-[14px] sm:text-[14.5px] text-zinc-200 leading-relaxed">
                          <MarkdownMessage content={msg.content} isDark={isDark} />
                        </div>
                      ) : isStreaming ? (
                        <div className="flex items-center gap-1.5 py-2 text-xs text-zinc-400">
                          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                          <span className="ml-2 font-mono text-[11px]">Usick One sedang merangkai jawaban...</span>
                        </div>
                      ) : null}

                      {/* Tombol Salin Jawaban */}
                      {msg.content && !isStreaming && (
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            title="Salin respons"
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
          <div ref={chatBottomRef} />
        </div>
      )}

      {/* ─── FLOATING INPUT BAR (Sama persis dengan bilah input tab chat) ───── */}
      <div className="w-full relative">
        <div className="relative rounded-3xl border border-white/15 bg-zinc-900/85 backdrop-blur-xl p-3 sm:p-4 shadow-2xl transition-all focus-within:border-white/30">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputResize}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan apa saja kepada Usick One..."
            className="w-full resize-none bg-transparent px-2 py-1 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-hidden max-h-36 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-white/5">
            <div className="flex items-center gap-2">
              {/* Model Pill: Eksklusif Usick One (Terkunci tanpa dropdown) */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold cursor-default shadow-xs select-none"
                title="Model aktif: Usick One Flagship AI"
              >
                <BrainLogo className="w-3.5 h-3.5 text-white" />
                <span>Usick One</span>
              </div>

              {/* Browse Web Toggle Switch */}
              <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`h-8 sm:h-9 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  webSearchEnabled
                    ? "border-white bg-white text-black shadow-xs"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
                title="Aktifkan fitur Browse / Web Search"
              >
                <div className={`relative h-3 w-5 rounded-full transition-colors ${
                  webSearchEnabled ? "bg-black/25" : "bg-zinc-700"
                }`}>
                  <div className={`absolute top-0.5 h-2 w-2 rounded-full transition-transform ${
                    webSearchEnabled ? "translate-x-2.5 bg-black" : "translate-x-0.5 bg-zinc-400"
                  }`} />
                </div>
                <span className="text-xs font-medium">Browse</span>
              </button>
            </div>

            {/* Right Action: Send / Stop Circular Button (NO Voice Assistant button) */}
            <div className="flex items-center gap-2 shrink-0">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/20 text-white transition cursor-pointer shadow-xs"
                  title="Hentikan respons"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!input.trim()}
                  onClick={() => handleSendMessage()}
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition cursor-pointer shadow-xs ${
                    input.trim()
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "bg-white/10 text-zinc-500 cursor-not-allowed"
                  }`}
                  title="Kirim pesan"
                >
                  <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── SUGGESTION PROMPTS (Tampil hanya saat belum ada pesan) ─────────── */}
        {messages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {STARTER_PROMPTS.map((promptText, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(promptText)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs text-zinc-300 hover:text-white leading-snug cursor-pointer group flex items-center justify-between text-left"
              >
                <span>{promptText}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeInteractiveChat;
