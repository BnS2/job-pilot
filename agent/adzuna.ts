import { matchJobToProfile } from "@/agent/matcher";
import { finishAgentRun, logAgentMessage, startJobDiscoveryRun } from "@/agent/logs";
import {
  detectAdzunaCountry,
  isSupportedAdzunaFallbackLocation,
  searchAdzunaJobs,
  type NormalizedAdzunaJob,
} from "@/lib/adzuna";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { MATCH_THRESHOLD, type ProfileData } from "@/lib/utils";

export type DiscoverJobsResult =
  | {
      success: true;
      data: {
        runId: string | null;
        jobsFound: number;
        jobsSaved: number;
        strongMatches: number;
        message: string;
        empty: boolean;
      };
    }
  | {
      success: false;
      error: string;
      code:
        | "incomplete_profile"
        | "adzuna_failed"
        | "temporary_unavailable"
        | "save_failed";
    };

type DiscoverJobsInput = {
  userId: string;
  jobTitle: string;
  requestedLocation: string;
  profile: ProfileData;
};

type JobInsertRecord = {
  user_id: string;
  run_id: string | null;
  source: "search";
  source_url: string;
  external_apply_url: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  job_type: "fulltime" | "parttime" | "contract";
  about_role: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  about_company: string | null;
  match_score: number;
  match_reason: string;
  matched_skills: string[];
  missing_skills: string[];
  found_at: string;
};

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasMatchingSignal(profile: ProfileData): boolean {
  const hasRoleSignal =
    hasText(profile.current_title) ||
    Boolean(profile.job_titles_seeking?.some(hasText)) ||
    Boolean(profile.work_experience?.some((role) => hasText(role.title)));

  const hasSkillSignal =
    Boolean(profile.skills?.some(hasText)) ||
    Boolean(profile.work_experience?.some((role) => hasText(role.responsibilities)));

  return hasRoleSignal && hasSkillSignal;
}

function resolveSearchLocation(requestedLocation: string, profile: ProfileData): string {
  const trimmed = requestedLocation.trim();

  if (trimmed) {
    return trimmed;
  }

  const profileLocation = profile.location?.trim() ?? "";

  if (isSupportedAdzunaFallbackLocation(profileLocation)) {
    return profileLocation;
  }

  return "";
}

function toJobRecord(
  userId: string,
  runId: string | null,
  job: NormalizedAdzunaJob,
  matchScore: number,
  matchReason: string,
  matchedSkills: string[],
  missingSkills: string[],
): JobInsertRecord {
  return {
    user_id: userId,
    run_id: runId,
    source: "search",
    source_url: job.redirectUrl,
    external_apply_url: job.redirectUrl,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    job_type: job.jobType,
    about_role: job.description,
    responsibilities: [],
    requirements: [],
    nice_to_have: [],
    benefits: [],
    about_company: null,
    match_score: matchScore,
    match_reason: matchReason,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    found_at: new Date().toISOString(),
  };
}

export async function discoverJobsFromAdzuna({
  userId,
  jobTitle,
  requestedLocation,
  profile,
}: DiscoverJobsInput): Promise<DiscoverJobsResult> {
  const normalizedTitle = jobTitle.trim();

  if (!hasMatchingSignal(profile)) {
    return {
      success: false,
      error: "Complete your profile with a target role, skills, and work experience before finding jobs.",
      code: "incomplete_profile",
    };
  }

  const resolvedLocation = resolveSearchLocation(requestedLocation, profile);
  const runId = await startJobDiscoveryRun(userId, normalizedTitle, resolvedLocation || null);

  try {
    await logAgentMessage(
      userId,
      runId,
      "info",
      `Job discovery started for ${normalizedTitle}${resolvedLocation ? ` in ${resolvedLocation}` : ""}.`,
    );

    const country = detectAdzunaCountry(resolvedLocation);
    const discoveredJobs = await searchAdzunaJobs(normalizedTitle, resolvedLocation, country);

    if (discoveredJobs.length === 0) {
      await logAgentMessage(userId, runId, "warning", "Adzuna returned no IT jobs for this search.");
      await finishAgentRun(userId, runId, "completed", 0);

      return {
        success: true,
        data: {
          runId,
          jobsFound: 0,
          jobsSaved: 0,
          strongMatches: 0,
          message: "No matching IT jobs were found. Try a broader title or location.",
          empty: true,
        },
      };
    }

    let jobsSaved = 0;
    let strongMatches = 0;
    let lastSaveFailed = false;
    const insforge = await createInsforgeServer();

    for (const job of discoveredJobs) {
      const matchResult = await matchJobToProfile(job, profile, { userId, runId });

      if (!matchResult.success) {
        continue;
      }

      const record = toJobRecord(
        userId,
        runId,
        job,
        matchResult.match.matchScore,
        matchResult.match.matchReason,
        matchResult.match.matchedSkills,
        matchResult.match.missingSkills,
      );

      const { data, error } = await insforge.database
        .from("jobs")
        .insert([record])
        .select("id")
        .single();

      if (error || !data?.id) {
        lastSaveFailed = true;
        console.error("[agent/adzuna] Job insert error:", error);
        await logAgentMessage(
          userId,
          runId,
          "error",
          `Failed to save ${job.company} — ${job.title}.`,
        );
        continue;
      }

      jobsSaved++;

      if (record.match_score >= MATCH_THRESHOLD) {
        strongMatches++;
      }

      await logAgentMessage(
        userId,
        runId,
        "success",
        `Saved ${job.company} — ${job.title} with a ${record.match_score}% match.`,
        data.id,
      );

      await capturePostHogServerEvent(userId, "job_found", {
        userId,
        source: "search",
        matchScore: record.match_score,
      });
    }

    await finishAgentRun(
      userId,
      runId,
      jobsSaved > 0 ? "completed" : "failed",
      discoveredJobs.length,
    );

    if (jobsSaved === 0) {
      return {
        success: false,
        error: lastSaveFailed
          ? "Jobs were found, but none could be saved. Please try again."
          : "Jobs were found, but none could be scored right now. Please try again.",
        code: lastSaveFailed ? "save_failed" : "temporary_unavailable",
      };
    }

    const message = `Found ${discoveredJobs.length} jobs and saved ${strongMatches} strong matches.`;
    await logAgentMessage(userId, runId, "success", message);

    return {
      success: true,
      data: {
        runId,
        jobsFound: discoveredJobs.length,
        jobsSaved,
        strongMatches,
        message,
        empty: false,
      },
    };
  } catch (error) {
    console.error("[agent/adzuna] Discovery error:", error);

    await logAgentMessage(
      userId,
      runId,
      "error",
      "Job discovery failed while searching Adzuna or saving results.",
    );
    await finishAgentRun(userId, runId, "failed");

    return {
      success: false,
      error: "Failed to find jobs. Please try again in a moment.",
      code: "adzuna_failed",
    };
  }
}
