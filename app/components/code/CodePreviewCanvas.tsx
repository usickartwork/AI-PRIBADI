"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { ProjectItem } from "@/app/components/CodeWorkspace";
import {
  generateDynamicStarterHtml,
  generateDynamicWebsiteHtmlWithAI,
  parseGeneratedHtml,
  USE_DYNAMIC_WEBSITE_GENERATOR,
} from "@/lib/codeGenerator";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

export interface DevicePreset {
  width: number;
  height: number;
  label: string;
}

export const DEVICE_PRESETS: Record<PreviewDevice, DevicePreset> = {
  desktop: { width: 1440, height: 900, label: "Desktop (1440 × 900)" },
  tablet: { width: 768, height: 1024, label: "Tablet (768 × 1024)" },
  mobile: { width: 390, height: 844, label: "Mobile (390 × 844)" },
};

export const ZOOM_PRESETS = [50, 75, 90, 100, 125, 150];

export type GenerationStep =
  | "idle"
  | "preparing_context"
  | "generating_website"
  | "validating_html"
  | "updating_preview";

export interface CodePreviewCanvasProps {
  project: ProjectItem;
  isDark: boolean;
  onUpdateHtml: (html: string) => void;
  onSwitchToChat?: () => void;
  userId?: string;
  autoStartGeneration?: boolean;
  onGenerationStarted?: () => void;
}

/**
 * Menghasilkan nama file ekspor HTML yang bersih dan aman untuk filesystem lokal
 */
export function generateExportFilename(title?: string): string {
  const base = (title || "website")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "website"}.html`;
}

/**
 * Sanitasi pesan error agar informatif bagi pengguna tanpa membocorkan token, API keys, atau stack trace internal
 */
export function sanitizeUserFacingErrorMessage(err: unknown): string {
  if (!err) return "Terjadi kendala yang tidak diketahui.";
  let msg = typeof err === "string" ? err : err instanceof Error ? err.message : String(err);

  // Redact token/key patterns
  msg = msg.replace(/(?:bearer\s+[a-zA-Z0-9_\-\.]+)/gi, "bearer [REDACTED]");
  msg = msg.replace(/(?:(?:sk-|key-|secret-|token=)[a-zA-Z0-9_\-\.]+)/gi, "[REDACTED_SECRET]");
  msg = msg.replace(/https?:\/\/[^\s"'<>]+/gi, (matchedUrl) => {
    try {
      const u = new URL(matchedUrl);
      return `${u.protocol}//${u.host}${u.pathname}`;
    } catch {
      return "[URL]";
    }
  });

  // Strip stack trace chunks
  if (msg.includes("\n")) {
    const firstLine = msg.split("\n")[0].trim();
    if (firstLine) msg = firstLine;
  }

  // Common friendly rewrites
  if (/fetch failed|network|failed to fetch/i.test(msg)) {
    return "Gagal terhubung ke layanan AI. Periksa koneksi internet Anda. Versi sebelumnya tetap aman.";
  }
  if (/timeout|timed out|aborted|ETIMEDOUT/i.test(msg)) {
    return "Waktu permintaan ke AI habis (timeout). Silakan coba lagi. Versi sebelumnya tetap aman.";
  }
  if (/quota|credit|insufficient/i.test(msg)) {
    return "Batas kuota atau kredit AI telah tercapai. Versi sebelumnya tetap aman.";
  }

  return msg;
}

/**
 * Menyuntikkan Content-Security-Policy ketat dan error catcher ke dalam HTML.
 * Keamanan:
 * - default-src 'none': memblokir akses resource default
 * - script-src 'unsafe-inline' https://cdn.tailwindcss.com: Tailwind CDN + script interaksi
 * - style-src 'unsafe-inline' https://fonts.googleapis.com: Google Fonts stylesheets
 * - font-src https://fonts.gstatic.com data:: font files
 * - img-src data: blob: https://images.unsplash.com https://*.unsplash.com: gambar Unsplash & SVG
 * - connect-src 'none': memblokir XHR/fetch eksternal dari iframe
 * - frame-src 'none', object-src 'none', base-uri 'none', form-action 'none'
 * - TANPA allow-same-origin: iframe terisolasi dari cookies, localStorage, dan parent DOM.
 */
