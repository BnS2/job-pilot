# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Phase 1 — Foundation

### 00 Environment Schema

Add Varlock before wiring external services.

**Logic:**

- Install Varlock as the project environment manager
- Create committed `.env.schema`
- Keep `.env.schema` limited to environment variables currently referenced by application code
- Add future variables in the same feature that introduces the consuming `process.env` usage
- Keep real local values in gitignored `.env`
- Mark server-only keys as sensitive when they are added
- Wrap npm scripts with `varlock run --`
- Validate local config with `varlock load`

### 01 Homepage

Build the complete homepage UI.

**UI:**

- Navbar — logo, Dashboard, Find Jobs, Profile links, Start for free button
- Hero section — headline, subheadline, Get Started CTA and Find Your First Match CTA
- Dashboard preview screenshot embedded below hero
- Features section — three value props with descriptions
- Testimonial section
- Bottom CTA section
- Footer

**Logic:**

- Get Started and Start for free → /login if not authenticated, /dashboard if authenticated

---

### 02 Auth

InsForge authentication — Google and GitHub OAuth.

**UI:**

- Login page — Google OAuth button, GitHub OAuth button

**Logic:**

- Google OAuth via InsForge
- GitHub OAuth via InsForge
- OAuth callback handler
- Session management
- Middleware protecting /dashboard, /profile, /find-jobs, /find-jobs/[id]
- After login → redirect to /dashboard

---

### 03 PostHog Initialization

Set up PostHog before any events fire. Must be done before any agent features.

**Logic:**

