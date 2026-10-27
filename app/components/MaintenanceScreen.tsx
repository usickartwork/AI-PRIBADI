"use client";

import React from "react";
import { BrainLogo } from "@/components/ui/brain-logo";

interface MaintenanceScreenProps {
  isDark?: boolean;
}

/**
 * Tampilan Pemeliharaan Sistem (Maintenance Mode)
 * Sesuai spesifikasi brief & permintaan pengguna:
 * - TULISAN SAJA (tidak ada card, kotak, border, panel, atau dekorasi tambahan).
 * - Ikon One Mind (Brain Logo) murni di bagian atas tanpa latar belakang kotakan.
 * - Posisi terpusat sempurna di tengah layar (vertikal & horizontal).
 * - Dua bahasa sekaligus dalam satu halaman:
 *   1. Bahasa Indonesia di atas (teks normal)
 *   2. Bahasa Inggris di bawah (seluruh teks menggunakan huruf miring / italic)
 */
export function MaintenanceScreen({ isDark = true }: MaintenanceScreenProps) {
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 select-none text-center ${
        isDark ? "bg-[#09090b] text-white" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      <div className="max-w-xl flex flex-col items-center space-y-8">
        {/* Ikon One Mind Brain Logo Murni (Tanpa Kotakan) */}
        <BrainLogo
          className={`w-12 h-12 sm:w-14 sm:h-14 ${
            isDark ? "text-white" : "text-zinc-900"
          }`}
        />

        {/* Versi Bahasa Indonesia (Bagian Atas, Normal) */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            One Mind sedang dalam pemeliharaan
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isDark ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            Kami sedang melakukan pemeliharaan sistem untuk meningkatkan layanan. Silakan coba kembali nanti.
          </p>
        </div>

        {/* Versi Bahasa Inggris (Bagian Bawah, Miring / Italic) */}
        <div className="space-y-3 pt-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight italic">
            One Mind is Under Maintenance
          </h2>
          <p
            className={`text-sm sm:text-base leading-relaxed italic ${
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
