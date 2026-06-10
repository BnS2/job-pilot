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
Last updated: 2026-06-09

| Property         | Class                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Background       | `bg-surface`                                                          |
| Border           | `border-b border-border`                                              |
| Border radius    | `rounded-md` for the CTA button                                       |
| Text — primary   | `text-text-dark` for nav links                                        |
| Text — secondary | none                                                                  |
| Spacing          | `h-16`, `px-4 sm:px-6`, `gap-8`                                       |
| Hover state      | none                                                                  |
| Shadow           | none                                                                  |
| Accent usage     | `bg-overlay text-accent-foreground` for the Start for free CTA        |

**Pattern notes:**
The top nav is full width with a centered `max-w-[1110px]` inner row. Logo uses the public `logo.png` asset. Primary nav links stay simple text with no underline.

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
