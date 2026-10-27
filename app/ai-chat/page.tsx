"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Cpu,
  Mic,
  ArrowRight,
  Layers,
  CheckCircle2,
  Volume2,
  SlidersHorizontal,
  Bot,
  Play,
  RotateCcw,
  Terminal,
  ShieldCheck,
  Send,
  Code2,
  Database,
  Radio,
} from "lucide-react";
import { LandingNavbar } from "@/components/ui/landing-navbar";
import { FAQ, ONE_MIND_FAQ_DATA } from "@/components/ui/faq-tabs";
import Footer01 from "@/components/ui/footer-01";
import { AuthModal } from "@/app/components/AuthModal";

interface SimulationSample {
  id: string;
  label: string;
  prompt: string;
  model: string;
  provider: string;
  reasoningSteps: string[];
  responseTokens: string[];
}

const SIMULATION_SAMPLES: SimulationSample[] = [
  {
    id: "arch",
    label: "Arsitektur Caching",
    prompt: "Rancang strategi distributed caching multi-tier dengan auto-invalidation.",
    model: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    reasoningSteps: [
      "Menganalisis beban throughput dan toleransi konkurensi...",
      "Menentukan lapisan L1 (in-memory) vs L2 (Redis Cluster)...",
      "Memvalidasi mekanisme invalidation event berbasis CDC...",
    ],
    responseTokens: [
      "Arsitektur direkomendasikan menggunakan Two-Tier Cache Pattern:\n\n",
      "1. L1 (Local Memory / LRU): Latensi < 1ms untuk hot keys frekuensi tinggi.\n",
      "2. L2 (Distributed Redis Cluster): Shared pool dengan TTL adaptif.\n",
      "3. Invalidation Bus: Publikasi mutasi via Redis Pub/Sub untuk purges serentak tanpa race condition.",
    ],
  },
  {
    id: "query",
    label: "Optimasi Query 50k QPS",
    prompt: "Optimalkan skema dan indeks PostgreSQL untuk trafik write-heavy 50.000 QPS.",
    model: "DeepSeek R1",
    provider: "DeepSeek",
    reasoningSteps: [
      "Mengevaluasi I/O write amplification dan tabel partition...",
      "Menghitung overhead B-Tree index vs BRIN index...",
      "Menyusun rekomendasi unlogged staging dan batch ingestion...",
    ],
    responseTokens: [
      "Strategi write-heavy PostgreSQL 50k QPS:\n\n",
      "• Partisi Range harian pada kolom timestamp untuk membatasi working set.\n",
      "• Ganti standard B-Tree dengan BRIN index untuk kolom berurutan (hemat 90% space & IOPS).\n",
      "• Atur fillfactor = 85 pada tabel utama untuk memungkinkan HOT (Heap-Only Tuples) updates.",
    ],
  },
  {
    id: "sse",
    label: "Streaming SSE",
    prompt: "Buat implementasi Server-Sent Events (SSE) dengan backpressure di Next.js 16.",
    model: "Gemini 2.5 Flash",
    provider: "Google",
    reasoningSteps: [
      "Memeriksa standar ReadableStream Web API di App Router...",
      "Mengonfigurasi header Cache-Control: no-cache dan chunk streaming...",
      "Memastikan error handling pada event abort controller...",
    ],
    responseTokens: [
      "Ekspor route handler dengan ReadableStream murni:\n\n",
      "export async function GET() {\n",
      "  const stream = new ReadableStream({ ... });\n",
      "  return new Response(stream, {\n",
      "    headers: { 'Content-Type': 'text/event-stream' }\n",
      "  });\n",
      "}",
    ],
  },
];

