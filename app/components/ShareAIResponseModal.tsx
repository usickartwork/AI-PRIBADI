"use client";

import { useEffect, useState } from "react";
import { Check, MessageCircle, Send, Sparkles, UserPlus, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PublicUser = { id: string; username: string | null; name: string; avatarUrl: string | null };
type FriendItem = { friendshipId: string; user: PublicUser; since: string };
type FriendsData = { friends: FriendItem[]; incoming: FriendItem[]; outgoing: FriendItem[]; blocked: PublicUser[] };

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
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFriend(null);
      setFeedback(null);
      return;
    }

    if (!userId) {
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch("/api/messages/friends", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: FriendsData) => {
        if (isMounted) {
          setFriends(data.friends || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeedback({ text: "Gagal memuat daftar teman.", error: true });
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
  const primaryBtn = isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800";
  const ghostBtn = isDark
    ? "border border-white/10 text-zinc-200 hover:bg-white/5"
    : "border border-black/10 text-zinc-700 hover:bg-black/5";

  const handleSend = async () => {
    if (!selectedFriend || !content.trim()) return;
    setSending(true);
    setFeedback(null);

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
        // Abaikan kegagalan broadcast
      }

      setFeedback({ text: `Berhasil dikirim ke ${selectedFriend.user.name}!` });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Gagal membagikan jawaban AI.",
        error: true,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border flex flex-col max-h-[90vh] ${
          isDark
            ? "bg-zinc-900 border-white/10 text-white"
            : "bg-white border-black/10 text-zinc-900"
        } animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${divider}`}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Bagikan ke Pesan</h2>
              <p className={`text-[11px] ${muted}`}>Kirim jawaban AI ini langsung ke percakapan teman</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 cursor-pointer opacity-70 hover:opacity-100"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Not logged in */}
        {!userId ? (
          <div className="py-8 text-center flex flex-col items-center">
            <MessageCircle className={`w-10 h-10 mb-3 ${muted}`} />
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
                className={`mt-4 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${primaryBtn}`}
              >
                Sign In
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col mt-3.5 space-y-3.5 overflow-hidden">
            {/* Pratinjau Jawaban AI yang dibagikan */}
            <div
              className={`rounded-xl p-3 border text-xs max-h-28 overflow-y-auto ${
                isDark ? "bg-white/5 border-white/10 text-zinc-300" : "bg-black/5 border-black/10 text-zinc-700"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                <Sparkles size={11} />
                <span>Shared from AI Chat</span>
              </div>
              <p className="line-clamp-4 leading-relaxed whitespace-pre-wrap">{content}</p>
            </div>

            {/* Pemilihan Penerima (Friends Picker) */}
            <div className="flex-1 min-h-0 flex flex-col">
              <p className={`text-xs font-semibold mb-2 ${muted}`}>Pilih Teman:</p>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <div
                    className={`w-5 h-5 border-2 rounded-full animate-spin ${
                      isDark ? "border-white/20 border-t-white" : "border-black/20 border-t-black"
                    }`}
                  />
                </div>
              ) : friends.length === 0 ? (
                <div className="py-6 text-center flex flex-col items-center border rounded-xl border-dashed border-current/20 p-4">
                  <Users className={`w-8 h-8 mb-2 ${muted}`} />
                  <p className="text-xs font-semibold">Belum Ada Teman</p>
                  <p className={`mt-1 text-[11px] max-w-xs ${muted}`}>
                    Anda belum memiliki teman di Messages. Tambahkan teman terlebih dahulu melalui tab Messages.
                  </p>
                  {onOpenMessages && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMessages();
                      }}
                      className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${ghostBtn}`}
                    >
                      <UserPlus size={13} /> Buka Messages
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
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
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition cursor-pointer border ${
                          isSelected
                            ? isDark
                              ? "bg-white/15 border-white/30"
                              : "bg-black/10 border-black/30"
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
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Feedback message */}
            {feedback && (
              <p
                className={`text-xs text-center font-medium animate-in fade-in-0 ${
                  feedback.error ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {feedback.text}
              </p>
            )}

            {/* Actions */}
            <div className={`pt-3 border-t flex items-center justify-end gap-2 shrink-0 ${divider}`}>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition ${ghostBtn}`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!selectedFriend || sending}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${primaryBtn}`}
              >
                <Send size={13} />
                {sending ? "Mengirim..." : "Kirim ke Pesan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

