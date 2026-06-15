"use client";

import { useEffect, useRef, useState } from "react";

import { ResumePreview } from "@/components/profile/ResumePreview";
import { toast } from "@/lib/toast";

type TailoredResumeStatus = "idle" | "running" | "completed" | "failed";

type TailoredResumeNotes = {
  emphasized: string[];
  gapFraming: string[];
};

type Props = {
  company: string;
  error: string | null;
  generatedAt: string | null;
  hasResume: boolean;
  jobId: string;
  notes: TailoredResumeNotes | null;
  status: TailoredResumeStatus;
  title: string;
};

type TailorResumeApiResponse =
  | {
      success: true;
      data: {
        error: string | null;
        generatedAt: string | null;
        hasResume: boolean;
        jobId: string;
        notes: TailoredResumeNotes | null;
        status: TailoredResumeStatus;
      };
    }
  | { success: false; error: string };

function isTailorResumeApiResponse(value: unknown): value is TailorResumeApiResponse {
  if (typeof value !== "object" || value === null || !("success" in value)) {
    return false;
  }

  if (value.success === false) {
    return "error" in value && typeof value.error === "string";
  }

  if (value.success !== true || !("data" in value)) {
    return false;
  }

  const data = value.data;
  return (
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    (data.status === "idle" ||
      data.status === "running" ||
      data.status === "completed" ||
      data.status === "failed")
  );
}

