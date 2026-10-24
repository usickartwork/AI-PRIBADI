export interface ProjectItemLike {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  prd?: {
    overview?: string;
    targetUsers?: string[];
    goals?: string[];
    keyFeatures?: string[];
    [key: string]: unknown;
  };
  features?: Array<{
    id?: string;
    name?: string;
    title?: string;
    description?: string;
    priority?: string;
    [key: string]: unknown;
  }>;
  generatedHtml?: string;
  tasks?: unknown[];
  pipelineMetadata?: PipelineMetadata;
  [key: string]: unknown;
}

export type ProjectItem = ProjectItemLike;

export type BuilderStage =
  | "idea"
  | "prd"
  | "design"
  | "prototype"
  | "build"
  | "test"
  | "preview";

export type StageStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_review"
  | "approved"
  | "needs_update"
  | "failed";

export interface ColorToken {
  name: string;
  value: string;
  role: "background" | "surface" | "border" | "primary" | "accent" | "text" | "muted";
}

export interface DesignSpec {
  version: number;
  productGoal: string;
  targetAudience: string;
  domain: "saas" | "dashboard" | "booking" | "portfolio" | "ecommerce" | "general";
  visualArchetype: string;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    primary: string;
    accent: string;
    text: string;
    mutedText: string;
  };
  typography: {
    primaryFont: string;
    headingFont: string;
    fontImportUrl: string;
    displayScale: string;
    h1Scale: string;
    bodyScale: string;
  };
  layoutStrategy: {
    heroType: string;
    containerMax: string;
    cardRadius: string;
    sectionSequence: string[];
  };
  components: {
    name: string;
    description: string;
    behavior: string;
  }[];
  interactivePatterns: string[];
  approvedAt?: number;
}

export interface PrototypeState {
  html: string;
  version: number;
  testedInteractions: { id: string; label: string; tested: boolean }[];
  approvedAt?: number;
}

export interface DiagnosticCheck {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  passed: boolean;
  detail: string;
  filePath?: string;
}

export interface BuildState {
  files: Record<string, string>;
  status: "idle" | "building" | "success" | "failed";
  logs: string[];
  updatedAt: number;
}

export interface TestState {
  score: number; // 0 - 100
  passed: boolean;
  checks: DiagnosticCheck[];
  testedAt: number;
}

export interface RevisionEntry {
  id: string;
  stage: BuilderStage;
  instruction: string;
  timestamp: number;
  summary: string;
}

export interface PipelineMetadata {
  currentStage: BuilderStage;
  stageStatuses: Record<BuilderStage, StageStatus>;
  approvedPrdVersion?: number;
  designSpec?: DesignSpec;
  prototypeState?: PrototypeState;
  buildState?: BuildState;
  testState?: TestState;
  revisions: RevisionEntry[];
  stageTimestamps: Record<BuilderStage, { startedAt?: number; completedAt?: number }>;
}

/**
 * Normalizes and guarantees pipeline metadata on any ProjectItem.
 * Fully backward-compatible with legacy projects.
 */
export function normalizePipelineMetadata(project: ProjectItem): PipelineMetadata {
  const existing = (project as unknown as { pipelineMetadata?: PipelineMetadata }).pipelineMetadata;

  const hasPrd = Boolean(
    project.prd &&
      (project.prd.overview || (project.prd.goals && project.prd.goals.length > 0))
  );
  const hasHtml = Boolean(project.generatedHtml && project.generatedHtml.trim().length > 0);
  const hasTasks = Boolean(project.tasks && project.tasks.length > 0);

  const defaultStage: BuilderStage = hasHtml
    ? "prototype"
    : hasPrd
    ? "design"
    : "idea";

  const initialStatuses: Record<BuilderStage, StageStatus> = {
    idea: hasPrd ? "approved" : "in_progress",
    prd: hasPrd ? "approved" : "not_started",
    design: hasHtml ? "approved" : hasPrd ? "ready_for_review" : "not_started",
    prototype: hasHtml ? "ready_for_review" : "not_started",
    build: hasTasks ? "ready_for_review" : "not_started",
    test: hasTasks ? "ready_for_review" : "not_started",
    preview: hasHtml ? "ready_for_review" : "not_started",
  };

  return {
    currentStage: existing?.currentStage || defaultStage,
    stageStatuses: {
      ...initialStatuses,
      ...(existing?.stageStatuses || {}),
    },
    approvedPrdVersion: existing?.approvedPrdVersion || (hasPrd ? 1 : undefined),
    designSpec: existing?.designSpec,
    prototypeState: existing?.prototypeState || (hasHtml ? { html: project.generatedHtml!, version: 1, testedInteractions: [] } : undefined),
    buildState: existing?.buildState,
    testState: existing?.testState,
    revisions: existing?.revisions || [],
    stageTimestamps: existing?.stageTimestamps || {
      idea: { startedAt: project.createdAt, completedAt: hasPrd ? project.createdAt : undefined },
      prd: { startedAt: project.createdAt, completedAt: hasPrd ? project.updatedAt : undefined },
      design: {},
      prototype: {},
      build: {},
      test: {},
      preview: {},
    },
  };
}
