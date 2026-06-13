"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { updateJobStatus } from "@/actions/jobs";
import { useJobStatus } from "@/components/job-details/JobStatusProvider";
import { type JobStatus } from "@/lib/utils";

type Transition = {
  status: JobStatus;
  label: string;
};

const STATUS_TRANSITIONS: Record<JobStatus, Transition[]> = {
  active: [
    { status: "applied", label: "Mark Applied" },
    { status: "archived", label: "Archive" },
    { status: "rejected", label: "Mark Rejected" },
    { status: "completed", label: "Mark Completed" },
  ],
  applied: [
    { status: "rejected", label: "Mark Rejected" },
    { status: "completed", label: "Mark Completed" },
    { status: "active", label: "Restore Active" },
  ],
  unavailable: [
    { status: "active", label: "Restore Active" },
    { status: "archived", label: "Archive" },
  ],
  archived: [{ status: "active", label: "Restore Active" }],
  rejected: [{ status: "active", label: "Restore Active" }],
  completed: [{ status: "active", label: "Restore Active" }],
};

function getStatusActionLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    active: "Mark Applied",
    applied: "Mark Rejected",
    unavailable: "Restore Active",
    archived: "Restore Active",
    rejected: "Restore Active",
    completed: "Restore Active",
  };
  return labels[status];
}

type Props = {
  jobId: string;
  status: JobStatus;
};

export function StatusDropdown({ jobId, status }: Props) {
  const { setStatus } = useJobStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const containerRef = useRef<HTMLDivElement>(null);

  const transitions = STATUS_TRANSITIONS[status];
  const actionLabel = getStatusActionLabel(status);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleTransition = (nextStatus: JobStatus): void => {
    setIsOpen(false);
    setMessage(null);
    startTransition(async () => {
      const result = await updateJobStatus(jobId, nextStatus);
      if (!result.success && result.error) {
        setMessageTone("error");
        setMessage(result.error);
      } else {
        setMessageTone("success");
        setMessage("Status updated.");
        setStatus(nextStatus);
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-2" ref={containerRef}>
      <div className="relative">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className={`inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 transition-colors disabled:cursor-not-allowed ${
            isPending
              ? "bg-surface-secondary text-text-muted opacity-80"
              : "text-text-primary hover:bg-surface-secondary hover:border-text-secondary"
          }`}
          disabled={isPending}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isPending ? "Updating..." : actionLabel}
          <svg
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        {isOpen ? (
          <div
            className="absolute left-0 top-full z-10 mt-1 min-w-40 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg"
            role="menu"
          >
            {transitions.map((transition) => (
              <button
                className="block w-full px-4 py-2 text-left text-sm font-medium leading-5 text-text-primary transition-colors hover:bg-surface-secondary"
                key={transition.status}
                onClick={() => handleTransition(transition.status)}
                role="menuitem"
                type="button"
              >
                {transition.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
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
