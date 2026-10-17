export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNotesAdmin } from "@/lib/notesServer";
import {
  AppDeviceSession,
  COMMAND_EXPIRATION_MS,
  DEVICE_STALE_THRESHOLD_MS,
  MusicConnectAck,
  MusicConnectCommand,
  MusicConnectCommandPayload,
  MusicConnectCommandType,
  SpotifyConnectDevice,
  SpotifyConnectState,
} from "@/lib/musicConnect";
import crypto from "crypto";

const SYSTEM_CONNECT_TITLE = "__USICK_MUSIC_CONNECT__";
const MAX_SESSIONS_PER_USER = 12;
const MAX_COMMANDS_HISTORY = 40;
const SESSION_RETENTION_MS = 1000 * 60 * 60 * 12; // 12 hours
const CAS_MAX_RETRIES = 6;

interface UserConnectStore {
  version: number;
  sessions: AppDeviceSession[];
  commands: MusicConnectCommand[];
  acks: MusicConnectAck[];
  updatedAt: string;
}

// Global state for in-process lock queue & warm fallback cache
const globalForConnect = globalThis as unknown as {
  __usickMusicConnectMem?: Map<string, UserConnectStore>;
  __usickMusicConnectLocks?: Map<string, Promise<any>>;
  __usickSpotifyStateCache?: Map<string, { expiresAt: number; state: SpotifyConnectState }>;
  __usickSpotifyUserAccessToken?: { token: string; expiresAt: number } | null;
};

if (!globalForConnect.__usickMusicConnectMem) {
  globalForConnect.__usickMusicConnectMem = new Map();
}
if (!globalForConnect.__usickMusicConnectLocks) {
  globalForConnect.__usickMusicConnectLocks = new Map();
}
if (!globalForConnect.__usickSpotifyStateCache) {
  globalForConnect.__usickSpotifyStateCache = new Map();
}

function getSystemConnectUserId(userId: string): string {
  return `${userId}::music_connect`;
}

/**
 * Generates an opaque, server-derived Realtime wakeup channel topic for the authenticated user.
 * Note: This topic is used ONLY for zero-payload wakeup pings (`connect_ping`).
 * No secret is ever sent to the browser, and no command is ever executed from Realtime broadcast payloads.
 */
function getRealtimeWakeupTopic(userId: string): string {
  const secret =
    process.env.CLERK_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SPOTIFY_CLIENT_SECRET ||
    "usick_connect_local_fallback_key";
  const digest = crypto
    .createHmac("sha256", secret)
    .update(`usick_mc_wakeup_v1:${userId}`)
    .digest("hex")
    .slice(0, 28);
  return `mc_wakeup_${digest}`;
}

/**
 * Serializes concurrent operations for the same userId within a single Node.js instance.
 */
async function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const locks = globalForConnect.__usickMusicConnectLocks!;
  const prev = locks.get(userId) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => current);
  locks.set(userId, chained);

  await prev.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(userId) === chained) {
      locks.delete(userId);
    }
  }
}

const VALID_COMMAND_TYPES = new Set<MusicConnectCommandType>([
  "PLAY",
  "PAUSE",
  "TOGGLE_PLAY",
  "NEXT",
  "PREVIOUS",
  "SEEK",
  "SET_VOLUME",
  "SHUFFLE",
  "REPEAT",
  "TRANSFER_PLAYBACK",
  "PLAY_TRACK",
  "ADD_TO_QUEUE",
]);

function normalizeStore(raw: unknown): UserConnectStore {
  const nowIso = new Date().toISOString();
  if (!raw || typeof raw !== "object") {
    return { version: 1, sessions: [], commands: [], acks: [], updatedAt: nowIso };
  }
  const obj = raw as Record<string, unknown>;
  const sessions = Array.isArray(obj.sessions)
    ? (obj.sessions as any[]).map((s) => ({
        ...s,
        can_transfer_playback:
          typeof s?.can_transfer_playback === "boolean"
            ? s.can_transfer_playback
            : typeof s?.can_transferPlayback === "boolean"
            ? s.can_transferPlayback
            : true,
      }))
    : [];
  return {
    version: typeof obj.version === "number" ? obj.version : 1,
    sessions: sessions as AppDeviceSession[],
    commands: Array.isArray(obj.commands) ? (obj.commands as MusicConnectCommand[]) : [],
    acks: Array.isArray(obj.acks) ? (obj.acks as MusicConnectAck[]) : [],
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : nowIso,
  };
}

function pruneAndReconcileStore(store: UserConnectStore, nowMs: number = Date.now()): UserConnectStore {
  // 1. Mark stale sessions as disconnected and prune old sessions
  const reconciledSessions: AppDeviceSession[] = [];
  for (const s of store.sessions) {
    if (!s || !s.session_instance_id) continue;
    const seenMs = Date.parse(s.last_seen_at || s.updated_at);
    const ageMs = Number.isNaN(seenMs) ? DEVICE_STALE_THRESHOLD_MS + 1 : nowMs - seenMs;
    if (ageMs > SESSION_RETENTION_MS) {
      continue;
    }
    const isOnline = Boolean(s.is_connected) && ageMs <= DEVICE_STALE_THRESHOLD_MS;
    reconciledSessions.push({
      ...s,
      can_transfer_playback: s.can_transfer_playback ?? true,
      is_connected: isOnline,
      is_active_playback: isOnline ? Boolean(s.is_active_playback) : false,
      is_playing: isOnline ? Boolean(s.is_playing) : false,
    });
  }

  // Sort by active playback first, then most recently seen
  reconciledSessions.sort((a, b) => {
    if (a.is_active_playback !== b.is_active_playback) {
      return a.is_active_playback ? -1 : 1;
    }
    return Date.parse(b.last_seen_at || "") - Date.parse(a.last_seen_at || "");
  });

  // Enforce single active playback session (keep the most recently updated playing/active session)
  let foundActive = false;
  for (const s of reconciledSessions) {
    if (s.is_active_playback) {
      if (!foundActive) {
        foundActive = true;
      } else {
        s.is_active_playback = false;
      }
    }
  }

  if (!foundActive) {
    const playingSession = reconciledSessions.find((s) => s.is_connected && s.is_playing);
    if (playingSession) {
      playingSession.is_active_playback = true;
    }
  }

  // 2. Expire old commands and keep recent history
  const reconciledCommands: MusicConnectCommand[] = [];
  for (const cmd of store.commands) {
    if (!cmd || !cmd.command_id) continue;
    const expMs = Date.parse(cmd.expires_at);
    const createdMs = Date.parse(cmd.created_at);
    if (!Number.isNaN(createdMs) && nowMs - createdMs > 60_000) {
      continue;
    }
    if (
      (cmd.status === "pending" || cmd.status === "processing") &&
      !Number.isNaN(expMs) &&
      nowMs > expMs
    ) {
      reconciledCommands.push({
        ...cmd,
        status: "expired",
        result_message: "Perangkat target tidak merespons tepat waktu (command kedaluwarsa).",
      });
    } else {
      reconciledCommands.push(cmd);
    }
  }

  // 3. Keep recent acks (last 60s)
  const reconciledAcks = store.acks.filter((ack) => {
    const ackMs = Date.parse(ack.acknowledged_at);
    return !Number.isNaN(ackMs) && nowMs - ackMs <= 60_000;
  });

  return {
    version: store.version || 1,
    sessions: reconciledSessions.slice(0, MAX_SESSIONS_PER_USER),
    commands: reconciledCommands.slice(-MAX_COMMANDS_HISTORY),
    acks: reconciledAcks.slice(-MAX_COMMANDS_HISTORY),
    updatedAt: new Date(nowMs).toISOString(),
  };
}

