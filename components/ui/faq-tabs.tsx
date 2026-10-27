"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItemData {
  question: string;
  answer: string;
}

export interface FAQProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  categories?: Record<string, string>;
  faqData?: Record<string, FAQItemData[]>;
  className?: string;
}

export const ONE_MIND_FAQ_CATEGORIES: Record<string, string> = {
  "ai-chat": "AI & Voice Assistant",
  "code-studio": "Code Studio & PRD",
  "music": "Music & Connect",
  "pricing": "Paket & Kredit",
  "security": "Keamanan & Privasi",
};

export const ONE_MIND_FAQ_DATA: Record<string, FAQItemData[]> = {
  "ai-chat": [
    {
      question: "Apa saja model AI yang tersedia di ekosistem One Mind?",
      answer:
        "One Mind mengintegrasikan model-model AI terbaik dunia dalam satu workspace: Claude 3.7 Sonnet & 3.5 Sonnet (Anthropic), Gemini 3.6 Flash & 3.5 Flash Lite (Google), DeepSeek R1 Distill & DeepSeek V4, Qwen 3.8 Flash, Kimi K2 Instruct (Moonshot), Ling 3.1 Flash, Llama 3.3 70B, GPT OSS 120B, serta model unggulan utama Usick One Flagship.",
    },
    {
      question: "Bagaimana cara kerja Upaya Penalaran (Reasoning Efforts)?",
      answer:
        "One Mind menyediakan 3 mode penalaran adaptif: 'Faster' untuk jawaban kilat dan percakapan harian, 'Balanced' untuk sintesis analitis seimbang, dan 'Mode Max' untuk riset mendalam, pemecahan masalah logika kompleks, serta perancangan arsitektur kode tingkat lanjut.",
    },
    {
      question: "Apakah Voice Assistant Realtime mendukung Bahasa Indonesia?",
      answer:
        "Ya, 100%! Voice Assistant One Mind mendukung Bahasa Indonesia dan Inggris secara fasih dan natural dengan latensi sangat rendah, dilengkapi visualisasi orb suara dinamis dan kemampuan pemanggilan tool otomatis.",
    },
    {
      question: "Apakah percakapan saya digunakan untuk melatih model AI publik?",
      answer:
        "Sama sekali tidak. One Mind menjunjung tinggi privasi pengguna. Semua interaksi diproses melalui API enterprise privat terenkripsi tanpa izin pelatihan (zero-data retention training) dari penyedia model manapun.",
    },
  ],
  "code-studio": [
    {
      question: "Apa keunggulan One Mind Code Studio dibanding AI coding biasa?",
      answer:
        "Code Studio bukan sekadar alat pelengkap kode, melainkan sistem sintesis 4-tahap otonom: dimulai dari wawancara interaktif (AI Grill-Me), pembuatan dokumen spesifikasi produk (PRD) komprehensif, pembuatan proyek multi-file utuh, hingga Live Preview Canvas interaktif yang bisa langsung dijalankan dan diekspor.",
    },
    {
      question: "Apakah saya bisa mengekspor kode yang telah dibuat?",
      answer:
        "Tentu saja. Anda dapat mengekspor seluruh kode sumber dalam bentuk file ZIP siap pakai, menyalin struktur file proyek, atau langsung menghubungkannya ke repositori GitHub untuk deployment instan.",
    },
    {
      question: "Bahasa pemrograman dan framework apa saja yang didukung?",
      answer:
        "Code Studio dioptimalkan untuk ekosistem modern: React, Next.js, TypeScript, Tailwind CSS, Node.js, Python, HTML5 Canvas, dan komponen UI modern seperti shadcn/ui dan Framer Motion.",
    },
  ],
  "music": [
    {
      question: "Apa itu fitur Music One dan Music Connect?",
      answer:
        "Music One adalah pemutar musik streaming berkualitas tinggi yang terintegrasi langsung di dalam workspace Anda tanpa jeda iklan. Fitur Music Connect memungkinkan Anda mengimpor daftar putar (playlist) favorit langsung dari Spotify atau Apple Music hanya dengan menempelkan link.",
    },
    {
      question: "Apakah lirik lagu tersinkronisasi secara realtime?",
      answer:
        "Ya, One Mind memiliki engine dynamic lyrics karaoke yang menyinkronkan teks lirik baris demi baris secara otomatis mengikuti ketukan lagu yang sedang diputar.",
    },
    {
      question: "Apakah pemutaran musik tetap berjalan saat saya beralih tab lain?",
      answer:
        "Pasti. Pemutar audio dirancang melayang secara non-intrusif dan terus berjalan di latar belakang saat Anda mengobrol dengan AI, menulis kode di Code Studio, atau mengelola jadwal.",
    },
  ],
  "pricing": [
    {
      question: "Apa perbedaan antara Paket Free dan Paket Pro?",
      answer:
        "Paket Free memberi Anda 10.000 AI Credits/hari, 50 Code Credits/hari, model Usick One Flagship, Voice Assistant, dan Catatan Pintar. Paket Pro seharga Rp49.000/bulan memberikan 100.000 AI Credits/hari, 200 Code Credits/hari, akses penuh ke SEMUA model eksternal (Claude, Gemini, GPT, DeepSeek), Mode Max reasoning, streaming Music One tanpa batas, dan pesan realtime.",
    },
    {
      question: "Kapan kuota kredit di-reset?",
      answer:
        "Semua kredit AI dan Code Credits di-reset secara otomatis setiap hari pada pukul 00:00 WIB, sehingga Anda selalu mendapatkan kuota segar setiap harinya tanpa perlu khawatir kehabisan kuota permanen.",
    },
    {
      question: "Bagaimana cara berlangganan atau melakukan upgrade?",
      answer:
        "Klik tombol 'Upgrade to Pro' atau tab 'Harga', lalu Anda dapat mengaktifkan paket secara instan melalui sistem pembayaran aman atau kode akses resmi One Mind.",
    },
  ],
  "security": [
    {
      question: "Bagaimana keamanan data dan percakapan saya dilindungi?",
      answer:
        "One Mind menggunakan enkripsi tingkat tinggi (AES-256 dan TLS 1.3), isolasi database dengan Row-Level Security (RLS) pada Supabase, dan autentikasi aman via Clerk. Pesan pribadi di fitur Messages hanya dapat dibaca oleh Anda dan lawan bicara Anda.",
    },
    {
      question: "Apakah data saya disimpan secara lokal atau di cloud?",
      answer:
        "Preferensi dan draf cepat dicadangkan secara lokal di browser Anda untuk kecepatan instan, sementara data akun, percakapan, dan proyek disinkronkan dengan aman ke cloud terenkripsi agar dapat diakses dari perangkat manapun.",
    },
  ],
};

