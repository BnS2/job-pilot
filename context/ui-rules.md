# UI Rules

Concise rules for building JobPilot UI. Design assets are available — use them as the source of truth for visual decisions. These rules cover the most important patterns and constraints to keep the UI consistent without over-specifying every detail.

---

## Font

Always import Inter via `next/font/google` in the root layout.

```typescript
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
```

The `--font-sans` variable is already declared in `@theme` in globals.css. Apply the font variable class to the `<html>` tag in root layout. Never use system fonts as the primary font.

---

## Layout

- Page max-width: 1440px, centered
- Main content area padding: 32px on all sides
- Gap between page sections: 24px
- Header height: 64px, full width, white background, padding 0 24px
- All pages use top navbar only — no sidebar, no drawer

---

## Navbar

Three nav items: Dashboard, Find Jobs, Profile.

- Active item: `color: #7C5CFC`, font-weight 500, 14px
- Inactive item: `color: #4A5565`, font-weight 500, 14px
- No underline — active state is color change only
- Navbar always white background, full viewport width

---

## Cards

Every content section lives in a card.

```
background: #FFFFFF
border: 1px solid #E7EAF3
border-radius: 16px
padding: 24px
box-shadow: 0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)
```

Never use colored card backgrounds — always white. Color goes inside cards via badges, bars, and text, never on the card surface itself.

---

## Typography Hierarchy

Three levels used consistently throughout:

**Section headings** — card titles, page section titles

```
font-size: 16px
font-weight: 600
color: #101828
line-height: 24px
```

**Body / primary content text**

```
font-size: 14px
font-weight: 500
color: #101828
line-height: 20px
```

**Secondary / muted text** — labels, timestamps, subtitles

```
font-size: 12px
font-weight: 400
color: #99A1AF
line-height: 16px
```

Stat numbers on dashboard use 30px / weight 600 / color #101828.

---

## Badges

All badges use `border-radius: 9999px` (pill shape) unless specified otherwise.

```
padding: 2px 8px
font-size: 12px
font-weight: 500
```

Trend badges on stat cards use `border-radius: 4px` (not pill) with `#ECFDF5` background and `#009966` text.

### Badge Color Rules

- **Success/green** (`bg-success-lightest text-success-foreground`): matched skills, active status, match scores
- **Accent/purple** (`bg-accent-muted text-accent`): research icon wells, accent indicators
- **Info/blue** (`bg-info-lightest text-info-foreground`): applied status
- **Neutral/gray** (`bg-surface-secondary text-text-secondary`): unavailable, archived status
- **Error/red** (`bg-error/10 text-error`): gap/missing skills, rejected status
- **Complete** (`bg-success-light text-success-dark`): completed status

Never mix accent tokens (purple) with error tokens (red) in the same badge. A rejected badge must use error tokens only. Accent/purple is reserved for interactive elements, primary actions, and neutral gap-state indicators — never for failure or terminal-negative states.

---

## Buttons

**Primary button:**

```
background: #7C5CFC
color: #FFFFFF
border-radius: 8px
padding: 8px 16px
font-size: 14px
font-weight: 500
```

**Secondary button:**

```
background: #FFFFFF
border: 1px solid #E7EAF3
color: #101828
border-radius: 8px
padding: 8px 16px
```

---

## Form Inputs

```
background: #FFFFFF
border: 1px solid #E7EAF3
border-radius: 8px
padding: 8px 12px
font-size: 14px
color: #101828
placeholder color: #99A1AF
focus: ring-1 ring-accent border-accent
```

---

## Table (Jobs List)

- No alternating row colors — white rows only, separated by border
- Row border: `1px solid #E7EAF3` between rows
- Column headers: uppercase, 12px, font-weight 500, color `#6A7282`
- Row text: 14px, color `#101828`
- Hover state: `background: #F9FAFB`

---

## Match Score Bar

Inline progress bar shown next to the percentage number.

```
height: 4px
border-radius: 9999px
background track: #E7EAF3
```

Fill color by score:

- 85-100%: `bg-success` (green)
- 70-84%: `bg-info-medium` (blue)
- Below 70%: `bg-warning` (orange)

Use `MATCH_THRESHOLD` and `MATCH_STRONG_THRESHOLD` from `lib/utils.ts`; do not hardcode threshold values in components or queries.

---

## Empty States

Every section that can be empty must have an empty state. Keep it minimal:

- Short descriptive text in `color: #99A1AF`
- Optional icon above text
- CTA button if there's a logical next action

---

## Tailwind v4 Note

This project uses Tailwind v4. Tokens are defined with `@theme` in globals.css — no `tailwind.config.ts` needed. Never define colors in a config file. Always use `@theme` for new tokens.

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-purple-500`, `text-gray-600`) — use project tokens only
- Never define colors in `tailwind.config.ts` — use `@theme` in globals.css
- Never add gradients to card backgrounds
- Never use more than one font weight in a single UI element
- Never show raw error messages to users — always show human readable text
- Never stack more than 2 levels of border radius inside each other
- Never use `position: fixed` for UI elements — use normal flow layout

---

## Toast Notifications

Toast notifications appear in the bottom-right corner for ambient awareness. They are additive — never remove existing inline status cards, banners, or feedback text when adding a toast.

**When to use a toast:**

- Background job searches complete or fail (find-jobs)
- Company research completes or fails (job details)
- Job status transitions succeed or fail (job details)
- Resume upload, extraction, generation, or deletion completes or fails (profile)

**When NOT to use a toast:**

- Form validation errors (inline label text is better)
- Auth flow errors (inline in the login card is better)
- Errors that need a persistent call-to-action (banners are better)

**Implementation:**

Toasts are powered by `sonner` with a thin wrapper at `lib/toast.tsx`. Always use the `toast` helper — never call sonner directly:

```typescript
import { toast } from "@/lib/toast";

toast.success("Jobs found.");
toast.error("Something went wrong.");
toast.info("Background search in progress.");
```

The `Toaster` component lives in root layout at `position="bottom-right"` with `visibleToasts={3}`.
All toast helpers render the same compact rich notification shell: token icon, primary message typography, tonal background, 4px inset tone stripe, and responsive 360px max width.
