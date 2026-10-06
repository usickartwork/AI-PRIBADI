import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#fafafc] dark:bg-[#09090b]">
      <SignUp />
    </main>
  );
}
