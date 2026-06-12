"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { clearExpiredSession, getLoginRedirectPath } from "@/lib/auth-client";

export function AuthSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    async function verifyRefreshSession(): Promise<void> {
      try {
        const response = await fetch("/api/auth/refresh", { method: "POST" });

        if (!isActive) {
          return;
        }

        if (response.status === 401) {
          await clearExpiredSession();

          if (!isActive) {
            return;
          }

          router.replace(getLoginRedirectPath());
        }
      } catch (error) {
        console.error("[AuthSessionGuard] Session refresh check failed:", error);
      }
    }

    const interval = setInterval(() => {
      void verifyRefreshSession();
    }, 5 * 60 * 1000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
