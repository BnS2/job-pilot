"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { updateJobStatus } from "@/actions/jobs";
import { type JobStatus } from "@/lib/utils";

type Props = {
  jobId: string;
  status: JobStatus;
  children: ReactNode;
};

export function StatusButtonClient({ jobId, status, children }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const handleAction = (): void => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateJobStatus(jobId, status);
      if (!result.success && result.error) {
        setMessageTone("error");
        setMessage(result.error);
      } else {
        setMessageTone("success");
        setMessage("Status updated.");
        router.refresh();
      }
    });
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
        onClick={handleAction}
        type="button"
      >
        {isPending ? "Updating..." : children}
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
