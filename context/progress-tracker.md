# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 3 — Find Jobs Page
**Last completed:** 11 Filter + Sort + Pagination
**Next:** 12 Job Lifecycle + Stale Listing Handling

---

## Progress

### Phase 1 — Foundation

- [x] 00 Environment Schema
- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [x] 10 Adzuna Job Discovery
- [x] 11 Filter + Sort + Pagination
- [ ] 12 Job Lifecycle + Stale Listing Handling

### Phase 4 — Job Details Page

- [ ] 13 Job Details Page — Full UI
- [ ] 14 Company Research Agent

### Phase 5 — Dashboard

- [ ] 15 Dashboard Page — Full UI
- [ ] 16 Stats Bar — Real Data
- [ ] 17 Recent Activity — Real Data
- [ ] 18 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- 2026-06-09 — Replaced Browserbase + Stagehand with Gemini Google Search grounding + Gemini URL Context for company research. Reason: Browserbase account is unavailable, and company research only needs public web discovery/content extraction rather than interactive browser automation.
- 2026-06-09 — Replaced OpenAI GPT-4o with a split Gemini model strategy. Use Gemini 3.5 Flash for matching, resume extraction, resume generation, and dossier synthesis because it is the newer free-tier text model. Use Gemini 2.5 Flash only for company web research because Google Search grounding is free on 2.5 Flash up to the documented daily limit. Use Gemini 3.1 Flash-Lite only for low-risk high-volume text calls if quotas become tight.
- 2026-06-09 — Added a browser-agent escape hatch. Phase 1 stays Gemini Search + URL Context because it preserves the same user-facing dossier flow without Browserbase. If real usage shows weak research, missing sources, or a future need for visual/interactive browsing, add a separate Playwright + Gemini worker while keeping the same `jobs.company_research` schema.
- 2026-06-10 — Adopted Varlock for environment variable context. `.env.schema` will be the committed source of truth for env names, validation, and sensitivity; real local values stay in gitignored `.env`.
- 2026-06-10 — Implemented InsForge OAuth auth with `@insforge/sdk/ssr`, using Next.js 16 `proxy.ts` for protected route checks instead of deprecated middleware.
- 2026-06-10 — Installed PostHog MCP for Codex with `npx @posthog/wizard mcp add`. MCP is for agent-side analytics workflows and does not affect app runtime.
- 2026-06-10 — Completed PostHog initialization alignment. The wizard-added foundation events are now explicitly allowed in `code-standards.md`, and server-side PostHog captures use a short-lived client with `await shutdown()` before route return.
- 2026-06-10 — Feature 04 schema decisions: ON DELETE CASCADE from auth.users → profiles → all child tables. Auto-create trigger on auth.users INSERT pre-fills profiles row with email and is_complete=false. RLS uses auth.uid() policies on all four tables. user_id indexes added to jobs, agent_runs, agent_logs for filtered query performance. resume_pdf_key added to profiles alongside resume_pdf_url (InsForge storage requires both url and key). InsForge MCP installed for Antigravity agent via @insforge/install + @insforge/cli link.
- 2026-06-12 — Added job lifecycle and stale-listing handling to project scope before Job Details/Dashboard work. Saved jobs remain persistent history, but default user-facing lists should focus on active opportunities. Stale/closed listings are soft-marked `unavailable`, user outcomes use statuses like `applied`, `archived`, `rejected`, and `completed`, and new searches should upsert matching external listings instead of creating cross-run duplicates.

---

## Notes

