import { isTransientGeminiError, wait } from "@/agent/geminiUtils";
import { matchJobToProfile } from "@/agent/matcher";
import { finishAgentRun, logAgentMessage, startJobDiscoveryRun } from "@/agent/logs";
import {
  dedupeAdzunaJobs,
  detectAdzunaCountry,
  isSupportedAdzunaFallbackLocation,
  searchAdzunaJobs,
  type NormalizedAdzunaJob,
} from "@/lib/adzuna";
import { createGeminiClient, GEMINI_FAST_MODEL, GEMINI_TEXT_MODEL } from "@/lib/gemini";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import { MATCH_STRONG_THRESHOLD, type ProfileData } from "@/lib/utils";

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
  runId?: string | null;
};

type JobInsertRecord = {
  user_id: string;
  run_id: string | null;
  source_job_id: string;
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
  last_seen_at: string;
  status: "active";
  unavailable_at: null;
  status_reason: null;
};

type ExistingJobRecord = {
  id: string;
  status: string | null;
};

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasMatchingSignal(profile: ProfileData): boolean {
  const hasRoleSignal =
    hasText(profile.current_title) ||
    Boolean(profile.job_titles_seeking?.some(hasText)) ||
    Boolean(profile.work_experience?.some((role) => hasText(role.title)));

  const hasSkillSignal =
    Boolean(profile.skills?.some(hasText)) ||
    Boolean(profile.work_experience?.some((role) => hasText(role.responsibilities)));

  return hasRoleSignal && hasSkillSignal;
}

export function resolveSearchLocation(
  requestedLocation: string,
  profile: ProfileData,
): string {
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
  const now = new Date().toISOString();

  return {
    user_id: userId,
    run_id: runId,
    source_job_id: job.id,
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
    found_at: now,
    last_seen_at: now,
    status: "active",
    unavailable_at: null,
    status_reason: null,
  };
}

function shouldRestoreToActive(status: string | null): boolean {
  return status === null || status === "unavailable";
}

async function findExistingJob(
  userId: string,
  sourceJobId: string,
  sourceUrl: string,
): Promise<ExistingJobRecord | null> {
  const insforge = createInsforgeAdmin();

  if (sourceJobId.trim()) {
    const { data, error } = await insforge.database
      .from("jobs")
      .select("id,status")
      .eq("user_id", userId)
      .eq("source", "search")
      .eq("source_job_id", sourceJobId)
      .maybeSingle();

    if (error) {
      console.error("[agent/adzuna] Existing job lookup by provider ID failed:", error);
    } else if (data?.id) {
      return {
        id: String(data.id),
        status: typeof data.status === "string" ? data.status : null,
      };
    }
  }

  for (const urlColumn of ["source_url", "external_apply_url"]) {
    const { data, error } = await insforge.database
      .from("jobs")
      .select("id,status")
      .eq("user_id", userId)
      .eq("source", "search")
      .eq(urlColumn, sourceUrl)
      .maybeSingle();

    if (error) {
      console.error(`[agent/adzuna] Existing job lookup by ${urlColumn} failed:`, error);
      continue;
    }

    if (data?.id) {
      return {
        id: String(data.id),
        status: typeof data.status === "string" ? data.status : null,
      };
    }
  }

  return null;
}

async function saveOrRefreshJob(record: JobInsertRecord): Promise<string | null> {
  const insforge = createInsforgeAdmin();
  const existingJob = await findExistingJob(
    record.user_id,
    record.source_job_id,
    record.source_url,
  );

  if (existingJob) {
    const statusUpdate = shouldRestoreToActive(existingJob.status)
      ? {
          status: "active",
          unavailable_at: null,
          status_reason: null,
        }
      : {};

    const { data, error } = await insforge.database
      .from("jobs")
      .update({
        run_id: record.run_id,
        source_job_id: record.source_job_id,
        source_url: record.source_url,
        external_apply_url: record.external_apply_url,
        title: record.title,
        company: record.company,
        location: record.location,
        salary: record.salary,
        job_type: record.job_type,
        about_role: record.about_role,
        responsibilities: record.responsibilities,
        requirements: record.requirements,
        nice_to_have: record.nice_to_have,
        benefits: record.benefits,
        about_company: record.about_company,
        match_score: record.match_score,
        match_reason: record.match_reason,
        matched_skills: record.matched_skills,
        missing_skills: record.missing_skills,
        last_seen_at: record.last_seen_at,
        ...statusUpdate,
      })
      .eq("id", existingJob.id)
      .eq("user_id", record.user_id)
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("[agent/adzuna] Job refresh error:", error);
      return null;
    }

    return String(data.id);
  }

  const { data, error } = await insforge.database
    .from("jobs")
    .insert([record])
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[agent/adzuna] Job insert error:", error);
    return null;
  }

  return String(data.id);
}

