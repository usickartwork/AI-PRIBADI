export type BuildingCategory =
  | 'church'
  | 'community'
  | 'worship'
  | 'social'
  | 'outdoor'
  | 'path'
  | 'decoration';

export interface BuildingDef {
  id: string;
  name: string;
  category: BuildingCategory;
  width: number; // in grid tiles (e.g. 1 or 2)
  height: number;
  costCoins: number;
  costMaterials: number;
  faithBonus: number;
  incomePerMin: number; // Coins generated
  capacityBonus: number; // Visitor capacity increase
  requiredCommunityLevel: number;
  description: string;
}

export interface PlacedBuilding {
  instanceId: string;
  defId: string;
  gridX: number;
  gridY: number;
  level: number;
  placedAt: number;
}

export interface GridTile {
  x: number;
  y: number;
  isUnlocked: boolean;
  pathType?: 'stone' | 'brick' | null;
  buildingInstanceId?: string | null;
  decorationId?: string | null;
}

export interface BuilderNPC {
  id: string;
  name: string;
  role: 'visitor' | 'youth' | 'child' | 'elder' | 'pastor';
  x: number; // in tile coordinate units (fractional for smooth walking)
  y: number;
  targetX: number;
  targetY: number;
  state: 'walking' | 'sitting' | 'praying' | 'visiting';
  facing: 'left' | 'right';
  bubbleText?: string | null;
  bubbleExpiresAt?: number;
  hairColor: string;
  shirtColor: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardMaterials: number;
  rewardFaith: number;
  completed: boolean;
  claimed: boolean;
}

export interface ChurchBuilderState {
  communityName: string;
  communityLevel: number;
  communityXp: number;
  communityXpNeeded: number;
  coins: number;
  materials: number;
  faithPoints: number;
  currentVisitors: number;
  gridWidth: number;
  gridHeight: number;
  tiles: GridTile[];
  buildings: PlacedBuilding[];
  timeOfDay: TimeOfDay;
  timeSpeed: 1 | 2 | 4;
  weather: 'sunny' | 'rain';
  lastSavedAt: number;
  unlockedPlots: string[]; // e.g. "plot_0_0", "plot_1_0"
  missions: DailyMission[];
  hasSeenTutorial: boolean;
}

export interface OfflineProgressSummary {
  elapsedSeconds: number;
  coinsEarned: number;
  materialsEarned: number;
  faithEarned: number;
}
