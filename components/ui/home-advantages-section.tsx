"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Check, Sparkles, ArrowRight } from "lucide-react";

interface HomeAdvantagesSectionProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 1: Bikin Plan & PRD Otomatis
   - Lightbulb idea with pulsing wave
   - PRD document sheet
   - Task card with selection handles and animated checkboxes
   - "UPDATE BARU" / "ALL-IN-ONE" orange pill badge
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicPlan() {
  const [checkedCount, setCheckedCount] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setCheckedCount((prev) => (prev === 3 ? 1 : prev + 1));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 select-none">
      {/* Badge Top Right */}
      <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25">
        UPDATE BARU
      </span>

      <div className="relative flex items-center gap-2 max-w-[260px] w-full">
        {/* Lightbulb Idea Node */}
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-900 border border-white/15 shadow-md"
        >
          {/* Subtle Radiant Pulse */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-xl bg-amber-400/20"
          />
          <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
        </motion.div>

        {/* Animated Chevron Arrows */}
        <div className="flex flex-col gap-0.5 shrink-0 opacity-70">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], x: [0, 2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center -space-x-1 text-zinc-400 text-[10px] font-mono"
          >
            <span>›</span>
            <span>›</span>
            <span>›</span>
          </motion.div>
        </div>

        {/* PRD Document (Background card) */}
        <div className="relative flex-1">
          <div className="relative rounded-lg bg-zinc-900/90 border border-white/15 p-2 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1.5">
              <span className="text-[9px] font-bold font-mono tracking-wider text-zinc-300">PRD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-16 bg-white/20 rounded-full" />
              <div className="h-1.5 w-20 bg-white/10 rounded-full" />
              <div className="h-1.5 w-12 bg-white/10 rounded-full" />
            </div>
          </div>

          {/* Overlapping Task Card with Bounding Box Handles */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-3 -right-2 w-32 rounded-lg bg-zinc-950 border border-cyan-400/50 p-2 shadow-2xl"
          >
            {/* 4 Corner Bounding Box Handles (Figma style) */}
            <span className="absolute -top-1 -left-1 w-2 h-2 rounded-[2px] bg-cyan-400 shadow-xs" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-[2px] bg-cyan-400 shadow-xs" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-[2px] bg-cyan-400 shadow-xs" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-[2px] bg-cyan-400 shadow-xs" />

            <div className="text-[9px] font-bold text-cyan-400 font-mono mb-1 flex items-center justify-between">
              <span>Task</span>
              <span className="text-[8px] text-zinc-400">{checkedCount}/3</span>
            </div>

            <div className="space-y-1">
              {[1, 2, 3].map((num) => {
                const isChecked = num <= checkedCount;
                return (
                  <div key={num} className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-[3px] flex items-center justify-center transition-colors ${
                        isChecked ? "bg-cyan-500 text-black" : "border border-white/20 bg-white/5"
                      }`}
                    >
                      {isChecked && <Check className="w-2 h-2 stroke-[3]" />}
                    </span>
                    <span
                      className={`h-1.5 rounded-full transition-all ${
                        num === 1 ? "w-14" : num === 2 ? "w-11" : "w-16"
                      } ${isChecked ? "bg-zinc-300" : "bg-zinc-600"}`}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 2: Desain & Canvas Interaktif
   - Wireframe Window: "... Canvas"
   - Wave Chart with undulating path
   - Modular blocks & prompt bottom bar
   - Animated Mouse Pointer gliding & clicking
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicCanvas() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 select-none">
      <div className="relative w-[92%] rounded-xl bg-zinc-900/90 border border-white/15 p-2.5 shadow-xl overflow-hidden">
        {/* Window Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/80" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[9px] font-mono font-medium text-zinc-400">Canvas</span>
          <span className="text-[8px] font-mono text-zinc-500">v2.4</span>
        </div>

        {/* Canvas Body */}
        <div className="grid grid-cols-12 gap-1.5 mb-2">
          {/* Left Chart / Stats Panel */}
          <div className="col-span-5 rounded-md bg-zinc-950/80 border border-white/10 p-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7.5px] font-mono text-zinc-400">Flow</span>
              <span className="text-[7.5px] font-mono text-emerald-400 font-bold">+98%</span>
            </div>
            {/* Animated Wave SVG */}
            <svg className="w-full h-7 overflow-visible" viewBox="0 0 80 24" fill="none">
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                animate={{
                  d: [
                    "M 0 16 Q 20 4, 40 14 T 80 8 L 80 24 L 0 24 Z",
                    "M 0 14 Q 20 18, 40 8 T 80 12 L 80 24 L 0 24 Z",
                    "M 0 16 Q 20 4, 40 14 T 80 8 L 80 24 L 0 24 Z",
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                fill="url(#waveGradient)"
              />
              <motion.path
                animate={{
                  d: [
                    "M 0 16 Q 20 4, 40 14 T 80 8",
                    "M 0 14 Q 20 18, 40 8 T 80 12",
                    "M 0 16 Q 20 4, 40 14 T 80 8",
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Right Wireframe Modules */}
          <div className="col-span-7 rounded-md bg-zinc-950/80 border border-white/10 p-1.5 space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-1.5 w-12 bg-white/30 rounded-full" />
            </div>
            <div className="h-1.5 w-full bg-white/15 rounded-full" />
            <div className="h-1.5 w-16 bg-white/15 rounded-full" />
            <div className="h-1.5 w-10 bg-cyan-400/40 rounded-full" />
          </div>
        </div>

        {/* Bottom Input Command Bar */}
        <div className="rounded-md bg-zinc-950/90 border border-white/10 px-2 py-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 font-mono">+</span>
            <div className="h-1.5 w-14 bg-zinc-600 rounded-full" />
          </div>
          <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[9px] font-bold">
            ↑
          </span>
        </div>

        {/* Animated Mouse Pointer with Click Ripple */}
        <motion.div
          animate={{
            x: [10, 60, 60, 10],
            y: [30, 20, 20, 30],
            scale: [1, 1, 0.85, 1],
          }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 pointer-events-none z-20"
        >
          {/* Click Ripple Indicator */}
          <motion.span
            animate={{ scale: [0, 1.8], opacity: [0.9, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.8 }}
            className="absolute -top-1 -left-1 w-4 h-4 rounded-full border border-cyan-400 bg-cyan-400/20"
          />
          {/* SVG Mouse Cursor */}
          <svg className="w-4 h-4 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 2l16 11.5-8.5 1.5-4 7.5-3.5-2 4-7.5-4-1z" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 3: Andal AI & Multi-Model Terkuat
   - Floating World Model Badges: Claude (*), OpenAI (◎), DeepSeek (✦), Usick (Ω)
   - Connecting laser data pulses
   - Glowing amber prompt card with dynamic live streaming text lines
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicMultiModel() {
  const [modelIndex, setModelIndex] = useState(0);
  const models = ["Claude 3.7", "DeepSeek R1", "Gemini 3.6", "Usick One"];

  useEffect(() => {
    const timer = setInterval(() => {
      setModelIndex((prev) => (prev + 1) % models.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [models.length]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-3 select-none">
      {/* Top Model Badge Pill Icons */}
      <div className="flex items-center gap-2 mb-3">
        {[
          { label: "Claude", symbol: "✱", color: "text-amber-400 border-amber-400/30 bg-amber-500/10" },
          { label: "OpenAI", symbol: "◎", color: "text-emerald-400 border-emerald-400/30 bg-emerald-500/10" },
          { label: "DeepSeek", symbol: "✦", color: "text-cyan-400 border-cyan-400/30 bg-cyan-500/10" },
          { label: "Usick", symbol: "Ω", color: "text-purple-400 border-purple-400/30 bg-purple-500/10" },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            animate={{
              y: idx % 2 === 0 ? [-2, 2, -2] : [2, -2, 2],
              scale: idx === modelIndex ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shadow-md ${item.color} ${
              idx === modelIndex ? "ring-1 ring-white/30" : "opacity-75"
            }`}
          >
            <span>{item.symbol}</span>
          </motion.div>
        ))}
      </div>

      {/* Glowing Prompt Box with Live Streaming Lines */}
      <div className="relative w-[90%] rounded-xl bg-zinc-950/90 border border-amber-500/30 p-2.5 shadow-[0_0_24px_rgba(245,158,11,0.12)] overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Model Identifier Tag */}
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[9px] font-mono font-bold text-amber-300">
              {models[modelIndex]}
            </span>
          </div>
          <span className="text-[8px] font-mono text-zinc-400">Stream 120 t/s</span>
        </div>

        {/* Live Streaming Prompt Bars */}
        <div className="space-y-1.5">
          <motion.div
            key={`stream-1-${modelIndex}`}
            initial={{ width: "20%" }}
            animate={{ width: "95%" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-white/40"
          />
          <motion.div
            key={`stream-2-${modelIndex}`}
            initial={{ width: "10%" }}
            animate={{ width: "80%" }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-amber-400/50"
          />
          <motion.div
            key={`stream-3-${modelIndex}`}
            initial={{ width: "5%" }}
            animate={{ width: "60%" }}
            transition={{ duration: 1.3, delay: 0.4, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-white/20"
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 4: Ekosistem All-in-One Terintegrasi
   - Verified checkmark browser frame
   - Dynamic audio equalizer bars
   - Aspect ratio image generation toggle
   - Active status pill
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicEcosystem() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 select-none">
      <div className="relative w-[92%] rounded-xl bg-zinc-900/90 border border-white/15 p-2.5 shadow-xl">
        {/* Browser Header Bar with Verified Check */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-[7.5px] font-mono text-sky-300 font-bold">Terpadu [✓]</span>
          </div>
        </div>

        {/* Dashboard 2-Column Module Layout */}
        <div className="grid grid-cols-12 gap-1.5 mb-2">
          {/* Module A: Audio Music Equalizer */}
          <div className="col-span-6 rounded-md bg-zinc-950/80 border border-white/10 p-1.5 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-zinc-400">Music One</span>
            <div className="flex items-end justify-center gap-1 h-7 pt-1">
              {[12, 22, 16, 26, 14, 20].map((baseHeight, idx) => (
                <motion.span
                  key={idx}
                  animate={{
                    height: [
                      `${baseHeight * 0.3}px`,
                      `${baseHeight}px`,
                      `${baseHeight * 0.5}px`,
                    ],
                  }}
                  transition={{
                    duration: 1 + idx * 0.15,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-1 rounded-full bg-emerald-400"
                />
              ))}
            </div>
          </div>

          {/* Module B: Image Studio Ratio / Schedule */}
          <div className="col-span-6 rounded-md bg-zinc-950/80 border border-white/10 p-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[7.5px] font-mono text-zinc-400">Studio</span>
              <span className="text-[7px] font-mono text-cyan-400">16:9 HD</span>
            </div>
            {/* Visual ratio frame pulsing */}
            <div className="relative h-7 rounded border border-dashed border-cyan-400/40 bg-cyan-400/5 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Bottom Status Bar: Single Subscription Pill */}
        <div className="rounded-md bg-zinc-950/90 border border-white/10 px-2 py-1 flex items-center justify-between">
          <span className="text-[8px] font-mono text-zinc-400">1 Akun, 1 Kuota</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white text-black text-[8px] font-bold">
            Siap Pakai
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADVANTAGES CARDS DATA
───────────────────────────────────────────────────────────────────────────── */
interface AdvantageCard {
  id: string;
  badge?: string;
  title: string;
  description: string;
  graphic: React.ReactNode;
}

const ADVANTAGE_CARDS: AdvantageCard[] = [
  {
    id: "adv-plan",
    badge: "UPDATE BARU",
    title: "Bikin Plan & PRD Otomatis",
    description:
      "Dari ide kasar langsung jadi dokumen PRD matang, spesifikasi fitur terstruktur, dan task siap eksekusi tanpa repot prompt dari awal.",
    graphic: <MotionGraphicPlan />,
  },
  {
    id: "adv-canvas",
    title: "Desain & Canvas Interaktif",
    description:
      "Rancang tampilan website dan aplikasi bareng AI di canvas dinamis, mulai dari sketsa konsep alur hingga prototipe yang siap dikembangkan.",
    graphic: <MotionGraphicCanvas />,
  },
  {
    id: "adv-models",
    title: "10+ Model AI Terkuat Dunia",
    description:
      "Akses bebas Claude 3.7 Sonnet, DeepSeek R1 & V4, Gemini 3.6 Flash, hingga Usick One Flagship dalam satu workspace tanpa bayar langganan per model.",
    graphic: <MotionGraphicMultiModel />,
  },
  {
    id: "adv-ecosystem",
    title: "Ekosistem All-in-One Terpadu",
    description:
      "Gunakan satu platform untuk coding, image generation, streaming musik bebas iklan, dan smart schedule otomatis. Hemat biaya, tanpa pindah tab.",
    graphic: <MotionGraphicEcosystem />,
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
      {/* ─── SECTION HEADER ────────────────────────────────────────────────── */}
      <ScrollReveal y={24} duration={0.6} className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          Keunggulan All-in-One
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1.5 leading-tight">
          Satu Ekosistem. Jauh Lebih Unggul.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Mengapa harus repot berlangganan 5 platform terpisah jika seluruh kekuatan AI terhebat dunia, Code Studio, Media, dan Produktivitas menyatu dalam satu ruang kerja?
        </p>
      </ScrollReveal>

      {/* ─── 4 MOTION GRAPHIC CARDS (Persis Referensi) ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {ADVANTAGE_CARDS.map((card, idx) => (
          <ScrollReveal
            key={card.id}
            y={24}
            delay={idx * 0.08}
            duration={0.6}
            className="h-full"
          >
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-white/25 transition-all p-4 sm:p-5 flex flex-col justify-between group overflow-hidden relative shadow-2xl hover:shadow-cyan-500/5 cursor-default"
            >
              {/* Subtle Ambient Hover Glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-white/[0.02] group-hover:bg-white/[0.06] blur-2xl rounded-full transition-all duration-500 pointer-events-none" />

              <div>
                {/* ─── MOTION GRAPHIC VISUAL CONTAINER (Blueprint Grid Background) ─── */}
                <div className="relative w-full h-44 sm:h-48 rounded-xl bg-black/60 border border-white/[0.07] overflow-hidden flex items-center justify-center mb-4">
                  {/* Subtle Blueprint Dotted Grid */}
                  <svg
                    className="absolute inset-0 w-full h-full stroke-white/[0.06] [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]"
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

                  {/* Motion Graphic Content */}
                  <div className="relative z-10 w-full h-full">
                    {card.graphic}
                  </div>
                </div>

                {/* Card Title */}
                <h3 className="text-white font-bold text-base sm:text-lg mb-2 group-hover:text-amber-400/90 transition-colors">
                  {card.title}
                </h3>

                {/* Card Description */}
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Bottom Subtle Indicator */}
              <div className="pt-4 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>0{idx + 1} // Advantage</span>
                <span className="text-zinc-400 group-hover:text-white transition-colors flex items-center gap-1">
                  Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
