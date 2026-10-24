"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ProjectItem } from "../CodeWorkspace";
import { AppBuilderState, BuildCheckpoint } from "./types";
import { injectSandboxSecurity, PreviewDevice, DEVICE_PRESETS } from "../CodeWorkspace";

interface CodeEditorStageProps {
  isDark: boolean;
  project: ProjectItem;
  appBuilderState: AppBuilderState;
  onUpdateFile: (path: string, content: string) => void;
  onSelectFile: (path: string) => void;
  onCreateCheckpoint: (summary: string) => void;
  onRestoreCheckpoint: (checkpoint: BuildCheckpoint) => void;
  onProceedToTestDebug: () => void;
  onDownloadZip: () => void;
}

export function CodeEditorStage({
  isDark,
  project,
  appBuilderState,
  onUpdateFile,
  onSelectFile,
  onCreateCheckpoint,
  onRestoreCheckpoint,
  onProceedToTestDebug,
  onDownloadZip,
}: CodeEditorStageProps) {
  const files = useMemo(() => appBuilderState.files || {}, [appBuilderState.files]);
  const activePath = appBuilderState.activeFilePath || Object.keys(files)[0] || "app/page.tsx";
  const activeContent = files[activePath] || "";

  const [editBuffer, setEditBuffer] = useState<string>(activeContent);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [splitRatio, setSplitRatio] = useState<"code_only" | "split" | "preview_only">("split");
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [checkpointNote, setCheckpointNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync buffer when activePath changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setEditBuffer(files[activePath] || "");
      setHasUnsavedChanges(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [activePath, files]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditBuffer(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSaveActiveFile = () => {
    onUpdateFile(activePath, editBuffer);
    setHasUnsavedChanges(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Cmd+S / Ctrl+S
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSaveActiveFile();
      return;
    }
    // Indent with 2 spaces on Tab
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newText = editBuffer.substring(0, start) + "  " + editBuffer.substring(end);
      setEditBuffer(newText);
      setHasUnsavedChanges(true);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(editBuffer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCreateSnapshot = () => {
    const note = checkpointNote.trim() || `Pembaruan pada ${activePath}`;
    handleSaveActiveFile();
    onCreateCheckpoint(note);
    setCheckpointNote("");
  };

  const securedHtml = useMemo(() => {
    return injectSandboxSecurity(project.generatedHtml || "");
  }, [project.generatedHtml]);

  const lines = editBuffer.split("\n");
  const currentPreset = DEVICE_PRESETS[device];
  const checkpoints = appBuilderState.checkpoints || [];

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
        isDark ? "bg-[#090d16] text-zinc-100" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div
        className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? "border-white/10 bg-[#121216]" : "border-black/10 bg-white"
        }`}
      >
        {/* Left: Stage info & Split mode toggles */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
            Tahap 6 dari 7
          </span>
          <span className="text-xs font-bold hidden sm:inline">Code Editor & Live Preview</span>

          {/* View mode switcher */}
          <div
            className={`flex items-center p-0.5 rounded-xl border ml-2 ${
              isDark ? "bg-zinc-900 border-white/10" : "bg-zinc-100 border-black/10"
            }`}
          >
            <button
              type="button"
              onClick={() => setSplitRatio("code_only")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                splitRatio === "code_only"
                  ? isDark
                    ? "bg-white text-black font-bold"
                    : "bg-black text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Hanya Kode
            </button>
            <button
              type="button"
              onClick={() => setSplitRatio("split")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                splitRatio === "split"
                  ? isDark
                    ? "bg-white text-black font-bold"
                    : "bg-black text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setSplitRatio("preview_only")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                splitRatio === "preview_only"
                  ? isDark
                    ? "bg-white text-black font-bold"
                    : "bg-black text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Pratinjau
            </button>
          </div>
        </div>

        {/* Right: Checkpoint & Next stage CTA */}
        <div className="flex items-center gap-2">
          {/* Checkpoint drawer toggle */}
          <button
            type="button"
            onClick={() => setShowCheckpoints(!showCheckpoints)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              showCheckpoints
                ? isDark
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-black/15 text-black border-black/30"
                : isDark
                ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Checkpoints ({checkpoints.length})</span>
          </button>

          {/* Download Zip */}
          <button
            type="button"
            onClick={onDownloadZip}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              isDark ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300" : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
            }`}
            title="Download Full Project ZIP"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">ZIP</span>
          </button>

          {/* Advance to Test & Debug */}
          <button
            type="button"
            onClick={onProceedToTestDebug}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
            }`}
          >
            <span>Uji & Diagnostik</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main Tri-Pane Body ──────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left: Virtual File Tree */}
        <aside
          className={`w-56 sm:w-64 border-r flex flex-col shrink-0 select-none ${
            isDark ? "bg-[#101014] border-white/10" : "bg-white border-black/10"
          }`}
        >
          <div className="p-3 border-b border-inherit flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-zinc-400">Proyek Virtual</span>
            <span className="font-mono text-zinc-500 text-[11px]">{Object.keys(files).length} file</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
            {Object.keys(files).map((fPath) => {
              const isActive = fPath === activePath;
              const isTsx = fPath.endsWith(".tsx") || fPath.endsWith(".ts");
              return (
                <button
                  key={fPath}
                  type="button"
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      handleSaveActiveFile();
                    }
                    onSelectFile(fPath);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition ${
                    isActive
                      ? isDark
                        ? "bg-white text-black font-bold shadow-xs"
                        : "bg-black text-white font-bold shadow-xs"
                      : isDark
                      ? "text-zinc-400 hover:text-white hover:bg-white/5"
                      : "text-zinc-600 hover:text-black hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs">
                    {isTsx ? "📄" : fPath.endsWith(".json") ? "📦" : fPath.endsWith(".css") ? "🎨" : "📝"}
                  </span>
                  <span className="truncate flex-1">{fPath}</span>
                  {isActive && hasUnsavedChanges && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Monospace Code Editor */}
        {splitRatio !== "preview_only" && (
          <div className="flex-1 flex flex-col min-w-0 min-h-0 border-r border-inherit">
            {/* Editor File Tab Header */}
            <div
              className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono ${
                isDark ? "bg-black/40 border-white/10 text-zinc-300" : "bg-zinc-100 border-black/10 text-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold">{activePath}</span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] text-zinc-400 italic">● belum disimpan</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveActiveFile}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                    hasUnsavedChanges
                      ? isDark
                        ? "bg-white text-black border-white font-bold"
                        : "bg-black text-white border-black font-bold"
                      : isDark
                      ? "bg-white/5 border-white/10 text-zinc-400"
                      : "bg-black/5 border-black/10 text-zinc-600"
                  }`}
                >
                  Simpan (⌘S)
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`p-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                    isDark ? "bg-white/5 border-white/10 text-zinc-400 hover:text-white" : "bg-black/5 border-black/10 text-zinc-600 hover:text-black"
                  }`}
                  title="Salin Isi File"
                >
                  {copied ? "✓ Tersalin" : "Salin"}
                </button>
              </div>
            </div>

            {/* Code Body with Gutter */}
            <div className="flex-1 flex min-h-0 relative overflow-hidden bg-[#0d0f17]">
              {/* Line Numbers Gutter */}
              <div className="w-12 py-3 px-2 bg-black/40 text-right font-mono text-xs text-zinc-600 select-none shrink-0 overflow-hidden border-r border-white/5">
                {lines.map((_, i) => (
                  <div key={i} className="leading-relaxed">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea Editor */}
              <textarea
                value={editBuffer}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                className="flex-1 h-full p-3 font-mono text-xs text-zinc-200 bg-transparent outline-none resize-none leading-relaxed overflow-auto whitespace-pre tab-2"
                spellCheck={false}
              />
            </div>

            {/* Status Footer */}
            <div
              className={`px-4 py-1.5 border-t flex items-center justify-between text-[11px] font-mono ${
                isDark ? "bg-black/40 border-white/10 text-zinc-500" : "bg-zinc-100 border-black/10 text-zinc-500"
              }`}
            >
              <span>{lines.length} baris | {editBuffer.length} karakter</span>
              <span>UTF-8 | TypeScript</span>
            </div>
          </div>
        )}

        {/* Right: Live Interactive Sandboxed Preview */}
        {splitRatio !== "code_only" && (
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-pattern">
            {/* Preview Toolbar */}
            <div
              className={`px-4 py-2 border-b flex items-center justify-between shrink-0 ${
                isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold">Pratinjau Interaktif</span>
              </div>

              {/* Device Selector */}
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
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer capitalize ${
                      device === d
                        ? isDark
                          ? "bg-white text-black font-bold"
                          : "bg-black text-white font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Iframe Canvas Container */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <div
                className="transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white"
                style={{
                  width: device === "desktop" ? "100%" : `${currentPreset.width}px`,
                  maxWidth: device === "desktop" ? "100%" : `${currentPreset.width}px`,
                  height: "100%",
                  maxHeight: `${currentPreset.height}px`,
                }}
              >
                <iframe
                  title="App Live Preview"
                  srcDoc={securedHtml}
                  sandbox="allow-scripts allow-modals allow-forms"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Checkpoints / Rollback Flyout Drawer ────────────── */}
        {showCheckpoints && (
          <aside
            className={`w-80 border-l flex flex-col justify-between shrink-0 select-none z-30 shadow-2xl ${
              isDark ? "bg-[#101014] border-white/10 text-white" : "bg-white border-black/10 text-zinc-900"
            }`}
          >
            <div className="p-4 border-b border-inherit flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Version Checkpoints
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Snapshot kode dengan pemulihan 1-klik (Rollback)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckpoints(false)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Checkpoint list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {checkpoints.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Belum ada checkpoint tersimpan. Buat snapshot pertama Anda di bawah.
                </div>
              ) : (
                checkpoints.map((cp) => (
                  <div
                    key={cp.id}
                    className={`p-3 rounded-2xl border space-y-2 ${
                      isDark ? "bg-zinc-900/70 border-white/10" : "bg-zinc-50 border-black/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold">Checkpoint #{cp.version}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(cp.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-snug">{cp.summary}</p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {Object.keys(cp.files).length} file
                      </span>
                      <button
                        type="button"
                        onClick={() => onRestoreCheckpoint(cp)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                          isDark
                            ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                            : "bg-black/10 hover:bg-black/20 border-black/15 text-black"
                        }`}
                      >
                        Pulihkan
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create Snapshot Footer */}
            <div className="p-4 border-t border-inherit space-y-2 bg-black/20">
              <input
                type="text"
                value={checkpointNote}
                onChange={(e) => setCheckpointNote(e.target.value)}
                placeholder="Catatan checkpoint (e.g. perbaiki navbar)..."
                className={`w-full rounded-xl px-3 py-2 text-xs outline-none border transition ${
                  isDark
                    ? "bg-zinc-900 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                    : "bg-white border-black/10 text-zinc-900 placeholder-zinc-400 focus:border-black/30"
                }`}
              />
              <button
                type="button"
                onClick={handleCreateSnapshot}
                className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md ${
                  isDark ? "bg-white hover:bg-zinc-200 text-black" : "bg-black hover:bg-zinc-800 text-white"
                }`}
              >
                + Buat Checkpoint Baru
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
