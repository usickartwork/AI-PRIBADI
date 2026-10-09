"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const socialProviders = [
  {
    id: "google",
    label: "Continue with Google",
    src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjYyIj48cGF0aCBmaWxsPSIjNDI4NWY0IiBkPSJNMjU1Ljg3OCAxMzMuNDUxYzAtMTAuNzM0LS44NzEtMTguNTY3LTIuNzU2LTI2LjY5SDEzMC41NXY0OC40NDhoNzEuOTQ3Yy0xLjQ1IDEyLjA0LTkuMjgzIDMwLjE3Mi0yNi42OSA0Mi4zNTZsLS4yNDQgMS42MjJsMzguNzU1IDMwLjAyM2wyLjY4NS4yNjhjMjQuNjU5LTIyLjc3NCAzOC44NzUtNTYuMjgyIDM4Ljg3NS05Ni4wMjciLz48cGF0aCBmaWxsPSIjMzRhODUzIiBkPSJNMTMwLjU1IDI2MS4xYzM1LjI0OCAwIDY0LjgzOS0xMS42MDUgODYuNDUzLTMxLjYyMmwtNDEuMTk2LTMxLjkxM2MtMTEuMDI0IDcuNjg4LTI1LjgyIDEzLjA1NS00NS4yNTcgMTMuMDU1Yy0zNC41MjMgMC02My44MjQtMjIuNzczLTc0LjI2OS01NC4yNWwtMS41MzEuMTNsLTQwLjI5OCAzMS4xODdsLS41MjcgMS40NjVDMzUuMzkzIDIzMS43OTggNzkuNDkgMjYxLjEgMTMwLjU1IDI2MS4xIi8+PHBhdGggZmlsbD0iI2ZiYmMwNSIgZD0iTTU2LjI4MSAxNTYuMzdjLTIuNzU2LTguMTIzLTQuMzUxLTE2LjgyNy00LjM1MS0yNS44MmMwLTguOTk0IDEuNTk1LTE3LjY5NyA0LjIwNi0yNS44MmwtLjA3My0xLjczTDE1LjI2IDcxLjMxMmwtMS4zMzUuNjM1QzUuMDc3IDg5LjY0NCAwIDEwOS41MTcgMCAxMzAuNTVzNS4wNzcgNDAuOTA1IDEzLjkyNSA1OC42MDJ6Ii8+PHBhdGggZmlsbD0iI2ViNDMzNSIgZD0iTTEzMC41NSA1MC40NzljMjQuNTE0IDAgNDEuMDUgMTAuNTg5IDUwLjQ3OSAxOS40MzhsMzYuODQ0LTM1Ljk3NEMxOTUuMjQ1IDEyLjkxIDE2NS43OTggMCAxMzAuNTUgMEM3OS40OSAwIDM1LjM5MyAyOS4zMDEgMTMuOTI1IDcxLjk0N2w0Mi4yMTEgMzIuNzgzYzEwLjU5LTMxLjQ3NyAzOS44OTEtNTQuMjUxIDc0LjQxNC01NC4yNTEiLz48L3N2Zz4=",
    darkInvert: false,
  },
  {
    id: "apple",
    label: "Continue with Apple",
    src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMzE1Ij48cGF0aCBkPSJNMjEzLjgwMyAxNjcuMDNjLjQ0MiA0Ny41OCA0MS43NCA2My40MTMgNDIuMTk3IDYzLjYxNWMtLjM1IDEuMTE2LTYuNTk5IDIyLjU2My0yMS43NTcgNDQuNzE2Yy0xMy4xMDQgMTkuMTUzLTI2LjcwNSAzOC4yMzUtNDguMTMgMzguNjNjLTIxLjA1LjM4OC0yNy44Mi0xMi40ODMtNTEuODg4LTEyLjQ4M2MtMjQuMDYxIDAtMzEuNTgyIDEyLjA4OC01MS41MSAxMi44NzFjLTIwLjY4Ljc4My0zNi40MjgtMjAuNzEtNDkuNjQtMzkuNzkzYy0yNy0zOS4wMzMtNDcuNjMzLTExMC4zLTE5LjkyOC0xNTguNDA2YzEzLjc2My0yMy44OSAzOC4zNi0zOS4wMTcgNjUuMDU2LTM5LjQwNWMyMC4zMDctLjM4NyAzOS40NzUgMTMuNjYyIDUxLjg4OSAxMy42NjJjMTIuNDA2IDAgMzUuNjk5LTE2Ljg5NSA2MC4xODYtMTQuNDE0YzEwLjI1LjQyNyAzOS4wMjYgNC4xNCA1Ny41MDMgMzEuMTg2Yy0xLjQ5LjkyMy0zNC4zMzUgMjAuMDQ0LTMzLjk3OCA1OS44MjJNMTc0LjI0IDUwLjE5OWMxMC45OC0xMy4yOSAxOC4zNjktMzEuNzkgMTYuMzUzLTUwLjE5OWMtMTUuODI2LjYzNi0zNC45NjIgMTAuNTQ2LTQ2LjMxNCAyMy44MjhjLTEwLjE3MyAxMS43NjMtMTkuMDgyIDMwLjU4OS0xNi42NzggNDguNjMzYzE3LjY0IDEuMzY1IDM1LjY2LTguOTY0IDQ2LjY0LTIyLjI2MiIvPjwvc3ZnPg==",
    darkInvert: true,
  },
];

