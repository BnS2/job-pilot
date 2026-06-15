import { NonRetriableError } from "inngest";
import { z } from "zod";

import { importJobFromUrl } from "@/agent/urlImport";
import { inngest } from "@/inngest/client";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import type { ProfileData } from "@/lib/utils";

const jobUrlImportEventSchema = z.object({
  pageText: z.string().trim().min(180).max(18_000).optional(),
  runId: z.string().uuid(),
  url: z.string().trim().min(8).max(2000),
  userId: z.string().uuid(),
});

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
    const parsedEvent = jobUrlImportEventSchema.safeParse(event.data);

    if (!parsedEvent.success) {
      throw new NonRetriableError("Invalid URL import event payload.");
    }

    const eventData = parsedEvent.data;
    const { userId, url, runId, pageText } = eventData;
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
        pageText,
        profile,
        runId,
      });

      if (!result.success) {
        if (result.code === "temporary_unavailable") {
          throw new Error(result.error);
        }

        return result;
      }

      return result.data;
    });
  },
);
