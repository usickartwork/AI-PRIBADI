"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music2,
  Disc3,
  Radio,
  ListMusic,
  ArrowRight,
  Headphones,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Share2,
  CheckCircle2,
  Sliders,
  Sparkles,
} from "lucide-react";
import { LandingNavbar } from "@/components/ui/landing-navbar";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

interface SongData {
  title: string;
  artist: string;
  duration: string;
  lyrics: { time: string; text: string }[];
}

const SAMPLE_TRACK: SongData = {
  title: "Deep Resonance (Focus Flow)",
  artist: "One Mind Ambient Labs",
  duration: "03:42",
  lyrics: [
    { time: "00:12", text: "Gelombang suara mengalir tenang melintasi pikiran" },
    { time: "00:24", text: "Fokus terbentuk tanpa distraksi, ritme kerja menyatu" },
    { time: "00:38", text: "Setiap baris kode terangkai dalam hening yang harmonis" },
    { time: "00:52", text: "Denyut frekuensi menjaga ketenangan dan kejernihan ide" },
    { time: "01:05", text: "Terus melangkah, tanpa interupsi, murni produktivitas" },
  ],
};

export default function MusicLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  
  // Audio Player State Simulation
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState(1);
  const [importUrl, setImportUrl] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success">("idle");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Synchronized Lyrics auto-scroll simulation when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentLineIndex((prev) => (prev + 1) % SAMPLE_TRACK.lyrics.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleImportPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setImportStatus("loading");
    setTimeout(() => {
      setImportStatus("success");
    }, 900);
  };

  const musicPillars = [
    {
      icon: Disc3,
      title: "Streaming Tanpa Iklan",
      desc: "Nikmati jutaan trek beresolusi tinggi tanpa interupsi jeda iklan yang merusak alur fokus.",
    },
    {
      icon: Radio,
      title: "Lirik Karaoke Sinkron",
      desc: "Engine lirik dinamis menyinkronkan teks baris demi baris secara otomatis mengikuti irama lagu.",
    },
    {
      icon: ListMusic,
      title: "Music Connect",
      desc: "Impor daftar putar Spotify atau Apple Music Anda dalam hitungan detik via tempel tautan.",
    },
    {
      icon: Headphones,
      title: "Background Floating Player",
      desc: "Audio tetap berputar tanpa henti saat Anda berpindah tab ke AI Chat atau Code Studio.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white selection:bg-white/20 overflow-x-hidden">
      {/* Top Navbar */}
      <LandingNavbar onGetStarted={openAuth} isDark={true} />

      {/* Main Music Player Interface - Direct & To the Point */}
      <main className="pt-28 pb-16 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#E1E0CC]">
              <span className="h-2 w-2 rounded-full bg-[#E1E0CC] animate-pulse" />
              <span>Music One & Dynamic Lyrics Engine</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-2">
              Streaming Audio Tanpa Iklan & Lirik Sinkron Realtime.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-[#E1E0CC]" />
                  <span>Jeda Audio</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-[#E1E0CC]" />
                  <span>Putar Audio</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E1E0CC] hover:bg-white text-black text-xs font-bold transition-all shadow-lg cursor-pointer"
            >
              <span>Buka Pemutar Penuh</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ----------------- INTERACTIVE PLAYER & LIVE LYRICS CANVAS ----------------- */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950/80 p-5 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Vinyl & Audio Equalizer Spectrum */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-4">
              
              {/* Spinning Vinyl Simulation */}
              <div className="relative mb-6">
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                  className="h-44 w-44 sm:h-56 sm:w-56 rounded-full border-4 border-zinc-800 bg-gradient-to-tr from-zinc-900 via-black to-zinc-900 flex items-center justify-center shadow-2xl relative"
                >
                  {/* Subtle Vinyl Grooves */}
                  <div className="absolute inset-4 rounded-full border border-white/5" />
                  <div className="absolute inset-8 rounded-full border border-white/5" />
                  <div className="absolute inset-12 rounded-full border border-white/5" />
                  
                  {/* Center Label */}
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-white/20 bg-zinc-950 flex flex-col items-center justify-center">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#E1E0CC] shadow-xs" />
                  </div>
                </motion.div>

                {/* Status Badge */}
                <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-white/10 text-[#E1E0CC] border border-white/15 backdrop-blur-md">
                    {isPlaying ? "PLAYING • 320 KBPS FLAC" : "PAUSED"}
                  </span>
                </div>
              </div>

              {/* Track Title & Artist */}
              <div className="mt-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {SAMPLE_TRACK.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  {SAMPLE_TRACK.artist}
                </p>
              </div>

              {/* Dynamic Animated Frequency Spectrum Waves (Framer Motion) */}
              <div className="flex items-end justify-center gap-1.5 h-10 mt-6 w-full max-w-[240px]">
                {[24, 48, 80, 36, 92, 60, 44, 78, 96, 52, 68, 30, 85, 40].map((baseHeight, idx) => (
                  <motion.div
                    key={idx}
                    animate={
                      isPlaying
                        ? {
                            height: [`${baseHeight * 0.3}%`, `${baseHeight}%`, `${baseHeight * 0.4}%`],
                          }
                        : { height: "15%" }
                    }
                    transition={{
                      duration: 0.8 + (idx % 4) * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1.5 rounded-full bg-[#E1E0CC]/80"
                  />
                ))}
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentLineIndex((prev) => (prev - 1 + SAMPLE_TRACK.lyrics.length) % SAMPLE_TRACK.lyrics.length)}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  aria-label="Previous"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-10 w-10 rounded-full bg-[#E1E0CC] hover:bg-white text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLineIndex((prev) => (prev + 1) % SAMPLE_TRACK.lyrics.length)}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  aria-label="Next"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

            </div>

            {/* Right: Live Synchronized Karaoke Lyrics Stream */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-white/10 bg-black/60 p-6 sm:p-8 min-h-[360px]">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6 text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-2 text-[#E1E0CC]">
                    <Radio className="h-3.5 w-3.5" />
                    <span>Dynamic Synchronized Lyrics Engine</span>
                  </span>
                  <span>Auto-Scroll Active</span>
                </div>

                {/* Lyrics Line Stacks with dynamic focus */}
                <div className="space-y-4">
                  {SAMPLE_TRACK.lyrics.map((line, idx) => {
                    const isCurrent = idx === currentLineIndex;
                    return (
                      <motion.div
                        key={idx}
                        animate={{
                          opacity: isCurrent ? 1 : 0.35,
                          scale: isCurrent ? 1.02 : 0.98,
                        }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setCurrentLineIndex(idx)}
                        className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? "bg-white/[0.06] border border-[#E1E0CC]/40 text-[#E1E0CC]"
                            : "hover:bg-white/[0.02] text-zinc-400"
                        }`}
                      >
                        <span className="text-sm sm:text-base font-semibold leading-relaxed tracking-tight">
                          {line.text}
                        </span>
                        <span className="text-xs font-mono text-zinc-500 shrink-0 ml-4">
                          {line.time}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Connect Info */}
              <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-zinc-500 font-mono">
                  Lirik sinkron otomatis untuk jutaan lagu global
                </span>
                <span className="text-[#E1E0CC] font-mono">Zero Audio Latency</span>
              </div>
            </div>

          </div>
        </div>

        {/* ----------------- MUSIC CONNECT (SPOTIFY & APPLE MUSIC) ----------------- */}
        <div className="mt-16 rounded-3xl border border-white/15 bg-zinc-950/60 p-6 sm:p-10 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div className="md:col-span-6">
              <span className="text-xs uppercase font-mono text-[#E1E0CC] tracking-wider">
                Music Connect
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Impor Playlist Favorit Anda Dalam Sekejap
              </h2>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                Sudah memiliki daftar putar di Spotify atau Apple Music? Cukup salin dan tempelkan tautan playlist untuk menikmati pemutaran langsung tanpa iklan di One Mind.
              </p>
            </div>

            <div className="md:col-span-6">
              <form onSubmit={handleImportPlaylist} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="w-full px-4 py-3 rounded-2xl bg-black border border-white/15 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E1E0CC] transition font-mono"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-[#E1E0CC] hover:bg-white text-black font-bold text-xs transition cursor-pointer"
                  >
                    {importStatus === "loading" ? "Memeriksa..." : "Impor"}
                  </button>
                </div>

                {importStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-mono flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#E1E0CC]" />
                      <span>Playlist Terdeteksi: 24 Lagu Siap Streaming</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => openAuth("signup")}
                      className="text-[#E1E0CC] underline cursor-pointer hover:text-white"
                    >
                      Buka di Player
                    </button>
                  </motion.div>
                )}
              </form>
            </div>

          </div>
        </div>

        {/* Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {musicPillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between hover:border-white/20 transition-all"
              >
                <div>
                  <Icon className="h-5 w-5 text-[#E1E0CC] mb-3" />
                  <h3 className="font-bold text-sm sm:text-base text-white">{p.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum Music"
        subtitle="FAQ Seputar Streaming & Music Connect"
        categories={{
          "music": "Music & Connect",
          "pricing": "Paket & Kredit",
          "security": "Keamanan & Privasi",
        }}
        faqData={ONE_MIND_FAQ_DATA}
      />

      {/* Direct Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Mulai Dengarkan Tanpa Gangguan</h2>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
          Tersedia streaming musik penuh di seluruh perangkat Anda dengan paket Pro.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E1E0CC] text-black font-bold text-sm hover:bg-white transition-all shadow-xl cursor-pointer"
          >
            <span>Buka Music Player Sekarang</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
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
