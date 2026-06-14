import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasMatchingSignal, resolveSearchLocation } from "@/agent/adzuna";
import { finishAgentRun, startJobDiscoveryRun } from "@/agent/logs";
import { inngest, inngestEventKey, isInngestDev } from "@/inngest/client";
import { createInsforgeServer } from "@/lib/insforge-server";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import { MATCH_THRESHOLD, type ProfileData } from "@/lib/utils";

export const runtime = "nodejs";

const findJobsRequestSchema = z.object({
  jobTitle: z.string().trim().min(2).max(120).optional(),
  location: z.string().trim().max(120).optional().default(""),
  mode: z.enum(["manual_search", "profile_best_match"]).optional().default("manual_search"),
});

const runStatusRequestSchema = z.object({
  runId: z.string().uuid(),
});

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

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

type AuthenticatedUserResult = {
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>;
  userId: string | null;
  authUnavailable: boolean;
};

async function getAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  const insforge = await createInsforgeServer();
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

  if (userError) {
    console.error("[api/agent/find] Auth lookup error:", userError);
    return { insforge, userId: null, authUnavailable: true };
  }

  if (!userData.user) {
    return { insforge, userId: null, authUnavailable: false };
  }

  return { insforge, userId: userData.user.id, authUnavailable: false };
}

export async function GET(request: NextRequest) {
  try {
    const parsed = runStatusRequestSchema.safeParse({
      runId: request.nextUrl.searchParams.get("runId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid run ID format." },
        { status: 400 },
      );
    }

    const { insforge, userId, authUnavailable } = await getAuthenticatedUser();

    if (authUnavailable) {
      return NextResponse.json(
        { success: false, error: "Could not verify your session. Please try again." },
        { status: 503 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: run, error } = await insforge.database
      .from("agent_runs")
      .select("id,status,jobs_found,job_title_searched,location_searched,completed_at")
      .eq("id", parsed.data.runId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[api/agent/find] Run status fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load job search status." },
        { status: 500 },
      );
    }

    if (!run?.id) {
      return NextResponse.json(
        { success: false, error: "Job search run not found." },
        { status: 404 },
      );
    }

    const { data: savedJobs, error: savedJobsError, count } = await insforge.database
      .from("jobs")
      .select("id,match_score", { count: "exact" })
      .eq("user_id", userId)
      .eq("run_id", parsed.data.runId);

    if (savedJobsError) {
      console.error("[api/agent/find] Saved jobs count fetch error:", savedJobsError);
      return NextResponse.json(
        { success: false, error: "Failed to load job search status." },
        { status: 500 },
      );
    }

    const jobsSaved = typeof count === "number" ? count : savedJobs?.length ?? 0;
    const strongMatches =
      savedJobs?.filter((job) => numberOrZero(job.match_score) >= MATCH_THRESHOLD).length ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        runId: String(run.id),
        status: stringOrNull(run.status) ?? "running",
        jobsFound: numberOrZero(run.jobs_found),
        jobsSaved,
        strongMatches,
        jobTitle: stringOrNull(run.job_title_searched),
        location: stringOrNull(run.location_searched),
        completedAt: stringOrNull(run.completed_at),
      },
    });
  } catch (error) {
    console.error("[api/agent/find] System error loading run status:", error);
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
        {
          success: false,
          error: "Invalid request format.",
        },
        { status: 400 },
      );
    }

    const body = findJobsRequestSchema.safeParse(requestBody);

    if (!body.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format.",
        },
        { status: 400 },
      );
    }

    const isManualSearch = body.data.mode !== "profile_best_match";

    if (isManualSearch && !body.data.jobTitle) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a job title before finding jobs.",
        },
        { status: 400 },
      );
    }

    const { insforge, userId, authUnavailable } = await getAuthenticatedUser();

    if (authUnavailable) {
      return NextResponse.json(
        { success: false, error: "Could not verify your session. Please try again." },
        { status: 503 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const missingRuntimeConfig = getMissingRuntimeConfig();

    if (missingRuntimeConfig.length > 0) {
      console.error(
        "[api/agent/find] Missing job discovery runtime config:",
        missingRuntimeConfig.join(", "),
      );
      return NextResponse.json(
        { success: false, error: "Job search is not configured yet." },
        { status: 500 },
      );
    }

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[api/agent/find] Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to load your profile." },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Save your profile before finding jobs.",
        },
        { status: 400 },
      );
    }

    const profileData: ProfileData = profile;

    if (!hasMatchingSignal(profileData)) {
      return NextResponse.json(
        {
          success: false,
          error: isManualSearch
            ? "Complete your profile with a target role, skills, and work experience before finding jobs."
            : "Complete your profile with a target role and skills before using Best Match.",
        },
        { status: 400 },
      );
    }

    const resolvedLocation = resolveSearchLocation(body.data.location, profileData);
    const searchJobTitle = isManualSearch ? body.data.jobTitle! : "Best Match";
    const searchMode = isManualSearch ? "manual_search" : "profile_best_match";
    const runId = await startJobDiscoveryRun(
      userId,
      searchJobTitle,
      resolvedLocation || null,
      searchMode,
    );

    if (!runId) {
      return NextResponse.json(
        { success: false, error: "Could not start job search." },
        { status: 500 },
      );
    }

    try {
      await capturePostHogServerEvent(userId, "job_search_started", {
        userId,
        jobTitle: searchJobTitle,
        location: resolvedLocation,
        ...(searchMode === "profile_best_match" ? { searchMode } : {}),
      });
    } catch (error) {
      console.error("[api/agent/find] PostHog capture error:", error);
    }

    try {
      await inngest.send({
        name: "job-discovery.requested",
        data: {
          jobTitle: searchJobTitle,
          location: resolvedLocation,
          runId,
          userId,
          mode: searchMode,
        },
      });
    } catch (error) {
      console.error("[api/agent/find] Failed to enqueue job discovery:", error);
      await finishAgentRun(userId, runId, "failed");
      return NextResponse.json(
        { success: false, error: "Could not start job search." },
        { status: 500 },
      );
    }

    revalidatePath("/find-jobs");

    return NextResponse.json({
      success: true,
      data: {
        runId,
        status: "running",
        jobsFound: 0,
        jobsSaved: 0,
        strongMatches: 0,
        message: "Job search started. Results will appear here as they are saved.",
        empty: false,
      },
    });
  } catch (error) {
    console.error("[api/agent/find] System error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
