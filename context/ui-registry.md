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

### Protected Page Shell

File: `app/dashboard/page.tsx`, `app/find-jobs/page.tsx`, `app/profile/page.tsx`
Last updated: 2026-06-14

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-background` on the page root                                      |
| Border           | none                                                                  |
| Border radius    | none                                                                  |
| Text — primary   | page sections define their own typography                             |
| Text — secondary | page sections define their own typography                             |
| Spacing          | `mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8` |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | none                                                                  |

**Pattern notes:**
Protected top-level pages use the same wide app shell so Dashboard, Find Jobs, and Profile share consistent page padding and vertical rhythm. Profile content uses the full protected page width instead of a narrow inner form column so cards align with the wider app surfaces. Use `Navbar` with `fullWidth` on these pages so the nav inner row shares the same centered `max-w-[1440px] px-4 sm:px-6 lg:px-8` app shell instead of stretching controls to the viewport edges.

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
| Spacing          | `h-16`, default shell `max-w-[1110px] px-4 sm:px-6`, app shell `max-w-[1440px] px-4 sm:px-6 lg:px-8`, `gap-8`, `gap-2`, `py-5`, icon `h-4 w-4` |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | `bg-overlay text-accent-foreground` for CTA, `text-accent` for active link |

**Pattern notes:**
The top nav can render with either a centered `max-w-[1110px]` marketing/auth inner row or a centered `max-w-[1440px]` authenticated app shell when `fullWidth` is true. The app shell intentionally does not stretch controls to the viewport edges; it aligns with protected page padding so navigation stays reachable and visually connected to the working area. Logo uses the public `logo.png` asset and loads eagerly because it can be the above-the-fold LCP image. Current implementation supports hiding the CTA for authenticated app pages. Nav links use small token-colored line icons and the active state is color-only, matching `ui-rules.md`. Active nav links expose `aria-current="page"` for assistive technology. Protected app nav links disable Next.js prefetch so login/public pages do not background-render protected routes while auth state is uncertain.

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
Last updated: 2026-06-14

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-surface-secondary` for upload zone, uploaded row, preview toolbar, and preview canvas shell |
| Border           | `border border-border`, `border-dashed border-border-muted`, preview `border-b border-border` |
| Border radius    | `rounded-xl` for card, drop zone, and preview panel; `rounded-md` for buttons and canvas |
| Text — primary   | `text-text-primary`                                                   |
| Text — secondary | `text-text-secondary`                                                 |
| Spacing          | `p-6`, `p-5`, `mt-1`, `mt-4`, `mt-6`, `px-4 py-3`, `px-4 py-8`, `gap-2`, `gap-3`, `gap-4`, `pt-6`, action buttons `h-10 min-w-40 px-4`, upload icon well `h-14 w-14`, upload icon `h-8 w-8` |
| Hover state      | `hover:bg-surface-secondary`, `hover:bg-error/5`, `hover:bg-accent-dark` |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `text-accent` upload icon, `bg-accent text-accent-foreground` extraction CTA |

**Pattern notes:**
Resume upload uses client-side file upload flow via the InsForge browser SDK. Renders as a bordered drag-and-drop dropzone with file validation (PDF only, <= 5MB) when no resume is uploaded. Dropzone icon is a token-colored cloud outline with a separate upward arrow inside a circular white icon well; keep the glyph large enough that it does not collapse into an umbrella-like mark. Swaps to an uploaded-card styling when a resume exists, displaying the filename link, a secondary Preview/Hide Preview toggle, and a token error-outline Delete button. The inline preview uses `ResumePreview`, which defaults to fetching `/api/profile/resume` with same-origin credentials and renders page 1 to a canvas with PDF.js (`pdfjs-dist/webpack.mjs`) instead of relying on the browser's native PDF iframe viewer. `ResumePreview` also accepts explicit `fileUrl`, `openHref`, and `title` props so job-scoped PDFs can reuse the same private canvas preview treatment. This avoids blank previews and forced downloads when the user's browser is configured to download PDFs. The preview panel is wrapped in `rounded-xl border border-border bg-surface shadow-sm` with a neutral toolbar, loading/error states, page-count helper text, and an "Open full size" link. The preview is open by default for active resumes and after new uploads, but can be collapsed without losing the uploaded resume. Upload persists the returned storage `url` and `key`; failed metadata writes remove the just-uploaded object before surfacing the error. The visible filename and full-size link open `/api/profile/resume` so private storage objects are downloaded through an authenticated app route rather than a direct object URL. Delete clears both profile references only after storage deletion succeeds. Generate Resume and Extract from Resume start Inngest background jobs and poll `/api/resume/runs` every 2.5s with an in-flight request guard, using inline token status banners plus bottom-right rich toasts for started/completed/failed states. Start-action failures toast the same human-readable server message shown inline, including session and configuration errors. Extraction remains draft-only: completed fields populate the profile form for review and require Save Profile before persistence. Generation completion updates the active resume metadata and refreshes `/profile`. The generation action is always available as a bordered secondary button and uses saved profile data. The extraction action appears only in the uploaded state and uses the accent primary button pattern. On wide Profile layouts this component lives in the right rail, so the uploaded-file row and footer actions stack vertically at `xl` to avoid cramped horizontal controls.

### Profile Client

File: `components/profile/ProfileClient.tsx`
Last updated: 2026-06-14

