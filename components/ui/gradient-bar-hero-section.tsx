"use client";

import React, { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { LogoCloud } from "@/components/ui/logo-cloud-3";
import { cn } from "@/lib/utils";

type AvatarProps = {
  imageSrc: string;
  delay: number;
};

const Avatar: React.FC<AvatarProps> = ({ imageSrc, delay }) => {
  return (
    <div
      className="relative h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full overflow-hidden border-2 border-zinc-700 shadow-lg animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="User avatar"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
};

const TrustElements: React.FC = () => {
  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
  ];

  return (
    <div className="inline-flex items-center space-x-3 bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md rounded-full py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm shadow-xl">
      <div className="flex -space-x-2 sm:-space-x-2.5">
        {avatars.map((avatar, index) => (
          <Avatar key={index} imageSrc={avatar} delay={index * 150} />
        ))}
      </div>
      <p className="text-zinc-300 whitespace-nowrap text-xs sm:text-sm font-medium">
        <span className="text-white font-semibold">10+ AI Models</span> terhubung dalam One Mind
      </p>
    </div>
  );
};

const GradientBars: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  const numBars = 17;

  const calculateHeight = (index: number, total: number) => {
    const position = index / (total - 1);
    const maxHeight = 100;
    const minHeight = 24;

    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.25);

    return minHeight + (maxHeight - minHeight) * heightPercentage;
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <div
        className="flex h-full w-full items-end"
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {Array.from({ length: numBars }).map((_, index) => {
          const height = calculateHeight(index, numBars);
          return (
            <div
              key={index}
              style={{
                flex: "1 0 calc(100% / 17)",
                maxWidth: "calc(100% / 17)",
                height: "100%",
                background: isDark
                  ? "linear-gradient(to top, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 85%)"
                  : "linear-gradient(to top, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.02) 45%, transparent 85%)",
                transform: `scaleY(${height / 100})`,
                transformOrigin: "bottom",
                transition: "transform 0.5s ease-in-out",
                animation: "pulseBar 2.8s ease-in-out infinite alternate",
                animationDelay: `${index * 0.12}s`,
                outline: "1px solid rgba(0, 0, 0, 0)",
                boxSizing: "border-box",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

interface NavbarProps {
  onGetStarted?: () => void;
  isDark?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStarted, isDark = true }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/40 py-4 px-6 md:px-12 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <svg
              className={cn("w-6 h-6 transition-transform hover:scale-110", isDark ? "text-white fill-white" : "text-zinc-900 fill-zinc-900")}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
            <span className={cn("font-bold text-lg tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
              One Mind
            </span>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              type="button"
              onClick={onGetStarted}
              className={cn(
                "px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-sm",
                isDark
                  ? "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                  : "bg-black hover:bg-zinc-800 text-white shadow-black/10"
              )}
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn("p-1.5 rounded-lg transition-colors cursor-pointer", isDark ? "text-white hover:bg-zinc-800" : "text-zinc-900 hover:bg-zinc-200")}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div
            className={cn(
              "md:hidden mt-3 rounded-2xl p-4 animate-in fade-in-0 slide-in-from-top-2 border shadow-xl",
              isDark ? "bg-zinc-900/95 border-zinc-800 text-white" : "bg-white/95 border-zinc-200 text-zinc-900"
            )}
          >
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onGetStarted?.();
              }}
              className={cn(
                "w-full py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer shadow-sm",
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
              )}
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export interface GradientBarHeroSectionProps {
  onGetStarted?: () => void;
  isDark?: boolean;
}

export const Component: React.FC<GradientBarHeroSectionProps> = ({
  onGetStarted,
  isDark = true,
}) => {
  return (
    <section
      className={cn(
        "relative min-h-screen flex flex-col items-center justify-between px-6 sm:px-8 md:px-12 overflow-hidden transition-colors selection:bg-white/20",
        isDark ? "bg-[#09090b] text-white" : "bg-[#fafafc] text-zinc-900"
      )}
    >
      <style>{`
        @keyframes pulseBar {
          0% {
            opacity: 0.55;
            transform: scaleY(0.85);
          }
          100% {
            opacity: 1;
            transform: scaleY(1.2);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Background Animated Gradient Bars */}
      <GradientBars isDark={isDark} />

      {/* Top Navbar */}
      <Navbar onGetStarted={onGetStarted} isDark={isDark} />

      {/* Center Hero Content */}
      <div className="relative z-10 text-center w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-1 pt-28 pb-12 sm:pt-32 sm:pb-16">
        {/* Trust Badge */}
        <div className="mb-6 sm:mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <TrustElements />
        </div>

        {/* Hero Title */}
        <h1 className="w-full leading-tight tracking-tight mb-5 sm:mb-7 px-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
          <span className="block font-bold text-[clamp(1.85rem,5.5vw,3.75rem)] tracking-tight">
            One Mind. Infinite Intelligence.
          </span>
          <span
            className={cn(
              "block font-medium italic text-[clamp(1.3rem,4vw,2.5rem)] mt-1 sm:mt-2",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            All AI Models in One Seamless Space.
          </span>
        </h1>

        {/* Subtitle / Description */}
        <div className="mb-8 sm:mb-10 px-4 max-w-2xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-800">
          <p
            className={cn(
              "text-[clamp(0.95rem,2.2vw,1.15rem)] leading-relaxed font-normal",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            Akses langsung ekosistem AI terlengkap: Chat, Code, Image Generation, hingga Schedule otomatis bersama model-model terbaik dunia tanpa berpindah aplikasi.
          </p>
        </div>

        {/* CTA Button: Get Started (Replacing waitlist & email field as instructed) */}
        <div className="w-full max-w-md mb-10 sm:mb-12 px-4 flex justify-center animate-in fade-in-0 slide-in-from-bottom-5 duration-1000">
          <button
            type="button"
            onClick={onGetStarted}
            className={cn(
              "group relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-2xl",
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-white/20"
                : "bg-black hover:bg-zinc-800 text-white shadow-black/20"
            )}
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Bottom Models Slider (Replacing Instagram, LinkedIn, GitHub icons as instructed) */}
        <div className="w-full max-w-2xl px-4 flex flex-col items-center animate-in fade-in-0 duration-1000">
          <p
            className={cn(
              "text-[11px] sm:text-xs uppercase tracking-widest font-semibold mb-2.5 select-none",
              isDark ? "text-zinc-500" : "text-zinc-500"
            )}
          >
            Powered by Leading LLM & AI Models
          </p>
          <LogoCloud isDark={isDark} duration={8} className="w-full py-1.5" />
        </div>
      </div>
    </section>
  );
};

export default Component;
