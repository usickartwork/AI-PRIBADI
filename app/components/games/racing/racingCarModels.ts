import * as THREE from "three";

export type CarType = "apex" | "inferno" | "phantom";

export interface CarVisualConfig {
  id: CarType;
  name: string;
  tagline: string;
  bodyColor: number;
  trimColor: number;
  neonColor: number;
  maxSpeedKmh: number;
  handling: string;
}

export const CAR_CONFIGS: Record<CarType, CarVisualConfig> = {
  apex: {
    id: "apex",
    name: "Apex Neon",
    tagline: "Balanced • Cyber Drift",
    bodyColor: 0x06b6d4, // Cyan
    trimColor: 0x18181b, // Dark Carbon
    neonColor: 0x06b6d4,
    maxSpeedKmh: 140,
    handling: "Tinggi",
  },
  inferno: {
    id: "inferno",
    name: "Inferno GT",
    tagline: "Top Speed • Raw Power",
    bodyColor: 0xe11d48, // Crimson Rose
    trimColor: 0x09090b, // Gloss Black
    neonColor: 0xf43f5e,
    maxSpeedKmh: 155,
    handling: "Sedang",
  },
  phantom: {
    id: "phantom",
    name: "Phantom Shadow",
    tagline: "Agile • Drift Specialist",
    bodyColor: 0x312e81, // Indigo
    trimColor: 0x1e1b4b,
    neonColor: 0xf59e0b, // Amber neon
    maxSpeedKmh: 135,
    handling: "Sangat Tinggi",
  },
};

export interface CarModelInstance {
  group: THREE.Group;
  wheelFrontLeft: THREE.Mesh;
  wheelFrontRight: THREE.Mesh;
  wheelRearLeft: THREE.Mesh;
  wheelRearRight: THREE.Mesh;
  headlights: THREE.Mesh;
  taillights: THREE.Mesh;
  updateWheels: (speed: number, steerAngle: number, dt: number) => void;
}

/**
 * Membuat model 3D supercar arcade prosedural yang ringan dan performan.
 */
export function create3DCar(
  carColor: number = 0x06b6d4,
  trimColor: number = 0x18181b,
  neonColor: number = 0x06b6d4
): CarModelInstance {
  const group = new THREE.Group();

  // Dimensi mobil: Lebar 1.8, Tinggi 0.8, Panjang 4.0
  const carLength = 4.0;
  const carWidth = 1.8;
  const carHeight = 0.65;

  // Material
  const bodyMat = new THREE.MeshStandardMaterial({
    color: carColor,
    metalness: 0.85,
    roughness: 0.25,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    metalness: 0.9,
    roughness: 0.3,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.95,
    roughness: 0.1,
  });

  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.8,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    metalness: 0.9,
    roughness: 0.2,
  });

  const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // 1. Lower Chassis
  const chassisGeom = new THREE.BoxGeometry(carWidth, carHeight * 0.5, carLength);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.y = 0.4;
  group.add(chassis);

  // 2. Cockpit Canopy / Windshield
  const cabinGeom = new THREE.BoxGeometry(carWidth * 0.8, carHeight * 0.6, carLength * 0.5);
  const cabin = new THREE.Mesh(cabinGeom, glassMat);
  cabin.position.set(0, 0.75, -0.2);
  group.add(cabin);

  // 3. Front Hood Slope
  const hoodGeom = new THREE.BoxGeometry(carWidth * 0.9, 0.15, carLength * 0.35);
  const hood = new THREE.Mesh(hoodGeom, bodyMat);
  hood.position.set(0, 0.55, 1.2);
  hood.rotation.x = 0.1;
  group.add(hood);

  // 4. Rear Spoiler Wing
  const spoilerPillarGeom = new THREE.BoxGeometry(0.1, 0.4, 0.2);
  const spLeft = new THREE.Mesh(spoilerPillarGeom, trimMat);
  spLeft.position.set(-0.6, 0.8, -1.8);
  const spRight = new THREE.Mesh(spoilerPillarGeom, trimMat);
  spRight.position.set(0.6, 0.8, -1.8);

  const wingGeom = new THREE.BoxGeometry(carWidth * 1.05, 0.08, 0.45);
  const wing = new THREE.Mesh(wingGeom, bodyMat);
  wing.position.set(0, 1.0, -1.8);
  group.add(spLeft, spRight, wing);

  // 5. Headlights & Taillights
  const headlightGeom = new THREE.BoxGeometry(0.35, 0.1, 0.1);
  const hlLeft = new THREE.Mesh(headlightGeom, headMat);
  hlLeft.position.set(-0.6, 0.45, 2.0);
  const hlRight = new THREE.Mesh(headlightGeom, headMat);
  hlRight.position.set(0.6, 0.45, 2.0);

  const headlights = new THREE.Mesh();
  headlights.add(hlLeft, hlRight);
  group.add(headlights);

  const taillightGeom = new THREE.BoxGeometry(0.4, 0.08, 0.1);
  const tlLeft = new THREE.Mesh(taillightGeom, tailMat);
  tlLeft.position.set(-0.55, 0.5, -2.0);
  const tlRight = new THREE.Mesh(taillightGeom, tailMat);
  tlRight.position.set(0.55, 0.5, -2.0);

  const taillights = new THREE.Mesh();
  taillights.add(tlLeft, tlRight);
  group.add(taillights);

  // 6. Underglow Neon Line
  const underglowGeom = new THREE.BoxGeometry(carWidth * 0.9, 0.05, carLength * 0.85);
  const underglow = new THREE.Mesh(underglowGeom, neonMat);
  underglow.position.set(0, 0.12, 0);
  group.add(underglow);

  // 7. Wheels & Rims
  function createWheel(): THREE.Mesh {
    const wheelGroup = new THREE.Mesh();
    const tireGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 16);
    tireGeom.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeom, wheelMat);

    const rimGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.33, 12);
    rimGeom.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeom, rimMat);

    wheelGroup.add(tire, rim);
    return wheelGroup;
  }

  const wheelFrontLeft = createWheel();
  wheelFrontLeft.position.set(-carWidth / 2 - 0.08, 0.38, 1.25);

  const wheelFrontRight = createWheel();
  wheelFrontRight.position.set(carWidth / 2 + 0.08, 0.38, 1.25);

  const wheelRearLeft = createWheel();
  wheelRearLeft.position.set(-carWidth / 2 - 0.08, 0.38, -1.25);

  const wheelRearRight = createWheel();
  wheelRearRight.position.set(carWidth / 2 + 0.08, 0.38, -1.25);

  group.add(wheelFrontLeft, wheelFrontRight, wheelRearLeft, wheelRearRight);

  // Animasi roda
  let wheelRotX = 0;
  const updateWheels = (speed: number, steerAngle: number, dt: number) => {
    wheelRotX += speed * dt * 2.5;
    wheelFrontLeft.rotation.x = wheelRotX;
    wheelFrontRight.rotation.x = wheelRotX;
    wheelRearLeft.rotation.x = wheelRotX;
    wheelRearRight.rotation.x = wheelRotX;

    // Belok roda depan
    wheelFrontLeft.rotation.y = steerAngle;
    wheelFrontRight.rotation.y = steerAngle;
  };

  return {
    group,
    wheelFrontLeft,
    wheelFrontRight,
    wheelRearLeft,
    wheelRearRight,
    headlights,
    taillights,
    updateWheels,
  };
}
