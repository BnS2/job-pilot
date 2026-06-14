import { z } from "zod";

import { requireServerEnv } from "@/lib/env";

export type AdzunaCountry = "us" | "gb" | "ca" | "au";

export type NormalizedAdzunaJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  redirectUrl: string;
  salary: string | null;
  jobType: "fulltime" | "parttime" | "contract";
  created: string | null;
};

const adzunaJobSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  company: z.object({ display_name: z.string().optional() }).optional(),
  location: z.object({ display_name: z.string().optional() }).optional(),
  description: z.string().optional(),
  redirect_url: z.string().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  contract_type: z.string().optional(),
  created: z.string().optional(),
});

const adzunaResponseSchema = z.object({
  results: z.array(adzunaJobSchema).optional(),
});

type AdzunaJob = z.infer<typeof adzunaJobSchema>;

export function detectAdzunaCountry(location: string): AdzunaCountry {
  const normalized = location.toLowerCase();

  if (
    /\b(uk|u\.k\.|united kingdom|england|scotland|wales|london|manchester|birmingham|edinburgh)\b/.test(
      normalized,
    )
  ) {
    return "gb";
  }

  if (/\b(canada|toronto|vancouver|montreal|ottawa)\b/.test(normalized)) {
    return "ca";
  }

  if (/\b(australia|au|sydney|melbourne|brisbane|perth)\b/.test(normalized)) {
    return "au";
  }

  return "us";
}

export function isSupportedAdzunaFallbackLocation(location: string): boolean {
  const normalized = location.toLowerCase();

  if (!normalized.trim()) {
    return false;
  }

  if (/\b(remote|usa|u\.s\.|united states|new york|san francisco|los angeles|seattle|austin|boston|chicago|denver)\b/.test(normalized)) {
    return true;
  }

  return detectAdzunaCountry(location) !== "us";
}

function getSalarySymbol(country: AdzunaCountry): string {
  return country === "gb" ? "£" : "$";
}

function formatSalary(job: AdzunaJob, country: AdzunaCountry): string | null {
  if (typeof job.salary_min !== "number" && typeof job.salary_max !== "number") {
    return null;
  }

  const min = typeof job.salary_min === "number" ? Math.round(job.salary_min / 1000) : null;
  const max = typeof job.salary_max === "number" ? Math.round(job.salary_max / 1000) : null;
  const symbol = getSalarySymbol(country);

  if (min !== null && max !== null) {
    return min === max ? `${symbol}${min}k` : `${symbol}${min}k - ${symbol}${max}k`;
  }

  if (min !== null) {
    return `${symbol}${min}k+`;
  }

  return max !== null ? `Up to ${symbol}${max}k` : null;
}

function normalizeJobType(contractType: string | undefined): "fulltime" | "parttime" | "contract" {
  const normalized = contractType?.toLowerCase().replace(/[_\s-]/g, "") ?? "";

  if (normalized.includes("part")) {
    return "parttime";
  }

  if (
    normalized.includes("contract") ||
    normalized.includes("temporary") ||
    normalized.includes("freelance")
  ) {
    return "contract";
  }

  return "fulltime";
}

function normalizeAdzunaJob(job: AdzunaJob, country: AdzunaCountry): NormalizedAdzunaJob | null {
  const title = job.title?.trim();
  const company = job.company?.display_name?.trim();
  const location = job.location?.display_name?.trim();
  const description = job.description?.trim();
  const redirectUrl = job.redirect_url?.trim();

  if (!title || !company || !location || !description || !redirectUrl) {
    return null;
  }

  return {
    id: String(job.id ?? redirectUrl),
    title,
    company,
    location,
    description,
    redirectUrl,
    salary: formatSalary(job, country),
    jobType: normalizeJobType(job.contract_type),
    created: job.created ?? null,
  };
}

export function dedupeAdzunaJobs(jobs: NormalizedAdzunaJob[]): NormalizedAdzunaJob[] {
  const seen = new Set<string>();
  const deduped: NormalizedAdzunaJob[] = [];

  for (const job of jobs) {
    const key = job.id || job.redirectUrl;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(job);
  }

  return deduped;
}

export async function searchAdzunaJobs(
  jobTitle: string,
  location: string,
  country: AdzunaCountry = "us",
): Promise<NormalizedAdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: requireServerEnv("ADZUNA_APP_ID"),
    app_key: requireServerEnv("ADZUNA_APP_KEY"),
    what: jobTitle,
    category: "it-jobs",
    results_per_page: "10",
    "content-type": "application/json",
  });

  if (location.trim()) {
    params.set("where", location.trim());
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let response: Response;

  try {
    response = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`,
      { signal: controller.signal },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Adzuna API request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const parsed = adzunaResponseSchema.parse(await response.json());
  const jobs = (parsed.results ?? [])
    .map((job) => normalizeAdzunaJob(job, country))
    .filter((job): job is NormalizedAdzunaJob => job !== null);

  return dedupeAdzunaJobs(jobs);
}
