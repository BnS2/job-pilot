import { redirect } from "next/navigation";

import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";
import { CompanyResearchActivityChart } from "@/components/dashboard/CompanyResearchActivityChart";
import { JobsFoundChart } from "@/components/dashboard/JobsFoundChart";
import { MatchScoreDistributionChart } from "@/components/dashboard/MatchScoreDistributionChart";
import { ProfileIncompleteBanner } from "@/components/dashboard/ProfileIncompleteBanner";
import {
  type DashboardActivityItem,
  RecentActivity,
} from "@/components/dashboard/RecentActivity";
import { type DashboardStats, StatsBar } from "@/components/dashboard/StatsBar";
import type {
  CompanyResearchPoint,
  JobsFoundPoint,
  MatchScoreBucket,
} from "@/components/dashboard/chartTypes";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  calculateCompleteness,
  getJobStatusLabel,
  isJobStatus,
  type JobStatus,
} from "@/lib/utils";

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const JOBS_FOUND_CHART_DAYS = 30;
const COMPANY_RESEARCH_CHART_DAYS = 7;

const MATCH_SCORE_BUCKETS: MatchScoreBucket[] = [
  { range: "0-60%", value: 0 },
  { range: "60-70%", value: 0 },
  { range: "70-80%", value: 0 },
  { range: "80-90%", value: 0 },
  { range: "90-100%", value: 0 },
];

type DashboardJobRow = {
  company: string | null;
  title: string | null;
  status: string | null;
  matchScore: number | null;
  foundAt: string | null;
  lastSeenAt: string | null;
  companyResearchedAt: string | null;
  unavailableAt: string | null;
  archivedAt: string | null;
  appliedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
  companyResearch: unknown;
};

type DashboardRunRow = {
  status: string | null;
  runType: string | null;
  searchMode: string | null;
  jobsFound: number | null;
  jobTitleSearched: string | null;
  locationSearched: string | null;
  completedAt: string | null;
};

type TimestampedActivity = DashboardActivityItem & {
  timestamp: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseDashboardJobRows(value: unknown): DashboardJobRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    return [
      {
        company: stringOrNull(item.company),
        title: stringOrNull(item.title),
        status: stringOrNull(item.status),
        matchScore: numberOrNull(item.match_score),
        foundAt: stringOrNull(item.found_at),
        lastSeenAt: stringOrNull(item.last_seen_at),
        companyResearchedAt: stringOrNull(item.company_researched_at),
        unavailableAt: stringOrNull(item.unavailable_at),
        archivedAt: stringOrNull(item.archived_at),
        appliedAt: stringOrNull(item.applied_at),
        rejectedAt: stringOrNull(item.rejected_at),
        completedAt: stringOrNull(item.completed_at),
        companyResearch: item.company_research ?? null,
      },
    ];
  });
}

function parseDashboardRunRows(value: unknown): DashboardRunRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    return [
      {
        status: stringOrNull(item.status),
        runType: stringOrNull(item.run_type),
        searchMode: stringOrNull(item.search_mode),
        jobsFound: numberOrNull(item.jobs_found),
        jobTitleSearched: stringOrNull(item.job_title_searched),
        locationSearched: stringOrNull(item.location_searched),
        completedAt: stringOrNull(item.completed_at),
      },
    ];
  });
}

function getTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(value: string): string {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function buildEmptyDailySeries(days: number): JobsFoundPoint[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (days - 1 - index));

    return {
      day: formatDayLabel(dateKey(date)),
      value: 0,
    };
  });
}

function buildJobsFoundSeries(runs: DashboardRunRow[]): JobsFoundPoint[] {
  const series = buildEmptyDailySeries(JOBS_FOUND_CHART_DAYS);
  const valuesByDay = new Map(series.map((point) => [point.day, point.value]));

  for (const run of runs) {
    if (run.status !== "completed" || run.runType !== "job_discovery") {
      continue;
    }

    const timestamp = getTimestamp(run.completedAt);

    if (timestamp === null) {
      continue;
    }

    const label = formatDayLabel(dateKey(new Date(timestamp)));

    if (!valuesByDay.has(label)) {
      continue;
    }

    valuesByDay.set(label, (valuesByDay.get(label) ?? 0) + (run.jobsFound ?? 0));
  }

  return series.map((point) => ({
    ...point,
    value: valuesByDay.get(point.day) ?? 0,
  }));
}

