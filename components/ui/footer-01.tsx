"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Shield, Sparkles, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Layout primitive (Container) */
const containerWidths = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

interface ContainerProps extends React.ComponentProps<"div"> {
  width?: keyof typeof containerWidths;
}

function Container({ width = "default", className, ...props }: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full px-6", containerWidths[width], className)}
      {...props}
    />
  );
}

/* Brand icons for social links */
type IconProps = React.ComponentProps<"svg">;

function BrandIcon({ d, ...props }: IconProps & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d={d} />
    </svg>
  );
}

function GitHubIcon(props: IconProps) {
  return (
    <BrandIcon
      d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.08 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3"
      {...props}
    />
  );
}

function LinkedInIcon(props: IconProps) {
  return (
    <BrandIcon
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      {...props}
    />
  );
}

function XIcon(props: IconProps) {
  return (
    <BrandIcon
      d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z"
      {...props}
    />
  );
}

function YouTubeIcon(props: IconProps) {
  return (
    <BrandIcon
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      {...props}
    />
  );
}

/* Small live indicator with a pulsing halo */
const tones = {
  success: { dot: "bg-emerald-500", halo: "bg-emerald-500/60" },
  warning: { dot: "bg-amber-500", halo: "bg-amber-500/60" },
  danger: { dot: "bg-red-500", halo: "bg-red-500/60" },
  neutral: { dot: "bg-foreground", halo: "bg-foreground/30" },
};

interface StatusDotProps extends React.ComponentProps<"span"> {
  tone?: keyof typeof tones;
  pulse?: boolean;
}

function StatusDot({
  tone = "success",
  pulse = true,
  className,
  ...props
}: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cn("relative flex size-2 shrink-0", className)}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full motion-reduce:animate-none",
            tones[tone].halo,
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex size-full rounded-full",
          tones[tone].dot,
        )}
      />
    </span>
  );
}

export type FooterActionType =
  | "signup"
  | "signin"
  | "pricing"
  | "features"
  | "models"
  | "changelog"
  | "roadmap"
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "security"
  | "status";

export interface Footer01Props {
  isDark?: boolean;
  onGetStarted?: (mode?: "signup" | "signin") => void;
  onOpenPricing?: () => void;
}

