"use client";

import { Check, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export interface HomePricingSectionProps {
  isDark?: boolean;
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
}

export function HomePricingSection({
  isDark = true,
  onGetStarted,
  onOpenPricing,
}: HomePricingSectionProps) {
  const handleSelectPlan = (planId: "free" | "pro") => {
    if (planId === "free") {
      onGetStarted?.("signup");
    } else {
      if (onOpenPricing) onOpenPricing();
      else onGetStarted?.("signup");
    }
  };

  const plans = [
    {
      id: "free" as const,
      name: "Free",
      price: "Rp0",
      period: "selamanya",
      badge: null,
      desc: "Eksplorasi modul esensial One Mind tanpa biaya langganan selamanya.",
      features: [
        "10.000 AI Credits / Hari (Reset harian 00:00 WIB)",
        "Model Flagship Usick One — Mesin AI utama cepat & adaptif",
        "Voice Assistant Realtime & Input Suara Percakapan",
        "Mode Browse — Penelusuran web & verifikasi fakta terkini",
        "50 Code Credits / Hari: Studio PRD & Perancang Ide Aplikasi",
        "Smart Schedule: Hingga 3 agenda aktif dengan perintah teks alami",
        "Faith Hub: Ruang kontemplasi pribadi, catatan doa & renungan",
        "Catatan Pintar (AI Notebook) & Sinkronisasi sesi",
        "Penalaran AI: Mode Cepat (Faster) & Seimbang (Balanced)",
        "Tersedia gratis selamanya tanpa butuh kartu kredit",
      ],
      buttonText: "Mulai Gratis",
      popular: false,
    },
    {
      id: "pro" as const,
      name: "Pro",
      price: "Rp49.000",
      period: "/bulan",
      badge: "PILIHAN UTAMA",
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
    <section id="section-pricing" className="scroll-mt-24 relative w-full py-20 sm:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-x-clip">
      {/* ─── SECTION HEADER ────────────────────────────────────────────────── */}
      <ScrollReveal y={24} duration={0.6} className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
        <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          Paket &amp; Kuota Harian
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1.5 leading-tight">
          Pilihan Paket Sederhana.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
          Mulai gratis selamanya atau nikmati akses penuh tanpa batas ke semua model AI terbaik. Kuota kredit diperbarui otomatis setiap hari pukul 00:00 WIB.
        </p>
      </ScrollReveal>

      {/* ─── 2-COLUMN PRICING CARDS ────────────────────────────────────────── */}
      <ScrollReveal y={24} delay={0.1} duration={0.65}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto items-stretch">
          {plans.map((p) => {
            const isPro = p.popular;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  isPro
                    ? "bg-zinc-950/80 backdrop-blur-md border border-white/30 shadow-[0_0_40px_-15px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
                    : "bg-zinc-950/60 backdrop-blur-md border border-white/10"
                }`}
              >
                <div>
                  {/* Plan Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                      <span>{p.name}</span>
                      {isPro && <Sparkles className="h-4 w-4 text-white" />}
                    </h3>
                    {p.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white text-black shadow-xs">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Price Display */}
                  <div className="flex items-baseline gap-1.5 my-4">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                      {p.price}
                    </span>
                    <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                      {p.period}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
                    {p.desc}
                  </p>

                  {/* Feature List */}
                  <div className="space-y-3 pt-6 border-t border-white/10 mb-8">
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                          isPro ? "bg-white text-black" : "bg-white/10 text-white"
                        }`}>
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(p.id)}
                    className={`w-full py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isPro
                        ? "bg-white text-black hover:bg-zinc-200 shadow-md hover:scale-[1.01] active:scale-[0.99]"
                        : "bg-white/10 text-white hover:bg-white/15 border border-white/10 hover:border-white/20 active:scale-[0.99]"
                    }`}
                  >
                    <span>{p.buttonText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>

      {/* ─── RESET NOTE & DEDICATED LINK ───────────────────────────────────── */}
      <div className="mt-12 text-center flex flex-col items-center gap-3">
        <p className="text-xs text-zinc-500">
          Semua kuota AI Credits &amp; Code Credits di-reset secara otomatis setiap hari pukul 00:00 WIB.
        </p>
        <Link
          href="/harga"
          className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
        >
          Lihat rincian lengkap halaman harga &rarr;
        </Link>
      </div>
    </section>
  );
}

export default HomePricingSection;
