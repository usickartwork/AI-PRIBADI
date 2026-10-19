"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Menu,
  X,
  Hexagon,
  Sparkles,
  Bot,
  Terminal,
  Calendar,
  Layers,
  Cpu,
  Shield,
  Activity,
  Code2,
  Send,
  Zap,
  Globe,
  Music,
  FileText,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MonochromeWaves3D } from "@/components/ui/monochrome-waves-3d";
import { OneMindLogo, OneMindGlyph } from "@/components/ui/one-mind-logo";

export interface GradientBarHeroSectionProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Top Navigation Bar (Minimalist, dark futuristic)
───────────────────────────────────────────────────────────────────────────── */
function HeroNavbar({
  onGetStarted,
  onOpenPricing,
}: {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/[0.08] transition-colors select-none">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const container = document.getElementById("page-1-container") || window;
            container.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <OneMindLogo iconSize={24} textClassName="font-bold text-[15px] sm:text-base tracking-tight text-[#F5F5F5] group-hover:text-white transition-colors" />
        </a>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#A0A0A0]">
          <a
            href="#what-is-onemind"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Introduction
          </a>
          <a
            href="#how-it-works"
            className="hover:text-white transition-colors cursor-pointer"
          >
            How it Works
          </a>
          <a
            href="#features-bento"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Capabilities
          </a>
          {onOpenPricing && (
            <button
              type="button"
              onClick={onOpenPricing}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Pricing
            </button>
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => onGetStarted?.("signin")}
            className="text-[13px] font-medium text-[#A0A0A0] hover:text-white px-3.5 py-1.5 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => onGetStarted?.("signup")}
            className="px-4 py-1.5 rounded-full text-[13px] font-semibold bg-white text-black hover:bg-zinc-200 transition-all transform hover:scale-[1.02] cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.18)]"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-white/10 px-6 py-5 flex flex-col gap-4 animate-in fade-in-0 slide-in-from-top-2">
          <a
            href="#what-is-onemind"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm text-zinc-300 hover:text-white transition-colors"
          >
            Introduction
          </a>
          <a
            href="#how-it-works"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm text-zinc-300 hover:text-white transition-colors"
          >
            How it Works
          </a>
          <a
            href="#features-bento"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm text-zinc-300 hover:text-white transition-colors"
          >
            Capabilities
          </a>
          {onOpenPricing && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPricing();
              }}
              className="text-left text-sm text-zinc-300 hover:text-white transition-colors"
            >
              Pricing
            </button>
          )}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onGetStarted?.("signin");
              }}
              className="w-full py-2.5 rounded-full text-sm font-medium border border-white/15 text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onGetStarted?.("signup");
              }}
              className="w-full py-2.5 rounded-full text-sm font-semibold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Partner / AI Model Technology Logos Bar (Monochrome, Horizon line)