export function buildStrictSandboxHtml(html: string): string {
  if (!html || !html.trim()) return "";

  const strictCsp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob: https://images.unsplash.com https://*.unsplash.com; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';">`;

  const errorCatcher = `
<script>
window.addEventListener('error', function(event) {
  try {
    window.parent.postMessage({ type: 'PREVIEW_CONSOLE_ERROR', message: event.message || 'Runtime notice inside preview sandbox' }, '*');
  } catch (err) {}
});
</script>
`;

  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>\n  ${strictCsp}\n  ${errorCatcher}`);
  } else if (html.includes("<html")) {
    return html.replace(/<html[^>]*>/, `$&<head>\n  ${strictCsp}\n  ${errorCatcher}</head>`);
  }
  return `${strictCsp}\n${errorCatcher}\n${html}`;
}

/**
 * Komponen Animasi Konstruksi Website Live (Header -> Hero -> Fitur -> Modul -> Footer)
 * Ditampilkan saat proses perakitan website dengan AI sedang berlangsung.
 */
export function WebsiteBuildingAnimation({
  project,
  isDark,
  streamedChars,
  generationStep,
}: {
  project: ProjectItem;
  isDark: boolean;
  streamedChars: number;
  generationStep: GenerationStep;
}) {
  const [buildStage, setBuildStage] = useState<number>(0);

  // Progressive section assembly: Stage 0 (Header) -> Stage 1 (Hero) -> Stage 2 (Fitur) -> Stage 3 (Modul) -> Stage 4 (Footer)
  useEffect(() => {
    const timer1 = setTimeout(() => setBuildStage((s) => Math.max(s, 1)), 800);
    const timer2 = setTimeout(() => setBuildStage((s) => Math.max(s, 2)), 1800);
    const timer3 = setTimeout(() => setBuildStage((s) => Math.max(s, 3)), 2800);
    const timer4 = setTimeout(() => setBuildStage((s) => Math.max(s, 4)), 3800);
    const timer5 = setTimeout(() => setBuildStage((s) => Math.max(s, 5)), 4600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  // Sinkronisasi dengan streamed character count
  useEffect(() => {
    if (streamedChars > 3500) setBuildStage((s) => Math.max(s, 4));
    else if (streamedChars > 2200) setBuildStage((s) => Math.max(s, 3));
    else if (streamedChars > 1100) setBuildStage((s) => Math.max(s, 2));
    else if (streamedChars > 300) setBuildStage((s) => Math.max(s, 1));
  }, [streamedChars]);

  const features = useMemo(() => {
    const list = project.features || [];
    return [
      list[0]?.name || "Arsitektur Modular & Responsif",
      list[1]?.name || "Keamanan Data & Isolasi Sandbox",
      list[2]?.name || "Interaksi Cerdas & Performa Tinggi",
    ];
  }, [project.features]);

  const progressPercent = Math.min(
    96,
    Math.max(15, buildStage * 20 + Math.min(18, Math.floor(streamedChars / 250)))
  );

  return (
    <div className={`w-full h-full flex flex-col overflow-y-auto relative font-sans select-none ${
      isDark ? "bg-[#0c0f17] text-zinc-100" : "bg-zinc-50 text-zinc-900"
    }`}>
      {/* Background blueprint subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(#6366f130 1px, transparent 1px)"
            : "radial-gradient(#6366f120 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Floating Construction HUD Status Bar */}
      <div className={`sticky top-0 z-40 px-4 py-2.5 border-b backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-md ${
        isDark ? "bg-[#0b0f19]/90 border-indigo-500/30 text-zinc-200" : "bg-white/90 border-indigo-200 text-zinc-800"
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <span className="text-xs font-bold text-indigo-400 font-mono tracking-tight flex items-center gap-1.5">
            <span>⚡ AI Website Builder:</span>
            <span className={isDark ? "text-zinc-200" : "text-zinc-800"}>
              {buildStage === 0 && "Merakit Header & Navigasi..."}
              {buildStage === 1 && "Membangun Hero Section & Headline..."}
              {buildStage === 2 && "Menyusun Fitur & Modul Utama..."}
              {buildStage === 3 && "Menghubungkan Logika Interaktif..."}
              {buildStage >= 4 && "Menyelesaikan Footer & Finishing..."}
            </span>
          </span>
        </div>

        {/* Mini Stage Pills */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono">
          <span className={`px-2 py-0.5 rounded-md border ${buildStage >= 0 ? "bg-indigo-600 text-white border-indigo-500 font-bold" : "opacity-40 border-zinc-700"}`}>
            1. Header {buildStage >= 1 && "✓"}
          </span>
          <span className={`px-2 py-0.5 rounded-md border ${buildStage >= 1 ? "bg-indigo-600 text-white border-indigo-500 font-bold" : "opacity-40 border-zinc-700"}`}>
            2. Hero {buildStage >= 2 && "✓"}
          </span>
          <span className={`px-2 py-0.5 rounded-md border ${buildStage >= 2 ? "bg-indigo-600 text-white border-indigo-500 font-bold" : "opacity-40 border-zinc-700"}`}>
            3. Fitur {buildStage >= 3 && "✓"}
          </span>
          <span className={`px-2 py-0.5 rounded-md border ${buildStage >= 3 ? "bg-indigo-600 text-white border-indigo-500 font-bold" : "opacity-40 border-zinc-700"}`}>
            4. Modul {buildStage >= 4 && "✓"}
          </span>
          <span className={`px-2 py-0.5 rounded-md border ${buildStage >= 4 ? "bg-indigo-600 text-white border-indigo-500 font-bold" : "opacity-40 border-zinc-700"}`}>
            5. Footer {buildStage >= 5 && "✓"}
          </span>
        </div>

        {/* Live Token/Character Counter */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          {streamedChars > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700 text-zinc-300">
              {streamedChars.toLocaleString()} chars
            </span>
          )}
          <span className="font-bold text-indigo-400">{progressPercent}%</span>
        </div>

        {/* Animated Progress Line */}
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Assembly Canvas Viewport */}
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full relative z-10">

        {/* ─── 1. HEADER SECTION ANIMATION ─── */}
        <div
          className={`transition-all duration-700 transform ${
            buildStage >= 0
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span>Section 1: Header & Navigasi</span>
            </span>
            <span className="text-zinc-500">Component: Navbar</span>
          </div>

          <header className={`px-4 sm:px-6 py-3.5 rounded-2xl border flex items-center justify-between shadow-lg relative overflow-hidden backdrop-blur-md ${
            isDark
              ? "bg-zinc-900/90 border-indigo-500/40 ring-1 ring-indigo-500/20"
              : "bg-white/95 border-indigo-300 ring-1 ring-indigo-300/30"
          }`}>
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/30">
                {project.title ? project.title.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <span className="font-bold text-sm sm:text-base tracking-tight block">
                  {project.title || "Usick One Website"}
                </span>
                <span className="text-[10px] text-zinc-400 hidden sm:block">
                  Solusi Digital Terpadu
                </span>
              </div>
            </div>

            {/* Nav Menu Items */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-medium">
              <span className="text-indigo-400 font-semibold cursor-pointer">Beranda</span>
              <span className="hover:text-indigo-400 cursor-pointer transition">Fitur</span>
              <span className="hover:text-indigo-400 cursor-pointer transition">Solusi</span>
              <span className="hover:text-indigo-400 cursor-pointer transition">Tentang</span>
              <span className="hover:text-indigo-400 cursor-pointer transition">Kontak</span>
            </nav>

            {/* CTA Button */}
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer">
                <span>Mulai Sekarang</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </header>
        </div>

        {/* ─── 2. HERO SECTION ANIMATION ─── */}
        <div
          className={`transition-all duration-700 transform ${
            buildStage >= 1
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span>Section 2: Hero Section & Headline</span>
            </span>
            <span className="text-zinc-500">Component: HeroBanner</span>
          </div>

          <div className={`p-6 sm:p-10 rounded-3xl border relative overflow-hidden shadow-xl ${
            isDark
              ? "bg-gradient-to-b from-zinc-900/90 via-zinc-950/80 to-zinc-900/90 border-indigo-500/30"
              : "bg-gradient-to-b from-white via-indigo-50/30 to-white border-indigo-200"
          }`}>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                <span>✨</span>
                <span>Platform Digital Modern</span>
                <span className="text-indigo-400/60">•</span>
                <span className="text-[11px] font-mono">Siap Digunakan</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
                Tingkatkan Efisiensi Bersama{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  {project.title}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
                {project.description ||
                  "Solusi komprehensif yang dirancang untuk mempercepat alur kerja, mengoptimalkan interaksi pengguna, dan memberikan performa terbaik."}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Jelajahi Solusi</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold transition ${
                    isDark
                      ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      : "border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  Lihat Dokumentasi PRD
                </button>
              </div>
            </div>

            <div className={`mt-8 sm:mt-10 p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-3 gap-3 ${
              isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-white/80 border-zinc-200"
            }`}>
              <div className="p-2.5 rounded-xl border border-dashed border-indigo-500/20">
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Status Sistem</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  Online 99.9%
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-dashed border-indigo-500/20">
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Keamanan Sandbox</span>
                <span className="text-xs font-bold text-indigo-400 mt-0.5 block">CSP Terisolasi</span>
              </div>
              <div className="p-2.5 rounded-xl border border-dashed border-indigo-500/20 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Rendering Mode</span>
                <span className="text-xs font-bold text-purple-400 mt-0.5 block">Dynamic HTML5</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. FEATURES SECTION ANIMATION ─── */}
        <div
          className={`transition-all duration-700 transform ${
            buildStage >= 2
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span>Section 3: Fitur & Modul Utama</span>
            </span>
            <span className="text-zinc-500">Component: FeatureGrid</span>
          </div>

          <div className="space-y-3">
            <div className="text-center max-w-md mx-auto mb-4">
              <h2 className="text-lg font-bold">Fitur Unggulan Sistem</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Disusun sesuai spesifikasi kebutuhan proyek Anda</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {features.map((featTitle, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all duration-500 transform hover:scale-[1.02] ${
                    isDark
                      ? "bg-zinc-900/70 border-zinc-800 hover:border-indigo-500/40"
                      : "bg-white border-zinc-200 hover:border-indigo-400"
                  }`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-3">
                    {idx === 0 && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {idx === 1 && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {idx === 2 && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xs font-bold mb-1.5">{featTitle}</h3>
                  <div className="space-y-1.5 mb-3">
                    <div className="w-full h-2 rounded bg-zinc-700/30 animate-pulse" />
                    <div className="w-3/4 h-2 rounded bg-zinc-700/20 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <span>●</span> Modul Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 4. INTERACTIVE MODULE ANIMATION ─── */}
        <div
          className={`transition-all duration-700 transform ${
            buildStage >= 3
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span>Section 4: Modul Interaktif & Formulir</span>
            </span>
            <span className="text-zinc-500">Component: InteractiveSimulation</span>
          </div>

          <div className={`p-5 rounded-2xl border shadow-lg ${
            isDark ? "bg-zinc-900/80 border-indigo-500/30" : "bg-white border-indigo-200"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xs font-bold">Simulasi Interaksi Client-Side</h3>
                <p className="text-[11px] text-zinc-400">Logika JavaScript interaktif sedang dirangkai ke dalam dokumen HTML.</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 self-start sm:self-auto">
                JavaScript Ready
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                isDark ? "bg-zinc-950 border-zinc-800 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-500"
              }`}>
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="animate-pulse">Cari data atau lakukan simulasi input...</span>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs"
              >
                Proses
              </button>
            </div>
          </div>
        </div>

        {/* ─── 5. FOOTER SECTION ANIMATION ─── */}
        <div
          className={`transition-all duration-700 transform ${
            buildStage >= 4
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span>Section 5: Footer & Legalitas</span>
            </span>
            <span className="text-zinc-500">Component: Footer</span>
          </div>

          <footer className={`p-6 rounded-2xl border text-xs ${
            isDark ? "bg-zinc-950/80 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-300 text-zinc-600"
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  {project.title ? project.title.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="font-semibold text-zinc-200">{project.title}</span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <span className="hover:text-indigo-400 cursor-pointer">Privasi</span>
                <span className="hover:text-indigo-400 cursor-pointer">Syarat & Ketentuan</span>
                <span className="hover:text-indigo-400 cursor-pointer">Kontak Tim</span>
              </div>

              <span className="text-[10px] text-zinc-500 font-mono">
                © 2026 {project.title}. All rights reserved.
              </span>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
}

export function CodePreviewCanvas({
  project,
  isDark,
  onUpdateHtml,
  onSwitchToChat,
  userId,
  autoStartGeneration,
  onGenerationStarted,
}: CodePreviewCanvasProps) {
  // 1. Inisialisasi HTML awal langsung dari state project yang sudah ada (tanpa memicu AI)
  const initialHtml = useMemo(() => {
    if (project.generatedHtml && project.generatedHtml.trim().length > 50) {
      return project.generatedHtml;
    }
    // Jika proyek sama sekali belum memiliki HTML, gunakan starter deterministik
    if (
      project.prd?.overview ||
      (project.features && project.features.length > 0) ||
      (project.tasks && project.tasks.length > 0)
    ) {
      try {
        return generateDynamicStarterHtml(project);
      } catch {
        return "";
      }
    }
    return "";
  }, [project.id]);

  const [rawHtml, setRawHtml] = useState<string>(initialHtml);
  const [debouncedHtml, setDebouncedHtml] = useState<string>(initialHtml);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [zoom, setZoom] = useState<number>(100);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Stepper progres generasi & revisi
  const [isBuildingAnimActive, setIsBuildingAnimActive] = useState<boolean>(() => Boolean(autoStartGeneration));
  const [generationStep, setGenerationStep] = useState<GenerationStep>(
    autoStartGeneration ? "generating_website" : "idle"
  );
  const [streamedChars, setStreamedChars] = useState<number>(0);
  const [revisionInput, setRevisionInput] = useState<string>("");
  const [previousSavedHtml, setPreviousSavedHtml] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportDetails, setExportDetails] = useState<{ filename: string; sizeKb: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentPreset = DEVICE_PRESETS[device];
  const hasHtml = Boolean(debouncedHtml.trim());
  const isGenerating = generationStep !== "idle" || isBuildingAnimActive;

  // 2. Sinkronisasi jika project.generatedHtml berubah dari luar tanpa memicu AI baru
  useEffect(() => {
    if (project.generatedHtml && project.generatedHtml !== rawHtml) {
      setRawHtml(project.generatedHtml);
      setDebouncedHtml(project.generatedHtml);
    }
  }, [project.generatedHtml, project.id]);

  // 3. Debounce pembaruan HTML ke iframe (300ms) untuk editing manual yang mulus
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHtml(rawHtml);
      if (rawHtml && rawHtml !== project.generatedHtml) {
        onUpdateHtml(rawHtml);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [rawHtml]);

  // 4. Listener runtime error dari sandboxed iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "PREVIEW_CONSOLE_ERROR") {
        setPreviewError(e.data.message || "Runtime error terdeteksi di iframe sandbox");
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  // 5. Dukungan tombol ESC untuk keluar dari Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // 6. Sanitasi CSP & Error Catcher Iframe
  const securedHtml = useMemo(() => {
    return buildStrictSandboxHtml(debouncedHtml);
  }, [debouncedHtml]);

  // 7. Salin source code ke clipboard
  const handleCopySource = () => {
    if (!rawHtml) return;
    navigator.clipboard.writeText(rawHtml).then(() => {
      setCopyFeedback("Source code disalin!");
      setTimeout(() => setCopyFeedback(null), 2200);
    });
  };

  // 8. Reset Zoom ke 100%
  const handleResetZoom = () => setZoom(100);
  const handleZoomIn = () => setZoom((z) => Math.min(150, z + 15));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 15));

  // 9. Alur Generasi & Revisi AI yang aman dengan jaminan animasi perakitan website
  const handleRunAi = async (instruction?: string) => {
    setPreviewError(null);
    setStreamedChars(0);
    setIsBuildingAnimActive(true);
    setGenerationStep("generating_website");

    const startTime = Date.now();
    const previousValidHtml = rawHtml;
    if (previousValidHtml && previousValidHtml.trim().length > 50) {
      setPreviousSavedHtml(previousValidHtml);
    }

    let generatedHtmlResult = "";

    try {
      const onChunk = (streamedText: string) => {
        setStreamedChars(streamedText.length);
      };

      generatedHtmlResult = await generateDynamicWebsiteHtmlWithAI(
        project,
        onChunk,
        userId,
        instruction
          ? { revisionInstruction: instruction, previousHtml: previousValidHtml }
          : {}
      );
    } catch (err: unknown) {
      console.warn("[CodePreviewCanvas] AI Generation fallback to dynamic starter:", err);
      // Fallback graceful: jangan gagalkan atau tampilkan error, gunakan dynamic starter engine
      try {
        generatedHtmlResult = generateDynamicStarterHtml(project);
      } catch {
        generatedHtmlResult = previousValidHtml;
      }
    }

    // Jaminan waktu animasi: pastikan user dapat melihat animasi perakitan website secara lengkap (Header -> Hero -> Fitur -> Modul -> Footer)
    const minDuration = instruction ? 2200 : 4800;
    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) {
      await new Promise((r) => setTimeout(r, minDuration - elapsed));
    }

    // Validasi & finalisasi HTML
    setGenerationStep("validating_html");
    const validation = parseGeneratedHtml(generatedHtmlResult);
    const finalHtml = (validation.ok && validation.html && validation.html.length > 300)
      ? validation.html
      : (generatedHtmlResult && generatedHtmlResult.length > 300 ? generatedHtmlResult : generateDynamicStarterHtml(project));

    // Update live canvas
    setGenerationStep("updating_preview");
    setRawHtml(finalHtml);
    setDebouncedHtml(finalHtml);
    onUpdateHtml(finalHtml);
    setRefreshKey((k) => k + 1);

    setIsBuildingAnimActive(false);
    setGenerationStep("idle");

    if (instruction) {
      setRevisionInput("");
      setCopyFeedback("Revisi berhasil diterapkan!");
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  // Auto-start generation jika dipicu dari transisi perencanaan baru
  useEffect(() => {
    if (autoStartGeneration) {
      setIsBuildingAnimActive(true);
      onGenerationStarted?.();
      handleRunAi();
    }
  }, [autoStartGeneration]);

  // 10. Mengembalikan kode ke versi sebelum perubahan terakhir (Revert)
  const handleRevertToPrevious = () => {
    if (!previousSavedHtml) return;
    const toRestore = previousSavedHtml;
    setPreviousSavedHtml(rawHtml);
    setRawHtml(toRestore);
    setDebouncedHtml(toRestore);
    onUpdateHtml(toRestore);
    setRefreshKey((k) => k + 1);
    setCopyFeedback("Berhasil mengembalikan ke versi sebelumnya!");
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // 11. Ekspor file HTML aktif mandiri (Tahap 3)
  const handleExportHtml = () => {
    if (!rawHtml || !rawHtml.trim()) {
      setPreviewError("Belum ada kode HTML yang aktif untuk diekspor. Buat atau generate prototipe terlebih dahulu.");
      return;
    }

    try {
      const fullDoc = rawHtml.trim().startsWith("<!DOCTYPE") || rawHtml.trim().startsWith("<!doctype")
        ? rawHtml
        : `<!DOCTYPE html>\n${rawHtml}`;

      const filename = generateExportFilename(project.title);
      const blob = new Blob([fullDoc], { type: "text/html;charset=utf-8" });
      const sizeKb = (blob.size / 1024).toFixed(1);

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setExportDetails({ filename, sizeKb });
      setShowExportModal(true);
    } catch (err: unknown) {
      setPreviewError("Gagal mengekspor file HTML: " + sanitizeUserFacingErrorMessage(err));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col min-h-0 overflow-hidden relative select-none ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      } ${isDark ? "bg-[#090d16] text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}
    >
      {/* ─── Feedback Toast ─── */}
      {copyFeedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-black border border-zinc-700 shadow-xl animate-in fade-in-0 duration-150">
          ✓ {copyFeedback}
        </div>
      )}

      {/* ─── Toolbar Utama (Device, Mode, Zoom, Fullscreen) ─── */}
      <div
        className={`px-3 sm:px-6 py-2 border-b flex items-center justify-between gap-2.5 shrink-0 overflow-x-auto no-scrollbar ${
          isDark ? "border-zinc-800 bg-zinc-950/90" : "border-zinc-200 bg-white"
        }`}
      >
        {/* Left: View Mode Toggle (Code vs 👁 Preview) */}
        <div
          className={`flex items-center p-0.5 rounded-xl border shrink-0 ${
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-300"
          }`}
        >
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === "preview"
                ? isDark
                  ? "bg-white text-black shadow-xs"
                  : "bg-black text-white shadow-xs"
                : isDark
                ? "text-zinc-400 hover:text-white"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === "code"
                ? isDark
                  ? "bg-white text-black shadow-xs"
                  : "bg-black text-white shadow-xs"
                : isDark
                ? "text-zinc-400 hover:text-white"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span><span className="hidden sm:inline">Source </span>Code</span>
          </button>
        </div>

        {/* Center: Device Selector (Desktop 1440 / Tablet 768 / Mobile 390) */}
        {viewMode === "preview" && (
          <div
            className={`flex items-center p-0.5 rounded-xl border shrink-0 ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-300"
            }`}
          >
            {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer capitalize flex items-center gap-1.5 ${
                  device === d
                    ? isDark
                      ? "bg-white text-black shadow-xs"
                      : "bg-black text-white shadow-xs"
                    : isDark
                    ? "text-zinc-400 hover:text-white"
                    : "text-zinc-600 hover:text-black"
                }`}
                title={DEVICE_PRESETS[d].label}
              >
                {d === "desktop" ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : d === "tablet" ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="hidden md:inline">{d}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right: Controls (Zoom In/Out/Reset, Refresh, Fullscreen) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {viewMode === "preview" && (
            <div className="flex items-center gap-1">
              <div className="hidden md:flex items-center gap-1">
                {/* Zoom Out Button */}
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-mono transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                  }`}
                  title="Perkecil (-)"
                >
                  -
                </button>

                {/* Zoom Selector Dropdown */}
                <select
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Pilih tingkat zoom"
                  className={`text-xs px-2 py-1 rounded-lg border font-mono outline-none cursor-pointer ${
                    isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200" : "bg-white border-zinc-300 text-zinc-800"
                  }`}
                >
                  {ZOOM_PRESETS.map((z) => (
                    <option key={z} value={z}>{z}%</option>
                  ))}
                </select>

                {/* Zoom In Button */}
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 150}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-mono transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                  }`}
                  title="Perbesar (+)"
                >
                  +
                </button>

                {/* Reset Zoom Button */}
                {zoom !== 100 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
                      isDark ? "border-zinc-800 bg-zinc-900 text-indigo-400 hover:bg-zinc-800" : "border-zinc-300 bg-zinc-100 text-indigo-600 hover:bg-zinc-200"
                    }`}
                    title="Reset Zoom ke 100%"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Refresh / Reload Iframe Button */}
              <button
                type="button"
                onClick={() => {
                  setRefreshKey((k) => k + 1);
                  setPreviewError(null);
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
                title="Muat Ulang Iframe (↻)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}

          {/* Ekspor HTML - Tersedia di mode Preview maupun Source Code */}
          <button
            type="button"
            onClick={handleExportHtml}
            disabled={!hasHtml}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? "border-emerald-800/80 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300"
                : "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
            }`}
            title="Unduh file HTML mandiri untuk dibuka secara lokal di browser"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Ekspor HTML</span>
            <span className="sm:hidden">Ekspor</span>
          </button>

          {/* Salin HTML - Tersedia di mode Preview maupun Source Code */}
          <button
            type="button"
            onClick={handleCopySource}
            disabled={!hasHtml}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200" : "border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800"
            }`}
            title="Salin seluruh kode HTML ke clipboard"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden md:inline">Salin HTML</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
            }`}
            title={isFullscreen ? "Keluar Layar Penuh (ESC)" : "Layar Penuh (⛶)"}
          >
            {isFullscreen ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ─── Sub-bar: Status Render, Stepper Progres Akurat, & AI Revision Bar ─── */}
      <div
        className={`px-3 sm:px-6 py-2 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? "border-zinc-800/80 bg-zinc-950/70" : "border-zinc-200 bg-zinc-50/90"
        }`}
      >
        {/* Status Indicator, Stepper Progres Jujur, & Tombol Revert */}
        <div className="flex items-center gap-2 flex-wrap">
          {generationStep === "idle" ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Live Preview Siap</span>
              <span className="text-zinc-500 text-[10px]">•</span>
              <span className="font-mono text-[10px] text-zinc-400">
                {currentPreset.label} ({zoom}%)
              </span>
            </span>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-[11px] font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
              <span>
                {generationStep === "preparing_context" && "1/4 Menyiapkan konteks proyek & panduan desain..."}
                {generationStep === "generating_website" &&
                  `2/4 Menulis kode website via AI (${streamedChars.toLocaleString()} karakter diterima)...`}
                {generationStep === "validating_html" && "3/4 Memvalidasi struktur & kepatuhan sandbox HTML..."}
                {generationStep === "updating_preview" && "4/4 Memperbarui Live Preview Canvas..."}
              </span>
            </div>
          )}

          {/* Tombol Revert: Tampil jika terdapat riwayat HTML sebelum revisi/perubahan */}
          {previousSavedHtml && previousSavedHtml !== rawHtml && generationStep === "idle" && (
            <button
              type="button"
              onClick={handleRevertToPrevious}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer shadow-xs ${
                isDark
                  ? "bg-amber-950/60 border-amber-800/70 text-amber-300 hover:bg-amber-900/80"
                  : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
              }`}
              title="Kembalikan kode ke versi sebelum perubahan terakhir"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
              </svg>
              <span>Kembali ke Versi Sebelumnya</span>
            </button>
          )}

          {hasHtml && (
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              Ukuran kode: <strong className={isDark ? "text-zinc-200" : "text-zinc-800"}>{rawHtml.length.toLocaleString()}</strong> chars
            </span>
          )}
        </div>

        {/* AI Revision Input & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-80 flex items-center gap-1.5">
            <input
              type="text"
              value={revisionInput}
              onChange={(e) => setRevisionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && revisionInput.trim() && !isGenerating) {
                  e.preventDefault();
                  handleRunAi(revisionInput.trim());
                }
              }}
              disabled={isGenerating}
              placeholder="Instruksi revisi (cth: Ganti aksen warna, tambahkan WhatsApp)..."
              className={`w-full text-xs px-3 py-1.5 rounded-xl border outline-none transition disabled:opacity-50 ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500"
                  : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500"
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() => handleRunAi(revisionInput.trim())}
            disabled={isGenerating || !revisionInput.trim()}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
            title="Kirim instruksi revisi ke AI"
          >
            Revisi
          </button>

          <button
            type="button"
            onClick={() => handleRunAi()}
            disabled={isGenerating}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50 ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
            title="Generate ulang website penuh dari PRD menggunakan AI"
          >
            <span>✨</span>
            <span className="hidden sm:inline">Regenerate AI</span>
          </button>
        </div>
      </div>

      {/* ─── Error Notification Banner (Informatif & Bebas Bocoran Rahasia) ─── */}
      {previewError && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{previewError}</span>
          </div>
          <div className="flex items-center gap-3 ml-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setRefreshKey((k) => k + 1);
                setPreviewError(null);
              }}
              className="underline font-bold text-[11px] hover:text-amber-300 cursor-pointer"
            >
              Muat Ulang
            </button>
            <button
              type="button"
              onClick={() => setPreviewError(null)}
              className="text-zinc-400 hover:text-zinc-200 text-sm font-bold px-1 cursor-pointer"
              title="Tutup pemberitahuan"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content Canvas Area ─── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* State A: Belum Ada HTML */}
        {!hasHtml && !isGenerating && viewMode === "preview" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div
              className={`w-16 h-16 rounded-3xl border flex items-center justify-center mb-4 ${
                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-300 text-zinc-600"
              }`}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1">
              Belum ada prototipe website untuk ditampilkan
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
              Mulai buat tampilan website berdasarkan PRD dan fitur aktif proyek <strong>{project.title}</strong>.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    const starter = generateDynamicStarterHtml(project);
                    setRawHtml(starter);
                    setDebouncedHtml(starter);
                    onUpdateHtml(starter);
                  } catch (e: any) {
                    setPreviewError("Gagal membuat starter: " + e.message);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                Buat Prototipe Starter Instan
              </button>
              <button
                type="button"
                onClick={() => handleRunAi()}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-indigo-500/40 text-indigo-400 hover:bg-indigo-950/30 transition cursor-pointer"
              >
                ✨ Generate dengan AI
              </button>
            </div>
          </div>
        ) : viewMode === "code" ? (
          /* State B: Source Code Viewer & Manual Editor */
          <div className={`flex-1 flex flex-col min-h-0 ${isDark ? "bg-[#090d16]" : "bg-white"}`}>
            <div
              className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
                isDark ? "border-zinc-800 text-zinc-400 bg-zinc-950/60" : "border-zinc-200 text-zinc-600 bg-zinc-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Source Code HTML/CSS/JS (Live Editor)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span>{rawHtml.length.toLocaleString()} karakter</span>
                <span>{rawHtml.split("\n").length.toLocaleString()} baris</span>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <textarea
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                placeholder="<!DOCTYPE html><html>... tulis atau tempel kode HTML di sini...</html>"
                className={`w-full h-full p-4 font-mono text-xs outline-none resize-none border-none leading-relaxed select-text ${
                  isDark ? "bg-[#090d16] text-zinc-200 selection:bg-zinc-800" : "bg-white text-zinc-900 selection:bg-zinc-200"
                }`}
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          /* State C: Live Frame Canvas Device View */
          <div
            className={`flex-1 flex flex-col min-h-0 overflow-auto relative items-center justify-start p-4 sm:p-8 ${
              isDark ? "bg-[#0b0f19]" : "bg-zinc-100"
            }`}
          >
            {/* Framed Device Wrapper */}
            <div
              className={`flex flex-col transition-all duration-200 relative shadow-2xl rounded-3xl overflow-hidden border shrink-0 my-auto ${
                isDark ? "border-zinc-800 bg-black shadow-black/80" : "border-zinc-300 bg-white shadow-zinc-900/10"
              }`}
              style={{
                width: `${currentPreset.width}px`,
                height: `${currentPreset.height}px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {/* Device Header Bar */}
              <div
                className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono shrink-0 select-none ${
                  isDark ? "border-zinc-800/80 bg-zinc-950 text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                  </div>
                  <span className="ml-2 font-bold">{currentPreset.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isGenerating ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping inline-block" />
                      Building Website...
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                      sandbox="allow-scripts"
                    </span>
                  )}
                </div>
              </div>

              {/* Sandboxed Iframe Container OR Live Website Construction Animation */}
              <div className="flex-1 w-full h-full relative bg-white overflow-hidden">
                {isGenerating ? (
                  <WebsiteBuildingAnimation
                    project={project}
                    isDark={isDark}
                    streamedChars={streamedChars}
                    generationStep={generationStep}
                  />
                ) : (
                  <iframe
                    key={refreshKey}
                    srcDoc={securedHtml}
                    sandbox="allow-scripts"
                    className="w-full h-full border-none"
                    title="Usick One Live Preview Canvas"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal Info Hasil Ekspor HTML (Tahap 3) ─── */}
      {showExportModal && exportDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-text">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold">File HTML Berhasil Diekspor!</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {exportDetails.filename} ({exportDetails.sizeKb} KB)
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs mb-4 leading-relaxed ${
                isDark ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
              }`}
            >
              <p className="font-semibold mb-1 text-emerald-400">💡 Panduan & Batasan Penggunaan:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400">
                <li>File ini merupakan dokumen HTML mandiri lengkap dengan CSS Tailwind dan JavaScript interaktif.</li>
                <li>Dapat langsung dibuka di browser apa pun (Google Chrome, Safari, Firefox, Edge) cukup dengan klik dua kali.</li>
                <li><strong>Koneksi Internet:</strong> Memerlukan akses internet aktif saat dibuka untuk memuat Tailwind CSS (CDN), Google Fonts, dan foto Unsplash.</li>
                <li>Semua form, keranjang, dan reservasi berjalan sebagai simulasi client-side tanpa koneksi ke server luar.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                Tutup & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
