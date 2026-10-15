'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChurchBuilderState,
  GridTile,
  PlacedBuilding,
  BuildingDef,
  BuildingCategory,
  BuilderNPC,
  OfflineProgressSummary,
  TimeOfDay,
} from '@/lib/faith/builder/types';
import {
  BUILDING_DEFS,
  COMMUNITY_LEVEL_TITLES,
  NPC_NAMES,
  NPC_SPEECH_QUOTES,
} from '@/lib/faith/builder/buildingData';
import {
  loadBuilderState,
  saveBuilderState,
  addBuilderXp,
  checkMissionsProgress,
  getBuildingSynergies,
  GRID_SIZE,
} from '@/lib/faith/builder/storage';
import {
  BuilderCoinIcon,
  BuilderWoodIcon,
  BuilderFaithStarIcon,
  BuilderCommunityIcon,
  GrassTile,
  CobblestonePathTile,
  BrickPathTile,
  TileSmallChurch,
  TileChapel,
  TileMainChurch,
  TileFellowshipHall,
  TileCafe,
  TilePrayerGarden,
  TilePlayground,
  TileParking,
  TileOakTree,
  TilePineTree,
  TileBench,
  TileStreetLamp,
  TileCrossMonument,
  TileFlowerBed,
  TileFountain,
  TileRoomGeneric,
  BuilderNPCAvatar,
} from './BuilderAssets';
import {
  ArrowLeft,
  Hammer,
  Footprints,
  Maximize2,
  ListTodo,
  X,
  ChevronUp,
  Trash2,
  Move,
  Sun,
  Moon,
  CloudRain,
  CheckCircle2,
  Sparkles,
  Lock,
  HelpCircle,
} from 'lucide-react';
import {
  playPouCoin,
  playPouLampClick,
  playPouSparkle,
  playPouSlide,
  playPouHappy,
  unlockAudio,
} from '@/lib/faith/arcade/soundEffects';

interface ChurchBuilderProps {
  onBack: () => void;
}

