import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { failAgentRun, startResumeTailoringRun } from "@/agent/logs";
import { tailoredResumeNotesSchema } from "@/agent/resumeTailor";
import { inngest, inngestEventKey, isInngestDev } from "@/inngest/client";
import { createInsforgeServer } from "@/lib/insforge-server";

export const runtime = "nodejs";

const tailorResumeRequestSchema = z.object({
  jobId: z.string().uuid(),
});

const tailorStatusSchema = z.enum(["idle", "running", "completed", "failed"]);

function getMissingRuntimeConfig(): string[] {
  const missing = ["GEMINI_API_KEY", "INSFORGE_API_KEY"].filter((name) => !process.env[name]);

  if (!isInngestDev) {
    if (!inngestEventKey) {
      missing.push("INNGEST_EVENT_KEY");
    }

    if (!process.env.INNGEST_SIGNING_KEY) {
      missing.push("INNGEST_SIGNING_KEY");
    }
  }

  return missing;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getTailorStatus(value: unknown): z.infer<typeof tailorStatusSchema> {
  const parsed = tailorStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "idle";
}

async function getAuthenticatedInsforge(): Promise<{
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>;
  userId: string | null;
  authUnavailable: boolean;
}> {
  const insforge = await createInsforgeServer();
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

  if (userError) {
    console.error("[api/resume/tailor] Auth lookup error:", userError);
    return { insforge, userId: null, authUnavailable: true };
  }

  if (!userData.user) {
    return { insforge, userId: null, authUnavailable: false };
  }

  return { insforge, userId: userData.user.id, authUnavailable: false };
}

function buildStatusResponse(job: Record<string, unknown>) {
  const notes = tailoredResumeNotesSchema.safeParse(job.tailored_resume_notes);

  return {
    jobId: String(job.id),
    status: getTailorStatus(job.tailored_resume_status),
    error: stringOrNull(job.tailored_resume_error),
    generatedAt: stringOrNull(job.tailored_resume_generated_at),
    hasResume: typeof job.tailored_resume_key === "string" && job.tailored_resume_key.length > 0,
    notes: notes.success ? notes.data : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const parsed = tailorResumeRequestSchema.safeParse({
      jobId: request.nextUrl.searchParams.get("jobId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format." },
        { status: 400 },
      );
    }

    const { insforge, userId, authUnavailable } = await getAuthenticatedInsforge();

    if (authUnavailable) {
      return NextResponse.json(
        { success: false, error: "Could not verify your session. Please try again." },
        { status: 503 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Your session expired. Please sign in again." },
        { status: 401 },
      );
    }

    const { data: job, error } = await insforge.database
      .from("jobs")
      .select(
        "id,tailored_resume_key,tailored_resume_status,tailored_resume_error,tailored_resume_notes,tailored_resume_generated_at",
      )
      .eq("id", parsed.data.jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[api/resume/tailor] Status fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Could not load tailored resume status." },
        { status: 500 },
      );
    }

    if (!job?.id) {
      return NextResponse.json(
        { success: false, error: "Job not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: buildStatusResponse(job) });
  } catch (error) {
    console.error("[api/resume/tailor] System error loading status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request format." },
        { status: 400 },
      );
    }

    const parsed = tailorResumeRequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format." },
        { status: 400 },
      );
    }

    const { insforge, userId, authUnavailable } = await getAuthenticatedInsforge();

    if (authUnavailable) {
      return NextResponse.json(
        { success: false, error: "Could not verify your session. Please try again." },
        { status: 503 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Your session expired. Please sign in again." },
        { status: 401 },
      );
    }

    const missingRuntimeConfig = getMissingRuntimeConfig();
    if (missingRuntimeConfig.length > 0) {
      console.error(
        "[api/resume/tailor] Missing tailoring runtime config:",
        missingRuntimeConfig.join(", "),
      );
      return NextResponse.json(
        { success: false, error: "Resume tailoring is not configured yet." },
        { status: 500 },
      );
    }

    const { jobId } = parsed.data;
    const { data: job, error: jobError } = await insforge.database
      .from("jobs")
      .select(
        "id,company,title,tailored_resume_key,tailored_resume_status,tailored_resume_error,tailored_resume_notes,tailored_resume_generated_at",
      )
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (jobError) {
      console.error("[api/resume/tailor] Job fetch error:", jobError);
      return NextResponse.json(
        { success: false, error: "Could not load this job right now." },
        { status: 500 },
      );
    }

    if (!job?.id) {
      return NextResponse.json(
        { success: false, error: "Job not found." },
        { status: 404 },
      );
    }

    if (getTailorStatus(job.tailored_resume_status) === "running") {
      return NextResponse.json({
        success: true,
        data: buildStatusResponse(job),
      });
    }

    const runId = await startResumeTailoringRun(
      userId,
      jobId,
      `${stringOrNull(job.company) ?? "Unknown company"} — ${stringOrNull(job.title) ?? "Untitled role"}`,
    );

    if (!runId) {
      return NextResponse.json(
        { success: false, error: "Could not start resume tailoring." },
        { status: 500 },
      );
    }

    const { data: updatedJob, error: updateError } = await insforge.database
      .from("jobs")
      .update({
        tailored_resume_status: "running",
        tailored_resume_error: null,
        tailored_resume_run_id: runId,
      })
      .eq("id", jobId)
      .eq("user_id", userId)
      .select(
        "id,tailored_resume_key,tailored_resume_status,tailored_resume_error,tailored_resume_notes,tailored_resume_generated_at",
      )
      .maybeSingle();

    if (updateError || !updatedJob) {
      console.error("[api/resume/tailor] Failed to mark tailoring running:", updateError);
      await failAgentRun(userId, runId, "Resume tailoring could not be started.");
      return NextResponse.json(
        { success: false, error: "Could not start resume tailoring." },
        { status: 500 },
      );
    }

    try {
      const eventResult = await inngest.send({
        name: "resume-tailoring.requested",
        data: { jobId, runId, userId },
      });
      const eventId = eventResult.ids[0] ?? null;

      if (eventId) {
        const { error: runUpdateError } = await insforge.database
          .from("jobs")
          .update({ tailored_resume_run_id: eventId })
          .eq("id", jobId)
          .eq("user_id", userId);

        if (runUpdateError) {
          console.error("[api/resume/tailor] Failed to save Inngest event ID:", runUpdateError);
        }
      }
    } catch (error) {
      console.error("[api/resume/tailor] Failed to enqueue tailoring:", error);
      await failAgentRun(userId, runId, "Resume tailoring could not be started.");
      await insforge.database
        .from("jobs")
        .update({
          tailored_resume_status: "failed",
          tailored_resume_error: "Resume tailoring could not be started. Please try again.",
        })
        .eq("id", jobId)
        .eq("user_id", userId);

      return NextResponse.json(
        { success: false, error: "Could not start resume tailoring." },
        { status: 500 },
      );
    }

    revalidatePath(`/find-jobs/${jobId}`);

    return NextResponse.json({
      success: true,
      data: {
        ...buildStatusResponse(updatedJob),
        runId,
      },
    });
  } catch (error) {
    console.error("[api/resume/tailor] System error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
