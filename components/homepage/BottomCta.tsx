import Link from "next/link";

export function BottomCta() {
  return (
    <section className="border-x border-t border-border">
      <div className="landing-section-texture h-16 border-b border-border" />
      <div className="landing-soft-gradient px-4 py-20 text-center sm:px-6">
        <h2 className="mx-auto max-w-[650px] text-[36px] font-bold leading-[40px] text-text-primary sm:text-[48px] sm:leading-[52px]">
          Your next job search can feel a lot less overwhelming
        </h2>
        <p className="mt-6 text-sm font-medium leading-6 text-text-secondary">
          Set up your profile, upload your resume, and start finding matches in
          minutes.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-md bg-overlay px-6 py-3 text-sm font-medium text-accent-foreground"
          >
            Get Started <span aria-hidden="true">&gt;</span>
          </Link>
          <Link
            href="/find-jobs"
            className="rounded-md border border-border bg-surface px-6 py-3 text-sm font-medium text-text-primary"
          >
            Find Your First Match
          </Link>
        </div>
      </div>
      <div className="landing-section-texture h-16 border-t border-border" />
    </section>
  );
}
