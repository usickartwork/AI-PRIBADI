"use client";

import React from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

export type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export const DEFAULT_LOGOS: Logo[] = [
  {
    src: "https://cdn.21st.dev/assets/mirror/bd/bdf5f3ae72bcfda892a686c03b7932985c694e9a9828643c980601bbc9e53cb4.svg",
    alt: "Nvidia Logo",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/31/319eeae853dd1af99d442b6c16b6c38dc52a66a719f8e502c65f85d26255cbd3.svg",
    alt: "Supabase Logo",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/2b/2bcdd4124223e3bf8e66bc08ce0ac32a6cc42ffe3584bbecfd377847176a188d.svg",
    alt: "OpenAI Logo",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/fc/fc7b090ebcfc468d24a1dc482b2db1fcbfd99ca14568552a30ce553d6dda7fcb.svg",
    alt: "Turso Logo",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/56/5624b7c243ac8d60e848fb5ea222ec932c1600df54a2762238b37498372fb0c8.svg",
    alt: "Vercel Logo",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/90/90f01a9537335666282ae5acc80bd4305f86d085a92d60904c3aa3ccc4414570.svg",
    alt: "GitHub Logo",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/e8/e8514b1206f79e1abdafcc1d2632393cc7cfbcbbe25426ac5143b17b184b56b8.svg",
    alt: "Claude AI Logo",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/96/96517bce3574d648280ff639d01d9889f354b488b3f826db5df746d730232a0c.svg",
    alt: "Clerk Logo",
  },
];

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos?: Logo[];
  isDark?: boolean;
};

export function LogoCloud({ className, logos = DEFAULT_LOGOS, isDark, ...props }: LogoCloudProps) {
  return (
    <div
      {...props}
      className={cn(
        "overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black,transparent)]",
        className
      )}
    >
      <InfiniteSlider gap={42} reverse speed={80} speedOnHover={25}>
        {logos.map((logo) => (
          <img
            alt={logo.alt}
            className={cn(
              "pointer-events-none h-4 select-none md:h-5 transition-opacity",
              isDark !== undefined
                ? isDark
                  ? "brightness-0 invert opacity-75"
                  : "brightness-0 opacity-60"
                : "opacity-60 dark:brightness-0 dark:invert dark:opacity-75"
            )}
            height={logo.height || "auto"}
            key={`logo-${logo.alt}`}
            loading="lazy"
            src={logo.src}
            width={logo.width || "auto"}
          />
        ))}
      </InfiniteSlider>
    </div>
  );
}
