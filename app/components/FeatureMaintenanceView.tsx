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
}

/**
 * Overlay Pemeliharaan Fitur (Feature Maintenance Full Blur Overlay)
 * Sesuai arahan spesifik:
 * - Halaman fitur tetap tampil di bawahnya, tetapi diberikan efek full blur (backdrop-blur-2xl).
 * - Tidak menggunakan background hitam pekat (translucent backdrop blur).
 * - Pure cuma tulisan dan grafiknya (Brain Logo) saja.
 * - Tanpa kotakan, tanpa card, tanpa border, tanpa badge box, tanpa tombol berbingkai.
 * - Terpusat sempurna di tengah layar (vertikal & horizontal).
 */
export function FeatureMaintenanceView({
  isDark = true,
  featureName,
  title,
  message,
  estimatedEnd,
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
        </div>
      </div>
    </div>
  );
}
