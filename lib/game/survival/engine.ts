// ─── Usick Survival — core game engine (plain Three.js, framework-agnostic) ──
import * as THREE from "three";
import {
  ITEMS, RECIPES, TUNING, recipeFor, SAVE_VERSION,
  type BuildType, type ItemId,
} from "./data";
import {
  Terrain, SpatialHash, generateNodes, mulberry32, pathDistance, resolveCircle, smoothstep,
  GRID_N, GRID_CELL, SPAWN, POND, WATER_LEVEL, GIANT_TREE, STONE_CIRCLE, NODE_LABEL,
  type Collider, type NodeDef,
} from "./world";
import {
  createCharacter, createToolMesh, createBoar, oakGeometry, pineGeometry, rockGeometry, bushGeometry,
  berryBushGeometry, berriesGeometry, branchGeometry, grassGeometry, flowerGeometry, giantTreeMesh,
  standingStoneGeometry, floorGeometry, wallGeometry, doorFrameGeometry, doorPanelGeometry, roofGeometry,
  campfireGeometry, flameGeometry, workbenchGeometry, shelterGeometry, meatDropGeometry, vcMaterial,
  mergeParts, part, type CharacterRig, type BoarRig,
} from "./models";
import { GameAudio, type Sfx } from "./audio";
import type { GameSettings, InvSlot, SaveData, SavedBuilding, SavedDrop } from "./storage";

// ─── public types ───────────────────────────────────────────────────────────
export interface Prompt {
  title: string;
  action: string;
  disabled?: boolean;
}

export interface BuildInfo {
  type: BuildType;
  valid: boolean;
  reason: string;
  have: number;
  canCraft: boolean;
}

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

export interface Snapshot {
  health: number;
  hunger: number;
  stamina: number;
  inventory: (InvSlot | null)[];
  invVersion: number;
  hotbarIndex: number;
  equipped: ItemId | null;
  prompt: Prompt | null;
  build: BuildInfo | null;
  dayTime: number;
  day: number;
  clock: string;
  isNight: boolean;
  survived: number;
  deaths: number;
  saveStatus: SaveStatus;
  dead: boolean;
  fps: number;
  pointerLocked: boolean;
  nearWorkbench: boolean;
  nearCampfire: boolean;
  hurtAt: number;
  started: boolean;
}

export type EngineEvent =
  | { type: "toast"; text: string; tone: "info" | "good" | "warn" | "bad"; item?: ItemId }
  | { type: "dead" }
  | { type: "pause-request" }
  | { type: "open-craft" };

export interface EngineOptions {
  container: HTMLElement;
  save: SaveData | null;
  settings: GameSettings;
  isTouch: boolean;
  onSnapshot: (s: Snapshot) => void;
  onEvent: (e: EngineEvent) => void;
}

// ─── internal types ─────────────────────────────────────────────────────────
interface NodeVisual {
  mesh: THREE.InstancedMesh;
  index: number;
  extra?: { mesh: THREE.InstancedMesh; index: number };
  stump?: { mesh: THREE.InstancedMesh; index: number };
}

interface BuildingRT {
  data: SavedBuilding;
  obj: THREE.Group;
  colliders: Collider[];
  panel?: THREE.Group;
  panelCollider?: Collider;
  openAmt: number;
  flame?: THREE.Mesh;
}

interface Animal {
  id: number;
  homeX: number;
  homeZ: number;
  x: number;
  z: number;
  y: number;
  rotY: number;
  hp: number;
  alive: boolean;
  respawnAt: number;
  state: "wander" | "chase" | "return";
  tx: number;
  tz: number;
  attackCd: number;
  windup: number;
  hurtT: number;
  deadT: number;
  legPhase: number;
  stuckT: number;
  lastX: number;
  lastZ: number;
  speed: number;
  rig: BoarRig;
}

interface DropRT {
  data: SavedDrop;
  mesh: THREE.Mesh;
  lockUntilAway: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

type PendingAction =
  | { kind: "node"; id: number }
  | { kind: "attack" }
  | null;

const HALF_PI = Math.PI / 2;
const S = TUNING.gridCell;
const PLAYER_R = 0.38;
const PLAYER_H = 1.8;
const STEP = 0.55;

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
function damp(cur: number, target: number, lambda: number, dt: number) {
  return cur + (target - cur) * (1 - Math.exp(-lambda * dt));
}
function angleLerp(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// ─── Engine ─────────────────────────────────────────────────────────────────
export class SurvivalEngine {
  private opts: EngineOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private resizeObs: ResizeObserver | null = null;
  private raf = 0;
  private lastFrame = 0;
  private disposed = false;
  private disposables: { dispose: () => void }[] = [];
  private audio = new GameAudio();
  private settings: GameSettings;

  // world
  private terrain = new Terrain();
  private nodes: NodeDef[] = [];
  private nodeUses: Int16Array = new Int16Array(0);
  private nodeRespawn: Float64Array = new Float64Array(0);
  private nodeVisual: NodeVisual[] = [];
  private nodeColliders: (Collider | null)[] = [];
  private nodeGrid = new Map<number, number[]>();
  private colliders = new SpatialHash(4);
  private grassMesh: THREE.InstancedMesh | null = null;
  private grassTotal = 0;

  // lights / sky
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private fireLights: THREE.PointLight[] = [];
  private stars: THREE.Points | null = null;
  private skyColor = new THREE.Color();

  // player
  private rig: CharacterRig;
  private tools: Record<"axe" | "spear", THREE.Group>;
  private pos = new THREE.Vector3();
  private velY = 0;
  private grounded = true;
  private rotY = 0;
  private moveSpeed = 0;
  private animPhase = 0;
  private knockX = 0;
  private knockZ = 0;
  private health = 100;
  private hunger = 100;
  private stamina = 100;
  private exhausted = false;
  private staminaDelay = 0;
  private lastHurt = -999;
  private hurtT = 0;
  private hurtAt = 0;
  private dead = false;
  private deadT = 0;
  private deadEmitted = false;
  private stepTimer = 0;
  private eatCd = 0;
  private actionT = 0;
  private actionDur = 0;
  private actionApplied = false;
  private pending: PendingAction = null;

  // inventory
  private inventory: (InvSlot | null)[] = [];
  private invVersion = 0;
  private hotbarIndex = 0;

  // camera
  private yaw = 0;
  private pitch = 0.35;
  private dist = 5.5;
  private curDist = 5.5;
  private camTarget = new THREE.Vector3();

  // time
  private dayTime = 0.3;
  private day = 1;
  private total = 0;
  private survived = 0;
  private deaths = 0;

  // buildings
  private buildings = new Map<number, BuildingRT>();
  private occupancy = new Map<string, number>();
  private floorTops = new Map<string, number>();
  private nextBuildingId = 1;
  private geoCache = new Map<string, THREE.BufferGeometry>();
  private buildMat: THREE.MeshLambertMaterial;
  private flameMat: THREE.MeshBasicMaterial;
  private buildType: BuildType | null = null;
  private buildRot = 0;
  private ghost: THREE.Group | null = null;
  private ghostType: BuildType | null = null;
  private ghostMat: THREE.MeshBasicMaterial;
  private buildCandidate: { valid: boolean; reason: string; x: number; y: number; z: number; key: string | null; rot: number } | null = null;

  // animals & drops & fx
  private animals: Animal[] = [];
  private drops = new Map<number, DropRT>();
  private nextDropId = 1;
  private dropGeo: THREE.BufferGeometry;
  private bundleGeo: THREE.BufferGeometry;
  private dropMats = new Map<ItemId, THREE.MeshLambertMaterial>();
  private particles: Particle[] = [];
  private particleCursor = 0;

  // input
  private keys = new Set<string>();
  private touchMove = { x: 0, y: 0 };
  private touchSprint = false;
  private interactHeld = false;
  private attackHeld = false;
  private jumpQueued = false;
  private mouseDrag: { active: boolean; moved: number; x: number; y: number } = { active: false, moved: 0, x: 0, y: 0 };
  private pointerLocked = false;
  private expectUnlock = false;
  private lookAccum = { x: 0, y: 0 };

  // state flags
  private started = false;
  private paused = false;
  private uiBlocking = false;
  private hidden = false;

  // ui sync
  private snapTimer = 0;
  private scanTimer = 0;
  private slowTimer = 0;
  private lightTimer = 0;
  private prompt: Prompt | null = null;
  private promptTarget: { kind: "node" | "drop" | "building"; id: number } | null = null;
  private nearWorkbench = false;
  private nearCampfire = false;
  private fireProximity = 0;
  private fps = 0;
  private fpsFrames = 0;
  private fpsTime = 0;

  // save
  private saveStatus: SaveStatus = "idle";
  private saving = false;
  private saveQueued = false;
  private autosaveTimer = 0;
  private dirtyTimer = -1;
  private saveFn: ((d: SaveData) => Promise<void>) | null = null;

  // scratch
  private v1 = new THREE.Vector3();
  private v2 = new THREE.Vector3();
  private mtx = new THREE.Matrix4();
  private quat = new THREE.Quaternion();
  private scl = new THREE.Vector3();
  private outXZ = { x: 0, z: 0 };

  constructor(opts: EngineOptions) {
    this.opts = opts;
    this.container = opts.container;
    this.settings = { ...opts.settings };

    const high = this.settings.quality === "high";
    this.renderer = new THREE.WebGLRenderer({
      antialias: high && !opts.isTouch,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = high;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.applyPixelRatio();
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    canvas.setAttribute("aria-label", "Usick Survival game view");
    this.container.appendChild(canvas);

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 230);
    this.scene.fog = new THREE.Fog(0x9fd0ff, 35, 120);

    // lights (fixed count → no shader recompiles)
    this.hemi = new THREE.HemisphereLight(0xcfe8ff, 0x4a5a32, 1.3);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.3);
    this.sun.castShadow = high;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 120;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    for (let i = 0; i < 2; i++) {
      const l = new THREE.PointLight(0xff9a3c, 0, 16, 1.6);
      this.fireLights.push(l);
      this.scene.add(l);
    }

    this.buildMat = vcMaterial();
    this.flameMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.ghostMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.45, depthWrite: false });
    this.disposables.push(this.buildMat, this.flameMat, this.ghostMat);
    this.dropGeo = meatDropGeometry();
    this.bundleGeo = mergeParts([part(new THREE.BoxGeometry(0.34, 0.22, 0.26), 0xffffff, [0, 0.13, 0])]);
    this.disposables.push(this.dropGeo, this.bundleGeo);

    this.buildTerrain();
    this.buildWater();
    this.buildLandmarks();
    this.buildNodes();
    this.buildGrass();
    this.buildStars();
    this.buildParticles();

    // player
    this.rig = createCharacter();
    this.scene.add(this.rig.root);
    this.tools = { axe: createToolMesh("axe"), spear: createToolMesh("spear") };
    this.rig.hand.add(this.tools.axe, this.tools.spear);
    this.tools.axe.visible = false;
    this.tools.spear.visible = false;

    this.resetState();
    this.spawnAnimals();
    if (opts.save) this.applySave(opts.save);
    this.refreshAllNodeVisuals();
    this.updateHeldTool();
    this.camTarget.set(this.pos.x, this.pos.y + 1.55, this.pos.z);
    this.updateDayNight(true);

    this.bindEvents();
    this.resize();
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    this.emitSnapshot();
  }

  // ═══ world construction ═══════════════════════════════════════════════════
  private buildTerrain() {
    const N = GRID_N;
    const pos = new Float32Array(N * N * 6 * 3);
    const col = new Float32Array(N * N * 6 * 3);
    const c = new THREE.Color();
    const grassA = new THREE.Color(0x6aa84f);
    const grassB = new THREE.Color(0x85b955);
    const grassC = new THREE.Color(0x4f8f3d);
    const dirt = new THREE.Color(0xa47c52);
    const sand = new THREE.Color(0xcdb07a);
    const rockC = new THREE.Color(0x7f8a6a);
    const half = TUNING.worldHalf;
    let o = 0;
    const pushV = (i: number, j: number) => {
      const x = -half + i * GRID_CELL;
      const z = -half + j * GRID_CELL;
      pos[o * 3] = x;
      pos[o * 3 + 1] = this.terrain.vertexHeight(i, j);
      pos[o * 3 + 2] = z;
      o++;
    };
    const tri = (verts: [number, number][]) => {
      const start = o;
      let cx = 0, cz = 0, cy = 0;
      for (const [i, j] of verts) {
        pushV(i, j);
        cx += -half + i * GRID_CELL;
        cz += -half + j * GRID_CELL;
        cy += this.terrain.vertexHeight(i, j);
      }
      cx /= 3; cz /= 3; cy /= 3;
      // colour per face
      const n = Math.sin(cx * 0.31 + cz * 0.17) * 0.5 + Math.sin(cx * 0.07 - cz * 0.13) * 0.5;
      c.copy(grassA).lerp(n > 0 ? grassB : grassC, Math.abs(n) * 0.8);
      const pd = pathDistance(cx, cz);
      if (pd < 2.6) c.lerp(dirt, 1 - smoothstep(1.2, 2.6, pd));
      const dp = Math.hypot(cx - POND.x, cz - POND.z);
      if (dp < POND.r + 3.5) c.lerp(sand, 1 - smoothstep(POND.r, POND.r + 3.5, dp));
      if (cy > 7) c.lerp(rockC, smoothstep(7, 14, cy));
      const jitter = 0.94 + ((Math.sin(cx * 12.9898 + cz * 78.233) * 43758.5453) % 1 + 1) % 1 * 0.1;
      for (let k = start; k < o; k++) {
        col[k * 3] = c.r * jitter;
        col[k * 3 + 1] = c.g * jitter;
        col[k * 3 + 2] = c.b * jitter;
      }
    };
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        tri([[i, j], [i, j + 1], [i + 1, j]]);
        tri([[i + 1, j], [i, j + 1], [i + 1, j + 1]]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    m.receiveShadow = true;
    this.scene.add(m);
    this.disposables.push(g, m.material as THREE.Material);
  }

  private buildWater() {
    const g = new THREE.CircleGeometry(POND.r + 4, 24);
    g.rotateX(-HALF_PI);
    const mat = new THREE.MeshLambertMaterial({ color: 0x3f8fc4, transparent: true, opacity: 0.82 });
    const m = new THREE.Mesh(g, mat);
    m.position.set(POND.x, WATER_LEVEL, POND.z);
    m.receiveShadow = true;
    this.scene.add(m);
    this.disposables.push(g, mat);
    this.addCollider({ kind: "circle", x: POND.x, z: POND.z, r: POND.r - 1.2, hx: 0, hz: 0, yMin: -50, yMax: 50, enabled: true, tag: "pond" });
  }

  private buildLandmarks() {
    const gt = giantTreeMesh();
    gt.position.set(GIANT_TREE.x, this.terrain.heightAt(GIANT_TREE.x, GIANT_TREE.z) - 0.2, GIANT_TREE.z);
    this.scene.add(gt);
    this.disposables.push(gt.geometry, gt.material as THREE.Material);
    this.addCollider({ kind: "circle", x: GIANT_TREE.x, z: GIANT_TREE.z, r: 1.7, hx: 0, hz: 0, yMin: -50, yMax: 12, enabled: true, tag: "giant" });

    const sg = standingStoneGeometry();
    const sm = vcMaterial();
    const count = 9;
    const inst = new THREE.InstancedMesh(sg, sm, count);
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2;
      const x = STONE_CIRCLE.x + Math.cos(a) * STONE_CIRCLE.r;
      const z = STONE_CIRCLE.z + Math.sin(a) * STONE_CIRCLE.r;
      this.mtx.compose(
        this.v1.set(x, this.terrain.heightAt(x, z) - 0.1, z),
        this.quat.setFromAxisAngle(this.v2.set(0, 1, 0), -a + HALF_PI),
        this.scl.set(1, 0.85 + (k % 3) * 0.15, 1),
      );
      inst.setMatrixAt(k, this.mtx);
      this.addCollider({ kind: "circle", x, z, r: 0.55, hx: 0, hz: 0, yMin: -50, yMax: 3, enabled: true, tag: "stone" });
    }
    inst.castShadow = true;
    inst.receiveShadow = true;
    this.scene.add(inst);
    this.disposables.push(sg, sm);
  }

