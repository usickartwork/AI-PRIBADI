"use client";

import { useState, useEffect, useRef } from "react";
import { MarkdownMessage } from "./MarkdownMessage";

export type TaskStatus = "todo" | "in_progress" | "done" | "failed";

export type ProjectTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  feature?: string;
  phase?: string;
  acceptanceCriteria?: string[];
};

export type ProjectFeature = {
  id: string;
  name: string;
  description: string;
  priority?: "High" | "Medium" | "Low";
  dependencies?: string[];
  subFeatures?: string[];
};

export type ProjectPRD = {
  overview?: string;
  problemStatement?: string;
  goals?: string[];
  targetUsers?: string[];
  userStories?: string[];
  functionalRequirements?: string[];
  nonFunctionalRequirements?: string[];
  constraints?: string[];
  successCriteria?: string[];
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

Silakan tinjau **Peta Rencana (Mindmap)** atau **PRD Document** di atas.`,
        createdAt: Date.now() - 86400000 * 3 + 2000,
      },
    ],
    prd: {
      overview: "Platform web terintegrasi untuk reservasi lapangan mini soccer secara real-time, mempermudah penyewa menemukan jadwal kosong dan membantu pemilik lapangan memantau pembayaran dan okupansi secara otomatis.",
      problemStatement: "Pemesanan lapangan via chat manual rawan bentrok jadwal (double booking), bukti transfer palsu, dan pencatatan manual yang lambat bagi pengelola.",
      goals: [
        "Menghilangkan bentrok jadwal pemesanan lapangan hingga 0%",
        "Mempercepat proses reservasi dari 15 menit menjadi < 2 menit",
        "Menyediakan dashboard rekap keuangan otomatis bagi pengelola studio / lapangan",
      ],
      targetUsers: [
        "Penyewa Lapangan (Tim Mini Soccer / Mahasiswa / Komunitas)",
        "Pengelola Lapangan (Admin kasir & Supervisor)",
        "Owner Lapangan (Melihat laporan omset)",
      ],
      userStories: [
        "Sebagai pemain, saya ingin melihat jadwal lapangan yang kosong hari ini agar bisa langsung reservasi.",
        "Sebagai penyewa, saya ingin membayar via QRIS/VA agar reservasi saya langsung terkunci otomatis.",
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
        "Desain responsif dioptimalkan untuk perangkat mobile",
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
        description: "Panel admin untuk mengelola tarif, jadwal off-line, dan laporan keuangan.",
        priority: "Medium",
        dependencies: ["User & Role Authentication"],
        subFeatures: ["Rekap transaksi harian/bulanan", "Manual booking entry (walk-in)", "Manajemen harga & promo"],
      },
    ],
    userFlow: "1. Landing Page → 2. Pilih Lapangan & Tanggal → 3. Pilih Slot Jam yang Kosong → 4. Login / Isi Kontak → 5. Bayar via QRIS/VA → 6. Konfirmasi Tiket & Notifikasi WA → 7. Check-in di Lapangan",
    architecture: {
      frontend: "Next.js 15 (App Router), Tailwind CSS, Lucide Icons",
      backend: "Next.js Server Actions & API Routes, Node.js",
      database: "PostgreSQL (Supabase) dengan Row Level Security (RLS)",
      auth: "Supabase Auth (Google OAuth & Magic Link)",
      storage: "Supabase Storage (Bukti transaksi & aset)",
      api: "REST API & Server Actions dengan Zod validation",
      thirdParty: ["Midtrans / Xendit (Payment Gateway)", "Fonnte / WhatsApp Gateway"],
      deployment: "Vercel",
      security: "HTTPS, Rate limiting, Webhook signature verification, Database RLS policies",
      dataSchema: `CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, name VARCHAR(100) NOT NULL, role VARCHAR(20) DEFAULT 'customer', phone VARCHAR(30), created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE fields (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(150) NOT NULL, type VARCHAR(50) NOT NULL, hourly_rate NUMERIC(12,2) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE bookings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, field_id UUID REFERENCES fields(id), date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, status VARCHAR(30) DEFAULT 'pending', total_amount NUMERIC(12,2) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE, method VARCHAR(50) NOT NULL, amount NUMERIC(12,2) NOT NULL, status VARCHAR(30) DEFAULT 'unpaid', paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());`,
    },
    tasks: [
      {
        id: "task-1",
        title: "Setup Next.js & Supabase Database Schema",
        description: "Inisialisasi project, pasang Tailwind CSS, konfigurasi Supabase client dan buat tabel fields, bookings, payments.",
        status: "done",
        feature: "Database & Setup",
        phase: "Phase 1 - Foundation",
      },
      {
        id: "task-2",
        title: "Implementasi Autentikasi Penyewa & Admin",
        description: "Buat halaman login, signup, dan middleware proteksi rute untuk halaman admin.",
        status: "done",
        feature: "User & Role Authentication",
        phase: "Phase 1 - Foundation",
      },
      {
        id: "task-3",
        title: "Komponen Kalender & Slot Jadwal Real-time",
        description: "Render jadwal jam 08.00 - 24.00, beri indikator ketersediaan slot.",
        status: "in_progress",
        feature: "Real-time Field Schedule & Booking",
        phase: "Phase 2 - Core Booking",
      },
      {
        id: "task-4",
        title: "Integrasi Webhook Payment Gateway (QRIS)",
        description: "Koneksikan API Midtrans/Xendit untuk menghasilkan QRIS dan tangani webhook sukses bayar.",
        status: "in_progress",
        feature: "Payment Gateway Integration",
        phase: "Phase 2 - Core Booking",
      },
      {
        id: "task-5",
        title: "Dashboard Rekap Omset & Manajemen Lapangan",
        description: "Halaman admin untuk melihat grafik pendapatan dan penyesuaian harga khusus.",
        status: "todo",
        feature: "Admin Management Dashboard",
        phase: "Phase 3 - Management",
      },
    ],
  },
];

type CodeWorkspaceProps = {
  isDark: boolean;
  onClose: () => void;
};

// Mode tampilan workspace (Menyesuaikan gambar referensi ngodingpakai)
type WorkspaceView = "mindmap" | "prd_doc" | "chat" | "tasks";

export function CodeWorkspace({ isDark, onClose }: CodeWorkspaceProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<WorkspaceView>("mindmap");
  const [selectedDocSection, setSelectedDocSection] = useState<string>("overview");
  const [isPerencanaanDrawerOpen, setIsPerencanaanDrawerOpen] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // New Project Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Discovery Questions State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Save projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {}
  }, [projects]);

  // FIX: Bersihkan otomatis pesan kosong atau macet loading lama saat membuka project
  useEffect(() => {
    if (!isChatLoading && activeProject) {
      const hasEmptyAssistant = activeProject.messages.some(
        (m) => m.role === "assistant" && !m.content.trim()
      );
      if (hasEmptyAssistant) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeProject.id
              ? {
                  ...p,
                  messages: p.messages.map((m) =>
                    m.role === "assistant" && !m.content.trim()
                      ? {
                          ...m,
                          content:
                            "> **Blueprint Proyek Telah Dibuat:** Spesifikasi PRD, fitur hierarkis, arsitektur teknis, dan papan task board telah otomatis diperbarui. Silakan tinjau pada menu **Peta Rencana (Mindmap)** atau **PRD Document**.",
                        }
                      : m
                  ),
                }
              : p
          )
        );
      }
    }
  }, [isChatLoading, activeProject]);

  // Auto scroll chat
  useEffect(() => {
    if (viewMode === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeProject?.messages, isChatLoading, viewMode]);

  const showCopyToast = (label: string) => {
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

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

    const messageText = `Berikut klarifikasi kebutuhan proyek yang telah saya tentukan:\n${entries.join("\n")}\n\nTolong langsung buatkan Blueprint lengkap (PRD, Fitur, Arsitektur DDL, dan Tasks) sekarang!`;
    handleSendChatMessage(messageText);
    setSelectedAnswers({});
    setCustomInputs({});
    setShowCustomInput({});
  };

  // ── Domain Detection & High-Fidelity Domain Blueprint Generators ──────────────────
  interface DetectedDomain {
    isPhotography: boolean;
    topicName: string;
  }

  const detectProjectDomain = (messages: ProjectChatMessage[], title: string, desc?: string): DetectedDomain => {
    const combined = (
      title + " " + (desc || "") + " " +
      messages.map((m) => m.content).join(" ")
    ).toLowerCase();

    const isPhotography = /fotograf|photo|kamera|photoshoot|fotografer|studio foto|wedding photo|portrait|prewedding|retouch|lensa|album foto/.test(combined);
    if (isPhotography) {
      return { isPhotography: true, topicName: "Web Portofolio & Pemesanan Jasa Fotografi Profesional" };
    }
    
    if (/futsal|lapangan|badminton|booking olahraga|jadwal main/.test(combined)) {
      return { isPhotography: false, topicName: "Aplikasi Reservasi & Booking Lapangan Olahraga" };
    }

    if (/laundry|cuci|kiloan|dry clean/.test(combined)) {
      return { isPhotography: false, topicName: "Sistem Kasir & Manajemen Antrean Laundry" };
    }

    if (/toko|olshop|ecommerce|belanja|checkout barang/.test(combined)) {
      return { isPhotography: false, topicName: "Platform E-Commerce & Toko Online Interaktif" };
    }

    return {
      isPhotography: false,
      topicName: title.toLowerCase().includes("coba") ? "Platform Web & Aplikasi Digital" : title
    };
  };

  const getDomainBlueprint = (domain: DetectedDomain, title: string) => {
    if (domain.isPhotography) {
      return {
        prd: {
          overview: "Platform website komprehensif untuk studio fotografi profesional yang menggabungkan showcase portofolio interaktif resolusi tinggi, sistem reservasi jadwal pemotretan multi-fotografer & studio, portal client proofing eksklusif ber-watermark untuk seleksi foto, serta pengiriman hasil akhir foto resolusi tinggi secara digital dengan pembayaran bertahap (DP 50% & Pelunasan).",
          problemStatement: "Fotografer dan studio foto sering menghadapi inefisiensi penjadwalan manual, double-booking sesi photoshoot, seleksi foto mentah yang berantakan via chat pesan instan, dan resiko finansial akibat penagihan pelunasan yang tidak terstruktur sebelum foto resolusi tinggi diserahkan.",
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
            "Aksesibilitas & UI: Desain modern estetis, bersih, mobile-first, dan bebas clutter agar fokus pada keindahan karya fotografi"
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
        userFlow: "1. Landing Page Portofolio Fotografi -> 2. Filter Kategori Karya & Pilih Paket Foto -> 3. Cek Ketersediaan Kalender & Pilih Jam Sesi Pemotretan -> 4. Isi Form Konsep Pemotretan & Data Kontak -> 5. Bayar DP 50% Otomatis (QRIS / VA) -> 6. Konfirmasi Jadwal & Reminder Otomatis via WhatsApp -> 7. Sesi Pemotretan Berlangsung (Studio / Outdoor) -> 8. Tim Unggah Foto Mentah Ber-watermark ke Client Proofing Portal -> 9. Klien Akses Private Link & Menandai Foto Pilihan untuk Retouching -> 10. Tim Retouch Foto & Terbitkan Invoice Pelunasan -> 11. Klien Melunasi Sisa Tagihan -> 12. Klien Mengunduh Foto High-Resolution Final (ZIP / Cloud Storage)",
        tasks: [
          { id: "task-photo-1", title: "Setup Next.js 15 App Router & Database PostgreSQL Supabase", description: "Inisialisasi project, pasang Tailwind CSS, TypeScript, Lucide Icons, dan setup koneksi Supabase client.", status: "todo" as const, feature: "Setup & Fondasi", phase: "Phase 1 - Inisialisasi" },
          { id: "task-photo-2", title: "Migrasi Skema Database: Fotografer, Paket, Bookings, Proofing Gallery & Payments", description: "Menjalankan migrasi DDL SQL lengkap dengan tabel relasional, foreign keys, dan index.", status: "todo" as const, feature: "Setup & Fondasi", phase: "Phase 1 - Inisialisasi" },
          { id: "task-photo-3", title: "Implementasi Landing Page & Masonry Portfolio Grid dengan Lightbox EXIF", description: "Membangun tampilan galeri foto responsif dengan modal lightbox dan pembacaan EXIF data kamera.", status: "todo" as const, feature: "Showcase Portofolio", phase: "Phase 2 - Showcase" },
          { id: "task-photo-4", title: "Sistem Filter Kategori Portofolio & Showcase Testimoni Klien", description: "Filter interaktif (Wedding, Prewedding, Portrait, Commercial) dan ulasan klien terverifikasi.", status: "todo" as const, feature: "Showcase Portofolio", phase: "Phase 2 - Showcase" },
          { id: "task-photo-5", title: "Komponen Kalender Interaktif & Pemilihan Slot Jadwal Sesi Pemotretan", description: "Kalender visual ketersediaan fotografer & studio dengan proteksi pencegahan bentrok jadwal.", status: "todo" as const, feature: "Booking Engine", phase: "Phase 3 - Booking Engine" },
          { id: "task-photo-6", title: "Formulir Reservasi Paket Foto, Add-ons (MUA/Ekstra Jam) & Validasi Zod", description: "Form multi-step pengisian data klien, pilihan paket, add-ons, dan validasi schema Zod.", status: "todo" as const, feature: "Booking Engine", phase: "Phase 3 - Booking Engine" },
          { id: "task-photo-7", title: "Integrasi Payment Gateway QRIS & VA untuk Pembayaran DP 50%", description: "Koneksi ke API payment gateway untuk generate QRIS instan dan Virtual Account pembayaran DP.", status: "todo" as const, feature: "Pembayaran", phase: "Phase 4 - Pembayaran" },
          { id: "task-photo-8", title: "Webhook Handler Pembayaran DP & Notifikasi WhatsApp Konfirmasi Jadwal", description: "Endpoint /api/webhook untuk verifikasi pelunasan DP dan trigger pesan WA konfirmasi jadwal.", status: "todo" as const, feature: "Pembayaran", phase: "Phase 4 - Pembayaran" },
          { id: "task-photo-9", title: "Portal Client Proofing: Private Access Link & Watermark Photo Viewer", description: "Halaman privat klien dengan token unik untuk melihat foto mentah dengan overlay watermark.", status: "todo" as const, feature: "Proofing Portal", phase: "Phase 5 - Proofing Portal" },
          { id: "task-photo-10", title: "Fitur Seleksi Foto Klien (Love/Favorite) dengan Catatan Revisi Retouch", description: "Antarmuka interaktif memilih foto kuota paket dan memberi instruksi editing per foto.", status: "todo" as const, feature: "Proofing Portal", phase: "Phase 5 - Proofing Portal" },
          { id: "task-photo-11", title: "Pipeline Admin Studio: Manajemen Status Editing & Upload Hasil High-Res", description: "Board status pengerjaan (Booked -> Shot -> Editing -> Ready) dan upload foto resolusi penuh.", status: "todo" as const, feature: "Delivery", phase: "Phase 6 - Delivery" },
          { id: "task-photo-12", title: "Invoice Pelunasan Otomatis & Gerbang Unduh File Digital Resolusi Penuh (ZIP)", description: "Verifikasi pelunasan akhir sebelum membukakan akses download file ZIP resolusi tinggi 300 DPI.", status: "todo" as const, feature: "Delivery", phase: "Phase 6 - Delivery" },
          { id: "task-photo-13", title: "Dashboard Studio: Kalender Penugasan Fotografer & Rekap Keuangan", description: "Monitoring penugasan tim fotografer, jadwal pemotretan aktif, dan rekapitulasi omzet studio.", status: "todo" as const, feature: "Studio Management", phase: "Phase 7 - Studio Management" },
          { id: "task-photo-14", title: "Security Hardening (Watermark Protection, Token Expiry) & Deploy ke Vercel", description: "Audit keamanan rute, proteksi hotlinking foto, pengujian end-to-end, dan deployment ke production.", status: "todo" as const, feature: "Studio Management", phase: "Phase 7 - Studio Management" }
        ]
      };
    }

    return {
      prd: {
        overview: `Perencanaan arsitektur dan sistem komprehensif untuk ${title}. Didesain untuk memberikan efisiensi tinggi, keandalan performa, dan skalabilitas jangka panjang sesuai kebutuhan pengguna.`,
        problemStatement: "Mengeliminasi proses manual yang lambat dan rawan kesalahan dengan menyediakan platform otomatisasi digital terintegrasi.",
        goals: [
          "Mengotomatisasi 100% alur kerja inti dan manajemen data",
          "Menjamin kecepatan respons sistem di bawah 1 detik",
          "Meningkatkan konversi dan kepuasan pengguna dengan UI intuitif",
          "Menyediakan visibilitas pelaporan bisnis secara transparan"
        ],
        targetUsers: [
          "Pengguna Utama / Customer (Mencari, memilih, dan bertransaksi)",
          "Staff Operasional (Memproses order dan memvalidasi ketersediaan)",
          "Administrator Bisnis (Mengawasi performa omzet dan laporan analitik)"
        ],
        functionalRequirements: [
          "Autentikasi multi-role (Admin, Staff, Customer) dengan session cookie",
          "Modul penelusuran katalog data dengan filter instan dan sorting",
          "Mesin transaksi pemesanan dengan validasi data ketat",
          "Integrasi gateway pembayaran otomatis dengan webhook rekonsiliasi",
          "Dashboard analitik dan pelaporan riwayat transaksi terpadu"
        ],
        nonFunctionalRequirements: [
          "Waktu muat halaman < 1.2s dan query latency < 200ms",
          "Enkripsi data transit TLS 1.3 dan hashing password standar industri",
          "Desain responsif mobile-first memenuhi standar aksesibilitas WCAG 2.1 AA",
          "Arsitektur stateless siap horizontal scaling"
        ]
      },
      features: [
        {
          id: "feat-1",
          name: "Sistem Autentikasi & Manajemen Pengguna (RBAC)",
          description: `Autentikasi multi-peran aman dengan proteksi session cookie dan route guard untuk ${title}.`,
          priority: "High" as const,
          subFeatures: ["Registrasi & Login dengan email atau Google OAuth", "Role-based Access Control (Admin, Staff, User)", "Reset sandi aman dan update profil pengguna"],
          dependencies: ["Database Setup", "Session Cookie Provider"]
        },
        {
          id: "feat-2",
          name: "Katalog Interaktif & Penelusuran Real-Time",
          description: "Menampilkan daftar item, layanan, dan status ketersediaan secara dinamis dengan filter instan.",
          priority: "High" as const,
          subFeatures: ["Pencarian cerdas dengan debounce search", "Filter multi-kategori dan sorting harga", "Indikator status live ketersediaan stok atau jadwal"],
          dependencies: ["Skema Database"]
        },
        {
          id: "feat-3",
          name: "Manajemen Transaksi & Booking Engine",
          description: "Mesin pemesanan transaksi dengan validasi integritas data dan pencegahan jadwal bentrok.",
          priority: "High" as const,
          subFeatures: ["Formulir data transaksi dengan validasi ketat Zod", "Mekanisme reservasi slot sementara 10 menit saat checkout", "Kalkulasi rincian biaya dan kode unik"],
          dependencies: ["Katalog Interaktif", "Autentikasi Pengguna"]
        },
        {
          id: "feat-4",
          name: "Integrasi Payment Gateway & Rekonsiliasi Otomatis",
          description: "Pembayaran instan dengan verifikasi otomatis server-to-server webhook.",
          priority: "High" as const,
          subFeatures: ["Dukungan QRIS dinamis dan Virtual Account", "Webhook endpoint aman dengan verifikasi signature payload", "Penerbitan kuitansi & invoice digital terenkripsi"],
          dependencies: ["Manajemen Transaksi"]
        },
        {
          id: "feat-5",
          name: "Dashboard Pengelola, Analitik & Pelaporan",
          description: "Panel kendali pusat untuk memantau performa bisnis, omzet, dan manajemen operasional harian.",
          priority: "Medium" as const,
          subFeatures: ["Visualisasi grafik omzet harian, mingguan, dan bulanan", "Tabel manajemen data master (CRUD)", "Fitur ekspor rekap laporan transaksi ke format CSV / PDF"],
          dependencies: ["Autentikasi RBAC Admin", "Skema Payments"]
        },
        {
          id: "feat-6",
          name: "Pusat Notifikasi Real-Time & Riwayat Transaksi",
          description: "Notifikasi otomatis kepada pengguna saat terjadi perubahan status pesanan.",
          priority: "Medium" as const,
          subFeatures: ["Notifikasi bukti bayar via WhatsApp API / Email", "Halaman riwayat transaksi pengguna dengan tombol unduh PDF", "Modul ulasan dan feedback pengguna"],
          dependencies: ["Payment Gateway"]
        }
      ],
      architecture: {
        frontend: "Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons",
        backend: "Next.js Route Handlers & Server Actions, Zod Schema Validation",
        database: "PostgreSQL (Supabase) dengan RLS",
        auth: "Supabase Auth / NextAuth dengan session cookie",
        storage: "Supabase Storage / Cloudflare R2",
        api: "REST API & Server Actions dengan Zod validation",
        thirdParty: ["Midtrans / Xendit (Payment Gateway)", "Fonnte (WhatsApp Gateway)"],
        deployment: "Vercel",
        security: "HTTPS, Rate limiting, Webhook signature verification",
        dataSchema: `CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, name VARCHAR(100) NOT NULL, role VARCHAR(20) DEFAULT 'customer', phone VARCHAR(30), created_at TIMESTAMPTZ DEFAULT NOW());\n\nCREATE TABLE items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(200) NOT NULL, description TEXT, price NUMERIC(12,2) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());\n\nCREATE TABLE orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, total_amount NUMERIC(12,2) NOT NULL, status VARCHAR(30) DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW());\n\nCREATE TABLE payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID REFERENCES orders(id) ON DELETE CASCADE, amount NUMERIC(12,2) NOT NULL, method VARCHAR(50) NOT NULL, status VARCHAR(30) DEFAULT 'unpaid', paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());`
      },
      userFlow: "1. Landing Page -> 2. Autentikasi Pengguna -> 3. Penelusuran Katalog & Pemilihan Layanan -> 4. Formulir Data Transaksi -> 5. Pembayaran Otomatis QRIS / VA -> 6. Validasi Webhook & Konfirmasi Sukses -> 7. Penerbitan Invoice & Dashboard Riwayat",
      tasks: [
        { id: "t-1", title: "Setup Inisialisasi Proyek & Konfigurasi Lingkungan", description: "Inisialisasi Next.js 15 App Router, Tailwind CSS, TypeScript, dan env variables.", status: "todo" as const, feature: "Setup", phase: "Phase 1 - Inisialisasi" },
        { id: "t-2", title: "Desain Skema Database & Migrasi Relasional", description: "Membuat tabel users, items, transactions, payments, dan foreign keys.", status: "todo" as const, feature: "Setup", phase: "Phase 1 - Inisialisasi" },
        { id: "t-3", title: "Implementasi Autentikasi & Session Middleware", description: "Membangun login, register, session cookie, dan middleware proteksi rute.", status: "todo" as const, feature: "Auth", phase: "Phase 2 - Autentikasi" },
        { id: "t-4", title: "Pembuatan Master Layout & Navigasi Responsif", description: "Membangun App Shell, Navbar, Sidebar, modal wrapper, dan tema.", status: "todo" as const, feature: "UI", phase: "Phase 3 - Frontend Core" },
        { id: "t-5", title: "Katalog Interaktif & Penelusuran Real-Time", description: "Menampilkan kartu data, filter multi-kategori, dan instant search bar.", status: "todo" as const, feature: "Katalog", phase: "Phase 3 - Frontend Core" },
        { id: "t-6", title: "Alur Formulir Transaksi & Validasi Schema", description: "Validasi data input menggunakan Zod dan penyiapan payload pesanan.", status: "todo" as const, feature: "Transaksi", phase: "Phase 4 - Modul Transaksi" },
        { id: "t-7", title: "Integrasi Payment Gateway & Webhook Listener", description: "Menghubungkan API payment gateway dan endpoint webhook verifikasi.", status: "todo" as const, feature: "Pembayaran", phase: "Phase 5 - Integrasi" },
        { id: "t-8", title: "Dashboard Admin: Manajemen Data & Laporan", description: "Tabel CRUD master data dan visualisasi grafik penjualan.", status: "todo" as const, feature: "Dashboard", phase: "Phase 6 - Dashboard Admin" },
        { id: "t-9", title: "Testing Menyeluruh, Optimasi Performa & Rilis", description: "Uji end-to-end, audit keamanan header, dan deployment ke production.", status: "todo" as const, feature: "QA", phase: "Phase 7 - QA & Deployment" }
      ]
    };
  };

  // ── Chat & Automatic Blueprint Generation ──────────────────────────────────────
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || chatInput).trim();
    if (!textToSend || !activeProject || isChatLoading) return;

    const userMsg: ProjectChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend,
      createdAt: Date.now(),
    };

    const updatedMessages = [...activeProject.messages, userMsg];
    const projId = activeProject.id;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projId
          ? { ...p, messages: updatedMessages, updatedAt: Date.now() }
          : p
      )
    );
    if (!presetText) setChatInput("");
    setIsChatLoading(true);

    const domain = detectProjectDomain(updatedMessages, activeProject.title, activeProject.description);

    const systemPrompt = `Kamu adalah AI Project Planner, Product Manager, System Analyst, dan Software Architect kelas dunia.
