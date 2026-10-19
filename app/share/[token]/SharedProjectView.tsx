"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Copy, Moon, Sun, ArrowLeft, MessageSquare, Globe, Sparkles } from "lucide-react";
import { MarkdownMessage } from "@/app/components/MarkdownMessage";

interface SharedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  fileName?: string;
  sources?: Array<{ title?: string; url: string; snippet?: string }>;
  model?: string;
}

interface SharedProjectViewProps {
  initialTitle: string;
  initialMessages: SharedMessage[];
  createdAt: string;
  token: string;
}

export function SharedProjectView({
  initialTitle,
  initialMessages,
  createdAt,
  token,
}: SharedProjectViewProps) {
  const [isDark, setIsDark] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Sync theme with system or saved preference
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        setIsDark(savedTheme === "dark");
      } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        setIsDark(false);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  };

  const handleCopyLink = async () => {
    try {
      const url =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? `${window.location.origin}/share/${token}`
          : `https://onemind.web.id/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert("Gagal menyalin tautan.");
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2500);
    } catch {}
  };

  const formattedDate = (() => {
    try {
      return new Date(createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return createdAt;
    }
  })();

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isDark ? "bg-[#0c0c0e] text-zinc-100" : "bg-[#f8f9fa] text-zinc-900"
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b backdrop-blur-xl ${
          isDark
            ? "border-zinc-800/80 bg-[#0c0c0e]/80 text-white"
            : "border-zinc-200/80 bg-white/80 text-zinc-900"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className={`flex items-center gap-2 p-1.5 rounded-xl transition hover:opacity-80 cursor-pointer ${
              isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
            }`}
            title="Kembali ke Usick One"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* Usick One 4-Point Star Icon */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
            </div>
            <span className="font-extrabold tracking-tight text-sm hidden sm:inline">
              Usick <span className="font-normal opacity-80">One</span>
            </span>
          </Link>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1 hidden sm:block" />

          <span className="text-xs sm:text-sm font-semibold truncate max-w-[180px] sm:max-w-md">
            {initialTitle || "Shared Project"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition border cursor-pointer ${
              isDark
                ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                : "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
            }`}
            title={isDark ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Copy link button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-xs ${
              copiedLink
                ? isDark
                  ? "bg-zinc-200 text-black border-zinc-200"
                  : "bg-zinc-800 text-white border-zinc-800"
                : isDark
                ? "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white"
                : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black"
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salin Tautan</span>
              </>
            )}
          </button>

          {/* CTA: Chat in Usick One */}
          <Link
            href={`/?share=${encodeURIComponent(token)}`}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lanjutkan di Chat AI</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {/* Project Header Banner */}
        <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isDark
                  ? "bg-zinc-900 text-zinc-300 border-zinc-800"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
              }`}
            >
              Percakapan Dibagikan
            </span>
            <span className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
              {formattedDate}
            </span>
            <span className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
              · {initialMessages.length} pesan
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            {initialTitle || "Percakapan Usick One"}
          </h1>

          <div
            className={`mt-4 rounded-xl p-3 border flex items-start gap-2.5 text-xs ${
              isDark
                ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-400"
                : "bg-zinc-50 border-zinc-200 text-zinc-600"
            }`}
          >
            <Globe className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
            <p>
              Tautan ini merupakan snapshot statis percakapan saat dibagikan. Anda dapat membaca seluruh diskusi tanpa harus login.
            </p>
          </div>
        </div>

        {/* Message Stream */}
        <div className="space-y-6 flex-1">
          {initialMessages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isCopied = copiedMsgId === msg.id;

            return (
              <div
                key={msg.id || index}
                className={`flex ${isUser ? "justify-end" : "justify-start"} w-full animate-in fade-in-0 duration-200`}
              >
                {isUser ? (
                  /* User message bubble */
                  <div className="flex flex-col items-end gap-1 max-w-[90%] sm:max-w-[80%]">
                    <div
                      className={`relative w-fit max-w-full rounded-[22px] px-4 py-3 text-[14px] sm:text-[14.5px] leading-relaxed ${
                        isDark
                          ? "bg-zinc-800 border border-zinc-700/80 text-white shadow-sm"
                          : "bg-zinc-900 border border-zinc-800 text-white shadow-sm"
                      }`}
                    >
                      {msg.image && (
                        <div className="mb-2.5 overflow-hidden rounded-xl border border-white/20 shadow-sm max-w-xs">
                          <img
                            src={msg.image}
                            alt="Foto terlampir"
                            className="max-h-64 w-auto rounded-xl object-contain bg-black/20"
                          />
                        </div>
                      )}

                      {msg.fileName && (
                        <div className="mb-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 border border-white/15 text-white">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px]">{msg.fileName}</span>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className={`text-[11px] px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                        isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3 text-zinc-200 dark:text-zinc-300" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                ) : (
                  /* Assistant message */
                  <div className="w-full text-left py-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isDark ? "bg-white text-black" : "bg-black text-white"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold tracking-tight">
                        Usick One {msg.model ? `(${msg.model})` : "AI"}
                      </span>
                    </div>

                    {/* Markdown rendering with LaTeX math and code blocks */}
                    <div className="text-[14.5px] sm:text-[15px] leading-relaxed pl-1 sm:pl-8">
                      <MarkdownMessage content={msg.content} isDark={isDark} />

                      {/* Web Sources Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div
                          className={`mt-4 pt-3 border-t ${
                            isDark ? "border-zinc-800" : "border-zinc-200"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-2 ${
                              isDark ? "text-zinc-300" : "text-zinc-700"
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Sumber Referensi Web ({msg.sources.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-2.5 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                                  isDark
                                    ? "bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800 text-zinc-300"
                                    : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700"
                                }`}
                              >
                                <span className="font-semibold line-clamp-1">{src.title || src.url}</span>
                                <span className="text-[11px] text-zinc-400 truncate mt-1">{src.url}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                            isCopied
                              ? isDark
                                ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                                : "bg-zinc-200 border-zinc-300 text-zinc-800"
                              : isDark
                              ? "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                              : "border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-100"
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? "Tersalin!" : "Salin Tanggapan"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Call to Action Banner */}
        <div
          className={`mt-12 p-6 rounded-2xl border text-center flex flex-col items-center justify-center ${
            isDark ? "bg-zinc-900/40 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${
              isDark ? "bg-white text-black" : "bg-black text-white"
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold">Ingin berdiskusi dengan AI seperti ini?</h3>
          <p className={`text-xs sm:text-sm mt-1 max-w-md ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Usick One hadir dengan dukungan model cerdas, visualisasi rumus matematika, eksekusi kode, pencarian web langsung, dan sinkronisasi antar perangkat.
          </p>
          <Link
            href={`/?share=${encodeURIComponent(token)}`}
            className={`mt-4 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer ${
              isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            Lanjutkan Percakapan Ini di Chat AI
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`py-6 px-4 text-center border-t text-xs ${
          isDark ? "border-zinc-800/80 text-zinc-500" : "border-zinc-200 text-zinc-400"
        }`}
      >
        <p>© {new Date().getFullYear()} Usick One. Hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

