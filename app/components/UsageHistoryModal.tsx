"use client";

import { useEffect, useState } from "react";
import { CreditTransaction, formatCreditNumber } from "@/lib/pricing";

interface UsageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  isDark: boolean;
}

export function UsageHistoryModal({
  isOpen,
  onClose,
  userId = "guest",
  isDark,
}: UsageHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/subscription/usage?userId=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.error) {
          setError(data.error);
        } else {
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Gagal memuat riwayat penggunaan.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl p-6 shadow-2xl transition-all border ${
          isDark
            ? "bg-[#141417] border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <h3 className="text-lg font-bold">Riwayat Penggunaan Kredit</h3>
            <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              Daftar transaksi dan pemakaian kredit token Anda
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-1.5 transition cursor-pointer ${
              isDark
                ? "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2 align-middle" />
              Memuat data riwayat...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-red-400">
              {error}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Belum ada riwayat transaksi kredit tercatat.
            </div>
          ) : (
            transactions.map((tx) => {
              const isNegative = tx.amount < 0;
              const dateStr = new Date(tx.createdAt).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${
                    isDark
                      ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                      : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                        {tx.creditType === "code" ? "Code" : "AI"}
                      </span>
                      <span className="font-bold truncate">
                        {tx.taskType === "upgrade_pro"
                          ? "Upgrade Pro Allowance"
                          : tx.modelId
                          ? tx.modelId.split(/[:/]/).pop()
                          : tx.transactionType}
                      </span>
                    </div>
                    <div className={`mt-1 text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      {dateStr}
                      {tx.totalTokens ? ` • ~${formatCreditNumber(tx.totalTokens)} tokens` : ""}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold text-sm ${
                        isNegative
                          ? isDark
                            ? "text-rose-400"
                            : "text-rose-600"
                          : "text-emerald-500"
                      }`}
                    >
                      {isNegative ? tx.amount : `+${tx.amount}`}
                    </div>
                    <div className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      Sisa: {formatCreditNumber(tx.balanceAfter)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/80 text-right">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-black"
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
