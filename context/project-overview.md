# Project Overview

## About the Project

JobPilot is a full stack AI-powered job hunting assistant. The user sets up their profile once, uploads their resume, and the agent automatically discovers relevant jobs from Adzuna — scoring each one against the user's profile using Gemini 3.5 Flash. For jobs they're interested in, the agent researches the company across public web pages using Gemini 2.5 Flash with URL Context and Google Search grounding, then Gemini 3.5 Flash builds a structured dossier — company overview, tech stack, culture, why the role exists, and interview prep. The user reviews everything and applies with one click.

The entire process is tracked on a dashboard with PostHog-powered analytics and a recent activity feed.

---

## The Problem It Solves

Job hunting is one of the most repetitive and time-consuming tasks a developer faces. Reading dozens of job descriptions, deciding if a role fits, researching each company from scratch — all of this before even clicking apply.

JobPilot eliminates all of that preparation work. The agent finds the jobs, scores them intelligently against the user's actual skills, and researches each company so the user arrives at every application fully informed. The user just decides which ones to apply to and clicks.

For high-interest roles, JobPilot can also generate a job-specific tailored resume. The tailored resume uses the user's saved profile/resume, the job posting, and the company research dossier when available, then produces a private PDF aligned to that company and role without changing the user's main profile data.

---

## Pages

```
/                  → Homepage
/login             → Auth page (Google + GitHub OAuth)
/dashboard         → Overview, recent activity, analytics
/find-jobs         → Search controls + full jobs list
/find-jobs/[id]    → Individual job details page + company research
/profile           → Profile form, resume management
```

---

## Navigation

Top navbar. Clean and minimal. Three navigation items:

```
Dashboard    Find Jobs    Profile
```

Full width layout on all pages. No sidebar.

---

## Core User Flow

### Homepage

- Hero section
- Logged in users → redirect to dashboard
- Logged out users → redirect to login

### Onboarding

- User signs up via InsForge auth (Google or GitHub OAuth)
- On login → redirect to /dashboard
- Dashboard shows incomplete profile banner if profile not finished

### Profile Setup

- User fills profile form — all standard resume fields
- User uploads their existing resume PDF
- Two options on upload:
  - "Extract from Resume" → MarkItDown converts the PDF to Markdown when available, Gemini 3.5 Flash parses the resume content, and the profile form fields auto-fill
  - "Skip" → resume stored as-is, profile unchanged
- User can manually edit any profile field at any time
- User can save an optional preferred cover-letter tone for future writing features
- User can generate a clean professional PDF resume from their current profile data using Gemini 3.5 Flash

### Finding Jobs — Adzuna Discovery

- User goes to Find Jobs page
- Enters job title and location
- Clicks Find Jobs button
- Agent calls Adzuna API with user's search criteria
- Gemini 3.5 Flash scores each job 0-100 against user profile
- Jobs appear in the job list below
- After search completes a message shows: "Found 8 jobs and saved 4 strong matches"
- New searches refresh existing saved jobs when the same external listing is found again instead of creating duplicate pipeline rows
- Jobs remain saved as history, but the default list focuses on active opportunities

### Job Matching

- Gemini 3.5 Flash scores each job 0-100 against user profile
- Returns: score, match reason, matched skills array, missing skills array
- All jobs visible in Find Jobs page regardless of score
- High scoring jobs visually highlighted
- Low scoring jobs still accessible — user decides what to do

### Job Lifecycle

- Saved jobs are treated as a lightweight pipeline, not disposable search results
- Every job has a lifecycle status:
  - `active` — available and worth showing in the default jobs list
  - `unavailable` — listing appears closed, expired, removed, or unreachable
  - `archived` — user hid the opportunity without applying
  - `applied` — user applied externally
  - `rejected` — user marked the opportunity as no longer progressing
  - `completed` — user completed the process or no further action is needed
- The default `/find-jobs` view shows `active` jobs unless the user selects another status filter
- Stale, closed, archived, applied, rejected, and completed jobs are soft-hidden from the default working list but retained for history, analytics, and future resume/application context
- Availability can be refreshed when a job reappears in search, when opening job details, or through an explicit status refresh action
- Do not hard-delete jobs as a normal cleanup path; delete only for explicit destructive user actions or administrative repair

### Job Details Page

