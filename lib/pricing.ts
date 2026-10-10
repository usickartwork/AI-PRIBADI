export type SubscriptionPlanId = "free" | "pro" | "ultra";

export type PlanFeature = {
  text: string;
  included: boolean;
};

export type PlanDefinition = {
  id: SubscriptionPlanId;
  name: string;
  price: number | null;
  priceFormatted: string;
  period: string;
  badge?: string;
  aiCreditLimit: number;
  codeCreditLimit: number;
  scheduleLimit: number;
  allowedModels: string[] | "*"; // "*" means all enabled models
  features: PlanFeature[];
  cta: string;
  ctaAction?: "current" | "upgrade" | "disabled";
};

export type ModelPricingMetadata = {
  id: string;
  name: string;
  provider: string;
  minimumPlan: SubscriptionPlanId;
  creditMultiplier: number;
};

export type UserSubscriptionInfo = {
  userId: string;
  plan: SubscriptionPlanId;
  status: "active" | "cancelled" | "expired" | "past_due";
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  aiCredits: number;
  aiCreditLimit: number;
  codeCredits: number;
  codeCreditLimit: number;
  activeSchedulesCount: number;
  scheduleLimit: number;
  resetAt: string;
  resetsInDays: number;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  creditType: "ai" | "code";
  amount: number; // e.g. -218 for usage, +10000 for grant
  balanceBefore: number;
  balanceAfter: number;
  transactionType: "usage" | "grant" | "reset" | "adjustment" | "refund";
  modelId?: string;
  taskType?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  createdAt: string;
};

// ─── Centralized Configurable Plan Limits ──────────────────────────────────────
const FREE_AI_CREDITS = Number(process.env.FREE_AI_CREDITS) || 10000;
const FREE_CODE_CREDITS = Number(process.env.FREE_CODE_CREDITS) || 50;
const FREE_SCHEDULE_LIMIT = Number(process.env.FREE_SCHEDULE_LIMIT) || 3;

const PRO_AI_CREDITS = Number(process.env.PRO_AI_CREDITS) || 100000;
const PRO_CODE_CREDITS = Number(process.env.PRO_CODE_CREDITS) || 200;
const PRO_SCHEDULE_LIMIT = Number(process.env.PRO_SCHEDULE_LIMIT) || 50;

// Flagship model ID that is ALWAYS available for Free users
export const USICK_ONE_FLAGSHIP_MODEL = "novita:apodex/apodex-1.1-mini";

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "FREE",
    price: 0,
    priceFormatted: "Rp0",
    period: "Forever",
    aiCreditLimit: FREE_AI_CREDITS,
    codeCreditLimit: FREE_CODE_CREDITS,
    scheduleLimit: FREE_SCHEDULE_LIMIT,
    allowedModels: [USICK_ONE_FLAGSHIP_MODEL],
    features: [
      { text: "Usick One AI", included: true },
      { text: "AI Credits", included: true },
      { text: "Code Credits", included: true },
      { text: "3 Schedules", included: true },
      { text: "Email Reminders", included: true },
      { text: "Monthly Credit Reset", included: true },
      { text: "External AI Models (Gemini, Claude, GPT, dll.)", included: false },
    ],
    cta: "Start for Free",
  },
  pro: {
    id: "pro",
    name: "PRO",
    price: 49000,
    priceFormatted: "Rp49.000",
    period: "/month",
    badge: "MOST POPULAR",
    aiCreditLimit: PRO_AI_CREDITS,
    codeCreditLimit: PRO_CODE_CREDITS,
    scheduleLimit: PRO_SCHEDULE_LIMIT,
    allowedModels: "*",
    features: [
      { text: "Everything in Free", included: true },
      { text: "All Available AI Models", included: true },
      { text: "Higher AI Credits", included: true },
      { text: "Higher Code Credits", included: true },
      { text: "50 Schedules", included: true },
      { text: "Email Reminders", included: true },
      { text: "New Model Access", included: true },
      { text: "Monthly Credit Reset", included: true },
    ],
    cta: "Upgrade to Pro",
  },
  ultra: {
    id: "ultra",
    name: "ULTRA",
    price: null,
    priceFormatted: "Coming Soon",
    period: "",
    badge: "COMING SOON",
    aiCreditLimit: 500000,
    codeCreditLimit: 1000,
    scheduleLimit: 9999,
    allowedModels: "*",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Very High AI Usage", included: true },
      { text: "Very High Code Usage", included: true },
      { text: "Unlimited Schedules", included: true },
      { text: "Priority Access", included: true },
      { text: "Advanced Features", included: true },
    ],
    cta: "Coming Soon",
    ctaAction: "disabled",
  },
};

