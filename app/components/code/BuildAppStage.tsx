"use client";

import React, { useState, useEffect } from "react";
import { ProjectItem } from "../CodeWorkspace";
import { StageStatus, DesignTokens, AppBuilderState } from "./types";

interface BuildAppStageProps {
  isDark: boolean;
  project: ProjectItem;
  status: StageStatus;
  designTokens: DesignTokens;
  appBuilderState: AppBuilderState;
  onStartBuild: () => Promise<void>;
  onOpenCodeEditor: () => void;
  onDownloadZip: () => void;
  isBuilding?: boolean;
}

const BUILD_STEPS = [
  { id: 1, label: "Membaca PRD & Spesifikasi Desain", desc: "Menganalisis skema fitur dan data produk" },
  { id: 2, label: "Menyusun Design Tokens & Tailwind Theme", desc: "Menerapkan tokens.json & tailwind.config.ts" },
  { id: 3, label: "Membuat TypeScript Contracts & Types", desc: "Menghasilkan skema lib/types.ts yang kokoh" },
  { id: 4, label: "Membangun Next.js App Router & Layout", desc: "Menyiapkan app/layout.tsx & metadata" },
  { id: 5, label: "Merakit Komponen Interaktif & State", desc: "Menghasilkan Navbar.tsx, ActionModal.tsx & page.tsx" },
  { id: 6, label: "Menghasilkan Mock API Routes & File Virtual", desc: "Menyiapkan endpoint app/api/entries/route.ts" },
];

