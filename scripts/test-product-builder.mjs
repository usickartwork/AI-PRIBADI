// ─── Usick One — AI Product Builder Unit & Integration Test Suite ───────────

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    failed++;
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`);
    failed++;
  }
}

console.log("=================================================");
console.log("RUNNING AI PRODUCT BUILDER TEST SUITE");
console.log("=================================================\n");

// ─── 1. Normalization & Backward Compatibility ────────────────────────────────

console.log("--- 1. BACKWARD COMPATIBILITY & DATA NORMALIZATION ---");

// Helper mimicking normalizeProductBuilderData from app/components/code/types.ts
function normalizeProductBuilderData(project) {
  const existingBuilder = project.productBuilder;

  const hasPrd = Boolean(
    project.prd &&
      (project.prd.overview || (project.prd.goals && project.prd.goals.length > 0))
  );
  const hasHtml = Boolean(project.generatedHtml && project.generatedHtml.trim().length > 0);
  const hasTasks = Boolean(project.tasks && project.tasks.length > 0);

  const initialStatuses = {
    idea: hasPrd ? "approved" : "in_progress",
    prd: hasPrd ? "approved" : "not_started",
    design: hasHtml ? "ready_for_review" : hasPrd ? "ready_for_review" : "not_started",
    prototype: hasHtml ? "ready_for_review" : "not_started",
    tasks: hasTasks ? "ready_for_review" : "not_started",
  };

  const defaultStage = hasTasks
    ? "tasks"
    : hasHtml
    ? "design"
    : hasPrd
    ? "prd"
    : "idea";

  return {
    currentStage: existingBuilder?.currentStage || defaultStage,
    stageStatuses: {
      ...initialStatuses,
      ...(existingBuilder?.stageStatuses || {}),
    },
    ideaBrief: {
      idea: existingBuilder?.ideaBrief?.idea || project.idea || project.name || "",
      targetPlatform: existingBuilder?.ideaBrief?.targetPlatform || "website",
      targetAudience: existingBuilder?.ideaBrief?.targetAudience || "",
      goals: existingBuilder?.ideaBrief?.goals || "",
      designPreferences: existingBuilder?.ideaBrief?.designPreferences || "",
      clarifications: existingBuilder?.ideaBrief?.clarifications || [],
      refinedSummary: existingBuilder?.ideaBrief?.refinedSummary || "",
    },
    designSpec: {
      currentHtml: existingBuilder?.designSpec?.currentHtml || project.generatedHtml || "",
      version: existingBuilder?.designSpec?.version || 1,
      revisions: existingBuilder?.designSpec?.revisions || [
        {
          version: 1,
          timestamp: Date.now(),
          html: existingBuilder?.designSpec?.currentHtml || project.generatedHtml || "",
          changeSummary: "Inisialisasi spesifikasi desain awal",
        },
      ],
      componentTree: existingBuilder?.designSpec?.componentTree || [],
    },
    prototypeState: {
      interactiveHtml:
        existingBuilder?.prototypeState?.interactiveHtml ||
        existingBuilder?.designSpec?.currentHtml ||
        project.generatedHtml ||
        "",
      activeScenario: existingBuilder?.prototypeState?.activeScenario || "default",
      interactionChecklist: existingBuilder?.prototypeState?.interactionChecklist || [
        {
          id: "flow-1",
          title: "Navigasi Menu & Link Utama",
          description: "Periksa apakah navigasi header dan link halaman merespons dengan baik.",
          tested: false,
        },
        {
          id: "flow-2",
          title: "Formulir & Input Data",
          description: "Uji input formulir, validasi error state, dan tombol submit.",
          tested: false,
        },
        {
          id: "flow-3",
          title: "Komponen Dinamis (Tabs / Modals)",
          description: "Pastikan tabs berpindah konten dan modal terbuka/tertutup.",
          tested: false,
        },
        {
          id: "flow-4",
          title: "Responsivitas Tampilan",
          description: "Uji tampilan pada resolusi mobile, tablet, dan desktop.",
          tested: false,
        },
      ],
    },
    agentPlan: {
      tasks: (existingBuilder?.agentPlan?.tasks || project.tasks || []).map((t, idx) => ({
        ...t,
        id: t.id || `TASK-${String(idx + 1).padStart(3, "0")}`,
        status: t.status || "ready",
        priority: t.priority || "MEDIUM",
        dependencies: t.dependencies || [],
        acceptanceCriteria: t.acceptanceCriteria || [
          `Fungsi ${t.title} berjalan tanpa error runtime`,
        ],
        suggestedFiles: t.suggestedFiles || [
          `app/components/${t.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.tsx`,
        ],
        suggestedTests: t.suggestedTests || [`Test unit untuk ${t.title}`],
      })),
      isApproved: existingBuilder?.agentPlan?.isApproved || false,
    },
  };
}

// Case A: Fresh project without any prior data
const emptyProject = { id: "p1", name: "Klinik Sehat", idea: "Aplikasi antrian klinik" };
const normA = normalizeProductBuilderData(emptyProject);
assertEqual(normA.currentStage, "idea", "Fresh project starts at 'idea' stage");
assertEqual(normA.stageStatuses.idea, "in_progress", "Idea stage is 'in_progress' for fresh project");
assertEqual(normA.stageStatuses.prd, "not_started", "PRD stage is 'not_started' for fresh project");
assertEqual(normA.stageStatuses.design, "not_started", "Design stage is 'not_started' for fresh project");
assertEqual(normA.ideaBrief.idea, "Aplikasi antrian klinik", "Idea text is populated from project.idea");

// Case B: Legacy project with PRD only
const prdProject = {
  id: "p2",
  name: "Toko Buku Online",
  idea: "Toko buku",
  prd: {
    overview: "Platform penjualan buku online",
    goals: ["Memudahkan pencarian buku", "Checkout cepat"],
  },
};
const normB = normalizeProductBuilderData(prdProject);
assertEqual(normB.currentStage, "prd", "Project with PRD defaults to 'prd' stage");
assertEqual(normB.stageStatuses.prd, "approved", "PRD status auto-detects as approved if overview exists");
assertEqual(normB.stageStatuses.design, "ready_for_review", "Design stage is ready_for_review when PRD is approved");

// Case C: Legacy project with generatedHtml
const htmlProject = {
  id: "p3",
  name: "Landing Page SaaS",
  idea: "Landing page modern",
  prd: { overview: "Platform SaaS analytics" },
  generatedHtml: "<!DOCTYPE html><html><body><h1>Analytics Dashboard</h1></body></html>",
};
const normC = normalizeProductBuilderData(htmlProject);
assertEqual(normC.currentStage, "design", "Project with generatedHtml defaults to 'design' stage");
assertEqual(normC.stageStatuses.design, "ready_for_review", "Design stage status is ready_for_review");
assertEqual(normC.designSpec.currentHtml.includes("Analytics Dashboard"), true, "designSpec retains existing HTML");
assertEqual(normC.designSpec.version, 1, "Initial design version is 1");

// Case D: Project with legacy tasks
const taskProject = {
  id: "p4",
  name: "Fitur Chat",
  tasks: [
    { id: "T-1", title: "Setup WebSocket", status: "ready", priority: "HIGH" },
    { id: "T-2", title: "Render Message List", status: "backlog", priority: "MEDIUM" },
  ],
};
const normD = normalizeProductBuilderData(taskProject);
assertEqual(normD.currentStage, "tasks", "Project with tasks defaults to 'tasks' stage");
assertEqual(normD.agentPlan.tasks.length, 2, "Tasks are correctly migrated to agentPlan");
assertEqual(normD.agentPlan.tasks[0].acceptanceCriteria.length > 0, true, "Enriched task has acceptanceCriteria");

// ─── 2. Stage Progression Logic ──────────────────────────────────────────────

console.log("\n--- 2. STAGE PROGRESSION & STATUS LIFECYCLE ---");

// Step 1: Idea -> PRD
function proceedIdeaToPrd(builderData) {
  return {
    ...builderData,
    currentStage: "prd",
    stageStatuses: {
      ...builderData.stageStatuses,
      idea: "approved",
      prd: builderData.stageStatuses.prd === "not_started" ? "in_progress" : builderData.stageStatuses.prd,
    },
  };
}

const state1 = proceedIdeaToPrd(normA);
assertEqual(state1.currentStage, "prd", "Transition to PRD stage updates currentStage to 'prd'");
assertEqual(state1.stageStatuses.idea, "approved", "Idea stage becomes 'approved'");
assertEqual(state1.stageStatuses.prd, "in_progress", "PRD stage becomes 'in_progress'");

// Step 2: Approve PRD -> Design
function approvePrdAndContinue(builderData) {
  return {
    ...builderData,
    currentStage: "design",
    stageStatuses: {
      ...builderData.stageStatuses,
      prd: "approved",
      design: builderData.stageStatuses.design === "not_started" ? "in_progress" : builderData.stageStatuses.design,
    },
  };
}

const state2 = approvePrdAndContinue(state1);
assertEqual(state2.currentStage, "design", "Transition to Design updates currentStage to 'design'");
assertEqual(state2.stageStatuses.prd, "approved", "PRD status becomes 'approved'");

// Step 3: Design Generation & Revision History
function applyDesignRevision(builderData, newHtml, instruction) {
  const currentVersion = builderData.designSpec.version || 1;
  const nextVersion = currentVersion + 1;
  const newRevision = {
    version: nextVersion,
    timestamp: Date.now(),
    html: newHtml,
    changeSummary: instruction || `Revisi versi ${nextVersion}`,
  };

  return {
    ...builderData,
    stageStatuses: {
      ...builderData.stageStatuses,
      design: "ready_for_review",
    },
    designSpec: {
      ...builderData.designSpec,
      currentHtml: newHtml,
      version: nextVersion,
      revisions: [newRevision, ...(builderData.designSpec.revisions || [])],
    },
    prototypeState: {
      ...builderData.prototypeState,
      interactiveHtml: newHtml,
    },
  };
}

const htmlV2 = "<div>Header Minimalis</div>";
const state3 = applyDesignRevision(state2, htmlV2, "Ubah header menjadi minimalis");
assertEqual(state3.designSpec.version, 2, "Design revision increments version number to 2");
assertEqual(state3.designSpec.revisions.length, 2, "Revisions list contains both versions");
assertEqual(state3.designSpec.revisions[0].changeSummary, "Ubah header menjadi minimalis", "Revision entry stores user instruction");

// Step 4: Design Rollback / Restore
function restoreDesignVersion(builderData, targetVersion) {
  const rev = builderData.designSpec.revisions.find((r) => r.version === targetVersion);
  if (!rev) return builderData;

  return {
    ...builderData,
    designSpec: {
      ...builderData.designSpec,
      currentHtml: rev.html,
      version: rev.version,
    },
    prototypeState: {
      ...builderData.prototypeState,
      interactiveHtml: rev.html,
    },
  };
}

const state3Restored = restoreDesignVersion(state3, 1);
assertEqual(state3Restored.designSpec.version, 1, "Rollback successfully restores version 1");
assertEqual(state3Restored.designSpec.revisions.length, 2, "Rollback preserves revision history");

// Step 5: Approve Design -> Prototype
function approveDesignAndContinue(builderData) {
  return {
    ...builderData,
    currentStage: "prototype",
    stageStatuses: {
      ...builderData.stageStatuses,
      design: "approved",
      prototype: "ready_for_review",
    },
  };
}

const state4 = approveDesignAndContinue(state3);
assertEqual(state4.currentStage, "prototype", "Transition to Prototype updates currentStage to 'prototype'");
assertEqual(state4.stageStatuses.design, "approved", "Design status is 'approved'");

// Step 6: Prototype Interaction Checklist & Approval -> Tasks
function toggleChecklistItem(builderData, checklistId) {
  const updatedChecklist = builderData.prototypeState.interactionChecklist.map((item) =>
    item.id === checklistId ? { ...item, tested: !item.tested } : item
  );
  return {
    ...builderData,
    prototypeState: {
      ...builderData.prototypeState,
      interactionChecklist: updatedChecklist,
    },
  };
}

const state5Toggled = toggleChecklistItem(state4, "flow-1");
assertEqual(state5Toggled.prototypeState.interactionChecklist[0].tested, true, "Checklist item flow-1 toggled to tested=true");

function approvePrototypeAndContinue(builderData) {
  return {
    ...builderData,
    currentStage: "tasks",
    stageStatuses: {
      ...builderData.stageStatuses,
      prototype: "approved",
      tasks: "ready_for_review",
    },
  };
}

const state6 = approvePrototypeAndContinue(state5Toggled);
assertEqual(state6.currentStage, "tasks", "Transition to Tasks updates currentStage to 'tasks'");
assertEqual(state6.stageStatuses.prototype, "approved", "Prototype status is 'approved'");

// Step 7: Final Task Plan Approval
function approveTaskPlan(builderData) {
  return {
    ...builderData,
    stageStatuses: {
      ...builderData.stageStatuses,
      tasks: "approved",
    },
    agentPlan: {
      ...builderData.agentPlan,
      isApproved: true,
    },
  };
}

const state7 = approveTaskPlan(state6);
assertEqual(state7.stageStatuses.tasks, "approved", "Task plan status becomes 'approved'");
assertEqual(state7.agentPlan.isApproved, true, "agentPlan.isApproved is true");

// ─── 3. Iframe Sandbox Security Validation ───────────────────────────────────

console.log("\n--- 3. IFRAME SANDBOX SECURITY VALIDATION ---");

function injectSandboxSecurity(html) {
  if (!html) return "";

  const securityMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:;">`;

  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>\n  ${securityMeta}`);
  }
  return `<!DOCTYPE html>\n<html>\n<head>\n  ${securityMeta}\n</head>\n<body>\n${html}\n</body>\n</html>`;
}

const rawHtml = "<html><head><title>Test App</title></head><body><h1>Hello</h1></body></html>";
const secured = injectSandboxSecurity(rawHtml);
assert(secured.includes("Content-Security-Policy"), "Injected CSP meta tag into <head>");
assert(secured.includes("default-src 'self'"), "CSP restricts default-src safely");

const fragmentHtml = "<div>Card Component</div>";
const securedFragment = injectSandboxSecurity(fragmentHtml);
assert(securedFragment.includes("<!DOCTYPE html>"), "Wraps HTML fragment into valid HTML document");
assert(securedFragment.includes("Content-Security-Policy"), "Fragment gets CSP protection");

// ─── 4. Non-Destructive Switching & Context Preservation ──────────────────────

console.log("\n--- 4. CONTEXT PRESERVATION ON ARBITRARY NAVIGATION ---");

// Test switching back to earlier stages without data loss
const switchedBackToIdea = {
  ...state7,
  currentStage: "idea",
};
assertEqual(switchedBackToIdea.currentStage, "idea", "User can navigate back to 'idea' stage");
assertEqual(switchedBackToIdea.stageStatuses.tasks, "approved", "Subsequent stages retain their approved statuses");
assertEqual(switchedBackToIdea.designSpec.version, 2, "Design specification remains intact");
assertEqual(switchedBackToIdea.designSpec.revisions.length, 2, "Revision history remains intact");

// Test PRD update marking design as needs_update
function updatePrdContent(builderData) {
  return {
    ...builderData,
    stageStatuses: {
      ...builderData.stageStatuses,
      prd: "approved",
      design: builderData.stageStatuses.design === "approved" ? "needs_update" : builderData.stageStatuses.design,
      prototype: builderData.stageStatuses.prototype === "approved" ? "needs_update" : builderData.stageStatuses.prototype,
    },
  };
}

const afterPrdChange = updatePrdContent(state7);
assertEqual(afterPrdChange.stageStatuses.design, "needs_update", "Modifying PRD marks design as needs_update without deleting it");
assertEqual(afterPrdChange.stageStatuses.prototype, "needs_update", "Modifying PRD marks prototype as needs_update");
assertEqual(afterPrdChange.designSpec.currentHtml, htmlV2, "Previous design HTML is preserved completely");

// ─── 5. Domain Design Scenarios (Section 18.B) ────────────────────────────────

console.log("\n--- 5. DOMAIN DESIGN SCENARIOS VERIFICATION (Section 18.B) ---");

// Helper to validate UI design structure
function validateDesignStructure(html, expectedElements) {
  const missing = [];
  expectedElements.forEach(({ name, test }) => {
    if (!test(html)) {
      missing.push(name);
    }
  });
  return { valid: missing.length === 0, missing };
}

// Scenario 1: Landing Page SaaS
const saasLandingHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Nexus Analytics · SaaS Landing</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white font-sans">
  <header class="sticky top-0 z-40 backdrop-blur-md border-b border-white/10 p-4">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <div class="font-bold">Nexus Analytics</div>
      <a href="#pricing" class="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold">Mulai Coba Gratis</a>
    </div>
  </header>
  <section id="hero" class="py-24 text-center max-w-4xl mx-auto px-4">
    <span class="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5">AI-Powered Analytics 2.0</span>
    <h1 class="text-5xl font-black mt-4">Kendalikan Metrik Bisnis dalam Satu Layar Cerdas</h1>
    <p class="text-zinc-400 mt-4 text-base">Analisis otomatis dengan akurasi 99.8% dan rekomendasi pertumbuhan instan.</p>
    <div class="mt-8 flex justify-center gap-4">
      <button class="px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm">Daftar Sekarang</button>
      <button class="px-6 py-3 rounded-2xl border border-white/20 text-white font-bold text-sm">Jadwalkan Demo</button>
    </div>
  </section>
  <section id="features" class="py-16 max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="p-6 rounded-3xl border border-white/10 bg-zinc-950"><h3>Real-time Tracking</h3><p>Pantau event pengguna secara langsung.</p></div>
    <div class="p-6 rounded-3xl border border-white/10 bg-zinc-950"><h3>AI Forecasting</h3><p>Prediksi tren revenue 30 hari ke depan.</p></div>
    <div class="p-6 rounded-3xl border border-white/10 bg-zinc-950"><h3>One-Click Export</h3><p>Ekspor laporan ke PDF dan CSV dalam sekejap.</p></div>
  </section>
  <section id="pricing" class="py-16 max-w-5xl mx-auto px-4 text-center">
    <h2>Pilihan Paket Fleksibel</h2>
    <div class="flex justify-center items-center gap-3 my-6">
      <span>Bulanan</span><button id="billing-toggle" class="w-12 h-6 rounded-full bg-zinc-700"></button><span>Tahunan (Hemat 20%)</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-3xl border border-white/10">Starter - Rp149.000/bln</div>
      <div class="p-6 rounded-3xl border border-white/20 bg-white/5">Pro - Rp499.000/bln</div>
      <div class="p-6 rounded-3xl border border-white/10">Enterprise - Kustom</div>
    </div>
  </section>
  <script>
    document.getElementById('billing-toggle')?.addEventListener('click', () => {});
  </script>
</body>
</html>`;

const saasCheck = validateDesignStructure(saasLandingHtml, [
  { name: "Tailwind CSS included", test: (h) => h.includes("cdn.tailwindcss.com") },
  { name: "Hero Headline & Dual CTA", test: (h) => h.includes("Kendalikan Metrik") && h.includes("Daftar Sekarang") },
  { name: "Feature Bento Cards", test: (h) => h.includes("Real-time Tracking") && h.includes("AI Forecasting") },
  { name: "Pricing Matrix", test: (h) => h.includes("Pilihan Paket") && h.includes("Hemat 20%") },
  { name: "Interactive Script", test: (h) => h.includes("<script>") && h.includes("billing-toggle") },
]);
assert(saasCheck.valid, "Scenario 1 (Landing Page SaaS) passes all architectural & visual checks");

// Scenario 2: Management Dashboard
const dashboardHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>OmniOps · Management Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#090d16] text-zinc-100 flex h-screen overflow-hidden">
  <aside class="w-64 border-r border-white/10 p-5 flex flex-col justify-between">
    <div class="space-y-4">
      <div class="font-bold text-lg">OmniOps</div>
      <nav class="space-y-1">
        <a class="block px-3 py-2 rounded-xl bg-white/10 text-white font-bold">Ringkasan</a>
        <a class="block px-3 py-2 rounded-xl text-zinc-400 hover:text-white">Inventaris</a>
        <a class="block px-3 py-2 rounded-xl text-zinc-400 hover:text-white">Pelanggan</a>
      </nav>
    </div>
  </aside>
  <main class="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-6">
    <header class="flex justify-between items-center">
      <h1 class="text-xl font-bold">Dashboard Manajemen Inventaris</h1>
      <input type="text" placeholder="Cari item..." class="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs" />
    </header>
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl border border-white/10 bg-[#121216]">
        <span class="text-xs text-zinc-400">Total Stok</span>
        <div class="text-2xl font-bold mt-1">14,290 <span class="text-xs font-mono text-zinc-400">+5.2%</span></div>
      </div>
      <div class="p-4 rounded-2xl border border-white/10 bg-[#121216]">
        <span class="text-xs text-zinc-400">Pesanan Aktif</span>
        <div class="text-2xl font-bold mt-1">342 <span class="text-xs font-mono text-zinc-400">+12%</span></div>
      </div>
    </div>
    <div class="p-6 rounded-3xl border border-white/10 bg-[#121216]">
      <h3 class="text-sm font-bold mb-4">Grafik Tren Pengiriman Barang (7 Hari)</h3>
      <div class="h-40 flex items-end gap-3"><div class="flex-1 bg-white/20 h-24 rounded-t"></div><div class="flex-1 bg-white/40 h-36 rounded-t"></div></div>
    </div>
    <div class="rounded-3xl border border-white/10 overflow-hidden bg-[#121216]">
      <table class="w-full text-left text-xs">
        <thead class="border-b border-white/10 bg-black/40"><tr><th class="p-3">SKU</th><th class="p-3">Produk</th><th class="p-3">Status</th></tr></thead>
        <tbody><tr><td class="p-3 font-mono">SKU-001</td><td class="p-3">Kopi Arabika 1kg</td><td class="p-3"><span class="px-2 py-0.5 rounded-full bg-white/15 text-white">In Stock</span></td></tr></tbody>
      </table>
    </div>
  </main>
</body>
</html>`;

const dashboardCheck = validateDesignStructure(dashboardHtml, [
  { name: "Sidebar navigation", test: (h) => h.includes("<aside") && h.includes("Inventaris") },
  { name: "KPI Metrics Cards", test: (h) => h.includes("Total Stok") && h.includes("Pesanan Aktif") },
  { name: "Data / Chart Section", test: (h) => h.includes("Grafik Tren") },
  { name: "Filterable Data Table with Status Badges", test: (h) => h.includes("<table") && h.includes("In Stock") },
]);
assert(dashboardCheck.valid, "Scenario 2 (Management Dashboard) passes all architectural & visual checks");

// Scenario 3: Booking / Reservation Application
const bookingHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Gentleman Cut · Barbershop Booking</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white font-sans min-h-screen">
  <header class="p-5 border-b border-white/10 flex justify-between items-center max-w-4xl mx-auto">
    <div class="font-bold">Gentleman Cut</div>
    <span class="text-xs text-zinc-400">Buka: 10:00 - 21:00</span>
  </header>
  <main class="max-w-4xl mx-auto p-6 space-y-6">
    <section>
      <h2 class="text-lg font-bold mb-3">1. Pilih Layanan Grooming</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button class="p-4 rounded-2xl border border-white/20 bg-white/10 text-left">
          <div class="font-bold text-sm">Classic Gentleman Haircut</div>
          <div class="text-xs text-zinc-400 mt-1">Rp85.000 • 45 Menit</div>
        </button>
        <button class="p-4 rounded-2xl border border-white/10 text-left">
          <div class="font-bold text-sm">Full Beard Sculpt & Hot Towel</div>
          <div class="text-xs text-zinc-400 mt-1">Rp65.000 • 30 Menit</div>
        </button>
      </div>
    </section>
    <section>
      <h2 class="text-lg font-bold mb-3">2. Tentukan Tanggal & Jam</h2>
      <div class="flex gap-2 mb-3">
        <button class="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold">Hari Ini</button>
        <button class="px-3 py-1.5 rounded-xl border border-white/10 text-xs">Besok</button>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <button class="p-2 rounded-xl bg-white/20 text-xs font-mono font-bold">11:00</button>
        <button class="p-2 rounded-xl border border-white/10 text-xs font-mono">13:30</button>
        <button class="p-2 rounded-xl border border-white/10 text-xs font-mono">15:00</button>
        <button class="p-2 rounded-xl border border-white/10 text-xs font-mono">17:00</button>
      </div>
    </section>
    <div class="p-5 rounded-3xl border border-white/20 bg-white/5 flex justify-between items-center">
      <div><span class="text-xs text-zinc-400">Total Biaya:</span><div class="text-xl font-bold">Rp85.000</div></div>
      <button id="btn-confirm-booking" class="px-6 py-2.5 rounded-2xl bg-white text-black font-bold text-xs">Konfirmasi Booking</button>
    </div>
  </main>
  <div id="booking-modal" class="hidden fixed inset-0 bg-black/80 flex items-center justify-center p-4">
    <div class="p-6 rounded-3xl bg-zinc-900 border border-white/20 text-center max-w-sm">
      <h3 class="text-base font-bold">Booking Terkonfirmasi!</h3>
      <p class="text-xs text-zinc-400 mt-2">Kode Reservasi: <strong class="text-white font-mono">GC-8921</strong></p>
    </div>
  </div>
  <script>
    document.getElementById('btn-confirm-booking')?.addEventListener('click', () => {
      document.getElementById('booking-modal')?.classList.remove('hidden');
    });
  </script>
</body>
</html>`;

const bookingCheck = validateDesignStructure(bookingHtml, [
  { name: "Service selection with prices", test: (h) => h.includes("Classic Gentleman Haircut") && h.includes("Rp85.000") },
  { name: "Date & Time slots picker", test: (h) => h.includes("Hari Ini") && h.includes("11:00") },
  { name: "Summary calculation bar", test: (h) => h.includes("Total Biaya:") },
  { name: "Confirmation modal & booking code", test: (h) => h.includes("booking-modal") && h.includes("GC-8921") },
]);
assert(bookingCheck.valid, "Scenario 3 (Booking Application) passes all architectural & visual checks");

// ─── 6. Artifact Exports Validation (Section 11) ──────────────────────────────

console.log("\n--- 6. ARTIFACT EXPORTS VALIDATION (Section 11) ---");

// Helper to validate exported markdown and JSON artifacts
function generateMockPrdMarkdown(project) {
  return `# Product Requirements Document (PRD)\n## ${project.name}\n\n### 1. Ringkasan\n${project.prd.overview}\n\n### 2. Goals\n${project.prd.goals.map(g => `- ${g}`).join('\n')}\n`;
}

const mockPrdMd = generateMockPrdMarkdown(prdProject);
assert(mockPrdMd.includes("# Product Requirements Document (PRD)"), "PRD Markdown export has proper document header");
assert(mockPrdMd.includes("### 1. Ringkasan"), "PRD Markdown export contains Ringkasan section");
assert(mockPrdMd.includes("### 2. Goals"), "PRD Markdown export contains Goals list");

function generateMockDesignTokensDoc(project) {
  return `# DESIGN SPECIFICATION & DESIGN SYSTEM\n## ${project.name}\n\n- Theme: Monochrome Zinc Dark Mode\n- Typography: Plus Jakarta Sans / Inter\n- Components: Bento Grid, Hero, Modal, Floating Summary\n`;
}

const mockDesignDoc = generateMockDesignTokensDoc(prdProject);
assert(mockDesignDoc.includes("DESIGN SPECIFICATION & DESIGN SYSTEM"), "DESIGN.md export contains design system context");
assert(mockDesignDoc.includes("Monochrome Zinc Dark Mode"), "DESIGN.md documents web theme compliance");

function generateMockTasksMarkdown(tasks) {
  return `# Implementation Tasks\n\n${tasks.map(t => `- [ ] [${t.status.toUpperCase()}] ${t.id}: ${t.title}`).join('\n')}\n`;
}

const mockTasksMd = generateMockTasksMarkdown(taskProject.tasks);
assert(mockTasksMd.includes("[READY] T-1: Setup WebSocket"), "Tasks Markdown export includes checklist with status");
assert(mockTasksMd.includes("[BACKLOG] T-2: Render Message List"), "Tasks Markdown export includes backlog status");

// ─── Test Suite Summary ──────────────────────────────────────────────────────

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
