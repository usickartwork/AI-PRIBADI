"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { User } from "@supabase/supabase-js";
import {
  ScheduleItem,
  ScheduleRecurrence,
  ScheduleStatus,
  ParsedScheduleAI,
  formatScheduleDate,
  formatScheduleTime,
  formatDuration,
  formatReminderText,
  formatRecurrence,
  getTodayDateString,
  groupSchedules,
  getLocalSchedules,
  saveLocalSchedules,
} from "@/lib/schedules";

type ScheduleWorkspaceProps = {
  isDark: boolean;
  onClose: () => void;
  user: User | null;
  setShowAuthModal?: (show: boolean) => void;
};

type ScheduleChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pendingSchedule?: ParsedScheduleAI;
  isConfirmed?: boolean;
  confirmedSchedule?: ScheduleItem;
  timestamp: string;
};

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Good Morning";
  if (hour >= 11 && hour < 15) return "Good Afternoon";
  if (hour >= 15 && hour < 19) return "Good Evening";
  return "Good Night";
}

export function ScheduleWorkspace({
  isDark,
  onClose,
  user,
  setShowAuthModal,
}: ScheduleWorkspaceProps) {
  // Mode Tampilan: "chat" (Chat Asisten AI) atau "list" (Daftar Agenda)
  const [currentTab, setCurrentTab] = useState<"chat" | "list">("chat");

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "today" | "upcoming" | "completed" | "cancelled">("all");

  // Chat Interface States
  const [chatMessages, setChatMessages] = useState<ScheduleChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Manual Modal State (Create & Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formTime, setFormTime] = useState("09:00");
  const [formDuration, setFormDuration] = useState(60);
  const [formReminder, setFormReminder] = useState(15);
  const [formRecurrence, setFormRecurrence] = useState<ScheduleRecurrence>("once");

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const userId = user?.id || "guest";
  const userEmail = user?.email || "";

  // Auto-scroll chat ke pesan paling bawah
  useEffect(() => {
    if (currentTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isProcessing, currentTab]);

  // Auto resize textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Background periodic check untuk memproses pengingat yang jatuh tempo
  useEffect(() => {
    fetch("/api/schedules/remind").catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/schedules/remind").catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Fetch Schedules ────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        if (user?.id) {
          const res = await fetch(`/api/schedules?userId=${user.id}`);
          const json = await res.json();
          if (isMounted) {
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              setSchedules(json.data);
              saveLocalSchedules(user.id, json.data);
            } else {
              const cached = getLocalSchedules(user.id);
              setSchedules(cached);
            }
          }
        } else {
          const guestItems = getLocalSchedules("guest");
          if (isMounted) {
            setSchedules(guestItems);
          }
        }
      } catch (err) {
        console.error("Gagal memuat schedule:", err);
        const cached = getLocalSchedules(userId);
        if (isMounted) setSchedules(cached);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.id, userId]);

  const updateSchedulesState = (newItems: ScheduleItem[]) => {
    setSchedules(newItems);
    saveLocalSchedules(userId, newItems);
  };

  // ─── Chat AI Submission Handler ──────────────────────────────────────────────
  const handleSendChatMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text || isProcessing) return;

    setInputMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsgId = `user_${Date.now()}`;
    const newUserMsg: ScheduleChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      const now = new Date();
      const clientDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";

      const res = await fetch("/api/schedules/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          clientDate,
          timezone: tz,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menganalisis permintaan jadwal.");
      }

      const parsed: ParsedScheduleAI = json.data;
      const assistantMsgId = `assistant_${Date.now()}`;

      if (parsed.isAmbiguous && parsed.clarificationQuestion) {
        // AI meminta klarifikasi detail waktu/tanggal
        setChatMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: parsed.clarificationQuestion || "Boleh tahu mau tanggal berapa dan jam berapa agendanya?",
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        // AI berhasil mem-parse, tampilkan kartu konfirmasi inline di dalam chat
        setChatMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: "Oke, ini detail jadwalnya. Cek dulu ya, kalau sudah pas tinggal klik Konfirmasi & Jadwalkan:",
            pendingSchedule: parsed,
            isConfirmed: false,
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: `Maaf, aku belum bisa memproses input tersebut: ${err?.message || "Coba tulis ulang ya."}`,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Konfirmasi Schedule dari Kartu Chat ─────────────────────────────────────
  const handleConfirmInlineSchedule = async (messageId: string, parsed: ParsedScheduleAI) => {
    const payload = {
      user_id: userId,
      title: parsed.title,
      description: parsed.description || "",
      date: parsed.date || getTodayDateString(),
      time: parsed.time || "09:00",
      duration_minutes: parsed.duration || 60,
      reminder_minutes: parsed.reminder ?? 15,
      recurrence: parsed.recurrence || "once",
      timezone: parsed.timezone || "Asia/Jakarta",
      user_email: userEmail || undefined,
    };

    let savedItem: ScheduleItem;

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        savedItem = json.data;
      } else {
        savedItem = {
          ...payload,
          id: `sch_${Date.now()}`,
          status: "upcoming",
          reminder_status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch {
      savedItem = {
        ...payload,
        id: `sch_${Date.now()}`,
        status: "upcoming",
        reminder_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    updateSchedulesState([...schedules, savedItem]);

    // Update pesan chat menjadi terkonfirmasi
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              isConfirmed: true,
              confirmedSchedule: savedItem,
            }
          : msg
      )
    );
  };

  const handleCancelInlineSchedule = (messageId: string) => {
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: "Oke, pembuatan jadwal ini dibatalkan.",
              pendingSchedule: undefined,
            }
          : msg
      )
    );
  };

  // ─── Manual Form Modal ───────────────────────────────────────────────────────
  const openNewScheduleModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormDescription("");
    setFormDate(getTodayDateString());
    setFormTime("09:00");
    setFormDuration(60);
    setFormReminder(15);
    setFormRecurrence("once");
    setModalOpen(true);
  };

  const openEditScheduleModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormDate(item.date);
    setFormTime(item.time);
    setFormDuration(item.duration_minutes);
    setFormReminder(item.reminder_minutes);
    setFormRecurrence(item.recurrence);
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleSaveManualForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate || !formTime) return;

    if (editingItem) {
      const updatedFields = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        date: formDate,
        time: formTime,
        duration_minutes: Number(formDuration),
        reminder_minutes: Number(formReminder),
        recurrence: formRecurrence,
      };

      try {
        await fetch("/api/schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            user_id: userId,
            ...updatedFields,
          }),
        });
      } catch (err) {
        console.warn("Update error:", err);
      }

      const updatedList = schedules.map((item) =>
        item.id === editingItem.id ? { ...item, ...updatedFields, updated_at: new Date().toISOString() } : item
      );
      updateSchedulesState(updatedList);
    } else {
      const payload = {
        user_id: userId,
        title: formTitle.trim(),
        description: formDescription.trim(),
        date: formDate,
        time: formTime,
        duration_minutes: Number(formDuration),
        reminder_minutes: Number(formReminder),
        recurrence: formRecurrence,
        timezone: "Asia/Jakarta",
        user_email: userEmail || undefined,
      };

      try {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          updateSchedulesState([...schedules, json.data]);
        } else {
          const localItem: ScheduleItem = {
            ...payload,
            id: `sch_${Date.now()}`,
            status: "upcoming",
            reminder_status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          updateSchedulesState([...schedules, localItem]);
        }
      } catch {
        const localItem: ScheduleItem = {
          ...payload,
          id: `sch_${Date.now()}`,
          status: "upcoming",
          reminder_status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        updateSchedulesState([...schedules, localItem]);
      }
    }

    setModalOpen(false);
  };

  // ─── Status Actions ──────────────────────────────────────────────────────────
  const handleUpdateStatus = async (item: ScheduleItem, newStatus: ScheduleStatus) => {
    try {
      await fetch("/api/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          user_id: userId,
          status: newStatus,
        }),
      });
    } catch (err) {
      console.warn("Status update error:", err);
    }

    const updated = schedules.map((s) =>
      s.id === item.id ? { ...s, status: newStatus, updated_at: new Date().toISOString() } : s
    );
    updateSchedulesState(updated);
    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...selectedItem, status: newStatus });
    }
  };

  const handleDeleteSchedule = async (item: ScheduleItem) => {
    if (!confirm(`Hapus jadwal "${item.title}"?`)) return;

    try {
      await fetch(`/api/schedules?id=${item.id}&userId=${userId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Delete error:", err);
    }

    const updated = schedules.filter((s) => s.id !== item.id);
    updateSchedulesState(updated);
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    }
  };

  const handleTestEmailReminder = async (item: ScheduleItem) => {
    const targetEmail = userEmail || prompt("Masukkan alamat email untuk tes pengingat:");
    if (!targetEmail || !targetEmail.includes("@")) {
      alert("Harap masukkan alamat email yang valid.");
      return;
    }

    setTestingEmail(true);
    setEmailStatusMsg(null);

    try {
      const res = await fetch("/api/schedules/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_email",
          testEmail: targetEmail,
          targetSchedule: item,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengirim email tes.");
      }

      setEmailStatusMsg({
        type: "success",
        text: `Email tes berhasil dikirim ke ${targetEmail}. Silakan periksa inbox Anda!`,
      });
    } catch (err: any) {
      setEmailStatusMsg({
        type: "error",
        text: err?.message || "Terjadi kendala saat mengirim email.",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // ─── Filtered & Grouped Schedules ────────────────────────────────────────────
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      if (statusFilter === "today") {
        if (item.date !== getTodayDateString()) return false;
      } else if (statusFilter === "upcoming") {
        if (item.status !== "upcoming") return false;
      } else if (statusFilter === "completed") {
        if (item.status !== "completed") return false;
      } else if (statusFilter === "cancelled") {
        if (item.status !== "cancelled") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      }

      return true;
    });
  }, [schedules, statusFilter, searchQuery]);

  const grouped = useMemo(() => {
    return groupSchedules(filteredSchedules);
  }, [filteredSchedules]);

  return (
    <div
      className={`flex flex-col h-full w-full overflow-hidden ${
        isDark ? "bg-[#0c0c0e] text-zinc-100" : "bg-white text-zinc-900"
      }`}
    >
      {/* ─── Top Header Bar ────────────────────────────────────────────────── */}
      <header
        className={`shrink-0 z-20 flex items-center justify-between border-b px-3.5 sm:px-6 py-3 backdrop-blur-md ${
          isDark ? "bg-[#121215]/95 border-zinc-800/80 text-white" : "bg-white/95 border-zinc-200 text-zinc-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark
                ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
            title="Kembali ke Chat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
              <h1 className="text-sm sm:text-base font-bold tracking-tight">Schedule</h1>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Manage your personal schedules and reminders.
            </p>
          </div>
        </div>

        {/* Header Tabs: Asisten AI (Chat) vs Daftar Agenda (List) */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center p-0.5 rounded-xl border text-xs font-semibold ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"
            }`}
          >
            <button
              onClick={() => setCurrentTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentTab === "chat"
                  ? isDark
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "bg-white text-black shadow-xs"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>AI Chat</span>
            </button>

            <button
              onClick={() => setCurrentTab("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentTab === "list"
                  ? isDark
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "bg-white text-black shadow-xs"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Daftar Agenda</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isDark ? "bg-zinc-700 text-zinc-200" : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {schedules.length}
              </span>
            </button>
          </div>

          <button
            onClick={openNewScheduleModal}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">+ New Schedule</span>
            <span className="sm:hidden">+ New</span>
          </button>
        </div>
      </header>

      {/* Guest Notice Banner */}
      {!user && (
        <div
          className={`shrink-0 px-4 py-2 border-b flex items-center justify-between text-xs ${
            isDark ? "bg-zinc-900/80 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-zinc-400">💡</span>
            <span className="truncate">
              Mode Tamu: Jadwal tersimpan lokal. Masuk untuk pengingat otomatis via email.
            </span>
          </div>
          {setShowAuthModal && (
            <button
              onClick={() => setShowAuthModal(true)}
              className={`shrink-0 ml-3 text-xs font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                isDark
                  ? "border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                  : "border-zinc-300 bg-white text-black hover:bg-zinc-100"
              }`}
            >
              Masuk
            </button>
          )}
        </div>
      )}

      {/* ─── TAB 1: AI CHAT INTERFACE ──────────────────────────────────────── */}
      {currentTab === "chat" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Scrollable Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-6 space-y-5">
            <div className="max-w-3xl mx-auto w-full space-y-5">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center animate-in fade-in-0 duration-300 py-6 sm:py-12">
                  {/* Pure Star Icon only (No Box/Kotak, identical to main chat tab) */}
                  <div className="relative mb-3 sm:mb-4 flex items-center justify-center animate-float">
                    <svg
                      className={`w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md transition-colors ${
                        isDark ? "text-white fill-white" : "text-black fill-black"
                      }`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                    </svg>
                  </div>

                  {/* Tanda Tab Schedule */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        isDark
                          ? "bg-zinc-900 border-zinc-700/80 text-zinc-200"
                          : "bg-zinc-100 border-zinc-300 text-zinc-800"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Schedule Tab</span>
                    </span>
                  </div>

                  {/* Headline identik dengan tab chat */}
                  <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                    {getTimeGreeting()}, Usick One
                  </h1>
                  <p className={`mt-2 text-base sm:text-lg font-medium max-w-md px-2 ${isDark ? "text-zinc-400" : "text-black"}`}>
                    What would you like to schedule today?
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 sm:gap-3.5 ${
                      isUser ? "justify-end" : "justify-start"
                    } animate-in fade-in-0 duration-200`}
                  >
                    {/* Assistant Star Avatar */}
                    {!isUser && (
                      <div
                        className={`relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                          isDark ? "bg-white text-black" : "bg-black text-white"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                        </svg>
                      </div>
                    )}

                    {/* Message Body */}
                    <div
                      className={`relative max-w-[90%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-[13.5px] sm:text-sm ${
                        isUser
                          ? isDark
                            ? "bg-zinc-800 border border-zinc-700 text-white rounded-tr-xs"
                            : "bg-black text-white rounded-tr-xs"
                          : isDark
                          ? "bg-[#18181c] border border-zinc-800 text-zinc-100 rounded-tl-xs"
                          : "bg-zinc-100/90 border border-zinc-200 text-zinc-900 rounded-tl-xs"
                      }`}
                    >
                      {msg.content && (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}

                      {/* ── Inline Schedule Confirmation Card ── */}
                      {msg.pendingSchedule && (
                        <div
                          className={`mt-3.5 rounded-2xl border p-4 space-y-3 ${
                            isDark
                              ? "bg-zinc-900/90 border-zinc-700/80 text-white"
                              : "bg-white border-zinc-300 text-zinc-900 shadow-xs"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b pb-2.5 border-zinc-700/40">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                              Detail Jadwal
                            </span>
                            {msg.isConfirmed ? (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  isDark
                                    ? "bg-zinc-800 text-white border-zinc-600"
                                    : "bg-zinc-100 text-black border-zinc-300"
                                }`}
                              >
                                ✓ Sudah Dijadwalkan
                              </span>
                            ) : (
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                  isDark
                                    ? "bg-zinc-800/80 text-zinc-300 border-zinc-700"
                                    : "bg-zinc-100 text-zinc-700 border-zinc-300"
                                }`}
                              >
                                Menunggu Konfirmasi
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Judul</div>
                              <div className="text-sm font-bold">{msg.pendingSchedule.title}</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  isDark ? "bg-zinc-800/40 border-zinc-700/40" : "bg-zinc-50 border-zinc-200"
                                }`}
                              >
                                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Waktu</div>
                                <div className="font-semibold text-xs mt-0.5">
                                  {msg.pendingSchedule.date
                                    ? formatScheduleDate(msg.pendingSchedule.date)
                                    : "Hari Ini"}
                                </div>
                                <div className="text-zinc-400 text-[11px]">
                                  Pukul {formatScheduleTime(msg.pendingSchedule.time || "09:00")} WIB
                                </div>
                              </div>

                              <div
                                className={`p-2.5 rounded-xl border ${
                                  isDark ? "bg-zinc-800/40 border-zinc-700/40" : "bg-zinc-50 border-zinc-200"
                                }`}
                              >
                                <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                                  Durasi & Pengingat
                                </div>
                                <div className="font-semibold text-xs mt-0.5">
                                  {formatDuration(msg.pendingSchedule.duration || 60)}
                                </div>
                                <div className="text-zinc-400 text-[11px]">
                                  ⏰ {formatReminderText(msg.pendingSchedule.reminder ?? 15)}
                                </div>
                              </div>
                            </div>

                            {msg.pendingSchedule.recurrence && msg.pendingSchedule.recurrence !== "once" && (
                              <div className="text-xs text-zinc-400">
                                Pengulangan:{" "}
                                <span className="font-semibold text-zinc-200">
                                  {formatRecurrence(msg.pendingSchedule.recurrence)}
                                </span>
                              </div>
                            )}

                            {msg.pendingSchedule.description && (
                              <div className="text-xs text-zinc-400">
                                Catatan:{" "}
                                <span className="text-zinc-200">{msg.pendingSchedule.description}</span>
                              </div>
                            )}
                          </div>

                          {/* Confirmation Buttons */}
                          {!msg.isConfirmed ? (
                            <div className="pt-2 border-t border-zinc-700/40 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleCancelInlineSchedule(msg.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                  isDark
                                    ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                                    : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                                }`}
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmInlineSchedule(msg.id, msg.pendingSchedule!)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1.5 ${
                                  isDark
                                    ? "bg-white text-black hover:bg-zinc-200"
                                    : "bg-black text-white hover:bg-zinc-800"
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Konfirmasi & Jadwalkan</span>
                              </button>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-zinc-700/40 flex items-center justify-between text-xs text-zinc-400">
                              <span>✓ Jadwal telah ditambahkan ke agenda</span>
                              <button
                                onClick={() => setCurrentTab("list")}
                                className="font-semibold underline hover:text-white cursor-pointer"
                              >
                                Lihat di Daftar Agenda →
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-1 text-[10px] text-zinc-500 text-right">{msg.timestamp}</div>
                    </div>
                  </div>
                );
              }))}

              {/* Typing indicator */}
              {isProcessing && (
                <div className="flex gap-3 justify-start items-center text-xs text-zinc-400 animate-fadeIn">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                      isDark ? "bg-white text-black" : "bg-black text-white"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <div className={`h-2 w-2 rounded-full animate-ping ${isDark ? "bg-white" : "bg-black"}`} />
                    <span>Sedang menganalisis jadwal...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>


          {/* ─── FLOATING CHAT BOX (Styled exactly like the main chat) ──────── */}
          <div
            className={`shrink-0 w-full z-20 px-3.5 sm:px-6 pt-2 pb-4 ${
              isDark
                ? "bg-gradient-to-t from-[#0c0c0e]/95 via-[#0c0c0e]/70 to-transparent"
                : "bg-gradient-to-t from-white/95 via-white/70 to-transparent"
            }`}
          >
            <div className="mx-auto max-w-3xl w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className={`relative rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 transition-all border ${
                  isDark
                    ? "bg-[#16161b] border-zinc-800 shadow-2xl shadow-black/80"
                    : "bg-white border-zinc-200 shadow-xl shadow-zinc-900/10"
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      autoResizeTextarea();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    placeholder="Ketik apa yang ingin Anda jadwalkan (misal: Besok jam 9 pagi meeting tim)..."
                    disabled={isProcessing}
                    className={`flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm focus:outline-none resize-none leading-relaxed ${
                      isDark ? "text-zinc-100 placeholder-zinc-500" : "text-black placeholder-zinc-400 font-normal"
                    }`}
                    style={{ maxHeight: "120px" }}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={isProcessing || !inputMessage.trim()}
                    className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition shadow-xs cursor-pointer disabled:opacity-30 ${
                      isDark
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-black text-white hover:bg-zinc-800"
                    }`}
                    title="Kirim pesan jadwal"
                  >
                    {isProcessing ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DAFTAR AGENDA (LIST & FILTERS) ─────────────────────────── */}
      {currentTab === "list" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
              {(
                [
                  { id: "all", label: "Semua", count: schedules.length },
                  { id: "today", label: "Hari Ini", count: grouped.today.length },
                  { id: "upcoming", label: "Akan Datang", count: grouped.upcoming.length },
                  { id: "completed", label: "Selesai", count: grouped.completed.length },
                  { id: "cancelled", label: "Dibatalkan", count: grouped.cancelled.length },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                      active
                        ? isDark
                          ? "bg-white text-black font-semibold shadow-xs"
                          : "bg-black text-white font-semibold shadow-xs"
                        : isDark
                        ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        : "hover:bg-zinc-200 text-zinc-600 hover:text-black"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active
                          ? isDark
                            ? "bg-black/20 text-black"
                            : "bg-white/20 text-white"
                          : isDark
                          ? "bg-zinc-800 text-zinc-400"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari agenda atau catatan..."
                className={`w-full rounded-xl border pl-8 pr-3 py-1.5 text-xs outline-none transition ${
                  isDark
                    ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600"
                    : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400"
                }`}
              />
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <svg className="w-6 h-6 animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs">Memuat daftar jadwal...</span>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed text-center ${
                isDark ? "border-zinc-800 bg-zinc-900/30" : "border-zinc-300 bg-zinc-50"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                  isDark ? "bg-zinc-800 text-white" : "bg-zinc-200 text-black"
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-1">Belum ada agenda di sini</h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                Ketik langsung di tab <strong>AI Chat</strong> atau klik tombol &ldquo;+ New Schedule&rdquo; untuk membuat jadwal secara manual.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab("chat")}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer ${
                    isDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-zinc-200 text-black hover:bg-zinc-300"
                  }`}
                >
                  Buka AI Chat
                </button>
                <button
                  onClick={openNewScheduleModal}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs ${
                    isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  + Buat Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.today.length > 0 && (
                <ScheduleSection
                  title="Hari Ini"
                  items={grouped.today}
                  isDark={isDark}
                  onSelect={setSelectedItem}
                  onEdit={openEditScheduleModal}
                  onDelete={handleDeleteSchedule}
                  onToggleComplete={(item) =>
                    handleUpdateStatus(item, item.status === "completed" ? "upcoming" : "completed")
                  }
                />
              )}

              {grouped.upcoming.length > 0 && (
                <ScheduleSection
                  title="Akan Datang"
                  items={grouped.upcoming}
                  isDark={isDark}
                  onSelect={setSelectedItem}
                  onEdit={openEditScheduleModal}
                  onDelete={handleDeleteSchedule}
                  onToggleComplete={(item) =>
                    handleUpdateStatus(item, item.status === "completed" ? "upcoming" : "completed")
                  }
                />
              )}

              {grouped.completed.length > 0 && (
                <ScheduleSection
                  title="Selesai / Riwayat"
                  items={grouped.completed}
                  isDark={isDark}
                  onSelect={setSelectedItem}
                  onEdit={openEditScheduleModal}
                  onDelete={handleDeleteSchedule}
                  onToggleComplete={(item) =>
                    handleUpdateStatus(item, item.status === "completed" ? "upcoming" : "completed")
                  }
                />
              )}

              {grouped.cancelled.length > 0 && (
                <ScheduleSection
                  title="Dibatalkan"
                  items={grouped.cancelled}
                  isDark={isDark}
                  onSelect={setSelectedItem}
                  onEdit={openEditScheduleModal}
                  onDelete={handleDeleteSchedule}
                  onToggleComplete={(item) =>
                    handleUpdateStatus(item, item.status === "completed" ? "upcoming" : "completed")
                  }
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── 4. Modal: Create / Edit Schedule (Manual) ────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl transition-all ${
              isDark ? "bg-[#16161b] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-5 border-zinc-700/40">
              <h2 className="text-base font-bold">
                {editingItem ? "Edit Schedule" : "+ New Schedule"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-zinc-400">Judul Agenda *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Misal: Review Sprint dengan Tim"
                  className={`w-full rounded-xl border p-2.5 text-xs outline-none transition ${
                    isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-400">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={`w-full rounded-xl border p-2.5 text-xs outline-none ${
                      isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-400">Waktu / Jam *</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className={`w-full rounded-xl border p-2.5 text-xs outline-none ${
                      isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-400">Durasi</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className={`w-full rounded-xl border p-2.5 text-xs outline-none ${
                      isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                    }`}
                  >
                    <option value={15}>15 menit</option>
                    <option value={30}>30 menit</option>
                    <option value={45}>45 menit</option>
                    <option value={60}>1 jam (60 m)</option>
                    <option value={90}>1.5 jam (90 m)</option>
                    <option value={120}>2 jam (120 m)</option>
                    <option value={180}>3 jam (180 m)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-400">Pengingat (Reminder)</label>
                  <select
                    value={formReminder}
                    onChange={(e) => setFormReminder(Number(e.target.value))}
                    className={`w-full rounded-xl border p-2.5 text-xs outline-none ${
                      isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                    }`}
                  >
                    <option value={0}>Tepat saat dimulai</option>
                    <option value={5}>5 menit sebelumnya</option>
                    <option value={10}>10 menit sebelumnya</option>
                    <option value={15}>15 menit sebelumnya</option>
                    <option value={30}>30 menit sebelumnya</option>
                    <option value={60}>1 jam sebelumnya</option>
                    <option value={1440}>1 hari sebelumnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-400">Pengulangan</label>
                  <select
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as ScheduleRecurrence)}
                    className={`w-full rounded-xl border p-2.5 text-xs outline-none ${
                      isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                    }`}
                  >
                    <option value="once">Sekali saja</option>
                    <option value="daily">Setiap hari</option>
                    <option value="weekly">Setiap minggu</option>
                    <option value="monthly">Setiap bulan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-400">Catatan / Deskripsi Tambahan</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Link meeting, agenda pembahasan, ruangan..."
                  className={`w-full rounded-xl border p-2.5 text-xs outline-none ${
                    isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-700/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-semibold border ${
                    isDark ? "border-zinc-700 hover:bg-zinc-800" : "border-zinc-300 hover:bg-zinc-100"
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-semibold transition shadow-xs ${
                    isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {editingItem ? "Simpan Perubahan" : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 5. Modal: Schedule Details & Actions ─────────────────────────── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl transition-all ${
              isDark ? "bg-[#16161b] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 mb-4 border-zinc-700/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      selectedItem.status === "completed"
                        ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                        : selectedItem.status === "cancelled"
                        ? "bg-zinc-900 text-zinc-500 border-zinc-800 line-through"
                        : isDark
                        ? "bg-white text-black border-white"
                        : "bg-black text-white border-black"
                    }`}
                  >
                    {selectedItem.status === "completed"
                      ? "Selesai"
                      : selectedItem.status === "cancelled"
                      ? "Dibatalkan"
                      : "Akan Datang"}
                  </span>
                  {selectedItem.recurrence !== "once" && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">
                      {formatRecurrence(selectedItem.recurrence)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold tracking-tight">{selectedItem.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  setEmailStatusMsg(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">Waktu Pelaksanaan</div>
                  <div className="font-semibold text-sm mt-1">
                    {formatScheduleDate(selectedItem.date)}
                  </div>
                  <div className="text-zinc-400 mt-0.5">Pukul {formatScheduleTime(selectedItem.time)} WIB</div>
                </div>
                <div className="p-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">Pengingat & Durasi</div>
                  <div className="font-semibold text-zinc-200 mt-1">
                    Durasi: {formatDuration(selectedItem.duration_minutes)}
                  </div>
                  <div className="text-zinc-400 mt-0.5">
                    ⏰ {formatReminderText(selectedItem.reminder_minutes)}
                  </div>
                </div>
              </div>

              {selectedItem.description && (
                <div className="p-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold mb-1">Catatan Tambahan</div>
                  <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{selectedItem.description}</p>
                </div>
              )}

              {/* Status Email Reminder */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? "bg-zinc-900/80 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
                }`}
              >
                <div>
                  <div className="font-semibold text-[11px] text-zinc-400 uppercase">Status Pengingat Email:</div>
                  <div className="text-xs font-medium mt-0.5">
                    {selectedItem.reminder_status === "sent" ? (
                      <span className="text-white font-semibold">✓ Terkirim ke Email</span>
                    ) : selectedItem.reminder_status === "failed" ? (
                      <span className="text-zinc-400">✕ Gagal Terkirim</span>
                    ) : (
                      <span className="text-zinc-300">⏳ Terjadwal (Menunggu waktu)</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={testingEmail}
                  onClick={() => handleTestEmailReminder(selectedItem)}
                  className={`px-3 py-1.5 rounded-xl font-medium text-[11px] transition cursor-pointer border disabled:opacity-50 ${
                    isDark
                      ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                      : "bg-zinc-100 hover:bg-zinc-200 text-black border-zinc-300"
                  }`}
                >
                  {testingEmail ? "Mengirim..." : "Kirim Tes Email"}
                </button>
              </div>

              {emailStatusMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium border ${
                    isDark ? "bg-zinc-800 text-white border-zinc-700" : "bg-zinc-100 text-black border-zinc-300"
                  }`}
                >
                  {emailStatusMsg.text}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-700/40 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditScheduleModal(selectedItem)}
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(selectedItem)}
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white font-semibold transition"
                  >
                    Hapus
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedItem.status !== "cancelled" ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedItem, "cancelled")}
                      className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                      Batalkan Jadwal
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedItem,
                        selectedItem.status === "completed" ? "upcoming" : "completed"
                      )
                    }
                    className={`px-4 py-1.5 rounded-xl font-semibold shadow-xs transition ${
                      selectedItem.status === "completed"
                        ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        : isDark
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-black text-white hover:bg-zinc-800"
                    }`}
                  >
                    {selectedItem.status === "completed" ? "Tandai Belum Selesai" : "Tandai Selesai ✓"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Section Group for Schedules (Monochrome Clean) ───────────
function ScheduleSection({
  title,
  items,
  isDark,
  onSelect,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  title: string;
  items: ScheduleItem[];
  isDark: boolean;
  onSelect: (item: ScheduleItem) => void;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (item: ScheduleItem) => void;
  onToggleComplete: (item: ScheduleItem) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">●</span>
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">
          {title} ({items.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const isDone = item.status === "completed";
          const isCancelled = item.status === "cancelled";

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`group relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-md ${
                isDark
                  ? "bg-[#141418] hover:bg-[#18181e] border-zinc-800/80 hover:border-zinc-700"
                  : "bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300"
              } ${isDone ? "opacity-60" : ""}`}
            >
              {/* Header Card: Jam & Status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isDone
                      ? "bg-zinc-800 text-zinc-400 border-zinc-700 line-through"
                      : isCancelled
                      ? "bg-zinc-900 text-zinc-500 border-zinc-800 line-through"
                      : isDark
                      ? "bg-zinc-800 text-white border-zinc-700"
                      : "bg-zinc-100 text-black border-zinc-300"
                  }`}
                >
                  {formatScheduleTime(item.time)} WIB
                </span>

                <div className="flex items-center gap-1.5">
                  {item.recurrence !== "once" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md border border-zinc-700 text-zinc-300">
                      {formatRecurrence(item.recurrence)}
                    </span>
                  )}
                  {item.reminder_minutes > 0 && (
                    <span
                      title={`Pengingat ${formatReminderText(item.reminder_minutes)}`}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                    >
                      🔔 {item.reminder_minutes}m
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Notes */}
              <h3
                className={`text-sm font-semibold mb-1 line-clamp-2 ${
                  isDone ? "line-through text-zinc-400" : isDark ? "text-white" : "text-zinc-900"
                }`}
              >
                {item.title}
              </h3>

              {item.description ? (
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{item.description}</p>
              ) : (
                <div className="h-3" />
              )}

              {/* Footer: Date & Quick Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40 text-[11px] text-zinc-500">
                <span className="truncate">{formatScheduleDate(item.date)}</span>

                <div
                  className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item)}
                    title={isDone ? "Tandai belum selesai" : "Tandai selesai"}
                    className={`p-1.5 rounded-lg border transition ${
                      isDone
                        ? isDark
                          ? "border-zinc-600 bg-zinc-700 text-white"
                          : "border-black bg-black text-white"
                        : "border-zinc-700 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    title="Edit jadwal"
                    className="p-1.5 rounded-lg border border-zinc-700/60 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    title="Hapus jadwal"
                    className="p-1.5 rounded-lg border border-zinc-700/60 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