export default function AIChatLandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [selectedReasoning, setSelectedReasoning] = useState<"faster" | "balanced" | "max">("max");

  // Interactive Live Pipeline Simulator State
  const [selectedSample, setSelectedSample] = useState<SimulationSample>(SIMULATION_SAMPLES[0]);
  const [animStage, setAnimStage] = useState<1 | 2 | 3 | 4>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Run the animated flow simulation
  const runSimulation = (sample: SimulationSample = selectedSample) => {
    if (isSimulating) return;
    setIsSimulating(true);
    setDisplayedText("");
    setActiveStepIndex(0);

    // Stage 1: Input accepted
    setAnimStage(1);

    // After 600ms -> Stage 2: Router selects model
    setTimeout(() => {
      setAnimStage(2);

      // After 1000ms -> Stage 3: Reasoning trace
      setTimeout(() => {
        setAnimStage(3);
        setActiveStepIndex(0);

        setTimeout(() => setActiveStepIndex(1), 500);
        setTimeout(() => setActiveStepIndex(2), 1000);

        // After 1800ms -> Stage 4: Output streaming tokens
        setTimeout(() => {
          setAnimStage(4);
          let currentText = "";
          let tokenIndex = 0;

          const streamInterval = setInterval(() => {
            if (tokenIndex < sample.responseTokens.length) {
              currentText += sample.responseTokens[tokenIndex];
              setDisplayedText(currentText);
              tokenIndex++;
            } else {
              clearInterval(streamInterval);
              setIsSimulating(false);
            }
          }, 350);
        }, 1600);
      }, 1000);
    }, 700);
  };

  // Trigger default simulation on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation(selectedSample);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectSample = (sample: SimulationSample) => {
    setSelectedSample(sample);
    if (!isSimulating) {
      runSimulation(sample);
    }
  };

  const models = [
    { name: "Claude 3.7 Sonnet", provider: "Anthropic", tag: "Hybrid Reasoning", desc: "Pemikiran mendalam dan penulisan kode terstruktur tingkat industri." },
    { name: "Gemini 2.5 Flash", provider: "Google", tag: "Ultra Speed", desc: "Kecepatan luar biasa dengan jendela konteks raksasa untuk pemrosesan dokumen." },
    { name: "GPT-4o & GPT OSS", provider: "OpenAI / Groq", tag: "Versatile", desc: "Kecerdasan serbaguna untuk pemecahan masalah multidisiplin." },
    { name: "DeepSeek R1", provider: "DeepSeek", tag: "Math & Logic", desc: "Model penalaran mutakhir untuk logika eksak dan verifikasi algoritma." },
    { name: "Qwen 3.8 Flash", provider: "Alibaba Cloud", tag: "High Efficiency", desc: "Sintesis bahasa bilingual yang sangat efisien dan akurat." },
    { name: "Usick One Flagship", provider: "Internal Flagship", tag: "Always Free", desc: "Model kencang bertenaga tanpa biaya, selalu siap 24/7." },
  ];

  const reasoningModes = {
    faster: {
      title: "Mode Faster",
      speed: "< 0.8s",
      depth: "Efisiensi Tinggi",
      desc: "Menghasilkan respons instan dalam hitungan milidetik. Sempurna untuk chat cepat, verifikasi sintaks, dan tanya jawab harian.",
    },
    balanced: {
      title: "Mode Balanced",
      speed: "1.5s - 2.5s",
      depth: "Analitis Seimbang",
      desc: "Melakukan cross-referencing konteks sebelum menjawab. Sangat tepat untuk riset teknis, pembuatan dokumen, dan kompilasi data.",
    },
    max: {
      title: "Mode Max (Deep Think)",
      speed: "3s - 6s",
      depth: "Penalaran Ekstrem",
      desc: "Mengaktifkan rantai pemikiran (chain-of-thought) berlapis untuk memecahkan bug arsitektur rumit, rumus matematika, dan desain sistem.",
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white selection:bg-white/20 overflow-x-hidden">
      {/* Top Navbar */}
      <LandingNavbar onGetStarted={openAuth} isDark={true} />

      {/* Main Interactive AI Experience - Direct & To the Point */}
      <main className="pt-28 pb-16 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto">
        
        {/* Header Bar: Direct & Minimalist */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#E1E0CC]">
              <span className="h-2 w-2 rounded-full bg-[#E1E0CC] animate-pulse" />
              <span>Pipeline Eksekusi AI Multi-Model</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-2">
              Satu Percakapan, Orkestrasi Model Terbaik.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => runSimulation(selectedSample)}
              disabled={isSimulating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {isSimulating ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-[#E1E0CC]" />
              ) : (
                <Play className="h-3.5 w-3.5 text-[#E1E0CC]" />
              )}
              <span>{isSimulating ? "Memproses Alur..." : "Jalankan Simulasi"}</span>
            </button>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E1E0CC] hover:bg-white text-black text-xs font-bold transition-all shadow-lg cursor-pointer"
            >
              <span>Mulai Chat Nyata</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Preset Prompt Selector Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs text-zinc-500 font-mono mr-1">Uji Pertanyaan:</span>
          {SIMULATION_SAMPLES.map((sample) => {
            const isSelected = selectedSample.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#E1E0CC] text-black font-semibold shadow-xs"
                    : "bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {sample.label}
              </button>
            );
          })}
        </div>

        {/* ----------------- ANIMATED INFOGRAPHIC SCHEMA (THE ACTIVE PIPELINE) ----------------- */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950/80 p-5 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          
          {/* Subtle Background Circuit Glow */}
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />

          {/* Process Flow Progress Stepper Header */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 pb-6 mb-6 border-b border-white/10 text-center">
            {[
              { num: "01", label: "Input Chat", active: animStage >= 1 },
              { num: "02", label: "Router & Model", active: animStage >= 2 },
              { num: "03", label: "Reasoning Trace", active: animStage >= 3 },
              { num: "04", label: "Streamed Output", active: animStage >= 4 },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors ${
                      step.active
                        ? "bg-[#E1E0CC] text-black"
                        : "bg-white/10 text-zinc-500"
                    }`}
                  >
                    {step.num}
                  </span>
                  <span
                    className={`hidden sm:inline text-xs font-semibold transition-colors ${
                      step.active ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {/* Active progress indicator bar */}
                <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#E1E0CC]"
                    initial={{ width: "0%" }}
                    animate={{ width: step.active ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Visual Animated Connector Path & Flow Nodes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column: Input Bubble & Model Routing (Stage 1 & 2) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Stage 1: Input Query Card */}
              <motion.div
                animate={{
                  borderColor: animStage === 1 ? "rgba(225, 224, 204, 0.6)" : "rgba(255, 255, 255, 0.1)",
                  backgroundColor: animStage === 1 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.02)",
                }}
                className="rounded-2xl border p-4.5 transition-colors relative"
              >
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                  <span className="flex items-center gap-1.5 text-[#E1E0CC]">
                    <Send className="h-3 w-3" />
                    <span>User Message (Prompt)</span>
                  </span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-400">
                    28 tokens
                  </span>
                </div>
                <p className="text-sm font-medium text-white leading-relaxed">
                  "{selectedSample.prompt}"
                </p>
                
                {/* Latency & Processing Pulse */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Latency In: ~14ms</span>
                  {animStage >= 1 && (
                    <span className="text-[#E1E0CC] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E1E0CC] animate-ping" />
                      Analyzed
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Animated Flow Arrow / Indicator */}
              <div className="flex items-center justify-center py-0.5">
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-xs font-mono text-zinc-500 flex items-center gap-1.5"
                >
                  <span>Intelligent Model Routing</span>
                  <ArrowRight className="h-3 w-3 rotate-90 text-[#E1E0CC]" />
                </motion.div>
              </div>

              {/* Stage 2: Selected Target Model & Capabilities */}
              <motion.div
                animate={{
                  borderColor: animStage === 2 ? "rgba(225, 224, 204, 0.6)" : "rgba(255, 255, 255, 0.1)",
                  backgroundColor: animStage === 2 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.02)",
                }}
                className="rounded-2xl border p-4.5 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-zinc-400">Target Model Dipilih</span>
                  <span className="text-[#E1E0CC] font-bold">{selectedSample.provider}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-[#E1E0CC]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedSample.model}</h4>
                    <p className="text-[11px] text-zinc-400">Context Cache: 200k tokens • FP16 Weights</p>
                  </div>
                </div>

                {/* Live Model Indicators */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="rounded-lg bg-white/[0.03] border border-white/5 py-1.5">
                    <div className="text-zinc-500">Router Decision</div>
                    <div className="text-white font-bold mt-0.5">100% Match</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/5 py-1.5">
                    <div className="text-zinc-500">Time to First Byte</div>
                    <div className="text-[#E1E0CC] font-bold mt-0.5">148ms</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/5 py-1.5">
                    <div className="text-zinc-500">Speed</div>
                    <div className="text-white font-bold mt-0.5">82 tok/s</div>
                  </div>
                </div>
              </motion.div>

              {/* Stage 3: Reasoning Mode Selector (No emojis!) */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-xs font-mono text-zinc-400 mb-2.5 flex items-center justify-between">
                  <span>Upaya Penalaran:</span>
                  <span className="text-[#E1E0CC] font-semibold uppercase">{selectedReasoning}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["faster", "balanced", "max"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedReasoning(mode)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedReasoning === mode
                          ? "bg-white text-black shadow-xs font-bold"
                          : "bg-white/5 border border-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {mode === "faster" && <Zap className="h-3 w-3" />}
                      {mode === "balanced" && <SlidersHorizontal className="h-3 w-3" />}
                      {mode === "max" && <Sparkles className="h-3 w-3" />}
                      <span className="capitalize">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Reasoning Trace & Live Streamed Output Window */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Reasoning Engine Live Trace Box */}
              <div className="rounded-2xl border border-white/10 bg-black/60 p-4.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Cpu className="h-3.5 w-3.5 text-[#E1E0CC]" />
                    <span className="font-semibold text-white">Rantai Penalaran (Chain of Thought)</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {animStage >= 3 ? "Active Trace" : "Menunggu Sinyal"}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedSample.reasoningSteps.map((step, idx) => {
                    const isPassed = animStage > 3 || (animStage === 3 && idx <= activeStepIndex);
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 transition-opacity duration-300 ${
                          isPassed ? "opacity-100" : "opacity-25"
                        }`}
                      >
                        <span
                          className={`mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                            isPassed
                              ? "bg-[#E1E0CC] text-black font-bold"
                              : "bg-white/10 text-zinc-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <p className={`text-xs ${isPassed ? "text-zinc-300" : "text-zinc-600"}`}>
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage 4: Live Streamed Terminal Output */}
              <div className="rounded-2xl border border-white/15 bg-black/90 p-5 font-mono flex-1 flex flex-col justify-between shadow-inner">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-xs">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-[#E1E0CC]" />
                      <span className="text-zinc-300 font-semibold">One Mind Stream Terminal</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span>HTTP 200 SSE</span>
                      <span className="h-2 w-2 rounded-full bg-[#E1E0CC] animate-pulse" />
                    </div>
                  </div>

                  {/* Output content area */}
                  <div className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed min-h-[140px]">
                    {animStage < 4 && isSimulating && (
                      <div className="flex items-center gap-2 text-zinc-500 py-4">
                        <span className="h-2 w-2 rounded-full bg-[#E1E0CC] animate-ping" />
                        <span>Menyintesis pemikiran mendalam dan menyusun jawaban...</span>
                      </div>
                    )}
                    {displayedText}
                    {isSimulating && animStage === 4 && (
                      <span className="inline-block w-2 h-4 bg-[#E1E0CC] ml-1 animate-pulse align-middle" />
                    )}
                    {!isSimulating && displayedText === "" && (
                      <div className="text-zinc-500 py-4">
                        Tekan "Jalankan Simulasi" untuk menyaksikan alur pengiriman pesan, pemilihan model cerdas, dan keluaran streaming secara langsung.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Terminal Action Bar */}
                <div className="mt-6 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-500">
                    Eksekusi tanpa retensi data publik (Enterprise Security)
                  </span>
                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E1E0CC] text-black font-bold text-xs hover:bg-white transition cursor-pointer"
                  >
                    <span>Coba di Akun Anda</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Catalog of Integrated Foundation Models */}
        <div className="mt-20">
          <div className="border-b border-white/10 pb-4 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs uppercase font-mono text-[#E1E0CC] tracking-wider">
                Katalog Model AI Terintegrasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Akses Model-Model Paling Mutakhir
              </h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Bebas berganti model dalam satu klik tanpa multi-langganan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((m) => (
              <div
                key={m.name}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-zinc-500 uppercase">{m.provider}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-[#E1E0CC]">
                      {m.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white">{m.name}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{m.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>API Privat Terenkripsi</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#E1E0CC]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Realtime Voice Assistant Section */}
        <div className="mt-20 rounded-3xl border border-white/15 bg-zinc-950/60 p-6 sm:p-10 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#E1E0CC] mb-3">
                <Volume2 className="h-3.5 w-3.5" />
                <span>Voice Assistant Dwibahasa Realtime</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Bicara Secara Natural, Dengar Tanggapan Seketika.
              </h2>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-xl">
                Tatap muka audio dengan latensi sub-detik. Model memproses suara Anda dalam Bahasa Indonesia atau Inggris, mengeksekusi instruksi, dan merespons dengan intonasi manusiawi.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer"
                >
                  Buka Voice Assistant
                </button>
                <span className="text-xs text-zinc-500 font-mono">Termasuk dalam paket Free</span>
              </div>
            </div>

            {/* Voice Waveform Graphic (Pure Monochrome & Cream) */}
            <div className="md:col-span-4 flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border border-white/20 bg-white/[0.03] flex items-center justify-center relative">
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border border-[#E1E0CC]/50"
                />
                <motion.div
                  animate={{ scale: [1, 1.45, 1], opacity: [0.15, 0.4, 0.15] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
                  className="absolute -inset-3 rounded-full border border-white/30"
                />
                <Mic className="h-8 w-8 text-[#E1E0CC]" />
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* FAQ Tabs Section */}
      <FAQ
        title="Pertanyaan Umum AI Chat"
        subtitle="FAQ Seputar Model & Fitur AI"
        categories={{
          "ai-chat": "AI & Voice Assistant",
          "pricing": "Paket & Kredit",
          "security": "Keamanan & Privasi",
        }}
        faqData={ONE_MIND_FAQ_DATA}
      />

      {/* Direct Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Mulai Eksplorasi Bersama One Mind</h2>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">
          Dapatkan 10.000 AI Credits gratis setiap hari untuk memanfaatkan seluruh kecerdasan ini.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E1E0CC] text-black font-bold text-sm hover:bg-white transition-all shadow-xl cursor-pointer"
          >
            <span>Daftar Gratis Sekarang</span>
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
