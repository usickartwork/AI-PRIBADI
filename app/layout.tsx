import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://onemind.web.id"),
  title: "Usick One — Your AI Workspace",
  description:
    "Usick One is an AI workspace for multi-model chat, coding assistance, schedule planning, and creative workflows.",
  alternates: {
    canonical: "https://onemind.web.id/",
  },
  openGraph: {
    title: "Usick One — Your AI Workspace",
    description:
      "Usick One is an AI workspace for multi-model chat, coding assistance, schedule planning, and creative workflows.",
    url: "https://onemind.web.id/",
    siteName: "Usick One",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Usick One — Your AI Workspace",
    description:
      "Usick One is an AI workspace for multi-model chat, coding assistance, schedule planning, and creative workflows.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg?v=3", type: "image/svg+xml" },
      { url: "/favicon-32x32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=3", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: "/apple-icon.png?v=3",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#fafafc" },
  ],
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="id"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#fafafc] dark:bg-[#09090b]`}
      >
        <head>
          <link rel="icon" type="image/svg+xml" href="/icon.svg?v=3" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=3" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=3" />
          <link rel="shortcut icon" href="/favicon.ico?v=3" />
          <link rel="apple-touch-icon" href="/apple-icon.png?v=3" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var saved = localStorage.getItem('usick-theme');
                    var isDark = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    var color = isDark ? '#09090b' : '#fafafc';
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.style.colorScheme = 'dark';
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.style.colorScheme = 'light';
                    }
                    var metas = document.querySelectorAll('meta[name="theme-color"]');
                    metas.forEach(function(m) { m.setAttribute('content', color); });
                  } catch(e) {}
                })();
              `,
            }}
          />
        </head>
        <body className="h-full min-h-full w-full overflow-hidden flex flex-col bg-[#fafafc] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-violet-100 dark:selection:bg-zinc-800 selection:text-violet-900 dark:selection:text-zinc-200">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
