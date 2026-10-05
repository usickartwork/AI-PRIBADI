"use client";

import { useState, useEffect, useRef } from "react";

interface ImageWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  userId?: string | null;
  onTogglePanel?: () => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: "flux" | "turbo";
  aspectRatio: string;
  width: number;
  height: number;
  seed: number;
  createdAt: number;
}

const PRESET_PROMPTS = [
  "Cyberpunk neon street at rainy night, highly detailed, 8k resolution, cinematic lighting",
  "Cute fluffy orange kitten wearing tiny headphones playing with colorful yarn, studio lighting",
  "Futuristic architecture floating city in the clouds, ethereal sunset, octane render",
  "Anime studio ghibli style lush green valley with traditional windmill and flowers",
  "Majestic mystical wolf with glowing blue runes in a dark enchanted forest",
  "Minimalist abstract 3D geometric shapes, soft pastel colors, modern aesthetic",
];

const ASPECT_RATIOS = [
  { label: "1:1 Persegi", id: "1:1", width: 1024, height: 1024, desc: "Avatar / Post" },
  { label: "16:9 Landscape", id: "16:9", width: 1280, height: 720, desc: "Wallpaper / Banner" },
  { label: "9:16 Portrait", id: "9:16", width: 720, height: 1280, desc: "Story / Smartphone" },
  { label: "4:3 Klasik", id: "4:3", width: 1024, height: 768, desc: "Standard" },
];

