// Desain Level & Entitas untuk 2D Pixel Platformer Usick One
// 100% Offline, Deterministic, Playable dari Start hingga Finish

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: "solid" | "moving";
  startX?: number;
  moveRange?: number;
  moveSpeed?: number;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

export interface SpikeHazard {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minX: number;
  maxX: number;
  vx: number;
  isDead: boolean;
  facing: "left" | "right";
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  reached: boolean;
}

export interface FinishGoal {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  themeColor: string;
  skyColorTop: string;
  skyColorBottom: string;
  platformFill: string;
  platformTop: string;
  levelWidth: number;
  levelHeight: number;
  playerStart: { x: number; y: number };
  platforms: Platform[];
  coins: Coin[];
  spikes: SpikeHazard[];
  enemies: Enemy[];
  checkpoints: Checkpoint[];
  finish: FinishGoal;
}

export function getLevel(levelId: number): LevelData {
  switch (levelId) {
    case 1:
      return getLevel1();
    case 2:
      return getLevel2();
    case 3:
      return getLevel3();
    default:
      return getLevel1();
  }
}

/**
 * Level 1: "Emerald Forest" — Pengenalan melompat, koin, platform bertingkat, 1 musuh santai
 */
function getLevel1(): LevelData {
  return {
    id: 1,
    name: "Emerald Forest",
    subtitle: "Level 1: Green Hills & Cyber Canopy",
    themeColor: "#10b981",
    skyColorTop: "#061a12",
    skyColorBottom: "#0d2b1f",
    platformFill: "#0b261b",
    platformTop: "#10b981",
    levelWidth: 2200,
    levelHeight: 520,
    playerStart: { x: 80, y: 380 },
    platforms: [
      // Tanah Awal
      { x: 0, y: 440, width: 420, height: 80 },
      // Tangga platform pertama
      { x: 340, y: 370, width: 140, height: 24 },
      { x: 520, y: 320, width: 150, height: 24 },
      { x: 720, y: 270, width: 160, height: 24 },
      // Tanah tengah
      { x: 920, y: 440, width: 480, height: 80 },
      // Platform tinggi di atas tanah tengah
      { x: 1040, y: 340, width: 180, height: 24 },
      // Jembatan lompat menuju bukit akhir
      { x: 1460, y: 400, width: 130, height: 24 },
      { x: 1640, y: 340, width: 140, height: 24 },
      // Area Finish
      { x: 1840, y: 440, width: 360, height: 80 },
    ],
    coins: [
      { id: "c1", x: 220, y: 400, width: 16, height: 16, collected: false },
      { id: "c2", x: 260, y: 400, width: 16, height: 16, collected: false },
      { id: "c3", x: 390, y: 330, width: 16, height: 16, collected: false },
      { id: "c4", x: 580, y: 280, width: 16, height: 16, collected: false },
      { id: "c5", x: 780, y: 230, width: 16, height: 16, collected: false },
      { id: "c6", x: 1000, y: 400, width: 16, height: 16, collected: false },
      { id: "c7", x: 1100, y: 300, width: 16, height: 16, collected: false },
      { id: "c8", x: 1150, y: 300, width: 16, height: 16, collected: false },
      { id: "c9", x: 1510, y: 360, width: 16, height: 16, collected: false },
      { id: "c10", x: 1700, y: 300, width: 16, height: 16, collected: false },
      { id: "c11", x: 1950, y: 400, width: 16, height: 16, collected: false },
      { id: "c12", x: 2000, y: 400, width: 16, height: 16, collected: false },
    ],
    spikes: [
      // Lubang jurang aman berpagar duri di sela platform
      { x: 420, y: 504, width: 100, height: 16 },
      { x: 1400, y: 504, width: 60, height: 16 },
    ],
    enemies: [
      {
        id: "e1",
        x: 1120,
        y: 416,
        width: 24,
        height: 24,
        minX: 960,
        maxX: 1360,
        vx: 45,
        isDead: false,
        facing: "left",
      },
    ],
    checkpoints: [
      { id: "cp1", x: 960, y: 400, reached: false },
    ],
    finish: { x: 2080, y: 376, width: 32, height: 64 },
  };
}