Pengguna sedang mengembangkan ide project: "${domain.topicName}" (Nama project di workspace: "${activeProject.title}"). Deskripsi awal: "${activeProject.description || "N/A"}".

PERHATIAN KRUSIAL TENTANG TOPIK:
- Pengguna mendiskusikan topik: "${domain.topicName}".
- Kamu WAJIB menyusun seluruh analisis secara 100% spesifik dan mendalam sesuai domain "${domain.topicName}".
- DILARANG KERAS menggunakan istilah umum atau contoh template seperti "items", "venues", atau "COba"!
${domain.isPhotography ? `- KHUSUS PROYEK FOTOGRAFI: Wajib mencakup Showcase Portofolio Masonry dengan EXIF data kamera/lensa, Kalender Booking Sesi Photoshoot (Studio & Outdoor), Pilihan Paket Foto (Wedding, Prewedding, Portrait, Event) & Add-ons (MUA, extra hours, album cetak), Client Proofing Portal ber-watermark untuk seleksi foto klien, High-Res Digital Delivery / Cloud ZIP Download, Pembayaran Bertahap (DP 50% & Pelunasan), dan Skema DDL SQL nyata dengan tabel photographers, photo_packages, shoot_bookings, client_galleries, gallery_photos, retouch_requests, invoices.` : ""}

