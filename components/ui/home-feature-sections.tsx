"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HomeFeatureSectionsProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

interface FeatureCard {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
}

const CARDS: FeatureCard[] = [
  {
    id: "card-chat",
    category: "AI Chat",
    title: "Ruang Kerja AI Multi-Model",
    subtitle: "Claude 3.7 Sonnet, Gemini 2.5 Flash, DeepSeek R1 & GPT-4o dalam satu kanvas.",
    imageSrc: "/showcase/ai-chat.png",
    imageWidth: 1024,
    imageHeight: 589,
  },
  {
    id: "card-code",
    category: "One Code",
    title: "One Code & PRD Studio",
    subtitle: "Rancang arsitektur aplikasi dan dokumen PRD lengkap secara instan.",
    imageSrc: "/showcase/one-code.png",
    imageWidth: 1024,
    imageHeight: 593,
  },
  {
    id: "card-music",
    category: "Music One",
    title: "Streaming Musik & Lirik Realtime",
    subtitle: "Audio beresolusi tinggi tanpa jeda iklan dengan stasiun siaran 24/7 LIVE.",
    imageSrc: "/showcase/music-one.png",
    imageWidth: 1024,
    imageHeight: 591,
  },
  {
    id: "card-schedule",
    category: "Smart Schedule",
    title: "Smart Schedule Assistant",
    subtitle: "Manajemen rapat, blok fokus deep work, dan kalender otomatis cerdas.",
    imageSrc: "/showcase/schedule.png",
    imageWidth: 1024,
    imageHeight: 592,
  },
  {
    id: "card-image",
    category: "One Image",
    title: "Studio Generasi Gambar AI",
    subtitle: "Generasi visual presisi dengan kendali rasio aspek dan preset sinematik.",
    imageSrc: "/showcase/one-image.png",
    imageWidth: 1024,
    imageHeight: 591,
  },
  {
    id: "card-faith",
    category: "Faith Hub",
    title: "Ruang Hening & Perenungan",
    subtitle: "Ruang pribadi untuk mencurahkan isi hati, perenungan, dan doa dalam damai.",
    imageSrc: "/showcase/faith-hub.png",
    imageWidth: 1024,
    imageHeight: 587,
  },
];

export function HomeFeatureSections({
  onGetStarted,
  onOpenPricing,
  isDark = true,
}: HomeFeatureSectionsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Scroll smoothly by index
  const scrollToIndex = (index: number) => {
    if (!trackRef.current) return;
    const cards = trackRef.current.children;
    if (cards[index]) {
      const cardEl = cards[index] as HTMLElement;
      cardEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setActiveIndex(index);
    }
  };

  const handlePrev = () => {
    const next = Math.max(0, activeIndex - 1);
    scrollToIndex(next);
  };

  const handleNext = () => {
    const next = Math.min(CARDS.length - 1, activeIndex + 1);
    scrollToIndex(next);
  };

  // Track active index on scroll
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.offsetWidth * 0.8;
      const idx = Math.round(scrollLeft / cardWidth);
      if (idx >= 0 && idx < CARDS.length && idx !== activeIndex) {
        setActiveIndex(idx);
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeIndex]);

  return (
    <section
      id="section-showcase"
      className="relative w-full py-16 sm:py-24 overflow-hidden select-none"
    >
      {/* ─── SECTION HEADER (Clean, minimal, borderless) ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="px-4 sm:px-8 md:px-12 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8"
      >
        <div>
          <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            Ruang Kerja Terpadu
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
            Jelajahi Setiap Modul.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
            Geser ke kiri atau ke kanan untuk melihat antarmuka nyata di dalam One Mind.
          </p>
        </div>

        {/* Minimal Navigation Arrows */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            aria-label="Geser ke kiri"
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={activeIndex === CARDS.length - 1}
            aria-label="Geser ke kanan"
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* ─── QUICK CATEGORY PILLS (Horizontal selector, borderless) ─────────── */}
      <div className="px-4 sm:px-8 md:px-12 max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CARDS.map((card, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => scrollToIndex(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {card.category}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── HORIZONTAL SLIDER TRACK (Uniform card size, borderless) ────────── */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        ref={trackRef}
        className="flex gap-6 sm:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar px-4 sm:px-8 md:px-12 pb-4"
        style={{ scrollPaddingLeft: "1rem", scrollPaddingRight: "1rem" }}
      >
        {CARDS.map((card, idx) => (
          <div
            key={card.id}
            id={card.id}
            onClick={() => onGetStarted?.("signup")}
            className="snap-center shrink-0 w-[88vw] sm:w-[680px] md:w-[780px] lg:w-[860px] rounded-3xl bg-zinc-950 p-4 sm:p-6 shadow-2xl transition-all cursor-pointer group"
          >
            {/* Card Minimal Header (No border, minimal text) */}
            <div className="mb-4">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                {card.category}
              </span>
              <h3 className="text-lg sm:text-2xl font-bold text-white mt-1 leading-tight group-hover:text-zinc-100 transition-colors">
                {card.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                {card.subtitle}
              </p>
            </div>

            {/* Complete, Uncut, Borderless Full Screenshot */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-inner flex items-center justify-center">
              <Image
                src={card.imageSrc}
                alt={card.title}
                width={card.imageWidth}
                height={card.imageHeight}
                className="w-full h-auto object-contain block select-none group-hover:scale-[1.01] transition-transform duration-500"
                sizes="(max-width: 1200px) 100vw, 860px"
                priority={idx === 0}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* ─── BOTTOM DOT INDICATORS ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {CARDS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollToIndex(idx)}
            aria-label={`Buka slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              activeIndex === idx
                ? "w-7 bg-white"
                : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
export default HomeFeatureSections;
