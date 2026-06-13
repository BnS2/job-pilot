# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Navbar

File: `components/layout/Navbar.tsx`
Last updated: 2026-06-12

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`                                                          |
| Border           | `border-b border-border`                                              |
| Border radius    | `rounded-md` for the CTA button                                       |
| Text — primary   | `text-text-dark` for inactive nav links, `text-accent` for active link |
| Text — secondary | none                                                                  |
| Spacing          | `h-16`, `px-4 sm:px-6`, `gap-8`, `gap-2`, `py-5`, icon `h-4 w-4`      |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | `bg-overlay text-accent-foreground` for CTA, `text-accent` for active link |

**Pattern notes:**
The top nav can render with either a centered `max-w-[1110px]` inner row or a full-width app layout. Logo uses the public `logo.png` asset and loads eagerly because it can be the above-the-fold LCP image. Current implementation supports hiding the CTA for authenticated app pages. Nav links use small token-colored line icons and the active state is color-only, matching `ui-rules.md`. Active nav links expose `aria-current="page"` for assistive technology. Protected app nav links disable Next.js prefetch so login/public pages do not background-render protected routes while auth state is uncertain.

### Footer

File: `components/layout/Footer.tsx`
Last updated: 2026-06-09

| Property         | Class                                                          |
| ---------------- | -------------------------------------------------------------- |
| Background       | `bg-surface`                                                   |
| Border           | `border-t border-border`                                       |
| Border radius    | none                                                           |
| Text — primary   | `text-text-dark`                                               |
| Text — secondary | none                                                           |
| Spacing          | `px-4 py-12 sm:px-6`, `gap-8`                                  |
| Hover state      | none                                                           |
| Shadow           | none                                                           |
| Accent usage     | none                                                           |

**Pattern notes:**
Footer mirrors the navbar width with `max-w-[1110px]`, uses the same logo asset, and keeps links lightweight.

### Homepage Hero

File: `components/homepage/Hero.tsx`
Last updated: 2026-06-10

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `landing-soft-gradient`, `bg-surface-tertiary`                        |
| Border           | `border-x border-border`, `border-t border-border`                    |
| Border radius    | `rounded-md` for CTAs                                                 |
| Text — primary   | `text-text-primary`                                                   |
| Text — secondary | `text-text-secondary`                                                 |
| Spacing          | `px-4 py-16`, `mt-6`, `mt-8`, `gap-3`                                 |
| Hover state      | none                                                                  |
| Shadow           | image asset provides preview shadow                                   |
| Accent usage     | `bg-overlay text-accent-foreground` primary CTA                       |

**Pattern notes:**
Hero gradients are defined in `app/globals.css` with CSS variables, not component-level colors. CTAs use the shared dark primary and bordered secondary patterns.

### Homepage Feature Split

File: `components/homepage/FeatureSplit.tsx`
Last updated: 2026-06-09

| Property         | Class                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-surface-muted`, `landing-section-texture`             |
| Border           | `border-x border-t border-border`, `divide-y divide-border`             |
| Border radius    | image assets provide internal radius                                    |
| Text — primary   | `text-text-primary`                                                     |
| Text — secondary | `text-text-secondary`                                                   |
| Spacing          | `px-8 py-12 sm:px-12`, `mt-10`, `px-8 py-6 sm:px-12`                   |
| Hover state      | none                                                                   |
| Shadow           | image assets provide preview shadow                                    |
| Accent usage     | `border-l-2 border-accent`, `border-l-2 border-success`                |

**Pattern notes:**
Feature split sections use bordered white text panels paired with muted image panels. Active feature rows are marked by a two-pixel left border only.

### Homepage Testimonial

File: `components/homepage/Testimonial.tsx`
Last updated: 2026-06-09

| Property         | Class                                                       |
| ---------------- | ----------------------------------------------------------- |
| Background       | `bg-surface`, `landing-section-texture`                     |
| Border           | `border-x border-t border-border`, `border-b border-border` |
| Border radius    | `rounded-sm` for avatar                                     |
| Text — primary   | `text-text-dark`, `text-text-primary`                       |
| Text — secondary | `text-text-secondary`                                       |
| Spacing          | `px-4 py-20 sm:px-6`, `mt-6`, `mt-8`, `gap-3`               |
| Hover state      | none                                                        |
| Shadow           | none                                                        |
| Accent usage     | `text-accent` eyebrow                                       |

**Pattern notes:**
Testimonials use centered copy, an uppercase accent eyebrow, and compact author metadata with the public avatar asset.

