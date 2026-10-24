"use client";

import React, { useState } from "react";
import {
  ProductBuilderStage,
  StageStatus,
  STAGE_CONFIG,
} from "./types";

interface ProductBuilderHeaderProps {
  isDark: boolean;
  projectTitle: string;
  onRenameProject: (newTitle: string) => void;
  currentStage: ProductBuilderStage;
  stageStatuses: Record<ProductBuilderStage, StageStatus>;
  onSelectStage: (stage: ProductBuilderStage) => void;
  onBackToProjects: () => void;
  onTogglePanel?: () => void;
  onOpenLegacyView?: (view: "mindmap" | "chat") => void;
  onExportClick?: () => void;
  isSaving?: boolean;
}

export function ProductBuilderHeader({
  isDark,
  projectTitle,
  onRenameProject,
  currentStage,
  stageStatuses,
  onSelectStage,
  onBackToProjects,
  onTogglePanel,
  onOpenLegacyView,
  onExportClick,
  isSaving,
}: ProductBuilderHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectTitle);

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== projectTitle) {
      onRenameProject(trimmed);
    }
    setIsEditingTitle(false);
  };

  const getStatusBadge = (status: StageStatus) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",
          className: isDark
            ? "bg-white/15 text-white border-white/20"
            : "bg-black/10 text-black border-black/15",
          dot: "✓",
        };
      case "in_progress":
        return {
          label: "In Progress",
          className: isDark
            ? "bg-white/10 text-zinc-200 border-white/10"
            : "bg-black/5 text-zinc-800 border-black/10",
          dot: "●",
        };
      case "ready_for_review":
        return {
          label: "Review",
          className: isDark
            ? "bg-white/20 text-white border-white/30"
            : "bg-black/15 text-black border-black/25",
          dot: "◎",
        };
      case "needs_update":
        return {
          label: "Update",
          className: isDark
            ? "bg-white/10 text-zinc-400 border-dashed border-white/20"
            : "bg-black/5 text-zinc-600 border-dashed border-black/20",
          dot: "!",
        };
      case "failed":
        return {
          label: "Failed",
          className: isDark
            ? "bg-white/10 text-zinc-300 border-white/20"
            : "bg-black/10 text-zinc-700 border-black/20",
          dot: "✕",
        };
      case "not_started":
      default:
        return {
          label: "Draft",
          className: isDark
            ? "bg-zinc-800/40 text-zinc-500 border-zinc-800"
            : "bg-zinc-200/50 text-zinc-400 border-zinc-200",
          dot: "○",
        };
    }
  };

  const stages: ProductBuilderStage[] = [
    "idea",
    "prd",
    "design",
    "prototype",
    "build",
    "editor",
    "test_debug",
  ];

  return (
    <header
      className={`shrink-0 z-30 border-b select-none transition-colors ${
        isDark
          ? "bg-[#101014]/95 border-white/10 text-white backdrop-blur-md"
          : "bg-white/95 border-black/10 text-zinc-900 backdrop-blur-md"
      }`}
    >
      {/* ── Top Bar: Title & Meta Actions ───────────────────────── */}
      <div className="px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onTogglePanel && (
            <button
              type="button"
              onClick={onTogglePanel}
              className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ${
                isDark
                  ? "text-zinc-400 hover:text-white hover:bg-white/5"
                  : "text-zinc-600 hover:text-black hover:bg-black/5"
              }`}
              title="Menu Navigasi"
              aria-label="Menu Navigasi"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={onBackToProjects}
            className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold ${
              isDark
                ? "text-zinc-400 hover:text-white hover:bg-white/5"
                : "text-zinc-600 hover:text-black hover:bg-black/5"
            }`}
            title="Kembali ke Daftar Project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Projects</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 dark:bg-white/10 hidden sm:block" />

          {/* Inline Editable Title */}
          <div className="min-w-0 flex items-center gap-2">
            {isEditingTitle ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveTitle();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleSaveTitle}
                  autoFocus
                  maxLength={60}
                  className={`text-sm sm:text-base font-bold rounded-lg px-2 py-0.5 outline-none border ${
                    isDark
                      ? "bg-zinc-900 border-white/20 text-white"
                      : "bg-zinc-100 border-black/20 text-zinc-900"
                  }`}
                />
                <button
                  type="submit"
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold cursor-pointer ${
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  Simpan
                </button>
              </form>
            ) : (
              <div
                onClick={() => {
                  setTitleInput(projectTitle);
                  setIsEditingTitle(true);
                }}
                className="group flex items-center gap-1.5 cursor-pointer min-w-0"
                title="Klik untuk mengubah nama project"
              >
                <h1 className="text-sm sm:text-base font-bold truncate max-w-[180px] sm:max-w-md">
                  {projectTitle || "Untitled Product"}
                </h1>
                <svg
                  className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            )}

            {/* Sync / Save Indicator */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 shrink-0">
              {isSaving ? (
                <span className="flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span className="hidden md:inline">Menyimpan...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden md:inline">Tersimpan</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Legacy Tools & Export */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenLegacyView && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenLegacyView("chat")}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? "text-zinc-400 hover:text-white hover:bg-white/5"
                    : "text-zinc-600 hover:text-black hover:bg-black/5"
                }`}
                title="Tanya AI / Diskusi Project"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="hidden lg:inline">Tanya AI</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenLegacyView("mindmap")}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? "text-zinc-400 hover:text-white hover:bg-white/5"
                    : "text-zinc-600 hover:text-black hover:bg-black/5"
                }`}
                title="Peta Rencana (Mindmap)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden lg:inline">Mindmap</span>
              </button>
            </div>
          )}

          {onExportClick && (
            <button
              type="button"
              onClick={onExportClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900"
              }`}
              title="Export Blueprint Proyek"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 5-Stage Stepper Bar ──────────────────────────────────── */}
      <div className="px-3 sm:px-6 py-2 overflow-x-auto no-scrollbar border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2 min-w-max mx-auto sm:justify-center">
          {stages.map((stageId, index) => {
            const config = STAGE_CONFIG[stageId];
            const isActive = currentStage === stageId;
            const status = stageStatuses[stageId] || "not_started";
            const badge = getStatusBadge(status);

            return (
              <React.Fragment key={stageId}>
                <button
                  type="button"
                  onClick={() => onSelectStage(stageId)}
                  className={`group flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? "bg-white text-black shadow-md font-bold"
                        : "bg-black text-white shadow-md font-bold"
                      : isDark
                      ? "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5"
                      : "bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-black border border-black/5"
                  }`}
                  title={config.description}
                >
                  {/* Step Number Circle */}
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                      isActive
                        ? isDark
                          ? "bg-black text-white"
                          : "bg-white text-black"
                        : isDark
                        ? "bg-white/10 text-zinc-300"
                        : "bg-black/10 text-zinc-700"
                    }`}
                  >
                    {config.number}
                  </span>

                  {/* Stage Label */}
                  <span className="whitespace-nowrap">{config.label}</span>

                  {/* Stage Status Badge */}
                  <span
                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                      isActive
                        ? isDark
                          ? "bg-black/10 text-black border-black/20"
                          : "bg-white/20 text-white border-white/30"
                        : badge.className
                    }`}
                  >
                    {badge.label}
                  </span>
                </button>

                {/* Arrow connector between stages */}
                {index < stages.length - 1 && (
                  <svg
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isDark ? "text-zinc-600" : "text-zinc-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
}