export function BuildAppStage({
  isDark,
  project,
  status,
  designTokens,
  appBuilderState,
  onStartBuild,
  onOpenCodeEditor,
  onDownloadZip,
  isBuilding = false,
}: BuildAppStageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const files = appBuilderState.files || {};
  const fileKeys = Object.keys(files);
  const hasFiles = fileKeys.length > 0;

  // Step progression during build
  useEffect(() => {
    if (!isBuilding) {
      if (hasFiles) {
        const t = setTimeout(() => setCurrentStep(6), 0);
        return () => clearTimeout(t);
      }
      return;
    }
    const t0 = setTimeout(() => setCurrentStep(1), 0);
    const t1 = setTimeout(() => setCurrentStep(2), 700);
    const t2 = setTimeout(() => setCurrentStep(3), 1500);
    const t3 = setTimeout(() => setCurrentStep(4), 2400);
    const t4 = setTimeout(() => setCurrentStep(5), 3300);
    const t5 = setTimeout(() => setCurrentStep(6), 4200);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isBuilding, hasFiles]);

  const totalLines = fileKeys.reduce((acc, k) => acc + (files[k]?.split("\n").length || 0), 0);
  const totalBytes = fileKeys.reduce((acc, k) => acc + (files[k]?.length || 0), 0);

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-8 ${
        isDark ? "bg-[#090d16] text-zinc-100" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Header Banner */}
        <div
          className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                Tahap 5 dari 7
              </span>
              <span className="text-xs text-zinc-400 font-medium">Build Next.js Application</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                {status.replace(/_/g, " ")}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                {designTokens.direction}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Kompilasi Ide Menjadi Kode: {project.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Generator cerdas merakit struktur proyek Next.js 15 App Router siap pakai lengkap dengan
              TypeScript, Tailwind CSS, komponen UI modular, dan API route.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasFiles && (
              <button
                type="button"
                onClick={onDownloadZip}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                    : "bg-black/5 hover:bg-black/10 border-black/10 text-black"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download .zip</span>
              </button>
            )}

            <button
              type="button"
              disabled={isBuilding}
              onClick={onStartBuild}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                isDark
                  ? "bg-white hover:bg-zinc-200 text-black disabled:bg-zinc-700"
                  : "bg-black hover:bg-zinc-800 text-white disabled:bg-zinc-400"
              }`}
            >
              {isBuilding ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Sedang Membangun...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>{hasFiles ? "Rebuild Aplikasi" : "Mulai Build Aplikasi"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Building Progress Animation */}
        {isBuilding && (
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-5 animate-in fade-in ${
              isDark ? "bg-[#141418] border-white/10" : "bg-white border-black/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center animate-pulse">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold">Proses Pipeline Build Sedang Berjalan</h3>
                <p className="text-xs text-zinc-400">
                  Langkah {currentStep} dari {BUILD_STEPS.length}: {BUILD_STEPS[currentStep - 1]?.label}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {BUILD_STEPS.map((step) => {
                const isDone = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isDone
                        ? isDark
                          ? "bg-white/5 border-white/20 text-white"
                          : "bg-black/5 border-black/20 text-black"
                        : isCurrent
                        ? isDark
                          ? "bg-white/10 border-white text-white font-bold"
                          : "bg-black/10 border-black text-black font-bold"
                        : isDark
                        ? "bg-zinc-950/40 border-white/5 text-zinc-600"
                        : "bg-zinc-100/60 border-black/5 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                          isDone
                            ? "bg-white text-black"
                            : isCurrent
                            ? "bg-white/20 text-white animate-pulse"
                            : "bg-white/5 text-zinc-500"
                        }`}
                      >
                        {isDone ? "✓" : step.id}
                      </span>
                      <div>
                        <span className="text-xs block">{step.label}</span>
                        <span className="text-[10px] text-zinc-400 block font-normal">{step.desc}</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono">
                      {isDone ? "Selesai" : isCurrent ? "Sedang berjalan..." : "Menunggu"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Build Completed Metrics & File Tree */}
        {hasFiles && !isBuilding && (
          <div className="space-y-6 animate-in fade-in">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-zinc-400">Total File</span>
                <p className="text-xl font-bold font-mono mt-1">{fileKeys.length} file</p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-zinc-400">Total Baris Kode</span>
                <p className="text-xl font-bold font-mono mt-1">{totalLines.toLocaleString()} baris</p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-zinc-400">Ukuran Workspace</span>
                <p className="text-xl font-bold font-mono mt-1">{(totalBytes / 1024).toFixed(1)} KB</p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-zinc-400">Framework</span>
                <p className="text-xl font-bold font-mono mt-1">Next.js 15 App</p>
              </div>
            </div>

            {/* CTA to Code Editor */}
            <div
              className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              <div>
                <h3 className="text-base font-bold">Proyek Siap Ditinjau & Diedit</h3>
                <p className={`text-xs mt-1 ${isDark ? "text-zinc-700" : "text-zinc-300"}`}>
                  Buka editor kode berbasis browser untuk melihat hierarki file, melakukan perubahan,
                  dan menguji pratinjau langsung.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenCodeEditor}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-lg ${
                  isDark
                    ? "bg-black hover:bg-zinc-800 text-white"
                    : "bg-white hover:bg-zinc-200 text-black"
                }`}
              >
                <span>Buka di Code Editor & Preview</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            {/* Generated File Manifest */}
            <div
              className={`p-6 rounded-3xl border space-y-3 ${
                isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Manifest File Terbuat
                </h3>
                <span className="text-xs font-mono text-zinc-500">{fileKeys.length} item</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto">
                {fileKeys.map((path) => {
                  const content = files[path] || "";
                  const lines = content.split("\n").length;
                  const sizeKb = (content.length / 1024).toFixed(1);
                  return (
                    <div
                      key={path}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                        isDark ? "bg-zinc-900/60 border-white/5 hover:border-white/15" : "bg-zinc-50 border-black/5 hover:border-black/15"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-zinc-400">
                          {path.endsWith(".tsx") || path.endsWith(".ts")
                            ? "📄"
                            : path.endsWith(".json")
                            ? "📦"
                            : path.endsWith(".css")
                            ? "🎨"
                            : "📝"}
                        </span>
                        <span className="font-semibold truncate">{path}</span>
                      </div>

                      <div className="flex items-center gap-3 text-zinc-500 text-[11px] shrink-0">
                        <span>{lines} baris</span>
                        <span>{sizeKb} KB</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Initial Empty State / Pre-Build Explainer */}
        {!hasFiles && !isBuilding && (
          <div
            className={`p-8 rounded-3xl border text-center space-y-6 ${
              isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
            }`}
          >
            <div className="w-16 h-16 rounded-3xl bg-white/10 mx-auto flex items-center justify-center text-2xl">
              ⚡
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-bold">Siap Mengompilasi Kode Aplikasi</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tekan tombol &quot;Mulai Build Aplikasi&quot; untuk menghasilkan proyek Next.js lengkap
                berdasarkan PRD dan spesifikasi desain yang telah disetujui.
              </p>
            </div>

            {/* Architecture preview badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">Next.js 15 Router</span>
                <span className="text-[11px] text-zinc-400 block">
                  Layout modern, Page components, dan Client State
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">TypeScript & Tokens</span>
                <span className="text-[11px] text-zinc-400 block">
                  Tipe data lengkap dan Tailwind theme tersinkronisasi
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">API Route & Modals</span>
                <span className="text-[11px] text-zinc-400 block">
                  Mock handler data dan dialog interaktif teruji
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
