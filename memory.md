# Memory — Resume Review Follow-Up

Last updated: 2026-06-12 01:18:33 PST

## What was built

- Completed the pasted review follow-up for the Phase 2 profile/resume work.
- Modified resume storage/profile safety paths:
  - `actions/profile.ts`
  - `components/profile/ResumeUpload.tsx`
  - `app/api/resume/extract/route.ts`
- Added shared Gemini retry/error helpers in `agent/geminiUtils.ts` and updated:
  - `agent/extractor.ts`
  - `agent/resumeGenerator.ts`
- Improved MarkItDown subprocess error handling in `agent/resumeText.ts`.
- Added accessibility fixes:
  - `aria-current="page"` on active nav links in `components/layout/Navbar.tsx`
  - progressbar ARIA semantics in `components/profile/CompletionIndicator.tsx`
- Fixed profile completion data flow in `app/profile/page.tsx` so the page uses dynamically calculated `is_complete`, `completionPercentage`, and `missingFields`.
- Updated documentation/bookkeeping:
  - `context/architecture.md`
  - `context/library-docs.md`
  - `context/progress-tracker.md`
  - `context/ui-registry.md`
  - `migrations/005_profile_backfill.sql`
  - `requirements.txt`

## Decisions made

- The InsForge Storage SDK surface currently exposes upload/download/remove, not object metadata lookup, so resume ownership is enforced by requiring the stored key to be under the authenticated user namespace and the returned URL path to match that key.
- Failed resume metadata writes now attempt to remove the just-uploaded object before showing the user an error.
- Resume deletion no longer clears `profiles.resume_pdf_url` / `profiles.resume_pdf_key` if storage deletion fails.
- Resume extraction runs are created before profile lookup/storage download so early failures can be associated with a run and marked failed.
- `requirements.txt` pins the locally installed MarkItDown version: `markitdown[pdf]==0.1.6`.

## Problems solved

- Prevented client-provided resume metadata from being persisted unless it matches the authenticated user-owned storage path.
- Prevented orphaned storage objects when upload succeeds but profile metadata persistence fails.
- Prevented DB resume references from being cleared after failed storage deletion.
- Removed duplicated Gemini retry helpers between extraction and resume generation.
- MarkItDown conversion no longer swallows unexpected subprocess failures silently; expected missing-command/timeout-style failures still fall back to `pdf-parse`.
- Preserved original `auth.users.created_at` in `migrations/005_profile_backfill.sql` instead of backfilling profile creation time with `now()`.
- Added missing `profiles.resume_pdf_key` documentation and fixed markdown code fence language annotations.

## Current state

- The review pass found no remaining issues in the changed follow-up code.
- Validation passed:
  - `git diff --check`
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build` with network access for the configured Google Font fetch
- The working tree is still uncommitted and includes the review follow-up changes plus the existing Phase 2 profile/resume work.
- There are no known functional blockers in the profile upload/delete/extract/generate flows from this review.

## Next session starts with

Begin Feature 09 — Find Jobs Page Full UI:

1. Run `/remember restore`.
2. Read the required context files in the order specified by `AGENTS.md`.
3. Run `/architect` before implementation.
4. Build the Find Jobs page UI with mock data first, matching `context/build-plan.md` Feature 09.
5. Use existing UI registry patterns before inventing new table, filter, and search-control styling.

## Open questions

- Production deployment still needs a decision on how to install Python dependencies from `requirements.txt` if MarkItDown should be active outside local development.
- The uncommitted working tree spans multiple completed features and review fixes; decide whether to review/commit all Phase 2 work together or split it into feature-sized commits.
- There is still no automated test coverage for the storage failure branches added in the review follow-up.
