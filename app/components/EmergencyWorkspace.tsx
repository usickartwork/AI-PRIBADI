'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Car,
  Flame,
  HeartPulse,
  Mountain,
  ShieldAlert,
  Activity,
  Waves,
  Wind,
  CloudLightning,
  UserX,
  Brain,
  Skull,
  Zap,
  HelpCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  Hospital,
  ArrowLeft,
  ArrowRight,
  FileText,
} from 'lucide-react';
import {
  EMERGENCY_CATEGORIES,
  EMERGENCY_GUIDES,
} from '@/lib/emergency/data';
import {
  EmergencyCategory,
  EmergencyGuide,
} from '@/lib/emergency/types';
import {
  buildExternalSearchUrl,
} from '@/lib/emergency/facilities';

interface EmergencyWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  onTogglePanel: () => void;
}

// 5 Main Simplified Categories for Step 1
type MainCategoryKey = 'kecelakaan' | 'kebakaran' | 'kesehatan' | 'bencana' | 'lainnya';

interface MainCategoryOption {
  key: MainCategoryKey;
  title: string;
  desc: string;
  defaultGuideId: string;
  icon: React.ComponentType<{ className?: string }>;
  hasSubCategories?: boolean;
}

const MAIN_CATEGORIES: MainCategoryOption[] = [
  {
    key: 'kecelakaan',
    title: 'Kecelakaan',
    desc: 'Lalu lintas jalan raya, kendaraan, atau benturan fisik',
    defaultGuideId: 'guide-kecelakaan-lalin',
    icon: Car,
  },
  {
    key: 'kebakaran',
    title: 'Kebakaran',
    desc: 'Kobaran api, asap pekat gedung, atau bahaya ledakan gas',
    defaultGuideId: 'guide-kebakaran',
    icon: Flame,
  },
  {
    key: 'kesehatan',
    title: 'Kondisi Medis',
    desc: 'Henti napas/jantung, tersedak, pingsan, stroke, pendarahan',
    defaultGuideId: 'guide-henti-jantung-medis',
    icon: HeartPulse,
    hasSubCategories: true,
  },
  {
    key: 'bencana',
    title: 'Bencana Alam',
    desc: 'Gempa bumi, banjir, tsunami, longsor, letusan gunung, badai',
    defaultGuideId: 'guide-gempa-bumi',
    icon: Mountain,
    hasSubCategories: true,
  },
  {
    key: 'lainnya',
    title: 'Lainnya',
    desc: 'Ancaman keamanan, sengatan listrik, keracunan, atau umum',
    defaultGuideId: 'guide-darurat-lainnya',
    icon: HelpCircle,
    hasSubCategories: true,
  },
];

