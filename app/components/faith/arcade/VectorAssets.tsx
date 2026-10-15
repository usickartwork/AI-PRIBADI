'use client';

import React from 'react';

// ==========================================
// FAITH LAMB (DOMBA) — REAL VECTOR MASCOT
// ==========================================

export interface FaithLambProps {
  stage?: 'egg' | 'baby' | 'young' | 'adult';
  mood?: 'happy' | 'neutral' | 'hungry' | 'sleepy' | 'dirty';
  isBlinking?: boolean;
  isMouthOpen?: boolean;
  isChewing?: boolean;
  isSleeping?: boolean;
  isJumping?: boolean;
  isWalking?: boolean;
  equippedHat?: string | null;
  equippedGlasses?: string | null;
  equippedAccessory?: string | null;
  eyeOffsetX?: number;
  eyeOffsetY?: number;
  dirtLevel?: number; // 0 (clean) to 3 (very dirty)
}

export function FaithLamb({
  stage = 'young',
  mood = 'happy',
  isBlinking = false,
  isMouthOpen = false,
  isChewing = false,
  isSleeping = false,
  isJumping = false,
  isWalking = false,
  equippedHat = null,
  equippedGlasses = null,
  equippedAccessory = null,
  eyeOffsetX = 0,
  eyeOffsetY = 0,
  dirtLevel = 0,
}: FaithLambProps) {
  // EGG STAGE: Wool-lined warm egg
  if (stage === 'egg') {
    return (
      <div
        className={`relative transition-transform duration-300 ${
          isJumping ? '-translate-y-6 scale-105' : 'translate-y-0'
        }`}
      >
        <svg width="130" height="150" viewBox="0 0 100 120" fill="none" className="drop-shadow-md">
          {/* Straw & Wool Nest */}
          <ellipse cx="50" cy="110" rx="42" ry="10" fill="#E6D3B3" stroke="#C2A67E" strokeWidth="2" />
          <path d="M 12 110 Q 50 118 88 110" stroke="#B08D5B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="20" cy="106" r="6" fill="#F8F6F0" />
          <circle cx="80" cy="106" r="6" fill="#F8F6F0" />
          <circle cx="50" cy="112" r="7" fill="#F8F6F0" />

          {/* Egg Shell */}
          <path
            d="M 50 10 C 76 10, 90 46, 90 76 C 90 100, 74 108, 50 108 C 26 108, 10 100, 10 76 C 10 46, 24 10, 50 10 Z"
            fill="url(#lambEggGrad)"
            stroke="#D8CFBE"
            strokeWidth="3"
          />
          {/* Subtle wool curls on egg */}
          <path
            d="M 32 40 Q 36 34 40 40 Q 44 34 48 40"
            stroke="#DCD2C0"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 54 62 Q 58 56 62 62 Q 66 56 70 62"
            stroke="#DCD2C0"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Egg Shine */}
          <path
            d="M 28 24 C 22 36, 18 54, 20 70"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.7"
          />

          <defs>
            <linearGradient id="lambEggGrad" x1="50" y1="10" x2="50" y2="108" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFDF9" />
              <stop offset="0.6" stopColor="#F9F5EC" />
              <stop offset="1" stopColor="#EAE2D2" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // SCALE BY STAGE
  const scale = stage === 'baby' ? 0.88 : stage === 'young' ? 1 : 1.15;
  const width = 155 * scale;
  const height = 150 * scale;

  return (
    <div
      className={`relative select-none transition-transform duration-200 ${
        isJumping ? '-translate-y-7 scale-105' : isWalking && !isSleeping ? 'animate-lamb-waddle' : 'translate-y-0'
      }`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        className="overflow-visible filter drop-shadow-md"
      >
        <defs>
          {/* Fluffy Wool Gradient */}
          <linearGradient id="woolGrad" x1="60" y1="10" x2="60" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.75" stopColor="#F4EFEB" />
            <stop offset="1" stopColor="#E5DDD3" />
          </linearGradient>

          {/* Soft Lamb Face Skin */}
          <linearGradient id="lambSkin" x1="60" y1="35" x2="60" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FAF1EB" />
            <stop offset="1" stopColor="#F0DFD3" />
          </linearGradient>

          {/* Golden Halo Gradient */}
          <linearGradient id="lambHalo" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#FFE066" />
            <stop offset="0.5" stopColor="#FFF9DB" />
            <stop offset="1" stopColor="#F59F00" />
          </linearGradient>
        </defs>

        {/* 1. LITTLE HOOVES (LEGS) WITH WALKING ANIMATION */}
        <g>
          {/* Left Hooves */}
          <g className={isWalking && !isSleeping ? 'animate-lamb-leg-l' : ''}>
            <rect x="36" y="94" width="9" height="15" rx="4.5" fill="#4B3A2F" />
            <rect x="46" y="96" width="9.5" height="15" rx="4.5" fill="#5C473A" />
            <line x1="46" y1="106" x2="55.5" y2="106" stroke="#3A2C24" strokeWidth="1.2" />
          </g>

          {/* Right Hooves */}
          <g className={isWalking && !isSleeping ? 'animate-lamb-leg-r' : ''}>
            <rect x="75" y="94" width="9" height="15" rx="4.5" fill="#4B3A2F" />
            <rect x="64.5" y="96" width="9.5" height="15" rx="4.5" fill="#5C473A" />
            <line x1="64.5" y1="106" x2="74" y2="106" stroke="#3A2C24" strokeWidth="1.2" />
          </g>
        </g>

        {/* 2. BODY WOOL CLOUDS (Back & Side Puffs) */}
        <g stroke="#D5CCC0" strokeWidth="2.2" strokeLinejoin="round">
          {/* Back wool puff clusters */}
          <circle cx="26" cy="68" r="15" fill="url(#woolGrad)" />
          <circle cx="94" cy="68" r="15" fill="url(#woolGrad)" />
          <circle cx="28" cy="85" r="14" fill="url(#woolGrad)" />
          <circle cx="92" cy="85" r="14" fill="url(#woolGrad)" />
          <circle cx="42" cy="95" r="16" fill="url(#woolGrad)" />
          <circle cx="78" cy="95" r="16" fill="url(#woolGrad)" />
          <circle cx="60" cy="98" r="16" fill="url(#woolGrad)" />
          {/* Central fluffy body */}
          <ellipse cx="60" cy="82" rx="36" ry="24" fill="url(#woolGrad)" />
        </g>

        {/* Cute Little Wool Tail */}
        <circle cx="16" cy="74" r="8" fill="url(#woolGrad)" stroke="#D5CCC0" strokeWidth="2" />

        {/* 3. FLOPPY EARS */}
        <g>
          {/* Left Ear */}
          <g
            transform={`rotate(${isJumping ? -18 : -10} 28 50)`}
            className="transition-transform duration-200"
          >
            <ellipse cx="22" cy="52" rx="14" ry="7" fill="#F0DFD3" stroke="#C5B1A2" strokeWidth="2" />
            <ellipse cx="22" cy="52" rx="9" ry="4" fill="#F8B4B4" opacity="0.65" />
          </g>
          {/* Right Ear */}
          <g
            transform={`rotate(${isJumping ? 18 : 10} 92 50)`}
            className="transition-transform duration-200"
          >
            <ellipse cx="98" cy="52" rx="14" ry="7" fill="#F0DFD3" stroke="#C5B1A2" strokeWidth="2" />
            <ellipse cx="98" cy="52" rx="9" ry="4" fill="#F8B4B4" opacity="0.65" />
          </g>
        </g>

        {/* 4. HEAD WOOL PUFF (Back Layer) */}
        <g stroke="#D5CCC0" strokeWidth="2">
          <circle cx="44" cy="30" r="12" fill="url(#woolGrad)" />
          <circle cx="60" cy="24" r="13" fill="url(#woolGrad)" />
          <circle cx="76" cy="30" r="12" fill="url(#woolGrad)" />
        </g>

        {/* 5. LAMB FACE */}
        <g>
          <ellipse
            cx="60"
            cy="56"
            rx="26"
            ry="22"
            fill="url(#lambSkin)"
            stroke="#BFA999"
            strokeWidth="2.2"
          />

          {/* Forehead Wool Tuft (Curled Forelock) */}
          <g stroke="#D5CCC0" strokeWidth="2">
            <circle cx="50" cy="36" r="9" fill="url(#woolGrad)" />
            <circle cx="60" cy="33" r="10" fill="url(#woolGrad)" />
            <circle cx="70" cy="36" r="9" fill="url(#woolGrad)" />
          </g>

          {/* Cute Rosy Cheeks */}
          <ellipse cx="40" cy="62" rx="5" ry="3" fill="#F87171" opacity="0.45" />
          <ellipse cx="80" cy="62" rx="5" ry="3" fill="#F87171" opacity="0.45" />

          {/* Cute Pink/Brown Snout & Nose */}
          <ellipse cx="60" cy="64" rx="8" ry="5.5" fill="#E8D1C2" />
          {/* Nose */}
          <path
            d="M 57 62 C 58 60, 62 60, 63 62 C 63 64, 60 65.5, 60 65.5 C 60 65.5, 57 64, 57 62 Z"
            fill="#B91C1C"
            opacity="0.75"
          />

          {/* EYES */}
          {isSleeping ? (
            // Sleeping Calm Curved Eyelids
            <g>
              <path
                d="M 43 51 Q 49 56 55 51"
                stroke="#3F2A1E"
                strokeWidth="2.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 65 51 Q 71 56 77 51"
                stroke="#3F2A1E"
                strokeWidth="2.8"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          ) : isBlinking ? (
            // Blinking Slit
            <g>
              <line x1="43" y1="51" x2="55" y2="51" stroke="#3F2A1E" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="65" y1="51" x2="77" y2="51" stroke="#3F2A1E" strokeWidth="2.8" strokeLinecap="round" />
            </g>
          ) : (
            // Big Expressive Lamb Eyes
            <g>
              {/* Left Eye */}
              <circle cx="49" cy="50" r="7.5" fill="#FFFFFF" stroke="#3F2A1E" strokeWidth="2.2" />
              <circle
                cx={Math.max(44, Math.min(54, 49 + eyeOffsetX * 0.7))}
                cy={Math.max(46, Math.min(54, 50 + eyeOffsetY * 0.7))}
                r="4.2"
                fill="#271912"
              />
              {/* Eye sparkle */}
              <circle
                cx={Math.max(44, Math.min(54, 49 + eyeOffsetX * 0.7)) + 1.2}
                cy={Math.max(46, Math.min(54, 50 + eyeOffsetY * 0.7)) - 1.2}
                r="1.4"
                fill="#FFFFFF"
              />

              {/* Right Eye */}
              <circle cx="71" cy="50" r="7.5" fill="#FFFFFF" stroke="#3F2A1E" strokeWidth="2.2" />
              <circle
                cx={Math.max(66, Math.min(76, 71 + eyeOffsetX * 0.7))}
                cy={Math.max(46, Math.min(54, 50 + eyeOffsetY * 0.7))}
                r="4.2"
                fill="#271912"
              />
              {/* Eye sparkle */}
              <circle
                cx={Math.max(66, Math.min(76, 71 + eyeOffsetX * 0.7)) + 1.2}
                cy={Math.max(46, Math.min(54, 50 + eyeOffsetY * 0.7)) - 1.2}
                r="1.4"
                fill="#FFFFFF"
              />
            </g>
          )}

          {/* MOUTH */}
          {isMouthOpen || isChewing ? (
            // Open Mouth for Food (Cute Chomp)
            <g>
              <ellipse cx="60" cy="70" rx="6.5" ry="5.5" fill="#7F1D1D" stroke="#3F2A1E" strokeWidth="1.8" />
              <ellipse cx="60" cy="72" rx="4" ry="2.2" fill="#F87171" />
            </g>
          ) : mood === 'hungry' || mood === 'dirty' ? (
            // Sad / Pouting Mouth
            <path
              d="M 55 72 Q 60 68 65 72"
              stroke="#3F2A1E"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            // Happy Lamb Smile
            <path
              d="M 54 68 Q 60 74 66 68"
              stroke="#3F2A1E"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* DIRT SMUDGES ON WOOL (When cleanliness is low) */}
        {dirtLevel > 0 && (
          <g fill="#855B32" opacity="0.6">
            <ellipse cx="38" cy="80" rx="3.5" ry="2.5" />
            <ellipse cx="80" cy="88" rx="4" ry="2" />
            {dirtLevel > 1 && (
              <>
                <ellipse cx="72" cy="76" rx="4" ry="2.8" />
                <ellipse cx="32" cy="70" rx="3" ry="2" />
              </>
            )}
            {dirtLevel > 2 && (
              <>
                <ellipse cx="60" cy="88" rx="5" ry="3" />
                <ellipse cx="48" cy="58" rx="2.5" ry="1.8" />
              </>
            )}
          </g>
        )}

        {/* 6. EQUIPPED WARDROBE ACCESSORIES */}
        {/* Halo */}
        {equippedHat === 'halo' && (
          <ellipse
            cx="60"
            cy="14"
            rx="24"
            ry="6"
            fill="none"
            stroke="url(#lambHalo)"
            strokeWidth="3.5"
            className="filter drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]"
          />
        )}
        {/* Cap */}
        {equippedHat === 'cap' && (
          <g>
            <path d="M 40 28 C 42 16, 78 16, 80 28 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
            <path d="M 32 28 Q 60 23 90 25 Q 60 32 32 28 Z" fill="#1D4ED8" stroke="#1E40AF" strokeWidth="1.8" />
          </g>
        )}
        {/* Crown */}
        {equippedHat === 'crown' && (
          <g>
            <path
              d="M 44 26 L 42 12 L 51 18 L 60 9 L 69 18 L 78 12 L 76 26 Z"
              fill="#F59E0B"
              stroke="#B45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="60" cy="16" r="2" fill="#DC2626" />
            <circle cx="50" cy="18" r="1.5" fill="#2563EB" />
            <circle cx="70" cy="18" r="1.5" fill="#2563EB" />
          </g>
        )}

        {/* Glasses */}
        {equippedGlasses === 'shades' && (
          <g>
            <rect x="38" y="44" width="18" height="13" rx="3" fill="#18181B" stroke="#000" strokeWidth="1.8" />
            <rect x="64" y="44" width="18" height="13" rx="3" fill="#18181B" stroke="#000" strokeWidth="1.8" />
            <line x1="56" y1="49" x2="64" y2="49" stroke="#000" strokeWidth="2.5" />
            <line x1="41" y1="46" x2="48" y2="54" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
            <line x1="67" y1="46" x2="74" y2="54" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
          </g>
        )}
        {equippedGlasses === 'glasses' && (
          <g>
            <circle cx="49" cy="50" r="9.5" fill="none" stroke="#27272A" strokeWidth="2.2" />
            <circle cx="71" cy="50" r="9.5" fill="none" stroke="#27272A" strokeWidth="2.2" />
            <line x1="58.5" y1="50" x2="61.5" y2="50" stroke="#27272A" strokeWidth="2.2" />
          </g>
        )}

        {/* Bowtie / Bell Collar */}
        {equippedAccessory === 'bowtie' && (
          <g transform="translate(10, 2)">
            <polygon points="43,76 43,84 48,80" fill="#DC2626" stroke="#991B1B" strokeWidth="1.2" />
            <polygon points="57,76 57,84 52,80" fill="#DC2626" stroke="#991B1B" strokeWidth="1.2" />
            <circle cx="50" cy="80" r="3" fill="#EF4444" stroke="#991B1B" strokeWidth="1.2" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ==========================================
// VECTOR FOOD ASSETS
// ==========================================

export function FoodVector({ type, size = 36 }: { type: string; size?: number }) {
  switch (type) {
    case 'apple':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <path d="M 20 10 C 23 6, 28 8, 27 12 C 24 13, 21 11, 20 10 Z" fill="#22C55E" />
          <path d="M 20 10 Q 18 6 15 4" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M 20 13 C 25 11, 35 15, 34 26 C 33 34, 25 36, 20 33 C 15 36, 7 34, 6 26 C 5 15, 15 11, 20 13 Z"
            fill="#EF4444"
            stroke="#B91C1C"
            strokeWidth="1.8"
          />
          <path d="M 12 18 Q 10 24 13 28" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
      );

    case 'bread':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <path
            d="M 8 26 C 6 22, 10 14, 20 14 C 30 14, 34 22, 32 26 C 31 29, 28 30, 20 30 C 12 30, 9 29, 8 26 Z"
            fill="#D97706"
            stroke="#92400E"
            strokeWidth="1.8"
          />
          <line x1="14" y1="18" x2="16" y2="24" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="17" x2="20" y2="25" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
          <line x1="26" y1="18" x2="24" y2="24" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'cookie':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="14" fill="#D97706" stroke="#92400E" strokeWidth="1.8" />
          <circle cx="16" cy="15" r="2.2" fill="#451A03" />
          <circle cx="24" cy="16" r="2" fill="#451A03" />
          <circle cx="20" cy="22" r="2.5" fill="#451A03" />
          <circle cx="15" cy="24" r="1.8" fill="#451A03" />
          <circle cx="25" cy="25" r="2" fill="#451A03" />
        </svg>
      );

    case 'pizza':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <path d="M 6 12 Q 20 8 34 12 L 20 35 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.8" />
          <path d="M 9 14 Q 20 11 31 14 L 20 32 Z" fill="#FCD34D" />
          <circle cx="18" cy="18" r="3" fill="#DC2626" />
          <circle cx="24" cy="22" r="2.5" fill="#DC2626" />
          <circle cx="19" cy="27" r="2" fill="#DC2626" />
        </svg>
      );

    case 'carrot':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <path d="M 28 12 Q 33 7 35 6" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 26 10 Q 30 5 31 3" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M 26 11 C 29 14, 27 17, 24 19 L 8 34 C 7 35, 6 34, 6 33 L 19 14 C 21 11, 24 10, 26 11 Z"
            fill="#EA580C"
            stroke="#9A3412"
            strokeWidth="1.8"
          />
          <line x1="20" y1="17" x2="18" y2="19" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="23" x2="14" y2="25" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    default: // Berry
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <path d="M 17 11 Q 20 7 23 11" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M 20 12 C 26 11, 31 16, 28 26 L 20 34 L 12 26 C 9 16, 14 11, 20 12 Z"
            fill="#E11D48"
            stroke="#9F1239"
            strokeWidth="1.8"
          />
          <circle cx="18" cy="18" r="0.9" fill="#FDE047" />
          <circle cx="23" cy="20" r="0.9" fill="#FDE047" />
          <circle cx="16" cy="24" r="0.9" fill="#FDE047" />
          <circle cx="22" cy="26" r="0.9" fill="#FDE047" />
        </svg>
      );
  }
}

// ==========================================
// VECTOR BATH TOOLS (REAL POU SOAP & SHOWER)
// ==========================================

export function SoapToolVector({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" className="filter drop-shadow-sm">
      {/* Soap bar body */}
      <rect x="8" y="14" width="34" height="22" rx="9" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2.5" />
      {/* Embossed smooth curve */}
      <path d="M 15 25 Q 25 30 35 25" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round" />
      {/* Suds bubbles on soap */}
      <circle cx="36" cy="12" r="4.5" fill="#DBEAFE" stroke="#60A5FA" strokeWidth="1.5" opacity="0.85" />
      <circle cx="41" cy="19" r="3.2" fill="#DBEAFE" stroke="#60A5FA" strokeWidth="1.5" opacity="0.85" />
      <circle cx="10" cy="16" r="3" fill="#DBEAFE" stroke="#60A5FA" strokeWidth="1.5" opacity="0.85" />
    </svg>
  );
}

export function ShowerheadToolVector({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" className="filter drop-shadow-sm">
      {/* Flexible hose / pipe */}
      <path d="M 6 8 L 26 8 Q 32 8 32 16 L 32 20" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
      {/* Chrome showerhead dome */}
      <path d="M 20 20 L 44 20 L 39 28 L 25 28 Z" fill="#94A3B8" stroke="#475569" strokeWidth="2.2" />
      {/* Holes nozzle plate */}
      <ellipse cx="32" cy="28" rx="7" ry="2" fill="#334155" />
      {/* Animated spray jets */}
      <line x1="26" y1="31" x2="24" y2="44" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />
      <line x1="30" y1="31" x2="30" y2="46" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />
      <line x1="34" y1="31" x2="34" y2="46" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />
      <line x1="38" y1="31" x2="40" y2="44" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />
    </svg>
  );
}

// ==========================================
// VECTOR BEDROOM LAMP (CLICKABLE LIGHT SWITCH)
// ==========================================

export function LampVector({ isOn = true, size = 48 }: { isOn?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 60" fill="none" className="filter drop-shadow-sm">
      {/* Lamp Base */}
      <ellipse cx="25" cy="54" rx="14" ry="4" fill="#6B7280" stroke="#374151" strokeWidth="1.8" />
      {/* Stem Pole */}
      <rect x="23.5" y="28" width="3" height="26" fill="#9CA3AF" />
      {/* Lamp Shade */}
      <polygon
        points="14,28 36,28 32,10 18,10"
        fill={isOn ? '#FEF08A' : '#D1D5DB'}
        stroke={isOn ? '#EAB308' : '#9CA3AF'}
        strokeWidth="2"
      />
      {/* Light Glow Aura when On */}
      {isOn && (
        <circle cx="25" cy="20" r="16" fill="#FEF08A" opacity="0.35" className="animate-pulse" />
      )}
      {/* Pull switch chain */}
      <line x1="32" y1="28" x2="32" y2="38" stroke="#4B5563" strokeWidth="1.5" strokeDasharray="1 2" />
      <circle cx="32" cy="39" r="1.8" fill="#F59E0B" />
    </svg>
  );
}

// ==========================================
// VECTOR FURNITURE ASSETS
// ==========================================

export function FurnitureVector({ type, size = 48 }: { type: string; size?: number }) {
  switch (type) {
    case 'plant_monstera':
    case 'plant_tree':
      return (
        <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
          <polygon points="17,34 33,34 30,46 20,46" fill="#D97706" stroke="#92400E" strokeWidth="1.8" />
          <ellipse cx="25" cy="34" rx="8" ry="2" fill="#78350F" />
          <path d="M 25 33 Q 22 22 14 18" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 25 33 Q 27 20 34 16" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 25 33 Q 25 18 25 10" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="12" cy="16" rx="6" ry="4" fill="#22C55E" />
          <ellipse cx="36" cy="14" rx="6" ry="4" fill="#22C55E" />
          <ellipse cx="25" cy="8" rx="5" ry="6" fill="#16A34A" />
        </svg>
      );

    case 'frame_cross':
      return (
        <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
          <rect x="12" y="8" width="26" height="34" rx="3" fill="#FEF3C7" stroke="#78350F" strokeWidth="2.5" />
          <rect x="15" y="11" width="20" height="28" fill="#FFFBEB" stroke="#D97706" strokeWidth="1" />
          <rect x="23" y="16" width="4" height="18" rx="1" fill="#D97706" />
          <rect x="18" y="20" width="14" height="4" rx="1" fill="#D97706" />
        </svg>
      );

    case 'candle_faith':
      return (
        <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
          <ellipse cx="25" cy="42" rx="14" ry="4" fill="#D1D5DB" stroke="#6B7280" strokeWidth="1.8" />
          <rect x="20" y="22" width="10" height="20" rx="2" fill="#FDFBF7" stroke="#E5E7EB" strokeWidth="1.8" />
          <line x1="25" y1="22" x2="25" y2="18" stroke="#374151" strokeWidth="1.5" />
          <path d="M 25 10 C 22 14, 21 16, 25 18 C 29 16, 28 14, 25 10 Z" fill="#F59E0B" />
          <circle cx="25" cy="15" r="2" fill="#FEF08A" />
        </svg>
      );

    default: // Bed
      return (
        <svg width={size} height={size} viewBox="0 0 54 50" fill="none">
          {/* Wooden Headboard */}
          <rect x="4" y="16" width="8" height="26" rx="2.5" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          {/* Comfy Soft Mattress */}
          <rect x="10" y="26" width="36" height="13" rx="3.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          {/* Soft White Pillow */}
          <rect x="12" y="23" width="10" height="8" rx="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Blue Cozy Quilt */}
          <path d="M 22 27 L 46 27 L 46 39 L 22 39 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.8" />
          {/* Bed legs */}
          <rect x="10" y="39" width="3" height="4" fill="#451A03" />
          <rect x="43" y="39" width="3" height="4" fill="#451A03" />
        </svg>
      );
  }
}

// ==========================================
// AUTHENTIC POU ROOM ITEMS (FROM POU GAME)
// ==========================================

export function PouPillowBed({ size = 260 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.44} viewBox="0 0 200 88" fill="none" className="filter drop-shadow-md overflow-visible">
      {/* Authentic Pou Big White Bedroom Pillow Bed */}
      <path
        d="M 12 50 C 30 74, 170 74, 188 50 C 198 40, 194 30, 168 25 C 138 20, 62 20, 32 25 C 6 30, 2 40, 12 50 Z"
        fill="#FFFFFF"
        stroke="#111113"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Lower Fold Rim */}
      <path
        d="M 15 52 C 38 78, 162 78, 185 52"
        stroke="#111113"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Soft Cushion Tuft / Crease Line */}
      <path d="M 45 42 Q 100 49 155 42" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PouClosetVector({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 50 62" fill="none" className="filter drop-shadow-xs">
      {/* Wooden Wardrobe Frame */}
      <rect x="6" y="8" width="38" height="50" rx="3" fill="#E2A866" stroke="#111113" strokeWidth="2.6" />
      {/* Interior Shelves */}
      <line x1="8" y1="24" x2="42" y2="24" stroke="#111113" strokeWidth="1.8" />
      <line x1="8" y1="40" x2="42" y2="40" stroke="#111113" strokeWidth="1.8" />
      {/* Folded Shirts / Towels */}
      <rect x="14" y="14" width="22" height="6.5" rx="2" fill="#3B82F6" stroke="#111113" strokeWidth="1.5" />
      <rect x="14" y="30" width="22" height="6.5" rx="2" fill="#EF4444" stroke="#111113" strokeWidth="1.5" />
      <rect x="14" y="46" width="22" height="6.5" rx="2" fill="#10B981" stroke="#111113" strokeWidth="1.5" />
      {/* Left Open Door */}
      <path d="M 6 8 L -1 13 L -1 58 L 6 54 Z" fill="#D4934E" stroke="#111113" strokeWidth="2.4" />
    </svg>
  );
}

export function PouBedsideLamp({ isOn = true, size = 62 }: { isOn?: boolean; size?: number }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 60 62" fill="none" className="filter drop-shadow-xs">
      {/* Blue Ceramic Vase Base */}
      <ellipse cx="30" cy="50" rx="14" ry="9" fill="#2563EB" stroke="#111113" strokeWidth="2.8" />
      <ellipse cx="30" cy="46" rx="6" ry="2.8" fill="#60A5FA" />
      <rect x="28" y="35" width="4" height="11" fill="#111113" />
      {/* Yellow Trapezoid Lamp Shade */}
      <polygon
        points="13,35 47,35 41,12 19,12"
        fill={isOn ? '#FACC15' : '#D1D5DB'}
        stroke="#111113"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Light Shine Bulb / Glow */}
      {isOn && (
        <circle cx="30" cy="24" r="14" fill="#FEF08A" opacity="0.45" className="animate-pulse" />
      )}
    </svg>
  );
}

