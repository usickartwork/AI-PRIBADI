import { ProjectItem, ProjectTask } from "../CodeWorkspace";

export type ProductBuilderStage =
  | "idea"
  | "prd"
  | "design"
  | "prototype"
  | "build"
  | "editor"
  | "test_debug";

export type StageStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_review"
  | "approved"
  | "needs_update"
  | "failed";

export type TargetPlatform = "website" | "mobile" | "both";

export type VisualDirection =
  | "modern_dark"
  | "high_tech"
  | "warm_editorial"
  | "clean_monochrome";

export interface DesignTokens {
  direction: VisualDirection;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    mutedText: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    displaySize: string;
    heading1Size: string;
    heading2Size: string;
    bodySize: string;
    monoFont: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  spacingScale: string;
}

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  direction: "modern_dark",
  colors: {
    primary: "#ffffff",
    secondary: "#a1a1aa",
    background: "#090d16",
    surface: "#121216",
    border: "rgba(255, 255, 255, 0.1)",
    text: "#f4f4f5",
    mutedText: "#a1a1aa",
    accent: "#ffffff",
  },
  typography: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
    displaySize: "3.75rem",
    heading1Size: "2.25rem",
    heading2Size: "1.5rem",
    bodySize: "0.875rem",
    monoFont: "monospace",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1.5rem",
    full: "9999px",
  },
  spacingScale: "relaxed",
};

export const VISUAL_DIRECTIONS: Record<
  VisualDirection,
  { name: string; description: string; colors: DesignTokens["colors"] }
> = {
  modern_dark: {
    name: "Modern Dark Minimalist",
    description: "Kanvas gelap pekat dengan border tipis dan kontras tinggi yang elegan.",
    colors: {
      primary: "#ffffff",
      secondary: "#a1a1aa",
      background: "#090d16",
      surface: "#121216",
      border: "rgba(255, 255, 255, 0.1)",
      text: "#f4f4f5",
      mutedText: "#a1a1aa",
      accent: "#ffffff",
    },
  },
  high_tech: {
    name: "High-Tech SaaS",
    description: "Nuansa biru malam dengan aksen futuristik dan kartu glassmorphic.",
    colors: {
      primary: "#60a5fa",
      secondary: "#93c5fd",
      background: "#0a0f1d",
      surface: "#111827",
      border: "rgba(96, 165, 250, 0.2)",
      text: "#f8fafc",
      mutedText: "#94a3b8",
      accent: "#38bdf8",
    },
  },
  warm_editorial: {
    name: "Warm Editorial",
    description: "Latar hangat netral dengan tipografi tegas untuk platform konten & media.",
    colors: {
      primary: "#fbbf24",
      secondary: "#f59e0b",
      background: "#0f0e0c",
      surface: "#181714",
      border: "rgba(251, 191, 36, 0.2)",
      text: "#fafaf9",
      mutedText: "#a8a29e",
      accent: "#d97706",
    },
  },
  clean_monochrome: {
    name: "Clean Monochrome",
    description: "Hitam putih murni berpresisi tinggi dengan garis geometris bersih.",
    colors: {
      primary: "#ffffff",
      secondary: "#71717a",
      background: "#000000",
      surface: "#0f0f0f",
      border: "rgba(255, 255, 255, 0.15)",
      text: "#ffffff",
      mutedText: "#71717a",
      accent: "#e4e4e7",
    },
  },
};

export interface IdeaBrief {
  idea: string;
  targetPlatform: TargetPlatform;
  targetAudience?: string;
  goals?: string;
  designPreferences?: string;
  clarifications?: Array<{
    question: string;
    answer?: string;
  }>;
  refinedSummary?: string;
}

export interface DesignRevisionEntry {
  version: number;
  timestamp: number;
  prompt: string;
  html: string;
  summary?: string;
  changeSummary?: string;
}

export interface DesignSpecification {
  currentHtml: string;
  version: number;
  revisions: DesignRevisionEntry[];
  lastGeneratedAt?: number;
}

export interface PrototypeState {
  approvedAt?: number;
  notes?: string;
  interactionChecklist?: Array<{
    id: string;
    title: string;
    description: string;
    tested?: boolean;
  }>;
}

