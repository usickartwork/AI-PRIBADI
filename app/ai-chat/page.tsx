"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Cpu,
  Mic,
  Brain,
  ShieldCheck,
  ArrowRight,
  Layers,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import { LandingNavbar } from "@/components/ui/landing-navbar";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

export default function AIChatLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [selectedReasoning, setSelectedReasoning] = useState<"faster" | "balanced" | "max">("max");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const models = [
    { name: "Claude 3.7 Sonnet", provider: "Anthropic", tag: "Hybrid Reasoning", desc: "Pemikiran mendalam dan penulisan kode terstruktur tingkat industri." },
    { name: "Gemini 2.5 Flash", provider: "Google", tag: "Ultra Speed", desc: "Kecepatan luar biasa dengan jendela konteks raksasa untuk pemrosesan dokumen." },
    { name: "GPT-4o & GPT OSS", provider: "OpenAI / Groq", tag: "Versatile", desc: "Kecerdasan serbaguna untuk pemecahan masalah multidisiplin." },
    { name: "DeepSeek R1 Distill", provider: "DeepSeek", tag: "Math & Logic", desc: "Model penalaran open-weights paling mutakhir untuk logika eksak." },
    { name: "Qwen 3.8 Flash", provider: "Alibaba Cloud", tag: "High Efficiency", desc: "Sintesis bahasa bilingual yang sangat efisien dan akurat." },
    { name: "Usick One Flagship", provider: "Internal Flagship", tag: "Always Free", desc: "Model kencang bertenaga tanpa biaya, selalu siap 24/7." },
  ];

  const reasoningModes = {
    faster: {
      title: "Mode Faster",
      speed: "< 0.8s",
      depth: "Efisiensi Tinggi",
      desc: "Menghasilkan respons instan dalam hitungan milidetik. Ideal untuk chat cepat, koreksi tata bahasa, dan tanya jawab harian.",
    },
    balanced: {
      title: "Mode Balanced",
      speed: "1.5s - 2.5s",
      depth: "Analitis Seimbang",
      desc: "Melakukan cross-referencing konteks sebelum menjawab. Sangat tepat untuk riset, penulisan artikel, dan kompilasi data.",
    },
    max: {
      title: "Mode Max (Deep Think)",
      speed: "3s - 6s",
      depth: "Penalaran Ekstrem",
      desc: "Mengaktifkan rantai pemikiran (chain-of-thought) berlapis untuk memecahkan bug arsitektur rumit, rumus matematika, dan desain sistem.",
    },
  };

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
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          Multi-Model Intelligence Workspace
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          Satu Ruang Kerja. <br />
          <span className="bg-gradient-to-r from-white via-[#E1E0CC] to-zinc-400 bg-clip-text text-transparent">
            Semua Model AI Terbaik Dunia.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Beralih bebas antara Claude 3.7 Sonnet, Gemini 2.5 Flash, GPT-4o, DeepSeek R1, hingga Qwen 3.8. Lengkap dengan Voice Assistant Realtime dan 3 mode penalaran cerdas.
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
            <span>Mulai Percakapan AI Gratis</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/harga"
            className="px-6 py-3.5 rounded-full border border-white/15 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 font-semibold text-sm sm:text-base transition-colors"
          >
            Lihat Model & Kuota
          </Link>
        </motion.div>
      </section>

      {/* Infografis 1: Multi-Model Architecture Flow */}
      <section className="py-16 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-semibold text-[#E1E0CC] tracking-widest">
            INFOGRAFIS ALUR ARSITEKTUR
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
            Bagaimana One Mind Mengorkestrasi AI Anda
          </h2>
        </div>

        <div className="relative rounded-3xl border border-white/15 bg-zinc-950/60 p-6 sm:p-10 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Step 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-[#E1E0CC]">
                    1
                  </span>
                  <Mic className="h-5 w-5 text-zinc-400" />
                </div>
                <h3 className="font-bold text-lg text-white">Input Pengguna</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Teks mendalam, perintah suara realtime, atau lampiran dokumen dianalisis secara instan.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-zinc-500">
                Latensi masukan &lt; 50ms
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-white/20 bg-gradient-to-b from-white/[0.08] to-transparent p-6 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="h-8 w-8 rounded-full bg-[#E1E0CC] flex items-center justify-center font-bold text-sm text-black">
                    2
                  </span>
                  <Brain className="h-5 w-5 text-amber-300" />
                </div>
                <h3 className="font-bold text-lg text-[#E1E0CC]">Universal Router & Context Cache</h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Sistem memilih model paling kompeten dengan parameter penalaran optimal serta memori percakapan berlanjut.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-amber-300">
                3 Tingkat Penalaran Aktif
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-[#E1E0CC]">
                    3
                  </span>
                  <Cpu className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-white">Streaming Output & Eksekusi</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Respons di-stream secara instan dengan rendering Markdown, LaTeX math KaTeX, dan pemanggilan tool otomatis.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-emerald-400">
                Zero-Retention Enterprise Security
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infografis 2: Interactive Reasoning Efforts */}
      <section className="py-16 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-semibold text-[#E1E0CC] tracking-widest">
            KONTROL KEDALAMAN BERPIKIR
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
            3 Tingkat Upaya Penalaran (Reasoning)
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            Sesuaikan kecepatan dan kedalaman berpikir AI sesuai kompleksitas kebutuhan tugas Anda.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {(["faster", "balanced", "max"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSelectedReasoning(mode)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedReasoning === mode
                  ? "bg-white text-black shadow-lg scale-105"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {mode === "faster" ? "⚡ Faster" : mode === "balanced" ? "⚖️ Balanced" : "🧠 Mode Max"}
            </button>
          ))}
        </div>

        {/* Detail Card */}
        <div className="max-w-3xl mx-auto rounded-3xl border border-white/15 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <h3 className="text-xl font-bold text-white">{reasoningModes[selectedReasoning].title}</h3>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-zinc-400">Kecepatan: <strong className="text-white">{reasoningModes[selectedReasoning].speed}</strong></span>
              <span className="text-zinc-400">Analisis: <strong className="text-amber-300">{reasoningModes[selectedReasoning].depth}</strong></span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            {reasoningModes[selectedReasoning].desc}
          </p>
        </div>
      </section>

      {/* Model Catalog Grid */}
      <section className="py-16 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-semibold text-[#E1E0CC] tracking-widest">
            KATALOG MODEL TERHUBUNG
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
            Pilihan Model AI Kelas Dunia
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {models.map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/25 transition-all hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{m.provider}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-[#E1E0CC]">
                  {m.tag}
                </span>
              </div>
              <h3 className="font-bold text-base text-white">{m.name}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Voice Assistant Showcase */}
      <section className="py-16 px-6 sm:px-10 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] to-transparent p-8 sm:p-12 relative overflow-hidden">
          <Volume2 className="h-10 w-10 text-amber-300 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Voice Assistant Realtime</h2>
          <p className="mt-3 text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Bicara secara langsung dengan AI seperti berbicara dengan manusia. Dilengkapi orb animasi audio wave dinamis dan dukungan dwibahasa natural.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Coba Voice Chat
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum AI Chat"
        subtitle="FAQ Seputar Model & Fitur AI"
        categories={{
          "ai-chat": "AI & Voice Assistant",
          "pricing": "Paket & Kredit",
          "security": "Keamanan & Privasi",
        }}
        faqData={ONE_MIND_FAQ_DATA}
      />

      {/* Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Siap Mencoba One Mind?</h2>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
          Mulai secara gratis dengan kuota harian terbarukan otomatis setiap hari.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E1E0CC] text-black font-bold text-sm hover:bg-white transition-all shadow-xl cursor-pointer"
          >
            <span>Daftar Gratis Sekarang</span>
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
