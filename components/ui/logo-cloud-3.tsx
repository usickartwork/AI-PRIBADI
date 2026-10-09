"use client";

import React from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

export type LLMModel = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

export const LLM_MODELS: LLMModel[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M22.28 10.12a5.55 5.55 0 0 0-.48-4.58 5.6 5.6 0 0 0-3.92-2.77 5.63 5.63 0 0 0-4.68.75 5.54 5.54 0 0 0-3.8-1.52 5.58 5.58 0 0 0-5.26 3.82 5.57 5.57 0 0 0-2.3 4.02 5.61 5.61 0 0 0 .97 4.54 5.55 5.55 0 0 0 .48 4.58 5.6 5.6 0 0 0 3.92 2.77 5.6 5.6 0 0 0 4.68-.75 5.55 5.55 0 0 0 3.8 1.52 5.58 5.58 0 0 0 5.26-3.82 5.57 5.57 0 0 0 2.3-4.02 5.61 5.61 0 0 0-.97-4.54ZM12 14.5a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5Z" />
      </svg>
    ),
  },
  {
    id: "claude",
    name: "Claude",
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v3.08a1.5 1.5 0 0 1-3 0V3.5A1.5 1.5 0 0 1 12 2Zm7.07 3.93a1.5 1.5 0 0 1 0 2.12l-2.18 2.18a1.5 1.5 0 1 1-2.12-2.12l2.18-2.18a1.5 1.5 0 0 1 2.12 0ZM22 12a1.5 1.5 0 0 1-1.5 1.5h-3.08a1.5 1.5 0 0 1 0-3h3.08A1.5 1.5 0 0 1 22 12Zm-3.93 7.07a1.5 1.5 0 0 1-2.12 0l-2.18-2.18a1.5 1.5 0 1 1 2.12-2.12l2.18 2.18a1.5 1.5 0 0 1 0 2.12ZM12 22a1.5 1.5 0 0 1-1.5-1.5v-3.08a1.5 1.5 0 0 1 3 0v3.08A1.5 1.5 0 0 1 12 22Zm-7.07-3.93a1.5 1.5 0 0 1 0-2.12l2.18-2.18a1.5 1.5 0 1 1 2.12 2.12l-2.18 2.18a1.5 1.5 0 0 1-2.12 0ZM2 12a1.5 1.5 0 0 1 1.5-1.5h3.08a1.5 1.5 0 0 1 0 3H3.5A1.5 1.5 0 0 1 2 12Zm3.93-7.07a1.5 1.5 0 0 1 2.12 0l2.18 2.18a1.5 1.5 0 1 1-2.12 2.12L6.05 7.05a1.5 1.5 0 0 1 0-2.12Z" />
      </svg>
    ),
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10Z" />
      </svg>
    ),
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13c1.5-3.5 5-6 9-6 4.5 0 8.5 3 9 7-1.5 2.5-4 4-7 4-3 0-5.5-1.5-7-3L3 13Z" />
        <path d="M12 7c-1-2-2.5-3-4-3" />
        <circle cx="8" cy="11.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "llama",
    name: "Meta Llama",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.267-8-12.356-8-5.096 0-5.096 8 0 8 5.09 0 7.26-8 12.356-8Z" />
      </svg>
    ),
  },
  {
    id: "qwen",
    name: "Qwen",
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.8 3.8L12 11.9 5.2 8.1 12 4.3Zm-7 5.2 6 3.4v6.8l-6-3.4V9.5Zm8 10.2v-6.8l6-3.4v6.8l-6 3.4Z" />
      </svg>
    ),
  },
  {
    id: "groq",
    name: "Groq",
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
      </svg>
    ),
  },
  {
    id: "kimi",
    name: "Kimi",
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.79c-.44-.06-.9-.1-1.36-.1Z" />
      </svg>
    ),
  },
  {
    id: "glm",
    name: "GLM",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" />
      </svg>
    ),
  },
  {
    id: "usick",
    name: "Usick One",
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>
    ),
  },
];

type LogoCloudProps = React.ComponentProps<"div"> & {
  models?: LLMModel[];
  isDark?: boolean;
  duration?: number;
  speed?: number;
};

export function LogoCloud({
  className,
  models = LLM_MODELS,
  isDark = true,
  duration = 5.5,
  speed,
  ...props
}: LogoCloudProps) {
  const actualDuration = speed ?? duration;

  return (
    <div
      {...props}
      className={cn(
        "overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
        className
      )}
    >
      <InfiniteSlider gap={16} reverse duration={actualDuration} speedOnHover={15}>
        {models.map((model) => (
          <div
            key={model.id}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all shrink-0 select-none shadow-xs",
              isDark
                ? "border-white/10 bg-white/[0.05] text-zinc-200"
                : "border-black/10 bg-black/[0.04] text-zinc-800"
            )}
          >
            <div className="flex items-center justify-center shrink-0">
              {model.icon}
            </div>
            <span className="text-[12px] font-semibold tracking-wide whitespace-nowrap">
              {model.name}
            </span>
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
