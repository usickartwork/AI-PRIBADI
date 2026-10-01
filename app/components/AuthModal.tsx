"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type AuthModalProps = {
  isDark: boolean;
  onSuccess: () => void;
};

export function AuthModal({ isDark, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State untuk alur OTP
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Timer countdown untuk kirim ulang OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ─── LOGIN HANDLER ──────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg("Koneksi Supabase belum terkonfigurasi. Harap periksa file environment.");
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

  // ─── REGISTER SUBMIT: GENERATE & REQUEST OTP ────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg("Koneksi Supabase belum terkonfigurasi. Harap periksa file environment.");
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

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal membuat kode OTP verifikasi.");
      } else {
        setOtpCode("");
        setCountdown(60);
        setTab("otp");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat meminta kode OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ─── VERIFY OTP & CREATE ACCOUNT IN SUPABASE ───────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (otpCode.trim().length !== 6) {
      setErrorMsg("Harap masukkan 6 digit kode OTP lengkap.");
      return;
    }

    setLoading(true);
    try {
      // 1. Verifikasi kode OTP ke server
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email: email.trim(), code: otpCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Kode OTP tidak valid.");
        setLoading(false);
        return;
      }

      // 2. Jika OTP valid, buat akun baru di Supabase
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
          },
        },
      });

      if (signUpError) {
        setErrorMsg(signUpError.message);
      } else if (signUpData.session) {
        onSuccess();
      } else {
        // Otomatis login dengan kredensial yang baru diverifikasi
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!signInError && signInData.session) {
          onSuccess();
        } else {
          setSuccessMsg("Akun berhasil diverifikasi! Silakan masuk dengan email dan kata sandi Anda.");
          setTab("login");
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat memverifikasi akun.");
    } finally {
      setLoading(false);
    }
  };

  // ─── KIRIM ULANG KODE OTP ───────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(60);
      } else {
        setErrorMsg(data.error || "Gagal mengirim ulang OTP.");
      }
    } catch {
      setErrorMsg("Gagal mengirim ulang OTP.");
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
            {tab === "otp"
              ? "Verifikasi 6-digit kode OTP untuk menyelesaikan pendaftaran"
              : "Silakan masuk atau buat akun untuk mulai menggunakan AI"}
          </p>
        </div>

        {/* Tabs: Masuk / Daftar (Hanya muncul jika bukan layar OTP) */}
        {tab !== "otp" && (
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
        )}

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

        {/* ─── TAB 1: FORM LOGIN ────────────────────────────────────────────── */}
        {tab === "login" && (
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
        )}

        {/* ─── TAB 2: FORM DAFTAR (REQUEST OTP) ─────────────────────────────── */}
        {tab === "register" && (
          <form onSubmit={handleRequestOtp} className="space-y-3.5">
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
              <span>{loading ? "Menyiapkan OTP..." : "Daftar & Dapatkan Kode OTP"}</span>
            </button>
          </form>
        )}

        {/* ─── TAB 3: SCREEN VERIFIKASI KODE OTP ─────────────────────────────── */}
        {tab === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Informasi Pengiriman Kode OTP ke Email */}
            <div className={`p-4 rounded-2xl border text-center relative overflow-hidden ${
              isDark
                ? "bg-[#111115] border-zinc-850 text-white"
                : "bg-zinc-100 border-zinc-200 text-black"
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Kode OTP Terkirim ke Email</span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                Kami telah mengirimkan 6-digit kode verifikasi ke:
              </p>
              <div className="mt-1 font-semibold text-xs text-emerald-600 dark:text-emerald-400 break-all">
                {email}
              </div>
              <p className={`text-[11px] mt-2 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                Silakan cek kotak masuk (Inbox) atau folder Spam Anda.<br/>Kode berlaku selama 5 menit.
              </p>
            </div>

            {/* Input 6 digit OTP */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 text-center ${isDark ? "text-zinc-300" : "text-black"}`}>
                Masukkan 6-Digit Kode OTP dari Email:
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className={`w-full py-3 px-4 rounded-xl text-center font-mono font-black text-2xl tracking-[0.45em] border outline-none transition ${
                  isDark
                    ? "bg-[#1a1a20] border-zinc-700 text-white placeholder-zinc-600 focus:border-white"
                    : "bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black"
                }`}
              />
            </div>

            {/* Tombol Verifikasi & Submit */}
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                  : "bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
              }`}
            >
              {loading && <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              <span>{loading ? "Memverifikasi OTP..." : "Verifikasi & Buat Akun"}</span>
            </button>

            {/* Aksi Tambahan: Kirim Ulang & Kembali */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setErrorMsg(null);
                }}
                className={`text-[11px] font-semibold underline underline-offset-2 transition cursor-pointer ${
                  isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
                }`}
              >
                ← Ubah Data Pendaftaran
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                className={`text-[11px] font-semibold transition cursor-pointer ${
                  countdown > 0
                    ? (isDark ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 cursor-not-allowed")
                    : (isDark ? "text-white underline hover:opacity-80" : "text-black underline hover:opacity-80")
                }`}
              >
                {countdown > 0 ? `Kirim ulang (${countdown}s)` : "Kirim Ulang OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className={`mt-5 text-center text-[11px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>
          Sistem Autentikasi Mandiri & Database Supabase
        </div>
      </div>
    </div>
  );
}
