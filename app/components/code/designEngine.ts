import { DesignSpec, ProjectItem } from "./types";

/**
 * Synthesizes a bespoke, domain-tailored Design Specification
 * from an approved PRD. Eliminates generic boilerplate and gives
 * each product its distinct, professional visual identity.
 */
export function synthesizeProjectDesignSpec(project: ProjectItem): DesignSpec {
  const prd = project.prd;
  const combined = `${project.title} ${project.description || ""} ${prd?.overview || ""} ${project.userFlow || ""}`.toLowerCase();

  // 1. Detect Domain
  let domain: DesignSpec["domain"] = "general";
  if (
    combined.includes("booking") ||
    combined.includes("reservasi") ||
    combined.includes("cukur") ||
    combined.includes("barber") ||
    combined.includes("klinik") ||
    combined.includes("dokter") ||
    combined.includes("salon") ||
    combined.includes("lapangan") ||
    combined.includes("jadwal")
  ) {
    domain = "booking";
  } else if (
    combined.includes("dashboard") ||
    combined.includes("analytics") ||
    combined.includes("kpi") ||
    combined.includes("trading") ||
    combined.includes("finance") ||
    combined.includes("keuangan") ||
    combined.includes("manajemen") ||
    combined.includes("admin")
  ) {
    domain = "dashboard";
  } else if (
    combined.includes("portfolio") ||
    combined.includes("portofolio") ||
    combined.includes("arsitek") ||
    combined.includes("fotografer") ||
    combined.includes("studio") ||
    combined.includes("gallery") ||
    combined.includes("karya")
  ) {
    domain = "portfolio";
  } else if (
    combined.includes("toko") ||
    combined.includes("shop") ||
    combined.includes("store") ||
    combined.includes("e-commerce") ||
    combined.includes("ecommerce") ||
    combined.includes("checkout") ||
    combined.includes("katalog")
  ) {
    domain = "ecommerce";
  } else if (
    combined.includes("saas") ||
    combined.includes("software") ||
    combined.includes("cloud") ||
    combined.includes("platform") ||
    combined.includes("telemetry") ||
    combined.includes("devops") ||
    combined.includes("observabilit") ||
    combined.includes("monitoring") ||
    combined.includes("kubernetes") ||
    combined.includes("b2b") ||
    combined.includes("kolaborasi") ||
    combined.includes("subscription") ||
    combined.includes("subskripsi")
  ) {
    domain = "saas";
  }

  // 2. Derive Archetype & Tokens
  let visualArchetype = "clean-modern-saas";
  let primaryFont = "Plus Jakarta Sans, sans-serif";
  let headingFont = "Plus Jakarta Sans, sans-serif";
  let fontImportUrl = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap";

  let bg = "#090d16";
  let surface = "#111420";
  let surfaceElevated = "#171c2b";
  let border = "rgba(255, 255, 255, 0.08)";
  let primary = "#ffffff";
  let accent = "#38bdf8";
  const text = "#f8fafc";
  const muted = "#94a3b8";

  let heroType = "split-preview";
  let cardRadius = "rounded-3xl";
  let sectionSequence: string[] = [];

  if (domain === "booking") {
    visualArchetype = combined.includes("barber") || combined.includes("grooming")
      ? "minimalist-luxury-grooming"
      : "clean-modern-appointment";
    bg = "#0c0d10";
    surface = "#14151a";
    surfaceElevated = "#1c1d24";
    border = "rgba(255, 255, 255, 0.1)";
    primary = "#ffffff";
    accent = "#e4e4e7";
    heroType = "booking-card-lead";
    cardRadius = "rounded-2xl";
    sectionSequence = [
      "Navigation Bar dengan Badge Jam Operasional & Status Buka",
      "Lead Hero dengan Pemicu Reservasi Jadwal Instan",
      "Katalog Layanan Interaktif dengan Harga Realistis (Rupiah)",
      "Matriks Pemilihan Tanggal & Slot Jam Tersedia",
      "Bilah Kalkulasi Ringkasan Biaya Dinamis",
      "Modal Dialog Konfirmasi Reservasi & Kode Booking Unik",
      "Ulasan Klien Terverifikasi & Informasi Kontak",
    ];
  } else if (domain === "dashboard") {
    visualArchetype = "hyper-dense-fintech";
    primaryFont = "Inter, sans-serif";
    headingFont = "Inter, sans-serif";
    fontImportUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap";
    bg = "#080a10";
    surface = "#0e111a";
    surfaceElevated = "#151926";
    border = "rgba(255, 255, 255, 0.07)";
    primary = "#60a5fa";
    accent = "#38bdf8";
    heroType = "analytics-ribbon";
    cardRadius = "rounded-xl";
    sectionSequence = [
      "Top Command Header dengan Pencarian & Status Jaringan Live",
      "Pita Metrik KPI Stat (4 Kartu dengan Delta Badge & Sparkline)",
      "Visualisasi Tren Real-Time (Grafik SVG Vektor)",
      "Tabel Transaksi & Entitas Filterable dengan Status Pills",
      "Modal Entri Data Transaksi Baru Cepat",
      "Log Aktivitas Sistem & Latensi Klaster",
    ];
  } else if (domain === "portfolio") {
    visualArchetype = "warm-editorial";
    primaryFont = "Plus Jakarta Sans, sans-serif";
    headingFont = "Playfair Display, serif";
    fontImportUrl = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
    bg = "#0d0c0a";
    surface = "#161512";
    surfaceElevated = "#201e1a";
    border = "rgba(255, 255, 255, 0.1)";
    accent = "#d97706";
    heroType = "editorial-showcase";
    cardRadius = "rounded-2xl";
    sectionSequence = [
      "Header Minimalis dengan Brand Mark",
      "Hero Tipografi Editorial dengan Pernyataan Kuratorial",
      "Galeri Pameran Karya Terpilih dengan Depth & Hover Effect",
      "Narasi Filosofi Desain & Proses Eksplorasi",
      "Daftar Penghargaan & Klien Terpercaya",
      "Footer Kontak Inquiry Eksklusif",
    ];
  } else {
    // SaaS Standard
    visualArchetype = "clean-modern-saas";
    heroType = "split-preview";
    cardRadius = "rounded-3xl";
    sectionSequence = [
      "Glassmorphic Navbar dengan Tombol Coba Gratis",
      "Split Hero dengan Mockup Antarmuka Live Interaktif",
      "Bar Sosial Proof Metrik & Logo Mitra",
      "Walkthrough Fitur Berorientasi Produk (Tata Letak Asimetris)",
      "Matriks Perbandingan Paket & Toggle Diskon Tahunan 20%",
      "Kutipan Testimonial Pelanggan Terverifikasi",
      "High-Conversion Call-to-Action",
      "Footer Multi-Kolom Lengkap",
    ];
  }

  const components = [
    {
      name: "Navigation Header",
      description: "Bilah navigasi responsif dengan brand identity dan primary action trigger.",
      behavior: "Sticky dengan background blur (backdrop-blur-xl), mobile sheet drawer.",
    },
    {
      name: "Interactive Data / Service Catalog",
      description: "Daftar entri utama yang dapat difilter berdasarkan kategori.",
      behavior: "Filter tabs instan tanpa reload, active pill highlighter.",
    },
    {
      name: "Action Confirmation Modal",
      description: "Dialog interaktif untuk input atau konfirmasi aksi pengguna.",
      behavior: "Smooth fade-in, dismiss via backdrop click atau tombol escape, form validation.",
    },
    {
      name: "Feedback Toast System",
      description: "Notifikasi mengambang setelah pengguna melakukan aksi submit.",
      behavior: "Muncul di pojok bawah selama 4 detik dengan micro-indicator aktif.",
    },
  ];

  return {
    version: 1,
    domain,
    visualArchetype,
    productGoal: prd?.goals?.join(", ") || "Memberikan pengalaman digital berstandar industri dengan alur intuitif.",
    targetAudience: prd?.targetUsers?.join(", ") || "Pengguna modern & profesional",
    colors: {
      background: bg,
      surface,
      surfaceElevated,
      border,
      primary,
      accent,
      text,
      mutedText: muted,
    },
    typography: {
      primaryFont,
      headingFont,
      fontImportUrl,
      displayScale: "text-4xl sm:text-6xl font-extrabold tracking-tight",
      h1Scale: "text-3xl sm:text-4xl font-bold tracking-tight",
      bodyScale: "text-xs sm:text-sm leading-relaxed text-zinc-300",
    },
    layoutStrategy: {
      heroType,
      containerMax: domain === "dashboard" ? "max-w-7xl" : "max-w-6xl",
      cardRadius,
      sectionSequence,
    },
    components,
    interactivePatterns: [
      "Kategori filter tabs yang memperbarui item list secara instan",
      "Perhitungan harga atau nominal secara dinamis di layar",
      "Modal popup interaktif dengan backdrop dismissal",
      "Simulasi pengiriman formulir dengan spinner dan toast feedback",
    ],
    approvedAt: Date.now(),
  };
}

