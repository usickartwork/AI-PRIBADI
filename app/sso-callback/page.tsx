"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fafafc] dark:bg-[#09090b]">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
