import { Navbar } from "@/components/layout/Navbar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar activePath="/profile" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:items-start">
          <section className="order-2 rounded-xl border border-border bg-surface p-6 shadow-sm xl:order-1">
            <div className="h-5 w-40 rounded-full bg-border-light" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 12 }, (_, index) => (
                <div className="h-12 rounded-md border border-border bg-surface-secondary" key={index} />
              ))}
            </div>
          </section>
          <div className="order-1 flex flex-col gap-6 xl:order-2">
            <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="h-5 w-48 rounded-full bg-border-light" />
              <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-border-light" />
              <div className="mt-6 h-32 rounded-md border border-border bg-surface-secondary" />
            </section>
            <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="h-5 w-36 rounded-full bg-border-light" />
              <div className="mt-6 h-32 rounded-md border border-border bg-surface-secondary" />
              <div className="mt-6 h-10 rounded-md bg-accent-muted" />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
