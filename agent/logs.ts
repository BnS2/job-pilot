import { createInsforgeServer } from "@/lib/insforge-server";

type AgentRunStatus = "running" | "completed" | "failed";
type AgentLogLevel = "info" | "success" | "warning" | "error";

export async function startResumeExtractionRun(userId: string): Promise<string | null> {
  return startProfileAgentRun(userId, "resume_extraction");
}

export async function startResumeGenerationRun(userId: string): Promise<string | null> {
  return startProfileAgentRun(userId, "resume_generation");
}

async function startProfileAgentRun(userId: string, runType: string): Promise<string | null> {
  try {
    const insforge = await createInsforgeServer();
    const { data, error } = await insforge.database
      .from("agent_runs")
      .insert([{
        user_id: userId,
        status: "running",
        job_title_searched: runType,
        location_searched: null,
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
): Promise<void> {
  if (!runId) {
    return;
  }

  try {
    const insforge = await createInsforgeServer();
    const { error } = await insforge.database
      .from("agent_runs")
      .update({
        status,
        completed_at: new Date().toISOString(),
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

export async function logAgentMessage(
  userId: string,
  runId: string | null,
  level: AgentLogLevel,
  message: string,
): Promise<void> {
  if (!runId) {
    console.error("[agent/logs] Missing run_id for agent log:", message);
    return;
  }

  try {
    const insforge = await createInsforgeServer();
    const { error } = await insforge.database
      .from("agent_logs")
      .insert([{
        user_id: userId,
        run_id: runId,
        level,
        message,
      }]);

    if (error) {
      console.error("[agent/logs] Failed to write agent log:", error);
    }
  } catch (error) {
    console.error("[agent/logs] System error writing agent log:", error);
  }
}
