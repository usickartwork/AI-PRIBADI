import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Masuk — Usick One",
  description: "Masuk ke akun Usick One Anda.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://onemind.web.id/sign-in",
  },
};

export default function SignInPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#fafafc] dark:bg-[#09090b]">
      <SignIn />
    </main>
  );
}
