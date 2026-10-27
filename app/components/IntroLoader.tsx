"use client";

import React, { useEffect, useState } from "react";
import { TechText } from "./TechText";
import { LogoCloud } from "@/components/ui/logo-cloud-3";
import { BrainLogo } from "@/components/ui/brain-logo";

export type AppInitStatus = "initializing" | "ready" | "error";

export interface IntroLoaderProps {
  state: "visible" | "exiting";
  theme?: "dark" | "light";
}

/**
 * One Mind — TechText Intro Loader (from React Bits)
 */
export function IntroLoader({ state }: IntroLoaderProps) {
  const isExiting = state === "exiting";

  return (
    <div
      role="status"
      aria-label="Memuat One Mind"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[#09090b] text-white ${
        isExiting
          ? "opacity-0 scale-[1.03] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        width: "100vw",
        height: "100dvh",
        backgroundColor: "#09090b",
        color: "#ffffff",
      }}
    >
      {/* ─── Ambient Atmospheric Depth Light ─────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)",
        }}
      />

      {/* ─── Center Hero: TechText "One Mind" ───────────────────────────────── */}
      <div className="relative w-full max-w-2xl sm:max-w-3xl h-36 sm:h-44 md:h-48 flex items-center justify-center px-4 -translate-y-2 sm:-translate-y-4 font-[family-name:var(--font-geist-sans)]">
        <TechText
          text="One Mind"
          fontFamily="var(--font-geist-sans), Geist, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight={700}
          fontSize={120}
          color="#ffffff"
          accentColor="#ffffff"
          reveal="letter"
          dashLength={4}
          dashGap={2}
          specks={15}
          sweep={true}
          speed={2.4}
          draggable={true}
        />
      </div>

      {/* ─── Logo Cloud: Model & LLM Provider Slider (Tepat di bawah One Mind) ─── */}
      <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl px-4 -mt-3 sm:-mt-5 md:-mt-6 flex flex-col items-center animate-in fade-in-0 duration-400">
        <LogoCloud isDark={true} duration={6} className="w-full py-1.5" />
      </div>
    </div>
  );
}

/**
 * Official Brain Logo with Living Aura (Updated from legacy star logo)
 */
export function OriginalStarLogo({ isDark }: { isDark: boolean }) {
  return (
    <div className="relative flex items-center justify-center animate-usick-star-entrance">
      <BrainLogo
        className={`absolute w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 pointer-events-none animate-usick-star-aura transition-all duration-700 ${
          isDark ? "text-white/25" : "text-black/15"
        }`}
      />
      <div className="relative z-10 animate-usick-star-living">
        <BrainLogo
          className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 transition-transform duration-300 ${
            isDark
              ? "text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.45)]"
              : "text-black drop-shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
          }`}
        />
      </div>
    </div>
  );
}

/**
 * Custom hook to orchestrate application initialization and ensure smooth intro display:
 * - Guarantees visual duration (~1.9s) so the "One Mind" TechText sweep and model slider play smoothly.
 * - Transitions with an elegant fade-out exit.
 * - Guaranteed self-contained timer so it NEVER gets stuck on page load or refresh.
 */
export function useAppInitializer({
  authLoading,
  sessionsReady,
  subscriptionReady = true,
  minDurationMs = 1900,
  safetyTimeoutMs = 2500,
}: {
  authLoading?: boolean;
  sessionsReady?: boolean;
  subscriptionReady?: boolean;
  minDurationMs?: number;
  safetyTimeoutMs?: number;
} = {}) {
  const [introState, setIntroState] = useState<"visible" | "exiting" | "gone">("visible");

  useEffect(() => {
    // 1. Play animation for minDurationMs (~1.9s), then trigger exit transition
    const exitTimer = setTimeout(() => {
      setIntroState("exiting");
    }, minDurationMs);

    // 2. Unmount loader after exit animation finishes (350ms transition)
    const unmountTimer = setTimeout(() => {
      setIntroState("gone");
    }, minDurationMs + 350);

    // 3. Absolute safety fallback to prevent any stuck state
    const safetyTimer = setTimeout(() => {
      setIntroState("gone");
    }, safetyTimeoutMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
      clearTimeout(safetyTimer);
    };
  }, [minDurationMs, safetyTimeoutMs]);

  return {
    introState,
    isInitializing: introState !== "gone",
  };
}
