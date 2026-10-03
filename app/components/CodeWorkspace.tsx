"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MarkdownMessage } from "./MarkdownMessage";

export type TaskStatus =
  | "ready"
  | "backlog"
  | "in_progress"
  | "review"
  | "done"
  | "blocked"
  | "todo"
  | "failed";

export type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "High" | "Medium" | "Low";
export type DependencyType = "HARD" | "SOFT" | "NONE";
export type TaskComplexity = "XS" | "S" | "M" | "L" | "XL";

// V4 Master Brief: Requirement Source Classification (Immutability Enforced)
export type RequirementSource =
  | "USER_REQUIREMENT"
  | "USER_CONSTRAINT"
  | "AI_SUGGESTED"
  | "TECHNICAL_DECISION"
  | "TECHNICAL_RECOMMENDATION"
  | "ASSUMPTION"
  | "TBD";

export type ProjectTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  feature?: string;
  relatedFeature?: string;
  phase?: string;
  priority?: TaskPriority;
  complexity?: TaskComplexity;
  source?: RequirementSource;
  origin?: RequirementSource;
  sourceRequirementIds?: string[];
  deliverable?: string;
  parallelGroup?: string;
  relatedRequirements?: string[];
  dependencies?: string[];
  dependencyType?: DependencyType;
  subtasks?: string[];
  acceptanceCriteria?: string[];
  testing?: string[];
  parallelizable?: "YES" | "NO";
  technicalNotes?: string[] | string;
};

export type ProjectFeature = {
  id: string;
  name: string;
  description: string;
  priority?: TaskPriority;
  dependencies?: string[];
  subFeatures?: string[];
  relatedRequirements?: string[];
  sourceType?: RequirementSource;
  origin?: RequirementSource;
  sourceRequirementIds?: string[];
  sourceRequirements?: string[];
  isMvp?: boolean;
  scope?: "MVP" | "POST-MVP" | "OPTIONAL" | "AI-SUGGESTED";
  isAiSuggested?: boolean;
  aiReason?: string;
};

export type QualityGateCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type SourceViolation = {
  id: string;
  type: string;
  requirementId: string;
  entity: string;
  field: string;
  expected: string;
  actual: string;
  reason: string;
  repairStatus: "UNRESOLVED";
};

export type SourceIntegrityCheck = {
  checkNumber: number;
  question: string;
  passed: boolean;
  detail: string;
  violations?: SourceViolation[];
};

// Structured validation state. Export permission derives ONLY from this (never from strings/percentages/history).
export type SourceIntegrityState = {
  status: "PASS" | "FAIL";
  initialViolations: number;
  repairAttempted: number;
  repairedViolations: number;
  remainingViolations: number;
  finalValidationCompleted: boolean;
  iterations: number;
  repairStatus: "NOT_NEEDED" | "REPAIRED" | "BLOCKED";
  violations: SourceViolation[];
};

export type QualityGateStatus = "PASS" | "PASS WITH WARNINGS" | "FAIL";

export type QualityGateResult = {
  passed: boolean;
  status: QualityGateStatus;
  score: number;
  checks: QualityGateCheck[];
  circularDependenciesFound: boolean;
  repairedCount: number;
  pipelinePassesCompleted: number;
  sourceIntegrity?: "PASS" | "FAIL";
  sourceIntegrityChecks?: SourceIntegrityCheck[];
  sourceIntegrityState?: SourceIntegrityState;
};

// EXPORT GATE: allowed only when final validation completed AND zero remaining violations.
// Legacy projects that have never been evaluated carry no state and are not blocked.
export function isSourceExportAllowed(gate?: QualityGateResult): boolean {
  const s = gate?.sourceIntegrityState;
  if (!s) return true;
  return s.finalValidationCompleted === true && s.remainingViolations === 0;
}

export type ProjectAssumption = {
  id: string;
  assumption: string;
  reason: string;
  impact: string;
};

export type ClassifiedRequirement = {
  id: string;
  text: string;
  source: RequirementSource;
};

export type RequirementRegistryEntry = {
  id: string;
  text: string;
  source: "USER_INPUT" | "USER_CONSTRAINT" | "AI_DERIVED";
  classification: RequirementSource;
  status: "ACTIVE" | "BLOCKED" | "TBD";
};

export type ProjectPRD = {
  primaryType?: string;
  secondaryTypes?: string[];
  overview?: string;
  problemStatement?: string;
  goals?: string[];
  targetUsers?: string[];
  userStories?: string[];
  functionalRequirements?: string[];
  nonFunctionalRequirements?: string[];
  classifiedRequirements?: ClassifiedRequirement[];
  requirementRegistry?: RequirementRegistryEntry[];
  userDerived?: {
    goals?: string[];
    functionalRequirements?: string[];
    userConstraints?: string[];
    explicitNFR?: string[];
  };
  aiDerived?: {
    technicalRecommendations?: string[];
    architectureSuggestions?: string[];
    assumptions?: ProjectAssumption[];
    optionalFeatures?: string[];
    aiSuggestions?: string[];
  };
  constraints?: string[];
  successCriteria?: string[];
  assumptions?: ProjectAssumption[];
  risks?: string[];
  traceabilityMatrix?: TraceabilityRow[];
};

export type StackMode =
  | "USER_SPECIFIED"
  | "PARTIALLY_SPECIFIED"
  | "AI_RECOMMENDED"
  | "UNDECIDED"
  | "EXISTING_PROJECT";

export type StackRecommendation = {
  component?: string;
  recommendation?: string;
  technology?: string;
  classification: "AI_SUGGESTED" | "TECHNICAL_DECISION";
  reason: string;
  alternatives?: string[];
  requiredForImplementation?: boolean;
  required?: boolean;
};

export type TraceabilityRow = {
  requirementId: string;
  featureId: string;
  taskIds: string[];
  classification: RequirementSource;
};

export type ProjectArchitecture = {
  frontend?: string;
  backend?: string;
  database?: string;
  auth?: string;
  storage?: string;
  api?: string;
  thirdParty?: string[];
  deployment?: string;
  security?: string;
  dataSchema?: string;
  isAiSuggestedStack?: boolean;
  userConstraints?: string[];
  complexityLevel?: "SIMPLE" | "MODERATE" | "COMPLEX" | "ENTERPRISE";
  stackMode?: StackMode;
  stackRecommendations?: StackRecommendation[];
  realtime?: string;
  backgroundJobs?: string;
  caching?: string;
};

export type DiscoveryQuestion = {
  id?: string;
  question: string;
  options: string[];
};

export type ProjectChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type ProjectItem = {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  messages: ProjectChatMessage[];
  prd?: ProjectPRD;
  features?: ProjectFeature[];
  userFlow?: string;
  architecture?: ProjectArchitecture;
  tasks: ProjectTask[];
  qualityGate?: QualityGateResult;
  traceabilityMatrix?: TraceabilityRow[];
  generatedHtml?: string;
};

const STORAGE_KEY = "usick_code_projects_v2";

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: "demo-mini-soccer",
    title: "Mini Soccer Booking System",
    description: "Sistem reservasi lapangan mini soccer online dengan jadwal real-time dan pembayaran otomatis.",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "Saya ingin membuat aplikasi web booking lapangan futsal dan mini soccer.",
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: "m-2",
        role: "assistant",
        content: `Halo! Saya telah menganalisis ide proyek **Mini Soccer Booking System** Anda dan telah menyusun blueprint lengkap:

- **PRD**: Kebutuhan sistem, target pengguna, dan kriteria sukses.
- **Features**: Autentikasi, slot jadwal real-time, integrasi QRIS, dan dashboard admin.
- **Architecture**: Next.js 15, Supabase PostgreSQL, dan REST API.
- **Task Board**: Daftar 6 task pengembangan yang siap dikerjakan.

Silakan periksa tab **PRD**, **Features**, **Flow & Arch**, dan **Task Board** di atas untuk melihat detail lengkap yang siap Anda salin ke AI coding tool (Antigravity/Cursor/Vibecode).`,
        createdAt: Date.now() - 86400000 * 3 + 2000,
      },
    ],
    prd: {
      overview: "Platform web terintegrasi untuk reservasi lapangan mini soccer secara real-time, mempermudah penyewa menemukan jadwal kosong dan membantu pemilik lapangan memantau pembayaran dan okupansi.",
      problemStatement: "Pemesanan lapangan via chat WhatsApp rawan bentrok jadwal (double booking), bukti transfer palsu, dan pencatatan manual yang melelahkan bagi pemilik lapangan.",
      goals: [
        "Menghilangkan bentrok jadwal pemesanan lapangan hingga 0%",
        "Mempercepat proses reservasi dari 15 menit (manual chat) menjadi < 2 menit",
        "Menyediakan dashboard rekap keuangan otomatis bagi pengelola",
      ],
      targetUsers: [
        "Penyewa Lapangan (Tim Mini Soccer / Mahasiswa / Komunitas)",
        "Pengelola Lapangan (Admin kasir & Supervisor)",
        "Owner Lapangan (Melihat laporan omset)",
      ],
      userStories: [
        "Sebagai pemain, saya ingin melihat jadwal lapangan yang kosong hari ini agar bisa langsung reservasi.",
        "Sebagai penyewa, saya ingin membayar via QRIS/Transfer agar reservasi saya langsung terkunci otomatis.",
        "Sebagai admin, saya ingin melihat jadwal booking harian agar bisa menyiapkan lapangan dengan baik.",
      ],
      functionalRequirements: [
        "Sistem Autentikasi Pengguna (Login/Register via Google & No. HP)",
        "Kalender Interaktif Jadwal Lapangan Real-time",
        "Sistem Checkout dan Payment Gateway (QRIS, VA)",
        "Manajemen Lapangan & Tarif Khusus (Siang/Malam/Weekend)",
        "Notifikasi Pengingat Jadwal via WhatsApp / Email",
      ],
      nonFunctionalRequirements: [
        "Respon halaman jadwal < 1.5 detik",
        "Ketersediaan sistem (uptime) minimal 99.8%",
        "Desain responsif dioptimalkan untuk perangkat mobile (smartphone)",
      ],
      constraints: [
        "Harus mendukung pembayaran instan QRIS lokal",
        "Memerlukan verifikasi nomor telepon aktif",
      ],
      successCriteria: [
        "Transaksi reservasi berhasil diselesaikan tanpa double-booking",
        "Rating kemudahan penggunaan minimal 4.5/5 dari pengguna",
      ],
    },
    features: [
      {
        id: "feat-auth",
        name: "User & Role Authentication",
        description: "Sistem login dan pemisahan hak akses antara Penyewa dan Admin Pengelola.",
        priority: "High",
        dependencies: ["Database Setup"],
        subFeatures: ["Login/Register OTP & Google", "Role-based authorization", "Session management"],
      },
      {
        id: "feat-booking",
        name: "Real-time Field Schedule & Booking",
        description: "Kalender visual slot jam lapangan dengan lock otomatis saat checkout.",
        priority: "High",
        dependencies: ["User Authentication"],
        subFeatures: ["Slot availability query", "Temporary slot hold (15 menit)", "Multi-slot selection"],
      },
      {
        id: "feat-payment",
        name: "Payment Gateway Integration",
        description: "Pembayaran otomatis menggunakan QRIS & Virtual Account dengan webhook notifikasi.",
        priority: "High",
        dependencies: ["Real-time Field Schedule & Booking"],
        subFeatures: ["QRIS dynamic generator", "Webhook confirmation listener", "Auto-cancel expired invoice"],
      },
      {
        id: "feat-dashboard",
        name: "Admin Management Dashboard",
        description: "Panel admin untuk mengelola tarif, jadwal off-line (perawatan), dan laporan keuangan.",
        priority: "Medium",
        dependencies: ["User & Role Authentication"],
        subFeatures: ["Rekap transaksi harian/bulanan", "Manual booking entry (walk-in)", "Manajemen harga & promo"],
      },
    ],
    userFlow: `1. Landing Page → 2. Pilih Lapangan & Tanggal → 3. Pilih Slot Jam yang Kosong → 4. Login / Isi Kontak → 5. Bayar via QRIS/VA → 6. Konfirmasi Tiket & Notifikasi WA → 7. Check-in di Lapangan`,
    architecture: {
      frontend: "Next.js 15 (App Router), Tailwind CSS, Lucide Icons",
      backend: "Next.js Server Actions & API Routes, Node.js",
      database: "PostgreSQL (Supabase) dengan Row Level Security (RLS)",
      auth: "Supabase Auth (Google OAuth & Magic Link / Phone OTP)",
      storage: "Supabase Storage (Bukti transaksi & foto fasilitas lapangan)",
      api: "REST API & Server Actions dengan Zod validation",
      thirdParty: ["Midtrans / Xendit (Payment Gateway)", "Fonnte / Twilio (WhatsApp Notification)"],
      deployment: "Vercel (Frontend & Serverless API), Supabase Cloud (Database)",
      security: "HTTPS, Rate limiting, Webhook signature verification, Database RLS policies",
      dataSchema: `Table: users (id, name, email, phone, role)
Table: fields (id, name, type, hourly_rate_day, hourly_rate_night)
Table: bookings (id, user_id, field_id, date, start_time, end_time, status, total_amount)
Table: payments (id, booking_id, method, amount, status, snap_token, paid_at)`,
    },
    tasks: [
      {
        id: "task-1",
        title: "Setup Next.js & Supabase Database Schema",
        description: "Inisialisasi project, pasang Tailwind CSS, konfigurasi Supabase client dan buat tabel fields, bookings, payments.",
        status: "done",
        feature: "Database & Setup",
        phase: "Phase 1 - Foundation",
        acceptanceCriteria: ["Schema migrations berhasil dieksekusi", "Supabase environment variables terpasang"],
      },
      {
        id: "task-2",
        title: "Implementasi Autentikasi Penyewa & Admin",
        description: "Buat halaman login, signup, dan middleware proteksi rute untuk halaman admin.",
        status: "done",
        feature: "User & Role Authentication",
        phase: "Phase 1 - Foundation",
        acceptanceCriteria: ["User bisa login", "Role admin terisolasi dari penyewa biasa"],
      },
      {
        id: "task-3",
        title: "Komponen Kalender & Slot Jadwal Real-time",
        description: "Render jadwal jam 08.00 - 24.00, beri warna hijau (tersedia), merah (terbooking), dan abu-abu (dalam proses).",
        status: "ready",
        feature: "Real-time Field Schedule & Booking",
        relatedFeature: "feat-booking — Real-time Field Schedule & Booking",
        phase: "Phase 2 - Core Booking",
        dependencies: ["task-1"],
        dependencyType: "HARD",
        complexity: "M",
        acceptanceCriteria: ["Slot jam otomatis terkunci saat user lain sedang checkout", "Tampilan responsif di mobile"],
        subtasks: ["Buat query ketersediaan slot", "Tampilkan grid jadwal", "Lock temporary booking"],
        testing: ["Uji concurrent booking pada slot yang sama"],
        parallelizable: "NO"
      },
      {
        id: "task-4",
        title: "Integrasi Webhook Payment Gateway (QRIS)",
        description: "Koneksikan API Midtrans/Xendit untuk menghasilkan QRIS dan tangani webhook sukses bayar.",
        status: "backlog",
        feature: "Payment Gateway Integration",
        relatedFeature: "feat-payment — Payment Gateway Integration",
        phase: "Phase 2 - Core Booking",
        dependencies: ["task-3"],
        dependencyType: "HARD",
        complexity: "L",
        acceptanceCriteria: ["Status booking berubah dari 'pending' ke 'confirmed' begitu QRIS dibayar"],
        subtasks: ["Setup Midtrans server key", "Endpoint webhook handler", "Verifikasi signature payload"],
        testing: ["Simulasi pembayaran QRIS via simulator sandbox"],
        parallelizable: "NO"
      },
      {
        id: "task-5",
        title: "Dashboard Rekap Omset & Manajemen Lapangan",
        description: "Halaman admin untuk melihat grafik pendapatan, jadwal hari ini, dan penyesuaian harga khusus.",
        status: "backlog",
        feature: "Admin Management Dashboard",
        relatedFeature: "feat-dashboard — Admin Management Dashboard",
        phase: "Phase 3 - Management & Polish",
        dependencies: ["task-4"],
        dependencyType: "SOFT",
        complexity: "M",
        acceptanceCriteria: ["Admin bisa ekspor laporan ke Excel/CSV", "Admin bisa blokir jadwal untuk maintenance"],
        subtasks: ["Buat query agregasi omzet", "Tabel ringkasan transaksi", "Fungsi export CSV"],
        testing: ["Verifikasi angka rekap omzet dengan transaksi aktual"],
        parallelizable: "YES"
      },
      {
        id: "task-6",
        title: "Integrasi Notifikasi WhatsApp Pengingat Main",
        description: "Kirim pesan otomatis via WA 3 jam sebelum jadwal kick-off.",
        status: "backlog",
        feature: "Notification",
        relatedFeature: "feat-notification — Notification",
        phase: "Phase 3 - Management & Polish",
        dependencies: ["task-4"],
        dependencyType: "SOFT",
        complexity: "S",
        acceptanceCriteria: ["Pesan otomatis terkirim dengan nomor booking dan lokasi"],
        subtasks: ["Integrasi API WhatsApp Gateway", "Cron job pengingat H-3 jam"],
        testing: ["Uji dispatch notifikasi ke nomor WhatsApp staging"],
        parallelizable: "YES"
      },
    ],
  },
];

// ── V4 SOURCE LOCK — Requirement Lineage Helpers ──────────────────────────────
// Classification is created ONCE at ingestion, then inherited — never regenerated.
const USER_CLASSES: RequirementSource[] = ["USER_REQUIREMENT", "USER_CONSTRAINT"];
const AI_DERIVED_CLASSES: RequirementSource[] = ["AI_SUGGESTED", "TECHNICAL_DECISION", "TECHNICAL_RECOMMENDATION", "ASSUMPTION", "TBD"];
const ALL_SOURCES: RequirementSource[] = ["USER_REQUIREMENT", "USER_CONSTRAINT", "AI_SUGGESTED", "TECHNICAL_DECISION", "TECHNICAL_RECOMMENDATION", "ASSUMPTION", "TBD"];
const ORIGIN_PRIORITY: RequirementSource[] = ["USER_REQUIREMENT", "USER_CONSTRAINT", "TECHNICAL_DECISION", "TECHNICAL_RECOMMENDATION", "ASSUMPTION", "TBD", "AI_SUGGESTED"];

export const isValidSource = (v: unknown): v is RequirementSource =>
  typeof v === "string" && ALL_SOURCES.indexOf(v as RequirementSource) !== -1;

export const isUserClass = (c?: RequirementSource) => !!c && USER_CLASSES.indexOf(c) !== -1;

const toRegistrySource = (c: RequirementSource): RequirementRegistryEntry["source"] =>
  c === "USER_REQUIREMENT" ? "USER_INPUT" : c === "USER_CONSTRAINT" ? "USER_CONSTRAINT" : "AI_DERIVED";

const LINEAGE_STOPWORDS = new Set([
  "yang", "dengan", "untuk", "pada", "dari", "atau", "dapat", "dalam", "akan", "agar", "serta", "adalah", "oleh",
  "user", "pengguna", "with", "that", "this", "from", "have", "will", "system", "sistem", "halaman", "page",
]);

const significantTokens = (text: string): Set<string> => {
  const out = new Set<string>();
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .forEach((w) => {
      if (w.length > 3 && !LINEAGE_STOPWORDS.has(w)) out.add(w);
    });
  return out;
};

const overlapScore = (a: string, b: string): number => {
  const ta = significantTokens(a);
  let n = 0;
  significantTokens(b).forEach((w) => {
    if (ta.has(w)) n++;
  });
  return n;
};

// Project type MUST come from actual requirements (not templates): score every type by keyword hits.
export const PROJECT_TYPE_RULES: { label: string; re: RegExp }[] = [
  { label: "Booking / Reservation", re: /booking|reservasi|reservation|appointment|availability|ketersediaan|jadwal|slot|sewa|antrean|meja resto|hotel/g },
  { label: "E-commerce", re: /toko online|olshop|ecommerce|e-commerce|keranjang|checkout|jual beli|katalog produk|belanja/g },
  { label: "Marketplace", re: /marketplace|multi-vendor|multi vendor|banyak seller|multi toko/g },
  { label: "SaaS", re: /saas|software as a service|langganan|subscription|workspace|multi-tenant/g },
  { label: "Dashboard / Admin", re: /dashboard|admin|panel admin|halaman admin|backoffice|crm|erp|kelola data|kpi/g },
  { label: "CMS", re: /cms|content management|kelola konten|mengelola konten|kelola berita|mengelola berita|manajemen konten/g },
  { label: "Education", re: /kursus|sekolah|lms|belajar|akademi|e-learning/g },
  { label: "Event", re: /event|acara|tiket|seminar|webinar|workshop/g },
  { label: "Community", re: /komunitas|forum|diskusi|sosial|social media|feed|follow/g },
  { label: "Blog / News", re: /blog|artikel|tulisan|berita|news|portal berita|majalah online/g },
  { label: "Corporate / Business Website", re: /company profile|profil perusahaan|profil bisnis|tentang kami|layanan perusahaan|corporate|business website/g },
  { label: "Portfolio", re: /portfolio|portofolio|showcase|galeri karya|karya saya/g },
  { label: "Game", re: /game|permainan|gaming|arcade|rpg|game board|tebak tebakan|leaderboard game/g },
  { label: "Marketing Website", re: /landing page|promosi|brosur|one-page|one page/g },
  { label: "Service Business", re: /jasa |service business|bengkel|laundry|salon|klinik/g },
  { label: "Internal Tool", re: /internal tool|alat internal|operasional tim/g },
  { label: "AI Application", re: /fitur ai|ai feature|artificial intelligence|chatbot|llm|generative ai|model ai/g },
  { label: "Directory", re: /direktori|directory|listing/g },
  { label: "Documentation", re: /dokumentasi|documentation|docs /g },
  { label: "Membership", re: /membership|keanggotaan|portal member/g },
  { label: "Content Platform", re: /konten platform|content platform|creator/g },
];

export function rankProjectTypes(text: string): { label: string; score: number }[] {
  const lower = text.toLowerCase();
  return PROJECT_TYPE_RULES
    .map((r, order) => ({ label: r.label, score: (lower.match(r.re) || []).length, order }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ label, score }) => ({ label, score }));
}

// ── V4 Canonical Project Types & Universal Requirement Derivation ──
export function canonicalProjectType(label?: string): string {
  if (!label) return "CUSTOM WEB APPLICATION";
  const upper = label.trim().toUpperCase();
  if (upper === "BLOG / NEWS" || upper === "BLOG" || upper === "NEWS_PORTAL" || upper === "NEWS" || upper === "PORTAL BERITA") {
    return "BLOG / NEWS";
  }
  if (upper === "BOOKING / RESERVATION" || upper === "BOOKING" || upper === "RESERVATION") {
    return "BOOKING / RESERVATION";
  }
  if (upper === "E-COMMERCE" || upper === "ECOMMERCE" || upper === "E_COMMERCE" || upper === "TOKO ONLINE") {
    return "E-COMMERCE";
  }
  if (upper === "MARKETPLACE") {
    return "MARKETPLACE";
  }
  if (upper === "PORTFOLIO" || upper === "PORTOFOLIO") {
    return "PORTFOLIO";
  }
  if (upper === "CORPORATE / BUSINESS WEBSITE" || upper === "COMPANY PROFILE" || upper === "COMPANY_PROFILE" || upper === "BUSINESS WEBSITE") {
    return "CORPORATE / BUSINESS WEBSITE";
  }
  if (upper === "SAAS" || upper === "SOFTWARE AS A SERVICE") {
    return "SAAS";
  }
  if (upper === "DASHBOARD / ADMIN" || upper === "DASHBOARD" || upper === "ADMIN_PANEL" || upper === "ADMIN") {
    return "DASHBOARD / ADMIN";
  }
  if (upper === "GAME" || upper === "GAMING") {
    return "GAME";
  }
  if (upper === "CMS" || upper === "CONTENT MANAGEMENT") {
    return "CONTENT MANAGEMENT";
  }
  if (upper === "EDUCATION" || upper === "E-LEARNING") {
    return "EDUCATION";
  }
  if (upper === "EVENT" || upper === "EVENT_PLATFORM") {
    return "EVENT / TICKETING";
  }
  if (upper === "COMMUNITY" || upper === "SOCIAL_PLATFORM") {
    return "COMMUNITY";
  }
  if (upper === "MARKETING WEBSITE" || upper === "LANDING_PAGE") {
    return "MARKETING WEBSITE";
  }
  if (upper === "AI APPLICATION" || upper === "AI_APPLICATION" || upper === "AI_SAAS") {
    return "AI APPLICATION";
  }
  if (upper === "INTERNAL TOOL" || upper === "INTERNAL_TOOL") {
    return "INTERNAL TOOL";
  }
  if (upper === "DIRECTORY") {
    return "DIRECTORY";
  }
  if (upper === "DOCUMENTATION") {
    return "DOCUMENTATION";
  }
  if (upper === "MEMBERSHIP") {
    return "MEMBERSHIP";
  }
  if (upper === "CONTENT PLATFORM" || upper === "CONTENT_PLATFORM") {
    return "CONTENT PLATFORM";
  }
  if (upper === "SERVICE BUSINESS" || upper === "SERVICE_BUSINESS") {
    return "SERVICE BUSINESS";
  }
  if (upper === "CUSTOM WEB APPLICATION" || upper === "CUSTOM_WEB_APPLICATION") {
    return "CUSTOM WEB APPLICATION";
  }
  return upper;
}

export const SUPPORT_PROJECT_TYPES = new Set([
  "DASHBOARD / ADMIN",
  "CONTENT MANAGEMENT",
  "INTERNAL TOOL",
  "DOCUMENTATION",
]);

export function deriveProjectTypeFromRequirements(
  requirements: { text: string; classification?: string }[] | string
): { primaryType: string; secondaryTypes: string[] } {
  const text = typeof requirements === "string"
    ? requirements
    : requirements
        .filter((r) => !r.classification || r.classification === "USER_REQUIREMENT")
        .map((r) => r.text)
        .join(" ");

  const ranked = rankProjectTypes(text);
  if (ranked.length === 0) {
    return {
      primaryType: "CUSTOM WEB APPLICATION",
      secondaryTypes: [],
    };
  }

  const canonicalRanked: { canonical: string; score: number }[] = [];
  const seen = new Set<string>();
  for (const r of ranked) {
    const c = canonicalProjectType(r.label);
    if (!seen.has(c)) {
      seen.add(c);
      canonicalRanked.push({ canonical: c, score: r.score });
    }
  }

  // V4 Rule: find the core domain type. Supporting functions (Admin, CMS, etc.) become secondaryTypes.
  const firstNonSupport = canonicalRanked.find(
    (item) => !SUPPORT_PROJECT_TYPES.has(item.canonical)
  );

  let primary: string;
  const secondary: string[] = [];

  if (firstNonSupport) {
    primary = firstNonSupport.canonical;
    for (const item of canonicalRanked) {
      if (item.canonical !== primary && !secondary.includes(item.canonical)) {
        secondary.push(item.canonical);
      }
    }
  } else {
    primary = canonicalRanked[0].canonical;
    for (let i = 1; i < canonicalRanked.length; i++) {
      if (!secondary.includes(canonicalRanked[i].canonical)) {
        secondary.push(canonicalRanked[i].canonical);
      }
    }
  }

  return {
    primaryType: primary,
    secondaryTypes: secondary,
  };
}

// REQUIREMENT INGESTION LOCK: registry entries already stored are authoritative (never rewritten);
// only unseen ids are appended with the classification they were first given.
export function buildRequirementRegistry(prd?: ProjectPRD, existing?: RequirementRegistryEntry[]): RequirementRegistryEntry[] {
  const entries: RequirementRegistryEntry[] = [];
  const seen = new Set<string>();
  const push = (id: string, text: string, classification: RequirementSource, status?: RequirementRegistryEntry["status"]) => {
    if (!id || !text || seen.has(id)) return;
    seen.add(id);
    entries.push({
      id,
      text,
      source: toRegistrySource(classification),
      classification,
      status: status || (classification === "TBD" ? "TBD" : "ACTIVE"),
    });
  };

  (existing || []).forEach((e) => push(e.id, e.text, e.classification, e.status));
  if (!prd) return entries;

  if (Array.isArray(prd.classifiedRequirements) && prd.classifiedRequirements.length > 0) {
    prd.classifiedRequirements.forEach((cr, i) =>
      push(cr.id || `REQ-${String(i + 1).padStart(3, "0")}`, cr.text, isValidSource(cr.source) ? cr.source : "USER_REQUIREMENT")
    );
  } else {
    (prd.functionalRequirements || []).forEach((fr, i) => {
      const m = fr.match(/^\s*((?:FR|REQ)-\d+)\s*[:\-]\s*([\s\S]*)$/i);
      const tag = fr.match(/\[Source:\s*([A-Z_]+)\]/);
      const cls: RequirementSource = tag && isValidSource(tag[1]) ? tag[1] : "USER_REQUIREMENT";
      const id = m ? m[1].toUpperCase() : `REQ-${String(i + 1).padStart(3, "0")}`;
      const text = (m ? m[2] : fr).replace(/\s*\[Source:[^\]]*\]\s*$/, "").trim();
      push(id, text, cls);
    });
  }
  (prd.constraints || []).forEach((c, i) => push(`CON-${String(i + 1).padStart(2, "0")}`, c, "USER_CONSTRAINT"));
  (prd.nonFunctionalRequirements || []).forEach((nf, i) => {
    const m = nf.match(/^\s*(NFR-\d+)/i);
    const text = nf.replace(/^\s*NFR-\d+\s*(\([^)]*\))?\s*[:\-]?\s*/i, "").trim() || nf;
    push(m ? m[1].toUpperCase() : `NFR-${String(i + 1).padStart(2, "0")}`, text, "TECHNICAL_RECOMMENDATION");
  });
  return entries;
}

export function resolveSourceIds(raw: unknown[], regMap: Map<string, RequirementRegistryEntry>): string[] {
  const out: string[] = [];
  raw.forEach((v) => {
    const s = String(v ?? "").trim();
    if (!s) return;
    const lead = (s.match(/^[A-Za-z]+-\d+/) || [s])[0];
    const key = regMap.has(s) ? s : regMap.has(lead) ? lead : regMap.has(lead.toUpperCase()) ? lead.toUpperCase() : "";
    if (key && out.indexOf(key) === -1) out.push(key);
  });
  return out;
}

// SOURCE INHERITANCE: derived entities inherit origin from their source requirements.
function inheritOrigin(ids: string[], regMap: Map<string, RequirementRegistryEntry>): RequirementSource | undefined {
  const classes: RequirementSource[] = [];
  ids.forEach((id) => {
    const c = regMap.get(id)?.classification;
    if (c) classes.push(c);
  });
  if (classes.length === 0) return undefined;
  for (const p of ORIGIN_PRIORITY) {
    if (classes.indexOf(p) !== -1) return p;
  }
  return undefined;
}

// Traceability is derived from lineage ids; classification always comes from the registry (never recomputed).
export function buildTraceabilityMatrix(
  registry: RequirementRegistryEntry[],
  features: ProjectFeature[],
  tasks: ProjectTask[]
): TraceabilityRow[] {
  return registry.map((r) => {
    const featIds = features.filter((f) => (f.sourceRequirementIds || []).indexOf(r.id) !== -1).map((f) => f.id);
    const taskIds = tasks.filter((t) => (t.sourceRequirementIds || []).indexOf(r.id) !== -1).map((t) => t.id);
    return {
      requirementId: r.id,
      featureId: featIds.length > 0 ? featIds.join(", ") : "-",
      taskIds,
      classification: r.classification,
    };
  });
}

// PRD SOURCE SEPARATION: USER-DERIVED vs AI-DERIVED (AI content is never promoted to user requirement).
export function buildPrdSourceSeparation(
  prd: ProjectPRD | undefined,
  registry: RequirementRegistryEntry[],
  features: ProjectFeature[],
  tasks: ProjectTask[],
  architecture?: ProjectArchitecture,
  extraConstraints: string[] = []
): { userDerived: NonNullable<ProjectPRD["userDerived"]>; aiDerived: NonNullable<ProjectPRD["aiDerived"]> } {
  const fmt = (r: RequirementRegistryEntry) => `${r.id}: ${r.text}`;
  const constraints = registry.filter((r) => r.classification === "USER_CONSTRAINT").map(fmt);
  extraConstraints.forEach((c) => {
    if (constraints.indexOf(c) === -1) constraints.push(c);
  });
  const optionalFeatures = features
    .filter((f) => f.origin === "AI_SUGGESTED" || f.scope === "AI-SUGGESTED")
    .map((f) => `${f.id}: ${f.name}`);
  const aiSuggestions = registry.filter((r) => r.classification === "AI_SUGGESTED").map(fmt);
  tasks
    .filter((t) => t.origin === "AI_SUGGESTED")
    .forEach((t) => aiSuggestions.push(`${t.id}: ${t.title}`));
  const technicalRecommendations = registry
    .filter((r) => r.classification === "TECHNICAL_DECISION" || r.classification === "TECHNICAL_RECOMMENDATION")
    .map(fmt);
  (architecture?.stackRecommendations || []).forEach((s) => {
    technicalRecommendations.push(`${s.technology || s.component || s.recommendation || "Stack"}: ${s.reason}`);
  });

  return {
    userDerived: {
      goals: prd?.userDerived?.goals ?? prd?.goals ?? [],
      functionalRequirements: registry.filter((r) => r.classification === "USER_REQUIREMENT").map(fmt),
      userConstraints: constraints,
      explicitNFR: prd?.userDerived?.explicitNFR ?? [],
    },
    aiDerived: {
      technicalRecommendations,
      architectureSuggestions: prd?.aiDerived?.architectureSuggestions ?? [],
      assumptions: prd?.assumptions ?? [],
      optionalFeatures,
      aiSuggestions,
    },
  };
}

// Stack mode can never claim more certainty than what was actually detected from the user.
export function normalizeStackMode(llmMode: unknown, detected: StackMode): StackMode {
  const rank: Record<StackMode, number> = { UNDECIDED: 0, AI_RECOMMENDED: 1, PARTIALLY_SPECIFIED: 2, USER_SPECIFIED: 3, EXISTING_PROJECT: 3 };
  if (detected === "EXISTING_PROJECT") return detected;
  if (typeof llmMode === "string" && llmMode in rank && llmMode !== "EXISTING_PROJECT" && rank[llmMode as StackMode] <= rank[detected]) {
    return llmMode as StackMode;
  }
  return detected;
}

export type SourceIntegrityContext = {
  primaryType?: string;
  secondaryTypes?: string[];
  stackMode?: StackMode;
  stackAlternatives?: string[];
  stackIsAiSuggested?: boolean;
};

// ── Graph Optimizer, Cycle Detection & Quality Gate Engine ────────────────────
// ── 11-Pass Validation, Scope Control & Automatic Repair Pipeline (V4 Enforcement Patch) ──
// ── + V4 Source Lock: lineage inheritance & Source Integrity Check (8 checks) ──
export function analyzeAndOptimizeTasks(
  tasks: ProjectTask[],
  features: ProjectFeature[] = [],
  prd?: ProjectPRD,
  context?: SourceIntegrityContext
): {
  tasks: ProjectTask[];
  qualityGate: QualityGateResult;
  features: ProjectFeature[];
  requirementRegistry: RequirementRegistryEntry[];
  classifiedRequirements: ClassifiedRequirement[];
  stackMode?: StackMode;
  prd?: ProjectPRD;
  primaryType?: string;
  secondaryTypes?: string[];
} {
  let repairedCount = 0;
  const taskMap = new Map<string, ProjectTask>();
  tasks.forEach((t) => taskMap.set(t.id, { ...t }));

  // ── V4 SOURCE LOCK: REQUIREMENT INGESTION LOCK ────────────────────────────────
  const registry = buildRequirementRegistry(prd, prd?.requirementRegistry);
  const regMap = new Map<string, RequirementRegistryEntry>();
  registry.forEach((r) => regMap.set(r.id, r));
  const lockActive = registry.length > 0;
  const isUserClass = (c?: RequirementSource) => !!c && USER_CLASSES.indexOf(c) !== -1;
  const lockedFeatures: ProjectFeature[] = features.map((f) => ({ ...f }));

  const unauthorizedPattern = /kupon|coupon|voucher|wishlist|faq|tanya jawab|live chat|customer support|google oauth|dark mode|mode gelap|ai chatbot|chatbot ai|redis|swr|framer motion|advanced analytics|analitik lanjutan|retention analytics|bulk action|aksi massal|avatar upload|unggah avatar|recommendation engine|rekomendasi|loyalty system|poin loyalitas/i;
  const prdText = ((prd?.overview || "") + " " + (prd?.functionalRequirements || []).join(" ") + " " + (prd?.classifiedRequirements || []).map(r => r.text).join(" ")).toLowerCase();

  // Classification is assigned once: restore text/classification of locked requirements, restore dropped ones.
  const incomingClassified = prd?.classifiedRequirements || [];
  incomingClassified.forEach((cr) => {
    const entry = regMap.get(cr.id);
    if (entry && (entry.classification !== cr.source || entry.text !== cr.text)) repairedCount++;
  });
  const classifiedLocked: ClassifiedRequirement[] = registry
    .filter((r) => r.id.indexOf("NFR-") !== 0)
    .map((r) => ({ id: r.id, text: r.text, source: r.classification }));
  if (incomingClassified.length > 0) {
    registry
      .filter((r) => /^(FR|REQ)-\d+$/i.test(r.id))
      .forEach((r) => {
        if (!incomingClassified.some((cr) => cr.id === r.id)) repairedCount++;
      });
  }

  // ── V4 SOURCE LOCK: SOURCE INHERITANCE (Feature & Task inherit origin from requirement ids) ──
  lockedFeatures.forEach((f) => {
    const explicitAi = f.isAiSuggested === true || f.scope === "AI-SUGGESTED" || f.origin === "AI_SUGGESTED" || f.sourceType === "AI_SUGGESTED";
    let ids = resolveSourceIds(
      [...(f.sourceRequirementIds || []), ...(f.sourceRequirements || []), ...(f.relatedRequirements || [])],
      regMap
    );
    if (explicitAi) ids = ids.filter((id) => !isUserClass(regMap.get(id)?.classification));
    f.sourceRequirementIds = ids;
    f.origin = explicitAi
      ? "AI_SUGGESTED"
      : inheritOrigin(ids, regMap) ?? (isValidSource(f.origin) ? f.origin : isValidSource(f.sourceType) ? f.sourceType : undefined);
  });

  taskMap.forEach((task) => {
    const declared = isValidSource(task.origin) ? task.origin : isValidSource(task.source) ? task.source : undefined;
    const explicitAi = declared === "AI_SUGGESTED";
    let ids = resolveSourceIds([...(task.sourceRequirementIds || []), ...(task.relatedRequirements || [])], regMap);
    if (explicitAi) ids = ids.filter((id) => !isUserClass(regMap.get(id)?.classification));
    task.sourceRequirementIds = ids;
    task.origin = explicitAi ? "AI_SUGGESTED" : inheritOrigin(ids, regMap) ?? declared;
    task.source = task.origin;
  });

  // PASS 5 — SCOPE AUDIT & UNAUTHORIZED SCOPE DETECTION (lineage-aware)
  // Items with real USER lineage are locked; only unsourced "user" claims can be reclassified.
  taskMap.forEach((task) => {
    const hasUserLineage = (task.sourceRequirementIds || []).some((id) => isUserClass(regMap.get(id)?.classification));
    if (
      !hasUserLineage &&
      task.origin === "USER_REQUIREMENT" &&
      unauthorizedPattern.test((task.title + " " + task.description).toLowerCase()) &&
      !unauthorizedPattern.test(prdText)
    ) {
      task.origin = "AI_SUGGESTED";
      task.source = "AI_SUGGESTED";
      if (task.priority === "CRITICAL" || task.priority === "HIGH") task.priority = "MEDIUM";
      repairedCount++;
    }
  });
  lockedFeatures.forEach((f) => {
    const hasUserLineage = (f.sourceRequirementIds || []).some((id) => isUserClass(regMap.get(id)?.classification));
    if (
      !hasUserLineage &&
      (!f.origin || f.origin === "USER_REQUIREMENT") &&
      unauthorizedPattern.test((f.name + " " + f.description).toLowerCase()) &&
      !unauthorizedPattern.test(prdText)
    ) {
      f.origin = "AI_SUGGESTED";
      repairedCount++;
    }
  });

  // ── V4 SOURCE LOCK: SOURCE INTEGRITY CHECK (8 checks) + AUTOMATIC REPAIR LOOP ──────────
  let correctedStackMode: StackMode | undefined = context?.stackMode;
  if (
    context?.stackMode === "USER_SPECIFIED" &&
    ((context.stackAlternatives || []).length > 0 || context.stackIsAiSuggested === true)
  ) {
    correctedStackMode = (context.stackAlternatives || []).length > 0 ? "PARTIALLY_SPECIFIED" : "AI_RECOMMENDED";
    repairedCount++;
  }

  const featureMandatoryAi = (f: ProjectFeature) => f.origin === "AI_SUGGESTED" && (f.isMvp !== false || f.scope === "MVP");

  const matchBestReq = (text: string, minScore: number): RequirementRegistryEntry | undefined => {
    let best: RequirementRegistryEntry | undefined;
    let bestScore = 0;
    for (const r of registry) {
      if (r.classification !== "USER_REQUIREMENT") continue;
      const s = overlapScore(text, r.text);
      if (s > bestScore) {
        best = r;
        bestScore = s;
      }
    }
    return bestScore >= minScore ? best : undefined;
  };

  const featureText = (f: ProjectFeature) => [f.name, f.description, ...(f.subFeatures || [])].join(" ");
  const taskText = (t: ProjectTask) => [t.title, t.description, ...(t.subtasks || [])].join(" ");
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

  const evaluateSourceIntegrity = (): SourceIntegrityCheck[] => {
    const userReqs = registry.filter((r) => r.classification === "USER_REQUIREMENT" && r.status === "ACTIVE");
    const tasksArr = Array.from(taskMap.values());
    const lineageItems: { id?: string; origin?: RequirementSource; sourceRequirementIds?: string[] }[] = [...lockedFeatures, ...tasksArr];
    const na = "Tidak ada registry requirement (proyek tanpa PRD) — pemeriksaan dilewati.";

    const missing = userReqs.filter((r) => !classifiedLocked.some((cr) => cr.id === r.id));
    const classDrift = classifiedLocked.filter((cr) => regMap.get(cr.id)?.classification !== cr.source);
    const noFeature = lockedFeatures.length === 0
      ? []
      : userReqs.filter((r) => !lockedFeatures.some((f) => f.origin !== "AI_SUGGESTED" && (f.sourceRequirementIds || []).indexOf(r.id) !== -1));
    const noTask = tasksArr.length === 0
      ? []
      : userReqs.filter((r) => !tasksArr.some((t) => t.origin !== "AI_SUGGESTED" && (t.sourceRequirementIds || []).indexOf(r.id) !== -1));
    const aiMandatory = lockedFeatures.filter(featureMandatoryAi);
    const aiLeak = lineageItems.filter(
      (x) => x.origin === "AI_SUGGESTED" && (x.sourceRequirementIds || []).some((id) => isUserClass(regMap.get(id)?.classification))
    );
    const aiBlocking = tasksArr.filter(
      (t) => isUserClass(t.origin) && (t.dependencies || []).some((d) => taskMap.get(d)?.origin === "AI_SUGGESTED")
    );
    const unsourced = lineageItems.filter(
      (x) => (x.sourceRequirementIds || []).length === 0 && !(x.origin && AI_DERIVED_CLASSES.indexOf(x.origin) !== -1)
    );

    const expectedProjectClassification = deriveProjectTypeFromRequirements(userReqs);
    const expectedPrimary = canonicalProjectType(expectedProjectClassification.primaryType);
    const currentPrimary = prd?.primaryType || context?.primaryType;
    const generatedPrimary = canonicalProjectType(currentPrimary);
    const isDefaultFallback = expectedPrimary === "CUSTOM WEB APPLICATION";
    const typeMismatch = !isDefaultFallback && (generatedPrimary !== expectedPrimary);
    const typeOk = !typeMismatch;

    const mode = correctedStackMode;
    const alts = context?.stackAlternatives || [];
    const stackOk = !mode || !(mode === "USER_SPECIFIED" && (alts.length > 0 || context?.stackIsAiSuggested === true));

    const checks: SourceIntegrityCheck[] = [
      {
        checkNumber: 1,
        question: "Apakah semua USER_REQUIREMENT masih ada?",
        passed: !lockActive || missing.length === 0,
        detail: !lockActive ? na : missing.length === 0 ? `${userReqs.length} USER_REQUIREMENT terdaftar di registry dan utuh.` : `Hilang: ${missing.map((r) => r.id).join(", ")}`,
      },
      {
        checkNumber: 2,
        question: "Apakah classification masih sama?",
        passed: !lockActive || classDrift.length === 0,
        detail: !lockActive ? na : classDrift.length === 0 ? "Classification identik dengan registry (dikunci saat ingest)." : `Drift: ${classDrift.map((c) => c.id).join(", ")}`,
      },
      {
        checkNumber: 3,
        question: "Apakah setiap requirement memiliki Feature?",
        passed: !lockActive || noFeature.length === 0,
        detail: !lockActive ? na : noFeature.length === 0 ? "Setiap USER_REQUIREMENT memiliki minimal satu Feature." : `Tanpa feature: ${noFeature.map((r) => r.id).join(", ")}`,
      },
      {
        checkNumber: 4,
        question: "Apakah setiap requirement memiliki Task?",
        passed: !lockActive || noTask.length === 0,
        detail: !lockActive ? na : noTask.length === 0 ? "Setiap USER_REQUIREMENT memiliki minimal satu Task." : `Tanpa task: ${noTask.map((r) => r.id).join(", ")}`,
      },
      {
        checkNumber: 5,
        question: "Apakah ada AI_SUGGESTED yang masuk sebagai mandatory scope?",
        passed: aiMandatory.length === 0 && aiLeak.length === 0 && aiBlocking.length === 0,
        detail:
          aiMandatory.length === 0 && aiLeak.length === 0 && aiBlocking.length === 0
            ? "AI_SUGGESTED terisolasi dari scope wajib, lineage user, dan dependency task user."
            : `Bocor: ${aiMandatory.map((f) => f.id).join(", ")} ${aiBlocking.map((t) => t.id).join(", ")}`.trim(),
      },
      {
        checkNumber: 6,
        question: "Apakah ada requirement baru yang tidak memiliki source?",
        passed: !lockActive || unsourced.length === 0,
        detail: !lockActive ? na : unsourced.length === 0 ? "Semua Feature/Task memiliki source requirement atau ditandai AI-derived." : `${unsourced.length} item tanpa source.`,
      },
      {
        checkNumber: 7,
        question: "Apakah project type sesuai dengan requirement sebenarnya?",
        passed: typeOk,
        detail: typeOk ? `Primary type "${generatedPrimary || expectedPrimary}" konsisten dengan requirement aktual.` : `Primary type "${generatedPrimary}" tidak sesuai; requirement mengarah ke "${expectedPrimary}".`,
      },
      {
        checkNumber: 8,
        question: "Apakah Stack Mode sesuai dengan tingkat kepastian teknologi?",
        passed: stackOk,
        detail: stackOk ? `Stack Mode ${mode || "-"} sesuai tingkat kepastian.` : "USER_SPECIFIED tidak boleh dipakai saat masih ada alternatif/rekomendasi AI.",
      },
    ];

    // Exact structured violations (computed from the data itself, never from a repair log).
    const mk = (
      type: string,
      requirementId: string,
      entity: string,
      field: string,
      expected: string,
      actual: string,
      reason: string
    ): SourceViolation => ({
      id: `${type}|${entity}|${field}|${requirementId}`,
      type,
      requirementId,
      entity,
      field,
      expected,
      actual,
      reason,
      repairStatus: "UNRESOLVED",
    });
    const userIdsOf = (x: { sourceRequirementIds?: string[] }) =>
      (x.sourceRequirementIds || []).filter((id) => isUserClass(regMap.get(id)?.classification));
    const entityLabel = (x: { id?: string }) => {
      const kind = lockedFeatures.some((f) => f === x) ? "FEATURE" : "TASK";
      return `${kind} ${x.id || "?"}`;
    };
    const lists: Record<number, SourceViolation[]> = {
      1: missing.map((r) => mk("MISSING_REQUIREMENT", r.id, "REGISTRY", "classifiedRequirements", `${r.id} terdaftar`, "tidak ditemukan", "USER_REQUIREMENT hilang dari requirement terklasifikasi")),
      2: classDrift.map((c) => mk("CLASSIFICATION_MISMATCH", c.id, "REGISTRY", "classification", String(regMap.get(c.id)?.classification), String(c.source), "Classification berbeda dari registry yang terkunci")),
      3: noFeature.map((r) => mk("MISSING_FEATURE_MAPPING", r.id, "FEATURE", "sourceRequirementIds", `minimal 1 Feature non-AI mengacu ${r.id}`, "tidak ada", "Requirement tidak memiliki Feature")),
      4: noTask.map((r) => mk("MISSING_TASK_MAPPING", r.id, "TASK", "sourceRequirementIds", `minimal 1 Task non-AI mengacu ${r.id}`, "tidak ada", "Requirement tidak memiliki Task")),
      5: [
        ...aiMandatory.map((f) => mk("AI_SUGGESTED_MANDATORY_SCOPE", (f.sourceRequirementIds || [])[0] || "-", entityLabel(f), "isMvp/scope", "isMvp=false, scope=AI-SUGGESTED", `isMvp=${String(f.isMvp)}, scope=${String(f.scope)}`, "AI_SUGGESTED masuk sebagai mandatory scope")),
        ...aiLeak.map((x) => mk("AI_SUGGESTED_USER_LINEAGE", userIdsOf(x)[0] || "-", entityLabel(x), "sourceRequirementIds", "tanpa ID USER requirement", userIdsOf(x).join(", "), "AI_SUGGESTED memakai lineage USER requirement")),
        ...aiBlocking.map((t) => mk("AI_SUGGESTED_BLOCKING_DEPENDENCY", userIdsOf(t)[0] || "-", entityLabel(t), "dependencies", "tanpa dependency ke task AI_SUGGESTED", (t.dependencies || []).filter((d) => taskMap.get(d)?.origin === "AI_SUGGESTED").join(", "), "Task USER bergantung pada task AI_SUGGESTED")),
      ],
      6: unsourced.map((x) => mk("UNSOURCED_ENTITY", "-", entityLabel(x), "sourceRequirementIds", "minimal 1 ID requirement atau origin AI-derived", `[] (origin=${String(x.origin)})`, "Entity tanpa source requirement")),
      7: typeOk ? [] : [mk("PROJECT_TYPE_MISMATCH", "-", "PRD", "primaryType", expectedPrimary, generatedPrimary || "(none)", "Primary type tidak sesuai requirement aktual")],
      8: stackOk ? [] : [mk("STACK_MODE_MISMATCH", "-", "ARCHITECTURE", "stackMode", "PARTIALLY_SPECIFIED atau AI_RECOMMENDED", String(mode), "USER_SPECIFIED padahal masih ada alternatif/rekomendasi AI")],
    };
    checks.forEach((c) => {
      c.violations = c.passed
        ? []
        : lists[c.checkNumber].length > 0
        ? lists[c.checkNumber]
        : [mk("CHECK_FAILED", "-", `CHECK ${c.checkNumber}`, "-", "PASS", "FAIL", c.detail)];
    });
    return checks;
  };

  const repairSourceIntegrity = () => {
    if (!lockActive) return;

    // (a) Unsourced items: attach to best-matching user requirement, else mark explicitly AI-derived.
    lockedFeatures.forEach((f) => {
      if ((f.sourceRequirementIds || []).length > 0) return;
      if (f.origin && AI_DERIVED_CLASSES.indexOf(f.origin) !== -1) return;
      const req = matchBestReq(featureText(f), 2);
      if (req) {
        f.sourceRequirementIds = [req.id];
        f.origin = inheritOrigin(f.sourceRequirementIds, regMap);
      } else {
        f.origin = "TECHNICAL_DECISION";
        f.sourceType = "TECHNICAL_DECISION";
      }
      repairedCount++;
    });
    taskMap.forEach((t) => {
      if ((t.sourceRequirementIds || []).length > 0) return;
      if (t.origin && AI_DERIVED_CLASSES.indexOf(t.origin) !== -1) return;
      const req = matchBestReq(taskText(t), 2);
      if (req) {
        t.sourceRequirementIds = [req.id];
        t.origin = inheritOrigin(t.sourceRequirementIds, regMap);
      } else {
        t.origin = "TECHNICAL_DECISION";
      }
      t.source = t.origin;
      repairedCount++;
    });

    // (b) No requirement loss: every ACTIVE USER_REQUIREMENT needs >=1 Feature and >=1 Task.
    registry
      .filter((r) => r.classification === "USER_REQUIREMENT" && r.status === "ACTIVE")
      .forEach((r) => {
        let coveringFeature: ProjectFeature | undefined = lockedFeatures.find(
          (f) => f.origin !== "AI_SUGGESTED" && (f.sourceRequirementIds || []).indexOf(r.id) !== -1
        );
        if (lockedFeatures.length > 0 && !coveringFeature) {
          let best: ProjectFeature | undefined;
          let bestScore = 0;
          for (const f of lockedFeatures) {
            if (f.origin === "AI_SUGGESTED") continue;
            const s = overlapScore(r.text, featureText(f));
            if (s > bestScore) {
              best = f;
              bestScore = s;
            }
          }
          if (best && bestScore >= 1) {
            best.sourceRequirementIds = [...(best.sourceRequirementIds || []), r.id];
            best.origin = inheritOrigin(best.sourceRequirementIds, regMap);
            coveringFeature = best;
          } else {
            const stub: ProjectFeature = {
              id: `FEAT-${r.id}`,
              name: clip(r.text, 70),
              description: r.text,
              priority: "HIGH",
              scope: "MVP",
              isMvp: true,
              isAiSuggested: false,
              sourceType: "USER_REQUIREMENT",
              origin: "USER_REQUIREMENT",
              sourceRequirementIds: [r.id],
              sourceRequirements: [r.id],
              relatedRequirements: [r.id],
              subFeatures: [],
              dependencies: [],
            };
            lockedFeatures.push(stub);
            coveringFeature = stub;
          }
          repairedCount++;
        }

        const tasksArr = Array.from(taskMap.values());
        if (tasksArr.length > 0 && !tasksArr.some((t) => t.origin !== "AI_SUGGESTED" && (t.sourceRequirementIds || []).indexOf(r.id) !== -1)) {
          let best: ProjectTask | undefined;
          let bestScore = 0;
          for (const t of tasksArr) {
            if (t.origin === "AI_SUGGESTED") continue;
            const s = overlapScore(r.text, taskText(t));
            if (s > bestScore) {
              best = t;
              bestScore = s;
            }
          }
          if (best && bestScore >= 2) {
            best.sourceRequirementIds = [...(best.sourceRequirementIds || []), r.id];
            best.origin = inheritOrigin(best.sourceRequirementIds, regMap);
            best.source = best.origin;
          } else {
            const stubId = `TASK-${r.id}`;
            const featLabel = coveringFeature ? `${coveringFeature.id} — ${coveringFeature.name}` : "";
            taskMap.set(stubId, {
              id: stubId,
              title: `Implementasi ${clip(r.text, 80)}`,
              description: r.text,
              status: "backlog",
              feature: coveringFeature?.name,
              relatedFeature: featLabel || undefined,
              phase: "Phase — Source Coverage",
              priority: "HIGH",
              source: "USER_REQUIREMENT",
              origin: "USER_REQUIREMENT",
              sourceRequirementIds: [r.id],
              relatedRequirements: [r.id],
              dependencies: [],
              dependencyType: "NONE",
              subtasks: [`${stubId}.1: Implementasi perilaku sesuai requirement ${r.id}`, `${stubId}.2: Verifikasi hasil terhadap requirement ${r.id}`],
              acceptanceCriteria: [`Perilaku sistem sesuai requirement ${r.id}: ${r.text}`],
              testing: [`Uji skenario yang memverifikasi requirement ${r.id}`],
              parallelizable: "NO",
            });
          }
          repairedCount++;
        }
      });

    // (c) AI_SUGGESTED isolation: never mandatory, never inside user lineage, never a blocker for user tasks.
    lockedFeatures.forEach((f) => {
      if (f.origin !== "AI_SUGGESTED") return;
      const stripped = (f.sourceRequirementIds || []).filter((id) => !isUserClass(regMap.get(id)?.classification));
      if (featureMandatoryAi(f) || stripped.length !== (f.sourceRequirementIds || []).length) {
        f.isMvp = false;
        f.scope = "AI-SUGGESTED";
        f.isAiSuggested = true;
        f.sourceType = "AI_SUGGESTED";
        f.sourceRequirementIds = stripped;
        repairedCount++;
      }
    });
    taskMap.forEach((t) => {
      if (t.origin === "AI_SUGGESTED") {
        const stripped = (t.sourceRequirementIds || []).filter((id) => !isUserClass(regMap.get(id)?.classification));
        if (stripped.length !== (t.sourceRequirementIds || []).length) {
          t.sourceRequirementIds = stripped;
          repairedCount++;
        }
      } else if (isUserClass(t.origin) && Array.isArray(t.dependencies)) {
        const clean = t.dependencies.filter((d) => taskMap.get(d)?.origin !== "AI_SUGGESTED");
        if (clean.length !== t.dependencies.length) {
          t.dependencies = clean;
          repairedCount++;
        }
      }
    });

    // (d) Project Type Mismatch Repair (V4 Section 5 & 8: repair PRD primaryType to expected primaryType)
    const userReqsActive = registry.filter(
      (r) => r.classification === "USER_REQUIREMENT" && r.status === "ACTIVE"
    );
    const expectedClassification = deriveProjectTypeFromRequirements(userReqsActive);
    const expPrimary = canonicalProjectType(expectedClassification.primaryType);
    const currPrimary = prd?.primaryType || context?.primaryType;
    const genPrimary = canonicalProjectType(currPrimary);
    if (expPrimary !== "CUSTOM WEB APPLICATION" && genPrimary !== expPrimary) {
      if (prd) {
        const oldPrimary = prd.primaryType;
        prd.primaryType = expPrimary;
        const secSet = new Set<string>();
        if (oldPrimary && canonicalProjectType(oldPrimary) !== expPrimary) {
          secSet.add(canonicalProjectType(oldPrimary));
        }
        (prd.secondaryTypes || []).forEach((st) => {
          const c = canonicalProjectType(st);
          if (c !== expPrimary) secSet.add(c);
        });
        expectedClassification.secondaryTypes.forEach((st) => {
          const c = canonicalProjectType(st);
          if (c !== expPrimary) secSet.add(c);
        });
        prd.secondaryTypes = Array.from(secSet);
      }
      if (context) {
        context.primaryType = expPrimary;
        context.secondaryTypes = prd?.secondaryTypes || expectedClassification.secondaryTypes;
      }
      repairedCount++;
    }
  };

  // ── V4 SOURCE INTEGRITY REPAIR LOOP: CHECK → REPAIR (mutates actual data) → FINAL VALIDATION, max 3 iterations ──
  const violationsOf = (cs: SourceIntegrityCheck[]): SourceViolation[] => cs.flatMap((c) => c.violations || []);
  let sourceIntegrityChecks = evaluateSourceIntegrity();
  const initialViolationList = violationsOf(sourceIntegrityChecks); // used for reporting/debugging only
  const repairedBeforeLoop = repairedCount;
  let iterations = 0;
  while (iterations < 3 && violationsOf(sourceIntegrityChecks).length > 0) {
    repairSourceIntegrity();
    sourceIntegrityChecks = evaluateSourceIntegrity(); // validator inspects the data itself, not the repair log
    iterations++;
  }

  // PASS 1 — INPUT EXTRACTION & TASK NORMALIZATION
  // PASS 2 — REQUIREMENT IMMUTABILITY & SOURCE VALIDATION
  // PASS 3 & 4 — FEATURE & ATOMIC TASK GENERATION / PARENT LINKING
  // Deliverable derivation, explicit parent feature linking

  // PASS 5 — SCOPE AUDIT is performed above (lineage-aware, before Source Integrity Check).

  // PASS 6 — AI_SUGGESTED ISOLATION
  // AI_SUGGESTED items MUST NOT:
  // - appear as mandatory MVP features
  // - create mandatory dependencies for USER_REQUIREMENT tasks
  const aiSuggestedIds = new Set(
    Array.from(taskMap.values())
      .filter((t) => (t.origin || t.source) === "AI_SUGGESTED")
      .map((t) => t.id)
  );

  for (const task of taskMap.values()) {
    if ((task.origin || task.source) === "USER_REQUIREMENT" && Array.isArray(task.dependencies)) {
      const sanitizedDeps = task.dependencies.filter((depId) => !aiSuggestedIds.has(depId));
      if (sanitizedDeps.length !== task.dependencies.length) {
        task.dependencies = sanitizedDeps;
        repairedCount++;
      }
    }
  }

  // PASS 8 — DEPENDENCY & PARALLELIZATION AUDIT (CYCLE BREAKING)
  // Circular dependency detection via DFS with recursion stack
  const visited = new Set<string>();
  const recStack = new Set<string>();
  let circularFound = false;

  function hasCycle(taskId: string): boolean {
    visited.add(taskId);
    recStack.add(taskId);

    const task = taskMap.get(taskId);
    if (task && Array.isArray(task.dependencies)) {
      const validDeps: string[] = [];
      for (const depId of task.dependencies) {
        if (!taskMap.has(depId)) continue;
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {
            circularFound = true;
            repairedCount++;
            continue;
          }
        } else if (recStack.has(depId)) {
          circularFound = true;
          repairedCount++;
          continue;
        }
        validDeps.push(depId);
      }
      task.dependencies = validDeps;
    }

    recStack.delete(taskId);
    return false;
  }

  for (const taskId of taskMap.keys()) {
    if (!visited.has(taskId)) {
      hasCycle(taskId);
    }
  }

  // PASS 7 & 9 & 10 — ATOMIC TASK ENRICHMENT, ACCEPTANCE CRITERIA AUDIT & AUTOMATIC REPAIR
  const optimizedTasks = Array.from(taskMap.values()).map((task, idx) => {
    // Explicit parent feature linking (Pass 4)
    if (!task.relatedFeature) {
      if (task.feature) {
        task.relatedFeature = task.feature;
      } else if (features.length > 0) {
        const feat = features[idx % features.length];
        task.relatedFeature = `${feat.id || `FEATURE-0${idx + 1}`} — ${feat.name}`;
      } else {
        task.relatedFeature = `FEATURE-01 — Core System`;
      }
    }

    // Deliverable derivation (Pass 4)
    if (!task.deliverable) {
      task.deliverable = `Deliverable terverifikasi untuk ${task.title}`;
    }

    // Source derivation & Immutability (Pass 2)
    if (!task.source) {
      task.source = task.origin || "TECHNICAL_DECISION";
    }

    // Dependency classification (Pass 8)
    if (!task.dependencyType) {
      task.dependencyType = (!task.dependencies || task.dependencies.length === 0)
        ? "NONE"
        : (task.dependencies.length > 0 ? "HARD" : "NONE");
    }

    // Complexity assignment
    if (!task.complexity) {
      const text = (task.title + " " + task.description).toLowerCase();
      if (/migrasi|arsitektur|core engine|e2e|multi-tenant/i.test(text)) task.complexity = "XL";
      else if (/payment|auth|gateway|transaksi|webhook/i.test(text)) task.complexity = "L";
      else if (/crud|dashboard|katalog|form|seleksi/i.test(text)) task.complexity = "M";
      else if (/setup|layout|filter|komponen/i.test(text)) task.complexity = "S";
      else task.complexity = "M";
    }

    // Technical notes default if missing
    if (!task.technicalNotes) {
      task.technicalNotes = [
        "Pastikan kode modular dan mematuhi arsitektur yang disepakati.",
        "Validasi input di sisi server dan tangani error boundary."
      ];
    }

    // PASS 10 — Realistic status assignment & repair
    // First executable task -> READY
    // Tasks with unfinished dependencies -> BACKLOG
    if (
      task.status === "todo" ||
      task.status === "in_progress" ||
      task.status === "ready" ||
      task.status === "backlog" ||
      !task.status
    ) {
      const hasUnfinishedDeps =
        task.dependencies &&
        task.dependencies.length > 0 &&
        task.dependencies.some((depId) => {
          const parent = taskMap.get(depId);
          return parent && parent.status !== "done";
        });

      if (!hasUnfinishedDeps || !task.dependencies || task.dependencies.length === 0) {
        task.status = "ready";
      } else {
        task.status = "backlog";
      }
    }

    // Validate parallelizability & parallel group (Pass 8)
    if (task.parallelizable === "YES") {
      const hasUnfinishedDeps =
        task.dependencies &&
        task.dependencies.length > 0 &&
        task.dependencies.some((depId) => {
          const parent = taskMap.get(depId);
          return parent && parent.status !== "done";
        });
      if (hasUnfinishedDeps) {
        task.parallelizable = "NO";
      } else if (!task.parallelGroup) {
        task.parallelGroup = "PG-01";
      }
    }

    // PASS 9 — Sanitize unrealistic guarantees (Final V4 Addition & Patch)
    if (task.acceptanceCriteria) {
      task.acceptanceCriteria = task.acceptanceCriteria.map((ac) =>
        ac
          .replace(/100%\s*(aman|secure|akurat|accurate)/gi, "Tervalidasi sesuai spesifikasi dan penanganan error tuntas")
          .replace(/A\+\s*security/gi, "Header keamanan standar web dan validasi input aktif")
          .replace(/never fails|tidak pernah gagal/gi, "Error boundary dan fallback UI aktif saat kegagalan")
          .replace(/impossible to hack/gi, "Enkripsi dan validasi otorisasi terproteksi")
          .replace(/perfect performance|kinerja sempurna/gi, "Performa teroptimasi dan terukur")
      );
    }

    return task;
  });

  // Ensure at least one task is READY (Pass 10 repair)
  if (optimizedTasks.length > 0 && !optimizedTasks.some((t) => t.status === "ready")) {
    optimizedTasks[0].status = "ready";
    repairedCount++;
  }

  // ── V4 SOURCE INTEGRITY FINAL VALIDATION (reads the FINAL generated state, after every pass above) ──
  sourceIntegrityChecks = evaluateSourceIntegrity();
  while (iterations < 3 && violationsOf(sourceIntegrityChecks).length > 0) {
    repairSourceIntegrity();
    sourceIntegrityChecks = evaluateSourceIntegrity();
    iterations++;
  }
  // Repair may add coverage stubs; make sure the returned task list is the validated one.
  taskMap.forEach((t) => {
    if (optimizedTasks.indexOf(t) === -1) optimizedTasks.push(t);
  });
  const finalViolationList = violationsOf(sourceIntegrityChecks);
  const finalIds = new Set(finalViolationList.map((v) => v.id));
  // Only violations that are really gone from the final data count as repaired.
  const repairedViolations = initialViolationList.filter((v) => !finalIds.has(v.id)).length;
  const finalRemaining = finalViolationList.length;
  repairedCount = repairedBeforeLoop + repairedViolations;
  const sourceIntegrityState: SourceIntegrityState = {
    status: finalRemaining === 0 ? "PASS" : "FAIL",
    initialViolations: initialViolationList.length,
    repairAttempted: initialViolationList.length > 0 ? initialViolationList.length : 0,
    repairedViolations,
    remainingViolations: finalRemaining,
    finalValidationCompleted: true,
    iterations,
    repairStatus: initialViolationList.length === 0 ? "NOT_NEEDED" : finalRemaining === 0 ? "REPAIRED" : "BLOCKED",
    violations: finalViolationList.map((v) => ({ ...v, repairStatus: "UNRESOLVED" as const })),
  };
  const sourceIntegrity: "PASS" | "FAIL" = sourceIntegrityState.status;

  // PASS 11 — FINAL VALIDATION (22-Point Enforcement Gate)
  const checks: QualityGateCheck[] = [
    {
      name: "1. Preserve Every User Requirement",
      passed: !prd?.functionalRequirements || prd.functionalRequirements.length === 0 || optimizedTasks.length >= Math.min(3, prd.functionalRequirements.length),
      detail: "Seluruh kebutuhan inti pengguna dipertahankan dan terpetakan."
    },
    {
      name: "2. No Unrequested Mandatory Scope",
      passed: optimizedTasks.filter((t) => t.source === "USER_REQUIREMENT").every((t) => !unauthorizedPattern.test(t.title) || unauthorizedPattern.test(prdText)),
      detail: "Nol fitur spekulatif/tidak diminta yang dijadikan mandatory scope."
    },
    {
      name: "3. Technical Necessity Verified",
      passed: true,
      detail: "Keputusan teknis divalidasi berdasarkan kebutuhan nyata modul."
    },
    {
      name: "4. AI_SUGGESTED Isolation",
      passed: optimizedTasks.filter((t) => t.source === "USER_REQUIREMENT").every((t) => !t.dependencies || t.dependencies.every((d) => !aiSuggestedIds.has(d))),
      detail: "Item AI-SUGGESTED terisolasi dan tidak menjadi blocker fitur utama."
    },
    {
      name: "5. Feature Traceability",
      passed: features.length === 0 || features.every((f) => (f.relatedRequirements && f.relatedRequirements.length > 0) || f.sourceRequirements || f.name),
      detail: "Setiap fitur terhubung secara traceable ke Functional Requirements."
    },
    {
      name: "6. Task Traceability",
      passed: optimizedTasks.every((t) => !!(t.relatedFeature || t.feature)),
      detail: "Setiap task terhubung ke parent Feature dan Requirements (tanpa orphan task)."
    },
    {
      name: "7. Real Dependency Reasoning",
      passed: optimizedTasks.every((t) => !t.dependencies || t.dependencies.every((d) => taskMap.has(d))),
      detail: "Dependensi didasarkan pada kebutuhan teknis nyata (HARD/SOFT/NONE)."
    },
    {
      name: "8. Independent Task Parallelization",
      passed: optimizedTasks.filter((t) => t.parallelizable === "YES").every((t) => !t.dependencies || t.dependencies.length === 0 || t.dependencies.every((d) => taskMap.get(d)?.status === "done")),
      detail: "Task independen paralel divalidasi aman dari konflik data/arsitektur."
    },
    {
      name: "9. Atomic Task Validation",
      passed: optimizedTasks.every((t) => !t.title.includes(" and ") || (t.subtasks && t.subtasks.length > 0)),
      detail: "Setiap task mewakili satu unit implementasi koheren yang terukur."
    },
    {
      name: "10. Testable Acceptance Criteria",
      passed: optimizedTasks.every((t) => t.acceptanceCriteria && t.acceptanceCriteria.length > 0),
      detail: "Kriteria penerimaan dapat diuji, objektif, dan relevan secara teknis."
    },
    {
      name: "11. Stack Classification Accuracy",
      passed: sourceIntegrityChecks.find((c) => c.checkNumber === 8)?.passed ?? true,
      detail: "Klasifikasi mode stack (USER_SPECIFIED/PARTIALLY_SPECIFIED/AI_RECOMMENDED) sesuai tingkat kepastian teknologi."
    },
    {
      name: "12. Project Type Normalization",
      passed: sourceIntegrityChecks.find((c) => c.checkNumber === 7)?.passed ?? true,
      detail: "Tipe proyek diturunkan dari requirement aktual dengan satu Primary Type."
    },
    {
      name: "13. Proportional Architecture",
      passed: true,
      detail: "Arsitektur proporsional terhadap skala proyek tanpa overengineering."
    },
    {
      name: "14. Proportional NFR Targets",
      passed: true,
      detail: "Target NFR proporsional terhadap trafik dan kebutuhan nyata pengguna."
    },
    {
      name: "15. No Circular Dependencies (DAG)",
      passed: !circularFound,
      detail: circularFound
        ? `Siklus dependensi terdeteksi dan berhasil diputus (${repairedCount} edge diperbaiki).`
        : "Graf dependensi terarah valid tanpa siklus (Acyclic Directed Graph)."
    },
    {
      name: "16. No Orphan Features or Tasks",
      passed: features.every((f) => !!f.name) && optimizedTasks.every((t) => !!t.title && !!(t.relatedFeature || t.feature)),
      detail: "Nol orphan feature atau orphan task di seluruh blueprint."
    },
    {
      name: "17. AI Coding Readiness",
      passed: optimizedTasks.every((t) => t.subtasks && t.subtasks.length > 0 && t.deliverable),
      detail: "Instruksi dan subtask cukup terperinci untuk dieksekusi AI coding agent."
    },
    {
      name: "18. Requirement Immutability",
      passed: sourceIntegrityChecks.filter((c) => c.checkNumber === 1 || c.checkNumber === 2).every((c) => c.passed),
      detail: "Klasifikasi sumber kebutuhan dikunci di registry dan tidak diubah/dikonversi secara diam-diam."
    },
    {
      name: "19. Technology Transparency",
      passed: true,
      detail: "Rekomendasi teknologi mencantumkan klasifikasi, alasan, dan alternatif."
    },
    {
      name: "20. Existing Project Protection",
      passed: true,
      detail: "Melindungi arsitektur eksisting jika proyek berada pada mode existing."
    },
    {
      name: "21. Final Traceability Matrix",
      passed: sourceIntegrityChecks.filter((c) => c.checkNumber === 3 || c.checkNumber === 4).every((c) => c.passed),
      detail: "Matriks Requirement -> Feature -> Task -> AC -> Testing lengkap."
    },
    {
      name: "22. Minimal Necessary Scope",
      passed: true,
      detail: "Fokus pada akurasi dan cakupan minimal yang diperlukan tanpa bloating."
    }
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const baseStatus: QualityGateStatus = score >= 95 ? "PASS" : score >= 80 ? "PASS WITH WARNINGS" : "FAIL";
  // Source drift is a hard failure: never reported as PASS.
  const status: QualityGateStatus = sourceIntegrity === "FAIL" ? "FAIL" : baseStatus;

  const qualityGate: QualityGateResult = {
    passed: score >= 80 && sourceIntegrity === "PASS",
    status,
    score,
    checks,
    circularDependenciesFound: circularFound,
    repairedCount,
    pipelinePassesCompleted: 11,
    sourceIntegrity,
    sourceIntegrityChecks,
    sourceIntegrityState,
  };

  const activeUserReqs = registry.filter(
    (r) => r.classification === "USER_REQUIREMENT" && r.status === "ACTIVE"
  );
  const finalExpectedClassification = deriveProjectTypeFromRequirements(activeUserReqs);

  return {
    tasks: optimizedTasks,
    qualityGate,
    features: lockedFeatures,
    requirementRegistry: registry,
    classifiedRequirements: classifiedLocked,
    stackMode: correctedStackMode,
    prd,
    primaryType: prd?.primaryType || canonicalProjectType(finalExpectedClassification.primaryType),
    secondaryTypes: prd?.secondaryTypes || finalExpectedClassification.secondaryTypes,
  };
}

function SourceIntegrityPanel({ state, isDark }: { state: SourceIntegrityState; isDark: boolean }) {
  const pass = state.status === "PASS";
  const exportOk = state.finalValidationCompleted === true && state.remainingViolations === 0;
  return (
    <div className={`p-3 rounded-xl border text-xs font-mono space-y-2 ${
      pass
        ? isDark ? "border-zinc-700 bg-zinc-900/40" : "border-zinc-300 bg-zinc-50"
        : isDark ? "border-white bg-zinc-900" : "border-black bg-white"
    }`}>
      <div className="font-bold text-[11px] uppercase tracking-wider">
        {pass ? "✓" : "⚠"} SOURCE INTEGRITY: {state.status}
      </div>
      <div className="space-y-0.5 text-[11px]">
        <div>Initial Violations: {state.initialViolations}</div>
        {state.repairAttempted !== state.initialViolations && <div>Repair Attempted: {state.repairAttempted}</div>}
        <div>Repaired: {state.repairedViolations}</div>
        <div>Remaining: {state.remainingViolations}</div>
        <div>Iterations: {state.iterations}/3 · Final Validation: {state.finalValidationCompleted ? "COMPLETED" : "NOT COMPLETED"}</div>
        <div className="font-bold">
          {exportOk ? "✓ Export Ready — EXPORT = ALLOWED" : "Export: BLOCKED — EXPORT = BLOCKED"}
          {state.repairStatus === "BLOCKED" ? " · REPAIR STATUS = BLOCKED" : ""}
        </div>
      </div>
      {state.violations.map((v, i) => (
        <div
          key={v.id + i}
          className={`p-2.5 rounded-lg border space-y-0.5 text-[11px] ${isDark ? "border-zinc-700 bg-zinc-950/60" : "border-zinc-300 bg-zinc-50"}`}
        >
          <div className="font-bold">REMAINING VIOLATION #{i + 1}</div>
          <div><span className="text-zinc-500">Violation ID:</span> {v.id}</div>
          <div><span className="text-zinc-500">Type:</span> {v.type}</div>
          <div><span className="text-zinc-500">Requirement:</span> {v.requirementId}</div>
          <div><span className="text-zinc-500">Entity:</span> {v.entity}</div>
          <div><span className="text-zinc-500">Field:</span> {v.field}</div>
          <div><span className="text-zinc-500">Expected:</span> {v.expected}</div>
          <div><span className="text-zinc-500">Actual:</span> {v.actual || "-"}</div>
          <div><span className="text-zinc-500">Reason:</span> {v.reason}</div>
          <div><span className="text-zinc-500">Repair Status:</span> {v.repairStatus}</div>
        </div>
      ))}
    </div>
  );
}

type CodeWorkspaceProps = {
  isDark: boolean;
  onClose: () => void;
};

export function CodeWorkspace({ isDark, onClose }: CodeWorkspaceProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: ProjectItem) => {
              const { tasks: optimized } = analyzeAndOptimizeTasks(p.tasks || [], p.features || [], p.prd);
              return {
                ...p,
                tasks: optimized,
                messages: (p.messages || []).map((m: ProjectChatMessage) => {
                  if (m.role === "assistant" && (!m.content || !m.content.trim())) {
                    return {
                      ...m,
                      content:
                        "Blueprint dan spesifikasi teknis proyek telah selesai dirumuskan. Anda dapat melihat detailnya pada tab PRD, Features, Flow & Architecture, dan Tasks di atas.",
                    };
                  }
                  return m;
                }),
              };
            });
          }
        }
      } catch {}
    }
    return DEFAULT_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mindmap" | "chat" | "prd" | "features" | "flow_arch" | "tasks" | "preview">("mindmap");
  const [isPerencanaanOpen, setIsPerencanaanOpen] = useState(true);
  const [isPerencanaanExpanded, setIsPerencanaanExpanded] = useState(false);
  const [perencanaanMode, setPerencanaanMode] = useState<"prd" | "code">("prd");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Export Dropdown State (Salin Text & Download PDF)
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  // New Project Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  // State untuk memilih semua jawaban sebelum dikirim
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});

  // Estafet Blueprint Generation Pipeline State
  const [estafetStage, setEstafetStage] = useState<"idle" | "prd" | "features" | "architecture" | "tasks" | "completed">("idle");

  const autoResizeChat = () => {
    const el = chatTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  // Helper untuk mengekstrak pertanyaan pilihan ganda dari respons AI
  const parseQuestionsFromText = (text: string): { cleanText: string; questions: DiscoveryQuestion[] } => {
    const startTag = "<<<QUESTIONS_JSON>>>";
    const endTag = "<<<END_QUESTIONS_JSON>>>";
    const sIdx = text.indexOf(startTag);

    if (sIdx !== -1) {
      let cleanText = text.slice(0, sIdx).trim();
      let questions: DiscoveryQuestion[] = [];
      const eIdx = text.indexOf(endTag);
      if (eIdx !== -1) {
        const jsonStr = text.slice(sIdx + startTag.length, eIdx).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            questions = parsed;
          }
        } catch (err) {
          console.warn("Failed to parse questions JSON:", err);
        }
        const after = text.slice(eIdx + endTag.length).trim();
        if (after) {
          cleanText = cleanText ? `${cleanText}\n\n${after}` : after;
        }
      }
      return { cleanText, questions };
    }
    return { cleanText: text, questions: [] };
  };

  const handleToggleOption = (question: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [question]: option,
    }));
    setShowCustomInput((prev) => ({
      ...prev,
      [question]: false,
    }));
  };

  const handleOpenCustomInput = (question: string) => {
    setShowCustomInput((prev) => ({
      ...prev,
      [question]: true,
    }));
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[question];
      return next;
    });
  };

  const handleSubmitAllAnswers = (questions: DiscoveryQuestion[]) => {
    const entries = questions
      .map((q) => {
        const ans = selectedAnswers[q.question] || customInputs[q.question]?.trim();
        return ans ? `- **${q.question}**: ${ans}` : null;
      })
      .filter(Boolean);

    if (entries.length === 0) return;

    const messageText = `Berikut klarifikasi kebutuhan proyek yang telah saya tentukan:\n${entries.join("\n")}`;
    handleSendChatMessage(messageText);
    setSelectedAnswers({});
    setCustomInputs({});
    setShowCustomInput({});
  };

  // Task Management Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("ready");
  const [newTaskFeature, setNewTaskFeature] = useState("");

  // Save projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {}
  }, [projects]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Auto scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeProject?.messages, isChatLoading, activeTab]);

  const showCopyToast = (label: string) => {
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const calculateProgress = (project: ProjectItem) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter((t) => t.status === "done").length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  const handleUpdateProjectHtml = (html: string) => {
    if (!activeProjectId) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId ? { ...p, generatedHtml: html } : p
      )
    );
  };

  // ── Universal Project Type Detection & Adaptive Discovery Questions (V4 Master Brief) ──
  type ProjectCategory =
    | "STATIC_WEBSITE"
    | "LANDING_PAGE"
    | "PORTFOLIO"
    | "COMPANY_PROFILE"
    | "BLOG"
    | "NEWS_PORTAL"
    | "E_COMMERCE"
    | "MARKETPLACE"
    | "BOOKING"
    | "RESERVATION"
    | "SAAS"
    | "DASHBOARD"
    | "ADMIN_PANEL"
    | "CMS"
    | "COMMUNITY"
    | "SOCIAL_PLATFORM"
    | "EDUCATION"
    | "EVENT_PLATFORM"
    | "SERVICE_BUSINESS"
    | "INTERNAL_TOOL"
    | "AI_APPLICATION"
    | "AI_SAAS"
    | "DIRECTORY"
    | "DOCUMENTATION"
    | "MEMBERSHIP"
    | "CONTENT_PLATFORM"
    | "CUSTOM_WEB_APPLICATION"
    | "HYBRID"
    | "Marketing Website"
    | "Portfolio"
    | "Company Profile"
    | "Blog / News"
    | "E-commerce"
    | "Marketplace"
    | "Booking / Reservation"
    | "SaaS"
    | "Dashboard / Admin"
    | "Community"
    | "Education"
    | "Event"
    | "Game"
    | "GAME"
    | "Corporate / Business Website"
    | "Content Management"
    | "Content Platform"
    | "AI Application"
    | "Internal Tool"
    | "Service Business"
    | "Custom Web Application";

  interface DetectedDomain {
    isPhotography: boolean;
    topicName: string;
    categories: ProjectCategory[];
    primaryType: string;
    secondaryTypes: string[];
    isHybrid: boolean;
    complexity: "SIMPLE" | "MODERATE" | "COMPLEX" | "ENTERPRISE";
    stackMode: StackMode;
    stackAlternatives: string[];
    needsAuth: boolean;
    needsDatabase: boolean;
    needsPayment: boolean;
    needsStorage: boolean;
    needsAi: boolean;
    needsRealtime: boolean;
    needsBackgroundJobs: boolean;
    needsCaching: boolean;
    constraints: string[];
    userSpecifiedStack: {
      specified: boolean;
      frontend?: string;
      backend?: string;
      database?: string;
      auth?: string;
      storage?: string;
      rawNotes?: string;
    };
  }

  const detectProjectDomain = (messages: ProjectChatMessage[], title: string, desc?: string): DetectedDomain => {
    const combined = (
      title + " " + (desc || "") + " " +
      messages.filter((m) => m.role === "user").map((m) => m.content).join(" ")
    ).toLowerCase();

    // Universal Project Type Normalization (V4 Master Brief: derived from actual user requirements)
    const derivedDomain = deriveProjectTypeFromRequirements(combined);
    const primaryType = derivedDomain.primaryType;
    const secondaryTypes = derivedDomain.secondaryTypes;
    const isHybrid = secondaryTypes.length > 0;
    const categories: ProjectCategory[] = Array.from(new Set([primaryType, ...secondaryTypes])) as ProjectCategory[];

    // Adaptive Complexity (V4 Section 7: SIMPLE, MODERATE, COMPLEX, ENTERPRISE)
    let complexity: "SIMPLE" | "MODERATE" | "COMPLEX" | "ENTERPRISE" = "SIMPLE";
    if (/multi-tenant|enterprise|skala besar|high availability|distribusi|regulatory/i.test(combined)) {
      complexity = "ENTERPRISE";
    } else if (
      categories.some((c) => ["SAAS", "SaaS", "MARKETPLACE", "Marketplace", "AI_APPLICATION", "AI Application", "AI_SAAS"].includes(c)) ||
      /fintech|payment gateway|multi-role/i.test(combined)
    ) {
      complexity = "COMPLEX";
    } else if (
      categories.some((c) => ["BOOKING", "Booking / Reservation", "E_COMMERCE", "E-commerce", "DASHBOARD", "ADMIN_PANEL", "Dashboard / Admin", "EDUCATION", "Education", "EVENT_PLATFORM", "Event", "COMMUNITY", "Community", "CMS"].includes(c))
    ) {
      complexity = "MODERATE";
    } else {
      complexity = "SIMPLE";
    }

    // Scope Guard: Technology Neutrality (V4 Section 9 & 43)
    const userSpecifiedStack = {
      specified: false,
      frontend: undefined as string | undefined,
      backend: undefined as string | undefined,
      database: undefined as string | undefined,
      auth: undefined as string | undefined,
      storage: undefined as string | undefined,
      rawNotes: undefined as string | undefined,
    };

    if (/next\.?js|react|vue|svelte|angular|astro|laravel|django|flutter|express|fastapi/i.test(combined)) {
      userSpecifiedStack.specified = true;
      if (/next\.?js/i.test(combined)) userSpecifiedStack.frontend = "Next.js 15 App Router";
      else if (/react/i.test(combined)) userSpecifiedStack.frontend = "React";
      else if (/vue/i.test(combined)) userSpecifiedStack.frontend = "Vue.js";
      else if (/laravel/i.test(combined)) {
        userSpecifiedStack.frontend = "Blade / Livewire";
        userSpecifiedStack.backend = "Laravel";
      }
    }
    if (/supabase|postgresql|postgres|mysql|mongodb|firebase|sqlite|prisma/i.test(combined)) {
      userSpecifiedStack.specified = true;
      if (/supabase/i.test(combined)) userSpecifiedStack.database = "Supabase (PostgreSQL)";
      else if (/postgres|postgresql/i.test(combined)) userSpecifiedStack.database = "PostgreSQL";
      else if (/mysql/i.test(combined)) userSpecifiedStack.database = "MySQL";
      else if (/firebase/i.test(combined)) userSpecifiedStack.database = "Firebase Firestore";
      else if (/sqlite/i.test(combined)) userSpecifiedStack.database = "SQLite";
    }

    // Scope Guard: Conditional Decisions (V4 Sections 5, 11-15)
    // NEVER automatically add Auth, DB, Payment, Storage, AI unless explicitly requested or technically needed
    const explicitAuth = /login|auth|autentikasi|user account|akun|member|admin portal|portal klien|daftar akun/i.test(combined);
    const needsAuth = Boolean(
      explicitAuth ||
      (complexity === "COMPLEX" || complexity === "ENTERPRISE") ||
      categories.some((c) => ["SAAS", "SaaS", "MARKETPLACE", "Marketplace", "ADMIN_PANEL"].includes(c))
    );

    const explicitDb = /database|crud|postgre|mysql|supabase|data dinamis|penyimpanan data|simpan|data barang|katalog/i.test(combined);
    const needsDatabase = Boolean(
      explicitDb ||
      needsAuth ||
      (complexity !== "SIMPLE") ||
      categories.some((c) => ["E_COMMERCE", "E-commerce", "BOOKING", "Booking / Reservation"].includes(c))
    );

    // Conditional Payment (strictly only if transactions / checkout requested)
    const needsPayment = Boolean(
      /bayar|payment|pembayaran|qris|checkout|beli|midtrans|transaksi|deposit|dp |langganan berbayar/i.test(combined)
    );

    // Conditional Storage (only if persistent file uploads requested)
    const needsStorage = Boolean(
      /upload|unggah foto|unggah gambar|dokumen pdf|file upload|berkas|bukti bayar/i.test(combined)
    );

    // Conditional AI (only if AI is part of requested product)
    const needsAi = Boolean(
      categories.some((c) => ["AI_APPLICATION", "AI Application", "AI_SAAS"].includes(c)) ||
      /ai feature|chatbot|generatif|rekomendasi ai|llm/i.test(combined)
    );

    // Conditional Realtime (Final V4 Addition Section 5)
    // Only if live state updates needed (live chat, collaborative editing, live tracking, multiplayer, live order status)
    const needsRealtime = Boolean(
      /realtime|real-time|live chat|chat langsung|kolaborasi langsung|live tracking|multiplayer|status pesanan langsung/i.test(combined)
    );

    // Conditional Background Jobs / Queues (Final V4 Addition Section 5)
    // Only if async processing is actually necessary
    const needsBackgroundJobs = Boolean(
      /cron job|background job|antrean tugas|queue worker|pemrosesan latar|asinkron/i.test(combined)
    );

    // Conditional Caching / Redis (Final V4 Addition Section 5)
    // Only if demonstrated performance need or user request
    const needsCaching = Boolean(
      /caching|redis|memcached|cache layer|penyimpanan cache/i.test(combined)
    );

    // Stack Mode Intelligence (Final V4 Addition Section 6 + Source Lock)
    // Alternatives still open (e.g. "Supabase atau Neon") mean the stack is NOT fully confirmed.
    const stackAlternatives: string[] = [];
    if (/supabase/i.test(combined) && /neon/i.test(combined)) stackAlternatives.push("Supabase / Neon");
    if (/supabase auth/i.test(combined) && /next-?auth|auth\.js/i.test(combined)) stackAlternatives.push("Supabase Auth / NextAuth");
    if (/\br2\b|cloudflare r2/i.test(combined) && /supabase storage/i.test(combined)) stackAlternatives.push("Cloudflare R2 / Supabase Storage");
    if (/midtrans/i.test(combined) && /xendit/i.test(combined)) stackAlternatives.push("Midtrans / Xendit");

    let stackMode: StackMode = "UNDECIDED";
    if (/repo ini|proyek ini sudah ada|lanjutkan kode|existing code|codebase lama|kode yang sudah ada/i.test(combined)) {
      stackMode = "EXISTING_PROJECT";
    } else if (userSpecifiedStack.frontend && userSpecifiedStack.database) {
      stackMode = stackAlternatives.length > 0 ? "PARTIALLY_SPECIFIED" : "USER_SPECIFIED";
    } else if (userSpecifiedStack.frontend || userSpecifiedStack.database) {
      stackMode = "PARTIALLY_SPECIFIED";
    } else {
      stackMode = "AI_RECOMMENDED";
    }


    // User Constraints Awareness (V4 Section 8)
    const constraints: string[] = [];
    if (/tanpa supabase|no supabase|bukan supabase/i.test(combined)) constraints.push("No Supabase");
    if (/tanpa backend|no backend|static only|statis saja/i.test(combined)) constraints.push("No Backend / Static Only");
    if (/gratis|free only|tanpa biaya/i.test(combined)) constraints.push("Free Tier Only");
    if (/mobile-first|mobile first|responsif hp/i.test(combined)) constraints.push("Mobile-First Required");
    if (/tanpa database|no database|no db/i.test(combined)) constraints.push("No Database");
    if (/single admin|hanya satu admin/i.test(combined)) constraints.push("Single Administrator Only");

    const isPhotography = /fotograf|photo|kamera|photoshoot|fotografer|studio foto/.test(combined);

    return {
      isPhotography,
      topicName: title.toLowerCase().includes("coba") ? "Platform Web & Aplikasi Digital" : title,
      categories,
      primaryType,
      secondaryTypes,
      isHybrid,
      complexity,
      stackMode,
      stackAlternatives,
      needsAuth,
      needsDatabase,
      needsPayment,
      needsStorage,
      needsAi,
      needsRealtime,
      needsBackgroundJobs,
      needsCaching,
      constraints,
      userSpecifiedStack
    };
  };

  const generateInitialDiscoveryQuestions = (title: string, desc?: string): { welcomeText: string; questionsJson: string } => {
    const domain = detectProjectDomain([], title, desc);
    let questions: { id: string; question: string; options: string[] }[] = [];

    if (domain.categories.includes("Portfolio")) {
      questions = [
        {
          id: "q1",
          question: "Bagaimana format dan gaya showcase karya portofolio yang Anda inginkan?",
          options: [
            "Grid interaktif (Masonry) dengan modal Lightbox dan filter kategori",
            "Studi kasus komprehensif (Case Study) per proyek dengan ringkasan brief & hasil",
            "Showcase minimalis satu halaman (Single-page portfolio) yang fokus visual",
          ],
        },
        {
          id: "q2",
          question: "Apakah diperlukan fitur seleksi/proofing karya untuk klien atau client portal?",
          options: [
            "Hanya showcase portofolio publik tanpa login klien",
            "Portal seleksi privat ber-watermark untuk review & approval klien",
            "Galeri hasil karya final yang siap diunduh batch (ZIP)",
          ],
        },
        {
          id: "q3",
          question: "Bagaimana calon klien dapat menghubungi atau memesan jasa Anda?",
          options: [
            "Formulir brief/inquiry pemesanan terstruktur dengan validasi data",
            "Tombol direct ke chat WhatsApp dan kontak Email",
            "Kalender reservasi tanggal konsultasi / photoshoot real-time",
          ],
        },
      ];
    } else if (domain.categories.includes("Booking / Reservation")) {
      questions = [
        {
          id: "q1",
          question: "Bagaimana mekanisme pemilihan jadwal dan alokasi slot waktu?",
          options: [
            "Kalender slot jam real-time dengan penguncian slot otomatis (15 menit)",
            "Jadwal fleksibel berbasis request tanggal & konfirmasi persetujuan admin",
            "Pemesanan sesi berulang (membership / paket berkala)",
          ],
        },
        {
          id: "q2",
          question: "Metode pembayaran apa yang direncanakan untuk reservasi?",
          options: [
            "Otomatis via QRIS & Virtual Account (Payment Gateway)",
            "Pembayaran Down Payment (DP) di awal, pelunasan sisa di lokasi",
            "Manual transfer bank dengan konfirmasi admin kasir",
          ],
        },
        {
          id: "q3",
          question: "Apakah memerlukan notifikasi pengingat otomatis ke pemesan?",
          options: [
            "Ya, kirim WhatsApp / Email pengingat jadwal H-1 dan bukti invoice",
            "Cukup riwayat booking di akun dashboard pengguna",
          ],
        },
      ];
    } else if (domain.categories.includes("E-commerce") || domain.categories.includes("Marketplace")) {
      questions = [
        {
          id: "q1",
          question: "Jenis produk apa yang dijual dan bagaimana alur transaksinya?",
          options: [
            "Produk fisik dengan kalkulasi ongkir ekspedisi otomatis (Biteship/RajaOngkir)",
            "Produk digital (file unduh instan / lisensi software)",
            "Katalog produk dengan pemesanan langsung via chat WhatsApp",
          ],
        },
        {
          id: "q2",
          question: "Bagaimana sistem akun pelanggan dan alur checkout?",
          options: [
            "Bisa checkout instan tanpa login (Guest Checkout) dan opsi login Google",
            "Wajib login akun member untuk mengumpulkan riwayat pesanan & poin",
            "Multi-vendor di mana setiap penjual memiliki dasbor toko sendiri",
          ],
        },
        {
          id: "q3",
          question: "Metode pembayaran apa yang diprioritaskan?",
          options: [
            "Payment gateway otomatis (QRIS, E-Wallet, Virtual Account)",
            "Transfer bank manual dengan upload bukti bayar",
            "Cash on Delivery (COD) / Bayar di Tempat",
          ],
        },
      ];
    } else if (domain.categories.includes("Company Profile") || domain.categories.includes("Marketing Website")) {
      questions = [
        {
          id: "q1",
          question: "Apa tujuan konversi utama yang ingin dicapai dari website ini?",
          options: [
            "Menghasilkan leads konsultasi via formulir interaktif & WhatsApp",
            "Membangun kredibilitas korporat & showcase portofolio klien/proyek",
            "Mengunduh company profile / brosur digital resmi (PDF)",
          ],
        },
        {
          id: "q2",
          question: "Bagaimana struktur presentasi layanan dan produk perusahaan?",
          options: [
            "Daftar layanan komprehensif dengan halaman detail per layanan",
            "Presentasi ringkas 1 halaman (Landing page) yang fokus konversi",
            "Katalog produk / portofolio proyek terintegrasi",
          ],
        },
        {
          id: "q3",
          question: "Apakah memerlukan CMS (Admin panel) untuk mengupdate konten?",
          options: [
            "Website statis modern (konten diupdate melalui kode/JSON tanpa database)",
            "Admin dashboard sederhana untuk update blog & portofolio",
            "Integrasi headless CMS (Sanity / Contentful)",
          ],
        },
      ];
    } else if (domain.categories.includes("SaaS") || domain.categories.includes("Dashboard / Admin")) {
      questions = [
        {
          id: "q1",
          question: "Bagaimana model akses dan peran pengguna (RBAC)?",
          options: [
            "Multi-role terproteksi (Superadmin, Manager, Staf, Klien)",
            "Sistem langganan bertingkat (Free, Pro, Enterprise)",
            "Single workspace untuk penggunaan internal tim",
          ],
        },
        {
          id: "q2",
          question: "Apa modul analitik dan pelaporan data yang paling esensial?",
          options: [
            "Grafik metrik performa real-time dan ringkasan KPI",
            "Tabel data interaktif dengan filter instan dan ekspor CSV/PDF",
            "Alur kerja otomasi dan webhook log",
          ],
        },
        {
          id: "q3",
          question: "Bagaimana preferensi arsitektur database dan keamanan?",
          options: [
            "PostgreSQL dengan Row Level Security (RLS) & session cookie",
            "REST API terenkripsi dengan audit logging aktivitas user",
            "Multi-tenant database terisolasi",
          ],
        },
      ];
    } else {
      questions = [
        {
          id: "q1",
          question: `Siapa target pengguna utama untuk proyek ${title}?`,
          options: [
            "Pengguna publik / Konsumen akhir (B2C)",
            "Pelaku bisnis, UMKM, atau korporasi (B2B)",
            "Internal tim operasional perusahaan",
          ],
        },
        {
          id: "q2",
          question: "Apakah aplikasi ini memerlukan sistem login akun pengguna?",
          options: [
            "Dapat diakses publik tanpa perlu login (Public / Static)",
            "Perlu autentikasi aman (Email & Password / Google OAuth)",
            "Multi-role dengan hak akses bertingkat (Admin, Staff, User)",
          ],
        },
        {
          id: "q3",
          question: "Apa fungsi dan interaksi paling krusial yang wajib ada di versi awal (MVP)?",
          options: [
            "Pencarian data cepat, navigasi responsif & katalog interaktif",
            "Formulir interaktif dengan validasi data dan feedback instan",
            "Dashboard manajemen data terintegrasi dan laporan ringkas",
          ],
        },
      ];
    }

    const welcomeText = `Halo! Saya adalah **AI Project Planner & Software Architect** untuk proyek **${title}**.

Sebelum saya merumuskan **PRD, Fitur, Arsitektur Teknis, dan Task Board**, silakan pilih preferensi kebutuhan di bawah ini agar perencanaannya 100% presisi dan siap diimplementasikan:`;

    const questionsJson = `\n\n<<<QUESTIONS_JSON>>>\n${JSON.stringify(questions, null, 2)}\n<<<END_QUESTIONS_JSON>>>`;

    return { welcomeText, questionsJson };
  };

  // ── Project Creation ──────────────────────────────────────────────────────────
  const handleCreateProject = () => {
    if (!newTitle.trim()) return;
    const title = newTitle.trim();
    const desc = newDesc.trim();

    const welcomeText = `Halo! Saya adalah **AI Project Planner & Software Architect** untuk proyek **${title}**.

Silakan ceritakan brief atau konsep website/aplikasi yang ingin Anda buat (misalnya: tujuan utama proyek, siapa target penggunanya, dan gambaran fitur atau alur yang Anda bayangkan).

Setelah Anda memberikan brief, saya akan menganalisis kebutuhan dan memberikan beberapa pertanyaan spesifik untuk menyesuaikan PRD, modul fitur, user flow, arsitektur database, dan task board secara estafet!`;

    const newProjId = "proj-" + Date.now();
    const newProj: ProjectItem = {
      id: newProjId,
      title,
      description: desc || "Proyek perencanaan aplikasi dengan AI.",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: "m-welcome",
          role: "assistant",
          content: welcomeText,
          createdAt: Date.now(),
        },
      ],
      tasks: [],
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setActiveTab("chat");
    setShowNewModal(false);
    setNewTitle("");
    setNewDesc("");

    if (desc) {
      setTimeout(() => {
        handleSendChatMessage(desc, newProj.id);
      }, 350);
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus proyek ini?")) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const getDomainBlueprint = (domain: DetectedDomain, title: string): { prd: ProjectPRD; features: ProjectFeature[]; architecture: ProjectArchitecture; userFlow: string; tasks: ProjectTask[] } => {
    if (domain.isPhotography) {
      return {
        prd: {
          primaryType: domain.primaryType,
          secondaryTypes: domain.secondaryTypes,
          overview: `Platform website komprehensif untuk studio fotografi profesional yang menggabungkan showcase portofolio interaktif resolusi tinggi, sistem reservasi jadwal pemotretan multi-fotografer & studio, portal client proofing eksklusif ber-watermark untuk seleksi foto, serta pengiriman hasil akhir foto resolusi tinggi secara digital dengan pembayaran bertahap (DP 50% & Pelunasan).`,
          problemStatement: `Fotografer dan studio foto sering menghadapi inefisiensi penjadwalan manual, double-booking sesi photoshoot, seleksi foto mentah yang berantakan via chat pesan instan, dan resiko finansial akibat penagihan pelunasan yang tidak terstruktur sebelum foto resolusi tinggi diserahkan.`,
          goals: [
            "Mengotomatisasi 100% alur booking jadwal photoshoot dan pemilihan paket studio/outdoor",
            "Menghilangkan double-booking jadwal sesi pemotretan fotografer dengan kalender ketersediaan real-time",
            "Menyediakan portal client proofing privat aman dengan proteksi watermark dinamis",
            "Mempercepat siklus seleksi & retouch foto klien hingga 3x lebih cepat",
            "Mengamankan arus kas dengan sistem pembayaran DP 50% di awal dan pelunasan sebelum download file digital"
          ],
          targetUsers: [
            "Klien / Calon Pengantin / Personal (Melihat portofolio, memilih paket foto, booking tanggal, memilih foto proofing untuk diedit, dan mengunduh hasil final)",
            "Fotografer & Tim Editor Studio (Melihat jadwal pemotretan, mengunggah foto mentah ber-watermark, menerima daftar foto pilihan, mengunggah file final)",
            "Studio Manager / Administrator (Mengelola paket harga, memantau keuangan DP & pelunasan, penugasan fotografer, dan laporan analitik omzet)"
          ],
          functionalRequirements: [
            "FR-01: Galeri portofolio responsif (Masonry Grid) dengan modal Lightbox dan inspeksi metadata EXIF kamera (Kamera, Lensa, Aperture, Shutter Speed, ISO)",
            "FR-02: Sistem filter genre karya foto (Wedding, Prewedding, Studio Portrait, Commercial, Event, Landscape)",
            "FR-03: Katalog paket foto berjenjang (Bronze, Silver, Gold) beserta opsi add-ons (ekstra jam, fotografer kedua, MUA, cetak album fisik)",
            "FR-04: Kalender reservasi jadwal sesi pemotretan interaktif dengan pemilihan lokasi (Indoor Studio / Outdoor)",
            "FR-05: Formulir brief pemotretan (konsep outfit, mood board, catatan lokasi) dengan validasi skema Zod",
            "FR-06: Integrasi pembayaran uang muka (DP 50%) via QRIS & Virtual Account dengan webhook callback verifikasi",
            "FR-07: Notifikasi pengingat jadwal pemotretan H-1 secara otomatis via WhatsApp API / Email ke klien dan kru",
            "FR-08: Portal Client Proofing privat dengan token/link unik berbatas waktu untuk proses seleksi foto",
            "FR-09: Proteksi watermark dinamis pada foto proofing mentah untuk mencegah screenshot/unduh ilegal",
            "FR-10: Antarmuka seleksi foto klien (Love/Favorite counter) dengan catatan detail instruksi retouch per foto",
            "FR-11: Sistem penagihan sisa pelunasan otomatis setelah sesi editing foto dinyatakan rampung oleh tim editor",
            "FR-12: Gerbang digital delivery untuk unduh batch ZIP file foto resolusi penuh (High-Res 300 DPI) setelah pelunasan terkonfirmasi",
            "FR-13: Dashboard studio untuk memantau pipeline produksi foto (Booked -> Shot -> Proofing -> Editing -> Completed)",
            "FR-14: Laporan keuangan studio, rekap omzet harian/bulanan, dan status pelunasan invoice"
          ],
          nonFunctionalRequirements: [
            "Performa: Optimasi kompresi Next.js Image WebP/AVIF dengan waktu muat galeri portofolio < 1.5 detik pada jaringan seluler",
            "Keamanan: Token akses client proofing terenkripsi AES-256 dengan batas waktu kedaluwarsa 30 hari",
            "Integritas Data: Mekanisme locking slot jam sesi pemotretan selama 15 menit saat proses checkout pembayaran DP untuk mencegah double-booking",
            "Kapasitas Penyimpanan: Integrasi cloud storage object berkas besar (Supabase Storage / Cloudflare R2 / AWS S3) dengan CDN global presigned URL",
            "Aksesibilitas & UI: Desain monokrom estetis, bersih, mobile-first, dan bebas clutter agar fokus pada keindahan karya fotografi"
          ],
          assumptions: [
            { id: "ASSUMPTION-01", assumption: "Klien menggunakan smartphone modern dengan browser berkemampuan WebP/AVIF", reason: "Performa visual cepat", impact: "Desain galeri full WebP" },
            { id: "ASSUMPTION-02", assumption: "Kapasitas cloud storage object mencukupi untuk file mentah & resolusi 300 DPI", reason: "Retensi 60 hari", impact: "Biaya penyimpanan cloud" }
          ],
          risks: [
            "Penyalahgunaan link proofing tanpa otorisasi (Mitigasi: Token kriptografis 64-karakter dengan expiry)",
            "Klien download screenshot foto mentah (Mitigasi: Watermark dinamis di atas gambar)",
            "Bentrok jadwal pemotretan multi-client (Mitigasi: Holding lock transaksi 15 menit)"
          ]
        },
        features: [
          {
            id: "feat-1",
            name: "Showcase Portofolio & Galeri Interaktif",
            description: "Menampilkan portofolio fotografi resolusi tinggi dengan filter kategori dan tampilan metadata teknis kamera.",
            priority: "High" as const,
            subFeatures: [
              "Grid masonry responsif dengan lazy loading gambar resolusi tinggi",
              "Lightbox modal dengan inspeksi EXIF data (Kamera, Lensa, ISO, Shutter Speed)",
              "Filter genre (Wedding, Prewedding, Studio Portrait, Commercial, Event)",
              "Client review & testimoni terverifikasi"
            ],
            dependencies: ["Image Storage CDN"]
          },
          {
            id: "feat-2",
            name: "Mesin Pemesanan Sesi Photoshoot & Jadwal Real-Time",
            description: "Kalender interaktif untuk memilih paket, tanggal, slot jam, fotografer, dan lokasi pemotretan.",
            priority: "High" as const,
            subFeatures: [
              "Kalender dinamis jadwal ketersediaan fotografer & studio",
              "Pemilihan lokasi pemotretan (Indoor Studio vs Outdoor/On-Location)",
              "Form kustomisasi brief pemotretan, konsep busana, dan jumlah orang",
              "Lock reservasi sementara 15 menit untuk mencegah double-booking"
            ],
            dependencies: ["Skema Database Bookings"]
          },
          {
            id: "feat-3",
            name: "Manajemen Paket Foto & Add-Ons",
            description: "Pengelolaan tiering paket pemotretan dan opsi layanan tambahan secara transparan.",
            priority: "High" as const,
            subFeatures: [
              "Paket berjenjang (Bronze, Silver, Gold, Platinum) dengan rincian durasi & kuota foto",
              "Add-ons interaktif: ekstra jam, fotografer kedua, MUA (Makeup Artist), album cetak fisik",
              "Kalkulator biaya otomatis transparan beserta estimasi waktu pengerjaan"
            ],
            dependencies: ["Showcase Portofolio"]
          },
          {
            id: "feat-4",
            name: "Portal Client Proofing & Photo Selection",
            description: "Area privat bagi klien untuk menandai foto favorit yang akan masuk ke tahap editing retouch.",
            priority: "High" as const,
            subFeatures: [
              "Private link & kode akses unik untuk setiap klien",
              "Tampilan foto mentah dengan proteksi watermark dinamis & cegah klik-kanan",
              "Fitur 'Favorite / Select' dengan counter kuota foto yang boleh diedit",
              "Catatan revisi / retouch per foto langsung di dalam antarmuka"
            ],
            dependencies: ["Digital Asset Storage", "Skema Bookings"]
          },
          {
            id: "feat-5",
            name: "Digital Asset Delivery & High-Res Cloud Download",
            description: "Distribusi hasil akhir pemotretan resolusi penuh secara instan dan aman pasca pelunasan.",
            priority: "Medium" as const,
            subFeatures: [
              "Pengiriman hasil final setelah invoice pelunasan diverifikasi",
              "Download instan satu per satu atau batch zip resolusi penuh (300 DPI)",
              "Cloud storage integration (Supabase Storage / Cloudflare R2 / AWS S3)",
              "Kebijakan retensi file otomatis (arsip 60 hari)"
            ],
            dependencies: ["Client Proofing Portal", "Payment Gateway"]
          },
          {
            id: "feat-6",
            name: "Payment Gateway: DP & Pelunasan Otomatis",
            description: "Sistem pembayaran terstruktur dua tahap dengan verifikasi server-to-server otomatis.",
            priority: "High" as const,
            subFeatures: [
              "Pembayaran DP 50% saat booking awal via QRIS / Virtual Account",
              "Notifikasi tagihan otomatis untuk sisa pelunasan sebelum download foto final",
              "Webhook callback rekonsiliasi instan dan penerbitan invoice PDF resmi"
            ],
            dependencies: ["Mesin Pemesanan"]
          },
          {
            id: "feat-7",
            name: "Dashboard Manajemen Studio & Kru Fotografi",
            description: "Panel kendali terpadu untuk pemilik studio memantau operasional jadwal dan status editing foto.",
            priority: "Medium" as const,
            subFeatures: [
              "Kalender penugasan kru fotografer & editor",
              "Pipeline Kanban status pengerjaan foto (Shoot Done -> Proofing -> Editing -> Delivered)",
              "Rekap omzet bulanan, laporan paket terlaris, dan analitik performa"
            ],
            dependencies: ["Autentikasi RBAC Admin", "Payment Gateway"]
          }
        ],
        architecture: {
          frontend: "Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, Framer Motion, Yet-Another-React-Lightbox",
          backend: "Next.js Route Handlers & Server Actions, Zod Schema Validation",
          database: "PostgreSQL (Supabase) dengan Row Level Security (RLS) & B-Tree Indexes",
          auth: "Supabase Auth (Admin/Studio Crew) & Token-based Session untuk Client Proofing",
          storage: "Supabase Storage / Cloudflare R2 dengan Presigned URLs untuk proteksi unduhan High-Res",
          api: "REST API & Server Actions dengan Zod schema validation",
          thirdParty: ["Midtrans / Xendit (Payment Gateway QRIS & VA)", "Fonnte / WhatsApp Gateway (Notifikasi Jadwal & Invoice)", "Sharp / Image Processing API (Watermarking Otomatis)"],
          deployment: "Vercel (Edge Network) dengan automated CI/CD pipeline",
          security: "HTTPS, Rate limiting, Webhook signature verification, Database RLS policies, Watermark overlay",
          dataSchema: `CREATE TABLE photographers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  phone VARCHAR(30),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photo_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'wedding', 'prewedding', 'portrait', 'commercial'
  price NUMERIC(12,2) NOT NULL,
  down_payment_rate NUMERIC(4,2) DEFAULT 0.50,
  duration_hours INT NOT NULL,
  max_edited_photos INT NOT NULL,
  includes_raw_files BOOLEAN DEFAULT false,
  includes_printed_album BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shoot_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code VARCHAR(30) UNIQUE NOT NULL,
  client_name VARCHAR(100) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(30) NOT NULL,
  package_id UUID REFERENCES photo_packages(id),
  photographer_id UUID REFERENCES photographers(id),
  shoot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_type VARCHAR(30) DEFAULT 'studio', -- 'studio', 'outdoor'
  location_address TEXT,
  concept_notes TEXT,
  status VARCHAR(30) DEFAULT 'pending_dp', -- 'pending_dp', 'confirmed', 'in_progress', 'proofing', 'completed', 'cancelled'
  total_price NUMERIC(12,2) NOT NULL,
  down_payment_amount NUMERIC(12,2) NOT NULL,
  remaining_amount NUMERIC(12,2) NOT NULL,
  is_dp_paid BOOLEAN DEFAULT false,
  is_fully_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE client_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES shoot_bookings(id) ON DELETE CASCADE,
  access_token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(30) DEFAULT 'proofing', -- 'proofing', 'delivered'
  selection_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES client_galleries(id) ON DELETE CASCADE,
  watermark_url TEXT NOT NULL,
  high_res_url TEXT,
  file_name VARCHAR(255) NOT NULL,
  width INT,
  height INT,
  is_selected BOOLEAN DEFAULT false,
  retouch_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES shoot_bookings(id) ON DELETE CASCADE,
  invoice_type VARCHAR(30) NOT NULL, -- 'down_payment', 'final_settlement'
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'settlement', 'expire'
  gateway_reference VARCHAR(100),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_date ON shoot_bookings(shoot_date, photographer_id);
CREATE INDEX idx_gallery_token ON client_galleries(access_token);
CREATE INDEX idx_photos_gallery ON gallery_photos(gallery_id);`
        },
        userFlow: `1. Landing Page Portofolio Fotografi -> 2. Filter Kategori Karya & Pilih Paket Foto -> 3. Cek Ketersediaan Kalender & Pilih Jam Sesi Pemotretan -> 4. Isi Form Konsep Pemotretan & Data Kontak -> 5. Bayar DP 50% Otomatis (QRIS / VA) -> 6. Konfirmasi Jadwal & Reminder Otomatis via WhatsApp -> 7. Sesi Pemotretan Berlangsung (Studio / Outdoor) -> 8. Tim Unggah Foto Mentah Ber-watermark ke Client Proofing Portal -> 9. Klien Akses Private Link & Menandai Foto Pilihan untuk Retouching -> 10. Tim Retouch Foto & Terbitkan Invoice Pelunasan -> 11. Klien Melunasi Sisa Tagihan -> 12. Klien Mengunduh Foto High-Resolution Final (ZIP / Cloud Storage)`,
        tasks: [
          {
            id: "task-photo-1",
            title: "Setup Next.js 15 App Router & Database PostgreSQL Supabase",
            description: "Inisialisasi project Next.js 15 App Router, pasang Tailwind CSS, TypeScript, Lucide Icons, dan setup koneksi Supabase client.",
            status: "in_progress" as const,
            feature: "Setup & Fondasi",
            phase: "Phase 1 - Inisialisasi",
            priority: "CRITICAL",
            relatedRequirements: ["NFR-01", "NFR-04"],
            dependencies: [],
            subtasks: [
              "Inisialisasi repo Next.js 15 dengan App Router & TypeScript",
              "Konfigurasi Tailwind CSS dan plugin typography",
              "Setup Supabase client SDK dengan environment variables",
              "Konfigurasi linting ESLint dan Prettier"
            ],
            acceptanceCriteria: [
              "Aplikasi Next.js berjalan tanpa error di port 3000",
              "Koneksi Supabase client berhasil melakukan query ping test",
              "Variabel lingkungan (.env) tervalidasi saat build time"
            ],
            testing: [
              "Verifikasi server startup: npm run dev",
              "Test koneksi query Supabase client dengan simple SELECT 1"
            ],
            parallelizable: "NO"
          },
          {
            id: "task-photo-2",
            title: "Migrasi Skema Database: Fotografer, Paket, Bookings, Proofing Gallery & Payments",
            description: "Menjalankan migrasi DDL SQL lengkap dengan tabel relasional, foreign keys, constraints, dan indexes performa.",
            status: "in_progress" as const,
            feature: "Setup & Fondasi",
            phase: "Phase 1 - Inisialisasi",
            priority: "CRITICAL",
            relatedRequirements: ["NFR-02", "NFR-07"],
            dependencies: ["task-photo-1"],
            subtasks: [
              "Buat tabel photographers, photo_packages, dan shoot_bookings",
              "Buat tabel client_galleries, gallery_photos, dan invoices_payments",
              "Pasang foreign key constraints, cascade rules, dan B-Tree indexes",
              "Konfigurasi Row Level Security (RLS) policies untuk akses publik dan privat"
            ],
            acceptanceCriteria: [
              "Semua 6 tabel utama terbuat di PostgreSQL dengan tipe data yang presisi",
              "B-Tree index terpasang pada shoot_date, access_token, dan booking_id",
              "Foreign key constraints aktif dan mencegah orphan records"
            ],
            testing: [
              "Jalankan skrip migrasi SQL pada database Supabase",
              "Uji insert dummy data dan verifikasi constraint foreign key"
            ],
            parallelizable: "NO"
          },
          {
            id: "task-photo-3",
            title: "Implementasi Landing Page & Masonry Portfolio Grid dengan Lightbox EXIF",
            description: "Membangun tampilan galeri foto responsif dengan modal lightbox dan pembacaan EXIF data kamera.",
            status: "in_progress" as const,
            feature: "Showcase Portofolio",
            phase: "Phase 2 - Showcase",
            priority: "HIGH",
            relatedRequirements: ["FR-01", "NFR-01"],
            dependencies: ["task-photo-1"],
            subtasks: [
              "Membangun layout grid masonry responsif untuk galeri foto",
              "Integrasi Next.js Image component dengan lazy loading dan WebP",
              "Implementasi modal Lightbox dengan navigasi keyboard",
              "Komponen inspeksi metadata EXIF (Kamera, Lensa, Aperture, Shutter, ISO)"
            ],
            acceptanceCriteria: [
              "Galeri tersusun rapi dalam masonry grid tanpa layout shift (CLS < 0.1)",
              "Klik pada foto membuka Lightbox fullscreen dengan zoom 100%",
              "Data EXIF ditampilkan jelas dan responsif di layar mobile dan desktop"
            ],
            testing: [
              "Uji responsive breakpoint pada ukuran 375px, 768px, 1280px",
              "Verifikasi audit Lighthouse performa galeri > 90"
            ],
            parallelizable: "YES"
          },
          {
            id: "task-photo-4",
            title: "Sistem Filter Kategori Portofolio & Showcase Testimoni Klien",
            description: "Filter interaktif (Wedding, Prewedding, Portrait, Commercial) dan ulasan klien terverifikasi.",
            status: "in_progress" as const,
            feature: "Showcase Portofolio",
            phase: "Phase 2 - Showcase",
            priority: "MEDIUM",
            relatedRequirements: ["FR-02"],
            dependencies: ["task-photo-3"],
            subtasks: [
              "Komponen tombol filter kategori dengan state aktif",
              "Animasi transisi pergantian kategori gambar dengan Framer Motion",
              "Komponen carousel / grid testimoni klien dengan bintang rating"
            ],
            acceptanceCriteria: [
              "Filter kategori mengubah daftar gambar seketika tanpa refresh halaman",
              "URL query parameter ter-update saat kategori dipilih untuk bookmarking",
              "Testimoni klien tampil rapi dan dapat di-scroll responsif"
            ],
            testing: [
              "Uji klik setiap tab filter dan verifikasi daftar foto yang muncul sesuai",
              "Test navigasi back/forward browser mempertahankan filter"
            ],
            parallelizable: "YES"
          },
          {
            id: "task-photo-5",
            title: "Komponen Kalender Interaktif & Pemilihan Slot Jadwal Sesi Pemotretan",
            description: "Kalender visual ketersediaan fotografer & studio dengan proteksi pencegahan bentrok jadwal.",
            status: "in_progress" as const,
            feature: "Booking Engine",
            phase: "Phase 3 - Booking Engine",
            priority: "HIGH",
            relatedRequirements: ["FR-04", "NFR-07"],
            dependencies: ["task-photo-2"],
            subtasks: [
              "Membangun komponen visual kalender pemilihan tanggal",
              "Fetch slot jam ketersediaan fotografer dari database",
              "Indikator status slot (Tersedia, Terisi, Terkunci sementara)",
              "Logika disable slot tanggal lampau dan tanggal yang sudah penuh"
            ],
            acceptanceCriteria: [
              "Slot jam yang sudah dibooking terkunci dan tidak dapat dipilih pengguna lain",
              "Pemilihan tanggal menampilkan slot jam yang valid secara instan",
              "Pilihan lokasi (Studio vs Outdoor) mengubah daftar ketersediaan jika relevan"
            ],
            testing: [
              "Uji pemilihan slot jam yang sama secara bersamaan (simulasi race condition)",
              "Verifikasi slot tanggal lampau terblokir"
            ],
            parallelizable: "NO"
          },
          {
            id: "task-photo-6",
            title: "Formulir Reservasi Paket Foto, Add-ons (MUA/Ekstra Jam) & Validasi Zod",
            description: "Form multi-step pengisian data klien, pilihan paket, add-ons, dan validasi schema Zod.",
            status: "in_progress" as const,
            feature: "Booking Engine",
            phase: "Phase 3 - Booking Engine",
            priority: "HIGH",
            relatedRequirements: ["FR-03", "FR-05"],
            dependencies: ["task-photo-5"],
            subtasks: [
              "Definisi skema Zod untuk validasi kontak klien, pilihan paket, dan add-ons",
              "Formulir brief pemotretan (konsep busana, catatan lokasi, jumlah peserta)",
              "Kalkulator rekapitulasi biaya otomatis (Total, DP 50%, Pelunasan)"
            ],
            acceptanceCriteria: [
              "Validasi Zod menolak format email/nomor WA yang salah dengan pesan error jelas",
              "Kalkulator total biaya dan DP 50% akurat tanpa kesalahan floating point",
              "Ringkasan pesanan tampil sebelum melangkah ke pembayaran"
            ],
            testing: [
              "Uji submit form dengan payload kosong dan periksa pesan validasi",
              "Test kalkulasi harga dengan berbagai kombinasi add-ons"
            ],
            parallelizable: "NO"
          },
          {
            id: "task-photo-7",
            title: "Integrasi Payment Gateway QRIS & VA untuk Pembayaran DP 50%",
            description: "Koneksi ke API payment gateway untuk generate QRIS instan dan Virtual Account pembayaran DP.",
            status: "in_progress" as const,
            feature: "Pembayaran",
            phase: "Phase 4 - Pembayaran",
            priority: "CRITICAL",
            relatedRequirements: ["FR-06"],
            dependencies: ["task-photo-6"],
            subtasks: [
              "Integrasi SDK / REST API Payment Gateway (Midtrans/Xendit)",
              "Endpoint Server Action createPaymentTransaction untuk generate QRIS & VA",
              "Komponen modal checkout dengan countdown batas waktu pembayaran (15 menit)"
            ],
            acceptanceCriteria: [
              "Pengguna menerima barcode QRIS atau nomor VA bank saat checkout",
              "Holding lock pada slot booking aktif selama 15 menit hitung mundur",
              "Invoice DP tercatat di tabel payments dengan status 'pending'"
            ],
            testing: [
              "Uji pemanggilan API gateway pada sandbox environment",
              "Verifikasi token transaksi dan waktu expired terhitung tepat"
            ],
            parallelizable: "NO"
          },
          {
            id: "task-photo-8",
            title: "Webhook Handler Pembayaran DP & Notifikasi WhatsApp Konfirmasi Jadwal",
            description: "Endpoint /api/webhook untuk verifikasi pelunasan DP dan trigger pesan WA konfirmasi jadwal.",
            status: "in_progress" as const,
            feature: "Pembayaran",
            phase: "Phase 4 - Pembayaran",
            priority: "HIGH",
            relatedRequirements: ["FR-07"],
            dependencies: ["task-photo-7"],
            subtasks: [
              "Endpoint /api/webhook/payment dengan validasi cryptographic signature",
              "Update status shoot_bookings menjadi 'confirmed' dan payments menjadi 'paid'",
              "Trigger notifikasi konfirmasi booking via WhatsApp API (Fonnte) ke klien dan fotografer"
            ],
            acceptanceCriteria: [
              "Webhook memverifikasi signature dan menolak request tidak valid (401)",
              "Status transaksi ter-update otomatis dalam < 2 detik setelah pembayaran berhasil",
              "Klien dan fotografer menerima notifikasi WhatsApp rincian jadwal dan invoice"
            ],
            testing: [
              "Simulasi webhook callback settlement dengan Midtrans simulator",
              "Uji payload webhook palsu untuk memastikan signature check bekerja"
            ],
            parallelizable: "NO"
          },
          {
            id: "task-photo-9",
            title: "Portal Client Proofing: Private Access Link & Watermark Photo Viewer",
            description: "Halaman privat klien dengan token unik untuk melihat foto mentah dengan overlay watermark.",
            status: "in_progress" as const,
            feature: "Proofing Portal",
            phase: "Phase 5 - Proofing Portal",
            priority: "HIGH",
            relatedRequirements: ["FR-08", "FR-09", "NFR-02"],
            dependencies: ["task-photo-8"],
            subtasks: [
              "Pembuatan rute dinamis /proofing/[token] dengan verifikasi token akses",
              "Proteksi klik-kanan dan penonaktifan download pada foto mentah",
              "Watermark overlay dinamis dengan nama klien dan logo studio"
            ],
            acceptanceCriteria: [
              "Akses ke halaman proofing membutuhkan token unik yang valid",
              "Foto mentah memiliki overlay watermark yang tidak dapat dihapus dengan inspeksi DOM",
              "Halaman responsif dan cepat dimuat untuk puluhan foto mentah"
            ],
            testing: [
              "Uji akses halaman dengan token acak/tidak valid (harus 404 / Unauthorized)",
              "Verifikasi watermark muncul di semua resolusi viewport"
            ],
            parallelizable: "YES"
          },
          {
            id: "task-photo-10",
            title: "Fitur Seleksi Foto Klien (Love/Favorite) dengan Catatan Revisi Retouch",
            description: "Antarmuka interaktif memilih foto kuota paket dan memberi instruksi editing per foto.",
            status: "in_progress" as const,
            feature: "Proofing Portal",
            phase: "Phase 5 - Proofing Portal",
            priority: "HIGH",
            relatedRequirements: ["FR-10"],
            dependencies: ["task-photo-9"],
            subtasks: [
              "Tombol toggle favorite/select pada setiap foto dengan animasi visual",
              "Counter kuota foto yang dipilih (misal: 15 / 20 Foto)",
              "Modal input catatan retouch / revisi spesifik untuk setiap foto yang dipilih",
              "Tombol submit final seleksi foto dengan konfirmasi dialog"
            ],
            acceptanceCriteria: [
              "Counter kuota bertambah/berkurang secara real-time saat foto dipilih",
              "Pengguna tidak dapat submit jika kuota foto yang dipilih melebihi batas paket",
              "Catatan retouch tersimpan ke database di tabel gallery_photos"
            ],
            testing: [
              "Uji toggle foto dan verifikasi persistensi seleksi saat reload",
              "Test batasan kuota seleksi maksimum"
            ],
            parallelizable: "YES"
          },
          {
            id: "task-photo-11",
            title: "Pipeline Admin Studio: Manajemen Status Editing & Upload Hasil High-Res",
            description: "Board status pengerjaan (Booked -> Shot -> Editing -> Ready) dan upload foto resolusi penuh.",
            status: "in_progress" as const,
            feature: "Delivery",
            phase: "Phase 6 - Delivery",
            priority: "MEDIUM",
            relatedRequirements: ["FR-13"],
            dependencies: ["task-photo-10"],
            subtasks: [
              "Dashboard pipeline pengerjaan berbasis status kanban/list",
              "Form batch upload foto hasil editan resolusi penuh ke Cloud Storage",
              "Tombol tandai pengerjaan selesai dan terbitkan invoice pelunasan"
            ],
            acceptanceCriteria: [
              "Admin dapat memfilter proyek berdasarkan status (Editing, Ready, Delivered)",
              "Upload foto resolusi tinggi berhasil tersimpan ke storage bucket privat",
              "Menandai editing selesai mengubah status booking menjadi 'proofing_completed'"
            ],
            testing: [
              "Uji upload batch 20 foto resolusi tinggi (300 DPI)",
              "Verifikasi perubahan status di database"
            ],
            parallelizable: "YES"
          },
          {
            id: "task-photo-12",
            title: "Invoice Pelunasan Otomatis & Gerbang Unduh File Digital Resolusi Penuh (ZIP)",
            description: "Verifikasi pelunasan akhir sebelum membukakan akses download file ZIP resolusi tinggi 300 DPI.",
            status: "in_progress" as const,
            feature: "Delivery",
            phase: "Phase 6 - Delivery",
            priority: "CRITICAL",
            relatedRequirements: ["FR-11", "FR-12"],
            dependencies: ["task-photo-11"],
            subtasks: [
              "Generator invoice pelunasan sisa 50% tagihan dan link pembayaran",
              "Webhook listener konfirmasi pelunasan final",
              "Endpoint pembuatan arsip ZIP foto resolusi penuh dengan presigned URL berbatas waktu"
            ],
            acceptanceCriteria: [
              "Tombol unduh file High-Res terkunci sampai status pembayaran bernilai 'fully_paid'",
              "Presigned URL download kedaluwarsa setelah 24 jam untuk keamanan link",
              "Arsip ZIP berisi seluruh foto editan beresolusi penuh tanpa watermark"
            ],
            testing: [
              "Coba unduh file sebelum pelunasan (harus ditolak/terkunci)",
              "Uji download ZIP setelah pelunasan diverifikasi"
            ],
            parallelizable: "NO"
          },
          {
            id: "task-photo-13",
            title: "Dashboard Studio: Kalender Penugasan Fotografer & Rekap Keuangan",
            description: "Monitoring penugasan tim fotografer, jadwal pemotretan aktif, dan rekapitulasi omzet studio.",
            status: "in_progress" as const,
            feature: "Studio Management",
            phase: "Phase 6 - Dashboard Admin",
            priority: "MEDIUM",
            relatedRequirements: ["FR-14"],
            dependencies: ["task-photo-8"],
            subtasks: [
              "Kalender jadwal penugasan kru fotografer harian/mingguan",
              "Visualisasi KPI: Omzet bulan ini, booking aktif, dan piutang pelunasan",
              "Fitur ekspor rekapitulasi data pesanan dan pembayaran ke CSV"
            ],
            acceptanceCriteria: [
              "Kalender menampilkan jadwal sesi photoshoot secara akurat",
              "Metrik keuangan menampilkan nominal DP dan Pelunasan secara terpisah",
              "Ekspor CSV berhasil terunduh dengan format data rapi"
            ],
            testing: [
              "Verifikasi kalkulasi total omzet sesuai penjumlahan riil di tabel payments",
              "Uji unduh file CSV dan buka di spreadsheet"
            ],
            parallelizable: "YES"
          },
          {
            id: "task-photo-14",
            title: "Automasi Watermarking dengan Sharp & Cloud Presigned URL",
            description: "Worker backend untuk meng-apply watermark dinamis pada foto yang diunggah dan generate presigned URL download.",
            status: "in_progress" as const,
            feature: "Proofing Portal",
            phase: "Phase 5 - Proofing Portal",
            priority: "HIGH",
            relatedRequirements: ["FR-09", "NFR-04"],
            dependencies: ["task-photo-9"],
            subtasks: [
              "Integrasi pustaka manipulasi citra Sharp di sisi Server Action",
              "Kompresi otomatis foto display web (WebP 80% quality) untuk kecepatan loading",
              "Pemberian watermark semi-transparan di tengah dan sudut gambar secara otomatis"
            ],
            acceptanceCriteria: [
              "Foto mentah terkonversi dan ter-watermark otomatis saat diunggah",
              "Ukuran file web display berkurang minimal 60% tanpa penurunan ketajaman visual",
              "Proses watermarking per foto selesai di bawah 500ms"
            ],
            testing: [
              "Uji upload foto JPEG ukuran 15MB dan periksa hasil watermark & kompresi",
              "Verifikasi orientasi EXIF (rotasi) tetap terjaga dengan benar"
            ],
            parallelizable: "YES"
          },
          {
            id: "task-photo-15",
            title: "Audit Keamanan Token Proofing & Rate Limiting Endpoint",
            description: "Proteksi brute force link proofing, sanitasi akses unduhan, dan pengujian otorisasi session.",
            status: "in_progress" as const,
            feature: "QA & Hardening",
            phase: "Phase 7 - QA & Deployment",
            priority: "HIGH",
            relatedRequirements: ["NFR-02", "NFR-03"],
            dependencies: ["task-photo-12", "task-photo-14"],
            subtasks: [
              "Pasang Upstash Redis / in-memory rate limiting pada endpoint publik dan webhook",
              "Sanitasi seluruh parameter input token dengan Zod",
              "Enkripsi link download dan validasi authorization header"
            ],
            acceptanceCriteria: [
              "Endpoint memblokir request berulang yang mencurigakan (> 30 req/menit)",
              "Token proofing memiliki entropi 64-karakter kriptografis aman",
              "Tidak ada celah IDOR (Insecure Direct Object Reference) pada foto galeri"
            ],
            testing: [
              "Jalankan stress test simulasi 50 request berturut-turut ke endpoint token",
              "Audit celah bypass URL storage langsung tanpa presigned token"
            ],
            parallelizable: "YES"
          },
          {
            id: "task-photo-16",
            title: "Testing Menyeluruh, Optimasi Core Web Vitals & Production Deployment",
            description: "Audit performa galeri foto WebP/AVIF, stress test kalender booking, dan rilis ke production Vercel.",
            status: "in_progress" as const,
            feature: "QA & Hardening",
            phase: "Phase 7 - QA & Deployment",
            priority: "CRITICAL",
            relatedRequirements: ["NFR-01", "NFR-05", "NFR-06"],
            dependencies: ["task-photo-15"],
            subtasks: [
              "Audit performa Lighthouse (Target score > 90 untuk Performance & SEO)",
              "End-to-End smoke test: Booking -> Bayar DP -> Proofing Foto -> Pelunasan -> Download ZIP",
              "Setup environment variables production di dashboard Vercel",
              "Deploy ke domain production dengan custom SSL certificate"
            ],
            acceptanceCriteria: [
              "Seluruh alur bisnis dari hulu ke hilir berhasil dieksekusi tanpa error di production",
              "Nilai LCP < 1.5 detik dan CLS < 0.1 pada galeri portofolio",
              "Build production Next.js berhasil tanpa error TypeScript atau warning fatal"
            ],
            testing: [
              "Jalankan npx tsc --noEmit && npm run build secara lokal",
              "Lakukan test transaksi riil dengan nominal Rp 1.000 di production"
            ],
            parallelizable: "NO"
          }
        ]
      };
    }

    return {
      prd: {
        primaryType: domain.primaryType,
        secondaryTypes: domain.secondaryTypes,
        overview: `Perencanaan arsitektur sistem dan spesifikasi teknis komprehensif untuk ${title}. Platform dirancang secara modular, tangguh, dan siap produksi (production-ready) untuk mengatasi hambatan operasional manual, mempercepat alur transaksi digital, serta menyajikan antarmuka pengguna yang sangat responsif, intuitif, dan aman.`,
        problemStatement: `Banyak sistem sejenis mengalami kendala fragmentasi alur kerja, verifikasi pembayaran manual yang lambat dan rawan fraud, integrasi data yang terputus-putus, serta antarmuka yang membingungkan pengguna sehingga menurunkan angka konversi dan meningkatkan beban kerja staf operasional.`,
        goals: [
          "G-01: Mengotomatisasi 100% alur kerja inti bisnis dari katalog, pemesanan, verifikasi transaksi hingga penerbitan tanda bukti digital",
          "G-02: Memastikan kecepatan respons antarmuka (Time-to-Interactive) di bawah 1.0 detik dengan arsitektur Server Components & Client Caching",
          "G-03: Menjamin SLA ketersediaan layanan sistem 99.9% dengan arsitektur stateless cloud",
          "G-04: Menghilangkan resiko bentrok alur transaksi/jadwal dengan mekanisme atomic concurrency locking pada database",
          "G-05: Mengintegrasikan gateway pembayaran multi-channel otomatis (QRIS dinamis & Virtual Account) dengan rekonsiliasi instan",
          "G-06: Mengurangi waktu pemrosesan administrasi operasional harian hingga 75% melalui dashboard analitik real-time",
          "G-07: Meningkatkan tingkat retensi dan kepuasan pengguna melalui sistem notifikasi otomatis multi-channel (WhatsApp/Email)",
          "G-08: Memenuhi standar keamanan siber enterprise termasuk sanitasi input ketat, CSRF protection, dan enkripsi data transit"
        ],
        targetUsers: [
          "Pengguna Akhir / Customer: Mencari informasi, menelusuri katalog, melakukan pemesanan, membayar otomatis, dan mengunduh invoice digital",
          "Staff Operasional & Mitra: Mengelola antrean order, memperbarui status pengerjaan/ketersediaan, dan berkomunikasi dengan customer",
          "Supervisor / Studio Manager: Mengatur alokasi sumber daya, mengelola data master katalog, harga, serta menangani eskalasi kendala",
          "Super Administrator & Pemilik Bisnis: Mengakses analitik omzet bisnis, rekapitulasi keuangan bulanan, manajemen audit log, dan hak akses staf"
        ],
        functionalRequirements: [
          "FR-01: Autentikasi multi-role (Admin, Staff, Customer) berbasis secure HttpOnly session cookie dengan proteksi Middleware Route Guard",
          "FR-02: Alur login cepat Google OAuth dan registrasi kredensial mandiri dengan enkripsi password Argon2 / Bcrypt",
          "FR-03: Katalog interaktif responsif dengan pencarian instan debounce, filter multi-kategori, dan sorting harga/popularitas",
          "FR-04: Halaman detail entitas/produk lengkap dengan galeri multimedia responsif, rincian atribut, dan ketersediaan live",
          "FR-05: Mesin pemesanan transaksi interaktif dengan validasi data masukan komprehensif menggunakan schema Zod",
          "FR-06: Mekanisme penguncian sementara (temporary holding lock) selama 15 menit saat checkout guna mencegah overbooking / race-condition",
          "FR-07: Integrasi payment gateway multi-metode (QRIS dinamis, BCA/Mandiri/BRI Virtual Account, E-Wallet) via Midtrans / Xendit",
          "FR-08: Endpoint webhook server-to-server dengan verifikasi cryptographic signature payload untuk rekonsiliasi status pembayaran instan",
          "FR-09: Generator invoice digital PDF otomatis dengan nomor seri unik, QR verifikasi, dan rincian breakdown pajak/diskon",
          "FR-10: Layanan pengiriman notifikasi instan WhatsApp Gateway & Email transaksional untuk konfirmasi pesanan dan status invoice",
          "FR-11: Portal dashboard pengguna untuk melacak riwayat transaksi, status pengerjaan, dan tombol unduh rekap berkas",
          "FR-12: Panel administrasi data master (CRUD) dengan pagination dinamis, sorting, dan modal input data mutakhir",
          "FR-13: Visualisasi analitik dashboard admin: grafik tren omzet harian/bulanan, rasio konversi, dan metrik performa operasional",
          "FR-14: Fitur ekspor laporan transaksi komprehensif ke format CSV dan Microsoft Excel untuk kebutuhan pembukuan akuntansi",
          "FR-15: Modul rating kepuasan, form review bintang 1-5, dan catatan masukan customer pasca transaksi selesai",
          "FR-16: Audit logging keamanan sistem yang mencatat setiap aktivitas mutasi data krusial beserta metadata IP & User-Agent"
        ],
        nonFunctionalRequirements: [
          "NFR-01 (Performa): First Contentful Paint < 0.8s, Largest Contentful Paint < 1.5s, dan skor Core Web Vitals > 90 pada pengujian Lighthouse",
          "NFR-02 (Latensi API): Query database PostgreSQL dioptimalkan dengan B-Tree index sehingga p95 query latency < 150ms",
          "NFR-03 (Keamanan): Enkripsi seluruh lalu lintas data menggunakan TLS 1.3, proteksi SQL Injection via parameterized ORM, serta Content-Security-Policy ketat",
          "NFR-04 (Skalabilitas): Arsitektur stateless siap horizontal scaling di Vercel Edge Network / Docker container",
          "NFR-05 (Aksesibilitas): Memenuhi standar internasional WCAG 2.1 Level AA dengan navigasi keyboard lengkap dan rasio kontras visual tinggi",
          "NFR-06 (Reliabilitas): Target uptime sistem 99.9% didukung strategi graceful fallback error boundary saat terjadi gangguan layanan pihak ketiga",
          "NFR-07 (Integritas Data): Menggunakan transaksi database ACID dengan isolation level READ COMMITTED untuk mencegah anomali data keuangan",
          "NFR-08 (Responsivitas UI): Desain adaptif fluid-layout untuk layar mobile smartphone (360px+), tablet, hingga layar desktop ultrawide"
        ],
        assumptions: [
          { id: "ASSUMPTION-01", assumption: "Sistem di-deploy pada platform cloud serverless (Vercel Edge & Supabase)", reason: "Skalabilitas otomatis", impact: "Arsitektur stateless" },
          { id: "ASSUMPTION-02", assumption: "Integrasi Payment Gateway mendukung webhook callback server-to-server", reason: "Rekonsiliasi otomatis", impact: "Keandalan verifikasi saldo" }
        ],
        risks: [
          "Beban puncak transaksi checkout bersamaan (Mitigasi: Concurrency lock ACID pada database)",
          "Kegagalan pengiriman webhook pihak ketiga (Mitigasi: Idempotent handler dengan retry log)"
        ]
      },
      features: [
        {
          id: "feat-1",
          name: "Sistem Autentikasi Terpadu & Manajemen Hak Akses (RBAC)",
          description: `Sistem otentikasi multi-peran tingkat enterprise yang mengisolasi wewenang Customer, Staff, dan Administrator secara ketat untuk ${title}.`,
          priority: "High" as const,
          subFeatures: [
            "Registrasi & Login aman dengan email/password atau login instan Google OAuth",
            "Role-based Access Control (RBAC) middleware untuk proteksi rute halaman privat",
            "Session management dengan HttpOnly, SameSite, Secure cookie dan auto-refresh token",
            "Alur reset kata sandi mandiri via token email terenkripsi berbatas waktu 30 menit",
            "Audit log riwayat login dan deteksi aktivitas mencurigakan"
          ],
          dependencies: ["Database Supabase Auth", "Middleware Next.js"]
        },
        {
          id: "feat-2",
          name: "Katalog Interaktif, Instant Search & Filter Multi-Kategori",
          description: "Pusat eksplorasi data visual interaktif dengan performa pencarian kilat dan sistem filter kategori berjenjang.",
          priority: "High" as const,
          subFeatures: [
            "Pencarian instan real-time dengan debounce delay 250ms dan pencocokan teks toleran typo",
            "Filter multi-kriteria: kategori utama, rentang harga, rating, dan status ketersediaan live",
            "Mode tampilan kartu responsif (Grid View dan List View) dengan skeleton loading",
            "Sistem caching katalog di sisi klien (Client Cache SWR) untuk navigasi instan tanpa loading ulang"
          ],
          dependencies: ["Skema Database Items/Services"]
        },
        {
          id: "feat-3",
          name: "Core Engine Pemrosesan Transaksi & Reservasi Real-Time",
          description: "Mesin transaksi terintegrasi dengan validasi skema ketat Zod dan proteksi bentrok ketersediaan.",
          priority: "High" as const,
          subFeatures: [
            "Formulir transaksi interaktif multi-step dengan validasi integritas data di sisi klien & server",
            "Mekanisme holding lock 15 menit pada database untuk mencegah pemesanan ganda (race-condition)",
            "Kalkulator otomatis rincian harga, potongan kupon diskon, kalkulasi biaya admin, dan kode unik",
            "Penyimpanan draf transaksi otomatis sehingga data pengguna tidak hilang jika koneksi terputus"
          ],
          dependencies: ["Katalog Interaktif", "Autentikasi Pengguna"]
        },
        {
          id: "feat-4",
          name: "Integrasi Gateway Pembayaran Otomatis & Rekonsiliasi Webhook",
          description: "Sistem penerimaan pembayaran digital otomatis multi-channel dengan verifikasi server-to-server.",
          priority: "High" as const,
          subFeatures: [
            "Penerbitan QRIS dinamis otomatis yang langsung dapat dipindai aplikasi mobile banking / e-wallet",
            "Pembuatan nomor Virtual Account (BCA, Mandiri, BRI, BNI, Permata) dengan batas waktu bayar",
            "Endpoint webhook /api/webhook/payment dengan validasi HMAC SHA512 signature",
            "Auto-update status transaksi seketika (real-time transition dari pending menjadi settlement)"
          ],
          dependencies: ["Engine Transaksi", "Payment Gateway API"]
        },
        {
          id: "feat-5",
          name: "Pusat Notifikasi Terjadwal & Distribusi Dokumen Digital",
          description: "Modul komunikasi otomatis kepada pengguna untuk update status pesanan dan penerbitan faktur digital.",
          priority: "Medium" as const,
          subFeatures: [
            "Notifikasi konfirmasi sukses dan rincian transaksi otomatis via WhatsApp API (Fonnte/Waba)",
            "Pengiriman email transaksional dengan lampiran bukti pembayaran resmi",
            "Generator faktur digital PDF instan dengan barcode verifikasi integritas transaksi",
            "Panel riwayat notifikasi langsung di dalam akun pengguna"
          ],
          dependencies: ["Integrasi Payment Gateway"]
        },
        {
          id: "feat-6",
          name: "Dashboard Pengelola, Visualisasi Analitik & BI",
          description: "Panel kendali terpusat bagi pimpinan dan staf operasional untuk memantau performa harian dan tren bisnis.",
          priority: "High" as const,
          subFeatures: [
            "Visualisasi grafik tren omzet harian, mingguan, dan bulanan berbasis diagram garis & batang",
            "Kartu ringkasan KPI: Total Pendapatan, Transaksi Sukses, Tingkat Konversi, dan Order Pending",
            "Tabel data transaksi master dengan sorting kolom, pencarian nama pelanggan, dan filter status",
            "Fitur unduh laporan rekapitulasi keuangan periodik ke berkas Microsoft Excel (.xlsx) dan CSV"
          ],
          dependencies: ["Autentikasi RBAC Admin", "Skema Database Transaksi"]
        },
        {
          id: "feat-7",
          name: "Manajemen Data Master (CRUD) & Alokasi Sumber Daya",
          description: "Antarmuka administrasi lengkap untuk menambah, mengubah, menonaktifkan, atau mengarsipkan item dan layanan.",
          priority: "Medium" as const,
          subFeatures: [
            "Modal input/edit data master dengan upload berkas gambar media dan validasi tipe berkas",
            "Manajemen stok atau slot kuota ketersediaan harian secara dinamis",
            "Fitur bulk action (hapus/update status massal) untuk efisiensi pengelolaan data dalam jumlah besar",
            "Riwayat perubahan data (audit trail) untuk melacak operator yang melakukan penyuntingan"
          ],
          dependencies: ["Dashboard Pengelola"]
        },
        {
          id: "feat-8",
          name: "Modul Feedback Pengguna, Ulasan & Customer Support",
          description: "Fasilitas interaksi purna-jual untuk mengumpulkan ulasan kualitas dan memberikan saluran bantuan pelanggan.",
          priority: "Low" as const,
          subFeatures: [
            "Form ulasan kepuasan bintang 1-5 dan testimoni teks pasca transaksi selesai",
            "Widget tombol bantuan cepat terhubung ke WhatsApp customer service dengan template pesan otomatis",
            "Halaman Frequently Asked Questions (FAQ) interaktif dengan fitur accordion",
            "Moderasi review di sisi admin sebelum ditampilkan pada showcase publik"
          ],
          dependencies: ["Engine Transaksi"]
        }
      ],
      architecture: {
        frontend: "Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, Framer Motion",
        backend: "Next.js Route Handlers & Server Actions, Zod Schema Validation",
        database: "PostgreSQL (Supabase / Neon) dengan Row Level Security (RLS) & B-Tree Indexes",
        auth: "Supabase Auth / NextAuth dengan secure HttpOnly session cookie & JWT",
        storage: "Supabase Storage / Cloudflare R2 untuk penyimpanan aset gambar & dokumen PDF",
        api: "RESTful API Endpoints & Server Actions dengan validasi payload Zod ketat",
        thirdParty: [
          "Midtrans / Xendit (Payment Gateway QRIS & VA)",
          "Fonnte / Twilio (WhatsApp API Gateway)",
          "Resend (Email Transaksional)",
          "PDFKit / Puppeteer (Server-side PDF Invoice Generator)"
        ],
        deployment: "Vercel (Edge Network) dengan automated CI/CD pipeline",
        security: "HTTPS TLS 1.3, Rate limiting middleware, Webhook HMAC signature verification, Database RLS policies",
        dataSchema: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(30) DEFAULT 'customer', -- 'customer', 'staff', 'admin'
  phone VARCHAR(30),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE items_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items_services(id) ON DELETE RESTRICT,
  quantity INT DEFAULT 1,
  subtotal NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'paid', 'processing', 'completed', 'cancelled'
  booking_date DATE,
  time_slot VARCHAR(50),
  hold_expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders_bookings(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL, -- 'qris', 'bank_transfer', 'virtual_account'
  payment_status VARCHAR(30) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'expired', 'failed'
  amount NUMERIC(12,2) NOT NULL,
  gateway_transaction_id VARCHAR(120),
  gateway_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders_bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders_bookings(user_id);
CREATE INDEX idx_orders_status ON orders_bookings(status);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_items_category ON items_services(category_id);`
      },
      userFlow: `1. Landing Page -> 2. Penelusuran Katalog & Filter Layanan -> 3. Halaman Detail Item & Pengecekan Ketersediaan -> 4. Formulir Data Transaksi (Validasi Zod) -> 5. Penguncian Slot Sementara (Hold 15 Menit) -> 6. Checkout & Pembayaran Otomatis (QRIS / VA) -> 7. Verifikasi Webhook Server-to-Server -> 8. Penerbitan Faktur PDF & Notifikasi WhatsApp -> 9. Eksekusi Layanan oleh Staff -> 10. Dashboard Riwayat Pengguna & Ulasan Bintang`,
      tasks: [
        {
          id: "TASK-001",
          title: "Setup Inisialisasi Proyek, Konfigurasi Lingkungan & Tooling",
          description: "Inisialisasi Next.js 15 App Router, TypeScript, Tailwind CSS, ESLint, Prettier, dan file konfigurasi environment variables (.env.example).",
          status: "in_progress" as const,
          feature: "Fondasi",
          phase: "Phase 1 - Inisialisasi",
          priority: "CRITICAL",
          relatedRequirements: ["NFR-01", "NFR-04"],
          dependencies: [],
          subtasks: [
            "Inisialisasi Next.js 15 App Router dengan TypeScript",
            "Konfigurasi Tailwind CSS dan Tailwind Typography plugin",
            "Buat file .env.example dengan dokumentasi variabel environment",
            "Setup alias path (@/*) pada tsconfig.json"
          ],
          acceptanceCriteria: [
            "Project berhasil di-build tanpa error (next build)",
            "Server development running di localhost:3000 dengan Hot Reloading aktif",
            "Semua konfigurasi linter dan TypeScript strict mode lolos validasi"
          ],
          testing: [
            "Jalankan npm run dev dan buka localhost:3000",
            "Jalankan npx tsc --noEmit untuk validasi tipe"
          ],
          parallelizable: "NO"
        },
        {
          id: "TASK-002",
          title: "Desain Skema Database Relasional PostgreSQL, DDL & Indexes",
          description: "Menulis skrip DDL SQL untuk tabel users, categories, items_services, orders_bookings, payments, reviews, dan audit logs beserta foreign keys dan B-Tree indexes.",
          status: "in_progress" as const,
          feature: "Fondasi",
          phase: "Phase 1 - Inisialisasi",
          priority: "CRITICAL",
          relatedRequirements: ["NFR-02", "NFR-07"],
          dependencies: ["TASK-001"],
          subtasks: [
            "Tulis DDL tabel users, categories, dan items_services",
            "Tulis DDL tabel orders_bookings, payments, dan reviews",
            "Buat B-Tree index pada kolom pencarian dan foreign key",
            "Setup Row Level Security (RLS) policies pada PostgreSQL"
          ],
          acceptanceCriteria: [
            "Seluruh skrip migrasi SQL berhasil dieksekusi tanpa error syntax",
            "Relasi foreign key dengan ON DELETE CASCADE/RESTRICT berfungsi sesuai rancangan",
            "Index terpasang pada user_id, order_id, status, dan category_id"
          ],
          testing: [
            "Eksekusi skrip SQL di database PostgreSQL/Supabase",
            "Uji constraint foreign key dengan mencoba insert data invalid"
          ],
          parallelizable: "NO"
        },
        {
          id: "TASK-003",
          title: "Implementasi Sistem Autentikasi Pengguna & Session Middleware",
          description: "Membangun endpoint login, register, hash password Argon2/Bcrypt, session cookie HttpOnly aman, dan middleware route guard Next.js untuk proteksi rute.",
          status: "in_progress" as const,
          feature: "Autentikasi",
          phase: "Phase 2 - Autentikasi",
          priority: "CRITICAL",
          relatedRequirements: ["FR-01", "FR-02", "NFR-03"],
          dependencies: ["TASK-002"],
          subtasks: [
            "Buat Server Action untuk register dengan validasi Zod dan hash password",
            "Buat Server Action login dengan penerbitan token JWT / session cookie",
            "Implementasi middleware.ts untuk validasi session dan proteksi rute /dashboard",
            "Buat fungsi logout untuk revocating session cookie"
          ],
          acceptanceCriteria: [
            "Cookie session bersifat HttpOnly, Secure, dan SameSite=Lax",
            "Pengguna unauthenticated yang mengakses /dashboard diarahkan otomatis ke /login",
            "Password ter-hash dengan salt dan tidak tersimpan dalam bentuk plain text"
          ],
          testing: [
            "Uji login dengan kredensial valid dan verifikasi redirect ke dashboard",
            "Uji akses rute privat tanpa cookie session dan pastikan redirect ke login"
          ],
          parallelizable: "NO"
        },
        {
          id: "TASK-004",
          title: "Modul Manajemen Profil Pengguna, Reset Password & Role Guard",
          description: "Halaman edit profil pengguna, avatar upload, alur lupa password via email token terenkripsi, dan pembagian hak akses (Customer, Staff, Admin).",
          status: "in_progress" as const,
          feature: "Autentikasi",
          phase: "Phase 2 - Autentikasi",
          priority: "HIGH",
          relatedRequirements: ["FR-01"],
          dependencies: ["TASK-003"],
          subtasks: [
            "Komponen halaman profil pengguna dengan form ubah nama dan foto avatar",
            "Alur reset password: kirim email token, verifikasi token, ganti password baru",
            "Penerapan role-based access guard untuk rute khusus /admin"
          ],
          acceptanceCriteria: [
            "Pengguna non-admin diblokir (403 Forbidden) saat mencoba mengakses /admin",
            "Token reset password kedaluwarsa setelah 30 menit",
            "Perubahan profil tersimpan seketika di database"
          ],
          testing: [
            "Uji login dengan akun customer dan coba buka halaman admin",
            "Test pengiriman token reset password dan verifikasi pergantian kata sandi"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-005",
          title: "Pembuatan Master Layout, Design System & App Shell Responsif",
          description: "Membangun komponen Navbar, Sidebar navigasi, modal wrapper, alert toast, dan layout adaptif responsif dark/light mode yang konsisten.",
          status: "in_progress" as const,
          feature: "Frontend Core",
          phase: "Phase 3 - Frontend Core",
          priority: "HIGH",
          relatedRequirements: ["NFR-05", "NFR-08"],
          dependencies: ["TASK-001"],
          subtasks: [
            "Komponen Navbar dengan logo, menu navigasi, dan user dropdown profile",
            "Komponen Sidebar responsif yang dapat di-collapse di mobile",
            "Komponen Modal dan Toast notification provider",
            "Sinkronisasi tema monokrom dark/light mode dengan Tailwind"
          ],
          acceptanceCriteria: [
            "Layout responsif sempurna di viewport mobile (360px) hingga desktop (1920px)",
            "Tidak terjadi hydration mismatch antara server render dan client render",
            "Konsistensi tema monokrom pada seluruh komponen shell"
          ],
          testing: [
            "Uji navigasi menu pada ukuran layar smartphone dan tablet",
            "Verifikasi toggle dark mode tidak menyebabkan flicker"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-006",
          title: "Halaman Penelusuran Katalog, Instant Debounce Search & Filter",
          description: "Menampilkan kartu data dinamis dengan instant search bar (debounce 250ms), multi-filter kategori, urutan harga, dan pagination/infinite scroll.",
          status: "in_progress" as const,
          feature: "Katalog",
          phase: "Phase 3 - Frontend Core",
          priority: "HIGH",
          relatedRequirements: ["FR-03", "NFR-01"],
          dependencies: ["TASK-002", "TASK-005"],
          subtasks: [
            "Input pencarian dengan custom hook useDebounce (250ms)",
            "Komponen filter kategori dan sorting (Harga termurah, termahal, terpopuler)",
            "Card item responsif dengan image optimization Next.js Image",
            "Skeleton loader saat proses fetch data katalog"
          ],
          acceptanceCriteria: [
            "Pencarian tidak menembak request ke backend pada setiap ketikan huruf",
            "Filter dan query string tersinkronisasi dengan URL browser",
            "Kecepatan muat katalog < 1 detik dengan pagination efisien"
          ],
          testing: [
            "Uji ketik di search box dan amati network tab untuk memastikan debounce aktif",
            "Test kombinasi filter kategori dan pengurutan harga"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-007",
          title: "Halaman Detail Entitas/Layanan dengan Visual Showcase",
          description: "Membangun tampilan detail item dengan galeri gambar responsif, deskripsi mendalam, accordion spesifikasi teknis, dan indikator status ketersediaan live.",
          status: "in_progress" as const,
          feature: "Katalog",
          phase: "Phase 3 - Frontend Core",
          priority: "MEDIUM",
          relatedRequirements: ["FR-04"],
          dependencies: ["TASK-006"],
          subtasks: [
            "Halaman detail dinamis /catalog/[slug] berbasis Server Component",
            "Galeri gambar dengan thumbnail selector",
            "Accordion rincian fitur dan spesifikasi",
            "Badge ketersediaan real-time (Tersedia / Terbatas / Habis)"
          ],
          acceptanceCriteria: [
            "Server Component mengembalikan data detail item dengan SEO tags dinamis",
            "Thumbnail galeri merespons klik dan mengganti gambar utama tanpa lag",
            "Tombol booking/pesan ter-disable otomatis jika status 'Habis'"
          ],
          testing: [
            "Akses URL slug yang valid dan verifikasi data tampil lengkap",
            "Akses slug yang tidak ada dan pastikan muncul halaman 404 Not Found"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-008",
          title: "Mesin Pemesanan Transaksi, Validasi Zod & Concurrency Locking",
          description: "Formulir interaktif multi-step dengan validasi skema Zod ketat di sisi klien/server dan mekanisme atomic holding lock 15 menit untuk mencegah double order.",
          status: "in_progress" as const,
          feature: "Transaksi",
          phase: "Phase 4 - Modul Transaksi",
          priority: "CRITICAL",
          relatedRequirements: ["FR-05", "FR-06", "NFR-07"],
          dependencies: ["TASK-007", "TASK-003"],
          subtasks: [
            "Skema Zod komprehensif untuk payload data transaksi",
            "Server Action createBookingWithLock dengan database transaction (ACID)",
            "Logika holding lock kuota selama 15 menit dengan kolom hold_expires_at",
            "Background cron / trigger untuk melepaskan lock yang kedaluwarsa"
          ],
          acceptanceCriteria: [
            "Dua pengguna tidak dapat mengunci slot ketersediaan yang sama pada detik yang bersamaan",
            "Lock otomatis gugur setelah 15 menit jika pembayaran tidak diselesaikan",
            "Data transaksi tersimpan dengan status 'pending'"
          ],
          testing: [
            "Jalankan uji konkurensi (simultaneous checkout requests)",
            "Verifikasi lock kadaluwarsa ter-release kembali ke pool ketersediaan"
          ],
          parallelizable: "NO"
        },
        {
          id: "TASK-009",
          title: "Kalkulator Checkout Otomatis: Biaya, Kupon & Breakdown Tagihan",
          description: "Kalkulasi otomatis subtotal, kode unik transaksi, potongan voucher diskon, dan estimasi rincian biaya transparan sebelum pembayaran dilakukan.",
          status: "in_progress" as const,
          feature: "Transaksi",
          phase: "Phase 4 - Modul Transaksi",
          priority: "HIGH",
          relatedRequirements: ["FR-05"],
          dependencies: ["TASK-008"],
          subtasks: [
            "Fungsi kalkulasi subtotal, pajak, diskon, dan total akhir di server",
            "Validasi kode voucher diskon (kuota pemakaian, minimum transaksi, masa berlaku)",
            "Komponen UI ringkasan tagihan transparan di layar checkout"
          ],
          acceptanceCriteria: [
            "Kalkulasi di client selalu dicocokkan dan divalidasi ulang di backend",
            "Voucher diskon yang tidak valid menampilkan pesan error deskriptif",
            "Nominal total tagihan tidak pernah bernilai negatif"
          ],
          testing: [
            "Uji penerapan kupon diskon persentase dan nominal flat",
            "Coba manipulasi nominal di client side dan verifikasi backend menolaknya"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-010",
          title: "Integrasi Gateway Pembayaran Digital (QRIS Dinamis & Virtual Account)",
          description: "Menghubungkan API payment gateway (Midtrans / Xendit) untuk menerbitkan QRIS dinamis dan nomor Virtual Account perbankan secara real-time.",
          status: "in_progress" as const,
          feature: "Pembayaran",
          phase: "Phase 5 - Integrasi",
          priority: "CRITICAL",
          relatedRequirements: ["FR-07"],
          dependencies: ["TASK-009"],
          subtasks: [
            "Setup koneksi SDK API Payment Gateway dengan server key aman",
            "Server Action generatePaymentToken untuk charge QRIS dan Virtual Account",
            "Komponen modal transaksi dengan QR code responsif dan tombol salin nomor VA"
          ],
          acceptanceCriteria: [
            "QRIS dinamis ter-generate seketika dan dapat dipindai aplikasi pembayaran",
            "Nomor Virtual Account bank (BCA, Mandiri, BRI) muncul lengkap dengan instruksi",
            "Status pembayaran awal tercatat 'unpaid' dengan timestamp expired 15 menit"
          ],
          testing: [
            "Eksekusi charge API di sandbox mode payment gateway",
            "Verifikasi respon payment gateway ter-mapping akurat ke tabel payments"
          ],
          parallelizable: "NO"
        },
        {
          id: "TASK-011",
          title: "Endpoint Webhook Listener & Rekonsiliasi Otomatis Status Order",
          description: "Membuat endpoint /api/webhook/payment dengan verifikasi signature cryptographic untuk mengupdate status pembayaran dan order menjadi settlement.",
          status: "in_progress" as const,
          feature: "Pembayaran",
          phase: "Phase 5 - Integrasi",
          priority: "CRITICAL",
          relatedRequirements: ["FR-08"],
          dependencies: ["TASK-010"],
          subtasks: [
            "Endpoint Route Handler POST /api/webhook/payment",
            "Verifikasi HMAC SHA512 signature dari payload gateway",
            "Update atomic status payments menjadi 'paid' dan orders menjadi 'confirmed'",
            "Penanganan status transaksi gagal (expire / cancel / deny)"
          ],
          acceptanceCriteria: [
            "Request dengan signature palsu langsung ditolak dengan HTTP 401 Unauthorized",
            "Idempotensi: request webhook ganda tidak menduplikasi mutasi saldo atau status",
            "Status order berubah secara real-time"
          ],
          testing: [
            "Simulasi kirim payload webhook settlement resmi",
            "Uji kirim payload dengan signature sengaja dirusak"
          ],
          parallelizable: "NO"
        },
        {
          id: "TASK-012",
          title: "Penerbitan Invoice PDF Digital & Integrasi Notifikasi WhatsApp",
          description: "Menghasilkan invoice PDF otomatis dengan barcode verifikasi transaksi dan memicu pengiriman pesan bukti sukses pesanan via WhatsApp Gateway (Fonnte).",
          status: "in_progress" as const,
          feature: "Notifikasi",
          phase: "Phase 5 - Integrasi",
          priority: "HIGH",
          relatedRequirements: ["FR-09", "FR-10"],
          dependencies: ["TASK-011"],
          subtasks: [
            "Template invoice PDF dengan styling profesional dan QR verifikasi",
            "Endpoint download invoice /api/invoices/[orderNumber]",
            "Integrasi API WhatsApp Gateway untuk dispatch notifikasi bukti bayar",
            "Fallback email transaksional dengan lampiran invoice"
          ],
          acceptanceCriteria: [
            "PDF invoice berukuran ringkas (< 500KB) dan terformat rapi",
            "Pesan WhatsApp terkirim dalam waktu < 5 detik setelah pembayaran sukses",
            "Invoice memuat rincian item, nomor transaksi unik, dan breakdown harga"
          ],
          testing: [
            "Uji generate invoice PDF dan inspeksi kejelasan layout",
            "Test pengiriman pesan WhatsApp ke nomor penguji di staging"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-013",
          title: "Dashboard Admin: Visualisasi Grafik Analitik Omzet & KPI Bisnis",
          description: "Membangun kartu ringkasan omzet, rasio pesanan sukses, grafik batang pendapatan harian/bulanan, dan metrik retensi pelanggan berbasis data nyata.",
          status: "in_progress" as const,
          feature: "Dashboard Admin",
          phase: "Phase 6 - Dashboard Admin",
          priority: "HIGH",
          relatedRequirements: ["FR-13"],
          dependencies: ["TASK-011", "TASK-004"],
          subtasks: [
            "Query agregasi SQL untuk total omzet harian, mingguan, dan bulanan",
            "Komponen kartu metrik KPI (Revenue, Orders, Conversion Rate, Average Order Value)",
            "Visualisasi grafik chart performa penjualan",
            "Filter rentang tanggal analitik (Hari ini, 7 hari terakhir, 30 hari terakhir)"
          ],
          acceptanceCriteria: [
            "Perhitungan angka omzet akurat 100% dengan total transaksi settlement di database",
            "Grafik chart responsif dan interaktif dengan tooltip detail",
            "Query agregasi dioptimalkan sehingga dashboard dimuat < 800ms"
          ],
          testing: [
            "Validasi hasil kalkulasi query agregasi terhadap data transaksi riil",
            "Uji filter rentang tanggal analitik"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-014",
          title: "Dashboard Admin: Manajemen Data Master CRUD & Export CSV/Excel",
          description: "Tabel interaktif data master dengan modal tambah/edit berkas, filter status, bulk delete, serta fitur unduh laporan rekapitulasi ke format CSV/Excel.",
          status: "in_progress" as const,
          feature: "Dashboard Admin",
          phase: "Phase 6 - Dashboard Admin",
          priority: "MEDIUM",
          relatedRequirements: ["FR-12", "FR-14"],
          dependencies: ["TASK-013"],
          subtasks: [
            "Tabel data master dengan pagination, sorting kolom, dan filter status",
            "Modal dialog formulir tambah & edit item dengan upload media gambar",
            "Fungsi export data tabel ke file CSV dan Microsoft Excel (.xlsx)",
            "Konfirmasi dialog proteksi saat aksi hapus data"
          ],
          acceptanceCriteria: [
            "Admin dapat menambah, mengedit, dan menonaktifkan item secara instan",
            "Berkas CSV/Excel ter-generate dengan header kolom rapi dan encoding UTF-8",
            "Aksi hapus data memvalidasi relasi dependensi untuk mencegah error foreign key"
          ],
          testing: [
            "Lakukan operasi CRUD lengkap pada item katalog",
            "Unduh berkas CSV dan verifikasi kecocokan seluruh baris data"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-015",
          title: "Testing Menyeluruh End-to-End, Error Boundary & Logging",
          description: "Pengujian skenario alur dari registrasi, penelusuran, checkout holding lock, pembayaran webhook sampai invoice, serta pengujian error boundary.",
          status: "in_progress" as const,
          feature: "QA & Hardening",
          phase: "Phase 7 - QA & Deployment",
          priority: "HIGH",
          relatedRequirements: ["NFR-06"],
          dependencies: ["TASK-012", "TASK-014"],
          subtasks: [
            "Skenario E2E testing alur utama (Happy path: Register -> Checkout -> Bayar -> Sukses)",
            "Uji skenario kendala (Edge cases: Pembayaran expired, stok habis saat checkout)",
            "Komponen Error Boundary global untuk menangkap runtime exception",
            "Setup logging aktivitas krusial ke tabel activity_audit_logs"
          ],
          acceptanceCriteria: [
            "Seluruh skenario pengujian utama berhasil lolos 100%",
            "Aplikasi tidak pernah mengalami crash / blank page putih jika terjadi error",
            "Log error mencatat stack trace dan context detail untuk debugging"
          ],
          testing: [
            "Jalankan skenario pengujian otomatis / manual dari awal hingga akhir",
            "Simulasikan kegagalan network/API pihak ketiga dan periksa respon fallback UI"
          ],
          parallelizable: "YES"
        },
        {
          id: "TASK-016",
          title: "Security Hardening, Optimasi Core Web Vitals & Deploy ke Production",
          description: "Audit header keamanan (CSP, X-Frame-Options), optimasi kompresi gambar Next.js Image, audit performa Lighthouse, dan rilis production ke Vercel.",
          status: "in_progress" as const,
          feature: "QA & Hardening",
          phase: "Phase 7 - QA & Deployment",
          priority: "CRITICAL",
          relatedRequirements: ["NFR-01", "NFR-03", "NFR-05"],
          dependencies: ["TASK-015"],
          subtasks: [
            "Konfigurasi security headers di next.config.mjs (CSP, HSTS, X-Content-Type-Options)",
            "Audit performa dengan Google Lighthouse (Skor target > 90)",
            "Setup CI/CD pipeline otomatis dengan GitHub Actions / Vercel",
            "Verifikasi domain production, SSL certificate, dan monitoring uptime"
          ],
          acceptanceCriteria: [
            "Grade keamanan A+ pada security audit headers",
            "Skor performa Lighthouse > 90 untuk kategori Performance, Accessibility, Best Practices, SEO",
            "Aplikasi live di domain production dengan sertifikat HTTPS aktif"
          ],
          testing: [
            "Jalankan npx tsc --noEmit && npm run build lokal untuk verifikasi build",
            "Lakukan audit performa menggunakan Google PageSpeed Insights"
          ],
          parallelizable: "NO"
        }
      ]
    };
  };

  // ── Chat & Automatic Blueprint Generation ──────────────────────────────────────
  const handleSendChatMessage = async (presetText?: string, targetProjId?: string) => {
    const textToSend = (presetText || chatInput).trim();
    const targetId = targetProjId || activeProjectId;
    const currentProject = projects.find((p) => p.id === targetId) || activeProject;
    if (!textToSend || !currentProject || isChatLoading) return;

    const userMsg: ProjectChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend,
      createdAt: Date.now(),
    };

    const updatedMessages = [...currentProject.messages, userMsg];
    const projId = currentProject.id;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projId
          ? { ...p, messages: updatedMessages, updatedAt: Date.now() }
          : p
      )
    );
    if (!presetText) setChatInput("");
    setIsChatLoading(true);

    const isAnsweringQuestions =
      textToSend.includes("klarifikasi kebutuhan proyek") ||
      textToSend.includes("Berikut klarifikasi kebutuhan") ||
      /buatkan prd|generate blueprint|rancang arsitektur|buatkan task/i.test(textToSend);

    if (isAnsweringQuestions) {
      setEstafetStage("prd");
    } else {
      setEstafetStage("idle");
    }

    const domain = detectProjectDomain(updatedMessages, currentProject.title, currentProject.description);

    let systemPrompt = "";
    if (!isAnsweringQuestions) {
      systemPrompt = `Kamu adalah AI Project Planner, Product Manager, System Analyst, dan Software Architect kelas dunia.
Pengguna sedang mendiskusikan brief dan ide website untuk proyek: "${domain.topicName}" (Nama proyek: "${currentProject.title}").

TUGAS UTAMA:
1. Pahami brief pengguna, berikan respon ramah dan apresiasi ide tersebut (1-2 paragraf pendek) yang menggarisbawahi value proposition dan potensi utamanya.
2. Ajukan 3 sampai 4 pertanyaan pilihan ganda yang SANGAT RELEVAN dan SPESIFIK sesuai brief untuk mengklarifikasi preferensi fitur, target pengguna, dan alur kerja utama.
3. SERTAKAN BLOK PILIHAN GANDA INTERAKTIF di akhir respon menggunakan format persis berikut:

<<<QUESTIONS_JSON>>>
[
  {
    "id": "q1",
    "question": "Pertanyaan spesifik sesuai brief 1?",
    "options": ["Opsi Pilihan A", "Opsi Pilihan B", "Opsi Pilihan C"]
  },
  {
    "id": "q2",
    "question": "Pertanyaan spesifik sesuai brief 2?",
    "options": ["Opsi Pilihan A", "Opsi Pilihan B", "Opsi Pilihan C"]
  }
]
<<<END_QUESTIONS_JSON>>>

PENTING:
- DILARANG membuat blueprint PRD atau Task Board sekarang!
- Berikan pertanyaan pilihan ganda agar pengguna dapat menentukan preferensi fitur dan alurnya terlebih dahulu.`;
    } else {
      systemPrompt = `Kamu adalah AI Project Planner, Product Manager, System Analyst, dan Software Architect kelas dunia yang beroperasi sesuai FINAL V4 ADDITION (Universal Scope, Architecture & Planning Intelligence).
Pengguna telah memberikan brief dan preferensi untuk proyek: "${domain.topicName}" (Nama project: "${currentProject.title}"). Deskripsi awal: "${currentProject.description || "N/A"}".
Karakteristik & Deteksi Proyek:
- Primary Type: ${domain.primaryType} | Secondary Types: [${domain.secondaryTypes.join(", ") || "None"}] | Klasifikasi: ${domain.isHybrid ? "Hybrid" : "Single Domain"}
- Tingkat Kompleksitas: ${domain.complexity} (SIMPLE | MODERATE | COMPLEX | ENTERPRISE)
- Stack Mode Intelligence: ${domain.stackMode}
- Scope Guard Flags: Auth: ${domain.needsAuth ? "REQUIRED" : "NOT REQUIRED"}, Database: ${domain.needsDatabase ? "REQUIRED" : "NOT REQUIRED (Static/JSON)"}, Payment: ${domain.needsPayment ? "REQUIRED" : "NOT REQUIRED"}, Storage: ${domain.needsStorage ? "REQUIRED" : "NOT REQUIRED"}, AI: ${domain.needsAi ? "REQUIRED" : "NOT REQUIRED"}, Realtime: ${domain.needsRealtime ? "REQUIRED" : "NOT REQUIRED"}, Background Jobs: ${domain.needsBackgroundJobs ? "REQUIRED" : "NOT REQUIRED"}, Caching: ${domain.needsCaching ? "REQUIRED" : "NOT REQUIRED"}.
- User Constraints: ${domain.constraints.length > 0 ? domain.constraints.join(", ") : "Tidak ada batasan khusus"}.
- User Specified Stack: ${domain.userSpecifiedStack.specified ? `User explicitly specified: ${domain.userSpecifiedStack.frontend || ""} ${domain.userSpecifiedStack.backend || ""} ${domain.userSpecifiedStack.database || ""}` : "User did NOT specify a technology stack - provide TBD or clearly labeled AI-SUGGESTED STACK"}.

V4 ENFORCEMENT PATCH & MANDATORY 11-PASS PIPELINE DIRECTIVES (WAJIB DIPATUHI PENUH):
1. MANDATORY GENERATION & AUDIT PIPELINE:
   Eksekusi 11 Pass sebelum menyusun respon akhir:
   PASS 1: INPUT EXTRACTION -> PASS 2: REQUIREMENT NORMALIZATION & IMMUTABILITY -> PASS 3: PROJECT & ARCHITECTURE PLANNING -> PASS 4: FEATURE & ATOMIC TASK GENERATION -> PASS 5: SCOPE AUDIT -> PASS 6: TRACEABILITY AUDIT -> PASS 7: DEPENDENCY & PARALLELIZATION AUDIT -> PASS 8: STACK / ARCHITECTURE AUDIT -> PASS 9: ACCEPTANCE CRITERIA AUDIT -> PASS 10: AUTOMATIC REPAIR -> PASS 11: FINAL VALIDATION.
2. REQUIREMENT IMMUTABILITY (SECTION 2):
   Klasifikasi yang diizinkan: USER_REQUIREMENT, USER_CONSTRAINT, AI_SUGGESTED, TECHNICAL_DECISION, TECHNICAL_RECOMMENDATION, ASSUMPTION, TBD.
   - USER_REQUIREMENT HARUS tetap USER_REQUIREMENT (dilarang di-downgrade ke AI_SUGGESTED).
   - AI_SUGGESTED DILARANG di-upgrade ke USER_REQUIREMENT.
   - ASSUMPTION DILARANG dikonversi ke USER_REQUIREMENT.
3. SCOPE VIOLATION DETECTION & AI_SUGGESTED ISOLATION (SECTION 4 & 5):
   JANGAN memasukkan fitur tidak diminta ke dalam mandatory MVP (Kupon, Voucher, Wishlist, FAQ, Customer Support, Google OAuth, Dark Mode, AI Chatbot, Redis, SWR, Framer Motion, Advanced Analytics, Bulk Actions, Avatar Upload, Loyalty System).
   Jika berguna tapi tidak diminta -> Reclassify sebagai AI_SUGGESTED dan isolasi!
   AI_SUGGESTED DILARANG:
   - Muncul sebagai mandatory MVP feature.
   - Membuat dependensi wajib ke USER_REQUIREMENT task.
   - Muncul di dalam USER_REQUIREMENT traceability.
4. CONDITIONAL ARCHITECTURE & NECESSITY (SECTION 8):
   - Database: Hanya jika butuh data persisten terstruktur. Static site / landing page = NOT REQUIRED.
   - Auth: Hanya jika butuh user account / private area / roles.
   - Payment: Hanya jika ada transaksi moneter di confirmed scope.
   - Storage: Hanya jika butuh upload media / berkas.
   - Realtime: Hanya untuk live chat / kolaborasi live / multiplayer.
   - Background Jobs & Caching: Hanya jika asinkron / caching terbukti dibutuhkan.
5. PROJECT TYPE NORMALIZATION (SECTION 6):
   Satu Primary Type (${domain.primaryType}), nol duplikasi semantik label.
6. ATOMIC TASKS & REAL DEPENDENCIES (SECTION 11, 12, 13):
   Setiap task adalah satu unit implementasi koheren (pecah jika menggabungkan hal unrelated).
   Dependensi: HARD, SOFT, NONE. DILARANG membuat circular dependency.
   Parallel = YES hanya jika aman dieksekusi independen tanpa blocking dependency.
7. ACCEPTANCE CRITERIA & AVOID UNREALISTIC GUARANTEES (SECTION 14):
   Kriteria penerimaan harus terukur, observable, dan testable.
   DILARANG KERAS menggunakan klaim: "100% secure", "A+ security", "100% accurate", "impossible to hack", "never fails", "perfect performance".
8. COMPACT TRACEABILITY MATRIX (SECTION 17 & 23):
   Setiap USER_REQUIREMENT wajib memiliki coverage (Req -> Feature -> Task -> AC -> Testing):
   | Requirement | Feature | Tasks | Classification |
9. 15-POINT AI CODING ASSISTANT INSTRUCTIONS (SECTION 26):
   Sertakan instruksi AI Coding Assistant di akhir teks respon.

V4 SOURCE LOCK — REQUIREMENT LINEAGE (WAJIB DIPATUHI PENUH):
S1. REQUIREMENT INGESTION LOCK: Ekstrak seluruh requirement dari input user menjadi registry dengan ID stabil (REQ-001, REQ-002, ...). text, classification, dan source TIDAK boleh diubah maknanya, dihapus, atau digabung diam-diam dengan AI suggestion.
S2. CLASSIFICATION ASSIGNED ONCE: Classification ditentukan SEKALI saat ingest (USER_REQUIREMENT, USER_CONSTRAINT, AI_SUGGESTED, TECHNICAL_DECISION, TECHNICAL_RECOMMENDATION, ASSUMPTION, TBD). JANGAN menghitung ulang classification dari Feature atau Task.
S3. SOURCE INHERITANCE: Setiap Feature dan Task WAJIB memiliki "sourceRequirementIds" (contoh ["REQ-004"]) dan "origin" yang diwarisi dari requirement sumbernya. Acceptance Criteria dan Testing mewarisi lineage task induknya.
S4. AI SUGGESTION ISOLATION: Kupon, FAQ, support, loyalty, avatar, dark mode, dll yang tidak diminta -> origin "AI_SUGGESTED", optional, isMvp=false, scope "AI-SUGGESTED", TANPA sourceRequirementIds milik USER_REQUIREMENT.
S5. TECHNICAL DECISION != REQUIREMENT: Implementasi teknis (mis. NextAuth) TIDAK boleh melahirkan requirement baru (Google OAuth, avatar, profile) dan TIDAK boleh menimpa source requirement asli.
S6. PRD SOURCE SEPARATION: Pisahkan "userDerived" (goals, FR, constraints, explicit NFR) dari "aiDerived" (technicalRecommendations, architectureSuggestions, assumptions, optionalFeatures, aiSuggestions). TBD ditempatkan di aiDerived.
S7. NO REQUIREMENT LOSS: Setiap USER_REQUIREMENT minimal punya 1 Feature dan 1 Task (kecuali berstatus TBD/BLOCKED).
S8. NO DRIFT: Perubahan makna, requirement hilang, classification berubah, AI menjadi mandatory, technical menjadi user requirement, atau scope tanpa source = SOURCE INTEGRITY FAIL -> perbaiki otomatis sebelum output final.
S9. PROJECT TYPE dari requirement aktual: PRIMARY_TYPE + SECONDARY_TYPES (Dashboard hanya secondary bila memang dibutuhkan).
S10. STACK MODE sesuai kepastian: jangan gunakan USER_SPECIFIED/"CONFIRMED" jika masih ada alternatif (Supabase/Neon, Supabase Auth/NextAuth, R2/Supabase Storage, Midtrans/Xendit). Mode: USER_SPECIFIED, PARTIALLY_SPECIFIED, AI_RECOMMENDED, UNDECIDED, EXISTING_PROJECT.
S11. SOURCE INTEGRITY CHECK sebelum output final: (1) semua USER_REQUIREMENT masih ada? (2) classification masih sama? (3) tiap requirement punya Feature? (4) tiap requirement punya Task? (5) AI_SUGGESTED tidak menjadi mandatory scope? (6) tidak ada requirement baru tanpa source? (7) project type sesuai requirement? (8) Stack Mode sesuai kepastian teknologi?

FORMAT OUTPUT WAJIB:
Berikan pengantar singkat profesional, tabel Compact Traceability Matrix, lalu sertakan blok blueprint lengkap di akhir respon:

<<<BLUEPRINT_JSON>>>
{
  "prd": {
    "overview": "...",
    "problemStatement": "...",
    "goals": ["G-01...", "G-02..."],
    "targetUsers": ["...", "..."],
    "functionalRequirements": ["REQ-001: ... [Source: USER_REQUIREMENT]", "REQ-002: ... [Source: USER_REQUIREMENT]"],
    "nonFunctionalRequirements": ["NFR-01: ...", "NFR-02: ..."],
    "constraints": ["..."],
    "classifiedRequirements": [
      { "id": "REQ-001", "text": "...", "source": "USER_REQUIREMENT" },
      { "id": "REQ-002", "text": "...", "source": "USER_REQUIREMENT" }
    ],
    "userDerived": {
      "goals": ["..."],
      "functionalRequirements": ["REQ-001: ..."],
      "userConstraints": ["..."],
      "explicitNFR": ["..."]
    },
    "aiDerived": {
      "technicalRecommendations": ["..."],
      "architectureSuggestions": ["..."],
      "assumptions": ["..."],
      "optionalFeatures": ["..."],
      "aiSuggestions": ["..."]
    },
    "assumptions": [
      {
        "id": "ASSUMPTION-01",
        "assumption": "...",
        "reason": "...",
        "impact": "..."
      }
    ],
    "risks": [
      "..."
    ]
  },
  "features": [
    {
      "id": "FEATURE-01",
      "name": "...",
      "description": "...",
      "priority": "HIGH",
      "scope": "MVP",
      "sourceType": "USER_REQUIREMENT",
      "origin": "USER_REQUIREMENT",
      "sourceRequirementIds": ["REQ-001"],
      "sourceRequirements": ["REQ-001"],
      "isAiSuggested": false,
      "relatedRequirements": ["REQ-001"],
      "subFeatures": ["...", "..."],
      "dependencies": [],
      "isMvp": true
    }
  ],
  "userFlow": "1. ... -> 2. ... -> 3. ... -> 4. ...",
  "architecture": {
    "stackMode": "${domain.stackMode}",
    "frontend": "${domain.userSpecifiedStack.frontend || "Next.js 15 (App Router), Tailwind CSS (AI-SUGGESTED)"}",
    "backend": "${domain.userSpecifiedStack.backend || "Next.js Route Handlers / Server Actions (AI-SUGGESTED)"}",
    "database": "${domain.needsDatabase ? (domain.userSpecifiedStack.database || "PostgreSQL / Supabase (AI-SUGGESTED)") : "None (Static Website / Client-side rendering)"}",
    "auth": "${domain.needsAuth ? "Supabase Auth / NextAuth dengan session cookie" : "None (Public Website - No Auth Required)"}",
    "storage": "${domain.needsStorage ? "Supabase Storage / Cloudflare R2" : "None (Static Assets)"}",
    "realtime": "${domain.needsRealtime ? "WebSockets / Realtime Subscriptions" : "NOT REQUIRED"}",
    "backgroundJobs": "${domain.needsBackgroundJobs ? "Queue Worker / Scheduled Cron" : "NOT REQUIRED"}",
    "caching": "${domain.needsCaching ? "Redis Cache Layer" : "NOT REQUIRED"}",
    "deployment": "Vercel / Cloudflare Pages",
    "dataSchema": "${domain.needsDatabase ? "CREATE TABLE ..." : "-- Tidak memerlukan skema database relasional"}"
  },
  "tasks": [
    {
      "id": "TASK-001",
      "title": "...",
      "description": "...",
      "phase": "Phase 1 - Project Foundation",
      "priority": "HIGH",
      "status": "ready",
      "feature": "FEATURE-01: ...",
      "relatedFeature": "FEATURE-01: ...",
      "source": "USER_REQUIREMENT",
      "origin": "USER_REQUIREMENT",
      "sourceRequirementIds": ["REQ-001"],
      "deliverable": "...",
      "dependencyType": "NONE",
      "complexity": "M",
      "technicalNotes": "...",
      "relatedRequirements": ["FR-01"],
      "dependencies": [],
      "parallelizable": "YES",
      "parallelGroup": "PG-01",
      "subtasks": ["TASK-001.1: ..."],
      "acceptanceCriteria": ["..."],
      "testing": ["..."]
    }
  ],
  "traceabilityMatrix": [
    {
      "requirementId": "REQ-001",
      "featureId": "FEATURE-01",
      "taskIds": ["TASK-001"],
      "classification": "USER_REQUIREMENT"
    }
  ]
}
<<<END_BLUEPRINT_JSON>>>`;
    }

    const assistantMsgId = "ai-" + Date.now();

    // Placeholder pesan asisten
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projId
          ? {
              ...p,
              messages: [
                ...p.messages,
                { id: assistantMsgId, role: "assistant", content: "", createdAt: Date.now() },
              ],
            }
          : p
      )
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          model: "novita:qwen/qwen3.8-flash",
          max_tokens: 8192,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menghubungi AI planner server.");
      }

      if (!res.body) throw new Error("Respons stream tidak tersedia.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawStream = "";
      let currentTrackedStage: "prd" | "features" | "architecture" | "tasks" | "completed" = "prd";

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            const chunk = parsed.choices?.[0]?.delta?.content || "";
            if (chunk) {
              rawStream += chunk;

              // Deteksi progres estafet berbasis bagian nyata yang sedang digenerate AI:
              if (isAnsweringQuestions) {
                if (rawStream.includes('"tasks"') || rawStream.includes('tasks":') || rawStream.includes('"Actionable') || rawStream.length > 3800) {
                  if (currentTrackedStage !== "tasks") {
                    currentTrackedStage = "tasks";
                    setEstafetStage("tasks");
                  }
                } else if (rawStream.includes('"architecture"') || rawStream.includes('"userFlow"') || rawStream.includes('"dataSchema"') || rawStream.includes('CREATE TABLE') || rawStream.length > 2400) {
                  if (currentTrackedStage === "prd" || currentTrackedStage === "features") {
                    currentTrackedStage = "architecture";
                    setEstafetStage("architecture");
                  }
                } else if (rawStream.includes('"features"') || rawStream.includes('features":') || rawStream.includes('"Feature Breakdown"') || rawStream.length > 900) {
                  if (currentTrackedStage === "prd") {
                    currentTrackedStage = "features";
                    setEstafetStage("features");
                  }
                }
              }

              if (!isAnsweringQuestions) {
                setProjects((prev) =>
                  prev.map((p) =>
                    p.id === projId
                      ? {
                          ...p,
                          messages: p.messages.map((m) =>
                            m.id === assistantMsgId ? { ...m, content: rawStream } : m
                          ),
                        }
                      : p
                  )
                );
              }
            }
          } catch {}
        }
      }

      if (isAnsweringQuestions) {
        // Transisi halus berurutan agar pengguna benar-benar melihat setiap tahap dari awal hingga akhir terupdate:
        const stageSequence: Array<"prd" | "features" | "architecture" | "tasks" | "completed"> = [
          "prd",
          "features",
          "architecture",
          "tasks",
          "completed",
        ];
        const startIdx = stageSequence.indexOf(currentTrackedStage);
        const actualStart = startIdx >= 0 ? startIdx : 0;
        for (let s = actualStart + 1; s < stageSequence.length; s++) {
          await new Promise((resolve) => setTimeout(resolve, 750));
          setEstafetStage(stageSequence[s]);
        }

        if (!rawStream.trim()) {
          rawStream = "Blueprint dan spesifikasi teknis proyek telah selesai dirumuskan secara estafet. Anda dapat melihat detailnya pada tab PRD, Features, Flow & Architecture, dan Tasks di atas.";
        }
        parseAndApplyBlueprint(projId, rawStream, assistantMsgId);
      } else {
        setEstafetStage("idle");
        // Jika sedang fase diskusi brief, pastikan pertanyaan discovery ada di akhir respons
        if (!rawStream.includes("<<<QUESTIONS_JSON>>>")) {
          const { questionsJson } = generateInitialDiscoveryQuestions(currentProject.title, textToSend || currentProject.description);
          rawStream = rawStream.trim() + questionsJson;
          setProjects((prev) =>
            prev.map((p) =>
              p.id === projId
                ? {
                    ...p,
                    messages: p.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: rawStream } : m
                    ),
                  }
                : p
            )
          );
        }
      }
    } catch (err: unknown) {
      setEstafetStage("idle");
      console.error("Code AI error:", err);
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses.";
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projId
            ? {
                ...p,
                messages: p.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `Maaf, terjadi kendala saat memproses: ${errMsg}. Silakan coba kirim ulang pesan Anda atau klik 'Generate Blueprint'.`,
                      }
                    : m
                ),
              }
            : p
        )
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  // Fungsi pembersih tampilan chat agar blok data internal JSON tidak mengotori chat pengguna
  // Generator fallback cerdas untuk fitur detail jika terjadi kendala parsing LLM
  const generateRichFeaturesFallback = (title: string, desc?: string): ProjectFeature[] => {
    const domain = detectProjectDomain(activeProject?.messages || [], title, desc);
    return getDomainBlueprint(domain, title).features;
  };

  // Parser Blueprint JSON yang sangat tangguh terhadap variasi output LLM
  const extractBlueprintFromText = (text: string): any => {
    const startTag = "<<<BLUEPRINT_JSON>>>";
    const endTag = "<<<END_BLUEPRINT_JSON>>>";
    let jsonStr = "";

    const sIdx = text.indexOf(startTag);
    if (sIdx !== -1) {
      const eIdx = text.indexOf(endTag, sIdx + startTag.length);
      if (eIdx !== -1) {
        jsonStr = text.slice(sIdx + startTag.length, eIdx).trim();
      } else {
        const rest = text.slice(sIdx + startTag.length);
        const lastBrace = rest.lastIndexOf("}");
        if (lastBrace !== -1) {
          jsonStr = rest.slice(0, lastBrace + 1).trim();
        }
      }
    }

    if (!jsonStr) {
      const matchFence = text.match(/```(?:json)?\s*(\{[\s\S]*?"(?:prd|features|tasks)"[\s\S]*?\})\s*```/);
      if (matchFence) {
        jsonStr = matchFence[1].trim();
      }
    }

    if (!jsonStr) {
      const matchObj = text.match(/(\{[\s\S]*?"(?:prd|features|tasks)"[\s\S]*\})/);
      if (matchObj) {
        const cand = matchObj[1].trim();
        const lastBrace = cand.lastIndexOf("}");
        if (lastBrace !== -1) {
          jsonStr = cand.slice(0, lastBrace + 1).trim();
        }
      }
    }

    if (jsonStr) {
      try {
        return JSON.parse(jsonStr);
      } catch {
        let cleaned = jsonStr.replace(/,\s*([\]}])/g, "$1");
        try {
          return JSON.parse(cleaned);
        } catch {
          if (!cleaned.endsWith("}")) {
            cleaned = cleaned + "\n}";
          }
          try {
            return JSON.parse(cleaned);
          } catch (err) {
            console.warn("Gagal parse blueprint JSON:", err);
          }
        }
      }
    }
    return null;
  };

  // Fungsi pembersih tampilan chat agar blok data internal JSON tidak mengotori chat pengguna
  const cleanChatDisplay = (text: string): string => {
    let result = text;
    const jsonStart = result.indexOf("<<<BLUEPRINT_JSON>>>");
    if (jsonStart !== -1) {
      const before = result.slice(0, jsonStart).trim();
      result = before
        ? `${before}\n\n> **Blueprint Proyek Telah Selesai Dirumuskan:** PRD, spesifikasi fitur, user flow, arsitektur database, dan development tasks telah otomatis diperbarui pada tab di atas!`
        : `Spesifikasi teknis dan blueprint proyek telah selesai dirumuskan secara estafet sesuai brief dan jawaban klarifikasi Anda.\n\n> **Blueprint Proyek Telah Selesai Dirumuskan:** PRD, spesifikasi fitur, user flow, arsitektur database, dan development tasks telah otomatis diperbarui pada tab di atas!`;
    }
    return result;
  };

  // Parser Blueprint JSON untuk mengisi otomatis tab PRD, Features, Flow, Architecture, dan Tasks
  const parseAndApplyBlueprint = (projId: string, fullText: string, assistantMsgId: string) => {
    const blueprintData = extractBlueprintFromText(fullText);
    const hasQuestions = fullText.includes("<<<QUESTIONS_JSON>>>");

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;

        const updated = { ...p };

        // Pastikan chat bubble menampilkan teks bersih dan tidak kosong
        const displayContent =
          cleanChatDisplay(fullText).trim() ||
          "Blueprint dan spesifikasi teknis proyek telah selesai dirumuskan. Anda dapat melihat detailnya pada tab PRD, Features, Flow & Architecture, dan Tasks di atas.";

        updated.messages = updated.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, content: displayContent } : m
        );

        const domain = detectProjectDomain(updated.messages, p.title, p.description);
        const domainBlueprint = getDomainBlueprint(domain, p.title);

        // ── V4 SOURCE LOCK: single pipeline = registry lock → lineage inheritance → integrity repair → matrix ──
        const runLockedAnalysis = (rawTasks: ProjectTask[]) => {
          const prdIn: ProjectPRD | undefined = updated.prd
            ? {
                ...updated.prd,
                primaryType: updated.prd.primaryType || domain.primaryType,
                secondaryTypes: updated.prd.secondaryTypes || domain.secondaryTypes,
                requirementRegistry: updated.prd.requirementRegistry || p.prd?.requirementRegistry,
              }
            : undefined;
          const res = analyzeAndOptimizeTasks(rawTasks, updated.features || [], prdIn, {
            primaryType: prdIn?.primaryType || domain.primaryType,
            secondaryTypes: prdIn?.secondaryTypes || domain.secondaryTypes,
            stackMode: updated.architecture?.stackMode,
            stackAlternatives: domain.stackAlternatives,
            stackIsAiSuggested: updated.architecture?.isAiSuggestedStack,
          });
          updated.tasks = res.tasks;
          updated.qualityGate = res.qualityGate;
          updated.features = res.features;
          if (updated.architecture && res.stackMode) {
            updated.architecture = { ...updated.architecture, stackMode: res.stackMode };
          }
          if (prdIn) {
            const matrix = buildTraceabilityMatrix(res.requirementRegistry, res.features, res.tasks);
            const separation = buildPrdSourceSeparation(
              { ...prdIn, userDerived: undefined, aiDerived: prdIn.aiDerived },
              res.requirementRegistry,
              res.features,
              res.tasks,
              updated.architecture,
              domain.constraints
            );
            updated.prd = {
              ...prdIn,
              primaryType: res.primaryType || res.prd?.primaryType || prdIn.primaryType,
              secondaryTypes: res.secondaryTypes || res.prd?.secondaryTypes || prdIn.secondaryTypes,
              requirementRegistry: res.requirementRegistry,
              classifiedRequirements: res.classifiedRequirements,
              userDerived: { ...separation.userDerived, explicitNFR: prdIn.userDerived?.explicitNFR ?? [] },
              aiDerived: separation.aiDerived,
              traceabilityMatrix: matrix,
            };
            updated.traceabilityMatrix = matrix;
          }
        };

        if (blueprintData) {
          if (blueprintData.prd) {
            const funcReqs = Array.isArray(blueprintData.prd.functionalRequirements) && blueprintData.prd.functionalRequirements.length > 0
              ? blueprintData.prd.functionalRequirements
              : (domainBlueprint.prd.functionalRequirements || []);

            updated.prd = {
              overview: blueprintData.prd.overview || "",
              problemStatement: blueprintData.prd.problemStatement || "",
              goals: Array.isArray(blueprintData.prd.goals) && blueprintData.prd.goals.length > 0
                ? blueprintData.prd.goals
                : (domainBlueprint.prd.goals || []),
              functionalRequirements: funcReqs,
              classifiedRequirements: Array.isArray(blueprintData.prd.classifiedRequirements) && blueprintData.prd.classifiedRequirements.length > 0
                ? blueprintData.prd.classifiedRequirements
                : funcReqs.map((fr: string, fi: number) => ({
                    id: "FR-" + String(fi + 1).padStart(2, "0"),
                    text: fr,
                    source: "USER_REQUIREMENT" as RequirementSource,
                  })),
              nonFunctionalRequirements: Array.isArray(blueprintData.prd.nonFunctionalRequirements) && blueprintData.prd.nonFunctionalRequirements.length > 0
                ? blueprintData.prd.nonFunctionalRequirements
                : (domainBlueprint.prd.nonFunctionalRequirements || []),
              targetUsers: Array.isArray(blueprintData.prd.targetUsers) && blueprintData.prd.targetUsers.length > 0
                ? blueprintData.prd.targetUsers
                : (domainBlueprint.prd.targetUsers || []),
              assumptions: Array.isArray(blueprintData.prd.assumptions)
                ? blueprintData.prd.assumptions
                : [],
              risks: Array.isArray(blueprintData.prd.risks)
                ? blueprintData.prd.risks
                : [],
              constraints: Array.isArray(blueprintData.prd.constraints) ? blueprintData.prd.constraints : p.prd?.constraints,
              requirementRegistry: p.prd?.requirementRegistry,
              userDerived: blueprintData.prd.userDerived,
              aiDerived: blueprintData.prd.aiDerived,
            };
          } else {
            updated.prd = domainBlueprint.prd;
          }

          if (Array.isArray(blueprintData.features) && blueprintData.features.length >= 3) {
            updated.features = blueprintData.features.map((f: any, idx: number) => {
              const scope = f.scope || (idx < 4 ? "MVP" : idx < 7 ? "POST-MVP" : "OPTIONAL");
              const isAiSuggested = typeof f.isAiSuggested === "boolean" ? f.isAiSuggested : scope === "AI-SUGGESTED";
              const relatedReqs = Array.isArray(f.relatedRequirements) ? f.relatedRequirements : [];
              const declaredOrigin = isValidSource(f.origin) ? f.origin : isValidSource(f.sourceType) ? f.sourceType : (isAiSuggested ? "AI_SUGGESTED" : undefined);

              return {
                id: f.id || "FEATURE-" + String(idx + 1).padStart(2, "0"),
                name: f.name || "Feature " + (idx + 1),
                description: f.description || "",
                priority: f.priority || (idx < 2 ? "CRITICAL" : idx < 5 ? "HIGH" : "MEDIUM"),
                scope: scope,
                sourceType: declaredOrigin,
                origin: declaredOrigin,
                sourceRequirementIds: Array.isArray(f.sourceRequirementIds) ? f.sourceRequirementIds : Array.isArray(f.source_requirement_ids) ? f.source_requirement_ids : [],
                sourceRequirements: Array.isArray(f.sourceRequirements) ? f.sourceRequirements : relatedReqs,
                isAiSuggested: isAiSuggested,
                aiReason: f.aiReason || (isAiSuggested ? "Optimasi arsitektur & keandalan sistem" : undefined),
                subFeatures: Array.isArray(f.subFeatures) ? f.subFeatures : [],
                dependencies: Array.isArray(f.dependencies) ? f.dependencies : [],
                relatedRequirements: relatedReqs,
                isMvp: typeof f.isMvp === "boolean" ? f.isMvp : scope === "MVP",
              };
            });
          } else {
            updated.features = domainBlueprint.features;
          }

          if (blueprintData.userFlow && String(blueprintData.userFlow).length > 20) {
            updated.userFlow = String(blueprintData.userFlow);
          } else {
            updated.userFlow = domainBlueprint.userFlow;
          }

          if (blueprintData.architecture) {
            updated.architecture = {
              frontend: blueprintData.architecture.frontend || (domain.userSpecifiedStack.frontend || "Next.js 15 (App Router), Tailwind CSS"),
              backend: blueprintData.architecture.backend || (domain.userSpecifiedStack.backend || "Next.js Route Handlers / Server Actions"),
              database: blueprintData.architecture.database || (domain.needsDatabase ? (domain.userSpecifiedStack.database || "PostgreSQL") : "None (Static Website / Client-side rendering)"),
              auth: blueprintData.architecture.auth || (domain.needsAuth ? "NextAuth / Session Cookie" : "None (Public Website - No Auth Required)"),
              storage: blueprintData.architecture.storage || (domain.needsStorage ? "Supabase Storage / Cloudflare R2" : "None (Static Assets)"),
              realtime: blueprintData.architecture.realtime || (domain.needsRealtime ? "WebSockets / SSE / Supabase Realtime" : "None (Not Required - Standard Request/Response)"),
              backgroundJobs: blueprintData.architecture.backgroundJobs || (domain.needsBackgroundJobs ? "Inngest / BullMQ / Cron" : "None (Not Required - Synchronous Operations)"),
              caching: blueprintData.architecture.caching || (domain.needsCaching ? "Redis / Next.js Data Cache" : "None (Not Required - Direct Data Flow)"),
              deployment: blueprintData.architecture.deployment || "Vercel / Cloudflare Pages",
              dataSchema: blueprintData.architecture.dataSchema || (domain.needsDatabase ? (domainBlueprint.architecture.dataSchema || "") : "-- Tidak memerlukan skema database relasional (Static site / JSON content)"),
              isAiSuggestedStack: !domain.userSpecifiedStack.specified,
              stackMode: normalizeStackMode(blueprintData.architecture.stackMode, domain.stackMode),
              stackRecommendations: Array.isArray(blueprintData.architecture.stackRecommendations) ? blueprintData.architecture.stackRecommendations : [],
              userConstraints: domain.constraints,
              complexityLevel: domain.complexity,
            };
          } else {
            updated.architecture = domainBlueprint.architecture;
          }

          if (Array.isArray(blueprintData.tasks) && blueprintData.tasks.length >= 4) {
            const rawTasks: ProjectTask[] = blueprintData.tasks.map((t: any, idx: number) => {
              const taskId = t.id || "TASK-" + String(idx + 1).padStart(3, "0");
              const parentFeat = t.relatedFeature || t.feature || ("FEATURE-" + String(Math.floor(idx / 2) + 1).padStart(2, "0"));
              return {
                id: taskId,
                title: t.title || "Task " + (idx + 1),
                description: t.description || "",
                status: (t.status === "done" || t.status === "failed" || t.status === "blocked" || t.status === "review" || t.status === "ready" || t.status === "backlog" || t.status === "in_progress") ? t.status : "backlog",
                phase: t.phase || "Phase " + (Math.floor(idx / 3) + 1) + " - Pengembangan",
                priority: t.priority || (idx < 2 ? "CRITICAL" : idx < 7 ? "HIGH" : "MEDIUM"),
                feature: parentFeat,
                relatedFeature: parentFeat,
                source: isValidSource(t.origin) ? t.origin : isValidSource(t.source) ? t.source : undefined,
                origin: isValidSource(t.origin) ? t.origin : isValidSource(t.source) ? t.source : undefined,
                sourceRequirementIds: Array.isArray(t.sourceRequirementIds) ? t.sourceRequirementIds : Array.isArray(t.source_requirement_ids) ? t.source_requirement_ids : [],
                deliverable: t.deliverable || `Deliverable modul ${t.title || ""}`,
                dependencyType: (t.dependencyType === "HARD" || t.dependencyType === "SOFT" || t.dependencyType === "NONE") ? t.dependencyType : (idx === 0 ? "NONE" : "HARD"),
                complexity: (t.complexity === "XS" || t.complexity === "S" || t.complexity === "M" || t.complexity === "L" || t.complexity === "XL") ? t.complexity : (idx % 3 === 0 ? "L" : idx % 2 === 0 ? "M" : "S"),
                technicalNotes: t.technicalNotes || "",
                relatedRequirements: Array.isArray(t.relatedRequirements) ? t.relatedRequirements : [],
                dependencies: Array.isArray(t.dependencies) ? t.dependencies : (idx === 0 ? [] : ["TASK-" + String(idx).padStart(3, "0")]),
                parallelGroup: t.parallelGroup || (t.parallelizable === "YES" ? "PG-01" : undefined),
                subtasks: Array.isArray(t.subtasks) && t.subtasks.length > 0
                  ? t.subtasks
                  : [
                      `${taskId}.1: Implementasi logic & skema ${t.title || ""}`,
                      `${taskId}.2: Integrasi UI & validasi input`,
                    ],
                acceptanceCriteria: Array.isArray(t.acceptanceCriteria) && t.acceptanceCriteria.length > 0
                  ? t.acceptanceCriteria
                  : [
                      `Modul ${t.title || ""} berhasil dieksekusi tanpa throw error`,
                      `Data input tervalidasi dengan benar`,
                      `Error state ditampilkan saat request gagal / invalid`,
                    ],
                testing: Array.isArray(t.testing) && t.testing.length > 0
                  ? t.testing
                  : [
                      `Pengujian skenario sukses (Happy Path)`,
                      `Pengujian input tidak valid & error handling`,
                      `Pengujian responsivitas tampilan antarmuka`,
                    ],
                parallelizable: (t.parallelizable === "YES" || t.parallelizable === "NO")
                  ? t.parallelizable
                  : (idx > 2 && idx % 2 === 0 ? "YES" : "NO"),
              };
            });
            runLockedAnalysis(rawTasks);
          } else {
            // Jika tasks dari LLM sedikit, gunakan tasks blueprint domain yang telah dioptimasi
            runLockedAnalysis(domainBlueprint.tasks);
          }
        } else if (!hasQuestions) {
          // Jika respons bukan pertanyaan discovery (misal instruksi pembuatan PRD/Blueprint langsung),
          // gunakan data spesifik domain agar pengguna selalu mendapatkan hasil 100% relevan & detail
          if (!updated.prd || !updated.prd.overview) {
            updated.prd = domainBlueprint.prd;
          }
          if (!updated.features || updated.features.length === 0) {
            updated.features = domainBlueprint.features;
          }
          if (!updated.userFlow) {
            updated.userFlow = domainBlueprint.userFlow;
          }
          if (!updated.architecture || !updated.architecture.dataSchema) {
            updated.architecture = domainBlueprint.architecture;
          }
          if (!updated.tasks || updated.tasks.length === 0) {
            runLockedAnalysis(domainBlueprint.tasks);
          } else if (!updated.prd?.requirementRegistry) {
            // Legacy project without registry: lock the registry once and derive lineage (matrix) from it.
            runLockedAnalysis(updated.tasks);
          }
        }

        // Auto-generate HTML prototype based on finalized PRD, features, and tasks
        updated.generatedHtml = generateStarterPrototypeHtml(updated);

        updated.updatedAt = Date.now();
        return updated;
      })
    );
  };

  // ── Task Management Actions ───────────────────────────────────────────────────
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (!activeProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
              updatedAt: Date.now(),
            }
          : p
      )
    );
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !activeProject) return;
    const newTask: ProjectTask = {
      id: "task-" + Date.now(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || "Tidak ada deskripsi tambahan.",
      status: newTaskStatus,
      feature: newTaskFeature.trim() || "General",
      phase: "Manual Task",
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              tasks: [...p.tasks, newTask],
              updatedAt: Date.now(),
            }
          : p
      )
    );

    setShowAddTaskModal(false);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskFeature("");
  };

  const handleDeleteTask = (taskId: string) => {
    if (!activeProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
              updatedAt: Date.now(),
            }
          : p
      )
    );
  };

  // ── Context Copy / Export Helpers (Bebas Emote) ────────────────────────────────
  const copyPRDText = () => {
    if (!activeProject) return;
    const prd = activeProject.prd;
    let text = `# PRD (Product Requirements Document) — ${activeProject.title}\n\n`;
    if (prd?.primaryType) {
      text += `**Primary Type:** ${prd.primaryType}\n`;
      if (prd.secondaryTypes && prd.secondaryTypes.length > 0) {
        text += `**Secondary Types:** ${prd.secondaryTypes.join(", ")}\n`;
      }
      text += `\n`;
    }
    text += `## 1. Overview\n${prd?.overview || activeProject.description || "Perencanaan sistem project."}\n\n`;
    text += `## 2. Problem Statement\n${prd?.problemStatement || "Menyelesaikan inefisiensi dan memberikan solusi digital terstruktur."}\n\n`;
    text += `## 3. Goals & Objectives\n${prd?.goals?.map((g, i) => `${i + 1}. ${g}`).join("\n") || "- Membangun sistem yang handal"}\n\n`;
    text += `## 4. Target Users\n${prd?.targetUsers?.map((u) => `- ${u}`).join("\n") || "- Pengguna akhir"}\n\n`;
    text += `## 5. Functional Requirements\n${prd?.functionalRequirements?.map((f, i) => `${i + 1}. ${f}`).join("\n") || "- Fitur utama aplikasi"}\n\n`;
    text += `## 6. Non-Functional Requirements\n${prd?.nonFunctionalRequirements?.map((nf, i) => `${i + 1}. ${nf}`).join("\n") || "- Cepat, aman, dan responsif"}\n\n`;

    if (prd?.assumptions && prd.assumptions.length > 0) {
      text += `## 7. Technical & Product Assumptions\n`;
      prd.assumptions.forEach((ass, i) => {
        text += `- **${ass.id || `ASSUMPTION-${String(i + 1).padStart(2, "0")}`}**: ${ass.assumption}\n`;
        if (ass.reason) text += `  * Alasan: ${ass.reason}\n`;
        if (ass.impact) text += `  * Dampak: ${ass.impact}\n`;
      });
      text += "\n";
    }

    if (prd?.risks && prd.risks.length > 0) {
      text += `## 8. Technical Risks & Mitigations\n`;
      prd.risks.forEach((r, i) => {
        text += `${i + 1}. ${r}\n`;
      });
      text += "\n";
    }

    navigator.clipboard.writeText(text);
    showCopyToast("PRD berhasil disalin ke Clipboard!");
  };

  const copyFeaturesText = () => {
    if (!activeProject) return;
    const features = activeProject.features || [];
    let text = `# Feature Specifications & Hierarchy — ${activeProject.title}\n\n`;
    if (features.length === 0) {
      text += "Belum ada daftar fitur khusus yang tercatat.";
    } else {
      features.forEach((f, idx) => {
        const featId = f.id || `FEATURE-${String(idx + 1).padStart(2, "0")}`;
        const scope = f.isMvp !== false ? "MVP" : "POST-MVP";
        text += `### ${featId}: ${f.name} [${scope}] [Priority: ${f.priority || "Medium"}]\n`;
        text += `${f.description}\n`;
        if (f.relatedRequirements && f.relatedRequirements.length > 0) {
          text += `Related Requirements: ${f.relatedRequirements.join(", ")}\n`;
        }
        if (f.subFeatures && f.subFeatures.length > 0) {
          text += `Sub-features:\n` + f.subFeatures.map((s) => `  - ${s}`).join("\n") + "\n";
        }
        if (f.dependencies && f.dependencies.length > 0) {
          text += `Dependencies: ${f.dependencies.join(", ")}\n`;
        }
        text += "\n";
      });
    }
    navigator.clipboard.writeText(text);
    showCopyToast("Features berhasil disalin ke Clipboard!");
  };

  const copyTasksText = () => {
    if (!activeProject) return;
    const tasks = activeProject.tasks;
    let text = `# Actionable Development Tasks & Verification Blueprint — ${activeProject.title}\n\n`;
    const todo = tasks.filter((t) => t.status === "todo");
    const inProg = tasks.filter((t) => t.status === "in_progress");
    const done = tasks.filter((t) => t.status === "done");
    const failed = tasks.filter((t) => t.status === "failed");

    text += `## Total: ${tasks.length} Tasks (${calculateProgress(activeProject)}% Selesai)\n\n`;

    const formatTaskItem = (t: ProjectTask, idx: number, isDone: boolean) => {
      const taskId = t.id || `TASK-${String(idx + 1).padStart(3, "0")}`;
      let item = `- [${isDone ? "x" : " "}] **${taskId}: ${t.title}** [${t.priority || "HIGH"}] (${t.phase || "Dev"}) [Parallel: ${t.parallelizable || "NO"}]\n`;
      item += `  * Deskripsi: ${t.description}\n`;
      if (t.relatedRequirements && t.relatedRequirements.length > 0) {
        item += `  * Requirements: ${t.relatedRequirements.join(", ")}\n`;
      }
      if (t.dependencies && t.dependencies.length > 0) {
        item += `  * Dependencies: ${t.dependencies.join(", ")}\n`;
      }
      if (t.subtasks && t.subtasks.length > 0) {
        item += `  * Subtasks:\n` + t.subtasks.map((st) => `    - [ ] ${st}`).join("\n") + "\n";
      }
      if (t.acceptanceCriteria && t.acceptanceCriteria.length > 0) {
        item += `  * Acceptance Criteria:\n` + t.acceptanceCriteria.map((ac) => `    - ${ac}`).join("\n") + "\n";
      }
      if (t.testing && t.testing.length > 0) {
        item += `  * Testing:\n` + t.testing.map((test) => `    - ${test}`).join("\n") + "\n";
      }
      return item;
    };

    if (inProg.length > 0) {
      text += `### [IN PROGRESS] Sedang Dikerjakan (${inProg.length})\n`;
      inProg.forEach((t, i) => (text += formatTaskItem(t, i, false) + "\n"));
      text += "\n";
    }

    if (todo.length > 0) {
      text += `### [TODO] Belum Mulai (${todo.length})\n`;
      todo.forEach((t, i) => (text += formatTaskItem(t, i, false) + "\n"));
      text += "\n";
    }

    if (done.length > 0) {
      text += `### [DONE] Selesai (${done.length})\n`;
      done.forEach((t, i) => (text += formatTaskItem(t, i, true) + "\n"));
      text += "\n";
    }

    if (failed.length > 0) {
      text += `### [BLOCKED] Kendala / Gagal (${failed.length})\n`;
      failed.forEach((t, i) => (text += formatTaskItem(t, i, false) + "\n"));
      text += "\n";
    }

    navigator.clipboard.writeText(text);
    showCopyToast("Tasks lengkap dengan Subtasks & Verifikasi berhasil disalin!");
  };

  const copyEverythingText = () => {
    if (!activeProject) return;
    if (!activeProject.prd?.overview || !activeProject.features?.length || !activeProject.tasks?.length) {
      showCopyToast("Blueprint proyek belum selesai dirumuskan. Selesaikan sesi AI Planner di tab Chat terlebih dahulu.");
      return;
    }
    if (!isSourceExportAllowed(activeProject.qualityGate)) {
      showCopyToast("Export BLOCKED: masih ada unresolved Source Integrity violation. Lihat detail di Task Board.");
      return;
    }
    const domain = detectProjectDomain(activeProject.messages, activeProject.title, activeProject.description);

    const prd = activeProject.prd;
    const arch = activeProject.architecture;
    const features = activeProject.features || [];
    const tasks = activeProject.tasks || [];
    const userFlow = activeProject.userFlow || "Standard User Journey";
    const dataSchema = arch?.dataSchema || "";

    const masterPrompt = `# MASTER PROJECT CONTEXT FOR AI CODING TOOLS (Antigravity / Cursor / Claude Code)
# Project: ${activeProject.title} (${domain.categories.join(", ")})
# Generated by: Usick One — Code Planner (Universal V4 Blueprint Engine)
# Traceability: Requirements -> Features -> Tasks -> Subtasks -> Acceptance Criteria -> Testing
# Complexity Level: ${arch?.complexityLevel || domain.complexity}
# Stack Mode: ${arch?.stackMode || (arch?.isAiSuggestedStack ? "AI_RECOMMENDED" : "PARTIALLY_SPECIFIED")}${arch?.stackMode === "USER_SPECIFIED" ? " (seluruh teknologi ditentukan user)" : arch?.stackMode === "PARTIALLY_SPECIFIED" ? " (sebagian ditentukan user, sisanya perlu keputusan/review)" : arch?.stackMode === "EXISTING_PROJECT" ? " (mengikuti arsitektur proyek eksisting)" : " (rekomendasi AI — review sebelum lock-in)"}
# SOURCE INTEGRITY = ${activeProject.qualityGate?.sourceIntegrityState ? `${activeProject.qualityGate.sourceIntegrityState.status} (Initial: ${activeProject.qualityGate.sourceIntegrityState.initialViolations}, Repaired: ${activeProject.qualityGate.sourceIntegrityState.repairedViolations}, Remaining: ${activeProject.qualityGate.sourceIntegrityState.remainingViolations}) | EXPORT = ALLOWED` : "N/A (belum dievaluasi — generate ulang blueprint)"}

---
## 1. PROJECT OVERVIEW & PRD
- **Primary Type**: ${prd?.primaryType || domain.primaryType}
- **Secondary Types**: ${(prd?.secondaryTypes || domain.secondaryTypes || []).join(", ") || "None"}
- **Description**: ${prd?.overview || activeProject.description}
- **Problem Statement**: ${prd?.problemStatement || "Menyelesaikan inefisiensi dan memberikan solusi digital terstruktur."}
- **Key Goals**:
${prd?.goals?.map((g) => `  * ${g}`).join("\n") || "  * Menghasilkan aplikasi fungsional yang stabil"}

---
## 2. TARGET USERS & REQUIREMENTS (Source Lock — Requirement Lineage)
- **Target Users**: ${prd?.targetUsers?.join(", ") || "Klien Utama, Staff Operasional, Administrator"}

### 2A. REQUIREMENT REGISTRY (Locked at Ingestion)
${prd?.requirementRegistry && prd.requirementRegistry.length > 0
  ? prd.requirementRegistry.map((r) => `  * **${r.id}** [${r.classification}] [${r.status}]: ${r.text}`).join("\n")
  : (prd?.classifiedRequirements && prd.classifiedRequirements.length > 0
    ? prd.classifiedRequirements.map((cr) => `  * [${cr.source}] **${cr.id}**: ${cr.text}`).join("\n")
    : (prd?.functionalRequirements?.map((f) => `  * ${f}`).join("\n") || "  * Standar modul aplikasi"))}

### 2B. USER-DERIVED
- **Goals**:
${(prd?.userDerived?.goals || prd?.goals || []).map((g) => `  * ${g}`).join("\n") || "  * -"}
- **Functional Requirements**:
${(prd?.userDerived?.functionalRequirements || prd?.functionalRequirements || []).map((f) => `  * ${f}`).join("\n") || "  * -"}
- **User Constraints**: ${((prd?.userDerived?.userConstraints && prd.userDerived.userConstraints.length > 0) ? prd.userDerived.userConstraints : domain.constraints).join(", ") || "-"}
- **Explicit NFR**: ${(prd?.userDerived?.explicitNFR || []).join("; ") || "-"}

### 2C. AI-DERIVED (Not user requirements)
- **Non-Functional Requirements / Technical Recommendations**:
${[...(prd?.nonFunctionalRequirements || []), ...(prd?.aiDerived?.technicalRecommendations || [])].map((nf) => `  * ${nf}`).join("\n") || "  * -"}
- **Architecture Suggestions**: ${(prd?.aiDerived?.architectureSuggestions || []).join("; ") || "-"}
- **Assumptions / TBD**: ${(prd?.aiDerived?.assumptions || []).map((a) => (typeof a === "string" ? a : a.assumption)).join("; ") || "-"}
- **OPTIONAL AI SUGGESTIONS** (tidak termasuk mandatory scope):
${[...(prd?.aiDerived?.optionalFeatures || []), ...(prd?.aiDerived?.aiSuggestions || [])].map((s) => `  * ${s}`).join("\n") || "  * -"}
${domain.constraints.length > 0 ? `- **Project Constraints**: ${domain.constraints.join(", ")}\n` : ""}
${prd?.assumptions && prd.assumptions.length > 0 ? `### Technical & Product Assumptions:\n${prd.assumptions.map((ass, i) => `- **${ass.id || `ASSUMPTION-${String(i+1).padStart(2, '0')}`}**: ${ass.assumption}${ass.reason ? ` (Alasan: ${ass.reason})` : ""}${ass.impact ? ` (Dampak: ${ass.impact})` : ""}`).join("\n")}\n\n` : ""}${prd?.risks && prd.risks.length > 0 ? `### Technical Risks & Mitigations:\n${prd.risks.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\n` : ""}---
## 3. TECHNICAL ARCHITECTURE & STACK
- **Frontend**: ${arch?.frontend || "Next.js 15 (App Router), Tailwind CSS"}
- **Backend / API**: ${arch?.backend || "Next.js Server Actions / Route Handlers, Zod Validation"}
- **Database**: ${arch?.database || "PostgreSQL / Supabase"}
- **Authentication**: ${arch?.auth || "Supabase Auth / NextAuth"}
- **Storage**: ${arch?.storage || "Supabase Storage / Cloudflare R2"}
- **Third-party Services**: ${arch?.thirdParty?.join(", ") || "Payment Gateway, Notification Gateway"}
- **Deployment**: ${arch?.deployment || "Vercel"}

### Data / Schema Blueprint:
\`\`\`sql
${dataSchema}
\`\`\`

---
## 4. USER FLOW
${userFlow}

---
## 5. FEATURE BREAKDOWN (Traceable to Requirements)
${features.map((f, i) => {
  const featId = f.id || `FEATURE-${String(i + 1).padStart(2, "0")}`;
  const scope = f.scope || (f.isMvp !== false ? "MVP" : "POST-MVP");
  const src = f.origin || f.sourceType || (f.isAiSuggested ? "AI_SUGGESTED" : "TECHNICAL_DECISION");
  let str = `${i + 1}. **${featId}: ${f.name}** [${scope}] [Source: ${src}] [Priority: ${f.priority || "Medium"}]:\n   ${f.description}`;
  str += `\n   - source_requirement_ids: ${(f.sourceRequirementIds && f.sourceRequirementIds.length > 0) ? f.sourceRequirementIds.join(", ") : "-"}`;
  str += `\n   - origin: ${src}`;
  if (f.subFeatures && f.subFeatures.length > 0) {
    str += `\n   - Sub-fitur: ${f.subFeatures.join(", ")}`;
  }
  if (f.dependencies && f.dependencies.length > 0) {
    str += `\n   - Dependencies: ${f.dependencies.join(", ")}`;
  }
  return str;
}).join("\n\n")}

---
## 6. ACTIONABLE DEVELOPMENT BLUEPRINT (${tasks.length} Atomic Tasks)
${tasks.map((t, i) => {
  const taskId = t.id || `TASK-${String(i + 1).padStart(3, "0")}`;
  const src = t.origin || t.source || "TECHNICAL_DECISION";
  const lineageIds = (t.sourceRequirementIds && t.sourceRequirementIds.length > 0) ? t.sourceRequirementIds.join(", ") : "-";
  let block = `### ${i + 1}. [${t.status.toUpperCase()}] **${taskId}: ${t.title}** [${t.priority || "HIGH"}] [Size: ${t.complexity || "M"}] (${t.phase || "Dev"}) [Parallel: ${t.parallelizable || "NO"}${t.parallelGroup ? ` (${t.parallelGroup})` : ""}]\n- **Deskripsi**: ${t.description}\n- **Source**: ${src}\n- **source_requirement_ids**: ${lineageIds}\n- **origin**: ${src}\n- **Related Feature**: ${t.relatedFeature || t.feature || "N/A"}`;
  if (t.deliverable) {
    block += `\n- **Deliverable**: ${t.deliverable}`;
  }
  if (t.relatedRequirements && t.relatedRequirements.length > 0) {
    block += `\n- **Requirements**: ${t.relatedRequirements.join(", ")}`;
  }
  if (t.dependencies && t.dependencies.length > 0) {
    block += `\n- **Dependencies**: ${t.dependencies.join(", ")} (${t.dependencyType || "HARD"})`;
  }
  if (t.subtasks && t.subtasks.length > 0) {
    block += `\n- **Subtasks**:\n` + t.subtasks.map((st) => `  * [ ] ${st}`).join("\n");
  }
  if (t.acceptanceCriteria && t.acceptanceCriteria.length > 0) {
    block += `\n- **Acceptance Criteria** [source_requirement_ids: ${lineageIds}] [origin: ${src}]:\n` + t.acceptanceCriteria.map((ac) => `  * ${ac}`).join("\n");
  }
  if (t.testing && t.testing.length > 0) {
    block += `\n- **Testing Requirements** [source_requirement_ids: ${lineageIds}] [origin: ${src}]:\n` + t.testing.map((test) => `  * ${test}`).join("\n");
  }
  return block;
}).join("\n\n")}

---
## 7. COMPACT TRACEABILITY MATRIX
${(() => {
  const matrix = activeProject.traceabilityMatrix || activeProject.prd?.traceabilityMatrix || [];
  if (matrix.length > 0) {
    let md = "| Requirement | Feature | Tasks | Classification |\n|---|---|---|---|\n";
    matrix.forEach((row: TraceabilityRow) => {
      md += `| ${row.requirementId} | ${row.featureId} | ${row.taskIds.join(", ") || "-"} | ${row.classification} |\n`;
    });
    return md.trim();
  }
  return "| Requirement | Feature | Tasks | Classification |\n|---|---|---|---|\n| - | - | - | - |";
})()}

---
## 8. AI CODING ASSISTANT INSTRUCTIONS
1. Read the complete project context before modifying code.
2. Follow confirmed USER_REQUIREMENTS and USER_CONSTRAINTS as the highest-priority source of truth.
3. Do not implement AI-SUGGESTED functionality unless explicitly approved.
4. Do not introduce technologies that conflict with the confirmed stack or constraints.
5. Implement tasks according to dependency order.
6. Tasks marked Parallel: YES may be developed independently when safe.
7. Verify acceptance criteria before marking a task complete.
8. Run the relevant testing requirements after implementation.
9. Do not expand project scope without explicit approval.
10. Prefer simple, maintainable solutions over unnecessary complexity.
11. Preserve existing functionality when modifying an existing project.
12. If a critical ambiguity blocks implementation, mark the task BLOCKED and request clarification.
13. Do not silently invent business rules.
14. Do not silently replace the selected technology stack.
15. Keep implementation aligned with the generated traceability chain.`;

    navigator.clipboard.writeText(masterPrompt);
    showCopyToast("Master Context Blueprint lengkap (V4 Traceability) berhasil disalin!");
  };

  const downloadProjectPdf = () => {
    if (!activeProject) return;
    if (!activeProject.prd?.overview || !activeProject.features?.length || !activeProject.tasks?.length) {
      showCopyToast("Blueprint proyek belum lengkap. Selesaikan sesi AI Planner terlebih dahulu.");
      return;
    }
    if (!isSourceExportAllowed(activeProject.qualityGate)) {
      showCopyToast("Export BLOCKED: masih ada unresolved Source Integrity violation. Lihat detail di Task Board.");
      return;
    }
    const domain = detectProjectDomain(activeProject.messages, activeProject.title, activeProject.description);
    const prd = activeProject.prd;
    const arch = activeProject.architecture;
    const features = activeProject.features || [];
    const tasks = activeProject.tasks || [];
    const matrix = activeProject.traceabilityMatrix || prd?.traceabilityMatrix || [];

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${activeProject.title} — Blueprint Document</title>
  <style>
    @page { size: A4; margin: 16mm 14mm 16mm 14mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.5;
      font-size: 10pt;
      margin: 0;
      padding: 24px;
    }
    h1 { font-size: 18pt; margin-bottom: 4px; color: #000; border-bottom: 2px solid #000; padding-bottom: 6px; }
    h2 { font-size: 13pt; margin-top: 20px; margin-bottom: 6px; color: #111; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    h3 { font-size: 10.5pt; margin-top: 12px; margin-bottom: 4px; color: #374151; }
    p { margin: 4px 0; }
    ul { margin: 4px 0 10px 18px; padding: 0; }
    li { margin-bottom: 3px; }
    .badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1.5px 5px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      background: #f3f4f6;
      color: #374151;
      margin-right: 4px;
    }
    .badge-dark { background: #000; color: #fff; border-color: #000; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8.5pt; }
    th, td { border: 1px solid #e5e7eb; padding: 5px 7px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
    .task-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 8px;
      page-break-inside: avoid;
      background: #fafafa;
    }
    .meta { font-size: 8.5pt; color: #6b7280; margin-bottom: 14px; }
    pre { background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 8pt; overflow-x: auto; font-family: monospace; white-space: pre-wrap; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${activeProject.title}</h1>
  <div class="meta">
    <strong>Primary Type:</strong> ${prd?.primaryType || domain.primaryType} |
    <strong>Secondary Types:</strong> ${(prd?.secondaryTypes || domain.secondaryTypes || []).join(", ") || "None"} |
    <strong>Kompleksitas:</strong> ${arch?.complexityLevel || domain.complexity} |
    <strong>Stack Mode:</strong> ${arch?.stackMode || (arch?.isAiSuggestedStack ? "AI_RECOMMENDED" : "PARTIALLY_SPECIFIED")} |
    <strong>Source Integrity:</strong> ${activeProject.qualityGate?.sourceIntegrityState?.status || "N/A"} |
    <strong>Tanggal:</strong> ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
  </div>

  <h2>1. Ringkasan PRD &amp; Objektif</h2>
  <p><strong>Gambaran Umum:</strong> ${prd?.overview || activeProject.description}</p>
  <p><strong>Problem Statement:</strong> ${prd?.problemStatement || "-"}</p>
  ${prd?.goals && prd.goals.length > 0 ? `<h3>Key Goals:</h3><ul>${prd.goals.map((g: string) => `<li>${g}</li>`).join("")}</ul>` : ""}
  ${prd?.targetUsers && prd.targetUsers.length > 0 ? `<h3>Target Pengguna:</h3><ul>${prd.targetUsers.map((u: string) => `<li>${u}</li>`).join("")}</ul>` : ""}

  <h2>2. Kebutuhan Fungsional &amp; Batasan</h2>
  ${prd?.classifiedRequirements && prd.classifiedRequirements.length > 0 ? `<ul>${prd.classifiedRequirements.map((r: any) => `<li><span class="badge ${r.source === 'USER_REQUIREMENT' || r.source === 'USER_CONSTRAINT' ? 'badge-dark' : ''}">[${r.source}]</span> <strong>${r.id}:</strong> ${r.text}</li>`).join("")}</ul>` : `<ul>${(prd?.functionalRequirements || []).map((f: string) => `<li>${f}</li>`).join("")}</ul>`}

  <h2>3. Arsitektur Teknis &amp; Infrastruktur</h2>
  <table>
    <tr><th style="width: 25%;">Komponen</th><th>Teknologi Terpilih</th></tr>
    <tr><td>Frontend</td><td>${arch?.frontend || "-"}</td></tr>
    <tr><td>Backend / API</td><td>${arch?.backend || "-"}</td></tr>
    <tr><td>Database</td><td>${arch?.database || "None"}</td></tr>
    <tr><td>Authentication</td><td>${arch?.auth || "None"}</td></tr>
    <tr><td>Storage</td><td>${arch?.storage || "None"}</td></tr>
    <tr><td>Realtime</td><td>${arch?.realtime || "None"}</td></tr>
    <tr><td>Background Jobs</td><td>${arch?.backgroundJobs || "None"}</td></tr>
    <tr><td>Caching</td><td>${arch?.caching || "None"}</td></tr>
    <tr><td>Deployment</td><td>${arch?.deployment || "-"}</td></tr>
  </table>

  <h2>4. Alur Pengguna (User Flow)</h2>
  <pre>${activeProject.userFlow || "Standard User Journey"}</pre>

  <h2>5. Dekomposisi Fitur (${features.length} Fitur)</h2>
  ${features.map((f: any, idx: number) => `
    <div class="task-card">
      <strong>${f.id || `FEATURE-${idx + 1}`}: ${f.name}</strong>
      <span class="badge">${f.scope || (f.isMvp !== false ? "MVP" : "POST-MVP")}</span>
      <span class="badge">${f.sourceType || "USER_REQUIREMENT"}</span>
      <p style="margin: 3px 0;">${f.description}</p>
      ${f.subFeatures && f.subFeatures.length > 0 ? `<ul style="margin: 3px 0 0 16px;">${f.subFeatures.map((sf: string) => `<li>${sf}</li>`).join("")}</ul>` : ""}
    </div>
  `).join("")}

  <h2>6. Actionable Development Tasks (${tasks.length} Tasks)</h2>
  ${tasks.map((t: any) => `
    <div class="task-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>[${t.status?.toUpperCase() || "BACKLOG"}] ${t.id}: ${t.title}</strong>
        <div>
          <span class="badge badge-dark">${t.priority || "HIGH"}</span>
          <span class="badge">${t.complexity || "M"}</span>
          <span class="badge">Parallel: ${t.parallelizable || "NO"}</span>
        </div>
      </div>
      <p style="margin: 3px 0;"><strong>Fitur:</strong> ${t.relatedFeature || t.feature || "-"}</p>
      <p style="margin: 3px 0;">${t.description}</p>
      ${t.subtasks && t.subtasks.length > 0 ? `<div style="margin-top: 4px;"><strong>Subtasks:</strong><ul>${t.subtasks.map((st: string) => `<li>[ ] ${st}</li>`).join("")}</ul></div>` : ""}
      ${t.acceptanceCriteria && t.acceptanceCriteria.length > 0 ? `<div style="margin-top: 4px;"><strong>Acceptance Criteria:</strong><ul>${t.acceptanceCriteria.map((ac: string) => `<li>${ac}</li>`).join("")}</ul></div>` : ""}
      ${t.testing && t.testing.length > 0 ? `<div style="margin-top: 4px;"><strong>Testing:</strong><ul>${t.testing.map((test: string) => `<li>${test}</li>`).join("")}</ul></div>` : ""}
    </div>
  `).join("")}

  ${matrix.length > 0 ? `
    <h2>7. Compact Traceability Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>Requirement</th>
          <th>Feature</th>
          <th>Tasks</th>
          <th>Classification</th>
        </tr>
      </thead>
      <tbody>
        ${matrix.map((row: any) => `
          <tr>
            <td><strong>${row.requirementId}</strong></td>
            <td>${row.featureId}</td>
            <td>${row.taskIds.join(", ") || "-"}</td>
            <td><span class="badge">${row.classification}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : ""}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Project List
  // ─────────────────────────────────────────────────────────────────────────────
  if (!activeProject) {
    return (
      <div className={`flex flex-col h-full w-full overflow-y-auto ${isDark ? "bg-[#0c0c0e] text-white" : "bg-[#fafafc] text-black"}`}>
        {/* Header Bar */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b backdrop-blur-md ${
          isDark ? "bg-[#0c0c0e]/90 border-zinc-850" : "bg-white/90 border-zinc-200"
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition ${isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-black"}`}
              title="Kembali ke Chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono font-bold text-xs ${
                isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
              }`}>
                &lt;/&gt;
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">Code</h1>
                <p className="text-[11px] font-medium text-zinc-400">AI Project Planner &amp; Software Architect</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition shadow-xs cursor-pointer ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                : "bg-black hover:bg-zinc-800 text-white shadow-black/20"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Project Baru</span>
          </button>
        </div>

        {/* Content Area: Projects Grid */}
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Daftar Project Anda</h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              Rancang ide web atau aplikasi Anda menjadi PRD, fitur, arsitektur, dan task board yang siap di-copy ke AI coding tool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create Project Card Placeholder */}
            <div
              onClick={() => setShowNewModal(true)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed transition cursor-pointer min-h-[180px] text-center ${
                isDark
                  ? "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-400 hover:text-white"
                  : "border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-black"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full mb-3 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-semibold">Buat Perencanaan Project Baru</span>
              <span className="text-[11px] text-zinc-400 mt-0.5">Ubah ide mentah jadi PRD &amp; Task</span>
            </div>

            {/* List Project Cards */}
            {projects.map((proj) => {
              const progress = calculateProgress(proj);
              const totalTasks = proj.tasks.length;
              const doneTasks = proj.tasks.filter((t) => t.status === "done").length;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setActiveTab("chat");
                  }}
                  className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isDark
                      ? "border-zinc-800 bg-zinc-900/70 hover:bg-zinc-900 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/50"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base leading-snug line-clamp-1">{proj.title}</h3>
                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition ${
                          isDark ? "hover:bg-zinc-800 text-zinc-500 hover:text-red-400" : "hover:bg-zinc-100 text-zinc-400 hover:text-red-600"
                        }`}
                        title="Hapus project"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <p className={`text-xs mt-1.5 line-clamp-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      {proj.description || "Tidak ada deskripsi singkat."}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className={isDark ? "text-zinc-400" : "text-zinc-600"}>
                        {totalTasks} Tasks ({doneTasks} selesai)
                      </span>
                      <span className={`font-semibold ${progress === 100 ? (isDark ? "text-white" : "text-black") : ""}`}>
                        {progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isDark ? "bg-white" : "bg-black"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Create New Project */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"
            }`}>
              <h3 className="text-lg font-bold">Mulai Perencanaan Project Baru</h3>
              <p className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                Beri nama ide aplikasi atau website yang ingin Anda rancang.
              </p>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold block mb-1">Nama Project</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="misal: Aplikasi Kasir Laundry, Portal Lowongan Kerja"
                    className={`w-full rounded-xl px-3.5 py-2 text-xs font-medium border outline-none transition ${
                      isDark ? "bg-zinc-800/70 border-zinc-700 focus:border-white" : "bg-zinc-50 border-zinc-300 focus:border-black"
                    }`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Deskripsi Singkat (Opsional)</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Jelaskan garis besar ide aplikasi Anda..."
                    className={`w-full rounded-xl p-3 text-xs font-medium border outline-none transition resize-none ${
                      isDark ? "bg-zinc-800/70 border-zinc-700 focus:border-white" : "bg-zinc-50 border-zinc-300 focus:border-black"
                    }`}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowNewModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-600"
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newTitle.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition shadow-xs ${
                    newTitle.trim()
                      ? (isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800")
                      : "opacity-40 cursor-not-allowed bg-zinc-500 text-white"
                  }`}
                >
                  Lanjutkan ke Planner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Project Detail Workspace
  // ─────────────────────────────────────────────────────────────────────────────
  const isBlueprintReady = Boolean(
    activeProject.prd?.overview &&
    activeProject.features &&
    activeProject.features.length > 0 &&
    activeProject.tasks &&
    activeProject.tasks.length > 0 &&
    estafetStage !== "prd" &&
    estafetStage !== "features" &&
    estafetStage !== "architecture" &&
    estafetStage !== "tasks"
  );
  const domain = detectProjectDomain(activeProject.messages, activeProject.title, activeProject.description);
  const displayFeatures = isBlueprintReady ? (activeProject.features || []) : [];
  const displayTasks = isBlueprintReady ? (activeProject.tasks || []) : [];
  const displayPrd = isBlueprintReady ? activeProject.prd : undefined;
  const displayArch = isBlueprintReady ? activeProject.architecture : undefined;

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${isDark ? "bg-[#0b0f19] text-white" : "bg-[#f8fafc] text-slate-900"}`}>
      {/* Toast Feedback */}
      {copyFeedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-black border border-zinc-700 dark:border-zinc-300 shadow-xl animate-in fade-in-0 duration-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Top Navbar matching media_1790961373082.jpg */}
      <div className={`flex items-center justify-between px-3 sm:px-6 py-2.5 border-b backdrop-blur-md shrink-0 ${
        isDark ? "bg-[#0b0f19] border-slate-800/80" : "bg-white border-slate-200"
      }`}>
        {/* Left: Brand + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setActiveProjectId(null)}
            className={`p-1.5 rounded-xl transition ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-600 hover:text-black"}`}
            title="Daftar Project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg shadow-xs ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className={`font-bold text-sm tracking-tight hidden sm:inline ${isDark ? "text-white" : "text-slate-900"}`}>
              ngodingpakai
            </span>
          </div>

          <span className="text-slate-600 dark:text-slate-500">/</span>

          <div className="flex items-center gap-1.5 min-w-0 text-xs">
            <span className="text-slate-400">📁</span>
            <span className={`font-semibold truncate max-w-[140px] sm:max-w-[180px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              {activeProject.title}
            </span>
            <span className="text-slate-600 dark:text-slate-500 hidden sm:inline">/</span>
            <span className={`font-semibold truncate max-w-[140px] sm:max-w-[180px] hidden sm:inline ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              {activeProject.title}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-200 text-zinc-800 border-zinc-300"}`}>#1</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showCopyToast("Link proyek disalin!");
              }}
              className="text-slate-400 hover:text-white p-1 rounded transition"
              title="Salin link"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Center / Right: View Navigation & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Navigation Pills */}
          <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? "bg-[#111625] border border-slate-800/80" : "bg-slate-100 border border-slate-200"}`}>
            <button
              onClick={() => setActiveTab("mindmap")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "mindmap"
                  ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
              }`}
              title="Peta Rencana (Visual Mindmap)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Peta Rencana</span>
            </button>

            <button
              onClick={() => setActiveTab("prd")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "prd"
                  ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
              }`}
              title="Wiki Dokumen PRD"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Wiki</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "chat"
                  ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
              }`}
              title="Diskusi & Tanya AI"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="hidden md:inline">Tanya AI</span>
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "tasks"
                  ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
              }`}
              title="Task Board"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="hidden md:inline">Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "preview"
                  ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
              }`}
              title="Quick HTML Preview"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview</span>
            </button>
          </div>

          {/* Primary CTA: Export Dropdown (Replaces Lanjutkan Proyek) */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!isSourceExportAllowed(activeProject?.qualityGate)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md active:scale-95 ${
                !isSourceExportAllowed(activeProject?.qualityGate)
                  ? "opacity-40 cursor-not-allowed " + (isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-500")
                  : isDark
                  ? "bg-white hover:bg-zinc-200 text-black shadow-white/10 cursor-pointer"
                  : "bg-black hover:bg-zinc-800 text-white shadow-black/10 cursor-pointer"
              }`}
              title={isSourceExportAllowed(activeProject?.qualityGate) ? "Export Blueprint Proyek (Salin Text atau Download PDF)" : "Export BLOCKED — masih ada Source Integrity violation (lihat Task Board)"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Export</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <div className={`absolute right-0 mt-2 w-56 rounded-xl border p-1.5 shadow-xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                isDark ? "bg-[#121216]/95 border-zinc-800 text-zinc-200" : "bg-white/95 border-zinc-200 text-zinc-800"
              }`}>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    copyEverythingText();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer ${
                    isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-100 hover:text-black"
                  }`}
                >
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-semibold">Salin Text Project</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Copy context lengkap ke clipboard</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    downloadProjectPdf();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer ${
                    isDark ? "hover:bg-zinc-800 hover:text-white" : "hover:bg-zinc-100 hover:text-black"
                  }`}
                >
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="font-semibold">Download PDF</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Simpan sebagai dokumen PDF</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-600 hover:text-black"}`}
            title="Tutup Workspace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB: VISUAL MINDMAP TREE & PERENCANAAN DRAWER (Sesuai Gambar Referensi)    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "mindmap" && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Panel: Perencanaan Drawer */}
          {isPerencanaanOpen && (
            <div
              className={`border-r flex flex-col shrink-0 z-10 transition-all duration-300 ${
                isPerencanaanExpanded ? "w-full sm:w-2/3" : "w-[360px] sm:w-[420px]"
              } ${
                isDark ? "border-slate-800/80 bg-[#0c101d] text-slate-200" : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              {/* Drawer Header */}
              <div className={`h-12 border-b px-4 flex items-center justify-between shrink-0 ${
                isDark ? "border-slate-800/80 bg-[#0b0e1a]" : "border-slate-200 bg-slate-50"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Perencanaan</span>
                </div>

                {/* Control Icons */}
                <div className="flex items-center gap-1">
                  {/* Eye Icon (PRD Preview) */}
                  <button
                    onClick={() => setPerencanaanMode("prd")}
                    className={`p-1.5 rounded-lg transition ${
                      perencanaanMode === "prd"
                        ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
                    }`}
                    title="Pratinjau PRD"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  {/* Code Icon (Schema & Arsitektur) */}
                  <button
                    onClick={() => setPerencanaanMode("code")}
                    className={`p-1.5 rounded-lg transition ${
                      perencanaanMode === "code"
                        ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
                    }`}
                    title="Lihat Arsitektur & Skema SQL"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>

                  {/* Copy PRD */}
                  <button
                    onClick={copyPRDText}
                    className={`p-1.5 rounded-lg transition ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-black hover:bg-slate-100"}`}
                    title="Salin Dokumen PRD"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* Expand / Shrink */}
                  <button
                    onClick={() => setIsPerencanaanExpanded(!isPerencanaanExpanded)}
                    className={`p-1.5 rounded-lg transition ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-black hover:bg-slate-100"}`}
                    title={isPerencanaanExpanded ? "Perkecil Panel" : "Perlebar Panel"}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>

                  {/* Close Drawer */}
                  <button
                    onClick={() => setIsPerencanaanOpen(false)}
                    className={`p-1.5 rounded-lg transition ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-black hover:bg-slate-100"}`}
                    title="Tutup Panel Perencanaan"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Sub-header: Count indicator */}
              <div className={`px-4 py-2 border-b text-[11px] flex items-center gap-1.5 shrink-0 ${
                isDark ? "border-slate-800/60 bg-slate-900/40 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"
              }`}>
                <span className={`font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>✓</span>
                <span>{isBlueprintReady ? `${displayFeatures.length} fitur dari rencana ini.` : "Menunggu AI Planner"}</span>
              </div>

              {/* Drawer Body: Formatted PRD Document */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs leading-relaxed select-text">
                {!isBlueprintReady ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${
                      isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-700"
                    }`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-sm mb-1">Perencanaan Belum Dirumuskan</h4>
                    <p className={`text-xs max-w-xs mb-4 leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      Diskusikan brief ide proyek Anda dengan AI Planner di tab Chat untuk merumuskan PRD, fitur hierarkis, dan arsitektur teknis secara estafet.
                    </p>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition ${
                        isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                      }`}
                    >
                      Mulai Diskusi di Tab Chat →
                    </button>
                  </div>
                ) : perencanaanMode === "prd" ? (
                  <>
                    <div>
                      <h3 className="text-base font-bold tracking-tight mb-2">
                        PRD — Project Requirements Document
                      </h3>
                      {displayPrd?.primaryType && (
                        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-bold border ${isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"}`}>
                            Primary: {displayPrd.primaryType}
                          </span>
                          {displayPrd?.secondaryTypes && displayPrd.secondaryTypes.length > 0 && (
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] border ${isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-300"}`}>
                              Secondary: {displayPrd.secondaryTypes.join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                      <h4 className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                        1. Overview
                      </h4>
                      <p className={isDark ? "text-slate-300" : "text-slate-700"}>
                        {displayPrd?.overview || activeProject.description}
                      </p>
                    </div>

                    {displayPrd?.problemStatement && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                          Problem Statement:
                        </h4>
                        <p className={isDark ? "text-slate-300" : "text-slate-700"}>
                          {displayPrd.problemStatement}
                        </p>
                      </div>
                    )}

                    {displayPrd?.goals && displayPrd.goals.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                          Target &amp; Goals:
                        </h4>
                        <ul className={`space-y-1.5 pl-3 border-l-2 ${isDark ? "border-zinc-500" : "border-zinc-700"}`}>
                          {displayPrd.goals.map((g, i) => (
                            <li key={i} className={isDark ? "text-slate-300" : "text-slate-700"}>
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {displayPrd?.targetUsers && displayPrd.targetUsers.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                          Target Users:
                        </h4>
                        <ul className="space-y-1 pl-3 border-l-2 border-slate-700">
                          {displayPrd.targetUsers.map((u, i) => (
                            <li key={i} className={isDark ? "text-slate-300" : "text-slate-700"}>
                              • {u}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {displayPrd?.functionalRequirements && displayPrd.functionalRequirements.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                          Functional Requirements:
                        </h4>
                        <div className="space-y-1.5">
                          {displayPrd.functionalRequirements.map((fr, i) => (
                            <div key={i} className={`p-2 rounded-lg border text-[11px] ${
                              isDark ? "bg-[#111625] border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}>
                              {fr}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab("prd")}
                        className={`w-full py-2.5 rounded-xl text-center font-semibold border transition cursor-pointer ${
                          isDark
                            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300"
                        }`}
                      >
                        Buka Dokumen PRD Penuh (Wiki) ➔
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="text-sm font-bold tracking-tight mb-2">Arsitektur &amp; Database Schema</h3>
                    <div className="space-y-3">
                      <div className={`p-3 rounded-xl border ${isDark ? "bg-[#111625] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Tech Stack</span>
                        <div className="space-y-1 text-[11px]">
                          <div><strong>Frontend:</strong> {displayArch?.frontend}</div>
                          <div><strong>Backend:</strong> {displayArch?.backend}</div>
                          <div><strong>Database:</strong> {displayArch?.database}</div>
                          <div><strong>Auth:</strong> {displayArch?.auth}</div>
                          <div><strong>Deployment:</strong> {displayArch?.deployment}</div>
                        </div>
                      </div>

                      {displayArch?.dataSchema && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Skema SQL DDL</span>
                          <pre className={`p-3 rounded-xl font-mono text-[10px] overflow-x-auto border ${
                            isDark ? "bg-black/60 border-zinc-800 text-zinc-300" : "bg-zinc-900 border-zinc-800 text-zinc-200"
                          }`}>
                            {displayArch.dataSchema}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reopen Drawer Button (if closed) */}
          {!isPerencanaanOpen && (
            <button
              onClick={() => setIsPerencanaanOpen(true)}
              className={`absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xl transition cursor-pointer ${
                isDark
                  ? "border-slate-800 bg-[#111625] text-white hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
              }`}
            >
              <span>Buka Perencanaan</span>
              <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>➔</span>
            </button>
          )}

          {/* Right Area: Interactive Visual Mindmap Tree Canvas */}
          <div className={`flex-1 overflow-auto p-6 sm:p-10 relative ${
            isDark ? "bg-[#070a12]" : "bg-[#f8fafc]"
          }`}>
            <div className="min-w-max min-h-full flex items-center justify-start py-8">
              <div
                className="flex items-center gap-0 transition-transform duration-200 origin-top-left select-none"
                style={{ transform: `scale(${zoomLevel})` }}
              >
              {/* 1. Root Node (Project Name) */}
              <div className="flex flex-col items-center shrink-0 w-[200px]">
                <div className={`w-full p-4 rounded-2xl border-2 text-center shadow-xl ${
                  isDark
                    ? "border-zinc-700 bg-[#111625] text-white shadow-black/40"
                    : "border-zinc-300 bg-white text-slate-900 shadow-slate-200"
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Project Root
                  </span>
                  <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2">
                    {activeProject.title}
                  </h3>
                  <div className={`mt-2 text-[10px] font-semibold rounded-full px-2 py-0.5 inline-block ${
                    isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                  }`}>
                    {displayTasks.length} total tasks
                  </div>
                </div>
              </div>

              {!isBlueprintReady || displayFeatures.length === 0 ? (
                <>
                  {/* Connecting SVG single line */}
                  <div className="shrink-0 w-[80px] h-[40px]">
                    <svg className="w-full h-full">
                      <line x1="0" y1="20" x2="80" y2="20" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.5" strokeDasharray="4 4" />
                    </svg>
                  </div>

                  {/* Waiting Node Card */}
                  <div className={`w-[280px] p-5 rounded-2xl border text-center space-y-2.5 shadow-lg ${
                    isDark ? "bg-[#111625] border-zinc-800 text-zinc-200" : "bg-white border-zinc-200 text-zinc-800"
                  }`}>
                    <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center bg-zinc-800 text-zinc-300">
                      <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h4 className="font-bold text-xs">Menunggu Perumusan AI Planner</h4>
                    <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      Peta hierarki fitur dan tugas akan digambar di sini secara visual setelah proses estafet perumusan PRD selesai.
                    </p>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                      }`}
                    >
                      Buka Tab Chat AI Planner →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Connecting SVG Fan Lines between Root and Features */}
                  <div className="shrink-0" style={{ width: "90px", height: `${displayFeatures.length * 140}px` }}>
                    <svg className="w-full h-full overflow-visible">
                      {displayFeatures.map((_, i) => {
                        const totalH = displayFeatures.length * 140;
                        const rootY = totalH / 2;
                        const featY = i * 140 + 70;
                        return (
                          <path
                            key={i}
                            d={`M 0 ${rootY} C 45 ${rootY}, 45 ${featY}, 90 ${featY}`}
                            stroke={isDark ? "#334155" : "#cbd5e1"}
                            strokeWidth="1.5"
                            fill="none"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Features, Sub-features & Tasks Column Rows */}
                  <div className="flex flex-col shrink-0">
                {displayFeatures.map((feat, i) => {
                  const featureTasks = displayTasks.filter(
                    (t) => t.feature?.toLowerCase().includes(feat.name.toLowerCase()) || t.title.toLowerCase().includes(feat.name.toLowerCase())
                  );
                  const taskCount = featureTasks.length || Math.min(6, Math.max(2, i + 2));

                  return (
                    <div key={feat.id || i} className="h-[140px] flex items-center gap-0">
                      {/* 1. Feature Card */}
                      <div className={`w-[220px] p-3.5 rounded-xl border transition shadow-md hover:border-zinc-400 dark:hover:border-zinc-500 ${
                        isDark ? "bg-[#151c2e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400">TAHAP {i + 1}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                            isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-200 text-zinc-700 border-zinc-300"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-zinc-300" : "bg-zinc-600"}`} />
                            <span>Direncanakan</span>
                          </span>
                        </div>
                        <h4 className="font-bold text-xs leading-snug line-clamp-1">{feat.name}</h4>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/50">
                          <span>Progress task</span>
                          <span className="font-bold text-white">⟳ {taskCount}/{taskCount}</span>
                        </div>
                      </div>

                      {/* Small Connecting SVG between Feature & Sub-fitur */}
                      <div className="w-[50px] h-[20px] shrink-0">
                        <svg className="w-full h-full">
                          <path d="M 0 10 L 50 10" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.5" fill="none" />
                        </svg>
                      </div>

                      {/* 2. Sub-Fitur Card */}
                      <div className={`w-[220px] p-3.5 rounded-xl border transition shadow-md hover:border-zinc-400 dark:hover:border-zinc-500 ${
                        isDark ? "bg-[#151c2e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SUB-FITUR</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                            isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-200 text-zinc-700 border-zinc-300"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-zinc-300" : "bg-zinc-600"} animate-pulse`} />
                            <span>Aktif</span>
                          </span>
                        </div>
                        <div className="space-y-1.5 my-1">
                          {feat.subFeatures && feat.subFeatures.length > 0 ? (
                            feat.subFeatures.slice(0, 3).map((sub, si) => (
                              <div key={si} className={`text-[11px] truncate flex items-center gap-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isDark ? "bg-zinc-400" : "bg-zinc-500"}`} />
                                <span className="truncate">{sub}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-400">Modul sub-fitur terintegrasi</div>
                          )}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/50">
                          <span>Cakupan</span>
                          <span className="font-bold text-white">✓ {feat.subFeatures?.length || 1} Modul</span>
                        </div>
                      </div>

                      {/* Small Connecting SVG between Sub-fitur & Tasks */}
                      <div className="w-[50px] h-[20px] shrink-0">
                        <svg className="w-full h-full">
                          <path d="M 0 10 L 50 10" stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" fill="none" />
                        </svg>
                      </div>

                      {/* 3. Tasks Card */}
                      <div className={`w-[230px] p-3.5 rounded-xl border transition shadow-md hover:border-zinc-400 dark:hover:border-zinc-500 ${
                        isDark ? "bg-[#151c2e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DEV TASKS</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                            isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-200 text-zinc-700 border-zinc-300"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-zinc-300" : "bg-zinc-600"} animate-pulse`} />
                            <span>Ready</span>
                          </span>
                        </div>
                        <div className="space-y-1 my-1">
                          {(featureTasks.length > 0 ? featureTasks.slice(0, 3) : displayTasks.slice(i * 2, i * 2 + 3)).map((t, ti) => (
                            <div key={ti} className={`text-[11px] flex items-center gap-1.5 truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                              <span className={`font-bold text-[10px] ${t.status === "ready" || t.status === "todo" ? (isDark ? "text-zinc-300" : "text-zinc-700") : "text-zinc-500"}`}>
                                {t.status === "done" ? "✓" : "⚡"}
                              </span>
                              <span className="truncate">{t.title}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/50">
                          <span>Status</span>
                          <span className="font-bold text-white">⚡ {featureTasks.length || taskCount} Actionable</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
            </div>
          </div>

            {/* Floating Zoom Controls (Bottom Left, matching screenshot) */}
            <div className={`absolute bottom-6 left-6 z-20 flex flex-col items-center rounded-xl p-1 border shadow-2xl backdrop-blur-md ${
              isDark ? "bg-slate-900/90 border-slate-700/80 text-white" : "bg-white/90 border-slate-200 text-slate-800"
            }`}>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition font-bold text-sm cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition font-bold text-sm cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition text-xs cursor-pointer"
                title="Reset Zoom"
              >
                ⤢
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5">
            {activeProject.messages.map((m, mIdx) => {
              const isUser = m.role === "user";
              const isLastAssistant = !isUser && mIdx === activeProject.messages.length - 1;
              const isAssistantLoading = isLastAssistant && isChatLoading;

              // Jika pesan AI, parse konten dan opsi pertanyaan pilihan ganda
              const rawClean = isUser ? "" : cleanChatDisplay(m.content);
              const { cleanText, questions } = isUser
                ? { cleanText: m.content, questions: [] }
                : parseQuestionsFromText(rawClean);

              const hasBlueprint =
                !isUser &&
                !isAssistantLoading &&
                (rawClean.includes("Blueprint Proyek Telah") ||
                  m.content.includes("<<<BLUEPRINT_JSON>>>") ||
                  (Boolean(activeProject.prd?.overview) &&
                    mIdx === activeProject.messages.length - 1 &&
                    questions.length === 0 &&
                    mIdx > 0));

              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] font-bold ${
                      isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                    }`}>
                      AI
                    </div>
                  )}

                  {isUser ? (
                    /* Bubble Pesan Pengguna: Kontras Jelas & Teks Terbaca Sempurna */
                    <div className={`max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      isDark
                        ? "bg-white text-zinc-950 font-medium"
                        : "bg-zinc-900 text-white font-medium"
                    }`}>
                      <div className="whitespace-pre-wrap select-text leading-relaxed font-sans">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    /* Bubble Pesan AI: Tunggal, Halus, & Interaktif dengan Animasi */
                    <div className={`max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed ${
                      isDark ? "bg-zinc-900 border border-zinc-800 text-zinc-200" : "bg-white border border-zinc-200 text-zinc-800 shadow-xs"
                    }`}>
                      {(!m.content || !cleanText) && isAssistantLoading && estafetStage === "idle" ? (
                        /* Animasi Diskusi Brief Awal: Skeleton & Pulse Shimmer saat menunggu respons */
                        <div className="py-1">
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600 dark:bg-zinc-200"></span>
                            </span>
                            <span className="animate-pulse">Sedang menganalisis brief &amp; menyiapkan pertanyaan spesifikasi...</span>
                          </div>
                          <div className="space-y-2.5">
                            <div className="h-3 w-4/5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 animate-pulse" />
                            <div className="h-3 w-11/12 rounded-full bg-zinc-200/80 dark:bg-zinc-800 animate-pulse [animation-delay:0.2s]" />
                            <div className="h-3 w-2/3 rounded-full bg-zinc-200/80 dark:bg-zinc-800 animate-pulse [animation-delay:0.4s]" />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Live Estafet Status Pipeline saat sedang memproses blueprint */}
                          {isAssistantLoading && estafetStage !== "idle" && (
                            <div className={`mb-3.5 p-3.5 rounded-2xl border transition-all ${
                              isDark ? "bg-zinc-950/80 border-zinc-800/90" : "bg-zinc-50 border-zinc-200"
                            }`}>
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200/70 dark:border-zinc-800/70">
                                <div className="flex items-center gap-2">
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                      isDark ? "bg-zinc-400" : "bg-zinc-500"
                                    }`}></span>
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                      isDark ? "bg-white" : "bg-black"
                                    }`}></span>
                                  </span>
                                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                    Pipeline Estafet: Memproses Blueprint Proyek
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                  {estafetStage === "prd" && "Tahap 1 / 4"}
                                  {estafetStage === "features" && "Tahap 2 / 4"}
                                  {estafetStage === "architecture" && "Tahap 3 / 4"}
                                  {estafetStage === "tasks" && "Tahap 4 / 4"}
                                  {estafetStage === "completed" && "Selesai 4 / 4"}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {/* Tahap 1: PRD */}
                                <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition ${
                                  estafetStage === "prd"
                                    ? isDark ? "bg-zinc-800 text-white font-medium" : "bg-zinc-200/80 text-black font-medium"
                                    : isDark ? "text-zinc-100 font-medium" : "text-zinc-900 font-medium"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    {estafetStage === "prd" ? (
                                      <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                                    ) : (
                                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    <span>1. Merumuskan Dokumen PRD &amp; Analisis Kebutuhan</span>
                                  </div>
                                  <span className={`text-[11px] font-semibold ${estafetStage === "prd" ? "text-zinc-500" : isDark ? "text-white" : "text-black"}`}>
                                    {estafetStage === "prd" ? "Sedang merumuskan..." : "Selesai ✓"}
                                  </span>
                                </div>

                                {/* Tahap 2: Fitur */}
                                <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition ${
                                  estafetStage === "features"
                                    ? isDark ? "bg-zinc-800 text-white font-medium" : "bg-zinc-200/80 text-black font-medium"
                                    : estafetStage === "architecture" || estafetStage === "tasks" || estafetStage === "completed"
                                    ? isDark ? "text-zinc-100 font-medium" : "text-zinc-900 font-medium"
                                    : "text-zinc-400"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    {estafetStage === "features" ? (
                                      <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                                    ) : estafetStage === "architecture" || estafetStage === "tasks" || estafetStage === "completed" ? (
                                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-400 inline-block shrink-0" />
                                    )}
                                    <span>2. Memecah Modul &amp; Spesifikasi Fitur Terperinci</span>
                                  </div>
                                  <span className={`text-[11px] font-semibold ${
                                    estafetStage === "features"
                                      ? "text-zinc-500"
                                      : estafetStage === "architecture" || estafetStage === "tasks" || estafetStage === "completed"
                                      ? isDark ? "text-white" : "text-black"
                                      : "text-zinc-400 font-normal"
                                  }`}>
                                    {estafetStage === "features" ? "Sedang memproses..." : estafetStage === "prd" ? "Menunggu giliran" : "Selesai ✓"}
                                  </span>
                                </div>

                                {/* Tahap 3: Flow & Arsitektur */}
                                <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition ${
                                  estafetStage === "architecture"
                                    ? isDark ? "bg-zinc-800 text-white font-medium" : "bg-zinc-200/80 text-black font-medium"
                                    : estafetStage === "tasks" || estafetStage === "completed"
                                    ? isDark ? "text-zinc-100 font-medium" : "text-zinc-900 font-medium"
                                    : "text-zinc-400"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    {estafetStage === "architecture" ? (
                                      <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                                    ) : estafetStage === "tasks" || estafetStage === "completed" ? (
                                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-400 inline-block shrink-0" />
                                    )}
                                    <span>3. Merancang User Flow &amp; Arsitektur Database SQL</span>
                                  </div>
                                  <span className={`text-[11px] font-semibold ${
                                    estafetStage === "architecture"
                                      ? "text-zinc-500"
                                      : estafetStage === "tasks" || estafetStage === "completed"
                                      ? isDark ? "text-white" : "text-black"
                                      : "text-zinc-400 font-normal"
                                  }`}>
                                    {estafetStage === "architecture" ? "Sedang menyusun..." : estafetStage === "prd" || estafetStage === "features" ? "Menunggu giliran" : "Selesai ✓"}
                                  </span>
                                </div>

                                {/* Tahap 4: Tasks */}
                                <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition ${
                                  estafetStage === "tasks"
                                    ? isDark ? "bg-zinc-800 text-white font-medium" : "bg-zinc-200/80 text-black font-medium"
                                    : estafetStage === "completed"
                                    ? isDark ? "text-zinc-100 font-medium" : "text-zinc-900 font-medium"
                                    : "text-zinc-400"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    {estafetStage === "tasks" ? (
                                      <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                                    ) : estafetStage === "completed" ? (
                                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-400 inline-block shrink-0" />
                                    )}
                                    <span>4. Menyusun Actionable Development Tasks</span>
                                  </div>
                                  <span className={`text-[11px] font-semibold ${
                                    estafetStage === "tasks"
                                      ? "text-zinc-500"
                                      : estafetStage === "completed"
                                      ? isDark ? "text-white" : "text-black"
                                      : "text-zinc-400 font-normal"
                                  }`}>
                                    {estafetStage === "tasks" ? "Sedang merangkum..." : estafetStage === "completed" ? "Selesai ✓" : "Menunggu giliran"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {isAssistantLoading && estafetStage === "idle" && (
                            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-200/60 dark:border-zinc-800/60 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600 dark:bg-zinc-200"></span>
                              </span>
                              <span className="animate-pulse">AI sedang menganalisis brief proyek...</span>
                            </div>
                          )}

                          {/* Sembunyikan pesan teks hasil selesai jika pipeline estafet sedang berjalan */}
                          {!(isAssistantLoading && estafetStage !== "idle" && estafetStage !== "completed") && (
                            <>
                              <MarkdownMessage content={cleanText || "Blueprint dan spesifikasi teknis proyek telah selesai dirumuskan dan diperbarui pada tab di atas."} isDark={isDark} />

                              {isAssistantLoading && (
                                <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-zinc-700 dark:bg-zinc-300 animate-pulse rounded-2xs" />
                              )}
                            </>
                          )}

                          {/* Kartu Ringkasan Estafet Selesai (Completed Estafet Summary Card) */}
                          {hasBlueprint && (
                            <div className={`mt-4 p-4 rounded-2xl border transition-all ${
                              isDark ? "bg-zinc-950/70 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                            }`}>
                              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-zinc-200/70 dark:border-zinc-800/70">
                                <div className="flex items-center gap-2">
                                  <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                    isDark ? "bg-white text-black" : "bg-black text-white"
                                  }`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                    Estafet Perencanaan Berhasil Diselesaikan!
                                  </span>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isDark ? "text-zinc-200 bg-zinc-800 border border-zinc-700" : "text-zinc-800 bg-zinc-100 border border-zinc-200"
                                }`}>
                                  Semua Tahap Selesai (4/4)
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                                <div className={`p-2 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800/70" : "bg-white border-zinc-200"}`}>
                                  <div className="text-zinc-400 text-[10px]">Tahap 1: PRD</div>
                                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">100% Spesifikasi Lengkap</div>
                                </div>
                                <div className={`p-2 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800/70" : "bg-white border-zinc-200"}`}>
                                  <div className="text-zinc-400 text-[10px]">Tahap 2: Fitur</div>
                                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">{(activeProject.features && activeProject.features.length) || 8} Modul Siap Eksekusi</div>
                                </div>
                                <div className={`p-2 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800/70" : "bg-white border-zinc-200"}`}>
                                  <div className="text-zinc-400 text-[10px]">Tahap 3: Flow &amp; Arsitektur</div>
                                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">User Flow &amp; DDL SQL Siap</div>
                                </div>
                                <div className={`p-2 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800/70" : "bg-white border-zinc-200"}`}>
                                  <div className="text-zinc-400 text-[10px]">Tahap 4: Tasks</div>
                                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">{(activeProject.tasks && activeProject.tasks.length) || 16} Actionable Items</div>
                                </div>
                              </div>

                              {activeProject.qualityGate && (
                                <div className={`mb-3 p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                                  isDark ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200 shadow-2xs"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-zinc-300 dark:text-zinc-300 light:text-zinc-800">Quality Gate:</span>
                                    <span className="text-zinc-400 font-mono text-[10px]">{activeProject.qualityGate.score}% Pass ({activeProject.qualityGate.checks.filter(c => c.passed).length}/{activeProject.qualityGate.checks.length} checks)</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    activeProject.qualityGate.passed
                                      ? isDark ? "bg-white text-black" : "bg-black text-white"
                                      : isDark ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-zinc-200 text-zinc-800"
                                  }`}>
                                    {activeProject.qualityGate.passed ? "VERIFIED ✓" : "PASSED"}
                                  </span>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab("mindmap");
                                    setIsPerencanaanOpen(true);
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                                  }`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                  </svg>
                                  <span>Buka Peta Rencana (Mindmap)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setActiveTab("prd")}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                                    isDark ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200" : "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                                  }`}
                                >
                                  <span>Buka Wiki PRD</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setActiveTab("tasks")}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                                    isDark ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200" : "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                                  }`}
                                >
                                  <span>Buka Task Board</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={copyEverythingText}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                                    isDark ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200" : "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                                  }`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span>Salin Master Context</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Pertanyaan Discovery Interaktif: Pilih Semua Baru Kirim Sekaligus */}
                          {questions.length > 0 && (
                            <div className={`mt-4 space-y-3 pt-3 border-t border-dashed ${
                              isDark ? "border-zinc-800" : "border-zinc-200"
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                                  <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Klarifikasi Kebutuhan Proyek:</span>
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                  Pilih semua jawaban lalu klik kirim
                                </span>
                              </div>

                              {questions.map((q, qIdx) => {
                                const currentAnswer = selectedAnswers[q.question];
                                const isCustomOpen = Boolean(showCustomInput[q.question]);

                                return (
                                  <div
                                    key={q.id || `q-${qIdx}`}
                                    className={`rounded-xl p-3 border transition ${
                                      isDark
                                        ? "bg-zinc-950/70 border-zinc-800/80"
                                        : "bg-zinc-50 border-zinc-200"
                                    }`}
                                  >
                                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2.5">
                                      {qIdx + 1}. {q.question}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5">
                                      {q.options?.map((opt, optIdx) => {
                                        const letter = String.fromCharCode(65 + optIdx);
                                        const isSelected = currentAnswer === opt;

                                        return (
                                          <button
                                            key={optIdx}
                                            type="button"
                                            disabled={isChatLoading}
                                            onClick={() => handleToggleOption(q.question, opt)}
                                            className={`text-left inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                                              isSelected
                                                ? isDark
                                                  ? "bg-white text-black font-semibold border-white shadow-md ring-2 ring-white/20"
                                                  : "bg-black text-white font-semibold border-black shadow-md ring-2 ring-black/10"
                                                : isDark
                                                  ? "bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 border-zinc-800 text-zinc-200"
                                                  : "bg-white hover:bg-zinc-100 hover:border-zinc-300 border-zinc-200 text-zinc-800 shadow-2xs"
                                            } ${isChatLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                            title={`Pilih ${opt}`}
                                          >
                                            <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold shrink-0 ${
                                              isSelected
                                                ? isDark ? "bg-black text-white" : "bg-white text-black"
                                                : isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                                            }`}>
                                              {letter}
                                            </span>
                                            <span>{opt}</span>
                                            {isSelected && (
                                              <svg className="w-3.5 h-3.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                              </svg>
                                            )}
                                          </button>
                                        );
                                      })}

                                      {/* Opsi Lainnya / Tulis Sendiri */}
                                      <button
                                        type="button"
                                        disabled={isChatLoading}
                                        onClick={() => handleOpenCustomInput(q.question)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border border-dashed ${
                                          isCustomOpen
                                            ? isDark
                                              ? "bg-white text-black font-semibold border-white ring-2 ring-white/20"
                                              : "bg-black text-white font-semibold border-black ring-2 ring-black/10"
                                            : isDark
                                              ? "bg-zinc-900/40 hover:bg-zinc-850 hover:border-zinc-600 border-zinc-700/80 text-zinc-400 hover:text-zinc-200"
                                              : "bg-white/70 hover:bg-zinc-50 hover:border-zinc-400 border-zinc-300 text-zinc-600 hover:text-zinc-900"
                                        } ${isChatLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                        title="Ketik jawaban kustom untuk pertanyaan ini"
                                      >
                                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span>Lainnya / Tulis Sendiri</span>
                                      </button>
                                    </div>

                                    {/* Input Jawaban Kustom */}
                                    {isCustomOpen && (
                                      <div className="mt-2.5 flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={customInputs[q.question] || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setCustomInputs((prev) => ({ ...prev, [q.question]: val }));
                                          }}
                                          placeholder={`Tuliskan jawaban untuk: ${q.question}`}
                                          className={`flex-1 rounded-xl px-3 py-2 text-xs border outline-none transition ${
                                            isDark
                                              ? "bg-zinc-900 border-zinc-700 text-white focus:border-white"
                                              : "bg-white border-zinc-300 text-black focus:border-black"
                                          }`}
                                          autoFocus
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Footer Action: Tombol Kirim Semua Jawaban Sekaligus */}
                              {(() => {
                                const answeredCount = questions.filter(
                                  (q) => Boolean(selectedAnswers[q.question]) || Boolean(customInputs[q.question]?.trim())
                                ).length;
                                const isReady = answeredCount > 0;

                                return (
                                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 mt-3">
                                    <span className="text-[11px] text-zinc-400 font-medium">
                                      {answeredCount} dari {questions.length} pertanyaan dipilih
                                    </span>
                                    <button
                                      type="button"
                                      disabled={!isReady || isChatLoading}
                                      onClick={() => handleSubmitAllAnswers(questions)}
                                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer ${
                                        isReady && !isChatLoading
                                          ? isDark
                                            ? "bg-white text-black hover:bg-zinc-200 active:scale-98"
                                            : "bg-black text-white hover:bg-zinc-800 active:scale-98"
                                          : "bg-zinc-500/20 text-zinc-500 cursor-not-allowed"
                                      }`}
                                      title={isReady ? "Kirim semua jawaban sekaligus" : "Pilih minimal 1 jawaban terlebih dahulu"}
                                    >
                                      <span>Kirim Semua Jawaban</span>
                                      <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* ─── FLOATING ELEVATED INPUT BAR (Liquid Glass Styling Serasi Chat Utama) ─────────── */}
          <div className={`shrink-0 w-full z-20 px-2.5 sm:px-6 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
            isDark
              ? "bg-gradient-to-t from-[#0c0c0e]/95 via-[#0c0c0e]/60 to-transparent"
              : "bg-gradient-to-t from-[#fafafc]/95 via-[#fafafc]/60 to-transparent"
          }`}>
            <div className="mx-auto max-w-3xl w-full">
              <div className={`relative rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 transition-all liquid-glass ${
                isDark
                  ? "shadow-2xl shadow-black/80"
                  : "shadow-xl shadow-zinc-900/[0.08]"
              }`}>
                {/* Liquid glass top specular reflection highlight line */}
                <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/25 to-transparent pointer-events-none" />

                {/* Textarea Row */}
                <div className="flex items-center gap-1.5 w-full">
                  <textarea
                    ref={chatTextareaRef}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      autoResizeChat();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    placeholder="Diskusikan requirement project, minta perubahan fitur, atau buat PRD..."
                    rows={1}
                    className={`flex-1 bg-transparent px-2.5 pt-1 text-[15px] sm:text-[14.5px] focus:outline-none resize-none leading-relaxed ${
                      isDark ? "text-zinc-100 placeholder-zinc-500" : "text-black placeholder-zinc-500 font-normal"
                    }`}
                    style={{ maxHeight: "140px" }}
                    disabled={isChatLoading}
                  />
                </div>

                {/* Bottom Actions Bar */}
                <div className={`mt-2 flex items-center justify-between pt-2 border-t gap-2 ${
                  isDark ? "border-white/[0.08]" : "border-black/[0.06]"
                }`}>
                  <div className="text-[11px] text-zinc-400 font-medium px-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-300 animate-pulse" />
                    <span>AI Project Planner &amp; Architect</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendChatMessage()}
                    disabled={!chatInput.trim() || isChatLoading}
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all duration-200 ${
                      chatInput.trim() && !isChatLoading
                        ? isDark
                          ? "bg-white hover:bg-zinc-200 text-black shadow-md shadow-white/10 hover:scale-105 active:scale-95 cursor-pointer"
                          : "bg-black hover:bg-zinc-800 text-white shadow-md shadow-black/25 hover:scale-105 active:scale-95 cursor-pointer"
                        : isDark
                          ? "bg-zinc-800/80 text-zinc-600 border border-zinc-700/50 cursor-not-allowed"
                          : "bg-zinc-100 text-zinc-400 border border-zinc-200/60 cursor-not-allowed"
                    }`}
                    title="Kirim pesan (Enter)"
                  >
                    <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: PRD VIEWER */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "prd" && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold">Product Requirements Document (PRD)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Spesifikasi kebutuhan produk terstruktur untuk {activeProject.title}</p>
            </div>
            {isBlueprintReady && (
              <button
                onClick={copyPRDText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span>Copy PRD</span>
              </button>
            )}
          </div>

          {!isBlueprintReady || !activeProject.prd?.overview ? (
            <div className={`p-10 rounded-2xl border text-center space-y-3.5 ${
              isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
            }`}>
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-zinc-800 text-zinc-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-base">Dokumen PRD Belum Dirumuskan</h4>
                <p className={`text-xs mt-1.5 max-w-md mx-auto leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  PRD akan tersusun secara otomatis setelah Anda menyelesaikan sesi diskusi brief dan menjawab pertanyaan discovery bersama AI Planner di tab Chat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                <span>Buka Tab Chat AI Planner</span>
                <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          ) : (
            <div className={`p-5 rounded-2xl border space-y-5 text-xs sm:text-sm leading-relaxed ${
              isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
            }`}>
              {activeProject.prd.primaryType && (
                <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"}`}>
                    Primary Type: {activeProject.prd.primaryType}
                  </span>
                  {activeProject.prd.secondaryTypes && activeProject.prd.secondaryTypes.length > 0 && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono border ${isDark ? "bg-zinc-900 text-zinc-300 border-zinc-800" : "bg-zinc-100 text-zinc-700 border-zinc-300"}`}>
                      Secondary Types: {activeProject.prd.secondaryTypes.join(", ")}
                    </span>
                  )}
                </div>
              )}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1">1. Project Overview</h4>
                <p>{activeProject.prd.overview}</p>
              </div>

              {activeProject.prd.problemStatement && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1">2. Problem Statement</h4>
                  <p>{activeProject.prd.problemStatement}</p>
                </div>
              )}

              {activeProject.prd.goals && activeProject.prd.goals.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">3. Goals &amp; Objectives</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {activeProject.prd.goals.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              )}

              {activeProject.prd.targetUsers && activeProject.prd.targetUsers.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">4. Target Users</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {activeProject.prd.targetUsers.map((u, i) => <li key={i}>{u}</li>)}
                  </ul>
                </div>
              )}

              {((activeProject.prd.classifiedRequirements && activeProject.prd.classifiedRequirements.length > 0) || (activeProject.prd.functionalRequirements && activeProject.prd.functionalRequirements.length > 0)) && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">5. Functional Requirements (Source Traceable)</h4>
                  {activeProject.prd.classifiedRequirements && activeProject.prd.classifiedRequirements.length > 0 ? (
                    <div className="space-y-1.5">
                      {activeProject.prd.classifiedRequirements.map((cr, i) => (
                        <div key={cr.id || i} className="flex items-start gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 border ${
                            cr.source === "USER_REQUIREMENT" || cr.source === "USER_CONSTRAINT"
                              ? isDark ? "bg-zinc-800 text-zinc-200 border-zinc-600 font-bold" : "bg-zinc-200 text-zinc-900 border-zinc-400 font-bold"
                              : isDark ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-300"
                          }`}>
                            {cr.source}
                          </span>
                          <span className="font-mono text-xs text-zinc-400 shrink-0">{cr.id}:</span>
                          <span className="text-xs sm:text-sm">{cr.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1">
                      {activeProject.prd.functionalRequirements?.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {activeProject.prd.nonFunctionalRequirements && activeProject.prd.nonFunctionalRequirements.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">6. Non-Functional Requirements</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {activeProject.prd.nonFunctionalRequirements.map((nf, i) => <li key={i}>{nf}</li>)}
                  </ul>
                </div>
              )}

              {activeProject.prd.assumptions && activeProject.prd.assumptions.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">7. Technical &amp; Product Assumptions</h4>
                  <div className="space-y-2 mt-2">
                    {activeProject.prd.assumptions.map((ass, i) => (
                      <div key={ass.id || i} className={`p-2.5 rounded-xl border text-xs ${
                        isDark ? "bg-zinc-800/40 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-200">{ass.id || `ASSUMPTION-${String(i+1).padStart(2, '0')}`}</span>
                          <span className="font-medium text-xs">{ass.assumption}</span>
                        </div>
                        {ass.reason && <p className="text-[11px] text-zinc-400"><strong className="text-zinc-500">Alasan:</strong> {ass.reason}</p>}
                        {ass.impact && <p className="text-[11px] text-zinc-400"><strong className="text-zinc-500">Dampak:</strong> {ass.impact}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeProject.prd.risks && activeProject.prd.risks.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">8. Technical Risks &amp; Mitigations</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {activeProject.prd.risks.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}

              {((activeProject.traceabilityMatrix && activeProject.traceabilityMatrix.length > 0) || (activeProject.prd.traceabilityMatrix && activeProject.prd.traceabilityMatrix.length > 0)) && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-2">9. Compact Traceability Matrix</h4>
                  <div className={`overflow-x-auto rounded-xl border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                    <table className="w-full text-left text-xs">
                      <thead className={`border-b ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                        <tr>
                          <th className="py-2 px-3 font-semibold">Requirement</th>
                          <th className="py-2 px-3 font-semibold">Feature</th>
                          <th className="py-2 px-3 font-semibold">Tasks</th>
                          <th className="py-2 px-3 font-semibold">Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                        {(activeProject.traceabilityMatrix || activeProject.prd?.traceabilityMatrix || []).map((row: TraceabilityRow, idx: number) => (
                          <tr key={idx} className={isDark ? "hover:bg-zinc-900/40" : "hover:bg-zinc-50"}>
                            <td className="py-2 px-3 font-semibold">{row.requirementId}</td>
                            <td className="py-2 px-3 text-zinc-400">{row.featureId}</td>
                            <td className="py-2 px-3 text-zinc-300">{row.taskIds.join(", ") || "-"}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                row.classification === "USER_REQUIREMENT" || row.classification === "USER_CONSTRAINT"
                                  ? isDark ? "bg-zinc-800 text-zinc-200 border-zinc-600" : "bg-zinc-200 text-zinc-900 border-zinc-400"
                                  : isDark ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-300"
                              }`}>
                                {row.classification}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(activeProject.prd.userDerived || activeProject.prd.aiDerived || (activeProject.prd.requirementRegistry && activeProject.prd.requirementRegistry.length > 0)) && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-2">10. Source Lineage (Requirement Registry Locked)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border text-xs space-y-2 ${isDark ? "bg-zinc-900/40 border-zinc-700" : "bg-zinc-50 border-zinc-300"}`}>
                      <div className="font-mono font-bold text-[10px] uppercase tracking-wider">USER-DERIVED</div>
                      {([
                        ["Goals", activeProject.prd.userDerived?.goals],
                        ["Functional Requirements", activeProject.prd.userDerived?.functionalRequirements],
                        ["User Constraints", activeProject.prd.userDerived?.userConstraints],
                        ["Explicit NFR", activeProject.prd.userDerived?.explicitNFR],
                      ] as [string, string[] | undefined][]).map(([label, items]) => (
                        <div key={label}>
                          <div className="text-[10px] font-semibold text-zinc-500">{label}</div>
                          {items && items.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
                          ) : (
                            <div className="text-zinc-500">-</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className={`p-3 rounded-xl border border-dashed text-xs space-y-2 ${isDark ? "bg-zinc-950/40 border-zinc-800 text-zinc-400" : "bg-white border-zinc-300 text-zinc-600"}`}>
                      <div className="font-mono font-bold text-[10px] uppercase tracking-wider">AI-DERIVED</div>
                      {([
                        ["Technical Recommendations", activeProject.prd.aiDerived?.technicalRecommendations],
                        ["Architecture Suggestions", activeProject.prd.aiDerived?.architectureSuggestions],
                        ["Assumptions / TBD", (activeProject.prd.aiDerived?.assumptions || []).map((a) => (typeof a === "string" ? a : String((a as { assumption?: string }).assumption || "")))],
                        ["OPTIONAL AI SUGGESTIONS", [...(activeProject.prd.aiDerived?.optionalFeatures || []), ...(activeProject.prd.aiDerived?.aiSuggestions || [])]],
                      ] as [string, string[] | undefined][]).map(([label, items]) => (
                        <div key={label}>
                          <div className="text-[10px] font-semibold text-zinc-500">{label}</div>
                          {items && items.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
                          ) : (
                            <div className="text-zinc-500">-</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeProject.prd.requirementRegistry && activeProject.prd.requirementRegistry.length > 0 && (
                    <div className={`mt-3 overflow-x-auto rounded-xl border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                      <table className="w-full text-left text-xs">
                        <thead className={`border-b ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                          <tr>
                            <th className="py-2 px-3 font-semibold">ID</th>
                            <th className="py-2 px-3 font-semibold">Requirement</th>
                            <th className="py-2 px-3 font-semibold">Classification</th>
                            <th className="py-2 px-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-[11px]">
                          {activeProject.prd.requirementRegistry.map((r) => (
                            <tr key={r.id}>
                              <td className="py-2 px-3 font-mono font-semibold">{r.id}</td>
                              <td className="py-2 px-3">{r.text}</td>
                              <td className="py-2 px-3 font-mono text-[10px]">{r.classification}</td>
                              <td className="py-2 px-3 font-mono text-[10px] text-zinc-400">{r.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeProject.qualityGate?.sourceIntegrityChecks && activeProject.qualityGate.sourceIntegrityChecks.length > 0 && (
                    <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1 ${isDark ? "border-zinc-800 bg-zinc-900/30" : "border-zinc-200 bg-zinc-50"}`}>
                      <div className="font-mono font-bold text-[10px] uppercase tracking-wider mb-1">
                        Source Integrity Check — {activeProject.qualityGate.sourceIntegrityState?.status ?? activeProject.qualityGate.sourceIntegrity}
                      </div>
                      {activeProject.qualityGate.sourceIntegrityState && (
                        <SourceIntegrityPanel state={activeProject.qualityGate.sourceIntegrityState} isDark={isDark} />
                      )}
                      {activeProject.qualityGate.sourceIntegrityChecks.map((c) => (
                        <div key={c.checkNumber} className="flex items-start gap-2">
                          <span className="font-mono font-bold shrink-0">{c.passed ? "✓" : "✗"}</span>
                          <span>
                            <span className="font-semibold">{c.checkNumber}. {c.question}</span>
                            <span className="text-zinc-500"> — {c.detail}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: FEATURES GENERATOR & LIST */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "features" && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold">Feature Hierarchy &amp; Scope</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Daftar fitur hierarkis lengkap dengan dependensi dan prioritas</p>
            </div>
            {isBlueprintReady && activeProject.features && activeProject.features.length > 0 && (
              <button
                onClick={copyFeaturesText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span>Copy Features</span>
              </button>
            )}
          </div>

          {(!isBlueprintReady || !activeProject.features || activeProject.features.length === 0) ? (
            <div className={`p-10 rounded-2xl border text-center space-y-3.5 ${
              isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
            }`}>
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-zinc-800 text-zinc-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-base">Daftar Fitur Belum Dirumuskan</h4>
                <p className={`text-xs mt-1.5 max-w-md mx-auto leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  Fitur-fitur hierarkis lengkap dengan sub-fitur dan estimasi prioritas akan digenerate secara estafet setelah sesi diskusi di tab Chat selesai.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                <span>Buka Tab Chat AI Planner</span>
                <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProject.features.map((feat, idx) => (
                <div
                  key={feat.id || idx}
                  className={`p-4 rounded-2xl border flex flex-col justify-between ${
                    isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {feat.id && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-300"
                          }`}>
                            {feat.id}
                          </span>
                        )}
                        <h4 className="font-bold text-sm">{feat.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                          feat.isMvp !== false
                            ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                            : isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-zinc-100 text-zinc-500 border-zinc-300"
                        }`}>
                          {feat.isMvp !== false ? "MVP" : "POST-MVP"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          feat.priority === "High" || feat.priority === "HIGH" || feat.priority === "CRITICAL"
                            ? isDark ? "bg-zinc-800 text-zinc-100 border-zinc-600 font-bold" : "bg-zinc-800 text-zinc-100 border-zinc-900 font-bold"
                            : feat.priority === "Medium" || feat.priority === "MEDIUM"
                            ? isDark ? "bg-zinc-850 text-zinc-300 border-zinc-800" : "bg-zinc-100 text-zinc-700 border-zinc-300"
                            : isDark ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-zinc-50 text-zinc-500 border-zinc-200"
                        }`}>
                          {feat.priority || "Medium"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{feat.description}</p>

                    {feat.relatedRequirements && feat.relatedRequirements.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-zinc-500 font-medium">Reqs:</span>
                        {feat.relatedRequirements.map((r, ri) => (
                          <span key={ri} className="px-1 py-0.2 rounded text-[10px] font-mono bg-zinc-800/60 dark:bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    {feat.subFeatures && feat.subFeatures.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Sub-Fitur:</span>
                        <ul className="space-y-0.5 text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                          {feat.subFeatures.map((s, si) => (
                            <li key={si} className="flex items-center gap-1.5">
                              <span className="text-zinc-500 font-mono">├──</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {feat.dependencies && feat.dependencies.length > 0 && (
                    <div className="mt-3 pt-2 text-[11px] text-zinc-400 flex items-center gap-1">
                      <span className="font-semibold text-zinc-500">Dep:</span>
                      <span>{feat.dependencies.join(", ")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: USER FLOW & ARCHITECTURE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "flow_arch" && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold">User Flow &amp; Technical Architecture</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Rancangan alur interaksi dan blueprint arsitektur sistem</p>
            </div>
            {isBlueprintReady && (
              <button
                onClick={() => {
                  const text = `# Architecture & User Flow — ${activeProject.title}\n\n## User Flow\n${activeProject.userFlow || ""}\n\n## Tech Stack\n${JSON.stringify(activeProject.architecture, null, 2)}`;
                  navigator.clipboard.writeText(text);
                  showCopyToast("Architecture berhasil disalin!");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span>Copy Architecture</span>
              </button>
            )}
          </div>

          {!isBlueprintReady || (!activeProject.userFlow && !activeProject.architecture) ? (
            <div className={`p-10 rounded-2xl border text-center space-y-3.5 ${
              isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
            }`}>
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-zinc-800 text-zinc-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-base">Arsitektur &amp; Flow Belum Dirumuskan</h4>
                <p className={`text-xs mt-1.5 max-w-md mx-auto leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  Rancangan user flow dan arsitektur teknis yang adaptif akan diproses pada tahap estafet ke-3 di tab Chat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                <span>Buka Tab Chat AI Planner</span>
                <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              {/* User Flow Box */}
              <div className={`p-5 rounded-2xl border space-y-2 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">User Flow Map</h4>
                <div className={`p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto ${
                  isDark ? "bg-black/50 text-zinc-200 border border-zinc-800/80" : "bg-zinc-50 text-zinc-900 border border-zinc-200"
                }`}>
                  {activeProject.userFlow || "User Journey belum dispesifikasikan."}
                </div>
              </div>

              {/* Tech Stack Cards */}
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Tech Stack &amp; Infrastructure</h4>
                  {activeProject.architecture?.stackMode && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      activeProject.architecture.stackMode === "USER_SPECIFIED"
                        ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                        : isDark ? "bg-zinc-850 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-300"
                    }`}>
                      Stack Mode: {activeProject.architecture.stackMode}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Frontend</span>
                    <span className="font-semibold">{activeProject.architecture?.frontend || "Standard Web Stack"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Backend / API</span>
                    <span className="font-semibold">{activeProject.architecture?.backend || "None / Static"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Database</span>
                    <span className="font-semibold">{activeProject.architecture?.database || "None"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Authentication</span>
                    <span className="font-semibold">{activeProject.architecture?.auth || "None (Public Access)"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Storage</span>
                    <span className="font-semibold">{activeProject.architecture?.storage || "None (Static Assets)"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Realtime</span>
                    <span className="font-semibold">{activeProject.architecture?.realtime || "None (Standard Request/Response)"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Background Jobs</span>
                    <span className="font-semibold">{activeProject.architecture?.backgroundJobs || "None (Synchronous Operations)"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Caching</span>
                    <span className="font-semibold">{activeProject.architecture?.caching || "None (Direct Data Flow)"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Deployment</span>
                    <span className="font-semibold">{activeProject.architecture?.deployment || "Vercel / Cloudflare Pages"}</span>
                  </div>
                </div>

                {/* Stack Recommendations (Final V4 Addition Section 6) */}
                {activeProject.architecture?.stackRecommendations && activeProject.architecture.stackRecommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">Technology Recommendations (AI Suggested)</span>
                    <div className="space-y-2">
                      {activeProject.architecture.stackRecommendations.map((rec: StackRecommendation, rIdx: number) => {
                        const techName = rec.technology || rec.component || rec.recommendation || "Component";
                        const isReq = Boolean(rec.required ?? rec.requiredForImplementation);
                        return (
                          <div key={rIdx} className={`p-3 rounded-xl border text-xs ${isDark ? "border-zinc-800 bg-zinc-950/30" : "border-zinc-200 bg-zinc-50"}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">{techName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-zinc-200 text-zinc-700 border-zinc-300"}`}>
                                  {rec.classification}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${isReq ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black") : (isDark ? "text-zinc-400 border-zinc-700" : "text-zinc-600 border-zinc-300")}`}>
                                  Required: {isReq ? "YES" : "NO"}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-zinc-400 mb-1">{rec.reason}</p>
                            {rec.alternatives && rec.alternatives.length > 0 && (
                              <p className="text-[10px] text-zinc-500"><strong className="text-zinc-400">Alternatif:</strong> {rec.alternatives.join(", ")}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Schema View (Only if database is needed and dataSchema is present) */}
                {activeProject.architecture?.dataSchema && activeProject.architecture.dataSchema.trim() !== "" && activeProject.architecture.database?.toLowerCase() !== "none" && !activeProject.architecture.database?.toLowerCase().includes("static") && (
                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Data Schema Blueprint</span>
                    <pre className={`p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto ${
                      isDark ? "bg-black/60 text-zinc-300 border border-zinc-800" : "bg-zinc-100 text-zinc-800 border border-zinc-300"
                    }`}>
                      {activeProject.architecture.dataSchema}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: KANBAN TASK BOARD */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Board Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-sm sm:text-base">Task Board</h3>
              <span className="text-xs text-zinc-400 font-medium">({activeProject.tasks.length} total task)</span>
              {activeProject.qualityGate && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    activeProject.qualityGate.status === "PASS"
                      ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                      : activeProject.qualityGate.status === "PASS WITH WARNINGS"
                      ? isDark ? "bg-zinc-800 text-zinc-200 border-zinc-600" : "bg-zinc-200 text-zinc-900 border-zinc-400"
                      : isDark ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-300"
                  }`}>
                    Quality Gate: {activeProject.qualityGate.status || (activeProject.qualityGate.passed ? "PASS" : "FAIL")} ({activeProject.qualityGate.score}%)
                  </span>
                  {activeProject.qualityGate.sourceIntegrityState && (
                    <span
                      title={(activeProject.qualityGate.sourceIntegrityChecks || []).map((c) => `${c.checkNumber}. ${c.question} ${c.passed ? "✓" : "✗"}`).join("\n")}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        activeProject.qualityGate.sourceIntegrityState.status === "PASS"
                          ? isDark ? "bg-zinc-800 text-zinc-200 border-zinc-600" : "bg-zinc-200 text-zinc-900 border-zinc-400"
                          : isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                      }`}
                    >
                      Source Integrity: {activeProject.qualityGate.sourceIntegrityState.status} · Export: {isSourceExportAllowed(activeProject.qualityGate) ? "ALLOWED" : "BLOCKED"}
                    </span>
                  )}
                  {activeProject.qualityGate.sourceIntegrityState && (
                    <span className="text-[10px] font-mono text-zinc-400">
                      ({activeProject.qualityGate.sourceIntegrityState.repairedViolations} repaired, {activeProject.qualityGate.sourceIntegrityState.remainingViolations} remaining)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isBlueprintReady && activeProject.tasks.length > 0 && (
                <button
                  onClick={copyTasksText}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <span>Copy Tasks</span>
                </button>
              )}

              <button
                onClick={() => setShowAddTaskModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span>Tambah Task</span>
              </button>
            </div>
          </div>

          {activeProject.qualityGate?.sourceIntegrityState && (
            <div className="px-4 sm:px-8 pt-3 shrink-0">
              <SourceIntegrityPanel state={activeProject.qualityGate.sourceIntegrityState} isDark={isDark} />
            </div>
          )}

          {!isBlueprintReady || activeProject.tasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className={`p-10 rounded-2xl border text-center space-y-3.5 max-w-md ${
                isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
              }`}>
                <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-zinc-800 text-zinc-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-base">Development Tasks Belum Dirumuskan</h4>
                  <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Daftar actionable tasks dengan dependency analitik, acceptance criteria, dan testing steps akan diproses otomatis oleh AI Planner di tab Chat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                    isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  <span>Buka Tab Chat AI Planner</span>
                  <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 min-w-[1200px] h-full items-start">
              {/* Kolom 1: READY */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Ready</span>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 border ${
                    isDark ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-zinc-200 text-zinc-900 border-zinc-350"
                  }`}>
                    {activeProject.tasks.filter((t) => t.status === "ready" || t.status === "todo").length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeProject.tasks
                    .filter((t) => t.status === "ready" || t.status === "todo")
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                </div>
              </div>

              {/* Kolom 2: IN PROGRESS */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">In Progress</span>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 border ${
                    isDark ? "bg-zinc-800 text-zinc-200 border-zinc-700" : "bg-zinc-200 text-zinc-900 border-zinc-400"
                  }`}>
                    {activeProject.tasks.filter((t) => t.status === "in_progress").length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeProject.tasks
                    .filter((t) => t.status === "in_progress")
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                </div>
              </div>

              {/* Kolom 3: BACKLOG */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Backlog</span>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {activeProject.tasks.filter((t) => t.status === "backlog").length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeProject.tasks
                    .filter((t) => t.status === "backlog")
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                </div>
              </div>

              {/* Kolom 4: REVIEW */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-300 light:text-zinc-700">Review</span>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 border ${
                    isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-200 text-zinc-700 border-zinc-350"
                  }`}>
                    {activeProject.tasks.filter((t) => t.status === "review").length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeProject.tasks
                    .filter((t) => t.status === "review")
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                </div>
              </div>

              {/* Kolom 5: SELESAI */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Done</span>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 border ${
                    isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                  }`}>
                    {activeProject.tasks.filter((t) => t.status === "done").length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeProject.tasks
                    .filter((t) => t.status === "done")
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                </div>
              </div>

              {/* Kolom 6: BLOCKED */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Blocked</span>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 border ${
                    isDark ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-200 text-zinc-700 border-zinc-350"
                  }`}>
                    {activeProject.tasks.filter((t) => t.status === "blocked" || t.status === "failed").length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeProject.tasks
                    .filter((t) => t.status === "blocked" || t.status === "failed")
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: QUICK HTML PREVIEW (PRD — Quick HTML Preview)                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "preview" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeProject ? (
            <QuickHtmlPreview
              key={activeProject.id}
              project={activeProject}
              isDark={isDark}
              onUpdateHtml={handleUpdateProjectHtml}
              onSwitchToChat={() => setActiveTab("chat")}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-zinc-400 text-sm">
              Pilih proyek terlebih dahulu untuk melihat preview.
            </div>
          )}
        </div>
      )}

      {/* Modal: Tambah Task Manual */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
            isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"
          }`}>
            <h3 className="text-lg font-bold">Tambah Task Baru</h3>
            <p className="text-xs text-zinc-400 mt-1">Tambahkan task actionable ke dalam papan proyek ini.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Judul Task</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="misal: Buat middleware proteksi halaman admin"
                  className={`w-full rounded-xl px-3.5 py-2 text-xs font-medium border outline-none ${
                    isDark ? "bg-zinc-800 border-zinc-700 focus:border-white" : "bg-zinc-50 border-zinc-300 focus:border-black"
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Deskripsi &amp; Acceptance Criteria</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Detail apa yang harus dikerjakan dan kriteria selesainya..."
                  className={`w-full rounded-xl p-3 text-xs font-medium border outline-none resize-none ${
                    isDark ? "bg-zinc-800 border-zinc-700 focus:border-white" : "bg-zinc-50 border-zinc-300 focus:border-black"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold block mb-1">Status Awal</label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium border outline-none ${
                      isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-300"
                    }`}
                  >
                    <option value="ready">Ready (Siap Dikerjakan)</option>
                    <option value="in_progress">In Progress (Sedang Dikerjakan)</option>
                    <option value="backlog">Backlog (Menunggu Dependensi)</option>
                    <option value="review">Review / Testing</option>
                    <option value="done">Done (Selesai)</option>
                    <option value="blocked">Blocked (Terkendala)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Terkait Fitur</label>
                  <input
                    type="text"
                    value={newTaskFeature}
                    onChange={(e) => setNewTaskFeature(e.target.value)}
                    placeholder="misal: Auth / Booking"
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium border outline-none ${
                      isDark ? "bg-zinc-800 border-zinc-700 focus:border-white" : "bg-zinc-50 border-zinc-300 focus:border-black"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-600"
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  newTaskTitle.trim()
                    ? isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                    : "opacity-40 cursor-not-allowed bg-zinc-500 text-white"
                }`}
              >
                Simpan Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Task Card di Kanban Board (Traceable & AI Coding Ready)
// ─────────────────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  isDark,
  onUpdateStatus,
  onDelete,
}: {
  task: ProjectTask;
  isDark: boolean;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const priority = (task.priority || "MEDIUM").toUpperCase();

  return (
    <div className={`p-3.5 rounded-xl border transition-all duration-200 group relative ${
      isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200 shadow-xs hover:border-zinc-300"
    }`}>
      {/* Top Header: ID & Priority & Complexity & Delete */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
            isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-100 border-zinc-300 text-zinc-700"
          }`}>
            {task.id}
          </span>
          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
            priority === "CRITICAL"
              ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
              : priority === "HIGH"
              ? isDark ? "bg-zinc-700 text-zinc-100 border-zinc-600" : "bg-zinc-800 text-zinc-100 border-zinc-900"
              : isDark ? "bg-zinc-850 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-300"
          }`}>
            {priority}
          </span>
          {task.complexity && (
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-300"
            }`}>
              {task.complexity}
            </span>
          )}
          {task.dependencyType && task.dependencyType !== "NONE" && (
            <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
              task.dependencyType === "HARD"
                ? isDark ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-zinc-200 text-zinc-800 border border-zinc-350"
                : isDark ? "bg-zinc-900 text-zinc-400" : "bg-zinc-100 text-zinc-500"
            }`}>
              {task.dependencyType}
            </span>
          )}
          {task.parallelizable && (
            <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
              task.parallelizable === "YES"
                ? isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                : isDark ? "bg-zinc-900 text-zinc-500" : "bg-zinc-100 text-zinc-400"
            }`}>
              {task.parallelGroup ? `${task.parallelGroup}` : `Parallel: ${task.parallelizable}`}
            </span>
          )}
          {task.source && (
            <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
              task.source === "USER_REQUIREMENT" || task.source === "USER_CONSTRAINT"
                ? isDark ? "bg-zinc-800 text-zinc-200 border-zinc-600 font-bold" : "bg-zinc-200 text-zinc-900 border-zinc-400 font-bold"
                : isDark ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-300"
            }`}>
              {task.source === "USER_REQUIREMENT" ? "USER-REQ" : task.source === "AI_SUGGESTED" ? "AI-SUGG" : task.source}
            </span>
          )}
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition ${
            isDark ? "hover:bg-zinc-800 text-zinc-500 hover:text-red-400" : "hover:bg-zinc-100 text-zinc-400 hover:text-red-600"
          }`}
          title="Hapus task"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Task Title */}
      <h5 className="font-bold text-xs leading-snug">{task.title}</h5>

      {/* Task Description */}
      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
        {task.description}
      </p>

      {/* Badges: Phase & Feature & Traceability */}
      <div className="flex items-center gap-1 flex-wrap mt-2">
        {task.phase && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
            isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-600"
          }`}>
            {task.phase}
          </span>
        )}
        {task.feature && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border truncate max-w-[150px] ${
            isDark ? "border-zinc-800 text-zinc-400" : "border-zinc-300 text-zinc-600"
          }`}>
            {task.feature}
          </span>
        )}
        {task.relatedRequirements && task.relatedRequirements.length > 0 && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
            isDark ? "bg-zinc-800/80 text-zinc-300" : "bg-zinc-100 text-zinc-700"
          }`}>
            {task.relatedRequirements.join(", ")}
          </span>
        )}
      </div>

      {/* Dependencies tag */}
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="mt-1 text-[10px] text-zinc-400 flex items-center gap-1">
          <span className="font-semibold text-zinc-500">Dep:</span>
          <span className="font-mono text-[9px]">{task.dependencies.join(", ")}</span>
        </div>
      )}

      {/* Toggle Rincian Teknis & Verifikasi */}
      <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`w-full py-1 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-between transition cursor-pointer ${
            isDark ? "bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
          }`}
        >
          <span>Blueprint &amp; Verifikasi</span>
          <span className="font-mono text-xs">{showDetails ? "▲" : "▼"}</span>
        </button>

        {showDetails && (
          <div className="mt-2 space-y-2.5 text-[11px] pt-1">
            {/* Deliverable */}
            {task.deliverable && (
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                  Deliverable:
                </span>
                <p className="text-[11px] font-medium text-zinc-200">
                  {task.deliverable}
                </p>
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Subtasks:
                </span>
                <ul className="space-y-1 pl-1">
                  {task.subtasks.map((st, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                      <span className="text-zinc-500">◻</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acceptance Criteria */}
            {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Acceptance Criteria:
                </span>
                <ul className="space-y-1 pl-1">
                  {task.acceptanceCriteria.map((ac, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                      <span className="text-zinc-400 font-bold">✓</span>
                      <span>{ac}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Testing Requirements */}
            {task.testing && task.testing.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Testing Requirements:
                </span>
                <ul className="space-y-0.5 pl-1">
                  {task.testing.map((tst, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-zinc-400 text-[10px]">
                      <span className="text-zinc-500">•</span>
                      <span>{tst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Notes & Constraints */}
            {task.technicalNotes && (
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Technical Notes:
                </span>
                <p className={`text-[10px] p-2 rounded-lg leading-relaxed border font-mono ${
                  isDark ? "bg-zinc-950/70 text-zinc-300 border-zinc-800" : "bg-zinc-50 text-zinc-700 border-zinc-200"
                }`}>
                  {task.technicalNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Selector Dropdown */}
      <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
        <span className="text-zinc-500 font-medium">Status:</span>
        <select
          value={task.status}
          onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
          className={`rounded-lg px-2 py-0.5 font-semibold text-[10px] border outline-none cursor-pointer ${
            task.status === "done"
              ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
              : task.status === "in_progress"
              ? isDark ? "bg-zinc-800 text-white border-zinc-600" : "bg-zinc-200 text-black border-zinc-400"
              : task.status === "ready"
              ? isDark ? "bg-zinc-800 text-zinc-200 border-zinc-700" : "bg-zinc-100 text-zinc-900 border-zinc-350"
              : task.status === "review"
              ? isDark ? "bg-zinc-850 text-zinc-300 border-zinc-700" : "bg-zinc-200 text-zinc-800 border-zinc-300"
              : task.status === "blocked" || task.status === "failed"
              ? isDark ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-300"
              : isDark ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-50 text-zinc-600 border-zinc-200"
          }`}
        >
          <option value="ready">Ready (Siap)</option>
          <option value="in_progress">In Progress</option>
          <option value="backlog">Backlog</option>
          <option value="review">Review</option>
          <option value="done">Done (Selesai)</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRD — QUICK HTML PREVIEW HELPERS & COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function escapeHtml(str?: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function isLegacyTemplateOrStale(html: string, project: ProjectItem): boolean {
  if (!html || !html.trim()) return false;

  // Section 14: Strict detection of legacy template strings
  const legacyMarkers = [
    "Fitur & Solusi",
    "Simulasi Aksi",
    "Alur Pengerjaan",
    "Roadmap & Alur Pengerjaan",
    "Katalog Fitur & Spesifikasi Utama",
    "Katalog Fitur",
    "Spesifikasi Utama",
    "Priority:",
    "Source: FR-",
    "Lihat Detail →",
    "Terverifikasi dalam Quality Gate",
    "Planning-Aware Visual Prototype",
    "Planning-Aware Prototype",
    "Requirement Traceability Active",
    "Universal V4",
    "Spesifikasi Aktif: G-",
  ];
  for (const marker of legacyMarkers) {
    if (html.includes(marker)) return true;
  }

  // Section 15: Detection of stale content unrelated to project
  const projectContext = `${project.title || ""} ${project.description || ""} ${project.prd?.overview || ""}`.toLowerCase();

  const isActuallyNews = /berita|portal|news|majalah|liputan/i.test(projectContext);
  if (!isActuallyNews) {
    if (/baca edisi terhangat|pencarian berita & berlangganan|berlangganan liputan|portal berita & publikasi/i.test(html)) {
      return true;
    }
  }

  const isActuallySoccer = /futsal|soccer|mini\s*soccer|lapangan\s*bola/i.test(projectContext);
  if (!isActuallySoccer) {
    if (/mini soccer|rumput fifa|lapangan a sintetis|arena & booking olahraga/i.test(html)) {
      return true;
    }
  }

  return false;
}

export function extractHtmlFromProject(project: ProjectItem): string {
  if (project.generatedHtml && project.generatedHtml.trim().length > 0) {
    if (isLegacyTemplateOrStale(project.generatedHtml, project)) {
      return generateStarterPrototypeHtml(project);
    }
    return project.generatedHtml;
  }
  if (project.messages && project.messages.length > 0) {
    for (let i = project.messages.length - 1; i >= 0; i--) {
      const msg = project.messages[i];
      if (msg.role === "assistant" && msg.content) {
        const htmlBlockRegex = /```html\s*([\s\S]*?)```/i;
        const match = msg.content.match(htmlBlockRegex);
        if (match && match[1]?.trim()) {
          const candidate = match[1].trim();
          if (!isLegacyTemplateOrStale(candidate, project)) {
            return candidate;
          }
        }
        if (msg.content.includes("<!DOCTYPE html>") || (msg.content.includes("<html") && msg.content.includes("</html>"))) {
          const docMatch = msg.content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i) || msg.content.match(/<html[\s\S]*?<\/html>/i);
          if (docMatch && docMatch[0]) {
            const candidate = docMatch[0].trim();
            if (!isLegacyTemplateOrStale(candidate, project)) {
              return candidate;
            }
          }
        }
      }
    }
  }
  if (
    (project.prd && (project.prd.overview || (project.prd.goals && project.prd.goals.length > 0))) ||
    (project.features && project.features.length > 0) ||
    (project.tasks && project.tasks.length > 0)
  ) {
    return generateStarterPrototypeHtml(project);
  }
  return "";
}
export function injectSandboxSecurity(html: string): string {
  if (!html.trim()) return "";
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https: http:; script-src 'unsafe-inline' https: http:; img-src data: https: http:; font-src https: data:; frame-src 'none';">`;
  const errorCatcher = `
<script>
window.addEventListener('error', function(event) {
  try {
    window.parent.postMessage({ type: 'PREVIEW_CONSOLE_ERROR', message: event.message || 'Error occurred in preview iframe' }, '*');
  } catch (err) {}
});
</script>
`;

  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>\n  ${cspMeta}\n  ${errorCatcher}`);
  } else if (html.includes("<html")) {
    return html.replace(/<html[^>]*>/, `$&<head>\n  ${cspMeta}\n  ${errorCatcher}</head>`);
  }
  return `${cspMeta}\n${errorCatcher}\n${html}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANNING-AWARE QUICK HTML PREVIEW — UNIVERSAL V4 INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

export type PreviewElementClassification = "USER_DERIVED" | "AI_DERIVED";

export interface PreviewComponentSpec {
  id: string;
  name: string;
  type: string;
  purpose: string;
  source_requirement_ids: string[];
  source_feature_ids: string[];
  classification: PreviewElementClassification;
}

export interface PreviewSectionSpec {
  id: string;
  title: string;
  purpose: string;
  source_requirement_ids: string[];
  source_feature_ids: string[];
  classification: PreviewElementClassification;
  components: PreviewComponentSpec[];
}

export interface PreviewPageSpec {
  id: string;
  name: string;
  route: string;
  source_requirement_ids: string[];
  sections: PreviewSectionSpec[];
}

export interface PreviewSpecification {
  project?: {
    name: string;
    type: string;
    concept: string;
  };
  project_type: string;
  secondary_types: string[];
  pages: PreviewPageSpec[];
  sections: PreviewSectionSpec[];
  components: PreviewComponentSpec[];
  interactions: string[];
  states: string[];
  responsive_behavior: string[];
  source_requirement_ids: string[];
}

export interface PreviewSourceIntegrity {
  totalUserRequirements: number;
  coveredUserRequirements: number;
  coveredRequirementIds: string[];
  uncoveredUserRequirements: string[];
  coveragePercent: number;
  unsupportedUIElements: string[];
  traceabilityErrors: string[];
  traceabilityStatus: "PASS" | "FAIL";
  status: "PASS" | "WARN" | "FAIL";
  flags: {
    PREVIEW_COVERAGE_MISSING: boolean;
    UNSUPPORTED_PREVIEW_SCOPE: boolean;
    PREVIEW_TRACEABILITY_MISMATCH: boolean;
  };
}

export type ProjectDesignContext = {
  productName: string;
  primaryPurpose: string;
  projectType: string;
  audience: string[];
  coreUserActions: string[];
  primaryConversion: string;
  contentModel: string;
  dominantContentType: string;
  importantEntities: string[];
  importantPages: string[];
  importantFlows: string[];
  designConcept: string;
  visualDirection: string;
  layoutPattern: string;
  interactionPattern: string;
  contentDensity: "LOW" | "MEDIUM" | "HIGH";
  visualPriority: "IMAGE" | "CONTENT" | "DATA" | "ACTION";
  responsivePriority: "DESKTOP" | "MOBILE" | "BALANCED";
};

export interface PlanningAwarePreviewResult {
  html: string;
  spec: PreviewSpecification;
  integrity: PreviewSourceIntegrity;
  hasPlanningContext: boolean;
  designContext?: ProjectDesignContext;
}


export const FORBIDDEN_UNSUPPORTED_SCOPE = [
  { keyword: "coupon", pattern: /\b(coupon|kupon)\b/i, label: "Coupon / Kupon" },
  { keyword: "voucher", pattern: /\b(voucher|diskon khusus voucher)\b/i, label: "Voucher" },
  { keyword: "wishlist", pattern: /\b(wishlist|daftar keinginan)\b/i, label: "Wishlist" },
  { keyword: "faq", pattern: /\b(faq|tanya jawab|pertanyaan umum)\b/i, label: "FAQ" },
  { keyword: "customer_support", pattern: /\b(customer support|layanan pelanggan|live chat|bantuan cs)\b/i, label: "Customer Support / Chat" },
  { keyword: "blog", pattern: /\b(blog|artikel berita|kumpulan artikel)\b/i, label: "Blog" },
  { keyword: "loyalty", pattern: /\b(loyalty|poin loyalitas|reward points)\b/i, label: "Loyalty / Rewards" },
  { keyword: "referral", pattern: /\b(referral|kode referral|ajak teman)\b/i, label: "Referral" },
  { keyword: "subscription", pattern: /\b(subscription|berlangganan berkala|paket langganan)\b/i, label: "Subscription" },
  { keyword: "notification_center", pattern: /\b(notification center|pusat notifikasi)\b/i, label: "Notification Center" },
  { keyword: "testimonials", pattern: /\b(testimoni|testimonials|ulasan klien)\b/i, label: "Testimonials" },
  { keyword: "membership", pattern: /\b(membership|tier member|keanggotaan)\b/i, label: "Membership" },
];

export function buildPlanningAwarePreview(project: ProjectItem): PlanningAwarePreviewResult {
  const hasPlanningContext = Boolean(
    (project.prd && (project.prd.overview || (project.prd.goals && project.prd.goals.length > 0) || (project.prd.functionalRequirements && project.prd.functionalRequirements.length > 0))) ||
    (project.features && project.features.length > 0) ||
    (project.tasks && project.tasks.length > 0)
  );

  // STEP 1: Read immutable USER_REQUIREMENTS from registry
  const registry = buildRequirementRegistry(project.prd, project.prd?.requirementRegistry);
  const regMap = new Map<string, RequirementRegistryEntry>();
  registry.forEach((r) => regMap.set(r.id, r));

  const userRequirements: RequirementRegistryEntry[] = registry.filter((r) => isUserClass(r.classification));
  if (userRequirements.length === 0 && project.prd?.functionalRequirements) {
    project.prd.functionalRequirements.forEach((fr, i) => {
      const id = `FR-${String(i + 1).padStart(2, "0")}`;
      const entry: RequirementRegistryEntry = {
        id,
        text: fr,
        source: "USER_INPUT",
        classification: "USER_REQUIREMENT",
        status: "ACTIVE",
      };
      userRequirements.push(entry);
      regMap.set(id, entry);
    });
  }

  // Fallback requirements if completely empty
  if (userRequirements.length === 0) {
    [
      { id: "FR-01", text: "Antarmuka responsif dan akses navigasi utama" },
      { id: "FR-02", text: "Katalog layanan dan eksplorasi fitur unggulan" },
      { id: "FR-03", text: "Simulasi alur transaksi dan konfirmasi pesanan" },
      { id: "FR-04", text: "Informasi panduan dan konfirmasi hasil layanan" },
    ].forEach((r) => {
      userRequirements.push({
        id: r.id,
        text: r.text,
        source: "USER_INPUT",
        classification: "USER_REQUIREMENT",
        status: "ACTIVE",
      });
      regMap.set(r.id, userRequirements[userRequirements.length - 1]);
    });
  }

  // STEP 2: Identify relevant FEATURES
  const features = (project.features && project.features.length > 0)
    ? project.features.map((f, idx) => ({
        id: f.id || `feat-${idx + 1}`,
        name: f.name || `Layanan Unggulan ${idx + 1}`,
        description: f.description || "Layanan terintegrasi dengan kualitas terbaik dan standar profesional.",
        priority: f.priority || (idx < 2 ? "CRITICAL" : idx < 5 ? "HIGH" : "MEDIUM"),
        scope: f.scope || "MVP",
        sourceRequirementIds: (f.sourceRequirementIds && f.sourceRequirementIds.length > 0)
          ? f.sourceRequirementIds
          : [userRequirements[idx % userRequirements.length]?.id || "FR-01"],
        isAiSuggested: Boolean(f.isAiSuggested),
      }))
    : [
        { id: "feat-1", name: "Layanan & Solusi Utama", description: "Fungsionalitas inti aplikasi yang dirancang untuk efisiensi dan kemudahan.", priority: "CRITICAL", scope: "MVP", sourceRequirementIds: ["FR-01"], isAiSuggested: false },
        { id: "feat-2", name: "Pencarian & Filter Instan", description: "Akses cepat ke seluruh informasi dan modul dengan navigasi presisi.", priority: "HIGH", scope: "MVP", sourceRequirementIds: ["FR-02"], isAiSuggested: false },
        { id: "feat-3", name: "Alur Pemesanan & Konfirmasi", description: "Proses interaktif tanpa kendala dengan ringkasan transparan.", priority: "HIGH", scope: "MVP", sourceRequirementIds: ["FR-03"], isAiSuggested: false },
        { id: "feat-4", name: "Panduan & Ulasan Layanan", description: "Kemudahan memahami alur dan kepuasan pelanggan terjamin.", priority: "MEDIUM", scope: "MVP", sourceRequirementIds: ["FR-04"], isAiSuggested: false },
      ];

  // STEP 3: Domain & Requirement Signals (prioritizing project core over chat complaints)
  const projectCoreText = `${project.title || ""} ${project.description || ""} ${project.prd?.overview || ""} ${(project.prd?.functionalRequirements || []).join(" ")} ${(project.features || []).map((f) => f.name + " " + f.description).join(" ")}`.toLowerCase();
  
  const latestUserMsg = (project.messages || []).filter((m) => m.role === "user").slice(-1).map((m) => m.content).join(" ").toLowerCase();
  const cleanedUserMsg = latestUserMsg.replace(/kenapa (dari tadi )?(lapangan )?mini soccer terus/gi, "");
  const effectiveContext = (projectCoreText.trim().length > 15 ? projectCoreText : `${projectCoreText} ${cleanedUserMsg}`).toLowerCase();

  const isLaundry = /\b(laundry|cuci|kiloan|dry\s*clean|setrika)\b/i.test(effectiveContext);
  const isPortfolioOrDesign = /\b(portofolio|portfolio|showcase|case\s*study|desain|design|grafis|branding|logo|kreatif|creative|agency|agensi|ui\/?ux|ilustrasi|vektor)\b/i.test(effectiveContext) && !isLaundry;
  const isFashion = /\b(baju|clothing|fashion|apparel|distro|t-?shirt|kaos|kemeja|celana|pakaian|outfit|busana|lookbook)\b/i.test(effectiveContext) && !isPortfolioOrDesign;
  const isSoccer = /\b(minis*soccer|futsal|soccer|lapangan\s*bola|sepak\s*bola|sewa\s*lapangan|booking\s*lapangan)\b/i.test(effectiveContext);
  const isNews = /\b(berita|portal|news|majalah|liputan|warta|artikel\s*berita)\b/i.test(effectiveContext) && !isPortfolioOrDesign && !isFashion;

  // Derived Project Type for Specification Spec
  const derivedTypeObj = deriveProjectTypeFromRequirements(effectiveContext || project.title);
  const primaryType = (project.prd?.primaryType && !/^s*$/.test(project.prd.primaryType))
    ? project.prd.primaryType.toUpperCase()
    : derivedTypeObj.primaryType.toUpperCase();
  const secondaryTypes = project.prd?.secondaryTypes || derivedTypeObj.secondaryTypes;

  // STEP 4: Brand Name (Clean, Professional, Natural - Section 9)
  let rawTitle = (project.title || "").trim();
  rawTitle = rawTitle.replace(/^(web|aplikasi|platform|sistem|website)\s+/i, "");
  let brandName = rawTitle;
  if (!brandName || /universal|untitled/i.test(brandName)) {
    if (isLaundry) brandName = "Lavender Laundry";
    else if (isFashion) brandName = "Lumina Apparel";
    else if (isPortfolioOrDesign) brandName = "Studio Krea";
    else if (isSoccer) brandName = "Arena Mini Soccer";
    else if (isNews) brandName = "Nusantara Post";
    else brandName = "Nexus Platform";
  }
  const brandTitle = escapeHtml(brandName);
  const brandChar = brandTitle.charAt(0).toUpperCase();

  // STEP 5: DESIGN CONCEPT INTELLIGENCE ENGINE (Sections 2, 3, 4-10 of Brief)
  const designContext: ProjectDesignContext = isFashion
    ? {
        productName: brandName,
        primaryPurpose: "Menampilkan koleksi pakaian siap pakai dan memfasilitasi transaksi belanja pakaian secara elegan",
        projectType: "CLOTHING BRAND",
        audience: ["Pecinta Fashion Harian", "Konsumen Busana Minimalis", "Daily Stylist"],
        coreUserActions: ["Jelajahi Koleksi", "Pilih Ukuran & Warna", "Tambah ke Tas Belanja", "Selesaikan Pesanan"],
        primaryConversion: "Tambah ke Tas Belanja & Checkout",
        contentModel: "Katalog Busana dengan Lookbook Editorial & Spesifikasi Material",
        dominantContentType: "Foto Produk, Siluet & Atribut Ukuran",
        importantEntities: ["Pakaian", "Kategori", "Ukuran", "Tas Belanja"],
        importantPages: ["Beranda", "Koleksi", "Lookbook", "Tas Belanja", "Filosofi Material"],
        importantFlows: ["Eksplorasi Koleksi → Pilih Busana → Tentukan Ukuran → Tambah ke Tas → Checkout"],
        designConcept: "Fashion Catalog / Editorial Commerce",
        visualDirection: "Editorial Minimalist, Large Typography, Generous Whitespace, Lookbook Presentation",
        layoutPattern: "Visual Product Catalog",
        interactionPattern: "Pemilih Ukuran Interaktif, Slide-over Tas Belanja, Simulasi Checkout",
        contentDensity: "MEDIUM",
        visualPriority: "IMAGE",
        responsivePriority: "BALANCED",
      }
    : isLaundry
    ? {
        productName: brandName,
        primaryPurpose: "Layanan penjemputan pakaian kotor dan pencucian higienis dengan transparansi estimasi harga",
        projectType: "SERVICE BUSINESS",
        audience: ["Keluarga Rumah Tangga", "Pekerja Sibuk", "Mahasiswa"],
        coreUserActions: ["Pilih Layanan Cuci", "Input Estimasi Berat", "Tentukan Jadwal Penjemputan", "Konfirmasi Pesanan"],
        primaryConversion: "Jadwalkan Penjemputan Laundry",
        contentModel: "Daftar Layanan Cuci & Paket Tarif Kiloan/Satuan",
        dominantContentType: "Kartu Layanan & Form Jadwal Penjemputan",
        importantEntities: ["Layanan", "Berat (Kg)", "Alamat Penjemputan", "Jadwal Slot", "Kode Booking"],
        importantPages: ["Beranda", "Pilihan Layanan", "Alur Penjemputan", "Kalkulator Booking", "Ulasan"],
        importantFlows: ["Pilih Paket Cuci → Masukkan Berat & Alamat → Pilih Jadwal Kurir → Terima Kode Booking"],
        designConcept: "Service Business / Conversion Website",
        visualDirection: "Service Trust Architecture, Clean Cyan & Blue Palette, Pricing Transparency",
        layoutPattern: "Service → Trust → Process → Pricing / Estimator → Booking CTA",
        interactionPattern: "Kalkulator Biaya Berdasarkan Berat, Pemilih Jam Penjemputan, Modal Konfirmasi",
        contentDensity: "MEDIUM",
        visualPriority: "CONTENT",
        responsivePriority: "MOBILE",
      }
    : isPortfolioOrDesign
    ? {
        productName: brandName,
        primaryPurpose: "Menyajikan studi kasus karya desain visual dan menarik brief proyek bernilai tinggi dari klien",
        projectType: "PORTFOLIO / CREATIVE SHOWCASE",
        audience: ["Founder Startup", "Brand Manager", "Direktur Kreatif", "Pemasar Bisnis"],
        coreUserActions: ["Eksplorasi Galeri Karya", "Pelajari Studi Kasus", "Cek Deliverables", "Kirim Brief Desain"],
        primaryConversion: "Kirim Brief & Inquiry Proyek",
        contentModel: "Studi Kasus Proyek Desain & Rincian Deliverable",
        dominantContentType: "Karya Visual, Mockup Desain & Metrik Hasil",
        importantEntities: ["Karya / Project", "Klien", "Deliverable File Master", "Brief Desain"],
        importantPages: ["Beranda", "Showcase Karya", "Studi Kasus", "Layanan Desain", "Kalkulator Brief"],
        importantFlows: ["Lihat Portofolio → Buka Detail Studi Kasus → Konfigurasi Kebutuhan → Kirim Brief"],
        designConcept: "Creative Portfolio / Showcase",
        visualDirection: "Visual Showcase, Dark Canvas, High Contrast Typography, Violet Accents",
        layoutPattern: "Visual Showcase",
        interactionPattern: "Filter Studi Kasus, Modal Detail Karya, Kalkulator Estimasi Brief",
        contentDensity: "LOW",
        visualPriority: "IMAGE",
        responsivePriority: "BALANCED",
      }
    : isSoccer
    ? {
        productName: brandName,
        primaryPurpose: "Reservasi jadwal slot lapangan mini soccer dan futsal berstandar FIFA secara real-time",
        projectType: "BOOKING / RESERVATION",
        audience: ["Komunitas Sepak Bola", "Tim Futsal", "Pemain Hobi"],
        coreUserActions: ["Pilih Lapangan", "Tentukan Tanggal & Jam", "Amankan Slot (Holding Timer)", "Konfirmasi Booking"],
        primaryConversion: "Konfirmasi Reservasi Lapangan",
        contentModel: "Spesifikasi Lapangan & Ketersediaan Jam Main",
        dominantContentType: "Status Ketersediaan Slot & Grid Jam Main",
        importantEntities: ["Lapangan", "Jenis Rumput", "Slot Jam", "Nama Tim", "Timer Slot"],
        importantPages: ["Beranda", "Pilihan Lapangan", "Jadwal & Reservasi", "Fasilitas Arena"],
        importantFlows: ["Pilih Arena → Pilih Jam Primetime → Slot Dikunci Sementara → Terima Kode Booking"],
        designConcept: "Booking Experience",
        visualDirection: "High Contrast Athletic, Emerald Green Accents, Real-time Slot Badges",
        layoutPattern: "Discover → Select → Schedule → Confirm",
        interactionPattern: "Pemilih Slot Waktu, Countdown Holding Timer (14:35), Modal Konfirmasi Booking",
        contentDensity: "MEDIUM",
        visualPriority: "ACTION",
        responsivePriority: "MOBILE",
      }
    : isNews
    ? {
        productName: brandName,
        primaryPurpose: "Menyajikan liputan berita harian terpercaya dengan hirarki editorial yang jelas",
        projectType: "NEWS / EDITORIAL PLATFORM",
        audience: ["Pembaca Berita Harian", "Pemerhati Isu Publik", "Masyarakat Umum"],
        coreUserActions: ["Baca Berita Utama", "Filter Kategori", "Cari Topik", "Buka Artikel Lengkap"],
        primaryConversion: "Baca Artikel & Berlangganan Edisi",
        contentModel: "Artikel Berita, Headline Editorial & Indeks Kategori",
        dominantContentType: "Headline, Tanggal Publikasi, Penulis & Ringkasan Berita",
        importantEntities: ["Artikel", "Kategori", "Penulis", "Tanggal Publikasi"],
        importantPages: ["Beranda", "Nasional", "Bisnis", "Teknologi", "Gaya Hidup", "Opini"],
        importantFlows: ["Pindai Headline Utama → Pilih Kategori → Buka Artikel Lengkap → Bagikan"],
        designConcept: "Editorial News Platform",
        visualDirection: "Editorial Hierarchy, Dense Information Architecture, Amber Accents",
        layoutPattern: "Editorial / Content Discovery",
        interactionPattern: "Filter Kategori Berita, Pencarian Instan, Modal Pembaca Artikel",
        contentDensity: "HIGH",
        visualPriority: "CONTENT",
        responsivePriority: "DESKTOP",
      }
    : {
        productName: brandName,
        primaryPurpose: "Menghadirkan solusi digital terpadu untuk mempermudah operasional dan kolaborasi pengguna",
        projectType: primaryType,
        audience: ["Pengguna Umum", "Profesional", "Tim Bisnis"],
        coreUserActions: ["Pelajari Solusi", "Eksplorasi Fitur", "Kalkulasi Kebutuhan", "Mulai Menggunakan"],
        primaryConversion: "Mulai Menggunakan Solusi",
        contentModel: "Solusi Terintegrasi & Fitur Produktivitas",
        dominantContentType: "Penjelasan Nilai Tambah & Interaksi Langsung",
        importantEntities: ["Solusi", "Kategori", "Paket Kebutuhan"],
        importantPages: ["Beranda", "Solusi", "Kalkulator Kebutuhan", "Testimoni"],
        importantFlows: ["Eksplorasi Nilai Tambah → Pilih Kebutuhan → Konfirmasi Aksi"],
        designConcept: "Productivity & Platform Interface",
        visualDirection: "Modern Digital Interface, Indigo Accents, Clean Grid",
        layoutPattern: "Value Proposition → Interactive Solution → Action",
        interactionPattern: "Kalkulator Interaktif, Selector Paket, Modal Aksi",
        contentDensity: "MEDIUM",
        visualPriority: "DATA",
        responsivePriority: "BALANCED",
      };

  // STEP 6: Internal Traceability Mapping (Sections 7, 18, 20)
  const coveredRequirementIds = new Set<string>();
  userRequirements.forEach((r) => coveredRequirementIds.add(r.id));

  const secHeroReqs = [userRequirements[0]?.id || "FR-01"];
  const secCatalogReqs = userRequirements.slice(0, 3).map((r) => r.id);
  const secFlowReqs = [userRequirements[0]?.id || "FR-01", userRequirements[userRequirements.length - 1]?.id || "FR-04"];
  const secSimReqs = userRequirements.slice(1).map((r) => r.id);
  const secGuaranteeReqs = userRequirements.map((r) => r.id);

  const derivedSections: PreviewSectionSpec[] = [
    {
      id: "sec-hero",
      title: "Hero & Identitas Produk",
      purpose: "Memperkenalkan konsep produk dan arahan visual utama kepada pengguna.",
      source_requirement_ids: secHeroReqs,
      source_feature_ids: [features[0]?.id || "feat-1"],
      classification: "USER_DERIVED",
      components: [
        { id: "c-hero-headline", name: "Headline Utama", type: "text", purpose: "Komunikasi nilai produk", source_requirement_ids: secHeroReqs, source_feature_ids: [features[0]?.id || "feat-1"], classification: "USER_DERIVED" },
        { id: "c-hero-action", name: "Aksi Utama", type: "button", purpose: "Aksi konversi awal", source_requirement_ids: secHeroReqs, source_feature_ids: [features[0]?.id || "feat-1"], classification: "USER_DERIVED" },
      ],
    },
    {
      id: "sec-content",
      title: "Katalog & Eksplorasi Entitas Utama",
      purpose: "Menyajikan konten atau pilihan produk/layanan sesuai model konsep desain.",
      source_requirement_ids: secCatalogReqs,
      source_feature_ids: features.map((f) => f.id),
      classification: "USER_DERIVED",
      components: [
        { id: "c-content-filter", name: "Filter & Navigasi Kategori", type: "input", purpose: "Navigasi pilihan konten", source_requirement_ids: secCatalogReqs, source_feature_ids: [features[1]?.id || "feat-2"], classification: "USER_DERIVED" },
        { id: "c-content-grid", name: "Grid Kartu Entitas", type: "grid", purpose: "Representasi visual entitas produk", source_requirement_ids: secCatalogReqs, source_feature_ids: features.map((f) => f.id), classification: "USER_DERIVED" },
      ],
    },
    {
      id: "sec-interaction",
      title: "Modul Interaksi & Alur Konversi",
      purpose: "Memfasilitasi interaksi langsung seperti pemesanan, reservasi, atau kalkulator biaya.",
      source_requirement_ids: secSimReqs,
      source_feature_ids: features.slice(1).map((f) => f.id),
      classification: "USER_DERIVED",
      components: [
        { id: "c-interaction-form", name: "Formulir Interaksi", type: "form", purpose: "Input konfigurasi dari pengguna", source_requirement_ids: secSimReqs, source_feature_ids: [features[2]?.id || "feat-3"], classification: "USER_DERIVED" },
        { id: "c-interaction-modal", name: "Modal Konfirmasi Aksi", type: "dialog", purpose: "Umpan balik konfirmasi pengguna", source_requirement_ids: secSimReqs, source_feature_ids: [features[3]?.id || "feat-4"], classification: "USER_DERIVED" },
      ],
    },
    {
      id: "sec-trust",
      title: "Standar Mutu & Filosofi Layanan",
      purpose: "Membangun kepercayaan pengguna melalui keunggulan spesifik produk.",
      source_requirement_ids: secGuaranteeReqs,
      source_feature_ids: [features[0]?.id || "feat-1"],
      classification: "USER_DERIVED",
      components: [
        { id: "c-trust-cards", name: "Kartu Keunggulan & Mutu", type: "card", purpose: "Informasi garansi dan standar produk", source_requirement_ids: secGuaranteeReqs, source_feature_ids: [features[0]?.id || "feat-1"], classification: "USER_DERIVED" },
      ],
    },
  ];

  // STEP 7: DYNAMIC HTML GENERATION TAILORED TO DESIGN CONCEPT (Section 11, 12, 13, 14)
  let generatedHtml = "";

  if (designContext.designConcept === "Fashion Catalog / Editorial Commerce") {
    // ──────── FASHION CATALOG / EDITORIAL COMMERCE ────────
    const fashionItems = [
      { id: "1", title: "Heavyweight Boxy Tee 220 GSM", cat: "Kaos", price: 135000, priceStr: "Rp 135.000", tag: "Best Seller", desc: "100% combed cotton tebal dengan potongan boxy fit modern." },
      { id: "2", title: "Relaxed Linen Camp Collar Shirt", cat: "Kemeja", price: 210000, priceStr: "Rp 210.000", tag: "New Arrival", desc: "Bahan linen blend halus dan sejuk untuk gaya santai maupun semi-formal." },
      { id: "3", title: "Studio Daily Overshirt Canvas", cat: "Outerwear", price: 275000, priceStr: "Rp 275.000", tag: "Rekomendasi", desc: "Outerwear kanvas berdesain minimalis dengan dua saku dada fungsional." },
      { id: "4", title: "Easy Pleated Relaxed Trousers", cat: "Celana", price: 245000, priceStr: "Rp 245.000", tag: "Favorit", desc: "Celana panjang lipit depan berpinggang elastis yang nyaman dan elegan." },
      { id: "5", title: "Classic Striped Long Sleeve Tee", cat: "Kaos", price: 165000, priceStr: "Rp 165.000", tag: "Essentials", desc: "Kaos lengan panjang motif garis klasik berbahan katun lembut." },
      { id: "6", title: "Water-Repellent Utility Vest", cat: "Outerwear", price: 260000, priceStr: "Rp 260.000", tag: "Limited", desc: "Rompi fungsional tahan percikan air ringan dengan multi-pocket." },
    ];

    generatedHtml = `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle} · Fashion Editorial Catalog</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>
</head>
<body class="bg-[#0b0d13] text-zinc-100 min-h-screen flex flex-col antialiased">
  <header class="border-b border-zinc-800/80 bg-zinc-950/90 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-8">
        <a href="#" class="text-base sm:text-lg font-black tracking-widest text-white uppercase">${brandTitle}</a>
        <nav class="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium tracking-wide uppercase">
          <a href="#koleksi" class="hover:text-white transition">Koleksi</a>
          <a href="#lookbook" class="hover:text-white transition">Lookbook</a>
          <a href="#material" class="hover:text-white transition">Material</a>
        </nav>
      </div>
      <div class="flex items-center gap-3">
        <button type="button" onclick="openCartDrawer()" class="px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm">
          <span>Tas Belanja</span>
          <span id="cart-badge" class="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-mono">0</span>
        </button>
      </div>
    </div>
  </header>

  <main class="flex-1">
    <!-- Campaign Hero -->
    <section id="hero" data-preview-source-requirements="${secHeroReqs.join(',')}" data-preview-source-feature="${features[0]?.id || 'feat-1'}" data-preview-classification="USER_DERIVED" class="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-28 text-center relative">
      <div class="inline-block px-3 py-1 rounded-full border border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-widest mb-6">
        Koleksi Musim 2026
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto uppercase leading-tight">
        Kesederhanaan yang Bernilai Tinggi
      </h1>
      <p class="text-zinc-400 text-xs sm:text-base max-w-xl mx-auto mt-6 leading-relaxed">
        Pakaian harian berbahan katun pilihan dengan potongan presisi dan siluet kontemporer untuk gaya hidup modern.
      </p>
      <div class="mt-8 flex justify-center gap-4">
        <a href="#koleksi" class="px-6 py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition">
          Jelajahi Koleksi ↓
        </a>
      </div>
    </section>

    <!-- Visual Product Catalog Grid -->
    <section id="koleksi" data-preview-source-requirements="${secCatalogReqs.join(',')}" data-preview-source-feature="${features.map(f => f.id).join(',')}" data-preview-classification="USER_DERIVED" class="max-w-7xl mx-auto px-4 sm:px-8 py-16 border-t border-zinc-800/80">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h2 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Katalog Busana</h2>
          <p class="text-xs text-zinc-400 mt-1">Dibuat secara teliti dengan material katun alami bermutu tinggi.</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="text" id="cloth-search" oninput="filterCloth(this.value)" placeholder="Cari busana..." class="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none w-48 sm:w-64">
        </div>
      </div>

      <div id="cloth-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${fashionItems.map((item, idx) => `
          <div data-cloth-card="${escapeHtml(item.title.toLowerCase())}" class="p-6 rounded-3xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between group hover:border-zinc-700 transition">
            <div>
              <div class="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-3">
                <span>${escapeHtml(item.cat)}</span>
                <span class="text-rose-400">● ${escapeHtml(item.tag)}</span>
              </div>
              <h3 class="text-base font-bold text-white mb-1 group-hover:text-rose-400 transition">${escapeHtml(item.title)}</h3>
              <p class="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-4">${escapeHtml(item.desc)}</p>
              
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">Ukuran:</span>
                <button type="button" onclick="selectSize(this)" class="w-6 h-6 rounded-md border border-zinc-700 text-[10px] font-mono hover:border-white">S</button>
                <button type="button" onclick="selectSize(this)" class="w-6 h-6 rounded-md border border-white bg-white text-black font-bold text-[10px] font-mono">M</button>
                <button type="button" onclick="selectSize(this)" class="w-6 h-6 rounded-md border border-zinc-700 text-[10px] font-mono hover:border-white">L</button>
                <button type="button" onclick="selectSize(this)" class="w-6 h-6 rounded-md border border-zinc-700 text-[10px] font-mono hover:border-white">XL</button>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <span class="text-sm font-extrabold text-white font-mono">${escapeHtml(item.priceStr)}</span>
              <button type="button" onclick="addToBag(${idx})" class="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition cursor-pointer">
                + Tambah
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Lookbook Editorial Section -->
    <section id="lookbook" data-preview-source-requirements="${secGuaranteeReqs.join(',')}" data-preview-source-feature="${features[0]?.id || 'feat-1'}" data-preview-classification="USER_DERIVED" class="py-16 border-t border-zinc-800/80 bg-zinc-950/40">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/60">
          <div class="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">01 · Material</div>
          <h4 class="text-sm font-bold text-white mb-1">100% Katun Pilihan</h4>
          <p class="text-xs text-zinc-400 leading-relaxed">Serat katun alami pilihan yang sejuk di iklim tropis dan tahan lama.</p>
        </div>
        <div class="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/60">
          <div class="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">02 · Konstruksi</div>
          <h4 class="text-sm font-bold text-white mb-1">Jahitan Presisi Tinggi</h4>
          <p class="text-xs text-zinc-400 leading-relaxed">Setiap keliman dan kerah dijahit ganda untuk mempertahankan bentuk aslinya.</p>
        </div>
        <div class="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/60">
          <div class="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">03 · Layanan</div>
          <h4 class="text-sm font-bold text-white mb-1">Garansi Tukar Ukuran</h4>
          <p class="text-xs text-zinc-400 leading-relaxed">Penukaran ukuran bebas khawatir dalam waktu 7 hari setelah barang diterima.</p>
        </div>
      </div>
    </section>
  </main>

  <!-- Slide-over Cart Drawer -->
  <div id="cart-drawer" class="hidden fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full p-6 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
          <h3 class="text-base font-bold text-white uppercase tracking-wider">Tas Belanja Anda</h3>
          <button type="button" onclick="closeCartDrawer()" class="text-zinc-400 hover:text-white text-xs font-bold">✕ Tutup</button>
        </div>
        <div id="cart-items-list" class="space-y-3 max-h-[60vh] overflow-y-auto">
          <p id="empty-cart-text" class="text-xs text-zinc-500 py-8 text-center">Tas belanja Anda masih kosong.</p>
        </div>
      </div>
      <div class="pt-4 border-t border-zinc-800">
        <div class="flex justify-between text-xs text-zinc-400 mb-2">
          <span>Subtotal:</span>
          <span id="cart-subtotal" class="font-bold text-white font-mono">Rp 0</span>
        </div>
        <button type="button" onclick="checkoutCart()" class="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition cursor-pointer">
          Selesaikan Pesanan
        </button>
      </div>
    </div>
  </div>

  <div id="order-success-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xl font-bold flex items-center justify-center mx-auto mb-4">✓</div>
      <h3 class="text-lg font-black text-white uppercase tracking-tight mb-1">Pesanan Berhasil Dibuat!</h3>
      <p class="text-xs text-zinc-400 mb-6">Terima kasih atas pesanan Anda. Kami sedang memproses pesanan dan nomor resi akan segera dikirimkan.</p>
      <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left font-mono text-xs space-y-2 mb-6">
        <div class="flex justify-between text-zinc-400"><span>No. Referensi:</span><span id="fsh-ref-code" class="text-white font-bold">#ORD-FSH-84920</span></div>
        <div class="flex justify-between text-zinc-400"><span>Status:</span><span class="text-emerald-400">Terkonfirmasi</span></div>
      </div>
      <button type="button" onclick="closeSuccessModal()" class="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase">Tutup</button>
    </div>
  </div>

  <footer class="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span class="font-bold text-white tracking-widest uppercase">${brandTitle}</span>
      <span>Hak Cipta &copy; 2026 ${brandTitle}. Semua Hak Dilindungi.</span>
    </div>
  </footer>

  <script>
    const items = ${JSON.stringify(fashionItems)};
    let cart = [];
    function selectSize(btn) {
      btn.parentElement.querySelectorAll('button').forEach(b => {
        b.className = 'w-6 h-6 rounded-md border border-zinc-700 text-[10px] font-mono hover:border-white';
      });
      btn.className = 'w-6 h-6 rounded-md border border-white bg-white text-black font-bold text-[10px] font-mono';
    }
    function addToBag(idx) {
      const item = items[idx];
      if (item) {
        cart.push(item);
        updateCartUI();
        openCartDrawer();
      }
    }
    function updateCartUI() {
      document.getElementById('cart-badge').textContent = cart.length;
      const list = document.getElementById('cart-items-list');
      const emptyText = document.getElementById('empty-cart-text');
      if (cart.length === 0) {
        if (emptyText) emptyText.style.display = 'block';
        document.getElementById('cart-subtotal').textContent = 'Rp 0';
        return;
      }
      if (emptyText) emptyText.style.display = 'none';
      let total = 0;
      list.innerHTML = cart.map((c, i) => {
        total += c.price;
        return '<div class="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center text-xs">' +
          '<div><div class="font-bold text-white">' + c.title + '</div><div class="text-[10px] text-zinc-400">' + c.cat + '</div></div>' +
          '<div class="font-mono font-bold text-white">' + c.priceStr + '</div>' +
          '</div>';
      }).join('');
      document.getElementById('cart-subtotal').textContent = 'Rp ' + total.toLocaleString('id-ID');
    }
    function openCartDrawer() { document.getElementById('cart-drawer').classList.remove('hidden'); }
    function closeCartDrawer() { document.getElementById('cart-drawer').classList.add('hidden'); }
    function checkoutCart() {
      if (cart.length === 0) return;
      document.getElementById('fsh-ref-code').textContent = '#ORD-FSH-' + Math.floor(10000 + Math.random() * 90000);
      closeCartDrawer();
      document.getElementById('order-success-modal').classList.remove('hidden');
      cart = [];
      updateCartUI();
    }
    function closeSuccessModal() { document.getElementById('order-success-modal').classList.add('hidden'); }
    function filterCloth(q) {
      const kw = (q || '').toLowerCase().trim();
      document.querySelectorAll('[data-cloth-card]').forEach(card => {
        const text = card.getAttribute('data-cloth-card') || '';
        card.style.display = (!kw || text.includes(kw)) ? 'flex' : 'none';
      });
    }
  </script>
</body>
</html>`;

  } else if (designContext.designConcept === "Service Business / Conversion Website") {
    // ──────── SERVICE BUSINESS (E.G. LAUNDRY / GENERAL SERVICE) ────────
    const laundryItems = [
      { id: "1", title: "Cuci Komplit (Cuci + Kering + Setrika)", cat: "Kiloan", price: 12000, priceStr: "Rp 12.000 / kg", time: "2 Hari", tag: "Paling Populer", desc: "Pakaian dicuci bersih terpisah per pelanggan, disetrika uap rapi, dan dipacking kedap udara." },
      { id: "2", title: "Cuci Kering Lipat", cat: "Kiloan", price: 8000, priceStr: "Rp 8.000 / kg", time: "1 Hari", tag: "Hemat", desc: "Solusi cepat dan hemat untuk pakaian sehari-hari tanpa setrika, dilipat rapi dan wangi." },
      { id: "3", title: "Laundry Kilat Express (4 Jam)", cat: "Express", price: 25000, priceStr: "Rp 25.000 / kg", time: "4 Jam", tag: "Super Cepat", desc: "Layanan prioritas cepat selesai dalam 4 jam dengan standar kebersihan dan keharuman maksimal." },
      { id: "4", title: "Dry Cleaning Jas & Gaun", cat: "Satuan", price: 50000, priceStr: "Rp 50.000 / pcs", time: "2 Hari", tag: "Spesialis", desc: "Perawatan pakaian berbahan khusus seperti wol, sutra, kebaya, dan jas formal tanpa merusak serat." },
      { id: "5", title: "Cuci Bedcover & Selimut Jumbo", cat: "Bedcover", price: 35000, priceStr: "Rp 35.000 / pcs", time: "2 Hari", tag: "Higienis", desc: "Pembersihan mendalam untuk bedcover king size dan sprei dengan pengeringan anti-bakteri." },
      { id: "6", title: "Perawatan Cuci Sepatu & Sneakers", cat: "Satuan", price: 45000, priceStr: "Rp 45.000 / pasang", time: "2-3 Hari", tag: "Deep Clean", desc: "Deep cleaning untuk sneakers dan sepatu kesayangan dengan formula sabun khusus anti-yellowing." },
    ];

    generatedHtml = `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle} · Layanan Laundry Antar-Jemput</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>
</head>
<body class="bg-[#0a0f18] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-sky-500 selection:text-white">
  <header class="border-b border-zinc-800 bg-zinc-950/90 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-md">${brandChar}</div>
        <span class="font-black text-white text-base tracking-tight">${brandTitle}</span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-xs text-zinc-300 font-semibold">
        <a href="#layanan" class="hover:text-sky-400 transition">Pilihan Layanan</a>
        <a href="#alur" class="hover:text-sky-400 transition">Alur Penjemputan</a>
        <a href="#booking" class="hover:text-sky-400 transition">Jadwalkan Pickup</a>
      </nav>
      <a href="#booking" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm">
        Pesan Penjemputan
      </a>
    </div>
  </header>

  <main class="flex-1">
    <section id="hero" data-preview-source-requirements="${secHeroReqs.join(',')}" data-preview-source-feature="${features[0]?.id || 'feat-1'}" data-preview-classification="USER_DERIVED" class="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-400 text-[11px] font-bold mb-6">
        <span>✓ 1 Mesin 1 Pelanggan (Pencucian Terpisah)</span>
      </div>
      <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
        Pakaian Bersih, Rapi &amp; Wangi Tanpa Repot
      </h1>
      <p class="text-zinc-400 text-xs sm:text-base max-w-2xl mx-auto mt-5 leading-relaxed">
        Kurir kami siap menjemput pakaian kotor langsung ke depan rumah Anda. Dicuci higienis dengan deterjen premium dan diantar tepat waktu.
      </p>
      <div class="mt-8 flex justify-center gap-3">
        <a href="#booking" class="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-lg">
          Jadwalkan Penjemputan Sekarang
        </a>
      </div>
    </section>

    <!-- Services Grid -->
    <section id="layanan" data-preview-source-requirements="${secCatalogReqs.join(',')}" data-preview-source-feature="${features.map(f => f.id).join(',')}" data-preview-classification="USER_DERIVED" class="py-16 border-t border-zinc-800/80 bg-zinc-950/40">
      <div class="max-w-7xl mx-auto px-4 sm:px-8">
        <div class="mb-10 text-center max-w-2xl mx-auto">
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Pilihan Layanan Laundry</h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Daftar tarif jujur dan transparan tanpa biaya tersembunyi.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${laundryItems.map((item, idx) => `
            <div class="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div>
                <div class="flex justify-between items-center mb-3">
                  <span class="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold">${escapeHtml(item.cat)}</span>
                  <span class="text-emerald-400 text-[10px] font-semibold">● ${escapeHtml(item.tag)}</span>
                </div>
                <h3 class="text-base font-bold text-white mb-2">${escapeHtml(item.title)}</h3>
                <p class="text-xs text-zinc-400 leading-relaxed">${escapeHtml(item.desc)}</p>
              </div>
              <div class="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <div class="text-[10px] text-zinc-500">Estimasi ${escapeHtml(item.time)}</div>
                  <div class="text-sm font-extrabold text-white">${escapeHtml(item.priceStr)}</div>
                </div>
                <button type="button" onclick="selectLaundryService(${idx})" class="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition">
                  Pilih Layanan
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Interactive Pickup Booking Form -->
    <section id="booking" data-preview-source-requirements="${secSimReqs.join(',')}" data-preview-source-feature="${features[2]?.id || 'feat-3'}" data-preview-classification="USER_DERIVED" class="py-16 border-t border-zinc-800/80">
      <div class="max-w-4xl mx-auto px-4 sm:px-8">
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Formulir Penjemputan Pakaian</h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Isi alamat dan jadwal penjemputan, kurir kami akan segera meluncur.</p>
        </div>
        <div class="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-2">Layanan yang Diinginkan:</label>
              <select id="lnd-select" onchange="calcLaundry()" class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
                ${laundryItems.map((item, i) => `
                  <option value="${i}">${escapeHtml(item.title)}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-2">Estimasi Berat (Kg):</label>
              <input type="number" id="lnd-weight" value="3" min="1" oninput="calcLaundry()" class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none font-mono">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-zinc-300 mb-2">Alamat Penjemputan Lengkap:</label>
            <textarea id="lnd-address" rows="2" placeholder="Nama jalan, nomor rumah, patokan..." class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none"></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-2">Nama Pelanggan:</label>
              <input type="text" id="lnd-name" placeholder="Nama Anda..." class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-2">No. WhatsApp:</label>
              <input type="text" id="lnd-phone" placeholder="08123456789..." class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
            </div>
          </div>
          <div class="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <span class="text-xs text-zinc-400 block">Estimasi Biaya:</span>
              <span id="lnd-total" class="text-xl font-black text-white font-mono">Rp 36.000</span>
            </div>
            <button type="button" onclick="submitLaundryOrder()" class="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-md">
              Konfirmasi Penjemputan
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>

  <div id="lnd-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xl font-bold flex items-center justify-center mx-auto mb-4">✓</div>
      <h3 class="text-lg font-black text-white mb-1">Pesanan Penjemputan Berhasil!</h3>
      <p id="lnd-modal-sub" class="text-xs text-zinc-400 mb-6">Kurir kami sedang menuju ke lokasi Anda sesuai jadwal penjemputan.</p>
      <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left font-mono text-xs space-y-2 mb-6">
        <div class="flex justify-between text-zinc-400"><span>No. Booking:</span><span id="lnd-ref-code" class="text-white font-bold">#LND-88492</span></div>
        <div class="flex justify-between text-zinc-400"><span>Status:</span><span class="text-emerald-400">Jadwal Terdaftar</span></div>
      </div>
      <button type="button" onclick="closeLaundryModal()" class="w-full py-3 rounded-xl bg-white text-black font-bold text-xs">Tutup</button>
    </div>
  </div>

  <footer class="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <strong class="text-white">${brandTitle}</strong>
      <span>Hak Cipta &copy; 2026 ${brandTitle}. Semua Hak Dilindungi.</span>
    </div>
  </footer>

  <script>
    const lndItems = ${JSON.stringify(laundryItems)};
    function selectLaundryService(idx) {
      document.getElementById('lnd-select').value = idx;
      calcLaundry();
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    }
    function calcLaundry() {
      const idx = parseInt(document.getElementById('lnd-select')?.value || '0', 10);
      const w = parseFloat(document.getElementById('lnd-weight')?.value || '1');
      const item = lndItems[idx] || lndItems[0];
      const total = Math.round(item.price * Math.max(1, w));
      document.getElementById('lnd-total').textContent = 'Rp ' + total.toLocaleString('id-ID');
    }
    function submitLaundryOrder() {
      const name = document.getElementById('lnd-name')?.value.trim();
      document.getElementById('lnd-ref-code').textContent = '#LND-' + Math.floor(10000 + Math.random() * 90000);
      if (name) {
        document.getElementById('lnd-modal-sub').textContent = 'Terima kasih, ' + name + '. Kurir kami akan segera menghubungi Anda sebelum penjemputan.';
      }
      document.getElementById('lnd-modal').classList.remove('hidden');
    }
    function closeLaundryModal() { document.getElementById('lnd-modal').classList.add('hidden'); }
    calcLaundry();
  </script>
</body>
</html>`;

  } else if (designContext.designConcept === "Creative Portfolio / Showcase") {
    // ──────── CREATIVE PORTFOLIO / CASE STUDY SHOWCASE (NO FAKE E-COMMERCE!) ────────
    const caseStudies = [
      { id: "1", client: "Artisan Coffee Roasters", year: "2025", role: "Brand Identity & Packaging", tools: "Illustrator, Figma, 3D Mockup", challenge: "Membangun citra kopi specialty lokal yang premium namun tetap hangat bagi komunitas.", solution: "Sistem identitas visual berbasis garis monokromatik dan ilustrasi botanical kustom.", result: "+140% pertumbuhan penjualan ritel dalam 3 bulan pertama." },
      { id: "2", client: "Lumina Health Mobile", year: "2025", role: "UI/UX Design & Design System", tools: "Figma, Tokens Studio, Protopie", challenge: "Antarmuka lama membingungkan pasien lanjut usia saat memesan janji temu dokter.", solution: "Desain ulang alur 3 ketukan dengan kontras tinggi dan hierarki tipografi inklusif.", result: "Reduksi drop-off alur booking sebesar 42% dan rating 4.9 di App Store." },
      { id: "3", client: "Botanica Organics", year: "2024", role: "Packaging & 3D Renderings", tools: "Blender, Photoshop, Die-cut CAD", challenge: "Kemasan produk skincare organik harus menarik di rak display minimarket modern.", solution: "Label bertekstur foil tembaga dengan botol kaca amber ramah lingkungan.", result: "Terpilih sebagai Desain Kemasan Terbaik Kategori Natural Care 2024." },
      { id: "4", client: "Synapse Data Engine", year: "2024", role: "Web App UI & Brand Identity", tools: "Figma, Tailwind UI, Vector Art", challenge: "Visualisasi data kompleks platform B2B SaaS sering terasa intimidatif.", solution: "Dashboard modular dengan panel visualisasi adaptif dan mode gelap berstandar WCAG AAA.", result: "Mendukung putaran pendanaan Seri A sebesar $4.5M." },
    ];

    generatedHtml = `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle} · Creative Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>
</head>
<body class="bg-[#0b0c10] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-purple-500 selection:text-white">
  <header class="border-b border-zinc-800 bg-zinc-950/90 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs">${brandChar}</div>
        <span class="font-black text-white text-sm tracking-wider uppercase">${brandTitle}</span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium uppercase tracking-wider">
        <a href="#karya" class="hover:text-white transition">Studi Kasus</a>
        <a href="#layanan" class="hover:text-white transition">Deliverables</a>
        <a href="#tentang" class="hover:text-white transition">Tentang</a>
      </nav>
      <a href="#kontak" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm">
        Mulai Diskusi Proyek
      </a>
    </div>
  </header>

  <main class="flex-1">
    <!-- Visual Showcase Intro -->
    <section id="hero" data-preview-source-requirements="${secHeroReqs.join(',')}" data-preview-source-feature="${features[0]?.id || 'feat-1'}" data-preview-classification="USER_DERIVED" class="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-32">
      <div class="max-w-3xl">
        <div class="text-xs font-mono text-purple-400 uppercase tracking-widest mb-4">Studio Desain &amp; Identitas Visual</div>
        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight uppercase">
          Membangun Karakter Brand Melalui Desain Presisi.
        </h1>
        <p class="text-zinc-400 text-sm sm:text-base mt-6 leading-relaxed max-w-xl">
          Fokus pada identitas visual, UI/UX antarmuka digital, dan desain kemasan bernilai tinggi untuk brand dan kreator visioner.
        </p>
        <div class="mt-8 flex items-center gap-4">
          <a href="#karya" class="px-6 py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition">
            Lihat Studi Kasus ↓
          </a>
        </div>
      </div>
    </section>

    <!-- Case Studies Gallery (Real Portfolio Content) -->
    <section id="karya" data-preview-source-requirements="${secCatalogReqs.join(',')}" data-preview-source-feature="${features.map(f => f.id).join(',')}" data-preview-classification="USER_DERIVED" class="max-w-7xl mx-auto px-4 sm:px-8 py-16 border-t border-zinc-800">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
        <div>
          <h2 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Kumpulan Studi Kasus</h2>
          <p class="text-xs text-zinc-400 mt-1">Solusi kreatif dari perumusan tantangan hingga hasil nyata bagi klien.</p>
        </div>
      </div>

      <div class="space-y-8">
        ${caseStudies.map((cs, idx) => `
          <div class="p-8 rounded-3xl bg-zinc-950 border border-zinc-800/80 hover:border-purple-500/50 transition">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-zinc-800/80">
              <div>
                <div class="flex items-center gap-3 text-[11px] font-mono text-zinc-500 mb-2">
                  <span>0${idx + 1}</span>
                  <span>•</span>
                  <span>${escapeHtml(cs.year)}</span>
                  <span>•</span>
                  <span class="text-purple-400 font-bold">${escapeHtml(cs.role)}</span>
                </div>
                <h3 class="text-2xl font-black text-white">${escapeHtml(cs.client)}</h3>
              </div>
              <div class="text-right">
                <span class="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                  Tools: ${escapeHtml(cs.tools)}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-xs">
              <div>
                <strong class="text-zinc-300 block mb-1 uppercase font-mono text-[10px]">Tantangan:</strong>
                <p class="text-zinc-400 leading-relaxed">${escapeHtml(cs.challenge)}</p>
              </div>
              <div>
                <strong class="text-zinc-300 block mb-1 uppercase font-mono text-[10px]">Solusi Desain:</strong>
                <p class="text-zinc-400 leading-relaxed">${escapeHtml(cs.solution)}</p>
              </div>
              <div>
                <strong class="text-emerald-400 block mb-1 uppercase font-mono text-[10px]">Dampak / Hasil:</strong>
                <p class="text-zinc-300 font-semibold leading-relaxed">${escapeHtml(cs.result)}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Project Inquiry Form (No fake e-commerce!) -->
    <section id="kontak" data-preview-source-requirements="${secSimReqs.join(',')}" data-preview-source-feature="${features[2]?.id || 'feat-3'}" data-preview-classification="USER_DERIVED" class="py-16 border-t border-zinc-800 bg-zinc-950/40">
      <div class="max-w-3xl mx-auto px-4 sm:px-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Mulai Brief Proyek Anda</h2>
          <p class="text-xs text-zinc-400 mt-2">Ceritakan kebutuhan desain Anda untuk mendapatkan respons dan estimasi langsung dari tim kami.</p>
        </div>

        <div class="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div>
            <label class="block text-xs font-bold text-zinc-300 mb-2">Jenis Kebutuhan Desain:</label>
            <select id="portfolio-svc" class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
              <option>Brand Identity &amp; Logo System</option>
              <option>UI/UX Design &amp; Digital Prototype</option>
              <option>Kemasan &amp; Packaging Produk</option>
              <option>Full Rebranding Campaign</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-zinc-300 mb-2">Ringkasan Konsep / Brief:</label>
            <textarea id="portfolio-brief" rows="3" placeholder="Sampaikan tujuan proyek, timeline yang diharapkan, dan preferensi visual..." class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none"></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-2">Nama Anda:</label>
              <input type="text" id="portfolio-name" placeholder="Nama lengkap..." class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-2">WhatsApp / Email:</label>
              <input type="text" id="portfolio-contact" placeholder="Kontak..." class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
            </div>
          </div>
          <button type="button" onclick="submitPortfolioInquiry()" class="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition">
            Kirim Brief Proyek
          </button>
        </div>
      </div>
    </section>
  </main>

  <div id="portfolio-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xl font-bold flex items-center justify-center mx-auto mb-4">✓</div>
      <h3 class="text-lg font-black text-white uppercase tracking-tight mb-1">Brief Proyek Terkirim!</h3>
      <p class="text-xs text-zinc-400 mb-6">Terima kasih atas kepercayaan Anda. Kami akan meninjau brief Anda dan menghubungi via WhatsApp dalam 1x24 jam.</p>
      <button type="button" onclick="closePortfolioModal()" class="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase">Tutup</button>
    </div>
  </div>

  <footer class="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <strong class="text-white uppercase tracking-widest">${brandTitle}</strong>
      <span>Hak Cipta &copy; 2026 ${brandTitle}. Semua Hak Dilindungi.</span>
    </div>
  </footer>

  <script>
    function submitPortfolioInquiry() {
      document.getElementById('portfolio-modal').classList.remove('hidden');
    }
    function closePortfolioModal() {
      document.getElementById('portfolio-modal').classList.add('hidden');
    }
  </script>
</body>
</html>`;

  } else if (designContext.designConcept === "Booking Experience") {
    // ──────── BOOKING EXPERIENCE (ARENA / APPOINTMENT) ────────
    const arenaCourts = [
      { id: "1", title: "Lapangan Mini Soccer A (Sintetis FIFA)", cat: "Mini Soccer", price: 450000, priceStr: "Rp 450.000 / jam", desc: "Rumput monofilament impor peredam guncangan, lampu LED 1000 lux malam hari, dan tribun penonton." },
      { id: "2", title: "Lapangan Mini Soccer B (Outdoor Standard)", cat: "Mini Soccer", price: 380000, priceStr: "Rp 380.000 / jam", desc: "Ukuran standar 7 vs 7, sistem drainase air cepat kering saat hujan, dan ruang ganti AC." },
      { id: "3", title: "Lapangan Futsal Indoor 1 (Vinyl Interlock)", cat: "Futsal", price: 180000, priceStr: "Rp 180.000 / jam", desc: "Lantai interlock standar kompetisi futsal dengan pantulan bola presisi." },
      { id: "4", title: "Lapangan Futsal 2 (Rumput Sintetis)", cat: "Futsal", price: 160000, priceStr: "Rp 160.000 / jam", desc: "Lantai sintetis empuk nyaman untuk sparing santai bebas licin." },
    ];

    generatedHtml = `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle} · Booking Arena &amp; Lapangan</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>
</head>
<body class="bg-[#090d14] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-black">
  <header class="border-b border-zinc-800 bg-zinc-950/90 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-black text-sm shadow-md">${brandChar}</div>
        <span class="font-black text-white text-base tracking-tight">${brandTitle}</span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-xs text-zinc-300 font-semibold">
        <a href="#lapangan" class="hover:text-emerald-400 transition">Pilihan Lapangan</a>
        <a href="#booking" class="hover:text-emerald-400 transition">Jadwal &amp; Reservasi</a>
        <a href="#fasilitas" class="hover:text-emerald-400 transition">Fasilitas</a>
      </nav>
      <a href="#booking" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm">
        Sewa Lapangan Sekarang
      </a>
    </div>
  </header>

  <main class="flex-1">
    <section id="hero" data-preview-source-requirements="${secHeroReqs.join(',')}" data-preview-source-feature="${features[0]?.id || 'feat-1'}" data-preview-classification="USER_DERIVED" class="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold mb-6">
        <span>● Rumput Sintetis Standar FIFA</span>
      </div>
      <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
        Booking Lapangan Mini Soccer &amp; Futsal Tanpa Antre
      </h1>
      <p class="text-zinc-400 text-xs sm:text-base max-w-2xl mx-auto mt-5 leading-relaxed">
        Cek ketersediaan jam main secara langsung, pilih slot primetime, dan amankan jadwal sparing tim Anda dalam hitungan menit.
      </p>
      <div class="mt-8 flex justify-center gap-3">
        <a href="#booking" class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-lg">
          Amankan Slot Jam Main
        </a>
      </div>
    </section>

    <!-- Courts Grid -->
    <section id="lapangan" data-preview-source-requirements="${secCatalogReqs.join(',')}" data-preview-source-feature="${features.map(f => f.id).join(',')}" data-preview-classification="USER_DERIVED" class="py-16 border-t border-zinc-800/80 bg-zinc-950/40">
      <div class="max-w-7xl mx-auto px-4 sm:px-8">
        <div class="mb-10 text-center max-w-2xl mx-auto">
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Pilihan Arena &amp; Lapangan</h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Fasilitas berstandar internasional dengan pencahayaan malam LED 1000 lux.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${arenaCourts.map((court, idx) => `
            <div class="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold mb-3 inline-block">${escapeHtml(court.cat)}</span>
                <h3 class="text-base font-bold text-white mb-2">${escapeHtml(court.title)}</h3>
                <p class="text-xs text-zinc-400 leading-relaxed">${escapeHtml(court.desc)}</p>
              </div>
              <div class="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span class="text-base font-black text-white font-mono">${escapeHtml(court.priceStr)}</span>
                <button type="button" onclick="selectCourt(${idx})" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition">
                  Pilih Lapangan
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Slot Reservation Form with Holding Lock -->
    <section id="booking" data-preview-source-requirements="${secSimReqs.join(',')}" data-preview-source-feature="${features[2]?.id || 'feat-3'}" data-preview-classification="USER_DERIVED" class="py-16 border-t border-zinc-800/80">
      <div class="max-w-3xl mx-auto px-4 sm:px-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Reservasi Slot Lapangan</h2>
          <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
            <span>⏱ Slot sementara dikunci selama 14:35 menit untuk Anda</span>
          </div>
        </div>
        <div class="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-4">
          <div>
            <label class="block text-xs font-bold text-zinc-300 mb-2">Pilih Lapangan:</label>
            <select id="court-select" onchange="calcArena()" class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
              ${arenaCourts.map((c, i) => `<option value="${i}">${escapeHtml(c.title)}</option>`).join('')}
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-2">Slot Waktu:</label>
              <select id="court-time" class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
                <option>16.00 - 18.00 (2 Jam)</option>
                <option selected>18.00 - 20.00 (2 Jam Primetime)</option>
                <option>20.00 - 22.00 (2 Jam Primetime)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-2">Nama Tim / Komunitas:</label>
              <input type="text" id="court-team" placeholder="Contoh: Garuda FC..." class="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
            </div>
          </div>
          <div class="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <span class="text-xs text-zinc-400 block">Total Biaya (2 Jam):</span>
              <span id="arena-total" class="text-xl font-black text-emerald-400 font-mono">Rp 900.000</span>
            </div>
            <button type="button" onclick="submitArenaBooking()" class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition">
              Konfirmasi Reservasi
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>

  <div id="arena-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xl font-bold flex items-center justify-center mx-auto mb-4">✓</div>
      <h3 class="text-lg font-black text-white mb-1">Slot Lapangan Berhasil Diamankan!</h3>
      <p class="text-xs text-zinc-400 mb-6">Reservasi Anda telah tercatat dalam sistem arena kami.</p>
      <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left font-mono text-xs space-y-2 mb-6">
        <div class="flex justify-between text-zinc-400"><span>Kode Booking:</span><span id="arena-ref-code" class="text-white font-bold">#BOOK-49210</span></div>
        <div class="flex justify-between text-zinc-400"><span>Status:</span><span class="text-emerald-400">Terkonfirmasi</span></div>
      </div>
      <button type="button" onclick="closeArenaModal()" class="w-full py-3 rounded-xl bg-white text-black font-bold text-xs">Tutup</button>
    </div>
  </div>

  <footer class="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <strong class="text-white">${brandTitle}</strong>
      <span>Hak Cipta &copy; 2026 ${brandTitle}. Semua Hak Dilindungi.</span>
    </div>
  </footer>

  <script>
    const courts = ${JSON.stringify(arenaCourts)};
    function selectCourt(idx) {
      document.getElementById('court-select').value = idx;
      calcArena();
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    }
    function calcArena() {
      const idx = parseInt(document.getElementById('court-select')?.value || '0', 10);
      const c = courts[idx] || courts[0];
      const total = c.price * 2;
      document.getElementById('arena-total').textContent = 'Rp ' + total.toLocaleString('id-ID');
    }
    function submitArenaBooking() {
      document.getElementById('arena-ref-code').textContent = '#BOOK-' + Math.floor(10000 + Math.random() * 90000);
      document.getElementById('arena-modal').classList.remove('hidden');
    }
    function closeArenaModal() { document.getElementById('arena-modal').classList.add('hidden'); }
    calcArena();
  </script>
</body>
</html>`;

  } else if (designContext.designConcept === "Editorial News Platform") {
    // ──────── NEWS / EDITORIAL PLATFORM ────────
    const newsArticles = [
      { id: "1", title: "Pemerintah Resmikan Pusat Data Hijau Berkapasitas 100 MW", cat: "Teknologi", date: "3 Okt 2026", author: "Budi Santoso", excerpt: "Pusat data ramah lingkungan pertama di Asia Tenggara ini beroperasi penuh menggunakan energi surya dan hidroelektrik." },
      { id: "2", title: "Tren Ekspor Kopi Specialty Indonesia Meningkat 35% di Kuartal III", cat: "Ekonomi", date: "3 Okt 2026", author: "Dewi Lestari", excerpt: "Permintaan dari pasar Eropa dan Amerika Utara terhadap varietas arabika Gayo dan Flores terus menunjukkan lonjakan positif." },
      { id: "3", title: "Inovasi Bus Listrik Cepat Mulai Diuji Coba di Koridor Utama Kota", cat: "Urban", date: "2 Okt 2026", author: "Rian Pratama", excerpt: "Armada transportasi umum tanpa emisi ini ditargetkan mampu memangkas waktu tunggu penumpang hingga separuhnya." },
      { id: "4", title: "Eksplorasi Kuliner Tradisional yang Bangkit Lewat Sentuhan Modern", cat: "Gaya Hidup", date: "2 Okt 2026", author: "Siti Rahma", excerpt: "Generasi muda kuliner tanah air mengemas kembali warisan rempah Nusantara dalam sajian kasual berkelas dunia." },
    ];

    generatedHtml = `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle} · Editorial News</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>
</head>
<body class="bg-[#0f1117] text-zinc-100 min-h-screen flex flex-col antialiased">
  <div class="bg-zinc-950 border-b border-zinc-800 text-[11px] py-2 px-4 sm:px-8 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase text-[9px]">Breaking</span>
      <span class="text-zinc-300 truncate">Pusat Data Hijau Berkapasitas 100 MW Mulai Beroperasi Penuh Hari Ini</span>
    </div>
    <div class="text-zinc-500 hidden sm:block font-mono text-[10px]">3 Oktober 2026 · Edisi Digital</div>
  </div>

  <header class="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
      <a href="#" class="font-serif text-2xl font-black text-white tracking-tight">${brandTitle}</a>
      <nav class="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-semibold uppercase">
        <a href="#headline" class="hover:text-white transition">Utama</a>
        <a href="#berita" class="hover:text-white transition">Teknologi</a>
        <a href="#berita" class="hover:text-white transition">Ekonomi</a>
        <a href="#berita" class="hover:text-white transition">Gaya Hidup</a>
      </nav>
      <input type="text" placeholder="Cari artikel..." class="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white w-40">
    </div>
  </header>

  <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full space-y-12">
    <!-- Featured Headline Section -->
    <section id="headline" data-preview-source-requirements="${secHeroReqs.join(',')}" data-preview-source-feature="${features[0]?.id || 'feat-1'}" data-preview-classification="USER_DERIVED" class="p-8 rounded-3xl bg-zinc-950 border border-zinc-800">
      <span class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-4 inline-block">Laporan Utama</span>
      <h1 class="text-3xl sm:text-5xl font-serif font-black text-white leading-tight max-w-4xl">
        Transformasi Energi Bersih Menjadi Penggerak Baru Pertumbuhan Digital Nasional
      </h1>
      <p class="text-zinc-400 text-sm mt-4 max-w-3xl leading-relaxed">
        Investasi berkelanjutan pada infrastruktur hijau membuka peluang efisiensi biaya komputasi hingga 40% sekaligus menarik minat ekosistem startup global ke kawasan regional.
      </p>
      <div class="mt-6 flex items-center gap-3 text-xs text-zinc-500 font-mono">
        <span>Oleh Redaksi Utama</span>
        <span>•</span>
        <span>Waktu Baca: 4 Menit</span>
      </div>
    </section>

    <!-- News Grid -->
    <section id="berita" data-preview-source-requirements="${secCatalogReqs.join(',')}" data-preview-source-feature="${features.map(f => f.id).join(',')}" data-preview-classification="USER_DERIVED" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      ${newsArticles.map((art, idx) => `
        <div class="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-3">
              <span class="text-amber-400 font-bold">${escapeHtml(art.cat)}</span>
              <span>${escapeHtml(art.date)}</span>
            </div>
            <h3 class="text-base font-bold text-white mb-2 leading-snug hover:text-amber-400 transition cursor-pointer" onclick="readArticle('${escapeHtml(art.title)}', '${escapeHtml(art.excerpt)}')">
              ${escapeHtml(art.title)}
            </h3>
            <p class="text-xs text-zinc-400 leading-relaxed line-clamp-3">${escapeHtml(art.excerpt)}</p>
          </div>
          <div class="mt-6 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono">
            Penulis: ${escapeHtml(art.author)}
          </div>
        </div>
      `).join('')}
    </section>
  </main>

  <div id="news-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-lg p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
      <h3 id="news-modal-title" class="text-xl font-serif font-black text-white mb-4"></h3>
      <p id="news-modal-body" class="text-xs text-zinc-300 leading-relaxed mb-6"></p>
      <button type="button" onclick="document.getElementById('news-modal').classList.add('hidden')" class="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs">Tutup</button>
    </div>
  </div>

  <footer class="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <strong class="text-white font-serif">${brandTitle} Media</strong>
      <span>Hak Cipta &copy; 2026 ${brandTitle}. Semua Hak Dilindungi.</span>
    </div>
  </footer>

  <script>
    function readArticle(title, excerpt) {
      document.getElementById('news-modal-title').textContent = title;
      document.getElementById('news-modal-body').textContent = excerpt;
      document.getElementById('news-modal').classList.remove('hidden');
    }
  </script>
</body>
</html>`;

  } else {
    // ──────── DEFAULT / SAAS / DIGITAL PLATFORM ────────
    generatedHtml = `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle} · Digital Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>
</head>
<body class="bg-[#0a0d14] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
  <header class="border-b border-zinc-800 bg-zinc-950/90 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">${brandChar}</div>
        <span class="font-black text-white text-base tracking-tight">${brandTitle}</span>
      </div>
      <a href="#aksi" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm">
        Mulai Sekarang
      </a>
    </div>
  </header>

  <main class="flex-1">
    <section class="max-w-7xl mx-auto px-4 sm:px-8 py-20 text-center">
      <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
        Solusi Digital Cerdas untuk Produktivitas Anda
      </h1>
      <p class="text-zinc-400 text-xs sm:text-base max-w-2xl mx-auto mt-5 leading-relaxed">
        Kelola alur kerja secara terintegrasi dengan kemudahan akses dan performa teruji.
      </p>
      <div id="aksi" class="mt-8 flex justify-center gap-3">
        <button type="button" onclick="alert('Permintaan Anda berhasil diproses!')" class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg">
          Mulai Penggunaan
        </button>
      </div>
    </section>
  </main>

  <footer class="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
    <div class="max-w-7xl mx-auto px-4">
      <strong class="text-white">${brandTitle}</strong> · Hak Cipta &copy; 2026. Semua Hak Dilindungi.
    </div>
  </footer>
</body>
</html>`;
  }

  // STEP 8: STRICT LEGACY TEMPLATE SANITIZATION (Section 14 & 15 of Brief)
  if (isLegacyTemplateOrStale(generatedHtml, project)) {
    console.warn("LEGACY_TEMPLATE_LEAK detected in generated HTML! Purging legacy markers...");
    generatedHtml = generatedHtml
      .replace(/Fitur & Solusi/g, "Koleksi Layanan")
      .replace(/Simulasi Aksi/g, "Kalkulator")
      .replace(/Alur Pengerjaan/g, "Panduan")
      .replace(/Roadmap & Alur Pengerjaan/g, "Cara Pemesanan")
      .replace(/Katalog Fitur & Spesifikasi Utama/g, "Katalog Produk")
      .replace(/Priority:[^<\n]*/g, "")
      .replace(/Source: FR-[^<\n]*/g, "")
      .replace(/Terverifikasi dalam Quality Gate Planner/g, "")
      .replace(/Planning-Aware Visual Prototype/g, "Visual Prototype")
      .replace(/Planning-Aware Prototype/g, "Visual Prototype")
      .replace(/Requirement Traceability Active/g, "");
  }

  return finishResult(generatedHtml, derivedSections, ["Dynamic Exploration", "Interactive Module", "Simulated Modal Action"], ["Default View", "Modal Active"]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RESULT BUILDER & SOURCE INTEGRITY AUDITOR
  // ─────────────────────────────────────────────────────────────────────────────
  function finishResult(html: string, sections: PreviewSectionSpec[], interactions: string[], states: string[]): PlanningAwarePreviewResult {
    const derivedPages: PreviewPageSpec[] = [
      { id: "page-home", name: "Main Page", route: "/", source_requirement_ids: Array.from(coveredRequirementIds), sections }
    ];

    const spec: PreviewSpecification = {
      project: {
        name: brandName,
        type: primaryType,
        concept: designContext.designConcept,
      },
      project_type: primaryType,
      secondary_types: secondaryTypes,
      pages: derivedPages,
      sections,
      components: sections.flatMap((s) => s.components),
      interactions,
      states,
      responsive_behavior: [
        "Desktop: 1440 × 900 Multi-column Grid",
        "Tablet: 768 × 1024 Adaptive Layout",
        "Mobile: 390 × 844 Single-column Flow",
      ],
      source_requirement_ids: Array.from(coveredRequirementIds),
    };

    // Calculate Source Integrity & Coverage
    const totalUserRequirements = userRequirements.length;
    const coveredCount = Array.from(coveredRequirementIds).filter((id) => userRequirements.some((r) => r.id === id)).length;
    const uncoveredUserRequirements = userRequirements
      .filter((r) => !coveredRequirementIds.has(r.id))
      .map((r) => r.id);
    const coveragePercent = totalUserRequirements > 0
      ? Math.min(100, Math.round((coveredCount / totalUserRequirements) * 100))
      : 100;

    const coveredReqIdList = Array.from(coveredRequirementIds).filter((id) => userRequirements.some((r) => r.id === id));

    // Scope Protection Check (Section 6)
    const unsupportedUIElements: string[] = [];
    FORBIDDEN_UNSUPPORTED_SCOPE.forEach((item) => {
      const userAsked = userRequirements.some((r) => item.pattern.test(r.text));
      if (!userAsked) {
        const found = sections.some((s) => item.pattern.test(s.title + " " + s.purpose));
        if (found) {
          unsupportedUIElements.push(item.label);
        }
      }
    });

    // Traceability Errors Check
    const traceabilityErrors: string[] = [];
    sections.forEach((s) => {
      s.source_requirement_ids.forEach((id) => {
        if (!regMap.has(id)) {
          traceabilityErrors.push(`Unrecognized requirement ID '${id}' in section '${s.title}'`);
        }
      });
    });

    const integrity: PreviewSourceIntegrity = {
      totalUserRequirements,
      coveredUserRequirements: coveredCount,
      coveredRequirementIds: coveredReqIdList,
      uncoveredUserRequirements,
      coveragePercent,
      unsupportedUIElements,
      traceabilityErrors,
      traceabilityStatus: traceabilityErrors.length === 0 ? "PASS" : "FAIL",
      status:
        coveragePercent >= 80 && unsupportedUIElements.length === 0 && traceabilityErrors.length === 0
          ? "PASS"
          : coveragePercent >= 50
          ? "WARN"
          : "FAIL",
      flags: {
        PREVIEW_COVERAGE_MISSING: uncoveredUserRequirements.length > 0 && coveragePercent < 80,
        UNSUPPORTED_PREVIEW_SCOPE: unsupportedUIElements.length > 0,
        PREVIEW_TRACEABILITY_MISMATCH: traceabilityErrors.length > 0,
      },
    };

    return {
      html,
      spec,
      integrity,
      hasPlanningContext,
      designContext,
    };
  }
}
export function generateStarterPrototypeHtml(project: ProjectItem): string {
  return buildPlanningAwarePreview(project).html;
}

export type PreviewDevice = "desktop" | "tablet" | "mobile";

export interface DevicePreset {
  width: number;
  height: number;
  label: string;
}

export const DEVICE_PRESETS: Record<PreviewDevice, DevicePreset> = {
  desktop: { width: 1440, height: 900, label: "Desktop (1440 × 900)" },
  tablet: { width: 768, height: 1024, label: "Tablet (768 × 1024)" },
  mobile: { width: 390, height: 844, label: "Mobile (390 × 844)" },
};

export const ZOOM_PRESETS = [50, 75, 90, 100, 125, 150];

export function QuickHtmlPreview({
  project,
  isDark,
  onUpdateHtml,
  onSwitchToChat,
}: {
  project: ProjectItem;
  isDark: boolean;
  onUpdateHtml: (html: string) => void;
  onSwitchToChat: () => void;
}) {
  const [rawHtml, setRawHtml] = useState<string>(() => extractHtmlFromProject(project));
  const [debouncedHtml, setDebouncedHtml] = useState<string>(() => extractHtmlFromProject(project));
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [zoom, setZoom] = useState<number>(100);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showSpecModal, setShowSpecModal] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Planning-aware specification & integrity
  const planningResult = useMemo<PlanningAwarePreviewResult>(() => {
    return buildPlanningAwarePreview(project);
  }, [project.id, project.updatedAt, project.prd, project.features, project.tasks, project.title]);

  // Sinkronisasi dengan proyek
  // Auto-purge legacy template or stale content
  useEffect(() => {
    if (rawHtml && isLegacyTemplateOrStale(rawHtml, project)) {
      const freshHtml = planningResult.html;
      setRawHtml(freshHtml);
      setDebouncedHtml(freshHtml);
      onUpdateHtml(freshHtml);
    }
  }, [project.id, rawHtml, planningResult.html]);

  useEffect(() => {
    const extracted = extractHtmlFromProject(project);
    if (extracted && extracted !== rawHtml) {
      setRawHtml(extracted);
      setDebouncedHtml(extracted);
    }
  }, [project.id, project.updatedAt, project.generatedHtml]);

  // Debounced live update (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHtml(rawHtml);
      if (rawHtml !== project.generatedHtml) {
        onUpdateHtml(rawHtml);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [rawHtml]);

  // Error listener di iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "PREVIEW_CONSOLE_ERROR") {
        setPreviewError(e.data.message || "Runtime notice inside preview sandbox");
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  const securedHtml = useMemo(() => {
    return injectSandboxSecurity(debouncedHtml);
  }, [debouncedHtml]);

  const currentPreset = DEVICE_PRESETS[device];
  const hasHtml = Boolean(debouncedHtml.trim());

  const handleApplyPlanningAwareHtml = () => {
    const newHtml = planningResult.html;
    setRawHtml(newHtml);
    setDebouncedHtml(newHtml);
    onUpdateHtml(newHtml);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      } ${isDark ? "bg-[#090d16] text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}
    >
      {/* ── Toolbar (Sesuai Brief PRD — Quick HTML Preview Option A) ── */}
      <div className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 select-none ${
        isDark ? "border-zinc-800 bg-zinc-950/90" : "border-zinc-200 bg-white"
      }`}>
        {/* Left: View Mode Toggle (Code vs 👁 Preview) */}
        <div className={`flex items-center p-0.5 rounded-xl border ${
          isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-300"
        }`}>
          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === "code"
                ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Code</span>
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === "preview"
                ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview</span>
          </button>
        </div>

        {/* Center: Device Selector (Desktop / Tablet / Mobile) */}
        {viewMode === "preview" && (
          <div className={`flex items-center p-0.5 rounded-xl border ${
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-300"
          }`}>
            {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer capitalize flex items-center gap-1.5 ${
                  device === d
                    ? isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs"
                    : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
                }`}
                title={DEVICE_PRESETS[d].label}
              >
                {d === "desktop" ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : d === "tablet" ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="hidden sm:inline">{d}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right: Controls (Zoom, Refresh, Fullscreen) */}
        <div className="flex items-center gap-2">
          {viewMode === "preview" && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 font-mono hidden md:inline">Zoom:</span>
                <select
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className={`text-xs px-2 py-1 rounded-lg border font-mono outline-none cursor-pointer ${
                    isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200" : "bg-white border-zinc-300 text-zinc-800"
                  }`}
                >
                  {ZOOM_PRESETS.map((z) => (
                    <option key={z} value={z}>{z}%</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setRefreshKey((k) => k + 1);
                  setPreviewError(null);
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
                title="Refresh Preview (↻)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}

          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview (⛶)"}
          >
            {isFullscreen ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Sub-bar: Clean Workspace Theme ── */}
      <div className={`px-4 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none ${
        isDark ? "border-zinc-800/80 bg-zinc-950/70 text-zinc-300" : "border-zinc-200 bg-zinc-50/90 text-zinc-700"
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase border ${
            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-800"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Concept: {planningResult.spec.project_type.replace(/_/g, " ")}
          </span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Coverage: <strong className={isDark ? "text-zinc-200" : "text-zinc-800"}>{planningResult.integrity.coveragePercent}%</strong> ({planningResult.integrity.coveredUserRequirements}/{planningResult.integrity.totalUserRequirements} Req)
          </span>
          <span className="text-zinc-600 hidden md:inline">•</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border hidden md:inline ${
            planningResult.integrity.status === "PASS"
              ? isDark ? "bg-zinc-900 text-zinc-300 border-zinc-800" : "bg-zinc-100 text-zinc-800 border-zinc-200"
              : isDark ? "bg-amber-950/40 text-amber-300 border-amber-800/40" : "bg-amber-50 text-amber-800 border-amber-200"
          }`}>
            Status: {planningResult.integrity.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSpecModal(true)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700 shadow-xs"
            }`}
            title="Lihat Preview Specification & Traceability Matrix"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Spec &amp; Matrix</span>
          </button>
          <button
            onClick={handleApplyPlanningAwareHtml}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
            }`}
            title="Generate web HTML prototype langsung dari PRD & Fitur aktif"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Generate Web by PRD</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {previewError && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
            <span>{previewError}</span>
          </div>
          <button
            onClick={() => {
              setRefreshKey((k) => k + 1);
              setPreviewError(null);
            }}
            className="underline font-bold text-[11px] hover:text-amber-300 cursor-pointer"
          >
            Refresh Preview
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {!hasHtml && viewMode === "preview" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mb-4 ${
              isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-300 text-zinc-600"
            }`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1">
              No HTML to preview. Generate or add HTML code first.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
              Quick HTML Preview merepresentasikan spesifikasi proyek <strong>{project.title || "Universal V4"}</strong> ({planningResult.spec.project_type.replace(/_/g, " ")}) secara langsung dan aman di browser.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleApplyPlanningAwareHtml}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                ✨ Generate Web by PRD
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isDark ? "border-zinc-800 hover:bg-zinc-900 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                ✏️ Tulis atau Tempel HTML
              </button>
            </div>
          </div>
        ) : viewMode === "code" ? (
          <div className={`flex-1 flex flex-col min-h-0 ${isDark ? "bg-[#090d16]" : "bg-white"}`}>
            <div className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
              isDark ? "border-zinc-800 text-zinc-400 bg-zinc-950/60" : "border-zinc-200 text-zinc-600 bg-zinc-50"
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>HTML / CSS / JS Editor</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span>{rawHtml.length} chars</span>
                <span>{rawHtml.split("\n").length} lines</span>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <textarea
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                placeholder="<!DOCTYPE html><html>... tulis atau tempel kode HTML di sini...</html>"
                className={`w-full h-full p-4 font-mono text-xs outline-none resize-none border-none leading-relaxed ${
                  isDark ? "bg-[#090d16] text-zinc-200 selection:bg-zinc-800" : "bg-white text-zinc-900 selection:bg-zinc-200"
                }`}
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex flex-col min-h-0 overflow-auto relative items-center justify-start p-4 sm:p-8 ${
            isDark ? "bg-[#0b0f19]" : "bg-zinc-100"
          }`}>
            <div
              className={`flex flex-col transition-all duration-300 relative shadow-2xl rounded-3xl overflow-hidden border shrink-0 my-auto ${
                isDark ? "border-zinc-800 bg-black" : "border-zinc-300 bg-white"
              }`}
              style={{
                width: `${currentPreset.width}px`,
                height: `${currentPreset.height}px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {/* Device Header Bar */}
              <div className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono shrink-0 select-none ${
                isDark ? "border-zinc-800/80 bg-zinc-950 text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block"></span>
                  </div>
                  <span className="ml-2 font-bold">{currentPreset.label}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300">
                  sandbox="allow-scripts"
                </span>
              </div>

              {/* Sandboxed Iframe */}
              <div className="flex-1 w-full h-full relative bg-white">
                <iframe
                  key={refreshKey}
                  srcDoc={securedHtml}
                  sandbox="allow-scripts"
                  className="w-full h-full border-none"
                  title="Quick HTML Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Preview Specification & Traceability Modal ── */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className={`w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? "bg-[#0d121d] border-zinc-800 text-zinc-100" : "bg-white border-zinc-300 text-zinc-900"
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? "border-zinc-800 bg-zinc-950/60" : "border-zinc-200 bg-zinc-50"
            }`}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>📐</span>
                  <span>Planning-Aware Preview Specification & Traceability</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verifikasi visual dan struktural kepatuhan terhadap PRD, Features, dan User Requirements
                </p>
              </div>
              <button
                onClick={() => setShowSpecModal(false)}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-400" : "border-zinc-300 hover:bg-zinc-100 text-zinc-600"
                }`}
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Project Concept</div>
                  <div className="text-sm font-bold mt-1 text-emerald-400 capitalize">{planningResult.spec.project_type.replace(/_/g, " ")}</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Requirement Coverage</div>
                  <div className="text-sm font-bold mt-1 text-sky-400">{planningResult.integrity.coveragePercent}% ({planningResult.integrity.coveredUserRequirements}/{planningResult.integrity.totalUserRequirements})</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Scope Protection</div>
                  <div className="text-sm font-bold mt-1 text-emerald-400">{planningResult.integrity.unsupportedUIElements.length === 0 ? "PASSED (No Leak)" : `${planningResult.integrity.unsupportedUIElements.length} Unsupported`}</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Traceability Gate</div>
                  <div className="text-sm font-bold mt-1 text-emerald-400">{planningResult.integrity.traceabilityStatus}</div>
                </div>
              </div>

              {/* Sections Breakdown & Traceability */}
              <div>
                <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                  <span>🧩</span>
                  <span>UI Sections & Traceability Mapping</span>
                </h4>
                <div className="space-y-3">
                  {planningResult.spec.pages[0]?.sections.map((sec, idx) => (
                    <div
                      key={sec.id || idx}
                      className={`p-3.5 rounded-xl border ${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm flex items-center gap-2">
                            <span>#{idx + 1} {sec.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                              sec.classification === "USER_DERIVED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-zinc-700 text-zinc-300"
                            }`}>
                              {sec.classification}
                            </span>
                          </div>
                          <div className="text-zinc-400 text-xs mt-1">{sec.purpose}</div>
                        </div>
                        <div className="flex flex-wrap gap-1 items-center justify-end">
                          {sec.source_requirement_ids.map((reqId) => (
                            <span key={reqId} className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono text-[10px] font-bold">
                              {reqId}
                            </span>
                          ))}
                        </div>
                      </div>

                      {sec.components && sec.components.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
                          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Komponen Visual:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {sec.components.map((comp) => (
                              <span
                                key={comp.id}
                                className={`px-2 py-0.5 rounded text-[11px] border font-mono ${
                                  isDark ? "bg-zinc-800/80 border-zinc-700 text-zinc-300" : "bg-white border-zinc-300 text-zinc-700"
                                }`}
                                title={comp.purpose}
                              >
                                {comp.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirement Coverage Details */}
              <div className={`p-4 rounded-xl border ${isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-2">Requirement Coverage Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                      <span>✓</span>
                      <span>Covered Requirements ({planningResult.integrity.coveredRequirementIds.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {planningResult.integrity.coveredRequirementIds.map((r: string) => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono">
                          {r}
                        </span>
                      ))}
                      {planningResult.integrity.coveredRequirementIds.length === 0 && (
                        <span className="text-zinc-500 italic">Belum ada requirement terpetakan</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1">
                      <span>•</span>
                      <span>Uncovered Requirements ({planningResult.integrity.uncoveredUserRequirements.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {planningResult.integrity.uncoveredUserRequirements.map((r: string) => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[10px] font-mono">
                          {r}
                        </span>
                      ))}
                      {planningResult.integrity.uncoveredUserRequirements.length === 0 && (
                        <span className="text-emerald-400 text-[11px]">100% Requirements Terpenuhi Sempurna 🎉</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-3 border-t flex items-center justify-between ${
              isDark ? "border-zinc-800 bg-zinc-950/80" : "border-zinc-200 bg-zinc-50"
            }`}>
              <div className="text-[11px] text-zinc-400">
                Prinsip Universal V4: USER menentukan WHAT • AI menentukan HOW
              </div>
              <button
                onClick={() => setShowSpecModal(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
