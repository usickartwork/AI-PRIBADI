"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Sparkles,
  GitBranch,
  Play,
  Cpu,
} from "lucide-react";
import { LandingNavbar } from "@/components/ui/landing-navbar";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

export default function CodeStudioLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [activeViewport, setActiveViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const steps = [
    {
      num: "01",
      title: "Interactive Interview (AI Grill-Me)",
      desc: "AI mengajukan pertanyaan mendalam untuk mengklarifikasi arsitektur, kebutuhan database, dan preferensi desain Anda.",
      tag: "Wawancara Kebutuhan",
    },
    {
      num: "02",
      title: "Deep PRD Generation",
      desc: "Menyusun Product Requirements Document komprehensif lengkap dengan User Stories, API schemas, dan flowchart sistem.",
      tag: "Dokumentasi Arsitektur",
    },
    {
      num: "03",
      title: "Multi-File Code Synthesis",
      desc: "Menghasilkan kode sumber modular terstruktur: komponen UI, state management, hook kustom, dan backend handlers.",
      tag: "Sintesis Kode Otomatis",
    },
    {
      num: "04",
      title: "Live Preview & 1-Click Export",
      desc: "Jalankan langsung di kanvas interaktif dengan uji responsif, lalu unduh seluruh proyek sebagai file ZIP siap deploy.",
      tag: "Eksekusi & Deployment",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white selection:bg-white/20 overflow-x-hidden">
      {/* Top Navbar */}
      <LandingNavbar onGetStarted={openAuth} isDark={true} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 sm:px-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-[#E1E0CC] text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <Code2 className="h-3.5 w-3.5 text-blue-400" />
          Autonomous Full-Stack Code Studio
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          Dari Ide Hingga Aplikasi Nyata <br />
          <span className="bg-gradient-to-r from-white via-[#E1E0CC] to-blue-400 bg-clip-text text-transparent">
            Dalam Hitungan Detik.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Bukan sekadar potongan kode terpisah. Code Studio menyusun PRD komprehensif, merancang arsitektur multi-file, dan menyajikan Live Preview Canvas yang bisa langsung diuji dan diekspor ke ZIP.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E1E0CC] text-black font-bold text-sm sm:text-base hover:bg-white transition-all shadow-xl hover:scale-105 cursor-pointer"
          >
            <span>Mulai Buat Proyek Gratis</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/harga"
            className="px-6 py-3.5 rounded-full border border-white/15 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 font-semibold text-sm sm:text-base transition-colors"
          >
            Kuota Code Credits
          </Link>
        </motion.div>
      </section>

      {/* Infografis 1: 4-Tahap Pipeline Otonom */}
      <section className="py-16 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-semibold text-[#E1E0CC] tracking-widest">
            INFOGRAFIS ALUR KERJA OTONOM
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
            4 Tahap Sintesis Kode Profesional
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Metodologi rekayasa perangkat lunak standar industri yang diotomatisasi secara cerdas oleh AI.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((st) => (
            <div
              key={st.num}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between hover:border-white/20 transition-all hover:-translate-y-1"
            >
              <div>
                <span className="text-3xl font-black text-[#E1E0CC]/40 font-mono">{st.num}</span>
                <span className="block mt-3 text-[10px] uppercase font-bold tracking-wider text-blue-400">
                  {st.tag}
                </span>
                <h3 className="font-bold text-base text-white mt-1">{st.title}</h3>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Infografis 2: Interactive Live Preview Canvas Showcase */}
      <section className="py-16 px-6 sm:px-10 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-semibold text-[#E1E0CC] tracking-widest">
            SIMULATOR KANVAS LIVE INTERAKTIF
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
            Uji Langsung Hasil Kode di Berbagai Ukuran Layar
          </h2>
        </div>

        {/* Viewport Switcher Controls */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveViewport("mobile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeViewport === "mobile"
                ? "bg-white text-black shadow-md scale-105"
                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile (390px)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveViewport("tablet")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeViewport === "tablet"
                ? "bg-white text-black shadow-md scale-105"
                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Tablet className="h-3.5 w-3.5" />
            <span>Tablet (768px)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveViewport("desktop")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeViewport === "desktop"
                ? "bg-white text-black shadow-md scale-105"
                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop (1440px)</span>
          </button>
        </div>

        {/* Canvas Frame Mockup */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950/80 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-zinc-500">preview.onemind.app</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Play className="h-3 w-3" /> Live Sandbox
              </span>
            </div>
          </div>

          {/* Interactive preview box */}
          <div
            className={`mx-auto bg-black border border-white/10 rounded-2xl p-6 transition-all duration-300 min-h-[300px] flex flex-col justify-between ${
              activeViewport === "mobile"
                ? "max-w-[360px]"
                : activeViewport === "tablet"
                ? "max-w-[600px]"
                : "w-full"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-mono text-zinc-300">
                  App.tsx • React 19 • Tailwind
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">0 errors • 60 FPS</span>
              </div>
              <h4 className="text-lg font-bold text-white">Full-Stack Application Ready</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Komponen interaktif, animasi Framer Motion, handler API, dan layout responsif sudah terintegrasi dan siap diekspor.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Tekan Ekspor untuk mengunduh kode</span>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export ZIP</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Ecosystem Showcase */}
      <section className="py-16 px-6 sm:px-10 max-w-6xl mx-auto text-center">
        <span className="text-xs uppercase font-semibold text-[#E1E0CC] tracking-widest">
          STANDAR TEKNOLOGI MODERN
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 mb-8">
          Didukung Penuh oleh Ekosistem Unggulan
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
          {[
            "React 19",
            "Next.js App Router",
            "TypeScript",
            "Tailwind CSS",
            "Framer Motion",
            "shadcn/ui",
            "Lucide Icons",
            "Node.js & Python",
            "REST & WebSocket",
            "HTML5 Canvas",
          ].map((tech) => (
            <span
              key={tech}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-white/10 bg-white/[0.03] text-zinc-300 shadow-xs"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum Code Studio"
        subtitle="FAQ Seputar Sintesis Kode & Ekspor"
        categories={{
          "code-studio": "Code Studio & PRD",
          "pricing": "Paket & Kuota",
          "security": "Keamanan Kode",
        }}
        faqData={ONE_MIND_FAQ_DATA}
      />

      {/* Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Bangun Ide Anda Sekarang</h2>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
          Dapatkan 50 Code Credits gratis setiap hari untuk membangun prototipe dan aplikasi utuh.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E1E0CC] text-black font-bold text-sm hover:bg-white transition-all shadow-xl cursor-pointer"
          >
            <span>Buka Code Studio Sekarang</span>
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
