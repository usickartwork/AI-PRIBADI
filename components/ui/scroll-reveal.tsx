"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  id?: string;
}

/**
 * ScrollReveal memisahkan sentinel observer (elemen static tanpa transform)
 * dari elemen yang dianimasikan (motion.div di dalam).
 * Hal ini menjamin 100% bebas flickering / kedap-kedip saat user berhenti
 * scroll di posisi tertentu, karena bounding box observer tidak bergerak saat animasi berjalan.
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  y = 20,
  duration = 0.6,
  id,
}: ScrollRevealProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isInView = useInView(sentinelRef, {
    once: true,
    amount: 0.08,
    margin: "0px 0px -40px 0px",
  });

  return (
    <div ref={sentinelRef} id={id} className={className} style={{ position: "relative" }}>
      <motion.div
        initial={{ opacity: 0, y }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default ScrollReveal;
