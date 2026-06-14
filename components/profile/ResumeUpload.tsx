"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";

import { deleteProfileResume, updateProfileResume } from "@/actions/profile";
import { ResumePreview } from "@/components/profile/ResumePreview";
import { insforge } from "@/lib/insforge-client";
import { toast } from "@/lib/toast";
import type { ProfileData } from "@/lib/utils";

type Props = {
  userId: string;
  resumePdfUrl?: string | null;
  resumePdfKey?: string | null;
  onExtractedProfile: (profile: ProfileData) => void;
  onResumeMetadataChange: (url: string | null, key: string | null) => void;
};

type ExtractResumeResponse =
  | {
      success: true;
      data: {
        runId: string;
        status: "running";
      };
    }
  | { success: false; error: string };

type GenerateResumeResponse =
  | {
      success: true;
      data: {
        runId: string;
        status: "running";
      };
    }
  | { success: false; error: string };

type ActiveResumeRun = {
  runId: string;
  type: "extraction" | "generation";
};

type ResumeRunStatusResponse =
  | {
      success: true;
      data: {
        runId: string;
        runType: "resume_extraction" | "resume_generation";
        status: "running" | "completed" | "failed";
        completedAt: string | null;
        errorMessage: string | null;
        result:
          | {
              profile: ProfileData;
              textExtractor: "markitdown" | "pdf-parse";
            }
          | {
              resumePdfUrl: string;
              resumePdfKey: string;
            }
          | null;
      };
    }
  | { success: false; error: string };

function getMutationErrorMessage(
  fallback: string,
  result: ExtractResumeResponse | GenerateResumeResponse,
): string {
  return result.success ? fallback : result.error;
}

function getResumeRunError(result: ResumeRunStatusResponse): string {
  return result.success
    ? result.data.errorMessage ?? "Resume job failed. Please try again."
    : result.error;
}

function isExtractionResult(
  result: unknown,
): result is { profile: ProfileData; textExtractor: "markitdown" | "pdf-parse" } {
  return (
    typeof result === "object" &&
    result !== null &&
    "profile" in result &&
    typeof result.profile === "object" &&
    result.profile !== null
  );
}

function isGenerationResult(
  result: unknown,
): result is { resumePdfUrl: string; resumePdfKey: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "resumePdfUrl" in result &&
    typeof result.resumePdfUrl === "string" &&
    "resumePdfKey" in result &&
    typeof result.resumePdfKey === "string"
  );
}

function isRunStatusResponse(value: unknown): value is ResumeRunStatusResponse {
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
    "runId" in data &&
    typeof data.runId === "string" &&
    "runType" in data &&
    (data.runType === "resume_extraction" || data.runType === "resume_generation") &&
    "status" in data &&
    (data.status === "running" || data.status === "completed" || data.status === "failed")
  );
}

function isStartResponse(value: unknown): value is ExtractResumeResponse | GenerateResumeResponse {
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
    "runId" in data &&
    typeof data.runId === "string" &&
    "status" in data &&
    data.status === "running"
  );
}

