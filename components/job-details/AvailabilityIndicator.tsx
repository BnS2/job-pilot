"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useJobStatus } from "@/components/job-details/JobStatusProvider";
import { isJobStatus } from "@/lib/utils";

type AvailabilityStatus = "idle" | "checking" | "active" | "unavailable" | "error";

type Props = {
  jobId: string;
  company: string;
  title: string;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CheckCircleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--color-success)" />
      <path
        d="M8 12.5l2.5 2.5 5-5"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function WarningTriangleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 2L2 22h20L12 2z"
        fill="var(--color-warning)"
      />
      <path
        d="M12 10v4"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <circle cx="12" cy="17.5" r="1.25" fill="var(--color-surface)" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--color-error)" />
      <path
        d="M8.5 8.5l7 7M15.5 8.5l-7 7"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--color-text-muted)"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="var(--color-accent)"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" fill="var(--color-text-muted)" />
    </svg>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function AvailabilityIndicator({ jobId, company, title }: Props) {
  const { status, setStatus } = useJobStatus();
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const checkingRef = useRef(false);
  const initialCheckDoneRef = useRef(false);
  const prevStatusRef = useRef(status);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const CHECK_TIMEOUT_MS = 15000;

  const performCheck = useCallback(
    async (force: boolean) => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      setAvailabilityStatus("checking");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

      try {
        const res = await fetch("/api/agent/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, force }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data: unknown = await res.json();
        const parsed = isRecord(data) ? data : {};

        if (parsed.success === true) {
          const statusValue =
            typeof parsed.status === "string" && isJobStatus(parsed.status)
              ? parsed.status
              : null;
          if (statusValue) {
            prevStatusRef.current = statusValue;
            setStatus(statusValue);
          }
          setAvailabilityStatus(statusValue === "unavailable" ? "unavailable" : "active");
        } else {
          setAvailabilityStatus("error");
        }
        setLastCheckedAt(new Date().toISOString());
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("[AvailabilityIndicator] Check failed:", err);
        setAvailabilityStatus("error");
        setLastCheckedAt(new Date().toISOString());
      } finally {
        checkingRef.current = false;
      }
    },
    [jobId, setStatus],
  );

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!initialCheckDoneRef.current) {
        initialCheckDoneRef.current = true;
        void performCheck(false);
      }
    }, 0);

    return () => {
      clearTimeout(timerId);
    };
  }, [performCheck]);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (prevStatusRef.current === status) {
      return undefined;
    }

    prevStatusRef.current = status;
    if (status === "active" || status === "unavailable") {
      timerId = setTimeout(() => {
        void performCheck(false);
      }, 0);
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [status, performCheck]);

  const handleClick = () => {
    performCheck(true);
  };

  const handleMouseEnter = () => {
    clearTimeout(hideTimerRef.current);
    if (!showTooltip) {
      showTimerRef.current = setTimeout(() => setShowTooltip(true), 400);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(showTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowTooltip(false), 240);
  };

  useEffect(() => {
    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  const icon = () => {
    switch (availabilityStatus) {
      case "checking":
        return <SpinnerIcon />;
      case "active":
        return <CheckCircleIcon />;
      case "unavailable":
        return <WarningTriangleIcon />;
      case "error":
        return <XCircleIcon />;
      case "idle":
      default:
        return <DotIcon />;
    }
  };

  const checkedLabel = lastCheckedAt ? relativeTime(lastCheckedAt) : null;
  const tooltipId = `availability-tooltip-${jobId}`;

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        aria-label="Check listing availability"
        aria-describedby={showTooltip ? tooltipId : undefined}
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border bg-surface shadow-sm transition-all hover:-translate-y-px hover:bg-surface-secondary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
        disabled={availabilityStatus === "checking"}
        onBlur={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleMouseEnter}
        type="button"
      >
        {icon()}
      </button>

      {showTooltip ? (
        <div
          className="absolute right-0 top-full z-20 w-72 pt-2"
          id={tooltipId}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="tooltip"
        >
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg">
            <div className="mt-0.5 shrink-0">{icon()}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5 text-text-primary">
                {availabilityStatus === "active" && "Listing is active"}
                {availabilityStatus === "unavailable" && "Listing is unavailable"}
                {availabilityStatus === "checking" && "Checking availability..."}
                {availabilityStatus === "error" && "Check failed"}
                {availabilityStatus === "idle" && "Not checked yet"}
              </p>
              <p className="mt-0.5 text-xs leading-4 text-text-secondary">
                <span className="block font-medium text-text-secondary">{company}</span>
                <span className="block break-words">{title}</span>
              </p>

              {availabilityStatus === "active" ? (
                <p className="mt-1.5 text-xs leading-4 text-success-foreground">
                  This job post is still accepting applications.
                </p>
              ) : null}
              {availabilityStatus === "unavailable" ? (
                <p className="mt-1.5 text-xs leading-4 text-warning">
                  This listing has been removed or expired.
                </p>
              ) : null}
              {availabilityStatus === "error" ? (
                <p className="mt-1.5 text-xs leading-4 text-error">
                  Could not verify availability.
                </p>
              ) : null}

              {checkedLabel ? (
                <p className="mt-2 text-xs leading-4 text-text-muted">
                  Checked {checkedLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