export function ImageWorkspace({
  isDark,
  onClose,
  userId,
  onTogglePanel,
}: ImageWorkspaceProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedModel, setSelectedModel] = useState<"flux" | "turbo">("flux");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isEnhance, setIsEnhance] = useState(true);

  const storageKey = `usick-image-history-${userId || "guest"}`;

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
            if (parsed.length > 0 && !currentImage) {
              setCurrentImage(parsed[0]);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load image history:", e);
      }
    }
  }, [storageKey]);

  // Save history to localStorage
  const saveHistory = (items: GeneratedImage[]) => {
    setHistory(items);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 30)));
      } catch (e) {
        console.warn("Failed to save image history:", e);
      }
    }
  };

  const handleGenerate = async (customPrompt?: string, customSeed?: number) => {
    const textToUse = (customPrompt ?? prompt).trim();
    if (!textToUse || isGenerating) return;

    setIsGenerating(true);
    setGenerationStep("Menghubungkan ke FLUX.1 Engine...");

    const ratioConfig = ASPECT_RATIOS.find((r) => r.id === selectedRatio) || ASPECT_RATIOS[0];
    const seed = customSeed ?? Math.floor(Math.random() * 100000000);
    const encodedPrompt = encodeURIComponent(textToUse);

    // Pollinations AI URL (Option 1 - 100% Free & Fast)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratioConfig.width}&height=${ratioConfig.height}&model=${selectedModel}&seed=${seed}&nologo=true${
      isEnhance ? "&enhance=true" : ""
    }`;

    try {
      setGenerationStep("Merender piksel gambar beresolusi tinggi...");

      // Preload image to ensure it loads before displaying
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gagal merender gambar. Coba ulangi kembali."));
        img.src = imageUrl;
      });

      const newEntry: GeneratedImage = {
        id: `img-${Date.now()}-${seed}`,
        url: imageUrl,
        prompt: textToUse,
        model: selectedModel,
        aspectRatio: selectedRatio,
        width: ratioConfig.width,
        height: ratioConfig.height,
        seed,
        createdAt: Date.now(),
      };

      setCurrentImage(newEntry);
      const updatedHistory = [newEntry, ...history.filter((h) => h.id !== newEntry.id)];
      saveHistory(updatedHistory);
    } catch (err: any) {
      alert(err?.message || "Gagal membuat gambar. Periksa koneksi internet Anda.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleDownload = async (img: GeneratedImage) => {
    try {
      setDownloading(true);
      const res = await fetch(img.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `usick-flux-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(img.url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    if (currentImage?.id === id) {
      setCurrentImage(updated[0] || null);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Hapus semua riwayat gambar yang tersimpan?")) {
      saveHistory([]);
      setCurrentImage(null);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${
      isDark ? "bg-[#121215] text-zinc-100" : "bg-white text-zinc-900"
    }`}>
      {/* ─── HEADER BAR ─────────────────────────────────────────────────── */}
      <header className={`shrink-0 w-full z-20 flex items-center justify-between border-b px-3.5 sm:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md ${
        isDark ? "border-zinc-800/80 bg-[#121215]/95 text-white" : "border-zinc-100 bg-white/95 text-zinc-900"
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger toggle button */}
          {onTogglePanel && (
            <button
              onClick={onTogglePanel}
              className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl border shadow-2xs transition cursor-pointer shrink-0 ${
                isDark
                  ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-black"
              }`}
              title="Menu Panel"
              aria-label="Menu Panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Icon & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl shadow-xs shrink-0 ${
              isDark ? "bg-white text-black" : "bg-black text-white"
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="truncate flex items-center gap-2">
              <span className={`text-sm font-bold tracking-tight truncate ${isDark ? "text-white" : "text-black"}`}>
                Image Generator
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? "bg-zinc-900 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-200"
              }`}>
                FLUX.1 • Free
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                isDark
                  ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-red-400"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-red-600"
              }`}
              title="Bersihkan riwayat gambar"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark
                ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-black"
            }`}
            title="Kembali ke Chats"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── MAIN BODY (Scrollable Split View) ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* 1. PROMPT & CONTROLS BOX */}
          <div className={`p-4 sm:p-6 rounded-3xl border shadow-sm space-y-4 ${
            isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50/70 border-zinc-200"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-zinc-300" : "text-zinc-800"
                }`}>
                  Deskripsi Gambar (Prompt)
                </label>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="hidden sm:inline">Engine:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedModel(selectedModel === "flux" ? "turbo" : "flux")}
                    className={`px-2 py-0.5 rounded-lg border font-semibold text-[10px] transition cursor-pointer ${
                      selectedModel === "flux"
                        ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black")
                        : (isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-200 text-zinc-800 border-zinc-300")
                    }`}
                  >
                    {selectedModel === "flux" ? "FLUX.1 (Kualitas Tinggi)" : "Turbo (Cepat)"}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  rows={3}
                  placeholder="Ketik deskripsi gambar yang kamu inginkan... (Contoh: Seekor kucing oren berbulu tebal memakai kacamata cyberpunk neon di malam hari, 8k, cinematic lighting)"
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-sm outline-none transition resize-none ${
                    isDark
                      ? "bg-zinc-950/80 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
                      : "bg-white border-zinc-200 text-black placeholder-zinc-400 focus:border-black focus:ring-1 focus:ring-black"
                  }`}
                />
              </div>

              {/* Preset prompt tags */}
              <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
                  Inspirasi:
                </span>
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border whitespace-nowrap transition cursor-pointer shrink-0 ${
                      isDark
                        ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                        : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black"
                    }`}
                  >
                    {p.split(",")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/40">
              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-medium text-zinc-500 mr-1 hidden sm:inline">Ukuran:</span>
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSelectedRatio(ratio.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shrink-0 ${
                      selectedRatio === ratio.id
                        ? (isDark ? "bg-white text-black border-white shadow-xs" : "bg-black text-white border-black shadow-xs")
                        : (isDark ? "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800" : "bg-white border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-100")
                    }`}
                    title={ratio.desc}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={!prompt.trim() || isGenerating}
                  onClick={() => handleGenerate()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? "bg-white hover:bg-zinc-200 text-black font-semibold"
                      : "bg-black hover:bg-zinc-800 text-white font-semibold"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Merender...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Hasilkan Gambar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 2. MAIN PREVIEW DISPLAY AREA */}
          <div className="space-y-4">
            {isGenerating ? (
              /* Shimmering Loading Card */
              <div className={`aspect-square sm:aspect-video w-full rounded-3xl border flex flex-col items-center justify-center p-6 text-center animate-pulse ${
                isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-zinc-100 border-zinc-200"
              }`}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-4 border ${
                  isDark ? "bg-zinc-800/80 border-zinc-700 text-white" : "bg-white border-zinc-200 text-black shadow-sm"
                }`}>
                  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold mb-1">Sedang Membuat Gambar</h4>
                <p className={`text-xs max-w-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {generationStep || "AI FLUX.1 sedang memproses prompt dan menyusun detail grafis..."}
                </p>
              </div>
            ) : currentImage ? (
              /* Active Image Showcase */
              <div className={`rounded-3xl border overflow-hidden shadow-md ${
                isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
              }`}>
                {/* Image Container with Lightbox Click */}
                <div
                  className="relative group bg-black/40 flex items-center justify-center cursor-zoom-in overflow-hidden"
                  onClick={() => setPreviewImage(currentImage.url)}
                  style={{ maxHeight: "680px" }}
                >
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 pointer-events-none">
                    <span className="px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-semibold backdrop-blur-md">
                      🔍 Klik untuk perbesar layar penuh
                    </span>
                  </div>
                </div>

                {/* Info & Action Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium leading-relaxed ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                      &ldquo;{currentImage.prompt}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                      <span>Model: <b className="capitalize text-zinc-400">{currentImage.model}</b></span>
                      <span>•</span>
                      <span>Ukuran: <b className="text-zinc-400">{currentImage.aspectRatio} ({currentImage.width}×{currentImage.height})</b></span>
                      <span>•</span>
                      <span>Seed: <b className="font-mono text-zinc-400">{currentImage.seed}</b></span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Re-generate button */}
                    <button
                      type="button"
                      onClick={() => handleGenerate(currentImage.prompt)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isDark
                          ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                      }`}
                      title="Generate variasi baru dengan prompt yang sama"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Variasi Baru</span>
                    </button>

                    {/* Copy Prompt */}
                    <button
                      type="button"
                      onClick={() => handleCopy(currentImage.prompt, "prompt")}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isDark
                          ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                      }`}
                      title="Salin deskripsi prompt"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>{copiedText === "prompt" ? "Disalin!" : "Salin Prompt"}</span>
                    </button>

                    {/* Download HD */}
                    <button
                      type="button"
                      disabled={downloading}
                      onClick={() => handleDownload(currentImage)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                        isDark
                          ? "bg-white hover:bg-zinc-200 text-black"
                          : "bg-black hover:bg-zinc-800 text-white"
                      }`}
                    >
                      {downloading ? (
                        <span>Mengunduh...</span>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Unduh HD</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className={`p-10 rounded-3xl border text-center flex flex-col items-center justify-center ${
                isDark ? "bg-zinc-900/30 border-zinc-800/80" : "bg-zinc-50 border-zinc-200"
              }`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-3 border ${
                  isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-white text-zinc-700 border-zinc-200 shadow-xs"
                }`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold mb-1">Mulai Generate Gambar Pertamamu</h3>
                <p className={`text-xs max-w-md ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  Ketik deskripsi gambar di kotak atas atau pilih salah satu inspirasi prompt untuk membuat gambar berkualitas tinggi menggunakan model FLUX.1.
                </p>
              </div>
            )}
          </div>

          {/* 3. RECENT GENERATIONS GALLERY */}
          {history.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  Riwayat Gambar ({history.length})
                </h3>
                <span className="text-[11px] text-zinc-500">Tersimpan di browser</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentImage(item)}
                    className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all aspect-square ${
                      currentImage?.id === item.id
                        ? (isDark ? "border-white ring-2 ring-white/30" : "border-black ring-2 ring-black/20")
                        : (isDark ? "border-zinc-800 hover:border-zinc-700 bg-zinc-900/60" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50")
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.prompt}
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 hover:bg-red-600 text-white/80 hover:text-white transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Hapus gambar ini"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {/* Bottom gradient with prompt preview */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                      <p className="text-[10px] text-white font-medium truncate">
                        {item.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── FULLSCREEN LIGHTBOX PREVIEW ───────────────────────────────── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in-0 duration-200 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[92vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-11 right-0 p-2 text-white/80 hover:text-white transition cursor-pointer"
              title="Tutup"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Fullscreen Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