### Homepage Bottom CTA

File: `components/homepage/BottomCta.tsx`
Last updated: 2026-06-10

| Property         | Class                                                       |
| ---------------- | ----------------------------------------------------------- |
| Background       | `landing-soft-gradient`, `landing-section-texture`          |
| Border           | `border-x border-t border-border`, `border-b border-border` |
| Border radius    | `rounded-md` for CTAs                                       |
| Text — primary   | `text-text-primary`                                         |
| Text — secondary | `text-text-secondary`                                       |
| Spacing          | `px-4 py-20 sm:px-6`, `mt-6`, `mt-8`, `gap-3`               |
| Hover state      | none                                                        |
| Shadow           | none                                                        |
| Accent usage     | `bg-overlay text-accent-foreground` primary CTA             |

**Pattern notes:**
Bottom CTA repeats the hero CTA treatment and soft gradient background to bookend the homepage.

### Homepage CTA Buttons

File: `components/homepage/HomepageCtaButtons.tsx`
Last updated: 2026-06-10

| Property         | Class                                                       |
| ---------------- | ----------------------------------------------------------- |
| Background       | `bg-overlay` primary, `bg-surface` secondary                |
| Border           | `border border-border` secondary only                       |
| Border radius    | `rounded-md` for both                                       |
| Text — primary   | `text-accent-foreground` primary, `text-text-primary` secondary |
| Text — secondary | none                                                        |
| Spacing          | `mt-8`, `gap-3` container; `px-6 py-3` each link            |
| Hover state      | none                                                        |
| Shadow           | none                                                        |
| Accent usage     | `bg-overlay text-accent-foreground` primary CTA             |

**Pattern notes:**
Shared CTA button group extracted from Hero and BottomCta to centralize homepage CTA event capture. Accepts a `source` prop (`"hero"` or `"bottom_cta"`) for analytics. Must always be wrapped in a flex container — the `mt-8` and `gap-3 sm:flex-row` classes handle the existing layout in both parent sections.

### Login Page

File: `app/(auth)/login/page.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Background       | `bg-background`, `bg-surface`, `bg-surface-secondary`, `landing-soft-gradient`                             |
| Border           | `border border-border`, `border-b border-border`, `lg:border-r`, `lg:border-b-0`                           |
| Border radius    | `rounded-xl` for the split auth card, `rounded-md` for notices, `rounded-full` for the security badge      |
| Text — primary   | `text-text-primary`                                                                                        |
| Text — secondary | `text-text-secondary`                                                                                      |
| Spacing          | `px-4 py-12 sm:px-6`, `p-6 sm:p-10 lg:p-12`, `mt-3`, `mt-6`, `mt-8`, `mt-10`, `mt-14 lg:mt-20`, `gap-2`   |
| Hover state      | none                                                                                                       |
| Shadow           | `shadow-sm`                                                                                                |
| Accent usage     | `text-accent` for the shield icon, `text-error` for human-readable OAuth errors                            |

**Pattern notes:**
The login page uses the existing navbar/footer shell with one large split card. The navbar hides the Start for free CTA on this route because the page already is the sign-in/start destination. The left side provides minimal context with a soft token-based background, badge, headline, support copy, and routing note; the right side contains only the JobPilot welcome copy, human-readable OAuth error, and provider buttons.

### OAuth Buttons

File: `components/auth/OAuthButtons.tsx`
Last updated: 2026-06-10

| Property         | Class                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Background       | `bg-surface`                                                                                                         |
| Border           | `border border-border`                                                                                               |
| Border radius    | `rounded-md` for buttons                                                                                             |
| Text — primary   | `text-text-primary`, `text-text-dark`                                                                                |
| Text — secondary | `text-text-muted` for disabled state                                                                                 |
| Spacing          | `mt-8`, `gap-3`, `h-11`, `h-5`, `min-w-5`, `px-4 py-2`                                                               |
| Hover state      | none                                                                                                                 |
| Shadow           | none                                                                                                                 |
| Accent usage     | `text-error` for start-sign-in failures                                                                              |

**Pattern notes:**
OAuth buttons are full-width bordered controls with compact neutral provider icons from `components/auth/ProviderIcon.tsx`. Pending state disables both buttons and swaps the label to "Redirecting..." without resizing the layout.

### Provider Icon

File: `components/auth/ProviderIcon.tsx`
Last updated: 2026-06-10

| Property         | Class                   |
| ---------------- | ----------------------- |
| Background       | none                    |
| Border           | none                    |
| Border radius    | none                    |
| Text — primary   | inherited `currentColor` |
| Text — secondary | none                    |
| Spacing          | `h-5`, `w-5`            |
| Hover state      | none                    |
| Shadow           | none                    |
| Accent usage     | none                    |

**Pattern notes:**
Provider icons are single-color SVG glyphs that inherit the parent text token. They avoid provider brand colors so the auth card remains consistent with JobPilot tokens.

### Auth Callback

File: `components/auth/AuthCallback.tsx`
Last updated: 2026-06-10

| Property         | Class                                                               |
| ---------------- | ------------------------------------------------------------------- |
| Background       | `bg-surface`                                                        |
| Border           | `border border-border`                                              |
| Border radius    | `rounded-xl`, `rounded-md` for recovery CTA                         |
| Text — primary   | `text-text-primary`                                                 |
| Text — secondary | `text-text-secondary`                                               |
| Spacing          | `p-6`, `mt-3`, `mt-6`, `px-4 py-2`                                  |
| Hover state      | none                                                                |
| Shadow           | `shadow-sm`                                                         |
| Accent usage     | `bg-accent text-accent-foreground` recovery CTA                     |

**Pattern notes:**
The callback state reuses the login card scale and keeps completion/error messaging short while the client posts OAuth callback parameters to the app API route for server-managed cookie setup.

### Logout Button

File: `components/auth/LogoutButton.tsx`
Last updated: 2026-06-10

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`                                                          |
| Border           | `border border-border`                                                |
| Border radius    | `rounded-md`                                                          |
| Text — primary   | `text-text-primary`                                                   |
| Text — secondary | `text-text-muted` for disabled state                                  |
| Spacing          | `inline-flex`, `h-10`, `gap-2`, `px-4 py-2`, icon `h-4 w-4`           |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | none                                                                  |

