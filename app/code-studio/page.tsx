"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Smartphone, Monitor, Download, Code2, FileCode } from "lucide-react";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

export default function CodeStudioLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [viewport, setViewport] = useState<"mobile" | "desktop">("desktop");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white selection:bg-white/20 antialiased font-sans">
      
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

        {/* Central Workspace Simulator */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <Code2 className="h-4 w-4 text-[#E1E0CC]" />
              <span className="font-medium text-white">workspace.onemind.app</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer ${
                  viewport === "mobile"
                    ? "bg-white text-black font-semibold"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone className="h-3 w-3" />
                <span>Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer ${
                  viewport === "desktop"
                    ? "bg-white text-black font-semibold"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <Monitor className="h-3 w-3" />
                <span>Desktop</span>
              </button>
            </div>
          </div>

          {/* Code Studio Mockup Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 items-center">
            
            {/* Minimal File List */}
            <div className="md:col-span-4 space-y-2 text-xs text-zinc-400 border-r border-white/10 pr-4 hidden md:block">
              <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Berkas Proyek
              </div>
              <div className="flex items-center gap-2 text-white font-medium bg-white/5 px-2.5 py-1.5 rounded-lg">
                <FileCode className="h-3.5 w-3.5 text-[#E1E0CC]" />
                <span>App.tsx</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                <span>components/TaskCard.tsx</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                <span>hooks/useTaskStore.ts</span>
              </div>
            </div>

            {/* Live Interactive Preview Screen */}
            <div className="md:col-span-8 flex justify-center">
              <div
                className={`w-full rounded-xl bg-black border border-white/10 p-5 transition-all duration-300 min-h-[220px] flex flex-col justify-between ${
                  viewport === "mobile" ? "max-w-[300px]" : "max-w-full"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                    <span>Live Preview</span>
                    <span className="text-[#E1E0CC]">Compiled</span>
                  </div>
                  <h4 className="font-semibold text-white text-base">Aplikasi Kanban Siap Pakai</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Komponen UI responsif, state management, dan handler data telah selesai disintesis.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-6">
                  <span className="text-xs text-zinc-500">ZIP Export</span>
                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E1E0CC] hover:bg-white text-black text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh Kode</span>
                  </button>
                </div>
              </div>
            </div>

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
          onSuccess={() => setShowAuthModal(false)}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
