"use client";

import * as React from "react";
import { motion } from "motion/react";

export function ShiningText({ text, className }: { text: string; className?: string }) {
  return (
    <motion.div
      className={`bg-[linear-gradient(110deg,#71717a,35%,#09090b,50%,#71717a,75%,#71717a)] dark:bg-[linear-gradient(110deg,#52525b,35%,#ffffff,50%,#52525b,75%,#52525b)] bg-[length:200%_100%] bg-clip-text text-sm sm:text-base font-medium text-transparent select-none inline-block ${className || ""}`}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text}
    </motion.div>
  );
}

