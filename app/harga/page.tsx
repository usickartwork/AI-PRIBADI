"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
      desc: "Untuk eksplorasi harian dan pembuatan prototipe dasar.",
      features: [
        "10.000 AI Credits (Reset Harian)",
        "50 Code Credits Studio (Reset Harian)",
        "Usick One Flagship & Voice Assistant",
        "Smart Schedule (Maks. 3 Jadwal)",
        "Catatan Pintar (AI Notebook)",
      ],
      buttonText: "Mulai Gratis",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "Rp49.000",
      period: "/bulan",
      desc: "Akses penuh ke semua model AI terbaik dunia dan seluruh fitur.",
      features: [
        "100.000 AI Credits (Reset Harian)",
        "200 Code Credits Studio (Reset Harian)",
        "Semua Model AI (Claude, Gemini, GPT, DeepSeek)",
        "Mode Max Reasoning (Penalaran Mendalam)",
        "Streaming Musik Penuh & Lirik Realtime",
        "Pesan Realtime & Panggilan Pribadi",
        "Smart Schedule (Hingga 50 Jadwal)",
      ],
      buttonText: "Upgrade ke Pro",
      popular: true,
    },
  ];

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-[#09090b] text-white selection:bg-white/20 antialiased font-sans">
      
      {/* Minimal Top Header (Clean Back Link Only) */}
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
        <button
          type="button"
          onClick={() => openAuth("signin")}
          className="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        
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
                    ? "bg-zinc-950 border-2 border-[#E1E0CC] shadow-2xl"
                    : "bg-zinc-950/60 border border-white/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-white">{p.name}</h3>
                    {isPopular && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#E1E0CC] text-black">
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
                        <Check className="h-3.5 w-3.5 text-[#E1E0CC] shrink-0 mt-0.5" />
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
                      ? "bg-[#E1E0CC] hover:bg-white text-black shadow-lg"
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

      {/* Clean Footer */}
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
