"use client";

import React, { useState } from "react";

interface HowToPlayModalProps {
  onClose: () => void;
  isDark?: boolean;
}

export function HowToPlayModal({ onClose, isDark = true }: HowToPlayModalProps) {
  const [tab, setTab] = useState<"controls" | "survival">("controls");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-150">
      <div
        className={`relative w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isDark
            ? "bg-[#18181b]/95 border-zinc-700/80 text-zinc-100 shadow-black/80"
            : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-500/20">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Panduan Usick Survival</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-500/20 text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-2 border-b border-zinc-500/20">
          <button
            type="button"
            onClick={() => setTab("controls")}
            className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              tab === "controls"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kontrol (Desktop & Mobile)
          </button>
          <button
            type="button"
            onClick={() => setTab("survival")}
            className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              tab === "survival"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Cara Bertahan Hidup
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {tab === "controls" ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-zinc-200 mb-2 flex items-center gap-2">
                  <span>💻 Kontrol Desktop</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-zinc-300">
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Gerak</span>
                    <span className="font-mono font-bold text-emerald-400">W / A / S / D</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Lari Cepat (Sprint)</span>
                    <span className="font-mono font-bold text-emerald-400">Shift</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Lompat</span>
                    <span className="font-mono font-bold text-emerald-400">Spasi</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Putar Kamera</span>
                    <span className="font-mono font-bold text-emerald-400">Mouse</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Interaksi / Ambil</span>
                    <span className="font-mono font-bold text-emerald-400">E / F</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Serang / Tebang</span>
                    <span className="font-mono font-bold text-emerald-400">Klik Kiri</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Buka Tas</span>
                    <span className="font-mono font-bold text-emerald-400">I / Tab</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Menu Crafting</span>
                    <span className="font-mono font-bold text-emerald-400">C</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Menu Bangun</span>
                    <span className="font-mono font-bold text-emerald-400">B</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex justify-between items-center">
                    <span>Pilih Hotbar</span>
                    <span className="font-mono font-bold text-emerald-400">1 – 5</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-700/50">
                <h4 className="font-bold text-sm text-zinc-200 mb-2 flex items-center gap-2">
                  <span>📱 Kontrol Layar Sentuh (Mobile)</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-zinc-400">
                  <li><strong className="text-zinc-200">Virtual Joystick (Kiri bawah):</strong> Geser jari untuk bergerak ke segala arah.</li>
                  <li><strong className="text-zinc-200">Area Kamera (Kanan):</strong> Usap layar di sisi kanan untuk memutar kamera TPP.</li>
                  <li><strong className="text-zinc-200">Tombol Aksi:</strong> Tombol Serang/Tebang, Lompat, Lari, Interaksi, Tas, dan Crafting tersedia langsung di layar.</li>
                  <li><strong className="text-zinc-200">Orientasi Terbaik:</strong> Mainkan dalam mode horizontal (Landscape) untuk pengalaman terbaik.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 text-zinc-300">
              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
                <h4 className="font-bold text-emerald-400 mb-1">1. Mengumpulkan Sumber Daya</h4>
                <p className="text-zinc-400">
                  Cari ranting kayu jatuh dan batu kecil di tanah terlebih dahulu. Ambil serat (fiber) dan daun dari semak-semak. Petik buah beri merah untuk mengisi perut.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
                <h4 className="font-bold text-amber-400 mb-1">2. Membuat Alat & Menebang Pohon</h4>
                <p className="text-zinc-400">
                  Buka menu Crafting (C) dan buat <strong>Wooden Axe</strong>. Pegang kapak di hotbar, lalu dekati pohon besar untuk menebang kayu dalam jumlah banyak.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
                <h4 className="font-bold text-rose-400 mb-1">3. Makanan & Bertarung</h4>
                <p className="text-zinc-400">
                  Buat <strong>Wooden Spear</strong> untuk menghadapi babi hutan liar. Kalahkan babi hutan untuk mendapatkan daging. Buat <strong>Campfire</strong> untuk memasak daging agar mengembalikan banyak health dan rasa lapar!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
                <h4 className="font-bold text-blue-400 mb-1">4. Membangun Rumah & Shelter</h4>
                <p className="text-zinc-400">
                  Buka menu Bangun (B) untuk menempatkan lantai kayu, dinding, pintu, dan atap. Pasang Basic Workbench untuk membuka resep bangunan lanjutan.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
                <h4 className="font-bold text-purple-400 mb-1">5. Offline & Penyimpanan Otomatis</h4>
                <p className="text-zinc-400">
                  Game ini otomatis menyimpan progres ke IndexedDB browser Anda setiap 30 detik. Seluruh aset di-cache sehingga dapat dimainkan offline tanpa kuota internet!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-500/20 bg-zinc-500/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Mengerti & Main
          </button>
        </div>
      </div>
    </div>
  );
}

