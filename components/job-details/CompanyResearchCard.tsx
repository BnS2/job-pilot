"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  companyResearchSchema,
  type CompanyResearchDossier,
} from "@/lib/company-research";
import { toast } from "@/lib/toast";

type ResearchStatus = "idle" | "running" | "completed" | "failed";

type Props = {
  company: string;
  dossier: CompanyResearchDossier | null;
  error: string | null;
  jobId: string;
  status: ResearchStatus;
};

type ResearchApiResponse = {
  data?: unknown;
  success?: unknown;
  status?: unknown;
  error?: unknown;
};

function isResearchApiResponse(value: unknown): value is ResearchApiResponse {
  return typeof value === "object" && value !== null;
}

function DossierList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm font-medium leading-5 text-text-muted">No details found.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li className="text-sm font-medium leading-5 text-text-primary" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function DossierSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border pt-5">
      <h3 className="text-sm font-semibold leading-5 text-text-primary">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function CompanyResearchCard({
  company,
  dossier,
  error,
  jobId,
  status,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const [currentDossier, setCurrentDossier] = useState<CompanyResearchDossier | null>(dossier);
  const [currentStatus, setCurrentStatus] = useState<ResearchStatus>(status);
  const [message, setMessage] = useState<string | null>(error);
  const [startedAt, setStartedAt] = useState<number | null>(() =>
    status === "running" ? Date.now() : null,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizingText, setFinalizingText] = useState("");
  const isRunning = currentStatus === "running" && !currentDossier && !isFinalizing;
  const pollFailureCountRef = useRef(0);

  const showResearchReadyToast = (): void => {
    toast.statusChange({
      variant: "completed",
      title: "Company research ready",
      subtitle: company,
    });
  };

  const showResearchErrorToast = (errorMessage: string): void => {
    toast.statusChange({
      variant: "error",
      title: errorMessage,
      subtitle: company,
    });
  };

  const handlePollFailure = (): void => {
    pollFailureCountRef.current += 1;

    if (pollFailureCountRef.current < 3) {
      return;
    }

    pollFailureCountRef.current = 0;
    const errorMsg = "Company research is still running, but status updates are not reachable.";
    setCurrentStatus("failed");
    setMessage(errorMsg);
    showResearchErrorToast(errorMsg);
  };

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isRunning]);

  function getQuirkyFinalizeText(): string {
    const texts = [
      "Putting everything together for you...",
      "Dusting off our detective hat one last time...",
      "Organizing the intel into a tidy dossier...",
      "Brewing the final summary fresh from the research pot...",
    ];
    return texts[Math.floor(Math.random() * texts.length)] ?? texts[0];
  }

  const cancelledRef = useRef(false);
  const finalizeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    cancelledRef.current = false;

    const loadStatus = async (): Promise<void> => {
      try {
        const response = await fetch(
          `/api/agent/research?jobId=${encodeURIComponent(jobId)}`,
        );
        const json: unknown = await response.json();
        const data = isResearchApiResponse(json) ? json : {};

        if (cancelledRef.current) {
          return;
        }

        if (data.success !== true) {
          handlePollFailure();
          return;
        }

        pollFailureCountRef.current = 0;

        if (
          data.status === "idle" ||
          data.status === "running" ||
          data.status === "completed" ||
          data.status === "failed"
        ) {
          setCurrentStatus(data.status);
        }

        if (typeof data.error === "string") {
          setMessage(data.error);
        } else if (data.status !== "failed") {
          setMessage(null);
        }

        const parsedDossier = companyResearchSchema.safeParse(data.data);
        if (parsedDossier.success && !isFinalizing) {
          setIsFinalizing(true);
          setFinalizingText(getQuirkyFinalizeText());
          finalizeTimeoutRef.current = window.setTimeout(() => {
            if (cancelledRef.current) {
              return;
            }

            setCurrentDossier(parsedDossier.data);
            setCurrentStatus("completed");
            setMessage("Research is ready.");
            setIsFinalizing(false);
            showResearchReadyToast();
            finalizeTimeoutRef.current = null;
          }, 2000);
        }
      } catch (requestError) {
        console.error("[CompanyResearchCard] Research status request failed:", requestError);
        if (!cancelledRef.current) {
          handlePollFailure();
        }
      }
    };

    const startId = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadStatus();
    }, 2500);

    return () => {
      cancelledRef.current = true;
      window.clearTimeout(startId);
      window.clearInterval(intervalId);
      if (finalizeTimeoutRef.current !== null) {
        window.clearTimeout(finalizeTimeoutRef.current);
        finalizeTimeoutRef.current = null;
      }
    };
    // isFinalizing intentionally excluded — it triggers through state, not as a polling trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, jobId, company]);

  function getProgressStep(): number {
    if (!isRunning || !startedAt) {
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
      return `Finding official public pages for ${company}.`;
    }

    if (step === 2) {
      return "Reading company pages and source context.";
    }

    if (step === 3) {
      return "Connecting the company research to your profile and this role.";
    }

    return "Finalizing the briefing and source list.";
  }

  const handleRerun = (): void => {
    setCurrentDossier(null);
    setCurrentStatus("running");
    setMessage(null);
    setIsFinalizing(false);
    setFinalizingText("");
    pollFailureCountRef.current = 0;
    cancelledRef.current = false;
    void handleResearch();
  };

  const handleResearch = async (): Promise<void> => {
    setIsPending(true);
    setMessage(null);
    pollFailureCountRef.current = 0;

    try {
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const json: unknown = await response.json();
      const data = isResearchApiResponse(json) ? json : {};

      if (data.success === true) {
        if (data.status === "running") {
          setCurrentStatus("running");
          setStartedAt(Date.now());
        } else {
          const parsedDossier = companyResearchSchema.safeParse(data.data);
          if (parsedDossier.success) {
            setCurrentDossier(parsedDossier.data);
          }
          setCurrentStatus("completed");
          setMessage("Research is ready.");
          showResearchReadyToast();
        }
      } else {
        setCurrentStatus("failed");
        const errorMsg = typeof data.error === "string"
          ? data.error
          : "Company research could not be started.";
        setMessage(errorMsg);
        showResearchErrorToast(errorMsg);
      }
    } catch (requestError) {
      console.error("[CompanyResearchCard] Research request failed:", requestError);
      setCurrentStatus("failed");
      const errorMsg = "Company research could not be started.";
      setMessage(errorMsg);
      showResearchErrorToast(errorMsg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-accent">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M7 21V6.8c0-.5.3-.9.8-1L15 4v17M4 21h16M10 10h2m-2 4h2m6 7v-8.5c0-.4-.3-.8-.7-.9L15 11m3 4h-1"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </span>
          <h2 className="text-base font-semibold leading-6 text-text-primary">
            Company Research
          </h2>
        </div>
        {currentDossier ? (
          <button
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 transition-colors disabled:cursor-not-allowed ${
              isPending || isRunning
                ? "text-text-muted"
                : "text-text-primary hover:bg-surface-secondary hover:border-text-secondary"
            }`}
            disabled={isPending || isRunning}
            onClick={handleRerun}
            type="button"
          >
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
            {isPending || isRunning ? "Re-running..." : "Re-run Research"}
          </button>
        ) : (
          <button
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold leading-5 transition-colors disabled:cursor-not-allowed ${
              isPending || isRunning
                ? "bg-surface-secondary text-text-muted"
                : "bg-accent text-accent-foreground hover:bg-accent-dark"
            }`}
            disabled={isPending || isRunning}
            onClick={handleResearch}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="m20 20-4.5-4.5m2.5-5A7.5 7.5 0 1 1 3 10.5a7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            {isPending || isRunning ? "Researching..." : "Research Company"}
          </button>
        )}
      </div>

      {currentDossier ? (
        <div className="space-y-5 p-6">
          <div>
            <h3 className="text-sm font-semibold leading-5 text-text-primary">
              Company Overview
            </h3>
            <p className="mt-3 text-sm font-medium leading-6 text-text-primary">
              {currentDossier.companyOverview}
            </p>
          </div>

          <DossierSection title="Tech Stack">
            {currentDossier.techStack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentDossier.techStack.map((item) => (
                  <span
                    className="rounded-full bg-success-lightest px-2 py-0.5 text-xs font-medium leading-4 text-success-foreground"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium leading-5 text-text-muted">
                No specific stack found.
              </p>
            )}
          </DossierSection>

          <DossierSection title="Culture">
            <DossierList items={currentDossier.culture} />
          </DossierSection>

          <DossierSection title="Why This Role">
            <p className="text-sm font-medium leading-6 text-text-primary">
              {currentDossier.whyThisRole}
            </p>
          </DossierSection>

          <DossierSection title="Your Edge">
            <DossierList items={currentDossier.yourEdge} />
          </DossierSection>

          <DossierSection title="Gaps to Address">
            <DossierList items={currentDossier.gapsToAddress} />
          </DossierSection>

          <DossierSection title="Smart Questions">
            <DossierList items={currentDossier.smartQuestions} />
          </DossierSection>

          <DossierSection title="Interview Prep">
            <DossierList items={currentDossier.interviewPrep} />
          </DossierSection>

          <DossierSection title="Sources">
            {currentDossier.sources.length > 0 ? (
              <div className="flex flex-col gap-2">
                {currentDossier.sources.map((source) => (
                  <a
                    className="break-all text-xs font-medium leading-4 text-accent"
                    href={source}
                    key={source}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium leading-5 text-text-muted">
                Research was generated from the job posting and profile.
              </p>
            )}
          </DossierSection>
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path
                d="M7 21V6.8c0-.5.3-.9.8-1L15 4v17M4 21h16M10 10h2m-2 4h2m6 7v-8.5c0-.4-.3-.8-.7-.9L15 11m3 4h-1"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </span>
          <p className="mt-5 text-sm font-semibold leading-5 text-text-primary">
            {isRunning || isFinalizing ? "Research in progress" : "No research yet"}
          </p>
          <p className="mt-2 max-w-[340px] text-sm font-medium leading-5 text-text-muted">
            {isFinalizing
              ? finalizingText
              : isRunning
                ? getProgressMessage()
                : `Company research for ${company} has not been generated yet.`}
          </p>
          {isRunning || isFinalizing ? (
            <div className="mt-6 grid w-full max-w-[480px] gap-3 sm:grid-cols-4">
              {[
                "Discover",
                "Read",
                "Synthesize",
                "Finalize",
              ].map((label, index) => {
                const stepNumber = index + 1;
                const isActive = isFinalizing || getProgressStep() >= stepNumber;

                return (
                  <div
                    className="flex flex-col items-center gap-2 text-center"
                    key={label}
                  >
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
          {isFinalizing ? (
            <div className="mt-5 flex items-center gap-2">
              <svg
                aria-hidden="true"
                className="h-4 w-4 animate-spin text-accent"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-xs font-medium leading-4 text-text-muted">
                {finalizingText}
              </span>
            </div>
          ) : null}
          {message ? (
            <p
              className={`mt-4 max-w-[420px] text-xs font-medium leading-4 ${
                currentStatus === "failed" ? "text-error" : "text-success-foreground"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