async function readRawStoreFromDb(userId: string): Promise<{
  rowId: string | null;
  rowUpdatedAt: string | null;
  store: UserConnectStore;
}> {
  const mem = globalForConnect.__usickMusicConnectMem!;
  const db = getNotesAdmin();
  const sysUserId = getSystemConnectUserId(userId);

  if (db) {
    // 1. Primary: Direct query on dedicated `music_device_sessions` table
    try {
      const { data: dbSessions, error: sessErr } = await db
        .from("music_device_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("last_seen_at", { ascending: false });

      if (!sessErr && Array.isArray(dbSessions)) {
        const { data: dbCommands } = await db
          .from("music_connect_commands")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(40);

        const store: UserConnectStore = {
          version: Date.now(),
          sessions: (dbSessions as AppDeviceSession[]) || [],
          commands: (dbCommands as MusicConnectCommand[]) || [],
          acks: [],
          updatedAt: new Date().toISOString(),
        };
        const reconciled = pruneAndReconcileStore(store);
        mem.set(userId, reconciled);
        return {
          rowId: "dedicated_table",
          rowUpdatedAt: reconciled.updatedAt,
          store: reconciled,
        };
      }
    } catch {
      // Fall through to user_notes fallback
    }

    // 2. Fallback: Query from user_notes
    try {
      const { data, error } = await db
        .from("user_notes")
        .select("id, content, updated_at")
        .eq("user_id", sysUserId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const parsed =
          typeof data[0].content === "string"
            ? JSON.parse(data[0].content)
            : data[0].content;
        const store = pruneAndReconcileStore(normalizeStore(parsed));
        mem.set(userId, store);
        return {
          rowId: data[0].id,
          rowUpdatedAt: data[0].updated_at,
          store,
        };
      }
    } catch (err) {
      console.warn("[music/connect] Supabase read warning:", err);
    }
  }

  const cached = mem.get(userId);
  if (cached) {
    const reconciled = pruneAndReconcileStore(cached);
    mem.set(userId, reconciled);
    return { rowId: null, rowUpdatedAt: null, store: reconciled };
  }

  const fresh = pruneAndReconcileStore({
    version: 1,
    sessions: [],
    commands: [],
    acks: [],
    updatedAt: new Date().toISOString(),
  });
  mem.set(userId, fresh);
  return { rowId: null, rowUpdatedAt: null, store: fresh };
}

/**
 * Performs an atomic Compare-And-Swap (CAS) mutation on the user's Music Connect store.
 * Protects against concurrent read-modify-write race conditions across both:
 * 1. Same serverless instance (via `withUserLock`), and
 * 2. Multiple concurrent serverless instances (via dedicated tables & conditional `.eq("updated_at", rowUpdatedAt)` retry loop).
 */
async function mutateUserConnectStore<R>(
  userId: string,
  mutator: (store: UserConnectStore, nowMs: number) => {
    result: R;
    mirrorSession?: AppDeviceSession;
    mirrorSessions?: AppDeviceSession[];
    mirrorCommand?: MusicConnectCommand;
    mirrorCommands?: MusicConnectCommand[];
  }
): Promise<{ store: UserConnectStore; result: R }> {
  return withUserLock(userId, async () => {
    const mem = globalForConnect.__usickMusicConnectMem!;
    const db = getNotesAdmin();
    const sysUserId = getSystemConnectUserId(userId);

    for (let attempt = 0; attempt < CAS_MAX_RETRIES; attempt++) {
      const nowMs = Date.now();
      const { rowId, rowUpdatedAt, store: baseStore } = await readRawStoreFromDb(userId);
      const workingStore: UserConnectStore = JSON.parse(JSON.stringify(baseStore));

      const { result, mirrorSession, mirrorSessions, mirrorCommand, mirrorCommands } = mutator(
        workingStore,
        nowMs
      );
      const reconciled = pruneAndReconcileStore(workingStore, nowMs);
      reconciled.version = (baseStore.version || 1) + 1;

      // Safe monotonic ISO string that NEVER crashes on null rowUpdatedAt
      const prevMs =
        rowUpdatedAt && rowUpdatedAt !== "dedicated_table"
          ? Date.parse(rowUpdatedAt)
          : 0;
      const safePrevMs = Number.isNaN(prevMs) ? 0 : prevMs;
      const nextIso = new Date(Math.max(nowMs, safePrevMs + 1)).toISOString();
      reconciled.updatedAt = nextIso;

      if (!db) {
        mem.set(userId, reconciled);
        return { store: reconciled, result };
      }

      let persistedOk = false;

      // 1. Direct write to dedicated tables if available (bulk upsert support)
      const sessionsToUpsert: AppDeviceSession[] = [
        ...(mirrorSessions || []),
        ...(mirrorSession ? [mirrorSession] : []),
      ];

      if (sessionsToUpsert.length > 0) {
        // Deduplicate by session_instance_id (keep latest)
        const sessionMap = new Map<string, AppDeviceSession>();
        for (const s of sessionsToUpsert) {
          sessionMap.set(s.session_instance_id, s);
        }
        const sessionRows = Array.from(sessionMap.values()).map((s) => ({
          user_id: userId,
          session_instance_id: s.session_instance_id,
          spotify_device_id: s.spotify_device_id,
          device_name: s.device_name,
          device_type: s.device_type,
          platform: s.platform,
          browser: s.browser,
          is_connected: s.is_connected,
          is_active_playback: s.is_active_playback,
          can_control: s.can_control,
          can_transfer_playback: s.can_transfer_playback,
          current_track_id: s.current_track_id,
          current_track_name: s.current_track_name,
          current_artist_name: s.current_artist_name,
          current_album_art: s.current_album_art,
          current_track_payload: s.current_track_payload,
          queue_payload: s.queue_payload || [],
          is_playing: s.is_playing,
          progress_ms: s.progress_ms,
          duration_ms: s.duration_ms,
          volume_percent: s.volume_percent,
          shuffle_state: s.shuffle_state,
          repeat_state: s.repeat_state,
          last_seen_at: s.last_seen_at,
          updated_at: s.updated_at,
        }));

        try {
          const { error: upsertErr } = await db
            .from("music_device_sessions")
            .upsert(sessionRows, { onConflict: "user_id,session_instance_id" });
          if (!upsertErr) {
            persistedOk = true;
          }
        } catch {}
      }

      const commandsToUpsert: MusicConnectCommand[] = [
        ...(mirrorCommands || []),
        ...(mirrorCommand ? [mirrorCommand] : []),
      ];

      if (commandsToUpsert.length > 0) {
        const commandMap = new Map<string, MusicConnectCommand>();
        for (const c of commandsToUpsert) {
          commandMap.set(c.command_id, c);
        }
        const commandRows = Array.from(commandMap.values()).map((c) => ({
          command_id: c.command_id,
          user_id: userId,
          source_instance_id: c.source_instance_id,
          source_device_name: c.source_device_name,
          target_instance_id: c.target_instance_id,
          command_type: c.command_type,
          payload: c.payload,
          status: c.status,
          result_message: c.result_message,
          created_at: c.created_at,
          expires_at: c.expires_at,
          acknowledged_at: c.acknowledged_at,
        }));

        try {
          const { error: cmdErr } = await db
            .from("music_connect_commands")
            .upsert(commandRows, { onConflict: "command_id" });
          if (!cmdErr) {
            persistedOk = true;
          }
        } catch {}
      }

      // 2. Backup write to user_notes (with CAS protection)
      const payloadStr = JSON.stringify(reconciled);
      try {
        if (rowId && rowId !== "dedicated_table" && rowUpdatedAt) {
          const { data: updatedRows, error: updateErr } = await db
            .from("user_notes")
            .update({
              title: SYSTEM_CONNECT_TITLE,
              content: payloadStr,
              updated_at: nextIso,
            })
            .eq("id", rowId)
            .eq("updated_at", rowUpdatedAt)
            .select("id");

          if (!updateErr && updatedRows && updatedRows.length > 0) {
            persistedOk = true;
          }
        } else if (rowId !== "dedicated_table") {
          const { data: existingRows } = await db
            .from("user_notes")
            .select("id")
            .eq("user_id", sysUserId)
            .is("deleted_at", null)
            .limit(1);

          if (!existingRows || existingRows.length === 0) {
            const { error: insertErr } = await db.from("user_notes").insert([
              {
                id: crypto.randomUUID(),
                user_id: sysUserId,
                title: SYSTEM_CONNECT_TITLE,
                content: payloadStr,
                is_pinned: false,
                created_at: nextIso,
                updated_at: nextIso,
                deleted_at: null,
              },
            ]);
            if (!insertErr) {
              persistedOk = true;
            }
          } else {
            const { error: updateErr } = await db
              .from("user_notes")
              .update({
                title: SYSTEM_CONNECT_TITLE,
                content: payloadStr,
                updated_at: nextIso,
              })
              .eq("id", existingRows[0].id);
            if (!updateErr) {
              persistedOk = true;
            }
          }
        }
      } catch (err) {
        console.warn("[music/connect] CAS backup write warning:", err);
      }

      if (persistedOk || rowId === "dedicated_table") {
        mem.set(userId, reconciled);
        return { store: reconciled, result };
      }

      // Small backoff before CAS retry
      await new Promise((r) => setTimeout(r, 15 + attempt * 20));
    }

    // Fallback if all CAS retries exhausted
    const nowMs = Date.now();
    const { store: fallbackBase } = await readRawStoreFromDb(userId);
    const { result } = mutator(fallbackBase, nowMs);
    const reconciled = pruneAndReconcileStore(fallbackBase, nowMs);
    mem.set(userId, reconciled);
    return { store: reconciled, result };
  });
}

type CommandMutationResult =
  | {
      ok: true;
      status: number;
      deduplicated: boolean;
      command: MusicConnectCommand;
      code?: undefined;
      error?: undefined;
    }
  | {
      ok: false;
      status: number;
      code: string;
      error: string;
      deduplicated?: undefined;
      command?: undefined;
    };

type AckMutationResult =
  | {
      ok: true;
      status: number;
      ack: MusicConnectAck | null;
      alreadyAcknowledged?: boolean;
      error?: undefined;
    }
  | {
      ok: false;
      status: number;
      error: string;
      ack?: undefined;
      alreadyAcknowledged?: undefined;
    };

type TransferMutationResult =
  | {
      ok: true;
      status: number;
      transferredTo: AppDeviceSession;
      transferCommand: MusicConnectCommand | null;
      track: any;
      queue: any[];
      progressMs: number;
      code?: undefined;
      error?: undefined;
    }
  | {
      ok: false;
      status: number;
      code: string;
      error: string;
      transferredTo?: undefined;
      transferCommand?: undefined;
      track?: undefined;
      queue?: undefined;
      progressMs?: undefined;
    };

// ─── Official Spotify Connect Web API Helpers ────────────────────────────────
async function getSpotifyUserAccessToken(): Promise<{
  token: string | null;
  reason?: SpotifyConnectState["status"];
  message?: string;
}> {
  const clientId = (process.env.SPOTIFY_CLIENT_ID || "").trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
  const refreshTokens = [
    (process.env.SPOTIFY_REFRESH_TOKEN || "").trim(),
    (process.env.SPOTIFY_REFRESH_TOKEN_BACKUP || "").trim(),
  ].filter(Boolean);

  if (!clientId || !clientSecret || refreshTokens.length === 0) {
    return {
      token: null,
      reason: "no_user_token",
      message:
        "Akun Spotify OAuth personal belum dihubungkan. Kontrol antar-perangkat Usick One tetap aktif penuh.",
    };
  }

  const cached = globalForConnect.__usickSpotifyUserAccessToken;
  if (cached && cached.token && Date.now() < cached.expiresAt - 30_000) {
    return { token: cached.token };
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  for (const rt of refreshTokens) {
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: rt,
        }).toString(),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          globalForConnect.__usickSpotifyUserAccessToken = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
          };
          return { token: data.access_token };
        }
      }
    } catch (err) {
      console.warn("[music/connect] Spotify refresh token error:", err);
    }
  }

  return {
    token: null,
    reason: "no_user_token",
    message:
      "Token OAuth Spotify perlu diperbarui untuk melihat perangkat Spotify Connect eksternal.",
  };
}