function formatGeneratedAt(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function NotesList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li className="text-sm font-medium leading-5 text-text-primary" key={i}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function TailoredResumeCard({
  company,
  error,
  generatedAt,
  hasResume,
  jobId,
  notes,
  status,
  title,
}: Props) {
  const [currentStatus, setCurrentStatus] = useState<TailoredResumeStatus>(status);
  const [currentError, setCurrentError] = useState<string | null>(error);
  const [currentGeneratedAt, setCurrentGeneratedAt] = useState<string | null>(generatedAt);
  const [currentHasResume, setCurrentHasResume] = useState(hasResume);
  const [currentNotes, setCurrentNotes] = useState<TailoredResumeNotes | null>(notes);
  const [isStarting, setIsStarting] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(() =>
    status === "running" ? Date.now() : null,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const pollFailureCountRef = useRef(0);
  const isRunning = currentStatus === "running";
  const showProgressState = isStarting || isRunning;
  const tailoredResumeUrl = `/api/resume/tailored/${encodeURIComponent(jobId)}`;

  useEffect(() => {
    if (!showProgressState) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [showProgressState]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    let cancelled = false;
    let requestInFlight = false;

    const loadStatus = async (): Promise<void> => {
      if (requestInFlight) {
        return;
      }

      requestInFlight = true;

      try {
        const response = await fetch(
          `/api/resume/tailor?jobId=${encodeURIComponent(jobId)}`,
          { cache: "no-store" },
        );
        const json: unknown = await response.json();
        const result: TailorResumeApiResponse = isTailorResumeApiResponse(json)
          ? json
          : { success: false, error: "Could not load tailored resume status." };

        if (cancelled) {
          return;
        }

        if (!response.ok || !result.success) {
          pollFailureCountRef.current += 1;
          if (pollFailureCountRef.current >= 3) {
            setCurrentStatus("failed");
            setCurrentError(
              result.success ? "Could not load tailored resume status." : result.error,
            );
          }
          return;
        }

        pollFailureCountRef.current = 0;
        setCurrentStatus(result.data.status);
        setCurrentError(result.data.error);
        setCurrentGeneratedAt(result.data.generatedAt);
        setCurrentHasResume(result.data.hasResume);
        setCurrentNotes(result.data.notes);

        if (result.data.status === "completed") {
          toast.statusChange({
            variant: "completed",
            title: "Tailored resume ready",
            subtitle: `${company} — ${title}`,
          });
        } else if (result.data.status === "failed") {
          toast.statusChange({
            variant: "error",
            title: result.data.error ?? "Resume tailoring failed",
            subtitle: `${company} — ${title}`,
          });
        }
      } catch (requestError) {
        console.error("[TailoredResumeCard] Tailored resume status request failed:", requestError);
      } finally {
        requestInFlight = false;
      }
    };

    const startId = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadStatus();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      window.clearInterval(intervalId);
    };
  }, [company, isRunning, jobId, title]);

  function getProgressStep(): number {
    if (!showProgressState || !startedAt) {
      return 0;
    }

    const elapsedSeconds = Math.floor((nowMs - startedAt) / 1000);
    if (elapsedSeconds < 8) return 1;
    if (elapsedSeconds < 18) return 2;
    if (elapsedSeconds < 32) return 3;
    return 4;
  }

  function getProgressMessage(): string {
    const step = getProgressStep();

    if (step === 1) {
      return "Reading your saved profile and role requirements.";
    }

    if (step === 2) {
      return "Matching your strongest evidence to this job.";
    }

    if (step === 3) {
      return "Writing a focused resume without changing your base profile.";
    }

    return "Rendering the private PDF and saving it to this job.";
  }

  const startTailoring = (): void => {
    setIsStarting(true);
    setCurrentError(null);
    setStartedAt(Date.now());
    pollFailureCountRef.current = 0;

    const run = async (): Promise<void> => {
      try {
        const response = await fetch("/api/resume/tailor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        const json: unknown = await response.json();
        const result: TailorResumeApiResponse = isTailorResumeApiResponse(json)
          ? json
          : { success: false, error: "Could not start resume tailoring." };

        if (!response.ok || !result.success) {
          const message = result.success
            ? "Could not start resume tailoring."
            : result.error;
          setIsStarting(false);
          setCurrentStatus("failed");
          setCurrentError(message);
          toast.error(message);
          return;
        }

        setCurrentStatus(result.data.status);
        setCurrentError(result.data.error);
        setCurrentGeneratedAt(result.data.generatedAt);
        setCurrentHasResume(result.data.hasResume);
        setCurrentNotes(result.data.notes);
        toast.info("Resume tailoring started. We'll update this job when it's ready.");
      } catch (requestError) {
        console.error("[TailoredResumeCard] Tailored resume request failed:", requestError);
        setIsStarting(false);
        setCurrentStatus("failed");
        setCurrentError("Could not start resume tailoring.");
        toast.error("Could not start resume tailoring.");
      } finally {
        setIsStarting(false);
      }
    };

    void run();
  };

  const generatedLabel = formatGeneratedAt(currentGeneratedAt);
  const buttonLabel = currentHasResume ? "Regenerate" : "Tailor Resume";

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-accent">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M7 3h7l4 4v14H7V3Z"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
              <path
                d="M14 3v5h5M10 13h5M10 17h5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <div>
            <h2 className="text-base font-semibold leading-6 text-text-primary">
              Tailored Resume
            </h2>
            {generatedLabel ? (
              <p className="mt-1 text-xs font-medium leading-4 text-text-muted">
                Generated {generatedLabel}
              </p>
            ) : null}
          </div>
        </div>
        <button
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium leading-5 transition-colors disabled:cursor-not-allowed ${
            showProgressState
              ? "bg-surface-secondary text-text-muted"
              : currentHasResume
                ? "border border-border bg-surface text-text-primary hover:border-text-secondary hover:bg-surface-secondary"
                : "bg-accent text-accent-foreground hover:bg-accent-dark"
          }`}
          disabled={isStarting || isRunning}
          onClick={startTailoring}
          type="button"
        >
          {currentHasResume && !showProgressState ? (
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M1 4v6h6M23 20v-6h-6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          ) : null}
          {showProgressState ? "Tailoring..." : buttonLabel}
        </button>
      </div>

      {currentHasResume && currentStatus === "completed" ? (
        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-border bg-surface-secondary p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold leading-5 text-text-primary">
                  tailored-resume.pdf
                </p>
                <p className="mt-1 text-xs font-medium leading-4 text-text-muted">
                  Private PDF for {company}
                </p>
              </div>
              <a
                className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold leading-5 text-accent-foreground hover:bg-accent-dark"
                href={tailoredResumeUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open PDF
              </a>
            </div>
          </div>

          {currentNotes ? (
            <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold leading-5 text-text-primary">
                  Emphasized
                </h3>
                <NotesList items={currentNotes.emphasized} />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-5 text-text-primary">
                  Gap Framing
                </h3>
                {currentNotes.gapFraming.length > 0 ? (
                  <NotesList items={currentNotes.gapFraming} />
                ) : (
                  <p className="mt-3 text-sm font-medium leading-5 text-text-muted">
                    No gap-specific framing was needed.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <ResumePreview
            fileUrl={tailoredResumeUrl}
            openHref={tailoredResumeUrl}
            resumePdfKey={jobId}
            resumePdfUrl={tailoredResumeUrl}
            title="Tailored Resume Preview"
          />
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path
                d="M7 3h7l4 4v14H7V3Z"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
              <path
                d="M14 3v5h5M10 13h5M10 17h5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <p className="mt-5 text-sm font-semibold leading-5 text-text-primary">
            {showProgressState ? "Tailoring in progress" : "No tailored resume yet"}
          </p>
          <p className="mt-2 max-w-[380px] text-sm font-medium leading-5 text-text-muted">
            {showProgressState
              ? getProgressMessage()
              : "Generate a private resume PDF focused on this role and company."}
          </p>
          {showProgressState ? (
            <div className="mt-6 grid w-full max-w-[480px] gap-3 sm:grid-cols-4">
              {["Load", "Match", "Write", "Render"].map((label, index) => {
                const stepNumber = index + 1;
                const isActive = getProgressStep() >= stepNumber;

                return (
                  <div className="flex flex-col items-center gap-2 text-center" key={label}>
                    <span
                      className={`h-1.5 w-full rounded-full ${
                        isActive ? "bg-accent" : "bg-border-light"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium leading-4 ${
                        isActive ? "text-accent" : "text-text-muted"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
          {currentStatus === "failed" && currentError ? (
            <p className="mt-4 max-w-[420px] text-xs font-semibold leading-4 text-error">
              {currentError}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
