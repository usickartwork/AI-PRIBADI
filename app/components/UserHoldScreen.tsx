"use client";

import React from "react";
import { BrainLogo } from "@/components/ui/brain-logo";

interface UserHoldScreenProps {
  isDark?: boolean;
  reason?: string | null;
}

/**
 * Tampilan Pengguna yang Dikunci (User Hold)
 * Sesuai spesifikasi brief & permintaan pengguna:
 * - TULISAN SAJA (tidak ada card, kotak, border, panel, atau tombol tambahan).
 * - Ikon One Mind (Brain Logo) murni di bagian atas tanpa latar belakang kotakan.
 * - Posisi terpusat sempurna di tengah layar (vertikal & horizontal).
 * - Dua bahasa sekaligus dalam satu halaman:
 *   1. Bahasa Indonesia di atas (teks normal)
 *   2. Bahasa Inggris di bawah (seluruh teks menggunakan huruf miring / italic)
 * - Jika ada catatan dari developer, ditampilkan murni berupa teks di bagian bawah.
 */
export function UserHoldScreen({ isDark = true, reason }: UserHoldScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 py-12 select-none text-center backdrop-blur-2xl sm:backdrop-blur-3xl ${
        isDark ? "bg-black/50 text-white" : "bg-white/60 text-zinc-900"
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
        <div className="space-y-3 pt-1">
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

        {/* Catatan Tambahan Developer (Jika ada, murni tulisan saja) */}
        {reason && (
          <div className="space-y-1.5 pt-3">
            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isDark ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Catatan: {reason}
            </p>
            <p
              className={`text-xs sm:text-sm leading-relaxed italic ${
                isDark ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              Note: {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
