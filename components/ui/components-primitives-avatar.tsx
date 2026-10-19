"use client";

import { useEffect, useId, useRef } from "react";
import { motion } from "motion/react";

export type AvatarColor =
  | "white"
  | "theme"
  | "mono"
  | "dark"
  | "light"
  | "blue"
  | "orange"
  | "red"
  | "green"
  | "purple"
  | "yellow"
  | "cyan"
  | "pink"
  | "indigo"
  | "lime"
  | "turquoise"
  | "violet";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square" | "squircle";

export interface AvatarProps {
  blinking?: boolean;
  color?: AvatarColor;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
  isDark?: boolean;
  lookAround?: boolean;
}

const BLINK_KEYFRAMES = `
@keyframes av-blink {
  0%, 88%, 100% { transform: scaleY(1); }
  93%            { transform: scaleY(0.07); }
  97%            { transform: scaleY(0.07); }
}
`;

const PRESETS: Record<
  AvatarColor,
  {
    gradient: string;
    boxShadow: string;
    iris: string;
    shine: string;
  }
> = {
  white: {
    gradient:
      "radial-gradient(circle at 50% 38%, #ffffff 0%, #fafafa 45%, #f4f4f5 75%, #e4e4e7 100%)",
    boxShadow: "none",
    iris: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.35) 45%, transparent 68%)",
  },
  theme: {
    gradient:
      "radial-gradient(circle at 50% 38%, #ffffff 0%, #fafafa 45%, #f4f4f5 75%, #e4e4e7 100%)",
    boxShadow: "none",
    iris: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.35) 45%, transparent 68%)",
  },
  mono: {
    gradient:
      "radial-gradient(circle at 50% 38%, #ffffff 0%, #fafafa 45%, #f4f4f5 75%, #e4e4e7 100%)",
    boxShadow: "none",
    iris: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.35) 45%, transparent 68%)",
  },
  dark: {
    gradient:
      "radial-gradient(circle at 50% 38%, #27272a 0%, #18181b 45%, #121215 75%, #09090b 100%)",
    boxShadow:
      "0 4px 16px -2px rgba(0,0,0,0.22), 0 2px 6px -1px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.08)",
    iris: "linear-gradient(135deg, #ffffff 0%, #e4e4e7 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 45%, transparent 68%)",
  },
  light: {
    gradient:
      "radial-gradient(circle at 50% 38%, #27272a 0%, #18181b 45%, #121215 75%, #09090b 100%)",
    boxShadow:
      "0 4px 16px -2px rgba(0,0,0,0.22), 0 2px 6px -1px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.08)",
    iris: "linear-gradient(135deg, #ffffff 0%, #e4e4e7 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 45%, transparent 68%)",
  },
  blue: {
    gradient:
      "radial-gradient(circle at 50% 45%, #0d4d9a 0%, #3d7dd8 40%, #6fb3ff 68%, #e0eeff 100%)",
    boxShadow:
      "0 0 4px 0px rgba(20,102,216,.35), 0 0 16px 6px rgba(20,102,216,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #d4ecff 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  orange: {
    gradient:
      "radial-gradient(circle at 50% 45%, #a63e10 0%, #e27a2a 40%, #ffb46a 68%, #ffe8cc 100%)",
    boxShadow:
      "0 0 4px 0px rgba(232,100,0,.35), 0 0 16px 6px rgba(232,100,0,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #ffd9b8 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  red: {
    gradient:
      "radial-gradient(circle at 50% 45%, #a60033 0%, #e74668 40%, #ff8aaa 68%, #ffd6e8 100%)",
    boxShadow:
      "0 0 4px 0px rgba(223,24,92,.35), 0 0 16px 6px rgba(223,24,92,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #ffcde4 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  green: {
    gradient:
      "radial-gradient(circle at 50% 45%, #0d6632 0%, #2a9d5f 40%, #6dd187 68%, #d1fadd 100%)",
    boxShadow:
      "0 0 4px 0px rgba(12,168,82,.35), 0 0 16px 6px rgba(12,168,82,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #c5f5d8 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  purple: {
    gradient:
      "radial-gradient(circle at 50% 45%, #4a0080 0%, #8b3fd1 40%, #c896ff 68%, #e8d4ff 100%)",
    boxShadow:
      "0 0 4px 0px rgba(110,46,224,.35), 0 0 16px 6px rgba(110,46,224,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #e0c9ff 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  yellow: {
    gradient:
      "radial-gradient(circle at 50% 45%, #8a5500 0%, #d4a000 40%, #ffc93a 68%, #fff5cc 100%)",
    boxShadow:
      "0 0 4px 0px rgba(214,142,0,.35), 0 0 16px 6px rgba(214,142,0,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #fff0a8 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  cyan: {
    gradient:
      "radial-gradient(circle at 50% 45%, #003d66 0%, #0a8fb5 40%, #5dd4ff 68%, #cdf5ff 100%)",
    boxShadow:
      "0 0 4px 0px rgba(10,143,181,.35), 0 0 16px 6px rgba(10,143,181,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #d0f0ff 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  pink: {
    gradient:
      "radial-gradient(circle at 50% 45%, #7a0055 0%, #d63384 40%, #ff6bb3 68%, #ffe5f5 100%)",
    boxShadow:
      "0 0 4px 0px rgba(214,51,132,.35), 0 0 16px 6px rgba(214,51,132,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #ffd6ed 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  indigo: {
    gradient:
      "radial-gradient(circle at 50% 45%, #2d157a 0%, #4f46e5 40%, #8b7eff 68%, #ddd6ff 100%)",
    boxShadow:
      "0 0 4px 0px rgba(79,70,229,.35), 0 0 16px 6px rgba(79,70,229,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #e0d9ff 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  lime: {
    gradient:
      "radial-gradient(circle at 50% 45%, #4a5910 0%, #84cc16 40%, #bef264 68%, #ecfccf 100%)",
    boxShadow:
      "0 0 4px 0px rgba(132,204,22,.35), 0 0 16px 6px rgba(132,204,22,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #f7fee8 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  turquoise: {
    gradient:
      "radial-gradient(circle at 50% 45%, #1a5555 0%, #0d9488 40%, #2dd4bf 68%, #ccfbf1 100%)",
    boxShadow:
      "0 0 4px 0px rgba(13,148,136,.35), 0 0 16px 6px rgba(13,148,136,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #c0fdf5 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
  violet: {
    gradient:
      "radial-gradient(circle at 50% 45%, #4a2a7a 0%, #a855f7 40%, #d8b4fe 68%, #f3e8ff 100%)",
    boxShadow:
      "0 0 4px 0px rgba(168,85,247,.35), 0 0 16px 6px rgba(168,85,247,.18), inset 0 0 0 1px rgba(255,255,255,.05)",
    iris: "linear-gradient(135deg, #ffffff 0%, #ede9fe 100%)",
    shine:
      "radial-gradient(ellipse at 30% 24%, rgba(255,255,255,.75) 0%, rgba(255,255,255,.1) 50%, transparent 70%)",
  },
};

