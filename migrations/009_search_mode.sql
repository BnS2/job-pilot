-- =============================================================================
-- Feature 19 — Profile Best Match Button
-- Add search_mode to agent_runs for manual_search vs profile_best_match
-- =============================================================================

ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS search_mode TEXT NOT NULL DEFAULT 'manual_search'
  CHECK (search_mode IN ('manual_search', 'profile_best_match'));
