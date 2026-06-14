# Architecture

## Stack

| Layer                          | Tool                     | Purpose                                          |
| ------------------------------ | ------------------------ | ------------------------------------------------ |
| Framework                      | Next.js 16 (App Router)  | Full stack framework                             |
| Auth + DB + Storage + Realtime | InsForge                 | Entire backend                                   |
| Env management                 | Varlock                  | Schema, validation, and safe loading for `.env`  |
| Agent job runtime              | Inngest                  | Durable background workflows for long-running agent work |
| Web research                   | Gemini 2.5 URL Context   | Reads public company pages and retrieved URLs     |
| Web discovery                  | Gemini 2.5 Google Search | Finds official company pages with free grounding  |
| Job Discovery                  | Adzuna API               | Job search and discovery                         |
| AI model                       | Gemini 3.5 Flash         | Matching, research synthesis, extraction         |
| Analytics                      | PostHog                  | Event tracking and dashboard charts              |
| PDF-to-Markdown extraction     | MarkItDown               | Preferred resume PDF text conversion for LLM input |
| PDF generation                 | @react-pdf/renderer      | Resume PDF rendering                             |
| Styling                        | Tailwind CSS + shadcn/ui | UI components and styling                        |
| Language                       | TypeScript strict        | Throughout                                       |

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── app/
│   ├── layout.tsx                          → Root layout, PostHog provider
│   ├── page.tsx                            → Homepage
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                   → Login page
│   │   └── callback/
│   │       └── page.tsx                   → OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx                       → Main dashboard
│   ├── profile/
│   │   └── page.tsx                       → Profile form + resume management
│   ├── find-jobs/
│   │   ├── page.tsx                       → Find Jobs page — search controls + jobs list
│   │   └── [id]/
│   │       └── page.tsx                   → Individual job details page
│   └── api/
│       ├── agent/
│       │   ├── find/route.ts              → Trigger Adzuna job discovery
│       │   └── research/route.ts          → Trigger company research agent
│       ├── resume/
│       │   ├── generate/route.ts          → Generate base resume PDF from profile
│       │   └── extract/route.ts           → Extract profile data from uploaded resume PDF
├── agent/
│   ├── adzuna.ts                          → Adzuna API job discovery + Gemini scoring
│   ├── research.ts                        → Company research — Gemini Search + URL Context + synthesis
│   ├── matcher.ts                         → Gemini job matching logic
│   ├── extractor.ts                       → Gemini job description extraction + structuring
│   └── types.ts                           → Agent-specific TypeScript types
├── inngest/
│   ├── client.ts                          → Inngest client instance
│   └── functions/
│       ├── companyResearch.ts             → Company research background workflow
│       ├── jobDiscovery.ts                → Job discovery background workflow
│       ├── resumeExtraction.ts            → Resume extraction background workflow
│       └── resumeGeneration.ts            → Resume generation background workflow
├── actions/
│   ├── profile.ts                         → Profile save + update
│   └── jobs.ts                            → Job status updates
├── components/
│   ├── ui/                                → shadcn/ui components only
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── homepage/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Features.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── RecentActivity.tsx
│   │   └── AnalyticsCharts.tsx
│   ├── profile/
│   │   ├── ProfileForm.tsx
│   │   ├── ResumeUpload.tsx
│   │   ├── ResumePreview.tsx
│   │   └── CompletionIndicator.tsx
│   ├── find-jobs/
│   │   ├── SearchControls.tsx
│   │   ├── JobsTable.tsx
│   │   ├── JobFilters.tsx
│   │   └── JobsPagination.tsx
│   └── job-details/
│       ├── JobInfo.tsx
│       ├── MatchScore.tsx
│       ├── JobDescription.tsx
│       ├── CompanyResearch.tsx
│       └── JobActions.tsx
├── lib/
│   ├── insforge-client.ts                 → InsForge browser client instance
│   ├── insforge-server.ts                 → InsForge server client
│   ├── insforge-admin.ts                  → Server-only admin client for background workflows
│   ├── gemini.ts                          → Gemini API client + structured output helpers
│   ├── adzuna.ts                          → Adzuna API client
│   ├── posthog-client.ts                  → PostHog browser client
│   ├── posthog-server.ts                  → PostHog server client
│   └── utils.ts                           → Shared utility functions
└── types/
    └── index.ts                           → Global TypeScript types
