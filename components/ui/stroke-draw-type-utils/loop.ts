import { useCallback, useEffect, useRef } from "react";

export interface VisibleLoopOptions {
  enabled?: boolean;
}

export function useVisibleLoop(
  targetRef: React.RefObject<HTMLElement | null>,
  callback: (dt: number) => boolean,
  options: VisibleLoopOptions = {}
) {
  const { enabled = true } = options;
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  const tick = useCallback((time: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
    }
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;

    const shouldContinue = callbackRef.current(dt);

    if (shouldContinue && isRunningRef.current) {
      rafIdRef.current = requestAnimationFrame(tick);
    } else {
      isRunningRef.current = false;
      rafIdRef.current = null;
      lastTimeRef.current = 0;
    }
  }, []);

  const wake = useCallback(() => {
    if (!enabled) return;
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      lastTimeRef.current = 0;
      rafIdRef.current = requestAnimationFrame(tick);
    }
  }, [enabled, tick]);

  useEffect(() => {
    if (!enabled) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      isRunningRef.current = false;
      lastTimeRef.current = 0;
      return;
    }

    wake();

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      isRunningRef.current = false;
      lastTimeRef.current = 0;
    };
  }, [enabled, wake]);

  return { wake };
}
