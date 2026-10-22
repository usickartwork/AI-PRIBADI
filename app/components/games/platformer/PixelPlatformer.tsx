"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  LevelData,
  getLevel,
} from "./platformerLevels";
import {
  PlayerEntity,
  PlayerInput,
  Particle,
  Camera2D,
  createPlayer,
  updateGameEngine,
  updateCamera2D,
  renderGameScene,
} from "./platformerEngine";
import {
  playJumpSound,
  playCoinSound,
  playStompSound,
  playHurtSound,
  playCheckpointSound,
  playVictoryFanfare,
} from "./platformerAudio";
import {
  loadPlatformerRecords,
  savePlatformerRecords,
  formatTimeMs,
  PlatformerRecords,
} from "../common/gameStorage";

interface PixelPlatformerProps {
  isDark?: boolean;
  onBackToHub: () => void;
}

export const PixelPlatformer: React.FC<PixelPlatformerProps> = ({
  isDark = true,
  onBackToHub,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Storage & Rekor
  const [records, setRecords] = useState<PlatformerRecords>(loadPlatformerRecords);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [currentLevelData, setCurrentLevelData] = useState<LevelData>(() => getLevel(1));
  const [gameState, setGameState] = useState<
    "menu" | "playing" | "paused" | "level_complete" | "all_cleared"
  >("menu");

  // Status In-Game
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [totalCoinsInLevel, setTotalCoinsInLevel] = useState<number>(12);
  const [levelDeaths, setLevelDeaths] = useState<number>(0);
  const [elapsedTimeMs, setElapsedTimeMs] = useState<number>(0);
  const [lastFinishedTime, setLastFinishedTime] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => records.soundEnabled);

  // References untuk 60fps Loop
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const animFrameRef = useRef<number | null>(null);
  const levelRef = useRef<LevelData>(getLevel(1));
  const playerRef = useRef<PlayerEntity>(createPlayer({ x: 80, y: 380 }));
  const particlesRef = useRef<Particle[]>([]);
  const cameraRef = useRef<Camera2D>({ x: 0, y: 0, viewportWidth: 512, viewportHeight: 288 });
  const levelStartTimeRef = useRef<number>(0);

  // Inputs
  const inputsRef = useRef<PlayerInput>({
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
    jumpJustReleased: false,
  });

  // Sound Toggle
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const nextVal = !prev;
      soundEnabledRef.current = nextVal;
      setRecords((r) => {
        const updated = { ...r, soundEnabled: nextVal };
        savePlatformerRecords(updated);
        return updated;
      });
      return nextVal;
    });
  }, []);

  // Mulai Level Tertentu
  const startLevel = useCallback(
    (lvlId: number) => {
      const lvl = getLevel(lvlId);
      levelRef.current = lvl;
      setCurrentLevelData(lvl);
      playerRef.current = createPlayer(lvl.playerStart);
      particlesRef.current = [];
      cameraRef.current.x = 0;
      cameraRef.current.y = 0;

      setSelectedLevelId(lvlId);
      setCoinsCollected(0);
      setTotalCoinsInLevel(lvl.coins.length);
      setLevelDeaths(0);
      setElapsedTimeMs(0);
      setIsNewRecord(false);
      setLastFinishedTime(null);
      setGameState("playing");

      levelStartTimeRef.current = performance.now();
    },
    []
  );

  // ─── KEYBOARD LISTENERS ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) inputsRef.current.left = true;
      if (["ArrowRight", "KeyD"].includes(e.code)) inputsRef.current.right = true;
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        if (!inputsRef.current.jump) {
          inputsRef.current.jumpJustPressed = true;
        }
        inputsRef.current.jump = true;
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState((prev) => {
          if (prev === "playing") return "paused";
          if (prev === "paused") return "playing";
          return prev;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) inputsRef.current.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code)) inputsRef.current.right = false;
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        inputsRef.current.jump = false;
        inputsRef.current.jumpJustReleased = true;
      }
    };

    const handleBlur = () => {
      inputsRef.current = {
        left: false,
        right: false,
        jump: false,
        jumpJustPressed: false,
        jumpJustReleased: false,
      };
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // ─── 60 FPS CANVAS GAME LOOP ───
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Matikan smoothing untuk render pixel-art yang tajam
      ctx.imageSmoothingEnabled = false;

      // Update Engine jika sedang dalam state "playing"
      if (gameState === "playing") {
        const elapsed = now - levelStartTimeRef.current;
        setElapsedTimeMs(elapsed);

        updateGameEngine(
          playerRef.current,
          levelRef.current,
          inputsRef.current,
          particlesRef.current,
          dt,
          {
            onCoinCollected: () => {
              playCoinSound(soundEnabledRef.current);
              setCoinsCollected((c) => {
                const nextC = c + 1;
                setRecords((prev) => {
                  const updated = {
                    ...prev,
                    totalCoinsCollected: prev.totalCoinsCollected + 1,
                  };
                  savePlatformerRecords(updated);
                  return updated;
                });
                return nextC;
              });
            },
            onEnemyDefeated: () => {
              playStompSound(soundEnabledRef.current);
            },
            onPlayerDeath: () => {
              playHurtSound(soundEnabledRef.current);
              setLevelDeaths((d) => {
                const nextD = d + 1;
                setRecords((prev) => {
                  const updated = {
                    ...prev,
                    totalDeaths: prev.totalDeaths + 1,
                  };
                  savePlatformerRecords(updated);
                  return updated;
                });
                return nextD;
              });
            },
            onCheckpoint: () => {
              playCheckpointSound(soundEnabledRef.current);
            },
            onJump: () => {
              playJumpSound(soundEnabledRef.current);
            },
            onFinish: () => {
              // Level Clear!
              const finishTime = now - levelStartTimeRef.current;
              setLastFinishedTime(finishTime);
              playVictoryFanfare(soundEnabledRef.current);

              setRecords((prev) => {
                const currentBest = prev.bestTimesMs[levelRef.current.id];
                const isBest = currentBest === null || finishTime < currentBest;
                setIsNewRecord(isBest);

                const nextUnlocked = Math.max(
                  prev.highestLevelUnlocked,
                  Math.min(3, levelRef.current.id + 1)
                );

                const updated: PlatformerRecords = {
                  ...prev,
                  highestLevelUnlocked: nextUnlocked,
                  bestTimesMs: {
                    ...prev.bestTimesMs,
                    [levelRef.current.id]: isBest ? finishTime : currentBest,
                  },
                };
                savePlatformerRecords(updated);
                return updated;
              });

              if (levelRef.current.id >= 3) {
                setGameState("all_cleared");
              } else {
                setGameState("level_complete");
              }
            },
          }
        );

        // Reset just-pressed flags setelah satu siklus fisika
        inputsRef.current.jumpJustPressed = false;
        inputsRef.current.jumpJustReleased = false;

        // Update Camera
        updateCamera2D(
          cameraRef.current,
          playerRef.current,
          levelRef.current.levelWidth,
          levelRef.current.levelHeight,
          dt
        );
      }

      // Render Scene
      renderGameScene(
        ctx,
        playerRef.current,
        levelRef.current,
        cameraRef.current,
        particlesRef.current
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState]);

  // Responsive Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // Virtual retro resolution
      const targetW = 512;
      const targetH = 288;
      canvas.width = targetW;
      canvas.height = targetH;

      cameraRef.current.viewportWidth = targetW;
      cameraRef.current.viewportHeight = targetH;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col h-full w-full overflow-hidden select-none ${
        isDark ? "bg-[#0b0f17] text-zinc-100" : "bg-[#f8fafc] text-zinc-900"
      }`}
    >
      {/* ─── TOP BAR HUD ─── */}
      <div
        className={`relative z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b backdrop-blur-xl ${
          isDark
            ? "bg-[#0f172a]/80 border-white/10"
            : "bg-white/80 border-black/10"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToHub}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition border ${
              isDark
                ? "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700/60"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Game Hub</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight">Pixel Platformer</h1>
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isDark
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                2D Arcade
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block">
              {currentLevelData.name} • Retro Cyber Side-Scroller
            </p>
          </div>
        </div>

        {/* Live HUD Stats (Saat Playing) */}
        {gameState === "playing" && (
          <div className="flex items-center gap-3 sm:gap-5 text-xs font-mono font-bold">
            {/* Coins */}
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="text-sm">🪙</span>
              <span>
                {coinsCollected}/{totalCoinsInLevel}
              </span>
            </div>

            {/* Deaths */}
            <div className="flex items-center gap-1 text-rose-400">
              <span className="text-sm">💀</span>
              <span>{levelDeaths}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1 text-cyan-400">
              <span className="text-sm">⏱️</span>
              <span>{formatTimeMs(elapsedTimeMs)}</span>
            </div>
          </div>
        )}

        {/* Controls Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {gameState === "playing" && (
            <button
              onClick={() => setGameState("paused")}
              title="Pause Game (P / Esc)"
              className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
                isDark
                  ? "bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-300"
                  : "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700"
              }`}
            >
              ⏸
            </button>
          )}

          <button
            onClick={toggleSound}
            title={soundEnabled ? "Mute Suara" : "Nyalakan Suara"}
            className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
              isDark
                ? "bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-300"
                : "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700"
            }`}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </div>

      {/* ─── 2D CANVAS CONTAINER ─── */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full max-w-full max-h-full object-contain [image-rendering:pixelated]"
        />

        {/* ─── MOBILE TOUCH CONTROLS (Hanya muncul di touch screen/mobile) ─── */}
        {gameState === "playing" && (
          <div className="absolute inset-x-0 bottom-3 px-4 flex sm:hidden items-center justify-between pointer-events-none z-30">
            {/* D-Pad Left/Right */}
            <div className="flex gap-2 pointer-events-auto">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  inputsRef.current.left = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  inputsRef.current.left = false;
                }}
                onPointerCancel={() => (inputsRef.current.left = false)}
                className="w-14 h-14 rounded-2xl bg-zinc-900/80 active:bg-cyan-500 active:text-black text-white font-bold text-2xl border border-zinc-700 flex items-center justify-center shadow-xl active:scale-95 transition-transform select-none touch-none"
              >
                ◀
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  inputsRef.current.right = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  inputsRef.current.right = false;
                }}
                onPointerCancel={() => (inputsRef.current.right = false)}
                className="w-14 h-14 rounded-2xl bg-zinc-900/80 active:bg-cyan-500 active:text-black text-white font-bold text-2xl border border-zinc-700 flex items-center justify-center shadow-xl active:scale-95 transition-transform select-none touch-none"
              >
                ▶
              </button>
            </div>

            {/* Jump Button */}
            <div className="pointer-events-auto">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (!inputsRef.current.jump) {
                    inputsRef.current.jumpJustPressed = true;
                  }
                  inputsRef.current.jump = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  inputsRef.current.jump = false;
                  inputsRef.current.jumpJustReleased = true;
                }}
                onPointerCancel={() => {
                  inputsRef.current.jump = false;
                  inputsRef.current.jumpJustReleased = true;
                }}
                className="w-16 h-16 rounded-3xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-sm border-2 border-emerald-400 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform select-none touch-none"
              >
                <span className="text-lg">⬆</span>
                <span className="text-[10px] tracking-wider uppercase">JUMP</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── DESKTOP CONTROLS HINT ─── */}
        {gameState === "playing" && (
          <div className="hidden sm:flex absolute bottom-3 self-center items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-900/70 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300 pointer-events-none z-20">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">A/D</kbd> atau <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">◀ ▶</kbd> Gerak
            </span>
            <span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">SPACE</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">W</kbd> Lompat
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">ESC / P</kbd> Pause
            </span>
          </div>
        )}
      </div>

      {/* ─── OVERLAY 1: LEVEL SELECT MENU ─── */}
      {gameState === "menu" && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-40 p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-zinc-900/95 border border-white/10 shadow-2xl text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-emerald-500/20">
              🕹️
            </div>
            <h2 className="text-xl font-black text-white mb-1">Pixel Platformer</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Jelajahi 3 dunia platformer retro, hindari duri, kalahkan musuh cyber, dan capai portal kemenangan!
            </p>

            {/* 3 Level Choices */}
            <div className="space-y-2.5 mb-6 text-left">
              {[1, 2, 3].map((lvlId) => {
                const lvl = getLevel(lvlId);
                const isUnlocked = lvlId <= records.highestLevelUnlocked;
                const isSelected = selectedLevelId === lvlId;
                const bestTime = records.bestTimesMs[lvlId];

                return (
                  <button
                    key={lvlId}
                    disabled={!isUnlocked}
                    onClick={() => setSelectedLevelId(lvlId)}
                    className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      !isUnlocked
                        ? "opacity-40 bg-zinc-800/20 border-zinc-800 cursor-not-allowed"
                        : isSelected
                        ? "bg-zinc-800 border-emerald-400 shadow-lg shadow-emerald-500/20"
                        : "bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                        style={{
                          backgroundColor: `${lvl.themeColor}25`,
                          color: lvl.themeColor,
                          border: `1px solid ${lvl.themeColor}50`,
                        }}
                      >
                        {isUnlocked ? lvlId : "🔒"}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">{lvl.name}</h3>
                        <p className="text-[10px] text-zinc-400">{lvl.subtitle}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      {bestTime ? (
                        <span className="text-emerald-400 font-bold">{formatTimeMs(bestTime)}</span>
                      ) : (
                        <span className="text-zinc-500">Belum Selesai</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => startLevel(selectedLevelId)}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Mainkan Level {selectedLevelId}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── OVERLAY 2: PAUSED ─── */}
      {gameState === "paused" && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-40 p-4">
          <div className="p-6 rounded-3xl border border-zinc-700 bg-zinc-900/95 text-center max-w-xs w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Game Paused</h2>
            <p className="text-xs text-zinc-400 mb-5">Lanjutkan permainan atau pilih level.</p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setGameState("playing")}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Lanjutkan
              </button>
              <button
                onClick={() => startLevel(selectedLevelId)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Restart Level
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="w-full py-2.5 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Pilih Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── OVERLAY 3: LEVEL COMPLETE ─── */}
      {gameState === "level_complete" && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-40 p-4">
          <div className="p-6 rounded-3xl border border-emerald-500/40 bg-zinc-900/95 text-center max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-emerald-500/30">
              🚩
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Level {currentLevelData.id} Selesai!</h2>
            <p className="text-xs text-zinc-400 mb-4">Luar biasa! Kamu berhasil menaklukkan {currentLevelData.name}.</p>

            <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 mb-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Waktu Tempuh:</span>
                <span className="font-bold text-white font-mono">{formatTimeMs(lastFinishedTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Koin Diambil:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {coinsCollected} / {totalCoinsInLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Kematian:</span>
                <span className="font-bold text-rose-400 font-mono">{levelDeaths}</span>
              </div>
              {isNewRecord && (
                <div className="pt-1.5 text-center text-[11px] font-bold text-emerald-400 animate-pulse">
                  ✨ REKOR WAKTU TERCEPAT BARU! ✨
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => startLevel(Math.min(3, currentLevelData.id + 1))}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Level Berikutnya ▶
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Pilih Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── OVERLAY 4: ALL LEVELS CLEARED VICTORY ─── */}
      {gameState === "all_cleared" && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-40 p-4">
          <div className="p-6 rounded-3xl border border-amber-500/50 bg-zinc-900/95 text-center max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-4xl shadow-lg shadow-amber-500/30">
              🏆
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Selamat! Kamu Tamat!</h2>
            <p className="text-xs text-zinc-400 mb-4">
              Semua 3 level Pixel Platformer berhasil kamu selesaikan dengan gemilang!
            </p>

            <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 mb-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Koin Terkumpul:</span>
                <span className="font-bold text-amber-400 font-mono">{records.totalCoinsCollected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Kematian Karakter:</span>
                <span className="font-bold text-rose-400 font-mono">{records.totalDeaths}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => startLevel(1)}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Main Ulang dari Level 1
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Menu Level
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelPlatformer;
