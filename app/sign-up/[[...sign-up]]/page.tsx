import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Daftar One Mind",
  description: "Buat akun One Mind baru.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://onemind.web.id/sign-up",
  },
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#fafafc] dark:bg-[#09090b]">
      <SignUp />
    </main>
  );
}
