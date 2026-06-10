"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { insforge } from "@/lib/insforge-client";
import {
  capturePostHogEvent,
  resetPostHogUser,
} from "@/lib/posthog-client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsPending(true);

    capturePostHogEvent("user_signed_out", {});
    resetPostHogUser();

    try {
      await insforge.auth.signOut();
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        console.error("[auth/logout]", "Logout route failed");
      }
    } catch (error) {
      console.error("[auth/logout]", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        void handleLogout();
      }}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5" />
      </svg>
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
