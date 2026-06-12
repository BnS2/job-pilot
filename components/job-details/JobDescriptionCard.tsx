type Props = {
  aboutRole: string | null;
};

export function JobDescriptionCard({ aboutRole }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path
              d="M8 4h5l4 4v12H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm5 0v4h4M10 13h4m-4 4h6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </span>
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Job Description
        </h2>
      </div>
      <p className="mt-8 text-sm font-medium leading-6 text-text-primary">
        {aboutRole || "No job description is available for this listing."}
      </p>
    </section>
  );
}