// Main reusable FAQ component
export const FAQ: React.FC<FAQProps> = ({
  title = "Pertanyaan Umum",
  subtitle = "Frequently Asked Questions",
  categories = ONE_MIND_FAQ_CATEGORIES,
  faqData = ONE_MIND_FAQ_DATA,
  className,
  ...props
}) => {
  const categoryKeys = Object.keys(categories);
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0] || "");

  return (
    <section
      className={cn(
        "relative overflow-hidden px-4 py-16 sm:py-24 transition-colors",
        className
      )}
      {...props}
    >
      <FAQHeader title={title} subtitle={subtitle} />
      <FAQTabs
        categories={categories}
        selected={selectedCategory}
        setSelected={setSelectedCategory}
      />
      <FAQList faqData={faqData} selected={selectedCategory} />
    </section>
  );
};

const FAQHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
    <span className="mb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 dark:from-zinc-400 dark:via-white dark:to-zinc-400 bg-clip-text text-transparent">
      {subtitle}
    </span>
    <h2 className="mb-8 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
      {title}
    </h2>
    <span className="absolute -top-[300px] left-[50%] z-0 h-[450px] w-[550px] -translate-x-[50%] rounded-full bg-white/5 dark:bg-white/[0.03] blur-3xl pointer-events-none" />
  </div>
);

const FAQTabs: React.FC<{
  categories: Record<string, string>;
  selected: string;
  setSelected: (cat: string) => void;
}> = ({ categories, selected, setSelected }) => (
  <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-4xl mx-auto px-2">
    {Object.entries(categories).map(([key, label]) => {
      const isSelected = selected === key;
      return (
        <button
          key={key}
          type="button"
          onClick={() => setSelected(key)}
          className={cn(
            "relative overflow-hidden whitespace-nowrap rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer shadow-xs",
            isSelected
              ? "border-zinc-900 dark:border-white text-white dark:text-black shadow-md scale-105"
              : "border-zinc-300 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700"
          )}
        >
          <span className="relative z-10">{label}</span>
          <AnimatePresence>
            {isSelected && (
              <motion.span
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-0 bg-zinc-900 dark:bg-white"
              />
            )}
          </AnimatePresence>
        </button>
      );
    })}
  </div>
);

const FAQList: React.FC<{
  faqData: Record<string, FAQItemData[]>;
  selected: string;
}> = ({ faqData, selected }) => (
  <div className="mx-auto mt-10 max-w-3xl px-2 sm:px-4">
    <AnimatePresence mode="wait">
      {Object.entries(faqData).map(([category, questions]) => {
        if (selected === category) {
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3.5"
            >
              {questions.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </motion.div>
          );
        }
        return null;
      })}
    </AnimatePresence>
  </div>
);

const FAQItem: React.FC<FAQItemData> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      animate={isOpen ? "open" : "closed"}
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden",
        isOpen
          ? "bg-zinc-100/90 dark:bg-zinc-900/90 border-zinc-400 dark:border-zinc-700 shadow-md"
          : "bg-white/70 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            "text-sm sm:text-base font-semibold transition-colors tracking-tight",
            isOpen ? "text-zinc-900 dark:text-white" : "text-zinc-800 dark:text-zinc-300"
          )}
        >
          {question}
        </span>
        <motion.span
          variants={{
            open: { rotate: "45deg" },
            closed: { rotate: "0deg" },
          }}
          transition={{ duration: 0.2 }}
          className="shrink-0 p-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        >
          <Plus className="h-4 w-4" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : "0px",
          marginBottom: isOpen ? "16px" : "0px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden px-4 sm:px-5"
      >
        <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {answer}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default FAQ;
