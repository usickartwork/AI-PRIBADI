import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat Multi-Model & Voice Assistant — OneMind",
  description:
    "Akses multi-model AI cerdas dalam satu antarmuka terpadu: Claude 3.7, Gemini 2.5, DeepSeek R1, dan Voice Assistant realtime di OneMind.",
  alternates: {
    canonical: "https://onemind.web.id/ai-chat",
  },
  openGraph: {
    title: "AI Chat Multi-Model & Voice Assistant — OneMind",
    description:
      "Akses multi-model AI cerdas dalam satu antarmuka terpadu: Claude 3.7, Gemini 2.5, DeepSeek R1, dan Voice Assistant realtime di OneMind.",
    url: "https://onemind.web.id/ai-chat",
    siteName: "OneMind",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat Multi-Model & Voice Assistant — OneMind",
    description:
      "Akses multi-model AI cerdas dalam satu antarmuka terpadu: Claude 3.7, Gemini 2.5, DeepSeek R1, dan Voice Assistant realtime di OneMind.",
  },
};

export default function AIChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
