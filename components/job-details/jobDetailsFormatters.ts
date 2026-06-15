import { isJobStatus, type JobStatus } from "@/lib/utils";

export type JobDetailsRecord = {
  id: string;
  company: string | null;
  title: string | null;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  external_apply_url: string | null;
  source_url: string | null;
  about_role: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  nice_to_have: string[] | null;
  benefits: string[] | null;
  about_company: string | null;
  match_score: number | null;
  match_reason: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  found_at: string | null;
  status: string | null;
};

export function getSafeMatchScore(score: number | null): number {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return 0;
  }

  return Math.min(Math.max(score, 0), 100);
}

export function getSafeStatus(status: string | null): JobStatus {
  return status && isJobStatus(status) ? status : "active";
}

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 0) {
    return "Just now";
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatJobType(jobType: string | null): string {
  if (jobType === "parttime") {
    return "Part time";
  }

  if (jobType === "fulltime") {
    return "Full time";
  }

  if (jobType === "contract") {
    return "Contract";
  }

  return "-";
}

export function getApplyUrl(job: JobDetailsRecord): string | null {
  const candidate = job.external_apply_url?.trim() || job.source_url?.trim() || "";

  if (!candidate) {
    return null;
  }

  try {
    const parsedUrl = new URL(candidate);
    const protocol = parsedUrl.protocol.toLowerCase();
    return protocol === "http:" || protocol === "https:" ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}
