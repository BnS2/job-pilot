# Memory — Job Details Status UX Polish

Last updated: 2026-06-14

## What was built

Reworked the job details page status actions for better discoverability and visual clarity:

1. **`lib/utils.ts`** — added `getJobStatusAccentClass()` returning `border-l-4 border-l-{status-token}` per non-active status. Changed rejected badge from `text-accent` to `text-error`.

2. **`components/job-details/StatusDropdown.tsx`** — when `STATUS_TRANSITIONS[status]` has only 1 entry (archived/rejected/completed → "Restore Active"), renders a direct primary button (`bg-accent text-accent-foreground`) with refresh icon instead of a dropdown. Auto-fires an availability check (`/api/agent/availability`) after restoring to active. Both success and error feedback messages auto-dismiss after 3 seconds via `useEffect` timeout.

3. **`components/job-details/JobHeader.tsx`** — card `section` appends accent border class from `getJobStatusAccentClass()` (info for applied, warning for unavailable, muted for archived, error for rejected, success for completed).

4. **`components/job-details/JobActions.tsx`** — slimmed to just the apply CTA via `getApplyCta()`: primary "Apply Now" for active, muted "Already Applied" for applied, muted "Position Unavailable" for unavailable, hidden (`null`) for archived/rejected/completed. Removed `StatusDropdown` and `CheckAvailabilityButton` (moved to toolbar).

5. **`components/find-jobs/CheckAvailabilityButton.tsx`** — auto-dismiss messages after 3 seconds (same pattern as StatusDropdown).

6. **`components/job-details/JobStatusToolbar.tsx`** (new) — thin client wrapper reading status from `JobStatusProvider` context, renders `StatusDropdown` + conditional `CheckAvailabilityButton` (only for active/unavailable).

7. **`app/find-jobs/[id]/page.tsx`** — `BackToJobsLink` and `JobStatusToolbar` now share a `flex justify-between` row at the top inside `JobStatusProvider`. `JobActions` no longer takes `jobId`.

8. **`context/ui-registry.md`** and **`context/progress-tracker.md`** — updated with all new patterns.

## Decisions made

- Rejected accent color changed from primary purple (`accent`) to red (`error`) across card border and badge — purple is reserved for positive brand actions.
- Restore-to-active auto-checks availability so the user doesn't have to manually click "Check Availability" right after restoring.
- Status actions moved to top toolbar row alongside "Back to Jobs" — discoverable at eye level, no scrolling needed.
- Apply CTA now reflects status: hidden for terminal states, muted for applied/unavailable, only active shows the primary link.

## Problems solved

- "Restore Active" required two clicks (open dropdown → click option) when it was the only option — now one click via direct button.
- Non-active states (rejected, archived, completed) were visually identical to active on the card — now have a 4px left-border accent strip.
- "Apply Now" button showed even on rejected/already-applied jobs — now status-aware.
- "Status updated." and "Job listing appears to be active" messages persisted forever — now auto-dismiss after 3s.

## Current state

- Recent toast-specific lint and TypeScript checks pass.
- Full `npm run lint` is currently blocked by the existing `components/job-details/AvailabilityIndicator.tsx` `react-hooks/set-state-in-effect` warning/error.
- All changes are uncommitted.

## Next session starts with

1. Run `/remember restore` then read AGENTS/context files.
2. Manually test the job details page for rejected, active, applied, and archived states:
   - Verify accent border strip appears on non-active jobs.
   - Verify "Restore Active" is a direct primary button (no dropdown) for rejected/archived/completed.
   - Verify restoring to active auto-checks availability.
   - Verify apply CTA changes per status.
   - Verify messages auto-dismiss after 3s.
3. Review and commit.

## Open questions

- None.

---

## Follow-up — Toast Notification UX Polish

Status-change toasts were visually too large and appeared top-center over the job details content. `lib/toast.tsx` now lets all status toasts inherit the root Sonner `bottom-right` placement, caps toast width at 360px, uses token-derived tonal backgrounds instead of raw color literals, and adds a subtle 4px inset status stripe for visibility without the alert-card feel. `app/layout.tsx` now enables a close button and uses a 24px desktop / 16px mobile viewport offset.

Follow-up consistency pass: `toast.success()`, `toast.error()`, and `toast.info()` now render the same rich toast shell as `toast.statusChange()` instead of passing raw strings to Sonner. Generic toasts now include a token icon, primary message typography, the shared responsive width, tonal background, and inset status stripe while preserving the existing helper API at all call sites.

Company research follow-up: `CompanyResearchCard` now uses `toast.statusChange()` for completion and research-start failures instead of the generic success/error helpers. The completion toast is titled `Company research ready`, shows the company as subtitle, and uses the slower completed/status duration so it does not feel smaller or faster than the job lifecycle toasts.

Verification:

- `npm run lint -- app/layout.tsx lib/toast.tsx` passes after the consistency pass.
- `npx tsc --noEmit` passes.
- `npm run build` passes when network access is allowed for the Next.js Google Font fetch.
- Full `npm run lint` is currently blocked by the existing `components/job-details/AvailabilityIndicator.tsx` `react-hooks/set-state-in-effect` warning/error, which was not part of the toast revamp.
