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
  EmergencyContact,
  NearbyFacility,
  EmergencyTriageState,
} from '@/lib/emergency/types';
import {
  fetchNearbyFacilitiesFromCoords,
  getFallbackNearbyFacilities,
  buildExternalSearchUrl,
  CURATED_MAJOR_FACILITIES,
} from '@/lib/emergency/facilities';

interface EmergencyWorkspaceProps {
  isDark: boolean;
  onClose: () => void;
  onTogglePanel: () => void;
}

export default function EmergencyWorkspace({
  isDark,
  onClose,
  onTogglePanel,
}: EmergencyWorkspaceProps) {
  // Navigation sub-tabs inside Emergency
  const [activeTab, setActiveTab] = useState<'triage' | 'guides' | 'contacts' | 'facilities'>('triage');

  // Online / Offline status
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Search keyword for guides
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Currently opened detail guide
  const [selectedGuide, setSelectedGuide] = useState<EmergencyGuide | null>(null);

  // Checklist state stored in localStorage
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

  // 3-Step Triage State
  const [triage, setTriage] = useState<EmergencyTriageState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('usick-emergency-triage');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      step: 1,
      categoryId: null,
      location: '',
      useGps: false,
      coords: null,
      victimStatus: 'unknown',
      severity: 'medium',
      additionalNotes: '',
    };
  });

  // Facilities Search State
  const [facilities, setFacilities] = useState<NearbyFacility[]>(CURATED_MAJOR_FACILITIES);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'hospital' | 'police' | 'fire_station'>('all');
  const [manualCitySearch, setManualCitySearch] = useState('');

  // Track online/offline status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Save checklist state to localStorage
  const toggleChecklistItem = (itemKey: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      try {
        localStorage.setItem('usick-emergency-checklist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetGuideChecklist = (guideId: string) => {
    const guide = EMERGENCY_GUIDES.find((g) => g.id === guideId);
    if (!guide) return;
    setCheckedItems((prev) => {
      const next = { ...prev };
      guide.checklist.forEach((item) => {
        delete next[`${guideId}-${item}`];
      });
      try {
        localStorage.setItem('usick-emergency-checklist', JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast('Checklist telah direset.');
  };

  // Toast trigger
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2200);
  }, []);

  // Copy number / text handler
  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} disalin ke clipboard!`);
    }
  };

  // Persist triage state
  const updateTriage = (updates: Partial<EmergencyTriageState>) => {
    setTriage((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('usick-emergency-triage', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetTriage = () => {
    const defaultState: EmergencyTriageState = {
      step: 1,
      categoryId: null,
      location: '',
      useGps: false,
      coords: null,
      victimStatus: 'unknown',
      severity: 'medium',
      additionalNotes: '',
    };
    setTriage(defaultState);
    try {
      localStorage.removeItem('usick-emergency-triage');
    } catch {}
  };

  // Request Geolocation Explicitly
  const handleRequestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Perangkat atau browser Anda tidak mendukung fitur Geolocation.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateTriage({
          useGps: true,
          coords,
          location: `Koordinat: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
        });

        // Also fetch nearby facilities
        const results = await fetchNearbyFacilitiesFromCoords(coords.lat, coords.lng, facilityFilter);
        setFacilities(results);
        setIsLocating(false);
        showToast('Lokasi perangkat berhasil diperoleh.');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Izin akses lokasi ditolak. Anda tetap dapat memasukkan lokasi secara manual.');
        } else if (err.code === err.TIMEOUT) {
          setLocationError('Waktu pengambilan lokasi habis. Silakan coba lagi atau ketik manual.');
        } else {
          setLocationError('Lokasi tidak dapat ditentukan. Silakan gunakan pencarian manual.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return EMERGENCY_CATEGORIES.filter((cat) => {
      const matchGroup = selectedGroup === 'all' || cat.group === selectedGroup;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        cat.name.toLowerCase().includes(query) ||
        cat.shortDesc.toLowerCase().includes(query) ||
        cat.keywords.some((kw) => kw.toLowerCase().includes(query));
      return matchGroup && matchQuery;
    });
  }, [searchQuery, selectedGroup]);

  // Selected Triage Category & Guide
  const selectedTriageCategory = useMemo(() => {
    return EMERGENCY_CATEGORIES.find((c) => c.id === triage.categoryId) || null;
  }, [triage.categoryId]);

  const selectedTriageGuide = useMemo(() => {
    if (!triage.categoryId) return null;
    return EMERGENCY_GUIDES.find((g) => g.categoryId === triage.categoryId) || null;
  }, [triage.categoryId]);

  // Generate Report Summary for Operator
  const reportSummaryText = useMemo(() => {
    const lines = [
      '=== LAPORAN KEADAAN DARURAT ===',
      `Jenis Darurat: ${selectedTriageCategory?.name || 'Umum'}`,
      `Lokasi: ${triage.location.trim() || 'Lokasi belum ditentukan'}`,
      `Kondisi Korban: ${
        triage.victimStatus === 'trapped'
          ? 'Ada orang terjebak'
          : triage.victimStatus === 'injured'
          ? 'Ada korban luka-luka'
          : triage.victimStatus === 'unconscious'
          ? 'Ada korban tidak sadarkan diri'
          : triage.victimStatus === 'none'
          ? 'Tidak ada korban jiwa/luka'
          : 'Belum dipastikan'
      }`,
      `Tingkat Urgensi: ${
        triage.severity === 'critical' ? 'Kritis / Mengancam Nyawa' : triage.severity === 'medium' ? 'Sedang' : 'Ringan'
      }`,
    ];
    if (triage.additionalNotes.trim()) {
      lines.push(`Keterangan Tambahan: ${triage.additionalNotes.trim()}`);
    }
    lines.push('Waktu Laporan: ' + new Date().toLocaleString('id-ID'));
    return lines.join('\n');
  }, [selectedTriageCategory, triage]);

  return (
    <div
      className={`h-full w-full flex flex-col overflow-y-auto select-none transition-colors duration-150 ${
        isDark ? 'bg-[#0a0a0c] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
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

      {/* ─── TOP APP BAR ──────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-30 px-3.5 sm:px-6 py-2.5 backdrop-blur-md border-b flex items-center justify-between ${
          isDark
            ? 'bg-[#0a0a0c]/90 border-zinc-800/80 text-white'
            : 'bg-white/90 border-zinc-200/80 text-zinc-900'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate flex items-center gap-1.5">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Emergency Center</span>
              </h1>

              {/* Online / Offline badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  isOnline
                    ? isDark
                      ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700/80'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                    : isDark
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : 'bg-zinc-200 text-zinc-600 border-zinc-400'
                }`}
                title={isOnline ? 'Terhubung ke jaringan' : 'Mode Offline: Seluruh panduan dan nomor darurat tetap dapat diakses'}
              >
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate hidden sm:block">
              Panduan keselamatan, kontak darurat resmi Indonesia, dan tindakan darurat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Call 112 button in header */}
          <a
            href="tel:112"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 ${
              isDark
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-black text-white hover:bg-zinc-800'
            }`}
            title="Telepon Panggilan Darurat 112 Bebas Pulsa"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
            </svg>
            <span>Panggil 112</span>
          </a>

          {/* Close button returning to chat */}
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition cursor-pointer ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
            }`}
            title="Tutup Emergency Center"
            aria-label="Tutup Emergency Center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ───────────────────────────────────────────── */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-3.5 sm:p-6 space-y-5">
        {/* ─── CRITICAL BANNER: BUTUH BANTUAN SEKARANG? ─────────────────────── */}
        <section
          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
            isDark
              ? 'bg-zinc-900/90 border-zinc-700/80 shadow-xl'
              : 'bg-zinc-100 border-zinc-300 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-300 dark:text-zinc-200">
                  Butuh Bantuan Sekarang?
                </h2>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl">
                Jika kondisi mengancam nyawa atau keselamatan, segera hubungi kontak darurat di bawah.
                <strong className="text-zinc-200 font-semibold block mt-0.5">
                  Jangan menunggu balasan teks atau mengisi formulir jika dalam situasi bahaya langsung.
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href="tel:112"
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-lg active:scale-95 ${
                  isDark
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'bg-black text-white hover:bg-zinc-800'
                }`}
                title="Panggilan Darurat Bebas Pulsa 112"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
                </svg>
                <span>Telepon 112</span>
              </a>

              <a
                href="tel:08113530112"
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-200 hover:text-white'
                    : 'bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-800 hover:text-black'
                }`}
                title="Kontak Seluler / WhatsApp 112"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>0811-3530-112</span>
              </a>
            </div>
          </div>
        </section>

        {/* ─── WORKSPACE NAVIGATION TABS ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab('triage');
              setSelectedGuide(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'triage'
                ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            Alur 3-Langkah
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('guides');
              setSelectedGuide(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'guides'
                ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            Katalog Panduan ({EMERGENCY_CATEGORIES.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('contacts');
              setSelectedGuide(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'contacts'
                ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            Kontak Darurat Resmi
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('facilities');
              setSelectedGuide(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'facilities'
                ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            Fasilitas Terdekat
          </button>
        </div>

        {/* ─── TAB 1: 3-STEP TRIAGE MECHANISM (ADDENDUM) ─────────────────────── */}
        {activeTab === 'triage' && (
          <div className="space-y-5 animate-in fade-in-0 duration-150">
            {/* Step Progress Indicator */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Langkah {triage.step} dari 3
                </span>
                <h3 className="text-base sm:text-lg font-bold">
                  {triage.step === 1 && 'Pilih Jenis Keadaan Darurat'}
                  {triage.step === 2 && 'Informasi Singkat Kejadian'}
                  {triage.step === 3 && 'Tindakan Darurat & Nomor Bantuan'}
                </h3>
              </div>

              {triage.step > 1 && (
                <button
                  type="button"
                  onClick={resetTriage}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    isDark ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-zinc-300 text-zinc-600 hover:text-black'
                  }`}
                >
                  Mulai Dari Awal
                </button>
              )}
            </div>

            {/* STEP 1: PILIH JENIS DARURAT */}
            {triage.step === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Pilih kejadian yang sedang dialami untuk menyesuaikan panduan keselamatan dan nomor rujukan yang tepat:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {EMERGENCY_CATEGORIES.map((cat) => {
                    const isSelected = triage.categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          updateTriage({ categoryId: cat.id, step: 2 });
                        }}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 active:scale-98 ${
                          isSelected
                            ? isDark
                              ? 'bg-zinc-800 border-white text-white'
                              : 'bg-zinc-200 border-black text-black'
                            : isDark
                            ? 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-200'
                            : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            {cat.groupLabel}
                          </span>
                          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold truncate">{cat.name}</h4>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{cat.shortDesc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Direct skip button */}
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => updateTriage({ step: 3, categoryId: triage.categoryId || 'darurat-lainnya' })}
                    className={`text-xs underline text-zinc-400 hover:text-white transition cursor-pointer`}
                  >
                    Lewati formulir dan langsung buka nomor panggilan & tindakan darurat ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: INFORMASI SINGKAT */}
            {triage.step === 2 && (
              <div className="space-y-5 max-w-2xl">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div>
                    <span className="text-zinc-400">Kategori Terpilih: </span>
                    <strong className="text-white dark:text-zinc-100 font-bold">
                      {selectedTriageCategory?.name || 'Darurat Umum'}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateTriage({ step: 1 })}
                    className="text-xs underline text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Ganti Kategori
                  </button>
                </div>

                {/* 1. Lokasi Kejadian */}
                <div className="space-y-2">
                  <label className="text-xs font-bold block text-zinc-300">
                    1. Lokasi Kejadian (Jalan / Kelurahan / Patokan)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={triage.location}
                      onChange={(e) => updateTriage({ location: e.target.value })}
                      placeholder="Contoh: Jl. Sudirman No. 12 dekat Kantor Pos..."
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
                      title="Gunakan lokasi GPS perangkat saat ini"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{isLocating ? 'Mencari...' : 'Gunakan GPS'}</span>
                    </button>
                  </div>
                  {locationError && (
                    <p className="text-[11px] text-zinc-400 mt-1">{locationError}</p>
                  )}
                </div>

                {/* 2. Kondisi Korban */}
                <div className="space-y-2">
                  <label className="text-xs font-bold block text-zinc-300">
                    2. Kondisi Korban atau Orang Terdampak
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: 'Tidak ada korban' },
                      { id: 'injured', label: 'Ada luka-luka' },
                      { id: 'trapped', label: 'Ada yang terjebak' },
                      { id: 'unconscious', label: 'Tidak sadar' },
                      { id: 'unknown', label: 'Belum dipastikan' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => updateTriage({ victimStatus: v.id as any })}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                          triage.victimStatus === v.id
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

                {/* 3. Tingkat Kejadian */}
                <div className="space-y-2">
                  <label className="text-xs font-bold block text-zinc-300">
                    3. Skala Urgensi Kejadian
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'critical', label: 'Kritis / Mendesak' },
                      { id: 'medium', label: 'Sedang' },
                      { id: 'low', label: 'Terkendali / Ringan' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateTriage({ severity: s.id as any })}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                          triage.severity === s.id
                            ? isDark
                              ? 'bg-white text-black border-white'
                              : 'bg-black text-white border-black'
                            : isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Keterangan Tambahan (Opsional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block text-zinc-300">
                    4. Keterangan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={triage.additionalNotes}
                    onChange={(e) => updateTriage({ additionalNotes: e.target.value })}
                    placeholder="Contoh: Api menjalar dari dapur lantai 2, bau kabel hangus..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition resize-none ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-500'
                        : 'bg-white border-zinc-300 text-black placeholder-zinc-400 focus:border-zinc-600'
                    }`}
                  />
                </div>

                {/* Navigation Buttons for Step 2 */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => updateTriage({ step: 1 })}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    ← Kembali
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateTriage({ step: 3 })}
                      className={`px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white transition cursor-pointer`}
                    >
                      Lewati
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTriage({ step: 3 })}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md active:scale-95 ${
                        isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                      }`}
                    >
                      Lanjutkan ke Tindakan →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TINDAKAN DARURAT */}
            {triage.step === 3 && (
              <div className="space-y-6">
                {/* 1. Quick Emergency Calls Section */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border ${
                    isDark ? 'bg-zinc-900/90 border-zinc-700/80' : 'bg-zinc-100 border-zinc-300'
                  }`}
                >
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Lakukan Panggilan Darurat Sekarang</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href="tel:112"
                      className={`p-4 rounded-xl flex items-center justify-between border transition cursor-pointer active:scale-98 ${
                        isDark
                          ? 'bg-white text-black hover:bg-zinc-200 border-white'
                          : 'bg-black text-white hover:bg-zinc-800 border-black'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                          Bebas Pulsa / Multi-Instansi
                        </span>
                        <h5 className="text-lg font-black tracking-tight">Telepon 112</h5>
                        <p className="text-[11px] opacity-80">Panggilan Darurat Terpadu</p>
                      </div>
                      <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
                      </svg>
                    </a>

                    <a
                      href="tel:08113530112"
                      className={`p-4 rounded-xl flex items-center justify-between border transition cursor-pointer active:scale-98 ${
                        isDark
                          ? 'bg-zinc-800/80 hover:bg-zinc-700/80 text-white border-zinc-700'
                          : 'bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Jalur Seluler / WhatsApp
                        </span>
                        <h5 className="text-base sm:text-lg font-bold">0811-3530-112</h5>
                        <p className="text-[11px] text-zinc-400">Pengaduan Seluler 112</p>
                      </div>
                      <svg className="w-6 h-6 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* 2. Salin Ringkasan Laporan untuk Operator */}
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
                      <span>Ringkasan Informasi untuk Operator Darurat</span>
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
                      <span>Salin Ringkasan</span>
                    </button>
                  </div>

                  <pre className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono whitespace-pre-wrap text-zinc-300 overflow-x-auto">
                    {reportSummaryText}
                  </pre>
                  <p className="text-[11px] text-zinc-400">
                    Bacakan teks di atas saat operator 112 menjawab panggilan Anda, atau tempelkan pada pesan pengaduan.
                  </p>
                </div>

                {/* 3. Panduan Tindakan Khusus Kategori */}
                {selectedTriageGuide && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                      <h4 className="text-sm font-bold text-zinc-200">
                        Panduan Keselamatan: {selectedTriageGuide.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setSelectedGuide(selectedTriageGuide)}
                        className="text-xs underline text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Buka Panduan Lengkap ➔
                      </button>
                    </div>

                    {/* Lakukan Sekarang */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                        Lakukan Sekarang:
                      </span>
                      <ul className="space-y-1.5 pt-1">
                        {selectedTriageGuide.doNow.slice(0, 4).map((step, idx) => (
                          <li key={idx} className="text-xs flex items-start gap-2 text-zinc-200">
                            <span className="font-mono text-zinc-400 shrink-0 font-bold">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Jangan Lakukan */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                        Hindari Tindakan Berbahaya Ini:
                      </span>
                      <ul className="space-y-1 pt-1">
                        {selectedTriageGuide.dontDo.map((item, idx) => (
                          <li key={idx} className="text-xs flex items-start gap-2 text-zinc-400">
                            <span className="text-zinc-500 shrink-0 font-bold">✕</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Checklist Tindakan */}
                    <div
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200">Checklist Tindakan Darurat</span>
                        <button
                          type="button"
                          onClick={() => resetGuideChecklist(selectedTriageGuide.id)}
                          className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>

                      <div className="space-y-2">
                        {selectedTriageGuide.checklist.map((item, idx) => {
                          const itemKey = `${selectedTriageGuide.id}-${item}`;
                          const isDone = !!checkedItems[itemKey];
                          return (
                            <label
                              key={idx}
                              onClick={() => toggleChecklistItem(itemKey)}
                              className={`flex items-start gap-2.5 p-2 rounded-xl transition cursor-pointer select-none ${
                                isDone
                                  ? isDark ? 'bg-zinc-800/60 text-zinc-400 line-through' : 'bg-zinc-100 text-zinc-400 line-through'
                                  : isDark ? 'hover:bg-zinc-800/40 text-zinc-200' : 'hover:bg-zinc-50 text-zinc-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => {}}
                                className="mt-0.5 accent-white cursor-pointer"
                              />
                              <span className="text-xs leading-relaxed">{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Back to Step 2 Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => updateTriage({ step: 2 })}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isDark ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-zinc-300 text-zinc-700 hover:text-black'
                    }`}
                  >
                    ← Edit Informasi Laporan
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('facilities')}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isDark ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 text-black'
                    }`}
                  >
                    Cari Fasilitas Rumah Sakit Terdekat ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: KATALOG PANDUAN DARURAT (18 KATEGORI) ────────────────────── */}
        {activeTab === 'guides' && !selectedGuide && (
          <div className="space-y-4 animate-in fade-in-0 duration-150">
            {/* Search and Group Filters */}
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari panduan darurat (misal: kebakaran, gempa, cpr, tersedak, stroke)..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600'
                      : 'bg-white border-zinc-300 text-black placeholder-zinc-400 focus:border-zinc-500'
                  }`}
                />
                <svg
                  className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Group Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'bencana', label: 'Bencana Alam' },
                  { id: 'kesehatan', label: 'Kesehatan & Medis' },
                  { id: 'kecelakaan', label: 'Kecelakaan' },
                  { id: 'keamanan', label: 'Keamanan' },
                ].map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setSelectedGroup(grp.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 border ${
                      selectedGroup === grp.id
                        ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                        : isDark ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-zinc-300 text-zinc-600 hover:text-black'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Guides Grid */}
            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-zinc-800 rounded-2xl p-6">
                <p className="text-sm font-semibold text-zinc-400">
                  Panduan tidak ditemukan untuk &quot;{searchQuery}&quot;
                </p>
                <p className="text-xs text-zinc-500">
                  Jika sedang menghadapi bahaya langsung, silakan hubungi kontak darurat terpadu 112.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:text-white"
                >
                  Tampilkan Semua Panduan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCategories.map((cat) => {
                  const guide = EMERGENCY_GUIDES.find((g) => g.categoryId === cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => guide && setSelectedGuide(guide)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 group ${
                        isDark
                          ? 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-700'
                          : 'bg-white border-zinc-200 hover:bg-zinc-100/80'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            {cat.groupLabel}
                          </span>
                          <span className="text-xs text-zinc-500 group-hover:text-white transition">
                            Buka →
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-100 group-hover:underline">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {cat.shortDesc}
                        </p>
                      </div>

                      {guide && (
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/60 pt-2.5">
                          <span>{guide.checklist.length} langkah tindakan</span>
                          <span>Ditinjau {guide.reviewDate}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── DETAIL VIEW FOR SELECTED GUIDE ─────────────────────────────────── */}
        {selectedGuide && (
          <div className="space-y-5 animate-in fade-in-0 duration-150">
            {/* Top Bar inside Guide Detail */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <button
                type="button"
                onClick={() => setSelectedGuide(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                ← Kembali ke Daftar
              </button>

              <div className="text-[11px] text-zinc-400">
                Verifikasi: {selectedGuide.reviewDate}
              </div>
            </div>

            {/* Guide Header */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {selectedGuide.title}
              </h2>
              <p className="text-xs text-zinc-400">
                {selectedGuide.applicableWhen}
              </p>
            </div>

            {/* 1. Lakukan Sekarang */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/80 border-zinc-700/80' : 'bg-white border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-200">
                  Lakukan Sekarang (Prioritas Utama)
                </h3>
              </div>

              <ol className="space-y-2">
                {selectedGuide.doNow.map((step, idx) => (
                  <li key={idx} className="text-xs sm:text-sm flex items-start gap-2.5 text-zinc-200">
                    <span className="font-mono font-bold text-zinc-400 shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 2. Langkah Berikutnya & Jangan Lakukan (Side by Side on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Langkah Berikutnya */}
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                  Langkah Berikutnya:
                </h4>
                <ul className="space-y-1.5 pt-1">
                  {selectedGuide.nextSteps.map((step, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2 text-zinc-300">
                      <span className="text-zinc-500 font-bold shrink-0">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Jangan Lakukan */}
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                  Jangan Lakukan:
                </h4>
                <ul className="space-y-1.5 pt-1">
                  {selectedGuide.dontDo.map((item, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2 text-zinc-400">
                      <span className="text-zinc-500 font-bold shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. Kapan Memanggil Bantuan */}
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                Kapan Memanggil Bantuan Segera:
              </h4>
              <ul className="space-y-1.5 pt-1">
                {selectedGuide.whenToCallHelp.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2 text-zinc-300">
                    <span className="text-zinc-400 font-bold shrink-0">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Checklist Interaktif */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                    Checklist Tindakan ({selectedGuide.checklist.filter(item => checkedItems[`${selectedGuide.id}-${item}`]).length} / {selectedGuide.checklist.length} selesai)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Tersimpan lokal di perangkat Anda untuk memantau tahapan evakuasi/bantuan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => resetGuideChecklist(selectedGuide.id)}
                  className="text-xs underline text-zinc-400 hover:text-white cursor-pointer shrink-0"
                >
                  Reset Checklist
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {selectedGuide.checklist.map((item, idx) => {
                  const itemKey = `${selectedGuide.id}-${item}`;
                  const isDone = !!checkedItems[itemKey];
                  return (
                    <label
                      key={idx}
                      onClick={() => toggleChecklistItem(itemKey)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl transition cursor-pointer select-none border ${
                        isDone
                          ? isDark
                            ? 'bg-zinc-800/60 border-zinc-800 text-zinc-400 line-through'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-400 line-through'
                          : isDark
                          ? 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-800/50 text-zinc-200'
                          : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="mt-0.5 accent-white cursor-pointer"
                      />
                      <span className="text-xs leading-relaxed">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 5. Kontak Relevan untuk Panduan Ini */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-zinc-300">
                Kontak Darurat Relevan untuk Situasi Ini:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedGuide.relevantContactIds.map((cId) => {
                  const contact = EMERGENCY_CONTACTS.find((c) => c.id === cId);
                  if (!contact) return null;
                  return (
                    <div
                      key={contact.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold truncate">{contact.name}</h5>
                        <p className="text-[11px] text-zinc-400 font-mono">{contact.displayNumber}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(contact.number, contact.name)}
                          className={`p-2 rounded-lg border text-xs transition cursor-pointer ${
                            isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                          }`}
                          title="Salin Nomor"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                        <a
                          href={`tel:${contact.number}`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                          }`}
                          title={`Hubungi ${contact.name}`}
                        >
                          Panggil
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Official Sources Footer */}
            <div className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
              <span>Sumber Rujukan Resmi: </span>
              {selectedGuide.officialSources.map((src, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  {src.url ? (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                      {src.name}
                    </a>
                  ) : (
                    src.name
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 3: DAFTAR KONTAK DARURAT RESMI ─────────────────────────────── */}
        {activeTab === 'contacts' && (
          <div className="space-y-4 animate-in fade-in-0 duration-150">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold">Daftar Kontak Darurat Resmi Indonesia</h3>
              <p className="text-xs text-zinc-400">
                Nomor terverifikasi untuk penanganan multi-sektor kebencanaan, kepolisian, medis, pemadam, dan SAR.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {EMERGENCY_CONTACTS.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800/90' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {contact.verifiedAvailability}
                      </span>
                      {contact.isHotline && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-200 text-black border-zinc-300'
                        }`}>
                          Bebas Pulsa
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-black tracking-tight">{contact.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{contact.serviceType}</p>
                    </div>

                    <div className="text-2xl font-black font-mono tracking-wider pt-1 text-white dark:text-zinc-100">
                      {contact.displayNumber}
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {contact.notes || contact.coverage}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-zinc-500 truncate">
                      Sumber: {contact.officialSource}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(contact.number, contact.name)}
                        className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                        }`}
                        title="Salin Nomor Telepon"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>

                      <a
                        href={`tel:${contact.number}`}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-md ${
                          isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z" />
                        </svg>
                        <span>Panggil</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 4: FASILITAS TERDEKAT (NEARBY HELP) ─────────────────────────── */}
        {activeTab === 'facilities' && (
          <div className="space-y-5 animate-in fade-in-0 duration-150">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold">Fasilitas Kesehatan & Layanan Terdekat</h3>
              <p className="text-xs text-zinc-400">
                Pencarian Rumah Sakit / IGD, Puskesmas, Pos Polisi, dan Pemadam Kebakaran dengan izin lokasi eksplisit.
              </p>
            </div>

            {/* Location Permission / Manual Input Banner */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                    {triage.coords ? 'Lokasi Perangkat Aktif' : 'Tentukan Lokasi Anda'}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {triage.coords
                      ? `Koordinat: ${triage.coords.lat.toFixed(4)}, ${triage.coords.lng.toFixed(4)}`
                      : 'Izinkan lokasi peramban atau masukkan nama kota secara manual.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    disabled={isLocating}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 ${
                      isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{isLocating ? 'Mencari Lokasi...' : 'Gunakan Lokasi Saya'}</span>
                  </button>
                </div>
              </div>

              {locationError && (
                <p className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">{locationError}</p>
              )}

              {/* Manual City / Location input */}
              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={manualCitySearch}
                  onChange={(e) => setManualCitySearch(e.target.value)}
                  placeholder="Ketik kota / kecamatan (contoh: Jakarta Pusat, Surabaya, Bandung)..."
                  className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' : 'bg-white border-zinc-300 text-black placeholder-zinc-400'
                  }`}
                />
                <a
                  href={buildExternalSearchUrl(
                    manualCitySearch ? `Rumah Sakit IGD terdekat ${manualCitySearch}` : 'Rumah Sakit IGD terdekat',
                    triage.coords
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isDark ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-black'
                  }`}
                >
                  <span>Buka di Maps ↗</span>
                </a>
              </div>
            </div>

            {/* Filter by facility type */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Semua Fasilitas' },
                { id: 'hospital', label: 'Rumah Sakit / IGD' },
                { id: 'police', label: 'Kantor Polisi' },
                { id: 'fire_station', label: 'Pemadam Kebakaran' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFacilityFilter(f.id as any);
                    if (triage.coords) {
                      fetchNearbyFacilitiesFromCoords(triage.coords.lat, triage.coords.lng, f.id as any).then(setFacilities);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer shrink-0 ${
                    facilityFilter === f.id
                      ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                      : isDark ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-zinc-300 text-zinc-600 hover:text-black'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Facilities List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {facilities
                .filter((fac) => facilityFilter === 'all' || fac.type === facilityFilter)
                .map((fac) => (
                  <div
                    key={fac.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {fac.typeLabel}
                        </span>
                        {fac.distanceKm !== undefined && (
                          <span className="text-xs font-bold text-zinc-300 font-mono">
                            ~{fac.distanceKm} km
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-zinc-100">{fac.name}</h4>
                      {fac.address && (
                        <p className="text-xs text-zinc-400 line-clamp-2">{fac.address}</p>
                      )}
                      {fac.phone && (
                        <p className="text-xs text-zinc-300 font-mono pt-0.5">Telp: {fac.phone}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                      {fac.phone ? (
                        <a
                          href={`tel:${fac.phone}`}
                          className="text-xs font-semibold underline text-zinc-300 hover:text-white"
                        >
                          Hubungi
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Info kontak via Maps</span>
                      )}

                      <a
                        href={fac.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          isDark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-black'
                        }`}
                      >
                        <span>Petunjuk Arah</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ─── FOOTER DISCLAIMER ──────────────────────────────────────────────── */}
        <footer className="pt-6 pb-8 border-t border-zinc-800/60 text-center space-y-1 text-xs text-zinc-500">
          <p>
            Emergency Center Usick One — Panduan bantuan keselamatan umum.
          </p>
          <p>
            Informasi ini tidak menggantikan tindakan dokter, paramedis, atau petugas tanggap darurat resmi.
          </p>
        </footer>
      </div>
    </div>
  );
}
