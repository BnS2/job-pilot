"use client";

import { MatchScoreMeter, getMatchScoreTone } from "@/components/MatchScoreMeter";
import { useJobStatus } from "@/components/job-details/JobStatusProvider";
import {
  getJobStatusAccentClass,
  getJobStatusBadgeClass,
  getJobStatusLabel,
} from "@/lib/utils";

type Props = {
  company: string;
  matchScore: number;
  onEditClick?: () => void;
  title: string;
};

export function JobHeader({ company, matchScore, onEditClick, title }: Props) {
  const { status } = useJobStatus();
  const accentClass = getJobStatusAccentClass(status);
  const matchTone = getMatchScoreTone(matchScore);
  return (
    <section
      className={`rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8 ${accentClass}`}
    >
      <div className="flex min-w-0 items-start gap-5">
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
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="max-w-3xl text-2xl font-semibold leading-9 text-text-primary sm:text-3xl sm:leading-10">
              {title}
            </h1>
            {onEditClick ? (
              <button
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-secondary"
                onClick={onEditClick}
                type="button"
                aria-label="Edit job details"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                Edit
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold leading-5 text-text-muted">
            <span>{company}</span>
            <span aria-hidden="true">&bull;</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold leading-5 ${matchTone.badgeClass}`}
            >
              {matchScore}% {matchTone.label}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium leading-4 ${getJobStatusBadgeClass(status)}`}
            >
              {getJobStatusLabel(status)}
            </span>
          </div>
          <div className="mt-6 max-w-md">
            <MatchScoreMeter score={matchScore} size="full" />
          </div>
        </div>
      </div>
    </section>
  );
}
