import {
  ChurchBuilderState,
  GridTile,
  PlacedBuilding,
  OfflineProgressSummary,
} from './types';
import { BUILDING_DEFS, INITIAL_MISSIONS } from './buildingData';
import { getArcadeEconomy, saveArcadeEconomy } from '@/lib/faith/arcade/storage';

const BUILDER_STORAGE_KEY = 'faith_hub_church_builder_state';

export const GRID_SIZE = 10; // 10x10 tiles

/**
 * Handles Community Level progression and XP curve
 */
export function addBuilderXp(
  state: ChurchBuilderState,
  xpGained: number
): { updatedState: ChurchBuilderState; didLevelUp: boolean; newLevel: number } {
  let xp = state.communityXp + xpGained;
  let level = state.communityLevel;
  let needed = state.communityXpNeeded;
  let didLevelUp = false;

  while (xp >= needed && level < 5) {
    xp -= needed;
    level += 1;
    needed = Math.floor(needed * 1.6);
    didLevelUp = true;
  }

  return {
    updatedState: {
      ...state,
      communityLevel: level,
      communityXp: xp,
      communityXpNeeded: needed,
    },
    didLevelUp,
    newLevel: level,
  };
}

/**
 * Automatically checks and updates daily mission completion state
 */
export function checkMissionsProgress(state: ChurchBuilderState): ChurchBuilderState {
  const hasMultipleBuildings = state.buildings.length >= 2;
  const has15Visitors = state.currentVisitors >= 15;
  const hasDecorationsOrPaths = state.tiles.some((t) => t.pathType || t.decorationId);
  const hasUpgradedBuilding = state.buildings.some((b) => b.level >= 2);

  const updatedMissions = state.missions.map((m) => {
    if (m.claimed) return m;
    let completed = m.completed;
    if (m.id === 'm_first_build' && hasMultipleBuildings) completed = true;
    if (m.id === 'm_visitors_15' && has15Visitors) completed = true;
    if (m.id === 'm_decorate' && hasDecorationsOrPaths) completed = true;
    if (m.id === 'm_upgrade_1' && hasUpgradedBuilding) completed = true;
    return { ...m, completed };
  });

  return {
    ...state,
    missions: updatedMissions,
  };
}

/**
 * Calculates active building synergies if placed adjacent to complementary facilities
 */
export function getBuildingSynergies(
  building: PlacedBuilding,
  allBuildings: PlacedBuilding[],
  tiles: GridTile[]
): { label: string; bonusText: string }[] {
  const synergies: { label: string; bonusText: string }[] = [];
  const def = BUILDING_DEFS.find((d) => d.id === building.defId);
  if (!def) return synergies;

  // Check adjacent coordinates (radius 1 around building perimeter)
  const isAdjacentToDef = (targetDefId: string) => {
    return allBuildings.some((other) => {
      if (other.instanceId === building.instanceId) return false;
      if (other.defId !== targetDefId) return false;
      const otherDef = BUILDING_DEFS.find((d) => d.id === other.defId);
      if (!otherDef) return false;

      const xDist = Math.max(0, Math.max(building.gridX - (other.gridX + otherDef.width), other.gridX - (building.gridX + def.width)));
      const yDist = Math.max(0, Math.max(building.gridY - (other.gridY + otherDef.height), other.gridY - (building.gridY + def.height)));
      return xDist <= 1 && yDist <= 1;
    });
  };

  const isAdjacentToDecor = (targetDecorId: string) => {
    return tiles.some((t) => {
      if (t.decorationId !== targetDecorId) return false;
      const xDist = Math.max(0, Math.max(building.gridX - t.x, t.x - (building.gridX + def.width)));
      const yDist = Math.max(0, Math.max(building.gridY - t.y, t.y - (building.gridY + def.height)));
      return xDist <= 1 && yDist <= 1;
    });
  };

  if (building.defId === 'small_church' || building.defId === 'chapel' || building.defId === 'main_church') {
    if (isAdjacentToDef('parking')) {
      synergies.push({ label: 'Akses Parkir', bonusText: '+15 Kapasitas Pengunjung' });
    }
    if (isAdjacentToDef('prayer_garden') || isAdjacentToDef('garden') || isAdjacentToDecor('tree_oak')) {
      synergies.push({ label: 'Taman Teduh', bonusText: '+20% Bonus Faith' });
    }
  }

  if (building.defId === 'cafe') {
    if (isAdjacentToDef('fellowship_hall') || isAdjacentToDef('playground')) {
      synergies.push({ label: 'Area Ramah Tamah', bonusText: '+25% Penghasilan Koin' });
    }
  }

  return synergies;
}

/**
 * Creates default starter plot matching brief:
 * 1 small church, paths, trees, 1 bench, 1 lamp
 */