export default function Footer01({
  isDark = true,
  onGetStarted,
  onOpenPricing,
}: Footer01Props) {
  const [activeModal, setActiveModal] = useState<FooterActionType | null>(null);

  const handleLinkClick = (e: React.MouseEvent, action: FooterActionType) => {
    e.preventDefault();
    if (action === "signup" || action === "signin") {
      onGetStarted?.(action);
    } else if (action === "pricing") {
      if (onOpenPricing) {
        onOpenPricing();
      } else {
        setActiveModal("pricing");
      }
    } else {
      setActiveModal(action);
    }
  };

  const columns = [
    {
      title: "Produk & AI",
      items: [
        { label: "Fitur Ekosistem", action: "features" as FooterActionType },
        { label: "Paket & Harga", action: "pricing" as FooterActionType },
        { label: "Model AI Terhubung", action: "models" as FooterActionType },
        { label: "Catatan Rilis (Changelog)", action: "changelog" as FooterActionType },
        { label: "Rencana Roadmap", action: "roadmap" as FooterActionType },
      ],
    },
    {
      title: "Platform",
      items: [
        { label: "Tentang One Mind", action: "about" as FooterActionType },
        { label: "Akses Cepat", action: "signup" as FooterActionType },
        { label: "Masuk Akun", action: "signin" as FooterActionType },
        { label: "Bantuan & Kontak", action: "contact" as FooterActionType },
      ],
    },
    {
      title: "Keamanan & Legal",
      items: [
        { label: "Kebijakan Privasi", action: "privacy" as FooterActionType },
        { label: "Syarat & Ketentuan", action: "terms" as FooterActionType },
        { label: "Enkripsi & Keamanan", action: "security" as FooterActionType },
        { label: "Status Operasional", action: "status" as FooterActionType },
      ],
    },
  ];

  const socials = [
    { name: "GitHub", href: "https://github.com/usickartwork/AI-PRIBADI", icon: GitHubIcon },
    { name: "X", href: "https://x.com", icon: XIcon },
    { name: "LinkedIn", href: "https://linkedin.com", icon: LinkedInIcon },
    { name: "YouTube", href: "https://youtube.com", icon: YouTubeIcon },
  ];

  return (
    <>
      <footer
        className={cn(
          "relative overflow-hidden border-t transition-colors select-none",
          isDark
            ? "border-zinc-800 bg-[#09090b] text-zinc-100"
            : "border-zinc-200 bg-white text-zinc-900"
        )}
      >
        <Container className="pt-16 sm:pt-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_2fr]">
            {/* Brand Intro & Quick Action (No email form as requested) */}
            <div className="flex max-w-md flex-col gap-5">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const container = document.getElementById("page-1-container") || window;
                  container.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "flex items-center font-bold tracking-tight text-xl transition-opacity hover:opacity-90",
                  isDark ? "text-white" : "text-black"
                )}
              >
                <span>One Mind</span>
              </a>

              <p
                className={cn(
                  "text-sm leading-relaxed",
                  isDark ? "text-zinc-400" : "text-zinc-600"
                )}
              >
                One Mind. Infinite Intelligence. Ekosistem AI terpadu: Chat, Code, Image Generation, hingga Schedule otomatis bersama model-model terbaik dunia dalam satu ruang kerja.
              </p>

              {/* Call-to-action Button */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="button"
                  onClick={() => onGetStarted?.("signup")}
                  className={cn(
                    "rounded-full px-6 py-2.5 font-semibold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer",
                    isDark
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "bg-black text-white hover:bg-zinc-800"
                  )}
                >
                  <span>Mulai Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onGetStarted?.("signin")}
                  className={cn(
                    "rounded-full px-5 py-2.5 font-medium text-sm transition-colors cursor-pointer",
                    isDark
                      ? "border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-black"
                  )}
                >
                  Masuk Akun
                </Button>
              </div>
            </div>

            {/* Navigation Columns */}
            <nav
              aria-label="Footer"
              className="grid grid-cols-2 gap-8 sm:grid-cols-3"
            >
              {columns.map((column) => (
                <div key={column.title}>
                  <h3
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isDark ? "text-zinc-200" : "text-zinc-800"
                    )}
                  >
                    {column.title}
                  </h3>
                  <ul className="mt-4 flex flex-col gap-3">
                    {column.items.map((item) => (
                      <li key={item.label}>
                        <a
                          href="#"
                          onClick={(e) => handleLinkClick(e, item.action)}
                          className={cn(
                            "text-sm transition-colors cursor-pointer",
                            isDark
                              ? "text-zinc-400 hover:text-white"
                              : "text-zinc-600 hover:text-black"
                          )}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom Bar */}
          <div
            className={cn(
              "mt-16 flex flex-col-reverse items-start justify-between gap-6 border-t py-8 sm:flex-row sm:items-center",
              isDark ? "border-zinc-800/80" : "border-zinc-200/80"
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:gap-6",
                isDark ? "text-zinc-400" : "text-zinc-500"
              )}
            >
              <span>© {new Date().getFullYear()} One Mind, Inc. All rights reserved.</span>
              <button
                type="button"
                onClick={(e) => handleLinkClick(e, "status")}
                className={cn(
                  "inline-flex items-center gap-2 transition-colors cursor-pointer text-left",
                  isDark ? "hover:text-white text-zinc-300" : "hover:text-black text-zinc-700"
                )}
              >
                <StatusDot />
                <span>Seluruh Sistem Beroperasi Normal</span>
              </button>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-1.5">
              {socials.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
                    isDark
                      ? "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
                  )}
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </Container>

        {/* Large Aesthetic Watermark */}
        <Container aria-hidden className="pointer-events-none select-none">
          <p
            className={cn(
              "-mb-[0.22em] bg-clip-text text-center text-[clamp(4.5rem,20vw,14rem)] leading-none font-bold tracking-tighter text-transparent transition-opacity",
              isDark
                ? "bg-gradient-to-b from-white/10 to-transparent"
                : "bg-gradient-to-b from-black/10 to-transparent"
            )}
          >
            One Mind
          </p>
        </Container>
      </footer>

      {/* ─── DETAILED MODAL DIALOGS FOR ALL FOOTER ACTIONS ──────────────── */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className={cn(
              "relative w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl border animate-in zoom-in-95 duration-200",
              isDark
                ? "bg-zinc-900 border-zinc-800 text-white"
                : "bg-white border-zinc-200 text-zinc-900"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-xl transition-colors cursor-pointer",
                isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
              )}
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content Switch */}
            {activeModal === "features" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", isDark ? "bg-zinc-800 text-white" : "bg-zinc-100 text-black")}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Fitur Ekosistem One Mind</h3>
                    <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>Teknologi AI Multi-Model Terlengkap</p>
                  </div>
                </div>
                <div className={cn("space-y-2.5 text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  <p>• <strong>Chat Multi-Model:</strong> Beralih fleksibel antara Claude 3.7, ChatGPT, Gemini, DeepSeek, Qwen, Kimi, dan GLM dalam satu percakapan.</p>
                  <p>• <strong>Code Workspace:</strong> Editor kode terintegrasi dengan pratinjau langsung, debugging, dan auto-refactor berbasis AI.</p>
                  <p>• <strong>Image Generation:</strong> Studio visual teks-ke-gambar ultra-realistis dengan resolusi tinggi.</p>
                  <p>• <strong>Schedule Automation:</strong> Asisten penjadwalan cerdas dengan pengingat otomatis dan notifikasi browser.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onGetStarted?.("signup");
                  }}
                  className={cn("w-full mt-4 font-semibold", isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800")}
                >
                  Coba Sekarang Secara Gratis
                </Button>
              </div>
            )}

            {activeModal === "pricing" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", isDark ? "bg-zinc-800 text-white" : "bg-zinc-100 text-black")}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Paket & Langganan One Mind</h3>
                    <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>Akses fleksibel tanpa komitmen tersembunyi</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className={cn("p-4 rounded-xl border flex flex-col justify-between", isDark ? "border-zinc-800 bg-zinc-950/60" : "border-zinc-200 bg-zinc-50")}>
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Starter</span>
                      <h4 className="font-bold text-base mt-2">Free Explorer</h4>
                      <p className="text-2xl font-extrabold mt-1">Rp 0 <span className="text-xs font-normal opacity-70">/ bulan</span></p>
                      <ul className="mt-3 space-y-1.5 text-xs opacity-80">
                        <li>• 50.000 Kredit AI Awal</li>
                        <li>• Akses Model Cepat (Gemini, Qwen)</li>
                        <li>• Riwayat Chat Standar</li>
                      </ul>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        onGetStarted?.("signup");
                      }}
                      variant="outline"
                      className="w-full mt-4 text-xs font-semibold cursor-pointer"
                    >
                      Mulai Gratis
                    </Button>
                  </div>

                  <div className={cn("p-4 rounded-xl border-2 flex flex-col justify-between relative", isDark ? "border-white bg-zinc-950" : "border-black bg-white shadow-md")}>
                    <span className={cn("absolute -top-2.5 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", isDark ? "bg-white text-black" : "bg-black text-white")}>Populer</span>
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Pro Member</span>
                      <h4 className="font-bold text-base mt-2">One Mind Pro</h4>
                      <p className="text-2xl font-extrabold mt-1">Rp 149.000 <span className="text-xs font-normal opacity-70">/ bln</span></p>
                      <ul className="mt-3 space-y-1.5 text-xs opacity-80">
                        <li>• 1.000.000 Kredit Bulanan</li>
                        <li>• Akses Semua 10+ Model Premium</li>
                        <li>• Prioritas Inferensi Cepat</li>
                        <li>• Fitur Code & Auto-Schedule</li>
                      </ul>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        onGetStarted?.("signup");
                      }}
                      className={cn("w-full mt-4 text-xs font-semibold cursor-pointer", isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800")}
                    >
                      Pilih Pro
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "models" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", isDark ? "bg-zinc-800 text-white" : "bg-zinc-100 text-black")}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Model AI Terhubung</h3>
                    <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>10+ Model Terkemuka Dunia</p>
                  </div>
                </div>
                <div className={cn("grid grid-cols-2 gap-2 text-xs", isDark ? "text-zinc-300" : "text-zinc-700")}>
                  <div className={cn("p-2.5 rounded-xl border", isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50")}>
                    <p className="font-bold">Claude 3.7 Sonnet</p>
                    <p className="text-[11px] opacity-70">Penalaran & Analisis Mendalam</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border", isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50")}>
                    <p className="font-bold">ChatGPT (GPT-4o / OSS)</p>
                    <p className="text-[11px] opacity-70">Percakapan Luwes & Kreativitas</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border", isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50")}>
                    <p className="font-bold">DeepSeek R1 / V3</p>
                    <p className="text-[11px] opacity-70">Logika Matematika & Coding</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border", isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50")}>
                    <p className="font-bold">Google Gemini 3.5</p>
                    <p className="text-[11px] opacity-70">Multimodal & Konteks Luas</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border", isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50")}>
                    <p className="font-bold">Qwen 3 Coder</p>
                    <p className="text-[11px] opacity-70">Pemrograman Cepat & Akurat</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border", isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50")}>
                    <p className="font-bold">Groq Lightning</p>
                    <p className="text-[11px] opacity-70">Inferensi Super Cepat 500+ t/s</p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "changelog" && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Catatan Rilis (Changelog v2.4)</h3>
                <div className={cn("space-y-3 text-xs leading-relaxed max-h-60 overflow-y-auto pr-1", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  <div className={cn("p-3 rounded-xl border", isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50")}>
                    <span className="font-bold text-sm block mb-1">v2.4 — One Mind Experience</span>
                    <p>• Integrasi antarmuka landing page baru dengan animasi live gradient bars.</p>
                    <p>• Pembaharuan TechText hero intro loader yang lebih presisi dan mulus.</p>
                    <p>• Peningkatan kecepatan respons AI hingga 40% dengan optimasi inferensi token.</p>
                  </div>
                  <div className={cn("p-3 rounded-xl border", isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50")}>
                    <span className="font-bold text-sm block mb-1">v2.3 — Voice & Vision Update</span>
                    <p>• Asisten suara interaktif Voice Orb dengan latensi ultra-rendah.</p>
                    <p>• Pratinjau gambar fullscreen dengan dukungan download resolusi asli.</p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "roadmap" && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Rencana Roadmap One Mind</h3>
                <div className={cn("space-y-2.5 text-sm", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Multi-Agent Collaborative Canvas (Q2 2026)</p>
                      <p className="text-xs opacity-75">Kolaborasi tim AI di mana berbagai model mengerjakan proyek yang sama secara simultan.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Autonomous Workflow Actions (Q3 2026)</p>
                      <p className="text-xs opacity-75">Eksekusi otomatis tugas kalender, email, dan integrasi API pihak ketiga secara otonom.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "about" && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Tentang One Mind</h3>
                <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  One Mind dirancang untuk menyatukan seluruh kecerdasan buatan terdepan di dunia ke dalam satu platform tanpa hambatan (seamless). Misi kami adalah memudahkan profesional, kreator, dan pengembang untuk mengakses kekuatan terbaik dari setiap model AI tanpa perlu berpindah-pindah tab atau aplikasi.
                </p>
                <div className={cn("p-3.5 rounded-xl border text-xs", isDark ? "border-zinc-800 bg-zinc-950/60 text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600")}>
                  Didukung oleh arsitektur inferensi berkecepatan tinggi, keamanan tingkat enterprise, dan dedikasi privasi data tanpa kompromi.
                </div>
              </div>
            )}

            {activeModal === "contact" && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Bantuan & Kontak Dukungan</h3>
                <p className={cn("text-sm", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  Tim One Mind siap membantu Anda dengan pertanyaan teknis, kendala akun, maupun kemitraan bisnis:
                </p>
                <div className="space-y-2 text-xs">
                  <div className={cn("p-3 rounded-xl border flex justify-between items-center", isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50")}>
                    <div>
                      <p className="font-semibold">Email Dukungan</p>
                      <p className="opacity-75">usick.artwork@gmail.com</p>
                    </div>
                    <a
                      href="mailto:usick.artwork@gmail.com"
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", isDark ? "bg-white text-black" : "bg-black text-white")}
                    >
                      Kirim Pesan
                    </a>
                  </div>
                  <div className={cn("p-3 rounded-xl border flex justify-between items-center", isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50")}>
                    <div>
                      <p className="font-semibold">Dukungan Komunitas</p>
                      <p className="opacity-75">Bantuan cepat via GitHub Issues</p>
                    </div>
                    <a
                      href="https://github.com/usickartwork/AI-PRIBADI/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1", isDark ? "bg-white text-black" : "bg-black text-white")}
                    >
                      <span>Buka</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "privacy" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-lg">Kebijakan Privasi</h3>
                </div>
                <div className={cn("text-xs leading-relaxed space-y-2.5 max-h-60 overflow-y-auto pr-1", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  <p>1. <strong>Tanpa Pelatihan Model:</strong> Seluruh percakapan, dokumen, dan instruksi Anda tidak pernah digunakan untuk melatih model AI publik.</p>
                  <p>2. <strong>Enkripsi End-to-End:</strong> Data sesi dan kredensial Anda dienkripsi penuh menggunakan standar AES-256 saat transit dan penyimpanan.</p>
                  <p>3. <strong>Hak Kendali Penuh:</strong> Anda dapat menghapus seluruh riwayat percakapan dan akun Anda kapan saja secara permanen langsung dari menu Pengaturan.</p>
                  <p>4. <strong>Kepatuhan:</strong> Kami mematuhi standar perlindungan data global untuk menjamin keamanan privasi Anda setiap saat.</p>
                </div>
              </div>
            )}

            {activeModal === "terms" && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Syarat & Ketentuan Penggunaan</h3>
                <div className={cn("text-xs leading-relaxed space-y-2.5 max-h-60 overflow-y-auto pr-1", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  <p>1. <strong>Penggunaan Layanan:</strong> Layanan One Mind disediakan untuk mendukung produktivitas, pembuatan kode, riset, dan kreativitas.</p>
                  <p>2. <strong>Tanggung Jawab Konten:</strong> Pengguna bertanggung jawab penuh atas instruksi yang diberikan dan penggunaan output hasil AI sesuai hukum yang berlaku.</p>
                  <p>3. <strong>Ketersediaan Model:</strong> Akses ke model AI pihak ketiga tunduk pada kuota dan ketersediaan provider resmi.</p>
                  <p>4. <strong>Kebijakan Pengembalian:</strong> Paket langganan dapat dikelola dan dibatalkan sewaktu-waktu melalui dasbor langganan.</p>
                </div>
              </div>
            )}

            {activeModal === "security" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-lg">Keamanan Tingkat Enterprise</h3>
                </div>
                <p className={cn("text-xs leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-600")}>
                  One Mind menerapkan standar keamanan tertinggi untuk melindungi ekosistem kecerdasan buatan Anda:
                </p>
                <div className={cn("space-y-2 text-xs", isDark ? "text-zinc-300" : "text-zinc-700")}>
                  <div className={cn("p-2.5 rounded-xl border flex items-center gap-2", isDark ? "border-zinc-800 bg-zinc-950/60" : "border-zinc-200 bg-zinc-50")}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Enkripsi TLS 1.3 pada setiap pertukaran data API</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border flex items-center gap-2", isDark ? "border-zinc-800 bg-zinc-950/60" : "border-zinc-200 bg-zinc-50")}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Autentikasi aman terverifikasi via Clerk & Supabase</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border flex items-center gap-2", isDark ? "border-zinc-800 bg-zinc-950/60" : "border-zinc-200 bg-zinc-50")}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Zero Data Retention pada API endpoint inferensi AI</span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "status" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <StatusDot tone="success" pulse={true} />
                    <h3 className="font-bold text-base">Status Sistem Operasional</h3>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                    99.98% Uptime
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { name: "Novita AI Inferensi", status: "Operasional Normal", latency: "120ms" },
                    { name: "Groq LPU Acceleration", status: "Operasional Normal", latency: "65ms" },
                    { name: "Claude Anthropic API", status: "Operasional Normal", latency: "210ms" },
                    { name: "Google Gemini Core", status: "Operasional Normal", latency: "150ms" },
                    { name: "OpenAI GPT Engine", status: "Operasional Normal", latency: "185ms" },
                    { name: "Database & Session Store", status: "Operasional Normal", latency: "18ms" },
                  ].map((service) => (
                    <div
                      key={service.name}
                      className={cn(
                        "p-2.5 rounded-xl border flex items-center justify-between",
                        isDark ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-zinc-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot tone="success" pulse={false} />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <span className={cn("text-[11px] font-mono", isDark ? "text-zinc-400" : "text-zinc-500")}>
                        {service.latency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
