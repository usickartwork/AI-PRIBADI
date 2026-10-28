import { useMemo } from "react";
import type { BjorkTone } from "./palette";

export function useBjorkTone(tone?: BjorkTone): BjorkTone {
  return useMemo(() => {
    if (tone) return tone;
    return "neutral";
  }, [tone]);
}
