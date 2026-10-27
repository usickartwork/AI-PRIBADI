"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Code2, Music2 } from "lucide-react";

interface PreviewItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  href: string;
  imageSrc: string;
}

const PREVIEW_ITEMS: PreviewItem[] = [
  {
    id: "ai-chat",
    label: "AI Chat",
    icon: Bot,
    title: "Ruang Kerja AI Multi-Model",
    desc: "Beralih bebas antara Claude 3.7 Sonnet, Gemini 3.6 Flash, DeepSeek R1, Qwen 3.8, dan Usick One dalam satu percakapan.",
    href: "/ai-chat",
    imageSrc: "/previews/preview-ai-chat.png",
  },
  {
    id: "code-studio",
    label: "Code Studio & PRD",
    icon: Code2,
    title: "Sintesis PRD & Aplikasi Nyata",
    desc: "Wawancara kebutuhan cerdas, penyusunan spesifikasi PRD otomatis, hingga aplikasi multi-file dengan live preview.",
    href: "/code-studio",
    imageSrc: "/previews/preview-prd-generator.png",
  },
  {
    id: "music",
    label: "Music One",
    icon: Music2,
    title: "Streaming Musik & Lirik Realtime",
    desc: "Audio beresolusi tinggi tanpa jeda iklan dengan lirik karaoke yang sinkron dan impor playlist instan.",
    href: "/music",
    imageSrc: "/previews/preview-music.png",
  },
];

export function ProductPreviewShowcase() {
  const [activeTab, setActiveTab] = useState<string>("ai-chat");
  const currentItem = PREVIEW_ITEMS.find((item) => item.id === activeTab) || PREVIEW_ITEMS[0];

  return (
    <section className="py-20 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-[#E1E0CC]">
          Pratinjau Antarmuka
        </span>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-2">
          Lihat Tampilan Nyata di Dalam One Mind.
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          Setiap modul dirancang bersih, cepat, dan terintegrasi dalam satu ruang kerja terpadu.
        </p>
      </div>

      {/* Clean Tab Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {PREVIEW_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-black font-semibold shadow-md"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Preview Frame (Mockup Window) */}
      <div className="rounded-3xl border border-white/15 bg-zinc-950/80 p-3 sm:p-5 backdrop-blur-2xl shadow-2xl">
        
        {/* Window Top Bar */}
        <div className="flex items-center justify-between pb-3 px-2 border-b border-white/10 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="ml-2 font-mono text-[11px] text-zinc-500">
              onemind.web.id{currentItem.href}
            </span>
          </div>
          <Link
            href={currentItem.href}
            className="flex items-center gap-1.5 text-xs text-[#E1E0CC] hover:text-white transition font-medium"
          >
            <span>Buka Halaman</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Screenshot Photo Display */}
        <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[16/10] sm:aspect-[16/9.5] w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.25 }}
              className="relative w-full h-full"
            >
              <Image
                src={currentItem.imageSrc}
                alt={currentItem.title}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover object-top"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Caption Info Under Photo */}
        <div className="pt-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">{currentItem.title}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{currentItem.desc}</p>
          </div>
          <Link
            href={currentItem.href}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition shrink-0"
          >
            <span>Jelajahi Fitur</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>

    </section>
  );
}

export default ProductPreviewShowcase;
