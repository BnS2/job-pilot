"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { clearExpiredSession } from "@/lib/auth-client";

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

export function SearchControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isEmptyResult, setIsEmptyResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isSubmitting) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  const progressMessage =
    elapsedSeconds < 5
      ? "Searching Adzuna for IT roles..."
      : elapsedSeconds < 18
        ? "Scoring each job against your profile..."
        : elapsedSeconds < 35
          ? "Saving the best structured matches..."
          : "Still working through the results. This can take a little while.";

  function getNextScopedUrl(runId: string): string {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("run", runId);
    params.delete("q");
    params.delete("match");
    params.delete("sort");
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  }

  function getRunId(data: object | null): string | null {
    if (data && "runId" in data && typeof data.runId === "string" && data.runId.trim()) {
      return data.runId;
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    setIsEmptyResult(false);
    setError(null);

    if (jobTitle.trim().length < 2) {
      setError("Enter a job title before finding jobs.");
      return;
    }

    setIsSubmitting(true);
    setElapsedSeconds(0);

    try {
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle,
          location,
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
        const nextMessage =
          data && "message" in data && typeof data.message === "string"
            ? data.message
            : "Jobs found and saved.";
        const empty =
          data && "empty" in data && typeof data.empty === "boolean"
            ? data.empty
            : false;
        const runId = getRunId(data);

        setMessage(nextMessage);
        setIsEmptyResult(empty);

        if (runId) {
          router.replace(getNextScopedUrl(runId));
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

  return (
    <section
      aria-labelledby="find-jobs-search-heading"
      className="rounded-xl border border-border bg-surface p-6 shadow-sm"
    >
      <h1 id="find-jobs-search-heading" className="sr-only">
        Find jobs
      </h1>
      <form
        className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
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
          disabled={isSubmitting}
          type="submit"
        >
          <SearchIcon className="h-5 w-5" />
          {isSubmitting ? "Finding..." : "Find Jobs"}
        </button>
      </form>

      {isSubmitting ? (
        <div
          aria-live="polite"
          className="mt-5 flex items-center gap-3 rounded-md border border-info/20 bg-info-lightest px-4 py-4 text-sm font-semibold leading-5 text-info-foreground"
        >
          <SparkleIcon className="h-5 w-5 shrink-0 text-info" />
          <p>{progressMessage}</p>
        </div>
      ) : null}

      {message ? (
        <div
          className={
            isEmptyResult
              ? "mt-5 flex items-center gap-3 rounded-md border border-info/20 bg-info-lightest px-4 py-4 text-sm font-semibold leading-5 text-info-foreground"
              : "mt-5 flex items-center gap-3 rounded-md border border-success/20 bg-success-lightest px-4 py-4 text-sm font-semibold leading-5 text-success-foreground"
          }
        >
          <SparkleIcon
            className={isEmptyResult ? "h-5 w-5 shrink-0 text-info" : "h-5 w-5 shrink-0 text-success"}
          />
          <p>{message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 flex items-center gap-3 rounded-md border border-error/20 bg-error/10 px-4 py-4 text-sm font-semibold leading-5 text-error">
          <SparkleIcon className="h-5 w-5 shrink-0 text-error" />
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  );
}
