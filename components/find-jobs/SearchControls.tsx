"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { clearExpiredSession } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

const TRACKED_RUNS_STORAGE_KEY = "jobpilot.findJobs.trackedRuns";
const MAX_TRACKED_RUNS = 4;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function SearchIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m20 20-4.5-4.5m2.5-5A7.5 7.5 0 1 1 3 10.5a7.5 7.5 0 0 1 15 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SparkleIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M13 4 9.5 14.5 4 16l5.5 1.5L13 28m4-18 1.5 3.5L22 15l-3.5 1.5L17 20l-1.5-3.5L12 15l3.5-1.5L17 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        transform="translate(0 -4)"
      />
    </svg>
  );
}

function LinkIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M10.5 13.5a4 4 0 0 0 5.7.1l2.4-2.4a4 4 0 1 0-5.7-5.7l-1.4 1.4m2 3.6a4 4 0 0 0-5.7-.1l-2.4 2.4a4 4 0 1 0 5.7 5.7l1.4-1.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function XIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

type RunPhase = "initializing" | "running" | "completed" | "failed";
type RunKind = "adzuna_search" | "url_import";

type TrackedRun = {
  runId: string;
  runKind?: RunKind;
  jobTitle: string;
  location: string;
  searchMode: "manual_search" | "profile_best_match";
  sourceUrl?: string | null;
  providerLabel?: string | null;
  status: RunPhase;
  jobsFound: number;
  jobsSaved: number;
  strongMatches: number;
  startedAt: number;
  completedAt: number | null;
  statusMessage: string | null;
};

type NoticeTone = "info" | "success" | "error";

function isRunPhase(value: unknown): value is RunPhase {
  return (
    value === "initializing" ||
    value === "running" ||
    value === "completed" ||
    value === "failed"
  );
}

function isRunKind(value: unknown): value is RunKind {
  return value === "adzuna_search" || value === "url_import";
}

function isStoredTrackedRun(value: unknown): value is TrackedRun {
  return (
    typeof value === "object" &&
    value !== null &&
    "runId" in value &&
    typeof value.runId === "string" &&
    "jobTitle" in value &&
    typeof value.jobTitle === "string" &&
    "location" in value &&
    typeof value.location === "string" &&
    "searchMode" in value &&
    (value.searchMode === "manual_search" || value.searchMode === "profile_best_match") &&
    (!("runKind" in value) || isRunKind(value.runKind)) &&
    (!("sourceUrl" in value) || typeof value.sourceUrl === "string" || value.sourceUrl === null) &&
    (!("providerLabel" in value) ||
      typeof value.providerLabel === "string" ||
      value.providerLabel === null) &&
    "status" in value &&
    isRunPhase(value.status) &&
    "jobsFound" in value &&
    typeof value.jobsFound === "number" &&
    "jobsSaved" in value &&
    typeof value.jobsSaved === "number" &&
    "strongMatches" in value &&
    typeof value.strongMatches === "number" &&
    "startedAt" in value &&
    typeof value.startedAt === "number" &&
    "completedAt" in value &&
    (typeof value.completedAt === "number" || value.completedAt === null) &&
    "statusMessage" in value &&
    (typeof value.statusMessage === "string" || value.statusMessage === null)
  );
}

