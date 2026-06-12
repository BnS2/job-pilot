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

function buildStatusUpdate(status: JobStatus, current: StatusUpdate): StatusUpdate {
  const now = new Date().toISOString();

  return {
    status,
    status_reason: null,
    unavailable_at:
      status === "unavailable" ? current.unavailable_at ?? now : current.unavailable_at,
    archived_at: status === "archived" ? current.archived_at ?? now : current.archived_at,
    applied_at: status === "applied" ? current.applied_at ?? now : current.applied_at,
    rejected_at: status === "rejected" ? current.rejected_at ?? now : current.rejected_at,
    completed_at:
      status === "completed" ? current.completed_at ?? now : current.completed_at,
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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
      .select(
        "id,status,status_reason,unavailable_at,archived_at,applied_at,rejected_at,completed_at",
      )
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

    const rawPreviousStatus = String(existingJob.status);
    const previousStatus: JobStatus = isJobStatus(rawPreviousStatus)
      ? rawPreviousStatus
      : "active";
    const currentStatusUpdate: StatusUpdate = {
      status: previousStatus,
      status_reason: stringOrNull(existingJob.status_reason),
      unavailable_at: stringOrNull(existingJob.unavailable_at),
      archived_at: stringOrNull(existingJob.archived_at),
      applied_at: stringOrNull(existingJob.applied_at),
      rejected_at: stringOrNull(existingJob.rejected_at),
      completed_at: stringOrNull(existingJob.completed_at),
    };

    const { error: updateError } = await insforge.database
      .from("jobs")
      .update(buildStatusUpdate(nextStatus, currentStatusUpdate))
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
