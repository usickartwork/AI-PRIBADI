"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";
import { MusicItem } from "./music";
import {
  AppDeviceSession,
  MusicConnectAck,
  MusicConnectCommand,
  MusicConnectCommandPayload,
  MusicConnectCommandType,
  SpotifyConnectState,
  createCommandEnvelope,
  detectDeviceInfo,
  getOrCreateInstanceId,
  isDeviceSessionOnline,
  isMusicConnectEnabled,
} from "./musicConnect";

export interface MusicConnectPlayerBridge {
  currentTrack: MusicItem | null;
  queue: MusicItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "all" | "one";
  // Imperative actions on local player
  onRemotePlay: () => Promise<boolean>;
  onRemotePause: () => void;
  onRemoteTogglePlay: () => void;
  onRemoteNext: () => MusicItem | null | void;
  onRemotePrevious: () => MusicItem | null | void;
  onRemoteSeek: (seconds: number) => void;
  onRemoteVolume: (volume0to1: number) => void;
  onRemoteShuffle: (shuffle: boolean) => void;
  onRemoteRepeat: (mode: "off" | "all" | "one") => void;
  onRemoteTransferHere: (params: {
    track: MusicItem | null;
    queue: MusicItem[];
    positionSeconds: number;
    autoPlay: boolean;
  }) => Promise<boolean>;
  onRemoteAddToQueue?: (track: MusicItem) => void;
  onRemotePlayTrack?: (track: MusicItem, queue?: MusicItem[]) => Promise<boolean>;
}

interface PendingCommandExpectation {
  timeoutId: NodeJS.Timeout;
  commandType: MusicConnectCommandType;
  targetInstanceId: string;
  onConfirmedSuccess?: () => void;
}

function areSessionsEqual(prev: AppDeviceSession[], next: AppDeviceSession[]): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (!a || !b) return false;
    if (
      a.session_instance_id !== b.session_instance_id ||
      a.is_playing !== b.is_playing ||
      a.is_active_playback !== b.is_active_playback ||
      a.current_track_id !== b.current_track_id ||
      a.current_track_name !== b.current_track_name ||
      a.device_name !== b.device_name ||
      a.volume_percent !== b.volume_percent ||
      a.shuffle_state !== b.shuffle_state ||
      a.repeat_state !== b.repeat_state ||
      Math.abs(a.progress_ms - b.progress_ms) > 2500 ||
      a.is_connected !== b.is_connected
    ) {
      return false;
    }
  }
  return true;
}