interface SubCategoryOption {
  id: string;
  name: string;
  guideId: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Sub-categories for Bencana Alam
const BENCANA_SUB_CATEGORIES: SubCategoryOption[] = [
  { id: 'gempa-bumi', name: 'Gempa Bumi', guideId: 'guide-gempa-bumi', icon: Activity },
  { id: 'banjir', name: 'Banjir & Arus Deras', guideId: 'guide-banjir', icon: Waves },
  { id: 'tsunami', name: 'Peringatan Tsunami', guideId: 'guide-tsunami', icon: Wind },
  { id: 'tanah-longsor', name: 'Tanah Longsor', guideId: 'guide-tanah-longsor', icon: Mountain },
  { id: 'letusan-gunung', name: 'Letusan Gunung Api', guideId: 'guide-letusan-gunung', icon: Flame },
  { id: 'cuaca-ekstrem', name: 'Cuaca Ekstrem & Badai Petir', guideId: 'guide-cuaca-ekstrem', icon: CloudLightning },
];

// Sub-categories for Kondisi Medis
const MEDIS_SUB_CATEGORIES: SubCategoryOption[] = [
  { id: 'henti-jantung-medis', name: 'Henti Jantung / Tidak Bernapas', guideId: 'guide-henti-jantung-medis', icon: HeartPulse },
  { id: 'tersedak', name: 'Tersedak (Saluran Napas Tersumbat)', guideId: 'guide-tersedak', icon: Wind },
  { id: 'perdarahan-berat', name: 'Perdarahan Berat / Luka Dalam', guideId: 'guide-perdarahan-berat', icon: ShieldAlert },
  { id: 'pingsan', name: 'Pingsan / Hilang Kesadaran', guideId: 'guide-pingsan', icon: UserX },
  { id: 'dugaan-stroke', name: 'Dugaan Stroke (Bibir Mencong / Pelo)', guideId: 'guide-dugaan-stroke', icon: Brain },
  { id: 'keracunan', name: 'Keracunan Makanan / Kimia', guideId: 'guide-keracunan', icon: Skull },
];

// Sub-categories for Lainnya
const LAINNYA_SUB_CATEGORIES: SubCategoryOption[] = [
  { id: 'keamanan-kekerasan', name: 'Ancaman Keamanan & Kejahatan', guideId: 'guide-keamanan-kekerasan', icon: ShieldAlert },
  { id: 'sengatan-listrik', name: 'Sengatan Listrik', guideId: 'guide-sengatan-listrik', icon: Zap },
  { id: 'kebocoran-gas', name: 'Kebocoran Gas LPG', guideId: 'guide-kebocoran-gas', icon: Flame },
  { id: 'darurat-lainnya', name: 'Darurat Umum / Bantuan Terpadu', guideId: 'guide-darurat-lainnya', icon: HelpCircle },
];

const getCategoryIcon = (guideId: string, catKey?: MainCategoryKey | null) => {
  const allSubs = [
    ...BENCANA_SUB_CATEGORIES,
    ...MEDIS_SUB_CATEGORIES,
    ...LAINNYA_SUB_CATEGORIES,
  ];
  const foundSub = allSubs.find((s) => s.guideId === guideId);
  if (foundSub) return foundSub.icon;

  const foundMain = MAIN_CATEGORIES.find(
    (m) => m.key === catKey || m.defaultGuideId === guideId
  );
  if (foundMain) return foundMain.icon;

  return ShieldAlert;
};

export default function EmergencyWorkspace({
  isDark,
  onClose,
  onTogglePanel,
}: EmergencyWorkspaceProps) {
  // Step indicator: 1 (Category selection) -> 2 (Short details) -> 3 (Emergency Actions)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Sub-category selector modal/view if category has sub-categories
  const [activeSubMenu, setActiveSubMenu] = useState<'bencana' | 'kesehatan' | 'lainnya' | null>(null);

  // Selected Category & Guide IDs
  const [selectedMainCat, setSelectedMainCat] = useState<MainCategoryKey | null>(null);
  const [selectedSubCatName, setSelectedSubCatName] = useState<string>('');
  const [selectedGuideId, setSelectedGuideId] = useState<string>('guide-darurat-lainnya');

  // Step 2 Inputs (Simple, Max 2-3 fields)
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [victimStatus, setVictimStatus] = useState<string>('unknown');
  const [additionalNote, setAdditionalNote] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Step 3 Segmented Navigation Tab State
  const [activeStep3Tab, setActiveStep3Tab] = useState<'actions' | 'summary' | 'checklist'>('actions');

  // Interactive Checklist State (stored in localStorage)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('usick-emergency-checklist');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2200);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} disalin ke clipboard!`);
    }
  };

  // Toggle checklist item
  const toggleChecklistItem = (itemKey: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      try {
        localStorage.setItem('usick-emergency-checklist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Geolocation request
  const handleRequestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Peramban Anda tidak mendukung penentuan lokasi GPS.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLocationText(`Koordinat: ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
        setIsLocating(false);
        showToast('Lokasi GPS berhasil diperoleh.');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Izin lokasi ditolak. Anda dapat mengetik lokasi secara manual.');
        } else {
          setLocationError('Gagal mendeteksi lokasi. Silakan ketik lokasi secara manual.');
        }
      },
      { timeout: 7000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  // Resolve current active guide
  const currentGuide = useMemo(() => {
    return (
      EMERGENCY_GUIDES.find((g) => g.id === selectedGuideId) ||
      EMERGENCY_GUIDES.find((g) => g.id === 'guide-darurat-lainnya')!
    );
  }, [selectedGuideId]);

  // Resolve category icon for current selection
  const SelectedIcon = useMemo(() => {
    return getCategoryIcon(selectedGuideId, selectedMainCat);
  }, [selectedGuideId, selectedMainCat]);

  // Resolved Category Name & Victim Label
  const currentCategoryName = useMemo(() => {
    return (
      selectedSubCatName ||
      MAIN_CATEGORIES.find((c) => c.key === selectedMainCat)?.title ||
      'Keadaan Darurat'
    );
  }, [selectedSubCatName, selectedMainCat]);

  const currentVictimLabel = useMemo(() => {
    return victimStatus === 'trapped'
      ? 'Ada yang terjebak'
      : victimStatus === 'injured'
      ? 'Ada korban luka-luka'
      : victimStatus === 'unconscious'
      ? 'Ada korban tidak sadarkan diri'
      : victimStatus === 'none'
      ? 'Tidak ada korban jiwa/luka'
      : 'Belum dipastikan';
  }, [victimStatus]);

  // Formatted report summary for copying to emergency operators
  const reportSummaryText = useMemo(() => {
    const lines = [
      '=== LAPORAN KEADAAN DARURAT ===',
      `Jenis Kejadian: ${currentCategoryName}`,
      `Lokasi: ${locationText.trim() || 'Lokasi belum ditentukan'}`,
      `Kondisi Korban: ${currentVictimLabel}`,
    ];

    if (additionalNote.trim()) {
      lines.push(`Keterangan: ${additionalNote.trim()}`);
    }
    lines.push(`Waktu Laporan: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`);

    return lines.join('\n');
  }, [currentCategoryName, locationText, currentVictimLabel, additionalNote]);

  // Reset to Step 1
  const handleReset = () => {
    setStep(1);
    setActiveSubMenu(null);
    setSelectedMainCat(null);
    setSelectedSubCatName('');
    setSelectedGuideId('guide-darurat-lainnya');
    setLocationText('');
    setCoords(null);
    setVictimStatus('unknown');
    setAdditionalNote('');
    setActiveStep3Tab('actions');
  };

  return (
    <div
      className={`h-full w-full flex flex-col overflow-y-auto select-none transition-colors duration-150 bg-transparent ${
        isDark ? 'text-zinc-100' : 'text-zinc-900'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <div
            className={`px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border ${
              isDark
                ? 'bg-zinc-800 text-white border-zinc-700/80'
                : 'bg-zinc-900 text-white border-zinc-800'
            }`}
          >
            {toastMessage}
          </div>
        </div>
      )}

      {/* ─── TOP APP BAR (Serasi & Identik Tab Chat AI: Floating, Transparent, No Box) ─── */}
      <header
        className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3.5 sm:px-6 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] bg-transparent pointer-events-none ${
          isDark ? "text-white" : "text-zinc-900"
        }`}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 3-line hamburger menu button on the LEFT (liquid glass circle, identik tab chat) */}
          {onTogglePanel && (
            <button
              onClick={onTogglePanel}
              className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                  : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
              }`}
              title="Menu Panel"
              aria-label="Menu Panel"
            >
              <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Close button on the RIGHT (liquid glass circle, identik gaya tombol chat) */}
          <button
            type="button"
            onClick={onClose}
            className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
            }`}
            title="Tutup"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── MAIN FOCUSED WORKSPACE (Clean & Spacious, Adjusted for Floating Top Bar) ─── */}
      <div className="flex-1 max-w-xl w-full mx-auto px-4 pt-16 sm:pt-20 pb-10 flex flex-col justify-center">
        {/* ══════════════════════════════════════════════════════════════════════
            STEP 1 — PILIH KEADAAN DARURAT (Maksimal 5 Pilihan Bersih)
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && !activeSubMenu && (
          <div className="space-y-6 animate-in fade-in-0 duration-200">
            {/* Clean Calm Title */}
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Apa yang sedang terjadi?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Pilih situasi darurat untuk panduan tindakan dan bantuan terpadu:
              </p>
            </div>

            {/* Exactly 5 Main Cards */}
            <div className="space-y-2.5">
              {MAIN_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      if (cat.key === 'bencana') {
                        setActiveSubMenu('bencana');
                      } else if (cat.key === 'kesehatan') {
                        setActiveSubMenu('kesehatan');
                      } else if (cat.key === 'lainnya') {
                        setActiveSubMenu('lainnya');
                      } else {
                        setSelectedMainCat(cat.key);
                        setSelectedSubCatName(cat.title);
                        setSelectedGuideId(cat.defaultGuideId);
                        setStep(2);
                      }
                    }}
                    className={`w-full p-4 sm:p-4.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between gap-3.5 group active:scale-[0.99] ${
                      isDark
                        ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'
                        : 'bg-white border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition ${
                          isDark
                            ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-200 group-hover:bg-zinc-700/80 group-hover:text-white'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-800 group-hover:bg-zinc-200 group-hover:text-black'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 shrink-0" />
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h3 className="text-base font-bold tracking-tight group-hover:underline">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate">
                          {cat.desc}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-white transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Discrete Footer Call & Direct WhatsApp Link */}
            <div className="pt-4 text-center">
              <p className="text-xs text-zinc-400">
                Kondisi darurat langsung mengancam nyawa?{' '}
                <a
                  href="tel:112"
                  className="font-bold underline text-white dark:text-zinc-100 hover:opacity-80"
                >
                  Hubungi 112
                </a>{' '}
                atau{' '}
                <a
                  href="https://wa.me/628113530112"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-white dark:text-zinc-100 hover:opacity-80"
                >
                  Direct WhatsApp (0811-3530-112)
                </a>
              </p>
            </div>
          </div>
        )}

        {/* ─── STEP 1 SUB-SELECTIONS (Bencana Alam / Kondisi Medis / Lainnya) ─── */}
        {step === 1 && activeSubMenu && (
          <div className="space-y-5 animate-in fade-in-0 duration-200">
            <div className="flex items-center gap-3 pb-2 border-b border-zinc-800/80">
              <button
                type="button"
                onClick={() => setActiveSubMenu(null)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Kembali</span>
              </button>

              <h3 className="text-base font-bold tracking-tight">
                {activeSubMenu === 'bencana' && 'Pilih Jenis Bencana Alam'}
                {activeSubMenu === 'kesehatan' && 'Pilih Kondisi Medis'}
                {activeSubMenu === 'lainnya' && 'Pilih Situasi Darurat'}
              </h3>
            </div>

            <div className="space-y-2">
              {(activeSubMenu === 'bencana'
                ? BENCANA_SUB_CATEGORIES
                : activeSubMenu === 'kesehatan'
                ? MEDIS_SUB_CATEGORIES
                : LAINNYA_SUB_CATEGORIES
              ).map((sub) => {
                const SubIcon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSelectedMainCat(activeSubMenu);
                      setSelectedSubCatName(sub.name);
                      setSelectedGuideId(sub.guideId);
                      setActiveSubMenu(null);
                      setStep(2);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] group ${
                      isDark
                        ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80 text-zinc-100'
                        : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition ${
                          isDark
                            ? 'bg-zinc-800/80 border-zinc-700/50 text-zinc-300 group-hover:text-white group-hover:bg-zinc-700/70'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-700 group-hover:text-black group-hover:bg-zinc-200'
                        }`}
                      >
                        <SubIcon className="w-4 h-4 shrink-0" />
                      </div>
                      <span className="text-sm font-semibold truncate group-hover:underline">{sub.name}</span>
                    </div>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0 group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 2 — INFORMASI SINGKAT (Maksimal 2-3 Pertanyaan Utama)
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in-0 duration-200">
            {/* Step Header */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Langkah 2 dari 3
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Informasi Singkat Kejadian
              </h2>
              <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                <span>Kategori:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
                  isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100' : 'bg-zinc-100 border-zinc-300 text-zinc-900'
                }`}>
                  <SelectedIcon className="w-3.5 h-3.5 shrink-0 text-zinc-300" />
                  <span>{selectedSubCatName || 'Darurat'}</span>
                </span>
              </p>
            </div>

            <div className="space-y-4">
              {/* Question 1: Lokasi Kejadian */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold block text-zinc-300">
                  1. Lokasi Kejadian (Jalan / Patokan Terdekat)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="Contoh: Jl. Sudirman dekat Halte Bus..."
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-500'
                        : 'bg-white border-zinc-300 text-black placeholder-zinc-400 focus:border-zinc-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    disabled={isLocating}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200'
                        : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-800'
                    }`}
                    title="Gunakan lokasi GPS perangkat"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{isLocating ? 'Mendeteksi...' : 'GPS'}</span>
                  </button>
                </div>
                {locationError && (
                  <p className="text-[11px] text-zinc-400">{locationError}</p>
                )}
              </div>

              {/* Question 2: Kondisi Korban */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold block text-zinc-300">
                  2. Apakah ada korban yang membutuhkan bantuan?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Tidak ada korban' },
                    { id: 'injured', label: 'Ada korban luka' },
                    { id: 'trapped', label: 'Ada yang terjebak' },
                    { id: 'unconscious', label: 'Korban tidak sadar' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVictimStatus(v.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                        victimStatus === v.id
                          ? isDark
                            ? 'bg-white text-black border-white'
                            : 'bg-black text-white border-black'
                          : isDark
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Keterangan Tambahan (Opsional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold block text-zinc-300">
                  3. Keterangan Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                  placeholder="Contoh: Asap di lantai 2, api membesar..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-500'
                      : 'bg-white border-zinc-300 text-black placeholder-zinc-400 focus:border-zinc-600'
                  }`}
                />
              </div>
            </div>

            {/* Navigation Buttons for Step 2 */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 ${
                  isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                <span>Lanjutkan ke Tindakan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Skip to Emergency Call or Direct WhatsApp */}
            <div className="text-center pt-2 flex items-center justify-center gap-2 text-xs text-zinc-400 flex-wrap">
              <span>Lewati formulir:</span>
              <a
                href="tel:112"
                className="font-bold underline text-white dark:text-zinc-100 hover:opacity-80"
              >
                Panggil 112
              </a>
              <span>atau</span>
              <a
                href="https://wa.me/628113530112"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-white dark:text-zinc-100 hover:opacity-80"
              >
                Direct WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 3 — TINDAKAN DARURAT (Fokus Hanya Informasi Penting)
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in-0 duration-200">
            {/* Step Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Langkah 3 dari 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Tindakan Darurat
                </h2>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  isDark ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-zinc-300 text-zinc-600 hover:text-black'
                }`}
              >
                Mulai Baru
              </button>
            </div>

            {/* 1. Opsi 1: Panggil 112 Langsung & Opsi 2: Direct WhatsApp 0811-3530-112 */}
            <div className="space-y-2.5">
              {/* Opsi 1: Call 112 Langsung */}
              <a
                href="tel:112"
                className={`w-full p-4.5 rounded-2xl flex items-center justify-between border transition cursor-pointer active:scale-98 shadow-xl ${
                  isDark
                    ? 'bg-white text-black hover:bg-zinc-200 border-white'
                    : 'bg-black text-white hover:bg-zinc-800 border-black'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    Opsi 1 — Panggilan Telepon Bebas Pulsa (Multi-Instansi)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Panggil 112 Langsung
                  </h3>
                  <p className="text-xs opacity-80">
                    Polisi, Medis/Ambulans, Pemadam Kebakaran, dan SAR
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 shrink-0">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
                  </svg>
                </div>
              </a>

              {/* Opsi 2: Direct WhatsApp 0811-3530-112 */}
              <a
                href={`https://wa.me/628113530112?text=${encodeURIComponent(reportSummaryText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition cursor-pointer active:scale-98 ${
                  isDark
                    ? 'bg-zinc-900/80 hover:bg-zinc-800 text-white border-zinc-700/80'
                    : 'bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-300'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Opsi 2 — Direct WhatsApp Resmi 112
                  </span>
                  <h4 className="text-base sm:text-lg font-bold">Direct WhatsApp 0811-3530-112</h4>
                  <p className="text-[11px] text-zinc-400">Kirim teks laporan darurat langsung ke WhatsApp 112</p>
                </div>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}>
                  <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </a>
            </div>

            {/* 2. Segmented Navigation Tabs */}
            <div
              className={`grid grid-cols-3 gap-1 p-1 rounded-xl border text-xs font-semibold ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveStep3Tab('actions')}
                className={`py-2 px-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeStep3Tab === 'actions'
                    ? isDark
                      ? 'bg-zinc-800 text-white shadow-sm font-bold'
                      : 'bg-white text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Tindakan Cepat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep3Tab('summary')}
                className={`py-2 px-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeStep3Tab === 'summary'
                    ? isDark
                      ? 'bg-zinc-800 text-white shadow-sm font-bold'
                      : 'bg-white text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Ringkasan Laporan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep3Tab('checklist')}
                className={`py-2 px-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeStep3Tab === 'checklist'
                    ? isDark
                      ? 'bg-zinc-800 text-white shadow-sm font-bold'
                      : 'bg-white text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Checklist</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Tindakan Cepat */}
            {activeStep3Tab === 'actions' && (
              <div className="space-y-3.5 animate-in fade-in-0 duration-150">
                <div className="flex items-center gap-2">
                  <SelectedIcon className="w-4 h-4 shrink-0 text-zinc-300" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Panduan Cepat: {currentGuide.title}
                  </h4>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Lakukan Sekarang:
                  </span>
                  <div className="space-y-2">
                    {currentGuide.doNow.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                          isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 ${
                            isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <p className="text-xs font-medium leading-relaxed text-zinc-200">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {currentGuide.dontDo.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Hindari:
                    </span>
                    <div className="space-y-2">
                      {currentGuide.dontDo.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                            isDark ? 'bg-zinc-900/20 border-zinc-800/50 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full flex items-center justify-center bg-zinc-800/60 text-zinc-400 shrink-0 mt-0.5">
                            <X className="w-3 h-3" />
                          </div>
                          <p className="text-xs leading-relaxed">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Ringkasan Laporan */}
            {activeStep3Tab === 'summary' && (
              <div className="space-y-3 animate-in fade-in-0 duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span>Format Laporan untuk Petugas</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(reportSummaryText, 'Ringkasan laporan')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      isDark ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks Lengkap</span>
                  </button>
                </div>

                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-zinc-800/50">
                    <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Kejadian</span>
                    <span className="text-xs font-bold text-right text-zinc-100 dark:text-white">
                      {currentCategoryName}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-zinc-800/50">
                    <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Lokasi</span>
                    <span className="text-xs font-medium text-right text-zinc-200 break-words max-w-[70%]">
                      {locationText.trim() || 'Lokasi belum ditentukan'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-zinc-800/50">
                    <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Kondisi Korban</span>
                    <span className="text-xs font-medium text-right text-zinc-200">
                      {currentVictimLabel}
                    </span>
                  </div>

                  {additionalNote.trim() && (
                    <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-zinc-800/50">
                      <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Keterangan</span>
                      <span className="text-xs font-medium text-right text-zinc-200 max-w-[70%]">
                        {additionalNote.trim()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                    <span>Format ringkas untuk dibacakan / dikirim</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(reportSummaryText, 'Ringkasan laporan')}
                      className="text-xs font-bold text-white dark:text-zinc-200 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Teks Lengkap</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Checklist Keselamatan */}
            {activeStep3Tab === 'checklist' && (
              <div className="space-y-3 animate-in fade-in-0 duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-zinc-400" />
                    <span>Checklist Tindakan Keselamatan</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {currentGuide.checklist.filter((item) => !!checkedItems[`${currentGuide.id}-${item}`]).length} / {currentGuide.checklist.length} Selesai
                  </span>
                </div>

                <div className="space-y-2">
                  {currentGuide.checklist.map((item, idx) => {
                    const itemKey = `${currentGuide.id}-${item}`;
                    const isDone = !!checkedItems[itemKey];
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleChecklistItem(itemKey)}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition cursor-pointer select-none text-xs ${
                          isDone
                            ? 'bg-zinc-900/20 border-zinc-800/40 text-zinc-500 line-through'
                            : isDark
                            ? 'bg-zinc-900/40 border-zinc-800 text-zinc-200 hover:bg-zinc-800/60'
                            : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="mt-0.5 accent-white cursor-pointer"
                        />
                        <span className="leading-relaxed">{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Cari Fasilitas Medis Terdekat (Langsung Tombol Saja) */}
            <div className="pt-1">
              <a
                href={buildExternalSearchUrl('Rumah Sakit IGD terdekat', coords)}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full p-4 rounded-2xl border text-xs font-bold flex items-center justify-between transition cursor-pointer active:scale-98 ${
                  isDark
                    ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                    : 'bg-white/80 hover:bg-zinc-100 text-zinc-900 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Hospital className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Cari Fasilitas Medis Terdekat</span>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 shrink-0" />
              </a>
            </div>

            {/* Back Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ubah informasi laporan</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── FOOTER (Concise Disclaimer) ───────────────────────────────────────── */}
      <footer className="py-4 border-t border-zinc-800/60 text-center text-[11px] text-zinc-500">
        Emergency Usick One — Panduan keselamatan umum. Tidak menggantikan tindakan tenaga medis/petugas darurat.
      </footer>
    </div>
  );
}
