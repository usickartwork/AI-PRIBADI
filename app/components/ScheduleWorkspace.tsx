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

const SUGGESTED_PROMPTS = [
  "Besok jam 9 pagi meeting dengan tim selama 1 jam",
  "Hari Senin jam 7 malam gym",
  "Ingatkan aku bayar listrik tanggal 10 jam 8 malam",
  "Besok jam 14:00 konsultasi dosen, ingatkan 30 menit sebelumnya",
  "Setiap Senin jam 8 pagi meeting mingguan",
];

export function ScheduleWorkspace({
  isDark,
  onClose,
  user,
  setShowAuthModal,
}: ScheduleWorkspaceProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "today" | "upcoming" | "completed" | "cancelled">("all");

  // AI Command Input States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Confirmation Card State (Sebelum Schedule disimpan)
  const [pendingSchedule, setPendingSchedule] = useState<ParsedScheduleAI | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);

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
              // Jika kosong dari server, load dari cache lokal jika ada
              const cached = getLocalSchedules(user.id);
              setSchedules(cached);
            }
          }
        } else {
          // Guest User (Local Storage)
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

  // Simpan ke local cache setiap kali schedules berubah
  const updateSchedulesState = (newItems: ScheduleItem[]) => {
    setSchedules(newItems);
    saveLocalSchedules(userId, newItems);
  };

  // ─── Handle AI Natural Language Submission ───────────────────────────────────
  const handleAiSubmit = async (customText?: string) => {
    const textToParse = (customText ?? aiPrompt).trim();
    if (!textToParse) return;

    setAiParsing(true);
    setAiError(null);
    setClarificationQuestion(null);

    try {
      const now = new Date();
      const clientDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";

      const res = await fetch("/api/schedules/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToParse,
          clientDate,
          timezone: tz,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memproses bahasa natural schedule.");
      }

      const parsed: ParsedScheduleAI = json.data;

      // Cek apakah ambigu
      if (parsed.isAmbiguous && parsed.clarificationQuestion) {
        setClarificationQuestion(parsed.clarificationQuestion);
        setPendingSchedule(parsed);
      } else {
        // Tampilkan preview / confirmation card sebelum disimpan
        setPendingSchedule(parsed);
      }
    } catch (err: any) {
      setAiError(err?.message || "Terjadi kesalahan saat memproses input.");
    } finally {
      setAiParsing(false);
    }
  };

  // ─── Konfirmasi dan Simpan Schedule Hasil AI ─────────────────────────────────
  const handleConfirmPendingSchedule = async () => {
    if (!pendingSchedule) return;

    const newSchedulePayload = {
      user_id: userId,
      title: pendingSchedule.title,
      description: pendingSchedule.description || "",
      date: pendingSchedule.date || getTodayDateString(),
      time: pendingSchedule.time || "09:00",
      duration_minutes: pendingSchedule.duration || 60,
      reminder_minutes: pendingSchedule.reminder ?? 15,
      recurrence: pendingSchedule.recurrence || "once",
      timezone: pendingSchedule.timezone || "Asia/Jakarta",
      user_email: userEmail || undefined,
    };

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchedulePayload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        updateSchedulesState([...schedules, json.data]);
      } else {
        // Fallback local
        const localItem: ScheduleItem = {
          ...newSchedulePayload,
          id: `sch_${Date.now()}`,
          status: "upcoming",
          reminder_status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        updateSchedulesState([...schedules, localItem]);
      }

      // Reset Form State
      setPendingSchedule(null);
      setClarificationQuestion(null);
      setAiPrompt("");
    } catch (err) {
      console.error("Gagal menyimpan schedule:", err);
      const localItem: ScheduleItem = {
        ...newSchedulePayload,
        id: `sch_${Date.now()}`,
        status: "upcoming",
        reminder_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updateSchedulesState([...schedules, localItem]);
      setPendingSchedule(null);
      setAiPrompt("");
    }
  };

  // ─── Manual Form: Create or Edit ─────────────────────────────────────────────
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
    setSelectedItem(null); // Tutup detail modal jika terbuka
    setModalOpen(true);
  };

  const handleSaveManualForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate || !formTime) return;

    if (editingItem) {
      // Update existing item
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
        console.warn("Update API call failed:", err);
      }

      const updatedList = schedules.map((item) =>
        item.id === editingItem.id ? { ...item, ...updatedFields, updated_at: new Date().toISOString() } : item
      );
      updateSchedulesState(updatedList);
    } else {
      // Create new item
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
      console.warn("Status update API error:", err);
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
      console.warn("Delete API error:", err);
    }

    const updated = schedules.filter((s) => s.id !== item.id);
    updateSchedulesState(updated);
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    }
  };

  // ─── Test Send Email Reminder ────────────────────────────────────────────────
  const handleTestEmailReminder = async (item: ScheduleItem) => {
    const targetEmail = userEmail || prompt("Masukkan alamat email untuk menerima tes pengingat:");
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
        throw new Error(json.error || "Gagal mengirim tes email.");
      }

      setEmailStatusMsg({
        type: "success",
        text: `Email berhasil dikirim ke ${targetEmail}. Cek Inbox / Spam!`,
      });
    } catch (err: any) {
      setEmailStatusMsg({
        type: "error",
        text: err?.message || "Terjadi kesalahan saat mengirim email.",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // ─── Filtered & Grouped Schedules ────────────────────────────────────────────
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      // Filter status tab
      if (statusFilter === "today") {
        if (item.date !== getTodayDateString()) return false;
      } else if (statusFilter === "upcoming") {
        if (item.status !== "upcoming") return false;
      } else if (statusFilter === "completed") {
        if (item.status !== "completed") return false;
      } else if (statusFilter === "cancelled") {
        if (item.status !== "cancelled") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inDesc = item.description?.toLowerCase().includes(q);
        return inTitle || inDesc;
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
        isDark ? "bg-[#0f0f12] text-zinc-100" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      {/* ─── Top Header Bar ────────────────────────────────────────────────── */}
      <header
        className={`shrink-0 z-10 flex items-center justify-between border-b px-4 sm:px-8 py-3.5 backdrop-blur-md ${
          isDark ? "bg-[#121215]/90 border-zinc-800/80" : "bg-white/90 border-zinc-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark
                ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
            title="Kembali ke Chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Schedule</h1>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Manage your personal schedules and reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openNewScheduleModal}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ New Schedule</span>
          </button>
        </div>
      </header>

      {/* ─── Main Content Scrollable Area ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Banner Guest Mode jika belum login */}
        {!user && (
          <div
            className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              isDark
                ? "bg-amber-950/20 border-amber-800/40 text-amber-200"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-semibold">Mode Tamu (Penyimpanan Lokal):</span> Jadwal tersimpan pada peramban ini. Masuk dengan akun Anda untuk sinkronisasi antar perangkat dan pengiriman pengingat via Email otomatis.
              </div>
            </div>
            {setShowAuthModal && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="shrink-0 self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition cursor-pointer"
              >
                Masuk / Daftar
              </button>
            )}
          </div>
        )}

        {/* ─── 1. AI Schedule Command Bar ──────────────────────────────────── */}
        <section
          className={`rounded-3xl border p-5 sm:p-6 transition-all shadow-sm ${
            isDark
              ? "bg-[#141418] border-zinc-800/90 shadow-black/40"
              : "bg-white border-zinc-200/90 shadow-zinc-200/60"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-emerald-500 font-bold text-sm">✦</span>
            <label className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-zinc-400">
              What do you want to schedule?
            </label>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAiSubmit();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Contoh: Besok jam 9 pagi meeting dengan tim selama 1 jam"
                disabled={aiParsing}
                className={`w-full rounded-2xl border px-4 py-3 text-sm transition outline-none pr-10 ${
                  isDark
                    ? "bg-[#0b0b0e] border-zinc-700/80 text-white placeholder-zinc-500 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500"
                    : "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                }`}
              />
              {aiPrompt && !aiParsing && (
                <button
                  type="button"
                  onClick={() => setAiPrompt("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={aiParsing || !aiPrompt.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-md"
            >
              {aiParsing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <span>✦ Buat dengan AI</span>
                </>
              )}
            </button>
          </form>

          {/* Prompt Quick Suggestions */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-zinc-500 mr-1 font-medium">Contoh cepat:</span>
            {SUGGESTED_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiPrompt(promptText);
                  handleAiSubmit(promptText);
                }}
                disabled={aiParsing}
                className={`rounded-full px-2.5 py-1 border transition text-left cursor-pointer ${
                  isDark
                    ? "bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-emerald-500/50"
                    : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-black hover:border-emerald-500"
                }`}
              >
                &ldquo;{promptText}&rdquo;
              </button>
            ))}
          </div>

          {/* AI Parsing Error */}
          {aiError && (
            <div className="mt-3 p-3 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex items-center justify-between">
              <span>{aiError}</span>
              <button onClick={() => setAiError(null)} className="ml-2 font-bold hover:underline">
                ✕
              </button>
            </div>
          )}

          {/* ─── Confirmation Card / AI Clarification Modal ───────────────── */}
          {pendingSchedule && (
            <div
              className={`mt-5 rounded-2xl border p-5 transition-all animate-fadeIn ${
                isDark ? "bg-[#18181d] border-emerald-500/30" : "bg-emerald-50/50 border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-zinc-700/40">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-bold text-emerald-400">
                    {clarificationQuestion ? "Pertanyaan Klarifikasi Jadwal" : "Konfirmasi Jadwal Baru"}
                  </h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-medium">
                  AI Parsed
                </span>
              </div>

              {clarificationQuestion ? (
                <div className="space-y-3 mb-4">
                  <p className="text-xs sm:text-sm font-medium text-amber-300 bg-amber-950/30 p-3 rounded-xl border border-amber-800/50">
                    💡 {clarificationQuestion}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-zinc-400 block mb-1">Tanggal Kegiatan:</label>
                      <input
                        type="date"
                        value={pendingSchedule.date || getTodayDateString()}
                        onChange={(e) => setPendingSchedule({ ...pendingSchedule, date: e.target.value })}
                        className={`w-full rounded-xl border p-2 ${
                          isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Waktu / Jam (24-jam):</label>
                      <input
                        type="time"
                        value={pendingSchedule.time || "09:00"}
                        onChange={(e) => setPendingSchedule({ ...pendingSchedule, time: e.target.value })}
                        className={`w-full rounded-xl border p-2 ${
                          isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Preview Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-black/20 border border-zinc-700/30">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">Judul Jadwal</div>
                  <div className="font-semibold text-sm mt-0.5 truncate text-white">{pendingSchedule.title}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-zinc-700/30">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">Tanggal & Waktu</div>
                  <div className="font-semibold text-sm mt-0.5 text-emerald-400">
                    {pendingSchedule.date ? formatScheduleDate(pendingSchedule.date) : "Hari Ini"} ·{" "}
                    {pendingSchedule.time || "09:00"}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-zinc-700/30">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">Durasi & Pengingat</div>
                  <div className="font-medium text-xs mt-0.5 text-zinc-300">
                    Durasi: {formatDuration(pendingSchedule.duration || 60)} <br />
                    Reminder: {formatReminderText(pendingSchedule.reminder ?? 15)}
                  </div>
                </div>
              </div>

              {pendingSchedule.description && (
                <div className="mt-3 p-2.5 rounded-xl bg-black/20 border border-zinc-700/30 text-xs">
                  <span className="text-zinc-400 text-[10px] uppercase font-semibold block mb-0.5">Catatan</span>
                  <span className="text-zinc-300">{pendingSchedule.description}</span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingSchedule(null);
                    setClarificationQuestion(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isDark
                      ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                      : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPendingSchedule}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Schedule</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ─── 2. Controls & Filter Bar ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Filter Status Tabs */}
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
                        ? "bg-emerald-600 text-white font-semibold shadow-xs"
                        : "bg-emerald-600 text-white font-semibold shadow-xs"
                      : isDark
                      ? "hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                      : "hover:bg-zinc-200 text-zinc-600 hover:text-black"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active
                        ? "bg-white/20 text-white"
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
              placeholder="Cari jadwal..."
              className={`w-full rounded-xl border pl-8 pr-3 py-1.5 text-xs outline-none transition ${
                isDark
                  ? "bg-zinc-900 border-zinc-700/80 text-white placeholder-zinc-500 focus:border-emerald-500"
                  : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-emerald-600"
              }`}
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
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
          </div>
        </div>

        {/* ─── 3. Schedule List (Grouped) ──────────────────────────────────── */}
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
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold mb-1">Belum ada agenda di sini</h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-4">
              Tulis di kolom AI di atas (misal &ldquo;Besok jam 9 pagi meeting&rdquo;) atau klik tombol &ldquo;+ New Schedule&rdquo; untuk membuat jadwal manual.
            </p>
            <button
              onClick={openNewScheduleModal}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs"
            >
              + Buat Jadwal Baru
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group: HARI INI */}
            {grouped.today.length > 0 && (
              <ScheduleSection
                title="Hari Ini"
                iconColor="text-emerald-500"
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

            {/* Group: AKAN DATANG */}
            {grouped.upcoming.length > 0 && (
              <ScheduleSection
                title="Akan Datang"
                iconColor="text-blue-500"
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

            {/* Group: SELESAI */}
            {grouped.completed.length > 0 && (
              <ScheduleSection
                title="Selesai / Lewat"
                iconColor="text-zinc-500"
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

            {/* Group: DIBATALKAN */}
            {grouped.cancelled.length > 0 && (
              <ScheduleSection
                title="Dibatalkan"
                iconColor="text-red-500"
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

      {/* ─── 4. Modal: Create / Edit Schedule (Manual) ────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
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
                  className="px-5 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl transition-all ${
              isDark ? "bg-[#16161b] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 mb-4 border-zinc-700/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      selectedItem.status === "completed"
                        ? "bg-zinc-800 text-zinc-400"
                        : selectedItem.status === "cancelled"
                        ? "bg-red-950/60 text-red-400 border border-red-800/40"
                        : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                    }`}
                  >
                    {selectedItem.status === "completed"
                      ? "Selesai"
                      : selectedItem.status === "cancelled"
                      ? "Dibatalkan"
                      : "Akan Datang"}
                  </span>
                  {selectedItem.recurrence !== "once" && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300 border border-blue-800/40">
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
                <div className="p-3 rounded-2xl bg-black/20 border border-zinc-700/30">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">Waktu Pelaksanaan</div>
                  <div className="font-semibold text-sm mt-1 text-emerald-400">
                    {formatScheduleDate(selectedItem.date)}
                  </div>
                  <div className="text-zinc-300 mt-0.5">Pukul {formatScheduleTime(selectedItem.time)} WIB</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/20 border border-zinc-700/30">
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
                <div className="p-3 rounded-2xl bg-black/20 border border-zinc-700/30">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold mb-1">Catatan Tambahan</div>
                  <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{selectedItem.description}</p>
                </div>
              )}

              {/* Status Email Reminder Notification */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? "bg-zinc-900/60 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
                }`}
              >
                <div>
                  <div className="font-semibold text-[11px] text-zinc-400 uppercase">Status Pengingat Email:</div>
                  <div className="text-xs font-medium mt-0.5">
                    {selectedItem.reminder_status === "sent" ? (
                      <span className="text-emerald-400">✓ Sudah Terkirim ke Email</span>
                    ) : selectedItem.reminder_status === "failed" ? (
                      <span className="text-red-400">✕ Gagal Terkirim</span>
                    ) : (
                      <span className="text-amber-400">⏳ Menunggu Jadwal (Pending)</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={testingEmail}
                  onClick={() => handleTestEmailReminder(selectedItem)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-[11px] transition cursor-pointer border border-zinc-700 disabled:opacity-50"
                >
                  {testingEmail ? "Mengirim..." : "Kirim Tes Email"}
                </button>
              </div>

              {emailStatusMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium ${
                    emailStatusMsg.type === "success"
                      ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                      : "bg-red-950/40 text-red-300 border border-red-800/40"
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
                    className="px-3.5 py-1.5 rounded-xl border border-red-900/50 hover:bg-red-950/50 text-red-400 font-semibold transition"
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
                    className={`px-4 py-1.5 rounded-xl font-semibold text-white shadow-xs transition ${
                      selectedItem.status === "completed"
                        ? "bg-zinc-700 hover:bg-zinc-600"
                        : "bg-emerald-600 hover:bg-emerald-500"
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

// ─── Sub-component: Section Group for Schedules ──────────────────────────────
function ScheduleSection({
  title,
  iconColor,
  items,
  isDark,
  onSelect,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  title: string;
  iconColor: string;
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
        <span className={`text-xs font-bold uppercase tracking-wider ${iconColor}`}>●</span>
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
              className={`group relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-lg ${
                isDark
                  ? "bg-[#141418] hover:bg-[#18181e] border-zinc-800/80 hover:border-zinc-700"
                  : "bg-white hover:bg-zinc-50/90 border-zinc-200 hover:border-zinc-300"
              } ${isDone ? "opacity-70" : ""}`}
            >
              {/* Header Card: Jam & Status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    isDone
                      ? "bg-zinc-800 text-zinc-400 line-through"
                      : isCancelled
                      ? "bg-red-950/50 text-red-400"
                      : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/30"
                  }`}
                >
                  {formatScheduleTime(item.time)} WIB
                </span>

                <div className="flex items-center gap-1.5">
                  {item.recurrence !== "once" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950/50 text-blue-300 border border-blue-800/30">
                      {formatRecurrence(item.recurrence)}
                    </span>
                  )}
                  {item.reminder_minutes > 0 && (
                    <span
                      title={`Pengingat ${formatReminderText(item.reminder_minutes)}`}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300"
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
                  className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item)}
                    title={isDone ? "Tandai belum selesai" : "Tandai selesai"}
                    className={`p-1.5 rounded-lg border transition ${
                      isDone
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-zinc-700 hover:border-emerald-500 hover:text-emerald-400"
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
                    className="p-1.5 rounded-lg border border-zinc-700/60 hover:bg-red-950/60 hover:text-red-400 transition"
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