async function fetchOfficialSpotifyConnectState(
  userId: string,
  forceRefresh = false
): Promise<SpotifyConnectState> {
  const now = Date.now();
  const cacheMap = globalForConnect.__usickSpotifyStateCache!;
  const cached = cacheMap.get(userId);
  if (!forceRefresh && cached && now < cached.expiresAt) {
    return cached.state;
  }

  const authResult = await getSpotifyUserAccessToken();
  if (!authResult.token) {
    const fallbackState: SpotifyConnectState = {
      status: authResult.reason || "no_user_token",
      message:
        authResult.message ||
        "Spotify OAuth belum terhubung. Gunakan daftar Perangkat Aplikasi Usick One di atas untuk mengontrol pemutaran antar-perangkat.",
      devices: [],
      activeDeviceId: null,
      activeDeviceName: null,
      isPlaying: false,
      trackId: null,
      trackName: null,
      artistName: null,
      albumArt: null,
      progressMs: 0,
      durationMs: 0,
      volumePercent: null,
      checkedAt: new Date(now).toISOString(),
    };
    cacheMap.set(userId, { expiresAt: now + 10_000, state: fallbackState });
    return fallbackState;
  }

  try {
    const [devicesRes, playerRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: { Authorization: `Bearer ${authResult.token}` },
        cache: "no-store",
      }),
      fetch("https://api.spotify.com/v1/me/player", {
        headers: { Authorization: `Bearer ${authResult.token}` },
        cache: "no-store",
      }),
    ]);

    if (devicesRes.status === 429 || playerRes.status === 429) {
      const retryAfter = Number(
        devicesRes.headers.get("Retry-After") || playerRes.headers.get("Retry-After") || "10"
      );
      const rateLimitedState: SpotifyConnectState = {
        status: "rate_limited",
        message: `Batas request Spotify API tercapai. Coba lagi dalam ${retryAfter} detik.`,
        devices: cached?.state.devices || [],
        activeDeviceId: cached?.state.activeDeviceId || null,
        activeDeviceName: cached?.state.activeDeviceName || null,
        isPlaying: cached?.state.isPlaying || false,
        trackId: cached?.state.trackId || null,
        trackName: cached?.state.trackName || null,
        artistName: cached?.state.artistName || null,
        albumArt: cached?.state.albumArt || null,
        progressMs: cached?.state.progressMs || 0,
        durationMs: cached?.state.durationMs || 0,
        volumePercent: cached?.state.volumePercent ?? null,
        checkedAt: new Date(now).toISOString(),
      };
      cacheMap.set(userId, {
        expiresAt: now + Math.max(5, retryAfter) * 1000,
        state: rateLimitedState,
      });
      return rateLimitedState;
    }

    if (devicesRes.status === 401 || devicesRes.status === 403) {
      const errText = await devicesRes.text().catch(() => "");
      const isPremiumError = errText.includes("PREMIUM_REQUIRED");
      const errState: SpotifyConnectState = {
        status: isPremiumError ? "premium_required" : "insufficient_scope",
        message: isPremiumError
          ? "Kontrol perangkat Spotify Connect resmi memerlukan akun Spotify Premium."
          : "Izin OAuth Spotify (`user-read-playback-state`) belum diberikan pada token saat ini.",
        devices: [],
        activeDeviceId: null,
        activeDeviceName: null,
        isPlaying: false,
        trackId: null,
        trackName: null,
        artistName: null,
        albumArt: null,
        progressMs: 0,
        durationMs: 0,
        volumePercent: null,
        checkedAt: new Date(now).toISOString(),
      };
      cacheMap.set(userId, { expiresAt: now + 15_000, state: errState });
      return errState;
    }

    const devicesData = devicesRes.ok ? await devicesRes.json().catch(() => ({})) : {};
    const rawDevices: any[] = Array.isArray(devicesData?.devices) ? devicesData.devices : [];
    const devices: SpotifyConnectDevice[] = rawDevices.map((d) => ({
      id: typeof d.id === "string" ? d.id : null,
      is_active: Boolean(d.is_active),
      is_private_session: Boolean(d.is_private_session),
      is_restricted: Boolean(d.is_restricted),
      name: typeof d.name === "string" ? d.name : "Spotify Device",
      type: typeof d.type === "string" ? d.type : "Speaker",
      volume_percent: typeof d.volume_percent === "number" ? d.volume_percent : null,
      supports_volume: Boolean(d.supports_volume),
    }));

    let playerJson: any = null;
    if (playerRes.status === 200) {
      playerJson = await playerRes.json().catch(() => null);
    }

    const activeDevice =
      devices.find((d) => d.is_active) ||
      (playerJson?.device?.id
        ? {
            id: playerJson.device.id,
            name: playerJson.device.name || "Spotify Device",
            volume_percent: playerJson.device.volume_percent ?? null,
          }
        : null);

    const item = playerJson?.item;
    const connectedState: SpotifyConnectState = {
      status: "connected",
      message:
        devices.length > 0
          ? `${devices.length} perangkat Spotify Connect ditemukan.`
          : "Tidak ada aplikasi Spotify eksternal yang sedang aktif saat ini.",
      devices,
      activeDeviceId: activeDevice?.id || null,
      activeDeviceName: activeDevice?.name || null,
      isPlaying: Boolean(playerJson?.is_playing),
      trackId: item?.id || null,
      trackName: item?.name || null,
      artistName: Array.isArray(item?.artists)
        ? item.artists.map((a: any) => a.name).join(", ")
        : null,
      albumArt: item?.album?.images?.[0]?.url || null,
      progressMs: typeof playerJson?.progress_ms === "number" ? playerJson.progress_ms : 0,
      durationMs: typeof item?.duration_ms === "number" ? item.duration_ms : 0,
      volumePercent: activeDevice?.volume_percent ?? null,
      checkedAt: new Date(now).toISOString(),
    };

    cacheMap.set(userId, { expiresAt: now + 5_000, state: connectedState });
    return connectedState;
  } catch (err: any) {
    return {
      status: "error",
      message: err?.message || "Gagal memuat status Spotify Connect.",
      devices: [],
      activeDeviceId: null,
      activeDeviceName: null,
      isPlaying: false,
      trackId: null,
      trackName: null,
      artistName: null,
      albumArt: null,
      progressMs: 0,
      durationMs: 0,
      volumePercent: null,
      checkedAt: new Date(now).toISOString(),
    };
  }
}

