"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getJobStatusLabel, type JobStatus } from "@/lib/utils";

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

function ChevronIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 9 6 6 6-6"
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

type SelectedSearchRun = {
  id: string;
  jobTitle: string;
  location: string | null;
};

type Props = {
  qValues: string[];
  match: string;
  selectedSearchRuns: SelectedSearchRun[];
  sort: string;
  status: JobStatus | "all";
};

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s@._/+&#-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function getSearchRunLabel(run: SelectedSearchRun): string {
  return run.location ? `${run.jobTitle} - ${run.location}` : run.jobTitle;
}

export function JobFilters({ qValues, match, selectedSearchRuns, sort, status }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchVal, setSearchVal] = useState("");
  const [matchOpen, setMatchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const matchMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const justAddedChip = useRef(false);
  const prevQValuesRef = useRef(qValues);

  useEffect(() => {
    if (prevQValuesRef.current !== qValues) {
      prevQValuesRef.current = qValues;
      setSearchVal("");
      if (justAddedChip.current) {
        justAddedChip.current = false;
        inputRef.current?.focus();
      }
    }
  }, [qValues]);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      }
      // reset page to 1 when changing filters or search
      if (!params.page) {
        current.delete("page");
      }
      return current.toString();
    },
    [searchParams]
  );

  const replaceWithQuery = useCallback(
    (queryString: string): void => {
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(url, { scroll: false });
      router.refresh();
    },
    [pathname, router],
  );

  const removeSearchRun = useCallback(
    (runId: string): void => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      const nextRunIds = current.getAll("run").filter((currentRunId) => currentRunId !== runId);

      current.delete("run");
      current.delete("page");

      for (const nextRunId of nextRunIds) {
        current.append("run", nextRunId);
      }

      replaceWithQuery(current.toString());
    },
    [replaceWithQuery, searchParams],
  );

  const removeTextFilter = useCallback(
    (qValue: string): void => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      const nextQValues = current
        .getAll("q")
        .filter((currentQ) => normalizeSearchValue(currentQ) !== qValue);

      current.delete("q");
      current.delete("page");

      for (const nextQ of nextQValues) {
        current.append("q", nextQ);
      }

      replaceWithQuery(current.toString());
    },
    [replaceWithQuery, searchParams],
  );

  const addTextFilter = useCallback(
    (value: string): void => {
      const normalized = normalizeSearchValue(value);

      if (!normalized) {
        return;
      }

      const current = new URLSearchParams(Array.from(searchParams.entries()));
      const existing = current.getAll("q").map((v) => v.trim()).filter(Boolean);

      if (!existing.includes(normalized)) {
        current.append("q", normalized);
      }

      current.delete("page");
      replaceWithQuery(current.toString());
      setSearchVal("");
      justAddedChip.current = true;
    },
    [replaceWithQuery, searchParams],
  );

  const clearSearchFilters = useCallback((): void => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete("q");
    current.delete("run");
    current.delete("page");
    replaceWithQuery(current.toString());
    setSearchVal("");
  }, [replaceWithQuery, searchParams]);

  const hasFilters = qValues.length > 0 || selectedSearchRuns.length > 0;
  const chipCount = qValues.length + selectedSearchRuns.length;

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent): void {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (matchOpen && !matchMenuRef.current?.contains(target)) {
        setMatchOpen(false);
      }

      if (sortOpen && !sortMenuRef.current?.contains(target)) {
        setSortOpen(false);
      }

      if (statusOpen && !statusMenuRef.current?.contains(target)) {
        setStatusOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [matchOpen, sortOpen, statusOpen]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTextFilter(searchVal);
    }
  }

  const matchOptions = [
    { value: "all", label: "All Matches" },
    { value: "high", label: "High Match (≥ 70%)" },
    { value: "low", label: "Low Match (< 70%)" },
  ];

  const sortOptions = [
    { value: "match", label: "Match Score" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
  ];

  const statusOptions: Array<{ value: JobStatus | "all"; label: string }> = [
    { value: "active", label: getJobStatusLabel("active") },
    { value: "applied", label: getJobStatusLabel("applied") },
    { value: "unavailable", label: getJobStatusLabel("unavailable") },
    { value: "archived", label: getJobStatusLabel("archived") },
    { value: "rejected", label: getJobStatusLabel("rejected") },
    { value: "completed", label: getJobStatusLabel("completed") },
    { value: "all", label: "All Statuses" },
  ];

  const currentMatchLabel = matchOptions.find((o) => o.value === match)?.label || "All Matches";
  const currentSortLabel = sortOptions.find((o) => o.value === sort)?.label || "Match Score";
  const currentStatusLabel = statusOptions.find((o) => o.value === status)?.label || "Active";

  return (
    <section
      aria-label="Job list controls"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-center"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label className="flex h-10 min-w-0 items-center gap-3 text-text-muted">
          <SearchIcon className="h-5 w-5 shrink-0" />
          <span className="sr-only">Filter by company or role</span>
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted"
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Filter by company or role..."
            ref={inputRef}
            type="text"
            value={searchVal}
          />
          {searchVal ? (
            <span
              aria-hidden="true"
              className="pointer-events-none shrink-0 select-none text-xs font-medium leading-4 text-text-muted"
            >
              Enter ↵
            </span>
          ) : null}
        </label>

        {hasFilters ? (
          <div
            aria-label="Active search filters"
            className="flex flex-wrap items-center gap-2 pl-8"
          >
            {qValues.map((qValue) => (
              <span
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-accent/20 bg-accent-muted px-3 py-1 text-xs font-medium leading-4 text-accent"
                key={qValue}
              >
                <span className="min-w-0 truncate">{qValue}</span>
                <button
                  aria-label={`Remove "${qValue}" filter`}
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-accent hover:bg-surface"
                  onClick={() => removeTextFilter(qValue)}
                  type="button"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}

            {selectedSearchRuns.map((run) => (
              <span
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-accent/20 bg-accent-muted px-3 py-1 text-xs font-medium leading-4 text-accent"
                key={run.id}
              >
                <span className="min-w-0 truncate">{getSearchRunLabel(run)}</span>
                <button
                  aria-label={`Remove ${run.jobTitle} search filter`}
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-accent hover:bg-surface"
                  onClick={() => removeSearchRun(run.id)}
                  type="button"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}

            {chipCount > 1 ? (
              <button
                className="inline-flex h-6 items-center justify-center rounded-md border border-border bg-surface px-2 text-xs font-medium leading-4 text-text-secondary hover:bg-surface-secondary hover:text-text-dark"
                onClick={clearSearchFilters}
                type="button"
              >
                Clear search filters
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="hidden h-10 w-px bg-border lg:block" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative" ref={statusMenuRef}>
          <button
            className="inline-flex h-10 w-full min-w-36 items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 text-text-primary shadow-sm transition-colors hover:border-text-secondary cursor-pointer"
            onClick={() => {
              setStatusOpen(!statusOpen);
              setMatchOpen(false);
              setSortOpen(false);
            }}
            type="button"
          >
            {currentStatusLabel}
            <ChevronIcon className="h-4 w-4 text-text-secondary" />
          </button>

          {statusOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md border border-border bg-surface shadow-lg focus:outline-none">
              <div className="py-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`block w-full px-4 py-2 text-left text-sm font-medium leading-5 transition-colors cursor-pointer ${
                      status === opt.value
                        ? "bg-accent-muted text-accent"
                        : "text-text-primary hover:bg-surface-secondary hover:text-text-dark"
                    }`}
                    onClick={() => {
                      const qs = createQueryString({
                        status: opt.value === "active" ? null : opt.value,
                      });
                      replaceWithQuery(qs);
                      setStatusOpen(false);
                    }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Match Filter Dropdown */}
        <div className="relative" ref={matchMenuRef}>
          <button
            className="inline-flex h-10 w-full min-w-36 items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 text-text-primary shadow-sm hover:border-text-secondary transition-colors cursor-pointer"
            onClick={() => {
              setMatchOpen(!matchOpen);
              setSortOpen(false);
              setStatusOpen(false);
            }}
            type="button"
          >
            {currentMatchLabel}
            <ChevronIcon className="h-4 w-4 text-text-secondary" />
          </button>

          {matchOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md border border-border bg-surface shadow-lg focus:outline-none">
              <div className="py-1">
                {matchOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`block w-full px-4 py-2 text-left text-sm font-medium leading-5 transition-colors cursor-pointer ${
                      match === opt.value
                        ? "text-accent bg-accent-muted"
                        : "text-text-primary hover:bg-surface-secondary hover:text-text-dark"
                    }`}
                    onClick={() => {
                      const qs = createQueryString({ match: opt.value });
                      replaceWithQuery(qs);
                      setMatchOpen(false);
                    }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort Filter Dropdown */}
        <div className="relative" ref={sortMenuRef}>
          <button
            className="inline-flex h-10 w-full min-w-40 items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 text-text-primary shadow-sm hover:border-text-secondary transition-colors cursor-pointer"
            onClick={() => {
              setSortOpen(!sortOpen);
              setMatchOpen(false);
              setStatusOpen(false);
            }}
            type="button"
          >
            {currentSortLabel}
            <ChevronIcon className="h-4 w-4 text-text-secondary" />
          </button>

          {sortOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md border border-border bg-surface shadow-lg focus:outline-none">
              <div className="py-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`block w-full px-4 py-2 text-left text-sm font-medium leading-5 transition-colors cursor-pointer ${
                      sort === opt.value
                        ? "text-accent bg-accent-muted"
                        : "text-text-primary hover:bg-surface-secondary hover:text-text-dark"
                    }`}
                    onClick={() => {
                      const qs = createQueryString({ sort: opt.value });
                      replaceWithQuery(qs);
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
