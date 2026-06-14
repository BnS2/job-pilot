import Link from "next/link";

export function ProfileIncompleteBanner() {
  return (
    <section className="rounded-xl border border-warning/20 bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold leading-6 text-text-primary">
            Complete your profile to improve job matching
          </p>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-5 text-text-secondary">
            Add the missing resume details before relying on match scores and
            company research prep.
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium leading-5 text-accent-foreground"
        >
          Finish Profile
        </Link>
      </div>
    </section>
  );
}
