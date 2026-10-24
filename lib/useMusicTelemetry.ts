"use client";

import { useCallback, useEffect, useRef } from "react";
import type { LocalPlaylist, MusicItem } from "@/lib/music";
import { getCanonicalTrackKey } from "@/lib/music";
import {
  type ListeningEndReason,
  type ListeningSourceContext,
  type MusicListeningEventInput,
  type MusicTasteProfileV1,
  applyListeningEventsToProfile,
  createEmptyTasteProfile,
  pruneTasteProfile,
  sanitizeTasteProfile,
  syncLibrarySignalsToProfile,
} from "@/lib/musicRecommendation";

const LOCAL_TASTE_KEY_PREFIX = "usick_music_taste_v1::";
const MAX_PENDING_QUEUE = 20;

interface ActivePlaySession {
  playSessionId: string;
  track: MusicItem;
  sourceContext: ListeningSourceContext;
  passiveAutoplayStreak: number;
  searchQuery?: string;
  audiblePlayedMs: number;
  maxObservedDurationMs: number;
  lastWallMs: number | null;
  lastPlayerSec: number | null;
  finalized: boolean;
  isFallbackOrFailed: boolean;
}

export interface UseMusicTelemetryOptions {
  userId: string | null | undefined;
  isAuthLoaded: boolean;
  instanceId?: string;
  isRemoteActive?: boolean;
}

function getScopedLocalTasteKey(userId: string | null | undefined): string {
  const scope = userId && userId.trim() ? userId.trim() : "guest";
  return `${LOCAL_TASTE_KEY_PREFIX}${scope}`;
}

function readLocalTasteMirror(userId: string | null | undefined): MusicTasteProfileV1 {
  if (typeof window === "undefined") return createEmptyTasteProfile();
  try {
    const raw = window.localStorage.getItem(getScopedLocalTasteKey(userId));
    if (!raw) return createEmptyTasteProfile();
    return sanitizeTasteProfile(JSON.parse(raw));
  } catch {
    return createEmptyTasteProfile();
  }
}

function writeLocalTasteMirror(
  userId: string | null | undefined,
  profile: MusicTasteProfileV1
): void {
  if (typeof window === "undefined") return;
  try {
    const pruned = pruneTasteProfile(profile);
    window.localStorage.setItem(
      getScopedLocalTasteKey(userId),
      JSON.stringify(pruned)
    );
  } catch {
    // Ignore storage quota errors safely
  }
}

