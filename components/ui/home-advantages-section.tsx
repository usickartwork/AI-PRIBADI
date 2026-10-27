"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BrainLogo } from "@/components/ui/brain-logo";
import {
  MessageSquare,
  Code2,
  Calendar,
  Sparkles,
  ArrowRight,
  Check,
  Send,
  User,
  Layers,
} from "lucide-react";

interface HomeAdvantagesSectionProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 1: All-in-One Workspace (Satu Platform Terpadu)
   - Monochrome Nexus: Center BrainLogo
   - 4 Clean Satellite Nodes: Chat, Code, Image, Schedule
   - Continuous subtle streaming pulses to center
   - Pure Monochrome Badge: White on Black
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicAllInOne() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 select-none overflow-hidden">
      {/* Monochrome Badge */}
      <span className="absolute top-2.5 right-2.5 z-20 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-white text-black shadow-sm">
        ALL-IN-ONE
      </span>

      {/* Central Nexus Container */}
      <div className="relative w-full max-w-[230px] h-[120px] flex items-center justify-center">
        {/* Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/15" viewBox="0 0 230 120">
          <line x1="40" y1="26" x2="115" y2="60" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="190" y1="26" x2="115" y2="60" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="40" y1="94" x2="115" y2="60" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="190" y1="94" x2="115" y2="60" strokeDasharray="3 3" strokeWidth="1" />

          {/* Traveling Monochrome Pulses */}
          <motion.circle
            r="2"
            fill="#ffffff"
            animate={{ cx: [40, 115], cy: [26, 60], opacity: [0.9, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeIn" }}
          />
          <motion.circle
            r="2"
            fill="#ffffff"
            animate={{ cx: [190, 115], cy: [26, 60], opacity: [0.9, 0] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeIn", delay: 0.3 }}
          />
          <motion.circle
            r="2"
            fill="#ffffff"
            animate={{ cx: [40, 115], cy: [94, 60], opacity: [0.9, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeIn", delay: 0.6 }}
          />
          <motion.circle
            r="2"
            fill="#ffffff"
            animate={{ cx: [190, 115], cy: [94, 60], opacity: [0.9, 0] }}
            transition={{ duration: 2.0, repeat: Infinity, ease: "easeIn", delay: 0.9 }}
          />
        </svg>

        {/* 4 Clean Satellite Nodes */}
        <motion.div
          animate={{ y: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1 left-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/15 text-[8.5px] font-mono text-zinc-300"
        >
          <MessageSquare className="w-2.5 h-2.5 text-white" />
          <span>Chat</span>
        </motion.div>

        <motion.div
          animate={{ y: [1.5, -1.5, 1.5] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="absolute top-1 right-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/15 text-[8.5px] font-mono text-zinc-300"
        >
          <Code2 className="w-2.5 h-2.5 text-white" />
          <span>Code</span>
        </motion.div>

        <motion.div
          animate={{ y: [1.5, -1.5, 1.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute bottom-1 left-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/15 text-[8.5px] font-mono text-zinc-300"
        >
          <Sparkles className="w-2.5 h-2.5 text-white" />
          <span>Image</span>
        </motion.div>

        <motion.div
          animate={{ y: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute bottom-1 right-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/15 text-[8.5px] font-mono text-zinc-300"
        >
          <Calendar className="w-2.5 h-2.5 text-white" />
          <span>Schedule</span>
        </motion.div>

        {/* Central Core Brain */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-11 h-11 rounded-xl bg-zinc-950 border border-white/30 flex items-center justify-center shadow-lg shadow-white/5"
          >
            <BrainLogo className="w-5 h-5 text-white" />
          </motion.div>
          <span className="mt-1 text-[8px] font-mono font-semibold text-zinc-300">
            One Core
          </span>
        </div>
      </div>

      {/* Footnote Status */}
      <div className="text-[8px] font-mono text-zinc-400 text-center">
        1 Akun • 1 Kuota • 0 Pindah Tab
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 2: Multi-Model & Voice (Claude, DeepSeek, Gemini, Usick)
   - Clean typographic model pills (no AI-slop symbols)
   - Monochrome chat stream bars
   - Clean soundwave bars in pure white
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicMultiModel() {
  const [modelIndex, setModelIndex] = useState(0);
  const models = ["Claude 3.7", "DeepSeek R1", "Gemini 3.6", "Usick One"];

  useEffect(() => {
    const timer = setInterval(() => {
      setModelIndex((prev) => (prev + 1) % models.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [models.length]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden">
      {/* Top Models Row */}
      <div className="flex items-center justify-between gap-1">
        {models.map((name, idx) => (
          <span
            key={name}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all ${
              idx === modelIndex
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-white/5 text-zinc-400 border border-white/10"
            }`}
          >
            {name}
          </span>
        ))}
      </div>

      {/* Center: Live Streaming Chat Message */}
      <div className="my-1.5 rounded-lg bg-zinc-950 border border-white/15 p-2 shadow-sm">
        <div className="flex items-center justify-between mb-1 text-[8px] font-mono text-zinc-400">
          <span>AI Streaming Response:</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
        <div className="space-y-1">
          <motion.div
            key={`stream-1-${modelIndex}`}
            initial={{ width: "20%" }}
            animate={{ width: "95%" }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-white"
          />
          <motion.div
            key={`stream-2-${modelIndex}`}
            initial={{ width: "10%" }}
            animate={{ width: "75%" }}
            transition={{ duration: 1.4, delay: 0.15, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-zinc-400"
          />
          <motion.div
            key={`stream-3-${modelIndex}`}
            initial={{ width: "5%" }}
            animate={{ width: "55%" }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-zinc-600"
          />
        </div>
      </div>

      {/* Bottom: Voice Waveform (White) */}
      <div className="flex items-center justify-between px-2 py-1 rounded-md bg-zinc-900 border border-white/10">
        <span className="text-[8px] font-mono text-zinc-300">Voice Assistant</span>
        <div className="flex items-center gap-0.5 h-2.5">
          {[4, 10, 14, 8, 12, 6, 14].map((h, i) => (
            <motion.span
              key={i}
              animate={{ height: [`${h * 0.3}px`, `${h}px`, `${h * 0.4}px`] }}
              transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-0.5 rounded-full bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 3: Code Studio PRD & Image Studio
   - Left: PRD Specification Document with Checklist
   - Right: Image Studio Aspect Ratio Toggle (16:9 / 1:1)
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicStudio() {
  const [ratio, setRatio] = useState<"16:9" | "1:1">("16:9");

  useEffect(() => {
    const timer = setInterval(() => {
      setRatio((prev) => (prev === "16:9" ? "1:1" : "16:9"));
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1">
        <span className="text-[8.5px] font-mono font-bold text-white">Code &amp; Image Studio</span>
        <span className="text-[7.5px] font-mono text-zinc-400">PRD + Render</span>
      </div>

      {/* Split Module Layout */}
      <div className="grid grid-cols-12 gap-2 my-1">
        {/* Left: PRD Doc */}
        <div className="col-span-6 rounded-lg bg-zinc-950 border border-white/15 p-1.5 flex flex-col justify-between">
          <span className="text-[7.5px] font-mono text-zinc-400 mb-1">PRD Spec</span>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Check className="w-2 h-2 text-white" />
              <div className="h-1.5 w-12 bg-zinc-300 rounded-full" />
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-2 h-2 text-white" />
              <div className="h-1.5 w-9 bg-zinc-400 rounded-full" />
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-2 h-2 text-white" />
              <div className="h-1.5 w-14 bg-zinc-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right: Image Canvas Preview */}
        <div className="col-span-6 rounded-lg bg-zinc-950 border border-white/15 p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7.5px] font-mono text-zinc-400">Ratio</span>
            <span className="text-[7.5px] font-mono text-white font-bold">{ratio}</span>
          </div>
          <div className="relative h-10 rounded border border-dashed border-white/30 bg-white/5 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-[8px] font-mono text-zinc-300">
        <span>Arsitektur &amp; Visual HD</span>
        <span className="text-white font-bold">Siap Pakai</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 4: Messages & Smart Schedule (Bukan Musik)
   - Top: Smart Schedule agenda reminder
   - Bottom: Friend realtime message bubble
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicMessagesSchedule() {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden">
      {/* Top: Smart Schedule Task Card */}
      <div className="rounded-lg bg-zinc-950 border border-white/15 p-2 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-[8px] font-mono font-bold text-white">
            <Calendar className="w-2.5 h-2.5 text-white" />
            <span>Smart Schedule</span>
          </div>
          <span className="text-[7.5px] font-mono text-zinc-400">Otomatis</span>
        </div>
        <div className="flex items-center justify-between text-[8px] font-mono text-zinc-300 bg-white/5 px-1.5 py-1 rounded">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>09:00 Deep Work Focus</span>
          </div>
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* Bottom: Friend Realtime Messages Card */}
      <div className="rounded-lg bg-zinc-950 border border-white/15 p-2 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-[8px] font-mono font-bold text-white">
            <User className="w-2.5 h-2.5 text-white" />
            <span>Messages Realtime</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
        <div className="flex items-center justify-between text-[8px] font-mono text-zinc-300 bg-white/5 px-1.5 py-1 rounded">
          <span className="truncate">"Share hasil AI ke teman..."</span>
          <Send className="w-2 h-2 text-white shrink-0 ml-1" />
        </div>
      </div>

      {/* Bottom Footnote */}
      <div className="flex items-center justify-between px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-[8px] font-mono text-zinc-400">
        <span>Kolaborasi Tanpa Pindah Tab</span>
        <span className="text-white font-bold">Terhubung</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADVANTAGE CARDS DATA (4 Pilar Utama & Sesuai Isi Nyata Web One Mind)
───────────────────────────────────────────────────────────────────────────── */
interface AdvantageCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  graphic: React.ReactNode;
}

const ADVANTAGE_CARDS: AdvantageCard[] = [
  {
    id: "adv-all-in-one",
    badge: "ALL-IN-ONE",
    title: "1 Ekosistem Terpadu",
    description:
      "Semua alat kerja menyatu dalam 1 kuota dan 1 akun. Tanpa perlu membuka dan membayar banyak aplikasi terpisah.",
    graphic: <MotionGraphicAllInOne />,
  },
  {
    id: "adv-models",
    badge: "MULTI-MODEL",
    title: "10+ Model AI & Voice",
    description:
      "Bebas beralih antara Claude 3.7 Sonnet, DeepSeek R1, Gemini 3.6 Flash, hingga Usick One dengan asisten suara realtime.",
    graphic: <MotionGraphicMultiModel />,
  },
  {
    id: "adv-studio",
    badge: "STUDIO",
    title: "Code Studio & Image",
    description:
      "Rancang ide jadi dokumen PRD spesifikasi teknis dan alur koding, serta buat karya visual beresolusi tinggi rasio fleksibel.",
    graphic: <MotionGraphicStudio />,
  },
  {
    id: "adv-messages-schedule",
    badge: "CONNECT",
    title: "Messages & Schedule",
    description:
      "Kelola agenda harian secara otomatis dan bagikan insight AI langsung ke obrolan pribadi teman tanpa keluar web.",
    graphic: <MotionGraphicMessagesSchedule />,
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT: HomeAdvantagesSection
───────────────────────────────────────────────────────────────────────────── */
export function HomeAdvantagesSection({
  onGetStarted,
  onOpenPricing,
  isDark = true,
}: HomeAdvantagesSectionProps) {
  return (
    <section
      id="section-advantages"
      className="scroll-mt-24 relative w-full pt-16 sm:pt-24 pb-14 sm:pb-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-x-clip"
    >
      {/* ─── SECTION HEADER (Simpel & Elegan) ───────────────────────────────── */}
      <ScrollReveal y={24} duration={0.6} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          Kenapa One Mind?
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1.5 leading-tight">
          Satu Ekosistem. Semua Solusi.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Seluruh kemampuan esensial dunia terintegrasi dalam satu ruang kerja minimalis tanpa hambatan.
        </p>
      </ScrollReveal>

      {/* ─── 4 MONOCHROME MOTION GRAPHIC CARDS (Ukuran Seragam & Rapi) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        {ADVANTAGE_CARDS.map((card, idx) => (
          <ScrollReveal
            key={card.id}
            y={24}
            delay={idx * 0.08}
            duration={0.6}
            className="h-full flex"
          >
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full h-full rounded-2xl bg-zinc-950/90 border border-white/10 hover:border-white/30 transition-all p-4 sm:p-5 flex flex-col justify-between group overflow-hidden relative shadow-2xl hover:shadow-white/5 cursor-default"
            >
              {/* Subtle Monochrome Ambient Hover Glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-white/[0.02] group-hover:bg-white/[0.06] blur-2xl rounded-full transition-all duration-500 pointer-events-none" />

              <div className="flex-1 flex flex-col">
                {/* ─── MOTION GRAPHIC VISUAL CONTAINER (Ukuran Persis Sama: h-44) ─── */}
                <div className="relative w-full h-44 rounded-xl bg-black/80 border border-white/[0.08] overflow-hidden flex items-center justify-center mb-4 shrink-0">
                  {/* Subtle Monochrome Blueprint Dotted Grid */}
                  <svg
                    className="absolute inset-0 w-full h-full stroke-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]"
                    aria-hidden="true"
                  >
                    <pattern
                      id={`blueprint-grid-${card.id}`}
                      width="16"
                      height="16"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 16 0 L 0 0 0 16"
                        fill="none"
                        strokeWidth="0.8"
                        strokeDasharray="2 3"
                      />
                    </pattern>
                    <rect width="100%" height="100%" fill={`url(#blueprint-grid-${card.id})`} />
                  </svg>

                  {/* Motion Graphic Content (100% Fit & No Overflow) */}
                  <div className="relative z-10 w-full h-full">
                    {card.graphic}
                  </div>
                </div>

                {/* Card Title (Uniform Min-Height) */}
                <div className="min-h-[44px] flex items-center mb-2">
                  <h3 className="text-white font-bold text-base sm:text-lg group-hover:text-zinc-200 transition-colors leading-snug">
                    {card.title}
                  </h3>
                </div>

                {/* Card Description (Uniform Min-Height, Simpel & Tidak Ramai) */}
                <div className="min-h-[64px] mb-4">
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Bottom Subtle Tag Indicator */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-400 font-mono shrink-0">
                <span>0{idx + 1} // {card.badge}</span>
                <span className="text-zinc-400 group-hover:text-white transition-colors flex items-center gap-1">
                  Keunggulan <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
