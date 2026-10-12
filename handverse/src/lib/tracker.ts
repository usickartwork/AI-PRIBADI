import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { GestureRecognizer, type GestureResult, type Landmark } from "./gestureRecognizer";

export type TrackerStatus =
  | "uninitialized"
  | "loading-wasm"
  | "loading-model"
  | "ready"
  | "error";

export interface DetectionFrame {
  hands: Landmark[][];
  handedness: string[];
  gestures: GestureResult[];
  primaryGesture: GestureResult | null;
  timestamp: number;
}

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private recognizer = new GestureRecognizer();
  private status: TrackerStatus = "uninitialized";
  private errorMessage: string | null = null;
  private delegateUsed: "GPU" | "CPU" = "GPU";

  public getStatus(): TrackerStatus {
    return this.status;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public getDelegate(): "GPU" | "CPU" {
    return this.delegateUsed;
  }

  /**
   * Initialize MediaPipe HandLandmarker with GPU delegate (and CPU fallback)
   */
  public async init(onProgress?: (status: TrackerStatus) => void): Promise<boolean> {
    if (this.status === "ready" && this.landmarker) {
      return true;
    }

    try {
      this.status = "loading-wasm";
      onProgress?.(this.status);

      // 1. Resolve WASM files
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      this.status = "loading-model";
      onProgress?.(this.status);

      const modelAssetPath =
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

      // 2. Try with GPU delegate first
      try {
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        this.delegateUsed = "GPU";
      } catch (gpuErr) {
        console.warn("MediaPipe GPU delegate initialization failed, falling back to CPU:", gpuErr);
        // Fallback to CPU
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        this.delegateUsed = "CPU";
      }

      this.status = "ready";
      onProgress?.(this.status);
      return true;
    } catch (err: unknown) {
      this.status = "error";
      this.errorMessage =
        err instanceof Error
          ? err.message
          : "Gagal memuat model deteksi tangan MediaPipe.";
      onProgress?.(this.status);
      console.error("HandTracker init failed:", err);
      return false;
    }
  }

  /**
   * Process a single video frame and return landmarks and gestures
   */
  public detect(video: HTMLVideoElement, timestamp: number): DetectionFrame | null {
    if (!this.landmarker || this.status !== "ready") return null;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;

    try {
      const result = this.landmarker.detectForVideo(video, timestamp);

      const hands: Landmark[][] = [];
      const handedness: string[] = [];
      const gestures: GestureResult[] = [];

      if (result && result.landmarks && result.landmarks.length > 0) {
        for (let i = 0; i < result.landmarks.length; i++) {
          const lms: Landmark[] = result.landmarks[i].map((pt) => ({
            x: pt.x,
            y: pt.y,
            z: pt.z,
          }));
          hands.push(lms);

          const hName =
            result.handedness && result.handedness[i] && result.handedness[i][0]
              ? result.handedness[i][0].displayName || "Hand"
              : `Hand ${i + 1}`;
          handedness.push(hName);

          const g = this.recognizer.recognize(lms);
          gestures.push(g);
        }
      } else {
        this.recognizer.reset();
      }

      return {
        hands,
        handedness,
        gestures,
        primaryGesture: gestures.length > 0 ? gestures[0] : null,
        timestamp,
      };
    } catch (err) {
      console.warn("HandTracker detect error:", err);
      return null;
    }
  }

  public dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {}
      this.landmarker = null;
    }
    this.recognizer.reset();
    this.status = "uninitialized";
  }
}
