"use client";

import React, { useState, useEffect } from "react";
import { LocalPlaylist, MusicItem, generatePlaylistId } from "@/lib/music";

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onImportSuccess: (playlist: LocalPlaylist) => void;
}

interface PlaylistPreviewData {
  id: string;
  name: string;
  description: string;
  ownerName: string;
  coverUrl: string | null;
  totalTracks: number;
  importCount: number;
  tracks: MusicItem[];
}

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onImportSuccess,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [previewData, setPreviewData] = useState<PlaylistPreviewData | null>(null);
  const [targetPlaylistName, setTargetPlaylistName] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  // Setiap kali modal dibuka, selalu reset state ke kondisi awal (halaman input tautan)
  useEffect(() => {
    if (isOpen) {
      setUrlInput("");
      setInputError(null);
      setPreviewData(null);
      setTargetPlaylistName("");
      setIsChecking(false);
      setShowInstructions(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format durasi milidetik ke menit:detik
  const formatDuration = (ms?: number) => {
    if (!ms) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Validasi format URL Spotify
  const validateUrlFormat = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("spotify:playlist:")) {
      return /^[0-9A-Za-z]{22}$/.test(trimmed.replace("spotify:playlist:", "").split("?")[0].trim());
    }
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      if (host !== "open.spotify.com" && host !== "www.open.spotify.com") return false;
      const parts = parsed.pathname.split("/").filter(Boolean);
      return parts[0] === "playlist" && !!parts[1] && /^[0-9A-Za-z]{22}$/.test(parts[1].trim());
    } catch {
      return false;
    }
  };

  // Tempel tautan dari clipboard
  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrlInput(text.trim());
          setInputError(null);
        }
      }
    } catch (err) {
      console.warn("Gagal membaca clipboard:", err);
    }
  };

  // Hapus isi input
  const handleClearInput = () => {
    setUrlInput("");
    setInputError(null);
    setPreviewData(null);
  };

  // Periksa playlist ke server
  const handleCheckPlaylist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setInputError("Tautan playlist Spotify tidak boleh kosong.");
      return;
    }

    if (!validateUrlFormat(trimmed)) {
      setInputError("Tautan tidak valid. Pastikan kamu menyalin tautan playlist dari Spotify.");
      return;
    }

    setIsChecking(true);
    setPreviewData(null);

    try {
      const res = await fetch("/api/music/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: trimmed }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setInputError(json.error || "Gagal memeriksa playlist. Silakan coba lagi.");
        return;
      }

      setPreviewData(json.data);
      setTargetPlaylistName(json.data.name || "Playlist Import");
    } catch (err: any) {
      console.error("Error checking playlist:", err);
      setInputError("Koneksi terputus saat memeriksa playlist. Silakan periksa jaringan dan coba lagi.");
    } finally {
      setIsChecking(false);
    }
  };

  // Eksekusi import: langsung simpan playlist, tutup modal, dan bawa pengguna ke playlist
  const handleExecuteImport = () => {
    if (!previewData || previewData.tracks.length === 0) return;

    const finalName = targetPlaylistName.trim() || previewData.name || "Playlist Import";

    const newPlaylist: LocalPlaylist = {
      id: generatePlaylistId(),
      name: finalName,
      description: previewData.description
        ? `${previewData.description} (Diimpor dari Spotify)`
        : `Diimpor dari playlist Spotify "${previewData.name}"`,
      items: previewData.tracks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Langsung daftarkan dan arahkan ke playlist tanpa pop-up lanjutan
    onImportSuccess(newPlaylist);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          isDark
            ? "bg-[#0c0c0e] border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        }`}
      >
        {/* Header Modal */}
        <div
          className={`px-5 sm:px-6 py-4 sm:py-5 border-b flex items-start justify-between gap-4 shrink-0 ${
            isDark ? "border-zinc-800/80 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50/60"
          }`}
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Import Playlist Spotify</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tempel tautan playlist Spotify untuk langsung diimpor ke Music One.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
              isDark
                ? "border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                : "border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
            title="Tutup"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {/* Kotak Petunjuk Sederhana (Collapsible) */}
          <div
            className={`rounded-2xl border p-3.5 transition-all ${
              isDark ? "bg-zinc-900/40 border-zinc-800/70" : "bg-zinc-50 border-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs font-bold tracking-tight">Cara import playlist</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-[11px] text-zinc-400 hover:text-white transition cursor-pointer"
              >
                {showInstructions ? "Sembunyikan" : "Bantuan"}
              </button>
            </div>

            {showInstructions && (
              <div className="mt-2.5 pt-2.5 border-t border-zinc-800/40 space-y-2 text-xs text-zinc-400 leading-relaxed">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Buka playlist Spotify kamu.</li>
                  <li>Tekan menu tiga titik &gt; Bagikan &gt; Salin Tautan.</li>
                  <li>Tempel tautan di bawah dan tekan Enter.</li>
                  <li>Konfirmasi daftar lagu, lalu tekan Import.</li>
                </ol>
                <p className="text-[11px] text-zinc-500">
                  Maksimal 100 lagu per proses import. Lagu diimpor sesuai urutan playlist.
                </p>
              </div>
            )}
          </div>

          {/* Form Input Tautan Spotify */}
          <form onSubmit={handleCheckPlaylist} className="space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="https://open.spotify.com/playlist/..."
                  disabled={isChecking}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition pr-20 ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 focus:border-zinc-600 text-white placeholder-zinc-500"
                      : "bg-white border-zinc-300 focus:border-zinc-500 text-zinc-900 placeholder-zinc-400"
                  } ${inputError ? "border-zinc-600" : ""}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {urlInput && (
                    <button
                      type="button"
                      onClick={handleClearInput}
                      className="px-1.5 py-1 text-[11px] text-zinc-400 hover:text-white transition cursor-pointer"
                      title="Hapus input"
                    >
                      Hapus
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                      isDark
                        ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    }`}
                    title="Tempel dari Clipboard"
                  >
                    Tempel
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChecking || !urlInput.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                  isChecking || !urlInput.trim()
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
                    : "bg-white text-black hover:bg-zinc-200 shadow-md"
                }`}
              >
                {isChecking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Memeriksa...</span>
                  </>
                ) : (
                  <span>Periksa Playlist</span>
                )}
              </button>
            </div>

            {/* Pesan Kesalahan / Validasi */}
            {inputError && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isDark ? "bg-zinc-900/80 border-zinc-700 text-zinc-300" : "bg-zinc-100 border-zinc-300 text-zinc-800"
                }`}
              >
                <svg className="w-4 h-4 shrink-0 text-zinc-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="font-medium leading-relaxed">{inputError}</p>
              </div>
            )}
          </form>

          {/* Preview Playlist & Daftar Lagu Sebelum Konfirmasi */}
          {previewData && (
            <div className="space-y-4 pt-3 border-t border-zinc-800/80 animate-in fade-in-0 duration-200">
              {/* Kartu Ringkasan Playlist */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDark ? "bg-zinc-900/70 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {previewData.coverUrl ? (
                    <img
                      src={previewData.coverUrl}
                      alt={previewData.name}
                      className="w-14 h-14 rounded-xl object-cover border border-zinc-700/60 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018M21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2c.968 0 1.815.395 2.378 1.018"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{previewData.name}</h4>
                    <p className="text-xs text-zinc-400 truncate">
                      Oleh {previewData.ownerName} • {previewData.totalTracks} total lagu di Spotify
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Siap diimpor: <span className="font-semibold text-zinc-300">{previewData.importCount} lagu</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold border border-zinc-700 bg-zinc-800 text-zinc-300">
                    {previewData.importCount} Lagu Terverifikasi
                  </span>
                </div>
              </div>

              {/* Input Nama Playlist di Music One */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Nama Playlist di Music One
                </label>
                <input
                  type="text"
                  value={targetPlaylistName}
                  onChange={(e) => setTargetPlaylistName(e.target.value)}
                  placeholder="Nama playlist tujuan"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 focus:border-zinc-600 text-white placeholder-zinc-500"
                      : "bg-white border-zinc-300 focus:border-zinc-500 text-zinc-900 placeholder-zinc-400"
                  }`}
                  required
                />
              </div>

              {/* Daftar Preview Track dengan Cover Asli Masing-masing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span>Daftar Lagu ({previewData.tracks.length} lagu)</span>
                  <span>Durasi</span>
                </div>

                <div
                  className={`max-h-60 overflow-y-auto rounded-2xl border divide-y ${
                    isDark
                      ? "bg-zinc-950/40 border-zinc-800/80 divide-zinc-800/40"
                      : "bg-zinc-50 border-zinc-200 divide-zinc-200"
                  }`}
                >
                  {previewData.tracks.map((track, idx) => (
                    <div
                      key={track.id || idx}
                      className="flex items-center justify-between p-2.5 sm:px-3 text-xs gap-3 hover:bg-zinc-800/20 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] text-zinc-500 font-mono w-5 text-right shrink-0">
                          {idx + 1}
                        </span>
                        {track.artworkUrl ? (
                          <img
                            src={track.artworkUrl}
                            alt={track.title}
                            className="w-9 h-9 rounded-lg object-cover border border-zinc-700/40 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                            <span className="text-[10px]">♪</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{track.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {track.artistNames.join(", ")}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                        {formatDuration(track.durationMs)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol Konfirmasi: Batal / Oke (Import Playlist) */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isDark
                      ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                      : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition cursor-pointer shadow-lg"
                >
                  Import Playlist ({previewData.tracks.length} Lagu)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportPlaylistModal;
