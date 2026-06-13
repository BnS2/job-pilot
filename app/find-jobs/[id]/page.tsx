import { notFound, redirect } from "next/navigation";

import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";
import { BackToJobsLink } from "@/components/job-details/BackToJobsLink";
import { CompanyResearchCard } from "@/components/job-details/CompanyResearchCard";
import { JobActions } from "@/components/job-details/JobActions";
import { JobDescriptionCard } from "@/components/job-details/JobDescriptionCard";
import { JobDetailsError } from "@/components/job-details/JobDetailsError";
import { JobHeader } from "@/components/job-details/JobHeader";
import { JobInfoGrid } from "@/components/job-details/JobInfoGrid";
import { JobStatusProvider } from "@/components/job-details/JobStatusProvider";
import {
  getApplyUrl,
  getSafeMatchScore,
  getSafeStatus,
  type JobDetailsRecord,
} from "@/components/job-details/jobDetailsFormatters";
import { MatchReasoningCard } from "@/components/job-details/MatchReasoningCard";
import { SkillsComparisonCard } from "@/components/job-details/SkillsComparisonCard";
import { Navbar } from "@/components/layout/Navbar";
import { companyResearchSchema } from "@/lib/company-research";
import { createInsforgeServer } from "@/lib/insforge-server";

type JobDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { id } = await params;
  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  if (!authData.user) {
    redirect(`/login?next=${encodeURIComponent(`/find-jobs/${id}`)}`);
  }

  const userId = authData.user.id;

  const { data: job, error } = await insforge.database
    .from("jobs")
    .select(
      "id,company,title,location,salary,job_type,external_apply_url,source_url,about_role,match_score,match_reason,matched_skills,missing_skills,found_at,status,company_research,company_research_status,company_research_error",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[JobDetailsPage] Database query error:", error);
    return (
      <div className="min-h-screen bg-background">
        <AuthSessionGuard />
        <Navbar activePath="/find-jobs" fullWidth showCta={false} />
        <main className="mx-auto flex max-w-[840px] flex-col gap-6 px-4 py-10 sm:px-6">
          <BackToJobsLink />
          <JobDetailsError
            message="We could not load this job right now. Please try again in a moment."
            title="Job details unavailable"
          />
        </main>
      </div>
    );
  }

  if (!job?.id) {
    notFound();
  }

  const details: JobDetailsRecord = {
    id: String(job.id),
    company: typeof job.company === "string" ? job.company : null,
    title: typeof job.title === "string" ? job.title : null,
    location: typeof job.location === "string" ? job.location : null,
    salary: typeof job.salary === "string" ? job.salary : null,
    job_type: typeof job.job_type === "string" ? job.job_type : null,
    external_apply_url:
      typeof job.external_apply_url === "string" ? job.external_apply_url : null,
    source_url: typeof job.source_url === "string" ? job.source_url : null,
    about_role: typeof job.about_role === "string" ? job.about_role : null,
    match_score: typeof job.match_score === "number" ? job.match_score : null,
    match_reason: typeof job.match_reason === "string" ? job.match_reason : null,
    matched_skills: toStringArray(job.matched_skills),
    missing_skills: toStringArray(job.missing_skills),
    found_at: typeof job.found_at === "string" ? job.found_at : null,
    status: typeof job.status === "string" ? job.status : null,
  };
  const company = details.company?.trim() || "Unknown company";
  const title = details.title?.trim() || "Untitled role";
  const matchScore = getSafeMatchScore(details.match_score);
  const status = getSafeStatus(details.status);
  const applyUrl = getApplyUrl(details);
  const matchedSkills = details.matched_skills ?? [];
  const missingSkills = details.missing_skills ?? [];
  const companyResearch = companyResearchSchema.safeParse(job.company_research);
  const researchStatus =
    job.company_research_status === "running" ||
    job.company_research_status === "completed" ||
    job.company_research_status === "failed" ||
    job.company_research_status === "idle"
      ? job.company_research_status
      : "idle";
  const researchError =
    typeof job.company_research_error === "string" ? job.company_research_error : null;

  return (
    <div className="min-h-screen bg-background">
      <AuthSessionGuard />
      <Navbar activePath="/find-jobs" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[840px] flex-col gap-6 px-4 py-10 sm:px-6">
        <BackToJobsLink />
        <JobStatusProvider initialStatus={status}>
          <JobHeader
            applyUrl={applyUrl}
            company={company}
            matchScore={matchScore}
            title={title}
          />
          <JobInfoGrid
            foundAt={details.found_at}
            jobType={details.job_type}
            location={details.location}
            salary={details.salary}
          />
          <MatchReasoningCard matchReason={details.match_reason} />
          <SkillsComparisonCard
            matchedSkills={matchedSkills}
            missingSkills={missingSkills}
          />
          <JobDescriptionCard aboutRole={details.about_role} />
          <CompanyResearchCard
            company={company}
            dossier={companyResearch.success ? companyResearch.data : null}
            error={researchError}
            jobId={details.id}
            status={researchStatus}
          />
          <JobActions
            applyUrl={applyUrl}
            company={company}
            jobId={details.id}
          />
        </JobStatusProvider>
      </main>
    </div>
  );
}