- Create lib/posthog-client.ts — PostHog browser client, initialized with NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST
- Create lib/posthog-server.ts — PostHog server client with flushAt: 1 and flushInterval: 0
- Initialize PostHog in root app layout — wraps entire app
- posthog.identify() called after successful login with user ID
- posthog.reset() called on logout
- Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.schema` before relying on the wizard-generated code locally or in deployment
- Use the Next.js instrumentation hook and PostHog reverse-proxy rewrites if the wizard installs them

**Agent workflow:**

- Install PostHog MCP for Codex using `npx @posthog/wizard mcp add`
- Use PostHog MCP for agent-side analytics workflows such as dashboards, insights, SQL, error triage, and feature flag operations
- MCP is an editor/agent integration only — it is not required for app runtime analytics

---

### 04 Database Schema

All InsForge tables and storage bucket created before any data is written.

**Logic:**

- Create `profiles` table with all columns from architecture.md
- Create `agent_runs` table
- Create `jobs` table with all columns including:
  - tailored fields
  - company_research jsonb column
  - source values: 'search' | 'url'
  - lifecycle fields: status, status_reason, source_job_id, last_seen_at, availability_checked_at, unavailable_at, archived_at, applied_at, completed_at
- Create `agent_logs` table
- Create `resumes` storage bucket with authenticated access only
- Row level security policies on all four tables — always filter by user_id

---

## Phase 2 — Profile Page

### 05 Profile Page — Full UI

Build the complete profile page UI with mock data. No save logic yet.

**UI:**

- Profile needs attention banner at top — completion percentage ring, missing field tags highlighted (e.g. PHONE, LOCATION, EDUCATION)
- Resume section — drag and drop upload area, "Click to upload or drag and drop" text, PDF only note, Select Resume button, Generate Resume from Profile button below
- Profile Information form with clearly labeled sections:
  - Personal Info — Full Name, Email (pre-filled, not editable), Phone Number, Location, LinkedIn URL, Portfolio/GitHub, Work Authorization dropdown
  - Professional Info — Current Job Title, Experience Level dropdown, Years of Experience, Skills tag input with Add button, Industries tag input with Add button
  - Work Experience — up to 3 roles, each with Company Name, Job Title, Start Date, End Date, Currently working here checkbox, Key Responsibilities textarea. Add role button.
  - Education — Highest Degree dropdown, Field of Study, Institution Name, Graduation Year
  - Job Preferences — Job Titles Seeking, Remote Preference dropdown, Salary Expectation, Preferred Locations, Cover Letter Tone dropdown
- Save Profile button at bottom

---

### 06 Profile Save Logic

Wire profile form to InsForge DB.

**Logic:**

- Server Action in actions/profile.ts saves all form fields to profiles table
- Resume PDF uploaded to InsForge Storage at resumes/{user_id}/resume.pdf with upsert: true
- resume_pdf_url saved to profiles table after upload
- is_complete set to true when all required fields are filled
- Completion percentage and missing fields calculated and saved
- Form pre-fills with existing data on return visits
- revalidatePath('/profile') called after save

---

### 07 AI Profile Extraction from Resume

Extract from Resume button — Gemini 3.5 Flash reads uploaded PDF text and auto-fills profile form fields.

**UI:**

- Extract from Resume button appears after resume is uploaded
- Loading state while processing
- Form fields populate automatically after extraction
- User reviews and edits if needed before saving

**Logic:**

- MarkItDown converts the uploaded PDF buffer into Markdown when available to preserve useful structure and reduce prompt noise
- pdf-parse extracts raw text as a fallback when MarkItDown is unavailable or returns too little text
- If extracted text is empty or too short — return error: "Could not extract text from this PDF. Please try a different file."
- Gemini 3.5 Flash reads extracted text and returns structured JSON matching all profile field names
- Transient Gemini 503 / rate / availability errors retry and then fall back to Gemini Flash-Lite before returning a temporary-service error
- Resume extraction attempts are logged to agent_runs / agent_logs for debugging
- Form fields populated with extracted data
- User saves manually after reviewing

---

### 08 Resume PDF Generation from Profile

Generate a clean professional PDF resume from current profile data using Gemini 3.5 Flash.

**Logic:**

- POST /api/resume/generate
- Reads current profile data from profiles table
- Gemini 3.5 Flash generates professional resume content:
  - Professional summary paragraph
  - Polished work experience bullet points
  - Clean professional language throughout
- @react-pdf/renderer renders Gemini output into clean single-page PDF using renderToBuffer()
- Buffer uploaded to InsForge Storage at resumes/{user_id}/resume.pdf with upsert: true
- resume_pdf_url updated in profiles table

---

## Phase 3 — Find Jobs Page

### 09 Find Jobs Page — Full UI

Build the complete Find Jobs page UI with mock data. No logic yet.

**Design note:**

- `context/designs/find-jobs.png` is the visual source of truth for layout, spacing, card treatment, table styling, and sample rows.
- Include the `SOURCE` column from the product schema/build plan even though the screenshot omits it. The database already constrains `jobs.source` to `'search' | 'url'`, so the UI reserves space for Search/URL badges while keeping badge colors aligned with `ui-tokens.md`.

**UI:**

- Search controls card at top:
  - JOB TITLE label + input with search icon placeholder "Frontend Engineer"
  - LOCATION label + input placeholder "Remote, New York..."
  - Find Jobs button with search icon
  - Success message area below controls — green banner: "Found 8 jobs and saved 4 strong matches."
- Job list section below:
  - Filter bar: text search input "Filter by company or role...", All Matches dropdown, Match Score sort dropdown
  - Jobs table with columns: COMPANY, ROLE, MATCH SCORE (color coded progress bar + percentage), SALARY EST., SOURCE (Search/URL badge), DATE FOUND
  - Pagination — "Showing 1 to 6 of 24 results", Previous, page numbers, Next

---

### 10 Adzuna Job Discovery

Agent calls Adzuna API to find jobs matching user's search criteria, scores them against user profile, saves to DB.

**Logic:**

- POST /api/agent/find receives jobTitle and location from client
- If the search location is blank, fall back to `profiles.location` only when it looks like a supported Adzuna market or Remote; if no usable location remains, omit Adzuna `where`
- Detect country with a small deterministic mapper for `us`, `gb`, `ca`, and `au`; default to `us`
- Call Adzuna API:
  - GET https://api.adzuna.com/v1/api/jobs/{country}/search/1
  - params: what={jobTitle}, optional where={location}, category=it-jobs, results_per_page=10, app_id, app_key
- For each job returned:
  - Extract title, company, location, salary, description snippet, redirect_url
  - Gemini 3.5 Flash scores job against user profile:
    - matchScore — integer 0-100
    - matchReason — one paragraph explanation
    - matchedSkills — skills user has that job requires
    - missingSkills — skills job requires that user lacks
  - Save or refresh complete record in jobs table:
    - source: 'search'
    - run_id from agent_runs record
    - All structured fields saved
- De-dupe repeated Adzuna results within one response by ID / redirect URL
- Cross-run duplicates are resolved by Feature 12 lifecycle upsert semantics: match existing user jobs by `source_job_id` first, then normalized source/apply URL
- Create agent_run record in DB
- After all jobs saved — update agent_run with total count, return success message to frontend
- If Adzuna returns zero jobs, return a normal empty-search response instead of an HTTP error
- The Find Jobs table remains mock-data/presentational until Feature 11 wires DB querying, filtering, sorting, and pagination

**PostHog events:** `job_search_started`, `job_found`

---

### 11 Filter + Sort + Pagination

Wire filter tabs, sort dropdown, text search, and pagination to real InsForge DB data.

**Logic:**

- All Matches tab — all jobs for current user
- High Match filter — jobs with match_score >= 70
- Low Match filter — jobs with match_score < 70
- Sort by Match Score — order by match_score descending
- Sort by Newest — order by found_at descending
- Sort by Oldest — order by found_at ascending
- Text search — filter by company name or job title (case insensitive)
- Pagination — 20 jobs per page, total count shown

---

### 12 Job Lifecycle + Stale Listing Handling

Make saved jobs behave like an active opportunity pipeline rather than an endlessly growing raw search dump.

**Schema / migration:**

- Add lifecycle columns to `jobs` if they are not already present:
  - `source_job_id text`
  - `status text default 'active'`
  - `status_reason text`
  - `last_seen_at timestamptz`
  - `availability_checked_at timestamptz`
  - `unavailable_at timestamptz`
  - `archived_at timestamptz`
  - `applied_at timestamptz`
  - `completed_at timestamptz`
- Add allowed status constraint: `active`, `unavailable`, `archived`, `applied`, `rejected`, `completed`
- Add indexes for `jobs(user_id, status)`, `jobs(user_id, source_job_id)`, and `jobs(user_id, last_seen_at DESC)`
- Add a partial uniqueness guard where practical for provider IDs: one active provider listing per user/source/source_job_id

**Logic:**

- New Adzuna discoveries upsert existing jobs instead of inserting duplicates across runs:
  - Prefer matching on `source_job_id`
  - Fall back to normalized `source_url` / `external_apply_url`
  - Refresh metadata, match fields, `run_id`, `found_at`, and `last_seen_at`
  - Preserve user-owned statuses such as `applied`, `archived`, `rejected`, and `completed`
  - If a previously `unavailable` job is found again, move it back to `active` and clear `unavailable_at`
- Add `actions/jobs.ts` for user-triggered status updates:
  - Archive job
  - Mark applied
  - Mark rejected
  - Mark completed
  - Restore to active
- Add a lightweight availability check helper:
  - Follow `source_url` / `external_apply_url` with server-side `fetch`
  - Mark `unavailable` only on clear signals such as 404, 410, explicit expired/closed pages, or provider-confirmed absence
  - Do not mark unavailable on timeouts, rate limits, bot blocks, or ambiguous redirects
  - Update `availability_checked_at` every time a check completes
- Store lifecycle changes in `agent_logs` when agent-driven, and capture lifecycle PostHog events.
- Do not hard-delete stale jobs as normal cleanup. Use soft status transitions.

**UI:**

- Default `/find-jobs` list shows `active` jobs.
- Add a status filter with Active, Applied, Unavailable, Archived, Rejected, Completed, and All.
- Existing match filters still apply within the selected status.
- Latest-search `run` views may show that run's saved/refreshed active results, but unavailable/completed rows should remain visibly labeled if included by explicit filters.
- Job rows and job details display a compact status badge.
- Job details page exposes lifecycle actions near Apply Now:
  - Mark Applied
  - Archive
  - Mark Rejected
  - Mark Completed
  - Restore Active when applicable
- Empty states should make the selected status clear, e.g. no active jobs vs no archived jobs.

**Dashboard effects:**

- Active opportunity metrics exclude `unavailable`, `archived`, `rejected`, and `completed`.
- Applied/completed history can be shown in recent activity and future pipeline metrics.
- Total historical jobs may still exist as a secondary metric, but should not replace active opportunity counts.

**PostHog events:** `job_status_changed`, `job_unavailable_detected`

---

## Phase 4 — Job Details Page

### 13 Job Details Page — Full UI

Build the complete job details page UI. Job data from DB is already available from Phase 3 — wire real data for all job info and match sections immediately. Company research section shows empty state only.

**UI:**

- Back to Jobs link
- Job header — company logo placeholder, job title, company name, match score badge with percentage, View Job Post button (links to redirect_url)
- Info cards row — Salary Est., Location, Job Type, Date Found
- AI Match Reasoning section — match reason paragraph from Gemini 3.5 Flash
- Required Skills vs Your Profile — matched skills as green badges, missing skills as red/orange badges
- Job Description section — description content from Adzuna
- Company Research card — empty state with Research Company button. After research: structured dossier with company overview, tech stack, culture, why this role, interview prep
- Apply Now button (links to redirect_url, opens in new tab)
- Job status badge and lifecycle actions from Feature 12

---

# Feature 14 — Company Research Agent (Updated)

Agent researches the company using Gemini 2.5 Flash Google Search grounding and URL Context, then builds a structured dossier with Gemini 3.5 Flash. No Browserbase, Stagehand, Playwright, or Puppeteer is used. Three data sources are fused together: company website content, job description from DB, user profile from DB.

**Logic:**

- POST /api/agent/research receives jobId
- Load job data from DB — extract company_name, job description, matched_skills, missing_skills
- Load user profile from DB — skills, experience, work history
- If jobs.company_research already exists — return it immediately, do not spend another Gemini call
- Derive a likely employer URL by following the Adzuna redirect with server-side fetch() — no browser needed for this step:
  - fetch(redirect_url, { redirect: "follow" }) follows HTTP redirects natively before Gemini research runs
  - Use response.url as the real employer job page URL
  - Strip subdomain from response.url hostname (e.g. jobs.stripe.com → stripe.com)
  - Construct homepage URL as https://{rootDomain}
  - If response.url still contains "adzuna.com" or fetch throws — leave employerJobUrl null and let Gemini Search discover the site
- Run Gemini web research call:
  - Model: gemini-2.5-flash
  - Reason: Google Search grounding is free on 2.5 Flash up to the documented daily limit
  - Tools: googleSearch and urlContext
  - Inputs: company name, job title, employerJobUrl if available, derived homepage URL if available, job description snippet
  - Ask for official website only, max 4 URLs, concise notes, and source URLs
  - Do not request structured JSON in this web-tools call; optimize it for retrieval and citation metadata
- Run Gemini structured synthesis call:
  - Model: gemini-3.5-flash
  - Tools: none
  - responseFormat: application/json with dossier schema
  - Temperature: 0.4
  - Inputs: research notes, source URLs, job data from DB, profile data from DB
  - Validate parsed JSON with Zod before saving
- If web research returns no useful content — still run structured synthesis with job description and profile only
- Save complete dossier to jobs.company_research jsonb column
- Always return a dossier — never fail silently

**Gemini web research call:**

```typescript
const researchResponse = await gemini.models.generateContent({
  model: GEMINI_RESEARCH_MODEL,
  contents: `
Research the official public web presence for:
Company: ${job.company}
Role: ${job.title}
Known employer job URL: ${employerJobUrl ?? "none"}
Likely homepage: ${derivedHomepageUrl ?? "none"}

Find the official homepage and up to 3 useful pages for a job candidate:
About, Careers, Blog, Engineering, Product, Team, or Press.

Return concise notes covering what the company does, product, customers or market,
tech signals, culture or values, and a source URL list. Do not use unofficial sites
unless no official site is available, and clearly mark any inferred claims.
`,
  config: {
    tools: [{ googleSearch: {} }, { urlContext: {} }],
  },
});
```

**Gemini structured synthesis call:**

```text
You are a sharp career strategist preparing a candidate to apply for a specific role.
You are given (a) research collected from the company's own website, (b) the job posting,
and (c) the candidate's profile. Produce a concise, concrete briefing that gives this
specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent
  funding, customers, headcount, or facts. If research was thin, infer carefully from
  the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this
  company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly
  and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind
  of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON.