function makePlaySessionId(instanceId?: string): string {
  const prefix = instanceId ? instanceId.slice(0, 16) : "web";
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useMusicTelemetry({
  userId,
  isAuthLoaded,
  instanceId,
  isRemoteActive = false,
}: UseMusicTelemetryOptions) {
  const userIdRef = useRef<string | null>(userId || null);
  const instanceIdRef = useRef<string | undefined>(instanceId);
  const isRemoteActiveRef = useRef<boolean>(Boolean(isRemoteActive));

  const activeSessionRef = useRef<ActivePlaySession | null>(null);
  const pendingEventsRef = useRef<MusicListeningEventInput[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef<boolean>(false);
  const passiveStreakRef = useRef<number>(0);

  // Scoped local taste profile ref for <1ms instant client-side Smart Autoplay ranking
  const localProfileRef = useRef<MusicTasteProfileV1>(createEmptyTasteProfile());
  // Scoped ring buffer of canonical track keys played in this browser session
  const sessionRecentKeysRef = useRef<string[]>([]);

  useEffect(() => {
    instanceIdRef.current = instanceId;
  }, [instanceId]);

  useEffect(() => {
    isRemoteActiveRef.current = Boolean(isRemoteActive);
  }, [isRemoteActive]);

  // Reload isolated local taste mirror whenever authenticated account changes
  useEffect(() => {
    if (!isAuthLoaded) return;
    const prevUser = userIdRef.current;
    const nextUser = userId || null;
    userIdRef.current = nextUser;

    if (prevUser !== nextUser) {
      // Account boundary crossed: drop any pending events from prior account to guarantee zero cross-account bleed
      activeSessionRef.current = null;
      pendingEventsRef.current = [];
      passiveStreakRef.current = 0;
      sessionRecentKeysRef.current = [];
    }

    localProfileRef.current = readLocalTasteMirror(nextUser);
  }, [userId, isAuthLoaded]);

  const flushEvents = useCallback(async (useBeacon = false) => {
    const activeUser = userIdRef.current;
    if (!activeUser || pendingEventsRef.current.length === 0) return;

    const batch = pendingEventsRef.current.splice(0, MAX_PENDING_QUEUE);
    const payloadStr = JSON.stringify({ events: batch });

    if (
      useBeacon &&
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      try {
        const blob = new Blob([payloadStr], { type: "application/json" });
        const queued = navigator.sendBeacon("/api/music/events", blob);
        if (queued) return;
      } catch {
        // Fall through to keepalive fetch
      }
    }

    if (isFlushingRef.current) {
      pendingEventsRef.current = [...batch, ...pendingEventsRef.current].slice(
        0,
        MAX_PENDING_QUEUE
      );
      return;
    }

    isFlushingRef.current = true;
    try {
      const res = await fetch("/api/music/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payloadStr,
        keepalive: true,
      });
      if (!res.ok && res.status >= 500) {
        // Re-queue transient server failure once
        pendingEventsRef.current = [...batch, ...pendingEventsRef.current].slice(
          0,
          MAX_PENDING_QUEUE
        );
      }
    } catch {
      pendingEventsRef.current = [...batch, ...pendingEventsRef.current].slice(
        0,
        MAX_PENDING_QUEUE
      );
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  const scheduleFlush = useCallback(
    (delayMs = 800) => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        void flushEvents(false);
      }, delayMs);
    },
    [flushEvents]
  );

  const buildEventFromSession = useCallback(
    (
      session: ActivePlaySession,
      reason: ListeningEndReason,
      isRepeatOne = false
    ): MusicListeningEventInput | null => {
      if (session.track.isLiveRadio) return null;
      const effectiveReason: ListeningEndReason = session.isFallbackOrFailed
        ? "playback_error"
        : reason;

      // Ignore zero-audio transient mounts unless an explicit fast manual skip after >=1.5s
      if (
        effectiveReason !== "playback_error" &&
        session.audiblePlayedMs < 1500
      ) {
        return null;
      }

      const durationMs = Math.max(
        session.maxObservedDurationMs,
        session.track.durationMs || 210_000
      );

      return {
        playSessionId: session.playSessionId,
        instanceId: instanceIdRef.current,
        track: {
          id: session.track.id,
          title: session.track.title,
          artistNames: session.track.artistNames,
          artistIds: session.track.artistIds,
          albumTitle: session.track.albumTitle,
          albumId: session.track.albumId,
          releaseYear: session.track.releaseYear,
          durationMs,
          genres: session.track.genres,
          popularity: session.track.popularity ?? null,
          catalogSource: session.track.catalogSource,
          canonicalKey:
            session.track.canonicalKey || getCanonicalTrackKey(session.track),
          isLiveRadio: Boolean(session.track.isLiveRadio),
          isFallbackAudio:
            Boolean(session.track.isFallbackAudio) || session.isFallbackOrFailed,
        },
        audiblePlayedMs: Math.round(session.audiblePlayedMs),
        trackDurationMs: Math.round(durationMs),
        sourceContext: session.sourceContext,
        reason: effectiveReason,
        isRepeatOne,
        passiveAutoplayStreak: session.passiveAutoplayStreak,
        searchQuery: session.searchQuery,
        timestamp: new Date().toISOString(),
      };
    },
    []
  );

  const finalizeActiveSession = useCallback(
    (
      reason: ListeningEndReason,
      options?: { isRepeatOne?: boolean; flushImmediately?: boolean }
    ) => {
      const session = activeSessionRef.current;
      if (!session || session.finalized) return;
      session.finalized = true;
      activeSessionRef.current = null;

      const event = buildEventFromSession(
        session,
        reason,
        Boolean(options?.isRepeatOne)
      );
      if (!event) return;

      // Apply immediately to local taste mirror (<1ms) so next Autoplay decision reflects this play/skip right away
      const { profile: updated } = applyListeningEventsToProfile(
        localProfileRef.current,
        [event]
      );
      localProfileRef.current = updated;
      writeLocalTasteMirror(userIdRef.current, updated);

      if (userIdRef.current) {
        pendingEventsRef.current = [
          ...pendingEventsRef.current,
          event,
        ].slice(-MAX_PENDING_QUEUE);
        if (options?.flushImmediately) {
          void flushEvents(true);
        } else {
          scheduleFlush(450);
        }
      }
    },
    [buildEventFromSession, flushEvents, scheduleFlush]
  );

  const startTrackSession = useCallback(
    (
      track: MusicItem,
      options?: {
        sourceContext?: ListeningSourceContext;
        searchQuery?: string;
        previousEndReason?: ListeningEndReason;
      }
    ) => {
      // Finalize any previously active session first
      if (activeSessionRef.current && !activeSessionRef.current.finalized) {
        finalizeActiveSession(options?.previousEndReason || "track_change");
      }

      if (track.isLiveRadio || isRemoteActiveRef.current) {
        activeSessionRef.current = null;
        return;
      }

      const sourceContext = options?.sourceContext || "unknown";
      if (sourceContext === "autoplay") {
        passiveStreakRef.current += 1;
      } else {
        passiveStreakRef.current = 0;
      }

      const cKey = track.canonicalKey || getCanonicalTrackKey(track);
      if (cKey) {
        sessionRecentKeysRef.current = [
          cKey,
          ...sessionRecentKeysRef.current.filter((k) => k !== cKey),
        ].slice(0, 30);
      }

      activeSessionRef.current = {
        playSessionId: makePlaySessionId(instanceIdRef.current),
        track,
        sourceContext,
        passiveAutoplayStreak: passiveStreakRef.current,
        searchQuery:
          sourceContext === "search" && options?.searchQuery
            ? options.searchQuery.trim().slice(0, 80)
            : undefined,
        audiblePlayedMs: 0,
        maxObservedDurationMs: track.durationMs || 0,
        lastWallMs: null,
        lastPlayerSec: null,
        finalized: false,
        isFallbackOrFailed: Boolean(track.isFallbackAudio),
      };
    },
    [finalizeActiveSession]
  );

  const tickAudiblePlayback = useCallback(
    (params: {
      isPlaying: boolean;
      isScrubbing: boolean;
      playerCurrentSec: number;
      playerDurationSec?: number;
    }) => {
      const session = activeSessionRef.current;
      if (!session || session.finalized) return;

      if (
        params.playerDurationSec &&
        Number.isFinite(params.playerDurationSec) &&
        params.playerDurationSec > 10
      ) {
        session.maxObservedDurationMs = Math.max(
          session.maxObservedDurationMs,
          params.playerDurationSec * 1000
        );
      }

      const now = Date.now();
      const curSec = Number.isFinite(params.playerCurrentSec)
        ? Math.max(0, params.playerCurrentSec)
        : 0;

      if (
        !params.isPlaying ||
        params.isScrubbing ||
        isRemoteActiveRef.current ||
        session.isFallbackOrFailed ||
        session.track.isLiveRadio
      ) {
        session.lastWallMs = now;
        session.lastPlayerSec = curSec;
        return;
      }

      if (session.lastWallMs !== null && session.lastPlayerSec !== null) {
        const dtWallMs = now - session.lastWallMs;
        const dtPlayerMs = (curSec - session.lastPlayerSec) * 1000;

        // Only count monotonic forward audio progression (excludes seeks >3.5s, backwards seeks, and buffering stalls)
        if (
          dtWallMs > 0 &&
          dtWallMs <= 4000 &&
          dtPlayerMs > 15 &&
          dtPlayerMs <= 3500
        ) {
          session.audiblePlayedMs += Math.min(dtWallMs, dtPlayerMs, 2000);
        }
      }

      session.lastWallMs = now;
      session.lastPlayerSec = curSec;
    },
    []
  );

  const recordRepeatOneLoop = useCallback(() => {
    const prev = activeSessionRef.current;
    if (!prev || prev.finalized || prev.track.isLiveRadio) return;
    const track = prev.track;
    const sourceContext = prev.sourceContext;

    finalizeActiveSession("replay", { isRepeatOne: true });

    activeSessionRef.current = {
      playSessionId: makePlaySessionId(instanceIdRef.current),
      track,
      sourceContext,
      passiveAutoplayStreak: passiveStreakRef.current,
      audiblePlayedMs: 0,
      maxObservedDurationMs: track.durationMs || 0,
      lastWallMs: Date.now(),
      lastPlayerSec: 0,
      finalized: false,
      isFallbackOrFailed: false,
    };
  }, [finalizeActiveSession]);

  const markPlaybackFailure = useCallback(() => {
    const session = activeSessionRef.current;
    if (!session || session.finalized) return;
    session.isFallbackOrFailed = true;
    finalizeActiveSession("playback_error");
  }, [finalizeActiveSession]);

  const syncLocalLibraryMirror = useCallback(
    (likedSongs: MusicItem[], playlists: LocalPlaylist[]) => {
      const synced = syncLibrarySignalsToProfile(
        localProfileRef.current,
        likedSongs,
        playlists
      );
      localProfileRef.current = synced;
      writeLocalTasteMirror(userIdRef.current, synced);
    },
    []
  );

  // Flush any active/pending listening telemetry on tab unload via sendBeacon
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePageHide = () => {
      const session = activeSessionRef.current;
      if (
        session &&
        !session.finalized &&
        session.audiblePlayedMs >= 5000 &&
        !session.isFallbackOrFailed
      ) {
        finalizeActiveSession("page_unload", { flushImmediately: true });
      } else if (pendingEventsRef.current.length > 0) {
        void flushEvents(true);
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, [finalizeActiveSession, flushEvents]);

  return {
    localProfileRef,
    sessionRecentKeysRef,
    startTrackSession,
    tickAudiblePlayback,
    finalizeActiveSession,
    recordRepeatOneLoop,
    markPlaybackFailure,
    syncLocalLibraryMirror,
  };
}
