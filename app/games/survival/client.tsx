"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { GameWorkspace } from "@/app/components/GameWorkspace";

export function GameStandaloneClient() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden select-none">
      <GameWorkspace
        isDark={true}
        isVisible={true}
        onClose={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/");
          }
        }}
      />
    </div>
  );
}

