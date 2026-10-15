'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { MessageSquare, BookOpen, Gamepad2, User } from 'lucide-react';
import { useFaithNav, FaithTabType } from '@/lib/faith/navigationContext';

interface PillStyle {
  left: number;
  width: number;
  height: number;
  opacity: number;
}

// Global cache persists across client-side navigations in the same browser session
let globalPillStyle: PillStyle | null = null;

export interface NavItemConfig {
  id: FaithTabType;
  label: string;
  fullLabel: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'tanya', label: 'Tanya', fullLabel: 'Tanya Rohani', icon: MessageSquare },
  { id: 'bible', label: 'Alkitab', fullLabel: 'Alkitab', icon: BookOpen },
  { id: 'games', label: 'Games', fullLabel: 'Faith Arcade', icon: Gamepad2 },
  { id: 'profile', label: 'Profil', fullLabel: 'Profil CG', icon: User },
];

function getTabIndex(tabId: string): number {
  const idx = NAV_ITEMS.findIndex((item) => item.id === tabId);
  return idx >= 0 ? idx : 0;
}

interface NavigationProps {
  activeTab?: FaithTabType;
  onTabChange?: (tab: FaithTabType) => void;
  isDark?: boolean;
}

export default function Navigation({ activeTab: propActiveTab, onTabChange, isDark: propIsDark }: NavigationProps) {
  const faithNav = useFaithNav();
  const activeTab = propActiveTab ?? faithNav.activeTab;
  const isDark = propIsDark ?? faithNav.isDark ?? false;

  const currentIdx = getTabIndex(activeTab);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [pillStyle, setPillStyle] = useState<PillStyle>(() => {
    if (globalPillStyle) return globalPillStyle;
    return { left: 0, width: 0, height: 0, opacity: 0 };
  });

  const [hasRendered, setHasRendered] = useState(() => globalPillStyle !== null);

  const updatePill = useCallback(() => {
    const activeIndex = currentIdx >= 0 ? currentIdx : 0;
    if (tabRefs.current[activeIndex] && containerRef.current) {
      const tabEl = tabRefs.current[activeIndex]!;
      const containerEl = containerRef.current;
      const tabRect = tabEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      if (tabRect.width > 0) {
        const nextStyle: PillStyle = {
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
          height: tabRect.height,
          opacity: 1,
        };
        globalPillStyle = nextStyle;
        setPillStyle(nextStyle);
      }
    }
  }, [currentIdx]);

  useLayoutEffect(() => {
    updatePill();
    if (!hasRendered) {
      const frame = requestAnimationFrame(() => setHasRendered(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [updatePill, hasRendered]);

  useEffect(() => {
    const t1 = setTimeout(updatePill, 40);
    const t2 = setTimeout(updatePill, 120);
    const t3 = setTimeout(updatePill, 320);
    window.addEventListener('resize', updatePill);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updatePill);
    };
  }, [updatePill]);

  const handleTabClick = (itemId: FaithTabType, targetIdx: number) => {
    const fromIdx = currentIdx;
    const toIdx = targetIdx;

    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      const dir = toIdx > fromIdx ? 'right' : 'left';
      try {
        sessionStorage.setItem('faith_hub_slide_dir', dir);
      } catch {}
    }

    if (onTabChange) {
      onTabChange(itemId);
    } else {
      faithNav.setActiveTab(itemId);
    }

    // Optimistically update pill position on click for immediate morph slide
    if (tabRefs.current[targetIdx] && containerRef.current) {
      const tabEl = tabRefs.current[targetIdx]!;
      const containerEl = containerRef.current;
      const tabRect = tabEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      if (tabRect.width > 0) {
        const nextStyle: PillStyle = {
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
          height: tabRect.height,
          opacity: 1,
        };
        globalPillStyle = nextStyle;
        setPillStyle(nextStyle);
      }
    }
  };

  return (
    <nav
      className={`flex-none border-t px-3 pt-3 pb-[max(1.75rem,calc(env(safe-area-inset-bottom)+12px))] z-40 select-none transition-colors duration-200 ${
        isDark
          ? 'bg-[#121215] border-[#222226]'
          : 'bg-white border-[#EAEAEB]'
      }`}
    >
      <div
        ref={containerRef}
        className="relative flex items-center justify-around max-w-sm mx-auto"
      >
        {/* Sliding Morph Pill Indicator */}
        <div
          className={`absolute rounded-full shadow-xs pointer-events-none ${
            isDark ? 'bg-white' : 'bg-[#111113]'
          } ${
            hasRendered ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]' : ''
          }`}
          style={{
            transform: `translate3d(${pillStyle.left}px, -50%, 0)`,
            width: `${pillStyle.width}px`,
            height: `${pillStyle.height}px`,
            opacity: pillStyle.opacity,
            left: 0,
            top: '50%',
          }}
        />

        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentIdx === idx;

          return (
            <button
              key={item.id}
              type="button"
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              onClick={() => handleTabClick(item.id, idx)}
              className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-transparent text-black px-4 py-2'
                    : 'bg-transparent text-white px-4 py-2'
                  : isDark
                  ? 'text-[#8E8E93] hover:text-white p-2 hover:bg-white/5'
                  : 'text-[#66666E] hover:text-[#111113] p-2 hover:bg-[#F2F2F4]/40'
              }`}
              title={item.fullLabel}
              aria-label={item.fullLabel}
            >
              <Icon
                size={isActive ? 19 : 22}
                strokeWidth={isActive ? 2.2 : 1.9}
                className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
                  isActive
                    ? isDark
                      ? 'text-black scale-105'
                      : 'text-white scale-105'
                    : isDark
                    ? 'text-[#8E8E93] hover:text-white scale-100'
                    : 'text-[#55555A] hover:text-[#111113] scale-100'
                }`}
              />
              <span
                className={`text-[12.5px] font-semibold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive
                    ? 'max-w-[85px] opacity-100 ml-1.5'
                    : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