export function useMusicConnect(bridge: MusicConnectPlayerBridge) {
  const enabled = isMusicConnectEnabled();

  const [userId, setUserId] = useState<string | null>(null);
  const [realtimeTopic, setRealtimeTopic] = useState<string | null>(null);
  const [localInstanceId, setLocalInstanceId] = useState<string>("");
  const [localDeviceName, setLocalDeviceName] = useState<string>("Browser Web");
  const [deviceMeta, setDeviceMeta] = useState<{
    deviceType: "desktop" | "mobile" | "tablet";
    platform: string;
    browser: string;
  }>({
    deviceType: "desktop",
    platform: "Web",
    browser: "Browser",
  });

  const [sessions, setSessions] = useState<AppDeviceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AppDeviceSession | null>(null);
  const [spotifyConnect, setSpotifyConnect] = useState<SpotifyConnectState | null>(null);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(false);
  const [isSendingCommand, setIsSendingCommand] = useState<boolean>(false);
  const [autoplayBlockedPrompt, setAutoplayBlockedPrompt] = useState<boolean>(false);
  const [commandFeedback, setCommandFeedback] = useState<{
    type: "pending" | "success" | "error";
    text: string;
  } | null>(null);

  const bridgeRef = useRef<MusicConnectPlayerBridge>(bridge);
  useEffect(() => {
    bridgeRef.current = bridge;
  }, [bridge]);

  const userIdRef = useRef<string | null>(userId);
  userIdRef.current = userId;

  const processedCommandIdsRef = useRef<Set<string>>(new Set());
  const handledAckIdsRef = useRef<Set<string>>(new Set());
  const pendingCommandMapRef = useRef<Map<string, PendingCommandExpectation>>(new Map());
  const debounceCommandTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pullInFlightRef = useRef<boolean>(false);
  const pullQueuedRef = useRef<boolean>(false);
  const realtimeChannelRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const feedbackClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const claimActiveUntilRef = useRef<number>(0);

  // Holds pending transfer context if iOS/mobile browser blocked autoplay until user taps "Aktifkan Audio"
  const pendingTransferConfirmRef = useRef<{
    fromInstanceId: string;
    track: MusicItem | null;
    queue: MusicItem[];
    progressMs: number;
  } | null>(null);

  const showTransientFeedback = useCallback(
    (type: "pending" | "success" | "error", text: string, durationMs = 3500) => {
      if (feedbackClearTimeoutRef.current) {
        clearTimeout(feedbackClearTimeoutRef.current);
      }
      setCommandFeedback({ type, text });
      if (durationMs > 0) {
        feedbackClearTimeoutRef.current = setTimeout(() => {
          setCommandFeedback(null);
        }, durationMs);
      }
    },
    []
  );

  // Initialize local instance ID & device metadata on client mount
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const instId = getOrCreateInstanceId();
    const info = detectDeviceInfo(instId);
    setLocalInstanceId(instId);
    setLocalDeviceName(info.deviceName);
    setDeviceMeta({
      deviceType: info.deviceType,
      platform: info.platform,
      browser: info.browser,
    });
  }, [enabled]);

  // Build current local session snapshot
  const buildLocalSessionSnapshot = useCallback(
    (override?: Partial<AppDeviceSession>): AppDeviceSession => {
      const b = bridgeRef.current;
      const nowIso = new Date().toISOString();
      const volPct = b.isMuted ? 0 : Math.round((b.volume ?? 0.8) * 100);
      return {
        user_id: userIdRef.current || "anonymous",
        session_instance_id: localInstanceId,
        spotify_device_id: null,
        device_name: localDeviceName,
        device_type: deviceMeta.deviceType,
        platform: deviceMeta.platform,
        browser: deviceMeta.browser,
        is_connected: true,
        is_active_playback: b.isPlaying || Date.now() < claimActiveUntilRef.current,
        can_control: true,
        can_transfer_playback: true,
        current_track_id: b.currentTrack?.id || null,
        current_track_name: b.currentTrack?.title || null,
        current_artist_name: b.currentTrack?.artistNames?.join(", ") || null,
        current_album_art: b.currentTrack?.artworkUrl || null,
        current_track_payload: b.currentTrack || null,
        queue_payload: b.queue.slice(0, 50),
        is_playing: b.isPlaying,
        progress_ms: Math.max(0, Math.round((b.currentTime || 0) * 1000)),
        duration_ms: Math.max(
          0,
          Math.round(
            (b.duration || (b.currentTrack?.durationMs ? b.currentTrack.durationMs / 1000 : 0)) *
              1000
          )
        ),
        volume_percent: volPct,
        shuffle_state: b.isShuffle,
        repeat_state: b.repeatMode,
        last_seen_at: nowIso,
        updated_at: nowIso,
        ...override,
      };
    },
    [localInstanceId, localDeviceName, deviceMeta]
  );

  /**
   * Sends a zero-payload wakeup signal (`connect_ping`) over Supabase Realtime + BroadcastChannel.
   * SECURITY: Never sends commands or state in the broadcast payload; recipients always fetch
   * verified state and commands from `/api/music/connect` (authenticated by Clerk `auth()`).
   */
  const sendWakeupPing = useCallback(() => {
    try {
      const ch = realtimeChannelRef.current;
      if (ch) {
        if (ch.state === "joined") {
          ch.send({
            type: "broadcast",
            event: "connect_ping",
            payload: { t: Date.now() },
          });
        } else {
          // If channel is still connecting or reconnecting, retry after a short delay
          setTimeout(() => {
            try {
              if (realtimeChannelRef.current?.state === "joined") {
                realtimeChannelRef.current.send({
                  type: "broadcast",
                  event: "connect_ping",
                  payload: { t: Date.now() },
                });
              }
            } catch {}
          }, 180);
        }
      }
    } catch {}
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ event: "connect_ping", t: Date.now() });
      }
    } catch {}
  }, []);

  // Execute a server-verified command addressed to this device instance
  const executeServerVerifiedCommand = useCallback(
    async (cmd: MusicConnectCommand) => {
      if (!cmd || !cmd.command_id || cmd.target_instance_id !== localInstanceId) return;
      if (processedCommandIdsRef.current.has(cmd.command_id)) return;

      const expMs = Date.parse(cmd.expires_at);
      if (!Number.isNaN(expMs) && Date.now() > expMs) return;

      processedCommandIdsRef.current.add(cmd.command_id);

      const b = bridgeRef.current;
      let status: "succeeded" | "failed" = "succeeded";
      let resultMessage = "Perintah berhasil dijalankan";
      let snapshotOverride: Partial<AppDeviceSession> = {};

      try {
        switch (cmd.command_type) {
          case "PLAY": {
            const started = await b.onRemotePlay();
            if (!started) {
              status = "failed";
              setAutoplayBlockedPrompt(true);
              resultMessage = `Browser di ${localDeviceName} menahan pemutaran otomatis (memerlukan sentuhan pengguna).`;
              snapshotOverride = { is_playing: false };
            } else {
              claimActiveUntilRef.current = Date.now() + 10_000;
              setAutoplayBlockedPrompt(false);
              resultMessage = `Memutar di ${localDeviceName}`;
              snapshotOverride = { is_playing: true, is_active_playback: true };
            }
            break;
          }
          case "PAUSE": {
            b.onRemotePause();
            claimActiveUntilRef.current = 0;
            resultMessage = `Dijeda di ${localDeviceName}`;
            snapshotOverride = { is_playing: false };
            break;
          }
          case "TOGGLE_PLAY": {
            if (b.isPlaying) {
              b.onRemotePause();
              resultMessage = `Dijeda di ${localDeviceName}`;
              snapshotOverride = { is_playing: false };
            } else {
              const started = await b.onRemotePlay();
              if (!started) {
                status = "failed";
                setAutoplayBlockedPrompt(true);
                resultMessage = `Browser di ${localDeviceName} menahan pemutaran otomatis.`;
                snapshotOverride = { is_playing: false };
              } else {
                claimActiveUntilRef.current = Date.now() + 10_000;
                setAutoplayBlockedPrompt(false);
                resultMessage = `Memutar di ${localDeviceName}`;
                snapshotOverride = { is_playing: true, is_active_playback: true };
              }
            }
            break;
          }
          case "NEXT": {
            const nextTrack = b.onRemoteNext();
            resultMessage = `Lagu berikutnya di ${localDeviceName}`;
            if (nextTrack) {
              snapshotOverride = {
                current_track_id: nextTrack.id,
                current_track_name: nextTrack.title,
                current_artist_name: nextTrack.artistNames?.join(", ") || null,
                current_album_art: nextTrack.artworkUrl || null,
                current_track_payload: nextTrack,
                progress_ms: 0,
                duration_ms: nextTrack.durationMs || 0,
                is_playing: true,
                is_active_playback: true,
              };
            }
            break;
          }
          case "PREVIOUS": {
            const prevTrack = b.onRemotePrevious();
            resultMessage = `Lagu sebelumnya di ${localDeviceName}`;
            if (prevTrack) {
              snapshotOverride = {
                current_track_id: prevTrack.id,
                current_track_name: prevTrack.title,
                current_artist_name: prevTrack.artistNames?.join(", ") || null,
                current_album_art: prevTrack.artworkUrl || null,
                current_track_payload: prevTrack,
                progress_ms: 0,
                duration_ms: prevTrack.durationMs || 0,
                is_playing: true,
                is_active_playback: true,
              };
            }
            break;
          }
          case "SEEK": {
            const targetSec =
              typeof cmd.payload?.positionSeconds === "number"
                ? cmd.payload.positionSeconds
                : typeof cmd.payload?.positionMs === "number"
                ? cmd.payload.positionMs / 1000
                : 0;
            const clampedSec = Math.max(0, targetSec);
            b.onRemoteSeek(clampedSec);
            resultMessage = `Posisi lagu digeser di ${localDeviceName}`;
            snapshotOverride = { progress_ms: Math.round(clampedSec * 1000) };
            break;
          }
          case "SET_VOLUME": {
            const volPct =
              typeof cmd.payload?.volumePercent === "number" ? cmd.payload.volumePercent : 80;
            const clampedPct = Math.max(0, Math.min(100, Math.round(volPct)));
            b.onRemoteVolume(clampedPct / 100);
            resultMessage = `Volume diatur ke ${clampedPct}%`;
            snapshotOverride = { volume_percent: clampedPct };
            break;
          }
          case "SHUFFLE": {
            const nextShuffle =
              typeof cmd.payload?.shuffle === "boolean" ? cmd.payload.shuffle : !b.isShuffle;
            b.onRemoteShuffle(nextShuffle);
            resultMessage = `Shuffle ${nextShuffle ? "aktif" : "nonaktif"}`;
            snapshotOverride = { shuffle_state: nextShuffle };
            break;
          }
          case "REPEAT": {
            const nextRepeat = cmd.payload?.repeatMode || "off";
            b.onRemoteRepeat(nextRepeat);
            resultMessage = `Repeat diatur ke ${nextRepeat}`;
            snapshotOverride = { repeat_state: nextRepeat };
            break;
          }
          case "ADD_TO_QUEUE": {
            const track = cmd.payload?.track;
            if (track && b.onRemoteAddToQueue) {
              b.onRemoteAddToQueue(track);
              resultMessage = `"${track.title}" ditambahkan ke antrean di ${localDeviceName}`;
            } else {
              status = "failed";
              resultMessage = "Data lagu tidak lengkap";
            }
            break;
          }
          case "PLAY_TRACK": {
            const track = cmd.payload?.track || b.currentTrack;
            const queue = Array.isArray(cmd.payload?.queue) ? cmd.payload.queue : b.queue;
            if (track && b.onRemotePlayTrack) {
              const ok = await b.onRemotePlayTrack(track, queue);
              if (!ok) {
                status = "failed";
                resultMessage = `Gagal memutar lagu di ${localDeviceName}`;
              } else {
                claimActiveUntilRef.current = Date.now() + 15_000;
                setAutoplayBlockedPrompt(false);
                resultMessage = `Memutar "${track.title}" di ${localDeviceName}`;
                snapshotOverride = {
                  is_playing: true,
                  is_active_playback: true,
                  current_track_id: track.id,
                  current_track_name: track.title,
                  current_artist_name: track.artistNames?.join(", ") || null,
                  current_album_art: track.artworkUrl || null,
                  current_track_payload: track,
                  progress_ms: 0,
                };
              }
            } else {
              // Fallback to transfer logic
              const posSec =
                typeof cmd.payload?.positionSeconds === "number"
                  ? cmd.payload.positionSeconds
                  : typeof cmd.payload?.positionMs === "number"
                  ? cmd.payload.positionMs / 1000
                  : 0;
              const autoPlay = cmd.payload?.autoPlay !== false;
              const ok = await b.onRemoteTransferHere({
                track: track || null,
                queue,
                positionSeconds: posSec,
                autoPlay,
              });
              if (!ok && autoPlay) {
                status = "failed";
                setAutoplayBlockedPrompt(true);
                pendingTransferConfirmRef.current = {
                  fromInstanceId: cmd.source_instance_id,
                  track: track || null,
                  queue,
                  progressMs: Math.round(posSec * 1000),
                };
                resultMessage = `Browser di ${localDeviceName} menahan autoplay.`;
              } else {
                claimActiveUntilRef.current = Date.now() + 15_000;
                setAutoplayBlockedPrompt(false);
                resultMessage = `Playback aktif di ${localDeviceName}`;
                snapshotOverride = {
                  is_playing: autoPlay,
                  is_active_playback: true,
                  current_track_id: track?.id || null,
                  current_track_name: track?.title || null,
                  current_artist_name: track?.artistNames?.join(", ") || null,
                  current_album_art: track?.artworkUrl || null,
                  current_track_payload: track || null,
                  progress_ms: Math.round(posSec * 1000),
                };
              }
            }
            break;
          }
          case "TRANSFER_PLAYBACK": {
            const track = cmd.payload?.track || b.currentTrack;
            const queue = Array.isArray(cmd.payload?.queue) ? cmd.payload.queue : b.queue;
            const posSec =
              typeof cmd.payload?.positionSeconds === "number"
                ? cmd.payload.positionSeconds
                : typeof cmd.payload?.positionMs === "number"
                ? cmd.payload.positionMs / 1000
                : 0;
            const autoPlay = cmd.payload?.autoPlay !== false;

            const ok = await b.onRemoteTransferHere({
              track: track || null,
              queue,
              positionSeconds: posSec,
              autoPlay,
            });

            if (!ok && autoPlay) {
              status = "failed";
              setAutoplayBlockedPrompt(true);
              pendingTransferConfirmRef.current = {
                fromInstanceId: cmd.source_instance_id,
                track: track || null,
                queue,
                progressMs: Math.round(posSec * 1000),
              };
              resultMessage = `Browser di ${localDeviceName} menahan autoplay. Ketuk 'Aktifkan Audio' di ${localDeviceName} (perangkat asal tetap memutar).`;
              snapshotOverride = {
                is_playing: false,
                is_active_playback: false,
                current_track_id: track?.id || null,
                current_track_name: track?.title || null,
                current_artist_name: track?.artistNames?.join(", ") || null,
                current_album_art: track?.artworkUrl || null,
                current_track_payload: track || null,
                progress_ms: Math.round(posSec * 1000),
              };
            } else {
              claimActiveUntilRef.current = Date.now() + 15_000;
              setAutoplayBlockedPrompt(false);
              pendingTransferConfirmRef.current = null;
              resultMessage = `Playback aktif di ${localDeviceName}`;
              snapshotOverride = {
                is_playing: autoPlay,
                is_active_playback: true,
                current_track_id: track?.id || null,
                current_track_name: track?.title || null,
                current_artist_name: track?.artistNames?.join(", ") || null,
                current_album_art: track?.artworkUrl || null,
                current_track_payload: track || null,
                progress_ms: Math.round(posSec * 1000),
              };
            }
            break;
          }
          default:
            status = "failed";
            resultMessage = "Perintah tidak dikenali";
        }
      } catch (err: any) {
        status = "failed";
        resultMessage = err?.message || "Gagal menjalankan perintah di perangkat target";
      }

      const updatedSnapshot = buildLocalSessionSnapshot(snapshotOverride);

      try {
        await fetch("/api/music/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ack",
            command_id: cmd.command_id,
            target_instance_id: localInstanceId,
            status,
            result_message: resultMessage,
            session: updatedSnapshot,
          }),
        });
        sendWakeupPing();
      } catch {}
    },
    [localInstanceId, localDeviceName, buildLocalSessionSnapshot, sendWakeupPing]
  );

  // Handle server-verified acknowledgment for a command sent by this device
  const handleServerVerifiedAck = useCallback(
    (ack: MusicConnectAck) => {
      if (!ack || !ack.command_id) return;
      if (handledAckIdsRef.current.has(ack.command_id)) return;
      handledAckIdsRef.current.add(ack.command_id);

      const pending = pendingCommandMapRef.current.get(ack.command_id);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingCommandMapRef.current.delete(ack.command_id);
        if (ack.status === "succeeded" && pending.onConfirmedSuccess) {
          pending.onConfirmedSuccess();
        }
      }

      if (pendingCommandMapRef.current.size === 0) {
        setIsSendingCommand(false);
      }

      if (ack.source_instance_id === localInstanceId) {
        showTransientFeedback(
          ack.status === "succeeded" ? "success" : "error",
          ack.result_message ||
            (ack.status === "succeeded" ? "Perintah berhasil dijalankan" : "Perintah gagal"),
          3200
        );
      }
    },
    [localInstanceId, showTransientFeedback]
  );

  // Process response data from `/api/music/connect`
  const applyServerResponse = useCallback(
    (json: any) => {
      if (!json || !json.success) return;
      if (json.userId) {
        setUserId((prev) => (prev === json.userId ? prev : json.userId));
      }
      if (json.realtimeTopic) {
        setRealtimeTopic((prev) => (prev === json.realtimeTopic ? prev : json.realtimeTopic));
      }
      if (Array.isArray(json.sessions)) {
        // Protect optimistic values for any target session that still has an in-flight command
        const protectedSessions = json.sessions.map((s: AppDeviceSession) => {
          let merged = s;
          for (const pending of pendingCommandMapRef.current.values()) {
            if (pending.targetInstanceId === s.session_instance_id) {
              if (pending.commandType === "PLAY" && !s.is_playing) {
                merged = { ...merged, is_playing: true, is_active_playback: true };
              } else if (pending.commandType === "PAUSE" && s.is_playing) {
                merged = { ...merged, is_playing: false };
              }
            }
          }
          return merged;
        });

        setSessions((prev) => (areSessionsEqual(prev, protectedSessions) ? prev : protectedSessions));
      }
      if (json.activeSession !== undefined) {
        setActiveSession((prev) => {
          let target = json.activeSession as AppDeviceSession | null;
          if (target && pendingCommandMapRef.current.size > 0) {
            for (const pending of pendingCommandMapRef.current.values()) {
              if (pending.targetInstanceId === target.session_instance_id) {
                if (pending.commandType === "PLAY" && !target.is_playing) {
                  target = { ...target, is_playing: true, is_active_playback: true };
                } else if (pending.commandType === "PAUSE" && target.is_playing) {
                  target = { ...target, is_playing: false };
                }
              }
            }
          }
          if (!prev && !target) return null;
          if (
            prev &&
            target &&
            prev.session_instance_id === target.session_instance_id &&
            prev.is_playing === target.is_playing &&
            prev.current_track_id === target.current_track_id
          ) {
            return prev;
          }
          return target;
        });
      }
      if (Array.isArray(json.pendingCommands)) {
        for (const cmd of json.pendingCommands) {
          void executeServerVerifiedCommand(cmd);
        }
      }
      if (Array.isArray(json.recentAcks)) {
        for (const ack of json.recentAcks) {
          if (pendingCommandMapRef.current.has(ack.command_id)) {
            handleServerVerifiedAck(ack);
          }
        }
      }
      if (json.spotifyConnect) {
        setSpotifyConnect(json.spotifyConnect);
      }
    },
    [executeServerVerifiedCommand, handleServerVerifiedAck]
  );

  // Pull verified state & pending commands from `/api/music/connect` (triggered on `connect_ping`)
  const pullServerState = useCallback(async () => {
    if (!enabled || !localInstanceId) return;
    if (pullInFlightRef.current) {
      pullQueuedRef.current = true;
      return;
    }
    pullInFlightRef.current = true;
    try {
      const res = await fetch(
        `/api/music/connect?instanceId=${encodeURIComponent(localInstanceId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        applyServerResponse(json);
      }
    } catch {
      // Silent network resilience
    } finally {
      pullInFlightRef.current = false;
      if (pullQueuedRef.current) {
        pullQueuedRef.current = false;
        void pullServerState();
      }
    }
  }, [enabled, localInstanceId, applyServerResponse]);

  // Send heartbeat & sync state with `/api/music/connect`
  const syncHeartbeat = useCallback(
    async (options?: {
      claimActive?: boolean;
      includeSpotify?: boolean;
      forceSpotify?: boolean;
      notifyPeers?: boolean;
    }) => {
      if (!enabled || !localInstanceId) return;
      const snap = buildLocalSessionSnapshot(
        options?.claimActive ? { is_active_playback: true } : undefined
      );

      try {
        const res = await fetch("/api/music/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "heartbeat",
            ...snap,
            claim_active: Boolean(options?.claimActive || snap.is_playing),
          }),
        });
        if (!res.ok) return;
        const json = await res.json();
        applyServerResponse(json);

        if (options?.notifyPeers) {
          sendWakeupPing();
        }

        if (options?.includeSpotify) {
          const spRes = await fetch(
            `/api/music/connect?instanceId=${encodeURIComponent(
              localInstanceId
            )}&includeSpotify=1${options.forceSpotify ? "&forceSpotify=1" : ""}`,
            { cache: "no-store" }
          );
          if (spRes.ok) {
            const spJson = await spRes.json();
            applyServerResponse(spJson);
          }
        }
      } catch {
        // Silent network resilience
      }
    },
    [enabled, localInstanceId, buildLocalSessionSnapshot, applyServerResponse, sendWakeupPing]
  );

  // Fast micro-coalesced incoming wakeup ping handler (sub-50ms reaction time)
  const lastPingPullTimeRef = useRef<number>(0);

  const handleIncomingPing = useCallback(() => {
    const now = Date.now();
    if (now - lastPingPullTimeRef.current < 50) {
      pullQueuedRef.current = true;
      return;
    }
    lastPingPullTimeRef.current = now;
    void pullServerState();
  }, [pullServerState]);

  // Set up Zero-Trust Wakeup Channel (`connect_ping` only!)
  useEffect(() => {
    if (!enabled || !localInstanceId) return;

    // 1. Same-browser multi-tab BroadcastChannel wakeup listener
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel("usick_music_connect_wakeup_v2");
        bc.onmessage = (ev) => {
          if (ev.data?.event === "connect_ping") {
            handleIncomingPing();
          }
        };
        broadcastChannelRef.current = bc;
      } catch {}
    }

    // 2. Supabase Realtime cross-device wakeup listener (uses server-derived opaque topic)
    let channel: any = null;
    if (isSupabaseConfigured && realtimeTopic) {
      try {
        channel = supabase.channel(`music-connect:${realtimeTopic}`, {
          config: {
            broadcast: { self: false },
          },
        });

        channel
          .on("broadcast", { event: "connect_ping" }, () => {
            handleIncomingPing();
          })
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              void pullServerState();
            }
          });

        realtimeChannelRef.current = channel;
      } catch (err) {
        console.warn("[MusicConnect] Realtime wakeup channel warning:", err);
      }
    }

    return () => {
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.close();
        } catch {}
        broadcastChannelRef.current = null;
      }
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
        realtimeChannelRef.current = null;
      }
    };
  }, [enabled, localInstanceId, realtimeTopic, handleIncomingPing, pullServerState]);

  // Initial registration + adaptive periodic heartbeat (NEVER notifies peers on timer, stops ping storms!)
  useEffect(() => {
    if (!enabled || !localInstanceId) return;

    // Silent initial registration on mount
    void syncHeartbeat({ includeSpotify: false, notifyPeers: false });

    // Adaptive silent poll: 1.8s during active cross-device session, 5s when idle
    const pollIntervalMs = remoteActiveSession || bridge.isPlaying ? 1_800 : 5_000;
    const interval = setInterval(() => {
      void syncHeartbeat({ includeSpotify: showConnectModal, notifyPeers: false });
    }, pollIntervalMs);

    const handleUnload = () => {
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob(
            [
              JSON.stringify({
                action: "disconnect",
                session_instance_id: localInstanceId,
              }),
            ],
            { type: "application/json" }
          );
          navigator.sendBeacon("/api/music/connect", blob);
        }
        sendWakeupPing();
      } catch {}
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [enabled, localInstanceId, showConnectModal, syncHeartbeat, sendWakeupPing]);

  // Immediately sync & ping peers whenever local track, play/pause, shuffle, or repeat changes
  useEffect(() => {
    if (!enabled || !localInstanceId) return;
    if (bridge.isPlaying) {
      claimActiveUntilRef.current = Date.now() + 10_000;
    }
    const timer = setTimeout(() => {
      void syncHeartbeat({ claimActive: bridge.isPlaying, notifyPeers: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [
    enabled,
    localInstanceId,
    bridge.currentTrack?.id,
    bridge.isPlaying,
    bridge.isShuffle,
    bridge.repeatMode,
    syncHeartbeat,
  ]);

  // Refresh device list & official Spotify Connect state on demand
  const refreshDevices = useCallback(
    async (forceSpotify = false) => {
      if (!enabled || !localInstanceId) return;
      setIsLoadingDevices(true);
      try {
        await syncHeartbeat({ includeSpotify: true, forceSpotify, notifyPeers: false });
      } finally {
        setIsLoadingDevices(false);
      }
    },
    [enabled, localInstanceId, syncHeartbeat]
  );

  useEffect(() => {
    if (showConnectModal) {
      void refreshDevices(false);
    }
  }, [showConnectModal, refreshDevices]);

  // Internal command dispatcher (after optional debounce)
  const dispatchVerifiedCommand = useCallback(
    async (
      targetInstanceId: string,
      commandType: MusicConnectCommandType,
      payload?: MusicConnectCommandPayload
    ) => {
      if (!enabled || !localInstanceId || !targetInstanceId) return;

      if (targetInstanceId === localInstanceId) {
        const selfCmd = createCommandEnvelope({
          userId: userId || "self",
          sourceInstanceId: localInstanceId,
          sourceDeviceName: localDeviceName,
          targetInstanceId,
          commandType,
          payload,
        });
        await executeServerVerifiedCommand(selfCmd);
        return;
      }

      const cmd = createCommandEnvelope({
        userId: userId || "user",
        sourceInstanceId: localInstanceId,
        sourceDeviceName: localDeviceName,
        targetInstanceId,
        commandType,
        payload,
      });

      setIsSendingCommand(true);
      showTransientFeedback("pending", "Mengirim perintah ke perangkat...", 8000);

      const timeoutId = setTimeout(() => {
        pendingCommandMapRef.current.delete(cmd.command_id);
        if (pendingCommandMapRef.current.size === 0) {
          setIsSendingCommand(false);
        }
        showTransientFeedback(
          "error",
          "Perangkat belum merespons (timeout). Pastikan tab Usick One terbuka di perangkat tersebut.",
          4000
        );
      }, 6_000);

      pendingCommandMapRef.current.set(cmd.command_id, {
        timeoutId,
        commandType,
        targetInstanceId,
      });

      try {
        const res = await fetch("/api/music/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "command",
            command: cmd,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success) {
          clearTimeout(timeoutId);
          pendingCommandMapRef.current.delete(cmd.command_id);
          if (pendingCommandMapRef.current.size === 0) {
            setIsSendingCommand(false);
          }
          showTransientFeedback(
            "error",
            json?.error || "Gagal mengirim perintah ke perangkat target.",
            3500
          );
          return;
        }

        // Avoid overwriting optimistic local state with stale sessions from command POST response
        if (json && json.success) {
          if (json.realtimeTopic) setRealtimeTopic(json.realtimeTopic);
          if (json.userId) setUserId(json.userId);
        }
        // Trigger immediate wakeup on target device
        sendWakeupPing();
      } catch {
        clearTimeout(timeoutId);
        pendingCommandMapRef.current.delete(cmd.command_id);
        if (pendingCommandMapRef.current.size === 0) {
          setIsSendingCommand(false);
        }
        showTransientFeedback("error", "Koneksi jaringan terputus saat mengirim perintah.", 3500);
      }
    },
    [
      enabled,
      localInstanceId,
      localDeviceName,
      userId,
      executeServerVerifiedCommand,
      showTransientFeedback,
      sendWakeupPing,
      pullServerState,
    ]
  );

  // Public command sender with 180ms debounce for high-frequency SEEK / SET_VOLUME sliders
  const sendAppCommand = useCallback(
    (
      targetInstanceId: string,
      commandType: MusicConnectCommandType,
      payload?: MusicConnectCommandPayload
    ) => {
      const nowIso = new Date().toISOString();

      // Optimistic instant local session feedback for snappy responsive controls
      if (commandType === "PLAY" || commandType === "PAUSE") {
        const nextIsPlaying = commandType === "PLAY";
        setSessions((prev) =>
          prev.map((s) =>
            s.session_instance_id === targetInstanceId
              ? { ...s, is_playing: nextIsPlaying, updated_at: nowIso }
              : s
          )
        );
        setActiveSession((prev) =>
          prev && prev.session_instance_id === targetInstanceId
            ? { ...prev, is_playing: nextIsPlaying, updated_at: nowIso }
            : prev
        );
      } else if (commandType === "PLAY_TRACK" && payload?.track) {
        const track = payload.track;
        const updater = (s: AppDeviceSession) => ({
          ...s,
          is_playing: true,
          is_active_playback: true,
          current_track_id: track.id,
          current_track_name: track.title,
          current_artist_name: track.artistNames?.join(", ") || null,
          current_album_art: track.artworkUrl || null,
          current_track_payload: track,
          progress_ms: Math.round((payload.positionSeconds || 0) * 1000),
          duration_ms: track.durationMs || s.duration_ms,
          updated_at: nowIso,
        });
        setSessions((prev) =>
          prev.map((s) => (s.session_instance_id === targetInstanceId ? updater(s) : s))
        );
        setActiveSession((prev) =>
          prev && prev.session_instance_id === targetInstanceId ? updater(prev) : prev
        );
      } else if (commandType === "NEXT" || commandType === "PREVIOUS") {
        setSessions((prev) =>
          prev.map((s) =>
            s.session_instance_id === targetInstanceId
              ? { ...s, progress_ms: 0, is_playing: true, updated_at: nowIso }
              : s
          )
        );
        setActiveSession((prev) =>
          prev && prev.session_instance_id === targetInstanceId
            ? { ...prev, progress_ms: 0, is_playing: true, updated_at: nowIso }
            : prev
        );
      } else if (commandType === "SEEK") {
        const targetMs =
          typeof payload?.positionMs === "number"
            ? payload.positionMs
            : typeof payload?.positionSeconds === "number"
            ? Math.round(payload.positionSeconds * 1000)
            : undefined;
        if (typeof targetMs === "number") {
          setSessions((prev) =>
            prev.map((s) =>
              s.session_instance_id === targetInstanceId
                ? { ...s, progress_ms: targetMs, updated_at: nowIso }
                : s
            )
          );
          setActiveSession((prev) =>
            prev && prev.session_instance_id === targetInstanceId
              ? { ...prev, progress_ms: targetMs, updated_at: nowIso }
              : prev
          );
        }
      } else if (commandType === "SHUFFLE" && typeof payload?.shuffle === "boolean") {
        setSessions((prev) =>
          prev.map((s) =>
            s.session_instance_id === targetInstanceId
              ? { ...s, shuffle_state: payload.shuffle!, updated_at: nowIso }
              : s
          )
        );
        setActiveSession((prev) =>
          prev && prev.session_instance_id === targetInstanceId
            ? { ...prev, shuffle_state: payload.shuffle!, updated_at: nowIso }
            : prev
        );
      } else if (commandType === "REPEAT" && payload?.repeatMode) {
        setSessions((prev) =>
          prev.map((s) =>
            s.session_instance_id === targetInstanceId
              ? { ...s, repeat_state: payload.repeatMode!, updated_at: nowIso }
              : s
          )
        );
        setActiveSession((prev) =>
          prev && prev.session_instance_id === targetInstanceId
            ? { ...prev, repeat_state: payload.repeatMode!, updated_at: nowIso }
            : prev
        );
      }

      if (commandType === "SEEK" || commandType === "SET_VOLUME") {
        const key = `${targetInstanceId}:${commandType}`;
        const prevTimer = debounceCommandTimersRef.current.get(key);
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        const timer = setTimeout(() => {
          debounceCommandTimersRef.current.delete(key);
          void dispatchVerifiedCommand(targetInstanceId, commandType, payload);
        }, 180);
        debounceCommandTimersRef.current.set(key, timer);
        return;
      }

      void dispatchVerifiedCommand(targetInstanceId, commandType, payload);
    },
    [dispatchVerifiedCommand]
  );

  /**
   * Transfers playback ownership between Usick One devices (Device A <-> Device B).
   * CRITICAL GUARANTEE:
   * - Never pauses the source device BEFORE the target device has verified playback started.
   * - If transfer fails (or autoplay is blocked by mobile browser), the source device keeps playing!
   */
  const transferAppPlayback = useCallback(
    async (targetInstanceId: string, autoPlay = true) => {
      if (!enabled || !localInstanceId || !targetInstanceId) return;

      const b = bridgeRef.current;
      const sourceSession =
        sessions.find((s) => isDeviceSessionOnline(s) && s.is_active_playback) ||
        sessions.find((s) => isDeviceSessionOnline(s) && s.is_playing) ||
        null;

      const isTransferringToSelf = targetInstanceId === localInstanceId;
      const trackToTransfer = isTransferringToSelf
        ? sourceSession?.current_track_payload || b.currentTrack
        : b.currentTrack || sourceSession?.current_track_payload || null;

      const queueToTransfer = isTransferringToSelf
        ? sourceSession?.queue_payload && sourceSession.queue_payload.length > 0
          ? sourceSession.queue_payload
          : b.queue
        : b.queue.length > 0
        ? b.queue
        : sourceSession?.queue_payload || [];

      const progressMsToTransfer = isTransferringToSelf
        ? sourceSession
          ? Math.round(
              Math.max(
                0,
                sourceSession.progress_ms +
                  (sourceSession.is_playing
                    ? Math.min(
                        15_000,
                        Math.max(0, Date.now() - Date.parse(sourceSession.updated_at))
                      )
                    : 0)
              )
            )
          : Math.round((b.currentTime || 0) * 1000)
        : Math.round((b.currentTime || 0) * 1000);

      setIsSendingCommand(true);
      showTransientFeedback(
        "pending",
        isTransferringToSelf
          ? "Memulai pemutaran di perangkat ini..."
          : "Meminta perangkat tujuan memulai pemutaran...",
        7000
      );

      try {
        // CASE 1: "Putar di Sini" (Pulling playback to this device)
        if (isTransferringToSelf) {
          // Step 1: Start & verify playback on THIS device FIRST before pausing source device!
          const started = await b.onRemoteTransferHere({
            track: trackToTransfer || null,
            queue: queueToTransfer,
            positionSeconds: Math.max(0, progressMsToTransfer / 1000),
            autoPlay,
          });

          if (!started && autoPlay) {
            // Autoplay blocked or track failed on this device -> DO NOT pause source device!
            setAutoplayBlockedPrompt(true);
            pendingTransferConfirmRef.current = {
              fromInstanceId: sourceSession?.session_instance_id || "",
              track: trackToTransfer || null,
              queue: queueToTransfer,
              progressMs: progressMsToTransfer,
            };
            setIsSendingCommand(false);
            showTransientFeedback(
              "error",
              "Browser menahan autoplay. Ketuk 'Aktifkan Audio' untuk memindahkan lagu (perangkat asal tetap memutar).",
              5000
            );
            return;
          }

          setAutoplayBlockedPrompt(false);
          pendingTransferConfirmRef.current = null;
          claimActiveUntilRef.current = Date.now() + 15_000;

          // Step 2: Now that local playback is verified active, commit transfer & pause source device
          const res = await fetch("/api/music/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "transfer_app",
              initiator_instance_id: localInstanceId,
              from_instance_id: sourceSession?.session_instance_id || localInstanceId,
              to_instance_id: localInstanceId,
              confirmed_by_target: true,
              track: trackToTransfer,
              queue: queueToTransfer,
              progress_ms: progressMsToTransfer,
              auto_play: autoPlay,
            }),
          });

          const json = await res.json().catch(() => ({}));
          setIsSendingCommand(false);
          if (res.ok && json?.success) {
            applyServerResponse(json);
            sendWakeupPing();
            showTransientFeedback(
              "success",
              `Pemutaran aktif di ${localDeviceName}`,
              3000
            );
          } else {
            showTransientFeedback(
              "error",
              json?.error || "Gagal memperbarui status transfer di server.",
              3500
            );
          }
          return;
        }

        // CASE 2: Pushing playback from THIS device to another target device
        // Do NOT pause local player yet! Wait until target device sends `ack: succeeded`.
        const res = await fetch("/api/music/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "transfer_app",
            initiator_instance_id: localInstanceId,
            from_instance_id: localInstanceId,
            to_instance_id: targetInstanceId,
            confirmed_by_target: false,
            track: trackToTransfer,
            queue: queueToTransfer,
            progress_ms: progressMsToTransfer,
            auto_play: autoPlay,
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success || !json?.transferCommand?.command_id) {
          setIsSendingCommand(false);
          showTransientFeedback(
            "error",
            json?.error || "Perangkat tujuan tidak merespons. Pemutaran tetap dilanjutkan di sini.",
            4000
          );
          return;
        }

        const cmdId = json.transferCommand.command_id as string;
        const timeoutId = setTimeout(() => {
          pendingCommandMapRef.current.delete(cmdId);
          if (pendingCommandMapRef.current.size === 0) {
            setIsSendingCommand(false);
          }
          showTransientFeedback(
            "error",
            "Perangkat tujuan tidak merespons tepat waktu. Musik tetap diputar di perangkat ini.",
            4500
          );
        }, 6_500);

        pendingCommandMapRef.current.set(cmdId, {
          timeoutId,
          commandType: "TRANSFER_PLAYBACK",
          targetInstanceId,
          onConfirmedSuccess: () => {
            // Target device confirmed playback started -> now pause local player!
            claimActiveUntilRef.current = 0;
            bridgeRef.current.onRemotePause();
          },
        });

        applyServerResponse(json);
        sendWakeupPing();
      } catch (err: any) {
        setIsSendingCommand(false);
        showTransientFeedback(
          "error",
          err?.message || "Gagal memindahkan pemutaran. Musik tetap diputar di sini.",
          3500
        );
      }
    },
    [
      enabled,
      localInstanceId,
      localDeviceName,
      sessions,
      showTransientFeedback,
      applyServerResponse,
      sendWakeupPing,
    ]
  );

  // Called when user taps "Aktifkan Audio" after mobile/iOS browser blocked autoplay during transfer
  const unlockAutoplayAndConfirmTransfer = useCallback(async () => {
    setAutoplayBlockedPrompt(false);
    const b = bridgeRef.current;
    const started = await b.onRemotePlay();
    if (!started) {
      setAutoplayBlockedPrompt(true);
      return;
    }

    claimActiveUntilRef.current = Date.now() + 15_000;
    const pending = pendingTransferConfirmRef.current;
    pendingTransferConfirmRef.current = null;

    try {
      const res = await fetch("/api/music/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer_app",
          initiator_instance_id: localInstanceId,
          from_instance_id: pending?.fromInstanceId || localInstanceId,
          to_instance_id: localInstanceId,
          confirmed_by_target: true,
          track: pending?.track || b.currentTrack,
          queue: pending?.queue || b.queue,
          progress_ms: pending?.progressMs ?? Math.round((b.currentTime || 0) * 1000),
          auto_play: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) {
        applyServerResponse(json);
        sendWakeupPing();
      }
    } catch {}
  }, [localInstanceId, applyServerResponse, sendWakeupPing]);

  // Execute Official Spotify Connect Web API action
  const executeSpotifyAction = useCallback(
    async (params: {
      spotifyAction: "TRANSFER" | "PLAY" | "PAUSE" | "NEXT" | "PREVIOUS" | "SEEK" | "VOLUME";
      deviceId?: string;
      play?: boolean;
      positionMs?: number;
      volumePercent?: number;
    }) => {
      setIsSendingCommand(true);
      showTransientFeedback("pending", "Menghubungi Spotify Connect...", 6000);
      try {
        const res = await fetch("/api/music/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "spotify_action",
            spotify_action: params.spotifyAction,
            device_id: params.deviceId,
            play: params.play,
            position_ms: params.positionMs,
            volume_percent: params.volumePercent,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (json?.spotifyConnect) {
          setSpotifyConnect(json.spotifyConnect);
        }
        showTransientFeedback(
          res.ok && json?.success ? "success" : "error",
          json?.message ||
            (res.ok ? "Berhasil" : "Gagal menjalankan perintah Spotify Connect"),
          3500
        );
      } catch (err: any) {
        showTransientFeedback("error", err?.message || "Koneksi ke Spotify gagal.", 3500);
      } finally {
        setIsSendingCommand(false);
      }
    },
    [showTransientFeedback]
  );

  // Rename local device
  const handleRenameLocalDevice = useCallback(
    (newName: string) => {
      const info = detectDeviceInfo(localInstanceId);
      const finalName = newName.trim() || info.deviceName;
      setLocalDeviceName(finalName);
      setTimeout(() => {
        void syncHeartbeat({ notifyPeers: true });
      }, 50);
    },
    [localInstanceId, syncHeartbeat]
  );

  // Computed: Other online devices & remote active session
  const onlineOtherSessions = useMemo(() => {
    const now = Date.now();
    return sessions.filter(
      (s) => s.session_instance_id !== localInstanceId && isDeviceSessionOnline(s, now)
    );
  }, [sessions, localInstanceId]);

  const remoteActiveSession = useMemo(() => {
    if (bridge.isPlaying) return null;
    const playingOther = onlineOtherSessions.find(
      (s) => s.is_playing && s.current_track_id
    );
    if (playingOther) return playingOther;

    const activeOther = onlineOtherSessions.find(
      (s) => s.is_active_playback && s.current_track_id
    );
    return activeOther || null;
  }, [bridge.isPlaying, onlineOtherSessions]);

  return {
    enabled,
    localInstanceId,
    localDeviceName,
    sessions,
    activeSession,
    remoteActiveSession,
    onlineOtherDevicesCount: onlineOtherSessions.length,
    spotifyConnect,
    showConnectModal,
    setShowConnectModal,
    isLoadingDevices,
    isSendingCommand,
    commandFeedback,
    autoplayBlockedPrompt,
    setAutoplayBlockedPrompt,
    unlockAutoplayAndConfirmTransfer,
    refreshDevices,
    sendAppCommand,
    transferAppPlayback,
    executeSpotifyAction,
    handleRenameLocalDevice,
  };
}
