"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

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

type NavAction = "signup" | "signin" | "pricing";

interface NavItem {
  label: string;
  targetId?: string;
  href?: string;
  action?: NavAction;
}

const navItems: NavItem[] = [
  { label: "AI Chat", targetId: "section-chat" },
  { label: "One Code", targetId: "card-code" },
  { label: "Music", targetId: "card-music" },
  { label: "Schedule", targetId: "card-schedule" },
  { label: "Image", targetId: "card-image" },
  { label: "Faith", targetId: "card-faith" },
  { label: "Harga", targetId: "section-pricing", href: "/harga" },
  { label: "FAQ", targetId: "section-faq" },
  { label: "Sign In", action: "signin" },
];

export interface PrismaHeroProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
  onVideoReady?: () => void;
}

const PrismaHero = ({ onGetStarted, onOpenPricing, isDark = true, onVideoReady }: PrismaHeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleNav = (item: NavItem) => {
    if (item.action) {
      if (item.action === "pricing") {
        const el = document.getElementById("section-pricing");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (onOpenPricing) onOpenPricing();
        else onGetStarted?.("signup");
        return;
      }
      onGetStarted?.(item.action);
      return;
    }

    if (item.targetId) {
      const el = document.getElementById(item.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    if (item.href) {
      window.location.href = item.href;
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Navbar */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2 max-w-[96vw]">
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-b-2xl bg-black px-2.5 py-1.5 sm:gap-4 md:gap-6 md:rounded-b-3xl md:px-7 md:py-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNav(item)}
                className="cursor-pointer text-[9px] transition-colors sm:text-xs md:text-sm font-medium hover:scale-105 active:scale-95"
                style={{ color: WHITE_MUTED }}
                onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
                onMouseLeave={(e) => (e.currentTarget.style.color = WHITE_MUTED)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

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
