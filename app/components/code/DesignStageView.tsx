"use client";

import React from "react";
import { DesignSpec } from "./types";
import { RevisionBar } from "./RevisionBar";

interface DesignStageViewProps {
  designSpec: DesignSpec;
  onApproveAndContinue: () => void;
  onRequestRevision?: (instruction: string) => void;
  isDark?: boolean;
}

export function DesignStageView({
  designSpec,
  onApproveAndContinue,
  onRequestRevision,
  isDark = true,
}: DesignStageViewProps) {
  const colors = [
    { label: "Background", hex: designSpec.colors.background },
    { label: "Surface Cards", hex: designSpec.colors.surface },
    { label: "Border 1px", hex: designSpec.colors.border },
    { label: "Primary Brand", hex: designSpec.colors.primary },
    { label: "Accent Color", hex: designSpec.colors.accent },
    { label: "Text High", hex: designSpec.colors.text },
    { label: "Text Muted", hex: designSpec.colors.mutedText },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-5xl w-full mx-auto space-y-8 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
        isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200 shadow-sm"
      }`}>
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Design Specification v{designSpec.version}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Arah Visual &amp; Art Direction Proyek
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Spesifikasi visual disusun khusus berdasarkan PRD yang telah disetujui. Desain ini unik untuk domain Anda dan bebas dari template generik.
          </p>
        </div>

        <button
          type="button"
          onClick={onApproveAndContinue}
          className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-200 transition shadow-xl shrink-0 cursor-pointer"
        >
          Approve Design &amp; Generate Prototype →
        </button>
      </div>

      {/* Revision Copilot Bar */}
      {onRequestRevision && (
        <RevisionBar
          currentStage="design"
          onSubmitRevision={onRequestRevision}
          isDark={isDark}
        />
      )}

      {/* Meta Grid: Archetype, Domain, Goal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border space-y-1.5 ${isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"}`}>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Visual Archetype</span>
          <div className="text-sm font-bold text-white capitalize">{designSpec.visualArchetype.replace(/-/g, " ")}</div>
          <span className="text-xs text-zinc-400 block">Karakter visual dan estetika antarmuka.</span>
        </div>

        <div className={`p-5 rounded-2xl border space-y-1.5 ${isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"}`}>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Domain Proyek</span>
          <div className="text-sm font-bold text-sky-400 uppercase font-mono">{designSpec.domain}</div>
          <span className="text-xs text-zinc-400 block">Disesuaikan dengan pola interaksi industri.</span>
        </div>

        <div className={`p-5 rounded-2xl border space-y-1.5 ${isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"}`}>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Target Audiens</span>
          <div className="text-sm font-bold text-white truncate">{designSpec.targetAudience}</div>
          <span className="text-xs text-zinc-400 block">Fokus kepuasan dan persona pengguna.</span>
        </div>
      </div>

      {/* Color Palette Swatches */}
      <div className={`p-6 rounded-3xl border space-y-4 ${isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"}`}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Color Tokens &amp; Palette</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {colors.map((c, i) => (
            <div key={i} className="p-3 rounded-2xl border border-white/5 bg-zinc-900/60 space-y-2">
              <div
                className="w-full h-10 rounded-xl border border-white/10 shadow-inner"
                style={{ backgroundColor: c.hex }}
              />
              <div>
                <div className="text-[11px] font-bold text-white truncate">{c.label}</div>
                <div className="text-[10px] font-mono text-zinc-400">{c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography System */}
      <div className={`p-6 rounded-3xl border space-y-4 ${isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"}`}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Typography System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
            <span className="text-[11px] text-zinc-500 font-mono">Primary UI Font</span>
            <div className="text-lg font-bold text-white">{designSpec.typography.primaryFont}</div>
            <p className="text-xs text-zinc-400">Digunakan untuk body copy, label input, tabel data, dan tombol aksi.</p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
            <span className="text-[11px] text-zinc-500 font-mono">Display &amp; Headings Font</span>
            <div className="text-lg font-bold text-white">{designSpec.typography.headingFont}</div>
            <p className="text-xs text-zinc-400">Digunakan untuk judul hero, headline seksi, dan metrik angka kunci.</p>
          </div>
        </div>
      </div>

      {/* Section Architecture Sequence */}
      <div className={`p-6 rounded-3xl border space-y-4 ${isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"}`}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Urutan Arsitektur Seksi Halaman</h3>
        <div className="space-y-2">
          {designSpec.layoutStrategy.sectionSequence.map((sec, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/5 text-xs text-zinc-200">
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-mono font-bold text-white text-[11px] shrink-0">
                0{idx + 1}
              </span>
              <span>{sec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reusable Component Specifications */}
      <div className={`p-6 rounded-3xl border space-y-4 ${isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"}`}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Komponen Antarmuka Kunci</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {designSpec.components.map((comp, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-1.5">
              <h4 className="text-xs font-bold text-white">{comp.name}</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{comp.description}</p>
              <div className="text-[10px] font-mono text-zinc-500 pt-1">Behavior: {comp.behavior}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
