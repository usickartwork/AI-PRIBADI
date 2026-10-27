"use client";

import React from "react";

interface UserHoldScreenProps {
  isDark?: boolean;
}

/**
 * Tampilan Pengguna yang Dikunci (User Hold)
 * Sesuai spesifikasi brief:
 * - TULISAN SAJA (tidak ada card, kotak, border, panel, ilustrasi, atau tombol tambahan).
 * - Dua bahasa sekaligus dalam satu halaman:
 *   1. Bahasa Indonesia di atas (teks normal)
 *   2. Bahasa Inggris di bawah (seluruh teks menggunakan huruf miring / italic)
 */
export function UserHoldScreen({ isDark = true }: UserHoldScreenProps) {
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
            Akun Dikunci
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isDark ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            Akses akun Anda untuk sementara dibatasi oleh developer.
          </p>
        </div>

        {/* Versi Bahasa Inggris (Bagian Bawah, Miring / Italic) */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight italic">
            Account Locked
          </h2>
          <p
            className={`text-sm sm:text-base leading-relaxed italic ${
              isDark ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            Your account access has been temporarily restricted by the developer.
          </p>
        </div>
      </div>
    </div>
  );
}