export default function ChurchBuilder({ onBack }: ChurchBuilderProps) {
  const [gameState, setGameState] = useState<ChurchBuilderState | null>(null);
  const [offlineSummary, setOfflineSummary] = useState<OfflineProgressSummary | null>(null);

  // Active Tool Mode
  const [activeMode, setActiveMode] = useState<'inspect' | 'build' | 'path' | 'expand'>('inspect');
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory>('church');
  const [selectedDefToBuild, setSelectedDefToBuild] = useState<BuildingDef | null>(null);
  const [selectedPlacedBuilding, setSelectedPlacedBuilding] = useState<PlacedBuilding | null>(null);
  const [movingBuildingId, setMovingBuildingId] = useState<string | null>(null);

  // Modals & Easy Guide
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [levelUpCelebration, setLevelUpCelebration] = useState<string | null>(null);

  // Tap-to-Harvest & Visual feedback
  const [harvestableCoins, setHarvestableCoins] = useState(15);
  const [floatingText, setFloatingText] = useState<string | null>(null);

  // NPCs walking around
  const [npcs, setNpcs] = useState<BuilderNPC[]>([]);

  // Sound SFX helper
  const sfx = {
    coin: () => {
      unlockAudio();
      playPouCoin();
    },
    click: () => {
      unlockAudio();
      playPouLampClick();
    },
    sparkle: () => {
      unlockAudio();
      playPouSparkle();
    },
    slide: () => {
      unlockAudio();
      playPouSlide();
    },
    happy: () => {
      unlockAudio();
      playPouHappy();
    },
  };

  // 1. Initial Load & Offline Catchup
  useEffect(() => {
    const { state, offlineSummary: summary } = loadBuilderState();
    setGameState(state);
    if (summary && (summary.coinsEarned > 0 || summary.materialsEarned > 0)) {
      setOfflineSummary(summary);
    }
    if (!state.hasSeenTutorial) {
      setShowTutorialModal(true);
    }

    // Spawn 5 Initial NPCs on paths
    const initialNpcs: BuilderNPC[] = [
      {
        id: 'npc_1',
        name: NPC_NAMES[0],
        role: 'visitor',
        x: 4,
        y: 6,
        targetX: 5,
        targetY: 6,
        state: 'walking',
        facing: 'right',
        hairColor: '#451A03',
        shirtColor: '#2563EB',
      },
      {
        id: 'npc_2',
        name: NPC_NAMES[1],
        role: 'youth',
        x: 5,
        y: 5,
        targetX: 4,
        targetY: 5,
        state: 'walking',
        facing: 'left',
        hairColor: '#D97706',
        shirtColor: '#DC2626',
      },
      {
        id: 'npc_3',
        name: NPC_NAMES[2],
        role: 'child',
        x: 3,
        y: 5,
        targetX: 6,
        targetY: 5,
        state: 'walking',
        facing: 'right',
        hairColor: '#1F2937',
        shirtColor: '#16A34A',
      },
      {
        id: 'npc_4',
        name: NPC_NAMES[3],
        role: 'elder',
        x: 6,
        y: 6,
        targetX: 3,
        targetY: 6,
        state: 'sitting',
        facing: 'right',
        hairColor: '#9CA3AF',
        shirtColor: '#7C3AED',
      },
    ];
    setNpcs(initialNpcs);
  }, []);

  // Compute Total Capacity & Visitors
  const totalCapacity = useMemo(() => {
    if (!gameState) return 15;
    let cap = 15; // Base starting capacity
    gameState.buildings.forEach((b) => {
      const def = BUILDING_DEFS.find((d) => d.id === b.defId);
      if (def) cap += def.capacityBonus * b.level;
    });
    return cap;
  }, [gameState?.buildings]);

  // 2. REAL-TIME INCOME & TIME-OF-DAY CYCLE
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      // Accumulate tap harvest up to 50 coins
      setHarvestableCoins((prev) => Math.min(50, prev + 2));

      setGameState((prev) => {
        if (!prev) return prev;

        // Calculate building income per 3 seconds
        let coinsGain = 0;
        let faithGain = 0;

        prev.buildings.forEach((b) => {
          const def = BUILDING_DEFS.find((d) => d.id === b.defId);
          if (def) {
            coinsGain += (def.incomePerMin / 20) * b.level;
            faithGain += (def.faithBonus / 60) * b.level;
          }
        });

        const newCoins = prev.coins + Math.round(coinsGain * prev.timeSpeed);
        const newFaith = prev.faithPoints + Math.round(faithGain * prev.timeSpeed);

        // Dynamically attract visitors based on facilities and faith points
        const targetVisitors = Math.min(
          totalCapacity,
          Math.max(6, Math.floor(6 + prev.buildings.length * 3 + prev.faithPoints / 30))
        );

        let nextState: ChurchBuilderState = {
          ...prev,
          coins: newCoins,
          faithPoints: newFaith,
          currentVisitors: targetVisitors,
        };

        nextState = checkMissionsProgress(nextState);
        saveBuilderState(nextState);
        return nextState;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [gameState?.timeSpeed, totalCapacity]);

  // Tap-to-Harvest Church Coins
  const handleCollectHarvest = () => {
    if (harvestableCoins <= 0 || !gameState) return;
    sfx.coin();
    const collected = harvestableCoins;
    setHarvestableCoins(0);
    setFloatingText(`+${collected} Koin!`);
    setTimeout(() => setFloatingText(null), 1600);

    setGameState((prev) => {
      if (!prev) return prev;
      const baseUpdated = {
        ...prev,
        coins: prev.coins + collected,
        faithPoints: prev.faithPoints + 5,
      };
      const { updatedState, didLevelUp, newLevel } = addBuilderXp(baseUpdated, 15);
      const finalState = checkMissionsProgress(updatedState);
      if (didLevelUp) {
        setLevelUpCelebration(`Level ${newLevel}: ${COMMUNITY_LEVEL_TITLES[newLevel]}`);
        sfx.happy();
      }
      saveBuilderState(finalState);
      return finalState;
    });
  };

  // Dynamic Easy-to-understand Goal/Next Step Banner
  const currentGoal = useMemo(() => {
    if (!gameState) return '';
    if (gameState.buildings.length <= 1) {
      return 'Langkah 1: Tap tombol [BANGUN] di bawah untuk mendirikan fasilitas pertamamu!';
    }
    const hasPathCount = gameState.tiles.filter((t) => t.pathType).length;
    if (hasPathCount <= 6) {
      return 'Langkah 2: Tap tombol [JALAN] untuk membuat rute jalan baru!';
    }
    const church = gameState.buildings.find((b) => b.defId === 'small_church');
    if (church && church.level === 1 && gameState.coins >= 80) {
      return 'Langkah 3: Tap Gereja di peta lalu tekan UPGRADE untuk menaikkan levelnya!';
    }
    const unlockedPlotCount = gameState.tiles.filter((t) => t.isUnlocked).length;
    if (unlockedPlotCount <= 36 && gameState.coins >= 150) {
      return 'Langkah 4: Tap tombol [PERLUAS] untuk membeli petak lahan baru di sekitarnya!';
    }
    return 'Kembangkan kompleks gerejamu, panen koin, dan selesaikan misi harian!';
  }, [gameState]);

  // 3. NPC WANDER & DIALOGUE LOOP
  useEffect(() => {
    const npcInterval = setInterval(() => {
      setNpcs((prev) =>
        prev.map((npc) => {
          // 20% chance to speak a dialogue quote
          const shouldSpeak = Math.random() < 0.2 && (!npc.bubbleExpiresAt || Date.now() > npc.bubbleExpiresAt);
          const newQuote = shouldSpeak
            ? NPC_SPEECH_QUOTES[Math.floor(Math.random() * NPC_SPEECH_QUOTES.length)]
            : npc.bubbleText;
          const newExpiry = shouldSpeak ? Date.now() + 4000 : npc.bubbleExpiresAt;

          // Pick random neighboring walk target within paths (x: 3..6, y: 5..6)
          const newX = Math.max(3, Math.min(6, npc.x + (Math.random() > 0.5 ? 0.35 : -0.35)));
          const facing = newX >= npc.x ? 'right' : 'left';

          return {
            ...npc,
            x: Math.round(newX * 10) / 10,
            facing,
            bubbleText: newExpiry && Date.now() < newExpiry ? newQuote : null,
            bubbleExpiresAt: newExpiry,
          };
        })
      );
    }, 2200);

    return () => clearInterval(npcInterval);
  }, []);

  // Handle Tile Click
  const handleTileClick = (tile: GridTile) => {
    if (!gameState) return;

    // A. Expanding Land Plot Mode
    if (activeMode === 'expand' || !tile.isUnlocked) {
      if (tile.isUnlocked) return;
      const expandCost = 150;
      if (gameState.coins < expandCost) {
        alert('Koin tidak mencukupi untuk membuka lahan baru (butuh 150 Koin)!');
        return;
      }
      sfx.coin();
      setGameState((prev) => {
        if (!prev) return prev;
        const updatedTiles = prev.tiles.map((t) =>
          t.x === tile.x && t.y === tile.y ? { ...t, isUnlocked: true } : t
        );
        const updated = {
          ...prev,
          coins: prev.coins - expandCost,
          tiles: updatedTiles,
        };
        saveBuilderState(updated);
        return updated;
      });
      return;
    }

    // B. Quick Path Mode
    if (activeMode === 'path') {
      if (tile.buildingInstanceId) {
        alert('Tidak bisa meletakkan jalan di atas bangunan!');
        return;
      }
      const pathCost = 15;
      if (gameState.coins < pathCost) {
        alert('Koin tidak mencukupi untuk membuat jalan (butuh 15 Koin)!');
        return;
      }
      sfx.click();
      setGameState((prev) => {
        if (!prev) return prev;
        const nextPath: 'stone' | 'brick' = tile.pathType === 'stone' ? 'brick' : 'stone';
        const updatedTiles: GridTile[] = prev.tiles.map((t) =>
          t.x === tile.x && t.y === tile.y
            ? { ...t, pathType: nextPath, decorationId: null }
            : t
        );
        let updated: ChurchBuilderState = {
          ...prev,
          coins: prev.coins - pathCost,
          tiles: updatedTiles,
        };
        updated = checkMissionsProgress(updated);
        saveBuilderState(updated);
        return updated;
      });
      return;
    }

    // C. Moving an Existing Building
    if (movingBuildingId) {
      const building = gameState.buildings.find((b) => b.instanceId === movingBuildingId);
      if (!building) {
        setMovingBuildingId(null);
        return;
      }
      const def = BUILDING_DEFS.find((d) => d.id === building.defId);
      if (!def) return;

      // Check space
      const canFit = checkCanFit(tile.x, tile.y, def.width, def.height, movingBuildingId);
      if (!canFit) {
        alert('Lahan tidak muat atau terhalang bangunan lain!');
        return;
      }

      sfx.click();
      setGameState((prev) => {
        if (!prev) return prev;
        // Clear old building tiles
        let updatedTiles = prev.tiles.map((t) =>
          t.buildingInstanceId === movingBuildingId ? { ...t, buildingInstanceId: null } : t
        );
        // Set new building tiles
        for (let dy = 0; dy < def.height; dy++) {
          for (let dx = 0; dx < def.width; dx++) {
            updatedTiles = updatedTiles.map((t) =>
              t.x === tile.x + dx && t.y === tile.y + dy
                ? { ...t, buildingInstanceId: movingBuildingId }
                : t
            );
          }
        }
        const updatedBuildings = prev.buildings.map((b) =>
          b.instanceId === movingBuildingId ? { ...b, gridX: tile.x, gridY: tile.y } : b
        );
        const updated = {
          ...prev,
          tiles: updatedTiles,
          buildings: updatedBuildings,
        };
        saveBuilderState(updated);
        return updated;
      });
      setMovingBuildingId(null);
      setSelectedPlacedBuilding(null);
      return;
    }

    // D. Placing a New Building from Build Catalogue
    if (selectedDefToBuild) {
      const def = selectedDefToBuild;
      if (gameState.coins < def.costCoins || gameState.materials < def.costMaterials) {
        alert('Sumber daya koin atau material tidak mencukupi!');
        return;
      }

      // Check 1x1 vs 2x2
      const canFit = checkCanFit(tile.x, tile.y, def.width, def.height);
      if (!canFit) {
        alert('Lahan tidak muat atau terhalang bangunan lain!');
        return;
      }

      sfx.sparkle();
      const newInstanceId = `b_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      setGameState((prev) => {
        if (!prev) return prev;
        let updatedTiles = [...prev.tiles];

        if (def.category === 'decoration') {
          // Decoration placed on 1x1 tile
          updatedTiles = updatedTiles.map((t) =>
            t.x === tile.x && t.y === tile.y ? { ...t, decorationId: def.id } : t
          );
        } else {
          // Building placed on tiles
          for (let dy = 0; dy < def.height; dy++) {
            for (let dx = 0; dx < def.width; dx++) {
              updatedTiles = updatedTiles.map((t) =>
                t.x === tile.x + dx && t.y === tile.y + dy
                  ? { ...t, buildingInstanceId: newInstanceId, pathType: null, decorationId: null }
                  : t
              );
            }
          }
        }

        const newBuilding: PlacedBuilding = {
          instanceId: newInstanceId,
          defId: def.id,
          gridX: tile.x,
          gridY: tile.y,
          level: 1,
          placedAt: Date.now(),
        };

        const updatedBuildings =
          def.category === 'decoration' ? prev.buildings : [...prev.buildings, newBuilding];

        const baseUpdated = {
          ...prev,
          coins: prev.coins - def.costCoins,
          materials: prev.materials - def.costMaterials,
          faithPoints: prev.faithPoints + def.faithBonus,
          tiles: updatedTiles,
          buildings: updatedBuildings,
        };

        const xpGain = def.category === 'decoration' ? 10 : 25;
        const { updatedState, didLevelUp, newLevel } = addBuilderXp(baseUpdated, xpGain);
        const finalState = checkMissionsProgress(updatedState);
        if (didLevelUp) {
          setLevelUpCelebration(`Level ${newLevel}: ${COMMUNITY_LEVEL_TITLES[newLevel]}`);
          sfx.happy();
        }

        saveBuilderState(finalState);
        return finalState;
      });

      setSelectedDefToBuild(null);
      return;
    }

    // E. Inspect Existing Placed Building / Decoration
    if (tile.buildingInstanceId) {
      const b = gameState.buildings.find((item) => item.instanceId === tile.buildingInstanceId);
      if (b) {
        sfx.click();
        setSelectedPlacedBuilding(b);
      }
      return;
    }

    if (tile.decorationId) {
      sfx.click();
      const decorDef = BUILDING_DEFS.find((d) => d.id === tile.decorationId);
      if (decorDef) {
        alert(`${decorDef.name}: ${decorDef.description}`);
      }
    }
  };

  // Helper: check if area is unlocked and free
  const checkCanFit = (
    startX: number,
    startY: number,
    width: number,
    height: number,
    ignoreInstanceId?: string
  ): boolean => {
    if (!gameState) return false;
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const x = startX + dx;
        const y = startY + dy;
        if (x >= GRID_SIZE || y >= GRID_SIZE) return false;
        const tile = gameState.tiles.find((t) => t.x === x && t.y === y);
        if (!tile || !tile.isUnlocked) return false;
        if (tile.buildingInstanceId && tile.buildingInstanceId !== ignoreInstanceId) return false;
      }
    }
    return true;
  };

  // Upgrade Selected Building
  const handleUpgradeBuilding = () => {
    if (!gameState || !selectedPlacedBuilding) return;
    const def = BUILDING_DEFS.find((d) => d.id === selectedPlacedBuilding.defId);
    if (!def) return;

    const upgradeCoinCost = Math.round((def.costCoins || 120) * 0.8 * selectedPlacedBuilding.level);
    const upgradeMaterialCost = Math.round((def.costMaterials || 20) * 0.8 * selectedPlacedBuilding.level);

    if (gameState.coins < upgradeCoinCost || gameState.materials < upgradeMaterialCost) {
      alert(`Sumber daya kurang! Butuh ${upgradeCoinCost} Koin dan ${upgradeMaterialCost} Material.`);
      return;
    }

    sfx.sparkle();
    setGameState((prev) => {
      if (!prev) return prev;
      const updatedBuildings = prev.buildings.map((b) =>
        b.instanceId === selectedPlacedBuilding.instanceId ? { ...b, level: b.level + 1 } : b
      );
      const baseUpdated = {
        ...prev,
        coins: prev.coins - upgradeCoinCost,
        materials: prev.materials - upgradeMaterialCost,
        faithPoints: prev.faithPoints + 20,
        buildings: updatedBuildings,
      };

      const { updatedState, didLevelUp, newLevel } = addBuilderXp(baseUpdated, 40);
      const finalState = checkMissionsProgress(updatedState);
      if (didLevelUp) {
        setLevelUpCelebration(`Level ${newLevel}: ${COMMUNITY_LEVEL_TITLES[newLevel]}`);
        sfx.happy();
      }

      saveBuilderState(finalState);
      return finalState;
    });

    setSelectedPlacedBuilding((prev) => (prev ? { ...prev, level: prev.level + 1 } : prev));
  };

  // Demolish Selected Building
  const handleDemolishBuilding = () => {
    if (!gameState || !selectedPlacedBuilding) return;
    if (selectedPlacedBuilding.defId === 'small_church' && gameState.buildings.length <= 1) {
      alert('Gereja utama tidak boleh dibongkar!');
      return;
    }

    if (!confirm('Apakah kamu yakin ingin membongkar fasilitas ini?')) return;

    sfx.click();
    setGameState((prev) => {
      if (!prev) return prev;
      const updatedTiles = prev.tiles.map((t) =>
        t.buildingInstanceId === selectedPlacedBuilding.instanceId
          ? { ...t, buildingInstanceId: null }
          : t
      );
      const updatedBuildings = prev.buildings.filter(
        (b) => b.instanceId !== selectedPlacedBuilding.instanceId
      );
      const updated = {
        ...prev,
        tiles: updatedTiles,
        buildings: updatedBuildings,
        // Refund 40% coins
        coins: prev.coins + 50,
      };
      saveBuilderState(updated);
      return updated;
    });

    setSelectedPlacedBuilding(null);
  };

  // Toggle Time Speed
  const handleToggleSpeed = () => {
    if (!gameState) return;
    sfx.click();
    const nextSpeed: 1 | 2 | 4 = gameState.timeSpeed === 1 ? 2 : gameState.timeSpeed === 2 ? 4 : 1;
    setGameState((prev) => (prev ? { ...prev, timeSpeed: nextSpeed } : prev));
  };

  // Toggle Time Of Day
  const handleCycleTime = () => {
    if (!gameState) return;
    sfx.click();
    const sequence: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    const nextTime = sequence[(sequence.indexOf(gameState.timeOfDay) + 1) % sequence.length];
    setGameState((prev) => (prev ? { ...prev, timeOfDay: nextTime } : prev));
  };

  // Toggle Weather
  const handleToggleWeather = () => {
    if (!gameState) return;
    sfx.click();
    setGameState((prev) =>
      prev ? { ...prev, weather: prev.weather === 'sunny' ? 'rain' : 'sunny' } : prev
    );
  };

  if (!gameState) return null;

  const isNight = gameState.timeOfDay === 'night' || gameState.timeOfDay === 'evening';

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full select-none animate-page-enter bg-[#F4F4F6] text-[#111113]">
      {/* 1. TOP HEADER STATUS BAR */}
      <div className="p-3 bg-white border-b border-[#EAEAEB] shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1 text-[#71717A] hover:text-[#111113] active:scale-95 transition-all"
              aria-label="Kembali"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xs font-black tracking-tight text-[#111113] leading-none">
                {gameState.communityName}
              </h2>
              <span className="text-[10px] text-[#71717A] font-semibold block mt-0.5">
                Lv {gameState.communityLevel} • {COMMUNITY_LEVEL_TITLES[gameState.communityLevel]}
              </span>
            </div>
          </div>

          {/* Time, Weather & Guide Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sfx.click();
                setShowGuideModal(true);
              }}
              className="px-2 py-1 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold shadow-xs"
              title="Panduan Cara Bermain"
            >
              <HelpCircle size={13} className="text-amber-400" />
              <span>Panduan</span>
            </button>
            <button
              onClick={handleToggleWeather}
              className="p-1.5 rounded-lg bg-[#FAFAFA] border border-[#EAEAEB] hover:bg-[#F4F4F6] text-[#71717A] hover:text-[#111113] transition-all"
              title="Ganti Cuaca (Cerah/Hujan)"
            >
              {gameState.weather === 'sunny' ? <Sun size={14} className="text-amber-500" /> : <CloudRain size={14} className="text-blue-500" />}
            </button>
            <button
              onClick={handleCycleTime}
              className="px-2 py-1 rounded-lg bg-[#FAFAFA] border border-[#EAEAEB] hover:bg-[#F4F4F6] text-[11px] font-bold text-[#111113] flex items-center gap-1 capitalize transition-all"
              title="Ganti Waktu (Pagi/Siang/Sore/Malam)"
            >
              {isNight ? <Moon size={12} className="text-indigo-500" /> : <Sun size={12} className="text-amber-500" />}
              <span>{gameState.timeOfDay}</span>
            </button>
            <button
              onClick={handleToggleSpeed}
              className="px-2 py-1 rounded-lg bg-[#FAFAFA] border border-[#EAEAEB] text-[#111113] text-[11px] font-black hover:bg-[#F4F4F6] active:scale-95 transition-all"
              title="Percepat Waktu"
            >
              {gameState.timeSpeed}x
            </button>
          </div>
        </div>

        {/* 4 Custom Resource Badges (100% SVG - ZERO EMOJIS) */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {/* Coins */}
          <div className="bg-[#FAFAFA] border border-[#EAEAEB] rounded-xl px-2 py-1 flex items-center gap-1.5">
            <BuilderCoinIcon className="w-3.5 h-3.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-[#71717A] block font-semibold leading-none">Koin</span>
              <span className="text-xs font-black text-[#111113] truncate block mt-0.5">{gameState.coins}</span>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-[#FAFAFA] border border-[#EAEAEB] rounded-xl px-2 py-1 flex items-center gap-1.5">
            <BuilderWoodIcon className="w-3.5 h-3.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-[#71717A] block font-semibold leading-none">Material</span>
              <span className="text-xs font-black text-[#111113] truncate block mt-0.5">{gameState.materials}</span>
            </div>
          </div>

          {/* Faith Points */}
          <div className="bg-[#FAFAFA] border border-[#EAEAEB] rounded-xl px-2 py-1 flex items-center gap-1.5">
            <BuilderFaithStarIcon className="w-3.5 h-3.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-[#71717A] block font-semibold leading-none">Faith</span>
              <span className="text-xs font-black text-[#111113] truncate block mt-0.5">{gameState.faithPoints}</span>
            </div>
          </div>

          {/* Community / Capacity */}
          <div className="bg-[#FAFAFA] border border-[#EAEAEB] rounded-xl px-2 py-1 flex items-center gap-1.5">
            <BuilderCommunityIcon className="w-3.5 h-3.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-[#71717A] block font-semibold leading-none">Warga</span>
              <span className="text-xs font-black text-[#111113] truncate block mt-0.5">
                {gameState.currentVisitors}/{totalCapacity}
              </span>
            </div>
          </div>
        </div>

        {/* GUIDED ACTIVE GOAL / NEXT STEP BANNER */}
        <div className="bg-[#FAFAFA] border border-[#EAEAEB] rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs shadow-xs mt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[11px] font-bold text-[#111113] truncate">
              {currentGoal}
            </span>
          </div>
          <button
            onClick={() => {
              sfx.click();
              setShowGuideModal(true);
            }}
            className="text-[10px] font-extrabold text-[#71717A] hover:text-[#111113] shrink-0 ml-1 underline cursor-pointer"
          >
            Bantuan
          </button>
        </div>
      </div>

      {/* ACTIVE MODE BANNER NOTIFIER */}
      {selectedDefToBuild && (
        <div className="bg-[#111113] text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold animate-fadeIn">
          <span>Mode Bangun: Tap petak hijau untuk meletakkan {selectedDefToBuild.name}</span>
          <button onClick={() => setSelectedDefToBuild(null)} className="p-0.5 hover:bg-white/20 rounded">
            <X size={14} />
          </button>
        </div>
      )}
      {movingBuildingId && (
        <div className="bg-amber-600 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold animate-fadeIn">
          <span>Mode Pindah: Pilih petak baru untuk meletakkan bangunan</span>
          <button onClick={() => setMovingBuildingId(null)} className="p-0.5 hover:bg-white/20 rounded">
            <X size={14} />
          </button>
        </div>
      )}
      {activeMode === 'path' && (
        <div className="bg-blue-600 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold animate-fadeIn">
          <span>Mode Jalan: Tap petak kosong untuk membuat jalan batu (-15 Koin)</span>
          <button onClick={() => setActiveMode('inspect')} className="p-0.5 hover:bg-white/20 rounded">
            <X size={14} />
          </button>
        </div>
      )}
      {activeMode === 'expand' && (
        <div className="bg-emerald-700 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold animate-fadeIn">
          <span>Mode Perluas: Tap petak terkunci untuk membuka lahan (-150 Koin)</span>
          <button onClick={() => setActiveMode('inspect')} className="p-0.5 hover:bg-white/20 rounded">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. MAIN 2D GRID MAP CANVAS */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-3 relative bg-[#437435]">
        {/* Dynamic Day/Night & Weather Ambience Filters */}
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-700 z-20 ${
            gameState.timeOfDay === 'morning'
              ? 'bg-amber-200/10'
              : gameState.timeOfDay === 'afternoon'
              ? 'bg-transparent'
              : gameState.timeOfDay === 'evening'
              ? 'bg-amber-700/20'
              : 'bg-indigo-950/45'
          }`}
        />

        {/* Rain Filter */}
        {gameState.weather === 'rain' && (
          <div className="absolute inset-0 pointer-events-none z-20 opacity-30 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:16px_16px] animate-pulse" />
        )}

        {/* 10x10 Isometric/Top-Down Grid Wrapper */}
        <div
          className="relative grid grid-cols-10 grid-rows-10 border-4 border-[#24471B] rounded-2xl overflow-hidden shadow-2xl bg-[#559348]"
          style={{ width: 370, height: 370 }}
        >
          {gameState.tiles.map((tile) => {
            return (
              <div
                key={`${tile.x}_${tile.y}`}
                onClick={() => handleTileClick(tile)}
                className={`relative w-full h-full cursor-pointer transition-all duration-150 ${
                  !tile.isUnlocked ? 'opacity-40 bg-[#2D4A23]' : 'hover:brightness-105'
                }`}
              >
                {/* Base Grass */}
                {tile.isUnlocked ? (
                  <GrassTile x={tile.x} y={tile.y} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#29421F] border border-black/20">
                    <Lock size={11} className="text-white/40" />
                  </div>
                )}

                {/* Path overlay */}
                {tile.isUnlocked && tile.pathType === 'stone' && <CobblestonePathTile />}
                {tile.isUnlocked && tile.pathType === 'brick' && <BrickPathTile />}

                {/* 1x1 Decorations */}
                {tile.isUnlocked && tile.decorationId === 'tree_oak' && <TileOakTree />}
                {tile.isUnlocked && tile.decorationId === 'tree_pine' && <TilePineTree />}
                {tile.isUnlocked && tile.decorationId === 'bench' && <TileBench />}
                {tile.isUnlocked && tile.decorationId === 'street_lamp' && <TileStreetLamp isNight={isNight} />}
                {tile.isUnlocked && tile.decorationId === 'cross_monument' && <TileCrossMonument />}
                {tile.isUnlocked && tile.decorationId === 'flower_bed' && <TileFlowerBed />}
                {tile.isUnlocked && tile.decorationId === 'fountain' && <TileFountain />}

                {/* Build mode placement ghost highlight */}
                {selectedDefToBuild && tile.isUnlocked && (
                  <div
                    className={`absolute inset-0 z-30 pointer-events-none transition-all ${
                      checkCanFit(tile.x, tile.y, selectedDefToBuild.width, selectedDefToBuild.height)
                        ? 'border-2 border-emerald-300 bg-emerald-400/30 animate-pulse'
                        : 'border border-red-500/20 bg-red-950/20'
                    }`}
                  />
                )}
              </div>
            );
          })}

          {/* RENDER PLACED BUILDINGS (2x2 / 1x1) ON TOP OF TILES */}
          {gameState.buildings.map((b) => {
            const def = BUILDING_DEFS.find((d) => d.id === b.defId);
            if (!def) return null;

            const tileWidthPct = 10;
            const leftPct = b.gridX * tileWidthPct;
            const topPct = b.gridY * tileWidthPct;
            const widthPct = def.width * tileWidthPct;
            const heightPct = def.height * tileWidthPct;

            const isSelected = selectedPlacedBuilding?.instanceId === b.instanceId;
            const isMoving = movingBuildingId === b.instanceId;

            return (
              <div
                key={b.instanceId}
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.click();
                  setSelectedPlacedBuilding(b);
                }}
                className={`absolute z-10 cursor-pointer transition-all duration-200 select-none ${
                  isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent' : ''
                } ${isMoving ? 'opacity-50 animate-bounce' : ''}`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
              >
                {/* Tap-to-harvest gold coin bubble over small church */}
                {b.defId === 'small_church' && harvestableCoins >= 5 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCollectHarvest();
                    }}
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 bg-amber-400 hover:bg-amber-300 text-amber-950 border-2 border-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-bounce cursor-pointer active:scale-95 transition-transform"
                    title="Ketuk untuk panen koin!"
                  >
                    <BuilderCoinIcon className="w-3 h-3" />
                    <span className="text-[9px] font-black leading-none">+{harvestableCoins} Panen!</span>
                  </button>
                )}

                {/* Floating harvest text */}
                {b.defId === 'small_church' && floatingText && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 text-xs font-black text-amber-300 drop-shadow-md animate-bounce whitespace-nowrap">
                    {floatingText}
                  </div>
                )}

                {b.defId === 'small_church' && <TileSmallChurch level={b.level} isNight={isNight} />}
                {b.defId === 'chapel' && <TileChapel level={b.level} isNight={isNight} />}
                {b.defId === 'main_church' && <TileMainChurch level={b.level} isNight={isNight} />}
                {b.defId === 'fellowship_hall' && <TileFellowshipHall isNight={isNight} />}
                {b.defId === 'cafe' && <TileCafe isNight={isNight} />}
                {b.defId === 'prayer_garden' && <TilePrayerGarden />}
                {b.defId === 'playground' && <TilePlayground />}
                {b.defId === 'parking' && <TileParking />}
                {b.defId === 'music_room' && <TileRoomGeneric label="MUSIC" color="#FDE047" isNight={isNight} />}
                {b.defId === 'children_room' && <TileRoomGeneric label="SUNDAY" color="#67E8F9" isNight={isNight} />}
                {b.defId === 'kitchen_court' && <TileRoomGeneric label="DINING" color="#FDBA74" isNight={isNight} />}
                {b.defId === 'bookstore' && <TileRoomGeneric label="BIBLE" color="#D8B4FE" isNight={isNight} />}
                {b.defId === 'prayer_room' && <TileRoomGeneric label="PRAYER" color="#93C5FD" isNight={isNight} />}
                {b.defId === 'counseling_room' && <TileRoomGeneric label="CARE" color="#A7F3D0" isNight={isNight} />}
              </div>
            );
          })}

          {/* RENDER WALKING NPCS */}
          {npcs.map((npc) => {
            const leftPct = npc.x * 10;
            const topPct = npc.y * 10;

            return (
              <div
                key={npc.id}
                className="absolute z-30 pointer-events-none transition-all duration-1000 ease-linear flex flex-col items-center"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Speech Bubble */}
                {npc.bubbleText && (
                  <div className="absolute -top-7 px-2 py-0.5 bg-white border border-[#111113] rounded-full text-[9px] font-bold text-[#111113] shadow-md whitespace-nowrap animate-bounce z-40">
                    {npc.bubbleText}
                  </div>
                )}
                <BuilderNPCAvatar
                  role={npc.role}
                  facing={npc.facing}
                  hairColor={npc.hairColor}
                  shirtColor={npc.shirtColor}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. BOTTOM CONTROL DOCK */}
      <div className="p-3 bg-white border-t border-[#EAEAEB] shadow-xs flex items-center justify-between gap-2">
        {/* BUILD CATALOGUE BUTTON */}
        <button
          onClick={() => {
            sfx.slide();
            setShowBuildModal(true);
            setActiveMode('build');
          }}
          className="flex-1 bg-[#111113] text-white font-bold text-xs py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-[#27272A] active:scale-95 transition-all shadow-xs"
        >
          <Hammer size={15} />
          <span>BANGUN</span>
        </button>

        {/* QUICK PATH BUTTON */}
        <button
          onClick={() => {
            sfx.click();
            setActiveMode(activeMode === 'path' ? 'inspect' : 'path');
          }}
          className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 border transition-all active:scale-95 ${
            activeMode === 'path'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-[#FAFAFA] text-[#111113] border-[#EAEAEB] hover:bg-[#F4F4F6]'
          }`}
          title="Mode Jalan"
        >
          <Footprints size={15} />
          <span>JALAN</span>
        </button>

        {/* EXPAND PLOT BUTTON */}
        <button
          onClick={() => {
            sfx.click();
            setActiveMode(activeMode === 'expand' ? 'inspect' : 'expand');
          }}
          className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 border transition-all active:scale-95 ${
            activeMode === 'expand'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-[#FAFAFA] text-[#111113] border-[#EAEAEB] hover:bg-[#F4F4F6]'
          }`}
          title="Buka Lahan Baru"
        >
          <Maximize2 size={15} />
          <span>PERLUAS</span>
        </button>

        {/* MISSIONS BUTTON */}
        <button
          onClick={() => {
            sfx.slide();
            setShowMissionsModal(true);
          }}
          className="p-2.5 bg-[#FAFAFA] border border-[#EAEAEB] hover:bg-[#F4F4F6] text-[#111113] rounded-2xl active:scale-95 transition-all relative"
          title="Daftar Misi Harian"
        >
          <ListTodo size={17} />
          {gameState.missions.filter((m) => m.completed && !m.claimed).length > 0 ? (
            <span className="w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full absolute -top-1 -right-1 flex items-center justify-center animate-bounce shadow-xs">
              {gameState.missions.filter((m) => m.completed && !m.claimed).length}
            </span>
          ) : (
            <span className="w-2 h-2 bg-amber-500 rounded-full absolute top-1.5 right-1.5" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS & OVERLAYS */}
      {/* ========================================================================= */}

      {/* A. BUILDING CATALOGUE MODAL */}
      {showBuildModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-page-enter">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#EAEAEB] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEB]">
              <div>
                <h3 className="text-base font-extrabold text-[#111113]">Katalog Bangunan</h3>
                <span className="text-[11px] text-[#71717A] font-medium">Pilih fasilitas untuk ditempatkan</span>
              </div>
              <button
                onClick={() => setShowBuildModal(false)}
                className="p-1.5 rounded-full text-[#71717A] hover:text-[#111113] hover:bg-[#F4F4F6]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-[#EAEAEB] no-scrollbar">
              {(
                [
                  { id: 'church', label: 'Gereja' },
                  { id: 'community', label: 'Komunitas' },
                  { id: 'worship', label: 'Ibadah' },
                  { id: 'social', label: 'Sosial' },
                  { id: 'outdoor', label: 'Taman' },
                  { id: 'decoration', label: 'Dekor' },
                ] as { id: BuildingCategory; label: string }[]
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#111113] text-white shadow-xs'
                      : 'bg-[#FAFAFA] text-[#71717A] hover:text-[#111113]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Buildings Grid */}
            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2.5">
              {BUILDING_DEFS.filter((d) => d.category === selectedCategory).map((def) => {
                const isLevelUnlocked = gameState.communityLevel >= def.requiredCommunityLevel;
                const canAfford =
                  gameState.coins >= def.costCoins && gameState.materials >= def.costMaterials;

                return (
                  <div
                    key={def.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      !isLevelUnlocked
                        ? 'opacity-50 bg-[#FAFAFA] border-[#EAEAEB]'
                        : 'bg-white border-[#EAEAEB] hover:border-black/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-extrabold text-[#111113]">{def.name}</h4>
                        <span className="text-[10px] font-semibold text-[#71717A]">
                          ({def.width}x{def.height})
                        </span>
                      </div>
                      <p className="text-[10px] text-[#71717A] leading-relaxed mt-0.5">{def.description}</p>
                      
                      {/* Stats preview */}
                      <div className="flex items-center gap-2.5 mt-2 text-[10px] font-bold text-[#111113]">
                        <span className="flex items-center gap-1">
                          <BuilderCoinIcon className="w-3 h-3" /> +{def.incomePerMin}/m
                        </span>
                        <span className="flex items-center gap-1">
                          <BuilderFaithStarIcon className="w-3 h-3" /> +{def.faithBonus}
                        </span>
                        {def.capacityBonus > 0 && (
                          <span className="flex items-center gap-1">
                            <BuilderCommunityIcon className="w-3 h-3" /> +{def.capacityBonus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {!isLevelUnlocked ? (
                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F4F4F6] text-[#71717A] text-[10px] font-bold">
                          <Lock size={11} />
                          <span>Lv {def.requiredCommunityLevel}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!canAfford) {
                              alert('Koin atau material belum mencukupi!');
                              return;
                            }
                            sfx.click();
                            setSelectedDefToBuild(def);
                            setShowBuildModal(false);
                          }}
                          disabled={!canAfford}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex flex-col items-center ${
                            canAfford
                              ? 'bg-[#111113] text-white hover:bg-[#27272A] active:scale-95'
                              : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                          }`}
                        >
                          <span>PILIH</span>
                          <span className="text-[9px] font-normal opacity-80">
                            {def.costCoins} Koin
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* B. INSPECTOR / DETAIL MODAL FOR SELECTED PLACED BUILDING */}
      {selectedPlacedBuilding && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[#EAEAEB] rounded-t-3xl p-4 shadow-2xl max-w-md mx-auto animate-slideUp">
          {(() => {
            const def = BUILDING_DEFS.find((d) => d.id === selectedPlacedBuilding.defId);
            if (!def) return null;

            const upgradeCoinCost = Math.round((def.costCoins || 120) * 0.8 * selectedPlacedBuilding.level);
            const upgradeMaterialCost = Math.round((def.costMaterials || 20) * 0.8 * selectedPlacedBuilding.level);

            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#111113]">{def.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#111113] text-white text-[10px] font-black">
                        Level {selectedPlacedBuilding.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71717A] mt-0.5">{def.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPlacedBuilding(null)}
                    className="p-1 rounded-full text-[#71717A] hover:text-[#111113]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Building Stats */}
                <div className="grid grid-cols-3 gap-2 bg-[#FAFAFA] border border-[#EAEAEB] rounded-2xl p-2 text-center text-xs font-bold">
                  <div>
                    <span className="text-[10px] text-[#71717A] block font-semibold">Income</span>
                    <span className="text-[#111113] block mt-0.5">
                      +{def.incomePerMin * selectedPlacedBuilding.level} Koin/m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#71717A] block font-semibold">Faith</span>
                    <span className="text-[#111113] block mt-0.5">+{def.faithBonus * selectedPlacedBuilding.level}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#71717A] block font-semibold">Kapasitas</span>
                    <span className="text-[#111113] block mt-0.5">+{def.capacityBonus * selectedPlacedBuilding.level}</span>
                  </div>
                </div>

                {/* Building Synergies Section (Brief #22) */}
                {(() => {
                  const synergies = getBuildingSynergies(
                    selectedPlacedBuilding,
                    gameState.buildings,
                    gameState.tiles
                  );
                  if (synergies.length === 0) return null;
                  return (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-900 uppercase tracking-wider">
                        <Sparkles size={12} className="text-amber-600" />
                        <span>Sinergi Fasilitas Bersebelahan</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {synergies.map((syn, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-950">{syn.label}</span>
                            <span className="font-black text-emerald-700">{syn.bonusText}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Action Buttons: Upgrade, Move, Demolish */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleUpgradeBuilding}
                    className="flex-1 bg-[#111113] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#27272A] active:scale-95 transition-all shadow-xs"
                  >
                    <ChevronUp size={15} />
                    <span>UPGRADE ({upgradeCoinCost} Koin)</span>
                  </button>

                  <button
                    onClick={() => {
                      setMovingBuildingId(selectedPlacedBuilding.instanceId);
                      setSelectedPlacedBuilding(null);
                    }}
                    className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEB] hover:bg-[#F4F4F6] text-[#111113] active:scale-95 transition-all"
                    title="Pindahkan Bangunan"
                  >
                    <Move size={15} />
                  </button>

                  <button
                    onClick={handleDemolishBuilding}
                    className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEB] hover:bg-rose-50 text-rose-600 active:scale-95 transition-all"
                    title="Bongkar Bangunan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* C. MISSIONS MODAL */}
      {showMissionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-[#EAEAEB] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEB]">
              <div>
                <h3 className="text-base font-extrabold text-[#111113]">Misi Harian</h3>
                <span className="text-[11px] text-[#71717A] font-medium">Selesaikan untuk mendapatkan bonus</span>
              </div>
              <button
                onClick={() => setShowMissionsModal(false)}
                className="p-1.5 rounded-full text-[#71717A] hover:text-[#111113] hover:bg-[#F4F4F6]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-3 flex flex-col gap-2.5">
              {gameState.missions.map((m) => {
                const canClaim = m.completed && !m.claimed;

                return (
                  <div
                    key={m.id}
                    className={`p-3 border rounded-2xl flex flex-col gap-1.5 transition-all ${
                      canClaim
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-[#FAFAFA] border-[#EAEAEB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#111113]">{m.title}</h4>
                      <span className="text-[10px] font-bold text-amber-600">+{m.rewardCoins} Koin</span>
                    </div>
                    <p className="text-[10px] text-[#71717A]">{m.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-[#71717A] font-semibold">
                        +{m.rewardMaterials} Material • +{m.rewardFaith} Faith
                      </span>
                      <button
                        onClick={() => {
                          if (!canClaim) return;
                          sfx.coin();
                          setGameState((prev) => {
                            if (!prev) return prev;
                            const baseUpdated = {
                              ...prev,
                              coins: prev.coins + m.rewardCoins,
                              materials: prev.materials + m.rewardMaterials,
                              faithPoints: prev.faithPoints + m.rewardFaith,
                              missions: prev.missions.map((item) =>
                                item.id === m.id ? { ...item, claimed: true, completed: true } : item
                              ),
                            };
                            const { updatedState, didLevelUp, newLevel } = addBuilderXp(baseUpdated, 35);
                            const finalState = checkMissionsProgress(updatedState);
                            if (didLevelUp) {
                              setLevelUpCelebration(`Level ${newLevel}: ${COMMUNITY_LEVEL_TITLES[newLevel]}`);
                              sfx.happy();
                            }
                            saveBuilderState(finalState);
                            return finalState;
                          });
                        }}
                        disabled={!canClaim}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          m.claimed
                            ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-default'
                            : canClaim
                            ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 active:scale-95 shadow-xs animate-bounce'
                            : 'bg-[#E5E7EB] text-[#71717A] cursor-not-allowed opacity-80'
                        }`}
                      >
                        {m.claimed ? 'Selesai' : canClaim ? 'Klaim Hadiah!' : 'Proses'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* D. OFFLINE / IDLE REWARD MODAL */}
      {offlineSummary && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-[#EAEAEB] text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-[#111113] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Sparkles size={24} className="text-amber-400" />
            </div>
            <h3 className="text-base font-extrabold text-[#111113]">Selamat Datang Kembali!</h3>
            <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
              Selama kamu offline ({Math.floor(offlineSummary.elapsedSeconds / 60)} menit), jemaat dan fasilitas gereja tetap aktif beroperasi:
            </p>

            <div className="grid grid-cols-3 gap-2 my-4 bg-[#FAFAFA] border border-[#EAEAEB] rounded-2xl p-3">
              <div>
                <BuilderCoinIcon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-black text-[#111113] block">+{offlineSummary.coinsEarned}</span>
                <span className="text-[9px] text-[#71717A] font-semibold">Koin</span>
              </div>
              <div>
                <BuilderWoodIcon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-black text-[#111113] block">+{offlineSummary.materialsEarned}</span>
                <span className="text-[9px] text-[#71717A] font-semibold">Material</span>
              </div>
              <div>
                <BuilderFaithStarIcon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-black text-[#111113] block">+{offlineSummary.faithEarned}</span>
                <span className="text-[9px] text-[#71717A] font-semibold">Faith</span>
              </div>
            </div>

            <button
              onClick={() => {
                sfx.coin();
                setOfflineSummary(null);
              }}
              className="w-full bg-[#111113] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-[#27272A] active:scale-95 transition-all shadow-xs"
            >
              AMBIL HASIL
            </button>
          </div>
        </div>
      )}

      {/* E. TUTORIAL INTRO MODAL */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-[#EAEAEB] text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#111113] text-white flex items-center justify-center mx-auto mb-3">
              <Hammer size={22} />
            </div>
            <h3 className="text-base font-extrabold text-[#111113]">Selamat Datang di Church Builder</h3>
            <p className="text-xs text-[#71717A] mt-2 leading-relaxed">
              Mulai dari sebuah gereja kecil dan lahan asri. Bangun aula komunitas, kafe persekutuan, taman doa, dan jalan setapak untuk menyambut lebih banyak jemaat dan mengembangkan komunitas gerejamu!
            </p>
            <button
              onClick={() => {
                sfx.sparkle();
                setShowTutorialModal(false);
                setGameState((prev) => {
                  if (!prev) return prev;
                  const updated = { ...prev, hasSeenTutorial: true };
                  saveBuilderState(updated);
                  return updated;
                });
              }}
              className="mt-4 w-full bg-[#111113] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-[#27272A] active:scale-95 transition-all"
            >
              MULAI MEMBANGUN
            </button>
          </div>
        </div>
      )}

      {/* F. PANDUAN CARA BERMAIN MODAL (SUPER MUDAH DIPAHAMI) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#EAEAEB] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#111113] text-white flex items-center justify-center">
                  <HelpCircle size={16} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#111113]">Panduan Cara Bermain</h3>
                  <span className="text-[10px] text-[#71717A] font-semibold">Mudah & Menyenangkan</span>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-full text-[#71717A] hover:text-[#111113] hover:bg-[#F4F4F6]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2.5 text-xs leading-relaxed text-[#111113]">
              {/* Step 1 */}
              <div className="p-3 bg-[#FAFAFA] border border-[#EAEAEB] rounded-2xl flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#111113] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h4 className="font-bold text-xs text-[#111113]">Panen Koin & Penghasilan</h4>
                </div>
                <p className="text-[11px] text-[#71717A] pl-7">
                  Gereja dan fasilitasmu otomatis menghasilkan koin setiap detik. Ketika gelembung emas <strong className="text-[#111113] font-bold">"Panen!"</strong> muncul di atas gereja, <strong className="text-[#111113] font-bold">ketuk gereja</strong> untuk langsung memanen koin!
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3 bg-[#FAFAFA] border border-[#EAEAEB] rounded-2xl flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#111113] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="font-bold text-xs text-[#111113]">Bangun Fasilitas Baru</h4>
                </div>
                <p className="text-[11px] text-[#71717A] pl-7">
                  Tekan tombol hitam <strong className="text-[#111113] font-bold">[BANGUN]</strong> di bar bawah, pilih bangunan yang kamu sukai (misal: Kafe, Taman Doa, Bangku, atau Pohon), lalu <strong className="text-[#111113] font-bold">ketuk petak rumput hijau di peta</strong> untuk mendirikannya.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3 bg-[#FAFAFA] border border-[#EAEAEB] rounded-2xl flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#111113] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h4 className="font-bold text-xs text-[#111113]">Buat Jalan Setapak</h4>
                </div>
                <p className="text-[11px] text-[#71717A] pl-7">
                  Tekan tombol <strong className="text-[#111113] font-bold">[JALAN]</strong>, lalu ketuk petak rumput kosong untuk membuat rute jalan batu. Warga NPC akan berjalan-jalan di jalur ini dan meramaikan kompleks!
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3 bg-[#FAFAFA] border border-[#EAEAEB] rounded-2xl flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#111113] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    4
                  </span>
                  <h4 className="font-bold text-xs text-[#111113]">Upgrade & Perluas Lahan</h4>
                </div>
                <p className="text-[11px] text-[#71717A] pl-7">
                  Ketuk bangunan mana saja di peta untuk menaikkan levelnya (<strong className="text-[#111113] font-bold">Upgrade</strong>) agar koin dan kapasitas jemaat bertambah. Tekan <strong className="text-[#111113] font-bold">[PERLUAS]</strong> untuk membeli tanah berpagar gembok di sekitarnya.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sfx.click();
                setShowGuideModal(false);
              }}
              className="mt-2 w-full bg-[#111113] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-[#27272A] active:scale-95 transition-all shadow-xs"
            >
              SAYA MENGERTI
            </button>
          </div>
        </div>
      )}

      {/* G. LEVEL UP CELEBRATION MODAL */}
      {levelUpCelebration && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-[#EAEAEB] text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
              <Sparkles size={28} />
            </div>
            <h3 className="text-base font-black text-[#111113]">KOMUNITAS NAIK LEVEL!</h3>
            <div className="inline-block mt-1 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black">
              {levelUpCelebration}
            </div>
            <p className="text-xs text-[#71717A] mt-2.5 leading-relaxed">
              Kapasitas warga bertambah dan fasilitas baru telah terbuka di Katalog Bangunan!
            </p>
            <button
              onClick={() => {
                sfx.click();
                setLevelUpCelebration(null);
              }}
              className="mt-4 w-full bg-[#111113] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-[#27272A] active:scale-95 transition-all shadow-xs"
            >
              LANJUTKAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
