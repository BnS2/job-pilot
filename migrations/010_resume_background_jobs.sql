-- =============================================================================
-- Background Resume Jobs
-- Add typed run outputs for resume extraction and generation workflows.
-- =============================================================================

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS run_type text NOT NULL DEFAULT 'job_discovery';

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS result jsonb;

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS error_message text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'agent_runs_run_type_check'
      AND conrelid = 'public.agent_runs'::regclass
  ) THEN
    ALTER TABLE public.agent_runs
      ADD CONSTRAINT agent_runs_run_type_check
      CHECK (
        run_type IN (
          'job_discovery',
          'company_research',
          'availability_check',
          'resume_extraction',
          'resume_generation'
        )
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS agent_runs_user_type_status_idx
  ON public.agent_runs(user_id, run_type, status);