export interface EnhancedProjectTask extends ProjectTask {
  suggestedFiles?: string[];
  suggestedTests?: string[];
}

export interface BuildCheckpoint {
  id: string;
  version: number;
  timestamp: number;
  summary: string;
  files: Record<string, string>;
}

export interface DiagnosticIssue {
  id: string;
  severity: "error" | "warning" | "info";
  file?: string;
  filePath?: string;
  line?: number;
  message: string;
  suggestion?: string;
  fixSuggestion?: string;
}

export type BuildStatus = "idle" | "building" | "completed" | "success" | "error";

export interface AppBuilderState {
  files: Record<string, string>;
  activeFilePath: string;
  buildStatus: BuildStatus;
  buildStep?: number;
  lastBuildAt?: number;
  checkpoints: BuildCheckpoint[];
  issues: DiagnosticIssue[];
}

export const DEFAULT_APP_BUILDER_STATE: AppBuilderState = {
  files: {},
  activeFilePath: "app/page.tsx",
  buildStatus: "idle",
  checkpoints: [],
  issues: [],
};

export interface ProductBuilderData {
  currentStage: ProductBuilderStage;
  stageStatuses: Record<ProductBuilderStage, StageStatus>;
  ideaBrief: IdeaBrief;
  designSpec: DesignSpecification;
  designTokens: DesignTokens;
  prototypeState: PrototypeState;
  appBuilder: AppBuilderState;
  enhancedTasks?: EnhancedProjectTask[];
  approvals: {
    prdApprovedAt?: number;
    designApprovedAt?: number;
    prototypeApprovedAt?: number;
    buildApprovedAt?: number;
    tasksApprovedAt?: number;
  };
}

export const STAGE_CONFIG: Record<
  ProductBuilderStage,
  {
    number: number;
    id: ProductBuilderStage;
    label: string;
    description: string;
  }
> = {
  idea: {
    number: 1,
    id: "idea",
    label: "Idea",
    description: "Rumuskan konsep produk dan spesifikasi awal",
  },
  prd: {
    number: 2,
    id: "prd",
    label: "PRD",
    description: "Dokumen kebutuhan & model data aplikasi",
  },
  design: {
    number: 3,
    id: "design",
    label: "Design System",
    description: "Visual direction, design tokens & layout",
  },
  prototype: {
    number: 4,
    id: "prototype",
    label: "Prototype",
    description: "Uji alur simulasi interaksi di browser",
  },
  build: {
    number: 5,
    id: "build",
    label: "Build App",
    description: "Generasi struktur kode Next.js & komponen",
  },
  editor: {
    number: 6,
    id: "editor",
    label: "Code Editor",
    description: "File explorer & editor kode dengan checkpoint",
  },
  test_debug: {
    number: 7,
    id: "test_debug",
    label: "Test & Debug",
    description: "Diagnostik kode, task planner & ekspor",
  },
};

export const DEFAULT_STAGE_STATUSES: Record<ProductBuilderStage, StageStatus> = {
  idea: "in_progress",
  prd: "not_started",
  design: "not_started",
  prototype: "not_started",
  build: "not_started",
  editor: "not_started",
  test_debug: "not_started",
};

/**
 * Normalisasi data project existing agar memiliki state Product Builder lengkap
 */
