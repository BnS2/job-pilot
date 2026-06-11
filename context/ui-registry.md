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
The top nav can render with either a centered `max-w-[1110px]` inner row or a full-width app layout. Logo uses the public `logo.png` asset. Current implementation supports hiding the CTA for authenticated app pages. Nav links use small token-colored line icons and the active state is color-only, matching `ui-rules.md`. Active nav links expose `aria-current="page"` for assistive technology.

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
Last updated: 2026-06-10

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
The login page uses the existing navbar/footer shell with one large split card. The left side provides minimal context with a soft token-based background, badge, headline, support copy, and routing note; the right side contains only the JobPilot welcome copy, human-readable OAuth error, and provider buttons.

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
Last updated: 2026-06-10

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
The page now also sends the `dashboard_checkpoint_viewed` PostHog event server-side after confirming the authenticated user; this does not change the visual pattern.
