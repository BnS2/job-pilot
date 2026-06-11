# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to JobPilot.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## Varlock

**Check first:** Use the official Varlock docs before installing or changing integration code. Varlock is the project standard for `.env` schema, validation, and safe secret loading.

### Project Convention

```text
.env.schema  → committed Varlock schema and documentation, no plaintext secrets
.env         → local development values, gitignored
```

**Rules:**

- `.env.schema` is the only env file AI agents should inspect for variable context.
- `.env` may exist locally, but agents must not print, summarize, copy, or commit its values.
- Use `.env` consistently for JobPilot local values. Do not add new variables to `.env.local`.
- Add or change environment variables in `.env.schema` before touching application code.
- Mark secrets such as `GEMINI_API_KEY`, `ADZUNA_APP_KEY`, and future server-only provider tokens as sensitive.
- Keep public browser variables limited to the `NEXT_PUBLIC_` variables intentionally exposed by Next.js.
- Use `varlock load` to validate the schema and local values.
- Use `varlock run -- <command>` for commands that need env injection, including `next dev`, `next build`, scripts, migrations, and one-off agent tooling.

### Next.js Pattern

JobPilot should continue using `process.env` in app code unless a later implementation intentionally adopts Varlock-generated types.

```typescript
const apiKey = process.env.GEMINI_API_KEY!;
```

Once Varlock is installed, package scripts should wrap the underlying command instead of relying on Next.js to read raw `.env` files directly:

```json
{
  "scripts": {
    "dev": "varlock run -- next dev",
    "build": "varlock run -- next build",
    "start": "varlock run -- next start",
    "lint": "varlock run -- eslint"
  }
}
```

Do not add a dotenv package for this project. Varlock is the environment loading and validation layer.

---

## InsForge

**Check first:** Check AGENTS.md for an installed InsForge skill. If an InsForge MCP server is configured — use it. The skill/MCP will have the latest API patterns.

### Client vs Server

Two separate instances — never mix them:

```typescript
// lib/insforge-client.ts — browser context only
import { createBrowserClient } from "@insforge/sdk/ssr";

export const insforge = createBrowserClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
);
```

```typescript
// lib/insforge-server.ts — server context only
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

**Rules:**

- Browser client — Client Components, browser-side auth state, realtime subscriptions
- Server client — Server Components, API routes, Server Actions, agent functions
- Never use browser client in server context
- Never use server client in browser context

---

### Auth

```typescript
// Get current user in server context
const insforge = await createInsforgeServer();
const {
  data: { user },
  error,
} = await insforge.auth.getUser();
if (!user) redirect("/login");
```

---

### DB Queries

```typescript
// Read
const { data, error } = await insforge
  .from("jobs")
  .select("*")
  .eq("user_id", user.id)
  .order("found_at", { ascending: false });

// Insert
const { data, error } = await insforge
  .from("jobs")
  .insert({ user_id: user.id, title, company, match_score })
  .select()
  .single();

// Update
const { error } = await insforge
  .from("jobs")
  .update({ company_research: dossier })
  .eq("id", jobId)
  .eq("user_id", user.id); // always scope to user
```

**Rules:**

- Always scope queries to `user_id` — never query without user filter
- Always handle the `error` return — never assume success
- Use `.single()` when expecting exactly one row

---

### Storage

```typescript
// Upload file
const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
const { data, error } = await insforge.storage
  .from("resumes")
  .upload(`${userId}/resume.pdf`, pdfBlob);

