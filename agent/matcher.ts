import { z } from "zod";

import { isTransientGeminiError, wait } from "@/agent/geminiUtils";
import { logAgentMessage } from "@/agent/logs";
import { createGeminiClient, GEMINI_FAST_MODEL, GEMINI_TEXT_MODEL } from "@/lib/gemini";
import type { NormalizedAdzunaJob } from "@/lib/adzuna";
import type { ProfileData } from "@/lib/utils";

const jobMatchSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  matchReason: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

export type JobMatch = z.infer<typeof jobMatchSchema>;

class JobMatchOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobMatchOutputError";
  }
}

export type MatchJobResult =
  | { success: true; match: JobMatch }
  | {
      success: false;
      error: string;
      code: "temporary_unavailable" | "matching_failed";
    };

type MatchJobOptions = {
  userId: string;
  runId: string | null;
};

const jobMatchJsonSchema = {
  type: "object",
  properties: {
    matchScore: { type: "integer", minimum: 0, maximum: 100 },
    matchReason: { type: "string" },
    matchedSkills: { type: "array", items: { type: "string" } },
    missingSkills: { type: "array", items: { type: "string" } },
  },
  required: ["matchScore", "matchReason", "matchedSkills", "missingSkills"],
  additionalProperties: false,
};

function isJobMatchOutputError(error: unknown): boolean {
  return error instanceof JobMatchOutputError;
}

function parseJobMatchResponse(text: string | undefined): JobMatch {
  const rawText = text?.trim();

  if (!rawText) {
    throw new JobMatchOutputError("Gemini returned empty job match JSON.");
  }

  try {
    return jobMatchSchema.parse(JSON.parse(rawText));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new JobMatchOutputError("Gemini returned malformed job match JSON.");
    }

    throw error;
  }
}

function buildMatchPrompt(job: NormalizedAdzunaJob, profile: ProfileData): string {
  const profileFacts = {
    currentTitle: profile.current_title ?? "",
    experienceLevel: profile.experience_level ?? "",
    yearsExperience: profile.years_experience ?? null,
    skills: profile.skills ?? [],
    industries: profile.industries ?? [],
    jobTitlesSeeking: profile.job_titles_seeking ?? [],
    remotePreference: profile.remote_preference ?? "",
    preferredLocations: profile.preferred_locations ?? [],
    workExperience: profile.work_experience ?? [],
    education: profile.education ?? {},
  };

  const jobFacts = {
    title: job.title,
    company: job.company,
    location: job.location,
    jobType: job.jobType,
    description: job.description,
  };

  return `
Score how well this job matches this JobPilot user's saved profile.

Rules:
- Score 0-100 based on actual overlap between the role and profile.
- Use the Adzuna description as a snippet, not a complete job description.
- Reward matching title direction, level, technical skills, domain fit, and location/remote fit.
- Do not invent requirements, skills, or candidate experience.
- Keep matchReason to one concise paragraph.
- matchedSkills must be skills or experience the user appears to have that match this job.
- missingSkills must be job requirements or likely requirements the user does not clearly show.
- Return JSON only.

Candidate profile:
${JSON.stringify(profileFacts, null, 2)}

Job listing:
${JSON.stringify(jobFacts, null, 2)}
`;
}

async function generateJobMatch(
  job: NormalizedAdzunaJob,
  profile: ProfileData,
): Promise<JobMatch> {
  const gemini = createGeminiClient();
  const modelAttempts = [GEMINI_TEXT_MODEL, GEMINI_TEXT_MODEL, GEMINI_FAST_MODEL];
  const prompt = buildMatchPrompt(job, profile);
  let lastError: unknown = null;

  for (const [index, model] of modelAttempts.entries()) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 700,
          responseMimeType: "application/json",
          responseJsonSchema: jobMatchJsonSchema,
        },
      });

      return parseJobMatchResponse(response.text);
    } catch (error) {
      lastError = error;

      const retryable = isTransientGeminiError(error) || isJobMatchOutputError(error);

      if (!retryable || index === modelAttempts.length - 1) {
        throw error;
      }

      await wait(600 * (index + 1));
    }
  }

  throw lastError;
}

export async function matchJobToProfile(
  job: NormalizedAdzunaJob,
  profile: ProfileData,
  options: MatchJobOptions,
): Promise<MatchJobResult> {
  try {
    const match = await generateJobMatch(job, profile);
    return { success: true, match };
  } catch (error) {
    console.error("[agent/matcher] Job matching error:", error);

    const transient = isTransientGeminiError(error);
    const malformedOutput = isJobMatchOutputError(error);
    await logAgentMessage(
      options.userId,
      options.runId,
      "error",
      transient
        ? `Job matching skipped for ${job.company} because Gemini was temporarily unavailable.`
        : malformedOutput
          ? `Job matching skipped for ${job.company} because Gemini returned malformed structured output after retries.`
        : `Job matching failed for ${job.company}.`,
    );

    if (transient) {
      return {
        success: false,
        error: "The AI service is temporarily busy. Please try finding jobs again in a moment.",
        code: "temporary_unavailable",
      };
    }

    return {
      success: false,
      error: "Failed to score this job against your profile.",
      code: "matching_failed",
    };
  }
}
