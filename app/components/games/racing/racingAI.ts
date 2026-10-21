import * as THREE from "three";
import { CarModelInstance, create3DCar } from "./racingCarModels";
import { PlayerCarState } from "./racingPhysics";
import { TRACK_WIDTH } from "./racingTrack";

export interface AICarState {
  id: string;
  name: string;
  colorName: string;
  model: CarModelInstance;
  position: THREE.Vector3;
  headingAngle: number;
  speed: number;
  curveT: number;
  laneOffset: number; // Offset jalur kiri/kanan (-4 hingga +4)
  currentLap: number;
  currentCheckpoint: number;
  raceProgress: number;
  hasFinished: boolean;
}

const AI_CONFIGS = [
  { id: "ai_1", name: "Spectre", bodyColor: 0x10b981, trimColor: 0x064e3b, neonColor: 0x34d399, lane: -2.8, baseSpeed: 38.0 },
  { id: "ai_2", name: "Blaze", bodyColor: 0xf97316, trimColor: 0x7c2d12, neonColor: 0xfb923c, lane: 2.8, baseSpeed: 39.5 },
  { id: "ai_3", name: "Viper", bodyColor: 0x8b5cf6, trimColor: 0x4c1d95, neonColor: 0xa78bfa, lane: 0.0, baseSpeed: 37.0 },
];

export function createAIRacers(scene: THREE.Scene, startPt: THREE.Vector3): AICarState[] {
  const racers: AICarState[] = [];

  AI_CONFIGS.forEach((cfg, idx) => {
    const model = create3DCar(cfg.bodyColor, cfg.trimColor, cfg.neonColor);

    // Posisi start di grid belakang pemain
    const gridZ = -(idx + 1) * 7.0;
    const initialPos = new THREE.Vector3(startPt.x + cfg.lane, startPt.y + 0.35, startPt.z + gridZ);

    model.group.position.copy(initialPos);
    scene.add(model.group);

    racers.push({
      id: cfg.id,
      name: cfg.name,
      colorName: cfg.name,
      model,
      position: initialPos,
      headingAngle: 0,
      speed: 0,
      curveT: 0,
      laneOffset: cfg.lane,
      currentLap: 1,
      currentCheckpoint: 0,
      raceProgress: 0,
      hasFinished: false,
    });
  });

  return racers;
}

/**
 * Update pergerakan AI navigasi sirkuit & deteksi posisi balapan.
 */
export function updateAIRacers(
  racers: AICarState[],
  player: PlayerCarState,
  trackCurve: THREE.CatmullRomCurve3,
  checkpoints: THREE.Vector3[],
  dt: number,
  isRacing: boolean
): number {
  racers.forEach((ai, idx) => {
    if (!isRacing || ai.hasFinished) {
      ai.model.updateWheels(0, 0, dt);
      return;
    }

    const cfg = AI_CONFIGS[idx];

    // Rubber-banding wajar agar balapan selalu seru
    const distToPlayer = player.raceProgress - ai.raceProgress;
    let speedMult = 1.0;
    if (distToPlayer > 30) speedMult = 1.12; // Sedikit percepat jika tertinggal jauh
    if (distToPlayer < -40) speedMult = 0.92; // Sedikit perlambat jika terlalu jauh di depan

    const targetSpeed = cfg.baseSpeed * speedMult;
    ai.speed += (targetSpeed - ai.speed) * Math.min(1, dt * 2.0);

    // Maju di sepanjang kurva spline
    const splineStep = (ai.speed * dt) / 450; // Estimasi panjang sirkuit ~450m
    ai.curveT += splineStep;

    if (ai.curveT >= 1.0) {
      ai.curveT -= 1.0;
      ai.currentLap += 1;
      if (ai.currentLap > 3) {
        ai.hasFinished = true;
      }
    }

    // Hitung posisi di spline dengan offset jalur lateral
    const currentCenter = trackCurve.getPointAt(ai.curveT);
    const lookaheadT = (ai.curveT + 0.03) % 1.0;
    const lookaheadCenter = trackCurve.getPointAt(lookaheadT);

    const tangent = new THREE.Vector3().subVectors(lookaheadCenter, currentCenter).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Posisi target di jalurnya
    const targetPos = new THREE.Vector3()
      .copy(currentCenter)
      .addScaledVector(normal, ai.laneOffset);
    targetPos.y += 0.35;

    // Haluskan perpindahan posisi
    ai.position.lerp(targetPos, Math.min(1, dt * 8));
    ai.model.group.position.copy(ai.position);

    // Hitung sudut hadap menuju target di depan
    const forwardVec = new THREE.Vector3().subVectors(lookaheadCenter, ai.position).normalize();
    const targetAngle = Math.atan2(-forwardVec.x, -forwardVec.z);
    ai.headingAngle += (targetAngle - ai.headingAngle) * Math.min(1, dt * 6);
    ai.model.group.rotation.y = ai.headingAngle;

    // Animasi putaran roda
    ai.model.updateWheels(ai.speed, (targetAngle - ai.headingAngle) * 0.5, dt);

    // Update Checkpoint AI
    checkpoints.forEach((cp, cpIdx) => {
      const d = Math.hypot(ai.position.x - cp.x, ai.position.z - cp.z);
      if (d < TRACK_WIDTH) {
        ai.currentCheckpoint = cpIdx;
      }
    });

    ai.raceProgress = ai.currentLap * 100 + ai.currentCheckpoint + ai.curveT * 10;
  });

  // Hitung Peringkat Balapan Pemain (1st, 2nd, 3rd, 4th)
  let playerRank = 1;
  racers.forEach((ai) => {
    if (ai.raceProgress > player.raceProgress) {
      playerRank++;
    }
  });

  return playerRank;
}

export function cleanupAIRacers(racers: AICarState[], scene: THREE.Scene): void {
  racers.forEach((ai) => {
    scene.remove(ai.model.group);
  });
}
