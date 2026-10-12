import * as THREE from "three";
import type { GestureResult } from "../gestureRecognizer";
import { SmoothFilter3D } from "../handSmoothing";
import type { CoordinateMapper } from "../coordinateMapper";

export class ParticleExperiment {
  public group = new THREE.Group();
  private points: THREE.Points;
  private particleCount = 1000;
  private positions: Float32Array;
  private velocities: Float32Array;
  private homePositions: Float32Array;
  private colors: Float32Array;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  private posFilter = new SmoothFilter3D(0.3);
  private currentMode: "idle" | "open" | "fist" | "pinch" = "idle";
  private expansionFactor = 1.0;
  private targetExpansion = 1.0;

  constructor() {
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.homePositions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);

    const color1 = new THREE.Color(0x00f2fe);
    const color2 = new THREE.Color(0x7928ca);
    const color3 = new THREE.Color(0xff0080);

    for (let i = 0; i < this.particleCount; i++) {
      // Golden spiral distribution on sphere
      const phi = Math.acos(1 - (2 * (i + 0.5)) / this.particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 0.8 + Math.random() * 0.4;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      this.homePositions[i * 3] = x;
      this.homePositions[i * 3 + 1] = y;
      this.homePositions[i * 3 + 2] = z;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      this.velocities[i * 3] = 0;
      this.velocities[i * 3 + 1] = 0;
      this.velocities[i * 3 + 2] = 0;

      // Color gradient
      const t = i / this.particleCount;
      const c = t < 0.5 ? color1.clone().lerp(color2, t * 2) : color2.clone().lerp(color3, (t - 0.5) * 2);
      this.colors[i * 3] = c.r;
      this.colors[i * 3 + 1] = c.g;
      this.colors[i * 3 + 2] = c.b;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);
  }

  public update(
    delta: number,
    time: number,
    gesture: GestureResult | null,
    mapper: CoordinateMapper
  ): void {
    let handPos = { x: 0, y: 0, z: 0 };
    let hasHand = false;

    if (gesture && gesture.confidence > 0.4) {
      hasHand = true;
      const worldPos = mapper.toWorld(gesture.palmCenter, 0);
      handPos = this.posFilter.update(worldPos);

      if (gesture.gesture === "Open Palm") {
        this.currentMode = "open";
        this.targetExpansion = 2.4; // Explode outward
      } else if (gesture.gesture === "Fist") {
        this.currentMode = "fist";
        this.targetExpansion = 0.25; // Compress into tight core
      } else if (gesture.gesture === "Pinch") {
        this.currentMode = "pinch";
        this.targetExpansion = 0.5;
      } else {
        this.targetExpansion = 1.3;
      }
    } else {
      this.currentMode = "idle";
      this.targetExpansion = 1.0;
      const idleWorld = {
        x: Math.sin(time * 0.7) * 0.35,
        y: Math.cos(time * 0.9) * 0.2,
        z: 0,
      };
      handPos = this.posFilter.update(idleWorld);
    }

    // Smooth expansion lerp
    this.expansionFactor += (this.targetExpansion - this.expansionFactor) * Math.min(1.0, delta * 6.0);

    // Group follows smoothed hand position
    this.group.position.set(handPos.x, handPos.y, handPos.z);
    this.group.rotation.y += delta * 0.4;
    this.group.rotation.x += delta * 0.2;

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    const baseSpring = 4.0;
    const damping = 0.92;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const hx = this.homePositions[idx] * this.expansionFactor;
      const hy = this.homePositions[idx + 1] * this.expansionFactor;
      const hz = this.homePositions[idx + 2] * this.expansionFactor;

      // Add gentle wave ripple when hand is open or moving
      const wave = Math.sin(time * 4.0 + i * 0.05) * 0.08 * this.expansionFactor;

      const targetX = hx + (hx !== 0 ? (hx / Math.abs(hx || 1)) * wave : 0);
      const targetY = hy + (hy !== 0 ? (hy / Math.abs(hy || 1)) * wave : 0);
      const targetZ = hz + wave;

      // Spring-damper physics towards target
      const fx = (targetX - posArr[idx]) * baseSpring;
      const fy = (targetY - posArr[idx + 1]) * baseSpring;
      const fz = (targetZ - posArr[idx + 2]) * baseSpring;

      this.velocities[idx] = (this.velocities[idx] + fx * delta) * damping;
      this.velocities[idx + 1] = (this.velocities[idx + 1] + fy * delta) * damping;
      this.velocities[idx + 2] = (this.velocities[idx + 2] + fz * delta) * damping;

      posArr[idx] += this.velocities[idx];
      posArr[idx + 1] += this.velocities[idx + 1];
      posArr[idx + 2] += this.velocities[idx + 2];
    }

    posAttr.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

