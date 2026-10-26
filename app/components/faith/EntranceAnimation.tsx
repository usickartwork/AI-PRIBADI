'use client';

import React, { useState, useEffect } from 'react';
import { useFaithNav } from '@/lib/faith/navigationContext';

interface EntranceAnimationProps {
  onComplete?: () => void;
}

export default function EntranceAnimation({ onComplete }: EntranceAnimationProps) {
  const { isDark } = useFaithNav();
  // Stages: 'initial' -> 'active' (breathing & ripples) -> 'revealing' (smooth dissolve) -> 'done'
  const [stage, setStage] = useState<'initial' | 'active' | 'revealing' | 'done'>('initial');

  useEffect(() => {
    // If already seen in this session, skip immediately
    try {
      if (sessionStorage.getItem('faith_hub_intro_seen')) {
        setStage('done');
        onComplete?.();
        return;
      }
    } catch {}

    // Check if user prefers reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const exitTimer = setTimeout(() => {
        setStage('revealing');
        setTimeout(() => {
          try {
            sessionStorage.setItem('faith_hub_intro_seen', 'true');
          } catch {}
          setStage('done');
          onComplete?.();
        }, 150);
      }, 300);
      return () => clearTimeout(exitTimer);
    }

    // Step 1: Smooth entrance to active stage
    const enterTimer = setTimeout(() => {
      setStage('active');
    }, 40);

    // Step 2: Trigger smooth borderless dissolve
    const revealTimer = setTimeout(() => {
      setStage('revealing');
    }, 1200);

    // Step 3: Complete and unmount
    const doneTimer = setTimeout(() => {
      try {
        sessionStorage.setItem('faith_hub_intro_seen', 'true');
      } catch {}
      setStage('done');
      onComplete?.();
    }, 1700);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(revealTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  // Instant skip on tap/click anywhere
  const handleDismiss = () => {
    if (stage === 'initial' || stage === 'active') {
      try {
        sessionStorage.setItem('faith_hub_intro_seen', 'true');
      } catch {}
      setStage('revealing');
      setTimeout(() => {
        setStage('done');
        onComplete?.();
      }, 400);
    }
  };

  if (stage === 'done') return null;

  const isActive = stage === 'active';
  const isRevealing = stage === 'revealing';

  return (
    <div
      onClick={handleDismiss}
      role="presentation"
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center p-6 overflow-hidden select-none cursor-pointer transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isRevealing
          ? 'opacity-0 scale-[1.04] blur-[4px] pointer-events-none'
          : 'opacity-100 scale-100 blur-0'
      }`}
      style={{
        backgroundColor: isDark ? 'rgba(11, 11, 13, 0.75)' : 'rgba(247, 247, 248, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Organic Concentric Ripples in pure monochrome / silver (No Box) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className={`absolute rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDark ? 'border border-white/10' : 'border border-[#111113]/[0.07]'
          } ${
            isActive ? 'w-[180px] h-[180px] scale-100 opacity-100' : 'w-[80px] h-[80px] scale-75 opacity-0'
          }`}
        />
        <div
          className={`absolute rounded-full transition-all duration-1200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDark ? 'border border-white/[0.07]' : 'border border-[#111113]/[0.05]'
          } ${
            isActive ? 'w-[320px] h-[320px] scale-100 opacity-80' : 'w-[140px] h-[140px] scale-80 opacity-0'
          }`}
        />
        <div
          className={`absolute rounded-full transition-all duration-1400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDark ? 'border border-white/[0.04]' : 'border border-[#111113]/[0.03]'
          } ${
            isActive ? 'w-[480px] h-[480px] scale-100 opacity-60' : 'w-[200px] h-[200px] scale-85 opacity-0'
          }`}
        />
      </div>

      {/* Pure Floating Center Content (Airy, No Rectangular Card Box) */}
      <div
        className={`relative z-10 flex flex-col items-center text-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isActive
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-3'
        } ${isRevealing ? '-translate-y-2 scale-[1.04]' : ''}`}
      >
        {/* Standalone Sacred Cross with Soft Pulse */}
        <div className="mb-4 relative flex items-center justify-center">
          {/* Subtle soft circular shadow */}
          <div
            className={`absolute w-16 h-16 rounded-full blur-md transition-all duration-700 ${
              isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'
            } ${
              isActive ? 'scale-125 opacity-100' : 'scale-90 opacity-0'
            }`}
          />

          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDark ? '#FFFFFF' : '#111113'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-10 drop-shadow-xs transition-transform duration-500 hover:scale-105"
            aria-hidden="true"
          >
            <path d="M12 3v18" />
            <path d="M7 8h10" />
          </svg>
        </div>

        {/* Brand Title: Pure Typography (#111113, refined tracking) */}
        <h1 className={`text-base sm:text-lg font-bold tracking-[0.24em] uppercase mb-1.5 ${
          isDark ? 'text-white' : 'text-[#111113]'
        }`}>
          Faith Hub
        </h1>

        {/* Monochromatic Tagline: (#66666E / #8E8E93) */}
        <p className={`text-xs sm:text-[13px] font-normal italic max-w-[260px] leading-relaxed ${
          isDark ? 'text-[#8E8E93]' : 'text-[#66666E]'
        }`}>
          Ruang Teduh &amp; Firman untuk Jiwamu
        </p>

        {/* Minimal Breathing Indicator (3 subtle organic dots, no box) */}
        <div className="mt-5 flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-700 delay-100 ${
              isDark ? 'bg-white' : 'bg-[#111113]'
            } ${
              isActive ? 'opacity-80 scale-100' : 'opacity-20 scale-75'
            }`}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-700 delay-200 ${
              isDark ? 'bg-white' : 'bg-[#111113]'
            } ${
              isActive ? 'opacity-50 scale-100' : 'opacity-20 scale-75'
            }`}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-700 delay-300 ${
              isDark ? 'bg-white' : 'bg-[#111113]'
            } ${
              isActive ? 'opacity-30 scale-100' : 'opacity-20 scale-75'
            }`}
          />
        </div>
      </div>

      {/* Subtle Bottom Tap Hint */}
      <div
        className={`absolute bottom-6 text-[10px] tracking-widest uppercase transition-opacity duration-700 ${
          isDark ? 'text-zinc-500' : 'text-[#8E8E93]'
        } ${
          isActive ? 'opacity-50' : 'opacity-0'
        }`}
      >
        Ketuk untuk membuka
      </div>
    </div>
  );
}
