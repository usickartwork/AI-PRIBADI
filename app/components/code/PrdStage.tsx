"use client";

import React, { useState } from "react";
import { ProjectPRD, ProjectFeature, ProjectArchitecture } from "../CodeWorkspace";
import { StageStatus } from "./types";

interface PrdStageProps {
  isDark: boolean;
  prd?: ProjectPRD;
  features?: ProjectFeature[];
  userFlow?: string;
  architecture?: ProjectArchitecture;
  status: StageStatus;
  onUpdatePrd: (updatedPrd: ProjectPRD) => void;
  onApprovePrdAndContinue: () => void;
  onRegeneratePrd?: () => void;
  isRegenerating?: boolean;
}

export function PrdStage({
  isDark,
  prd,
  features = [],
  userFlow,
  architecture,
  status,
  onUpdatePrd,
  onApprovePrdAndContinue,
  onRegeneratePrd,
  isRegenerating = false,
}: PrdStageProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const nfrData = prd?.nonFunctional || prd?.nonFunctionalRequirements || [];
  const [editableOverview, setEditableOverview] = useState(prd?.overview || "");
  const [editableGoals, setEditableGoals] = useState((prd?.goals || []).join("\n"));
  const [editableUsers, setEditableUsers] = useState((prd?.targetUsers || []).join("\n"));
  const [editableNfr, setEditableNfr] = useState(nfrData.join("\n"));

  const isApproved = status === "approved";

  const handleSaveEdits = () => {
    if (!prd) return;
    const splitNfr = editableNfr
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const updated: ProjectPRD = {
      ...prd,
      overview: editableOverview,
      goals: editableGoals
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean),
      targetUsers: editableUsers
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean),
      nonFunctional: splitNfr,
      nonFunctionalRequirements: splitNfr,
    };
    onUpdatePrd(updated);
    setIsEditing(false);
  };

  const sections = [
    { id: "overview", title: "1. Ringkasan & Problem Statement", count: prd?.overview ? "✓" : "-" },
    { id: "goals", title: "2. Sasaran (Goals & Non-Goals)", count: `${prd?.goals?.length || 0} item` },
    { id: "users", title: "3. Target Pengguna (Audience)", count: `${prd?.targetUsers?.length || 0} persona` },
    { id: "features", title: "4. Kebutuhan Fungsional & Fitur", count: `${features.length} modul` },
    { id: "flow", title: "5. Alur Pengguna (User Flow)", count: userFlow ? "✓" : "-" },
    { id: "nfr", title: "6. Kebutuhan Non-Fungsional", count: `${nfrData.length} item` },
    { id: "arch", title: "7. Arsitektur & Kebutuhan Data", count: architecture ? "✓" : "-" },
  ];

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
              Tahap 2: PRD
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
              {isApproved ? "Disetujui (Approved)" : "Menunggu Persetujuan"}
            </span>
          </div>

          <span className="text-xs text-zinc-500 hidden md:inline">
            • Spesifikasi lengkap kebutuhan produk sebelum pembuatan desain
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onRegeneratePrd && (
            <button
              type="button"
              disabled={isRegenerating}
              onClick={onRegeneratePrd}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                  : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
              }`}
              title="Generate Ulang PRD dengan AI"
            >
              <svg
                className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRegenerating ? "Memperbarui..." : "Generate Ulang"}</span>
            </button>
          )}

          {isEditing ? (
            <button
              type="button"
              onClick={handleSaveEdits}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              Simpan Perubahan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditableOverview(prd?.overview || "");
                setEditableGoals((prd?.goals || []).join("\n"));
                setEditableUsers((prd?.targetUsers || []).join("\n"));
                setEditableNfr(nfrData.join("\n"));
                setIsEditing(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                  : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-700"
              }`}
            >
              Edit PRD
            </button>
          )}

          {/* Primary Approval CTA */}
          <button
            type="button"
            onClick={onApprovePrdAndContinue}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
            }`}
          >
            <span>{isApproved ? "Lanjut ke Desain" : "Approve PRD & Lanjut Desain"}</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main Content Split (Outline + Document Viewer) ─────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Outline Sidebar (Hidden on small mobile) */}
        <aside
          className={`w-64 shrink-0 border-r overflow-y-auto p-4 space-y-1 hidden md:block select-none ${
            isDark ? "bg-[#101014] border-white/10" : "bg-zinc-50 border-black/10"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
            Struktur Dokumen PRD
          </div>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveSection(s.id);
                const el = document.getElementById(`prd-sec-${s.id}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                activeSection === s.id
                  ? isDark
                    ? "bg-white/10 text-white font-bold"
                    : "bg-black/10 text-black font-bold"
                  : isDark
                  ? "text-zinc-400 hover:text-white hover:bg-white/5"
                  : "text-zinc-600 hover:text-black hover:bg-black/5"
              }`}
            >
              <span className="truncate">{s.title}</span>
              <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-1">
                {s.count}
              </span>
            </button>
          ))}
        </aside>

        {/* Right: Document Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 max-w-4xl mx-auto w-full">
          {/* Section 1: Overview */}
          <section id="prd-sec-overview" className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              1. Ringkasan Produk & Masalah (Overview & Problem Statement)
            </h3>
            {isEditing ? (
              <textarea
                value={editableOverview}
                onChange={(e) => setEditableOverview(e.target.value)}
                rows={4}
                className={`w-full rounded-2xl p-4 text-sm outline-none border ${
                  isDark
                    ? "bg-zinc-950 border-white/10 text-white"
                    : "bg-zinc-50 border-black/10 text-zinc-900"
                }`}
              />
            ) : (
              <div
                className={`p-4 sm:p-5 rounded-2xl border leading-relaxed text-sm ${
                  isDark ? "bg-[#141418] border-white/5 text-zinc-300" : "bg-white border-black/5 text-zinc-700"
                }`}
              >
                {prd?.overview || "Belum ada ringkasan overview. Klik Edit PRD untuk menambahkan."}
              </div>
            )}
          </section>

          {/* Section 2: Goals & Non-Goals */}
          <section id="prd-sec-goals" className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              2. Sasaran Produk (Goals & Non-Goals)
            </h3>
            {isEditing ? (
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Pisahkan per baris</label>
                <textarea
                  value={editableGoals}
                  onChange={(e) => setEditableGoals(e.target.value)}
                  rows={4}
                  className={`w-full rounded-2xl p-4 text-sm outline-none border ${
                    isDark
                      ? "bg-zinc-950 border-white/10 text-white"
                      : "bg-zinc-50 border-black/10 text-zinc-900"
                  }`}
                />
              </div>
            ) : (
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                  isDark ? "bg-[#141418] border-white/5" : "bg-white border-black/5"
                }`}
              >
                {(prd?.goals && prd.goals.length > 0) ? (
                  prd.goals.map((g, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <span className="font-mono text-xs text-zinc-500 shrink-0 mt-0.5">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <span>{g}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">Belum ada sasaran yang didefinisikan.</p>
                )}
              </div>
            )}
          </section>

          {/* Section 3: Target Users */}
          <section id="prd-sec-users" className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              3. Target Pengguna (Audience Persona)
            </h3>
            {isEditing ? (
              <textarea
                value={editableUsers}
                onChange={(e) => setEditableUsers(e.target.value)}
                rows={3}
                placeholder="Pisahkan per baris"
                className={`w-full rounded-2xl p-4 text-sm outline-none border ${
                  isDark
                    ? "bg-zinc-950 border-white/10 text-white"
                    : "bg-zinc-50 border-black/10 text-zinc-900"
                }`}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(prd?.targetUsers && prd.targetUsers.length > 0) ? (
                  prd.targetUsers.map((u, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex items-center gap-3 ${
                        isDark ? "bg-[#141418] border-white/5" : "bg-white border-black/5"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-500/10 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-zinc-300">{u}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">Belum ada target pengguna yang ditentukan.</p>
                )}
              </div>
            )}
          </section>

          {/* Section 4: Functional Requirements & Features */}
          <section id="prd-sec-features" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                4. Kebutuhan Fungsional & Fitur ({features.length} Modul)
              </h3>
            </div>

            <div className="space-y-3">
              {features.map((f, idx) => (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                    isDark ? "bg-[#141418] border-white/5" : "bg-white border-black/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-zinc-500/10 text-zinc-400">
                        FR-{String(idx + 1).padStart(2, "0")}
                      </span>
                      <span>{f.name}</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 uppercase">
                      {f.priority || "High"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: User Flow */}
          <section id="prd-sec-flow" className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              5. Alur Pengguna (Primary User Flow)
            </h3>
            <div
              className={`p-4 sm:p-5 rounded-2xl border text-sm font-mono leading-relaxed whitespace-pre-wrap ${
                isDark ? "bg-[#141418] border-white/5 text-zinc-300" : "bg-white border-black/5 text-zinc-700"
              }`}
            >
              {userFlow || "Alur pengguna standar: Landing Page -> Pilihan Item / Layanan -> Detail & Opsi -> Konfirmasi & Aksi"}
            </div>
          </section>

          {/* Section 6: Non-Functional Requirements */}
          <section id="prd-sec-nfr" className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              6. Kebutuhan Non-Fungsional (Security, Performance, Responsiveness)
            </h3>
            {isEditing ? (
              <textarea
                value={editableNfr}
                onChange={(e) => setEditableNfr(e.target.value)}
                rows={3}
                placeholder="Pisahkan per baris"
                className={`w-full rounded-2xl p-4 text-sm outline-none border ${
                  isDark
                    ? "bg-zinc-950 border-white/10 text-white"
                    : "bg-zinc-50 border-black/10 text-zinc-900"
                }`}
              />
            ) : (
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                  isDark ? "bg-[#141418] border-white/5" : "bg-white border-black/5"
                }`}
              >
                {nfrData.length > 0 ? (
                  nfrData.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">
                    Mendukung responsivitas mobile & desktop, waktu muat cepat, dan validasi input.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Bottom Approval Card */}
          <div
            className={`p-5 rounded-3xl border text-center space-y-3 ${
              isDark ? "bg-[#16161c] border-white/10" : "bg-zinc-100 border-black/10"
            }`}
          >
            <h4 className="text-sm font-bold">
              {isApproved
                ? "PRD Ini Telah Disetujui (Approved)"
                : "Sudah Selesai Meninjau Dokumen PRD?"}
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Setelah disetujui, spesifikasi PRD ini akan menjadi acuan resmi bagi AI untuk merancang
              antarmuka di tahap Desain.
            </p>
            <button
              type="button"
              onClick={onApprovePrdAndContinue}
              className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer ${
                isDark
                  ? "bg-white hover:bg-zinc-200 text-black shadow-black/40"
                  : "bg-black hover:bg-zinc-800 text-white shadow-zinc-900/20"
              }`}
            >
              {isApproved ? "Lanjut ke Tahap Desain" : "Approve PRD & Lanjut ke Desain"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
