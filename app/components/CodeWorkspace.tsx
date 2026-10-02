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
  const chatInputRef = useRef<HTMLInputElement>(null);

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

  const handleSelectOther = (question: string) => {
    setChatInput(`Mengenai "${question}": `);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);
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

    const systemPrompt = `Kamu adalah AI Project Planner, Product Manager, System Analyst, dan Software Architect kelas dunia.
Pengguna sedang mengembangkan ide project: "${activeProject.title}". Deskripsi awal: "${activeProject.description || "N/A"}".

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

FASE 2: BLUEPRINT GENERATION (PRD, Arsitektur & Tasks):
Jika pengguna sudah menjawab pertanyaan discovery, ATAU pengguna secara eksplisit meminta: "buatkan prd", "generate blueprint", "rancang arsitektur", "buatkan task", atau informasi sudah cukup:
- Berikan kesimpulan singkat (1-2 paragraf) bahwa seluruh spesifikasi telah dipahami.
- WAJIB MENYERTAKAN BLOK BLUEPRINT LENGKAP di akhir respon menggunakan format persis berikut:

<<<BLUEPRINT_JSON>>>
{
  "prd": {
    "overview": "Ringkasan jelas project...",
    "problemStatement": "Masalah nyata yang diselesaikan...",
    "goals": ["Goal 1", "Goal 2", "Goal 3"],
    "targetUsers": ["Target user 1", "Target user 2"],
    "functionalRequirements": ["Requirement 1", "Requirement 2", "Requirement 3", "Requirement 4"],
    "nonFunctionalRequirements": ["Kecepatan < 1s", "Keamanan enkripsi", "Desain mobile-first"]
  },
  "features": [
    {
      "name": "Nama Fitur 1",
      "description": "Deskripsi fitur...",
      "priority": "High",
      "subFeatures": ["Sub fitur A", "Sub fitur B"]
    },
    {
      "name": "Nama Fitur 2",
      "description": "Deskripsi fitur...",
      "priority": "Medium",
      "subFeatures": ["Sub fitur A", "Sub fitur B"]
    }
  ],
  "userFlow": "1. Halaman Depan -> 2. Autentikasi -> 3. Dashboard -> 4. Aksi Utama -> 5. Selesai",
  "architecture": {
    "frontend": "Next.js (App Router), Tailwind CSS",
    "backend": "Next.js Server Actions / API Routes",
    "database": "PostgreSQL (Supabase)",
    "auth": "Supabase Auth",
    "storage": "Supabase Storage",
    "deployment": "Vercel",
    "dataSchema": "Table: users (id, name, email)\\nTable: items (id, user_id, title)"
  },
  "tasks": [
    { "title": "Setup repository & database schema", "description": "Inisialisasi arsitektur dan tabel database.", "status": "todo", "phase": "Phase 1 - Setup" },
    { "title": "Implementasi Autentikasi & Akun Pengguna", "description": "Login, register, dan middleware proteksi.", "status": "todo", "phase": "Phase 1 - Setup" },
    { "title": "Pembangunan Fitur Inti Aplikasi", "description": "Halaman antarmuka dan logika bisnis utama.", "status": "todo", "phase": "Phase 2 - Core" },
    { "title": "Integrasi Database & API Query", "description": "Menghubungkan antarmuka dengan database backend.", "status": "todo", "phase": "Phase 2 - Core" },
    { "title": "Testing, UI Polish & Deployment", "description": "Pemeriksaan fungsi dan deploy ke production.", "status": "todo", "phase": "Phase 3 - Release" }
  ]
}
<<<END_BLUEPRINT_JSON>>>

PENTING:
- Pastikan format JSON valid.
- Jangan membuat teks narasi terlalu panjang bertele-tele di luar JSON agar tidak terpotong token limit.`;

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
  const cleanChatDisplay = (text: string): string => {
    const jsonStart = text.indexOf("<<<BLUEPRINT_JSON>>>");
    if (jsonStart !== -1) {
      const before = text.slice(0, jsonStart).trim();
      return (
        before +
        "\n\n> **Blueprint Proyek Telah Dibuat:** PRD, daftar fitur, arsitektur teknis, dan papan task board telah otomatis diperbarui pada tab di atas!"
      );
    }
    return text;
  };

  // Parser Blueprint JSON untuk mengisi otomatis tab PRD, Features, Flow, Architecture, dan Tasks
  const parseAndApplyBlueprint = (projId: string, fullText: string, assistantMsgId: string) => {
    let blueprintData: any = null;

    const startTag = "<<<BLUEPRINT_JSON>>>";
    const endTag = "<<<END_BLUEPRINT_JSON>>>";

    const sIdx = fullText.indexOf(startTag);
    const eIdx = fullText.indexOf(endTag);

    if (sIdx !== -1 && eIdx !== -1) {
      const jsonStr = fullText.slice(sIdx + startTag.length, eIdx).trim();
      try {
        blueprintData = JSON.parse(jsonStr);
      } catch (e) {
        console.warn("Failed to parse blueprint JSON:", e);
      }
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;

        const updated = { ...p };

        // Pastikan chat bubble menampilkan teks bersih
        updated.messages = updated.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, content: cleanChatDisplay(fullText) } : m
        );

        if (blueprintData) {
          if (blueprintData.prd) {
            updated.prd = {
              ...updated.prd,
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
          }

          if (blueprintData.userFlow) {
            updated.userFlow = String(blueprintData.userFlow);
          }

          if (blueprintData.architecture) {
            updated.architecture = {
              ...updated.architecture,
              ...blueprintData.architecture,
            };
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
          }
        } else {
          // Fallback parsing jika AI tidak membungkus dengan tag JSON sempurna
          if (!updated.prd) {
            updated.prd = {
              overview: `Rancangan spesifikasi proyek untuk ${p.title}. Disusun otomatis oleh AI Project Planner.`,
              goals: ["Membangun MVP fungsional sesuai requirement", "Arsitektur modular dan scalable", "User experience responsif"],
              targetUsers: ["End-user", "Administrator"],
              functionalRequirements: ["Autentikasi akun", "Manajemen data utama", "Dashboard pelaporan"],
            };
          }

          if (updated.tasks.length === 0) {
            updated.tasks = [
              { id: "t-1", title: "Setup Project & Database Schema", description: "Inisialisasi Next.js, Tailwind, dan PostgreSQL schema.", status: "todo", phase: "Phase 1 - Setup" },
              { id: "t-2", title: "Implementasi Autentikasi Pengguna", description: "Fitur login, registrasi, dan session management.", status: "todo", phase: "Phase 1 - Setup" },
              { id: "t-3", title: "Pembangunan Fitur Inti & UI", description: "Antarmuka utama dan logika bisnis aplikasi.", status: "todo", phase: "Phase 2 - Core" },
              { id: "t-4", title: "Testing & Production Deployment", description: "Pengujian menyeluruh dan rilis ke hosting.", status: "todo", phase: "Phase 3 - Release" },
            ];
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
    const prd = activeProject.prd;
    const arch = activeProject.architecture;
    const features = activeProject.features || [];
    const tasks = activeProject.tasks;

    const masterPrompt = `# MASTER PROJECT CONTEXT FOR AI CODING TOOLS (Antigravity / Cursor / Vibecode)
# Project: ${activeProject.title}
# Generated by: Usick One — Code Planner (Ngoding Pakai AI)

---
## 1. PROJECT OVERVIEW & PRD
- **Description**: ${prd?.overview || activeProject.description}
- **Problem Statement**: ${prd?.problemStatement || "Menyelesaikan kebutuhan pengguna secara efisien."}
- **Key Goals**:
${prd?.goals?.map((g) => `  * ${g}`).join("\n") || "  * Menghasilkan aplikasi fungsional yang stabil"}

---
## 2. TARGET USERS & REQUIREMENTS
- **Target Users**: ${prd?.targetUsers?.join(", ") || "General Users"}
- **Functional Requirements**:
${prd?.functionalRequirements?.map((f) => `  * ${f}`).join("\n") || "  * Standard Web Features"}

---
## 3. TECHNICAL ARCHITECTURE & STACK
- **Frontend**: ${arch?.frontend || "Next.js (App Router), Tailwind CSS"}
- **Backend / API**: ${arch?.backend || "Next.js Server Actions / Route Handlers"}
- **Database**: ${arch?.database || "PostgreSQL / Supabase"}
- **Authentication**: ${arch?.auth || "Supabase Auth / NextAuth"}
- **Storage**: ${arch?.storage || "Object Storage / Supabase Storage"}
- **Third-party Services**: ${arch?.thirdParty?.join(", ") || "N/A"}
- **Deployment**: ${arch?.deployment || "Vercel"}

### Data / Schema Blueprint:
\`\`\`sql
${arch?.dataSchema || "-- Skema tabel inti\n-- users, items, transactions"}
\`\`\`

---
## 4. USER FLOW
${activeProject.userFlow || "Landing Page -> Login/Register -> Dashboard -> Core Actions -> Summary / Results"}

---
## 5. FEATURE BREAKDOWN
${features.map((f, i) => `${i + 1}. **${f.name}** [${f.priority || "Medium"}]: ${f.description}`).join("\n") || "- Fitur inti aplikasi"}

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
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-emerald-600 text-white shadow-xl animate-in fade-in-0 duration-200">
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
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
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
            onClick={() => handleSendChatMessage("Tolong buatkan blueprint lengkap (PRD, fitur, arsitektur, dan task development) untuk project ini sekarang.")}
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
                    /* Bubble Pesan AI: Tunggal, Halus, & Interaktif */
                    <div className={`max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed ${
                      isDark ? "bg-zinc-900 border border-zinc-800 text-zinc-200" : "bg-white border border-zinc-200 text-zinc-800 shadow-xs"
                    }`}>
                      {!m.content ? (
                        /* Loading state di dalam satu bubble AI yang sama (mencegah bubble ganda) */
                        <div className="flex items-center gap-2.5 py-1 text-zinc-400">
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                            <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                            <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                          </div>
                          <span className="text-xs font-medium">Sedang menganalisis &amp; merumuskan konsep...</span>
                        </div>
                      ) : (
                        <>
                          <MarkdownMessage content={cleanText} isDark={isDark} />

                          {/* Pertanyaan Discovery Interaktif / Pilihan Ganda */}
                          {questions.length > 0 && (
                            <div className={`mt-3.5 space-y-3 pt-3 border-t border-dashed ${
                              isDark ? "border-zinc-800" : "border-zinc-200"
                            }`}>
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Pilihan Jawaban (Klik opsi untuk menjawab langsung):</span>
                              </div>

                              {questions.map((q, qIdx) => (
                                <div
                                  key={q.id || `q-${qIdx}`}
                                  className={`rounded-xl p-3 border ${
                                    isDark
                                      ? "bg-zinc-950/70 border-zinc-800/80"
                                      : "bg-zinc-50 border-zinc-200"
                                  }`}
                                >
                                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2.5">
                                    {q.question}
                                  </p>

                                  <div className="flex flex-wrap gap-1.5">
                                    {q.options?.map((opt, optIdx) => {
                                      const letter = String.fromCharCode(65 + optIdx);
                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          disabled={isChatLoading}
                                          onClick={() => handleSendChatMessage(`Jawaban untuk "${q.question}": ${opt}`)}
                                          className={`text-left inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                                            isDark
                                              ? "bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 border-zinc-800 text-zinc-200"
                                              : "bg-white hover:bg-zinc-100 hover:border-zinc-300 border-zinc-200 text-zinc-800 shadow-2xs"
                                          } ${isChatLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                          title={`Pilih ${opt}`}
                                        >
                                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold shrink-0 ${
                                            isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                                          }`}>
                                            {letter}
                                          </span>
                                          <span>{opt}</span>
                                        </button>
                                      );
                                    })}

                                    {/* Opsi Lainnya / Tulis Sendiri */}
                                    <button
                                      type="button"
                                      disabled={isChatLoading}
                                      onClick={() => handleSelectOther(q.question)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border border-dashed ${
                                        isDark
                                          ? "bg-zinc-900/40 hover:bg-zinc-850 hover:border-zinc-600 border-zinc-700/80 text-zinc-400 hover:text-zinc-200"
                                          : "bg-white/70 hover:bg-zinc-50 hover:border-zinc-400 border-zinc-300 text-zinc-600 hover:text-zinc-900"
                                      } ${isChatLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                      title="Ketik jawaban kustom untuk pertanyaan ini"
                                    >
                                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <span>Lainnya / Tulis Sendiri...</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
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

          {/* Quick Action Prompt Chips (Bebas Emote, Menggunakan SVG Icons Murni) */}
          <div className={`px-4 sm:px-8 py-2 border-t flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px] ${
            isDark ? "border-zinc-850 bg-zinc-950/30" : "border-zinc-200 bg-white"
          }`}>
            <span className="text-zinc-400 shrink-0 font-medium">Aksi Cepat:</span>
            <button
              onClick={() => handleSendChatMessage("Tolong buatkan blueprint lengkap (PRD, fitur, arsitektur, dan task development) untuk project ini.")}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition whitespace-nowrap border shrink-0 ${
                isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-200 hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Generate PRD &amp; Tasks</span>
            </button>
            <button
              onClick={() => handleSendChatMessage("Rancang rekomendasi tech stack, arsitektur backend, dan skema database untuk project ini.")}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition whitespace-nowrap border shrink-0 ${
                isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-200 hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Tech Stack &amp; Schema</span>
            </button>
            <button
              onClick={() => handleSendChatMessage("Pecah fitur-fitur ini menjadi daftar development task (Kanban board) dengan prioritas dan fase pengembangan.")}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition whitespace-nowrap border shrink-0 ${
                isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "border-zinc-200 hover:bg-zinc-100 text-zinc-700"
              }`}
            >
              <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Generate Task Board</span>
            </button>
          </div>

          {/* Input Box */}
          <div className={`p-3 sm:p-4 border-t ${isDark ? "border-zinc-850 bg-[#0c0c0e]" : "border-zinc-200 bg-[#fafafc]"}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="max-w-4xl mx-auto flex items-center gap-2"
            >
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Diskusikan requirement project, minta perubahan fitur, atau buat PRD..."
                className={`flex-1 rounded-2xl px-4 py-2.5 text-xs sm:text-sm border outline-none transition ${
                  isDark
                    ? "bg-zinc-900 border-zinc-800 focus:border-zinc-600 text-white placeholder-zinc-500"
                    : "bg-white border-zinc-200 focus:border-zinc-400 text-black placeholder-zinc-400 shadow-xs"
                }`}
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className={`rounded-2xl px-4 py-2.5 text-xs font-semibold transition shrink-0 shadow-xs ${
                  chatInput.trim() && !isChatLoading
                    ? isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                    : "bg-zinc-500/30 text-zinc-500 cursor-not-allowed"
                }`}
              >
                Kirim
              </button>
            </form>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeProject.features || []).map((feat, idx) => (
              <div
                key={feat.id || idx}
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm">{feat.name}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      feat.priority === "High"
                        ? "bg-red-500/15 text-red-400 border border-red-500/20"
                        : feat.priority === "Medium"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
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
              isDark ? "bg-black/50 text-emerald-400 border border-zinc-800/80" : "bg-zinc-50 text-emerald-700 border border-zinc-200"
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
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Dikerjakan</span>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20">
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
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Selesai</span>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">Gagal / Kendala</span>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20">
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
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : task.status === "in_progress"
              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
              : task.status === "failed"
              ? "bg-red-500/15 text-red-400 border-red-500/30"
              : isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-300"
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

