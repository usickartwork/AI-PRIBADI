"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
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

export interface PrismaHeroProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
  onVideoReady?: () => void;
}

const FEATURE_NAV_ITEMS = [
  { label: "AI Chat", targetId: "card-chat" },
  { label: "One Code", targetId: "card-code" },
  { label: "Music", targetId: "card-music" },
  { label: "Schedule", targetId: "card-schedule" },
  { label: "Image", targetId: "card-image" },
  { label: "Faith", targetId: "card-faith" },
];

const PrismaHero = ({ onGetStarted, onOpenPricing, isDark = true, onVideoReady }: PrismaHeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFeaturesOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Strict muted & playsinline setup for mobile browsers (iOS WebKit / Safari / Android Chrome)
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "true");
    v.setAttribute("webkit-playsinline", "true");
    v.setAttribute("x5-playsinline", "true");

    const tryPlay = () => {
      v.muted = true;
      const p = v.play();
      if (p !== undefined) {
        p.then(() => {
          onVideoReady?.();
        }).catch(() => {});
      }
    };

    tryPlay();

    v.addEventListener("loadedmetadata", tryPlay);
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    v.addEventListener("canplaythrough", tryPlay);

    // Continuous check during initial load to guarantee autoplay without play button
    const interval = setInterval(() => {
      if (v.paused) {
        tryPlay();
      } else {
        clearInterval(interval);
      }
    }, 300);

    const timer = setTimeout(() => clearInterval(interval), 5000);

    // Automatic trigger on first gesture (touch or pointer only once, never on scroll to preserve mobile fling inertia)
    const onGesture = () => {
      tryPlay();
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("pointerdown", onGesture);
    };

    window.addEventListener("touchstart", onGesture, { passive: true, once: true });
    window.addEventListener("pointerdown", onGesture, { passive: true, once: true });
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      v.removeEventListener("loadedmetadata", tryPlay);
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("canplaythrough", tryPlay);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, [onVideoReady]);

  const handleNavClick = (targetId: string) => {
    if (targetId.startsWith("card-")) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("select-feature-tab", { detail: targetId }));
      }
      const el = document.getElementById("section-features");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (targetId === "section-pricing" && onOpenPricing) {
      onOpenPricing();
    }
  };

  return (
    <section className="relative h-[100dvh] w-full bg-black overflow-hidden">
      <div className="relative h-full w-full overflow-hidden bg-black">
        {/* Instant background poster behind video */}
        <img
          src="/hero-bw-poster-opt.jpg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center filter grayscale contrast-[1.05] brightness-[0.95]"
          aria-hidden="true"
        />

        {/* Background video (Autoplay, muted, loop, inline, no controls) */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          {...({
            "webkit-playsinline": "true",
            "x5-playsinline": "true",
          } as Record<string, string>)}
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          preload="auto"
          onPlaying={() => onVideoReady?.()}
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime > 0) {
              onVideoReady?.();
            }
          }}
          onLoadedData={() => onVideoReady?.()}
          style={{ pointerEvents: "none" }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center filter grayscale contrast-[1.05] brightness-[0.95]"
          src="/hero-bw-logo-opt.mp4"
        />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* ─── HEADER NAVBAR (Pure Logo, Desktop Jejer Tabs / Mobile 3 Items Dropdown, Highlighted Login) ─── */}
        <header className="absolute top-0 left-0 right-0 z-30 w-full bg-transparent pt-3.5 sm:pt-5 md:pt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
            {/* ─── LEFT: PURE BRAIN LOGO + NAV LINKS ─── */}
            <div className="flex items-center gap-2.5 xs:gap-3 sm:gap-6 md:gap-8 min-w-0">
              <div
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="cursor-pointer group select-none shrink-0 flex items-center"
              >
                <BrainLogo className="w-8 h-8 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform" />
              </div>

              {/* ─── EXACTLY 4 NAV ITEMS: Usick One, Fitur ▾, Pricing, FAQ ────────── */}
              <nav className="flex items-center gap-1 sm:gap-2 md:gap-3.5 lg:gap-4 py-1">
                {/* 1. Usick One */}
                <Link
                  href="/usick-one"
                  className="whitespace-nowrap px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] md:text-sm font-medium text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95 no-underline"
                >
                  Usick One
                </Link>

                {/* 2. Fitur Dropdown (Pure text list, no boxy containers) */}
                <div ref={featuresRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setFeaturesOpen((prev) => !prev)}
                    className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] md:text-sm font-medium text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95"
                  >
                    <span>Fitur</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                        featuresOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu: Pure Typography List Down */}
                  <AnimatePresence>
                    {featuresOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 top-full mt-2 w-36 sm:w-40 rounded-xl bg-black/95 backdrop-blur-2xl border border-white/10 px-3.5 py-3 shadow-2xl z-50 flex flex-col gap-2.5 select-none"
                      >
                        {FEATURE_NAV_ITEMS.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              setFeaturesOpen(false);
                              handleNavClick(item.targetId);
                            }}
                            className="w-full text-left text-xs sm:text-sm font-medium text-zinc-400 hover:text-white hover:translate-x-1 transition-all duration-150 cursor-pointer p-0 bg-transparent border-0"
                          >
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Pricing */}
                <Link
                  href="/harga"
                  className="whitespace-nowrap px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] md:text-sm font-medium text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95 no-underline"
                >
                  Pricing
                </Link>

                {/* 4. FAQ */}
                <button
                  type="button"
                  onClick={() => handleNavClick("section-faq")}
                  className="whitespace-nowrap px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] md:text-sm font-medium text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  FAQ
                </button>
              </nav>
            </div>

            {/* ─── RIGHT: HIGHLIGHTED LOGIN BUTTON (Search removed) ─────────────── */}
            <div className="shrink-0 flex items-center pl-1 sm:pl-2">
              <button
                type="button"
                onClick={() => onGetStarted?.("signin")}
                className="px-3.5 xs:px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white text-black text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              >
                Log in
              </button>
            </div>
          </div>
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
                onClick={() => {
                  const el = document.getElementById("section-chat");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else {
                    onGetStarted?.("signup");
                  }
                }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group inline-flex cursor-pointer items-center gap-2 self-start rounded-full py-1 pl-4 sm:pl-5 pr-1 text-xs sm:text-sm md:text-base font-medium text-black transition-all hover:gap-3 hover:bg-zinc-100"
                style={{ backgroundColor: WHITE }}
              >
                Try for free
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
