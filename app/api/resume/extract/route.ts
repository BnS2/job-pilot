import { NextResponse } from "next/server";

import { extractProfileFromResumeText } from "@/agent/extractor";
import { finishAgentRun, logAgentMessage, startResumeExtractionRun } from "@/agent/logs";
import { extractResumeTextFromPdf } from "@/agent/resumeText";
import { createInsforgeServer } from "@/lib/insforge-server";

export const runtime = "nodejs";

export async function POST() {
  let runId: string | null = null;
  let userId: string | null = null;

  try {
    const insforge = await createInsforgeServer();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    userId = userData.user.id;
    runId = await startResumeExtractionRun(userId);

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_key")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[api/resume/extract] Profile fetch error:", profileError);
      await logAgentMessage(
        userId,
        runId,
        "error",
        "Resume extraction failed because the saved profile could not be loaded.",
      );
      await finishAgentRun(userId, runId, "failed");

      return NextResponse.json(
        { success: false, error: "Failed to locate resume" },
        { status: 500 },
      );
    }

    if (!profile?.resume_pdf_key) {
      await logAgentMessage(
        userId,
        runId,
        "error",
        "Resume extraction failed because no resume file is attached to the profile.",
      );
      await finishAgentRun(userId, runId, "failed");

      return NextResponse.json(
        { success: false, error: "Upload a resume before extracting profile details." },
        { status: 400 },
      );
    }

    const { data: resumeBlob, error: downloadError } = await insforge.storage
      .from("resumes")
      .download(profile.resume_pdf_key);

    if (downloadError || !resumeBlob) {
      console.error("[api/resume/extract] Download error:", downloadError);
      await logAgentMessage(
        userId,
        runId,
        "error",
        "Resume extraction failed because the stored resume could not be downloaded.",
      );
      await finishAgentRun(userId, runId, "failed");

      return NextResponse.json(
        { success: false, error: "Failed to download resume" },
        { status: 500 },
      );
    }

    const resumeBuffer = Buffer.from(await resumeBlob.arrayBuffer());
    const resumeText = await extractResumeTextFromPdf(resumeBuffer);
    console.info(`[api/resume/extract] Resume text extracted with ${resumeText.source}.`);

    await logAgentMessage(
      userId,
      runId,
      "info",
      `Resume text extracted with ${resumeText.source}.`,
    );

    const extraction = await extractProfileFromResumeText(resumeText.text, {
      userId,
      runId,
    });

    if (!extraction.success) {
      await finishAgentRun(userId, runId, "failed");

      return NextResponse.json(
        { success: false, error: extraction.error },
        { status: extraction.code === "temporary_unavailable" ? 503 : 422 },
      );
    }

    await logAgentMessage(
      userId,
      runId,
      "success",
      "Resume extraction completed and returned profile fields for review.",
    );
    await finishAgentRun(userId, runId, "completed");

    return NextResponse.json({
      success: true,
      data: extraction.profile,
      meta: {
        textExtractor: resumeText.source,
      },
    });
  } catch (error) {
    console.error("[api/resume/extract] System error:", error);

    if (userId) {
      await logAgentMessage(
        userId,
        runId,
        "error",
        "Resume extraction failed because of an unexpected system error.",
      );
      await finishAgentRun(userId, runId, "failed");
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
