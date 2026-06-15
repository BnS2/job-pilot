import { z } from "zod";

import {
  generatedResumeSchema,
  type GeneratedResume,
} from "@/agent/resumeGenerator";
import { extractJsonPayload, isTransientGeminiError, wait } from "@/agent/geminiUtils";
import { logAgentMessage } from "@/agent/logs";
import { companyResearchSchema, type CompanyResearchDossier } from "@/lib/company-research";
import { createGeminiClient, GEMINI_FAST_MODEL, GEMINI_TEXT_MODEL } from "@/lib/gemini";
import type { ProfileData, WorkExperienceData } from "@/lib/utils";

export const tailoredResumeNotesSchema = z.object({
  emphasized: z.array(z.string()).min(1).max(4),
  gapFraming: z.array(z.string()).max(3),
});

const tailoredResumeSchema = generatedResumeSchema.extend({
  tailoringNotes: tailoredResumeNotesSchema,
});

type TailoredResumeOutput = z.infer<typeof tailoredResumeSchema>;
export type TailoredResumeNotes = z.infer<typeof tailoredResumeNotesSchema>;

export type TailoredResumeJobContext = {
  id: string;
  company: string | null;
  title: string | null;
  aboutRole: string | null;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  aboutCompany: string | null;
  matchReason: string | null;
  matchedSkills: string[];
  missingSkills: string[];
  companyResearch: unknown;
};

export type TailorResumeResult =
  | {
      success: true;
      resume: GeneratedResume;
      notes: TailoredResumeNotes;
    }
  | {
      success: false;
      error: string;
      code: "incomplete_profile" | "incomplete_job" | "temporary_unavailable" | "generation_failed";
    };

type TailorResumeOptions = {
  userId: string;
  runId: string | null;
  jobId: string;
};

class ResumeTailoringOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeTailoringOutputError";
  }
}

const tailoredResumeJsonSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    professionalSummary: { type: "string" },
    workExperience: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          dateRange: { type: "string" },
          bullets: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: { type: "string" },
          },
        },
        required: ["company", "title", "dateRange", "bullets"],
        additionalProperties: false,
      },
    },
    skills: {
      type: "array",
      minItems: 1,
      maxItems: 14,
      items: { type: "string" },
    },
    education: {
      type: "array",
      maxItems: 2,
      items: {
        type: "object",
        properties: {
          degree: { type: "string" },
          details: { type: "string" },
        },
        required: ["degree", "details"],
        additionalProperties: false,
      },
    },
    tailoringNotes: {
      type: "object",
      properties: {
        emphasized: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: { type: "string" },
        },
        gapFraming: {
          type: "array",
          maxItems: 3,
          items: { type: "string" },
        },
      },
      required: ["emphasized", "gapFraming"],
      additionalProperties: false,
    },
  },
  required: [
    "headline",
    "professionalSummary",
    "workExperience",
    "skills",
    "education",
    "tailoringNotes",
  ],
  additionalProperties: false,
};

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasMeaningfulWorkExperience(role: WorkExperienceData): boolean {
  return (
    isNonEmptyString(role.company) &&
    isNonEmptyString(role.title) &&
    isNonEmptyString(role.responsibilities)
  );
}

function getProfileValidationError(profile: ProfileData): string | null {
  if (!isNonEmptyString(profile.full_name) && !isNonEmptyString(profile.email)) {
    return "Add your name or email before tailoring a resume.";
  }

  if (!isNonEmptyString(profile.current_title)) {
    return "Add your current job title before tailoring a resume.";
  }

  if (!Array.isArray(profile.skills) || profile.skills.filter(isNonEmptyString).length === 0) {
    return "Add at least one skill before tailoring a resume.";
  }

  if (!(profile.work_experience ?? []).some(hasMeaningfulWorkExperience)) {
    return "Add at least one work experience entry with responsibilities before tailoring a resume.";
  }

  return null;
}

function getJobValidationError(job: TailoredResumeJobContext): string | null {
  if (!isNonEmptyString(job.title) && !isNonEmptyString(job.aboutRole)) {
    return "This job needs a title or description before a resume can be tailored.";
  }

  if (!isNonEmptyString(job.company)) {
    return "This job needs a company name before a resume can be tailored.";
  }

  return null;
}

