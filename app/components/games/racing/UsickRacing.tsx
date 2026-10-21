"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import {
  CarType,
  CAR_CONFIGS,
  CarModelInstance,
  create3DCar,
} from "./racingCarModels";
import { buildRaceTrack, TrackData, RAW_CIRCUIT_POINTS } from "./racingTrack";
import {
  PlayerCarState,
  PlayerControls,
  updatePlayerPhysics,
} from "./racingPhysics";
import {
  AICarState,
  createAIRacers,
  updateAIRacers,
  resetAIRacers,
  cleanupAIRacers,
} from "./racingAI";
import {
  startEngineSound,
  updateEnginePitch,
  stopEngineSound,
  startDriftSound,
  stopDriftSound,
  playBoostSound,
  playCrashSound,
  playCountdownBeep,
  playFinishFanfare,
} from "./racingAudio";
import {
  loadRacingRecords,
  saveRacingRecords,
  formatTimeMs,
  RacingRecords,
} from "../common/gameStorage";

// Pre-allocated scratch vectors to prevent GC frame stutters in the 60fps chase camera loop
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();

interface UsickRacingProps {
  isDark?: boolean;
  onBackToHub: () => void;
}

export const UsickRacing: React.FC<UsickRacingProps> = ({
  isDark = true,
  onBackToHub,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [records, setRecords] = useState<RacingRecords>(loadRacingRecords);
  const [selectedCarType, setSelectedCarType] = useState<CarType>(
    () => records.selectedCar
  );
  const [gameState, setGameState] = useState<
    "select" | "countdown" | "racing" | "paused" | "finished"
  >("select");
  const [countdownNum, setCountdownNum] = useState<string>("3");
  const [currentLap, setCurrentLap] = useState<number>(1);
  const TOTAL_LAPS = 3;
  const [currentLapTime, setCurrentLapTime] = useState<number>(0);
  const [lastLapTime, setLastLapTime] = useState<number | null>(null);
  const [totalRaceTime, setTotalRaceTime] = useState<number>(0);
  const [playerRank, setPlayerRank] = useState<number>(1);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => records.soundEnabled
  );

  // References for live 60fps game loop
  const inputsRef = useRef<PlayerControls>({
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
  });

  const playerStateRef = useRef<PlayerCarState>({
    position: new THREE.Vector3(0, 0.35, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    headingAngle: 0,
    speed: 0,
    steerAngle: 0,
    isDrifting: false,
    driftCharge: 0,
    boostDuration: 0,
    currentLap: 1,
    currentCheckpoint: 0,
    checkpointsPassed: new Set([0]),
    raceProgress: 0,
    hasFinished: false,
  });

  const animFrameRef = useRef<number | null>(null);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const aiRacersRef = useRef<AICarState[]>([]);
  const trackDataRef = useRef<TrackData | null>(null);
  const playerModelRef = useRef<CarModelInstance | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lapStartTimeRef = useRef<number>(0);
  const raceStartTimeRef = useRef<number>(0);
  const countdownTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearCountdownTimeouts = useCallback(() => {
    countdownTimeoutsRef.current.forEach((t) => clearTimeout(t));
    countdownTimeoutsRef.current = [];
  }, []);

  // Toggle Sound
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const nextVal = !prev;
      soundEnabledRef.current = nextVal;
      setRecords((r) => {
        const updated = { ...r, soundEnabled: nextVal };
        saveRacingRecords(updated);
        return updated;
      });
      return nextVal;
    });
  }, []);

  // Mulai Balapan (Start Countdown 3-2-1-GO!)
  const startRace = useCallback(() => {
    clearCountdownTimeouts();

    // Reset player position to starting line
    const startPt = RAW_CIRCUIT_POINTS[0];
    playerStateRef.current = {
      position: new THREE.Vector3(startPt.x, startPt.y + 0.35, startPt.z),
      velocity: new THREE.Vector3(0, 0, 0),
      headingAngle: 0,
      speed: 0,
      steerAngle: 0,
      isDrifting: false,
      driftCharge: 0,
      boostDuration: 0,
      currentLap: 1,
      currentCheckpoint: 0,
      checkpointsPassed: new Set([0]),
      raceProgress: 0,
      hasFinished: false,
    };

    // Reset AI racers ke posisi grid awal
    resetAIRacers(aiRacersRef.current, startPt);

    setCurrentLap(1);
    setCurrentLapTime(0);
    setLastLapTime(null);
    setTotalRaceTime(0);
    setPlayerRank(1);
    setSpeedKmh(0);
    setIsBoosting(false);
    setGameState("countdown");
    setCountdownNum("3");

    playCountdownBeep(false, soundEnabledRef.current);

    const t1 = setTimeout(() => {
      setCountdownNum("2");
      playCountdownBeep(false, soundEnabledRef.current);
      const t2 = setTimeout(() => {
        setCountdownNum("1");
        playCountdownBeep(false, soundEnabledRef.current);
        const t3 = setTimeout(() => {
          setCountdownNum("GO!");
          playCountdownBeep(true, soundEnabledRef.current);
          startEngineSound(soundEnabledRef.current);
          setGameState("racing");
          const now = performance.now();
          lapStartTimeRef.current = now;
          raceStartTimeRef.current = now;
          const t4 = setTimeout(() => setCountdownNum(""), 700);
          countdownTimeoutsRef.current.push(t4);
        }, 1000);
        countdownTimeoutsRef.current.push(t3);
      }, 1000);
      countdownTimeoutsRef.current.push(t2);
    }, 1000);
    countdownTimeoutsRef.current.push(t1);
  }, [clearCountdownTimeouts]);

  // Inisialisasi Scene Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c0e);
    scene.fog = new THREE.FogExp2(0x0c0c0e, 0.007);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Pencahayaan
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 80, 50);
    scene.add(dirLight);

    // Lampu Aksen Neon Langit
    const neonLight1 = new THREE.PointLight(0x06b6d4, 2.5, 120);
    neonLight1.position.set(0, 30, 60);
    const neonLight2 = new THREE.PointLight(0xec4899, 2.5, 120);
    neonLight2.position.set(120, 30, 160);
    scene.add(neonLight1, neonLight2);

    // Bangun Sirkuit 3D
    const track = buildRaceTrack();
    trackDataRef.current = track;
    scene.add(
      track.trackMesh,
      track.curbLeftMesh,
      track.curbRightMesh,
      track.barrierLeftMesh,
      track.barrierRightMesh,
      track.gantryGroup,
      track.decorGroup
    );

    // Grid Floor
    const grid = new THREE.GridHelper(500, 100, 0x06b6d4, 0x1f2937);
    grid.position.y = -0.1;
    scene.add(grid);

    // Model Mobil Pemain
    const carCfg = CAR_CONFIGS[selectedCarType];
    const playerModel = create3DCar(
      carCfg.bodyColor,
      carCfg.trimColor,
      carCfg.neonColor
    );
    playerModelRef.current = playerModel;
    scene.add(playerModel.group);

    // AI Racers
    const aiRacers = createAIRacers(scene, RAW_CIRCUIT_POINTS[0]);
    aiRacersRef.current = aiRacers;

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearCountdownTimeouts();
      stopEngineSound();
      stopDriftSound();
      cleanupAIRacers(aiRacers, scene);
      renderer.dispose();
      if (container) container.innerHTML = "";
    };
  }, [selectedCarType, clearCountdownTimeouts]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) inputsRef.current.up = true;
      if (["ArrowDown", "KeyS"].includes(e.code)) inputsRef.current.down = true;
      if (["ArrowLeft", "KeyA"].includes(e.code)) inputsRef.current.left = true;
      if (["ArrowRight", "KeyD"].includes(e.code))
        inputsRef.current.right = true;
      if (e.code === "Space") inputsRef.current.drift = true;

      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState((prev) => {
          if (prev === "racing") {
            stopEngineSound();
            return "paused";
          }
          if (prev === "paused") {
            startEngineSound(soundEnabledRef.current);
            return "racing";
          }
          return prev;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) inputsRef.current.up = false;
      if (["ArrowDown", "KeyS"].includes(e.code))
        inputsRef.current.down = false;
      if (["ArrowLeft", "KeyA"].includes(e.code))
        inputsRef.current.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code))
        inputsRef.current.right = false;
      if (e.code === "Space") inputsRef.current.drift = false;
    };

    const handleBlur = () => {
      inputsRef.current = {
        up: false,
        down: false,
        left: false,
        right: false,
        drift: false,
      };
      stopEngineSound();
      stopDriftSound();
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

  // Main 60 FPS Three.js Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const player = playerStateRef.current;
      const playerModel = playerModelRef.current;
      const track = trackDataRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      const renderer = rendererRef.current;

      if (!scene || !camera || !renderer || !track || !playerModel) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      // Mode Preview Pemilihan Mobil (Turntable Rotation)
      if (gameState === "select") {
        playerModel.group.rotation.y += dt * 0.8;
        playerModel.group.position.set(0, 0.5, 0);
        camera.position.set(0, 2.2, 5.5);
        camera.lookAt(0, 0.5, 0);
        renderer.render(scene, camera);
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      // Mode Balapan & Countdown
      const isRacingMode = gameState === "racing";

      if (isRacingMode) {
        const lapElapsed = now - lapStartTimeRef.current;
        setCurrentLapTime(lapElapsed);

        // Update Fisika Mobil Pemain
        updatePlayerPhysics(
          player,
          inputsRef.current,
          track.sampledPoints,
          track.checkpoints,
          dt,
          () => playCrashSound(soundEnabledRef.current),
          () => {
            playBoostSound(soundEnabledRef.current);
            setIsBoosting(true);
            setTimeout(() => setIsBoosting(false), 1200);
          }
        );

        // Sound Handling
        updateEnginePitch(
          Math.abs(player.speed) / 42.0,
          soundEnabledRef.current
        );
        if (player.isDrifting) {
          startDriftSound(soundEnabledRef.current);
        } else {
          stopDriftSound();
        }

        // Cek Garis Finish (Checkpoint 0)
        const startPt = RAW_CIRCUIT_POINTS[0];
        const distToStartLine = Math.hypot(
          player.position.x - startPt.x,
          player.position.z - startPt.z
        );
        const hasPassedMostTrack =
          player.checkpointsPassed.size >= track.checkpoints.length * 0.75;

        if (distToStartLine < 6.0 && hasPassedMostTrack) {
          const finishedLapTime = now - lapStartTimeRef.current;
          setLastLapTime(finishedLapTime);
          playBoostSound(soundEnabledRef.current);

          // Update Best Lap
          setRecords((prev) => {
            const isNewBest =
              prev.bestLapMs === null || finishedLapTime < prev.bestLapMs;
            const updated: RacingRecords = {
              ...prev,
              bestLapMs: isNewBest ? finishedLapTime : prev.bestLapMs,
            };
            saveRacingRecords(updated);
            return updated;
          });

          player.checkpointsPassed = new Set([0]);
          lapStartTimeRef.current = now;

          if (player.currentLap >= TOTAL_LAPS) {
            // Selesai Balapan!
            const finalTime = now - raceStartTimeRef.current;
            setTotalRaceTime(finalTime);
            setGameState("finished");
            stopEngineSound();
            stopDriftSound();
            playFinishFanfare(playerRank === 1, soundEnabledRef.current);

            setRecords((prev) => {
              const updated = {
                ...prev,
                totalRacesFinished: prev.totalRacesFinished + 1,
              };
              saveRacingRecords(updated);
              return updated;
            });
          } else {
            player.currentLap += 1;
            setCurrentLap(player.currentLap);
          }
        }

        // Update Speedometer HUD (km/h)
        setSpeedKmh(Math.round(Math.abs(player.speed) * 3.4));
      }

      // Update AI Lawan & Peringkat Balapan
      const currentRank = updateAIRacers(
        aiRacersRef.current,
        player,
        track.curve,
        track.checkpoints,
        dt,
        isRacingMode
      );
      setPlayerRank(currentRank);

      // Sinkronkan Mesh Mobil Pemain dengan Posisi & Sudut Fisika
      playerModel.group.position.copy(player.position);
      playerModel.group.rotation.y = player.headingAngle;

      // Efek visual body tilt saat belok & drift
      playerModel.group.rotation.z = player.steerAngle * 0.18;
      playerModel.updateWheels(player.speed, player.steerAngle, dt);

      // ─── KAMERA THIRD-PERSON DINAMIS (CHASE CAMERA) ───
      const camDistance = 7.5;
      const camHeight = 3.6;

      const forwardX = Math.sin(player.headingAngle);
      const forwardZ = Math.cos(player.headingAngle);

      _camTargetPos.set(
        player.position.x - forwardX * camDistance,
        player.position.y + camHeight,
        player.position.z - forwardZ * camDistance
      );

      // Haluskan pergerakan kamera (Smooth Lerp)
      camera.position.lerp(_camTargetPos, Math.min(1, dt * 7.5));

      _camLookTarget.set(
        player.position.x + forwardX * 8.0,
        player.position.y + 1.2,
        player.position.z + forwardZ * 8.0
      );
      camera.lookAt(_camLookTarget);

      // Dynamic FOV Boost effect
      const targetFOV = player.boostDuration > 0 ? 66 : 60;
      camera.fov += (targetFOV - camera.fov) * Math.min(1, dt * 5);
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, playerRank]);

  return (
    <div
      className={`relative flex flex-col h-full w-full overflow-hidden select-none ${
        isDark ? "bg-[#121215] text-zinc-100" : "bg-[#fafafc] text-zinc-900"
      }`}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Top Header Bar */}
      <div
        className={`relative z-20 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl ${
          isDark
            ? "bg-[#121215]/80 border-white/10"
            : "bg-white/80 border-black/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              clearCountdownTimeouts();
              stopEngineSound();
              stopDriftSound();
              onBackToHub();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition border ${
              isDark
                ? "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700/60"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Game Hub</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">Usick Racing</h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isDark
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                }`}
              >
                3D Arcade
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Third-Person 3D Racing • Mario Kart & NFS Style Arcade
            </p>
          </div>
        </div>

        {/* Live HUD Quick Bar (Saat Balapan) */}
        {gameState === "racing" && (
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Rank */}
            <div className="flex items-center gap-1 bg-zinc-900/90 border border-cyan-500/50 px-3 py-1 rounded-xl shadow-lg shadow-cyan-500/20">
              <span className="text-lg font-black text-cyan-400">
                {playerRank === 1
                  ? "1st"
                  : playerRank === 2
                  ? "2nd"
                  : playerRank === 3
                  ? "3rd"
                  : "4th"}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase">/ 4</span>
            </div>

            {/* Lap Tracker */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] text-zinc-400 uppercase">Lap</span>
              <span className="text-xs font-bold text-white font-mono">
                {currentLap} / {TOTAL_LAPS}
              </span>
            </div>

            {/* Timer */}
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-zinc-400 uppercase">Time</span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {formatTimeMs(currentLapTime)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Mute Suara" : "Nyalakan Suara"}
            className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
              isDark
                ? "bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-300"
                : "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700"
            }`}
          >
            {soundEnabled ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ─── MENU 1: CAR SELECTION PREVIEW OVERLAY ─── */}
      {gameState === "select" && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end p-4 sm:p-8 pointer-events-none">
          <div className="max-w-md w-full mx-auto p-5 rounded-3xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Garasi Supercar
                </span>
                <h2 className="text-lg font-bold text-white">Pilih Mobil Anda</h2>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Best: {formatTimeMs(records.bestLapMs)}
              </span>
            </div>

            {/* 3 Car Choices */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(Object.keys(CAR_CONFIGS) as CarType[]).map((type) => {
                const cfg = CAR_CONFIGS[type];
                const isSelected = selectedCarType === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedCarType(type);
                      setRecords((r) => {
                        const updated = { ...r, selectedCar: type };
                        saveRacingRecords(updated);
                        return updated;
                      });
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800 border-cyan-400 shadow-lg shadow-cyan-500/20"
                        : "bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/70"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full mb-1.5 shadow-sm"
                      style={{ backgroundColor: `#${cfg.bodyColor.toString(16).padStart(6, "0")}` }}
                    />
                    <p className="text-xs font-bold text-white truncate">
                      {cfg.name}
                    </p>
                    <p className="text-[10px] text-zinc-400">{cfg.maxSpeedKmh} km/h</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={startRace}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/30 transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Mulai Balapan</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── COUNTDOWN OVERLAY (3 - 2 - 1 - GO!) ─── */}
      {countdownNum && gameState === "countdown" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <span className="text-8xl sm:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-500 drop-shadow-[0_0_40px_rgba(6,182,212,0.9)] animate-pulse">
            {countdownNum}
          </span>
        </div>
      )}

      {/* ─── LIVE RACING HUD ─── */}
      {gameState === "racing" && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-20">
          {/* Top Left: Speedometer & Turbo Status */}
          <div className="flex items-end gap-3">
            <div className="bg-zinc-900/85 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-baseline gap-1.5 shadow-xl">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {speedKmh}
              </span>
              <span className="text-xs font-bold text-zinc-400">KM/H</span>
            </div>

            {isBoosting && (
              <div className="bg-cyan-500/20 border border-cyan-400 px-3 py-1.5 rounded-xl text-cyan-300 font-black text-xs tracking-wider animate-bounce shadow-lg shadow-cyan-500/40">
                TURBO BOOST! ⚡
              </div>
            )}
          </div>

          {/* Bottom Desktop Controls Help */}
          <div className="hidden sm:flex self-center items-center gap-4 px-4 py-1.5 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">W</kbd> Gas
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">S</kbd> Rem
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">A/D</kbd> Kemudi
            </span>
            <span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">SPACE</kbd> Drift Boost
            </span>
          </div>

          {/* Mobile Touch Controls */}
          <div className="flex sm:hidden w-full items-center justify-between px-1 pointer-events-auto">
            {/* Left Steering Cluster */}
            <div className="flex gap-2">
              <button
                onPointerDown={() => (inputsRef.current.left = true)}
                onPointerUp={() => (inputsRef.current.left = false)}
                onPointerCancel={() => (inputsRef.current.left = false)}
                className="w-14 h-14 rounded-2xl bg-zinc-900/85 active:bg-cyan-500 active:text-black text-white font-bold text-xl border border-zinc-700 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                ◀
              </button>
              <button
                onPointerDown={() => (inputsRef.current.right = true)}
                onPointerUp={() => (inputsRef.current.right = false)}
                onPointerCancel={() => (inputsRef.current.right = false)}
                className="w-14 h-14 rounded-2xl bg-zinc-900/85 active:bg-cyan-500 active:text-black text-white font-bold text-xl border border-zinc-700 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                ▶
              </button>
            </div>

            {/* Drift Button */}
            <button
              onPointerDown={() => (inputsRef.current.drift = true)}
              onPointerUp={() => (inputsRef.current.drift = false)}
              onPointerCancel={() => (inputsRef.current.drift = false)}
              className="w-12 h-12 rounded-xl bg-purple-500/30 active:bg-purple-500 border border-purple-500/50 text-purple-200 active:text-white font-black text-xs flex items-center justify-center shadow-lg active:scale-95"
            >
              DRIFT
            </button>

            {/* Right Pedals Cluster */}
            <div className="flex gap-2">
              <button
                onPointerDown={() => (inputsRef.current.down = true)}
                onPointerUp={() => (inputsRef.current.down = false)}
                onPointerCancel={() => (inputsRef.current.down = false)}
                className="w-14 h-14 rounded-2xl bg-zinc-900/85 active:bg-rose-500 active:text-white text-white font-bold text-sm border border-zinc-700 flex items-center justify-center shadow-2xl active:scale-95"
              >
                REM
              </button>
              <button
                onPointerDown={() => (inputsRef.current.up = true)}
                onPointerUp={() => (inputsRef.current.up = false)}
                onPointerCancel={() => (inputsRef.current.up = false)}
                className="w-14 h-14 rounded-2xl bg-cyan-500 active:bg-cyan-400 text-black font-black text-sm border border-cyan-400 flex items-center justify-center shadow-2xl active:scale-95"
              >
                GAS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAUSED OVERLAY ─── */}
      {gameState === "paused" && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-40 p-4">
          <div className="p-6 rounded-3xl border border-zinc-700 bg-zinc-900/95 text-center max-w-xs w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Game Paused</h2>
            <p className="text-xs text-zinc-400 mb-5">
              Lanjutkan balapan atau kembali ke garasi.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  startEngineSound(soundEnabledRef.current);
                  setGameState("racing");
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Resume
              </button>
              <button
                onClick={startRace}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Restart Race
              </button>
              <button
                onClick={() => {
                  clearCountdownTimeouts();
                  setGameState("select");
                }}
                className="w-full py-2.5 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Ganti Mobil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FINISHED PODIUM OVERLAY ─── */}
      {gameState === "finished" && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-40 p-4">
          <div className="p-6 rounded-3xl border border-cyan-500/40 bg-zinc-900/95 text-center max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-cyan-500/30">
              {playerRank === 1 ? "🏆" : playerRank === 2 ? "🥈" : "🥉"}
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              {playerRank === 1 ? "JUARA 1! 1ST PLACE!" : `FINISH DI POSISI ${playerRank}`}
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              {playerRank === 1
                ? "Luar biasa! Kamu mendominasi seluruh sirkuit 3D Usick Racing!"
                : "Balapan yang sengit! Coba lagi untuk merebut podium pertama."}
            </p>

            <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 mb-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Waktu:</span>
                <span className="font-bold text-white font-mono">
                  {formatTimeMs(totalRaceTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Lap Terakhir:</span>
                <span className="font-bold text-white font-mono">
                  {formatTimeMs(lastLapTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Best Lap:</span>
                <span className="font-bold text-cyan-400 font-mono">
                  {formatTimeMs(records.bestLapMs)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={startRace}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-black text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Race Again
              </button>
              <button
                onClick={() => {
                  clearCountdownTimeouts();
                  setGameState("select");
                }}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Pilih Mobil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsickRacing;
