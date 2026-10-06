"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useClerk } from "@clerk/nextjs";

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

  // Clerk Instance
  const clerk = useClerk();

  // State untuk alur OTP
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);

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

  // ─── CLERK OAUTH (GOOGLE & APPLE) HANDLER ───────────────────────────────────
  const handleOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const isClerkKeyConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    if (!isClerkKeyConfigured) {
      setErrorMsg("Kunci NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY belum disetel di .env.local.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "register") {
        if (!clerk.loaded) {
          window.location.href = `/sign-up`;
          return;
        }
        await clerk.client.signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      } else {
        if (!clerk.loaded) {
          window.location.href = `/sign-in`;
          return;
        }
        await clerk.client.signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      }
    } catch (err: unknown) {
      console.error("Clerk OAuth redirect error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Gagal mengarahkan ke layanan login.");
      setLoading(false);
    }
  };

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
        if (data.token) {
          setOtpToken(data.token);
        }
        if (data.devOtp) {
          setOtpCode(data.devOtp);
          setSandboxNotice(`Mode Sandbox: Kode verifikasi Anda adalah ${data.devOtp}`);
        } else {
          setOtpCode("");
          setSandboxNotice(null);
        }
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
        body: JSON.stringify({
          action: "verify",
          email: email.trim(),
          code: otpCode.trim(),
          token: otpToken,
        }),
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
        setOtpToken(null);
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
        if (data.token) {
          setOtpToken(data.token);
        }
        if (data.devOtp) {
          setOtpCode(data.devOtp);
          setSandboxNotice(`Mode Sandbox: Kode verifikasi baru Anda adalah ${data.devOtp}`);
        }
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

        {/* ─── GOOGLE & APPLE SSO BUTTONS (CLERK) ────────────────────────── */}
        {(tab === "login" || tab === "register") && (
          <div className="space-y-2 mb-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleOAuth("oauth_google")}
              className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold border transition flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs ${
                isDark
                  ? "border-zinc-700/80 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600"
                  : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{tab === "login" ? "Continue with Google" : "Sign up with Google"}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleOAuth("oauth_apple")}
              className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold border transition flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs ${
                isDark
                  ? "border-zinc-700/80 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600"
                  : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400"
              }`}
            >
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-7.85-12.02-14.3-5.26-7.85-9.44-16.71-12.54-26.58-3.1-9.87-4.66-19.46-4.66-28.77 0-14.05 3.63-25.75 10.88-35.09 7.25-9.35 16.32-14.15 27.2-14.4 4.8 0 10.15 1.25 16.06 3.75 5.91 2.5 9.77 3.8 11.58 3.9 1.48 0 5.47-1.39 11.98-4.17 6.5-2.77 12.1-4.04 16.8-3.8 12.44.63 22.22 5.14 29.35 13.55-10.93 6.64-16.29 15.86-16.08 27.67.22 9.24 3.7 16.92 10.45 23.03 6.74 6.12 14.83 9.68 24.26 10.68-2.22 6.67-4.88 13.25-7.98 19.74zM119.22 31.84c0-7.25 2.65-13.97 7.95-20.16 5.3-6.19 11.83-10.18 19.59-11.98.54 1.34.82 2.76.82 4.25 0 7.37-2.78 14.17-8.34 20.4-5.56 6.23-12.22 10.08-19.98 11.56-.03-1.39-.04-2.75-.04-4.07z" />
              </svg>
              <span>{tab === "login" ? "Continue with Apple" : "Sign up with Apple"}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center pt-2.5 pb-1">
              <div className={`w-full border-t ${isDark ? "border-white/10" : "border-black/10"}`} />
              <span
                className={`absolute px-2 text-[10px] uppercase font-semibold tracking-wider ${
                  isDark ? "bg-[#161619] text-zinc-500" : "bg-white text-zinc-400"
                }`}
              >
                or
              </span>
            </div>
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

            {sandboxNotice && (
              <div className={`p-3 rounded-2xl border text-xs text-center ${
                isDark ? "bg-zinc-900/90 border-zinc-700 text-zinc-200" : "bg-zinc-100 border-zinc-300 text-zinc-800"
              }`}>
                <p className="font-semibold">{sandboxNotice}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  (Kode otomatis diisikan ke kolom di bawah)
                </p>
              </div>
            )}

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
