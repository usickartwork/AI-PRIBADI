// Game Engine 2D Platformer: Physics Kinematics, AABB Collision, Particles, & Pixel Rendering
// 100% Offline, Pure Canvas 2D, 0 Dependencies Eksternal

import { LevelData, Enemy, Coin, Checkpoint, FinishGoal } from "./platformerLevels";

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
  jumpJustReleased: boolean;
}

export interface PlayerEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  facing: "left" | "right";
  animTimer: number;
  animFrame: number;
  isInvulnerable: boolean;
  invulTimer: number;
  checkpointPos: { x: number; y: number };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Camera2D {
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
}

// Konstanta Fisika
const GRAVITY = 1180; // px/s²
const MOVE_SPEED = 185; // px/s
const ACCEL = 1100;
const FRICTION = 0.82;
const JUMP_FORCE = -420; // px/s
const JUMP_CUT = 0.52; // Variable jump height
const COYOTE_TIME = 0.12; // 120ms toleransi jatuh
const JUMP_BUFFER = 0.12; // 120ms toleransi tombol lompat sebelum mendarat

export function createPlayer(startPos: { x: number; y: number }): PlayerEntity {
  return {
    x: startPos.x,
    y: startPos.y,
    width: 20,
    height: 28,
    vx: 0,
    vy: 0,
    isGrounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    facing: "right",
    animTimer: 0,
    animFrame: 0,
    isInvulnerable: false,
    invulTimer: 0,
    checkpointPos: { x: startPos.x, y: startPos.y },
  };
}

export interface EngineEvents {
  onCoinCollected?: (coin: Coin) => void;
  onEnemyDefeated?: (enemy: Enemy) => void;
  onPlayerDeath?: () => void;
  onCheckpoint?: (cp: Checkpoint) => void;
  onFinish?: (finish: FinishGoal) => void;
  onJump?: () => void;
}

/**
 * Update fisika player, pergerakan platform bergerak, dan AI musuh
 */
