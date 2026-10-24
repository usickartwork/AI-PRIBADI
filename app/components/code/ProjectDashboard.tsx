"use client";

import React, { useState } from "react";
import { ProjectItem } from "../CodeWorkspace";
import { normalizeProductBuilderData, ProductBuilderStage, TargetPlatform } from "./types";

interface ProjectDashboardProps {
  isDark: boolean;
  projects: ProjectItem[];
  onSelectProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onTogglePanel?: () => void;
}

const STAGE_LABELS: Record<ProductBuilderStage, { label: string; step: number }> = {
  idea: { label: "1. Idea", step: 1 },
  prd: { label: "2. PRD", step: 2 },
  design: { label: "3. Design", step: 3 },
  prototype: { label: "4. Prototype", step: 4 },
  tasks: { label: "5. Agent & Tasks", step: 5 },
};

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "Baru saja";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "Kemarin";
  if (diffDay < 30) return `${diffDay} hari yang lalu`;
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProjectDashboard({
  isDark,
  projects,
  onSelectProject,
  onCreateNewProject,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject,
  onTogglePanel,
}: ProjectDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<"all" | TargetPlatform>("all");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const builder = normalizeProductBuilderData(p);
    const matchesSearch =
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (builder.ideaBrief?.idea || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform =
      filterPlatform === "all" || builder.ideaBrief?.targetPlatform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const handleStartRename = (e: React.MouseEvent, p: ProjectItem) => {
    e.stopPropagation();
    setRenamingId(p.id);
    setRenameValue(p.title);
  };

  const handleSaveRename = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (renameValue.trim()) {
      onRenameProject(projectId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(null);
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${isDark ? "bg-[#090d16] text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}>
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-20 px-4 sm:px-8 py-4 border-b flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl ${
          isDark ? "bg-[#101014]/90 border-white/10" : "bg-white/90 border-black/10"
        }`}
      >
        <div className="flex items-center gap-3">
          {onTogglePanel && (
            <button
              type="button"
              onClick={onTogglePanel}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isDark ? "hover:bg-white/10 text-zinc-300" : "hover:bg-black/5 text-zinc-700"
              }`}
              title="Menu Navigasi"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight">AI Product Builder Workspace</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ubah ide produk Anda menjadi PRD, Desain UI, Prototype, dan Task implementasi terstruktur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCreateNewProject}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
              isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Buat Proyek Baru</span>
          </button>
        </div>
      </header>

      {/* ── Main Dashboard Body ───────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border max-w-md w-full ${
              isDark ? "bg-[#141418] border-white/10 text-white" : "bg-white border-black/10 text-zinc-900"
            }`}
          >
            <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari proyek, deskripsi, atau ide..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Platform Filters */}
          <div
            className={`flex items-center p-0.5 rounded-2xl border shrink-0 ${
              isDark ? "bg-zinc-900 border-white/10" : "bg-zinc-100 border-black/10"
            }`}
          >
            {[
              { id: "all", label: "Semua" },
              { id: "website", label: "Web" },
              { id: "mobile", label: "Mobile" },
              { id: "both", label: "Web & App" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterPlatform(tab.id as "all" | TargetPlatform)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  filterPlatform === tab.id
                    ? isDark
                      ? "bg-white text-black font-bold shadow-xs"
                      : "bg-black text-white font-bold shadow-xs"
                    : isDark
                    ? "text-zinc-400 hover:text-white"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Project Cards Grid ─────────────────────────────────── */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredProjects.map((p) => {
              const builder = normalizeProductBuilderData(p);
              const stageInfo = STAGE_LABELS[builder.currentStage] || STAGE_LABELS.idea;
              const stageStatus = builder.stageStatuses[builder.currentStage] || "in_progress";
              const targetPlatform = builder.ideaBrief?.targetPlatform || "website";

              const isRenaming = renamingId === p.id;
              const isDeleting = deleteConfirmId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`group p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative hover:shadow-xl ${
                    isDark
                      ? "bg-[#121216] hover:bg-[#16161c] border-white/10 hover:border-white/20"
                      : "bg-white hover:bg-zinc-50 border-black/10 hover:border-black/20"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Platform Badge & Last Updated */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-lg border border-white/10 bg-white/5 text-zinc-300">
                        {targetPlatform === "both" ? "Web & Mobile" : targetPlatform === "mobile" ? "Mobile App" : "Website"}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {formatRelativeTime(p.updatedAt)}
                      </span>
                    </div>

                    {/* Title & Rename Form */}
                    {isRenaming ? (
                      <form onSubmit={(e) => handleSaveRename(e, p.id)} className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl text-sm font-bold bg-zinc-900 border border-white/20 text-white outline-none"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-black cursor-pointer"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelRename}
                            className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <h3 className="text-base font-bold text-zinc-100 group-hover:text-white tracking-tight line-clamp-1">
                        {p.title}
                      </h3>
                    )}

                    {/* Description or Idea Snippet */}
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {p.description || builder.ideaBrief?.idea || "Tidak ada ringkasan proyek."}
                    </p>
                  </div>

                  {/* Bottom Metadata & Actions */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-2">
                    {/* Stage status indicator */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      <span className="text-[11px] font-semibold text-zinc-300">
                        {stageInfo.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 capitalize">
                        • {stageStatus.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Action buttons (Rename, Duplicate, Delete) */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(e, p)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Ganti Nama Proyek"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateProject(p.id);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Duplikasi Proyek"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>

                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(p.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-200 text-black hover:bg-white cursor-pointer"
                          >
                            Hapus?
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="text-[10px] text-zinc-400 hover:text-white cursor-pointer px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(p.id);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition cursor-pointer"
                          title="Hapus Proyek"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div
            className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 max-w-2xl mx-auto my-8 ${
              isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
            }`}
          >
            <div className="w-14 h-14 rounded-3xl bg-white/10 mx-auto flex items-center justify-center">
              <svg className="w-7 h-7 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {searchQuery ? "Tidak ada proyek yang sesuai pencarian" : "Belum Ada Proyek"}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                {searchQuery
                  ? `Tidak menemukan proyek dengan kata kunci "${searchQuery}". Coba kata kunci lain atau reset filter.`
                  : "Mulai perjalanan pembuatan produk Anda dari ide awal, menyusun PRD, merender desain antarmuka, hingga menyiapkan tugas implementasi."}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onCreateNewProject}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-sm ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Mulai Buat Proyek Sekarang</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