ATURAN KERJA & WORKFLOW (IKUTI SECARA KETAT):

FASE 1: REQUIREMENT DISCOVERY (Klarifikasi & Penggalian Kebutuhan):
Jika pengguna baru memperkenalkan ide, menyapa, memberikan ide singkat, atau kebutuhan detail proyek belum jelas:
- JANGAN langsung membuat PRD atau Task Board terburu-buru tanpa data yang cukup.
- Berikan respon ramah & ringkas dalam bahasa Indonesia (1-2 paragraf pendek) yang mengapresiasi dan memetakan potensi ide tersebut.
- Ajukan 2 sampai 4 pertanyaan krusial yang relevan untuk memperjelas kebutuhan (target pengguna, alur kerja utama, metode login/akses, atau sistem pembayaran).
- SERTAKAN BLOK PILIHAN GANDA INTERAKTIF di akhir respon menggunakan format persis berikut:

<<<QUESTIONS_JSON>>>
[
  {
    "id": "q1",
    "question": "Pertanyaan spesifik 1?",
    "options": ["Opsi Pilihan A", "Opsi Pilihan B", "Opsi Pilihan C"]
  },
  {
    "id": "q2",
    "question": "Pertanyaan spesifik 2?",
    "options": ["Opsi Pilihan A", "Opsi Pilihan B", "Opsi Pilihan C"]
  }
]
<<<END_QUESTIONS_JSON>>>

