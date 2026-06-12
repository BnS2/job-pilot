"use server";

import { revalidatePath } from "next/cache";

import { createInsforgeServer } from "@/lib/insforge-server";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import { isJobStatus, type JobStatus } from "@/lib/utils";

type JobActionResult = {
  success: boolean;
  error?: string;
};

type StatusUpdate = {
  status: JobStatus;
  status_reason: string | null;
  unavailable_at: string | null;
  archived_at: string | null;
  applied_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
};

function buildStatusUpdate(status: JobStatus): StatusUpdate {
  const now = new Date().toISOString();

  return {
    status,
    status_reason: null,
    unavailable_at: status === "unavailable" ? now : null,
    archived_at: status === "archived" ? now : null,
    applied_at: status === "applied" ? now : null,
    rejected_at: status === "rejected" ? now : null,
    completed_at: status === "completed" ? now : null,
  };
}

export async function updateJobStatus(
  jobId: string,
  nextStatus: JobStatus,
): Promise<JobActionResult> {
  try {
    if (!jobId || !isJobStatus(nextStatus)) {
      return { success: false, error: "Choose a valid job status." };
    }

    const insforge = await createInsforgeServer();
    const { data: authData } = await insforge.auth.getCurrentUser();

    if (!authData.user) {
      return { success: false, error: "Sign in again to update this job." };
    }

    const { data: existingJob, error: readError } = await insforge.database
      .from("jobs")
      .select("id,status")
      .eq("id", jobId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (readError) {
      console.error("[actions/jobs] Failed to read job:", readError);
      return { success: false, error: "Job status could not be updated." };
    }

    if (!existingJob?.id) {
      return { success: false, error: "This job could not be found." };
    }

    const previousStatus = isJobStatus(String(existingJob.status))
      ? String(existingJob.status)
      : "active";

    const { error: updateError } = await insforge.database
      .from("jobs")
      .update(buildStatusUpdate(nextStatus))
      .eq("id", jobId)
      .eq("user_id", authData.user.id);

    if (updateError) {
      console.error("[actions/jobs] Failed to update job status:", updateError);
      return { success: false, error: "Job status could not be updated." };
    }

    await capturePostHogServerEvent(authData.user.id, "job_status_changed", {
      userId: authData.user.id,
      jobId,
      fromStatus: previousStatus,
      toStatus: nextStatus,
      reason: "user_action",
    });

    revalidatePath("/find-jobs");
    revalidatePath(`/find-jobs/${jobId}`);

    return { success: true };
  } catch (error) {
    console.error("[actions/jobs] System error:", error);
    return { success: false, error: "Job status could not be updated." };
  }
}

export async function updateJobStatusFromForm(
  jobId: string,
  nextStatus: JobStatus,
): Promise<void> {
  await updateJobStatus(jobId, nextStatus);
}
