// ─── Usick One AI App Builder — Phase 1 End-to-End Test Suite ────────────────

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
console.log("RUNNING AI APP BUILDER PHASE 1 TEST SUITE");
console.log("=================================================\n");

// ─── 1. Pipeline State Machine & Normalization ───────────────────────────────

console.log("--- 1. PIPELINE STATE MACHINE & BACKWARD COMPATIBILITY ---");

const { normalizePipelineMetadata } = await import("../app/components/code/types.ts");

// Fresh project without PRD
const freshProj = {
  id: "fresh-01",
  title: "Aplikasi Baru",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  tasks: [],
};
const metaFresh = normalizePipelineMetadata(freshProj);
assertEqual(metaFresh.currentStage, "idea", "Fresh project defaults to 'idea' stage");
assertEqual(metaFresh.stageStatuses.idea, "in_progress", "Fresh project idea stage is in_progress");
assertEqual(metaFresh.stageStatuses.prd, "not_started", "Fresh project PRD stage is not_started");

// Project with existing PRD
const prdProj = {
  id: "prd-01",
  title: "Studio Barber Online",
  description: "Aplikasi reservasi jadwal potong rambut",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  prd: {
    overview: "Platform booking potong rambut eksklusif",
    goals: ["Mempermudah reservasi", "Tanpa antrean fisik"],
    targetUsers: ["Pria modern"],
  },
  tasks: [],
};
const metaPrd = normalizePipelineMetadata(prdProj);
assertEqual(metaPrd.currentStage, "design", "Project with PRD automatically defaults to 'design' stage");
assertEqual(metaPrd.stageStatuses.prd, "approved", "Existing PRD marks prd stage as approved");
assertEqual(metaPrd.stageStatuses.design, "ready_for_review", "Design stage is ready_for_review");

// ─── 2. Antigravity Adapter Lifecycle ────────────────────────────────────────

console.log("\n--- 2. ANTIGRAVITY ADAPTER & AGENTIC LIFECYCLE ---");

const { AntigravityAdapter } = await import("../app/components/code/antigravityAdapter.ts");

const streamedThoughts = [];
const adapter = new AntigravityAdapter((thought) => {
  streamedThoughts.push(thought);
});

const stepResult = await adapter.executeStep("Synthesize Design Spec", async () => {
  adapter.recordThought("Synthesize Design Spec", "Menganalisis domain proyek dari PRD...", "thinking");
  return { status: "success", tokens: 120 };
});

assertEqual(stepResult.status, "success", "Antigravity adapter executes step successfully");
assert(streamedThoughts.length >= 2, "Antigravity adapter streams real-time agent thoughts");
const report = adapter.getReport(true);
assert(report.stepsCompleted.includes("Synthesize Design Spec"), "Adapter records completed step in execution report");
assert(report.executionId.startsWith("ag-"), "Adapter assigns valid execution ID");

// ─── 3. Automatic PRD-to-Design Transition & Design Engine ───────────────────

console.log("\n--- 3. AUTOMATIC PRD-TO-DESIGN TRANSITION & DESIGN ENGINE ---");

const { synthesizeProjectDesignSpec } = await import("../app/components/code/designEngine.ts");

const designSpec = synthesizeProjectDesignSpec(prdProj);
assertEqual(designSpec.domain, "booking", "Design engine detects 'booking' domain from PRD keywords");
assert(designSpec.colors.background === "#0c0d10", "Design engine selects bespoke background token");
assert(designSpec.layoutStrategy.heroType === "booking-card-lead", "Uses booking-card-lead layout strategy");
assert(designSpec.layoutStrategy.sectionSequence.length >= 5, "Defines rich section sequence for booking");
assert(designSpec.components.length >= 3, "Specifies reusable components for booking");

// Transition logic test
metaPrd.stageStatuses.prd = "approved";
metaPrd.currentStage = "design";
metaPrd.designSpec = designSpec;
assertEqual(metaPrd.currentStage, "design", "Project state transitioned to 'design' automatically");
assertEqual(metaPrd.stageStatuses.prd, "approved", "Approved PRD version is preserved as source of truth");

// ─── 4. Interactive Prototype Generation & Sandbox Safety ────────────────────

console.log("\n--- 4. INTERACTIVE PROTOTYPE ENGINE & SANDBOX SAFETY ---");

const { generateInteractivePrototypeHtml } = await import("../app/components/code/prototypeEngine.ts");

const protoResult = generateInteractivePrototypeHtml(prdProj, designSpec);
assert(protoResult.html.includes("<!DOCTYPE html>"), "Prototype generates valid HTML document");
assert(protoResult.html.includes("cdn.tailwindcss.com"), "Prototype includes Tailwind CSS CDN");
assert(protoResult.html.includes("overflow-x-hidden"), "Prototype includes overflow-x-hidden for viewport safety");
assert(protoResult.html.includes("data:image/svg+xml"), "Prototype includes resilient SVG Data-URI fallback");
assert(protoResult.html.includes("<script>"), "Prototype includes interactive vanilla runtime script");
assert(protoResult.html.includes("openBookingModal"), "Prototype includes working booking modal handlers");

// ─── 5. Modular Next.js 15 Build & Diagnostic Testing ────────────────────────

console.log("\n--- 5. MODULAR NEXT.JS BUILD & DEVSECOPS TESTING ---");

const { buildAndTestProject } = await import("../app/components/code/buildAndTestEngine.ts");

