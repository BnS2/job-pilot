import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="border-x border-border">
      <div className="landing-soft-gradient flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <h1 className="max-w-[650px] text-[40px] font-bold leading-[44px] text-text-primary sm:text-[56px] sm:leading-[60px]">
          Job hunting is hard. Your tools shouldn&apos;t be.
        </h1>
        <p className="mt-6 max-w-[560px] text-base font-medium leading-6 text-text-secondary">
          Stop applying blind. JobPilot finds the jobs, researches the
          companies, and gives you everything you need to stand out.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

      <div className="border-t border-border bg-surface-tertiary px-4 py-12 sm:px-12">
        <div className="mx-auto max-w-[920px]">
          <Image
            src="/images/dashboard-demo.png"
            alt="Dashboard preview with stats, recent activity, and company research chart"
            width={4788}
            height={2416}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
