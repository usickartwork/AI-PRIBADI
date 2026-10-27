"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Search, Play, Camera, Sparkles } from "lucide-react";

interface HomeFeatureSectionsProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

interface FeatureCardData {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  promptPlaceholder: string;
  actionText: string;
  chips: string[];
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  urlPath: string;
  aspectRatios?: string[];
  colSpan?: string;
}

const COLLAGE_CARDS: FeatureCardData[] = [
  {
    id: "card-chat",
    category: "AI CHAT MULTI-MODEL",
    title: "Ruang Kerja AI Multi-Model",
    subtitle:
      "Beralih instan antara Claude 3.7 Sonnet, Gemini 2.5 Flash, DeepSeek R1, dan GPT-4o dalam satu riwayat percakapan.",
    promptPlaceholder: "Ask AI a question or make a request...",
    actionText: "Kirim",
    chips: [
      "Analisis Finansial Q3",
      "Rangkum Dokumen Riset",
      "Review Kode TypeScript",
      "Strategi Go-To-Market",
    ],
    imageSrc: "/showcase/ai-chat.png",
    imageWidth: 1024,
    imageHeight: 589,
    urlPath: "onemind.web.id/workspace/chat",
    colSpan: "lg:col-span-12",
  },
  {
    id: "card-code",
    category: "ONE CODE STUDIO",
    title: "Selamat Datang, apa yang ingin Anda bangun?",
    subtitle:
      "Rancang ide aplikasi atau website Anda bersama One code. Dari wawancara kebutuhan hingga dokumen PRD lengkap.",
    promptPlaceholder: "Tulis ide project Anda (misal: Aku mau buat web katalog baju)...",
    actionText: "One code →",
    chips: [
      "Katalog Busana Modern",
      "E-Commerce Multi-Vendor",
      "Platform Belajar Online",
      "SaaS Keuangan Pribadi",
    ],
    imageSrc: "/showcase/one-code.png",
    imageWidth: 1024,
    imageHeight: 593,
    urlPath: "onemind.web.id/workspace/code",
    colSpan: "lg:col-span-6",
  },
  {
    id: "card-music",
    category: "MUSIC ONE",
    title: "Mau dengar apa hari ini?",
    subtitle:
      "Streaming musik audio jernih bebas jeda iklan, dengan lirik realtime sinkron dan stasiun radio siaran 24/7 LIVE.",
    promptPlaceholder: "Cari lagu, artis, atau album favorit Anda...",
    actionText: "Putar",
    chips: [
      "Top Hits Indonesia 2026",
      "Global Chill & Lofi Beats",
      "Deep Work Coding Waves",
      "Indie Acoustic Sanctuary",
    ],
    imageSrc: "/showcase/music-one.png",
    imageWidth: 1024,
    imageHeight: 591,
    urlPath: "onemind.web.id/workspace/music",
    colSpan: "lg:col-span-6",
  },
  {
    id: "card-schedule",
    category: "SMART SCHEDULE",
    title: "Smart Schedule Assistant",
    subtitle:
      "What would you like to schedule today? Atur jadwal rapat, blok waktu fokus, hingga deadline tugas secara otomatis.",
    promptPlaceholder: "Ask Schedule AI to add or manage your schedule...",
    actionText: "Jadwalkan",
    chips: [
      "Rapat Mingguan Tim",
      "Fokus Deep Work 2 Jam",
      "Deadline Peluncuran Fitur",
      "Sinkron Google Calendar",
    ],
    imageSrc: "/showcase/schedule.png",
    imageWidth: 1024,
    imageHeight: 592,
    urlPath: "onemind.web.id/workspace/schedule",
    colSpan: "lg:col-span-6",
  },
  {
    id: "card-image",
    category: "ONE IMAGE STUDIO",
    title: "Deskripsikan gambar Anda",
    subtitle:
      "Studio kreasi visual dengan kendali rasio aspek kustom, preset gaya artistik, dan rendering resolusi ultra-tinggi.",
    promptPlaceholder: "Deskripsikan visual imajinasi Anda secara detail...",
    actionText: "Generate",
    aspectRatios: ["1:1 Persegi", "16:9 Lanskap", "9:16 Potret", "4:3 Klasik"],
    chips: [
      "Pin Minimalist",
      "Baris Depan Cinematic",
      "Origami 3D Papercraft",
      "Sommelier Warm Film",
      "Pelatih Photoreal",
    ],
    imageSrc: "/showcase/one-image.png",
    imageWidth: 1024,
    imageHeight: 591,
    urlPath: "onemind.web.id/workspace/image",
    colSpan: "lg:col-span-6",
  },
  {
    id: "card-faith",
    category: "FAITH HUB",
    title: "Apa yang sedang ada di dalam hatimu hari ini?",
    subtitle:
      "Ruang hening dan perenungan pribadi untuk mencurahkan isi hati, pergumulan, atau ucapan syukur dalam ketenangan damai.",
    promptPlaceholder: "Tuliskan apa yang ada di dalam hatimu hari ini...",
    actionText: "Bagikan",
    chips: [
      "Membangun Hubungan dengan Allah",
      "Mencari Kedamaian Batin",
      "Mengatasi Kekhawatiran",
      "Keluarga & Relasi",
      "Ucapan Syukur Hari Ini",
    ],
    imageSrc: "/showcase/faith-hub.png",
    imageWidth: 1024,
    imageHeight: 587,
    urlPath: "onemind.web.id/workspace/faith",
    colSpan: "lg:col-span-12",
  },
];

