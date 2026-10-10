"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Ban,
  Check,
  Clock,
  MessageCircle,
  Search,
  Send,
  UserMinus,
  UserPlus,
  Users,
  X,
  Inbox,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type PublicUser = { id: string; username: string | null; name: string; avatarUrl: string | null };
type Conversation = {
  id: string;
  peer: PublicUser;
  lastMessage: string | null;
  lastMessageFromMe: boolean;
  lastMessageAt: string | null;
  unread: number;
};
type FriendItem = { friendshipId: string; user: PublicUser; since: string };
type FriendsData = { friends: FriendItem[]; incoming: FriendItem[]; outgoing: FriendItem[]; blocked: PublicUser[] };
type ChatMessage = { id: string; body: string; createdAt: string; fromMe: boolean; pending?: boolean };
type Relation = "none" | "friends" | "outgoing" | "incoming" | "blocked";
type SearchResult = { user: PublicUser; relation: Relation; friendshipId: string | null };
type Tab = "chats" | "friends" | "requests" | "add";

interface MessagesWorkspaceProps {
  isDark: boolean;
  userId?: string | null;
  onTogglePanel?: () => void;
  onRequireAuth?: () => void;
}

const EMPTY_FRIENDS: FriendsData = { friends: [], incoming: [], outgoing: [], blocked: [] };
const MAX_LEN = 2000;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Terjadi kesalahan.");
  return data as T;
}

function formatListTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hari ini";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
function Avatar({ user, isDark, size = 40 }: { user: PublicUser; isDark: boolean; size?: number }) {
  const initials = (user.name || user.username || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-semibold text-xs ${
        isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-700"
      }`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

/* ─── Chat Input Bar (Isolated local state to prevent parent re-renders while typing) ─── */
const ChatInputBar = memo(function ChatInputBar({
  isActive,
  divider,
  inputCls,
  primaryBtn,
  muted,
  onSendMessage,
}: {
  isActive: boolean;
  divider: string;
  inputCls: string;
  primaryBtn: string;
  muted: string;
  onSendMessage: (text: string) => Promise<boolean>;
}) {
  const [localInput, setLocalInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = localInput.trim();
    if (!text) return;
    // Bersihkan input teks seketika (0ms delay) layaknya WhatsApp/iMessage
    setLocalInput("");
    textareaRef.current?.focus();
    void onSendMessage(text).then((ok) => {
      if (!ok) {
        // Kembalikan teks jika gagal terkirim
        setLocalInput(text);
      }
    });
  };

  if (!isActive) {
    return (
      <div className={`border-t px-3 sm:px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${divider}`}>
        <p className={`text-center text-xs py-2 ${muted}`}>Anda tidak lagi berteman dengan pengguna ini.</p>
      </div>
    );
  }

  return (
    <div className={`border-t px-3 sm:px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${divider}`}>
      <form onSubmit={handleSend} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Tulis pesan..."
          className={`flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none transition max-h-32 ${inputCls}`}
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          type="submit"
          disabled={!localInput.trim()}
          className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${primaryBtn}`}
          aria-label="Kirim"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
});

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function MessagesWorkspace({ isDark, userId, onTogglePanel, onRequireAuth }: MessagesWorkspaceProps) {
  const { session } = useSession();

  const [tab, setTab] = useState<Tab>("chats");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friendsData, setFriendsData] = useState<FriendsData>(EMPTY_FRIENDS);
  const [listLoading, setListLoading] = useState(true);

  const [active, setActive] = useState<{ id: string; peer: PublicUser } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null | undefined>(undefined);

  const [toast, setToast] = useState<{ text: string; kind: "error" | "info" } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const activeRef = useRef<typeof active>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const showToast = useCallback((text: string, kind: "error" | "info" = "error") => {
    setToast({ text, kind });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  /* ─── Loaders ─────────────────────────────────────────────────────────── */
  const loadConversations = useCallback(async () => {
    try {
      const data = await api<{ conversations: Conversation[] }>("/api/messages/conversations");
      setConversations(data.conversations);
    } catch {
      /* diam: polling berikutnya akan mencoba lagi */
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const data = await api<FriendsData>("/api/messages/friends");
      setFriendsData(data);
    } catch {
      /* diam */
    }
  }, []);

  const markRead = useCallback(async (conversationId: string) => {
    try {
      await api("/api/messages/read", { method: "POST", body: JSON.stringify({ conversationId }) });
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)));
      try {
        const convChannel = supabase.channel(`conv_${conversationId}`);
        void convChannel.send({
          type: "broadcast",
          event: "read_receipt",
          payload: {},
        });
      } catch {}
    } catch {
      /* diam */
    }
  }, []);

  const pollNewMessages = useCallback(async () => {
    const current = activeRef.current;
    if (!current) return;
    const confirmed = messagesRef.current.filter((m) => !m.pending);
    const last = confirmed[confirmed.length - 1];
    const qs = new URLSearchParams({ conversationId: current.id });
    if (last) qs.set("after", last.createdAt);
    try {
      const data = await api<{ messages: ChatMessage[]; peerLastReadAt: string | null }>(`/api/messages/messages?${qs}`);
      if (activeRef.current?.id !== current.id) return;
      setPeerLastReadAt(data.peerLastReadAt);
      if (data.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const fresh = data.messages.filter((m) => !ids.has(m.id));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
        if (data.messages.some((m) => !m.fromMe) && document.visibilityState === "visible") {
          void markRead(current.id);
        }
      }
    } catch {
      /* diam */
    }
  }, [markRead]);

  /* ─── Realtime Inbox & Periodic Polling ────────────────────────────────── */
  useEffect(() => {
    if (!userId) return;
    const kick = window.setTimeout(() => {
      void loadConversations();
      void loadFriends();
    }, 0);

    // 1. Supabase Broadcast inbox listener (instant ping when anyone sends message/request)
    const inboxChannel = supabase
      .channel(`inbox_${userId}`)
      .on("broadcast", { event: "inbox_ping" }, () => {
        void loadConversations();
        void loadFriends();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "msg_conversations" },
        () => {
          void loadConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "msg_friendships" },
        () => {
          void loadFriends();
        }
      )
      .subscribe();

    // 2. Fallback polling for conversations & friends
    const listTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadConversations();
        void loadFriends();
      }
    }, 5000);

    const onFocus = () => {
      void loadConversations();
      void loadFriends();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearTimeout(kick);
      window.clearInterval(listTimer);
      void supabase.removeChannel(inboxChannel);
    };
  }, [userId, loadConversations, loadFriends]);

  /* ─── Active Chat Realtime (postgres_changes + Broadcast + Polling) ─── */
  useEffect(() => {
    if (!active) return;

    // 1. Supabase Realtime Channel: menangkap INSERT database & broadcast
    const convChannel = supabase
      .channel(`chat_realtime_${active.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "msg_messages",
          filter: `conversation_id=eq.${active.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; sender_id: string; body: string; created_at: string };
          if (!row || !row.id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const withoutPending = prev.filter((m) => !(m.pending && m.fromMe && m.body === row.body));
            return [
              ...withoutPending,
              {
                id: row.id,
                body: row.body,
                createdAt: row.created_at,
                fromMe: row.sender_id === userId,
              },
            ];
          });
          if (row.sender_id !== userId && document.visibilityState === "visible") {
            void markRead(active.id);
          }
        }
      )
      .on("broadcast", { event: "new_msg" }, (payload) => {
        const msg = payload.payload?.message as ChatMessage | undefined;
        if (msg && msg.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, fromMe: false }];
          });
          if (document.visibilityState === "visible") {
            void markRead(active.id);
          }
        }
      })
      .on("broadcast", { event: "read_receipt" }, () => {
        setPeerLastReadAt(new Date().toISOString());
      })
      .subscribe();

    // 2. Polling Cepat (1.2 detik) saat di dalam ruang chat aktif sebagai jaminan
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void pollNewMessages();
    }, 1200);

    const onFocus = () => {
      void pollNewMessages();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
      void supabase.removeChannel(convChannel);
    };
  }, [active, userId, pollNewMessages, markRead]);

  /* ─── Open conversation ───────────────────────────────────────────────── */
  const openConversation = useCallback(
    async (conv: { id: string; peer: PublicUser }) => {
      setActive(conv);
      setMenuOpen(false);
      setMessages([]);
      setHasMore(false);
      setPeerLastReadAt(null);
      setChatLoading(true);
      stickToBottomRef.current = true;
      try {
        const data = await api<{ messages: ChatMessage[]; hasMore: boolean; peerLastReadAt: string | null }>(
          `/api/messages/messages?conversationId=${conv.id}`
        );
        if (activeRef.current?.id !== conv.id) return;
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setPeerLastReadAt(data.peerLastReadAt);
        void markRead(conv.id);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Gagal memuat percakapan.");
      } finally {
        setChatLoading(false);
      }
    },
    [markRead, showToast]
  );

  const openChatWithUser = useCallback(
    async (user: PublicUser) => {
      setBusyId(user.id);
      try {
        const data = await api<{ id: string; peer: PublicUser | null }>("/api/messages/conversations", {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
        });
        setTab("chats");
        await openConversation({ id: data.id, peer: data.peer ?? user });
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Gagal membuka chat.");
      } finally {
        setBusyId(null);
      }
    },
    [openConversation, showToast]
  );

  const loadOlder = async () => {
    if (!active || messages.length === 0) return;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const data = await api<{ messages: ChatMessage[]; hasMore: boolean }>(
        `/api/messages/messages?conversationId=${active.id}&before=${encodeURIComponent(messages[0].createdAt)}`
      );
      stickToBottomRef.current = false;
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memuat pesan lama.");
    }
  };

  /* ─── Auto scroll ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  /* ─── Send (Callback for isolated input component) ───────────────────── */
  const handleSendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!active || !text) return false;
      if (text.length > MAX_LEN) {
        showToast(`Pesan maksimal ${MAX_LEN} karakter.`);
        return false;
      }
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = { id: tempId, body: text, createdAt: new Date().toISOString(), fromMe: true, pending: true };
      stickToBottomRef.current = true;
      setMessages((prev) => [...prev, optimistic]);
      try {
        const data = await api<{ message: ChatMessage }>("/api/messages/messages", {
          method: "POST",
          body: JSON.stringify({ conversationId: active.id, body: text }),
        });
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== tempId && m.id !== data.message.id);
          return [...without, data.message];
        });
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === active.id);
          const updated: Conversation = {
            id: active.id,
            peer: active.peer,
            lastMessage: text.slice(0, 140),
            lastMessageFromMe: true,
            lastMessageAt: data.message.createdAt,
            unread: existing?.unread ?? 0,
          };
          return [updated, ...prev.filter((c) => c.id !== active.id)];
        });

        // ─── INSTANT REALTIME BROADCAST VIA WEBSOCKET (< 50ms) ───────────
        try {
          const convChannel = supabase.channel(`conv_${active.id}`);
          void convChannel.send({
            type: "broadcast",
            event: "new_msg",
            payload: { message: data.message },
          });

          const peerInbox = supabase.channel(`inbox_${active.peer.id}`);
          void peerInbox.send({
            type: "broadcast",
            event: "inbox_ping",
            payload: {},
          });
        } catch {
          // ignore
        }

        return true;
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        showToast(e instanceof Error ? e.message : "Pesan gagal dikirim.");
        return false;
      }
    },
    [active, showToast]
  );

  /* ─── Friend actions ──────────────────────────────────────────────────── */
  const friendAction = async (payload: Record<string, unknown>, key: string, okText?: string) => {
    setBusyId(key);
    try {
      await api("/api/messages/friends", { method: "POST", body: JSON.stringify(payload) });
      if (okText) showToast(okText, "info");
      await Promise.all([loadFriends(), loadConversations()]);
      return true;
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Aksi gagal.");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const blockAction = async (target: PublicUser, action: "block" | "unblock") => {
    if (action === "block" && !window.confirm(`Blokir ${target.name}? Pertemanan akan dihapus dan ia tidak dapat mengirim pesan.`)) return;
    setBusyId(target.id);
    try {
      await api("/api/messages/blocks", { method: "POST", body: JSON.stringify({ action, userId: target.id }) });
      showToast(action === "block" ? "Pengguna diblokir." : "Blokir dibuka.", "info");
      if (action === "block" && activeRef.current?.peer.id === target.id) setActive(null);
      setMenuOpen(false);
      await Promise.all([loadFriends(), loadConversations()]);
      if (searchResult?.user.id === target.id) {
        setSearchResult({ ...searchResult, relation: action === "block" ? "blocked" : "none", friendshipId: null });
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Aksi gagal.");
    } finally {
      setBusyId(null);
    }
  };

  const removeFriend = async (target: PublicUser) => {
    if (!window.confirm(`Hapus ${target.name} dari daftar teman?`)) return;
    const ok = await friendAction({ action: "remove", userId: target.id }, target.id, "Teman dihapus.");
    if (ok && activeRef.current?.peer.id === target.id) setActive(null);
    setMenuOpen(false);
  };

  /* ─── Search ──────────────────────────────────────────────────────────── */
  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (q.replace(/^@/, "").length < 3) {
      showToast("Masukkan username atau email lengkap (min. 3 karakter).");
      return;
    }
    setSearching(true);
    try {
      const data = await api<{ results: SearchResult[] }>(`/api/messages/search?q=${encodeURIComponent(q)}`);
      setSearchResult(data.results[0] ?? null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Pencarian gagal.");
    } finally {
      setSearching(false);
    }
  };

  const sendRequestFromSearch = async () => {
    if (!searchResult) return;
    const ok = await friendAction({ action: "request", userId: searchResult.user.id }, searchResult.user.id, "Permintaan pertemanan dikirim.");
    if (ok) setSearchResult({ ...searchResult, relation: "outgoing" });
  };

  /* ─── Derived ─────────────────────────────────────────────────────────── */
  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + c.unread, 0), [conversations]);
  const requestCount = friendsData.incoming.length;
  const isActivePeerFriend = useMemo(
    () => !!active && friendsData.friends.some((f) => f.user.id === active.peer.id),
    [active, friendsData.friends]
  );
  const lastMineReadIndex = useMemo(() => {
    if (!peerLastReadAt) return -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.fromMe && !m.pending && m.createdAt <= peerLastReadAt) return i;
    }
    return -1;
  }, [messages, peerLastReadAt]);

  /* ─── Style tokens (selaras tema One Mind, hemat performa GPU) ──────── */
  const panel = isDark
    ? "bg-[#111113]/90 border border-white/10"
    : "bg-white/95 border border-black/10 shadow-sm";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const divider = isDark ? "border-white/10" : "border-black/10";
  const hoverRow = isDark ? "hover:bg-zinc-800/60" : "hover:bg-zinc-100/90";
  const activeRow = isDark ? "bg-zinc-800/90" : "bg-zinc-100";
  const primaryBtn = isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800";
  const ghostBtn = isDark
    ? "border border-white/10 text-zinc-200 hover:bg-zinc-800/70"
    : "border border-black/10 text-zinc-700 hover:bg-zinc-100";
  const inputCls = isDark
    ? "bg-zinc-900/70 border border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30"
    : "bg-white border border-black/10 text-black placeholder:text-zinc-400 focus:border-black/30";

  /* ─── Header (hamburger, serasi workspace lain) ───────────────────────── */
  const header = (
    <header
      className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3.5 sm:px-6 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] bg-transparent pointer-events-none ${
        isDark ? "text-white" : "text-zinc-900"
      }`}
    >
      <div className="flex items-center gap-2 pointer-events-auto">
        {onTogglePanel && (
          <button
            onClick={onTogglePanel}
            className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
            }`}
            title="Menu Panel"
            aria-label="Menu Panel"
          >
            <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );

  /* ─── Guest state ─────────────────────────────────────────────────────── */
  if (!userId) {
    return (
      <div className={`relative flex flex-col h-full w-full overflow-hidden bg-transparent ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
        {header}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-white" : "text-black"}`} strokeWidth={1.6} />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Messages</h1>
            <p className={`mt-2 text-sm ${muted}`}>Masuk untuk mengobrol secara pribadi dengan teman One Mind Anda.</p>
            {onRequireAuth && (
              <button onClick={onRequireAuth} className={`mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${primaryBtn}`}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Sub-views ───────────────────────────────────────────────────────── */
  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "chats", label: "Chats", icon: <MessageCircle size={15} />, badge: totalUnread },
    { id: "friends", label: "Friends", icon: <Users size={15} /> },
    { id: "requests", label: "Requests", icon: <Inbox size={15} />, badge: requestCount },
    { id: "add", label: "Add", icon: <UserPlus size={15} /> },
  ];

  const emptyState = (icon: React.ReactNode, title: string, desc: string, action?: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <div className={`mb-3 ${muted}`}>{icon}</div>
      <p className="text-sm font-semibold">{title}</p>
      <p className={`mt-1 text-xs leading-relaxed max-w-[240px] ${muted}`}>{desc}</p>
      {action}
    </div>
  );

  const userLine = (u: PublicUser) => (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold truncate">{u.name}</p>
      {u.username && <p className={`text-xs truncate ${muted}`}>@{u.username}</p>}
    </div>
  );

  const chatsView = listLoading ? (
    <div className="p-3 space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`h-14 rounded-xl animate-pulse ${isDark ? "bg-zinc-800/50" : "bg-zinc-200/70"}`} />
      ))}
    </div>
  ) : conversations.length === 0 ? (
    emptyState(
      <MessageCircle size={28} strokeWidth={1.6} />,
      "Belum ada percakapan",
      "Mulai chat dari daftar teman, atau tambahkan teman baru lewat username.",
      <button onClick={() => setTab(friendsData.friends.length ? "friends" : "add")} className={`mt-4 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${primaryBtn}`}>
        {friendsData.friends.length ? "Lihat Teman" : "Tambah Teman"}
      </button>
    )
  ) : (
    <ul className="p-2 space-y-0.5">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => openConversation({ id: c.id, peer: c.peer })}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${
              active?.id === c.id ? activeRow : hoverRow
            }`}
          >
            <Avatar user={c.peer} isDark={isDark} size={42} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className={`text-sm truncate ${c.unread ? "font-bold" : "font-semibold"}`}>{c.peer.name}</p>
                <span className={`text-[11px] shrink-0 ${c.unread ? (isDark ? "text-white font-semibold" : "text-black font-semibold") : muted}`}>
                  {formatListTime(c.lastMessageAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={`text-xs truncate ${c.unread ? (isDark ? "text-zinc-200" : "text-zinc-800") : muted}`}>
                  {c.lastMessageFromMe ? "Anda: " : ""}
                  {c.lastMessage}
                </p>
                {c.unread > 0 && (
                  <span className={`min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${primaryBtn}`}>
                    {c.unread > 99 ? "99+" : c.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );

  const friendsView =
    friendsData.friends.length === 0 && friendsData.blocked.length === 0 ? (
      emptyState(
        <Users size={28} strokeWidth={1.6} />,
        "Belum ada teman",
        "Cari pengguna lain dengan username atau email untuk mengirim permintaan pertemanan.",
        <button onClick={() => setTab("add")} className={`mt-4 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${primaryBtn}`}>
          Tambah Teman
        </button>
      )
    ) : (
      <div className="p-2">
        <ul className="space-y-0.5">
          {friendsData.friends.map((f) => (
            <li key={f.friendshipId} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${hoverRow}`}>
              <Avatar user={f.user} isDark={isDark} />
              {userLine(f.user)}
              <button
                onClick={() => openChatWithUser(f.user)}
                disabled={busyId === f.user.id}
                className={`p-2 rounded-lg transition cursor-pointer disabled:opacity-50 ${ghostBtn}`}
                title="Chat"
                aria-label={`Chat dengan ${f.user.name}`}
              >
                <MessageCircle size={15} />
              </button>
              <button
                onClick={() => removeFriend(f.user)}
                disabled={busyId === f.user.id}
                className={`p-2 rounded-lg transition cursor-pointer disabled:opacity-50 ${ghostBtn}`}
                title="Hapus teman"
                aria-label={`Hapus ${f.user.name}`}
              >
                <UserMinus size={15} />
              </button>
            </li>
          ))}
        </ul>
        {friendsData.blocked.length > 0 && (
          <div className={`mt-4 pt-3 border-t ${divider}`}>
            <p className={`px-3 pb-2 text-[11px] uppercase tracking-wider font-semibold ${muted}`}>Diblokir</p>
            <ul className="space-y-0.5">
              {friendsData.blocked.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                  <Avatar user={u} isDark={isDark} size={34} />
                  {userLine(u)}
                  <button
                    onClick={() => blockAction(u, "unblock")}
                    disabled={busyId === u.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50 ${ghostBtn}`}
                  >
                    Buka blokir
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

  const requestsView =
    friendsData.incoming.length === 0 && friendsData.outgoing.length === 0 ? (
      emptyState(<Inbox size={28} strokeWidth={1.6} />, "Tidak ada permintaan", "Permintaan pertemanan masuk dan keluar akan tampil di sini.")
    ) : (
      <div className="p-2 space-y-4">
        {friendsData.incoming.length > 0 && (
          <div>
            <p className={`px-3 pb-2 pt-1 text-[11px] uppercase tracking-wider font-semibold ${muted}`}>Masuk</p>
            <ul className="space-y-0.5">
              {friendsData.incoming.map((r) => (
                <li key={r.friendshipId} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${hoverRow}`}>
                  <Avatar user={r.user} isDark={isDark} />
                  {userLine(r.user)}
                  <button
                    onClick={() => friendAction({ action: "accept", friendshipId: r.friendshipId }, r.friendshipId, `Anda sekarang berteman dengan ${r.user.name}.`)}
                    disabled={busyId === r.friendshipId}
                    className={`p-2 rounded-lg transition cursor-pointer disabled:opacity-50 ${primaryBtn}`}
                    title="Terima"
                    aria-label="Terima"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => friendAction({ action: "decline", friendshipId: r.friendshipId }, r.friendshipId)}
                    disabled={busyId === r.friendshipId}
                    className={`p-2 rounded-lg transition cursor-pointer disabled:opacity-50 ${ghostBtn}`}
                    title="Tolak"
                    aria-label="Tolak"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {friendsData.outgoing.length > 0 && (
          <div>
            <p className={`px-3 pb-2 pt-1 text-[11px] uppercase tracking-wider font-semibold ${muted}`}>Terkirim</p>
            <ul className="space-y-0.5">
              {friendsData.outgoing.map((r) => (
                <li key={r.friendshipId} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                  <Avatar user={r.user} isDark={isDark} />
                  {userLine(r.user)}
                  <span className={`hidden sm:flex items-center gap-1 text-[11px] ${muted}`}>
                    <Clock size={12} /> Menunggu
                  </span>
                  <button
                    onClick={() => friendAction({ action: "cancel", friendshipId: r.friendshipId }, r.friendshipId)}
                    disabled={busyId === r.friendshipId}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50 ${ghostBtn}`}
                  >
                    Batalkan
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

  const relationAction = (r: SearchResult) => {
    const base = "px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5";
    switch (r.relation) {
      case "friends":
        return (
          <button onClick={() => openChatWithUser(r.user)} disabled={busyId === r.user.id} className={`${base} ${primaryBtn}`}>
            <MessageCircle size={14} /> Chat
          </button>
        );
      case "outgoing":
        return (
          <span className={`${base} cursor-default ${ghostBtn}`}>
            <Clock size={14} /> Terkirim
          </span>
        );
      case "incoming":
        return r.friendshipId ? (
          <button
            onClick={async () => {
              const ok = await friendAction({ action: "accept", friendshipId: r.friendshipId }, r.user.id, `Anda sekarang berteman dengan ${r.user.name}.`);
              if (ok) setSearchResult({ ...r, relation: "friends" });
            }}
            disabled={busyId === r.user.id}
            className={`${base} ${primaryBtn}`}
          >
            <Check size={14} /> Terima
          </button>
        ) : null;
      case "blocked":
        return (
          <button onClick={() => blockAction(r.user, "unblock")} disabled={busyId === r.user.id} className={`${base} ${ghostBtn}`}>
            Buka blokir
          </button>
        );
      default:
        return (
          <button onClick={sendRequestFromSearch} disabled={busyId === r.user.id} className={`${base} ${primaryBtn}`}>
            <UserPlus size={14} /> Tambah
          </button>
        );
    }
  };

  const addView = (
    <div className="p-4">
      <form onSubmit={runSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchResult(undefined);
            }}
            placeholder="Username atau email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={254}
            className={`w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition ${inputCls}`}
          />
        </div>
        <button type="submit" disabled={searching} className={`px-4 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 ${primaryBtn}`}>
          {searching ? "..." : "Cari"}
        </button>
      </form>
      <p className={`mt-2 text-[11px] leading-relaxed ${muted}`}>
        Masukkan username atau email secara lengkap. Email tidak akan ditampilkan ke pengguna lain.
      </p>

      <div className="mt-5">
        {searchResult === null && emptyState(<Search size={26} strokeWidth={1.6} />, "Pengguna tidak ditemukan", "Periksa kembali ejaan username atau email.")}
        {searchResult && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${isDark ? "bg-zinc-900/60 border border-white/10" : "bg-white border border-black/10"}`}>
            <Avatar user={searchResult.user} isDark={isDark} size={48} />
            {userLine(searchResult.user)}
            {relationAction(searchResult)}
          </div>
        )}
        {searchResult && searchResult.relation !== "blocked" && (
          <button
            onClick={() => blockAction(searchResult.user, "block")}
            className={`mt-3 mx-auto flex items-center gap-1.5 text-[11px] cursor-pointer transition ${muted} hover:text-red-400`}
          >
            <Ban size={12} /> Blokir pengguna ini
          </button>
        )}
      </div>
    </div>
  );

  /* ─── Chat pane ───────────────────────────────────────────────────────── */
  const chatPane = active ? (
    <div className="flex flex-col h-full min-h-0">
      <div className={`flex items-center gap-3 px-3 sm:px-4 py-3 max-md:pt-[max(0.75rem,env(safe-area-inset-top))] border-b ${divider}`}>
        <button
          onClick={() => setActive(null)}
          className={`md:hidden p-2 -ml-1 rounded-lg cursor-pointer transition ${hoverRow}`}
          aria-label="Kembali"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar user={active.peer} isDark={isDark} size={38} />
        {userLine(active.peer)}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`p-2 rounded-lg cursor-pointer transition ${hoverRow}`}
            aria-label="Opsi percakapan"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div
              className={`absolute right-0 top-full mt-1 z-30 w-44 rounded-xl p-1 shadow-xl ${
                isDark ? "bg-zinc-900 border border-white/10 shadow-black/60" : "bg-white border border-black/10 shadow-zinc-900/10"
              }`}
            >
              {isActivePeerFriend && (
                <button onClick={() => removeFriend(active.peer)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer ${hoverRow}`}>
                  <UserMinus size={14} /> Hapus teman
                </button>
              )}
              <button
                onClick={() => blockAction(active.peer, "block")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 cursor-pointer ${hoverRow}`}
              >
                <Ban size={14} /> Blokir
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4">
        {chatLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? "border-white/20 border-t-white" : "border-black/20 border-t-black"}`} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Avatar user={active.peer} isDark={isDark} size={56} />
            <p className="mt-3 text-sm font-semibold">{active.peer.name}</p>
            <p className={`mt-1 text-xs ${muted}`}>Kirim pesan pertama untuk memulai percakapan.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {hasMore && (
              <div className="flex justify-center pb-3">
                <button onClick={loadOlder} className={`px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition ${ghostBtn}`}>
                  Muat pesan sebelumnya
                </button>
              </div>
            )}
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const showDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              const grouped = prev && prev.fromMe === m.fromMe && !showDay;
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="flex justify-center my-3">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${isDark ? "bg-zinc-900/80 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}>
                        {formatDayLabel(m.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${m.fromMe ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-2.5"}`}>
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        m.fromMe
                          ? isDark
                            ? "bg-white text-black rounded-br-md"
                            : "bg-black text-white rounded-br-md"
                          : isDark
                            ? "bg-zinc-800/90 text-zinc-100 rounded-bl-md"
                            : "bg-zinc-100 text-zinc-900 rounded-bl-md"
                      } ${m.pending ? "opacity-60" : ""}`}
                    >
                      {m.body}
                      <span
                        className={`ml-2 inline-flex items-center gap-1 align-bottom text-[10px] translate-y-0.5 ${
                          m.fromMe ? (isDark ? "text-zinc-500" : "text-zinc-400") : muted
                        }`}
                      >
                        {m.pending ? <Clock size={10} /> : formatBubbleTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                  {i === lastMineReadIndex && i === messages.length - 1 && (
                    <p className={`text-right text-[10px] mt-0.5 pr-1 ${muted}`}>Dibaca</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ChatInputBar
        isActive={isActivePeerFriend || friendsData.friends.length === 0}
        divider={divider}
        inputCls={inputCls}
        primaryBtn={primaryBtn}
        muted={muted}
        onSendMessage={handleSendMessage}
      />
    </div>
  ) : (
    <div className="h-full hidden md:flex flex-col items-center justify-center text-center px-6">
      <MessageCircle className={`w-12 h-12 mb-4 ${isDark ? "text-white" : "text-black"}`} strokeWidth={1.6} />
      <h2 className="text-xl font-extrabold tracking-tight">Messages</h2>
      <p className={`mt-1.5 text-sm max-w-xs ${muted}`}>Pilih percakapan atau mulai chat baru dengan teman Anda.</p>
    </div>
  );

  /* ─── Layout ──────────────────────────────────────────────────────────── */
  return (
    <div className={`relative flex flex-col h-full w-full overflow-hidden bg-transparent ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
      <div className={active ? "hidden md:block" : undefined}>{header}</div>

      <div className={`flex-1 min-h-0 flex gap-3 px-0 md:px-4 lg:px-6 pb-0 md:pb-4 ${active ? "pt-0 md:pt-[4.25rem]" : "pt-[4.25rem]"}`}>
        {/* Sidebar list */}
        <section className={`${active ? "hidden md:flex" : "flex"} flex-col w-full md:w-[340px] lg:w-[360px] shrink-0 min-h-0 md:rounded-2xl overflow-hidden ${panel} max-md:border-x-0 max-md:border-b-0`}>
          <div className="px-4 pt-4 pb-3">
            <h1 className="text-lg font-extrabold tracking-tight">Messages</h1>
            <div className={`mt-3 grid grid-cols-4 gap-1 p-1 rounded-xl ${isDark ? "bg-zinc-900/70" : "bg-zinc-100"}`}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    tab === t.id
                      ? isDark
                        ? "bg-zinc-700/80 text-white font-semibold shadow-sm"
                        : "bg-white text-black font-semibold shadow-sm"
                      : isDark
                        ? "text-zinc-400 hover:text-zinc-200"
                        : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <span className="hidden sm:inline-flex">{t.icon}</span>
                  {t.label}
                  {!!t.badge && (
                    <span className={`absolute -top-1 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${primaryBtn}`}>
                      {t.badge > 99 ? "99+" : t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex-1 min-h-0 overflow-y-auto border-t ${divider}`}>
            {tab === "chats" && chatsView}
            {tab === "friends" && friendsView}
            {tab === "requests" && requestsView}
            {tab === "add" && addView}
          </div>
        </section>

        {/* Chat pane */}
        <section className={`${active ? "flex" : "hidden md:flex"} flex-col flex-1 min-w-0 min-h-0 md:rounded-2xl overflow-hidden ${panel} max-md:border-0`}>
          {chatPane}
        </section>
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-24 md:bottom-8 inset-x-0 flex justify-center z-40 px-4">
          <div
            role="status"
            className={`pointer-events-auto px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg animate-in fade-in-0 duration-200 ${
              toast.kind === "error"
                ? "bg-red-500/15 border border-red-500/30 text-red-400 backdrop-blur-md"
                : isDark
                  ? "bg-zinc-900/90 border border-white/10 text-zinc-100 backdrop-blur-md"
                  : "bg-white/95 border border-black/10 text-zinc-900 backdrop-blur-md"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}
