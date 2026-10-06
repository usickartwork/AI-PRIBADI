"use client";

import { useState } from "react";

type CompleteProfileModalProps = {
  isDark: boolean;
  userId: string;
  email: string;
  onSuccess: () => void;
};

export function CompleteProfileModal({
  isDark,
  userId,
  email,
  onSuccess,
}: CompleteProfileModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMsg("Username wajib diisi.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanUsername)) {
      setErrorMsg("Username harus 3-20 karakter (huruf, angka, _, atau -).");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password minimal harus 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username: cleanUsername,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal menyimpan username dan password.");
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-300">
      <div
        className={`w-full max-w-[390px] rounded-3xl p-7 relative overflow-hidden shadow-2xl ${
          isDark
            ? "bg-[#161619]/95 border border-white/10 text-white shadow-black/80"
            : "bg-white/95 border border-black/10 text-black shadow-zinc-900/15"
        } liquid-glass`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-32 bg-white/5 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 flex items-center justify-center">
            <svg
              className={`w-8 h-8 ${isDark ? "text-white" : "text-black"}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Complete Your Account
          </h2>
          <p className={`text-xs mt-1.5 font-normal ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
            Akun baru terdeteksi. Harap buat username dan password untuk akun Anda agar bisa masuk kapan saja.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500 flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email (Read Only) */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">
              Email Terdaftar
            </label>
            <input
              type="email"
              readOnly
              value={email}
              className={`w-full px-4 py-3 rounded-2xl text-xs border outline-none cursor-not-allowed ${
                isDark
                  ? "bg-[#202024]/40 border-white/5 text-zinc-400"
                  : "bg-zinc-100/60 border-black/5 text-zinc-500"
              }`}
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: filius99"
              className={`w-full px-4 py-3 rounded-2xl text-xs border outline-none transition ${
                isDark
                  ? "bg-[#202024]/70 border-white/5 text-white placeholder-zinc-500 focus:border-white/20 focus:bg-[#202024]"
                  : "bg-zinc-100/80 border-black/5 text-black placeholder-zinc-400 focus:border-black/20 focus:bg-zinc-100"
              }`}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">
              Password Akun <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className={`w-full px-4 py-3 rounded-2xl text-xs border outline-none transition ${
                isDark
                  ? "bg-[#202024]/70 border-white/5 text-white placeholder-zinc-500 focus:border-white/20 focus:bg-[#202024]"
                  : "bg-zinc-100/80 border-black/5 text-black placeholder-zinc-400 focus:border-black/20 focus:bg-zinc-100"
              }`}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">
              Konfirmasi Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password di atas"
              className={`w-full px-4 py-3 rounded-2xl text-xs border outline-none transition ${
                isDark
                  ? "bg-[#202024]/70 border-white/5 text-white placeholder-zinc-500 focus:border-white/20 focus:bg-[#202024]"
                  : "bg-zinc-100/80 border-black/5 text-black placeholder-zinc-400 focus:border-black/20 focus:bg-zinc-100"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 ${
              isDark
                ? "bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                : "bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
            }`}
          >
            {loading && <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
            <span>{loading ? "Menyimpan data..." : "Simpan & Lanjutkan"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