```

---

## System Boundaries

| Folder        | Owns                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `app/`        | Pages and API routes only. No business logic.                                                          |
| `agent/`      | All agent logic. Adzuna discovery, company research, matching, extraction. Nothing here touches React. |
| `inngest/`    | Durable workflow definitions only. Calls agent logic and writes durable app state through InsForge.     |
| `actions/`    | Server Actions for UI-triggered mutations only. Profile save, profile update.                          |
| `components/` | UI only. No data fetching logic. No direct DB calls.                                                   |
| `lib/`        | Third party client initialisation and shared utilities only.                                           |
| `types/`      | TypeScript types shared across the project.                                                            |

---

## Data Flow

### UI Mutations (Server Actions)

```
User interaction in component
        ↓
Server Action in actions/
        ↓
InsForge DB write
        ↓
Revalidate or redirect
```

### Job Discovery (API Route + Inngest)

```
User clicks Find Jobs
        ↓
API route in app/api/agent/find
        ↓
Validates auth/profile, creates agent_runs row, sends job-discovery.requested event
        ↓
Inngest function calls agent/adzuna.ts
        ↓
Adzuna API returns job listings
        ↓
Gemini 3.5 Flash scores each job against user profile
        ↓
Agent writes results to InsForge DB
        ↓
Search controls poll agent_runs status and refresh the existing list
```

### Company Research (API Routes)

```
User clicks Research Company on job details page
        ↓
API route in app/api/agent/research
        ↓
Validates auth/job ownership, marks jobs.company_research_status = running
        ↓
Sends company-research.requested event to Inngest
        ↓
Inngest function calls agent/research.ts
        ↓
Gemini 2.5 Flash Google Search grounding discovers official company pages
        ↓
Gemini 2.5 Flash URL Context reads homepage + max 3 public pages
        ↓
Gemini 3.5 Flash synthesizes dossier from retrieved content
        ↓
Dossier and research metadata saved to jobs.company_research / jobs.company_researched_at
        ↓
Page data revalidated
```

Long-running agent operations use this event-driven pattern. Inngest owns durable execution, retries, step observability, and queue controls. InsForge remains the durable product database and source of truth for user-visible status.

### Job Lifecycle Updates (Server Actions + Agent Checks)

```text
User marks a job applied / archived / completed
        ↓
Server Action in actions/jobs.ts
        ↓
Update jobs.status and matching timestamp fields
        ↓
Revalidate /find-jobs and /find-jobs/[id]
```

```text
New Adzuna search or explicit availability refresh
        ↓
Agent/API checks whether the external listing is still present or reachable
        ↓
Existing matching job rows are updated instead of duplicated
        ↓
Closed, expired, removed, or unreachable listings are marked unavailable
```

### Resume Extraction (API Route + Inngest)

```text
User clicks Extract from Resume
        ↓
API route in app/api/resume/extract
        ↓
Validates auth/profile/resume, creates a typed agent_runs row, sends resume-extraction.requested
        ↓
Inngest downloads the private resume from InsForge Storage
        ↓
MarkItDown converts uploaded PDF to Markdown when available; pdf-parse is the fallback
        ↓
Gemini 3.5 Flash extracts profile fields, with retry and Gemini Flash-Lite fallback for transient provider pressure
        ↓
Structured fields are saved to agent_runs.result
        ↓
Profile UI polls /api/resume/runs and populates draft form fields for manual review
```

Resume extraction remains review-first. The worker never writes extracted fields to `profiles`; the user must review and click Save Profile.

### Resume Generation (API Route + Inngest)

```text
User clicks Generate Resume from Profile
        ↓
API route in app/api/resume/generate
        ↓
Validates auth/profile, creates a typed agent_runs row, sends resume-generation.requested
        ↓
Inngest loads saved profile data
        ↓
Gemini 3.5 Flash generates resume content
        ↓
@react-pdf/renderer renders PDF buffer
        ↓
New PDF uploaded to InsForge Storage
        ↓
URL saved to profiles table
        ↓
Resume metadata is saved to agent_runs.result
        ↓
