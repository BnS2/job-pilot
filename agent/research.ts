import { z } from "zod";

import { fetchWithSafeRedirects, getSafeFetchUrl } from "@/agent/availability";
import { getErrorMessage, isTransientGeminiError, wait } from "@/agent/geminiUtils";
import {
  companyResearchSchema,
  type CompanyResearchDossier,
} from "@/lib/company-research";
import {
  createGeminiClient,
  GEMINI_FAST_MODEL,
  GEMINI_RESEARCH_MODEL,
  GEMINI_TEXT_MODEL,
} from "@/lib/gemini";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import type { ProfileData } from "@/lib/utils";

const employerRedirectTimeoutMs = 5000;

export type ResearchJobRecord = {
  id: string;
  userId: string;
  company: string;
  title: string;
  sourceUrl: string | null;
  externalApplyUrl: string | null;
  aboutRole: string | null;
  matchReason: string | null;
  matchedSkills: string[];
  missingSkills: string[];
  companyResearch: unknown;
};

export type ResolvedEmployerUrls = {
  employerJobUrl: string | null;
  derivedHomepageUrl: string | null;
};

export type CompanyResearchContext =
  | {
      success: true;
      cachedDossier: CompanyResearchDossier | null;
      job: ResearchJobRecord;
      profile: ProfileData;
    }
  | { success: false; error: string };

const companyResearchJsonSchema = {
  type: "object",
  properties: {
    companyOverview: { type: "string" },
    techStack: { type: "array", items: { type: "string" } },
    culture: { type: "array", items: { type: "string" } },
    whyThisRole: { type: "string" },
    yourEdge: { type: "array", items: { type: "string" } },
    gapsToAddress: { type: "array", items: { type: "string" } },
    smartQuestions: { type: "array", items: { type: "string" } },
    interviewPrep: { type: "array", items: { type: "string" } },
    sources: { type: "array", items: { type: "string" } },
  },
  required: [
    "companyOverview",
    "techStack",
    "culture",
    "whyThisRole",
    "yourEdge",
    "gapsToAddress",
    "smartQuestions",
    "interviewPrep",
    "sources",
  ],
  additionalProperties: false,
};

class CompanyResearchOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompanyResearchOutputError";
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeJobRecord(value: unknown): ResearchJobRecord | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = toNullableString(record.id);
  const userId = toNullableString(record.user_id);

  if (!id || !userId) {
    return null;
  }

  return {
    id,
    userId,
    company: toNullableString(record.company) ?? "Unknown company",
    title: toNullableString(record.title) ?? "Untitled role",
    sourceUrl: toNullableString(record.source_url),
    externalApplyUrl: toNullableString(record.external_apply_url),
    aboutRole: toNullableString(record.about_role),
    matchReason: toNullableString(record.match_reason),
    matchedSkills: toStringArray(record.matched_skills),
    missingSkills: toStringArray(record.missing_skills),
    companyResearch: record.company_research,
  };
}

function extractRootDomain(hostname: string): string {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  const parts = normalized.split(".").filter(Boolean);

  if (parts.length <= 2) {
    return normalized;
  }

  const secondLevelTlds = new Set(["co", "com", "org", "net", "ac", "gov"]);
  const suffix = parts.at(-1);
  const secondLevel = parts.at(-2);

  if (suffix && secondLevel && suffix.length === 2 && secondLevelTlds.has(secondLevel)) {
    return parts.slice(-3).join(".");
  }

  return parts.slice(-2).join(".");
}

export async function logResearchMessage(
  userId: string,
  runId: string | null,
  level: "info" | "success" | "warning" | "error",
  message: string,
  jobId: string,
): Promise<void> {
  if (!runId) {
    console.error("[agent/research] Missing run_id for agent log:", message);
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
        job_id: jobId,
      }]);

    if (error) {
      console.error("[agent/research] Failed to write research log:", error);
    }
  } catch (error) {
    console.error("[agent/research] System error writing research log:", error);
  }
}

export async function finishResearchRun(
  userId: string,
  runId: string | null,
  status: "completed" | "failed",
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
      })
      .eq("id", runId)
      .eq("user_id", userId);

    if (error) {
      console.error("[agent/research] Failed to finish research run:", error);
    }
  } catch (error) {
    console.error("[agent/research] System error finishing research run:", error);
  }
}

