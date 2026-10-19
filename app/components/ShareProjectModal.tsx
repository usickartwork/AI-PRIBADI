"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Globe, Loader2, RefreshCw, Share2, Trash2, X } from "lucide-react";

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  session: {
    id: string;
    title: string;
    messages: any[];
  } | null;
  onOpenSharedLinks?: () => void;
}

export function ShareProjectModal({
  isOpen,
  onClose,
  isDark,
  session,
  onOpenSharedLinks,
}: ShareProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [existingToken, setExistingToken] = useState<string | null>(null);
  const [linkUpdatedAt, setLinkUpdatedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if link already exists for this session when modal opens
  useEffect(() => {
    if (!isOpen || !session?.id) {
      setExistingToken(null);
      setLinkUpdatedAt(null);
      setCopied(false);
      setError(null);
      setShowRevokeConfirm(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/share?contentId=${encodeURIComponent(session.id)}`, {
      method: "GET",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.link?.public_token) {
          setExistingToken(data.link.public_token);
          setLinkUpdatedAt(data.link.updated_at || data.link.created_at);
        } else {
          setExistingToken(null);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("[ShareProjectModal] fetch existing link error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, session?.id]);

  if (!isOpen || !session) return null;

  const origin =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? window.location.origin
      : "https://onemind.web.id";
  const shareUrl = existingToken ? `${origin}/share/${existingToken}` : "";

  const handleCreateOrUpdate = async (isUpdate = false) => {
    if (!session || isCreating || isUpdating) return;
    setError(null);
    if (isUpdate) setIsUpdating(true);
    else setIsCreating(true);

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: session.id,
          contentType: "chat",
          title: session.title || "Percakapan Usick One",
          messages: session.messages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat tautan bersama.");
      }

      setExistingToken(data.link.public_token);
      setLinkUpdatedAt(data.link.updated_at || data.link.created_at);

      // Auto copy on initial creation for instant UX
      if (!isUpdate && data.link.public_token) {
        const url = `${origin}/share/${data.link.public_token}`;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {}
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses tautan.");
    } finally {
      setIsCreating(false);
      setIsUpdating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Gagal menyalin tautan ke clipboard.");
    }
  };

  const handleRevoke = async () => {
    if (!existingToken || isRevoking) return;
    setIsRevoking(true);
    setError(null);

    try {
      const res = await fetch(`/api/share?id=${encodeURIComponent(existingToken)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mencabut tautan.");
      }
      setExistingToken(null);
      setLinkUpdatedAt(null);
      setShowRevokeConfirm(false);
    } catch (err: any) {
      setError(err?.message || "Gagal mencabut tautan.");
    } finally {
      setIsRevoking(false);
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 animate-in zoom-in-95 ${
          isDark
            ? "bg-[#141417] border-zinc-800 text-zinc-100 shadow-black/80"
            : "bg-white border-zinc-200 text-zinc-900 shadow-xl"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-100 bg-zinc-50/50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
              }`}
            >
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-sm sm:text-base font-bold tracking-tight">
                Bagikan Proyek (Share)
              </h2>
              <p className={`text-[11px] truncate max-w-[260px] sm:max-w-[340px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                {session.title || "Percakapan"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
              isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-zinc-500 hover:text-black hover:bg-zinc-100"
            }`}
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Information Notice */}
          <div
            className={`rounded-xl p-3.5 border flex items-start gap-3 text-xs leading-relaxed ${
              isDark
                ? "bg-zinc-900/40 border-zinc-800 text-zinc-300"
                : "bg-zinc-50 border-zinc-200 text-zinc-700"
            }`}
          >
            <Globe className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
            <div>
              <p className="font-semibold text-zinc-200 dark:text-zinc-100">
                Akses Publik Melalui Tautan
              </p>
              <p className="mt-0.5 opacity-90 text-[11.5px]">
                Siapa pun yang memiliki tautan ini dapat melihat percakapan proyek ini tanpa harus masuk (login).
                Nama akun Anda tidak dipublikasikan demi privasi.
              </p>
            </div>
          </div>

          {/* Project Details Snapshot Box */}
          <div
            className={`rounded-xl p-3 border text-xs flex items-center justify-between ${
              isDark ? "bg-zinc-900/20 border-zinc-800/80" : "bg-zinc-50/50 border-zinc-200/80"
            }`}
          >
            <div className="min-w-0 pr-2">
              <span className={`text-[11px] block font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Judul Proyek
              </span>
              <span className="font-semibold truncate block mt-0.5">
                {session.title || "Percakapan Usick One"}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <span className={`text-[11px] block font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Jumlah Pesan
              </span>
              <span className="font-semibold block mt-0.5">
                {session.messages?.length || 0} pesan
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {error}
            </div>
          )}

          {/* Loading initial status */}
          {loading && (
            <div className="py-6 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <span className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Memeriksa tautan...
              </span>
            </div>
          )}

          {/* State 1: Link ALREADY EXISTS */}
          {!loading && existingToken && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={isDark ? "text-zinc-200" : "text-zinc-800"}>
                  Tautan Aktif
                </span>
                {linkUpdatedAt && (
                  <span className={`text-[11px] font-normal ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Diperbarui: {formatDate(linkUpdatedAt)}
                  </span>
                )}
              </div>

              {/* Copy URL Input Group */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className={`w-full rounded-xl pl-3.5 pr-24 py-2.5 text-xs font-mono border focus:outline-none transition ${
                    isDark
                      ? "bg-black/40 border-zinc-700/80 text-zinc-200"
                      : "bg-zinc-100 border-zinc-300 text-zinc-800"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`absolute right-1 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : isDark
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons: Open, Update snapshot, Revoke */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isDark
                      ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Tautan</span>
                </a>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleCreateOrUpdate(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isDark
                      ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-black"
                  } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  title="Perbarui snapshot tautan dengan pesan-pesan terbaru"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                  <span>{isUpdating ? "Memperbarui..." : "Perbarui Tautan"}</span>
                </button>

                {!showRevokeConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowRevokeConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition cursor-pointer ml-auto"
                    title="Cabut akses tautan publik ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cabut Akses</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 ml-auto animate-in fade-in-0 duration-150">
                    <span className="text-[11px] text-red-400 font-medium">Yakin cabut?</span>
                    <button
                      type="button"
                      disabled={isRevoking}
                      onClick={handleRevoke}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
                    >
                      {isRevoking ? "Mencabut..." : "Ya, Cabut"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRevokeConfirm(false)}
                      className={`px-2 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                        isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
                      }`}
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* State 2: Link DOES NOT EXIST YET */}
          {!loading && !existingToken && (
            <div className="pt-2">
              <button
                type="button"
                disabled={isCreating}
                onClick={() => handleCreateOrUpdate(false)}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-black text-white hover:bg-zinc-800"
                } ${isCreating ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Membuat tautan bersama...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Buat Tautan Publik</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer / Manage Links Shortcut */}
        {onOpenSharedLinks && (
          <div
            className={`px-5 py-3 border-t flex items-center justify-between text-xs ${
              isDark ? "border-zinc-800/80 bg-zinc-900/20" : "border-zinc-100 bg-zinc-50/50"
            }`}
          >
            <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>
              Ingin mengelola semua tautan yang pernah dibuat?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSharedLinks();
              }}
              className={`font-semibold underline cursor-pointer hover:opacity-80 transition ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Kelola Tautan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

