import { ProjectItem } from "../CodeWorkspace";
import { DesignTokens, DEFAULT_DESIGN_TOKENS } from "./types";

/**
 * Generates a complete, modular Next.js App Router application structure
 * based on the approved PRD, design tokens, and project specifications.
 */
export function generateProjectFiles(
  project: ProjectItem,
  tokens: DesignTokens = DEFAULT_DESIGN_TOKENS
): Record<string, string> {
  const title = project.title || "Nexus App";
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const overview = project.prd?.overview || project.description || "Aplikasi web modern.";
  const features = project.features || [];
  const pType = project.prd?.primaryType || "WEB_APPLICATION";

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
        "clsx": "^2.1.1",
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
        primary: "${tokens.colors.primary}",
        secondary: "${tokens.colors.secondary}",
        surface: "${tokens.colors.surface}",
        border: "${tokens.colors.border}",
        accent: "${tokens.colors.accent}",
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
  --background: ${tokens.colors.background};
  --surface: ${tokens.colors.surface};
  --border: ${tokens.colors.border};
  --primary: ${tokens.colors.primary};
  --text: ${tokens.colors.text};
  --accent: ${tokens.colors.accent};
}

body {
  color: var(--text);
  background: var(--background);
  font-family: ${tokens.typography.fontFamily};
}
`;

  // 5. lib/types.ts
  files["lib/types.ts"] = `export interface EntityItem {
  id: string;
  title: string;
  category: string;
  status: "ACTIVE" | "PENDING" | "COMPLETED";
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
`;

  // 6. tokens.json
  files["tokens.json"] = JSON.stringify(tokens, null, 2);

  // 7. app/layout.tsx
  files["app/layout.tsx"] = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${title}",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
`;

  // 8. app/components/Navbar.tsx
  files["app/components/Navbar.tsx"] = `"use client";

import React, { useState } from "react";

interface NavbarProps {
  onOpenAction?: () => void;
}

export function Navbar({ onOpenAction }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b border-white/10 bg-[#0c0d12]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white text-black font-black flex items-center justify-center text-sm">
            ${title.charAt(0).toUpperCase()}
          </div>
          <span className="font-extrabold tracking-tight text-white">${title}</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-300">
          <a href="#fitur" className="hover:text-white transition">Fitur Utama</a>
          <a href="#eksplorasi" className="hover:text-white transition">Modul</a>
          <a href="#aksi" className="hover:text-white transition">Aktivitas</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAction}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
          >
            Mulai Interaksi
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-zinc-400 hover:text-white"
        >
          ☰
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden p-4 border-t border-white/10 bg-[#121218] space-y-3">
          <a href="#fitur" className="block text-xs text-zinc-300 py-1">Fitur Utama</a>
          <a href="#eksplorasi" className="block text-xs text-zinc-300 py-1">Modul</a>
          <button
            type="button"
            onClick={onOpenAction}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-white text-black"
          >
            Mulai Interaksi
          </button>
        </div>
      )}
    </header>
  );
}
`;

  // 9. app/components/ActionModal.tsx
  files["app/components/ActionModal.tsx"] = `"use client";

import React, { useState } from "react";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: string) => Promise<void>;
}

export function ActionModal({ isOpen, onClose, onSubmit }: ActionModalProps) {
  const [titleInput, setTitleInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Umum");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121216] p-6 text-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Entri Data Baru</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nama / Judul Entitas</label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Contoh: Booking Layanan / Transaksi..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Kategori</label>
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none"
            >
              <option value="Umum">Umum</option>
              <option value="Prioritas">Prioritas</option>
              <option value="Layanan">Layanan</option>
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
              {isSubmitting ? "Menyimpan..." : "Simpan Entri"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

  // 10. app/api/entries/route.ts
  files["app/api/entries/route.ts"] = `import { NextRequest, NextResponse } from "next/server";
import { EntityItem, ApiResponse } from "@/lib/types";

// In-memory demo store for safe preview
const entries: EntityItem[] = [
  { id: "1", title: "Inisialisasi Sistem ${title}", category: "Umum", status: "COMPLETED", createdAt: new Date().toISOString() },
  { id: "2", title: "Verifikasi Modul Fungsional", category: "Prioritas", status: "ACTIVE", createdAt: new Date().toISOString() },
];

export async function GET(): Promise<NextResponse<ApiResponse<EntityItem[]>>> {
  return NextResponse.json({ success: true, data: entries });
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<EntityItem>>> {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: "Judul entri wajib diisi" }, { status: 400 });
    }
    const newEntry: EntityItem = {
      id: "ent-" + Date.now(),
      title: String(body.title),
      category: body.category || "Umum",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    entries.unshift(newEntry);
    return NextResponse.json({ success: true, data: newEntry });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
`;

  // 11. app/page.tsx (Main App View)
  files["app/page.tsx"] = `"use client";

import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { ActionModal } from "./components/ActionModal";
import { EntityItem } from "@/lib/types";

export default function Home() {
  const [items, setItems] = useState<EntityItem[]>([
    { id: "1", title: "Akses Layanan Inti ${title}", category: "Layanan", status: "ACTIVE", createdAt: "Baru saja" },
    { id: "2", title: "Integrasi Fitur Interaktif", category: "Prioritas", status: "COMPLETED", createdAt: "1 jam lalu" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const handleAddItem = async (title: string, category: string) => {
    const newItem: EntityItem = {
      id: "item-" + Date.now(),
      title,
      category,
      status: "ACTIVE",
      createdAt: "Baru saja",
    };
    setItems([newItem, ...items]);
  };

  const filteredItems = items.filter((it) => filter === "ALL" || it.category === filter);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-white">
      <Navbar onOpenAction={() => setIsModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center py-12 sm:py-20 space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-white/10 bg-white/5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>${pType.replace(/_/g, " ")}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            ${title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            ${overview.replace(/"/g, '\\"')}
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-2xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition shadow-lg cursor-pointer"
            >
              + Buat Entri Baru
            </button>
            <a
              href="#modul"
              className="px-6 py-3 rounded-2xl text-xs font-bold border border-white/20 text-white hover:bg-white/5 transition"
            >
              Lihat Modul
            </a>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="fitur" className="grid grid-cols-1 md:grid-cols-3 gap-5">
          ${features.slice(0, 3).map((f, i) => `
          <div key="${i}" className="p-6 rounded-3xl border border-white/10 bg-[#121216] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-xs font-bold text-white">
              0${i + 1}
            </div>
            <h3 className="text-base font-bold">${f.name.replace(/"/g, '\\"')}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">${(f.description || "Fungsionalitas unggulan produk.").replace(/"/g, '\\"')}</p>
          </div>
          `).join("\n          ")}
        </section>

        {/* Interactive Data List / Live Activity */}
        <section id="modul" className="p-6 rounded-3xl border border-white/10 bg-[#121216] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Aktivitas &amp; Data Entitas</h2>
              <p className="text-xs text-zinc-400">Data live simulasi operasional sistem Anda.</p>
            </div>

            <div className="flex items-center gap-2">
              {["ALL", "Layanan", "Prioritas", "Umum"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={\`px-3 py-1 rounded-xl text-xs font-semibold transition \${
                    filter === cat ? "bg-white text-black font-bold" : "bg-white/5 text-zinc-400 hover:text-white"
                  }\`}
                >
                  {cat === "ALL" ? "Semua" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredItems.map((it) => (
              <div key={it.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-white">{it.title}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{it.category} • {it.createdAt}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-white/15 bg-white/5 text-zinc-300">
                  {it.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 p-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} ${title}. Semua Hak Dilindungi.
      </footer>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddItem}
      />
    </div>
  );
}
`;

  return files;
}
