import Image from "next/image";

export function Testimonial() {
  return (
    <section className="border-x border-t border-border bg-surface">
      <div className="landing-section-texture h-16 border-b border-border" />
      <div className="px-4 py-20 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
          Success Stories
        </p>
        <blockquote className="mx-auto mt-6 max-w-[700px] text-[26px] font-semibold leading-[36px] text-text-dark sm:text-[30px] sm:leading-[42px]">
          &quot;I used to spend my evenings copy-pasting resumes. Now I open my
          dashboard to see interviews waiting. It feels like cheating. Had 3
          offers on the table simultaneously.&quot;
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Image
            src="/images/user-icon.png"
            alt="Tom Wilson"
            width={40}
            height={40}
            className="rounded-sm"
          />
          <div className="text-left">
            <p className="text-sm font-semibold leading-5 text-text-primary">
              Tom Wilson
            </p>
            <p className="text-xs font-medium leading-4 text-text-secondary">
              Junior Developer
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
