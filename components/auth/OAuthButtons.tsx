"use client";

import { useState } from "react";

import { ProviderIcon } from "@/components/auth/ProviderIcon";
import { insforge } from "@/lib/insforge-client";

type OAuthProvider = "google" | "github";

const providerLabels: Record<OAuthProvider, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

export function OAuthButtons() {
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleOAuthSignIn(provider: OAuthProvider): Promise<void> {
    setPendingProvider(provider);
    setErrorMessage(null);

    const { error } = await insforge.auth.signInWithOAuth(provider, {
      redirectTo: `${window.location.origin}/callback`,
      additionalParams: provider === "google" ? { prompt: "select_account" } : undefined,
    });

    if (error) {
      console.error("[auth/oauth]", error);
      setErrorMessage("We couldn't start sign-in. Please try again.");
      setPendingProvider(null);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {(Object.keys(providerLabels) as OAuthProvider[]).map((provider) => {
        const isPending = pendingProvider === provider;

        return (
          <button
            key={provider}
            type="button"
            disabled={pendingProvider !== null}
            onClick={() => {
              void handleOAuthSignIn(provider);
            }}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
          >
            <span
              aria-hidden="true"
              className="flex h-5 min-w-5 items-center justify-center text-text-dark"
            >
              <ProviderIcon provider={provider} />
            </span>
            {isPending ? "Redirecting..." : providerLabels[provider]}
          </button>
        );
      })}

      {errorMessage ? (
        <p className="text-sm font-medium leading-5 text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
