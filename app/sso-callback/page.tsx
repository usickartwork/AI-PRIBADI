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
 *    we check `user.passwordEnabled`:
 *    - false → first-time user, MUST set a username and password before entering.
 *    - true  → returning user, redirect straight to "/".
 */
export default function SSOCallbackPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- detect first sign-in ----------
  useEffect(() => {
    if (!isLoaded || !user) return;

    if (!user.passwordEnabled) {
      // First-time OAuth user — must complete profile
      setNeedsSetup(true);
    } else {
      // Returning user — go straight to the app
      setNeedsSetup(false);
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  // ---------- setup form handler ----------
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username wajib diisi.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      // 1. Set username
      await user!.update({ username: username.trim() });

      // 2. Create a password factor so the user can later log in with
      //    email/username + password. No currentPassword needed (OAuth-only account).
      await user!.updatePassword({ newPassword: password });

      // 3. Done — go to the app
      router.replace("/");
    } catch (err) {
      console.error("Setup error:", err);
      const clerkErr = err as any;
      const msg =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Gagal menyimpan data.");
      setError(msg);
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

  // Phase 2: brand-new user — MUST set username & password (no skip)
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
          {/* Header */}
          <div className="text-center mb-2">
            <div className="mb-3 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-black dark:text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Complete Your Account
            </h2>
            <p className="text-xs mt-1.5 text-zinc-500 dark:text-zinc-400">
              Set a username and password so you can also sign in without Google/Apple.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Email (read-only, from OAuth) */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">
              Email
            </label>
            <input
              type="email"
              readOnly
              value={user?.primaryEmailAddress?.emailAddress || ""}
              className="w-full px-4 py-3 rounded-2xl text-xs border outline-none
                bg-zinc-100/80 dark:bg-[#202024]/70
                border-black/5 dark:border-white/5
                text-zinc-500 dark:text-zinc-400
                cursor-not-allowed"
            />
          </div>

          {/* Username */}
          <div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full px-4 py-3 rounded-2xl text-xs border outline-none transition
                bg-zinc-100/80 dark:bg-[#202024]/70
                border-black/5 dark:border-white/5
                placeholder-zinc-400 dark:placeholder-zinc-500
                focus:border-black/20 dark:focus:border-white/20"
            />
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 characters)"
              className="w-full px-4 py-3 rounded-2xl text-xs border outline-none transition
                bg-zinc-100/80 dark:bg-[#202024]/70
                border-black/5 dark:border-white/5
                placeholder-zinc-400 dark:placeholder-zinc-500
                focus:border-black/20 dark:focus:border-white/20"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-4 py-3 rounded-2xl text-xs border outline-none transition
                bg-zinc-100/80 dark:bg-[#202024]/70
                border-black/5 dark:border-white/5
                placeholder-zinc-400 dark:placeholder-zinc-500
                focus:border-black/20 dark:focus:border-white/20"
            />
          </div>

          {/* Submit */}
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
        </form>
      </div>
    );
  }

  // Phase 3: existing user — should have been redirected already
  return null;
}
