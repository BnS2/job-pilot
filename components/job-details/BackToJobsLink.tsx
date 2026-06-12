import Link from "next/link";

export function BackToJobsLink() {
  return (
    <Link
      className="inline-flex w-fit items-center gap-2 text-sm font-medium leading-5 text-text-secondary"
      href="/find-jobs"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="m15 18-6-6 6-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
      Back to Jobs
    </Link>
  );
}
