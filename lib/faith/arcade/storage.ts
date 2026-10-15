import { PetState, ArcadeEconomy, PetStage } from './types';

const ECONOMY_KEY = 'faith_hub_arcade_economy';
const PET_KEY = 'faith_hub_arcade_pet';

const DEFAULT_ECONOMY: ArcadeEconomy = {
  coins: 50, // Initial welcome starter coins
  xp: 0,
  dailyChallengeDoneDate: null,
  dailyStreak: 1,
  lastLoginDate: null,
  claimedDailyRewards: [],
};

const DEFAULT_PET: PetState = {
  name: 'Barnaby',
  stage: 'egg',
  happiness: 85,
  hunger: 80,
  energy: 90,
  cleanliness: 75,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  isSleeping: false,
  sleepStartedAt: null,
  lastInteraction: Date.now(),
  equippedHat: 'halo',
  equippedGlasses: null,
  equippedAccessory: 'bowtie',
  equippedBed: 'bed_basic',
  equippedPlant: 'plant_monstera',
  equippedWall: 'frame_cross',
  equippedToy: null,
  foodInventory: {
    apple: 3,
    bread: 2,
  },
  unlockedWardrobe: ['halo', 'bowtie'],
  unlockedFurniture: ['bed_basic', 'plant_monstera', 'frame_cross', 'candle_faith'],
};

function determineStage(level: number): PetStage {
  if (level < 3) return 'egg';
  if (level < 6) return 'baby';
  if (level < 10) return 'young';
  return 'adult';
}

function calculateLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
  // Level progression formula
  let lvl = 1;
  let req = 100;
  let remaining = xp;

  while (remaining >= req) {
    remaining -= req;
    lvl++;
    req = Math.floor(req * 1.35);
  }

  return { level: lvl, currentXp: remaining, nextLevelXp: req };
}

export function getArcadeEconomy(): ArcadeEconomy {
  if (typeof window === 'undefined') return DEFAULT_ECONOMY;
  try {
    const raw = localStorage.getItem(ECONOMY_KEY);
    if (!raw) {
      saveArcadeEconomy(DEFAULT_ECONOMY);
      return DEFAULT_ECONOMY;
    }
    const data = JSON.parse(raw) as ArcadeEconomy;
    return { ...DEFAULT_ECONOMY, ...data };
  } catch {
    return DEFAULT_ECONOMY;
  }
}

export function saveArcadeEconomy(economy: ArcadeEconomy) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ECONOMY_KEY, JSON.stringify(economy));
    window.dispatchEvent(new Event('faith_arcade_economy_updated'));
  } catch (e) {
    console.error('Failed to save arcade economy', e);
  }
}

export function addCoinsAndXp(coins: number, xp: number): ArcadeEconomy {
  const current = getArcadeEconomy();
  const updated: ArcadeEconomy = {
    ...current,
    coins: Math.max(0, current.coins + coins),
    xp: current.xp + xp,
  };
  saveArcadeEconomy(updated);
  return updated;
}

/**
 * Real-time decay calculation when web is closed, tab is in background, or device is locked
 */
export function applyOfflineDecay(pet: PetState): PetState {
  const now = Date.now();
  const lastTime = pet.lastInteraction || now;
  const elapsedSeconds = Math.max(0, Math.floor((now - lastTime) / 1000));

  if (elapsedSeconds < 3) return pet;

  const updated: PetState = { ...pet };

  if (updated.isSleeping) {
    // SLEEPING:
    // Energy recharges +1% every 8s (~7.5% per minute, ~75% per 10 mins)
    const energyGain = Math.round((elapsedSeconds / 8) * 10) / 10;
    updated.energy = Math.min(100, Math.round((updated.energy + energyGain) * 10) / 10);

    // Hunger drops slightly while sleeping: 1% every 90s (~0.67% per minute)
    const hungerLoss = Math.round((elapsedSeconds / 90) * 10) / 10;
    updated.hunger = Math.max(5, Math.round((updated.hunger - hungerLoss) * 10) / 10);
  } else {
    // AWAKE (Website closed / tab in background / phone locked):
    // 1. Hunger: drops 1% every 25 seconds (~2.4% per min, ~24% per 10 mins)
    const hungerLoss = Math.round((elapsedSeconds / 25) * 10) / 10;
    updated.hunger = Math.max(5, Math.round((updated.hunger - hungerLoss) * 10) / 10);

    // 2. Cleanliness: drops 1% every 35 seconds (~1.7% per min, ~17% per 10 mins)
    const cleanLoss = Math.round((elapsedSeconds / 35) * 10) / 10;
    updated.cleanliness = Math.max(5, Math.round((updated.cleanliness - cleanLoss) * 10) / 10);

    // 3. Energy: drops 1% every 45 seconds (~1.3% per min, ~13% per 10 mins)
    const energyLoss = Math.round((elapsedSeconds / 45) * 10) / 10;
    updated.energy = Math.max(5, Math.round((updated.energy - energyLoss) * 10) / 10);

    // 4. Happiness:
    // Natural neglect: 1% every 60s
    let happyLoss = Math.round((elapsedSeconds / 60) * 10) / 10;
    // Extra unhappiness if starving or dirty
    if (updated.hunger < 40 || updated.cleanliness < 40) {
      happyLoss += Math.round((elapsedSeconds / 40) * 10) / 10;
    }
    updated.happiness = Math.max(5, Math.round((updated.happiness - happyLoss) * 10) / 10);
  }

  updated.lastInteraction = now;
  return updated;
}

export function getPetState(): PetState {
  if (typeof window === 'undefined') return DEFAULT_PET;
  try {
    const raw = localStorage.getItem(PET_KEY);
    let pet = DEFAULT_PET;
    if (raw) {
      pet = { ...DEFAULT_PET, ...JSON.parse(raw) };
    }

    // Apply accurate offline / background time decay
    const decayed = applyOfflineDecay(pet);
    if (decayed !== pet) {
      localStorage.setItem(PET_KEY, JSON.stringify(decayed));
      pet = decayed;
    }

    return pet;
  } catch {
    return DEFAULT_PET;
  }
}

export function savePetState(pet: PetState) {
  if (typeof window === 'undefined') return;
  try {
    // Recompute level and stage
    const { level, currentXp, nextLevelXp } = calculateLevel(pet.xp);
    pet.level = level;
    pet.xpToNextLevel = nextLevelXp;
    pet.stage = determineStage(level);
    pet.lastInteraction = Date.now();

    localStorage.setItem(PET_KEY, JSON.stringify(pet));
    window.dispatchEvent(new Event('faith_arcade_pet_updated'));
  } catch (e) {
    console.error('Failed to save pet state', e);
  }
}

export function addPetXp(pet: PetState, xpGained: number): PetState {
  const updatedPet = {
    ...pet,
    xp: pet.xp + xpGained,
  };
  savePetState(updatedPet);
  return updatedPet;
}