export function createInitialBuilderState(): ChurchBuilderState {
  const tiles: GridTile[] = [];

  // Generate 10x10 tiles. Center 6x6 (x: 2..7, y: 2..7) is unlocked initially.
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isCenter = x >= 2 && x <= 7 && y >= 2 && y <= 7;
      tiles.push({
        x,
        y,
        isUnlocked: isCenter,
        pathType: null,
        buildingInstanceId: null,
        decorationId: null,
      });
    }
  }

  const starterBuildings: PlacedBuilding[] = [
    {
      instanceId: 'starter_church_1',
      defId: 'small_church',
      gridX: 4,
      gridY: 3,
      level: 1,
      placedAt: Date.now(),
    },
  ];

  // Tag tiles for Small Church (2x2 at x:4, y:3)
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const tile = tiles.find((t) => t.x === 4 + dx && t.y === 3 + dy);
      if (tile) tile.buildingInstanceId = 'starter_church_1';
    }
  }

  // Starter Paths: pathway running south from church entrance
  const pathCoords = [
    { x: 4, y: 5 },
    { x: 5, y: 5 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 3, y: 5 },
    { x: 6, y: 5 },
  ];
  pathCoords.forEach(({ x, y }) => {
    const tile = tiles.find((t) => t.x === x && t.y === y);
    if (tile) tile.pathType = 'stone';
  });

  // Starter Decorations
  // 1 Bench at (3, 6)
  const benchTile = tiles.find((t) => t.x === 3 && t.y === 6);
  if (benchTile) benchTile.decorationId = 'bench';

  // 1 Street Lamp at (6, 6)
  const lampTile = tiles.find((t) => t.x === 6 && t.y === 6);
  if (lampTile) lampTile.decorationId = 'street_lamp';

  // Trees at (2, 3) and (7, 3)
  const tree1 = tiles.find((t) => t.x === 2 && t.y === 3);
  if (tree1) tree1.decorationId = 'tree_oak';

  const tree2 = tiles.find((t) => t.x === 7 && t.y === 3);
  if (tree2) tree2.decorationId = 'tree_pine';

  return {
    communityName: 'Grace Community',
    communityLevel: 1,
    communityXp: 30,
    communityXpNeeded: 100,
    coins: 200,
    materials: 40,
    faithPoints: 25,
    currentVisitors: 6,
    gridWidth: GRID_SIZE,
    gridHeight: GRID_SIZE,
    tiles,
    buildings: starterBuildings,
    timeOfDay: 'morning',
    timeSpeed: 1,
    weather: 'sunny',
    lastSavedAt: Date.now(),
    unlockedPlots: ['plot_center'],
    missions: INITIAL_MISSIONS,
    hasSeenTutorial: false,
  };
}

export function loadBuilderState(): {
  state: ChurchBuilderState;
  offlineSummary: OfflineProgressSummary | null;
} {
  if (typeof window === 'undefined') {
    return { state: createInitialBuilderState(), offlineSummary: null };
  }

  try {
    const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialBuilderState();
      saveBuilderState(initial);
      return { state: initial, offlineSummary: null };
    }

    const state = JSON.parse(raw) as ChurchBuilderState;
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - (state.lastSavedAt || now)) / 1000));

    let offlineSummary: OfflineProgressSummary | null = null;

    // Calculate idle / offline progress if away for more than 45 seconds
    if (elapsedSeconds >= 45) {
      // Cap at 8 hours (28,800 seconds)
      const cappedSeconds = Math.min(28800, elapsedSeconds);
      const elapsedMinutes = cappedSeconds / 60;

      // Calculate building income rate per minute
      let totalCoinRatePerMin = 0;
      let totalFaithRatePerMin = 0;

      state.buildings.forEach((b) => {
        const def = BUILDING_DEFS.find((d) => d.id === b.defId);
        if (def) {
          totalCoinRatePerMin += def.incomePerMin * b.level;
          totalFaithRatePerMin += (def.faithBonus / 10) * b.level;
        }
      });

      // Decorations also produce modest passive faith
      state.tiles.forEach((t) => {
        if (t.decorationId) {
          const def = BUILDING_DEFS.find((d) => d.id === t.decorationId);
          if (def) {
            totalCoinRatePerMin += def.incomePerMin;
            totalFaithRatePerMin += def.faithBonus / 15;
          }
        }
      });

      const coinsEarned = Math.floor(totalCoinRatePerMin * elapsedMinutes);
      const materialsEarned = Math.floor(elapsedMinutes * 0.4); // ~1 wood every 2.5 minutes
      const faithEarned = Math.floor(totalFaithRatePerMin * elapsedMinutes * 0.2);

      state.coins += coinsEarned;
      state.materials += materialsEarned;
      state.faithPoints += faithEarned;
      state.lastSavedAt = now;

      offlineSummary = {
        elapsedSeconds: cappedSeconds,
        coinsEarned,
        materialsEarned,
        faithEarned,
      };

      saveBuilderState(state);
    }

    // Synchronize starting/highest coins with shared arcade economy
    const arcadeEcon = getArcadeEconomy();
    if (arcadeEcon.coins > state.coins) {
      state.coins = arcadeEcon.coins;
    }

    return { state, offlineSummary };
  } catch {
    const initial = createInitialBuilderState();
    return { state: initial, offlineSummary: null };
  }
}

export function saveBuilderState(state: ChurchBuilderState) {
  if (typeof window === 'undefined') return;
  try {
    state.lastSavedAt = Date.now();
    localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('faith_church_builder_updated'));

    // Synchronize coins with the main arcade economy
    const currentEconomy = getArcadeEconomy();
    if (currentEconomy.coins !== state.coins) {
      saveArcadeEconomy({
        ...currentEconomy,
        coins: state.coins,
      });
    }
  } catch (err) {
    console.error('Failed to save Church Builder state', err);
  }
}
