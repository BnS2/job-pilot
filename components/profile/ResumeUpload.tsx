"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent, DragEvent } from "react";

import { deleteProfileResume, updateProfileResume } from "@/actions/profile";
import { insforge } from "@/lib/insforge-client";
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
      data: ProfileData;
      meta?: { textExtractor?: "markitdown" | "pdf-parse" };
    }
  | { success: false; error: string };

type GenerateResumeResponse =
  | {
      success: true;
      data: {
        resumePdfUrl: string;
        resumePdfKey: string;
      };
    }
  | { success: false; error: string };

export function ResumeUpload({
  userId,
  resumePdfUrl,
  resumePdfKey,
  onExtractedProfile,
  onResumeMetadataChange,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractStatus, setExtractStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [generateStatus, setGenerateStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isExtracting, startExtractionTransition] = useTransition();
  const [isGenerating, startGenerationTransition] = useTransition();

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

    const file = e.dataTransfer.files[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    setUploadError(null);
    setExtractStatus(null);
    setGenerateStatus(null);
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
          return;
        }

        // 2. Save metadata to DB
        const result = await updateProfileResume(data.url, data.key);

        if (!result.success) {
          setUploadError(result.error || "Failed to update profile resume reference.");
          return;
        }

        onResumeMetadataChange(data.url, data.key);
      } catch (err) {
        console.error("[components/profile/ResumeUpload] System error:", err);
        setUploadError("An unexpected error occurred during upload.");
      }
    });
  };

  const handleDelete = (): void => {
    setUploadError(null);
    setExtractStatus(null);
    setGenerateStatus(null);
    startTransition(async () => {
      try {
        const result = await deleteProfileResume();
        if (!result.success) {
          setUploadError(result.error || "Failed to delete resume.");
          return;
        }

        onResumeMetadataChange(null, null);
      } catch (err) {
        console.error("[components/profile/ResumeUpload] Delete error:", err);
        setUploadError("An unexpected error occurred during deletion.");
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
        const result = (await response.json()) as ExtractResumeResponse;

        if (!response.ok || !result.success) {
          setExtractStatus({
            success: false,
            message: result.success ? "Could not extract profile details." : result.error,
          });
          return;
        }

        onExtractedProfile(result.data);
        setExtractStatus({
          success: true,
          message: "Profile fields populated. Review them before saving.",
        });
      } catch (error) {
        console.error("[components/profile/ResumeUpload] Extract error:", error);
        setExtractStatus({
          success: false,
          message: "An unexpected error occurred during extraction.",
        });
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
        const result = (await response.json()) as GenerateResumeResponse;

        if (!response.ok || !result.success) {
          setGenerateStatus({
            success: false,
            message: result.success ? "Could not generate resume." : result.error,
          });
          return;
        }

        onResumeMetadataChange(result.data.resumePdfUrl, result.data.resumePdfKey);
        setGenerateStatus({
          success: true,
          message: "Resume generated from your saved profile.",
        });
      } catch (error) {
        console.error("[components/profile/ResumeUpload] Generate error:", error);
        setGenerateStatus({
          success: false,
          message: "An unexpected error occurred during resume generation.",
        });
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
        /* Uploaded State */
        <div className="mt-6 flex flex-col items-center justify-between rounded-xl border border-border bg-surface-secondary p-5 sm:flex-row">
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
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isExtracting || isGenerating}
            className="mt-4 w-full rounded-md border border-error/20 bg-surface px-4 py-2 text-sm font-medium leading-5 text-error hover:bg-error/5 disabled:opacity-50 sm:mt-0 sm:w-auto"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-sm font-medium leading-5 text-text-secondary">
          {resumePdfUrl
            ? "Use the active PDF to populate fields, or generate a fresh resume from saved profile data."
            : "Upload a resume to extract details, or generate one after saving profile data."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
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
