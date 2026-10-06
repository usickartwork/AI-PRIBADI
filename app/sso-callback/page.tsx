"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/**
 * After Clerk redirects back from Google/Apple, this page runs.
 * - If the user is signing in for the first time (`user.firstSignIn`),
 *   we ask them to set a username (public metadata) and a password.
 *   This lets them later log in with email+password.
 * - Existing users are sent straight to the home page.
 */
export default function SSOCallbackPage() {
  const { isLoaded, user } = useUser();
  const clerk = useClerk();
  const router = useRouter();

  const [needsSetup, setNeedsSetup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect first sign‑in after OAuth
  useEffect(() => {
    if (!isLoaded) return;
    if (user?.firstSignIn) {
      setNeedsSetup(true);
    } else {
      // Regular sign‑in: send the user to the app
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) return null; // could render a spinner

  // -----------------------------------------------------------------
  // Setup form shown only for brand‑new users
  // -----------------------------------------------------------------
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() && !password) {
      setError("Please provide a username or password.");
      return;
    }
    setLoading(true);
    try {
      // Update public metadata (e.g., username)
      if (username.trim()) {
        await clerk.client.users.updateUser(user!.id, {
          publicMetadata: { username: username.trim() },
        });
      }

      // Create a password factor for the same email
      if (password) {
        // Clerk's signUp flow can be used to add a password to an existing user
        await clerk.client.signUp.create({
          emailAddress: user!.emailAddresses[0].emailAddress,
          password,
        });
      }

      // All set – forward to the app
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to complete setup."
      );
    } finally {
      setLoading(false);
    }
  };

  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafc] dark:bg-[#09090b]">
        <form
          onSubmit={handleSetup}
          className="w-full max-w-md space-y-4 p-6 bg-white dark:bg-[#161619] rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-bold text-center">Complete your account</h2>
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <input
            type="text"
            placeholder="Username (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
          <input
            type="password"
            placeholder="Set a password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save & Continue"}
          </button>
        </form>
      </div>
    );
  }

  // Fallback (should never be reached because of the redirect above)
  return null;
}
