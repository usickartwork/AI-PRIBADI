"use client";

import { BellIcon, CreditCardIcon, ShieldIcon, UserIcon, PaletteIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface SettingsSection {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  links: string[];
  value: string;
}

const defaultSections: SettingsSection[] = [
  {
    icon: UserIcon,
    label: "Account",
    links: ["Profile", "Display Name", "Email Address", "Language & Region"],
    value: "account",
  },
  {
    icon: PaletteIcon,
    label: "Appearance",
    links: ["Theme (Dark / Light)"],
    value: "appearance",
  },
  {
    icon: CreditCardIcon,
    label: "Billing & Usage",
    links: [
      "Subscription Plan",
      "AI Credits",
      "Code Credits",
      "Schedules Limit",
      "Usage History",
    ],
    value: "billing",
  },
  {
    icon: ShieldIcon,
    label: "Security",
    links: ["Sesi Login", "Keluar dari Akun", "Hapus Akun"],
    value: "security",
  },
];

interface PatternProps {
  sections?: SettingsSection[];
  activeValue?: string;
  activeLink?: string;
  onSelectSection?: (value: string) => void;
  onSelectLink?: (sectionValue: string, link: string) => void;
  className?: string;
}

export function Pattern({
  sections = defaultSections,
  activeValue,
  activeLink,
  onSelectSection,
  onSelectLink,
  className = "mx-auto w-full max-w-xs",
}: PatternProps) {
  return (
    <div className={className}>
      <p className="mb-3 font-semibold text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-widest px-2">
        Settings
      </p>
      <Accordion defaultValue={["account", "appearance", "billing", "security"]} multiple>
        {sections.map(({ icon: Icon, label, value, links }) => {
          const isSectionActive = activeValue === value;
          return (
            <AccordionItem className="border-none" key={value} value={value}>
              <AccordionTrigger
                onClick={() => onSelectSection?.(value)}
                className={`rounded-xl px-2.5 py-2 transition hover:no-underline ${
                  isSectionActive
                    ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <span className="font-medium text-sm">{label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                <ul className="ml-4 flex flex-col gap-0.5 border-l border-zinc-200 dark:border-zinc-800 pl-3">
                  {links.map((link) => {
                    const isLinkActive = activeLink === link;
                    return (
                      <li key={link}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectLink?.(value, link);
                            onSelectSection?.(value);
                          }}
                          className={`block w-full text-left rounded-lg px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                            isLinkActive
                              ? "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold"
                              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
                          }`}
                        >
                          {link}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export default Pattern;