function buildCompanyResearchSeries(
  jobs: DashboardJobRow[],
): CompanyResearchPoint[] {
  const series = buildEmptyDailySeries(COMPANY_RESEARCH_CHART_DAYS);
  const valuesByDay = new Map(series.map((point) => [point.day, point.value]));

  for (const job of jobs) {
    const timestamp = getTimestamp(job.companyResearchedAt);

    if (timestamp === null) {
      continue;
    }

    const label = formatDayLabel(dateKey(new Date(timestamp)));

    if (!valuesByDay.has(label)) {
      continue;
    }

    valuesByDay.set(label, (valuesByDay.get(label) ?? 0) + 1);
  }

  return series.map((point) => ({
    ...point,
    value: valuesByDay.get(point.day) ?? 0,
  }));
}

function buildMatchScoreDistribution(jobs: DashboardJobRow[]): MatchScoreBucket[] {
  const buckets = MATCH_SCORE_BUCKETS.map((bucket) => ({ ...bucket }));

  for (const job of jobs) {
    const score = job.matchScore;

    if (score === null) {
      continue;
    }

    if (score < 60) {
      buckets[0].value += 1;
    } else if (score < 70) {
      buckets[1].value += 1;
    } else if (score < 80) {
      buckets[2].value += 1;
    } else if (score < 90) {
      buckets[3].value += 1;
    } else {
      buckets[4].value += 1;
    }
  }

  return buckets;
}

function wasFoundOrRefreshedSince(job: DashboardJobRow, cutoff: number): boolean {
  const foundAt = getTimestamp(job.foundAt);
  const lastSeenAt = getTimestamp(job.lastSeenAt);

  return (
    (foundAt !== null && foundAt >= cutoff) ||
    (lastSeenAt !== null && lastSeenAt >= cutoff)
  );
}

