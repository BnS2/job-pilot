import { notFound, redirect } from "next/navigation";

import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";
import { BackToJobsLink } from "@/components/job-details/BackToJobsLink";
import { CompanyResearchCard } from "@/components/job-details/CompanyResearchCard";
import { JobActions } from "@/components/job-details/JobActions";
import { JobDescriptionCard } from "@/components/job-details/JobDescriptionCard";
import { JobDetailsEditor } from "@/components/job-details/JobDetailsEditor";
import { JobDetailsError } from "@/components/job-details/JobDetailsError";
import { JobHeader } from "@/components/job-details/JobHeader";
import { JobInfoGrid } from "@/components/job-details/JobInfoGrid";
import { JobStatusProvider } from "@/components/job-details/JobStatusProvider";
import { JobStatusToolbar } from "@/components/job-details/JobStatusToolbar";
import {
  getApplyUrl,
  getSafeMatchScore,
  getSafeStatus,
  type JobDetailsRecord,
} from "@/components/job-details/jobDetailsFormatters";
import { MatchReasoningCard } from "@/components/job-details/MatchReasoningCard";
import { SkillsComparisonCard } from "@/components/job-details/SkillsComparisonCard";
import { TailoredResumeCard } from "@/components/job-details/TailoredResumeCard";
import { Navbar } from "@/components/layout/Navbar";
import { tailoredResumeNotesSchema } from "@/agent/resumeTailor";
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

function getTailoredResumeStatus(value: unknown): "idle" | "running" | "completed" | "failed" {
  return value === "running" ||
    value === "completed" ||
    value === "failed" ||
    value === "idle"
    ? value
    : "idle";
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
      "id,company,title,location,salary,job_type,external_apply_url,source_url,about_role,responsibilities,requirements,nice_to_have,benefits,about_company,match_score,match_reason,matched_skills,missing_skills,found_at,status,company_research,company_research_status,company_research_error,tailored_resume_key,tailored_resume_status,tailored_resume_error,tailored_resume_notes,tailored_resume_generated_at",
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
    responsibilities: toStringArray(job.responsibilities),
    requirements: toStringArray(job.requirements),
    nice_to_have: toStringArray(job.nice_to_have),
    benefits: toStringArray(job.benefits),
    about_company: typeof job.about_company === "string" ? job.about_company : null,
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
  const tailoredResumeNotes = tailoredResumeNotesSchema.safeParse(
    job.tailored_resume_notes,
  );
  const tailoredResumeStatus = getTailoredResumeStatus(job.tailored_resume_status);
  const tailoredResumeError =
    typeof job.tailored_resume_error === "string" ? job.tailored_resume_error : null;
  const tailoredResumeGeneratedAt =
    typeof job.tailored_resume_generated_at === "string"
      ? job.tailored_resume_generated_at
      : null;
  const hasTailoredResume =
    typeof job.tailored_resume_key === "string" && job.tailored_resume_key.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <AuthSessionGuard />
      <Navbar activePath="/find-jobs" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[840px] flex-col gap-6 px-4 py-10 sm:px-6">
        <JobStatusProvider initialStatus={status}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackToJobsLink />
            <JobStatusToolbar
              applyUrl={applyUrl}
              company={company}
              jobId={details.id}
              title={title}
            />
          </div>
          <JobHeader
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
          <JobDetailsEditor
            job={{
              id: details.id,
              title,
              company,
              location: details.location ?? "",
              salary: details.salary ?? "",
              jobType: details.job_type ?? "",
              externalApplyUrl: details.external_apply_url ?? "",
              sourceUrl: details.source_url ?? "",
              aboutRole: details.about_role ?? "",
              responsibilities: details.responsibilities ?? [],
              requirements: details.requirements ?? [],
              niceToHave: details.nice_to_have ?? [],
              benefits: details.benefits ?? [],
              aboutCompany: details.about_company ?? "",
            }}
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
          <TailoredResumeCard
            company={company}
            error={tailoredResumeError}
            generatedAt={tailoredResumeGeneratedAt}
            hasResume={hasTailoredResume}
            jobId={details.id}
            notes={tailoredResumeNotes.success ? tailoredResumeNotes.data : null}
            status={tailoredResumeStatus}
            title={title}
          />
          <JobActions
            applyUrl={applyUrl}
            company={company}
          />
        </JobStatusProvider>
      </main>
    </div>
  );
}
