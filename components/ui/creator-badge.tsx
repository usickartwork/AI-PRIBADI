"use client";

import React, { useState } from "react";

export interface CreatorBadgeProps {
  username?: string;
  followers?: string;
  instagramUrl?: string;
  avatarUrl?: string;
  className?: string;
}

/**
 * CreatorBadge: Floating creator attribution pill
 * Displays "Product by [ Avatar | filius_pl | Followers | Instagram Logo ]"
 * Anchored persistently across scroll on the guest landing page.
 */
export function CreatorBadge({
  username = "filius_pl",
  followers = "2.4K",
  instagramUrl = "https://www.instagram.com/filius_pl/",
  avatarUrl = "/filius-avatar.png",
  className = "",
}: CreatorBadgeProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`inline-flex items-center gap-2 sm:gap-2.5 select-none animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ${className}`}
    >
      {/* Label: Product by */}
      <span className="text-zinc-400 text-xs sm:text-sm font-medium tracking-normal drop-shadow-xs">
        Product by
      </span>

      {/* Clickable Pill Badge */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Kunjungi Instagram @${username} (${followers} followers)`}
        title={`Instagram @${username}`}
        className="group relative inline-flex items-center gap-2 sm:gap-2.5 pl-1.5 pr-2.5 sm:pl-1.5 sm:pr-3 py-1 sm:py-1 rounded-full bg-[#0a0d14]/85 border border-white/15 hover:border-white/35 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer no-underline"
      >
        {/* Subtle Ambient Hover Glow */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(220, 39, 67, 0.18) 0%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        {/* Circular Profile Avatar */}
        <div className="relative w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full overflow-hidden ring-1 ring-white/25 shrink-0 bg-zinc-800">
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
        <span className="relative z-10 font-bold text-white text-xs sm:text-sm tracking-tight transition-colors">
          {username}
        </span>

        {/* Followers Count */}
        <span className="relative z-10 font-medium text-zinc-400 group-hover:text-zinc-300 text-xs sm:text-sm tracking-tight transition-colors">
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