| Property         | Class |
| ---------------- | ----- |
| Background       | none  |
| Border           | none  |
| Border radius    | none  |
| Text — primary   | none  |
| Text — secondary | none  |
| Spacing          | `grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]`, right rail `flex flex-col gap-6` |
| Hover state      | none  |
| Shadow           | none  |
| Accent usage     | none  |

**Pattern notes:**
Profile Client owns the Profile page content layout and draft state. At `xl` widths, it renders `ProfileForm` as the main column and a right rail containing `CompletionIndicator` plus `ResumeUpload`; below `xl`, the rail appears above the form. It owns draft profile state so resume extraction can populate the form without saving to InsForge, and derives completion percentage, complete state, and missing-field tags from the current draft so the indicator updates before a full page refresh.

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
Last updated: 2026-06-14

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
| Accent usage     | `bg-accent text-accent-foreground`, `bg-accent-muted text-accent`, `bg-success-lightest text-success-foreground`, shared score meter thresholds |

**Pattern notes:**
Job Details is now composed from route-level data plus focused `components/job-details` presentation sections. Cards preserve the supplied design pattern: white surface, token border, 16px radius, 24px card padding, and small token-colored icon wells. Listing metadata renders as one `Listing details` card with a compact two-column details grid instead of four separate stat cards; values wrap with `break-words` so salary, location, job type, and date found stay readable without cramped truncation. Metadata labels use complete wording when space allows, such as `Salary Estimated` instead of `Salary Est.`. The lifecycle controls intentionally remain visible near Apply Now as Feature 12 integration; availability auto-refresh is invisible and calls the API route rather than importing agent logic into the page. JobHeader keeps the score badge but now adds the shared MatchScoreMeter below the header metadata so the score is readable against low/good/strong thresholds. JobDetailsEditor follows the same card shell and provides the correction surface for imported listings. CompanyResearchCard is a client component only for the trigger/polling behavior; it keeps the same section shell, uses a primary accent CTA for idle/retry states, a muted disabled treatment while running, border-top dividers for dossier sections, success-lightest skill tags for tech stack, and small accent source links with `break-all`. TailoredResumeCard follows the same section shell and sits after company research so the role/company context is visible before generation.

### Job Header Edit Button

File: `components/job-details/JobHeader.tsx`
Last updated: 2026-06-15

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`                                                          |
| Border           | `border border-border`                                                |
| Border radius    | `rounded-md`                                                          |
| Text — primary   | `text-text-primary`                                                   |
| Text — secondary | none                                                                  |
| Spacing          | `h-10 px-4 gap-2`, icon `h-4 w-4`                                    |
| Hover state      | `hover:bg-surface-secondary`                                          |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | none                                                                  |

**Pattern notes:**
The edit button uses the standard secondary button pattern (border, white background, primary text, rounded-md, shadow-sm) with the standard hover state. It appears in the top-right of the JobHeader card when `onEditClick` is provided. The pencil icon follows the same `h-4 w-4` size as other button icons (logout, status dropdown). This replaces the previous standalone `JobDetailsEditor` read-mode card.

### Job Header With Edit

File: `components/job-details/JobHeaderWithEdit.tsx`
Last updated: 2026-06-15

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | none (delegates to children)                                          |
| Border           | none (delegates to children)                                          |
| Border radius    | none (delegates to children)                                          |
| Text — primary   | inherited from child components                                       |
| Text — secondary | inherited from child components                                       |
| Spacing          | none                                                                  |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | none                                                                  |

**Pattern notes:**
Orchestrator component managing `isEditing` state. In read mode, renders `JobHeader` (with pencil icon) + `JobInfoGrid`. In edit mode, replaces both with `JobDetailsEditor`. The transition is a direct card swap — no animation, no layout shift. This replaces the previous separate `JobHeader` + `JobInfoGrid` + `JobDetailsEditor` composition on the page.

### Job Details Editor

File: `components/job-details/JobDetailsEditor.tsx`
Last updated: 2026-06-15

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-error/10` inline error                              |
| Border           | `border border-border`, error `border-error/20`                       |
| Border radius    | `rounded-xl` card, `rounded-md` inputs/buttons/error                  |
| Text — primary   | `text-text-primary`, primary button `text-accent-foreground`          |
| Text — secondary | `text-text-secondary`, labels `text-text-dark`, error `text-error`    |
| Spacing          | `p-6`, header `flex flex-wrap items-center justify-between gap-3`, form `mt-6 grid gap-4 sm:grid-cols-2`, fields `mt-2 h-11 px-3`, textareas `min-h-28/32/36 px-4 py-3`, actions `gap-2` |
| Hover state      | `hover:bg-surface-secondary`, `hover:bg-accent-dark`                  |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `bg-accent text-accent-foreground`, focus `focus:border-accent focus:ring-1 focus:ring-accent` |

**Pattern notes:**
JobDetailsEditor is now a form-only component controlled by `isOpen` and `onCancel` props. When `isOpen` is false, it returns null. When open, it replaces the header and info grid cards. The read-mode card with "Edit details" button has been removed — that responsibility now lives in `JobHeader` via the pencil icon button and `JobHeaderWithEdit` orchestrator. The form edits title, company, location, salary, job type, apply/source URLs, job description, responsibilities, requirements, nice-to-have items, benefits, and company context. Multi-line list fields are newline-separated textareas so imported arrays can round-trip without custom chips. Saves call `updateJobDetails`, toast success/failure, refresh the route, and clear generated company research plus tailored resume metadata whenever title/company/role/company context changes.

### Tailored Resume Card

