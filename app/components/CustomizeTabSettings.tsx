"use client";

import React, { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  CornerDownRight,
  GripVertical,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  type MainNavSlotId,
  type MovableOverflowTabId,
  type NavigationPreferencesV1,
  LAINNYA_GROUP_SLOT_ID,
  NAV_TAB_METADATA,
  areNavigationOrdersEqual,
  demoteTabToLainnya,
  isDefaultNavigationOrder,
  isMovableOverflowTabId,
  moveLainnyaTabByOffset,
  moveMainSlotByOffset,
  promoteTabFromLainnya,
  reorderLainnyaTabs,
  reorderMainSlots,
} from "@/lib/navigationPrefs";

export function NavSlotIcon({
  slotId,
  className = "w-5 h-5 shrink-0",
}: {
  slotId: MainNavSlotId;
  className?: string;
}) {
  switch (slotId) {
    case "chat":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      );
    case "code":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      );
    case "schedule":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case "image":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case "messages":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
          />
        </svg>
      );
    case "music":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018"
          />
        </svg>
      );
    case "emergency":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case "game":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 6H9a7 7 0 00-7 7v1a3 3 0 003 3h1.5a1.5 1.5 0 001.5-1.5V14a1 1 0 011-1h2a1 1 0 011 1v1.5a1.5 1.5 0 001.5 1.5H19a3 3 0 003-3v-1a7 7 0 00-7-7zM6 11h2m-1-1v2m8-1h.01m2.99 0h.01"
          />
        </svg>
      );
    case "faith":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 3v18M7 8h10" />
        </svg>
      );
    case "lainnya":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      );
  }
}

interface SortableMainRowProps {
  slotId: MainNavSlotId;
  index: number;
  total: number;
  lainnyaOrder: MovableOverflowTabId[];
  isDark: boolean;
  disabled: boolean;
  onMoveOffset: (slotId: MainNavSlotId, dir: -1 | 1) => void;
  onDemoteToLainnya: (tabId: MovableOverflowTabId) => void;
}

