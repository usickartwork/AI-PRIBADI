'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  EMERGENCY_CATEGORIES,
  EMERGENCY_GUIDES,
} from '@/lib/emergency/data';
import { EMERGENCY_CONTACTS } from '@/lib/emergency/contacts';
import {
  EmergencyCategory,
  EmergencyGuide,
  NearbyFacility,
} from '@/lib/emergency/types';
import {
  fetchNearbyFacilitiesFromCoords,
  CURATED_MAJOR_FACILITIES,
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
  hasSubCategories?: boolean;
}

const MAIN_CATEGORIES: MainCategoryOption[] = [
  {
    key: 'kecelakaan',
    title: 'Kecelakaan',
    desc: 'Lalu lintas jalan raya, kendaraan, atau benturan fisik',
    defaultGuideId: 'guide-kecelakaan-lalin',
  },
  {
    key: 'kebakaran',
    title: 'Kebakaran',
    desc: 'Kobaran api, asap pekat gedung, atau bahaya ledakan gas',
    defaultGuideId: 'guide-kebakaran',
  },
  {
    key: 'kesehatan',
    title: 'Kondisi Medis',
    desc: 'Henti napas/jantung, tersedak, pingsan, stroke, pendarahan',
    defaultGuideId: 'guide-henti-jantung-medis',
    hasSubCategories: true,
  },
  {
    key: 'bencana',
    title: 'Bencana Alam',
    desc: 'Gempa bumi, banjir, tsunami, longsor, letusan gunung, badai',
    defaultGuideId: 'guide-gempa-bumi',
    hasSubCategories: true,
  },
  {
    key: 'lainnya',
    title: 'Lainnya',
    desc: 'Ancaman keamanan, sengatan listrik, keracunan, atau umum',
    defaultGuideId: 'guide-darurat-lainnya',
    hasSubCategories: true,
  },
];

// Sub-categories for Bencana Alam
const BENCANA_SUB_CATEGORIES = [
  { id: 'gempa-bumi', name: 'Gempa Bumi', guideId: 'guide-gempa-bumi' },
  { id: 'banjir', name: 'Banjir & Arus Deras', guideId: 'guide-banjir' },
  { id: 'tsunami', name: 'Peringatan Tsunami', guideId: 'guide-tsunami' },
  { id: 'tanah-longsor', name: 'Tanah Longsor', guideId: 'guide-tanah-longsor' },
  { id: 'letusan-gunung', name: 'Letusan Gunung Api', guideId: 'guide-letusan-gunung' },
  { id: 'cuaca-ekstrem', name: 'Cuaca Ekstrem & Badai Petir', guideId: 'guide-cuaca-ekstrem' },
];

// Sub-categories for Kondisi Medis
const MEDIS_SUB_CATEGORIES = [
  { id: 'henti-jantung-medis', name: 'Henti Jantung / Tidak Bernapas', guideId: 'guide-henti-jantung-medis' },
  { id: 'tersedak', name: 'Tersedak (Saluran Napas Tersumbat)', guideId: 'guide-tersedak' },
  { id: 'perdarahan-berat', name: 'Perdarahan Berat / Luka Dalam', guideId: 'guide-perdarahan-berat' },
  { id: 'pingsan', name: 'Pingsan / Hilang Kesadaran', guideId: 'guide-pingsan' },
  { id: 'dugaan-stroke', name: 'Dugaan Stroke (Bibir Mencong / Pelo)', guideId: 'guide-dugaan-stroke' },
  { id: 'keracunan', name: 'Keracunan Makanan / Kimia', guideId: 'guide-keracunan' },
];

