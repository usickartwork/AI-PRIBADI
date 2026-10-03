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
        status: "in_progress",
        feature: "Admin Management Dashboard",
        phase: "Phase 3 - Management & Polish",
        acceptanceCriteria: ["Admin bisa ekspor laporan ke Excel/CSV", "Admin bisa blokir jadwal untuk maintenance"],
      },
      {
        id: "task-6",
        title: "Integrasi Notifikasi WhatsApp Pengingat Main",
        description: "Kirim pesan otomatis via WA 3 jam sebelum jadwal kick-off.",
        status: "in_progress",
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
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: ProjectItem) => ({
              ...p,
              tasks: (p.tasks || []).map((t: ProjectTask) => ({
                ...t,
                // Pastikan seluruh task aktif berstatus in_progress (tidak ada yang belum dikerjakan)
                status: (t.status === "done" || t.status === "failed") ? t.status : "in_progress",
              })),
              messages: (p.messages || []).map((m: ProjectChatMessage) => {
                if (m.role === "assistant" && (!m.content || !m.content.trim())) {
                  return {
                    ...m,
                    content: "Blueprint dan spesifikasi teknis proyek telah selesai dirumuskan. Anda dapat melihat detailnya pada tab PRD, Features, Flow & Architecture, dan Tasks di atas.",
                  };
                }
                return m;
              }),
            }));
          }
        }
      } catch {}
    }
    return DEFAULT_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mindmap" | "chat" | "prd" | "features" | "flow_arch" | "tasks">("mindmap");
  const [isPerencanaanOpen, setIsPerencanaanOpen] = useState(true);
  const [isPerencanaanExpanded, setIsPerencanaanExpanded] = useState(false);
  const [perencanaanMode, setPerencanaanMode] = useState<"prd" | "code">("prd");
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
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("in_progress");
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

  const generateInitialDiscoveryQuestions = (title: string, desc?: string): { welcomeText: string; questionsJson: string } => {
    const domain = detectProjectDomain([], title, desc);
    let questions: { id: string; question: string; options: string[] }[] = [];

    if (domain.isPhotography) {
      questions = [
        {
          id: "q1",
          question: "Siapa target klien utama dan genre fotografi yang difokuskan?",
          options: [
            "Wedding, Prewedding & Pasangan",
            "Personal Portrait, Wisuda & Model",
            "Commercial, Brand Fashion & Produk",
            "Event, Konser & Corporate Gathering",
          ],
        },
        {
          id: "q2",
          question: "Bagaimana sistem booking dan pemilihan paket photoshoot?",
          options: [
            "Kalender reservasi interaktif real-time dengan pilihan studio/outdoor",
            "Pilihan paket berjenjang (Bronze, Silver, Gold) beserta opsi add-ons",
            "Formulir brief konsep foto dengan konsultasi via WhatsApp",
          ],
        },
        {
          id: "q3",
          question: "Apakah memerlukan fitur Client Proofing Portal untuk seleksi foto ber-watermark?",
          options: [
            "Ya, wajib ada portal privat seleksi foto ber-watermark untuk klien",
            "Cukup galeri hasil foto final yang siap diunduh batch (ZIP)",
            "Hanya showcase portofolio publik tanpa portal klien privat",
          ],
        },
        {
          id: "q4",
          question: "Bagaimana alur pembayaran yang Anda rencanakan?",
          options: [
            "Pembayaran bertahap (DP 50% di awal + Pelunasan sebelum unduh file final)",
            "Pembayaran penuh 100% di awal via QRIS / Virtual Account",
            "Manual transfer bank dengan konfirmasi kasir",
          ],
        },
      ];
    } else if (/futsal|lapangan|badminton|booking|reservasi|jadwal/.test((title + " " + (desc || "")).toLowerCase())) {
      questions = [
        {
          id: "q1",
          question: "Siapa target pengguna dan operator utama aplikasi?",
          options: [
            "Penyewa umum (Customer) & Pengelola lapangan (Admin)",
            "Member komunitas olahraga dengan sistem langganan",
            "Multi-venue (Banyak pemilik lapangan bergabung dalam satu platform)",
          ],
        },
        {
          id: "q2",
          question: "Bagaimana mekanisme pemilihan jadwal & slot ketersediaan lapangan?",
          options: [
            "Kalender slot per jam real-time dengan penguncian slot otomatis (15 menit)",
            "Jadwal fleksibel dengan sistem request dan persetujuan admin",
            "Pemesanan sesi berulang (membership mingguan/bulanan)",
          ],
        },
        {
          id: "q3",
          question: "Metode pembayaran apa saja yang ingin didukung?",
          options: [
            "Otomatis via QRIS & Virtual Account (Midtrans / Xendit)",
            "Pembayaran DP di awal, sisa bayar di lokasi (Cash on Spot)",
            "Manual transfer bank dengan upload bukti bayar",
          ],
        },
        {
          id: "q4",
          question: "Apakah memerlukan notifikasi pengingat otomatis?",
          options: [
            "Ya, kirim WhatsApp / Email pengingat jadwal H-1 dan bukti invoice",
            "Cukup riwayat booking di dashboard pengguna",
          ],
        },
      ];
    } else if (/toko|olshop|ecommerce|belanja|produk|store/.test((title + " " + (desc || "")).toLowerCase())) {
      questions = [
        {
          id: "q1",
          question: "Jenis produk apa yang dijual dan bagaimana model bisnisnya?",
          options: [
            "Produk fisik dengan pengiriman ekspedisi (JNE/J&T/SiCepat)",
            "Produk digital (file, template, lisensi unduh instan)",
            "Multi-vendor marketplace (banyak seller)",
          ],
        },
        {
          id: "q2",
          question: "Bagaimana alur checkout dan perhitungan ongkir?",
          options: [
            "Kalkulasi ongkir otomatis via API RajaOngkir / Biteship + Payment Gateway",
            "Checkout langsung diarahkan ke chat WhatsApp admin",
            "Sistem keranjang belanja & bayar di tempat (COD)",
          ],
        },
        {
          id: "q3",
          question: "Apakah pengguna wajib mendaftar akun untuk berbelanja?",
          options: [
            "Bisa guest checkout (tanpa akun) dan opsi login Google",
            "Wajib login akun member untuk mengumpulkan poin reward",
          ],
        },
      ];
    } else {
      questions = [
        {
          id: "q1",
          question: `Siapa target pengguna utama untuk proyek ${title}?`,
          options: [
            "Pengguna umum / Konsumen akhir (B2C)",
            "Pelaku bisnis, UMKM, atau perusahaan (B2B)",
            "Internal tim operasional & staf perusahaan",
          ],
        },
        {
          id: "q2",
          question: "Bagaimana sistem autentikasi dan hak akses pengguna?",
          options: [
            "Multi-role (Administrator, Staff Operasional, Customer)",
            "Login cepat via Google OAuth & Email Magic Link",
            "Dapat diakses publik tanpa perlu login",
          ],
        },
        {
          id: "q3",
          question: "Apa fungsi dan modul paling krusial yang wajib ada di versi awal (MVP)?",
          options: [
            "Katalog data interaktif, pencarian cepat & modul transaksi otomatis",
            "Formulir pengisian data terstruktur dengan validasi ketat & ekspor laporan",
            "Dashboard analitik, grafik visualisasi performa, dan manajemen data CRUD",
          ],
        },
        {
          id: "q4",
          question: "Bagaimana model arsitektur teknis yang Anda harapkan?",
          options: [
            "Next.js 15 App Router + PostgreSQL Supabase (Modern, Cepat & Skalabel)",
            "REST API Route Handlers terpadu dengan autentikasi session cookie",
            "Integrasi payment gateway (QRIS/VA) dan notifikasi pesan instan",
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
          { id: "task-photo-1", title: "Setup Next.js 15 App Router & Database PostgreSQL Supabase", description: "Inisialisasi project, pasang Tailwind CSS, TypeScript, Lucide Icons, dan setup koneksi Supabase client.", status: "in_progress" as const, feature: "Setup & Fondasi", phase: "Phase 1 - Inisialisasi" },
          { id: "task-photo-2", title: "Migrasi Skema Database: Fotografer, Paket, Bookings, Proofing Gallery & Payments", description: "Menjalankan migrasi DDL SQL lengkap dengan tabel relasional, foreign keys, dan index.", status: "in_progress" as const, feature: "Setup & Fondasi", phase: "Phase 1 - Inisialisasi" },
          { id: "task-photo-3", title: "Implementasi Landing Page & Masonry Portfolio Grid dengan Lightbox EXIF", description: "Membangun tampilan galeri foto responsif dengan modal lightbox dan pembacaan EXIF data kamera.", status: "in_progress" as const, feature: "Showcase Portofolio", phase: "Phase 2 - Showcase" },
          { id: "task-photo-4", title: "Sistem Filter Kategori Portofolio & Showcase Testimoni Klien", description: "Filter interaktif (Wedding, Prewedding, Portrait, Commercial) dan ulasan klien terverifikasi.", status: "in_progress" as const, feature: "Showcase Portofolio", phase: "Phase 2 - Showcase" },
          { id: "task-photo-5", title: "Komponen Kalender Interaktif & Pemilihan Slot Jadwal Sesi Pemotretan", description: "Kalender visual ketersediaan fotografer & studio dengan proteksi pencegahan bentrok jadwal.", status: "in_progress" as const, feature: "Booking Engine", phase: "Phase 3 - Booking Engine" },
          { id: "task-photo-6", title: "Formulir Reservasi Paket Foto, Add-ons (MUA/Ekstra Jam) & Validasi Zod", description: "Form multi-step pengisian data klien, pilihan paket, add-ons, dan validasi schema Zod.", status: "in_progress" as const, feature: "Booking Engine", phase: "Phase 3 - Booking Engine" },
          { id: "task-photo-7", title: "Integrasi Payment Gateway QRIS & VA untuk Pembayaran DP 50%", description: "Koneksi ke API payment gateway untuk generate QRIS instan dan Virtual Account pembayaran DP.", status: "in_progress" as const, feature: "Pembayaran", phase: "Phase 4 - Pembayaran" },
          { id: "task-photo-8", title: "Webhook Handler Pembayaran DP & Notifikasi WhatsApp Konfirmasi Jadwal", description: "Endpoint /api/webhook untuk verifikasi pelunasan DP dan trigger pesan WA konfirmasi jadwal.", status: "in_progress" as const, feature: "Pembayaran", phase: "Phase 4 - Pembayaran" },
          { id: "task-photo-9", title: "Portal Client Proofing: Private Access Link & Watermark Photo Viewer", description: "Halaman privat klien dengan token unik untuk melihat foto mentah dengan overlay watermark.", status: "in_progress" as const, feature: "Proofing Portal", phase: "Phase 5 - Proofing Portal" },
          { id: "task-photo-10", title: "Fitur Seleksi Foto Klien (Love/Favorite) dengan Catatan Revisi Retouch", description: "Antarmuka interaktif memilih foto kuota paket dan memberi instruksi editing per foto.", status: "in_progress" as const, feature: "Proofing Portal", phase: "Phase 5 - Proofing Portal" },
          { id: "task-photo-11", title: "Pipeline Admin Studio: Manajemen Status Editing & Upload Hasil High-Res", description: "Board status pengerjaan (Booked -> Shot -> Editing -> Ready) dan upload foto resolusi penuh.", status: "in_progress" as const, feature: "Delivery", phase: "Phase 6 - Delivery" },
          { id: "task-photo-12", title: "Invoice Pelunasan Otomatis & Gerbang Unduh File Digital Resolusi Penuh (ZIP)", description: "Verifikasi pelunasan akhir sebelum membukakan akses download file ZIP resolusi tinggi 300 DPI.", status: "in_progress" as const, feature: "Delivery", phase: "Phase 6 - Delivery" },
          { id: "task-photo-13", title: "Dashboard Studio: Kalender Penugasan Fotografer & Rekap Keuangan", description: "Monitoring penugasan tim fotografer, jadwal pemotretan aktif, dan rekapitulasi omzet studio.", status: "in_progress" as const, feature: "Studio Management", phase: "Phase 6 - Dashboard Admin" },
          { id: "task-photo-14", title: "Automasi Watermarking dengan Sharp & Cloud Presigned URL", description: "Worker background untuk meng-apply watermark dinamis pada foto yang diunggah dan generate presigned URL download.", status: "in_progress" as const, feature: "Proofing Portal", phase: "Phase 5 - Proofing Portal" },
          { id: "task-photo-15", title: "Audit Keamanan Token Proofing & Rate Limiting Endpoint", description: "Proteksi brute force link proofing, sanitasi akses unduhan, dan pengujian otorisasi session.", status: "in_progress" as const, feature: "QA & Hardening", phase: "Phase 7 - QA & Deployment" },
          { id: "task-photo-16", title: "Testing Menyeluruh, Optimasi Core Web Vitals & Production Deployment", description: "Audit performa galeri foto WebP/AVIF, stress test kalender booking, dan rilis ke production Vercel.", status: "in_progress" as const, feature: "QA & Hardening", phase: "Phase 7 - QA & Deployment" }
        ]
      };
    }

    return {
      prd: {
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
        { id: "t-01", title: "Setup Inisialisasi Proyek, Konfigurasi Lingkungan & Tooling", description: "Inisialisasi Next.js 15 App Router, TypeScript, Tailwind CSS, ESLint, Prettier, dan file konfigurasi environment variables (.env.example).", status: "in_progress" as const, feature: "Fondasi", phase: "Phase 1 - Inisialisasi" },
        { id: "t-02", title: "Desain Skema Database Relasional PostgreSQL, DDL & Indexes", description: "Menulis skrip DDL SQL untuk tabel users, categories, items_services, orders_bookings, payments, reviews, dan audit logs beserta foreign keys dan B-Tree indexes.", status: "in_progress" as const, feature: "Fondasi", phase: "Phase 1 - Inisialisasi" },
        { id: "t-03", title: "Implementasi Sistem Autentikasi Pengguna & Session Middleware", description: "Membangun endpoint login, register, hash password Argon2/Bcrypt, session cookie HttpOnly aman, dan middleware route guard Next.js untuk proteksi rute.", status: "in_progress" as const, feature: "Autentikasi", phase: "Phase 2 - Autentikasi" },
        { id: "t-04", title: "Modul Manajemen Profil Pengguna, Reset Password & Role Guard", description: "Halaman edit profil pengguna, avatar upload, alur lupa password via email token terenkripsi, dan pembagian hak akses (Customer, Staff, Admin).", status: "in_progress" as const, feature: "Autentikasi", phase: "Phase 2 - Autentikasi" },
        { id: "t-05", title: "Pembuatan Master Layout, Design System & App Shell Responsif", description: "Membangun komponen Navbar, Sidebar navigasi, modal wrapper, alert toast, dan layout adaptif responsif dark/light mode yang konsisten.", status: "in_progress" as const, feature: "Frontend Core", phase: "Phase 3 - Frontend Core" },
        { id: "t-06", title: "Halaman Penelusuran Katalog, Instant Debounce Search & Filter", description: "Menampilkan kartu data dinamis dengan instant search bar (debounce 250ms), multi-filter kategori, urutan harga, dan pagination/infinite scroll.", status: "in_progress" as const, feature: "Katalog", phase: "Phase 3 - Frontend Core" },
        { id: "t-07", title: "Halaman Detail Entitas/Layanan dengan Visual Showcase", description: "Membangun tampilan detail item dengan galeri gambar responsif, deskripsi mendalam, accordion spesifikasi teknis, dan indikator status ketersediaan live.", status: "in_progress" as const, feature: "Katalog", phase: "Phase 3 - Frontend Core" },
        { id: "t-08", title: "Mesin Pemesanan Transaksi, Validasi Zod & Concurrency Locking", description: "Formulir interaktif multi-step dengan validasi skema Zod ketat di sisi klien/server dan mekanisme atomic holding lock 15 menit untuk mencegah double order.", status: "in_progress" as const, feature: "Transaksi", phase: "Phase 4 - Modul Transaksi" },
        { id: "t-09", title: "Kalkulator Checkout Otomatis: Biaya, Kupon & Breakdown Tagihan", description: "Kalkulasi otomatis subtotal, kode unik transaksi, potongan voucher diskon, dan estimasi rincian biaya transparan sebelum pembayaran dilakukan.", status: "in_progress" as const, feature: "Transaksi", phase: "Phase 4 - Modul Transaksi" },
        { id: "t-10", title: "Integrasi Gateway Pembayaran Digital (QRIS Dinamis & Virtual Account)", description: "Menghubungkan API payment gateway (Midtrans / Xendit) untuk menerbitkan QRIS dinamis dan nomor Virtual Account perbankan secara real-time.", status: "in_progress" as const, feature: "Pembayaran", phase: "Phase 5 - Integrasi" },
        { id: "t-11", title: "Endpoint Webhook Listener & Rekonsiliasi Otomatis Status Order", description: "Membuat endpoint /api/webhook/payment dengan verifikasi signature cryptographic untuk mengupdate status pembayaran dan order menjadi settlement.", status: "in_progress" as const, feature: "Pembayaran", phase: "Phase 5 - Integrasi" },
        { id: "t-12", title: "Penerbitan Invoice PDF Digital & Integrasi Notifikasi WhatsApp", description: "Menghasilkan invoice PDF otomatis dengan barcode verifikasi transaksi dan memicu pengiriman pesan bukti sukses pesanan via WhatsApp Gateway (Fonnte).", status: "in_progress" as const, feature: "Notifikasi", phase: "Phase 5 - Integrasi" },
        { id: "t-13", title: "Dashboard Admin: Visualisasi Grafik Analitik Omzet & KPI Bisnis", description: "Membangun kartu ringkasan omzet, rasio pesanan sukses, grafik batang pendapatan harian/bulanan, dan metrik retensi pelanggan berbasis data nyata.", status: "in_progress" as const, feature: "Dashboard Admin", phase: "Phase 6 - Dashboard Admin" },
        { id: "t-14", title: "Dashboard Admin: Manajemen Data Master CRUD & Export CSV/Excel", description: "Tabel interaktif data master dengan modal tambah/edit berkas, filter status, bulk delete, serta fitur unduh laporan rekapitulasi ke format CSV/Excel.", status: "in_progress" as const, feature: "Dashboard Admin", phase: "Phase 6 - Dashboard Admin" },
        { id: "t-15", title: "Testing Menyeluruh End-to-End, Error Boundary & Logging", description: "Pengujian skenario alur dari registrasi, penelusuran, checkout holding lock, pembayaran webhook sampai invoice, serta pengujian error boundary.", status: "in_progress" as const, feature: "QA & Hardening", phase: "Phase 7 - QA & Deployment" },
        { id: "t-16", title: "Security Hardening, Optimasi Core Web Vitals & Deploy ke Production", description: "Audit header keamanan (CSP, X-Frame-Options), optimasi kompresi gambar Next.js Image, audit performa Lighthouse, dan rilis production ke Vercel.", status: "in_progress" as const, feature: "QA & Hardening", phase: "Phase 7 - QA & Deployment" }
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
      systemPrompt = `Kamu adalah AI Project Planner, Product Manager, System Analyst, dan Software Architect kelas dunia.
Pengguna telah menjawab seluruh pertanyaan klarifikasi kebutuhan untuk proyek: "${domain.topicName}" (Nama project di workspace: "${currentProject.title}"). Deskripsi awal: "${currentProject.description || "N/A"}".

PERHATIAN KRUSIAL TENTANG TOPIK:
- Pengguna mendiskusikan topik: "${domain.topicName}".
- Kamu WAJIB menyusun seluruh analisis secara 100% spesifik dan mendalam sesuai domain "${domain.topicName}".
- DILARANG KERAS menggunakan istilah umum atau contoh template seperti "items", "venues", atau "COba"!
${domain.isPhotography ? `- KHUSUS PROYEK FOTOGRAFI: Wajib mencakup Showcase Portofolio Masonry dengan EXIF data kamera/lensa, Kalender Booking Sesi Photoshoot (Studio & Outdoor), Pilihan Paket Foto (Wedding, Prewedding, Portrait, Event) & Add-ons (MUA, extra hours, album cetak), Client Proofing Portal ber-watermark untuk seleksi foto klien, High-Res Digital Delivery / Cloud ZIP Download, Pembayaran Bertahap (DP 50% & Pelunasan), dan Skema DDL SQL nyata dengan tabel photographers, photo_packages, shoot_bookings, client_galleries, gallery_photos, retouch_requests, invoices.` : ""}

ATURAN KEDALAMAN & KELENGKAPAN OUTPUT (WAJIB DIIKUTI SECARA KETAT):
1. PRD HARUS SANGAT PANJANG, LENGKAP & MENDALAM:
   - overview: 2-3 paragraf kaya konteks dan berbobot.
   - problemStatement: uraian detail pain points nyata yang diselesaikan.
   - goals: MINIMAL 8 target terukur (G-01 s/d G-08).
   - targetUsers: MINIMAL 4 persona lengkap dengan tanggung jawab dan kebutuhan.
   - functionalRequirements: MINIMAL 16 requirement fungsional detail (FR-01 s/d FR-16).
   - nonFunctionalRequirements: MINIMAL 8 requirement performa & keamanan (NFR-01 s/d NFR-08).
2. FITUR WAJIB MINIMAL 8 SAMPAI 10 MODUL LENGKAP:
   - Setiap fitur harus memiliki nama profesional, deskripsi mendalam, priority, 4-5 subFeatures detail, dan dependencies.
3. USER FLOW WAJIB LENGKAP:
   - 10-12 tahapan alur pengguna berkesinambungan dari awal hingga purna-jual.
4. ARSITEKTUR & SQL DDL:
   - Skema CREATE TABLE lengkap untuk 6-8 tabel relasional dengan tipe data, primary key gen_random_uuid(), foreign keys ON DELETE, dan CREATE INDEX.
5. TASKS WAJIB MINIMAL 16 SAMPAI 20 ACTIONABLE DEVELOPMENT TASKS:
   - Terbagi rapi ke dalam Phase 1 sampai Phase 7.
   - Setiap task harus jelas apa yang dibangun dan bagaimana eksekusinya.
   - Status setiap task WAJIB "in_progress" (aktif sedang diproses dan dianalisis kelayakan pengerjaannya). DILARANG KERAS menggunakan status "todo" atau belum dikerjakan!
DILARANG KERAS menghasilkan output ringkas atau minimalis! Pengguna menuntut arsitektur yang sangat kaya, komprehensif, dan siap produksi.

FORMAT OUTPUT WAJIB:
Berikan pengantar singkat profesional (1-2 paragraf) lalu sertakan blok blueprint lengkap di akhir respon:

<<<BLUEPRINT_JSON>>>
{
  "prd": {
    "overview": "...",
    "problemStatement": "...",
    "goals": ["G-01...", "G-02...", "G-03...", "G-04...", "G-05...", "G-06...", "G-07...", "G-08..."],
    "targetUsers": ["...", "...", "...", "..."],
    "functionalRequirements": ["FR-01...", "FR-02...", "FR-03...", "FR-04...", "FR-05...", "FR-06...", "FR-07...", "FR-08...", "FR-09...", "FR-10...", "FR-11...", "FR-12...", "FR-13...", "FR-14...", "FR-15...", "FR-16..."],
    "nonFunctionalRequirements": ["NFR-01...", "NFR-02...", "NFR-03...", "NFR-04...", "NFR-05...", "NFR-06...", "NFR-07...", "NFR-08..."]
  },
  "features": [
    {
      "name": "...",
      "description": "...",
      "priority": "High",
      "subFeatures": ["...", "...", "...", "..."],
      "dependencies": ["..."]
    }
  ],
  "userFlow": "1. ... -> 2. ... -> 3. ... -> 4. ... -> 5. ... -> 6. ... -> 7. ... -> 8. ... -> 9. ... -> 10. ...",
  "architecture": {
    "frontend": "Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, Framer Motion",
    "backend": "Next.js Route Handlers & Server Actions, Zod Schema Validation",
    "database": "PostgreSQL (Supabase / Neon) dengan RLS & Indexes",
    "auth": "Supabase Auth / NextAuth dengan secure HttpOnly session cookie",
    "storage": "Supabase Storage / Cloudflare R2",
    "deployment": "Vercel (Edge Network)",
    "dataSchema": "CREATE TABLE ..."
  },
  "tasks": [
    { "title": "...", "description": "...", "status": "in_progress", "phase": "Phase 1 - Inisialisasi", "feature": "Core" }
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

        if (blueprintData) {
          if (blueprintData.prd) {
            updated.prd = {
              ...domainBlueprint.prd,
              ...blueprintData.prd,
              goals: (Array.isArray(blueprintData.prd.goals) && blueprintData.prd.goals.length >= 6)
                ? blueprintData.prd.goals
                : domainBlueprint.prd.goals,
              functionalRequirements: (Array.isArray(blueprintData.prd.functionalRequirements) && blueprintData.prd.functionalRequirements.length >= 10)
                ? blueprintData.prd.functionalRequirements
                : domainBlueprint.prd.functionalRequirements,
              nonFunctionalRequirements: (Array.isArray(blueprintData.prd.nonFunctionalRequirements) && blueprintData.prd.nonFunctionalRequirements.length >= 5)
                ? blueprintData.prd.nonFunctionalRequirements
                : domainBlueprint.prd.nonFunctionalRequirements,
              targetUsers: (Array.isArray(blueprintData.prd.targetUsers) && blueprintData.prd.targetUsers.length >= 3)
                ? blueprintData.prd.targetUsers
                : domainBlueprint.prd.targetUsers,
            };
          } else {
            updated.prd = domainBlueprint.prd;
          }

          if (Array.isArray(blueprintData.features) && blueprintData.features.length >= 6) {
            updated.features = blueprintData.features.map((f: any, idx: number) => ({
              id: "feat-" + (idx + 1),
              name: f.name || "Feature " + (idx + 1),
              description: f.description || "",
              priority: f.priority || "Medium",
              subFeatures: Array.isArray(f.subFeatures) ? f.subFeatures : [],
              dependencies: Array.isArray(f.dependencies) ? f.dependencies : [],
            }));
          } else {
            // Jika fitur dari LLM sedikit, gunakan fitur lengkap domain agar selalu kaya & mendalam
            updated.features = domainBlueprint.features;
          }

          if (blueprintData.userFlow && String(blueprintData.userFlow).length > 40) {
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

          if (Array.isArray(blueprintData.tasks) && blueprintData.tasks.length >= 12) {
            updated.tasks = blueprintData.tasks.map((t: any, idx: number) => ({
              id: "task-" + (idx + 1) + "-" + Date.now(),
              title: t.title || "Task " + (idx + 1),
              description: t.description || "",
              status: (t.status === "done" || t.status === "failed") ? t.status : "in_progress",
              phase: t.phase || "Phase " + (Math.floor(idx / 3) + 1),
              feature: t.feature || "Core",
            }));
          } else {
            // Jika tasks dari LLM sedikit, gunakan 16 tasks komprehensif berfase dari blueprint domain
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
  const domain = detectProjectDomain(activeProject.messages, activeProject.title, activeProject.description);
  const domainBlueprint = getDomainBlueprint(domain, activeProject.title);
  const displayFeatures = (activeProject.features && activeProject.features.length > 0) ? activeProject.features : domainBlueprint.features;
  const displayTasks = (activeProject.tasks && activeProject.tasks.length > 0) ? activeProject.tasks : domainBlueprint.tasks;
  const displayPrd = activeProject.prd || domainBlueprint.prd;
  const displayArch = activeProject.architecture || domainBlueprint.architecture;

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
          </div>

          {/* Primary CTA: Lanjutkan Proyek (Themed Button) */}
          <button
            onClick={copyEverythingText}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer active:scale-95 ${
              isDark
                ? "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                : "bg-black hover:bg-zinc-800 text-white shadow-black/10"
            }`}
            title="Salin Master Context & Prompt untuk implementasi proyek di AI coding tool"
          >
            <span>Lanjutkan proyek</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

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
                <span>{displayFeatures.length} fitur dari rencana ini.</span>
              </div>

              {/* Drawer Body: Formatted PRD Document */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs leading-relaxed select-text">
                {perencanaanMode === "prd" ? (
                  <>
                    <div>
                      <h3 className="text-base font-bold tracking-tight mb-3">
                        PRD — Project Requirements Document
                      </h3>
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
          <div className={`flex-1 overflow-auto p-8 sm:p-12 relative flex items-center ${
            isDark ? "bg-[#070a12]" : "bg-[#f8fafc]"
          }`}>
            <div
              className="flex items-center gap-0 transition-transform duration-200 origin-left select-none"
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
                      <div className={`w-[220px] p-3 rounded-xl border shadow-md space-y-1.5 ${
                        isDark ? "bg-[#121827] border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          SUB-FITUR
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
                        <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-800">
                          Lihat rincian ({feat.subFeatures?.length || 3})
                        </span>
                      </div>

                      {/* Small Connecting SVG between Sub-fitur & Tasks */}
                      <div className="w-[50px] h-[20px] shrink-0">
                        <svg className="w-full h-full">
                          <path d="M 0 10 L 50 10" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.5" fill="none" />
                        </svg>
                      </div>

                      {/* 3. Tasks Card */}
                      <div className={`w-[230px] p-3 rounded-xl border shadow-md space-y-1.5 ${
                        isDark ? "bg-[#0f1422] border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          TASKS
                        </span>
                        <div className="space-y-1">
                          {(featureTasks.length > 0 ? featureTasks.slice(0, 3) : displayTasks.slice(i * 2, i * 2 + 3)).map((t, ti) => (
                            <div key={ti} className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                              <span className={`font-bold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>✓</span>
                              <span className="truncate">{t.title}</span>
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-800">
                          Lihat semua
                        </span>
                      </div>
                    </div>
                  );
                })}
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

                          <MarkdownMessage content={cleanText || "Blueprint dan spesifikasi teknis proyek telah selesai dirumuskan dan diperbarui pada tab di atas."} isDark={isDark} />

                          {isAssistantLoading && (
                            <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-zinc-700 dark:bg-zinc-300 animate-pulse rounded-2xs" />
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
                    <option value="in_progress">Dikerjakan (Aktif)</option>
                    <option value="done">Selesai</option>
                    <option value="failed">Gagal / Kendala</option>
                    <option value="todo">Belum Mulai</option>
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
          <option value="in_progress">Dikerjakan (Aktif)</option>
          <option value="done">Selesai</option>
          <option value="failed">Gagal / Kendala</option>
          <option value="todo">Belum Mulai</option>
        </select>
      </div>
    </div>
  );
}

