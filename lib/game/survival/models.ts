// ─── Usick Survival — procedural low-poly models (no external assets) ────────
import * as THREE from "three";

// ─── geometry helpers ───────────────────────────────────────────────────────
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _c = new THREE.Color();

export interface Part {
  geo: THREE.BufferGeometry;
  color: number;
}

/** Create a positioned, coloured part (geometry is consumed). */
export function part(
  geo: THREE.BufferGeometry,
  color: number,
  pos: [number, number, number] = [0, 0, 0],
  rot: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1],
): Part {
  _p.set(pos[0], pos[1], pos[2]);
  _q.setFromEuler(_e.set(rot[0], rot[1], rot[2]));
  _s.set(scale[0], scale[1], scale[2]);
  _m.compose(_p, _q, _s);
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  g.applyMatrix4(_m);
  return { geo: g, color };
}

/** Merge parts into a single non-indexed geometry with per-vertex colour. */
export function mergeParts(parts: Part[]): THREE.BufferGeometry {
  let count = 0;
  for (const p of parts) count += p.geo.getAttribute("position").count;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  let o = 0;
  for (const p of parts) {
    const a = p.geo.getAttribute("position") as THREE.BufferAttribute;
    _c.setHex(p.color);
    for (let i = 0; i < a.count; i++) {
      pos[(o + i) * 3] = a.getX(i);
      pos[(o + i) * 3 + 1] = a.getY(i);
      pos[(o + i) * 3 + 2] = a.getZ(i);
      col[(o + i) * 3] = _c.r;
      col[(o + i) * 3 + 1] = _c.g;
      col[(o + i) * 3 + 2] = _c.b;
    }
    o += a.count;
    p.geo.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

export const vcMaterial = () => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

// ─── static props (merged geometries for instancing) ────────────────────────
export function oakGeometry() {
  return mergeParts([
    part(new THREE.CylinderGeometry(0.2, 0.32, 2.4, 6), 0x7a5230, [0, 1.2, 0]),
    part(new THREE.IcosahedronGeometry(1.45, 0), 0x4f9a3c, [0, 3.1, 0]),
    part(new THREE.IcosahedronGeometry(1.05, 0), 0x5fae46, [0.7, 3.7, 0.2], [0.4, 0.3, 0]),
    part(new THREE.IcosahedronGeometry(0.95, 0), 0x468c35, [-0.6, 3.5, -0.4], [0.2, 0.8, 0.1]),
  ]);
}

export function pineGeometry() {
  return mergeParts([
    part(new THREE.CylinderGeometry(0.16, 0.26, 1.6, 6), 0x6b4428, [0, 0.8, 0]),
    part(new THREE.ConeGeometry(1.5, 1.9, 7), 0x2f7a4a, [0, 2.1, 0]),
    part(new THREE.ConeGeometry(1.15, 1.7, 7), 0x368a52, [0, 3.0, 0], [0, 0.4, 0]),
    part(new THREE.ConeGeometry(0.75, 1.4, 7), 0x3f9a5c, [0, 3.85, 0], [0, 0.9, 0]),
  ]);
}

export function rockGeometry() {
  return mergeParts([
    part(new THREE.DodecahedronGeometry(0.85, 0), 0x8a8f96, [0, 0.35, 0], [0, 0, 0], [1, 0.72, 1.05]),
    part(new THREE.DodecahedronGeometry(0.45, 0), 0x9aa0a6, [0.55, 0.2, 0.35], [0.5, 0.2, 0]),
  ]);
}

export function bushGeometry() {
  return mergeParts([
    part(new THREE.IcosahedronGeometry(0.6, 0), 0x5c9e3a, [0, 0.45, 0], [0, 0, 0], [1.1, 0.8, 1]),
    part(new THREE.IcosahedronGeometry(0.42, 0), 0x6bb044, [0.45, 0.35, 0.1]),
    part(new THREE.IcosahedronGeometry(0.38, 0), 0x4e8f33, [-0.4, 0.32, -0.15]),
    // fiber stalks
    part(new THREE.ConeGeometry(0.05, 0.9, 3), 0xc9c46a, [0.15, 0.85, 0.2], [0.2, 0, 0.1]),
    part(new THREE.ConeGeometry(0.05, 0.8, 3), 0xc9c46a, [-0.2, 0.8, 0.05], [-0.15, 0, -0.2]),
  ]);
}

export function berryBushGeometry() {
  return mergeParts([
    part(new THREE.IcosahedronGeometry(0.7, 0), 0x3f7f35, [0, 0.55, 0], [0, 0, 0], [1.1, 0.85, 1.05]),
    part(new THREE.IcosahedronGeometry(0.45, 0), 0x4a8c3c, [0.5, 0.4, 0.2]),
    part(new THREE.IcosahedronGeometry(0.42, 0), 0x376f2e, [-0.45, 0.38, -0.2]),
  ]);
}

export function berriesGeometry() {
  const parts: Part[] = [];
  const spots: [number, number, number][] = [
    [0.45, 0.75, 0.45], [-0.35, 0.85, 0.4], [0.1, 1.05, 0.25], [0.6, 0.5, -0.2],
    [-0.55, 0.55, -0.1], [0.2, 0.6, 0.65], [-0.15, 0.95, -0.45], [0.4, 0.9, -0.35],
  ];
  for (const s of spots) parts.push(part(new THREE.IcosahedronGeometry(0.1, 0), 0xd2263a, s));
  return mergeParts(parts);
}

export function branchGeometry() {
  return mergeParts([
    part(new THREE.CylinderGeometry(0.07, 0.09, 1.4, 5), 0x8a5a32, [0, 0.08, 0], [0, 0, Math.PI / 2]),
    part(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 5), 0x7a4e2a, [0.1, 0.16, 0.1], [0, 0.9, Math.PI / 2]),
    part(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 5), 0x946238, [-0.15, 0.22, -0.1], [0, -0.7, Math.PI / 2]),
  ]);
}

