import { redirect } from "next/navigation";

import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const insforge = await createInsforgeServer();
  const { data, error } = await insforge.auth.getCurrentUser();

  if (error) {
    console.error("[login] Auth lookup error:", error);
  }

  if (data.user) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const authError = firstParam(query.error);

  return (
    <div className="min-h-screen bg-background">
      <Navbar showCta={false} />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1110px] items-center justify-center px-4 py-12 sm:px-6">
        <section className="grid w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm lg:grid-cols-[1.15fr_1fr]">
          <div className="landing-soft-gradient border-b border-border p-6 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium leading-4 text-text-secondary">
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-accent"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 3.75 5.75 6.5v4.75c0 4.15 2.65 7.9 6.25 9 3.6-1.1 6.25-4.85 6.25-9V6.5L12 3.75Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                <path
                  d="m9.5 12 1.75 1.75 3.5-4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
              OAuth secured by InsForge
            </div>

            <h1 className="mt-10 max-w-[620px] text-[40px] font-semibold leading-[44px] text-text-primary sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[68px]">
              Sign in and let the agent prep your next application.
            </h1>
            <p className="mt-8 max-w-[560px] text-base font-medium leading-7 text-text-secondary">
              Connect with Google or GitHub to start building your profile,
              matching jobs, and creating tailored application materials.
            </p>
            <p className="mt-14 text-sm font-medium leading-5 text-text-secondary lg:mt-20">
              New users are routed to profile setup after sign-in.
            </p>
          </div>

          <div className="flex items-center p-6 sm:p-10 lg:p-12">
            <div className="w-full">
              <p className="text-sm font-medium leading-5 text-text-secondary">
                Welcome to
              </p>
              <h2 className="mt-3 text-[30px] font-semibold leading-9 text-text-primary">
                JobPilot
              </h2>
              <p className="mt-6 text-sm font-medium leading-5 text-text-secondary">
                Choose your preferred provider to continue.
              </p>

              {authError === "oauth" ? (
                <p className="mt-6 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm font-medium leading-5 text-error">
                  We couldn&apos;t complete sign-in. Please try a provider again.
                </p>
              ) : null}

              <OAuthButtons />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
