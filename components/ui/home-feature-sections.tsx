"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

interface HomeFeatureSectionsProps {
  onGetStarted?: (mode?: "signin" | "signup") => void;
  onOpenPricing?: () => void;
  isDark?: boolean;
}

interface FeatureSectionItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  highlights: string[];
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  urlPath: string;
  reverse?: boolean;
}

const FEATURE_ITEMS: FeatureSectionItem[] = [
  {
    id: "card-chat",
    category: "AI Chat",
    title: "Ruang Percakapan Cerdas & Penelusuran Web",
    subtitle:
      "Berinteraksi langsung dengan asisten pintar bertenaga mesin Usick One untuk menganalisis data, merangkai ide, hingga menelusuri web secara realtime.",
    highlights: [
      "Mesin percakapan cerdas Usick One yang responsif dan terarah",
      "Mode Browse untuk pencarian dan verifikasi fakta web langsung",
      "Dukungan input suara dan audio interaktif realtime",
      "Terintegrasi otomatis dengan riwayat sesi dan catatan pribadi",
    ],
    imageSrc: "/showcase/ai-chat.png",
    imageWidth: 1024,
    imageHeight: 589,
    urlPath: "onemind.web.id/workspace/chat",
    reverse: false, // Image Left, Text Right
  },
  {
    id: "card-code",
    category: "One Code",
    title: "Rancang Ide Aplikasi & Dokumen PRD Lengkap",
    subtitle:
      "Transformasikan ide kasar menjadi dokumen spesifikasi produk (PRD) yang matang, arsitektur modul, hingga rekomendasi alur aplikasi siap bangun.",
    highlights: [
      "Wawancara kebutuhan cerdas untuk membedah konsep aplikasi",
      "Template starter: Katalog Busana, E-Commerce, LMS, hingga SaaS",
      "Penyusunan arsitektur sistem dan flow pengguna terstruktur",
      "Ekspor dokumen spesifikasi teknis dan panduan implementasi",
    ],
    imageSrc: "/showcase/one-code.png",
    imageWidth: 1024,
    imageHeight: 593,
    urlPath: "onemind.web.id/workspace/code",
    reverse: true, // Text Left, Image Right
  },
  {
    id: "card-music",
    category: "Music One",
    title: "Streaming Musik & Lirik Berjalan Realtime",
    subtitle:
      "Fokus bekerja ditemani pemutar musik audio jernih tanpa jeda iklan, dilengkapi lirik karaoke sinkron dan stasiun siaran radio populer 24/7 LIVE.",
    highlights: [
      "Pemutar audio resolusi tinggi yang ringan dan bebas distraksi",
      "Tampilan lirik realtime yang sinkron mengikuti alunan nada",
      "Saluran siaran radio 24/7 LIVE: Top Hits, Chill Beats, dan Deep Work",
      "Koleksi playlist rekomendasi cerdas yang dapat disesuaikan",
    ],
    imageSrc: "/showcase/music-one.png",
    imageWidth: 1024,
    imageHeight: 591,
    urlPath: "onemind.web.id/workspace/music",
    reverse: false, // Image Left, Text Right
  },
  {
    id: "card-schedule",
    category: "Smart Schedule",
    title: "Manajemen Jadwal & Asisten Produktivitas",
    subtitle:
      "Kelola kalender kerja, blok waktu fokus, dan tenggat waktu tugas harian secara otomatis lewat perintah bahasa alami bersama Schedule Assistant.",
    highlights: [
      "Perintah jadwal cerdas: tambahkan agenda hanya dengan mengetik perintah",
      "Blok waktu deep work terproteksi untuk konsentrasi tanpa interupsi",
      "Sinkronisasi agenda harian dengan kalender digital Anda",
      "Pengingat otomatis untuk memastikan tidak ada milestone terlewat",
    ],
    imageSrc: "/showcase/schedule.png",
    imageWidth: 1024,
    imageHeight: 592,
    urlPath: "onemind.web.id/workspace/schedule",
    reverse: true, // Text Left, Image Right
  },
  {
    id: "card-image",
    category: "One Image",
    title: "Studio Generasi Visual Rasio Fleksibel",
    subtitle:
      "Wujudkan imajinasi visual Anda dalam hitungan detik dengan kebebasan memilih rasio aspek kustom dan preset gaya artistik yang memukau.",
    highlights: [
      "Dukungan format rasio lengkap: 1:1 Persegi, 16:9 Lanskap, 9:16 Potret, 4:3 Klasik",
      "Koleksi preset estetika: Origami 3D, Sommelier Warm Film, Pin, hingga Fotorealistis",
      "Render visual tajam beresolusi tinggi langsung dari deskripsi teks",
      "Galeri tersimpan rapi untuk kebutuhan materi kreatif dan presentasi",
    ],
    imageSrc: "/showcase/one-image.png",
    imageWidth: 1024,
    imageHeight: 591,
    urlPath: "onemind.web.id/workspace/image",
    reverse: false, // Image Left, Text Right
  },
  {
    id: "card-faith",
    category: "Faith Hub",
    title: "Ruang Hening & Perenungan Pribadi",
    subtitle:
      "Ruang kontemplatif yang tenang dan menyejukkan untuk mencurahkan isi hati, membaca renungan, membagikan pergumulan, dan memanjatkan rasa syukur.",
    highlights: [
      "Ruang pribadi yang aman, damai, dan bebas dari penghakiman",
      "Panduan topik refleksi: kedamaian batin, mengatasi cemas, dan relasi",
      "Dukungan pencatatan doa pribadi dan ucapan syukur hari ini",
      "Ayat-ayat perenungan yang menguatkan untuk menemani hari Anda",
    ],
    imageSrc: "/showcase/faith-hub.png",
    imageWidth: 1024,
    imageHeight: 587,
    urlPath: "onemind.web.id/workspace/faith",
    reverse: true, // Text Left, Image Right
  },
];

