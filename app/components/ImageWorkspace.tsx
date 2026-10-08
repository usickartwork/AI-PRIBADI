"use client";

import { useState, useEffect, useRef } from "react";
import { ShiningText } from "@/components/ui/shining-text";

interface ImageWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  userId?: string | null;
  userName?: string | null;
  onTogglePanel?: () => void;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Good Morning";
  if (hour >= 11 && hour < 15) return "Good Afternoon";
  if (hour >= 15 && hour < 19) return "Good Evening";
  return "Good Night";
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  translatedPrompt?: string;
  model: string;
  aspectRatio: string;
  width: number;
  height: number;
  createdAt: number;
}

interface StyleTemplate {
  id: string;
  title: string;
  prompt: string;
  gradient: string;
  previewUrl?: string;
  isGrid?: boolean;
  circleImages?: string[];
}

const TEMPLATES: StyleTemplate[] = [
  {
    id: "pin",
    title: "Pin",
    prompt: "A detailed enamel metal lapel pin illustration of a smiling cool character on denim jacket, metallic golden borders, vibrant flat vector colors, high resolution graphic art",
    gradient: "from-blue-900 via-indigo-950 to-slate-900",
    previewUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "baris-depan",
    title: "Baris\ndepan",
    prompt: "High fashion front-row runway photography, chic stylish model in avant-garde black attire surrounded by paparazzi flashes, cinematic atmosphere, 8k",
    gradient: "from-zinc-900 via-stone-900 to-black",
    previewUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "origami",
    title: "Origami",
    prompt: "Exquisite low-poly 3D papercraft origami portrait, geometric folded paper planes, clean sharp edges, soft warm studio lighting, modern museum art",
    gradient: "from-amber-900 via-orange-950 to-stone-900",
    previewUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "somelier",
    title: "Somelier",
    prompt: "Atmospheric portrait of an expert sommelier holding a crystal glass of fine red wine in a rustic oak barrel wine cellar, warm dramatic chiaroscuro lighting, photorealistic 8k",
    gradient: "from-amber-950 via-stone-900 to-zinc-950",
    previewUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "pelatih",
    title: "Pelatih",
    prompt: "Intense sports coach in tailored dark navy suit holding tactical clipboard on sidelines of a crowded roaring stadium, dramatic stadium spotlights, cinematic shot",
    gradient: "from-slate-900 via-zinc-900 to-blue-950",
    previewUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "kolase",
    title: "Karakter",
    isGrid: true,
    prompt: "A colorful pop-art collage of expressive creative characters, diverse portraits, bold graphic design elements, vibrant modern aesthetic, 8k",
    gradient: "from-purple-950 via-zinc-900 to-pink-950",
    circleImages: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80",
    ],
  },
];

const ASPECT_RATIOS = [
  { label: "1:1 Persegi", id: "1:1", size: "1024x1024", width: 1024, height: 1024, desc: "Standar / Avatar" },
  { label: "16:9 Landscape", id: "16:9", size: "1280x720", width: 1280, height: 720, desc: "Banner / Wallpaper" },
  { label: "9:16 Portrait", id: "9:16", size: "720x1280", width: 720, height: 1280, desc: "Story / HP" },
  { label: "4:3 Klasik", id: "4:3", size: "1024x768", width: 1024, height: 768, desc: "Tradisional" },
];

