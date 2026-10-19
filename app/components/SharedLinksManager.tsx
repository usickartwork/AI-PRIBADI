"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Share2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { SharedLinkSummary } from "@/lib/shareServer";

interface SharedLinksManagerProps {
  isDark: boolean;
  onNavigateToChat?: () => void;
}

export function SharedLinksManager({ isDark, onNavigateToChat }: SharedLinksManagerProps) {
  const [links, setLinks] = useState<SharedLinkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<SharedLinkSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLinks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/share", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat daftar tautan bersama.");
      }
      setLinks(Array.isArray(data.links) ? data.links : []);
    } catch (err: any) {
      console.error("[SharedLinksManager] fetch error:", err);
      setError(err?.message || "Terjadi kesalahan saat memuat tautan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

function getShareOrigin(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return window.location.origin;
    }
  }
  return "https://onemind.web.id";
}

  const handleCopy = async (token: string, id: string) => {
    const origin = getShareOrigin();
    const url = `${origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      alert("Gagal menyalin tautan.");
    }
  };

  const handleDelete = async () => {
    if (!linkToDelete || deletingId) return;
    const target = linkToDelete;
    setDeletingId(target.id);

    try {
      const res = await fetch(`/api/share?id=${encodeURIComponent(target.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menghapus tautan.");
      }

      // Remove from local state
      setLinks((prev) => prev.filter((l) => l.id !== target.id));
      setLinkToDelete(null);
    } catch (err: any) {
      alert(err?.message || "Gagal mencabut tautan.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const origin = getShareOrigin();

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-150">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Kelola Tautan Bersama (Shared Links)</h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Daftar seluruh tautan publik yang pernah Anda buat untuk dibagikan kepada orang lain
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchLinks(true)}
          disabled={loading || refreshing}
          className={`self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            isDark
              ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              : "border-zinc-200 bg-zinc-100/80 hover:bg-zinc-200 text-zinc-700 hover:text-black"
          } ${refreshing ? "opacity-60" : ""}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchLinks(true)}
            className="underline font-semibold cursor-pointer shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Memuat daftar tautan bersama...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && links.length === 0 && (
        <div
          className={`py-14 px-6 rounded-2xl border text-center flex flex-col items-center justify-center max-w-lg mx-auto ${
            isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-zinc-50/80 border-zinc-200"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5 ${
              isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
            }`}
          >
            <Share2 className="w-6 h-6 opacity-80" />
          </div>
          <h3 className={`text-sm font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
            Belum Ada Tautan yang Dibagikan
          </h3>
          <p className={`text-xs mt-1.5 max-w-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Anda belum pernah membuat tautan bersama untuk proyek manapun.
            Untuk membagikan percakapan, buka percakapan di Chat AI dan klik tombol <strong>Share</strong> di pojok kanan atas.
          </p>
          {onNavigateToChat && (
            <button
              type="button"
              onClick={onNavigateToChat}
              className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
              }`}
            >
              Mulai Percakapan Chat AI
            </button>
          )}
        </div>
      )}

      {/* Links List */}
      {!loading && links.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>
              Total {links.length} tautan aktif
            </span>
          </div>

          <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 border rounded-2xl overflow-hidden shadow-xs">
            {links.map((link) => {
              const fullUrl = `${origin}/share/${link.public_token}`;
              const isCopied = copiedId === link.id;

              return (
                <div
                  key={link.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isDark
                      ? "bg-zinc-900/40 hover:bg-zinc-900/70 border-zinc-800"
                      : "bg-white hover:bg-zinc-50 border-zinc-200"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          link.content_type === "chat"
                            ? isDark
                              ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                              : "bg-zinc-100 text-zinc-700 border-zinc-300"
                            : isDark
                            ? "bg-purple-950/40 text-purple-300 border-purple-800/50"
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        }`}
                      >
                        {link.content_type === "chat" ? "Chat AI" : link.content_type}
                      </span>
                      <span className={`text-[11px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                        {formatDate(link.created_at)}
                      </span>
                      {link.message_count > 0 && (
                        <span className={`text-[11px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          · {link.message_count} pesan
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold truncate mt-1 ${isDark ? "text-white" : "text-black"}`}>
                      {link.title_snapshot || "Untitled Project"}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-1">
                      <Globe className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="font-mono text-[11px] text-zinc-500 truncate max-w-[280px] sm:max-w-md">
                        /share/{link.public_token}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isDark
                          ? "border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                          : "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
                      }`}
                      title="Buka halaman publik"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(link.public_token, link.id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        isCopied
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : isDark
                          ? "border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                          : "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black"
                      }`}
                      title="Salin tautan"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setLinkToDelete(link)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                      title="Cabut / Hapus tautan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {linkToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
          onClick={() => setLinkToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-150 ${
              isDark
                ? "bg-[#18181b] border-zinc-800 text-white shadow-black/80"
                : "bg-white border-zinc-200 text-black shadow-xl"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold">Hapus Tautan Bersama?</h3>
            </div>

            <p className={`text-xs leading-relaxed mb-4 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              Apakah Anda yakin ingin menghapus tautan untuk{" "}
              <strong>"{linkToDelete.title_snapshot}"</strong>? Siapa pun yang memiliki tautan ini
              tidak akan dapat lagi mengakses percakapan ini.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkToDelete(null)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {deletingId ? "Menghapus..." : "Ya, Hapus Tautan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

