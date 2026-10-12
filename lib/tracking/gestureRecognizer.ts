/**
 * Hand Landmark Index Guide (MediaPipe Hand 21 Landmarks):
 * 0: WRIST
 * 1: THUMB_CMC, 2: THUMB_MCP, 3: THUMB_IP, 4: THUMB_TIP
 * 5: INDEX_FINGER_MCP, 6: INDEX_FINGER_PIP, 7: INDEX_FINGER_DIP, 8: INDEX_FINGER_TIP
 * 9: MIDDLE_FINGER_MCP, 10: MIDDLE_FINGER_PIP, 11: MIDDLE_FINGER_DIP, 12: MIDDLE_FINGER_TIP
 * 13: RING_FINGER_MCP, 14: RING_FINGER_PIP, 15: RING_FINGER_DIP, 16: RING_FINGER_TIP
 * 17: PINKY_MCP, 18: PINKY_PIP, 19: PINKY_DIP, 20: PINKY_TIP
 */

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type GestureType =
  | "Open Palm"
  | "Fist"
  | "Pinch"
  | "Peace Sign"
  | "Pointing"
  | "Unknown";

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  pinchDistance: number; // Normalized pinch distance
  pinchPoint: { x: number; y: number; z: number }; // Midpoint between thumb tip and index tip
  handScale: number; // Reference hand dimension for scale normalization
  palmCenter: { x: number; y: number; z: number };
  extendedFingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
}

