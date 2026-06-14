import {
  completeAgentRunWithResult,
  failAgentRun,
  logAgentMessage,
} from "@/agent/logs";
import { extractProfileFromResumeText } from "@/agent/extractor";
import { extractResumeTextFromPdf } from "@/agent/resumeText";
import { inngest } from "@/inngest/client";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

type ProfileResumeRecord = {
  resume_pdf_key?: string | null;
};

function getFailureStatus(code: string): number {
  return code === "temporary_unavailable" ? 503 : 422;
}

export const resumeExtraction = inngest.createFunction(
  {
    id: "resume-extraction",
    name: "Resume Extraction",
    retries: 1,
    triggers: { event: "resume-extraction.requested" },
  },
  async ({ event, step }) => {
    const userId = String(event.data.userId);
    const runId = String(event.data.runId);

    try {
      const profile = await step.run("load-profile-resume", async () => {
        const insforge = createInsforgeAdmin();
        const { data, error } = await insforge.database
          .from("profiles")
          .select("resume_pdf_key")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("[inngest/resumeExtraction] Profile fetch error:", error);
          return null;
        }

        // InsForge rows are untyped at this boundary; the selected column is narrowed before use.
        return data as ProfileResumeRecord | null;
      });

      if (!profile?.resume_pdf_key) {
        const message = "Upload a resume before extracting profile details.";
        await step.run("mark-missing-resume-failed", async () => {
          await logAgentMessage(
            userId,
            runId,
            "error",
            "Resume extraction failed because no resume file is attached to the profile.",
          );
          await failAgentRun(userId, runId, message);
        });

        return { success: false, error: message };
      }

      const resumeText = await step.run("download-and-extract-resume-text", async () => {
        const insforge = createInsforgeAdmin();
        const { data, error } = await insforge.storage
          .from("resumes")
          .download(profile.resume_pdf_key ?? "");

        if (error || !data) {
          console.error("[inngest/resumeExtraction] Download error:", error);
          return null;
        }

        return extractResumeTextFromPdf(Buffer.from(await data.arrayBuffer()));
      });

      if (!resumeText) {
        const message = "Failed to download resume.";
        await step.run("mark-download-failed", async () => {
          await logAgentMessage(
            userId,
            runId,
            "error",
            "Resume extraction failed because the stored resume could not be downloaded.",
          );
          await failAgentRun(userId, runId, message);
        });

        return { success: false, error: message };
      }

      await step.run("log-text-extractor", async () => {
        await logAgentMessage(
          userId,
          runId,
          "info",
          `Resume text extracted with ${resumeText.source}.`,
        );
      });

      const extraction = await step.run("extract-profile-fields", async () => {
        return extractProfileFromResumeText(resumeText.text, { userId, runId });
      });

      if (!extraction.success) {
        await step.run("mark-extraction-failed", async () => {
          await failAgentRun(userId, runId, extraction.error);
        });

        return {
          success: false,
          error: extraction.error,
          status: getFailureStatus(extraction.code),
        };
      }

      await step.run("save-extracted-profile-result", async () => {
        await logAgentMessage(
          userId,
          runId,
          "success",
          "Resume extraction completed and returned profile fields for review.",
        );
        await completeAgentRunWithResult(userId, runId, {
          profile: extraction.profile,
          textExtractor: resumeText.source,
        });
      });

      return {
        success: true,
        profile: extraction.profile,
        textExtractor: resumeText.source,
      };
    } catch (error) {
      console.error("[inngest/resumeExtraction] Resume extraction failed:", error);
      await step.run("mark-system-failed", async () => {
        await logAgentMessage(
          userId,
          runId,
          "error",
          "Resume extraction failed because of an unexpected system error.",
        );
        await failAgentRun(userId, runId, "Resume extraction failed. Please try again.");
      });

      return {
        success: false,
        error: "Resume extraction failed. Please try again.",
      };
    }
  },
);
