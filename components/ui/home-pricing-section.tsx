"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

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
      desc: "Untuk eksplorasi harian dan pembuatan prototipe dasar.",
      features: [
        "10.000 AI Credits (Reset Harian)",
        "50 Code Credits Studio PRD (Reset Harian)",
        "Usick One Flagship & Voice Assistant",
        "Smart Schedule (Maks. 3 Jadwal Aktif)",
        "Catatan Pintar (AI Notebook)",
        "Reset Kuota Otomatis Setiap 00:00 WIB",
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
      desc: "Akses penuh ke semua model AI terbaik dunia dan seluruh fitur ekosistem.",
      features: [
        "100.000 AI Credits (Reset Harian)",
        "200 Code Credits Studio PRD (Reset Harian)",
        "Semua Model AI (Claude 3.7, GPT-4o, DeepSeek R1, Gemini 2.5)",
        "Mode Max Reasoning (Penalaran Mendalam)",
        "Streaming Musik Penuh, Lirik Realtime & Music Connect",
        "Pesan Realtime & Panggilan Pribadi Antar Teman",
        "Smart Schedule (Hingga 50 Jadwal Aktif)",
        "Image Studio Generator & Terjemahan Gambar AI",
      ],
      buttonText: "Upgrade ke Pro",
      popular: true,
    },
  ];

  return (
    <section id="section-pricing" className="scroll-mt-24 relative w-full py-20 sm:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-x-clip">
      {/* ─── SECTION HEADER ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-2xl mx-auto mb-16 sm:mb-20"
      >
        <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          Paket &amp; Kuota Harian
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1.5 leading-tight">
          Pilihan Paket Sederhana.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
          Mulai gratis selamanya atau nikmati akses penuh tanpa batas ke semua model AI terbaik. Kuota kredit diperbarui otomatis setiap hari pukul 00:00 WIB.
        </p>
      </motion.div>

      {/* ─── 2-COLUMN PRICING CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto items-stretch">
        {plans.map((p, idx) => {
          const isPro = p.popular;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                isPro
                  ? "bg-zinc-950 border border-white/30 shadow-[0_0_40px_-15px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
                  : "bg-zinc-950/60 border border-white/10"
              }`}
            >
              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xl text-white">{p.name}</h3>
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
            </motion.div>
          );
        })}
      </div>

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
