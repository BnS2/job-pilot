import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";
import { isJobStatus, type JobStatus } from "@/lib/utils";

export type SelectedSearchRun = {
  id: string;
  jobTitle: string;
  location: string | null;
};

type FindJobsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    match?: string | string[];
    sort?: string | string[];
    status?: string | string[];
    page?: string | string[];
    run?: string | string[];
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function allParams(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function normalizeRunParams(value: string | string[] | undefined): string[] {
  const runIds: string[] = [];

  for (const rawRunId of allParams(value)) {
    const runId = rawRunId.trim();

    if (uuidPattern.test(runId) && !runIds.includes(runId)) {
      runIds.push(runId);
    }
  }

  return runIds;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildSelectedSearchRuns(
  runRows: unknown[] | null | undefined,
  selectedRunIds: string[],
): SelectedSearchRun[] {
  if (!runRows || runRows.length === 0) {
    return [];
  }

  const runsById = new Map<string, SelectedSearchRun>();

  for (const runRow of runRows) {
    if (typeof runRow !== "object" || runRow === null) {
      continue;
    }

    const id = "id" in runRow ? stringOrNull(runRow.id) : null;
    const jobTitle =
      "job_title_searched" in runRow
        ? stringOrNull(runRow.job_title_searched)
        : null;

    if (!id || !jobTitle) {
      continue;
    }

    runsById.set(id, {
      id,
      jobTitle,
      location:
        "location_searched" in runRow ? stringOrNull(runRow.location_searched) : null,
    });
  }

  return selectedRunIds
    .map((runId) => runsById.get(runId))
    .filter((run): run is SelectedSearchRun => Boolean(run));
}

function normalizeTextSearchParam(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s@._/+&#-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function normalizeTextSearchValues(value: string | string[] | undefined): string[] {
  const values: string[] = [];

  for (const rawValue of allParams(value)) {
    const sanitized = normalizeTextSearchParam(rawValue);

    if (sanitized && !values.includes(sanitized)) {
      values.push(sanitized);
    }
  }

  return values;
}

function normalizeMatchParam(value: string): "all" | "high" | "low" {
  if (value === "high" || value === "low") {
    return value;
  }

  return "all";
}

function normalizeSortParam(value: string): "match" | "newest" | "oldest" {
  if (value === "newest" || value === "oldest") {
    return value;
  }

  return "match";
}

function normalizeStatusParam(value: string): JobStatus | "all" {
  if (value === "all") {
    return "all";
  }

  if (isJobStatus(value)) {
    return value;
  }

  return "active";
}

function parsePageParam(value: string | undefined): number {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getPageRedirectPath(
  params: Awaited<FindJobsPageProps["searchParams"]>,
  page: number,
): string {
  const redirectParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    for (const paramValue of allParams(value)) {
      if (paramValue && key !== "page") {
        redirectParams.append(key, paramValue);
      }
    }
  }

  if (page > 1) {
    redirectParams.set("page", String(page));
  }

  const queryString = redirectParams.toString();
  return queryString ? `/find-jobs?${queryString}` : "/find-jobs";
}

function getCurrentFindJobsPath(
  params: Awaited<FindJobsPageProps["searchParams"]>,
): string {
  const currentParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    for (const paramValue of allParams(value)) {
      if (paramValue) {
        currentParams.append(key, paramValue);
      }
    }
  }

  const queryString = currentParams.toString();
  return queryString ? `/find-jobs?${queryString}` : "/find-jobs";
}

export default async function FindJobsPage({ searchParams }: FindJobsPageProps) {
  const parsedParams = await searchParams;
  const qValues = normalizeTextSearchValues(parsedParams.q);
  const match = normalizeMatchParam(firstParam(parsedParams.match) || "all");
  const sort = normalizeSortParam(firstParam(parsedParams.sort) || "match");
  const status = normalizeStatusParam(firstParam(parsedParams.status) || "active");
  const page = parsePageParam(firstParam(parsedParams.page));
  const selectedRunIds = normalizeRunParams(parsedParams.run);
  const pageSize = 20;

  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  if (!authData.user) {
    redirect(`/login?next=${encodeURIComponent(getCurrentFindJobsPath(parsedParams))}`);
  }

  let selectedSearchRuns: SelectedSearchRun[] = [];

  if (selectedRunIds.length > 0) {
    const { data: runRows, error: runRowsError } = await insforge.database
      .from("agent_runs")
      .select("id,job_title_searched,location_searched,status")
      .eq("user_id", authData.user.id)
      .in("id", selectedRunIds)
      .eq("status", "completed");

    if (runRowsError) {
      console.error("[FindJobsPage] Selected search runs query error:", runRowsError);
    } else {
      selectedSearchRuns = buildSelectedSearchRuns(runRows, selectedRunIds);
    }
  }

  const selectedSearchRunIds = selectedSearchRuns.map((run) => run.id);

  return (
    <div className="min-h-screen bg-background">
      <AuthSessionGuard />
      <Navbar activePath="/find-jobs" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-12">
        <SearchControls />
        <JobFilters
          key={status}
          qValues={qValues}
          match={match}
          selectedSearchRuns={selectedSearchRuns}
          sort={sort}
          status={status}
        />
        <Suspense fallback={<JobsTableSkeleton />}>
          <FindJobsResults
            match={match}
            page={page}
            pageSize={pageSize}
            parsedParams={parsedParams}
            qValues={qValues}
            selectedRunIds={selectedSearchRunIds}
            sort={sort}
            status={status}
            userId={authData.user.id}
          />
        </Suspense>
      </main>
    </div>
  );
}

function JobsTableSkeleton() {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border bg-surface-secondary px-8 py-5">
        <div className="h-4 w-36 rounded-full bg-border-light" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className="grid min-h-20 grid-cols-[2fr_2fr_1.3fr_1fr] items-center gap-6 border-b border-border px-8 py-5 last:border-b-0"
            key={index}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-md border border-border bg-surface-secondary" />
              <div className="h-4 w-36 rounded-full bg-border-light" />
            </div>
            <div className="h-4 w-48 rounded-full bg-border-light" />
            <div className="h-2 w-32 rounded-full bg-border-light" />
            <div className="h-4 w-20 rounded-full bg-border-light" />
          </div>
        ))}
      </div>
    </section>
  );
}

