"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Search,
  Menu,
  X,
  MessageSquare,
  Code2,
  Music,
  Calendar,
  Image as ImageIcon,
  Heart,
  Sparkles,
  Radio,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrainLogo } from "@/components/ui/brain-logo";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
  wordSpacing?: string;
}

export const WordsPullUp = ({
  text,
  className = "",
  showAsterisk = false,
  style,
  wordSpacing = "0.08em",
}: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : wordSpacing }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({ segments, className = "", style }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- Hero ---------------- */
const WHITE = "#ffffff";
const WHITE_MUTED = "rgba(255, 255, 255, 0.75)";



export interface PrismaHeroProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
  onVideoReady?: () => void;
}

const PrismaHero = ({ onGetStarted, onOpenPricing, isDark = true, onVideoReady }: PrismaHeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<"library" | "product" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Ensure smooth, immediate playback without initial freeze
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      const p = v.play();
      if (p !== undefined) {
        p.then(() => {
          onVideoReady?.();
        }).catch(() => {});
      }
    }
  }, [onVideoReady]);

  // Tutup dropdown jika user klik di luar area navbar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shortcut Keyboard ⌘K / Ctrl+K untuk langsung menuju AI Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleSearchClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchClick = () => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    const el = document.getElementById("section-chat");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const textarea = el.querySelector("textarea");
        if (textarea) textarea.focus();
      }, 400);
    }
  };

  const handleFeatureSelect = (targetId: string) => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("select-feature-tab", { detail: targetId }));
    }
    const el = document.getElementById("section-features") || document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePricingClick = () => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    const el = document.getElementById("section-pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (onOpenPricing) {
      onOpenPricing();
    }
  };

  const handleFaqClick = () => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    const el = document.getElementById("section-faq");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      className="relative h-[100dvh] w-full bg-black overflow-hidden"
    >
      <div className="relative h-full w-full overflow-hidden bg-black">
        {/* Background video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onPlaying={() => onVideoReady?.()}
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime > 0) {
              onVideoReady?.();
            }
          }}
          onLoadedData={() => onVideoReady?.()}
          className="absolute inset-0 h-full w-full object-cover object-center filter grayscale contrast-[1.05] brightness-[0.95]"
          src="/hero-bw-logo.mp4"
        />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* ─── 21ST-STYLE HEADER NAVBAR ────────────────────────────────────── */}
        <header
          ref={headerRef}
          className="absolute top-0 left-0 right-0 z-30 w-full bg-black/40 backdrop-blur-md border-b border-white/[0.08]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-14 sm:h-16 flex items-center justify-between">
            {/* ─── LEFT: BRAND LOGO (21ST style diganti BrainLogo) ───────────── */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 group-hover:bg-white/15 transition-all border border-white/10">
                <BrainLogo className="w-5 h-5 text-white group-hover:scale-105 transition-transform" />
              </div>
              <span className="font-bold text-white text-sm sm:text-base tracking-tight font-sans">
                One Mind
              </span>
            </div>

            {/* ─── CENTER: NAV LINKS (Library ▾, Product ▾, Pricing) ──────────── */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {/* Dropdown 1: Library ▾ */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "library" ? null : "library")}
                  onMouseEnter={() => setOpenDropdown("library")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    openDropdown === "library"
                      ? "text-white bg-white/10"
                      : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <span>Library</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                      openDropdown === "library" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openDropdown === "library" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      onMouseLeave={() => setOpenDropdown(null)}
                      className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 p-2 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-1.5 text-[10px] font-mono tracking-wider uppercase text-zinc-500 font-semibold">
                        Koleksi &amp; Sumber Daya
                      </div>
                      <button
                        type="button"
                        onClick={handlePricingClick}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-all flex items-start gap-3 group cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Model AI Catalog</div>
                          <div className="text-[11px] text-zinc-400">Claude 3.7, Gemini 3.6, DeepSeek, Qwen</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeatureSelect("card-code")}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-all flex items-start gap-3 group cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                          <Code2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">PRD Architecture</div>
                          <div className="text-[11px] text-zinc-400">Template spesifikasi &amp; diagram sistem</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeatureSelect("card-music")}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-all flex items-start gap-3 group cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">24/7 LIVE Radio</div>
                          <div className="text-[11px] text-zinc-400">Siaran audio &amp; musik fokus tanpa jeda</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={handleFaqClick}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-all flex items-start gap-3 group cursor-pointer border-t border-white/10 mt-1 pt-2"
                      >
                        <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Pusat Bantuan &amp; FAQ</div>
                          <div className="text-[11px] text-zinc-400">Panduan kredit, paket, &amp; fitur</div>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dropdown 2: Product ▾ */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "product" ? null : "product")}
                  onMouseEnter={() => setOpenDropdown("product")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    openDropdown === "product"
                      ? "text-white bg-white/10"
                      : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <span>Product</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                      openDropdown === "product" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openDropdown === "product" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      onMouseLeave={() => setOpenDropdown(null)}
                      className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 p-2 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-1.5 text-[10px] font-mono tracking-wider uppercase text-zinc-500 font-semibold">
                        Modul Ekosistem One Mind
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <button
                          type="button"
                          onClick={() => handleFeatureSelect("card-chat")}
                          className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all flex items-start gap-2.5 group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">AI Chat &amp; Browse</div>
                            <div className="text-[11px] text-zinc-400">Usick One flagship &amp; penelusuran web</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeatureSelect("card-code")}
                          className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all flex items-start gap-2.5 group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                            <Code2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">One Code Studio</div>
                            <div className="text-[11px] text-zinc-400">Rancang spesifikasi PRD &amp; arsitektur</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeatureSelect("card-music")}
                          className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all flex items-start gap-2.5 group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                            <Music className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Music One</div>
                            <div className="text-[11px] text-zinc-400">Audio jernih &amp; lirik realtime karaoke</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeatureSelect("card-schedule")}
                          className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all flex items-start gap-2.5 group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Smart Schedule</div>
                            <div className="text-[11px] text-zinc-400">Manajemen agenda bahasa alami &amp; kalender</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeatureSelect("card-image")}
                          className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all flex items-start gap-2.5 group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">One Image Studio</div>
                            <div className="text-[11px] text-zinc-400">Studio generasi visual rasio fleksibel</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeatureSelect("card-faith")}
                          className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all flex items-start gap-2.5 group cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-white/10 text-white mt-0.5">
                            <Heart className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Faith Hub</div>
                            <div className="text-[11px] text-zinc-400">Ruang hening kontemplasi &amp; refleksi batin</div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Link: Pricing */}
              <button
                type="button"
                onClick={handlePricingClick}
                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                Pricing
              </button>
            </nav>

            {/* ─── RIGHT: SEARCH ⌘K & LOG IN ─────────────────────────────────── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={handleSearchClick}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs text-zinc-300 hover:text-white transition-all cursor-pointer group shadow-xs"
                title="Mulai percakapan cerdas Usick One (⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                <span className="hidden sm:inline text-xs font-medium text-zinc-300 group-hover:text-white">Search</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10 font-medium">⌘K</kbd>
              </button>

              <button
                type="button"
                onClick={() => onGetStarted?.("signin")}
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06]"
              >
                Log in
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white md:hidden cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ─── MOBILE DRAWER MENU ─────────────────────────────────────────── */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="md:hidden bg-zinc-950/98 backdrop-blur-2xl border-t border-white/10 px-4 py-4 space-y-3 overflow-hidden"
              >
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-zinc-500 font-semibold px-2">
                    Fitur Unggulan
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFeatureSelect("card-chat")}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>AI Chat &amp; Browse</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeatureSelect("card-code")}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>One Code Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeatureSelect("card-music")}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Music One</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeatureSelect("card-schedule")}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Smart Schedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeatureSelect("card-image")}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>One Image Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeatureSelect("card-faith")}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Faith Hub</span>
                  </button>
                </div>

                <div className="border-t border-white/10 pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={handlePricingClick}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pricing &amp; Paket Kuota</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFaqClick}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Pusat Bantuan &amp; FAQ</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 sm:px-6 sm:pb-4 md:px-10 md:pb-6">
          <div className="grid grid-cols-12 items-end gap-3 sm:gap-4">
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-black leading-[0.82] tracking-[-0.095em] text-[18vw] xs:text-[20vw] sm:text-[20vw] md:text-[18vw] lg:text-[13vw] xl:text-[12.5vw] select-none"
                style={{ color: WHITE, fontWeight: 900 }}
              >
                <WordsPullUp text="One Mind" showAsterisk wordSpacing="0.08em" />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-3 sm:gap-4 md:gap-5 pb-2 sm:pb-4 lg:col-span-4 lg:pb-10">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-xs md:text-sm font-semibold uppercase tracking-[0.16em]"
                style={{ color: WHITE }}
              >
                Infinite Intelligence.
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="-mt-1.5 text-xs sm:text-sm md:text-base leading-snug sm:leading-relaxed"
                style={{ color: "rgba(255, 255, 255, 0.75)" }}
              >
                Semua model AI dalam satu ruang kerja: Multi-Model AI Chat, Voice Assistant Realtime, Code Studio &amp;
                PRD, Image Studio, Music, Messages Realtime, Smart Schedule, hingga Catatan Pintar — tanpa berpindah
                aplikasi.
              </motion.p>

              <motion.button
                type="button"
                onClick={() => onGetStarted?.("signup")}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group inline-flex cursor-pointer items-center gap-2 self-start rounded-full py-1 pl-4 sm:pl-5 pr-1 text-xs sm:text-sm md:text-base font-medium text-black transition-all hover:gap-3 hover:bg-zinc-100"
                style={{ backgroundColor: WHITE }}
              >
                Get Started
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: WHITE }} />
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { PrismaHero };
export default PrismaHero;
