import type { ProjectItem } from "../CodeWorkspace";
import { DesignTokens, DEFAULT_DESIGN_TOKENS } from "./types";
import { synthesizeDesignPlan } from "./designEngine";

/**
 * Generates a complete, modular Next.js App Router application structure
 * based on the Art Direction Design Plan, approved PRD, and design tokens.
 * Produces domain-tailored pages, components, and mock APIs (SaaS, Dashboard, Booking, etc.)
 */
export function generateProjectFiles(
  project: ProjectItem,
  tokens: DesignTokens = DEFAULT_DESIGN_TOKENS
): Record<string, string> {
  const plan = synthesizeDesignPlan(project);
  const title = project.title || "Nexus App";
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const overview = project.prd?.overview || project.description || "Aplikasi web modern berstandar industri.";
  const domain = plan.domain;
  const heroImg = plan.curatedImages[0]?.url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80";

  const files: Record<string, string> = {};

  // 1. package.json
  files["package.json"] = JSON.stringify(
    {
      name: slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "15.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "lucide-react": "^0.460.0",
        clsx: "^2.1.1",
        "tailwind-merge": "^2.5.4",
      },
      devDependencies: {
        typescript: "^5.6.3",
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        tailwindcss: "^3.4.1",
        postcss: "^8.4.47",
        autoprefixer: "^10.4.20",
        eslint: "^9.0.0",
        "eslint-config-next": "15.0.0",
      },
    },
    null,
    2
  );

  // 2. tsconfig.json
  files["tsconfig.json"] = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: {
          "@/*": ["./*"],
        },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  );

  // 3. tailwind.config.ts
  files["tailwind.config.ts"] = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "${plan.colorPalette.background}",
        surface: "${plan.colorPalette.surface}",
        surfaceElevated: "${plan.colorPalette.surfaceElevated}",
        border: "${plan.colorPalette.border}",
        primary: "${plan.colorPalette.primary}",
        accent: "${plan.colorPalette.accent}",
      },
      borderRadius: {
        DEFAULT: "${tokens.radius.md}",
        lg: "${tokens.radius.lg}",
      },
    },
  },
  plugins: [],
};
export default config;
`;

  // 4. app/globals.css
  files["app/globals.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: ${plan.colorPalette.background};
  --surface: ${plan.colorPalette.surface};
  --surface-elevated: ${plan.colorPalette.surfaceElevated};
  --border: ${plan.colorPalette.border};
  --primary: ${plan.colorPalette.primary};
  --text: ${plan.colorPalette.text};
  --muted: ${plan.colorPalette.mutedText};
  --accent: ${plan.colorPalette.accent};
}

body {
  color: var(--text);
  background: var(--background);
  font-family: ${plan.typography.primaryFont};
}
`;

  // 5. lib/types.ts
  if (domain === "booking") {
    files["lib/types.ts"] = `export interface BookingService {
  id: string;
  name: string;
  category: "Grooming" | "Styling" | "Treatment" | "Premium";
  duration: string;
  price: number;
  popular?: boolean;
}

export interface BookingSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface BookingAppointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  timeSlot: string;
  status: "CONFIRMED" | "PENDING" | "COMPLETED";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
`;
  } else if (domain === "dashboard") {
    files["lib/types.ts"] = `export interface MetricCardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
}

export interface TransactionEntry {
  id: string;
  client: string;
  serviceOrType: string;
  amount: number;
  status: "SETTLED" | "PENDING" | "PROCESSING";
  timestamp: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
`;
  } else {
    files["lib/types.ts"] = `export interface ProductFeature {
  id: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
}

export interface LeadSubmission {
  id: string;
  fullName: string;
  email: string;
  teamSize: string;
  plan: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
`;
  }

  // 6. tokens.json
  files["tokens.json"] = JSON.stringify(tokens, null, 2);

  // 7. app/layout.tsx
  files["app/layout.tsx"] = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${title} | Official Platform",
  description: "${overview.replace(/"/g, '\\"')}",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="${plan.typography.fontImportUrl}" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--text)] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
`;

  // 8. app/components/Navbar.tsx
  if (domain === "booking") {
    files["app/components/Navbar.tsx"] = `"use client";

import React, { useState } from "react";

interface NavbarProps {
  onOpenBooking: () => void;
}

