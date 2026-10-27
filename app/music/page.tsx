"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Music2,
  Disc3,
  Radio,
  ListMusic,
  Share2,
  Sparkles,
  ArrowRight,
  Headphones,
  Sliders,
  Volume2,
} from "lucide-react";
import { LandingNavbar } from "@/components/ui/landing-navbar";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

export default function MusicLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const musicPillars = [
    {
      icon: Disc3,
      title: "Streaming Tanpa Iklan",
      desc: "Nikmati jutaan lagu beresolusi tinggi tanpa interupsi jeda iklan yang mengganggu alur fokus kerja Anda.",
    },
    {
      icon: Radio,
      title: "Lirik Karaoke Sinkron Realtime",
      desc: "Engine lirik dinamis One Mind menyinkronkan teks lirik baris demi baris secara presisi mengikuti ketukan musik.",
    },
    {
      icon: ListMusic,
      title: "Music Connect (Spotify & Apple Music)",
      desc: "Impor seluruh daftar putar (playlist) favorit Anda dari Spotify atau Apple Music hanya dengan menempelkan tautan link.",
    },
    {
      icon: Headphones,
      title: "Pemutar Melayang di Latar Belakang",
      desc: "Musik tetap berputar mulus tanpa henti saat Anda berpindah tab ke AI Chat, Code Studio, Catatan, atau Jadwal.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white selection:bg-white/20 overflow-x-hidden">
      {/* Top Navbar */}
      <LandingNavbar onGetStarted={openAuth} isDark={true} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 sm:px-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-[#E1E0CC] text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <Music2 className="h-3.5 w-3.5 text-purple-400" />
          Music One & Music Connect
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          Fokus Bekerja Dengan Irama. <br />
          <span className="bg-gradient-to-r from-white via-[#E1E0CC] to-purple-400 bg-clip-text text-transparent">
            Streaming Musik & Lirik Realtime.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Dengarkan musik tanpa jeda iklan, impor playlist Spotify atau Apple Music Anda dalam sekejap, dan nikmati sinkronisasi lirik dinamis yang menemani sesi produktivitas Anda.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E1E0CC] text-black font-bold text-sm sm:text-base hover:bg-white transition-all shadow-xl hover:scale-105 cursor-pointer"
          >
            <span>Dengarkan Musik Sekarang</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/harga"
            className="px-6 py-3.5 rounded-full border border-white/15 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 font-semibold text-sm sm:text-base transition-colors"
          >
            Lihat Paket Pro
          </Link>
        </motion.div>
      </section>

      {/* Infografis 1: Vinyl Disc & Realtime Lyrics Simulator */}
      <section className="py-16 px-6 sm:px-10 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-zinc-950/70 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Spinning Vinyl Simulation */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="h-44 w-44 sm:h-56 sm:w-56 rounded-full border-4 border-zinc-800 bg-gradient-to-tr from-zinc-900 via-black to-zinc-900 flex items-center justify-center shadow-2xl relative"
                >
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-white/20 bg-zinc-900 flex items-center justify-center">
                    <span className="h-4 w-4 rounded-full bg-purple-500 shadow-md shadow-purple-500/50" />
                  </div>
                </motion.div>
                <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md">
                    NOW PLAYING • 320 KBPS
                  </span>
                </div>
              </div>
            </div>

            {/* Synchronized Lyrics Mockup */}
            <div className="md:col-span-7 flex flex-col justify-center space-y-3 font-medium">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E1E0CC] mb-2 block">
                ENGINE SINKRONISASI LIRIK DINAMIS
              </span>
              <p className="text-zinc-600 text-sm transition-colors">
                [01:14] Menatap malam yang hening tanpa batas...
              </p>
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/20 text-white font-bold text-base sm:text-lg shadow-sm">
                [01:18] Bersama melodi menciptakan masa depan baru
              </div>
              <p className="text-zinc-500 text-sm transition-colors">
                [01:23] Irama tak henti menuntun langkah kreasi...
              </p>
              <p className="text-zinc-600 text-xs transition-colors">
                [01:28] One Mind, satu kesadaran dalam harmoni.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Infografis 2: 4 Fitur Unggulan Music One */}
      <section className="py-16 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-semibold text-[#E1E0CC] tracking-widest">
            KEUNGGULAN MUSIC WORKSPACE
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
            Dirancang Khusus untuk Kreator & Developer
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {musicPillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between hover:border-white/25 transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#E1E0CC] mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">{p.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Spotify & Apple Music Connect Infographic */}
      <section className="py-16 px-6 sm:px-10 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] to-transparent p-8 sm:p-12">
          <Share2 className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Music Connect 1-Klik</h2>
          <p className="mt-3 text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Punya playlist favorit di Spotify atau Apple Music? Cukup tempelkan tautan link playlist Anda, dan One Mind akan mengimpor seluruh track secara otomatis.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Coba Music Connect
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum Music One"
        subtitle="FAQ Seputar Fitur Musik & Import Playlist"
        categories={{
          "music": "Music & Connect",
          "pricing": "Paket & Akses",
          "security": "Keamanan & Hak Cipta",
        }}
        faqData={ONE_MIND_FAQ_DATA}
      />

      {/* Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Mulai Dengarkan Musik Sekarang</h2>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
          Tingkatkan produktivitas kerja harian Anda dengan streaming musik berkualitas tinggi.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E1E0CC] text-black font-bold text-sm hover:bg-white transition-all shadow-xl cursor-pointer"
          >
            <span>Masuk & Dengarkan Musik</span>
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