// Save both returned values. The SDK may auto-rename on key conflicts.
const resumePdfUrl = data.url;
const resumePdfKey = data.key;
```

**Storage paths:**

- Base resume: `resumes/{user_id}/resume.pdf`

**Rules:**

- The current TypeScript SDK upload signature is `.upload(path, file)` and does not accept an upsert option
- When replacing the active resume from server code, upload the replacement first, save the returned metadata, then remove the previous `resume_pdf_key` only after the new resume is active
- Always save both the returned `url` and `key` back to the DB after upload because storage may auto-rename if a key conflict remains
- The `resumes` bucket is private; open resumes through `/api/profile/resume`, which verifies the current user and downloads by `resume_pdf_key`
- Never write files to disk — always upload buffer directly to storage

---

## Adzuna API

**Check first:** Check AGENTS.md for an installed Adzuna skill. If none exists — use this file and the official Adzuna API docs.

### Job Search

```typescript
// lib/adzuna.ts
export async function searchJobs(
  jobTitle: string,
  location: string,
  country: string = "us",
): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    what: jobTitle,
    category: "it-jobs", // always filter to IT jobs
    results_per_page: "10",
    "content-type": "application/json",
  });

  // Only add where if location is provided
  if (location) {
    params.set("where", location);
  }

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
```

### Response Shape

Each Adzuna job result contains:

```typescript
type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string; // snippet only — not full description
  redirect_url: string; // Adzuna tracking URL → redirects to actual job
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted: "0" | "1"; // "1" means salary is estimated
  contract_type?: string;
  created: string; // ISO date string
  category: { tag: string; label: string };
};
```

### Saving Jobs to DB

```typescript
// Map Adzuna result to jobs table
const jobRecord = {
  user_id: userId,
  run_id: runId,
  source: "search", // always 'search' for Adzuna jobs
  source_url: job.redirect_url,
  external_apply_url: job.redirect_url,
  title: job.title,
  company: job.company.display_name,
  location: job.location.display_name,
  salary: job.salary_min
    ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max! / 1000)}k`
    : null,
  job_type: job.contract_type || "fulltime",
  about_role: job.description, // Adzuna returns snippet — used as description
  match_score: scoredJob.matchScore,
  match_reason: scoredJob.matchReason,
  matched_skills: scoredJob.matchedSkills,
  missing_skills: scoredJob.missingSkills,
  found_at: new Date().toISOString(),
};
```

**Rules:**

- Always include `category=it-jobs` — never search Adzuna without this filter
- Never pass `where` if location is empty — omit the parameter entirely
- `source` is always `'search'` for Adzuna jobs — never any other value
- `salary_is_predicted: "1"` means Adzuna estimated the salary — this is normal
- Adzuna description is a snippet — Gemini scores from it, not a full description
- Default country to `'us'` — support `gb`, `au`, `ca` as alternatives

---

## Gemini API

**Check first:** Check current Gemini API docs before implementing Gemini calls. Model availability, free-tier limits, and structured output syntax change over time.

### Model Choice

Model constants for JobPilot:

```typescript
export const GEMINI_TEXT_MODEL = "gemini-3.5-flash";
export const GEMINI_RESEARCH_MODEL = "gemini-2.5-flash";
export const GEMINI_FAST_MODEL = "gemini-3.1-flash-lite";
```

Use `gemini-3.5-flash` for matching, profile extraction, resume generation, and company research synthesis because it is the newer free-tier text model. Use `gemini-2.5-flash` for the web research call because Google Search grounding is free on 2.5 Flash up to the documented daily limit. Use `gemini-3.1-flash-lite` only for low-risk high-volume text calls if rate limits become tight.

Do not use OpenAI models in this project.

### Client Setup

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

### Structured JSON Response

```typescript
import { z } from "zod";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/gemini";

const matchSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  matchReason: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

const matchJsonSchema = {
  type: "object",
  properties: {
    matchScore: { type: "integer", minimum: 0, maximum: 100 },
    matchReason: { type: "string" },
    matchedSkills: { type: "array", items: { type: "string" } },
    missingSkills: { type: "array", items: { type: "string" } },
  },
  required: ["matchScore", "matchReason", "matchedSkills", "missingSkills"],
  additionalProperties: false,
};

const response = await gemini.models.generateContent({
  model: GEMINI_TEXT_MODEL,
  contents: prompt,
  config: {
    temperature: 0.3,
    maxOutputTokens: 400,
    responseMimeType: "application/json",
    responseJsonSchema: matchJsonSchema,
  },
});

const result = matchSchema.parse(JSON.parse(response.text ?? "{}"));
```

**Temperature settings:**

- `0.2` — job matching and profile extraction
- `0.4` — company research synthesis
- `0.7` — resume generation

**Max output tokens:**

- Job matching + scoring: `400`
- Company research synthesis: `1000`
- Resume generation: `1200`
- Profile extraction from resume: `1000`

**Rules:**

