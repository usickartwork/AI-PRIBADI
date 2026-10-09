"use client";

import React, { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Login16 from "@/components/ui/login-16";

export default function SignInPage() {
  const clerk = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleLogin = async (
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

      const signInAttempt = await clerk.client.signIn.create({
        strategy: "ticket",
        ticket: data.token,
      });

      if (signInAttempt.status === "complete" && signInAttempt.createdSessionId) {
        await clerk.setActive({ session: signInAttempt.createdSessionId });
        router.push("/");
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
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <Login16
        mode="sign-in"
        onModeChange={(next) => {
          if (next === "sign-up") router.push("/sign-up");
        }}
        onSubmit={handleLogin}
        onOAuth={handleOAuth}
        loading={loading}
        oauthLoading={oauthLoading}
        error={errorMsg}
        brandName="One Mind"
      />
    </main>
  );
}
