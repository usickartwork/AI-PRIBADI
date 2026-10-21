"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  loadNeonRecords,
  saveNeonRecords,
  formatTimeMs,
  NeonDriftRecords,
} from "../common/gameStorage";
import {
  startEngineSound,
  updateEnginePitch,
  stopEngineSound,
  startDriftSound,
  stopDriftSound,
  playCountdownBeep,
  playLapFanfare,
} from "./neonAudio";

interface NeonDriftProps {
  isDark: boolean;
  onBackToHub: () => void;
}

// Koordinat sirkuit neon (logical track width: 1200, height: 750)
const TRACK_POINTS = [
  { x: 250, y: 620 },
  { x: 550, y: 620 },
  { x: 800, y: 620 },
  { x: 1020, y: 550 },
  { x: 1080, y: 400 },
  { x: 1020, y: 250 },
  { x: 850, y: 180 },
  { x: 700, y: 250 },
  { x: 600, y: 380 },
  { x: 480, y: 400 },
  { x: 420, y: 280 },
  { x: 350, y: 160 },
  { x: 180, y: 180 },
  { x: 120, y: 340 },
  { x: 140, y: 520 },
];

const TRACK_WIDTH = 120; // Lebar aspal

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

export const NeonDrift: React.FC<NeonDriftProps> = ({ isDark, onBackToHub }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [records, setRecords] = useState<NeonDriftRecords>(loadNeonRecords);
  const [gameState, setGameState] = useState<"countdown" | "racing" | "paused" | "finished">("countdown");
  const [countdownNum, setCountdownNum] = useState<string>("3");
  const [currentLap, setCurrentLap] = useState<number>(1);
  const TOTAL_LAPS = 3;
  const [currentLapTime, setCurrentLapTime] = useState<number>(0);
  const [lastLapTime, setLastLapTime] = useState<number | null>(null);
  const [totalRaceTime, setTotalRaceTime] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => records.soundEnabled);

  // References for live game loop to avoid re-renders
  const inputsRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
  });

  const carRef = useRef({
    x: 250,
    y: 620,
    angle: 0, // facing right
    speed: 0,
    vx: 0,
    vy: 0,
    angularVelocity: 0,
    isDrifting: false,
  });

  const checkpointsPassedRef = useRef<Set<number>>(new Set([0]));
  const lapStartTimeRef = useRef<number>(0);
  const raceStartTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const skidmarksRef = useRef<SkidMark[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const soundEnabledRef = useRef<boolean>(records.soundEnabled);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const nextVal = !prev;
      soundEnabledRef.current = nextVal;
      setRecords((r) => {
        const updated = { ...r, soundEnabled: nextVal };
        saveNeonRecords(updated);
        return updated;
      });
      return nextVal;
    });
  }, []);

  // Restart / Inisialisasi Balapan
  const initRace = useCallback(() => {
    carRef.current = {
      x: 240,
      y: 620,
      angle: 0,
      speed: 0,
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      isDrifting: false,
    };
    checkpointsPassedRef.current = new Set([0]);
    particlesRef.current = [];
    skidmarksRef.current = [];
    setCurrentLap(1);
    setCurrentLapTime(0);
    setLastLapTime(null);
    setTotalRaceTime(0);
    setGameState("countdown");
    setCountdownNum("3");

    playCountdownBeep(false, soundEnabledRef.current);

    setTimeout(() => {
      setCountdownNum("2");
      playCountdownBeep(false, soundEnabledRef.current);
      setTimeout(() => {
        setCountdownNum("1");
        playCountdownBeep(false, soundEnabledRef.current);
        setTimeout(() => {
          setCountdownNum("GO!");
          playCountdownBeep(true, soundEnabledRef.current);
          startEngineSound(soundEnabledRef.current);
          setGameState("racing");
          const now = performance.now();
          lapStartTimeRef.current = now;
          raceStartTimeRef.current = now;
          setTimeout(() => setCountdownNum(""), 700);
        }, 1000);
      }, 1000);
    }, 1000);
  }, []);

  // Inisialisasi awal saat mount & cleanup saat unmount
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      initRace();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stopEngineSound();
      stopDriftSound();
    };
  }, [initRace]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) inputsRef.current.up = true;
      if (["ArrowDown", "KeyS"].includes(e.code)) inputsRef.current.down = true;
      if (["ArrowLeft", "KeyA"].includes(e.code)) inputsRef.current.left = true;
      if (["ArrowRight", "KeyD"].includes(e.code)) inputsRef.current.right = true;
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
      if (["ArrowDown", "KeyS"].includes(e.code)) inputsRef.current.down = false;
      if (["ArrowLeft", "KeyA"].includes(e.code)) inputsRef.current.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code)) inputsRef.current.right = false;
      if (e.code === "Space") inputsRef.current.drift = false;
    };

    const handleBlur = () => {
      inputsRef.current = { up: false, down: false, left: false, right: false, drift: false };
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

  // Jarak titik terdekat dari centerline track
  const getDistanceFromTrackCenterline = (px: number, py: number) => {
    let minDist = Infinity;
    for (let i = 0; i < TRACK_POINTS.length; i++) {
      const p1 = TRACK_POINTS[i];
      const p2 = TRACK_POINTS[(i + 1) % TRACK_POINTS.length];

      // Project point onto segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const dist = Math.hypot(px - projX, py - projY);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  };

  // Main Game Loop (Canvas 60fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const car = carRef.current;
      const inputs = inputsRef.current;

      // Update timer jika sedang balapan
      if (gameState === "racing") {
        const lapElapsed = now - lapStartTimeRef.current;
        setCurrentLapTime(lapElapsed);

        // --- FISIKA MOBIL ---
        const ACCEL = 9.5;
        const BRAKE = 14.0;
        const MAX_SPEED = 8.5;
        const TURN_SPEED = 3.2;
        const DRAG = 0.982;

        // Akselerasi & Rem
        if (inputs.up) {
          car.speed += ACCEL * dt;
          if (car.speed > MAX_SPEED) car.speed = MAX_SPEED;
        } else if (inputs.down) {
          car.speed -= BRAKE * dt;
          if (car.speed < -MAX_SPEED * 0.4) car.speed = -MAX_SPEED * 0.4;
        } else {
          car.speed *= Math.pow(DRAG, dt * 60);
          if (Math.abs(car.speed) < 0.05) car.speed = 0;
        }

        // Kemudi
        if (Math.abs(car.speed) > 0.2) {
          const dir = car.speed > 0 ? 1 : -1;
          if (inputs.left) car.angle -= TURN_SPEED * dt * dir;
          if (inputs.right) car.angle += TURN_SPEED * dt * dir;
        }

        // Drift mechanics
        const isHandbrake = inputs.drift;
        const isHardTurn = (inputs.left || inputs.right) && Math.abs(car.speed) > 4.5;
        car.isDrifting = isHandbrake || isHardTurn;

        if (car.isDrifting) {
          startDriftSound(soundEnabledRef.current);
        } else {
          stopDriftSound();
        }

        // Hitung vektor arah hadap dan inersia
        const forwardX = Math.cos(car.angle);
        const forwardY = Math.sin(car.angle);

        // Grip / Lateral Friction
        const grip = car.isDrifting ? 0.91 : 0.96;
        car.vx = car.vx * grip + forwardX * car.speed * (1 - grip);
        car.vy = car.vy * grip + forwardY * car.speed * (1 - grip);

        // Update posisi
        const prevX = car.x;
        const prevY = car.y;
        car.x += car.vx;
        car.y += car.vy;

        // Collision dengan tepi lintasan (Off-track penalty)
        const distFromCenter = getDistanceFromTrackCenterline(car.x, car.y);
        const maxAllowedDist = TRACK_WIDTH / 2;

        if (distFromCenter > maxAllowedDist) {
          // Off track: gesekan keras & perlambatan
          car.speed *= 0.88;
          car.vx *= 0.88;
          car.vy *= 0.88;

          // Partikel percikan tabrakan
          for (let i = 0; i < 2; i++) {
            particlesRef.current.push({
              x: car.x,
              y: car.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              alpha: 0.9,
              color: "#f43f5e",
              size: 2.5,
            });
          }
        }

        // Skid marks & drift smoke
        if (car.isDrifting && Math.abs(car.speed) > 2.5) {
          skidmarksRef.current.push({
            x1: prevX,
            y1: prevY,
            x2: car.x,
            y2: car.y,
            alpha: 0.6,
          });
          if (skidmarksRef.current.length > 250) skidmarksRef.current.shift();

          // Partikel asap drift neon
          particlesRef.current.push({
            x: car.x - forwardX * 12 + (Math.random() - 0.5) * 8,
            y: car.y - forwardY * 12 + (Math.random() - 0.5) * 8,
            vx: -car.vx * 0.2 + (Math.random() - 0.5) * 1.5,
            vy: -car.vy * 0.2 + (Math.random() - 0.5) * 1.5,
            alpha: 0.7,
            color: "#06b6d4",
            size: 3 + Math.random() * 3,
          });
        }

        // Update Audio Pitch
        updateEnginePitch(Math.abs(car.speed) / MAX_SPEED, soundEnabledRef.current);

        // --- CHECKPOINTS & LAP SYSTEM ---
        TRACK_POINTS.forEach((pt, idx) => {
          const d = Math.hypot(car.x - pt.x, car.y - pt.y);
          if (d < TRACK_WIDTH * 0.7) {
            checkpointsPassedRef.current.add(idx);
          }
        });

        // Cek garis Start / Finish (Point 0, x: 250, y: 620)
        const distToStartFinish = Math.hypot(car.x - TRACK_POINTS[0].x, car.y - TRACK_POINTS[0].y);
        const hasPassedMostTrack = checkpointsPassedRef.current.size >= TRACK_POINTS.length * 0.75;

        if (distToStartFinish < 50 && hasPassedMostTrack) {
          // Lap Selesai!
          const lapTime = now - lapStartTimeRef.current;
          setLastLapTime(lapTime);
          playLapFanfare(soundEnabledRef.current);

          // Simpan ke storage jika lebih baik
          setRecords((prev) => {
            const isNewBest = prev.bestLapMs === null || lapTime < prev.bestLapMs;
            const updated: NeonDriftRecords = {
              ...prev,
              bestLapMs: isNewBest ? lapTime : prev.bestLapMs,
              totalLapsCompleted: prev.totalLapsCompleted + 1,
            };
            saveNeonRecords(updated);
            return updated;
          });

          // Reset checkpoint untuk lap berikutnya
          checkpointsPassedRef.current = new Set([0]);
          lapStartTimeRef.current = now;

          if (currentLap >= TOTAL_LAPS) {
            // Selesai Balapan!
            const finalRace = now - raceStartTimeRef.current;
            setTotalRaceTime(finalRace);
            setGameState("finished");
            stopEngineSound();
            stopDriftSound();

            setRecords((prev) => {
              const updated = {
                ...prev,
                totalRacesFinished: prev.totalRacesFinished + 1,
              };
              saveNeonRecords(updated);
              return updated;
            });
          } else {
            setCurrentLap((prev) => prev + 1);
          }
        }
      }

      // --- RENDERING CANVAS ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Skala responsif logical 1200x750 ke canvas actual
      const scaleX = canvas.width / 1200;
      const scaleY = canvas.height / 750;
      ctx.save();
      ctx.scale(scaleX, scaleY);

      // Background Cyber Asphalt
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(0, 0, 1200, 750);

      // Subtle Grid Pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 750);
        ctx.stroke();
      }
      for (let y = 0; y < 750; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // Gambar Jalur Aspal Track
      ctx.beginPath();
      TRACK_POINTS.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();

      // Aspal gelap
      ctx.lineWidth = TRACK_WIDTH;
      ctx.strokeStyle = "#16161a";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Outer Neon Glow Border
      ctx.save();
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Inner Neon Glow Line
      ctx.save();
      ctx.shadowColor = "#ec4899";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Garis Tengah Putus-Putus (Centerline)
      ctx.save();
      ctx.setLineDash([16, 20]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Garis Start / Finish
      ctx.save();
      const sf = TRACK_POINTS[0];
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(sf.x - 4, sf.y - TRACK_WIDTH / 2, 8, TRACK_WIDTH);
      ctx.fillStyle = "#000000";
      for (let i = 0; i < TRACK_WIDTH; i += 16) {
        ctx.fillRect(sf.x - 4, sf.y - TRACK_WIDTH / 2 + i, 8, 8);
      }
      ctx.restore();

      // Gambar Skid Marks
      skidmarksRef.current.forEach((sm) => {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 0, 0, ${sm.alpha})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sm.x1, sm.y1);
        ctx.lineTo(sm.x2, sm.y2);
        ctx.stroke();
        ctx.restore();
      });

      // Gambar Partikel Asap
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Gambar Mobil Pemain
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Lampu depan (Headlights cone beam)
      const grad = ctx.createRadialGradient(25, 0, 5, 85, 0, 80);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
      grad.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(15, -6);
      ctx.lineTo(85, -35);
      ctx.lineTo(85, 35);
      ctx.lineTo(15, 6);
      ctx.closePath();
      ctx.fill();

      // Bodi Mobil (Neon Supercar Siluet)
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = car.isDrifting ? 18 : 8;

      // Chassis
      ctx.fillStyle = "#18181b";
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-16, -9, 32, 18, 4);
      ctx.fill();
      ctx.stroke();

      // Windshield & Atap
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.roundRect(-6, -6, 16, 12, 2);
      ctx.fill();

      // Lampu Belakang (Taillights glow)
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 10;
      ctx.fillRect(-17, -8, 2, 4);
      ctx.fillRect(-17, 4, 2, 4);

      ctx.restore();
      ctx.restore(); // Restore scale

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, currentLap, soundEnabled]);

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden select-none ${isDark ? "bg-[#121215] text-zinc-100" : "bg-[#fafafc] text-zinc-900"}`}>
      {/* Top Header Bar */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl ${isDark ? "bg-[#121215]/80 border-white/10" : "bg-white/80 border-black/10"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              stopEngineSound();
              stopDriftSound();
              onBackToHub();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition border ${
              isDark ? "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700/60" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Game Hub</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">Neon Drift</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isDark ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-cyan-50 text-cyan-700 border border-cyan-200"}`}>
                Offline
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Master the neon track • Pure Canvas 2D Physics</p>
          </div>
        </div>

        {/* Live HUD Quick Stats */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden sm:block">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Best Lap</span>
              <span className="font-bold text-cyan-400">{formatTimeMs(records.bestLapMs)}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Lap</span>
              <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                {currentLap}/{TOTAL_LAPS}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Time</span>
              <span className="font-bold text-amber-400">{formatTimeMs(currentLapTime)}</span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Mute Suara" : "Nyalakan Suara"}
            className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
              isDark ? "bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700"
            }`}
          >
            {soundEnabled ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Restart Button */}
          <button
            onClick={initRace}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs ${
              isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>

      {/* Canvas Game Area */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={750}
          className="w-full h-full max-w-5xl max-h-[720px] object-contain rounded-2xl border border-zinc-800/80 shadow-2xl bg-[#09090b]"
        />

        {/* Countdown Overlay */}
        {countdownNum && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-7xl sm:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-500 drop-shadow-[0_0_35px_rgba(6,182,212,0.8)] animate-pulse">
              {countdownNum}
            </span>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === "paused" && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center z-20">
            <div className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/95 text-center max-w-xs w-full shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Game Paused</h2>
              <p className="text-xs text-zinc-400 mb-4">Tekan Resume untuk melanjutkan balapan.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    startEngineSound(soundEnabledRef.current);
                    setGameState("racing");
                  }}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Resume
                </button>
                <button
                  onClick={initRace}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Restart Race
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finished Overlay */}
        {gameState === "finished" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center z-20 p-4">
            <div className="p-6 rounded-3xl border border-cyan-500/40 bg-zinc-900/95 text-center max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-2xl">
                🏁
              </div>
              <h2 className="text-xl font-bold text-white mb-1">RACE FINISHED!</h2>
              <p className="text-xs text-zinc-400 mb-4">Luar biasa! Kamu telah menyelesaikan 3 lap penuh.</p>

              <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Waktu:</span>
                  <span className="font-bold text-white font-mono">{formatTimeMs(totalRaceTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Lap Terakhir:</span>
                  <span className="font-bold text-white font-mono">{formatTimeMs(lastLapTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Best Lap:</span>
                  <span className="font-bold text-cyan-400 font-mono">{formatTimeMs(records.bestLapMs)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={initRace}
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  Balap Lagi
                </button>
                <button
                  onClick={onBackToHub}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Game Hub
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar for Mobile & Keyboard Hints */}
      <div className={`p-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? "bg-[#121215] border-white/10" : "bg-white border-black/10"}`}>
        {/* Desktop Keyboard Hints */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">W</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">S</kbd>
            <span>Gas / Rem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">A</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">D</kbd>
            <span>Kemudi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">SPACE</kbd>
            <span>Handbrake Drift</span>
          </div>
        </div>

        {/* Mobile On-Screen Touch Controls */}
        <div className="flex sm:hidden w-full items-center justify-between px-2 pt-1 pb-2">
          {/* Steering Left/Right Buttons */}
          <div className="flex gap-2">
            <button
              onPointerDown={() => (inputsRef.current.left = true)}
              onPointerUp={() => (inputsRef.current.left = false)}
              onPointerCancel={() => (inputsRef.current.left = false)}
              className="w-14 h-14 rounded-2xl bg-zinc-800/90 active:bg-cyan-500 active:text-black text-white font-bold text-lg border border-zinc-700 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              ◀
            </button>
            <button
              onPointerDown={() => (inputsRef.current.right = true)}
              onPointerUp={() => (inputsRef.current.right = false)}
              onPointerCancel={() => (inputsRef.current.right = false)}
              className="w-14 h-14 rounded-2xl bg-zinc-800/90 active:bg-cyan-500 active:text-black text-white font-bold text-lg border border-zinc-700 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              ▶
            </button>
          </div>

          {/* Handbrake / Drift Button */}
          <button
            onPointerDown={() => (inputsRef.current.drift = true)}
            onPointerUp={() => (inputsRef.current.drift = false)}
            onPointerCancel={() => (inputsRef.current.drift = false)}
            className="w-12 h-12 rounded-xl bg-purple-500/20 active:bg-purple-500 border border-purple-500/40 text-purple-300 active:text-white font-bold text-xs flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            DRIFT
          </button>

          {/* Gas & Brake Buttons */}
          <div className="flex gap-2">
            <button
              onPointerDown={() => (inputsRef.current.down = true)}
              onPointerUp={() => (inputsRef.current.down = false)}
              onPointerCancel={() => (inputsRef.current.down = false)}
              className="w-14 h-14 rounded-2xl bg-zinc-800/90 active:bg-rose-500 active:text-white text-white font-bold text-sm border border-zinc-700 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              REM
            </button>
            <button
              onPointerDown={() => (inputsRef.current.up = true)}
              onPointerUp={() => (inputsRef.current.up = false)}
              onPointerCancel={() => (inputsRef.current.up = false)}
              className="w-14 h-14 rounded-2xl bg-cyan-500/90 active:bg-cyan-400 text-black font-black text-sm border border-cyan-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              GAS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeonDrift;
