"use client";

import { useState } from "react";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId, UserSubscriptionInfo, formatCreditNumber } from "@/lib/pricing";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscriptionInfo | null;
  onSubscriptionUpdated: (updated: UserSubscriptionInfo) => void;
  isDark: boolean;
  onOpenUsageHistory?: () => void;
}

export function PricingModal({
  isOpen,
  onClose,
  subscription,
  onSubscriptionUpdated,
  isDark,
  onOpenUsageHistory,
}: PricingModalProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPlan = subscription?.plan || "free";

  const handleUpgrade = async () => {
    setUpgrading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upgrade",
          userId: subscription?.userId || "guest",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal melakukan upgrade.");
      }

      setSuccessMsg(data.message || "Selamat! Akun Anda berhasil di-upgrade ke Pro.");
      if (data.subscription) {
        onSubscriptionUpdated(data.subscription);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat upgrade.");
    } finally {
      setUpgrading(false);
    }
  };

  const plans: Array<{
    id: SubscriptionPlanId;
    plan: typeof SUBSCRIPTION_PLANS.free;
    isCurrent: boolean;
    isPopular?: boolean;
    disabled?: boolean;
  }> = [
    {
      id: "free",
      plan: SUBSCRIPTION_PLANS.free,
      isCurrent: currentPlan === "free",
    },
    {
      id: "pro",
      plan: SUBSCRIPTION_PLANS.pro,
      isCurrent: currentPlan === "pro",
      isPopular: true,
    },
    {
      id: "ultra",
      plan: SUBSCRIPTION_PLANS.ultra,
      isCurrent: currentPlan === "ultra",
      disabled: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl transition-all border my-auto ${
          isDark
            ? "bg-[#141417] border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-5 top-5 rounded-full p-2 transition cursor-pointer ${
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

        {/* Header Section */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Usick One Subscription
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Choose how you use AI
          </h2>
          <p className={`mt-2.5 text-xs sm:text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
            Start free with Usick One AI, or unlock more models and higher usage with Pro.
          </p>
        </div>

        {/* Alerts / Feedback */}
        {errorMsg && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-500 text-center font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 text-center font-medium">
            {successMsg}
          </div>
        )}

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {plans.map(({ id, plan, isCurrent, isPopular, disabled }) => {
            return (
              <div
                key={id}
                className={`relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all border ${
                  isPopular
                    ? isDark
                      ? "bg-zinc-900/90 border-white/30 shadow-xl shadow-black/40 ring-1 ring-white/20"
                      : "bg-white border-zinc-900 shadow-xl shadow-zinc-200/80 ring-2 ring-black"
                    : isDark
                    ? "bg-[#18181b]/70 border-zinc-800 hover:border-zinc-700"
                    : "bg-zinc-50/70 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {/* Popular / Status Badges */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md shadow-emerald-500/20">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {disabled && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                      isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-zinc-200 text-zinc-600 border-zinc-300"
                    }`}>
                      COMING SOON
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Price */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold uppercase tracking-wider">{plan.name}</h3>
                    {isCurrent && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isDark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      }`}>
                        Current Plan
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight">
                      {plan.priceFormatted}
                    </span>
                    {plan.period && (
                      <span className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Limits summary */}
                  <div className={`p-2.5 rounded-xl mb-4 text-[11px] space-y-1 ${
                    isDark ? "bg-zinc-900/80 border border-zinc-800/80" : "bg-white border border-zinc-200"
                  }`}>
                    <div className="flex justify-between">
                      <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>AI Credits:</span>
                      <span className="font-semibold">{formatCreditNumber(plan.aiCreditLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Code Credits:</span>
                      <span className="font-semibold">{formatCreditNumber(plan.codeCreditLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Schedules:</span>
                      <span className="font-semibold">{plan.scheduleLimit >= 999 ? "Unlimited" : `Max ${plan.scheduleLimit}`}</span>
                    </div>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-2.5 mb-6 text-xs">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feat.included ? (
                          <svg className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className={feat.included ? (isDark ? "text-zinc-200" : "text-zinc-800") : (isDark ? "text-zinc-500 line-through" : "text-zinc-400 line-through")}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to action button */}
                <div className="mt-auto pt-2">
                  {id === "pro" ? (
                    isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold cursor-default opacity-80 ${
                          isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-600"
                        }`}
                      >
                        Paket Aktif Anda
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleUpgrade}
                        disabled={upgrading}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {upgrading ? "Memproses..." : "Upgrade to Pro"}
                      </button>
                    )
                  ) : id === "free" ? (
                    <button
                      type="button"
                      disabled
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold cursor-default ${
                        isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {isCurrent ? "Paket Saat Ini" : "Start for Free"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold cursor-not-allowed ${
                        isDark ? "bg-zinc-800/50 text-zinc-600" : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & usage history link */}
        <div className={`mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] ${
          isDark ? "border-zinc-800 text-zinc-400" : "border-zinc-200 text-zinc-500"
        }`}>
          <div>
            Kredit reset otomatis setiap bulan tanpa akumulasi sisa.
          </div>
          {onOpenUsageHistory && (
            <button
              type="button"
              onClick={onOpenUsageHistory}
              className={`font-semibold underline underline-offset-4 transition hover:text-white cursor-pointer ${
                isDark ? "text-zinc-300" : "text-zinc-700"
              }`}
            >
              Lihat Riwayat Pemakaian Kredit →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