const SIZE: Record<
  AvatarSize,
  {
    orb: string;
    eye: string;
    eyeGap: string;
    eyeY: string;
  }
> = {
  sm: {
    orb: "size-8",
    eye: "w-1 h-1.5",
    eyeGap: "gap-1.5",
    eyeY: "-translate-y-0.5",
  },
  md: {
    orb: "size-12",
    eye: "w-1.5 h-2.5",
    eyeGap: "gap-2.5",
    eyeY: "-translate-y-0.5",
  },
  lg: {
    orb: "size-16",
    eye: "w-2 h-3",
    eyeGap: "gap-3.5",
    eyeY: "-translate-y-1",
  },
  xl: {
    orb: "size-20",
    eye: "w-2.5 h-3.5",
    eyeGap: "gap-4",
    eyeY: "-translate-y-1.5",
  },
};

const SHAPE_RADIUS: Record<AvatarShape, string> = {
  circle: "rounded-full",
  square: "rounded-[0%]",
  squircle: "rounded-[40%]",
};

const LOOK_LIMITS: Record<AvatarSize, { maxX: number; maxY: number }> = {
  sm: { maxX: 3.5, maxY: 2.5 },
  md: { maxX: 6, maxY: 4.5 },
  lg: { maxX: 9, maxY: 6.5 },
  xl: { maxX: 12, maxY: 8.5 },
};

interface EyeProps {
  blinking: boolean;
  delayMs?: number;
  irisGradient: string;
  sizeClass: string;
}

function Eye({ blinking, delayMs = 0, irisGradient, sizeClass }: EyeProps) {
  return (
    <div
      className={["rounded-full", sizeClass].filter(Boolean).join(" ")}
      style={{
        background: irisGradient,
        ...(blinking
          ? { animation: `av-blink 3.6s ease-in-out ${delayMs}ms infinite` }
          : {}),
      }}
    />
  );
}