**Pattern notes:**
Logout is a bordered secondary action that clears local InsForge browser state and app-domain SSR cookies before replacing the route with `/login`.

### Auth Session Guard

File: `components/auth/AuthSessionGuard.tsx`
Last updated: 2026-06-12

| Property         | Class |
| ---------------- | ----- |
| Background       | none  |
| Border           | none  |
| Border radius    | none  |
| Text — primary   | none  |
| Text — secondary | none  |
| Spacing          | none  |
| Hover state      | none  |
| Shadow           | none  |
| Accent usage     | none  |

**Pattern notes:**
Auth Session Guard is an invisible protected-page client guard. Immediate page-load auth refresh is owned by `proxy.ts` and the InsForge browser SDK; this guard only performs a periodic 5-minute refresh check, clears browser auth state on a confirmed 401 refresh response, and routes to `/login?next={currentPath}`. It does not call the logout route because `/api/auth/refresh` owns cookie clearing for real expiry and temporary refresh failures must not destroy a valid session. It must not render visual UI or introduce layout classes.

### Profile Completion Indicator

File: `components/profile/CompletionIndicator.tsx`
Last updated: 2026-06-12

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`                                                          |
| Border           | `border border-error/20` (incomplete) or `border border-success/20` (complete) |
| Border radius    | `rounded-xl`, `rounded-full` for status icon and ring                 |
| Text — primary   | `text-text-primary`, `text-error` (incomplete) or `text-success` (complete) |
| Text — secondary | `text-text-secondary`                                                 |
| Spacing          | `p-6`, `gap-6`, `mt-3`, `mt-4`, `gap-2`                               |
| Hover state      | none                                                                  |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `text-error`, `bg-error/10` (incomplete) or `text-success`, `bg-success-light` (complete), dynamic inline conic gradient |

**Pattern notes:**
Accepts dynamic completeness props. Renders a warning style (error theme) with missing tags when incomplete, or a success style (green checkmark theme) when 100% complete. Circular progress ring is rendered dynamically via inline `conic-gradient` style and exposes progressbar ARIA semantics.

### Resume Upload

File: `components/profile/ResumeUpload.tsx`
Last updated: 2026-06-12

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-surface-secondary` for upload zone                  |
| Border           | `border border-border`, `border-dashed border-border-muted`           |
| Border radius    | `rounded-xl` for card and drop zone, `rounded-md` for buttons         |
| Text — primary   | `text-text-primary`                                                   |
| Text — secondary | `text-text-secondary`                                                 |
| Spacing          | `p-6`, `mt-1`, `mt-4`, `mt-6`, `px-4 py-8`, `gap-2`, `gap-3`, `gap-4`, `pt-6`, action buttons `h-10 min-w-40 px-4`, upload icon well `h-14 w-14`, upload icon `h-8 w-8` |
| Hover state      | `hover:bg-surface-secondary`, `hover:bg-error/5`, `hover:bg-accent-dark` |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `text-accent` upload icon, `bg-accent text-accent-foreground` extraction CTA |