export function updateGameEngine(
  player: PlayerEntity,
  level: LevelData,
  inputs: PlayerInput,
  particles: Particle[],
  dt: number,
  events: EngineEvents
): void {
  // Batasi delta time maksimal untuk stabilitas saat tab unfocus
  const clampedDt = Math.min(dt, 0.05);

  // 1. Update Platform Bergerak
  level.platforms.forEach((p) => {
    if (p.type === "moving" && p.startX !== undefined && p.moveRange && p.moveSpeed) {
      const oldX = p.x;
      const progress = (Math.sin(performance.now() * 0.001 * (p.moveSpeed / 20)) + 1) / 2;
      p.x = p.startX + progress * p.moveRange;

      // Jika player sedang berpijak di platform ini, bawa player ikut bergeser
      const deltaPlatformX = p.x - oldX;
      if (
        player.isGrounded &&
        player.x + player.width > p.x &&
        player.x < p.x + p.width &&
        Math.abs(player.y + player.height - p.y) < 2
      ) {
        player.x += deltaPlatformX;
      }
    }
  });

  // 2. Update AI Musuh
  level.enemies.forEach((enemy) => {
    if (enemy.isDead) return;
    enemy.x += enemy.vx * clampedDt;
    if (enemy.x <= enemy.minX) {
      enemy.x = enemy.minX;
      enemy.vx = Math.abs(enemy.vx);
      enemy.facing = "right";
    } else if (enemy.x + enemy.width >= enemy.maxX) {
      enemy.x = enemy.maxX - enemy.width;
      enemy.vx = -Math.abs(enemy.vx);
      enemy.facing = "left";
    }
  });

  // 3. Horizontal Movement (Akselerasi & Friction)
  let targetVx = 0;
  if (inputs.left && !inputs.right) {
    targetVx = -MOVE_SPEED;
    player.facing = "left";
  } else if (inputs.right && !inputs.left) {
    targetVx = MOVE_SPEED;
    player.facing = "right";
  }

  if (targetVx !== 0) {
    player.vx += (targetVx - player.vx) * Math.min(1, ACCEL * clampedDt * 0.02);
  } else {
    player.vx *= Math.pow(FRICTION, clampedDt * 60);
    if (Math.abs(player.vx) < 5) player.vx = 0;
  }

  // 4. Coyote Time & Jump Buffer
  if (player.isGrounded) {
    player.coyoteTimer = COYOTE_TIME;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - clampedDt);
  }

  if (inputs.jumpJustPressed) {
    player.jumpBufferTimer = JUMP_BUFFER;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - clampedDt);
  }

  // Eksekusi Jump
  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    player.vy = JUMP_FORCE;
    player.isGrounded = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    if (events.onJump) events.onJump();

    // Spawn partikel debu lompat
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: player.x + player.width / 2 + (Math.random() - 0.5) * 8,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 40,
        life: 0.25,
        maxLife: 0.25,
        color: "#94a3b8",
        size: 2.5,
      });
    }
  }

  // Variable Jump Height (Lepas tombol lompat memotong kecepatan naik)
  if (inputs.jumpJustReleased && player.vy < 0) {
    player.vy *= JUMP_CUT;
  }

  // 5. Gravitasi
  player.vy += GRAVITY * clampedDt;
  if (player.vy > 650) player.vy = 650; // Terminal velocity

  // 6. Integrasi Posisi X & Resolusi Tabrakan
  player.x += player.vx * clampedDt;

  // Batas kiri & kanan level
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  } else if (player.x + player.width > level.levelWidth) {
    player.x = level.levelWidth - player.width;
    player.vx = 0;
  }

  // Collision horizontal dengan platform
  for (const plat of level.platforms) {
    if (checkAABBOverlap(player, plat)) {
      if (player.vx > 0) {
        player.x = plat.x - player.width;
        player.vx = 0;
      } else if (player.vx < 0) {
        player.x = plat.x + plat.width;
        player.vx = 0;
      }
    }
  }

  // 7. Integrasi Posisi Y & Resolusi Tabrakan
  player.y += player.vy * clampedDt;
  player.isGrounded = false;

  for (const plat of level.platforms) {
    if (checkAABBOverlap(player, plat)) {
      if (player.vy > 0) {
        // Mendarat di atas platform
        player.y = plat.y - player.height;
        player.vy = 0;
        player.isGrounded = true;
      } else if (player.vy < 0) {
        // Menabrak langit-langit
        player.y = plat.y + plat.height;
        player.vy = 0;
      }
    }
  }

  // 8. Cek Jurang Bawah (Jatuh ke luar level)
  if (player.y > level.levelHeight + 40) {
    handlePlayerRespawn(player, events);
    return;
  }

  // 9. Cek Duri (Spikes)
  for (const spike of level.spikes) {
    // Inset 3px agar tabrakan adil & tidak terasa licik
    const spikeBox = {
      x: spike.x + 3,
      y: spike.y + 3,
      width: spike.width - 6,
      height: spike.height - 3,
    };
    if (checkAABBOverlap(player, spikeBox)) {
      handlePlayerRespawn(player, events);
      return;
    }
  }

  // 10. Cek Interaksi dengan Musuh (Stomp vs Hurt)
  for (const enemy of level.enemies) {
    if (enemy.isDead) continue;

    if (checkAABBOverlap(player, enemy)) {
      // Jika player sedang jatuh ke bawah dan berada di bagian atas kepala musuh
      const playerBottom = player.y + player.height;
      const enemyTop = enemy.y + 10;

      if (player.vy > 0 && playerBottom <= enemyTop + 8) {
        // Stomp Kalahkan Musuh!
        enemy.isDead = true;
        player.vy = -340; // Pantul lompat kembali
        if (events.onEnemyDefeated) events.onEnemyDefeated(enemy);

        // Partikel ledakan musuh
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: (Math.random() - 0.5) * 160,
            vy: (Math.random() - 0.5) * 160,
            life: 0.4,
            maxLife: 0.4,
            color: level.themeColor,
            size: 3,
          });
        }
      } else if (!player.isInvulnerable) {
        // Player Terkena Serangan Musuh
        handlePlayerRespawn(player, events);
        return;
      }
    }
  }

  // 11. Cek Koin (Collectibles)
  for (const coin of level.coins) {
    if (!coin.collected && checkAABBOverlap(player, coin)) {
      coin.collected = true;
      if (events.onCoinCollected) events.onCoinCollected(coin);

      // Partikel kilau koin emas
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: coin.x + coin.width / 2,
          y: coin.y + coin.height / 2,
          vx: (Math.random() - 0.5) * 100,
          vy: (Math.random() - 0.5) * 100,
          life: 0.35,
          maxLife: 0.35,
          color: "#fbbf24",
          size: 2.5,
        });
      }
    }
  }

  // 12. Cek Checkpoint
  for (const cp of level.checkpoints) {
    if (!cp.reached) {
      const cpBox = { x: cp.x - 10, y: cp.y - 20, width: 40, height: 60 };
      if (checkAABBOverlap(player, cpBox)) {
        cp.reached = true;
        player.checkpointPos = { x: cp.x, y: cp.y - 30 };
        if (events.onCheckpoint) events.onCheckpoint(cp);

        // Partikel aktivasi checkpoint
        for (let i = 0; i < 16; i++) {
          particles.push({
            x: cp.x,
            y: cp.y,
            vx: (Math.random() - 0.5) * 140,
            vy: -Math.random() * 120,
            life: 0.5,
            maxLife: 0.5,
            color: "#34d399",
            size: 3,
          });
        }
      }
    }
  }

  // 13. Cek Garis Finish / Portal
  if (checkAABBOverlap(player, level.finish)) {
    if (events.onFinish) events.onFinish(level.finish);
  }

  // 14. Update Partikel
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * clampedDt;
    p.y += p.vy * clampedDt;
    p.life -= clampedDt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // 15. Animasi & Invulnerability Timer
  if (player.invulTimer > 0) {
    player.invulTimer -= clampedDt;
    if (player.invulTimer <= 0) {
      player.isInvulnerable = false;
    }
  }

  player.animTimer += clampedDt;
  if (player.isGrounded && Math.abs(player.vx) > 10) {
    player.animFrame = Math.floor(player.animTimer * 10) % 4;
  } else {
    player.animFrame = 0;
  }
}