- Model string is always `GEMINI_TEXT_MODEL`, `GEMINI_RESEARCH_MODEL`, or `GEMINI_FAST_MODEL` from `lib/gemini.ts`
- Always use structured output for data saved to DB
- Always validate parsed JSON with Zod before using it
- Always wrap Gemini calls in try/catch and log failures to agent_logs for agent operations
- For resume extraction and resume generation, retry transient Gemini errors and fall back from `GEMINI_TEXT_MODEL` to `GEMINI_FAST_MODEL` before returning a temporary-service error
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70
- Company research synthesis must always return a complete dossier — never return empty even if web research failed

---

## Gemini Company Research

Company research uses Gemini's hosted web tools instead of a cloud browser:

1. Resolve Adzuna redirect with server-side `fetch()`.
2. Use Gemini 2.5 Flash Google Search grounding + URL Context to discover and read official public pages.
3. Use a second Gemini 3.5 Flash structured-output call to synthesize the dossier.

Job description and user profile come from DB — never re-fetch what you already have.

### Web Research Call

```typescript
const researchResponse = await gemini.models.generateContent({
  model: GEMINI_RESEARCH_MODEL,
  contents: `
Research the official public web presence for this company and role.

Company: ${job.company}
Role: ${job.title}
Known employer job URL: ${employerJobUrl ?? "none"}
Likely homepage: ${derivedHomepageUrl ?? "none"}

Find the official homepage and up to 3 useful public pages:
About, Careers, Blog, Engineering, Product, Team, or Press.

Return concise notes and source URLs. Ground claims in retrieved pages.
If research is thin, say what is inferred from the job posting.
`,
  config: {
    tools: [{ googleSearch: {} }, { urlContext: {} }],
  },
});

const researchText = researchResponse.text ?? "";
const urlContextUrls =
  researchResponse.candidates?.[0]?.urlContextMetadata?.urlMetadata
    ?.filter((item) => item.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS")
    .map((item) => item.retrievedUrl) ?? [];

const groundedUrls =
  researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk) => chunk.web?.uri)
    .filter((url): url is string => Boolean(url)) ?? [];

const sourceUrls = Array.from(new Set([...urlContextUrls, ...groundedUrls]));
```

### Structured Dossier Synthesis

```typescript
const dossierSchema = z.object({
  companyOverview: z.string(),
  techStack: z.array(z.string()),
  culture: z.array(z.string()),
  whyThisRole: z.string(),
  yourEdge: z.array(z.string()),
  gapsToAddress: z.array(z.string()),
  smartQuestions: z.array(z.string()),
  interviewPrep: z.array(z.string()),
  sources: z.array(z.string()),
});

const response = await gemini.models.generateContent({
  model: GEMINI_TEXT_MODEL,
  contents: buildCompanyDossierPrompt({
    researchText,
    sourceUrls,
    job,
    profile,
  }),
  config: {
    temperature: 0.4,
    maxOutputTokens: 1000,
    responseMimeType: "application/json",
    responseJsonSchema: companyResearchJsonSchema,
  },
});

const dossier = dossierSchema.parse(JSON.parse(response.text ?? "{}"));
```

**Dossier fields:**

| Field           | Type     | Purpose                                             |
| --------------- | -------- | --------------------------------------------------- |
| companyOverview | string   | What the company does                               |
| techStack       | string[] | Technologies they use                               |
| culture         | string[] | Values and working style                            |
| whyThisRole     | string   | Why this role exists                                |
| yourEdge        | string[] | Specific links between THIS candidate and this role |
| gapsToAddress   | string[] | Missing skills reframed as strategy                 |
| smartQuestions  | string[] | Questions that show real research                   |
| interviewPrep   | string[] | Topics to prepare for this role                     |
| sources         | string[] | Pages the company info came from                    |

**Rules:**

- Never use Browserbase, Stagehand, Playwright, or Puppeteer for Phase 1 company research
- Do not parse raw HTML with regex; let Gemini URL Context handle public page content
- Keep web research and structured synthesis as separate Gemini calls
- Do not request structured JSON from the same call that uses `googleSearch` or `urlContext`
- Max 4 URLs per company research run
- At most 1 web research call and 1 synthesis call per user click
- Always cache the final dossier in jobs.company_research
- If web research returns empty — still run synthesis with job + profile only
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never skip them

### Browser-Agent Fallback

Treat Gemini Search + URL Context as Phase 1. It preserves the original Browserbase user experience because the user only sees the final dossier and source links.