**Pattern notes:**
Resume upload uses client-side file upload flow via the InsForge browser SDK. Renders as a bordered drag-and-drop dropzone with file validation (PDF only, <= 5MB) when no resume is uploaded. Dropzone icon is a token-colored cloud outline with a separate upward arrow inside a circular white icon well; keep the glyph large enough that it does not collapse into an umbrella-like mark. Swaps to a success card styling when a resume exists, displaying the filename as a link and a "Delete" button. Upload persists the returned storage `url` and `key`; failed metadata writes remove the just-uploaded object before surfacing the error. The visible filename opens `/api/profile/resume` so private storage objects are downloaded through an authenticated app route rather than a direct object URL. Delete clears both profile references only after storage deletion succeeds. The generation action is always available as a bordered secondary button and uses saved profile data. The extraction action appears only in the uploaded state and uses the accent primary button pattern. Footer actions render as a compact toolbar with matching height, no label wrapping, and side-by-side alignment only when there is enough horizontal space. Token-based success/error status banners appear above the resume card.

### Profile Client

File: `components/profile/ProfileClient.tsx`
Last updated: 2026-06-11

| Property         | Class |
| ---------------- | ----- |
| Background       | none  |
| Border           | none  |
| Border radius    | none  |
| Text — primary   | none  |
| Text — secondary | none  |
| Spacing          | none  |
| Hover state      | none  |
| Shadow           | none  |
| Accent usage     | none  |

**Pattern notes:**
Profile Client is a state-only composition wrapper around `ResumeUpload` and `ProfileForm`. It owns draft profile state so resume extraction can populate the form without saving to InsForge. It renders no visual shell and must not introduce layout, color, or spacing classes; page layout remains owned by `/profile`.

### Profile Form

