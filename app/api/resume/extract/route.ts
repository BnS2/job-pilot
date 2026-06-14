import { NextResponse } from "next/server";

import { failAgentRun, startResumeExtractionRun } from "@/agent/logs";
import { inngest, inngestEventKey, isInngestDev } from "@/inngest/client";
import { createInsforgeServer } from "@/lib/insforge-server";

export const runtime = "nodejs";

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

type AuthenticatedUserResult = {
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>;
  userId: string | null;
  authUnavailable: boolean;
};

async function getAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  const insforge = await createInsforgeServer();
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

  if (userError) {
    console.error("[api/resume/extract] Auth lookup error:", userError);
    return { insforge, userId: null, authUnavailable: true };
  }

  if (!userData.user) {
    return { insforge, userId: null, authUnavailable: false };
  }

  return { insforge, userId: userData.user.id, authUnavailable: false };
}

export async function POST() {
  try {
    const { insforge, userId, authUnavailable } = await getAuthenticatedUser();

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
        "[api/resume/extract] Missing resume extraction runtime config:",
        missingRuntimeConfig.join(", "),
      );
      return NextResponse.json(
        { success: false, error: "Resume extraction is not configured yet." },
        { status: 500 },
      );
    }

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_key")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[api/resume/extract] Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to locate resume" },
        { status: 500 },
      );
    }

    if (!profile?.resume_pdf_key) {
      return NextResponse.json(
        { success: false, error: "Upload a resume before extracting profile details." },
        { status: 400 },
      );
    }

    const runId = await startResumeExtractionRun(userId);
    if (!runId) {
      return NextResponse.json(
        { success: false, error: "Could not start resume extraction." },
        { status: 500 },
      );
    }

    try {
      await inngest.send({
        name: "resume-extraction.requested",
        data: { runId, userId },
      });
    } catch (error) {
      console.error("[api/resume/extract] Failed to enqueue resume extraction:", error);
      await failAgentRun(
        userId,
        runId,
        "Resume extraction could not be started. Please try again.",
      );
      return NextResponse.json(
        { success: false, error: "Could not start resume extraction." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        runId,
        status: "running",
      },
    });
  } catch (error) {
    console.error("[api/resume/extract] System error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
