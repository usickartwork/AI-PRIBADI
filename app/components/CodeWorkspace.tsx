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
        status: "in_progress",
        feature: "Real-time Field Schedule & Booking",
        phase: "Phase 2 - Core Booking",
        acceptanceCriteria: ["Slot jam otomatis terkunci saat user lain sedang checkout", "Tampilan responsif di mobile"],
      },
      {
        id: "task-4",
        title: "Integrasi Webhook Payment Gateway (QRIS)",
        description: "Koneksikan API Midtrans/Xendit untuk menghasilkan QRIS dan tangani webhook sukses bayar.",
        status: "in_progress",
        feature: "Payment Gateway Integration",
        phase: "Phase 2 - Core Booking",
        acceptanceCriteria: ["Status booking berubah dari 'pending' ke 'confirmed' begitu QRIS dibayar"],
      },
      {
        id: "task-5",
        title: "Dashboard Rekap Omset & Manajemen Lapangan",
        description: "Halaman admin untuk melihat grafik pendapatan, jadwal hari ini, dan penyesuaian harga khusus.",
        status: "todo",
        feature: "Admin Management Dashboard",
        phase: "Phase 3 - Management & Polish",
        acceptanceCriteria: ["Admin bisa ekspor laporan ke Excel/CSV", "Admin bisa blokir jadwal untuk maintenance"],
      },
      {
        id: "task-6",
        title: "Integrasi Notifikasi WhatsApp Pengingat Main",
        description: "Kirim pesan otomatis via WA 3 jam sebelum jadwal kick-off.",
        status: "todo",
        feature: "Notification",
        phase: "Phase 3 - Management & Polish",
        acceptanceCriteria: ["Pesan otomatis terkirim dengan nomor booking dan lokasi"],
      },
    ],
  },
];

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
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "prd" | "features" | "flow_arch" | "tasks">("chat");
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

  // State untuk memilih semua jawaban sebelum dikirim
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});

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
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("todo");
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
- **PRD Lengkap** (Requirements, User Stories, Scope)
- **Daftar Fitur & Prioritas**
- **User Flow & Arsitektur Teknis** (Frontend, Backend, Database)
- **Task Board (Kanban)** yang siap dijalankan

