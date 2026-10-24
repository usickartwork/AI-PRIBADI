"use client";

import React, { useState } from "react";
import { BuildState, TestState } from "./types";
import { RevisionBar } from "./RevisionBar";

interface BuildAndTestStageViewProps {
  buildState?: BuildState;
  testState?: TestState;
  onOpenPreview: () => void;
  onDownloadZip?: () => void;
  onRequestRevision?: (instruction: string) => void;
  isDark?: boolean;
}

export function BuildAndTestStageView({
  buildState,
  testState,
  onOpenPreview,
  onDownloadZip,
  onRequestRevision,
  isDark = true,
}: BuildAndTestStageViewProps) {
  const [selectedFile, setSelectedFile] = useState<string>("app/page.tsx");
  const files = buildState?.files || {};
  const fileKeys = Object.keys(files);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-6xl w-full mx-auto space-y-8 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
        isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"
      }`}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Next.js 15 App Router Build • Status: {buildState?.status?.toUpperCase() || "SUCCESS"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Build &amp; Diagnostic Quality Report
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Proyek dikonstruksi secara modular dan lolos uji integritas DevSecOps in-memory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onDownloadZip && (
            <button
              type="button"
              onClick={onDownloadZip}
              className="px-4 py-3 rounded-2xl text-xs font-bold border border-white/20 text-white hover:bg-white/5 transition"
            >
              Download ZIP
            </button>
          )}
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-200 transition shadow-xl cursor-pointer"
          >
            Buka Live Preview →
          </button>
        </div>
      </div>

      {/* Revision Copilot Bar */}
      {onRequestRevision && (
        <RevisionBar
          currentStage="build"
          onSubmitRevision={onRequestRevision}
          isDark={isDark}
        />
      )}

      {/* Test Diagnostic Summary Strip */}
      {testState && (
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isDark ? "bg-[#12131a] border-white/10" : "bg-white border-zinc-200"
        }`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hasil Pengujian Otomatis</h3>
              <p className="text-xs text-zinc-400">Pemeriksaan AST syntax, client boundaries, dan isolasi rahasia.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black font-mono text-emerald-400">{testState.score} / 100</span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PASSED
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {testState.checks.map((chk) => (
              <div key={chk.id} className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    chk.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {chk.passed ? "✓" : "✕"}
                  </span>
                  <div>
                    <div className="font-semibold text-white">{chk.name}</div>
                    <div className="text-[11px] text-zinc-400">{chk.detail}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                  {chk.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Viewer & File Explorer */}
      <div className={`rounded-3xl border overflow-hidden flex flex-col md:flex-row min-h-[400px] ${
        isDark ? "bg-[#0b0c10] border-white/10" : "bg-white border-zinc-200"
      }`}>
        {/* Sidebar Files */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-4 space-y-2 bg-[#101117]">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block px-2">Struktur File Proyek</span>
          <div className="space-y-1">
            {fileKeys.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFile(f)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition cursor-pointer truncate ${
                  selectedFile === f ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-auto font-mono text-xs text-zinc-300 leading-relaxed bg-[#0c0d12]">
          <div className="text-zinc-500 text-[11px] pb-2 border-b border-white/5 mb-4 flex justify-between">
            <span>{selectedFile}</span>
            <span>{files[selectedFile]?.split("\n").length || 0} baris</span>
          </div>
          <pre className="whitespace-pre overflow-x-auto text-[11px] text-zinc-300 font-mono">
            {files[selectedFile] || "// File tidak ditemukan"}
          </pre>
        </div>
      </div>
    </div>
  );
}
