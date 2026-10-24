"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  DesignSpecification,
  DesignRevisionEntry,
  StageStatus,
  DesignTokens,
  VisualDirection,
  VISUAL_DIRECTIONS,
  DEFAULT_DESIGN_TOKENS,
} from "./types";
import { injectSandboxSecurity, PreviewDevice, DEVICE_PRESETS, ZOOM_PRESETS } from "../CodeWorkspace";

interface DesignStageProps {
  isDark: boolean;
  projectTitle?: string;
  designSpec: DesignSpecification;
  status: StageStatus;
  designTokens?: DesignTokens;
  onUpdateTokens?: (tokens: DesignTokens) => void;
  onDownloadTokens?: () => void;
  onUpdateHtml: (newHtml: string, promptUsed?: string) => void;
  onRestoreVersion: (version: DesignRevisionEntry) => void;
  onApproveDesignAndContinue: () => void;
  onGenerateWithAI: (customPrompt?: string) => Promise<void>;
  isGenerating?: boolean;
}

const GENERATION_STEPS = [
  { id: 1, label: "Membaca PRD yang disetujui" },
  { id: 2, label: "Merancang struktur tata letak (Layout & Grid)" },
  { id: 3, label: "Menyusun spesifikasi komponen (Navigation, Hero, Cards)" },
  { id: 4, label: "Memvalidasi kompatibilitas komponen & keamanan" },
  { id: 5, label: "Merender tampilan preview visual" },
  { id: 6, label: "Siap untuk ditinjau (Ready for review)" },
];