export async function resolveEmployerUrls(
  job: ResearchJobRecord,
): Promise<ResolvedEmployerUrls> {
  const url = job.externalApplyUrl ?? job.sourceUrl;

  if (!url) {
    return { employerJobUrl: null, derivedHomepageUrl: null };
  }

  const safeUrl = await getSafeFetchUrl(url);

  if (!safeUrl.success) {
    return { employerJobUrl: null, derivedHomepageUrl: null };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), employerRedirectTimeoutMs);

  try {
    const response = await fetchWithSafeRedirects(safeUrl.url, controller.signal);
    const finalUrl = response.url || safeUrl.url.href;
    const parsed = new URL(finalUrl);

    if (parsed.hostname.includes("adzuna.com")) {
      return { employerJobUrl: null, derivedHomepageUrl: null };
    }

    const rootDomain = extractRootDomain(parsed.hostname);

    return {
      employerJobUrl: finalUrl,
      derivedHomepageUrl: `https://${rootDomain}`,
    };
  } catch {
    return { employerJobUrl: null, derivedHomepageUrl: null };
  } finally {
    clearTimeout(timeoutId);
  }
}

function getWebUri(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const web = record.web;

  if (typeof web !== "object" || web === null) {
    return null;
  }

  const uri = (web as Record<string, unknown>).uri;
  return typeof uri === "string" ? uri : null;
}

function extractResearchSources(response: unknown): string[] {
  if (typeof response !== "object" || response === null) {
    return [];
  }

  const record = response as Record<string, unknown>;
  const candidates = Array.isArray(record.candidates) ? record.candidates : [];
  const firstCandidate = candidates[0];

  if (typeof firstCandidate !== "object" || firstCandidate === null) {
    return [];
  }

  const candidate = firstCandidate as Record<string, unknown>;
  const sources = new Set<string>();
  const groundingMetadata = candidate.groundingMetadata;

  if (typeof groundingMetadata === "object" && groundingMetadata !== null) {
    const chunks = (groundingMetadata as Record<string, unknown>).groundingChunks;
    if (Array.isArray(chunks)) {
      for (const chunk of chunks) {
        const uri = getWebUri(chunk);
        if (uri) {
          sources.add(uri);
        }
      }
    }
  }

  const urlContextMetadata = candidate.urlContextMetadata;

  if (typeof urlContextMetadata === "object" && urlContextMetadata !== null) {
    const urlMetadata = (urlContextMetadata as Record<string, unknown>).urlMetadata;
    if (Array.isArray(urlMetadata)) {
      for (const item of urlMetadata) {
        if (typeof item !== "object" || item === null) {
          continue;
        }

        const metadataItem = item as Record<string, unknown>;
        const status = metadataItem.urlRetrievalStatus;
        const retrievedUrl = metadataItem.retrievedUrl;

        if (status === "URL_RETRIEVAL_STATUS_SUCCESS" && typeof retrievedUrl === "string") {
          sources.add(retrievedUrl);
        }
      }
    }
  }

  return Array.from(sources).slice(0, 4);
}

function buildWebResearchPrompt(
  job: ResearchJobRecord,
  employerUrls: ResolvedEmployerUrls,
): string {
  return `
Research the official public web presence for:
Company: ${job.company}
Role: ${job.title}
Known employer job URL: ${employerUrls.employerJobUrl ?? "none"}
Likely homepage: ${employerUrls.derivedHomepageUrl ?? "none"}

Job posting snippet:
${job.aboutRole ?? "No job description snippet available."}

Find the official homepage and up to 3 useful pages for a job candidate:
About, Careers, Blog, Engineering, Product, Team, or Press.

Return concise notes covering what the company does, product, customers or market,
tech signals, culture or values, and a source URL list. Do not use unofficial sites
unless no official site is available, and clearly mark any inferred claims.
`;
}

