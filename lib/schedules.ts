export type ScheduleRecurrence = "once" | "daily" | "weekly" | "monthly";
export type ScheduleStatus = "upcoming" | "completed" | "cancelled";
export type ReminderStatus = "pending" | "sent" | "failed" | "skipped";

export interface ScheduleItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:mm (24-jam)
  duration_minutes: number; // e.g. 60
  reminder_minutes: number; // e.g. 15 (menit sebelum acara)
  recurrence: ScheduleRecurrence;
  timezone: string; // e.g. "Asia/Jakarta"
  status: ScheduleStatus;
  reminder_status: ReminderStatus;
  user_email?: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedScheduleAI {
  title: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  duration?: number; // Menit
  description?: string;
  reminder?: number; // Menit
  recurrence?: ScheduleRecurrence;
  timezone?: string;
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
}

export type CreateScheduleInput = {
  title: string;
  description?: string;
  date: string;
  time: string;
  duration_minutes?: number;
  reminder_minutes?: number;
  recurrence?: ScheduleRecurrence;
  timezone?: string;
  user_email?: string;
};

export type UpdateScheduleInput = Partial<CreateScheduleInput> & {
  status?: ScheduleStatus;
  reminder_status?: ReminderStatus;
};

// ─── Formatters & Utility Functions ──────────────────────────────────────────

export function formatScheduleDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);

    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatScheduleTime(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return timeStr;
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "Tanpa durasi";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  } else if (hours > 0) {
    return `${hours} jam`;
  }
  return `${remainingMinutes} menit`;
}

export function formatReminderText(minutes: number): string {
  if (minutes === 0) return "Tepat saat jadwal dimulai";
  if (minutes === 5) return "5 menit sebelumnya";
  if (minutes === 10) return "10 menit sebelumnya";
  if (minutes === 15) return "15 menit sebelumnya";
  if (minutes === 30) return "30 menit sebelumnya";
  if (minutes === 60) return "1 jam sebelumnya";
  if (minutes === 120) return "2 jam sebelumnya";
  if (minutes === 1440) return "1 hari sebelumnya";
  
  if (minutes % 60 === 0) {
    return `${minutes / 60} jam sebelumnya`;
  }
  return `${minutes} menit sebelumnya`;
}

export function formatRecurrence(recurrence: ScheduleRecurrence): string {
  switch (recurrence) {
    case "daily":
      return "Setiap Hari";
    case "weekly":
      return "Setiap Minggu";
    case "monthly":
      return "Setiap Bulan";
    case "once":
    default:
      return "Sekali saja";
  }
}

// ─── Grouping & Sorting ───────────────────────────────────────────────────────

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function isScheduleToday(schedule: ScheduleItem): boolean {
  return schedule.date === getTodayDateString();
}

export function groupSchedules(schedules: ScheduleItem[]) {
  const todayStr = getTodayDateString();
  const currentTime = getCurrentTimeString();

  const today: ScheduleItem[] = [];
  const upcoming: ScheduleItem[] = [];
  const completed: ScheduleItem[] = [];
  const cancelled: ScheduleItem[] = [];

  for (const s of schedules) {
    if (s.status === "cancelled") {
      cancelled.push(s);
      continue;
    }
    if (s.status === "completed") {
      completed.push(s);
      continue;
    }

    if (s.date === todayStr) {
      today.push(s);
    } else if (s.date > todayStr) {
      upcoming.push(s);
    } else {
      // Tanggal sudah lewat namun belum completed/cancelled
      completed.push(s);
    }
  }

  // Sorting: Urutkan today & upcoming dari yang terdekat
  today.sort((a, b) => a.time.localeCompare(b.time));
  upcoming.sort((a, b) => {
    const diffDate = a.date.localeCompare(b.date);
    if (diffDate !== 0) return diffDate;
    return a.time.localeCompare(b.time);
  });

  // Urutkan completed & cancelled dari yang paling baru
  completed.sort((a, b) => {
    const diffDate = b.date.localeCompare(a.date);
    if (diffDate !== 0) return diffDate;
    return b.time.localeCompare(a.time);
  });
  cancelled.sort((a, b) => {
    const diffDate = b.date.localeCompare(a.date);
    if (diffDate !== 0) return diffDate;
    return b.time.localeCompare(a.time);
  });

  return { today, upcoming, completed, cancelled };
}

// ─── Local Cache Helpers ──────────────────────────────────────────────────────

const STORAGE_PREFIX = "usick_schedules_";

export function getLocalSchedules(userId: string = "guest"): ScheduleItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveLocalSchedules(userId: string = "guest", items: ScheduleItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(items));
  } catch (err) {
    console.error("Gagal menyimpan schedule ke localStorage:", err);
  }
}