File: `components/job-details/TailoredResumeCard.tsx`
Last updated: 2026-06-15

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-surface-secondary`, icon wells `bg-accent-muted` / `bg-surface-secondary` |
| Border           | `border border-border`, header `border-b border-border`, notes divider `border-t border-border` |
| Border radius    | `rounded-xl` card/preview shell, `rounded-md` buttons, `rounded-full` icon wells |
| Text — primary   | `text-text-primary`, primary CTA `text-accent-foreground`             |
| Text — secondary | `text-text-muted`, failure copy `text-error`                          |
| Spacing          | `p-6`, generated row `p-5`, empty state `px-6 py-12`, `gap-3`, `gap-4`, `gap-5`, `mt-1`, `mt-2`, `mt-3`, `mt-4`, `mt-5`, `mt-6`, progress grid `max-w-[480px] sm:grid-cols-4` |
| Hover state      | `hover:bg-accent-dark`, `hover:border-text-secondary hover:bg-surface-secondary` |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `bg-accent text-accent-foreground` for first generation/open PDF, `bg-accent-muted text-accent` icon well and active progress bars |

**Pattern notes:**
TailoredResumeCard is the job-scoped application-materials surface. Empty and failed states show centered minimal copy and the header action button. Running state keeps the card in place, disables the header action, and shows four token progress stages: Load, Match, Write, Render. The card has a separate local starting state before server-confirmed `running` so the UI does not flicker between idle/completed and running while the start request and first poll race each other. Completed state shows a private `tailored-resume.pdf` row with an Open PDF link to `/api/resume/tailored/[jobId]`, concise tailoring notes split into Emphasized and Gap Framing columns, and the shared `ResumePreview` canvas renderer pointed at the same authenticated route. The Regenerate header action uses the standard secondary Job Details button pattern with border, hover border, medium text, and refresh icon. The card starts work through `/api/resume/tailor`, polls the same route with `jobId`, and uses rich bottom-right toasts for completed/failed status. It never links directly to InsForge Storage object URLs.

### Profile Page Shell

File: `app/profile/page.tsx`, `components/profile/ProfileClient.tsx`
Last updated: 2026-06-14

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-background`                                                       |
| Border           | none on page shell                                                    |
| Border radius    | none on page shell                                                    |
| Text — primary   | inherited from child components                                       |
| Text — secondary | inherited from child components                                       |
| Spacing          | page shell `max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8`, content grid `grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]` |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | delegated to child components                                         |

**Pattern notes:**
The profile page shell is a protected server-rendered app page that composes Navbar and ProfileClient. ProfileClient lays out the editable ProfileForm as the main column and places CompletionIndicator plus ResumeUpload in a right rail at `xl` widths. On smaller screens, the status/resume rail appears above the form. This keeps the page aligned to the full protected app canvas while preventing resume/status controls and form sections from feeling stretched across the whole viewport. The page fetches profile data from the InsForge DB, computes completion metrics dynamically, and passes properties down.

### Dashboard Page

File: `app/dashboard/page.tsx`, `components/dashboard/*`
Last updated: 2026-06-15

| Property         | Class                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Background       | page `bg-background`, cards `bg-surface`                                                  |
| Border           | `border border-border`, recent activity header `border-b border-border`, incomplete banner `border-warning/20` |
| Border radius    | `rounded-xl` for cards, `rounded-sm` for stat trend badges, `rounded-full` for activity dots |
| Text — primary   | `text-text-primary`, stat numbers `text-3xl font-semibold leading-9`                      |
| Text — secondary | `text-text-secondary`, `text-text-muted` for helper text, chart axes, and timestamps       |
| Spacing          | page `max-w-[1440px] gap-6 px-4 py-8 sm:px-6 lg:px-8`, dashboard body `grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.75fr)]`, cards `p-6`, stat grid `gap-6`, chart title-to-canvas `mt-5`, chart canvases `h-[260px]` / `h-[250px]`, activity list `px-6 py-7 space-y-8` |
| Hover state      | none                                                                                      |
| Shadow           | `shadow-sm`                                                                               |
| Accent usage     | activity dots `bg-accent-light before:bg-accent`, charts `stroke-accent`, `fill-info`, `fill-success`, incomplete CTA `bg-accent text-accent-foreground` |

**Pattern notes:**
Feature 15 replaces the temporary dashboard checkpoint with the full mock dashboard from `context/designs/dashboard.png`. Feature 16 wires the stat cards to real InsForge jobs data while keeping the route as a protected Server Component. Feature 17 wires Recent Activity to real completed agent runs plus job research/lifecycle timestamps, with the same timeline dot treatment and a minimal empty state. Feature 18 wires the SVG charts to DB-first InsForge data: completed job discovery runs for jobs-found trend, saved `jobs.match_score` for distribution, and `jobs.company_researched_at` for research activity. Empty chart states now mean the DB has no relevant rows or values. The dashboard now reads profile completeness for the banner, job rows for stats/activity/charts, and separate agent-run queries for recent activity vs job-discovery chart data while PostHog remains event capture only. The dashboard body uses independent wide-screen columns: primary Jobs Found trend and Recent Activity in the left column, compact Company Research and Match Distribution cards in the right column. Dashboard charts are Client Components with hover and keyboard-focus tooltips using token-styled `bg-surface`, `border-border`, `text-text-*`, and `shadow-sm` treatment. Chart tooltip wrappers keep overflow visible and flip tooltips below top-edge values so active labels are not clipped. Chart headers include compact token summary pills so each card is informative before interaction. Chart cards use compact internal spacing: `mt-5` between heading and plot, with 260px trend/distribution plots and a 250px research plot to avoid large unused card areas. Dashboard cards use the same white surface, token border, 16px radius, 24px padding, and shadow treatment as the rest of the app.

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
| Spacing          | `min-h-screen`, `max-w-[1440px]`, `gap-6`, `px-4 py-8 sm:px-6 lg:px-8` |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | delegated to child components                                         |

