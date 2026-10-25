"use client";

import React, { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  CalendarDaysIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  MusicalNoteIcon,
  ExclamationTriangleIcon,
  PuzzlePieceIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/solid";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  CornerDownRight,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  type MainNavSlotId,
  type NavTabId,
  type NavigationPreferencesV1,
  LAINNYA_GROUP_SLOT_ID,
  NAV_TAB_METADATA,
  areNavigationOrdersEqual,
  countMainTabs,
  demoteTabToLainnya,
  isDefaultNavigationOrder,
  isNavTabId,
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
      return <ChatBubbleBottomCenterTextIcon className={className} />;
    case "code":
      return <CodeBracketIcon className={className} />;
    case "schedule":
      return <CalendarDaysIcon className={className} />;
    case "image":
      return <PhotoIcon className={className} />;
    case "messages":
      return <ChatBubbleLeftRightIcon className={className} />;
    case "music":
      return <MusicalNoteIcon className={className} />;
    case "emergency":
      return <ExclamationTriangleIcon className={className} />;
    case "game":
      return <PuzzlePieceIcon className={className} />;
    case "faith":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 3v18M7 8h10" />
        </svg>
      );
    case "lainnya":
      return <EllipsisHorizontalIcon className={className} />;
  }
}

function getViewportClientY(
  event: MouseEvent | TouchEvent | PointerEvent,
  fallbackPageY: number
): number {
  if ("clientY" in event && typeof event.clientY === "number") {
    return event.clientY;
  }
  if ("changedTouches" in event && event.changedTouches && event.changedTouches.length > 0) {
    return event.changedTouches[0].clientY;
  }
  if ("touches" in event && event.touches && event.touches.length > 0) {
    return event.touches[0].clientY;
  }
  return typeof window !== "undefined" ? fallbackPageY - window.scrollY : fallbackPageY;
}

interface SortableMainRowProps {
  slotId: MainNavSlotId;
  index: number;
  total: number;
  lainnyaOrder: NavTabId[];
  canDemoteToLainnya: boolean;
  isDark: boolean;
  disabled: boolean;
  onMoveOffset: (slotId: MainNavSlotId, dir: -1 | 1) => void;
  onDemoteToLainnya: (tabId: NavTabId) => void;
  onPromoteFromLainnya: (tabId: NavTabId) => void;
  onDragStartSnapshot: () => void;
  onCrossZoneDragMove: (sourceZone: "main", slotId: MainNavSlotId, clientY: number) => void;
  onCrossZoneDragEnd: (sourceZone: "main", slotId: MainNavSlotId, clientY: number) => void;
}

