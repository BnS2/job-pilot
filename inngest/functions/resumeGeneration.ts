import { renderToBuffer } from "@react-pdf/renderer";

import {
  completeAgentRunWithResult,
  failAgentRun,
  logAgentMessage,
} from "@/agent/logs";
import { generateResumeFromProfile } from "@/agent/resumeGenerator";
import { createResumeDocument } from "@/components/profile/ResumeDocument";
import { inngest } from "@/inngest/client";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import type { ProfileData } from "@/lib/utils";

type GeneratedResumeMetadata = {
  resumePdfKey: string;
  resumePdfUrl: string;
};

async function saveGeneratedResume(
  userId: string,
  profile: ProfileData,
  pdfBuffer: Buffer,
): Promise<GeneratedResumeMetadata | null> {
  const insforge = createInsforgeAdmin();
  const resumeKey = `${userId}/resume.pdf`;
  const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], {
    type: "application/pdf",
  });

  const { data: uploadData, error: uploadError } = await insforge.storage
    .from("resumes")
    .upload(resumeKey, pdfBlob);

  if (uploadError || !uploadData) {
    console.error("[inngest/resumeGeneration] Upload error:", uploadError);
    return null;
  }

  const { data: updatedProfile, error: updateError } = await insforge.database
    .from("profiles")
    .update({
      resume_pdf_url: uploadData.url,
      resume_pdf_key: uploadData.key,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("resume_pdf_url, resume_pdf_key")
    .maybeSingle();

  if (updateError || !updatedProfile) {
    console.error("[inngest/resumeGeneration] Profile update error:", updateError);
    const { error: cleanupError } = await insforge.storage
      .from("resumes")
      .remove(uploadData.key);

    if (cleanupError) {
      console.error("[inngest/resumeGeneration] Generated resume cleanup error:", cleanupError);
    }

    return null;
  }

  if (profile.resume_pdf_key && profile.resume_pdf_key !== uploadData.key) {
    const { error: removeError } = await insforge.storage
      .from("resumes")
      .remove(profile.resume_pdf_key);

    if (removeError) {
      console.error("[inngest/resumeGeneration] Previous resume removal error:", removeError);
    }
  }

  return {
    resumePdfUrl: String(updatedProfile.resume_pdf_url),
    resumePdfKey: String(updatedProfile.resume_pdf_key),
  };
}

export const resumeGeneration = inngest.createFunction(
  {
    id: "resume-generation",
    name: "Resume Generation",
    retries: 1,
    triggers: { event: "resume-generation.requested" },
  },
  async ({ event, step }) => {
    const userId = String(event.data.userId);
    const runId = String(event.data.runId);

    try {
      const profile = await step.run("load-profile", async () => {
        const insforge = createInsforgeAdmin();
        const { data, error } = await insforge.database
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("[inngest/resumeGeneration] Profile fetch error:", error);
          return null;
        }

        // InsForge rows are untyped at this boundary; downstream profile validation handles missing fields.
        return data as ProfileData | null;
      });

      if (!profile) {
        const message = "Save your profile before generating a resume.";
        await step.run("mark-missing-profile-failed", async () => {
          await logAgentMessage(
            userId,
            runId,
            "error",
            "Resume generation failed because the saved profile could not be loaded.",
          );
          await failAgentRun(userId, runId, message);
        });

        return { success: false, error: message };
      }

      await step.run("log-generation-started", async () => {
        await logAgentMessage(
          userId,
          runId,
          "info",
          "Resume generation started from saved profile data.",
        );
      });

      const generation = await step.run("generate-resume-content", async () => {
        return generateResumeFromProfile(profile, { userId, runId });
      });

      if (!generation.success) {
        await step.run("mark-generation-failed", async () => {
          await failAgentRun(userId, runId, generation.error);
        });

        return { success: false, error: generation.error };
      }

      const metadata = await step.run("render-upload-and-save-resume", async () => {
        const pdfBuffer = await renderToBuffer(
          createResumeDocument({
            profile,
            resume: generation.resume,
          }),
        );

        return saveGeneratedResume(userId, profile, pdfBuffer);
      });

      if (!metadata) {
        const message = "Failed to upload generated resume.";
        await step.run("mark-save-failed", async () => {
          await logAgentMessage(userId, runId, "error", "Generated resume PDF upload failed.");
          await failAgentRun(userId, runId, message);
        });

        return { success: false, error: message };
      }

      await step.run("save-generation-result", async () => {
        await logAgentMessage(userId, runId, "success", "Resume PDF generated and saved.");
        await completeAgentRunWithResult(userId, runId, metadata);
      });

      return { success: true, ...metadata };
    } catch (error) {
      console.error("[inngest/resumeGeneration] Resume generation failed:", error);
      await step.run("mark-system-failed", async () => {
        await logAgentMessage(
          userId,
          runId,
          "error",
          "Resume generation failed because of an unexpected system error.",
        );
        await failAgentRun(userId, runId, "Resume generation failed. Please try again.");
      });

      return {
        success: false,
        error: "Resume generation failed. Please try again.",
      };
    }
  },
);
