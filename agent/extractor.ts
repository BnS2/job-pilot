import { z } from "zod";

import { logAgentMessage } from "@/agent/logs";
import { createGeminiClient, GEMINI_FAST_MODEL, GEMINI_TEXT_MODEL } from "@/lib/gemini";

const experienceLevelSchema = z.enum(["junior", "mid", "senior", "lead"]);
const workAuthorizationSchema = z.enum([
  "citizen",
  "permanent_resident",
  "visa_required",
]);
const remotePreferenceSchema = z.enum(["remote", "onsite", "hybrid", "any"]);
const coverLetterToneSchema = z.enum(["", "formal", "casual", "enthusiastic"]);
const degreeSchema = z.enum(["high_school", "bachelors", "masters"]);

const workExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  currentlyWorking: z.boolean(),
  responsibilities: z.string(),
});

const educationSchema = z.object({
  degree: degreeSchema,
  fieldOfStudy: z.string(),
  institution: z.string(),
  graduationYear: z.string(),
});

export const extractedProfileSchema = z.object({
  full_name: z.string(),
  phone: z.string(),
  location: z.string(),
  work_authorization: workAuthorizationSchema,
  current_title: z.string(),
  experience_level: experienceLevelSchema,
  years_experience: z.number().int().min(0).max(60).nullable(),
  skills: z.array(z.string()),
  industries: z.array(z.string()),
  work_experience: z.array(workExperienceSchema).max(3),
  education: educationSchema,
  job_titles_seeking: z.array(z.string()),
  remote_preference: remotePreferenceSchema,
  preferred_locations: z.array(z.string()),
  salary_expectation: z.string(),
  cover_letter_tone: coverLetterToneSchema,
  linkedin_url: z.string(),
  portfolio_url: z.string(),
});

export type ExtractedProfileData = z.infer<typeof extractedProfileSchema>;

export type ExtractProfileResult =
  | { success: true; profile: ExtractedProfileData }
  | {
      success: false;
      error: string;
      code: "invalid_resume_text" | "temporary_unavailable" | "extraction_failed";
    };

type ExtractProfileOptions = {
  userId: string;
  runId: string | null;
};

const profileJsonSchema = {
  type: "object",
  properties: {
    full_name: { type: "string" },
    phone: { type: "string" },
    location: { type: "string" },
    work_authorization: {
      type: "string",
      enum: ["citizen", "permanent_resident", "visa_required"],
    },
    current_title: { type: "string" },
    experience_level: {
      type: "string",
      enum: ["junior", "mid", "senior", "lead"],
    },
    years_experience: {
      anyOf: [
        { type: "integer", minimum: 0, maximum: 60 },
        { type: "null" },
      ],
    },
    skills: { type: "array", items: { type: "string" } },
    industries: { type: "array", items: { type: "string" } },
    work_experience: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          currentlyWorking: { type: "boolean" },
          responsibilities: { type: "string" },
        },
        required: [
          "company",
          "title",
          "startDate",
          "endDate",
          "currentlyWorking",
          "responsibilities",
        ],
        additionalProperties: false,
      },
    },
    education: {
      type: "object",
      properties: {
        degree: {
          type: "string",
          enum: ["high_school", "bachelors", "masters"],
        },
        fieldOfStudy: { type: "string" },
        institution: { type: "string" },
        graduationYear: { type: "string" },
      },
      required: ["degree", "fieldOfStudy", "institution", "graduationYear"],
      additionalProperties: false,
    },
    job_titles_seeking: { type: "array", items: { type: "string" } },
    remote_preference: {
      type: "string",
      enum: ["remote", "onsite", "hybrid", "any"],
    },
    preferred_locations: { type: "array", items: { type: "string" } },
    salary_expectation: { type: "string" },
    cover_letter_tone: {
      type: "string",
      enum: ["", "formal", "casual", "enthusiastic"],
    },
    linkedin_url: { type: "string" },
    portfolio_url: { type: "string" },
  },
  required: [
    "full_name",
    "phone",
    "location",
    "work_authorization",
    "current_title",
    "experience_level",
    "years_experience",
    "skills",
    "industries",
    "work_experience",
    "education",
    "job_titles_seeking",
    "remote_preference",
    "preferred_locations",
    "salary_expectation",
    "cover_letter_tone",
    "linkedin_url",
    "portfolio_url",
  ],
  additionalProperties: false,
};

function buildExtractionPrompt(resumeText: string): string {
  return `
Extract a structured JobPilot profile from the resume text below.

Rules:
- Return only fields that can reasonably be inferred from the resume.
- Use empty strings or empty arrays when a field is absent.
- Do not invent employers, education, links, salary, locations, or authorization.
- Map experience_level to one of: junior, mid, senior, lead.
- Map work_authorization to citizen, permanent_resident, or visa_required only when explicit; otherwise use citizen.
- Map remote_preference to remote, onsite, hybrid, or any. Use any when absent.
- Map education.degree to high_school, bachelors, or masters. Use bachelors only when a degree is present but ambiguous.
- Keep work_experience to the three most recent or strongest roles.
- Keep responsibilities concise but specific, preserving achievements when present.
- Infer job_titles_seeking from current/recent titles and resume positioning when available.
- cover_letter_tone should be an empty string unless the resume explicitly signals formal, casual, or enthusiastic tone preference.

Resume text:
${resumeText}
`;
}

function getErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }

  const status = error.status;
  return typeof status === "number" ? status : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isTransientGeminiError(error: unknown): boolean {
  const status = getErrorStatus(error);

  if (status && [408, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return message.includes("unavailable") || message.includes("high demand");
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function generateExtractedProfile(resumeText: string): Promise<ExtractedProfileData> {
  const gemini = createGeminiClient();
  const modelAttempts = [GEMINI_TEXT_MODEL, GEMINI_TEXT_MODEL, GEMINI_FAST_MODEL];
  let lastError: unknown = null;

  for (const [index, model] of modelAttempts.entries()) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: buildExtractionPrompt(resumeText),
        config: {
          temperature: 0.2,
          maxOutputTokens: 1000,
          responseMimeType: "application/json",
          responseJsonSchema: profileJsonSchema,
        },
      });

      return extractedProfileSchema.parse(JSON.parse(response.text ?? "{}"));
    } catch (error) {
      lastError = error;

      if (!isTransientGeminiError(error) || index === modelAttempts.length - 1) {
        throw error;
      }

      await wait(600 * (index + 1));
    }
  }

  throw lastError;
}

export async function extractProfileFromResumeText(
  resumeText: string,
  options: ExtractProfileOptions,
): Promise<ExtractProfileResult> {
  try {
    const normalizedText = resumeText.replace(/\s+/g, " ").trim();

    if (normalizedText.length < 160) {
      return {
        success: false,
        error: "Could not extract text from this PDF. Please try a different file.",
        code: "invalid_resume_text",
      };
    }

    const parsed = await generateExtractedProfile(normalizedText.slice(0, 30000));

    return { success: true, profile: parsed };
  } catch (error) {
    console.error("[agent/extractor] Extraction error:", error);

    const transient = isTransientGeminiError(error);
    await logAgentMessage(
      options.userId,
      options.runId,
      "error",
      transient
        ? "Resume extraction failed because Gemini was temporarily unavailable."
        : "Resume extraction failed while generating structured profile data.",
    );

    if (transient) {
      return {
        success: false,
        error: "The AI service is temporarily busy. Please try extracting again in a moment.",
        code: "temporary_unavailable",
      };
    }

    return {
      success: false,
      error: "Failed to extract profile details from this resume.",
      code: "extraction_failed",
    };
  }
}