function SortableMainRow({
  slotId,
  index,
  total,
  lainnyaOrder,
  canDemoteToLainnya,
  isDark,
  disabled,
  onMoveOffset,
  onDemoteToLainnya,
  onPromoteFromLainnya,
  onDragStartSnapshot,
  onCrossZoneDragMove,
  onCrossZoneDragEnd,
}: SortableMainRowProps) {
  const dragControls = useDragControls();
  const isLainnyaGroup = slotId === LAINNYA_GROUP_SLOT_ID;
  const isTabSlot = !isLainnyaGroup && isNavTabId(slotId);

  const label = isLainnyaGroup
    ? "Lainnya"
    : NAV_TAB_METADATA[slotId].sidebarLabel;

  const lainnyaSummary =
    lainnyaOrder.length > 0
      ? `Grup (${lainnyaOrder.length} tab) · Klik chip di bawah atau gulir ke Isi Grup Lainnya untuk mengeluarkan/mengatur`
      : "Grup · Kosong (Disembunyikan otomatis di panel)";

  return (
    <Reorder.Item
      value={slotId}
      data-main-row-slot={slotId}
      dragListener={false}
      dragControls={dragControls}
      onDrag={(event, info) => {
        if (isLainnyaGroup) return;
        const clientY = getViewportClientY(event, info.point.y);
        onCrossZoneDragMove("main", slotId, clientY);
      }}
      onDragEnd={(event, info) => {
        if (isLainnyaGroup) return;
        const clientY = getViewportClientY(event, info.point.y);
        onCrossZoneDragEnd("main", slotId, clientY);
      }}
      whileDrag={{
        scale: 1.015,
        zIndex: 50,
        boxShadow: isDark
          ? "0 12px 28px rgba(0, 0, 0, 0.55)"
          : "0 12px 24px rgba(0, 0, 0, 0.12)",
      }}
      transition={{ duration: 0.16 }}
      className={`rounded-xl border px-3 py-2.5 select-none ${
        isLainnyaGroup
          ? isDark
            ? "bg-zinc-900/80 border-zinc-700/80 text-zinc-100"
            : "bg-zinc-100/90 border-zinc-300 text-zinc-900"
          : isDark
            ? "bg-zinc-900/40 border-zinc-800 text-zinc-100"
            : "bg-white border-zinc-200 text-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            disabled={disabled}
            onPointerDown={(e) => {
              if (disabled) return;
              e.preventDefault();
              onDragStartSnapshot();
              dragControls.start(e);
            }}
            style={{ touchAction: "none" }}
            title={
              isLainnyaGroup
                ? "Seret untuk mengubah posisi grup Lainnya"
                : `Seret untuk mengurutkan atau tarik ke bagian Isi Grup Lainnya untuk memasukkan ${label}`
            }
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
              {isLainnyaGroup && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isDark
                      ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                      : "bg-zinc-200/80 text-zinc-700 border-zinc-300"
                  }`}
                >
                  Grup Menu
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
          {isTabSlot && (
            <button
              type="button"
              disabled={disabled || !canDemoteToLainnya}
              onClick={() => onDemoteToLainnya(slotId)}
              title={
                canDemoteToLainnya
                  ? `Pindahkan ${label} ke dalam grup Lainnya`
                  : "Minimal 1 tab harus tetap berada di Panel Utama"
              }
              aria-label={`Pindahkan ${label} ke grup Lainnya`}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 mr-0.5 ${
                isDark
                  ? "border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                  : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
              } disabled:opacity-35 disabled:cursor-not-allowed`}
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
      </div>

      {/* Daftar cepat item yang sedang berada di dalam Lainnya (bisa langsung dikeluarkan ke Panel Utama dari sini) */}
      {isLainnyaGroup && lainnyaOrder.length > 0 && (
        <div
          className={`mt-2.5 pt-2.5 border-t flex items-center flex-wrap gap-1.5 pl-9 ${
            isDark ? "border-zinc-800" : "border-zinc-200/90"
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider mr-1 ${
              isDark ? "text-zinc-500" : "text-zinc-500"
            }`}
          >
            Di dalam Lainnya:
          </span>
          {lainnyaOrder.map((childId) => {
            const childLabel = NAV_TAB_METADATA[childId].sidebarLabel;
            return (
              <button
                key={childId}
                type="button"
                disabled={disabled}
                onClick={() => onPromoteFromLainnya(childId)}
                title={`Keluarkan ${childLabel} dari Lainnya ke Panel Utama`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                  isDark
                    ? "bg-zinc-800/90 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                    : "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-200 hover:text-black"
                } disabled:opacity-40`}
              >
                <NavSlotIcon slotId={childId} className="w-3 h-3 shrink-0 opacity-85" />
                <span>{childLabel}</span>
                <ArrowUpRight className="w-3 h-3 shrink-0 opacity-75" />
              </button>
            );
          })}
        </div>
      )}
    </Reorder.Item>
  );
}

