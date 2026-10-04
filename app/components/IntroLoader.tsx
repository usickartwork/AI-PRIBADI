"use client";

import React, { useEffect, useState } from "react";

export type AppInitStatus = "initializing" | "ready" | "error";

export interface IntroLoaderProps {
  state: "visible" | "exiting";
  theme?: "dark" | "light";
}

/**
 * Usick One — Dynamic Logo Intro
 * Concept: "Logo Awakening"
 *
 * Fullscreen initialization overlay centered on the Usick One 4-point sparkle star.
 * No conventional spinners, no progress bars, no "Loading..." text.
 * Smoothly transitions from hidden -> awaken -> stabilization -> seamless reveal.
 */
export function IntroLoader({ state, theme = "dark" }: IntroLoaderProps) {
  const isDark = theme === "dark";
  const isExiting = state === "exiting";

  return (
    <div
      role="status"
      aria-label="Memuat Usick One"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isDark ? "bg-[#09090b] text-white" : "bg-[#fafafc] text-zinc-900"
      } ${
        isExiting
          ? "opacity-0 scale-[1.03] pointer-events-none"
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
            ? "bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_65%)]"
            : "bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.03)_0%,transparent_65%)]"
        }`}
      />

      {/* ─── Center Awakening Logo Core ───────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center animate-usick-awaken">
        {/* Luminous Radiant Glow Aura (Breathes in harmony with logo) */}
        <div
          className={`absolute -inset-6 sm:-inset-8 rounded-full blur-2xl pointer-events-none animate-usick-aura transition-all duration-500 ${
            isDark
              ? "bg-gradient-to-tr from-white/12 via-zinc-400/8 to-transparent"
              : "bg-gradient-to-tr from-black/6 via-zinc-500/4 to-transparent"
          }`}
        />

        {/* Usick One Logo Badge Squircle */}
        <div
          className={`relative flex items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-[26px] transition-all duration-300 animate-usick-breath ${
            isDark
              ? "bg-gradient-to-b from-[#18181c] to-[#0f0f12] border border-white/12 shadow-[0_12px_44px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.05)]"
              : "bg-black border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.06)] text-white"
          }`}
        >
          {/* Subtle Inner Highlight Refraction */}
          <div className="absolute inset-0 rounded-[26px] bg-gradient-to-t from-transparent via-transparent to-white/[0.08] pointer-events-none" />

          {/* Usick One Official Geometric 4-Point Sparkle Star */}
          <svg
            className="w-10 h-10 sm:w-11 sm:h-11 fill-current relative z-10 animate-usick-shimmer transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        </div>
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
  minDurationMs = 1600,
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
