import React from "react";
import type { ItemId } from "@/lib/game/survival/data";

interface IconProps {
  className?: string;
}

export function ItemIcon({ id, className = "w-6 h-6" }: { id: ItemId; className?: string }) {
  switch (id) {
    case "wood":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3-3.582-3-8-3-8 1.343-8 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3" />
        </svg>
      );
    case "stone":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <polygon strokeLinecap="round" strokeLinejoin="round" points="7,4 17,4 21,11 16,20 6,18 3,11" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 4l4 7-5 7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 11h10" />
        </svg>
      );
    case "fiber":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c4-8 8-12 16-16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 14c3-4 6-6 12-8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20c3-4 6-6 10-8" />
        </svg>
      );
    case "leaves":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.2A7 7 0 0 1 11 20z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 21c0-3 1.85-5.36 5.08-6" />
        </svg>
      );
    case "berries":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <circle cx="8" cy="14" r="4" />
          <circle cx="16" cy="14" r="4" />
          <circle cx="12" cy="8" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v-2c2 0 4 1 5 3" />
        </svg>
      );
    case "raw_meat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 4c2.5 0 5 2.5 5 5 0 4-3 8-7 10-4.5 2-8-2-8-5 0-3 2.5-5 5-5" />
          <circle cx="10" cy="10" r="2" />
        </svg>
      );
    case "cooked_meat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 4c2.5 0 5 2.5 5 5 0 4-3 8-7 10-4.5 2-8-2-8-5 0-3 2.5-5 5-5" />
          <circle cx="10" cy="10" r="2" fill="currentColor" fillOpacity={0.2} />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 21l3-3M16 3l3 3" />
        </svg>
      );
    case "axe":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 6l4-4 4 4-4 4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 6c0 3-2 5-5 5s-5-2-5-5c0-1 1-2 2-2h4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l10-10" />
        </svg>
      );
    case "spear":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 3l-6 2-2 4 4 4 4-2 2-6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 11L3 21" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-4 4" />
        </svg>
      );
    case "campfire":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c1 3-2 5-1 8 1 2 4 2 4-1 2 2 3 5 1 8-2 3-8 3-10 0-2-3 0-7 2-9 1 1 2 1 2-1 0-3 1-4 2-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 21l16-4M20 21L4 17" />
        </svg>
      );
    case "shelter":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l9-18 9 18H3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21l5-10 5 10" />
        </svg>
      );
    case "floor":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <polygon strokeLinecap="round" strokeLinejoin="round" points="12,2 22,8.5 12,15 2,8.5" />
          <polygon strokeLinecap="round" strokeLinejoin="round" points="12,9 22,15.5 12,22 2,15.5" />
        </svg>
      );
    case "wall":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="8" y1="4" x2="8" y2="9" />
          <line x1="16" y1="4" x2="16" y2="9" />
          <line x1="12" y1="9" x2="12" y2="15" />
          <line x1="7" y1="15" x2="7" y2="20" />
          <line x1="17" y1="15" x2="17" y2="20" />
        </svg>
      );
    case "door":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M5 21V4a1 1 0 011-1h12a1 1 0 011 1v17" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12v.01" />
        </svg>
      );
    case "roof":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l9-9 9 9M5 11v8a1 1 0 001 1h12a1 1 0 001-1v-8" />
        </svg>
      );
    case "workbench":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
          <rect x="2" y="5" width="20" height="5" rx="1" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="5" y1="10" x2="5" y2="20" />
          <line x1="19" y1="10" x2="19" y2="20" />
          <line x1="5" y1="16" x2="19" y2="16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5V3m8 2V3" />
        </svg>
      );
  }
}

