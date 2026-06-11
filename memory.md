# Memory — Feature 08 Resume PDF Generation from Profile

Last updated: 2026-06-12 00:32:17 PST

## What was built

- Completed Feature 08 Resume PDF Generation from Profile.
- Added `@react-pdf/renderer` and generated lockfile updates.
- Added server-side resume generation:
  - `agent/resumeGenerator.ts`
  - `app/api/resume/generate/ResumeDocument.tsx`
  - `app/api/resume/generate/route.ts`
- Extended agent observability with `startResumeGenerationRun` in `agent/logs.ts`.
- Updated `components/profile/ResumeUpload.tsx` with a one-click `Generate Resume` action.
- Cleaned up the resume action toolbar after visual review so Generate/Extract buttons use matching compact sizing and avoid label wrapping.
- Updated context docs:
  - `context/library-docs.md`
  - `context/progress-tracker.md`
  - `context/ui-registry.md`

## Decisions made

- Resume generation uses the saved `profiles` row as source of truth, not unsaved browser form edits.
- Generated resumes follow the single-active-resume rule: generated PDFs become the active resume referenced by `profiles.resume_pdf_url` and `profiles.resume_pdf_key`.
- Generation validates resume-essential fields only, not the full profile completion checklist.
- Generated content may polish wording but must not invent employers, dates, degrees, skills, links, metrics, tools, credentials, or other facts.
- The generated PDF is rendered server-side with `@react-pdf/renderer` and `renderToBuffer`; React PDF is never imported into client components.
- Because the current InsForge Storage SDK upload API may auto-rename on key conflict, the route saves returned `url` and `key` as authoritative. The previous active storage object is removed only after the new generated resume is uploaded and profile metadata is updated.

## Problems solved

- Fixed a visual issue where Generate/Extract buttons looked oversized and cramped in the resume card footer.
- Fixed Gemini high-demand failures during resume generation by retrying transient availability/rate/high-demand errors on `GEMINI_TEXT_MODEL` and falling back to `GEMINI_FAST_MODEL` before returning a temporary-service 503.
- Aligned resume generation reliability with the proven Feature 07 extraction retry/fallback pattern.
- Updated project-specific InsForge storage docs to reflect the installed SDK signature: `.upload(path, file)` without an upsert option.

## Current state

- Phase 2 status: Feature 08 complete and reliability-fixed; Feature 09 is next.
- `/api/resume/generate` authenticates the user, reads saved profile data, validates resume-essential fields, generates structured resume content with Gemini, renders an A4 PDF, uploads it to the private `resumes` bucket, updates profile resume metadata, and returns the updated metadata.
- `ResumeUpload` now supports upload, delete, extract, and generate flows while keeping private resume access routed through `/api/profile/resume`.
- `context/progress-tracker.md` records Feature 08 completion and the Gemini retry/fallback reliability fix.
- `context/ui-registry.md` records the cleaned-up ResumeUpload action toolbar pattern.
- Verification passed:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `git diff --check`
  - `npm run build` with network access for Google Fonts
- There is still a large uncommitted working tree containing Features 05-08, migrations/context updates, dependencies, and memory updates.

## Next session starts with

Begin Feature 09 — Find Jobs Page Full UI:

1. Run `/remember restore`.
2. Read the required context files in the order specified by `AGENTS.md`.
3. Run `/architect` before implementation.
4. Build the Find Jobs page UI with mock data first, matching `context/build-plan.md` Feature 09.
5. Use existing UI registry patterns before inventing new table, filter, and search-control styling.

## Open questions

- Production deployment still needs a decision on how to install Python dependencies from `requirements.txt` if MarkItDown should be active outside local development.
- The uncommitted working tree spans multiple completed features; decide whether to review/commit all Phase 2 work together or split it into feature-sized commits.