```

User prompt feeds three data sources:

```
COMPANY RESEARCH (from Gemini Search + URL Context): {companyResearch}
JOB POSTING: title, company, description, matched_skills, missing_skills
CANDIDATE PROFILE: current_title, years_experience, experience_level, skills, work_experience
```

Temperature: 0.4

**Dossier shape saved to jobs.company_research jsonb:**

```json
{
  "companyOverview": "string",
  "techStack": ["string"],
  "culture": ["string"],
  "whyThisRole": "string",
  "yourEdge": ["string"],
  "gapsToAddress": ["string"],
  "smartQuestions": ["string"],
  "interviewPrep": ["string"],
  "sources": ["string"]
}
```

**Free-tier guardrails:**

- At most 1 Gemini web research call per user click
- At most 1 Gemini structured synthesis call per user click
- At most 4 public URLs considered per research run
- Never loop over search results with additional Gemini calls
- Cache final dossier in jobs.company_research and reuse it

**Browser-agent fallback policy:**

Phase 1 does not use browser automation. This is safe because the rest of the app only depends on the final `jobs.company_research` dossier schema, not on how the research was gathered.

Only add a Playwright + Gemini browser worker if real usage proves Gemini Search + URL Context is not enough:

- Too many normal company sites return thin or missing research
- Source links are missing or not useful for verification
- Public company content requires JavaScript interactions before it can be read
- Product scope expands to visual inspection, live browser sessions, form filling, or auto-apply

If fallback is needed, keep it as Feature 14B:

- Add a separate worker/service, not a long-running Next.js route handler
- Worker launches Playwright Chromium locally or in self-hosted infrastructure
- Gemini guides navigation, page extraction, and screenshot interpretation as needed
- Worker still saves the same 9-field `jobs.company_research` shape
- Only move to Browserless, Steel, or Hyperbrowser after local Playwright proves operationally insufficient

**PostHog event:** `company_researched` — { userId, jobId, company }

---

## Job Details UI — Company Research Card (Updated)

The Company Research card on the job details page must render all 9 fields:

- **Company Overview** — paragraph
- **Tech Stack** — tag list
- **Culture** — bullet list
- **Why This Role** — paragraph
- **Your Edge** — bullet list (highlight — specific to this candidate)
- **Gaps to Address** — bullet list (reframed as strategy, not weaknesses)
- **Smart Questions** — bullet list (questions to ask in interview)
- **Interview Prep** — bullet list
- **Sources** — small text, links to pages researched

## Phase 5 — Dashboard

### 15 Dashboard Page — Full UI

Build the complete dashboard UI with mock data.
**UI:**

- Four stat cards: Active Jobs Found, Avg. Match Rate, Companies Researched, Jobs This Week — all showing mock numbers with trend indicators
- Recent Activity card — list of 5 activity entries with colored dots and timestamps
- Resume Tailoring Activity — bar chart (mock data, days of week)
- Jobs Found Over Time — line chart (mock data, days of week)
- Match Score Distribution — bar chart (mock data, score ranges 50-60%, 60-70%, 70-80%, 80-90%, 90-100%)
- Incomplete profile banner at top if profile not complete

---

### 16 Stats Bar — Real Data

Wire four stat cards to real InsForge DB data for current user.

**Logic:**

- Active Jobs Found — COUNT of jobs where user_id = current user and status = active
- Avg. Match Rate — AVG of match_score across active jobs for current user
- Companies Researched — COUNT of jobs where company_research IS NOT NULL and user_id = current user
- Jobs This Week — COUNT of active jobs found or refreshed in last 7 days
- Historical totals can be added as secondary context, but primary opportunity metrics should not count unavailable, archived, rejected, or completed rows

---

### 17 Recent Activity — Real Data

Wire recent activity list to real InsForge DB data for current user.

**Logic:**

- Query agent_runs table — most recent runs for current user
- Query jobs table — most recent company research entries for current user
- Query recent lifecycle changes when available through agent_logs or status timestamps
- Merge and sort all by created_at descending — take last 5-10 entries
- Format each into human readable string:
  - agent_run completed → "Found X jobs for [jobTitle] — [time ago]"
  - company_research populated → "Researched [company] — [time ago]"
  - job status changed → "Marked [company] [status] — [time ago]"
- Color coded dot per entry type — info blue, success green

---

### 18 Analytics Charts — PostHog Data

Wire three dashboard charts to real PostHog event data for current user.

**Logic:**

- Jobs Found Over Time — query PostHog for job_found events where distinctId = current userId, last 30 days, group by day
- Match Score Distribution — query PostHog for job_found events, extract matchScore property, group into ranges: 50-60, 60-70, 70-80, 80-90, 90-100
- Company Research Activity — query PostHog for company_researched events where distinctId = current userId, last 7 days, group by day
- Lifecycle Activity — query PostHog for job_status_changed / job_unavailable_detected when adding pipeline health views
- All three charts rendered with recharts
- Empty state shown for each chart when no data exists yet

---

## Feature Count

| Phase                 | Features |
| --------------------- | -------- |
| Phase 1 — Foundation  | 4        |
| Phase 2 — Profile     | 4        |
| Phase 3 — Find Jobs   | 4        |
| Phase 4 — Job Details | 2        |
| Phase 5 — Dashboard   | 4        |
| **Total**             | **18**   |