export function Navbar({ onOpenBooking }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[#0c0d10]/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white text-black font-black flex items-center justify-center text-sm shadow-md">
            ${title.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-white text-sm sm:text-base">${title}</span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Buka Hari Ini 09:00 - 21:00</span>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-300">
          <a href="#layanan" className="hover:text-white transition">Daftar Layanan</a>
          <a href="#tentang" className="hover:text-white transition">Master Barber</a>
          <a href="#testimoni" className="hover:text-white transition">Ulasan Klien</a>
          <a href="#lokasi" className="hover:text-white transition">Lokasi Studio</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenBooking}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition shadow-lg cursor-pointer"
          >
            Reservasi Jadwal
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-zinc-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden p-5 border-t border-white/10 bg-[#14151a] space-y-3">
          <a href="#layanan" className="block text-xs text-zinc-300 py-1" onClick={() => setMobileOpen(false)}>Daftar Layanan</a>
          <a href="#tentang" className="block text-xs text-zinc-300 py-1" onClick={() => setMobileOpen(false)}>Master Barber</a>
          <button
            type="button"
            onClick={() => { setMobileOpen(false); onOpenBooking(); }}
            className="w-full py-3 rounded-2xl text-xs font-bold bg-white text-black"
          >
            Reservasi Jadwal
          </button>
        </div>
      )}
    </header>
  );
}
`;
  } else if (domain === "dashboard") {
    files["app/components/Navbar.tsx"] = `"use client";

import React from "react";

interface NavbarProps {
  onNewEntry: () => void;
}

export function Navbar({ onNewEntry }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[#080a10]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500 text-black font-black flex items-center justify-center text-xs">
            ${title.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-sm">${title}</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Live Terminal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNewEntry}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
          >
            + Entri Transaksi Baru
          </button>
        </div>
      </div>
    </header>
  );
}
`;
  } else {
    // SaaS Standard Navbar
    files["app/components/Navbar.tsx"] = `"use client";

import React, { useState } from "react";

interface NavbarProps {
  onOpenAction: () => void;
}

export function Navbar({ onOpenAction }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[#090d16]/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white text-black font-extrabold flex items-center justify-center text-xs">
            ${title.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold tracking-tight text-white text-sm sm:text-base">${title}</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-300">
          <a href="#fitur" className="hover:text-white transition">Fitur Utama</a>
          <a href="#arsitektur" className="hover:text-white transition">Arsitektur</a>
          <a href="#pricing" className="hover:text-white transition">Paket Harga</a>
          <a href="#testimoni" className="hover:text-white transition">Klien</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAction}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
          >
            Coba Sekarang Gratis
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-zinc-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden p-4 border-t border-white/10 bg-[#111420] space-y-3">
          <a href="#fitur" className="block text-xs text-zinc-300 py-1" onClick={() => setOpen(false)}>Fitur Utama</a>
          <a href="#pricing" className="block text-xs text-zinc-300 py-1" onClick={() => setOpen(false)}>Paket Harga</a>
          <button
            type="button"
            onClick={() => { setOpen(false); onOpenAction(); }}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-white text-black"
          >
            Coba Sekarang Gratis
          </button>
        </div>
      )}
    </header>
  );
}
`;
  }

  // 9. app/components/ActionModal.tsx
  if (domain === "booking") {
    files["app/components/ActionModal.tsx"] = `"use client";

import React, { useState } from "react";
import { BookingAppointment } from "@/lib/types";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: { id: string; name: string; price: number };
  onConfirm: (appt: BookingAppointment) => Promise<void>;
}

