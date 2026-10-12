import * as THREE from "three";
import type { GestureResult } from "../gestureRecognizer";
import { SmoothFilter3D, SmoothValue } from "../handSmoothing";
import type { CoordinateMapper } from "../coordinateMapper";

export class HologramExperiment {
  public group = new THREE.Group();
  private coreCrystal: THREE.Mesh;
  private wireCage: THREE.Mesh;
  private energyRing: THREE.Mesh;
  private pinchReticle: THREE.Mesh;
  private pointLight: THREE.PointLight;

  private posFilter = new SmoothFilter3D(0.28);
  private scaleFilter = new SmoothValue(0.2);
  private rotFilter = new SmoothValue(0.15);

  private isGrabbed = false;
  private prevHandX = 0;
  private rotationVelocity = 0;

  constructor() {
    // 1. Central Holographic Crystal (Octahedron)
    const crystalGeo = new THREE.OctahedronGeometry(0.45, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x0088cc,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.85,
    });
    this.coreCrystal = new THREE.Mesh(crystalGeo, crystalMat);
    this.group.add(this.coreCrystal);

    // 2. Outer Holographic Wireframe Cage (Icosahedron)
    const cageGeo = new THREE.IcosahedronGeometry(0.72, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x7928ca,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    this.wireCage = new THREE.Mesh(cageGeo, cageMat);
    this.group.add(this.wireCage);

    // 3. Orbital Energy Ring
    const ringGeo = new THREE.TorusGeometry(0.85, 0.015, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
    });
    this.energyRing = new THREE.Mesh(ringGeo, ringMat);
    this.energyRing.rotation.x = Math.PI / 2;
    this.group.add(this.energyRing);

    // 4. Pinch Reticle (Visual indicator when grabbing)
    const reticleGeo = new THREE.RingGeometry(0.18, 0.22, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xff0080,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0, // hidden by default
    });
    this.pinchReticle = new THREE.Mesh(reticleGeo, reticleMat);
    this.group.add(this.pinchReticle);

    // 5. Point Light
    this.pointLight = new THREE.PointLight(0x00f2fe, 2.5, 6);
    this.group.add(this.pointLight);

    this.group.position.set(0, 0, 0);
  }

  public update(
    delta: number,
    time: number,
    gesture: GestureResult | null,
    mapper: CoordinateMapper
  ): void {
    // Continuous idle rotation
    this.coreCrystal.rotation.y += delta * (0.8 + this.rotationVelocity);
    this.coreCrystal.rotation.x += delta * 0.4;
    this.wireCage.rotation.y -= delta * 0.6;
    this.wireCage.rotation.z += delta * 0.3;
    this.energyRing.rotation.z += delta * 1.2;

    // Decay hand-induced rotation velocity
    this.rotationVelocity *= 0.94;

    if (gesture && gesture.confidence > 0.4) {
      // Check hand sideways movement for rotation inertia
      const currentHandX = gesture.palmCenter.x;
      const deltaX = currentHandX - this.prevHandX;
      this.rotationVelocity += deltaX * 12.0;
      this.prevHandX = currentHandX;

      let targetWorld: THREE.Vector3;
      let targetScale = 1.0;

      if (gesture.gesture === "Pinch") {
        // PINCH GRAB MODE: snap directly to pinch midpoint
        this.isGrabbed = true;
        targetWorld = mapper.toWorld(gesture.pinchPoint, 0);
        targetScale = 0.85;

        // Visual feedback: pink glowing grab state
        (this.pinchReticle.material as THREE.MeshBasicMaterial).opacity = 0.9;
        this.pointLight.color.setHex(0xff0080);
        this.pointLight.intensity = 4.0;
        (this.coreCrystal.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0080);
      } else {
        this.isGrabbed = false;
        (this.pinchReticle.material as THREE.MeshBasicMaterial).opacity = 0.0;

        // Hover slightly above palm (offset Y by +0.35 in world space)
        targetWorld = mapper.toWorld(gesture.palmCenter, 0);
        targetWorld.y += 0.35;

        if (gesture.gesture === "Fist") {
          // Fist: compress into standby stasis core
          targetScale = 0.25;
          this.pointLight.intensity = 1.0;
        } else {
          // Open Palm / other
          targetScale = Math.max(0.7, Math.min(1.8, (gesture.handScale / 0.18) * 1.05));
          this.pointLight.color.setHex(0x00f2fe);
          this.pointLight.intensity = 2.8;
          (this.coreCrystal.material as THREE.MeshStandardMaterial).emissive.setHex(0x0088cc);
        }
      }

      const smoothed = this.posFilter.update(targetWorld);
      this.group.position.set(smoothed.x, smoothed.y, smoothed.z);

      const s = this.scaleFilter.update(targetScale);
      this.group.scale.setScalar(s);
    } else {
      // Idle state when hand is absent
      this.isGrabbed = false;
      (this.pinchReticle.material as THREE.MeshBasicMaterial).opacity = 0.0;

      const idleWorld = {
        x: Math.sin(time * 0.8) * 0.3,
        y: Math.cos(time * 1.1) * 0.25,
        z: 0,
      };
      const smoothed = this.posFilter.update(idleWorld);
      this.group.position.set(smoothed.x, smoothed.y, smoothed.z);

      const breathingScale = 1.0 + Math.sin(time * 2.5) * 0.08;
      const s = this.scaleFilter.update(breathingScale);
      this.group.scale.setScalar(s);

      this.pointLight.color.setHex(0x00f2fe);
      this.pointLight.intensity = 2.0;
      (this.coreCrystal.material as THREE.MeshStandardMaterial).emissive.setHex(0x0088cc);
    }
  }

  public dispose(): void {
    this.coreCrystal.geometry.dispose();
    (this.coreCrystal.material as THREE.Material).dispose();
    this.wireCage.geometry.dispose();
    (this.wireCage.material as THREE.Material).dispose();
    this.energyRing.geometry.dispose();
    (this.energyRing.material as THREE.Material).dispose();
    this.pinchReticle.geometry.dispose();
    (this.pinchReticle.material as THREE.Material).dispose();
  }
}

