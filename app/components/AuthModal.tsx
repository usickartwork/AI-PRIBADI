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

  // ─── REGISTER SUBMIT: KIRIM KODE OTP KE EMAIL ───────────────────────────────
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
        setErrorMsg(data.error || "Gagal mengirimkan kode OTP ke email.");
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

  // ─── VERIFY OTP: BUAT AKUN DI SUPABASE & ARAHKAN KE LOGIN ──────────────────
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
        setErrorMsg(data.error || "Kode OTP tidak valid atau kedaluwarsa.");
        setLoading(false);
        return;
      }

      // 2. Jika OTP valid, buat akun baru di Supabase
      const { error: signUpError } = await supabase.auth.signUp({
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
      } else {
        // Pastikan tidak langsung login otomatis: sign out jika ada sesi aktif
        await supabase.auth.signOut();

        // Pindah ke form LOGIN terlebih dahulu sesuai permintaan pengguna
        setSuccessMsg("Akun berhasil diverifikasi! Silakan masukkan email dan kata sandi Anda untuk masuk.");
        setTab("login");
        setPassword("");
        setConfirmPassword("");
        setOtpCode("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-300">
      {/* Kartu Modal Minimalis Elegan (Sesuai Referensi Gambar) */}
      <div
        className={`w-full max-w-[380px] rounded-3xl p-7 transition-all relative overflow-hidden shadow-2xl ${
          isDark
            ? "bg-[#161619]/90 border border-white/10 text-white shadow-black/80"
            : "bg-white/95 border border-black/10 text-black shadow-zinc-900/15"
        } liquid-glass`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-32 bg-white/5 blur-3xl pointer-events-none rounded-full" />

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 flex items-center justify-center">
            {/* Geometrical Minimal Sparkle Logo */}
            <svg
              className={`w-8 h-8 ${isDark ? "text-white" : "text-black"}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {tab === "login" && "Sign In"}
            {tab === "register" && "Create Account"}
            {tab === "otp" && "Verification"}
          </h2>
          <p className={`text-xs mt-1.5 font-normal ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
            {tab === "login" && "Please enter your details to sign in."}
            {tab === "register" && "Please enter your details to register."}
            {tab === "otp" && "Enter the 6-digit code sent to your email."}
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

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 rounded-2xl border border-white/20 bg-white/5 p-3 text-xs flex items-start gap-2 text-inherit">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-inherit" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* ─── TAB 1: FORM LOGIN ────────────────────────────────────────────── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`w-full px-4 py-3 rounded-2xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#202024]/70 border-white/5 text-white placeholder-zinc-500 focus:border-white/20 focus:bg-[#202024]"
                    : "bg-zinc-100/80 border-black/5 text-black placeholder-zinc-400 focus:border-black/20 focus:bg-zinc-100"
                }`}
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
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
              className={`w-full py-3 px-4 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-1 ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                  : "bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
              }`}
            >
              {loading && <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              <span>{loading ? "Signing in..." : "Sign in"}</span>
            </button>

            {/* Switch to Register */}
            <div className="pt-3 text-center text-xs">
              <span className={isDark ? "text-zinc-500" : "text-zinc-500"}>
                Don&apos;t have an account?{" "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`font-semibold underline underline-offset-2 transition cursor-pointer ${
                  isDark ? "text-white hover:text-zinc-300" : "text-black hover:text-zinc-700"
                }`}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* ─── TAB 2: FORM DAFTAR (REGISTER) ─────────────────────────────────── */}
        {tab === "register" && (
          <form onSubmit={handleRequestOtp} className="space-y-3.5">
            <div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name (optional)"
                className={`w-full px-4 py-3 rounded-2xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#202024]/70 border-white/5 text-white placeholder-zinc-500 focus:border-white/20 focus:bg-[#202024]"
                    : "bg-zinc-100/80 border-black/5 text-black placeholder-zinc-400 focus:border-black/20 focus:bg-zinc-100"
                }`}
              />
            </div>

            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`w-full px-4 py-3 rounded-2xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#202024]/70 border-white/5 text-white placeholder-zinc-500 focus:border-white/20 focus:bg-[#202024]"
                    : "bg-zinc-100/80 border-black/5 text-black placeholder-zinc-400 focus:border-black/20 focus:bg-zinc-100"
                }`}
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                className={`w-full px-4 py-3 rounded-2xl text-xs border outline-none transition ${
                  isDark
                    ? "bg-[#202024]/70 border-white/5 text-white placeholder-zinc-500 focus:border-white/20 focus:bg-[#202024]"
                    : "bg-zinc-100/80 border-black/5 text-black placeholder-zinc-400 focus:border-black/20 focus:bg-zinc-100"
                }`}
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
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
              className={`w-full py-3 px-4 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-1 ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                  : "bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
              }`}
            >
              {loading && <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              <span>{loading ? "Sending OTP..." : "Continue"}</span>
            </button>

            {/* Switch to Login */}
            <div className="pt-3 text-center text-xs">
              <span className={isDark ? "text-zinc-500" : "text-zinc-500"}>
                Already have an account?{" "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`font-semibold underline underline-offset-2 transition cursor-pointer ${
                  isDark ? "text-white hover:text-zinc-300" : "text-black hover:text-zinc-700"
                }`}
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* ─── TAB 3: SCREEN VERIFIKASI KODE OTP ─────────────────────────────── */}
        {tab === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className={`p-4 rounded-2xl border text-center relative overflow-hidden ${
              isDark
                ? "bg-[#202024]/70 border-white/5 text-white"
                : "bg-zinc-100/80 border-black/5 text-black"
            }`}>
              <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                Code sent to:
              </p>
              <div className="mt-1 font-semibold text-xs break-all">
                {email}
              </div>
            </div>

            {/* Input 6 digit OTP */}
            <div>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className={`w-full py-3.5 px-4 rounded-2xl text-center font-mono font-bold text-2xl tracking-[0.4em] border outline-none transition ${
                  isDark
                    ? "bg-[#202024]/70 border-white/5 text-white placeholder-zinc-600 focus:border-white/20 focus:bg-[#202024]"
                    : "bg-zinc-100/80 border-black/5 text-black placeholder-zinc-400 focus:border-black/20 focus:bg-zinc-100"
                }`}
              />
            </div>

            {/* Tombol Verifikasi & Submit */}
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                  : "bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
              }`}
            >
              {loading && <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
            </button>

            {/* Aksi Tambahan: Kirim Ulang & Kembali */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setErrorMsg(null);
                }}
                className={`text-[11px] underline underline-offset-2 transition cursor-pointer ${
                  isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-black"
                }`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                className={`text-[11px] font-medium transition cursor-pointer ${
                  countdown > 0
                    ? (isDark ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 cursor-not-allowed")
                    : (isDark ? "text-white underline hover:opacity-80" : "text-black underline hover:opacity-80")
                }`}
              >
                {countdown > 0 ? `Resend (${countdown}s)` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
