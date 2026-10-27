"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Play, Camera, Sparkles } from "lucide-react";

interface HomeFeatureSectionsProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

interface ShowcaseTab {
  id: string;
  label: string;
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
}

const TABS: ShowcaseTab[] = [
  {
    id: "chat",
    label: "AI Chat",
    title: "Ruang Kerja AI Multi-Model",
    subtitle:
      "Beralih instan antara Claude 3.7 Sonnet, Gemini 2.5 Flash, DeepSeek R1, dan GPT-4o dalam satu riwayat percakapan.",
    promptPlaceholder: "Tanyakan apa saja, analisis data, atau kembangkan strategi...",
    actionText: "Kirim",
    chips: [
      "Analisis Finansial Q3",
      "Rangkum Dokumen Riset",
      "Review Kode TypeScript",
      "Strategi Go-To-Market",
    ],
    imageSrc: "/previews/preview-ai-chat.png",
    imageWidth: 1440,
    imageHeight: 900,
    urlPath: "onemind.web.id/workspace/chat",
  },
  {
    id: "code",
    label: "One Code",
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
  },
  {
    id: "music",
    label: "Music One",
    title: "Mau dengar apa hari ini?",
    subtitle:
      "Streaming musik beresolusi tinggi, bebas jeda iklan, dengan lirik realtime sinkron dan radio siaran 24/7 LIVE.",
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
  },
  {
    id: "schedule",
    label: "Schedule",
    title: "Smart Schedule Assistant",
    subtitle:
      "What would you like to schedule today? Atur jadwal rapat, blok waktu fokus, hingga deadline otomatis.",
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
  },
  {
    id: "image",
    label: "One Image",
    title: "Deskripsikan gambar Anda",
    subtitle:
      "Studio kreasi visual dengan kendali rasio aspek, preset gaya artistik, dan render beresolusi tinggi.",
    promptPlaceholder: "Deskripsikan visual imajinasi Anda secara detail...",
    actionText: "Generate",
    aspectRatios: ["1:1 Persegi", "16:9 Lanskap", "9:16 Potret", "4:3 Klasik"],
    chips: [
      "Pin Minimalist",
      "Baris Depan Cinematic",
      "Origami 3D",
      "Sommelier Warm Film",
      "Pelatih Photoreal",
    ],
    imageSrc: "/showcase/one-image.png",
    imageWidth: 1024,
    imageHeight: 591,
    urlPath: "onemind.web.id/workspace/image",
  },
  {
    id: "faith",
    label: "Faith Hub",
    title: "Apa yang sedang ada di dalam hatimu hari ini?",
    subtitle:
      "Ruang hening dan perenungan pribadi untuk mencurahkan isi hati, pergumulan, atau syukur dalam ketenangan.",
    promptPlaceholder: "Tuliskan apa yang ada di dalam hatimu hari ini...",
    actionText: "Bagikan",
    chips: [
      "Membangun Hubungan dengan Allah",
      "Mencari Kedamaian Batin",
      "Mengatasi Kekhawatiran",
      "Keluarga & Relasi",
      "Ucapan Syukur",
    ],
    imageSrc: "/showcase/faith-hub.png",
    imageWidth: 1024,
    imageHeight: 587,
    urlPath: "onemind.web.id/workspace/faith",
  },
];

export function HomeFeatureSections({
  onGetStarted,
  onOpenPricing,
  isDark = true,
}: HomeFeatureSectionsProps) {
  const [activeTabId, setActiveTabId] = useState<string>("chat");

  // Listen to tab selection events triggered from the top navbar
  useEffect(() => {
    const handleSelectTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        const found = TABS.find((t) => t.id === customEvent.detail);
        if (found) {
          setActiveTabId(found.id);
        }
      }
    };

    window.addEventListener("onemind:select-tab", handleSelectTab);
    return () => window.removeEventListener("onemind:select-tab", handleSelectTab);
  }, []);

  const activeTab = TABS.find((t) => t.id === activeTabId) || TABS[0];

  const handleAction = () => {
    onGetStarted?.("signup");
  };

  return (
    <section
      id="section-showcase"
      className="relative w-full py-16 sm:py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto scroll-mt-6"
    >
      {/* ─── TAB SWITCHER (Clean, minimal, horizontal pill bar) ─────────────── */}
      <div className="flex items-center justify-center mb-10">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-zinc-900/90 border border-white/10 backdrop-blur-xl shadow-xl max-w-full overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab.id === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── DYNAMIC TAB CONTENT ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Header Typography (No boxed icon) */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {activeTab.title}
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {activeTab.subtitle}
            </p>
          </div>

          {/* Aspect Ratio Selector (Only for One Image) */}
          {activeTab.aspectRatios && (
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              {activeTab.aspectRatios.map((ratio, idx) => (
                <span
                  key={ratio}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                    idx === 0
                      ? "bg-white text-black font-medium"
                      : "bg-zinc-900 border border-white/10 text-zinc-400"
                  }`}
                >
                  {ratio}
                </span>
              ))}
            </div>
          )}

          {/* Realistic Prompt Box (Directly matches the screenshot input bar) */}
          <div
            onClick={handleAction}
            className="w-full max-w-2xl mb-5 p-2 sm:p-2.5 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-white/30 transition-all group"
          >
            <div className="flex items-center gap-2.5 pl-3 text-zinc-400 text-xs sm:text-sm flex-1 truncate">
              {activeTab.id === "music" ? (
                <Search className="h-4 w-4 text-zinc-500 shrink-0" />
              ) : activeTab.id === "faith" ? (
                <Camera className="h-4 w-4 text-zinc-500 shrink-0" />
              ) : null}
              <span className="truncate">{activeTab.promptPlaceholder}</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold group-hover:bg-zinc-100 transition-colors shrink-0"
            >
              <span>{activeTab.actionText}</span>
              {activeTab.id === "music" ? (
                <Play className="h-3 w-3 fill-black" />
              ) : activeTab.id === "image" ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Suggestion Chips (Clean typography, no emoji clutter) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-2xl">
            {activeTab.chips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={handleAction}
                className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium text-zinc-400 border border-white/10 bg-zinc-900/60 hover:text-white hover:border-white/20 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Screenshot Frame (Full image, never cropped, complete UI visibility) */}
          <div className="w-full rounded-2xl sm:rounded-3xl border border-white/15 bg-zinc-950 p-2 sm:p-3 shadow-2xl backdrop-blur-2xl">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between pb-2.5 px-3 border-b border-white/10 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2 font-mono text-[11px] text-zinc-500 hidden sm:inline">
                  {activeTab.urlPath}
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">Tampilan Asli Workspace</span>
            </div>

            {/* Complete, Uncut Screenshot Display */}
            <div className="relative mt-2.5 w-full rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
              <Image
                src={activeTab.imageSrc}
                alt={activeTab.title}
                width={activeTab.imageWidth}
                height={activeTab.imageHeight}
                className="w-full h-auto object-contain block select-none"
                priority
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
export default HomeFeatureSections;
