export const MATCH_THRESHOLD = 70;
export const MATCH_STRONG_THRESHOLD = 85;

export const JOB_STATUSES = [
  "active",
  "applied",
  "unavailable",
  "archived",
  "rejected",
  "completed",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUSES.includes(value as JobStatus);
}

export function getJobStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    active: "Active",
    applied: "Applied",
    unavailable: "Unavailable",
    archived: "Archived",
    rejected: "Rejected",
    completed: "Completed",
  };

  return labels[status];
}

export function getJobStatusBadgeClass(status: JobStatus): string {
  const classes: Record<JobStatus, string> = {
    active: "bg-success-lightest text-success-foreground",
    applied: "bg-info-lightest text-info-foreground",
    unavailable: "bg-surface-secondary text-text-secondary",
    archived: "bg-surface-secondary text-text-secondary",
    rejected: "bg-error/10 text-error",
    completed: "bg-success-light text-success-dark",
  };

  return classes[status];
}

export function getJobStatusAccentClass(status: JobStatus): string {
  const classes: Record<JobStatus, string> = {
    active: "",
    applied: "border-l-4 border-l-info",
    unavailable: "border-l-4 border-l-warning",
    archived: "border-l-4 border-l-text-muted",
    rejected: "border-l-4 border-l-error",
    completed: "border-l-4 border-l-success",
  };

  return classes[status];
}

export function normalizeSalaryDisplay(salary: string | null): string | null {
  if (!salary) return salary;
  const match = salary.match(/^(\$\d+k) - (\$\d+k)$/);
  return match && match[1] === match[2] ? match[1] : salary;
}

export type EducationData = {
  degree?: string;
  fieldOfStudy?: string;
  institution?: string;
  graduationYear?: string;
};

export type WorkExperienceData = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  responsibilities: string;
};

export type ProfileData = {
  id?: string;
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  location?: string | null;
  work_authorization?: string | null;
  current_title?: string | null;
  experience_level?: string | null;
  years_experience?: number | null;
  skills?: string[] | null;
  industries?: string[] | null;
  work_experience?: WorkExperienceData[] | null;
  education?: EducationData | null;
  job_titles_seeking?: string[] | null;
  remote_preference?: string | null;
  preferred_locations?: string[] | null;
  salary_expectation?: string | null;
  cover_letter_tone?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  resume_pdf_url?: string | null;
  resume_pdf_key?: string | null;
  is_complete?: boolean;
};

export function calculateCompleteness(data: ProfileData) {
  const requiredFields = [
    { key: "full_name", tag: "NAME" },
    { key: "phone", tag: "PHONE" },
    { key: "location", tag: "LOCATION" },
    { key: "work_authorization", tag: "WORK_AUTH" },
    { key: "current_title", tag: "JOB_TITLE" },
    { key: "experience_level", tag: "EXPERIENCE_LEVEL" },
    { key: "years_experience", tag: "YEARS_EXPERIENCE" },
    { key: "skills", tag: "SKILLS", isArray: true },
    { key: "education", tag: "EDUCATION", isEducation: true },
    { key: "job_titles_seeking", tag: "JOB_TITLES_SEEKING", isArray: true },
    { key: "remote_preference", tag: "REMOTE_PREFERENCE" },
  ];

  const missingFields: string[] = [];
  let filledCount = 0;

  for (const field of requiredFields) {
    const value = data[field.key as keyof ProfileData];
    let isFilled = false;

    if (field.isArray) {
      isFilled = Array.isArray(value) && value.length > 0;
    } else if (field.isEducation) {
      const edu = value as EducationData | undefined;
      isFilled = Boolean(
        edu &&
        typeof edu === "object" &&
        edu.degree &&
        String(edu.degree).trim() !== "" &&
        edu.fieldOfStudy &&
        String(edu.fieldOfStudy).trim() !== "" &&
        edu.institution &&
        String(edu.institution).trim() !== "" &&
        edu.graduationYear &&
        String(edu.graduationYear).trim() !== ""
      );
    } else {
      isFilled = value !== null && value !== undefined && String(value).trim() !== "";
    }

    if (isFilled) {
      filledCount++;
    } else {
      missingFields.push(field.tag);
    }
  }

  const completionPercentage = Math.round((filledCount / requiredFields.length) * 100);
  const isComplete = filledCount === requiredFields.length;

  return {
    completionPercentage,
    missingFields,
    isComplete,
  };
}