export function normalizeProductBuilderData(project: ProjectItem): ProductBuilderData {
  const anyProj = project as unknown as { productBuilder?: Partial<ProductBuilderData> & { stageStatuses?: Record<string, StageStatus> } };
  const existingBuilder = anyProj.productBuilder;

  // Deteksi status dari data existing (backward compatibility)
  const hasPrd = Boolean(
    project.prd &&
      (project.prd.overview || (project.prd.goals && project.prd.goals.length > 0))
  );
  const hasHtml = Boolean(project.generatedHtml && project.generatedHtml.trim().length > 0);
  const hasTasks = Boolean(project.tasks && project.tasks.length > 0);

  const initialStatuses: Record<ProductBuilderStage, StageStatus> = {
    idea: hasPrd ? "approved" : "in_progress",
    prd: hasPrd ? "approved" : "not_started",
    design: hasHtml ? "ready_for_review" : hasPrd ? "ready_for_review" : "not_started",
    prototype: hasHtml ? "ready_for_review" : "not_started",
    build: hasHtml ? "ready_for_review" : "not_started",
    editor: hasHtml ? "ready_for_review" : "not_started",
    test_debug: hasTasks ? "ready_for_review" : "not_started",
  };

  // Map legacy stage "tasks" to "test_debug"
  let initialStage: ProductBuilderStage = hasTasks
    ? "test_debug"
    : hasHtml
    ? "design"
    : hasPrd
    ? "prd"
    : "idea";

  if (existingBuilder?.currentStage) {
    if ((existingBuilder.currentStage as string) === "tasks") {
      initialStage = "test_debug";
    } else {
      initialStage = existingBuilder.currentStage as ProductBuilderStage;
    }
  }

  const existingStatuses = (existingBuilder?.stageStatuses || {}) as Record<string, StageStatus>;
  const mergedStatuses: Record<ProductBuilderStage, StageStatus> = {
    ...initialStatuses,
    idea: existingStatuses.idea || initialStatuses.idea,
    prd: existingStatuses.prd || initialStatuses.prd,
    design: existingStatuses.design || initialStatuses.design,
    prototype: existingStatuses.prototype || initialStatuses.prototype,
    build: existingStatuses.build || initialStatuses.build,
    editor: existingStatuses.editor || initialStatuses.editor,
    test_debug: existingStatuses.test_debug || existingStatuses.tasks || initialStatuses.test_debug,
  };

  return {
    currentStage: initialStage,
    stageStatuses: mergedStatuses,
    ideaBrief: existingBuilder?.ideaBrief || {
      idea: project.description || project.title || "",
      targetPlatform: "website",
      targetAudience: project.prd?.targetUsers?.join(", ") || "",
      goals: project.prd?.goals?.join(", ") || "",
      designPreferences: "",
    },
    designTokens: existingBuilder?.designTokens || DEFAULT_DESIGN_TOKENS,
    designSpec: existingBuilder?.designSpec || {
      currentHtml: project.generatedHtml || "",
      version: 1,
      revisions: project.generatedHtml
        ? [
            {
              version: 1,
              timestamp: project.updatedAt || Date.now(),
              prompt: "Desain Awal dari PRD",
              html: project.generatedHtml,
              summary: "Inisialisasi spesifikasi UI dari PRD",
            },
          ]
        : [],
      lastGeneratedAt: project.updatedAt,
    },
    prototypeState: existingBuilder?.prototypeState || {
      interactionChecklist: [
        {
          id: "flow-1",
          title: "Navigasi Menu & Link Utama",
          description: "Periksa apakah navigasi header dan link halaman merespons dengan baik.",
        },
        {
          id: "flow-2",
          title: "Interaksi Tombol Aksi (CTA)",
          description: "Klik tombol utama dan periksa feedback simulasi di layar.",
        },
        {
          id: "flow-3",
          title: "Pengisian & Validasi Form",
          description: "Coba isi input form dan kirim data untuk menguji respon lokal.",
        },
        {
          id: "flow-4",
          title: "Responsivitas Mobile & Desktop",
          description: "Ganti tampilan ke ukuran Mobile untuk melihat adaptasi tata letak.",
        },
      ],
    },
    appBuilder: existingBuilder?.appBuilder || {
      files: {},
      activeFilePath: "app/page.tsx",
      buildStatus: "idle",
      checkpoints: [],
      issues: [],
    },
    enhancedTasks: existingBuilder?.enhancedTasks || project.tasks.map((t) => ({
      ...t,
      suggestedFiles: [
        `app/components/${t.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.tsx`,
        `app/api/${t.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}/route.ts`,
      ],
      suggestedTests: [
        `Unit test untuk komponen ${t.title}`,
        `Integration test skenario sukses dan error`,
      ],
    })),
    approvals: existingBuilder?.approvals || {
      prdApprovedAt: hasPrd ? project.updatedAt : undefined,
      designApprovedAt: hasHtml ? project.updatedAt : undefined,
      tasksApprovedAt: hasTasks ? project.updatedAt : undefined,
    },
  };
}
