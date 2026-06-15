import { Navbar } from "@/components/layout/Navbar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar activePath="/find-jobs" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[840px] flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="h-4 w-28 rounded-full bg-border-light" />
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-surface-secondary" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="h-6 w-64 max-w-full rounded-full bg-border-light" />
                <div className="h-10 w-20 shrink-0 rounded-md bg-surface-secondary" />
              </div>
              <div className="h-4 w-40 rounded-full bg-border-light" />
            </div>
          </div>
        </section>
        {Array.from({ length: 4 }, (_, index) => (
          <section className="rounded-xl border border-border bg-surface p-6 shadow-sm" key={index}>
            <div className="h-5 w-44 rounded-full bg-border-light" />
            <div className="mt-5 space-y-3">
              <div className="h-4 w-full rounded-full bg-border-light" />
              <div className="h-4 w-5/6 rounded-full bg-border-light" />
              <div className="h-4 w-2/3 rounded-full bg-border-light" />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
