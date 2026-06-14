# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

The AI agent on this project operates as a senior engineer. This means:

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — never assume, always verify against architecture.md and project-overview.md
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
- **One thing at a time** — complete one feature fully before touching the next
- **Failures are expected** — wrap agent operations in try/catch, log failures, never let one failure crash everything

---

## TypeScript

- Strict mode enabled in tsconfig.json — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- All async functions must have proper error handling — never let promises float unhandled
- Use `const` by default — only use `let` when reassignment is necessary

---

## Next.js 16 Conventions

- App Router only — no Pages Router
- React 19 — use React 19 APIs throughout
- All components are Server Components by default
- Only add `"use client"` when the component requires:
  - useState or useReducer
  - useEffect
  - Browser APIs
  - Event listeners
  - Third party client-only libraries (PostHog browser side)
- Never add `"use client"` to layout files unless absolutely required
- Data fetching happens in Server Components — never fetch in Client Components directly
- Route handlers live in `app/api/` — never put business logic directly in route handlers
- Server Actions live in `actions/` — never define Server Actions inline in components
- Caching is uncached by default — all dynamic code runs at request time
- Always read Next.js documentation before implementing any Next.js specific feature — APIs may differ from training data

---

## File and Folder Naming

- Folders: kebab-case — `job-details`, `agent-controls`
- Component files: PascalCase — `StatsBar.tsx`, `RecentActivity.tsx`
- Utility files: camelCase — `gemini.ts`, `posthog-client.ts`
- Type files: camelCase — `index.ts`
- API route files: always `route.ts`
- Server Action files: camelCase — `profile.ts`, `jobs.ts`
- One component per file — never export multiple components from one file
- Index files only in `components/ui/` — never barrel export from other folders

---

## Component Structure

Every component follows this exact order:

```typescript
"use client"; // only if needed

// 1. External imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Internal imports
import { StatsCard } from "@/components/dashboard/StatsCard";

// 3. Type definitions
type Props = {
  jobId: string;
  matchScore: number;
};

// 4. Component
export function ComponentName({ jobId, matchScore }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports
- Props type defined directly above the component — not in a separate types file unless shared
- No inline styles — all styling via Tailwind classes using CSS variables from ui-tokens.md

---

## API Route Handlers

```typescript
// app/api/agent/find/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // validate body
    // call agent function
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[agent/find]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- Every route handler has a try/catch
- Every route handler validates the request body before processing
- Errors are logged with the route path as prefix: `[agent/find]`
- Always return `{ success: boolean, data?: T, error?: string }`
- Never return raw data without the success wrapper

---

## Server Actions

```typescript
// actions/profile.ts

"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function saveProfile(formData: ProfileFormData) {
  try {
    const insforge = await createInsforgeServer();
    // validate
    // write to DB
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to save profile" };
  }
}
```

- Every Server Action has a try/catch
- Every Server Action returns `{ success: boolean, error?: string }`
- Always call `revalidatePath` after mutations that affect page data
- Never throw from Server Actions — always return the error

---

## Agent Code

```typescript
// agent/adzuna.ts

export async function discoverJobs(
  jobTitle: string,
  location: string,
  profile: Profile,
  runId: string,
): Promise<{ success: boolean; jobs?: Job[]; error?: string }> {
  try {
    // implementation
    return { success: true, jobs };
  } catch (error) {
    await logAgentError(runId, null, error);
    return { success: false, error: String(error) };
  }
}
```

- Every agent function returns `{ success: boolean, error?: string }`
- Every agent function has a try/catch — never let one failure crash the run
- Errors are always logged to agent_logs table before returning
- Agent functions never import from `components/` or `actions/`
- Agent functions never use React hooks or browser APIs

---

## InsForge Client Usage

```typescript
// Browser context — Client Components only
import { insforge } from "@/lib/insforge-client";

// Server context — Server Components, Route Handlers, Server Actions, Agent
import { createInsforgeServer } from "@/lib/insforge-server";
const insforge = await createInsforgeServer();
```

- Never use the browser client in server context
- Never use the server client in browser context
- Always await createInsforgeServer() — it reads cookies asynchronously
- Always scope every query to the current user_id — never query without a user filter

---

## Error Handling

- Never use empty catch blocks — always log or handle
- Console errors always include context prefix: `[component/function name]`
- User-facing errors must be human readable — never expose raw error messages
- Agent errors go to agent_logs table — never surface raw agent errors to the UI
- API route errors return `status: 500` with generic message — never expose internals

---

## PostHog Events

All PostHog events must use these exact event names. Never invent new event names without adding them here first.

### Product Events

These events power the JobPilot product analytics and dashboard charts.

| Event                      | When                                       | Key Properties                            |
| -------------------------- | ------------------------------------------ | ----------------------------------------- |
| `job_search_started`       | Find Jobs button clicked                   | userId, jobTitle, location                |
| `job_found`                | Each job discovered and saved              | userId, source, matchScore                |
| `job_status_changed`       | User or agent changes a job lifecycle status | userId, jobId, fromStatus, toStatus, reason |
| `job_unavailable_detected` | Availability check confirms a listing is closed, expired, removed, or unreachable | userId, jobId, source, reason |
| `profile_completed`        | User saves complete profile for first time | userId                                    |
| `company_researched`       | Company research dossier generated         | userId, jobId, company                    |

### Foundation Events

These events were added by the PostHog wizard for homepage and auth-funnel analytics. Keep them limited to marketing/auth surfaces.