export function Avatar({
  blinking = true,
  color = "theme",
  size = "md",
  shape = "circle",
  className = "",
  isDark = true,
  lookAround = true,
}: AvatarProps) {
  const uid = useId();
  const noiseId = `av-n${uid.replace(/\W/g, "")}`;
  const avatarRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);

  // Dynamic Theme Resolution:
  // - Dark Mode (isDark = true): Pure white avatar with crisp dark eyes (clean, no glow)
  // - Light Mode (isDark = false): Sleek obsidian avatar with luminous white eyes (high contrast, doesn't clash with light bg)
  let preset = PRESETS.white;
  if (!color || color === "theme" || color === "mono" || color === "white") {
    preset = isDark ? PRESETS.white : PRESETS.dark;
  } else if (color === "dark" || color === "light") {
    preset = PRESETS.dark;
  } else {
    preset = PRESETS[color] ?? PRESETS.white;
  }
  const dims = SIZE[size] ?? SIZE.md;

  useEffect(() => {
    if (!lookAround) return;

    const limits = LOOK_LIMITS[size] ?? LOOK_LIMITS.md;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let lastInteraction = Date.now();
    let animId: number;

    const handlePointerCoord = (clientX: number, clientY: number) => {
      lastInteraction = Date.now();
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        targetX = 0;
        targetY = 0;
        return;
      }

      const angle = Math.atan2(dy, dx);
      // Smooth saturation based on distance
      const intensity = Math.min(1, Math.max(0.25, dist / 220));
      targetX = Math.cos(angle) * limits.maxX * intensity;
      targetY = Math.sin(angle) * limits.maxY * intensity;
    };

    const onPointerMove = (e: PointerEvent) => {
      handlePointerCoord(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      handlePointerCoord(e.clientX, e.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        handlePointerCoord(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        handlePointerCoord(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });

    // Idle look-around interval
    const idleInterval = setInterval(() => {
      // If user recently interacted (within 2.2s), skip idle movement
      if (Date.now() - lastInteraction < 2200) return;

      // 30% chance to return to center, 70% chance to glance in random direction
      if (Math.random() < 0.3) {
        targetX = 0;
        targetY = 0;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const intensity = 0.4 + Math.random() * 0.6;
        targetX = Math.cos(angle) * limits.maxX * intensity;
        targetY = Math.sin(angle) * limits.maxY * intensity;
      }
    }, 2500);

    // Animation frame loop with smooth lerping
    const loop = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      if (eyesRef.current) {
        eyesRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      clearInterval(idleInterval);
      cancelAnimationFrame(animId);
    };
  }, [lookAround, size]);

  return (
    <>
      <style>{BLINK_KEYFRAMES}</style>
      <motion.div
        ref={avatarRef}
        aria-label="AI Avatar"
        role="img"
        whileTap={{ scaleX: 1.15, scaleY: 1.3 }}
        transition={{
          type: "tween",
          duration: 0.8,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        className={[
          "relative flex cursor-pointer items-center justify-center overflow-hidden shrink-0 select-none",
          dims.orb,
          SHAPE_RADIUS[shape],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          background: preset.gradient,
          boxShadow: preset.boxShadow,
        }}
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.2] mix-blend-overlay"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id={noiseId} x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.72"
                numOctaves="4"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter={`url(#${noiseId})`} />
        </svg>

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.2] mix-blend-overlay"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter
              id={`grain-${uid.replace(/\W/g, "")}`}
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="3.2"
                numOctaves="1"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect
            width="100%"
            height="100%"
            filter={`url(#grain-${uid.replace(/\W/g, "")})`}
          />
        </svg>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: preset.shine }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 blur-xs"
          style={{
            background:
              "radial-gradient(circle at 62% 68%, rgba(0,0,0,0.18) 0%, transparent 55%)",
          }}
        />

        <div
          className={[
            "relative z-10 flex items-center justify-center",
            dims.eyeY,
          ].join(" ")}
        >
          <div
            ref={eyesRef}
            className={["flex items-center will-change-transform", dims.eyeGap].join(" ")}
          >
            <Eye
              blinking={blinking}
              delayMs={0}
              irisGradient={preset.iris}
              sizeClass={dims.eye}
            />
            <Eye
              blinking={blinking}
              delayMs={60}
              irisGradient={preset.iris}
              sizeClass={dims.eye}
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default Avatar;

