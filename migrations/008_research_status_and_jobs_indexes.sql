-- JobPilot: research run timing and hot path job list indexes

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS company_research_started_at timestamptz;

CREATE INDEX IF NOT EXISTS jobs_user_status_match_score_idx
  ON public.jobs(user_id, status, match_score DESC, id ASC);

CREATE INDEX IF NOT EXISTS jobs_user_status_found_at_desc_idx
  ON public.jobs(user_id, status, found_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS jobs_user_status_found_at_asc_idx
  ON public.jobs(user_id, status, found_at ASC, id ASC);

CREATE INDEX IF NOT EXISTS jobs_user_run_id_match_score_idx
  ON public.jobs(user_id, run_id, match_score DESC)
  WHERE run_id IS NOT NULL;
