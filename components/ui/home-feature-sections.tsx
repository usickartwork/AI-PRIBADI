"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

interface HomeFeatureSectionsProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

interface FeatureSectionItem {
  id: string;
  category: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  highlights: string[];
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  urlPath: string;
}

const FEATURE_ITEMS: FeatureSectionItem[] = [
  {
    id: "card-chat",
    category: "AI Chat",
    tabLabel: "AI Chat",
    title: "Ruang Percakapan Cerdas & Penelusuran Web",
    subtitle:
      "Berinteraksi langsung dengan asisten pintar bertenaga mesin Usick One untuk menganalisis data, merangkai ide, hingga menelusuri web secara realtime.",
    highlights: [
      "Mesin percakapan cerdas Usick One yang responsif dan terarah",
      "Mode Browse untuk pencarian dan verifikasi fakta web langsung",
      "Dukungan input suara dan audio interaktif realtime",
      "Terintegrasi otomatis dengan riwayat sesi dan catatan pribadi",
    ],
    imageSrc: "/showcase/ai-chat.png",
    imageWidth: 1024,
    imageHeight: 589,
    urlPath: "onemind.web.id/workspace/chat",
  },
  {
    id: "card-code",
    category: "One Code",
    tabLabel: "One Code",
    title: "Rancang Ide Aplikasi & Dokumen PRD Lengkap",
    subtitle:
      "Transformasikan ide kasar menjadi dokumen spesifikasi produk (PRD) yang matang, arsitektur modul, hingga rekomendasi alur aplikasi siap bangun.",
    highlights: [
      "Wawancara kebutuhan cerdas untuk membedah konsep aplikasi",
      "Template starter: Katalog Busana, E-Commerce, LMS, hingga SaaS",
      "Penyusunan arsitektur sistem dan flow pengguna terstruktur",
      "Ekspor dokumen spesifikasi teknis dan panduan implementasi",
    ],
    imageSrc: "/showcase/one-code.png",
    imageWidth: 1024,
    imageHeight: 593,
    urlPath: "onemind.web.id/workspace/code",
  },
  {
    id: "card-music",
    category: "Music One",
    tabLabel: "Music One",
    title: "Streaming Musik & Lirik Berjalan Realtime",
    subtitle:
      "Fokus bekerja ditemani pemutar musik audio jernih tanpa jeda iklan, dilengkapi lirik karaoke sinkron dan stasiun siaran radio populer 24/7 LIVE.",
    highlights: [
      "Pemutar audio resolusi tinggi yang ringan dan bebas distraksi",
      "Tampilan lirik realtime yang sinkron mengikuti alunan nada",
      "Saluran siaran radio 24/7 LIVE: Top Hits, Chill Beats, dan Deep Work",
      "Koleksi playlist rekomendasi cerdas yang dapat disesuaikan",
    ],
    imageSrc: "/showcase/music-one.png",
    imageWidth: 1024,
    imageHeight: 591,
    urlPath: "onemind.web.id/workspace/music",
  },
  {
    id: "card-schedule",
    category: "Smart Schedule",
    tabLabel: "Smart Schedule",
    title: "Manajemen Jadwal & Asisten Produktivitas",
    subtitle:
      "Kelola kalender kerja, blok waktu fokus, dan tenggat waktu tugas harian secara otomatis lewat perintah bahasa alami bersama Schedule Assistant.",
    highlights: [
      "Perintah jadwal cerdas: tambahkan agenda hanya dengan mengetik perintah",
      "Blok waktu deep work terproteksi untuk konsentrasi tanpa interupsi",
      "Sinkronisasi agenda harian dengan kalender digital Anda",
      "Pengingat otomatis untuk memastikan tidak ada milestone terlewat",
    ],
    imageSrc: "/showcase/schedule.png",
    imageWidth: 1024,
    imageHeight: 592,
    urlPath: "onemind.web.id/workspace/schedule",
  },
  {
    id: "card-image",
    category: "One Image",
    tabLabel: "One Image",
    title: "Studio Generasi Visual Rasio Fleksibel",
    subtitle:
      "Wujudkan imajinasi visual Anda dalam hitungan detik dengan kebebasan memilih rasio aspek kustom dan preset gaya artistik yang memukau.",
    highlights: [
      "Dukungan format rasio lengkap: 1:1 Persegi, 16:9 Lanskap, 9:16 Potret, 4:3 Klasik",
      "Koleksi preset estetika: Origami 3D, Sommelier Warm Film, Pin, hingga Fotorealistis",
      "Render visual tajam beresolusi tinggi langsung dari deskripsi teks",
      "Galeri tersimpan rapi untuk kebutuhan materi kreatif dan presentasi",
    ],
    imageSrc: "/showcase/one-image.png",
    imageWidth: 1024,
    imageHeight: 591,
    urlPath: "onemind.web.id/workspace/image",
  },
  {
    id: "card-faith",
    category: "Faith Hub",
    tabLabel: "Faith Hub",
    title: "Ruang Hening & Perenungan Pribadi",
    subtitle:
      "Ruang kontemplatif yang tenang dan menyejukkan untuk mencurahkan isi hati, membaca renungan, membagikan pergumulan, dan memanjatkan rasa syukur.",
    highlights: [
      "Ruang pribadi yang aman, damai, dan bebas dari penghakiman",
      "Panduan topik refleksi: kedamaian batin, mengatasi cemas, dan relasi",
      "Dukungan pencatatan doa pribadi dan ucapan syukur hari ini",
      "Ayat-ayat perenungan yang menguatkan untuk menemani hari Anda",
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
  const [activeTabId, setActiveTabId] = useState<string>("card-chat");
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Otomatis berpindah fitur secara berkala (setiap 4.5 detik) tanpa harus diklik manual
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveTabId((currentId) => {
        const currentIndex = FEATURE_ITEMS.findIndex((f) => f.id === currentId);
        const nextIndex = (currentIndex + 1) % FEATURE_ITEMS.length;
        return FEATURE_ITEMS[nextIndex].id;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Dengarkan event navigasi (misal klik menu di navbar atas)
  useEffect(() => {
    const handleTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && FEATURE_ITEMS.some((f) => f.id === customEvent.detail)) {
        setActiveTabId(customEvent.detail);
      }
    };
    window.addEventListener("select-feature-tab", handleTabEvent);
    return () => window.removeEventListener("select-feature-tab", handleTabEvent);
  }, []);

  const handleAction = () => {
    onGetStarted?.("signup");
  };

  const activeItem = FEATURE_ITEMS.find((f) => f.id === activeTabId) || FEATURE_ITEMS[0];

  return (
    <section id="section-features" className="scroll-mt-24 relative w-full pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-x-clip">
      {/* ─── SECTION HEADER ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.05, margin: "-50px 0px -50px 0px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-2xl mx-auto mb-10 sm:mb-12"
      >
        <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          Eksplorasi Fitur
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1.5 leading-tight">
          Satu Platform, Seluruh Kemampuan.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Setiap modul terintegrasi secara harmonis di dalam satu ruang kerja One Mind.
        </p>
      </motion.div>

      {/* ─── FITUR TABS SELECTOR (Pill Buttons dengan Auto-Cycle Progress) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.05, margin: "-50px 0px -50px 0px" }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10 sm:mb-14"
      >
        {FEATURE_ITEMS.map((item) => {
          const isActive = activeTabId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTabId(item.id)}
              className={`relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer overflow-hidden ${
                isActive
                  ? "bg-white text-black shadow-lg scale-105"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              {/* Indikator progress rotasi otomatis pada tab aktif */}
              {isActive && !isPaused && (
                <motion.span
                  key={`progress-${item.id}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.5, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/35 rounded-full"
                />
              )}
              <span className="relative z-10">{item.tabLabel}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ─── SELECTED FEATURE SHOWCASE DISPLAY ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.05, margin: "-50px 0px -50px 0px" }}
        transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="relative min-h-[460px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center max-w-6xl mx-auto"
          >
            {/* Screenshot Side (7 Cols) */}
            <div className="col-span-1 lg:col-span-7">
              <div
                onClick={handleAction}
                className="group relative w-full rounded-2xl sm:rounded-3xl bg-zinc-950/80 backdrop-blur-md p-2.5 sm:p-3.5 shadow-2xl transition-all cursor-pointer overflow-hidden border border-white/15 hover:border-white/30"
              >
                {/* Subtle Window Top Bar */}
                <div className="flex items-center justify-between pb-2 px-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500/80" />
                    <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
                    <span className="h-2 w-2 rounded-full bg-green-500/80" />
                    <span className="ml-2 font-mono text-[10px] text-zinc-500 hidden sm:inline">
                      {activeItem.urlPath}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Live Workspace</span>
                </div>

                {/* Full Screenshot Display */}
                <div className="relative mt-1 w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <Image
                    src={activeItem.imageSrc}
                    alt={activeItem.title}
                    width={activeItem.imageWidth}
                    height={activeItem.imageHeight}
                    className="w-full h-auto object-contain block select-none group-hover:scale-[1.01] transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 800px"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Description Side (5 Cols) */}
            <div className="col-span-1 lg:col-span-5">
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                {activeItem.category}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 leading-snug">
                {activeItem.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
                {activeItem.subtitle}
              </p>

              {/* Bullet Highlights */}
              <ul className="mt-6 space-y-3 text-xs sm:text-sm text-zinc-300">
                {activeItem.highlights.map((highlight, hIdx) => (
                  <li key={hIdx} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white mt-0.5">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="leading-snug">{highlight}</span>
                  </li>
                ))}
              </ul>

              {/* Action CTA Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleAction}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-all cursor-pointer group shadow-lg hover:scale-105 active:scale-95"
                >
                  <span>Coba {activeItem.category}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
export default HomeFeatureSections;
