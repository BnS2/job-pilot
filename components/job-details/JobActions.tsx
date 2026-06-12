import Link from "next/link";

import { CheckAvailabilityButton } from "@/components/find-jobs/CheckAvailabilityButton";
import { StatusButtonClient } from "@/components/find-jobs/StatusButtonClient";
import type { JobStatus } from "@/lib/utils";

type Props = {
  applyUrl: string | null;
  company: string;
  jobId: string;
  status: JobStatus;
};

export function JobActions({ applyUrl, company, jobId, status }: Props) {
  return (
    <>
      <section className="flex flex-wrap justify-center gap-3">
        {status !== "applied" ? (
          <StatusButtonClient jobId={jobId} status="applied">
            Mark Applied
          </StatusButtonClient>
        ) : null}
        {status !== "archived" ? (
          <StatusButtonClient jobId={jobId} status="archived">
            Archive
          </StatusButtonClient>
        ) : null}
        {status !== "rejected" ? (
          <StatusButtonClient jobId={jobId} status="rejected">
            Mark Rejected
          </StatusButtonClient>
        ) : null}
        {status !== "completed" ? (
          <StatusButtonClient jobId={jobId} status="completed">
            Mark Completed
          </StatusButtonClient>
        ) : null}
        {status !== "active" ? (
          <StatusButtonClient jobId={jobId} status="active">
            Restore Active
          </StatusButtonClient>
        ) : null}
        <CheckAvailabilityButton jobId={jobId} />
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
