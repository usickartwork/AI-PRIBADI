"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play, Pause, Disc3, Radio, Check } from "lucide-react";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

const SAMPLE_LYRICS = [
  { time: "00:12", text: "Gelombang suara mengalir tenang melintasi pikiran" },
  { time: "00:24", text: "Fokus terbentuk tanpa distraksi, ritme kerja menyatu" },
  { time: "00:38", text: "Setiap baris kode terangkai dalam hening yang harmonis" },
  { time: "00:52", text: "Denyut frekuensi menjaga ketenangan dan kejernihan ide" },
];

export default function MusicLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeLine, setActiveLine] = useState(1);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [imported, setImported] = useState(false);

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Auto-scroll lyrics simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveLine((prev) => (prev + 1) % SAMPLE_LYRICS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl) return;
    setImported(true);
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
            Musik Tanpa Iklan & Lirik Realtime.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Streaming audio berkualitas tinggi dengan lirik karaoke yang sinkron mengiringi fokus Anda.
          </p>
        </div>

        {/* Central Audio & Lyrics Showcase */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Spinning Vinyl Simulation */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="h-44 w-44 sm:h-52 sm:w-52 rounded-full border-2 border-zinc-800 bg-black flex items-center justify-center shadow-xl relative"
              >
                <div className="h-16 w-16 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center">
                  <span className="h-3 w-3 rounded-full bg-[#E1E0CC]" />
                </div>
              </motion.div>

              <div className="mt-6">
                <h4 className="font-semibold text-white text-sm">Deep Resonance (Focus Flow)</h4>
                <p className="text-xs text-zinc-500 mt-0.5">One Mind Ambient Labs</p>
              </div>

              {/* Minimal Player Control */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="mt-4 h-9 w-9 rounded-full bg-[#E1E0CC] hover:bg-white text-black flex items-center justify-center transition cursor-pointer"
                aria-label={isPlaying ? "Jeda" : "Putar"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
            </div>

            {/* Clean Synchronized Lyrics */}
            <div className="md:col-span-7 space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Lirik Sinkron
              </div>
              {SAMPLE_LYRICS.map((line, idx) => {
                const isCurrent = idx === activeLine;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveLine(idx)}
                    className={`transition-all duration-300 cursor-pointer text-sm sm:text-base leading-relaxed ${
                      isCurrent
                        ? "text-[#E1E0CC] font-semibold translate-x-1"
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>

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
