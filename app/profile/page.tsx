import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateCompleteness } from "@/lib/utils";

export default async function ProfilePage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login?next=%2Fprofile");
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthSessionGuard />
      <Navbar activePath="/profile" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-6">
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileContent email={data.user.email} userId={data.user.id} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="h-5 w-44 rounded-full bg-border-light" />
            <div className="h-4 w-80 max-w-full rounded-full bg-border-light" />
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="h-6 w-20 rounded-sm bg-border-light" />
              <div className="h-6 w-24 rounded-sm bg-border-light" />
              <div className="h-6 w-28 rounded-sm bg-border-light" />
            </div>
          </div>
          <div className="h-32 w-32 shrink-0 rounded-full bg-surface-secondary" />
        </div>
      </section>
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="h-5 w-36 rounded-full bg-border-light" />
        <div className="mt-6 h-32 rounded-md border border-border bg-surface-secondary" />
      </section>
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="h-5 w-44 rounded-full bg-border-light" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="h-12 rounded-md border border-border bg-surface-secondary" key={index} />
          ))}
        </div>
      </section>
    </>
  );
}

type ProfileContentProps = {
  email?: string | null;
  userId: string;
};

async function ProfileContent({ email, userId }: ProfileContentProps) {
  const insforge = await createInsforgeServer();
  const { data: dbProfile, error: dbError } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (dbError) {
    console.error("[app/profile/page] DB error fetching profile:", dbError);
  }

  const baseProfile = dbProfile ?? {
    id: userId,
    email,
    full_name: "",
    phone: "",
    location: "",
    current_title: "",
    experience_level: "junior",
    years_experience: 0,
    skills: [],
    industries: [],
    work_experience: [],
    education: {},
    job_titles_seeking: [],
    remote_preference: "any",
    preferred_locations: [],
    salary_expectation: "",
    cover_letter_tone: "",
    linkedin_url: "",
    portfolio_url: "",
    work_authorization: "citizen",
    is_complete: false,
  };
  const profile = {
    ...baseProfile,
    is_complete: calculateCompleteness(baseProfile).isComplete,
  };

  return (
    <>
      <ProfileClient profile={profile} />
    </>
  );
}
