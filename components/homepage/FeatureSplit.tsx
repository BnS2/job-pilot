import Image from "next/image";

const jobSearchFeatures = [
  {
    title: "Find jobs that actually fit",
    description:
      "Search by title and location or paste a job link. Get matched roles you can quickly scan.",
  },
  {
    title: "Know the Company Before You Apply",
    description:
      "Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence.",
  },
  {
    title: "Keep track of every application",
    description:
      "Keep a clear view of every job you've found, tailored. Your activity and progress all stay in one simple place.",
  },
];

const confidenceFeatures = [
  {
    title: "Understand your match score",
    description:
      "See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what's missing.",
  },
  {
    title: "AI-Powered Job Matching",
    description:
      "Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter.",
  },
  {
    title: "Focus on the right roles",
    description:
      "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying.",
  },
];

export function FeatureSplit() {
  return (
    <section className="border-x border-t border-border bg-surface">
      <div className="grid lg:grid-cols-2">
        <div className="flex min-h-[430px] flex-col justify-center border-b border-border py-12 lg:border-b-0 lg:border-r">
          <h2 className="px-8 text-[34px] font-bold leading-[38px] text-text-primary sm:px-12 sm:text-[40px] sm:leading-[44px]">
            Manage Your Job Search With Ease
          </h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {jobSearchFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`px-8 py-6 sm:px-12 ${
                  index === 0 ? "border-l-2 border-accent" : ""
                }`}
              >
                <h3 className="text-base font-semibold leading-6 text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-[430px] text-sm font-medium leading-6 text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center bg-surface-muted px-8 py-12 sm:px-12">
          <Image
            src="/images/jobs-lists.png"
            alt="Matched jobs list with company, score, salary, and source columns"
            width={2364}
            height={1778}
            className="h-auto w-full max-w-[560px]"
          />
        </div>
      </div>

      <div className="landing-section-texture h-16 border-y border-border" />

      <div className="grid lg:grid-cols-2">
        <div className="flex items-center justify-center bg-surface-muted px-8 py-12 sm:px-12">
          <Image
            src="/images/agnet-log.png"
            alt="Agent log showing matching and tailoring progress"
            width={2144}
            height={1656}
            className="h-auto w-full max-w-[430px]"
          />
        </div>

        <div className="flex min-h-[430px] flex-col justify-center border-t border-border py-12 lg:border-l lg:border-t-0">
          <h2 className="px-8 text-[34px] font-bold leading-[38px] text-text-primary sm:px-12 sm:text-[40px] sm:leading-[44px]">
            Apply With More Confidence, Every Time
          </h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {confidenceFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`px-8 py-6 sm:px-12 ${
                  index === 1 ? "border-l-2 border-success" : ""
                }`}
              >
                <h3 className="text-base font-semibold leading-6 text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-[430px] text-sm font-medium leading-6 text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