export function grassGeometry() {
  return mergeParts([
    part(new THREE.ConeGeometry(0.06, 0.45, 3), 0x6fb04a, [0, 0.22, 0], [0.15, 0, 0.1]),
    part(new THREE.ConeGeometry(0.05, 0.38, 3), 0x7cbd52, [0.1, 0.19, 0.05], [-0.1, 0, -0.25]),
    part(new THREE.ConeGeometry(0.05, 0.35, 3), 0x5f9e40, [-0.08, 0.17, -0.06], [0.2, 0, 0.3]),
  ]);
}

export function flowerGeometry() {
  return mergeParts([
    part(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 3), 0x4f8f35, [0, 0.17, 0]),
    part(new THREE.IcosahedronGeometry(0.07, 0), 0xf4e04d, [0, 0.36, 0]),
  ]);
}

// ─── landmark meshes ────────────────────────────────────────────────────────
export function giantTreeMesh(): THREE.Mesh {
  const geo = mergeParts([
    part(new THREE.CylinderGeometry(0.9, 1.6, 7, 8), 0x6a4426, [0, 3.5, 0]),
    part(new THREE.CylinderGeometry(0.25, 0.4, 2.6, 5), 0x6a4426, [1.2, 5.8, 0], [0, 0, -0.9]),
    part(new THREE.CylinderGeometry(0.25, 0.4, 2.6, 5), 0x6a4426, [-1.1, 6.2, 0.3], [0.2, 0, 0.9]),
    part(new THREE.IcosahedronGeometry(3.6, 0), 0x3f8a36, [0, 9, 0]),
    part(new THREE.IcosahedronGeometry(2.6, 0), 0x4c9c3f, [2.6, 8.2, 1], [0.3, 0.2, 0]),
    part(new THREE.IcosahedronGeometry(2.4, 0), 0x367a2f, [-2.5, 8.6, -0.8], [0.1, 0.6, 0]),
    part(new THREE.IcosahedronGeometry(2.2, 0), 0x52a444, [0.3, 11.2, -0.6]),
  ]);
  const m = new THREE.Mesh(geo, vcMaterial());
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function standingStoneGeometry() {
  return mergeParts([
    part(new THREE.BoxGeometry(0.9, 2.6, 0.6), 0x8d9299, [0, 1.2, 0], [0.05, 0, 0.04]),
    part(new THREE.BoxGeometry(0.7, 0.25, 0.5), 0x7e838a, [0, 2.55, 0], [0, 0.3, 0.1]),
  ]);
}

// ─── character ──────────────────────────────────────────────────────────────
export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Group; // everything that tilts (death, hurt)
  torso: THREE.Mesh;
  head: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  hand: THREE.Group; // tool socket (in right hand)
  materials: THREE.MeshLambertMaterial[];
}