export async function discoverJobsFromAdzuna({
  userId,
  jobTitle,
  requestedLocation,
  profile,
  runId: existingRunId,
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
  const runId =
    existingRunId ??
    await startJobDiscoveryRun(userId, normalizedTitle, resolvedLocation || null);

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

      const savedJobId = await saveOrRefreshJob(record);

      if (!savedJobId) {
        lastSaveFailed = true;
        await logAgentMessage(
          userId,
          runId,
          "error",
          `Failed to save ${job.company} — ${job.title}.`,
        );
        continue;
      }

      jobsSaved++;

      if (record.match_score >= MATCH_STRONG_THRESHOLD) {
        strongMatches++;
      }

      await logAgentMessage(
        userId,
        runId,
        "success",
        `Saved ${job.company} — ${job.title} with a ${record.match_score}% match.`,
        savedJobId,
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

    const message = `Found ${discoveredJobs.length} jobs, saved ${jobsSaved} jobs (${strongMatches} strong matches).`;
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

async function generateSearchQueryVariant(
  profile: ProfileData,
  primaryRole: string,
): Promise<string | null> {
  const skills = (profile.skills ?? []).filter(hasText).slice(0, 5);
  const industries = (profile.industries ?? []).filter(hasText).slice(0, 3);
  const yearsExperience = typeof profile.years_experience === "number" ? profile.years_experience : null;
  const experienceLevel = profile.experience_level ?? "";

  const profileSummary = {
    role: primaryRole,
    skills: skills.join(", "),
    industries: industries.join(", "),
    ...(yearsExperience !== null ? { yearsExperience } : {}),
    ...(experienceLevel ? { experienceLevel } : {}),
  };

  const prompt = `You are helping a job seeker find relevant IT jobs on a job board.
Given this profile, suggest ONE alternative search query (3-6 words) that might surface different relevant IT positions.
Use different keyword combinations than "${primaryRole}".
Return only the query string, no explanation, no quotes, no JSON.

Candidate profile:
${JSON.stringify(profileSummary, null, 2)}`;

  const gemini = createGeminiClient();
  const modelAttempts = [GEMINI_FAST_MODEL, GEMINI_TEXT_MODEL];

  for (const [index, model] of modelAttempts.entries()) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.5,
          maxOutputTokens: 50,
        },
      });

      const query = response.text?.trim();

      if (!query || query.length < 3 || query.length > 120) {
        return null;
      }

      return query;
    } catch (error) {
      const retryable = isTransientGeminiError(error);

      if (!retryable || index === modelAttempts.length - 1) {
        if (retryable) {
          console.error("[agent/adzuna] Query variant generation failed (transient):", error);
        } else {
          console.error("[agent/adzuna] Query variant generation failed:", error);
        }
        return null;
      }

      await wait(600 * (index + 1));
    }
  }

  return null;
}

type DiscoverFromProfileInput = {
  userId: string;
  requestedLocation: string;
  profile: ProfileData;
  runId: string | null;
};

