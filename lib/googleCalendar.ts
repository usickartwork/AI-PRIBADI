import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";
import { parseScheduleDateTime, ScheduleItem, ScheduleRecurrence } from "./schedules";

// ─── Kredensial & Konfigurasi Google OAuth ───────────────────────────────────
export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/google/calendar/callback`
      : "https://onemind.web.id/api/google/calendar/callback");

  return { clientId, clientSecret, redirectUri, isConfigured: Boolean(clientId && clientSecret) };
}

// ─── Enkripsi Token Aman di Server (AES-256-GCM) ──────────────────────────────
function getEncryptionKey(): Buffer {
  const customKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();
  if (customKey && customKey.length === 64) {
    return Buffer.from(customKey, "hex");
  }
  // Turunkan kunci 32-byte dari secret yang ada di server
  const seed =
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "usick-fallback-secret-calendar-2026";
  return crypto.createHash("sha256").update(seed).digest();
}

export function encryptSecret(plainText: string): string {
  if (!plainText) return "";
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("[googleCalendar] Gagal mengenkripsi token:", err);
    return plainText; // Fallback jika crypto gagal
  }
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText) return "";
  try {
    const parts = cipherText.split(":");
    if (parts.length !== 3) return cipherText;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[googleCalendar] Gagal mendekripsi token:", err);
    return cipherText;
  }
}

// ─── Supabase Client Helper (Service Role untuk keamanan token) ──────────────
function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (serviceRoleKey && supabaseUrl) {
    return createClient(supabaseUrl, serviceRoleKey);
  }
  return supabase;
}

// ─── OAuth 2.0 URL Generator ──────────────────────────────────────────────────
export function generateGoogleAuthUrl(userId: string, origin?: string): string {
  const { clientId, redirectUri } = getGoogleConfig();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID belum dikonfigurasi di server.");
  }

  // Gunakan redirectUri dinamis jika origin diberikan
  const effectiveRedirectUri = origin ? `${origin}/api/google/calendar/callback` : redirectUri;

  const statePayload = JSON.stringify({
    userId,
    nonce: crypto.randomBytes(16).toString("hex"),
    timestamp: Date.now(),
  });
  const state = Buffer.from(statePayload).toString("base64url");

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: effectiveRedirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent", // Pastikan selalu dapat refresh_token
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ─── OAuth Code Exchange ──────────────────────────────────────────────────────
export async function exchangeGoogleAuthCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials belum lengkap di server.");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("[googleCalendar] Token exchange gagal:", errText);
    throw new Error(`Gagal menukar kode otorisasi Google: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string;
  const refreshToken = (tokenData.refresh_token as string) || "";
  const expiresIn = (tokenData.expires_in as number) || 3600;
  const expiryDate = Date.now() + expiresIn * 1000;

  // Dapatkan email akun Google yang terhubung
  let googleEmail = "";
  try {
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userinfoRes.ok) {
      const uinfo = await userinfoRes.json();
      googleEmail = uinfo.email || "";
    }
  } catch (e) {
    console.warn("[googleCalendar] Gagal mengambil email pengguna:", e);
  }

  return {
    accessToken,
    refreshToken,
    expiryDate,
    googleEmail,
  };
}

// ─── Refresh Token Otomatis ───────────────────────────────────────────────────
export async function refreshGoogleAccessToken(
  refreshTokenPlain: string
): Promise<{ accessToken: string; expiryDate: number }> {
  const { clientId, clientSecret } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials tidak ditemukan.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshTokenPlain,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[googleCalendar] Gagal merefresh access token:", errText);
    throw new Error("Otorisasi Google Calendar telah kedaluwarsa atau dicabut.");
  }

  const data = await res.json();
  const accessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) || 3600;
  const expiryDate = Date.now() + expiresIn * 1000;

  return { accessToken, expiryDate };
}

