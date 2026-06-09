import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";

export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto flex max-w-[1110px] flex-col gap-6 px-4 py-12 sm:px-6">
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium leading-5 text-accent">
                Signed in
              </p>
              <h1 className="mt-3 text-[30px] font-semibold leading-9 text-text-primary">
                Welcome to JobPilot
              </h1>
              <p className="mt-3 max-w-[560px] text-sm font-medium leading-5 text-text-secondary">
                Your auth session is active. The full dashboard arrives in Phase 5;
                this checkpoint lets you verify login and logout safely.
              </p>
            </div>
            <LogoutButton />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Profile", "Set up your resume data before matching jobs.", "/profile"],
            ["Find Jobs", "Search roles once the job discovery phase is ready.", "/find-jobs"],
            ["Next", "PostHog initialization is the next foundation step.", "/dashboard"],
          ].map(([title, description, href]) => (
            <Link
              key={title}
              href={href}
              className="rounded-xl border border-border bg-surface p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold leading-6 text-text-primary">
                {title}
              </h2>
              <p className="mt-3 text-sm font-medium leading-5 text-text-secondary">
                {description}
              </p>
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
