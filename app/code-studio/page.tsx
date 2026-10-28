"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Code2 } from "lucide-react";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

export default function CodeStudioLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-[#09090b] text-white selection:bg-white/20 antialiased font-sans">
      
      {/* Minimal Top Header (Clean Back Link Only) */}
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
            Sintesis Kode Otonom.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Dari dokumen arsitektur PRD hingga aplikasi multi-file dengan live preview dan ekspor ZIP.
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
                Tampilan Asli: Code Studio PRD Generator & Architecture
              </span>
            </div>
            <span className="text-[11px] text-[#E1E0CC] font-mono">PRD Blueprint View</span>
          </div>

          <div className="relative mt-3 rounded-xl overflow-hidden border border-white/10 bg-black aspect-[16/10] w-full">
            <Image
              src="/previews/preview-prd-generator.png"
              alt="Tampilan Antarmuka PRD Generator OneMind"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* 3 Simple Workflow Points (No cluttered cards) */}
        <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div>
            <span className="text-xs font-mono text-[#E1E0CC]">01</span>
            <h3 className="font-semibold text-white text-sm mt-1">Klarifikasi Kebutuhan</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              AI mengonfirmasi batasan teknis dan preferensi arsitektur Anda sebelum menulis kode.
            </p>
          </div>
          <div>
            <span className="text-xs font-mono text-[#E1E0CC]">02</span>
            <h3 className="font-semibold text-white text-sm mt-1">Spesifikasi Dokumen PRD</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Menyusun dokumen rekayasa perangkat lunak lengkap dengan skema data dan API.
            </p>
          </div>
          <div>
            <span className="text-xs font-mono text-[#E1E0CC]">03</span>
            <h3 className="font-semibold text-white text-sm mt-1">Sintesis Multi-File</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Menghasilkan berkas kode modular yang siap dijalankan dan diekspor ke ZIP.
            </p>
          </div>
        </div>

        {/* Clean Call To Action */}
        <div className="mt-16 text-center py-12 rounded-2xl bg-white/[0.02] border border-white/10">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Bangun Ide Anda Sekarang</h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
            Dapatkan 50 Code Credits gratis setiap hari untuk mewujudkan aplikasi nyata.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E1E0CC] hover:bg-white text-black font-semibold text-sm transition shadow-lg cursor-pointer"
            >
              <span>Mulai Buat Proyek</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </main>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum"
        subtitle="FAQ Code Studio"
        categories={{
          "code-studio": "Code Studio & PRD",
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
          onSuccess={() => {
            setShowAuthModal(false);
            window.location.href = "/";
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