export function PouShopVector({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 50 62" fill="none" className="filter drop-shadow-xs">
      {/* White Store Box */}
      <rect x="8" y="16" width="34" height="42" rx="2" fill="#FFFFFF" stroke="#111113" strokeWidth="2.6" />
      {/* Store Window */}
      <rect x="14" y="26" width="22" height="24" rx="1.5" fill="#BAE6FD" stroke="#111113" strokeWidth="2" />
      <path d="M 16 30 L 25 43" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      {/* Striped Awning */}
      <polygon points="5,16 45,16 42,5 8,5" fill="#EF4444" stroke="#111113" strokeWidth="2.6" strokeLinejoin="round" />
      <polygon points="12,16 20,16 18,5 13,5" fill="#FFFFFF" />
      <polygon points="30,16 38,16 34,5 29,5" fill="#FFFFFF" />
    </svg>
  );
}

export function PouFridgeVector({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 50 62" fill="none" className="filter drop-shadow-xs">
      <rect x="8" y="5" width="34" height="54" rx="4" fill="#FFFFFF" stroke="#111113" strokeWidth="2.6" />
      <line x1="8" y1="23" x2="42" y2="23" stroke="#111113" strokeWidth="2.2" />
      <rect x="36" y="11" width="3" height="7" rx="1.5" fill="#64748B" stroke="#111113" strokeWidth="1" />
      <rect x="36" y="28" width="3" height="13" rx="1.5" fill="#64748B" stroke="#111113" strokeWidth="1" />
    </svg>
  );
}


