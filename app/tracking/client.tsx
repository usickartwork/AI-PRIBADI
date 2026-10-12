"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TrackingWorkspace } from "@/app/components/TrackingWorkspace";

export function TrackingStandaloneClient() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#07090e] overflow-hidden select-none">
      <TrackingWorkspace
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

