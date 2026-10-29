"use client";

import React, { useEffect, useState } from "react";

export interface CreatorBadgeProps {
  username?: string;
  followers?: string;
  instagramUrl?: string;
  behanceUrl?: string;
  avatarUrl?: string;
  className?: string;
  alwaysVisible?: boolean;
}

/**
 * CreatorBadge: Floating creator attribution pill
 * Displays unified "[ Product by | Avatar | filius_pl | Followers | Instagram Logo | Behance Logo ]"
 * Styled as a single enclosed black obsidian pill so nothing clashes with background content.
 * Di halaman paling atas (hero) menghilang, baru ketika scroll masuk ke halaman fitur akan muncul.
 */
export function CreatorBadge({
  username = "filius_pl",
  followers = "1.073",
  instagramUrl = "https://www.instagram.com/filius_pl?cplk=a3pjZmhxeTBieXI5&utm_source=qr",
  behanceUrl = "https://www.behance.net/filiuspatrislahendra",
  avatarUrl = "/filius-avatar-opt.png",
  className = "",
  alwaysVisible = false,
}: CreatorBadgeProps) {
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(alwaysVisible);

  useEffect(() => {
    if (alwaysVisible) {
      setIsVisible(true);
      return;
    }

    const checkScroll = () => {
      const page1 = typeof document !== "undefined" ? document.getElementById("page-1-container") : null;
      const currentScroll = Math.max(
        (typeof window !== "undefined" ? window.pageYOffset : 0) || 0,
        (typeof window !== "undefined" ? window.scrollY : 0) || 0,
        (typeof document !== "undefined" ? document.documentElement?.scrollTop : 0) || 0,
        (typeof document !== "undefined" ? document.body?.scrollTop : 0) || 0,
        page1?.scrollTop || 0
      );

      // Sembunyi saat di bagian paling atas (hero), dan muncul saat scroll masuk ke fitur (> 100px)
      const threshold = 100;
      setIsVisible(currentScroll > threshold);
    };

    checkScroll();

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", checkScroll, { passive: true, capture: true });
      window.addEventListener("resize", checkScroll, { passive: true });
    }
    if (typeof document !== "undefined") {
      document.addEventListener("scroll", checkScroll, { passive: true, capture: true });
      const pageContainer = document.getElementById("page-1-container");
      if (pageContainer) {
        pageContainer.addEventListener("scroll", checkScroll, { passive: true });
      }
    }

    const timer = setInterval(checkScroll, 200);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", checkScroll, true);
        window.removeEventListener("resize", checkScroll);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("scroll", checkScroll, true);
        const pageContainer = document.getElementById("page-1-container");
        if (pageContainer) {
          pageContainer.removeEventListener("scroll", checkScroll);
        }
      }
      clearInterval(timer);
    };
  }, [alwaysVisible]);

  return (
    <div
      className={`fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-[70] max-w-[calc(100vw-20px)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      } ${className}`}
    >
      {/* ─── Unified Bubble Panel (Pure obsidian black, padding kanan mobile diperluas pr-8 agar pas dan simetris) ─── */}
      <div className="group relative inline-flex items-center gap-1 sm:gap-1.5 pl-4 pr-8 sm:pl-4.5 sm:pr-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[46px] rounded-full bg-black/92 border border-white/15 hover:border-white/30 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_45px_rgba(0,0,0,0.9)] transition-all duration-200">
        {/* Subtle Ambient Hover Glow */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        {/* ─── Instagram Link: Product by | Avatar | Username | Followers | IG Icon ─── */}
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Kunjungi Instagram @${username} (${followers} followers)`}
          title={`Instagram @${username}`}
          className="relative z-10 inline-flex items-center gap-2 sm:gap-2.5 no-underline cursor-pointer group/ig shrink-0"
        >
          {/* Label: Product by */}
          <span className="text-zinc-400 group-hover/ig:text-zinc-300 text-xs sm:text-[13px] font-medium tracking-normal transition-colors shrink-0">
            Product by
          </span>

          {/* Pemisah halus vertikal */}
          <span className="w-px h-4 bg-white/20 shrink-0" aria-hidden="true" />

          {/* Circular Profile Avatar */}
          <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full overflow-hidden ring-1 ring-white/25 shrink-0 bg-zinc-800">
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
          <span className="font-bold text-white text-xs sm:text-[13px] tracking-tight transition-colors shrink-0 group-hover/ig:text-zinc-200">
            {username}
          </span>

          {/* Followers Count */}
          <span className="font-medium text-zinc-400 group-hover/ig:text-zinc-300 text-xs sm:text-[13px] tracking-tight transition-colors shrink-0">
            {followers}
          </span>

          {/* Official Instagram Icon */}
          <div className="shrink-0 flex items-center justify-center">
            <svg
              className="w-4.5 h-4.5 sm:w-5 sm:h-5 group-hover/ig:scale-115 transition-transform duration-200"
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

        {/* ─── Behance Link: Benar-benar rapat di samping icon IG, gap presisi tanpa tumpang tindih ─── */}
        <a
          href={behanceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Kunjungi Behance filiuspatrislahendra"
          title="Behance @filiuspatrislahendra"
          className="relative z-10 shrink-0 flex items-center justify-center no-underline cursor-pointer group/be ml-0"
        >
          <svg
            className="w-4.5 h-4.5 sm:w-5 sm:h-5 group-hover/be:scale-115 transition-transform duration-200"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="24" height="24" rx="6.5" fill="#0057ff" />
            <g transform="translate(3.5, 4.8) scale(0.65)" fill="#ffffff">
              <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-4.102 0-5.625-3.003-5.625-6 0-3.64 2.197-6 5.625-6 4.092 0 5.402 3.018 5.176 6.002h-7.8c.035 1.543.834 3.09 2.625 3.09 1.439 0 2.29-.691 2.658-1.503l2.442 1.411zm-5.101-7.051c-1.391 0-2.18.918-2.316 2.051h4.632c-.086-1.134-.925-2.051-2.316-2.051zm-13.625-7.949h7.458c2.441 0 4.167 1.258 4.167 3.498 0 1.488-.813 2.59-1.996 3.084 1.53.517 2.371 1.777 2.371 3.52 0 2.457-1.895 3.898-4.542 3.898h-7.458v-14zm3 2v3.5h4.167c1.1 0 1.833-.6 1.833-1.75 0-1.15-.733-1.75-1.833-1.75h-4.167zm0 5.5v4.5h4.458c1.2 0 1.958-.65 1.958-1.9 0-1.25-.758-1.9-1.958-1.9h-4.458z" />
            </g>
          </svg>
        </a>
      </div>
    </div>
  );
}

export default CreatorBadge;
