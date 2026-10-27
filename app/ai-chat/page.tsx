"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, Sparkles, Check } from "lucide-react";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

interface ModelPreset {
  id: string;
  name: string;
  provider: string;
  desc: string;
  samplePrompt: string;
  sampleResponse: string;
}

const PRESET_MODELS: ModelPreset[] = [
  {
    id: "claude",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    desc: "Pemikiran mendalam dan penulisan kode terstruktur tingkat industri.",
    samplePrompt: "Bagaimana merancang arsitektur caching multi-tier yang aman?",
    sampleResponse:
      "Gunakan Two-Tier Pattern: L1 in-memory lokal (latensi < 1ms) untuk data yang sering diakses, dipadukan dengan L2 Redis Cluster sebagai distributed cache bersama dengan event invalidation via Pub/Sub.",
  },
  {
    id: "gemini",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    desc: "Kecepatan tinggi dengan jendela konteks raksasa untuk pemrosesan dokumen.",
    samplePrompt: "Ringkas poin utama strategi migrasi database zero-downtime.",
    sampleResponse:
      "Terapkan strategi Expand and Contract: 1) Tambahkan kolom baru tanpa menghapus yang lama, 2) Tulis data ke kedua kolom (dual-writing), 3) Backfill data lama, 4) Alihkan bacaan ke kolom baru, 5) Hapus kolom lama.",
  },
  {
    id: "deepseek",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    desc: "Penalaran matematika, logika eksak, dan verifikasi algoritma mutakhir.",
    samplePrompt: "Berapa kompleksitas waktu algoritma divide-and-conquer pada mergesort?",
    sampleResponse:
      "Mergesort memiliki kompleksitas waktu O(n log n) di semua kasus (best, average, dan worst). Relasi rekurensi T(n) = 2T(n/2) + O(n) diselesaikan menggunakan Master Theorem Kasus 2.",
  },
];

export default function AIChatLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-[#09090b] text-white selection:bg-white/20 antialiased font-sans">
      
      {/* Minimal Top Header with clean Back link only (No floating navbar pill) */}
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
        <button
          type="button"
          onClick={() => openAuth("signin")}
          className="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        
        {/* Simple & Clean Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Kecerdasan Jamak dalam Satu Ruang.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Beralih bebas antara Claude, Gemini, GPT, dan DeepSeek tanpa berganti langganan.
          </p>
        </div>

        {/* Real Screenshot Preview Frame */}
        <div className="rounded-2xl border border-white/15 bg-zinc-950 p-3 sm:p-5 shadow-2xl overflow-hidden mb-12">
          <div className="flex items-center justify-between pb-3 px-2 border-b border-white/10 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="ml-2 font-mono text-[11px] text-zinc-500">
                Tampilan Asli AI Chat Workspace
              </span>
            </div>
            <span className="text-[11px] text-[#E1E0CC] font-mono">Claude 3.7 • Gemini 2.5 • DeepSeek R1</span>
          </div>

          <div className="relative mt-3 rounded-xl overflow-hidden border border-white/10 bg-black aspect-[16/10] w-full">
            <Image
              src="/previews/preview-ai-chat.png"
              alt="Tampilan Antarmuka AI Chat One Mind"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* Clean Model List (Minimal, no cluttered cards) */}
        <div className="mt-16 pt-12 border-t border-white/10">
          <h2 className="text-lg font-bold text-white mb-6">Model yang Didukung</h2>
          <div className="space-y-4">
            {PRESET_MODELS.map((m) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-white/5"
              >
                <div>
                  <span className="font-semibold text-white text-sm">{m.name}</span>
                  <span className="text-xs text-zinc-500 ml-2">({m.provider})</span>
                  <p className="text-xs text-zinc-400 mt-0.5">{m.desc}</p>
                </div>
                <div className="text-xs text-[#E1E0CC] shrink-0 font-medium">Tersedia</div>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Call To Action */}
        <div className="mt-16 text-center py-12 rounded-2xl bg-white/[0.02] border border-white/10">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Mulai Chat Gratis Sekarang</h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
            10.000 AI Credits gratis setiap hari untuk seluruh pengguna.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E1E0CC] hover:bg-white text-black font-semibold text-sm transition shadow-lg cursor-pointer"
            >
              <span>Daftar Gratis</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </main>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum"
        subtitle="FAQ AI Chat"
        categories={{
          "ai-chat": "AI & Model",
          "pricing": "Paket & Kredit",
        }}
        faqData={ONE_MIND_FAQ_DATA}
        className="max-w-4xl mx-auto"
      />

      {/* Clean Footer */}
      <Footer01 isDark={true} onGetStarted={openAuth} />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isDark={true}
          initialMode={authMode}
          onSuccess={() => setShowAuthModal(false)}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
