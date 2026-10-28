"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainLogo } from "@/components/ui/brain-logo";

export interface SiteHeaderProps {
  showBack?: boolean;
  backHref?: string;
  activeItem?: "usick-one" | "fitur" | "pricing" | "faq";
  onGetStarted?: (mode?: "signin" | "signup") => void;
  className?: string;
}

export const FEATURE_NAV_ITEMS = [
  { label: "AI Chat", targetId: "card-chat", href: "/#card-chat" },
  { label: "One Code", targetId: "card-code", href: "/#card-code" },
  { label: "Music", targetId: "card-music", href: "/#card-music" },
  { label: "Schedule", targetId: "card-schedule", href: "/#card-schedule" },
  { label: "Image", targetId: "card-image", href: "/#card-image" },
  { label: "Faith", targetId: "card-faith", href: "/#card-faith" },
];

export function SiteHeader({
  showBack = false,
  backHref = "/",
  activeItem,
  onGetStarted,
  className = "",
}: SiteHeaderProps) {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    if (featuresOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [featuresOpen]);

  return (
    <header className={`w-full z-50 bg-transparent ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* ─── LEFT: BACK BUTTON + BRAIN LOGO + NAV LINKS ─── */}
        <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-4 md:gap-6 min-w-0">
          {showBack && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-all shrink-0"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Kembali</span>
            </Link>
          )}

          <Link
            href="/"
            className="cursor-pointer group select-none shrink-0 flex items-center"
            title="Beranda OneMind"
          >
            <BrainLogo className="w-8 h-8 sm:w-9 sm:h-9 text-white group-hover:scale-110 transition-transform" />
          </Link>

          {/* ─── EXACTLY 4 NAV ITEMS: Usick One, Fitur ▾, Pricing, FAQ ────────── */}
          <nav className="flex items-center gap-1 sm:gap-2 md:gap-3.5 lg:gap-4 py-1">
            {/* 1. Usick One */}
            <Link
              href="/usick-one"
              className={`whitespace-nowrap px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] md:text-sm font-medium transition-all active:scale-95 ${
                activeItem === "usick-one"
                  ? "text-white font-semibold"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              Usick One
            </Link>

            {/* 2. Fitur Dropdown */}
            <div ref={featuresRef} className="relative">
              <button
                type="button"
                onClick={() => setFeaturesOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] md:text-sm font-medium transition-all cursor-pointer active:scale-95 ${
                  activeItem === "fitur"
                    ? "text-white font-semibold"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                <span>Fitur</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    featuresOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

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
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setFeaturesOpen(false)}
                        className="w-full text-left text-xs sm:text-sm font-medium text-zinc-400 hover:text-white hover:translate-x-1 transition-all duration-150 p-0 bg-transparent no-underline"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Pricing */}
            <Link
              href="/harga"
              className={`whitespace-nowrap px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] md:text-sm font-medium transition-all active:scale-95 ${
                activeItem === "pricing"
                  ? "text-white font-semibold"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              Pricing
            </Link>

            {/* 4. FAQ */}
            <Link
              href="/#section-faq"
              className={`whitespace-nowrap px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] md:text-sm font-medium transition-all active:scale-95 ${
                activeItem === "faq"
                  ? "text-white font-semibold"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              FAQ
            </Link>
          </nav>
        </div>

        {/* ─── RIGHT: HIGHLIGHTED LOGIN BUTTON ─── */}
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
  );
}

export default SiteHeader;