export interface Login16Props {
  mode?: "sign-in" | "sign-up";
  onModeChange?: (mode: "sign-in" | "sign-up") => void;
  onSubmit?: (e: React.FormEvent, credentials: { identifier: string; password: string }) => void;
  onOAuth?: (provider: "google" | "apple") => void;
  loading?: boolean;
  oauthLoading?: string | null;
  error?: string | null;
  brandName?: string;
  className?: string;
  isModal?: boolean;
}

export default function Login16({
  mode: initialMode = "sign-in",
  onModeChange,
  onSubmit,
  onOAuth,
  loading = false,
  oauthLoading = null,
  error = null,
  brandName = "One Mind",
  className,
  isModal = false,
}: Login16Props) {
  const [internalMode, setInternalMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const mode = onModeChange ? initialMode : internalMode;

  const handleModeToggle = (nextMode: "sign-in" | "sign-up") => {
    if (onModeChange) {
      onModeChange(nextMode);
    } else {
      setInternalMode(nextMode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e, { identifier, password });
    }
  };

  const isSignIn = mode === "sign-in";

  const content = (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Star Logo Usick One / One Mind */}
        <div className="flex items-center justify-center">
          <svg
            className="size-9 text-foreground fill-foreground transition-transform duration-300 hover:scale-105"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        </div>
        <h1 className="font-semibold text-2xl tracking-tight text-foreground">
          {isSignIn ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignIn
            ? `Sign in to your ${brandName} account`
            : `Sign up to start using ${brandName}`}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 p-3 rounded-xl text-xs bg-red-500/10 border border-red-500/25 text-red-500 dark:text-red-400 flex items-start gap-2.5 animate-in fade-in-0 duration-200"
        >
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {socialProviders.map((p) => {
          const isPending = oauthLoading === `oauth_${p.id}` || oauthLoading === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={loading || Boolean(oauthLoading)}
              onClick={() => onOAuth?.(p.id as "google" | "apple")}
              className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <div className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.src}
                  alt={p.id}
                  className={p.darkInvert ? "size-4 dark:invert" : "size-4"}
                />
              )}
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          or
        </span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="l16-email"
            className="text-xs font-medium text-foreground"
          >
            Email or Username
          </label>
          <Input
            id="l16-email"
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@company.com"
            className="h-11"
          />
        </div>

        {/* Without forgot button as explicitly requested */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="l16-pw"
            className="text-xs font-medium text-foreground"
          >
            Password
          </label>
          <Input
            id="l16-pw"
            type="password"
            required
            autoComplete={isSignIn ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={loading || Boolean(oauthLoading)}
          className="mt-1 h-11 w-full rounded-xl cursor-pointer"
        >
          {loading ? (
            <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : isSignIn ? (
            "Sign in"
          ) : (
            "Sign up"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {isSignIn ? (
          <>
            New here?{" "}
            <button
              type="button"
              onClick={() => handleModeToggle("sign-up")}
              className="font-medium text-foreground underline-offset-4 hover:underline cursor-pointer"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => handleModeToggle("sign-in")}
              className="font-medium text-foreground underline-offset-4 hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );

  if (isModal) {
    return <div className={cn("w-full", className)}>{content}</div>;
  }

  return (
    <section className={cn("flex min-h-dvh items-center justify-center bg-background px-6 py-16", className)}>
      {content}
    </section>
  );
}