FASE 2: BLUEPRINT GENERATION (PRD, Arsitektur & Tasks yang KAYA, MENDALAM & LENGKAP):
Jika pengguna sudah menjawab pertanyaan discovery, ATAU pengguna secara eksplisit meminta: "buatkan prd", "generate blueprint", "rancang arsitektur", "buatkan task", atau informasi sudah cukup:
- Berikan kesimpulan singkat & profesional (1-2 paragraf) bahwa seluruh spesifikasi teknis telah selesai dirumuskan.
- WAJIB MENYERTAKAN BLOK BLUEPRINT LENGKAP, SANGAT DETAIL, DAN KOMPREHENSIF (JANGAN PERNAH MEMBERIKAN DATA MINIMALIS ATAU SEDIKIT) di akhir respon menggunakan format persis berikut:

<<<BLUEPRINT_JSON>>>
{
  "prd": {
    "overview": "Deskripsi mendalam 2-3 paragraf mengenai visi aplikasi...",
    "problemStatement": "Uraian mendalam pain points pengguna...",
    "goals": ["Goal 1", "Goal 2", "Goal 3"],
    "targetUsers": ["User Type 1", "User Type 2"],
    "functionalRequirements": ["FR-01", "FR-02", "FR-03"],
    "nonFunctionalRequirements": ["NFR-01", "NFR-02"]
  },
  "features": [
    {
      "name": "Nama Fitur Utama",
      "description": "Deskripsi lengkap...",
      "priority": "High",
      "subFeatures": ["Sub Fitur 1", "Sub Fitur 2"]
    }
  ],
  "userFlow": "1. Langkah satu -> 2. Langkah dua -> 3. Langkah tiga",
  "architecture": {
    "frontend": "Next.js 15, Tailwind CSS",
    "backend": "Next.js Route Handlers",
    "database": "PostgreSQL (Supabase)",
    "dataSchema": "CREATE TABLE ..."
  },
  "tasks": [
    { "title": "Nama Task", "description": "Deskripsi task...", "status": "todo", "phase": "Phase 1 - Inisialisasi" }
  ]
}
<<<END_BLUEPRINT_JSON>>>

