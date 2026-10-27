"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
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
            style={{ marginRight: isLast ? 0 : "0.25em" }}
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
const CREAM = "#E1E0CC";
const CREAM_MUTED = "rgba(225, 224, 204, 0.8)";

type NavAction = "signup" | "signin" | "pricing";

const navItems: { label: string; action: NavAction }[] = [
  { label: "AI Chat", action: "signup" },
  { label: "Code Studio", action: "signup" },
  { label: "Music", action: "signup" },
  { label: "Harga", action: "pricing" },
  { label: "Sign In", action: "signin" },
];

export interface PrismaHeroProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

const PrismaHero = ({ onGetStarted, onOpenPricing, isDark = true }: PrismaHeroProps) => {
  const handleNav = (action: NavAction) => {
    if (action === "pricing") {
      if (onOpenPricing) onOpenPricing();
      else onGetStarted?.("signup");
      return;
    }
    onGetStarted?.(action);
  };

  return (
    <section
      className="h-[100dvh] w-full p-2 md:p-3"
      style={{ backgroundColor: isDark ? "#09090b" : "#ffffff" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-[2rem] bg-black">
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
        />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Navbar */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <div className="flex items-center gap-3 whitespace-nowrap rounded-b-2xl bg-black px-4 py-2 sm:gap-6 md:gap-12 md:rounded-b-3xl md:px-8 lg:gap-14">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNav(item.action)}
                className="cursor-pointer text-[10px] transition-colors sm:text-xs md:text-sm"
                style={{ color: CREAM_MUTED }}
                onMouseEnter={(e) => (e.currentTarget.style.color = CREAM)}
                onMouseLeave={(e) => (e.currentTarget.style.color = CREAM_MUTED)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 sm:px-6 md:px-10">
          <div className="grid grid-cols-12 items-end gap-4">
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-medium leading-[0.85] tracking-[-0.07em] text-[24vw] sm:text-[22vw] md:text-[20vw] lg:text-[13vw] xl:text-[12.5vw]"
                style={{ color: CREAM }}
              >
                <WordsPullUp text="One Mind" showAsterisk />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm font-semibold uppercase tracking-[0.18em] sm:text-xs md:text-sm"
                style={{ color: CREAM }}
              >
                Infinite Intelligence.
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="-mt-2 text-xs sm:text-sm md:text-base"
                style={{ lineHeight: 1.25, color: "rgba(225, 224, 204, 0.7)" }}
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
                className="group inline-flex cursor-pointer items-center gap-2 self-start rounded-full py-1 pl-5 pr-1 text-sm font-medium text-black transition-all hover:gap-3 sm:text-base"
                style={{ backgroundColor: CREAM }}
              >
                Get Started
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight className="h-4 w-4" style={{ color: CREAM }} />
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