/**
 * Applies natural-language design revisions and increments design spec version.
 */
export function applyDesignRevision(
  spec: DesignSpec,
  instruction: string
): DesignSpec {
  const lower = instruction.toLowerCase();
  const next: DesignSpec = JSON.parse(JSON.stringify(spec));
  next.version = spec.version + 1;

  // 1. Accent color revisions
  if (lower.includes("emerald") || lower.includes("hijau")) {
    next.colors.accent = "#10b981";
  } else if (lower.includes("amber") || lower.includes("emas") || lower.includes("gold") || lower.includes("kuning")) {
    next.colors.accent = "#f59e0b";
  } else if (lower.includes("sky") || lower.includes("biru") || lower.includes("blue")) {
    next.colors.accent = "#38bdf8";
  } else if (lower.includes("violet") || lower.includes("ungu") || lower.includes("purple")) {
    next.colors.accent = "#8b5cf6";
  } else if (lower.includes("rose") || lower.includes("merah") || lower.includes("crimson")) {
    next.colors.accent = "#f43f5e";
  }

  // 2. Typography revisions
  if (lower.includes("serif") || lower.includes("editorial")) {
    next.typography.headingFont = "Playfair Display, serif";
    next.typography.fontImportUrl =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;600&display=swap";
  } else if (lower.includes("mono") || lower.includes("tech") || lower.includes("hacker")) {
    next.typography.primaryFont = "JetBrains Mono, monospace";
    next.typography.fontImportUrl =
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&display=swap";
  }

  // 3. Corner Radius revisions
  if (lower.includes("bulat") || lower.includes("rounded-3xl") || lower.includes("soft")) {
    next.layoutStrategy.cardRadius = "rounded-3xl";
  } else if (lower.includes("kotak") || lower.includes("tajam") || lower.includes("sharp")) {
    next.layoutStrategy.cardRadius = "rounded-lg";
  }

  // 4. Hero type revisions
  if (lower.includes("centered") || lower.includes("tengah")) {
    next.layoutStrategy.heroType = "centered-statement";
  }

  next.approvedAt = Date.now();
  return next;
}
