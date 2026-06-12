export type PostHogEventProperties = {
  job_search_started: {
    userId: string;
    jobTitle: string;
    location: string;
  };
  job_found: {
    userId: string;
    source: "search" | "url";
    matchScore: number;
  };
  job_status_changed: {
    userId: string;
    jobId: string;
    fromStatus: string;
    toStatus: string;
    reason: string;
  };
  job_unavailable_detected: {
    userId: string;
    jobId: string;
    source: string;
    reason: string | null;
  };
  profile_completed: {
    userId: string;
  };
  company_researched: {
    userId: string;
    jobId: string;
    company: string;
  };
  get_started_clicked: {
    source: "hero" | "bottom_cta";
  };
  find_jobs_clicked: {
    source: "hero" | "bottom_cta";
  };
  oauth_sign_in_started: {
    provider: "google" | "github";
  };
  oauth_sign_in_error: {
    provider: "google" | "github";
    error: string;
  };
  auth_callback_failed: {
    reason: "missing_code_or_verifier" | "exchange_failed";
  };
  user_signed_in: {
    provider: "oauth";
  };
  server_user_signed_in: {
    userId?: string;
    email?: string;
    $session_id?: string;
  };
  user_signed_out: Record<string, never>;
  dashboard_checkpoint_viewed: {
    userId: string;
    email?: string;
  };
};

export type PostHogEventName = keyof PostHogEventProperties;