// Sub-categories for Lainnya
const LAINNYA_SUB_CATEGORIES = [
  { id: 'keamanan-kekerasan', name: 'Ancaman Keamanan & Kejahatan', guideId: 'guide-keamanan-kekerasan' },
  { id: 'sengatan-listrik', name: 'Sengatan Listrik', guideId: 'guide-sengatan-listrik' },
  { id: 'kebocoran-gas', name: 'Kebocoran Gas LPG', guideId: 'guide-kebocoran-gas' },
  { id: 'darurat-lainnya', name: 'Darurat Umum / Bantuan Terpadu', guideId: 'guide-darurat-lainnya' },
];

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

  // Step 3 Expandable secondary panels (Keep step 3 clean by default)
  const [showChecklist, setShowChecklist] = useState(false);
  const [showFacilities, setShowFacilities] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);

  // Facilities Search State
  const [facilities, setFacilities] = useState<NearbyFacility[]>(CURATED_MAJOR_FACILITIES);
  const [manualCitySearch, setManualCitySearch] = useState('');

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

        // Pre-fetch nearby facilities in background
        const res = await fetchNearbyFacilitiesFromCoords(c.lat, c.lng, 'all');
        setFacilities(res);
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

  // Formatted report summary for copying to emergency operators
  const reportSummaryText = useMemo(() => {
    const categoryName =
      selectedSubCatName ||
      MAIN_CATEGORIES.find((c) => c.key === selectedMainCat)?.title ||
      'Keadaan Darurat';

    const victimLabel =
      victimStatus === 'trapped'
        ? 'Ada yang terjebak'
        : victimStatus === 'injured'
        ? 'Ada korban luka-luka'
        : victimStatus === 'unconscious'
        ? 'Ada korban tidak sadarkan diri'
        : victimStatus === 'none'
        ? 'Tidak ada korban jiwa/luka'
        : 'Belum dipastikan';

    const lines = [
      '=== LAPORAN KEADAAN DARURAT ===',
      `Jenis Kejadian: ${categoryName}`,
      `Lokasi: ${locationText.trim() || 'Lokasi belum ditentukan'}`,
      `Kondisi Korban: ${victimLabel}`,
    ];

    if (additionalNote.trim()) {
      lines.push(`Keterangan: ${additionalNote.trim()}`);
    }
    lines.push(`Waktu Laporan: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`);

    return lines.join('\n');
  }, [selectedSubCatName, selectedMainCat, locationText, victimStatus, additionalNote]);

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
    setShowChecklist(false);
    setShowFacilities(false);
    setShowAllContacts(false);
  };

  return (
    <div
      className={`h-full w-full flex flex-col overflow-y-auto select-none transition-colors duration-150 ${
        isDark ? 'bg-[#0c0c0e] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
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

      {/* ─── TOP APP BAR (Minimal & Discrete) ─────────────────────────────────── */}
      <header
        className={`sticky top-0 z-30 px-4 sm:px-6 py-2.5 backdrop-blur-md border-b flex items-center justify-between ${
          isDark
            ? 'bg-[#0c0c0e]/90 border-zinc-800/80 text-white'
            : 'bg-white/90 border-zinc-200/80 text-zinc-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTogglePanel}
            className={`p-2 rounded-full transition cursor-pointer shrink-0 ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
            }`}
            title="Menu Panel"
            aria-label="Menu Panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span className="text-sm font-bold tracking-tight">Emergency</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Discrete 112 Call pill */}
          <a
            href="tel:112"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 ${
              isDark
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-black text-white hover:bg-zinc-800'
            }`}
            title="Panggilan Darurat Bebas Pulsa 112"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
            </svg>
            <span>Panggil 112</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition cursor-pointer ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
            }`}
            title="Tutup"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── MAIN FOCUSED WORKSPACE (Clean & Spacious) ────────────────────────── */}
      <div className="flex-1 max-w-xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col justify-center">
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
              {MAIN_CATEGORIES.map((cat) => (
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
                  className={`w-full p-4 sm:p-4.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between gap-4 group active:scale-[0.99] ${
                    isDark
                      ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'
                      : 'bg-white border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h3 className="text-base font-bold tracking-tight group-hover:underline">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-white transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            {/* Discrete Footer Call Link */}
            <div className="pt-4 text-center">
              <p className="text-xs text-zinc-400">
                Kondisi darurat langsung mengancam nyawa?{' '}
                <a
                  href="tel:112"
                  className="font-bold underline text-white dark:text-zinc-100 hover:opacity-80"
                >
                  Hubungi 112 sekarang
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
              ).map((sub) => (
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
                  className={`w-full p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                    isDark
                      ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80 text-zinc-100'
                      : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-900'
                  }`}
                >
                  <span className="text-sm font-semibold">{sub.name}</span>
                  <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
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
              <p className="text-xs text-zinc-400">
                Kategori: <strong className="text-white dark:text-zinc-100 font-bold">{selectedSubCatName || 'Darurat'}</strong>
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
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                ← Kembali
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md active:scale-95 ${
                  isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                Lanjutkan ke Tindakan →
              </button>
            </div>

            {/* Direct Skip to Emergency Call */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Lewati formulir dan langsung hubungi nomor bantuan darurat ➔
              </button>
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

            {/* 1. Tombol Utama Hubungi 112 & Kontak Alternatif 0811-3530-112 */}
            <div className="space-y-2.5">
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
                    Panggilan Darurat Bebas Pulsa (Multi-Instansi)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Hubungi 112
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

              <a
                href="tel:08113530112"
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition cursor-pointer active:scale-98 ${
                  isDark
                    ? 'bg-zinc-900/60 hover:bg-zinc-800/80 text-white border-zinc-800'
                    : 'bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-200'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Kontak Alternatif Seluler / WhatsApp
                  </span>
                  <h4 className="text-base font-bold">0811-3530-112</h4>
                  <p className="text-[11px] text-zinc-400">Jalur pengaduan seluler 112</p>
                </div>
                <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </a>
            </div>

            {/* 2. Ringkasan Kejadian yang Bisa Disalin */}
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Ringkasan Laporan untuk Petugas</span>
                </span>

                <button
                  type="button"
                  onClick={() => copyToClipboard(reportSummaryText, 'Ringkasan laporan')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    isDark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-black'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Salin Teks</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono whitespace-pre-wrap text-zinc-300">
                {reportSummaryText}
              </pre>
            </div>

            {/* 3. Panduan Singkat Tindakan Pertama */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                Tindakan Pertama: {currentGuide.title}
              </h4>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Lakukan Sekarang:
                </span>
                <ul className="space-y-1.5">
                  {currentGuide.doNow.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="text-xs text-zinc-200 flex items-start gap-2">
                      <span className="font-mono font-bold text-zinc-400 shrink-0">{idx + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {currentGuide.dontDo.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Hindari:
                  </span>
                  <ul className="space-y-1">
                    {currentGuide.dontDo.slice(0, 2).map((item, idx) => (
                      <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                        <span className="text-zinc-500 font-bold shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 4. Bagian Terpisah (Expandable Accordion - Tidak Membebani Tampilan Utama) */}
            <div className="space-y-2 pt-1">
              {/* Accordion 1: Checklist Tindakan */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowChecklist((prev) => !prev)}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold transition cursor-pointer text-left"
                >
                  <span>✓ Checklist Tindakan Keselamatan</span>
                  <span className="text-zinc-500">{showChecklist ? '▲ Tutup' : '▼ Buka'}</span>
                </button>

                {showChecklist && (
                  <div className="p-3.5 pt-0 border-t border-zinc-800/60 space-y-2 animate-in fade-in-0 duration-150">
                    {currentGuide.checklist.map((item, idx) => {
                      const itemKey = `${currentGuide.id}-${item}`;
                      const isDone = !!checkedItems[itemKey];
                      return (
                        <label
                          key={idx}
                          onClick={() => toggleChecklistItem(itemKey)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl transition cursor-pointer select-none text-xs ${
                            isDone
                              ? 'text-zinc-500 line-through'
                              : isDark ? 'text-zinc-200 hover:bg-zinc-800/40' : 'text-zinc-800 hover:bg-zinc-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {}}
                            className="mt-0.5 accent-white cursor-pointer"
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 2: Fasilitas Rumah Sakit & Layanan Terdekat */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowFacilities((prev) => !prev)}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold transition cursor-pointer text-left"
                >
                  <span>🏥 Cari Fasilitas Medis Terdekat</span>
                  <span className="text-zinc-500">{showFacilities ? '▲ Tutup' : '▼ Buka'}</span>
                </button>

                {showFacilities && (
                  <div className="p-3.5 pt-0 border-t border-zinc-800/60 space-y-3 animate-in fade-in-0 duration-150">
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={manualCitySearch}
                        onChange={(e) => setManualCitySearch(e.target.value)}
                        placeholder="Ketik kota/daerah..."
                        className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-black'
                        }`}
                      />
                      <a
                        href={buildExternalSearchUrl(
                          manualCitySearch ? `Rumah Sakit IGD terdekat ${manualCitySearch}` : 'Rumah Sakit IGD terdekat',
                          coords
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-black'
                        }`}
                      >
                        Buka Maps ↗
                      </a>
                    </div>

                    <div className="space-y-2 pt-1">
                      {facilities.slice(0, 3).map((f) => (
                        <div
                          key={f.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <h5 className="font-bold truncate">{f.name}</h5>
                            <p className="text-[11px] text-zinc-400 truncate">{f.address || f.typeLabel}</p>
                          </div>
                          <a
                            href={f.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold underline shrink-0 hover:text-white"
                          >
                            Rute
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Kontak Darurat Resmi Lainnya */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowAllContacts((prev) => !prev)}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold transition cursor-pointer text-left"
                >
                  <span>📞 Nomor Darurat Instansi Lainnya (110, 113, 115, 119)</span>
                  <span className="text-zinc-500">{showAllContacts ? '▲ Tutup' : '▼ Buka'}</span>
                </button>

                {showAllContacts && (
                  <div className="p-3.5 pt-0 border-t border-zinc-800/60 space-y-2 animate-in fade-in-0 duration-150">
                    {EMERGENCY_CONTACTS.filter((c) => c.number !== '112' && c.id !== '0811-3530-112').map((c) => (
                      <div
                        key={c.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div>
                          <h5 className="font-bold">{c.name}</h5>
                          <span className="text-sm font-mono font-bold text-white dark:text-zinc-100">{c.displayNumber}</span>
                        </div>
                        <a
                          href={`tel:${c.number}`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            isDark ? 'bg-white text-black' : 'bg-black text-white'
                          }`}
                        >
                          Panggil
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                ← Ubah informasi laporan
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
