# Memory — Fix Scroll Reset on Check Availability

Last updated: 2026-06-13

## What was built

Fixed the "Check Availability" button on the job details page (`/find-jobs/[id]`) causing the page to jump to the top on click.

- Created `components/job-details/JobStatusProvider.tsx` — React context provider that manages `status` as client-side state, exposes `{ status, setStatus }` via `useJobStatus()` hook.
- Updated `components/find-jobs/CheckAvailabilityButton.tsx` — replaced `router.refresh()` with `setStatus(parsedData.status)` from context. Removed `useRouter`.
- Updated `components/job-details/StatusDropdown.tsx` — replaced `router.refresh()` with `setStatus(nextStatus)` from context. Removed `useRouter`.
- Updated `components/job-details/JobActions.tsx` — made client component (`"use client"`), reads `status` from context instead of props.
- Updated `components/job-details/JobHeader.tsx` — made client component (`"use client"`), reads `status` from context instead of props.
- Updated `app/find-jobs/[id]/page.tsx` — wrapped `JobHeader` → `JobActions` (inclusive) in `<JobStatusProvider initialStatus={status}>`, removed `status` prop from both components.

## Decisions made

- Chose React context over saving/restoring scroll position because the latter is fragile and timing-dependent.
- Both `CheckAvailabilityButton` and `StatusDropdown` use `setStatus` from the same context, so status changes propagate instantly to `JobHeader` (badge) and `JobActions` (button visibility / dropdown options) without any server round-trip.
- The availability API already returns `{ status: "active" | "unavailable" }` in the response — reused that payload to update state (validated with a type guard `isJobStatus`).
- The `StatusDropdown` still calls the `updateJobStatus()` server action to persist to DB, but updates UI via context instead of `router.refresh()`.

## Problems solved

- `router.refresh()` in Next.js App Router triggers a full server component re-fetch, which resets scroll position when the RSC payload is reconciled on the client. This was the root cause of the page "jumping" on click.
- The same bug existed in `StatusDropdown` (when changing status via dropdown) — also fixed.

## Current state

- TypeScript typecheck (`npx tsc --noEmit`) passes.
- ESLint passes (`npm run lint`).
- Next.js build succeeds.
- Git working tree is dirty (both this fix and prior Feature 14 / filter fixes uncommitted).

## Next session starts with

1. Run `/remember restore`.
2. Read AGENTS/context files in order.
3. Manually test: open a job detail, click "Check Availability" → page should not scroll, status badge and dropdown should update.
4. Test: change status via dropdown → same no-scroll behavior.
5. Review dirty worktree and decide on committing.

## Open questions

- None for this fix.