PENTING: Pastikan format JSON valid tanpa syntax error.`;

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
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menghubungi AI planner server.");
      }

      if (!res.body) throw new Error("Respons stream tidak tersedia.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawStream = "";
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
          } catch {}
        }
      }

      // Selesai streaming: ekstrak blueprint JSON dan sinkronkan ke state project
      parseAndApplyBlueprint(projId, rawStream, assistantMsgId);
    } catch (err: unknown) {
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
                        content: `Maaf, terjadi gangguan koneksi ke AI: ${errMsg}. Silakan coba lagi.`,
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
      if (matchFence) jsonStr = matchFence[1].trim();
    }

    if (!jsonStr) {
      const matchObj = text.match(/(\{[\s\S]*?"(?:prd|features|tasks)"[\s\S]*\})/);
      if (matchObj) {
        const cand = matchObj[1].trim();
        const lastBrace = cand.lastIndexOf("}");
        if (lastBrace !== -1) jsonStr = cand.slice(0, lastBrace + 1).trim();
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
          if (!cleaned.endsWith("}")) cleaned = cleaned + "\n}";
          try {
            return JSON.parse(cleaned);
          } catch {}
        }
      }
    }
    return null;
  };

  const cleanChatDisplay = (text: string): string => {
    let result = text.trim();
    const jsonStart = result.indexOf("<<<BLUEPRINT_JSON>>>");
    if (jsonStart !== -1) {
      const before = result.slice(0, jsonStart).trim();
      result = before
        ? `${before}\n\n> **Blueprint Proyek Berhasil Dirumuskan:** Spesifikasi PRD, fitur, arsitektur teknis, dan papan task board telah siap di menu **Peta Rencana** dan **PRD Document**!`
        : `> **Blueprint Proyek Berhasil Dirumuskan:** Seluruh spesifikasi PRD, fitur hierarkis, arsitektur sistem, dan task board telah otomatis diperbarui. Silakan tinjau pada menu **Peta Rencana** atau **PRD Document** di atas!`;
    }
    return result || "> **Blueprint Proyek Siap:** Silakan tinjau menu **Peta Rencana** atau **PRD Document**.";
  };

  const parseAndApplyBlueprint = (projId: string, fullText: string, assistantMsgId: string) => {
    const blueprintData = extractBlueprintFromText(fullText);
    const hasQuestions = fullText.includes("<<<QUESTIONS_JSON>>>");

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;

        const updated = { ...p };

        // Pastikan bubble chat menampilkan teks bersih dan tidak pernah kosong
        updated.messages = updated.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, content: cleanChatDisplay(fullText) } : m
        );

        const domain = detectProjectDomain(updated.messages, p.title, p.description);
        const domainBlueprint = getDomainBlueprint(domain, p.title);

        if (blueprintData) {
          if (blueprintData.prd) {
            updated.prd = {
              ...domainBlueprint.prd,
              ...blueprintData.prd,
            };
          }

          if (Array.isArray(blueprintData.features) && blueprintData.features.length > 0) {
            updated.features = blueprintData.features.map((f: any, idx: number) => ({
              id: "feat-" + (idx + 1),
              name: f.name || "Feature " + (idx + 1),
              description: f.description || "",
              priority: f.priority || "Medium",
              subFeatures: Array.isArray(f.subFeatures) ? f.subFeatures : [],
              dependencies: Array.isArray(f.dependencies) ? f.dependencies : [],
            }));
          } else {
            updated.features = domainBlueprint.features;
          }

          if (blueprintData.userFlow) {
            updated.userFlow = String(blueprintData.userFlow);
          } else {
            updated.userFlow = domainBlueprint.userFlow;
          }

          if (blueprintData.architecture) {
            updated.architecture = {
              ...domainBlueprint.architecture,
              ...blueprintData.architecture,
              dataSchema: blueprintData.architecture.dataSchema || domainBlueprint.architecture.dataSchema,
            };
          } else {
            updated.architecture = domainBlueprint.architecture;
          }

          if (Array.isArray(blueprintData.tasks) && blueprintData.tasks.length > 0) {
            updated.tasks = blueprintData.tasks.map((t: any, idx: number) => ({
              id: "task-" + (idx + 1) + "-" + Date.now(),
              title: t.title || "Task " + (idx + 1),
              description: t.description || "",
              status: (t.status === "done" || t.status === "in_progress" || t.status === "failed") ? t.status : "todo",
              phase: t.phase || "Phase " + (Math.floor(idx / 3) + 1),
              feature: t.feature || "Core",
            }));
          } else {
            updated.tasks = domainBlueprint.tasks;
          }

          // Otomatis arahkan pengguna ke Peta Rencana (Mindmap) saat blueprint selesai dibuat
          setTimeout(() => setViewMode("mindmap"), 400);
        } else if (!hasQuestions) {
          if (!updated.prd || !updated.prd.overview) updated.prd = domainBlueprint.prd;
          if (!updated.features || updated.features.length === 0) updated.features = domainBlueprint.features;
          if (!updated.userFlow) updated.userFlow = domainBlueprint.userFlow;
          if (!updated.architecture || !updated.architecture.dataSchema) updated.architecture = domainBlueprint.architecture;
          if (!updated.tasks || updated.tasks.length === 0) updated.tasks = domainBlueprint.tasks;

          setTimeout(() => setViewMode("mindmap"), 400);
        }

        updated.updatedAt = Date.now();
        return updated;
      })
    );
  };

  // ── Master Context Export (Lanjutkan Proyek) ──────────────────────────────────
  const copyMasterContext = () => {
    if (!activeProject) return;
    const domain = detectProjectDomain(activeProject.messages, activeProject.title, activeProject.description);
    const domainBlueprint = getDomainBlueprint(domain, activeProject.title);

    const prd = activeProject.prd || domainBlueprint.prd;
    const arch = activeProject.architecture || domainBlueprint.architecture;
    const features = (activeProject.features && activeProject.features.length > 0) ? activeProject.features : domainBlueprint.features;
    const tasks = (activeProject.tasks && activeProject.tasks.length > 0) ? activeProject.tasks : domainBlueprint.tasks;
    const userFlow = activeProject.userFlow || domainBlueprint.userFlow;
    const dataSchema = arch?.dataSchema || domainBlueprint.architecture.dataSchema;

    const masterPrompt = `# MASTER PROJECT CONTEXT FOR AI CODING TOOLS (Antigravity / Cursor / Vibecode)
# Project: ${activeProject.title} ${domain.isPhotography ? `(${domain.topicName})` : ""}
# Generated by: ngodingpakai — AI Project Planner

---
## 1. PROJECT OVERVIEW & PRD
- **Description**: ${prd?.overview || activeProject.description}
- **Problem Statement**: ${prd?.problemStatement || "Menyelesaikan kebutuhan pengguna secara terstruktur."}
- **Key Goals**:
${prd?.goals?.map((g) => `  * ${g}`).join("\n") || "  * Menghasilkan aplikasi fungsional yang stabil"}

---
## 2. TARGET USERS & REQUIREMENTS
- **Target Users**: ${prd?.targetUsers?.join(", ") || "Klien Utama, Staff Operasional, Administrator"}
- **Functional Requirements**:
${prd?.functionalRequirements?.map((f) => `  * ${f}`).join("\n") || "  * Standar modul aplikasi"}
- **Non-Functional Requirements**:
${prd?.nonFunctionalRequirements?.map((nf) => `  * ${nf}`).join("\n") || "  * Performa cepat dan aman"}

---
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
## 5. FEATURE BREAKDOWN
${features.map((f, i) => `${i + 1}. **${f.name}** [${f.priority || "Medium"}]: ${f.description}${f.subFeatures && f.subFeatures.length > 0 ? `\n   * Sub-fitur: ${f.subFeatures.join(", ")}` : ""}`).join("\n")}

---
## 6. ACTIONABLE DEVELOPMENT TASKS (${tasks.length} Tasks)
${tasks.map((t, i) => `${i + 1}. [${t.status.toUpperCase()}] **${t.title}** (${t.phase || "Dev"}): ${t.description}`).join("\n")}

---
> **Instruksi untuk AI Coding Assistant**: Gunakan spesifikasi dan konteks lengkap di atas untuk membangun kode proyek ini langkah demi langkah, mengikuti task yang belum selesai dan mematuhi arsitektur yang telah ditentukan.`;

    navigator.clipboard.writeText(masterPrompt);
    showCopyToast("Master Prompt berhasil disalin! Siap dipaste ke AI coding tool.");
  };

  // ── Project Creation ──────────────────────────────────────────────────────────
  const handleCreateProject = () => {
    if (!newTitle.trim()) return;
    const newProj: ProjectItem = {
      id: "proj-" + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim() || "Proyek perencanaan aplikasi dengan AI.",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: "m-welcome",
          role: "assistant",
          content: `Halo! Saya adalah **AI Project Planner & Software Architect** untuk proyek **${newTitle.trim()}**.

Tugas saya adalah membantu Anda merumuskan perencanaan lengkap:
- **PRD Dokumen Lengkap** (Overview, Requirements, Scope)
- **Peta Rencana Fitur Hierarkis (Mindmap)**
- **User Flow & Arsitektur Teknis**
- **Actionable Task Board**

