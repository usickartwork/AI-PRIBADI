"use client";

import React, { useState } from "react";
import { EnhancedProjectTask, StageStatus } from "./types";
import { TaskStatus, TaskPriority } from "../CodeWorkspace";

interface AgentTasksStageProps {
  isDark: boolean;
  projectTitle: string;
  tasks: EnhancedProjectTask[];
  status: StageStatus;
  onUpdateTasks: (updatedTasks: EnhancedProjectTask[]) => void;
  onApproveTasksPlan: () => void;
  onGenerateTasksWithAI?: () => Promise<void>;
  isGenerating?: boolean;
}

export function AgentTasksStage({
  isDark,
  projectTitle,
  tasks,
  status,
  onUpdateTasks,
  onApproveTasksPlan,
  onGenerateTasksWithAI,
  isGenerating = false,
}: AgentTasksStageProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    tasks[0]?.id || null
  );
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewTab, setViewTab] = useState<"tasks" | "code_artifacts">("tasks");

  // New Task Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("HIGH");
  const [newCriteria, setNewCriteria] = useState("");
  const [copiedTaskSnippet, setCopiedTaskSnippet] = useState(false);

  const isApproved = status === "approved";

  // Filtered tasks list
  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    onUpdateTasks(updated);
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    const newTask: EnhancedProjectTask = {
      id: `TASK-${String(tasks.length + 1).padStart(3, "0")}`,
      title: newTitle.trim(),
      description: newDesc.trim() || newTitle.trim(),
      priority: newPriority,
      status: "ready",
      dependencies: [],
      acceptanceCriteria: newCriteria
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      suggestedFiles: [
        `app/components/${newTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.tsx`,
      ],
      suggestedTests: [`Test verifikasi fungsi ${newTitle}`],
    };
    onUpdateTasks([...tasks, newTask]);
    setSelectedTaskId(newTask.id);
    setNewTitle("");
    setNewDesc("");
    setNewCriteria("");
    setShowAddModal(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    onUpdateTasks(updated);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(updated[0]?.id || null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Subheader Bar ───────────────────────────────────────── */}
      <div
        className={`px-4 sm:px-8 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 select-none ${
          isDark ? "bg-[#121216] border-white/10" : "bg-white border-black/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full border bg-white/10 text-white font-bold">
              Tahap 5: Agent & Tasks
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isApproved
                  ? isDark
                    ? "bg-white/20 text-white border-white/30"
                    : "bg-black/15 text-black border-black/20"
                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
              }`}
            >
              {isApproved ? "Rencana Disetujui (Approved)" : `${tasks.length} Task Tersusun`}
            </span>
          </div>

          {/* Tab Switcher: Tasks vs Code Artifacts */}
          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? "bg-zinc-900 border-white/10" : "bg-zinc-100 border-black/10"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewTab("tasks")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewTab === "tasks"
                  ? isDark
                    ? "bg-white text-black shadow-xs font-bold"
                    : "bg-black text-white shadow-xs font-bold"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Daftar Task ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setViewTab("code_artifacts")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewTab === "code_artifacts"
                  ? isDark
                    ? "bg-white text-black shadow-xs font-bold"
                    : "bg-black text-white shadow-xs font-bold"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              Artefak Kode
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onGenerateTasksWithAI && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={onGenerateTasksWithAI}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                  : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
              }`}
              title="Generate Rencana Task dengan AI"
            >
              <svg
                className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isGenerating ? "Menyusun Tasks..." : "Generate Rencana"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              isDark
                ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Task</span>
          </button>

          {/* Primary Approval CTA */}
          <button
            type="button"
            onClick={onApproveTasksPlan}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
            }`}
          >
            <span>{isApproved ? "Rencana Telah Disetujui" : "Setujui Rencana Task"}</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Honest Execution Notice ─────────────────────────────── */}
      <div
        className={`px-4 py-1.5 text-[11px] font-mono border-b flex items-center justify-between gap-2 select-none ${
          isDark
            ? "bg-zinc-900/60 border-white/10 text-zinc-400"
            : "bg-zinc-100 border-black/10 text-zinc-600"
        }`}
      >
        <span className="truncate">
          <strong>Perencanaan Implementasi:</strong> AI merumuskan struktur task bertahap, kriteria
          penerimaan, dan rekomendasi file. Tidak ada eksekusi terminal cloud otomatis tanpa peninjauan Anda.
        </span>
      </div>

      {/* ── Main Viewport Split ─────────────────────────────────── */}
      {viewTab === "tasks" ? (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left: Tasks List */}
          <div
            className={`w-full sm:w-80 md:w-96 border-r flex flex-col shrink-0 overflow-hidden select-none ${
              isDark ? "bg-[#101014] border-white/10" : "bg-zinc-50 border-black/10"
            }`}
          >
            {/* Filter & Search Bar */}
            <div className="p-3 border-b border-black/5 dark:border-white/5 space-y-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari task..."
                className={`w-full rounded-xl px-3 py-1.5 text-xs outline-none border ${
                  isDark
                    ? "bg-zinc-900 border-white/10 text-white placeholder-zinc-500"
                    : "bg-white border-black/10 text-zinc-900 placeholder-zinc-400"
                }`}
              />

              <div className="flex items-center gap-2">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className={`flex-1 text-[11px] font-mono rounded-lg px-2 py-1 outline-none border cursor-pointer ${
                    isDark ? "bg-zinc-900 border-white/10 text-zinc-300" : "bg-white border-black/10 text-zinc-700"
                  }`}
                >
                  <option value="ALL">Semua Prioritas</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`flex-1 text-[11px] font-mono rounded-lg px-2 py-1 outline-none border cursor-pointer ${
                    isDark ? "bg-zinc-900 border-white/10 text-zinc-300" : "bg-white border-black/10 text-zinc-700"
                  }`}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ready">Ready</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                  <option value="backlog">Backlog</option>
                </select>
              </div>
            </div>

            {/* Task Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t) => {
                  const isSelected = selectedTaskId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                        isSelected
                          ? isDark
                            ? "bg-white/10 border-white/20 text-white font-bold"
                            : "bg-black/10 border-black/20 text-black font-bold"
                          : isDark
                          ? "bg-[#141418] hover:bg-[#1a1a20] border-white/5 text-zinc-300"
                          : "bg-white hover:bg-zinc-50 border-black/5 text-zinc-700 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] text-zinc-400">
                          {t.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-full border uppercase ${
                              t.priority === "CRITICAL" || t.priority === "HIGH"
                                ? isDark
                                  ? "bg-white/15 text-white border-white/20"
                                  : "bg-black/15 text-black border-black/20"
                                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {t.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-semibold truncate">
                        {t.title}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {t.description}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-zinc-500 text-center py-8">
                  Tidak ada task yang cocok dengan filter.
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected Task Details */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-3xl">
            {selectedTask ? (
              <div className="space-y-6">
                {/* Task Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full border bg-white/10 font-bold">
                      {selectedTask.id}
                    </span>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTask.status}
                        onChange={(e) =>
                          handleUpdateTaskStatus(selectedTask.id, e.target.value as TaskStatus)
                        }
                        className={`text-xs font-mono font-bold rounded-xl px-2.5 py-1 outline-none border cursor-pointer ${
                          isDark ? "bg-zinc-900 border-white/20 text-white" : "bg-white border-black/20 text-zinc-900"
                        }`}
                      >
                        <option value="ready">Status: Ready</option>
                        <option value="in_progress">Status: In Progress</option>
                        <option value="review">Status: Review</option>
                        <option value="done">Status: Done</option>
                        <option value="blocked">Status: Blocked</option>
                        <option value="backlog">Status: Backlog</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(selectedTask.id)}
                        className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg border border-white/10 cursor-pointer"
                        title="Hapus Task Ini"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold">{selectedTask.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {selectedTask.description}
                  </p>
                </div>

                {/* Acceptance Criteria */}
                <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Kriteria Penerimaan (Acceptance Criteria)
                  </h4>
                  <div
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isDark ? "bg-[#141418] border-white/5" : "bg-white border-black/5"
                    }`}
                  >
                    {(selectedTask.acceptanceCriteria && selectedTask.acceptanceCriteria.length > 0) ? (
                      selectedTask.acceptanceCriteria.map((crit, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1 shrink-0" />
                          <span>{crit}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500">
                        Belum ada kriteria eksplisit untuk task ini.
                      </p>
                    )}
                  </div>
                </div>

                {/* Suggested Files & Tests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/5 dark:border-white/5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Rekomendasi File Implementasi
                    </h4>
                    <div
                      className={`p-3 rounded-2xl border space-y-1.5 ${
                        isDark ? "bg-[#141418] border-white/5" : "bg-white border-black/5"
                      }`}
                    >
                      {(selectedTask.suggestedFiles && selectedTask.suggestedFiles.length > 0) ? (
                        selectedTask.suggestedFiles.map((file, idx) => (
                          <div key={idx} className="font-mono text-[11px] text-zinc-300 truncate">
                            📄 {file}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-zinc-500">app/components/Feature.tsx</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Rekomendasi Pengujian (Tests)
                    </h4>
                    <div
                      className={`p-3 rounded-2xl border space-y-1.5 ${
                        isDark ? "bg-[#141418] border-white/5" : "bg-white border-black/5"
                      }`}
                    >
                      {(selectedTask.suggestedTests && selectedTask.suggestedTests.length > 0) ? (
                        selectedTask.suggestedTests.map((test, idx) => (
                          <div key={idx} className="text-xs text-zinc-300">
                            🧪 {test}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-zinc-500">Verifikasi render dan integrasi</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Code Implementation Preview */}
                <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Artefak Kode Implementasi Task
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `// ${selectedTask.suggestedFiles?.[0] || 'app/components/Feature.tsx'}\n"use client";\n\nimport React, { useState } from "react";\n\nexport function ${selectedTask.title.replace(/[^a-zA-Z0-9]/g, "")}() {\n  // Implementasi: ${selectedTask.title}\n  // Kriteria: ${(selectedTask.acceptanceCriteria || []).join(", ")}\n  const [isLoading, setIsLoading] = useState(false);\n\n  return (\n    <div className="p-6 rounded-2xl border border-white/10 bg-[#121216] text-white">\n      <h3 className="text-base font-bold">${selectedTask.title}</h3>\n      <p className="text-xs text-zinc-400 mt-1">${selectedTask.description}</p>\n    </div>\n  );\n}`;
                        navigator.clipboard.writeText(snippet);
                        setCopiedTaskSnippet(true);
                        setTimeout(() => setCopiedTaskSnippet(false), 2000);
                      }}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition cursor-pointer"
                    >
                      {copiedTaskSnippet ? "✓ Tersalin!" : "Salin Kode Task"}
                    </button>
                  </div>
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0e0e12]">
                    <div className="px-3.5 py-1.5 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-black/40">
                      <span>{selectedTask.suggestedFiles?.[0] || 'app/components/Feature.tsx'}</span>
                      <span>TypeScript</span>
                    </div>
                    <pre className="p-3.5 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`"use client";

