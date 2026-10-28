"use client";

import React, { useState, useRef } from "react";
import {
  AdminAvatarConfig,
  AdminAvatarShape,
  AdminAvatarBorderStyle,
  AdminAvatarFilter,
} from "@/lib/adminAvatarTypes";

interface AdminAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  currentConfig: AdminAvatarConfig | null;
  onSave: (config: AdminAvatarConfig | null) => Promise<void>;
  clerkImageUrl?: string | null;
  userInitial: string;
  userEmail?: string | null;
}

function AdminAvatarModalInner({
  onClose,
  isDark = true,
  currentConfig,
  onSave,
  clerkImageUrl,
  userInitial,
  userEmail,
}: Omit<AdminAvatarModalProps, "isOpen">) {
  const [imageUrl, setImageUrl] = useState<string>(() => currentConfig?.imageUrl || clerkImageUrl || "");
  const [shape, setShape] = useState<AdminAvatarShape>(() => currentConfig?.shape || "circle");
  const [borderStyle, setBorderStyle] = useState<AdminAvatarBorderStyle>(() => currentConfig?.borderStyle || "minimal");
  const [filter, setFilter] = useState<AdminAvatarFilter>(() => currentConfig?.filter || "none");
  const [zoom, setZoom] = useState<number>(() => currentConfig?.zoom || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle upload file lokal dari perangkat
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Format berkas harus berupa gambar (JPG, PNG, WEBP, GIF, SVG).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("Ukuran gambar maksimal 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      // Kompresi dan auto-crop proporsional ke canvas 400x400 agar tajam & hemat memori
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const targetSize = 400;
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Hitung crop center square
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;

            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
            const compressedDataUrl = canvas.toDataURL("image/webp", 0.9) || canvas.toDataURL("image/jpeg", 0.9);
            setImageUrl(compressedDataUrl);
            setErrorMsg(null);
          } else {
            setImageUrl(result);
            setErrorMsg(null);
          }
        } catch {
          setImageUrl(result);
          setErrorMsg(null);
        }
      };
      img.onerror = () => {
        setErrorMsg("Gagal memproses gambar yang dipilih.");
      };
      img.src = result;
    };
    reader.readAsDataURL(file);

    // Reset input agar bisa memilih berkas yang sama ulang jika perlu
    e.target.value = "";
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (!imageUrl.trim()) {
        await onSave(null);
      } else {
        await onSave({
          imageUrl: imageUrl.trim(),
          shape,
          borderStyle,
          filter,
          zoom,
          updatedAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || "Gagal menyimpan perubahan foto profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const getShapeClass = (s: AdminAvatarShape) => {
    switch (s) {
      case "circle":
        return "rounded-full";
      case "squircle":
        return "rounded-2xl";
      case "rounded":
        return "rounded-xl";
    }
  };

  const getBorderClass = (b: AdminAvatarBorderStyle) => {
    switch (b) {
      case "none":
        return "";
      case "minimal":
        return isDark ? "ring-1 ring-white/30" : "ring-1 ring-black/25";
      case "glow":
        return isDark
          ? "ring-2 ring-white/70 shadow-[0_0_14px_rgba(255,255,255,0.4)]"
          : "ring-2 ring-black/60 shadow-[0_0_14px_rgba(0,0,0,0.25)]";
      case "double":
        return isDark
          ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
          : "ring-2 ring-black ring-offset-2 ring-offset-white";
    }
  };

  const getFilterStyle = (f: AdminAvatarFilter) => {
    switch (f) {
      case "none":
        return "none";
      case "grayscale":
        return "grayscale(100%)";
      case "contrast":
        return "grayscale(100%) contrast(140%)";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-avatar-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-5 transition-all max-h-[92vh] overflow-y-auto ${
          isDark ? "bg-[#18181c] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
        }`}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 id="admin-avatar-modal-title" className="text-lg font-bold tracking-tight">
                Kustomisasi Foto Profil
              </h2>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border tracking-wider uppercase ${
                  isDark ? "bg-white/10 text-white border-white/20" : "bg-black/10 text-black border-black/20"
                }`}
              >
                Khusus Admin
              </span>
            </div>
            <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              Ganti ikon inisial di panel bawah dengan foto Anda dan sesuaikan tampilannya.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
              isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Live Preview Box: Persis seperti tampilan di panel samping */}
        <div
          className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-3 ${
            isDark ? "bg-zinc-900/60 border-zinc-800/80" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Pratinjau Langsung (Panel Bawah)
          </span>

          <div
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border w-full max-w-xs ${
              isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-white border-zinc-200"
            }`}
          >
            {/* Avatar Preview */}
            <div
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden transition-all duration-300 ${getShapeClass(
                shape
              )} ${getBorderClass(borderStyle)} ${
                !imageUrl ? (isDark ? "bg-white text-black font-bold" : "bg-black text-white font-bold") : ""
              }`}
            >
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt="Pratinjau Foto Profil"
                  style={{
                    transform: `scale(${zoom})`,
                    filter: getFilterStyle(filter),
                  }}
                  className="h-full w-full object-cover transition-transform duration-150"
                />
              ) : (
                <span className="text-sm font-bold">{userInitial}</span>
              )}
            </div>

            {/* Email & Status Badge Preview */}
            <div className="truncate min-w-0 flex-1">
              <div className={`text-xs font-semibold truncate ${isDark ? "text-zinc-100" : "text-black"}`}>
                {userEmail || "admin@onemind.web.id"}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md border leading-none ${
                    isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                  }`}
                >
                  PRO
                </span>
                <span
                  className={`inline-flex items-center text-[8.5px] font-bold px-1 py-0.5 rounded-md border leading-none ${
                    isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-200 text-zinc-800 border-zinc-300"
                  }`}
                >
                  ADMIN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Opsi Foto: Unggah / Gunakan Clerk / Hapus */}
        <div className="space-y-2">
          <label className="text-xs font-semibold block">Foto Profil</label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                isDark
                  ? "bg-white text-black border-white hover:bg-zinc-200"
                  : "bg-black text-white border-black hover:bg-zinc-800"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Pilih Foto dari Perangkat</span>
            </button>

            {clerkImageUrl && imageUrl !== clerkImageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(clerkImageUrl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                    : "bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200 hover:text-black"
                }`}
              >
                Gunakan Foto Akun
              </button>
            )}

            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isDark
                    ? "border-red-900/60 bg-red-950/20 text-red-400 hover:bg-red-950/40"
                    : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                }`}
              >
                Hapus Foto (Gunakan Inisial)
              </button>
            )}
          </div>
        </div>

        {/* Kontrol Kustomisasi Tampilan */}
        {imageUrl ? (
          <div className="space-y-4 pt-1 border-t border-zinc-200/40 dark:border-zinc-800/60">
            {/* 1. Bentuk (Shape) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold block">Bentuk Avatar</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "circle", label: "Bulat" },
                  { id: "squircle", label: "Squircle" },
                  { id: "rounded", label: "Kotak Halus" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setShape(opt.id as AdminAvatarShape)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                      shape === opt.id
                        ? isDark
                          ? "bg-white text-black border-white font-bold"
                          : "bg-black text-white border-black font-bold"
                        : isDark
                          ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-black"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Bingkai (Frame / Border Style) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold block">Gaya Bingkai (Frame Ring)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "none", label: "Polos" },
                  { id: "minimal", label: "Ring Halus" },
                  { id: "glow", label: "Pendar" },
                  { id: "double", label: "Double Ring" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBorderStyle(opt.id as AdminAvatarBorderStyle)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                      borderStyle === opt.id
                        ? isDark
                          ? "bg-white text-black border-white font-bold"
                          : "bg-black text-white border-black font-bold"
                        : isDark
                          ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-black"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Filter Warna (Color Style) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold block">Gaya Tampilan (Filter)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "none", label: "Warna Alami" },
                  { id: "grayscale", label: "Monokrom" },
                  { id: "contrast", label: "Kontras Tinggi" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilter(opt.id as AdminAvatarFilter)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                      filter === opt.id
                        ? isDark
                          ? "bg-white text-black border-white font-bold"
                          : "bg-black text-white border-black font-bold"
                        : isDark
                          ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-black"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Skala Zoom */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold">Skala Zoom Foto</label>
                <span className="font-mono text-[11px] text-zinc-400">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.6"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-white cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
              />
            </div>
          </div>
        ) : null}

        {errorMsg && (
          <div
            className={`p-3 rounded-xl text-xs leading-relaxed border ${
              isDark ? "bg-red-950/30 border-red-900 text-red-300" : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {errorMsg}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-200/40 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-2 ${
              isDark
                ? "bg-white text-black border-white hover:bg-zinc-200 disabled:opacity-50"
                : "bg-black text-white border-black hover:bg-zinc-800 disabled:opacity-50"
            }`}
          >
            {isSaving && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminAvatarModal(props: AdminAvatarModalProps) {
  if (!props.isOpen) return null;
  return <AdminAvatarModalInner {...props} key={props.currentConfig?.imageUrl || "default-avatar-config"} />;
}
