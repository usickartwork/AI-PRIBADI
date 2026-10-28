import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usick One — Eksplorasi Chat Interaktif OneMind",
  description:
    "Coba langsung kemampuan AI OneMind dengan Usick One. Rasakan respon cepat, pemikiran mendalam, dan asisten cerdas.",
  alternates: {
    canonical: "https://onemind.web.id/usick-one",
  },
  openGraph: {
    title: "Usick One — Eksplorasi Chat Interaktif OneMind",
    description:
      "Coba langsung kemampuan AI OneMind dengan Usick One. Rasakan respon cepat, pemikiran mendalam, dan asisten cerdas.",
    url: "https://onemind.web.id/usick-one",
    siteName: "OneMind",
    locale: "id_ID",
    type: "website",
  },
};

export default function UsickOneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
