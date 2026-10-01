"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type AuthModalProps = {
  isDark: boolean;
  onSuccess: () => void;
};

export function AuthModal({ isDark, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg("Koneksi Supabase belum terkonfigurasi. Harap isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di file .env.local.");
      return;
    }

    if (!email || !password) {
      setErrorMsg("Harap masukkan email dan kata sandi.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        onSuccess();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg("Koneksi Supabase belum terkonfigurasi. Harap isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di file .env.local.");
      return;
    }

    if (!email || !password) {
      setErrorMsg("Harap isi semua kolom yang diperlukan.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal harus terdiri dari 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (!pin.trim()) {
      setErrorMsg("Harap masukkan Kode PIN Verifikasi Akses.");
      return;
    }

    setLoading(true);
    try {
      // 1. Verifikasi PIN Akses via API Server
      const pinRes = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const pinData = await pinRes.json();

      if (!pinRes.ok || !pinData.valid) {
        setErrorMsg(pinData.error || "Kode PIN Verifikasi salah. Hubungi admin untuk mendapatkan PIN akses.");
        setLoading(false);
        return;
      }

      // 2. Jika PIN valid, daftarkan akun ke Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
        onSuccess();
      } else {
        // Coba auto sign in jika auto confirm aktif
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!signInErr && signInData.session) {
          onSuccess();
        } else {
          setSuccessMsg("Pendaftaran berhasil diverifikasi! Silakan masuk dengan email dan kata sandi Anda.");
          setTab("login");
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-300">
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 transition-all relative overflow-hidden shadow-2xl ${
          isDark
            ? "bg-[#16161a] border border-zinc-800 text-white shadow-black/90"
            : "bg-white border border-zinc-200 text-black shadow-zinc-900/20"
        } liquid-glass`}
      >
        {/* Specular highlight border top */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none" />

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 flex items-center justify-center animate-float">
            <svg
              className={`w-10 h-10 drop-shadow-md ${
                isDark ? "text-white fill-white" : "text-black fill-black"
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Usick V1 Intelligence
          </h2>
          <p className={`text-xs mt-1 font-medium ${isDark ? "text-zinc-400" : "text-black"}`}>
            Silakan masuk atau buat akun untuk mulai menggunakan AI
          </p>
        </div>

        {/* Notice jika Supabase belum diisi */}
        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-500 dark:text-amber-300 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Setup Supabase Diperlukan</span>
            </p>
            <span>
              Harap tambahkan <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> pada file <code>.env.local</code>.
            </span>
          </div>
        )}

        {/* Tabs: Masuk / Daftar */}
        <div className={`grid grid-cols-2 p-1 rounded-2xl mb-6 border ${
          isDark ? "bg-[#111114] border-zinc-800" : "bg-zinc-100 border-zinc-200"
        }`}>
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              tab === "login"
                ? (isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs")
                : (isDark ? "text-zinc-400 hover:text-white" : "text-black hover:opacity-75")
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              tab === "register"
                ? (isDark ? "bg-white text-black shadow-xs" : "bg-black text-white shadow-xs")
                : (isDark ? "text-zinc-400 hover:text-white" : "text-black hover:opacity-75")
            }`}
          >
            Daftar (Register)
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Content */}
        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-zinc-300" : "text-black"}`}>
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#1a1a20] border-zinc-750 text-white placeholder-zinc-500 focus:border-white"
                    : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black"
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-zinc-300" : "text-black"}`}>
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#1a1a20] border-zinc-750 text-white placeholder-zinc-500 focus:border-white"
                    : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                  : "bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
              }`}
            >
              {loading && <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              <span>{loading ? "Memproses Masuk..." : "Masuk ke Akun"}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? "text-zinc-300" : "text-black"}`}>
                Nama Lengkap / Panggilan
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Usick Art"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#1a1a20] border-zinc-750 text-white placeholder-zinc-500 focus:border-white"
                    : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black"
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? "text-zinc-300" : "text-black"}`}>
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#1a1a20] border-zinc-750 text-white placeholder-zinc-500 focus:border-white"
                    : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black"
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? "text-zinc-300" : "text-black"}`}>
                Kata Sandi (Minimal 6 karakter)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#1a1a20] border-zinc-750 text-white placeholder-zinc-500 focus:border-white"
                    : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black"
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? "text-zinc-300" : "text-black"}`}>
                Ulangi Kata Sandi
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#1a1a20] border-zinc-750 text-white placeholder-zinc-500 focus:border-white"
                    : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black"
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-xs font-bold ${isDark ? "text-zinc-300" : "text-black"}`}>
                  Kode PIN Verifikasi Akses
                </label>
                <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Wajib Verifikasi
                </span>
              </div>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN rahasia pendaftaran..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition font-mono tracking-wider ${
                  isDark
                    ? "bg-[#1a1a20] border-zinc-750 text-white placeholder-zinc-500 focus:border-white"
                    : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                  : "bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
              }`}
            >
              {loading && <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              <span>{loading ? "Mendaftarkan Akun..." : "Buat Akun Baru"}</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className={`mt-5 text-center text-[11px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>
          Terhubung dengan database aman Supabase
        </div>
      </div>
    </div>
  );
}
