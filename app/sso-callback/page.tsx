"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * After Clerk redirects back from Google/Apple, this page runs.
 *
 * 1. <AuthenticateWithRedirectCallback /> completes the OAuth handshake and
 *    sets the session cookie.
 * 2. Once the session is ready (`useUser` fires with `isLoaded && user`),
 *    we check whether the account was *just* created (within the last 60 s)
 *    **and** doesn't yet have a password.
 *    - Yes → show a "Complete your account" form (username + password).
 *    - No  → redirect straight to "/".
 */
export default function SSOCallbackPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- detect first sign‑in ----------
  useEffect(() => {
    if (!isLoaded || !user) return;

    const isNewAccount =
      user.createdAt !== null &&
      Date.now() - new Date(user.createdAt).getTime() < 60_000;

    if (isNewAccount && !user.passwordEnabled) {
      setNeedsSetup(true);
    } else {
      setNeedsSetup(false);
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  // ---------- setup form handler ----------
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Set username (if provided)
      if (username.trim()) {
        await user!.update({ username: username.trim() });
      }

      // 2️⃣ Create a password factor so the user can later log in with
      //    email + password. `currentPassword` is omitted because the
      //    user doesn't have one yet (OAuth‑only account).
      await user!.updatePassword({ newPassword: password });

      // 3️⃣ Done — go to the app
      router.replace("/");
    } catch (err) {
      console.error("Setup error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete setup."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------- render ----------

  // Phase 1: Clerk is still completing the OAuth handshake
  if (!isLoaded || needsSetup === null) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#fafafc] dark:bg-[#09090b]">
        <AuthenticateWithRedirectCallback />
      </div>
    );
  }

  // Phase 2: brand‑new user → ask for username & password
  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafc] dark:bg-[#09090b] p-4">
        <form
          onSubmit={handleSetup}
          className="w-full max-w-[380px] space-y-4 p-7 rounded-3xl shadow-2xl
            bg-white/95 dark:bg-[#161619]/90
            border border-black/10 dark:border-white/10
            text-black dark:text-white"
        >
          <h2 className="text-xl font-bold text-center">
            Complete your account
          </h2>
          <p className="text-xs text-center text-zinc-500">
            Set a username and password so you can also sign in with email.
          </p>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <input
            type="text"
            placeholder="Username (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-xs border outline-none transition
              bg-zinc-100/80 dark:bg-[#202024]/70
              border-black/5 dark:border-white/5
              placeholder-zinc-400 dark:placeholder-zinc-500
              focus:border-black/20 dark:focus:border-white/20"
          />

          <input
            type="password"
            placeholder="Set a password (min. 6 characters)"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-xs border outline-none transition
              bg-zinc-100/80 dark:bg-[#202024]/70
              border-black/5 dark:border-white/5
              placeholder-zinc-400 dark:placeholder-zinc-500
              focus:border-black/20 dark:focus:border-white/20"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl text-xs font-semibold transition cursor-pointer shadow-md
              bg-black dark:bg-white
              text-white dark:text-black
              hover:bg-zinc-800 dark:hover:bg-zinc-200
              disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save & Continue"}
          </button>

          {/* Skip button – user can always set a password later */}
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full text-xs text-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
          >
            Skip for now
          </button>
        </form>
      </div>
    );
  }

  // Phase 3: existing user – should have been redirected already, but just in case
  return null;
}