**Pattern notes:**
The Find Jobs page is a protected Server Component that verifies the current InsForge user and composes the app navbar, search controls, filter toolbar, and jobs table. Feature 09 uses static mock rows only; real search, filtering, sorting, pagination, and jobs DB reads are deferred to Features 10 and 11. Query-string inputs are normalized before hitting the InsForge/PostgREST query builder, stable secondary ordering is applied before pagination, and out-of-range page numbers redirect back to the nearest valid page. Feature 12 defaults the list to `status=active` while allowing explicit status views through the filter toolbar. Background searches do not scope or clear the visible list while they are running; completed runs refresh the current list. Repeated `run` URL params are validated as UUIDs, hydrated from current-user completed `agent_runs`, and only hydrated run IDs are passed to the jobs query. Invalid, missing, non-completed, or unauthorized runs do not render chips and do not scope the table; valid selected runs filter with `run_id IN (...)`. Database failures render a token-styled error card instead of the empty jobs table.

### Find Jobs Search Controls

File: `components/find-jobs/SearchControls.tsx`
Last updated: 2026-06-15

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-success-lightest` success banner, `bg-info-lightest` empty-result banner, `bg-error/10` error banner |
| Border           | `border border-border`, `border border-success/20` success banner, `border border-info/20` empty-result banner, `border border-error/20` error banner |
| Border radius    | `rounded-xl` for card, `rounded-md` for inputs/button/banner          |
| Text — primary   | `text-text-primary`, `text-text-dark`, `text-success-foreground`, `text-info-foreground`, `text-error` |
| Text — secondary | `text-text-muted`, `placeholder:text-text-muted`                      |
| Spacing          | `p-6`, search grid `grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto]`, URL row `mt-5 grid gap-4 border-t border-border pt-5 lg:grid-cols-[1fr_auto]`, inputs `h-12 px-4`, button `h-12 px-6`, banner `mt-5 px-4 py-4 gap-3` |
| Hover state      | `hover:bg-accent-dark` for primary CTA/add action, `hover:bg-surface-secondary` for secondary notice buttons |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `bg-accent text-accent-foreground`, `text-success` success icon, `text-info` empty icon, `text-error` error icon |

**Pattern notes:**
Search controls match the supplied `find-jobs.png` card: uppercase compact labels, large rounded inputs, search icon in the job title input, and conditional status banners below the controls. Feature 10 converts this to a Client Component with controlled inputs, submit loading state, `POST /api/agent/find` wiring, a token-green success banner from the API response, a token-blue empty-result banner for zero Adzuna results, and a token-red human-readable error banner. Background search runs use per-term status rows below the controls while the existing results remain visible; optional locations are displayed as quoted values to match quoted search terms. Run rows persist in browser storage for the `/find-jobs` experience so active searches can resume polling when the user returns. Completed rows use green only when strong matches exist; weak/no-match completions stay blue and can be dismissed with a compact icon button. Completed rows are history/status rows, not active filter indicators: they expose `View results` to replace selected `run` params and dismiss that notice. Clicking the notice text toggles the run into/out of the active URL filter set (appends on add, removes on toggle-off); when a run is in the active filters, its notice gains a `border-l-2 border-l-accent` left-border indicator. Plain dismissal hides the notice and also removes the run from active filters if it was selected through the URL. Background run-status polling must never call the logout route or clear cookies; transient auth/backend failures keep the run active and retry. Best Match is a Find Jobs enhancement beside Find Jobs, styled as `bg-surface border border-border text-text-primary rounded-md` with a sparkle icon. Best Match skips the manual job title and derives search queries from the user's saved profile. Feature 19 adds a separate Job URL row with link icon, `type="url"` input, Import URL button, `/api/agent/import-url` polling, and provider-aware copy such as `Importing job from JobStreet`. URL import notices refresh results after completion but do not become search-run filters. Completed URL import notices show `Imported {title} at {company} from {provider}` when metadata is available and expose `View job` to open the saved Job Details page. Blocked automated URL imports can expose a `Paste text` retry action that prefills the failed URL and opens a `Job Text` textarea. The fallback textarea uses `mt-2 min-h-40 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium leading-5 text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent`; the URL row keeps `mt-5 grid gap-4 border-t border-border pt-5 lg:grid-cols-[1fr_auto] lg:items-end`, and the Paste Text / Import Text buttons use the existing secondary URL-import button treatment.

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
The toolbar handles filtering the retrieved jobs list through URL parameters backed by the server DB query. Converted to Client Component. It features a text filter input that stores local draft text until Enter adds a normalized `q` chip, avoiding typing-step history churn. Selected completed-search filters render as compact chips below the company/role search input, using server-hydrated `agent_runs` metadata rather than localStorage notices; each chip removes its own repeated `run` param and resets pagination, with a compact `Clear search filters` action when two or more chips are active. Custom openable dropdown menus use React state plus document-level outside-click handling to select Status (Active, Applied, Unavailable, Archived, Rejected, Completed, All), Match Filters (All, High, Low), and Sort Orders (Score, Newest, Oldest), updating query parameters and resetting pagination without fixed-position backdrops or raw color classes. Query updates preserve repeated `run` params so completed-search filters compose with status, match, text search, sort, and pagination resets.

### Find Jobs Table

File: `components/find-jobs/JobsTable.tsx`
Last updated: 2026-06-15

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, `bg-surface-secondary` for header/icon wells            |
| Border           | `border border-border`, row `border-b border-border`                  |
| Border radius    | `rounded-xl` table shell, `rounded-md` icon wells, `rounded-full` badges/bars |
| Text — primary   | `text-text-primary`, `text-text-dark`                                 |
| Text — secondary | `text-text-secondary`                                                 |
| Spacing          | `overflow-hidden`, table `min-w-[1280px]`, header `px-6/8 py-5`, rows `px-6/8 py-6`, icon wells `h-10 w-10`, score meter compact `w-40`, `gap-3` |
| Hover state      | `hover:bg-surface-secondary` row hover, `hover:text-accent` for links |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | shared score meter thresholds; source badges `bg-info-lightest text-info-foreground` and `bg-surface-secondary text-text-secondary`; status badges use shared lifecycle token classes |

**Pattern notes:**
Renders real jobs queried from the database. Column parameters map `job.company` and `job.title` (as role), with user-safe fallback labels for nullable or drifted rows. Match score now uses the shared `MatchScoreMeter` so the compact table indicator shows a neutral track, actual percentage fill, `MATCH_THRESHOLD` / `MATCH_STRONG_THRESHOLD` ticks, the current score marker, and one short tone label (`Low`, `Good`, or `Strong`). The compact row must not repeat the threshold guide text because the percentage and ticks already carry that comparison. Salary falls back to "Not specified". Source badges read provider identity from `jobs.source_provider` before falling back to broad `jobs.source`; search rows display `Adzuna`, while URL imports display host-derived labels such as `JobStreet`, `LinkedIn`, `Indeed`, or `URL`. Status uses shared lifecycle labels/classes from `lib/utils.ts`. Date Found uses a client/server-safe relative date formatter. Supports a status-aware full empty state row when search/filtering yields zero records.

### Match Score Meter

File: `components/MatchScoreMeter.tsx`
Last updated: 2026-06-14

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | neutral track `bg-border-light`, tick marks `bg-surface`              |
| Border           | marker `border border-surface`                                        |
| Border radius    | `rounded-full`                                                        |
| Text — primary   | `text-success-foreground`, `text-info-foreground`, `text-text-secondary` for score label |
| Text — secondary | none                                                                  |
| Spacing          | compact `w-40`, full `w-full`, wrapper `h-4` / `h-5`, track `h-2` / `h-3`, helper `mt-1` |
| Hover state      | none                                                                  |
| Shadow           | `shadow-sm` on the score marker                                       |
| Accent usage     | fill `bg-warning` under `MATCH_THRESHOLD`, `bg-info-medium` from `MATCH_THRESHOLD` to one below `MATCH_STRONG_THRESHOLD`, `bg-success` from `MATCH_STRONG_THRESHOLD` to 100 |

**Pattern notes:**
Shared visual meter for job match percentages. It clamps incoming scores to 0-100, exposes a keyboard-focusable `role="progressbar"` with ARIA values, keeps the track neutral so color only represents the actual filled score, shows subtle ticks at `MATCH_THRESHOLD` and `MATCH_STRONG_THRESHOLD`, and places a colored marker at the score position using `clamp()` so 0% and 100% remain visible instead of clipping. `getMatchScoreTone()` also supplies semantic badge colors: low scores use neutral styling, good scores use info, and strong scores use success. Both `size="compact"` and `size="full"` show only the short tone label (`Low`, `Good`, `Strong`) below the meter; do not repeat threshold legend copy beside the meter.

Find Jobs search controls start a background Inngest run instead of blocking until Adzuna/Gemini finish. Each submitted term gets its own status row that names the search term and optional quoted location. Active rows show initializing/searching/scoring copy, completed rows summarize discovered jobs, saved jobs, and strong matches, and failed rows show a retryable error. Terminal rows stay visible until the user dismisses them with the icon button. Do not scope or clear the existing table while a run is processing, and do not disable the form after a run is enqueued; users can start more searches while earlier runs continue.

### Job Details Page

File: `app/find-jobs/[id]/page.tsx`
Last updated: 2026-06-15

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-background`, `bg-surface`, icon wells `bg-surface-secondary`, token-tinted badge/icon wells |
| Border           | `border border-border`, company research header `border-b border-border` |
| Border radius    | `rounded-xl` cards/icon well, `rounded-md` buttons, `rounded-full` badges/icon wells |
| Text — primary   | `text-text-primary`, `text-text-dark`                                 |
| Text — secondary | `text-text-secondary`, `text-text-muted`, action feedback `text-success-foreground` / `text-error` |
| Spacing          | page `max-w-[840px] gap-6 px-4 py-10 sm:px-6`, top row `flex flex-wrap items-center justify-between gap-3`, cards `p-6`, listing details `mt-5 grid gap-5 sm:grid-cols-2`, empty state `px-6 py-12`, action feedback `gap-2` |
| Hover state      | action buttons `hover:bg-surface-secondary hover:border-text-secondary` |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | `bg-accent text-accent-foreground` for Research/Apply CTAs, `bg-success-lightest text-success-foreground` match and skill badges, `bg-accent-muted text-error` rejected status badge, `bg-accent-muted text-accent` gap skills only |

