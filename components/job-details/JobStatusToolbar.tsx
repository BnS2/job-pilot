"use client";

import Link from "next/link";

import { AvailabilityIndicator } from "@/components/job-details/AvailabilityIndicator";
import { useJobStatus } from "@/components/job-details/JobStatusProvider";
import { StatusDropdown } from "@/components/job-details/StatusDropdown";
import type { JobStatus } from "@/lib/utils";

function shouldShowAvailability(status: JobStatus): boolean {
  return status === "active" || status === "unavailable";
}

type Props = {
  jobId: string;
  company: string;
  applyUrl: string | null;
  title: string;
};

export function JobStatusToolbar({ jobId, company, applyUrl, title }: Props) {
  const { status } = useJobStatus();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {applyUrl ? (
        <Link
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold leading-5 text-text-primary transition-colors hover:border-text-secondary hover:bg-surface-secondary"
          href={applyUrl}
          rel="noreferrer"
          target="_blank"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path
              d="M14 5h5v5m0-5-8 8m-4-6H5.8c-.5 0-.8.3-.8.8v10.4c0 .5.3.8.8.8h10.4c.5 0 .8-.3.8-.8V17"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
          View Job Post
        </Link>
      ) : null}
      <StatusDropdown company={company} jobId={jobId} status={status} title={title} />
      {shouldShowAvailability(status) ? (
        <AvailabilityIndicator
          company={company}
          jobId={jobId}
          title={title}
        />
      ) : null}
    </div>
  );
}
