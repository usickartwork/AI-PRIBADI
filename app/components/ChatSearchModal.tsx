"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { ChatSession } from "../page";

interface ChatSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  isDark: boolean;
}

interface SearchResultItem {
  session: ChatSession;
  matchedSnippet: string | null;
  matchedRole?: "user" | "assistant";
}

function getSnippet(content: string, query: string, maxLength = 90): string {
  if (!query) {
    return content.length > maxLength ? content.slice(0, maxLength) + "..." : content;
  }
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);
  if (index === -1) {
    return content.length > maxLength ? content.slice(0, maxLength) + "..." : content;
  }
  const start = Math.max(0, index - 25);
  const end = Math.min(content.length, index + query.length + 55);
  let snippet = content.slice(start, end).replace(/\s+/g, " ");
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}

export function ChatSearchModal({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  isDark,
}: ChatSearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC and Arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Compute search results
  const searchResults: SearchResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // If no query, return recent sessions with latest user prompt snippet
      return sessions.slice(0, 20).map((sess) => {
        const lastUserMsg = [...sess.messages].reverse().find((m) => m.role === "user");
        const snippet = lastUserMsg?.content
          ? getSnippet(lastUserMsg.content, "", 75)
          : sess.messages[0]?.content
          ? getSnippet(sess.messages[0].content, "", 75)
          : null;
        return {
          session: sess,
          matchedSnippet: snippet,
          matchedRole: lastUserMsg ? "user" : undefined,
        };
      });
    }

    const matches: SearchResultItem[] = [];

    for (const sess of sessions) {
      const titleMatches = (sess.title || "").toLowerCase().includes(q);

      // Search inside messages (prioritizing user prompts)
      let foundSnippet: string | null = null;
      let matchedRole: "user" | "assistant" | undefined = undefined;

      // First check user messages (what the user actually typed/input)
      for (const msg of sess.messages) {
        if (msg.role === "user" && msg.content && msg.content.toLowerCase().includes(q)) {
          foundSnippet = getSnippet(msg.content, q);
          matchedRole = "user";
          break;
        }
      }

      // If not in user messages, check assistant messages
      if (!foundSnippet) {
        for (const msg of sess.messages) {
          if (msg.content && msg.content.toLowerCase().includes(q)) {
            foundSnippet = getSnippet(msg.content, q);
            matchedRole = msg.role;
            break;
          }
        }
      }

      if (titleMatches || foundSnippet) {
        // If title matched but no specific message match found, use latest message as context
        if (!foundSnippet) {
          const firstMsg = sess.messages[0];
          foundSnippet = firstMsg?.content ? getSnippet(firstMsg.content, "", 70) : null;
          matchedRole = firstMsg?.role;
        }

        matches.push({
          session: sess,
          matchedSnippet: foundSnippet,
          matchedRole,
        });
      }
    }

    return matches;
  }, [sessions, query]);

  // Handle arrow key navigation and Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(searchResults[selectedIndex].session.id);
    }
  };

  const handleSelect = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden z-10 transition-all animate-in zoom-in-95 duration-200 ${
          isDark
            ? "bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-black/70"
            : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
        } backdrop-blur-xl`}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          className={`flex items-center gap-3 px-4 py-3.5 border-b ${
            isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50/50"
          }`}
        >
          <svg
            className="w-5 h-5 text-zinc-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Cari chat atau pesan yang pernah diinput..."
            className="flex-1 bg-transparent text-sm sm:text-base focus:outline-none placeholder:text-zinc-400 text-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition cursor-pointer"
              title="Hapus pencarian"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <kbd
              className={`hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                isDark ? "border-zinc-700 bg-zinc-800 text-zinc-400" : "border-zinc-300 bg-zinc-100 text-zinc-500"
              }`}
            >
              Esc
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-1">
          {searchResults.length === 0 ? (
            <div className="py-10 text-center px-4">
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center bg-zinc-500/10 text-zinc-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className={`text-sm font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                Tidak ada percakapan ditemukan
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Coba gunakan kata kunci lain dari chat yang pernah Anda masukkan.
              </p>
            </div>
          ) : (
            <>
              <div
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? "text-zinc-500" : "text-zinc-500"
                }`}
              >
                {query.trim() ? "Hasil Pencarian" : "Percakapan Terakhir"}
              </div>
              {searchResults.map((item, idx) => {
                const isActive = item.session.id === activeSessionId;
                const isHighlighted = idx === selectedIndex;
                return (
                  <div
                    key={item.session.id}
                    onClick={() => handleSelect(item.session.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition text-left ${
                      isHighlighted
                        ? isDark
                          ? "bg-zinc-800/90 text-white"
                          : "bg-zinc-100 text-zinc-900"
                        : isDark
                        ? "text-zinc-300 hover:bg-zinc-800/50"
                        : "text-zinc-700 hover:bg-zinc-100/60"
                    } ${isActive ? (isDark ? "border border-zinc-700/80" : "border border-zinc-300/80") : ""}`}
                  >
                    <div className="mt-0.5 shrink-0 text-zinc-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs sm:text-sm font-semibold truncate ${
                          isDark ? "text-white" : "text-zinc-900"
                        }`}>
                          {item.session.title || "Percakapan"}
                        </p>
                        {isActive && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            isDark ? "bg-zinc-700 text-zinc-200" : "bg-zinc-200 text-zinc-800"
                          }`}>
                            Aktif
                          </span>
                        )}
                      </div>

                      {item.matchedSnippet && (
                        <p className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${
                          isDark ? "text-zinc-400" : "text-zinc-600"
                        }`}>
                          {item.matchedRole === "user" && (
                            <span className="font-semibold text-zinc-300 dark:text-zinc-300 mr-1">
                              Input:
                            </span>
                          )}
                          {item.matchedSnippet}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                        <span>{item.session.messages.length} pesan</span>
                        <span>•</span>
                        <span>
                          {new Date(item.session.updatedAt || Date.now()).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 text-[11px] border-t ${
            isDark ? "border-zinc-800 bg-zinc-900/60 text-zinc-500" : "border-zinc-200 bg-zinc-50/60 text-zinc-500"
          }`}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className={`px-1 py-0.5 rounded border text-[10px] ${
                isDark ? "border-zinc-700 bg-zinc-800" : "border-zinc-300 bg-zinc-100"
              }`}>↵</kbd> untuk buka
            </span>
            <span>
              <kbd className={`px-1 py-0.5 rounded border text-[10px] ${
                isDark ? "border-zinc-700 bg-zinc-800" : "border-zinc-300 bg-zinc-100"
              }`}>↑↓</kbd> untuk navigasi
            </span>
          </div>
          <span>Tekan Esc untuk tutup</span>
        </div>
      </div>
    </div>
  );
}