- 2026-06-09 — Built homepage from the supplied landing page design using public assets: `logo.png`, `dashboard-demo.png`, `jobs-lists.png`, `agnet-log.png`, and `user-icon.png`. Added token-based gradient and texture utilities in `app/globals.css`.
- 2026-06-10 — Installed `varlock@1.5.1`, added committed `.env.schema`, unignored `.env.schema`, and wrapped package scripts with `varlock run --`. `.env.schema` currently documents the public InsForge variables consumed by auth, and future env entries should be added in the same feature that introduces their consuming code.
- 2026-06-10 — Auth now requires `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` in `.env`. Login supports Google and GitHub OAuth, `/callback` completes the browser SDK exchange, `/api/auth/refresh` refreshes sessions, and `proxy.ts` protects `/dashboard`, `/profile`, and `/find-jobs`.
- 2026-06-10 — Polished the auth page into a simplified split-card OAuth page matching the project UI context and added a temporary protected `/dashboard` checkpoint with logout so the login/logout flow can be tested before the full Phase 5 dashboard.
- 2026-06-10 — PostHog wizard output was folded into this tracker instead of kept as a standalone report. The wizard added `posthog-js`, `posthog-node`, `instrumentation-client.ts`, PostHog reverse-proxy rewrites, homepage CTA captures, auth-funnel captures, server-side sign-in capture, and a Codex MCP setup. `.env.schema` now includes `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`. The wizard also created PostHog-hosted insights for analytics basics, sign-up conversion, daily sign-ins, provider breakdown, auth errors, and sign-outs.
- 2026-06-10 — Added typed PostHog client/server helpers in `lib/posthog-client.ts`, `lib/posthog-server.ts`, and `lib/posthog-events.ts`; migrated homepage/auth captures to the helpers; added `dashboard_checkpoint_viewed` for the current authenticated dashboard checkpoint.
- 2026-06-10 — Follow-up PostHog/local env cleanup: browser PostHog now disables feature flag polling and normal dev debug retry logs because JobPilot does not use flags yet. Environment context now explicitly says `.env` is the only local values file; `.env.local` is wizard/tool drift and should not receive project variables.
- 2026-06-10 — Feature 04 complete. Created profiles, agent_runs, jobs, agent_logs tables via InsForge MCP run-raw-sql. Created private resumes storage bucket. All tables have RLS enabled with auth.uid() policies. Auto-create profile trigger on auth.users INSERT. Committed as migrations/004_schema.sql (commit aa51ae8).
- 2026-06-10 — Feature 05 complete. Built `/profile` as a protected mock-data Profile Page matching `context/designs/profile.png`: attention banner with completion ring, resume upload/generate section, full profile information form, and save button. No save, upload, extraction, or generation logic is wired yet.
- 2026-06-10 — Feature 06 complete. Wired the profile form to InsForge DB and Storage. Implemented client-side resume PDF uploads to private `resumes` bucket with immediate database metadata updates. Computed profile completeness dynamically on the server and client (required fields: full_name, phone, location, work_authorization, current_title, experience_level, years_experience, skills, education, job_titles_seeking, remote_preference). When completeness transitions from incomplete to complete, triggers the `profile_completed` server-side PostHog event. Added resume deletion support to remove files from Storage and clear references in the profiles table.
- 2026-06-10 — Feature 06 repair pass complete. Replaced loose profile form `any` types with shared profile data types, aligned resume upload with the installed InsForge SDK `.upload(path, file)` signature, and re-verified with `npm run lint`, `npx tsc --noEmit`, and `npx next build`.
- 2026-06-10 — Feature 06 UI review fix. Editable profile form fields now use the normal `bg-surface` input treatment with consistent muted placeholder styling; only read-only/secondary controls keep `bg-surface-secondary`.
- 2026-06-10 — Added optional Cover Letter Tone to Job Preferences and profile persistence. The preference is stored for future writing features but does not affect profile completeness; cover-letter generation remains out of scope.
- 2026-06-10 — Fixed Feature 06 profile persistence after authenticated testing exposed silent zero-row updates. `saveProfile` and resume metadata writes now insert missing profile rows, verify the affected row before returning success, and existing auth users were backfilled via `migrations/005_profile_backfill.sql`.
- 2026-06-11 — Fixed private resume access. `resume.pdf` now opens through authenticated `/api/profile/resume`, which verifies the current user, reads their `resume_pdf_key`, downloads from the private `resumes` bucket via the server InsForge client, and streams the PDF inline instead of linking directly to a protected storage object URL.
- 2026-06-11 — Feature 07 complete. Added `GEMINI_API_KEY` to `.env.schema`, installed `@google/genai`, `pdf-parse`, and `zod`, and created the review-first AI resume extraction flow. `/api/resume/extract` verifies the authenticated user, downloads their private resume by `resume_pdf_key`, parses PDF text with `pdf-parse`, sends extracted text to Gemini 3.5 Flash through `agent/extractor.ts`, validates structured profile JSON with Zod, and returns fields to the client without saving. `ProfileClient` now shares draft state between `ResumeUpload` and `ProfileForm`; Extract from Resume appears only after a resume exists and populates the form for manual review/save.
- 2026-06-11 — Feature 07 reliability fix complete. Resume extraction now prefers MarkItDown (`markitdown` CLI or `python3 -m markitdown`) to convert uploaded PDFs into Markdown before Gemini, then falls back to `pdf-parse` when MarkItDown is unavailable or too sparse. Gemini extraction retries transient availability/rate failures and falls back from `GEMINI_TEXT_MODEL` to `GEMINI_FAST_MODEL`; upstream temporary failures now return 503 instead of invalid-resume 422. Extraction runs write agent_runs / agent_logs entries for local and production debugging.
- 2026-06-11 — Feature 07 verified in local runtime. Project-local `.venv` now contains MarkItDown, app code checks `.venv/bin/markitdown` before global commands, and `/api/resume/extract` logs the active text extractor (`markitdown` or `pdf-parse`) while keeping the user-facing success message clean. User confirmed the extraction flow is working as intended.
- 2026-06-12 — Feature 08 complete. Added `@react-pdf/renderer`, `agent/resumeGenerator.ts`, `app/api/resume/generate/ResumeDocument.tsx`, and `app/api/resume/generate/route.ts`. The profile page now has one-click resume generation from saved profile data. `/api/resume/generate` authenticates the user, validates resume-essential profile fields, generates polished structured resume content with Gemini 3.5 Flash, renders an A4 PDF with `renderToBuffer`, uploads it to the private `resumes` bucket, saves the returned `resume_pdf_url` and `resume_pdf_key`, and returns updated metadata to the client. Generation uses the single-active-resume rule and removes the previous active storage object only after the new generated resume is active.
- 2026-06-12 — Feature 08 reliability fix complete. Resume generation now retries transient Gemini availability/rate/high-demand failures on `GEMINI_TEXT_MODEL` and falls back to `GEMINI_FAST_MODEL` before returning a temporary-service 503. This matches the proven Feature 07 extraction reliability pattern.
- 2026-06-12 — Review follow-up complete. Verified the pasted review findings against current code and fixed the still-valid profile/resume issues: resume metadata now requires a user-owned storage key and matching storage URL before persistence, failed metadata writes clean up the uploaded object, storage deletion failures no longer clear profile references, extraction runs start before storage download and mark early failures failed, profile completion indicators use dynamically calculated values, Gemini retry helpers are shared, MarkItDown failures are logged selectively, accessibility attributes were added to nav/progress UI, and docs/migration/requirements drift was corrected.
- 2026-06-12 — Feature 09 complete. Built the protected `/find-jobs` mock UI from `context/designs/find-jobs.png`: search controls card, success banner, filter toolbar, jobs table, source badges, match score bars, and pagination. Kept the `SOURCE` column from the build plan and schema because `jobs.source` is already constrained to `search | url`; badge styling stays token-based per `ui-tokens.md` / `ui-rules.md`. No Adzuna, DB jobs query, real filtering, sorting, or pagination logic is wired yet.
- 2026-06-12 — Feature 10 complete. Added server-side Adzuna IT job discovery with `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` in `.env.schema`, `lib/adzuna.ts` for Adzuna search/country detection/normalization, `agent/matcher.ts` for Gemini structured match scoring, `agent/adzuna.ts` for discovery orchestration, and `app/api/agent/find/route.ts` for the authenticated API boundary. Search location now falls back to `profiles.location`, all successfully scored jobs are saved with `source='search'`, within-run Adzuna duplicates are skipped, and PostHog captures `job_search_started` / `job_found`. The Find Jobs table remains presentational until Feature 11 wires real DB reads, filtering, sorting, and pagination.
- 2026-06-12 — Feature 10 search review fixes complete. Zero-result Adzuna searches now return a normal empty response with an info banner instead of HTTP 404. Profile-location fallback is now conservative: unsupported locations are not sent as `where` to the default US Adzuna endpoint, while explicit search locations are still respected.
- 2026-06-12 — Feature 10 Gemini matching reliability fix complete. Empty, truncated, or schema-invalid Gemini match JSON now retries and falls back from `GEMINI_TEXT_MODEL` to `GEMINI_FAST_MODEL` before skipping a job. Match-output failures are logged separately from provider availability failures, and the job matching output budget is now 700 tokens.
- 2026-06-12 — Feature 10 auth-expiry fix complete. Protected route refresh failures now clear stale InsForge auth cookies before redirecting to login, and the Find Jobs search form handles API 401 responses by clearing browser/cookie auth state and routing to `/login?next=/find-jobs`.
- 2026-06-12 — Auth-expiry follow-up complete. Protected routes no longer accept access-token-only cookies, `/api/auth/refresh` clears auth cookies through `NextResponse` on refresh failure, protected app pages mount an invisible `AuthSessionGuard` that redirects to login on browser refresh 401, and navbar app links disable prefetch to avoid background protected-page renders from public auth pages.
- 2026-06-12 — Feature 11 complete. Wired `/find-jobs` filtering, sorting, search, and pagination to the real database. Added custom interactive dropdown filters and debounced query syncing via URL parameters.
- 2026-06-12 — Feature 11 UX fix complete. Successful Find Jobs searches now route to `/find-jobs?run={runId}` so the visible list is scoped to the latest search run instead of compounding every saved job for the user. The search controls also show staged live status copy during the synchronous Adzuna/Gemini scoring request so long searches do not appear stuck.
- 2026-06-12 — Auth refresh optimization complete. `AuthSessionGuard` no longer calls `/api/auth/refresh` immediately on protected-page mount because `proxy.ts` and the InsForge browser SDK already handle initial refresh. It now remains as a periodic 5-minute stale-session guard, reducing duplicate healthy-session refresh logs.
- 2026-06-12 — Dashboard navbar polish complete. Removed the unauthenticated "Start for free" CTA from the protected dashboard navbar and marked Dashboard as the active nav item.
- 2026-06-12 — Feature 11 review fixes complete. Hardened `/find-jobs` query params before PostgREST filtering, clamped/redirected invalid pagination, slowed text filter debounce to 700ms, switched filter/pagination URL changes to `router.replace(..., { scroll: false })`, removed fixed-position dropdown backdrops and raw ring color usage, added null-safe jobs table rendering, and changed the navbar logo to eager loading for the LCP warning.
- 2026-06-12 — Homepage auth redirect restored. `/` now checks the InsForge server session and redirects signed-in users to `/dashboard`, so navbar/footer logo links to `/` satisfy the product rule instead of showing the public homepage to authenticated users.
