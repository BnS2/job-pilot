import { Inngest } from "inngest";

export const inngestEventKey = process.env.INNGEST_EVENT_KEY;

export const isInngestDev =
  process.env.INNGEST_DEV === "1" ||
  process.env.INNGEST_DEV?.startsWith("http://") === true ||
  process.env.INNGEST_DEV?.startsWith("https://") === true ||
  (process.env.NODE_ENV !== "production" && !inngestEventKey);

export type JobPilotInngestEvents = {
  "company-research.requested": {
    data: {
      agentRunId: string | null;
      jobId: string;
      userId: string;
    };
  };
  "job-discovery.requested": {
    data: {
      jobTitle: string;
      location: string;
      runId: string | null;
      userId: string;
      mode?: "manual_search" | "profile_best_match";
    };
  };
  "resume-extraction.requested": {
    data: {
      runId: string;
      userId: string;
    };
  };
  "resume-generation.requested": {
    data: {
      runId: string;
      userId: string;
    };
  };
};

export const inngest = new Inngest({
  id: "job-pilot",
  eventKey: inngestEventKey,
  isDev: isInngestDev,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
