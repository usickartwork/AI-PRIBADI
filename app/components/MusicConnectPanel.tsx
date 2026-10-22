"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AppDeviceSession,
  MusicConnectCommandPayload,
  MusicConnectCommandType,
  SpotifyConnectState,
  getInterpolatedRemoteProgressSec,
  isDeviceSessionOnline,
  setCustomDeviceName,
} from "@/lib/musicConnect";

function formatSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
}

export function DeviceTypeIcon({
  type,
  className = "w-5 h-5",
}: {
  type: string;
  className?: string;
}) {
  const lower = (type || "").toLowerCase();
  if (lower.includes("mobile") || lower.includes("smartphone") || lower.includes("iphone")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="7" y="2" width="10" height="20" rx="2.5" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 18h2" />
      </svg>
    );
  }
  if (lower.includes("tablet") || lower.includes("ipad")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="5" y="2" width="14" height="20" rx="2.5" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 18h2" />
      </svg>
    );
  }
  if (lower.includes("speaker") || lower.includes("avr") || lower.includes("audio")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="6" y="3" width="12" height="18" rx="2" strokeWidth={1.8} />
        <circle cx="12" cy="14" r="3" strokeWidth={1.8} />
        <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (
    lower.includes("computer") ||
    lower.includes("laptop") ||
    lower.includes("desktop") ||
    lower.includes("mac") ||
    lower.includes("pc")
  ) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 19h20" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="4" width="18" height="12" rx="2" strokeWidth={1.8} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2 20h20M9 16v4m6-4v4" />
    </svg>
  );
}

export function MusicConnectIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Left: Remote screen / computer bracket with base dot */}
      <path d="M8.5 7H5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 5 16h3.5" />
      <rect x="5.5" y="18.5" width="2" height="1.5" rx="0.4" fill="currentColor" stroke="none" />

      {/* Right: Speaker enclosure */}
      <rect x="11.5" y="3.5" width="8" height="16" rx="2.5" />
      <circle cx="15.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13.5" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── 1. Trigger Button Variants (Desktop Footer / Mobile Player / Mobile Mini Player) ──
interface MusicConnectButtonProps {
  isDark: boolean;
  isOpen: boolean;
  onClick: () => void;
  onlineOtherDevicesCount: number;
  remoteActiveDeviceName?: string | null;
  variant?: "desktop-footer" | "mobile-player" | "mini-player" | "header";
}

