"use client";

import React, { useState } from "react";
import { BuilderStage } from "./types";

interface RevisionBarProps {
  currentStage: BuilderStage;
  onSubmitRevision: (instruction: string) => void;
  isDark?: boolean;
}

const STAGE_SUGGESTIONS: Record<BuilderStage, string[]> = {
  idea: [
    "Fokus pada bisnis B2B SaaS dengan langganan bulanan",
    "Tambahkan integrasi booking WhatsApp instan",
    "Target audiens untuk profesional urban di kota besar",
  ],
  prd: [
    "Perjelas kriteria penerimaan untuk alur pembayaran",
    "Tambahkan persyaratan non-fungsional untuk latensi < 100ms",
    "Sertakan matriks peran user admin vs pelanggan",
  ],
  design: [
    "Ubah gaya visual menjadi warm editorial dengan font Serif",
    "Ganti aksen warna menjadi emerald minimalis",
    "Gunakan sudut kartu lebih bulat (rounded-3xl)",
    "Buat tata letak hero lebih asimetris dan modern",
  ],
  prototype: [
    "Tambahkan filter kategori pencarian instan",
    "Perbaiki kalkulasi harga total agar responsif seketika",
    "Tingkatkan kontras teks pada kartu layanan",
    "Tambahkan dialog konfirmasi dengan kode booking unik",
  ],
  build: [
    "Tambahkan endpoint mock API untuk filter data",
    "Gunakan TypeScript strict interfaces untuk seluruh entitas",
    "Optimalkan metadata SEO di layout.tsx",
  ],
  test: [
    "Jalankan ulang pengujian DevSecOps dan isolasi rahasia",
    "Periksa kepatuhan aksesibilitas warna dan kontras",
  ],
  preview: [
    "Tingkatkan kecepatan interaksi tab di mobile",
    "Buat navigasi sticky dengan efek glassmorphism",
  ],
};

export function RevisionBar({
  currentStage,
  onSubmitRevision,
  isDark = true,
}: RevisionBarProps) {
  const [instruction, setInstruction] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const suggestions = STAGE_SUGGESTIONS[currentStage] || STAGE_SUGGESTIONS.design;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    onSubmitRevision(instruction.trim());
    setInstruction("");
  };

  const handleSelectSuggestion = (s: string) => {
    onSubmitRevision(s);
  };

  return (
    <div className={`p-4 rounded-3xl border transition-all duration-200 ${
      isDark ? "bg-[#101117] border-white/10" : "bg-white border-zinc-200 shadow-sm"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs">✨</span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Revisi &amp; AI Copilot ({currentStage.toUpperCase()})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] text-zinc-400 hover:text-white transition"
        >
          {isExpanded ? "Sembunyikan Ide" : "Lihat Contoh Revisi"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={`Minta revisi spesifik untuk tahap ${currentStage} (contoh: ${suggestions[0]})...`}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/30 transition"
        />
        <button
          type="submit"
          disabled={!instruction.trim()}
          className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          Terapkan Revisi
        </button>
      </form>

      {isExpanded && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5 mt-3 animate-in fade-in-50 duration-150">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(s)}
              className="px-3 py-1.5 rounded-xl text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer text-left"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
