import { createHash } from "node:crypto";

import { z } from "zod";

import { fetchWithSafeRedirects, getSafeFetchUrl } from "@/agent/availability";
import { isTransientGeminiError, wait } from "@/agent/geminiUtils";
import {
  completeAgentRunWithResult,
  failAgentRun,
  logAgentMessage,
  startJobUrlImportRun,
} from "@/agent/logs";
import { matchJobToProfile } from "@/agent/matcher";
import { createGeminiClient, GEMINI_FAST_MODEL, GEMINI_TEXT_MODEL } from "@/lib/gemini";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import { getJobSourceProvider, getSourceProviderLabel } from "@/lib/job-source";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import { MATCH_STRONG_THRESHOLD, type ProfileData } from "@/lib/utils";

const IMPORT_TIMEOUT_MS = 12_000;
const MAX_IMPORT_BYTES = 400_000;
const MAX_TEXT_CHARS = 18_000;
const MIN_TEXT_CHARS = 180;

const jobExtractionSchema = z.object({
  isJobPosting: z.boolean(),
  title: z.string().trim().max(180).nullable(),
  company: z.string().trim().max(180).nullable(),
  location: z.string().trim().max(180).nullable(),
  salary: z.string().trim().max(180).nullable(),
  jobType: z.enum(["fulltime", "parttime", "contract"]).nullable(),
  aboutRole: z.string().trim().max(5000).nullable(),
  responsibilities: z.array(z.string().trim().max(280)).max(12),
  requirements: z.array(z.string().trim().max(280)).max(12),
  niceToHave: z.array(z.string().trim().max(280)).max(10),
  benefits: z.array(z.string().trim().max(280)).max(10),
  aboutCompany: z.string().trim().max(2500).nullable(),
  externalApplyUrl: z.string().trim().max(2000).nullable(),
});

type JobExtraction = z.infer<typeof jobExtractionSchema>;

type ImportUrlInput = {
  userId: string;
  url: string;
  pageText?: string | null;
  profile: ProfileData;
  runId?: string | null;
};

export type ImportJobUrlResult =
  | {
      success: true;
      data: {
        runId: string | null;
        jobId: string;
        sourceProvider: string;
        providerLabel: string;
        matchScore: number;
        strongMatch: boolean;
        title: string;
        company: string;
        message: string;
      };
    }
  | {
      success: false;
      error: string;
      code:
        | "blocked_url"
        | "blocked_automation"
        | "fetch_failed"
        | "unsupported_content"
        | "not_job"
        | "temporary_unavailable"
        | "matching_failed"
        | "save_failed";
    };

type ExistingJobRecord = {
  id: string;
  status: string | null;
};

