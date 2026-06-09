# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:**
**Last completed:**
**Next:**

---

## Progress

### Phase 1 — Foundation

- [ ] 01 Homepage
- [ ] 02 Auth
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

---

## Notes

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._
