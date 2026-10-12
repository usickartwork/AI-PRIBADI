export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export class SmoothFilter3D {
  private current: Vec3 | null = null;
  private lerpFactor: number;

  /**
   * @param lerpFactor 0..1 (higher = faster response, lower = smoother)
   */
  constructor(lerpFactor = 0.35) {
    this.lerpFactor = lerpFactor;
  }

  public setLerpFactor(factor: number): void {
    this.lerpFactor = Math.max(0.01, Math.min(1.0, factor));
  }

  public update(target: Vec3): Vec3 {
    if (!this.current) {
      this.current = { ...target };
      return { ...this.current };
    }

    this.current.x += (target.x - this.current.x) * this.lerpFactor;
    this.current.y += (target.y - this.current.y) * this.lerpFactor;
    this.current.z += (target.z - this.current.z) * this.lerpFactor;

    return { ...this.current };
  }

  public get(): Vec3 | null {
    return this.current ? { ...this.current } : null;
  }

  public reset(): void {
    this.current = null;
  }
}

export class SmoothValue {
  private current: number | null = null;
  private lerpFactor: number;

  constructor(lerpFactor = 0.25) {
    this.lerpFactor = lerpFactor;
  }

  public update(target: number): number {
    if (this.current === null) {
      this.current = target;
      return this.current;
    }
    this.current += (target - this.current) * this.lerpFactor;
    return this.current;
  }

  public get(): number | null {
    return this.current;
  }

  public reset(): void {
    this.current = null;
  }
}

