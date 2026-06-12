"use client";

import { insforge } from "@/lib/insforge-client";

export function getLoginRedirectPath(): string {
  const nextPath = `${window.location.pathname}${window.location.search}`;
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export async function clearExpiredSession(): Promise<void> {
  try {
    await insforge.auth.signOut();
  } catch (error) {
    console.error("[auth] Failed to clear browser auth state:", error);
  }

  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("[auth] Failed to clear auth cookies:", error);
  }
}