export function DesignStage({
  isDark,
  projectTitle,
  designSpec,
  status,
  designTokens = DEFAULT_DESIGN_TOKENS,
  onUpdateTokens,
  onDownloadTokens,
  onUpdateHtml,
  onRestoreVersion,
  onApproveDesignAndContinue,
  onGenerateWithAI,
  isGenerating = false,
}: DesignStageProps) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [zoom, setZoom] = useState<number>(100);
  const [viewMode, setViewMode] = useState<"preview" | "tokens" | "code">("preview");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [showRevisionPanel, setShowRevisionPanel] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Honest step progression during generation
  useEffect(() => {
    if (!isGenerating) {
      const tEnd = setTimeout(() => setGenerationStep(6), 0);
      return () => clearTimeout(tEnd);
    }
    const t0 = setTimeout(() => setGenerationStep(1), 0);
    const t1 = setTimeout(() => setGenerationStep(2), 1200);
    const t2 = setTimeout(() => setGenerationStep(3), 2800);
    const t3 = setTimeout(() => setGenerationStep(4), 5000);
    const t4 = setTimeout(() => setGenerationStep(5), 7500);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isGenerating]);

  // Iframe error listener
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "PREVIEW_CONSOLE_ERROR") {
        setPreviewError(e.data.message || "Peringatan runtime pada render preview");
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  const securedHtml = useMemo(() => {
    return injectSandboxSecurity(designSpec.currentHtml || "");
  }, [designSpec.currentHtml]);

  const currentPreset = DEVICE_PRESETS[device];
  const isApproved = status === "approved";

  const handleSendRevision = async () => {
    const prompt = revisionPrompt.trim();
    if (!prompt || isGenerating) return;
    setRevisionPrompt("");
    await onGenerateWithAI(prompt);
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      } ${isDark ? "bg-[#090d16] text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}
    >
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div
        className={`px-3.5 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 select-none ${
          isDark ? "border-white/10 bg-[#121216]/90 backdrop-blur-md" : "border-black/10 bg-white/90 backdrop-blur-md"
        }`}
      >
        {/* Left: View Mode Toggle & Device Switcher */}
        <div className="flex items-center gap-2">
          {/* View Mode (Preview vs Tokens vs Code) */}
          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? "bg-zinc-900 border-white/10" : "bg-zinc-100 border-black/10"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "preview"
                  ? isDark
                    ? "bg-white text-black shadow-xs font-bold"
                    : "bg-black text-white shadow-xs font-bold"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Visual</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("tokens")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "tokens"
                  ? isDark
                    ? "bg-white text-black shadow-xs font-bold"
                    : "bg-black text-white shadow-xs font-bold"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span>Tokens & Style</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "code"
                  ? isDark
                    ? "bg-white text-black shadow-xs font-bold"
                    : "bg-black text-white shadow-xs font-bold"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Kode</span>
            </button>
          </div>

          {/* Viewport Presets: Desktop, Tablet, Mobile */}
          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? "bg-zinc-900 border-white/10" : "bg-zinc-100 border-black/10"
            }`}
          >
            {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer capitalize flex items-center gap-1.5 ${
                  device === d
                    ? isDark
                      ? "bg-white text-black shadow-xs font-bold"
                      : "bg-black text-white shadow-xs font-bold"
                    : isDark
                    ? "text-zinc-400 hover:text-white"
                    : "text-zinc-600 hover:text-black"
                }`}
                title={DEVICE_PRESETS[d].label}
              >
                {d === "desktop" ? "🖥️ Desktop" : d === "tablet" ? "📱 Tablet" : "📱 Mobile"}
              </button>
            ))}
          </div>

          {/* Zoom Selector */}
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={`hidden sm:inline-block text-xs font-mono font-bold rounded-xl px-2 py-1 outline-none border transition cursor-pointer ${
              isDark ? "bg-zinc-900 border-white/10 text-white" : "bg-white border-black/10 text-zinc-900"
            }`}
          >
            {ZOOM_PRESETS.map((z) => (
              <option key={z} value={z}>
                {z}%
              </option>
            ))}
          </select>
        </div>

        {/* Right: Revision Toggle, Version History, Approval CTA */}
        <div className="flex items-center gap-2">
          {projectTitle && (
            <span className="text-xs text-zinc-400 hidden xl:inline truncate max-w-44 font-medium">
              {projectTitle}
            </span>
          )}
          {/* Version badge */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              isDark
                ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
            }`}
            title="Riwayat Versi Desain"
          >
            <span>v{designSpec.version || 1}</span>
            <span className="text-[10px] text-zinc-500">
              ({designSpec.revisions?.length || 1} versi)
            </span>
          </button>

          {/* Toggle Revision Panel */}
          <button
            type="button"
            onClick={() => setShowRevisionPanel(!showRevisionPanel)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              showRevisionPanel
                ? isDark
                  ? "bg-white/15 text-white border-white/20"
                  : "bg-black/10 text-black border-black/20"
                : isDark
                ? "bg-white/5 text-zinc-400 border-white/10"
                : "bg-black/5 text-zinc-600 border-black/10"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">Instruksi Revisi</span>
          </button>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300" : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
            }`}
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          {/* Primary Approval CTA */}
          <button
            type="button"
            onClick={onApproveDesignAndContinue}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
            }`}
          >
            <span>{isApproved ? "Lanjut ke Prototype" : "Approve Desain & Lanjut"}</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main Workspace Body (Preview & Floating Revision Panel) ── */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Visual / Code View */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-auto p-4 sm:p-6 bg-pattern">
          {isGenerating ? (
            /* Honest Multi-Step Generation Animation Card */
            <div
              className={`p-6 sm:p-8 rounded-3xl border max-w-lg w-full space-y-5 shadow-2xl text-center animate-in fade-in zoom-in-95 ${
                isDark ? "bg-[#141418] border-white/10 text-white" : "bg-white border-black/10 text-zinc-900"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center animate-pulse">
                <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-bold">Sedang Merancang Antarmuka Produk</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  AI sedang menyusun spesifikasi UI dan komponen yang dapat dirender nyata.
                </p>
              </div>

              {/* Progress Steps List */}
              <div className="space-y-2 text-left pt-2">
                {GENERATION_STEPS.map((s) => {
                  const isDone = generationStep > s.id;
                  const isCurrent = generationStep === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 p-2 rounded-xl text-xs transition ${
                        isCurrent
                          ? isDark
                            ? "bg-white/10 text-white font-bold"
                            : "bg-black/10 text-black font-bold"
                          : isDone
                          ? "text-zinc-400"
                          : "text-zinc-600 opacity-60"
                      }`}
                    >
                      <span className="font-mono text-[10px] w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        {isDone ? "✓" : isCurrent ? "●" : s.id}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {previewError && (
                <div className="w-full max-w-2xl mb-3 px-4 py-2 rounded-xl border border-white/20 bg-zinc-900/90 text-xs text-zinc-300 flex items-center justify-between gap-3 shrink-0">
                  <span>{previewError}</span>
                  <button
                    type="button"
                    onClick={() => setPreviewError(null)}
                    className="text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {viewMode === "code" ? (
                /* Code View */
                <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 flex flex-col bg-[#0f0f13]">
                  <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400 bg-black/40">
                    <span>spec.html (Single-File Renderable UI)</span>
                    <span>{designSpec.currentHtml.length} karakter</span>
                  </div>
                  <textarea
                    value={designSpec.currentHtml}
                    onChange={(e) => onUpdateHtml(e.target.value)}
                    className="flex-1 w-full p-4 font-mono text-xs text-zinc-200 bg-transparent outline-none resize-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              ) : viewMode === "tokens" ? (
                /* Tokens & Visual Direction Studio */
                <div className="w-full h-full max-w-4xl overflow-y-auto space-y-6 p-2 sm:p-4 animate-in fade-in">
                  {/* Top Intro & Export */}
                  <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDark ? "bg-[#141418] border-white/10" : "bg-white border-black/10"
                  }`}>
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <span>🎨 Design System & Visual Direction</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                          tokens.json
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Pilih tema visual produk Anda. Token ini langsung disinkronkan ke Tailwind CSS dan kode Next.js yang di-generate.
                      </p>
                    </div>

                    {onDownloadTokens && (
                      <button
                        type="button"
                        onClick={onDownloadTokens}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isDark ? "bg-white/10 hover:bg-white/20 text-white border border-white/15" : "bg-black/5 hover:bg-black/10 text-black border border-black/15"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download tokens.json</span>
                      </button>
                    )}
                  </div>

                  {/* Visual Direction Selector */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Pilih Visual Direction
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(Object.keys(VISUAL_DIRECTIONS) as VisualDirection[]).map((dirKey) => {
                        const item = VISUAL_DIRECTIONS[dirKey];
                        const isSelected = (designTokens.direction || "modern_dark") === dirKey;
                        return (
                          <button
                            key={dirKey}
                            type="button"
                            onClick={() => {
                              if (onUpdateTokens) {
                                onUpdateTokens({
                                  ...designTokens,
                                  direction: dirKey,
                                  colors: {
                                    ...designTokens.colors,
                                    ...item.colors,
                                  },
                                });
                              }
                            }}
                            className={`p-4 rounded-2xl border text-left transition cursor-pointer relative group flex flex-col justify-between ${
                              isSelected
                                ? isDark
                                  ? "bg-white/10 border-white text-white shadow-lg"
                                  : "bg-black/5 border-black text-black shadow-lg"
                                : isDark
                                ? "bg-[#121216] border-white/10 text-zinc-300 hover:border-white/30"
                                : "bg-white border-black/10 text-zinc-700 hover:border-black/30"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold">{item.name}</span>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                                {item.description}
                              </p>
                            </div>

                            {/* Color preview dots */}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                              <span
                                className="w-4 h-4 rounded-full border border-white/20"
                                style={{ backgroundColor: item.colors.background }}
                                title="Background"
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/20"
                                style={{ backgroundColor: item.colors.surface }}
                                title="Surface"
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/20"
                                style={{ backgroundColor: item.colors.primary }}
                                title="Primary"
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/20"
                                style={{ backgroundColor: item.colors.accent }}
                                title="Accent"
                              />
                              <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                                {item.colors.primary}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Token Palette Inspection */}
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? "bg-[#141418] border-white/10" : "bg-white border-black/10"
                  }`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Palet Warna Token Aktif
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(designTokens.colors || {}).map(([key, val]) => (
                        <div
                          key={key}
                          onClick={() => {
                            navigator.clipboard?.writeText(val);
                            setCopiedToken(key);
                            setTimeout(() => setCopiedToken(null), 1500);
                          }}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                            isDark ? "bg-zinc-900 border-white/5 hover:border-white/20" : "bg-zinc-50 border-black/5 hover:border-black/20"
                          }`}
                          title="Klik untuk salin hex"
                        >
                          <span
                            className="w-7 h-7 rounded-lg border border-white/20 shrink-0 shadow-xs"
                            style={{ backgroundColor: val }}
                          />
                          <div className="min-w-0">
                            <span className="block text-[11px] font-medium capitalize truncate text-zinc-300">
                              {key}
                            </span>
                            <span className="block text-[10px] font-mono text-zinc-500">
                              {copiedToken === key ? "Tersalin!" : val}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography & Spacing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border space-y-3 ${
                      isDark ? "bg-[#141418] border-white/10" : "bg-white border-black/10"
                    }`}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Tipografi
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">Font Family</span>
                          <span className="font-mono text-zinc-200">{designTokens.typography.fontFamily}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">Display Size</span>
                          <span className="font-mono text-zinc-200">{designTokens.typography.displaySize}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">Heading 1</span>
                          <span className="font-mono text-zinc-200">{designTokens.typography.heading1Size}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-zinc-400">Mono Font</span>
                          <span className="font-mono text-zinc-200">{designTokens.typography.monoFont}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border space-y-3 ${
                      isDark ? "bg-[#141418] border-white/10" : "bg-white border-black/10"
                    }`}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Border Radius Scale
                      </h4>
                      <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          <div className="w-8 h-8 mx-auto bg-white/20 mb-1 rounded-[0.5rem]" />
                          <span className="text-[10px] font-mono text-zinc-400">sm</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          <div className="w-8 h-8 mx-auto bg-white/20 mb-1 rounded-[0.75rem]" />
                          <span className="text-[10px] font-mono text-zinc-400">md</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          <div className="w-8 h-8 mx-auto bg-white/20 mb-1 rounded-[1.5rem]" />
                          <span className="text-[10px] font-mono text-zinc-400">lg</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          <div className="w-8 h-8 mx-auto bg-white/20 mb-1 rounded-full" />
                          <span className="text-[10px] font-mono text-zinc-400">full</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sandboxed Visual Iframe */
            <div
              className="relative transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white"
              style={{
                width: device === "desktop" ? "100%" : `${currentPreset.width}px`,
                maxWidth: device === "desktop" ? "1440px" : `${currentPreset.width}px`,
                height: `${currentPreset.height}px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <iframe
                title="Product Builder UI Preview"
                srcDoc={securedHtml}
                sandbox="allow-scripts allow-modals allow-forms"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          )}
        </>
      )}
    </div>

        {/* ── Docked / Floating Revision Panel ─────────────────── */}
        {showRevisionPanel && !isGenerating && (
          <aside
            className={`w-full sm:w-80 border-t sm:border-t-0 sm:border-l p-4 flex flex-col justify-between shrink-0 select-none z-20 ${
              isDark
                ? "bg-[#101014]/95 border-white/10 text-white backdrop-blur-xl"
                : "bg-white/95 border-black/10 text-zinc-900 backdrop-blur-xl"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Instruksi Revisi Desain
                </span>
                <button
                  type="button"
                  onClick={() => setShowRevisionPanel(false)}
                  className="text-zinc-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Ketik instruksi spesifik untuk mengubah tampilan atau elemen antarmuka. Versi baru
                akan dibuat tanpa menghapus riwayat lama.
              </p>

              <div className="space-y-2">
                <textarea
                  value={revisionPrompt}
                  onChange={(e) => setRevisionPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendRevision();
                    }
                  }}
                  rows={3}
                  placeholder="e.g. Ubah hero jadi lebih minimalis, tambahkan filter kategori, dan buat tombol booking lebih menonjol..."
                  className={`w-full rounded-2xl p-3 text-xs outline-none resize-none border leading-relaxed transition ${
                    isDark
                      ? "bg-zinc-950 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                      : "bg-zinc-50 border-black/10 text-zinc-900 placeholder-zinc-400 focus:border-black/30"
                  }`}
                />

                <button
                  type="button"
                  disabled={!revisionPrompt.trim() || isGenerating}
                  onClick={handleSendRevision}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                      : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Terapkan Revisi (Buat Versi Baru)</span>
                </button>
              </div>

              {/* Quick Prompt Ideas */}
              <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-[11px] font-bold text-zinc-500 block">
                  Contoh Perubahan Cepat:
                </span>
                {[
                  "Pertegas tombol Call to Action utama",
                  "Jadikan tata letak kartu produk lebih ringkas",
                  "Tambahkan form pencarian dan filter cepat",
                  "Gunakan nuansa tipografi yang lebih modern",
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRevisionPrompt(sug)}
                    className="w-full text-left p-2 rounded-xl text-[11px] text-zinc-400 hover:text-white hover:bg-white/5 transition truncate cursor-pointer"
                  >
                    • {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Status Info */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Versi saat ini: v{designSpec.version || 1}</span>
              <button
                type="button"
                onClick={() => onGenerateWithAI()}
                className="underline hover:text-white cursor-pointer"
              >
                Regenerate Awal
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Version History Modal ────────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border p-5 sm:p-6 space-y-4 shadow-2xl ${
              isDark ? "bg-[#141418] border-white/10 text-white" : "bg-white border-black/10 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Riwayat Versi Desain</h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Pilih versi desain sebelumnya untuk mengembalikan atau membandingkan perubahan.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(designSpec.revisions && designSpec.revisions.length > 0) ? (
                designSpec.revisions.map((rev) => (
                  <div
                    key={rev.version}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                      rev.version === designSpec.version
                        ? isDark
                          ? "bg-white/10 border-white/20 font-bold"
                          : "bg-black/10 border-black/20 font-bold"
                        : isDark
                        ? "bg-zinc-900 border-white/5"
                        : "bg-zinc-50 border-black/5"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">v{rev.version}</span>
                        {rev.version === designSpec.version && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white font-mono">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {rev.prompt || "Desain Awal"}
                      </p>
                    </div>

                    {rev.version !== designSpec.version && (
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreVersion(rev);
                          setShowHistoryModal(false);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer shrink-0 border ${
                          isDark
                            ? "bg-white/5 hover:bg-white/15 border-white/10 text-white"
                            : "bg-black/5 hover:bg-black/15 border-black/10 text-black"
                        }`}
                      >
                        Pulihkan
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-4">
                  Hanya ada versi awal saat ini.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