function lam(color: number) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

export function createCharacter(): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = lam(0xe0ac7e);
  const shirt = lam(0x2f8f83);
  const pants = lam(0x3a4660);
  const hair = lam(0x3b2a1e);
  const boots = lam(0x4a3426);
  const pack = lam(0x8a6a3a);
  const materials = [skin, shirt, pants, hair, boots, pack];

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.66, 0.32), shirt);
  torso.position.y = 1.25;
  body.add(torso);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.34), boots);
  belt.position.y = 0.93;
  body.add(belt);
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.2), pack);
  backpack.position.set(0, 1.28, -0.26);
  body.add(backpack);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.46, 6), lam(0x5a7a3a));
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 1.58, -0.27);
  body.add(roll);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.36), skin);
  head.position.y = 1.79;
  body.add(head);
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.13, 0.39), hair);
  hairTop.position.set(0, 0.2, -0.01);
  head.add(hairTop);
  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.26, 0.08), hair);
  hairBack.position.set(0, 0.04, -0.17);
  head.add(hairBack);
  const eyeMat = lam(0x1d1d1d);
  for (const sx of [-0.08, 0.08]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
    eye.position.set(sx, 0.02, 0.185);
    head.add(eye);
  }
  materials.push(eyeMat);

  const mkArm = (side: number) => {
    const g = new THREE.Group();
    g.position.set(0.37 * side, 1.52, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.36, 0.18), shirt);
    upper.position.y = -0.16;
    g.add(upper);
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.16), skin);
    fore.position.y = -0.48;
    g.add(fore);
    body.add(g);
    return g;
  };
  const armL = mkArm(-1);
  const armR = mkArm(1);
  const hand = new THREE.Group();
  hand.position.set(0, -0.62, 0.02);
  armR.add(hand);

  const mkLeg = (side: number) => {
    const g = new THREE.Group();
    g.position.set(0.14 * side, 0.9, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.72, 0.23), pants);
    leg.position.y = -0.36;
    g.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.18, 0.3), boots);
    boot.position.set(0, -0.81, 0.03);
    g.add(boot);
    body.add(g);
    return g;
  };
  const legL = mkLeg(-1);
  const legR = mkLeg(1);

  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
    }
  });
  return { root, body, torso, head, armL, armR, legL, legR, hand, materials };
}

export function createToolMesh(kind: "axe" | "spear"): THREE.Group {
  const g = new THREE.Group();
  const wood = lam(0x9a6a3a);
  if (kind === "axe") {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.75, 5), wood);
    handle.position.set(0, 0, 0.18);
    handle.rotation.x = Math.PI / 2;
    g.add(handle);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.18), lam(0x8d939a));
    head.position.set(0, 0.08, 0.5);
    g.add(head);
    const bind = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), lam(0xc9c46a));
    bind.position.set(0, 0, 0.46);
    g.add(bind);
  } else {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.7, 5), wood);
    shaft.position.set(0, 0, 0.45);
    shaft.rotation.x = Math.PI / 2;
    g.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 4), lam(0x8d939a));
    tip.position.set(0, 0, 1.42);
    tip.rotation.x = Math.PI / 2;
    g.add(tip);
    const bind = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 5), lam(0xc9c46a));
    bind.position.set(0, 0, 1.26);
    bind.rotation.x = Math.PI / 2;
    g.add(bind);
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  return g;
}

// ─── wild boar ──────────────────────────────────────────────────────────────
export interface BoarRig {
  root: THREE.Group;
  body: THREE.Group;
  legs: THREE.Group[];
  head: THREE.Group;
  materials: THREE.MeshLambertMaterial[];
}

