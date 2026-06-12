import Link from "next/link";

import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import {
  getJobStatusBadgeClass,
  getJobStatusLabel,
  isJobStatus,
  type JobStatus,
} from "@/lib/utils";

type JobRecord = {
  id: string;
  company: string | null;
  title: string | null;
  match_score: number | null;
  salary: string | null;
  source: "search" | "url" | null;
  found_at: string | null;
  status: string | null;
};

type Props = {
  jobs: JobRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  status: JobStatus | "all";
};

function BuildingIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 21V6.8c0-.5.3-.9.8-1L15 4v17M4 21h16M10 10h2m-2 4h2m6 7v-8.5c0-.4-.3-.8-.7-.9L15 11m3 4h-1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function getMatchFillClass(score: number): string {
  if (score >= 85) return "bg-success";
  if (score >= 70) return "bg-info-medium";
  return "bg-warning";
}

function getSourceLabel(source: "search" | "url" | null): string {
  if (source === null) {
    return "Imported";
  }

  return source === "search" ? "Search" : "URL";
}

function getSourceClass(source: "search" | "url" | null): string {
  if (source === null) {
    return "bg-surface-secondary text-text-muted";
  }

  return source === "search"
    ? "bg-info-lightest text-info-foreground"
    : "bg-surface-secondary text-text-secondary";
}

function getSafeMatchScore(score: number | null): number {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return 0;
  }

  return Math.min(Math.max(score, 0), 100);
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) {
    return "Unknown";
  }

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Just now";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (error) {
    console.error("[JobsTable] Failed to format date:", error);
    return "Some time ago";
  }
}

function getSafeJobStatus(status: string | null): JobStatus {
  return status && isJobStatus(status) ? status : "active";
}

function getEmptyStateCopy(status: JobStatus | "all"): string {
  if (status === "all") {
    return "No jobs found. Try adjusting your filters or click \"Find Jobs\" above to search for new matches.";
  }

  return `No ${getJobStatusLabel(status).toLowerCase()} jobs found. Try adjusting your filters or choose another status.`;
}

export function JobsTable({ jobs, page, pageSize, totalCount, status }: Props) {
  return (
    <section
      aria-labelledby="jobs-table-heading"
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
    >
      <h2 id="jobs-table-heading" className="sr-only">
        Job matches
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-[1280px] table-fixed text-left">
          <thead className="bg-surface-secondary">
            <tr className="border-b border-border">
              <th className="w-[22%] px-8 py-5 text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
                Company
              </th>
              <th className="w-[25%] px-6 py-5 text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
                Role
              </th>
              <th className="w-[17%] px-6 py-5 text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
                Match Score
              </th>
              <th className="w-[13%] px-6 py-5 text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
                Salary Est.
              </th>
              <th className="w-[8%] px-6 py-5 text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
                Source
              </th>
              <th className="w-[8%] px-6 py-5 text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
                Status
              </th>
              <th className="w-[7%] px-6 py-5 text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
                Date Found
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-8 py-16 text-center text-sm font-medium text-text-secondary"
                >
                  {getEmptyStateCopy(status)}
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const matchScore = getSafeMatchScore(job.match_score);
                const company = job.company?.trim() || "Unknown company";
                const title = job.title?.trim() || "Untitled role";
                const jobStatus = getSafeJobStatus(job.status);

                return (
                <tr
                  key={job.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-secondary"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-secondary text-text-secondary">
                        <BuildingIcon className="h-5 w-5" />
                      </span>
                      <Link
                        className="text-sm font-semibold leading-5 text-text-primary hover:text-accent transition-colors"
                        href={`/find-jobs/${job.id}`}
                      >
                        {company}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <Link
                      className="text-sm font-medium leading-5 text-text-dark hover:text-accent transition-colors"
                      href={`/find-jobs/${job.id}`}
                    >
                      {title}
                    </Link>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <span className="h-1.5 w-32 rounded-full bg-border-light relative overflow-hidden">
                        <span
                          className={`block h-full rounded-full ${getMatchFillClass(matchScore)}`}
                          style={{ width: `${matchScore}%` }}
                        />
                      </span>
                      <span className="text-sm font-semibold leading-5 text-text-dark">
                        {matchScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm font-medium leading-5 text-text-secondary">
                    {job.salary || "Not specified"}
                  </td>
                  <td className="px-6 py-6">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium leading-4 ${getSourceClass(job.source)}`}
                    >
                      {getSourceLabel(job.source)}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium leading-4 ${getJobStatusBadgeClass(jobStatus)}`}
                    >
                      {getJobStatusLabel(jobStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm font-medium leading-5 text-text-secondary">
                    {formatRelativeTime(job.found_at)}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <JobsPagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </section>
  );
}
