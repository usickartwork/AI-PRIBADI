"use client";

import React, { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Mail, Lock } from "lucide-react";
import { AnimatedFormField, SocialButton, FloatingParticles } from "@/components/ui/sign-in-flo";

type AuthModalProps = {
  isDark: boolean;
  onSuccess: () => void;
};

export function AuthModal({ isDark, onSuccess }: AuthModalProps) {
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Clerk Instance
  const clerk = useClerk();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── CLERK OAUTH (GOOGLE & APPLE) HANDLER ───────────────────────────────────
  // Sign up dan Sign in digabung: otomatis membuat akun baru pada login pertama kali.
  const handleOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setErrorMsg(null);

    const isClerkKeyConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    if (!isClerkKeyConfigured) {
      setErrorMsg("Clerk key belum dikonfigurasi.");
      return;
    }

    setOauthLoading(strategy);
    try {
      if (!clerk.loaded) {
        window.location.href = `/sign-in`;
        return;
      }
      await clerk.client.signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      console.error("Clerk OAuth redirect error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Gagal mengarahkan ke layanan login.");
      setOauthLoading(null);
    }
  };

  // ─── EMAIL / USERNAME + PASSWORD LOGIN (VIA SERVER TICKET STRATEGY) ──────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg("Harap masukkan email/username dan password.");
      return;
    }

    setLoading(true);
    try {
      if (!clerk.loaded) {
        setErrorMsg("Layanan autentikasi belum siap. Silakan tunggu sebentar.");
        setLoading(false);
        return;
      }

      // Verifikasi kredensial via backend API resmi Clerk
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.token) {
        setErrorMsg(data.error || "Gagal masuk. Periksa kembali username/email dan password Anda.");
        setLoading(false);
        return;
      }

      // Aktifkan sesi menggunakan Clerk SignInToken resmi (strategy ticket)
      const signInAttempt = await clerk.client.signIn.create({
        strategy: "ticket",
        ticket: data.token,
      });

      if (signInAttempt.status === "complete" && signInAttempt.createdSessionId) {
        await clerk.setActive({ session: signInAttempt.createdSessionId });
        onSuccess();
      } else {
        setErrorMsg("Login tidak berhasil. Silakan coba lagi.");
      }
    } catch (err: unknown) {
      console.error("Clerk login error:", err);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat masuk.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-300">
      {/* Kartu Modal Sign In Flo Elegance */}
      <div
        className={`w-full max-w-[400px] rounded-3xl p-7 sm:p-8 transition-all relative overflow-hidden shadow-2xl ${
          isDark
            ? "bg-[#111113]/90 border border-white/10 text-white shadow-black/90"
            : "bg-white/95 border border-black/10 text-black shadow-zinc-900/15"
        }`}
      >
        {/* Interactive Floating Particle Background Effect */}
        <FloatingParticles isDark={isDark} />

        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-32 blur-3xl pointer-events-none rounded-full ${
            isDark ? "bg-white/5" : "bg-black/5"
          }`}
        />

        <div className="relative z-10">
          {/* Header Brand: Usick One Standalone Star Logo & One Mind */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="mb-3.5 flex items-center justify-center">
              <svg
                className={`w-12 h-12 transition-transform duration-300 hover:scale-110 drop-shadow-sm ${
                  isDark ? "text-white fill-white" : "text-black fill-black"
                }`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
            </div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
              Usick One
            </h1>
            <p className={`text-sm mt-1.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              One Mind
            </p>
          </div>

          {/* Pesan Error */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl text-xs bg-red-500/10 border border-red-500/25 text-red-400 flex items-start gap-2.5 animate-in fade-in-0 duration-200"
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Form Login: Email/Username & Password dengan Animated Effect */}
          <form onSubmit={handleLogin} className="space-y-4">
            <AnimatedFormField
              type="text"
              placeholder="Username atau Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              icon={<Mail size={17} />}
              autoComplete="username"
              required
              isDark={isDark}
            />

            <AnimatedFormField
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={17} />}
              showToggle
              onToggle={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
              autoComplete="current-password"
              required
              isDark={isDark}
            />

            {/* Tombol Sign In dengan Gradient Shine Sweep Effect */}
            <button
              type="submit"
              disabled={loading || Boolean(oauthLoading)}
              className={`w-full relative group py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ease-in-out overflow-hidden shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-100 shadow-white/10"
                  : "bg-black text-white hover:bg-zinc-800 shadow-black/20"
              }`}
            >
              <span className={`transition-opacity duration-200 ${loading ? "opacity-0" : "opacity-100"}`}>
                Sign In
              </span>

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`w-4 h-4 border-2 rounded-full animate-spin ${
                      isDark
                        ? "border-black/30 border-t-black"
                        : "border-white/30 border-t-white"
                    }`}
                  />
                </div>
              )}

              {/* Shimmer sweep animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            </button>
          </form>

          {/* Divider: Or continue with */}
          <div className="mt-6 mb-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? "border-zinc-800" : "border-zinc-200"}`} />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className={`px-2.5 ${isDark ? "bg-[#111113] text-zinc-500" : "bg-white text-zinc-400"}`}>
                  Atau lanjutkan dengan
                </span>
              </div>
            </div>
          </div>

          {/* Khusus Gmail (Google) dan Apple Saja */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google / Gmail Button */}
            <SocialButton
              name="Google"
              disabled={loading || Boolean(oauthLoading)}
              isDark={isDark}
              onClick={() => handleOAuth("oauth_google")}
              icon={
                oauthLoading === "oauth_google" ? (
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                )
              }
            />

            {/* Apple Button */}
            <SocialButton
              name="Apple"
              disabled={loading || Boolean(oauthLoading)}
              isDark={isDark}
              onClick={() => handleOAuth("oauth_apple")}
              icon={
                oauthLoading === "oauth_apple" ? (
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.17.65-2.85 1.44-.59.69-1.12 1.76-1.03 2.82 1.07.08 2.2-.62 2.87-1.39z" />
                  </svg>
                )
              }
            />
          </div>

          {/* Info Footer: Pendaftaran Akun Baru Otomatis via OAuth */}
          <div className="mt-6 text-center">
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              Belum punya akun? Masuk dengan{" "}
              <button
                type="button"
                onClick={() => handleOAuth("oauth_google")}
                className={`font-semibold underline underline-offset-2 transition cursor-pointer ${
                  isDark ? "text-white hover:text-zinc-300" : "text-black hover:text-zinc-700"
                }`}
              >
                Google
              </button>{" "}
              atau{" "}
              <button
                type="button"
                onClick={() => handleOAuth("oauth_apple")}
                className={`font-semibold underline underline-offset-2 transition cursor-pointer ${
                  isDark ? "text-white hover:text-zinc-300" : "text-black hover:text-zinc-700"
                }`}
              >
                Apple
              </button>{" "}
              untuk mendaftar otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