async function executeOfficialSpotifyAction(params: {
  userId: string;
  spotifyAction: string;
  deviceId?: string;
  play?: boolean;
  positionMs?: number;
  volumePercent?: number;
}): Promise<{ ok: boolean; status: number; message: string; code?: string }> {
  const authResult = await getSpotifyUserAccessToken();
  if (!authResult.token) {
    return {
      ok: false,
      status: 401,
      code: "NO_USER_TOKEN",
      message:
        authResult.message ||
        "Token OAuth Spotify belum tersedia untuk mengontrol aplikasi Spotify eksternal.",
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${authResult.token}`,
    "Content-Type": "application/json",
  };

  let url = "";
  let method = "PUT";
  let body: string | undefined = undefined;
  const devQuery = params.deviceId ? `?device_id=${encodeURIComponent(params.deviceId)}` : "";

  switch (params.spotifyAction) {
    case "TRANSFER":
      if (!params.deviceId) {
        return { ok: false, status: 400, message: "Device ID Spotify wajib diisi." };
      }
      url = "https://api.spotify.com/v1/me/player";
      method = "PUT";
      body = JSON.stringify({
        device_ids: [params.deviceId],
        play: params.play ?? true,
      });
      break;
    case "PLAY":
      url = `https://api.spotify.com/v1/me/player/play${devQuery}`;
      method = "PUT";
      break;
    case "PAUSE":
      url = `https://api.spotify.com/v1/me/player/pause${devQuery}`;
      method = "PUT";
      break;
    case "NEXT":
      url = `https://api.spotify.com/v1/me/player/next${devQuery}`;
      method = "POST";
      break;
    case "PREVIOUS":
      url = `https://api.spotify.com/v1/me/player/previous${devQuery}`;
      method = "POST";
      break;
    case "SEEK": {
      const pos = Math.max(0, Math.round(params.positionMs || 0));
      url = `https://api.spotify.com/v1/me/player/seek?position_ms=${pos}${
        params.deviceId ? `&device_id=${encodeURIComponent(params.deviceId)}` : ""
      }`;
      method = "PUT";
      break;
    }
    case "VOLUME": {
      const vol = Math.max(0, Math.min(100, Math.round(params.volumePercent ?? 80)));
      url = `https://api.spotify.com/v1/me/player/volume?volume_percent=${vol}${
        params.deviceId ? `&device_id=${encodeURIComponent(params.deviceId)}` : ""
      }`;
      method = "PUT";
      break;
    }
    default:
      return { ok: false, status: 400, message: "Aksi Spotify tidak dikenali." };
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    globalForConnect.__usickSpotifyStateCache?.delete(params.userId);

    if (res.status === 204 || res.status === 200 || res.status === 202) {
      return {
        ok: true,
        status: 200,
        message: "Perintah Spotify Connect berhasil dijalankan.",
      };
    }

    const errText = await res.text().catch(() => "");
    if (res.status === 403 && errText.includes("PREMIUM_REQUIRED")) {
      return {
        ok: false,
        status: 403,
        code: "PREMIUM_REQUIRED",
        message: "Kontrol playback Spotify Connect resmi membutuhkan akun Spotify Premium.",
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        status: 404,
        code: "NO_ACTIVE_DEVICE",
        message: "Perangkat Spotify tidak lagi aktif atau tidak ditemukan.",
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        status: 429,
        code: "RATE_LIMITED",
        message: "Terlalu banyak perintah ke Spotify API. Tunggu beberapa detik.",
      };
    }

    return {
      ok: false,
      status: res.status,
      message: `Spotify API menolak perintah (${res.status}).`,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err?.message || "Gagal menghubungi server Spotify.",
    };
  }
}

// ─── GET /api/music/connect ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const instanceId = (searchParams.get("instanceId") || "").trim();
    const includeSpotify = searchParams.get("includeSpotify") === "1";
    const forceSpotify = searchParams.get("forceSpotify") === "1";

    const { store } = await readRawStoreFromDb(userId);
    const nowMs = Date.now();

    // Only deliver non-expired pending commands addressed to this exact instanceId and owned by userId
    const pendingCommands = instanceId
      ? store.commands.filter((c) => {
          if (c.user_id !== userId) return false;
          if (c.target_instance_id !== instanceId) return false;
          if (c.status !== "pending") return false;
          const expMs = Date.parse(c.expires_at);
          return Number.isNaN(expMs) || nowMs <= expMs;
        })
      : [];

    const activeSession =
      store.sessions.find((s) => s.is_connected && s.is_active_playback) ||
      store.sessions.find((s) => s.is_connected && s.is_playing) ||
      null;

    const spotifyConnect = includeSpotify
      ? await fetchOfficialSpotifyConnectState(userId, forceSpotify)
      : undefined;

    return NextResponse.json({
      success: true,
      userId,
      realtimeTopic: getRealtimeWakeupTopic(userId),
      sessions: store.sessions,
      activeSession,
      pendingCommands,
      recentAcks: store.acks,
      spotifyConnect,
      serverTime: new Date(nowMs).toISOString(),
    });
  } catch (err: any) {
    console.error("[music/connect] GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat Music Connect." },
      { status: 500 }
    );
  }
}

