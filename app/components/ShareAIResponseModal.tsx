"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MessageCircle, Send, UserPlus, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PublicUser = { id: string; username: string | null; name: string; avatarUrl: string | null };
type FriendItem = { friendshipId: string; user: PublicUser; since: string };
type FriendsData = { friends: FriendItem[]; incoming: FriendItem[]; outgoing: FriendItem[]; blocked: PublicUser[] };

function UsickStarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 fill-current ${className}`} viewBox="0 0 24 24">
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
    </svg>
  );
}

interface ShareAIResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isDark: boolean;
  userId?: string | null;
  onOpenMessages?: () => void;
  onRequireAuth?: () => void;
}

export function ShareAIResponseModal({
  isOpen,
  onClose,
  content,
  isDark,
  userId,
  onOpenMessages,
  onRequireAuth,
}: ShareAIResponseModalProps) {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendItem | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFriend(null);
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    if (!userId) {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setStatus("idle");
    setErrorMessage(null);

    fetch("/api/messages/friends", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: FriendsData) => {
        if (isMounted) {
          setFriends(data.friends || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("Gagal memuat daftar teman.");
          setStatus("error");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const divider = isDark ? "border-white/10" : "border-black/10";
  const hoverRow = isDark ? "hover:bg-white/5" : "hover:bg-black/5";
  const primaryBtn = isDark
    ? "bg-white text-black hover:bg-zinc-200"
    : "bg-black text-white hover:bg-zinc-800";
  const ghostBtn = isDark
    ? "border border-white/10 text-zinc-300 hover:bg-white/5"
    : "border border-black/10 text-zinc-700 hover:bg-black/5";

  const handleSend = async () => {
    if (!selectedFriend || !content.trim() || status === "sending" || status === "success") return;
    setStatus("sending");
    setErrorMessage(null);

    try {
      // 1. Dapatkan atau buat percakapan dengan teman yang dipilih
      const convRes = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedFriend.user.id }),
      });
      const convData = await convRes.json();
      if (!convRes.ok) throw new Error(convData.error || "Gagal membuat percakapan.");

      const conversationId = convData.id as string;

      // 2. Kirim pesan dengan format tipe 'shared_ai'
      const msgRes = await fetch("/api/messages/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          body: content,
          messageType: "shared_ai",
        }),
      });
      const msgData = await msgRes.json();
      if (!msgRes.ok) throw new Error(msgData.error || "Gagal mengirim pesan.");

      // 3. Kirim Realtime Broadcast secara instan
      try {
        const convChannel = supabase.channel(`conv_${conversationId}`);
        void convChannel.send({
          type: "broadcast",
          event: "new_msg",
          payload: { message: msgData.message },
        });

        const peerInbox = supabase.channel(`inbox_${selectedFriend.user.id}`);
        void peerInbox.send({
          type: "broadcast",
          event: "inbox_ping",
          payload: {},
        });
      } catch {
        // Broadcast non-fatal
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Gagal membagikan jawaban AI.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={status === "sending" ? undefined : onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl transition-all border flex flex-col max-h-[90vh] ${
          isDark
            ? "bg-[#18181b] border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        } animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-xl border ${
                isDark
                  ? "bg-white/10 border-white/10 text-white"
                  : "bg-black/5 border-black/10 text-black"
              }`}
            >
              <UsickStarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">Bagikan ke Pesan</h2>
              <p className={`text-[11px] ${muted}`}>Kirim jawaban AI ini langsung ke percakapan teman</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={status === "sending"}
            className={`p-1.5 rounded-full transition cursor-pointer disabled:opacity-30 ${
              isDark
                ? "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
            }`}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Not Logged In State */}
        {!userId ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${
                isDark ? "bg-white/5 border-white/10 text-zinc-300" : "bg-black/5 border-black/10 text-zinc-700"
              }`}
            >
              <MessageCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">Masuk untuk Menggunakan Pesan</p>
            <p className={`mt-1 text-xs max-w-xs ${muted}`}>
              Anda harus masuk akun terlebih dahulu untuk membagikan konten ke teman One Mind.
            </p>
            {onRequireAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequireAuth();
                }}
                className={`mt-4 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${primaryBtn}`}
              >
                Sign In
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col space-y-3.5 overflow-hidden">
            {/* Pratinjau Jawaban AI (Minimalist Monochrome One Mind Card) */}
            <div
              className={`rounded-2xl p-3 border text-xs max-h-24 overflow-y-auto select-none ${
                isDark
                  ? "bg-white/[0.04] border-white/10 text-zinc-300"
                  : "bg-black/[0.03] border-black/10 text-zinc-700"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                <UsickStarIcon className="w-2.5 h-2.5" />
                <span>Shared from AI Chat</span>
              </div>
              <p className="line-clamp-3 leading-relaxed whitespace-pre-wrap text-[11.5px] opacity-90">{content}</p>
            </div>

            {/* Friend Picker */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold ${muted}`}>Pilih Penerima</p>
                {friends.length > 0 && (
                  <span className={`text-[10px] font-medium ${muted}`}>{friends.length} teman</span>
                )}
              </div>

              {loading ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2">
                  <div
                    className={`w-5 h-5 border-2 rounded-full animate-spin ${
                      isDark ? "border-white/20 border-t-white" : "border-black/20 border-t-black"
                    }`}
                  />
                  <p className={`text-[11px] ${muted}`}>Memuat daftar teman...</p>
                </div>
              ) : friends.length === 0 ? (
                <div
                  className={`py-6 text-center flex flex-col items-center border rounded-2xl p-4 ${
                    isDark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"
                  }`}
                >
                  <Users className={`w-8 h-8 mb-2 ${muted}`} strokeWidth={1.5} />
                  <p className="text-xs font-semibold">Belum Ada Teman</p>
                  <p className={`mt-1 text-[11px] max-w-xs leading-relaxed ${muted}`}>
                    Tambahkan teman terlebih dahulu melalui menu Pesan untuk membagikan jawaban AI.
                  </p>
                  {onOpenMessages && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMessages();
                      }}
                      className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${ghostBtn}`}
                    >
                      <UserPlus size={13} /> Buka Messages
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 overscroll-contain">
                  {friends.map((f) => {
                    const isSelected = selectedFriend?.friendshipId === f.friendshipId;
                    const initials = (f.user.name || f.user.username || "?")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <button
                        key={f.friendshipId}
                        type="button"
                        onClick={() => setSelectedFriend(f)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition cursor-pointer border ${
                          isSelected
                            ? isDark
                              ? "bg-white/15 border-white/30 text-white"
                              : "bg-black/10 border-black/30 text-black"
                            : `${hoverRow} border-transparent`
                        }`}
                      >
                        {f.user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={f.user.avatarUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-semibold text-xs ${
                              isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-700"
                            }`}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{f.user.name}</p>
                          {f.user.username && (
                            <p className={`text-[11px] truncate ${muted}`}>@{f.user.username}</p>
                          )}
                        </div>
                        {isSelected && (
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              isDark ? "bg-white text-black" : "bg-black text-white"
                            }`}
                          >
                            <Check size={12} strokeWidth={2.8} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <p className="text-xs text-center text-red-400 font-medium animate-in fade-in-0">
                {errorMessage}
              </p>
            )}

            {/* Actions (Fixed button size to prevent visual jump/glitch) */}
            <div className={`pt-3 border-t flex items-center justify-end gap-2 shrink-0 ${divider}`}>
              <button
                type="button"
                onClick={onClose}
                disabled={status === "sending"}
                className={`px-4 h-10 rounded-xl text-xs font-medium cursor-pointer transition disabled:opacity-40 ${ghostBtn}`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!selectedFriend || status === "sending" || status === "success"}
                className={`min-w-[135px] h-10 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  status === "success"
                    ? isDark
                      ? "bg-zinc-800 text-white border border-white/20"
                      : "bg-zinc-200 text-black border border-black/20"
                    : primaryBtn
                }`}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 size={13} className="animate-spin shrink-0" />
                    <span>Mengirim...</span>
                  </>
                ) : status === "success" ? (
                  <>
                    <Check size={13} strokeWidth={2.5} className="shrink-0" />
                    <span>Terkirim!</span>
                  </>
                ) : (
                  <>
                    <Send size={13} className="shrink-0" />
                    <span>Kirim ke Pesan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
