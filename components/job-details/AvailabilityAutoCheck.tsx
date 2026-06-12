"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { JobStatus } from "@/lib/utils";

type Props = {
  currentStatus: JobStatus;
  jobId: string;
};

type AvailabilityApiResponse = {
  status?: unknown;
  success?: unknown;
};

function isAvailabilityApiResponse(value: unknown): value is AvailabilityApiResponse {
  return typeof value === "object" && value !== null;
}

export function AvailabilityAutoCheck({ currentStatus, jobId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    const checkAvailability = async (): Promise<void> => {
      try {
        const response = await fetch("/api/agent/availability", {
          body: JSON.stringify({ jobId }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        const data: unknown = await response.json();
        const parsedData = isAvailabilityApiResponse(data) ? data : {};

        if (
          response.ok &&
          parsedData.success === true &&
          parsedData.status === "unavailable" &&
          currentStatus !== "unavailable"
        ) {
          router.refresh();
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("[AvailabilityAutoCheck] Availability check failed:", error);
        }
      }
    };

    void checkAvailability();

    return () => {
      controller.abort();
    };
  }, [currentStatus, jobId, router]);

  return null;
}
