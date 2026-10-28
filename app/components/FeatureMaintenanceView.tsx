"use client";

import React from "react";
import { BrainLogo } from "@/components/ui/brain-logo";

interface FeatureMaintenanceViewProps {
  isDark?: boolean;
  featureName: string;
  title?: string | null;
  message?: string | null;
  estimatedEnd?: string | null;
  onBack?: () => void;
  onTogglePanel?: () => void;
}

/**
 * Overlay Pemeliharaan Fitur (Feature Maintenance Full Blur Overlay)
 * Sesuai arahan spesifik:
 * - Halaman fitur tetap tampil di bawahnya, tetapi diberikan efek full blur (backdrop-blur-2xl).
 * - Tidak menggunakan background hitam pekat (translucent backdrop blur).
 * - Pure cuma tulisan dan grafiknya (Brain Logo) saja.
 * - Tanpa kotakan, tanpa card, tanpa border, tanpa badge box, tanpa tombol berbingkai.
 * - Terpusat sempurna di tengah layar (vertikal & horizontal).
 * - Dilengkapi tombol navigasi (menu sidebar / kembali) agar pengguna tidak terjebak di layar mobile.
 */
export function FeatureMaintenanceView({
  isDark = true,
  featureName,
  title,
  message,
  estimatedEnd,
  onBack,
  onTogglePanel,
}: FeatureMaintenanceViewProps) {
  const displayTitle = title?.trim() || `${featureName} sedang dalam pemeliharaan`;
  const displayMessage =
    message?.trim() ||
    `Kami sedang melakukan pemeliharaan pada layanan ${featureName}. Fitur lainnya tetap dapat Anda gunakan.`;

  let formattedEstimatedEnd: string | null = null;
  if (estimatedEnd) {
    try {
      const d = new Date(estimatedEnd);
      if (!isNaN(d.getTime())) {
        formattedEstimatedEnd = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });
      }
    } catch {
      formattedEstimatedEnd = null;
    }
  }

  return (
    <div
      className={`absolute inset-0 z-40 flex flex-col items-center justify-center px-6 py-12 select-none text-center pointer-events-auto backdrop-blur-2xl sm:backdrop-blur-3xl transition-all duration-300 ${
        isDark ? "bg-black/40 text-white" : "bg-white/45 text-zinc-900"
      }`}
    >
      {/* Tombol aksi navigasi di sudut kiri atas (Back & Hamburger) */}
      {(onTogglePanel || onBack) && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 pointer-events-auto">
          {onTogglePanel && (
            <button
              type="button"
              onClick={onTogglePanel}
              aria-label="Buka menu panel"
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                  : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali ke chat"
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                  : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="max-w-xl flex flex-col items-center justify-center space-y-6 animate-in fade-in-0 duration-300">
        {/* Ikon One Mind (Brain Logo) murni tanpa kotakan */}
        <BrainLogo
          className={`w-12 h-12 sm:w-14 sm:h-14 ${
            isDark ? "text-white" : "text-zinc-900"
          }`}
        />

        {/* Teks Judul & Deskripsi Murni Tanpa Kotakan / Border */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {displayTitle}
          </h2>

          <p
            className={`text-sm sm:text-base leading-relaxed max-w-md mx-auto ${
              isDark ? "text-zinc-300" : "text-zinc-700"
            }`}
          >
            {displayMessage}
          </p>

          {formattedEstimatedEnd && (
            <p
              className={`text-xs font-mono pt-1 tracking-wide ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Perkiraan Selesai: {formattedEstimatedEnd}
            </p>
          )}

          {onBack && (
            <div className="pt-3">
              <button
                type="button"
                onClick={onBack}
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium transition cursor-pointer opacity-80 hover:opacity-100 ${
                  isDark ? "text-zinc-300 hover:text-white" : "text-zinc-700 hover:text-black"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali ke Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
