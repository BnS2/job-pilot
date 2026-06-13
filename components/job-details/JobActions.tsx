"use client";

import Link from "next/link";

import { CheckAvailabilityButton } from "@/components/find-jobs/CheckAvailabilityButton";
import { useJobStatus } from "@/components/job-details/JobStatusProvider";
import { StatusDropdown } from "@/components/job-details/StatusDropdown";
import type { JobStatus } from "@/lib/utils";

function shouldShowAvailability(status: JobStatus): boolean {
  return status === "active" || status === "unavailable";
}

type Props = {
  applyUrl: string | null;
  company: string;
  jobId: string;
};

export function JobActions({ applyUrl, company, jobId }: Props) {
  const { status } = useJobStatus();
  return (
    <>
      <section className="flex flex-wrap justify-center gap-3">
        <StatusDropdown jobId={jobId} status={status} />
        {shouldShowAvailability(status) ? (
          <CheckAvailabilityButton jobId={jobId} />
        ) : null}
      </section>

      {applyUrl ? (
        <Link
          className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold leading-5 text-accent-foreground"
          href={applyUrl}
          rel="noreferrer"
          target="_blank"
        >
          Apply Now at {company}
        </Link>
      ) : (
        <div className="flex h-12 items-center justify-center rounded-md border border-border bg-surface px-6 text-sm font-semibold leading-5 text-text-muted">
          Apply link unavailable
        </div>
      )}
    </>
  );
}