Silakan ceritakan ide proyek Anda secara singkat, atau klik tombol **Generate Blueprint** di atas untuk langsung merancang PRD otomatis.`,
          createdAt: Date.now(),
        },
      ],
      tasks: [],
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setViewMode("chat");
    setShowNewModal(false);
    setNewTitle("");
    setNewDesc("");
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus proyek ini?")) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 1: PROJECT LIST (Jika belum memilih project)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!activeProject) {
    return (
      <div className="flex flex-col h-full w-full overflow-y-auto bg-[#0b0f19] text-white">
        {/* Header Bar matching Reference */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-slate-800/80 bg-[#0b0f19]/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Logo NgodingPakai */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f95721] text-white shadow-md shadow-[#f95721]/30">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 1.5L3 6.75v10.5L12 22.5l9-5.25V6.75L12 1.5zm0 2.6l6.5 3.8-6.5 3.8-6.5-3.8 6.5-3.8zM4.5 8.65L11 12.4v7.4l-6.5-3.8V8.65zm15 0v7.35L13 19.8v-7.4l6.5-3.75z" />
                </svg>
              </div>
              <span className="font-bold text-base tracking-tight text-white">ngodingpakai</span>
            </div>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400 font-medium">Dashboard Perencanaan</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold bg-[#f95721] hover:bg-[#ea4815] text-white transition shadow-lg shadow-[#f95721]/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Project Baru</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              title="Tutup"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Daftar Project Perencanaan</h2>
            <p className="text-xs sm:text-sm mt-1 text-slate-400">
              Rancang ide web atau aplikasi Anda menjadi PRD, peta visual mindmap fitur, arsitektur, dan task board.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create Card */}
            <div
              onClick={() => setShowNewModal(true)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 text-slate-400 hover:text-white transition cursor-pointer min-h-[170px] text-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200 mb-2.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-semibold">Buat Project Baru</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Ubah ide mentah jadi PRD &amp; Mindmap</span>
            </div>

            {/* Project List */}
            {projects.map((proj) => {
              const featuresCount = proj.features?.length || (proj.prd ? 6 : 0);
              const tasksCount = proj.tasks?.length || 0;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setViewMode(proj.prd?.overview ? "mindmap" : "chat");
                  }}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl border border-slate-800 bg-[#111625] hover:border-slate-700 hover:bg-[#141b2e] hover:shadow-xl hover:shadow-black/50 transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">📁</span>
                        <h3 className="font-bold text-base leading-snug line-clamp-1 text-white">{proj.title}</h3>
                      </div>
                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Hapus project"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <p className="text-xs mt-2 line-clamp-2 text-slate-400 leading-relaxed">
                      {proj.description || "Perencanaan sistem dan arsitektur aplikasi digital."}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{featuresCount} fitur direncanakan</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {tasksCount} tasks
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: New Project */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-800 bg-[#111625] text-white">
              <h3 className="text-lg font-bold">Mulai Perencanaan Project Baru</h3>
              <p className="text-xs mt-1 text-slate-400">Beri nama ide aplikasi atau website yang ingin Anda rancang.</p>
              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold block mb-1">Nama Project</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="misal: Web Fotografi Studio, Aplikasi Booking Futsal"
                    className="w-full rounded-xl px-3.5 py-2 text-xs font-medium border border-slate-700 bg-slate-900 text-white outline-none focus:border-[#f95721]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Deskripsi Singkat (Opsional)</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Jelaskan kebutuhan dasar project Anda..."
                    className="w-full rounded-xl p-3 text-xs font-medium border border-slate-700 bg-slate-900 text-white outline-none focus:border-[#f95721] resize-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f95721] hover:bg-[#ea4815] text-white disabled:opacity-50"
                >
                  Buat Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 2: WORKSPACE ACTIVE PROJECT (Layout Sesuai Gambar Referensi ngodingpakai)
  // ─────────────────────────────────────────────────────────────────────────────
  const domain = detectProjectDomain(activeProject.messages, activeProject.title, activeProject.description);
  const domainBlueprint = getDomainBlueprint(domain, activeProject.title);
  const prd = activeProject.prd || domainBlueprint.prd;
  const features = (activeProject.features && activeProject.features.length > 0) ? activeProject.features : domainBlueprint.features;
  const tasks = (activeProject.tasks && activeProject.tasks.length > 0) ? activeProject.tasks : domainBlueprint.tasks;
  const architecture = activeProject.architecture || domainBlueprint.architecture;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0b0f19] text-slate-100 select-none">
      {/* Toast Feedback */}
      {copyFeedback && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xl bg-emerald-500 text-white animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* ── TOP HEADER BAR (Sesuai Gambar 1 & Gambar 2) ────────────────────────── */}
      <header className="shrink-0 z-30 h-14 flex items-center justify-between border-b border-slate-800/80 bg-[#0b0f19] px-4 sm:px-6">
        {/* Left: Brand & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo ngodingpakai */}
          <div
            onClick={() => setActiveProjectId(null)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition shrink-0"
            title="Daftar Project"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f95721] text-white shadow-sm shadow-[#f95721]/40">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 1.5L3 6.75v10.5L12 22.5l9-5.25V6.75L12 1.5zm0 2.6l6.5 3.8-6.5 3.8-6.5-3.8 6.5-3.8zM4.5 8.65L11 12.4v7.4l-6.5-3.8V8.65zm15 0v7.35L13 19.8v-7.4l6.5-3.75z" />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">ngodingpakai</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">·</span>

          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 min-w-0">
            <span className="text-slate-400">📁</span>
            <span className="truncate max-w-[120px] sm:max-w-[180px] font-semibold text-white">{activeProject.title}</span>
            <span className="text-slate-600">/</span>
            <span className="truncate max-w-[120px] text-slate-400 hidden sm:inline">
              {viewMode === "mindmap" ? "Peta Rencana" : viewMode === "prd_doc" ? "PRD Document" : viewMode === "tasks" ? "Task Board" : "Chat Planner"}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-[#f95721] border border-slate-700/80">#1</span>
          </div>
        </div>

        {/* Center: View Switcher Nav Pills */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-[#111625] border border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setViewMode("mindmap")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === "mindmap" ? "bg-[#f95721] text-white font-semibold shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            <span>Peta Rencana</span>
          </button>

          <button
            onClick={() => setViewMode("prd_doc")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === "prd_doc" ? "bg-[#f95721] text-white font-semibold shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>PRD Document</span>
          </button>

          <button
            onClick={() => setViewMode("tasks")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === "tasks" ? "bg-[#f95721] text-white font-semibold shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Lihat Task ({tasks.length})</span>
          </button>

          <button
            onClick={() => setViewMode("chat")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === "chat" ? "bg-[#f95721] text-white font-semibold shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>AI Planner</span>
          </button>
        </div>

        {/* Right: Actions matching Reference */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("tasks")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <span>Lihat Task</span>
          </button>

          {/* Primary Action Button (Orange Pill as in Gambar 1 & 2) */}
          <button
            onClick={copyMasterContext}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold bg-[#f95721] hover:bg-[#ea4815] text-white transition shadow-lg shadow-[#f95721]/30 cursor-pointer"
            title="Salin Master Context untuk AI coding tools (Vibecode/Antigravity/Cursor)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Lanjutkan proyek</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            title="Tutup Workspace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── WORKSPACE BODY WITH LEFT ICON RAIL ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost Icon Rail (as seen in Gambar 1) */}
        <div className="shrink-0 w-12 border-r border-slate-800/80 bg-[#080c14] flex flex-col items-center py-3.5 gap-4 z-20">
          <button
            onClick={() => setViewMode("chat")}
            className={`p-2 rounded-xl transition ${viewMode === "chat" ? "bg-[#f95721] text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            title="Chat Planner & Tanya Jawab"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          <button
            onClick={() => setViewMode("prd_doc")}
            className={`p-2 rounded-xl transition ${viewMode === "prd_doc" ? "bg-[#f95721] text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            title="PRD Document"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button
            onClick={() => setViewMode("mindmap")}
            className={`p-2 rounded-xl transition ${viewMode === "mindmap" ? "bg-[#f95721] text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            title="Visual Mindmap Tree"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>

          <button
            onClick={() => setViewMode("tasks")}
            className={`p-2 rounded-xl transition ${viewMode === "tasks" ? "bg-[#f95721] text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            title="Task Board"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </button>
        </div>

        {/* ── VIEW 1: PRD DOCUMENT VIEWER (Sesuai Gambar 1) ────────────────────── */}
        {viewMode === "prd_doc" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Outline Table of Contents */}
            <div className="w-64 border-r border-slate-800/80 bg-[#0c101d] p-5 shrink-0 overflow-y-auto">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
                PRD — Project Requirements Document
              </div>

              <nav className="space-y-1 text-xs">
                {[
                  { id: "overview", label: "1. Overview" },
                  { id: "requirements", label: "2. Requirements" },
                  { id: "features", label: "3. Core Features" },
                  { id: "user_flow", label: "4. User Flow" },
                  { id: "architecture", label: "5. Architecture" },
                  { id: "schema", label: "6. Database Schema" },
                  { id: "tech_stack", label: "7. Tech Stack" },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedDocSection(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                      selectedDocSection === sec.id
                        ? "bg-slate-800 text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }`}
                  >
                    <span>{sec.label}</span>
                    {selectedDocSection === sec.id && <span className="h-1.5 w-1.5 rounded-full bg-[#f95721]" />}
                  </button>
                ))}
              </nav>
            </div>

            {/* Document Content Panel */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
              {selectedDocSection === "overview" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white">1. Project Overview</h2>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">{prd?.overview}</p>
                  
                  <div className="p-5 rounded-2xl border border-slate-800 bg-[#111625] space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#f95721]">Problem Statement</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{prd?.problemStatement}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white">Key Goals &amp; Objectives:</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {prd?.goals?.map((g, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#f95721] font-bold mt-0.5">•</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedDocSection === "requirements" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white">2. Requirements Specification</h2>
                  
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">Functional Requirements (FR)</h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      {prd?.functionalRequirements?.map((fr, i) => (
                        <div key={i} className="p-3.5 rounded-xl border border-slate-800 bg-[#111625] text-xs text-slate-200 flex items-start gap-2.5">
                          <span className="font-bold text-[#f95721]">0{i + 1}.</span>
                          <span>{fr}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">Non-Functional Requirements (NFR)</h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      {prd?.nonFunctionalRequirements?.map((nfr, i) => (
                        <div key={i} className="p-3.5 rounded-xl border border-slate-800 bg-[#111625] text-xs text-slate-300 flex items-start gap-2.5">
                          <span className="font-bold text-slate-500">NFR-{i + 1}</span>
                          <span>{nfr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedDocSection === "features" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white">3. Core Features Hierarchy</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {features.map((feat, i) => (
                      <div key={feat.id || i} className="p-5 rounded-2xl border border-slate-800 bg-[#111625] space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-white">{i + 1}. {feat.name}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f95721]/15 text-[#f95721] border border-[#f95721]/30">
                            {feat.priority || "High"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                        {feat.subFeatures && feat.subFeatures.length > 0 && (
                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Sub-Fitur:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {feat.subFeatures.map((sub, si) => (
                                <div key={si} className="text-xs text-slate-300 flex items-center gap-1.5">
                                  <span className="text-[#f95721]">✓</span>
                                  <span>{sub}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocSection === "user_flow" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white">4. User Flow</h2>
                  <div className="p-6 rounded-2xl border border-slate-800 bg-[#111625] font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
                    {activeProject.userFlow || domainBlueprint.userFlow}
                  </div>
                </div>
              )}

              {selectedDocSection === "architecture" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white">5. Architecture</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Sistem dirancang menggunakan arsitektur modern berkinerja tinggi, mengintegrasikan client-side SPA berbasis Next.js App Router, database relasional PostgreSQL dengan RLS, serta cloud storage untuk aset resolusi tinggi.
                  </p>

                  {/* Architecture Flowchart Box (Sesuai Desain Gambar 1) */}
                  <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1322] space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                      Arsitektur Aliran Data &amp; Komponen
                    </span>
                    <div className="p-6 rounded-xl border border-slate-800/80 bg-[#070a12] flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg border border-slate-700 bg-slate-900 text-center font-bold text-white shadow-md">
                        Browser Pengguna / Mobile
                        <span className="block text-[10px] font-normal text-slate-400">UI &amp; HUD (Next.js / React)</span>
                      </div>
                      <span className="text-[#f95721] font-bold">➔</span>
                      <div className="p-3 rounded-lg border border-slate-700 bg-slate-900 text-center font-bold text-white shadow-md">
                        Next.js Server Actions
                        <span className="block text-[10px] font-normal text-slate-400">API Route &amp; Zod Validator</span>
                      </div>
                      <span className="text-[#f95721] font-bold">➔</span>
                      <div className="flex flex-col gap-2">
                        <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-center font-bold text-emerald-300">
                          PostgreSQL (Supabase)
                          <span className="block text-[10px] font-normal text-slate-400">Relational DB &amp; RLS</span>
                        </div>
                        <div className="p-2.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 text-center font-bold text-cyan-300">
                          Object Storage
                          <span className="block text-[10px] font-normal text-slate-400">Supabase Storage / R2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedDocSection === "schema" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white">6. Database Schema (DDL PostgreSQL)</h2>
                  <pre className="p-5 rounded-2xl border border-slate-800 bg-[#070a12] text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    {architecture.dataSchema || domainBlueprint.architecture.dataSchema}
                  </pre>
                </div>
              )}

              {selectedDocSection === "tech_stack" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white">7. Tech Stack &amp; Infrastructure</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="p-4 rounded-xl border border-slate-800 bg-[#111625]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Frontend</span>
                      <span className="font-semibold text-white">{architecture.frontend}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-800 bg-[#111625]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Backend / API</span>
                      <span className="font-semibold text-white">{architecture.backend}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-800 bg-[#111625]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Database</span>
                      <span className="font-semibold text-white">{architecture.database}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-800 bg-[#111625]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Deployment</span>
                      <span className="font-semibold text-white">{architecture.deployment}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VIEW 2: VISUAL MINDMAP TREE & PERENCANAAN DRAWER (Sesuai Gambar 2) ── */}
        {viewMode === "mindmap" && (
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Panel: Perencanaan Drawer (Matching Gambar 2) */}
            {isPerencanaanDrawerOpen && (
              <div className="w-[360px] sm:w-[420px] border-r border-slate-800/80 bg-[#0c101d] flex flex-col shrink-0 z-10 transition-all duration-300">
                {/* Drawer Header */}
                <div className="h-12 border-b border-slate-800/80 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Perencanaan</span>
                  </div>

                  {/* Drawer Control Icons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewMode("prd_doc")}
                      className="p-1.5 rounded-lg bg-[#f95721] text-white hover:bg-[#ea4815] transition"
                      title="Lihat PRD Lengkap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={copyMasterContext}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Salin Master Context"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsPerencanaanDrawerOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Tutup Panel"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sub-header: Count indicator */}
                <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-900/30 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{features.length} fitur dari rencana ini.</span>
                </div>

                {/* Drawer Body: PRD Overview */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300 leading-relaxed">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">PRD — Project Requirements Document</h3>
                    <h4 className="text-xs font-semibold text-[#f95721] mb-1.5">1. Overview</h4>
                    <p className="text-slate-300">{prd?.overview}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white mb-1.5">Problem Statement:</h4>
                    <p className="text-slate-400">{prd?.problemStatement}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white mb-1.5">Target &amp; Goals:</h4>
                    <ul className="space-y-1.5 pl-3 border-l-2 border-[#f95721]">
                      {prd?.goals?.map((g, i) => (
                        <li key={i} className="text-slate-300">{g}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => setViewMode("prd_doc")}
                    className="w-full py-2 rounded-xl text-center font-semibold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                  >
                    Buka Dokumen PRD Lengkap ➔
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Drawer Open Button (If closed) */}
            {!isPerencanaanDrawerOpen && (
              <button
                onClick={() => setIsPerencanaanDrawerOpen(true)}
                className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-[#111625] text-xs font-semibold text-white shadow-xl hover:bg-slate-800 transition"
              >
                <span>Buka Perencanaan</span>
                <span className="text-[#f95721]">➔</span>
              </button>
            )}

            {/* Right Area: Interactive Visual Mindmap Tree Canvas (Matching Gambar 2) */}
            <div className="flex-1 overflow-auto bg-[#070a12] p-8 sm:p-12 relative flex items-center min-w-[900px]">
              <div
                className="flex items-center gap-12 transition-transform duration-200 origin-left"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* 1. Root Node (Project Title) */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="p-4 rounded-2xl border-2 border-[#f95721] bg-[#111625] text-white shadow-2xl shadow-[#f95721]/20 max-w-[200px] text-center">
                    <span className="text-[10px] font-bold text-[#f95721] uppercase tracking-wider block mb-1">
                      Project Root
                    </span>
                    <h3 className="font-bold text-sm leading-snug line-clamp-2">{activeProject.title}</h3>
                    <div className="mt-2 text-[10px] font-semibold text-slate-400 bg-slate-800 rounded-full px-2 py-0.5">
                      {tasks.length} total tasks
                    </div>
                  </div>
                </div>

                {/* 2. Branches: Features, Sub-features & Tasks */}
                <div className="flex flex-col gap-6 shrink-0">
                  {features.map((feat, i) => {
                    const featureTasks = tasks.filter((t) => t.feature?.toLowerCase().includes(feat.name.toLowerCase()));
                    const taskCount = featureTasks.length || Math.min(3, Math.max(1, i + 2));

                    return (
                      <div key={feat.id || i} className="flex items-center gap-8 relative group">
                        {/* Feature Node Card */}
                        <div className="w-[230px] p-3.5 rounded-xl border border-slate-800 bg-[#111625] hover:border-[#f95721] hover:shadow-lg transition">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400">FITUR {i + 1}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Direncanakan
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-white leading-snug">{feat.name}</h4>
                          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Estimasi task</span>
                            <span className="font-bold text-white">{taskCount}/{taskCount}</span>
                          </div>
                        </div>

                        {/* Sub-features Branch Card */}
                        <div className="w-[220px] p-3 rounded-xl border border-slate-800/80 bg-[#0d121f] text-xs space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Sub-Fitur
                          </span>
                          {feat.subFeatures && feat.subFeatures.length > 0 ? (
                            feat.subFeatures.slice(0, 3).map((sub, si) => (
                              <div key={si} className="text-[11px] text-slate-300 truncate flex items-center gap-1.5">
                                <span className="text-slate-500">•</span>
                                <span className="truncate">{sub}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-400">Modul sub-fitur terintegrasi</div>
                          )}
                        </div>

                        {/* Tasks Branch Card */}
                        <div className="w-[240px] p-3 rounded-xl border border-slate-800/80 bg-[#0c101b] text-xs space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Actionable Tasks
                          </span>
                          <div className="space-y-1">
                            {(featureTasks.length > 0 ? featureTasks.slice(0, 2) : tasks.slice(i * 2, i * 2 + 2)).map((t, ti) => (
                              <div key={ti} className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span className="truncate">{t.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom-left Canvas Controls (+ / - / Reset) matching Reference */}
              <div className="absolute bottom-6 left-6 z-20 flex flex-col items-center rounded-xl border border-slate-800 bg-[#111625]/90 backdrop-blur-xs p-1 shadow-2xl">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Zoom In"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <div className="h-[1px] w-4 bg-slate-800 my-0.5" />
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Zoom Out"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="h-[1px] w-4 bg-slate-800 my-0.5" />
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Reset Zoom"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: KANBAN TASK BOARD ───────────────────────────────────────── */}
        {viewMode === "tasks" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0f19]">
            <div className="h-12 border-b border-slate-800 px-6 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Actionable Task Board ({tasks.length} tasks)</h3>
              <button
                onClick={copyMasterContext}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f95721] text-white hover:bg-[#ea4815] transition"
              >
                Salin Semua Tasks
              </button>
            </div>

            <div className="flex-1 overflow-x-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[800px] h-full items-start">
                {[
                  { id: "todo", label: "Belum Mulai", items: tasks.filter((t) => t.status === "todo") },
                  { id: "in_progress", label: "Dikerjakan", items: tasks.filter((t) => t.status === "in_progress") },
                  { id: "done", label: "Selesai", items: tasks.filter((t) => t.status === "done") },
                  { id: "failed", label: "Kendala", items: tasks.filter((t) => t.status === "failed") },
                ].map((col) => (
                  <div key={col.id} className="p-4 rounded-2xl border border-slate-800 bg-[#111625] flex flex-col h-full">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs font-bold text-white uppercase">
                      <span>{col.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                        {col.items.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2.5">
                      {col.items.map((t) => (
                        <div key={t.id} className="p-3 rounded-xl border border-slate-800/80 bg-[#0c101d] text-xs space-y-1">
                          <h4 className="font-bold text-white">{t.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                          <span className="text-[9px] font-semibold text-slate-500 uppercase">{t.phase}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 4: CHAT AI PLANNER ─────────────────────────────────────────── */}
        {viewMode === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0b0f19]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5">
              {activeProject.messages.map((m, idx) => {
                const isUser = m.role === "user";
                const isLastAssistant = !isUser && idx === activeProject.messages.length - 1;
                const { cleanText, questions } = isUser ? { cleanText: m.content, questions: [] } : parseQuestionsFromText(m.content);

                return (
                  <div key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-bold bg-[#f95721] text-white text-[11px] shadow-md shadow-[#f95721]/30">
                        AI
                      </div>
                    )}

                    <div className={`max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed ${
                      isUser
                        ? "bg-[#f95721] text-white font-medium"
                        : "bg-[#111625] border border-slate-800 text-slate-200 shadow-md"
                    }`}>
                      {/* FIX: Hanya tampilkan animasi loading jika memang sedang streaming chunk aktif */}
                      {isChatLoading && isLastAssistant && !m.content ? (
                        <div className="py-1">
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-semibold text-slate-200">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f95721] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f95721]"></span>
                            </span>
                            <span className="animate-pulse">Sedang menganalisis kebutuhan &amp; merumuskan blueprint proyek...</span>
                          </div>
                          <div className="space-y-2.5">
                            <div className="h-3 w-4/5 rounded-full bg-slate-800 animate-pulse" />
                            <div className="h-3 w-11/12 rounded-full bg-slate-800 animate-pulse" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <MarkdownMessage content={cleanText || m.content || "> Blueprint proyek berhasil dirumuskan! Silakan periksa tab Peta Rencana."} isDark={true} />

                          {/* Discovery Questions Choices */}
                          {questions.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-800 space-y-4">
                              <span className="text-xs font-bold text-white block">
                                Pertanyaan Discovery (Pilih jawaban atau tulis sendiri):
                              </span>
                              {questions.map((q, qIdx) => (
                                <div key={q.id || qIdx} className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                  <span className="text-xs font-semibold text-slate-200">{qIdx + 1}. {q.question}</span>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {q.options.map((opt, optIdx) => (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        onClick={() => handleToggleOption(q.question, opt)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                                          selectedAnswers[q.question] === opt
                                            ? "bg-[#f95721] text-white border-[#f95721]"
                                            : "border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCustomInput(q.question)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed ${
                                        showCustomInput[q.question]
                                          ? "bg-[#f95721] text-white border-[#f95721]"
                                          : "border-slate-700 text-slate-400 hover:text-white"
                                      }`}
                                    >
                                      Lainnya / Tulis Sendiri
                                    </button>
                                  </div>
                                  {showCustomInput[q.question] && (
                                    <input
                                      type="text"
                                      value={customInputs[q.question] || ""}
                                      onChange={(e) => setCustomInputs((prev) => ({ ...prev, [q.question]: e.target.value }))}
                                      placeholder="Tuliskan jawaban Anda..."
                                      className="w-full mt-2 rounded-lg px-3 py-1.5 text-xs border border-slate-700 bg-slate-950 text-white outline-none focus:border-[#f95721]"
                                    />
                                  )}
                                </div>
                              ))}

                              {/* Kirim Semua Jawaban */}
                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  disabled={isChatLoading}
                                  onClick={() => handleSubmitAllAnswers(questions)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f95721] hover:bg-[#ea4815] text-white shadow-lg shadow-[#f95721]/30 transition cursor-pointer"
                                >
                                  Kirim Jawaban &amp; Generate Blueprint ➔
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-800 bg-[#0c101d]">
              <div className="max-w-3xl mx-auto flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2.5">
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
                  placeholder="Diskusikan kebutuhan proyek Anda, minta penyesuaian fitur, atau buat PRD..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendChatMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-2 rounded-xl bg-[#f95721] hover:bg-[#ea4815] text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
