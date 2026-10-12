import * as THREE from "three";
import type { GestureResult } from "../lib/gestureRecognizer";
import { SmoothFilter3D, SmoothValue } from "../lib/handSmoothing";
import type { CoordinateMapper } from "../lib/coordinateMapper";

export class OrbExperiment {
  public group = new THREE.Group();
  private coreMesh: THREE.Mesh;
  private glowMesh: THREE.Mesh;
  private ring1: THREE.Mesh;
  private ring2: THREE.Mesh;
  private pointLight: THREE.PointLight;
  private haloParticles: THREE.Points;

  // Smoothing filters
  private posFilter = new SmoothFilter3D(0.25);
  private scaleFilter = new SmoothValue(0.18);

  // State
  private isHandPresent = false;
  private idleTime = 0;
  private currentScale = 1.0;

  constructor() {
    // 1. Core Sphere
    const coreGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x00d2ff,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.8,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.coreMesh);

    // 2. Outer Glow Shell
    const glowGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x7928ca,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glowMesh);

    // 3. Orbiting Energy Rings
    const ringGeo = new THREE.TorusGeometry(0.65, 0.018, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.8,
    });
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff0080,
      transparent: true,
      opacity: 0.7,
    });
    this.ring1 = new THREE.Mesh(ringGeo, ringMat1);
    this.ring2 = new THREE.Mesh(ringGeo, ringMat2);
    this.ring2.rotation.x = Math.PI / 3;
    this.group.add(this.ring1);
    this.group.add(this.ring2);

    // 4. Point Light emanating from orb
    this.pointLight = new THREE.PointLight(0x00f2fe, 2.5, 6);
    this.group.add(this.pointLight);

    // 5. Halo Particle Swarm
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 0.55 + Math.random() * 0.35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.035,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.haloParticles = new THREE.Points(particleGeo, particleMat);
    this.group.add(this.haloParticles);

    // Start centered
    this.group.position.set(0, 0, 0);
  }

  public update(
    delta: number,
    time: number,
    gesture: GestureResult | null,
    mapper: CoordinateMapper
  ): void {
    // Rotations & Pulse
    this.ring1.rotation.z += delta * 1.5;
    this.ring1.rotation.y += delta * 0.9;
    this.ring2.rotation.z -= delta * 1.2;
    this.ring2.rotation.x += delta * 0.7;
    this.glowMesh.rotation.y += delta * 0.4;
    this.haloParticles.rotation.y += delta * 0.5;

    if (gesture && gesture.confidence > 0.4) {
      this.isHandPresent = true;
      this.idleTime = 0;

      // Target world position from palm center
      const targetWorld = mapper.toWorld(gesture.palmCenter, 0);
      const smoothedPos = this.posFilter.update(targetWorld);
      this.group.position.set(smoothedPos.x, smoothedPos.y, smoothedPos.z);

      // Target scale from hand scale (normalized reference: 0.15 -> scale 1.0)
      const baseScale = Math.max(0.6, Math.min(2.0, (gesture.handScale / 0.18) * 1.1));
      const targetScale = gesture.gesture === "Fist" ? baseScale * 0.6 : baseScale;
      this.currentScale = this.scaleFilter.update(targetScale);
      this.group.scale.setScalar(this.currentScale);

      // Core intensity reacts to gestures
      if (gesture.gesture === "Pinch") {
        this.pointLight.intensity = 4.0;
        this.pointLight.color.setHex(0xff0080);
      } else {
        this.pointLight.intensity = 2.5;
        this.pointLight.color.setHex(0x00f2fe);
      }
    } else {
      // Idle state: smoothly glide back to center and pulse
      this.isHandPresent = false;
      this.idleTime += delta;

      const idleTarget = {
        x: Math.sin(time * 0.8) * 0.3,
        y: Math.cos(time * 1.2) * 0.25,
        z: 0,
      };
      const smoothedPos = this.posFilter.update(idleTarget);
      this.group.position.set(smoothedPos.x, smoothedPos.y, smoothedPos.z);

      const breathingScale = 1.0 + Math.sin(time * 2.0) * 0.12;
      this.currentScale = this.scaleFilter.update(breathingScale);
      this.group.scale.setScalar(this.currentScale);

      this.pointLight.intensity = 2.0 + Math.sin(time * 3.0) * 0.8;
      this.pointLight.color.setHex(0x00f2fe);
    }
  }

  public dispose(): void {
    this.coreMesh.geometry.dispose();
    (this.coreMesh.material as THREE.Material).dispose();
    this.glowMesh.geometry.dispose();
    (this.glowMesh.material as THREE.Material).dispose();
    this.ring1.geometry.dispose();
    (this.ring1.material as THREE.Material).dispose();
    this.ring2.geometry.dispose();
    (this.ring2.material as THREE.Material).dispose();
    this.haloParticles.geometry.dispose();
    (this.haloParticles.material as THREE.Material).dispose();
  }
}
