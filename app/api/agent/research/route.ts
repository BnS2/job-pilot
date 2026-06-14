import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { inngest, inngestEventKey, isInngestDev } from "@/inngest/client";
import { companyResearchSchema } from "@/lib/company-research";
import { createInsforgeServer } from "@/lib/insforge-server";

export const runtime = "nodejs";

const researchRequestSchema = z.object({
  jobId: z.string().uuid(),
});

const staleResearchMs = 10 * 60 * 1000;

type ResearchStatus = "idle" | "running" | "completed" | "failed";

function getResearchStatus(value: unknown): ResearchStatus {
  return value === "running" ||
    value === "completed" ||
    value === "failed" ||
    value === "idle"
    ? value
    : "idle";
}

function getMissingRuntimeConfig(): string[] {
  const missing = ["INSFORGE_API_KEY"].filter((name) => !process.env[name]);

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

async function createResearchRun(
  userId: string,
  company: string | null,
  title: string | null,
): Promise<string | null> {
  try {
    const insforge = await createInsforgeServer();
    const { data, error } = await insforge.database
      .from("agent_runs")
      .insert([{
        user_id: userId,
        run_type: "company_research",
        status: "running",
        job_title_searched: `company_research:${company ?? "unknown"}`,
        location_searched: title,
        jobs_found: 0,
      }])
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("[api/agent/research] Failed to create research run:", error);
      return null;
    }

    return String(data.id);
  } catch (error) {
    console.error("[api/agent/research] System error creating research run:", error);
    return null;
  }
}

async function finishResearchRun(userId: string, runId: string | null): Promise<void> {
  if (!runId) {
    return;
  }

  try {
    const insforge = await createInsforgeServer();
    const { error } = await insforge.database
      .from("agent_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("user_id", userId);

    if (error) {
      console.error("[api/agent/research] Failed to close research run:", error);
    }
  } catch (error) {
    console.error("[api/agent/research] System error closing research run:", error);
  }
}

function isStaleRunningResearch(startedAt: unknown): boolean {
  if (typeof startedAt !== "string") {
    return false;
  }

  const timestamp = new Date(startedAt).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp > staleResearchMs;
}

async function getAuthenticatedInsforge() {
  const insforge = await createInsforgeServer();
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

  if (userError || !userData.user) {
    return { insforge, userId: null };
  }

  return { insforge, userId: userData.user.id };
}

export async function GET(request: NextRequest) {
  try {
    const parsed = researchRequestSchema.safeParse({
      jobId: request.nextUrl.searchParams.get("jobId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format." },
        { status: 400 },
      );
    }

    const { insforge, userId } = await getAuthenticatedInsforge();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: job, error } = await insforge.database
      .from("jobs")
      .select(
        "id,user_id,company_research,company_research_status,company_research_error,company_research_started_at",
      )
      .eq("id", parsed.data.jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[api/agent/research] Failed to read research status:", error);
      return NextResponse.json(
        { success: false, error: "Could not load company research status." },
        { status: 500 },
      );
    }

    if (!job?.id) {
      return NextResponse.json(
        { success: false, error: "Job not found." },
        { status: 404 },
      );
    }

    const cached = companyResearchSchema.safeParse(job.company_research);
    if (cached.success) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        error: null,
        status: "completed",
      });
    }

    const currentStatus = getResearchStatus(job.company_research_status);
    if (
      currentStatus === "running" &&
      isStaleRunningResearch(job.company_research_started_at)
    ) {
      const staleMessage = "Company research timed out. Please try again.";
      const { error: updateError } = await insforge.database
        .from("jobs")
        .update({
          company_research_error: staleMessage,
          company_research_started_at: null,
          company_research_status: "failed",
        })
        .eq("id", parsed.data.jobId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("[api/agent/research] Failed to mark stale research:", updateError);
      }

      return NextResponse.json({
        success: true,
        data: null,
        error: staleMessage,
        status: "failed",
      });
    }

    return NextResponse.json({
      success: true,
      data: null,
      error:
        typeof job.company_research_error === "string"
          ? job.company_research_error
          : null,
      status: currentStatus,
    });
  } catch (error) {
    console.error("[api/agent/research] System error loading research status:", error);
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

    const parsed = researchRequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format." },
        { status: 400 },
      );
    }

    const { insforge, userId } = await getAuthenticatedInsforge();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { jobId } = parsed.data;
    const missingRuntimeConfig = getMissingRuntimeConfig();

    if (missingRuntimeConfig.length > 0) {
      console.error(
        "[api/agent/research] Missing research runtime config:",
        missingRuntimeConfig.join(", "),
      );
      return NextResponse.json(
        { success: false, error: "Company research is not configured yet." },
        { status: 500 },
      );
    }

    const { data: job, error: jobError } = await insforge.database
      .from("jobs")
      .select(
        "id,user_id,company,title,company_research,company_research_status,company_research_error,company_research_started_at",
      )
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (jobError) {
      console.error("[api/agent/research] Failed to read job:", jobError);
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

    const cached = companyResearchSchema.safeParse(job.company_research);
    if (cached.success) {
      return NextResponse.json({
        success: true,
        status: "completed",
        cached: true,
        data: cached.data,
      });
    }

    const currentStatus = getResearchStatus(job.company_research_status);
    if (
      currentStatus === "running" &&
      !isStaleRunningResearch(job.company_research_started_at)
    ) {
      return NextResponse.json({
        success: true,
        status: "running",
        cached: false,
      });
    }

    const agentRunId = await createResearchRun(
      userId,
      typeof job.company === "string" ? job.company : null,
      typeof job.title === "string" ? job.title : null,
    );

    if (!agentRunId) {
      return NextResponse.json(
        { success: false, error: "Could not start company research." },
        { status: 500 },
      );
    }

    const { error: updateError } = await insforge.database
      .from("jobs")
      .update({
        company_research_status: "running",
        company_research_error: null,
        company_research_started_at: new Date().toISOString(),
        company_research_run_id: agentRunId,
      })
      .eq("id", jobId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[api/agent/research] Failed to mark research running:", updateError);
      await finishResearchRun(userId, agentRunId);
      return NextResponse.json(
        { success: false, error: "Could not start company research." },
        { status: 500 },
      );
    }

    let inngestEventId: string | null = null;

    try {
      const eventResult = await inngest.send({
        name: "company-research.requested",
        data: {
          agentRunId,
          jobId,
          userId,
        },
      });
      inngestEventId = eventResult.ids[0] ?? null;
    } catch (error) {
      console.error("[api/agent/research] Failed to enqueue research:", error);
      await finishResearchRun(userId, agentRunId);
      await insforge.database
        .from("jobs")
        .update({
          company_research_status: "failed",
          company_research_error:
            "Company research could not be started. Please try again.",
          company_research_started_at: null,
        })
        .eq("id", jobId)
        .eq("user_id", userId);

      return NextResponse.json(
        { success: false, error: "Could not start company research." },
        { status: 500 },
      );
    }

    if (inngestEventId) {
      const { error: runUpdateError } = await insforge.database
        .from("jobs")
        .update({ company_research_run_id: inngestEventId })
        .eq("id", jobId)
        .eq("user_id", userId);

      if (runUpdateError) {
        console.error(
          "[api/agent/research] Failed to save Inngest event ID:",
          runUpdateError,
        );
      }
    }

    revalidatePath(`/find-jobs/${jobId}`);

    return NextResponse.json({
      success: true,
      status: "running",
      cached: false,
    });
  } catch (error) {
    console.error("[api/agent/research] System error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
