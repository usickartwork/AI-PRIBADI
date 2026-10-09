"use client";

import React, { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Login16 from "@/components/ui/login-16";

export default function SignUpPage() {
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
      await clerk.client.signUp.authenticateWithRedirect({
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

  const handleSignUp = async (
    e: React.FormEvent,
    { identifier, password }: { identifier: string; password: string }
  ) => {
    setErrorMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg("Harap masukkan email dan password.");
      return;
    }

    setLoading(true);
    try {
      if (!clerk.loaded) {
        setErrorMsg("Layanan autentikasi belum siap.");
        setLoading(false);
        return;
      }

      const signUpAttempt = await clerk.client.signUp.create({
        emailAddress: identifier.trim(),
        password,
      });

      if (signUpAttempt.status === "complete" && signUpAttempt.createdSessionId) {
        await clerk.setActive({ session: signUpAttempt.createdSessionId });
        router.push("/");
      } else {
        try {
          await signUpAttempt.prepareEmailAddressVerification({ strategy: "email_code" });
          setErrorMsg("Kode verifikasi telah dikirim ke email Anda.");
        } catch {
          setErrorMsg("Pendaftaran berhasil diproses. Silakan cek email Anda.");
        }
      }
    } catch (err: unknown) {
      console.error("Clerk sign-up error:", err);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Pendaftaran gagal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <Login16
        mode="sign-up"
        onModeChange={(next) => {
          if (next === "sign-in") router.push("/sign-in");
        }}
        onSubmit={handleSignUp}
        onOAuth={handleOAuth}
        loading={loading}
        oauthLoading={oauthLoading}
        error={errorMsg}
        brandName="One Mind"
      />
    </main>
  );
}
