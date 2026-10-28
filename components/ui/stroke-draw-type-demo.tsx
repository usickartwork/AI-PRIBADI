"use client";

import { StrokeDrawType } from "@/components/ui/stroke-draw-type";

export default function StrokeDrawTypeDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center bg-background px-6">
      <StrokeDrawType
        text="Signature"
        trigger="in-view"
        strokeWidth={1.6}
        duration={1.5}
        stagger={0.11}
        drainOnHover
      />
    </div>
  );
}