If Phase 1 fails in real usage, add a browser worker instead of changing the Job Details UI or `jobs.company_research` schema:

```typescript
// Future fallback shape only — do not implement in Phase 1.
type BrowserResearchResult = {
  notes: string[];
  screenshots?: string[];
  sourceUrls: string[];
};
```

Fallback rules:

- Use a separate worker/service for browser sessions
- Start with local or self-hosted Playwright + Gemini
- Keep browser sessions out of long-running Next.js route handlers
- Save the same dossier fields after synthesis
- Consider Browserless, Steel, or Hyperbrowser only if local Playwright is too fragile or hard to scale
- Do not add this fallback until there is evidence that Gemini URL Context is not enough for the current public-company-research workflow

---

## PostHog

**Check first:** Check AGENTS.md for an installed PostHog skill. If a PostHog MCP server is configured — use it. The skill/MCP will have the latest client and server patterns.

### Client Setup (Browser)

```typescript
// lib/posthog-client.ts
import posthog from "posthog-js";

import type {
  PostHogEventName,
  PostHogEventProperties,
} from "@/lib/posthog-events";

export function capturePostHogEvent<EventName extends PostHogEventName>(
  event: EventName,
  properties: PostHogEventProperties[EventName],
): void {
  posthog.capture(event, properties);
}

// Capture event client-side
capturePostHogEvent("job_found", {
  userId,
  source: "search",
  matchScore: score,
});
```

### Server Setup

```typescript
// lib/posthog-server.ts
import { PostHog } from "posthog-node";

export const createPostHogServer = () =>
  new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    flushAt: 1, // send immediately
    flushInterval: 0, // no batching — Next.js functions are short-lived
  });

export async function capturePostHogServerEvent(
  distinctId,
  event,
  properties,
) {
  const posthog = createPostHogServer();

  try {
    posthog.capture({ distinctId, event, properties });
  } finally {
    await posthog.shutdown(); // required — ensures event is sent
  }
}

await capturePostHogServerEvent(userId, "company_researched", {
  userId,
  jobId,
  company,
});
```

**Rules:**

- Always call `await posthog.shutdown()` in server-side functions — events are lost without it
- Server-side PostHog failures must be logged and swallowed so analytics cannot block auth, page rendering, or agent work
- `flushAt: 1` and `flushInterval: 0` always set on server client
- Browser PostHog uses `/ingest` through the Next.js reverse proxy; `NEXT_PUBLIC_POSTHOG_HOST` remains the proxy destination source of truth in `next.config.ts`
- Keep `advanced_disable_feature_flags: true` in browser init until the product actually uses PostHog feature flags; this avoids extra `/flags` polling and stale endpoint warnings during auth/login work
- Keep browser `debug: false` by default. Use PostHog debug tools intentionally when diagnosing analytics, but do not leave noisy network retry logging enabled in normal local development
- Event names must match exactly the list in `code-standards.md`
- Use `capturePostHogEvent()` in Client Components and `capturePostHogServerEvent()` in server code instead of raw capture calls
- Always include `userId` as a property on every server-side event
- Call `posthog.identify(userId)` after login on client side
- Call `posthog.reset()` on logout on client side

---

## @react-pdf/renderer

**Check first:** Check AGENTS.md for an installed react-pdf skill. PDF generation APIs can differ from general training knowledge.

### Resume PDF Generation

```typescript
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  section: { marginBottom: 10 },
  heading: { fontSize: 14, fontWeight: 'bold' },
  text: { fontSize: 10 },
})

const ResumePDF = ({ profile }: { profile: Profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>{profile.fullName}</Text>
        <Text style={styles.text}>{profile.email}</Text>
      </View>
    </Page>
  </Document>
)

// Generate buffer
const buffer = await renderToBuffer(<ResumePDF profile={profile} />)

// Upload directly to InsForge Storage
await insforge.storage
  .from('resumes')
  .upload(`${userId}/resume.pdf`, buffer, {
    contentType: 'application/pdf',
    upsert: true
  })
```

**Supported CSS properties:**
Only use these — others are silently ignored:
`padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`

**Rules:**

