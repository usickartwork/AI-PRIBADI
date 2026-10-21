import * as THREE from "three";

export const TRACK_WIDTH = 14; // Lebar jalan dalam unit 3D

// Titik kontrol sirkuit 3D tertutup (X, Y, Z)
export const RAW_CIRCUIT_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, 0),         // Start / Finish Line
  new THREE.Vector3(0, 0, 60),        // Straightaway
  new THREE.Vector3(20, 1.5, 120),    // Gentle rise & right curve
  new THREE.Vector3(60, 2.5, 160),    // Sweeping right
  new THREE.Vector3(120, 2.0, 170),   // Turn apex
  new THREE.Vector3(170, 1.0, 140),   // Right turn exit
  new THREE.Vector3(190, 0, 80),      // East straight
  new THREE.Vector3(170, -0.5, 20),   // Chicane entry
  new THREE.Vector3(140, 0, -20),     // Chicane left
  new THREE.Vector3(160, 0.5, -70),   // Chicane right
  new THREE.Vector3(140, 1.0, -130),  // South curve entry
  new THREE.Vector3(90, 1.5, -170),   // Hairpin apex
  new THREE.Vector3(30, 1.0, -160),   // Hairpin exit
  new THREE.Vector3(-30, 0.5, -120),  // West sweeping turn
  new THREE.Vector3(-50, 0, -60),     // West curve
  new THREE.Vector3(-30, 0, -20),     // Straight back into final turn
];

export interface TrackData {
  curve: THREE.CatmullRomCurve3;
  checkpoints: THREE.Vector3[];
  trackMesh: THREE.Mesh;
  curbLeftMesh: THREE.Mesh;
  curbRightMesh: THREE.Mesh;
  barrierLeftMesh: THREE.Mesh;
  barrierRightMesh: THREE.Mesh;
  gantryGroup: THREE.Group;
  decorGroup: THREE.Group;
}

/**
 * Membangun seluruh geometri sirkuit 3D, marka jalan, pagar pengaman neon, dan dekorasi lingkungan.
 */