// ─── Simpan & Ambil Token Pengguna di Database ─────────────────────────────────
export interface GoogleAccountRecord {
  user_id: string;
  google_email?: string;
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export async function saveGoogleCalendarTokens(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiryDate: number;
    googleEmail?: string;
  }
) {
  if (!isSupabaseConfigured) return;
  const admin = getSupabaseAdmin();

  // Jika refresh_token tidak dikirimkan saat refresh rutin, pertahankan yang lama
  const encryptedAccess = encryptSecret(tokens.accessToken);
  const payload: any = {
    user_id: userId,
    access_token: encryptedAccess,
    expiry_date: tokens.expiryDate,
    updated_at: new Date().toISOString(),
  };

  if (tokens.refreshToken) {
    payload.refresh_token = encryptSecret(tokens.refreshToken);
  }
  if (tokens.googleEmail) {
    payload.google_email = tokens.googleEmail;
  }

  const { error } = await admin
    .from("google_calendar_tokens")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("[googleCalendar] Error upserting tokens ke Supabase:", error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

export async function getValidGoogleAccessToken(
  userId: string
): Promise<{ accessToken: string; googleEmail?: string } | null> {
  if (!isSupabaseConfigured || !userId || userId === "guest") return null;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const googleEmail = data.google_email || "";
    const rawAccess = decryptSecret(data.access_token);
    const rawRefresh = decryptSecret(data.refresh_token);
    const expiryDate = Number(data.expiry_date) || 0;

    // Jika access token masih berlaku (buffer 2 menit)
    if (rawAccess && Date.now() < expiryDate - 120_000) {
      return { accessToken: rawAccess, googleEmail };
    }

    // Jika access token kedaluwarsa tapi ada refresh token, lakukan refresh
    if (rawRefresh) {
      try {
        const refreshed = await refreshGoogleAccessToken(rawRefresh);
        await saveGoogleCalendarTokens(userId, {
          accessToken: refreshed.accessToken,
          expiryDate: refreshed.expiryDate,
          googleEmail,
        });
        return { accessToken: refreshed.accessToken, googleEmail };
      } catch (refreshErr) {
        console.warn("[googleCalendar] Refresh token gagal (mungkin izin dicabut):", refreshErr);
        return null;
      }
    }

    return null;
  } catch (err) {
    console.error("[googleCalendar] getValidGoogleAccessToken exception:", err);
    return null;
  }
}

export async function disconnectGoogleCalendar(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const admin = getSupabaseAdmin();
    // Ambil token untuk revoke jika memungkinkan
    const { data } = await admin
      .from("google_calendar_tokens")
      .select("access_token, refresh_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      const tokenToRevoke = decryptSecret(data.refresh_token) || decryptSecret(data.access_token);
      if (tokenToRevoke) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
        } catch {}
      }
    }

    await admin.from("google_calendar_tokens").delete().eq("user_id", userId);
    return true;
  } catch (err) {
    console.error("[googleCalendar] Gagal memutuskan koneksi Google Calendar:", err);
    return false;
  }
}

// ─── Format Tanggal & Waktu ISO untuk Google Calendar ────────────────────────
export function buildGoogleEventDateTime(
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 60,
  timezone: string = "Asia/Jakarta"
) {
  const start = parseScheduleDateTime(dateStr, timeStr, timezone);
  const end = new Date(start.getTime() + (durationMinutes || 60) * 60 * 1000);

  // Ambil offset yang tepat
  let offset = "+07:00";
  if (timezone === "Asia/Makassar" || timezone === "Asia/Ujung_Pandang") {
    offset = "+08:00";
  } else if (timezone === "Asia/Jayapura") {
    offset = "+09:00";
  } else {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "longOffset",
      });
      const parts = formatter.formatToParts(new Date());
      const tzPart = parts.find((p) => p.type === "timeZoneName");
      if (tzPart && tzPart.value.startsWith("GMT")) {
        let raw = tzPart.value.replace("GMT", "");
        if (raw === "") raw = "+00:00";
        const m = raw.match(/([+-])(\d{1,2})(?::(\d{2}))?/);
        if (m) {
          offset = `${m[1]}${m[2].padStart(2, "0")}:${m[3] ? m[3].padStart(2, "0") : "00"}`;
        }
      }
    } catch {
      offset = "+07:00";
    }
  }

  const [sh, sm] = (timeStr || "09:00").split(":");
  const pad = (n: number | string) => String(n).padStart(2, "0");
  const startIso = `${dateStr}T${pad(sh)}:${pad(sm)}:00${offset}`;

  // Hitung tanggal selesai (bisa berganti hari jika durasi melewati tengah malam)
  const ey = end.getFullYear();
  const em = pad(end.getMonth() + 1);
  const ed = pad(end.getDate());
  const eh = pad(end.getHours());
  const emin = pad(end.getMinutes());
  const endIso = `${ey}-${em}-${ed}T${eh}:${emin}:00${offset}`;

  return { startIso, endIso };
}

