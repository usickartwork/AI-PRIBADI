import * as THREE from "three";
import { TRACK_WIDTH } from "./racingTrack";

export interface PlayerCarState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  headingAngle: number;
  speed: number;
  steerAngle: number;
  isDrifting: boolean;
  driftCharge: number;
  boostDuration: number;
  currentLap: number;
  currentCheckpoint: number;
  checkpointsPassed: Set<number>;
  raceProgress: number; // Untuk penentuan posisi (rank)
  hasFinished: boolean;
}

export interface PlayerControls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
}

const ACCELERATION = 22.0;
const BRAKE_DECEL = 30.0;
const REVERSE_MAX = -12.0;
const BASE_MAX_SPEED = 42.0; // ~140 km/h di speedometer
const DRAG = 0.988;
const STEER_SENSITIVITY = 2.4;
const WALL_OFFSET = TRACK_WIDTH / 2 - 0.9;

const _tempPushDir = new THREE.Vector3();

export function updatePlayerPhysics(
  car: PlayerCarState,
  inputs: PlayerControls,
  sampledPoints: THREE.Vector3[],
  checkpoints: THREE.Vector3[],
  dt: number,
  onWallHit?: () => void,
  onBoostStart?: () => void
): void {
  // 1. Boost Decay
  if (car.boostDuration > 0) {
    car.boostDuration -= dt;
  }

  const effectiveMaxSpeed = car.boostDuration > 0 ? BASE_MAX_SPEED * 1.25 : BASE_MAX_SPEED;

  // 2. Akselerasi & Pengereman
  if (inputs.up) {
    car.speed += ACCELERATION * dt;
    if (car.speed > effectiveMaxSpeed) car.speed = effectiveMaxSpeed;
  } else if (inputs.down) {
    car.speed -= BRAKE_DECEL * dt;
    if (car.speed < REVERSE_MAX) car.speed = REVERSE_MAX;
  } else {
    car.speed *= Math.pow(DRAG, dt * 60);
    if (Math.abs(car.speed) < 0.1) car.speed = 0;
  }

  // 3. Kemudi & Drift
  const isMoving = Math.abs(car.speed) > 0.5;
  const steerDir = (inputs.left ? 1 : 0) - (inputs.right ? 1 : 0);
  const targetSteer = steerDir * 0.45;
  car.steerAngle += (targetSteer - car.steerAngle) * Math.min(1, dt * 10);

  if (isMoving) {
    const speedFactor = Math.min(1.0, Math.abs(car.speed) / 25.0);
    const reverseMult = car.speed >= 0 ? 1 : -1;
    car.headingAngle += car.steerAngle * STEER_SENSITIVITY * speedFactor * reverseMult * dt;
  }

  // Drift Logic (Mario Kart style mini-turbo)
  const isHoldingDrift = inputs.drift && Math.abs(car.speed) > 15 && Math.abs(car.steerAngle) > 0.1;
  if (isHoldingDrift) {
    car.isDrifting = true;
    car.driftCharge = Math.min(1.5, car.driftCharge + dt * 0.9);
  } else {
    if (car.isDrifting && car.driftCharge > 0.6) {
      // Lepas drift menghasilkan Mini-Turbo Boost!
      car.boostDuration = 1.2;
      car.speed = Math.max(car.speed, BASE_MAX_SPEED * 1.15);
      if (onBoostStart) onBoostStart();
    }
    car.isDrifting = false;
    car.driftCharge = 0;
  }

  // 4. Integrasi Vektor Kecepatan (Inersia lateral)
  const forwardX = -Math.sin(car.headingAngle);
  const forwardZ = -Math.cos(car.headingAngle);

  const grip = car.isDrifting ? 0.91 : 0.97;
  car.velocity.x = car.velocity.x * grip + forwardX * car.speed * (1 - grip);
  car.velocity.z = car.velocity.z * grip + forwardZ * car.speed * (1 - grip);

  // Update Posisi
  car.position.x += car.velocity.x * dt;
  car.position.z += car.velocity.z * dt;

  // 5. Collision dengan Tepi Sirkuit (Pagar Barrier)
  // Temukan proyeksi titik sirkuit terdekat dari pre-sampled points (0 allocations)
  let closestDistSq = Infinity;
  let closestPt = sampledPoints[0];

  for (let i = 0; i < sampledPoints.length; i++) {
    const pt = sampledPoints[i];
    const dx = car.position.x - pt.x;
    const dz = car.position.z - pt.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < closestDistSq) {
      closestDistSq = dSq;
      closestPt = pt;
    }
  }

  const closestDist = Math.sqrt(closestDistSq);

  // Jika menabrak pembatas jalan
  if (closestDist > WALL_OFFSET) {
    _tempPushDir.subVectors(closestPt, car.position);
    _tempPushDir.y = 0;
    _tempPushDir.normalize();

    car.position.addScaledVector(_tempPushDir, (closestDist - WALL_OFFSET) * 0.85);
    car.speed *= 0.72; // Penalti tabrakan
    car.velocity.multiplyScalar(0.72);
    if (onWallHit) onWallHit();
  }

  // Selaraskan elevasi Y dengan kontur jalan
  car.position.y = closestPt.y + 0.35;

  // 6. Checkpoint & Lap Validation
  checkpoints.forEach((cp, idx) => {
    const d = Math.hypot(car.position.x - cp.x, car.position.z - cp.z);
    if (d < TRACK_WIDTH) {
      car.checkpointsPassed.add(idx);
      car.currentCheckpoint = idx;
    }
  });

  // Hitung progres balapan untuk live ranking
  car.raceProgress = car.currentLap * 100 + car.currentCheckpoint;
}