───────────────────────────────────────────────────────────────────────────── */
function HorizonLogoBar() {
  const logos = [
    {
      name: "Google Gemini",
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10Z" />
        </svg>
      ),
    },
    {
      name: "OpenAI",
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M22.28 10.12a5.55 5.55 0 0 0-.48-4.58 5.6 5.6 0 0 0-3.92-2.77 5.63 5.63 0 0 0-4.68.75 5.54 5.54 0 0 0-3.8-1.52 5.58 5.58 0 0 0-5.26 3.82 5.57 5.57 0 0 0-2.3 4.02 5.61 5.61 0 0 0 .97 4.54 5.55 5.55 0 0 0 .48 4.58 5.6 5.6 0 0 0 3.92 2.77 5.6 5.6 0 0 0 4.68-.75 5.55 5.55 0 0 0 3.8 1.52 5.58 5.58 0 0 0 5.26-3.82 5.57 5.57 0 0 0 2.3-4.02 5.61 5.61 0 0 0-.97-4.54ZM12 14.5a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5Z" />
        </svg>
      ),
    },
    {
      name: "Anthropic Claude",
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v3.08a1.5 1.5 0 0 1-3 0V3.5A1.5 1.5 0 0 1 12 2Zm7.07 3.93a1.5 1.5 0 0 1 0 2.12l-2.18 2.18a1.5 1.5 0 1 1-2.12-2.12l2.18-2.18a1.5 1.5 0 0 1 2.12 0ZM22 12a1.5 1.5 0 0 1-1.5 1.5h-3.08a1.5 1.5 0 0 1 0-3h3.08A1.5 1.5 0 0 1 22 12Zm-3.93 7.07a1.5 1.5 0 0 1-2.12 0l-2.18-2.18a1.5 1.5 0 1 1 2.12-2.12l2.18 2.18a1.5 1.5 0 0 1 0 2.12ZM12 22a1.5 1.5 0 0 1-1.5-1.5v-3.08a1.5 1.5 0 0 1 3 0v3.08A1.5 1.5 0 0 1 12 22Zm-7.07-3.93a1.5 1.5 0 0 1 0-2.12l2.18-2.18a1.5 1.5 0 1 1 2.12 2.12l-2.18 2.18a1.5 1.5 0 0 1 2.12 0ZM2 12a1.5 1.5 0 0 1 1.5-1.5h3.08a1.5 1.5 0 0 1 0 3H3.5A1.5 1.5 0 0 1 2 12Zm3.93-7.07a1.5 1.5 0 0 1 2.12 0l2.18 2.18a1.5 1.5 0 1 1-2.12 2.12L6.05 7.05a1.5 1.5 0 0 1 0-2.12Z" />
        </svg>
      ),
    },
    {
      name: "DeepSeek",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 13c1.5-3.5 5-6 9-6 4.5 0 8.5 3 9 7-1.5 2.5-4 4-7 4-3 0-5.5-1.5-7-3L3 13Z" />
          <circle cx="8" cy="11.5" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
    {
      name: "Qwen",
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.8 3.8L12 11.9 5.2 8.1 12 4.3Zm-7 5.2 6 3.4v6.8l-6-3.4V9.5Zm8 10.2v-6.8l6-3.4v6.8l-6 3.4Z" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
        </svg>
      ),
    },
    {
      name: "Usick One Engine",
      icon: (
        <OneMindGlyph size={16} />
      ),
    },
  ];

  return (
    <div className="w-full max-w-[1050px] mx-auto px-4 py-6 border-t border-b border-white/[0.08] backdrop-blur-sm bg-[#050505]/40 select-none">
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12">
        {logos.map((logo) => (
          <div
            key={logo.name}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors duration-200"
          >
            {logo.icon}
            <span className="text-xs sm:text-[13px] font-medium tracking-wide">
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Landing Component (Dark futuristic with 3D waves & One Mind brand)
───────────────────────────────────────────────────────────────────────────── */
export const Component: React.FC<GradientBarHeroSectionProps> = ({
  onGetStarted,
  onOpenPricing,
}) => {
  return (
    <div className="relative w-full bg-[#050505] text-[#F5F5F5] selection:bg-white/20 selection:text-white overflow-hidden">
      {/* Top Navbar */}
      <HeroNavbar onGetStarted={onGetStarted} onOpenPricing={onOpenPricing} />

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: HERO WITH 3D MONOCHROME WAVES
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[96vh] sm:min-h-screen flex flex-col justify-between pt-28 sm:pt-36 pb-8 overflow-hidden">
        {/* 3D Monochrome Waves Canvas Background */}
        <MonochromeWaves3D emblemYPercent={50} />

        {/* Hero Top Content */}
        <div className="relative z-10 max-w-[960px] mx-auto text-center px-5 sm:px-8 flex flex-col items-center">
          {/* Main Headline */}
          <h1 className="text-[clamp(2.35rem,5.8vw,4.4rem)] font-bold tracking-tight text-white leading-[1.08] max-w-[850px] mx-auto mb-4 animate-in fade-in-0 duration-700">
            Unified Intelligence
            <br />
            <span className="text-white">Powered By Usick One Engine.</span>
          </h1>

          {/* Subheadline Tagline */}
          <p className="text-[clamp(0.95rem,2.1vw,1.15rem)] text-[#A0A0A0] max-w-[620px] mx-auto leading-relaxed mb-7 font-normal animate-in fade-in-0 duration-800">
            Voice-triggered. Multi-model. Built to scale.
          </p>

          {/* Primary Pill Button CTA */}
          <div className="mb-9 sm:mb-11 animate-in fade-in-0 duration-900">
            <button
              type="button"
              onClick={() => onGetStarted?.("signup")}
              className="inline-flex items-center gap-2.5 px-7 sm:px-9 py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-[15px] bg-white text-black hover:bg-zinc-200 transition-all transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-[0_0_35px_rgba(255,255,255,0.22)]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Central Glowing Object (Concentric Orbit Emblem with Volumetric Beam) */}
          <div className="relative flex flex-col items-center justify-center animate-in fade-in-0 duration-1000">
            {/* Volumetric glow aura */}
            <div
              className="absolute -inset-4 rounded-3xl bg-white/[0.08] blur-xl pointer-events-none"
              aria-hidden="true"
            />
            {/* Glossy Dark Box Badge with One Mind Glyph */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#111111]/90 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
              <OneMindGlyph size={36} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
            </div>
            {/* Vertical light beam indicator */}
            <div className="w-[1px] h-16 sm:h-24 bg-gradient-to-b from-white/40 via-white/10 to-transparent mt-2" />
          </div>
        </div>

        {/* Technology Logos Bar at the Horizon */}
        <div className="relative z-10 w-full mt-6 sm:mt-10">
          <HorizonLogoBar />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: INTRODUCTION ("What is One Mind ?")
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="what-is-onemind" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[1240px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          {/* Section Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-[#111111] border border-white/10 text-zinc-300 mb-4">
            <Hexagon className="w-3.5 h-3.5 text-zinc-400" />
            <span>INTRODUCTION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            What is One Mind ?
          </h2>

          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-2xl mx-auto">
            A unified multimodal AI workspace powered by Usick One and world-class AI models — bridging smart reasoning, code development, and daily productivity in one seamless canvas.
          </p>
        </div>

        {/* 3 Horizontal Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-7 flex items-start gap-4 transition-all duration-300 hover:bg-[#151515] hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 text-white group-hover:border-white/25 transition-colors">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-[17px] font-semibold text-white mb-2 tracking-tight">
                Unified Model Hub
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Access flagship models like GPT-4o, Claude 3.5, Gemini, DeepSeek, and Usick One in one cohesive interface.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-7 flex items-start gap-4 transition-all duration-300 hover:bg-[#151515] hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 text-white group-hover:border-white/25 transition-colors">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-[17px] font-semibold text-white mb-2 tracking-tight">
                Real-Time, Voice-Driven Execution
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Instant voice commands, realtime web search with verified sources, and adaptive reasoning depth.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-7 flex items-start gap-4 transition-all duration-300 hover:bg-[#151515] hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 text-white group-hover:border-white/25 transition-colors">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-[17px] font-semibold text-white mb-2 tracking-tight">
                Integrated Studio &amp; Productivity Layer
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Native Code PRD studio with live preview, smart schedule parser, cloud notes, and synced media right out of the box.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: HOW IT WORKS (4 Cards matching reference)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[1240px] mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          {/* Section Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-[#111111] border border-white/10 text-zinc-300 mb-4">
            <Hexagon className="w-3.5 h-3.5 text-zinc-400" />
            <span>CHOOSE • CREATE • DEPLOY • SYNC</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            How it Works
          </h2>

          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-2xl mx-auto">
            Select your workspace, converse with intelligent AI, or build software from idea to code:
          </p>
        </div>

        {/* 4 Cards in Horizontal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Choose Node / Model */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/22 p-6 flex flex-col justify-between min-h-[380px] transition-all duration-300 hover:bg-[#151515]">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 tracking-tight">
                Choose Model
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Select a model from our curated engine or bring your preferred reasoning depth.
              </p>
            </div>

            {/* Visual: Ambient Radar Disc with Centered One Mind Glyph */}
            <div className="relative w-full aspect-square max-h-[170px] rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 flex items-center justify-center overflow-hidden mt-6">
              <div className="absolute inset-4 rounded-full border border-white/[0.08] animate-pulse" />
              <div className="absolute inset-10 rounded-full border border-white/[0.12]" />
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.15)]">
                <OneMindGlyph size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Card 2: Deploy to Code PRD */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/22 p-6 flex flex-col justify-between min-h-[380px] transition-all duration-300 hover:bg-[#151515]">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 tracking-tight">
                Deploy to Code PRD
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Architect blueprints, generate project files, and preview frontend code in live sandbox.
              </p>
            </div>

            {/* Visual: Stacked Status Items List */}
            <div className="w-full rounded-2xl bg-[#0A0A0A] border border-white/10 p-3 flex flex-col gap-2 mt-6">
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-white/5 text-xs text-zinc-300">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Usick One Flagship
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Core</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/50 border border-white/5 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  Claude 3.5 &amp; GPT-4o
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">PRO</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/50 border border-white/5 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Live Sandbox
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">HTML/JS</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/50 border border-white/5 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Web Search
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Citations</span>
              </div>
            </div>
          </div>

          {/* Card 3: Command & Schedule */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/22 p-6 flex flex-col justify-between min-h-[380px] transition-all duration-300 hover:bg-[#151515]">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 tracking-tight">
                Command &amp; Schedule
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Natural language schedule parsing with 2-way Google Calendar sync and browser reminders.
              </p>
            </div>

            {/* Visual: Floating Wireframe Cube + Interactive Command Input Bar */}
            <div className="flex flex-col items-center justify-end w-full mt-6">
              {/* Wireframe geometric graphic */}
              <div className="w-20 h-20 mb-3 relative flex items-center justify-center">
                <div className="absolute inset-0 border border-white/20 rotate-45 rounded-lg animate-pulse" />
                <div className="absolute inset-2 border border-white/30 -rotate-12 rounded-lg" />
                <OneMindGlyph size={22} className="text-white relative z-10" />
              </div>

              {/* Command Prompt Mockup */}
              <div
                onClick={() => onGetStarted?.("signup")}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-white/15 text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors"
              >
                <span className="truncate">Give any command...!</span>
                <div className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Send className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Playground & Live Preview */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/22 p-6 flex flex-col justify-between min-h-[380px] transition-all duration-300 hover:bg-[#151515]">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 tracking-tight">
                Playground Mode
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Simulate, refine, and iterate responses or live code previews in a safe, instant sandbox.
              </p>
            </div>

            {/* Visual: Dark IDE Code Terminal Window */}
            <div className="w-full rounded-2xl bg-[#0A0A0A] border border-white/10 p-3 mt-6 font-mono text-[11px] leading-relaxed text-zinc-400 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/5">
                <span className="w-2 h-2 rounded-full bg-red-500/80" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                <span className="w-2 h-2 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-zinc-500 ml-2">sandbox.json</span>
              </div>
              <p className="text-zinc-500">{"{"}</p>
              <p className="pl-2">
                <span className="text-zinc-300">&quot;engine&quot;</span>: <span className="text-emerald-400">&quot;usick-1.1&quot;</span>,
              </p>
              <p className="pl-2">
                <span className="text-zinc-300">&quot;effort&quot;</span>: <span className="text-sky-400">&quot;max&quot;</span>,
              </p>
              <p className="pl-2">
                <span className="text-zinc-300">&quot;streaming&quot;</span>: <span className="text-amber-400">true</span>
              </p>
              <p className="text-zinc-500">{"}"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4: WHAT WE PROVIDE? (Bento Grid matching reference)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="features-bento" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[1240px] mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          {/* Section Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-[#111111] border border-white/10 text-zinc-300 mb-4">
            <Hexagon className="w-3.5 h-3.5 text-zinc-400" />
            <span>ALL-IN-ONE WORKSPACE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            What we provide?
          </h2>

          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-2xl mx-auto">
            One Mind brings together intelligent reasoning, full-stack dev tools, and daily productivity through a unified runtime.
          </p>
        </div>

        {/* Bento Grid Row 1 (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Bento Card 1: One Mind Core Engine (Keyboard Key Visual) */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 flex flex-col justify-between min-h-[320px] transition-all duration-300 hover:bg-[#151515]">
            {/* Visual: Tactile Keycaps with Center Glowing Key */}
            <div className="w-full h-36 rounded-xl bg-gradient-to-b from-[#181818] to-[#0d0d0d] border border-white/10 flex items-center justify-center gap-2 p-4 mb-6 shadow-inner">
              <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 text-xs font-mono">
                ⌘
              </div>
              <div className="w-14 h-14 rounded-xl bg-[#1f1f22] border border-white/30 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                <OneMindGlyph size={28} className="text-white" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 text-xs font-mono">
                ⌥
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
                One Mind Core Engine
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                State-of-the-art multimodal reasoning with adaptive effort levels (Faster, Balanced, Max).
              </p>
            </div>
          </div>

          {/* Bento Card 2: Edge-Synced Execution (Telemetry Dashboard Preview) */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 flex flex-col justify-between min-h-[320px] transition-all duration-300 hover:bg-[#151515]">
            {/* Visual: Live Telemetry Preview Panel */}
            <div className="w-full h-36 rounded-xl bg-[#09090b] border border-white/10 p-3 flex flex-col justify-between mb-6 font-mono text-[11px]">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-zinc-400">Sync Pipeline</span>
                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CONNECTED
                </span>
              </div>
              <div className="space-y-1.5 text-[10px] text-zinc-500">
                <div className="flex justify-between">
                  <span>Chat Stream Latency</span>
                  <span className="text-zinc-300">~18ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Code Sandbox Bridge</span>
                  <span className="text-zinc-300">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Google Calendar 2-Way</span>
                  <span className="text-zinc-300">Synced</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
                Edge-Synced Execution
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Realtime streaming responses, persistent sessions, and seamless cross-device synchronization.
              </p>
            </div>
          </div>

          {/* Bento Card 3: PlugStack Dev Tools (Tool Grid) */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 flex flex-col justify-between min-h-[320px] transition-all duration-300 hover:bg-[#151515]">
            {/* Visual: Grid of 6 Integrated Tool Icons */}
            <div className="w-full h-36 rounded-xl bg-[#0c0c0e] border border-white/10 grid grid-cols-3 gap-2 p-3 mb-6">
              {[
                { icon: Globe, label: "Search" },
                { icon: Code2, label: "PRD" },
                { icon: Calendar, label: "Calendar" },
                { icon: Eye, label: "Vision" },
                { icon: Music, label: "Music" },
                { icon: FileText, label: "Notes" },
              ].map((tool) => (
                <div
                  key={tool.label}
                  className="rounded-lg bg-zinc-900/80 border border-white/5 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <tool.icon className="w-4 h-4 text-zinc-300" />
                  <span className="text-[10px] font-sans font-medium">{tool.label}</span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
                Integrated Tool Suite
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Native tools for internet search, image generation, voice chat, and calendar scheduling.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid Row 2 (2 Wide Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 4 (Span 5): Cinematic Metallic Architecture */}
          <div className="md:col-span-5 group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 flex flex-col justify-between min-h-[290px] transition-all duration-300 hover:bg-[#151515]">
            {/* Visual: Metallic Ribbon Illustration */}
            <div className="relative w-full h-36 rounded-xl bg-gradient-to-br from-zinc-800/40 via-zinc-900 to-black border border-white/10 flex items-center justify-center overflow-hidden mb-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.15),transparent_70%)]" />
              <svg className="w-3/4 h-24 stroke-white/40 fill-none" viewBox="0 0 100 50">
                <path d="M 0 40 Q 25 5, 50 25 T 100 10" strokeWidth="1.5" />
                <path d="M 0 45 Q 25 10, 50 30 T 100 15" strokeWidth="1" strokeOpacity="0.4" />
                <path d="M 0 50 Q 25 15, 50 35 T 100 20" strokeWidth="0.8" strokeOpacity="0.2" />
              </svg>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
                Cinematic Dark Interface
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Carefully calibrated typography, smooth transitions, and distraction-free dark futuristic aesthetics.
              </p>
            </div>
          </div>

          {/* Card 5 (Span 7): Developer-First Architecture / Code Snippet */}
          <div className="md:col-span-7 group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 flex flex-col justify-between min-h-[290px] transition-all duration-300 hover:bg-[#151515]">
            {/* Visual: Code Editor Mockup */}
            <div className="w-full h-36 rounded-xl bg-[#08080a] border border-white/10 p-3.5 font-mono text-[11px] leading-relaxed text-zinc-300 overflow-hidden mb-6">
              <p className="text-zinc-500">// Make a streaming request to One Mind Core</p>
              <p className="mt-1">
                <span className="text-purple-400">const</span> response ={" "}
                <span className="text-purple-400">await</span> onemind.
                <span className="text-sky-400">chat</span>({`{`}
              </p>
              <p className="pl-4">
                model: <span className="text-emerald-400">&quot;usick-one-flagship&quot;</span>,
              </p>
              <p className="pl-4">
                prompt: <span className="text-emerald-400">&quot;Architect a modular dashboard...&quot;</span>,
              </p>
              <p className="pl-4">
                tools: [<span className="text-amber-400">&quot;web_search&quot;</span>, <span className="text-amber-400">&quot;sandbox&quot;</span>]
              </p>
              <p>{`});`}</p>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
                Developer-First Architecture
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Extensible endpoints, structured PRD generator, and sandbox preview for modern workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5: BOTTOM CALL-TO-ACTION (Pre-Footer Banner)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 sm:py-28 px-5 sm:px-8 border-t border-white/[0.08] bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/15 flex items-center justify-center mb-6 shadow-[0_0_24px_rgba(255,255,255,0.12)]">
            <OneMindGlyph size={26} className="text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Start Creating With One Mind
          </h2>

          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-xl mx-auto mb-8">
            Empower your workflow with unified AI intelligence, code generation, and effortless productivity.
          </p>

          <button
            type="button"
            onClick={() => onGetStarted?.("signup")}
            className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-semibold text-sm sm:text-base bg-white text-black hover:bg-zinc-200 transition-all transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-[0_0_35px_rgba(255,255,255,0.25)]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Component;
