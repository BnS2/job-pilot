import { renderToBuffer } from "@react-pdf/renderer";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { finishAgentRun, logAgentMessage, startResumeGenerationRun } from "@/agent/logs";
import { generateResumeFromProfile } from "@/agent/resumeGenerator";
import { createResumeDocument } from "@/app/api/resume/generate/ResumeDocument";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { ProfileData } from "@/lib/utils";

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

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[api/resume/generate] Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to load profile" },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Save your profile before generating a resume." },
        { status: 400 },
      );
    }

    const profileData: ProfileData = profile;
    runId = await startResumeGenerationRun(userId);
    await logAgentMessage(userId, runId, "info", "Resume generation started from saved profile data.");

    const generation = await generateResumeFromProfile(profileData, {
      userId,
      runId,
    });

    if (!generation.success) {
      await finishAgentRun(userId, runId, "failed");

      return NextResponse.json(
        { success: false, error: generation.error },
        { status: generation.code === "temporary_unavailable" ? 503 : 400 },
      );
    }

    const pdfBuffer = await renderToBuffer(
      createResumeDocument({
        profile: profileData,
        resume: generation.resume,
      }),
    );
    const resumeKey = `${userId}/resume.pdf`;

    const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], {
      type: "application/pdf",
    });
    const { data: uploadData, error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(resumeKey, pdfBlob);

    if (uploadError || !uploadData) {
      console.error("[api/resume/generate] Upload error:", uploadError);
      await logAgentMessage(userId, runId, "error", "Generated resume PDF upload failed.");
      await finishAgentRun(userId, runId, "failed");

      return NextResponse.json(
        { success: false, error: "Failed to upload generated resume" },
        { status: 500 },
      );
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
      console.error("[api/resume/generate] Profile update error:", updateError);
      await logAgentMessage(userId, runId, "error", "Generated resume metadata update failed.");
      await finishAgentRun(userId, runId, "failed");

      return NextResponse.json(
        { success: false, error: "Failed to update resume metadata" },
        { status: 500 },
      );
    }

    await logAgentMessage(userId, runId, "success", "Resume PDF generated and saved.");
    await finishAgentRun(userId, runId, "completed");
    revalidatePath("/profile");

    if (
      profileData.resume_pdf_key &&
      profileData.resume_pdf_key !== updatedProfile.resume_pdf_key
    ) {
      const { error: removeError } = await insforge.storage
        .from("resumes")
        .remove(profileData.resume_pdf_key);

      if (removeError) {
        console.error("[api/resume/generate] Previous resume removal error:", removeError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        resumePdfUrl: updatedProfile.resume_pdf_url,
        resumePdfKey: updatedProfile.resume_pdf_key,
      },
    });
  } catch (error) {
    console.error("[api/resume/generate] System error:", error);

    if (userId) {
      await logAgentMessage(
        userId,
        runId,
        "error",
        "Resume generation failed because of an unexpected system error.",
      );
      await finishAgentRun(userId, runId, "failed");
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
