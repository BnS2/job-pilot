import Image from "next/image";

import { HomepageCtaButtons } from "@/components/homepage/HomepageCtaButtons";

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
        <HomepageCtaButtons source="hero" />
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
