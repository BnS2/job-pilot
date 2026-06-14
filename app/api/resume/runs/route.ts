import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { extractedProfileSchema } from "@/agent/extractor";
import { createInsforgeServer } from "@/lib/insforge-server";

export const runtime = "nodejs";

const resumeRunStatusRequestSchema = z.object({
  runId: z.string().uuid(),
});

const resumeRunStatusSchema = z.enum(["running", "completed", "failed"]);
const resumeRunTypeSchema = z.enum(["resume_extraction", "resume_generation"]);
const resumeExtractionResultSchema = z.object({
  profile: extractedProfileSchema,
  textExtractor: z.enum(["markitdown", "pdf-parse"]),
});
const resumeGenerationResultSchema = z.object({
  resumePdfUrl: z.string(),
  resumePdfKey: z.string(),
});

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function GET(request: NextRequest) {
  try {
    const parsed = resumeRunStatusRequestSchema.safeParse({
      runId: request.nextUrl.searchParams.get("runId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid run ID format." },
        { status: 400 },
      );
    }

    const insforge = await createInsforgeServer();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: run, error } = await insforge.database
      .from("agent_runs")
      .select("id,run_type,status,result,error_message,completed_at")
      .eq("id", parsed.data.runId)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) {
      console.error("[api/resume/runs] Run status fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load resume job status." },
        { status: 500 },
      );
    }

    if (!run?.id) {
      return NextResponse.json(
        { success: false, error: "Resume job not found." },
        { status: 404 },
      );
    }

    const runType = resumeRunTypeSchema.safeParse(run.run_type);
    if (!runType.success) {
      return NextResponse.json(
        { success: false, error: "Resume job not found." },
        { status: 404 },
      );
    }

    const status = resumeRunStatusSchema.safeParse(run.status);
    if (!status.success) {
      return NextResponse.json(
        { success: false, error: "Invalid resume job status." },
        { status: 500 },
      );
    }

    const result =
      runType.data === "resume_extraction"
        ? resumeExtractionResultSchema.safeParse(run.result)
        : resumeGenerationResultSchema.safeParse(run.result);

    return NextResponse.json({
      success: true,
      data: {
        runId: String(run.id),
        runType: runType.data,
        status: status.data,
        completedAt: stringOrNull(run.completed_at),
        errorMessage: stringOrNull(run.error_message),
        result: result.success ? result.data : null,
      },
    });
  } catch (error) {
    console.error("[api/resume/runs] System error loading run status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
