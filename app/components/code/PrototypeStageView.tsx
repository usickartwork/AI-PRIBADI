"use client";

import React, { useState } from "react";
import { PrototypeState } from "./types";
import { RevisionBar } from "./RevisionBar";

interface PrototypeStageViewProps {
  prototypeState: PrototypeState;
  onApproveAndBuild: () => void;
  onRequestRevision?: (instruction: string) => void;
  isDark?: boolean;
}

export function PrototypeStageView({
  prototypeState,
  onApproveAndBuild,
  onRequestRevision,
  isDark = true,
}: PrototypeStageViewProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenNewTab = () => {
    const blob = new Blob([prototypeState.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in-50 duration-300">
      {/* Top Controller Strip */}
      <div className={`px-4 sm:px-8 py-3 border-b flex flex-wrap items-center justify-between gap-4 ${
        isDark ? "bg-[#0f1015] border-white/10" : "bg-white border-zinc-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Interactive Prototype v{prototypeState.version}</span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                deviceMode === "desktop" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                deviceMode === "mobile" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Mobile
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-xl text-xs border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition"
            title="Refresh Prototype"
          >
            ↻
          </button>
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition"
          >
            Buka Tab Baru ↗
          </button>
          <button
            type="button"
            onClick={onApproveAndBuild}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition shadow-lg cursor-pointer"
          >
            Approve Prototype &amp; Build App →
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-black/40 flex items-center justify-center p-4 overflow-auto">
        <div
          className={`h-full transition-all duration-300 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black ${
            deviceMode === "mobile" ? "w-[390px] max-h-[844px]" : "w-full max-w-6xl"
          }`}
        >
          <iframe
            key={refreshKey}
            srcDoc={prototypeState.html}
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
            className="w-full h-full border-none"
            title="Interactive Application Prototype Preview"
          />
        </div>
      </div>

      {/* Revision Copilot Bar */}
      {onRequestRevision && (
        <div className="p-4 border-t border-white/10 bg-[#0c0d12]">
          <div className="max-w-6xl mx-auto">
            <RevisionBar
              currentStage="prototype"
              onSubmitRevision={onRequestRevision}
              isDark={isDark}
            />
          </div>
        </div>
      )}
    </div>
  );
}
