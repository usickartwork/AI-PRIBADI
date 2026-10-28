"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { SiteHeader } from "@/components/ui/site-header";
import { MeshDriftBackground } from "@/components/ui/mesh-drift-background";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { AnimatePresence } from "framer-motion";
import { AuthModal } from "@/app/components/AuthModal";

export default function PricingLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "Rp0",
      period: "selamanya",
      desc: "Eksplorasi modul esensial OneMind tanpa biaya langganan selamanya.",
      features: [
        "10.000 AI Credits / Hari (Reset harian 00:00 WIB)",
        "Model Flagship OneMind — Mesin AI utama cepat & adaptif",
        "Voice Assistant Realtime & Input Suara Percakapan",
        "Mode Browse — Penelusuran web & verifikasi fakta terkini",
        "50 Code Credits / Hari: Studio PRD & Perancang Ide Aplikasi",
        "Smart Schedule: Hingga 3 agenda aktif dengan perintah teks alami",
        "Faith Hub: Ruang kontemplasi pribadi, catatan doa & renungan",
        "Catatan Pintar (AI Notebook) & Sinkronisasi sesi",
        "Penalaran AI: Mode Cepat (Faster) & Seimbang (Balanced)",
      ],
      buttonText: "Mulai Gratis",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "Rp49.000",
      period: "/bulan",
      desc: "Buka seluruh ekosistem tanpa batas, semua model AI terbaik dunia, dan kuota harian maksimal.",
      features: [
        "100.000 AI Credits / Hari (Reset harian 10x lebih besar)",
        "200 Code Credits / Hari: Studio PRD Lengkap, Arsitektur & Flow",
        "Semua Model AI Flagship Dunia: Claude 3.7 Sonnet, Gemini 3.6 Flash, DeepSeek R1 & V4, Qwen 3.8 Flash, Kimi K2, Ling 3.1, Llama 3.3 70B, GPT OSS 120B",
        "Mode Max Reasoning — Penalaran mendalam untuk masalah kompleks",
        "Music One Penuh: Streaming audio jernih bebas iklan, Lirik Realtime Karaoke, 24/7 LIVE Radio & Music Connect",
        "One Image Studio: Generator Visual AI (1:1, 16:9, 9:16, 4:3), Preset Artistik 3D/Film & Terjemahan Gambar AI",
        "Smart Schedule Pro: Hingga 50 agenda aktif, Google Calendar sync & proteksi deep work",
        "Pesan Realtime & Panggilan Suara: Chat instan terenkripsi antar pengguna",
        "Faith Hub & Catatan Pintar tanpa batas kuota simpan",
        "Prioritas Jalur Cepat Server & Akses Pertama Fitur Eksklusif",
      ],
      buttonText: "Upgrade ke Pro",
      popular: true,
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#09090b] text-white selection:bg-white/20 antialiased font-sans flex flex-col justify-between">
      {/* ─── Mesh Drift WebGL Background (Sama persis seperti di halaman Usick One) ─── */}
      <MeshDriftBackground isDark={true} />

      {/* Ambient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/25" aria-hidden="true" />

      {/* ─── SITE HEADER WITH BACK BUTTON, BRAND LOGO, NAV TABS, LOGIN ─── */}
      <SiteHeader
        showBack={true}
        backHref="/"
        activeItem="pricing"
        onGetStarted={openAuth}
        className="relative z-20 border-b border-white/[0.08] bg-black/60 backdrop-blur-xl"
      />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-24 flex-1">
        
        {/* Simple & Clean Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Paket & Kuota Harian.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Mulai gratis selamanya atau nikmati akses tak terbatas dengan Pro. Kuota diperbarui otomatis setiap 00:00 WIB.
          </p>
        </div>

        {/* 2-Column Clean Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          {plans.map((p) => {
            const isPopular = p.popular;
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  isPopular
                    ? "bg-zinc-950 border border-white/30 shadow-[0_0_40px_-15px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
                    : "bg-zinc-950/60 border border-white/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-white">{p.name}</h3>
                    {isPopular && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white text-black">
                        Pilihan Utama
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">{p.price}</span>
                    <span className="text-xs text-zinc-500">{p.period}</span>
                  </div>

                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{p.desc}</p>

                  <div className="space-y-2.5 pt-6 border-t border-white/10 mb-8">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="h-3.5 w-3.5 text-white shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className={`w-full py-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                    isPopular
                      ? "bg-white hover:bg-zinc-200 text-black shadow-lg"
                      : "bg-white/10 hover:bg-white/15 text-white"
                  }`}
                >
                  <span>{p.buttonText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Reset Note */}
        <div className="mt-12 text-center text-xs text-zinc-500">
          Semua kuota AI Credits & Code Credits di-reset secara otomatis setiap hari pukul 00:00 WIB.
        </div>

      </main>

      {/* FAQ Tabs Section */}
      <div className="relative z-10">
        <FAQ
          title="Pertanyaan Umum"
          subtitle="FAQ Harga & Kuota"
          categories={{
            "pricing": "Paket & Kredit",
            "ai-chat": "Model & Fitur",
          }}
          faqData={ONE_MIND_FAQ_DATA}
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Clean Footer */}
      <div className="relative z-10">
        <Footer01 isDark={true} onGetStarted={openAuth} />
      </div>

      {/* ─── FLOATING CREATOR ATTRIBUTION BADGE ─── */}
      <CreatorBadge alwaysVisible={true} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        isDark={true}
        initialMode={authMode}
        onSuccess={() => setShowAuthModal(false)}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
