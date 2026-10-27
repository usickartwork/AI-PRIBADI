"use client";

import React from "react";

interface MaintenanceScreenProps {
  isDark?: boolean;
}

/**
 * Tampilan Pemeliharaan Sistem (Maintenance Mode)
 * Sesuai spesifikasi brief:
 * - TULISAN SAJA (tidak ada card, kotak, border, panel, ilustrasi, atau dekorasi tambahan).
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
      <div className="max-w-xl space-y-8">
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
        <div className="space-y-3 pt-2">
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
