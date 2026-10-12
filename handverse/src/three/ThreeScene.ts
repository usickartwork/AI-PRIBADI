import * as THREE from "three";
import { CoordinateMapper } from "../lib/coordinateMapper";
import type { GestureResult } from "../lib/gestureRecognizer";
import { OrbExperiment } from "./OrbExperiment";
import { ParticleExperiment } from "./ParticleExperiment";
import { HologramExperiment } from "./HologramExperiment";

export type ExperimentType = "orb" | "particles" | "hologram";

export class ThreeScene {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private mapper: CoordinateMapper;

  // Experiments
  private orbExp: OrbExperiment;
  private particleExp: ParticleExperiment;
  private hologramExp: HologramExperiment;
  private currentExpType: ExperimentType = "orb";

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;

  private isMirrored = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Initialize WebGLRenderer with alpha transparency for camera overlay
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });
    this.renderer.setClearColor(0x000000, 0); // 100% transparent background
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();

    // Perspective Camera: FOV 50 deg, camera at z = 5.0
    const aspect = canvas.clientWidth / (canvas.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 5.0);
    this.camera.lookAt(0, 0, 0);

    this.mapper = new CoordinateMapper(this.camera, this.isMirrored);

    // Common Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(2, 4, 3);
    this.scene.add(this.dirLight);

    // Instantiate 3 Experiments
    this.orbExp = new OrbExperiment();
    this.particleExp = new ParticleExperiment();
    this.hologramExp = new HologramExperiment();

    // Default to Orb
    this.setExperiment("orb");
  }

  public setMirrored(mirrored: boolean): void {
    this.isMirrored = mirrored;
    this.mapper.setMirrored(mirrored);
  }

  public setExperiment(type: ExperimentType): void {
    this.currentExpType = type;

    // Remove all from scene
    this.scene.remove(this.orbExp.group);
    this.scene.remove(this.particleExp.group);
    this.scene.remove(this.hologramExp.group);

    // Attach active experiment
    if (type === "orb") {
      this.scene.add(this.orbExp.group);
    } else if (type === "particles") {
      this.scene.add(this.particleExp.group);
    } else if (type === "hologram") {
      this.scene.add(this.hologramExp.group);
    }
  }

  public getExperiment(): ExperimentType {
    return this.currentExpType;
  }

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public render(delta: number, time: number, gesture: GestureResult | null): void {
    if (this.currentExpType === "orb") {
      this.orbExp.update(delta, time, gesture, this.mapper);
    } else if (this.currentExpType === "particles") {
      this.particleExp.update(delta, time, gesture, this.mapper);
    } else if (this.currentExpType === "hologram") {
      this.hologramExp.update(delta, time, gesture, this.mapper);
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.orbExp.dispose();
    this.particleExp.dispose();
    this.hologramExp.dispose();
    this.renderer.dispose();
  }
}
