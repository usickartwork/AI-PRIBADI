"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProjectItem } from "../CodeWorkspace";
import { StageStatus, AppBuilderState, DiagnosticIssue, EnhancedProjectTask } from "./types";

interface TestDebugStageProps {
  isDark: boolean;
  project: ProjectItem;
  appBuilderState: AppBuilderState;
  status: StageStatus;
  tasks: EnhancedProjectTask[];
  onRunDiagnostics: () => void;
  onAutoFixIssue: (issue: DiagnosticIssue) => void;
  onUpdateTasks: (tasks: EnhancedProjectTask[]) => void;
  onApproveStage: () => void;
  onDownloadZip: () => void;
  onDownloadPrd: () => void;
  onDownloadDesign: () => void;
  onDownloadTokens: () => void;
  onDownloadTasks: () => void;
  onDownloadPrototype: () => void;
  isScanning?: boolean;
}

export function TestDebugStage({
  isDark,
  project,
  appBuilderState,
  status,
  tasks = [],
  onRunDiagnostics,
  onAutoFixIssue,
  onUpdateTasks,
  onApproveStage,
  onDownloadZip,
  onDownloadPrd,
  onDownloadDesign,
  onDownloadTokens,
  onDownloadTasks,
  onDownloadPrototype,
  isScanning = false,
}: TestDebugStageProps) {
  const [activeTab, setActiveTab] = useState<"diagnostics" | "tasks" | "export">("diagnostics");
  const [copiedCmd, setCopiedCmd] = useState(false);

  const issues = appBuilderState.issues || [];
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  const hasAutoScannedRef = useRef(false);
  useEffect(() => {
    if (issues.length === 0 && !hasAutoScannedRef.current) {
      hasAutoScannedRef.current = true;
      const t = setTimeout(() => {
        onRunDiagnostics();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [issues.length, onRunDiagnostics]);

  const quickstartScript = `unzip ${project.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-project.zip -d ./app
cd ./app
npm install
npm run dev`;

  const handleCopyQuickstart = () => {
    navigator.clipboard?.writeText(quickstartScript);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleToggleTask = (taskId: string) => {
    const nextTasks: EnhancedProjectTask[] = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const nextStatus = (t.status === "done" ? "in_progress" : t.status === "in_progress" ? "backlog" : "done") as EnhancedProjectTask["status"];
      return { ...t, status: nextStatus };
    });
    onUpdateTasks(nextTasks);
  };

  const isApproved = status === "approved";

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
        isDark ? "bg-[#090d16] text-zinc-100" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div
        className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? "border-white/10 bg-[#121216]" : "border-black/10 bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
            Tahap 7 dari 7
          </span>
          <span className="text-sm font-bold tracking-tight">Test, Debug & Export Center</span>

          {/* Internal sub-tab switcher */}
          <div
            className={`flex items-center p-0.5 rounded-xl border ml-2 ${
              isDark ? "bg-zinc-900 border-white/10" : "bg-zinc-100 border-black/10"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("diagnostics")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                activeTab === "diagnostics"
                  ? isDark
                    ? "bg-white text-black font-bold shadow-xs"
                    : "bg-black text-white font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Diagnostik</span>
              {issues.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
                  {issues.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                activeTab === "tasks"
                  ? isDark
                    ? "bg-white text-black font-bold shadow-xs"
                    : "bg-black text-white font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Task Board</span>
              <span className="text-zinc-500 text-[10px] font-mono">({tasks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("export")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                activeTab === "export"
                  ? isDark
                    ? "bg-white text-black font-bold shadow-xs"
                    : "bg-black text-white font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Pusat Ekspor</span>
            </button>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadZip}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isDark
                ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                : "bg-black/5 hover:bg-black/10 border-black/15 text-black"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download ZIP</span>
          </button>

          <button
            type="button"
            onClick={onApproveStage}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
              isDark ? "bg-white hover:bg-zinc-200 text-black" : "bg-black hover:bg-zinc-800 text-white"
            }`}
          >
            <span>{isApproved ? "✓ Produk Selesai & Teruji" : "Selesaikan & Approve Produk"}</span>
          </button>
        </div>
      </div>

      {/* ── Main Tab Content ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-5xl w-full mx-auto space-y-6">
          {/* 1. DIAGNOSTICS TAB */}
          {activeTab === "diagnostics" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Scan Trigger & Stats */}
              <div
                className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                }`}
              >
                <div>
                  <h3 className="text-base font-bold">Pemindai Diagnostik Kode Statis</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Memeriksa keutuhan sintaks JSX, pasangan kurung kurawal, impor dependensi, dan
                    keamanan sandbox di seluruh file virtual.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={onRunDiagnostics}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
                    isDark
                      ? "bg-white hover:bg-zinc-200 text-black disabled:bg-zinc-700"
                      : "bg-black hover:bg-zinc-800 text-white disabled:bg-zinc-400"
                  }`}
                >
                  {isScanning ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span>Sedang Memindai...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Jalankan Scanner Sekarang</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`p-4 rounded-2xl border ${
                    errorCount > 0
                      ? isDark
                        ? "bg-white/10 border-white/30 text-white"
                        : "bg-black/10 border-black/30 text-black"
                      : isDark
                      ? "bg-[#121216] border-white/10"
                      : "bg-white border-black/10"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Error Kritis</span>
                  <p className="text-2xl font-bold font-mono mt-1">{errorCount}</p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Peringatan (Warnings)</span>
                  <p className="text-2xl font-bold font-mono mt-1">{warningCount}</p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Saran (Info)</span>
                  <p className="text-2xl font-bold font-mono mt-1">{infoCount}</p>
                </div>
              </div>

              {/* Issues List */}
              <div
                className={`p-6 rounded-3xl border space-y-3 ${
                  isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Hasil Analisis File Proyek
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">{issues.length} temuan</span>
                </div>

                {issues.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <span className="text-3xl block">✨</span>
                    <h4 className="text-sm font-bold text-zinc-200">Semua File Lolos Verifikasi</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Tidak ditemukan ketidakcocokan sintaks atau tag JSX yang rusak pada workspace. Kode siap diekspor.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {issues.map((iss) => (
                      <div
                        key={iss.id}
                        className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                          isDark ? "bg-zinc-900/60 border-white/5" : "bg-zinc-50 border-black/5"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                                iss.severity === "error"
                                  ? "bg-white text-black"
                                  : isDark
                                  ? "bg-white/15 text-zinc-300"
                                  : "bg-black/10 text-zinc-700"
                              }`}
                            >
                              {iss.severity}
                            </span>
                            <span className="text-xs font-mono font-semibold text-zinc-300">
                              {iss.filePath || iss.file} {iss.line ? `(baris ${iss.line})` : ""}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400">{iss.message}</p>

                          {(iss.fixSuggestion || iss.suggestion) && (
                            <p className="text-[11px] text-zinc-500 italic">
                              💡 Saran perbaikan: {iss.fixSuggestion || iss.suggestion}
                            </p>
                          )}
                        </div>

                        {(iss.fixSuggestion || iss.suggestion) && (
                          <button
                            type="button"
                            onClick={() => onAutoFixIssue(iss)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 border ${
                              isDark
                                ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                                : "bg-black/10 hover:bg-black/20 border-black/20 text-black"
                            }`}
                          >
                            Terapkan Solusi
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. TASK BOARD TAB */}
          {activeTab === "tasks" && (
            <div className="space-y-6 animate-in fade-in">
              <div
                className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                }`}
              >
                <div>
                  <h3 className="text-base font-bold">Rencana Task Implementasi Produk</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Daftar pekerjaan teknis terstruktur dengan kriteria penerimaan untuk memantau progress tim.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onDownloadTasks}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-black"
                    }`}
                  >
                    Download TASKS.md
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    Belum ada task yang terdaftar. Task akan otomatis dibuat dari PRD.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const isDone = task.status === "done";
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition ${
                          isDone
                            ? isDark
                              ? "bg-zinc-900/40 border-white/5 opacity-60"
                              : "bg-zinc-100/50 border-black/5 opacity-60"
                            : isDark
                            ? "bg-[#121216] border-white/10"
                            : "bg-white border-black/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleToggleTask(task.id)}
                              className="mt-1 w-4 h-4 rounded cursor-pointer accent-white"
                            />
                            <div>
                              <h4
                                className={`text-xs font-bold ${
                                  isDone ? "line-through text-zinc-500" : "text-zinc-200"
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              isDone
                                ? "bg-white text-black font-bold"
                                : isDark
                                ? "bg-white/10 text-zinc-400"
                                : "bg-black/10 text-zinc-600"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>

                        {/* Acceptance criteria */}
                        {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/5 pl-7 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                              Kriteria Penerimaan:
                            </span>
                            <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-0.5">
                              {task.acceptanceCriteria.map((crit, idx) => (
                                <li key={idx}>{crit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. EXPORT CENTER TAB */}
          {activeTab === "export" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Primary Download Card */}
              <div
                className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                  isDark ? "bg-white text-black" : "bg-black text-white"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                      Format Utama
                    </span>
                    <span className="text-xs font-semibold">Siap Pakai untuk Produksi</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Full Project ZIP Package</h3>
                  <p className={`text-xs mt-1 max-w-lg ${isDark ? "text-zinc-700" : "text-zinc-300"}`}>
                    Berisi seluruh struktur Next.js App Router, Tailwind CSS, TypeScript schemas, komponen
                    UI, API route, serta file dokumentasi PRD & Design Tokens.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onDownloadZip}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xl ${
                    isDark
                      ? "bg-black hover:bg-zinc-800 text-white"
                      : "bg-white hover:bg-zinc-200 text-black"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download .zip Proyek</span>
                </button>
              </div>

              {/* Individual Artifact Downloads Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* PRD.md */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-400 block mb-1">
                      📄 Dokumen Spesifikasi
                    </span>
                    <h4 className="text-sm font-bold">PRD.md</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Dokumen kebutuhan produk, personas, non-functional requirements, dan model data.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDownloadPrd}
                    className={`w-full py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-black"
                    }`}
                  >
                    Download PRD.md
                  </button>
                </div>

                {/* DESIGN.md */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-400 block mb-1">
                      📐 Arsitektur Desain
                    </span>
                    <h4 className="text-sm font-bold">DESIGN.md</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Spesifikasi layout, hierarki komponen, wireframe responsif, dan panduan gaya.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDownloadDesign}
                    className={`w-full py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-black"
                    }`}
                  >
                    Download DESIGN.md
                  </button>
                </div>

                {/* tokens.json */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-400 block mb-1">
                      🎨 Token Tema
                    </span>
                    <h4 className="text-sm font-bold">tokens.json</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Variabel warna, tipografi, dan radius dalam format JSON standar design system.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDownloadTokens}
                    className={`w-full py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-black"
                    }`}
                  >
                    Download tokens.json
                  </button>
                </div>

                {/* TASKS.md */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-400 block mb-1">
                      📋 Task Breakdown
                    </span>
                    <h4 className="text-sm font-bold">TASKS.md</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Daftar tugas implementasi terperinci untuk AI coding agent atau pengembang software.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDownloadTasks}
                    className={`w-full py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-black"
                    }`}
                  >
                    Download TASKS.md
                  </button>
                </div>

                {/* prototype.html */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-400 block mb-1">
                      🌐 Standalone Preview
                    </span>
                    <h4 className="text-sm font-bold">prototype.html</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      File preview tunggal yang dapat dibuka langsung di browser manapun tanpa instalasi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDownloadPrototype}
                    className={`w-full py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-black"
                    }`}
                  >
                    Download prototype.html
                  </button>
                </div>
              </div>

              {/* Terminal Quickstart Snippet */}
              <div
                className={`p-6 rounded-3xl border space-y-3 ${
                  isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Terminal Quickstart
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyQuickstart}
                    className="text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {copiedCmd ? "✓ Tersalin ke Clipboard" : "Salin Perintah"}
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-black/50 border border-white/5 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                  {quickstartScript}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
