"use client";

import React from "react";
import { BrainLogo } from "@/components/ui/brain-logo";
import { ArrowLeft } from "lucide-react";

interface FeatureMaintenanceViewProps {
  isDark?: boolean;
  featureName: string;
  title?: string | null;
  message?: string | null;
  estimatedEnd?: string | null;
  onBack?: () => void;
}

export function FeatureMaintenanceView({
  isDark = true,
  featureName,
  title,
  message,
  estimatedEnd,
  onBack,
}: FeatureMaintenanceViewProps) {
  const displayTitle = title?.trim() || `${featureName} Sedang Dalam Pemeliharaan`;
  const displayMessage =
    message?.trim() ||
    `Layanan ${featureName} sedang dalam peningkatan sistem. Fitur One Mind lainnya tetap dapat Anda gunakan dengan normal.`;

  let formattedEstimatedEnd: string | null = null;
  if (estimatedEnd) {
    try {
      const d = new Date(estimatedEnd);
      if (!isNaN(d.getTime())) {
        formattedEstimatedEnd = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });
      }
    } catch {
      formattedEstimatedEnd = null;
    }
  }

  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center p-6 select-none text-center ${
        isDark ? "bg-[#09090b] text-white" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      <div className="max-w-md flex flex-col items-center space-y-6">
        {/* Brain Logo (Clean without box) */}
        <BrainLogo
          className={`w-10 h-10 sm:w-12 sm:h-12 ${
            isDark ? "text-white" : "text-zinc-900"
          }`}
        />

        <div className="space-y-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
              isDark
                ? "bg-white/5 border-white/10 text-zinc-400"
                : "bg-black/5 border-black/10 text-zinc-600"
            }`}
          >
            Pemeliharaan Fitur
          </span>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight pt-1">
            {displayTitle}
          </h2>

          <p
            className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto ${
              isDark ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            {displayMessage}
          </p>

          {formattedEstimatedEnd && (
            <div
              className={`text-[11px] font-mono pt-1 ${
                isDark ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              Perkiraan Selesai: {formattedEstimatedEnd}
            </div>
          )}
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`px-4 py-2 rounded-xl text-xs font-medium border inline-flex items-center gap-2 transition cursor-pointer ${
              isDark
                ? "border-white/15 hover:bg-white/10 text-zinc-200"
                : "border-black/15 hover:bg-black/10 text-zinc-800"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Percakapan (Chats)</span>
          </button>
        )}
      </div>
    </div>
  );
}
