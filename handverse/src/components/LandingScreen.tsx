import React from "react";

interface LandingScreenProps {
  onStart: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
  errorMessage?: string | null;
}

export function LandingScreen({
  onStart,
  isLoading = false,
  loadingMessage = "Memuat model AI...",
  errorMessage = null,
}: LandingScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-full w-full px-4 py-8 overflow-y-auto text-white select-none">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-gradient-to-tr from-cyan-600/20 via-violet-600/20 to-pink-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-2xl w-full text-center flex flex-col items-center">
        {/* Brand Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(0,242,254,0.15)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Real-Time 3D Hand Tracking</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            HAND
          </span>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
            VERSE
          </span>
        </h1>

        {/* Headline & Description */}
        <p className="text-xl sm:text-2xl font-semibold text-zinc-100 mb-3">
          Your Hands. A New Dimension.
        </p>
        <p className="text-sm sm:text-base text-zinc-400 max-w-lg mb-8 leading-relaxed">
          Kendalikan objek 3D holografik, pusaran partikel nebula, dan bola energi hanya menggunakan gerakan tangan dan kamera perangkat Anda secara real-time.
        </p>

        {/* Error message banner if camera permission failed */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-200 text-xs sm:text-sm max-w-md text-left flex items-start gap-3 animate-in fade-in duration-200">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="font-semibold mb-1">Akses Kamera Bermasalah</p>
              <p className="text-rose-300/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={isLoading}
          className={`group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 shadow-xl cursor-pointer ${
            isLoading
              ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-[0_0_30px_rgba(0,242,254,0.35)] hover:shadow-[0_0_40px_rgba(0,242,254,0.55)] hover:scale-105 active:scale-98"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>{loadingMessage}</span>
            </>
          ) : (
            <>
              <span className="text-xl">🚀</span>
              <span>Start Experiment</span>
              <svg
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs text-zinc-400">
          <span className="px-3 py-1 rounded-full bg-zinc-900/60 border border-white/5">
            ⚡ 100% On-Device AI
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-900/60 border border-white/5">
            🔒 Zero Server Upload
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-900/60 border border-white/5">
            🎯 Three.js + MediaPipe
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-900/60 border border-white/5">
            ✨ Free & No API Key
          </span>
        </div>

        {/* 3 Experiment Cards Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-10 w-full text-left">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-md hover:border-cyan-500/40 transition duration-200">
            <div className="text-2xl mb-2">✦</div>
            <h3 className="font-bold text-sm text-cyan-300 mb-1">Orb Control</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Kendalikan bola energi bercahaya yang melayang di atas telapak tangan dan berubah ukuran sesuai renggangan jari.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-md hover:border-violet-500/40 transition duration-200">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-bold text-sm text-violet-300 mb-1">Gesture Particles</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sebarkan ratusan partikel nebula dengan telapak tangan terbuka, dan padatkan kembali saat mengepalkan tangan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-md hover:border-pink-500/40 transition duration-200">
            <div className="text-2xl mb-2">💎</div>
            <h3 className="font-bold text-sm text-pink-300 mb-1">Hologram Object</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Manipulasi kristal holografik sci-fi, putar dengan sapuan tangan, dan gunakan gestur pinch untuk Grab Mode.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-[11px] text-zinc-500 mt-8 max-w-sm">
          Semua pemrosesan kamera dilakukan 100% lokal di GPU/CPU browser Anda. Tidak ada video atau gambar yang diunggah ke server.
        </p>
      </div>
    </div>
  );
}
