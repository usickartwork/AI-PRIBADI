"use client";

import React, { useState } from "react";
import { IdeaBrief, TargetPlatform } from "./types";

interface IdeaStageProps {
  isDark: boolean;
  ideaBrief: IdeaBrief;
  onUpdateIdeaBrief: (brief: IdeaBrief) => void;
  onContinueToPrd: (brief: IdeaBrief) => void;
  isGeneratingPrd?: boolean;
}

const EXAMPLE_IDEAS = [
  {
    title: "Aplikasi Booking Lapangan",
    desc: "Sistem reservasi jadwal lapangan olahraga dengan pemilihan slot jam, ketersediaan real-time, dan konfirmasi booking.",
    platform: "both" as TargetPlatform,
    audience: "Pemain olahraga, pengelola lapangan, komunitas",
    goals: "Otomasi jadwal booking tanpa antri manual via chat",
  },
  {
    title: "Katalog E-Commerce Minimalis",
    desc: "Toko online modern dengan filter kategori produk, keranjang belanja interaktif, drawer checkout, dan ulasan pembeli.",
    platform: "website" as TargetPlatform,
    audience: "Pelanggan online dan pemilik brand ritel",
    goals: "Pengalaman belanja cepat dan responsif di mobile & desktop",
  },
  {
    title: "SaaS Manajemen Tugas Tim",
    desc: "Aplikasi produktivitas berbasis Kanban board dengan status tugas, filter prioritas, pelacakan deadline, dan detail task.",
    platform: "website" as TargetPlatform,
    audience: "Tim kerja, pengembang perangkat lunak, manajer proyek",
    goals: "Transparansi alur kerja dan eksekusi proyek tepat waktu",
  },
  {
    title: "Platform Kursus & Belajar Online",
    desc: "LMS modern untuk materi video kursus bertahap, kuis interaktif, status progres belajar, dan sertifikat kelulusan.",
    platform: "both" as TargetPlatform,
    audience: "Instruktur kursus dan peserta belajar mandiri",
    goals: "Penyampaian materi terstruktur dengan pelacakan progres mandiri",
  },
];