// ─── POST /api/music/connect ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "heartbeat";
    const realtimeTopic = getRealtimeWakeupTopic(userId);

    // 1. ACTION: HEARTBEAT / REGISTER / UPDATE DEVICE STATE / DISCONNECT
    if (action === "heartbeat" || action === "disconnect") {
      const instanceId =
        typeof body.session_instance_id === "string" ? body.session_instance_id.trim() : "";
      if (!instanceId) {
        return NextResponse.json(
          { success: false, error: "session_instance_id wajib diisi." },
          { status: 400 }
        );
      }

      const { store, result } = await mutateUserConnectStore(userId, (workingStore, nowMs) => {
        const nowIso = new Date(nowMs).toISOString();
        const existingIdx = workingStore.sessions.findIndex(
          (s) => s.session_instance_id === instanceId
        );
        const existing = existingIdx >= 0 ? workingStore.sessions[existingIdx] : null;

        if (action === "disconnect") {
          let disconnectedSession: AppDeviceSession | undefined;
          if (existingIdx >= 0) {
            disconnectedSession = {
              ...workingStore.sessions[existingIdx],
              user_id: userId,
              is_connected: false,
              is_active_playback: false,
              is_playing: false,
              updated_at: nowIso,
            };
            workingStore.sessions[existingIdx] = disconnectedSession;
          }
          return {
            result: { disconnected: true, session: disconnectedSession || null },
            mirrorSession: disconnectedSession,
          };
        }

        const isPlaying = Boolean(body.is_playing);
        const claimActive = Boolean(body.claim_active) || isPlaying;

        const otherActivePlaying = workingStore.sessions.some(
          (s) =>
            s.session_instance_id !== instanceId &&
            s.is_connected &&
            s.is_active_playback &&
            s.is_playing
        );

        let isActivePlayback = existing?.is_active_playback ?? false;
        if (claimActive) {
          isActivePlayback = true;
        } else if (
          !otherActivePlaying &&
          Boolean(body.current_track_id) &&
          !workingStore.sessions.some((s) => s.is_connected && s.is_active_playback)
        ) {
          isActivePlayback = true;
        }

        if (isActivePlayback) {
          for (const s of workingStore.sessions) {
            if (s.session_instance_id !== instanceId) {
              s.is_active_playback = false;
            }
          }
        }

        const updatedSession: AppDeviceSession = {
          user_id: userId,
          session_instance_id: instanceId,
          spotify_device_id:
            typeof body.spotify_device_id === "string"
              ? body.spotify_device_id
              : existing?.spotify_device_id || null,
          device_name:
            typeof body.device_name === "string" && body.device_name.trim()
              ? body.device_name.trim().slice(0, 60)
              : existing?.device_name || "Browser Web",
          device_type:
            body.device_type === "mobile" ||
            body.device_type === "tablet" ||
            body.device_type === "desktop"
              ? body.device_type
              : existing?.device_type || "desktop",
          platform:
            typeof body.platform === "string"
              ? body.platform.slice(0, 32)
              : existing?.platform || "Web",
          browser:
            typeof body.browser === "string"
              ? body.browser.slice(0, 32)
              : existing?.browser || "Browser",
          is_connected: true,
          is_active_playback: isActivePlayback,
          can_control: true,
          can_transfer_playback: true,
          current_track_id:
            body.current_track_id !== undefined
              ? body.current_track_id
              : existing?.current_track_id ?? null,
          current_track_name:
            body.current_track_name !== undefined
              ? body.current_track_name
              : existing?.current_track_name ?? null,
          current_artist_name:
            body.current_artist_name !== undefined
              ? body.current_artist_name
              : existing?.current_artist_name ?? null,
          current_album_art:
            body.current_album_art !== undefined
              ? body.current_album_art
              : existing?.current_album_art ?? null,
          current_track_payload:
            body.current_track_payload !== undefined
              ? body.current_track_payload
              : existing?.current_track_payload ?? null,
          queue_payload: Array.isArray(body.queue_payload)
            ? body.queue_payload.slice(0, 50)
            : existing?.queue_payload || [],
          is_playing: isPlaying,
          progress_ms:
            typeof body.progress_ms === "number" && !Number.isNaN(body.progress_ms)
              ? Math.max(0, Math.round(body.progress_ms))
              : existing?.progress_ms || 0,
          duration_ms:
            typeof body.duration_ms === "number" && !Number.isNaN(body.duration_ms)
              ? Math.max(0, Math.round(body.duration_ms))
              : existing?.duration_ms || 0,
          volume_percent:
            typeof body.volume_percent === "number" && !Number.isNaN(body.volume_percent)
              ? Math.max(0, Math.min(100, Math.round(body.volume_percent)))
              : existing?.volume_percent ?? 80,
          shuffle_state:
            typeof body.shuffle_state === "boolean"
              ? body.shuffle_state
              : existing?.shuffle_state ?? false,
          repeat_state:
            body.repeat_state === "all" ||
            body.repeat_state === "one" ||
            body.repeat_state === "off"
              ? body.repeat_state
              : existing?.repeat_state || "off",
          last_seen_at: nowIso,
          updated_at: nowIso,
        };

        if (existingIdx >= 0) {
          workingStore.sessions[existingIdx] = updatedSession;
        } else {
          workingStore.sessions.unshift(updatedSession);
        }

        return {
          result: { disconnected: false, session: updatedSession },
          mirrorSession: updatedSession,
          mirrorSessions: isActivePlayback ? workingStore.sessions : undefined,
        };
      });

      if (result.disconnected) {
        return NextResponse.json({ success: true, userId, disconnected: true });
      }

      const nowMs = Date.now();
      const pendingCommands = store.commands.filter((c) => {
        if (c.user_id !== userId) return false;
        if (c.target_instance_id !== instanceId) return false;
        if (c.status !== "pending") return false;
        const expMs = Date.parse(c.expires_at);
        return Number.isNaN(expMs) || nowMs <= expMs;
      });

      const activeSession =
        store.sessions.find((s) => s.is_connected && s.is_active_playback) ||
        store.sessions.find((s) => s.is_connected && s.is_playing) ||
        null;

      return NextResponse.json({
        success: true,
        userId,
        realtimeTopic,
        session: result.session,
        sessions: store.sessions,
        activeSession,
        pendingCommands,
        recentAcks: store.acks,
      });
    }

    // 2. ACTION: SEND REMOTE COMMAND TO TARGET USICK ONE DEVICE
    if (action === "command") {
      const cmdInput = body.command || body;
      const nowMsInitial = Date.now();
      const commandId =
        typeof cmdInput.command_id === "string" && cmdInput.command_id.trim()
          ? cmdInput.command_id.trim()
          : `cmd_${nowMsInitial.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const sourceInstanceId =
        typeof cmdInput.source_instance_id === "string" ? cmdInput.source_instance_id.trim() : "";
      const targetInstanceId =
        typeof cmdInput.target_instance_id === "string" ? cmdInput.target_instance_id.trim() : "";
      const commandType = cmdInput.command_type as MusicConnectCommandType;

      if (!sourceInstanceId || !targetInstanceId || !VALID_COMMAND_TYPES.has(commandType)) {
        return NextResponse.json(
          { success: false, error: "Format perintah Music Connect tidak valid." },
          { status: 400 }
        );
      }

      // Check expiration if client supplied expires_at
      if (typeof cmdInput.expires_at === "string") {
        const suppliedExp = Date.parse(cmdInput.expires_at);
        if (!Number.isNaN(suppliedExp) && Date.now() > suppliedExp) {
          return NextResponse.json(
            {
              success: false,
              code: "COMMAND_EXPIRED",
              error: "Perintah telah kedaluwarsa sebelum diproses.",
            },
            { status: 410 }
          );
        }
      }

      const { store, result } = await mutateUserConnectStore<CommandMutationResult>(userId, (workingStore, nowMs) => {
        const nowIso = new Date(nowMs).toISOString();

        // Deduplicate if command_id already exists for this user
        const duplicate = workingStore.commands.find((c) => c.command_id === commandId);
        if (duplicate) {
          return {
            result: { ok: true, status: 200, deduplicated: true, command: duplicate },
          };
        }

        // Verify target session belongs to this authenticated userId and is online
        const targetSession = workingStore.sessions.find(
          (s) => s.session_instance_id === targetInstanceId && s.user_id === userId
        );
        const seenMs = targetSession ? Date.parse(targetSession.last_seen_at || targetSession.updated_at) : NaN;
        const isTargetOnline =
          Boolean(targetSession?.is_connected) &&
          !Number.isNaN(seenMs) &&
          nowMs - seenMs <= DEVICE_STALE_THRESHOLD_MS;

        if (!targetSession || !isTargetOnline) {
          return {
            result: {
              ok: false,
              status: 404,
              code: "TARGET_OFFLINE",
              error: "Perangkat tujuan sedang offline atau tidak lagi aktif.",
            },
          };
        }

        const rawPayload = (cmdInput.payload || {}) as MusicConnectCommandPayload;
        const validatedPayload: MusicConnectCommandPayload = {};

        if (
          typeof rawPayload.positionSeconds === "number" &&
          !Number.isNaN(rawPayload.positionSeconds)
        ) {
          validatedPayload.positionSeconds = Math.max(0, rawPayload.positionSeconds);
        }
        if (typeof rawPayload.positionMs === "number" && !Number.isNaN(rawPayload.positionMs)) {
          validatedPayload.positionMs = Math.max(0, Math.round(rawPayload.positionMs));
        }
        if (
          typeof rawPayload.volumePercent === "number" &&
          !Number.isNaN(rawPayload.volumePercent)
        ) {
          validatedPayload.volumePercent = Math.max(
            0,
            Math.min(100, Math.round(rawPayload.volumePercent))
          );
        }
        if (typeof rawPayload.shuffle === "boolean") {
          validatedPayload.shuffle = rawPayload.shuffle;
        }
        if (
          rawPayload.repeatMode === "off" ||
          rawPayload.repeatMode === "all" ||
          rawPayload.repeatMode === "one"
        ) {
          validatedPayload.repeatMode = rawPayload.repeatMode;
        }
        if (rawPayload.track && typeof rawPayload.track === "object") {
          validatedPayload.track = rawPayload.track;
        }
        if (Array.isArray(rawPayload.queue)) {
          validatedPayload.queue = rawPayload.queue.slice(0, 50);
        }
        if (typeof rawPayload.autoPlay === "boolean") {
          validatedPayload.autoPlay = rawPayload.autoPlay;
        }
        if (typeof rawPayload.wasTransferred === "boolean") {
          validatedPayload.wasTransferred = rawPayload.wasTransferred;
        }
        if (typeof rawPayload.newActiveInstanceId === "string") {
          validatedPayload.newActiveInstanceId = rawPayload.newActiveInstanceId;
        }

        // Supersede older pending SEEK or SET_VOLUME commands to the same target to prevent queue backlog
        if (commandType === "SEEK" || commandType === "SET_VOLUME") {
          for (const existingCmd of workingStore.commands) {
            if (
              existingCmd.target_instance_id === targetInstanceId &&
              existingCmd.command_type === commandType &&
              existingCmd.status === "pending"
            ) {
              existingCmd.status = "expired";
              existingCmd.result_message = "Digantikan oleh perintah terbaru";
            }
          }
        }

        const commandObj: MusicConnectCommand = {
          command_id: commandId,
          user_id: userId, // Strictly bound to Clerk authenticated userId
          source_instance_id: sourceInstanceId,
          source_device_name:
            typeof cmdInput.source_device_name === "string"
              ? cmdInput.source_device_name.slice(0, 60)
              : "Perangkat Lain",
          target_instance_id: targetInstanceId,
          command_type: commandType,
          payload: validatedPayload,
          status: "pending",
          result_message: null,
          created_at: nowIso,
          expires_at: new Date(nowMs + COMMAND_EXPIRATION_MS).toISOString(),
          acknowledged_at: null,
        };

        workingStore.commands.push(commandObj);

        return {
          result: { ok: true, status: 200, deduplicated: false, command: commandObj },
          mirrorCommand: commandObj,
        };
      });

      if (!result.ok) {
        return NextResponse.json(
          { success: false, code: result.code, error: result.error },
          { status: result.status }
        );
      }

      return NextResponse.json({
        success: true,
        deduplicated: result.deduplicated,
        command: result.command,
        sessions: store.sessions,
        realtimeTopic,
      });
    }

    // 3. ACTION: ACKNOWLEDGE COMMAND EXECUTION FROM TARGET DEVICE
    if (action === "ack") {
      const commandId = typeof body.command_id === "string" ? body.command_id.trim() : "";
      const targetInstanceId =
        typeof body.target_instance_id === "string" ? body.target_instance_id.trim() : "";
      const status: "succeeded" | "failed" =
        body.status === "failed" ? "failed" : "succeeded";
      const resultMessage =
        typeof body.result_message === "string"
          ? body.result_message
          : status === "succeeded"
          ? "Berhasil dijalankan"
          : "Gagal menjalankan perintah";

      if (!commandId || !targetInstanceId) {
        return NextResponse.json(
          { success: false, error: "command_id dan target_instance_id wajib diisi." },
          { status: 400 }
        );
      }

      const { store, result } = await mutateUserConnectStore<AckMutationResult>(userId, (workingStore, nowMs) => {
        const nowIso = new Date(nowMs).toISOString();
        const cmdIdx = workingStore.commands.findIndex(
          (c) => c.command_id === commandId && c.user_id === userId
        );

        if (cmdIdx < 0) {
          return {
            result: {
              ok: false,
              status: 404,
              error: "Perintah tidak ditemukan untuk akun ini.",
            },
          };
        }

        const cmd = workingStore.commands[cmdIdx];
        if (cmd.target_instance_id !== targetInstanceId) {
          return {
            result: {
              ok: false,
              status: 403,
              error: "Perangkat ini bukan target yang sah untuk perintah tersebut.",
            },
          };
        }

        // Prevent re-acknowledging already finalized commands
        if (cmd.status === "succeeded" || cmd.status === "failed" || cmd.status === "expired") {
          const existingAck = workingStore.acks.find((a) => a.command_id === commandId);
          return {
            result: {
              ok: true,
              status: 200,
              alreadyAcknowledged: true,
              ack: existingAck || null,
            },
          };
        }

        workingStore.commands[cmdIdx] = {
          ...cmd,
          status,
          result_message: resultMessage,
          acknowledged_at: nowIso,
        };

        let updatedTargetSession: AppDeviceSession | undefined;
        const sIdx = workingStore.sessions.findIndex(
          (s) => s.session_instance_id === targetInstanceId
        );
        if (sIdx >= 0) {
          const sObj =
            body.session && typeof body.session === "object"
              ? (body.session as Partial<AppDeviceSession>)
              : {};
          updatedTargetSession = {
            ...workingStore.sessions[sIdx],
            ...sObj,
            user_id: userId,
            session_instance_id: targetInstanceId,
            last_seen_at: nowIso,
            updated_at: nowIso,
          };
          workingStore.sessions[sIdx] = updatedTargetSession;
        }

        // CRITICAL TRANSFER RULE:
        // If this ack is for TRANSFER_PLAYBACK and status === "succeeded",
        // only NOW switch active playback ownership to targetInstanceId and pause the source device!
        const createdPauseCommands: MusicConnectCommand[] = [];
        if (cmd.command_type === "TRANSFER_PLAYBACK" && status === "succeeded") {
          for (const s of workingStore.sessions) {
            if (s.session_instance_id === targetInstanceId) {
              s.is_active_playback = true;
              s.is_playing = true;
              s.updated_at = nowIso;
            } else {
              if (s.is_active_playback || s.is_playing) {
                const pauseCmd: MusicConnectCommand = {
                  command_id: `cmd_xfer_pause_${nowMs.toString(36)}_${Math.random()
                    .toString(36)
                    .slice(2, 6)}`,
                  user_id: userId,
                  source_instance_id: targetInstanceId,
                  source_device_name: updatedTargetSession?.device_name || "Perangkat Tujuan",
                  target_instance_id: s.session_instance_id,
                  command_type: "PAUSE",
                  payload: { wasTransferred: true, newActiveInstanceId: targetInstanceId },
                  status: "pending",
                  result_message: "Playback telah berpindah dan aktif di perangkat tujuan",
                  created_at: nowIso,
                  expires_at: new Date(nowMs + COMMAND_EXPIRATION_MS).toISOString(),
                  acknowledged_at: null,
                };
                workingStore.commands.push(pauseCmd);
                createdPauseCommands.push(pauseCmd);
              }
              s.is_active_playback = false;
              s.is_playing = false;
              s.updated_at = nowIso;
            }
          }
        }

        const ackObj: MusicConnectAck = {
          command_id: commandId,
          user_id: userId,
          source_instance_id: cmd.source_instance_id,
          target_instance_id: targetInstanceId,
          command_type: cmd.command_type,
          status,
          result_message: resultMessage,
          acknowledged_at: nowIso,
          session: updatedTargetSession,
        };

        workingStore.acks.push(ackObj);

        return {
          result: { ok: true, status: 200, ack: ackObj },
          mirrorSession: updatedTargetSession,
          mirrorSessions: workingStore.sessions,
          mirrorCommand: workingStore.commands[cmdIdx],
          mirrorCommands: [workingStore.commands[cmdIdx], ...createdPauseCommands],
        };
      });

      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.status }
        );
      }

      return NextResponse.json({
        success: true,
        ack: result.ack,
        sessions: store.sessions,
        realtimeTopic,
      });
    }

    // 4. ACTION: TRANSFER PLAYBACK OWNERSHIP BETWEEN USICK ONE APP INSTANCES
    // When `toInstanceId === initiatorInstanceId` ("Putar di Sini"), the target device
    // has ALREADY verified its local player started playing before calling `transfer_app`.
    // When `toInstanceId !== initiatorInstanceId` (pushing transfer to another device),
    // we enqueue a `TRANSFER_PLAYBACK` command to `toInstanceId` and wait for its `ack: succeeded`
    // before pausing the source device!
    if (action === "transfer_app") {
      const fromInstanceId =
        typeof body.from_instance_id === "string" ? body.from_instance_id.trim() : "";
      const toInstanceId =
        typeof body.to_instance_id === "string" ? body.to_instance_id.trim() : "";
      const initiatorInstanceId =
        typeof body.initiator_instance_id === "string"
          ? body.initiator_instance_id.trim()
          : toInstanceId;
      const confirmedByTarget = Boolean(body.confirmed_by_target);
      const autoPlay = body.auto_play !== false;

      if (!toInstanceId) {
        return NextResponse.json(
          { success: false, error: "Target perangkat (to_instance_id) wajib diisi." },
          { status: 400 }
        );
      }

      const { store, result } = await mutateUserConnectStore<TransferMutationResult>(userId, (workingStore, nowMs) => {
        const nowIso = new Date(nowMs).toISOString();
        const targetIdx = workingStore.sessions.findIndex(
          (s) => s.session_instance_id === toInstanceId && s.user_id === userId
        );
        const targetSession = targetIdx >= 0 ? workingStore.sessions[targetIdx] : null;
        const seenMs = targetSession
          ? Date.parse(targetSession.last_seen_at || targetSession.updated_at)
          : NaN;
        const isTargetOnline =
          Boolean(targetSession?.is_connected) &&
          !Number.isNaN(seenMs) &&
          nowMs - seenMs <= DEVICE_STALE_THRESHOLD_MS;

        if (!targetSession || !isTargetOnline) {
          return {
            result: {
              ok: false,
              status: 404,
              code: "TARGET_OFFLINE",
              error: "Perangkat tujuan tidak ditemukan atau sedang offline.",
            },
          };
        }

        const sourceSession =
          workingStore.sessions.find((s) => s.session_instance_id === fromInstanceId) ||
          workingStore.sessions.find((s) => s.is_active_playback) ||
          workingStore.sessions.find((s) => s.is_playing) ||
          null;

        const trackToTransfer = body.track || sourceSession?.current_track_payload || null;
        const queueToTransfer = Array.isArray(body.queue)
          ? body.queue
          : sourceSession?.queue_payload || (trackToTransfer ? [trackToTransfer] : []);
        const progressMsToTransfer =
          typeof body.progress_ms === "number"
            ? body.progress_ms
            : sourceSession?.progress_ms || 0;

        // Case A: Initiated by the target device itself AFTER confirming local playback started
        if (initiatorInstanceId === toInstanceId && confirmedByTarget) {
          const createdPauseCommands: MusicConnectCommand[] = [];
          for (const s of workingStore.sessions) {
            if (s.session_instance_id === toInstanceId) {
              s.is_active_playback = true;
              if (trackToTransfer) {
                s.current_track_id = trackToTransfer.id;
                s.current_track_name = trackToTransfer.title;
                s.current_artist_name = Array.isArray(trackToTransfer.artistNames)
                  ? trackToTransfer.artistNames.join(", ")
                  : "";
                s.current_album_art = trackToTransfer.artworkUrl || null;
                s.current_track_payload = trackToTransfer;
              }
              s.queue_payload = queueToTransfer;
              s.progress_ms = progressMsToTransfer;
              s.is_playing = autoPlay;
              s.updated_at = nowIso;
            } else {
              if (s.is_active_playback || s.is_playing) {
                const pauseCmd: MusicConnectCommand = {
                  command_id: `cmd_xfer_pause_${nowMs.toString(36)}_${Math.random()
                    .toString(36)
                    .slice(2, 6)}`,
                  user_id: userId,
                  source_instance_id: toInstanceId,
                  source_device_name: workingStore.sessions[targetIdx].device_name,
                  target_instance_id: s.session_instance_id,
                  command_type: "PAUSE",
                  payload: { wasTransferred: true, newActiveInstanceId: toInstanceId },
                  status: "pending",
                  result_message: "Playback dipindahkan ke perangkat lain",
                  created_at: nowIso,
                  expires_at: new Date(nowMs + COMMAND_EXPIRATION_MS).toISOString(),
                  acknowledged_at: null,
                };
                workingStore.commands.push(pauseCmd);
                createdPauseCommands.push(pauseCmd);
              }
              s.is_active_playback = false;
              s.is_playing = false;
              s.updated_at = nowIso;
            }
          }

          return {
            result: {
              ok: true,
              status: 200,
              transferredTo: workingStore.sessions[targetIdx],
              transferCommand: null,
              track: trackToTransfer,
              queue: queueToTransfer,
              progressMs: progressMsToTransfer,
            },
            mirrorSession: workingStore.sessions[targetIdx],
            mirrorSessions: workingStore.sessions,
            mirrorCommands: createdPauseCommands,
          };
        }

        // Case B: Remote transfer push (Source -> Target).
        // Reuse client command_id if provided to prevent duplicate execution across WebSocket & HTTP poll
        const commandId =
          typeof body.command_id === "string" && body.command_id.trim()
            ? body.command_id.trim()
            : `cmd_xfer_play_${nowMs.toString(36)}_${Math.random()
                .toString(36)
                .slice(2, 6)}`;
        const transferCmd: MusicConnectCommand = {
          command_id: commandId,
          user_id: userId,
          source_instance_id: initiatorInstanceId,
          source_device_name: sourceSession?.device_name || "Perangkat Asal",
          target_instance_id: toInstanceId,
          command_type: "TRANSFER_PLAYBACK",
          payload: {
            track: trackToTransfer,
            queue: queueToTransfer,
            positionMs: progressMsToTransfer,
            positionSeconds: Math.max(0, progressMsToTransfer / 1000),
            autoPlay,
          },
          status: "pending",
          result_message: null,
          created_at: nowIso,
          expires_at: new Date(nowMs + COMMAND_EXPIRATION_MS).toISOString(),
          acknowledged_at: null,
        };
        workingStore.commands.push(transferCmd);

        return {
          result: {
            ok: true,
            status: 200,
            transferredTo: workingStore.sessions[targetIdx],
            transferCommand: transferCmd,
            track: trackToTransfer,
            queue: queueToTransfer,
            progressMs: progressMsToTransfer,
          },
          mirrorCommand: transferCmd,
          mirrorSessions: workingStore.sessions,
        };
      });

      if (!result.ok) {
        return NextResponse.json(
          { success: false, code: result.code, error: result.error },
          { status: result.status }
        );
      }

      return NextResponse.json({
        success: true,
        transferredTo: result.transferredTo,
        transferCommand: result.transferCommand,
        track: result.track,
        queue: result.queue,
        progressMs: result.progressMs,
        sessions: store.sessions,
        realtimeTopic,
      });
    }

    // 5. ACTION: OFFICIAL SPOTIFY CONNECT ACTION (TRANSFER / CONTROL)
    if (action === "spotify_action") {
      const spotifyAction = typeof body.spotify_action === "string" ? body.spotify_action : "";
      const result = await executeOfficialSpotifyAction({
        userId,
        spotifyAction,
        deviceId: typeof body.device_id === "string" ? body.device_id : undefined,
        play: typeof body.play === "boolean" ? body.play : true,
        positionMs: typeof body.position_ms === "number" ? body.position_ms : undefined,
        volumePercent: typeof body.volume_percent === "number" ? body.volume_percent : undefined,
      });

      const updatedSpotifyState = await fetchOfficialSpotifyConnectState(userId, true);

      return NextResponse.json(
        {
          success: result.ok,
          code: result.code,
          message: result.message,
          spotifyConnect: updatedSpotifyState,
        },
        { status: result.ok ? 200 : result.status }
      );
    }

    return NextResponse.json(
      { success: false, error: "Action tidak dikenali." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[music/connect] POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memproses Music Connect." },
      { status: 500 }
    );
  }
}
