import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SSO Callback — Usick One",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://onemind.web.id/sso-callback",
  },
};

export default function SSOCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