**Pattern notes:**
The job details route follows `context/designs/job-details.png`: centered protected page, a wrapping top toolbar row with `BackToJobsLink` (left) and `JobStatusToolbar` (right, containing View Job Post, `StatusDropdown`, and conditional `AvailabilityIndicator`), summary card with company icon and a colored left-border accent strip per status, one readable Listing details card, AI match reasoning card, skills comparison card, job description card, company research card, tailored resume card, and status-aware Apply CTA at the bottom. Lifecycle status is shown as a compact pill beside the match score. `StatusDropdown` renders a direct primary button with refresh icon when only one transition exists (e.g. rejected → Restore Active); multi-option statuses keep the dropdown. Action feedback uses inline token-styled success/error text that auto-dismisses after 3 seconds; do not use browser alerts for this workflow.

Company research progress now stays inside the card instead of refreshing the whole route. The empty state uses the existing icon well, primary heading, muted support copy, and token progress bars for four stages: Discover, Read, Synthesize, Finalize. Active stages use `bg-accent text-accent`; inactive stages use `bg-border-light text-text-muted`. Status polling reads `/api/agent/research?jobId=...` and only updates the card state. Repeated polling failures are surfaced as a retryable card failure with a rich status toast instead of leaving the running state silently stuck.

### Status Dropdown

