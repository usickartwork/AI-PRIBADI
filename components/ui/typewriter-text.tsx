"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  enabled?: boolean;
  className?: string;
  cursorClassName?: string;
  hideCursorOnComplete?: boolean;
  onComplete?: () => void;
}

/**
 * Calculates human keystroke timing with realistic cadence:
 * - Bursts inside words (fast typing, ~28-40ms with organic jitter)
 * - Noticeable pauses at phrase boundaries ("would you...", "like...", "to create...", etc.)
 * - Natural micro-pauses at word spaces (~160-200ms)
 * - Punctuation holds (?, !, ., , ~360-410ms)
 */
function getKeystrokeDelay(
  fullText: string,
  charIndex: number,
  baseSpeed: number = 34
): number {
  if (charIndex >= fullText.length - 1) {
    return baseSpeed;
  }

  const charJustTyped = fullText[charIndex];

  // 1. Punctuation pause
  if (
    charJustTyped === "?" ||
    charJustTyped === "!" ||
    charJustTyped === "." ||
    charJustTyped === ","
  ) {
    return 360 + Math.floor(Math.random() * 50);
  }

  // 2. Space / Word boundary pause
  if (charJustTyped === " ") {
    const textSoFar = fullText.slice(0, charIndex).toLowerCase().trim();

    // Specific phrase pauses: "would you", "like", "to create", "your mind", "shall we", "are we", "should we", "ready", "let's explore"
    if (
      textSoFar.endsWith("would you") ||
      textSoFar.endsWith("like") ||
      textSoFar.endsWith("to create") ||
      textSoFar.endsWith("your mind") ||
      textSoFar.endsWith("shall we") ||
      textSoFar.endsWith("are we") ||
      textSoFar.endsWith("should we") ||
      textSoFar.endsWith("ready") ||
      textSoFar.endsWith("let's explore") ||
      textSoFar.endsWith("what's your")
    ) {
      return 330 + Math.floor(Math.random() * 40); // Noticeable pause: "would you... like..."
    }

    // Standard word boundary pause between words:
    return 160 + Math.floor(Math.random() * 40); // "jeda sedikit aja biar kelihatan kalo ngetik"
  }

  // 3. Fast keystroke bursts inside words with slight human jitter
  const jitter = Math.floor(Math.random() * 10) - 5;
  return Math.max(22, baseSpeed + jitter);
}

export function TypewriterText({
  text,
  speed = 34,
  delay = 750,
  enabled = true,
  className = "",
  cursorClassName = "",
  hideCursorOnComplete = false,
  onComplete,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const containerRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText("");
      setIsTyping(true);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);
    let timeoutId: NodeJS.Timeout;

    // Helper to check if this instance is visible (not hidden by responsive classes like sm:hidden)
    const isVisible = () => {
      if (typeof window === "undefined") return false;
      const el = cursorRef.current ?? containerRef.current;
      if (!el) return false;
      return el.getClientRects().length > 0;
    };

    // Helper to dispatch cursor position for Avatar eye tracking
    const emitCursorCoord = (progress: number, active: boolean) => {
      if (typeof window === "undefined" || !isVisible()) return;

      let clientX: number | undefined;
      let clientY: number | undefined;

      const targetEl = cursorRef.current ?? containerRef.current;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        if (rect.width > 0 || rect.left > 0) {
          clientX = rect.left + rect.width / 2;
          clientY = rect.top + rect.height / 2;
        }
      }

      window.dispatchEvent(
        new CustomEvent("avatar-eye-track", {
          detail: {
            x: clientX,
            y: clientY,
            progress,
            active,
          },
        })
      );
    };

    const scheduleNextChar = (currentIdx: number) => {
      if (currentIdx >= text.length) {
        setIsTyping(false);
        emitCursorCoord(1, false);
        onComplete?.();
        return;
      }

      const nextIdx = currentIdx + 1;
      const nextDelay = getKeystrokeDelay(text, currentIdx, speed);

      timeoutId = setTimeout(() => {
        setDisplayedText(text.slice(0, nextIdx));

        // Sync with browser paint so cursor rect is freshly updated
        requestAnimationFrame(() => {
          emitCursorCoord(nextIdx / text.length, true);
        });

        scheduleNextChar(nextIdx);
      }, nextDelay);
    };

    const startTimeout = setTimeout(() => {
      // Look at cursor start position
      requestAnimationFrame(() => {
        emitCursorCoord(0, true);
      });
      scheduleNextChar(0);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
      emitCursorCoord(1, false);
    };
  }, [text, speed, delay, enabled, onComplete]);

  return (
    <span ref={containerRef} className={className}>
      {displayedText}
      {!enabled || (hideCursorOnComplete && !isTyping) ? null : (
        <span
          ref={cursorRef}
          className={`inline-block w-[1.5px] sm:w-[2px] h-[0.9em] ml-0.5 sm:ml-1 align-baseline bg-current select-none animate-typewriter-blink ${cursorClassName}`}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
