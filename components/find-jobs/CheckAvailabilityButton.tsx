"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  jobId: string;
};

type AvailabilityApiResponse = {
  success?: unknown;
  status?: unknown;
  error?: unknown;
};

function isAvailabilityApiResponse(value: unknown): value is AvailabilityApiResponse {
  return typeof value === "object" && value !== null;
}

export function CheckAvailabilityButton({ jobId }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const handleCheck = async (): Promise<void> => {
    setIsPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agent/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, force: true }),
      });
      const data: unknown = await res.json();
      const parsedData = isAvailabilityApiResponse(data) ? data : {};

      if (parsedData.success === true) {
        setMessageTone("success");
        if (parsedData.status === "unavailable") {
          setMessage("Job listing is no longer active and has been marked unavailable.");
        } else {
          setMessage("Job listing appears to be active.");
        }
        router.refresh();
      } else {
        setMessageTone("error");
        setMessage(
          typeof parsedData.error === "string"
            ? parsedData.error
            : "Failed to check availability.",
        );
      }
    } catch (error) {
      console.error("[CheckAvailabilityButton] Availability check failed:", error);
      setMessageTone("error");
      setMessage("An error occurred while checking availability.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className={`h-10 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 transition-colors cursor-pointer disabled:cursor-not-allowed ${
          isPending
            ? "bg-surface-secondary text-text-muted opacity-80"
            : "text-text-primary hover:bg-surface-secondary hover:border-text-secondary"
        }`}
        disabled={isPending}
        onClick={handleCheck}
        type="button"
      >
        {isPending ? "Checking..." : "Check Availability"}
      </button>
      {message ? (
        <p
          className={`text-xs font-medium leading-4 ${
            messageTone === "success" ? "text-success-foreground" : "text-error"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
