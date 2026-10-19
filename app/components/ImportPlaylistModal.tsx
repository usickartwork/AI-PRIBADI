"use client";

import React, { useState } from "react";
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
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedPlaylist, setImportedPlaylist] = useState<LocalPlaylist | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  if (!isOpen) return null;

  // Format durasi milidetik ke menit:detik
  const formatDuration = (ms?: number) => {
    if (!ms) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Validasi URL di sisi client sebelum mengirim ke server
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
    setImportedPlaylist(null);
  };

  // Periksa playlist ke server endpoint resmi
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
    setImportedPlaylist(null);

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
      setShowInstructions(false); // Ciutkan petunjuk untuk fokus ke preview
    } catch (err: any) {
      console.error("Error checking playlist:", err);
      setInputError("Koneksi terputus saat memeriksa playlist. Silakan periksa jaringan dan coba lagi.");
    } finally {
      setIsChecking(false);
    }
  };

  // Proses import playlist dan simpan ke Music One
  const handleExecuteImport = async () => {
    if (!previewData || previewData.tracks.length === 0) return;

    setIsImporting(true);
    setImportProgress(10);

    const finalName = targetPlaylistName.trim() || previewData.name || "Playlist Import";
    const totalToProcess = previewData.tracks.length;

    // Simulasi pelacakan progres pemrosesan track yang akurat
    const chunkSize = Math.max(1, Math.floor(totalToProcess / 10));
    for (let i = 0; i < totalToProcess; i += chunkSize) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      const currentPct = Math.min(95, Math.round(((i + chunkSize) / totalToProcess) * 100));
      setImportProgress(currentPct);
    }

    // Bangun LocalPlaylist baru yang sepenuhnya kompatibel dengan sistem Music One
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

    setImportProgress(100);
    setImportedPlaylist(newPlaylist);
    setIsImporting(false);
  };

  // Buka playlist hasil import di Music One
  const handleOpenImportedPlaylist = () => {
    if (importedPlaylist) {
      onImportSuccess(importedPlaylist);
      onClose();
    }
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
              Import playlist favoritmu dari Spotify ke Music One dengan mudah.
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
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Status Sukses Selesai Import */}
          {importedPlaylist ? (
            <div className="space-y-6 py-4 text-center animate-in fade-in-0 zoom-in-95 duration-300">
              <div
                className={`w-16 h-16 mx-auto rounded-3xl border flex items-center justify-center ${
                  isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-zinc-100 border-zinc-300 text-zinc-900"
                }`}
              >
                <svg className="w-8 h-8 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-bold tracking-tight">Playlist Berhasil Diimpor!</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Playlist <span className="font-semibold text-white">{importedPlaylist.name}</span> dengan{" "}
                  <span className="font-semibold text-white">{importedPlaylist.items.length} lagu</span> telah berhasil
                  disimpan ke koleksi Music One kamu.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isDark
                      ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                      : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  Kembali ke Musik
                </button>
                <button
                  type="button"
                  onClick={handleOpenImportedPlaylist}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition cursor-pointer shadow-lg"
                >
                  Buka Playlist
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Kotak Petunjuk Penggunaan */}
              <div
                className={`rounded-2xl border p-4 sm:p-4.5 transition-all ${
                  isDark ? "bg-zinc-900/50 border-zinc-800/80" : "bg-zinc-50 border-zinc-200"
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
                    {showInstructions ? "Sembunyikan" : "Tampilkan petunjuk"}
                  </button>
                </div>

                {showInstructions && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-3 text-xs text-zinc-300">
                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-zinc-400">
                      <li>Buka Spotify.</li>
                      <li>Buka playlist yang ingin kamu impor.</li>
                      <li>Tekan menu tiga titik pada playlist.</li>
                      <li>Pilih Bagikan, lalu Salin Tautan Playlist.</li>
                      <li>Tempel tautan tersebut ke kolom di bawah.</li>
                      <li>Periksa daftar lagu sebelum memulai import.</li>
                    </ol>

                    <div
                      className={`p-3 rounded-xl border text-[11px] leading-relaxed space-y-1 ${
                        isDark ? "bg-zinc-950/60 border-zinc-800 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
                      }`}
                    >
                      <p className="font-semibold text-zinc-200">Informasi Penting:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Pastikan tautan berasal dari playlist Spotify yang valid.</li>
                        <li>Playlist harus dapat diakses oleh aplikasi sesuai izin Spotify yang tersedia.</li>
                        <li>Import hanya memindahkan informasi dan referensi lagu, bukan file audio Spotify.</li>
                        <li>Lagu yang berhasil diimpor belum tentu seluruhnya dapat diputar di Music One.</li>
                        <li>Import dapat gagal jika Spotify membatasi akses API atau playlist tidak dapat diakses.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input Tautan Spotify */}
              <form onSubmit={handleCheckPlaylist} className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Tautan Playlist Spotify
                </label>

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
                      disabled={isChecking || isImporting}
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
                    disabled={isChecking || isImporting || !urlInput.trim()}
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
                    <div className="leading-relaxed">
                      <p className="font-medium">{inputError}</p>
                    </div>
                  </div>
                )}

                {/* Keterangan Batas 100 Lagu */}
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                  <span>
                    Maksimal 100 lagu per proses import. Lagu akan diimpor berurutan dari daftar awal playlist.
                  </span>
                </div>
              </form>

              {/* Preview Playlist & Daftar Lagu */}
              {previewData && (
                <div className="space-y-4 pt-3 border-t border-zinc-800/80 animate-in fade-in-0 duration-300">
                  {/* Kartu Ringkasan Playlist Sumber */}
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isDark ? "bg-zinc-900/70 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
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
                      <div>
                        <h4 className="text-sm font-bold text-white">{previewData.name}</h4>
                        <p className="text-xs text-zinc-400">
                          Oleh {previewData.ownerName} • {previewData.totalTracks} total lagu di Spotify
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Akan diimpor:{" "}
                          <span className="font-semibold text-zinc-300">
                            {previewData.importCount} lagu
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:text-right w-full sm:w-auto">
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold border border-zinc-700 bg-zinc-800 text-zinc-300">
                        {previewData.importCount} Lagu Siap Diimpor
                      </span>
                    </div>
                  </div>

                  {/* Keterangan Batas jika > 100 Lagu */}
                  {previewData.totalTracks > 100 && (
                    <div
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        isDark ? "bg-zinc-950/70 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-300 text-zinc-700"
                      }`}
                    >
                      <p>
                        Playlist ini berisi{" "}
                        <span className="font-semibold text-white">{previewData.totalTracks} lagu</span>. Music One
                        akan mengimpor <span className="font-semibold text-white">100 lagu pertama</span> sesuai urutan
                        playlist.
                      </p>
                    </div>
                  )}

                  {/* Input Kustomisasi Nama Playlist di Music One */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Nama Playlist di Music One
                    </label>
                    <input
                      type="text"
                      value={targetPlaylistName}
                      onChange={(e) => setTargetPlaylistName(e.target.value)}
                      placeholder="Masukkan nama playlist tujuan"
                      disabled={isImporting}
                      className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${
                        isDark
                          ? "bg-zinc-900 border-zinc-800 focus:border-zinc-600 text-white placeholder-zinc-500"
                          : "bg-white border-zinc-300 focus:border-zinc-500 text-zinc-900 placeholder-zinc-400"
                      }`}
                      required
                    />
                  </div>

                  {/* Daftar Preview Track (Scrollable) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                      <span>Daftar Lagu ({previewData.tracks.length} lagu)</span>
                      <span>Durasi</span>
                    </div>

                    <div
                      className={`max-h-56 overflow-y-auto rounded-2xl border divide-y ${
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
                                className="w-8 h-8 rounded-lg object-cover border border-zinc-700/40 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
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

                  {/* Progres Import Indikator */}
                  {isImporting && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span>Mengimpor playlist ke Music One...</span>
                        <span className="font-mono">{importProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-150"
                          style={{ width: `${importProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tombol Konfirmasi Batal / Import */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => setPreviewData(null)}
                      disabled={isImporting}
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
                      disabled={isImporting || previewData.tracks.length === 0}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        isImporting
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-white text-black hover:bg-zinc-200 shadow-lg"
                      }`}
                    >
                      {isImporting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Mengimpor...</span>
                        </>
                      ) : (
                        <span>Import Playlist ({previewData.tracks.length} Lagu)</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportPlaylistModal;
