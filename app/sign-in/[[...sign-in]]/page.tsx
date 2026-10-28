import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Masuk One Mind",
  description: "Masuk ke akun One Mind Anda.",
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