File: `components/profile/ProfileForm.tsx`
Last updated: 2026-06-10

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface` for editable inputs, `bg-surface-secondary` for disabled email/add buttons/role panels, `bg-accent-muted` for skill and industry chips |
| Border           | `border border-border`, `border-t border-border`, `border-b border-border` |
| Border radius    | `rounded-xl` for card/role panel, `rounded-md` for inputs/buttons/tags |
| Text — primary   | `text-text-primary`, `text-text-dark`, `text-accent`                  |
| Text — secondary | `text-text-secondary`, `placeholder:text-text-muted`                  |
| Spacing          | `p-6`, `pb-4`, `mt-8`, `mt-10`, `pt-8`, `gap-4`, `px-3`, `py-2`      |
| Hover state      | `hover:bg-border-light` for add buttons, `hover:text-error` for chip removal, `hover:bg-accent-dark` for primary save |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `focus:border-accent focus:ring-1 focus:ring-accent`, `bg-accent text-accent-foreground`, `border-accent/20 bg-accent-muted text-accent` for chips |

**Pattern notes:**
Converted to Client Component to support state management for complex user inputs. Manages typed local lists for skills (tags), industries (tags), education, optional cover-letter tone, and dynamic work experience roles (up to 3). Binds to the Server Action `saveProfile` inside a React `useTransition` for loading state handling. Editable inputs and selects use `bg-surface`; the disabled email field keeps the muted `bg-surface-secondary` treatment and preserved opacity so locked state is visually distinct without showing a text caret. Work experience date fields use a matching `h-5` header row so Start Date and End Date inputs stay horizontally aligned; the "Currently working here" checkbox sits in the End Date header area on desktop but stays after the End Date input in DOM order for keyboard flow. Skill and industry chips use the accent-muted token pattern; semantic missing-field chips remain error-colored.

### Job Details Sections

File: `components/job-details/*`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-background`, `bg-surface-secondary` for icon wells   |
| Border           | `border border-border`, `border-b border-border`, `border-error/20` for load errors |
| Border radius    | `rounded-xl` for cards, `rounded-md` for buttons/icon wells, `rounded-full` for badges |
| Text — primary   | `text-text-primary`, `text-accent-foreground` for primary CTAs, `text-accent` for source links |
| Text — secondary | `text-text-secondary`, `text-text-muted`, `text-error` for retryable research failures |
| Spacing          | `p-6`, compact listing details `grid gap-5 sm:grid-cols-2`, icon wells `h-10 w-10`, `gap-2`, `gap-3`, `gap-4`, `gap-5`, `gap-6`, `mt-1`, `mt-2`, `mt-3`, `mt-4`, `mt-5`, `mt-6`, `mt-8`, `space-y-2`, `space-y-5` |
| Hover state      | `hover:bg-surface-secondary`, `hover:border-text-secondary` on lifecycle secondary buttons |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `bg-accent text-accent-foreground`, `bg-accent-muted text-accent`, `bg-success-lightest text-success-foreground` |

**Pattern notes:**
Job Details is now composed from route-level data plus focused `components/job-details` presentation sections. Cards preserve the supplied design pattern: white surface, token border, 16px radius, 24px card padding, and small token-colored icon wells. Listing metadata renders as one `Listing details` card with a compact two-column details grid instead of four separate stat cards; values wrap with `break-words` so salary, location, job type, and date found stay readable without cramped truncation. Metadata labels use complete wording when space allows, such as `Salary Estimated` instead of `Salary Est.`. The lifecycle controls intentionally remain visible near Apply Now as Feature 12 integration; availability auto-refresh is invisible and calls the API route rather than importing agent logic into the page. CompanyResearchCard is a client component only for the trigger/polling behavior; it keeps the same section shell, uses a primary accent CTA for idle/retry states, a muted disabled treatment while running, border-top dividers for dossier sections, success-lightest skill tags for tech stack, and small accent source links with `break-all`.

### Profile Page Shell

File: `app/profile/page.tsx`
Last updated: 2026-06-12

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-background`                                                       |
| Border           | none on page shell                                                    |
| Border radius    | none on page shell                                                    |
| Text — primary   | inherited from child components                                       |
| Text — secondary | inherited from child components                                       |
| Spacing          | `min-h-screen`, `max-w-[920px]`, `gap-8`, `px-4 py-8 sm:px-6`         |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | delegated to child components                                         |

**Pattern notes:**
The profile page shell is a protected server-rendered app page that composes Navbar, CompletionIndicator, ResumeUpload, and ProfileForm. It fetches the profile data from the InsForge DB, computes completion metrics dynamically, and passes properties down.

### Dashboard Auth Checkpoint

File: `app/dashboard/page.tsx`
Last updated: 2026-06-12

| Property         | Class                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Background       | `bg-background`, `bg-surface`                                                             |
| Border           | `border border-border`                                                                    |
| Border radius    | `rounded-xl`                                                                              |
| Text — primary   | `text-text-primary`                                                                       |
| Text — secondary | `text-text-secondary`                                                                     |
| Spacing          | `px-4 py-12 sm:px-6`, `gap-6`, `gap-4`, `p-6`, `mt-3`, grid `md:grid-cols-3`             |
| Hover state      | none                                                                                      |
| Shadow           | `shadow-sm`                                                                               |
| Accent usage     | `text-accent` status eyebrow                                                              |

**Pattern notes:**
This is a temporary protected checkpoint for testing the auth redirect and logout flow before the full Phase 5 dashboard UI. It uses sibling section cards only and avoids dashboard analytics patterns that belong to the later feature.
The page now also sends the `dashboard_checkpoint_viewed` PostHog event server-side after confirming the authenticated user; this does not change the visual pattern. Dashboard uses the authenticated-app navbar treatment with active `/dashboard` state and no "Start for free" CTA.

### Find Jobs Page Shell

File: `app/find-jobs/page.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-background`                                                       |
| Border           | none on page shell                                                    |
| Border radius    | none on page shell                                                    |
| Text — primary   | inherited from child components                                       |
| Text — secondary | inherited from child components                                       |
| Spacing          | `min-h-screen`, `max-w-[1440px]`, `gap-6`, `px-4 py-8 sm:px-6 lg:px-12` |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | delegated to child components                                         |

**Pattern notes:**
The Find Jobs page is a protected Server Component that verifies the current InsForge user and composes the app navbar, search controls, filter toolbar, and jobs table. Feature 09 uses static mock rows only; real search, filtering, sorting, pagination, and jobs DB reads are deferred to Features 10 and 11. Query-string inputs are normalized before hitting the InsForge/PostgREST query builder, stable secondary ordering is applied before pagination, and out-of-range page numbers redirect back to the nearest valid page. Feature 12 defaults the list to `status=active` while allowing explicit status views through the filter toolbar. Background searches do not scope or clear the visible list while they are running; completed runs refresh the current list. Repeated `run` URL params are validated as UUIDs, hydrated from current-user completed `agent_runs`, and only hydrated run IDs are passed to the jobs query. Invalid, missing, non-completed, or unauthorized runs do not render chips and do not scope the table; valid selected runs filter with `run_id IN (...)`. Database failures render a token-styled error card instead of the empty jobs table.

### Find Jobs Search Controls

File: `components/find-jobs/SearchControls.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-success-lightest` success banner, `bg-info-lightest` empty-result banner, `bg-error/10` error banner |
| Border           | `border border-border`, `border border-success/20` success banner, `border border-info/20` empty-result banner, `border border-error/20` error banner |
| Border radius    | `rounded-xl` for card, `rounded-md` for inputs/button/banner          |
| Text — primary   | `text-text-primary`, `text-text-dark`, `text-success-foreground`, `text-info-foreground`, `text-error` |
| Text — secondary | `text-text-muted`, `placeholder:text-text-muted`                      |
| Spacing          | `p-6`, `grid gap-4 lg:grid-cols-[1fr_1fr_auto]`, inputs `h-12 px-4`, button `h-12 px-6`, banner `mt-5 px-4 py-4 gap-3` |
| Hover state      | `hover:bg-accent-dark` for primary CTA/add action, `hover:bg-surface-secondary` for secondary notice buttons |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `bg-accent text-accent-foreground`, `text-success` success icon, `text-info` empty icon, `text-error` error icon |

**Pattern notes:**
Search controls match the supplied `find-jobs.png` card: uppercase compact labels, large rounded inputs, search icon in the job title input, and conditional status banners below the controls. Feature 10 converts this to a Client Component with controlled inputs, submit loading state, `POST /api/agent/find` wiring, a token-green success banner from the API response, a token-blue empty-result banner for zero Adzuna results, and a token-red human-readable error banner. Background search runs use per-term status rows below the controls while the existing results remain visible; optional locations are displayed as quoted values to match quoted search terms. Run rows persist in browser storage for the `/find-jobs` experience so active searches can resume polling when the user returns. Completed rows use green only when strong matches exist; weak/no-match completions stay blue and can be dismissed with a compact icon button. Completed rows are history/status rows, not active filter indicators: they expose `View results` to replace selected `run` params and dismiss that notice. Clicking the notice text toggles the run into/out of the active URL filter set (appends on add, removes on toggle-off); when a run is in the active filters, its notice gains a `border-l-2 border-l-accent` left-border indicator. Plain dismissal hides the notice and also removes the run from active filters if it was selected through the URL. Background run-status polling must never call the logout route or clear cookies; transient auth/backend failures keep the run active and retry. Feature 19 adds a secondary Best Match button beside Find Jobs, styled as `bg-surface border border-border text-text-primary rounded-md` with a sparkle icon. Best Match skips the manual job title and derives search queries from the user's saved profile. Both buttons disable together while a request is in flight.

### Find Jobs Filter Toolbar

File: `components/find-jobs/JobFilters.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-accent-muted` for active dropdown options and selected search chips |
| Border           | `border border-border`, divider `bg-border`, `border-accent/20` selected search chips |
| Border radius    | `rounded-xl` toolbar, `rounded-md` dropdown buttons/options, `rounded-full` selected search chips |
| Text — primary   | `text-text-primary`, `text-accent` for active dropdown options         |
| Text — secondary | `text-text-muted`, `text-text-secondary`, `placeholder:text-text-muted` |
| Spacing          | `p-4`, `gap-4`, `h-10`, dropdowns `min-w-36 min-w-40 px-4`, chips `px-3 py-1 gap-2` |
| Hover state      | `hover:border-text-secondary` for dropdown button, `hover:bg-surface-secondary hover:text-text-dark` for option hover and clear button |
| Shadow           | `shadow-sm`, absolute dropdown `shadow-lg`                            |
| Accent usage     | `text-accent bg-accent-muted` for active dropdown option and selected search chips |

**Pattern notes:**
The toolbar handles filtering the retrieved jobs list through URL parameters backed by the server DB query. Converted to Client Component. It features a text filter input synced to local state and debounced by 700ms (also handling immediate Enter submit) to replace the `q` query parameter without adding typing steps to browser history. Selected completed-search filters render as compact chips below the company/role search input, using server-hydrated `agent_runs` metadata rather than localStorage notices; each chip removes its own repeated `run` param and resets pagination, with a compact `Clear search filters` action when two or more chips are active. Custom openable dropdown menus use React state plus document-level outside-click handling to select Status (Active, Applied, Unavailable, Archived, Rejected, Completed, All), Match Filters (All, High, Low), and Sort Orders (Score, Newest, Oldest), updating query parameters and resetting pagination without fixed-position backdrops or raw color classes. Query updates preserve repeated `run` params so completed-search filters compose with status, match, text search, sort, and pagination resets.

### Find Jobs Table

File: `components/find-jobs/JobsTable.tsx`
Last updated: 2026-06-12

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-surface-secondary` for header/icon wells            |
| Border           | `border border-border`, row `border-b border-border`                  |
| Border radius    | `rounded-xl` table shell, `rounded-md` icon wells, `rounded-full` badges/bars |
| Text — primary   | `text-text-primary`, `text-text-dark`                                 |
| Text — secondary | `text-text-secondary`                                                 |
| Spacing          | `overflow-hidden`, table `min-w-[1280px]`, header `px-6/8 py-5`, rows `px-6/8 py-6`, icon wells `h-10 w-10`, score bar `h-1.5 w-32` |
| Hover state      | `hover:bg-surface-secondary` row hover, `hover:text-accent` for links |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | match fills `bg-success` (>=85), `bg-info-medium` (>=70), `bg-warning` (<70); source badges `bg-info-lightest text-info-foreground` and `bg-surface-secondary text-text-secondary`; status badges use shared lifecycle token classes |

**Pattern notes:**
Renders real jobs queried from the database. Column parameters map `job.company` and `job.title` (as role), with user-safe fallback labels for nullable or drifted rows. Match score progress bar width is set dynamically via inline style after clamping the score to 0-100 and color-coded based on tone thresholds. Salary falls back to "Not specified". Source maps to Search or URL badge. Status uses shared lifecycle labels/classes from `lib/utils.ts`. Date Found uses a client/server-safe relative date formatter. Supports a status-aware full empty state row when search/filtering yields zero records.

Find Jobs search controls start a background Inngest run instead of blocking until Adzuna/Gemini finish. Each submitted term gets its own status row that names the search term and optional quoted location. Active rows show initializing/searching/scoring copy, completed rows summarize discovered jobs, saved jobs, and strong matches, and failed rows show a retryable error. Terminal rows stay visible until the user dismisses them with the icon button. Do not scope or clear the existing table while a run is processing, and do not disable the form after a run is enqueued; users can start more searches while earlier runs continue.

### Job Details Page

File: `app/find-jobs/[id]/page.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-background`, `bg-surface`, icon wells `bg-surface-secondary`, token-tinted badge/icon wells |
| Border           | `border border-border`, company research header `border-b border-border` |
| Border radius    | `rounded-xl` cards/icon well, `rounded-md` buttons, `rounded-full` badges/icon wells |
| Text — primary   | `text-text-primary`, `text-text-dark`                                 |
| Text — secondary | `text-text-secondary`, `text-text-muted`, action feedback `text-success-foreground` / `text-error` |
| Spacing          | page `max-w-[840px] gap-6 px-4 py-10 sm:px-6`, cards `p-6`, listing details `mt-5 grid gap-5 sm:grid-cols-2`, empty state `px-6 py-12`, action feedback `gap-2` |
| Hover state      | action buttons `hover:bg-surface-secondary hover:border-text-secondary` |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `bg-accent text-accent-foreground` for Research/Apply CTAs, `bg-success-lightest text-success-foreground` match and skill badges, `bg-accent-muted text-accent` gap skills/status |

**Pattern notes:**
The job details route follows `context/designs/job-details.png`: centered protected page, back link, summary card with company icon and View Job Post action, one readable Listing details card, AI match reasoning card, skills comparison card, job description card, company research empty state, and full-width Apply CTA. Lifecycle status is shown as a compact pill beside the match score. Status actions consolidated into a single `StatusDropdown` component — a bordered secondary button with dropdown arrow that shows available status transitions based on the current job status. The button label changes contextually (e.g., "Mark Applied" when active, "Restore Active" when archived). `CheckAvailabilityButton` appears only for active/unavailable jobs. Action feedback uses inline token-styled success/error text; do not use browser alerts for this workflow.

Company research progress now stays inside the card instead of refreshing the whole route. The empty state uses the existing icon well, primary heading, muted support copy, and token progress bars for four stages: Discover, Read, Synthesize, Finalize. Active stages use `bg-accent text-accent`; inactive stages use `bg-border-light text-text-muted`. Status polling reads `/api/agent/research?jobId=...` and only updates the card state.

### Status Dropdown

File: `components/job-details/StatusDropdown.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface` button, `bg-surface` menu, option hover `bg-surface-secondary` |
| Border           | `border border-border` button and menu                                |
| Border radius    | `rounded-md` button and menu                                          |
| Text — primary   | `text-text-primary`                                                   |
| Text — secondary | `text-text-muted` (pending state), `text-success-foreground` / `text-error` feedback |
| Spacing          | `h-10`, gap-1.5, `px-4`, menu `py-1`, options `px-4 py-2`, icon `h-3.5 w-3.5` |
| Hover state      | `hover:bg-surface-secondary hover:border-text-secondary` button, `hover:bg-surface-secondary` menu items |
| Shadow           | `shadow-lg` on dropdown menu                                          |
| Accent usage     | none (secondary button pattern)                                       |

**Pattern notes:**
Replaces 5-6 individual lifecycle buttons with one contextual dropdown. Button label reflects the most likely next action for the current status (e.g., "Mark Applied" for active jobs, "Restore Active" for archived). Clicking the button opens an absolutely-positioned dropdown menu listing all available transitions. Menu closes on outside click and on action selection. Uses `useTransition` for server-action feedback with inline token-styled success/error text. CheckAvailabilityButton is excluded — shown separately only for active/unavailable jobs.

### Route Loading Skeletons

Files: `app/find-jobs/loading.tsx`, `app/profile/loading.tsx`, `app/find-jobs/[id]/loading.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-background`, skeleton cards `bg-surface`, placeholders `bg-border-light`, wells `bg-surface-secondary` |
| Border           | `border border-border`, internal separators `border-b border-border`  |
| Border radius    | `rounded-xl` cards, `rounded-md` inputs/buttons/placeholders, `rounded-full` text bars |
| Text — primary   | none                                                                  |
| Text — secondary | none                                                                  |
| Spacing          | page `gap-6 px-4 py-8`, cards `p-6`, rows `px-8 py-5`, forms `gap-4` |
| Hover state      | none                                                                  |
| Shadow           | `shadow-sm` on skeleton cards                                         |
| Accent usage     | `bg-accent-muted` for CTA placeholders only                           |

**Pattern notes:**
Route loading states mirror the destination page structure instead of showing a generic spinner. Use only project tokens for placeholder surfaces: `bg-border-light` for text bars, `bg-surface-secondary` for input/content blocks, and `bg-accent-muted` only where a primary CTA will appear. Keep loading shells quiet and non-interactive.

### Find Jobs Pagination

File: `components/find-jobs/JobsPagination.tsx`
Last updated: 2026-06-12

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-accent-muted` active page                           |
| Border           | `border-t border-border`, button `border border-border`, active `border border-accent/20` |
| Border radius    | `rounded-md`                                                          |
| Text — primary   | `text-text-primary`, `text-accent` active page                        |
| Text — secondary | `text-text-secondary`, `text-text-muted` disabled/ellipsis            |
| Spacing          | `px-6 py-5`, `gap-4`, nav `gap-2`, buttons `h-10 w-10` or `h-10 px-4` |
| Hover state      | `hover:border-text-secondary` button hover                            |
| Shadow           | `shadow-sm` buttons                                                   |
| Accent usage     | `bg-accent-muted text-accent` active page                             |

**Pattern notes:**
Pagination is driven dynamically by `page`, `pageSize`, and `totalCount` props. It calculates total pages, dynamically generates page numbers list with ellipses (e.g. `[1, 2, '...', 7, 8]`), disables Previous/Next controls at boundaries, and routes user navigation by replacing the `page` URL search parameter without scrolling the list back to the top. Displays accurate clamped "Showing X to Y of Z results" text. Hidden if total results fit on a single page.

### Inline Error State

File: `app/find-jobs/page.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`                                                          |
| Border           | `border border-border`                                                |
| Border radius    | `rounded-xl`                                                          |
| Text — primary   | `text-text-primary` (heading), `font-semibold`, `text-base`, `leading-6` |
| Text — secondary | `text-text-secondary` (body), `font-medium`, `text-sm`, `leading-5`   |
| Spacing          | `p-8`, heading-to-body `mt-2`, body cap `max-w-md`                    |
| Hover state      | none                                                                  |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | none                                                                  |

**Pattern notes:**
Inline error states replace the content area (table, list, etc.) when a fetch or query fails. The card is centered horizontally and vertically with `flex flex-col items-center justify-center text-center`. The heading uses the standard `text-base font-semibold` card-heading pattern and the body uses `text-sm font-medium` with `max-w-md` to cap line length for readability. No icon or CTA is included — just a heading and one line of guidance copy. This pattern should be reused for any inline error, empty, or unavailable state that displaces a data region.