export function MusicConnectButton({
  isDark,
  isOpen,
  onClick,
  onlineOtherDevicesCount,
  remoteActiveDeviceName,
  variant = "desktop-footer",
}: MusicConnectButtonProps) {
  const hasRemoteActive = Boolean(remoteActiveDeviceName);
  const hasOtherOnline = onlineOtherDevicesCount > 0;

  // Mini-player on mobile (placed beside the Heart button)
  if (variant === "mini-player") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={
          remoteActiveDeviceName
            ? `Music Connect • Aktif di ${remoteActiveDeviceName}`
            : "Music Connect • Pilih Perangkat"
        }
        aria-label="Music Connect"
        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative active:scale-90 shrink-0 ml-1.5 ${
          isOpen || hasRemoteActive
            ? isDark
              ? "text-white"
              : "text-black"
            : isDark
            ? "text-zinc-400 hover:text-white"
            : "text-zinc-500 hover:text-black"
        }`}
      >
        <MusicConnectIcon className="w-5.5 h-5.5 shrink-0 translate-x-[1px]" />
        {(hasRemoteActive || hasOtherOnline) && (
          <span
            className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
              isDark ? "bg-white" : "bg-zinc-900"
            }`}
          />
        )}
      </button>
    );
  }

  // Full screen mobile player (bottom-left corner, matching Gambar 1)
  if (variant === "mobile-player") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={
          remoteActiveDeviceName
            ? `Music Connect • Aktif di ${remoteActiveDeviceName}`
            : "Music Connect • Pilih Perangkat"
        }
        aria-label="Music Connect"
        className={`p-3 rounded-2xl transition-all cursor-pointer relative active:scale-90 flex items-center gap-2 ${
          isOpen || hasRemoteActive
            ? isDark
              ? "text-white bg-white/10"
              : "text-black bg-black/10"
            : isDark
            ? "hover:text-white hover:bg-white/10 text-zinc-400"
            : "hover:text-black hover:bg-black/10 text-zinc-600"
        }`}
      >
        <MusicConnectIcon className="w-6 h-6 shrink-0" />
        {remoteActiveDeviceName && (
          <span className="text-xs font-semibold truncate max-w-[130px]">
            {remoteActiveDeviceName}
          </span>
        )}
        {(hasRemoteActive || hasOtherOnline) && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isDark ? "bg-white" : "bg-zinc-900"
            }`}
          />
        )}
      </button>
    );
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={
          remoteActiveDeviceName
            ? `Music Connect • Aktif di ${remoteActiveDeviceName}`
            : "Music Connect • Perangkat Pemutaran"
        }
        aria-label="Music Connect"
        className={`relative flex h-9 sm:h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
          isOpen || hasRemoteActive
            ? isDark
              ? "bg-white text-black shadow-white/10 font-bold"
              : "bg-black text-white shadow-black/10 font-bold"
            : isDark
            ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
            : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
        }`}
      >
        <MusicConnectIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        {(hasRemoteActive || hasOtherOnline) && (
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isOpen || hasRemoteActive
                ? isDark
                  ? "bg-black"
                  : "bg-white"
                : isDark
                ? "bg-white"
                : "bg-black"
            }`}
          />
        )}
      </button>
    );
  }

  // Default: desktop-footer player
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer relative shrink-0 ${
        isOpen || hasRemoteActive
          ? isDark
            ? "text-white bg-white/15 font-bold"
            : "text-black bg-black/10 font-bold"
          : isDark
          ? "text-zinc-400 hover:text-white"
          : "text-zinc-600 hover:text-black"
      }`}
      title={
        remoteActiveDeviceName
          ? `Music Connect • Aktif di ${remoteActiveDeviceName}`
          : "Music Connect • Pilih Perangkat Pemutaran"
      }
      aria-label="Music Connect"
    >
      <MusicConnectIcon className="w-5 h-5 shrink-0 translate-x-[0.5px]" />
      {(hasRemoteActive || hasOtherOnline) && (
        <span
          className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
            isOpen || hasRemoteActive
              ? isDark
                ? "bg-white"
                : "bg-black"
              : isDark
              ? "bg-zinc-300"
              : "bg-zinc-700"
          }`}
        />
      )}
    </button>
  );
}

// ─── 2. Remote Active Playback Bar (Displayed when another device is playing) ─
interface MusicConnectRemoteBarProps {
  isDark: boolean;
  remoteSession: AppDeviceSession;
  hasLocalTrack: boolean;
  isSendingCommand: boolean;
  autoplayBlockedPrompt: boolean;
  onUnlockAutoplay: () => void;
  onSendCommand: (
    targetInstanceId: string,
    commandType: MusicConnectCommandType,
    payload?: MusicConnectCommandPayload
  ) => void;
  onTransferHere: (fromSession: AppDeviceSession) => void;
  onOpenConnectModal: () => void;
}