Silakan ceritakan ide proyek Anda secara singkat, atau klik tombol **Generate Blueprint** di bawah untuk langsung merancang PRD dan Task Board otomatis.`,
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
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus proyek ini?")) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
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
      userFlow: `1. Landing Page -> 2. Autentikasi Pengguna -> 3. Penelusuran Katalog & Pemilihan Layanan -> 4. Formulir Data Transaksi -> 5. Pembayaran Otomatis QRIS / VA -> 6. Validasi Webhook & Konfirmasi Sukses -> 7. Penerbitan Invoice & Dashboard Riwayat`,
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
    "overview": "Deskripsi mendalam 2-3 paragraf mengenai visi aplikasi, target pasar, value proposition utama, dan batasan ruang lingkup pengembangan...",
    "problemStatement": "Uraian mendalam pain points pengguna dan inefisiensi nyata yang diselesaikan...",
    "goals": [
      "Target strategis 1 (misal: Mengotomatisasi 100% proses pemesanan & rekonsiliasi)",
      "Target strategis 2 (misal: Menghilangkan double booking dengan status ketersediaan real-time)",
      "Target strategis 3 (misal: Memangkas waktu checkout di bawah 60 detik)",
      "Target strategis 4 (misal: Menyediakan visibilitas pelaporan pendapatan transparan)"
    ],
    "targetUsers": [
      "Pengguna Utama (Karakteristik, kebiasaan, dan kebutuhan)",
      "Pengelola / Mitra Bisnis (Kebutuhan operasional, manajemen stok/jadwal)",
      "Administrator Sistem (Monitoring, manajemen pengguna, keuangan & log audit)"
    ],
    "functionalRequirements": [
      "Autentikasi multi-role (Admin, Mitra, Customer) dengan proteksi sesi & reset kata sandi",
      "Katalog & Penelusuran Real-time dengan filter kategori, harga, dan ketersediaan dinamis",
      "Modul Pemesanan / Transaksi dengan penguncian slot waktu sementara (hold mechanism) untuk mencegah bentrok",
      "Integrasi Gateway Pembayaran Otomatis dengan dukungan QRIS, Virtual Account, dan verifikasi instan via webhook",
      "Sistem Notifikasi Transaksi real-time via WhatsApp/Email untuk bukti bayar dan konfirmasi",
      "Dashboard Manajemen & Pelaporan dengan visualisasi omzet harian, mingguan, dan bulanan",
      "Manajemen Profil Pengguna dan Riwayat Transaksi dengan opsi unduh invoice PDF",
      "Audit Log & Keamanan Akses untuk melacak seluruh modifikasi data penting"
    ],
    "nonFunctionalRequirements": [
      "Performa: Waktu muat halaman pertama < 1.2s dan respons API database < 200ms",
      "Keamanan: Enkripsi transit TLS 1.3, hashing kata sandi Argon2/Bcrypt, sanitasi SQL injection & proteksi CSRF/CORS",
      "Ketersediaan & Reliabilitas: Target uptime 99.9% dengan fallback handling",
      "Skalabilitas: Arsitektur stateless siap horizontal scaling pada traffic tinggi",
      "Responsivitas: Antarmuka adaptif mobile-first, tablet, dan desktop",
      "Aksesibilitas: Memenuhi standar WCAG 2.1 AA dengan navigasi keyboard dan kontras rasio ramah mata"
    ]
  },
  "features": [
    {
      "name": "Sistem Autentikasi & Manajemen Pengguna (RBAC)",
      "description": "Autentikasi aman multi-peran (Admin, Staff, Customer) dengan session cookie dan proteksi route guard.",
      "priority": "High",
      "subFeatures": [
        "Login & Register dengan email atau Google OAuth",
        "Role-based Access Control (RBAC) middleware",
        "Manajemen profil pengguna & reset sandi via OTP/Email"
      ]
    },
    {
      "name": "Katalog Interaktif & Penelusuran Real-Time",
      "description": "Menampilkan daftar item, layanan, atau ketersediaan slot waktu secara dinamis dengan filter interaktif.",
      "priority": "High",
      "subFeatures": [
        "Pencarian instan dengan debounce search",
        "Filter kategori multi-kriteria dan sorting harga/popularitas",
        "Indikator status ketersediaan live"
      ]
    },
    {
      "name": "Manajemen Transaksi & Booking Engine",
      "description": "Mesin pemesanan transaksi dengan validasi integritas data dan proteksi slot bentrok.",
      "priority": "High",
      "subFeatures": [
        "Pemilihan tanggal & slot waktu interaktif",
        "Mekanisme reservasi sementara 10 menit saat checkout",
        "Perhitungan otomatis biaya, pajak, dan kode unik"
      ]
    },
    {
      "name": "Integrasi Payment Gateway & Rekonsiliasi Otomatis",
      "description": "Pembayaran instan dengan verifikasi otomatis server-to-server webhook.",
      "priority": "High",
      "subFeatures": [
        "Integrasi QRIS dinamis & Virtual Account",
        "Webhook handler untuk update status order otomatis",
        "Penerbitan invoice dan kuitansi digital otomatis"
      ]
    },
    {
      "name": "Dashboard Admin, Analitik & Pelaporan",
      "description": "Panel pusat kendali untuk pengelola bisnis memantau metrik performa dan operasional harian.",
      "priority": "Medium",
      "subFeatures": [
        "Visualisasi grafik pemasukan dan volume order",
        "Export data transaksi ke format CSV / Excel",
        "Manajemen operasional (tambah/edit jadwal, harga, atau inventaris)"
      ]
    },
    {
      "name": "Pusat Notifikasi & Riwayat Transaksi",
      "description": "Notifikasi otomatis kepada pengguna saat terjadi perubahan status pesanan.",
      "priority": "Medium",
      "subFeatures": [
        "Pengiriman notifikasi status via WhatsApp API / Email",
        "Riwayat aktivitas & unduh invoice PDF",
        "Rating & ulasan kepuasan pelanggan"
      ]
    }
  ],
  "userFlow": "1. Halaman Utama / Landing Page -> 2. Autentikasi / Registrasi Pengguna -> 3. Jelajahi Katalog & Pilih Slot Ketersediaan -> 4. Formulir Data Pemesan & Ringkasan Order -> 5. Checkout & Pembayaran Otomatis (QRIS / VA) -> 6. Validasi Webhook & Update Status Sukses -> 7. Penerbitan Invoice Digital & Notifikasi WhatsApp -> 8. Dashboard Riwayat Pengguna",
  "architecture": {
    "frontend": "Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, Framer Motion",
    "backend": "Next.js Route Handlers & Server Actions, Zod Schema Validation",
    "database": "PostgreSQL (Supabase / Neon) dengan indexing optimal",
    "auth": "Supabase Auth / NextAuth dengan JWT & secure HttpOnly cookie",
    "storage": "Supabase Storage / Cloudflare R2 untuk aset foto & dokumen",
    "deployment": "Vercel (Edge Network) dengan automated CI/CD pipeline",
    "dataSchema": "CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, name VARCHAR(100) NOT NULL, role VARCHAR(20) DEFAULT 'customer', phone VARCHAR(30), created_at TIMESTAMPTZ DEFAULT NOW());\\n\\nCREATE TABLE venues (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(200) NOT NULL, description TEXT, price_per_hour NUMERIC(12,2) NOT NULL, image_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW());\\n\\nCREATE TABLE bookings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, venue_id UUID REFERENCES venues(id) ON DELETE CASCADE, start_time TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ NOT NULL, status VARCHAR(30) DEFAULT 'pending', total_amount NUMERIC(12,2) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());\\n\\nCREATE TABLE payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE, payment_method VARCHAR(50) NOT NULL, payment_status VARCHAR(30) DEFAULT 'unpaid', transaction_id VARCHAR(100), paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());\\n\\nCREATE TABLE activity_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE SET NULL, action VARCHAR(100) NOT NULL, details JSONB, created_at TIMESTAMPTZ DEFAULT NOW());"
  },
  "tasks": [
    { "title": "Setup Inisialisasi Proyek & Konfigurasi Lingkungan", "description": "Inisialisasi Next.js 15 App Router, konfigurasi Tailwind CSS, ESLint, TypeScript, dan environment variables.", "status": "todo", "phase": "Phase 1 - Inisialisasi" },
    { "title": "Desain & Migrasi Skema Database PostgreSQL", "description": "Menulis DDL tabel users, items, bookings, payments, logs, membuat foreign keys dan index pencarian.", "status": "todo", "phase": "Phase 1 - Inisialisasi" },
    { "title": "Implementasi Sistem Autentikasi & Session Middleware", "description": "Membangun login, register, cookie session handling, dan middleware proteksi rute untuk RBAC.", "status": "todo", "phase": "Phase 2 - Autentikasi" },
    { "title": "Pembuatan Master Layout, Navigasi & Design System", "description": "Membangun Navbar, Sidebar, modal wrapper, alert component, dan layout responsif dark/light mode.", "status": "todo", "phase": "Phase 3 - Frontend Core" },
    { "title": "Halaman Katalog Utama & Fitur Penelusuran Interaktif", "description": "Menampilkan kartu item, pagination, filter multi-kategori, dan instant search bar.", "status": "todo", "phase": "Phase 3 - Frontend Core" },
    { "title": "Komponen Kalender & Pemilihan Slot Waktu Real-Time", "description": "Membuat antarmuka interaktif pemilihan jadwal dengan pengecekan ketersediaan slot langsung.", "status": "todo", "phase": "Phase 4 - Modul Transaksi" },
    { "title": "Alur Checkout, Validasi Pesanan & Formulir Data", "description": "Validasi form data pemesan menggunakan Zod, kalkulasi harga total, dan penyiapan order payload.", "status": "todo", "phase": "Phase 4 - Modul Transaksi" },
    { "title": "Integrasi Gateway Pembayaran & Webhook Listener", "description": "Menghubungkan API payment gateway (QRIS/VA), membuat endpoint /api/webhook untuk verifikasi otomatis.", "status": "todo", "phase": "Phase 5 - Integrasi" },
    { "title": "Penerbitan Invoice PDF & Pengiriman Notifikasi Otomatis", "description": "Membuat template invoice digital dan trigger pengiriman notifikasi konfirmasi sukses pesanan.", "status": "todo", "phase": "Phase 5 - Integrasi" },
    { "title": "Dashboard Admin: Manajemen Data Master & Inventaris", "description": "Membangun tabel CRUD data master dengan modal tambah/edit dan optimasi mutasi data.", "status": "todo", "phase": "Phase 6 - Dashboard Admin" },
    { "title": "Dashboard Admin: Analitik Pendapatan & Export Laporan", "description": "Visualisasi grafik performa penjualan dan fitur unduh laporan rekap transaksi (CSV/PDF).", "status": "todo", "phase": "Phase 6 - Dashboard Admin" },
    { "title": "Testing End-to-End, Security Hardening & Optimasi Performa", "description": "Melakukan uji alur dari login sampai pembayaran, audit keamanan header, dan kompresi bundle.", "status": "todo", "phase": "Phase 7 - QA & Deployment" },
    { "title": "Deployment Production ke Vercel & Monitoring", "description": "Konfigurasi domain kustom, DNS, environment variables production, dan setup monitoring error log.", "status": "todo", "phase": "Phase 7 - QA & Deployment" }
  ]
}
<<<END_BLUEPRINT_JSON>>>

PENTING:
- Pastikan format JSON valid tanpa syntax error.
- Hasilkan blueprint yang KAYA, SPESIFIK SESUAI TOPIK PENGGUNA, DAN SIAP DIGUNAKAN SEBAGAI PROMPT AI CODING TOOL.`;

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
                messages: [
                  ...p.messages,
                  {
                    id: "err-" + Date.now(),
                    role: "assistant",
                    content: `Maaf, terjadi gangguan koneksi ke AI: ${errMsg}. Silakan coba lagi.`,
                    createdAt: Date.now(),
                  },
                ],
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
      result = (
        before +
        "\n\n> **Blueprint Proyek Telah Dibuat:** PRD, daftar fitur, arsitektur teknis, dan papan task board telah otomatis diperbarui pada tab di atas!"
      );
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

        // Pastikan chat bubble menampilkan teks bersih
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
            updated.tasks = domainBlueprint.tasks;
          }
        }

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
    const text = `# PRD (Product Requirements Document) — ${activeProject.title}

## 1. Overview
${prd?.overview || activeProject.description || "Perencanaan sistem project."}

## 2. Problem Statement
${prd?.problemStatement || "Menyelesaikan inefisiensi dan memberikan solusi digital terstruktur."}

## 3. Goals & Objectives
${prd?.goals?.map((g, i) => `${i + 1}. ${g}`).join("\n") || "- Membangun sistem yang handal"}

## 4. Target Users
${prd?.targetUsers?.map((u) => `- ${u}`).join("\n") || "- Pengguna akhir"}

## 5. Functional Requirements
${prd?.functionalRequirements?.map((f, i) => `${i + 1}. ${f}`).join("\n") || "- Fitur utama aplikasi"}

## 6. Non-Functional Requirements
${prd?.nonFunctionalRequirements?.map((nf, i) => `${i + 1}. ${nf}`).join("\n") || "- Cepat, aman, dan responsif"}
`;
    navigator.clipboard.writeText(text);
    showCopyToast("PRD berhasil disalin ke Clipboard!");
  };

  const copyFeaturesText = () => {
    if (!activeProject) return;
    const features = activeProject.features || [];
    let text = `# Feature Specifications — ${activeProject.title}\n\n`;
    if (features.length === 0) {
      text += "Belum ada daftar fitur khusus yang tercatat.";
    } else {
      features.forEach((f, idx) => {
        text += `### Feature ${idx + 1}: ${f.name} [Priority: ${f.priority || "Medium"}]\n`;
        text += `${f.description}\n`;
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
    let text = `# Development Tasks & Roadmap — ${activeProject.title}\n\n`;
    const todo = tasks.filter((t) => t.status === "todo");
    const inProg = tasks.filter((t) => t.status === "in_progress");
    const done = tasks.filter((t) => t.status === "done");
    const failed = tasks.filter((t) => t.status === "failed");

    text += `## Total: ${tasks.length} Tasks (${calculateProgress(activeProject)}% Selesai)\n\n`;

    if (inProg.length > 0) {
      text += `### [IN PROGRESS] Sedang Dikerjakan (${inProg.length})\n`;
      inProg.forEach((t) => (text += `- [ ] **${t.title}**: ${t.description}\n`));
      text += "\n";
    }

    if (todo.length > 0) {
      text += `### [TODO] Belum Mulai (${todo.length})\n`;
      todo.forEach((t) => (text += `- [ ] **${t.title}**: ${t.description}\n`));
      text += "\n";
    }

    if (done.length > 0) {
      text += `### [DONE] Selesai (${done.length})\n`;
      done.forEach((t) => (text += `- [x] **${t.title}**: ${t.description}\n`));
      text += "\n";
    }

    if (failed.length > 0) {
      text += `### [BLOCKED] Kendala / Gagal (${failed.length})\n`;
      failed.forEach((t) => (text += `- [ ] **${t.title}**: ${t.description}\n`));
      text += "\n";
    }

    navigator.clipboard.writeText(text);
    showCopyToast("Tasks berhasil disalin ke Clipboard!");
  };

  const copyEverythingText = () => {
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
# Generated by: Usick One — Code Planner (Ngoding Pakai AI)

---
## 1. PROJECT OVERVIEW & PRD
- **Description**: ${prd?.overview || activeProject.description}
- **Problem Statement**: ${prd?.problemStatement || "Menyelesaikan inefisiensi dan memberikan solusi digital terstruktur."}
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
    showCopyToast("Master Context lengkap berhasil disalin!");
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
                      <span className={`font-semibold ${progress === 100 ? "text-emerald-500" : ""}`}>
                        {progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress === 100 ? "bg-emerald-500" : isDark ? "bg-white" : "bg-black"
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
  const progress = calculateProgress(activeProject);

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${isDark ? "bg-[#0c0c0e] text-white" : "bg-[#fafafc] text-black"}`}>
      {/* Toast Feedback */}
      {copyFeedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-black border border-zinc-700 dark:border-zinc-300 shadow-xl animate-in fade-in-0 duration-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Top Navbar */}
      <div className={`flex items-center justify-between px-3 sm:px-6 py-2.5 border-b backdrop-blur-md shrink-0 ${
        isDark ? "bg-[#0c0c0e]/95 border-zinc-850" : "bg-white/95 border-zinc-200"
      }`}>
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setActiveProjectId(null)}
            className={`p-1.5 rounded-xl transition ${isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-black"}`}
            title="Daftar Project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">{activeProject.title}</h2>
              <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                progress === 100
                  ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                  : isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-200"
              }`}>
                {progress}% Complete
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tombol Generate Blueprint Otomatis */}
          <button
            onClick={() => {
              const domain = detectProjectDomain(activeProject.messages, activeProject.title, activeProject.description);
              handleSendChatMessage(`Tolong langsung buatkan blueprint lengkap (PRD mendalam, daftar fitur detail, skema PostgreSQL DDL lengkap, user flow langkah-demi-langkah, dan actionable task development) yang 100% spesifik untuk ${domain.topicName} sekarang tanpa mengajukan pertanyaan lagi!`);
            }}
            disabled={isChatLoading}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition border ${
              isDark
                ? "border-zinc-750 bg-zinc-850 hover:bg-zinc-800 text-zinc-200"
                : "border-zinc-250 bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
            }`}
            title="Generate otomatis PRD, Features, dan Task Board"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="hidden sm:inline">Generate Blueprint</span>
          </button>

          {/* Copy Everything */}
          <button
            onClick={copyEverythingText}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition shadow-xs cursor-pointer ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                : "bg-black hover:bg-zinc-800 text-white shadow-black/20"
            }`}
            title="Salin semua spesifikasi untuk dipaste ke AI coding tool (Vibecode, Antigravity, Cursor, Bolt)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span className="hidden sm:inline">Copy Everything</span>
            <span className="sm:hidden">Copy</span>
          </button>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-black"}`}
            title="Tutup Workspace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className={`flex items-center gap-1 px-3 sm:px-6 py-2 border-b overflow-x-auto no-scrollbar shrink-0 text-xs font-medium ${
        isDark ? "border-zinc-850 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50/60"
      }`}>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === "chat"
              ? isDark ? "bg-zinc-800 text-white font-semibold" : "bg-white text-black font-semibold shadow-xs"
              : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-black"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          <span>AI Planner (Chat)</span>
        </button>

        <button
          onClick={() => setActiveTab("prd")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === "prd"
              ? isDark ? "bg-zinc-800 text-white font-semibold" : "bg-white text-black font-semibold shadow-xs"
              : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-black"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>PRD</span>
        </button>

        <button
          onClick={() => setActiveTab("features")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === "features"
              ? isDark ? "bg-zinc-800 text-white font-semibold" : "bg-white text-black font-semibold shadow-xs"
              : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-black"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          <span>Features {activeProject.features ? `(${activeProject.features.length})` : ""}</span>
        </button>

        <button
          onClick={() => setActiveTab("flow_arch")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === "flow_arch"
              ? isDark ? "bg-zinc-800 text-white font-semibold" : "bg-white text-black font-semibold shadow-xs"
              : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-black"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <span>Flow &amp; Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === "tasks"
              ? isDark ? "bg-zinc-800 text-white font-semibold" : "bg-white text-black font-semibold shadow-xs"
              : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-black"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <span>Task Board ({activeProject.tasks.length})</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: AI PLANNER CHAT */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5">
            {activeProject.messages.map((m) => {
              const isUser = m.role === "user";

              // Jika pesan AI, parse konten dan opsi pertanyaan pilihan ganda
              const rawClean = isUser ? "" : cleanChatDisplay(m.content);
              const { cleanText, questions } = isUser
                ? { cleanText: m.content, questions: [] }
                : parseQuestionsFromText(rawClean);

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
                      {!m.content ? (
                        /* Animasi Generate: Skeleton & Pulse Shimmer saat menunggu respons awal */
                        <div className="py-1">
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600 dark:bg-zinc-200"></span>
                            </span>
                            <span className="animate-pulse">Sedang menganalisis kebutuhan &amp; merumuskan blueprint proyek...</span>
                          </div>
                          <div className="space-y-2.5">
                            <div className="h-3 w-4/5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 animate-pulse" />
                            <div className="h-3 w-11/12 rounded-full bg-zinc-200/80 dark:bg-zinc-800 animate-pulse [animation-delay:0.2s]" />
                            <div className="h-3 w-2/3 rounded-full bg-zinc-200/80 dark:bg-zinc-800 animate-pulse [animation-delay:0.4s]" />
                          </div>
                        </div>
                      ) : (
                        <>
                          {isChatLoading && (
                            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-200/60 dark:border-zinc-800/60 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600 dark:bg-zinc-200"></span>
                              </span>
                              <span className="animate-pulse">AI sedang merancang spesifikasi &amp; blueprint proyek...</span>
                            </div>
                          )}

                          <MarkdownMessage content={cleanText} isDark={isDark} />

                          {isChatLoading && (
                            <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-zinc-700 dark:bg-zinc-300 animate-pulse rounded-2xs" />
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
            <button
              onClick={copyPRDText}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 00-2 2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span>Copy PRD</span>
            </button>
          </div>

          <div className={`p-5 rounded-2xl border space-y-5 text-xs sm:text-sm leading-relaxed ${
            isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
          }`}>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1">1. Project Overview</h4>
              <p>{activeProject.prd?.overview || activeProject.description || "Belum ada ringkasan PRD. Minta AI Planner di tab Chat untuk menyusun PRD."}</p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1">2. Problem Statement</h4>
              <p>{activeProject.prd?.problemStatement || "Menyelesaikan inefisiensi dan memberikan solusi digital terstruktur."}</p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">3. Goals &amp; Objectives</h4>
              <ul className="list-disc pl-5 space-y-1 text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                {activeProject.prd?.goals?.map((g, i) => <li key={i}>{g}</li>) || <li>Membuat MVP yang siap digunakan pengguna.</li>}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">4. Target Users</h4>
              <ul className="list-disc pl-5 space-y-1">
                {activeProject.prd?.targetUsers?.map((u, i) => <li key={i}>{u}</li>) || <li>End-user &amp; Administrator</li>}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">5. Functional Requirements</h4>
              <ul className="list-disc pl-5 space-y-1">
                {activeProject.prd?.functionalRequirements?.map((f, i) => <li key={i}>{f}</li>) || <li>Autentikasi, CRUD data, dan dashboard.</li>}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1.5">6. Non-Functional Requirements</h4>
              <ul className="list-disc pl-5 space-y-1">
                {activeProject.prd?.nonFunctionalRequirements?.map((nf, i) => <li key={i}>{nf}</li>) || <li>Performa cepat, aman, dan mobile-friendly.</li>}
              </ul>
            </div>
          </div>
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
            <button
              onClick={copyFeaturesText}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 00-2 2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span>Copy Features</span>
            </button>
          </div>

          {(!activeProject.features || activeProject.features.length === 0) ? (
            <div className={`p-8 rounded-2xl border text-center space-y-3 ${
              isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
            }`}>
              <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center bg-zinc-800/80 dark:bg-zinc-800 text-zinc-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm">Daftar Fitur Belum Dirumuskan</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  AI Planner dapat memecah kebutuhan proyek Anda menjadi modul-modul fitur hierarkis lengkap dengan sub-fitur dan prioritas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("chat");
                  handleSendChatMessage("Tolong buatkan daftar fitur hierarkis yang sangat detail dan mendalam (6-8 fitur utama dengan 4-6 sub-fitur per modul) untuk proyek ini sekarang.");
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                  isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                <span>Generate Fitur Lengkap Sekarang</span>
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
                      <h4 className="font-bold text-sm">{feat.name}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        feat.priority === "High"
                          ? isDark ? "bg-white text-black border-white font-bold" : "bg-black text-white border-black font-bold"
                          : feat.priority === "Medium"
                          ? isDark ? "bg-zinc-800 text-zinc-200 border-zinc-700" : "bg-zinc-100 text-zinc-800 border-zinc-300"
                          : isDark ? "bg-zinc-850 text-zinc-400 border-zinc-800" : "bg-zinc-50 text-zinc-500 border-zinc-200"
                      }`}>
                        {feat.priority || "Medium"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{feat.description}</p>

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
            <button
              onClick={() => {
                const text = `# Architecture & User Flow — ${activeProject.title}\n\n## User Flow\n${activeProject.userFlow}\n\n## Tech Stack\n${JSON.stringify(activeProject.architecture, null, 2)}`;
                navigator.clipboard.writeText(text);
                showCopyToast("Architecture berhasil disalin!");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 00-2 2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span>Copy Architecture</span>
            </button>
          </div>

          {/* User Flow Box */}
          <div className={`p-5 rounded-2xl border space-y-2 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">User Flow Map</h4>
            <div className={`p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto ${
              isDark ? "bg-black/50 text-zinc-200 border border-zinc-800/80" : "bg-zinc-50 text-zinc-900 border border-zinc-200"
            }`}>
              {activeProject.userFlow || "Landing Page -> Login -> Dashboard -> Fitur Utama -> Selesai"}
            </div>
          </div>

          {/* Tech Stack Cards */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"}`}>
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Tech Stack &amp; Infrastructure</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Frontend</span>
                <span className="font-semibold">{activeProject.architecture?.frontend || "Next.js 15, Tailwind CSS"}</span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Backend / API</span>
                <span className="font-semibold">{activeProject.architecture?.backend || "Next.js Server Actions / Node.js"}</span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Database</span>
                <span className="font-semibold">{activeProject.architecture?.database || "PostgreSQL (Supabase)"}</span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Authentication</span>
                <span className="font-semibold">{activeProject.architecture?.auth || "Supabase Auth / NextAuth"}</span>
              </div>
            </div>

            {/* Schema View */}
            {activeProject.architecture?.dataSchema && (
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
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyTasksText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 00-2 2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span>Copy Tasks</span>
              </button>

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

          {/* Kanban Columns Grid */}
          <div className="flex-1 overflow-x-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[800px] h-full items-start">
              {/* Kolom 1: BELUM MULAI */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Belum Mulai</span>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {activeProject.tasks.filter((t) => t.status === "todo").length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeProject.tasks
                    .filter((t) => t.status === "todo")
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

              {/* Kolom 2: DIKERJAKAN */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">Dikerjakan</span>
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

              {/* Kolom 3: SELESAI */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Selesai</span>
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

              {/* Kolom 4: GAGAL / BLOCKED */}
              <div className={`flex flex-col h-full rounded-2xl border p-3.5 ${
                isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-100/70 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Gagal / Kendala</span>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 border ${
                    isDark ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-200 text-zinc-700 border-zinc-350"
                  }`}>
                    {activeProject.tasks.filter((t) => t.status === "failed").length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeProject.tasks
                    .filter((t) => t.status === "failed")
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
                    <option value="todo">Belum Mulai</option>
                    <option value="in_progress">Dikerjakan</option>
                    <option value="done">Selesai</option>
                    <option value="failed">Gagal / Kendala</option>
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
// COMPONENT: Task Card di Kanban Board
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
  return (
    <div className={`p-3 rounded-xl border transition-all duration-200 group relative ${
      isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200 shadow-xs hover:border-zinc-300"
    }`}>
      <div className="flex items-start justify-between gap-1.5">
        <h5 className="font-bold text-xs leading-snug line-clamp-2">{task.title}</h5>
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

      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
        {task.description}
      </p>

      {task.phase && (
        <span className={`inline-block mt-2 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${
          isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-600"
        }`}>
          {task.phase}
        </span>
      )}

      {/* Status Selector Dropdown */}
      <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
        <span className="text-zinc-500 font-medium">Status:</span>
        <select
          value={task.status}
          onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
          className={`rounded-lg px-2 py-0.5 font-semibold text-[10px] border outline-none cursor-pointer ${
            task.status === "done"
              ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
              : task.status === "in_progress"
              ? isDark ? "bg-zinc-800 text-white border-zinc-600" : "bg-zinc-200 text-black border-zinc-400"
              : task.status === "failed"
              ? isDark ? "bg-zinc-850 text-zinc-400 border-zinc-700" : "bg-zinc-100 text-zinc-600 border-zinc-300"
              : isDark ? "bg-zinc-900 text-zinc-300 border-zinc-800" : "bg-zinc-50 text-zinc-700 border-zinc-300"
          }`}
        >
          <option value="todo">Belum Mulai</option>
          <option value="in_progress">Dikerjakan</option>
          <option value="done">Selesai</option>
          <option value="failed">Gagal / Kendala</option>
        </select>
      </div>
    </div>
  );
}

