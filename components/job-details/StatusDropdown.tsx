"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { updateJobStatus } from "@/actions/jobs";
import { useJobStatus } from "@/components/job-details/JobStatusProvider";
import type { JobStatus } from "@/lib/utils";
import { toast } from "@/lib/toast";

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

function getStatusDisplayName(status: JobStatus): string {
  const names: Record<JobStatus, string> = {
    active: "Active",
    applied: "Applied",
    unavailable: "Unavailable",
    archived: "Archived",
    rejected: "Rejected",
    completed: "Completed",
  };
  return names[status];
}

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
  company: string;
  title: string;
};

export function StatusDropdown({ jobId, status, company, title }: Props) {
  const { setStatus } = useJobStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const transitions = STATUS_TRANSITIONS[status];
  const actionLabel = getStatusActionLabel(status);
  const statusDisplayName = getStatusDisplayName(status);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleTransition = (nextStatus: JobStatus): void => {
    setIsOpen(false);
    const subtitle = `${company} \u2014 ${title}`;
    startTransition(async () => {
      const result = await updateJobStatus(jobId, nextStatus);
      if (!result.success && result.error) {
        toast.statusChange({ variant: "error", title: result.error, subtitle });
      } else {
        setStatus(nextStatus);

        if (nextStatus === "active") {
          toast.statusChange({ variant: "restored", title: "Restored to active", subtitle });
        } else {
          const labelMap: Record<string, { label: string; variant: "applied" | "archived" | "rejected" | "completed" }> = {
            applied: { label: "Marked as Applied", variant: "applied" },
            archived: { label: "Archived", variant: "archived" },
            rejected: { label: "Marked as Rejected", variant: "rejected" },
            completed: { label: "Marked as Completed", variant: "completed" },
          };
          const entry = labelMap[nextStatus];
          if (entry) {
            toast.statusChange({ variant: entry.variant, title: entry.label, subtitle });
          } else {
            toast.statusChange({ variant: "applied", title: "Status updated", subtitle });
          }
        }
      }
    });
  };

  const singleAction = transitions.length === 1 && transitions[0];

  return (
    <div className="flex flex-col items-center gap-2">
      {singleAction ? (
        <button
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium leading-5 text-accent-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-accent-dark"
          disabled={isPending}
          onClick={() => handleTransition(singleAction.status)}
          type="button"
        >
          {isPending ? (
            "Restoring..."
          ) : (
            <>
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M1 4v6h6M23 20v-6h-6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              {actionLabel}
            </>
          )}
        </button>
      ) : (
        <div className="relative" ref={containerRef}>
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
            {isPending ? "Updating..." : statusDisplayName}
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
      )}
    </div>
  );
}
