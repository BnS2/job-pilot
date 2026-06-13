import { Navbar } from "@/components/layout/Navbar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar activePath="/find-jobs" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-12">
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <div className="h-4 w-20 rounded-full bg-border-light" />
              <div className="mt-2 h-12 rounded-md border border-border bg-surface-secondary" />
            </div>
            <div>
              <div className="h-4 w-20 rounded-full bg-border-light" />
              <div className="mt-2 h-12 rounded-md border border-border bg-surface-secondary" />
            </div>
            <div className="h-12 min-w-36 rounded-md bg-accent-muted" />
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border bg-surface-secondary px-8 py-5">
            <div className="h-4 w-36 rounded-full bg-border-light" />
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div
              className="grid min-h-20 grid-cols-[2fr_2fr_1fr] items-center gap-6 border-b border-border px-8 py-5 last:border-b-0"
              key={index}
            >
              <div className="h-4 w-40 rounded-full bg-border-light" />
              <div className="h-4 w-52 rounded-full bg-border-light" />
              <div className="h-2 w-32 rounded-full bg-border-light" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
