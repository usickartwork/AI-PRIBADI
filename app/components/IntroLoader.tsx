"use client";

import React, { useEffect, useState } from "react";
import { TechText } from "./TechText";

export type AppInitStatus = "initializing" | "ready" | "error";

export interface IntroLoaderProps {
  state: "visible" | "exiting";
  theme?: "dark" | "light";
}

/**
 * One Mind — TechText Intro Loader (from React Bits)
 */
export function IntroLoader({ state, theme = "dark" }: IntroLoaderProps) {
  const isDark = theme === "dark";
  const isExiting = state === "exiting";

  return (
    <div
      role="status"
      aria-label="Memuat One Mind"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isDark ? "bg-[#09090b] text-white" : "bg-[#fafafc] text-zinc-900"
      } ${
        isExiting
          ? "opacity-0 scale-[1.04] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        width: "100vw",
        height: "100dvh",
      }}
    >
      {/* ─── Ambient Atmospheric Depth Light ─────────────────────────────────── */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          isDark
            ? "bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06)_0%,transparent_60%)]"
            : "bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.035)_0%,transparent_60%)]"
        }`}
      />

      {/* ─── Center Hero: TechText "One Mind" ───────────────────────────────── */}
      <div className="relative w-full max-w-2xl h-56 sm:h-72 flex items-center justify-center px-4 -translate-y-7 sm:translate-y-0">
        <TechText
          text="One Mind"
          fontWeight={700}
          fontSize={120}
          color={isDark ? "#ffffff" : "#09090b"}
          accentColor={isDark ? "#ffffff" : "#09090b"}
          reveal="letter"
          dashLength={4}
          dashGap={2}
          specks={15}
          sweep={true}
          speed={2.8}
          draggable={true}
        />
      </div>
    </div>
  );
}

/**
 * Original Living Star Logo (Preserved so it can be restored anytime if requested)
 */
export function OriginalStarLogo({ isDark }: { isDark: boolean }) {
  return (
    <div className="relative flex items-center justify-center animate-usick-star-entrance">
      {/* Concentric Energy Pulse Wave 1 */}
      <svg
        className={`absolute w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 pointer-events-none animate-usick-energy-wave ${
          isDark ? "text-white/40" : "text-black/25"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
      >
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>

      {/* Concentric Energy Pulse Wave 2 (Phase Delayed) */}
      <svg
        className={`absolute w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 pointer-events-none animate-usick-energy-wave-delayed ${
          isDark ? "text-white/30" : "text-black/20"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
      >
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>

      {/* Soft Radiant Atmospheric Glow Aura */}
      <svg
        className={`absolute w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 pointer-events-none animate-usick-star-aura transition-all duration-700 ${
          isDark ? "text-white/50" : "text-black/15"
        }`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>

      {/* The Main Organic Living Star */}
      <div className="relative z-10 animate-usick-star-living">
        <svg
          className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 transition-transform duration-300 ${
            isDark
              ? "drop-shadow-[0_0_24px_rgba(255,255,255,0.45)]"
              : "drop-shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="usickStarDark" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#e4e4e7" />
              <stop offset="100%" stopColor="#d4d4d8" />
            </linearGradient>

            <linearGradient id="usickStarLight" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="35%" stopColor="#18181b" />
              <stop offset="70%" stopColor="#09090b" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>

            <radialGradient id="usickCoreGleam" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path
            d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
            fill={isDark ? "url(#usickStarDark)" : "url(#usickStarLight)"}
          />

          <path
            d="M12 2L14.4 9.6L12 12Z"
            fill={isDark ? "#ffffff" : "#ffffff"}
            opacity={isDark ? "0.18" : "0.22"}
          />
          <path
            d="M12 22L9.6 14.4L12 12Z"
            fill={isDark ? "#000000" : "#000000"}
            opacity={isDark ? "0.22" : "0.18"}
          />
          <path
            d="M22 12L14.4 14.4L12 12Z"
            fill={isDark ? "#000000" : "#000000"}
            opacity={isDark ? "0.15" : "0.15"}
          />
          <path
            d="M2 12L9.6 9.6L12 12Z"
            fill={isDark ? "#ffffff" : "#ffffff"}
            opacity={isDark ? "0.28" : "0.28"}
          />

          <line
            x1="12"
            y1="2"
            x2="12"
            y2="22"
            stroke={isDark ? "#ffffff" : "#ffffff"}
            strokeOpacity={isDark ? "0.35" : "0.25"}
            strokeWidth="0.4"
          />
          <line
            x1="2"
            y1="12"
            x2="22"
            y2="12"
            stroke={isDark ? "#ffffff" : "#ffffff"}
            strokeOpacity={isDark ? "0.35" : "0.25"}
            strokeWidth="0.4"
          />

          <circle
            cx="12"
            cy="12"
            r="2.2"
            fill={isDark ? "url(#usickCoreGleam)" : "#ffffff"}
            opacity={isDark ? "0.8" : "0.6"}
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Custom hook to orchestrate application initialization and ensure smooth intro display:
 * - Guarantees minimum visual duration (~1.6s) so no glitch/flash occurs.
 * - Stays active if real initialization takes longer.
 * - Includes safety timeout fallback so the application is never permanently blocked.
 */
export function useAppInitializer({
  authLoading,
  sessionsReady,
  minDurationMs = 2900,
  safetyTimeoutMs = 6000,
}: {
  authLoading: boolean;
  sessionsReady: boolean;
  minDurationMs?: number;
  safetyTimeoutMs?: number;
}) {
  const [introState, setIntroState] = useState<"visible" | "exiting" | "gone">("visible");
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // 1. Minimum display timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDurationMs);
    return () => clearTimeout(timer);
  }, [minDurationMs]);

  // 2. Track actual readiness
  useEffect(() => {
    if (!authLoading && sessionsReady) {
      setAppReady(true);
    }
  }, [authLoading, sessionsReady]);

  // 3. Safety fallback timer to prevent infinite stuck loader
  useEffect(() => {
    const safety = setTimeout(() => {
      setAppReady(true);
      setMinTimeElapsed(true);
    }, safetyTimeoutMs);
    return () => clearTimeout(safety);
  }, [safetyTimeoutMs]);

  // 4. Trigger exit sequence once ready and min time has passed
  useEffect(() => {
    if (appReady && minTimeElapsed && introState === "visible") {
      setIntroState("exiting");
      const exitTimer = setTimeout(() => {
        setIntroState("gone");
      }, 400); // 400ms exit transition
      return () => clearTimeout(exitTimer);
    }
  }, [appReady, minTimeElapsed, introState]);

  return {
    introState,
    isInitializing: introState !== "gone",
  };
}
