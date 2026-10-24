"use client";

import React, { useState, useRef, useMemo } from "react";
import { PrototypeState, StageStatus } from "./types";
import { injectSandboxSecurity, PreviewDevice, DEVICE_PRESETS, ZOOM_PRESETS } from "../CodeWorkspace";

interface PrototypeStageProps {
  isDark: boolean;
  projectTitle?: string;
  prototypeHtml: string;
  prototypeState: PrototypeState;
  status: StageStatus;
  onUpdatePrototypeState: (state: PrototypeState) => void;
  onApprovePrototypeAndContinue: () => void;
  onBackToDesign: () => void;
}

export function PrototypeStage({
  isDark,
  projectTitle,
  prototypeHtml,
  prototypeState,
  status,
  onUpdatePrototypeState,
  onApprovePrototypeAndContinue,
  onBackToDesign,
}: PrototypeStageProps) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [zoom, setZoom] = useState<number>(100);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFlowGuide, setShowFlowGuide] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const securedHtml = useMemo(() => {
    return injectSandboxSecurity(prototypeHtml || "");
  }, [prototypeHtml]);

  const currentPreset = DEVICE_PRESETS[device];
  const isApproved = status === "approved";

  const checklist = prototypeState.interactionChecklist || [
    {
      id: "flow-1",
      title: "Navigasi Menu & Link Utama",
      description: "Periksa apakah navigasi header dan link halaman merespons dengan baik.",
      tested: false,
    },
    {
      id: "flow-2",
      title: "Interaksi Tombol Aksi (CTA)",
      description: "Klik tombol utama dan periksa feedback simulasi di layar.",
      tested: false,
    },
    {
      id: "flow-3",
      title: "Pengisian & Validasi Form",
      description: "Coba isi input form dan kirim data untuk menguji respon lokal.",
      tested: false,
    },
    {
      id: "flow-4",
      title: "Responsivitas Mobile & Desktop",
      description: "Ganti tampilan ke ukuran Mobile untuk melihat adaptasi tata letak.",
      tested: false,
    },
  ];

  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, tested: !item.tested } : item
    );
    onUpdatePrototypeState({
      ...prototypeState,
      interactionChecklist: updated,
    });
  };

  const handleRestart = () => {
    setRefreshKey((k) => k + 1);
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
        {/* Left: Device Switcher & Restart */}
        <div className="flex items-center gap-2">
          {/* Device Switcher */}
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

          {/* Restart Interaction State */}
          <button
            type="button"
            onClick={handleRestart}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              isDark
                ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
            }`}
            title="Reset ulang interaksi prototype"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset Interaksi</span>
          </button>

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

        {/* Right: Flow Guide Toggle, Fullscreen, Approval CTA */}
        <div className="flex items-center gap-2">
          {projectTitle && (
            <span className="text-xs text-zinc-400 hidden xl:inline truncate max-w-44 font-medium">
              {projectTitle}
            </span>
          )}
          {/* Toggle Flow Guide */}
          <button
            type="button"
            onClick={() => setShowFlowGuide(!showFlowGuide)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              showFlowGuide
                ? isDark
                  ? "bg-white/15 text-white border-white/20"
                  : "bg-black/10 text-black border-black/20"
                : isDark
                ? "bg-white/5 text-zinc-400 border-white/10"
                : "bg-black/5 text-zinc-600 border-black/10"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">Checklist Uji Alur</span>
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
            onClick={onApprovePrototypeAndContinue}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
            }`}
          >
            <span>{isApproved ? "Lanjut ke Build App" : "Approve Prototype & Mulai Build"}</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Simulation Banner (Crucial Requirement) ─────────────── */}
      <div
        className={`px-4 py-1.5 text-[11px] font-mono border-b flex items-center justify-between gap-2 select-none ${
          isDark
            ? "bg-zinc-900/80 border-white/10 text-zinc-300"
            : "bg-zinc-100 border-black/10 text-zinc-700"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          <span className="truncate">
            <strong className="font-bold">Simulasi Interaksi Frontend:</strong> Semua klik tombol,
            modal, dan formulir berjalan secara lokal di browser. Data tidak dikirim ke backend produksi.
          </span>
        </div>
        <button
          type="button"
          onClick={onBackToDesign}
          className="underline hover:text-white shrink-0 cursor-pointer hidden sm:inline"
        >
          Kembali ke Desain
        </button>
      </div>

      {/* ── Main Workspace Body (Interactive Iframe + Flow Guide) ── */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Interactive Prototype Iframe */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-auto p-4 sm:p-6 bg-pattern">
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
              key={refreshKey}
              title="Product Builder Interactive Prototype"
              srcDoc={securedHtml}
              sandbox="allow-scripts allow-modals allow-forms"
              className="w-full h-full border-0 bg-white"
            />
          </div>
        </div>

        {/* ── Side Panel: Interaction Flow Guide ────────────────── */}
        {showFlowGuide && (
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
                  Panduan Uji Interaksi
                </span>
                <button
                  type="button"
                  onClick={() => setShowFlowGuide(false)}
                  className="text-zinc-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Uji coba alur interaksi produk di samping. Tandai skenario yang telah Anda verifikasi
                sebelum menyetujui prototype.
              </p>

              {/* Checklist */}
              <div className="space-y-2.5">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer select-none ${
                      item.tested
                        ? isDark
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-black/10 border-black/20 text-black"
                        : isDark
                        ? "bg-[#141418] border-white/5 text-zinc-400 hover:border-white/15"
                        : "bg-white border-black/5 text-zinc-600 hover:border-black/15 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${
                          item.tested
                            ? isDark
                              ? "bg-white text-black border-white"
                              : "bg-black text-white border-black"
                            : isDark
                            ? "border-zinc-700 bg-zinc-900"
                            : "border-zinc-300 bg-white"
                        }`}
                      >
                        {item.tested && "✓"}
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-xs font-bold ${
                            item.tested ? "line-through opacity-80" : ""
                          }`}
                        >
                          {item.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
              <button
                type="button"
                onClick={onApprovePrototypeAndContinue}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                    : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
                }`}
              >
                <span>{isApproved ? "Lanjut ke Agent & Tasks" : "Setujui Prototype & Buat Tasks"}</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
