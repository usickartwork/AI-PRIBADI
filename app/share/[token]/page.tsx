export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPublicSharedLink } from "@/lib/shareServer";
import { SharedProjectView } from "./SharedProjectView";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  if (!token) {
    return { title: "Tautan Tidak Ditemukan One Mind" };
  }

  const link = await getPublicSharedLink(token);
  if (!link) {
    return {
      title: "Tautan Tidak Ditemukan atau Telah Dicabut One Mind",
      description: "Tautan percakapan proyek ini tidak tersedia atau telah dicabut oleh pemiliknya.",
    };
  }

  const title = `${link.title_snapshot || "Percakapan"} One Mind`;
  const description = `Lihat dan lanjutkan percakapan proyek "${link.title_snapshot || "Percakapan"}" di One Mind.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://onemind.web.id/share/${token}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SharedProjectPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const sParams = searchParams ? await searchParams : {};

  if (!token) {
    return <NotFoundView />;
  }

  const link = await getPublicSharedLink(token);

  if (!link) {
    return <NotFoundView />;
  }

  // Jika menyertakan ?preview=1, tampilkan tampilan statis
  if (sParams.preview === "1" || sParams.preview === "true") {
    return (
      <SharedProjectView
        initialTitle={link.title_snapshot || "Untitled Project"}
        initialMessages={Array.isArray(link.messages_snapshot) ? link.messages_snapshot : []}
        createdAt={link.created_at}
        token={link.public_token}
      />
    );
  }

  // Secara default: langsung arahkan ke aplikasi utama dengan parameter share
  // agar proyek langsung masuk ke panel Recent dan percakapan dapat langsung dilanjutkan
  redirect(`/?share=${encodeURIComponent(token)}`);
}

function NotFoundView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0c0e] text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h1 className="text-lg sm:text-xl font-bold tracking-tight mb-2">
          Tautan Tidak Tersedia
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
          Tautan ini tidak ditemukan, sudah kedaluwarsa, atau telah dicabut oleh pemiliknya.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-200 transition shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Usick One</span>
        </Link>
      </div>
    </div>
  );
}
