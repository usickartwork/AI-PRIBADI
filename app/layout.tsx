import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "katex/dist/katex.min.css";
import "./globals.css";

const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

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
  title: "OneMind — Platform AI Workspace & Asisten Produktivitas Indonesia",
  description:
    "OneMind adalah platform AI workspace terpadu di Indonesia untuk multi-model chat, asisten koding, penjadwalan pintar, catatan kerja, dan alur kreatif dalam satu tempat.",
  alternates: {
    canonical: "https://onemind.web.id/",
  },
  openGraph: {
    title: "OneMind — Platform AI Workspace & Asisten Produktivitas Indonesia",
    description:
      "OneMind adalah platform AI workspace terpadu di Indonesia untuk multi-model chat, asisten koding, penjadwalan pintar, catatan kerja, dan alur kreatif dalam satu tempat.",
    url: "https://onemind.web.id/",
    siteName: "OneMind",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneMind — Platform AI Workspace & Asisten Produktivitas Indonesia",
    description:
      "OneMind adalah platform AI workspace terpadu di Indonesia untuk multi-model chat, asisten koding, penjadwalan pintar, catatan kerja, dan alur kreatif dalam satu tempat.",
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
      { url: "/icon.svg?v=6", type: "image/svg+xml" },
      { url: "/favicon-32x32.png?v=6", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=6", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=6",
    apple: "/apple-icon.png?v=6",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
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
        className={`${satoshi.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#fafafc] dark:bg-[#121215]`}
      >
        <head>
          <link rel="preconnect" href="https://api.fontshare.com" />
          <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@1,2&display=swap" />
          <link rel="icon" type="image/svg+xml" href="/icon.svg?v=6" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=6" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=6" />
          <link rel="shortcut icon" href="/favicon.ico?v=6" />
          <link rel="apple-touch-icon" href="/apple-icon.png?v=6" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var saved = localStorage.getItem('usick-theme');
                    var isDark = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    var color = isDark ? '#18181b' : '#fafafc';
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
        <body className="min-h-screen w-full overflow-x-clip flex flex-col bg-[#fafafc] dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-violet-100 dark:selection:bg-zinc-800 selection:text-violet-900 dark:selection:text-zinc-200">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
