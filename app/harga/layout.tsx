import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Harga & Paket Langganan — OneMind",
  description:
    "Pilihan paket langganan OneMind: Free & Pro dengan akses model AI unggulan, kuota harian transparan, dan fitur produktivitas lengkap.",
  alternates: {
    canonical: "https://onemind.web.id/harga",
  },
  openGraph: {
    title: "Harga & Paket Langganan — OneMind",
    description:
      "Pilihan paket langganan OneMind: Free & Pro dengan akses model AI unggulan, kuota harian transparan, dan fitur produktivitas lengkap.",
    url: "https://onemind.web.id/harga",
    siteName: "OneMind",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harga & Paket Langganan — OneMind",
    description:
      "Pilihan paket langganan OneMind: Free & Pro dengan akses model AI unggulan, kuota harian transparan, dan fitur produktivitas lengkap.",
  },
};

export default function HargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
