"use client";

import Link from "next/link";

import { useJobStatus } from "@/components/job-details/JobStatusProvider";
import type { JobStatus } from "@/lib/utils";

function getApplyCta(status: JobStatus, applyUrl: string | null, company: string) {
  if (!applyUrl) {
    return (
      <div className="flex h-12 items-center justify-center rounded-md border border-border bg-surface px-6 text-sm font-semibold leading-5 text-text-muted">
        Apply link unavailable
      </div>
    );
  }

  if (status === "active") {
    return (
      <Link
        className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold leading-5 text-accent-foreground"
        href={applyUrl}
        rel="noreferrer"
        target="_blank"
      >
        Apply Now at {company}
      </Link>
    );
  }

  if (status === "applied") {
    return (
      <div className="flex h-12 items-center justify-center rounded-md border border-border bg-surface px-6 text-sm font-semibold leading-5 text-text-muted">
        Already Applied
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="flex h-12 items-center justify-center rounded-md border border-border bg-surface px-6 text-sm font-semibold leading-5 text-text-muted">
        Position Unavailable
      </div>
    );
  }

  return null;
}

type Props = {
  applyUrl: string | null;
  company: string;
};

export function JobActions({ applyUrl, company }: Props) {
  const { status } = useJobStatus();
  return getApplyCta(status, applyUrl, company);
}