File: `components/job-details/StatusDropdown.tsx`
Last updated: 2026-06-14

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface` button, `bg-surface` menu, option hover `bg-surface-secondary` |
| Border           | `border border-border` button and menu                                |
| Border radius    | `rounded-md` button and menu                                          |
| Text — primary   | `text-text-primary`                                                   |
| Text — secondary | `text-text-muted` (pending state) |
| Spacing          | `h-10`, gap-1.5, `px-4`, menu `py-1`, options `px-4 py-2`, icon `h-3.5 w-3.5` |
| Hover state      | `hover:bg-surface-secondary hover:border-text-secondary` button, `hover:bg-surface-secondary` menu items |
| Shadow           | `shadow-lg` on dropdown menu                                          |
| Accent usage     | none (secondary button pattern)                                       |

**Pattern notes:**
Multi-transition statuses (active, applied, unavailable) show the current status name as the button label with a caret (e.g., "Active ▾") instead of the first available action. Single-transition statuses (archived, rejected, completed) render a direct primary button with the action label and a refresh icon. Dropdown items list the available transitions with action labels (e.g., "Mark Applied", "Archive"). Clicking opens an absolutely-positioned dropdown menu listing all available transitions. Menu closes on outside click and on action selection. Uses `useTransition` for server-action feedback. All status-change feedback is delivered via `toast.statusChange()` rich toasts — each carries a colored icon (green check / amber warning / red X), descriptive title ("Marked as Applied"), and the job's company—title subtitle. Duration is slow (6s success, 7s info, 5s error) for visibility. StatusDropdown only updates lifecycle state and toasts; AvailabilityIndicator owns listing freshness checks after restore-active transitions and while active/unavailable jobs are shown in the toolbar.

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

### Job Header Summary

File: `components/job-details/JobHeader.tsx`
Last updated: 2026-06-14

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`, company icon well `bg-surface-secondary`                |
| Border           | `border border-border`, status accent strip from `getJobStatusAccentClass()` |
| Border radius    | `rounded-xl` card and icon well, `rounded-full` badges                |
| Text — primary   | `text-text-primary`                                                   |
| Text — secondary | `text-text-muted`                                                     |
| Spacing          | card `p-6 sm:p-8`, content `flex items-start gap-5`, metadata `mt-2 flex flex-wrap gap-x-3 gap-y-2`, meter `mt-6 max-w-md` |
| Hover state      | none                                                                  |
| Shadow           | `shadow-sm`                                                           |
| Accent usage     | status accent strip only; score/status pills use semantic token helpers |

**Pattern notes:**
The header summary is a single content flow, not a two-column action layout. Keep external actions in `JobStatusToolbar` so long job titles have room to wrap. Job titles should not use `truncate`; use `max-w-3xl text-2xl sm:text-3xl leading-9 sm:leading-10` so the title can breathe while preserving the compact card hierarchy. Company, score badge, and status badge wrap together beneath the title.

### Status Accent Card Border