// Distance helper
function distance3D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function distance2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export class GestureRecognizer {
  private history: GestureType[] = [];
  private historySize = 5; // Temporal smoothing window
  private lastStableGesture: GestureType = "Unknown";
  private confirmationThreshold = 3; // Must appear >= 3 times in last 5 frames

  /**
   * Reset recognition temporal history
   */
  public reset(): void {
    this.history = [];
    this.lastStableGesture = "Unknown";
  }

  /**
   * Recognize gesture from 21 landmarks of a single hand
   */
  public recognize(landmarks: Landmark[]): GestureResult {
    if (!landmarks || landmarks.length < 21) {
      return {
        gesture: "Unknown",
        confidence: 0,
        pinchDistance: 1,
        pinchPoint: { x: 0.5, y: 0.5, z: 0 },
        handScale: 0.1,
        palmCenter: { x: 0.5, y: 0.5, z: 0 },
        extendedFingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
      };
    }

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbMcp = landmarks[2];
    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexDip = landmarks[7];
    const indexTip = landmarks[8];
    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleTip = landmarks[12];
    const ringMcp = landmarks[13];
    const ringPip = landmarks[14];
    const ringTip = landmarks[16];
    const pinkyMcp = landmarks[17];
    const pinkyPip = landmarks[18];
    const pinkyTip = landmarks[20];

    // Hand scale: distance between wrist (0) and middle MCP (9)
    const palmLength = distance3D(wrist, middleMcp);
    // Hand width: distance between index MCP (5) and pinky MCP (17)
    const palmWidth = distance3D(indexMcp, pinkyMcp);
    const handScale = Math.max(0.001, (palmLength + palmWidth) / 2);

    // Palm center approximation (average of wrist, index MCP, pinky MCP)
    const palmCenter = {
      x: (wrist.x + indexMcp.x + middleMcp.x + pinkyMcp.x) / 4,
      y: (wrist.y + indexMcp.y + middleMcp.y + pinkyMcp.y) / 4,
      z: ((wrist.z || 0) + (indexMcp.z || 0) + (middleMcp.z || 0) + (pinkyMcp.z || 0)) / 4,
    };

    // Normalized pinch distance between thumb tip and index tip
    const rawPinchDist = distance3D(thumbTip, indexTip);
    const normalizedPinchDist = rawPinchDist / handScale;

    const pinchPoint = {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2,
      z: ((thumbTip.z || 0) + (indexTip.z || 0)) / 2,
    };

    // Check finger extension relative to palm:
    // A finger is extended if tip is farther from wrist than PIP/MCP joint
    const isIndexExtended =
      distance3D(indexTip, wrist) > distance3D(indexPip, wrist) * 1.15 &&
      distance3D(indexTip, indexMcp) > distance3D(indexPip, indexMcp) * 1.25;

    const isMiddleExtended =
      distance3D(middleTip, wrist) > distance3D(middlePip, wrist) * 1.15 &&
      distance3D(middleTip, middleMcp) > distance3D(middlePip, middleMcp) * 1.25;

    const isRingExtended =
      distance3D(ringTip, wrist) > distance3D(ringPip, wrist) * 1.15 &&
      distance3D(ringTip, ringMcp) > distance3D(ringPip, ringMcp) * 1.25;

    const isPinkyExtended =
      distance3D(pinkyTip, wrist) > distance3D(pinkyPip, wrist) * 1.15 &&
      distance3D(pinkyTip, pinkyMcp) > distance3D(pinkyPip, pinkyMcp) * 1.25;

    // Thumb extension: distance of tip to pinky MCP compared to thumb IP to pinky MCP
    const isThumbExtended =
      distance3D(thumbTip, pinkyMcp) > distance3D(thumbIp, pinkyMcp) * 1.2 &&
      distance3D(thumbTip, wrist) > distance3D(thumbMcp, wrist) * 1.2;

    const extendedCount =
      (isIndexExtended ? 1 : 0) +
      (isMiddleExtended ? 1 : 0) +
      (isRingExtended ? 1 : 0) +
      (isPinkyExtended ? 1 : 0);

    let rawGesture: GestureType = "Unknown";
    let confidence = 0.5;

    // Classification Rules:
    // 1. PINCH: thumb tip and index tip are close (< 0.35 of handScale)
    if (normalizedPinchDist < 0.38) {
      rawGesture = "Pinch";
      confidence = Math.max(0.6, 1 - normalizedPinchDist);
    }
    // 2. FIST: none or only 1 finger extended, all tips close to wrist/MCP
    else if (extendedCount === 0 || (extendedCount === 1 && !isIndexExtended && !isMiddleExtended)) {
      const tipDistAvg =
        (distance3D(indexTip, indexMcp) +
          distance3D(middleTip, middleMcp) +
          distance3D(ringTip, ringMcp) +
          distance3D(pinkyTip, pinkyMcp)) /
        (4 * handScale);

      if (tipDistAvg < 0.95) {
        rawGesture = "Fist";
        confidence = Math.max(0.7, 1 - tipDistAvg * 0.5);
      }
    }
    // 3. PEACE SIGN: index & middle extended, ring & pinky curled
    else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      // Check separation between index and middle
      const indexMiddleSpread = distance3D(indexTip, middleTip) / handScale;
      if (indexMiddleSpread > 0.2) {
        rawGesture = "Peace Sign";
        confidence = 0.88;
      }
    }
    // 4. POINTING: only index extended, middle, ring, pinky curled
    else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      rawGesture = "Pointing";
      confidence = 0.9;
    }
    // 5. OPEN PALM: at least 3-4 fingers extended and spread apart
    else if (extendedCount >= 4 || (extendedCount === 3 && isThumbExtended)) {
      rawGesture = "Open Palm";
      confidence = 0.92;
    }

    // Temporal Smoothing (Hysteresis Buffer)
    this.history.push(rawGesture);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }

    const counts: Record<string, number> = {};
    for (const g of this.history) {
      counts[g] = (counts[g] || 0) + 1;
    }

    let dominantGesture: GestureType = this.lastStableGesture;
    let maxCount = 0;

    for (const [g, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantGesture = g as GestureType;
      }
    }

    if (maxCount >= this.confirmationThreshold) {
      this.lastStableGesture = dominantGesture;
    }

    return {
      gesture: this.lastStableGesture,
      confidence,
      pinchDistance: normalizedPinchDist,
      pinchPoint,
      handScale,
      palmCenter,
      extendedFingers: {
        thumb: isThumbExtended,
        index: isIndexExtended,
        middle: isMiddleExtended,
        ring: isRingExtended,
        pinky: isPinkyExtended,
      },
    };
  }
}