export function buildGoogleRecurrenceRule(recurrence: ScheduleRecurrence): string[] | undefined {
  if (recurrence === "daily") return ["RRULE:FREQ=DAILY"];
  if (recurrence === "weekly") return ["RRULE:FREQ=WEEKLY"];
  if (recurrence === "monthly") return ["RRULE:FREQ=MONTHLY"];
  return undefined;
}

// ─── Google Calendar API Operations (Insert, Update, Delete) ─────────────────

/**
 * Buat event baru di Google Calendar milik pengguna
 */
export async function createGoogleCalendarEvent(
  schedule: ScheduleItem,
  accessToken: string
): Promise<{ eventId: string; htmlLink?: string }> {
  const { startIso, endIso } = buildGoogleEventDateTime(
    schedule.date,
    schedule.time,
    schedule.duration_minutes || 60,
    schedule.timezone || "Asia/Jakarta"
  );

  const recurrenceRule = buildGoogleRecurrenceRule(schedule.recurrence);
  const reminderMinutes = schedule.reminder_minutes ?? 15;

  const eventPayload: any = {
    summary: schedule.title,
    description: schedule.description || "Dibuat via Usick One Schedule",
    start: {
      dateTime: startIso,
      timeZone: schedule.timezone || "Asia/Jakarta",
    },
    end: {
      dateTime: endIso,
      timeZone: schedule.timezone || "Asia/Jakarta",
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: reminderMinutes }],
    },
  };

  if (recurrenceRule) {
    eventPayload.recurrence = recurrenceRule;
  }

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[googleCalendar] createEvent error:", res.status, errText);
    throw new Error(`Google Calendar API Error (${res.status}): ${errText}`);
  }

  const created = await res.json();
  return {
    eventId: created.id,
    htmlLink: created.htmlLink,
  };
}

/**
 * Perbarui event yang sudah ada di Google Calendar
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  schedule: ScheduleItem,
  accessToken: string
): Promise<boolean> {
  if (!eventId) return false;

  const { startIso, endIso } = buildGoogleEventDateTime(
    schedule.date,
    schedule.time,
    schedule.duration_minutes || 60,
    schedule.timezone || "Asia/Jakarta"
  );

  const recurrenceRule = buildGoogleRecurrenceRule(schedule.recurrence);
  const reminderMinutes = schedule.reminder_minutes ?? 15;

  const eventPayload: any = {
    summary: schedule.title,
    description: schedule.description || "Dibuat via Usick One Schedule",
    start: {
      dateTime: startIso,
      timeZone: schedule.timezone || "Asia/Jakarta",
    },
    end: {
      dateTime: endIso,
      timeZone: schedule.timezone || "Asia/Jakarta",
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: reminderMinutes }],
    },
  };

  if (recurrenceRule) {
    eventPayload.recurrence = recurrenceRule;
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("[googleCalendar] updateEvent error:", res.status, errText);
    return false;
  }

  return true;
}

/**
 * Hapus event dari Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  eventId: string,
  accessToken: string
): Promise<boolean> {
  if (!eventId) return false;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // 204 No Content atau 404 (sudah terhapus) dianggap sukses
  if (res.status === 204 || res.status === 404) {
    return true;
  }

  console.warn("[googleCalendar] deleteEvent warning status:", res.status);
  return false;
}