| Event                   | When                                             | Key Properties      |
| ----------------------- | ------------------------------------------------ | ------------------- |
| `get_started_clicked`   | User clicks the homepage Get Started CTA         | source              |
| `find_jobs_clicked`     | User clicks the homepage Find Your First Match CTA | source            |
| `oauth_sign_in_started` | User selects an OAuth provider                   | provider            |
| `oauth_sign_in_error`   | OAuth sign-in initiation fails before redirect   | provider, error     |
| `auth_callback_failed`  | OAuth callback fails                             | reason              |
| `user_signed_in`        | OAuth callback completes on the client           | provider            |
| `server_user_signed_in` | OAuth token exchange completes on the server     | userId, email       |
| `user_signed_out`       | User clicks Sign out                             | none                |

### Current App Events

These events cover temporary or existing application surfaces before the full product flows are built.

| Event                         | When                                      | Key Properties |
| ----------------------------- | ----------------------------------------- | -------------- |
| `dashboard_checkpoint_viewed` | Authenticated user loads dashboard checkpoint | userId, email |

Do not add more events without updating this list first.

`job_found` powers the Jobs Found Over Time and Match Score Distribution dashboard charts.
`job_status_changed` powers lifecycle activity and applied/completed pipeline history.
`job_unavailable_detected` powers stale-listing health and cleanup visibility.
`company_researched` powers the Company Research Activity dashboard chart.
Always fire these with correct properties.

---

## Environment Variables

Environment variables are managed through Varlock.

- **Single local env file:** JobPilot uses `.env` for all local values. Do not create or update `.env.local` for this project.
- `.env.schema` is the committed source of truth for variable names, descriptions, sensitivity, required status, and validation.
- `.env` contains local development values and remains gitignored.
- If a tool or wizard generates `.env.local`, treat it as drift: move any needed variable names into `.env.schema`, put local values in `.env`, and leave real values unprinted.
- Do not commit `.env`, `.env.local`, decrypted secrets, copied provider keys, or screenshots/logs that expose secret values.
- Run local development, builds, linting, scripts, and future database tooling through Varlock once it is installed: `varlock run -- <command>`.
- Use `varlock load` before debugging environment issues so missing or invalid variables are caught before app code runs.
- Application code still reads values through `process.env` unless a future implementation explicitly adopts generated Varlock types.
- Never hardcode any key, URL, or secret anywhere in the codebase.

Current active environment variables:

| Variable                       | Used In                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_INSFORGE_URL`     | `lib/insforge-client.ts`, `lib/insforge-server.ts`, `proxy.ts`          |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | `lib/insforge-client.ts`, `lib/insforge-server.ts`, `proxy.ts`          |
| `INSFORGE_API_KEY`             | `lib/insforge-admin.ts`, background workflows only                      |
| `NEXT_PUBLIC_POSTHOG_KEY`      | `instrumentation-client.ts`, `lib/posthog-server.ts`                    |
| `NEXT_PUBLIC_POSTHOG_HOST`     | `lib/posthog-server.ts`, `next.config.ts` PostHog reverse-proxy destinations |
| `GEMINI_API_KEY`               | `lib/gemini.ts`                                                         |
| `ADZUNA_APP_ID`                | `lib/adzuna.ts`                                                         |
| `ADZUNA_APP_KEY`               | `lib/adzuna.ts`                                                         |
| `INNGEST_DEV`                  | `inngest/client.ts` local dev mode                                      |
| `INNGEST_EVENT_KEY`            | `inngest/client.ts` cloud event sending                                 |
| `INNGEST_SIGNING_KEY`          | `app/api/inngest/route.ts`                                              |

`NEXT_PUBLIC_` prefix means the variable is exposed to the browser. Never add `NEXT_PUBLIC_` to secret keys.

When adding a new variable, update `.env.schema`, this table, and the consuming module in the same feature. If the value is secret, mark it sensitive in Varlock and keep it server-only.

Inngest local development should run with `INNGEST_DEV=1` and `inngest dev -u http://localhost:3000/api/inngest`; cloud event/signing keys are not required for that path. In production/cloud mode, configure `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.

---

## Match Threshold

The job match threshold is defined once as a constant. Never hardcode this value anywhere else.

```typescript
// lib/utils.ts
export const MATCH_THRESHOLD = 70;
export const MATCH_STRONG_THRESHOLD = 85;
```

Import and use `MATCH_THRESHOLD` everywhere the high/low match boundary is needed. Import and use `MATCH_STRONG_THRESHOLD` wherever the strong-match visual boundary is needed.

---

## Import Aliases

Always use the `@/` alias — never use relative imports that go up more than one level.

```typescript
// Correct
import { Button } from "@/components/ui/button";
import { insforge } from "@/lib/insforge-client";
import { MATCH_THRESHOLD } from "@/lib/utils";

// Never
import { Button } from "../../../components/ui/button";
```

---

## Comments

- No comments explaining what the code does — code must be self-explanatory
- Comments only for why — explaining a non-obvious decision
- Agent functions may have a brief comment explaining the Gemini web research or structured output strategy
- Never leave TODO comments in committed code

---

## Dependencies

Never install a new package without a clear reason. Before installing anything check:

1. Does shadcn/ui already have this component?
2. Does Next.js already provide this functionality?
3. Is there a simpler native solution?

Approved dependencies for this project:

- `varlock` — environment schema, validation, injection, and secret scanning
- `@insforge/sdk` — InsForge client, SSR helpers, auth, database, storage, functions, and realtime
- `@google/genai` — Gemini API client
- `posthog-js` — PostHog browser client
- `posthog-node` — PostHog server client
- `@react-pdf/renderer` — Resume PDF generation
- `pdf-parse` — Extract text from uploaded PDF
- `inngest` — durable background workflows for long-running agent jobs
- `zod` — Schema validation
- `lucide-react` — Icons
- `tailwindcss` — Styling
- `shadcn/ui` components — UI primitives

Do not install any other packages without updating this list first.
