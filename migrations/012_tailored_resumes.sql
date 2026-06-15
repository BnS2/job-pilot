-- =============================================================================
-- Feature 20 — Job-Scoped Tailored Resumes
-- Store the latest tailored resume artifact on each saved job.
-- =============================================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS tailored_resume_url text,
  ADD COLUMN IF NOT EXISTS tailored_resume_key text,
  ADD COLUMN IF NOT EXISTS tailored_resume_status text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS tailored_resume_error text,
  ADD COLUMN IF NOT EXISTS tailored_resume_notes jsonb,
  ADD COLUMN IF NOT EXISTS tailored_resume_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS tailored_resume_run_id text;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_tailored_resume_status_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_tailored_resume_status_check
  CHECK (tailored_resume_status IN ('idle', 'running', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS jobs_user_tailored_resume_status_idx
  ON public.jobs(user_id, tailored_resume_status);

ALTER TABLE public.agent_runs
  DROP CONSTRAINT IF EXISTS agent_runs_run_type_check;

ALTER TABLE public.agent_runs
  ADD CONSTRAINT agent_runs_run_type_check
  CHECK (
    run_type IN (
      'job_discovery',
      'company_research',
      'availability_check',
      'resume_extraction',
      'resume_generation',
      'job_url_import',
      'resume_tailoring'
    )
  );
