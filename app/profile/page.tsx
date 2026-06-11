import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateCompleteness } from "@/lib/utils";

export default async function ProfilePage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: dbProfile, error: dbError } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  if (dbError) {
    console.error("[app/profile/page] DB error fetching profile:", dbError);
  }

  // Calculate completion and missing fields dynamically
  const profile = dbProfile
    ? {
        ...dbProfile,
        ...calculateCompleteness(dbProfile),
      }
    : {
        id: data.user.id,
        email: data.user.email,
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
        completionPercentage: 0,
        missingFields: [
          "NAME",
          "PHONE",
          "LOCATION",
          "WORK_AUTH",
          "JOB_TITLE",
          "EXPERIENCE_LEVEL",
          "YEARS_EXPERIENCE",
          "SKILLS",
          "EDUCATION",
          "JOB_TITLES_SEEKING",
          "REMOTE_PREFERENCE",
        ],
      };

  return (
    <div className="min-h-screen bg-background">
      <Navbar activePath="/profile" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[920px] flex-col gap-8 px-4 py-8 sm:px-6">
        <CompletionIndicator
          isComplete={profile.is_complete}
          completionPercentage={profile.completionPercentage}
          missingFields={profile.missingFields}
        />
        <ProfileClient profile={profile} />
      </main>
    </div>
  );
}