function handlePlayerRespawn(player: PlayerEntity, events: EngineEvents): void {
  player.x = player.checkpointPos.x;
  player.y = player.checkpointPos.y;
  player.vx = 0;
  player.vy = 0;
  player.isInvulnerable = true;
  player.invulTimer = 1.0;
  if (events.onPlayerDeath) events.onPlayerDeath();
}

function checkAABBOverlap(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

/**
 * Update Kamera 2D Smooth Chase
 */
export function updateCamera2D(
  camera: Camera2D,
  player: PlayerEntity,
  levelWidth: number,
  levelHeight: number,
  dt: number
): void {
  const targetX = player.x + player.width / 2 - camera.viewportWidth / 2;
  const targetY = player.y + player.height / 2 - camera.viewportHeight / 2 - 20;

  // Smooth camera lerp
  camera.x += (targetX - camera.x) * Math.min(1, dt * 7.5);
  camera.y += (targetY - camera.y) * Math.min(1, dt * 6.0);

  // Clamp camera dalam batas level
  camera.x = Math.max(0, Math.min(camera.x, levelWidth - camera.viewportWidth));
  camera.y = Math.max(0, Math.min(camera.y, levelHeight - camera.viewportHeight));
}

/**
 * Render Seluruh Scene 2D Pixel Platformer
 */
export function renderGameScene(
  ctx: CanvasRenderingContext2D,
  player: PlayerEntity,
  level: LevelData,
  camera: Camera2D,
  particles: Particle[]
): void {
  const { width, height } = ctx.canvas;
  ctx.save();

  // 1. Latar Belakang Parallax Retro
  // Gradient Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, level.skyColorTop);
  skyGrad.addColorStop(1, level.skyColorBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Parallax Layer 1: Pixel Stars / Cyber Dust
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  for (let i = 0; i < 40; i++) {
    const starX = ((i * 67 - camera.x * 0.1) % width + width) % width;
    const starY = (i * 37) % (height * 0.7);
    ctx.fillRect(Math.floor(starX), Math.floor(starY), 2, 2);
  }

  // Parallax Layer 2: Distant Mountains / Cyber Grid Silhouettes
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  const bgOffsetX = -camera.x * 0.2;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 80; x += 80) {
    const worldX = x - bgOffsetX;
    const peakH = 60 + Math.sin(worldX * 0.015) * 35 + Math.cos(worldX * 0.03) * 20;
    ctx.lineTo(x, height - 70 - peakH);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // 2. Kamera World Offset Transform
  ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

  // 3. Render Platforms
  level.platforms.forEach((p) => {
    // Fill Platform
    ctx.fillStyle = level.platformFill;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Platform Top Neon Glow Border
    ctx.fillStyle = level.platformTop;
    ctx.fillRect(p.x, p.y, p.width, 4);

    // Inner Brick Grid Detail
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let bx = p.x; bx < p.x + p.width; bx += 24) {
      ctx.beginPath();
      ctx.moveTo(bx, p.y + 4);
      ctx.lineTo(bx, p.y + p.height);
      ctx.stroke();
    }

    // Moving Platform Rail & Thruster Detail
    if (p.type === "moving") {
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(p.x + 8, p.y + p.height - 3, p.width - 16, 2);
    }
  });

  // 4. Render Spikes (Duri Tajam)
  level.spikes.forEach((s) => {
    ctx.fillStyle = "#f43f5e";
    const spikeCount = Math.max(1, Math.floor(s.width / 12));
    const step = s.width / spikeCount;

    for (let i = 0; i < spikeCount; i++) {
      const sx = s.x + i * step;
      ctx.beginPath();
      ctx.moveTo(sx, s.y + s.height);
      ctx.lineTo(sx + step / 2, s.y);
      ctx.lineTo(sx + step, s.y + s.height);
      ctx.closePath();
      ctx.fill();
    }
  });

  // 5. Render Coins (Animasi Berputar & Berkilau)
  const coinPhase = performance.now() * 0.005;
  level.coins.forEach((c) => {
    if (c.collected) return;
    const scaleX = Math.abs(Math.sin(coinPhase + c.x * 0.05));
    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2 + Math.sin(coinPhase * 2 + c.x) * 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(Math.max(0.2, scaleX), 1);

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(-2, -5, 4, 10);
    ctx.restore();
  });

  // 6. Render Checkpoints
  level.checkpoints.forEach((cp) => {
    // Pole
    ctx.fillStyle = "#64748b";
    ctx.fillRect(cp.x, cp.y - 36, 4, 36);

    // Flag Banner
    ctx.fillStyle = cp.reached ? "#10b981" : "#ef4444";
    ctx.beginPath();
    ctx.moveTo(cp.x + 4, cp.y - 34);
    ctx.lineTo(cp.x + 22, cp.y - 25);
    ctx.lineTo(cp.x + 4, cp.y - 16);
    ctx.closePath();
    ctx.fill();

    if (cp.reached) {
      // Aura glow saat aktif
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
      ctx.fillRect(cp.x - 4, cp.y - 38, 28, 40);
    }
  });

  // 7. Render Enemies (Retro Cyber Slime / Bot)
  level.enemies.forEach((enemy) => {
    if (enemy.isDead) return;

    // Body
    ctx.fillStyle = level.themeColor;
    const squish = Math.sin(performance.now() * 0.01 + enemy.x) * 2;
    ctx.fillRect(enemy.x, enemy.y + squish, enemy.width, enemy.height - squish);

    // Eyes
    ctx.fillStyle = "#ffffff";
    const eyeOffsetX = enemy.facing === "right" ? enemy.width - 7 : 3;
    ctx.fillRect(enemy.x + eyeOffsetX, enemy.y + 6 + squish, 5, 5);

    ctx.fillStyle = "#0f172a";
    const pupilOffsetX = enemy.facing === "right" ? enemy.width - 5 : 4;
    ctx.fillRect(enemy.x + pupilOffsetX, enemy.y + 7 + squish, 2, 3);
  });

  // 8. Render Finish Goal (Portal Kemenangan)
  const finish = level.finish;
  const finishPulse = (Math.sin(performance.now() * 0.006) + 1) / 2;

  // Portal Pillars
  ctx.fillStyle = "#334155";
  ctx.fillRect(finish.x, finish.y, 6, finish.height);
  ctx.fillRect(finish.x + finish.width - 6, finish.y, 6, finish.height);
  ctx.fillRect(finish.x, finish.y, finish.width, 6);

  // Portal Energy Field
  ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + finishPulse * 0.35})`;
  ctx.fillRect(finish.x + 6, finish.y + 6, finish.width - 12, finish.height - 6);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🏆", finish.x + finish.width / 2, finish.y + finish.height / 2 + 6);

  // 9. Render Player Sprite (Cyber Runner)
  if (!player.isInvulnerable || Math.floor(performance.now() * 0.02) % 2 === 0) {
    renderPlayerSprite(ctx, player);
  }

  // 10. Render Particles
  particles.forEach((p) => {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    ctx.globalAlpha = 1.0;
  });

  ctx.restore();
}

/**
 * Menggambar sprite pixel-art karakter pemain dengan animasi kaki & syal
 */
function renderPlayerSprite(ctx: CanvasRenderingContext2D, player: PlayerEntity): void {
  const px = Math.floor(player.x);
  const py = Math.floor(player.y);
  const isRight = player.facing === "right";

  ctx.save();

  // 1. Badan (Body Suit)
  ctx.fillStyle = "#06b6d4"; // Cyber Cyan Suit
  ctx.fillRect(px + 3, py + 8, 14, 12);

  // 2. Kepala & Helm
  ctx.fillStyle = "#1e293b"; // Dark Slate Helmet
  ctx.fillRect(px + 4, py + 1, 12, 9);

  // 3. Neon Visor
  ctx.fillStyle = "#38bdf8"; // Glowing Blue Visor
  if (isRight) {
    ctx.fillRect(px + 10, py + 4, 6, 3);
  } else {
    ctx.fillRect(px + 4, py + 4, 6, 3);
  }

  // 4. Kaki & Sepatu (Animasi berjalan saat lari)
  ctx.fillStyle = "#f43f5e"; // Crimson boots
  if (player.isGrounded) {
    if (Math.abs(player.vx) > 10) {
      const legStep = player.animFrame;
      if (legStep === 0 || legStep === 2) {
        ctx.fillRect(px + 3, py + 20, 5, 8);
        ctx.fillRect(px + 12, py + 20, 5, 8);
      } else if (legStep === 1) {
        ctx.fillRect(px + 1, py + 20, 5, 6);
        ctx.fillRect(px + 14, py + 20, 5, 8);
      } else {
        ctx.fillRect(px + 4, py + 20, 5, 8);
        ctx.fillRect(px + 10, py + 20, 5, 6);
      }
    } else {
      // Idle Standing
      ctx.fillRect(px + 4, py + 20, 5, 8);
      ctx.fillRect(px + 11, py + 20, 5, 8);
    }
  } else {
    // Jumping / Falling pose
    ctx.fillRect(px + 3, py + 18, 5, 6);
    ctx.fillRect(px + 12, py + 20, 5, 8);
  }

  // 5. Syal Cyber Melayang di belakang
  ctx.fillStyle = "#ec4899"; // Pink Cyber Scarf
  const scarfWave = Math.sin(performance.now() * 0.015) * 2;
  if (isRight) {
    ctx.fillRect(px - 4, py + 7 + scarfWave, 6, 3);
    ctx.fillRect(px - 7, py + 9 + scarfWave, 4, 2);
  } else {
    ctx.fillRect(px + 18, py + 7 + scarfWave, 6, 3);
    ctx.fillRect(px + 23, py + 9 + scarfWave, 4, 2);
  }

  ctx.restore();
}
