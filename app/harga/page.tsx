"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { LandingNavbar } from "@/components/ui/landing-navbar";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
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
      badge: "GRATIS SELAMANYA",
      desc: "Sempurna untuk eksplorasi AI harian, tanya jawab cepat, dan pembuatan prototipe kode dasar.",
      features: [
        { text: "10.000 AI Credits (Reset Harian)", included: true },
        { text: "50 Code Credits Studio PRD (Reset Harian)", included: true },
        { text: "Usick One Flagship & Voice Assistant", included: true },
        { text: "Upaya Penalaran: Mode Faster & Balanced", included: true },
        { text: "Smart Schedule (Maks. 3 Jadwal Aktif)", included: true },
        { text: "Catatan Pintar (AI Notebook)", included: true },
        { text: "Upaya Penalaran: Mode Max (Mendalam)", included: false },
        { text: "Model Eksternal (Claude, Gemini, GPT, DeepSeek)", included: false },
        { text: "Streaming Music One & Lirik Realtime", included: false },
        { text: "Messages Realtime Chat Pribadi", included: false },
        { text: "Studio Generator Gambar AI", included: false },
      ],
      buttonText: "Mulai Gratis Sekarang",
      buttonVariant: "outline",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "Rp49.000",
      period: "/bulan",
      badge: "PALING POPULER",
      desc: "Akses penuh ke seluruh model AI terbaik dunia, penalaran Mode Max, dan seluruh fitur produktivitas.",
      features: [
        { text: "100.000 AI Credits (Reset Harian)", included: true },
        { text: "200 Code Credits Studio PRD (Reset Harian)", included: true },
        { text: "Semua Model AI (Claude 3.7, Gemini 2.5, GPT-4o, DeepSeek)", included: true },
        { text: "Akses Penuh Mode Max Reasoning (Mendalam)", included: true },
        { text: "Streaming Music One Penuh & Music Connect", included: true },
        { text: "Messages Realtime Chat & Panggilan Pribadi", included: true },
        { text: "Studio Generator & Terjemahan Gambar AI", included: true },
        { text: "Smart Schedule (Hingga 50 Jadwal Aktif)", included: true },
        { text: "Reset Kuota Otomatis Setiap 00:00 WIB", included: true },
        { text: "Prioritas Kecepatan Server & Early Access", included: true },
      ],
      buttonText: "Upgrade ke Pro",
      buttonVariant: "primary",
      popular: true,
    },
    {
      id: "ultra",
      name: "Ultra",
      price: "Coming Soon",
      period: "",
      badge: "AKAN DATANG",
      desc: "Dirancang untuk tim profesional, agensi, dan kebutuhan komputasi AI berkapasitas sangat tinggi.",
      features: [
        { text: "500.000 AI Credits (Reset Harian)", included: true },
        { text: "1.000 Code Credits Studio PRD", included: true },
        { text: "Seluruh Keunggulan Paket Pro", included: true },
        { text: "Smart Schedule Tanpa Batas (Unlimited)", included: true },
        { text: "Dedicated Dedicated Compute Instance", included: true },
        { text: "Automasi Alur Kerja Multi-Agen Khusus", included: true },
      ],
      buttonText: "Segera Hadir",
      buttonVariant: "disabled",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white selection:bg-white/20 overflow-x-hidden">
      {/* Top Navbar */}
      <LandingNavbar onGetStarted={openAuth} isDark={true} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 sm:px-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-[#E1E0CC] text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          Transparan & Kuota Segar Harian
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          Paket Langganan <br />
          <span className="bg-gradient-to-r from-white via-[#E1E0CC] to-zinc-400 bg-clip-text text-transparent">
            One Mind Ekosistem.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Mulai gratis selamanya dengan kuota terbarukan setiap hari, atau nikmati kebebasan tanpa batas dengan paket Pro hanya seharga secangkir kopi.
        </motion.p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-8 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((p) => {
            const isPopular = p.popular;
            return (
              <div
                key={p.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? "bg-gradient-to-b from-white/[0.08] via-zinc-950 to-zinc-950 border-2 border-[#E1E0CC]/70 shadow-2xl shadow-black/80 md:-translate-y-2"
                    : "bg-zinc-950/60 border border-white/15 hover:border-white/25 backdrop-blur-xl"
                }`}
              >
                {/* Popular Pill Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#E1E0CC] text-black text-[11px] font-black tracking-wider uppercase shadow-md">
                    {p.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    {!isPopular && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 my-4">
                    <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{p.price}</span>
                    {p.period && <span className="text-xs text-zinc-400 font-medium">{p.period}</span>}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">{p.desc}</p>

                  <div className="space-y-3 pt-6 border-t border-white/10 mb-8">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        {feat.included ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                        )}
                        <span className={feat.included ? "text-zinc-200 font-medium" : "text-zinc-500 line-through"}>
                          {feat.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={p.buttonVariant === "disabled"}
                    onClick={() => openAuth("signup")}
                    className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      p.buttonVariant === "primary"
                        ? "bg-[#E1E0CC] text-black hover:bg-white shadow-xl hover:scale-102"
                        : p.buttonVariant === "disabled"
                        ? "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/15"
                    }`}
                  >
                    <span>{p.buttonText}</span>
                    {p.buttonVariant !== "disabled" && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Credit Reset Guarantee Infographic */}
      <section className="py-16 px-6 sm:px-10 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-8 sm:p-10 backdrop-blur-xl">
          <RefreshCw className="h-8 w-8 text-[#E1E0CC] mx-auto mb-3" />
          <h3 className="text-xl sm:text-2xl font-bold text-white">Reset Otomatis Setiap 24 Jam</h3>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Tidak perlu cemas kehabisan kuota permanen. Setiap hari tepat pukul 00:00 WIB, kuota kredit AI dan Code Credits Anda akan diisi ulang secara penuh tanpa biaya tambahan.
          </p>
        </div>
      </section>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Seputar Harga & Langganan"
        subtitle="FAQ Paket, Kuota Kredit, & Pembayaran"
        categories={{
          "pricing": "Paket & Kredit",
          "ai-chat": "Model & Fitur",
          "security": "Keamanan Transaksi",
        }}
        faqData={ONE_MIND_FAQ_DATA}
      />

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
