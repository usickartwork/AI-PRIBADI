import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Studio & Spesifikasi PRD Otomatis — OneMind",
  description:
    "Rancang arsitektur perangkat lunak, spesifikasi dokumen PRD, dan sintesis kode modular multi-file secara otonom dengan AI di OneMind.",
  alternates: {
    canonical: "https://onemind.web.id/code-studio",
  },
  openGraph: {
    title: "Code Studio & Spesifikasi PRD Otomatis — OneMind",
    description:
      "Rancang arsitektur perangkat lunak, spesifikasi dokumen PRD, dan sintesis kode modular multi-file secara otonom dengan AI di OneMind.",
    url: "https://onemind.web.id/code-studio",
    siteName: "OneMind",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Studio & Spesifikasi PRD Otomatis — OneMind",
    description:
      "Rancang arsitektur perangkat lunak, spesifikasi dokumen PRD, dan sintesis kode modular multi-file secara otonom dengan AI di OneMind.",
  },
};

export default function CodeStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