export async function discoverJobsFromProfile({
  userId,
  requestedLocation,
  profile,
  runId: existingRunId,
}: DiscoverFromProfileInput): Promise<DiscoverJobsResult> {
  if (!hasMatchingSignal(profile)) {
    return {
      success: false,
      error: "Complete your profile with a target role, skills, and work experience before using Best Match.",
      code: "incomplete_profile",
    };
  }

  const primaryRole =
    profile.job_titles_seeking?.find(hasText) ??
    profile.current_title?.trim() ??
    "";

  if (!primaryRole) {
    return {
      success: false,
      error: "Add a target role to your profile before using Best Match.",
      code: "incomplete_profile",
    };
  }

  const resolvedLocation = resolveSearchLocation(requestedLocation, profile);
  const runId =
    existingRunId ??
    await startJobDiscoveryRun(userId, "Best Match", resolvedLocation || null, "profile_best_match");

  try {
    await logAgentMessage(
      userId,
      runId,
      "info",
      `Best Match discovery started for "${primaryRole}"${resolvedLocation ? ` in ${resolvedLocation}` : ""}.`,
    );

    const topSkills = (profile.skills ?? []).filter(hasText).slice(0, 3);
    const baseQuery = topSkills.length > 0
      ? `${primaryRole} ${topSkills.join(" ")}`
      : primaryRole;

    const queries: string[] = [baseQuery];

    const hasRichProfile =
      (profile.skills ?? []).filter(hasText).length >= 3 &&
      (profile.work_experience ?? []).length > 0;

    if (hasRichProfile) {
      await logAgentMessage(userId, runId, "info", "Generating alternative search queries from your profile.");
      const variant = await generateSearchQueryVariant(profile, primaryRole);
      if (variant && !queries.includes(variant)) {
        queries.push(variant);
      }
    }

    const searchQueries = queries.slice(0, 2);
    await logAgentMessage(
      userId,
      runId,
      "info",
      `Searching with queries: ${searchQueries.map((q) => `"${q}"`).join(", ")}`,
    );

    const allJobs: NormalizedAdzunaJob[] = [];
    for (const query of searchQueries) {
      try {
        const country = detectAdzunaCountry(resolvedLocation);
        const jobs = await searchAdzunaJobs(query, resolvedLocation, country);
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`[agent/adzuna] Best Match search failed for query "${query}":`, error);
        await logAgentMessage(userId, runId, "warning", `Search failed for "${query}". Continuing with remaining queries.`);
      }
    }

    if (allJobs.length === 0) {
      await logAgentMessage(userId, runId, "warning", "No IT jobs found for your profile-based search.");
      await finishAgentRun(userId, runId, "completed", 0);

      return {
        success: true,
        data: {
          runId,
          jobsFound: 0,
          jobsSaved: 0,
          strongMatches: 0,
          message: "No matching IT jobs were found for your profile. Try broadening your skills or target role.",
          empty: true,
        },
      };
    }

    const dedupedJobs = dedupeAdzunaJobs(allJobs);
    const scoredJobs = dedupedJobs.slice(0, 10);

    await logAgentMessage(
      userId,
      runId,
      "info",
      `Found ${dedupedJobs.length} unique jobs. Scoring top ${scoredJobs.length}.`,
    );

    let jobsSaved = 0;
    let strongMatches = 0;
    let lastSaveFailed = false;

    for (const job of scoredJobs) {
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

      const savedJobId = await saveOrRefreshJob(record);

      if (!savedJobId) {
        lastSaveFailed = true;
        await logAgentMessage(
          userId,
          runId,
          "error",
          `Failed to save ${job.company} — ${job.title}.`,
        );
        continue;
      }

      jobsSaved++;

      if (record.match_score >= MATCH_STRONG_THRESHOLD) {
        strongMatches++;
      }

      await logAgentMessage(
        userId,
        runId,
        "success",
        `Saved ${job.company} — ${job.title} with a ${record.match_score}% match.`,
        savedJobId,
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
      dedupedJobs.length,
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

    const message = `Found ${dedupedJobs.length} jobs, saved ${jobsSaved} jobs (${strongMatches} strong matches).`;
    await logAgentMessage(userId, runId, "success", message);

    return {
      success: true,
      data: {
        runId,
        jobsFound: dedupedJobs.length,
        jobsSaved,
        strongMatches,
        message,
        empty: false,
      },
    };
  } catch (error) {
    console.error("[agent/adzuna] Best Match discovery error:", error);

    await logAgentMessage(
      userId,
      runId,
      "error",
      "Best Match discovery failed while searching Adzuna or saving results.",
    );
    await finishAgentRun(userId, runId, "failed");

    return {
      success: false,
      error: "Failed to find jobs. Please try again in a moment.",
      code: "adzuna_failed",
    };
  }
}
