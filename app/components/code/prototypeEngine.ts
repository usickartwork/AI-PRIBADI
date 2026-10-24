import { DesignSpec, ProjectItem } from "./types";

export interface PrototypeResult {
  html: string;
  version: number;
}

export function generateInteractivePrototypeHtml(
  project: ProjectItem,
  designSpec: DesignSpec
): PrototypeResult {
  const title = project.title || "Nexus App";
  const prd = project.prd;
  const overview = prd?.overview || project.description || "Aplikasi web modern berstandar industri.";
  const domain = designSpec.domain;

  // Curated Unsplash images with verified high-res URLs
  const heroImage =
    domain === "booking"
      ? "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=80"
      : domain === "dashboard"
      ? "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
      : "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80";

  // SVG Data-URI Fallback
  const fallbackSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="${designSpec.colors.surface}"/><text x="400" y="250" fill="${designSpec.colors.mutedText}" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${title.toUpperCase()}</text></svg>`
  );
  const fallbackDataUri = `data:image/svg+xml;utf8,${fallbackSvg}`;

  let bodyContent = "";

  if (domain === "booking") {
    bodyContent = `
  <!-- Navigation Header -->
  <header class="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[${designSpec.colors.background}]/90">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-2xl bg-white text-black font-black flex items-center justify-center text-sm shadow-md">
          ${title.charAt(0).toUpperCase()}
        </div>
        <div>
          <span class="font-extrabold tracking-tight text-white text-sm sm:text-base">${title}</span>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Buka Hari Ini 09:00 - 21:00</span>
          </div>
        </div>
      </div>

      <nav class="hidden md:flex items-center gap-6 text-xs text-zinc-300">
        <a href="#layanan" class="hover:text-white transition">Menu Layanan</a>
        <a href="#jadwal" class="hover:text-white transition">Pilihan Jam</a>
        <a href="#testimoni" class="hover:text-white transition">Ulasan Klien</a>
      </nav>

      <button
        type="button"
        onclick="openBookingModal('Signature Treatment', 125000)"
        class="px-5 py-2.5 rounded-2xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition shadow-lg cursor-pointer"
      >
        Reservasi Sekarang
      </button>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-16">
    <!-- Hero Section -->
    <section class="relative rounded-3xl overflow-hidden border border-white/10 bg-[${designSpec.colors.surface}] p-8 sm:p-14">
      <img src="${heroImage}" alt="${title}" class="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" onerror="this.src='${fallbackDataUri}';" />
      <div class="relative z-10 max-w-2xl space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-white/15 bg-white/5 text-zinc-300">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Studio Grooming Berstandar Eksklusif</span>
        </div>

        <h1 class="${designSpec.typography.displayScale} text-white leading-tight">
          ${title}
        </h1>

        <p class="${designSpec.typography.bodyScale} max-w-lg">
          ${overview}
        </p>

        <div class="pt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onclick="openBookingModal('Signature Haircut & Shave', 125000)"
            class="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-200 transition shadow-xl cursor-pointer"
          >
            Pilih Slot &amp; Reservasi
          </button>
          <a
            href="#layanan"
            class="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition"
          >
            Lihat Daftar Tarif
          </a>
        </div>
      </div>
    </section>

    <!-- Service Catalog -->
    <section id="layanan" class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 class="${designSpec.typography.h1Scale} text-white">Daftar Pilihan Layanan</h2>
          <p class="text-xs text-zinc-400 mt-1">Pilih paket grooming yang Anda inginkan untuk reservasi cepat.</p>
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-2">
          <button data-cat="ALL" class="tab-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black transition cursor-pointer">Semua</button>
          <button data-cat="PREMIUM" class="tab-btn px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white transition cursor-pointer">Premium</button>
          <button data-cat="STYLING" class="tab-btn px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white transition cursor-pointer">Styling</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="service-card p-5 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] hover:border-white/25 transition cursor-pointer flex justify-between items-center" data-category="PREMIUM" onclick="selectService('Master Signature Haircut & Beard Sculpting', 125000)">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-white">Master Signature Haircut &amp; Beard Sculpting</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/20">Populer</span>
            </div>
            <span class="text-xs text-zinc-400 block mt-1">Durasi: 45 Menit • Termasuk keramas dan hot towel</span>
          </div>
          <span class="text-sm font-mono font-bold text-white">Rp125.000</span>
        </div>

        <div class="service-card p-5 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] hover:border-white/25 transition cursor-pointer flex justify-between items-center" data-category="STYLING" onclick="selectService('Gentlemen Classic Haircut', 85000)">
          <div>
            <span class="text-sm font-bold text-white">Gentlemen Classic Haircut</span>
            <span class="text-xs text-zinc-400 block mt-1">Durasi: 30 Menit • Cuci rambut &amp; styling pomade</span>
          </div>
          <span class="text-sm font-mono font-bold text-white">Rp85.000</span>
        </div>

        <div class="service-card p-5 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] hover:border-white/25 transition cursor-pointer flex justify-between items-center" data-category="PREMIUM" onclick="selectService('Hot Towel Razor Beard Shave', 65000)">
          <div>
            <span class="text-sm font-bold text-white">Hot Towel Razor Beard Shave</span>
            <span class="text-xs text-zinc-400 block mt-1">Durasi: 25 Menit • Cukur jenggot pisau lipat steril</span>
          </div>
          <span class="text-sm font-mono font-bold text-white">Rp65.000</span>
        </div>

        <div class="service-card p-5 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] hover:border-white/25 transition cursor-pointer flex justify-between items-center" data-category="STYLING" onclick="selectService('Scalp Charcoal Treatment', 75000)">
          <div>
            <span class="text-sm font-bold text-white">Scalp Charcoal Treatment</span>
            <span class="text-xs text-zinc-400 block mt-1">Durasi: 30 Menit • Perawatan kulit kepala anti-ketombe</span>
          </div>
          <span class="text-sm font-mono font-bold text-white">Rp75.000</span>
        </div>
      </div>
    </section>

    <!-- Calculation Strip -->
    <section class="p-6 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <span class="text-xs text-zinc-400 block">Layanan Terpilih:</span>
        <span id="selected-service-label" class="text-sm font-bold text-white">Master Signature Haircut &amp; Beard Sculpting</span>
      </div>
      <div class="flex items-center gap-4">
        <span id="selected-price-label" class="text-base font-black font-mono text-white">Rp125.000</span>
        <button
          type="button"
          onclick="triggerModalWithCurrent()"
          class="px-6 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
        >
          Konfirmasi Reservasi →
        </button>
      </div>
    </section>
  </main>

  <!-- Modal Dialog -->
  <div id="booking-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
    <div class="w-full max-w-md rounded-3xl border border-white/10 bg-[${designSpec.colors.surface}] p-6 text-white space-y-4">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 class="text-base font-bold">Konfirmasi Jadwal Reservasi</h3>
        <button onclick="closeBookingModal()" class="text-zinc-400 hover:text-white">✕</button>
      </div>

      <form id="booking-form" class="space-y-3">
        <div>
          <label class="block text-xs text-zinc-400 mb-1">Nama Lengkap</label>
          <input type="text" required placeholder="Contoh: Raden Satria" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none focus:border-white/30" />
        </div>
        <div>
          <label class="block text-xs text-zinc-400 mb-1">No. WhatsApp</label>
          <input type="tel" required placeholder="0812-xxxx-xxxx" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none focus:border-white/30" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeBookingModal()" class="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white">Batal</button>
          <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition">Konfirmasi Booking</button>
        </div>
      </form>
    </div>
  </div>`;
  } else if (domain === "dashboard") {
    bodyContent = `
  <header class="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[${designSpec.colors.background}]/90">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-sky-400 text-black font-black flex items-center justify-center text-xs">
          ${title.charAt(0).toUpperCase()}
        </div>
        <span class="font-bold text-white text-sm">${title}</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">Live Terminal</span>
      </div>

      <button onclick="openActionModal()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition cursor-pointer">
        + Entri Transaksi Baru
      </button>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] space-y-1">
        <span class="text-xs text-zinc-400">Total Volume Transaksi</span>
        <div class="text-2xl font-black font-mono text-white">Rp28.750.000</div>
        <span class="text-xs text-emerald-400 font-mono">+18.4% vs bulan lalu</span>
      </div>
      <div class="p-5 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] space-y-1">
        <span class="text-xs text-zinc-400">Throughput Pipeline</span>
        <div class="text-2xl font-black font-mono text-white">99.98%</div>
        <span class="text-xs text-emerald-400 font-mono">Uptime 30 hari</span>
      </div>
      <div class="p-5 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] space-y-1">
        <span class="text-xs text-zinc-400">Node Klaster Aktif</span>
        <div class="text-2xl font-black font-mono text-white">34 / 36</div>
        <span class="text-xs text-sky-400 font-mono">Beban operasional 42%</span>
      </div>
      <div class="p-5 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] space-y-1">
        <span class="text-xs text-zinc-400">Rerata Latensi</span>
        <div class="text-2xl font-black font-mono text-white">28ms</div>
        <span class="text-xs text-emerald-400 font-mono">Optimal</span>
      </div>
    </section>

    <!-- Clean SVG Chart -->
    <section class="p-6 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}] space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white">Throughput Real-Time Jam-ke-Jam</h3>
        <span class="text-xs font-mono text-sky-400">● Live Stream Socket</span>
      </div>
      <div class="h-36 w-full pt-2">
        <svg class="w-full h-full" viewBox="0 0 600 120" fill="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M0,80 Q75,30 150,55 T300,35 T450,65 T600,15 L600,120 L0,120 Z" fill="url(#chartGrad)" />
          <path d="M0,80 Q75,30 150,55 T300,35 T450,65 T600,15" stroke="#38bdf8" stroke-width="2.5" fill="none" />
        </svg>
      </div>
    </section>
  </main>`;
  } else {
    // SaaS Standard
    bodyContent = `
  <header class="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[${designSpec.colors.background}]/90">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-white text-black font-extrabold flex items-center justify-center text-xs">
          ${title.charAt(0).toUpperCase()}
        </div>
        <span class="font-bold text-white text-sm sm:text-base">${title}</span>
      </div>

      <nav class="hidden md:flex items-center gap-6 text-xs text-zinc-300">
        <a href="#fitur" class="hover:text-white transition">Fitur Utama</a>
        <a href="#arsitektur" class="hover:text-white transition">Arsitektur</a>
        <a href="#pricing" class="hover:text-white transition">Paket Harga</a>
      </nav>

      <button onclick="openActionModal()" class="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition cursor-pointer">
        Mulai Evaluasi Gratis
      </button>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-24">
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div class="space-y-6">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-white/10 bg-white/5 text-zinc-300">
          <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span>Generasi Arsitektur Digital Masa Depan</span>
        </div>

        <h1 class="${designSpec.typography.displayScale} text-white leading-tight">
          ${title}
        </h1>

        <p class="${designSpec.typography.bodyScale} max-w-lg">
          ${overview}
        </p>

        <div class="flex flex-wrap gap-3">
          <button onclick="openActionModal()" class="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-200 transition shadow-xl cursor-pointer">
            Mulai Eksplorasi Gratis
          </button>
          <a href="#fitur" class="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition">
            Pelajari Fitur →
          </a>
        </div>
      </div>

      <div class="rounded-3xl border border-white/15 bg-[${designSpec.colors.surface}] p-4 shadow-2xl">
        <img src="${heroImage}" alt="Preview" class="rounded-2xl w-full object-cover aspect-video border border-white/5" onerror="this.src='${fallbackDataUri}';" />
      </div>
    </section>
  </main>`;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- AI_GENERATED_PROTOTYPE -->
  <title>${title} | Interactive Prototype</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="${designSpec.typography.fontImportUrl}" rel="stylesheet">
  <style>
    body { font-family: ${designSpec.typography.primaryFont}; }
  </style>
</head>
<body class="bg-[${designSpec.colors.background}] text-zinc-100 antialiased overflow-x-hidden selection:bg-white/20 selection:text-white">
  ${bodyContent}

  <!-- Interactive Vanilla Runtime -->
  <script>
    let currentService = "Master Signature Haircut & Beard Sculpting";
    let currentPrice = 125000;

    function selectService(name, price) {
      currentService = name;
      currentPrice = price;
      const label = document.getElementById("selected-service-label");
      const priceLabel = document.getElementById("selected-price-label");
      if (label) label.textContent = name;
      if (priceLabel) priceLabel.textContent = "Rp" + price.toLocaleString("id-ID");
    }

    function triggerModalWithCurrent() {
      openBookingModal(currentService, currentPrice);
    }

    function openBookingModal(name, price) {
      const modal = document.getElementById("booking-modal");
      if (modal) modal.classList.remove("hidden");
    }

    function closeBookingModal() {
      const modal = document.getElementById("booking-modal");
      if (modal) modal.classList.add("hidden");
    }

    function openActionModal() {
      const modal = document.getElementById("booking-modal");
      if (modal) modal.classList.remove("hidden");
    }

    document.addEventListener("DOMContentLoaded", function() {
      // Filter Tabs
      const tabBtns = document.querySelectorAll(".tab-btn");
      tabBtns.forEach(btn => {
        btn.addEventListener("click", function() {
          tabBtns.forEach(b => {
            b.classList.remove("bg-white", "text-black", "font-bold");
            b.classList.add("text-zinc-400");
          });
          this.classList.add("bg-white", "text-black", "font-bold");
          this.classList.remove("text-zinc-400");

          const cat = this.getAttribute("data-cat");
          const cards = document.querySelectorAll(".service-card");
          cards.forEach(card => {
            if (cat === "ALL" || card.getAttribute("data-category") === cat) {
              card.style.display = "flex";
            } else {
              card.style.display = "none";
            }
          });
        });
      });

      // Form submission toast
      const form = document.getElementById("booking-form");
      if (form) {
        form.addEventListener("submit", function(e) {
          e.preventDefault();
          closeBookingModal();
          const toast = document.createElement("div");
          toast.className = "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-zinc-900 border border-white/20 text-white shadow-2xl transition-all duration-300";
          toast.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span class="text-xs font-semibold">Reservasi berhasil dikonfirmasi!</span>';
          document.body.appendChild(toast);
          setTimeout(() => { toast.remove(); }, 4000);
          form.reset();
        });
      }
    });
  </script>
</body>
</html>`;

  return {
    html: fullHtml,
    version: 1,
  };
}
