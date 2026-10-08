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

export function ChatSearchModal({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  isDark,
}: ChatSearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
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

  // Filter sessions based on search query
  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return sessions;
    }
    return sessions.filter((sess) => {
      const titleMatch = (sess.title || "").toLowerCase().includes(q);
      const messageMatch = (sess.messages || []).some(
        (m) => m.content && m.content.toLowerCase().includes(q)
      );
      return titleMatch || messageMatch;
    });
  }, [sessions, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Matches user reference screenshot) */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden z-10 transition-all animate-in zoom-in-95 duration-150 p-6 sm:p-7 ${
          isDark
            ? "bg-[#212121] border border-zinc-800/80 text-zinc-100"
            : "bg-white border border-zinc-200 text-zinc-900 shadow-xl"
        }`}
      >
        {/* Top bar: Search... input on left, Close (X) on right */}
        <div className="flex items-center justify-between pb-6">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className={`w-full bg-transparent text-xl sm:text-2xl font-normal outline-none border-none p-0 pr-4 leading-normal ${
              isDark
                ? "text-zinc-100 placeholder:text-zinc-500"
                : "text-zinc-900 placeholder:text-zinc-400"
            }`}
          />
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
              isDark
                ? "text-zinc-400 hover:text-white hover:bg-white/10"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
            title="Close"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Section title: Recent chats */}
        <div className="text-sm font-normal text-zinc-400 mb-2">
          {query.trim() ? "Search results" : "Recent chats"}
        </div>

        {/* List of chats with empty speech bubble icons */}
        <div className="max-h-[55vh] overflow-y-auto -mx-2 px-2 space-y-0.5">
          {filteredSessions.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              {query.trim()
                ? `Tidak ada percakapan ditemukan untuk "${query}"`
                : "Belum ada percakapan"}
            </div>
          ) : (
            filteredSessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess.id);
                  onClose();
                }}
                className={`group flex items-center gap-3.5 px-3 py-3 rounded-xl cursor-pointer transition ${
                  isDark
                    ? "hover:bg-white/5 text-zinc-200 hover:text-white"
                    : "hover:bg-zinc-100 text-zinc-800 hover:text-zinc-950"
                }`}
              >
                {/* Empty speech bubble icon (exact match to screenshot) */}
                <svg
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isDark
                      ? "text-zinc-400 group-hover:text-zinc-200"
                      : "text-zinc-500 group-hover:text-zinc-800"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>

                <span className="text-[15px] sm:text-base font-normal truncate">
                  {sess.title || "Percakapan baru"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
