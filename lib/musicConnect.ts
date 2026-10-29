// ============================================================================
// USICK ONE — MUSIC CONNECT CORE LIBRARY
// Isolated module for Multi-Device Playback Awareness, Remote Control,
// Transfer Playback, and Official Spotify Connect Device Integration.
// ============================================================================

import { MusicItem } from "./music";

export type DeviceCategory = "desktop" | "mobile" | "tablet";

export type MusicConnectCommandType =
  | "PLAY"
  | "PAUSE"
  | "TOGGLE_PLAY"
  | "NEXT"
  | "PREVIOUS"
  | "SEEK"
  | "SET_VOLUME"
  | "SHUFFLE"
  | "REPEAT"
  | "TRANSFER_PLAYBACK"
  | "PLAY_TRACK"
  | "ADD_TO_QUEUE";

export type CommandLifecycleStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "expired";

/**
 * Represents a Usick One application browser/device instance.
 * Explicitly separates `session_instance_id` (app instance) from `spotify_device_id` (Spotify SDK/Connect ID).
 */
export interface AppDeviceSession {
  user_id: string;
  session_instance_id: string;
  spotify_device_id: string | null;
  device_name: string;
  device_type: DeviceCategory;
  platform: string;
  browser: string;
  is_connected: boolean;
  is_active_playback: boolean;
  can_control: boolean;
  can_transfer_playback: boolean;
  current_track_id: string | null;
  current_track_name: string | null;
  current_artist_name: string | null;
  current_album_art: string | null;
  current_track_payload: MusicItem | null;
  queue_payload?: MusicItem[];
  is_playing: boolean;
  progress_ms: number;
  duration_ms: number;
  volume_percent: number;
  shuffle_state: boolean;
  repeat_state: "off" | "all" | "one";
  last_seen_at: string;
  updated_at: string;
}

/**
 * Represents an official Spotify Connect device returned by Spotify Web API
 * GET https://api.spotify.com/v1/me/player/devices
 */
export interface SpotifyConnectDevice {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
  supports_volume: boolean;
}

export type SpotifyConnectStatus =
  | "connected"
  | "no_user_token"
  | "premium_required"
  | "insufficient_scope"
  | "rate_limited"
  | "error";

export interface SpotifyConnectState {
  status: SpotifyConnectStatus;
  message: string;
  devices: SpotifyConnectDevice[];
  activeDeviceId: string | null;
  activeDeviceName: string | null;
  isPlaying: boolean;
  trackId: string | null;
  trackName: string | null;
  artistName: string | null;
  albumArt: string | null;
  progressMs: number;
  durationMs: number;
  volumePercent: number | null;
  checkedAt: string;
}

export interface MusicConnectCommandPayload {
  positionSeconds?: number;
  positionMs?: number;
  volumePercent?: number;
  shuffle?: boolean;
  repeatMode?: "off" | "all" | "one";
  track?: MusicItem | null;
  queue?: MusicItem[];
  autoPlay?: boolean;
  wasTransferred?: boolean;
  newActiveInstanceId?: string;
}

export interface MusicConnectCommand {
  command_id: string;
  user_id: string;
  source_instance_id: string;
  source_device_name: string;
  target_instance_id: string;
  command_type: MusicConnectCommandType;
  payload: MusicConnectCommandPayload;
  status: CommandLifecycleStatus;
  result_message?: string | null;
  created_at: string;
  expires_at: string;
  acknowledged_at?: string | null;
}

export interface MusicConnectAck {
  command_id: string;
  user_id: string;
  source_instance_id: string;
  target_instance_id: string;
  command_type: MusicConnectCommandType;
  status: "succeeded" | "failed";
  result_message: string;
  acknowledged_at: string;
  session?: AppDeviceSession;
}

// ─── Constants & Timing ──────────────────────────────────────────────────────
export const DEVICE_STALE_THRESHOLD_MS = 45_000; // 45s without heartbeat = offline
export const COMMAND_EXPIRATION_MS = 15_000; // 15s TTL for remote commands

const SESSION_TAB_KEY = "usick_music_connect_tab_instance_id_v1";
const LOCAL_BASE_KEY = "usick_music_connect_device_base_id_v1";
const CUSTOM_NAME_KEY = "usick_music_connect_custom_name_v1";
const FEATURE_DISABLE_KEY = "usick_disable_music_connect";

/**
 * Feature flag check:
 * Enabled by default unless NEXT_PUBLIC_ENABLE_MUSIC_CONNECT === "false"
 * or localStorage `usick_disable_music_connect === "true"`.
 */
export function isMusicConnectEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_MUSIC_CONNECT === "false") {
    return false;
  }
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(FEATURE_DISABLE_KEY) === "true") {
        return false;
      }
    } catch {}
  }
  return true;
}

/**
 * Extracts the base physical device identifier from any session_instance_id
 * (e.g. "dev_abc123_tab_xyz" -> "dev_abc123", or "dev_abc123" -> "dev_abc123").
 */
export function getDeviceBaseId(instanceId?: string | null): string {
  if (!instanceId) return "";
  const idx = instanceId.indexOf("_tab_");
  return idx > 0 ? instanceId.slice(0, idx) : instanceId;
}

/**
 * Generates or retrieves the persistent session_instance_id for this physical browser/device.
 * Stored in localStorage so it remains constant across tabs and browser restarts,
 * preventing phantom duplicate devices or playback interception on tab re-entry.
 */
