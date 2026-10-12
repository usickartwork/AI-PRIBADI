// ─── Usick Survival — static game data (items, recipes, tuning) ──────────────

export type ItemId =
  | "wood"
  | "stone"
  | "fiber"
  | "leaves"
  | "berries"
  | "raw_meat"
  | "cooked_meat"
  | "axe"
  | "spear"
  | "campfire"
  | "shelter"
  | "floor"
  | "wall"
  | "door"
  | "roof"
  | "workbench";

export type ItemKind = "resource" | "food" | "tool" | "weapon" | "build";

export interface ItemDef {
  id: ItemId;
  name: string;
  kind: ItemKind;
  maxStack: number;
  description: string;
  food?: { hunger: number; health: number };
}

export const ITEMS: Record<ItemId, ItemDef> = {
  wood: { id: "wood", name: "Wood", kind: "resource", maxStack: 50, description: "Kayu untuk alat, api unggun, dan bangunan." },
  stone: { id: "stone", name: "Stone", kind: "resource", maxStack: 50, description: "Batu untuk peralatan dan crafting." },
  fiber: { id: "fiber", name: "Fiber", kind: "resource", maxStack: 50, description: "Serat tanaman untuk tali dan ikatan." },
  leaves: { id: "leaves", name: "Leaves", kind: "resource", maxStack: 50, description: "Daun lebar untuk atap shelter." },
  berries: {
    id: "berries", name: "Berries", kind: "food", maxStack: 20,
    description: "Buah beri liar. Mengisi sedikit rasa lapar.",
    food: { hunger: 12, health: 2 },
  },
  raw_meat: {
    id: "raw_meat", name: "Raw Meat", kind: "food", maxStack: 20,
    description: "Daging mentah. Lebih baik dimasak di Campfire.",
    food: { hunger: 14, health: -6 },
  },
  cooked_meat: {
    id: "cooked_meat", name: "Cooked Meat", kind: "food", maxStack: 20,
    description: "Daging matang. Sangat mengenyangkan dan memulihkan health.",
    food: { hunger: 38, health: 12 },
  },
  axe: { id: "axe", name: "Wooden Axe", kind: "tool", maxStack: 1, description: "Kapak untuk menebang pohon. Serangan sedang." },
  spear: { id: "spear", name: "Wooden Spear", kind: "weapon", maxStack: 1, description: "Tombak dengan jangkauan panjang dan damage tinggi." },
  campfire: { id: "campfire", name: "Campfire", kind: "build", maxStack: 10, description: "Memasak daging, memberi cahaya, dan memulihkan health." },
  shelter: { id: "shelter", name: "Simple Shelter", kind: "build", maxStack: 5, description: "Tempat berteduh untuk beristirahat." },
  floor: { id: "floor", name: "Wooden Floor", kind: "build", maxStack: 30, description: "Fondasi bangunan (grid 3×3)." },
  wall: { id: "wall", name: "Wooden Wall", kind: "build", maxStack: 30, description: "Dinding kayu yang menempel di sisi grid." },
  door: { id: "door", name: "Wooden Door", kind: "build", maxStack: 10, description: "Pintu yang bisa dibuka dan ditutup." },
  roof: { id: "roof", name: "Wooden Roof", kind: "build", maxStack: 30, description: "Atap di atas lantai kayu." },
  workbench: { id: "workbench", name: "Basic Workbench", kind: "build", maxStack: 5, description: "Diperlukan untuk resep lanjutan." },
};

export const ALL_ITEM_IDS = Object.keys(ITEMS) as ItemId[];

export function isItemId(v: unknown): v is ItemId {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(ITEMS, v);
}

export type RecipeCategory = "Tools" | "Weapons" | "Survival" | "Building";

export interface Recipe {
  id: string;
  output: ItemId;
  qty: number;
  category: RecipeCategory;
  cost: Partial<Record<ItemId, number>>;
  needsWorkbench?: boolean;
}

export const RECIPES: Recipe[] = [
  { id: "r_axe", output: "axe", qty: 1, category: "Tools", cost: { wood: 3, stone: 2, fiber: 2 } },
  { id: "r_spear", output: "spear", qty: 1, category: "Weapons", cost: { wood: 4, fiber: 3 } },
  { id: "r_campfire", output: "campfire", qty: 1, category: "Survival", cost: { wood: 5, stone: 3 } },
  { id: "r_shelter", output: "shelter", qty: 1, category: "Survival", cost: { wood: 8, fiber: 4, leaves: 6 } },
  { id: "r_workbench", output: "workbench", qty: 1, category: "Building", cost: { wood: 6, stone: 4 } },
  { id: "r_floor", output: "floor", qty: 1, category: "Building", cost: { wood: 4 } },
  { id: "r_wall", output: "wall", qty: 1, category: "Building", cost: { wood: 3 } },
  { id: "r_door", output: "door", qty: 1, category: "Building", cost: { wood: 3, fiber: 2 }, needsWorkbench: true },
  { id: "r_roof", output: "roof", qty: 1, category: "Building", cost: { wood: 3 }, needsWorkbench: true },
];

export const RECIPE_CATEGORIES: RecipeCategory[] = ["Tools", "Weapons", "Survival", "Building"];

export type BuildType = "floor" | "wall" | "door" | "roof" | "campfire" | "workbench" | "shelter";
export const BUILD_TYPES: BuildType[] = ["floor", "wall", "door", "roof", "campfire", "workbench", "shelter"];

export function isBuildType(v: unknown): v is BuildType {
  return typeof v === "string" && (BUILD_TYPES as string[]).includes(v);
}

export function recipeFor(item: ItemId): Recipe | undefined {
  return RECIPES.find((r) => r.output === item);
}

// ─── Tuning ─────────────────────────────────────────────────────────────────
export const TUNING = {
  worldSeed: 20261012,
  worldHalf: 100, // world spans -100..100
  playableHalf: 88,
  gridCell: 3, // building grid
  inventorySize: 20,
  hotbarSize: 5,
  walkSpeed: 4.6,
  runSpeed: 8.2,
  jumpVelocity: 7.2,
  gravity: 22,
  hungerPerSecond: 100 / 660, // ~11 minutes from full to empty
  starveDamagePerSecond: 1.2,
  regenPerSecond: 0.45,
  campfireRegenPerSecond: 1.4,
  staminaRunCost: 16,
  staminaJumpCost: 10,
  staminaActionCost: 5,
  staminaRegen: 14,
  dayLengthSeconds: 480,
  interactRange: 2.7,
  autosaveSeconds: 30,
  boarCount: 7,
  boarHp: 60,
  boarDamage: 10,
  boarRespawnSeconds: 180,
  nodeRespawnSeconds: 300,
  treeRespawnSeconds: 600,
  maxDrops: 30,
  dropLifetimeSeconds: 300,
} as const;

export const SAVE_VERSION = 1;