Profile UI polls /api/resume/runs and updates the active resume card
```

---

## InsForge Database Schema

### `profiles`

| Column              | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | uuid        | References auth.users                        |
| full_name           | text        |                                              |
| email               | text        | Pre-filled from auth                         |
| phone               | text        |                                              |
| location            | text        | City, country                                |
| current_title       | text        | Most recent job title                        |
| experience_level    | text        | junior / mid / senior / lead                 |
| years_experience    | integer     |                                              |
| skills              | text[]      | Array of skill tags                          |
| industries          | text[]      | Industries worked in                         |
| work_experience     | jsonb       | Array of up to 3 roles                       |
| education           | jsonb       | Degree, field, institution, year             |
| job_titles_seeking  | text[]      | Roles they want                              |
| remote_preference   | text        | remote / onsite / hybrid / any               |
| preferred_locations | text[]      | Optional preferred locations                 |
| salary_expectation  | text        | Optional                                     |
| cover_letter_tone   | text        | Optional: formal / casual / enthusiastic     |
| linkedin_url        | text        |                                              |
| portfolio_url       | text        |                                              |
| work_authorization  | text        | citizen / permanent_resident / visa_required |
| resume_pdf_url      | text        | InsForge Storage URL of current resume       |
| resume_pdf_key      | text        | InsForge Storage key/path of current resume  |
| is_complete         | boolean     | True when all required fields filled         |
| created_at          | timestamptz |                                              |
| updated_at          | timestamptz |                                              |

### `agent_runs`

| Column             | Type        | Notes                        |
| ------------------ | ----------- | ---------------------------- |
| id                 | uuid        |                              |
| user_id            | uuid        | References profiles          |
| status             | text        | running / completed / failed |
| run_type           | text        | job_discovery / company_research / availability_check / resume_extraction / resume_generation |
| job_title_searched | text        |                              |
| location_searched  | text        |                              |
| jobs_found         | integer     | Total jobs discovered        |
| result             | jsonb       | Durable result payload for background flows such as resume draft fields or generated resume metadata |
| error_message      | text        | Human-readable terminal failure message |
| started_at         | timestamptz |                              |
| completed_at       | timestamptz |                              |

### `jobs`

| Column             | Type        | Notes                                          |
| ------------------ | ----------- | ---------------------------------------------- |
| id                 | uuid        |                                                |
| run_id             | uuid        | References agent_runs — null if from URL input |
| user_id            | uuid        | References profiles                            |
| source             | text        | search / url                                   |
| source_job_id      | text        | Stable provider listing ID when available      |
| source_url         | text        | Original job listing URL                       |
| external_apply_url | text        | Direct company apply URL                       |
| title              | text        |                                                |
| company            | text        |                                                |
| location           | text        |                                                |
| salary             | text        | If available                                   |
| job_type           | text        | fulltime / parttime / contract                 |
| about_role         | text        | 2-3 sentence summary                           |
| responsibilities   | text[]      | Bullet points                                  |
| requirements       | text[]      | Bullet points                                  |
| nice_to_have       | text[]      | Optional                                       |
| benefits           | text[]      | Optional                                       |
| about_company      | text        | Brief company description                      |
| match_score        | integer     | 0-100 scored against main profile              |
| match_reason       | text        | Gemini explanation                             |
| matched_skills     | text[]      | Skills user has that match                     |
| missing_skills     | text[]      | Skills user lacks                              |
| company_research   | jsonb       | Company dossier from research agent            |
| company_research_status | text   | idle / running / completed / failed            |
| company_research_error | text    | Human-readable failure summary for retry UI     |
| company_research_started_at | timestamptz | When the current research attempt started; used to recover stale running states |
| company_researched_at | timestamptz | When dossier generation completed          |
| company_research_run_id | text   | Inngest run/event handle for observability      |
| status             | text        | active / unavailable / archived / applied / rejected / completed |
| status_reason      | text        | Human-readable reason for latest status change |
| found_at           | timestamptz |                                                |
| last_seen_at       | timestamptz | Last time discovery confirmed the listing      |
| availability_checked_at | timestamptz | Last time availability was checked         |
| unavailable_at     | timestamptz | Set when listing is marked unavailable         |
| archived_at        | timestamptz | Set when user archives the job                 |
| applied_at         | timestamptz | Set when user marks the job applied            |
| completed_at       | timestamptz | Set when user marks the job completed          |

Job lifecycle rules:

- `active` is the default status for newly discovered or refreshed listings.
- Default Find Jobs and Dashboard opportunity metrics exclude `unavailable`, `archived`, `applied`, `rejected`, and `completed` unless a view explicitly asks for them.
- `applied` remains part of the user's pipeline history and may appear in applied/completed filters, but it is not counted as a new active search result or active opportunity.
- Discovery uses `source_job_id` when available, falling back to normalized `source_url` / `external_apply_url`, to upsert existing listings for the same user instead of duplicating rows across search runs.
- A refreshed existing listing should update `run_id`, `found_at`, `last_seen_at`, matching fields, and changed listing metadata while preserving user-owned lifecycle state unless the row was `unavailable` and the listing is now confirmed available again.
- Normal cleanup is soft state transition, not hard delete.

Company research rules:

- `company_research_status` starts as `idle`.
- Research requests set status to `running`, set `company_research_started_at`, clear `company_research_error`, and store the Inngest run handle when available.
- Successful dossier generation sets `company_research`, `company_research_status = 'completed'`, `company_researched_at = now()`, and clears `company_research_error`.
- Final synthesis/save failures set `company_research_status = 'failed'` and a human-readable `company_research_error`, but do not cache a partial dossier.
- Research status polling uses the InsForge-backed status endpoint instead of full-page refreshes. A `running` research older than the stale threshold is marked failed with a retryable message.
- Web retrieval failures alone do not fail research. Synthesis still runs from job + profile data and may complete with thin or empty sources.

### `agent_logs`

| Column     | Type        | Notes                            |
| ---------- | ----------- | -------------------------------- |
| id         | uuid        |                                  |
| run_id     | uuid        | References agent_runs            |
| user_id    | uuid        | References profiles              |
| message    | text        | Human readable log entry         |
| level      | text        | info / success / warning / error |
| job_id     | uuid        | Optional — related job           |
| created_at | timestamptz |                                  |

---

## InsForge Storage

| Bucket  | Path                         | Contents                  |
| ------- | ---------------------------- | ------------------------- |
| resumes | resumes/{user_id}/resume.pdf | Current active resume PDF |

Access: authenticated users only, own files only.

---

## Authentication

- Provider: InsForge Auth
- Methods: Google OAuth, GitHub OAuth
- Protected routes: /dashboard, /profile, /find-jobs, /find-jobs/[id]
- Public routes: /, /login
- Middleware in middleware.ts checks session on every protected route
- On login → redirect to /dashboard

---

## InsForge Client Pattern

Two separate InsForge instances — never mix them:

```typescript
// lib/insforge-client.ts
// Browser-side — used in client components for auth state
import { createBrowserClient } from "@insforge/sdk/ssr";
export const insforge = createBrowserClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
);