function buildDashboardStats(jobs: DashboardJobRow[]): DashboardStats {
  const activeJobs = jobs.filter((job) => job.status === "active");
  const matchScores = activeJobs
    .map((job) => job.matchScore)
    .filter((score): score is number => score !== null);
  const averageMatchRate =
    matchScores.length === 0
      ? null
      : Math.round(
          matchScores.reduce((total, score) => total + score, 0) /
            matchScores.length,
        );
  const weekCutoff = Date.now() - WEEK_IN_MS;

  return {
    activeJobsFound: activeJobs.length,
    averageMatchRate,
    companiesResearched: jobs.filter((job) => job.companyResearch !== null).length,
    jobsThisWeek: activeJobs.filter((job) =>
      wasFoundOrRefreshedSince(job, weekCutoff),
    ).length,
  };
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatRelativeTime(timestamp: number, now: number): string {
  const diff = Math.max(0, now - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    return `${pluralize(Math.floor(diff / minute), "min", "mins")} ago`;
  }

  if (diff < day) {
    return `${pluralize(Math.floor(diff / hour), "hour", "hours")} ago`;
  }

  if (diff < 7 * day) {
    return `${pluralize(Math.floor(diff / day), "day", "days")} ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function getJobContext(job: DashboardJobRow): string {
  if (job.company && job.title) {
    return `${job.company} - ${job.title}`;
  }

  return job.company ?? job.title ?? "job";
}

function buildRunActivity(run: DashboardRunRow): TimestampedActivity | null {
  const timestamp = getTimestamp(run.completedAt);

  if (timestamp === null || run.status !== "completed") {
    return null;
  }

  if (run.runType === "resume_generation") {
    return {
      label: "Generated resume from profile",
      time: "",
      timestamp,
      tone: "info",
    };
  }

  if (run.runType === "resume_extraction") {
    return {
      label: "Extracted profile fields from resume",
      time: "",
      timestamp,
      tone: "info",
    };
  }

  if (run.runType && run.runType !== "job_discovery") {
    return null;
  }

  const jobsFound = run.jobsFound ?? 0;

  if (run.searchMode === "profile_best_match") {
    return {
      label:
        jobsFound > 0
          ? `Found ${pluralize(jobsFound, "profile match", "profile matches")}`
          : "Profile best match search completed",
      time: "",
      timestamp,
      tone: "success",
    };
  }

  const title = run.jobTitleSearched ?? "your search";
  const location = run.locationSearched ? ` in ${run.locationSearched}` : "";

  return {
    label:
      jobsFound > 0
        ? `Found ${pluralize(jobsFound, "job", "jobs")} for ${title}${location}`
        : `Search completed for ${title}${location}`,
    time: "",
    timestamp,
    tone: "success",
  };
}

function buildResearchActivity(job: DashboardJobRow): TimestampedActivity | null {
  const timestamp = getTimestamp(job.companyResearchedAt);

  if (timestamp === null || job.companyResearch === null) {
    return null;
  }

  return {
    label: `Researched ${job.company ?? "company"}`,
    time: "",
    timestamp,
    tone: "accent",
  };
}

function buildStatusActivities(job: DashboardJobRow): TimestampedActivity[] {
  const statuses: Array<{ status: JobStatus; timestamp: string | null }> = [
    { status: "unavailable", timestamp: job.unavailableAt },
    { status: "archived", timestamp: job.archivedAt },
    { status: "applied", timestamp: job.appliedAt },
    { status: "rejected", timestamp: job.rejectedAt },
    { status: "completed", timestamp: job.completedAt },
  ];

  return statuses.flatMap((entry) => {
    const timestamp = getTimestamp(entry.timestamp);

    if (timestamp === null || !isJobStatus(entry.status)) {
      return [];
    }

    return [
      {
        label: `Marked ${getJobContext(job)} ${getJobStatusLabel(entry.status).toLowerCase()}`,
        time: "",
        timestamp,
        tone: entry.status === "applied" || entry.status === "completed" ? "success" : "info",
      },
    ];
  });
}

function buildRecentActivities(
  jobs: DashboardJobRow[],
  runs: DashboardRunRow[],
): DashboardActivityItem[] {
  const now = Date.now();
  const activities = [
    ...runs.flatMap((run) => {
      const activity = buildRunActivity(run);
      return activity ? [activity] : [];
    }),
    ...jobs.flatMap((job) => {
      const researchActivity = buildResearchActivity(job);
      return [
        ...(researchActivity ? [researchActivity] : []),
        ...buildStatusActivities(job),
      ];
    }),
  ];

  return activities
    .sort((first, second) => second.timestamp - first.timestamp)
    .slice(0, 8)
    .map((activity) => ({
      label: activity.label,
      time: formatRelativeTime(activity.timestamp, now),
      tone: activity.tone,
    }));
}

export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login?next=%2Fdashboard");
  }

  const { data: profile, error: profileError } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[app/dashboard/page] DB error fetching profile:", profileError);
  }

  const isProfileComplete = profile
    ? calculateCompleteness(profile).isComplete
    : false;
  const { data: jobsData, error: jobsError } = await insforge.database
    .from("jobs")
    .select(
      "company,title,status,match_score,found_at,last_seen_at,company_research,company_researched_at,unavailable_at,archived_at,applied_at,rejected_at,completed_at",
    )
    .eq("user_id", data.user.id);

  if (jobsError) {
    console.error("[app/dashboard/page] DB error fetching dashboard jobs:", jobsError);
  }

  const { data: runsData, error: runsError } = await insforge.database
    .from("agent_runs")
    .select(
      "status,run_type,search_mode,jobs_found,job_title_searched,location_searched,completed_at",
    )
    .eq("user_id", data.user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(12);

  if (runsError) {
    console.error("[app/dashboard/page] DB error fetching dashboard runs:", runsError);
  }

  const { data: jobDiscoveryRunsData, error: jobDiscoveryRunsError } =
    await insforge.database
      .from("agent_runs")
      .select(
        "status,run_type,search_mode,jobs_found,job_title_searched,location_searched,completed_at",
      )
      .eq("user_id", data.user.id)
      .eq("status", "completed")
      .eq("run_type", "job_discovery")
      .order("completed_at", { ascending: true })
      .limit(500);

  if (jobDiscoveryRunsError) {
    console.error(
      "[app/dashboard/page] DB error fetching dashboard job discovery runs:",
      jobDiscoveryRunsError,
    );
  }

  const dashboardJobs = parseDashboardJobRows(jobsData);
  const dashboardStats = buildDashboardStats(dashboardJobs);
  const dashboardRuns = parseDashboardRunRows(runsData);
  const dashboardJobDiscoveryRuns = parseDashboardRunRows(jobDiscoveryRunsData);
  const recentActivities = buildRecentActivities(dashboardJobs, dashboardRuns);
  const jobsFound = buildJobsFoundSeries(dashboardJobDiscoveryRuns);
  const companyResearch = buildCompanyResearchSeries(dashboardJobs);
  const matchScoreDistribution = buildMatchScoreDistribution(dashboardJobs);

  return (
    <div className="min-h-screen bg-background">
      <AuthSessionGuard />
      <Navbar activePath="/dashboard" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {isProfileComplete ? null : <ProfileIncompleteBanner />}
        <StatsBar stats={dashboardStats} />
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.75fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            <JobsFoundChart data={jobsFound} />
            <RecentActivity activities={recentActivities} />
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <CompanyResearchActivityChart data={companyResearch} />
            <MatchScoreDistributionChart data={matchScoreDistribution} />
          </div>
        </div>
      </main>
    </div>
  );
}