export function HomeFeatureSections({
  onGetStarted,
  onOpenPricing,
  isDark = true,
}: HomeFeatureSectionsProps) {
  const handleAction = () => {
    onGetStarted?.("signup");
  };

  return (
    <section className="relative w-full py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-x-clip">
      {/* ─── SECTION HEADER (Bidirectional In/Out Animation) ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-2xl mx-auto mb-16 sm:mb-24"
      >
        <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          Eksplorasi Fitur
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1.5 leading-tight">
          Satu Platform, Seluruh Kemampuan.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Setiap modul terintegrasi secara harmonis di dalam satu ruang kerja One Mind.
        </p>
      </motion.div>

      {/* ─── ZIGZAG ALTERNATING FEATURE SECTIONS ────────────────────────────── */}
      <div className="space-y-24 sm:space-y-36">
        {FEATURE_ITEMS.map((item, index) => {
          const isReverse = item.reverse;

          // IMAGE COMPONENT
          const imageElement = (
            <div
              onClick={handleAction}
              className="group relative w-full rounded-2xl sm:rounded-3xl bg-zinc-950/80 backdrop-blur-md p-2 sm:p-3 shadow-2xl transition-all cursor-pointer overflow-hidden border border-white/10"
            >
              {/* Subtle Window Top Bar (Borderless) */}
              <div className="flex items-center justify-between pb-2 px-2 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500/80" />
                  <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
                  <span className="h-2 w-2 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-mono text-[10px] text-zinc-500 hidden sm:inline">
                    {item.urlPath}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Live Workspace</span>
              </div>

              {/* Full, Uncut Screenshot Display */}
              <div className="relative mt-1 w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <Image
                  src={item.imageSrc}
                  alt={item.title}
                  width={item.imageWidth}
                  height={item.imageHeight}
                  className="w-full h-auto object-contain block select-none group-hover:scale-[1.01] transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  priority={index === 0}
                />
              </div>
            </div>
          );

          // DETAIL TEXT COMPONENT
          const textElement = (
            <div>
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                {item.category}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 leading-snug">
                {item.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
                {item.subtitle}
              </p>

              {/* Bullet Highlights from the Real Product */}
              <ul className="mt-6 space-y-3 text-xs sm:text-sm text-zinc-300">
                {item.highlights.map((highlight, hIdx) => (
                  <li key={hIdx} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white mt-0.5">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="leading-snug">{highlight}</span>
                  </li>
                ))}
              </ul>

              {/* Action CTA */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleAction}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-all cursor-pointer group"
                >
                  <span>Coba {item.category}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );

          return (
            <div
              key={item.id}
              id={item.id}
              className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center"
            >
              {/* If NOT reverse: Image is LEFT (slides from/to left), Text is RIGHT (slides from/to right) */}
              {!isReverse ? (
                <>
                  {/* LEFT COLUMN: IMAGE (animates in from left, out to left) */}
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    className="col-span-1 lg:col-span-7 order-1"
                  >
                    {imageElement}
                  </motion.div>

                  {/* RIGHT COLUMN: TEXT (animates in from right, out to right) */}
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    className="col-span-1 lg:col-span-5 order-2"
                  >
                    {textElement}
                  </motion.div>
                </>
              ) : (
                <>
                  {/* LEFT COLUMN: TEXT (animates in from left, out to left) */}
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    className="col-span-1 lg:col-span-5 order-2 lg:order-1"
                  >
                    {textElement}
                  </motion.div>

                  {/* RIGHT COLUMN: IMAGE (animates in from right, out to right) */}
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    className="col-span-1 lg:col-span-7 order-1 lg:order-2"
                  >
                    {imageElement}
                  </motion.div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
export default HomeFeatureSections;
