import { createInsforgeAdmin } from "@/lib/insforge-admin";

type AgentRunStatus = "running" | "completed" | "failed";
type AgentLogLevel = "info" | "success" | "warning" | "error";
type AgentRunType =
  | "job_discovery"
  | "company_research"
  | "availability_check"
  | "resume_extraction"
  | "resume_generation"
  | "job_url_import"
  | "resume_tailoring";

type AgentRunResult = Record<string, unknown>;

export async function startResumeExtractionRun(userId: string): Promise<string | null> {
  return startProfileAgentRun(userId, "resume_extraction", "resume_extraction");
}

export async function startResumeGenerationRun(userId: string): Promise<string | null> {
  return startProfileAgentRun(userId, "resume_generation", "resume_generation");
}

export async function startResumeTailoringRun(
  userId: string,
  jobId: string,
  label: string,
): Promise<string | null> {
  return startProfileAgentRun(userId, `resume_tailoring:${jobId}`, "resume_tailoring", label);
}

export async function startAvailabilityCheckRun(userId: string): Promise<string | null> {
  return startProfileAgentRun(userId, "availability_check", "availability_check");
}

export async function startJobUrlImportRun(
  userId: string,
  url: string,
): Promise<string | null> {
  try {
    const insforge = createInsforgeAdmin();
    const { data, error } = await insforge.database
      .from("agent_runs")
      .insert([{
        user_id: userId,
        run_type: "job_url_import",
        status: "running",
        job_title_searched: url,
        location_searched: null,
        jobs_found: 0,
      }])
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("[agent/logs] Failed to create URL import run:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("[agent/logs] System error creating URL import run:", error);
    return null;
  }
}

export async function startJobDiscoveryRun(
  userId: string,
  jobTitle: string,
  location: string | null,
  searchMode: "manual_search" | "profile_best_match" = "manual_search",
): Promise<string | null> {
  try {
    const insforge = createInsforgeAdmin();
    const { data, error } = await insforge.database
      .from("agent_runs")
      .insert([{
        user_id: userId,
        run_type: "job_discovery",
        status: "running",
        job_title_searched: jobTitle,
        location_searched: location,
        jobs_found: 0,
        search_mode: searchMode,
      }])
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("[agent/logs] Failed to create job discovery run:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("[agent/logs] System error creating job discovery run:", error);
    return null;
  }
}

async function startProfileAgentRun(
  userId: string,
  jobTitleSearched: string,
  runType: AgentRunType,
  locationSearched: string | null = null,
): Promise<string | null> {
  try {
    const insforge = createInsforgeAdmin();
    const { data, error } = await insforge.database
      .from("agent_runs")
      .insert([{
        user_id: userId,
        run_type: runType,
        status: "running",
        job_title_searched: jobTitleSearched,
        location_searched: locationSearched,
        jobs_found: 0,
      }])
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("[agent/logs] Failed to create profile agent run:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("[agent/logs] System error creating profile agent run:", error);
    return null;
  }
}

export async function finishAgentRun(
  userId: string,
  runId: string | null,
  status: Exclude<AgentRunStatus, "running">,
  jobsFound?: number,
): Promise<void> {
  if (!runId) {
    return;
  }

  try {
    const insforge = createInsforgeAdmin();
    const { error } = await insforge.database
      .from("agent_runs")
      .update({
        status,
        completed_at: new Date().toISOString(),
        ...(typeof jobsFound === "number" ? { jobs_found: jobsFound } : {}),
      })
      .eq("id", runId)
      .eq("user_id", userId);

    if (error) {
      console.error("[agent/logs] Failed to finish agent run:", error);
    }
  } catch (error) {
    console.error("[agent/logs] System error finishing agent run:", error);
  }
}

export async function completeAgentRunWithResult(
  userId: string,
  runId: string | null,
  result: AgentRunResult,
  jobsFound?: number,
): Promise<void> {
  if (!runId) {
    return;
  }

  try {
    const insforge = createInsforgeAdmin();
    const { error } = await insforge.database
      .from("agent_runs")
      .update({
        status: "completed",
        result,
        error_message: null,
        ...(typeof jobsFound === "number" ? { jobs_found: jobsFound } : {}),
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("user_id", userId);

    if (error) {
      console.error("[agent/logs] Failed to complete agent run with result:", error);
    }
  } catch (error) {
    console.error("[agent/logs] System error completing agent run with result:", error);
  }
}

export async function failAgentRun(
  userId: string,
  runId: string | null,
  errorMessage: string,
  result?: AgentRunResult,
): Promise<void> {
  if (!runId) {
    return;
  }

  try {
    const insforge = createInsforgeAdmin();
    const { error } = await insforge.database
      .from("agent_runs")
      .update({
        status: "failed",
        error_message: errorMessage,
        ...(result ? { result } : {}),
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("user_id", userId);

    if (error) {
      console.error("[agent/logs] Failed to fail agent run:", error);
    }
  } catch (error) {
    console.error("[agent/logs] System error failing agent run:", error);
  }
}

export async function logAgentMessage(
  userId: string,
  runId: string | null,
  level: AgentLogLevel,
  message: string,
  jobId?: string,
): Promise<void> {
  if (!runId) {
    console.error("[agent/logs] Missing run_id for agent log:", message);
    return;
  }

  try {
    const insforge = createInsforgeAdmin();
    const { error } = await insforge.database
      .from("agent_logs")
      .insert([{
        user_id: userId,
        run_id: runId,
        level,
        message,
        ...(jobId ? { job_id: jobId } : {}),
      }]);

    if (error) {
      console.error("[agent/logs] Failed to write agent log:", error);
    }
  } catch (error) {
    console.error("[agent/logs] System error writing agent log:", error);
  }
}
