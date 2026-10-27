"use client";

import React, { useState, useRef } from "react";
import { Copy, Check, ArrowRight } from "lucide-react";
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

  const userQuestionsCount = messages.filter((m) => m.role === "user").length;
  const isLimitReached = userQuestionsCount >= 2;

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
    if (isLimitReached) {
      onGetStarted?.("signup");
      return;
    }

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
      if (isLimitReached) {
        onGetStarted?.("signup");
        return;
      }
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
        </div>
      )}

      {/* ─── LIMIT REACHED NOTICE (Tanpa Kotakan, Menyatu Bersih Alami) ────── */}
      {isLimitReached && !isStreaming && (
        <div className="py-4 text-center space-y-2 animate-in fade-in-0 duration-300 select-none">
          <p className="text-sm sm:text-base font-semibold text-white tracking-wide">
            Batas 2 pertanyaan uji coba telah tercapai
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Daftar akun gratis sekarang untuk melanjutkan percakapan tanpa batas bersama Usick One.
          </p>
          <div className="pt-1.5 flex justify-center">
            <button
              type="button"
              onClick={() => onGetStarted?.("signup")}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs sm:text-sm hover:bg-zinc-200 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            >
              <span>Get Started Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── FLOATING INPUT BAR (Identik 100% dengan Web Tab Chat Onemind) ─── */}
      <div className="w-full relative">
        <div className="prompt-bar-glow relative w-full rounded-[26px] sm:rounded-[28px] p-[1.5px] shadow-2xl transition-all">
          <div
            className={`w-full rounded-[24px] sm:rounded-[26px] border transition-all relative ${
              isDark
                ? "bg-[#1c1c1f] border-zinc-800/80 shadow-black/80"
                : "bg-white border-zinc-200/80 shadow-zinc-200/80"
            }`}
          >
            <div className="p-3 sm:p-3.5 space-y-1.5">
              {/* Textarea Input (Full width, narrowed vertically) */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={handleInputResize}
                  onKeyDown={handleKeyDown}
                  disabled={isLimitReached || isStreaming}
                  placeholder={
                    isLimitReached
                      ? "Batas 2 pertanyaan tercapai. Klik Get Started untuk melanjutkan..."
                      : "Ask AI a question or make a request..."
                  }
                  className={`w-full bg-transparent px-1 py-0.5 text-sm sm:text-base outline-none resize-none leading-relaxed ${
                    isDark ? "text-white placeholder-zinc-500" : "text-zinc-900 placeholder-zinc-500 font-normal"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  style={{ maxHeight: "120px" }}
                />
              </div>

              {/* Controls Row (Narrowed Vertically) */}
              <div className="flex items-center justify-between pt-1 gap-1.5 sm:gap-2">
                {/* Left Side: Model Selector + Browse */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  {/* Model Pill: Usick One (Persis seperti button model di Tab Chat) */}
                  <div
                    className={`h-9 sm:h-10 flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-3.5 py-1.5 sm:py-1.5 text-[13px] sm:text-[13px] font-medium transition cursor-default max-w-[140px] sm:max-w-[210px] ${
                      isDark
                        ? "bg-zinc-800/90 border-zinc-700/60 text-zinc-200"
                        : "bg-zinc-100 border-zinc-200 text-zinc-800"
                    }`}
                    title="Model aktif: Usick One Flagship AI"
                  >
                    <BrainLogo className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="truncate">Usick One</span>
                  </div>

                  {/* Browse Toggle Switch (Persis seperti switch di Tab Chat) */}
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`h-9 sm:h-10 flex items-center gap-2 sm:gap-2 rounded-full border px-3 sm:px-3.5 py-1.5 sm:py-1.5 text-xs sm:text-xs font-medium sm:font-semibold transition-all cursor-pointer shrink-0 ${
                      webSearchEnabled
                        ? (isDark
                            ? "border-white bg-white text-black shadow-xs"
                            : "border-black bg-black text-white shadow-xs")
                        : (isDark
                            ? "border-zinc-700/60 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                            : "border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200")
                    }`}
                    title="Aktifkan fitur Browse / Web Search"
                  >
                    <div className={`relative h-3.5 w-6 sm:h-3.5 sm:w-6 rounded-full transition-colors ${
                      webSearchEnabled
                        ? (isDark ? "bg-black/25" : "bg-white/30")
                        : (isDark ? "bg-zinc-700" : "bg-zinc-300")
                    }`}>
                      <div className={`absolute top-0.5 h-2.5 w-2.5 sm:h-2.5 sm:w-2.5 rounded-full transition-transform ${
                        webSearchEnabled
                          ? `translate-x-3 sm:translate-x-3 ${isDark ? "bg-black" : "bg-white"}`
                          : `translate-x-0.5 ${isDark ? "bg-zinc-400" : "bg-white"}`
                      }`} />
                    </div>
                    <span className="text-xs sm:text-xs font-medium sm:font-semibold">Browse</span>
                  </button>

                  {/* Sisa Pertanyaan Counter */}
                  {userQuestionsCount > 0 && !isLimitReached && (
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border hidden sm:inline-block ${
                      isDark
                        ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-400"
                        : "bg-zinc-100 border-zinc-200 text-zinc-600"
                    }`}>
                      Sisa uji coba: {2 - userQuestionsCount} pertanyaan
                    </span>
                  )}
                </div>

                {/* Right Side: Send / Stop / Get Started Button (Persis Tab Chat) */}
                <div className="flex items-center gap-2 shrink-0">
                  {isLimitReached ? (
                    <button
                      type="button"
                      onClick={() => onGetStarted?.("signup")}
                      className={`flex h-9.5 w-9.5 sm:h-10 sm:w-10 items-center justify-center rounded-full transition cursor-pointer shadow-xs ${
                        isDark
                          ? "bg-white hover:bg-zinc-200 text-black"
                          : "bg-black hover:bg-zinc-800 text-white"
                      }`}
                      title="Daftar akun untuk lanjut (Get Started)"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className={`flex h-9.5 w-9.5 sm:h-10 sm:w-10 items-center justify-center rounded-full transition shadow-sm cursor-pointer ${
                        isDark
                          ? "bg-white/10 hover:bg-white/15 text-white"
                          : "bg-black/5 hover:bg-black/10 text-black"
                      }`}
                      title="Hentikan respons"
                    >
                      <div
                        className="w-4 h-4 bg-black dark:bg-white rounded-sm animate-spin transition duration-700"
                        style={{ animationDuration: "3s" }}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!input.trim()}
                      onClick={() => handleSendMessage()}
                      className={`flex h-9.5 w-9.5 sm:h-10 sm:w-10 items-center justify-center rounded-full transition cursor-pointer shadow-xs ${
                        input.trim()
                          ? isDark
                            ? "bg-white hover:bg-zinc-200 text-black"
                            : "bg-black hover:bg-zinc-800 text-white"
                          : isDark
                            ? "bg-zinc-800/80 text-zinc-500 cursor-not-allowed"
                            : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      }`}
                      title="Kirim pesan"
                    >
                      <svg className="w-5 h-5 sm:w-5 sm:h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
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
