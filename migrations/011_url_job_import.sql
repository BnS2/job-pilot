-- =============================================================================
-- Feature 19 — URL Job Import
-- Track provider identity for search/imported jobs and allow URL import runs.
-- =============================================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source_provider text;

UPDATE public.jobs
SET source_provider = 'adzuna'
WHERE source = 'search'
  AND source_provider IS NULL;

CREATE INDEX IF NOT EXISTS jobs_user_source_provider_idx
  ON public.jobs(user_id, source_provider);

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
      'job_url_import'
    )
  );

