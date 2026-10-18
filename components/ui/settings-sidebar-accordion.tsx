"use client";

import { CreditCardIcon, MonitorSmartphone, PaletteIcon, ShieldIcon, SparklesIcon, UserIcon } from "lucide-react";

export interface SettingsNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

export const defaultNavItems: SettingsNavItem[] = [
  {
    icon: UserIcon,
    label: "Account",
    value: "account",
  },
  {
    icon: MonitorSmartphone,
    label: "Devices",
    value: "devices",
  },
  {
    icon: PaletteIcon,
    label: "Appearance",
    value: "appearance",
  },
  {
    icon: CreditCardIcon,
    label: "Billing & Usage",
    value: "billing",
  },
  {
    icon: SparklesIcon,
    label: "Pricing",
    value: "pricing",
  },
  {
    icon: ShieldIcon,
    label: "Security",
    value: "security",
  },
];

interface PatternProps {
  items?: SettingsNavItem[];
  activeValue?: string;
  onSelectSection?: (value: string) => void;
  className?: string;
}

export function Pattern({
  items = defaultNavItems,
  activeValue = "account",
  onSelectSection,
  className = "mx-auto w-full",
}: PatternProps) {
  return (
    <div className={className}>
      <p className="mb-3 font-semibold text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-widest px-2.5">
        Settings
      </p>
      <nav className="flex flex-col gap-1">
        {items.map(({ icon: Icon, label, value }) => {
          const isActive = activeValue === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelectSection?.(value)}
              className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition cursor-pointer text-left ${
                isActive
                  ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/60"
              }`}
            >
              <Icon
                className={`size-4.5 shrink-0 transition-colors ${
                  isActive
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Pattern;
