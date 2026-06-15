import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasMatchingSignal } from "@/agent/adzuna";
import { finishAgentRun, startJobUrlImportRun } from "@/agent/logs";
import { inngest, inngestEventKey, isInngestDev } from "@/inngest/client";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getJobSourceProvider, getSourceProviderLabel } from "@/lib/job-source";
import type { ProfileData } from "@/lib/utils";

export const runtime = "nodejs";

const importUrlRequestSchema = z.object({
  url: z.string().trim().min(8).max(2000),
  pageText: z.string().trim().min(180).max(18_000).optional(),
});

const runStatusRequestSchema = z.object({
  runId: z.string().uuid(),
});

type AuthenticatedUserResult = {
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>;
  userId: string | null;
  authUnavailable: boolean;
};

function getMissingRuntimeConfig(): string[] {
  const missing = ["GEMINI_API_KEY", "INSFORGE_API_KEY"].filter(
    (name) => !process.env[name],
  );

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

function validatePublicHttpUrl(rawUrl: string): string | null {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return "Enter a complete job URL, including https://.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Only public http or https job URLs can be imported.";
  }

  if (parsed.username || parsed.password) {
    return "Job URLs with embedded credentials cannot be imported.";
  }

  return null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function booleanOrFalse(value: unknown): boolean {
  return value === true;
}

function objectOrNull(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function getAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  const insforge = await createInsforgeServer();
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

  if (userError) {
    console.error("[api/agent/import-url] Auth lookup error:", userError);
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
      .select("id,status,jobs_found,job_title_searched,result,error_message,completed_at")
      .eq("id", parsed.data.runId)
      .eq("user_id", userId)
      .eq("run_type", "job_url_import")
      .maybeSingle();

    if (error) {
      console.error("[api/agent/import-url] Run status fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load URL import status." },
        { status: 500 },
      );
    }

    if (!run?.id) {
      return NextResponse.json(
        { success: false, error: "URL import run not found." },
        { status: 404 },
      );
    }

    const result = objectOrNull(run.result);
    const sourceProvider = stringOrNull(result?.sourceProvider);
    const sourceUrl = stringOrNull(result?.sourceUrl) || String(run.job_title_searched ?? "");
    const errorCode = stringOrNull(result?.errorCode);
    const providerLabel =
      stringOrNull(result?.providerLabel) ||
      getSourceProviderLabel(sourceProvider || getJobSourceProvider(String(run.job_title_searched ?? "")));
    const jobsSaved = stringOrNull(result?.jobId) ? 1 : 0;

    return NextResponse.json({
      success: true,
      data: {
        runId: String(run.id),
        status: stringOrNull(run.status) ?? "running",
        jobsFound: numberOrZero(run.jobs_found),
        jobsSaved,
        strongMatches: result?.strongMatch === true ? 1 : 0,
        jobId: stringOrNull(result?.jobId),
        sourceUrl,
        sourceProvider,
        providerLabel,
        jobTitle: stringOrNull(result?.title),
        company: stringOrNull(result?.company),
        statusMessage: stringOrNull(run.error_message),
        errorCode,
        canRetryWithText: booleanOrFalse(result?.canRetryWithText),
        completedAt: stringOrNull(run.completed_at),
      },
    });
  } catch (error) {
    console.error("[api/agent/import-url] System error loading run status:", error);
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

    const body = importUrlRequestSchema.safeParse(requestBody);

    if (!body.success) {
      const pageTextIssue = body.error.issues.some((issue) => issue.path[0] === "pageText");

      return NextResponse.json(
        {
          success: false,
          error: pageTextIssue
            ? "Paste more job listing text before importing."
            : "Enter a complete job URL to import.",
        },
        { status: 400 },
      );
    }

    const urlError = validatePublicHttpUrl(body.data.url);

    if (urlError) {
      return NextResponse.json(
        { success: false, error: urlError },
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
        "[api/agent/import-url] Missing URL import runtime config:",
        missingRuntimeConfig.join(", "),
      );
      return NextResponse.json(
        { success: false, error: "URL import is not configured yet." },
        { status: 500 },
      );
    }

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[api/agent/import-url] Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to load your profile." },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Save your profile before importing a job URL." },
        { status: 400 },
      );
    }

    const profileData: ProfileData = profile;

    if (!hasMatchingSignal(profileData)) {
      return NextResponse.json(
        {
          success: false,
          error: "Complete your profile with a target role, skills, and work experience before importing a job URL.",
        },
        { status: 400 },
      );
    }

    const runId = await startJobUrlImportRun(userId, body.data.url);

    if (!runId) {
      return NextResponse.json(
        { success: false, error: "Could not start URL import." },
        { status: 500 },
      );
    }

    try {
      await inngest.send({
        name: "job-url-import.requested",
        data: {
          runId,
          pageText: body.data.pageText,
          url: body.data.url,
          userId,
        },
      });
    } catch (error) {
      console.error("[api/agent/import-url] Failed to enqueue URL import:", error);
      await finishAgentRun(userId, runId, "failed");
      return NextResponse.json(
        { success: false, error: "Could not start URL import." },
        { status: 500 },
      );
    }

    const provider = getJobSourceProvider(body.data.url);
    const providerLabel = getSourceProviderLabel(provider);

    revalidatePath("/find-jobs");

    return NextResponse.json({
      success: true,
      data: {
        runId,
        status: "running",
        jobsFound: 0,
        jobsSaved: 0,
        strongMatches: 0,
        sourceProvider: provider,
        providerLabel,
        message: body.data.pageText
          ? `Importing pasted ${providerLabel} job.`
          : `Importing job from ${providerLabel}.`,
      },
    });
  } catch (error) {
    console.error("[api/agent/import-url] System error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