import React, { useState } from "react";

export function ${selectedTask.title.replace(/[^a-zA-Z0-9]/g, "")}() {
  // ${selectedTask.title}: ${selectedTask.description}
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-[#121216] text-white space-y-3">
      <h3 className="text-base font-bold tracking-tight">${selectedTask.title}</h3>
      <p className="text-xs text-zinc-400 leading-relaxed">${selectedTask.description}</p>
      {/* Modul implementasi kriteria penerimaan */}
    </div>
  );
}`}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 text-sm">
                Pilih task dari daftar sebelah kiri untuk melihat detailnya.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Code Artifacts Tab */
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full">
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Artefak Kode Rencana Implementasi</h3>
            <p className="text-xs text-zinc-400">
              Berikut adalah contoh struktur komponen dan API yang siap diimplementasikan berdasarkan
              PRD dan Prototype yang telah Anda setujui.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0e0e12]">
              <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400 bg-black/40">
                <span>1. Komponen Frontend Utama (React / Next.js)</span>
                <span>TypeScript</span>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`// app/components/${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}/MainView.tsx
"use client";

import React, { useState } from "react";

export function ProductMainView() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold">${projectTitle}</h1>
        <button className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs">
          Aksi Utama
        </button>
      </header>
      {/* Modul komponen sesuai spesifikasi PRD */}
    </div>
  );
}`}
              </pre>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0e0e12]">
              <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400 bg-black/40">
                <span>2. Endpoint API Backend (Next.js App Router)</span>
                <span>TypeScript</span>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`// app/api/${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validasi input dan proses data sesuai kriteria PRD
    return NextResponse.json({ success: true, data: body });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Task Modal ───────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border p-5 sm:p-6 space-y-4 shadow-2xl ${
              isDark ? "bg-[#141418] border-white/10 text-white" : "bg-white border-black/10 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Tambah Task Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  Judul Task <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Integrasi API Gateway Pembayaran"
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border ${
                    isDark ? "bg-zinc-950 border-white/10 text-white" : "bg-zinc-50 border-black/10 text-zinc-900"
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  Prioritas
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border ${
                    isDark ? "bg-zinc-950 border-white/10 text-white" : "bg-zinc-50 border-black/10 text-zinc-900"
                  }`}
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  Deskripsi Task
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Penjelasan teknis pekerjaan..."
                  className={`w-full rounded-xl p-3 text-xs outline-none border resize-none ${
                    isDark ? "bg-zinc-950 border-white/10 text-white" : "bg-zinc-50 border-black/10 text-zinc-900"
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  Kriteria Penerimaan (Pisahkan per baris)
                </label>
                <textarea
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  rows={3}
                  placeholder="e.g. Respon sukses 200 OK&#10;Data tersimpan di tabel database"
                  className={`w-full rounded-xl p-3 text-xs outline-none border resize-none ${
                    isDark ? "bg-zinc-950 border-white/10 text-white" : "bg-zinc-50 border-black/10 text-zinc-900"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!newTitle.trim()}
                onClick={handleAddTask}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 ${
                  isDark ? "bg-white text-black" : "bg-black text-white"
                }`}
              >
                Simpan Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
