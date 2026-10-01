"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Memverifikasi tautan email Anda...");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function handleAuth() {
      // 1. Cek jika terdapat parameter code dari link konfirmasi email PKCE
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error_description") || searchParams.get("error");

      if (errorParam) {
        setStatus(`Gagal verifikasi: ${errorParam}`);
        setIsSuccess(false);
        setTimeout(() => router.push("/"), 3500);
        return;
      }

      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus(`Gagal memverifikasi: ${error.message}`);
            setIsSuccess(false);
            setTimeout(() => router.push("/"), 3500);
          } else if (data.session) {
            setStatus("Email berhasil dikonfirmasi! Sedang mengalihkan ke obrolan...");
            setIsSuccess(true);
            setTimeout(() => router.push("/"), 1200);
          } else {
            router.push("/");
          }
        } catch (err: unknown) {
          setStatus(err instanceof Error ? err.message : "Terjadi kendala saat memverifikasi.");
          setIsSuccess(false);
          setTimeout(() => router.push("/"), 3500);
        }
        return;
      }

      // 2. Cek jika sesi sudah terdeteksi secara otomatis melalui hash URL
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("Email terverifikasi! Sedang mengalihkan ke obrolan...");
        setIsSuccess(true);
        setTimeout(() => router.push("/"), 1000);
      } else {
        setStatus("Mengalihkan ke halaman utama...");
        setTimeout(() => router.push("/"), 1500);
      }
    }

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-sm w-full rounded-3xl border border-zinc-800 bg-[#141418] p-8 shadow-2xl text-white">
      {/* Icon status */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
        {isSuccess === true ? (
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : isSuccess === false ? (
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
      </div>

      <div>
        <h2 className="text-base font-bold tracking-tight">Verifikasi Email Akun</h2>
        <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3 text-zinc-400 text-xs">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Memuat verifikasi...</span>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
