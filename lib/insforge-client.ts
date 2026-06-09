"use client";

import { createBrowserClient } from "@insforge/sdk/ssr";

function requireBrowserEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const insforge = createBrowserClient({
  baseUrl: requireBrowserEnv(
    process.env.NEXT_PUBLIC_INSFORGE_URL,
    "NEXT_PUBLIC_INSFORGE_URL",
  ),
  anonKey: requireBrowserEnv(
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    "NEXT_PUBLIC_INSFORGE_ANON_KEY",
  ),
  refreshUrl: "/api/auth/refresh",
});
