"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

export default function MusicLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [imported, setImported] = useState(false);

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl) return;
    setImported(true);
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
            Musik Tanpa Iklan & Lirik Realtime.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Streaming audio berkualitas tinggi dengan lirik karaoke yang sinkron mengiringi fokus Anda.
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
                Tampilan Asli: Music One & Dynamic Lyrics
              </span>
            </div>
            <span className="text-[11px] text-[#E1E0CC] font-mono">Hi-Res Player View</span>
          </div>

          <div className="relative mt-3 rounded-xl overflow-hidden border border-white/10 bg-black aspect-[16/10] w-full">
            <Image
              src="/previews/preview-music.png"
              alt="Tampilan Antarmuka Music One"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* Music Connect (Import Playlist) */}
        <div className="mt-16 pt-12 border-t border-white/10">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-semibold text-white text-base">Impor Playlist Spotify / Apple Music</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Tempelkan tautan playlist untuk mendengarkan langsung di One Mind.
            </p>

            <form onSubmit={handleImport} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#E1E0CC] hover:bg-white text-black text-xs font-semibold transition cursor-pointer shrink-0"
              >
                Impor
              </button>
            </form>

            {imported && (
              <p className="text-xs text-[#E1E0CC] mt-2 flex items-center justify-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                <span>Playlist terdeteksi, siap diputar di akun Anda.</span>
              </p>
            )}
          </div>
        </div>

        {/* Clean Call To Action */}
        <div className="mt-16 text-center py-12 rounded-2xl bg-white/[0.02] border border-white/10">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Dengarkan Tanpa Gangguan</h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
            Akses pemutar musik penuh di latar belakang dengan paket Pro.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E1E0CC] hover:bg-white text-black font-semibold text-sm transition shadow-lg cursor-pointer"
            >
              <span>Buka Pemutar Musik</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </main>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum"
        subtitle="FAQ Music One"
        categories={{
          "music": "Music & Connect",
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
