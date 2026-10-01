"use client";

import React, { useEffect, useRef, useState } from "react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  isDark: boolean;
}

export function CameraModal({ isOpen, onClose, onCapture, isDark }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(true);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera stream
  const startCamera = async (mode: "environment" | "user") => {
    stopCamera();
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser ini tidak mendukung akses kamera langsung.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStartingCamera(false);
    } catch (err: unknown) {
      console.warn("Camera start failed, trying fallback:", err);
      // Try again without facingMode constraints (for desktop webcams)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsStartingCamera(false);
      } catch (err2: unknown) {
        console.error("Camera access failed:", err2);
        setIsStartingCamera(false);
        setCameraError(
          "Tidak dapat mengakses kamera. Pastikan izin kamera aktif atau gunakan tombol Unggah Galeri di bawah."
        );
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Handle take photo from live stream
  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    // Max dimension 1280px to optimize size while preserving quality
    const maxDim = 1280;
    let targetW = width;
    let targetH = height;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        targetW = maxDim;
        targetH = Math.round((height * maxDim) / width);
      } else {
        targetH = maxDim;
        targetW = Math.round((width * maxDim) / height);
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontal if using front camera so it acts like a mirror
    if (facingMode === "user") {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPreview(dataUrl);
    stopCamera();
  };

  // Handle file input upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1280;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setCapturedPreview(dataUrl);
          stopCamera();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleConfirmPhoto = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    startCamera(facingMode);
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div
        className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border transition-all ${
          isDark
            ? "bg-[#141417] border-white/10 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">
              {capturedPreview ? "Tinjau Foto" : "Kamera Usick AI"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!capturedPreview && !cameraError && (
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Putar Kamera (Depan / Belakang)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Tutup"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-black overflow-hidden flex items-center justify-center">
          {capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Hasil Kamera"
              className="w-full h-full object-contain bg-black"
            />
          ) : cameraError ? (
            <div className="px-6 text-center text-zinc-300">
              <svg className="w-12 h-12 mx-auto mb-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-xs sm:text-sm font-medium mb-3">{cameraError}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer"
              >
                Pilih Foto dari Galeri / File
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* Viewfinder Target Framing Guidelines */}
              <div className="absolute inset-6 pointer-events-none border border-white/20 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-l-2 border-white/60 absolute top-0 left-0 rounded-tl-lg" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-white/60 absolute top-0 right-0 rounded-tr-lg" />
                <div className="w-8 h-8 border-b-2 border-l-2 border-white/60 absolute bottom-0 left-0 rounded-bl-lg" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-white/60 absolute bottom-0 right-0 rounded-br-lg" />
                <div className="w-2 h-2 rounded-full bg-white/40" />
              </div>

              {isStartingCamera && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white text-xs font-medium">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Membuka kamera...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Shutter & Action Bar */}
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          {capturedPreview ? (
            <div className="w-full flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs sm:text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                Ulangi
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition shadow-lg shadow-white/10 cursor-pointer"
              >
                Gunakan Foto
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              {/* Gallery Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Pilih dari Galeri / File"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Galeri</span>
              </button>

              {/* Shutter Button (ChatGPT / iPhone Camera Style) */}
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={Boolean(cameraError || isStartingCamera)}
                className="h-16 w-16 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Ambil Foto"
              >
                <div className="h-full w-full rounded-full bg-white transition hover:bg-zinc-200" />
              </button>

              {/* Flip camera toggle button */}
              <div className="w-16 flex justify-end">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Ganti Kamera"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for Gallery / Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
