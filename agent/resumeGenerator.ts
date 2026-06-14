import { z } from "zod";

import { isTransientGeminiError, wait } from "@/agent/geminiUtils";
import { logAgentMessage } from "@/agent/logs";
import { createGeminiClient, GEMINI_FAST_MODEL, GEMINI_TEXT_MODEL } from "@/lib/gemini";
import type { EducationData, ProfileData, WorkExperienceData } from "@/lib/utils";

const resumeExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  dateRange: z.string(),
  bullets: z.array(z.string()).min(1).max(4),
});

const resumeEducationSchema = z.object({
  degree: z.string(),
  details: z.string(),
});

export const generatedResumeSchema = z.object({
  headline: z.string(),
  professionalSummary: z.string(),
  workExperience: z.array(resumeExperienceSchema).min(1).max(3),
  skills: z.array(z.string()).min(1).max(14),
  education: z.array(resumeEducationSchema).max(2),
});

export type GeneratedResume = z.infer<typeof generatedResumeSchema>;

export type GenerateResumeResult =
  | { success: true; resume: GeneratedResume }
  | {
      success: false;
      error: string;
      code: "incomplete_profile" | "temporary_unavailable" | "generation_failed";
    };

type GenerateResumeOptions = {
  userId: string;
  runId: string | null;
};

class ResumeGenerationOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeGenerationOutputError";
  }
}

function isResumeGenerationOutputError(error: unknown): boolean {
  return error instanceof ResumeGenerationOutputError;
}

const resumeJsonSchema = {
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
  },
  required: [
    "headline",
    "professionalSummary",
    "workExperience",
    "skills",
    "education",
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

function summarizeEducation(education: EducationData | null | undefined): string | null {
  if (!education) {
    return null;
  }

  const parts = [
    education.degree,
    education.fieldOfStudy,
    education.institution,
    education.graduationYear,
  ].filter(isNonEmptyString);

  return parts.length > 0 ? parts.join(", ") : null;
}

function getProfileValidationError(profile: ProfileData): string | null {
  if (!isNonEmptyString(profile.full_name) && !isNonEmptyString(profile.email)) {
    return "Add your name or email before generating a resume.";
  }

  if (!isNonEmptyString(profile.current_title)) {
    return "Add your current job title before generating a resume.";
  }

  if (!Array.isArray(profile.skills) || profile.skills.filter(isNonEmptyString).length === 0) {
    return "Add at least one skill before generating a resume.";
  }

  const workExperience = profile.work_experience ?? [];
  if (!workExperience.some(hasMeaningfulWorkExperience)) {
    return "Add at least one work experience entry with responsibilities before generating a resume.";
  }

  return null;
}

function buildResumePrompt(profile: ProfileData): string {
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
    education: summarizeEducation(profile.education),
    linkedinUrl: profile.linkedin_url ?? "",
    portfolioUrl: profile.portfolio_url ?? "",
  };

  return `
Create concise, professional resume content from the saved JobPilot profile facts below.

Rules:
- Do not invent employers, dates, degrees, skills, locations, links, metrics, tools, or credentials.
- You may polish wording, combine overlapping ideas, and make responsibilities more resume-ready.
- Keep the resume targeted to software/technical roles when the profile supports it.
- Make the professional summary one paragraph, 35-55 words.
- Keep each work bullet under 22 words.
- Use only facts present in the profile; if a detail is missing, omit it.
- Return JSON only, matching the provided schema.

Profile facts:
${JSON.stringify(profileFacts, null, 2)}
`;
}

function extractJsonPayload(text: string): string {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? text.trim();

  if (candidate.startsWith("{") && candidate.endsWith("}")) {
    return candidate;
  }

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return candidate.slice(firstBrace, lastBrace + 1);
  }

  return candidate;
}

function parseGeneratedResumeResponse(text: string | undefined): GeneratedResume {
  const rawText = text?.trim();

  if (!rawText) {
    throw new ResumeGenerationOutputError("Gemini returned empty resume generation JSON.");
  }

  try {
    return generatedResumeSchema.parse(JSON.parse(extractJsonPayload(rawText)));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new ResumeGenerationOutputError("Gemini returned malformed resume generation JSON.");
    }

    throw error;
  }
}

async function generateResumeContent(profile: ProfileData): Promise<GeneratedResume> {
  const gemini = createGeminiClient();
  const modelAttempts = [GEMINI_TEXT_MODEL, GEMINI_TEXT_MODEL, GEMINI_FAST_MODEL];
  const prompt = buildResumePrompt(profile);
  let lastError: unknown = null;

  for (const [index, model] of modelAttempts.entries()) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
          responseJsonSchema: resumeJsonSchema,
        },
      });

      return parseGeneratedResumeResponse(response.text);
    } catch (error) {
      lastError = error;

      const retryable =
        isTransientGeminiError(error) || isResumeGenerationOutputError(error);

      if (!retryable || index === modelAttempts.length - 1) {
        throw error;
      }

      await wait(600 * (index + 1));
    }
  }

  throw lastError;
}

export async function generateResumeFromProfile(
  profile: ProfileData,
  options: GenerateResumeOptions,
): Promise<GenerateResumeResult> {
  const validationError = getProfileValidationError(profile);

  if (validationError) {
    return {
      success: false,
      error: validationError,
      code: "incomplete_profile",
    };
  }

  try {
    const resume = await generateResumeContent(profile);
    return { success: true, resume };
  } catch (error) {
    console.error("[agent/resumeGenerator] Generation error:", error);

    const transient = isTransientGeminiError(error);
    const malformedOutput = isResumeGenerationOutputError(error);
    await logAgentMessage(
      options.userId,
      options.runId,
      "error",
      transient
        ? "Resume generation failed because Gemini was temporarily unavailable."
        : malformedOutput
          ? "Resume generation failed because Gemini returned malformed structured resume content after retries."
          : "Resume generation failed while creating structured resume content.",
    );

    if (transient) {
      return {
        success: false,
        error: "The AI service is temporarily busy. Please try generating again in a moment.",
        code: "temporary_unavailable",
      };
    }

    return {
      success: false,
      error: "Failed to generate resume content from this profile.",
      code: "generation_failed",
    };
  }
}