  private buildNodes() {
    this.nodes = generateNodes(this.terrain);
    const n = this.nodes.length;
    this.nodeUses = new Int16Array(n);
    this.nodeRespawn = new Float64Array(n);
    this.nodeVisual = new Array(n);
    this.nodeColliders = new Array(n).fill(null);

    const byType = new Map<string, NodeDef[]>();
    for (const nd of this.nodes) {
      const arr = byType.get(nd.type) ?? [];
      arr.push(nd);
      byType.set(nd.type, arr);
    }
    const mat = vcMaterial();
    this.disposables.push(mat);
    const makeInst = (geo: THREE.BufferGeometry, count: number, shadow: boolean) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
      im.count = count;
      im.castShadow = shadow;
      im.receiveShadow = true;
      im.frustumCulled = false;
      this.scene.add(im);
      this.disposables.push(geo);
      return im;
    };
    const tint = new THREE.Color();
    const geos: Record<string, () => THREE.BufferGeometry> = {
      tree: oakGeometry, pine: pineGeometry, rock: rockGeometry, bush: bushGeometry, berry: berryBushGeometry, branch: branchGeometry,
    };
    const treeCount = (byType.get("tree")?.length ?? 0) + (byType.get("pine")?.length ?? 0);
    const stumpGeo = mergeParts([
      part(new THREE.CylinderGeometry(0.3, 0.36, 0.45, 6), 0x7a5230, [0, 0.2, 0]),
      part(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 6), 0xd9b98a, [0, 0.43, 0]),
    ]);
    const stumps = makeInst(stumpGeo, treeCount, false);
    let stumpIdx = 0;
    for (const [type, list] of byType) {
      const im = makeInst(geos[type](), list.length, type === "tree" || type === "pine" || type === "rock");
      let berries: THREE.InstancedMesh | null = null;
      if (type === "berry") berries = makeInst(berriesGeometry(), list.length, false);
      list.forEach((nd, idx) => {
        const v: NodeVisual = { mesh: im, index: idx };
        if (berries) v.extra = { mesh: berries, index: idx };
        if (type === "tree" || type === "pine") v.stump = { mesh: stumps, index: stumpIdx++ };
        this.nodeVisual[nd.id] = v;
        if (type === "rock") tint.setRGB(0.85 + nd.tint * 0.25, 0.85 + nd.tint * 0.25, 0.88 + nd.tint * 0.22);
        else tint.setRGB(0.82 + nd.tint * 0.3, 0.88 + nd.tint * 0.22, 0.8 + nd.tint * 0.2);
        im.setColorAt(idx, tint);
        if (nd.radius > 0) {
          const c: Collider = {
            kind: "circle", x: nd.x, z: nd.z, r: nd.radius, hx: 0, hz: 0,
            yMin: -50, yMax: type === "rock" ? this.terrain.heightAt(nd.x, nd.z) + 0.9 * nd.scale : 50,
            enabled: true, tag: type === "rock" ? "rock" : "tree",
          };
          this.nodeColliders[nd.id] = c;
          this.addCollider(c);
        }
        const key = this.gridKey(Math.floor(nd.x / 6), Math.floor(nd.z / 6));
        const cell = this.nodeGrid.get(key) ?? [];
        cell.push(nd.id);
        this.nodeGrid.set(key, cell);
      });
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }

  private gridKey(ix: number, iz: number) {
    return (ix + 512) * 2048 + (iz + 512);
  }

  private buildGrass() {
    const rnd = mulberry32(TUNING.worldSeed + 99);
    const total = 2600;
    const gGeo = grassGeometry();
    const fGeo = flowerGeometry();
    const mat = vcMaterial();
    const grass = new THREE.InstancedMesh(gGeo, mat, total);
    const flowers = new THREE.InstancedMesh(fGeo, mat, 300);
    grass.frustumCulled = false;
    flowers.frustumCulled = false;
    let gi = 0;
    let fi = 0;
    let tries = 0;
    const P = TUNING.playableHalf + 6;
    const c = new THREE.Color();
    while ((gi < total || fi < 300) && tries < 20000) {
      tries++;
      const x = (rnd() * 2 - 1) * P;
      const z = (rnd() * 2 - 1) * P;
      if (pathDistance(x, z) < 1.8) continue;
      const h = this.terrain.heightAt(x, z);
      if (h < WATER_LEVEL + 0.3 || h > 8) continue;
      this.mtx.compose(
        this.v1.set(x, h - 0.02, z),
        this.quat.setFromAxisAngle(this.v2.set(0, 1, 0), rnd() * Math.PI * 2),
        this.scl.setScalar(0.8 + rnd() * 0.7),
      );
      if (fi < 300 && rnd() < 0.12) {
        flowers.setMatrixAt(fi, this.mtx);
        const pick = rnd();
        c.setHex(pick < 0.33 ? 0xffffff : pick < 0.66 ? 0xffb3c8 : 0xfff3a0);
        flowers.setColorAt(fi, c);
        fi++;
      } else if (gi < total) {
        grass.setMatrixAt(gi, this.mtx);
        gi++;
      }
    }
    grass.count = gi;
    flowers.count = fi;
    if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
    this.grassTotal = gi;
    this.grassMesh = grass;
    this.applyGrassDensity();
    this.scene.add(grass, flowers);
    this.disposables.push(gGeo, fGeo, mat);
  }

  private applyGrassDensity() {
    if (!this.grassMesh) return;
    const low = this.settings.quality === "low";
    this.grassMesh.count = low ? Math.floor(this.grassTotal * 0.45) : this.grassTotal;
  }

  private buildStars() {
    const rnd = mulberry32(7);
    const n = 350;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(rnd() * 0.9 + 0.1);
      arr[i * 3] = Math.sin(ph) * Math.cos(th) * 150;
      arr[i * 3 + 1] = Math.cos(ph) * 150;
      arr[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 150;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    this.stars = new THREE.Points(g, m);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);
    this.disposables.push(g, m);
  }

  private buildParticles() {
    const g = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.disposables.push(g);
    for (let i = 0; i < 40; i++) {
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
      const mesh = new THREE.Mesh(g, m);
      mesh.visible = false;
      this.scene.add(mesh);
      this.disposables.push(m);
      this.particles.push({ mesh, vel: new THREE.Vector3(), life: 0 });
    }
  }

  private burst(x: number, y: number, z: number, color: number, count = 8, speed = 3) {
    for (let k = 0; k < count; k++) {
      const p = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particles.length;
      p.mesh.position.set(x, y, z);
      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
      p.vel.set((Math.random() - 0.5) * speed, Math.random() * speed * 0.9 + 1, (Math.random() - 0.5) * speed);
      p.life = 0.6 + Math.random() * 0.3;
      p.mesh.visible = true;
      p.mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    }
  }

  private addCollider(c: Collider) {
    this.colliders.insert(c);
  }

  private spawnAnimals() {
    const rnd = mulberry32(TUNING.worldSeed + 7);
    let tries = 0;
    while (this.animals.length < TUNING.boarCount && tries < 2000) {
      tries++;
      const x = (rnd() * 2 - 1) * (TUNING.playableHalf - 10);
      const z = (rnd() * 2 - 1) * (TUNING.playableHalf - 10);
      if (Math.hypot(x - SPAWN.x, z - SPAWN.z) < 32) continue;
      if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 4) continue;
      if (this.overlapsStatic(x, z, 1.2)) continue;
      const rig = createBoar();
      this.scene.add(rig.root);
      const y = this.terrain.heightAt(x, z);
      this.animals.push({
        id: this.animals.length, homeX: x, homeZ: z, x, z, y, rotY: rnd() * 6.28, hp: TUNING.boarHp,
        alive: true, respawnAt: 0, state: "wander", tx: x, tz: z, attackCd: 0, windup: 0, hurtT: 0, deadT: 0,
        legPhase: 0, stuckT: 0, lastX: x, lastZ: z, speed: 0, rig,
      });
    }
  }

  private overlapsStatic(x: number, z: number, r: number) {
    const list = this.colliders.query(x, z, r + 2);
    for (const c of list) {
      if (!c.enabled) continue;
      if (resolveCircle(x, z, r, c, this.outXZ)) return true;
    }
    return false;
  }

  // ═══ state ════════════════════════════════════════════════════════════════
  private resetState() {
    this.pos.set(SPAWN.x, this.terrain.heightAt(SPAWN.x, SPAWN.z), SPAWN.z);
    this.rotY = Math.PI; // face toward -Z (into the forest path)
    this.yaw = 0;
    this.pitch = 0.32;
    this.dist = 5.5;
    this.curDist = 5.5;
    this.health = 100;
    this.hunger = 100;
    this.stamina = 100;
    this.inventory = new Array(TUNING.inventorySize).fill(null);
    this.hotbarIndex = 0;
    this.dayTime = 0.3;
    this.day = 1;
    this.total = 0;
    this.survived = 0;
    this.deaths = 0;
  }

  private applySave(s: SaveData) {
    this.pos.set(s.player.x, s.player.y, s.player.z);
    // never load inside the ground
    const g = this.groundHeight(this.pos.x, this.pos.z, this.pos.y + 50);
    if (this.pos.y < g - 0.5 || this.pos.y > g + 30) this.pos.y = g;
    this.rotY = s.player.rotY;
    this.health = s.player.health;
    this.hunger = s.player.hunger;
    this.stamina = s.player.stamina;
    this.yaw = s.camera.yaw;
    this.pitch = s.camera.pitch;
    this.dist = s.camera.dist;
    this.curDist = s.camera.dist;
    this.inventory = s.inventory.map((x) => (x ? { ...x } : null));
    for (const sl of this.inventory) if (sl) sl.qty = Math.min(sl.qty, ITEMS[sl.id].maxStack);
    this.hotbarIndex = s.hotbarIndex;
    this.dayTime = s.time.dayTime;
    this.day = s.time.day;
    this.total = s.time.total;
    this.survived = s.time.survived;
    this.deaths = s.time.deaths;
    for (const [k, v] of Object.entries(s.nodes)) {
      const id = Number(k);
      if (id < 0 || id >= this.nodes.length) continue;
      this.nodeUses[id] = Math.min(v.uses, this.nodes[id].maxUses);
      this.nodeRespawn[id] = v.respawnAt;
      this.syncNodeCollider(id);
    }
    // buildings — rebuild through the same placement path for consistency
    const sorted = [...s.buildings].sort((a, b) => this.buildOrder(a.type) - this.buildOrder(b.type));
    for (const b of sorted) this.createBuilding({ ...b }, false);
    this.nextBuildingId = Math.max(s.nextBuildingId, ...s.buildings.map((b) => b.id + 1), 1);
    for (const a of s.animals) {
      const an = this.animals[a.id];
      if (!an) continue;
      an.alive = a.alive;
      an.hp = a.hp;
      an.respawnAt = a.respawnAt;
      if (a.alive && !this.overlapsStatic(a.x, a.z, 0.5)) {
        an.x = a.x;
        an.z = a.z;
      }
      an.rig.root.visible = a.alive;
    }
    for (const d of s.drops) this.spawnDropRT({ ...d }, false);
    this.nextDropId = Math.max(s.nextDropId, ...s.drops.map((d) => d.id + 1), 1);
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.deadT = 2;
    }
  }

  private buildOrder(t: BuildType) {
    return t === "floor" ? 0 : t === "wall" || t === "door" ? 1 : t === "roof" ? 2 : 3;
  }

  private buildSave(): SaveData {
    const nodes: SaveData["nodes"] = {};
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodeUses[i] > 0 || this.nodeRespawn[i] > 0) nodes[i] = { uses: this.nodeUses[i], respawnAt: this.nodeRespawn[i] };
    }
    return {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      seed: TUNING.worldSeed,
      player: {
        x: this.pos.x, y: this.pos.y, z: this.pos.z, rotY: this.rotY,
        health: this.health, hunger: this.hunger, stamina: this.stamina,
      },
      camera: { yaw: this.yaw, pitch: this.pitch, dist: this.dist },
      inventory: this.inventory.map((s) => (s ? { ...s } : null)),
      hotbarIndex: this.hotbarIndex,
      nodes,
      buildings: [...this.buildings.values()].map((b) => ({ ...b.data })),
      nextBuildingId: this.nextBuildingId,
      animals: this.animals.map((a) => ({ id: a.id, alive: a.alive, hp: a.hp, x: a.x, z: a.z, respawnAt: a.respawnAt })),
      drops: [...this.drops.values()].map((d) => ({ ...d.data })),
      nextDropId: this.nextDropId,
      time: { dayTime: this.dayTime, day: this.day, total: this.total, survived: this.survived, deaths: this.deaths },
    };
  }

  /** Provide the persistence function (kept outside the engine for testability). */
  setSaver(fn: (d: SaveData) => Promise<void>) {
    this.saveFn = fn;
  }

  async saveNow(): Promise<boolean> {
    if (!this.saveFn) return false;
    if (this.saving) {
      this.saveQueued = true;
      return true;
    }
    this.saving = true;
    this.saveStatus = "saving";
    this.emitSnapshot();
    let ok = true;
    try {
      await this.saveFn(this.buildSave());
      this.saveStatus = "saved";
    } catch {
      this.saveStatus = "failed";
      ok = false;
    }
    this.saving = false;
    this.autosaveTimer = 0;
    if (!this.disposed) this.emitSnapshot();
    if (this.saveQueued && !this.disposed) {
      this.saveQueued = false;
      return this.saveNow();
    }
    return ok;
  }

  private markDirty() {
    this.dirtyTimer = 1.2;
  }

  // ═══ inventory ════════════════════════════════════════════════════════════
  private bumpInv() {
    this.invVersion++;
    this.updateHeldTool();
  }

  countItem(id: ItemId) {
    let n = 0;
    for (const s of this.inventory) if (s && s.id === id) n += s.qty;
    return n;
  }

  private static addTo(inv: (InvSlot | null)[], id: ItemId, qty: number): number {
    const max = ITEMS[id].maxStack;
    let left = qty;
    for (const s of inv) {
      if (left <= 0) break;
      if (s && s.id === id && s.qty < max) {
        const add = Math.min(max - s.qty, left);
        s.qty += add;
        left -= add;
      }
    }
    for (let i = 0; i < inv.length && left > 0; i++) {
      if (!inv[i]) {
        const add = Math.min(max, left);
        inv[i] = { id, qty: add };
        left -= add;
      }
    }
    return left;
  }

  private static removeFrom(inv: (InvSlot | null)[], id: ItemId, qty: number): boolean {
    let have = 0;
    for (const s of inv) if (s && s.id === id) have += s.qty;
    if (have < qty) return false;
    let left = qty;
    for (let i = inv.length - 1; i >= 0 && left > 0; i--) {
      const s = inv[i];
      if (s && s.id === id) {
        const take = Math.min(s.qty, left);
        s.qty -= take;
        left -= take;
        if (s.qty <= 0) inv[i] = null;
      }
    }
    return true;
  }

  private cloneInv() {
    return this.inventory.map((s) => (s ? { ...s } : null));
  }

  /** Adds all items atomically; returns false (and changes nothing) when it does not fit. */
  private giveAll(items: [ItemId, number][]): boolean {
    const inv = this.cloneInv();
    for (const [id, q] of items) if (SurvivalEngine.addTo(inv, id, q) > 0) return false;
    this.inventory = inv;
    this.bumpInv();
    return true;
  }

  get equipped(): ItemId | null {
    return this.inventory[this.hotbarIndex]?.id ?? null;
  }

  selectHotbar(i: number) {
    if (i < 0 || i >= TUNING.hotbarSize) return;
    this.hotbarIndex = i;
    this.bumpInv();
    this.emitSnapshot();
  }

  private updateHeldTool() {
    const e = this.equipped;
    this.tools.axe.visible = e === "axe";
    this.tools.spear.visible = e === "spear";
  }

  useSlot(i: number) {
    const s = this.inventory[i];
    if (!s || this.dead) return;
    const def = ITEMS[s.id];
    if (def.food) {
      this.eat(i);
      return;
    }
    if (def.kind === "build") {
      this.startBuild(s.id as BuildType);
      return;
    }
    if (def.kind === "tool" || def.kind === "weapon") {
      this.equipSlot(i);
    }
  }

  /** Move the item into the selected hotbar slot (swap) and select it. */
  equipSlot(i: number) {
    if (i < 0 || i >= this.inventory.length) return;
    if (i < TUNING.hotbarSize) {
      this.hotbarIndex = i;
    } else {
      let target = this.hotbarIndex;
      for (let k = 0; k < TUNING.hotbarSize; k++) {
        if (!this.inventory[k]) {
          target = k;
          break;
        }
      }
      const tmp = this.inventory[target];
      this.inventory[target] = this.inventory[i];
      this.inventory[i] = tmp;
      this.hotbarIndex = target;
    }
    this.bumpInv();
    this.markDirty();
    this.emitSnapshot();
  }

  moveSlot(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= this.inventory.length || to >= this.inventory.length) return;
    const a = this.inventory[from];
    const b = this.inventory[to];
    if (a && b && a.id === b.id) {
      const max = ITEMS[a.id].maxStack;
      const mv = Math.min(max - b.qty, a.qty);
      b.qty += mv;
      a.qty -= mv;
      if (a.qty <= 0) this.inventory[from] = null;
    } else {
      this.inventory[from] = b;
      this.inventory[to] = a;
    }
    this.bumpInv();
    this.markDirty();
    this.emitSnapshot();
  }

  /** Drop a whole stack on the ground in front of the player. */
  dropSlot(i: number) {
    const s = this.inventory[i];
    if (!s || this.dead) return;
    const fx = Math.sin(this.rotY);
    const fz = Math.cos(this.rotY);
    let x = this.pos.x + fx * 1.2;
    let z = this.pos.z + fz * 1.2;
    if (this.overlapsStatic(x, z, 0.2)) {
      x = this.pos.x;
      z = this.pos.z;
    }
    if (this.drops.size >= TUNING.maxDrops) {
      // remove the oldest drop to respect the cap
      const oldest = [...this.drops.values()].sort((a, b) => a.data.expiresAt - b.data.expiresAt)[0];
      if (oldest) this.removeDrop(oldest.data.id);
    }
    this.spawnDropRT({ id: this.nextDropId++, item: s.id, qty: s.qty, x, z, expiresAt: this.total + TUNING.dropLifetimeSeconds }, true);
    this.inventory[i] = null;
    this.bumpInv();
    this.toast(`${ITEMS[s.id].name} ×${s.qty} dijatuhkan`, "info", s.id);
    this.markDirty();
    this.emitSnapshot();
  }

  private eat(slot: number) {
    if (this.eatCd > 0) return;
    const s = this.inventory[slot];
    if (!s) return;
    const food = ITEMS[s.id].food;
    if (!food) return;
    if (this.hunger >= 99.5 && food.health <= 0) {
      this.toast("Kamu masih kenyang", "info");
      return;
    }
    s.qty -= 1;
    if (s.qty <= 0) this.inventory[slot] = null;
    this.hunger = clamp(this.hunger + food.hunger, 0, 100);
    if (food.health < 0) this.damagePlayer(-food.health, true);
    else this.health = clamp(this.health + food.health, 0, 100);
    this.eatCd = 0.8;
    this.play("eat");
    this.toast(`Makan ${ITEMS[s.id].name} (+${food.hunger} Hunger)`, food.health < 0 ? "warn" : "good", s.id);
    this.bumpInv();
    this.markDirty();
    this.emitSnapshot();
  }

  // ═══ crafting ═════════════════════════════════════════════════════════════
  craft(recipeId: string): { ok: boolean; reason?: string } {
    const r = RECIPES.find((x) => x.id === recipeId);
    if (!r) return { ok: false, reason: "Resep tidak ditemukan" };
    if (this.dead) return { ok: false, reason: "Tidak bisa crafting saat tumbang" };
    if (r.needsWorkbench && !this.isNearWorkbench()) {
      return { ok: false, reason: "Butuh Basic Workbench di dekatmu" };
    }
    const missing: string[] = [];
    for (const [id, q] of Object.entries(r.cost) as [ItemId, number][]) {
      const have = this.countItem(id);
      if (have < q) missing.push(`${ITEMS[id].name} ${have}/${q}`);
    }
    if (missing.length) return { ok: false, reason: `Bahan kurang: ${missing.join(", ")}` };
    const inv = this.cloneInv();
    for (const [id, q] of Object.entries(r.cost) as [ItemId, number][]) SurvivalEngine.removeFrom(inv, id, q);
    if (SurvivalEngine.addTo(inv, r.output, r.qty) > 0) return { ok: false, reason: "Inventaris penuh" };
    this.inventory = inv;
    this.bumpInv();
    this.play("craft");
    this.toast(`Berhasil membuat ${ITEMS[r.output].name}`, "good", r.output);
    this.markDirty();
    this.emitSnapshot();
    return { ok: true };
  }

  isNearWorkbench() {
    for (const b of this.buildings.values()) {
      if (b.data.type !== "workbench") continue;
      if (Math.hypot(b.data.x - this.pos.x, b.data.z - this.pos.z) < 6) return true;
    }
    return false;
  }

  // ═══ building ═════════════════════════════════════════════════════════════
  private canCraftDirect(type: BuildType) {
    const r = recipeFor(type);
    if (!r) return false;
    if (r.needsWorkbench && !this.isNearWorkbench()) return false;
    for (const [id, q] of Object.entries(r.cost) as [ItemId, number][]) if (this.countItem(id) < q) return false;
    return true;
  }

  startBuild(type: BuildType): boolean {
    if (this.dead) return false;
    if (this.countItem(type) <= 0 && !this.canCraftDirect(type)) {
      const r = recipeFor(type);
      const need = r ? Object.entries(r.cost).map(([k, v]) => `${v} ${ITEMS[k as ItemId].name}`).join(", ") : "";
      const wb = r?.needsWorkbench && !this.isNearWorkbench() ? " (butuh Workbench di dekatmu)" : "";
      this.toast(`Tidak punya ${ITEMS[type].name}. Butuh: ${need}${wb}`, "warn", type);
      this.play("error");
      return false;
    }
    this.buildType = type;
    this.ensureGhost(type);
    this.emitSnapshot();
    return true;
  }

  cancelBuild() {
    this.buildType = null;
    if (this.ghost) this.ghost.visible = false;
    this.buildCandidate = null;
    this.emitSnapshot();
  }

  rotateBuild() {
    this.buildRot = (this.buildRot + 1) % 4;
  }

  get isBuilding() {
    return this.buildType !== null;
  }

  private getGeo(key: string, make: () => THREE.BufferGeometry) {
    let g = this.geoCache.get(key);
    if (!g) {
      g = make();
      this.geoCache.set(key, g);
    }
    return g;
  }

  private geoFor(type: BuildType): THREE.BufferGeometry {
    switch (type) {
      case "floor": return this.getGeo("floor", floorGeometry);
      case "wall": return this.getGeo("wall", wallGeometry);
      case "door": return this.getGeo("doorFrame", doorFrameGeometry);
      case "roof": return this.getGeo("roof", roofGeometry);
      case "campfire": return this.getGeo("campfire", campfireGeometry);
      case "workbench": return this.getGeo("workbench", workbenchGeometry);
      case "shelter": return this.getGeo("shelter", shelterGeometry);
    }
  }

  private ensureGhost(type: BuildType) {
    if (this.ghost && this.ghostType === type) {
      this.ghost.visible = true;
      return;
    }
    if (this.ghost) this.scene.remove(this.ghost);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(this.geoFor(type), this.ghostMat));
    if (type === "door") {
      const p = new THREE.Mesh(this.getGeo("doorPanel", doorPanelGeometry), this.ghostMat);
      p.position.x = -0.7;
      g.add(p);
    }
    g.renderOrder = 10;
    this.ghost = g;
    this.ghostType = type;
    this.scene.add(g);
  }

  private floorKey(i: number, j: number) {
    return `${i}:${j}`;
  }

  private blockingTags(type: BuildType) {
    return type === "floor" || type === "wall" || type === "door"
      ? ["tree", "rock", "prop", "pond", "stone", "giant"]
      : ["tree", "rock", "prop", "pond", "stone", "giant", "wall", "door"];
  }

  private computeCandidate() {
    const type = this.buildType;
    if (!type) return null;
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const reach = type === "floor" || type === "roof" ? 3.6 : type === "shelter" ? 3.2 : 2.6;
    const ax = this.pos.x + fx * reach;
    const az = this.pos.z + fz * reach;
    const rot = this.buildRot;
    let x = ax, z = az, y = 0, key: string | null = null;
    let valid = true;
    let reason = "";
    const H = TUNING.playableHalf - 2;

    const blockTags = this.blockingTags(type);
    const boxBlocked = (cx: number, cz: number, hx: number, hz: number, y0: number, y1: number) => {
      const list = this.colliders.query(cx, cz, Math.max(hx, hz) + 2);
      for (const c of list) {
        if (!c.enabled || !c.tag || !blockTags.includes(c.tag)) continue;
        if (c.yMin >= y1 || c.yMax <= y0) continue;
        if (c.kind === "circle") {
          const qx = clamp(c.x, cx - hx, cx + hx);
          const qz = clamp(c.z, cz - hz, cz + hz);
          if ((c.x - qx) ** 2 + (c.z - qz) ** 2 < c.r * c.r) return true;
        } else if (Math.abs(c.x - cx) < c.hx + hx && Math.abs(c.z - cz) < c.hz + hz) return true;
      }
      return false;
    };
    const playerInBox = (cx: number, cz: number, hx: number, hz: number, y0: number, y1: number) => {
      if (this.pos.y >= y1 || this.pos.y + PLAYER_H <= y0) return false;
      const qx = clamp(this.pos.x, cx - hx, cx + hx);
      const qz = clamp(this.pos.z, cz - hz, cz + hz);
      return (this.pos.x - qx) ** 2 + (this.pos.z - qz) ** 2 < PLAYER_R * PLAYER_R;
    };

    if (type === "floor") {
      const i = Math.floor(ax / S);
      const j = Math.floor(az / S);
      x = (i + 0.5) * S;
      z = (j + 0.5) * S;
      key = `f:${i}:${j}`;
      const hs = [
        this.terrain.heightAt(x - 1.5, z - 1.5), this.terrain.heightAt(x + 1.5, z - 1.5),
        this.terrain.heightAt(x - 1.5, z + 1.5), this.terrain.heightAt(x + 1.5, z + 1.5),
        this.terrain.heightAt(x, z),
      ];
      const mx = Math.max(...hs);
      const mn = Math.min(...hs);
      y = mx + 0.15;
      if (mx - mn > 1.5) { valid = false; reason = "Tanah terlalu miring"; }
      else if (this.occupancy.has(key)) { valid = false; reason = "Sudah ada lantai di sini"; }
      else if (boxBlocked(x, z, 1.45, 1.45, -50, 50)) { valid = false; reason = "Terhalang pohon/batu/objek"; }
      else if (playerInBox(x, z, 1.5, 1.5, y - 2, y) && y > this.pos.y + STEP) { valid = false; reason = "Terlalu dekat dengan karakter"; }
    } else if (type === "wall" || type === "door") {
      const o = rot % 2;
      let i: number, j: number;
      let cells: [number, number][];
      if (o === 0) {
        i = Math.floor(ax / S); j = Math.round(az / S);
        x = (i + 0.5) * S; z = j * S;
        cells = [[i, j - 1], [i, j]];
      } else {
        i = Math.round(ax / S); j = Math.floor(az / S);
        x = i * S; z = (j + 0.5) * S;
        cells = [[i - 1, j], [i, j]];
      }
      key = `w:${o}:${i}:${j}`;
      let base = -Infinity;
      for (const [ci, cj] of cells) {
        const t = this.floorTops.get(this.floorKey(ci, cj));
        if (t !== undefined) base = Math.max(base, t);
      }
      const ex = o === 0 ? 1.5 : 0;
      const ez = o === 0 ? 0 : 1.5;
      if (base === -Infinity) {
        const h1 = this.terrain.heightAt(x - ex, z - ez);
        const h2 = this.terrain.heightAt(x + ex, z + ez);
        const h3 = this.terrain.heightAt(x, z);
        base = Math.min(h1, h2, h3);
        if (Math.max(h1, h2, h3) - base > 1.0) { valid = false; reason = "Tanah terlalu miring"; }
      }
      y = base;
      const hx = o === 0 ? 1.5 : 0.15;
      const hz = o === 0 ? 0.15 : 1.5;
      if (valid && this.occupancy.has(key)) { valid = false; reason = "Sudah ada dinding/pintu di sini"; }
      else if (valid && boxBlocked(x, z, hx - 0.05, hz - 0.05, y, y + 3)) { valid = false; reason = "Terhalang pohon/batu/objek"; }
      else if (valid && playerInBox(x, z, hx, hz, y, y + 3)) { valid = false; reason = "Terlalu dekat dengan karakter"; }
    } else if (type === "roof") {
      const i = Math.floor(ax / S);
      const j = Math.floor(az / S);
      x = (i + 0.5) * S;
      z = (j + 0.5) * S;
      key = `r:${i}:${j}`;
      const top = this.floorTops.get(this.floorKey(i, j));
      if (top === undefined) {
        valid = false;
        reason = "Atap butuh Wooden Floor di bawahnya";
        y = this.terrain.heightAt(x, z) + 3;
      } else {
        y = top + 3;
        if (this.occupancy.has(key)) { valid = false; reason = "Sudah ada atap di sini"; }
      }
    } else {
      x = Math.round(ax * 2) / 2;
      z = Math.round(az * 2) / 2;
      const odd = rot % 2 === 1;
      const ext = type === "campfire" ? [0.65, 0.65] : type === "workbench" ? [0.85, 0.48] : [1.35, 1.25];
      const hx = odd ? ext[1] : ext[0];
      const hz = odd ? ext[0] : ext[1];
      const floorTop = this.floorTopAt(x, z, Infinity);
      const onFloor = floorTop !== null;
      y = onFloor ? (floorTop as number) : this.terrain.heightAt(x, z);
      if (!onFloor) {
        const hs = [
          this.terrain.heightAt(x - hx, z - hz), this.terrain.heightAt(x + hx, z - hz),
          this.terrain.heightAt(x - hx, z + hz), this.terrain.heightAt(x + hx, z + hz),
        ];
        const mn = Math.min(...hs);
        if (Math.max(...hs) - mn > 0.8) { valid = false; reason = "Tanah terlalu miring"; }
        y = Math.min(y, ...hs) + 0.02;
      }
      if (valid && boxBlocked(x, z, hx, hz, y + 0.05, y + 1.5)) { valid = false; reason = "Terhalang objek lain"; }
      else if (valid && type !== "shelter" && playerInBox(x, z, hx, hz, y, y + 1.5)) { valid = false; reason = "Terlalu dekat dengan karakter"; }
      else if (valid && type === "shelter" && playerInBox(x, z, hx, hz, y, y + 2)) { valid = false; reason = "Terlalu dekat dengan karakter"; }
    }
    if (valid && (Math.abs(x) > H || Math.abs(z) > H)) { valid = false; reason = "Di luar area yang bisa dibangun"; }
    if (valid && Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.5) { valid = false; reason = "Tidak bisa membangun di air"; }
    if (valid && this.countItem(type) <= 0 && !this.canCraftDirect(type)) { valid = false; reason = "Material tidak cukup"; }
    return { valid, reason, x, y, z, key, rot };
  }

  placeBuild(): boolean {
    if (!this.buildType) return false;
    const type = this.buildType;
    const cand = this.computeCandidate();
    if (!cand || !cand.valid) {
      this.toast(cand?.reason || "Lokasi tidak valid", "warn");
      this.play("error");
      return false;
    }
    // consume item, or auto-craft one from materials
    if (this.countItem(type) > 0) {
      SurvivalEngine.removeFrom(this.inventory, type, 1);
    } else {
      const r = recipeFor(type);
      if (!r) return false;
      const inv = this.cloneInv();
      for (const [id, q] of Object.entries(r.cost) as [ItemId, number][]) {
        if (!SurvivalEngine.removeFrom(inv, id, q)) {
          this.toast("Material tidak cukup", "warn");
          return false;
        }
      }
      this.inventory = inv;
    }
    this.bumpInv();
    const b: SavedBuilding = { id: this.nextBuildingId++, type, x: cand.x, y: cand.y, z: cand.z, rot: cand.rot };
    this.createBuilding(b, true);
    this.play("build");
    this.burst(cand.x, cand.y + 0.5, cand.z, 0xb5845a, 10, 3);
    this.toast(`${ITEMS[type].name} dipasang`, "good", type);
    this.markDirty();
    if (this.countItem(type) <= 0 && !this.canCraftDirect(type)) this.cancelBuild();
    this.emitSnapshot();
    return true;
  }

  private createBuilding(b: SavedBuilding, fresh: boolean) {
    const obj = new THREE.Group();
    const mesh = new THREE.Mesh(this.geoFor(b.type), this.buildMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj.add(mesh);
    obj.position.set(b.x, b.y, b.z);
    const rt: BuildingRT = { data: b, obj, colliders: [], openAmt: b.open ? 1 : 0 };
    const o = b.rot % 2;
    const add = (c: Omit<Collider, "enabled">) => {
      const full: Collider = { ...c, enabled: true };
      rt.colliders.push(full);
      this.addCollider(full);
      return full;
    };
    const keyBase = (i: number, j: number) => `${i}:${j}`;
    switch (b.type) {
      case "floor": {
        const i = Math.floor(b.x / S), j = Math.floor(b.z / S);
        const k = `f:${i}:${j}`;
        if (this.occupancy.has(k)) return; // duplicate in save → ignore
        this.occupancy.set(k, b.id);
        this.floorTops.set(keyBase(i, j), b.y);
        add({ kind: "box", x: b.x, z: b.z, r: 0, hx: 1.5, hz: 1.5, yMin: b.y - 2, yMax: b.y, walkable: true, tag: "floor" });
        break;
      }
      case "wall":
      case "door": {
        const i = o === 0 ? Math.floor(b.x / S) : Math.round(b.x / S);
        const j = o === 0 ? Math.round(b.z / S) : Math.floor(b.z / S);
        const k = `w:${o}:${i}:${j}`;
        if (this.occupancy.has(k)) return;
        this.occupancy.set(k, b.id);
        obj.rotation.y = b.type === "door" ? b.rot * HALF_PI : o * HALF_PI;
        if (b.type === "wall") {
          add({ kind: "box", x: b.x, z: b.z, r: 0, hx: o === 0 ? 1.5 : 0.15, hz: o === 0 ? 0.15 : 1.5, yMin: b.y - 1, yMax: b.y + 3, tag: "wall" });
        } else {
          for (const side of [-1.1, 1.1]) {
            add({
              kind: "box", x: b.x + (o === 0 ? side : 0), z: b.z + (o === 0 ? 0 : side), r: 0,
              hx: o === 0 ? 0.4 : 0.15, hz: o === 0 ? 0.15 : 0.4, yMin: b.y - 1, yMax: b.y + 3, tag: "door",
            });
          }
          rt.panelCollider = add({ kind: "box", x: b.x, z: b.z, r: 0, hx: o === 0 ? 0.7 : 0.12, hz: o === 0 ? 0.12 : 0.7, yMin: b.y - 1, yMax: b.y + 2.4, tag: "door" });
          rt.panelCollider.enabled = !b.open;
          const panel = new THREE.Group();
          panel.position.x = -0.7;
          const pm = new THREE.Mesh(this.getGeo("doorPanel", doorPanelGeometry), this.buildMat);
          pm.castShadow = true;
          panel.add(pm);
          obj.add(panel);
          rt.panel = panel;
          panel.rotation.y = -rt.openAmt * HALF_PI * 1.1;
        }
        break;
      }
      case "roof": {
        const i = Math.floor(b.x / S), j = Math.floor(b.z / S);
        const k = `r:${i}:${j}`;
        if (this.occupancy.has(k)) return;
        this.occupancy.set(k, b.id);
        add({ kind: "box", x: b.x, z: b.z, r: 0, hx: 1.65, hz: 1.65, yMin: b.y, yMax: b.y + 0.3, tag: "roof" });
        break;
      }
      case "campfire": {
        obj.rotation.y = b.rot * HALF_PI;
        add({ kind: "circle", x: b.x, z: b.z, r: 0.55, hx: 0, hz: 0, yMin: b.y - 1, yMax: b.y + 0.7, tag: "prop" });
        const flame = new THREE.Mesh(this.getGeo("flame", flameGeometry), this.flameMat);
        obj.add(flame);
        rt.flame = flame;
        break;
      }
      case "workbench": {
        obj.rotation.y = b.rot * HALF_PI;
        add({ kind: "box", x: b.x, z: b.z, r: 0, hx: o ? 0.45 : 0.82, hz: o ? 0.82 : 0.45, yMin: b.y - 1, yMax: b.y + 1.05, tag: "prop" });
        break;
      }
      case "shelter": {
        obj.rotation.y = b.rot * HALF_PI;
        // back (leaf wall) + front posts; the inside stays walkable
        const rotXZ = (lx: number, lz: number): [number, number] => {
          const a = b.rot * HALF_PI;
          return [b.x + lx * Math.cos(a) + lz * Math.sin(a), b.z - lx * Math.sin(a) + lz * Math.cos(a)];
        };
        const [bx, bz] = rotXZ(0, -1.05);
        add({ kind: "box", x: bx, z: bz, r: 0, hx: o ? 0.2 : 1.35, hz: o ? 1.35 : 0.2, yMin: b.y - 1, yMax: b.y + 1.4, tag: "prop" });
        for (const lx of [-1.2, 1.2]) {
          const [px, pz] = rotXZ(lx, 0.9);
          add({ kind: "circle", x: px, z: pz, r: 0.16, hx: 0, hz: 0, yMin: b.y - 1, yMax: b.y + 2.2, tag: "prop" });
        }
        break;
      }
    }
    this.scene.add(obj);
    this.buildings.set(b.id, rt);
    if (fresh) {
      // keep the player out of freshly placed solid geometry
      this.collidePlayer();
    }
  }

  private toggleDoor(id: number) {
    const b = this.buildings.get(id);
    if (!b || b.data.type !== "door" || !b.panelCollider) return;
    const opening = !b.data.open;
    if (!opening) {
      // don't close the door on the player
      const c = b.panelCollider;
      if (resolveCircle(this.pos.x, this.pos.z, PLAYER_R, c, this.outXZ) && this.pos.y < c.yMax && this.pos.y + PLAYER_H > c.yMin) {
        this.toast("Menyingkir dulu dari pintu", "warn");
        return;
      }
    }
    b.data.open = opening;
    b.panelCollider.enabled = !opening;
    this.play("door");
    this.markDirty();
  }

  private floorTopAt(x: number, z: number, maxTop: number): number | null {
    let best: number | null = null;
    const list = this.colliders.query(x, z, 0.1);
    for (const c of list) {
      if (!c.enabled || !c.walkable) continue;
      if (Math.abs(x - c.x) > c.hx || Math.abs(z - c.z) > c.hz) continue;
      if (c.yMax > maxTop) continue;
      if (best === null || c.yMax > best) best = c.yMax;
    }
    return best;
  }

  private groundHeight(x: number, z: number, yRef: number) {
    const t = this.terrain.heightAt(x, z);
    const f = this.floorTopAt(x, z, yRef + STEP);
    return f !== null && f > t ? f : t;
  }

  // ═══ resource nodes ═══════════════════════════════════════════════════════
  private nodeAvailable(id: number) {
    return this.nodeUses[id] < this.nodes[id].maxUses;
  }

  private syncNodeCollider(id: number) {
    const c = this.nodeColliders[id];
    if (c) c.enabled = this.nodeAvailable(id);
  }

  private setNodeVisual(id: number) {
    const nd = this.nodes[id];
    const v = this.nodeVisual[id];
    if (!v) return;
    const avail = this.nodeAvailable(id);
    let s = avail ? 1 : 0;
    if (nd.type === "bush" && avail) s = 1 - 0.2 * this.nodeUses[id];
    if (nd.type === "berry") s = 1; // the bush stays, only berries vanish
    const y = this.terrain.heightAt(nd.x, nd.z) - 0.05;
    this.quat.setFromAxisAngle(this.v2.set(0, 1, 0), nd.rot);
    this.mtx.compose(this.v1.set(nd.x, y, nd.z), this.quat, this.scl.setScalar(s * nd.scale));
    v.mesh.setMatrixAt(v.index, this.mtx);
    v.mesh.instanceMatrix.needsUpdate = true;
    if (v.extra) {
      const bs = avail ? nd.scale : 0;
      this.mtx.compose(this.v1.set(nd.x, y, nd.z), this.quat, this.scl.setScalar(bs));
      v.extra.mesh.setMatrixAt(v.extra.index, this.mtx);
      v.extra.mesh.instanceMatrix.needsUpdate = true;
    }
    if (v.stump) {
      const ss = avail ? 0 : nd.scale;
      this.mtx.compose(this.v1.set(nd.x, y, nd.z), this.quat, this.scl.setScalar(ss));
      v.stump.mesh.setMatrixAt(v.stump.index, this.mtx);
      v.stump.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  private refreshAllNodeVisuals() {
    for (let i = 0; i < this.nodes.length; i++) this.setNodeVisual(i);
  }

  private gatherNode(id: number) {
    const nd = this.nodes[id];
    if (!nd || !this.nodeAvailable(id)) return;
    let items: [ItemId, number][] = [];
    let sfx: Sfx = "gather";
    let color = 0x6bb044;
    const last = this.nodeUses[id] + 1 >= nd.maxUses;
    switch (nd.type) {
      case "tree":
      case "pine":
        if (this.equipped !== "axe") {
          this.toast("Butuh Wooden Axe di tangan untuk menebang", "warn", "axe");
          this.play("error");
          return;
        }
        items = last ? [["wood", 2], ["leaves", 2]] : [["wood", 1]];
        sfx = "chop";
        color = 0x9a6a3a;
        break;
      case "rock":
        items = [["stone", 1]];
        sfx = "chop";
        color = 0x9aa0a6;
        break;
      case "bush":
        items = [["fiber", 2], ["leaves", 1]];
        break;
      case "berry":
        items = [["berries", 3]];
        color = 0xd2263a;
        break;
      case "branch":
        items = [["wood", 2]];
        color = 0x8a5a32;
        break;
    }
    if (!this.giveAll(items)) {
      this.toast("Inventaris penuh", "bad");
      this.play("error");
      return;
    }
    this.nodeUses[id] += 1;
    if (!this.nodeAvailable(id)) {
      const isTree = nd.type === "tree" || nd.type === "pine";
      this.nodeRespawn[id] = this.total + (isTree ? TUNING.treeRespawnSeconds : TUNING.nodeRespawnSeconds);
      this.syncNodeCollider(id);
      if (isTree) this.burst(nd.x, this.terrain.heightAt(nd.x, nd.z) + 2.5, nd.z, 0x4f9a3c, 14, 5);
    }
    this.setNodeVisual(id);
    this.play(sfx);
    this.burst(nd.x, this.terrain.heightAt(nd.x, nd.z) + 0.8, nd.z, color, 6, 2.5);
    this.stamina = Math.max(0, this.stamina - TUNING.staminaActionCost * 0.5);
    this.staminaDelay = 0.6;
    this.toast(items.map(([i, q]) => `+${q} ${ITEMS[i].name}`).join("  "), "good", items[0][0]);
    this.markDirty();
  }

  private updateNodeRespawn() {
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodeRespawn[i] > 0 && this.total >= this.nodeRespawn[i]) {
        const nd = this.nodes[i];
        if (nd.radius > 0 && Math.hypot(nd.x - this.pos.x, nd.z - this.pos.z) < nd.radius + 1.2) {
          this.nodeRespawn[i] = this.total + 10; // wait until the player moves away
          continue;
        }
        // don't respawn inside a building the player placed on the spot
        if (nd.radius > 0 && this.buildingOverlap(nd.x, nd.z, nd.radius)) {
          this.nodeRespawn[i] = this.total + 120;
          continue;
        }
        this.nodeUses[i] = 0;
        this.nodeRespawn[i] = 0;
        this.syncNodeCollider(i);
        this.setNodeVisual(i);
      } else if (this.nodeRespawn[i] === 0 && this.nodeUses[i] > 0 && this.nodeAvailable(i)) {
        // partially used bushes/rocks slowly recover
        this.nodeRespawn[i] = this.total + TUNING.nodeRespawnSeconds;
      }
    }
  }

  private buildingOverlap(x: number, z: number, r: number) {
    const list = this.colliders.query(x, z, r + 2);
    for (const c of list) {
      if (!c.enabled || !c.tag || ["tree", "rock", "pond", "stone", "giant"].includes(c.tag)) continue;
      if (resolveCircle(x, z, r, c, this.outXZ)) return true;
    }
    return false;
  }

  // ═══ drops ════════════════════════════════════════════════════════════════
  private dropMaterial(id: ItemId) {
    let m = this.dropMats.get(id);
    if (!m) {
      const colors: Partial<Record<ItemId, number>> = {
        wood: 0x9a6a3a, stone: 0x9aa0a6, fiber: 0xc9c46a, leaves: 0x5fae46, berries: 0xd2263a, cooked_meat: 0x8a4a2a,
      };
      m = new THREE.MeshLambertMaterial({ color: colors[id] ?? 0xd9b98a, flatShading: true, vertexColors: true });
      this.dropMats.set(id, m);
      this.disposables.push(m);
    }
    return m;
  }

  private spawnDropRT(d: SavedDrop, lock: boolean) {
    const meat = d.item === "raw_meat" || d.item === "cooked_meat";
    const mesh = new THREE.Mesh(meat ? this.dropGeo : this.bundleGeo, meat ? (d.item === "raw_meat" ? this.buildMat : this.dropMaterial(d.item)) : this.dropMaterial(d.item));
    mesh.castShadow = true;
    mesh.position.set(d.x, this.groundHeight(d.x, d.z, this.pos.y + 2), d.z);
    this.scene.add(mesh);
    this.drops.set(d.id, { data: d, mesh, lockUntilAway: lock });
  }

  private removeDrop(id: number) {
    const d = this.drops.get(id);
    if (!d) return;
    this.scene.remove(d.mesh);
    this.drops.delete(id);
  }

  private pickupDrop(id: number, auto: boolean) {
    const d = this.drops.get(id);
    if (!d) return;
    if (!this.giveAll([[d.data.item, d.data.qty]])) {
      if (!auto) {
        this.toast("Inventaris penuh", "bad");
        this.play("error");
      }
      return;
    }
    this.removeDrop(id);
    this.play("pickup");
    this.toast(`+${d.data.qty} ${ITEMS[d.data.item].name}`, "good", d.data.item);
    this.markDirty();
  }

  // ═══ combat ═══════════════════════════════════════════════════════════════
  private damagePlayer(amount: number, silent = false) {
    if (this.dead || amount <= 0) return;
    this.health = clamp(this.health - amount, 0, 100);
    this.lastHurt = this.total;
    this.hurtT = 0.35;
    this.hurtAt = performance.now();
    if (!silent) this.play("hurt");
    if (this.health <= 0) this.die();
  }

  private die() {
    this.dead = true;
    this.deadT = 0;
    this.deadEmitted = false;
    this.cancelBuild();
    this.pending = null;
    this.actionT = 0;
    this.markDirty();
  }

  respawn() {
    if (!this.dead) return;
    this.dead = false;
    this.deadT = 0;
    this.deadEmitted = false;
    this.deaths += 1;
    this.survived = 0;
    this.health = 70;
    this.hunger = Math.max(this.hunger, 55);
    this.stamina = 100;
    this.exhausted = false;
    this.pos.set(SPAWN.x, this.terrain.heightAt(SPAWN.x, SPAWN.z), SPAWN.z);
    this.velY = 0;
    this.knockX = this.knockZ = 0;
    this.rig.body.rotation.set(0, 0, 0);
    this.rig.body.position.set(0, 0, 0);
    for (const a of this.animals) if (a.state === "chase") a.state = "return";
    this.camTarget.set(this.pos.x, this.pos.y + 1.55, this.pos.z);
    void this.saveNow();
    this.emitSnapshot();
  }

  private attackHit() {
    const e = this.equipped;
    const reach = e === "spear" ? 2.9 : e === "axe" ? 2.3 : 1.9;
    const dmg = e === "spear" ? 25 : e === "axe" ? 15 : 8;
    const fx = Math.sin(this.rotY);
    const fz = Math.cos(this.rotY);
    let best: Animal | null = null;
    let bestD = Infinity;
    for (const a of this.animals) {
      if (!a.alive) continue;
      const dx = a.x - this.pos.x;
      const dz = a.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > reach + 0.5 || Math.abs(a.y - this.pos.y) > 2) continue;
      const dot = d > 0.01 ? (dx * fx + dz * fz) / d : 1;
      if (dot < 0.35) continue;
      if (d < bestD) {
        best = a;
        bestD = d;
      }
    }
    if (best) {
      best.hp -= dmg;
      best.hurtT = 0.3;
      best.state = "chase";
      const d = Math.max(0.01, bestD);
      best.x += ((best.x - this.pos.x) / d) * 0.6;
      best.z += ((best.z - this.pos.z) / d) * 0.6;
      this.play("hit");
      this.burst(best.x, best.y + 0.8, best.z, 0xd94848, 8, 3);
      if (best.hp <= 0) this.killAnimal(best);
      return true;
    }
    // no animal → chop the tree in front if holding an axe
    if (this.promptTarget?.kind === "node") {
      const nd = this.nodes[this.promptTarget.id];
      if (nd && (nd.type === "tree" || nd.type === "pine" || nd.type === "rock")) {
        if (nd.type !== "rock" && e !== "axe") return false;
        this.gatherNode(nd.id);
        return true;
      }
    }
    return false;
  }

  private killAnimal(a: Animal) {
    a.alive = false;
    a.hp = 0;
    a.deadT = 0;
    a.respawnAt = this.total + TUNING.boarRespawnSeconds;
    if (this.drops.size >= TUNING.maxDrops) {
      const oldest = [...this.drops.values()].sort((p, q) => p.data.expiresAt - q.data.expiresAt)[0];
      if (oldest) this.removeDrop(oldest.data.id);
    }
    this.spawnDropRT({ id: this.nextDropId++, item: "raw_meat", qty: 2, x: a.x, z: a.z, expiresAt: this.total + TUNING.dropLifetimeSeconds }, false);
    this.toast("Babi hutan dikalahkan! Ambil dagingnya.", "good", "raw_meat");
    this.markDirty();
  }

  private updateAnimals(dt: number, isNight: boolean) {
    const detect = isNight ? 13 : 10;
    for (const a of this.animals) {
      const rig = a.rig;
      if (!a.alive) {
        if (a.deadT < 1.5) {
          a.deadT += dt;
          rig.body.rotation.z = Math.min(HALF_PI, a.deadT * 4);
          rig.body.position.y = Math.min(0.3, a.deadT);
          if (a.deadT >= 1.5) rig.root.visible = false;
        } else {
          rig.root.visible = false;
        }
        if (this.total >= a.respawnAt && Math.hypot(a.homeX - this.pos.x, a.homeZ - this.pos.z) > 25) {
          a.alive = true;
          a.hp = TUNING.boarHp;
          a.x = a.homeX;
          a.z = a.homeZ;
          a.state = "wander";
          a.tx = a.x;
          a.tz = a.z;
          rig.body.rotation.set(0, 0, 0);
          rig.body.position.set(0, 0, 0);
          rig.root.visible = true;
        }
        continue;
      }
      // skip far-away animals except for a cheap idle (perf)
      const dxp = this.pos.x - a.x;
      const dzp = this.pos.z - a.z;
      const dPlayer = Math.hypot(dxp, dzp);
      const dHome = Math.hypot(a.x - a.homeX, a.z - a.homeZ);
      const visible = dPlayer < 90;
      rig.root.visible = visible;

      // state machine
      if (a.state === "wander") {
        if (!this.dead && dPlayer < detect && dHome < 22) a.state = "chase";
      } else if (a.state === "chase") {
        if (this.dead || dPlayer > 18 || dHome > 28) a.state = "return";
      } else if (a.state === "return") {
        if (dHome < 3) a.state = "wander";
        a.hp = Math.min(TUNING.boarHp, a.hp + dt * 4);
      }

      let tx = a.tx, tz = a.tz, speed = 1.3;
      if (a.state === "wander") {
        if (Math.hypot(a.tx - a.x, a.tz - a.z) < 0.6 || a.stuckT > 2.2) {
          const ang = Math.random() * Math.PI * 2;
          const r = 3 + Math.random() * 9;
          a.tx = clamp(a.homeX + Math.cos(ang) * r, -TUNING.playableHalf + 2, TUNING.playableHalf - 2);
          a.tz = clamp(a.homeZ + Math.sin(ang) * r, -TUNING.playableHalf + 2, TUNING.playableHalf - 2);
          a.stuckT = 0;
          a.lastX = a.x;
          a.lastZ = a.z;
        }
        tx = a.tx;
        tz = a.tz;
        // pause occasionally
        speed = (Math.sin(this.total * 0.7 + a.id * 3) > 0.55) ? 0 : 1.3;
      } else if (a.state === "chase") {
        tx = this.pos.x;
        tz = this.pos.z;
        speed = a.windup > 0 ? 0 : 4.9;
      } else {
        tx = a.homeX;
        tz = a.homeZ;
        speed = 3;
      }

      const dx = tx - a.x;
      const dz = tz - a.z;
      const d = Math.hypot(dx, dz);
      const stopDist = a.state === "chase" ? 1.35 : 0.2;
      a.speed = damp(a.speed, d > stopDist ? speed : 0, 6, dt);
      if (d > 0.01) {
        const targetRot = Math.atan2(dx, dz);
        a.rotY = angleLerp(a.rotY, targetRot, 1 - Math.exp(-8 * dt));
      }
      if (a.speed > 0.01) {
        a.x += Math.sin(a.rotY) * a.speed * dt;
        a.z += Math.cos(a.rotY) * a.speed * dt;
      }
      // collision
      for (let it = 0; it < 2; it++) {
        const list = this.colliders.query(a.x, a.z, 2);
        for (const c of list) {
          if (!c.enabled) continue;
          if (c.walkable) continue;
          if (c.yMax < a.y + 0.3 || c.yMin > a.y + 1) continue;
          if (resolveCircle(a.x, a.z, 0.55, c, this.outXZ)) {
            a.x = this.outXZ.x;
            a.z = this.outXZ.z;
          }
        }
      }
      // don't overlap the player
      const pd = Math.hypot(this.pos.x - a.x, this.pos.z - a.z);
      if (pd < 0.9 && pd > 0.001) {
        a.x = this.pos.x - ((this.pos.x - a.x) / pd) * 0.9;
        a.z = this.pos.z - ((this.pos.z - a.z) / pd) * 0.9;
      }
      a.x = clamp(a.x, -TUNING.playableHalf, TUNING.playableHalf);
      a.z = clamp(a.z, -TUNING.playableHalf, TUNING.playableHalf);
      a.y = this.groundHeight(a.x, a.z, a.y);

      // stuck detection
      if (a.state === "wander" && speed > 0) {
        a.stuckT += dt;
        if (Math.hypot(a.x - a.lastX, a.z - a.lastZ) > 1) {
          a.stuckT = 0;
          a.lastX = a.x;
          a.lastZ = a.z;
        }
      }

      // attack
      a.attackCd = Math.max(0, a.attackCd - dt);
      if (a.state === "chase" && !this.dead) {
        if (a.windup > 0) {
          a.windup -= dt;
          if (a.windup <= 0) {
            if (pd < 2.1 && Math.abs(this.pos.y - a.y) < 1.5) {
              this.damagePlayer(TUNING.boarDamage);
              const k = pd > 0.01 ? 1 / pd : 0;
              this.knockX = (this.pos.x - a.x) * k * 5;
              this.knockZ = (this.pos.z - a.z) * k * 5;
            }
            a.attackCd = 1.3;
          }
        } else if (pd < 1.75 && a.attackCd <= 0) {
          a.windup = 0.4;
        }
      }

      // visuals
      if (visible) {
        a.legPhase += dt * a.speed * 3.2;
        const sw = Math.sin(a.legPhase) * Math.min(1, a.speed / 2) * 0.7;
        rig.legs[0].rotation.x = sw;
        rig.legs[3].rotation.x = sw;
        rig.legs[1].rotation.x = -sw;
        rig.legs[2].rotation.x = -sw;
        rig.head.rotation.x = a.windup > 0 ? 0.45 : Math.sin(this.total * 2 + a.id) * 0.05;
        rig.body.position.z = a.windup > 0 ? -0.15 : 0;
        a.hurtT = Math.max(0, a.hurtT - dt);
        const flash = a.hurtT > 0 ? 0.6 : 0;
        for (const m of rig.materials) m.emissive.setRGB(flash, 0, 0);
        rig.root.position.set(a.x, a.y, a.z);
        rig.root.rotation.y = a.rotY;
      }
    }
  }

  // ═══ interaction ══════════════════════════════════════════════════════════
  private scanInteract() {
    let best: { kind: "node" | "drop" | "building"; id: number } | null = null;
    let bestScore = Infinity;
    const fx = Math.sin(this.rotY);
    const fz = Math.cos(this.rotY);
    const R = TUNING.interactRange;
    const consider = (kind: "node" | "drop" | "building", id: number, x: number, z: number, extra: number) => {
      const dx = x - this.pos.x;
      const dz = z - this.pos.z;
      const d = Math.hypot(dx, dz) - extra;
      if (d > R) return;
      const dot = d > 0.01 ? (dx * fx + dz * fz) / Math.max(0.01, Math.hypot(dx, dz)) : 1;
      const score = d - dot * 0.9;
      if (score < bestScore) {
        bestScore = score;
        best = { kind, id };
      }
    };
    const ix = Math.floor(this.pos.x / 6);
    const iz = Math.floor(this.pos.z / 6);
    for (let gx = ix - 1; gx <= ix + 1; gx++) {
      for (let gz = iz - 1; gz <= iz + 1; gz++) {
        const cell = this.nodeGrid.get(this.gridKey(gx, gz));
        if (!cell) continue;
        for (const id of cell) {
          if (!this.nodeAvailable(id)) continue;
          const nd = this.nodes[id];
          consider("node", id, nd.x, nd.z, nd.radius * 0.9);
        }
      }
    }
    for (const d of this.drops.values()) consider("drop", d.data.id, d.data.x, d.data.z, 0);
    let nearW = false;
    let nearF = false;
    let fireProx = 0;
    for (const b of this.buildings.values()) {
      const t = b.data.type;
      const dd = Math.hypot(b.data.x - this.pos.x, b.data.z - this.pos.z);
      if (t === "workbench" && dd < 6) nearW = true;
      if (t === "campfire") {
        if (dd < 4) nearF = true;
        fireProx = Math.max(fireProx, 1 - clamp(dd / 10, 0, 1));
      }
      if (t === "campfire" || t === "workbench" || t === "shelter" || t === "door") {
        consider("building", b.data.id, b.data.x, b.data.z, t === "shelter" ? 1 : t === "door" ? 0.3 : 0.5);
      }
    }
    this.nearWorkbench = nearW;
    this.nearCampfire = nearF;
    this.fireProximity = fireProx;
    this.promptTarget = best;
    this.prompt = this.describeTarget(best);
  }

  private describeTarget(t: { kind: "node" | "drop" | "building"; id: number } | null): Prompt | null {
    if (!t) return null;
    if (t.kind === "node") {
      const nd = this.nodes[t.id];
      const label = NODE_LABEL[nd.type];
      switch (nd.type) {
        case "tree":
        case "pine": {
          const left = nd.maxUses - this.nodeUses[t.id];
          return this.equipped === "axe"
            ? { title: label, action: `Tebang (${left}×)` }
            : { title: label, action: "Pegang Wooden Axe untuk menebang", disabled: true };
        }
        case "rock": return { title: label, action: "Ambil Stone" };
        case "bush": return { title: label, action: "Ambil Fiber & Leaves" };
        case "berry": return { title: label, action: "Petik Berries" };
        case "branch": return { title: label, action: "Ambil Wood" };
      }
    }
    if (t.kind === "drop") {
      const d = this.drops.get(t.id);
      if (!d) return null;
      return { title: `${ITEMS[d.data.item].name} ×${d.data.qty}`, action: "Ambil" };
    }
    const b = this.buildings.get(t.id);
    if (!b) return null;
    switch (b.data.type) {
      case "campfire":
        return this.countItem("raw_meat") > 0
          ? { title: "Campfire", action: "Masak Raw Meat" }
          : { title: "Campfire", action: "Hangat — memulihkan health", disabled: true };
      case "workbench": return { title: "Basic Workbench", action: "Buka Crafting" };
      case "shelter": return { title: "Simple Shelter", action: this.stamina < 99 || this.health < 100 ? "Istirahat" : "Sudah segar", disabled: !(this.stamina < 99 || this.health < 100) };
      case "door": return { title: "Wooden Door", action: b.data.open ? "Tutup Pintu" : "Buka Pintu" };
      default: return null;
    }
  }

  /** E / interact button */
  interact() {
    if (!this.started || this.dead || this.simPaused) return;
    if (this.buildType) {
      this.placeBuild();
      return;
    }
    if (this.actionT > 0) return;
    const t = this.promptTarget;
    if (!t) return;
    if (t.kind === "node") {
      const nd = this.nodes[t.id];
      if ((nd.type === "tree" || nd.type === "pine") && this.equipped !== "axe") {
        this.toast("Butuh Wooden Axe di tangan untuk menebang", "warn", "axe");
        this.play("error");
        return;
      }
      this.beginAction({ kind: "node", id: t.id }, nd.type === "tree" || nd.type === "pine" || nd.type === "rock" ? 0.55 : 0.45);
      return;
    }
    if (t.kind === "drop") {
      this.pickupDrop(t.id, false);
      return;
    }
    const b = this.buildings.get(t.id);
    if (!b) return;
    switch (b.data.type) {
      case "campfire":
        this.cook();
        break;
      case "workbench":
        this.opts.onEvent({ type: "open-craft" });
        break;
      case "shelter":
        if (this.stamina < 99 || this.health < 100) {
          this.stamina = 100;
          if (this.hunger > 25) this.health = clamp(this.health + 15, 0, 100);
          this.hunger = clamp(this.hunger - 4, 0, 100);
          this.play("craft");
          this.toast("Istirahat sejenak… stamina pulih", "good");
          this.markDirty();
        }
        break;
      case "door":
        this.toggleDoor(b.data.id);
        break;
    }
    this.emitSnapshot();
  }

  private cook() {
    if (this.countItem("raw_meat") <= 0) {
      this.toast("Tidak ada Raw Meat untuk dimasak", "info", "raw_meat");
      return;
    }
    const inv = this.cloneInv();
    SurvivalEngine.removeFrom(inv, "raw_meat", 1);
    if (SurvivalEngine.addTo(inv, "cooked_meat", 1) > 0) {
      this.toast("Inventaris penuh", "bad");
      return;
    }
    this.inventory = inv;
    this.bumpInv();
    this.play("craft");
    this.toast("Daging dimasak! +1 Cooked Meat", "good", "cooked_meat");
    this.markDirty();
  }

  /** Left click / attack button */
  attack() {
    if (!this.started || this.dead || this.simPaused) return;
    if (this.buildType) {
      this.placeBuild();
      return;
    }
    const e = this.equipped;
    if (e && ITEMS[e].food) {
      this.eat(this.hotbarIndex);
      return;
    }
    if (e && ITEMS[e].kind === "build") {
      this.startBuild(e as BuildType);
      return;
    }
    if (this.actionT > 0) return;
    if (this.stamina < 3) {
      this.toast("Stamina habis", "warn");
      return;
    }
    // face where the camera looks
    this.rotY = Math.atan2(-Math.sin(this.yaw), -Math.cos(this.yaw));
    this.beginAction({ kind: "attack" }, e === "spear" ? 0.5 : 0.45);
    this.stamina = Math.max(0, this.stamina - TUNING.staminaActionCost);
    this.staminaDelay = 0.6;
    this.play("swing");
  }

  private beginAction(p: PendingAction, dur: number) {
    this.pending = p;
    this.actionT = 0.0001;
    this.actionDur = dur;
    this.actionApplied = false;
    if (p && p.kind === "node") {
      const nd = this.nodes[p.id];
      this.rotY = Math.atan2(nd.x - this.pos.x, nd.z - this.pos.z);
    }
  }

  private updateAction(dt: number) {
    if (this.actionT <= 0) return;
    this.actionT += dt;
    const p = this.actionT / this.actionDur;
    if (!this.actionApplied && p >= 0.5) {
      this.actionApplied = true;
      const pend = this.pending;
      if (pend?.kind === "node") {
        // re-validate: still exists & still in range (prevents duplication)
        const nd = this.nodes[pend.id];
        if (nd && this.nodeAvailable(pend.id) && Math.hypot(nd.x - this.pos.x, nd.z - this.pos.z) - nd.radius < TUNING.interactRange + 0.6) {
          this.gatherNode(pend.id);
        }
      } else if (pend?.kind === "attack") {
        this.attackHit();
      }
    }
    if (p >= 1) {
      this.actionT = 0;
      this.pending = null;
      this.scanInteract();
    }
  }

  // ═══ main loop ════════════════════════════════════════════════════════════
  private get simPaused() {
    return !this.started || this.paused || this.uiBlocking;
  }

  private frame = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.fpsFrames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 1) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
    if (!this.simPaused) this.update(dt);
    else if (!this.started) this.yaw += dt * 0.06; // slow orbit behind the main menu
    this.updateCamera(dt);
    this.updateParticles(dt);
    this.renderer.render(this.scene, this.camera);
    this.snapTimer += dt;
    if (this.snapTimer > 0.1) {
      this.snapTimer = 0;
      this.emitSnapshot();
    }
  };

  private update(dt: number) {
    // time
    this.dayTime += dt / TUNING.dayLengthSeconds;
    if (this.dayTime >= 1) {
      this.dayTime -= 1;
      this.day += 1;
      this.toast(`Hari ke-${this.day} dimulai`, "info");
    }
    this.total += dt;
    if (!this.dead) this.survived += dt;

    this.updatePlayer(dt);
    this.updateAction(dt);
    const isNight = this.sunElevation() < -0.05;
    this.updateAnimals(dt, isNight);
    this.updateDrops(dt);

    this.scanTimer -= dt;
    if (this.scanTimer <= 0) {
      this.scanTimer = 0.1;
      this.scanInteract();
    }
    this.slowTimer -= dt;
    if (this.slowTimer <= 0) {
      this.slowTimer = 1;
      this.updateNodeRespawn();
    }
    this.lightTimer -= dt;
    if (this.lightTimer <= 0) {
      this.lightTimer = 0.25;
      this.assignFireLights();
    }
    this.updateDayNight(false);
    this.updateBuildingsAnim(dt);
    this.updateGhost();
    this.audio.update(dt, isNight, this.fireProximity);

    // held input repeats
    if (this.interactHeld || this.keys.has("KeyE")) {
      if (this.actionT <= 0 && this.promptTarget?.kind === "node") this.interact();
    }
    if ((this.attackHeld || this.mouseAttackHeld) && this.actionT <= 0 && !this.buildType) this.attack();

    // death sequence
    if (this.dead) {
      this.deadT += dt;
      if (this.deadT > 1.3 && !this.deadEmitted) {
        this.deadEmitted = true;
        this.opts.onEvent({ type: "dead" });
        void this.saveNow();
      }
    }

    // saving
    this.autosaveTimer += dt;
    if (this.autosaveTimer >= TUNING.autosaveSeconds) {
      this.autosaveTimer = 0;
      void this.saveNow();
    }
    if (this.dirtyTimer > 0) {
      this.dirtyTimer -= dt;
      if (this.dirtyTimer <= 0) {
        this.dirtyTimer = -1;
        void this.saveNow();
      }
    }
  }

  private mouseAttackHeld = false;

  private updatePlayer(dt: number) {
    this.eatCd = Math.max(0, this.eatCd - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);

    // ── input → desired move
    let ix = 0, iy = 0;
    if (!this.dead) {
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) iy += 1;
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) iy -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) ix += 1;
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) ix -= 1;
      ix += this.touchMove.x;
      iy += this.touchMove.y;
    }
    let len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
      len = 1;
    }
    const fwdX = -Math.sin(this.yaw), fwdZ = -Math.cos(this.yaw);
    const rgtX = Math.cos(this.yaw), rgtZ = -Math.sin(this.yaw);
    const mx = fwdX * iy + rgtX * ix;
    const mz = fwdZ * iy + rgtZ * ix;

    const wantsRun = (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.touchSprint) && len > 0.2;
    if (this.stamina <= 0.5) this.exhausted = true;
    if (this.exhausted && this.stamina > 20) this.exhausted = false;
    const running = wantsRun && !this.exhausted && this.grounded;
    const acting = this.actionT > 0;
    const targetSpeed = len * (running ? TUNING.runSpeed : TUNING.walkSpeed) * (acting ? 0.45 : 1);
    this.moveSpeed = damp(this.moveSpeed, targetSpeed, this.grounded ? 12 : 3, dt);

    // ── stamina
    if (running && len > 0.2) {
      this.stamina = Math.max(0, this.stamina - TUNING.staminaRunCost * dt);
      this.staminaDelay = 0.7;
    } else {
      this.staminaDelay -= dt;
      if (this.staminaDelay <= 0) this.stamina = Math.min(100, this.stamina + TUNING.staminaRegen * dt * (len > 0.2 ? 0.6 : 1));
    }

    // ── hunger & health
    if (!this.dead) {
      this.hunger = Math.max(0, this.hunger - TUNING.hungerPerSecond * dt * (running ? 1.6 : 1));
      if (this.hunger <= 0) {
        this.health = Math.max(0, this.health - TUNING.starveDamagePerSecond * dt);
        if (this.health <= 0) this.die();
      } else if (this.total - this.lastHurt > 4) {
        let regen = this.hunger > 50 ? TUNING.regenPerSecond : 0;
        if (this.nearCampfire) regen += TUNING.campfireRegenPerSecond;
        this.health = Math.min(100, this.health + regen * dt);
      }
    }

    // ── facing
    if (len > 0.15 && !acting) {
      const target = Math.atan2(mx, mz);
      this.rotY = angleLerp(this.rotY, target, 1 - Math.exp(-14 * dt));
    }

    // ── horizontal motion
    let nx = this.pos.x, nz = this.pos.z;
    if (len > 0.01) {
      const ml = Math.hypot(mx, mz) || 1;
      nx += (mx / ml) * this.moveSpeed * dt;
      nz += (mz / ml) * this.moveSpeed * dt;
    }
    nx += this.knockX * dt;
    nz += this.knockZ * dt;
    this.knockX = damp(this.knockX, 0, 8, dt);
    this.knockZ = damp(this.knockZ, 0, 8, dt);
    const H = TUNING.playableHalf;
    this.pos.x = clamp(nx, -H, H);
    this.pos.z = clamp(nz, -H, H);
    this.collidePlayer();

    // ── vertical
    if (this.jumpQueued && this.grounded && !this.dead && !acting) {
      if (this.stamina >= TUNING.staminaJumpCost) {
        this.velY = TUNING.jumpVelocity;
        this.grounded = false;
        this.stamina -= TUNING.staminaJumpCost;
        this.staminaDelay = 0.7;
      }
    }
    this.jumpQueued = false;
    const ground = this.groundHeight(this.pos.x, this.pos.z, this.pos.y);
    this.velY -= TUNING.gravity * dt;
    let ny = this.pos.y + this.velY * dt;
    if (ny <= ground) {
      ny = ground;
      this.velY = 0;
      this.grounded = true;
    } else if (this.grounded && this.velY <= 0 && ny - ground < 0.45) {
      ny = ground; // stick to slopes / step down
      this.velY = 0;
    } else {
      this.grounded = false;
    }
    this.pos.y = ny;

    // ── footsteps
    if (this.grounded && this.moveSpeed > 1) {
      this.stepTimer -= dt * this.moveSpeed;
      if (this.stepTimer <= 0) {
        this.stepTimer = 2.1;
        this.play("step");
      }
    }

    this.animatePlayer(dt, running);
  }

  private collidePlayer() {
    for (let it = 0; it < 3; it++) {
      let hit = false;
      const list = this.colliders.query(this.pos.x, this.pos.z, 2.2);
      for (const c of list) {
        if (!c.enabled) continue;
        if (c.yMax <= this.pos.y + (c.walkable ? STEP : 0.05) || c.yMin >= this.pos.y + PLAYER_H) continue;
        if (resolveCircle(this.pos.x, this.pos.z, PLAYER_R, c, this.outXZ)) {
          this.pos.x = this.outXZ.x;
          this.pos.z = this.outXZ.z;
          hit = true;
        }
      }
      if (!hit) break;
    }
  }

  private animatePlayer(dt: number, running: boolean) {
    const r = this.rig;
    r.root.position.copy(this.pos);
    r.root.rotation.y = this.rotY;
    if (this.dead) {
      const t = Math.min(1, this.deadT / 0.7);
      r.body.rotation.x = -t * HALF_PI;
      r.body.position.y = t * 0.18;
      r.armL.rotation.x = r.armR.rotation.x = -t * 2.6;
      r.legL.rotation.x = r.legR.rotation.x = 0;
      return;
    }
    r.body.position.y = 0;
    const sp = this.moveSpeed;
    this.animPhase += dt * (2 + sp * 1.55);
    const k = Math.min(1, sp / 4);
    const sw = Math.sin(this.animPhase);
    let legL = sw * 0.85 * k;
    let legR = -sw * 0.85 * k;
    let armL = -sw * 0.7 * k;
    let armR = sw * 0.7 * k;
    let lean = running ? 0.14 : sp > 0.5 ? 0.04 : 0;
    if (!this.grounded) {
      legL = -0.6;
      legR = 0.35;
      armL = -0.9;
      armR = -0.9;
    }
    if (sp < 0.3 && this.grounded) {
      const br = Math.sin(performance.now() * 0.002) * 0.04;
      armL = br;
      armR = -br;
      r.body.position.y = Math.sin(performance.now() * 0.002) * 0.008;
    }
    if (this.actionT > 0) {
      const p = clamp(this.actionT / this.actionDur, 0, 1);
      const e = this.equipped;
      if (e === "spear") {
        armR = p < 0.4 ? -1.3 + p * 0.5 : p < 0.6 ? -1.6 : -1.6 + (p - 0.6) * 4;
        r.hand.position.z = p > 0.35 && p < 0.65 ? 0.35 : 0.02;
      } else {
        armR = p < 0.4 ? -(p / 0.4) * 2.7 : p < 0.65 ? -2.7 + ((p - 0.4) / 0.25) * 3.4 : 0.7 - ((p - 0.65) / 0.35) * 0.7;
      }
      lean = 0.1;
    } else {
      r.hand.position.z = 0.02;
    }
    if (this.equipped === "spear" && this.actionT <= 0) armR = Math.min(armR, -0.25);
    const hurt = this.hurtT / 0.35;
    r.body.rotation.x = lean - hurt * 0.25;
    r.body.rotation.z = 0;
    const lerp = 1 - Math.exp(-18 * dt);
    r.legL.rotation.x += (legL - r.legL.rotation.x) * lerp;
    r.legR.rotation.x += (legR - r.legR.rotation.x) * lerp;
    r.armL.rotation.x += (armL - r.armL.rotation.x) * lerp;
    r.armR.rotation.x = this.actionT > 0 ? armR : r.armR.rotation.x + (armR - r.armR.rotation.x) * lerp;
    for (const m of r.materials) m.emissive.setRGB(hurt * 0.55, 0, 0);
  }

  private updateDrops(dt: number) {
    const t = this.total;
    for (const d of [...this.drops.values()]) {
      if (t >= d.data.expiresAt) {
        this.removeDrop(d.data.id);
        continue;
      }
      d.mesh.rotation.y += dt * 1.5;
      d.mesh.position.y = this.groundHeight(d.data.x, d.data.z, this.pos.y + 2) + 0.05 + Math.sin(t * 3 + d.data.id) * 0.06;
      const dist = Math.hypot(d.data.x - this.pos.x, d.data.z - this.pos.z);
      if (d.lockUntilAway) {
        if (dist > 2.2) d.lockUntilAway = false;
      } else if (dist < 1.1 && !this.dead) {
        this.pickupDrop(d.data.id, true);
      }
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.vel.y -= 9 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 5;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.min(1, p.life * 2));
      if (p.life <= 0) p.mesh.visible = false;
    }
  }

  private updateBuildingsAnim(dt: number) {
    const t = this.total;
    for (const b of this.buildings.values()) {
      if (b.flame) {
        const f = 1 + Math.sin(t * 13 + b.data.id) * 0.12 + Math.sin(t * 7.3) * 0.08;
        b.flame.scale.set(1, f, 1);
        b.flame.rotation.y += dt * 2;
      }
      if (b.panel) {
        const target = b.data.open ? 1 : 0;
        b.openAmt = damp(b.openAmt, target, 10, dt);
        b.panel.rotation.y = -b.openAmt * HALF_PI * 1.1;
      }
    }
  }

  private assignFireLights() {
    const fires: { b: BuildingRT; d: number }[] = [];
    for (const b of this.buildings.values()) {
      if (b.data.type !== "campfire") continue;
      fires.push({ b, d: Math.hypot(b.data.x - this.pos.x, b.data.z - this.pos.z) });
    }
    fires.sort((a, c) => a.d - c.d);
    const night = 1 - smoothstep(-0.2, 0.25, this.sunElevation());
    for (let i = 0; i < this.fireLights.length; i++) {
      const l = this.fireLights[i];
      const f = fires[i];
      if (f && f.d < 45) {
        l.position.set(f.b.data.x, f.b.data.y + 1.1, f.b.data.z);
        l.intensity = 6 + night * 26;
      } else {
        l.intensity = 0;
      }
    }
  }

  // ═══ day / night ══════════════════════════════════════════════════════════
  private sunElevation() {
    return Math.sin((this.dayTime - 0.25) * Math.PI * 2);
  }

  private updateDayNight(force: boolean) {
    const elev = this.sunElevation();
    const dayF = smoothstep(-0.18, 0.3, elev);
    const warm = clamp(1 - Math.abs(elev) / 0.3, 0, 1);
    const night = new THREE.Color(0x0e1630);
    const dayC = new THREE.Color(0x9fd0ff);
    const warmC = new THREE.Color(0xf2a466);
    this.skyColor.copy(night).lerp(dayC, dayF).lerp(warmC, warm * 0.5);
    if (force || !(this.scene.background instanceof THREE.Color)) this.scene.background = new THREE.Color();
    (this.scene.background as THREE.Color).copy(this.skyColor);
    (this.scene.fog as THREE.Fog).color.copy(this.skyColor);

    this.hemi.intensity = 0.55 + dayF * 0.95;
    this.hemi.color.setRGB(0.55 + dayF * 0.3, 0.62 + dayF * 0.28, 0.85 + dayF * 0.1);
    this.hemi.groundColor.setRGB(0.22 + dayF * 0.1, 0.26 + dayF * 0.1, 0.2);

    const ang = (this.dayTime - 0.25) * Math.PI * 2;
    const sunUp = elev > 0;
    const dir = sunUp ? 1 : -1;
    this.sun.position.set(
      this.pos.x + Math.cos(ang) * 50 * dir,
      this.pos.y + Math.abs(Math.sin(ang)) * 60 + 8,
      this.pos.z + 22,
    );
    this.sun.target.position.copy(this.pos);
    if (sunUp) {
      this.sun.intensity = 0.4 + smoothstep(0, 0.35, elev) * 2.0;
      this.sun.color.setRGB(1, 0.85 + dayF * 0.12 - warm * 0.15, 0.7 + dayF * 0.2 - warm * 0.25);
    } else {
      this.sun.intensity = 0.45 * smoothstep(0, 0.3, -elev);
      this.sun.color.setRGB(0.6, 0.7, 1);
    }
    if (this.stars) (this.stars.material as THREE.PointsMaterial).opacity = clamp(1 - dayF * 1.6, 0, 1) * 0.9;
  }

  // ═══ camera ═══════════════════════════════════════════════════════════════
  private updateCamera(dt: number) {
    // apply look input
    const sens = this.settings.sensitivity;
    if (this.lookAccum.x !== 0 || this.lookAccum.y !== 0) {
      this.yaw -= this.lookAccum.x * 0.0032 * sens;
      this.pitch += this.lookAccum.y * 0.0028 * sens * (this.settings.invertY ? -1 : 1);
      this.pitch = clamp(this.pitch, -0.25, 1.15);
      this.lookAccum.x = 0;
      this.lookAccum.y = 0;
    }
    const tx = this.pos.x, ty = this.pos.y + 1.55, tz = this.pos.z;
    const k = 1 - Math.exp(-16 * dt);
    this.camTarget.x += (tx - this.camTarget.x) * k;
    this.camTarget.y += (ty - this.camTarget.y) * (1 - Math.exp(-10 * dt));
    this.camTarget.z += (tz - this.camTarget.z) * k;
    if (Math.abs(tx - this.camTarget.x) > 6 || Math.abs(tz - this.camTarget.z) > 6) this.camTarget.set(tx, ty, tz);

    const cp = Math.cos(this.pitch);
    const ox = Math.sin(this.yaw) * cp;
    const oy = Math.sin(this.pitch);
    const oz = Math.cos(this.yaw) * cp;
    const desired = this.dist;
    const hitDist = this.cameraObstruction(this.camTarget, ox, oy, oz, desired);
    const target = Math.min(desired, hitDist);
    if (target < this.curDist) this.curDist = target;
    else this.curDist = damp(this.curDist, target, 4, dt);

    let cx = this.camTarget.x + ox * this.curDist;
    let cy = this.camTarget.y + oy * this.curDist;
    let cz = this.camTarget.z + oz * this.curDist;
    const minY = this.terrain.heightAt(cx, cz) + 0.35;
    if (cy < minY) cy = minY;
    const lim = TUNING.worldHalf - 1;
    cx = clamp(cx, -lim, lim);
    cz = clamp(cz, -lim, lim);
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.camTarget);
    if (this.stars) this.stars.position.copy(this.camera.position);
  }

  /** Distance along the camera ray until the first obstruction (trees, buildings, terrain). */
  private cameraObstruction(o: THREE.Vector3, dx: number, dy: number, dz: number, maxD: number) {
    let best = maxD;
    const mx = o.x + dx * maxD * 0.5;
    const mz = o.z + dz * maxD * 0.5;
    const list = this.colliders.query(mx, mz, maxD * 0.5 + 1.5);
    for (const c of list) {
      if (!c.enabled || c.walkable || c.tag === "pond") continue;
      let t = Infinity;
      if (c.kind === "circle") {
        // 2D ray/circle in XZ
        const fx = o.x - c.x, fz = o.z - c.z;
        const a = dx * dx + dz * dz;
        if (a < 1e-6) continue;
        const b = 2 * (fx * dx + fz * dz);
        const cc = fx * fx + fz * fz - (c.r + 0.15) ** 2;
        const disc = b * b - 4 * a * cc;
        if (disc < 0) continue;
        const t0 = (-b - Math.sqrt(disc)) / (2 * a);
        if (t0 < 0) continue;
        const yy = o.y + dy * t0;
        if (yy < c.yMin || yy > Math.min(c.yMax, o.y + 6)) continue;
        t = t0;
      } else {
        // slab test
        let tmin = 0, tmax = maxD;
        const axes: [number, number, number, number][] = [
          [o.x, dx, c.x - c.hx - 0.1, c.x + c.hx + 0.1],
          [o.y, dy, c.yMin, c.yMax + 0.1],
          [o.z, dz, c.z - c.hz - 0.1, c.z + c.hz + 0.1],
        ];
        let ok = true;
        for (const [p, d, lo, hi] of axes) {
          if (Math.abs(d) < 1e-6) {
            if (p < lo || p > hi) { ok = false; break; }
          } else {
            let t1 = (lo - p) / d, t2 = (hi - p) / d;
            if (t1 > t2) [t1, t2] = [t2, t1];
            tmin = Math.max(tmin, t1);
            tmax = Math.min(tmax, t2);
            if (tmin > tmax) { ok = false; break; }
          }
        }
        if (!ok) continue;
        if (tmin <= 0.05) continue; // target inside (e.g. standing in a doorway) → ignore
        t = tmin;
      }
      if (t < best) best = t;
    }
    // terrain sampling
    for (let s = 1; s <= 6; s++) {
      const t = (best * s) / 6;
      const h = this.terrain.heightAt(o.x + dx * t, o.z + dz * t);
      if (o.y + dy * t < h + 0.25) {
        best = Math.max(1.2, t - best / 6);
        break;
      }
    }
    return Math.max(1.2, best - 0.25);
  }

  // ═══ build ghost ══════════════════════════════════════════════════════════
  private updateGhost() {
    if (!this.buildType || !this.ghost) {
      this.buildCandidate = null;
      return;
    }
    const c = this.computeCandidate();
    this.buildCandidate = c;
    if (!c) return;
    this.ghost.visible = true;
    this.ghost.position.set(c.x, c.y, c.z);
    const t = this.buildType;
    this.ghost.rotation.y = t === "wall" ? (c.rot % 2) * HALF_PI : t === "floor" || t === "roof" ? 0 : c.rot * HALF_PI;
    this.ghostMat.color.setHex(c.valid ? 0x4ade80 : 0xf87171);
  }

  // ═══ input ════════════════════════════════════════════════════════════════
  private onKeyDown = (e: KeyboardEvent) => {
    const tgt = e.target as HTMLElement | null;
    if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)) return;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    if (this.simPaused || this.dead) return;
    if (e.repeat && this.keys.has(e.code)) return;
    this.keys.add(e.code);
    switch (e.code) {
      case "Space":
        this.jumpQueued = true;
        break;
      case "KeyE":
      case "KeyF":
        this.interact();
        break;
      case "KeyR":
        if (this.buildType) this.rotateBuild();
        break;
      case "KeyQ":
      case "KeyX":
        if (this.buildType) this.cancelBuild();
        break;
      case "Digit1": case "Digit2": case "Digit3": case "Digit4": case "Digit5":
        this.selectHotbar(Number(e.code.slice(5)) - 1);
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onBlur = () => this.clearInput();

  private clearInput() {
    this.keys.clear();
    this.touchMove.x = this.touchMove.y = 0;
    this.touchSprint = false;
    this.interactHeld = false;
    this.attackHeld = false;
    this.mouseAttackHeld = false;
    this.jumpQueued = false;
    this.mouseDrag.active = false;
  }

  private get canLock() {
    return typeof document !== "undefined" && "pointerLockElement" in document && !this.opts.isTouch;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (this.simPaused || this.dead) return;
    if (e.button === 2) {
      if (this.buildType) this.cancelBuild();
      return;
    }
    if (e.button !== 0) return;
    if (this.canLock && !this.pointerLocked) {
      this.requestLock();
      return;
    }
    if (!this.canLock) {
      this.mouseDrag = { active: true, moved: 0, x: e.clientX, y: e.clientY };
      return;
    }
    if (this.buildType) {
      this.placeBuild();
      return;
    }
    this.mouseAttackHeld = true;
    this.attack();
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (e.button === 0) {
      this.mouseAttackHeld = false;
      if (this.mouseDrag.active) {
        const click = this.mouseDrag.moved < 6;
        this.mouseDrag.active = false;
        if (click && !this.simPaused) {
          if (this.buildType) this.placeBuild();
          else this.attack();
        }
      }
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.simPaused) return;
    if (this.pointerLocked) {
      // ignore absurd spikes some browsers emit right after locking
      if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return;
      this.lookAccum.x += e.movementX;
      this.lookAccum.y += e.movementY;
    } else if (this.mouseDrag.active) {
      const dx = e.clientX - this.mouseDrag.x;
      const dy = e.clientY - this.mouseDrag.y;
      this.mouseDrag.x = e.clientX;
      this.mouseDrag.y = e.clientY;
      this.mouseDrag.moved += Math.abs(dx) + Math.abs(dy);
      this.lookAccum.x += dx;
      this.lookAccum.y += dy;
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (this.simPaused) return;
    e.preventDefault();
    this.dist = clamp(this.dist + Math.sign(e.deltaY) * 0.6, 2.5, 10);
  };

  private onContextMenu = (e: Event) => e.preventDefault();

  private onLockChange = () => {
    const locked = document.pointerLockElement === this.renderer.domElement;
    const wasLocked = this.pointerLocked;
    this.pointerLocked = locked;
    if (wasLocked && !locked) {
      this.clearInput();
      if (!this.expectUnlock && this.started && !this.uiBlocking && !this.paused && !this.dead) {
        this.opts.onEvent({ type: "pause-request" });
      }
      this.expectUnlock = false;
    }
    this.emitSnapshot();
  };

  requestLock() {
    if (!this.canLock) return;
    try {
      const p = this.renderer.domElement.requestPointerLock() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* unsupported → drag fallback */
    }
  }

  private releaseLock() {
    if (this.pointerLocked) {
      this.expectUnlock = true;
      try {
        document.exitPointerLock();
      } catch {
        /* ignore */
      }
    }
  }

  private onResize = () => this.resize();

  private bindEvents() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    const c = this.renderer.domElement;
    c.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("mousemove", this.onMouseMove);
    c.addEventListener("wheel", this.onWheel, { passive: false });
    c.addEventListener("contextmenu", this.onContextMenu);
    document.addEventListener("pointerlockchange", this.onLockChange);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(this.container);
    }
    window.addEventListener("resize", this.onResize);
  }

  private unbindEvents() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    const c = this.renderer.domElement;
    c.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    c.removeEventListener("wheel", this.onWheel);
    c.removeEventListener("contextmenu", this.onContextMenu);
    document.removeEventListener("pointerlockchange", this.onLockChange);
    this.resizeObs?.disconnect();
    window.removeEventListener("resize", this.onResize);
  }

  // ── touch API (called by the React overlay) ──
  setMove(x: number, y: number) {
    this.touchMove.x = clamp(x, -1, 1);
    this.touchMove.y = clamp(y, -1, 1);
  }
  addLook(dx: number, dy: number) {
    if (this.simPaused) return;
    this.lookAccum.x += dx * 1.4;
    this.lookAccum.y += dy * 1.4;
  }
  setSprint(on: boolean) {
    this.touchSprint = on;
  }
  jump() {
    if (!this.simPaused) this.jumpQueued = true;
  }
  setInteractHeld(on: boolean) {
    this.interactHeld = on;
    if (on) this.interact();
  }
  setAttackHeld(on: boolean) {
    this.attackHeld = on;
    if (on) this.attack();
  }
  zoom(delta: number) {
    this.dist = clamp(this.dist + delta, 2.5, 10);
  }

  // ═══ lifecycle / control ══════════════════════════════════════════════════
  start() {
    this.started = true;
    this.audio.unlock();
    this.audio.setEnabled(this.settings.audio, this.settings.volume);
    this.camTarget.set(this.pos.x, this.pos.y + 1.55, this.pos.z);
    if (this.dead && !this.deadEmitted) this.deadT = 2;
    this.emitSnapshot();
  }

  /** Unlock audio from a user gesture (e.g. menu buttons). */
  unlockAudio() {
    this.audio.unlock();
    this.audio.setEnabled(this.settings.audio, this.settings.volume);
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (p) {
      this.clearInput();
      this.releaseLock();
    }
    this.emitSnapshot();
  }

  setUiBlocking(b: boolean) {
    this.uiBlocking = b;
    if (b) {
      this.clearInput();
      this.releaseLock();
    }
    this.emitSnapshot();
  }

  setHidden(h: boolean) {
    if (h === this.hidden) return;
    this.hidden = h;
    if (h) {
      cancelAnimationFrame(this.raf);
      this.clearInput();
      this.audio.suspend();
    } else if (!this.disposed) {
      this.audio.resume();
      this.lastFrame = performance.now();
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  applySettings(s: GameSettings) {
    const qualityChanged = s.quality !== this.settings.quality;
    this.settings = { ...s };
    this.audio.setEnabled(s.audio, s.volume);
    if (qualityChanged) {
      const high = s.quality === "high";
      this.renderer.shadowMap.enabled = high;
      this.sun.castShadow = high;
      this.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (!m) return;
        if (Array.isArray(m)) m.forEach((x) => (x.needsUpdate = true));
        else m.needsUpdate = true;
      });
      this.applyPixelRatio();
      this.applyGrassDensity();
      this.resize();
    }
  }

  private applyPixelRatio() {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const cap = this.opts.isTouch
      ? (this.settings.quality === "high" ? 1.5 : 1)
      : (this.settings.quality === "high" ? 1.75 : 1);
    this.renderer.setPixelRatio(Math.min(dpr, cap));
  }

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1 ? 75 : 62;
    this.camera.updateProjectionMatrix();
  }

  private play(s: Sfx) {
    this.audio.play(s);
  }

  private toast(text: string, tone: "info" | "good" | "warn" | "bad", item?: ItemId) {
    this.opts.onEvent({ type: "toast", text, tone, item });
  }

  private lastInvVersionSent = -1;
  private lastInvCopy: (InvSlot | null)[] = [];

  private emitSnapshot() {
    if (this.disposed) return;
    if (this.lastInvVersionSent !== this.invVersion) {
      this.lastInvCopy = this.inventory.map((s) => (s ? { ...s } : null));
      this.lastInvVersionSent = this.invVersion;
    }
    const hours = Math.floor(this.dayTime * 24);
    const mins = Math.floor((this.dayTime * 24 - hours) * 60);
    const b = this.buildCandidate;
    this.opts.onSnapshot({
      health: this.health,
      hunger: this.hunger,
      stamina: this.stamina,
      inventory: this.lastInvCopy,
      invVersion: this.invVersion,
      hotbarIndex: this.hotbarIndex,
      equipped: this.equipped,
      prompt: this.buildType ? null : this.prompt,
      build: this.buildType
        ? {
            type: this.buildType,
            valid: b ? b.valid : false,
            reason: b ? b.reason : "",
            have: this.countItem(this.buildType),
            canCraft: this.canCraftDirect(this.buildType),
          }
        : null,
      dayTime: this.dayTime,
      day: this.day,
      clock: `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
      isNight: this.sunElevation() < -0.05,
      survived: this.survived,
      deaths: this.deaths,
      saveStatus: this.saveStatus,
      dead: this.dead,
      fps: this.fps,
      pointerLocked: this.pointerLocked,
      nearWorkbench: this.nearWorkbench || this.isNearWorkbench(),
      nearCampfire: this.nearCampfire,
      hurtAt: this.hurtAt,
      started: this.started,
    });
  }

  /** Read-only debug info (used by automated tests). */
  debugState() {
    return {
      pos: { x: this.pos.x, y: this.pos.y, z: this.pos.z },
      ground: this.terrain.heightAt(this.pos.x, this.pos.z),
      yaw: this.yaw,
      rotY: this.rotY,
      health: this.health,
      hunger: this.hunger,
      stamina: this.stamina,
      inventory: this.inventory.map((s) => (s ? { ...s } : null)),
      buildings: [...this.buildings.values()].map((b) => ({ ...b.data })),
      animals: this.animals.map((a) => ({ id: a.id, x: a.x, z: a.z, alive: a.alive, state: a.state, hp: a.hp })),
      drops: [...this.drops.values()].map((d) => ({ ...d.data })),
      prompt: this.prompt,
      dayTime: this.dayTime,
      total: this.total,
      dead: this.dead,
      paused: this.simPaused,
      fps: this.fps,
      nodes: this.nodes.length,
      camera: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z, dist: this.curDist },
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
  }

  /** Test hook: teleport (keeps collision rules). */
  debugTeleport(x: number, z: number) {
    this.pos.x = clamp(x, -TUNING.playableHalf, TUNING.playableHalf);
    this.pos.z = clamp(z, -TUNING.playableHalf, TUNING.playableHalf);
    this.collidePlayer();
    this.pos.y = this.groundHeight(this.pos.x, this.pos.z, this.pos.y + 50);
    this.camTarget.set(this.pos.x, this.pos.y + 1.55, this.pos.z);
  }

  /** Test hook: face a world point with the camera. */
  debugLookAt(x: number, z: number) {
    const dx = x - this.pos.x, dz = z - this.pos.z;
    this.yaw = Math.atan2(-dx, -dz);
    this.rotY = Math.atan2(dx, dz);
  }

  debugNearestNode(type: string) {
    let best: NodeDef | null = null;
    let bd = Infinity;
    for (const n of this.nodes) {
      if (n.type !== type || !this.nodeAvailable(n.id)) continue;
      const d = Math.hypot(n.x - this.pos.x, n.z - this.pos.z);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best ? { id: best.id, x: best.x, z: best.z, r: best.radius } : null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.releaseLock();
    this.unbindEvents();
    this.audio.dispose();
    for (const g of this.geoCache.values()) g.dispose();
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch {
        /* ignore */
      }
    }
    const disposeObj = (o: THREE.Object3D) => {
      o.traverse((x) => {
        const m = x as THREE.Mesh;
        if (m.isMesh) {
          if (m.geometry && !this.geoCache.has("") ) m.geometry.dispose();
          const mat = m.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((q) => q.dispose());
          else mat?.dispose();
        }
      });
    };
    disposeObj(this.rig.root);
    for (const a of this.animals) disposeObj(a.rig.root);
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}

