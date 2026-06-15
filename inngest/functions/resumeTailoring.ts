import { renderToBuffer } from "@react-pdf/renderer";

import {
  completeAgentRunWithResult,
  failAgentRun,
  logAgentMessage,
} from "@/agent/logs";
import {
  tailorResumeForJob,
  tailoredResumeNotesSchema,
  type TailoredResumeJobContext,
  type TailoredResumeNotes,
} from "@/agent/resumeTailor";
import { createResumeDocument } from "@/components/profile/ResumeDocument";
import { inngest } from "@/inngest/client";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import type { ProfileData } from "@/lib/utils";

type TailoredResumeMetadata = {
  tailoredResumeKey: string;
  tailoredResumeUrl: string;
  tailoredResumeGeneratedAt: string;
  tailoredResumeNotes: TailoredResumeNotes;
};

type LoadedTailoringContext = {
  profile: ProfileData;
  job: TailoredResumeJobContext;
  previousKey: string | null;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function loadTailoringContext(
  userId: string,
  jobId: string,
): Promise<LoadedTailoringContext | null> {
  const insforge = createInsforgeAdmin();
  const { data: profile, error: profileError } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[inngest/resumeTailoring] Profile fetch error:", profileError);
    return null;
  }

  const { data: job, error: jobError } = await insforge.database
    .from("jobs")
    .select(
      "id,company,title,about_role,responsibilities,requirements,nice_to_have,benefits,about_company,match_reason,matched_skills,missing_skills,company_research,tailored_resume_key",
    )
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (jobError || !job?.id) {
    console.error("[inngest/resumeTailoring] Job fetch error:", jobError);
    return null;
  }

  return {
    profile: profile as ProfileData,
    previousKey: stringOrNull(job.tailored_resume_key),
    job: {
      id: String(job.id),
      company: stringOrNull(job.company),
      title: stringOrNull(job.title),
      aboutRole: stringOrNull(job.about_role),
      responsibilities: toStringArray(job.responsibilities),
      requirements: toStringArray(job.requirements),
      niceToHave: toStringArray(job.nice_to_have),
      benefits: toStringArray(job.benefits),
      aboutCompany: stringOrNull(job.about_company),
      matchReason: stringOrNull(job.match_reason),
      matchedSkills: toStringArray(job.matched_skills),
      missingSkills: toStringArray(job.missing_skills),
      companyResearch: job.company_research,
    },
  };
}

async function markTailoringFailed(
  userId: string,
  jobId: string,
  runId: string,
  message: string,
): Promise<void> {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("jobs")
    .update({
      tailored_resume_error: message,
      tailored_resume_status: "failed",
      tailored_resume_run_id: runId,
    })
    .eq("id", jobId)
    .eq("user_id", userId);

  if (error) {
    console.error("[inngest/resumeTailoring] Failed to mark job failed:", error);
  }
}

async function saveTailoredResume(
  userId: string,
  jobId: string,
  previousKey: string | null,
  notes: TailoredResumeNotes,
  pdfBuffer: Buffer,
): Promise<TailoredResumeMetadata | null> {
  const insforge = createInsforgeAdmin();
  const resumeKey = `${userId}/jobs/${jobId}/tailored-resume.pdf`;
  const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], {
    type: "application/pdf",
  });

  const { data: uploadData, error: uploadError } = await insforge.storage
    .from("resumes")
    .upload(resumeKey, pdfBlob);

  if (uploadError || !uploadData) {
    console.error("[inngest/resumeTailoring] Upload error:", uploadError);
    return null;
  }

  const generatedAt = new Date().toISOString();
  const parsedNotes = tailoredResumeNotesSchema.parse(notes);
  const { data: updatedJob, error: updateError } = await insforge.database
    .from("jobs")
    .update({
      tailored_resume_url: uploadData.url,
      tailored_resume_key: uploadData.key,
      tailored_resume_status: "completed",
      tailored_resume_error: null,
      tailored_resume_notes: parsedNotes,
      tailored_resume_generated_at: generatedAt,
    })
    .eq("id", jobId)
    .eq("user_id", userId)
    .select("tailored_resume_url,tailored_resume_key,tailored_resume_generated_at,tailored_resume_notes")
    .maybeSingle();

  if (updateError || !updatedJob) {
    console.error("[inngest/resumeTailoring] Job update error:", updateError);
    const { error: cleanupError } = await insforge.storage
      .from("resumes")
      .remove(uploadData.key);

    if (cleanupError) {
      console.error("[inngest/resumeTailoring] Tailored resume cleanup error:", cleanupError);
    }

    return null;
  }

  if (previousKey && previousKey !== uploadData.key) {
    const { error: removeError } = await insforge.storage
      .from("resumes")
      .remove(previousKey);

    if (removeError) {
      console.error("[inngest/resumeTailoring] Previous tailored resume removal error:", removeError);
    }
  }

  const savedNotes = tailoredResumeNotesSchema.safeParse(updatedJob.tailored_resume_notes);

  return {
    tailoredResumeUrl: String(updatedJob.tailored_resume_url),
    tailoredResumeKey: String(updatedJob.tailored_resume_key),
    tailoredResumeGeneratedAt: String(updatedJob.tailored_resume_generated_at),
    tailoredResumeNotes: savedNotes.success ? savedNotes.data : parsedNotes,
  };
}

