"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ProjectItem } from "@/app/components/CodeWorkspace";
import { SandboxSessionState } from "@/lib/sandbox";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

export interface DevicePreset {
  width: number;
  height: number;
  label: string;
}

export const DEVICE_PRESETS: Record<PreviewDevice, DevicePreset> = {
  desktop: { width: 1440, height: 900, label: "Desktop (1440 × 900)" },
  tablet: { width: 768, height: 1024, label: "Tablet (768 × 1024)" },
  mobile: { width: 390, height: 844, label: "Mobile (390 × 844)" },
};

export const ZOOM_PRESETS = [50, 75, 90, 100, 125];

interface CodeBuilderViewProps {
  project: ProjectItem;
  isDark: boolean;
  userId?: string;
  onUpdateProject: (updated: Partial<ProjectItem>) => void;
  onSwitchToPrd?: () => void;
  onSwitchToChat?: () => void;
}

export default function CodeBuilderView({
  project,
  isDark,
  userId,
  onUpdateProject,
  onSwitchToPrd,
  onSwitchToChat,
}: CodeBuilderViewProps) {
  // ── States ──────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [zoom, setZoom] = useState<number>(100);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // File explorer & code view
  const [files, setFiles] = useState<Record<string, string>>(() => {
    const initialFiles: Record<string, string> = {};
    if (project.generatedHtml) {
      initialFiles["index.html"] = project.generatedHtml;
    }
    return initialFiles;
  });
  const [selectedFile, setSelectedFile] = useState<string>("index.html");
  const [editedCode, setEditedCode] = useState<string>("");

  // Sandbox runtime state
  const [sandboxState, setSandboxState] = useState<SandboxSessionState | null>(null);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [showLogsDrawer, setShowLogsDrawer] = useState<boolean>(false);
  const [revisionPrompt, setRevisionPrompt] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Synchronize files with project
  useEffect(() => {
    if (project.generatedHtml && (!files["index.html"] || files["index.html"] !== project.generatedHtml)) {
      setFiles((prev) => ({
        ...prev,
        "index.html": project.generatedHtml!,
      }));
    }
  }, [project.id, project.generatedHtml]);

  // Synchronize editedCode with selectedFile
  useEffect(() => {
    setEditedCode(files[selectedFile] || "");
  }, [selectedFile, files]);

  // Auto-clear feedback toast
  useEffect(() => {
    if (!copyFeedback) return;
    const timer = setTimeout(() => setCopyFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [copyFeedback]);

  const activePreset = DEVICE_PRESETS[device];
  const hasFiles = Object.keys(files).length > 0 && Boolean(files["index.html"]?.trim());

  // ── Build / Launch Sandbox Handler ──────────────────────────────────────────
  const handleBuildOrRunSandbox = async (customPrompt?: string) => {
    if (isBuilding) return;
    setIsBuilding(true);
    setShowLogsDrawer(true);

    const initialLog = customPrompt
      ? `Mengirim instruksi revisi AI: "${customPrompt.slice(0, 50)}..."`
      : `Memulai Build App dari PRD: ${project.title}`;
    setBuildLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${initialLog}`]);

    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build",
          projectId: project.id,
          projectTitle: project.title,
          prdOverview: project.prd?.overview || project.description || "",
          features: project.features || [],
          tasks: project.tasks || [],
          userFlow: project.userFlow || "",
          userPrompt: customPrompt || "",
          files: Object.keys(files).length > 0 ? files : undefined,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menjalankan Sandbox.");
      }

      if (data.sandbox) {
        setSandboxState(data.sandbox);
        if (data.sandbox.files) {
          setFiles(data.sandbox.files);
          if (data.sandbox.files["index.html"]) {
            onUpdateProject({ generatedHtml: data.sandbox.files["index.html"] });
          }
        }
        if (data.sandbox.logs && Array.isArray(data.sandbox.logs)) {
          setBuildLogs((prev) => [...prev, ...data.sandbox.logs]);
        }
      }

      setRefreshKey((k) => k + 1);
      if (customPrompt) setRevisionPrompt("");
    } catch (err: any) {
      console.error("Sandbox build error:", err);
      setBuildLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ Error: ${err.message || String(err)}`,
      ]);
    } finally {
      setIsBuilding(false);
    }
  };

  // ── Stop Sandbox Handler ────────────────────────────────────────────────────
  const handleStopSandbox = async () => {
    try {
      await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", projectId: project.id, userId }),
      });
      setSandboxState((prev) => (prev ? { ...prev, status: "stopped", previewUrl: undefined } : null));
      setBuildLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] 🛑 Sandbox dihentikan.`]);
    } catch (err) {
      console.warn("Failed to stop sandbox:", err);
    }
  };

  // ── Save Manual Code Edit ───────────────────────────────────────────────────
  const handleSaveCode = () => {
    const updated = {
      ...files,
      [selectedFile]: editedCode,
    };
    setFiles(updated);
    if (selectedFile === "index.html") {
      onUpdateProject({ generatedHtml: editedCode });
    }
    setRefreshKey((k) => k + 1);
    setCopyFeedback("Kode berhasil disimpan!");
  };

  // ── Copy Live Preview URL ───────────────────────────────────────────────────
  const handleCopyUrl = () => {
    if (sandboxState?.previewUrl) {
      navigator.clipboard.writeText(sandboxState.previewUrl);
      setCopyFeedback("URL Live Preview berhasil disalin!");
    }
  };

  // ── Open in New Tab ─────────────────────────────────────────────────────────
  const handleOpenInNewTab = () => {
    if (sandboxState?.previewUrl) {
      window.open(sandboxState.previewUrl, "_blank", "noopener,noreferrer");
    } else if (files["index.html"]) {
      const blob = new Blob([files["index.html"]], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  };

  const previewSource = sandboxState?.previewUrl;
  const clientHtml = files["index.html"] || project.generatedHtml || "";

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      } ${isDark ? "bg-[#090d16] text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}
    >
      {/* ── Toast Feedback ── */}
      {copyFeedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-black border border-zinc-700 dark:border-zinc-300 shadow-xl animate-in fade-in-0 duration-200">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* ── Top Workspace Bar (v0 / Lovable Style) ── */}
      <div
        className={`px-3.5 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 select-none ${
          isDark ? "border-zinc-800 bg-zinc-950/90" : "border-zinc-200 bg-white"
        }`}
      >
        {/* Left: View Mode Toggle & Sidebar Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className={`p-1.5 rounded-lg border transition cursor-pointer text-xs flex items-center gap-1.5 ${
              isDark
                ? isSidebarOpen ? "bg-zinc-800 text-white border-zinc-700" : "border-zinc-800 hover:bg-zinc-800 text-zinc-400"
                : isSidebarOpen ? "bg-zinc-200 text-black border-zinc-300" : "border-zinc-200 hover:bg-zinc-100 text-zinc-600"
            }`}
            title="Toggle Sidebar Panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>

          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-300"
            }`}
          >
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "preview"
                  ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                  : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "code"
                  ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                  : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Center: Device Selector (Desktop / Tablet / Mobile) */}
        {viewMode === "preview" && (
          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-300"
            }`}
          >
            {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer capitalize flex items-center gap-1.5 ${
                  device === d
                    ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                    : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
                }`}
                title={DEVICE_PRESETS[d].label}
              >
                {d === "desktop" ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : d === "tablet" ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="hidden sm:inline">{d}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right: Controls (Zoom, Refresh, Open New Tab, Fullscreen) */}
        <div className="flex items-center gap-1.5">
          {viewMode === "preview" && (
            <>
              <div className="hidden md:flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 font-mono">Zoom:</span>
                <select
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className={`text-xs px-2 py-1 rounded-lg border font-mono outline-none cursor-pointer ${
                    isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200" : "bg-white border-zinc-300 text-zinc-800"
                  }`}
                >
                  {ZOOM_PRESETS.map((z) => (
                    <option key={z} value={z}>{z}%</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
                title="Refresh Preview (↻)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={handleOpenInNewTab}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
                title="Buka di Tab Baru (↗)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </>
          )}

          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
            }`}
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (⛶)"}
          >
            {isFullscreen ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Sub-bar: Sandbox Status, URL, and Build Trigger ── */}
      <div
        className={`px-3.5 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none ${
          isDark ? "border-zinc-800/80 bg-zinc-950/70 text-zinc-300" : "border-zinc-200 bg-zinc-50/90 text-zinc-700"
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {sandboxState?.status === "running" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {sandboxState.mode === "vercel_sandbox" ? "Vercel MicroVM (Live)" : "Client Virtual Sandbox"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              Ready to Build
            </span>
          )}

          {sandboxState?.previewUrl && (
            <div className="flex items-center gap-1.5 bg-black/30 dark:bg-zinc-900/60 px-2.5 py-0.5 rounded-md border border-zinc-800 text-[11px] font-mono text-zinc-300 max-w-[280px] sm:max-w-md truncate">
              <span className="text-emerald-400">🔒</span>
              <span className="truncate">{sandboxState.previewUrl}</span>
              <button
                onClick={handleCopyUrl}
                className="text-zinc-400 hover:text-white cursor-pointer ml-1"
                title="Salin Link Preview"
              >
                📋
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {sandboxState?.status === "running" && (
            <button
              onClick={handleStopSandbox}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer text-rose-400 border-rose-900/40 hover:bg-rose-950/30`}
              title="Hentikan Sandbox untuk menghemat kuota"
            >
              🛑 Stop
            </button>
          )}

          <button
            onClick={() => setShowLogsDrawer((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700"
            }`}
          >
            <span className="font-mono text-[10px]">&gt;_</span>
            <span>Logs ({buildLogs.length})</span>
          </button>

          <button
            onClick={() => handleBuildOrRunSandbox()}
            disabled={isBuilding}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isBuilding
                ? "opacity-75 cursor-not-allowed bg-indigo-600 text-white"
                : isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {isBuilding ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Building App...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>{hasFiles ? "Rebuild App" : "Build App"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Content: Split Screen Layout ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Panel: Files & AI Iterations */}
        {isSidebarOpen && (
          <aside
            className={`w-72 sm:w-80 border-r flex flex-col shrink-0 min-h-0 z-10 transition-all ${
              isDark ? "border-zinc-800 bg-[#0d121d]" : "border-zinc-200 bg-white"
            }`}
          >
            {/* Project PRD Context Banner */}
            <div className={`p-3.5 border-b text-xs ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs truncate">{project.title}</span>
                {onSwitchToPrd && (
                  <button
                    onClick={onSwitchToPrd}
                    className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Buka PRD →
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {project.prd?.overview || project.description || "PRD siap untuk proses pembuatan aplikasi."}
              </p>
            </div>

            {/* File Explorer */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-3.5 py-2 border-b flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <span>File Explorer</span>
                <span className="font-mono text-[10px] lowercase text-zinc-500">{Object.keys(files).length} files</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {Object.keys(files).length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400 italic">
                    Belum ada file. Klik "Build App" untuk membuat struktur file.
                  </div>
                ) : (
                  Object.keys(files).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setSelectedFile(f);
                        if (viewMode !== "code") setViewMode("code");
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition cursor-pointer ${
                        selectedFile === f
                          ? isDark ? "bg-zinc-800 text-white font-bold" : "bg-zinc-100 text-black font-bold"
                          : isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-900" : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                      }`}
                    >
                      <span className="text-zinc-500">📄</span>
                      <span className="truncate">{f}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* AI Iteration Prompt Bar */}
            <div className={`p-3 border-t ${isDark ? "border-zinc-800 bg-zinc-950/60" : "border-zinc-200 bg-zinc-50"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-zinc-400">Revisi &amp; Modifikasi AI</span>
                <span className="text-[10px] text-indigo-400 font-mono">v0/Lovable flow</span>
              </div>
              <div className="relative">
                <textarea
                  value={revisionPrompt}
                  onChange={(e) => setRevisionPrompt(e.target.value)}
                  placeholder="Contoh: Tambahkan tombol filter harga dan mode checkout modal..."
                  rows={2}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none resize-none leading-relaxed font-sans ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500"
                      : "bg-white border-zinc-300 text-zinc-800 placeholder:text-zinc-400 focus:border-indigo-500"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (revisionPrompt.trim() && !isBuilding) {
                        handleBuildOrRunSandbox(revisionPrompt);
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (revisionPrompt.trim() && !isBuilding) {
                      handleBuildOrRunSandbox(revisionPrompt);
                    }
                  }}
                  disabled={!revisionPrompt.trim() || isBuilding}
                  className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    !revisionPrompt.trim() || isBuilding
                      ? "opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500"
                      : isDark
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {isBuilding ? "AI Sedang Memperbarui..." : "✨ Kirim Revisi AI"}
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Right Canvas: Preview or Code Viewer */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {!hasFiles && viewMode === "preview" ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div
                className={`w-16 h-16 rounded-3xl border flex items-center justify-center mb-4 ${
                  isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-300 text-zinc-600"
                }`}
              >
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1">
                Aplikasi Belum Dijalankan
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
                PRD untuk <strong>{project.title}</strong> sudah siap. Tekan tombol di bawah untuk meminta AI menyusun kode dan menjalankannya langsung di dalam Vercel Sandbox.
              </p>
              <button
                onClick={() => handleBuildOrRunSandbox()}
                disabled={isBuilding}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg flex items-center gap-2 ${
                  isBuilding
                    ? "opacity-75 cursor-not-allowed bg-indigo-600 text-white"
                    : isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                {isBuilding ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Mempersiapkan Workspace &amp; MicroVM...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Build App dari PRD Ini</span>
                  </>
                )}
              </button>
            </div>
          ) : viewMode === "code" ? (
            /* Code Editor Mode */
            <div className={`flex-1 flex flex-col min-h-0 ${isDark ? "bg-[#090d16]" : "bg-white"}`}>
              <div
                className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
                  isDark ? "border-zinc-800 text-zinc-400 bg-zinc-950/60" : "border-zinc-200 text-zinc-600 bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-bold">{selectedFile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCode}
                    className="px-3 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition shadow-xs"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <textarea
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  className={`w-full h-full p-4 font-mono text-xs outline-none resize-none border-none leading-relaxed ${
                    isDark ? "bg-[#090d16] text-zinc-200 selection:bg-zinc-800" : "bg-white text-zinc-900 selection:bg-zinc-200"
                  }`}
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            /* Live Preview Canvas */
            <div
              className={`flex-1 flex flex-col min-h-0 overflow-auto relative items-center justify-start p-4 sm:p-8 ${
                isDark ? "bg-[#0b0f19]" : "bg-zinc-100"
              }`}
            >
              <div
                className={`flex flex-col transition-all duration-300 relative shadow-2xl rounded-3xl overflow-hidden border shrink-0 my-auto ${
                  isDark ? "border-zinc-800 bg-black" : "border-zinc-300 bg-white"
                }`}
                style={{
                  width: `${activePreset.width}px`,
                  height: `${activePreset.height}px`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                }}
              >
                {/* Device Header Bar */}
                <div
                  className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono shrink-0 select-none ${
                    isDark ? "border-zinc-800/80 bg-zinc-950 text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                    </div>
                    <span className="ml-2 font-bold">{activePreset.label}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 font-mono">
                    {previewSource ? "Vercel Port 5173" : "Virtual Sandboxed Iframe"}
                  </span>
                </div>

                {/* Embedded Frame */}
                <div className="flex-1 w-full h-full relative bg-white">
                  {isBuilding && (
                    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center mb-3 animate-pulse">
                        <svg className="w-6 h-6 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold">AI Sedang Merancang &amp; Menjalankan Aplikasi...</h3>
                      <p className="text-xs text-zinc-300 max-w-sm mt-1 leading-relaxed">
                        Mengompilasi PRD ke antarmuka nyata dan menyalakan server di Vercel Sandbox.
                      </p>
                    </div>
                  )}

                  <iframe
                    key={refreshKey}
                    src={previewSource || undefined}
                    srcDoc={!previewSource ? clientHtml : undefined}
                    sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                    className="w-full h-full border-none"
                    title="Usick One Sandbox Live Preview"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Collapsible Build Logs / Terminal Drawer ── */}
          {showLogsDrawer && (
            <div
              className={`border-t flex flex-col h-44 shrink-0 transition-all font-mono text-xs ${
                isDark ? "bg-[#070a10] border-zinc-800 text-zinc-300" : "bg-zinc-950 border-zinc-800 text-zinc-300"
              }`}
            >
              <div className="px-4 py-2 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold text-[11px] text-zinc-200">Terminal &amp; Sandbox Build Logs</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBuildLogs([])}
                    className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowLogsDrawer(false)}
                    className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 text-[11px] leading-relaxed">
                {buildLogs.length === 0 ? (
                  <div className="text-zinc-500 italic">Belum ada aktivitas terminal log.</div>
                ) : (
                  buildLogs.map((log, i) => (
                    <div key={i} className="text-zinc-300">
                      <span className="text-zinc-500">&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