// lib/insforge-server.ts
// Server-side — used in API routes, Server Actions, agent code
import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

export const createInsforgeServer = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_INSFORGE_URL!,
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
};
```

---

## Gemini Client Pattern

```typescript
// lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const GEMINI_TEXT_MODEL = "gemini-3.5-flash";
export const GEMINI_RESEARCH_MODEL = "gemini-2.5-flash";
export const GEMINI_FAST_MODEL = "gemini-3.1-flash-lite";
```

Use `gemini-3.5-flash` by default for matching, extraction, resume generation, and dossier synthesis because it is the newer free-tier text model. Use `gemini-2.5-flash` only for the company web research call because Google Search grounding is free on 2.5 Flash up to the documented daily limit. Use `gemini-3.1-flash-lite` only for low-risk high-volume text calls if rate limits become tight.

Resume extraction, resume generation, job matching, and company research synthesis retry transient Gemini failures before falling back from `GEMINI_TEXT_MODEL` to `GEMINI_FAST_MODEL`. Temporary provider failures return retryable user-facing errors instead of being treated as invalid content.

## Resume Text Extraction Pattern

Uploaded resume PDFs are converted to LLM input in `agent/resumeText.ts`. MarkItDown is preferred because it emits Markdown intended for LLM and text-analysis pipelines, preserving useful document structure while often reducing prompt noise. It runs the local MarkItDown CLI/module against a server-created temporary PDF file only. The original upload path is never passed through from user input.

If MarkItDown is unavailable, times out, or returns too little text, JobPilot falls back to `pdf-parse` with an explicit pdf.js worker file URL. This keeps extraction usable in local or deployment environments that have not installed Python dependencies yet.

Runtime requirements:

- Node route runtime only — PDF conversion uses `Buffer`, temp files, and child processes
- Python 3.10+ for MarkItDown
- Install Python dependencies from `requirements.txt`
- Keep temp-file cleanup in `finally`
- Treat MarkItDown MCP as an agent convenience if installed, not an application runtime dependency

---

## Job Discovery Pattern

**Adzuna API — job search**

```typescript
const response = await fetch(
  `https://api.adzuna.com/v1/api/jobs/us/search/1?` +
    `app_id=${process.env.ADZUNA_APP_ID}&` +
    `app_key=${process.env.ADZUNA_APP_KEY}&` +
    `what=${encodeURIComponent(jobTitle)}&` +
    `where=${encodeURIComponent(location)}&` +
    `category=it-jobs&` +
    `results_per_page=10&` +
    `content-type=application/json`,
);
const data = await response.json();
// data.results — array of job listings
// Each job: title, company.display_name, location.display_name,
//           salary_min, salary_max, description, redirect_url, created
```

---

## Company Research Pattern

No browser automation is used for company research. The agent relies on Gemini's hosted web tools and structured synthesis.

```typescript
// Step 1 — resolve the employer job URL from Adzuna when possible
const response = await fetch(job.source_url, { redirect: "follow" });
const employerJobUrl = response.url.includes("adzuna.com")
  ? null
  : response.url;