type ImportedJobRecord = {
  user_id: string;
  run_id: string | null;
  source_job_id: string;
  source: "url";
  source_provider: string;
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

class UrlImportError extends Error {
  code: Exclude<ImportJobUrlResult, { success: true }>["code"];

  constructor(
    code: Exclude<ImportJobUrlResult, { success: true }>["code"],
    message: string,
  ) {
    super(message);
    this.name = "UrlImportError";
    this.code = code;
  }
}

const extractionJsonSchema = {
  type: "object",
  properties: {
    isJobPosting: { type: "boolean" },
    title: { type: ["string", "null"] },
    company: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    salary: { type: ["string", "null"] },
    jobType: {
      type: ["string", "null"],
      enum: ["fulltime", "parttime", "contract", null],
    },
    aboutRole: { type: ["string", "null"] },
    responsibilities: { type: "array", items: { type: "string" } },
    requirements: { type: "array", items: { type: "string" } },
    niceToHave: { type: "array", items: { type: "string" } },
    benefits: { type: "array", items: { type: "string" } },
    aboutCompany: { type: ["string", "null"] },
    externalApplyUrl: { type: ["string", "null"] },
  },
  required: [
    "isJobPosting",
    "title",
    "company",
    "location",
    "salary",
    "jobType",
    "aboutRole",
    "responsibilities",
    "requirements",
    "niceToHave",
    "benefits",
    "aboutCompany",
    "externalApplyUrl",
  ],
  additionalProperties: false,
};

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function preparePastedJobText(rawText: string): string {
  const text = compactText(rawText).slice(0, MAX_TEXT_CHARS);

  if (text.length < MIN_TEXT_CHARS) {
    throw new UrlImportError(
      "not_job",
      "Paste more job listing text before importing.",
    );
  }

  return text;
}

function isBotChallengeResponse(response: Response): boolean {
  const challengeHeader = response.headers.get("cf-mitigated")?.toLowerCase();
  const contentSecurityPolicy = response.headers.get("content-security-policy")?.toLowerCase() ?? "";

  return (
    challengeHeader === "challenge" ||
    contentSecurityPolicy.includes("challenges.cloudflare.com")
  );
}

function getFailureMessage(error: UrlImportError, providerLabel: string): string {
  if (error.code === "blocked_automation") {
    return `${providerLabel} blocks automated imports. Paste the job text to finish importing this listing.`;
  }

  return error.message;
}

function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";

  for (const key of Array.from(url.searchParams.keys())) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.startsWith("utm_") ||
      lowerKey === "fbclid" ||
      lowerKey === "gclid" ||
      lowerKey === "mc_cid" ||
      lowerKey === "mc_eid"
    ) {
      url.searchParams.delete(key);
    }
  }

  return url.toString();
}

function normalizeUrlOrOriginal(rawUrl: string): string {
  try {
    return normalizeUrl(rawUrl);
  } catch {
    return rawUrl;
  }
}

