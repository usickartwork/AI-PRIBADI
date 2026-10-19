"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface OneMindLogoProps {
  className?: string;
  iconSize?: number;
  textClassName?: string;
  showText?: boolean;
}

export function OneMindGlyph({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      {/* Outer dashed orbit ring */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="4.2 3.2"
        className="opacity-90"
      />
      {/* Middle dashed orbit ring */}
      <circle
        cx="16"
        cy="16"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3.2 2.6"
        className="opacity-75"
      />
      {/* Center solid core dot */}
      <circle cx="16" cy="16" r="3" fill="currentColor" className="opacity-95" />
    </svg>
  );
}

export function OneMindLogo({
  className = "",
  iconSize = 24,
  textClassName = "text-lg font-bold tracking-tight text-white",
  showText = true,
}: OneMindLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className="text-white flex items-center justify-center">
        <OneMindGlyph size={iconSize} />
      </div>
      {showText && <span className={textClassName}>One Mind</span>}
    </div>
  );
}

export default OneMindLogo;
