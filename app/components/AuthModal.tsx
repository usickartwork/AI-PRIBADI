"use client";

import React, { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Login16 from "@/components/ui/login-16";

type AuthModalProps = {
  isDark: boolean;
  onSuccess: () => void;
};

export function AuthModal({ isDark, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clerk = useClerk();

  // ─── CLERK OAUTH (GOOGLE & APPLE) HANDLER ───────────────────────────────────
  const handleOAuth = async (provider: "google" | "apple") => {
    const strategy = provider === "google" ? "oauth_google" : "oauth_apple";
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

  // ─── EMAIL / USERNAME + PASSWORD HANDLER ────────────────────────────────────
  const handleAuthSubmit = async (
    e: React.FormEvent,
    { identifier, password }: { identifier: string; password: string }
  ) => {
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

      if (mode === "sign-in") {
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
      } else {
        // Sign-up flow
        const signUpAttempt = await clerk.client.signUp.create({
          emailAddress: identifier.trim(),
          password,
        });

        if (signUpAttempt.status === "complete" && signUpAttempt.createdSessionId) {
          await clerk.setActive({ session: signUpAttempt.createdSessionId });
          onSuccess();
        } else {
          try {
            await signUpAttempt.prepareEmailAddressVerification({ strategy: "email_code" });
            setErrorMsg("Kode verifikasi telah dikirim ke email Anda.");
          } catch {
            setErrorMsg("Pendaftaran berhasil diproses. Silakan cek email Anda.");
          }
        }
      }
    } catch (err: unknown) {
      console.error("Clerk auth error:", err);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat autentikasi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-300">
      <div
        className={`w-full max-w-[420px] rounded-3xl p-6 sm:p-8 transition-all relative overflow-hidden shadow-2xl ${
          isDark
            ? "bg-[#111113] border border-white/10 text-white shadow-black/90"
            : "bg-white border border-black/10 text-zinc-900 shadow-zinc-900/15"
        }`}
      >
        <Login16
          isModal
          mode={mode}
          onModeChange={setMode}
          onSubmit={handleAuthSubmit}
          onOAuth={handleOAuth}
          loading={loading}
          oauthLoading={oauthLoading}
          error={errorMsg}
          brandName="One Mind"
        />
      </div>
    </div>
  );
}