/**
 * Level 2: "Cyber Cavern" — Moving platforms, duri tajam, 2 musuh patroli, ritme presisi
 */
function getLevel2(): LevelData {
  return {
    id: 2,
    name: "Cyber Cavern",
    subtitle: "Level 2: Moving Rails & Neon Hazards",
    themeColor: "#06b6d4",
    skyColorTop: "#090d1f",
    skyColorBottom: "#111827",
    platformFill: "#111b27",
    platformTop: "#06b6d4",
    levelWidth: 2600,
    levelHeight: 520,
    playerStart: { x: 80, y: 380 },
    platforms: [
      // Tanah Start
      { x: 0, y: 440, width: 320, height: 80 },
      // Platform bergerak pertama
      {
        x: 380,
        y: 380,
        width: 120,
        height: 22,
        type: "moving",
        startX: 380,
        moveRange: 160,
        moveSpeed: 55,
      },
      // Pijakan tengah 1
      { x: 700, y: 340, width: 160, height: 24 },
      // Platform bertingkat
      { x: 920, y: 280, width: 140, height: 24 },
      // Tanah Checkpoint
      { x: 1120, y: 440, width: 440, height: 80 },
      // Platform bergerak kedua di atas jurang duri
      {
        x: 1620,
        y: 370,
        width: 130,
        height: 22,
        type: "moving",
        startX: 1620,
        moveRange: 180,
        moveSpeed: 65,
      },
      // Pijakan tinggi
      { x: 1980, y: 310, width: 150, height: 24 },
      // Pijakan menurun
      { x: 2190, y: 380, width: 140, height: 24 },
      // Tanah Finish
      { x: 2380, y: 440, width: 220, height: 80 },
    ],
    coins: [
      { id: "c1", x: 180, y: 400, width: 16, height: 16, collected: false },
      { id: "c2", x: 230, y: 400, width: 16, height: 16, collected: false },
      { id: "c3", x: 440, y: 340, width: 16, height: 16, collected: false },
      { id: "c4", x: 770, y: 300, width: 16, height: 16, collected: false },
      { id: "c5", x: 980, y: 240, width: 16, height: 16, collected: false },
      { id: "c6", x: 1200, y: 400, width: 16, height: 16, collected: false },
      { id: "c7", x: 1280, y: 400, width: 16, height: 16, collected: false },
      { id: "c8", x: 1360, y: 400, width: 16, height: 16, collected: false },
      { id: "c9", x: 1680, y: 330, width: 16, height: 16, collected: false },
      { id: "c10", x: 1740, y: 330, width: 16, height: 16, collected: false },
      { id: "c11", x: 2040, y: 270, width: 16, height: 16, collected: false },
      { id: "c12", x: 2250, y: 340, width: 16, height: 16, collected: false },
      { id: "c13", x: 2440, y: 400, width: 16, height: 16, collected: false },
      { id: "c14", x: 2490, y: 400, width: 16, height: 16, collected: false },
    ],
    spikes: [
      // Duri di sela start & checkpoint
      { x: 320, y: 504, width: 380, height: 16 },
      // Duri di bawah platform bergerak kedua
      { x: 1560, y: 504, width: 420, height: 16 },
      // Duri jebakan di atas pijakan tinggi
      { x: 1380, y: 424, width: 60, height: 16 },
    ],
    enemies: [
      {
        id: "e1",
        x: 1220,
        y: 416,
        width: 24,
        height: 24,
        minX: 1140,
        maxX: 1350,
        vx: 55,
        isDead: false,
        facing: "left",
      },
      {
        id: "e2",
        x: 2020,
        y: 286,
        width: 24,
        height: 24,
        minX: 1990,
        maxX: 2110,
        vx: 40,
        isDead: false,
        facing: "right",
      },
    ],
    checkpoints: [
      { id: "cp1", x: 1150, y: 400, reached: false },
    ],
    finish: { x: 2500, y: 376, width: 32, height: 64 },
  };
}

/**
 * Level 3: "Techno Citadel" — Tantangan tertinggi, lompatan presisi, 3 musuh bot, portal kemenangan
 */
