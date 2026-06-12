type Props = {
  matchReason: string | null;
};

export function MatchReasoningCard({ matchReason }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-lightest text-success">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path
              d="M4 15.5 8.5 11l3 3L19 6.5M18 6h2v2M6 19h12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </span>
        <h2 className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
          AI Match Reasoning
        </h2>
      </div>
      <p className="mt-6 text-sm font-medium leading-6 text-text-primary">
        {matchReason || "No match reasoning is available for this job yet."}
      </p>
    </section>
  );
}
