import { JobInfoCard } from "@/components/job-details/JobInfoCard";
import { formatJobType, formatRelativeTime } from "@/components/job-details/jobDetailsFormatters";

type Props = {
  foundAt: string | null;
  jobType: string | null;
  location: string | null;
  salary: string | null;
};

export function JobInfoGrid({ foundAt, jobType, location, salary }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-base font-semibold leading-6 text-text-primary">
        Listing details
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <JobInfoCard
          icon={
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 4v16m4-12.5c-1-.8-2.3-1.1-3.7-1.1-2 0-3.7.9-3.7 2.7 0 3.8 7.8 1.7 7.8 5.8 0 1.8-1.6 2.8-3.9 2.8-1.7 0-3.2-.5-4.4-1.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          }
          iconClassName="bg-success-lightest text-success"
          label="Salary Estimated"
          value={salary || "-"}
        />
        <JobInfoCard
          icon={
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
              <path
                d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          }
          iconClassName="bg-info-lightest text-info-medium"
          label="Location"
          value={location?.trim() || "-"}
        />
        <JobInfoCard
          icon={
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1m-9 4v8m12-8v8M5 8h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm7 0v12"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          }
          iconClassName="bg-accent-muted text-accent"
          label="Job Type"
          value={formatJobType(jobType)}
        />
        <JobInfoCard
          icon={
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M8 4v3m8-3v3M5 9h14M6 6h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          }
          iconClassName="bg-surface-secondary text-text-secondary"
          label="Date Found"
          value={formatRelativeTime(foundAt)}
        />
      </div>
    </section>
  );
}