- Server-side only — never import in client components
- Always use `renderToBuffer` — not `renderToStream` or `PDFDownloadLink`
- PDF generation only in `app/api/resume/` routes
- Generated buffer uploaded directly to InsForge Storage — never written to disk
- Always save public URL to DB after upload

---

## pdf-parse

**Check first:** Check AGENTS.md for an installed pdf-parse skill.

### Fallback Text Extraction from Uploaded Resume

```typescript
import path from "node:path";
import { pathToFileURL } from "node:url";

import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

const pdfWorkerUrl = pathToFileURL(
  path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;

PDFParse.setWorker(pdfWorkerUrl);

// In API route handling resume upload
export async function POST(req: NextRequest) {
  let parser: PDFParse | null = null;
  const formData = await req.formData();
  const file = formData.get("resume") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const extractedText = pdfData.text; // raw text content

    // Send to Gemini for structured extraction
  } finally {
    await parser?.destroy();
  }
}
```

**Rules:**

- Server-side only — never import in client components
- `pdf-parse` is the fallback path for resume extraction when MarkItDown is unavailable or returns too little text
- Use the Node runtime for API routes that parse PDFs
- Configure the worker with a runtime-resolved `pdfjs-dist/legacy/build/pdf.worker.mjs` file URL; Next/Turbopack dev builds cannot reliably resolve pdf.js' default worker file from server chunks
- Do not import `pdf-parse/worker` in Next routes; it can pull `@napi-rs/canvas` into production server chunks
- `pdfData.text` is raw unformatted text — Gemini handles the structure extraction
- Always call `parser.destroy()` in a `finally` block after parsing
- Always handle parse errors — some PDFs are image-based and return empty text
- If `pdfData.text` is empty or very short — return error to user: "Could not extract text from this PDF. Please try a different file."

---

## MarkItDown

**Check first:** Check AGENTS.md for an installed MarkItDown skill or MCP server. If a MarkItDown MCP is installed for the agent, it can be used for manual inspection, but JobPilot runtime extraction uses the local Python CLI/module path.

### Preferred Resume PDF Conversion

MarkItDown is a Python utility from Microsoft for converting PDFs and other documents into Markdown for LLM/text-analysis pipelines. Use it before `pdf-parse` because Markdown preserves useful structure such as headings, lists, links, and tables, and can reduce noisy prompt text.

```typescript
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const localMarkitdownPath = path.join(process.cwd(), ".venv", "bin", "markitdown");
const markitdownCommands = [
  { command: localMarkitdownPath, args: [] },
  { command: "markitdown", args: [] },
  { command: "python3", args: ["-m", "markitdown"] },
];

async function convertPdfWithMarkitdown(pdfBuffer: Buffer): Promise<string | null> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "job-pilot-resume-"));
  const pdfPath = path.join(tempDir, "resume.pdf");

  try {
    await writeFile(pdfPath, pdfBuffer);

    for (const markitdownCommand of markitdownCommands) {
      const { stdout } = await execFileAsync(
        markitdownCommand.command,
        [...markitdownCommand.args, pdfPath],
        {
          timeout: 15000,
          maxBuffer: 2 * 1024 * 1024,
        },
      );

      if (stdout.trim()) return stdout.trim();
    }

    return null;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}
```

**Rules:**

- Runtime dependency is Python 3.10+ with `requirements.txt` installed
- Local development installs MarkItDown into project `.venv`; app code checks `.venv/bin/markitdown` before global commands
- Docker or VM deployments should install Python 3.10+ and run `pip install -r requirements.txt` during image build so the same `.venv/bin/markitdown` or module command is available at runtime.
- Serverless deployments that cannot ship Python subprocess dependencies may rely on the existing `pdf-parse` fallback, accepting less structured extraction until the broader deployment plan adds a dedicated worker or Python-capable runtime; the open production decision is tracked in `memory.md`.
- Call the narrow conversion path only: `markitdown <server-created-temp-file>` or `python3 -m markitdown <server-created-temp-file>`
- Never pass user-controlled file paths or URLs to MarkItDown
- Always write uploaded bytes to a server-created temp directory and clean that directory in `finally`
- Always set a timeout and max output buffer for the subprocess
- If MarkItDown is missing, times out, or returns too little text, fall back to `pdf-parse`
- Do not use MarkItDown plugins for uploaded resumes unless a later review approves the security/runtime implications
