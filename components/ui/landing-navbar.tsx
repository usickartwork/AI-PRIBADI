"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingNavbarProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  isDark?: boolean;
}

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/ai-chat", label: "AI Chat" },
  { href: "/code-studio", label: "Code Studio" },
  { href: "/music", label: "Music" },
  { href: "/harga", label: "Harga" },
];

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onGetStarted, isDark = true }) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAction = (mode: "signin" | "signup") => {
    if (onGetStarted) {
      onGetStarted(mode);
    } else {
      window.location.href = mode === "signin" ? "/sign-in" : "/sign-up";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-10 pt-4 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl bg-black/60 dark:bg-black/70 border border-white/15 text-white shadow-lg transition-transform hover:scale-105"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-xs">
            1
          </span>
          <span className="font-extrabold tracking-tight text-sm text-[#E1E0CC]">
            One Mind
          </span>
        </Link>

        {/* Desktop Navigation Links Pill */}
        <nav className="pointer-events-auto hidden md:flex items-center gap-1 p-1 rounded-full backdrop-blur-2xl bg-black/65 dark:bg-black/80 border border-white/15 shadow-xl">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200",
                  isActive
                    ? "bg-white text-black shadow-xs font-bold"
                    : "text-[#E1E0CC]/80 hover:text-[#E1E0CC] hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleAction("signin")}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#E1E0CC] hover:text-white backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleAction("signup")}
            className="group flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-black bg-[#E1E0CC] hover:bg-white transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="pointer-events-auto md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full backdrop-blur-xl bg-black/70 border border-white/20 text-[#E1E0CC] shadow-md cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="pointer-events-auto md:hidden max-w-sm mx-auto mt-2 p-3 rounded-2xl backdrop-blur-2xl bg-black/95 border border-white/20 shadow-2xl animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white text-black font-bold"
                      : "text-[#E1E0CC]/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleAction("signin");
              }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-center text-[#E1E0CC] border border-white/15 bg-white/5 cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleAction("signup");
              }}
              className="w-full py-2 rounded-xl text-xs font-bold text-center text-black bg-[#E1E0CC] cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
