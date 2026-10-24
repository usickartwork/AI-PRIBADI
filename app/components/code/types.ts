import { ProjectItem, ProjectTask } from "../CodeWorkspace";

export type ProductBuilderStage = "idea" | "prd" | "design" | "prototype" | "tasks";

export type StageStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_review"
  | "approved"
  | "needs_update"
  | "failed";

export type TargetPlatform = "website" | "mobile" | "both";

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

export interface ProductBuilderData {
  currentStage: ProductBuilderStage;
  stageStatuses: Record<ProductBuilderStage, StageStatus>;
  ideaBrief: IdeaBrief;
  designSpec: DesignSpecification;
  prototypeState: PrototypeState;
  enhancedTasks?: EnhancedProjectTask[];
  approvals: {
    prdApprovedAt?: number;
    designApprovedAt?: number;
    prototypeApprovedAt?: number;
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
    description: "Rumuskan ide produk dan target audiens",
  },
  prd: {
    number: 2,
    id: "prd",
    label: "PRD",
    description: "Dokumen spesifikasi dan kebutuhan produk",
  },
  design: {
    number: 3,
    id: "design",
    label: "Design",
    description: "Spesifikasi antarmuka dan preview visual nyata",
  },
  prototype: {
    number: 4,
    id: "prototype",
    label: "Prototype",
    description: "Uji alur interaksi produk di browser",
  },
  tasks: {
    number: 5,
    id: "tasks",
    label: "Agent & Tasks",
    description: "Rencana task implementasi & artefak kode",
  },
};

export const DEFAULT_STAGE_STATUSES: Record<ProductBuilderStage, StageStatus> = {
  idea: "in_progress",
  prd: "not_started",
  design: "not_started",
  prototype: "not_started",
  tasks: "not_started",
};

/**
 * Normalisasi data project existing agar memiliki state Product Builder lengkap
 */
export function normalizeProductBuilderData(project: ProjectItem): ProductBuilderData {
  const existingBuilder = project.productBuilder;

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
    tasks: hasTasks ? "ready_for_review" : "not_started",
  };

  const defaultStage: ProductBuilderStage = hasTasks
    ? "tasks"
    : hasHtml
    ? "design"
    : hasPrd
    ? "prd"
    : "idea";

  return {
    currentStage: existingBuilder?.currentStage || defaultStage,
    stageStatuses: existingBuilder?.stageStatuses || initialStatuses,
    ideaBrief: existingBuilder?.ideaBrief || {
      idea: project.description || project.title || "",
      targetPlatform: "website",
      targetAudience: project.prd?.targetUsers?.join(", ") || "",
      goals: project.prd?.goals?.join(", ") || "",
      designPreferences: "",
    },
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
