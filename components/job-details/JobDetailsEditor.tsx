"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateJobDetails } from "@/actions/jobs";
import { toast } from "@/lib/toast";

export type EditableJobDetails = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  externalApplyUrl: string;
  sourceUrl: string;
  aboutRole: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  aboutCompany: string;
};

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  job: EditableJobDetails;
};

function listToText(items: string[]): string {
  return items.join("\n");
}

function textToList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getJobType(value: string): "fulltime" | "parttime" | "contract" | null {
  return value === "fulltime" || value === "parttime" || value === "contract"
    ? value
    : null;
}

export function JobDetailsEditor({ isOpen, onCancel, job }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    jobType: job.jobType,
    externalApplyUrl: job.externalApplyUrl,
    sourceUrl: job.sourceUrl,
    aboutRole: job.aboutRole,
    responsibilities: listToText(job.responsibilities),
    requirements: listToText(job.requirements),
    niceToHave: listToText(job.niceToHave),
    benefits: listToText(job.benefits),
    aboutCompany: job.aboutCompany,
  });

  function updateField(field: keyof typeof form, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm(): void {
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      jobType: job.jobType,
      externalApplyUrl: job.externalApplyUrl,
      sourceUrl: job.sourceUrl,
      aboutRole: job.aboutRole,
      responsibilities: listToText(job.responsibilities),
      requirements: listToText(job.requirements),
      niceToHave: listToText(job.niceToHave),
      benefits: listToText(job.benefits),
      aboutCompany: job.aboutCompany,
    });
    setError(null);
  }

  function handleCancel(): void {
    resetForm();
    onCancel();
  }

  function handleSave(): void {
    setError(null);

    startTransition(async () => {
      const result = await updateJobDetails({
        jobId: job.id,
        title: form.title,
        company: form.company,
        location: form.location,
        salary: form.salary,
        jobType: getJobType(form.jobType),
        externalApplyUrl: form.externalApplyUrl.trim() || null,
        sourceUrl: form.sourceUrl.trim() || null,
        aboutRole: form.aboutRole,
        responsibilities: textToList(form.responsibilities),
        requirements: textToList(form.requirements),
        niceToHave: textToList(form.niceToHave),
        benefits: textToList(form.benefits),
        aboutCompany: form.aboutCompany,
      });

      if (!result.success) {
        setError(result.error ?? "Job details could not be updated.");
        toast.error(result.error ?? "Job details could not be updated.");
        return;
      }

      toast.success("Job details updated.");
      onCancel();
      router.refresh();
    });
  }

  if (!isOpen) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Edit Job Details
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 text-text-primary shadow-sm hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            onClick={handleCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium leading-5 text-accent-foreground shadow-sm hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            onClick={handleSave}
            type="button"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Job Title
          </span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("title", event.target.value)}
            value={form.title}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Company
          </span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("company", event.target.value)}
            value={form.company}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Location
          </span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("location", event.target.value)}
            value={form.location}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Salary
          </span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("salary", event.target.value)}
            value={form.salary}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Job Type
          </span>
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("jobType", event.target.value)}
            value={form.jobType}
          >
            <option value="">Unknown</option>
            <option value="fulltime">Full time</option>
            <option value="parttime">Part time</option>
            <option value="contract">Contract</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Apply URL
          </span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("externalApplyUrl", event.target.value)}
            type="url"
            value={form.externalApplyUrl}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
          Source URL
        </span>
        <input
          className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
          onChange={(event) => updateField("sourceUrl", event.target.value)}
          type="url"
          value={form.sourceUrl}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
          Job Description
        </span>
        <textarea
          className="mt-2 min-h-36 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
          onChange={(event) => updateField("aboutRole", event.target.value)}
          value={form.aboutRole}
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Responsibilities
          </span>
          <textarea
            className="mt-2 min-h-32 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("responsibilities", event.target.value)}
            value={form.responsibilities}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Requirements
          </span>
          <textarea
            className="mt-2 min-h-32 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("requirements", event.target.value)}
            value={form.requirements}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Nice To Have
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("niceToHave", event.target.value)}
            value={form.niceToHave}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
            Benefits
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            onChange={(event) => updateField("benefits", event.target.value)}
            value={form.benefits}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-dark">
          About Company
        </span>
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
          onChange={(event) => updateField("aboutCompany", event.target.value)}
          value={form.aboutCompany}
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold leading-5 text-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
