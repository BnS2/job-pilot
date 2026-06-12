# Memory — JobPilot Review Follow-Up

Last updated: 2026-06-12 22:37 PST

## What was built

Completed a review-fix pass against the current code. Still-valid findings were fixed in:

- `app/api/agent/find/route.ts`
- `app/api/auth/refresh/route.ts`
- `app/find-jobs/page.tsx`
- `components/find-jobs/JobsTable.tsx`
- `lib/auth-client.ts`
- `lib/adzuna.ts`
- `agent/adzuna.ts`
- `proxy.ts`
- `context/architecture.md`
- `context/build-plan.md`
- `context/library-docs.md`
- `context/ui-registry.md`
- `context/progress-tracker.md`

Specific outcomes:

- Search-start PostHog capture is best-effort and no longer blocks Adzuna discovery.
- `/api/auth/refresh` returns 500 on unexpected exceptions without clearing cookies; confirmed auth failures still clear cookies.
- `/find-jobs` login redirects preserve query params, paginated DB ordering is deterministic with `id` as a secondary sort, and DB failures render an explicit token-styled error card instead of an empty jobs table.
- `JobsTable` now handles invalid dates and null `source` values safely.
- `clearExpiredSession()` now throws when `/api/auth/logout` fails so callers can detect cleanup failure.
- Adzuna search requests now use a 5-second `AbortController` timeout and translate aborts into a clear timeout error.
- `proxy.ts` wraps `updateSession()` in try/catch and redirects to login with cookie cleanup on unexpected session update errors.
- Agent success copy now reports found jobs, saved jobs, and strong matches.
- Context docs were corrected for applied-job lifecycle exclusion, InsForge storage upload replacement flow, and one-sided Adzuna salary ranges.

## Decisions made

- Review comments were verified against current code before changing anything; none of the attached findings were stale.
- `/find-jobs` DB failures should be visible as a page-level load error while preserving the search/filter controls, not hidden behind empty-state UI.
- InsForge Storage replacement guidance remains upload-new-first: persist the new `url` and `key`, then remove the previous active object only after the new metadata is active. Do not use an `upsert` upload option.

## Problems solved

- Prevented analytics outages from breaking job search.
- Prevented transient refresh-route exceptions from forcing sign-out and cookie deletion.
- Removed non-deterministic pagination when rows tie on match score or found date.
- Stopped malformed `found_at` values from leaking confusing date output into the jobs table.
- Added a deterministic timeout for slow/hung Adzuna requests.
- Reconciled docs that still implied unsupported storage upload upsert behavior.

## Current state

- Working tree is dirty with the review-fix changes listed above.
- Validation passed:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- The first sandboxed `npm run build` failed only because Next.js needed network access to fetch the Google-hosted Inter font. The build passed after rerunning with network approval.
- `context/progress-tracker.md` still shows Phase 3 with Feature 11 complete and Feature 12 — Job Lifecycle + Stale Listing Handling — next.

## Next session starts with

1. Run `/remember restore`.
2. Read the required AGENTS/context files in order before implementation.
3. Decide whether to commit the current dirty working tree before starting Feature 12.
4. Start Feature 12 from `context/build-plan.md`: lifecycle schema/migration, status filtering, status actions, availability refresh rules, and Adzuna cross-run upsert behavior.
5. Use the InsForge skills/docs before touching backend schema, SQL, or SDK code.

## Open questions

- Whether to commit the accumulated review-fix work separately before Feature 12.
- Exact UX placement for job status filters and lifecycle actions.
- How conservative v1 availability checks should be for ambiguous redirects, bot blocks, rate limits, and timeouts.
- Production deployment approach for Python/MarkItDown dependencies remains unresolved.
- Full `?next=` preservation through the OAuth callback still needs a follow-up design decision.
