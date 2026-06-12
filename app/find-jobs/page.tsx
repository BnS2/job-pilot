import { redirect } from "next/navigation";

import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";

type FindJobsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    match?: string | string[];
    sort?: string | string[];
    page?: string | string[];
    run?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function normalizeTextSearchParam(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s@._/+&#-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
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
    const paramValue = firstParam(value);

    if (paramValue && key !== "page") {
      redirectParams.set(key, paramValue);
    }
  }

  if (page > 1) {
    redirectParams.set("page", String(page));
  }

  const queryString = redirectParams.toString();
  return queryString ? `/find-jobs?${queryString}` : "/find-jobs";
}

export default async function FindJobsPage({ searchParams }: FindJobsPageProps) {
  const parsedParams = await searchParams;
  const rawQ = firstParam(parsedParams.q) || "";
  const q = normalizeTextSearchParam(rawQ);
  const match = normalizeMatchParam(firstParam(parsedParams.match) || "all");
  const sort = normalizeSortParam(firstParam(parsedParams.sort) || "match");
  const run = firstParam(parsedParams.run) || "";
  const page = parsePageParam(firstParam(parsedParams.page));
  const pageSize = 20;

  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  if (!authData.user) {
    redirect("/login?next=%2Ffind-jobs");
  }

  let dbQuery = insforge.database
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("user_id", authData.user.id);

  if (run.trim()) {
    dbQuery = dbQuery.eq("run_id", run.trim());
  }

  if (q) {
    dbQuery = dbQuery.or(`title.ilike.%${q}%,company.ilike.%${q}%`);
  }

  if (match === "high") {
    dbQuery = dbQuery.gte("match_score", 70);
  } else if (match === "low") {
    dbQuery = dbQuery.lt("match_score", 70);
  }

  if (sort === "match") {
    dbQuery = dbQuery.order("match_score", { ascending: false });
  } else if (sort === "newest") {
    dbQuery = dbQuery.order("found_at", { ascending: false });
  } else if (sort === "oldest") {
    dbQuery = dbQuery.order("found_at", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data: jobs, count, error } = await dbQuery;

  if (error) {
    console.error("[FindJobsPage] Database query error:", error);
  }

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (!error && page > totalPages) {
    redirect(getPageRedirectPath(parsedParams, totalPages));
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthSessionGuard />
      <Navbar activePath="/find-jobs" fullWidth showCta={false} />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-12">
        <SearchControls />
        <JobFilters key={q} q={q} match={match} sort={sort} />
        <JobsTable
          jobs={jobs || []}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
        />
      </main>
    </div>
  );
}
