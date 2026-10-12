// ─── Usick Survival — deterministic world generation + collision helpers ─────
import { TUNING } from "./data";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth value noise (deterministic, no deps)
function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + TUNING.worldSeed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

export function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// ─── Landmarks ──────────────────────────────────────────────────────────────
export const SPAWN = { x: 0, z: 6 };
export const POND = { x: 38, z: -30, r: 10 };
export const WATER_LEVEL = -1.1;
export const GIANT_TREE = { x: -42, z: -38 };
export const STONE_CIRCLE = { x: 46, z: 40, r: 7 };

/** Distance from point to the dirt path (polyline). */
const PATH_POINTS: [number, number][] = [
  [0, 6], [8, -6], [20, -18], [30, -26], // spawn -> pond
];
const PATH2: [number, number][] = [
  [0, 6], [-10, -10], [-26, -26], [-38, -34], // spawn -> giant tree
];
const PATH3: [number, number][] = [
  [0, 6], [14, 18], [30, 30], [42, 37], // spawn -> stone circle
];
function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  let t = l2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + dx * t - px;
  const qz = az + dz * t - pz;
  return Math.sqrt(qx * qx + qz * qz);
}
function distToPoly(px: number, pz: number, pts: [number, number][]) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    d = Math.min(d, distToSeg(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  }
  return d;
}
export function pathDistance(x: number, z: number) {
  return Math.min(distToPoly(x, z, PATH_POINTS), distToPoly(x, z, PATH2), distToPoly(x, z, PATH3));
}

/** Analytic height used to build the terrain grid. */
function rawHeight(x: number, z: number): number {
  let h =
    (valueNoise(x * 0.035, z * 0.035) - 0.5) * 5.5 +
    (valueNoise(x * 0.09 + 31, z * 0.09 - 17) - 0.5) * 1.6 +
    Math.sin(x * 0.05) * Math.cos(z * 0.045) * 1.2;

  // Flatten spawn clearing (building area)
  const ds = Math.hypot(x - SPAWN.x, z - (SPAWN.z - 4));
  h *= 0.25 + 0.75 * smoothstep(10, 24, ds);

  // Pond basin
  const dp = Math.hypot(x - POND.x, z - POND.z);
  if (dp < POND.r + 6) {
    const k = 1 - smoothstep(POND.r - 3, POND.r + 6, dp);
    h = h * (1 - k) + (-2.6) * k;
  }

  // Stone circle plateau
  const dc = Math.hypot(x - STONE_CIRCLE.x, z - STONE_CIRCLE.z);
  if (dc < STONE_CIRCLE.r + 5) {
    const k = 1 - smoothstep(STONE_CIRCLE.r, STONE_CIRCLE.r + 5, dc);
    h = h * (1 - k) + 0.8 * k;
  }

  // Rising hills near world edge (hides the boundary)
  const edge = Math.max(Math.abs(x), Math.abs(z));
  h += smoothstep(78, 100, edge) * 14 + smoothstep(90, 100, edge) * 6;
  return h;
}

// ─── Terrain grid (matches the rendered mesh exactly) ───────────────────────
export const GRID_N = 100;
export const GRID_CELL = (TUNING.worldHalf * 2) / GRID_N; // 2 units
const GRID_V = GRID_N + 1;

export class Terrain {
  heights: Float32Array;
  constructor() {
    this.heights = new Float32Array(GRID_V * GRID_V);
    for (let j = 0; j < GRID_V; j++) {
      for (let i = 0; i < GRID_V; i++) {
        const x = -TUNING.worldHalf + i * GRID_CELL;
        const z = -TUNING.worldHalf + j * GRID_CELL;
        this.heights[i + j * GRID_V] = rawHeight(x, z);
      }
    }
  }

  vertexHeight(i: number, j: number) {
    const ci = Math.max(0, Math.min(GRID_N, i));
    const cj = Math.max(0, Math.min(GRID_N, j));
    return this.heights[ci + cj * GRID_V];
  }

