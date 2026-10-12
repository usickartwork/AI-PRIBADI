import React from "react";

interface ControlsToolbarProps {
  showSkeleton: boolean;
  onToggleSkeleton: () => void;
  onSwitchCamera: () => void;
  onStopCamera: () => void;
  hasMultipleCameras?: boolean;
}

export function ControlsToolbar({
  showSkeleton,
  onToggleSkeleton,
  onSwitchCamera,
  onStopCamera,
  hasMultipleCameras = true,
}: ControlsToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl shadow-2xl">
      {/* Toggle Skeleton */}
      <button
        onClick={onToggleSkeleton}
        title={showSkeleton ? "Sembunyikan Garis Tangan" : "Tampilkan Garis Tangan"}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
          showSkeleton
            ? "bg-white/10 text-cyan-300 border border-cyan-500/30"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {showSkeleton ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
            />
          )}
        </svg>
        <span className="hidden sm:inline">Skeleton</span>
      </button>

      {/* Switch Camera */}
      {hasMultipleCameras && (
        <button
          onClick={onSwitchCamera}
          title="Ganti Kamera Depan / Belakang"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Flip Kamera</span>
        </button>
      )}

      {/* Stop / Exit */}
      <button
        onClick={onStopCamera}
        title="Hentikan Kamera"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span>Stop</span>
      </button>
    </div>
  );
}
