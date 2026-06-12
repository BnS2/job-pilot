# Memory — JobPilot Find Jobs + Lifecycle Scope

Last updated: 2026-06-12 21:01 PST

## What was built

Feature 11 — Filter + Sort + Pagination is complete.

- `/find-jobs` now reads real jobs from InsForge for the authenticated user.
- Filtering, sorting, debounced text search, pagination, and latest-run scoping are wired.
- Successful Find Jobs searches route to `/find-jobs?run={runId}` so the immediate results view is scoped to the latest run instead of mixing all saved jobs.
- Auth expiry handling was tightened with shared client helpers, `AuthSessionGuard`, protected route redirects, and refresh-cookie cleanup.

This session also updated project context docs to add lifecycle/stale-listing handling as a first-class requirement:

- `context/project-overview.md`
- `context/architecture.md`
- `context/build-plan.md`
- `context/library-docs.md`
- `context/code-standards.md`
- `context/progress-tracker.md`

## Decisions made

- Saved jobs are a persistent user pipeline, not disposable search results.
- Default user-facing job lists should focus on active opportunities.
- Stale, closed, unavailable, archived, applied, rejected, and completed jobs should be soft-hidden from the default active list, not hard-deleted.
- New Adzuna searches should eventually upsert matching external listings instead of creating cross-run duplicates.
- Job lifecycle statuses are now in scope: `active`, `unavailable`, `archived`, `applied`, `rejected`, `completed`.
- Feature 12 is now “Job Lifecycle + Stale Listing Handling,” inserted before Job Details and Dashboard work.

## Problems solved

- Clarified why role/job lists appeared to pile up: searches persist rows in `jobs`; previous behavior lacked cross-run dedupe/upsert and relied on `run` URL scoping for latest-search display.
- Turned that concern into explicit product architecture instead of leaving it as an implementation ambiguity.
- Updated dashboard planning so primary metrics count active opportunities, not stale or completed historical rows.

## Current state

- `context/progress-tracker.md` says current phase is Phase 3 — Find Jobs Page.
- Last completed feature is 11 Filter + Sort + Pagination.
- Next planned feature is 12 Job Lifecycle + Stale Listing Handling.
- Working tree is still uncommitted and includes many prior feature/auth/find-jobs changes plus the lifecycle context updates.
- No tests were run for the lifecycle docs update because it was documentation/context only.

## Next session starts with

1. Run `/remember restore`.
2. Read the required context files from `AGENTS.md` in order.
3. Start Feature 12 from `context/build-plan.md`: add job lifecycle schema/migration, status filtering, status actions, availability refresh rules, and Adzuna cross-run upsert behavior.
4. Use InsForge docs/skill before touching backend schema or SDK code.

## Open questions

- Decide whether to commit the accumulated uncommitted work before implementing Feature 12.
- Define exact UX placement for status filter/actions when implementing lifecycle UI.
- Decide how aggressive availability checks should be in v1, especially for ambiguous redirects, bot blocks, rate limits, and timeouts.
- Production deployment decision on Python/MarkItDown dependencies remains unresolved.
- Full `?next=` post-login routing through OAuth callback still needs a follow-up design decision.