export function ActionModal({ isOpen, onClose, selectedService, onConfirm }: ActionModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState("Hari Ini (24 Okt)");
  const [selectedSlot, setSelectedSlot] = useState("14:30");
  const [loading, setLoading] = useState(false);
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      const code = "BOOK-" + Math.floor(100000 + Math.random() * 900000);
      await onConfirm({
        id: code,
        customerName: name,
        customerPhone: phone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        date: selectedDate,
        timeSlot: selectedSlot,
        status: "CONFIRMED",
      });
      setConfirmedCode(code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#14151a] p-6 text-white space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold">Konfirmasi Reservasi Jadwal</h3>
            <p className="text-xs text-zinc-400">Layanan: <span className="text-white font-semibold">{selectedService.name}</span></p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        {confirmedCode ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">✓</div>
            <h4 className="text-lg font-bold text-white">Reservasi Berhasil Dibuat!</h4>
            <p className="text-xs text-zinc-400">Kode Booking Anda: <span className="font-mono text-emerald-400 font-bold">{confirmedCode}</span></p>
            <p className="text-xs text-zinc-500">Konfirmasi detail telah dikirim via WhatsApp ke {phone}.</p>
            <button
              type="button"
              onClick={() => { setConfirmedCode(null); onClose(); }}
              className="mt-4 px-6 py-2.5 rounded-2xl bg-white text-black font-bold text-xs"
            >
              Tutup & Kembali
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Total Biaya Layanan</span>
              <span className="text-base font-black text-white font-mono">Rp{selectedService.price.toLocaleString("id-ID")}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tanggal</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none"
                >
                  <option value="Hari Ini (24 Okt)">Hari Ini (24 Okt)</option>
                  <option value="Besok (25 Okt)">Besok (25 Okt)</option>
                  <option value="Lusa (26 Okt)">Lusa (26 Okt)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Pilihan Jam</label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none"
                >
                  <option value="10:00">10:00 WIB</option>
                  <option value="11:30">11:30 WIB</option>
                  <option value="13:00">13:00 WIB</option>
                  <option value="14:30">14:30 WIB</option>
                  <option value="16:00">16:00 WIB</option>
                  <option value="19:00">19:00 WIB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Raden Satria"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">No. WhatsApp</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none focus:border-white/30"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || !phone.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Menjadwalkan..." : "Konfirmasi Booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
`;
  } else {
    // SaaS Standard ActionModal
    files["app/components/ActionModal.tsx"] = `"use client";

import React, { useState } from "react";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: string) => Promise<void>;
}

export function ActionModal({ isOpen, onClose, onSubmit }: ActionModalProps) {
  const [titleInput, setTitleInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Pro");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(titleInput.trim(), categoryInput);
      setTitleInput("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111420] p-6 text-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Mulai Akses Evaluasi Cloud</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Email Profesional / Perusahaan</label>
            <input
              type="email"
              required
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="nama@perusahaan.com"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Tingkatan Arsitektur</label>
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none"
            >
              <option value="Starter">Starter (Small Team)</option>
              <option value="Pro">Pro (Growing Scale)</option>
              <option value="Enterprise">Enterprise (Full High-Availability)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !titleInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {isSubmitting ? "Memproses..." : "Aktifkan Sandbox"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;
  }

  // 10. app/api/entries/route.ts
  files["app/api/entries/route.ts"] = `import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "operational",
      version: "2.4.0",
      product: "${title}",
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: "Data entri berhasil diproses.",
      received: body,
      id: "rec-" + Date.now(),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }
}
`;

  // 11. app/page.tsx (Domain-Tailored Main View)
  if (domain === "booking") {
    files["app/page.tsx"] = `"use client";

import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { ActionModal } from "./components/ActionModal";
import { BookingService, BookingAppointment } from "@/lib/types";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedService, setSelectedService] = useState<BookingService>({
    id: "serv-1",
    name: "Master Signature Haircut & Beard Trim",
    category: "Premium",
    duration: "45 Menit",
    price: 125000,
    popular: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<BookingAppointment[]>([
    {
      id: "BOOK-849120",
      customerName: "Bima Arya",
      customerPhone: "0812-9921-3310",
      serviceId: "serv-1",
      serviceName: "Master Signature Haircut",
      price: 125000,
      date: "Hari Ini",
      timeSlot: "11:30",
      status: "CONFIRMED",
    },
  ]);

  const services: BookingService[] = [
    { id: "serv-1", name: "Master Signature Haircut & Beard Sculpting", category: "Premium", duration: "45 Menit", price: 125000, popular: true },
    { id: "serv-2", name: "Classic Gentlemen Haircut & Wash", category: "Styling", duration: "30 Menit", price: 85000 },
    { id: "serv-3", name: "Hot Towel Razor Beard Shave & Treatment", category: "Treatment", duration: "25 Menit", price: 65000 },
    { id: "serv-4", name: "Scalp Revitalizing Charcoal Scrub", category: "Treatment", duration: "30 Menit", price: 75000 },
    { id: "serv-5", name: "Royal Hair Color & Matte Finish", category: "Styling", duration: "60 Menit", price: 160000 },
  ];

  const filteredServices = services.filter((s) => activeCategory === "ALL" || s.category === activeCategory);

  const handleConfirmBooking = async (appt: BookingAppointment) => {
    setAppointments([appt, ...appointments]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d10] text-zinc-100 selection:bg-white/20 selection:text-white">
      <Navbar onOpenBooking={() => setIsModalOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-16 sm:space-y-24">
        {/* Lead Hero with Instant Reservation Callout */}
        <section className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#14151a] p-8 sm:p-14">
          <div className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('${heroImg}')" }} />
          <div className="relative z-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-white/15 bg-white/5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studio Grooming Berstandar Premium</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              ${title}
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              ${overview.replace(/"/g, '\\"')}
            </p>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-200 transition shadow-xl cursor-pointer"
              >
                Pilih Jadwal &amp; Reservasi
              </button>
              <a
                href="#layanan"
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition"
              >
                Lihat Tarif Layanan
              </a>
            </div>
          </div>
        </section>

        {/* Interactive Service Catalog with Live Price Selection */}
        <section id="layanan" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Menu &amp; Pilihan Layanan</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">Pilih layanan yang Anda inginkan untuk reservasi cepat tanpa antre.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["ALL", "Premium", "Styling", "Treatment"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={\`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer \${
                    activeCategory === cat
                      ? "bg-white text-black font-bold shadow-md"
                      : "bg-white/5 text-zinc-400 hover:text-white"
                  }\`}
                >
                  {cat === "ALL" ? "Semua Layanan" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((serv) => {
              const isSelected = selectedService.id === serv.id;
              return (
                <div
                  key={serv.id}
                  onClick={() => setSelectedService(serv)}
                  className={\`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 \${
                    isSelected
                      ? "border-white bg-[#1c1d24] shadow-lg shadow-white/5"
                      : "border-white/10 bg-[#14151a] hover:border-white/25"
                  }\`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-white">{serv.name}</span>
                        {serv.popular && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/20">
                            Paling Populer
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 mt-1 block">Durasi: {serv.duration}</span>
                    </div>
                    <span className="text-sm sm:text-base font-mono font-bold text-white">
                      Rp{serv.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                    <span className="text-zinc-500">{serv.category}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService(serv);
                        setIsModalOpen(true);
                      }}
                      className={\`px-3 py-1.5 rounded-xl text-xs font-semibold transition \${
                        isSelected ? "bg-white text-black" : "bg-white/10 text-zinc-200 hover:bg-white/20"
                      }\`}
                    >
                      {isSelected ? "Reservasi Layanan Ini" : "Pilih"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Floating Quick Summary Strip */}
        <section className="p-6 rounded-2xl border border-white/10 bg-[#14151a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white">
              ✓
            </div>
            <div>
              <div className="text-xs text-zinc-400">Layanan Dipilih:</div>
              <div className="text-sm font-bold text-white">{selectedService.name} (Rp{selectedService.price.toLocaleString("id-ID")})</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
          >
            Lanjut Konfirmasi Booking →
          </button>
        </section>

        {/* Live Booking Record Feed */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white">Status Reservasi Terbaru</h3>
          <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-[#14151a] p-4">
            {appointments.map((appt) => (
              <div key={appt.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-white">{appt.customerName} - {appt.serviceName}</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{appt.date} • {appt.timeSlot} WIB • {appt.id}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 p-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} ${title}. All rights reserved. Powered by Usick One AI Product Engine.
      </footer>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedService={selectedService}
        onConfirm={handleConfirmBooking}
      />
    </div>
  );
}
`;
  } else if (domain === "dashboard") {
    files["app/page.tsx"] = `"use client";

import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { ActionModal } from "./components/ActionModal";
import { MetricCardData, TransactionEntry } from "@/lib/types";

export default function Home() {
  const [filter, setFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [records, setRecords] = useState<TransactionEntry[]>([
    { id: "TX-9901", client: "Enterprise Alpha", serviceOrType: "Cluster Scale", amount: 14250000, status: "SETTLED", timestamp: "10 menit lalu" },
    { id: "TX-9902", client: "Nexus Fintech", serviceOrType: "API Pipeline", amount: 8900000, status: "SETTLED", timestamp: "32 menit lalu" },
    { id: "TX-9903", client: "SaaS Studio", serviceOrType: "Node Ingress", amount: 3500000, status: "PROCESSING", timestamp: "1 jam lalu" },
    { id: "TX-9904", client: "Venture Digital", serviceOrType: "Data Backup", amount: 2100000, status: "PENDING", timestamp: "2 jam lalu" },
  ]);

  const metrics: MetricCardData[] = [
    { title: "Total Volume Transaksi", value: "Rp28.750.000", change: "+18.4%", isPositive: true, timeframe: "vs bulan lalu" },
    { title: "Throughput Pipeline", value: "99.98%", change: "+0.2%", isPositive: true, timeframe: "uptime 30 hari" },
    { title: "Aktif Node Klaster", value: "34 / 36", change: "Stabil", isPositive: true, timeframe: "beban 42%" },
    { title: "Average Latency", value: "28ms", change: "-4ms", isPositive: true, timeframe: "optimal" },
  ];

  const handleAddRecord = async (title: string, category: string) => {
    const newTx: TransactionEntry = {
      id: "TX-" + Math.floor(1000 + Math.random() * 9000),
      client: title,
      serviceOrType: category,
      amount: 4500000,
      status: "SETTLED",
      timestamp: "Baru saja",
    };
    setRecords([newTx, ...records]);
  };

  const filteredRecords = records.filter((r) => filter === "ALL" || r.status === filter);

  return (
    <div className="min-h-screen flex flex-col bg-[#080a10] text-zinc-100">
      <Navbar onNewEntry={() => setIsModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* KPI Stat Cards Ribbon */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-white/10 bg-[#0e111a] space-y-2">
              <span className="text-xs text-zinc-400 font-medium">{m.title}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-white">{m.value}</span>
                <span className="text-xs font-mono font-semibold text-emerald-400">{m.change}</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono block">{m.timeframe}</span>
            </div>
          ))}
        </section>

        {/* Interactive Trend Chart Visualization */}
        <section className="p-6 rounded-2xl border border-white/10 bg-[#0e111a] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Aktivitas Real-Time Throughput</h2>
              <p className="text-xs text-zinc-400">Metrik pemrosesan volume data per jam.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span className="text-xs font-mono text-sky-400">Live Socket Active</span>
            </div>
          </div>

          {/* Clean SVG Trend Chart */}
          <div className="h-44 w-full pt-4">
            <svg className="w-full h-full" viewBox="0 0 600 120" fill="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,90 Q75,30 150,60 T300,40 T450,70 T600,20 L600,120 L0,120 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M0,90 Q75,30 150,60 T300,40 T450,70 T600,20"
                stroke="#38bdf8"
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          </div>
        </section>

        {/* Filterable Transactions Entity Table */}
        <section className="p-6 rounded-2xl border border-white/10 bg-[#0e111a] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Log Transaksi &amp; Pemrosesan Sistem</h3>
              <p className="text-xs text-zinc-400">Daftar entri status eksekusi mutakhir.</p>
            </div>

            <div className="flex items-center gap-2">
              {["ALL", "SETTLED", "PROCESSING", "PENDING"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilter(st)}
                  className={\`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer \${
                    filter === st ? "bg-white text-black font-bold" : "bg-white/5 text-zinc-400 hover:text-white"
                  }\`}
                >
                  {st === "ALL" ? "Semua Status" : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-2">ID Transaksi</th>
                  <th className="py-3 px-2">Klien / Entitas</th>
                  <th className="py-3 px-2">Tipe Layanan</th>
                  <th className="py-3 px-2 text-right">Nominal</th>
                  <th className="py-3 px-2 text-right">Status</th>
                  <th className="py-3 px-2 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-2 text-white font-bold">{r.id}</td>
                    <td className="py-3 px-2 text-zinc-300 font-sans">{r.client}</td>
                    <td className="py-3 px-2 text-zinc-400">{r.serviceOrType}</td>
                    <td className="py-3 px-2 text-right text-white">Rp{r.amount.toLocaleString("id-ID")}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={\`px-2 py-0.5 rounded-full text-[10px] border \${
                        r.status === "SETTLED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : r.status === "PROCESSING"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }\`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-zinc-500 text-[11px] font-sans">{r.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddRecord}
      />
    </div>
  );
}
`;
  } else {
    // SaaS Standard View (Product-led split hero + feature walkthrough + pricing calculator)
    files["app/page.tsx"] = `"use client";

import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { ActionModal } from "./components/ActionModal";

export default function Home() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features = [
    {
      title: "Real-time AI Synthesis",
      desc: "Menghasilkan arsitektur digital dan artefak kode berstandar produksi dalam hitungan detik.",
      icon: "⚡",
    },
    {
      title: "Autonomous Quality Gate",
      desc: "Memeriksa sintaks, kontras, dan interaktivitas secara otomatis untuk menjamin standar visual.",
      icon: "🛡️",
    },
    {
      title: "Next.js App Router Native",
      desc: "Menghasilkan arsitektur modular TypeScript dan Tailwind CSS yang siap di-deploy seketika.",
      icon: "🚀",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-zinc-100 selection:bg-white/20 selection:text-white">
      <Navbar onOpenAction={() => setIsModalOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-24">
        {/* Split Screen Hero with Interactive Live UI Mockup */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-white/10 bg-white/5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Generasi Produk AI Masa Depan</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              ${title}
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-lg">
              ${overview.replace(/"/g, '\\"')}
            </p>

            <div className="flex flex-wrap gap-4 items-center pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-200 transition shadow-xl cursor-pointer"
              >
                Mulai Eksplorasi Gratis
              </button>
              <a
                href="#fitur"
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition"
              >
                Pelajari Fitur →
              </a>
            </div>
          </div>

          {/* Interactive UI Mockup Card */}
          <div className="relative rounded-3xl border border-white/15 bg-[#111420] p-4 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-[11px] font-mono text-zinc-500 ml-2">app.${slug}.internal/preview</span>
            </div>
            <img
              src="${heroImg}"
              alt="Dashboard Preview Mockup"
              className="rounded-xl w-full object-cover aspect-video border border-white/5"
            />
          </div>
        </section>

        {/* Product-Led Feature Walkthrough (Asymmetric Layouts) */}
        <section id="fitur" className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Arsitektur Dirancang untuk Skala</h2>
            <p className="text-xs sm:text-sm text-zinc-400">Infrastruktur modular yang memastikan keandalan, keamanan, dan kecepatan render optimal.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-3xl border border-white/10 bg-[#111420] space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Transparent Pricing Matrix with Toggle */}
        <section id="pricing" className="p-8 sm:p-12 rounded-3xl border border-white/10 bg-[#111420] space-y-8">
          <div className="text-center max-w-md mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Pilihan Paket Transparan</h2>
            <p className="text-xs sm:text-sm text-zinc-400">Tanpa biaya tersembunyi. Dapatkan diskon 20% untuk langganan tahunan.</p>

            <div className="inline-flex items-center p-1 rounded-2xl bg-zinc-900 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={\`px-4 py-1.5 rounded-xl font-semibold transition \${
                  billingPeriod === "monthly" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }\`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className={\`px-4 py-1.5 rounded-xl font-semibold transition \${
                  billingPeriod === "yearly" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }\`}
              >
                Tahunan (Hemat 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-3xl border border-white/10 bg-[#171c2b] space-y-4">
              <span className="text-xs font-mono text-zinc-400">STARTER</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {billingPeriod === "yearly" ? "Rp199.000" : "Rp249.000"}
                <span className="text-xs text-zinc-400 font-sans font-normal"> / bulan</span>
              </div>
              <p className="text-xs text-zinc-400">Cocok untuk tim kecil yang baru merilis produk MVP.</p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 rounded-2xl text-xs font-bold border border-white/20 text-white hover:bg-white/10 transition"
              >
                Pilih Starter
              </button>
            </div>

            <div className="p-6 rounded-3xl border border-white bg-[#171c2b] shadow-2xl space-y-4 relative">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-white text-black text-[10px] font-mono font-bold">
                REKOMENDASI UTAMA
              </div>
              <span className="text-xs font-mono text-sky-400">PRO ARCHITECT</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {billingPeriod === "yearly" ? "Rp499.000" : "Rp599.000"}
                <span className="text-xs text-zinc-400 font-sans font-normal"> / bulan</span>
              </div>
              <p className="text-xs text-zinc-400">Untuk produk berskala besar dengan integrasi API penuh.</p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 rounded-2xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition"
              >
                Mulai Akses Pro
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 p-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} ${title}. All rights reserved.
      </footer>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async () => {}}
      />
    </div>
  );
}
`;
  }

  return files;
}
