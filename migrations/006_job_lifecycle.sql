-- JobPilot: job lifecycle and stale listing handling

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source_job_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS availability_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS unavailable_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('active', 'unavailable', 'archived', 'applied', 'rejected', 'completed'));

UPDATE public.jobs
SET last_seen_at = COALESCE(last_seen_at, found_at, now())
WHERE last_seen_at IS NULL;

CREATE INDEX IF NOT EXISTS jobs_user_status_idx
  ON public.jobs(user_id, status);

CREATE INDEX IF NOT EXISTS jobs_user_source_job_id_idx
  ON public.jobs(user_id, source_job_id)
  WHERE source_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS jobs_user_last_seen_at_idx
  ON public.jobs(user_id, last_seen_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS jobs_active_provider_listing_unique_idx
  ON public.jobs(user_id, source, source_job_id)
  WHERE source_job_id IS NOT NULL AND status = 'active';