async function readResponseTextWithLimit(response: Response): Promise<{
  text: string;
  truncated: boolean;
}> {
  if (!response.body) {
    return { text: "", truncated: false };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytesRead = 0;
  let truncated = false;

  try {
    while (bytesRead < MAX_IMPORT_BYTES) {
      const { done, value } = await reader.read();

      if (done || !value) {
        break;
      }

      const availableBytes = MAX_IMPORT_BYTES - bytesRead;
      const chunk = value.byteLength > availableBytes ? value.slice(0, availableBytes) : value;
      bytesRead += chunk.byteLength;
      chunks.push(decoder.decode(chunk, { stream: bytesRead < MAX_IMPORT_BYTES }));

      if (value.byteLength > availableBytes) {
        truncated = true;
        break;
      }
    }

    if (!truncated && bytesRead === MAX_IMPORT_BYTES) {
      const { done, value } = await reader.read();
      truncated = !done && Boolean(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  chunks.push(decoder.decode());

  return { text: chunks.join(""), truncated };
}

function htmlToReadableText(html: string): string {
  return compactText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'"),
  ).slice(0, MAX_TEXT_CHARS);
}

async function fetchJobPageText(rawUrl: string): Promise<{
  canonicalUrl: string;
  text: string;
}> {
  const safeUrl = await getSafeFetchUrl(rawUrl);

  if (!safeUrl.success) {
    throw new UrlImportError("blocked_url", safeUrl.reason);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMPORT_TIMEOUT_MS);

  try {
    const response = await fetchWithSafeRedirects(safeUrl.url, controller.signal);

    if (!response.ok) {
      if (isBotChallengeResponse(response)) {
        throw new UrlImportError(
          "blocked_automation",
          "That job board blocks automated imports, so JobPilot cannot read this URL directly.",
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new UrlImportError(
          "unsupported_content",
          "That job URL is not publicly accessible to JobPilot.",
        );
      }

      if (response.status === 408 || response.status === 429 || response.status >= 500) {
        throw new UrlImportError(
          "temporary_unavailable",
          "That job site is temporarily unavailable. Please try importing this URL again in a moment.",
        );
      }

      throw new UrlImportError(
        "fetch_failed",
        response.status === 404
          ? "That job URL was not found."
          : "That job URL could not be reached right now.",
      );
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml")
    ) {
      throw new UrlImportError(
        "unsupported_content",
        "That URL does not look like a public job page.",
      );
    }

    const { text, truncated } = await readResponseTextWithLimit(response);

    if (truncated) {
      throw new UrlImportError(
        "unsupported_content",
        "That job page is too large to import safely.",
      );
    }

    const readableText = contentType.includes("text/plain")
      ? compactText(text).slice(0, MAX_TEXT_CHARS)
      : htmlToReadableText(text);

    if (readableText.length < 180) {
      throw new UrlImportError(
        "not_job",
        "That page does not contain enough job listing text to import.",
      );
    }

    return {
      canonicalUrl: normalizeUrl(response.url || safeUrl.url.href),
      text: readableText,
    };
  } catch (error) {
    if (error instanceof UrlImportError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UrlImportError(
        "fetch_failed",
        "That job URL took too long to respond.",
      );
    }

    throw new UrlImportError(
      "fetch_failed",
      "That job URL could not be imported. Please check that it is publicly accessible.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseExtractionResponse(text: string | undefined): JobExtraction {
  const rawText = text?.trim();

  if (!rawText) {
    throw new UrlImportError("not_job", "The page could not be parsed as a job listing.");
  }

  try {
    return jobExtractionSchema.parse(JSON.parse(rawText));
  } catch {
    throw new UrlImportError("not_job", "The page could not be parsed as a job listing.");
  }
}

function cleanExtractedText(value: string | null): string | null {
  if (!hasText(value)) {
    return null;
  }

  const cleaned = compactText(value)
    .replace(/^[\s\-–—|:•·]+/, "")
    .replace(/[\s\-–—|:•·]+$/, "")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

function cleanExtraction(extraction: JobExtraction): JobExtraction {
  return {
    ...extraction,
    title: cleanExtractedText(extraction.title),
    company: cleanExtractedText(extraction.company),
    location: cleanExtractedText(extraction.location),
    salary: cleanExtractedText(extraction.salary),
    aboutRole: cleanExtractedText(extraction.aboutRole),
    aboutCompany: cleanExtractedText(extraction.aboutCompany),
  };
}

async function extractJobDetails(pageText: string, sourceUrl: string): Promise<JobExtraction> {
  const gemini = createGeminiClient();
  const modelAttempts = [GEMINI_TEXT_MODEL, GEMINI_FAST_MODEL];
  const prompt = `
Extract a structured job posting from this public web page text.

Rules:
- Set isJobPosting false if the page is not primarily one specific job vacancy.
- Do not invent facts. Use null or empty arrays for missing information.
- title is the role name only. Remove employer names, list separators, and page navigation fragments from it.
- company must be the hiring organization or employer named by the posting. Prefer explicit labels like employer, company, hiring organization, advertiser, posted by, or agency.
- Never use page artifacts as company: source names, breadcrumbs, search labels, location labels, short codes, bullets, suffix fragments, or text that starts with punctuation such as "-SBA".
- If the employer is not clearly present, set company to null instead of guessing from the title/header.
- jobType must be fulltime, parttime, contract, or null.
- aboutRole should summarize the role from the page in 1-3 paragraphs.
- externalApplyUrl should only be a URL found in the page text, otherwise null.
- Return JSON only.

Source URL:
${sourceUrl}

Page text:
${pageText}
`;

  let lastError: unknown = null;

  for (const [index, model] of modelAttempts.entries()) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 1600,
          responseMimeType: "application/json",
          responseJsonSchema: extractionJsonSchema,
        },
      });

      return cleanExtraction(parseExtractionResponse(response.text));
    } catch (error) {
      lastError = error;

      const retryable = isTransientGeminiError(error) || error instanceof UrlImportError;

      if (!retryable || index === modelAttempts.length - 1) {
        throw error;
      }

      await wait(500 * (index + 1));
    }
  }

  throw lastError;
}

function validateExtraction(extraction: JobExtraction): asserts extraction is JobExtraction & {
  title: string;
  company: string;
  aboutRole: string;
} {
  if (!extraction.isJobPosting) {
    throw new UrlImportError(
      "not_job",
      "That page does not look like one specific job posting.",
    );
  }

  if (!hasText(extraction.title) || !hasText(extraction.company) || !hasText(extraction.aboutRole)) {
    throw new UrlImportError(
      "not_job",
      "That page is missing enough job detail to import confidently.",
    );
  }
}

function shouldRestoreToActive(status: string | null): boolean {
  return status === null || status === "unavailable";
}

async function findExistingUrlJob(
  userId: string,
  sourceJobId: string,
  sourceUrl: string,
): Promise<ExistingJobRecord | null> {
  const insforge = createInsforgeAdmin();

  const { data: byFingerprint, error: fingerprintError } = await insforge.database
    .from("jobs")
    .select("id,status")
    .eq("user_id", userId)
    .eq("source", "url")
    .eq("source_job_id", sourceJobId)
    .maybeSingle();

  if (fingerprintError) {
    console.error("[agent/urlImport] Existing URL job fingerprint lookup failed:", fingerprintError);
  } else if (byFingerprint?.id) {
    return {
      id: String(byFingerprint.id),
      status: typeof byFingerprint.status === "string" ? byFingerprint.status : null,
    };
  }

  const { data: byUrl, error: urlError } = await insforge.database
    .from("jobs")
    .select("id,status")
    .eq("user_id", userId)
    .eq("source", "url")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (urlError) {
    console.error("[agent/urlImport] Existing URL job source lookup failed:", urlError);
    return null;
  }

  if (!byUrl?.id) {
    return null;
  }

  return {
    id: String(byUrl.id),
    status: typeof byUrl.status === "string" ? byUrl.status : null,
  };
}

async function saveOrRefreshImportedJob(record: ImportedJobRecord): Promise<string | null> {
  const insforge = createInsforgeAdmin();
  const existingJob = await findExistingUrlJob(
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
        source_provider: record.source_provider,
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
      console.error("[agent/urlImport] Imported job refresh error:", error);
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
    console.error("[agent/urlImport] Imported job insert error:", error);
    return null;
  }

  return String(data.id);
}

function buildSourceFingerprint(normalizedUrl: string): string {
  return createHash("sha256").update(normalizedUrl).digest("hex");
}

export async function importJobFromUrl({
  userId,
  url,
  pageText,
  profile,
  runId: existingRunId,
}: ImportUrlInput): Promise<ImportJobUrlResult> {
  const runId = existingRunId ?? await startJobUrlImportRun(userId, url);

  try {
    const pastedText = hasText(pageText) ? pageText : null;
    const safeUrl = await getSafeFetchUrl(url);

    if (!safeUrl.success) {
      throw new UrlImportError("blocked_url", safeUrl.reason);
    }

    const page = pastedText
      ? {
          canonicalUrl: normalizeUrl(safeUrl.url.href),
          text: preparePastedJobText(pastedText),
        }
      : await fetchJobPageText(url);
    const normalizedUrl = normalizeUrl(page.canonicalUrl);
    const provider = getJobSourceProvider(normalizedUrl);
    const providerLabel = getSourceProviderLabel(provider);

    await logAgentMessage(
      userId,
      runId,
      "info",
      pastedText
        ? `URL import started for ${providerLabel} using pasted job text.`
        : `URL import started for ${providerLabel}.`,
    );

    const extraction = await extractJobDetails(page.text, page.canonicalUrl);
    validateExtraction(extraction);

    const jobType = extraction.jobType ?? "fulltime";
    const matchResult = await matchJobToProfile(
      {
        title: extraction.title,
        company: extraction.company,
        location: extraction.location ?? "",
        jobType,
        description: extraction.aboutRole,
      },
      profile,
      { userId, runId },
    );

    if (!matchResult.success) {
      throw new UrlImportError(matchResult.code, matchResult.error);
    }

    const now = new Date().toISOString();
    const record: ImportedJobRecord = {
      user_id: userId,
      run_id: runId,
      source_job_id: buildSourceFingerprint(normalizedUrl),
      source: "url",
      source_provider: provider,
      source_url: normalizedUrl,
      external_apply_url: extraction.externalApplyUrl || normalizedUrl,
      title: extraction.title,
      company: extraction.company,
      location: extraction.location ?? "",
      salary: extraction.salary,
      job_type: jobType,
      about_role: extraction.aboutRole,
      responsibilities: extraction.responsibilities,
      requirements: extraction.requirements,
      nice_to_have: extraction.niceToHave,
      benefits: extraction.benefits,
      about_company: extraction.aboutCompany,
      match_score: matchResult.match.matchScore,
      match_reason: matchResult.match.matchReason,
      matched_skills: matchResult.match.matchedSkills,
      missing_skills: matchResult.match.missingSkills,
      found_at: now,
      last_seen_at: now,
      status: "active",
      unavailable_at: null,
      status_reason: null,
    };

    const jobId = await saveOrRefreshImportedJob(record);

    if (!jobId) {
      throw new UrlImportError(
        "save_failed",
        "The job was parsed, but could not be saved. Please try again.",
      );
    }

    const strongMatch = record.match_score >= MATCH_STRONG_THRESHOLD;

    await logAgentMessage(
      userId,
      runId,
      "success",
      `Imported ${record.title} at ${record.company} from ${providerLabel} with a ${record.match_score}% match.`,
      jobId,
    );
    await completeAgentRunWithResult(
      userId,
      runId,
      {
        jobId,
        sourceProvider: provider,
        providerLabel,
        matchScore: record.match_score,
        strongMatch,
        title: record.title,
        company: record.company,
      },
      1,
    );
    await capturePostHogServerEvent(userId, "job_found", {
      userId,
      source: "url",
      matchScore: record.match_score,
    });

    return {
      success: true,
      data: {
        runId,
        jobId,
        sourceProvider: provider,
        providerLabel,
        matchScore: record.match_score,
        strongMatch,
        title: record.title,
        company: record.company,
        message: `Imported ${record.title} at ${record.company} from ${providerLabel}.`,
      },
    };
  } catch (error) {
    const fallbackProvider = getJobSourceProvider(url);
    const fallbackProviderLabel = getSourceProviderLabel(fallbackProvider);
    const importError =
      error instanceof UrlImportError
        ? error
        : isTransientGeminiError(error)
          ? new UrlImportError(
              "temporary_unavailable",
              "The AI parser is temporarily busy. Please try importing this URL again in a moment.",
            )
          : new UrlImportError(
              "fetch_failed",
              "That job URL could not be imported. Please try another public job page.",
            );
    const failureMessage = getFailureMessage(importError, fallbackProviderLabel);

    if (importError.code === "blocked_automation") {
      console.warn("[agent/urlImport] Automated import blocked:", {
        code: importError.code,
        provider: fallbackProvider,
        url,
      });
    } else {
      console.error("[agent/urlImport] Import failed:", error);
    }

    await logAgentMessage(userId, runId, "error", failureMessage);
    await failAgentRun(userId, runId, failureMessage, {
      errorCode: importError.code,
      canRetryWithText: importError.code === "blocked_automation",
      sourceProvider: fallbackProvider,
      providerLabel: fallbackProviderLabel,
      sourceUrl: normalizeUrlOrOriginal(url),
    });

    return {
      success: false,
      error: failureMessage,
      code: importError.code,
    };
  }
}
