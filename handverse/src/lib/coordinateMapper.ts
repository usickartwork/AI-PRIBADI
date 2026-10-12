import * as THREE from "three";

export interface ScreenCoord {
  x: number; // 0..1
  y: number; // 0..1
  z?: number;
}

export class CoordinateMapper {
  private camera: THREE.PerspectiveCamera;
  private isMirrored: boolean;

  constructor(camera: THREE.PerspectiveCamera, isMirrored = true) {
    this.camera = camera;
    this.isMirrored = isMirrored;
  }

  public setMirrored(mirrored: boolean): void {
    this.isMirrored = mirrored;
  }

  /**
   * Maps 2D/3D normalized hand landmark coordinates to Three.js world coordinates
   * at target depth distance from the camera.
   *
   * @param coord Normalized screen coordinate (x: 0..1, y: 0..1, z: optional depth offset)
   * @param targetZ World Z position (default 0, when camera is at z = 5)
   */
  public toWorld(coord: ScreenCoord, targetZ = 0): THREE.Vector3 {
    const rawX = this.isMirrored ? 1 - coord.x : coord.x;
    const rawY = coord.y;

    // Calculate visible frustum bounds at targetZ
    const distance = Math.abs(this.camera.position.z - targetZ);
    const vFovRad = (this.camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFovRad / 2) * distance;
    const visibleWidth = visibleHeight * this.camera.aspect;

    // Map 0..1 to centered Three.js coordinates
    const worldX = (rawX - 0.5) * visibleWidth;
    const worldY = -(rawY - 0.5) * visibleHeight; // Invert Y

    // Add optional Z depth variation if landmark has depth
    const depthOffset = (coord.z || 0) * -1.5;
    const worldZ = targetZ + depthOffset;

    return new THREE.Vector3(worldX, worldY, worldZ);
  }

  /**
   * Unproject a normalized screen coordinate directly through Three.js camera
   */
  public unproject(coord: ScreenCoord, targetZ = 0): THREE.Vector3 {
    return this.toWorld(coord, targetZ);
  }
}
