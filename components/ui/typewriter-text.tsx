"use client";

import { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursorClassName?: string;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  speed = 36,
  delay = 200,
  className = "",
  cursorClassName = "",
  onComplete,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
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
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      <span
        className={`inline-block w-[1.5px] sm:w-[2px] h-[0.9em] ml-0.5 sm:ml-1 align-baseline bg-current select-none animate-typewriter-blink ${cursorClassName}`}
        aria-hidden="true"
      />
    </span>
  );
}
