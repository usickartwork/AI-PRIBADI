"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  SurvivalEngine,
  type Snapshot,
  type EngineEvent,
} from "@/lib/game/survival/engine";
import {
  loadGame,
  saveGame,
  deleteSave,
  readMeta,
  loadSettings,
  storeSettings,
  type SaveData,
  type SaveMeta,
  type GameSettings,
} from "@/lib/game/survival/storage";
import { GameHUD } from "@/components/game/GameHUD";
import { MainMenuOverlay } from "@/components/game/MainMenuOverlay";
import { PauseModal } from "@/components/game/PauseModal";
import { InventoryModal } from "@/components/game/InventoryModal";
import { CraftingModal } from "@/components/game/CraftingModal";
import { BuildMenuModal } from "@/components/game/BuildMenuModal";
import { SettingsModal } from "@/components/game/SettingsModal";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import type { BuildType, ItemId } from "@/lib/game/survival/data";

interface GameWorkspaceProps {
  isDark?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
  onTogglePanel?: () => void;
  subTabsElement?: React.ReactNode;
}

type ModalView = "none" | "pause" | "inventory" | "crafting" | "build" | "settings" | "howToPlay";

export function GameWorkspace({
  isDark = true,
  isVisible = true,
  onClose,
  onTogglePanel,
  subTabsElement,
}: GameWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SurvivalEngine | null>(null);
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  // Game UI States
  const [inGame, setInGame] = useState(false);
  const [modalView, setModalView] = useState<ModalView>("none");
  const [gameOver, setGameOver] = useState(false);
  const [saveMeta, setSaveMeta] = useState<SaveMeta | null>(null);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<
    { id: number; text: string; tone: "info" | "good" | "warn" | "bad"; item?: ItemId }[]
  >([]);
  const nextToastId = useRef(1);

  const addToast = useCallback(
    (text: string, tone: "info" | "good" | "warn" | "bad", item?: ItemId) => {
      const id = nextToastId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, text, tone, item }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  // Current engine snapshot
  const [snapshot, setSnapshot] = useState<Snapshot>({
    health: 100,
    hunger: 100,
    stamina: 100,
    inventory: new Array(20).fill(null),
    invVersion: 0,
    hotbarIndex: 0,
    equipped: null,
    prompt: null,
    build: null,
    dayTime: 0.3,
    day: 1,
    clock: "07:12",
    isNight: false,
    survived: 0,
    deaths: 0,
    saveStatus: "idle",
    dead: false,
    fps: 60,
    pointerLocked: false,
    nearWorkbench: false,
    nearCampfire: false,
    hurtAt: 0,
    started: false,
  });

  // Check touch & orientation
  useEffect(() => {
    const checkTouch = () => {
      const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(touch);
      setIsPortrait(window.innerHeight > window.innerWidth && touch);
    };

    checkTouch();
    window.addEventListener("resize", checkTouch);
    window.addEventListener("orientationchange", checkTouch);
    return () => {
      window.removeEventListener("resize", checkTouch);
      window.removeEventListener("orientationchange", checkTouch);
    };
  }, []);

  // Check full screen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Auto-pause and suspend rendering loop when tab is hidden or user switches away
  useEffect(() => {
    engineRef.current?.setHidden(!isVisible);
    if (!isVisible && inGame) {
      engineRef.current?.setPaused(true);
      setModalView("pause");
    }
  }, [isVisible, inGame]);

  // Initialize engine on container mount
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let engine: SurvivalEngine | null = null;

    const init = async () => {
      const loadRes = await loadGame();
      const meta = readMeta();
      if (!isMounted) return;

      setSaveMeta(meta);

      const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const initialSettings = loadSettings();

      engine = new SurvivalEngine({
        container: containerRef.current!,
        save: loadRes.status === "ok" ? loadRes.data : null,
        settings: initialSettings,
        isTouch: touch,
        onSnapshot: (s) => {
          if (isMounted) {
            setSnapshot(s);
            if (s.dead && !gameOver) {
              setGameOver(true);
            }
          }
        },
        onEvent: (e: EngineEvent) => {
          if (!isMounted) return;
          if (e.type === "toast") {
            addToast(e.text, e.tone, e.item);
          } else if (e.type === "dead") {
            setGameOver(true);
          } else if (e.type === "pause-request") {
            setModalView("pause");
          } else if (e.type === "open-craft") {
            setModalView("crafting");
          }
        },
      });

      engine.setSaver(async (d) => {
        await saveGame(d);
        if (isMounted) setSaveMeta(readMeta());
      });

      engineRef.current = engine;
      engine.setHidden(!isVisibleRef.current);
    };

    init();

    return () => {
      isMounted = false;
      if (engine) engine.dispose();
      engineRef.current = null;
    };
  }, [addToast, gameOver]);

  // Sync modal view with engine pause
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const isBlocking = modalView !== "none" || gameOver || !inGame;
    engine.setUiBlocking(isBlocking);
    engine.setPaused(modalView === "pause");
  }, [modalView, gameOver, inGame]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || !inGame || gameOver) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      if (e.code === "Escape") {
        e.preventDefault();
        if (modalView !== "none") {
          setModalView("none");
        } else {
          setModalView("pause");
        }
      } else if (e.code === "KeyI" || e.code === "Tab") {
        e.preventDefault();
        setModalView((prev) => (prev === "inventory" ? "none" : "inventory"));
      } else if (e.code === "KeyC") {
        e.preventDefault();
        setModalView((prev) => (prev === "crafting" ? "none" : "crafting"));
      } else if (e.code === "KeyB") {
        e.preventDefault();
        setModalView((prev) => (prev === "build" ? "none" : "build"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, inGame, gameOver, modalView]);

  // ── Actions ──
  const handleStartGame = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.start();
    setInGame(true);
    setGameOver(false);
    setModalView("none");
  };

  const handleNewGame = async () => {
    await deleteSave();
    setSaveMeta(null);
    // Reload container by recreating engine or respawn state
    const engine = engineRef.current;
    if (engine) {
      engine.dispose();
      engineRef.current = null;
    }
    // Re-init
    const initialSettings = loadSettings();
    const newEngine = new SurvivalEngine({
      container: containerRef.current!,
      save: null,
      settings: initialSettings,
      isTouch: isTouchDevice,
      onSnapshot: (s) => setSnapshot(s),
      onEvent: (e) => {
        if (e.type === "toast") addToast(e.text, e.tone, e.item);
        else if (e.type === "dead") setGameOver(true);
        else if (e.type === "pause-request") setModalView("pause");
        else if (e.type === "open-craft") setModalView("crafting");
      },
    });
    newEngine.setSaver(async (d) => {
      await saveGame(d);
      setSaveMeta(readMeta());
    });
    engineRef.current = newEngine;
    newEngine.setHidden(!isVisibleRef.current);
    newEngine.start();
    setInGame(true);
    setGameOver(false);
    setModalView("none");
  };

  const handleSaveAndExit = async () => {
    const engine = engineRef.current;
    if (engine) {
      await engine.saveNow();
    }
    setSaveMeta(readMeta());
    setInGame(false);
    setModalView("none");
    setGameOver(false);
  };

  const handleRespawn = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.respawn();
    setGameOver(false);
    setModalView("none");
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    storeSettings(newSettings);
    engineRef.current?.applySettings(newSettings);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      className={`relative flex flex-col h-full w-full overflow-hidden select-none ${
        isDark ? "bg-[#121215] text-zinc-100" : "bg-[#fafafc] text-zinc-900"
      }`}
    >
      {/* ── TOP APP HEADER (Standard Floating Bar, serasi dengan workspace lain) ── */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3.5 sm:px-6 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] bg-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {onTogglePanel && (
            <button
              onClick={onTogglePanel}
              className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                  : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
              }`}
              title="Menu Panel"
              aria-label="Menu Panel"
            >
              <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Sub Tabs: Game & Faith (atau Title tag jika standalone) */}
          {subTabsElement || (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
              <span>🌲</span>
              <span>Usick Survival</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white"
                : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black"
            }`}
            title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh (Fullscreen)"}
            aria-label="Fullscreen"
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Close/Exit to Chats */}
          {onClose && (
            <button
              onClick={onClose}
              className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white"
                  : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black"
              }`}
              title="Tutup Game"
              aria-label="Tutup Game"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ── 3D CANVAS CONTAINER ── */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full touch-none overflow-hidden" />

      {/* ── LANDSCAPE ROTATION SUGGESTION (MOBILE PORTRAIT ONLY) ── */}
      {isPortrait && inGame && (
        <div className="absolute top-14 left-4 right-4 z-40 p-2.5 rounded-xl bg-amber-500/90 text-zinc-950 font-bold text-xs backdrop-blur-md shadow-lg flex items-center justify-between animate-in fade-in-0 duration-200">
          <div className="flex items-center gap-2">
            <span>🔄</span>
            <span>Putar perangkat ke posisi Horizontal (Landscape) untuk kontrol terbaik!</span>
          </div>
          <button
            onClick={() => setIsPortrait(false)}
            className="px-2 py-0.5 rounded bg-black/20 hover:bg-black/30 text-[10px] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ── MAIN MENU OVERLAY ── */}
      {!inGame && (
        <MainMenuOverlay
          meta={saveMeta}
          onContinue={handleStartGame}
          onNewGame={handleNewGame}
          onOpenHowToPlay={() => setModalView("howToPlay")}
          onOpenSettings={() => setModalView("settings")}
          isDark={isDark}
        />
      )}

      {/* ── PLAYING HUD ── */}
      {inGame && (
        <GameHUD
          snapshot={snapshot}
          toasts={toasts}
          isTouch={isTouchDevice}
          onPause={() => setModalView("pause")}
          onOpenInventory={() => setModalView("inventory")}
          onOpenCrafting={() => setModalView("crafting")}
          onOpenBuild={() => setModalView("build")}
          onSelectHotbar={(slot) => engineRef.current?.selectHotbar(slot)}
          onInteract={() => engineRef.current?.interact()}
          onAttack={() => engineRef.current?.attack()}
          onJump={() => engineRef.current?.jump()}
          onRotateBuild={() => engineRef.current?.rotateBuild()}
          onCancelBuild={() => engineRef.current?.cancelBuild()}
          onMoveChange={(x, y) => engineRef.current?.setMove(x, y)}
          onLookChange={(dx, dy) => engineRef.current?.addLook(dx, dy)}
          onSprintToggle={(sprint) => engineRef.current?.setSprint(sprint)}
          showFps={settings.showFps}
        />
      )}

      {/* ── MODALS ── */}
      {modalView === "pause" && (
        <PauseModal
          onResume={() => setModalView("none")}
          onOpenInventory={() => setModalView("inventory")}
          onOpenCrafting={() => setModalView("crafting")}
          onOpenSettings={() => setModalView("settings")}
          onOpenHowToPlay={() => setModalView("howToPlay")}
          onSaveAndExit={handleSaveAndExit}
          isSaving={snapshot.saveStatus === "saving"}
          day={snapshot.day}
          survivedTime={snapshot.survived}
          isDark={isDark}
        />
      )}

      {modalView === "inventory" && (
        <InventoryModal
          inventory={snapshot.inventory}
          hotbarIndex={snapshot.hotbarIndex}
          onClose={() => setModalView("none")}
          onUse={(slot) => engineRef.current?.useSlot(slot)}
          onEquip={(slot) => engineRef.current?.equipSlot(slot)}
          onDrop={(slot) => engineRef.current?.dropSlot(slot)}
          isDark={isDark}
        />
      )}

      {modalView === "crafting" && (
        <CraftingModal
          onClose={() => setModalView("none")}
          onCraft={(recipeId) => engineRef.current?.craft(recipeId) || { ok: false }}
          countItem={(id) => engineRef.current?.countItem(id) || 0}
          nearWorkbench={snapshot.nearWorkbench}
          isDark={isDark}
        />
      )}

      {modalView === "build" && (
        <BuildMenuModal
          onClose={() => setModalView("none")}
          onSelect={(type: BuildType) => engineRef.current?.startBuild(type)}
          countItem={(id: ItemId) => engineRef.current?.countItem(id) || 0}
          nearWorkbench={snapshot.nearWorkbench}
          isDark={isDark}
        />
      )}

      {modalView === "settings" && (
        <SettingsModal
          settings={settings}
          onSave={handleUpdateSettings}
          onClose={() => setModalView("none")}
          isDark={isDark}
        />
      )}

      {modalView === "howToPlay" && (
        <HowToPlayModal onClose={() => setModalView("none")} isDark={isDark} />
      )}

      {gameOver && (
        <GameOverModal
          day={snapshot.day}
          survivedTime={snapshot.survived}
          deaths={snapshot.deaths}
          onRespawn={handleRespawn}
          onRestart={handleNewGame}
          onExitMenu={handleSaveAndExit}
          isDark={isDark}
        />
      )}
    </div>
  );
}