function parseCompanyResearch(value: unknown): CompanyResearchDossier | null {
  const parsed = companyResearchSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function buildTailoringPrompt(
  profile: ProfileData,
  job: TailoredResumeJobContext,
): string {
  const workExperience = (profile.work_experience ?? [])
    .filter(hasMeaningfulWorkExperience)
    .slice(0, 3)
    .map((role) => ({
      company: role.company,
      title: role.title,
      startDate: role.startDate,
      endDate: role.currentlyWorking ? "Present" : role.endDate,
      responsibilities: role.responsibilities,
    }));

  const companyResearch = parseCompanyResearch(job.companyResearch);
  const profileFacts = {
    name: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    currentTitle: profile.current_title ?? "",
    yearsExperience: profile.years_experience ?? null,
    skills: (profile.skills ?? []).filter(isNonEmptyString),
    industries: (profile.industries ?? []).filter(isNonEmptyString),
    workExperience,
    education: profile.education ?? null,
    linkedinUrl: profile.linkedin_url ?? "",
    portfolioUrl: profile.portfolio_url ?? "",
  };
  const jobFacts = {
    company: job.company ?? "",
    title: job.title ?? "",
    aboutRole: job.aboutRole ?? "",
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    niceToHave: job.niceToHave,
    benefits: job.benefits,
    aboutCompany: job.aboutCompany ?? "",
    matchReason: job.matchReason ?? "",
    matchedSkills: job.matchedSkills,
    missingSkills: job.missingSkills,
    companyResearch,
  };

  return `
Create concise, truthful resume content tailored to the specific job below.

Rules:
- Do not invent employers, projects, tools, degrees, certifications, dates, metrics, locations, links, or credentials.
- Use only facts present in the profile as candidate evidence.
- You may reorder skills, polish wording, and emphasize existing evidence that matches the job.
- Address missing skills honestly through adjacent experience only when the profile supports it.
- Make the summary one paragraph, 35-55 words, targeted to the company and role.
- Keep each work bullet under 22 words.
- Return JSON only, matching the provided schema.

Profile facts:
${JSON.stringify(profileFacts, null, 2)}

Job and company facts:
${JSON.stringify(jobFacts, null, 2)}
`;
}

function parseTailoredResumeResponse(text: string | undefined): TailoredResumeOutput {
  const rawText = text?.trim();

  if (!rawText) {
    throw new ResumeTailoringOutputError("Gemini returned empty tailored resume JSON.");
  }

  try {
    return tailoredResumeSchema.parse(JSON.parse(extractJsonPayload(rawText)));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new ResumeTailoringOutputError("Gemini returned malformed tailored resume JSON.");
    }

    throw error;
  }
}

async function generateTailoredResumeContent(
  profile: ProfileData,
  job: TailoredResumeJobContext,
): Promise<TailoredResumeOutput> {
  const gemini = createGeminiClient();
  const modelAttempts = [GEMINI_TEXT_MODEL, GEMINI_TEXT_MODEL, GEMINI_FAST_MODEL];
  const prompt = buildTailoringPrompt(profile, job);
  let lastError: unknown = null;

  for (const [index, model] of modelAttempts.entries()) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.55,
          maxOutputTokens: 1300,
          responseMimeType: "application/json",
          responseJsonSchema: tailoredResumeJsonSchema,
        },
      });

      return parseTailoredResumeResponse(response.text);
    } catch (error) {
      lastError = error;
      const retryable =
        isTransientGeminiError(error) || error instanceof ResumeTailoringOutputError;

      if (!retryable || index === modelAttempts.length - 1) {
        throw error;
      }

      await wait(700 * (index + 1));
    }
  }

  throw lastError;
}

export async function tailorResumeForJob(
  profile: ProfileData,
  job: TailoredResumeJobContext,
  options: TailorResumeOptions,
): Promise<TailorResumeResult> {
  const profileError = getProfileValidationError(profile);
  if (profileError) {
    return { success: false, error: profileError, code: "incomplete_profile" };
  }

  const jobError = getJobValidationError(job);
  if (jobError) {
    return { success: false, error: jobError, code: "incomplete_job" };
  }

  try {
    const tailored = await generateTailoredResumeContent(profile, job);
    const { tailoringNotes, ...resume } = tailored;

    return {
      success: true,
      resume,
      notes: tailoringNotes,
    };
  } catch (error) {
    console.error("[agent/resumeTailor] Tailoring error:", error);

    const transient = isTransientGeminiError(error);
    const malformedOutput = error instanceof ResumeTailoringOutputError;
    await logAgentMessage(
      options.userId,
      options.runId,
      "error",
      transient
        ? "Resume tailoring failed because Gemini was temporarily unavailable."
        : malformedOutput
          ? "Resume tailoring failed because Gemini returned malformed structured resume content after retries."
          : "Resume tailoring failed while creating structured resume content.",
      options.jobId,
    );

    if (transient) {
      return {
        success: false,
        error: "The AI service is temporarily busy. Please try tailoring again in a moment.",
        code: "temporary_unavailable",
      };
    }

    return {
      success: false,
      error: "Failed to tailor a resume for this job.",
      code: "generation_failed",
    };
  }
}
