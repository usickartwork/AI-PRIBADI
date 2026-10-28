import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music One & Lirik Realtime Karaoke — OneMind",
  description:
    "Streaming audio jernih bebas iklan, lirik karaoke realtime, 24/7 radio live, dan Music Connect untuk mendengarkan bersama di OneMind.",
  alternates: {
    canonical: "https://onemind.web.id/music",
  },
  openGraph: {
    title: "Music One & Lirik Realtime Karaoke — OneMind",
    description:
      "Streaming audio jernih bebas iklan, lirik karaoke realtime, 24/7 radio live, dan Music Connect untuk mendengarkan bersama di OneMind.",
    url: "https://onemind.web.id/music",
    siteName: "OneMind",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Music One & Lirik Realtime Karaoke — OneMind",
    description:
      "Streaming audio jernih bebas iklan, lirik karaoke realtime, 24/7 radio live, dan Music Connect untuk mendengarkan bersama di OneMind.",
  },
};

export default function MusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
