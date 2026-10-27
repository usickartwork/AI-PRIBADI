"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BrainLogo } from "@/components/ui/brain-logo";
import {
  MessageSquare,
  Code2,
  Music,
  Calendar,
  Sparkles,
  ArrowRight,
  Check,
  Send,
  User,
} from "lucide-react";

interface HomeAdvantagesSectionProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 1: All-in-One Convergence (5 Fitur Terpadu Menjadi 1)
   - Central Glowing Brain Nexus
   - 4 Orbiting Tool Satellites (Chat, Code, Music, Schedule)
   - Animated light beams continuously streaming data inward
   - "ALL-IN-ONE" orange pill badge
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicAllInOne() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 select-none overflow-hidden">
      {/* Orange Badge */}
      <span className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25">
        ALL-IN-ONE
      </span>

      {/* Central Nexus Container */}
      <div className="relative w-full max-w-[240px] h-[130px] flex items-center justify-center">
        {/* Animated Connecting SVG Stream Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/20" viewBox="0 0 240 130">
          {/* Top-Left to Center */}
          <line x1="45" y1="28" x2="120" y2="65" strokeDasharray="3 3" strokeWidth="1.2" />
          {/* Top-Right to Center */}
          <line x1="195" y1="28" x2="120" y2="65" strokeDasharray="3 3" strokeWidth="1.2" />
          {/* Bottom-Left to Center */}
          <line x1="45" y1="102" x2="120" y2="65" strokeDasharray="3 3" strokeWidth="1.2" />
          {/* Bottom-Right to Center */}
          <line x1="195" y1="102" x2="120" y2="65" strokeDasharray="3 3" strokeWidth="1.2" />

          {/* Animated Traveling Pulses */}
          <motion.circle
            r="2"
            fill="#38bdf8"
            animate={{ cx: [45, 120], cy: [28, 65], opacity: [1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeIn" }}
          />
          <motion.circle
            r="2"
            fill="#a855f7"
            animate={{ cx: [195, 120], cy: [28, 65], opacity: [1, 0] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeIn", delay: 0.3 }}
          />
          <motion.circle
            r="2"
            fill="#10b981"
            animate={{ cx: [45, 120], cy: [102, 65], opacity: [1, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeIn", delay: 0.6 }}
          />
          <motion.circle
            r="2"
            fill="#f59e0b"
            animate={{ cx: [195, 120], cy: [102, 65], opacity: [1, 0] }}
            transition={{ duration: 2.0, repeat: Infinity, ease: "easeIn", delay: 0.9 }}
          />
        </svg>

        {/* 4 Satellite Tools */}
        {/* Top-Left: AI Chat */}
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-900 border border-sky-400/30 text-[8.5px] font-mono font-medium text-sky-300 shadow-sm"
        >
          <MessageSquare className="w-2.5 h-2.5 text-sky-400" />
          <span>AI Chat</span>
        </motion.div>

        {/* Top-Right: One Code */}
        <motion.div
          animate={{ y: [2, -2, 2] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="absolute top-1 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-900 border border-purple-400/30 text-[8.5px] font-mono font-medium text-purple-300 shadow-sm"
        >
          <Code2 className="w-2.5 h-2.5 text-purple-400" />
          <span>One Code</span>
        </motion.div>

        {/* Bottom-Left: Music One */}
        <motion.div
          animate={{ y: [2, -2, 2] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute bottom-1 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-900 border border-emerald-400/30 text-[8.5px] font-mono font-medium text-emerald-300 shadow-sm"
        >
          <Music className="w-2.5 h-2.5 text-emerald-400" />
          <span>Music One</span>
        </motion.div>

        {/* Bottom-Right: Smart Schedule */}
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute bottom-1 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-900 border border-amber-400/30 text-[8.5px] font-mono font-medium text-amber-300 shadow-sm"
        >
          <Calendar className="w-2.5 h-2.5 text-amber-400" />
          <span>Schedule</span>
        </motion.div>

        {/* Unified One Mind Core (Center Brain) */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-12 h-12 rounded-xl bg-zinc-950 border border-white/30 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.18)]"
          >
            {/* Ambient Radial Aura */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-sky-500/20 via-purple-500/20 to-amber-500/20 animate-pulse" />
            <BrainLogo className="w-6 h-6 text-white relative z-10" />
          </motion.div>
          <span className="mt-1.5 text-[8px] font-mono font-bold text-zinc-300 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
            One Core
          </span>
        </div>
      </div>

      {/* Micro Status Footnote */}
      <div className="mt-1 text-[8.5px] font-mono text-zinc-400 text-center">
        1 Langganan • 1 Ruang Kerja • 0 Pindah Tab
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 2: Multi-Model AI Chat & Voice Assistant Realtime
   - Dynamic Model Switcher (Claude 3.7, DeepSeek R1, Gemini 3.6, Usick One)
   - Live streaming chat bubble with typed response
   - Pulsing Gemini Voice Audio Waveform
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicMultiModel() {
  const [modelIndex, setModelIndex] = useState(0);
  const models = [
    { name: "Claude 3.7 Sonnet", tag: "Thinking", color: "text-amber-400 border-amber-400/40 bg-amber-500/10" },
    { name: "DeepSeek R1", tag: "Reasoning", color: "text-cyan-400 border-cyan-400/40 bg-cyan-500/10" },
    { name: "Gemini 3.6 Flash", tag: "Multimodal", color: "text-blue-400 border-blue-400/40 bg-blue-500/10" },
    { name: "Usick One Flagship", tag: "Flagship", color: "text-purple-400 border-purple-400/40 bg-purple-500/10" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setModelIndex((prev) => (prev + 1) % models.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [models.length]);

  const current = models[modelIndex];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden">
      {/* Top Bar: Model Selector Pill */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold transition-all ${current.color}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
          <span>{current.name}</span>
        </div>
        <span className="text-[8px] font-mono text-zinc-500 uppercase">{current.tag}</span>
      </div>

      {/* Center: Live Streaming Chat Bubble */}
      <div className="my-1.5 rounded-lg bg-zinc-950/90 border border-white/10 p-2 shadow-md">
        <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-mono text-zinc-400">
          <MessageSquare className="w-2.5 h-2.5 text-zinc-400" />
          <span>Jawaban AI Cepat &amp; Terarah:</span>
        </div>
        <div className="space-y-1">
          <motion.div
            key={`stream-line-1-${modelIndex}`}
            initial={{ width: "20%" }}
            animate={{ width: "95%" }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-white/40"
          />
          <motion.div
            key={`stream-line-2-${modelIndex}`}
            initial={{ width: "10%" }}
            animate={{ width: "80%" }}
            transition={{ duration: 1.4, delay: 0.15, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-white/20"
          />
          <motion.div
            key={`stream-line-3-${modelIndex}`}
            initial={{ width: "5%" }}
            animate={{ width: "65%" }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="h-1.5 rounded-full bg-sky-400/40"
          />
        </div>
      </div>

      {/* Bottom: Voice Assistant Realtime Orb Wave */}
      <div className="flex items-center justify-between px-2 py-1 rounded-md bg-zinc-900/80 border border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-[8px] font-mono text-zinc-300">Voice Orb LIVE</span>
        </div>
        {/* Animated Sound Wave Bars */}
        <div className="flex items-center gap-0.5 h-3">
          {[6, 12, 18, 9, 14, 8, 16].map((baseH, idx) => (
            <motion.span
              key={idx}
              animate={{ height: [`${baseH * 0.3}px`, `${baseH}px`, `${baseH * 0.4}px`] }}
              transition={{ duration: 0.9 + idx * 0.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-0.5 rounded-full bg-purple-400"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 3: Code Studio PRD & Image Studio Rasio Fleksibel
   - Split 2-panel architecture
   - Left: PRD Specification & Architecture Flow Checkmarks
   - Right: Image Studio Preview with aspect ratio toggle (16:9 / 1:1)
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicStudio() {
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1">("16:9");

  useEffect(() => {
    const timer = setInterval(() => {
      setAspectRatio((prev) => (prev === "16:9" ? "1:1" : "16:9"));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-[9px] font-mono font-bold text-zinc-200">Code &amp; Image Studio</span>
        </div>
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">
          Auto PRD
        </span>
      </div>

      {/* Split Module Layout */}
      <div className="grid grid-cols-12 gap-2 my-1">
        {/* Left: Code Studio PRD Document */}
        <div className="col-span-6 rounded-lg bg-zinc-950/90 border border-white/10 p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-mono font-bold text-zinc-400">PRD Spec</span>
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <div className="h-1.5 w-14 bg-white/30 rounded-full" />
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <div className="h-1.5 w-10 bg-white/20 rounded-full" />
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              <div className="h-1.5 w-12 bg-cyan-400/40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right: Image Studio Preview */}
        <div className="col-span-6 rounded-lg bg-zinc-950/90 border border-white/10 p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-mono font-bold text-zinc-400">Image Gen</span>
            <span className="text-[7.5px] font-mono text-cyan-300 font-bold">{aspectRatio}</span>
          </div>
          {/* Animated Ratio Box */}
          <div className="relative h-11 rounded border border-dashed border-cyan-400/40 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-amber-500/10 flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="text-cyan-400"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Action Pill */}
      <div className="flex items-center justify-between px-2 py-1 rounded-md bg-zinc-900/80 border border-white/10 text-[8px] font-mono">
        <span className="text-zinc-400">Rasio Fleksibel: 16:9 • 1:1 • 9:16</span>
        <span className="text-emerald-400 font-bold">Siap Pakai</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOTION GRAPHIC 4: Musik Bebas Iklan, Smart Schedule, & Chat Teman Realtime
   - Background Music Equalizer & Scrolling Lyric
   - Smart Schedule calendar task reminder
   - Incoming friend message bubble with realtime badge
───────────────────────────────────────────────────────────────────────────── */
function MotionGraphicConnect() {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden">
      {/* Top Bar: Music Player with Equalizer */}
      <div className="rounded-lg bg-zinc-950/90 border border-emerald-500/30 p-2 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Music className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[8.5px] font-mono font-bold text-emerald-300">Music One • Bebas Iklan</span>
          </div>
          {/* Jumping Equalizer Soundbars */}
          <div className="flex items-end gap-0.5 h-2.5">
            {[6, 12, 10, 14, 8].map((h, i) => (
              <motion.span
                key={i}
                animate={{ height: [`${h * 0.3}px`, `${h}px`, `${h * 0.5}px`] }}
                transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                className="w-0.5 rounded-full bg-emerald-400"
              />
            ))}
          </div>
        </div>
        {/* Animated Lyric Line */}
        <div className="text-[8px] font-mono text-zinc-300 truncate flex items-center gap-1">
          <span className="text-emerald-400">♪</span>
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Lirik karaoke sinkron realtime tanpa jeda...
          </motion.span>
        </div>
      </div>

      {/* Bottom Grid: Schedule + Friends Messages */}
      <div className="grid grid-cols-12 gap-2 my-1">
        {/* Schedule Task Widget */}
        <div className="col-span-6 rounded-lg bg-zinc-950/90 border border-white/10 p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono font-bold text-amber-300">Schedule</span>
            <Calendar className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-300 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="truncate">09:00 Deep Work</span>
          </div>
        </div>

        {/* Friend Chat Messages Widget */}
        <div className="col-span-6 rounded-lg bg-zinc-950/90 border border-white/10 p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono font-bold text-sky-300">Messages</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-300 mt-1">
            <Send className="w-2 h-2 text-sky-400" />
            <span className="truncate">Share AI ke Teman</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Footnote */}
      <div className="flex items-center justify-between px-2 py-0.5 rounded-md bg-zinc-900/80 border border-white/10 text-[8px] font-mono text-zinc-400">
        <span>Fokus Penuh</span>
        <span className="text-white font-bold">Kolaboratif</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADVANTAGE CARDS DATA (4 Pilar Keunggulan Nyata One Mind vs Web Lain)
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
    badge: "1 EKOSISTEM",
    title: "Gantikan 5+ Langganan Terpisah",
    description:
      "Tak perlu lagi bayar ChatGPT Plus, Midjourney, Spotify, Todoist, dan Cursor secara terpisah. Di One Mind, semua alat esensial menyatu dalam 1 kuota dan 1 akun.",
    graphic: <MotionGraphicAllInOne />,
  },
  {
    id: "adv-multimodel",
    badge: "MULTI-MODEL",
    title: "10+ Model AI & Voice Realtime",
    description:
      "Akses bebas Claude 3.7 Sonnet, DeepSeek R1 & V4, Gemini 3.6 Flash, GPT OSS, hingga Usick One Flagship dan asisten suara interaktif tanpa batasan vendor tunggal.",
    graphic: <MotionGraphicMultiModel />,
  },
  {
    id: "adv-studio",
    badge: "CODE & IMAGE",
    title: "Code Studio PRD & Visual Studio",
    description:
      "Ubah ide kasar menjadi dokumen spesifikasi teknis (PRD) matang siap bangun bagi agent koding, sekaligus hasilkan karya visual rasio fleksibel dalam hitungan detik.",
    graphic: <MotionGraphicStudio />,
  },
  {
    id: "adv-productivity",
    badge: "CONNECT & AUDIO",
    title: "Musik, Jadwal, & Pesan Teman",
    description:
      "Fokus bekerja ditemani streaming musik audio jernih ber-lirik sinkron, asisten jadwal harian otomatis, dan fitur kirim pesan pribadi langsung ke rekan tanpa ganti aplikasi.",
    graphic: <MotionGraphicConnect />,
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
          Kenapa Harus One Mind?
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1.5 leading-tight">
          Semua Fitur Esensial. Satu Ruang Kerja Terpadu.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Hentikan pemborosan puluhan langganan terpisah. Di One Mind, Anda bisa Chat AI Multi-Model, susun PRD koding, buat gambar, dengarkan musik bebas iklan, atur jadwal, hingga kirim pesan ke teman dalam 1 platform all-in-one.
        </p>
      </ScrollReveal>

      {/* ─── 4 MOTION GRAPHIC CARDS (Ukuran Seragam & Rapi) ────────────────── */}
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
              className="w-full h-full rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-white/25 transition-all p-4 sm:p-5 flex flex-col justify-between group overflow-hidden relative shadow-2xl hover:shadow-cyan-500/5 cursor-default"
            >
              {/* Subtle Ambient Hover Glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-white/[0.02] group-hover:bg-white/[0.06] blur-2xl rounded-full transition-all duration-500 pointer-events-none" />

              <div className="flex-1 flex flex-col">
                {/* ─── MOTION GRAPHIC VISUAL CONTAINER (Ukuran Persis Sama: h-48) ─── */}
                <div className="relative w-full h-48 rounded-xl bg-black/60 border border-white/[0.08] overflow-hidden flex items-center justify-center mb-4 shrink-0">
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

                  {/* Motion Graphic Content (100% Fit & No Overflow) */}
                  <div className="relative z-10 w-full h-full">
                    {card.graphic}
                  </div>
                </div>

                {/* Card Title (Uniform Min-Height) */}
                <div className="min-h-[50px] flex items-center mb-2">
                  <h3 className="text-white font-bold text-base sm:text-lg group-hover:text-amber-400 transition-colors leading-snug">
                    {card.title}
                  </h3>
                </div>

                {/* Card Description (Uniform Min-Height) */}
                <div className="min-h-[72px] mb-4">
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Bottom Subtle Tag Indicator */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 font-mono shrink-0">
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