export function ResumeUpload({
  userId,
  resumePdfUrl,
  resumePdfKey,
  onExtractedProfile,
  onResumeMetadataChange,
}: Props) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractStatus, setExtractStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [generateStatus, setGenerateStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [activeResumeRun, setActiveResumeRun] = useState<ActiveResumeRun | null>(null);
  const [previewPreference, setPreviewPreference] = useState<"open" | "closed">("open");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isExtractStartPending, startExtractionTransition] = useTransition();
  const [isGenerateStartPending, startGenerationTransition] = useTransition();
  const isExtracting = isExtractStartPending || activeResumeRun?.type === "extraction";
  const isGenerating = isGenerateStartPending || activeResumeRun?.type === "generation";
  const isPreviewOpen = Boolean(resumePdfUrl) && previewPreference === "open";

  useEffect(() => {
    if (!activeResumeRun) {
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
          `/api/resume/runs?runId=${encodeURIComponent(activeResumeRun.runId)}`,
        );

        if (response.status === 401 || response.status === 503) {
          if (!cancelled) {
            const message =
              activeResumeRun.type === "extraction"
                ? "We could not verify extraction status. Checking again in a moment."
                : "We could not verify generation status. Checking again in a moment.";

            if (activeResumeRun.type === "extraction") {
              setExtractStatus({ success: true, message });
            } else {
              setGenerateStatus({ success: true, message });
            }
          }
          return;
        }

        const json: unknown = await response.json();
        const result: ResumeRunStatusResponse = isRunStatusResponse(json)
          ? json
          : { success: false, error: "Could not load resume job status." };

        if (cancelled) {
          return;
        }

        if (!response.ok || !result.success) {
          if (response.status < 500) {
            const message =
              activeResumeRun.type === "extraction"
                ? "Could not load resume extraction status."
                : "Could not load resume generation status.";

            if (activeResumeRun.type === "extraction") {
              setExtractStatus({ success: false, message });
            } else {
              setGenerateStatus({ success: false, message });
            }
            toast.error(message);
            setActiveResumeRun(null);
          }
          return;
        }

        if (result.data.status === "running") {
          return;
        }

        if (result.data.status === "failed") {
          const message = getResumeRunError(result);

          if (activeResumeRun.type === "extraction") {
            setExtractStatus({ success: false, message });
          } else {
            setGenerateStatus({ success: false, message });
          }
          toast.error(message);
          setActiveResumeRun(null);
          return;
        }

        if (activeResumeRun.type === "extraction") {
          if (isExtractionResult(result.data.result)) {
            onExtractedProfile(result.data.result.profile);
            setExtractStatus({
              success: true,
              message: "Profile fields populated. Review them before saving.",
            });
            toast.success("Profile fields populated from resume. Review before saving.");
          } else {
            const message = "Resume extraction finished without profile fields.";
            setExtractStatus({ success: false, message });
            toast.error(message);
          }
        } else if (isGenerationResult(result.data.result)) {
          onResumeMetadataChange(
            result.data.result.resumePdfUrl,
            result.data.result.resumePdfKey,
          );
          setGenerateStatus({
            success: true,
            message: "Resume generated from your saved profile.",
          });
          toast.success("Resume generated from your saved profile.");
          router.refresh();
        } else {
          const message = "Resume generation finished without resume metadata.";
          setGenerateStatus({ success: false, message });
          toast.error(message);
        }

        setActiveResumeRun(null);
      } catch (error) {
        console.error("[components/profile/ResumeUpload] Resume run status error:", error);
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
  }, [activeResumeRun, onExtractedProfile, onResumeMetadataChange, router]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    setExtractStatus(null);
    setGenerateStatus(null);
    setActiveResumeRun(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    setUploadError(null);
    setExtractStatus(null);
    setGenerateStatus(null);
    setActiveResumeRun(null);
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const triggerFileSelect = (): void => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File): Promise<void> => {
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF formatting is allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Maximum file size is 5MB.");
      return;
    }

    startTransition(async () => {
      try {
        // 1. Upload to InsForge Storage
        const { data, error } = await insforge.storage
          .from("resumes")
          .upload(`${userId}/resume.pdf`, file);

        if (error || !data) {
          console.error("[components/profile/ResumeUpload] Upload error:", error);
          setUploadError("Failed to upload file to storage. Please try again.");
          toast.error("Failed to upload resume. Please try again.");
          return;
        }

        // 2. Save metadata to DB
        const result = await updateProfileResume(data.url, data.key);

        if (!result.success) {
          const { error: cleanupError } = await insforge.storage
            .from("resumes")
            .remove(data.key);

          if (cleanupError) {
            console.error("[components/profile/ResumeUpload] Uploaded resume cleanup error:", cleanupError);
          }

          setUploadError(result.error || "Failed to update profile resume reference.");
          toast.error("Failed to save resume reference.");
          return;
        }

        onResumeMetadataChange(data.url, data.key);
        setPreviewPreference("open");
        toast.success("Resume uploaded successfully.");
      } catch (err) {
        console.error("[components/profile/ResumeUpload] System error:", err);
        setUploadError("An unexpected error occurred during upload.");
        toast.error("An unexpected error occurred during upload.");
      }
    });
  };

  const handleDelete = (): void => {
    setUploadError(null);
    setExtractStatus(null);
    setGenerateStatus(null);
    setActiveResumeRun(null);
    startTransition(async () => {
      try {
        const result = await deleteProfileResume();
        if (!result.success) {
          setUploadError(result.error || "Failed to delete resume.");
          toast.error("Failed to delete resume.");
          return;
        }

        onResumeMetadataChange(null, null);
        setPreviewPreference("closed");
        toast.success("Resume deleted.");
      } catch (err) {
        console.error("[components/profile/ResumeUpload] Delete error:", err);
        setUploadError("An unexpected error occurred during deletion.");
        toast.error("An unexpected error occurred during deletion.");
      }
    });
  };

  const handleExtract = (): void => {
    setUploadError(null);
    setExtractStatus(null);
    setGenerateStatus(null);

    startExtractionTransition(async () => {
      try {
        const response = await fetch("/api/resume/extract", {
          method: "POST",
        });
        const json: unknown = await response.json();
        const result: ExtractResumeResponse = isStartResponse(json)
          ? json
          : { success: false, error: "Could not extract profile details." };

        if (!response.ok || !result.success) {
          const message = getMutationErrorMessage("Could not extract profile details.", result);
          setExtractStatus({
            success: false,
            message,
          });
          toast.error(message);
          return;
        }

        setActiveResumeRun({ runId: result.data.runId, type: "extraction" });
        setExtractStatus({
          success: true,
          message: "Reading your resume and preparing editable profile fields.",
        });
        toast.info("Resume extraction started. We'll fill the form when it's ready.");
      } catch (error) {
        console.error("[components/profile/ResumeUpload] Extract error:", error);
        setExtractStatus({
          success: false,
          message: "An unexpected error occurred during extraction.",
        });
        toast.error("Could not extract profile details.");
      }
    });
  };

  const handleGenerate = (): void => {
    setUploadError(null);
    setExtractStatus(null);
    setGenerateStatus(null);

    startGenerationTransition(async () => {
      try {
        const response = await fetch("/api/resume/generate", {
          method: "POST",
        });
        const json: unknown = await response.json();
        const result: GenerateResumeResponse = isStartResponse(json)
          ? json
          : { success: false, error: "Could not generate resume." };

        if (!response.ok || !result.success) {
          const message = getMutationErrorMessage("Could not generate resume.", result);
          setGenerateStatus({
            success: false,
            message,
          });
          toast.error(message);
          return;
        }

        setActiveResumeRun({ runId: result.data.runId, type: "generation" });
        setGenerateStatus({
          success: true,
          message: "Writing and rendering your resume in the background.",
        });
        toast.info("Resume generation started. We'll update your resume when it's ready.");
      } catch (error) {
        console.error("[components/profile/ResumeUpload] Generate error:", error);
        setGenerateStatus({
          success: false,
          message: "An unexpected error occurred during resume generation.",
        });
        toast.error("Could not generate resume.");
      }
    });
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-base font-semibold leading-6 text-text-primary">Resume</h2>
      <p className="mt-1 text-sm font-medium leading-5 text-text-secondary">
        Upload an existing resume to auto-fill the profile fields below.
      </p>

      {uploadError && (
        <div className="mt-4 rounded-md bg-error/10 p-3 text-xs font-semibold leading-4 text-error">
          {uploadError}
        </div>
      )}

      {extractStatus && (
        <div
          className={`mt-4 rounded-md border p-3 text-xs font-semibold leading-4 ${
            extractStatus.success
              ? "border-success/20 bg-success-lightest text-success-foreground"
              : "border-error/20 bg-error/10 text-error"
          }`}
        >
          {extractStatus.message}
        </div>
      )}

      {generateStatus && (
        <div
          className={`mt-4 rounded-md border p-3 text-xs font-semibold leading-4 ${
            generateStatus.success
              ? "border-success/20 bg-success-lightest text-success-foreground"
              : "border-error/20 bg-error/10 text-error"
          }`}
        >
          {generateStatus.message}
        </div>
      )}

      {resumePdfUrl ? (
        <>
          {/* Uploaded State */}
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-surface-secondary p-5 sm:flex-row sm:items-center xl:flex-col xl:items-start">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-accent shadow-sm">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <a
                  href="/api/profile/resume"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold leading-5 text-text-primary hover:underline"
                >
                  resume.pdf
                </a>
                <p className="text-xs font-medium leading-4 text-text-muted">
                  {resumePdfKey ? "PDF Document • Ready for tailoring" : "PDF Document"}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row xl:w-full xl:flex-col">
              <button
                type="button"
                onClick={() =>
                  setPreviewPreference((current) =>
                    current === "open" ? "closed" : "open",
                  )
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 text-text-primary shadow-sm transition-colors hover:bg-surface-secondary"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {isPreviewOpen ? "Hide Preview" : "Preview"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || isExtracting || isGenerating}
                className="h-10 rounded-md border border-error/20 bg-surface px-4 text-sm font-medium leading-5 text-error hover:bg-error/5 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {isPreviewOpen && (
            <ResumePreview
              resumePdfKey={resumePdfKey}
              resumePdfUrl={resumePdfUrl}
            />
          )}
        </>
      ) : (
        /* Dropzone / Upload State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-6 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${
            isDragging
              ? "border-accent bg-accent-muted/20"
              : "border-border-muted bg-surface-secondary"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="application/pdf"
            className="hidden"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-sm">
            <svg
              aria-hidden="true"
              className={`h-8 w-8 ${isPending ? "animate-pulse" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            >
              <path
                d="M8 18H6.5A4.5 4.5 0 0 1 6.2 9a6 6 0 0 1 11.3 1.8H18a3.6 3.6 0 0 1 .4 7.2H16"
              />
              <path
                d="M12 18V9"
              />
              <path
                d="m8.5 12.5 3.5-3.5 3.5 3.5"
              />
            </svg>
          </div>
          <p className="mt-5 text-sm font-semibold leading-5 text-text-primary">
            {isPending ? "Uploading resume..." : "Click to upload or drag and drop"}
          </p>
          <p className="mt-1 text-sm font-medium leading-5 text-text-secondary">
            PDF formatting only. Maximum file size 5MB.
          </p>
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={isPending}
            className="mt-6 rounded-md border border-border bg-surface px-6 py-2 text-sm font-medium leading-5 text-text-primary shadow-sm hover:bg-surface-secondary disabled:opacity-50"
          >
            Select Resume
          </button>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-6">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium leading-5 text-text-secondary">
          {resumePdfUrl
            ? "Use the active PDF to populate fields, or generate a fresh resume from saved profile data."
            : "Upload a resume to extract details, or generate one after saving profile data."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending || isExtracting || isGenerating}
            className="inline-flex h-10 min-w-40 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 text-text-primary shadow-sm transition-colors hover:bg-surface-secondary disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M7 3h7l4 4v14H7V3Z"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d="M10 13h4M10 17h4M14 3v5h5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            {isGenerating ? "Generating..." : "Generate Resume"}
          </button>
          {resumePdfUrl && (
            <button
              type="button"
              onClick={handleExtract}
              disabled={isPending || isExtracting || isGenerating}
              className="inline-flex h-10 min-w-40 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-accent px-4 text-sm font-medium leading-5 text-accent-foreground transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M7 3h7l4 4v14H7V3Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d="M14 3v5h5M10 13h5M10 17h5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              {isExtracting ? "Extracting..." : "Extract from Resume"}
            </button>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
