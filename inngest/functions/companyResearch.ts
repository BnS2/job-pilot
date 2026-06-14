import {
  loadCompanyResearchContext,
  logResearchMessage,
  resolveEmployerUrls,
  runWebResearch,
  saveCompanyResearchFailure,
  saveCompanyResearchSuccess,
  synthesizeDossier,
} from "@/agent/research";
import { inngest } from "@/inngest/client";

export const companyResearch = inngest.createFunction(
  {
    id: "company-research",
    name: "Company Research",
    retries: 2,
    triggers: { event: "company-research.requested" },
  },
  async ({ event, step }) => {
    const jobId = String(event.data.jobId);
    const userId = String(event.data.userId);
    const runId =
      typeof event.data.agentRunId === "string" ? event.data.agentRunId : null;

    try {
      const context = await step.run("load-research-context", async () => {
        return loadCompanyResearchContext(jobId, userId, runId);
      });

      if (!context.success) {
        return context;
      }

      if (context.cachedDossier) {
        return {
          success: true,
          dossier: context.cachedDossier,
          cached: true,
        };
      }

      await step.run("log-research-started", async () => {
        await logResearchMessage(
          userId,
          runId,
          "info",
          `Starting company research for ${context.job.company}.`,
          jobId,
        );
      });

      const employerUrls = await step.run("resolve-employer-url", async () => {
        return resolveEmployerUrls(context.job);
      });

      let webResearch: { researchText: string; sourceUrls: string[] } = {
        researchText: "",
        sourceUrls: [],
      };

      try {
        webResearch = await step.run("run-gemini-web-research", async () => {
          return runWebResearch(context.job, employerUrls);
        });
      } catch (error) {
        console.error("[inngest/companyResearch] Web research failed:", error);
        await step.run("log-web-research-warning", async () => {
          await logResearchMessage(
            userId,
            runId,
            "warning",
            `Web research was thin for ${context.job.company}; synthesizing from job and profile data.`,
            jobId,
          );
        });
      }

      const dossier = await step.run("synthesize-dossier", async () => {
        return synthesizeDossier({
          job: context.job,
          profile: context.profile,
          researchText: webResearch.researchText,
          sourceUrls: webResearch.sourceUrls,
        });
      });

      await step.run("save-dossier", async () => {
        await saveCompanyResearchSuccess({
          dossier,
          job: context.job,
          jobId,
          runId,
          userId,
        });
      });

      return {
        success: true,
        dossier,
        cached: false,
      };
    } catch (error) {
      console.error("[inngest/companyResearch] Company research failed:", error);
      return step.run("save-research-failure", async () => {
        return saveCompanyResearchFailure({
          error,
          jobId,
          runId,
          userId,
        });
      });
    }
  },
);