- Full structured job information:
  - Title, company, location, salary, job type, source, date found
  - About the role
  - Responsibilities (bullet points)
  - Requirements (bullet points)
  - Nice to have (if present)
  - Benefits (if present)
  - About the company
- Match score section:
  - Score number prominently displayed
  - Visual score indicator
  - Matched skills — green tags
  - Missing skills — red tags
  - Match reason paragraph from Gemini 3.5 Flash
- Company Research section:
  - Empty state with Research Company button
  - After research: structured dossier showing company overview, tech stack, culture, why this role exists, interview prep talking points
  - Powered by Gemini 2.5 Flash URL Context + Google Search grounding over the company's public pages, with Gemini 3.5 Flash synthesis
- Tailored Resume section:
  - Empty state with Tailor Resume button
  - Uses saved profile data, the base resume, the job posting, match gaps, and company research when available
  - Generates a role/company-specific private PDF for this job without overwriting the user's base resume
- Apply Now button — opens external apply URL in new tab

### Company Research Flow

- User clicks Research Company on job details page
- Server follows the Adzuna redirect to the real employer job page when possible
- Gemini 2.5 Flash Google Search grounding discovers the most likely official company site and high-value public pages
- Gemini 2.5 Flash URL Context reads the homepage and up to 3 relevant pages such as About, Careers, Blog, Engineering, or Product
- Gemini 3.5 Flash synthesizes all retrieved content, the job posting, and the user's profile into a structured dossier
- Dossier displayed on job details page
- If company pages cannot be retrieved — Gemini 3.5 Flash generates the best dossier from company name, job description, and profile alone

### Job-Specific Resume Tailoring Flow

- User clicks Tailor Resume on a job details page
- Server verifies the job belongs to the current user and loads:
  - Saved profile data
  - Current base resume PDF / extracted profile fields when available
  - Job description, match reason, matched skills, missing skills
  - Company research dossier when available
- Gemini 3.5 Flash rewrites resume content for that specific role and company:
  - Professional summary aligned to the role
  - Experience bullets emphasizing relevant evidence
  - Skills ordering that mirrors the job requirements honestly
  - Gap-aware framing that does not invent experience
- `@react-pdf/renderer` renders the tailored resume PDF
- Tailored PDF is uploaded to private InsForge Storage and saved against the job, not the profile
- Job Details displays the tailored resume status, preview/download link, and regenerate action
- The user's main `profiles` data and base `profiles.resume_pdf_*` values are never overwritten by tailoring

### Company Research Implementation Strategy

Phase 1 intentionally replaces Browserbase + Stagehand with Gemini web research because the current product only needs public company research, source links, and a structured dossier. The user experience and stored data shape stay the same as the original Browserbase plan: the user clicks Research Company and receives `jobs.company_research` JSON with sources.

If Phase 1 produces consistently thin research, misses source URLs, or future scope requires visual/interactive browsing, transition to a browser-agent worker without changing the UI contract:

1. Add a separate Playwright + Gemini worker for page navigation, clicking, scrolling, screenshots, and extraction.
2. Keep the same `jobs.company_research` dossier schema so Job Details and Dashboard do not need to be redesigned.
3. Move to a managed browser provider such as Browserless, Steel, or Hyperbrowser only if local Playwright becomes too hard to operate or scale.

Do not build the browser-agent fallback until evidence shows Gemini Search + URL Context is not enough for the current research workflow.

### Dashboard

- Stats bar — 4 cards: Active Jobs Found, Avg. Match Rate, Companies Researched, Jobs This Week
- Recent activity — list of last 5-10 user actions pulled from DB
- Analytics section (PostHog powered):
  - Jobs found over time — line chart
  - Match score distribution — bar chart
  - Company research activity — bar chart

### Find Jobs Page

- Search controls at top:
  - Job title input
  - Location input
  - Find Jobs button
  - Success message after search: "Found 8 jobs and saved 4 strong matches"
- Full paginated job list below:
  - Filter: All Matches / High Match / Low Match dropdown
  - Sort dropdown: Match Score / Newest / Oldest
  - Each job row: company, title, match score badge, salary, source badge, date found
  - Click job row → opens job details page
  - Pagination — 20 jobs per page
  - "Jobs by Adzuna" credit displayed on job listings
- Job status filter — Active by default, with access to unavailable, archived, applied, rejected, and completed jobs
- Stale or unavailable jobs are visibly labeled and excluded from active-job metrics by default

