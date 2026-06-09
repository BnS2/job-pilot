# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 1 — Foundation
**Last completed:** 02 Auth
**Next:** 03 PostHog Initialization

---

## Progress

### Phase 1 — Foundation

- [x] 00 Environment Schema
- [x] 01 Homepage
- [x] 02 Auth
- [ ] 03 PostHog Initialization
- [ ] 04 Database Schema

### Phase 2 — Profile Page

- [ ] 05 Profile Page — Full UI
- [ ] 06 Profile Save Logic
- [ ] 07 AI Profile Extraction from Resume
- [ ] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [ ] 09 Find Jobs Page — Full UI
- [ ] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [ ] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- 2026-06-09 — Replaced Browserbase + Stagehand with Gemini Google Search grounding + Gemini URL Context for company research. Reason: Browserbase account is unavailable, and company research only needs public web discovery/content extraction rather than interactive browser automation.
- 2026-06-09 — Replaced OpenAI GPT-4o with a split Gemini model strategy. Use Gemini 3.5 Flash for matching, resume extraction, resume generation, and dossier synthesis because it is the newer free-tier text model. Use Gemini 2.5 Flash only for company web research because Google Search grounding is free on 2.5 Flash up to the documented daily limit. Use Gemini 3.1 Flash-Lite only for low-risk high-volume text calls if quotas become tight.
- 2026-06-09 — Added a browser-agent escape hatch. Phase 1 stays Gemini Search + URL Context because it preserves the same user-facing dossier flow without Browserbase. If real usage shows weak research, missing sources, or a future need for visual/interactive browsing, add a separate Playwright + Gemini worker while keeping the same `jobs.company_research` schema.
- 2026-06-10 — Adopted Varlock for environment variable context. `.env.schema` will be the committed source of truth for env names, validation, and sensitivity; real local values stay in gitignored `.env`.
- 2026-06-10 — Implemented InsForge OAuth auth with `@insforge/sdk/ssr`, using Next.js 16 `proxy.ts` for protected route checks instead of deprecated middleware.

---

## Notes

- 2026-06-09 — Built homepage from the supplied landing page design using public assets: `logo.png`, `dashboard-demo.png`, `jobs-lists.png`, `agnet-log.png`, and `user-icon.png`. Added token-based gradient and texture utilities in `app/globals.css`.
- 2026-06-10 — Installed `varlock@1.5.1`, added committed `.env.schema`, unignored `.env.schema`, and wrapped package scripts with `varlock run --`. `.env.schema` currently documents the public InsForge variables consumed by auth, and future env entries should be added in the same feature that introduces their consuming code.
- 2026-06-10 — Auth now requires `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` in `.env`. Login supports Google and GitHub OAuth, `/callback` completes the browser SDK exchange, `/api/auth/refresh` refreshes sessions, and `proxy.ts` protects `/dashboard`, `/profile`, and `/find-jobs`.
- 2026-06-10 — Polished the auth page into a simplified split-card OAuth page matching the project UI context and added a temporary protected `/dashboard` checkpoint with logout so the login/logout flow can be tested before the full Phase 5 dashboard.