  /** Height at world (x,z) using the same triangle split as the mesh. */
  heightAt(x: number, z: number): number {
    const gx = (x + TUNING.worldHalf) / GRID_CELL;
    const gz = (z + TUNING.worldHalf) / GRID_CELL;
    let i = Math.floor(gx);
    let j = Math.floor(gz);
    if (i < 0) i = 0;
    if (j < 0) j = 0;
    if (i > GRID_N - 1) i = GRID_N - 1;
    if (j > GRID_N - 1) j = GRID_N - 1;
    const u = Math.min(1, Math.max(0, gx - i));
    const v = Math.min(1, Math.max(0, gz - j));
    const h00 = this.vertexHeight(i, j);
    const h10 = this.vertexHeight(i + 1, j);
    const h01 = this.vertexHeight(i, j + 1);
    const h11 = this.vertexHeight(i + 1, j + 1);
    if (u + v <= 1) return h00 + (h10 - h00) * u + (h01 - h00) * v;
    return h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v);
  }
}

// ─── Resource nodes (deterministic layout) ──────────────────────────────────
export type NodeType = "tree" | "pine" | "rock" | "bush" | "berry" | "branch";

export interface NodeDef {
  id: number;
  type: NodeType;
  x: number;
  z: number;
  scale: number;
  rot: number;
  tint: number; // 0..1 variation
  maxUses: number;
  radius: number; // collision radius (0 = no collision)
}

export const NODE_LABEL: Record<NodeType, string> = {
  tree: "Oak Tree",
  pine: "Pine Tree",
  rock: "Rock",
  bush: "Fiber Bush",
  berry: "Berry Bush",
  branch: "Fallen Branches",
};

export function generateNodes(terrain: Terrain): NodeDef[] {
  const rnd = mulberry32(TUNING.worldSeed);
  const nodes: NodeDef[] = [];
  const P = TUNING.playableHalf;

  const blocked = (x: number, z: number, clear: number) => {
    if (Math.abs(x) > P - 1 || Math.abs(z) > P - 1) return true;
    if (Math.hypot(x - SPAWN.x, z - (SPAWN.z - 4)) < 15 + clear) return true; // building clearing
    if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 2 + clear) return true;
    if (Math.hypot(x - STONE_CIRCLE.x, z - STONE_CIRCLE.z) < STONE_CIRCLE.r + 2 + clear) return true;
    if (Math.hypot(x - GIANT_TREE.x, z - GIANT_TREE.z) < 5 + clear) return true;
    if (pathDistance(x, z) < 2.2 + clear) return true;
    for (let k = 0; k < nodes.length; k++) {
      const n = nodes[k];
      const minD = (n.radius || 0.6) + clear + 0.8;
      const dx = n.x - x;
      const dz = n.z - z;
      if (dx * dx + dz * dz < minD * minD) return true;
    }
    return false;
  };

  const place = (type: NodeType, count: number, clear: number, maxUses: number, radius: number, sMin: number, sMax: number) => {
    let tries = 0;
    let placed = 0;
    while (placed < count && tries < count * 40) {
      tries++;
      const x = (rnd() * 2 - 1) * (P - 2);
      const z = (rnd() * 2 - 1) * (P - 2);
      if (blocked(x, z, clear)) continue;
      if (terrain.heightAt(x, z) < WATER_LEVEL + 0.4) continue;
      const scale = sMin + rnd() * (sMax - sMin);
      nodes.push({
        id: nodes.length,
        type,
        x,
        z,
        scale,
        rot: rnd() * Math.PI * 2,
        tint: rnd(),
        maxUses,
        radius: radius * scale,
      });
      placed++;
    }
  };

  // Guarantee starter resources near spawn (outside the clearing) — placed first
  const starters: [NodeType, number, number][] = [
    ["branch", 9, -10], ["branch", -10, -6], ["branch", 12, 14], ["branch", -13, 15],
    ["rock", 15, -4], ["rock", -16, 2], ["bush", 11, -13], ["bush", -12, -12],
    ["berry", 17, 8], ["berry", -17, 10],
  ];
  for (const [type, x, z] of starters) {
    const base = { tree: 0.45, pine: 0.4, rock: 0.75, bush: 0, berry: 0, branch: 0 }[type];
    nodes.push({
      id: nodes.length, type, x, z, scale: 1, rot: rnd() * 6.28, tint: rnd(),
      maxUses: { tree: 5, pine: 5, rock: 4, bush: 3, berry: 1, branch: 1 }[type],
      radius: base,
    });
  }

  place("tree", 120, 1.2, 5, 0.45, 0.85, 1.35);
  place("pine", 110, 1.0, 5, 0.4, 0.85, 1.4);
  place("rock", 70, 0.6, 4, 0.75, 0.7, 1.3);
  place("bush", 85, 0.3, 3, 0, 0.8, 1.2);
  place("berry", 45, 0.4, 1, 0, 0.85, 1.15);
  place("branch", 70, 0.2, 1, 0, 0.9, 1.1);
  return nodes;
}