export function getOrCreateInstanceId(): string {
  if (typeof window === "undefined") {
    return "server-instance";
  }

  try {
    // Clear legacy tab session storage to ensure clean migration to persistent deviceBase
    try {
      window.sessionStorage.removeItem(SESSION_TAB_KEY);
    } catch {}

    let deviceBase = window.localStorage.getItem(LOCAL_BASE_KEY);
    if (!deviceBase || deviceBase.length < 6) {
      deviceBase = `dev_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
      window.localStorage.setItem(LOCAL_BASE_KEY, deviceBase);
    }

    return deviceBase;
  } catch {
    return `inst_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getCustomDeviceName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const custom = window.localStorage.getItem(CUSTOM_NAME_KEY);
    return custom && custom.trim() ? custom.trim() : null;
  } catch {
    return null;
  }
}

export function setCustomDeviceName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = name.trim().slice(0, 40);
    if (trimmed) {
      window.localStorage.setItem(CUSTOM_NAME_KEY, trimmed);
    } else {
      window.localStorage.removeItem(CUSTOM_NAME_KEY);
    }
  } catch {}
}

/**
 * Detects human-readable device name, category, platform, and browser.
 */
export function detectDeviceInfo(instanceId?: string): {
  deviceName: string;
  deviceType: DeviceCategory;
  platform: string;
  browser: string;
} {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      deviceName: "Web Browser",
      deviceType: "desktop",
      platform: "Web",
      browser: "Browser",
    };
  }

  const ua = navigator.userAgent || "";
  const navPlatform = ((navigator as any).platform || "").toLowerCase();
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const screenMinDim =
    typeof window !== "undefined" && window.screen
      ? Math.min(window.screen.width, window.screen.height)
      : 1024;
  const isTouchScreen = maxTouchPoints > 0;

  let platform = "Desktop";
  let deviceType: DeviceCategory = "desktop";

  // iOS detection (iPhone, iPod, iPad)
  // Handles iPhone in Desktop Mode (which reports Macintosh in UA, but has touch and phone screen width < 600)
  const isIPhoneExplicit =
    /iPhone|iPod/i.test(ua) ||
    navPlatform.includes("iphone") ||
    navPlatform.includes("ipod");
  const isIPadExplicit = /iPad/i.test(ua) || navPlatform.includes("ipad");
  const isAppleTouch =
    (/Macintosh|Mac OS X/i.test(ua) || navPlatform.includes("mac")) && isTouchScreen;

  if (isIPhoneExplicit || (isAppleTouch && screenMinDim < 600)) {
    platform = "iPhone";
    deviceType = "mobile";
  } else if (isIPadExplicit || (isAppleTouch && screenMinDim >= 600)) {
    platform = "iPad";
    deviceType = "tablet";
  } else if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua) || screenMinDim < 600) {
      platform = "Android";
      deviceType = "mobile";
    } else {
      platform = "Tablet Android";
      deviceType = "tablet";
    }
  } else if (/Macintosh|Mac OS X/i.test(ua) || navPlatform.includes("mac")) {
    platform = "Mac";
    deviceType = "desktop";
  } else if (/Windows/i.test(ua) || navPlatform.includes("win")) {
    platform = "Windows";
    deviceType = "desktop";
  } else if (/Linux/i.test(ua) || navPlatform.includes("linux")) {
    platform = "Linux";
    deviceType = "desktop";
  }

  let browser = "Browser";
  if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = "Chrome";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Safari";
  }

  const customName = getCustomDeviceName();
  const shortTag = instanceId ? instanceId.slice(-3).toUpperCase() : "";
  const defaultName = `${platform} • ${browser}${shortTag ? ` (${shortTag})` : ""}`;

  return {
    deviceName: customName || defaultName,
    deviceType,
    platform,
    browser,
  };
}

/**
 * Checks whether a device session is currently online based on its `last_seen_at` timestamp.
 */
export function isDeviceSessionOnline(
  session: Pick<AppDeviceSession, "is_connected" | "last_seen_at">,
  nowMs: number = Date.now()
): boolean {
  if (!session.is_connected) return false;
  const seenMs = Date.parse(session.last_seen_at);
  if (Number.isNaN(seenMs)) return false;
  return nowMs - seenMs <= DEVICE_STALE_THRESHOLD_MS;
}

/**
 *Interpolates remote playback progress smoothly between heartbeats/broadcasts.
 */
export function getInterpolatedRemoteProgressSec(
  session: Pick<AppDeviceSession, "is_playing" | "progress_ms" | "duration_ms" | "updated_at">,
  nowMs: number = Date.now()
): number {
  const baseSec = Math.max(0, (session.progress_ms || 0) / 1000);
  const maxSec = session.duration_ms > 0 ? session.duration_ms / 1000 : 0;
  if (!session.is_playing) {
    return maxSec > 0 ? Math.min(baseSec, maxSec) : baseSec;
  }
  const updatedMs = Date.parse(session.updated_at);
  if (Number.isNaN(updatedMs)) {
    return baseSec;
  }
  const elapsedSec = Math.max(0, Math.min(30, (nowMs - updatedMs) / 1000));
  const estimated = baseSec + elapsedSec;
  return maxSec > 0 ? Math.min(estimated, maxSec) : estimated;
}

export function createCommandEnvelope(params: {
  userId: string;
  sourceInstanceId: string;
  sourceDeviceName: string;
  targetInstanceId: string;
  commandType: MusicConnectCommandType;
  payload?: MusicConnectCommandPayload;
}): MusicConnectCommand {
  const now = Date.now();
  const cmdId = `cmd_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    command_id: cmdId,
    user_id: params.userId,
    source_instance_id: params.sourceInstanceId,
    source_device_name: params.sourceDeviceName,
    target_instance_id: params.targetInstanceId,
    command_type: params.commandType,
    payload: params.payload || {},
    status: "pending",
    result_message: null,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + COMMAND_EXPIRATION_MS).toISOString(),
    acknowledged_at: null,
  };
}

