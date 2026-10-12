import React, { useEffect, useRef, useState, useCallback } from "react";
import { CameraManager, type FacingMode } from "./lib/camera";
import { HandTracker, type TrackerStatus } from "./lib/tracker";
import { ThreeScene, type ExperimentType } from "./three/ThreeScene";
import { drawHandSkeleton } from "./lib/handSkeleton";
import type { GestureType, GestureResult } from "./lib/gestureRecognizer";
import { StatusHUD } from "./components/StatusHUD";
import { ExperimentSelector } from "./components/ExperimentSelector";
import { ControlsToolbar } from "./components/ControlsToolbar";
import { LandingScreen } from "./components/LandingScreen";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  const cameraManagerRef = useRef<CameraManager | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const threeSceneRef = useRef<ThreeScene | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);

  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Memuat model...");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentType>("orb");

  const [fps, setFps] = useState(0);
  const [trackerStatus, setTrackerStatus] = useState<TrackerStatus>("uninitialized");
  const [delegate, setDelegate] = useState<"GPU" | "CPU">("GPU");
  const [handsCount, setHandsCount] = useState(0);
  const [currentGesture, setCurrentGesture] = useState<GestureType>("Unknown");

  useEffect(() => {
    cameraManagerRef.current = new CameraManager();
    trackerRef.current = new HandTracker();

    cameraManagerRef.current.checkMultipleCameras().then((hasMulti) => {
      setHasMultipleCameras(hasMulti);
    });

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      cameraManagerRef.current?.stop();
      trackerRef.current?.dispose();
      threeSceneRef.current?.dispose();
    };
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    if (skeletonCanvasRef.current) {
      skeletonCanvasRef.current.width = width;
      skeletonCanvasRef.current.height = height;
    }

    if (threeSceneRef.current) {
      threeSceneRef.current.resize(width, height);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const runLoop = useCallback(() => {
    const loop = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      if (!videoRef.current || !cameraManagerRef.current || !trackerRef.current || !threeSceneRef.current) {
        return;
      }

      const delta = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = now;
      const timeInSec = now / 1000;

      frameCountRef.current++;
      if (now - lastFpsUpdateRef.current >= 500) {
        const measuredFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
        setFps(measuredFps);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      // Detection
      const detection = trackerRef.current.detect(videoRef.current, now);

      let primaryGesture: GestureResult | null = null;
      const detectedCount = detection?.hands.length || 0;
      setHandsCount(detectedCount);

      if (detection && detection.gestures.length > 0) {
        primaryGesture = detection.primaryGesture;
        setCurrentGesture(primaryGesture?.gesture || "Unknown");
      } else {
        setCurrentGesture("Unknown");
      }

      // 2D Skeleton
      const skeletonCanvas = skeletonCanvasRef.current;
      if (skeletonCanvas) {
        const ctx = skeletonCanvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);

          if (showSkeleton && detection && detection.hands.length > 0) {
            const isMirrored = cameraManagerRef.current.isMirrored();
            for (let i = 0; i < detection.hands.length; i++) {
              drawHandSkeleton(
                ctx,
                detection.hands[i],
                skeletonCanvas.width,
                skeletonCanvas.height,
                isMirrored,
                i
              );
            }
          }
        }
      }

      // 3D Three.js
      threeSceneRef.current.render(delta, timeInSec, primaryGesture);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  }, [showSkeleton]);

  const handleStart = async () => {
    setIsLoading(true);
    setCameraError(null);

    try {
      setLoadingMessage("Menginisialisasi MediaPipe AI...");
      const tracker = trackerRef.current;
      if (!tracker) throw new Error("Tracker tidak tersedia.");

      const modelOk = await tracker.init((status) => {
        setTrackerStatus(status);
        if (status === "loading-wasm") setLoadingMessage("Memuat modul vision WASM...");
        if (status === "loading-model") setLoadingMessage("Mengunduh neural hand model...");
      });

      if (!modelOk) {
        throw new Error(tracker.getErrorMessage() || "Gagal memuat model MediaPipe.");
      }
      setDelegate(tracker.getDelegate());

      setLoadingMessage("Membuka akses kamera...");
      if (!videoRef.current || !cameraManagerRef.current) {
        throw new Error("Elemen video belum siap.");
      }

      const camResult = await cameraManagerRef.current.start(videoRef.current, facingMode);
      if (!camResult.ok) {
        throw new Error(camResult.error || "Gagal mengakses kamera.");
      }

      if (threeCanvasRef.current && !threeSceneRef.current) {
        threeSceneRef.current = new ThreeScene(threeCanvasRef.current);
        threeSceneRef.current.setExperiment(currentExperiment);
        threeSceneRef.current.setMirrored(cameraManagerRef.current.isMirrored());
      } else if (threeSceneRef.current) {
        threeSceneRef.current.setMirrored(cameraManagerRef.current.isMirrored());
      }

      handleResize();

      setIsStarted(true);
      setIsLoading(false);
      lastTimeRef.current = performance.now();
      lastFpsUpdateRef.current = performance.now();

      runLoop();
    } catch (err: unknown) {
      setIsLoading(false);
      setIsStarted(false);
      const msg = err instanceof Error ? err.message : "Gagal memulai kamera.";
      setCameraError(msg);
      cameraManagerRef.current?.stop();
    }
  };

  const handleStop = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    cameraManagerRef.current?.stop();
    setIsStarted(false);
    setHandsCount(0);
    setCurrentGesture("Unknown");
    setFps(0);
  };

  const handleSwitchCamera = async () => {
    if (!videoRef.current || !cameraManagerRef.current) return;
    const nextFacing: FacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);

    const result = await cameraManagerRef.current.switchCamera(videoRef.current);
    if (result.ok) {
      const isMirrored = cameraManagerRef.current.isMirrored();
      threeSceneRef.current?.setMirrored(isMirrored);
      handleResize();
    } else {
      setCameraError(result.error || "Gagal mengganti kamera.");
    }
  };

  const handleSelectExperiment = (type: ExperimentType) => {
    setCurrentExperiment(type);
    threeSceneRef.current?.setExperiment(type);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#07090e] text-white select-none"
    >
      {/* Top Floating App Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3 sm:p-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/70 border border-white/10 backdrop-blur-md text-xs font-semibold shadow-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-cyan-300 bg-clip-text text-transparent font-bold">
              HANDVERSE
            </span>
          </div>
        </div>
      </div>

      {/* Main View */}
      {!isStarted ? (
        <LandingScreen
          onStart={handleStart}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          errorMessage={cameraError}
        />
      ) : (
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* Layer 1: Camera Video */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover -z-10 ${
              facingMode === "user" ? "-scale-x-100" : ""
            }`}
          />

          {/* Layer 2: 2D Skeleton Canvas */}
          <canvas
            ref={skeletonCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Layer 3: Three.js Canvas */}
          <canvas
            ref={threeCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />

          {/* Layer 4: Status HUD */}
          <div className="absolute top-14 sm:top-16 inset-x-0 z-30">
            <StatusHUD
              fps={fps}
              cameraActive={isStarted}
              facingMode={facingMode}
              handsCount={handsCount}
              currentGesture={currentGesture}
              trackerStatus={trackerStatus}
              delegate={delegate}
            />
          </div>

          {/* Layer 5: Bottom Controls */}
          <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-30 flex flex-col items-center gap-3 px-3">
            <ExperimentSelector
              currentExperiment={currentExperiment}
              onChange={handleSelectExperiment}
            />

            <ControlsToolbar
              showSkeleton={showSkeleton}
              onToggleSkeleton={() => setShowSkeleton((prev) => !prev)}
              onSwitchCamera={handleSwitchCamera}
              onStopCamera={handleStop}
              hasMultipleCameras={hasMultipleCameras}
            />
          </div>
        </div>
      )}
    </div>
  );
}

