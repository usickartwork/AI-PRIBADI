"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { Snapshot, EngineEvent } from "@/lib/game/survival/engine";
import { ItemIcon } from "./GameIcons";
import { ITEMS, type ItemId } from "@/lib/game/survival/data";

interface GameHUDProps {
  snapshot: Snapshot;
  toasts: { id: number; text: string; tone: "info" | "good" | "warn" | "bad"; item?: ItemId }[];
  isTouch: boolean;
  onPause: () => void;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
  onOpenBuild: () => void;
  onSelectHotbar: (slot: number) => void;
  onInteract: () => void;
  onAttack: () => void;
  onJump: () => void;
  onRotateBuild: () => void;
  onCancelBuild: () => void;
  onMoveChange: (x: number, y: number) => void;
  onLookChange: (dx: number, dy: number) => void;
  onSprintToggle: (sprint: boolean) => void;
  showFps?: boolean;
}

export function GameHUD({
  snapshot,
  toasts,
  isTouch,
  onPause,
  onOpenInventory,
  onOpenCrafting,
  onOpenBuild,
  onSelectHotbar,
  onInteract,
  onAttack,
  onJump,
  onRotateBuild,
  onCancelBuild,
  onMoveChange,
  onLookChange,
  onSprintToggle,
  showFps = false,
}: GameHUDProps) {
  const {
    health,
    hunger,
    stamina,
    inventory,
    hotbarIndex,
    prompt,
    build,
    day,
    clock,
    isNight,
    saveStatus,
    fps,
    pointerLocked,
  } = snapshot;

  // Mobile Joystick state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile Camera Drag state
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile Sprint button toggle
  const [isSprinting, setIsSprinting] = useState(false);

  const toggleSprint = () => {
    const next = !isSprinting;
    setIsSprinting(next);
    onSprintToggle(next);
  };

  // ── Touch Joystick Handlers ──
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    joystickCenterRef.current = { x: cx, y: cy };

    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const maxR = rect.width / 2;

    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const jx = Math.cos(angle) * clampedDist;
    const jy = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: jx, y: jy });
    setIsJoystickActive(true);
    onMoveChange(jx / maxR, -jy / maxR);
  };

  const handleJoystickTouchMove = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const cx = joystickCenterRef.current.x;
        const cy = joystickCenterRef.current.y;
        const dx = touch.clientX - cx;
        const dy = touch.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const maxR = 48; // max radius in px

        const clampedDist = Math.min(dist, maxR);
        const angle = Math.atan2(dy, dx);
        const jx = Math.cos(angle) * clampedDist;
        const jy = Math.sin(angle) * clampedDist;

        setJoystickPos({ x: jx, y: jy });
        onMoveChange(jx / maxR, -jy / maxR);
        break;
      }
    }
  }, [onMoveChange]);

  const handleJoystickTouchEnd = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickPos({ x: 0, y: 0 });
        setIsJoystickActive(false);
        onMoveChange(0, 0);
        break;
      }
    }
  }, [onMoveChange]);

  // ── Touch Look Handlers ──
  const handleLookTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        onLookChange(dx, dy);
        break;
      }
    }
  }, [onLookChange]);

  const handleLookTouchEnd = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("touchmove", handleJoystickTouchMove, { passive: true });
    window.addEventListener("touchend", handleJoystickTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleJoystickTouchEnd, { passive: true });

    window.addEventListener("touchmove", handleLookTouchMove, { passive: true });
    window.addEventListener("touchend", handleLookTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleLookTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchmove", handleJoystickTouchMove);
      window.removeEventListener("touchend", handleJoystickTouchEnd);
      window.removeEventListener("touchcancel", handleJoystickTouchEnd);

      window.removeEventListener("touchmove", handleLookTouchMove);
      window.removeEventListener("touchend", handleLookTouchEnd);
      window.removeEventListener("touchcancel", handleLookTouchEnd);
    };
  }, [handleJoystickTouchMove, handleJoystickTouchEnd, handleLookTouchMove, handleLookTouchEnd]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between overflow-hidden">
      {/* ── TOP BAR ── */}
      <div className="p-3 sm:p-4 flex items-start justify-between">
        {/* Status Bars (Health, Hunger, Stamina) */}
        <div className="flex flex-col gap-1.5 w-44 sm:w-52 pointer-events-auto">
          {/* Health */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-400 w-5">❤️</span>
            <div className="flex-1 h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-white w-6 text-right">
              {Math.round(health)}
            </span>
          </div>

          {/* Hunger */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 w-5">🍗</span>
            <div className="flex-1 h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, hunger))}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-white w-6 text-right">
              {Math.round(hunger)}
            </span>
          </div>

          {/* Stamina */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 w-5">⚡</span>
            <div className="flex-1 h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, stamina))}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-white w-6 text-right">
              {Math.round(stamina)}
            </span>
          </div>
        </div>

        {/* Right Corner (Time, Day, Save, Pause) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {showFps && (
            <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-zinc-300">
              {fps} FPS
            </div>
          )}

          {/* Day & Clock Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white shadow-sm">
            <span>{isNight ? "🌙" : "☀️"}</span>
            <span className="font-mono">{clock}</span>
            <span className="text-zinc-400">•</span>
            <span>Hari {day}</span>
          </div>

          {/* Save status badge */}
          {saveStatus === "saving" && (
            <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-400 animate-pulse">
              Menyimpan...
            </div>
          )}

          {/* Pause Button */}
          <button
            type="button"
            onClick={onPause}
            className="p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition cursor-pointer shadow-sm active:scale-95"
            title="Jeda Game (Esc)"
            aria-label="Pause"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── TOAST NOTIFICATIONS (TOP CENTER) ── */}
      <div className="absolute top-16 inset-x-0 flex flex-col items-center pointer-events-none gap-1.5 px-4 z-20">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-150 ${
              t.tone === "good"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
                : t.tone === "warn"
                ? "bg-amber-950/80 border-amber-500/40 text-amber-200"
                : t.tone === "bad"
                ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
                : "bg-zinc-900/80 border-zinc-700/60 text-zinc-100"
            }`}
          >
            {t.item && <ItemIcon id={t.item} className="w-4 h-4" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* ── CENTER PROMPT / BUILDING HUD ── */}
      <div className="flex flex-col items-center justify-center pointer-events-none mb-4">
        {/* Pointer lock hint (desktop) */}
        {!isTouch && !pointerLocked && (
          <div className="mb-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] text-zinc-300 shadow">
            Klik layar game untuk mengaktifkan kendali kamera mouse
          </div>
        )}

        {/* Building Ghost Candidate */}
        {build && (
          <div className="flex flex-col items-center gap-2 pointer-events-auto bg-black/75 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl shadow-xl text-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white capitalize">{ITEMS[build.type].name}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  build.valid ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {build.valid ? "Lokasi Valid" : "Tidak Valid"}
              </span>
            </div>

            {!build.valid && build.reason && (
              <span className="text-xs text-rose-300 font-medium">{build.reason}</span>
            )}

            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={onRotateBuild}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition cursor-pointer flex items-center gap-1"
              >
                <span>Putar (R)</span>
              </button>

              <button
                type="button"
                onClick={onCancelBuild}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
              >
                Batal (Q)
              </button>

              <button
                type="button"
                onClick={onInteract}
                disabled={!build.valid}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  build.valid
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                }`}
              >
                Pasang (Klik)
              </button>
            </div>
          </div>
        )}

        {/* Interaction Prompt (Nodes, Drops, Doors, Campfire) */}
        {!build && prompt && (
          <div
            onClick={isTouch ? onInteract : undefined}
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 shadow-xl pointer-events-auto transition ${
              isTouch ? "cursor-pointer hover:bg-black/90 active:scale-95" : ""
            }`}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-mono">
              E
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{prompt.title}</span>
              <span className="text-[11px] text-zinc-300">{prompt.action}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROLS & HOTBAR ── */}
      <div className="p-3 sm:p-4 flex items-end justify-between relative">
        {/* Mobile Left: Virtual Joystick */}
        {isTouch ? (
          <div className="pointer-events-auto relative z-30 mb-2 ml-1">
            <div
              ref={joystickBaseRef}
              onTouchStart={handleJoystickTouchStart}
              className="w-28 h-28 rounded-full bg-black/40 backdrop-blur-md border-2 border-white/20 flex items-center justify-center relative touch-none select-none"
            >
              <div
                className={`w-12 h-12 rounded-full border-2 transition-transform shadow-lg ${
                  isJoystickActive
                    ? "bg-emerald-500/80 border-white scale-110"
                    : "bg-white/40 border-white/60"
                }`}
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="w-24 hidden sm:block" />
        )}

        {/* Center: Hotbar Slots (1-5) */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto mx-auto z-20">
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 shadow-2xl">
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const slot = inventory[slotIdx];
              const isSelected = slotIdx === hotbarIndex;

              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => onSelectHotbar(slotIdx)}
                  className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl border flex flex-col items-center justify-center p-1 transition cursor-pointer select-none group ${
                    isSelected
                      ? "border-emerald-400 ring-2 ring-emerald-400/40 bg-emerald-500/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30"
                  }`}
                >
                  <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-zinc-400">
                    {slotIdx + 1}
                  </span>

                  {slot ? (
                    <>
                      <ItemIcon id={slot.id} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      <span className="absolute bottom-1 right-1.5 text-[10px] font-bold font-mono px-1 rounded bg-black/70 text-white">
                        {slot.qty}
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-600 text-xs">•</span>
                  )}
                </button>
              );
            })}

            {/* Quick Action Buttons on Desktop */}
            {!isTouch && (
              <div className="flex items-center gap-1 pl-1 border-l border-white/10">
                <button
                  type="button"
                  onClick={onOpenInventory}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Buka Tas (I / Tab)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onOpenCrafting}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                  title="Crafting Menu (C)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onOpenBuild}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  title="Menu Bangun (B)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Right: Action Buttons & Camera Swipe Zone */}
        {isTouch ? (
          <div className="pointer-events-auto flex flex-col items-end gap-2.5 z-30 mb-1 mr-1">
            {/* Quick Menu Toggles on Mobile */}
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={onOpenInventory}
                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-xs font-bold active:scale-95 shadow-md"
                aria-label="Tas"
              >
                🎒
              </button>
              <button
                type="button"
                onClick={onOpenCrafting}
                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-xs font-bold active:scale-95 shadow-md"
                aria-label="Crafting"
              >
                🛠️
              </button>
              <button
                type="button"
                onClick={onOpenBuild}
                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-xs font-bold active:scale-95 shadow-md"
                aria-label="Build"
              >
                🏠
              </button>
            </div>

            {/* Action buttons cluster */}
            <div className="flex items-center gap-2.5">
              {/* Sprint Toggle */}
              <button
                type="button"
                onClick={toggleSprint}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold transition active:scale-95 shadow-lg ${
                  isSprinting
                    ? "bg-amber-500 border-white text-black"
                    : "bg-black/60 border-white/20 text-white"
                }`}
                aria-label="Lari"
              >
                🏃
              </button>

              {/* Jump */}
              <button
                type="button"
                onClick={onJump}
                className="w-12 h-12 rounded-full bg-black/60 active:bg-zinc-700 border-2 border-white/20 text-white flex items-center justify-center text-sm font-bold active:scale-95 shadow-lg"
                aria-label="Lompat"
              >
                ⬆️
              </button>

              {/* Attack / Chop (Main Action Button) */}
              <button
                type="button"
                onClick={onAttack}
                className="w-16 h-16 rounded-full bg-rose-600 active:bg-rose-500 border-2 border-white text-white flex items-center justify-center text-xl font-bold active:scale-95 shadow-xl shadow-rose-600/40"
                aria-label="Serang"
              >
                ⚔️
              </button>
            </div>
          </div>
        ) : (
          <div className="w-24 hidden sm:block" />
        )}
      </div>

      {/* Mobile Touch Camera Area (Invisible swipe zone on the right half of the screen) */}
      {isTouch && (
        <div
          onTouchStart={handleLookTouchStart}
          className="absolute top-16 right-0 bottom-24 w-1/2 pointer-events-auto touch-none select-none z-10"
        />
      )}
    </div>
  );
}

