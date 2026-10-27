"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bot,
  Code2,
  Music2,
  CalendarDays,
  Sparkles,
  HeartHandshake,
  ArrowRight,
  Search,
  Mic,
  Camera,
  Play,
  CheckCircle2,
  Layers,
  Wand2,
  Ratio,
  Maximize2,
} from "lucide-react";

interface HomeFeatureSectionsProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

const NAV_TABS = [
  { id: "section-chat", label: "AI Chat", icon: Bot },
  { id: "section-code", label: "One Code", icon: Code2 },
  { id: "section-music", label: "Music One", icon: Music2 },
  { id: "section-schedule", label: "Schedule", icon: CalendarDays },
  { id: "section-image", label: "One Image", icon: Sparkles },
  { id: "section-faith", label: "Faith Hub", icon: HeartHandshake },
  { id: "section-faq", label: "FAQ", icon: Layers },
];

export function HomeFeatureSections({
  onGetStarted,
  onOpenPricing,
  isDark = true,
}: HomeFeatureSectionsProps) {
  const [activeSection, setActiveSection] = useState<string>("section-chat");
  const [showStickyNav, setShowStickyNav] = useState<boolean>(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Monitor scroll position to show sticky navigation and detect active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyNav(scrollY > 500);

      // Check which section is in view
      const sectionIds = NAV_TABS.map((t) => t.id);
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(sectionIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAction = () => {
    onGetStarted?.("signup");
  };

  return (
    <div className="relative w-full text-white">
      {/* ─── STICKY FLOATING PILL NAVBAR ────────────────────────────────────────── */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
          showStickyNav
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <nav className="pointer-events-auto flex items-center gap-1 sm:gap-2 px-3 py-1.5 rounded-full bg-zinc-950/80 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/80 max-w-[94vw] overflow-x-auto no-scrollbar">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E1E0CC] text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <div className="h-3 w-px bg-white/20 mx-1 hidden sm:block" />
          <button
            type="button"
            onClick={handleAction}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Mulai
            <ArrowRight className="h-3 w-3" />
          </button>
        </nav>
      </div>

      {/* ─── SECTION 1: AI CHAT MULTI-MODEL WORKSPACE ─────────────────────────── */}
      <section
        id="section-chat"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto scroll-mt-20"
      >
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-wider uppercase text-[#E1E0CC] mb-4">
            <Bot className="h-3.5 w-3.5" />
            <span>Multi-Model AI Hub</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Ruang Kerja AI Multi-Model
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Beralih instan antara Claude 3.7 Sonnet, Gemini 2.5 Flash, DeepSeek R1, dan GPT-4o
            dalam satu riwayat percakapan tanpa batas.
          </p>

          {/* Model badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {["Claude 3.7 Sonnet", "Gemini 2.5 Flash", "DeepSeek R1 Reasoning", "GPT-4o Omnimodal"].map(
              (m) => (
                <span
                  key={m}
                  className="px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-[11px] font-mono text-zinc-300"
                >
                  {m}
                </span>
              )
            )}
          </div>
        </div>

        {/* Input Bar Simulation */}
        <div
          onClick={handleAction}
          className="max-w-3xl mx-auto mb-10 p-2 sm:p-2.5 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-white/30 transition-all group"
        >
          <div className="flex items-center gap-3 pl-3 text-zinc-400 text-xs sm:text-sm flex-1 truncate">
            <Search className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="truncate">Tanyakan apa saja, analisis data, atau kembangkan strategi...</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E1E0CC] text-black text-xs font-semibold group-hover:scale-105 transition-transform"
          >
            <span>Kirim</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Real Screenshot Window Frame */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 px-3 border-b border-white/10 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-2 font-mono text-[11px] text-zinc-500 hidden sm:inline">
                onemind.web.id/workspace/chat
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Live Workspace</span>
          </div>

          <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[16/10]">
            <Image
              src="/previews/preview-ai-chat.png"
              alt="Pratinjau Ruang Kerja AI Chat One Mind"
              fill
              className="object-cover object-top hover:scale-[1.01] transition-transform duration-500"
              sizes="(max-w: 1200px) 100vw, 1200px"
              priority
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: ONE CODE & PRD STUDIO (Image 2 Blueprint) ──────────────── */}
      <section
        id="section-code"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto scroll-mt-20 border-t border-white/10"
      >
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/5 border border-white/15 mb-4 text-[#E1E0CC] shadow-inner">
            <Code2 className="h-6 w-6" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Selamat Datang, apa yang ingin Anda bangun?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Rancang ide aplikasi atau website Anda bersama One code. Dari wawancara kebutuhan,
            dokumen PRD lengkap, hingga visualisasi antarmuka interaktif.
          </p>
        </div>

        {/* One Code Realistic Prompt Box (Matches user screenshot 2) */}
        <div className="max-w-3xl mx-auto mb-8">
          <div
            onClick={handleAction}
            className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-2xl cursor-pointer hover:border-white/30 transition-all"
          >
            <div className="text-zinc-500 text-xs sm:text-sm mb-6 font-normal">
              Tulis ide project Anda (misal: Aku mau buat web katalog baju)...
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[11px] font-mono text-zinc-500">PRD Synthesis AI</span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-[#E1E0CC] transition-colors"
              >
                <span>One code</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Starter Project Pills (Matches user screenshot 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
            {[
              {
                title: "👗 Katalog Busana",
                desc: "Web katalog modern dengan gallery interaktif & checkout WhatsApp",
              },
              {
                title: "🛒 E-Commerce Multi-Vendor",
                desc: "Marketplace lokal dengan kalkulator ongkir & payment gateway",
              },
              {
                title: "📚 Platform Belajar Online",
                desc: "LMS kursus dengan video streaming & kuis interaktif",
              },
              {
                title: "💳 SaaS Keuangan Pribadi",
                desc: "Dashboard pencatatan pengeluaran & visualisasi anggaran",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={handleAction}
                className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-white/20 hover:bg-zinc-900 transition-all cursor-pointer group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-[#E1E0CC] transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Screenshot Window Frame (User Uploaded Screenshot 2) */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 px-3 border-b border-white/10 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="ml-2 font-mono text-[11px] text-zinc-500">One Code Studio Canvas</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Tampilan Nyata Website</span>
          </div>

          <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[16/9.5]">
            <Image
              src="/showcase/one-code.png"
              alt="Pratinjau Asli One Code Studio"
              fill
              className="object-cover object-center hover:scale-[1.01] transition-transform duration-500"
              sizes="(max-w: 1200px) 100vw, 1200px"
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: MUSIC ONE (Image 5 Blueprint) ─────────────────────────── */}
      <section
        id="section-music"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto scroll-mt-20 border-t border-white/10"
      >
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/5 border border-white/15 mb-4 text-[#E1E0CC] shadow-inner">
            <Music2 className="h-6 w-6" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Mau dengar apa hari ini?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Streaming musik beresolusi tinggi, bebas jeda iklan, dengan lirik realtime sinkron
            dan stasiun radio 24/7 LIVE.
          </p>
        </div>

        {/* Music Search & Radio Pills (Matches user screenshot 5) */}
        <div className="max-w-3xl mx-auto mb-8">
          <div
            onClick={handleAction}
            className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-white/30 transition-all mb-4"
          >
            <div className="flex items-center gap-3 pl-2 text-zinc-500 text-xs sm:text-sm flex-1 truncate">
              <Search className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>Cari lagu, artis, atau album favorit Anda...</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold"
            >
              <Play className="h-3 w-3 fill-black" />
              <span>Putar</span>
            </button>
          </div>

          {/* Radio Siaran Populer 24/7 LIVE */}
          <div className="mb-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Radio Siaran Populer 24/7 LIVE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Top Hits Indonesia 2026", sub: "Siaran Langsung Populer", tag: "LIVE" },
              { title: "Global Chill & Lofi Beats", sub: "Deep Focus Ambient", tag: "24/7" },
              { title: "Indie Acoustic Sanctuary", sub: "Koleksi Lagu Pilihan", tag: "HQ AUDIO" },
            ].map((radio, idx) => (
              <div
                key={idx}
                onClick={handleAction}
                className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                    {radio.tag}
                  </span>
                  <Play className="h-3 w-3 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-[#E1E0CC] transition-colors">
                  {radio.title}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{radio.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Screenshot Window Frame (User Uploaded Screenshot 5) */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 px-3 border-b border-white/10 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="ml-2 font-mono text-[11px] text-zinc-500">Music One Player & Lirik</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Tampilan Nyata Website</span>
          </div>

          <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[16/9.5]">
            <Image
              src="/showcase/music-one.png"
              alt="Pratinjau Asli Music One"
              fill
              className="object-cover object-center hover:scale-[1.01] transition-transform duration-500"
              sizes="(max-w: 1200px) 100vw, 1200px"
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: SMART SCHEDULE AI (Image 3 Blueprint) ──────────────────── */}
      <section
        id="section-schedule"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto scroll-mt-20 border-t border-white/10"
      >
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/5 border border-white/15 mb-4 text-[#E1E0CC] shadow-inner">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Smart Schedule Assistant
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            What would you like to schedule today? Atur jadwal rapat, blok waktu fokus,
            hingga deadline milestone harian secara otomatis.
          </p>
        </div>

        {/* Schedule Realistic Input Box (Matches user screenshot 3) */}
        <div className="max-w-3xl mx-auto mb-8">
          <div
            onClick={handleAction}
            className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-white/30 transition-all mb-4"
          >
            <div className="flex items-center gap-3 pl-2 text-zinc-500 text-xs sm:text-sm flex-1 truncate">
              <CalendarDays className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>Ask Schedule AI to add or manage your schedule...</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold"
            >
              <span>Jadwalkan</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Quick Schedule Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: "🗓️ Rapat Mingguan", time: "Senin 09:00" },
              { label: "⚡ Deep Work", time: "Blok 2 Jam" },
              { label: "🎯 Deadline Fitur", time: "Jumat 17:00" },
              { label: "🔄 Sync Calendar", time: "Google Cal" },
            ].map((action, idx) => (
              <div
                key={idx}
                onClick={handleAction}
                className="p-3 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all cursor-pointer text-center"
              >
                <div className="text-xs font-semibold text-white">{action.label}</div>
                <div className="text-[10px] font-mono text-zinc-400 mt-1">{action.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Screenshot Window Frame (User Uploaded Screenshot 3) */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 px-3 border-b border-white/10 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="ml-2 font-mono text-[11px] text-zinc-500">Smart Schedule Tab</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Tampilan Nyata Website</span>
          </div>

          <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[16/9.5]">
            <Image
              src="/showcase/schedule.png"
              alt="Pratinjau Asli Schedule One Mind"
              fill
              className="object-cover object-center hover:scale-[1.01] transition-transform duration-500"
              sizes="(max-w: 1200px) 100vw, 1200px"
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: ONE IMAGE STUDIO (Image 1 Blueprint) ───────────────────── */}
      <section
        id="section-image"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto scroll-mt-20 border-t border-white/10"
      >
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/5 border border-white/15 mb-4 text-[#E1E0CC] shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Deskripsikan gambar Anda
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Studio generasi visual dengan kendali rasio aspek, preset gaya artistik,
            dan rendering beresolusi ultra-tinggi dalam hitungan detik.
          </p>
        </div>

        {/* Aspect Ratio Selector & Prompt Box (Matches user screenshot 1) */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            {["1:1 Persegi", "16:9 Lanskap", "9:16 Potret Story", "4:3 Klasik"].map((r, i) => (
              <span
                key={r}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                  i === 0
                    ? "bg-white text-black font-semibold"
                    : "bg-zinc-900 border border-white/10 text-zinc-400"
                }`}
              >
                {r}
              </span>
            ))}
          </div>

          <div
            onClick={handleAction}
            className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-white/30 transition-all mb-4"
          >
            <div className="flex items-center gap-3 pl-2 text-zinc-500 text-xs sm:text-sm flex-1 truncate">
              <Wand2 className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>Deskripsikan gambar Anda secara detail...</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold"
            >
              <span>Generate</span>
              <Sparkles className="h-3 w-3" />
            </button>
          </div>

          {/* Style presets carousel (Matches user screenshot 1: Pin, Baris depan, Origami, Sommelier, Pelatih) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { name: "Pin", style: "Minimalist Cyber" },
              { name: "Baris Depan", style: "Cinematic Portrait" },
              { name: "Origami", style: "3D Paper Art" },
              { name: "Sommelier", style: "Warm Film Grade" },
              { name: "Pelatih", style: "Photorealistic" },
            ].map((preset, idx) => (
              <div
                key={idx}
                onClick={handleAction}
                className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all cursor-pointer text-center"
              >
                <div className="text-xs font-semibold text-white">{preset.name}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{preset.style}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Screenshot Window Frame (User Uploaded Screenshot 1) */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 px-3 border-b border-white/10 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="ml-2 font-mono text-[11px] text-zinc-500">One Image Studio</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Tampilan Nyata Website</span>
          </div>

          <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[16/9.5]">
            <Image
              src="/showcase/one-image.png"
              alt="Pratinjau Asli One Image"
              fill
              className="object-cover object-center hover:scale-[1.01] transition-transform duration-500"
              sizes="(max-w: 1200px) 100vw, 1200px"
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: FAITH HUB — RUANG HENING PRIBADI (Image 4 Blueprint) ───── */}
      <section
        id="section-faith"
        className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto scroll-mt-20 border-t border-white/10"
      >
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/5 border border-white/15 mb-4 text-[#E1E0CC] shadow-inner">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Apa yang sedang ada di dalam hatimu hari ini?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Ruang hening dan perenungan pribadi. Bagikan isi hati, pergumulan, atau ucapan syukurmu
            dalam suasana yang tenang dan menyejukkan.
          </p>
        </div>

        {/* Faith Realistic Input Box (Matches user screenshot 4) */}
        <div className="max-w-3xl mx-auto mb-8">
          <div
            onClick={handleAction}
            className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-white/30 transition-all mb-4"
          >
            <div className="flex items-center gap-3 pl-2 text-zinc-500 text-xs sm:text-sm flex-1 truncate">
              <HeartHandshake className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>Tuliskan apa yang ada di dalam hatimu hari ini...</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                <Camera className="h-4 w-4" />
              </span>
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold"
              >
                <span>Bagikan</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Reflection topic pills (Matches user screenshot 4) */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              "🕊️ Membangun Hubungan dengan Allah",
              "🌊 Mencari Kedamaian Batin",
              "🛡️ Mengatasi Kekhawatiran",
              "🤝 Keluarga & Relasi",
              "🌅 Ucapan Syukur Hari Ini",
            ].map((tag, idx) => (
              <span
                key={idx}
                onClick={handleAction}
                className="px-3.5 py-1.5 rounded-full bg-zinc-900/60 border border-white/10 hover:border-white/20 text-xs text-zinc-300 cursor-pointer transition-all hover:bg-zinc-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Real Screenshot Window Frame (User Uploaded Screenshot 4) */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 px-3 border-b border-white/10 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="ml-2 font-mono text-[11px] text-zinc-500">Ruang Hening Pribadi</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Tampilan Nyata Website</span>
          </div>

          <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[16/9.5]">
            <Image
              src="/showcase/faith-hub.png"
              alt="Pratinjau Asli Ruang Hening"
              fill
              className="object-cover object-center hover:scale-[1.01] transition-transform duration-500"
              sizes="(max-w: 1200px) 100vw, 1200px"
            />
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 md:px-10 max-w-4xl mx-auto text-center border-t border-white/10">
        <h3 className="text-2xl sm:text-4xl font-black text-white">
          Satu Akun, Seluruh Kecerdasan Digital.
        </h3>
        <p className="mt-3 text-sm text-zinc-400 max-w-xl mx-auto">
          Mulai jelajahi One Mind sekarang secara gratis tanpa perlu kartu kredit.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleAction}
            className="px-6 py-2.5 rounded-full bg-[#E1E0CC] text-black text-sm font-bold hover:bg-white transition-colors cursor-pointer"
          >
            Daftar Akun Gratis
          </button>
          {onOpenPricing && (
            <button
              type="button"
              onClick={onOpenPricing}
              className="px-6 py-2.5 rounded-full bg-white/5 border border-white/15 text-white text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
            >
              Lihat Paket Harga
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
