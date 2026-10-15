'use client';

import { User } from '@/types/database';
import { SquarePen, Menu, Plus } from 'lucide-react';
import { useFaithNav } from '@/lib/faith/navigationContext';

interface HeaderProps {
  user: User;
  onOpenHistory?: () => void;
  onNewChat?: () => void;
}

export default function Header({ user, onOpenHistory, onNewChat }: HeaderProps) {
  const { setActiveTab, onTogglePanel, isDark } = useFaithNav();

  const handleMenuClick = () => {
    if (onOpenHistory) {
      onOpenHistory();
    } else if (onTogglePanel) {
      onTogglePanel();
    }
  };

  return (
    <header
      className={`flex-none px-3.5 sm:px-4 py-3 z-30 border-b transition-colors duration-200 ${
        isDark
          ? 'bg-[#121214]/95 backdrop-blur-md border-white/10 text-white'
          : 'bg-white/95 backdrop-blur-md border-[#EAEAEB] text-[#111113]'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left: 3-Lines (Garis 3) Menu Button + Brand */}
        <div className="flex items-center gap-2.5">
          {(onOpenHistory || onTogglePanel) && (
            <button
              type="button"
              onClick={handleMenuClick}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-zinc-800/80 hover:bg-zinc-700 border-white/10 text-zinc-100'
                  : 'bg-[#F2F2F3] hover:bg-[#EAEAEB] border-[#DCDCE0] text-[#111113]'
              }`}
              title="Menu / Riwayat"
              aria-label="Menu atau Riwayat"
            >
              <Menu size={18} strokeWidth={2.2} />
            </button>
          )}

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
            <span
              className={`text-[10px] font-medium leading-none ${
                isDark ? 'text-zinc-400' : 'text-[#8E8E93]'
              }`}
            >
              Ruang Hening Pribadi
            </span>
          </button>
        </div>

        {/* Right: New Chat (+) and Catatan / Notes Button */}
        <div className="flex items-center gap-1.5">
          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition cursor-pointer shadow-2xs active:scale-95 ${
                isDark
                  ? 'bg-zinc-800/80 hover:bg-zinc-700 border-white/10 text-zinc-100'
                  : 'bg-[#F2F2F3] hover:bg-[#EAEAEB] border-[#DCDCE0] text-[#111113]'
              }`}
              title="Percakapan Baru"
              aria-label="Mulai percakapan baru"
            >
              <Plus size={15} strokeWidth={2.2} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-white hover:bg-zinc-200 text-black'
                : 'bg-[#111113] hover:bg-black text-white'
            }`}
          >
            <SquarePen size={13} />
            <span>Catatan</span>
          </button>
        </div>
      </div>
    </header>
  );
}