export function HomeFeatureSections({
  onGetStarted,
  onOpenPricing,
  isDark = true,
}: HomeFeatureSectionsProps) {
  const handleAction = () => {
    onGetStarted?.("signup");
  };

  return (
    <section className="relative w-full py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
      {/* Section Header with Scroll-triggered Animation */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-14"
      >
        <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
          Eksplorasi Antarmuka
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-2">
          Seluruh Ruang Kerja dalam Satu Kolase.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Semua modul dirancang terpadu, bersih, dan langsung siap digunakan tanpa perlu berpindah-pindah aplikasi.
        </p>
      </motion.div>

      {/* ─── BENTO COLLAGE GRID (All features visible directly) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {COLLAGE_CARDS.map((card, idx) => (
          <motion.div
            key={card.id}
            id={card.id}
            initial={{ opacity: 0, y: 45, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.7,
              delay: (idx % 2) * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`scroll-mt-24 col-span-1 ${card.colSpan || "lg:col-span-6"} rounded-3xl border border-white/10 bg-zinc-950/80 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl flex flex-col justify-between hover:border-white/20 transition-all duration-300 group`}
          >
            {/* Card Content Top */}
            <div>
              <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
                {card.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1.5 leading-snug">
                {card.title}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {card.subtitle}
              </p>

              {/* Aspect Ratio Selector (One Image Card) */}
              {card.aspectRatios && (
                <div className="flex items-center gap-1.5 my-3 flex-wrap">
                  {card.aspectRatios.map((ratio, rIdx) => (
                    <span
                      key={ratio}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-colors ${
                        rIdx === 0
                          ? "bg-white text-black font-semibold"
                          : "bg-zinc-900 border border-white/10 text-zinc-400"
                      }`}
                    >
                      {ratio}
                    </span>
                  ))}
                </div>
              )}

              {/* Authentic Interactive Prompt Simulation Bar */}
              <div
                onClick={handleAction}
                className="mt-4 mb-4 p-2 sm:p-2.5 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-md flex items-center justify-between gap-2.5 cursor-pointer hover:border-white/30 transition-all"
              >
                <div className="flex items-center gap-2 pl-2 text-zinc-400 text-xs sm:text-sm flex-1 truncate">
                  {card.id === "card-music" ? (
                    <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  ) : card.id === "card-faith" ? (
                    <Camera className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  ) : null}
                  <span className="truncate">{card.promptPlaceholder}</span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-100 transition-colors shrink-0"
                >
                  <span>{card.actionText}</span>
                  {card.id === "card-music" ? (
                    <Play className="h-3 w-3 fill-black" />
                  ) : card.id === "card-image" ? (
                    <Sparkles className="h-3 w-3" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Clean Suggestion Pills (No emoji clutter) */}
              <div className="flex flex-wrap items-center gap-1.5 mb-5">
                {card.chips.map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={handleAction}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium text-zinc-400 border border-white/10 bg-zinc-900/50 hover:text-white hover:border-white/20 hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Window Frame with Full Uncut Screenshot */}
            <div className="w-full mt-2 rounded-2xl border border-white/10 bg-black/60 p-2 sm:p-2.5 shadow-inner">
              {/* Window Chrome Top Bar */}
              <div className="flex items-center justify-between pb-2 px-2 border-b border-white/10 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500/80" />
                  <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
                  <span className="h-2 w-2 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-mono text-[10px] text-zinc-500 hidden sm:inline">
                    {card.urlPath}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Live Workspace</span>
              </div>

              {/* Complete, Uncut Full Image Display */}
              <div className="relative mt-2 w-full rounded-lg overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                <Image
                  src={card.imageSrc}
                  alt={card.title}
                  width={card.imageWidth}
                  height={card.imageHeight}
                  className="w-full h-auto object-contain block select-none group-hover:scale-[1.01] transition-transform duration-500"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority={idx === 0}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
export default HomeFeatureSections;
