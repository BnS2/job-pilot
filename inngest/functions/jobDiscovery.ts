import { discoverJobsFromAdzuna, discoverJobsFromProfile } from "@/agent/adzuna";
import { finishAgentRun, logAgentMessage } from "@/agent/logs";
import { inngest } from "@/inngest/client";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import type { ProfileData } from "@/lib/utils";

type ProfileLoadResult =
  | { success: true; profile: ProfileData }
  | { success: false; error: string };

async function loadProfile(userId: string): Promise<ProfileLoadResult> {
  const insforge = createInsforgeAdmin();
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    console.error("[inngest/jobDiscovery] Failed to load profile:", error);
    return { success: false, error: "Profile not found." };
  }

  return { success: true, profile: data as ProfileData };
}

export const jobDiscovery = inngest.createFunction(
  {
    id: "job-discovery",
    name: "Job Discovery",
    retries: 1,
    triggers: { event: "job-discovery.requested" },
  },
  async ({ event, step }) => {
    const userId = String(event.data.userId);
    const jobTitle = String(event.data.jobTitle);
    const location = String(event.data.location ?? "");
    const runId = typeof event.data.runId === "string" ? event.data.runId : null;

    try {
      const profileResult = await step.run("load-profile", async () => {
        return loadProfile(userId);
      });

      if (!profileResult.success) {
        await step.run("mark-profile-load-failed", async () => {
          await logAgentMessage(
            userId,
            runId,
            "error",
            "Job discovery failed because the profile could not be loaded.",
          );
          await finishAgentRun(userId, runId, "failed");
        });

        return profileResult;
      }

      return step.run("discover-and-score-jobs", async () => {
        const mode = event.data.mode === "profile_best_match" ? "profile_best_match" : "manual_search";

        if (mode === "profile_best_match") {
          return discoverJobsFromProfile({
            userId,
            requestedLocation: location,
            profile: profileResult.profile,
            runId,
          });
        }

        return discoverJobsFromAdzuna({
          userId,
          jobTitle,
          requestedLocation: location,
          profile: profileResult.profile,
          runId,
        });
      });
    } catch (error) {
      console.error("[inngest/jobDiscovery] Job discovery failed:", error);
      await step.run("mark-discovery-failed", async () => {
        await logAgentMessage(
          userId,
          runId,
          "error",
          "Job discovery failed while running in the background.",
        );
        await finishAgentRun(userId, runId, "failed");
      });

      return {
        success: false,
        error: "Failed to find jobs. Please try again in a moment.",
      };
    }
  },
);
