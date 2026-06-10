-- =============================================================================
-- Feature 04 — Database Schema
-- JobPilot: profiles, agent_runs, jobs, agent_logs
-- All tables: RLS enabled, scoped by user_id / auth.uid()
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           text,
  email               text,
  phone               text,
  location            text,
  current_title       text,
  experience_level    text        CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead')),
  years_experience    integer,
  skills              text[]      DEFAULT '{}',
  industries          text[]      DEFAULT '{}',
  work_experience     jsonb       DEFAULT '[]',
  education           jsonb       DEFAULT '{}',
  job_titles_seeking  text[]      DEFAULT '{}',
  remote_preference   text        CHECK (remote_preference IN ('remote', 'onsite', 'hybrid', 'any')),
  preferred_locations text[]      DEFAULT '{}',
  salary_expectation  text,
  cover_letter_tone   text        CHECK (cover_letter_tone IN ('formal', 'casual', 'enthusiastic')),
  linkedin_url        text,
  portfolio_url       text,
  work_authorization  text        CHECK (work_authorization IN ('citizen', 'permanent_resident', 'visa_required')),
  resume_pdf_url      text,
  resume_pdf_key      text,
  is_complete         boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- RLS: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. agent_runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              text        NOT NULL DEFAULT 'running'
                                  CHECK (status IN ('running', 'completed', 'failed')),
  job_title_searched  text,
  location_searched   text,
  jobs_found          integer     DEFAULT 0,
  started_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);

CREATE INDEX IF NOT EXISTS agent_runs_user_id_idx ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS agent_runs_started_at_idx ON public.agent_runs(started_at DESC);

-- RLS: agent_runs
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent runs"
  ON public.agent_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent runs"
  ON public.agent_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent runs"
  ON public.agent_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent runs"
  ON public.agent_runs FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              uuid        REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  user_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source              text        NOT NULL CHECK (source IN ('search', 'url')),
  source_url          text,
  external_apply_url  text,
  title               text,
  company             text,
  location            text,
  salary              text,
  job_type            text        CHECK (job_type IN ('fulltime', 'parttime', 'contract')),
  about_role          text,
  responsibilities    text[]      DEFAULT '{}',
  requirements        text[]      DEFAULT '{}',
  nice_to_have        text[]      DEFAULT '{}',
  benefits            text[]      DEFAULT '{}',
  about_company       text,
  match_score         integer     CHECK (match_score >= 0 AND match_score <= 100),
  match_reason        text,
  matched_skills      text[]      DEFAULT '{}',
  missing_skills      text[]      DEFAULT '{}',
  company_research    jsonb,
  found_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_user_id_idx    ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_run_id_idx     ON public.jobs(run_id);
CREATE INDEX IF NOT EXISTS jobs_found_at_idx   ON public.jobs(found_at DESC);
CREATE INDEX IF NOT EXISTS jobs_match_score_idx ON public.jobs(match_score DESC);

-- RLS: jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. agent_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid        NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     text        NOT NULL,
  level       text        NOT NULL DEFAULT 'info'
                          CHECK (level IN ('info', 'success', 'warning', 'error')),
  job_id      uuid        REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_logs_user_id_idx ON public.agent_logs(user_id);
CREATE INDEX IF NOT EXISTS agent_logs_run_id_idx  ON public.agent_logs(run_id);
CREATE INDEX IF NOT EXISTS agent_logs_created_at_idx ON public.agent_logs(created_at DESC);

-- RLS: agent_logs
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent logs"
  ON public.agent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent logs"
  ON public.agent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent logs"
  ON public.agent_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent logs"
  ON public.agent_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Auto-create profile on user signup (trigger)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_complete, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
