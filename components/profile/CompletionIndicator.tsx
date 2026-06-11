type Props = {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
};

export function CompletionIndicator({ isComplete, completionPercentage, missingFields }: Props) {
  if (isComplete) {
    return (
      <section className="rounded-xl border border-success/20 bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-success text-[10px] font-semibold leading-none text-success">
                ✓
              </span>
              <h1 className="text-base font-semibold leading-6 text-text-primary">
                Profile is complete
              </h1>
            </div>
            <p className="mt-3 max-w-[520px] text-sm font-medium leading-5 text-text-secondary">
              Your profile is fully setup! You can now get highly tailored matches and generate professional resumes.
            </p>
          </div>

          <div
            className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "conic-gradient(var(--color-success) 0 100%, var(--color-success-light) 100% 100%)",
            }}
            aria-label="Profile is 100 percent complete"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface text-[30px] font-semibold leading-9 text-text-primary">
              100%
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-error/20 bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-error text-[10px] font-semibold leading-none text-error">
              !
            </span>
            <h1 className="text-base font-semibold leading-6 text-text-primary">
              Profile needs attention
            </h1>
          </div>
          <p className="mt-3 max-w-[520px] text-sm font-medium leading-5 text-text-secondary">
            Complete the missing fields to improve your chance of getting tailored
            matches and generating quality resumes.
          </p>
          {missingFields.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {missingFields.map((field) => (
                <span
                  key={field}
                  className="rounded-sm bg-error/10 px-2 py-1 text-xs font-semibold leading-4 text-error"
                >
                  {field}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(var(--color-error) 0 ${completionPercentage}%, color-mix(in srgb, var(--color-error) 14%, transparent) ${completionPercentage}% 100%)`,
          }}
          aria-label={`Profile is ${completionPercentage} percent complete`}
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface text-[30px] font-semibold leading-9 text-text-primary">
            {completionPercentage}%
          </div>
        </div>
      </div>
    </section>
  );
}