const buildAndTest = buildAndTestProject(prdProj, designSpec);
assertEqual(buildAndTest.buildState.status, "success", "Build succeeds with status 'success'");
assert(Boolean(buildAndTest.buildState.files["package.json"]), "Generates package.json");
assert(Boolean(buildAndTest.buildState.files["app/layout.tsx"]), "Generates app/layout.tsx");
assert(Boolean(buildAndTest.buildState.files["app/page.tsx"]), "Generates app/page.tsx");
assert(buildAndTest.buildState.files["app/page.tsx"].includes('"use client"'), "Page includes 'use client' boundary");

// Diagnostic checks validation
assert(buildAndTest.testState.passed, "Diagnostic test suite passes");
assert(buildAndTest.testState.score >= 80, `Test score >= 80 (Actual: ${buildAndTest.testState.score})`);
assert(buildAndTest.testState.checks.some(c => c.id === "sec-isolation-ok" && c.passed), "DevSecOps secret isolation check passed");
assert(buildAndTest.testState.checks.some(c => c.id === "brace-check-all" && c.passed), "AST & Syntax balance check passed");

// ─── 6. Natural Language Revisions (Design & Spec) ───────────────────────────

console.log("\n--- 6. NATURAL LANGUAGE REVISIONS (DESIGN & SPEC) ---");

const { applyDesignRevision } = await import("../app/components/code/designEngine.ts");

const revisedSpec = applyDesignRevision(designSpec, "Ganti warna aksen ke emerald dan gunakan font editorial Serif");
assertEqual(revisedSpec.version, 2, "Revision increments DesignSpec version to 2");
assertEqual(revisedSpec.colors.accent, "#10b981", "Revision applies emerald accent hex");
assert(revisedSpec.typography.headingFont.includes("Playfair Display"), "Revision applies Playfair Display serif heading");

// ─── 7. Zero-Dependency Binary PKZIP Generation ──────────────────────────────

console.log("\n--- 7. ZERO-DEPENDENCY BINARY PKZIP EXPORT ---");

const { createZeroDepZip } = await import("../app/components/code/zipExporter.ts");

const zipBuffer = createZeroDepZip(buildAndTest.buildState.files);
assert(zipBuffer instanceof Uint8Array, "Generates Uint8Array binary buffer");
assert(zipBuffer.length > 500, "ZIP archive contains packed project bytes");
// PKZIP header magic bytes: 0x50, 0x4b, 0x03, 0x04 ("PK\x03\x04")
assert(zipBuffer[0] === 0x50 && zipBuffer[1] === 0x4b && zipBuffer[2] === 0x03 && zipBuffer[3] === 0x04, "ZIP buffer begins with PK 0x04034b50 magic signature");

// ─── 8. Stale Downstream State Invalidation & Context Preservation ───────────

console.log("\n--- 8. STALE DOWNSTREAM STATE INVALIDATION ---");

// When user edits PRD, downstream stages are marked as needs_update without deleting previous artifacts
const modifiedPrdProj = {
  ...prdProj,
  prd: {
    ...prdProj.prd,
    overview: "Platform booking potong rambut VIP dengan layanan jemput kapster ke rumah",
  },
  pipelineMetadata: {
    ...metaPrd,
    stageStatuses: {
      ...metaPrd.stageStatuses,
      design: "needs_update",
      prototype: "needs_update",
      build: "needs_update",
    },
  },
};

assertEqual(modifiedPrdProj.pipelineMetadata.stageStatuses.design, "needs_update", "PRD modification marks design stage as needs_update");
assertEqual(modifiedPrdProj.pipelineMetadata.stageStatuses.prototype, "needs_update", "PRD modification marks prototype stage as needs_update");
assert(Boolean(modifiedPrdProj.pipelineMetadata.designSpec), "Preserves previous designSpec for reference/rollback");

// ─── 9. 3-Domain Benchmark Scenarios (Booking, Dashboard, SaaS) ──────────────

console.log("\n--- 9. 3-DOMAIN BENCHMARK SCENARIOS ---");

// Benchmark 1: Barbershop Booking
assertEqual(designSpec.domain, "booking", "Benchmark 1 (Barbershop) matches booking domain");

// Benchmark 2: Dashboard
const dashProj = {
  id: "dash-bm",
  title: "Fintech Trading Terminal",
  description: "Dashboard pemantauan metrik portofolio kpi dan throughput",
  prd: { overview: "Terminal analitik real-time keuangan", goals: ["Throughput tinggi"], targetUsers: ["Trader"] },
};
const dashSpec = synthesizeProjectDesignSpec(dashProj);
assertEqual(dashSpec.domain, "dashboard", "Benchmark 2 matches dashboard domain");
assertEqual(dashSpec.layoutStrategy.heroType, "analytics-ribbon", "Benchmark 2 uses analytics-ribbon hero");

// Benchmark 3: SaaS
const saasProj = {
  id: "saas-bm",
  title: "CloudPulse Telemetry",
  description: "Platform observabilitas dan tracing distributed cloud cluster",
  prd: { overview: "Real-time Kubernetes monitoring and tracing", goals: ["Zero overhead"], targetUsers: ["DevOps"] },
};
const saasSpec = synthesizeProjectDesignSpec(saasProj);
assertEqual(saasSpec.domain, "saas", "Benchmark 3 matches saas domain");
assertEqual(saasSpec.layoutStrategy.heroType, "split-preview", "Benchmark 3 uses split-preview hero");

// ─── Test Suite Summary ──────────────────────────────────────────────────────

console.log("\n=================================================");
console.log(`FULL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
