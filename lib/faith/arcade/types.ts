export interface QuizQuestion {
  id: string;
  category: 'Perjanjian Lama' | 'Perjanjian Baru' | 'Injil & Yesus' | 'Para Rasul' | 'Hikmat & Mazmur';
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  verseRef?: string;
}

export interface QuizPowerUps {
  fiftyFifty: number;
  extraTime: number;
  doubleScore: number;
}

export interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  bestCombo: number;
  coinsEarned: number;
  xpEarned: number;
  isDailyChallenge?: boolean;
}

export type PetStage = 'egg' | 'baby' | 'young' | 'adult';

export interface FoodItem {
  id: string;
  name: string;
  icon: string;
  hungerBoost: number;
  happinessBoost: number;
  price: number;
  isFavorite?: boolean;
}

export interface WardrobeItem {
  id: string;
  name: string;
  icon: string;
  type: 'hat' | 'glasses' | 'accessory';
  price: number;
  isUnlockedByDefault?: boolean;
  svgElement?: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  icon: string;
  type: 'bed' | 'plant' | 'wall' | 'toy' | 'chair' | 'decor';
  price: number;
  isUnlockedByDefault?: boolean;
}

export interface PetState {
  name: string;
  stage: PetStage;
  happiness: number; // 0 - 100
  hunger: number;    // 0 - 100
  energy: number;    // 0 - 100
  cleanliness: number; // 0 - 100
  level: number;
  xp: number;
  xpToNextLevel: number;
  isSleeping: boolean;
  sleepStartedAt: number | null;
  lastInteraction: number;
  equippedHat: string | null;
  equippedGlasses: string | null;
  equippedAccessory: string | null;
  equippedBed: string;
  equippedPlant: string | null;
  equippedWall: string | null;
  equippedToy: string | null;
  foodInventory: Record<string, number>;
  unlockedWardrobe: string[];
  unlockedFurniture: string[];
}

export interface ArcadeEconomy {
  coins: number;
  xp: number;
  dailyChallengeDoneDate: string | null;
  dailyStreak: number;
  lastLoginDate: string | null;
  claimedDailyRewards: number[];
}
