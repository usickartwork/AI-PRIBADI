import React from "react";
import type { GestureType } from "../lib/gestureRecognizer";
import type { TrackerStatus } from "../lib/tracker";
import type { FacingMode } from "../lib/camera";

interface StatusHUDProps {
  fps: number;
  cameraActive: boolean;
  facingMode: FacingMode;
  handsCount: number;
  currentGesture: GestureType;
  trackerStatus: TrackerStatus;
  delegate: "GPU" | "CPU";
}

export function StatusHUD({
  fps,
  cameraActive,
  facingMode,
  handsCount,
  currentGesture,
  trackerStatus,
  delegate,
}: StatusHUDProps) {
  // Gesture icon/emoji helper
  const getGestureIcon = (g: GestureType) => {
    switch (g) {
      case "Open Palm":
        return "✋";
      case "Fist":
        return "✊";
      case "Pinch":
        return "🤏";
      case "Peace Sign":
        return "✌️";
      case "Pointing":
        return "☝️";
      default:
        return "🤚";
    }
  };

  // FPS color
  const fpsColor =
    fps >= 28 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
    fps >= 18 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
    "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4 text-xs select-none pointer-events-none">
      {/* Left side: System performance & camera status */}
      <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* FPS Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md shadow-sm font-mono text-[11px] font-semibold ${fpsColor}`}
          title="Real Frame Per Second"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          <span>{fps > 0 ? `${fps} FPS` : "Calculating..."}</span>
        </div>

        {/* Model & Delegate Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-zinc-900/70 text-zinc-300 backdrop-blur-md text-[11px]">
          <span className="text-zinc-500">AI:</span>
          <span className={trackerStatus === "ready" ? "text-cyan-400 font-medium" : "text-amber-400"}>
            {trackerStatus === "ready" ? `MediaPipe (${delegate})` : trackerStatus === "loading-model" ? "Memuat Model..." : "Inisialisasi..."}
          </span>
        </div>

        {/* Camera facing */}
        {cameraActive && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-zinc-900/70 text-zinc-300 backdrop-blur-md text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Kamera: {facingMode === "user" ? "Depan" : "Belakang"}</span>
          </div>
        )}
      </div>

      {/* Right side: Hand tracking & Gesture info */}
      <div className="flex items-center gap-2 pointer-events-auto ml-auto">
        {/* Hands Count Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md text-[11px] font-medium ${
            handsCount > 0
              ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-200"
              : "border-zinc-700/50 bg-zinc-900/60 text-zinc-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              handsCount > 0 ? "bg-cyan-400 shadow-[0_0_8px_#00f2fe]" : "bg-zinc-600"
            }`}
          />
          <span>{handsCount > 0 ? `${handsCount} Tangan Terdeteksi` : "Arahkan Tangan ke Kamera"}</span>
        </div>

        {/* Current Gesture Badge */}
        {handsCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/40 bg-violet-950/50 text-violet-200 backdrop-blur-md text-[11px] font-semibold animate-in fade-in zoom-in-95 duration-200">
            <span className="text-sm">{getGestureIcon(currentGesture)}</span>
            <span>{currentGesture}</span>
          </div>
        )}
      </div>
    </div>
  );
}
