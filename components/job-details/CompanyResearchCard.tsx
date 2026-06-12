type Props = {
  company: string;
};

export function CompanyResearchCard({ company }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-accent">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M7 21V6.8c0-.5.3-.9.8-1L15 4v17M4 21h16M10 10h2m-2 4h2m6 7v-8.5c0-.4-.3-.8-.7-.9L15 11m3 4h-1"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </span>
          <h2 className="text-base font-semibold leading-6 text-text-primary">
            Company Research
          </h2>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold leading-5 text-accent-foreground"
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path
              d="m20 20-4.5-4.5m2.5-5A7.5 7.5 0 1 1 3 10.5a7.5 7.5 0 0 1 15 0Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
          Research Company
        </button>
      </div>
      <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
          <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path
              d="M7 21V6.8c0-.5.3-.9.8-1L15 4v17M4 21h16M10 10h2m-2 4h2m6 7v-8.5c0-.4-.3-.8-.7-.9L15 11m3 4h-1"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
            />
          </svg>
        </span>
        <p className="mt-5 text-sm font-semibold leading-5 text-text-primary">
          No research yet
        </p>
        <p className="mt-2 max-w-[340px] text-sm font-medium leading-5 text-text-muted">
          Click &quot;Research Company&quot; to let the AI browse {company}&apos;s public pages and build a dossier.
        </p>
      </div>
    </section>
  );
}
