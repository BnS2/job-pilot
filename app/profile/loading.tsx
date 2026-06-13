import { Navbar } from "@/components/layout/Navbar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar activePath="/profile" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[920px] flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="h-5 w-48 rounded-full bg-border-light" />
          <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-border-light" />
          <div className="mt-6 h-32 rounded-md border border-border bg-surface-secondary" />
        </section>
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="h-5 w-40 rounded-full bg-border-light" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, index) => (
              <div className="h-12 rounded-md border border-border bg-surface-secondary" key={index} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