export function IdeaStage({
  isDark,
  ideaBrief,
  onUpdateIdeaBrief,
  onContinueToPrd,
  isGeneratingPrd = false,
}: IdeaStageProps) {
  const [ideaText, setIdeaText] = useState(ideaBrief.idea || "");
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>(
    ideaBrief.targetPlatform || "website"
  );
  const [targetAudience, setTargetAudience] = useState(ideaBrief.targetAudience || "");
  const [goals, setGoals] = useState(ideaBrief.goals || "");
  const [designPreferences, setDesignPreferences] = useState(
    ideaBrief.designPreferences || ""
  );
  const [showOptionalFields, setShowOptionalFields] = useState(
    Boolean(targetAudience || goals || designPreferences)
  );

  const handleSelectExample = (ex: typeof EXAMPLE_IDEAS[0]) => {
    setIdeaText(ex.desc);
    setTargetPlatform(ex.platform);
    setTargetAudience(ex.audience);
    setGoals(ex.goals);
    setShowOptionalFields(true);
    onUpdateIdeaBrief({
      idea: ex.desc,
      targetPlatform: ex.platform,
      targetAudience: ex.audience,
      goals: ex.goals,
      designPreferences,
    });
  };

  const handleSaveAndContinue = () => {
    const trimmed = ideaText.trim();
    if (!trimmed) return;
    const updated: IdeaBrief = {
      idea: trimmed,
      targetPlatform,
      targetAudience: targetAudience.trim() || undefined,
      goals: goals.trim() || undefined,
      designPreferences: designPreferences.trim() || undefined,
      clarifications: ideaBrief.clarifications,
      refinedSummary: ideaBrief.refinedSummary,
    };
    onUpdateIdeaBrief(updated);
    onContinueToPrd(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md font-mono select-none">
          <span className="w-2 h-2 rounded-full bg-zinc-400" />
          <span>Tahap 1: Idea Refinement</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Apa produk yang ingin Anda bangun?
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Tuliskan ide aplikasi atau website Anda dalam bahasa sehari-hari. AI akan menyusun
          spesifikasi kebutuhan produk (PRD), rancangan antarmuka, dan alur kerjanya.
        </p>
      </div>

      {/* ── Main Input Card ────────────────────────────────────── */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-5 ${
          isDark
            ? "bg-[#141418] border-white/10 text-white shadow-xl"
            : "bg-white border-black/10 text-zinc-900 shadow-md"
        }`}
      >
        {/* Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Deskripsi Ide Produk <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] font-mono text-zinc-500">
              {ideaText.length} karakter
            </span>
          </div>

          <textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            disabled={isGeneratingPrd}
            rows={5}
            placeholder="Contoh: Saya ingin membuat website booking mini soccer interaktif. Pengguna bisa melihat jadwal lapangan per jam, memilih slot yang kosong, memasukkan data tim, dan melakukan checkout..."
            className={`w-full rounded-2xl p-4 text-sm sm:text-base outline-none resize-none border leading-relaxed transition ${
              isDark
                ? "bg-zinc-950 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                : "bg-zinc-50 border-black/10 text-zinc-900 placeholder-zinc-400 focus:border-black/30"
            }`}
          />
        </div>

        {/* Target Platform Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Target Platform
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "website", label: "Website", icon: "🖥️", desc: "Responsive Web Desktop & Mobile" },
              { id: "mobile", label: "Mobile App", icon: "📱", desc: "Aplikasi Layar Smartphone" },
              { id: "both", label: "Keduanya", icon: "🌐", desc: "Cross-Platform Terintegrasi" },
            ].map((p) => {
              const isSelected = targetPlatform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTargetPlatform(p.id as TargetPlatform)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    isSelected
                      ? isDark
                        ? "bg-white text-black border-white shadow-md font-bold"
                        : "bg-black text-white border-black shadow-md font-bold"
                      : isDark
                      ? "bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300"
                      : "bg-black/5 hover:bg-black/10 border-black/5 text-zinc-700"
                  }`}
                >
                  <div className="text-lg mb-1">{p.icon}</div>
                  <div className="text-xs font-bold leading-tight">{p.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 line-clamp-1 ${
                      isSelected
                        ? isDark
                          ? "text-zinc-700"
                          : "text-zinc-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Context Details (Collapsible) */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showOptionalFields ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Detail Tambahan Opsional (Target Pengguna, Goals, Gaya Desain)</span>
          </button>

          {showOptionalFields && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 animate-in fade-in duration-200">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Target Pengguna
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Pecinta olahraga, mahasiswa"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border ${
                    isDark
                      ? "bg-zinc-950 border-white/10 text-white placeholder-zinc-600"
                      : "bg-zinc-50 border-black/10 text-zinc-900 placeholder-zinc-400"
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Tujuan Utama Produk
                </label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Otomasi booking jadwal tanpa chat"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border ${
                    isDark
                      ? "bg-zinc-950 border-white/10 text-white placeholder-zinc-600"
                      : "bg-zinc-50 border-black/10 text-zinc-900 placeholder-zinc-400"
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Preferensi Desain
                </label>
                <input
                  type="text"
                  value={designPreferences}
                  onChange={(e) => setDesignPreferences(e.target.value)}
                  placeholder="e.g. Minimalis, dark mode elegan"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border ${
                    isDark
                      ? "bg-zinc-950 border-white/10 text-white placeholder-zinc-600"
                      : "bg-zinc-50 border-black/10 text-zinc-900 placeholder-zinc-400"
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA Row */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {ideaText.trim() ? "Ide siap diproses ke PRD" : "Isi deskripsi ide di atas"}
          </div>

          <button
            type="button"
            disabled={!ideaText.trim() || isGeneratingPrd}
            onClick={handleSaveAndContinue}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
            }`}
          >
            {isGeneratingPrd ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Menyusun Dokumen PRD...</span>
              </>
            ) : (
              <>
                <span>Lanjutkan ke PRD</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Quick Example Ideas ─────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Atau Pilih Contoh Ide Populer:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EXAMPLE_IDEAS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isGeneratingPrd}
              onClick={() => handleSelectExample(ex)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer group ${
                isDark
                  ? "bg-[#141418] hover:bg-[#1a1a20] border-white/5 hover:border-white/15 text-zinc-200"
                  : "bg-white hover:bg-zinc-50 border-black/5 hover:border-black/15 text-zinc-800 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold group-hover:underline underline-offset-2">
                  {ex.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400">
                  {ex.platform}
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {ex.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
