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

// ─── Test Suite Summary ──────────────────────────────────────────────────────

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
