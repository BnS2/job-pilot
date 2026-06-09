# Memory — Auth Build Session

Last updated: 2026-06-10 02:18 PST

## What was built

Completed Feature 02 — Auth.

Created or added:
- `app/(auth)/login/page.tsx` with a simplified split-card OAuth UI.
- `app/(auth)/callback/page.tsx` for the OAuth callback route.
- `components/auth/AuthCallback.tsx` for browser-side callback completion.
- `components/auth/OAuthButtons.tsx` for Google and GitHub OAuth sign-in.
- `components/auth/ProviderIcon.tsx` for token-colored provider icons.
- `components/auth/LogoutButton.tsx` for testing logout from the protected checkpoint.
- `app/api/auth/oauth/callback/route.ts` for server-side OAuth code exchange.
- `app/api/auth/refresh/route.ts` for InsForge session refresh.
- `app/api/auth/logout/route.ts` for clearing app-domain auth cookies.
- `lib/insforge-client.ts`, `lib/insforge-server.ts`, and `lib/env.ts`.
- `proxy.ts` to protect `/dashboard`, `/profile`, and `/find-jobs`.
- Temporary protected `app/dashboard/page.tsx` checkpoint with logout so auth can be tested before the full Phase 5 dashboard.

Modified:
- `.env.schema` documents `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY`.
- `package.json` scripts run through Varlock.
- `app/layout.tsx` has hydration warning suppression to avoid browser-extension attribute mismatch noise.
- `context/code-standards.md`, `context/library-docs.md`, `context/progress-tracker.md`, and `context/ui-registry.md` were updated for Varlock, InsForge auth, `.env` consistency, and auth UI patterns.

## Decisions made

- JobPilot uses `.env` as the consistent local values file for Varlock. Do not add project variables to `.env.local`.
- The InsForge anon key is required by the app but should not be committed or written to memory. It can be generated/fetched through InsForge MCP/backend tooling.
- The app uses `@insforge/sdk/ssr` with separate browser and server clients.
- Next.js 16 `proxy.ts` is used for protected-route checks instead of deprecated middleware.
- OAuth callback completion is handled by a client callback component that posts the provider code/verifier to an app API route, allowing app-domain cookies to be set reliably.
- The auth page should stay simple: one large split card, minimal context on the left, provider actions on the right, no extra preview card or checklist.
- The `/dashboard` page currently remains a small protected auth checkpoint only, not the full dashboard feature.

## Problems solved

- Resolved the auth refresh/callback 401 flow by moving OAuth code exchange into `/api/auth/oauth/callback` and setting server-managed cookies.
- Avoided reading or relying on `.env.local`; all local env work should use `.env`.
- Confirmed InsForge v2.2.0 UI may only expose project URL/API key, while the anon key is retrieved through MCP/backend tooling.
- The login UI was corrected after feedback: removed the old second preview/info card and restored a context-matching simple split-card design.
- Verified Google and GitHub OAuth buttons render with visible icons.
- Review found and fixed three auth hardening issues:
  - `AuthCallback` now catches callback completion errors so users do not stay stuck on the loading card.
  - `proxy.ts` now redirects protected routes whenever `updateSession` does not produce an access token.
  - The OAuth callback API route now returns `400` for malformed JSON and narrows request bodies from `unknown`.
- `npm run build` requires network access for `next/font/google` to fetch Inter; with network approval, the build passes.

## Current state

- Feature 02 Auth is marked complete in `context/progress-tracker.md`.
- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- `npm run build` passes when Google Fonts network access is allowed.
- Browser verification passed at `http://localhost:3004/login`: the auth UI renders as a single split card, both provider buttons have SVG icons, desktop layout has two columns, and mobile layout stacks with no horizontal overflow.
- `context/ui-registry.md` includes entries for Login Page, OAuth Buttons, Provider Icon, Auth Callback, Logout Button, and Dashboard Auth Checkpoint. The Auth Callback note now reflects server-managed cookie setup through the app API route.
- A preview server was started on `http://localhost:3004` during verification.
- The repository has a dirty working tree with auth, homepage, context, package, memory, and skill-related changes. Do not revert unrelated changes.

## Next session starts with

Start Feature 03 — PostHog Initialization.

Before implementation:
1. Read `AGENTS.md` and the required context files in order.
2. Read the relevant Next.js 16 docs before changing app layout, providers, or route behavior.
3. Add PostHog environment variables to `.env.schema` first, then wire the app code.
4. Follow `context/build-plan.md`: create `lib/posthog-client.ts`, `lib/posthog-server.ts`, initialize the provider in the root app layout, identify after successful login, and reset on logout.

## Open questions

- OAuth provider configuration should still be validated manually in the InsForge dashboard/provider settings if login fails in a real browser flow.
- Decide where the PostHog identify call should live after auth success: callback route/client completion, dashboard load, or a small auth-aware provider.
