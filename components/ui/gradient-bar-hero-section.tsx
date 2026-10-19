"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Zap,
  Layers,
  Shield,
  Activity,
  Code2,
  Calendar,
  Send,
  CheckCircle2,
  Lock,
  Star,
  Globe,
  Bot,
  Laptop,
  Smartphone,
  Tablet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OneMindLogo, OneMindGlyph } from "@/components/ui/one-mind-logo";

export interface GradientBarHeroSectionProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

export const Component: React.FC<GradientBarHeroSectionProps> = ({
  onGetStarted,
  onOpenPricing,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const partnerLogos = [
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
      name: "Claude",
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

  const faqs = [
    {
      q: "How does One Mind compare to separate AI subscriptions?",
      a: "One Mind brings world-class AI models (Usick One Flagship, GPT-4o, Claude 3.5, Gemini 2.0, DeepSeek R1) together with Code PRD studio, Google Calendar sync, and notes into one subscription. You don't need to pay for 4-5 separate services.",
    },
    {
      q: "What is the Usick One AI model inside One Mind?",
      a: "Usick One is our flagship AI reasoning engine based on Apodex. It is available with zero wait times for all users, supporting deep reasoning, live web search, and fast conversational intelligence.",
    },
    {
      q: "Can I build web apps with Code PRD without technical experience?",
      a: "Absolutely. You can describe your product idea in everyday language. One Mind generates the structured PRD, designs code files, and provides an instant live interactive preview directly in your browser.",
    },
    {
      q: "How does the smart schedule integration work?",
      a: "You can write or speak natural phrases like 'Meeting tomorrow at 2 PM with marketing'. One Mind extracts the date, time, and title, saving it to your schedule with two-way Google Calendar synchronization.",
    },
    {
      q: "Is my data and chat history secure?",
      a: "Yes. Your sessions and files are encrypted and stored privately. We do not sell your personal data or use your private conversations to train third-party models.",
    },
  ];

  return (
    <div className="relative w-full bg-[#050505] text-[#F5F5F5] selection:bg-white/20 selection:text-white overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. TOP NAVBAR (Floating pill, matching reference)
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/85 backdrop-blur-md border-b border-white/[0.08] transition-colors select-none">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Brand with concentric dashed logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const container = document.getElementById("page-1-container") || window;
              container.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <OneMindLogo iconSize={24} textClassName="font-bold text-lg tracking-tight text-white" />
          </a>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#A0A0A0]">
            <a href="#why-one-mind" className="hover:text-white transition-colors cursor-pointer">
              Why One Mind
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors cursor-pointer">
              How it Works
            </a>
            <a href="#features" className="hover:text-white transition-colors cursor-pointer">
              Features
            </a>
            <a href="#testimonials" className="hover:text-white transition-colors cursor-pointer">
              Testimonials
            </a>
            <a
              href="#pricing"
              onClick={(e) => {
                if (onOpenPricing) {
                  e.preventDefault();
                  onOpenPricing();
                }
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Plans
            </a>
          </nav>

          {/* Nav Actions */}
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
              Start Now
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0A0A0A] border-b border-white/10 px-6 py-5 flex flex-col gap-4 animate-in fade-in-0 slide-in-from-top-2">
            <a
              href="#why-one-mind"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm text-zinc-300 hover:text-white transition-colors"
            >
              Why One Mind
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm text-zinc-300 hover:text-white transition-colors"
            >
              How it Works
            </a>
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm text-zinc-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#testimonials"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm text-zinc-300 hover:text-white transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onOpenPricing) onOpenPricing();
              }}
              className="text-sm text-zinc-300 hover:text-white transition-colors"
            >
              Plans
            </a>
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
                Start Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. HERO SECTION (Matching reference structure with silver/white metallic glow)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between pt-28 sm:pt-36 pb-12 overflow-hidden">
        {/* Subtle radial ambient spotlight at the top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_40%,transparent_70%)] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[960px] mx-auto text-center px-5 sm:px-8 flex flex-col items-center">
          {/* Onboarding Pill Badge */}
          <div
            onClick={() => onGetStarted?.("signup")}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#111111] border border-white/10 hover:border-white/20 text-[#A0A0A0] hover:text-white mb-6 sm:mb-8 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
            <span>All-in-One AI Workspace 2026</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
          </div>

          {/* Main Headline (2 lines, tight line height, large bold) */}
          <h1 className="text-[clamp(2.5rem,6.8vw,4.8rem)] font-bold tracking-tight text-white leading-[1.08] mb-4 sm:mb-5">
            Think faster.
            <br />
            Convert better.
          </h1>

          {/* Subheadline Tagline */}
          <p className="text-[clamp(0.95rem,2.1vw,1.15rem)] text-[#A0A0A0] max-w-[620px] mx-auto leading-relaxed mb-8 font-normal">
            The Unified AI Workspace that helps creators, developers, and thinkers launch faster and build smarter.
          </p>

          {/* Two Pill CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
            <button
              type="button"
              onClick={() => onGetStarted?.("signup")}
              className="inline-flex items-center gap-2 px-7 sm:px-9 py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-[15px] bg-white text-black hover:bg-zinc-200 transition-all transform hover:scale-[1.02] cursor-pointer shadow-[0_0_35px_rgba(255,255,255,0.22)]"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#why-one-mind"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-medium text-sm sm:text-[15px] bg-[#111111] text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 transition-all cursor-pointer"
            >
              <span>See Features</span>
            </a>
          </div>

          {/* Social Proof / Partner Logos Strip */}
          <div className="w-full flex flex-col items-center gap-3 select-none">
            <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#707070] font-medium">
              Trusted by 10,000+ creators & developers worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 pt-1">
              {partnerLogos.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Bottom Curved Luminous Horizon Banner (Monochrome Silver/White Glow) */}
        <div className="relative w-full max-w-[1240px] mx-auto px-5 sm:px-8 mt-12 sm:mt-16">
          <div className="relative w-full h-32 sm:h-44 rounded-3xl bg-gradient-to-t from-white/[0.12] via-white/[0.04] to-transparent border border-white/[0.12] overflow-hidden flex items-end justify-center p-6 shadow-[0_0_60px_rgba(255,255,255,0.05)]">
            {/* Luminous Horizon Arch */}
            <div
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[85%] h-36 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_40%,transparent_75%)] pointer-events-none"
              aria-hidden="true"
            />
            {/* Ambient center beam */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <OneMindGlyph size={32} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
              <span className="text-xs tracking-wider uppercase font-semibold text-white/80">
                One Mind Architecture
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. SECTION: WHY CREATORS CHOOSE ONE MIND (2x2 Grid, matching reference)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="why-one-mind" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[1240px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-[#111111] border border-white/10 text-zinc-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>WHY US?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Why Creators Stick With Us
          </h2>
          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-xl mx-auto">
            We combine clarity, intelligent reasoning, and high-performance tools to deliver results that actually matter.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Card 1: Implementation and tools */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between min-h-[340px] transition-all duration-300 hover:bg-[#161616]">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 tracking-tight">
                Implementation and tools
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Streamlined multi-model AI chat with Usick One Flagship, Claude, GPT-4o, and Gemini in one unified prompt.
              </p>
            </div>
            {/* Visual: Ambient Glowing Radar with Logo */}
            <div className="relative w-full h-36 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center overflow-hidden mt-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
              <div className="relative w-16 h-16 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                <OneMindGlyph size={28} className="text-white" />
              </div>
            </div>
          </div>

          {/* Card 2: High-converting Code & PRD Studio */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between min-h-[340px] transition-all duration-300 hover:bg-[#161616]">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 tracking-tight">
                High-converting Code PRD
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Architect blueprints, generate multi-file projects, and preview frontend code in an isolated live browser sandbox.
              </p>
            </div>
            {/* Visual: Circuit trace with lightning icon */}
            <div className="relative w-full h-36 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center overflow-hidden mt-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/20 flex items-center justify-center text-white shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1 text-[11px] font-mono text-zinc-400">
                  <span className="text-emerald-400">● Live Preview Active</span>
                  <span>HTML / JS / CSS Engine</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Maximum Return on ROI / Productivity */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between min-h-[340px] transition-all duration-300 hover:bg-[#161616]">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 tracking-tight">
                Maximum Return on Productivity
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Real-time voice commands, web search with verified citations, and intelligent schedule parsing with Google Calendar.
              </p>
            </div>
            {/* Visual: Metric Graph Badge (120% Productivity) */}
            <div className="relative w-full h-36 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center overflow-hidden mt-6 p-4">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
              <div className="relative z-10 text-center">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                  Productivity Velocity
                </span>
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  120%{" "}
                  <span className="text-sm font-normal text-emerald-400">▲ Faster</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Clear steps and trust */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between min-h-[340px] transition-all duration-300 hover:bg-[#161616]">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 tracking-tight">
                Clear steps and trust
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Private chat sessions, end-to-end security, and seamless cross-device cloud synchronization.
              </p>
            </div>
            {/* Visual: Layered pedestal with glowing top emblem */}
            <div className="relative w-full h-36 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center overflow-hidden mt-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
              <div className="flex flex-col items-center gap-1 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="w-20 h-2 bg-white/20 rounded-full" />
                <div className="w-32 h-2 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. SECTION: THE PROCESS FAST, CLEAR, DONE (3 Cards, matching reference)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[1240px] mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-[#111111] border border-white/10 text-zinc-300 mb-4">
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span>PROCESS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            The Process Fast, Clear, Done
          </h2>
          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-xl mx-auto">
            No endless revisions. No messy handoffs. Just a unified AI workflow that delivers real results.
          </p>
        </div>

        {/* 3 Horizontal Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: Share Your Vision */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-7 flex flex-col justify-between min-h-[340px] transition-all duration-300 hover:bg-[#161616]">
            {/* Visual: Chat Prompt Bubble */}
            <div className="w-full h-36 rounded-xl bg-[#0A0A0A] border border-white/10 p-3.5 flex flex-col justify-between mb-6">
              <div className="rounded-lg bg-zinc-900 border border-white/10 p-2 text-xs text-zinc-300">
                &quot;Build a real-time dashboard with search &amp; calendar...&quot;
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>Prompt received</span>
                <span className="text-emerald-400">Ready</span>
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
                Share Your Vision
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Chat naturally or speak your ideas using voice mode to outline projects, tasks, or creative drafts.
              </p>
            </div>
          </div>

          {/* Card 2: AI Generates & Designs */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-7 flex flex-col justify-between min-h-[340px] transition-all duration-300 hover:bg-[#161616]">
            {/* Visual: Code PRD Wireframe Sandbox */}
            <div className="w-full h-36 rounded-xl bg-[#0A0A0A] border border-white/10 p-3 flex flex-col justify-between mb-6 font-mono text-[11px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5 text-zinc-400">
                <span>Blueprint Generator</span>
                <span className="text-[10px] text-sky-400">PRD.json</span>
              </div>
              <div className="space-y-1 text-zinc-500 text-[10px]">
                <p>+ app/dashboard/page.tsx</p>
                <p>+ lib/api/sync.ts</p>
                <p>+ components/ui/card.tsx</p>
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
                We Architect &amp; Build
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                One Mind drafts the PRD blueprint, structures code files, or sets calendar agendas in real time.
              </p>
            </div>
          </div>

          {/* Card 3: Ready to Launch */}
          <div className="group rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-6 sm:p-7 flex flex-col justify-between min-h-[340px] transition-all duration-300 hover:bg-[#161616]">
            {/* Visual: Launch Emblem with Radial Rays */}
            <div className="relative w-full h-36 rounded-xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center overflow-hidden mb-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18)_0%,transparent_60%)]" />
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/25 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <OneMindGlyph size={28} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
                Ready to Launch
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                Run live previews, export code, or sync schedules straight to Google Calendar with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. SECTION: ASYMMETRICAL SPLIT CARDS (Matching reference bottom left)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[1240px] mx-auto border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Split Card A: Don't settle for single-model subscriptions */}
          <div className="group rounded-3xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 hover:bg-[#161616]">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                Don&apos;t settle for single-model subscriptions
              </h3>
              <p className="text-sm text-[#A0A0A0] leading-relaxed mb-6 max-w-md">
                Why pay for 5 separate AI tools? One Mind gives you access to flagship reasoning, code studio, smart calendar, image generation, and music in one unified workspace.
              </p>
              <button
                type="button"
                onClick={() => onGetStarted?.("signup")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <span>Start Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual: Layered Device Mockups */}
            <div className="relative w-full h-48 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center gap-3 overflow-hidden mt-8 p-4">
              <div className="flex items-center gap-3 text-zinc-400">
                <div className="w-16 h-24 rounded-xl border border-white/15 bg-zinc-900/80 flex flex-col items-center justify-center p-2">
                  <Smartphone className="w-5 h-5 text-zinc-300" />
                  <span className="text-[9px] mt-1 font-mono">Mobile</span>
                </div>
                <div className="w-28 h-32 rounded-xl border border-white/25 bg-zinc-900 flex flex-col items-center justify-center p-3 shadow-xl">
                  <Laptop className="w-7 h-7 text-white" />
                  <span className="text-[10px] mt-1.5 font-mono text-zinc-200">Web App</span>
                </div>
                <div className="w-20 h-28 rounded-xl border border-white/15 bg-zinc-900/80 flex flex-col items-center justify-center p-2">
                  <Tablet className="w-5 h-5 text-zinc-300" />
                  <span className="text-[9px] mt-1 font-mono">Tablet</span>
                </div>
              </div>
            </div>
          </div>

          {/* Split Card B: We think deeply before we execute */}
          <div className="group rounded-3xl bg-[#111111] border border-white/[0.08] hover:border-white/20 p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 hover:bg-[#161616]">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                We think deeply before we execute
              </h3>
              <p className="text-sm text-[#A0A0A0] leading-relaxed mb-6 max-w-md">
                Adaptive effort levels (Faster, Balanced, Max) let you tune neural reasoning depth for instant quick replies or comprehensive multi-step analysis.
              </p>
              <button
                type="button"
                onClick={() => onGetStarted?.("signup")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <span>Start Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual: Connected Neural Nodes */}
            <div className="relative w-full h-48 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center overflow-hidden mt-8 p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_65%)]" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-xs font-mono text-zinc-400">
                  Faster
                </div>
                <div className="w-12 h-[1px] bg-gradient-to-r from-white/20 to-white/60" />
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/40 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  <OneMindGlyph size={24} className="text-white" />
                </div>
                <div className="w-12 h-[1px] bg-gradient-to-r from-white/60 to-white/20" />
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-xs font-mono text-zinc-400">
                  Max
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. SECTION: WHAT FOUNDERS ARE SAYING (Testimonials, matching reference)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[1240px] mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-[#111111] border border-white/10 text-zinc-300 mb-4">
            <Star className="w-3.5 h-3.5 text-zinc-400" />
            <span>TESTIMONIALS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            What Founders Are Saying
          </h2>
          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-xl mx-auto">
            Creators trust One Mind to help founders turn ideas into reality and ship with impact.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="rounded-2xl bg-[#111111] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between">
            <p className="text-sm text-zinc-300 leading-relaxed mb-6 italic">
              &quot;Having GPT-4o, Claude 3.5, and Usick One in a single tab transformed our workflow. We draft PRDs and generate frontend previews 3x faster without leaving the app.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white font-semibold text-sm">
                MR
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Michael R.</p>
                <p className="text-xs text-zinc-500">Growth Lead at Co-Found</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#111111] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between">
            <p className="text-sm text-zinc-300 leading-relaxed mb-6 italic">
              &quot;The smart schedule parser with Google Calendar integration alone is worth it. I type my day in natural language and my entire agenda syncs automatically.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white font-semibold text-sm">
                JL
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Jason L.</p>
                <p className="text-xs text-zinc-500">Founder at LaunchGrid</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#111111] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between">
            <p className="text-sm text-zinc-300 leading-relaxed mb-6 italic">
              &quot;The minimalist dark futuristic interface is stunning. It feels like an authentic pro workspace, not another generic dashboard. Simply indispensable.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white font-semibold text-sm">
                EB
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Emily B.</p>
                <p className="text-xs text-zinc-500">Tech Lead &amp; Designer</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          7. SECTION: PRICING (Straightforward pricing that fits, matching reference)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[1240px] mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-[#111111] border border-white/10 text-zinc-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Straightforward pricing that fits
          </h2>
          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-xl mx-auto">
            Whether you&apos;re launching your first idea or scaling your startup, One Mind has a plan that fits your pace.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card 1: Starter Plan */}
          <div className="rounded-3xl bg-[#111111] border border-white/[0.08] p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <OneMindGlyph size={18} className="text-zinc-400" />
                <h3 className="text-base font-semibold text-white">Starter Plan</h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-white">$0</span>
                <span className="text-xs text-zinc-500 ml-1.5">USD / free forever</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>Usick One Flagship AI access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>10,000 monthly AI credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>Up to 3 active schedules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>Standard web search</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onGetStarted?.("signup")}
              className="w-full mt-8 py-3 rounded-full text-xs font-semibold border border-white/15 text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Choose this plan
            </button>
          </div>

          {/* Card 2: Pro Plan (Highlighted Card) */}
          <div className="relative rounded-3xl bg-[#161616] border border-white/25 p-7 sm:p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(255,255,255,0.08)] transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white text-black shadow-md">
              Most Popular
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 pt-2">
                <OneMindGlyph size={18} className="text-white" />
                <h3 className="text-base font-semibold text-white">Pro Plan</h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-white">Rp 50.000</span>
                <span className="text-xs text-zinc-400 ml-1.5">/ bulan</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>All Flagship Models (Claude 3.5, GPT-4o, Gemini)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>50,000 AI Credits + 50 Code Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Code PRD Studio &amp; Live Sandbox Preview</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>50 Smart Schedules &amp; Google Calendar sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Music Connect, Image Studio &amp; Private Messages</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onOpenPricing) onOpenPricing();
                else onGetStarted?.("signup");
              }}
              className="w-full mt-8 py-3 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all transform hover:scale-[1.02] cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              Choose Pro Plan
            </button>
          </div>

          {/* Card 3: Velocity+ Plan */}
          <div className="rounded-3xl bg-[#111111] border border-white/[0.08] p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <OneMindGlyph size={18} className="text-zinc-400" />
                <h3 className="text-base font-semibold text-white">Velocity+ Plan</h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-white">Custom</span>
                <span className="text-xs text-zinc-500 ml-1.5">/ enterprise &amp; teams</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>Unlimited Max-effort reasoning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>Team seats &amp; shared workspace projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>Dedicated priority throughput</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>Early access to newly released models</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onOpenPricing) onOpenPricing();
                else onGetStarted?.("signup");
              }}
              className="w-full mt-8 py-3 rounded-full text-xs font-semibold border border-white/15 text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Choose this plan
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          8. SECTION: FAQ ACCORDION (Matching reference)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-24 sm:py-32 px-5 sm:px-8 max-w-[850px] mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-[#111111] border border-white/10 text-zinc-300 mb-4">
            <span>FAQS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Questions? We&apos;ve got answers.
          </h2>
          <p className="text-sm text-[#A0A0A0] leading-relaxed">
            We&apos;ve answered the most common questions below. If you still need help, reach out to our team.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={item.q}
                className="rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/15 transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 sm:py-5 flex items-center justify-between text-left text-sm sm:text-base font-semibold text-white cursor-pointer select-none"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-4",
                      isOpen && "rotate-180 text-white"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#A0A0A0] leading-relaxed border-t border-white/5 animate-in fade-in-0 duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          9. PRE-FOOTER CTA BANNER (Curved horizon with central glyph)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 sm:py-28 px-5 sm:px-8 border-t border-white/[0.08]">
        <div className="max-w-[960px] mx-auto text-center flex flex-col items-center">
          {/* Luminous Logo Circle */}
          <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-white/20 flex items-center justify-center mb-6 shadow-[0_0_35px_rgba(255,255,255,0.18)]">
            <OneMindGlyph size={32} className="text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Ready to launch something that actually works?
          </h2>

          <p className="text-sm sm:text-base text-[#A0A0A0] leading-relaxed max-w-lg mx-auto mb-8">
            Let One Mind design the workflow your ideas deserve. Clean, strategic, and ready to grow.
          </p>

          <button
            type="button"
            onClick={() => onGetStarted?.("signup")}
            className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-semibold text-sm sm:text-base bg-white text-black hover:bg-zinc-200 transition-all transform hover:scale-[1.02] cursor-pointer shadow-[0_0_35px_rgba(255,255,255,0.22)]"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Component;