export function buildRaceTrack(): TrackData {
  const curve = new THREE.CatmullRomCurve3(RAW_CIRCUIT_POINTS, true, "catmullrom", 0.5);
  const segments = 240;
  const points = curve.getSpacedPoints(segments);

  // Buat checkpoints untuk navigasi & anti-cheat
  const numCheckpoints = 16;
  const checkpoints: THREE.Vector3[] = [];
  for (let i = 0; i < numCheckpoints; i++) {
    const t = i / numCheckpoints;
    checkpoints.push(curve.getPointAt(t));
  }

  // Geometri Aspal Jalan
  const roadGeom = new THREE.BufferGeometry();
  const roadVertices: number[] = [];
  const roadIndices: number[] = [];
  const roadUvs: number[] = [];

  // Geometri Curb Kiri & Kanan
  const curbLeftVertices: number[] = [];
  const curbRightVertices: number[] = [];
  const curbIndices: number[] = [];

  // Geometri Barrier Neon Kiri & Kanan
  const barrierLeftVertices: number[] = [];
  const barrierRightVertices: number[] = [];
  const barrierIndices: number[] = [];

  const halfW = TRACK_WIDTH / 2;
  const curbW = 1.0;
  const barrierH = 1.2;

  for (let i = 0; i <= segments; i++) {
    const pt = points[i % segments];
    const nextPt = points[(i + 1) % segments];

    // Hitung vektor tangen & normal lateral jalan
    const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Posisi tepi jalan
    const leftRoad = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW);
    const rightRoad = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW);

    roadVertices.push(leftRoad.x, leftRoad.y, leftRoad.z);
    roadVertices.push(rightRoad.x, rightRoad.y, rightRoad.z);

    const uvY = i / 10;
    roadUvs.push(0, uvY);
    roadUvs.push(1, uvY);

    // Curbs
    const leftCurbOuter = new THREE.Vector3().copy(leftRoad).addScaledVector(normal, -curbW);
    leftCurbOuter.y += 0.1;
    curbLeftVertices.push(leftCurbOuter.x, leftCurbOuter.y, leftCurbOuter.z);
    curbLeftVertices.push(leftRoad.x, leftRoad.y + 0.05, leftRoad.z);

    const rightCurbOuter = new THREE.Vector3().copy(rightRoad).addScaledVector(normal, curbW);
    rightCurbOuter.y += 0.1;
    curbRightVertices.push(rightRoad.x, rightRoad.y + 0.05, rightRoad.z);
    curbRightVertices.push(rightCurbOuter.x, rightCurbOuter.y, rightCurbOuter.z);

    // Barriers
    barrierLeftVertices.push(leftCurbOuter.x, leftCurbOuter.y, leftCurbOuter.z);
    barrierLeftVertices.push(leftCurbOuter.x, leftCurbOuter.y + barrierH, leftCurbOuter.z);

    barrierRightVertices.push(rightCurbOuter.x, rightCurbOuter.y, rightCurbOuter.z);
    barrierRightVertices.push(rightCurbOuter.x, rightCurbOuter.y + barrierH, rightCurbOuter.z);

    if (i < segments) {
      const v = i * 2;
      // Road quad
      roadIndices.push(v, v + 1, v + 2);
      roadIndices.push(v + 1, v + 3, v + 2);

      // Curbs quads
      curbIndices.push(v, v + 1, v + 2);
      curbIndices.push(v + 1, v + 3, v + 2);

      // Barrier quads
      barrierIndices.push(v, v + 1, v + 2);
      barrierIndices.push(v + 1, v + 3, v + 2);
    }
  }

  roadGeom.setAttribute("position", new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeom.setAttribute("uv", new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeom.setIndex(roadIndices);
  roadGeom.computeVertexNormals();

  const curbLeftGeom = new THREE.BufferGeometry();
  curbLeftGeom.setAttribute("position", new THREE.Float32BufferAttribute(curbLeftVertices, 3));
  curbLeftGeom.setIndex(curbIndices);
  curbLeftGeom.computeVertexNormals();

  const curbRightGeom = new THREE.BufferGeometry();
  curbRightGeom.setAttribute("position", new THREE.Float32BufferAttribute(curbRightVertices, 3));
  curbRightGeom.setIndex(curbIndices);
  curbRightGeom.computeVertexNormals();

  const barrierLeftGeom = new THREE.BufferGeometry();
  barrierLeftGeom.setAttribute("position", new THREE.Float32BufferAttribute(barrierLeftVertices, 3));
  barrierLeftGeom.setIndex(barrierIndices);
  barrierLeftGeom.computeVertexNormals();

  const barrierRightGeom = new THREE.BufferGeometry();
  barrierRightGeom.setAttribute("position", new THREE.Float32BufferAttribute(barrierRightVertices, 3));
  barrierRightGeom.setIndex(barrierIndices);
  barrierRightGeom.computeVertexNormals();

  // Materials
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x141418,
    roughness: 0.85,
    metalness: 0.1,
  });

  const curbMatLeft = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Cyan glow curb
    emissive: 0x06b6d4,
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });

  const curbMatRight = new THREE.MeshStandardMaterial({
    color: 0xec4899, // Magenta glow curb
    emissive: 0xec4899,
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });

  const barrierMatLeft = new THREE.MeshStandardMaterial({
    color: 0x0891b2,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.85,
  });

  const barrierMatRight = new THREE.MeshStandardMaterial({
    color: 0xdb2777,
    emissive: 0xec4899,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.85,
  });

  const trackMesh = new THREE.Mesh(roadGeom, roadMat);
  const curbLeftMesh = new THREE.Mesh(curbLeftGeom, curbMatLeft);
  const curbRightMesh = new THREE.Mesh(curbRightGeom, curbMatRight);
  const barrierLeftMesh = new THREE.Mesh(barrierLeftGeom, barrierMatLeft);
  const barrierRightMesh = new THREE.Mesh(barrierRightGeom, barrierMatRight);

  // Overhead Start/Finish Gantry Arch
  const gantryGroup = new THREE.Group();
  const startPt = RAW_CIRCUIT_POINTS[0];

  const pillarGeom = new THREE.BoxGeometry(0.8, 6.0, 0.8);
  const beamGeom = new THREE.BoxGeometry(TRACK_WIDTH + 4, 1.2, 1.2);
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });
  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  const pLeft = new THREE.Mesh(pillarGeom, gantryMat);
  pLeft.position.set(-halfW - 1.5, 3.0, 0);
  const pRight = new THREE.Mesh(pillarGeom, gantryMat);
  pRight.position.set(halfW + 1.5, 3.0, 0);
  const beam = new THREE.Mesh(beamGeom, gantryMat);
  beam.position.set(0, 6.0, 0);

  const neonBanner = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH, 0.4, 1.25), neonCyanMat);
  neonBanner.position.set(0, 6.0, 0);

  gantryGroup.add(pLeft, pRight, beam, neonBanner);
  gantryGroup.position.copy(startPt);

  // Start / Finish Line Quad on the Road
  const sfLineGeom = new THREE.PlaneGeometry(TRACK_WIDTH, 2.5);
  const sfLineMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const sfLineMesh = new THREE.Mesh(sfLineGeom, sfLineMat);
  sfLineMesh.rotation.x = -Math.PI / 2;
  sfLineMesh.position.set(0, 0.05, 0);
  gantryGroup.add(sfLineMesh);

  // Environmental Decor (Neon arches on corners)
  const decorGroup = new THREE.Group();
  const archGeom = new THREE.TorusGeometry(halfW + 2, 0.25, 8, 24, Math.PI);
  const archMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  [3, 7, 11, 14].forEach((idx) => {
    const pt = RAW_CIRCUIT_POINTS[idx];
    const arch = new THREE.Mesh(archGeom, archMat);
    arch.position.set(pt.x, pt.y, pt.z);
    arch.rotation.y = Math.PI / 4;
    decorGroup.add(arch);
  });

  return {
    curve,
    checkpoints,
    trackMesh,
    curbLeftMesh,
    curbRightMesh,
    barrierLeftMesh,
    barrierRightMesh,
    gantryGroup,
    decorGroup,
  };
}