File: `components/job-details/JobHeader.tsx`
Helper: `lib/utils.ts` → `getJobStatusAccentClass()`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface` (unchanged from card token)                              |
| Border (default) | `border border-border`                                                |
| Border (applied) | `border-l-4 border-l-info`                                            |
| Border (unavail) | `border-l-4 border-l-warning`                                         |
| Border (archived)| `border-l-4 border-l-text-muted`                                      |
| Border (rejected)| `border-l-4 border-l-error`                                          |
| Border (completed)| `border-l-4 border-l-success`                                        |
| Border radius    | `rounded-xl`                                                          |
| Shadow           | `shadow-sm`                                                           |

**Pattern notes:**
Non-active job cards display a 4px left border accent (colored strip) alongside the standard card border. Active status returns an empty string (no accent). The accent class is appended to the card's `className` via `getJobStatusAccentClass(status)`. This gives an immediate visual cue that the job is in a terminal or paused state before the user even reads the status badge. Border override classes use project color tokens only.

### Single-Action Primary Button (Restore)

File: `components/job-details/StatusDropdown.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-accent`                                                           |
| Text             | `text-accent-foreground`                                              |
| Border radius    | `rounded-md`                                                          |
| Padding          | `px-4`, `h-10`                                                        |
| Font             | `text-sm font-medium leading-5`                                       |
| Hover state      | `hover:bg-accent-dark`                                                |
| Disabled state   | `disabled:cursor-not-allowed disabled:opacity-50`                     |
| Icon             | Refresh/undo SVG (16×16), `gap-1.5` from text                         |

**Pattern notes:**
When `STATUS_TRANSITIONS[status]` has exactly one entry (archived, rejected, completed → "Restore Active"), the component skips the dropdown and renders a direct primary button. The button includes a refresh icon, takes one click instead of two, and uses the project's primary button tokens. Multi-transition statuses (active, applied, unavailable) keep the existing secondary dropdown with chevron.

### Job Status Toolbar

File: `components/job-details/JobStatusToolbar.tsx`
Last updated: 2026-06-14

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Layout           | `flex flex-wrap items-center justify-end gap-3`                       |
| Background       | transparent (in a `flex justify-between` row with `BackToJobsLink`)   |
| View job post    | `inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold leading-5 text-text-primary transition-colors hover:border-text-secondary hover:bg-surface-secondary` |
| Accent usage     | inherited from child `StatusDropdown` and `AvailabilityIndicator`    |

**Pattern notes:**
A thin client wrapper that reads `status` from `JobStatusProvider` context and renders the external View Job Post link, `StatusDropdown`, and conditional `AvailabilityIndicator` (only for `active`/`unavailable`). Used in the top toolbar row of the Job Details page alongside `BackToJobsLink`. This keeps status actions and the external listing CTA at eye level while keeping the header card focused on job identity and match context.

### Availability Indicator

File: `components/job-details/AvailabilityIndicator.tsx`
Last updated: 2026-06-14

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface` button                                                   |
| Border           | `border border-border` button, tooltip `border border-border`         |
| Border radius    | `rounded-md` button, `rounded-xl` tooltip card                        |
| Text — primary   | `text-text-primary` (tooltip heading)                                  |
| Text — secondary | `text-text-secondary` (company-title row), `text-success-foreground` / `text-warning` / `text-error` (status descriptions) |
| Text — muted     | `text-text-muted` (checked-time label)                                 |
| Text — size      | tooltip heading `text-sm font-semibold leading-5`, details `text-xs leading-4` |
| Spacing          | button `h-10 w-10`, tooltip shell `w-72 pt-2`, tooltip card `p-4`, `gap-3` |
| Hover state      | `hover:-translate-y-px hover:bg-surface-secondary hover:shadow-md` button |
| Focus / active   | `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`, `active:translate-y-0 active:shadow-sm` |
| Shadow           | `shadow-sm` button, `shadow-lg` on tooltip                            |
| Icon             | 20×20 inline SVGs (check-circle green, warning-triangle amber, x-circle red, spinner accent-animated, dot muted) |

**Pattern notes:**
Replaces the former `CheckAvailabilityButton` text button + toast pattern. Renders as a compact 40×40 icon button in the job details toolbar. Auto-checks listing availability quietly on mount (`force: false`, respects 2-hour server cooldown, 15-second client-side timeout): only the indicator icon changes to spinner/status, and the tooltip does not auto-open. The mount check is scheduled with a zero-delay callback, but the "already checked" ref is only set inside the callback so React Strict Mode cannot cancel the first check while leaving the component marked as checked. Click triggers a forced re-check (`force: true`). The button keeps the lightweight status-dot/status-icon UI and signals clickability through pointer affordance, lift/shadow hover, keyboard focus ring, and active press state rather than a secondary icon or instruction label. Hover or keyboard focus reveals the rich tooltip (400ms show delay, 240ms hide delay) with `aria-describedby`/`role="tooltip"` linkage, status heading ("Listing is active" / "Listing is unavailable" / "Check failed"), company and title on separate lines, contextual description, and relative "Checked X ago" timestamp. Tooltip spacing is part of the hoverable shell (`pt-2`) so crossing from the trigger into the card does not flicker. The tooltip should explain status only; do not add a boxed "click to recheck" note because it competes with the content and makes the compact control feel heavy. The title line uses `break-words` and wraps instead of truncating long job titles. Tooltip uses project token colors — green checkmark for active, amber warning for unavailable, red X for errors, muted dot for idle, accent-animated spinner for in-flight checks. Watches `status` from `JobStatusProvider` context via a separate effect to sync after external changes (e.g. StatusDropdown restore-active flow) without duplicate concurrent checks. Five icon states: idle (gray dot), checking (spinning arc), active (green check circle), unavailable (amber warning triangle), error (red X circle).

### Job Details Apply CTA