function readStoredRuns(): TrackedRun[] {
  try {
    const storedRuns = window.localStorage.getItem(TRACKED_RUNS_STORAGE_KEY);

    if (!storedRuns) {
      return [];
    }

    const parsedRuns: unknown = JSON.parse(storedRuns);

    if (!Array.isArray(parsedRuns)) {
      return [];
    }

    return parsedRuns.filter(isStoredTrackedRun).slice(0, MAX_TRACKED_RUNS);
  } catch (error) {
    console.error("[SearchControls] Failed to restore tracked job searches:", error);
    return [];
  }
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function SearchControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [trackedRuns, setTrackedRuns] = useState<TrackedRun[]>([]);
  const [hasLoadedStoredRuns, setHasLoadedStoredRuns] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const hasActiveRuns = trackedRuns.some(
    (run) => run.status === "initializing" || run.status === "running",
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTrackedRuns(readStoredRuns());
      setHasLoadedStoredRuns(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredRuns) {
      return;
    }

    window.localStorage.setItem(
      TRACKED_RUNS_STORAGE_KEY,
      JSON.stringify(trackedRuns.slice(0, MAX_TRACKED_RUNS)),
    );
  }, [hasLoadedStoredRuns, trackedRuns]);

  useEffect(() => {
    if (!hasActiveRuns) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasActiveRuns]);

  function getRunId(data: object | null): string | null {
    if (data && "runId" in data && typeof data.runId === "string" && data.runId.trim()) {
      return data.runId;
    }

    return null;
  }

  function getRunStatus(data: object | null): string | null {
    if (data && "status" in data && typeof data.status === "string") {
      return data.status;
    }

    return null;
  }

  function getJobsFound(data: object | null): number {
    if (data && "jobsFound" in data && typeof data.jobsFound === "number") {
      return data.jobsFound;
    }

    return 0;
  }

  function getJobsSaved(data: object | null): number {
    if (data && "jobsSaved" in data && typeof data.jobsSaved === "number") {
      return data.jobsSaved;
    }

    return 0;
  }

  function getStrongMatches(data: object | null): number {
    if (data && "strongMatches" in data && typeof data.strongMatches === "number") {
      return data.strongMatches;
    }

    return 0;
  }

  function getStatusMessage(data: object | null): string | null {
    if (data && "statusMessage" in data && typeof data.statusMessage === "string") {
      return data.statusMessage;
    }

    return null;
  }

  function getProviderLabel(data: object | null): string | null {
    if (data && "providerLabel" in data && typeof data.providerLabel === "string") {
      return data.providerLabel;
    }

    return null;
  }

  function getRunProgressMessage(run: TrackedRun): string {
    if (run.runKind === "url_import") {
      const providerLabel = run.providerLabel ?? "job URL";

      if (run.status === "initializing") {
        return `Starting import from ${providerLabel}.`;
      }

      if (run.status === "completed") {
        return run.jobsSaved > 0
          ? `Imported ${providerLabel} job.`
          : `${providerLabel} import completed, but no job was saved.`;
      }

      if (run.status === "failed") {
        return run.statusMessage ?? `${providerLabel} import failed. Please try another public job URL.`;
      }

      if (run.statusMessage) {
        return run.statusMessage;
      }

      return providerLabel === "URL"
        ? "Importing job URL."
        : `Importing job from ${providerLabel}.`;
    }

    const isBestMatch = run.searchMode === "profile_best_match";
    const label = isBestMatch ? "Best Match" : `"${run.jobTitle}"`;

    if (run.status === "initializing") {
      return isBestMatch
        ? "Starting Best Match search in the background."
        : `Starting "${run.jobTitle}" in the background.`;
    }

    if (run.status === "completed") {
      if (run.jobsFound === 0) {
        return `${label} completed. No matching IT jobs were found.`;
      }

      if (run.jobsSaved === 0) {
        return `${label} completed. Found ${formatCount(run.jobsFound, "job", "jobs")}, but none could be saved.`;
      }

      if (run.strongMatches === 0) {
        return `${label} completed. Found ${formatCount(run.jobsFound, "job", "jobs")} and saved ${formatCount(run.jobsSaved, "job", "jobs")}, but none were strong matches.`;
      }

      return `${label} completed. Found ${formatCount(run.jobsFound, "job", "jobs")} and saved ${formatCount(run.jobsSaved, "job", "jobs")}, including ${formatCount(run.strongMatches, "strong match", "strong matches")}.`;
    }

    if (run.status === "failed") {
      return run.statusMessage ?? `${label} failed. Please try again.`;
    }

    const elapsedSeconds = Math.floor((nowMs - run.startedAt) / 1000);

    if (run.statusMessage) {
      return run.statusMessage;
    }

    if (elapsedSeconds < 18) {
      return isBestMatch
        ? "Searching for best matches on Adzuna."
        : `Searching "${run.jobTitle}" on Adzuna.`;
    }

    if (elapsedSeconds < 35) {
      return isBestMatch
        ? "Scoring and saving best matches."
        : `Scoring and saving matches for "${run.jobTitle}".`;
    }

    return isBestMatch
      ? "Best Match is still processing in the background."
      : `"${run.jobTitle}" is still processing in the background.`;
  }

  function getLocationSuffix(locationValue: string): string {
    const trimmedLocation = locationValue.trim();

    return trimmedLocation ? ` Location: "${trimmedLocation}".` : "";
  }

  function getRunTone(run: TrackedRun): NoticeTone {
    if (run.runKind === "url_import" && run.status === "completed" && run.jobsSaved > 0) {
      return "success";
    }

    if (run.status === "completed" && run.strongMatches > 0) {
      return "success";
    }

    if (run.status === "failed") {
      return "error";
    }

    return "info";
  }

  function getNoticeClassName(tone: NoticeTone): string {
    if (tone === "error") {
      return "flex flex-col gap-3 rounded-md border border-error/20 bg-error/10 px-4 py-4 text-sm font-semibold leading-5 text-error sm:flex-row sm:items-center";
    }

    if (tone === "success") {
      return "flex flex-col gap-3 rounded-md border border-success/20 bg-success-lightest px-4 py-4 text-sm font-semibold leading-5 text-success-foreground sm:flex-row sm:items-center";
    }

    return "flex flex-col gap-3 rounded-md border border-info/20 bg-info-lightest px-4 py-4 text-sm font-semibold leading-5 text-info-foreground sm:flex-row sm:items-center";
  }

  function getNoticeIconClassName(tone: NoticeTone): string {
    if (tone === "error") {
      return "h-5 w-5 shrink-0 text-error";
    }

    if (tone === "success") {
      return "h-5 w-5 shrink-0 text-success";
    }

    return "h-5 w-5 shrink-0 text-info";
  }

  function isTerminalRun(status: RunPhase): boolean {
    return status === "completed" || status === "failed";
  }

  function getCurrentRunFilters(): string[] {
    const runIds: string[] = [];

    for (const rawRunId of searchParams.getAll("run")) {
      const runId = rawRunId.trim();

      if (uuidPattern.test(runId) && !runIds.includes(runId)) {
        runIds.push(runId);
      }
    }

    return runIds;
  }

  function replaceRunFilters(nextRunIds: string[]): void {
    const nextParams = new URLSearchParams(Array.from(searchParams.entries()));
    nextParams.delete("run");
    nextParams.delete("page");

    for (const runId of nextRunIds) {
      nextParams.append("run", runId);
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function showOnlySearchRun(runId: string): void {
    replaceRunFilters([runId]);
    hideRun(runId);
  }

  function toggleSearchRun(runId: string): void {
    const currentRunIds = getCurrentRunFilters();

    if (currentRunIds.includes(runId)) {
      replaceRunFilters(currentRunIds.filter((currentRunId) => currentRunId !== runId));
    } else {
      replaceRunFilters([...currentRunIds, runId]);
    }
  }

  function hideRun(runId: string): void {
    setTrackedRuns((current) => current.filter((run) => run.runId !== runId));
  }

  function dismissRun(runId: string): void {
    const currentRunIds = getCurrentRunFilters();

    hideRun(runId);

    if (currentRunIds.includes(runId)) {
      replaceRunFilters(currentRunIds.filter((currentRunId) => currentRunId !== runId));
    }
  }

  useEffect(() => {
    const activeRuns = trackedRuns.filter(
      (run) => run.status === "initializing" || run.status === "running",
    );

    if (activeRuns.length === 0) {
      return;
    }

    let cancelled = false;

    const pollRuns = async (): Promise<void> => {
      await Promise.all(
        activeRuns.map(async (run) => {
          try {
            const statusEndpoint =
              run.runKind === "url_import" ? "/api/agent/import-url" : "/api/agent/find";
            const response = await fetch(
              `${statusEndpoint}?runId=${encodeURIComponent(run.runId)}`,
            );

            if (response.status === 401) {
              if (!cancelled) {
                setTrackedRuns((current) =>
                  current.map((item) =>
                    item.runId === run.runId
                      ? {
                          ...item,
                          status: "running",
                          statusMessage:
                            "We could not verify this search status. Checking again in a moment.",
                        }
                      : item,
                  ),
                );
              }
              return;
            }

            const payload: unknown = await response.json();
            const success =
              typeof payload === "object" &&
              payload !== null &&
              "success" in payload &&
              payload.success === true;

            if (!success) {
              if (!cancelled && response.status < 500) {
                setTrackedRuns((current) =>
                  current.map((item) =>
                    item.runId === run.runId
                      ? {
                          ...item,
                          status: "failed",
                          completedAt: item.completedAt ?? Date.now(),
                          statusMessage: "Could not load this job search status.",
                        }
                      : item,
                  ),
                );
              }
              return;
            }

            const data =
              "data" in payload && typeof payload.data === "object" && payload.data !== null
                ? payload.data
                : null;
            const status = getRunStatus(data);
            const jobsFound = getJobsFound(data);
            const jobsSaved = getJobsSaved(data);
            const strongMatches = getStrongMatches(data);
            const statusMessage = getStatusMessage(data);
            const providerLabel = getProviderLabel(data);

            if (status === "running") {
              if (!cancelled) {
                setTrackedRuns((current) =>
                  current.map((item) =>
                    item.runId === run.runId
                      ? {
                          ...item,
                          status: "running",
                          providerLabel: providerLabel ?? item.providerLabel,
                          statusMessage: null,
                        }
                      : item,
                  ),
                );
              }
              return;
            }

            if (status === "completed" || status === "failed") {
              if (!cancelled) {
                setTrackedRuns((current) =>
                  current.map((item) =>
                    item.runId === run.runId
                      ? {
                          ...item,
                          status,
                          jobsFound,
                          jobsSaved,
                          strongMatches,
                          providerLabel: providerLabel ?? item.providerLabel,
                          completedAt: item.completedAt ?? Date.now(),
                          statusMessage:
                            status === "failed"
                              ? statusMessage ??
                                (item.runKind === "url_import"
                                  ? "URL import failed. Please try another public job URL."
                                  : "Job search failed. Please try again in a moment.")
                              : null,
                        }
                      : item,
                  ),
                );
                const label =
                  run.runKind === "url_import"
                    ? providerLabel ?? run.providerLabel ?? "URL import"
                    : run.searchMode === "profile_best_match"
                      ? "Best Match"
                      : `"${run.jobTitle}"`;
                if (status === "completed") {
                  if (run.runKind === "url_import") {
                    toast.success(`Imported ${label} job.`);
                  } else if (strongMatches > 0) {
                    toast.success(`${label} found ${jobsFound} jobs, ${strongMatches} strong matches.`);
                  } else if (jobsSaved > 0) {
                    toast.info(`${label} found ${jobsFound} jobs, ${jobsSaved} saved.`);
                  } else {
                    toast.info(`${label} found ${jobsFound} jobs. None saved.`);
                  }
                } else {
                  toast.error(`${label} failed. Please try again.`);
                }
                router.refresh();
              }
            }
          } catch (requestError) {
            console.error("[SearchControls] Job search status request failed:", requestError);
            if (!cancelled) {
              setTrackedRuns((current) =>
                current.map((item) =>
                  item.runId === run.runId
                    ? {
                        ...item,
                        status: "running",
                        statusMessage:
                          item.runKind === "url_import"
                            ? "Checking URL import status again in a moment."
                            : `Checking "${item.jobTitle}" status again in a moment.`,
                      }
                    : item,
                ),
              );
            }
          }
        }),
      );
    };

    const startId = window.setTimeout(() => {
      void pollRuns();
    }, 0);
    const intervalId = window.setInterval(() => {
      void pollRuns();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      window.clearInterval(intervalId);
    };
  }, [router, trackedRuns]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (jobTitle.trim().length < 2) {
      setError("Enter a job title before finding jobs.");
      return;
    }

    setIsSubmitting(true);
    const submittedJobTitle = jobTitle.trim();
    const submittedLocation = location.trim();

    try {
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle,
          location,
          mode: "manual_search",
        }),
      });

      if (response.status === 401) {
        await clearExpiredSession();
        setError("Your session expired. Please sign in again.");
        router.replace("/login?next=%2Ffind-jobs");
        return;
      }

      const payload: unknown = await response.json();
      const success =
        typeof payload === "object" &&
        payload !== null &&
        "success" in payload &&
        payload.success === true;

      if (success) {
        const data =
          "data" in payload && typeof payload.data === "object" && payload.data !== null
            ? payload.data
            : null;
        const runId = getRunId(data);

        if (runId) {
          const nextRun: TrackedRun = {
            runId,
            runKind: "adzuna_search",
            jobTitle: submittedJobTitle,
            location: submittedLocation,
            searchMode: "manual_search",
            status: "initializing",
            jobsFound: 0,
            jobsSaved: 0,
            strongMatches: 0,
            startedAt: Date.now(),
            completedAt: null,
            statusMessage: null,
          };

          setTrackedRuns((current) => [
            nextRun,
            ...current.filter((run) => run.runId !== runId),
          ].slice(0, MAX_TRACKED_RUNS));
        } else {
          router.refresh();
        }

        return;
      }

      const nextError =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "Failed to find jobs. Please try again.";

      setError(nextError);
    } catch (requestError) {
      console.error("[SearchControls] Find jobs request failed:", requestError);
      setError("Failed to find jobs. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBestMatch(): Promise<void> {
    setError(null);
    setIsSubmitting(true);
    const submittedLocation = location.trim();

    try {
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          mode: "profile_best_match",
        }),
      });

      if (response.status === 401) {
        await clearExpiredSession();
        setError("Your session expired. Please sign in again.");
        router.replace("/login?next=%2Ffind-jobs");
        return;
      }

      const payload: unknown = await response.json();
      const success =
        typeof payload === "object" &&
        payload !== null &&
        "success" in payload &&
        payload.success === true;

      if (success) {
        const data =
          "data" in payload && typeof payload.data === "object" && payload.data !== null
            ? payload.data
            : null;
        const runId = getRunId(data);

        if (runId) {
          const nextRun: TrackedRun = {
            runId,
            runKind: "adzuna_search",
            jobTitle: "Best Match",
            location: submittedLocation,
            searchMode: "profile_best_match",
            status: "initializing",
            jobsFound: 0,
            jobsSaved: 0,
            strongMatches: 0,
            startedAt: Date.now(),
            completedAt: null,
            statusMessage: null,
          };

          setTrackedRuns((current) => [
            nextRun,
            ...current.filter((run) => run.runId !== runId),
          ].slice(0, MAX_TRACKED_RUNS));
        } else {
          router.refresh();
        }

        return;
      }

      const nextError =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "Failed to find jobs. Please try again.";

      setError(nextError);
    } catch (requestError) {
      console.error("[SearchControls] Best Match request failed:", requestError);
      setError("Failed to find jobs. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImportUrl(): Promise<void> {
    setError(null);

    if (jobUrl.trim().length < 8) {
      setError("Enter a complete job URL to import.");
      return;
    }

    setIsImportingUrl(true);
    const submittedUrl = jobUrl.trim();

    try {
      const response = await fetch("/api/agent/import-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: submittedUrl,
        }),
      });

      if (response.status === 401) {
        await clearExpiredSession();
        setError("Your session expired. Please sign in again.");
        router.replace("/login?next=%2Ffind-jobs");
        return;
      }

      const payload: unknown = await response.json();
      const success =
        typeof payload === "object" &&
        payload !== null &&
        "success" in payload &&
        payload.success === true;

      if (success) {
        const data =
          "data" in payload && typeof payload.data === "object" && payload.data !== null
            ? payload.data
            : null;
        const runId = getRunId(data);
        const providerLabel = getProviderLabel(data) ?? "URL";

        if (runId) {
          const nextRun: TrackedRun = {
            runId,
            runKind: "url_import",
            jobTitle: "URL import",
            location: "",
            searchMode: "manual_search",
            sourceUrl: submittedUrl,
            providerLabel,
            status: "initializing",
            jobsFound: 0,
            jobsSaved: 0,
            strongMatches: 0,
            startedAt: Date.now(),
            completedAt: null,
            statusMessage: null,
          };

          setTrackedRuns((current) => [
            nextRun,
            ...current.filter((run) => run.runId !== runId),
          ].slice(0, MAX_TRACKED_RUNS));
        }

        setJobUrl("");
        return;
      }

      const nextError =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "Failed to import this job URL. Please try another public job page.";

      setError(nextError);
    } catch (requestError) {
      console.error("[SearchControls] URL import request failed:", requestError);
      setError("Failed to import this job URL. Please try another public job page.");
    } finally {
      setIsImportingUrl(false);
    }
  }

  return (
    <section
      aria-labelledby="find-jobs-search-heading"
      className="rounded-xl border border-border bg-surface p-6 shadow-sm"
    >
      <h1 id="find-jobs-search-heading" className="sr-only">
        Find jobs
      </h1>
      <form
        className="grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end"
        onSubmit={handleSubmit}
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Job Title
          </span>
          <span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-border bg-surface px-4 text-text-muted shadow-sm">
            <SearchIcon className="h-5 w-5 shrink-0" />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted"
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="Frontend Engineer"
              type="text"
              value={jobTitle}
            />
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Location
          </span>
          <span className="mt-2 flex h-12 items-center rounded-md border border-border bg-surface px-4 text-text-muted shadow-sm">
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted"
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Remote, New York..."
              type="text"
              value={location}
            />
          </span>
        </label>

        <button
          className="inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-medium leading-5 text-accent-foreground shadow-sm hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting || isImportingUrl}
          type="submit"
        >
          <SearchIcon className="h-5 w-5" />
          {isSubmitting ? "Starting..." : "Find Jobs"}
        </button>

        <button
          className="inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-md border border-border bg-surface px-6 text-sm font-medium leading-5 text-text-primary shadow-sm hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting || isImportingUrl}
          onClick={handleBestMatch}
          type="button"
        >
          <SparkleIcon className="h-5 w-5" />
          {isSubmitting ? "Starting..." : "Best Match"}
        </button>
      </form>

      <div className="mt-5 grid gap-4 border-t border-border pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Job URL
          </span>
          <span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-border bg-surface px-4 text-text-muted shadow-sm">
            <LinkIcon className="h-5 w-5 shrink-0" />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted"
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="https://www.jobstreet.com/..."
              type="url"
              value={jobUrl}
            />
          </span>
        </label>

        <button
          className="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-md border border-border bg-surface px-6 text-sm font-medium leading-5 text-text-primary shadow-sm hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting || isImportingUrl}
          onClick={handleImportUrl}
          type="button"
        >
          <LinkIcon className="h-5 w-5" />
          {isImportingUrl ? "Importing..." : "Import URL"}
        </button>
      </div>

      {error ? (
        <div
          aria-live="polite"
          className={`mt-5 ${getNoticeClassName("error")}`}
        >
          <SparkleIcon className={getNoticeIconClassName("error")} />
          <p>{error}</p>
        </div>
      ) : null}

      {trackedRuns.length > 0 ? (
        <div className="mt-5 space-y-2" aria-live="polite">
          {trackedRuns.map((run) => {
            const tone = getRunTone(run);
            const canDismiss = isTerminalRun(run.status);
            const canFilter = run.status === "completed" && run.runKind !== "url_import";
            const isActive = canFilter && getCurrentRunFilters().includes(run.runId);

            return (
              <div
                className={`${getNoticeClassName(tone)} ${isActive ? "border-l-2 border-l-accent" : ""}`}
                key={run.runId}
              >
                <div
                  aria-label={canFilter ? `Toggle ${run.jobTitle} search filter` : undefined}
                  className={`flex min-w-0 flex-1 items-center gap-3 ${canFilter ? "cursor-pointer select-none" : ""}`}
                  onClick={canFilter ? () => toggleSearchRun(run.runId) : undefined}
                  onKeyDown={canFilter ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSearchRun(run.runId);
                    }
                  } : undefined}
                  role={canFilter ? "button" : undefined}
                  tabIndex={canFilter ? 0 : undefined}
                >
                  <SparkleIcon className={getNoticeIconClassName(tone)} />
                  <p className="min-w-0">
                    {getRunProgressMessage(run)}
                    {getLocationSuffix(run.location)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {canFilter ? (
                    <button
                      className="inline-flex h-8 items-center justify-center rounded-md bg-accent px-3 text-xs font-semibold leading-4 text-accent-foreground hover:bg-accent-dark"
                      onClick={(event) => {
                        event.stopPropagation();
                        showOnlySearchRun(run.runId);
                      }}
                      type="button"
                    >
                      View results
                    </button>
                  ) : null}
                  {canDismiss ? (
                    <button
                      aria-label={`Dismiss ${run.jobTitle} search result`}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-current hover:bg-surface-secondary"
                      onClick={() => dismissRun(run.runId)}
                      type="button"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