export function createBoar(): BoarRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const fur = lam(0x5a3b28);
  const dark = lam(0x3a261a);
  const snoutM = lam(0xc58a74);
  const tusk = lam(0xf1ead8);
  const materials = [fur, dark, snoutM, tusk];

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.58, 1.15), fur);
  torso.position.y = 0.68;
  body.add(torso);
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.9), dark);
  mane.position.set(0, 1.02, 0.05);
  body.add(mane);

  const head = new THREE.Group();
  head.position.set(0, 0.7, 0.62);
  body.add(head);
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.44, 0.42), fur);
  skull.position.z = 0.14;
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.18), snoutM);
  snout.position.set(0, -0.08, 0.42);
  head.add(snout);
  for (const sx of [-0.13, 0.13]) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 4), tusk);
    t.position.set(sx, 0.02, 0.4);
    t.rotation.x = -0.6;
    head.add(t);
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.05), dark);
    ear.position.set(sx * 1.4, 0.26, 0.05);
    head.add(ear);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), lam(0x111111));
    eye.position.set(sx, 0.08, 0.36);
    head.add(eye);
  }

  const legs: THREE.Group[] = [];
  for (const [lx, lz] of [[-0.2, 0.38], [0.2, 0.38], [-0.2, -0.38], [0.2, -0.38]]) {
    const g = new THREE.Group();
    g.position.set(lx, 0.45, lz);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.14), dark);
    leg.position.y = -0.22;
    g.add(leg);
    body.add(g);
    legs.push(g);
  }
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  return { root, body, legs, head, materials };
}

// ─── buildings ──────────────────────────────────────────────────────────────
const PLANK_A = 0xa8774a;
const PLANK_B = 0x9a6b40;
const PLANK_C = 0xb5845a;

export function floorGeometry() {
  const parts: Part[] = [part(new THREE.BoxGeometry(3, 1.8, 3), 0x6e4a2c, [0, -0.95, 0])];
  for (let k = 0; k < 5; k++) {
    parts.push(part(new THREE.BoxGeometry(0.58, 0.1, 3), k % 2 ? PLANK_A : PLANK_C, [-1.2 + k * 0.6, -0.05, 0]));
  }
  return mergeParts(parts);
}

export function wallGeometry() {
  const parts: Part[] = [];
  for (let k = 0; k < 5; k++) {
    parts.push(part(new THREE.BoxGeometry(0.6, 4, 0.24), [PLANK_A, PLANK_B, PLANK_C][k % 3], [-1.2 + k * 0.6, 1, 0]));
  }
  parts.push(part(new THREE.BoxGeometry(3.04, 0.16, 0.3), 0x6e4a2c, [0, 2.2, 0]));
  parts.push(part(new THREE.BoxGeometry(3.04, 0.16, 0.3), 0x6e4a2c, [0, 0.6, 0]));
  return mergeParts(parts);
}

export function doorFrameGeometry() {
  return mergeParts([
    part(new THREE.BoxGeometry(0.8, 4, 0.26), PLANK_B, [-1.1, 1, 0]),
    part(new THREE.BoxGeometry(0.8, 4, 0.26), PLANK_B, [1.1, 1, 0]),
    part(new THREE.BoxGeometry(1.4, 0.6, 0.26), PLANK_A, [0, 2.7, 0]),
  ]);
}

/** Door panel, pivot at its left hinge (x = 0). */
export function doorPanelGeometry() {
  return mergeParts([
    part(new THREE.BoxGeometry(1.36, 2.38, 0.12), PLANK_C, [0.68, 1.19, 0]),
    part(new THREE.BoxGeometry(1.3, 0.12, 0.16), 0x6e4a2c, [0.68, 1.9, 0]),
    part(new THREE.BoxGeometry(1.3, 0.12, 0.16), 0x6e4a2c, [0.68, 0.5, 0]),
    part(new THREE.BoxGeometry(0.08, 0.08, 0.2), 0x333333, [1.2, 1.15, 0]),
  ]);
}