export const resumeTailoring = inngest.createFunction(
  {
    id: "resume-tailoring",
    name: "Resume Tailoring",
    retries: 1,
    triggers: { event: "resume-tailoring.requested" },
  },
  async ({ event, step }) => {
    const userId = String(event.data.userId);
    const jobId = String(event.data.jobId);
    const runId = String(event.data.runId);

    try {
      const context = await step.run("load-tailoring-context", async () => {
        return loadTailoringContext(userId, jobId);
      });

      if (!context) {
        const message = "Could not load the saved profile and job details.";
        await step.run("mark-missing-context-failed", async () => {
          await logAgentMessage(userId, runId, "error", message, jobId);
          await failAgentRun(userId, runId, message);
          await markTailoringFailed(userId, jobId, runId, message);
        });

        return { success: false, error: message };
      }

      await step.run("log-tailoring-started", async () => {
        await logAgentMessage(
          userId,
          runId,
          "info",
          "Resume tailoring started for this saved job.",
          jobId,
        );
      });

      const tailoring = await step.run("generate-tailored-resume-content", async () => {
        return tailorResumeForJob(context.profile, context.job, { userId, runId, jobId });
      });

      if (!tailoring.success) {
        await step.run("mark-generation-failed", async () => {
          await failAgentRun(userId, runId, tailoring.error);
          await markTailoringFailed(userId, jobId, runId, tailoring.error);
        });

        return { success: false, error: tailoring.error };
      }

      const metadata = await step.run("render-upload-and-save-tailored-resume", async () => {
        const pdfBuffer = await renderToBuffer(
          createResumeDocument({
            profile: context.profile,
            resume: tailoring.resume,
          }),
        );

        return saveTailoredResume(
          userId,
          jobId,
          context.previousKey,
          tailoring.notes,
          pdfBuffer,
        );
      });

      if (!metadata) {
        const message = "Failed to upload tailored resume.";
        await step.run("mark-save-failed", async () => {
          await logAgentMessage(userId, runId, "error", message, jobId);
          await failAgentRun(userId, runId, message);
          await markTailoringFailed(userId, jobId, runId, message);
        });

        return { success: false, error: message };
      }

      await step.run("save-tailoring-result", async () => {
        await logAgentMessage(userId, runId, "success", "Tailored resume generated and saved.", jobId);
        await completeAgentRunWithResult(userId, runId, {
          jobId,
          ...metadata,
        });
        await capturePostHogServerEvent(userId, "resume_tailored", {
          userId,
          jobId,
          company: context.job.company ?? "Unknown company",
        });
      });

      return { success: true, jobId, ...metadata };
    } catch (error) {
      console.error("[inngest/resumeTailoring] Resume tailoring failed:", error);
      await step.run("mark-system-failed", async () => {
        const message = "Resume tailoring failed. Please try again.";
        await logAgentMessage(
          userId,
          runId,
          "error",
          "Resume tailoring failed because of an unexpected system error.",
          jobId,
        );
        await failAgentRun(userId, runId, message);
        await markTailoringFailed(userId, jobId, runId, message);
      });

      return {
        success: false,
        error: "Resume tailoring failed. Please try again.",
      };
    }
  },
);