// Step 2 — discover and read public pages
const researchResponse = await gemini.models.generateContent({
  model: GEMINI_RESEARCH_MODEL,
  contents: `
Research ${job.company} for a candidate applying to ${job.title}.
Prefer the official website. Use this known job URL if valid: ${employerJobUrl ?? "none"}.
Find the company homepage and up to 3 useful public pages: About, Careers, Blog, Engineering, Product, or Team.
Return concise notes and a source URL list.
`,
  config: {
    tools: [{ googleSearch: {} }, { urlContext: {} }],
  },
});

// Step 3 — synthesize structured JSON without tools
const dossierResponse = await gemini.models.generateContent({
  model: GEMINI_TEXT_MODEL,
  contents: buildCompanyDossierPrompt({
    researchText: researchResponse.text,
    job,
    profile,
  }),
  config: {
    temperature: 0.4,
    responseMimeType: "application/json",
    responseJsonSchema: companyResearchJsonSchema,
  },
});
```

Always split web research and structured JSON synthesis into separate Gemini calls. The web-tools call is optimized for retrieval and citations. The synthesis call is optimized for schema adherence and app-side validation.

---

## Browser-Agent Escape Hatch

Gemini Search + URL Context is the Phase 1 implementation for company research. It should not break the original product intent because the UI and DB contract remain unchanged: every successful run saves the same `jobs.company_research` dossier shape with source URLs.

Only introduce a browser-agent fallback if Phase 1 fails real usage in one of these ways:

- Research is too thin for a meaningful percentage of normal company sites
- Source URLs are missing or unreliable often enough that users cannot verify claims
- Company sites require JavaScript interaction before public content is visible
- Future scope adds visual inspection, live browsing, form filling, or auto-apply behavior

Fallback architecture:

```
API route receives research request
        ↓
Queue or call a separate browser worker
        ↓
Worker launches Playwright Chromium
        ↓
Gemini guides navigation/extraction from page text or screenshots
        ↓
Gemini 3.5 Flash synthesizes the same dossier schema
        ↓
Worker saves jobs.company_research
```

Keep browser work out of long-running Next.js route handlers. Start with local/self-hosted Playwright + Gemini if escalation is needed. Use a managed browser provider such as Browserless, Steel, or Hyperbrowser only when local browser operations become too fragile or expensive to maintain.

---

## Invariants

Rules the AI agent must never violate:

- API routes contain no UI logic. Components contain no DB logic.
- Agent code in `/agent` never imports from `/components` or `/actions`.
- Server Actions never call agent functions. Agent functions are only called from API routes.
- Authenticated request/response writes use `createInsforgeServer()` — never the browser client.
- Background workflows that do not have request cookies use `createInsforgeAdmin()` and must explicitly filter every query/update by `user_id`.
- No hardcoded hex values or raw Tailwind color classes in components — use CSS variables from ui-tokens.md.
- Gemini web research failures are caught and logged to agent_logs, never thrown to crash the run.
- Company research always returns a dossier — even if web research fails, Gemini 3.5 Flash synthesizes from company name, job description, and profile alone. Never return empty.
- Company research runs as an Inngest background workflow. Route handlers may enqueue work, but must not perform the long-running Gemini workflow inline.
- Job discovery runs as an Inngest background workflow. Route handlers may validate input, create an `agent_runs` row, enqueue work, and expose run status, but must not perform the long-running Adzuna/Gemini workflow inline.
- Do not add Browserbase, Stagehand, Playwright, or Puppeteer for Phase 1 company research. Only add a browser worker after the Browser-Agent Escape Hatch criteria are met.
- Always scope InsForge queries to the current user_id — never query without a user filter.
- Adzuna API always includes category=it-jobs — never search without this filter.
- jobs.source is always 'search' or 'url' — never any other value.
- Jobs are a persistent user pipeline. Do not hard-delete or overwrite lifecycle history during discovery; upsert refreshed listings and use status transitions for stale, closed, archived, applied, rejected, and completed rows.
- Default user-facing job lists should show active opportunities first and hide unavailable/completed rows unless the user explicitly filters for them.