export function ImageWorkspace({
  isDark,
  onClose,
  userId,
  userName,
  onTogglePanel,
}: ImageWorkspaceProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [ratioDropdownOpen, setRatioDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const templateScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = templateScrollRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const container = templateScrollRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const scrollTemplates = (direction: "left" | "right") => {
    if (templateScrollRef.current) {
      const amount = direction === "left" ? -320 : 320;
      templateScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const storageKey = `usick-image-history-${userId || "guest"}`;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRatioDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
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

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = (customPrompt ?? prompt).trim();
    if (!textToUse || isGenerating) return;

    // Bersihkan text box input segera setelah di-submit (Enter/Klik)
    setPrompt("");

    setIsGenerating(true);
    setGenerationStep("");
    setRatioDropdownOpen(false);

    const ratioConfig = ASPECT_RATIOS.find((r) => r.id === selectedRatio) || ASPECT_RATIOS[0];

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToUse,
          size: ratioConfig.size,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.image) {
        throw new Error(data.error || "Gagal membuat gambar.");
      }

      const newEntry: GeneratedImage = {
        id: `img-${Date.now()}`,
        url: data.image,
        prompt: textToUse,
        translatedPrompt: data.translatedPrompt,
        model: "ming-image-0.1-design",
        aspectRatio: selectedRatio,
        width: ratioConfig.width,
        height: ratioConfig.height,
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

  const handleDownload = (img: GeneratedImage) => {
    try {
      setDownloading(true);
      const link = document.createElement("a");
      link.href = img.url;
      link.download = `usick-ming-design-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
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

  const handleSelectTemplate = (template: StyleTemplate) => {
    setPrompt(template.prompt);
    handleGenerate(template.prompt);
  };

  const currentRatioObj = ASPECT_RATIOS.find((r) => r.id === selectedRatio) || ASPECT_RATIOS[0];

  return (
    <div
      className={`flex flex-col h-full w-full overflow-hidden bg-transparent ${
        isDark ? "text-zinc-100" : "text-zinc-900"
      }`}
    >
      {/* ─── TOP APP HEADER ─────────────────────────────────────────────── */}
      <header className={`shrink-0 w-full z-20 flex items-center justify-between px-3.5 sm:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md ${
        isDark ? "bg-transparent text-white" : "bg-transparent text-zinc-900"
      }`}>
        <div className="flex items-center gap-2">
          {onTogglePanel && (
            <button
              onClick={onTogglePanel}
              className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-2xl transition cursor-pointer shrink-0 ${
                isDark
                  ? "bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white"
                  : "bg-transparent text-zinc-700 hover:bg-black/5 hover:text-black"
              }`}
              title="Menu Panel"
            >
              <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN SCROLL CONTAINER ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 pb-12 flex flex-col items-center justify-start sm:justify-center">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center my-auto pt-4 sm:pt-0">

          {/* 1. HERO HEADER */}
          <div className="text-center mb-6 sm:mb-8">
            {/* Pure Star Icon only (No Box/Kotak - Identical to chat & schedule tabs) */}
            <div className="relative mb-4 sm:mb-6 flex items-center justify-center animate-float">
              <svg
                className={`w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md transition-colors ${
                  isDark ? "text-white fill-white" : "text-black fill-black"
                }`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
            </div>

            {/* Headline */}
            <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${
              isDark ? "text-white" : "text-black"
            }`}>
              {getTimeGreeting()}, {userName || "Usick One"}
            </h1>

            {/* Subtitle */}
            <p className={`mt-2 text-base sm:text-lg font-medium max-w-md mx-auto px-2 ${
              isDark ? "text-zinc-400" : "text-black"
            }`}>
              Try a template or describe an idea in chat. Create with One image.
            </p>
          </div>

          {/* 2. MAIN CAPSULE INPUT CARD */}
          <div className="prompt-bar-glow relative w-full rounded-[30px] p-[1.5px] shadow-2xl transition-all">
            <div className={`w-full rounded-[28px] border transition-all relative ${
              isDark
                ? "bg-[#1c1c1f] border-zinc-800/80 shadow-black/80"
                : "bg-white border-zinc-200/80 shadow-zinc-200/80"
            }`}>
              <div className="p-4 sm:p-5 space-y-3">
              {/* Textarea Input */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  rows={2}
                  placeholder="Deskripsikan gambar Anda"
                  className={`w-full bg-transparent text-sm sm:text-base outline-none resize-none placeholder-zinc-500 leading-relaxed ${
                    isDark ? "text-white" : "text-zinc-900"
                  }`}
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between pt-1">
                {/* Left Side: Setting Rasio Dropdown Button */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setRatioDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                      isDark
                        ? "bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200"
                    }`}
                    title="Setting rasio aspek gambar"
                  >
                    <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={2} />
                    </svg>
                    <span>Setting rasio ({currentRatioObj.label.split(" ")[0]})</span>
                    <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Ratio Dropdown Menu */}
                  {ratioDropdownOpen && (
                    <div className={`absolute left-0 bottom-full mb-2 w-52 rounded-2xl border shadow-2xl p-1.5 z-40 animate-in fade-in-0 zoom-in-95 grid grid-cols-1 gap-1 ${
                      isDark ? "bg-[#1c1c1f] border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"
                    }`}>
                      <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                        Pilih Rasio Aspek
                      </div>
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => {
                            setSelectedRatio(ratio.id);
                            setRatioDropdownOpen(false);
                          }}
                          className={`p-2 rounded-xl text-left transition cursor-pointer border flex flex-col gap-0.5 ${
                            selectedRatio === ratio.id
                              ? (isDark ? "bg-zinc-800 border-zinc-600 text-white font-semibold" : "bg-zinc-100 border-zinc-300 text-black font-semibold")
                              : (isDark ? "border-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-white" : "border-transparent hover:bg-zinc-50 text-zinc-600 hover:text-black")
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{ratio.label}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{ratio.size}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">{ratio.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: One design Badge & Generate Button */}
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium select-none ${
                    isDark
                      ? "bg-zinc-800/60 text-zinc-400 border border-zinc-700/50"
                      : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                  }`}>
                    <span>One design</span>
                  </div>

                  <button
                    type="button"
                    disabled={!prompt.trim() || isGenerating}
                    onClick={() => handleGenerate()}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark
                        ? "bg-white hover:bg-zinc-200 text-black shadow-xs"
                        : "bg-black hover:bg-zinc-800 text-white shadow-xs"
                    }`}
                    title="Buat gambar sekarang (Enter)"
                  >
                    {isGenerating ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* 3. GENERATION PREVIEW / ACTIVE IMAGE SHOWCASE */}
          {(isGenerating || currentImage) && (
            <div className="w-full mt-6 animate-in fade-in-0 duration-300">
              {isGenerating ? (
                <div className={`aspect-square sm:aspect-video w-full rounded-3xl border flex flex-col items-center justify-center p-6 text-center animate-pulse ${
                  isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                }`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-3 border ${
                    isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-zinc-200 text-black shadow-sm"
                  }`}>
                    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                  <div className="mb-1">
                    <ShiningText text="One Image AI is thinking..." />
                  </div>
                  <p className={`text-xs max-w-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Mempersiapkan visual berkualitas tinggi...
                  </p>
                </div>
              ) : currentImage ? (
                <div className={`rounded-3xl border overflow-hidden shadow-2xl ${
                  isDark ? "bg-[#1c1c1f] border-zinc-800" : "bg-white border-zinc-200"
                }`}>
                  <div
                    className="relative group bg-black/40 flex items-center justify-center cursor-zoom-in overflow-hidden"
                    onClick={() => setPreviewImage(currentImage.url)}
                    style={{ maxHeight: "640px" }}
                  >
                    <img
                      src={currentImage.url}
                      alt={currentImage.prompt}
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 pointer-events-none">
                      <span className="px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold backdrop-blur-md">
                        🔍 Layar Penuh
                      </span>
                    </div>
                  </div>

                  {/* Info & Action Bar */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium leading-relaxed ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                        &ldquo;{currentImage.prompt}&rdquo;
                      </p>
                      <div className="flex items-center gap-2.5 mt-2 text-[11px] text-zinc-500">
                        <span>Model: <b className="text-zinc-400">One design</b></span>
                        <span>•</span>
                        <span>Ukuran: <b className="text-zinc-400">{currentImage.aspectRatio}</b></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleGenerate(currentImage.prompt)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          isDark
                            ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                        }`}
                        title="Buat ulang"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Variasi Baru</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(currentImage.prompt, "prompt")}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          isDark
                            ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                        }`}
                      >
                        <span>{copiedText === "prompt" ? "Disalin!" : "Salin Prompt"}</span>
                      </button>

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
                        {downloading ? "Mengunduh..." : "Unduh PNG"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* 4. TEMPLATE INSPIRATION CARDS (Exact match to uploaded layout) */}
          <div className="w-full mt-8 sm:mt-10 relative group/templates">
            {/* Desktop Left / Right Scroll Buttons */}
            <button
              type="button"
              onClick={() => scrollTemplates("left")}
              className={`hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 items-center justify-center rounded-full shadow-xl border transition-all cursor-pointer opacity-70 hover:opacity-100 ${
                isDark
                  ? "bg-zinc-900/95 hover:bg-zinc-800 text-white border-zinc-700 hover:scale-105"
                  : "bg-white/95 hover:bg-zinc-100 text-zinc-900 border-zinc-300 hover:scale-105"
              }`}
              title="Geser ke kiri"
              aria-label="Geser ke kiri"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => scrollTemplates("right")}
              className={`hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 items-center justify-center rounded-full shadow-xl border transition-all cursor-pointer opacity-70 hover:opacity-100 ${
                isDark
                  ? "bg-zinc-900/95 hover:bg-zinc-800 text-white border-zinc-700 hover:scale-105"
                  : "bg-white/95 hover:bg-zinc-100 text-zinc-900 border-zinc-300 hover:scale-105"
              }`}
              title="Geser ke kanan"
              aria-label="Geser ke kanan"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={templateScrollRef}
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              className="flex items-center gap-3.5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x justify-start select-none cursor-grab active:cursor-grabbing"
            >
              {TEMPLATES.map((tmpl) =>
                tmpl.isGrid ? (
                  /* 6th item: 2x2 Circular Avatars cluster */
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className="h-40 w-28 sm:h-48 sm:w-32 flex items-center justify-center p-1 shrink-0 snap-start cursor-pointer hover:scale-105 transition-all duration-300"
                    title="Buat ragam karakter avatar"
                  >
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {tmpl.circleImages?.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-white/20 shadow-md bg-zinc-800"
                        >
                          <img
                            src={imgUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 1st - 5th items: Rounded stadium cards */
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`group relative h-40 w-28 sm:h-48 sm:w-32 rounded-[28px] overflow-hidden cursor-pointer transition-all duration-300 shrink-0 snap-start border hover:scale-105 shadow-xl bg-zinc-900 ${
                      isDark ? "border-zinc-800/80 hover:border-zinc-600" : "border-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {tmpl.previewUrl ? (
                      <img
                        src={tmpl.previewUrl}
                        alt={tmpl.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${tmpl.gradient}`} />
                    )}

                    {/* Bottom Gradient Overlay & Title Label */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 pt-8 flex flex-col justify-end pointer-events-none">
                      <span className="text-xs sm:text-sm font-semibold text-white tracking-tight drop-shadow-md whitespace-pre-line leading-tight">
                        {tmpl.title}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 5. HISTORY GALLERY (If any exist) */}
          {history.length > 0 && (
            <div className="w-full mt-10 space-y-3 pt-6 border-t border-zinc-800/40">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  Riwayat Karya ({history.length})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">Tersimpan di browser</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Bersihkan seluruh riwayat gambar?")) {
                        saveHistory([]);
                        setCurrentImage(null);
                      }
                    }}
                    className={`p-1.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-center ${
                      isDark
                        ? "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 hover:text-red-400"
                        : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-red-600"
                    }`}
                    title="Hapus riwayat karya"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentImage(item)}
                    className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition aspect-square ${
                      currentImage?.id === item.id
                        ? "border-white ring-2 ring-white/30"
                        : (isDark ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-zinc-100")
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.prompt}
                      className="w-full h-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition">
                      <p className="text-[9px] text-white truncate font-medium">{item.prompt}</p>
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
