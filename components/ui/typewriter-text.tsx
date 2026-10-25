"use client";

import { useState, useEffect } from "react";

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

export function TypewriterText({
  text,
  speed = 36,
  delay = 750,
  enabled = true,
  className = "",
  cursorClassName = "",
  hideCursorOnComplete = false,
  onComplete,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText("");
      setIsTyping(true);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);
    let index = 0;
    let timer: NodeJS.Timeout;

    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        index++;
        if (index <= text.length) {
          setDisplayedText(text.slice(0, index));
        } else {
          clearInterval(timer);
          setIsTyping(false);
          onComplete?.();
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(timer);
    };
  }, [text, speed, delay, enabled, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!enabled || (hideCursorOnComplete && !isTyping) ? null : (
        <span
          className={`inline-block w-[1.5px] sm:w-[2px] h-[0.9em] ml-0.5 sm:ml-1 align-baseline bg-current select-none animate-typewriter-blink ${cursorClassName}`}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