function getLevel3(): LevelData {
  return {
    id: 3,
    name: "Techno Citadel",
    subtitle: "Level 3: Apex Ascent & Final Gateway",
    themeColor: "#f43f5e",
    skyColorTop: "#1c0910",
    skyColorBottom: "#27101c",
    platformFill: "#27111b",
    platformTop: "#f43f5e",
    levelWidth: 2900,
    levelHeight: 540,
    playerStart: { x: 80, y: 400 },
    platforms: [
      // Start Zone
      { x: 0, y: 460, width: 280, height: 80 },
      // Seri tangga sempit
      { x: 320, y: 400, width: 100, height: 22 },
      { x: 470, y: 340, width: 100, height: 22 },
      { x: 620, y: 280, width: 110, height: 22 },
      // Moving platform di ketinggian
      {
        x: 780,
        y: 240,
        width: 110,
        height: 22,
        type: "moving",
        startX: 780,
        moveRange: 160,
        moveSpeed: 70,
      },
      // Pijakan Checkpoint
      { x: 1080, y: 320, width: 340, height: 40 },
      // Dropdown sempit
      { x: 1480, y: 420, width: 120, height: 24 },
      // Moving platform kedua
      {
        x: 1660,
        y: 350,
        width: 110,
        height: 22,
        type: "moving",
        startX: 1660,
        moveRange: 170,
        moveSpeed: 75,
      },
      // Platform bertingkat atas
      { x: 1980, y: 290, width: 140, height: 22 },
      { x: 2180, y: 230, width: 130, height: 22 },
      { x: 2370, y: 300, width: 120, height: 22 },
      // Final Ascent
      { x: 2540, y: 370, width: 130, height: 24 },
      { x: 2710, y: 440, width: 190, height: 100 },
    ],
    coins: [
      { id: "c1", x: 160, y: 420, width: 16, height: 16, collected: false },
      { id: "c2", x: 210, y: 420, width: 16, height: 16, collected: false },
      { id: "c3", x: 360, y: 360, width: 16, height: 16, collected: false },
      { id: "c4", x: 510, y: 300, width: 16, height: 16, collected: false },
      { id: "c5", x: 660, y: 240, width: 16, height: 16, collected: false },
      { id: "c6", x: 840, y: 200, width: 16, height: 16, collected: false },
      { id: "c7", x: 1150, y: 280, width: 16, height: 16, collected: false },
      { id: "c8", x: 1220, y: 280, width: 16, height: 16, collected: false },
      { id: "c9", x: 1290, y: 280, width: 16, height: 16, collected: false },
      { id: "c10", x: 1530, y: 380, width: 16, height: 16, collected: false },
      { id: "c11", x: 1720, y: 310, width: 16, height: 16, collected: false },
      { id: "c12", x: 2040, y: 250, width: 16, height: 16, collected: false },
      { id: "c13", x: 2240, y: 190, width: 16, height: 16, collected: false },
      { id: "c14", x: 2420, y: 260, width: 16, height: 16, collected: false },
      { id: "c15", x: 2590, y: 330, width: 16, height: 16, collected: false },
      { id: "c16", x: 2780, y: 400, width: 16, height: 16, collected: false },
    ],
    spikes: [
      { x: 280, y: 524, width: 800, height: 16 },
      { x: 1200, y: 304, width: 80, height: 16 },
      { x: 1420, y: 524, width: 1290, height: 16 },
    ],
    enemies: [
      {
        id: "e1",
        x: 1110,
        y: 296,
        width: 24,
        height: 24,
        minX: 1090,
        maxX: 1190,
        vx: 60,
        isDead: false,
        facing: "left",
      },
      {
        id: "e2",
        x: 1340,
        y: 296,
        width: 24,
        height: 24,
        minX: 1290,
        maxX: 1400,
        vx: 65,
        isDead: false,
        facing: "right",
      },
      {
        id: "e3",
        x: 2020,
        y: 266,
        width: 24,
        height: 24,
        minX: 1990,
        maxX: 2100,
        vx: 55,
        isDead: false,
        facing: "left",
      },
    ],
    checkpoints: [
      { id: "cp1", x: 1120, y: 280, reached: false },
    ],
    finish: { x: 2800, y: 376, width: 32, height: 64 },
  };
}