File: `components/job-details/JobActions.tsx`
Last updated: 2026-06-13

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-accent` (active), `bg-surface` (applied/unavailable/no-link)      |
| Border           | `border border-border` (non-active states only)                        |
| Border radius    | `rounded-md`                                                          |
| Text — primary   | `text-accent-foreground` (active), `text-text-muted` (non-active)     |
| Text — size      | `text-sm font-semibold leading-5`                                     |
| Spacing          | `h-12 px-6`                                                           |
| Hover state      | none (active is a Link, non-active are static divs)                   |
| Shadow           | none                                                                  |
| Accent usage     | `bg-accent text-accent-foreground` for the "Apply Now" primary link   |

**Pattern notes:**
The apply CTA is status-aware via `getApplyCta()`:
- `active` → full primary button link "Apply Now at {company}" (`bg-accent`)
- `applied` → muted "Already Applied" static div (`bg-surface text-text-muted`)
- `unavailable` → muted "Position Unavailable" static div
- `archived` / `rejected` / `completed` → hidden entirely (`null`)
- No apply URL → "Apply link unavailable" static div (unchanged)

Non-active states use the secondary button shape (same `h-12 px-6 rounded-md`) but muted styling so the eye moves naturally to the status toolbar above.

### Toast Notifications

File: `lib/toast.tsx`, `app/layout.tsx`
Last updated: 2026-06-14

| Property         | Class / Config                                                                    |
| ---------------- | --------------------------------------------------------------------------------- |
| Library          | `sonner`                                                                          |
| Position         | `bottom-right`                                                                    |
| Max visible      | `3`                                                                               |
| Gap              | `8px`                                                                             |
| Offset           | `24px` desktop, `16px` mobile                                                     |
| Wrapper          | `<Toaster>` in `app/layout.tsx`                                                  |
| Helper           | `lib/toast.tsx` — exports `toast.success()`, `toast.error()`, `toast.info()`, `toast.statusChange()` |
| Background       | success `var(--color-success-lightest)`, error `color-mix(in srgb, var(--color-error) 12%, var(--color-surface))`, info `var(--color-info-lightest)`, neutral `var(--color-surface)`, warning `color-mix(in srgb, var(--color-warning) 10%, var(--color-surface))` |
| Border           | success `var(--color-success)`, error `var(--color-error)`, info `var(--color-info)`, neutral `var(--color-border)`, warning `var(--color-warning)` |
| Text — primary   | `text-text-primary` for all toast titles/messages                                 |
| Text — secondary | `text-text-secondary` for `statusChange` subtitles                                |
| Border radius    | `border-radius: 8px`                                                              |
| Padding          | `12px 16px`                                                                       |
| Width            | `max-width: 360px`, `width: min(360px, calc(100vw - 32px))`                       |
| Font             | `font-size: 14px`, `font-weight: 500`, `font-family: var(--font-sans)`            |
| Shadow           | `0px 8px 24px color-mix(in srgb, var(--color-overlay) 14%, transparent)` plus a 4px inset tone stripe |
| Icon             | `h-5 w-5` token-colored inline SVG status icon for every toast                    |
| Duration         | success/info `3500ms`, error `5000ms`; statusChange success `6000ms`, info `7000ms`, error `5000ms` |

**Pattern notes:**
Toasts are purely additive — existing inline status cards, banners, and feedback text stay in place. The `lib/toast.tsx` wrapper centralizes project token styling so no component calls sonner directly. All toasts inherit the root `bottom-right` position from `app/layout.tsx`; individual toast helpers must not override placement. `toast.success()`, `toast.error()`, and `toast.info()` render compact rich JSX toasts with a token-colored icon, one primary message line that can wrap, and the same inset tone stripe used by status changes. `toast.statusChange()` uses the same shell plus an optional truncated subtitle. Icons: green check circle (generic success, applied/completed, company research ready), blue info circle (generic info), gray archive box with down arrow (archived), red slashed circle (rejected), blue refresh arrows (restored to active), amber warning triangle (restored — unavailable), red X circle (generic/status error). `CompanyResearchCard` fires `toast.statusChange()` after the 2-second finalize delay, using title `Company research ready`, the company name as subtitle, and the slower completed/status duration so it matches job lifecycle toast presence. `SearchControls` fires on run completion/failure. `StatusDropdown` uses `toast.statusChange()` for all transitions with the job's company—title subtitle. `ResumeUpload` fires alongside its existing inline messages. Listing availability feedback uses `AvailabilityIndicator` tooltip.

### Badge & Chip Patterns

File: `lib/utils.ts`, `components/job-details/*`
Last updated: 2026-06-14

All badges use the shared chip shape: `rounded-full px-3 py-1 text-xs font-medium leading-4`.

| Variant        | Background             | Text                      | Where used                                |
| -------------- | ---------------------- | ------------------------- | ----------------------------------------- |
| Success / match | `bg-success-lightest` | `text-success-foreground` | matched skills, active status, match score |
| Accent         | `bg-accent-muted`     | `text-accent`             | research icon well                         |
| Error / gap    | `bg-error/10`         | `text-error`              | missing skills, rejected status            |
| Info / applied | `bg-info-lightest`    | `text-info-foreground`    | applied status                            |
| Neutral        | `bg-surface-secondary`| `text-text-secondary`     | unavailable, archived status              |
| Complete       | `bg-success-light`    | `text-success-dark`       | completed status                          |

Icon wells (circles used in card headers as decorative icons) use `rounded-full` with:
- `bg-success-lightest text-success` — positive/match sections
- `bg-accent-muted text-accent` — accent sections
- `bg-surface-secondary text-text-muted` — neutral/description sections

**Pattern notes:**
Never use accent/purple tokens for negative or error states. Missing (gap) skills and rejected status use error tokens (`bg-error/10 text-error`). Accent/purple is reserved for interactive elements, primary actions, and decorative icon wells — never for failure or terminal-negative states. Skill chips (matched = success, missing = error) and status badges follow the shared `rounded-full` pill shape with consistent `px-3 py-1 text-xs font-medium` sizing. Match score badge in JobHeader is a slight exception: it uses `text-sm font-semibold` for visual prominence but keeps the same pill shape and success color tokens.
