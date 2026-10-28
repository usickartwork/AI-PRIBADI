"use client";

import React, { useEffect, useState } from "react";

export interface CreatorBadgeProps {
  username?: string;
  followers?: string;
  instagramUrl?: string;
  avatarUrl?: string;
  className?: string;
}

/**
 * CreatorBadge: Floating creator attribution pill
 * Displays unified "[ Product by | Avatar | filius_pl | Followers | Instagram Logo ]"
 * Styled as a single enclosed black obsidian pill so nothing clashes with background content.
 * Only appears as a pop-up after the user scrolls past the top hero screen (OneMind animation section).
 */
export function CreatorBadge({
  username = "filius_pl",
  followers = "1.073",
  instagramUrl = "https://www.instagram.com/filius_pl?cplk=a3pjZmhxeTBieXI5&utm_source=qr",
  avatarUrl = "/filius-avatar.png",
  className = "",
}: CreatorBadgeProps) {
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Muncul hanya setelah pengguna melewati layar hero paling atas (~75% tinggi viewport)
      // agar tidak menghalangi tombol CTA / navigasi di halaman animasi OneMind teratas.
      const threshold = typeof window !== "undefined" ? window.innerHeight * 0.75 : 600;
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(currentScroll > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-24px)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      } ${className}`}
    >
      {/* Unified Clickable Pill Badge: "Product by" disatukan di dalam kapsul hitam */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Kunjungi Instagram @${username} (${followers} followers)`}
        title={`Instagram @${username}`}
        className="group relative inline-flex items-center gap-2 sm:gap-2.5 pl-3 pr-2.5 sm:pl-3.5 sm:pr-3 py-1.5 rounded-full bg-[#0a0d14]/90 border border-white/15 hover:border-white/35 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer no-underline"
      >
        {/* Subtle Ambient Hover Glow */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(220, 39, 67, 0.2) 0%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        {/* Label: Product by — menyatu di dalam kapsul latar hitam agar tidak nabrak elemen di belakangnya */}
        <span className="relative z-10 text-zinc-400 group-hover:text-zinc-300 text-xs sm:text-sm font-medium tracking-normal transition-colors shrink-0">
          Product by
        </span>

        {/* Pemisah halus vertikal */}
        <span className="relative z-10 w-px h-3.5 bg-white/20 shrink-0" aria-hidden="true" />

        {/* Circular Profile Avatar */}
        <div className="relative z-10 w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full overflow-hidden ring-1 ring-white/25 shrink-0 bg-zinc-800">
          {!imgError ? (
            <img
              src={avatarUrl}
              alt={username}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-[10px] font-bold text-white">
              F
            </div>
          )}
        </div>

        {/* Creator Username */}
        <span className="relative z-10 font-bold text-white text-xs sm:text-sm tracking-tight transition-colors shrink-0">
          {username}
        </span>

        {/* Followers Count */}
        <span className="relative z-10 font-medium text-zinc-400 group-hover:text-zinc-300 text-xs sm:text-sm tracking-tight transition-colors shrink-0">
          {followers}
        </span>

        {/* Official Instagram Icon */}
        <div className="relative z-10 shrink-0 flex items-center justify-center">
          <svg
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform duration-200"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ig-badge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f09433" />
                <stop offset="25%" stopColor="#e6683c" />
                <stop offset="50%" stopColor="#dc2743" />
                <stop offset="75%" stopColor="#cc2366" />
                <stop offset="100%" stopColor="#bc1888" />
              </linearGradient>
            </defs>
            <rect width="24" height="24" rx="6.5" fill="url(#ig-badge-grad)" />
            <rect
              x="4.75"
              y="4.75"
              width="14.5"
              height="14.5"
              rx="4"
              stroke="#ffffff"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="12" r="3.6" stroke="#ffffff" strokeWidth="1.6" />
            <circle cx="16.2" cy="7.8" r="1" fill="#ffffff" />
          </svg>
        </div>
      </a>
    </div>
  );
}

export default CreatorBadge;