function SortableMainRow({
  slotId,
  index,
  total,
  lainnyaOrder,
  isDark,
  disabled,
  onMoveOffset,
  onDemoteToLainnya,
}: SortableMainRowProps) {
  const dragControls = useDragControls();
  const isLainnyaGroup = slotId === LAINNYA_GROUP_SLOT_ID;
  const isMovableToLainnya = !isLainnyaGroup && isMovableOverflowTabId(slotId);

  const label = isLainnyaGroup
    ? "Lainnya"
    : NAV_TAB_METADATA[slotId].sidebarLabel;

  const lainnyaSummary =
    lainnyaOrder.length > 0
      ? `Grup · Isi: ${lainnyaOrder.map((id) => NAV_TAB_METADATA[id].sidebarLabel).join(" → ")}`
      : "Grup · Kosong (Disembunyikan otomatis di panel)";

  return (
    <Reorder.Item
      value={slotId}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.015,
        zIndex: 30,
        boxShadow: isDark
          ? "0 12px 28px rgba(0, 0, 0, 0.55)"
          : "0 12px 24px rgba(0, 0, 0, 0.12)",
      }}
      transition={{ duration: 0.16 }}
      className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2.5 select-none ${
        isLainnyaGroup
          ? isDark
            ? "bg-zinc-900/80 border-zinc-700/80 text-zinc-100"
            : "bg-zinc-100/90 border-zinc-300 text-zinc-900"
          : isDark
            ? "bg-zinc-900/40 border-zinc-800 text-zinc-100"
            : "bg-white border-zinc-200 text-zinc-900"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          disabled={disabled}
          onPointerDown={(e) => {
            if (disabled) return;
            e.preventDefault();
            dragControls.start(e);
          }}
          style={{ touchAction: "none" }}
          title={`Seret untuk mengubah posisi ${label}`}
          aria-label={`Seret untuk mengubah posisi ${label}`}
          className={`p-1.5 rounded-lg transition cursor-grab active:cursor-grabbing shrink-0 ${
            isDark
              ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span
          className={`text-[11px] font-mono font-semibold w-5 text-center shrink-0 ${
            isDark ? "text-zinc-500" : "text-zinc-400"
          }`}
        >
          {index + 1}
        </span>

        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
            isDark
              ? "bg-zinc-800/80 border-zinc-700/70 text-zinc-200"
              : "bg-zinc-100 border-zinc-200 text-zinc-800"
          }`}
        >
          <NavSlotIcon slotId={slotId} className="w-4 h-4 shrink-0" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{label}</span>
            {isMovableToLainnya && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isDark
                    ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                    : "bg-zinc-100 text-zinc-700 border-zinc-300"
                }`}
              >
                Tab Utama
              </span>
            )}
          </div>
          {isLainnyaGroup && (
            <p
              className={`text-[11px] truncate mt-0.5 ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              {lainnyaSummary}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isMovableToLainnya && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDemoteToLainnya(slotId)}
            title={`Pindahkan ${label} ke dalam grup Lainnya`}
            aria-label={`Pindahkan ${label} ke grup Lainnya`}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 mr-0.5 ${
              isDark
                ? "border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <CornerDownRight className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Ke Lainnya</span>
            <span className="sm:hidden">Lainnya</span>
          </button>
        )}

        <button
          type="button"
          disabled={disabled || index === 0}
          onClick={() => onMoveOffset(slotId, -1)}
          title={`Geser ${label} ke atas`}
          aria-label={`Geser ${label} ke atas`}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            isDark
              ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              : "border-zinc-200 bg-zinc-50 hover:bg-zinc-200/80 text-zinc-700 hover:text-black"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={disabled || index === total - 1}
          onClick={() => onMoveOffset(slotId, 1)}
          title={`Geser ${label} ke bawah`}
          aria-label={`Geser ${label} ke bawah`}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            isDark
              ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              : "border-zinc-200 bg-zinc-50 hover:bg-zinc-200/80 text-zinc-700 hover:text-black"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}

interface SortableLainnyaRowProps {
  tabId: MovableOverflowTabId;
  index: number;
  total: number;
  isDark: boolean;
  disabled: boolean;
  onMoveOffset: (tabId: MovableOverflowTabId, dir: -1 | 1) => void;
  onPromoteToMain: (tabId: MovableOverflowTabId) => void;
}