type FindJobsResultsProps = {
  match: "all" | "high" | "low";
  page: number;
  pageSize: number;
  parsedParams: Awaited<FindJobsPageProps["searchParams"]>;
  qValues: string[];
  selectedRunIds: string[];
  sort: "match" | "newest" | "oldest";
  status: JobStatus | "all";
  userId: string;
};

async function FindJobsResults({
  match,
  page,
  pageSize,
  parsedParams,
  qValues,
  selectedRunIds,
  sort,
  status,
  userId,
}: FindJobsResultsProps) {
  const insforge = await createInsforgeServer();
  let dbQuery = insforge.database
    .from("jobs")
    .select("id,company,title,match_score,salary,source,found_at,status", { count: "exact" })
    .eq("user_id", userId);

  if (status !== "all") {
    dbQuery = dbQuery.eq("status", status);
  }

  if (selectedRunIds.length > 0) {
    dbQuery = dbQuery.in("run_id", selectedRunIds);
  }

  if (qValues.length > 0) {
    const andValue = qValues
      .map((term) => `or(title.ilike.%${term}%,company.ilike.%${term}%)`)
      .join(",");
    const params = (dbQuery as unknown as { url: URL }).url.searchParams;
    params.append("and", `(${andValue})`);
  }

  if (match === "high") {
    dbQuery = dbQuery.gte("match_score", 70);
  } else if (match === "low") {
    dbQuery = dbQuery.lt("match_score", 70);
  }

  if (sort === "match") {
    dbQuery = dbQuery
      .order("match_score", { ascending: false })
      .order("id", { ascending: true });
  } else if (sort === "newest") {
    dbQuery = dbQuery
      .order("found_at", { ascending: false })
      .order("id", { ascending: true });
  } else if (sort === "oldest") {
    dbQuery = dbQuery
      .order("found_at", { ascending: true })
      .order("id", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data: jobs, count, error } = await dbQuery;

  if (error) {
    console.error("[FindJobsPage] Database query error:", error);

    return (
      <section className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-8 shadow-sm text-center">
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Jobs could not be loaded
        </h2>
        <p className="mt-2 text-sm font-medium leading-5 text-text-secondary max-w-md">
          Something went wrong while fetching your jobs. Please refresh the page or try again in a moment.
        </p>
      </section>
    );
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (page > totalPages) {
    redirect(getPageRedirectPath(parsedParams, totalPages));
  }

  return (
    <JobsTable
      jobs={jobs ?? []}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      status={status}
    />
  );
}
