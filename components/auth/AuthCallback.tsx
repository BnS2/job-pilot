"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const pkceVerifierKey = "insforge_pkce_verifier";

export function AuthCallback() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function completeSignIn(): Promise<void> {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("insforge_code");
        const codeVerifier = sessionStorage.getItem(pkceVerifierKey);

        if (!isMounted) {
          return;
        }

        if (!code || !codeVerifier) {
          console.error("[auth/callback]", "Missing OAuth code or verifier");
          setHasError(true);
          return;
        }

        const response = await fetch("/api/auth/oauth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, codeVerifier }),
        });

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          console.error("[auth/callback]", "OAuth exchange failed");
          setHasError(true);
          return;
        }

        sessionStorage.removeItem(pkceVerifierKey);
        window.history.replaceState({}, document.title, window.location.pathname);
        router.replace("/dashboard");
      } catch (error) {
        console.error("[auth/callback]", error);

        if (isMounted) {
          setHasError(true);
        }
      }
    }

    void completeSignIn();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (hasError) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-base font-semibold leading-6 text-text-primary">
          Sign-in needs another try
        </h1>
        <p className="mt-3 text-sm font-medium leading-5 text-text-secondary">
          We couldn&apos;t finish the OAuth handoff. Please return to login and try again.
        </p>
        <Link
          href="/login?error=oauth"
          className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-base font-semibold leading-6 text-text-primary">
        Finishing sign-in
      </h1>
      <p className="mt-3 text-sm font-medium leading-5 text-text-secondary">
        Your session is being set up. You&apos;ll be sent to your dashboard in a moment.
      </p>
    </div>
  );
}