export function MusicConnectRemoteBar({
  isDark,
  remoteSession,
  hasLocalTrack,
  isSendingCommand,
  autoplayBlockedPrompt,
  onUnlockAutoplay,
  onSendCommand,
  onTransferHere,
  onOpenConnectModal,
}: MusicConnectRemoteBarProps) {
  const durationSec = Math.max(1, (remoteSession.duration_ms || 0) / 1000);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [userSeekSec, setUserSeekSec] = useState<number | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!remoteSession.is_playing) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(timer);
  }, [remoteSession.is_playing]);

  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    };
  }, []);

  const displayProgressSec =
    userSeekSec !== null
      ? userSeekSec
      : getInterpolatedRemoteProgressSec(remoteSession, nowMs);

  const pct = Math.max(0, Math.min(100, (displayProgressSec / durationSec) * 100));

  return (
    <div
      className={`w-full transition-all select-none border-t ${
        isDark
          ? "bg-[#121215] border-white/10 text-white"
          : "bg-[#fafafc] border-black/10 text-zinc-900"
      } pb-[max(0.5rem,calc(env(safe-area-inset-bottom)+0.25rem))]`}
    >
      {/* Interactive Remote Progress Scrubber */}
      <div
        className={`w-full h-1 cursor-pointer relative overflow-hidden ${
          isDark ? "bg-white/10" : "bg-black/10"
        }`}
        title="Klik untuk menggeser posisi lagu di perangkat aktif"
        onClick={(e) => {
          if (durationSec <= 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const targetSec = clickPct * durationSec;
          setUserSeekSec(targetSec);
          if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
          seekTimeoutRef.current = setTimeout(() => {
            setUserSeekSec(null);
          }, 1500);
          onSendCommand(remoteSession.session_instance_id, "SEEK", {
            positionSeconds: targetSec,
            positionMs: Math.round(targetSec * 1000),
          });
        }}
      >
        <div
          className={`h-full ${
            remoteSession.is_playing ? "transition-[width] duration-250 ease-linear" : ""
          } ${isDark ? "bg-white" : "bg-zinc-900"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Autoplay Unlock Banner for iOS / Mobile Safari after Transfer */}
      <div
        className={`transition-all duration-200 ease-out overflow-hidden ${
          autoplayBlockedPrompt
            ? "max-h-16 opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        {autoplayBlockedPrompt && (
          <div
            className={`px-4 py-2 flex items-center justify-between gap-3 text-xs border-b ${
              isDark
                ? "bg-white/10 border-white/10 text-white"
                : "bg-black/5 border-black/10 text-zinc-900"
            }`}
          >
            <span className="font-medium truncate">
              Browser memerlukan sentuhan untuk mulai memutar audio di perangkat ini.
            </span>
            <button
              type="button"
              onClick={onUnlockAutoplay}
              className={`px-3 py-1 rounded-lg font-bold text-xs shrink-0 cursor-pointer transition ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "bg-black text-white hover:bg-zinc-800"
              }`}
            >
              Aktifkan Audio
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-8 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Device Indicator + Remote Track Meta */}
        <div
          onClick={onOpenConnectModal}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
        >
          {remoteSession.current_album_art ? (
            <img
              src={remoteSession.current_album_art}
              alt={remoteSession.current_track_name || "Lagu"}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shrink-0 shadow-sm"
            />
          ) : (
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center ${
                isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              <DeviceTypeIcon type={remoteSession.device_type} className="w-4.5 h-4.5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  remoteSession.is_playing
                    ? isDark ? "bg-white" : "bg-black"
                    : isDark ? "bg-white/40" : "bg-black/40"
                }`}
              />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-tight truncate">
                {remoteSession.is_playing ? "Sedang diputar di" : "Terakhir aktif di"}{" "}
                <span className="font-bold">{remoteSession.device_name}</span>
              </span>
            </div>
            <p className="text-xs font-semibold truncate mt-0.5">
              {remoteSession.current_track_name || "Lagu aktif"}
              {remoteSession.current_artist_name
                ? ` • ${remoteSession.current_artist_name}`
                : ""}
              <span className="hidden sm:inline text-[10px] font-mono text-zinc-400 ml-2">
                {formatSec(displayProgressSec)} / {formatSec(durationSec)}
              </span>
            </p>
          </div>
        </div>

        {/* Center/Right: Remote Playback Controls + Transfer Here Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Remote Previous */}
          <button
            type="button"
            onClick={() => onSendCommand(remoteSession.session_instance_id, "PREVIOUS")}
            className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer active:scale-95 ${
              isDark ? "text-zinc-300 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-black hover:bg-black/5"
            }`}
            title={`Lagu sebelumnya di ${remoteSession.device_name}`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Remote Play / Pause */}
          <button
            type="button"
            onClick={() =>
              onSendCommand(
                remoteSession.session_instance_id,
                remoteSession.is_playing ? "PAUSE" : "PLAY"
              )
            }
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition cursor-pointer active:scale-95 shadow-sm ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
            title={
              remoteSession.is_playing
                ? `Jeda di ${remoteSession.device_name}`
                : `Putar di ${remoteSession.device_name}`
            }
          >
            {remoteSession.is_playing ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6z M14 4h4v16h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                <polygon points="6 4, 18 12, 6 20" />
              </svg>
            )}
          </button>

          {/* Remote Next */}
          <button
            type="button"
            onClick={() => onSendCommand(remoteSession.session_instance_id, "NEXT")}
            className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer active:scale-95 ${
              isDark ? "text-zinc-300 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-black hover:bg-black/5"
            }`}
            title={`Lagu berikutnya di ${remoteSession.device_name}`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* 1-Click Transfer to This Device */}
          <button
            type="button"
            disabled={isSendingCommand}
            onClick={() => onTransferHere(remoteSession)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
              isDark
                ? "border-white/20 bg-white/10 hover:bg-white hover:text-black text-white"
                : "border-black/15 bg-black/5 hover:bg-black hover:text-white text-zinc-900"
            }`}
            title="Pindahkan pemutaran musik ke perangkat ini"
          >
            Putar di Sini
          </button>

          {/* Open Device Selector Panel */}
          <button
            type="button"
            onClick={onOpenConnectModal}
            className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer ${
              isDark ? "text-zinc-300 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-black hover:bg-black/5"
            }`}
            title="Daftar Perangkat Music Connect"
          >
            <MusicConnectIcon className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 3. Full Music Connect Device Panel Content (Strictly Device List Only) ───
export interface MusicConnectPanelContentProps {
  isDark: boolean;
  onClose: () => void;
  localInstanceId: string;
  localDeviceName: string;
  onRenameLocalDevice: (newName: string) => void;
  sessions: AppDeviceSession[];
  activeSession: AppDeviceSession | null;
  spotifyConnect?: SpotifyConnectState | null;
  isLoadingDevices: boolean;
  isSendingCommand: boolean;
  commandFeedback: {
    type: "pending" | "success" | "error";
    text: string;
  } | null;
  onRefreshDevices: (forceSpotify?: boolean) => void;
  onSendAppCommand: (
    targetInstanceId: string,
    commandType: MusicConnectCommandType,
    payload?: MusicConnectCommandPayload
  ) => void;
  onTransferAppPlayback: (targetInstanceId: string, autoPlay?: boolean) => void;
  onExecuteSpotifyAction?: (params: {
    spotifyAction: "TRANSFER" | "PLAY" | "PAUSE" | "NEXT" | "PREVIOUS" | "SEEK" | "VOLUME";
    deviceId?: string;
    play?: boolean;
    positionMs?: number;
    volumePercent?: number;
  }) => void;
  onJamClick?: () => void;
}

export interface MusicConnectModalProps extends MusicConnectPanelContentProps {
  isOpen: boolean;
}

export function MusicConnectContent({
  isDark,
  onClose,
  localInstanceId,
  localDeviceName,
  onRenameLocalDevice,
  sessions,
  activeSession,
  isLoadingDevices,
  isSendingCommand,
  commandFeedback,
  onRefreshDevices,
  onSendAppCommand,
  onTransferAppPlayback,
}: MusicConnectPanelContentProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(localDeviceName);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [panelVolume, setPanelVolume] = useState<number>(80);

  useEffect(() => {
    setNameInput(localDeviceName);
  }, [localDeviceName]);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onlineSessions = sessions.filter((s) => isDeviceSessionOnline(s, nowMs));

  // Determine if a remote session is actively playing or owns playback
  const remoteControllableSession =
    activeSession &&
    activeSession.session_instance_id !== localInstanceId &&
    isDeviceSessionOnline(activeSession, nowMs)
      ? activeSession
      : onlineSessions.find(
          (s) => s.session_instance_id !== localInstanceId && (s.is_playing || s.current_track_id)
        ) || null;

  // The local session
  const localSession = onlineSessions.find((s) => s.session_instance_id === localInstanceId);
  const isLocalPlaying = Boolean(localSession?.is_playing);

  // Is another remote device currently active/playing?
  const isRemoteActive = Boolean(
    remoteControllableSession &&
      (remoteControllableSession.is_playing || remoteControllableSession.is_active_playback)
  );

  // Currently active device in the top card
  const activeSessionDisplay = isRemoteActive ? remoteControllableSession : localSession;
  const isCurrentDeviceLocal = !isRemoteActive;

  useEffect(() => {
    if (typeof activeSessionDisplay?.volume_percent === "number") {
      setPanelVolume(activeSessionDisplay.volume_percent);
    }
  }, [activeSessionDisplay?.volume_percent]);

  // Build the list of switchable devices (devices user can click to switch playback to).
  // CRITICAL: NEVER include the currently active playback device in this list!
  // If remote is playing, THIS local device MUST be in the switchable list as "Perangkat ini".
  // If local is playing, all other remote devices are in the switchable list.
  interface SwitchableDeviceItem {
    id: string;
    name: string;
    type: string;
    platform: string;
    browser: string;
    isLocal: boolean;
    isPlaying: boolean;
    currentTrack?: string | null;
    currentArtist?: string | null;
  }

  const switchableDevices: SwitchableDeviceItem[] = [];

  if (isRemoteActive) {
    // Add local device as a switch target
    switchableDevices.push({
      id: localInstanceId,
      name: localDeviceName,
      type: localSession?.device_type || "mobile",
      platform: localSession?.platform || "Web",
      browser: localSession?.browser || "Browser",
      isLocal: true,
      isPlaying: false,
      currentTrack: null,
      currentArtist: null,
    });
  }

  for (const s of onlineSessions) {
    if (s.session_instance_id === localInstanceId) continue;
    if (activeSessionDisplay && s.session_instance_id === activeSessionDisplay.session_instance_id) {
      continue;
    }
    switchableDevices.push({
      id: s.session_instance_id,
      name: s.device_name,
      type: s.device_type,
      platform: s.platform || "Web",
      browser: s.browser || "Browser",
      isLocal: false,
      isPlaying: Boolean(s.is_playing),
      currentTrack: s.current_track_name,
      currentArtist: s.current_artist_name,
    });
  }

  const handleSaveDeviceName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim().slice(0, 40);
    if (cleaned) {
      setCustomDeviceName(cleaned);
      onRenameLocalDevice(cleaned);
    }
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* ─── HEADER ─── */}
      <div
        className={`flex items-center justify-between px-5 min-h-[56px] border-b shrink-0 ${
          isDark ? "border-white/10" : "border-black/10"
        }`}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold tracking-tight">Connect</h3>
          {isLoadingDevices && (
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0 opacity-70" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isDark ? "hover:bg-white/10 text-zinc-400 hover:text-white" : "hover:bg-black/10 text-zinc-600 hover:text-black"
            }`}
            title="Tutup Connect"
            aria-label="Tutup Connect"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── SCROLLABLE BODY (DEVICE LIST ONLY) ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain">
        {/* Real-time Command Feedback Notification (strictly theme colors, borderless) */}
        {commandFeedback && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 shadow-xs transition-colors duration-150 ${
              isDark
                ? "bg-white/10 text-white"
                : "bg-black/5 text-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {commandFeedback.type === "pending" ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <svg className="w-4 h-4 shrink-0 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className="truncate">{commandFeedback.text}</span>
            </div>
          </div>
        )}

        {/* ─── CARD: CURRENT ACTIVE DEVICE (Borderless, Clean) ─── */}
        <div
          className={`p-4 rounded-2xl transition-all ${
            isDark
              ? "bg-[#18181f] text-white"
              : "bg-zinc-100 text-zinc-900"
          }`}
        >
          {activeSessionDisplay ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {isCurrentDeviceLocal && isEditingName ? (
                    <form onSubmit={handleSaveDeviceName} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Nama perangkat"
                        maxLength={35}
                        className={`w-full rounded-xl px-2.5 py-1 text-xs outline-none ${
                          isDark
                            ? "bg-zinc-950 text-white"
                            : "bg-white text-zinc-900"
                        }`}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
                          isDark ? "bg-white text-black" : "bg-black text-white"
                        }`}
                      >
                        Simpan
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold truncate">
                        {isCurrentDeviceLocal
                          ? localDeviceName || "Perangkat ini"
                          : activeSessionDisplay.device_name}
                      </span>
                      {isCurrentDeviceLocal ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="text-zinc-400 hover:text-white transition cursor-pointer"
                          title="Ubah nama perangkat"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      ) : (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            isDark ? "bg-white/15 text-white" : "bg-black/10 text-black"
                          }`}
                        >
                          Aktif
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-zinc-400 truncate mt-1">
                    {activeSessionDisplay.current_track_name
                      ? `${activeSessionDisplay.current_track_name}${
                          activeSessionDisplay.current_artist_name
                            ? ` — ${activeSessionDisplay.current_artist_name}`
                            : ""
                        }`
                      : isCurrentDeviceLocal
                      ? isLocalPlaying
                        ? "Sedang memutar di perangkat ini"
                        : "Perangkat ini • Tersedia"
                      : "Sedang memutar di perangkat ini"}
                  </p>
                </div>

                {/* Right: Device Icon (Borderless) */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isDark
                      ? "bg-white/10 text-white"
                      : "bg-black/5 text-zinc-900"
                  }`}
                >
                  <DeviceTypeIcon
                    type={activeSessionDisplay.device_type}
                    className="w-6 h-6"
                  />
                </div>
              </div>

              {/* Remote Desktop Volume Control: Auto-appears on phone when active playing device is desktop */}
              {isRemoteActive && activeSessionDisplay.device_type === "desktop" && (
                <div className={`pt-3 mt-1 border-t space-y-2 ${
                  isDark ? "border-white/10" : "border-black/10"
                }`}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={`flex items-center gap-1.5 ${isDark ? "text-white" : "text-zinc-900"}`}>
                      <svg className="w-3.5 h-3.5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Volume {activeSessionDisplay.device_name}
                    </span>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isDark ? "bg-white/10 text-white" : "bg-black/10 text-zinc-900"
                    }`}>
                      {panelVolume}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = panelVolume > 0 ? 0 : 80;
                        setPanelVolume(nextVal);
                        onSendAppCommand?.(activeSessionDisplay.session_instance_id, "SET_VOLUME", {
                          volumePercent: nextVal,
                        });
                      }}
                      className={`p-1 shrink-0 cursor-pointer transition ${
                        isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
                      }`}
                      title={panelVolume === 0 ? "Bunyikan" : "Bisukan"}
                    >
                      {panelVolume === 0 ? (
                        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={panelVolume}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPanelVolume(val);
                        onSendAppCommand?.(activeSessionDisplay.session_instance_id, "SET_VOLUME", {
                          volumePercent: val,
                        });
                      }}
                      className={`flex-1 h-1.5 rounded-full cursor-pointer ${
                        isDark ? "bg-white/15 accent-white" : "bg-black/15 accent-black"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-zinc-400">Tidak ada perangkat aktif</div>
          )}
        </div>

        {/* ─── SECTION: PUTAR DI PERANGKATMU ─── */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Putar di perangkatmu
            </h4>
            {switchableDevices.length > 0 && (
              <span className="text-[11px] text-zinc-500 font-medium">
                {switchableDevices.length} tersedia
              </span>
            )}
          </div>

          {/* List of switchable devices: NO separate buttons, borderless rows */}
          {switchableDevices.length > 0 ? (
            <div className="space-y-2">
              {switchableDevices.map((dev) => (
                <div
                  key={dev.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onTransferAppPlayback(dev.id, true)}
                  className={`group p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                    isDark
                      ? "bg-zinc-900/60 hover:bg-zinc-800/80 text-white"
                      : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900"
                  }`}
                  title={`Ketuk untuk memindahkan pemutaran ke ${dev.name}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                        isDark
                          ? "bg-zinc-800 text-zinc-300 group-hover:bg-white group-hover:text-black"
                          : "bg-zinc-200 text-zinc-700 group-hover:bg-black group-hover:text-white"
                      }`}
                    >
                      <DeviceTypeIcon type={dev.type} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          {dev.name}
                        </span>
                        {dev.isLocal && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isDark ? "bg-white/15 text-white" : "bg-black/10 text-black"
                            }`}
                          >
                            Perangkat ini
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {dev.isLocal
                          ? "Ketuk untuk beralih ke perangkat ini"
                          : dev.currentTrack
                          ? `${dev.currentTrack}${dev.currentArtist ? ` — ${dev.currentArtist}` : ""}`
                          : `${dev.platform} • ${dev.browser} • Siap memutar`}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center text-zinc-400 group-hover:text-current transition pr-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* If NO other switchable devices exist: Clean borderless informational state */
            <div
              className={`py-8 px-4 rounded-2xl text-center space-y-1.5 ${
                isDark ? "bg-zinc-900/40 text-zinc-400" : "bg-zinc-100 text-zinc-600"
              }`}
            >
              <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-zinc-500/10 text-zinc-400">
                <MusicConnectIcon className="w-5 h-5" />
              </div>
              <p className={`text-sm font-semibold pt-1 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                Tidak ada perangkat lain ditemukan
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
                Buka web ini di perangkat lain dengan akun yang sama untuk mendengarkan dan mengontrol bersama.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 4. Desktop Side Panel Component ──────────────────────────────────────────
export function MusicConnectSidePanel(props: MusicConnectPanelContentProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <MusicConnectContent {...props} />
    </div>
  );
}

// ─── 5. Mobile Bottom Sheet Modal Component (< sm screens, Gambar 2) ──────────
export function MusicConnectModal({
  isOpen,
  isDark,
  onClose,
  ...rest
}: MusicConnectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="sm:hidden fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-h-[85vh] flex flex-col rounded-t-[28px] border-t border-x shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom ${
          isDark
            ? "bg-[#16161a] border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        } pb-[max(1rem,env(safe-area-inset-bottom))]`}
      >
        {/* Mobile Drag Handle (Matching Gambar 2) */}
        <div className="w-10 h-1 rounded-full bg-zinc-500/40 mx-auto mt-3 mb-1 shrink-0" />
        <MusicConnectContent isDark={isDark} onClose={onClose} {...rest} />
      </div>
    </div>
  );
}