// ─── Lightweight spatial hash for colliders ─────────────────────────────────
export interface Collider {
  kind: "circle" | "box";
  x: number;
  z: number;
  r: number; // circle radius
  hx: number; // box half extents
  hz: number;
  yMin: number;
  yMax: number;
  enabled: boolean;
  /** Walkable top surface (floors). Player can step on it when low enough. */
  walkable?: boolean;
  tag?: string;
}

export class SpatialHash {
  private cell: number;
  private map = new Map<number, Collider[]>();
  private result: Collider[] = [];
  private stamp = new Map<Collider, number>();
  private queryId = 0;
  constructor(cell = 4) {
    this.cell = cell;
  }
  private key(ix: number, iz: number) {
    return (ix + 512) * 2048 + (iz + 512);
  }
  private bounds(c: Collider) {
    const ex = c.kind === "circle" ? c.r : c.hx;
    const ez = c.kind === "circle" ? c.r : c.hz;
    return [
      Math.floor((c.x - ex) / this.cell),
      Math.floor((c.x + ex) / this.cell),
      Math.floor((c.z - ez) / this.cell),
      Math.floor((c.z + ez) / this.cell),
    ];
  }
  insert(c: Collider) {
    const [x0, x1, z0, z1] = this.bounds(c);
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const k = this.key(ix, iz);
        let arr = this.map.get(k);
        if (!arr) {
          arr = [];
          this.map.set(k, arr);
        }
        arr.push(c);
      }
    }
  }
  remove(c: Collider) {
    const [x0, x1, z0, z1] = this.bounds(c);
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const arr = this.map.get(this.key(ix, iz));
        if (!arr) continue;
        const idx = arr.indexOf(c);
        if (idx >= 0) arr.splice(idx, 1);
      }
    }
    this.stamp.delete(c);
  }
  /** Returns a reused array — copy if you need to keep it. */
  query(x: number, z: number, radius: number): Collider[] {
    this.queryId++;
    const out = this.result;
    out.length = 0;
    const x0 = Math.floor((x - radius) / this.cell);
    const x1 = Math.floor((x + radius) / this.cell);
    const z0 = Math.floor((z - radius) / this.cell);
    const z1 = Math.floor((z + radius) / this.cell);
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const arr = this.map.get(this.key(ix, iz));
        if (!arr) continue;
        for (const c of arr) {
          if (this.stamp.get(c) === this.queryId) continue;
          this.stamp.set(c, this.queryId);
          out.push(c);
        }
      }
    }
    return out;
  }
  clear() {
    this.map.clear();
    this.stamp.clear();
  }
}

/**
 * Push a circle (px,pz,r) out of a collider. Returns the corrected position
 * through `out` and whether a collision occurred.
 */
export function resolveCircle(
  px: number,
  pz: number,
  r: number,
  c: Collider,
  out: { x: number; z: number },
): boolean {
  if (c.kind === "circle") {
    const dx = px - c.x;
    const dz = pz - c.z;
    const min = r + c.r;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min) return false;
    const d = Math.sqrt(d2) || 0.0001;
    out.x = c.x + (dx / d) * min;
    out.z = c.z + (dz / d) * min;
    return true;
  }
  const cx = Math.max(c.x - c.hx, Math.min(px, c.x + c.hx));
  const cz = Math.max(c.z - c.hz, Math.min(pz, c.z + c.hz));
  let dx = px - cx;
  let dz = pz - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return false;
  if (d2 > 1e-8) {
    const d = Math.sqrt(d2);
    out.x = cx + (dx / d) * r;
    out.z = cz + (dz / d) * r;
    return true;
  }
  // Center inside the box: push along the shallowest axis
  const left = px - (c.x - c.hx);
  const right = c.x + c.hx - px;
  const top = pz - (c.z - c.hz);
  const bottom = c.z + c.hz - pz;
  const m = Math.min(left, right, top, bottom);
  dx = 0;
  dz = 0;
  if (m === left) dx = -(left + r);
  else if (m === right) dx = right + r;
  else if (m === top) dz = -(top + r);
  else dz = bottom + r;
  out.x = px + dx;
  out.z = pz + dz;
  return true;
}
