import { HomepageCtaButtons } from "@/components/homepage/HomepageCtaButtons";

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
        <div className="flex justify-center">
          <HomepageCtaButtons source="bottom_cta" />
        </div>
      </div>
      <div className="landing-section-texture h-16 border-t border-border" />
    </section>
  );
}
