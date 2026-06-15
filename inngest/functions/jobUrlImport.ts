import { NonRetriableError } from "inngest";

import { importJobFromUrl } from "@/agent/urlImport";
import { inngest } from "@/inngest/client";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import type { ProfileData } from "@/lib/utils";

async function loadProfile(userId: string): Promise<ProfileData | null> {
  const insforge = createInsforgeAdmin();
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    console.error("[inngest/jobUrlImport] Failed to load profile:", error);
    return null;
  }

  return data as ProfileData;
}

export const jobUrlImport = inngest.createFunction(
  {
    id: "job-url-import",
    name: "Job URL Import",
    retries: 1,
    triggers: { event: "job-url-import.requested" },
  },
  async ({ event, step }) => {
    const { userId, url, runId } = event.data;
    const profile = await step.run("load-profile", async () => {
      return loadProfile(userId);
    });

    if (!profile) {
      throw new Error("Profile not found for URL import.");
    }

    return step.run("import-job-url", async () => {
      const result = await importJobFromUrl({
        userId,
        url,
        profile,
        runId,
      });

      if (!result.success) {
        if (result.code !== "temporary_unavailable") {
          throw new NonRetriableError(result.error);
        }

        throw new Error(result.error);
      }

      return result.data;
    });
  },
);