function SortableLainnyaRow({
  tabId,
  index,
  total,
  isDark,
  disabled,
  onMoveOffset,
  onPromoteToMain,
}: SortableLainnyaRowProps) {
  const dragControls = useDragControls();
  const label = NAV_TAB_METADATA[tabId].sidebarLabel;
  const canReorder = total > 1 && !disabled;

  return (
    <Reorder.Item
      value={tabId}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.015,
        zIndex: 30,
        boxShadow: isDark
          ? "0 12px 28px rgba(0, 0, 0, 0.55)"
          : "0 12px 24px rgba(0, 0, 0, 0.12)",
      }}
      transition={{ duration: 0.16 }}
      className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2.5 select-none ${
        isDark
          ? "bg-zinc-900/40 border-zinc-800 text-zinc-100"
          : "bg-white border-zinc-200 text-zinc-900"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          disabled={!canReorder}
          onPointerDown={(e) => {
            if (!canReorder) return;
            e.preventDefault();
            dragControls.start(e);
          }}
          style={{ touchAction: "none" }}
          title={`Seret untuk mengubah urutan ${label} di dalam Lainnya`}
          aria-label={`Seret untuk mengubah urutan ${label} di dalam Lainnya`}
          className={`p-1.5 rounded-lg transition shrink-0 ${
            canReorder ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          } ${
            isDark
              ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
          } disabled:opacity-30`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span
          className={`text-[11px] font-mono font-semibold w-5 text-center shrink-0 ${
            isDark ? "text-zinc-500" : "text-zinc-400"
          }`}
        >
          {index + 1}
        </span>

        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
            isDark
              ? "bg-zinc-800/80 border-zinc-700/70 text-zinc-200"
              : "bg-zinc-100 border-zinc-200 text-zinc-800"
          }`}
        >
          <NavSlotIcon slotId={tabId} className="w-4 h-4 shrink-0" />
        </div>

        <span className="text-sm font-semibold truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPromoteToMain(tabId)}
          title={`Pindahkan ${label} keluar dari Lainnya menjadi Tab Utama`}
          aria-label={`Pindahkan ${label} ke Tab Utama`}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 mr-0.5 ${
            isDark
              ? "border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white"
              : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <ArrowUpRight className="w-3 h-3 shrink-0" />
          <span className="hidden sm:inline">Ke Tab Utama</span>
          <span className="sm:hidden">Tab Utama</span>
        </button>

        <button
          type="button"
          disabled={disabled || index === 0}
          onClick={() => onMoveOffset(tabId, -1)}
          title={`Geser ${label} ke atas di dalam Lainnya`}
          aria-label={`Geser ${label} ke atas di dalam Lainnya`}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            isDark
              ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              : "border-zinc-200 bg-zinc-50 hover:bg-zinc-200/80 text-zinc-700 hover:text-black"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={disabled || index === total - 1}
          onClick={() => onMoveOffset(tabId, 1)}
          title={`Geser ${label} ke bawah di dalam Lainnya`}
          aria-label={`Geser ${label} ke bawah di dalam Lainnya`}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            isDark
              ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              : "border-zinc-200 bg-zinc-50 hover:bg-zinc-200/80 text-zinc-700 hover:text-black"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export interface CustomizeTabSaveResult {
  ok: boolean;
  message?: string;
}

interface CustomizeTabSettingsProps {
  isDark: boolean;
  isAuthenticated: boolean;
  isLoadingCloud?: boolean;
  savedPreferences: NavigationPreferencesV1;
  onSavePreferences: (nextPrefs: NavigationPreferencesV1) => Promise<CustomizeTabSaveResult>;
  onResetPreferences: () => Promise<CustomizeTabSaveResult>;
  onRequireAuth?: () => void;
}

export function CustomizeTabSettings({
  isDark,
  isAuthenticated,
  isLoadingCloud = false,
  savedPreferences,
  onSavePreferences,
  onResetPreferences,
  onRequireAuth,
}: CustomizeTabSettingsProps) {
  const [draftPrefs, setDraftPrefs] = useState<NavigationPreferencesV1>(() => savedPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const hasUserEditedRef = useRef(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isDirty = !areNavigationOrdersEqual(draftPrefs, savedPreferences);
  const isSavedDefault = isDefaultNavigationOrder(savedPreferences);
  const isDraftDefault = isDefaultNavigationOrder(draftPrefs);

  // Sinkronkan draft ke savedPreferences terbaru dari cloud selama pengguna belum melakukan perubahan draf yang belum disimpan
  useEffect(() => {
    if (!hasUserEditedRef.current) {
      setDraftPrefs(savedPreferences);
    }
  }, [savedPreferences]);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 animate-in fade-in-0 duration-150">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Customize Tab</h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Atur urutan navigasi utama dan pengelompokan menu Lainnya sesuai preferensi Anda
          </p>
        </div>

        <div
          className={`p-5 rounded-2xl border text-center space-y-3 ${
            isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-zinc-50/50 border-zinc-200"
          }`}
        >
          <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Anda sedang menggunakan aplikasi sebagai tamu. Silakan masuk untuk menyesuaikan dan menyinkronkan susunan navigasi akun Anda.
          </p>
          {onRequireAuth && (
            <button
              type="button"
              onClick={onRequireAuth}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
              }`}
            >
              Masuk ke Akun
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleMainReorder = (nextMainOrder: MainNavSlotId[]) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => reorderMainSlots(prev, nextMainOrder));
  };

  const handleLainnyaReorder = (nextLainnyaOrder: MovableOverflowTabId[]) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => reorderLainnyaTabs(prev, nextLainnyaOrder));
  };

  const handleMoveMainOffset = (slotId: MainNavSlotId, dir: -1 | 1) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => moveMainSlotByOffset(prev, slotId, dir));
  };

  const handleMoveLainnyaOffset = (tabId: MovableOverflowTabId, dir: -1 | 1) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => moveLainnyaTabByOffset(prev, tabId, dir));
  };

  const handlePromote = (tabId: MovableOverflowTabId) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => promoteTabFromLainnya(prev, tabId));
  };

  const handleDemote = (tabId: MovableOverflowTabId) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => demoteTabToLainnya(prev, tabId));
  };

  const handleCancel = () => {
    if (isSaving) return;
    hasUserEditedRef.current = false;
    setDraftPrefs(savedPreferences);
    setFeedback(null);
  };

  const handleSave = async () => {
    if (isSaving || !isDirty) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await onSavePreferences(draftPrefs);
      if (res.ok) {
        hasUserEditedRef.current = false;
        setFeedback({
          type: "success",
          text: res.message || "Susunan navigasi berhasil disimpan.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal menyimpan susunan navigasi. Silakan coba lagi.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: (err as Error)?.message || "Terjadi kendala saat menyimpan preferensi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (isSaving || (isSavedDefault && isDraftDefault)) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await onResetPreferences();
      if (res.ok) {
        hasUserEditedRef.current = false;
        setDraftPrefs((prev) => ({
          ...prev,
          mainOrder: [
            "chat",
            "code",
            "schedule",
            "image",
            "messages",
            "music",
            "emergency",
            "lainnya",
          ],
          lainnyaOrder: ["game", "faith"],
        }));
        setFeedback({
          type: "success",
          text: res.message || "Susunan navigasi berhasil dikembalikan ke default.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal mereset susunan navigasi.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: (err as Error)?.message || "Terjadi kendala saat mereset preferensi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const visiblePreviewSlots = draftPrefs.mainOrder.filter(
    (slot) => slot !== LAINNYA_GROUP_SLOT_ID || draftPrefs.lainnyaOrder.length > 0
  );

  return (
    <div
      data-no-sidebar-swipe="true"
      className="space-y-6 animate-in fade-in-0 duration-150"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold tracking-tight">Customize Tab</h2>
            {isDirty && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark
                    ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                    : "bg-zinc-200 text-zinc-800 border-zinc-300"
                }`}
              >
                Belum Disimpan
              </span>
            )}
            {isLoadingCloud && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Menyinkronkan...</span>
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Atur urutan tab utama, ubah posisi grup Lainnya, atau pindahkan Game dan Faith keluar/masuk grup Lainnya
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`rounded-2xl p-3.5 border text-xs flex items-center justify-between gap-3 ${
            feedback.type === "error"
              ? isDark
                ? "bg-red-950/30 border-red-900/60 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
              : isDark
                ? "bg-zinc-900/80 border-zinc-700 text-zinc-200"
                : "bg-zinc-100 border-zinc-300 text-zinc-900"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {feedback.type === "success" && <Check className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline shrink-0 cursor-pointer opacity-80 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Live Preview Strip */}
      <div
        className={`p-4 rounded-2xl border space-y-2.5 ${
          isDark ? "bg-zinc-900/35 border-zinc-800" : "bg-zinc-50/80 border-zinc-200"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${
              isDark ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            Pratinjau Susunan Panel
          </span>
          {draftPrefs.lainnyaOrder.length === 0 && (
            <span className={`text-[11px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
              Grup Lainnya disembunyikan karena kosong
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {visiblePreviewSlots.map((slot, idx) => {
            const isLainnya = slot === LAINNYA_GROUP_SLOT_ID;
            const title = isLainnya
              ? `Lainnya (${draftPrefs.lainnyaOrder
                  .map((id) => NAV_TAB_METADATA[id].sidebarLabel)
                  .join(", ")})`
              : NAV_TAB_METADATA[slot].sidebarLabel;

            return (
              <React.Fragment key={slot}>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    isLainnya
                      ? isDark
                        ? "bg-zinc-800/90 border-zinc-700 text-zinc-200"
                        : "bg-zinc-200/70 border-zinc-300 text-zinc-800"
                      : isDark
                        ? "bg-zinc-900 border-zinc-800 text-zinc-200"
                        : "bg-white border-zinc-200 text-zinc-800"
                  }`}
                >
                  <NavSlotIcon slotId={slot} className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span>{title}</span>
                </span>
                {idx < visiblePreviewSlots.length - 1 && (
                  <span className={`text-xs ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                    →
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Navigation Order Editor */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 ${
          isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-zinc-50/50 border-zinc-200"
        }`}
      >
        <div>
          <h3 className="text-sm font-bold">Urutan Panel Utama</h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Seret ikon grip (⋮⋮) atau tekan tombol panah naik/turun untuk mengatur urutan tab utama dan letak grup Lainnya
          </p>
        </div>

        <Reorder.Group
          axis="y"
          values={draftPrefs.mainOrder}
          onReorder={handleMainReorder}
          className="space-y-2"
        >
          {draftPrefs.mainOrder.map((slotId, idx) => (
            <SortableMainRow
              key={slotId}
              slotId={slotId}
              index={idx}
              total={draftPrefs.mainOrder.length}
              lainnyaOrder={draftPrefs.lainnyaOrder}
              isDark={isDark}
              disabled={isSaving}
              onMoveOffset={handleMoveMainOffset}
              onDemoteToLainnya={handleDemote}
            />
          ))}
        </Reorder.Group>
      </div>

      {/* Group Lainnya Order Editor */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 ${
          isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-zinc-50/50 border-zinc-200"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold">Isi Grup Lainnya</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              Kelola urutan Game dan Faith ketika ditempatkan di dalam grup Lainnya
            </p>
          </div>
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
              isDark
                ? "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                : "bg-zinc-100 border-zinc-200 text-zinc-700"
            }`}
          >
            {draftPrefs.lainnyaOrder.length} item
          </span>
        </div>

        {draftPrefs.lainnyaOrder.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={draftPrefs.lainnyaOrder}
            onReorder={handleLainnyaReorder}
            className="space-y-2"
          >
            {draftPrefs.lainnyaOrder.map((tabId, idx) => (
              <SortableLainnyaRow
                key={tabId}
                tabId={tabId}
                index={idx}
                total={draftPrefs.lainnyaOrder.length}
                isDark={isDark}
                disabled={isSaving}
                onMoveOffset={handleMoveLainnyaOffset}
                onPromoteToMain={handlePromote}
              />
            ))}
          </Reorder.Group>
        ) : (
          <div
            className={`rounded-xl border border-dashed p-4 text-center space-y-3 ${
              isDark
                ? "border-zinc-800 bg-zinc-900/20 text-zinc-400"
                : "border-zinc-300 bg-white/60 text-zinc-600"
            }`}
          >
            <p className="text-xs leading-relaxed">
              Grup Lainnya saat ini kosong karena Game dan Faith berada di Panel Utama. Menu Lainnya tidak akan ditampilkan sebagai grup kosong di navigasi.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {(["game", "faith"] as const).map((tabId) => (
                <button
                  key={tabId}
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleDemote(tabId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                    isDark
                      ? "border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                      : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
                  } disabled:opacity-40`}
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Kembalikan {NAV_TAB_METADATA[tabId].sidebarLabel} ke Lainnya</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: Reset, Batal, Simpan */}
      <div
        className={`flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t ${
          isDark ? "border-zinc-800/80" : "border-zinc-200/80"
        }`}
      >
        <button
          type="button"
          disabled={isSaving || (isSavedDefault && isDraftDefault)}
          onClick={handleReset}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer inline-flex items-center justify-center gap-1.5 ${
            isDark
              ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              : "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset ke Default</span>
        </button>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isSaving || !isDirty}
            onClick={handleCancel}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isDark
                ? "border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaving || !isDirty}
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black text-white hover:bg-zinc-800"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
