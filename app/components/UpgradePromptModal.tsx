"use client";

import { useState } from "react";
import { UserSubscriptionInfo } from "@/lib/pricing";

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetModelName?: string;
  onUpgradeSuccess: (updatedSub: UserSubscriptionInfo) => void;
  onOpenPricingPlans?: () => void;
  userId?: string;
  isDark: boolean;
}

export function UpgradePromptModal({
  isOpen,
  onClose,
  targetModelName,
  onUpgradeSuccess,
  onOpenPricingPlans,
  userId = "guest",
  isDark,
}: UpgradePromptModalProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setUpgrading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upgrade",
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal melakukan upgrade.");
      }

      if (data.subscription) {
        onUpgradeSuccess(data.subscription);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat upgrade.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl transition-all border text-center ${
          isDark
            ? "bg-[#18181b] border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        }`}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-full p-1.5 transition cursor-pointer ${
            isDark
              ? "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
          }`}
          aria-label="Tutup"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Lock Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700/60 shadow-inner">
          <svg
            className="w-7 h-7 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold tracking-tight">
          Unlock more AI models
        </h3>

        {targetModelName && (
          <div className="mt-1.5">
            <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {targetModelName}
            </span>
          </div>
        )}

        {/* Description matching Section 16 */}
        <p className={`mt-3 text-xs sm:text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
          Gemini, GPT, Claude and other
          <br />
          AI models are available with Pro.
        </p>

        {/* Price */}
        <div className="my-5 py-2.5 px-4 rounded-2xl border bg-zinc-500/5 border-zinc-500/10">
          <span className="text-2xl font-black tracking-tight">
            Rp49.000
          </span>
          <span className={`text-xs ml-1 font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            / month
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-500">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg cursor-pointer bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            {upgrading ? "Memproses Upgrade..." : "Upgrade to Pro"}
          </button>

          {onOpenPricingPlans && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPricingPlans();
              }}
              className={`w-full py-2 text-xs font-semibold transition hover:underline cursor-pointer ${
                isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-black"
              }`}
            >
              Lihat Detail Semua Paket →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
