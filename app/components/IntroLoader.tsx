"use client";

import React, { useEffect, useRef, useState } from "react";
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
 * 100% Solid Black Background (No transparency) to cover the page until video & content are loaded.
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
          speed={3.2}
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

// Module-scoped memory flag: persists across client-side page navigation in the same session
let hasIntroEverCompleted = false;

export function isIntroCompleted(): boolean {
  if (hasIntroEverCompleted) return true;
  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem("onemind_intro_completed") === "true") {
        hasIntroEverCompleted = true;
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

export function markIntroCompleted(): void {
  hasIntroEverCompleted = true;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("onemind_intro_completed", "true");
    } catch {
      // ignore
    }
  }
}

/**
 * Custom hook to orchestrate application initialization:
 * - Keeps the solid black intro screen active until the web process/hero video is ready.
 * - Guarantees minimum duration (~1.1s) on first entrance so the "One Mind" TechText sweep and model slider play smoothly.
 * - Transitions with an elegant fade-out exit once both minDuration and isReady are met.
 * - Saves session state so navigating back from /usick-one, /harga, etc. NEVER re-runs the intro or delays the user.
 * - Has a safety timeout (~5s) to ensure the user never gets stuck.
 */
export function useAppInitializer({
  authLoading = false,
  subscriptionReady = true,
  minDurationMs = 1100,
  safetyTimeoutMs = 5000,
  isReady = true,
}: {
  authLoading?: boolean;
  sessionsReady?: boolean;
  subscriptionReady?: boolean;
  minDurationMs?: number;
  safetyTimeoutMs?: number;
  isReady?: boolean;
} = {}) {
  const [introState, setIntroState] = useState<"visible" | "exiting" | "gone">(() => {
    return isIntroCompleted() ? "gone" : "visible";
  });
  const minTimePassedRef = useRef(isIntroCompleted());

  const combinedReady = Boolean(isReady && !authLoading && subscriptionReady);
  const isReadyRef = useRef(combinedReady);

  useEffect(() => {
    isReadyRef.current = combinedReady;
  }, [combinedReady]);

  useEffect(() => {
    // Jika intro sudah pernah selesai di sesi ini, langsung selesai tanpa timer/animasi ulang
    if (isIntroCompleted()) {
      setIntroState("gone");
      return;
    }

    let unmountTimer: NodeJS.Timeout | null = null;

    const triggerExit = () => {
      setIntroState((prev) => {
        if (prev === "visible") {
          markIntroCompleted();
          unmountTimer = setTimeout(() => {
            setIntroState("gone");
          }, 300);
          return "exiting";
        }
        return prev;
      });
    };

    // 1. Min duration timer: allows the TechText & logo cloud animation to complete gracefully
    const minTimer = setTimeout(() => {
      minTimePassedRef.current = true;
      if (isReadyRef.current) {
        triggerExit();
      }
    }, minDurationMs);

    // 2. Absolute safety fallback to prevent any stuck state
    const safetyTimer = setTimeout(() => {
      triggerExit();
    }, safetyTimeoutMs);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(safetyTimer);
      if (unmountTimer) clearTimeout(unmountTimer);
    };
  }, [minDurationMs, safetyTimeoutMs]);

  // When combinedReady changes to true, if min time already passed, trigger exit immediately
  useEffect(() => {
    if (isIntroCompleted() && introState === "gone") return;

    if (combinedReady && minTimePassedRef.current && introState === "visible") {
      markIntroCompleted();
      setIntroState("exiting");
      const unmountTimer = setTimeout(() => {
        setIntroState("gone");
      }, 300);
      return () => clearTimeout(unmountTimer);
    }
  }, [combinedReady, introState]);

  return {
    introState,
    isInitializing: introState !== "gone",
  };
}