interface SortableLainnyaRowProps {
  tabId: NavTabId;
  index: number;
  total: number;
  isDark: boolean;
  disabled: boolean;
  onMoveOffset: (tabId: NavTabId, dir: -1 | 1) => void;
  onPromoteToMain: (tabId: NavTabId) => void;
  onDragStartSnapshot: () => void;
  onCrossZoneDragMove: (sourceZone: "lainnya", tabId: NavTabId, clientY: number) => void;
  onCrossZoneDragEnd: (sourceZone: "lainnya", tabId: NavTabId, clientY: number) => void;
}

function SortableLainnyaRow({
  tabId,
  index,
  total,
  isDark,
  disabled,
  onMoveOffset,
  onPromoteToMain,
  onDragStartSnapshot,
  onCrossZoneDragMove,
  onCrossZoneDragEnd,
}: SortableLainnyaRowProps) {
  const dragControls = useDragControls();
  const label = NAV_TAB_METADATA[tabId].sidebarLabel;

  return (
    <Reorder.Item
      value={tabId}
      data-lainnya-row-slot={tabId}
      dragListener={false}
      dragControls={dragControls}
      onDrag={(event, info) => {
        const clientY = getViewportClientY(event, info.point.y);
        onCrossZoneDragMove("lainnya", tabId, clientY);
      }}
      onDragEnd={(event, info) => {
        const clientY = getViewportClientY(event, info.point.y);
        onCrossZoneDragEnd("lainnya", tabId, clientY);
      }}
      whileDrag={{
        scale: 1.015,
        zIndex: 50,
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
          disabled={disabled}
          onPointerDown={(e) => {
            if (disabled) return;
            e.preventDefault();
            onDragStartSnapshot();
            dragControls.start(e);
          }}
          style={{ touchAction: "none" }}
          title={`Seret untuk mengurutkan di dalam Lainnya atau tarik ke atas ke Panel Utama untuk mengeluarkan ${label}`}
          aria-label={`Seret untuk mengubah urutan atau mengeluarkan ${label}`}
          className={`p-1.5 rounded-lg transition cursor-grab active:cursor-grabbing shrink-0 ${
            isDark
              ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
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
          title={`Keluarkan ${label} dari Lainnya menjadi Tab Utama`}
          aria-label={`Keluarkan ${label} ke Tab Utama`}
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
  const [dropTargetZone, setDropTargetZone] = useState<"main" | "lainnya" | null>(null);
  const hasUserEditedRef = useRef(false);
  const preDragPrefsRef = useRef<NavigationPreferencesV1 | null>(null);
  const mainZoneRef = useRef<HTMLDivElement | null>(null);
  const lainnyaZoneRef = useRef<HTMLDivElement | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isDirty = !areNavigationOrdersEqual(draftPrefs, savedPreferences);
  const isSavedDefault = isDefaultNavigationOrder(savedPreferences);
  const isDraftDefault = isDefaultNavigationOrder(draftPrefs);
  const mainTabCount = countMainTabs(draftPrefs.mainOrder);
  const canDemoteMore = mainTabCount > 1;
  const currentMainTabs = draftPrefs.mainOrder.filter(
    (slot): slot is NavTabId => slot !== LAINNYA_GROUP_SLOT_ID
  );

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

  const handleDragStartSnapshot = () => {
    preDragPrefsRef.current = draftPrefs;
  };

  const computeInsertionIndex = (
    container: HTMLElement | null,
    rowAttr: string,
    draggedSlotId: string,
    clientY: number
  ): number => {
    if (!container) return 0;
    const rows = Array.from(container.querySelectorAll<HTMLElement>(`[${rowAttr}]`)).filter(
      (el) => el.getAttribute(rowAttr) !== draggedSlotId
    );
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (clientY < midY) {
        return i;
      }
    }
    return rows.length;
  };

  const handleCrossZoneDragMove = (
    sourceZone: "main" | "lainnya",
    slotId: MainNavSlotId,
    clientY: number
  ) => {
    if (sourceZone === "main") {
      if (slotId === LAINNYA_GROUP_SLOT_ID || !canDemoteMore) {
        setDropTargetZone(null);
        return;
      }
      const lainnyaRect = lainnyaZoneRef.current?.getBoundingClientRect();
      if (lainnyaRect && clientY >= lainnyaRect.top - 12 && clientY <= lainnyaRect.bottom + 24) {
        setDropTargetZone("lainnya");
      } else {
        setDropTargetZone(null);
      }
      return;
    }

    const mainRect = mainZoneRef.current?.getBoundingClientRect();
    if (mainRect && clientY >= mainRect.top - 24 && clientY <= mainRect.bottom + 12) {
      setDropTargetZone("main");
    } else {
      setDropTargetZone(null);
    }
  };

  const handleCrossZoneDragEnd = (
    sourceZone: "main" | "lainnya",
    slotId: MainNavSlotId,
    clientY: number
  ) => {
    setDropTargetZone(null);
    const basePrefs = preDragPrefsRef.current;
    preDragPrefsRef.current = null;

    if (sourceZone === "main") {
      if (slotId === LAINNYA_GROUP_SLOT_ID || !isNavTabId(slotId)) return;
      const lainnyaRect = lainnyaZoneRef.current?.getBoundingClientRect();
      if (
        lainnyaRect &&
        clientY >= lainnyaRect.top - 12 &&
        clientY <= lainnyaRect.bottom + 24 &&
        countMainTabs((basePrefs || draftPrefs).mainOrder) > 1
      ) {
        const targetIdx = computeInsertionIndex(
          lainnyaZoneRef.current,
          "data-lainnya-row-slot",
          slotId,
          clientY
        );
        hasUserEditedRef.current = true;
        setFeedback(null);
        setDraftPrefs((prev) => demoteTabToLainnya(basePrefs || prev, slotId, targetIdx));
      }
      return;
    }

    if (!isNavTabId(slotId)) return;
    const mainRect = mainZoneRef.current?.getBoundingClientRect();
    if (mainRect && clientY >= mainRect.top - 24 && clientY <= mainRect.bottom + 12) {
      const targetIdx = computeInsertionIndex(
        mainZoneRef.current,
        "data-main-row-slot",
        slotId,
        clientY
      );
      hasUserEditedRef.current = true;
      setFeedback(null);
      setDraftPrefs((prev) => promoteTabFromLainnya(basePrefs || prev, slotId, targetIdx));
    }
  };

  const handleMainReorder = (nextMainOrder: MainNavSlotId[]) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => reorderMainSlots(prev, nextMainOrder));
  };

  const handleLainnyaReorder = (nextLainnyaOrder: NavTabId[]) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => reorderLainnyaTabs(prev, nextLainnyaOrder));
  };

  const handleMoveMainOffset = (slotId: MainNavSlotId, dir: -1 | 1) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => moveMainSlotByOffset(prev, slotId, dir));
  };

  const handleMoveLainnyaOffset = (tabId: NavTabId, dir: -1 | 1) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => moveLainnyaTabByOffset(prev, tabId, dir));
  };

  const handlePromote = (tabId: NavTabId) => {
    hasUserEditedRef.current = true;
    setFeedback(null);
    setDraftPrefs((prev) => promoteTabFromLainnya(prev, tabId));
  };

  const handleDemote = (tabId: NavTabId) => {
    if (!canDemoteMore) return;
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
            Atur urutan tab utama, ubah posisi grup Lainnya, keluarkan Game/Faith ke Panel Utama, atau masukkan tab apa saja ke dalam Lainnya
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
        ref={mainZoneRef}
        className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
          dropTargetZone === "main"
            ? isDark
              ? "bg-zinc-900/70 border-white ring-2 ring-white/25"
              : "bg-zinc-100/80 border-black ring-2 ring-black/15"
            : isDark
              ? "bg-zinc-900/30 border-zinc-800"
              : "bg-zinc-50/50 border-zinc-200"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold">Urutan Panel Utama</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              Seret ikon grip (⋮⋮) atau panah untuk mengurutkan. Tekan <strong>Ke Lainnya</strong> (atau seret ke bawah) untuk memindahkan tab apa pun ke dalam grup Lainnya
            </p>
          </div>
          {dropTargetZone === "main" && (
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              Lepaskan ke Panel Utama
            </span>
          )}
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
              canDemoteToLainnya={canDemoteMore}
              isDark={isDark}
              disabled={isSaving}
              onMoveOffset={handleMoveMainOffset}
              onDemoteToLainnya={handleDemote}
              onPromoteFromLainnya={handlePromote}
              onDragStartSnapshot={handleDragStartSnapshot}
              onCrossZoneDragMove={handleCrossZoneDragMove}
              onCrossZoneDragEnd={handleCrossZoneDragEnd}
            />
          ))}
        </Reorder.Group>
      </div>

      {/* Group Lainnya Order Editor */}
      <div
        ref={lainnyaZoneRef}
        className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
          dropTargetZone === "lainnya"
            ? isDark
              ? "bg-zinc-900/70 border-white ring-2 ring-white/25"
              : "bg-zinc-100/80 border-black ring-2 ring-black/15"
            : isDark
              ? "bg-zinc-900/30 border-zinc-800"
              : "bg-zinc-50/50 border-zinc-200"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold">Isi Grup Lainnya</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              Keluarkan tab (seperti Game atau Faith) dengan <strong>Ke Tab Utama</strong> / seret ke atas, atau isi Lainnya dengan tab lain sesuai keinginan Anda
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dropTargetZone === "lainnya" && (
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  isDark ? "bg-white text-black" : "bg-black text-white"
                }`}
              >
                Lepaskan ke Lainnya
              </span>
            )}
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isDark
                  ? "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                  : "bg-zinc-100 border-zinc-200 text-zinc-700"
              }`}
            >
              {draftPrefs.lainnyaOrder.length} item
            </span>
          </div>
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
                onDragStartSnapshot={handleDragStartSnapshot}
                onCrossZoneDragMove={handleCrossZoneDragMove}
                onCrossZoneDragEnd={handleCrossZoneDragEnd}
              />
            ))}
          </Reorder.Group>
        ) : (
          <div
            className={`rounded-xl border border-dashed p-4 text-center ${
              isDark
                ? "border-zinc-800 bg-zinc-900/20 text-zinc-400"
                : "border-zinc-300 bg-white/60 text-zinc-600"
            }`}
          >
            <p className="text-xs leading-relaxed">
              Grup Lainnya saat ini kosong (menu Lainnya tidak akan ditampilkan di sidebar). Anda dapat memasukkan tab mana saja dari pilihan di bawah.
            </p>
          </div>
        )}

        {/* Quick-Add Bar: Masukkan tab lain apa pun dari Panel Utama ke dalam Lainnya */}
        {canDemoteMore && currentMainTabs.length > 0 && (
          <div
            className={`pt-3 border-t space-y-2 ${
              isDark ? "border-zinc-800/80" : "border-zinc-200/80"
            }`}
          >
            <span
              className={`block text-[11px] font-semibold ${
                isDark ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Masukkan tab dari Panel Utama ke Lainnya:
            </span>
            <div className="flex items-center flex-wrap gap-1.5">
              {currentMainTabs.map((tabId) => {
                const label = NAV_TAB_METADATA[tabId].sidebarLabel;
                return (
                  <button
                    key={tabId}
                    type="button"
                    disabled={isSaving || !canDemoteMore}
                    onClick={() => handleDemote(tabId)}
                    title={`Masukkan ${label} ke dalam grup Lainnya`}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                      isDark
                        ? "border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                        : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black"
                    } disabled:opacity-40`}
                  >
                    <Plus className="w-3 h-3 shrink-0 opacity-75" />
                    <NavSlotIcon slotId={tabId} className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>{label}</span>
                  </button>
                );
              })}
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
