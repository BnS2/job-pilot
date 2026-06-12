import Link from "next/link";

import {
  getJobStatusBadgeClass,
  getJobStatusLabel,
  type JobStatus,
} from "@/lib/utils";

type Props = {
  applyUrl: string | null;
  company: string;
  matchScore: number;
  status: JobStatus;
  title: string;
};

export function JobHeader({ applyUrl, company, matchScore, status, title }: Props) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary text-text-muted">
          <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
            <path
              d="M7 21V6.8c0-.5.3-.9.8-1L15 4v17M4 21h16M10 10h2m-2 4h2m6 7v-8.5c0-.4-.3-.8-.7-.9L15 11m3 4h-1"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
            />
          </svg>
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold leading-8 text-text-primary">
            {title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold leading-5 text-text-muted">
            <span>{company}</span>
            <span aria-hidden="true">&bull;</span>
            <span className="rounded-full bg-success-lightest px-3 py-1 text-sm font-semibold leading-5 text-success-foreground">
              {matchScore}% Match Score
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium leading-4 ${getJobStatusBadgeClass(status)}`}
            >
              {getJobStatusLabel(status)}
            </span>
          </div>
        </div>
      </div>

      {applyUrl ? (
        <Link
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold leading-5 text-text-primary"
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
    </section>
  );
}
