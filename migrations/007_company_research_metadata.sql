-- JobPilot: company research workflow metadata

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS company_research_status text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS company_research_error text,
  ADD COLUMN IF NOT EXISTS company_researched_at timestamptz,
  ADD COLUMN IF NOT EXISTS company_research_run_id text;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_company_research_status_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_company_research_status_check
  CHECK (company_research_status IN ('idle', 'running', 'completed', 'failed'));

UPDATE public.jobs
SET
  company_research_status = CASE
    WHEN company_research IS NULL THEN 'idle'
    ELSE 'completed'
  END,
  company_researched_at = CASE
    WHEN company_research IS NULL THEN company_researched_at
    ELSE COALESCE(company_researched_at, found_at, now())
  END,
  company_research_error = CASE
    WHEN company_research IS NULL THEN company_research_error
    ELSE NULL
  END
WHERE company_research_status IS NULL
   OR (company_research IS NOT NULL AND company_research_status <> 'completed');

CREATE INDEX IF NOT EXISTS jobs_user_company_research_status_idx
  ON public.jobs(user_id, company_research_status);
