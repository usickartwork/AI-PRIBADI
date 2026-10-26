'use client';

import { User } from '@/types/database';
import { useFaithNav } from '@/lib/faith/navigationContext';

interface HeaderProps {
  user: User;
  onOpenHistory?: () => void;
  onNewChat?: () => void;
}

export default function Header({ user }: HeaderProps) {
  const { setActiveTab, isDark } = useFaithNav();

  return (
    <header
      className={`flex-none px-3.5 sm:px-6 py-3 z-30 border-b border-black/5 dark:border-white/10 bg-transparent backdrop-blur-xs transition-colors duration-200 ${
        isDark ? 'text-white' : 'text-[#111113]'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('tanya')}
            className="flex flex-col group text-left cursor-pointer"
          >
            <span
              className={`text-sm font-bold tracking-tight transition-opacity group-hover:opacity-80 ${
                isDark ? 'text-white' : 'text-[#111113]'
              }`}
            >
              Faith Hub
            </span>
            <span className="text-[10px] text-[#8E8E93] dark:text-[#A1A1AA] font-medium leading-none">
              Ruang Hening Pribadi
            </span>
          </button>
        </div>

        {/* Right side is kept clean without extra buttons */}
        <div className="flex items-center gap-1.5" />
      </div>
    </header>
  );
}
