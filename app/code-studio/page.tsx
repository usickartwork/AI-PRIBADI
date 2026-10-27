"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  FileCode,
  Smartphone,
  Tablet,
  Monitor,
  Download,
  Terminal,
  Layers,
  ArrowRight,
  GitBranch,
  Play,
  RotateCcw,
  CheckCircle2,
  FolderTree,
  FileText,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { LandingNavbar } from "@/components/ui/landing-navbar";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

export default function CodeStudioLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  
  // Interactive Code Studio Stages State
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [activeViewport, setActiveViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Pipeline simulation sequence
  const startPipelineSimulation = () => {
    if (isRunningPipeline) return;
    setIsRunningPipeline(true);
    setCurrentStage(1);

    setTimeout(() => {
      setCurrentStage(2);
      setTimeout(() => {
        setCurrentStage(3);
        setTimeout(() => {
          setCurrentStage(4);
          setIsRunningPipeline(false);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      startPipelineSimulation();
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const stages = [
    {
      num: 1,
      title: "Interactive Interview",
      subtitle: "AI Grill-Me Engine",
      icon: HelpCircle,
      desc: "AI mengajukan pertanyaan terarah untuk mengonfirmasi relasi database, arsitektur state, dan edge-cases.",
    },
    {
      num: 2,
      title: "PRD Architecture",
      subtitle: "Spesifikasi Dokumen",
      icon: FileText,
      desc: "Menyusun Product Requirements Document lengkap dengan skema tabel, API routes, dan diagram alur.",
    },
    {
      num: 3,
      title: "Multi-File Synthesis",
      subtitle: "Generasi Kode Utuh",
      icon: FolderTree,
      desc: "Menghasilkan kode modular: komponen React, server action Next.js, dan hook TypeScript siap jalan.",
    },
    {
      num: 4,
      title: "Live Canvas Sandbox",
      subtitle: "Uji & Export ZIP",
      icon: Play,
      desc: "Eksekusi langsung di kanvas interaktif dengan pengujian lintas layar dan unduhan 1-klik.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white selection:bg-white/20 overflow-x-hidden">
      {/* Top Navbar */}
      <LandingNavbar onGetStarted={openAuth} isDark={true} />

      {/* Main Studio Viewport - Direct & To the Point */}
      <main className="pt-28 pb-16 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#E1E0CC]">
              <span className="h-2 w-2 rounded-full bg-[#E1E0CC] animate-pulse" />
              <span>Sintesis Perangkat Lunak Otonom</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-2">
              Dari Wawancara Kebutuhan Hingga Aplikasi Siap Pakai.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={startPipelineSimulation}
              disabled={isRunningPipeline}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {isRunningPipeline ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-[#E1E0CC]" />
              ) : (
                <Play className="h-3.5 w-3.5 text-[#E1E0CC]" />
              )}
              <span>{isRunningPipeline ? "Menyintesis..." : "Ulangi Pipeline"}</span>
            </button>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E1E0CC] hover:bg-white text-black text-xs font-bold transition-all shadow-lg cursor-pointer"
            >
              <span>Buat Proyek Baru</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ----------------- 4-STAGE PIPELINE CONTROLLER ----------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stages.map((st) => {
            const isActive = currentStage === st.num;
            const isDone = currentStage > st.num;
            const IconComponent = st.icon;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setCurrentStage(st.num as any)}
                className={`text-left rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer relative overflow-hidden ${
                  isActive
                    ? "bg-white/[0.06] border-[#E1E0CC] shadow-lg"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                {/* Active Accent Top Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-stage-bar"
                    className="absolute top-0 left-0 right-0 h-1 bg-[#E1E0CC]"
                  />
                )}

                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      isActive
                        ? "bg-[#E1E0CC] text-black"
                        : isDone
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-zinc-500"
                    }`}
                  >
                    0{st.num}
                  </span>
                  <IconComponent
                    className={`h-4 w-4 ${isActive ? "text-[#E1E0CC]" : "text-zinc-500"}`}
                  />
                </div>

                <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  {st.subtitle}
                </div>
                <div className="font-bold text-sm sm:text-base text-white mt-0.5">
                  {st.title}
                </div>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {st.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* ----------------- DYNAMIC STAGE VIEWPORT CANVAS ----------------- */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950/90 p-5 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          
          {/* Stage 1: AI Grill-Me Discovery View */}
          {currentStage === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2 text-[#E1E0CC]">
                  <HelpCircle className="h-4 w-4" />
                  <span>Tahap 1: AI Grill-Me (Klarifikasi Kebutuhan Proyek)</span>
                </span>
                <span>3 Pertanyaan Penting</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                    Pertanyaan AI Terarah
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    "Apakah Anda memerlukan integrasi pembayaran (Midtrans/Stripe) atau sistem kuota kredit internal?"
                  </h3>
                  <div className="mt-4 space-y-2">
                    <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-[#E1E0CC]/50 text-xs text-[#E1E0CC] font-mono flex items-center justify-between">
                      <span>Pilihan: Sistem Kuota Kredit Harian Otomatis</span>
                      <CheckCircle2 className="h-4 w-4 text-[#E1E0CC]" />
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 font-mono">
                      <span>Pilihan: Direct Payment Gateway</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                    Pertanyaan Arsitektur Database
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    "Bagaimana strategi persistensi data dan manajemen status waktu-nyata?"
                  </h3>
                  <div className="mt-4 space-y-2">
                    <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-[#E1E0CC]/50 text-xs text-[#E1E0CC] font-mono flex items-center justify-between">
                      <span>Pilihan: Supabase Postgres + RLS Security Policies</span>
                      <CheckCircle2 className="h-4 w-4 text-[#E1E0CC]" />
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 font-mono">
                      <span>Pilihan: Local Storage IndexedDB Cache</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage 2: Deep PRD Generation View */}
          {currentStage === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2 text-[#E1E0CC]">
                  <FileText className="h-4 w-4" />
                  <span>Tahap 2: PRD (Product Requirements Document) Terstruktur</span>
                </span>
                <span className="text-zinc-500">prd.json / spec.md</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/70 p-5 font-mono text-xs text-zinc-300 space-y-3 leading-relaxed">
                <div className="text-[#E1E0CC] font-bold"># PRD - SaaS Task & Workflow Intelligence</div>
                <div>## 1. System Architecture Matrix</div>
                <div className="text-zinc-400 pl-4 border-l border-white/10">
                  • Frontend: Next.js 16.3 App Router, TypeScript 5.8, Tailwind CSS v4, Lucide Icons.<br />
                  • Backend: Next.js Server Actions with strict Zod Schema validation.<br />
                  • Database: Supabase PostgreSQL, Row Level Security enabled for user isolation.<br />
                  • State: Nanostores / Zustand atom subscription for sub-16ms UI updates.
                </div>
                <div>## 2. API Contracts & Endpoint Specifications</div>
                <div className="text-zinc-400 pl-4 border-l border-white/10">
                  POST /api/tasks (Create with validation)<br />
                  GET /api/tasks/stream (SSE Realtime events)
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage 3: Multi-File Synthesis View */}
          {currentStage === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2 text-[#E1E0CC]">
                  <FolderTree className="h-4 w-4" />
                  <span>Tahap 3: Sintesis Kode Multi-File Modular</span>
                </span>
                <span className="text-zinc-500">12 files generated • 0 syntax errors</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* File Tree */}
                <div className="md:col-span-4 rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs space-y-2">
                  <div className="text-zinc-500 uppercase text-[10px] tracking-wider mb-2">Project Tree</div>
                  <div className="text-white flex items-center gap-2 font-semibold">
                    <Code2 className="h-3.5 w-3.5 text-[#E1E0CC]" />
                    <span>app/page.tsx</span>
                  </div>
                  <div className="text-zinc-400 flex items-center gap-2 pl-4">
                    <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                    <span>components/KanbanBoard.tsx</span>
                  </div>
                  <div className="text-zinc-400 flex items-center gap-2 pl-4">
                    <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                    <span>hooks/useTaskStore.ts</span>
                  </div>
                  <div className="text-zinc-400 flex items-center gap-2 pl-4">
                    <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                    <span>lib/supabase-client.ts</span>
                  </div>
                </div>

                {/* Code Editor Preview */}
                <div className="md:col-span-8 rounded-2xl border border-white/10 bg-black/80 p-5 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto">
                  <div className="text-zinc-500 pb-2 mb-2 border-b border-white/5 flex items-center justify-between">
                    <span>components/KanbanBoard.tsx</span>
                    <span className="text-[#E1E0CC]">TypeScript</span>
                  </div>
                  <pre className="text-zinc-300">
{`export function KanbanBoard({ columns }: KanbanBoardProps) {
  const [items, setItems] = useState(columns);
  
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {items.map((col) => (
        <ColumnCard key={col.id} title={col.title} tasks={col.tasks} />
      ))}
    </div>
  );
}`}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage 4: Live Responsive Canvas & Export ZIP */}
          {currentStage === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Canvas Header & Viewport Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-2 text-xs font-mono text-zinc-400">preview.onemind.app</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveViewport("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      activeViewport === "mobile"
                        ? "bg-white text-black font-bold"
                        : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="h-3 w-3" />
                    <span>390px</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewport("tablet")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      activeViewport === "tablet"
                        ? "bg-white text-black font-bold"
                        : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Tablet className="h-3 w-3" />
                    <span>768px</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewport("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      activeViewport === "desktop"
                        ? "bg-white text-black font-bold"
                        : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Monitor className="h-3 w-3" />
                    <span>1440px</span>
                  </button>
                </div>
              </div>

              {/* Viewport Frame */}
              <div
                className={`mx-auto bg-black border border-white/10 rounded-2xl p-6 transition-all duration-300 min-h-[260px] flex flex-col justify-between ${
                  activeViewport === "mobile"
                    ? "max-w-[360px]"
                    : activeViewport === "tablet"
                    ? "max-w-[620px]"
                    : "w-full"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-mono text-zinc-300">
                      Live Sandbox • React 19 • 60 FPS
                    </span>
                    <span className="text-[11px] text-[#E1E0CC] font-mono font-semibold">Compiled</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">Task Intelligence Workspace</h4>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Aplikasi interaktif berhasil disintesis dan siap dijalankan tanpa kendala dependensi. Seluruh modul telah diuji di kanvas live.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-mono">Siap diekspor ke ZIP / GitHub</span>
                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E1E0CC] hover:bg-white text-black text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Project (ZIP)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Feature Highlights Grid (Monochrome & Cream) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between">
            <div>
              <GitBranch className="h-5 w-5 text-[#E1E0CC] mb-3" />
              <h3 className="font-bold text-base text-white">Struktur Proyek Modular</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Bukan kode tunggal yang membingungkan. Code Studio memecah file ke dalam komponen UI, API handler, types, dan hooks terpisah.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500">
              Clean Architecture
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between">
            <div>
              <Cpu className="h-5 w-5 text-[#E1E0CC] mb-3" />
              <h3 className="font-bold text-base text-white">Verifikasi Sintaks Otomatis</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Engine melakukan kompilasi AST sebelum kode disajikan ke kanvas untuk memastikan nol kesalahan sintaks dan tipe TypeScript.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500">
              TypeScript Strict Mode
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between">
            <div>
              <Download className="h-5 w-5 text-[#E1E0CC] mb-3" />
              <h3 className="font-bold text-base text-white">Ekspor 1-Klik Siap Deploy</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Unduh seluruh bundel proyek langsung ke file ZIP atau tautkan ke Vercel dan GitHub untuk peluncuran instan ke dunia nyata.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500">
              Zero Vendor Lock-in
            </div>
          </div>
        </div>

      </main>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum Code Studio"
        subtitle="FAQ Seputar Sintesis Kode & PRD"
        categories={{
          "code-studio": "Code Studio & PRD",
          "pricing": "Paket & Kredit",
          "security": "Keamanan & Privasi",
        }}
        faqData={ONE_MIND_FAQ_DATA}
      />

      {/* Direct Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Bangun Ide Anda Sekarang</h2>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
          Dapatkan 50 Code Credits gratis setiap hari untuk mewujudkan aplikasi nyata.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E1E0CC] text-black font-bold text-sm hover:bg-white transition-all shadow-xl cursor-pointer"
          >
            <span>Mulai Buat Aplikasi</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer01 isDark={true} onGetStarted={openAuth} />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isDark={true}
          initialMode={authMode}
          onSuccess={() => setShowAuthModal(false)}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
