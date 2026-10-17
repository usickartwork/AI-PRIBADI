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

function DeviceTypeIcon({
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
  if (lower.includes("computer") || lower.includes("laptop") || lower.includes("desktop") || lower.includes("mac") || lower.includes("pc")) {
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

// ─── 1. Trigger Button (Header / Desktop Footer / Mobile Full Player) ─────────
interface MusicConnectButtonProps {
  isDark: boolean;
  isOpen: boolean;
  onClick: () => void;
  onlineOtherDevicesCount: number;
  remoteActiveDeviceName?: string | null;
  variant?: "header" | "desktop-footer" | "mobile-player";
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
        {remoteActiveDeviceName ? (
          <span className="hidden md:inline text-[11px] font-bold max-w-[130px] truncate">
            {remoteActiveDeviceName}
          </span>
        ) : onlineOtherDevicesCount > 0 ? (
          <span className="text-[10px] font-bold">{onlineOtherDevicesCount + 1}</span>
        ) : null}

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

  if (variant === "mobile-player") {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Music Connect • Perangkat"
        aria-label="Music Connect"
        className={`px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer relative active:scale-90 flex items-center gap-2 ${
          isOpen || hasRemoteActive
            ? isDark
              ? "bg-white text-black shadow-md font-bold"
              : "bg-black text-white shadow-md font-bold"
            : isDark
            ? "hover:text-white hover:bg-white/10 text-zinc-300 bg-white/5"
            : "hover:text-black hover:bg-black/10 text-zinc-700 bg-black/5"
        }`}
      >
        <MusicConnectIcon className="w-5 h-5 shrink-0" />
        <span className="text-[11px] font-semibold truncate max-w-[120px]">
          {remoteActiveDeviceName ? remoteActiveDeviceName : "Perangkat"}
        </span>
        {(hasRemoteActive || hasOtherOnline) && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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

  // Default: desktop-footer
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 transition cursor-pointer relative ${
        isOpen || hasRemoteActive
          ? isDark
            ? "text-white bg-white/15 rounded-xl font-bold"
            : "text-black bg-black/10 rounded-xl font-bold"
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
      <MusicConnectIcon className="w-5 h-5" />
      {(hasRemoteActive || hasOtherOnline) && (
        <span
          className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
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

  // Smooth monotonic tick while remote session is actively playing (every 250ms)
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
                  remoteSession.is_playing ? "bg-emerald-500" : isDark ? "bg-white/40" : "bg-black/40"
                }`}
              />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-tight truncate">
                {remoteSession.is_playing ? "Sedang diputar di" : "Terakhir aktif di"}{" "}
                <span className="underline decoration-dotted">{remoteSession.device_name}</span>
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

// ─── 3. Full Music Connect Device Panel (Desktop Side Panel / Mobile Bottom Sheet) ─
export interface MusicConnectPanelContentProps {
  isDark: boolean;
  onClose: () => void;
  localInstanceId: string;
  localDeviceName: string;
  onRenameLocalDevice: (newName: string) => void;
  sessions: AppDeviceSession[];
  activeSession: AppDeviceSession | null;
  spotifyConnect: SpotifyConnectState | null;
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
  onExecuteSpotifyAction: (params: {
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
  spotifyConnect,
  isLoadingDevices,
  isSendingCommand,
  commandFeedback,
  onRefreshDevices,
  onSendAppCommand,
  onTransferAppPlayback,
  onExecuteSpotifyAction,
  onJamClick,
}: MusicConnectPanelContentProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(localDeviceName);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    setNameInput(localDeviceName);
  }, [localDeviceName]);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onlineSessions = sessions.filter((s) => isDeviceSessionOnline(s, nowMs));
  const offlineSessions = sessions.filter((s) => !isDeviceSessionOnline(s, nowMs));

  // Determine which session is actively playing or controllable
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

  // Other online devices (excluding local device and current active remote session)
  const otherOnlineSessions = onlineSessions.filter(
    (s) =>
      s.session_instance_id !== localInstanceId &&
      (!remoteControllableSession || s.session_instance_id !== remoteControllableSession.session_instance_id)
  );

  const handleSaveDeviceName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim().slice(0, 40);
    setCustomDeviceName(cleaned);
    onRenameLocalDevice(cleaned);
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* ─── HEADER (Matching Image 1) ─── */}
      <div
        className={`flex items-center justify-between px-5 min-h-[57px] sm:min-h-[61px] border-b shrink-0 ${
          isDark ? "border-white/10" : "border-black/10"
        }`}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight">Connect</h3>
          {isLoadingDevices && (
            <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRefreshDevices(true)}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isDark ? "hover:bg-white/10 text-zinc-400 hover:text-white" : "hover:bg-black/10 text-zinc-600 hover:text-black"
            }`}
            title="Segarkan perangkat"
            aria-label="Segarkan perangkat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
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

      {/* ─── SCROLLABLE BODY ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain">
        {/* Real-time Command Feedback Notification */}
        <div
          className={`transition-all duration-200 ease-out overflow-hidden ${
            commandFeedback ? "max-h-20 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          {commandFeedback && (
            <div
              className={`px-3.5 py-2.5 rounded-2xl border text-xs font-medium flex items-center justify-between gap-2 shadow-xs transition-colors duration-150 ${
                commandFeedback.type === "error"
                  ? isDark
                    ? "bg-zinc-900 border-zinc-700 text-zinc-200"
                    : "bg-zinc-100 border-zinc-300 text-zinc-800"
                  : isDark
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-black/5 border-black/15 text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {commandFeedback.type === "pending" ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                ) : commandFeedback.type === "success" ? (
                  <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="truncate">{commandFeedback.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── CARD 1: ACTIVE DEVICE CARD (Matching Image 1) ─── */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark
              ? "bg-[#18181f] border-white/10 text-white shadow-xs"
              : "bg-zinc-50 border-black/10 text-zinc-900 shadow-xs"
          }`}
        >
          {remoteControllableSession ? (
            /* When another device is currently active */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <DeviceTypeIcon
                    type={remoteControllableSession.device_type}
                    className="w-5 h-5 text-emerald-500 shrink-0"
                  />
                  <span className="text-sm font-bold text-emerald-500 truncate">
                    {remoteControllableSession.device_name}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                <span className="text-xs text-zinc-400 truncate">
                  Sedang memutar di perangkat ini
                </span>
                <button
                  type="button"
                  disabled={isSendingCommand}
                  onClick={() => onTransferAppPlayback(localInstanceId, true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                    isDark
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  Pindahkan ke Sini
                </button>
              </div>
            </div>
          ) : (
            /* When this device is active (Image 1 layout) */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <DeviceTypeIcon
                    type="computer"
                    className="w-5 h-5 text-emerald-500 shrink-0"
                  />
                  <span className="text-sm font-bold text-emerald-500 truncate">
                    {localDeviceName || "This computer"}
                  </span>
                </div>
                {isLocalPlaying && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                <span className="text-xs text-zinc-400 truncate">
                  Listen with friends anywhere
                </span>
                <button
                  type="button"
                  onClick={onJamClick}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isDark
                      ? "border-white/20 bg-white/5 hover:bg-white/10 text-white"
                      : "border-black/20 bg-black/5 hover:bg-black/10 text-zinc-900"
                  }`}
                  title="Mulai Sesi Jam"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Start a Jam</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── SECTION 2: OTHER DEVICES / GUIDANCE TIPS (Matching Image 1) ─── */}
        {otherOnlineSessions.length === 0 ? (
          <div className="space-y-4 pt-1">
            <h4 className={`text-sm font-bold ${isDark ? "text-white/90" : "text-zinc-900"}`}>
              No other devices found
            </h4>

            {/* Tip 1: Check your WiFi */}
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 text-zinc-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.393 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-semibold leading-tight ${isDark ? "text-white/90" : "text-zinc-800"}`}>
                  Check your WiFi
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Connect the devices you’re using to the same WiFi.
                </p>
              </div>
            </div>

            {/* Tip 2: Play from another device */}
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 text-zinc-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2zm0 0v-2a1 1 0 0 1 1-1h2m-3 3h3m0 0a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" />
                  <circle cx="17.5" cy="8.5" r="1" fill="currentColor" />
                  <circle cx="17.5" cy="14.5" r="2" strokeWidth={1.5} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-semibold leading-tight ${isDark ? "text-white/90" : "text-zinc-800"}`}>
                  Play from another device
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  It will automatically appear here.
                </p>
              </div>
            </div>

            {/* Tip 3: Restart your speaker */}
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 text-zinc-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-semibold leading-tight ${isDark ? "text-white/90" : "text-zinc-800"}`}>
                  Restart your speaker
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Or follow setup instructions if it’s a new device.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Pilih Perangkat ({otherOnlineSessions.length} Tersedia)
              </h4>
              <span className="text-[10px] text-zinc-500">Realtime Sync</span>
            </div>

            <div className="space-y-2">
              {otherOnlineSessions.map((dev) => {
                const isActiveTarget = Boolean(dev.is_active_playback);
                return (
                  <div
                    key={dev.session_instance_id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isActiveTarget
                        ? isDark
                          ? "bg-white/10 border-white/25 shadow-sm"
                          : "bg-black/5 border-black/20 shadow-xs"
                        : isDark
                        ? "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                        : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActiveTarget
                            ? isDark
                              ? "bg-white text-black"
                              : "bg-black text-white"
                            : isDark
                            ? "bg-zinc-800 text-zinc-300"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        <DeviceTypeIcon type={dev.device_type} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold truncate">
                            {dev.device_name}
                          </span>
                          {dev.is_playing ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500 text-black">
                              Memutar
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-medium">
                              Tersedia
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {dev.current_track_name
                            ? `${dev.current_track_name}${dev.current_artist_name ? ` — ${dev.current_artist_name}` : ""}`
                            : `${dev.platform || "Web"} • ${dev.browser || "Browser"}`}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isSendingCommand}
                        onClick={() => onTransferAppPlayback(dev.session_instance_id, true)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isDark
                            ? "bg-white text-black hover:bg-zinc-200"
                            : "bg-black text-white hover:bg-zinc-800"
                        }`}
                      >
                        Pilih
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── SECTION 3: REMOTE CONTROL DECK (When another device is active/playing) ─── */}
        {remoteControllableSession && (
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? "bg-white/5 border-white/15" : "bg-black/5 border-black/15"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    remoteControllableSession.is_playing ? "bg-emerald-500" : isDark ? "bg-white/40" : "bg-black/40"
                  }`}
                />
                <span className="text-xs font-bold truncate">
                  Remote Control: {remoteControllableSession.device_name}
                </span>
              </div>
            </div>

            {/* Track Info */}
            {remoteControllableSession.current_track_name && (
              <div className="flex items-center gap-3">
                {remoteControllableSession.current_album_art && (
                  <img
                    src={remoteControllableSession.current_album_art}
                    alt={remoteControllableSession.current_track_name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">
                    {remoteControllableSession.current_track_name}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {remoteControllableSession.current_artist_name || "Artis"}
                  </p>
                </div>
              </div>
            )}

            {/* Remote Seek Bar */}
            {(() => {
              const progSec = getInterpolatedRemoteProgressSec(remoteControllableSession, nowMs);
              const durSec = Math.max(1, (remoteControllableSession.duration_ms || 0) / 1000);
              const pct = Math.max(0, Math.min(100, (progSec / durSec) * 100));
              return (
                <div className="space-y-1">
                  <div
                    className={`w-full h-1.5 rounded-full cursor-pointer overflow-hidden ${
                      isDark ? "bg-white/15" : "bg-black/15"
                    }`}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      const targetSec = clickPct * durSec;
                      onSendAppCommand(remoteControllableSession.session_instance_id, "SEEK", {
                        positionSeconds: targetSec,
                        positionMs: Math.round(targetSec * 1000),
                      });
                    }}
                  >
                    <div
                      className={`h-full rounded-full ${isDark ? "bg-white" : "bg-zinc-900"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>{formatSec(progSec)}</span>
                    <span>{formatSec(durSec)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Transport controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                {/* Shuffle */}
                <button
                  type="button"
                  onClick={() =>
                    onSendAppCommand(remoteControllableSession.session_instance_id, "SHUFFLE", {
                      shuffle: !remoteControllableSession.shuffle_state,
                    })
                  }
                  className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                    remoteControllableSession.shuffle_state
                      ? isDark
                        ? "bg-white text-black font-bold"
                        : "bg-black text-white font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Shuffle"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>

                {/* Prev */}
                <button
                  type="button"
                  onClick={() => onSendAppCommand(remoteControllableSession.session_instance_id, "PREVIOUS")}
                  className="p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                  title="Sebelumnya"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={() =>
                    onSendAppCommand(
                      remoteControllableSession.session_instance_id,
                      remoteControllableSession.is_playing ? "PAUSE" : "PLAY"
                    )
                  }
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-md ${
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  }`}
                  title={remoteControllableSession.is_playing ? "Jeda" : "Putar"}
                >
                  {remoteControllableSession.is_playing ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6z M14 4h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                      <polygon points="6 4, 18 12, 6 20" />
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button
                  type="button"
                  onClick={() => onSendAppCommand(remoteControllableSession.session_instance_id, "NEXT")}
                  className="p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                  title="Berikutnya"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                {/* Repeat */}
                <button
                  type="button"
                  onClick={() => {
                    const nextRep =
                      remoteControllableSession.repeat_state === "off"
                        ? "all"
                        : remoteControllableSession.repeat_state === "all"
                        ? "one"
                        : "off";
                    onSendAppCommand(remoteControllableSession.session_instance_id, "REPEAT", {
                      repeatMode: nextRep,
                    });
                  }}
                  className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                    remoteControllableSession.repeat_state !== "off"
                      ? isDark
                        ? "bg-white text-black font-bold"
                        : "bg-black text-white font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title={`Repeat: ${remoteControllableSession.repeat_state}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={remoteControllableSession.volume_percent ?? 80}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onSendAppCommand(remoteControllableSession.session_instance_id, "SET_VOLUME", {
                      volumePercent: val,
                    });
                  }}
                  className={`w-16 h-1 rounded-full cursor-pointer ${
                    isDark ? "bg-white/20 accent-white" : "bg-black/20 accent-black"
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── SECTION 4: LOCAL DEVICE IDENTITY & CUSTOM NAME ─── */}
        <div
          className={`p-3.5 rounded-2xl border ${
            isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Identitas Perangkat Ini
              </p>
              {!isEditingName ? (
                <p className="text-xs sm:text-sm font-bold truncate mt-0.5">{localDeviceName}</p>
              ) : null}
            </div>
            {!isEditingName && (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer shrink-0 ${
                  isDark
                    ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                    : "border-zinc-300 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                Ubah Nama
              </button>
            )}
          </div>

          {isEditingName && (
            <form onSubmit={handleSaveDeviceName} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Contoh: MacBook / iPhone"
                maxLength={40}
                className={`flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none ${
                  isDark ? "bg-zinc-950 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                }`}
                autoFocus
              />
              <button
                type="submit"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? "bg-white text-black" : "bg-black text-white"
                }`}
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingName(false);
                  setNameInput(localDeviceName);
                }}
                className="px-2 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
            </form>
          )}
        </div>

        {/* ─── SECTION 5: SPOTIFY CONNECT OFFICIAL DEVICES (If configured) ─── */}
        {spotifyConnect && (
          <div className="space-y-2.5 pt-2 border-t border-zinc-800/40">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Spotify Connect Resmi
              </h4>
              <span className="text-[10px] text-zinc-500">Web API</span>
            </div>

            {spotifyConnect.devices.length > 0 ? (
              <div className="space-y-2">
                {spotifyConnect.devices.map((spDev, idx) => (
                  <div
                    key={spDev.id || `sp-dev-${idx}`}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      spDev.is_active
                        ? isDark
                          ? "bg-white/10 border-white/25"
                          : "bg-black/5 border-black/20"
                        : isDark
                        ? "bg-zinc-900/50 border-zinc-800"
                        : "bg-zinc-50 border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          spDev.is_active
                            ? isDark
                              ? "bg-white text-black"
                              : "bg-black text-white"
                            : isDark
                            ? "bg-zinc-800 text-zinc-300"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        <DeviceTypeIcon type={spDev.type} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{spDev.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{spDev.type}</p>
                      </div>
                    </div>

                    {spDev.id && !spDev.is_restricted && (
                      <button
                        type="button"
                        onClick={() =>
                          onExecuteSpotifyAction({
                            spotifyAction: spDev.is_active ? (spotifyConnect.isPlaying ? "PAUSE" : "PLAY") : "TRANSFER",
                            deviceId: spDev.id || undefined,
                            play: true,
                          })
                        }
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer ${
                          spDev.is_active
                            ? isDark
                              ? "bg-white text-black"
                              : "bg-black text-white"
                            : isDark
                            ? "border border-zinc-700 hover:bg-white hover:text-black text-zinc-200"
                            : "border border-zinc-300 hover:bg-black hover:text-white text-zinc-800"
                        }`}
                      >
                        {spDev.is_active ? (spotifyConnect.isPlaying ? "Jeda" : "Putar") : "Pilih"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">{spotifyConnect.message}</p>
            )}
          </div>
        )}

        {/* Offline Sessions */}
        {offlineSessions.length > 0 && (
          <details className="pt-1">
            <summary className="text-[11px] text-zinc-500 cursor-pointer select-none">
              Perangkat tidak aktif ({offlineSessions.length})
            </summary>
            <div className="mt-2 space-y-1.5 opacity-60">
              {offlineSessions.slice(0, 3).map((dev) => (
                <div
                  key={dev.session_instance_id}
                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between ${
                    isDark ? "border-zinc-800/60 bg-zinc-900/30" : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  <span className="truncate">{dev.device_name}</span>
                  <span className="text-[10px] text-zinc-500">Offline</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ─── 3. Desktop Side Panel Component ──────────────────────────────────────────
export function MusicConnectSidePanel(props: MusicConnectPanelContentProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <MusicConnectContent {...props} />
    </div>
  );
}

// ─── 4. Mobile Bottom Sheet Modal Component (< sm screens) ───────────────────
export function MusicConnectModal({
  isOpen,
  isDark,
  onClose,
  ...rest
}: MusicConnectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="sm:hidden fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-h-[86vh] flex flex-col rounded-t-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? "bg-[#16161a] border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        } pb-[env(safe-area-inset-bottom)]`}
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto mt-2.5 shrink-0" />
        <MusicConnectContent isDark={isDark} onClose={onClose} {...rest} />
      </div>
    </div>
  );
}

