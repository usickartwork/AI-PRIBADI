"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Bot,
  Send,
  Code2,
  FileCode,
  Music2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Copy,
  Share2,
  Search,
  Plus,
  ChevronDown,
  Layers,
  CheckCircle2,
  FileText,
  FolderTree,
  Monitor,
  Heart,
  ListMusic,
  Download,
  Mic,
  Maximize2,
} from "lucide-react";

function PreviewGalleryContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "chat";

  if (view === "code") {
    return <CodeStudioPRDPreview />;
  }

  if (view === "music") {
    return <MusicWorkspacePreview />;
  }

  return <AIChatWorkspacePreview />;
}

export default function PreviewGalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] text-white p-8">Memuat pratinjau...</div>}>
      <PreviewGalleryContent />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. REAL AI CHAT WORKSPACE (AUTHENTIC ONE MIND CHAT INTERFACE)
───────────────────────────────────────────────────────────────────────────── */
function AIChatWorkspacePreview() {
  return (
    <div className="w-[1440px] h-[900px] bg-[#09090b] text-white flex overflow-hidden font-sans select-none">
      
      {/* Left Sidebar */}
      <aside className="w-72 border-r border-white/10 bg-black/60 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo Header */}
          <div className="flex items-center justify-between px-2 py-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-full bg-white text-black font-black flex items-center justify-center text-xs">
                1
              </span>
              <span className="font-extrabold text-base tracking-tight text-[#E1E0CC]">
                One Mind
              </span>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition mb-6"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#E1E0CC]" />
              <span>Obrolan Baru</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">⌘K</span>
          </button>

          {/* Session History List */}
          <div className="space-y-4">
            <div>
              <span className="px-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Hari Ini
              </span>
              <div className="mt-1.5 space-y-1">
                <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-xs text-white font-medium flex items-center justify-between">
                  <span className="truncate">Arsitektur Distributed Caching</span>
                  <span className="h-2 w-2 rounded-full bg-[#E1E0CC]" />
                </div>
                <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-zinc-400 truncate">
                  Optimasi Query PostgreSQL 50k QPS
                </div>
                <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-zinc-400 truncate">
                  Next.js 16 SSE Stream Handler
                </div>
              </div>
            </div>

            <div>
              <span className="px-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Kemarin
              </span>
              <div className="mt-1.5 space-y-1">
                <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-zinc-400 truncate">
                  Refactor State Nanostores UI
                </div>
                <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-zinc-400 truncate">
                  Supabase Row Level Security Rules
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Account & Credits Footer */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#E1E0CC] text-black font-bold flex items-center justify-center text-xs">
                F
              </div>
              <div>
                <div className="text-xs font-bold text-white">Filius User</div>
                <div className="text-[10px] text-[#E1E0CC]">Paket Pro Aktif</div>
              </div>
            </div>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#E1E0CC] h-full w-[85%]" />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mt-1.5">
            <span>AI Credits Harian</span>
            <span>85.000 / 100.000</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col justify-between relative bg-radial-gradient from-zinc-950 via-[#09090b] to-[#09090b]">
        
        {/* Top Floating App Bar */}
        <header className="h-16 border-b border-white/10 px-8 flex items-center justify-between bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {/* Model Selector Dropdown */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-[#E1E0CC]" />
              <span>Claude 3.7 Sonnet (Hybrid Reasoning)</span>
              <ChevronDown className="h-3 w-3 text-zinc-400 ml-1" />
            </div>

            {/* Reasoning Pill */}
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#E1E0CC]">
              Mode Max (Deep Think • 3.2s)
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <span>Live Web Search: Aktif</span>
            </div>
            <button type="button" className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Message Thread Stream */}
        <div className="flex-1 overflow-y-auto px-12 py-8 space-y-6 max-w-4xl w-full mx-auto">
          
          {/* User Prompt Message */}
          <div className="flex justify-end">
            <div className="max-w-xl rounded-2xl bg-white/10 border border-white/15 px-5 py-3.5 text-sm text-white leading-relaxed">
              Rancang strategi distributed caching multi-tier dengan auto-invalidation untuk aplikasi SaaS e-commerce berbeban tinggi.
            </div>
          </div>

          {/* AI Assistant Message */}
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-full bg-[#E1E0CC] text-black font-black flex items-center justify-center text-xs shrink-0 mt-1 shadow-md">
              1
            </div>

            <div className="flex-1 space-y-4">
              
              {/* Reasoning Thought Trace Accordion */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs font-mono text-zinc-400 space-y-1.5">
                <div className="flex items-center gap-2 text-[#E1E0CC] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E1E0CC]" />
                  <span>Rantai Pemikiran Logis (Chain of Thought - 3.2s)</span>
                </div>
                <div className="text-[11px] text-zinc-500 pl-3.5 border-l border-white/10">
                  1. Menganalisis ambang batas latensi p99 &lt; 5ms untuk hot catalog keys.<br />
                  2. Membagi cache menjadi L1 (Local memory node / LRU) dan L2 (Redis Cluster sharding).<br />
                  3. Mengimplementasikan event invalidation bus via Redis Pub/Sub untuk sinkronisasi serentak.
                </div>
              </div>

              {/* Formatted Markdown Content */}
              <div className="text-sm text-zinc-200 leading-relaxed space-y-3">
                <p>
                  Untuk beban konkurensi tinggi, arsitektur terbaik adalah <strong>Multi-Tier Hybrid Cache Pattern</strong>:
                </p>

                <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                  <li><strong>Tier 1 (In-Memory L1):</strong> Menggunakan in-process LRU cache pada setiap instance server (latensi &lt; 0.5ms).</li>
                  <li><strong>Tier 2 (Distributed L2):</strong> Redis Cluster terdistribusi sebagai central authoritative store.</li>
                  <li><strong>Invalidation Bus:</strong> Setiap mutasi database memicu event invalidation melalui Redis Pub/Sub untuk membersihkan L1 cache di semua worker instance secara instan.</li>
                </ul>

                {/* Syntax Highlighted Code Snippet */}
                <div className="rounded-xl border border-white/15 bg-black p-4 font-mono text-xs text-zinc-300 overflow-hidden mt-3">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-zinc-500">
                    <span>lib/cache-manager.ts</span>
                    <span className="text-[#E1E0CC]">TypeScript</span>
                  </div>
                  <pre className="text-zinc-300 leading-relaxed">
{`export class MultiTierCache {
  private l1 = new LRUCache<string, any>({ max: 5000, ttl: 1000 * 60 });
  private l2 = new RedisCluster([ ... ]);

  async get<T>(key: string): Promise<T | null> {
    const local = this.l1.get(key);
    if (local) return local as T;

    const remote = await this.l2.get(key);
    if (remote) {
      this.l1.set(key, remote);
      return remote as T;
    }
    return null;
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3 pt-2 text-xs text-zinc-500 font-mono">
                <button type="button" className="hover:text-white flex items-center gap-1 transition">
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Jawaban</span>
                </button>
                <span>•</span>
                <span className="text-[#E1E0CC]">Claude 3.7 Sonnet</span>
                <span>•</span>
                <span>74 tok/s</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Floating Prompt Bar (Liquid Glass Style) */}
        <div className="p-6 max-w-4xl w-full mx-auto z-10">
          <div className="rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl p-3 shadow-2xl flex items-center gap-3">
            <button type="button" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition">
              <Mic className="h-4 w-4" />
            </button>
            <input
              type="text"
              readOnly
              value="Tuliskan unit test Jest untuk MultiTierCache di atas dengan skenario mock invalidation..."
              className="flex-1 bg-transparent text-sm text-zinc-300 focus:outline-none"
            />
            <button
              type="button"
              className="h-9 w-9 rounded-xl bg-[#E1E0CC] text-black flex items-center justify-center font-bold shadow-md"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mt-2 px-2">
            <span>Model: Claude 3.7 Sonnet • Enterprise Encrypted</span>
            <span>Tekan ↵ untuk mengirim</span>
          </div>
        </div>

      </main>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. REAL CODE STUDIO & PRD GENERATOR (INSIDE THE APP)
───────────────────────────────────────────────────────────────────────────── */
function CodeStudioPRDPreview() {
  return (
    <div className="w-[1440px] h-[900px] bg-[#09090b] text-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* Top Studio Navbar */}
      <header className="h-14 border-b border-white/10 bg-black/80 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-[#E1E0CC] text-black font-black flex items-center justify-center text-xs">
              CS
            </span>
            <span className="font-bold text-sm text-white">TaskFlow SaaS Platform</span>
          </div>
          <span className="text-zinc-500">/</span>
          <span className="text-xs font-mono text-[#E1E0CC] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            Next.js 16 • Tailwind v4 • Supabase
          </span>
        </div>

        {/* Studio Primary Navigation Tabs */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button type="button" className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-400">
            Discovery Chat
          </button>
          <button type="button" className="px-3 py-1 rounded-lg text-xs font-bold bg-[#E1E0CC] text-black shadow-xs">
            PRD Architecture
          </button>
          <button type="button" className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-400">
            Features & Scope
          </button>
          <button type="button" className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-400">
            Flow & Schema
          </button>
          <button type="button" className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-400">
            Live Sandbox
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-white">
            <Download className="h-3.5 w-3.5" />
            <span>Export ZIP</span>
          </button>
        </div>
      </header>

      {/* Main Studio Viewport (Split Screen: PRD Document + File Tree / Tasks) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Generated PRD Document */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-white/10 space-y-6 max-w-4xl mx-auto">
          
          {/* PRD Title Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#E1E0CC] tracking-wider">
                Product Requirements Document (PRD) v2.4
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                TaskFlow — Autonomous Project Intelligence
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-[#E1E0CC] border border-white/15">
                ✓ Blueprint Verified
              </span>
            </div>
          </div>

          {/* Section 1: Overview */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#E1E0CC]">
              1. Ringkasan Eksekutif & Latar Belakang
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              TaskFlow dirancang untuk mengotomatisasi manajemen alur kerja tim perangkat lunak melalui sintesis kecerdasan buatan. Sistem menghubungkan obrolan ide kasar pengguna langsung ke struktur arsitektur multi-file yang tervalidasi.
            </p>
          </div>

          {/* Section 2: User Persona & Value Matrix */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#E1E0CC]">
              2. Target Pengguna & Kebutuhan Inti
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="font-bold text-white block">Lead Architect / CTO</span>
                <span className="text-zinc-400 mt-1 block">Membutuhkan kepatuhan arsitektur, isolasi modul, dan standar keamanan tinggi.</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="font-bold text-white block">Product Manager</span>
                <span className="text-zinc-400 mt-1 block">Membutuhkan user stories komprehensif, acceptance criteria, dan roadmap tugas jelas.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Feature Matrix & Acceptance Criteria */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#E1E0CC]">
              3. Matriks Fitur & Kriteria Penerimaan
            </h3>
            <div className="rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs space-y-2 text-zinc-300">
              <div className="text-[#E1E0CC] font-bold">FEAT-01: Realtime Kanban Board Drag & Drop</div>
              <div className="text-zinc-400 pl-3 border-l border-white/10">
                • Given pengguna menggeser kartu tugas dari kolom "In Progress" ke "Done"<br />
                • When event drag dilepaskan pada posisi baru<br />
                • Then state diperbarui secara optimistik dalam &lt; 16ms dan data tersimpan ke Supabase via Server Action.
              </div>
            </div>
          </div>

          {/* Section 4: Database Schema Specification */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#E1E0CC]">
              4. Skema Database Relasional (Supabase Postgres)
            </h3>
            <div className="rounded-xl border border-white/10 bg-black p-4 font-mono text-xs text-zinc-300">
              <pre className="text-zinc-300 leading-relaxed">
{`CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority VARCHAR(10) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Policy
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);`}
              </pre>
            </div>
          </div>

        </div>

        {/* Right Side: File Tree & Backlog Inspector */}
        <aside className="w-80 border-l border-white/10 bg-black/40 p-5 flex flex-col justify-between shrink-0 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="font-bold text-white flex items-center gap-1.5">
                <FolderTree className="h-4 w-4 text-[#E1E0CC]" />
                <span>Generated Files</span>
              </span>
              <span className="text-[10px] text-zinc-500">12 files</span>
            </div>

            <div className="space-y-2 text-zinc-400">
              <div className="text-white font-semibold flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <Code2 className="h-3.5 w-3.5 text-[#E1E0CC]" />
                <span>app/page.tsx</span>
              </div>
              <div className="pl-4 flex items-center gap-2 py-1">
                <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                <span>components/KanbanBoard.tsx</span>
              </div>
              <div className="pl-4 flex items-center gap-2 py-1">
                <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                <span>components/TaskCard.tsx</span>
              </div>
              <div className="pl-4 flex items-center gap-2 py-1">
                <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                <span>hooks/useTaskStore.ts</span>
              </div>
              <div className="pl-4 flex items-center gap-2 py-1">
                <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                <span>lib/supabase-client.ts</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10">
              <span className="font-bold text-white block mb-2">Quality Gate Status</span>
              <div className="space-y-1.5 text-[11px] text-zinc-400">
                <div className="flex justify-between">
                  <span>TypeScript Strict:</span>
                  <span className="text-[#E1E0CC]">Passed</span>
                </div>
                <div className="flex justify-between">
                  <span>Syntax AST Check:</span>
                  <span className="text-[#E1E0CC]">0 Errors</span>
                </div>
                <div className="flex justify-between">
                  <span>Responsive Canvas:</span>
                  <span className="text-[#E1E0CC]">Mobile & Desktop</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-2.5 rounded-xl bg-[#E1E0CC] text-black font-bold text-xs flex items-center justify-center gap-2"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Buka di Live Sandbox</span>
          </button>
        </aside>

      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. REAL MUSIC WORKSPACE (INSIDE THE APP)
───────────────────────────────────────────────────────────────────────────── */
function MusicWorkspacePreview() {
  return (
    <div className="w-[1440px] h-[900px] bg-[#09090b] text-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* Top Music Bar */}
      <header className="h-16 border-b border-white/10 bg-black/60 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#E1E0CC] text-black font-black flex items-center justify-center text-xs">
            <Music2 className="h-4 w-4" />
          </div>
          <span className="font-bold text-base text-white">Music One</span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-[#E1E0CC]">
            Hi-Res FLAC • Ad-Free
          </span>
        </div>

        {/* Search Bar */}
        <div className="w-96 relative">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            readOnly
            value="Deep Resonance (Focus Flow)"
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/15 text-xs text-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button type="button" className="px-4 py-2 rounded-full bg-white/10 text-white font-medium">
            Music Connect
          </button>
        </div>
      </header>

      {/* Main Music Body (2-Column: Track List + Vinyl & Synced Lyrics) */}
      <div className="flex-1 flex overflow-hidden p-8 gap-8">
        
        {/* Left Column: Playlists & Tracks Table */}
        <div className="flex-1 rounded-2xl border border-white/10 bg-black/40 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Daftar Putar: Focus & Coding</h3>
              <span className="text-xs text-zinc-500 font-mono">18 lagu • 1 jam 12 mnt</span>
            </div>

            {/* Track rows */}
            <div className="space-y-1.5 text-xs">
              <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between text-white font-semibold">
                <div className="flex items-center gap-3">
                  <Play className="h-3.5 w-3.5 text-[#E1E0CC]" />
                  <div>
                    <div className="text-sm">Deep Resonance (Focus Flow)</div>
                    <div className="text-[11px] text-zinc-400">One Mind Ambient Labs</div>
                  </div>
                </div>
                <span className="font-mono text-zinc-400">03:42</span>
              </div>

              {[
                { title: "Midnight Compiler", artist: "Syntax Reverie", duration: "04:15" },
                { title: "Binary Horizon", artist: "Silicon Wave", duration: "03:55" },
                { title: "Lo-Fi Coffee Sprint", artist: "Tokyo Beatwork", duration: "02:48" },
                { title: "Quantum Pulse", artist: "Aura Neural", duration: "05:10" },
                { title: "Clean Architecture", artist: "Refactor Dreams", duration: "03:30" },
              ].map((trk, i) => (
                <div key={i} className="p-3 rounded-xl hover:bg-white/5 flex items-center justify-between text-zinc-300">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 font-mono w-4">{i + 2}</span>
                    <div>
                      <div className="text-sm font-medium">{trk.title}</div>
                      <div className="text-[11px] text-zinc-500">{trk.artist}</div>
                    </div>
                  </div>
                  <span className="font-mono text-zinc-500">{trk.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Audio Engine: Web Audio API 60 FPS</span>
            <span className="text-[#E1E0CC]">Streaming Stabil</span>
          </div>
        </div>

        {/* Right Column: Vinyl Disc & Realtime Synced Lyrics */}
        <div className="w-[480px] rounded-2xl border border-white/10 bg-black/60 p-6 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-6 text-xs font-mono text-zinc-400">
              <span className="text-[#E1E0CC] font-bold">Dynamic Lyrics Engine</span>
              <span>Karaoke Sync</span>
            </div>

            {/* Center Spinning Vinyl Miniature */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="h-32 w-32 rounded-full border-2 border-zinc-800 bg-zinc-950 flex items-center justify-center relative shadow-xl">
                <span className="h-4 w-4 rounded-full bg-[#E1E0CC]" />
              </div>
              <h4 className="font-bold text-sm text-white mt-3">Deep Resonance</h4>
              <p className="text-xs text-zinc-500">One Mind Ambient Labs</p>
            </div>

            {/* Synchronized Lyrics Lines */}
            <div className="space-y-3.5 text-center px-4">
              <div className="text-xs text-zinc-600">
                Gelombang suara mengalir tenang melintasi pikiran
              </div>
              <div className="text-sm font-bold text-[#E1E0CC] py-1 border-y border-[#E1E0CC]/20 bg-white/[0.03] rounded-lg">
                Fokus terbentuk tanpa distraksi, ritme kerja menyatu
              </div>
              <div className="text-xs text-zinc-600">
                Setiap baris kode terangkai dalam hening yang harmonis
              </div>
              <div className="text-xs text-zinc-600">
                Denyut frekuensi menjaga ketenangan dan kejernihan ide
              </div>
            </div>
          </div>

          {/* Connected Spotify Info */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>Spotify Connected: 24 Lagu Diimpor</span>
            <span className="text-[#E1E0CC] font-mono">Synced</span>
          </div>
        </div>

      </div>

      {/* Bottom Floating Player Bar */}
      <footer className="h-20 border-t border-white/10 bg-black/80 px-8 flex items-center justify-between shrink-0">
        
        {/* Track Info */}
        <div className="flex items-center gap-3 w-72">
          <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-white/15 flex items-center justify-center">
            <Music2 className="h-6 w-6 text-[#E1E0CC]" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Deep Resonance (Focus Flow)</div>
            <div className="text-[11px] text-zinc-400">One Mind Ambient Labs</div>
          </div>
          <Heart className="h-4 w-4 text-[#E1E0CC] ml-2" />
        </div>

        {/* Center Player Controls & Seekbar */}
        <div className="flex flex-col items-center gap-2 max-w-md w-full">
          <div className="flex items-center gap-4">
            <button type="button" className="text-zinc-400 hover:text-white">
              <SkipBack className="h-4 w-4" />
            </button>
            <button type="button" className="h-9 w-9 rounded-full bg-[#E1E0CC] text-black flex items-center justify-center font-bold">
              <Pause className="h-4 w-4" />
            </button>
            <button type="button" className="text-zinc-400 hover:text-white">
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full text-[10px] font-mono text-zinc-400">
            <span>01:42</span>
            <div className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
              <div className="bg-[#E1E0CC] h-full w-[45%]" />
            </div>
            <span>03:42</span>
          </div>
        </div>

        {/* Right Volume & Controls */}
        <div className="flex items-center gap-3 w-72 justify-end text-xs text-zinc-400">
          <Volume2 className="h-4 w-4 text-white" />
          <div className="w-20 h-1 rounded-full bg-white/15 overflow-hidden">
            <div className="bg-white h-full w-[70%]" />
          </div>
        </div>

      </footer>

    </div>
  );
}