---

## Data Architecture

### Main Profile Data

- Lives in `profiles` table
- Only changes when user explicitly edits profile page or uploads resume and selects "Extract from Resume"
- Used for job matching
- Never modified by any agent operation

### Company Research Data

- Stored in `jobs.company_research` jsonb column
- Generated per job when user clicks Research Company
- Never affects profile data or match score

### Tailored Resume Data

- Stored per job, either on `jobs` via tailored resume metadata columns or in a dedicated `job_resumes` table
- Contains private InsForge Storage `url` and `key`, generation status, generated timestamp, and concise tailoring notes
- Generated per job/company when the user clicks Tailor Resume
- Never overwrites the user's base resume on `profiles`
- Does not automatically recalculate the job's original match score

### Job Lifecycle Data

- Stored on each `jobs` row using status and availability timestamps
- Used to keep the active jobs list useful without losing historical context
- New discovery runs should upsert matching external listings: update `last_seen_at`, `found_at`, availability fields, and refreshed metadata instead of creating duplicate rows
- Jobs should move out of `active` only through user action or a verified availability check, not merely because they are old

---

## Features In Scope

- Homepage with hero, how it works, features, footer
- Top navbar — Dashboard, Find Jobs, Profile
- InsForge authentication (Google + GitHub OAuth)
- Redirect to dashboard after login
- Profile form with all standard resume fields
- Resume PDF upload with optional profile auto-fill via Gemini 3.5 Flash
- Resume PDF generation from profile data using Gemini 3.5 Flash
- Job/company-specific resume tailoring from the job details page using Gemini 3.5 Flash
- Adzuna API job discovery — searches by title and location, category filtered to IT jobs
- Job lifecycle management — active, unavailable, archived, applied, rejected, completed
- Stale listing detection and soft-hiding from the default active jobs view
- Gemini 3.5 Flash job matching with score, reason, matched skills, missing skills
- Job details page with full structured description
- Company Research Agent — Gemini 2.5 Flash Search grounding discovers public pages, Gemini 2.5 Flash URL Context reads them, Gemini 3.5 Flash builds dossier
- Find Jobs page with search controls, filter, sort dropdown, pagination
- Dashboard with stats bar, recent activity, analytics charts
- PostHog event tracking throughout
- DB-first analytics charts on dashboard, with PostHog retained for event capture
- Incomplete profile banner on dashboard
- "Jobs by Adzuna" credit on all job listings

---

## Features Out of Scope

- Auto apply — agent does not fill or submit application forms
- Cover letter generation — tone preference is stored, but generation is not built in the current scope
- Score recalculation after tailoring
- Previous Job + Next Job navigation
- Sidebar navigation — top navbar only
- Separate analytics page — charts live on dashboard
- Live browser embed on dashboard
- Live agent feed / realtime log
- Job-specific profile form on job details page
- Email or push notifications
- Mobile app
- Team or multi-user accounts
- Scheduled agent runs — manually triggered only
- Multiple saved resume versions — one active resume per user at a time
- Payment or subscription system
- Browser extension

---

## PostHog Events

```typescript
job_search_started; // { userId, jobTitle, location }
job_found; // { userId, source, matchScore }
job_status_changed; // { userId, jobId, fromStatus, toStatus, reason }
job_unavailable_detected; // { userId, jobId, source, reason }
profile_completed; // { userId }
company_researched; // { userId, jobId, company }
resume_tailored; // { userId, jobId, company }
```

---

## Target User

A developer or technical job seeker who:

- Is actively applying to jobs
- Has an existing resume they want to use
- Wants intelligent job matching based on their actual skills
- Wants to research companies quickly before applying
- Is comfortable with a modern web application

---

## Success Criteria

- User can sign up, fill profile, upload resume, and start finding jobs in under 5 minutes
- Adzuna job discovery returns relevant tech jobs for any title and location search
- Gemini 3.5 Flash match scores feel accurate and the reasoning makes sense
- Company Research Agent returns a useful dossier for well-known tech companies
- Company Research Agent gracefully handles companies with minimal web presence
- Job details page displays clean structured job information
- User can generate a private tailored resume PDF for a specific job/company without losing their base resume
- Dashboard analytics charts show meaningful data after several searches
- All job data stored correctly in InsForge with full structured fields
- PostHog events fire correctly for all key user actions
- UI is visually consistent across all pages
