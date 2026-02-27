"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiMail } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "@/components/Button";
import { getSession, signIn } from "@/api/client/auth.api";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Unable to sign in.";
};

export default function LoginClient({ forceSwitch = false }: { forceSwitch?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(!forceSwitch);

  useEffect(() => {
    if (forceSwitch) {
      setCheckingSession(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const session = await getSession();
        if (!cancelled && session?.user) {
          router.replace("/referrals");
          return;
        }
      } catch {
        // Ignore session check errors here; the login form is still usable.
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [forceSwitch, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn({
        email: email.trim(),
        password,
        callbackUrl: `${window.location.origin}/referrals`,
      });
      router.replace("/referrals");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
      <div className="w-full rounded-2xl border border-accent-3 bg-accent-1 p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast/60">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand">Sign in</h1>
        <p className="mt-2 text-sm text-contrast/75">
          {forceSwitch
            ? "Your current session does not have platform admin access. Sign in with an allowlisted admin account."
            : "Use your allowlisted account to access the referral admin portal."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-xs text-contrast/70">
            Email
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-contrast/45">
                <FiMail className="h-4 w-4" />
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-lg border border-accent-3 bg-primary pl-10 pr-4 text-sm text-contrast outline-none placeholder:text-contrast/50"
                disabled={submitting || checkingSession}
              />
            </div>
          </label>

          <label className="block text-xs text-contrast/70">
            Password
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-contrast/45">
                <FiLock className="h-4 w-4" />
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-11 w-full rounded-lg border border-accent-3 bg-primary pl-10 pr-4 text-sm text-contrast outline-none placeholder:text-contrast/50"
                disabled={submitting || checkingSession}
              />
            </div>
          </label>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || checkingSession}
            >
              {checkingSession
                ? "Checking session..."
                : submitting
                  ? "Signing in..."
                  : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
