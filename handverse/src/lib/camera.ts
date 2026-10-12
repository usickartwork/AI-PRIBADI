export type FacingMode = "user" | "environment";

export interface CameraState {
  isActive: boolean;
  facingMode: FacingMode;
  error: string | null;
  hasMultipleCameras: boolean;
  width: number;
  height: number;
}

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private facingMode: FacingMode = "user";
  private isStarting = false;

  public getFacingMode(): FacingMode {
    return this.facingMode;
  }

  public isMirrored(): boolean {
    return this.facingMode === "user";
  }

  public async checkMultipleCameras(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return false;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      return videoDevices.length > 1;
    } catch {
      return false;
    }
  }

  /**
   * Start camera stream and attach to video element
   */
  public async start(
    video: HTMLVideoElement,
    facing: FacingMode = "user"
  ): Promise<{ ok: boolean; error?: string }> {
    if (this.isStarting) {
      return { ok: false, error: "Kamera sedang dalam proses inisialisasi." };
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        ok: false,
        error:
          "Browser tidak mendukung akses kamera (getUserMedia) atau halaman tidak dijalankan melalui protokol HTTPS/localhost yang aman.",
      };
    }

    this.isStarting = true;
    this.stop(); // Stop previous stream if any

    try {
      this.facingMode = facing;
      this.videoElement = video;

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;

      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;

      // Wait for video to have metadata and play
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(); // Resolve anyway after timeout to prevent freeze
        }, 5000);

        video.onloadedmetadata = async () => {
          clearTimeout(timeout);
          try {
            await video.play();
            resolve();
          } catch (playErr) {
            reject(playErr);
          }
        };
      });

      this.isStarting = false;
      return { ok: true };
    } catch (err: unknown) {
      this.isStarting = false;
      this.stop();

      let msg = "Gagal mengakses kamera perangkat.";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Izin akses kamera ditolak oleh pengguna atau sistem. Harap izinkan kamera pada browser Anda.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "Perangkat kamera tidak ditemukan pada sistem ini.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          msg = "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi yang menggunakan webcam dan coba lagi.";
        } else if (err.name === "OverconstrainedError") {
          msg = "Kamera tidak mendukung resolusi yang diminta. Mencoba kembali dengan konfigurasi default...";
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }

      return { ok: false, error: msg };
    }
  }

  /**
   * Toggle between front and back camera
   */
  public async switchCamera(video: HTMLVideoElement): Promise<{ ok: boolean; error?: string }> {
    const nextFacing: FacingMode = this.facingMode === "user" ? "environment" : "user";
    return this.start(video, nextFacing);
  }

  /**
   * Stop camera tracks and release resources
   */
  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    this.isStarting = false;
  }
}