// ─── Model Multiplier Catalog (Backend Configuration) ─────────────────────────
// Usick One AI has 1x multiplier and is available for Free.
// External models require Pro and have varying credit multipliers.
export const MODEL_CATALOG: Record<string, ModelPricingMetadata> = {
  "novita:apodex/apodex-1.1-mini": {
    id: "novita:apodex/apodex-1.1-mini",
    name: "Usick One",
    provider: "novita",
    minimumPlan: "free",
    creditMultiplier: 1.0,
  },
  "novita:qwen/qwen3.8-flash": {
    id: "novita:qwen/qwen3.8-flash",
    name: "Qwen 3.8 Flash",
    provider: "novita",
    minimumPlan: "pro",
    creditMultiplier: 1.5,
  },
  "novita:inclusionai/ling-3.1-flash": {
    id: "novita:inclusionai/ling-3.1-flash",
    name: "Ling 3.1 Flash",
    provider: "novita",
    minimumPlan: "pro",
    creditMultiplier: 1.5,
  },
  "novita:moonshotai/kimi-k2-instruct": {
    id: "novita:moonshotai/kimi-k2-instruct",
    name: "Kimi K2 Instruct",
    provider: "novita",
    minimumPlan: "pro",
    creditMultiplier: 2.5,
  },
  "cloudflare:@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": {
    id: "cloudflare:@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    name: "DeepSeek R1 Distill 32B",
    provider: "cloudflare",
    minimumPlan: "pro",
    creditMultiplier: 3.0,
  },
  "cloudflare:@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
    id: "cloudflare:@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    name: "Llama 3.3 70B (Fast)",
    provider: "cloudflare",
    minimumPlan: "pro",
    creditMultiplier: 2.5,
  },
  "cloudflare:@cf/meta/llama-3.1-8b-instruct-fp8": {
    id: "cloudflare:@cf/meta/llama-3.1-8b-instruct-fp8",
    name: "Llama 3.1 8B",
    provider: "cloudflare",
    minimumPlan: "pro",
    creditMultiplier: 1.5,
  },
  "cloudflare:@cf/meta/llama-3.2-3b-instruct": {
    id: "cloudflare:@cf/meta/llama-3.2-3b-instruct",
    name: "Llama 3.2 3B",
    provider: "cloudflare",
    minimumPlan: "pro",
    creditMultiplier: 1.2,
  },
  "claude:claude-3-7-sonnet-latest": {
    id: "claude:claude-3-7-sonnet-latest",
    name: "Claude 3.7 Sonnet",
    provider: "claude",
    minimumPlan: "pro",
    creditMultiplier: 6.0,
  },
  "claude:claude-3-5-sonnet-latest": {
    id: "claude:claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    provider: "claude",
    minimumPlan: "pro",
    creditMultiplier: 5.0,
  },
  "claude:claude-3-5-haiku-latest": {
    id: "claude:claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "claude",
    minimumPlan: "pro",
    creditMultiplier: 2.0,
  },
  "claude:claude-3-opus-latest": {
    id: "claude:claude-3-opus-latest",
    name: "Claude 3 Opus",
    provider: "claude",
    minimumPlan: "pro",
    creditMultiplier: 8.0,
  },
  "groq:openai/gpt-oss-120b": {
    id: "groq:openai/gpt-oss-120b",
    name: "GPT OSS 120B (Groq)",
    provider: "groq",
    minimumPlan: "pro",
    creditMultiplier: 2.5,
  },
  "gemini:gemini-3.5-flash-lite": {
    id: "gemini:gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    provider: "gemini",
    minimumPlan: "pro",
    creditMultiplier: 2.0,
  },
  "gemini:gemini-3.1-flash-lite-preview": {
    id: "gemini:gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash Lite Preview",
    provider: "gemini",
    minimumPlan: "pro",
    creditMultiplier: 2.0,
  },
  "custom:clario/deepseek-v4.1-flash-auto": {
    id: "custom:clario/deepseek-v4.1-flash-auto",
    name: "DeepSeek V4.1 Flash (Auto)",
    provider: "custom",
    minimumPlan: "pro",
    creditMultiplier: 2.5,
  },
  "custom:clario/gpt-5.6-sol": {
    id: "custom:clario/gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "custom",
    minimumPlan: "pro",
    creditMultiplier: 5.0,
  },
  "custom:clario/minimax-m3": {
    id: "custom:clario/minimax-m3",
    name: "MiniMax M3",
    provider: "custom",
    minimumPlan: "pro",
    creditMultiplier: 3.0,
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getPlanDefinition(planId?: string): PlanDefinition {
  const normalized = (planId || "free").toLowerCase() as SubscriptionPlanId;
  return SUBSCRIPTION_PLANS[normalized] || SUBSCRIPTION_PLANS.free;
}

export function isModelAllowedForPlan(planId: string | undefined, modelId: string): boolean {
  const plan = getPlanDefinition(planId);
  if (plan.allowedModels === "*") return true;

  // Cek apakah model termasuk Usick One Flagship
  if (modelId === USICK_ONE_FLAGSHIP_MODEL) return true;
  if (modelId.toLowerCase().includes("usick")) return true;

  return Array.isArray(plan.allowedModels) && plan.allowedModels.includes(modelId);
}

export function getModelMetadata(modelId: string): ModelPricingMetadata {
  if (MODEL_CATALOG[modelId]) {
    return MODEL_CATALOG[modelId];
  }

  // Fallback metadata jika model baru belum terdaftar spesifik
  const isUsick = modelId === USICK_ONE_FLAGSHIP_MODEL || modelId.toLowerCase().includes("usick");
  return {
    id: modelId,
    name: modelId.split(/[:/]/).pop() || modelId,
    provider: modelId.split(":")[0] || "ai",
    minimumPlan: isUsick ? "free" : "pro",
    creditMultiplier: isUsick ? 1.0 : 2.5,
  };
}

/**
 * Menghitung penggunaan kredit berdasarkan token aktual x multiplier model.
 * Rumus transparan & proporsional:
 * 1 Credit = 100 token x multiplier
 * Min: 1 credit per interaksi
 */
export function calculateCreditUsage(
  modelId: string,
  inputTokens: number = 0,
  outputTokens: number = 0,
  taskType: "chat" | "code" = "chat"
): { credits: number; multiplier: number; totalTokens: number } {
  const meta = getModelMetadata(modelId);
  const totalTokens = Math.max(0, inputTokens) + Math.max(0, outputTokens);

  if (taskType === "code") {
    // Code credits dihitung per operasi (1 Code Credit = 1 operasi generasi arsitektur/PRD/fitur)
    return {
      credits: 1,
      multiplier: 1.0,
      totalTokens,
    };
  }

  // AI Credits dihitung dari token aktual
  const multiplier = meta.creditMultiplier || 1.0;
  // Rasio token: ~50-100 token per credit dengan baseline
  const baseTokens = Math.max(totalTokens, 100);
  const calculated = Math.ceil((baseTokens / 50) * multiplier);
  const credits = Math.max(1, calculated);

  return {
    credits,
    multiplier,
    totalTokens,
  };
}

export function formatCreditNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("id-ID");
}

export function getDaysUntilReset(resetDateString?: string): number {
  if (!resetDateString) {
    // Default 30 hari ke depan
    return 30;
  }
  const reset = new Date(resetDateString).getTime();
  const now = Date.now();
  const diff = reset - now;
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getNextMonthlyResetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}
