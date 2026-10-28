"use client";

import React from "react";
import { BrainLogo } from "@/components/ui/brain-logo";

interface MaintenanceScreenProps {
  isDark?: boolean;
  title?: string | null;
  message?: string | null;
  estimatedEnd?: string | null;
}

/**
 * Tampilan Pemeliharaan Sistem (Global Maintenance Mode)
 * Sesuai spesifikasi brief & preferensi:
 * - TULISAN SAJA (tidak ada card, kotak, border, panel, atau dekorasi berlebihan).
 * - Ikon One Mind (Brain Logo) murni di bagian atas tanpa latar belakang kotakan.
 * - Posisi terpusat sempurna di tengah layar (vertikal & horizontal).
 * - Menampilkan judul dan deskripsi yang dapat dikustomisasi oleh admin.
 * - Menampilkan estimasi waktu selesai jika diatur oleh admin.
 */
export function MaintenanceScreen({
  isDark = true,
  title,
  message,
  estimatedEnd,
}: MaintenanceScreenProps) {
  const displayTitle = title?.trim() || "One Mind sedang dalam pemeliharaan";
  const displayMessage =
    message?.trim() ||
    "Kami sedang melakukan pemeliharaan sistem untuk meningkatkan layanan. Silakan coba kembali nanti.";

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 py-12 select-none text-center backdrop-blur-2xl sm:backdrop-blur-3xl ${
        isDark ? "bg-black/50 text-white" : "bg-white/60 text-zinc-900"
      }`}
    >
      <div className="max-w-xl flex flex-col items-center space-y-8 animate-in fade-in-0 duration-300">
        {/* Ikon One Mind Brain Logo Murni (Tanpa Kotakan) */}
        <BrainLogo
          className={`w-12 h-12 sm:w-14 sm:h-14 ${
            isDark ? "text-white" : "text-zinc-900"
          }`}
        />

        {/* Versi Bahasa Indonesia (Bagian Atas, Normal) */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {displayTitle}
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed max-w-lg mx-auto ${
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

        {/* Versi Bahasa Inggris (Bagian Bawah, Miring / Italic) */}
        <div className="space-y-3 pt-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight italic">
            One Mind is Under Maintenance
          </h2>
          <p
            className={`text-sm sm:text-base leading-relaxed italic max-w-lg mx-auto ${
              isDark ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            We are performing system maintenance to improve our service. Please try again later.
          </p>
        </div>
      </div>
    </div>
  );
}
