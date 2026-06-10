"use client";

import Link from "next/link";

import { capturePostHogEvent } from "@/lib/posthog-client";

type HomepageCtaButtonsProps = {
  source: "hero" | "bottom_cta";
};

export function HomepageCtaButtons({ source }: HomepageCtaButtonsProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link
        href="/login"
        className="rounded-md bg-overlay px-6 py-3 text-sm font-medium text-accent-foreground"
        onClick={() => capturePostHogEvent("get_started_clicked", { source })}
      >
        Get Started <span aria-hidden="true">&gt;</span>
      </Link>
      <Link
        href="/find-jobs"
        className="rounded-md border border-border bg-surface px-6 py-3 text-sm font-medium text-text-primary"
        onClick={() => capturePostHogEvent("find_jobs_clicked", { source })}
      >
        Find Your First Match
      </Link>
    </div>
  );
}