export function roofGeometry() {
  const parts: Part[] = [part(new THREE.BoxGeometry(3.3, 0.16, 3.3), 0x6e4a2c, [0, 0.08, 0])];
  for (let k = 0; k < 6; k++) {
    parts.push(part(new THREE.BoxGeometry(3.3, 0.1, 0.56), k % 2 ? 0xc29a55 : 0xb38b48, [0, 0.21, -1.4 + k * 0.56]));
  }
  return mergeParts(parts);
}

export function campfireGeometry() {
  const parts: Part[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    parts.push(part(new THREE.DodecahedronGeometry(0.16, 0), 0x7d8288, [Math.cos(a) * 0.5, 0.1, Math.sin(a) * 0.5], [a, a * 2, 0]));
  }
  parts.push(part(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 5), 0x6b4428, [0, 0.18, 0], [0.3, 0, Math.PI / 2]));
  parts.push(part(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 5), 0x6b4428, [0, 0.18, 0], [0.3, Math.PI / 2, Math.PI / 2]));
  parts.push(part(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 5), 0x5a3a22, [0, 0.22, 0], [-0.3, Math.PI / 4, Math.PI / 2]));
  return mergeParts(parts);
}

export function flameGeometry() {
  return mergeParts([
    part(new THREE.ConeGeometry(0.28, 0.7, 5), 0xff7a1a, [0, 0.55, 0]),
    part(new THREE.ConeGeometry(0.16, 0.5, 5), 0xffd23f, [0.04, 0.5, 0.03], [0, 0.6, 0]),
  ]);
}

export function workbenchGeometry() {
  return mergeParts([
    part(new THREE.BoxGeometry(1.6, 0.12, 0.85), PLANK_C, [0, 0.9, 0]),
    part(new THREE.BoxGeometry(0.12, 0.85, 0.12), PLANK_B, [-0.7, 0.42, -0.33]),
    part(new THREE.BoxGeometry(0.12, 0.85, 0.12), PLANK_B, [0.7, 0.42, -0.33]),
    part(new THREE.BoxGeometry(0.12, 0.85, 0.12), PLANK_B, [-0.7, 0.42, 0.33]),
    part(new THREE.BoxGeometry(0.12, 0.85, 0.12), PLANK_B, [0.7, 0.42, 0.33]),
    part(new THREE.BoxGeometry(1.4, 0.08, 0.7), PLANK_A, [0, 0.3, 0]),
    part(new THREE.BoxGeometry(0.3, 0.12, 0.2), 0x8d939a, [0.4, 1.02, 0.1]),
    part(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), 0x9a6a3a, [-0.3, 0.99, 0], [0, 0.4, Math.PI / 2]),
  ]);
}

export function shelterGeometry() {
  return mergeParts([
    part(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 5), 0x6b4428, [-1.2, 1.1, 0.9]),
    part(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 5), 0x6b4428, [1.2, 1.1, 0.9]),
    part(new THREE.CylinderGeometry(0.08, 0.08, 2.7, 5), 0x6b4428, [0, 2.15, 0.9], [0, 0, Math.PI / 2]),
    part(new THREE.BoxGeometry(2.7, 0.12, 2.5), 0x5e9a3c, [0, 1.25, -0.1], [-0.82, 0, 0]),
    part(new THREE.BoxGeometry(2.6, 0.1, 2.4), 0x4f8a33, [0, 1.33, -0.05], [-0.82, 0, 0]),
    part(new THREE.BoxGeometry(0.1, 1.1, 1.8), 0x5e9a3c, [-1.25, 0.55, -0.2], [0.55, 0, 0]),
    part(new THREE.BoxGeometry(0.1, 1.1, 1.8), 0x5e9a3c, [1.25, 0.55, -0.2], [0.55, 0, 0]),
    part(new THREE.BoxGeometry(1.6, 0.06, 0.9), 0xb39a6a, [0, 0.04, 0.1]),
  ]);
}

export function meatDropGeometry() {
  return mergeParts([
    part(new THREE.IcosahedronGeometry(0.2, 0), 0xb8423a, [0, 0.22, 0], [0, 0, 0], [1.3, 0.8, 1]),
    part(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 4), 0xf1ead8, [0.25, 0.22, 0], [0, 0, Math.PI / 2]),
  ]);
}