function buildSynthesisPrompt(input: {
  job: ResearchJobRecord;
  profile: ProfileData;
  researchText: string;
  sourceUrls: string[];
}): string {
  const profileFacts = {
    currentTitle: input.profile.current_title ?? "",
    yearsExperience: input.profile.years_experience ?? null,
    experienceLevel: input.profile.experience_level ?? "",
    skills: input.profile.skills ?? [],
    industries: input.profile.industries ?? [],
    workExperience: input.profile.work_experience ?? [],
    education: input.profile.education ?? {},
  };

  const jobFacts = {
    title: input.job.title,
    company: input.job.company,
    description: input.job.aboutRole ?? "",
    matchReason: input.job.matchReason ?? "",
    matchedSkills: input.job.matchedSkills,
    missingSkills: input.job.missingSkills,
  };

  return `
You are a sharp career strategist preparing a candidate to apply for a specific role.
You are given (a) research collected from the company's own website, (b) the job posting,
and (c) the candidate's profile. Produce a concise, concrete briefing that gives this
specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts.
- If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.
- Sources must be selected from the source URL list below only.
- Return JSON only.

COMPANY RESEARCH:
${input.researchText || "No external research was retrieved. Use only the job posting and profile, and state inferred claims carefully."}

SOURCE URL LIST:
${JSON.stringify(input.sourceUrls, null, 2)}

JOB POSTING:
${JSON.stringify(jobFacts, null, 2)}

CANDIDATE PROFILE:
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

function truncateSentence(value: string, fallback: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return fallback;
  }

  return trimmed.length > 260 ? `${trimmed.slice(0, 257)}...` : trimmed;
}

function buildFallbackDossier(input: {
  job: ResearchJobRecord;
  profile: ProfileData;
  researchText: string;
  sourceUrls: string[];
}): CompanyResearchDossier {
  const skills = input.profile.skills?.filter(Boolean).slice(0, 5) ?? [];
  const matchedSkills = input.job.matchedSkills.slice(0, 5);
  const missingSkills = input.job.missingSkills.slice(0, 4);
  const roleDescription = truncateSentence(
    input.job.aboutRole ?? "",
    "The available job posting is limited, so this briefing is based on the role title, company name, and your saved profile.",
  );
  const researchSummary = truncateSentence(
    input.researchText,
    "External company research was limited, so company claims should be treated as inferred until verified on the employer site.",
  );

  return {
    companyOverview: `${input.job.company} is the company behind this ${input.job.title} role. ${researchSummary}`,
    techStack:
      matchedSkills.length > 0
        ? matchedSkills
        : skills.length > 0
          ? skills
          : ["Review the job post for explicit technical requirements before applying."],
    culture: [
      "Use the official company site and job post to verify team values before interviews.",
      "Frame any culture comments as observations from the posting unless confirmed by a source.",
    ],
    whyThisRole: roleDescription,
    yourEdge:
      matchedSkills.length > 0
        ? matchedSkills.map((skill) => `Lead with your ${skill} experience when discussing fit for this role.`)
        : ["Connect your strongest recent project directly to the role responsibilities in the posting."],
    gapsToAddress:
      missingSkills.length > 0
        ? missingSkills.map((skill) => `Prepare an honest bridge for ${skill}: name adjacent experience and how you would ramp up.`)
        : ["No obvious missing skills were identified from the saved match data."],
    smartQuestions: [
      `What business or product priority made this ${input.job.title} role important now?`,
      "Which technical or team challenges should the person in this role be ready to own first?",
    ],
    interviewPrep: [
      "Prepare one concise story showing impact with the strongest matched skill from this role.",
      "Review the employer's official site before applying so source-specific details can replace inferred notes.",
    ],
    sources: input.sourceUrls.slice(0, 4),
  };
}

export async function runWebResearch(
  job: ResearchJobRecord,
  employerUrls: ResolvedEmployerUrls,
): Promise<{ researchText: string; sourceUrls: string[] }> {
  const gemini = createGeminiClient();
  const response = await gemini.models.generateContent({
    model: GEMINI_RESEARCH_MODEL,
    contents: buildWebResearchPrompt(job, employerUrls),
    config: {
      tools: [{ googleSearch: {} }, { urlContext: {} }],
    },
  });

  return {
    researchText: response.text ?? "",
    sourceUrls: extractResearchSources(response),
  };
}

function parseDossier(text: string | undefined): CompanyResearchDossier {
  const rawText = text?.trim();

  if (!rawText) {
    throw new CompanyResearchOutputError("Gemini returned empty company research JSON.");
  }

  try {
    return companyResearchSchema.parse(JSON.parse(extractJsonPayload(rawText)));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new CompanyResearchOutputError("Gemini returned malformed company research JSON.");
    }

    throw error;
  }
}

export async function synthesizeDossier(input: {
  job: ResearchJobRecord;
  profile: ProfileData;
  researchText: string;
  sourceUrls: string[];
}): Promise<CompanyResearchDossier> {
  const gemini = createGeminiClient();
  const modelAttempts = [GEMINI_TEXT_MODEL, GEMINI_TEXT_MODEL, GEMINI_FAST_MODEL];

  for (const [index, model] of modelAttempts.entries()) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: buildSynthesisPrompt(input),
        config: {
          temperature: 0.4,
          maxOutputTokens: 1000,
          responseMimeType: "application/json",
          responseJsonSchema: companyResearchJsonSchema,
        },
      });

      const dossier = parseDossier(response.text);
      const allowedSources = new Set(input.sourceUrls);

      return {
        ...dossier,
        sources: dossier.sources.filter((source) => allowedSources.has(source)).slice(0, 4),
      };
    } catch (error) {
      const retryable =
        isTransientGeminiError(error) || error instanceof CompanyResearchOutputError;

      if (!retryable) {
        throw error;
      }

      if (index === modelAttempts.length - 1) {
        if (error instanceof CompanyResearchOutputError) {
          return buildFallbackDossier(input);
        }

        throw error;
      }

      await wait(600 * (index + 1));
    }
  }

  throw new CompanyResearchOutputError("Synthesis retries exhausted.");
}

export async function loadCompanyResearchContext(
  jobId: string,
  userId: string,
  runId: string | null,
): Promise<CompanyResearchContext> {
  const insforge = createInsforgeAdmin();
  const { data: jobData, error: jobError } = await insforge.database
    .from("jobs")
    .select(
      "id,user_id,company,title,source_url,external_apply_url,about_role,match_reason,matched_skills,missing_skills,company_research",
    )
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  const job = normalizeJobRecord(jobData);

  if (jobError || !job) {
    await logResearchMessage(
      userId,
      runId,
      "error",
      "Company research failed because the job could not be loaded.",
      jobId,
    );
    await finishResearchRun(userId, runId, "failed");
    return { success: false, error: "Job not found." };
  }

  const cached = companyResearchSchema.safeParse(job.companyResearch);
  if (cached.success) {
    await finishResearchRun(userId, runId, "completed");
    return {
      success: true,
      cachedDossier: cached.data,
      job,
      profile: {},
    };
  }

  const { data: profileData, error: profileError } = await insforge.database
    .from("profiles")
    .select(
      "id,current_title,years_experience,experience_level,skills,industries,work_experience,education",
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profileData) {
    await logResearchMessage(
      userId,
      runId,
      "error",
      `Company research failed for ${job.company} because the profile could not be loaded.`,
      jobId,
    );
    await finishResearchRun(userId, runId, "failed");
    return { success: false, error: "Profile not found." };
  }

  return {
    success: true,
    cachedDossier: null,
    job,
    profile: profileData as ProfileData,
  };
}

export async function saveCompanyResearchSuccess(input: {
  dossier: CompanyResearchDossier;
  job: ResearchJobRecord;
  jobId: string;
  runId: string | null;
  userId: string;
}): Promise<void> {
  const insforge = createInsforgeAdmin();
  const now = new Date().toISOString();
  const { error: updateError } = await insforge.database
    .from("jobs")
    .update({
      company_research: input.dossier,
      company_research_status: "completed",
      company_research_error: null,
      company_research_started_at: null,
      company_researched_at: now,
    })
    .eq("id", input.jobId)
    .eq("user_id", input.userId);

  if (updateError) {
    throw new Error("Failed to save company research dossier.");
  }

  await logResearchMessage(
    input.userId,
    input.runId,
    "success",
    `Company research completed for ${input.job.company}.`,
    input.jobId,
  );
  await finishResearchRun(input.userId, input.runId, "completed");
  await capturePostHogServerEvent(input.userId, "company_researched", {
    userId: input.userId,
    jobId: input.jobId,
    company: input.job.company,
  });
}

export async function saveCompanyResearchFailure(input: {
  error: unknown;
  jobId: string;
  runId: string | null;
  userId: string;
}): Promise<{ success: false; error: string }> {
  const message = isTransientGeminiError(input.error)
    ? "The AI research service is temporarily busy. Please try again in a moment."
    : "Company research could not be completed. Please try again.";

  try {
    const insforge = createInsforgeAdmin();
    const { error: updateError } = await insforge.database
      .from("jobs")
      .update({
        company_research_status: "failed",
        company_research_error: message,
        company_research_started_at: null,
      })
      .eq("id", input.jobId)
      .eq("user_id", input.userId);

    if (updateError) {
      console.error("[agent/research] Failed to persist research failure:", updateError);
    }
  } catch (persistError) {
    console.error("[agent/research] System error persisting research failure:", persistError);
  }

  await logResearchMessage(
    input.userId,
    input.runId,
    "error",
    `Company research failed: ${getErrorMessage(input.error)}`,
    input.jobId,
  );
  await finishResearchRun(input.userId, input.runId, "failed");

  return { success: false, error: message };
}
